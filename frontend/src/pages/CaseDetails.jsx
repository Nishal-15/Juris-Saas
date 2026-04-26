import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Sidebar from "../components/layout/Sidebar";
import MobileHeader from "../components/layout/MobileHeader";
import BottomNav from "../components/layout/BottomNav";
import "./citizen_case_tracking.css";

export default function CaseDetails() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/cases/details/${id}`)
      .then(res => { setCaseData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const urgencyColor = (u) =>
    u === "Emergency" ? "#ef4444" : u === "Urgent" ? "#f59e0b" : "#10b981";

  const statusConfig = {
    "Open":              { color: "#6b7280", label: "Open — Awaiting Assignment" },
    "In Progress":       { color: "#3b82f6", label: "In Progress" },
    "Hearing Scheduled": { color: "#c9a84c", label: "Hearing Scheduled" },
    "Verdict Pending":   { color: "#f59e0b", label: "Verdict Pending" },
    "Closed":            { color: "#10b981", label: "Closed" },
  };

  const getCountdown = () => {
    if (!caseData?.hearingDate) return null;
    const diff = new Date(caseData.hearingDate) - new Date();
    if (diff <= 0) return { label: "Hearing date has passed", urgent: false };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return {
      label: days === 0 ? "Your hearing is TODAY" : `Next hearing in ${days} day${days !== 1 ? "s" : ""}`,
      urgent: days <= 3
    };
  };

  const statusInfo = caseData ? (statusConfig[caseData.status] || statusConfig["Open"]) : null;
  const countdown = caseData ? getCountdown() : null;

  return (
    <div className="ct-page">
      <MobileHeader />
      <Sidebar />
      <div className="ct-body">
        {loading ? (
          <div className="ct-loading">Loading your case file...</div>
        ) : !caseData ? (
          <div className="ct-loading">
            <button className="ct-back" onClick={() => navigate(-1)}>← Back</button>
            <p>Case not found.</p>
          </div>
        ) : (
          <>
            <button className="ct-back" onClick={() => navigate(-1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to My Cases
            </button>

            {/* ── Header ── */}
            <div className="ct-header">
              <div>
                <div className="ct-meta-row">
                  <span className="ct-tag" style={{ color: urgencyColor(caseData.urgency), background: `${urgencyColor(caseData.urgency)}15` }}>{caseData.urgency}</span>
                  <span className="ct-tag ct-tag-blue">{caseData.type}</span>
                  <span className="ct-file-id">File #{caseData._id.slice(-6).toUpperCase()}</span>
                </div>
                <h1 className="ct-title">{caseData.title}</h1>
              </div>
              <div className="ct-status-badge" style={{ background: `${statusInfo.color}14`, border: `1px solid ${statusInfo.color}30`, color: statusInfo.color }}>
                <span className="ct-status-dot" style={{ background: statusInfo.color }} />
                {statusInfo.label}
              </div>
            </div>

            {/* ── Hearing Countdown Banner ── */}
            {countdown && (
              <div className={`ct-banner ${countdown.urgent ? "urgent" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <div>
                  <strong>{countdown.label}</strong>
                  {caseData.hearingDate && (
                    <span className="ct-banner-date">
                      {" — "}{(() => {
                        const [y, m, d] = caseData.hearingDate.split('T')[0].split('-');
                        return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                      })()}
                    </span>
                  )}
                  {caseData.courtLocation && <span className="ct-banner-loc"> · {caseData.courtLocation}</span>}
                </div>
              </div>
            )}

            <div className="ct-grid">
              {/* LEFT — Timeline + Description */}
              <div className="ct-left">

                {/* Next Steps */}
                {caseData.nextSteps && (
                  <div className="ct-card ct-nextsteps-card">
                    <div className="ct-card-title" style={{ color: "#c9a84c" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="9 11 12 14 22 4"/>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                      </svg>
                      Action Required — Next Steps from Your Advocate
                    </div>
                    <p className="ct-nextsteps-text">{caseData.nextSteps}</p>
                  </div>
                )}

                {/* Verdict */}
                {caseData.verdict && (
                  <div className="ct-card ct-verdict-card">
                    <div className="ct-card-title" style={{ color: "#10b981" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      Verdict / Case Outcome
                    </div>
                    <p className="ct-nextsteps-text">{caseData.verdict}</p>
                  </div>
                )}

                {/* Milestone Timeline */}
                <div className="ct-card">
                  <div className="ct-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    Case Progress Timeline
                  </div>
                  <div className="ct-timeline">
                    <div className="ct-tl-item active">
                      <div className="ct-tl-dot" />
                      <div>
                        <p className="ct-tl-label">Case Filed &amp; Registered</p>
                        <p className="ct-tl-date">{new Date(caseData.createdAt).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                    {[...(caseData.trackingHistory || [])].reverse().map((m, i) => (
                      <div key={i} className="ct-tl-item">
                        <div className="ct-tl-dot" />
                        <div>
                          <p className="ct-tl-label">{m.status}</p>
                          <p className="ct-tl-date">{new Date(m.date).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    ))}
                    {caseData.trackingHistory?.length === 0 && (
                      <p className="ct-tl-empty">Your advocate has not posted any updates yet. Check back soon.</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="ct-card">
                  <div className="ct-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Your Filed Description
                  </div>
                  <p className="ct-desc-text">{caseData.description}</p>
                </div>
              </div>

              {/* RIGHT — Details + Advocate */}
              <div className="ct-right">
                <div className="ct-card">
                  <div className="ct-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Case Information
                  </div>
                  {[
                    { label: "Status", value: statusInfo.label, style: { color: statusInfo.color, fontWeight: 600 } },
                    { label: "Category", value: caseData.type || "—" },
                    { label: "Urgency", value: caseData.urgency, style: { color: urgencyColor(caseData.urgency), fontWeight: 600 } },
                    { label: "Next Hearing", value: caseData.hearingDate ? (() => {
                      const [y, m, d] = caseData.hearingDate.split('T')[0].split('-');
                      return new Date(y, m - 1, d).toLocaleDateString("en-IN");
                    })() : "TBD", style: { color: "#c9a84c" } },
                    { label: "Court", value: caseData.courtLocation || "Not yet specified" },
                  ].map(({ label, value, style }) => (
                    <div key={label} className="ct-info-row">
                      <span className="ct-info-label">{label}</span>
                      <span className="ct-info-value" style={style}>{value}</span>
                    </div>
                  ))}
                </div>

                {caseData.assignedLawyer ? (
                  <div className="ct-card ct-advocate-card">
                    <div className="ct-card-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Your Assigned Advocate
                    </div>
                    <div className="ct-advocate-row">
                      <div className="ct-advocate-avatar">
                        {caseData.assignedLawyer.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="ct-advocate-name">{caseData.assignedLawyer.name}</div>
                        <div className="ct-advocate-role">Verified Legal Practitioner</div>
                      </div>
                    </div>
                    <button className="ct-consult-btn" onClick={() => navigate(`/chat/${caseData.assignedLawyer._id}`)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                      Message Advocate
                    </button>
                  </div>
                ) : (
                  <div className="ct-card ct-awaiting-card">
                    <div className="ct-card-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Advocate Assignment
                    </div>
                    <p className="ct-awaiting-text">Your case is visible to verified advocates in our network. You will be notified once an expert accepts your matter.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
