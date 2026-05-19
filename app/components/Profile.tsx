
"use client";

// Модальний компонент для редагування профілю користувача
import { useState, useEffect } from "react";
import { User, UKRAINIAN_REGIONS, API_BASE } from "./constants/profileConfig";
import style from "./css/Profile.css";

// Інтерфейс пропсів для компонента Profile, який приймає дані користувача та функцію закриття модалки
interface ProfileProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
}

export default function Profile({ user, isOpen, onClose }: ProfileProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<User>(user);
    const [editError, setEditError] = useState("");
    const [editSuccess, setEditSuccess] = useState("");

    useEffect(() => {
        // Додаємо закриття модалки через клавішу Escape
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Обробник змін полів форми редагування профілю
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        // Оновлюємо локальний стан editData при зміні будь-якого поля форми
        const { name, value } = e.target;
        setEditData({
            ...editData,
            [name]: value,
        });
    };

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setEditError("");
        setEditSuccess("");

        // Відправляємо оновлені дані профілю на бекенд
        // Тут можна додати локальну валідацію перед запитом, якщо буде потрібно
        try {
            const response = await fetch(`${API_BASE}/api/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    // ВАЖЛИВО: Токен повинен передаватися через HttpOnly cookie,
                    // встановлену на бекенді, а не через Authorization header з localStorage!
                    // credentials: "include" дозволяє браузеру відправляти cookie автоматично
                },
                credentials: "include",
                body: JSON.stringify({
                    first_name: editData.first_name,
                    last_name: editData.last_name,
                    region: editData.region,
                    date_of_birth: editData.date_of_birth,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setEditSuccess("Profile updated successfully!");
                // Оновлюємо дані користувача у localStorage, щоб інші сторінки побачили зміни
                localStorage.setItem("user", JSON.stringify(data.user));
                setTimeout(() => {
                    setIsEditing(false);
                    setEditSuccess("");
                }, 1500);
            } else {
                setEditError(data.error || "Error updating profile. Please try again later.");
            }
        } catch {
            setEditError("Connection error. Please try again later.");
            // Логування деталей тільки в консоль для розробників
            console.error("Failed to update profile. Backend connection error.");
        }
    };

    const handleClose = () => {
        setIsEditing(false);
        setEditError("");
        setEditSuccess("");
        setEditData(user);
        onClose();
    };

    return (
        <div className = "modal-overlay" onClick = {handleClose}>
            <div className = "modal-content" onClick = {(e) => e.stopPropagation()}>
                <div className = "modal-header">
                    <h2>Edit Profile</h2>
                    <button
                        type = "button"
                        className = "modal-close"
                        onClick = {handleClose}
                    >
                        ✕
                    </button>
                </div>

                {editError && <div className = "error-message">{editError}</div>}
                {editSuccess && <div className = "success-message">{editSuccess}</div>}

                <form onSubmit={handleEditSubmit} className = "edit-profile-form">
                    <div className = "form-group">
                        <label> First Name </label>
                        <input
                            type = "text"
                            name="first_name"
                            value = {editData.first_name || ""}
                            onChange={handleEditChange}
                            placeholder="First Name"
                        />
                    </div>

                    <div className = "form-group">
                        <label> Last Name </label>
                        <input
                            type = "text"
                            name="last_name"
                            value = {editData.last_name || ""}
                            onChange={handleEditChange}
                            placeholder="Last Name"
                        />
                    </div>

                    <div className = "form-group">
                        <label> Region </label>
                        <select
                            name="region"
                            value = {editData.region || ""}
                            onChange={handleEditChange}
                        >
                            <option value = ""> Select Region </option>
                            {UKRAINIAN_REGIONS.map((region) => (
                                <option key={region} value = {region}>
                                    {region}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className = "form-group">
                        <label> Date of birth </label>
                        <input
                            type = "date"
                            name="date_of_birth"
                            value = {editData.date_of_birth || ""}
                            onChange={handleEditChange}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className = "modal-buttons">
                        <button type = "submit" className = "modal-submit-btn">
                            Save
                        </button>
                        <button
                            type = "button"
                            className = "modal-cancel-btn"
                            onClick = {handleClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
