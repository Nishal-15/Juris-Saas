import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./mobileheader.css";

export default function MobileHeader() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <header className="mobile-top-header">
      <div className="mobile-logo-wrap-top" onClick={() => navigate("/user")}>
        <span className="mobile-logo-icon-top">⚖️</span>
        <span className="mobile-logo-text-top">JurisBot</span>
      </div>
      
      <div className="mobile-actions-top">
        {/* Theme Toggle */}
        <div 
          onClick={toggleTheme}
          style={{ 
            width: '40px', height: '22px', borderRadius: '22px', 
            background: theme === 'dark' ? 'var(--bg-3)' : 'var(--gold)', 
            position: 'relative', cursor: 'pointer', transition: 'background 0.3s',
            flexShrink: 0
          }}
          title="Toggle Theme"
        >
          <div style={{
            width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
            position: 'absolute', top: '3px', left: theme === 'dark' ? '3px' : '21px',
            transition: 'left 0.3s, background 0.3s'
          }} />
        </div>

        {/* Install Button */}
        <button 
          className="mobile-icon-btn" 
          onClick={() => window.dispatchEvent(new Event("open-pwa-modal"))}
          style={{ width: "auto", height: "26px", padding: "0 12px", background: "rgba(201, 168, 76, 0.15)", border: "1px solid rgba(201, 168, 76, 0.4)", color: "#c9a84c", borderRadius: "14px", fontSize: "0.75rem", fontWeight: "700", display: "flex", alignItems: "center" }}
          title="Install App"
        >
          Install
        </button>
        <button className="mobile-icon-btn" onClick={() => navigate("/notifications")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="notif-dot"></span>
        </button>
      </div>
    </header>
  );
}
