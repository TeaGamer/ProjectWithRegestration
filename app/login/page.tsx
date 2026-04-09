
"use client";
// Компонент сторінки логіну/реєстрації, що рендериться на клієнті
import { useState, useEffect } from "react";
import "../css/login.css";
import "../constants/profileConfig";
import { UKRAINIAN_REGIONS } from "../constants/profileConfig";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:100000";

export default function LoginPage() {
    // Прапорці, які керують формою та її станом
    const [isLogin, setIsLogin] = useState(true);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);

    useEffect(() => {
        // Закриваємо модалку з правилами при натисканні Escape
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && showTermsModal) {
                setShowTermsModal(false);
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [showTermsModal]);
    // Стан полів форми логіну: email, пароль та запам'ятати мене
    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
        remember: false,
    });
    // Стан полів форми реєстрації, що містить усі дані користувача
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

    // Оновлюємо стан полів форми логіну або реєстрації при зміні значень
    // Оновлюємо значення полів логіну при введенні користувачем
    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, type, checked, value } = e.target as HTMLInputElement;
        setLoginData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // Оновлюємо значення полів реєстрації при введенні користувачем
    const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, type, checked, value } = e.target as HTMLInputElement;
        setRegisterData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Перевірка базових даних перед відправкою логіну
        if (!loginData.email || !loginData.email.includes("@")) {
            setError("Use correct email!");
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
                setSuccess("Successfully logged in! Redirecting...");
                // Save token
                if (data.token) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                    // Set cookie for middleware
                    document.cookie = `token=${data.token}; path=/; max-age=86400`; // 1 day
                }
                setTimeout(() => {
                    window.location.href = "/Kalendar";
                }, 1500);
            } else {
                setError(data.error || "Invalid email or password!");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Перевіряємо, що користувач погодився з правилами перед реєстрацією
        if (!registerData.agreedToTerms) {
            setError("You must accept the Terms of Service!");
            return;
        }

        if (!registerData.email || !registerData.email.includes("@")) {
            setError("Enter a valid email!");
            return;
        }

        if (registerData.password !== registerData.confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        if (registerData.password.length < 6) {
            setError("Password must be at least 6 characters long!");
            return;
        }

        if (!registerData.login.trim()) {
            setError("Enter a username!");
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
                setSuccess("Registration successful! Redirecting to login...");
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
                setError(data.error || "Registration error. This email may already be registered.");
            }
        } catch (err) {
            setError("Connection error. Please check if the backend is running at http://localhost:8000");
        }
    };

    const termsAndConditionsText = `
ПРАВИЛА КОРИСТУВАННЯ СЕРВІСОМ ALEX

1. ЗАГАЛЬНІ ПОЛОЖЕННЯ
Використовуючи сервіс Alex, ви погоджуєтеся з цими правилами. Сервіс надається "як є". Ми не гарантуємо 100% точності відповідей ШІ. Заборонено використовувати сервіс для незаконних дій.

2. ЗАБОРОНЕНО:
- Спам та масові розсилки
- Переслідування та залякування інших користувачів
- Незаконна діяльність будь-якого виду
- Зловживання можливостями ШІ для шкідливих цілей
- Поширення шкідливого програмного забезпечення
- Порушення авторських прав

3. ПРАВА КОРИСТУВАЧА
Користувач має право:
- Отримувати доступ до своїх даних
- Видаляти свій обліковий запис
- Змінювати свої персональні дані
- Припинити використання сервісу в будь-який час
- Редагувати свій профіль
- Експортувати свої дані
- Знати, які дані зберігаються та з якою метою

4. ОБОВ'ЯЗКИ КОРИСТУВАЧА
Користувач зобов'язаний:
- Надавати достовірну інформацію при реєстрації
- Не поширювати конфіденційну інформацію
- Повідомляти про порушення безпеки
- Дотримуватися етичних норм використання ШІ

5. КОНФІДЕНЦІЙНІСТЬ
Ми збираємо та обробляємо ваші дані відповідно до політики конфіденційності. Ваші дані захищені та не передаються третім сторонам без вашої згоди.

6. ВІДПОВІДАЛЬНІСТЬ
Сервіс Alex не несе відповідальності за:
- Неправильні відповіді ШІ
- Втрату даних через технічні проблеми
- Дії інших користувачів

7. ЗМІНИ ПРАВИЛ
Ми можемо змінювати ці правила в будь-який час. Продовження використання сервісу після змін означає вашу згоду з новими правилами.

Погоджуючись з цими правилами та умовами, ви підтверджуєте та приймаєте всі вищезазначені положення.
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
                        Log In
                    </button>
                    <button
                        className={`tab-btn ${!isLogin ? "active" : ""}`}
                        onClick={() => {
                            setIsLogin(false);
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Register
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {/* Login Form */}
                {isLogin && (
                    // Відображення форми логіну, якщо обрана вкладка Log In
                    <div className="form-container">
                        <h2>Log In</h2>
                        <form className="login-form" onSubmit={handleLoginSubmit}>
                            <input
                                name="email"
                                placeholder="Email"
                                type="email"
                                value={loginData.email}
                                onChange={handleLoginChange}
                                autoComplete="email"
                                required
                            />

                            <div className="password-input-wrapper">
                                <input
                                    name="password"
                                    type={showLoginPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={loginData.password}
                                    onChange={handleLoginChange}
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    className="password-toggle-btn"
                                    aria-label="Toggle password visibility"
                                >
                                    {showLoginPassword ? "1" : "0"}
                                </button>
                            </div>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={loginData.remember}
                                    onChange={handleLoginChange}
                                />
                                {" "}Remember me
                            </label>

                            <button 
                                type="submit" 
                                className="submit-btn"
                                onMouseMove={(e) => {
                                    if (!loginData.email.trim() || !loginData.password.trim()) {
                                        const btn = e.currentTarget;
                                        const rect = btn.getBoundingClientRect();
                                        const centerX = rect.left + rect.width / 2;
                                        const centerY = rect.top + rect.height / 2;
                                        const mouseX = e.clientX;
                                        const mouseY = e.clientY;
                                        
                                        const deltaX = mouseX - centerX;
                                        const deltaY = mouseY - centerY;
                                        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                                        
                                        if (distance < 100) { // Зона втечі
                                            const moveX = (deltaX / distance) * 50;
                                            const moveY = (deltaY / distance) * 50;
                                            btn.style.transform = `translate(${moveX}px, ${moveY}px)`;
                                        } else {
                                            btn.style.transform = 'translate(0, 0)';
                                        }
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translate(0, 0)';
                                }}
                            >
                                Log In
                            </button>
                        </form>
                    </div>
                )}

                {/* Register Form */}
                {!isLogin && (
                    // Відображення форми реєстрації, якщо активна вкладка Register
                    <div className="form-container">
                        <h2>Create Account</h2>
                        <form className="login-form" onSubmit={handleRegisterSubmit}>
                            <input
                                name="login"
                                placeholder="Username"
                                type="text"
                                value={registerData.login}
                                onChange={handleRegisterChange}
                                required
                            />

                            <input
                                name="email"
                                placeholder="Email"
                                type="email"
                                value={registerData.email}
                                onChange={handleRegisterChange}
                                required
                            />

                            <input
                                name="first_name"
                                placeholder="First Name"
                                type="text"
                                value={registerData.first_name}
                                onChange={handleRegisterChange}
                            />

                            <input
                                name="last_name"
                                placeholder="Last Name"
                                type="text"
                                value={registerData.last_name}
                                onChange={handleRegisterChange}
                            />

                            <div className="password-input-wrapper">
                                <input
                                    name="password"
                                    type={showRegisterPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={registerData.password}
                                    onChange={handleRegisterChange}
                                    id="pwd"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                    className="password-toggle-btn"
                                    aria-label="Toggle password visibility"
                                >
                                    {showRegisterPassword ? "1" : "0"}
                                </button>
                            </div>

                            <input
                                name="confirmPassword"
                                type="password"
                                placeholder="Confirm Password"
                                value={registerData.confirmPassword}
                                onChange={handleRegisterChange}
                                required
                            />

                            <select
                                name="region"
                                value={registerData.region}
                                onChange={handleRegisterChange}
                            >
                                {UKRAINIAN_REGIONS.map((region) => (
                                    <option key={region} value={region}>
                                        {region}
                                    </option>
                                ))}
                            </select>

                            <label className="checkbox-label">
                                {/* Прапорець згоди з умовами використання перед реєстрацією */}
                                <input
                                    type="checkbox"
                                    name="agreedToTerms"
                                    checked={registerData.agreedToTerms}
                                    onChange={handleRegisterChange}
                                />
                                {" "}I agree to the{" "}
                                <button
                                    type="button"
                                    className="terms-link"
                                    onClick={() => setShowTermsModal(true)}
                                >
                                    Terms of Service
                                </button>
                            </label>

                            <button type="submit" className="submit-btn">
                                Register
                            </button>
                        </form>
                    </div>
                )}

                {/* Terms Modal */}
                {showTermsModal && (
                    // Модальне вікно з текстом умов використання
                    <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Terms of Service</h3>
                            </div>
                            <div className="modal-body">
                                <pre>{termsAndConditionsText}</pre>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="modal-btn"
                                    onClick={() => setShowTermsModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
