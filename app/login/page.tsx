"use client";
import { useState } from "react";
import "../css/login.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:100000";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, type, checked, value } = e.target as HTMLInputElement;
        setLoginData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

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
                }
                setTimeout(() => {
                    window.location.href = "/Dashboard";
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

                            <input
                                name="password"
                                type="password"
                                placeholder="Password"
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
                                {" "}Remember me
                            </label>

                            <button type="submit" className="submit-btn">
                                Log In
                            </button>
                        </form>
                    </div>
                )}

                {/* Register Form */}
                {!isLogin && (
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

                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={registerData.password}
                                onChange={handleRegisterChange}
                                id="pwd"
                                required
                            />
                            <input type="checkbox" onChange={(e) => setShowPassword(e.target.checked)} checked={showPassword} />
                            <label htmlFor="pwd">Показати пароль</label>

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
                                <option value="">Select a region</option>
                                <option value="Ukraine">All Ukraine</option>
                                <option value="Kyiv">Kyiv</option>
                                <option value="Kharkiv">Kharkiv</option>
                                <option value="Odesa">Odesa</option>
                                <option value="Dnipropetrovsk">Dnipropetrovsk</option>
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

                            <label className="checkbox-label">
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
