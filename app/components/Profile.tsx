
"use client";

// Модальний компонент для редагування профілю користувача
import { useState, useEffect } from "react";
import { User, UKRAINIAN_REGIONS, API_BASE } from "../constants/profileConfig";

{/* Інтерфейс пропсів для компонента Profile, який приймає дані користувача та функцію закриття модалки */}
interface ProfileProps {
    user: User;
    onClose: () => void;
}

export default function Profile({ user, onClose }: ProfileProps) {
    // Локальний стан редагованого профілю, помилок та повідомлень успіху
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
        window.addEventListener("keydown", handleEsc);{/*// Додаємо обробник події для клавіші Escape */}
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Обробник змін полів форми редагування профілю
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {// Оновлюємо локальний стан editData при зміні будь-якого поля форми */}
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
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
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
                    onClose();
                    setEditSuccess("");
                }, 1500);
            } else {
                setEditError(data.error || "Error updating profile. Please try again later.");
            }
        } catch {
            setEditError("Connection error. Please check if the backend is running at http://localhost:10000");
        }
    };

    return (
        // Фонова накладка модального вікна викликає onClose при натисканні поза вікном
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Profile</h2>
                    <button 
                        className="modal-close"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                {editError && <div className="error-message">{editError}</div>}
                {editSuccess && <div className="success-message">{editSuccess}</div>}

                <form onSubmit={handleEditSubmit} className="edit-profile-form">{/*// Форма редагування профілю */}
                    <div className="form-group">
                        <label>First Name</label>
                        <input
                            type="text"
                            name="first_name"
                            value={editData.first_name || ""}
                            onChange={handleEditChange}
                            placeholder="First Name"
                        />
                    </div>

                    <div className="form-group">{/*// Додано поле для прізвища */}
                        <label>Last Name</label>
                        <input
                            type="text"
                            name="last_name"
                            value={editData.last_name || ""}
                            onChange={handleEditChange}
                            placeholder="Last Name"
                        />
                    </div>

                    <div className="form-group"> {/*// Додано поле для вибору регіону */}
                        <label>Region</label>
                        <select
                            name="region"
                            value={editData.region || ""}
                            onChange={handleEditChange}
                        >
                            <option value="">Select Region</option>{/*// Генеруємо меню для вибору регіону з константи UKRAINIAN_REGIONS */}
                            {UKRAINIAN_REGIONS.map((region) => (
                                <option key={region} value={region}>
                                    {region}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">{/*// Додано поле для дати народження */}
                        <label>Date of birth</label>
                        <input
                            type="date"
                            name="date_of_birth"
                            value={editData.date_of_birth || ""}
                            onChange={handleEditChange}
                        />
                    </div>

                    <div className="modal-buttons"> {/*// Кнопки збереження та скасування редагування */}
                        <button type="submit" className="modal-submit-btn">
                            Save
                        </button>
                        <button 
                            type="button" 
                            className="modal-cancel-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
