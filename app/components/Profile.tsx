"use client";
import { useState } from "react";
import { User, UKRAINIAN_REGIONS, API_BASE } from "../constants/profileConfig";
import Modal from "./Modal";

interface ProfileProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
}

export default function Profile({ user, isOpen, onClose }: ProfileProps) {
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
                // Update user in localStorage
                localStorage.setItem("user", JSON.stringify(data.user));
                setTimeout(() => {
                    onClose();
                    setEditSuccess("");
                }, 1500);
            } else {
                setEditError(data.error || "Error updating profile. Please try again later.");
            }
        } catch (err) {
            setEditError("Connection error. Please check if the backend is running at http://localhost:10000");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
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
                        />
                    </div>

                    <div className="modal-buttons">
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
        </Modal>
    );
}
