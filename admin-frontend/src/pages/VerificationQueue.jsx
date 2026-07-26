import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useToast } from '../components/Toast';
import { UserCheck, ShieldAlert, CheckCircle, XCircle, FileText, User, Mail, Search, RefreshCw } from 'lucide-react';

const COLORS = ["#c9a84c","#3b82f6","#10b981","#8b5cf6","#ef4444","#f59e0b"];

export default function VerificationQueue() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  
  const toast = useToast();

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await API.get('/admin/pending-lawyers');
      setPending(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Pending Error:", err);
      toast.error("Failed to load queue");
      setLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    if (confirmId !== `${id}-${status}`) {
      setConfirmId(`${id}-${status}`);
      return;
    }
    
    setActing(prev => ({ ...prev, [id]: true }));
    setConfirmId(null);
    
    try {
      await API.patch(`/admin/verify-lawyer/${id}`, { status });
      toast.success(`Lawyer ${status === 'verified' ? 'approved' : 'rejected'}`);
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Verification failed");
    } finally {
      setActing(prev => ({ ...prev, [id]: false }));
    }
  };

  const filtered = pending.filter(l => {
    const s = search.toLowerCase();
    return !search || 
      (l.name || "").toLowerCase().includes(s) ||
      (l.email || "").toLowerCase().includes(s) ||
      (l.specialization || "").toLowerCase().includes(s);
  });

  return (
    <div>
      <style>{`
        .search-wrap { position: relative; max-width: 400px; margin-bottom: 24px; }
        .search-wrap input { width: 100%; padding: 12px 16px 12px 42px; border: 1px solid var(--border-dark); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-primary); outline: none; transition: var(--transition); }
        .search-wrap input:focus { border-color: var(--gold); }
        .search-wrap svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        
        .lawyer-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .lawyer-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }
        .lawyer-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 20px 0;
          padding: 16px;
          background: var(--bg-base);
          border-radius: 8px;
        }
        .detail-item { display: flex; flex-direction: column; gap: 4px; }
        .detail-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
        .detail-val { font-size: 0.85rem; color: var(--text-primary); font-weight: 500; }
      `}</style>
      
      <header className="page-header" style={{ marginBottom: '20px' }}>
        <h2>Identity & Credentials Verification</h2>
      </header>

      <div className="search-wrap">
        <Search size={18} />
        <input 
          type="text" 
          placeholder="Search by name, email, or specialization..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" style={{ marginBottom: '16px', color: 'var(--gold)' }} />
          <p>Loading queue...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
          <p>{search ? "No matching lawyers found." : "No verification requests pending."}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filtered.map(l => {
            const charCode = (l.name || "A").charCodeAt(0);
            const color = COLORS[charCode % COLORS.length];
            const isActing = acting[l._id];
            
            return (
              <div key={l._id} className="lawyer-card" style={{ borderTop: `3px solid ${color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, flexShrink: 0 }}>
                      {(l.name || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{l.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <Mail size={12} /> {l.email}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>Pending</span>
                </div>

                <div className="lawyer-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Specialization</span>
                    <span className="detail-val">{l.specialization || "Not specified"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Experience</span>
                    <span className="detail-val">{l.experience || "Not specified"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location</span>
                    <span className="detail-val">{l.city ? `${l.city}, ${l.state}` : (l.location || "Not specified")}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Applied On</span>
                    <span className="detail-val">{new Date(l.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {l.certificateUrl && (
                  <div style={{ marginBottom: '20px' }}>
                    <a href={l.certificateUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-dark)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      <FileText size={14} /> View Certificate
                    </a>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn-success" 
                    disabled={isActing}
                    onClick={() => handleVerify(l._id, 'verified')}
                    style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center', gap: '8px', cursor: isActing ? 'not-allowed' : 'pointer', opacity: isActing ? 0.6 : 1 }}
                  >
                    {isActing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    {confirmId === `${l._id}-verified` ? "Confirm" : "Approve"}
                  </button>
                  <button 
                    className="btn-danger" 
                    disabled={isActing}
                    onClick={() => handleVerify(l._id, 'rejected')}
                    style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center', gap: '8px', cursor: isActing ? 'not-allowed' : 'pointer', opacity: isActing ? 0.6 : 1 }}
                  >
                    {isActing ? <RefreshCw size={16} className="animate-spin" /> : <XCircle size={16} />}
                    {confirmId === `${l._id}-rejected` ? "Confirm" : "Reject"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
