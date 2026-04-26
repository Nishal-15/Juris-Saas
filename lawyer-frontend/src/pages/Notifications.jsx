import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";
import "./notifications.css";

const typeConfig = {
  "New Consultation Request": { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", label: "NEW" },
  "Case Update":              { color: "#c9a84c", bg: "rgba(201,168,76,0.1)",  label: "CASE" },
  "default":                  { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "UPDATE" },
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
    if (!window.confirm("Clear all notification history?")) return;
    try { await axios.delete("/notifications/all"); setNotifs([]); } catch {}
  };

  const getType = (title) => typeConfig[title] || typeConfig["default"];

  return (
    <div className="ld-page">
      <Sidebar />
      <div className="ld-body" style={{ overflowY: "auto" }}>
        <div className="np-header">
          <div>
            <h1 className="ld-title">Notifications</h1>
            <p className="ld-subtitle">Real-time alerts regarding case requests and updates.</p>
          </div>
          {notifs.length > 0 && (
            <button className="np-clear-btn" onClick={handleClearAll}>
              Clear History
            </button>
          )}
        </div>

        {loading ? (
          <div className="np-empty">Loading secure alerts...</div>
        ) : notifs.length === 0 ? (
          <div className="np-empty">
            <p>Your notification history is empty.</p>
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
                  <div className="np-card-body">
                    <div className="np-card-top">
                      <span className="np-type-badge" style={{ color: tc.color, background: tc.bg }}>{tc.label}</span>
                      <h4 className="np-card-title" style={{ color: "#fff", margin: 0 }}>{n.title}</h4>
                    </div>
                    <p className="np-card-msg" style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginTop: "5px" }}>{n.message}</p>
                  </div>
                  <div className="np-card-right">
                    <span className="np-time" style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{new Date(n.createdAt).toLocaleDateString("en-IN")}</span>
                    {!n.isRead && <span className="np-unread-dot" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
