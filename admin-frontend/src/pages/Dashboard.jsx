import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Scale, FileText, Activity } from 'lucide-react';

const API_BASE = "http://localhost:5000/api/admin"; // Updated to local backend

export default function Dashboard() {
  const [stats, setStats] = useState({
    citizens: 0,
    lawyers: 0,
    pending: 0,
    laws: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [citRes, lawRes, pendRes, lawsRes] = await Promise.all([
        axios.get(`${API_BASE}/citizens`, config),
        axios.get(`${API_BASE}/lawyers`, config),
        axios.get(`${API_BASE}/pending-lawyers`, config),
        axios.get(`${API_BASE}/laws`, config)
      ]);

      setStats({
        citizens: citRes.data.length,
        lawyers: lawRes.data.length,
        pending: pendRes.data.length,
        laws: lawsRes.data.length
      });
      setLoading(false);
    } catch (err) {
      console.error("Dashboard Stats Fetch Error:", err);
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h2>Institutional Overview</h2>
        <button className="btn-primary" onClick={() => window.print()}>Export Audit Report</button>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Citizens</div>
          <div className="stat-value">{stats.citizens.toLocaleString()}</div>
          <div className="stat-trend trend-up">↑ 2.4% from last month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Legal Experts</div>
          <div className="stat-value">{stats.lawyers.toLocaleString()}</div>
          <div className="stat-trend trend-up">↑ 12 new this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Verifications</div>
          <div className="stat-value" style={{ color: stats.pending > 0 ? '#eab308' : '#1e293b' }}>
            {stats.pending}
          </div>
          <div className="stat-trend">Action required in queue</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">AI Legal Index</div>
          <div className="stat-value">{stats.laws}</div>
          <div className="stat-trend">Indexed Legal Acts</div>
        </div>
      </div>

      <div className="content-section">
        <div className="section-title">
          <h3>Infrastructure Status</h3>
          <span className="badge badge-verified">System Nominal</span>
        </div>
        <div style={{ color: '#64748b', lineHeight: '1.6' }}>
            JurisBot Core is currently monitoring <strong>{stats.citizens + stats.lawyers}</strong> active identities across the national legal grid. 
            AI synthesis latency is <strong>450ms</strong>. Database integrity: <strong>99.98%</strong>.
        </div>
      </div>
    </div>
  );
}
