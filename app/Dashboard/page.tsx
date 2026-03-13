"use client";
import { useState, useEffect } from "react";
import "../css/dashboard.css";

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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
            console.error("Error parsing user data:", e);
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
                setEditSuccess("Profile updated successfully!");
                // Update user in localStorage
                localStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
                setTimeout(() => {
                    setShowEditModal(false);
                    setEditSuccess("");
                }, 1500);
            } else {
                setEditError(data.error || "Error updating profile. Please try again later.");
            }
        } catch (err) {
            setEditError("Connection error. Please check if the backend is running at http://localhost:8000");
        }
    };

    if (loading) {
        return <div className="dashboard-container"><p>Loading...</p></div>;
    }

    if (!user) {
        return <div className="dashboard-container"><p>User not found</p></div>;
    }

    return (
        <div className="dashboard-layout">
            {/* Topbar */}
            <div className="topbar">
                <div className="topbar-left">
                    <h1>Dashboard</h1>
                </div>
                <div className="topbar-right">
                    <div className="user-info-display">
                        <span className="username-display">{user.login}</span>
                    </div>
                    <div className="profile-avatar-wrapper">
                        <button
                            className="profile-avatar-btn"
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            title="User Profile"
                        >
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="User Avatar"
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
                                            alt="User Avatar"
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
                                    <p><strong>Username:</strong> {user.login}</p>
                                    <p><strong>Full Name:</strong> {user.first_name} {user.last_name}</p>
                                    {user.region && <p><strong>Region:</strong> {user.region}</p>}
                                    {user.date_of_birth && <p><strong>Date of Birth:</strong> {user.date_of_birth}</p>}
                                </div>

                                <div className="profile-menu-divider"></div>

                                <button 
                                    className="profile-menu-edit"
                                    onClick={() => {
                                        setShowEditModal(true);
                                        setShowProfileMenu(false);
                                    }}
                                >
                                    Edit Profile
                                </button>

                                <button className="profile-menu-logout" onClick={handleLogout}>
                                    Log Out
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
                            <h2>Edit Profile</h2>
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
                                <label>First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={editData?.first_name || ""}
                                    onChange={handleEditChange}
                                    placeholder="First Name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={editData?.last_name || ""}
                                    onChange={handleEditChange}
                                    placeholder="Last Name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Region</label>
                                <select
                                    name="region"
                                    value={editData?.region || ""} //базове значення в "",внизу всі знячення value="Значення" 
                                    onChange={handleEditChange}
                                >
                                    <option value="">Select Region</option> 
                                    <option value="Ukraine">All Ukraine</option>
                                    <option value="Kyiv">Kyiv</option>
                                    <option value="Kharkiv">Kharkiv</option>
                                    <option value="Odesa">Odesa</option>
                                    <option value="Dnipropetrovsk">Dnipro</option>
                                    <option value="Lviv">Lviv</option>
                                    <option value="Zaporizhzhia">Zaporizhzhia</option>
                                    <option value="Mykolaiv">Mykolaiv</option>
                                    <option value="Donetsk">Donetsk</option>
                                    <option value="Luhansk">Luhansk</option>
                                    <option value="Kherson">Kherson</option>
                                    <option value="Chernihiv">Chernihiv</option>
                                    <option value="Cherkasy">Cherkasy</option>
                                    <option value="Poltava">Poltava</option>
                                    <option value="Sumy">Sumy</option>
                                    <option value="Vinnytsia">Vinnytsia</option>
                                    <option value="Rivne">Rivne</option>
                                    <option value="Zhytomyr">Zhytomyr</option>
                                    <option value="Khmelnytskyi">Khmelnytskyi</option>
                                    <option value="Ternopil">Ternopil</option>
                                    <option value="Ivano-Frankivsk">Ivano-Frankivsk</option>
                                    <option value="Volyn">Volyn</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Date of birth</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={editData?.date_of_birth || ""}
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
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="dashboard-container">
                <div className="welcome-message">
                    <h2>Welcome, {user.first_name || user.login}!</h2>
                    <p>You have successfully logged in.</p>
                </div>

                <div className="user-profile">
                    <h3>Your Profile</h3>
                    <div className="profile-info">
                        <p><strong>ID:</strong> {user.id}</p>
                        <p><strong>Username:</strong> {user.login}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>First Name:</strong> {user.first_name}</p>
                        <p><strong>Last Name:</strong> {user.last_name}</p>
                        {user.region && <p><strong>Region:</strong> {user.region}</p>}
                        {user.date_of_birth && <p><strong>Date of Birth:</strong> {user.date_of_birth}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
