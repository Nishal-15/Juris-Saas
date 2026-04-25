import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import axios from "../api/axios";
import socket from "../socket";
import "./admin.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalLawyers: 0, totalCases: 0, emergencyCases: 0 });
  const [pendingCases, setPendingCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ search: "", category: "All" });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchData = async () => {
    try {
      const res = await axios.get("/analytics/admin");
      setStats(res.data.stats);
      setPendingCases(res.data.pendingCases);
      setAllCases(res.data.allCases);
    } catch (err) {
      console.error("Admin Fetch Error:", err);
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

  const filteredPending = pendingCases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(filter.search.toLowerCase());
    const matchesCategory = filter.category === "All" || c.type === filter.category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="ad-page">
      <Sidebar />
      <main className="ad-main">
        <header className="ad-header">
          <div>
            <h1 className="ad-title">Super Dashboard</h1>
            <p className="ad-subtitle">National Oversight & System Control</p>
          </div>
          <div className="ad-status-badge">MASTER ADMIN</div>
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

        {/* Pending Cases Section with Filters */}
        <div className="ad-panel ad-full-panel">
          <div className="ad-panel-head ad-flex-between">
            <div>
              <h2 className="ad-panel-title">Pending Judicial Filings</h2>
              <p className="ad-panel-sub">Cases awaiting expert assignment or acceptance</p>
            </div>
            <div className="ad-filters">
              <input 
                type="text" 
                placeholder="Search cases..." 
                className="ad-filter-input"
                value={filter.search}
                onChange={(e) => setFilter({...filter, search: e.target.value})}
              />
              <select 
                className="ad-filter-select"
                value={filter.category}
                onChange={(e) => setFilter({...filter, category: e.target.value})}
              >
                <option value="All">All Categories</option>
                <option value="Criminal">Criminal</option>
                <option value="Civil">Civil</option>
                <option value="Property Dispute">Property</option>
                <option value="Family Law">Family</option>
              </select>
            </div>
          </div>

          <div className="ad-panel-body">
            {loading ? (
              <div className="ad-panel-empty">Synchronizing system data...</div>
            ) : filteredPending.length === 0 ? (
              <div className="ad-panel-empty">No pending cases found matching filters.</div>
            ) : (
              <div className="ad-table-scroll">
                <table className="ad-data-table">
                  <thead>
                    <tr>
                      <th>CLIENT</th>
                      <th>CASE MATTER</th>
                      <th>CATEGORY</th>
                      <th>URGENCY</th>
                      <th>FILED ON</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPending.map(c => (
                      <tr key={c._id}>
                        <td>
                          <div className="ad-client-info">
                            <span className="ad-avatar-mini">{c.user?.name?.[0]}</span>
                            <span>{c.user?.name || "Anonymous"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="ad-case-brief">
                            <strong>{c.title}</strong>
                            <span className="ad-case-id">ID: #{c._id.slice(-6).toUpperCase()}</span>
                          </div>
                        </td>
                        <td><span className="ad-tag-blue">{c.type || "General"}</span></td>
                        <td>
                          <span className={`ad-pill ${c.urgency === 'Emergency' ? 'ad-pill-red' : ''}`}>
                            {c.urgency}
                          </span>
                        </td>
                        <td className="ad-muted-text">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="ad-row-btn-view" onClick={() => (window.location.href=`/case/${c._id}`)}>Review Brief</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* System Settings (Quick Access) */}
        <div className="ad-settings-grid">
           <div className="ad-setting-card" onClick={() => (window.location.href="/settings")}>
              <div className="ad-setting-icon">⚙️</div>
              <div>
                <h3>System Settings</h3>
                <p>Manage platform parameters and global defaults</p>
              </div>
           </div>
           <div className="ad-setting-card">
              <div className="ad-setting-icon">📊</div>
              <div>
                <h3>Global Audit</h3>
                <p>View complete system logs and transaction history</p>
              </div>
           </div>
        </div>

      </main>
    </div>
  );
}
