import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import axios from "../api/axios";

// 🏛️ PREMIUM STYLING FOR LAWYER CONSOLE
const style = {
  page:  { display: "flex", height: "100vh", overflow: "hidden", background: "#0d0f14", fontFamily: "var(--font-body)" },
  main:  { flex: 1, overflowY: "auto", padding: "40px" },
  header:{ marginBottom: "40px" },
  title: { fontSize: "32px", fontWeight: 700, color: "#fff", letterSpacing: "-1px" },
  stats: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "40px" },
  sCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" },
  sVal:  { fontSize: "32px", fontWeight: 700, color: "var(--gold)", marginBottom: "4px" },
  sLbl:  { fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" },
  
  tabs:  { display: "flex", gap: "2px", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "12px", marginBottom: "24px" },
  tab:   (active) => ({ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: active ? "rgba(201,168,76,0.1)" : "transparent", color: active ? "var(--gold)" : "var(--muted)", fontWeight: 600, cursor: "pointer", transition: "0.2s" }),
  
  tableWrap: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", overflow: "hidden" },
  table:     { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th:        { padding: "16px 24px", fontSize: "11px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.05)" },
  td:        { padding: "20px 24px", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.03)", verticalAlign: "middle" },
  
  badge:     { width: "36px", height: "36px", borderRadius: "50%", background: "rgba(201,168,76,0.1)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, overflow: "hidden" },
  status:    (s) => ({ fontSize: "11px", fontWeight: 800, padding: "4px 10px", borderRadius: "6px", textTransform: "uppercase", background: s === "Accepted" ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", color: s === "Accepted" ? "#10b981" : "#6b7280" }),
  btnConsult:{ padding: "10px 20px", background: "var(--gold)", color: "#000", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }
};

export default function LawyerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalCases: 0, pendingApps: 0, activeClients: 0, totalEarnings: "₹0" });
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("queue");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, appRes] = await Promise.all([
          axios.get("/analytics/lawyer"),
          axios.get("/appointments/received")
        ]);
        setStats(statsRes.data);
        setAppointments(appRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAccept = async (id) => {
    try {
      await axios.patch(`/appointments/${id}/status`, { status: "Accepted" });
      setAppointments(appointments.map(a => a._id === id ? { ...a, status: "Accepted" } : a));
    } catch (err) { alert("Failed to accept"); }
  };

  return (
    <div style={style.page}>
      <Sidebar />
      <main style={style.main}>
        
        <header style={style.header}>
          <h1 style={style.title}>Expert Command Center</h1>
          <p style={{ color: "var(--muted)", marginTop: "8px" }}>Monitor judicial consultations and platform marketplace</p>
        </header>

        <section style={style.stats}>
          {[
            { v: stats.activeClients, l: "Active Clients" },
            { v: stats.pendingApps, l: "Requests" },
            { v: stats.totalCases, l: "Closed Matters" },
            { v: stats.totalEarnings || "₹0", l: "Revenue" }
          ].map((s, i) => (
            <div key={i} style={style.sCard}>
              <div style={style.sVal}>{s.v}</div>
              <div style={style.sLbl}>{s.l}</div>
            </div>
          ))}
        </section>

        <nav style={style.tabs}>
          <button style={style.tab(activeTab === "queue")} onClick={() => setActiveTab("queue")}>
            Consultation Queue ({appointments.length})
          </button>
          <button style={style.tab(activeTab === "marketplace")} onClick={() => setActiveTab("marketplace")}>
            Case Marketplace
          </button>
        </nav>

        <div style={style.tableWrap}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Syncing with legal grid...</div>
          ) : (
            <table style={style.table}>
              <thead>
                <tr>
                  <th style={style.th}>Client</th>
                  <th style={style.th}>Matter</th>
                  <th style={style.th}>Scheduled</th>
                  <th style={style.th}>Status</th>
                  <th style={style.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ ...style.td, textAlign: "center", padding: "60px", color: "var(--muted)" }}>
                      Your queue is currently empty.
                    </td>
                  </tr>
                ) : (
                  appointments.map(a => (
                    <tr key={a._id}>
                      <td style={style.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={style.badge}>{a.userId?.name?.[0] || "U"}</div>
                          <strong>{a.userId?.name || "Client Reserved"}</strong>
                        </div>
                      </td>
                      <td style={style.td}>
                        <div style={{ fontSize: "14px", fontWeight: 500 }}>{a.caseId?.title || "General Consultation"}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>ID: #{a._id.slice(-6).toUpperCase()}</div>
                      </td>
                      <td style={style.td}>
                        <div style={{ fontSize: "13px" }}>{a.date}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>{a.time}</div>
                      </td>
                      <td style={style.td}>
                        <span style={style.status(a.status)}>{a.status}</span>
                      </td>
                      <td style={style.td}>
                        {a.status === "Accepted" ? (
                          <button style={style.btnConsult} onClick={() => navigate(`/chat/${a.userId?._id}`)}>Consult</button>
                        ) : (
                          <button style={{ ...style.btnConsult, background: "rgba(255,255,255,0.05)", color: "#fff" }} onClick={() => handleAccept(a._id)}>Accept</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  );
}