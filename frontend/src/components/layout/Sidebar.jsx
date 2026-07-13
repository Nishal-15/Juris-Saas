import { useState, useEffect, memo, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { socket } from "../../socket";
import "./sidebar.css";

/* ── SVG Icon Components ── */
const Icons = {
  ai:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 8v4l3 3"/></svg>,
  cases:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  consult:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  docs:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>,
  notif:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevron:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  plus:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  user:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  scales:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
};

const ADMIN_NAV = [
  { icon: "scales",  label: "Super Dashboard", path: "/admin" },
];

const ADMIN_SYSTEM_NAV = [
  { icon: "settings", label: "Settings", path: "/settings" },
];

const CITIZEN_NAV = [
  { icon: "ai",       label: "Legal AI Chat",   path: "/user" },
  { icon: "cases",   label: "My Cases",        path: "/cases" },
  { icon: "consult", label: "Consult a Lawyer", path: "/lawyers" },
  { icon: "docs",    label: "Documents",       path: "/documents" },
];

const SYSTEM_NAV = [
  { icon: "notif",    label: "Notifications", path: "/notifications" },
  { icon: "settings", label: "Settings",      path: "/settings" },
];

const Sidebar = memo(() => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasNewMsg, setHasNewMsg] = useState(false);
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);

  useEffect(() => {
    socket.on("receive-message", () => {
      if (pathname !== "/messages") setHasNewMsg(true);
    });
    return () => socket.off("receive-message");
  }, [pathname]);

  const logout = () => { localStorage.clear(); navigate("/"); };

  const NavBtn = ({ iconKey, label, path, badge }) => {
    const isActive = pathname === path;
    return (
      <button
        className={`cs-nav-btn ${isActive ? "active" : ""}`}
        onClick={() => { 
          navigate(path); 
          if (badge) setHasNewMsg(false);
          setMobileOpen(false);
        }}
        title={collapsed ? label : ""}
      >
        <span className="cs-nav-icon">{Icons[iconKey]}</span>
        {!collapsed && <span className="cs-nav-label fade-in">{label}</span>}
        {badge && hasNewMsg && <span className="cs-notif-dot" />}
      </button>
    );
  };

  return (
    <div className={`cs-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      
      <div className="cs-logo" onClick={() => collapsed && setCollapsed(false)} style={{ cursor: collapsed ? "pointer" : "default" }}>
        <div className="cs-logo-icon" style={{ background: '#fff', padding: '2px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #c9a84c' }} />
        </div>
        {!collapsed && (
          <div className="fade-in" style={{ flex: 1 }}>
            <span className="cs-logo-name">JurisBot</span>
            <span className="cs-logo-tag">Legal Awareness AI</span>
          </div>
        )}
        
        {/* Desktop Toggle in Flow */}
        {!collapsed && (
          <button className="cs-toggle fade-in" onClick={(e) => { e.stopPropagation(); setCollapsed(true); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
        )}
      </div>

      {user.role !== "admin" && (
        <div className="cs-cta-wrap">
          <button className="cs-cta-btn" onClick={() => navigate("/create-case")}>
            {Icons.plus} {!collapsed && "New Consultation"}
          </button>
        </div>
      )}

      <nav className="cs-nav">
        <div className="cs-section-label">{collapsed ? "—" : "WORKSPACE"}</div>
        {(user.role === "admin" ? ADMIN_NAV : CITIZEN_NAV).map(({ icon, label, path }) => (
          <NavBtn key={path} iconKey={icon} label={label} path={path} />
        ))}
        <div className="cs-section-label" style={{ marginTop: "12px" }}>{collapsed ? "—" : "SYSTEM"}</div>
        {(user.role === "admin" ? ADMIN_SYSTEM_NAV : SYSTEM_NAV).map(({ icon, label, path }) => (
          <NavBtn key={path} iconKey={icon} label={label} path={path} />
        ))}
      </nav>

      <div className="cs-footer">
        <div className="cs-user-row" onClick={() => navigate("/settings")}>
          <div className="cs-user-avatar">{Icons.user}</div>
          {!collapsed && (
            <div className="fade-in">
              <span className="cs-user-name">{user?.name || "User"}</span>
              <span className="cs-user-role">{user?.role === "admin" ? "Administrator" : "Verified Citizen"}</span>
            </div>
          )}
        </div>
        <button className="cs-logout-btn" onClick={logout}>
          {Icons.logout} {!collapsed && <span className="fade-in">Sign Out</span>}
        </button>
      </div>
    </div>
  );
});

export default Sidebar;