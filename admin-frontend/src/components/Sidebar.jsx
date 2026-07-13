import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, Scale, Database, Settings, LogOut, FileText, Megaphone } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard /> },
    { name: 'Verification Queue', path: '/verification', icon: <UserCheck /> },
    { name: 'Legal Experts', path: '/lawyers', icon: <Scale /> },
    { name: 'Global Matters', path: '/cases', icon: <FileText /> },
    { name: 'Signal Tower', path: '/broadcast', icon: <Megaphone /> },
    { name: 'Citizens', path: '/citizens', icon: <Users /> },
    { name: 'Knowledge Hub', path: '/knowledge', icon: <Database /> },
    { name: 'Settings', path: '/settings', icon: <Settings /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="sidebar">
      <NavLink to="/dashboard" className="sidebar-logo" style={{ textDecoration: 'none', display: 'flex' }}>
        <img src="/juris-logo.png" alt="JurisBot" />
        <div className="logo-text">
          <h1>JURISBOT</h1>
          <p>Institutional Suite</p>
        </div>
      </NavLink>

      <nav className="nav-menu">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <button onClick={handleLogout} className="nav-item" style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginTop: 'auto', width: '100%' }}>
        <LogOut />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
