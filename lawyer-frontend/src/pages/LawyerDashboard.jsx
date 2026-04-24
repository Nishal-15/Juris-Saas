import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";
import socket from "../socket";
import "./lawyer_dashboard.css";

export default function LawyerDashboard() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ totalCases: 0, pendingApps: 0, activeClients: 0 });
  const [pending, setPending] = useState([]);
  const [openCases, setOpenCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("queue");

  const fetchData = async () => {
    try {
      const [statsRes, pendingRes, openRes] = await Promise.all([
        axios.get("/analytics/lawyer"),
        axios.get("/appointments/received"),
        axios.get("/cases/open"),
      ]);
      setStats(statsRes.data);
      setPending(pendingRes.data);
      setOpenCases(openRes.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    socket.on("notification", (data) => {
      setToast(data.text || "New notification");
      fetchData();
      setTimeout(() => setToast(null), 5000);
    });
    socket.on("marketplace-needs-refresh", fetchData);
    return () => {
      socket.off("notification");
      socket.off("marketplace-needs-refresh");
    };
  }, []);

  const handleTakeCase = async (id) => {
    try {
      await axios.post(`/cases/${id}/assign`);
      setToast("Case successfully assigned to your workspace");
      setTimeout(() => setToast(null), 4000);
      fetchData();
    } catch (err) {
      alert("Failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const appt = pending.find((p) => p._id === id);
      await axios.patch(`/appointments/${id}/status`, { status: newStatus });
      setPending(pending.map((p) => (p._id === id ? { ...p, status: newStatus } : p)));
      if (newStatus === "Accepted" && appt?.userId?._id) {
        socket.emit("notify", { to: appt.userId._id, text: "Your consultation request has been accepted!" });
      }
    } catch {
      alert("Status update failed.");
    }
  };

  const urgencyColor = (u) =>
    u === "Emergency" ? "#ef4444" : u === "High" ? "#f59e0b" : "#10b981";

  return (
    <div className="ld-page">
      <Sidebar />

      <div className="ld-body">

        {/* ── Top Bar ── */}
        <header className="ld-topbar">
          <div>
            <h1 className="ld-title">Practitioner Console</h1>
            <p className="ld-subtitle">Welcome back, {stats.expertName || "Advocate"}</p>
          </div>
          <div className="ld-topbar-right">
            {toast && <div className="ld-toast">{toast}</div>}
            <div className="ld-live-badge">
              <span className="ld-pulse-dot" />
              Live
            </div>
          </div>
        </header>

        {/* ── Stats ── */}
        <section className="ld-stats">
          {[
            { label: "Active Clients", value: stats.activeClients || 0, accent: "#3b82f6",
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
            { label: "Active Cases", value: stats.totalCases || 0, accent: "#c9a84c",
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg> },
            { label: "Pending Reviews", value: stats.pendingApps || 0, accent: "#10b981",
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          ].map((s) => (
            <div className="ld-stat-card" key={s.label} style={{ "--accent": s.accent }}>
              <div className="ld-stat-icon">{s.icon}</div>
              <div className="ld-stat-value">{s.value}</div>
              <div className="ld-stat-label">{s.label}</div>
            </div>
          ))}
        </section>

        {/* ── Section Tabs ── */}
        <div className="ld-tabs">
          {[
            { id: "queue", label: "Consultation Queue", count: pending.length },
            { id: "marketplace", label: "Case Marketplace", count: openCases.length },
          ].map((t) => (
            <button
              key={t.id}
              className={`ld-tab ${activeSection === t.id ? "active" : ""}`}
              onClick={() => setActiveSection(t.id)}
            >
              {t.label}
              {t.count > 0 && <span className="ld-tab-count">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* ── QUEUE ── */}
        {activeSection === "queue" && (
          <div className="ld-panel">
            {loading ? (
              <div className="ld-empty-state">Loading workspace...</div>
            ) : pending.length === 0 ? (
              <div className="ld-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                No pending consultation requests.
              </div>
            ) : (
              <div className="ld-table">
                <div className="ld-table-head">
                  <span className="ld-client-cell">Client</span>
                  <span className="ld-matter-cell">Matter</span>
                  <span className="ld-scheduled-cell">Scheduled</span>
                  <span className="ld-status-cell">Status</span>
                  <span className="ld-actions-cell">Actions</span>
                </div>
                {pending.map((p) => (
                  <div key={p._id} className="ld-table-row">
                    <div className="ld-client-cell">
                      <div className="ld-avatar">{(p.userId?.name?.[0] || "A").toUpperCase()}</div>
                      <span className="ld-client-name">{p.userId?.name || "Anonymous"}</span>
                    </div>
                    <div className="ld-matter-cell">
                      {p.caseId ? (
                        <span className="ld-matter-title">{p.caseId.title}</span>
                      ) : (
                        <span className="ld-muted-text">General Inquiry</span>
                      )}
                    </div>
                    <div className="ld-scheduled-cell ld-muted-text">{p.date} · {p.time}</div>
                    <div className="ld-status-cell">
                      <span className={`ld-tag ${p.status === "Accepted" ? "green" : "gold"}`}>{p.status}</span>
                    </div>
                    <div className="ld-actions-cell">
                      {p.status === "Accepted" ? (
                        <button className="ld-btn-primary" onClick={() => navigate(`/chat/${p.userId?._id}`)}>Consult</button>
                      ) : (
                        <button className="ld-btn-primary" onClick={() => handleStatusUpdate(p._id, "Accepted")}>Accept</button>
                      )}
                      <button className="ld-btn-icon" onClick={() => p.caseId && navigate(`/case/${p.caseId._id}`)} title="View Brief">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MARKETPLACE ── */}
        {activeSection === "marketplace" && (
          <div className="ld-panel">
            {openCases.length === 0 ? (
              <div className="ld-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                No open cases matching your specialization.
              </div>
            ) : (
              <div className="ld-table">
                <div className="ld-table-head">
                  <span>Case Title</span><span>Category</span><span>Urgency</span><span>Filed By</span><span>Actions</span>
                </div>
                {openCases.map((c) => (
                  <div key={c._id} className="ld-table-row">
                    <div className="ld-matter-title">{c.title}</div>
                    <div><span className="ld-tag blue">{c.type}</span></div>
                    <div style={{ color: urgencyColor(c.urgency), fontWeight: 600, fontSize: "13px" }}>{c.urgency}</div>
                    <div className="ld-muted-text">{c.user?.name || "Anonymous"}</div>
                    <div className="ld-actions-cell">
                      <button className="ld-btn-primary" onClick={() => handleTakeCase(c._id)}>Claim</button>
                      <button className="ld-btn-icon" onClick={() => navigate(`/case/${c._id}`)} title="View Brief">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



      </div>
    </div>
  );
}
