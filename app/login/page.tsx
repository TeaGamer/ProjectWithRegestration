"use client";
import { useState } from "react";
import "../static/css/login.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
        remember: false,
    });
    const [registerData, setRegisterData] = useState({
        login: "",
        email: "",
        password: "",
        confirmPassword: "",
        first_name: "",
        last_name: "",
        region: "",
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

        if (!loginData.email || !loginData.email.includes("@")) {
            setError("Введіть коректну пошту!");
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    login: loginData.email,
                    password: loginData.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess("Успішно увійшли! Перенаправляємо...");
                // Збереження токена
                if (data.token) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                }
                setTimeout(() => {
                    window.location.href = "/Dashboard";
                }, 1500);
            } else {
                setError(data.error || "Невірна пошта або пароль!");
            }
        } catch (err) {
            setError("Помилка з'єднання з сервером. Спробуйте ще раз.");
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

        if (!registerData.email || !registerData.email.includes("@")) {
            setError("Введіть коректну пошту!");
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

        if (!registerData.login.trim()) {
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
                    login: registerData.login,
                    email: registerData.email,
                    password: registerData.password,
                    first_name: registerData.first_name || registerData.login,
                    last_name: registerData.last_name || "",
                    region: registerData.region || "Ukraine",
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess("Реєстрація успішна! Переходимо до входу...");
                setRegisterData({ 
                    login: "", 
                    email: "", 
                    password: "", 
                    confirmPassword: "", 
                    first_name: "",
                    last_name: "",
                    region: "Ukraine",
                    agreedToTerms: false 
                });
                setTimeout(() => {
                    setIsLogin(true);
                    setSuccess("");
                }, 1500);
            } else {
                setError(data.error || "Помилка реєстрації. Можливо, цей email вже зареєстрований.");
            }
        } catch (err) {
            setError("Помилка з'єднання з сервером. Перевірте, чи запущен бекенд на http://localhost:8000");
        }
    };

    const termsAndConditionsText = `
TERMS OF SERVICE
By using the Alex service, you agree to these terms. The service is provided "as is". We do not guarantee 100% accuracy of AI responses. It is prohibited to use the service for unlawful activities.
Prohibited:
- spam
- harassment
- illegal activity
- exploitation of AI

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
                                name="email"
                                placeholder="Пошта"
                                type="email"
                                value={loginData.email}
                                onChange={handleLoginChange}
                                autoComplete="email"
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
                                name="login"
                                placeholder="Ім'я користувача"
                                type="text"
                                value={registerData.login}
                                onChange={handleRegisterChange}
                                required
                            />

                            <input
                                name="email"
                                placeholder="Пошта"
                                type="email"
                                value={registerData.email}
                                onChange={handleRegisterChange}
                                required
                            />

                            <input
                                name="first_name"
                                placeholder="Ім'я"
                                type="text"
                                value={registerData.first_name}
                                onChange={handleRegisterChange}
                            />

                            <input
                                name="last_name"
                                placeholder="Прізвище"
                                type="text"
                                value={registerData.last_name}
                                onChange={handleRegisterChange}
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

                            <select
                                name="region"
                                value={registerData.region}
                                onChange={handleRegisterChange}
                            >
                                <option value="">Оберіть регіон</option>
                                <option value="Ukraine">Вся Україна</option>
                                <option value="Kyiv">Київ</option>
                                <option value="Kharkiv">Харків</option>
                                <option value="Odesa">Одеса</option>
                                <option value="Dnipropetrovsk">Дніпропетровськ</option>
                                <option value="Lviv">Львів</option>
                                <option value="Zaporizhzhia">Запоріжжя</option>
                                <option value="Mykolaiv">Миколаїв</option>
                                <option value="Donetsk">Донецьк</option>
                                <option value="Luhansk">Луганськ</option>
                                <option value="Kherson">Херсон</option>
                                <option value="Chernihiv">Чернігів</option>
                                <option value="Cherkasy">Черкаси</option>
                                <option value="Poltava">Полтава</option>
                                <option value="Sumy">Суми</option>
                                <option value="Vinnytsia">Вінниця</option>
                                <option value="Rivne">Рівне</option>
                                <option value="Zhytomyr">Житомир</option>
                                <option value="Khmelnytskyi">Хмельницький</option>
                                <option value="Ternopil">Тернопіль</option>
                                <option value="Ivano-Frankivsk">Івано-Франківськ</option>
                                <option value="Volyn">Волинь</option>
                            </select>

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
