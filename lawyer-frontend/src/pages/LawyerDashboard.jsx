import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";
import socket from "../socket";
import "./lawyer_dashboard.css";

export default function LawyerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalCases: 0, pendingApps: 0, activeClients: 0 });
  const [pending, setPending] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState([]);
  const [openCases, setOpenCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("queue");
  const [toast, setToast] = useState(null);
  const [subInfo, setSubInfo] = useState({ tier: "Trial", count: 0, expiry: null, isBlocked: false });
  const [broadcast, setBroadcast] = useState(null);
  const [hasDismissedQuota, setHasDismissedQuota] = useState(false);
  
  // Dynamic quota calculation (safe fallback to prevent crash)
  const safeSubInfo = subInfo || { tier: "Trial", count: 0, expiry: null, isBlocked: false };
  const limit = safeSubInfo.tier === "Trial" ? 5 : (safeSubInfo.tier === "Unlimited" ? Infinity : 5);
  const isQuotaExceeded = safeSubInfo.tier !== "Unlimited" && safeSubInfo.count >= limit;

  // ✅ Fixed lag: Move Audio outside of render to prevent recreation on every state change
  const [notificationAudio] = useState(() => new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3"));

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchData = async () => {
    try {
      const [statsRes, pendingRes, openRes, requestedCasesRes, activeCasesRes, userRes] = await Promise.all([
        axios.get("/analytics/lawyer"),
        axios.get("/appointments/received"),
        axios.get("/cases/open"),
        axios.get("/cases/requested"),
        axios.get("/cases/my"), // Fetching already accepted cases
        axios.get(`/auth/user/${user._id}`) // Fetch latest user status
      ]);
      setStats(statsRes.data);
      setSubInfo(statsRes.data.subscription || { tier: "Trial", count: 0, expiry: null, isBlocked: false });

      if (userRes.data && userRes.data.isBlocked) {
        setStats(prev => ({ ...prev, isBlockedByAdmin: true }));
      }

      // 1. Pending Queue (Unaccepted Case Requests + Pending Appointments)
      const mergedPending = [
        ...pendingRes.data.filter(p => p.status === "Pending").map(p => ({ ...p, itemType: 'appointment' })),
        ...requestedCasesRes.data.map(c => ({ 
          _id: c._id, 
          userId: c.user, 
          caseId: c, 
          status: "Requested",
          itemType: 'case_request',
          date: new Date(c.createdAt).toLocaleDateString(),
          time: new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }))
      ];
      
      // 2. Active Workspace (Accepted Cases + Scheduled Appointments)
      const activeStatuses = ["In Progress", "Hearing Scheduled", "Verdict Pending", "Accepted"];
      const activeCaseList = activeCasesRes.data.filter(c => activeStatuses.includes(c.status));
      const acceptedAppts = pendingRes.data.filter(p => p.status === "Accepted");

      const mergedActive = [
        ...activeCaseList.map(c => {
          // Find if there's an appointment linked to this case
          const linkedAppt = acceptedAppts.find(a => a.caseId?._id === c._id || a.caseId === c._id);
          return {
            _id: c._id,
            userId: c.user,
            caseId: c,
            status: "ACCEPTED",
            itemType: 'active_case',
            date: linkedAppt ? linkedAppt.date : "Ongoing",
            time: linkedAppt ? linkedAppt.time : "Consultation"
          };
        }),
        // Add appointments that ARE NOT linked to any of the above active cases
        ...acceptedAppts.filter(a => !activeCaseList.some(c => c._id === (a.caseId?._id || a.caseId))).map(p => ({ 
          ...p, 
          itemType: 'appointment',
          status: "ACCEPTED"
        }))
      ];

      // Filter for UI display
      const litigationPending = mergedPending; // Show all pending requests (including mediation) in the consultation queue
      const litigationActive = mergedActive.filter(a => !a.caseId?.isMediationTrack);

      setPending(litigationPending);
      setActiveWorkspace(litigationActive);

      // REAL-TIME STAT SYNC (Calculate locally for 100% accuracy using ALL cases including mediation)
      const uniqueClients = new Set(mergedActive.map(a => a.userId?._id || a.userId));
      const mediationCount = activeCasesRes.data.filter(c => c.isMediationTrack).length;
      
      setStats({
        activeClients: uniqueClients.size,
        activeCases: litigationActive.length, // Only count litigation for the main 'Cases' box
        activeMediations: mediationCount,
        pendingReviews: litigationPending.length,
        expertName: statsRes.data.expertName
      });

      setOpenCases(openRes.data.filter(c => !c.isMediationTrack));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.verificationStatus !== "verified") {
      navigate("/lawyer/verification-pending");
      return;
    }

    const handleSocketConnect = () => {
      if (user?._id) {
        socket.emit("join", user._id);
        console.log("Joined real-time room:", user._id);
      }
    };

    if (socket.connected) handleSocketConnect();
    socket.on("connect", handleSocketConnect);

    fetchData();
    socket.on("notification", (data) => {
      setToast(data.text || "New notification");
      notificationAudio.play().catch(e => console.log("Interaction needed for sound"));
      fetchData();
      setTimeout(() => setToast(null), 5000);
    });
    socket.on("marketplace-needs-refresh", fetchData);

    const handleBroadcast = (data) => {
      console.log("📣 [DASHBOARD DETECTED BROADCAST]", data);
      notificationAudio.play().catch(e => console.log("Audio play failed on broadcast", e));
      alert(`🏛️ JURISBOT SIGNAL RECEIVED\n\nPriority: ${String(data.priority).toUpperCase()}\nTitle: ${data.title}\nMessage: ${data.message}`);
      setBroadcast(data);
      const isEmergency = String(data.priority).toLowerCase() === 'emergency';
      if (!isEmergency) {
        setTimeout(() => setBroadcast(null), 10000);
      }
    };
    socket.on("institutional-broadcast", handleBroadcast);
    socket.on("institutional-broadcast-lawyer", handleBroadcast);

    return () => {
      socket.off("connect", handleSocketConnect);
      socket.off("notification");
      socket.off("marketplace-needs-refresh");
      socket.off("institutional-broadcast", handleBroadcast);
      socket.off("institutional-broadcast-lawyer", handleBroadcast);
    };
  }, []);

  const handleTakeCase = async (id) => {
    if (isQuotaExceeded) {
      alert("⚠️ Quota Exceeded: Please upgrade your subscription plan to accept new cases.");
      navigate("/lawyer/subscription");
      return;
    }
    try {
      await axios.post(`/cases/${id}/assign`);
      setToast("Case successfully assigned to your workspace");
      setTimeout(() => setToast(null), 4000);
      fetchData();
    } catch (err) {
      alert("Failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleStatusUpdate = async (id, newStatus, itemType) => {
    try {
      if (itemType === 'case_request') {
        if (isQuotaExceeded && newStatus === 'Accepted') {
          alert("⚠️ Quota Exceeded: Please upgrade your subscription plan to accept new client requests.");
          navigate("/lawyer/subscription");
          return;
        }
        await axios.post(`/cases/accept/${id}`);
        setToast("Case Accepted! You can now start the consultation.");
      } else {
        const appt = pending.find((p) => p._id === id);
        await axios.patch(`/appointments/${id}/status`, { status: newStatus });
        if (newStatus === "Accepted" && appt?.userId?._id) {
          socket.emit("notify", { to: appt.userId._id, text: "Your consultation request has been accepted!" });
        }
      }
      fetchData();
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      alert("Action failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleExportReport = () => {
    const csvContent = `data:text/csv;charset=utf-8,`
      + `Report Generated On,${new Date().toLocaleString()}\n\n`
      + `PRACTICE SUMMARY\n`
      + `Active Clients,${stats.activeClients || 0}\n`
      + `Total Cases,${stats.totalCases || 0}\n`
      + `Pending Reviews,${stats.pendingApps || 0}\n\n`
      + `MEMBERSHIP DETAILS\n`
      + `Tier,${subInfo.tier}\n`
      + `Cases Claimed,${subInfo.count}\n`
      + `Limit Exceeded,${subInfo.isBlocked ? 'Yes' : 'No'}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jurisbot_practice_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const urgencyColor = (u) =>
    u === "Emergency" ? "#ef4444" : u === "High" ? "#f59e0b" : "#10b981";

  return (
    <div className="ld-page">
      {broadcast && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
          background: String(broadcast.priority).toLowerCase() === 'emergency' ? '#ef4444' : '#0f111a',
          color: 'white', padding: '20px', textAlign: 'center',
          borderBottom: '4px solid #c9a84c', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontFamily: 'Playfair Display' }}>
            {String(broadcast.priority).toLowerCase() === 'emergency' ? '🚨 URGENT INSTITUTIONAL DIRECTIVE' : '🏛️ JURISBOT INSTITUTIONAL NOTICE'}
          </h2>
          <h3 style={{ margin: '0 0 5px 0' }}>{broadcast.title}</h3>
          <p style={{ margin: '0 0 15px 0', opacity: 0.9 }}>{broadcast.message}</p>
          <button 
            onClick={() => setBroadcast(null)}
            style={{ background: 'white', color: '#0f111a', border: 'none', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Acknowledge
          </button>
        </div>
      )}
      
      {/* 🔴 ADMIN BLOCK OVERLAY */}
      {stats.isBlockedByAdmin && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 17, 26, 0.95)', zIndex: 999999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'white', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛑</div>
          <h1 style={{ fontSize: '2.5rem', color: '#ef4444', marginBottom: '10px' }}>Account Suspended</h1>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '500px', textAlign: 'center', lineHeight: '1.6' }}>
            Your JurisBot practitioner account has been blocked by the Administrator. 
            You are currently in <strong>View-Only Mode</strong>. You cannot accept new cases, reply to clients, or access the marketplace.
          </p>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            style={{ marginTop: '30px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Logout
          </button>
        </div>
      )}

      {/* ⚠️ QUOTA EXCEEDED MODAL */}
      {!stats.isBlockedByAdmin && isQuotaExceeded && !hasDismissedQuota && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 17, 26, 0.95)', zIndex: 999999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'white', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
          <h1 style={{ fontSize: '2.5rem', color: '#f59e0b', marginBottom: '10px', textAlign: 'center' }}>Subscription Quota Exceeded</h1>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '500px', textAlign: 'center', lineHeight: '1.6' }}>
            You have reached the <strong>{limit} Case</strong> limit of your <strong>{subInfo.tier} Plan</strong>. 
            <br/><br/>
            You can still manage your active clients, but your account is now in <strong>View-Only Mode</strong> for accepting new cases from the marketplace.
          </p>
          <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button 
              onClick={() => setHasDismissedQuota(true)}
              style={{ background: 'transparent', border: '1px solid #94a3b8', color: '#94a3b8', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              OK, Understood
            </button>
            <button 
              onClick={() => navigate("/lawyer/subscription")}
              style={{ background: '#f59e0b', border: 'none', color: '#0f111a', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      )}
      
      <Sidebar />

      <div className="ld-body">

        {/* -- Subscription Status Bar -- */}
        {subInfo && (
          <div className={`ld-sub-bar ${subInfo.tier}`}>
            <div className="ld-sub-info">
              <span className="ld-sub-tier">{subInfo.tier.toUpperCase()} PLAN</span>
              <span className="ld-sub-divider">|</span>
              <span className="ld-sub-usage">
                {subInfo.tier === "Unlimited" ? "Infinite Access" : `Usage: ${subInfo.count} / ${limit} Cases`}
              </span>
            </div>
            {subInfo.tier !== "Unlimited" && (
              <button className="ld-upgrade-btn" onClick={() => navigate("/lawyer/subscription")} style={isQuotaExceeded ? { backgroundColor: '#ef4444', color: 'white', borderColor: '#ef4444' } : {}}>
                {isQuotaExceeded ? "Quota Exceeded - Upgrade Plan" : "Upgrade Plan"}
              </button>
            )}
          </div>
        )}

        {/* -- Top Bar -- */}
        <header className="ld-topbar">
          <div>
            <h1 className="ld-title">Practitioner Console</h1>
            <p className="ld-subtitle">Welcome back, {stats.expertName || "Advocate"}</p>
          </div>
          <div className="ld-topbar-right" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {toast && <div className="ld-toast">{toast}</div>}
            <button 
              onClick={() => window.dispatchEvent(new Event("open-pwa-modal"))}
              style={{ background: "rgba(201, 168, 76, 0.2)", border: "1px solid #c9a84c", color: "#c9a84c", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", gap: "6px", alignItems: "center" }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
              Install App
            </button>
            <button 
              onClick={handleExportReport}
              style={{ background: 'transparent', border: '1px solid var(--ld-border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export Report
            </button>
            <div className="ld-live-badge">
              <span className="ld-pulse-dot" />
              Live
            </div>
          </div>
        </header>

        {/* -- Stats -- */}
        <section className="ld-stats">
          {[
            { label: "Active Clients", value: stats.activeClients || 0, accent: "#3b82f6",
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
            { label: "Active Cases", value: stats.activeCases || 0, accent: "#c9a84c",
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg> },
            { label: "ADR / Mediations", value: stats.activeMediations || 0, accent: "#8b5cf6",
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
            { label: "Pending Reviews", value: stats.pendingReviews || 0, accent: "#10b981",
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          ].map((s) => (
            <div className="ld-stat-card" key={s.label} style={{ "--accent": s.accent }}>
              <div className="ld-stat-icon">{s.icon}</div>
              <div className="ld-stat-value">{s.value}</div>
              <div className="ld-stat-label">{s.label}</div>
            </div>
          ))}
        </section>

        {/* -- Section Tabs -- */}
        <div className="ld-tabs">
          {[
            { id: "queue", label: "Consultation Queue", count: pending.length },
            { id: "workspace", label: "Active Workspace", count: activeWorkspace.length },
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

        {/* -- QUEUE -- */}
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
              <div className="ld-kanban-grid">
                {pending.map((p) => (
                  <div key={p._id} className="ld-case-card">
                    <div className="ld-card-header">
                      <div className={`ld-priority-badge ${p.caseId?.urgency?.toLowerCase() || 'normal'}`}>
                        {p.caseId?.urgency || 'Consultation'}
                      </div>
                      <div className="ld-card-date">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {p.date} • {p.time}
                      </div>
                    </div>
                    
                    <h3 className="ld-card-title">{p.caseId ? p.caseId.title : "General Legal Consultation"}</h3>
                    
                    <div className="ld-card-meta">
                      <div className="ld-client-pill">
                        <div className="ld-client-avatar">{(p.userId?.name?.[0] || "A").toUpperCase()}</div>
                        <span className="ld-client-name">{p.userId?.name || "Anonymous Client"}</span>
                      </div>
                      {p.caseId?.isMediationTrack && (
                        <span style={{ fontSize: '11px', color: '#c4b5fd', fontWeight: '700', padding: '4px 8px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                          Mediation Request
                        </span>
                      )}
                    </div>

                    <div className="ld-card-footer">
                      <div className="ld-card-actions">
                        <button className="ld-card-btn primary" onClick={() => handleStatusUpdate(p._id, "Accepted", p.itemType)}>
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                          Accept
                        </button>
                        {p.caseId && (
                          <button className="ld-card-btn secondary" onClick={() => navigate(p.caseId.isMediationTrack ? `/mediation-workspace/${p.caseId._id}` : `/case/${p.caseId._id}`)}>
                            Review Brief
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -- WORKSPACE (Active) -- */}
        {activeSection === "workspace" && (
          <div className="ld-panel">
            {activeWorkspace.length === 0 ? (
              <div className="ld-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                No active consultations at the moment.
              </div>
            ) : (
              <div className="ld-kanban-grid">
                {activeWorkspace.map((p) => (
                  <div key={p._id} className="ld-case-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <div className="ld-card-header">
                      <div className="ld-priority-badge normal" style={{ background: 'var(--gold)', color: '#0f111a', border: 'none' }}>
                        ACTIVE
                      </div>
                      <div className="ld-card-date">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {p.date} • {p.time}
                      </div>
                    </div>
                    
                    <h3 className="ld-card-title">{p.caseId ? p.caseId.title : "Direct Consultation"}</h3>
                    
                    <div className="ld-card-meta">
                      <div className="ld-client-pill">
                        <div className="ld-client-avatar" style={{ background: '#3b82f6', color: '#fff' }}>{(p.userId?.name?.[0] || "A").toUpperCase()}</div>
                        <span className="ld-client-name">{p.userId?.name || "Anonymous Client"}</span>
                      </div>
                      {p.caseId?.isMediationTrack && (
                        <span style={{ fontSize: '11px', color: '#c4b5fd', fontWeight: '700', padding: '4px 8px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                          Mediation Track
                        </span>
                      )}
                    </div>

                    <div className="ld-card-footer">
                      <div className="ld-card-actions">
                        <button className="ld-card-btn primary" onClick={() => navigate(`/chat/${p.userId?._id}`)}>
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                          Consult
                        </button>
                        {p.caseId && (
                          <button className="ld-card-btn secondary" onClick={() => navigate(p.caseId.isMediationTrack ? `/mediation-workspace/${p.caseId._id}` : `/case/${p.caseId._id}`)}>
                            Brief
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -- MARKETPLACE -- */}
        {activeSection === "marketplace" && (
          <div className="ld-panel">
            {openCases.length === 0 ? (
              <div className="ld-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                No open cases matching your specialization.
              </div>
            ) : (
              <div className="ld-kanban-grid">
                {openCases.map((c) => (
                  <div key={c._id} className="ld-case-card">
                    <div className="ld-card-header">
                      <div className={`ld-priority-badge ${c.urgency?.toLowerCase() || 'normal'}`}>
                        {c.urgency || 'Normal'} Priority
                      </div>
                      <div className="ld-card-date">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Open Pool
                      </div>
                    </div>
                    
                    <h3 className="ld-card-title">{c.title}</h3>
                    
                    <div className="ld-card-meta">
                      <div className="ld-client-pill">
                        <div className="ld-client-avatar">{(c.user?.name?.[0] || "A").toUpperCase()}</div>
                        <span className="ld-client-name">{c.user?.name || "Anonymous Client"}</span>
                      </div>
                      {c.isMediationTrack ? (
                        <span style={{ fontSize: '11px', color: '#c4b5fd', fontWeight: '700', padding: '4px 8px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                          Mediation Request
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: '700', padding: '4px 8px', background: 'rgba(201,168,76,0.1)', borderRadius: '6px' }}>{c.type}</span>
                      )}
                    </div>

                    <div className="ld-card-footer">
                      <div className="ld-card-actions">
                        <button className="ld-card-btn primary" onClick={() => handleTakeCase(c._id)}>
                          Claim Case
                        </button>
                        <button className="ld-card-btn secondary" onClick={() => navigate(c.isMediationTrack ? `/mediation-workspace/${c._id}` : `/case/${c._id}`)}>
                          View Brief
                        </button>
                      </div>
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
