"use client";
{/* І нахера їм цей Dashboard?? */}
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../css/Dashboard.css";
import { User } from "../constants/profileConfig";

export default function Dashboard(): import("react/jsx-runtime").JSX.Element {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [chatLanguage, setChatLanguage] = useState<"uk" | "pl" | "en">("en");

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

        const savedChatLanguage = localStorage.getItem("interfaceLanguage") as "uk" | "pl" | "en" | null;
        if (savedChatLanguage && ["uk", "pl", "en"].includes(savedChatLanguage)) {
            setChatLanguage(savedChatLanguage);
            document.documentElement.lang = savedChatLanguage;
        }

        setLoading(false);
    }, []);

    const changeChatLanguage = (language: "uk" | "pl" | "en") => {
        setChatLanguage(language);
        localStorage.setItem("interfaceLanguage", language);
        document.documentElement.lang = language;
    };

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
                {/* Тіло вікна з інформацією про користувача */}
                <div className = "info-popup-body">
                    <p><strong> User: </strong> {currentUser.first_name || currentUser.login}</p>
                    <p><strong> First name: </strong> {currentUser.first_name || " —— "}</p>
                    <p><strong> Last name: </strong> {currentUser.last_name || " —— "}</p>
                    <p><strong> Login: </strong> {currentUser.login}</p>
                    <p><strong> Email: </strong> {currentUser.email || "Not set"}</p>
                    <p className="chat-language-setting">
                        <strong> Мова чату: </strong>
                        <select
                            value={chatLanguage}
                            onChange={(event) => changeChatLanguage(event.target.value as "uk" | "pl" | "en")}
                            aria-label="Мова чату"
                        >
                            <option value="uk">Українська</option>
                            <option value="pl">Polski</option>
                            <option value="en">English</option>
                        </select>
                    </p>
                    {currentUser.region && <p><strong> Country: </strong> {currentUser.region}</p>}
                    {currentUser.timezone_name && <p><strong> Time zone: </strong> {currentUser.timezone_name}</p>}
                </div>
            </div>
        </div>
    );
}