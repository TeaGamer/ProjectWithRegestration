"use client";
import Link from "next/link";
import "../css/login.css";

export default function LoginPage() {
    return (
        <div className="login-container">
            <div className="login-form-wrapper">
                <h2>Login</h2>

                <form className="login-form" method="POST" autoComplete="on">
                    <input 
                        name="username"
                        placeholder="Username"
                        type="text"
                        autoComplete="username"
                    /><br />

                    <input 
                        name="password"
                        type="password"
                        placeholder="Password"
                        autoComplete="current-password"
                    /><br />

                    <label>
                        <input type="checkbox" name="remember" />
                        {" "}Remember me
                    </label><br />

                    <button type="submit">
                        Login
                    </button>
                </form>

                <Link href="/register" className="register-link">
                    Register
                </Link>
            </div>
        </div>
    );
}
