import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import axios from "../api/axios";

const style = {
  page:  { display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" },
  main:  { flex: 1, overflowY: "auto", padding: "40px" },
  card:  { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px", cursor: "pointer", transition: "all 0.2s" },
  avatar:{ width: "48px", height: "48px", background: "var(--gold-dim)", borderRadius: "12px", display: "flex", alignItems: "center", justifyCenter: "center", fontSize: "20px" },
  name:  { fontSize: "16px", fontWeight: 600, color: "var(--white)" },
  sub:   { fontSize: "12px", color: "var(--muted)", marginTop: "2px" },
  status:{ marginLeft: "auto", fontSize: "11px", color: "var(--success)", fontWeight: 700, textTransform: "uppercase" }
};

export default function MessagesList() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchChats = async () => {
      if (!user.role) {
        console.warn("No user role found in MessagesList");
        return;
      }
      try {
        // Fetch appointments to see who we can chat with
        // For lawyers, fetch received. For users, fetch sent.
        const endpoint = user.role === "lawyer" ? "/appointments/received" : "/appointments";
        const res = await axios.get(endpoint);
        
        // Filter for accepted ones as that's when chat is enabled
        const active = res.data.filter(a => a.status === "Accepted");
        setChats(active);
      } catch (err) {
        console.error("Messages list error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [user.role]);

  return (
    <div style={style.page}>
      <Sidebar />
      <main style={style.main}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", color: "var(--white)", fontSize: "32px" }}>Client Messages</h1>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>Select a conversation to continue your consultation.</p>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading conversations...</p>
        ) : chats.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
             <div style={{ fontSize: "40px", marginBottom: "16px" }}>💬</div>
             <p style={{ color: "var(--muted)" }}>No active conversations found.</p>
             <p style={{ color: "var(--muted-2)", fontSize: "12px", marginTop: "8px" }}>Accepted consultations will appear here.</p>
          </div>
        ) : (
          chats.map(chat => {
            const partner = user.role === "lawyer" ? chat.userId : chat.lawyerId;
            return (
              <div 
                key={chat._id} 
                style={style.card} 
                className="msg-card"
                onClick={() => navigate(`/chat/${partner._id}`)}
              >
                <div style={style.avatar}>👤</div>
                <div>
                  <div style={style.name}>{partner?.name || "Anonymous"}</div>
                  <div style={style.sub}>{user.role === "lawyer" ? "Client" : "Advocate"} • Last active recently</div>
                </div>
                <div style={style.status}>Active</div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
