
"use client";
// Компонент сторінки логіну/реєстрації, що рендериться на клієнті
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../css/Login.css";
import { UKRAINIAN_REGIONS } from "../constants/profileConfig";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:100000";

export default function LoginPage() {
    // Прапорці, які керують формою та її станом
    const [isLogin, setIsLogin] = useState(true);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);

    useEffect(() => {
        // Закриваємо при натисканні Escape
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
        region: UKRAINIAN_REGIONS[0] || "",
        agreedToTerms: false,
    });
    // Стан для повідомлень про помилки та успіх
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    // Оновлюємо стан полів форми логіну або реєстрації при зміні значень
    // Функція для обробки змін у полях логіну
    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, type, checked, value } = e.target as HTMLInputElement;
        setLoginData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // Функція для обробки змін у полях реєстрації
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

                if (data.user) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                }
                
                localStorage.setItem("token", data.token);

                const maxAge = loginData.remember ? "; max-age=86400" : "";
                document.cookie = `token=${data.token}; path=/${maxAge}`;

                setTimeout(() => {
                    router.push("/Kalendar");
                }, 700);
            } else {
                setError(data.error || "Invalid email or password!");
            }
        } catch {
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
        } catch {
            setError("Connection error. Please try again later.");
            // Логування деталей тільки в консоль для розробників
            console.error("Backend connection failed. Check if API server is running.");
        }
    };

    const termsAndConditionsText = `

    TERMS OF USE FOR THE ALEX SERVICE

        1. GENERAL PROVISIONS
    By using the Alex service, you agree to these terms. The service is provided ‘as is’. We do not guarantee 100% accuracy of AI responses. It is prohibited to use the service for illegal activities.

        2. PROHIBITED:
    - Spam and mass mailings
    - Harassment and intimidation of other users
    - Illegal activities of any kind
    - Misuse of AI capabilities for malicious purposes
    - Distribution of malicious software
    - Copyright infringement

        3. USER RIGHTS
    The user has the right to:
    - Access their data
    - Delete their account
    - Change their personal details
    - Stop using the service at any time
    - Edit their profile
    - Export their data
    - Know what data is stored and for what purpose

        4. USER OBLIGATIONS
    The user is obliged to:
    - Provide accurate information upon registration
    - Not disclose confidential information
    - Report security breaches
    - Adhere to ethical standards for the use of AI

        5. PRIVACY
    We collect and process your data in accordance with our privacy policy.
    Your data is protected and will not be shared with third parties without your consent.

        6. LIABILITY
    The Alex service is not liable for:
    - Incorrect AI responses
    - Data loss due to technical issues
    - The actions of other users

        7. CHANGES TO THE TERMS
    We may amend these terms at any time.
    Continued use of the service following such changes constitutes your acceptance of the new terms.

    By agreeing to these terms and conditions, you confirm and accept all the above provisions.

    Translated with DeepL.com (free version)

    `.trim();

    // Повернення JSX елемента для рендерингу компонента
    return (
        // Основний контейнер сторінки логіну
        <div className = "login-container">
            {/* Форма логіну з вкладками */}
            <div className = "login-form-wrapper">
            <div className = "login-form-header">
                <h1>{isLogin ? "Welcome Back" : "Create Your Account"}</h1>
                <p>{isLogin ? "Sign in to access your calendar and dashboard." : "Register to manage your calendar and profile."}</p>
            </div>
            {/* Tabs */}
            <div className = "tabs">
                    <button
                        className = {`tab-btn ${isLogin ? "active" : ""}`}
                        onClick = {() => {
                            setIsLogin(true);
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Log In
                    </button>
                    <button
                        className = {`tab-btn ${!isLogin ? "active" : ""}`}
                        onClick = {() => {
                            setIsLogin(false);
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Register
                    </button>
                </div>

                {error && <div className = "error-message">{error}</div>}
                {success && <div className = "success-message">{success}</div>}

                {/* Login Form */}
                {isLogin && (
                    // Відображення форми логіну, якщо обрана вкладка Log In
                    <div className = "form-container">
                        <h2>Log In</h2>
                        <form className = "login-form" onSubmit={handleLoginSubmit}>
                            <input
                                name = "email"
                                placeholder = "Email"
                                type = "email"
                                value = {loginData.email}
                                onChange = {handleLoginChange}
                                autoComplete = "email"
                                required
                            />

                            <div className = "password-input-wrapper">
                                <input
                                    name = "password"
                                    type = {showLoginPassword ? "text" : "password"}
                                    placeholder = "Password"
                                    value = {loginData.password}
                                    onChange = {handleLoginChange}
                                    autoComplete = "current-password"
                                    required
                                />
                                <button
                                    type = "button"
                                    onClick = {() => setShowLoginPassword(!showLoginPassword)}
                                    className = "password-toggle-btn"
                                    aria-label= "Toggle password visibility"
                                >
                                    {showLoginPassword ? "1" : "0"}
                                </button>
                            </div>

                            <label className = "checkbox-label">
                                <input
                                    type = "checkbox"
                                    name = "remember"
                                    checked = {loginData.remember}
                                    onChange = {handleLoginChange}
                                />
                                {" "}Remember me
                            </label>

                            <button
                                type = "submit"
                                className = "submit-btn"
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
                    <div className = "form-container">
                        <h2>Create Account</h2>
                        <form className = "login-form" onSubmit={handleRegisterSubmit}>
                            <input
                                name = "login"
                                placeholder = "Username"
                                type = "text"
                                value = {registerData.login}
                                onChange = {handleRegisterChange}
                                required
                            />

                            <input
                                name = "email"
                                placeholder = "Email"
                                type = "email"
                                value = {registerData.email}
                                onChange = {handleRegisterChange}
                                required
                            />

                            <input
                                name = "first_name"
                                placeholder = "First Name"
                                type = "text"
                                value = {registerData.first_name}
                                onChange = {handleRegisterChange}
                            />

                            <input
                                name = "last_name"
                                placeholder = "Last Name"
                                type = "text"
                                value = {registerData.last_name}
                                onChange = {handleRegisterChange}
                            />

                            <div className = "password-input-wrapper">
                                <input
                                    name="password"
                                    type = {showRegisterPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value = {registerData.password}
                                    onChange = {handleRegisterChange}
                                    id = "pwd"
                                    required
                                />
                                <button
                                    type = "button"
                                    onClick = {() => setShowRegisterPassword(!showRegisterPassword)}
                                    className = "password-toggle-btn"
                                    aria-label = "Перемкнути видимість пароля"
                                >
                                    {showRegisterPassword ? "1" : "0"}
                                </button>
                            </div>

                            <input
                                name = "confirmPassword"
                                type = "password"
                                placeholder = "Confirm Password"
                                value = {registerData.confirmPassword}
                                onChange = {handleRegisterChange}
                                required
                            />

                            <select
                                name = "region"
                                value = {registerData.region}
                                onChange = {handleRegisterChange}
                            >
                                {UKRAINIAN_REGIONS.map((region) => (
                                    <option key = {region} value = {region}>
                                        {region}
                                    </option>
                                ))}
                            </select>

                            <label className = "checkbox-label">
                                {/* Прапорець згоди з умовами використання перед реєстрацією */}
                                <input
                                    type = "checkbox"
                                    name = "agreedToTerms"
                                    checked = {registerData.agreedToTerms}
                                    onChange = {handleRegisterChange}
                                />
                                {" "}I agree to the{" "}
                                <button
                                    type = "button"
                                    className = "terms-link"
                                    onClick = {() => setShowTermsModal(true)}
                                >
                                    Terms of Service
                                </button>
                            </label>

                            <button type = "submit" className = "submit-btn">
                                Register
                            </button>
                        </form>
                    </div>
                )}

                {/* Terms Modal */}
                {showTermsModal && (
                    // Модальне вікно з текстом умов використання
                    <div className = "modal-overlay" onClick = {() => setShowTermsModal(false)}>
                        <div className = "modal-content" onClick = {(e) => e.stopPropagation()}>
                            <div className = "modal-header">
                                <h3>Terms of Service</h3>
                            </div>
                            <div className = "modal-body">
                                <pre>{termsAndConditionsText}</pre>
                            </div>
                            <div className = "modal-footer">
                                <button
                                    className = "modal-btn"
                                    onClick = {() => setShowTermsModal(false)}
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
