"use client";
import { useState } from "react";
import "../static/css/login.css";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [loginData, setLoginData] = useState({
        username: "",
        password: "",
        remember: false,
    });
    const [registerData, setRegisterData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        agreedToTerms: false,
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, type, checked, value } = e.target;
        setLoginData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, type, checked, value } = e.target;
        setRegisterData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: loginData.username,
                    password: loginData.password,
                    remember: loginData.remember,
                }),
            });

            if (response.ok) {
                setSuccess("Успішно увійшли! Перенаправляємо...");
                setTimeout(() => {
                    window.location.href = "/Dashboard";
                }, 1500);
            } else {
                setError("Невірне ім'я користувача або пароль!");
            }
        } catch (err) {
            setError("Помилка з'єднання. Спробуйте ще раз.");
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!registerData.agreedToTerms) {
            setError("Ви повинні прийняти Умови обслуговування!");
            return;
        }

        if (registerData.password !== registerData.confirmPassword) {
            setError("Паролі не збігаються!");
            return;
        }

        if (registerData.password.length < 6) {
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
                    username: registerData.username,
                    password: registerData.password,
                }),
            });

            if (response.ok) {
                setSuccess("Реєстрація успішна! Переходимо до входу...");
                setRegisterData({ username: "", password: "", confirmPassword: "", agreedToTerms: false });
                setTimeout(() => {
                    setIsLogin(true);
                    setSuccess("");
                }, 1500);
            } else {
                setError("Помилка реєстрації. Ім'я користувача може вже існувати.");
            }
        } catch (err) {
            setError("Помилка з'єднання. Спробуйте ще раз.");
        }
    };

    const termsAndConditionsText = `
TERMS OF SERVICE

By using the Alex service, you agree to these terms.

The service is provided "as is". We do not guarantee 100% accuracy of AI responses.

It is prohibited to use the service for unlawful activities.

Prohibited:
- spam
- harassment
- illegal activity
- exploitation of AI

The administration may block users.

We reserve the right to change these terms without prior notice.


USER RIGHTS

User has the right to:
- Obtain access to your data
- Delete your account
- Change your personal data
- Refrain from using the service at any time
- Edit their profile
- Export data
- Know what data is stored and for what purpose

By agreeing to these terms and conditions, you acknowledge and accept all of the above.
    `.trim();

    return (
        <div className="login-container">
            <div className="login-form-wrapper">
                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab-btn ${isLogin ? "active" : ""}`}
                        onClick={() => {
                            setIsLogin(true);
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Вхід
                    </button>
                    <button
                        className={`tab-btn ${!isLogin ? "active" : ""}`}
                        onClick={() => {
                            setIsLogin(false);
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Реєстрація
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {/* Login Form */}
                {isLogin && (
                    <div className="form-container">
                        <h2>Вхід</h2>
                        <form className="login-form" onSubmit={handleLoginSubmit}>
                            <input
                                name="username"
                                placeholder="Ім'я користувача"
                                type="text"
                                value={loginData.username}
                                onChange={handleLoginChange}
                                autoComplete="username"
                                required
                            />

                            <input
                                name="password"
                                type="password"
                                placeholder="Пароль"
                                value={loginData.password}
                                onChange={handleLoginChange}
                                autoComplete="current-password"
                                required
                            />

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={loginData.remember}
                                    onChange={handleLoginChange}
                                />
                                {" "}Запам'ятати мене
                            </label>

                            <button type="submit" className="submit-btn">
                                Увійти
                            </button>
                        </form>
                    </div>
                )}

                {/* Register Form */}
                {!isLogin && (
                    <div className="form-container">
                        <h2>Створити акаунт</h2>
                        <form className="login-form" onSubmit={handleRegisterSubmit}>
                            <input
                                name="username"
                                placeholder="Ім'я користувача"
                                type="text"
                                value={registerData.username}
                                onChange={handleRegisterChange}
                                required
                            />

                            <input
                                name="password"
                                type="password"
                                placeholder="Пароль"
                                value={registerData.password}
                                onChange={handleRegisterChange}
                                required
                            />

                            <input
                                name="confirmPassword"
                                type="password"
                                placeholder="Підтвердіть пароль"
                                value={registerData.confirmPassword}
                                onChange={handleRegisterChange}
                                required
                            />

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="agreedToTerms"
                                    checked={registerData.agreedToTerms}
                                    onChange={handleRegisterChange}
                                />
                                {" "}Я согласен з{" "}
                                <button
                                    type="button"
                                    className="terms-link"
                                    onClick={() => setShowTermsModal(true)}
                                >
                                    Умовами обслуговування
                                </button>
                            </label>

                            <button type="submit" className="submit-btn">
                                Зареєструватися
                            </button>
                        </form>
                    </div>
                )}

                {/* Terms Modal */}
                {showTermsModal && (
                    <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Умови обслуговування</h3>
                                <button
                                    className="modal-close"
                                    onClick={() => setShowTermsModal(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="modal-body">
                                <pre>{termsAndConditionsText}</pre>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="modal-btn"
                                    onClick={() => setShowTermsModal(false)}
                                >
                                    Закрити
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
