"use client";

// Імпорт необхідних хуків та компонентів для сторінки календаря
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Profile from "../components/Profile";
import "../css/Kalendar.css";
import { User } from "../constants/profileConfig";

// Інтерфейс для нотатки в календарі
interface Note {
  id: number;
  text: string;
  date: string;
  time: string;
  category: string;
}

// Константи для категорій та днів тижня
const CATEGORY_OPTIONS = ["Meeting", "Birthday", "Holiday", "Event"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Головний компонент сторінки календаря
export default function KalendarPage() {
  // Ініціалізація роутера для навігації
  const router = useRouter();
  // Стан для зберігання даних користувача
  const [user, setUser] = useState<User | null>(null);
  // Стан для індикатора завантаження
  const [loading, setLoading] = useState(true);
  // Стан для відкриття чату ШІ
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Стан для режиму видалення нотаток
  const [isDeleteMode, setIsDeleteMode] = useState(false);
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
  const [smsRemindersSent, setSmsRemindersSent] = useState<number[]>([]);
  // Стан для відкриття модального вікна редагування профілю
  const [showEditModal, setShowEditModal] = useState(false);
  //Хочеш програмувати і стати хорошим ІТ-спеціалістом??? Краще іди на завод BSC(Bosch), ul. Jędrzejowska 83, 93-636 Łódź. Там є круті стажування, а також можливість працювати над реальними посудомийними машинами з сучасними технологіями. Не пропусти шанс отримати цінний досвід і розвиватися в сфері складання посудомийних машин! Більше інформації на сайті Bosch або звертайся до відділу кадрів на ul. Papiernicza 1. Успіхів тобі в кар'єрі!

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
    const reminderText = `Нагадування: зустріч "${note.text}" починається о ${note.time} ${note.date}.`;
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
      if (note.category !== "Meeting" || !note.time || !note.date) return;

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

  const filteredNotes = useMemo(() => {
    return selectedCategory === "all"
      ? notes
      : notes.filter((note) => note.category === selectedCategory);
  }, [notes, selectedCategory]);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  const detectChatLanguage = (text: string) => {
    if (/[А-Яа-яЁёЇїІіЄєҐґ]/.test(text)) {
      return "uk";
    }
    if (/[ąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/.test(text)) {
      return "pl";
    }
    return "en";
  };

  const extractDateFromMessage = (message: string) => {
    const normalized = message.toLowerCase();
    const today = new Date();

    const parseIso = (value: string) => {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const formatDate = (date: Date) => date.toISOString().slice(0, 10);

    const explicitDate = message.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (explicitDate) {
      return formatDate(parseIso(explicitDate[1]) ?? today);
    }

    const dotDate = message.match(/\b(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{2,4})\b/);
    if (dotDate) {
      const day = Number(dotDate[1]);
      const month = Number(dotDate[2]) - 1;
      const year = Number(dotDate[3].length === 2 ? `20${dotDate[3]}` : dotDate[3]);
      const date = new Date(year, month, day);
      if (!Number.isNaN(date.getTime())) {
        return formatDate(date);
      }
    }

    if (/(завтра|jutro|tomorrow)/.test(normalized)) {
      return formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));
    }
    if (/(післязавтра|pojutrze|day after tomorrow)/.test(normalized)) {
      return formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000));
    }

    return formatDate(today);
  };

  const extractTimeFromMessage = (message: string) => {
    const match = message.match(/\b(\d{1,2}:\d{2})\b/);
    return match ? match[1] : "";
  };

  const inferNoteCategoryFromMessage = (message: string) => {
    const normalized = message.toLowerCase();
    if (/(birthday|день народження|urodziny)/.test(normalized)) {
      return "Birthday";
    }
    if (/(meeting|зустріч|spotkanie)/.test(normalized)) {
      return "Meeting";
    }
    if (/(holiday|відпустка|свято|wydarzenie|święto)/.test(normalized)) {
      return "Holiday";
    }
    if (/(event|подія|wydarzenie)/.test(normalized)) {
      return "Event";
    }
    return /(note|нотатк|notatkę|замітку)/.test(normalized) ? "Event" : "Meeting";
  };

  const shouldCreateNote = (message: string) => {
    const normalized = message.toLowerCase();
    return /(додай|добав|заплан|плануй|запланувати|додати|add|plan|create|створи|запиши|напиши|zaplan|dodaj|utwórz|zapisz)/.test(normalized) &&
      /(note|meeting|event|birthday|holiday|зустріч|подія|нотатк|замітку|день народження|свято|wydarzenie|spotkanie|urodziny|notatkę)/.test(normalized);
  };

  const generateAiReply = (message: string, language: "uk" | "pl" | "en", createdNote?: boolean, noteDate?: string, category?: string) => {
    const normalized = message.toLowerCase();

    if (createdNote && noteDate && category) {
      if (language === "uk") {
        return `Готово! Я додав ${category.toLowerCase()} на ${noteDate}.`;
      }
      if (language === "pl") {
        return `Gotowe! Dodałem ${category.toLowerCase()} na ${noteDate}.`;
      }
      return `Done! I added the ${category.toLowerCase()} for ${noteDate}.`;
    }

    if (language === "uk") {
      if (/(привіт|вітаю|доброго|здоров)/.test(normalized)) {
        return "Привіт! Я готовий допомогти з твоїм календарем українською.";
      }
      if (/(додай|добав|заплан|зустріч|поді|нотатк)/.test(normalized)) {
        return "Звісно, розкажи мені більше про подію, яку хочеш додати.";
      }
      return "Я відповідаю українською. Що ще бажаєш дізнатися або запланувати?";
    }

    if (language === "pl") {
      if (/(cześć|witaj|dzień dobry|hej)/.test(normalized)) {
        return "Cześć! Jestem tutaj, aby pomóc Ci z kalendarzem po polsku.";
      }
      if (/(dodaj|zaplan|spotkanie|wydarzenie|notatkę)/.test(normalized)) {
        return "Pewnie, powiedz mi więcej o wydarzeniu, które chcesz dodać.";
      }
      return "Odpowiadam po polsku. Co chciałbyś teraz zrobić?";
    }

    if (/(hello|hi|hey|good morning|good afternoon)/.test(normalized)) {
      return "Hello! I'm ready to help with your calendar in English.";
    }
    if (/(add|plan|meeting|event|note)/.test(normalized)) {
      return "Sure, tell me more about the event you want to add.";
    }
    return "I respond in English. What would you like to do next?";
  };

  const handleSendChatMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const language = detectChatLanguage(trimmed) as "uk" | "pl" | "en";
    const createNote = shouldCreateNote(trimmed);
    const noteDate = createNote ? extractDateFromMessage(trimmed) : undefined;
    const noteTime = createNote ? extractTimeFromMessage(trimmed) : "";
    const category = createNote ? inferNoteCategoryFromMessage(trimmed) : undefined;
    const userId = Date.now();

    setChatMessages((prev) => [
      ...prev,
      { id: userId, sender: "user", text: trimmed },
      { id: userId + 1, sender: "ai", text: generateAiReply(trimmed, language, createNote, noteDate, category) },
    ]);

    if (createNote && category) {
      const newNote: Note = {
        id: Date.now() + 1,
        text: trimmed,
        date: noteDate ?? new Date().toISOString().slice(0, 10),
        time: noteTime,
        category,
      };
      setNotes((prev) => [...prev, newNote]);
    }

    setChatInput("");
  };

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
    return filteredNotes.filter((note) => noteMatchesCell(note, day, offset));
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

  const openModal = (type: "Note" | "Holiday") => {
    setNoteType(type);
    setNoteCategory(type === "Holiday" ? "Holiday" : "Meeting");
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
      setNotes((prev) => prev.map((item) => (item.id === selectedNote.id ? newNote : item)));
    } else {
      setNotes((prev) => [...prev, newNote]);
    }

    closeModal();
  };

  const handleNoteClick = (note: Note) => {
    if (isDeleteMode) {
      setNotes((prev) => prev.filter((item) => item.id !== note.id));
      if (selectedNoteId === note.id) {
        setSelectedNoteId(null);
      }
      return;
    }

    setSelectedNoteId(note.id);
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
    <div className = "dashboard-layout-calendar" style = {{ paddingRight: isChatOpen ? "calc(min(35vw, 520px) + 32px)" : "20px" }}>
      {/* Верхня панель з логотипом і користувачем */}
      <div className = "topbar-cal">
        <div className = "logo-section"> Calendar with Alex </div>
        <button className = "user-bubble-nav" onClick = {() => router.push("/Dashboard")}> 
          <span>{currentUser.login}</span>
          <div className = "Avatar-img">
            {currentUser.avatar ? (
              <Image src = {currentUser.avatar} alt = "Avatar" width={39} height = {39} className = "avatar.png" />
            ) : (
              <div className = "avatar-letter">{currentUser.login.charAt(0).toUpperCase()}</div>
            )}
          </div>
        </button>
      </div>

      {/* Панель дій */}
      <div className = "controls-row">
        <button className = "ctrl-btn yellow" onClick = {() => openModal("Holiday")}> Add Date </button>
        <button className = "ctrl-btn" onClick = {openEditNote}> Edit Note </button>
        <button className = {`ctrl-btn pink ${isDeleteMode ? "active-del" : ""}`} onClick = {() => setIsDeleteMode((prev) => !prev)}>
          Delete Note
        </button>
        <button className = "ctrl-btn green" onClick = {() => openModal("Note")}> Add Note </button>
        <button className = "ctrl-btn" onClick = {() => setIsChatOpen((prev) => !prev)}>{isChatOpen ? "Close Chat" : "AI Chat"}</button>
      </div>

      <div className = "main-grid-cal">
        {/* Колонка фільтрів категорій */}
        <div className = "category-panel">
          <div className = "kategories-header"> Kategories </div>
          <button className = "side-cat-btn" onClick = {() => setSelectedCategory("all")}> All </button>
          {CATEGORY_OPTIONS.map((cat) => (
            <button key={cat} className = "side-cat-btn" onClick = {() => setSelectedCategory(cat)}>
              {cat}
            </button>
          ))}
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
              <div key={day} className = "grid-head-cell">{day}</div>
            ))}
            {calendarCells.map((cell, index) => {
              const isCurrentMonth = cell.offset === 0;
              const isToday = isCurrentMonth && new Date().toDateString() === new Date(year, month, cell.day).toDateString();
              const notesInCell = cellNotes(cell.day, cell.offset);

              return (
                <div
                  key = {`${index}-${cell.day}-${cell.offset}`}
                  className = {`grid-cell ${!isCurrentMonth ? "grid-cell-inactive" : ""} ${isToday ? "today-highlight" : ""}`}
                >
                  <div className = "cell-top-row">
                    <span className = "cell-day-number">{cell.day}</span>
                    {notesInCell.length > 0 && <span className = "note-marker">{notesInCell.length}</span>}
                  </div>
                  <div className = "cell-notes">
                    {notesInCell.slice(0, 2).map((note) => (
                      <div key = {note.id} className = {`cell-note-badge ${note.category.toLowerCase()}`}>
                        {note.category}: {note.text}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Інформація про Alex і нотатки */}
        <div className = "alex-profile">
          <span> ALEX </span>
          <div className = "circle purple"></div>
          <div style = {{ marginTop: "20px", color: "white" }}>
            <strong> Notes ({filteredNotes.length})</strong>
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

      {/* Модальне вікно для нотаток */}
      {isNoteModalOpen && (
        <div className = "modal-overlay" onClick = {closeModal}>
          <div className = "modal-content note-modal" onClick = {(e) => e.stopPropagation()}>
            <div className = "modal-header note-modal">
              <h2>{noteType === "Holiday" ? "Add Date" : selectedNote ? "Edit Note" : "New Note"}</h2>
              <button className = "modal-close note-modal" onClick = {closeModal}>✕</button>
            </div>
            <div className = "modal-body">
              <label style = {{display: "block", marginBottom: "10px"}} > Text </label>
              <input
                type = "text"
                value = {noteText}
                onChange = {(e) => setNoteText(e.target.value)}
                style = {{
                  width: "100%", 
                  padding: "10px", 
                  marginBottom: "15px", 
                  borderRadius: "8px", 
                  border: "1px solid #ccc" 
                }}
              />
              <label style = {{display: "block", marginBottom: "10px"}} > Date </label>
              <input
                type = "date"
                value = {noteDate}
                onChange = {(e) => setNoteDate(e.target.value)}
                style = {{ 
                  width: "100%", 
                  padding: "10px", 
                  marginBottom: "15px", 
                  borderRadius: "8px", 
                  border: "1px solid #ccc" 
                }}
              />
              <label style = {{display: "block", marginBottom: "10px"}}> Time </label>
              <input
                type = "time"
                value = {noteTime}
                onChange = {(e) => setNoteTime(e.target.value)}
                style = {{ 
                  width: "100%", 
                  padding: "10px", 
                  marginBottom: "15px", 
                  borderRadius: "8px", 
                  border: "1px solid #ccc" 
                }}
              />
              <label style = {{display: "block", marginBottom: "10px"}}> Category </label>
              <select
                value = {noteCategory}
                onChange = {(e) => setNoteCategory(e.target.value)}
                style = {{ 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "8px", 
                  border: "1px solid #ccc" 
                }}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key = {category} value = {category}>{category}</option>
                ))}
              </select>
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
            <span> Chat with Alex </span>
            <button className = "chat-close-btn" onClick = {() => setIsChatOpen(false)}>✕</button>
          </div>
          <div className = "chat-mid">
            {chatMessages.length === 0 ? (
              <div className = "ai-text"> Welcome, {currentUser.login}! Ask something... </div>
            ) : (
              chatMessages.map((message) => (
                <div key = {message.id} className = {`chat-message ${message.sender}`}>
                  <span className = "message-sender">{message.sender === "user" ? "You" : "Alex"}</span>
                  <p>{message.text}</p>
                </div>
              ))
            )}
          </div>
          <div className = "chat-bottom">
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
            />
            <button
              className = "send-message-btn"
              type = "button"
              onClick = {handleSendChatMessage}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Редагування профілю */}
      {showEditModal && user && (
        <Profile
          user = {user}
          onClose = {() => {
            setShowEditModal(false);
            const userStr = localStorage.getItem("user");
            if (userStr) {
              setUser(JSON.parse(userStr));
            }
          }}
          isOpen = {showEditModal}
        />
      )}
    </div>
  );
}