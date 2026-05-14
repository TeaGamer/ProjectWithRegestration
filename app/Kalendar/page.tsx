
"use client";
// Імпорт необхідних хуків та компонентів для сторінки календаря
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "../css/kalendar.css";
import "../css/dashboard.css";
import Profile from "../components/Profile";
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
  // Стан для модального вікна редагування профілю
  const [showEditModal, setShowEditModal] = useState(false);
  // Стан для відкриття чату ШІ
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Стан для режиму видалення нотаток
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  // Стан для модального вікна нотатки
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  // Тип нотатки: нотатка або свято
  const [noteType, setNoteType] = useState<"note" | "holiday">("note");
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

  // useEffect для перевірки авторизації при завантаженні сторінки
  useEffect(() => {
    // Отримання даних користувача та токена з localStorage
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    // Якщо немає токена або даних користувача, перенаправлення на логін
    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      // Парсинг даних користувача
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  const filteredNotes = useMemo(() => {
    return selectedCategory === "all"
      ? notes
      : notes.filter((note) => note.category === selectedCategory);
  }, [notes, selectedCategory]);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  const [chatMessages, setChatMessages] = useState<{
    id: number;
    sender: "user" | "ai";
    text: string;
  }[]>([]);
  const [chatInput, setChatInput] = useState("");

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
    const noteDate = new Date(note.date);
    return noteDate.getDate() === day && noteDate.getMonth() === normalizeMonth(offset);
  };

  const cellNotes = (day: number, offset: number) => {
    return filteredNotes.filter((note) => noteMatchesCell(note, day, offset));
  };

  const prevMonthDays = new Date(year, month, 0).getDate();
  const totalCells = 42;

  const calendarCells = Array.from({ length: totalCells }, (_, index) => {
    if (index < shift) {
      return { day: prevMonthDays - shift + 1 + index, offset: -1 };
    }
    if (index < shift + daysInMonth) {
      return { day: index - shift + 1, offset: 0 };
    }
    return { day: index - shift - daysInMonth + 1, offset: 1 };
  });

  const openModal = (type: "note" | "holiday") => {
    setNoteType(type);
    setNoteCategory(type === "holiday" ? "Holiday" : "Meeting");
    setNoteText("");
    setNoteDate("");
    setNoteTime("");
    setSelectedNoteId(null);
    setIsNoteModalOpen(true);
  };

  const openEditNote = () => {
    if (selectedNote) {
      setNoteType("note");
      setNoteCategory(selectedNote.category);
      setNoteDate(selectedNote.date);
      setNoteTime(selectedNote.time);
      setNoteText(selectedNote.text);
      setIsNoteModalOpen(true);
    } else {
      openModal("note");
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
    return <div className="dashboard-container"><p>Loading...</p></div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-layout-calendar" style={{ paddingRight: isChatOpen ? "460px" : "20px" }}>
      {/* Верхня панель з логотипом і користувачем */}
      <div className="topbar-cal">
        <div className="logo-section">Calendar with Alex</div>
        <button className="user-bubble-nav" onClick={() => router.push("/Dashboard")}> 
          <span>{user.login}</span>
          <div className="avatar-circle-nav">
            {user.avatar ? (
              <Image src={user.avatar} alt="Avatar" width={40} height={40} className="knight.img" />
            ) : (
              <div className="avatar-letter">{user.login.charAt(0).toUpperCase()}</div>
            )}
          </div>
        </button>
      </div>

      {/* Панель дій */}
      <div className="controls-row">
        <button className="ctrl-btn yellow" onClick={() => openModal("holiday")}>Add Date</button>
        <button className="ctrl-btn" onClick={openEditNote}>Edit Note</button>
        <button className={`ctrl-btn pink ${isDeleteMode ? "active-del" : ""}`} onClick={() => setIsDeleteMode((prev) => !prev)}>
          Delete Note
        </button>
        <button className="ctrl-btn green" onClick={() => openModal("note")}>Add Note</button>
        <button className="ctrl-btn" onClick={() => setIsChatOpen((prev) => !prev)}>{isChatOpen ? "Close Chat" : "AI Chat"}</button>
      </div>

      <div className="main-grid-cal">
        {/* Колонка фільтрів категорій */}
        <div className="category-panel">
          <div className="kategories-header">Kategories</div>
          <button className="side-cat-btn" onClick={() => setSelectedCategory("all")}>All</button>
          {CATEGORY_OPTIONS.map((cat) => (
            <button key={cat} className="side-cat-btn" onClick={() => setSelectedCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* Календар */}
        <div className="calendar-block">
          <div className="month-picker">
            <button className="month-arrow" onClick={() => changeMonth(-1)}>&lt;</button>
            <div className="month-pill">{monthName} {year}</div>
            <button className="month-arrow" onClick={() => changeMonth(1)}>&gt;</button>
          </div>

          <div className="days-grid">
            {WEEKDAYS.map((day) => (
              <div key={day} className="grid-head-cell">{day}</div>
            ))}
            {calendarCells.map((cell, index) => {
              const isCurrentMonth = cell.offset === 0;
              const isToday = isCurrentMonth && new Date().toDateString() === new Date(year, month, cell.day).toDateString();
              const notesInCell = cellNotes(cell.day, cell.offset);

              return (
                <div
                  key={`${index}-${cell.day}-${cell.offset}`}
                  className={`grid-cell ${!isCurrentMonth ? "grid-cell-inactive" : ""} ${isToday ? "today-highlight" : ""}`}
                >
                  <div className="cell-top-row">
                    <span className="cell-day-number">{cell.day}</span>
                    {notesInCell.length > 0 && <span className="note-marker">{notesInCell.length}</span>}
                  </div>
                  <div className="cell-notes">
                    {notesInCell.slice(0, 2).map((note) => (
                      <div key={note.id} className={`cell-note-badge ${note.category.toLowerCase()}`}>
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
        <div className="alex-profile">
          <span>ALEX</span>
          <div className="circle purple"></div>
          <div style={{ marginTop: "20px", color: "white" }}>
            <strong>Notes ({filteredNotes.length})</strong>
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => handleNoteClick(note)}
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
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header note-modal">
              <h2>{noteType === "holiday" ? "Add Date" : selectedNote ? "Edit Note" : "New Note"}</h2>
              <button className="modal-close note-modal" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <label style={{ display: "block", marginBottom: "10px" }}>Text</label>
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ccc" }}
              />
              <label style={{ display: "block", marginBottom: "10px" }}>Date</label>
              <input
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ccc" }}
              />
              <label style={{ display: "block", marginBottom: "10px" }}>Time</label>
              <input
                type="time"
                value={noteTime}
                onChange={(e) => setNoteTime(e.target.value)}
                style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ccc" }}
              />
              <label style={{ display: "block", marginBottom: "10px" }}>Category</label>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button className="modal-btn save-btn" onClick={handleSaveNote}>Save</button>
              <button className="modal-btn cancel-btn" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Чат ШІ */}
      {isChatOpen && (
        <div className="ai-chat-box">
          <div className="chat-top">
            <span>Chat with Alex</span>
            <button className="chat-close-btn" onClick={() => setIsChatOpen(false)}>✕</button>
          </div>
          <div className="chat-mid">
            {chatMessages.length === 0 ? (
              <div className="ai-text">Welcome, {user.login}! Ask something...</div>
            ) : (
              chatMessages.map((message) => (
                <div key={message.id} className={`chat-message ${message.sender}`}>
                  <span className="message-sender">{message.sender === "user" ? "You" : "Alex"}</span>
                  <p>{message.text}</p>
                </div>
              ))
            )}
          </div>
          <div className="chat-bottom">
            <input
              className="ai-input"
              placeholder="Ask something..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (chatInput.trim()) {
                    setChatMessages((prev) => [
                      ...prev,
                      { id: Date.now(), sender: "user", text: chatInput.trim() },
                    ]);
                    setChatInput("");
                  }
                }
              }}
            />
            <button
              className="send-message-btn"
              type="button"
              onClick={() => {
                if (!chatInput.trim()) return;
                setChatMessages((prev) => [
                  ...prev,
                  { id: Date.now(), sender: "user", text: chatInput.trim() },
                ]);
                setChatInput("");
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Редагування профілю */}
      {showEditModal && (
        <Profile
          user={user}
          onClose={() => {
            setShowEditModal(false);
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