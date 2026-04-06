"use client";
import { useState } from "react";
import { User, UKRAINIAN_REGIONS, API_BASE } from "../constants/profileConfig";
import Modal from "./Modal";
import "../css/Profile.css";

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

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                    setIsEditing(false);
                    setEditSuccess("");
                }, 1500);
            } else {
                setEditError(data.error || "Error updating profile. Please try again later.");
            }
        } catch {
            setEditError("Connection error. Please check if the backend is running at http://localhost:10000");
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
        <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? "Edit Profile" : "Profile"}>
            {!isEditing ? (
                // Переглядпрофілю
                <div className="profile-view-container">
                    <div className="profile-info-field">
                        <strong>First Name:</strong>
                        <p>{user.first_name || "N/A"}</p>
                    </div>
                    <div className="profile-info-field">
                        <strong>Last Name:</strong>
                        <p>{user.last_name || "N/A"}</p>
                    </div>
                    <div className="profile-info-field">
                        <strong>Region:</strong>
                        <p>{user.region || "N/A"}</p>
                    </div>
                    <div className="profile-info-field">
                        <strong>Date of Birth:</strong>
                        <p>{user.date_of_birth || "N/A"}</p>
                    </div>
                    <div className="modal-buttons profile-buttons-container">
                        <button 
                            className="modal-submit-btn"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </button>
                        <button 
                            className="modal-cancel-btn"
                            onClick={handleClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            ) : (
                // Форма редагування
                <>
                    {editError && <div className="error-message">{editError}</div>}
                    {editSuccess && <div className="success-message">{editSuccess}</div>}

                    <form onSubmit={handleEditSubmit} className="edit-profile-form">
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

                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                value={editData.last_name || ""}
                                onChange={handleEditChange}
                                placeholder="Last Name"
                            />
                        </div>

                        <div className="form-group">
                            <label>Region</label>
                            <select
                                name="region"
                                value={editData.region || ""}
                                onChange={handleEditChange}
                            >
                                <option value="">Select Region</option>
                                {UKRAINIAN_REGIONS.map((region) => (
                                    <option key={region} value={region}>
                                        {region}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Date of birth</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={editData.date_of_birth || ""}
                                onChange={handleEditChange}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="modal-buttons">
                            <button type="submit" className="modal-submit-btn">
                                Save
                            </button>
                            <button 
                                type="button" 
                                className="modal-cancel-btn"
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditData(user);
                                    setEditError("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </>
            )}
        </Modal>
    );
}
