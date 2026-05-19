"use client";

// Цей компонент виконується на клієнтській стороні і взаємодіє з localStorage
import { useState, useEffect } from "react";
import "../css/Dashboard.css";
import Profile from "../components/Profile";
import { User } from "../constants/profileConfig";

export default function Dashboard(): import("react/jsx-runtime").JSX.Element {
    // Стан користувача і додаткові прапорці для інтерфейсу
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        // При першому рендері читаємо дані користувача з localStorage
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (!token || !userStr) {
            // Якщо немає авторизаційних даних, то переходимо на сторінку входу
            window.location.href = "/Login";
            return;
        }

        try {
            const userData = JSON.parse(userStr);
            setUser(userData);
        } catch (e) {
            // Якщо дані пошкоджені, видаляємо їх і повертаємось на логін
            console.error("Error parsing user data:", e);
            window.location.href = "/Login";
        } finally {
            setLoading(false);
        }
    }, []);

    const handleLogout = () => {
        // Видаляємо дані користувача при виході
        // Токен видаляється на бекенді через HttpOnly cookie
        localStorage.removeItem("user");
        window.location.href = "/Login";
    };

    if (loading) {
        return <div className = "dashboard-container"><p> Loading ... </p></div>;
    }

    if (!user) {
        return <div className = "dashboard-container"><p> User not found </p></div>;
    }

    return (
        <div className = "Dashboard-layout">
            {/* Topbar: верхня панель з назвою та інформацією про користувача */}
            <div className = "topbar">
                <div className = "topbar-left">
                    <h1> Dashboard </h1>
                </div>
                <div className = "topbar-right">
                    <div className = "user-info-display">
                        <span className = "username-display">{user.login}</span>
                    </div>
                    <div className = "profile-avatar-wrapper">
                        <button
                            className = "profile-avatar-btn"
                            onClick = {() => setShowProfileMenu(!showProfileMenu)}
                            title="User Profile"
                        >
                            {user.avatar ? (
                                <img
                                    src = {user.avatar}
                                    alt = "User Avatar"
                                    className = "avatar-circle"
                                />
                            ) : (
                                <div className = "avatar-circle avatar-placeholder">
                                    {user.first_name?.charAt(0).toUpperCase() || user.login?.charAt(0).toUpperCase() || "?"}
                                </div>
                            )}
                        </button>

                        {/* Profile Menu Dropdown */}
                        {showProfileMenu && (
                            <div className = "profile-menu-dropdown">
                                <div className = "profile-menu-header">
                                    {user.avatar ? (
                                        <img
                                            src = {user.avatar}
                                            alt = "User Avatar"
                                            className = "menu-avatar"
                                        />
                                    ) : (
                                        <div className = "menu-avatar menu-avatar-placeholder">
                                            {user.first_name?.charAt(0).toUpperCase() || user.login?.charAt(0).toUpperCase() || "?"}
                                        </div>
                                    )}
                                    <div className = "profile-menu-info">
                                        <p className = "user-name">{user.first_name || user.login}</p>
                                        <p className = "user-email">{user.email}</p>
                                    </div>
                                </div>

                                <div className = "profile-menu-divider"></div>

                                <div className = "profile-menu-details">
                                    {/* Детальна інформація про користувача у випадаючому меню */}
                                    <p><strong> Username: </strong> {user.login}</p>
                                    <p><strong> Full Name: </strong> {user.first_name} {user.last_name}</p>
                                    {user.region && <p><strong> Region: </strong> {user.region}</p>}
                                    {user.date_of_birth && <p><strong> Date of Birth: </strong> {user.date_of_birth}</p>}
                                </div>

                                <div className = "profile-menu-divider"></div>

                                <button 
                                    className = "profile-menu-edit"
                                    onClick = {() => {
                                        setShowEditModal(true);
                                        setShowProfileMenu(false);
                                    }}
                                >
                                    Edit Profile
                                </button>

                                <button className = "profile-menu-logout" onClick = {handleLogout}>
                                    Log Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal: показує компонент редагування профілю */}
            {showEditModal && user && (
                <Profile
                    user = {user}
                    isOpen = {showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        // Оновити користувача з localStorage після редагування
                        const userStr = localStorage.getItem("user");
                        if (userStr) {
                            setUser(JSON.parse(userStr));
                        }
                    }}
                />
            )}

            {/* Main Content */}
            <div className = "Dashboard-container">
                <div className = "welcome-message">
                    <h2> Welcome, {user.first_name || user.login}! </h2>
                    <p> You have successfully logged in. </p>
                </div>

                <div className = "user-profile">
                    {/* Блок з детальною інформацією профілю користувача */}
                    <h3> Your Profile </h3>
                    <div className = "profile-info">
                    {/* Відображаємо інформацію профілю користувача у вигляді карток */}
                        <p><strong> ID: </strong> {user.id}</p>
                        <p><strong> Username: </strong> {user.login}</p>
                        <p><strong> Email: </strong> {user.email}</p>
                        <p><strong> First Name: </strong> {user.first_name}</p>
                        <p><strong> Last Name: </strong> {user.last_name}</p>
                        {user.region && <p><strong> Region: </strong> {user.region}</p>}
                        {user.date_of_birth && <p><strong> Date of Birth: </strong> {user.date_of_birth}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}