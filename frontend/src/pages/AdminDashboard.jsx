import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import axios from "../api/axios";
import "./admin.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalLawyers: 0, totalCases: 0, emergencyCases: 0 });
  const [recentCases, setRecentCases] = useState([]);
  const [laws, setLaws] = useState([]);
  const [pending, setPending] = useState([]);
  const [experts, setExperts] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState("experts");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use individual try-catch for each to prevent one failure from breaking the whole dashboard
      const statsReq = axios.get("/analytics/admin").catch(e => ({ data: { stats: stats, recentCases: [] } }));
      const pendingReq = axios.get("/admin/pending-lawyers").catch(e => ({ data: [] }));
      const expertsReq = axios.get("/admin/lawyers").catch(e => ({ data: [] }));
      const citizensReq = axios.get("/admin/citizens").catch(e => ({ data: [] }));
      const lawsReq = axios.get("/admin/laws").catch(e => ({ data: [] }));

      const [statsRes, pendingRes, expertsRes, citizensRes, lawsRes] = await Promise.all([
        statsReq, pendingReq, expertsReq, citizensReq, lawsReq
      ]);

      setStats(statsRes.data.stats || stats);
      setRecentCases(statsRes.data.recentCases || []);
      setPending(pendingRes.data || []);
      setExperts(expertsRes.data || []);
      setCitizens(citizensRes.data || []);
      setLaws(lawsRes.data || []);

    } catch (err) {
      console.error("Admin Fetch Error:", err);
      if (err.response?.status === 403) alert("Access Denied: You do not have admin privileges. Please re-login.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await axios.patch(`/admin/verify-lawyer/${id}`, { status });
      alert(`Lawyer ${status} successfully.`);
      fetchData();
    } catch (err) {
      alert("Verification failed.");
    }
  };

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

        {/* Stats Grid - Matching screenshot colors */}
        <div className="ad-stats-grid">
          {[
            { label: "TOTAL CITIZENS", val: stats.totalUsers, icon: "👤", border: "#10b981" },
            { label: "LEGAL EXPERTS", val: stats.totalLawyers, icon: "🏢", border: "#f59e0b" },
            { label: "ACTIVE MATTERS", val: stats.totalCases, icon: "📄", border: "#3b82f6" },
            { label: "EMERGENCY FILES", val: stats.emergencyCases, icon: "⚠️", border: "#ef4444" },
          ].map(s => (
            <div className="ad-stat-card" key={s.label} style={{ borderTop: `4px solid ${s.border}` }}>
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
              <span className="ad-count-badge">{pending.length} PENDING</span>
            </div>
            <div className="ad-panel-body">
              {pending.length === 0 ? (
                <div className="ad-panel-empty">No practitioners awaiting verification.</div>
              ) : (
                <div className="ad-table-scroll">
                  <table className="ad-data-table">
                    <thead>
                      <tr><th>NAME</th><th>SPECIALIZATION</th><th>EXP</th><th>ACTION</th></tr>
                    </thead>
                    <tbody>
                      {pending.map(p => (
                        <tr key={p._id}>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.specialization}</td>
                          <td>{p.experience}</td>
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

          {/* Right Panel: Tabs */}
          <div className="ad-panel ad-panel-right">
            <div className="ad-panel-head">
               <h2 className="ad-panel-title">Recent Judicial Filings</h2>
            </div>
            <div className="ad-panel-head ad-panel-tabs" style={{ paddingTop: 0 }}>
              <button className={`ad-panel-tab ${activeRightTab === 'filings' ? 'active' : ''}`} onClick={() => setActiveRightTab('filings')}>Filings</button>
              <button className={`ad-panel-tab ${activeRightTab === 'citizens' ? 'active' : ''}`} onClick={() => setActiveRightTab('citizens')}>Citizens</button>
              <button className={`ad-panel-tab ${activeRightTab === 'experts' ? 'active' : ''}`} onClick={() => setActiveRightTab('experts')}>Experts</button>
            </div>
            <div className="ad-panel-body">
              {activeRightTab === "experts" && (
                <div className="ad-table-scroll">
                  <table className="ad-data-table">
                    <thead>
                      <tr><th>EXPERT NAME</th><th>BAR ID</th><th>TIER</th><th>CASES</th></tr>
                    </thead>
                    <tbody>
                      {experts.map(e => (
                        <tr key={e._id}>
                          <td><strong>{e.name}</strong></td>
                          <td className="ad-muted-text">#{e._id.slice(-6).toUpperCase()}</td>
                          <td><span className="ad-pill">TRIAL</span></td>
                          <td className="ad-center-text">{e.caseCount || e.casesClaimedCount || 0}</td>
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
                      <tr><th>CITIZEN NAME</th><th>EMAIL</th><th>JOINED</th></tr>
                    </thead>
                    <tbody>
                      {citizens.length === 0 ? (
                        <tr><td colSpan="3" className="ad-panel-empty">No registered citizens found with 'user' role.</td></tr>
                      ) : (
                        citizens.map(c => (
                          <tr key={c._id}>
                            <td><strong>{c.name}</strong></td>
                            <td className="ad-muted-text">{c.email}</td>
                            <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {activeRightTab === "filings" && (
                <div className="ad-table-scroll">
                  <table className="ad-data-table">
                    <thead>
                      <tr><th>TITLE</th><th>STATUS</th><th>URGENCY</th></tr>
                    </thead>
                    <tbody>
                      {recentCases.length === 0 ? (
                        <tr><td colSpan="3" className="ad-panel-empty">No recent filings detected.</td></tr>
                      ) : (
                        recentCases.map(c => (
                          <tr key={c._id}>
                            <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.title}>
                              <strong>{c.title || "Untitled Matter"}</strong>
                            </td>
                            <td><span className="ad-pill">{c.status || "Open"}</span></td>
                            <td>
                              <span className={`ad-pill ${c.urgency === 'Emergency' ? 'ad-pill-red' : ''}`}>
                                {c.urgency}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Panel: Knowledge Base */}
        <div className="ad-panel ad-bottom-panel">
          <div className="ad-bottom-row">
            <div>
              <h2 className="ad-panel-title">Knowledge Base Management</h2>
              <p className="ad-panel-sub">Update federal laws and legal documentation</p>
            </div>
            <button className="ad-btn-green-pill" onClick={() => document.getElementById('law-upload-admin').click()}>
              Upload New Law PDF
            </button>
            <input 
              type="file" id="law-upload-admin" style={{ display: 'none' }} 
              onChange={async (e) => {
                const file = e.target.files[0]; if (!file) return;
                const fd = new FormData(); fd.append("pdf", file);
                try {
                  const res = await axios.post("/admin/upload-law", fd, { headers: { "Content-Type": "multipart/form-data" } });
                  alert(res.data.message);
                  fetchData();
                } catch { alert("Upload failed"); }
              }}
            />
          </div>
          <div className="ad-law-list">
            {laws.length === 0 ? (
              <p className="ad-muted-text" style={{ fontSize: '12px' }}>No law documents indexed yet.</p>
            ) : (
              laws.map(law => (
                <span key={law} className="ad-law-badge">{law.replace(/_/g, ' ').toUpperCase()} (ACTIVE)</span>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
