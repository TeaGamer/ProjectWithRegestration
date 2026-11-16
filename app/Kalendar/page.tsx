"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import Profile from "../components/Profile";
import type { User } from "../constants/profileConfig";
import { useProfileModal } from "../hooks/useProfileModal";
import { useVoiceChat } from "../hooks/useVoiceChat";
import { sendChatMessage } from "../services/chatService";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  getDeletedCalendarEvents,
  importLocalCalendarNotes,
  parseEventFromText,
  restoreCalendarEvent,
  updateCalendarEvent,
  type CalendarEvent,
} from "../services/calendarService";
import {
  CATEGORY_OPTIONS,
  createCalendarCells,
  formatDateForInput,
  getCategoryClass,
  getMinimumTimeForToday,
  MAX_UPLOAD_COUNT,
  MAX_UPLOAD_FILE_SIZE,
  MAX_UPLOAD_TOTAL_SIZE,
  sortNotesByDateTime,
  SUPPORTED_FILE_EXTENSIONS,
  WEEKDAYS,
  type Note,
} from "./calendarUtils";
import "../css/Dashboard.css";
import "../css/Kalendar.css";

type ChatMessage = {
  id: number;
  sender: "user" | "ai";
  text: string;
};

function eventToNote(event: CalendarEvent): Note {
  const startTime = new Date(
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(event.start_time) ? event.start_time : `${event.start_time}Z`
  );
  return {
    id: event.id,
    text: event.title,
    date: formatDateForInput(startTime),
    time: event.is_all_day
      ? ""
      : `${String(startTime.getHours()).padStart(2, "0")}:${String(startTime.getMinutes()).padStart(2, "0")}`,
    category: event.category,
  };
}

function noteToEvent(note: Note) {
  const start = new Date(`${note.date}T${note.time || "00:00"}:00`);
  const end = new Date(start);
  if (note.time) {
    end.setHours(end.getHours() + 1);
  } else {
    end.setDate(end.getDate() + 1);
  }
  return {
    title: note.text.trim(),
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    category: note.category,
    is_all_day: !note.time,
  };
}

export default function KalendarPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarStorage, setCalendarStorage] = useState<"loading" | "local" | "backend">("loading");
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [notes, setNotes] = useState<Note[]>([]);
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
  const [showDeletedNotes, setShowDeletedNotes] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [deleteSource, setDeleteSource] = useState<"manual" | "ai">("manual");

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [usedFiles, setUsedFiles] = useState<File[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isVoiceHelpOpen, setIsVoiceHelpOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const voiceChat = useVoiceChat({
    onTranscript: (transcript) => {
      setChatInput((current) => `${current}${current.trim() ? " " : ""}${transcript}`);
    },
  });

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteDate, setNoteDate] = useState("");
  const [noteTime, setNoteTime] = useState("");
  const [noteFormError, setNoteFormError] = useState("");
  const [noteCategory, setNoteCategory] = useState(CATEGORY_OPTIONS[0]);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [smsRemindersSent, setSmsRemindersSent] = useState<number[]>([]);

  const profileModal = useProfileModal();
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const readLocalNotes = (): Note[] => {
      try {
        const savedNotes: unknown = JSON.parse(localStorage.getItem("calendarNotes") || "[]");
        return Array.isArray(savedNotes) ? savedNotes as Note[] : [];
      } catch {
        return [];
      }
    };

    const initializeCalendar = async () => {
      let savedUser: User | null = null;
      try {
        const userStr = localStorage.getItem("user");
        savedUser = userStr ? JSON.parse(userStr) as User : null;
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
      if (cancelled) return;
      setUser(savedUser);

      const token = localStorage.getItem("token");
      if (token) {
        try {
          const migrationOwner = localStorage.getItem("calendarNotesMigratedToUserId");
          if (!migrationOwner && savedUser?.id) {
            await importLocalCalendarNotes(
              readLocalNotes(),
              token,
              new Date().getTimezoneOffset(),
              Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
            );
            localStorage.setItem("calendarNotesMigratedToUserId", String(savedUser.id));
          }
          const [events, deletedEvents] = await Promise.all([
            getCalendarEvents(token),
            getDeletedCalendarEvents(token),
          ]);
          if (!cancelled) {
            setNotes(sortNotesByDateTime(events.map(eventToNote)));
            setDeletedNotes(sortNotesByDateTime(deletedEvents.map(eventToNote)));
            setCalendarStorage("backend");
          }
        } catch (error) {
          if (!cancelled) {
            setCalendarStorage("backend");
            setCalendarError(error instanceof Error ? error.message : "Could not load calendar data.");
          }
        }
      } else {
        if (!cancelled) {
          setNotes(readLocalNotes());
          setCalendarStorage("local");
        }
      }
      if (!cancelled) setLoading(false);
    };

    void initializeCalendar();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDashboardOpen) {
        setIsDashboardOpen(false);
      }
      if (e.key === "Escape" && isNoteModalOpen) {
        setIsNoteModalOpen(false);
        setSelectedNoteId(null);
      }
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [isDashboardOpen, isNoteModalOpen]);

  useEffect(() => {
    if (calendarStorage === "local") {
      localStorage.setItem("calendarNotes", JSON.stringify(notes));
    }
  }, [calendarStorage, notes]);

  const sendSmsReminder = useCallback((note: Note) => {
    const reminderText = `Reminder: meeting "${note.text}" starts at ${note.time} on ${note.date}.`;
    console.log("SMS reminder sent:", reminderText);
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        sender: "ai",
        text: `SMS reminder sent: ${reminderText}`,
      },
    ]);
  }, []);

  const checkMeetingReminders = useCallback(() => {
    const now = new Date();
    notes.forEach((note) => {
      if (!["Meeting", "Зустрічі"].includes(note.category) || !note.time || !note.date) return;

      const reminderDate = new Date(`${note.date}T${note.time}`);
      const diffMs = reminderDate.getTime() - now.getTime();

      if (diffMs > 0 && diffMs <= 60 * 60 * 1000 && !smsRemindersSent.includes(note.id)) {
        sendSmsReminder(note);
        setSmsRemindersSent((prev) => [...prev, note.id]);
      }
    });
  }, [notes, sendSmsReminder, smsRemindersSent]);

  useEffect(() => {
    checkMeetingReminders();
    const interval = window.setInterval(checkMeetingReminders, 60 * 1000);
    return () => window.clearInterval(interval);
  }, [checkMeetingReminders]);

  const sortedNotes = useMemo(() => sortNotesByDateTime(notes), [notes]);

  const filteredNotes = useMemo(() => {
    return selectedCategories.length === 0
      ? sortedNotes
      : sortedNotes.filter((note) => selectedCategories.includes(note.category));
  }, [selectedCategories, sortedNotes]);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    let totalSize = attachedFiles.reduce((size, file) => size + file.size, 0);
    let remainingCount = MAX_UPLOAD_COUNT - attachedFiles.length;
    const acceptedFiles: File[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!SUPPORTED_FILE_EXTENSIONS.has(extension)) {
        errors.push(`${file.name}: unsupported file type.`);
        continue;
      }
      if (file.size > MAX_UPLOAD_FILE_SIZE) {
        errors.push(`${file.name}: exceeds the 10 MB per-file limit.`);
        continue;
      }
      if (remainingCount <= 0) {
        errors.push(`You can attach up to ${MAX_UPLOAD_COUNT} files.`);
        continue;
      }
      if (totalSize + file.size > MAX_UPLOAD_TOTAL_SIZE) {
        errors.push("The total attachment size cannot exceed 20 MB.");
        continue;
      }

      acceptedFiles.push(file);
      totalSize += file.size;
      remainingCount -= 1;
    }

    if (acceptedFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...acceptedFiles]);
    }
    setChatError(errors.length > 0 ? errors.join(" ") : null);
    event.target.value = "";
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const openFile = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const removeUsedFile = (index: number) => {
    setUsedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSendChatMessage = async (messageText = chatInput) => {
    const trimmed = messageText.trim();
    const filesToSend = attachedFiles.slice();
    const userText = trimmed || (filesToSend.length > 0 ? "Please review attached file(s)" : "");
    if (!userText) return;

    const userId = Date.now();
    setChatMessages((prev) => [...prev, { id: userId, sender: "user", text: userText }]);
    setChatLoading(true);
    setChatError(null);

    try {
      const token = localStorage.getItem("token") || "";
      const response = await sendChatMessage(trimmed, token, filesToSend);
      setChatMessages((prev) => [
        ...prev,
        {id: userId + 1, sender: "ai", text: response.ai_response ?? "No response from AI."},
      ]);
      let spokenResponse = response.ai_response ?? "No response from AI.";

      if (filesToSend.length > 0) {
        setUsedFiles((prev) => [...prev, ...filesToSend]);
        setAttachedFiles((prev) => prev.filter((file) => !filesToSend.includes(file)));
      }
      setChatInput("");

      if (trimmed && token) {
        try {
          const action = await parseEventFromText(
            trimmed,
            token,
            new Date().getTimezoneOffset(),
            Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
          );
          if (action.event && (action.action === "created" || action.action === "updated")) {
            const updatedNote = eventToNote(action.event);
            spokenResponse = `${action.action === "created" ? "Event added" : "Event updated"}: ${updatedNote.text}.`;
            setNotes((previous) => sortNotesByDateTime(
              action.action === "created"
                ? [...previous, updatedNote]
                : previous.map((note) => note.id === updatedNote.id ? updatedNote : note)
            ));
            setChatMessages((previous) => [
              ...previous,
              {
                id: Date.now() + 2,
                sender: "ai",
                text: `${action.action === "created" ? "✅ Event added" : "✅ Event updated"}: "${updatedNote.text}" on ${updatedNote.date}${updatedNote.time ? ` at ${updatedNote.time}` : ""}.`,
              },
            ]);
          } else if (action.action === "delete_confirmation" && action.event) {
            const target = eventToNote(action.event);
            spokenResponse = `Should I delete ${target.text}? Please confirm in the dialog.`;
            setNoteToDelete(target);
            setDeleteSource("ai");
            setChatMessages((previous) => [
              ...previous,
              { id: Date.now() + 2, sender: "ai", text: spokenResponse },
            ]);
          } else if (action.reason) {
            spokenResponse = action.reason;
            setChatMessages((previous) => [
              ...previous,
              { id: Date.now() + 2, sender: "ai", text: spokenResponse },
            ]);
          }
        } catch (error) {
          const actionError = error instanceof Error ? error.message : "Could not process the calendar request.";
          spokenResponse = `Calendar action failed: ${actionError}`;
          setChatError(actionError);
          setChatMessages((previous) => [
            ...previous,
            { id: Date.now() + 2, sender: "ai", text: `Calendar action failed: ${actionError}` },
          ]);
        }
      }
      if (response.ai_response) voiceChat.speak(spokenResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error sending message";
      setChatError(message);
      setChatMessages((prev) => [
        ...prev, { id: userId + 2, sender: "ai", text: `Error: ${message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const closeChat = () => {
    voiceChat.closeVoiceChat();
    setIsChatOpen(false);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [chatMessages]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("en-US", { month: "long" });
  const calendarCells = createCalendarCells(year, month);

  const normalizeMonth = (offset: number) => {
    const actual = month + offset;
    return ((actual % 12) + 12) % 12;
  };

  const noteMatchesCell = (note: Note, day: number, offset: number) => {
    const noteDateObj = new Date(note.date);
    return noteDateObj.getDate() === day && noteDateObj.getMonth() === normalizeMonth(offset);
  };

  const cellNotes = (day: number, offset: number) => {
    return filteredNotes
      .filter((note) => noteMatchesCell(note, day, offset))
      .sort((a, b) => (a.time || "23:59").localeCompare(b.time || "23:59"));
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await fetch("/api/demo-login", { method: "DELETE" });
    } catch (error) {
      console.error("Failed to clear the demo admin session:", error);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = "/Login";
  };

  const openModal = () => {
    setNoteCategory(CATEGORY_OPTIONS[0]);
    setNoteText("");
    setNoteDate(formatDateForInput(new Date()));
    setNoteTime("");
    setNoteFormError("");
    setSelectedNoteId(null);
    setIsNoteModalOpen(true);
  };

  const openEditNote = () => {
    if (selectedNote) {
      setNoteCategory(selectedNote.category);
      setNoteDate(selectedNote.date);
      setNoteTime(selectedNote.time);
      setNoteText(selectedNote.text);
      setNoteFormError("");
      setIsNoteModalOpen(true);
    } else {
      openModal();
    }
  };

  const closeModal = () => {
    setIsNoteModalOpen(false);
    setSelectedNoteId(null);
    setNoteText("");
    setNoteDate("");
    setNoteTime("");
    setNoteFormError("");
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !noteDate) {
      setNoteFormError("Enter a note and choose a date.");
      return;
    }

    const now = new Date();
    const today = formatDateForInput(now);
    if (noteDate < today) {
      setNoteFormError("You cannot choose a date in the past.");
      return;
    }
    if (noteDate === today && noteTime && noteTime < getMinimumTimeForToday(now)) {
      setNoteFormError("For today, choose a time that has not passed.");
      return;
    }

    setNoteFormError("");
    const newNote: Note = {
      id: selectedNote ? selectedNote.id : Date.now(),
      text: noteText,
      date: noteDate,
      time: noteTime,
      category: noteCategory,
    };

    setIsSavingNote(true);
    try {
      if (calendarStorage === "backend") {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Your backend session has expired. Sign in again.");
        const payload = noteToEvent(newNote);
        const savedEvent = selectedNote
          ? await updateCalendarEvent(selectedNote.id, payload, token)
          : await createCalendarEvent(payload, token);
        const savedNote = eventToNote(savedEvent);
        setNotes((previous) => sortNotesByDateTime(
          selectedNote
            ? previous.map((item) => item.id === selectedNote.id ? savedNote : item)
            : [...previous, savedNote]
        ));
      } else {
        setNotes((prev) => sortNotesByDateTime(
          selectedNote
            ? prev.map((item) => item.id === selectedNote.id ? newNote : item)
            : [...prev, newNote]
        ));
      }
      setCalendarError(null);
      closeModal();
    } catch (error) {
      setNoteFormError(error instanceof Error ? error.message : "Could not save this note.");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNoteId(note.id);
  };

  const handleDeleteSelectedNote = () => {
    if (!selectedNote) return;
    if (calendarStorage === "backend") {
      setDeleteSource("manual");
      setNoteToDelete(selectedNote);
      return;
    }
    setNotes((prev) => prev.filter((item) => item.id !== selectedNote.id));
    setSelectedNoteId(null);
  };

  const cancelDelete = () => {
    if (deleteSource === "ai") {
      setChatMessages((previous) => [
        ...previous,
        { id: Date.now(), sender: "ai", text: "Deletion cancelled. The event is unchanged." },
      ]);
    }
    setNoteToDelete(null);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    if (calendarStorage !== "backend") {
      setNotes((previous) => previous.filter((note) => note.id !== noteToDelete.id));
      setSelectedNoteId(null);
      setNoteToDelete(null);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Your backend session has expired. Sign in again.");
      const deleted = await deleteCalendarEvent(noteToDelete.id, token);
      setNotes((previous) => previous.filter((note) => note.id !== noteToDelete.id));
      setDeletedNotes((previous) => sortNotesByDateTime([...previous, eventToNote(deleted)]));
      setSelectedNoteId(null);
      setNoteToDelete(null);
      setCalendarError(null);
      if (deleteSource === "ai") {
        setChatMessages((previous) => [
          ...previous,
          { id: Date.now(), sender: "ai", text: `"${noteToDelete.text}" was deleted. It can be restored for 12 hours.` },
        ]);
      }
    } catch (error) {
      setCalendarError(error instanceof Error ? error.message : "Could not delete this event.");
    }
  };

  const restoreDeletedNote = async (note: Note) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Your backend session has expired. Sign in again.");
      const restored = await restoreCalendarEvent(note.id, token);
      setNotes((previous) => sortNotesByDateTime([...previous, eventToNote(restored)]));
      setDeletedNotes((previous) => previous.filter((item) => item.id !== note.id));
      setCalendarError(null);
    } catch (error) {
      setCalendarError(error instanceof Error ? error.message : "Could not restore this event.");
    }
  };

  const changeMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  if (loading) {
    return <div className = "dashboard-container"><p> Loading... </p></div>;
  }

  const currentUser: User = user ?? {
    id: 0,
    login: "Guest",
    email: "",
    first_name: "Guest",
    last_name: "",
  };

  return (
    <div className = "dashboard-layout-calendar">
      {/* Верхня панель з логотипом і користувачем */}
      <div className = "topbar-cal">
        <div className = "logo-section">
          <Image src="/IMG_1074.png" alt="AI Alex Avatar" width={42} height={42} className="avatar-img" />
          Calendar with Alex
        </div>
        <button className = "user-bubble-nav" onClick = {() => setIsDashboardOpen(true)}>
          <div className = "avatar-icon" > {currentUser.login.charAt(0).toUpperCase()}</div>
          <span>{currentUser.login}</span>
        </button>
      </div>

      {/* Панель дій */}
      <div className = "controls-row">
        <button type = "button" className = "ctrl-btn add-note-btn" onClick = {openModal}> 📝 Add Note </button>
        <button type = "button" className = "ctrl-btn edit-note-btn" onClick = {openEditNote}> ✏️ Edit Note </button>
        <button type = "button" className = "ctrl-btn delete-note-btn" onClick = {handleDeleteSelectedNote} disabled={!selectedNote}> 🗑️ Delete Note </button>
        {calendarStorage === "backend" && (
          <button
            type = "button"
            className = "ctrl-btn deleted-notes-toggle"
            onClick = {() => setShowDeletedNotes((visible) => !visible)}
            aria-expanded = {showDeletedNotes}
          >
            {showDeletedNotes ? "Hide deleted" : `Recently deleted (${deletedNotes.length})`}
          </button>
        )}
      </div>
      {calendarError && <p className = "calendar-error" role = "alert">{calendarError}</p>}
      {showDeletedNotes && calendarStorage === "backend" && (
        <section className = "deleted-notes-panel" aria-label = "Recently deleted events">
          <div>
            <strong>Recently deleted</strong>
            <p>Events can be restored for 12 hours after deletion.</p>
          </div>
          {deletedNotes.length ? deletedNotes.map((note) => (
            <div className = "deleted-note-row" key = {note.id}>
              <span>{note.text} — {note.date}{note.time ? ` at ${note.time}` : ""}</span>
              <button type = "button" onClick = {() => restoreDeletedNote(note)}>Restore</button>
            </div>
          )) : <p>No events are currently available to restore.</p>}
        </section>
      )}

      <div className = "main-grid-cal">
        {/* Колонка фільтрів категорій */}
        <div className = "category-panel" role = "group" aria-labelledby = "category-filter-title">
          <div className = "kategories-header" id = "category-filter-title"> Categories </div>
          <p className = "category-filter-hint">Select multiple categories. All shows every note.</p>
          <button
            type = "button"
            className = {`side-cat-btn ${selectedCategories.length === 0 ? "selected" : ""}`}
            aria-pressed = {selectedCategories.length === 0}
            onClick = {() => setSelectedCategories([])}
          > All </button>
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key = {cat}
              type = "button"
              className = {`side-cat-btn ${selectedCategories.includes(cat) ? "selected" : ""}`}
              aria-pressed = {selectedCategories.includes(cat)}
              onClick = {() => setSelectedCategories((current) => {
                if (current.length === 0) return [cat];
                if (current.includes(cat)) {
                  return current.length === 1 ? current : current.filter((category) => category !== cat);
                }
                return [...current, cat];
              })}
            >
              {cat}
            </button>
          ))}
          <div className = "file-list-box">
            <div className = "file-list-title"> AI files used </div>
            {usedFiles.length > 0 ? (
              usedFiles.map((file, index) => (
                <div key = {`${file.name}-${index}`} className = "file-chip">
                  <button type = "button" onClick = {() => openFile(file)} style = {{ flex: 1, textAlign: 'left', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                    {file.name}
                  </button>
                  <button type = "button" onClick = {() => removeUsedFile(index)}> × </button>
                </div>
              ))
            ) : (
              <div className = "file-list-empty"> No used files yet </div>
            )}
          </div>
        </div>

        {/* Календар */}
        <div className = "calendar-block">
          <div className = "month-picker">
            <button type = "button" className = "month-arrow" aria-label = "Previous month" onClick = {() => changeMonth(-1)}>&lt;</button>
            <div className = "month-pill" aria-live = "polite">{monthName} {year}</div>
            <button type = "button" className = "month-arrow" aria-label = "Next month" onClick = {() => changeMonth(1)}>&gt;</button>
          </div>

          <div className = "days-grid">
            {WEEKDAYS.map((day) => (
              <div key = {day} className = "grid-head-cell">{day}</div>
            ))}
            {calendarCells.map((cell, index) => {
              const isCurrentMonth = cell.offset === 0;
              const isToday = isCurrentMonth && new Date().toDateString() === new Date(year, month, cell.day).toDateString();
              const notesInCell = cellNotes(cell.day, cell.offset);

              return (
                <div
                  key = {`cell-${index}-${cell.day}`}
                  className = {`grid-cell ${!isCurrentMonth ? "grid-cell-inactive" : ""} ${isToday ? "today-highlight" : ""}`}
                >
                  <div className = "cell-top-row">
                    <span className = "cell-day-number">{cell.day}</span>
                    {notesInCell.length > 0 && <span className = "note-marker">{notesInCell.length}</span>}
                  </div>
                  <div className = "cell-notes">
                    {notesInCell.slice(0, 2).map((note) => (
                      <div key = {note.id} className = {`cell-note-badge ${getCategoryClass(note.category)}`}>
                        {note.category}: {note.text}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Інформація про нотатки */}
        <div className = "your_notes">
          <span> Your notes </span>
          <div className = "circle purple"></div>
          <div style = {{ marginTop: "20px", color: "white" }}>
            <strong> Number of notes ({filteredNotes.length})</strong>
            {filteredNotes.map((note) => (
              <button
                key = {note.id}
                type = "button"
                onClick = {() => handleNoteClick(note)}
                style = {{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  marginTop: "10px",
                  padding: "10px",
                  borderRadius: "10px",
                  border: selectedNoteId === note.id ? "2px solid #fff" : "1px solid rgba(255,255,255,0.5)",
                  background: selectedNoteId === note.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {note.category}: {note.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ОНОВЛЕНЕ МОДАЛЬНЕ ВІКНО ДЛЯ НОТАТОК */}
      {isNoteModalOpen && (
        <div className = "modal-overlay" onClick = {closeModal}>
          <div
            className = "modal-content note-modal"
            role = "dialog"
            aria-modal = "true"
            aria-labelledby = "note-modal-title"
            onClick = {(e) => e.stopPropagation()}
          >
            <div className = "modal-header note-modal">
              <h2 id = "note-modal-title">{selectedNote ? "Edit Note" : "New Note"}</h2>
              <button type = "button" className = "modal-close note-modal" aria-label = "Close note dialog" onClick = {closeModal}> ✕ </button>
            </div>
            
            <div className = "modal-body">
              {/* Стрічка: Нотатка */}
              <div className = "modal-form-row">
                <label htmlFor = "note-text"> Note </label>
                <textarea
                  id = "note-text"
                  placeholder = "Note text..."
                  value = {noteText}
                  onChange = {(e) => setNoteText(e.target.value)}
                />
              </div>

              {/* Стрічка: Категорія події */}
              <div className = "modal-form-row">
                <label htmlFor = "note-category"> Category </label>
                <select
                  id = "note-category"
                  value = {noteCategory}
                  onChange = {(e) => setNoteCategory(e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key = {category} value = {category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Стрічка: Час */}
              <div className = "modal-form-row">
                <label htmlFor = "note-time"> Time </label>
                <input
                  id = "note-time"
                  type = "time"
                  value = {noteTime}
                  min = {noteDate === formatDateForInput(new Date()) ? getMinimumTimeForToday(new Date()) : undefined}
                  onChange = {(e) => {
                    setNoteTime(e.target.value);
                    setNoteFormError("");
                  }}
                />
              </div>

              <div className = "modal-form-row">
                <label htmlFor = "note-date"> Date </label>
                <input
                  id = "note-date"
                  type = "date"
                  value = {noteDate}
                  min = {formatDateForInput(new Date())}
                  onChange = {(e) => {
                    setNoteDate(e.target.value);
                    setNoteFormError("");
                  }}
                />
              </div>
              {noteFormError && <p className = "note-form-error" role = "alert">{noteFormError}</p>}
            </div>

            <div className = "modal-footer">
              <button type = "button" className = "modal-btn save-btn" onClick = {handleSaveNote} disabled = {isSavingNote}>
                {isSavingNote ? "Saving..." : "Save"}
              </button>
              <button type = "button" className = "modal-btn cancel-btn" onClick = {closeModal} disabled = {isSavingNote}> Cancel </button>
            </div>
          </div>
        </div>
      )}

      {noteToDelete && (
        <div className = "modal-overlay" onClick = {cancelDelete}>
          <div
            className = "modal-content note-modal"
            role = "dialog"
            aria-modal = "true"
            aria-labelledby = "delete-event-title"
            onClick = {(event) => event.stopPropagation()}
          >
            <div className = "modal-header note-modal">
              <h2 id = "delete-event-title">Confirm event deletion</h2>
            </div>
            <div className = "modal-body">
              <p>Delete “{noteToDelete.text}”? It will remain recoverable for 12 hours.</p>
              {calendarError && <p className = "note-form-error" role = "alert">{calendarError}</p>}
            </div>
            <div className = "modal-footer">
              <button type = "button" className = "modal-btn delete-confirm-btn" onClick = {confirmDelete}>
                Delete event
              </button>
              <button type = "button" className = "modal-btn cancel-btn" onClick = {cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Чат ШІ */}
      {isChatOpen && (
        <div className = "ai-chat-box">
          <div className = "chat-top">
            <span> Chat with your Alex </span>
            <div className = "chat-voice-controls">
              <label className = "voice-language-label" htmlFor = "voice-language">Speech language</label>
              <select
                id = "voice-language"
                className = "voice-language-select"
                value = {voiceChat.voiceLanguage}
                onChange = {(event) => voiceChat.setVoiceLanguage(event.target.value)}
                aria-label = "Voice language"
              >
                <option value = "uk-UA">Українська</option>
                <option value = "en-US">English</option>
                <option value = "pl-PL">Polski</option>
              </select>
              <button
                type = "button"
                className = {`voice-reply-btn ${voiceChat.voiceModeEnabled ? "active" : ""}`}
                onClick = {voiceChat.toggleSpokenReplies}
                aria-label = {voiceChat.voiceModeEnabled ? "Turn off spoken AI replies" : "Turn on spoken AI replies"}
                aria-pressed = {voiceChat.voiceModeEnabled}
                title = {voiceChat.voiceModeEnabled ? "Spoken AI replies on" : "Spoken AI replies off"}
              >
                {voiceChat.voiceModeEnabled ? "🔊" : "🔇"}
              </button>
              <button type = "button" className = "chat-close-btn" aria-label = "Close chat" onClick = {closeChat}>✕</button>
            </div>
          </div>
          <div className = "chat-mid">
            {attachedFiles.length > 0 && (
              <div className = "file-list-box" style = {{ marginBottom: '14px' }}>
                <div className = "file-list-title"> Files attached for this request </div>
                {attachedFiles.map((file, index) => (
                  <div key = {`${file.name}-${index}`} className = "file-chip">
                    <span>{file.name}</span>
                    <button type = "button" onClick = {() => removeAttachedFile(index)}> × </button>
                  </div>
                ))}
              </div>
            )}
            {chatMessages.length === 0 ? (
              <div className = "ai-text"> Welcome, {currentUser.first_name}! Ask something... </div>
            ) : ( chatMessages.map((message) => (
                <div key = {message.id} className = {`chat-message ${message.sender}`}>
                  <span className = "message-sender">{message.sender === "user" ? "You" : "Alex"}</span>
                  <p>{message.text}</p>
                </div>
              ))
            )}
            <div ref = {messagesEndRef} />
          </div>
          {chatError && (
            <div className = "file-list-box" style = {{ margin: '0 20px 10px', background: 'rgba(255, 0, 0, 0.1)', color: '#ffdddd', borderColor: 'rgba(255,0,0,0.25)' }}>
              {chatError}
            </div>
          )}
          <div className = "chat-bottom">
            <label htmlFor = "file-upload" className = "file-upload-button" title = "TXT, MD, CSV, JSON, PDF, DOCX — max 5 files, 10 MB each, 20 MB total"> 📎 </label>
            <input ref = {fileInputRef} id = "file-upload" type = "file" multiple accept = ".txt,.md,.csv,.json,.pdf,.docx" onChange = {handleFileInputChange} disabled = {chatLoading} hidden/>
            <input
              className = "ai-input"
              placeholder = "Ask something..."
              value = {chatInput}
              onChange = {(e) => setChatInput(e.target.value)}
              onKeyDown = {(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSendChatMessage();
                }
              }}
              disabled = {chatLoading}
            />
            <button
              type = "button"
              className = {`voice-input-btn ${voiceChat.isListening ? "recording" : ""}`}
              onClick = {voiceChat.toggleRecording}
              disabled = {chatLoading}
              aria-label = {voiceChat.isListening ? "Stop voice recording" : "Record a voice message"}
              aria-pressed = {voiceChat.isListening}
              title = {voiceChat.isListening ? "Stop recording" : "Record voice message"}
            >
              {voiceChat.isListening ? "⏹" : "🎙️"}
            </button>
            <button
              className = "send-message-btn"
              type = "button"
              onClick = {() => handleSendChatMessage()}
              disabled = {chatLoading || (!chatInput.trim() && attachedFiles.length === 0)}
              aria-label = "Send message"
              title = "Send"
            >
              {chatLoading ? '…' : '➤'}
            </button>
          </div>
        </div>
      )}

      {isVoiceHelpOpen && (
        <div className = "modal-overlay" onClick = {() => setIsVoiceHelpOpen(false)}>
          <div
            className = "voice-help-dialog"
            role = "dialog"
            aria-modal = "true"
            aria-labelledby = "voice-help-title"
            onClick = {(event) => event.stopPropagation()}
          >
            <h2 id = "voice-help-title">Voice input unavailable</h2>
            <p>{voiceChat.voiceHelpMessage}</p>
            <p className = "voice-help-note">
              Spoken replies do not normally need a separate speaker permission. Check your device volume and audio output if you cannot hear Alex. You can always type and read messages instead.
            </p>
            <button type = "button" className = "modal-btn save-btn" onClick = {() => setIsVoiceHelpOpen(false)}>Got it</button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className = "modal-overlay" onClick = {() => setShowLogoutConfirm(false)}>
          <div
            className = "modal-content note-modal"
            role = "dialog"
            aria-modal = "true"
            aria-labelledby = "logout-confirm-title"
            onClick = {(e) => e.stopPropagation()}
          >
            <div className = "modal-header note-modal">
              <h2 id = "logout-confirm-title">Are you sure you want to log out of your account?</h2>
            </div>
            <div className = "modal-footer">
              <button
                className = "modal-btn"
                onClick = {() => setShowLogoutConfirm(false)}
                style = {{
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginRight: "10px"
                }}>Back</button>
              <button
                className = "modal-btn"
                onClick = {handleLogout}
                style = {{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginLeft: "10px"
                }}>Yes</button>
            </div>
          </div>
        </div>
      )}

      {!isChatOpen && (
        <button className = "ai-neon-circle" onClick = {() => setIsChatOpen(true)} aria-label = "Open AI chat">
          <span>💬</span>
        </button>
      )}


      {/* Редагування профілю (Зв'язано через кастомний хук) */}
      {profileModal.isOpen && user && (
        <Profile
          user = {user}
          onClose = {() => {
            profileModal.close();
            const userStr = localStorage.getItem("user");
            if (userStr) {
              setUser(JSON.parse(userStr));
            }
          }}
        />
      )}

      {/* ГОТОВІ РЯДКИ З ВІКОНЦЕМ (модалкою) */}
      {isDashboardOpen && (
        <div className = "dashboard-overlay calendar-dashboard-overlay" onClick = {() => setIsDashboardOpen(false)}>
          <div className = "dashboard-info-popup" onClick = {(e) => e.stopPropagation()}>
              <div className = "info-popup-header">
                  <div>
                    <h2> Quick Info </h2>
                    <p> User profile details </p>
                  </div>
                  <button className = "close-info-btn" onClick = {() => setIsDashboardOpen(false)}> × </button>
              </div>
              
              <div className = "info-popup-body">
                  <p><strong> User: </strong> {user?.first_name || user?.login}</p>
                  <p><strong> First name: </strong> {user?.first_name || " -- "}</p>
                  <p><strong> Last name: </strong> {user?.last_name || " –– "}</p>
                  <p><strong> Login: </strong> {user?.login}</p>
                  <p><strong> Email: </strong> {user?.email || "Not set"}</p>
                  {user?.region && <p><strong> Region: </strong> {user?.region}</p>}
                  <button
                    type = "button"
                    className = "dashboard-exit-btn"
                    onClick = {() => setShowLogoutConfirm(true)}
                  >
                    Exit
                  </button>
              </div>
          </div>
        </div>
      )}
    </div>
);
}