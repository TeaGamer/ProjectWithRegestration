"use client";
import { useState, useEffect } from "react";
import "../static/css/dashboard.css";

interface User {
    id: number;
    login: string;
    email: string;
    first_name: string;
    last_name: string;
    date_of_birth?: string;
    region?: string;
    avatar?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || \"http://localhost:8000\";

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState<User | null>(null);
    const [editError, setEditError] = useState("");
    const [editSuccess, setEditSuccess] = useState("");

    useEffect(() => {
        // Отримання користувача з localStorage
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!token || !userStr) {
            // Перенаправлення на вхід якщо немає токена
            window.location.href = "/login";
            return;
        }

        try {
            const userData = JSON.parse(userStr);
            setUser(userData);
            setEditData(userData);
        } catch (e) {
            console.error("Помилка при парсингу користувача:", e);
            window.location.href = "/login";
        } finally {
            setLoading(false);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (editData) {
            setEditData({
                ...editData,
                [name]: value,
            });
        }
    };

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setEditError("");
        setEditSuccess("");

        try {
            const response = await fetch(`${API_BASE}/api/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    first_name: editData?.first_name,
                    last_name: editData?.last_name,
                    region: editData?.region,
                    date_of_birth: editData?.date_of_birth,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setEditSuccess("Профіль оновлено успішно!");
                // Оновлення користувача в localStorage
                localStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
                setTimeout(() => {
                    setShowEditModal(false);
                    setEditSuccess("");
                }, 1500);
            } else {
                setEditError(data.error || \"Помилка при оновленні профілю. Спробуйте пізніше.\");
            }
        } catch (err) {
            setEditError("Помилка з'єднання з сервером. Перевірте, чи запущен бекенд на http://localhost:8000");
        }
    };

    if (loading) {
        return <div className="dashboard-container"><p>Завантаження...</p></div>;
    }

    if (!user) {
        return <div className="dashboard-container"><p>Користувач не знайдений</p></div>;
    }

    return (
        <div className="dashboard-layout">
            {/* Topbar */}
            <div className="topbar">
                <div className="topbar-left">
                    <h1>Панель управління</h1>
                </div>
                <div className="topbar-right">
                    <div className="user-info-display">
                        <span className="username-display">{user.login}</span>
                    </div>
                    <div className="profile-avatar-wrapper">
                        <button
                            className="profile-avatar-btn"
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            title="Профіль користувача"
                        >
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="Аватар користувача"
                                    className="avatar-circle"
                                />
                            ) : (
                                <div className="avatar-circle avatar-placeholder">
                                    {user.first_name?.charAt(0).toUpperCase() || user.login?.charAt(0).toUpperCase() || "?"}
                                </div>
                            )}
                        </button>

                        {/* Profile Menu Dropdown */}
                        {showProfileMenu && (
                            <div className="profile-menu-dropdown">
                                <div className="profile-menu-header">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt="Аватар"
                                            className="menu-avatar"
                                        />
                                    ) : (
                                        <div className="menu-avatar menu-avatar-placeholder">
                                            {user.first_name?.charAt(0).toUpperCase() || user.login?.charAt(0).toUpperCase() || "?"}
                                        </div>
                                    )}
                                    <div className="profile-menu-info">
                                        <p className="user-name">{user.first_name || user.login}</p>
                                        <p className="user-email">{user.email}</p>
                                    </div>
                                </div>

                                <div className="profile-menu-divider"></div>

                                <div className="profile-menu-details">
                                    <p><strong>Ім'я користувача:</strong> {user.login}</p>
                                    <p><strong>Повне ім'я:</strong> {user.first_name} {user.last_name}</p>
                                    {user.region && <p><strong>Регіон:</strong> {user.region}</p>}
                                    {user.date_of_birth && <p><strong>Дата народження:</strong> {user.date_of_birth}</p>}
                                </div>

                                <div className="profile-menu-divider"></div>

                                <button 
                                    className="profile-menu-edit"
                                    onClick={() => {
                                        setShowEditModal(true);
                                        setShowProfileMenu(false);
                                    }}
                                >
                                    Змінити дані
                                </button>

                                <button className="profile-menu-logout" onClick={handleLogout}>
                                    Вийти
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Змінити дані профілю</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowEditModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {editError && <div className="error-message">{editError}</div>}
                        {editSuccess && <div className="success-message">{editSuccess}</div>}

                        <form onSubmit={handleEditSubmit} className="edit-profile-form">
                            <div className="form-group">
                                <label>Ім'я</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={editData?.first_name || ""}
                                    onChange={handleEditChange}
                                    placeholder="Ім'я"
                                />
                            </div>

                            <div className="form-group">
                                <label>Прізвище</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={editData?.last_name || ""}
                                    onChange={handleEditChange}
                                    placeholder="Прізвище"
                                />
                            </div>

                            <div className="form-group">
                                <label>Регіон</label>
                                <select
                                    name="region"
                                    value={editData?.region || ""}
                                    onChange={handleEditChange}
                                >
                                    <option value="">Оберіть регіон</option>
                                    <option value="Ukraine">Вся Україна</option>
                                    <option value="Kyiv">Київ</option>
                                    <option value="Kharkiv">Харків</option>
                                    <option value="Odesa">Одеса</option>
                                    <option value="Dnipropetrovsk">Дніпропетровськ</option>
                                    <option value="Lviv">Львів</option>
                                    <option value="Zaporizhzhia">Запоріжжя</option>
                                    <option value="Mykolaiv">Миколаїв</option>
                                    <option value="Donetsk">Донецьк</option>
                                    <option value="Luhansk">Луганськ</option>
                                    <option value="Kherson">Херсон</option>
                                    <option value="Chernihiv">Чернігів</option>
                                    <option value="Cherkasy">Черкаси</option>
                                    <option value="Poltava">Полтава</option>
                                    <option value="Sumy">Суми</option>
                                    <option value="Vinnytsia">Вінниця</option>
                                    <option value="Rivne">Рівне</option>
                                    <option value="Zhytomyr">Житомир</option>
                                    <option value="Khmelnytskyi">Хмельницький</option>
                                    <option value="Ternopil">Тернопіль</option>
                                    <option value="Ivano-Frankivsk">Івано-Франківськ</option>
                                    <option value="Volyn">Волинь</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Дата народження</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={editData?.date_of_birth || ""}
                                    onChange={handleEditChange}
                                />
                            </div>

                            <div className="modal-buttons">
                                <button type="submit" className="modal-submit-btn">
                                    Зберегти
                                </button>
                                <button 
                                    type="button" 
                                    className="modal-cancel-btn"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Скасувати
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="dashboard-container">
                <div className="welcome-message">
                    <h2>Вітаємо, {user.first_name || user.login}!</h2>
                    <p>Ви успішно увійшли в систему.</p>
                </div>

                <div className="user-profile">
                    <h3>Ваш профіль</h3>
                    <div className="profile-info">
                        <p><strong>ID:</strong> {user.id}</p>
                        <p><strong>Ім'я користувача:</strong> {user.login}</p>
                        <p><strong>Пошта:</strong> {user.email}</p>
                        <p><strong>Ім'я:</strong> {user.first_name}</p>
                        <p><strong>Прізвище:</strong> {user.last_name}</p>
                        {user.region && <p><strong>Регіон:</strong> {user.region}</p>}
                        {user.date_of_birth && <p><strong>Дата народження:</strong> {user.date_of_birth}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
