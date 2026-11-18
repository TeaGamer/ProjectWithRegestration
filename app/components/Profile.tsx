
"use client";

// Модальний компонент для редагування профілю користувача
import { useState, useEffect } from "react";
import { API_BASE, type User } from "../constants/profileConfig";
import {
    COUNTRY_OPTIONS,
    getCountryIdByName,
    getCountryTimezones,
    getDefaultTimezoneForCountry,
    getTimezoneLabel,
} from "../constants/countryTimezones";
import "../css/Profile.css";

// Інтерфейс пропсів для компонента Profile, який приймає дані користувача та функцію закриття модалки
interface ProfileProps {
    user: User;
    onClose: () => void;
    onUserUpdated: (user: User) => void;
}

function normalizedProfile(user: User): User {
    const country = COUNTRY_OPTIONS.find(({ name }) => name === user.region);
    const region = country?.name ?? "Poland";
    const countryId = country?.id ?? "PL";
    const timezoneName = getCountryTimezones(countryId).includes(user.timezone_name || "")
        ? user.timezone_name!
        : getDefaultTimezoneForCountry(countryId, "Europe/Warsaw");

    return { ...user, region, timezone_name: timezoneName };
}

export default function Profile({ user, onClose, onUserUpdated }: ProfileProps) {
    const [editData, setEditData] = useState<User>(() => normalizedProfile(user));
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

    useEffect(() => {
        setEditData(normalizedProfile(user));
    }, [user]);

    // Обробник змін полів форми редагування профілю
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        // Оновлюємо локальний стан editData при зміні будь-якого поля форми
        const { name, value } = e.target;
        if (name === "region") {
            setEditData((previous) => ({
                ...previous,
                region: value,
                timezone_name: getDefaultTimezoneForCountry(getCountryIdByName(value)),
            }));
            return;
        }
        setEditData((previous) => ({ ...previous, [name]: value }));
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
                    timezone_name: editData.timezone_name,
                    date_of_birth: editData.date_of_birth,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setEditSuccess("Profile updated successfully!");
                // Оновлюємо дані користувача у localStorage, щоб інші сторінки побачили зміни
                localStorage.setItem("user", JSON.stringify(data.user));
                onUserUpdated(data.user);
                setTimeout(() => {
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
        setEditError("");
        setEditSuccess("");
        setEditData(user);
        onClose();
    };

    return (
        <div className = "modal-overlay" onClick = {handleClose}>
            <div className = "modal-content" onClick = {(e) => e.stopPropagation()}>
                <div className = "modal-header">
                    <h2> Edit Profile </h2>
                    <button
                        type = "button"
                        className = "modal-close"
                        onClick = {handleClose}
                    > ✕ </button>
                </div>

                {editError && <div className = "error-message">{editError}</div>}
                {editSuccess && <div className = "success-message">{editSuccess}</div>}

                <form onSubmit = {handleEditSubmit} className = "edit-profile-form">
                    <div className = "form-group">
                        <label> First Name </label>
                        <input
                            type = "text"
                            name = "first_name"
                            value = {editData.first_name || ""}
                            onChange = {handleEditChange}
                            placeholder = "First Name"
                        />
                    </div>

                    <div className = "form-group">
                        <label> Last Name </label>
                        <input
                            type = "text"
                            name = "last_name"
                            value = {editData.last_name || ""}
                            onChange = {handleEditChange}
                            placeholder = "Last Name"
                        />
                    </div>

                    <div className = "form-group">
                        <label htmlFor = "profile-country">Country</label>
                        <select
                            id = "profile-country"
                            name = "region"
                            value = {editData.region || ""}
                            onChange = {handleEditChange}
                        >
                            {COUNTRY_OPTIONS.map((country) => (
                                <option key={country.id} value = {country.name}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className = "form-group">
                        <label htmlFor = "profile-timezone">Time zone</label>
                        <select
                            id = "profile-timezone"
                            name = "timezone_name"
                            value = {editData.timezone_name || ""}
                            onChange = {handleEditChange}
                        >
                            {getCountryTimezones(getCountryIdByName(editData.region || "Poland")).map((timezone) => (
                                <option key={timezone} value = {timezone}>
                                    {getTimezoneLabel(timezone)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className = "form-group">
                        <label> Date of birth </label>
                        <input
                            type = "date"
                            name = "date_of_birth"
                            value = {editData.date_of_birth || ""}
                            onChange = {handleEditChange}
                            max = {new Date().toISOString().split('T')[0]}
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
