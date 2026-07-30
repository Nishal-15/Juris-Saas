import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import DatePicker from "../components/DatePicker";
import "./case_details.css"; // Reuse existing styles

const MEDIATION_STATUS_OPTIONS = [
  "Pending Mediation Acceptance",
  "Mediation Session Scheduled",
  "Mediation in Progress",
  "Mutual Settlement Reached",
  "Mediation Failed (Proceed to Court)",
  "Closed"
];

export default function MediationWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [accepting, setAccepting] = useState(false);

  // We reuse backend fields but label them differently in UI
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
          hearingDate: c.hearingDate ? c.hearingDate.split('T')[0] : "",
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

  const handleAcceptCase = async () => {
    setAccepting(true);
    try {
      await axios.post(`/cases/${id}/assign`);
      // Refresh to unlock edit mode
      const fresh = await axios.get(`/cases/details/${id}`);
      setCaseData(fresh.data);
    } catch (err) {
      alert("Failed to accept case: " + (err.response?.data?.message || err.message));
    } finally {
      setAccepting(false);
    }
  };

  const urgencyColor = (u) =>
    u === "Emergency" ? "#ef4444" : u === "High" ? "#f59e0b" : "#10b981";

  const statusColor = (s) => {
    if (s === "Closed" || s === "Mutual Settlement Reached") return "#10b981";
    if (s === "Mediation Session Scheduled") return "#c9a84c";
    if (s === "Mediation Failed (Proceed to Court)") return "#ef4444";
    if (s === "Mediation in Progress") return "#8b5cf6"; // Purple for mediation
    return "#6b7280";
  };

  // Mediation Session countdown
  const getCountdown = () => {
    if (!caseData?.hearingDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = caseData.hearingDate.split('T')[0].split('-');
    const hDate = new Date(y, m - 1, d);
    hDate.setHours(0, 0, 0, 0);

    const diff = hDate.getTime() - today.getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return "Session date has passed";
    if (days === 0) return "Session is TODAY";
    return `${days} day${days > 1 ? "s" : ""} until next mediation session`;
  };

  const countdown = getCountdown();

  // Determine if the lawyer has accepted this case yet
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAssignedToMe = caseData?.assignedLawyer?._id === user._id || caseData?.assignedLawyer === user._id;

  return (
    <div className="cd-page">
      <Sidebar />
      <div className="cd-body">
        {loading ? (
          <div className="cd-loading">Loading mediation file...</div>
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
                <div className="cd-urgency-bar" style={{ background: "#8b5cf6" }} />
                <div>
                  <div className="cd-tags-row">
                    <span className="cd-tag" style={{ color: "#8b5cf6", background: "rgba(139, 92, 246, 0.15)" }}>Pre-Litigation Mediation</span>
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
              <div className="cd-countdown-bar" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#c4b5fd", borderLeft: "4px solid #8b5cf6" }}>
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

                {/* Conditional Panel: Either 'Accept Case' OR 'Update Case Record' */}
                {!isAssignedToMe ? (
                  <div className="cd-card" style={{ border: '2px solid #8b5cf6', background: 'rgba(139,92,246,0.05)' }}>
                    <div className="cd-card-title" style={{ color: '#8b5cf6', fontSize: '1.2rem' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      Awaiting Mediator Acceptance
                    </div>
                    <p className="cd-desc-text" style={{ marginBottom: '20px' }}>
                      This client has requested pre-litigation mediation to settle their dispute amicably. Review the initial description. To unlock consultation, schedule mediation sessions, and draft settlement terms, you must officially accept this request.
                    </p>
                    <button 
                      className="cd-save-btn" 
                      onClick={handleAcceptCase} 
                      disabled={accepting}
                      style={{ width: '100%', padding: '16px', fontSize: '1.1rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                    >
                      {accepting ? "Initializing Workspace..." : "Accept Mediation Request"}
                      {!accepting && (
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="20" height="20">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="cd-card">
                    <div className="cd-card-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Manage Mediation Track
                    </div>

                  <div className="cd-form-grid">
                    <div className="cd-form-group">
                      <label className="cd-label">ADR Status</label>
                      <select className="cd-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                        {MEDIATION_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="cd-form-group">
                      <DatePicker
                        label="Next Session Date"
                        value={form.hearingDate}
                        onChange={(val) => setForm(f => ({ ...f, hearingDate: val }))}
                      />
                    </div>

                    <div className="cd-form-group cd-full">
                      <label className="cd-label">Virtual Link / Physical Center</label>
                      <input type="text" className="cd-input" placeholder="e.g. Zoom Meeting ID / CADR Center, Block B"
                        value={form.courtLocation} onChange={e => setForm(f => ({ ...f, courtLocation: e.target.value }))} />
                    </div>

                    <div className="cd-form-group cd-full">
                      <label className="cd-label">Session Summary Note <span className="cd-label-hint">(added to timeline)</span></label>
                      <input type="text" className="cd-input" placeholder="e.g. Discussed property bounds, counter-party requested 1 week..."
                        value={form.updateNote} onChange={e => setForm(f => ({ ...f, updateNote: e.target.value }))} />
                    </div>

                    <div className="cd-form-group cd-full">
                      <label className="cd-label">Action Items for Parties</label>
                      <textarea className="cd-textarea" rows={3} placeholder="e.g. Both parties need to bring financial statements to the next session..."
                        value={form.nextSteps} onChange={e => setForm(f => ({ ...f, nextSteps: e.target.value }))} />
                    </div>

                    {(form.status === "Mutual Settlement Reached" || form.status === "Closed" || form.status === "Mediation Failed (Proceed to Court)") && (
                      <div className="cd-form-group cd-full">
                        <label className="cd-label" style={{ color: form.status.includes("Failed") ? "#ef4444" : "#10b981" }}>
                          {form.status.includes("Failed") ? "Failure Reason" : "Settlement Terms"}
                        </label>
                        <textarea className="cd-textarea" rows={3} placeholder="Enter the final outcome, settlement terms, or reason for failure..."
                          value={form.verdict} onChange={e => setForm(f => ({ ...f, verdict: e.target.value }))} />
                      </div>
                    )}
                  </div>

                  <div className="cd-form-footer">
                    {saved && <span className="cd-save-confirm">Changes saved and parties notified</span>}
                    <button className="cd-save-btn" onClick={handleSave} disabled={saving} style={{ background: "#8b5cf6" }}>
                      {saving ? "Saving..." : "Save Session Update"}
                      {!saving && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                )}

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
                    Filing Details
                  </div>
                  {[
                    { label: "Initiator", value: caseData.user?.name || "Anonymous" },
                    { label: "Category", value: caseData.type || "—" },
                    { label: "Urgency", value: caseData.urgency, style: { color: urgencyColor(caseData.urgency), fontWeight: 600 } },
                    { label: "Session Date", value: caseData.hearingDate ? new Date(caseData.hearingDate).toLocaleDateString("en-IN") : "TBD", style: { color: "#c9a84c" } },
                    { label: "Platform", value: caseData.courtLocation || "Not specified" },
                  ].map(({ label, value, style }) => (
                    <div key={label} className="cd-meta-row">
                      <span className="cd-meta-label">{label}</span>
                      <span className="cd-meta-value" style={style}>{value}</span>
                    </div>
                  ))}
                </div>

                {caseData.verdict && (
                  <div className="cd-card cd-verdict-card">
                    <div className="cd-card-title" style={{ color: caseData.status.includes("Failed") ? "#ef4444" : "#10b981" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      {caseData.status.includes("Failed") ? "Mediation Failed" : "Settlement Terms"}
                    </div>
                    <p className="cd-desc-text">{caseData.verdict}</p>
                  </div>
                )}

                {isAssignedToMe && (
                  <div className="cd-card">
                    <div className="cd-card-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                      Contact Initiator
                    </div>
                    <button className="cd-workspace-btn" onClick={() => navigate(`/chat/${caseData.user?._id}`)} style={{ background: "rgba(139, 92, 246, 0.15)", color: "#c4b5fd", border: "1px solid rgba(139, 92, 246, 0.4)" }}>
                      Open Secure Comms Channel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
