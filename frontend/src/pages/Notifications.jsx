import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import BottomNav from "../components/layout/BottomNav";
import MobileHeader from "../components/layout/MobileHeader";
import axios from "../api/axios";
import "./notifications.css";

const typeConfig = {
  "Consultation Update": { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "ACCEPTED" },
  "Case Update":         { color: "#c9a84c", bg: "rgba(201,168,76,0.1)",  label: "CASE" },
  "Hearing Alert":       { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "HEARING" },
  "default":             { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  label: "UPDATE" },
};

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifs(); }, []);

  const fetchNotifs = () => {
    setLoading(true);
    axios.get("/notifications")
      .then(res => { setNotifs(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleMarkRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    try { await axios.delete("/notifications/all"); setNotifs([]); } catch {}
  };

  const getType = (title) => typeConfig[title] || typeConfig["default"];

  return (
    <div className="np-page">
      <MobileHeader />
      <Sidebar />
      <div className="np-body">
        <div className="np-header">
          <div>
            <h1 className="np-title">Notifications</h1>
            <p className="np-subtitle">Updates regarding your cases and appointments.</p>
          </div>
          {notifs.length > 0 && (
            <button className="np-clear-btn" onClick={handleClearAll}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="np-empty"><div className="np-spinner" /> Loading...</div>
        ) : notifs.length === 0 ? (
          <div className="np-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <p>You have no notifications at this time.</p>
          </div>
        ) : (
          <div className="np-list">
            {notifs.map(n => {
              const tc = getType(n.title);
              return (
                <div
                  key={n._id}
                  className={`np-card ${n.isRead ? "read" : "unread"}`}
                  onClick={() => !n.isRead && handleMarkRead(n._id)}
                >
                  <div className="np-card-indicator" style={{ background: tc.color }} />
                  <div className="np-card-icon" style={{ background: tc.bg }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={tc.color} strokeWidth="2" strokeLinecap="round">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 01-3.46 0"/>
                    </svg>
                  </div>
                  <div className="np-card-body">
                    <div className="np-card-top">
                      <span className="np-type-badge" style={{ color: tc.color, background: tc.bg }}>{tc.label}</span>
                      <h4 className="np-card-title">{n.title}</h4>
                    </div>
                    <p className="np-card-msg">{n.message}</p>
                  </div>
                  <div className="np-card-right">
                    <span className="np-time">{new Date(n.createdAt).toLocaleDateString("en-IN")}</span>
                    {!n.isRead && <span className="np-unread-dot" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}