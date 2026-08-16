import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useToast } from '../components/Toast';
import { UserCheck, ShieldAlert, CheckCircle, XCircle, FileText, Mail, Search, RefreshCw, X, CreditCard } from 'lucide-react';

const COLORS = ["#c9a84c","#3b82f6","#10b981","#8b5cf6","#ef4444","#f59e0b"];
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/** Convert a local disk path like backend\uploads\... → http://localhost:5000/uploads/... */
function buildFileUrl(rawPath) {
  if (!rawPath) return null;
  // If it already starts with http, return as-is
  if (rawPath.startsWith("http")) return rawPath;
  // Normalize backslashes → forward slashes
  const normalized = rawPath.replace(/\\/g, "/");
  // Extract path from 'uploads/' onward
  const idx = normalized.indexOf("uploads/");
  if (idx === -1) return null;
  return `${API_BASE}/${normalized.slice(idx)}`;
}

export default function VerificationQueue() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { url, type: 'image'|'pdf' }

  const toast = useToast();

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/pending-lawyers');
      setPending(res.data);
    } catch (err) {
      console.error("Fetch Pending Error:", err);
      toast.error("Failed to load queue");
    } finally {
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
      toast.success(`Lawyer ${status === 'verified' ? 'approved ✅' : 'rejected ❌'}`);
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setActing(prev => ({ ...prev, [id]: false }));
    }
  };

  const openCertificate = (rawPath) => {
    const url = buildFileUrl(rawPath);
    if (!url) { toast.error("Certificate URL not available."); return; }
    const isPdf = rawPath.toLowerCase().endsWith(".pdf");
    setLightbox({ url, type: isPdf ? "pdf" : "image" });
  };

  const filtered = pending.filter(l => {
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

        .bar-id-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.4);
          color: #c9a84c; padding: 4px 10px; border-radius: 20px;
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.4px;
          margin-top: 4px;
        }

        /* Lightbox */
        .lightbox-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 9999;
          display: flex; align-items: center; justify-content: center;
        }
        .lightbox-inner {
          position: relative; max-width: 90vw; max-height: 90vh;
          background: #111; border-radius: 16px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 40px 80px rgba(0,0,0,0.8);
        }
        .lightbox-close {
          position: absolute; top: 12px; right: 12px; z-index: 10;
          background: rgba(0,0,0,0.7); border: none; color: white;
          width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; transition: background 0.2s;
        }
        .lightbox-close:hover { background: rgba(239,68,68,0.8); }

        .cert-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 14px;
          background: linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.08));
          border: 1px solid rgba(201,168,76,0.4);
          border-radius: 8px; font-size: 0.82rem;
          color: #c9a84c; font-weight: 700; cursor: pointer;
          transition: all 0.2s; margin-bottom: 18px;
        }
        .cert-btn:hover { background: rgba(201,168,76,0.25); transform: translateY(-1px); }
        
        .avatar-ring {
          width: 56px; height: 56px; border-radius: 50%;
          border: 2px solid; overflow: hidden; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem; font-weight: 700;
        }

        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .lightbox-inner { animation: fadeIn 0.2s ease-out; }
      `}</style>

      <header className="page-header" style={{ marginBottom: '20px' }}>
        <h2>Identity &amp; Credentials Verification</h2>
      </header>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div className="search-wrap" style={{ marginBottom: 0, flex: 1, maxWidth: '440px' }}>
          <span className="search-icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, Bar ID, or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={fetchPending}
          style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 16px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px', cursor:'pointer', color:'var(--text-primary)', fontSize:'0.85rem', fontWeight:600 }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <RefreshCw size={36} className="animate-spin" style={{ marginBottom: '16px', color: 'var(--gold)' }} />
          <p style={{ fontWeight: 600 }}>Loading verification queue...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-container">
          <div className="empty-state-icon">
            <UserCheck size={32} />
          </div>
          <p style={{ fontWeight: 600 }}>{search ? "No matching lawyers found." : "No pending verification requests."}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filtered.map(l => {
            const charCode = (l.name || "A").charCodeAt(0);
            const color = COLORS[charCode % COLORS.length];
            const isActing = acting[l._id];
            const avatarUrl = buildFileUrl(l.avatar || l.photo);
            const certUrl = l.certificateUrl;

            return (
              <div key={l._id} className="lawyer-card" style={{ borderTop: `3px solid ${color}` }}>

                {/* Header: Avatar + Name + Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div className="avatar-ring" style={{ borderColor: color, background: `${color}18`, color }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (l.name || "U")[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 3px 0', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{l.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <Mail size={11} /> {l.email}
                      </div>
                      {l.barId && (
                        <div className="bar-id-badge">
                          <CreditCard size={12} /> {l.barId}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="badge badge-pending" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>PENDING</span>
                </div>

                {/* Details Grid */}
                <div className="lawyer-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Specialization</span>
                    <span className="detail-val">{l.specialization || "Not specified"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Experience</span>
                    <span className="detail-val">{l.experience ? `${l.experience} yrs` : "Not specified"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-val">{l.phone || "Not provided"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Applied On</span>
                    <span className="detail-val">{new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* View Certificate */}
                {certUrl ? (
                  <div>
                    <button className="cert-btn" onClick={() => openCertificate(certUrl)}>
                      <FileText size={14} /> View Enrollment Certificate
                    </button>
                  </div>
                ) : (
                  <div style={{ marginBottom: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    ⚠ No certificate uploaded
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn-success"
                    disabled={isActing}
                    onClick={() => handleVerify(l._id, 'verified')}
                    style={{ flex: 1, padding: '10px 8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '7px', cursor: isActing ? 'not-allowed' : 'pointer', opacity: isActing ? 0.6 : 1, fontWeight: 700 }}
                  >
                    {isActing ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                    {confirmId === `${l._id}-verified` ? "Confirm Approve" : "Approve"}
                  </button>
                  <button
                    className="btn-danger"
                    disabled={isActing}
                    onClick={() => handleVerify(l._id, 'rejected')}
                    style={{ flex: 1, padding: '10px 8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '7px', cursor: isActing ? 'not-allowed' : 'pointer', opacity: isActing ? 0.6 : 1, fontWeight: 700 }}
                  >
                    {isActing ? <RefreshCw size={15} className="animate-spin" /> : <XCircle size={15} />}
                    {confirmId === `${l._id}-rejected` ? "Confirm Reject" : "Reject"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Certificate Lightbox Modal */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>
              <X size={16} />
            </button>
            {lightbox.type === "pdf" ? (
              <iframe
                src={lightbox.url}
                style={{ width: '80vw', height: '85vh', border: 'none', display: 'block' }}
                title="Enrollment Certificate"
              />
            ) : (
              <img
                src={lightbox.url}
                alt="Enrollment Certificate"
                style={{ maxWidth: '85vw', maxHeight: '85vh', display: 'block', objectFit: 'contain' }}
                onError={e => { e.target.src = 'https://via.placeholder.com/600x400?text=Certificate+Not+Found'; }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
