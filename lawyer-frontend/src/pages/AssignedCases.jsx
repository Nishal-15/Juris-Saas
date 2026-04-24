import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import "./case_details.css";
import "./assigned_cases.css";

export default function AssignedCases() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("my");
  const [cases, setCases] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyCases = async () => {
    setLoading(true);
    try { const res = await axios.get("/cases/lawyer"); setCases(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAvailable = async () => {
    setLoading(true);
    try { const res = await axios.get("/cases/open"); setAvailable(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "my") fetchMyCases();
    else fetchAvailable();
  }, [activeTab]);

  const handleClaim = async (id) => {
    try {
      await axios.patch(`/cases/${id}/accept`);
      fetchAvailable();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Could not claim case."));
    }
  };

  const urgencyColor = (u) =>
    u === "Emergency" ? "#ef4444" : u === "High" ? "#f59e0b" : "#10b981";

  const displayList = activeTab === "my" ? cases : available;

  return (
    <div className="ac-page">
      <Sidebar />
      <div className="ac-body">

        {/* Header */}
        <header className="ac-header">
          <div>
            <h1 className="ac-title">Case Files</h1>
            <p className="ac-subtitle">Manage your active representation and explore available legal matters.</p>
          </div>
          <div className="ac-tabs">
            <button className={`ac-tab ${activeTab === "my" ? "active" : ""}`} onClick={() => setActiveTab("my")}>
              My Active Files
              {cases.length > 0 && <span className="ac-count">{cases.length}</span>}
            </button>
            <button className={`ac-tab ${activeTab === "available" ? "active" : ""}`} onClick={() => setActiveTab("available")}>
              Available Matters
              {available.length > 0 && <span className="ac-count">{available.length}</span>}
            </button>
          </div>
        </header>

        {/* Content */}
        {loading ? (
          <div className="ac-empty">
            <div className="ac-spinner" />
            Analyzing legal database...
          </div>
        ) : displayList.length === 0 ? (
          <div className="ac-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>{activeTab === "my" ? "You have no active cases assigned yet." : "No open cases available right now."}</p>
          </div>
        ) : activeTab === "my" ? (
          /* Compact Cards for My Cases */
          <div className="ac-cards-grid">
            {displayList.map((c) => (
              <div key={c._id} className="ac-card">
                <div className="ac-card-top">
                  <div className="ac-card-avatar">
                    {(c.user?.name?.[0] || "C").toUpperCase()}
                  </div>
                  <span className={`ac-status-tag ${c.status === "Closed" ? "green" : c.status === "In Progress" ? "blue" : "gold"}`}>
                    {c.status}
                  </span>
                </div>
                <div className="ac-card-client">{c.user?.name || "Client"}</div>
                <div className="ac-card-title-text">{c.title}</div>
                <div className="ac-card-meta">
                  <span>{c.type}</span>
                  {c.hearingDate && (
                    <>
                      <span className="ac-dot" />
                      <span>{new Date(c.hearingDate).toLocaleDateString("en-IN")}</span>
                    </>
                  )}
                </div>
                <button className="ac-card-btn" onClick={() => navigate(`/case/${c._id}`)}>
                  View Details
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Table for Available Cases */
          <div className="ac-panel">
            <div className="ac-table-head">
              <span>Case Title</span>
              <span>Category</span>
              <span>Urgency</span>
              <span>Filed By</span>
              <span>Action</span>
            </div>
            {displayList.map((c) => (
              <div key={c._id} className="ac-table-row">
                <div className="ac-cell-title">{c.title}</div>
                <div><span className="ac-tag blue">{c.type}</span></div>
                <div style={{ color: urgencyColor(c.urgency), fontWeight: 600, fontSize: "13px" }}>{c.urgency}</div>
                <div className="ac-muted">{c.user?.name || "Anonymous"}</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="ac-btn-gold" onClick={() => handleClaim(c._id)}>Claim</button>
                  <button className="ac-btn-icon" onClick={() => navigate(`/case/${c._id}`)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}