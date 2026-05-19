import Link from 'next/link';
import './css/Global.css';

// Головна сторінка додатку з презентацією проекту
export default function Home() {
  return (
    // Основний контейнер героїчної секції
    <main className = "hero-container">
      <div className = "container hero-section">

        {/* Ліва сторона: Інформація про проект */}
        <div className = "hero-text">
          <p className = "subtitle">Our Startup Project</p>
          <h1>AI Planner & <br />Smart Alarms</h1>
          <p className = "description">
            Meet your new assistant, <strong>AI Alex</strong>.
            Designed to help you organize, schedule, and master your daily routine with ease.
          </p>
        </div>

        {/* Права сторона: Профіль AI */}
        <div className = "hero-profile">
          {/* Обгортка для аватара */}
          <div className = "avatar-wrapper">
            <img
              src = "/knight.png"
              alt = "AI Alex Avatar"
              className = "avatar-img"
            />
          </div>
          <h2 className = "ai-name">Alex</h2>
          {/* Посилання на сторінку логіну */}
          <Link href="/Login" className = "login-bubble-btn">
            Login
          </Link>
        </div>

      </div>
    </main>
  );
}