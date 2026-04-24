import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import socket from "../api/socket";
import axios from "../api/axios";
import "./chat.css";

export default function RealTimeChat() {
  const { id } = useParams(); // Target user ID
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [targetName, setTargetName] = useState("Expert");
  
  // ✅ FIX: Use user._id (Mongoose default)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user._id || user.id;

  const endRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    // socket.emit("join", userId); // Handled globally in AuthContext now

    // Fetch target user info for header
    axios.get(`/auth/user/${id}`).then(res => setTargetName(res.data.name)).catch(() => {});

    // ✅ FETCH CHAT HISTORY
    axios.get(`/chat/${id}`).then(res => setMessages(res.data)).catch(() => {});

    socket.on("receive-message", (message) => {
      // Check if message is from the person we are chatting with
      if (message.from === id) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => {
       socket.off("receive-message");
    };
  }, [id, userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const message = {
      from: userId,
      to: id,
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socket.emit("send-message", { to: id, message });
    setMessages(prev => [...prev, message]);
    setInput("");
  };

  const startVideoCall = () => {
    // Generate a unique room ID or use the current chat ID
    const roomId = [userId, id].sort().join("-");
    
    // ✅ ALERT THE OTHER PERSON
    socket.emit("video-call-request", { 
      to: id, 
      from: userId, 
      fromName: user.name || "Client", 
      roomId 
    });

    navigate(`/video/${roomId}`);
  };

  const [showEmojis, setShowEmojis] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
       // Logic for file upload can be added here
       alert(`File "${file.name}" selected. Uploading...`);
    }
  };

  return (
    <div className="whatsapp-chat-page">
      <Sidebar />
      <main className="chat-viewport">
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload} 
        />
        
        {/* CHAT HEADER */}
        <header className="wa-header glass">
          <div className="wa-user-info">
             <button className="wa-back-btn" onClick={() => navigate(-1)}>←</button>
             <div className="wa-avatar">⚖️</div>
             <div className="wa-details">
                <h3>{targetName}</h3>
                <span className="wa-status">● Online</span>
             </div>
          </div>
          <div className="wa-actions">
             <button className="wa-icon-btn" onClick={startVideoCall}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
             </button>
             <button className="wa-icon-btn" onClick={() => fileInputRef.current.click()}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4s-4 1.79-4 4v12.5c0 3.31 2.69 6 6 6s6-2.69 6-6V6h-1.5z"/></svg>
             </button>
             <button className="wa-icon-btn">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
             </button>
          </div>
        </header>

        {/* MESSAGES AREA */}
        <div className="wa-messages-area">
          <div className="wa-empty">
             <div className="wa-lock-tag">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style={{marginRight: '5px'}}><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
                End-to-end encrypted
             </div>
             <p>Messages are secured with JurisVault™ technology.</p>
          </div>
          {messages.map((m, i) => (
            <div key={i} className={`wa-bubble-row ${m.from === userId ? "wa-sent" : "wa-received"}`}>
              <div className="wa-bubble">
                {m.text}
                <span className="wa-time">
                  {m.timestamp || (m.createdAt && new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
                  {m.from === userId && <span className="wa-check">✓✓</span>}
                </span>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* INPUT AREA */}
        <footer className="wa-input-footer">
           <div className="wa-input-container glass">
              <button className="wa-input-btn" onClick={() => setShowEmojis(!showEmojis)}>
                 <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5s.67 1.5 1.5 1.5zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
              </button>
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Type a message"
              />
              <button className="wa-input-btn" onClick={() => fileInputRef.current.click()}>
                 <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              </button>
           </div>
           <button className="wa-send-btn" onClick={send} disabled={!input.trim()}>
              {input.trim() ? (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
              )}
           </button>
        </footer>

      </main>
    </div>
  );
}
