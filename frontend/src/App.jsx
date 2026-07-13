import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import Register from "./auth/Register";
import UserDashboard from "./pages/UserDashboard";
import DashboardHome from "./pages/DashboardHome";
import ProtectedRoute from "./routes/ProtectedRoute";
import Settings from "./pages/Setting";
import { setAuthToken } from "./api/axios";
import Profile from "./pages/Profile";
import RecentCases from "./pages/RecentCases";
import ConsultLawyer from "./pages/ConsultLawyer";
import Documents from "./pages/Documents";
import Notifications from "./pages/Notifications";
import FilingConsole from "./pages/FilingConsole";
import RealTimeChat from "./pages/RealTimeChat";
import MessagesList from "./pages/MessagesList";
import VideoCall from "./pages/VideoCall";
import GlobalCallNotification from "./components/layout/GlobalCallNotification";
import Terms from "./pages/Terms";
import CaseDetails from "./pages/CaseDetails";
import Alerts from "./pages/Alerts";
import AdminDashboard from "./pages/AdminDashboard";

import { primeAudio } from "./api/socket";

// ✅ AUTO TOKEN LOAD
if (localStorage.token) {
  setAuthToken(localStorage.token);
}

export default function App() {
  const [broadcast, setBroadcast] = useState(null);
  // ✅ WAKE UP AUDIO ENGINE ON FIRST INTERACTION
  const handleInteraction = () => {
    primeAudio();
    window.removeEventListener("click", handleInteraction);
    window.removeEventListener("touchstart", handleInteraction);
  };

  useEffect(() => {
    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    import("./api/socket").then(({ default: s }) => {
      const handleBroadcast = (data) => {
        console.log("📣 [CITIZEN DETECTED BROADCAST]", data);
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
        audio.play().catch(e => console.log("Audio failed on citizen broadcast", e));
        alert(`🏛️ JURISBOT SIGNAL RECEIVED\n\nPriority: ${String(data.priority).toUpperCase()}\nTitle: ${data.title}\nMessage: ${data.message}`);
        setBroadcast(data);
        const isEmergency = String(data.priority).toLowerCase() === 'emergency';
        if (!isEmergency) {
          setTimeout(() => setBroadcast(null), 10000);
        }
      };
      s.on("institutional-broadcast", handleBroadcast);
      s.on("institutional-broadcast-user", handleBroadcast);

      // Alert/notification fallback
      const handleNotification = (data) => {
        console.log("🔔 [ALERT DETECTED IN CITIZEN PORTAL]", data);
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
        audio.play().catch(e => console.log("Audio play failed on notification", e));
        alert(`🔔 JURISBOT NOTIFICATION\n\n${data.text || data.message || "New message received."}`);
      };
      s.on("notification", handleNotification);

      // ✅ GLOBAL JOIN & RECONNECT LAYER
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const uid = user._id || user.id;
      if (uid) {
        const sync = () => {
          s.emit("join", uid);
          console.log("Citizen joined notification bridge:", uid);
        };
        if (s.connected) sync();
        s.on("connect", sync);
      }
    });

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
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
    <Route path="/" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/terms" element={<Terms />} />


      <Route path="/user" element={
        <ProtectedRoute allowedRoles={["user", "admin"]}><UserDashboard /></ProtectedRoute>
      }/>

      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={["user", "admin"]}><DashboardHome /></ProtectedRoute>
      }/>

      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>
      }/>

    <Route path="/create-case" element={
      <ProtectedRoute allowedRoles={["user"]}><FilingConsole /></ProtectedRoute>
    }/>

      {/* ✅ FIXED ROUTES */}
      <Route path="/cases" element={
        <ProtectedRoute allowedRoles={["user", "lawyer", "admin"]}><RecentCases /></ProtectedRoute>
      }/>

      <Route path="/case/:id" element={
        <ProtectedRoute allowedRoles={["user", "lawyer", "admin"]}><CaseDetails /></ProtectedRoute>
      }/>

      <Route path="/lawyers" element={
        <ProtectedRoute allowedRoles={["user", "admin"]}><ConsultLawyer /></ProtectedRoute>
      }/>

      <Route path="/documents" element={
        <ProtectedRoute allowedRoles={["user", "lawyer", "admin"]}><Documents /></ProtectedRoute>
      }/>

      <Route path="/notifications" element={
        <ProtectedRoute allowedRoles={["user", "lawyer", "admin"]}><Notifications /></ProtectedRoute>
      }/>

      <Route path="/chat/:id" element={
        <ProtectedRoute allowedRoles={["user", "lawyer", "admin"]}><RealTimeChat /></ProtectedRoute>
      }/>

      <Route path="/video/:roomId" element={
        <ProtectedRoute allowedRoles={["user", "lawyer", "admin"]}><VideoCall /></ProtectedRoute>
      }/>

      <Route path="/messages" element={
        <ProtectedRoute allowedRoles={["user", "lawyer", "admin"]}><MessagesList /></ProtectedRoute>
      }/>

      <Route path="/profile" element={
      <ProtectedRoute allowedRoles={["user", "lawyer", "admin"]}><Profile /></ProtectedRoute>
    }/>

      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={["user", "lawyer", "admin"]}><Settings /></ProtectedRoute>
      }/>

      <Route path="/alerts" element={
        <ProtectedRoute allowedRoles={["user", "lawyer", "admin"]}><Alerts /></ProtectedRoute>
      }/>
    </Routes>
  </>
);
}
