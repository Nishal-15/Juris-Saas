import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, Scale, Database, Settings, LogOut, FileText, Megaphone, ChevronLeft } from 'lucide-react';

export default function Sidebar({ pendingCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) + " IST");
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? '72px' : '270px');
  }, [collapsed]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Verification Queue', path: '/verification', icon: <UserCheck size={20} /> },
    { name: 'Legal Experts', path: '/lawyers', icon: <Scale size={20} /> },
    { name: 'Global Matters', path: '/cases', icon: <FileText size={20} /> },
    { name: 'Mediation Cases', path: '/mediation', icon: <Scale size={20} /> },
    { name: 'Signal Tower', path: '/broadcast', icon: <Megaphone size={20} /> },
    { name: 'Citizens', path: '/citizens', icon: <Users size={20} /> },
    { name: 'Knowledge Hub', path: '/knowledge', icon: <Database size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="sidebar" style={{ transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), padding 0.28s', padding: collapsed ? '30px 10px' : '30px 20px', overflowX: 'hidden' }}>
      
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '50px', justifyContent: collapsed ? 'center' : 'flex-start', paddingLeft: collapsed ? '0' : '10px' }}>
        <NavLink to="/dashboard" style={{ textDecoration: 'none', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <img src="/juris-logo.png" alt="JurisBot" style={{ width: collapsed ? '36px' : '40px', height: collapsed ? '36px' : '40px', borderRadius: '50%', border: '2px solid var(--gold)', transition: 'var(--transition)' }} />
          {!collapsed && (
            <div className="logo-text">
              <h1 style={{ fontSize: '1.2rem', color: 'white', letterSpacing: '1px', margin: 0, fontFamily: 'Playfair Display' }}>JURISBOT</h1>
              <p style={{ fontSize: '0.6rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>Institutional Suite</p>
            </div>
          )}
        </NavLink>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          style={{ position: 'absolute', right: collapsed ? '50%' : '0', top: '50%', transform: collapsed ? 'translate(50%, -50%) rotate(180deg)' : 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10, transition: 'var(--transition)', display: 'flex' }}
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <nav className="nav-menu" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <style>{`
          .sidebar-nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--text-muted);
            text-decoration: none;
            border-radius: 12px;
            transition: var(--transition);
            font-size: 0.95rem;
            position: relative;
          }
          .sidebar-nav-item:hover {
            background: rgba(201,168,76,0.08);
            color: var(--gold-light);
          }
          .sidebar-nav-item.active {
            background: var(--gold-dim);
            color: var(--gold);
            font-weight: 700;
          }
          .sidebar-nav-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 20%;
            height: 60%;
            width: 3px;
            background: var(--gold);
            border-radius: 0 3px 3px 0;
          }
        `}</style>
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '14px 0' : '14px 18px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              {item.icon}
              {collapsed && item.name === 'Verification Queue' && pendingCount > 0 && (
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: 'var(--red)', borderRadius: '50%' }}></div>
              )}
            </span>
            {!collapsed && <span>{item.name}</span>}
            {!collapsed && item.name === 'Verification Queue' && pendingCount > 0 && (
              <span style={{ background: 'var(--red)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', marginLeft: 'auto' }}>
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* System Status Strip */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
        {collapsed ? (
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }}></div>
        ) : (
          <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }}></div>
            <span style={{ color: 'var(--green)', fontSize: '0.7rem', fontWeight: 600 }}>All Systems Nominal</span>
            <span style={{ color: 'rgba(16,185,129,0.6)', fontSize: '0.65rem', marginLeft: 'auto' }}>{timeStr}</span>
          </div>
        )}
      </div>

      {/* User Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '10px 0' : '15px', background: collapsed ? 'transparent' : 'rgba(255,255,255,0.02)', borderRadius: '14px', border: collapsed ? 'none' : '1px solid var(--border-dark)' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold-dim)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>AD</div>
            <div>
              <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>Administrator</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Master Console</div>
            </div>
          </div>
        )}
        <button 
          onClick={handleLogout} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '8px', transition: 'var(--transition)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <LogOut size={collapsed ? 20 : 18} />
        </button>
      </div>
    </div>
  );
}
