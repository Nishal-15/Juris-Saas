import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import axios from "../api/axios";
import "./dashboardhome.css";
import BottomNav from "../components/layout/BottomNav";

export default function DashboardHome() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    axios.get("/cases").then(res => setCases(res.data)).catch(() => {});
  }, []);

  return (
    <div className="db-layout">
      <Sidebar />
      
      <div className="db-main">
        {/* Mobile Header (Image 4 Style) */}
        <header className="db-header">
          <div className="db-user-pill">
            <div className="db-avatar">
              <img src="/logo.png" alt="Profile" />
            </div>
            <div className="db-welcome">
              <span className="db-user-name">JurisBot 2.0</span>
            </div>
          </div>
          <div className="db-header-actions">
            <button className="db-icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
            <button className="db-icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span className="db-notif-dot"></span>
            </button>
          </div>
        </header>

        <h1 className="db-title">Dashboard</h1>

        {/* Legal Alarms Section */}
        <section className="db-section">
          <h2 className="db-section-label">Legal Alarms</h2>
          <div className="db-alarm-card red">
            <div className="db-alarm-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
            <div className="db-alarm-content">
              <h3>Court Hearing in 2 days</h3>
              <p>Case: State v. Miller (No. 4567)</p>
              <div className="db-alarm-meta">
                <span>Oct 28, 9:00 AM | Superior Court</span>
              </div>
            </div>
            <div className="db-alarm-badge">!</div>
          </div>

          <div className="db-alarm-card orange">
            <div className="db-alarm-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
            <div className="db-alarm-content">
              <h3>Deadline: Motion to Dismiss</h3>
              <p>Case: Johnson v. Apex Corp</p>
              <div className="db-alarm-meta">
                <span>Oct 27, 5:00 PM</span>
              </div>
            </div>
            <div className="db-alarm-badge">1d</div>
          </div>
        </section>

        {/* Representation Section */}
        <section className="db-section">
          <h2 className="db-section-label">Representation</h2>
          
          <div className="db-case-card">
            <div className="db-case-top">
              <div className="db-case-info">
                <h3>State v. Miller</h3>
                <p>Case #4567</p>
                <div className="db-case-client">Client: James Miller</div>
              </div>
              <div className="db-case-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/></svg></div>
            </div>
            
            <div className="db-progress-wrap">
              <div className="db-progress-text">
                <span>Discovery Phase</span>
                <span>65%</span>
              </div>
              <div className="db-progress-bar">
                <div className="db-progress-fill" style={{ width: '65%' }}></div>
              </div>
            </div>

            <div className="db-case-footer">
              <span>Felony Charge | Active: 14 Days</span>
              <span className="db-status-tag">In Progress</span>
            </div>
          </div>

          <div className="db-case-card">
            <div className="db-case-top">
              <div className="db-case-info">
                <h3>Johnson v. Apex Corp</h3>
                <p>Business Litigation</p>
                <div className="db-case-client">Felony Charge | Active: 14 Days</div>
              </div>
              <div className="db-case-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
            </div>
            
            <div className="db-progress-wrap">
              <div className="db-progress-text">
                <span>Pleadings Phase</span>
                <span>40%</span>
              </div>
              <div className="db-progress-bar">
                <div className="db-progress-fill" style={{ width: '40%' }}></div>
              </div>
            </div>

            <div className="db-case-footer">
              <span></span>
              <span className="db-status-tag">In Progress</span>
            </div>
          </div>
        </section>

        <BottomNav />
      </div>
    </div>
  );
}
