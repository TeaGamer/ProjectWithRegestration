"use client";
import { useState } from "react";
import Link from "next/link";
import "../static/css/register.css";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
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

        if (formData.password !== formData.confirmPassword) {
            setError("Паролі не збігаються!");
            return;
        }

        if (formData.password.length < 6) {
            setError("Пароль повинен мати мінімум 6 символів!");
            return;
        }

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                }),
            });

            if (response.ok) {
                setSuccess("Реєстрація успішна! Перенаправляємо...");
                setFormData({ username: "", password: "", confirmPassword: "" });
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            } else {
                setError("Помилка реєстрації. Спробуйте ще раз.");
            }
        } catch (err) {
            setError("Помилка з'єднання. Спробуйте ще раз.");
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
                        <label htmlFor="username">Ім'я користувача</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="Введіть ім'я користувача"
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
                            placeholder="Введіть пароль"
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
