import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";
import "./messages.css";

export default function MessagesList() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        // For lawyers, we fetch received appointments to see whom they can chat with
        const res = await axios.get("/appointments/received");
        // Only accepted appointments can have active chats
        const activeChats = res.data.filter(app => app.status === "Accepted");
        
        // Remove duplicates if the same user has multiple accepted appointments
        const uniqueUsers = Array.from(new Set(activeChats.map(a => a.userId?._id)))
          .map(id => activeChats.find(a => a.userId?._id === id));
        
        setChats(uniqueUsers);
      } catch (err) {
        console.error("Error fetching chats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  return (
    <div className="messages-page">
      <Sidebar />
      <main className="messages-main">
        <header className="messages-header fade-in">
          <h1>Client Consultations 💬</h1>
          <p>Access your active legal consultations and secure messaging channels.</p>
        </header>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>
             Connecting to secure console...
          </div>
        ) : chats.length === 0 ? (
          <div className="empty-messages glass fade-in">
             <div style={{ fontSize: "40px", marginBottom: "16px" }}>👋</div>
             <h3>No Active Messages</h3>
             <p>Once you accept a consultation request, your private chat channel will appear here.</p>
             <button className="btn-return" onClick={() => navigate("/lawyer/dashboard")}>
               Check Pending Requests
             </button>
          </div>
        ) : (
          <div className="chats-list fade-in">
            {chats.map((c, idx) => (
              <div 
                key={c._id} 
                className="chat-item-row glass" 
                onClick={() => navigate(`/chat/${c.userId?._id}`)}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="chat-user-avatar">
                   {c.userId?.name?.[0] || "?"}
                </div>
                <div className="chat-user-details">
                   <div className="chat-user-name">{c.userId?.name || "Client"}</div>
                   <div className="chat-user-meta">{c.date || "Accepted Consultation"} • {c.time}</div>
                </div>
                <div className="chat-user-status">
                   <span className="online-indicator"></span> Active
                </div>
                <button className="btn-chat-open">Open Chat</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
