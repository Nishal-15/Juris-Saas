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
