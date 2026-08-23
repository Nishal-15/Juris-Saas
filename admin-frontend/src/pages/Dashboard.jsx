import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { io } from 'socket.io-client';
import { useToast } from '../components/Toast';
import { SUPPORTED_LANGUAGES, getLangFlag } from '../config/languages';
import { Users, Scale, FileText, Activity, Clock, BookOpen, RefreshCw, Download, Gavel } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// 8 distinct, readable colors that work on white background
const COLORS = [
  '#c9a84c', // Gold — Civil
  '#3b82f6', // Blue — Criminal
  '#10b981', // Green — Family
  '#ef4444', // Red — Property
  '#8b5cf6', // Purple — Corporate
  '#f59e0b', // Amber — Consumer
  '#06b6d4', // Cyan — Labour
  '#ec4899', // Pink — Others
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    citizens: 0,
    lawyers: 0,
    pending: 0,
    laws: 0,
    mediationCases: 0
  });
  
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [lastSync, setLastSync] = useState(null);
  const [lastActivity, setLastActivity] = useState(null);
  const [tierData, setTierData] = useState(null);
  const [langStats, setLangStats] = useState([]);
  const toast = useToast();

  useEffect(() => {
    fetchStats();
    fetchTierData();
    fetchLangStats();

    const socket = io(
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_BASE
        ?.replace("/api", "") ||
      "http://localhost:5000",
      {
        reconnection:        true,
        reconnectionAttempts:10,
        reconnectionDelay:   2000,
        transports:          ["websocket", "polling"]
      }
    );
    
    socket.on("marketplace-needs-refresh", () => {
      fetchStats();
    });
    
    socket.on("new-verification-request", () => {
      fetchStats();
    });
    
    socket.on("platform-activity", (data) => {
      setLastActivity(data.message || "New activity detected");
      setTimeout(() => setLastActivity(null), 5000);
    });
    
    return () => socket.disconnect();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get('/admin/stats');
      setStats({
        citizens: res.data.citizens,
        lawyers: res.data.lawyers,
        pending: res.data.pending,
        laws: res.data.laws,
        mediationCases: res.data.mediationCases || 0
      });
      setBarData(res.data.barData || []);
      setPieData(res.data.pieData || []);
      setLastSync(new Date());
      setLoading(false);
    } catch (err) {
      console.error("Dashboard Stats Fetch Error:", err);
      toast.error("Failed to load dashboard stats");
      setLoading(false);
    }
  };

  const fetchTierData = async () => {
    try {
      const res = await API.get('/admin/tier-analytics');
      setTierData(res.data);
    } catch (err) {
      console.error("Tier Analytics Error:", err);
    }
  };

  const fetchLangStats = async () => {
    try {
      const res = await API.get('/admin/language-stats');
      setLangStats(res.data || []);
    } catch {
      /* Silent fail — non-critical */
    }
  };

  const handleExportReport = () => {
    const csvContent = `data:text/csv;charset=utf-8,`
      + `System Audit Report,${new Date().toLocaleString()}\n\n`
      + `INFRASTRUCTURE METRICS\n`
      + `Total Citizens,${stats.citizens}\n`
      + `Verified Legal Experts,${stats.lawyers}\n`
      + `Pending Verifications,${stats.pending}\n`
      + `Indexed Legal Acts,${stats.laws}\n`;

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
      <header className="page-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2>Institutional Overview</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
            {lastSync ? `Last synced ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Syncing...'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn-outline" onClick={fetchStats} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn-primary" onClick={handleExportReport} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Download size={16} />
            Export Audit Report
          </button>
        </div>
      </header>

      {/* System Status Strip */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '14px', marginBottom: '15px', gap: '20px', overflowX: 'auto' }}>

        <div className="sys-item"><div className="pulse-dot"></div><span className="sys-lbl">AI Engine</span><span className="sys-stat">Nominal</span></div><div className="sys-div"></div>
        <div className="sys-item"><div className="pulse-dot"></div><span className="sys-lbl">Database</span><span className="sys-stat">Connected</span></div><div className="sys-div"></div>
        <div className="sys-item"><div className="pulse-dot"></div><span className="sys-lbl">WhatsApp</span><span className="sys-stat">Active</span></div><div className="sys-div"></div>
        <div className="sys-item"><div className="pulse-dot"></div><span className="sys-lbl">Video Bridge</span><span className="sys-stat">Ready</span></div><div className="sys-div"></div>
        <div className="sys-item"><div className="pulse-dot"></div><span className="sys-lbl">Scheduler</span><span className="sys-stat">Running</span></div>
      </div>

      {lastActivity && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', background: 'var(--gold-dim)', borderRadius: '10px', marginBottom: '25px', gap: '10px', animation: 'fadeInUp 0.3s ease' }}>
          <div className="pulse-dot" style={{ background: 'var(--gold)', boxShadow: 'none' }}></div>
          <span style={{ color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 600 }}>{lastActivity}</span>
        </div>
      )}

      {!lastActivity && <div style={{ marginBottom: '25px' }}></div>}

      <div className="stats-grid">
        <div className="stat-card" style={{ padding: '24px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)' }}></div>
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1, flexShrink: 0, width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(59,130,246,0.10)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div className="stat-label">Total Citizens</div>
          <div className="stat-value">{stats.citizens.toLocaleString()}</div>
          <div className="stat-trend trend-up">↑ Active Users</div>
        </div>
        
        <div className="stat-card" style={{ padding: '24px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }}></div>
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1, flexShrink: 0, width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(201,168,76,0.10)', color: '#c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={22} />
          </div>
          <div className="stat-label">Legal Experts</div>
          <div className="stat-value">{stats.lawyers.toLocaleString()}</div>
          <div className="stat-trend trend-up">↑ Verified network</div>
        </div>
        
        <div className="stat-card" style={{ padding: '24px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }}></div>
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1, flexShrink: 0, width: '44px', height: '44px', borderRadius: '14px', background: stats.pending > 0 ? 'rgba(245,158,11,0.10)' : 'rgba(148,163,184,0.1)', color: stats.pending > 0 ? '#f59e0b' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div className="stat-label">Pending Verifications</div>
          <div className="stat-value" style={{ color: stats.pending > 0 ? 'var(--amber)' : 'inherit' }}>{stats.pending}</div>
          <div className="stat-trend" style={{ color: stats.pending > 0 ? 'var(--amber)' : 'inherit' }}>{stats.pending > 0 ? '→ Action required in queue' : 'Queue is clear'}</div>
        </div>
        
        <div className="stat-card" style={{ padding: '24px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg, transparent, #10b981, transparent)' }}></div>
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1, flexShrink: 0, width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(16,185,129,0.10)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} />
          </div>
          <div className="stat-label">AI Legal Index</div>
          <div className="stat-value">{stats.laws}</div>
          <div className="stat-trend trend-up">↑ Indexed Legal Acts</div>
        </div>

        <div className="stat-card" style={{ padding: "24px" }}>
          <div style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%",
            height: "3px",
            background: "linear-gradient(90deg, transparent, #8b5cf6, transparent)"
          }} />
          <div style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            zIndex: 1,
            flexShrink: 0,
            width: "44px",
            height: "44px",
            borderRadius: "14px",
            background: "rgba(139,92,246,0.10)",
            color: "#8b5cf6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Gavel size={22} />
          </div>
          <div className="stat-label">
            Mediation Eligible
          </div>
          <div className="stat-value">
            {stats.mediationCases}
          </div>
          <div className="stat-trend" style={{ color: "#8b5cf6" }}>
            → Under Mediation Act 2023
          </div>
        </div>
      </div>

      <div className="content-section" style={{ marginTop: '30px' }}>
        <div className="section-title">
          <h3>Infrastructure Status & Analytics</h3>
          <span className="badge badge-verified">System Nominal</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '20px' }}>
          {/* BAR CHART */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '15px' }}>Weekly Query Volume</h4>
            <div style={{ width: '100%', height: 300 }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Loading chart...</div>
              ) : barData && barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(201,168,76,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="queries" fill="#c9a84c" radius={[4, 4, 0, 0]} name="Query Volume" />
                </BarChart>
              </ResponsiveContainer>
              ) : (<p style={{ padding: '40px', textAlign: 'center' }}>No data available</p>)}
            </div>
          </div>

          {/* PIE CHART */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)', fontSize: '15px', width: '100%' }}>AI Consultation Topics</h4>
            <div style={{ width: '100%', height: 260 }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Loading chart...</div>
              ) : pieData && pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
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
              ) : (<p style={{ padding: '40px', textAlign: 'center' }}>No data available</p>)}
            </div>
          </div>
        </div>
      </div>

      {/* Tier Analytics */}
      <div className="content-section" style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Intelligent Matching Analytics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          
          {/* Lawyers */}
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>Lawyer Tiers</h4>
            {[
              { label: 'Tier 1 Senior', key: 'tier1', color: '#c9a84c' },
              { label: 'Tier 2 Experienced', key: 'tier2', color: '#3b82f6' },
              { label: 'Tier 3 Junior', key: 'tier3', color: '#10b981' }
            ].map(item => {
              const count = tierData?.lawyers?.[item.key] || 0;
              const max = Math.max(...Object.values(tierData?.lawyers || {a:1}));
              const width = max > 0 ? (count / max) * 100 : 0;
              return (
                <div key={item.key} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-light)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: item.color, width: `${width}%`, transition: 'width 0.8s ease' }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Courts */}
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>Cases by Court</h4>
            {[
              { label: 'Supreme', key: 'supreme', color: '#c9a84c' },
              { label: 'High', key: 'high', color: '#3b82f6' },
              { label: 'District', key: 'district', color: '#10b981' },
              { label: 'Consumer', key: 'consumer', color: '#8b5cf6' }
            ].map(item => {
              const count = tierData?.courts?.[item.key] || 0;
              const max = Math.max(...Object.values(tierData?.courts || {a:1}));
              const width = max > 0 ? (count / max) * 100 : 0;
              return (
                <div key={item.key} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-light)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: item.color, width: `${width}%`, transition: 'width 0.8s ease' }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top Languages */}
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>Top Languages</h4>

            {langStats.length === 0 ? (
              SUPPORTED_LANGUAGES
                .slice(0, 5)
                .map((lang, i) => (
                  <div key={lang.code} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '5px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {lang.flag} {lang.name}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>—</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-base)', borderRadius: '4px' }}>
                      <div style={{
                        height: '100%',
                        width: `${(5 - i) * 18}%`,
                        background: 'var(--gold)',
                        borderRadius: '4px',
                        opacity: 0.4 + i * 0.1
                      }} />
                    </div>
                  </div>
                ))
            ) : (
              langStats.slice(0, 5).map((stat, i) => {
                const lang = SUPPORTED_LANGUAGES.find(l => l.code === stat._id) || {
                  flag: "🌐",
                  name: stat._id || "Unknown",
                  code: stat._id
                };
                const maxCount = langStats[0]?.count || 1;
                const pct = Math.round((stat.count / maxCount) * 100);
                return (
                  <div key={stat._id} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '5px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {lang.flag} {lang.name}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stat.count}</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-base)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'var(--gold)',
                        borderRadius: '4px',
                        transition: 'width 0.8s ease'
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
