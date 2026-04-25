import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Sidebar from "../components/layout/Sidebar";
import BottomNav from "../components/layout/BottomNav";
import MobileHeader from "../components/layout/MobileHeader";
import "./cases.css";

const statusConfig = {
  "Open":              { color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: "Open" },
  "In Progress":       { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", label: "In Progress" },
  "Hearing Scheduled": { color: "#c9a84c", bg: "rgba(201,168,76,0.1)", label: "Hearing" },
  "Verdict Pending":   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Verdict Pending" },
  "Closed":            { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "Closed" },
};

const urgencyColor = (u) =>
  u === "Emergency" ? "#ef4444" : u === "Urgent" ? "#f59e0b" : "#10b981";

export default function RecentCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const endpoint = user.role === "lawyer" ? "/cases/lawyer" : "/cases";
    axios.get(endpoint)
      .then(res => { setCases(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.role]);

  return (
    <div className="rc-page">
      <MobileHeader />
      <Sidebar />
      <div className="rc-body">

        <div className="rc-header">
          <div>
            <h1 className="rc-title">My Cases</h1>
            <p className="rc-subtitle">
              {cases.length > 0
                ? `${cases.length} active legal matter${cases.length !== 1 ? "s" : ""} on file`
                : "Track and manage your legal matters"}
            </p>
          </div>
          {user.role !== "lawyer" && (
            <button className="rc-new-btn" onClick={() => navigate("/create-case")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              File New Case
            </button>
          )}
        </div>

        {loading ? (
          <div className="rc-empty"><div className="rc-spinner" /> Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="rc-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>No active cases found.</p>
            {user.role !== "lawyer" && (
              <button className="rc-new-btn" onClick={() => navigate("/create-case")}>File Your First Case</button>
            )}
          </div>
        ) : (
          <div className="rc-list">
            {cases.map(c => {
              const sc = statusConfig[c.status] || statusConfig["Open"];
              const chatTargetId = user.role === "lawyer" ? c.user?._id : c.assignedLawyer?._id;
              const isAssigned = !!c.assignedLawyer;

              return (
                <div key={c._id} className="rc-card">

                  {/* Left accent bar */}
                  <div className="rc-card-bar" style={{ background: sc.color }} />

                  {/* Main Content */}
                  <div className="rc-card-main">
                    <div className="rc-card-top">
                      <div className="rc-tags">
                        <span className="rc-tag" style={{ color: urgencyColor(c.urgency), background: `${urgencyColor(c.urgency)}12` }}>
                          {c.urgency}
                        </span>
                        <span className="rc-tag rc-tag-blue">{c.type || "General"}</span>
                        <span className="rc-tag" style={{ color: sc.color, background: sc.bg }}>
                          {sc.label}
                        </span>
                      </div>
                      <span className="rc-file-id">#{c._id.slice(-6).toUpperCase()}</span>
                    </div>

                    <h3 className="rc-case-title">{c.title || "Untitled Legal Matter"}</h3>

                    <div className="rc-meta-row">
                      {user.role === "lawyer" ? (
                        <span className="rc-meta">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                          Client: <strong>{c.user?.name || "Anonymous"}</strong>
                        </span>
                      ) : isAssigned ? (
                        <span className="rc-meta">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                          Advocate: <strong>{c.assignedLawyer.name}</strong>
                        </span>
                      ) : (
                        <span className="rc-meta rc-awaiting">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          Awaiting expert assignment
                        </span>
                      )}

                      {c.hearingDate && (
                        <span className="rc-meta" style={{ color: "#c9a84c" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {new Date(c.hearingDate).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="rc-actions">
                    {chatTargetId ? (
                      <button className="rc-btn rc-btn-chat" onClick={() => navigate(`/chat/${chatTargetId}`)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        Chat {user.role === "lawyer" ? "Client" : "Expert"}
                      </button>
                    ) : user.role !== "lawyer" && (
                      <button className="rc-btn rc-btn-waiting" disabled>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Awaiting Expert
                      </button>
                    )}
                    <button className="rc-btn rc-btn-view" onClick={() => navigate(`/case/${c._id}`)}>
                      View Details
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
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
