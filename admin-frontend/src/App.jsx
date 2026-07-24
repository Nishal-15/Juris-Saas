import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import VerificationQueue from './pages/VerificationQueue';
import LegalExperts from './pages/LegalExperts';
import Citizens from './pages/Citizens';
import KnowledgeHub from './pages/KnowledgeHub';
import Broadcast from './pages/Broadcast';
import Cases from './pages/Cases';
import Settings from './pages/Settings';
import ErrorBoundary from './components/ErrorBoundary';

// Placeholder for Login
const Login = ({ setAuth }) => {
  const [email, setEmail] = useState("nishalramar@gmail.com");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = Login, 2 = OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    const cleanPass = pass.trim();
    const cleanEmail = email.trim();
    if (!cleanPass || !cleanEmail) return setError("Enter credentials");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass, role: "admin" })
      });
      const data = await res.json();
      
      if (res.ok && data.requireOtp) {
        setStep(2);
      } else if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "admin");
        setAuth(true);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Server error");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (!otp.trim()) return setError("Enter OTP");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() })
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "admin");
        setAuth(true);
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Server error");
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      position: 'relative',
      background: 'var(--bg-dark)', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <style>{`
        .login-input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.12);
          color: white;
          border-radius: 10px;
          padding: 13px 16px;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
          transition: var(--transition);
        }
        .login-input:focus {
          border-color: rgba(201,168,76,0.6);
          outline: none;
        }
        .login-input::placeholder {
          color: rgba(255,255,255,0.3);
        }
        .otp-input {
          text-align: center;
          font-size: 1.6rem;
          letter-spacing: 12px;
          border: 1.5px solid var(--green);
        }
        .otp-input:focus {
          border-color: var(--green);
          box-shadow: 0 0 15px rgba(16,185,129,0.2);
        }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '600px', height: '600px', background: 'var(--gold)', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '500px', height: '500px', background: 'var(--blue)', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', top: '30%', right: '-10%', width: '400px', height: '400px', background: 'var(--purple)', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>

      {/* Grid overlay */}
      <div style={{ 
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      {/* Card */}
      <div style={{ 
        position: 'relative', zIndex: 10,
        width: '420px', 
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '24px',
        padding: '44px 40px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        
        <img src="/juris-logo.png" alt="JurisBot" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '18px', border: '1px solid var(--gold)', marginBottom: '24px' }} />
        
        <h1 style={{ fontFamily: 'Playfair Display', color: 'white', margin: '0 0 6px 0', fontSize: '1.8rem' }}>Institutional Access</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 24px 0', fontSize: '0.9rem' }}>JurisBot National Legal Infrastructure</p>
        
        {/* Step Indicators */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '36px' }}>
          <div style={{ width: step === 1 ? '32px' : '16px', height: '3px', background: step === 1 ? 'var(--gold)' : 'rgba(255,255,255,0.15)', borderRadius: '4px', transition: 'var(--transition)' }}></div>
          <div style={{ width: step === 2 ? '32px' : '16px', height: '3px', background: step === 2 ? 'var(--gold)' : 'rgba(255,255,255,0.15)', borderRadius: '4px', transition: 'var(--transition)' }}></div>
        </div>

        {error && (
          <div style={{ width: '100%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '10px', padding: '12px', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          <div style={{ width: '100%' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Institutional Email</label>
              <input 
                type="email" 
                className="login-input"
                placeholder="admin@jurisbot.gov" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div style={{ position: 'relative', marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Access Key</label>
              <input 
                type={showPass ? "text" : "password"} 
                className="login-input"
                placeholder="••••••••••••" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button 
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '14px', top: '38px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0 }}
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
            <button 
              onClick={handleLogin} 
              disabled={loading}
              style={{ 
                width: '100%', background: 'linear-gradient(135deg, var(--gold-light) 0%, var(--gold) 100%)', 
                color: '#0f0e09', border: 'none', borderRadius: '10px', padding: '14px', 
                fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.4 : 1, transition: 'var(--transition)'
              }}
            >
              {loading ? <><span className="spinner"></span>Verifying...</> : "Enter Console"}
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <p style={{ color: 'var(--green)', fontSize: '0.9rem', marginBottom: '24px', background: 'var(--green-dim)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
              Security Code sent to your email.
            </p>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600, textAlign: 'left' }}>6-Digit OTP</label>
              <input 
                type="text" 
                className="login-input otp-input"
                placeholder="000000" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyPress={(e) => e.key === 'Enter' && otp.length === 6 && handleVerifyOtp()}
                maxLength={6}
              />
            </div>
            <button 
              onClick={handleVerifyOtp} 
              disabled={loading || otp.length < 6}
              style={{ 
                width: '100%', background: 'linear-gradient(135deg, #34d399 0%, var(--green) 100%)', 
                color: '#0f0e09', border: 'none', borderRadius: '10px', padding: '14px', 
                fontWeight: 700, fontSize: '0.95rem', cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer',
                opacity: (loading || otp.length < 6) ? 0.4 : 1, transition: 'var(--transition)'
              }}
            >
              {loading ? <><span className="spinner"></span>Authenticating...</> : "Verify & Access"}
            </button>
            <button 
              onClick={() => { setStep(1); setOtp(""); setError(""); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '20px', cursor: 'pointer' }}
            >
              ← Back to login
            </button>
          </div>
        )}
        
        <div style={{ marginTop: '40px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>
          JURISBOT · SECURE ADMIN CONSOLE · v2.0
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [auth, setAuth] = useState(() => {
    const t = localStorage.getItem("token")
    return !!t && t !== "admin_master_token"
  });

  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!auth) return
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await window.fetch(
          `${import.meta.env.VITE_API_BASE || "http://localhost:5000/api"}/admin/pending-lawyers`,
          { headers:{ Authorization:`Bearer ${token}` } }
        )
        const data = await res.json()
        setPendingCount(Array.isArray(data) ? data.length : 0)
      } catch { setPendingCount(0) }
    }
    fetch()
    const iv = setInterval(fetch, 60000)
    return () => clearInterval(iv)
  }, [auth])

  if (!auth) return <Login setAuth={setAuth} />;

  return (
    <div className="admin-layout">
      <Sidebar pendingCount={pendingCount} />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="/verification" element={<ErrorBoundary><VerificationQueue /></ErrorBoundary>} />
          <Route path="/lawyers" element={<ErrorBoundary><LegalExperts /></ErrorBoundary>} />
          <Route path="/citizens" element={<ErrorBoundary><Citizens /></ErrorBoundary>} />
          <Route path="/cases" element={<ErrorBoundary><Cases /></ErrorBoundary>} />
          <Route path="/broadcast" element={<ErrorBoundary><Broadcast /></ErrorBoundary>} />
          <Route path="/knowledge" element={<ErrorBoundary><KnowledgeHub /></ErrorBoundary>} />
          <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}
