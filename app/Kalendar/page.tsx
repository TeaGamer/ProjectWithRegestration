"use client";

// Імпорт необхідних хуків та компонентів для сторінки календаря
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import Profile from "../components/Profile";
import { sendChatMessage, parseEventFromText } from "../services/chatService";
import "../css/Kalendar.css";
import { User } from "../constants/profileConfig";
import { useProfileModal } from "../hooks/useProfileModal";
import { useRouter } from "next/navigation";



// Інтерфейс для нотатки в календарі
interface Note {
  id: number;
  text: string;
  date: string;
  time: string;
  category: string;
}

// Константи для категорій та днів тижня
const CATEGORY_OPTIONS = ["Lectures (lessons)", "Exams", "Meetings", "Notes", "Events"];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Головний компонент сторінки календаря
export default function KalendarPage() {
  const router = useRouter();
  // Стан для зберігання даних користувача
  const [user, setUser] = useState<User | null>(null);
  // Стан для індикатора завантаження
  const [loading, setLoading] = useState(true);
  // Стан для відкриття чату ШІ
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Стан для модального вікна нотатки
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  // Тип нотатки: нотатка або свято
  const [noteType, setNoteType] = useState<"Note" | "Holiday">("Note");
  // Текст нотатки
  const [noteText, setNoteText] = useState("");
  // Дата нотатки
  const [noteDate, setNoteDate] = useState("");
  // Час нотатки
  const [noteTime, setNoteTime] = useState("");
  // Категорія нотатки
  const [noteCategory, setNoteCategory] = useState(CATEGORY_OPTIONS[0]);
  // Вибрана категорія для фільтрації
  const [selectedCategory, setSelectedCategory] = useState("all");
  // Масив нотаток
  const [notes, setNotes] = useState<Note[]>([]);
  // ID вибраної нотатки
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  // Поточна дата для календаря
  const [currentDate, setCurrentDate] = useState(new Date());
  // Стан чату та SMS-нагадувань
  const [chatMessages, setChatMessages] = useState<{
    id: number;
    sender: "user" | "ai";
    text: string;
  }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [usedFiles, setUsedFiles] = useState<File[]>([]);
  const [smsRemindersSent, setSmsRemindersSent] = useState<number[]>([]);
  
  // Стан для відкриття модального вікна редагування профілю через кастомний хук
  const profileModal = useProfileModal();
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  //Хочеш програмувати і стати хорошим ІТ-спеціалістом??? Краще іди до допомогти хорошої компанії на ul. Papernicza 1, Łódź. А від неї уже пиздуй на завод BSC(Bosch), ul. Jędrzejowska 83, 93-636 Łódź. Там є круті стажування, а також можливість працювати над реальними посудомийними машинами з сучасними технологіями. Не пропусти шанс отримати цінний досвід і розвиватися в сфері складання посудомийних машин! Більше інформації на сайті Bosch або звертайся до відділу кадрів на ul. Papiernicza 1. Успіхів тобі в кар'єрі!
  // Реф для виклику прихованого календарика в полі дати
  const datePickerRef = useRef<HTMLInputElement | null>(null);

  // useEffect для завантаження збереженого користувача без примусової захищеної перевірки
  useEffect(() => {
    const userStr = localStorage.getItem("user");

    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDashboardOpen) {
        setIsDashboardOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [isDashboardOpen]);

  useEffect(() => {
    const savedNotes = localStorage.getItem("calendarNotes");
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch {
        setNotes([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("calendarNotes", JSON.stringify(notes));
  }, [notes]);

  const sendSmsReminder = (note: Note) => {
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
  };

  const checkMeetingReminders = () => {
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
  };

  useEffect(() => {
    checkMeetingReminders();
    const interval = window.setInterval(checkMeetingReminders, 60 * 1000);
    return () => window.clearInterval(interval);
  }, [notes, smsRemindersSent]);

  const sortNotesByDateTime = (notesToSort: Note[]) =>
    notesToSort
      .slice()
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.time || "23:59").localeCompare(b.time || "23:59");
      });

  const sortedNotes = useMemo(() => sortNotesByDateTime(notes), [notes]);

  const filteredNotes = useMemo(() => {
    return selectedCategory === "all"
      ? sortedNotes
      : sortedNotes.filter((note) => note.category === selectedCategory);
  }, [selectedCategory, sortedNotes]);

  const getCategoryClass = (category: string) => {
    if (category === "Lectures (lessons)") return "lectures";
    if (category === "Exams") return "exams";
    if (category === "Meetings") return "meetings";
    if (category === "Notes") return "notes";
    if (category === "Events") return "events";
    return "events";
  };

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
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

  const handleSendChatMessage = async () => {
    const trimmed = chatInput.trim();
    const userText = trimmed || (attachedFiles.length > 0 ? "Please review attached file(s)" : "");
    if (!userText) return;

    const userId = Date.now();
    setChatMessages((prev) => [...prev, { id: userId, sender: "user", text: userText }]);
    setChatLoading(true);
    setChatError(null);

    try {
      const token = localStorage.getItem("token") || "";
      const fileNames = attachedFiles.map((file) => file.name);
      const response = await sendChatMessage(trimmed, token, fileNames.length ? fileNames : undefined);
      setChatMessages((prev) => [
        ...prev,
        { id: userId + 1, sender: "ai", text: response.ai_response ?? "No response from AI." },
      ]);

      if (attachedFiles.length > 0) {
        setUsedFiles((prev) => [...prev, ...attachedFiles]);
        setAttachedFiles([]);
      }

      try {
        const parsed = await parseEventFromText(trimmed, token);
        if (parsed.is_event && parsed.title && parsed.date && parsed.category) {
          const newNote: Note = {
            id: Date.now() + 1,
            text: parsed.title,
            date: parsed.date,
            time: parsed.time ?? "",
            category: parsed.category,
          };
          setNotes((prev) => sortNotesByDateTime([...prev, newNote]));
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 2,
              sender: "ai",
              text: `✅ Додано подію: "${parsed.title}" на ${parsed.date}${parsed.time ? " о " + parsed.time : ""}`,
            },
          ]);
        }
      } catch {
        // Пропускаємо помилку парсингу події ШІ
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error sending message";
      setChatError(message);
      setChatMessages((prev) => [
        ...prev,
        { id: userId + 2, sender: "ai", text: `Error: ${message}` },
      ]);
    } finally {
      setChatLoading(false);
      setChatInput("");
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [chatMessages]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("en-US", { month: "long" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const shift = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

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

  const prevMonthDays = new Date(year, month, 0).getDate();
  const totalCells = 42;

  const calendarCells = Array.from({length: totalCells}, (_, index) => {
    if (index < shift) {
      return {day: prevMonthDays - shift + 1 + index, offset: -1};
    }
    if (index < shift + daysInMonth) {
      return {day: index - shift + 1, offset: 0};
    }
    return {day: index - shift - daysInMonth + 1, offset: 1};
  });

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = "/Login";
  };

  const openModal = (type: "Note" | "Holiday") => {
    setNoteType(type);
    setNoteCategory(CATEGORY_OPTIONS[0]);
    setNoteText("");
    setNoteDate("");
    setNoteTime("");
    setSelectedNoteId(null);
    setIsNoteModalOpen(true);
  };

  const openEditNote = () => {
    if (selectedNote) {
      setNoteType("Note");
      setNoteCategory(selectedNote.category);
      setNoteDate(selectedNote.date);
      setNoteTime(selectedNote.time);
      setNoteText(selectedNote.text);
      setIsNoteModalOpen(true);
    } else {
      openModal("Note");
    }
  };

  const closeModal = () => {
    setIsNoteModalOpen(false);
    setSelectedNoteId(null);
    setNoteText("");
    setNoteDate("");
    setNoteTime("");
  };

  const handleSaveNote = () => {
    if (!noteText || !noteDate) {
      return;
    }

    const newNote: Note = {
      id: selectedNote ? selectedNote.id : Date.now(),
      text: noteText,
      date: noteDate,
      time: noteTime,
      category: noteCategory,
    };

    if (selectedNote) {
      setNotes((prev) => sortNotesByDateTime(prev.map((item) => (item.id === selectedNote.id ? newNote : item))));
    } else {
      setNotes((prev) => sortNotesByDateTime([...prev, newNote]));
    }

    closeModal();
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNoteId(note.id);
  };

  const handleDeleteSelectedNote = () => {
    if (!selectedNote) return;
    setNotes((prev) => prev.filter((item) => item.id !== selectedNote.id));
    setSelectedNoteId(null);
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
        <div className = "logo-section" > <img src="IMG_1074.png" alt = "AI Alex Avatar" className = "avatar-img"/> Calendar with Alex</div>
        <button className = "user-bubble-nav" onClick = {() => setIsDashboardOpen(true)}> 
          <div className = "avatar-icon" > {currentUser.login.charAt(0).toUpperCase()}</div>
          <span>{currentUser.login}</span>
        </button>
      </div>

      {/* Панель дій */}
      <div className = "controls-row">
        <button className = "ctrl-btn" onClick = {() => openModal("Holiday")}>📅 Add Date</button>
        <button className = "ctrl-btn" onClick = {openEditNote}>✏️ Edit Note</button>
        <button className = "ctrl-btn" onClick = {handleDeleteSelectedNote} disabled={!selectedNote}>🗑️ Delete Note</button>
        <button className = "ctrl-btn" onClick = {() => openModal("Note")}>📝 Add Note</button>
      </div>

      <div className = "main-grid-cal">
        {/* Колонка фільтрів категорій */}
        <div className = "category-panel">
          <div className = "kategories-header"> Kategories </div>
          <button className = "side-cat-btn" onClick = {() => setSelectedCategory("all")}> All </button>
          {CATEGORY_OPTIONS.map((cat) => (
            <button key = {cat} className = "side-cat-btn" onClick = {() => setSelectedCategory(cat)}>
              {cat}
            </button>
          ))}
          <div className = "file-list-box">
            <div className = "file-list-title">AI files used</div>
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
              <div className = "file-list-empty">No used files yet.</div>
            )}
          </div>
        </div>

        {/* Календар */}
        <div className = "calendar-block">
          <div className = "month-picker">
            <button className = "month-arrow" onClick = {() => changeMonth(-1)}>&lt;</button>
            <div className = "month-pill">{monthName} {year}</div>
            <button className = "month-arrow" onClick = {() => changeMonth(1)}>&gt;</button>
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
          <span> Your notes</span>
          <div className = "circle purple"></div>
          <div style = {{ marginTop: "20px", color: "white" }}>
            <strong> Number of notes ({filteredNotes.length})</strong>
            {filteredNotes.map((note) => (
              <button
                key = {note.id}
                type = "button"
                onClick = {() => handleNoteClick(note)}
                style={{
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
          <div className = "modal-content note-modal" onClick = {(e) => e.stopPropagation()}>
            <div className = "modal-header note-modal">
              <h2>{noteType === "Holiday" ? "Add Date" : selectedNote ? "Edit Note" : "New Note"}</h2>
              <button className = "modal-close note-modal" onClick = {closeModal}>✕</button>
            </div>
            
            <div className = "modal-body">
              {/* Стрічка: Нотатка */}
              <div className = "modal-form-row">
                <label>Note</label>
                <input
                  type = "text"
                  placeholder = "Note text..."
                  value = {noteText}
                  onChange = {(e) => setNoteText(e.target.value)}
                />
              </div>

              {/* Стрічка: Категорія події */}
              <div className = "modal-form-row">
                <label>Category</label>
                <select
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
                <label>Time</label>
                <input
                  type = "text"
                  placeholder = "A specific time (e.g., 15:30) or period (12:00-14:00)"
                  value = {noteTime}
                  onChange = {(e) => setNoteTime(e.target.value)}
                />
              </div>

              {/* Стрічка: Дата з висувним календариком */}
              <div className = "modal-form-row" style = {{ position: "relative" }}>
                <label>Date</label>
                <div className = "date-input-wrapper">
                  <button 
                    type = "button" 
                    className = "date-dropdown-btn"
                    onClick = {() => datePickerRef.current?.showPicker()}
                    title = "Select from the calendar"
                  >
                    ▼
                  </button>
                  <input
                    type = "text"
                    placeholder = "dd.mm.yyyy  or  yyyy-mm-dd"
                    value = {noteDate}
                    onChange = {(e) => setNoteDate(e.target.value)}
                  />
                  <input
                    type = "date"
                    ref = {datePickerRef}
                    style = {{
                      position: "absolute",
                      visibility: "hidden",
                      width: "0",
                      height: "0"
                    }}
                    onChange = {(e) => {
                      if (e.target.value) {
                        setNoteDate(e.target.value);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className = "modal-footer">
              <button className = "modal-btn save-btn" onClick = {handleSaveNote}> Save </button>
              <button className = "modal-btn cancel-btn" onClick = {closeModal}> Cancel </button>
            </div>
          </div>
        </div>
      )}

      {/* Чат ШІ */}
      {isChatOpen && (
        <div className = "ai-chat-box">
          <div className = "chat-top">
            <span> Chat with your Alex </span>
            <button className = "chat-close-btn" onClick = {() => setIsChatOpen(false)}>✕</button>
          </div>
          <div className = "chat-mid">
            {attachedFiles.length > 0 && (
              <div className = "file-list-box" style = {{ marginBottom: '14px' }}>
                <div className = "file-list-title">Files attached for this request</div>
                {attachedFiles.map((file, index) => (
                  <div key = {`${file.name}-${index}`} className = "file-chip">
                    <span>{file.name}</span>
                    <button type = "button" onClick = {() => removeAttachedFile(index)}>×</button>
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
            <label htmlFor="file-upload" className = "file-upload-button" title = "Attach file">📎</label>
            <input ref = {fileInputRef} id = "file-upload" type = "file" multiple accept = "*/*" onChange = {handleFileInputChange} hidden />
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
              className = "send-message-btn"
              type = "button"
              onClick = {handleSendChatMessage}
              disabled = {chatLoading || (!chatInput.trim() && attachedFiles.length === 0)}
            >
              {chatLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Панель Dashboard */}
      {isDashboardOpen && (
         <div className = "dashboard-overlay" onClick = {() => setIsDashboardOpen(false)}>
            <div className = "dashboard-panel" onClick = {(e) => e.stopPropagation()}>
              <div className = "dashboard-panel-header">
                {/* КРУЖЕЧОК-КНОПКА: Клік по ньому перенаправляє на великий дашборд */}
                <div 
                    className = "dashboard-avatar-icon clickable-avatar" 
                    onClick = {() => router.push("/Dashboard")}
                    title = "Відкрити повний Dashboard"
                >
                    {(currentUser.first_name || currentUser.login)[0].toUpperCase()}
                </div>
                <div>
                    <h3>{currentUser.first_name || currentUser.login}</h3>
                    <p>Quick View</p>
                </div>
                <button className = "close-info-btn" onClick = {() => setIsDashboardOpen(false)}>×</button>
                </div>
                <div className="dashboard-panel-body">
                  <p><strong>Login:</strong> {currentUser.login}</p>
                  <p><strong>Email:</strong> {currentUser.email || "Not specified"}</p>
                  {/* Сюди можна додати ще 1-2 важливих поля для швидкого інфо */}
                </div>

            </div>
          </div>
        )}
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className = "modal-overlay" onClick = {() => setShowLogoutConfirm(false)}>
          <div className = "modal-content note-modal" onClick = {(e) => e.stopPropagation()}>
            <div className = "modal-header note-modal">
              <h2>Confirm Logout</h2>
              <button className = "modal-close note-modal" onClick = {() => setShowLogoutConfirm(false)}>✕</button>
            </div>
            <div className = "modal-body" style = {{ padding: "20px", textAlign: "center" }}>
              <p>Are you sure you want to log out?</p>
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
                }}
              >
                Cancel
              </button>
              <button
                className = "modal-btn"
                onClick = {handleLogout}
                style = {{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Log Out
              </button>
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
          isOpen = {profileModal.isOpen}
          onClose = {() => {
            profileModal.close();
            const userStr = localStorage.getItem("user");
            if (userStr) {
              setUser(JSON.parse(userStr));
            }
          }}
        />
      )}
    </div>
  );
}