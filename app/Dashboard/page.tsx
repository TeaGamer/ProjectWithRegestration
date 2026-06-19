"use client";

// Цей компонент виконується на клієнтській стороні і взаємодіє з localStorage
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../css/Dashboard.css";
import { User } from "../constants/profileConfig";

export default function Dashboard(): import("react/jsx-runtime").JSX.Element {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

    if (loading) {
        return <div className="dashboard-container"><p>Loading ...</p></div>;
    }

    const currentUser: User = user ?? {
        id: 0,
        login: "Guest",
        email: "",
        first_name: "Guest",
        last_name: "",
    };

    return (
        /* Фікс: змінено "Dashboard-layout" на "dashboard-layout" для збігу з CSS */
        <div className="dashboard-layout">
            <div className="dashboard-info-popup">
                <div className="info-popup-header">
                    <div>
                        <h2>Quick Info</h2>
                        <p>Small info panel opened from the calendar.</p>
                    </div>
                    <button className="close-info-btn" onClick={() => router.push("/Kalendar")}>Close</button>
                </div>
                <div className="info-popup-body">
                    <p><strong>User:</strong> {currentUser.first_name || currentUser.login}</p>
                    <p><strong>Login:</strong> {currentUser.login}</p>
                    <p><strong>Email:</strong> {currentUser.email || "Not set"}</p>
                    {currentUser.region && <p><strong>Region:</strong> {currentUser.region}</p>}
                    {currentUser.date_of_birth && <p><strong>Date of Birth:</strong> {currentUser.date_of_birth}</p>}
                </div>
            </div>
        </div>
    );
}