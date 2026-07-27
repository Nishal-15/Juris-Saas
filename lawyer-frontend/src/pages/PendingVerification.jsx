import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function PendingVerification() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [status, setStatus] = useState(user.verificationStatus || "pending");
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [dots, setDots] = useState(".");

  // Animated dots for pending state
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 600);
    return () => clearInterval(t);
  }, []);

  const audioSuccess = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3");

  const checkStatus = async (silent = false) => {
    if (!user._id && !user.id) return;
    if (!silent) setIsChecking(true);
    try {
      const res = await axios.get(`/auth/user/${user._id || user.id}`);
      if (res.data) {
        const newStatus = res.data.verificationStatus || "pending";
        setStatus(newStatus);
        const updatedUser = { ...user, ...res.data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        if (newStatus === "verified" || res.data.isVerified) {
          audioSuccess.play().catch(() => {});
          setMessage("✅ Verification Approved! Redirecting to your workspace...");
          setTimeout(() => navigate("/lawyer/dashboard"), 1800);
        } else if (!silent) {
          setMessage("⏳ Still pending — an admin will review your credentials shortly.");
          setTimeout(() => setMessage(""), 5000);
        }
      }
    } catch (err) {
      console.error("Status check error:", err);
    } finally {
      if (!silent) setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!user._id && !user.id) { navigate("/"); return; }
    checkStatus(true);
    const interval = setInterval(() => checkStatus(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const isVerified = status === "verified";
  const isRejected = status === "rejected";

  return (
    <div style={{
      position: 'relative', minHeight: '100vh', background: '#090b12',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: "'Inter', sans-serif", overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');

        @keyframes rotateRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseGold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.4); }
          50% { box-shadow: 0 0 0 14px rgba(201,168,76,0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-18px) scale(1.04); }
        }

        .pending-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 520px;
          background: linear-gradient(160deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 28px;
          padding: 44px 36px 36px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07);
          backdrop-filter: blur(28px);
          animation: fadeUp 0.5s ease-out;
        }

        .logo-ring {
          position: relative;
          width: 96px; height: 96px;
          margin: 0 auto 24px;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-ring-spinner {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 2.5px solid transparent;
          border-top-color: #c9a84c;
          border-right-color: rgba(201,168,76,0.3);
          animation: rotateRing 1.8s linear infinite;
        }
        .logo-ring-inner {
          width: 76px; height: 76px;
          border-radius: 50%;
          border: 1px solid rgba(201,168,76,0.2);
          background: rgba(201,168,76,0.06);
          display: flex; align-items: center; justify-content: center;
          animation: pulseGold 2.5s ease-in-out infinite;
        }
        .logo-img {
          width: 52px; height: 52px;
          border-radius: 14px;
          object-fit: cover;
        }

        .status-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 18px; border-radius: 50px;
          font-size: 0.72rem; font-weight: 800; letter-spacing: 1px;
          text-transform: uppercase; margin-bottom: 18px;
        }
        .pill-pending {
          background: rgba(201,168,76,0.12);
          border: 1.5px solid rgba(201,168,76,0.4);
          color: #fcd34d;
        }
        .pill-verified {
          background: rgba(16,185,129,0.15);
          border: 1.5px solid rgba(16,185,129,0.5);
          color: #34d399;
        }
        .pill-rejected {
          background: rgba(239,68,68,0.12);
          border: 1.5px solid rgba(239,68,68,0.4);
          color: #f87171;
        }

        .step-track {
          display: flex; align-items: center; justify-content: center;
          gap: 0; margin: 24px 0;
        }
        .step-node {
          display: flex; flex-direction: column; align-items: center; gap: 6px; z-index: 1;
        }
        .step-dot {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 800;
        }
        .step-dot.done { background: #c9a84c; color: #0f111a; }
        .step-dot.active {
          background: rgba(201,168,76,0.15);
          border: 2px solid #c9a84c; color: #c9a84c;
          animation: pulseGold 2s ease-in-out infinite;
        }
        .step-dot.waiting {
          background: rgba(255,255,255,0.05);
          border: 2px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.3);
        }
        .step-label { font-size: 0.6rem; font-weight: 600; letter-spacing: 0.5px; text-align: center; max-width: 60px; }
        .step-line {
          flex: 1; height: 2px; max-width: 48px;
          background: linear-gradient(90deg, #c9a84c, rgba(255,255,255,0.1));
        }
        .step-line.inactive { background: rgba(255,255,255,0.1); }

        .info-box {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 16px 18px;
          display: flex; flex-direction: column; gap: 10px;
          margin: 20px 0;
        }
        .info-row {
          display: flex; justify-content: space-between; align-items: center;
          gap: 12px; font-size: 0.83rem;
        }
        .info-key { color: rgba(255,255,255,0.5); font-weight: 500; white-space: nowrap; }
        .info-val { color: white; font-weight: 700; text-align: right; word-break: break-word; }
        .info-val.gold { color: #c9a84c; }

        .btn-primary {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #c9a84c 0%, #e6c46a 50%, #c9a84c 100%);
          background-size: 200% auto;
          color: #0f111a; border: none; border-radius: 13px;
          font-size: 0.9rem; font-weight: 800; letter-spacing: 0.8px;
          cursor: pointer; transition: all 0.3s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          margin-top: 20px;
          animation: shimmer 3s linear infinite;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(201,168,76,0.45);
        }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; animation: none; }
        
        .btn-secondary {
          width: 100%; padding: 13px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.6);
          border-radius: 13px; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s; margin-top: 10px;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.05); color: white; }

        .msg-box {
          border-radius: 10px; padding: 12px 16px;
          font-size: 0.82rem; font-weight: 600; margin-top: 16px;
          text-align: center;
        }
        .msg-success { background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
        .msg-info    { background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.3); color: #fcd34d; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

      {/* Background orbs */}
      <div style={{ position:'absolute', top:'-15%', left:'-10%', width:'500px', height:'500px', background:'radial-gradient(circle, #c9a84c 0%, transparent 70%)', opacity:0.12, filter:'blur(60px)', borderRadius:'50%', animation:'orbFloat 8s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'450px', height:'450px', background:'radial-gradient(circle, #3b82f6 0%, transparent 70%)', opacity:0.12, filter:'blur(60px)', borderRadius:'50%', animation:'orbFloat 10s ease-in-out infinite reverse' }} />
      <div style={{ position:'absolute', top:'40%', left:'60%', width:'300px', height:'300px', background:'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', opacity:0.08, filter:'blur(60px)', borderRadius:'50%' }} />

      {/* Grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize:'48px 48px', pointerEvents:'none' }} />

      <div className="pending-card">
        {/* Logo Ring */}
        <div style={{ textAlign:'center' }}>
          <div className="logo-ring">
            {!isVerified && !isRejected && <div className="logo-ring-spinner" />}
            <div className="logo-ring-inner">
              <img
                src="/logo.png"
                alt="JurisBot"
                className="logo-img"
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
              <div style={{ display:'none', width:'52px', height:'52px', alignItems:'center', justifyContent:'center', fontSize:'1.8rem' }}>🏛️</div>
            </div>
          </div>

          {/* Status Pill */}
          <div style={{ display:'flex', justifyContent:'center' }}>
            {isVerified ? (
              <div className="status-pill pill-verified">⚡ Credentials Verified</div>
            ) : isRejected ? (
              <div className="status-pill pill-rejected">⚠ Verification Failed</div>
            ) : (
              <div className="status-pill pill-pending">⏳ Awaiting Admin Approval{dots}</div>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontFamily:'Playfair Display', color:'white', fontSize:'1.9rem', margin:'0 0 10px 0', lineHeight:1.2 }}>
            Welcome, {user.name?.split(' ')[0] || 'Advocate'}
          </h1>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.88rem', lineHeight:1.65, margin:'0 0 4px 0', padding:'0 8px' }}>
            {isVerified
              ? "Your Bar Council credentials have been authenticated. Redirecting to your workspace…"
              : isRejected
              ? "We couldn't verify your enrollment certificate. Please contact institutional support."
              : <>Your application with Bar Council ID <strong style={{ color:'#c9a84c' }}>{user.barId || 'Submitted'}</strong> has been scanned by our AI verifier and is now <strong style={{ color:'#fcd34d' }}>awaiting final Admin approval</strong>. Full access is granted once verified.</>
            }
          </p>
        </div>

        {/* Step Progress Tracker */}
        {!isRejected && (
          <div className="step-track">
            <div className="step-node">
              <div className="step-dot done">✓</div>
              <span className="step-label" style={{ color:'#c9a84c' }}>Submitted</span>
            </div>
            <div className={`step-line ${status === 'pending' ? '' : 'inactive'}`} />
            <div className="step-node">
              <div className="step-dot done">✓</div>
              <span className="step-label" style={{ color:'#c9a84c' }}>AI Scan</span>
            </div>
            <div className="step-line inactive" />
            <div className="step-node">
              <div className={`step-dot ${isVerified ? 'done' : 'active'}`}>
                {isVerified ? '✓' : '⏳'}
              </div>
              <span className="step-label" style={{ color: isVerified ? '#c9a84c' : 'rgba(255,255,255,0.5)' }}>Admin Review</span>
            </div>
            <div className="step-line inactive" />
            <div className="step-node">
              <div className={`step-dot ${isVerified ? 'done' : 'waiting'}`}>
                {isVerified ? '✓' : '🔓'}
              </div>
              <span className="step-label" style={{ color: isVerified ? '#c9a84c' : 'rgba(255,255,255,0.3)' }}>Access</span>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="info-box">
          <div className="info-row">
            <span className="info-key">Applicant Email</span>
            <span className="info-val">{user.email || '—'}</span>
          </div>
          {user.barId && (
            <div className="info-row">
              <span className="info-key">Bar Council ID</span>
              <span className="info-val gold">{user.barId}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-key">Specialization</span>
            <span className="info-val">{user.specialization || 'Legal Practitioner'}</span>
          </div>
          <div className="info-row">
            <span className="info-key">Verification Act</span>
            <span className="info-val gold">Section 24, Advocates Act 1961</span>
          </div>
        </div>

        {/* Feedback Message */}
        {message && (
          <div className={`msg-box ${message.includes('✅') ? 'msg-success' : 'msg-info'}`}>
            {message}
          </div>
        )}

        {/* Actions */}
        {!isVerified && (
          <button className="btn-primary" onClick={() => checkStatus(false)} disabled={isChecking}>
            {isChecking
              ? <><span className="spin">⟳</span> Checking Status…</>
              : <><span>🔄</span> Check Verification Status</>
            }
          </button>
        )}
        <button className="btn-secondary" onClick={handleSignOut}>
          ← Sign Out &amp; Return to Login
        </button>
      </div>
    </div>
  );
}
