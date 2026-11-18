"use client";

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
        return <div className = "dashboard-container"><p> Loading... </p></div>;
    }

    const currentUser: User = user ?? {
        id: 0,
        login: "Guest",
        email: "",
        first_name: "Guest",
        last_name: "",
    };

    return (
        <div className = "dashboard-layout">
            {/* Маленьке акуратне віконце по центру */}
            <div className = "dashboard-info-popup">
                <div className = "info-popup-header">
                    <div>
                        <h2> Quick Info </h2>
                        <p> User profile details </p>
                    </div>
                    {/* Кнопка повернення до календаря */}
                    <button className = "close-info-btn" onClick={() => router.push("/Kalendar")}>×</button>
                </div>
                
                <div className = "info-popup-body">
                    <p><strong> User: </strong> {currentUser.first_name || currentUser.login}</p>
                    <p><strong> First name: </strong> {currentUser.first_name || " —— "}</p>
                    <p><strong> Last name: </strong> {currentUser.last_name || " —— "}</p>
                    <p><strong> Login: </strong> {currentUser.login}</p>
                    <p><strong> Email: </strong> {currentUser.email || "Not set"}</p>
                    {currentUser.region && <p><strong> Country: </strong> {currentUser.region}</p>}
                    {currentUser.timezone_name && <p><strong> Time zone: </strong> {currentUser.timezone_name}</p>}
                </div>
            </div>
        </div>
    );
}