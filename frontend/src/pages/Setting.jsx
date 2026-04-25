import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import BottomNav from "../components/layout/BottomNav";
import MobileHeader from "../components/layout/MobileHeader";
import axios from "../api/axios";
import "./settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [name, setName] = useState(user?.name || "");
  const [saved, setSaved] = useState(false);

  const updateProfile = async () => {
    try {
      await axios.put("/auth/update", { id: user._id, name });
      localStorage.setItem("user", JSON.stringify({ ...user, name }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert("Update failed."); }
  };

  const logout = () => { localStorage.clear(); navigate("/"); };

  return (
    <div className="st-page">
      <MobileHeader />
      <Sidebar />
      <div className="st-body">
        <h1 className="st-title">Settings</h1>
        <p className="st-subtitle">Manage your account, preferences, and security.</p>

        <div className="st-grid">
          {/* LEFT column */}
          <div className="st-col">
            {/* Profile */}
            <div className="st-card">
              <div className="st-card-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Profile Information
              </div>
              <div className="st-card-body">
                <div className="st-field">
                  <label className="st-label">Full Name</label>
                  <input className="st-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                </div>
                <div className="st-field">
                  <label className="st-label">Email Address</label>
                  <div className="st-email-box">{user?.email}</div>
                </div>
                <div className="st-row">
                  {saved && <span className="st-saved">Changes saved successfully</span>}
                  <button className="st-btn-gold" onClick={updateProfile}>Save Changes</button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="st-card st-danger-card">
              <div className="st-card-head st-danger-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span style={{ color: "#ef4444" }}>Danger Zone</span>
              </div>
              <div className="st-card-body">
                <div className="st-danger-row">
                  <div>
                    <div className="st-danger-label">Sign Out</div>
                    <div className="st-danger-sub">You will be redirected to the login page.</div>
                  </div>
                  <button className="st-btn-red" onClick={logout}>Sign Out</button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT column */}
          <div className="st-col">
            {/* Account Info */}
            <div className="st-card">
              <div className="st-card-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                Account & Security
              </div>
              <div className="st-card-body">
                <div className="st-info-row">
                  <span className="st-info-label">Account Type</span>
                  <span className="st-badge-teal">Verified Citizen</span>
                </div>
                <div className="st-info-row">
                  <span className="st-info-label">Platform Access</span>
                  <span className="st-info-val">Legal AI Chat, Case Filing, Consultation</span>
                </div>
                <div className="st-info-row">
                  <span className="st-info-label">User ID</span>
                  <span className="st-info-mono">#{user?._id?.slice(-8).toUpperCase() || "—"}</span>
                </div>
                <div className="st-info-row">
                  <span className="st-info-label">Member Since</span>
                  <span className="st-info-val">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}