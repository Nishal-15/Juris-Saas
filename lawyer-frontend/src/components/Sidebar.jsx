import { useState } from "react";
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
  const [collapsed, setCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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
    </div>
  );
}
