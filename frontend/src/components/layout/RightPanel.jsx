import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import "./rightpanel.css";

export default function RightPanel() {
  const [cases, setCases] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/cases").then(res => setCases(res.data)).catch(() => {});
  }, []);

  const hearingCases = cases.filter(c => c.hearingDate);
  const activeCases  = cases.filter(c => c.assignedLawyer);

  const getCountdown = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    if (diff <= 0) return { label: "Passed", urgent: false };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return { label: days === 0 ? "Today" : `${days}d away`, urgent: days <= 3 };
  };

  const statusColor = (s) => {
    if (s === "Closed") return "#10b981";
    if (s === "Hearing Scheduled") return "#c9a84c";
    if (s === "In Progress") return "#3b82f6";
    return "#6b7280";
  };

  return (
    <div className="rp-shell">

      {/* ── Legal Alarms ── */}
      <div className="rp-section">
        <div className="rp-section-head">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          Legal Alarms
        </div>

        {hearingCases.length === 0 ? (
          <div className="rp-empty">No upcoming court hearings.</div>
        ) : (
          hearingCases.map(c => {
            const cd = getCountdown(c.hearingDate);
            return (
              <div key={c._id} className={`rp-alarm-card ${cd.urgent ? "urgent" : ""}`}>
                <div className="rp-alarm-top">
                  <span className="rp-alarm-label">UPCOMING HEARING</span>
                  <span className={`rp-alarm-countdown ${cd.urgent ? "urgent" : ""}`}>{cd.label}</span>
                </div>
                <div className="rp-alarm-date">
                  {new Date(c.hearingDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
                {c.courtLocation && (
                  <div className="rp-alarm-loc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {c.courtLocation}
                  </div>
                )}
                <div className="rp-alarm-title">{c.title}</div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Active Representation ── */}
      <div className="rp-section">
        <div className="rp-section-head">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          Representation
        </div>

        {cases.length === 0 ? (
          <div className="rp-empty">No active legal files.</div>
        ) : (
          cases.map(c => (
            <div
              key={c._id}
              className="rp-case-card"
              onClick={() => navigate(`/case/${c._id}`)}
            >
              <div className="rp-case-top">
                <span className="rp-case-type">{c.type || "General"}</span>
                <span className="rp-case-status" style={{ color: statusColor(c.status) }}>
                  {c.urgency}
                </span>
              </div>
              <div className="rp-case-title">{c.title}</div>
              <div className="rp-case-advocate">
                {c.assignedLawyer
                  ? <>
                      <span className="rp-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                      Adv. {c.assignedLawyer.name}
                    </>
                  : <span style={{ color: "rgba(255,255,255,0.25)" }}>Awaiting assignment</span>
                }
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}