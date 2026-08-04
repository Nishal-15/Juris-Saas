import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./sidebar.css";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/lawyer/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: "Case Files",
    path: "/lawyer/cases",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    label: "Mediation Hub",
    path: "/lawyer/mediation",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: "AI Analyzer",
    path: "/lawyer/document-analyzer",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        <circle cx="15" cy="18" r="4" stroke="currentColor" fill="none"/>
      </svg>
    ),
  },
  {
    label: "AI Drafter",
    path: "/lawyer/drafter",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
  },
  {
    label: "Client Messages",
    path: "/lawyer/messages",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    label: "Notifications",
    path: "/lawyer/notifications",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
    ),
  },
  {
    label: "Membership",
    path: "/lawyer/subscription",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [collapsed, setCollapsed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const pwaHandler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", pwaHandler);
    return () => window.removeEventListener("beforeinstallprompt", pwaHandler);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      {/* Logo Area & Toggle */}
      <div 
        className="sidebar-logo" 
        onClick={() => collapsed && setCollapsed(false)} 
        style={{ cursor: collapsed ? "pointer" : "default" }}
      >
        <div className="logo-icon-wrap" style={{ background: '#fff', padding: '2px' }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '50%', 
              objectFit: 'cover',
              border: '2px solid #c9a84c',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }} 
          />
        </div>
        {!collapsed && (
          <div className="logo-text fade-in" style={{ flex: 1 }}>
            <span className="logo-name">JurisBot</span>
            <span className="logo-sub">Legal Workspace</span>
          </div>
        )}

        {/* Toggle Button in Flow */}
        {!collapsed && (
          <button className="sidebar-toggle fade-in" onClick={(e) => { e.stopPropagation(); setCollapsed(true); }} title="Collapse Sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
        )}
      </div>

      {/* Theme Toggle Switch */}
      <div style={{ padding: '0 20px', marginTop: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Theme</span>}
        <div 
          onClick={toggleTheme}
          style={{ 
            width: '40px', height: '22px', borderRadius: '20px', 
            background: theme === 'dark' ? 'var(--bg-3)' : 'var(--gold)', 
            position: 'relative', cursor: 'pointer', transition: 'background 0.3s',
            flexShrink: 0
          }}
          title="Toggle Theme"
        >
          <div style={{
            width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
            position: 'absolute', top: '3px', left: theme === 'dark' ? '4px' : '20px',
            transition: 'left 0.3s'
          }} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">{collapsed ? "—" : "Workspace"}</div>

        {NAV_ITEMS.map(({ label, path, icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            title={collapsed ? label : ""}
          >
            <span className="link-icon">{icon}</span>
            {!collapsed && <span className="link-label fade-in">{label}</span>}
          </NavLink>
        ))}

        <div className="sidebar-section-title" style={{ marginTop: "12px" }}>{collapsed ? "—" : "Account"}</div>
        <button
          className="sidebar-link"
          onClick={() => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
            } else {
              setShowPwaModal(true);
            }
          }}
          style={{ background: "rgba(201, 168, 76, 0.15)", border: "1px solid rgba(201, 168, 76, 0.4)", marginTop: "6px", width: "100%", cursor: "pointer", textAlign: "left" }}
          title={collapsed ? "Install Lawyer App" : ""}
        >
          <span className="link-icon" style={{ fontSize: "1.2rem" }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </span>
          {!collapsed && <span className="link-label fade-in" style={{ color: "#c9a84c", fontWeight: 700 }}>Install App</span>}
        </button>
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">

        <div className="sidebar-user-info">
          <div className="user-avatar-ring">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="user-info-text fade-in">
              <span className="user-name">{user?.name || "Legal Expert"}</span>
              <span className="user-role">Verified Practitioner</span>
            </div>
          )}
        </div>

        <button onClick={logout} className="logout-btn" title={collapsed ? "Sign Out" : ""}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span className="fade-in">Sign Out</span>}
        </button>
      </div>

      {showPwaModal && (
        <div 
          onClick={() => setShowPwaModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#131722", border: "1px solid #c9a84c", borderRadius: "18px", padding: "24px", maxWidth: "420px", width: "100%", color: "#fff", textAlign: "left", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, color: "#c9a84c", fontSize: "1.2rem", fontFamily: "'Playfair Display', serif" }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "8px", verticalAlign: "middle"}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Install JurisBot Lawyer
              </h3>
              <button onClick={() => setShowPwaModal(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.5, color: "#ccc", marginBottom: "16px" }}>
              Install JurisBot Lawyer Dashboard directly to your mobile home screen or desktop for fast, offline practice management:
            </p>
            <div style={{ background: "rgba(255,255,255,0.04)", padding: "12px", borderRadius: "10px", marginBottom: "12px", fontSize: "0.88rem", border: "1px solid rgba(255,255,255,0.08)" }}>
              <strong style={{ color: "#fff" }}>🤖 Android / Chrome:</strong>
              <div style={{ color: "#aaa", marginTop: "4px" }}>Tap browser menu (⋮) → <span style={{ color: "#c9a84c" }}>Install app</span> or <span style={{ color: "#c9a84c" }}>Add to Home screen</span>.</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", padding: "12px", borderRadius: "10px", marginBottom: "20px", fontSize: "0.88rem", border: "1px solid rgba(255,255,255,0.08)" }}>
              <strong style={{ color: "#fff" }}>🍎 iOS / Safari:</strong>
              <div style={{ color: "#aaa", marginTop: "4px" }}>Tap Share button (⎋) → Scroll down and tap <span style={{ color: "#c9a84c" }}>Add to Home Screen ➕</span>.</div>
            </div>
            <button 
              onClick={() => setShowPwaModal(false)} 
              style={{ width: "100%", background: "linear-gradient(135deg, #c9a84c 0%, #a6852e 100%)", border: "none", color: "#000", fontWeight: 800, padding: "12px", borderRadius: "10px", cursor: "pointer" }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
