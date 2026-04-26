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

      {/* Toggle Button */}
      <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} title="Toggle Sidebar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          {collapsed ? (
            <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>
          ) : (
            <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>
          )}
        </svg>
      </button>

      {/* Logo */}
      <div className="sidebar-logo">
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
          <div className="logo-text fade-in">
            <span className="logo-name">JurisBot</span>
            <span className="logo-sub">Legal Workspace</span>
          </div>
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
