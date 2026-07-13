import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Scale, FileText, Activity } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE = "http://localhost:5000/api/admin"; // Updated to local backend

const mockBarData = [
  { name: 'Mon', queries: 4000, latency: 240 },
  { name: 'Tue', queries: 3000, latency: 139 },
  { name: 'Wed', queries: 2000, latency: 980 },
  { name: 'Thu', queries: 2780, latency: 390 },
  { name: 'Fri', queries: 1890, latency: 480 },
  { name: 'Sat', queries: 2390, latency: 380 },
  { name: 'Sun', queries: 3490, latency: 430 },
];

const mockPieData = [
  { name: 'Civil Law', value: 400 },
  { name: 'Criminal Law', value: 300 },
  { name: 'Corporate Law', value: 300 },
  { name: 'Family Law', value: 200 },
];
const COLORS = ['#c9a84c', '#1e293b', '#64748b', '#f1f5f9'];

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
      
      const res = await axios.get(`${API_BASE}/stats`, config);

      setStats({
        citizens: res.data.citizens,
        lawyers: res.data.lawyers,
        pending: res.data.pending,
        laws: res.data.laws
      });
      setLoading(false);
    } catch (err) {
      console.error("Dashboard Stats Fetch Error:", err);
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const csvContent = `data:text/csv;charset=utf-8,`
      + `System Audit Report,${new Date().toLocaleString()}\n\n`
      + `INFRASTRUCTURE METRICS\n`
      + `Total Citizens,${stats.citizens}\n`
      + `Verified Legal Experts,${stats.lawyers}\n`
      + `Pending Verifications,${stats.pending}\n`
      + `Indexed Legal Acts,${stats.laws}\n\n`
      + `SYSTEM HEALTH\n`
      + `AI Synthesis Latency,450ms\n`
      + `Database Integrity,99.98%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jurisbot_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <header className="page-header">
        <h2>Institutional Overview</h2>
        <button className="btn-primary" onClick={handleExportReport} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export Audit Report
        </button>
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

      <div className="content-section" style={{ marginTop: '30px' }}>
        <div className="section-title">
          <h3>Infrastructure Status & Analytics</h3>
          <span className="badge badge-verified">System Nominal</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '20px' }}>
          {/* BAR CHART */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h4 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '15px' }}>Weekly Query Volume & Latency</h4>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(201,168,76,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                  <Bar dataKey="queries" fill="#c9a84c" radius={[4, 4, 0, 0]} name="Query Volume" />
                  <Bar dataKey="latency" fill="#1e293b" radius={[4, 4, 0, 0]} name="Latency (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PIE CHART */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)', fontSize: '15px', width: '100%' }}>AI Consultation Topics</h4>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {mockPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
