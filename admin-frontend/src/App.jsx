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
        <img src="http://localhost:5000/branding/logo.png" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '20px' }} />
        <h1 style={{ fontFamily: 'Playfair Display', marginBottom: '10px' }}>Institutional Access</h1>
        <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '0.9rem' }}>JurisBot National Legal Infrastructure</p>
        <input 
          type="password" 
          placeholder="Access Key" 
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }} 
        />
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
