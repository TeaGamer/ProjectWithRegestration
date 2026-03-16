import Link from 'next/link';
import './globals.css';

export default function Home() {
  return (
    <main className="hero-container">
      <div className="container hero-section">
        
        {/* Left Side: Project Info */}
        <div className="hero-text">
          <p className="subtitle">Our Startup Project</p>
          <h1>AI Planner & <br />Smart Alarms</h1>
          <p className="description">
            Meet your new assistant, <strong>AI Alex</strong>. 
            Designed to help you organize, schedule, and master your daily routine with ease.
          </p>
        </div>

        <div className="hero-profile">
          <div className="avatar-wrapper">
            <img 
              src="/knight.png" 
              alt="AI Alex Avatar" 
              className="avatar-img"
            />
          </div>
          <h2 className="ai-name">Alex</h2>
          <Link href="/login" className="login-bubble-btn">
            Login
          </Link>
        </div>

      </div>
    </main>
  );
}