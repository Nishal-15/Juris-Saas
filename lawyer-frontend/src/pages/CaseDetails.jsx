import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import DatePicker from "../components/DatePicker";
import "./case_details.css";

const STATUS_OPTIONS = ["Open", "In Progress", "Hearing Scheduled", "Verdict Pending", "Closed"];

export default function CaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    status: "", hearingDate: "", courtLocation: "",
    updateNote: "", nextSteps: "", verdict: ""
  });

  useEffect(() => {
    axios.get(`/cases/details/${id}`)
      .then(res => {
        const c = res.data;
        setCaseData(c);
        setForm({
          status: c.status || "",
          hearingDate: c.hearingDate ? new Date(c.hearingDate).toISOString().slice(0, 10) : "",
          courtLocation: c.courtLocation || "",
          updateNote: "",
          nextSteps: c.nextSteps || "",
          verdict: c.verdict || ""
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        status: form.status,
        courtLocation: form.courtLocation,
        nextSteps: form.nextSteps,
        verdict: form.verdict,
      };
      if (form.hearingDate) payload.hearingDate = form.hearingDate;
      if (form.updateNote.trim()) payload.updateNote = form.updateNote.trim();

      await axios.patch(`/cases/${id}/management`, payload);

      // Re-fetch fresh from server to reflect updated timeline
      const fresh = await axios.get(`/cases/details/${id}`);
      setCaseData(fresh.data);
      setForm(f => ({ ...f, updateNote: "", status: fresh.data.status || f.status }));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const urgencyColor = (u) =>
    u === "Emergency" ? "#ef4444" : u === "High" ? "#f59e0b" : "#10b981";

  const statusColor = (s) => {
    if (s === "Closed") return "#10b981";
    if (s === "Hearing Scheduled") return "#c9a84c";
    if (s === "Verdict Pending") return "#f59e0b";
    if (s === "In Progress") return "#3b82f6";
    return "#6b7280";
  };

  // Hearing countdown
  const getCountdown = () => {
    if (!caseData?.hearingDate) return null;
    const diff = new Date(caseData.hearingDate) - new Date();
    if (diff <= 0) return "Hearing date has passed";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hearing is TODAY";
    return `${days} day${days > 1 ? "s" : ""} until next hearing`;
  };

  const countdown = getCountdown();

  return (
    <div className="cd-page">
      <Sidebar />
      <div className="cd-body">
        {loading ? (
          <div className="cd-loading">Loading case file...</div>
        ) : !caseData ? (
          <div className="cd-loading">
            <button className="cd-back-btn" onClick={() => navigate(-1)}>← Back</button>
            <p style={{ color: "rgba(255,255,255,0.3)" }}>Case not found.</p>
          </div>
        ) : (
          <>
            {/* Back */}
            <button className="cd-back-btn" onClick={() => navigate(-1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>

            {/* Header */}
            <div className="cd-header">
              <div className="cd-header-left">
                <div className="cd-urgency-bar" style={{ background: urgencyColor(caseData.urgency) }} />
                <div>
                  <div className="cd-tags-row">
                    <span className="cd-tag cd-tag-blue">{caseData.type}</span>
                    <span className="cd-tag" style={{ color: urgencyColor(caseData.urgency), background: `${urgencyColor(caseData.urgency)}18` }}>{caseData.urgency}</span>
                    <span className="cd-file-id">#{caseData._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <h1 className="cd-title">{caseData.title}</h1>
                  <p className="cd-client-line">Client: <strong>{caseData.user?.name || "N/A"}</strong></p>
                </div>
              </div>
              <span className="cd-status-tag" style={{ background: `${statusColor(caseData.status)}18`, color: statusColor(caseData.status), border: `1px solid ${statusColor(caseData.status)}30` }}>
                {caseData.status}
              </span>
            </div>

            {/* Countdown Banner */}
            {countdown && (
              <div className="cd-countdown-bar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {countdown}
                {caseData.courtLocation && <span className="cd-countdown-loc"> — {caseData.courtLocation}</span>}
              </div>
            )}

            <div className="cd-grid">
              {/* LEFT — Update Form + Timeline */}
              <div className="cd-left">

                {/* Update Panel */}
                <div className="cd-card">
                  <div className="cd-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Update Case Record
                  </div>

                  <div className="cd-form-grid">
                    <div className="cd-form-group">
                      <label className="cd-label">Case Status</label>
                      <select className="cd-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="cd-form-group">
                      <DatePicker
                        label="Next Hearing Date"
                        value={form.hearingDate}
                        onChange={(val) => setForm(f => ({ ...f, hearingDate: val }))}
                      />
                    </div>

                    <div className="cd-form-group cd-full">
                      <label className="cd-label">Court Name & Location</label>
                      <input type="text" className="cd-input" placeholder="e.g. District Court, Chennai — Room 4B"
                        value={form.courtLocation} onChange={e => setForm(f => ({ ...f, courtLocation: e.target.value }))} />
                    </div>

                    <div className="cd-form-group cd-full">
                      <label className="cd-label">Milestone Note <span className="cd-label-hint">(added to timeline)</span></label>
                      <input type="text" className="cd-input" placeholder="e.g. First hearing completed, Evidence submitted..."
                        value={form.updateNote} onChange={e => setForm(f => ({ ...f, updateNote: e.target.value }))} />
                    </div>

                    <div className="cd-form-group cd-full">
                      <label className="cd-label">Next Steps for Client</label>
                      <textarea className="cd-textarea" rows={3} placeholder="e.g. Please bring original property documents to the next hearing..."
                        value={form.nextSteps} onChange={e => setForm(f => ({ ...f, nextSteps: e.target.value }))} />
                    </div>

                    {(form.status === "Verdict Pending" || form.status === "Closed") && (
                      <div className="cd-form-group cd-full">
                        <label className="cd-label">Verdict / Outcome</label>
                        <textarea className="cd-textarea" rows={3} placeholder="Enter the court's verdict or case outcome..."
                          value={form.verdict} onChange={e => setForm(f => ({ ...f, verdict: e.target.value }))} />
                      </div>
                    )}
                  </div>

                  <div className="cd-form-footer">
                    {saved && <span className="cd-save-confirm">Changes saved and client notified</span>}
                    <button className="cd-save-btn" onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save & Notify Client"}
                      {!saving && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Initial Description — standalone */}
                <div className="cd-card">
                  <div className="cd-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Initial Description
                  </div>
                  <p className="cd-desc-text">{caseData.description}</p>
                </div>
              </div>

              {/* RIGHT — Meta + Description */}
              <div className="cd-right">
                <div className="cd-card">
                  <div className="cd-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Case Details
                  </div>
                  {[
                    { label: "Filed By", value: caseData.user?.name || "Anonymous" },
                    { label: "Category", value: caseData.type || "—" },
                    { label: "Urgency", value: caseData.urgency, style: { color: urgencyColor(caseData.urgency), fontWeight: 600 } },
                    { label: "Hearing Date", value: caseData.hearingDate ? new Date(caseData.hearingDate).toLocaleDateString("en-IN") : "TBD", style: { color: "#c9a84c" } },
                    { label: "Court Location", value: caseData.courtLocation || "Not specified" },
                  ].map(({ label, value, style }) => (
                    <div key={label} className="cd-meta-row">
                      <span className="cd-meta-label">{label}</span>
                      <span className="cd-meta-value" style={style}>{value}</span>
                    </div>
                  ))}
                </div>


                {caseData.verdict && (
                  <div className="cd-card cd-verdict-card">
                    <div className="cd-card-title" style={{ color: "#10b981" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      Verdict / Outcome
                    </div>
                    <p className="cd-desc-text">{caseData.verdict}</p>
                  </div>
                )}

                <div className="cd-card">
                  <div className="cd-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    Contact Client
                  </div>
                  <button className="cd-workspace-btn" onClick={() => navigate(`/chat/${caseData.user?._id}`)}>
                    Open Consultation Channel
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
