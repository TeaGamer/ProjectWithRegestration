
"use client";
// Компонент календаря на основі React / Next.js, що використовує локальний роутинг і стан користувача
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import "../css/dashboard.css";
import Profile from "../components/Profile";
import { User } from "../constants/profileConfig";

export default function Dashboard( ) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    // Параметри меню профілю та модального вікна редагування
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Стан для календаря та ШІ
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);

    // Guard: якщо немає авторизованого користувача, переходимо на сторінку логіну
    useEffect(() => {
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!token || !userStr) {
            router.push("/login");
            return;
        }

        try {
            const userData = JSON.parse(userStr);
            setUser(userData);
        } catch (e) {
            console.error("Error parsing user data:", e);
            router.push("/login");
        } finally {
            setLoading(false);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    if (loading) return <div className="dashboard-container"><p>Loading...</p></div>;
    if (!user) return null;

    // Логіка календаря: обчислюємо поточний місяць і зсув для першого дня тижня
    const year = currentDate.getFullYear( );
    const month = currentDate.getMonth( );
    const monthName = currentDate.toLocaleString('uk-UA', { month: 'long' });
    const daysInMonth = new Date(year, month + 1, 0).getDate( );
    const firstDayIndex = new Date(year, month, 1).getDay( );
    // Якщо тиждень починається з понеділка, перетворюємо індекс для нульової зміщення
    const shift = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    return (
        <div className="calendar-page-wrapper">
            {/* Topbar / Header */}
            <header className="dashboard-header">
                <div className="logo-frame">Calendar with Alex</div>
                
                {/* Кнопка-бульбашка користувача */}
                <div className="user-nav-bubble" onClick={() => router.push('/Dashboard')}>
                    <span className="username-label"><strong>Username:</strong> {user.login}</span>
                    <div className="avatar-frame">
                        {user.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="main-avatar-img" />
                        ) : (
                            <div className="avatar-letter">{user.login?.charAt(0).toUpperCase( )}</div>
                        )}
                    </div>
                </div>
            </header>

            {/* Controls */}
            <div className="calendar-controls">
                <button className="ctrl-btn-text text-blue-400">Add Date</button>
                <button className="ctrl-btn-rect bg-yellow-400">Edit Note</button>
                <button 
                    className={`ctrl-btn-rect bg-pink-600 ${isDeleteMode ? 'delete-active' : ''}`}
                    onClick={( ) => setIsDeleteMode(!isDeleteMode)}
                >
                    Delete Note
                </button>
                <button className="ctrl-btn-rect bg-green-500">Add Note</button>
            </div>

            <main className="calendar-main">
                {/* Категорії зліва */}
                <aside className="calendar-sidebar">
                    <div className="kategories-header">Kategories</div>
                    {['Meetings', 'Birthday', 'Holiday', 'Event'].map(cat => (
                        <button key={cat} className="category-item-btn">{cat}</button>
                    ))}
                </aside>

                {/* Основна сітка календаря */}
                <section className="calendar-grid-container">
                    <div className="month-navigation">
                        <button onClick={( ) => setCurrentDate(new Date(year, month - 1, 1))} className="nav-arrow-btn">{"<"}</button>
                        <h2 className="current-month-name">{monthName}</h2>
                        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="nav-arrow-btn">{">"}</button>
                    </div>

                    <div className="actual-calendar-grid">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                            <div key={d} className="grid-day-name">{d}</div>
                        ))}
                        {Array.from({ length: shift }).map((_, i) => <div key={`empty-${i}`} className="day-cell cell-empty"></div>)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                            return (
                                <div key={day} className={`day-cell ${isToday ? 'cell-today' : ''}`}>
                                    <span className="day-number">{day}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Alex Profile Placeholder */}
                <div className="alex-status-box">
                    <span>ALEX</span>
                    <div className="alex-purple-circle"></div>
                </div>
            </main>

            {/* AI Floating Button (Неоновий кружок з твоєю аватаркою) */}
            <div className="ai-neon-trigger" onClick={() => setIsChatOpen(!isChatOpen)}>
                <img src={user.avatar || ""} alt="AI" className="ai-avatar-icon" />
            </div>

            {/* Вікно чату з ШІ */}
            {isChatOpen && (
                // Вікно чату з AI, яке відкривається натисканням неонової кнопки
                <div className="ai-chat-popup">
                    <div className="chat-head">Спілкування з Alex AI</div>
                    <div className="chat-body">
                        <div className="ai-message">Hi, {user.login}! How is your day going?</div>
                    </div>
                    <div className="chat-input-zone">
                        <input type="text" placeholder="Ask something..." className="ai-input-field" />
                    </div>
                </div>
            )}

            {/* Edit Profile Modal (Твій оригінальний компонент) */}
            {showEditModal && (
                <Profile 
                    user={user}
                    onClose={() => {
                        setShowEditModal(false);
                        const userStr = localStorage.getItem("user");
                        if (userStr) setUser(JSON.parse(userStr));
                    }}
                />
            )}

            <style jsx>{`
                .calendar-page-wrapper {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; 
                    padding: 25px; 
                    font-family: 'Arial', sans-serif;
                }
                .dashboard-header { display: flex; justify-content: space-between; align-items: center; }
                .logo-frame { border: 2px solid #aaa; padding: 5px 20px; font-weight: bold; font-style: italic; background: rgba(255,255,255,0.1); }
                
                .user-nav-bubble { 
                    display: flex; align-items: center; gap: 12px; background: rgba(116, 169, 207, 0.7); 
                    padding: 4px 18px; border-radius: 40px; border: 2px solid white; cursor: pointer; transition: 0.3s;
                }
                .user-nav-bubble:hover { background: rgba(116, 169, 207, 0.9); }
                .avatar-frame { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid white; background: #555; }
                .main-avatar-img { width: 100%; height: 100%; object-fit: cover; }
                .avatar-letter { display: flex; justify-content: center; align-items: center; height: 100%; font-weight: bold; }

                .calendar-controls { display: flex; justify-content: center; gap: 20px; margin: 35px 0; }
                .ctrl-btn-text { background: none; border: none; font-weight: bold; cursor: pointer; }
                .ctrl-btn-rect { padding: 4px 15px; border: none; font-weight: bold; color: black; cursor: pointer; }
                .delete-active { outline: 3px solid red; transform: scale(1.05); }

                .calendar-main { display: grid; grid-template-columns: 180px 1fr 120px; gap: 30px; }
                .kategories-header { background: #bbb; color: black; font-weight: bold; padding: 5px; text-align: center; border: 1px solid black; }
                .category-item-btn { width: 100%; background: #ccc; border: 1px solid black; margin-top: 2px; padding: 5px; cursor: pointer; color: black; }

                .month-navigation { display: flex; justify-content: center; align-items: center; gap: 50px; margin-bottom: 20px; }
                .nav-arrow-btn { background: #f39c12; border: none; padding: 5px 20px; font-weight: bold; cursor: pointer; }
                .current-month-name { text-transform: capitalize; border-bottom: 2px solid white; padding: 0 10px; }

                .actual-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); background: black; border: 1px solid black; }
                .grid-day-name { background: #ddd; color: black; text-align: center; padding: 10px; font-weight: bold; border: 1px solid #444; }
                .day-cell { background: #fff; color: black; min-height: 100px; padding: 10px; border: 1px solid #444; position: relative; }
                .cell-today { border: 6px solid black !important; z-index: 10; }
                
                .alex-status-box { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: 50px; gap: 10px; }
                .alex-purple-circle { width: 70px; height: 70px; background: #5e35b1; border-radius: 50%; border: 2px solid #9575cd; }

                .ai-neon-trigger {
                    position: fixed; bottom: 35px; right: 35px; width: 75px; height: 75px;
                    border-radius: 50%; border: 3px solid #bc13fe; cursor: pointer;
                    box-shadow: 0 0 15px #bc13fe, 0 0 30px #bc13fe; overflow: hidden; z-index: 1000;
                }
                .ai-avatar-icon { width: 100%; height: 100%; object-fit: cover; }

                .ai-chat-popup {
                    position: fixed; bottom: 35px; right: 125px; width: 360px; height: 580px;
                    background: rgba(102, 126, 234, 0.98); border-radius: 30px; 
                    display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(255,255,255,0.3); box-shadow: -10px 10px 40px rgba(0,0,0,0.5);
                }
                .chat-head { padding: 25px; background: #5e35b1; text-align: center; font-weight: bold; font-size: 1.1rem; }
                .chat-body { flex: 1; padding: 20px; display: flex; align-items: flex-start; }
                .ai-message { background: rgba(0,0,0,0.2); padding: 12px 18px; border-radius: 20px 20px 20px 0; font-size: 14px; }
                .chat-input-zone { height: 90px; background: #4a90e2; display: flex; align-items: center; padding: 0 25px; }
                .ai-input-field { background: transparent; border: none; color: white; width: 100%; outline: none; font-size: 16px; }
                .ai-input-field::placeholder { color: rgba(255,255,255,0.6); }
            `}</style>
        </div>
    );
}