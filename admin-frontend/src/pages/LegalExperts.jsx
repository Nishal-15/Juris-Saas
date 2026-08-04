import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useToast } from '../components/Toast';
import { Scale, Star, Briefcase, Search, RefreshCw, XCircle, ShieldAlert } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function buildFileUrl(rawPath) {
  if (!rawPath) return null;
  if (rawPath.startsWith("http")) return rawPath;
  const normalized = rawPath.replace(/\\/g, "/");
  const idx = normalized.indexOf("uploads/");
  if (idx === -1) return null;
  return `${API_BASE}/${normalized.slice(idx)}`;
}

export default function LegalExperts() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  
  const toast = useToast();

  useEffect(() => {
    fetchLawyers();
  }, []);

  const fetchLawyers = async () => {
    try {
      const res = await API.get('/admin/lawyers');
      setLawyers(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Lawyers Error:", err);
      toast.error("Failed to load experts");
      setLoading(false);
    }
  };

  const toggleBlock = async (id, currentStatus) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    
    setActing(prev => ({ ...prev, [id]: true }));
    setConfirmId(null);
    
    try {
      const isBlocked = !currentStatus;
      await API.patch(`/admin/block-lawyer/${id}`, { isBlocked });
      toast.success(`Lawyer ${isBlocked ? 'blocked' : 'unblocked'} successfully`);
      fetchLawyers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Action failed");
    } finally {
      setActing(prev => ({ ...prev, [id]: false }));
    }
  };

  const getSubBadge = (tier) => {
    const t = (tier || "Trial").toLowerCase();
    if (t === "pro") return { bg: "var(--gold-dim)", col: "var(--gold)" };
    if (t === "starter") return { bg: "rgba(59,130,246,0.1)", col: "#3b82f6" };
    if (t === "expired") return { bg: "rgba(239,68,68,0.1)", col: "#ef4444" };
    return { bg: "var(--bg-base)", col: "var(--text-muted)" };
  };

  const filtered = lawyers.filter(l => {
    const s = search.toLowerCase();
    return !search ||
      (l.name || "").toLowerCase().includes(s) ||
      (l.email || "").toLowerCase().includes(s) ||
      (l.specialization || "").toLowerCase().includes(s) ||
      (l.barId || "").toLowerCase().includes(s);
  });

  return (
    <div>
      <style>{`
        .search-wrap { position: relative; max-width: 400px; margin-bottom: 24px; }
        .search-wrap input { width: 100%; padding: 12px 16px 12px 42px; border: 1px solid var(--border-dark); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-primary); outline: none; transition: var(--transition); }
        .search-wrap input:focus { border-color: var(--gold); }
        .search-wrap svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        
        .tier-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          margin: 2px;
          border: 1px solid var(--border-dark);
          background: var(--bg-base);
          color: var(--text-secondary);
        }
      `}</style>

      <header className="page-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2>Legal Experts Directory</h2>
          <div className="badge badge-verified">{lawyers.length} Verified Practitioners</div>
        </div>
      </header>

      <div className="search-wrap">
        <Search size={18} />
        <input 
          type="text" 
          placeholder="Search by name, email, or Bar ID..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="content-section" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <RefreshCw size={32} className="animate-spin" style={{ marginBottom: '16px', color: 'var(--gold)' }} />
            <p>Loading directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚖️</div>
            <p>{search ? "No matching experts found." : "No verified legal experts found."}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Expert Details</th>
                  <th>Practice Tiers</th>
                  <th>Metrics</th>
                  <th>Subscription</th>
                  <th>Access Control</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const subBadge = getSubBadge(l.subscriptionTier);
                  const isActing = acting[l._id];
                  
                  return (
                    <tr key={l._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold-dim)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, overflow: 'hidden' }}>
                            {buildFileUrl(l.profilePicture || l.avatar || l.photo) ? (
                              <img src={buildFileUrl(l.profilePicture || l.avatar || l.photo)} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                            ) : null}
                            <span style={{ display: buildFileUrl(l.profilePicture || l.avatar || l.photo) ? 'none' : 'block' }}>
                              {(l.name || "E")[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {l.name}
                              {l.isBlocked && <span className="badge" style={{ background: 'var(--red-dim)', color: 'var(--red)', fontSize: '0.65rem', padding: '2px 6px' }}>Blocked</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{l.email} · {l.barId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {l.tieredFields && l.tieredFields.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: '200px' }}>
                            {l.tieredFields.map((t, idx) => (
                              <span key={idx} className="tier-badge">
                                {t.field} ({t.tier})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                            {l.specialization || "General"}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Exp: <strong>{l.experience} Yrs</strong></div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#eab308', fontSize: '0.8rem', fontWeight: 600 }}>
                            <Star size={12} fill="#eab308" /> {l.rating || "4.5"}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: subBadge.bg, color: subBadge.col, textTransform: 'capitalize' }}>
                          {l.subscriptionTier || "Trial"}
                        </span>
                      </td>
                      <td>
                        <button 
                          className={l.isBlocked ? "btn-outline" : "btn-danger"}
                          disabled={isActing}
                          onClick={() => toggleBlock(l._id, l.isBlocked)}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', opacity: isActing ? 0.6 : 1 }}
                        >
                          {isActing ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : l.isBlocked ? (
                            <ShieldAlert size={14} />
                          ) : (
                            <XCircle size={14} />
                          )}
                          {confirmId === l._id ? "Confirm?" : (l.isBlocked ? "Unblock" : "Block")}
                        </button>
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
