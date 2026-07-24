import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useToast } from '../components/Toast';
import { Users, Mail, MapPin, Search, RefreshCw } from 'lucide-react';

export default function Citizens() {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const toast = useToast();

  useEffect(() => {
    fetchCitizens();
  }, []);

  const fetchCitizens = async () => {
    try {
      const res = await API.get('/admin/citizens');
      setCitizens(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Citizens Error:", err);
      toast.error("Failed to load citizens");
      setLoading(false);
    }
  };

  const getIncomeBadge = (income) => {
    const inc = (income || "").toLowerCase();
    if (inc === "high") return { bg: "var(--gold-dim)", col: "var(--gold)" };
    if (inc === "mid") return { bg: "rgba(59,130,246,0.1)", col: "#3b82f6" };
    if (inc === "low") return { bg: "rgba(16,185,129,0.1)", col: "#10b981" };
    return { bg: "var(--bg-base)", col: "var(--text-muted)" };
  };

  const filtered = citizens.filter(c => {
    const s = search.toLowerCase();
    return !search ||
      (c.name || "").toLowerCase().includes(s) ||
      (c.email || "").toLowerCase().includes(s) ||
      (c.city || "").toLowerCase().includes(s);
  });

  return (
    <div>
      <style>{`
        .search-wrap { position: relative; max-width: 400px; margin-bottom: 24px; }
        .search-wrap input { width: 100%; padding: 12px 16px 12px 42px; border: 1px solid var(--border-dark); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-primary); outline: none; transition: var(--transition); }
        .search-wrap input:focus { border-color: var(--gold); }
        .search-wrap svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
      `}</style>

      <header className="page-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2>Citizen Records</h2>
          <div className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.85rem' }}>
            {citizens.length} Total Users
          </div>
        </div>
      </header>

      <div className="search-wrap">
        <Search size={18} />
        <input 
          type="text" 
          placeholder="Search by name, email, or city..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="content-section" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <RefreshCw size={32} className="animate-spin" style={{ marginBottom: '16px', color: 'var(--gold)' }} />
            <p>Loading records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
            <p>{search ? "No citizens match your search." : "No records found."}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Citizen Name</th>
                  <th>Contact Details</th>
                  <th>Location</th>
                  <th>Income Tier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const incomeBadge = getIncomeBadge(c.income);
                  return (
                    <tr key={c._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-base)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                            {(c.name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600' }}>{c.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Joined {new Date(c.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                          <Mail size={14} color="#64748b" /> {c.email}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <MapPin size={14} /> {c.city ? `${c.city}, ${c.state || ''}` : "Not specified"}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: incomeBadge.bg, color: incomeBadge.col, textTransform: 'capitalize' }}>
                          {c.income || "Unspecified"}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-verified">Active</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
