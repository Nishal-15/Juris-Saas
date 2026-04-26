import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import axios from "../api/axios";
import { socket } from "../socket";
import "./admin.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalLawyers: 0, totalCases: 0, emergencyCases: 0 });
  const [pendingCases, setPendingCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [pendingLawyers, setPendingLawyers] = useState([]);
  const [experts, setExperts] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState("filings");
  const [filter, setFilter] = useState({ search: "", category: "All" });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchData = async () => {
    try {
      // Individual fetching to prevent total failure
      const fetchStats = async () => {
        try {
          const res = await axios.get("/analytics/admin");
          setStats(res.data.stats || stats);
          setPendingCases(res.data.pendingCases || []);
          setAllCases(res.data.allCases || []);
        } catch (e) { console.error("Stats Fetch Error", e); }
      };

      const fetchLawyers = async () => {
        try {
          const res = await axios.get("/admin/pending-lawyers");
          setPendingLawyers(res.data || []);
        } catch (e) { console.error("Lawyer Fetch Error", e); }
      };

      const fetchExperts = async () => {
        try {
          const res = await axios.get("/admin/lawyers");
          setExperts(res.data || []);
        } catch (e) { console.error("Experts Fetch Error", e); }
      };

      const fetchCitizens = async () => {
        try {
          const res = await axios.get("/admin/citizens");
          setCitizens(res.data || []);
        } catch (e) { console.error("Citizens Fetch Error", e); }
      };

      await Promise.all([fetchStats(), fetchLawyers(), fetchExperts(), fetchCitizens()]);
    } catch (err) {
      console.error("Master Admin Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      socket.emit("join", user._id);
    }
    fetchData();
    socket.on("marketplace-needs-refresh", fetchData);
    return () => socket.off("marketplace-needs-refresh");
  }, []);

  const handleVerify = async (id, status) => {
    try {
      await axios.patch(`/admin/verify-lawyer/${id}`, { status });
      fetchData();
    } catch (err) {
      alert("Verification failed.");
    }
  };

  const filteredCases = (activeRightTab === 'filings' ? pendingCases : allCases).filter(c => {
    if (!c) return false;
    const title = c.title || "Untitled Matter";
    const matchesSearch = title.toLowerCase().includes((filter.search || "").toLowerCase());
    const matchesCategory = filter.category === "All" || c.type === filter.category;
    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div className="ad-page">
      <Sidebar />
      <main className="ad-main">
        <div className="ad-panel-empty" style={{ height: '80vh' }}>
          <div className="rc-spinner" />
          <p style={{ marginLeft: '12px' }}>Synchronizing National Legal Data Grid...</p>
        </div>
      </main>
    </div>
  );

  return (
    <div className="ad-page">
      <Sidebar />
      <main className="ad-main">
        <header className="ad-header">
          <div>
            <h1 className="ad-title">Admin Infrastructure Console</h1>
            <p className="ad-subtitle">National Legal Data Grid — Real-time Monitoring</p>
          </div>
          <div className="ad-status-badge">SYSTEM ADMINISTRATOR</div>
        </header>

        {/* Stats Grid */}
        <div className="ad-stats-grid">
          {[
            { label: "TOTAL CITIZENS", val: stats.totalUsers, icon: "👤", color: "#10b981" },
            { label: "LEGAL EXPERTS", val: stats.totalLawyers, icon: "🏢", color: "#f59e0b" },
            { label: "ACTIVE MATTERS", val: stats.totalCases, icon: "📄", color: "#3b82f6" },
            { label: "EMERGENCY FILES", val: stats.emergencyCases, icon: "⚠️", color: "#ef4444" },
          ].map(s => (
            <div className="ad-stat-card" key={s.label} style={{ "--accent": s.color }}>
              <div className="ad-stat-icon-box">
                <span className="ad-stat-icon-char">{s.icon}</span>
                <span className="ad-stat-val-main">{s.val}</span>
              </div>
              <div className="ad-stat-label-main">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="ad-layout-grid">
          {/* Left Panel: Verification Queue */}
          <div className="ad-panel ad-panel-left">
            <div className="ad-panel-head">
              <h2 className="ad-panel-title">Practitioner Verification Queue</h2>
              <span className="ad-count-badge">{pendingLawyers.length} PENDING</span>
            </div>
            <div className="ad-panel-body">
              {pendingLawyers.length === 0 ? (
                <div className="ad-panel-empty">No practitioners awaiting verification.</div>
              ) : (
                <div className="ad-table-scroll">
                  <table className="ad-data-table">
                    <thead>
                      <tr><th>NAME</th><th>EXP</th><th>ACTION</th></tr>
                    </thead>
                    <tbody>
                      {pendingLawyers.map(p => (
                        <tr key={p._id}>
                          <td><strong>{p.name}</strong><br/><small>{p.specialization}</small></td>
                          <td>{p.experience}y</td>
                          <td>
                            <button className="ad-row-btn-verify" onClick={() => handleVerify(p._id, "verified")}>Verify</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Judicial Filings & Marketplace Oversight */}
          <div className="ad-panel ad-panel-right">
            <div className="ad-panel-head ad-flex-between">
               <h2 className="ad-panel-title">System Oversight</h2>
               {activeRightTab === 'filings' && (
                 <div className="ad-mini-filters">
                    <input 
                      type="text" placeholder="Search..." className="ad-filter-input-mini"
                      value={filter.search} onChange={(e) => setFilter({...filter, search: e.target.value})}
                    />
                 </div>
               )}
            </div>
            <div className="ad-panel-head ad-panel-tabs" style={{ paddingTop: 0 }}>
              <button className={`ad-panel-tab ${activeRightTab === 'filings' ? 'active' : ''}`} onClick={() => setActiveRightTab('filings')}>Pending Cases</button>
              <button className={`ad-panel-tab ${activeRightTab === 'citizens' ? 'active' : ''}`} onClick={() => setActiveRightTab('citizens')}>Citizens</button>
              <button className={`ad-panel-tab ${activeRightTab === 'experts' ? 'active' : ''}`} onClick={() => setActiveRightTab('experts')}>Experts</button>
            </div>
            <div className="ad-panel-body">
              {activeRightTab === "filings" && (
                <div className="ad-table-scroll">
                  <table className="ad-data-table">
                    <thead>
                      <tr><th>CASE TITLE</th><th>TYPE</th><th>ACTION</th></tr>
                    </thead>
                    <tbody>
                      {filteredCases.map(c => (
                        <tr key={c._id}>
                          <td>
                            <strong>{c.title}</strong><br/>
                            <span className={`ad-pill ${c.urgency === 'Emergency' ? 'ad-pill-red' : ''}`}>{c.urgency}</span>
                          </td>
                          <td><span className="ad-tag-blue">{c.type}</span></td>
                          <td><button className="ad-row-btn-view" onClick={() => window.location.href=`/case/${c._id}`}>View</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {activeRightTab === "experts" && (
                <div className="ad-table-scroll">
                  <table className="ad-data-table">
                    <thead>
                      <tr><th>NAME</th><th>TIER</th><th>CASES</th></tr>
                    </thead>
                    <tbody>
                      {experts.map(e => (
                        <tr key={e._id}>
                          <td><strong>{e.name}</strong></td>
                          <td><span className="ad-pill">VERIFIED</span></td>
                          <td>{e.casesClaimedCount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {activeRightTab === "citizens" && (
                <div className="ad-table-scroll">
                  <table className="ad-data-table">
                    <thead>
                      <tr><th>NAME</th><th>JOINED</th></tr>
                    </thead>
                    <tbody>
                      {citizens.map(c => (
                        <tr key={c._id}>
                          <td><strong>{c.name}</strong><br/><small>{c.email}</small></td>
                          <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Just now"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="ad-settings-grid">
           <div className="ad-setting-card" onClick={() => (window.location.href="/settings")}>
              <div className="ad-setting-icon">⚙️</div>
              <div><h3>System Settings</h3><p>Manage platform parameters</p></div>
           </div>
           <div className="ad-setting-card">
              <div className="ad-setting-icon">📊</div>
              <div><h3>Global Audit</h3><p>View complete system logs</p></div>
           </div>
        </div>
      </main>
    </div>
  );
}
