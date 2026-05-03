import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import socket from "./socket";
import ChatPage from "./pages/ChatPage";
import Login from "./auth/Login";
import Register from "./auth/Register";
import LawyerDashboard from "./pages/LawyerDashboard";
import AssignedCases from "./pages/AssignedCases";
import MessagesList from "./pages/MessagesList";
import VideoCall from "./pages/VideoCall";

import GlobalCallNotification from "./components/GlobalCallNotification";
import CaseDetails from "./pages/CaseDetails";
import Notifications from "./pages/Notifications";
import Subscription from "./pages/Subscription";

export default function App() {
  const [broadcast, setBroadcast] = useState(null);
  
  // ✅ GLOBAL JOIN & RECONNECT LAYER
  useEffect(() => {
    const syncSocket = () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const uid = user._id || user.id;
      if (uid) {
        socket.emit("join", uid);
        console.log("Lawyer synchronized with notification bridge:", uid);
      }
    };

    if (socket.connected) syncSocket();
    socket.on("connect", syncSocket);
    
    // Broadcast Listeners
    const handleBroadcast = (data) => {
      console.log("📣 [BROADCAST SIGNAL DETECTED IN LAWYER]", data);
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
      audio.play().catch(e => console.log("Audio play failed on broadcast fallback", e));
      alert(`🏛️ JURISBOT SIGNAL RECEIVED\n\nPriority: ${String(data.priority).toUpperCase()}\nTitle: ${data.title}\nMessage: ${data.message}`);
      setBroadcast(data);
      const isEmergency = String(data.priority).toLowerCase() === 'emergency';
      if (!isEmergency) {
        setTimeout(() => setBroadcast(null), 10000);
      }
    };
    socket.on("institutional-broadcast", handleBroadcast);
    socket.on("institutional-broadcast-lawyer", handleBroadcast);

    // Dynamic alerts
    const handleNotification = (data) => {
      console.log("🔔 [ALERT DETECTED IN ADVOCATE PORTAL]", data);
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
      audio.play().catch(e => console.log("Audio play failed on notification", e));
      alert(`🔔 JURISBOT NOTIFICATION\n\n${data.text || data.message || "New message received."}`);
    };
    socket.on("notification", handleNotification);

    // Also sync on storage change (login/logout in other tabs)
    window.addEventListener("storage", syncSocket);

    return () => {
      socket.off("connect", syncSocket);
      socket.off("institutional-broadcast", handleBroadcast);
      socket.off("institutional-broadcast-lawyer", handleBroadcast);
      socket.off("notification", handleNotification);
      window.removeEventListener("storage", syncSocket);
    };
  }, []);

  return (
    <>
      {broadcast && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
          background: broadcast.priority === 'Emergency' ? '#ef4444' : '#0f111a',
          color: 'white', padding: '20px', textAlign: 'center',
          borderBottom: '4px solid #c9a84c', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontFamily: 'Playfair Display' }}>
            {broadcast.priority === 'Emergency' ? '🚨 URGENT INSTITUTIONAL DIRECTIVE' : '🏛️ JURISBOT INSTITUTIONAL NOTICE'}
          </h2>
          <h3 style={{ margin: '0 0 5px 0' }}>{broadcast.title}</h3>
          <p style={{ margin: '0 0 15px 0', opacity: 0.9 }}>{broadcast.message}</p>
          <button 
            onClick={() => setBroadcast(null)}
            style={{ background: 'white', color: '#0f111a', border: 'none', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Acknowledge
          </button>
        </div>
      )}
      <GlobalCallNotification />
    <Routes>

      {/* Auth */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Lawyer Workspace */}
      <Route path="/lawyer/dashboard" element={<LawyerDashboard />} />
      <Route path="/lawyer/cases" element={<AssignedCases />} />
      <Route path="/lawyer/notifications" element={<Notifications />} />
      <Route path="/lawyer/messages" element={<MessagesList />} />
      <Route path="/lawyer/subscription" element={<Subscription />} />
      <Route path="/case/:id" element={<CaseDetails />} />

      {/* Secure Consultation Console */}
      <Route path="/chat/:id" element={<ChatPage />} />
      <Route path="/video/:id" element={<VideoCall />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
    </>
  );
}