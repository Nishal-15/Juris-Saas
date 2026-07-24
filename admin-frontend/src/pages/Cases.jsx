import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useToast } from '../components/Toast';
import { FileText, Search, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  
  const toast = useToast();

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await API.get('/admin/all-cases');
      setCases(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Cases Error:", err);
      toast.error("Failed to load cases");
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    const s = search.toLowerCase();
    const matchSearch = !search || 
      (c.title || "").toLowerCase().includes(s) ||
      (c.user?.name || "").toLowerCase().includes(s) ||
      (c.assignedLawyer?.name || "").toLowerCase().includes(s) ||
      (c._id || "").slice(-6).includes(s);
      
    const statusLower = (c.status || "Active").toLowerCase();
    const filterStatLower = statusFilter.toLowerCase();
    const matchStatus = statusFilter === "All" || statusLower.includes(filterStatLower) || filterStatLower.includes(statusLower);
    
    const urgLower = (c.urgency || "Normal").toLowerCase();
    const matchUrg = urgencyFilter === "All" || urgLower === urgencyFilter.toLowerCase();
    
    return matchSearch && matchStatus && matchUrg;
  });

  const getUrgencyBadge = (urgency = "Normal") => {
    const u = urgency.toLowerCase();
    if (u === 'emergency') return { bg: 'var(--red-dim)', col: 'var(--red)' };
    if (u === 'high') return { bg: 'var(--amber-dim)', col: 'var(--amber)' };
    if (u === 'low') return { bg: 'var(--bg-base)', col: 'var(--text-muted)' };
    return { bg: 'var(--blue-dim)', col: 'var(--blue)' };
  };

  const getStatusBadge = (status = "Active") => {
    const s = status.toLowerCase();
    if (s.includes('closed') || s.includes('resolved')) return { bg: 'var(--bg-base)', col: 'var(--text-muted)' };
    if (s.includes('pending')) return { bg: 'var(--amber-dim)', col: 'var(--amber)' };
    return { bg: 'var(--green-dim)', col: 'var(--green)' };
  };

  return (
    <div>
      <style>{`
        .cases-pill { padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
        .filter-select { background: var(--bg-card); border: 1px solid var(--border-dark); color: var(--text-primary); padding: 10px 16px; border-radius: var(--radius-sm); outline: none; font-family: 'Inter', sans-serif; cursor: pointer; }
        .filter-select:focus { border-color: var(--gold); }
        .search-wrap { position: relative; flex: 1; }
        .search-wrap input { width: 100%; padding: 10px 16px 10px 42px; border: 1px solid var(--border-dark); border-radius: var(--radius-sm); box-sizing: border-box; color: var(--text-primary); font-family: 'Inter', sans-serif; outline: none; }
        .search-wrap input:focus { border-color: var(--gold); }
        .search-wrap svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
      `}</style>
      
      <header className="page-header" style={{ marginBottom: '20px' }}>
        <h2>Global Case Intelligence</h2>
      </header>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="cases-pill" style={{ background: 'var(--blue-dim)', color: 'var(--blue)', border: '1px solid var(--blue)' }}>
          <span>Total Cases</span> <span style={{ fontWeight: 800 }}>{cases.length}</span>
        </div>
        <div className="cases-pill" style={{ background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid var(--amber)' }}>
          <span>Unassigned</span> <span style={{ fontWeight: 800 }}>{cases.filter(c => !c.assignedLawyer).length}</span>
        </div>
        <div className="cases-pill" style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)' }}>
          <span>Emergency</span> <span style={{ fontWeight: 800 }}>{cases.filter(c => (c.urgency||'').toLowerCase() === 'emergency').length}</span>
        </div>
        <div className="cases-pill" style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green)' }}>
          <span>Showing</span> <span style={{ fontWeight: 800 }}>{filteredCases.length}</span>
        </div>
      </div>

      <div className="content-section" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="search-wrap">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by title, citizen, lawyer, or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Open">Open</option>
            <option value="Active">Active / In Progress</option>
            <option value="Pending">Pending</option>
            <option value="Closed">Closed</option>
          </select>
          <select className="filter-select" value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
            <option value="All">All Urgency</option>
            <option value="Emergency">Emergency</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <RefreshCw size={32} className="animate-spin" style={{ marginBottom: '16px', color: 'var(--gold)' }} />
              <p>Loading cases...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚖️</div>
              <p>No cases match your filters.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Case Details</th>
                  <th>Citizen</th>
                  <th>Assigned Lawyer</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Date Filed</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => {
                  const urgBadge = getUrgencyBadge(c.urgency);
                  const statBadge = getStatusBadge(c.status);
                  return (
                    <tr key={c._id}>
                      <td>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--gold-dim)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{c.title || "Untitled Matter"}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>#{c._id.slice(-6)} · {c.category || c.legalType || 'General'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                            {(c.user?.name || "U")[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500 }}>{c.user?.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td>
                        {c.assignedLawyer ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gold-dim)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                              {c.assignedLawyer.name[0].toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500 }}>{c.assignedLawyer.name}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--red)', fontSize: '0.9rem', fontWeight: 500 }}>
                            <AlertTriangle size={16} /> Unassigned
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge" style={{ background: urgBadge.bg, color: urgBadge.col }}>
                          {c.urgency || "Normal"}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: statBadge.bg, color: statBadge.col }}>
                          {c.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <Clock size={14} />
                          {new Date(c.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
