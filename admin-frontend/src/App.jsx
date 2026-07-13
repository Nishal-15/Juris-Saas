import React, { useState } from 'react';
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

// Placeholder for Login
const Login = ({ setAuth }) => {
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    // ✅ WHITESPACE REMOVAL: Trim input for safety
    const cleanPass = pass.trim();

    if (cleanPass === "admin@juris") { 
      // For testing, we use a master token. In production, we use a real /login route.
      localStorage.setItem("token", "admin_master_token");
      localStorage.setItem("role", "admin");
      setAuth(true);
    } else {
      alert("Invalid Institutional Credentials");
    }
  };

  return (
    <div style={{ background: '#0f111a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '24px', width: '400px', textAlign: 'center' }}>
        <img src="/juris-logo.png" alt="JurisBot Shield" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '20px' }} />
        <h1 style={{ fontFamily: 'Playfair Display', marginBottom: '10px' }}>Institutional Access</h1>
        <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '0.9rem' }}>JurisBot National Legal Infrastructure</p>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <input 
            type={showPass ? "text" : "password"} 
            placeholder="Access Key" 
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '12px', paddingRight: '40px', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
          />
          <button 
            onClick={() => setShowPass(!showPass)}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 0 }}
          >
            {showPass ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            )}
          </button>
        </div>
        <button onClick={handleLogin} className="btn-primary" style={{ width: '100%' }}>Enter Console</button>
      </div>
    </div>
  );
};

export default function App() {
  const [auth, setAuth] = useState(localStorage.getItem("token") === "admin_master_token");

  if (!auth) return <Login setAuth={setAuth} />;

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/verification" element={<VerificationQueue />} />
          <Route path="/lawyers" element={<LegalExperts />} />
          <Route path="/citizens" element={<Citizens />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/broadcast" element={<Broadcast />} />
          <Route path="/knowledge" element={<KnowledgeHub />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}
