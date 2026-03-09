"use client";
import { useState } from "react";
import Link from "next/link";
import "../static/css/register.css";

const API_BASE = "http://localhost:8000";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        login: "",
        email: "",
        password: "",
        confirmPassword: "",
        first_name: "",
        last_name: "",
        region: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Валідация
        if (!formData.email || !formData.email.includes("@")) {
            setError("Введіть коректну пошту!");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Паролі не збігаються!");
            return;
        }

        if (formData.password.length < 6) {
            setError("Пароль повинен мати мінімум 6 символів!");
            return;
        }

        if (!formData.login.trim()) {
            setError("Введіть ім'я користувача!");
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    login: formData.login,
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.first_name || formData.login,
                    last_name: formData.last_name || "",
                    region: formData.region || "Ukraine",
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess("Реєстрація успішна! Перенаправляємо на вхід...");
                // Збереження токена
                if (data.token) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                }
                setFormData({ 
                    login: "", 
                    email: "", 
                    password: "", 
                    confirmPassword: "",
                    first_name: "",
                    last_name: "",
                    region: "",
                });
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            } else {
                setError(data.error || "Помилка реєстрації. Спробуйте ще раз.");
            }
        } catch (err) {
            setError("Помилка з'єднання з сервером. Спробуйте ще раз.");
        }
    };

    return (
        <div className="register-container">
            <div className="register-form-wrapper">
                <h1>Створити акаунт</h1>

                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="login">Ім'я користувача</label>
                        <input
                            type="text"
                            id="login"
                            name="login"
                            value={formData.login}
                            onChange={handleChange}
                            required
                            placeholder="Введіть ім'я користувача"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Пошта</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Введіть вашу пошту"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="first_name">Ім'я</label>
                        <input
                            type="text"
                            id="first_name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="Введіть ваше ім'я"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="last_name">Прізвище</label>
                        <input
                            type="text"
                            id="last_name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Введіть ваше прізвище"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Введіть пароль (мін. 6 символів)"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Підтвердіть пароль</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Повторіть пароль"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="region">Регіон</label>
                        <input
                            type="text"
                            id="region"
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                            placeholder="Введіть ваш регіон (наприклад, Ukraine)"
                        />
                    </div>

                    <button type="submit">Зареєструватися</button>
                </form>

                <div className="login-link">
                    Вже маєте акаунт?{" "}
                    <Link href="/login">Увійти</Link>
                </div>
            </div>
        </div>
    );
}
