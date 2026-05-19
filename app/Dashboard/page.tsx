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
        // Завантажуємо збереженого користувача, але дозволяємо заходити без логіну
        const userStr = localStorage.getItem("user");

        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
            } catch (e) {
                console.error("Error parsing user data:", e);
            }
        }

        setLoading(false);
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

    const currentUser: User = user ?? {
        id: 0,
        login: "Guest",
        email: "",
        first_name: "Guest",
        last_name: "",
    };

    return (
        <div className = "Dashboard-layout">
            {/* Topbar: верхня панель з назвою та інформацією про користувача */}
            <div className = "topbar">
                <div className = "topbar-left">
                    <h1> Dashboard </h1>
                </div>
                <div className = "topbar-right">
                    <div className = "user-info-display">
                        <span className = "username-display">{currentUser.login}</span>
                    </div>
                    <div className = "profile-avatar-wrapper">
                        <button
                            className = "profile-avatar-btn"
                            onClick = {() => setShowProfileMenu(!showProfileMenu)}
                            title="User Profile"
                        >
                            {currentUser.avatar ? (
                                <img
                                    src = {currentUser.avatar}
                                    alt = "User Avatar"
                                    className = "avatar-circle"
                                />
                            ) : (
                                <div className = "avatar-circle avatar-placeholder">
                                    {currentUser.first_name?.charAt(0).toUpperCase() || currentUser.login?.charAt(0).toUpperCase() || "?"}
                                </div>
                            )}
                        </button>

                        {/* Profile Menu Dropdown */}
                        {showProfileMenu && (
                            <div className = "profile-menu-dropdown">
                                <div className = "profile-menu-header">
                                    {currentUser.avatar ? (
                                        <img
                                            src = {currentUser.avatar}
                                            alt = "User Avatar"
                                            className = "menu-avatar"
                                        />
                                    ) : (
                                        <div className = "menu-avatar menu-avatar-placeholder">
                                            {currentUser.first_name?.charAt(0).toUpperCase() || currentUser.login?.charAt(0).toUpperCase() || "?"}
                                        </div>
                                    )}
                                    <div className = "profile-menu-info">
                                        <p className = "user-name">{currentUser.first_name || currentUser.login}</p>
                                        <p className = "user-email">{currentUser.email}</p>
                                    </div>
                                </div>

                                <div className = "profile-menu-divider"></div>

                                <div className = "profile-menu-details">
                                    {/* Детальна інформація про користувача у випадаючому меню */}
                                    <p><strong> Username: </strong> {currentUser.login}</p>
                                    <p><strong> Full Name: </strong> {currentUser.first_name} {currentUser.last_name}</p>
                                    {currentUser.region && <p><strong> Region: </strong> {currentUser.region}</p>}
                                    {currentUser.date_of_birth && <p><strong> Date of Birth: </strong> {currentUser.date_of_birth}</p>}
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
                    <h2> Welcome, {currentUser.first_name || currentUser.login}! </h2>
                    <p> You have successfully logged in. </p>
                </div>

                <div className = "user-profile">
                    {/* Блок з детальною інформацією профілю користувача */}
                    <h3> Your Profile </h3>
                    <div className = "profile-info">
                    {/* Відображаємо інформацію профілю користувача у вигляді карток */}
                        <p><strong> ID: </strong> {currentUser.id}</p>
                        <p><strong> Username: </strong> {currentUser.login}</p>
                        <p><strong> Email: </strong> {currentUser.email}</p>
                        <p><strong> First Name: </strong> {currentUser.first_name}</p>
                        <p><strong> Last Name: </strong> {currentUser.last_name}</p>
                        {currentUser.region && <p><strong> Region: </strong> {currentUser.region}</p>}
                        {currentUser.date_of_birth && <p><strong> Date of Birth: </strong> {currentUser.date_of_birth}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}