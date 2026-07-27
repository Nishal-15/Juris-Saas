import { useNavigate } from "react-router-dom";
import "./mobileheader.css";

export default function MobileHeader() {
  const navigate = useNavigate();

  return (
    <header className="mobile-top-header">
      <div className="mobile-logo-wrap-top" onClick={() => navigate("/user")}>
        <span className="mobile-logo-icon-top">⚖️</span>
        <span className="mobile-logo-text-top">JurisBot</span>
      </div>
      
      <div className="mobile-actions-top">
        <button 
          className="mobile-icon-btn" 
          onClick={() => window.dispatchEvent(new Event("open-pwa-modal"))}
          style={{ width: "auto", padding: "4px 10px", background: "rgba(201, 168, 76, 0.2)", border: "1px solid #c9a84c", color: "#c9a84c", borderRadius: "14px", fontSize: "0.78rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}
          title="Install App"
        >
          <span>📲</span> <span style={{ fontSize: "0.75rem" }}>Install</span>
        </button>
        <button className="mobile-icon-btn" onClick={() => navigate("/settings")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
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
