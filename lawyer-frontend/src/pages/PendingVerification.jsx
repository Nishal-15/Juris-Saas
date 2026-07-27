import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function PendingVerification() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [status, setStatus] = useState(user.verificationStatus || "pending");
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState("");

  const audioSuccess = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3");

  const checkStatus = async (silent = false) => {
    if (!user._id && !user.id) return;
    if (!silent) setIsChecking(true);
    try {
      const res = await axios.get(`/auth/user/${user._id || user.id}`);
      if (res.data) {
        const newStatus = res.data.verificationStatus || "pending";
        setStatus(newStatus);
        
        // Update localStorage
        const updatedUser = { ...user, ...res.data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        if (newStatus === "verified" || res.data.isVerified) {
          audioSuccess.play().catch(() => {});
          setMessage("✅ Verification Approved! Redirecting to Practitioner Console...");
          setTimeout(() => {
            navigate("/lawyer/dashboard");
          }, 1500);
        } else if (!silent) {
          setMessage("⏳ Credential verification still in progress. Checking institutional Bar Council database...");
          setTimeout(() => setMessage(""), 4000);
        }
      }
    } catch (err) {
      console.error("Status polling error:", err);
    } finally {
      if (!silent) setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!user._id && !user.id) {
      navigate("/");
      return;
    }
    
    // Initial check and auto-poll every 3 seconds
    checkStatus(true);
    const interval = setInterval(() => {
      checkStatus(true);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div style={{ position: 'relative', background: '#0f111a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 25px rgba(201, 168, 76, 0.4); }
          50% { box-shadow: 0 0 50px rgba(201, 168, 76, 0.8); }
        }
        @keyframes radarScan {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .status-badge-pending {
          background: rgba(201, 168, 76, 0.15); border: 1.5px solid #c9a84c; color: #fcd34d;
          padding: 8px 18px; border-radius: 50px; font-weight: 700; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 8px;
          animation: pulseGlow 3s infinite;
        }
        .status-badge-verified {
          background: rgba(16, 185, 129, 0.2); border: 1.5px solid #10b981; color: #34d399;
          padding: 8px 18px; border-radius: 50px; font-weight: 700; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 8px;
        }
        .status-badge-rejected {
          background: rgba(239, 68, 68, 0.2); border: 1.5px solid #ef4444; color: #f87171;
          padding: 8px 18px; border-radius: 50px; font-weight: 700; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 8px;
        }
        .radar-box {
          position: relative; width: 100px; height: 100px; border-radius: 50%; border: 2px dashed rgba(201,168,76,0.4); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;
        }
        .radar-spinner {
          position: absolute; inset: 0; border-radius: 50%; border-top: 3px solid #c9a84c; animation: radarScan 2s linear infinite;
        }
        .btn-check {
          background: linear-gradient(135deg, #c9a84c 0%, #a6852e 100%); color: #0f111a; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: all 0.3s; width: 100%; margin-top: 20px;
        }
        .btn-check:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(201,168,76,0.4); }
        .btn-signout {
          background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.3s; width: 100%; margin-top: 12px;
        }
        .btn-signout:hover { background: rgba(255,255,255,0.05); color: white; }
      `}</style>

      {/* Orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '600px', height: '600px', background: '#c9a84c', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '500px', height: '500px', background: '#3b82f6', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, width: '560px', maxWidth: '100%', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', padding: '44px 40px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', textAlign: 'center' }}>
        
        <div className="radar-box">
          {status === "pending" && <div className="radar-spinner" />}
          <span style={{ fontSize: '2.5rem' }}>
            {status === "verified" ? "✅" : status === "rejected" ? "❌" : "🏛️"}
          </span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          {status === "verified" ? (
            <div className="status-badge-verified">⚡ CREDENTIALS VERIFIED BY BAR COUNCIL AI</div>
          ) : status === "rejected" ? (
            <div className="status-badge-rejected">⚠️ VERIFICATION UNSUCCESSFUL</div>
          ) : (
            <div className="status-badge-pending">⏳ CREDENTIAL VERIFICATION IN PROGRESS</div>
          )}
        </div>

        <h1 style={{ fontFamily: 'Playfair Display', color: 'white', fontSize: '2rem', margin: '0 0 12px 0' }}>
          Welcome, {user.name || "Advocate"}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          {status === "verified" ? (
            "Your Bar Council enrollment certificate and practice credentials have been authenticated by the Institutional Admin. You are being redirected to your Practitioner Workspace..."
          ) : status === "rejected" ? (
            "We were unable to verify your enrollment certificate against State Bar Council records. Please ensure your document is legible or contact institutional support."
          ) : (
            <>
              Your application with Bar Council ID <strong style={{ color: '#c9a84c' }}>{user.barId || "Submitted"}</strong> has been scanned by our AI verifier and is currently <strong style={{ color: '#fcd34d' }}>awaiting final Institutional Admin approval</strong>. You will gain full access once an administrator verifies your credentials.
            </>
          )}
        </p>

        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px', textAlign: 'left', marginBottom: '24px', fontSize: '0.88rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
            <span>Applicant Email:</span>
            <strong style={{ color: 'white' }}>{user.email}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
            <span>Specialization:</span>
            <strong style={{ color: 'white' }}>{user.specialization || "Legal Practitioner"}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.8)' }}>
            <span>AI Verification Protocol:</span>
            <strong style={{ color: '#fcd34d' }}>Section 24 Advocates Act, 1961</strong>
          </div>
        </div>

        {message && (
          <div style={{ background: status === "verified" ? 'rgba(16,185,129,0.15)' : 'rgba(201,168,76,0.15)', border: `1px solid ${status === "verified" ? '#10b981' : '#c9a84c'}`, color: status === "verified" ? '#34d399' : '#fcd34d', padding: '12px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, marginBottom: '20px' }}>
            {message}
          </div>
        )}

        {status !== "verified" && (
          <button className="btn-check" onClick={() => checkStatus(false)} disabled={isChecking}>
            {isChecking ? "SCANNING DATABASE..." : "🔄 CHECK VERIFICATION STATUS"}
          </button>
        )}

        <button className="btn-signout" onClick={handleSignOut}>
          ← Sign Out & Return to Login
        </button>

      </div>
    </div>
  );
}
