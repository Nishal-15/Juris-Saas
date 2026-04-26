import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
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

export default function App() {
  
  // ✅ GLOBAL JOIN & RECONNECT LAYER
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const uid = user._id || user.id;
    if (uid) {
      const onConnect = () => {
        socket.emit("join", uid);
        console.log("Lawyer re-joined private console:", uid);
      };
      
      if (socket.connected) onConnect();
      socket.on("connect", onConnect);

      return () => socket.off("connect", onConnect);
    }
  }, []);

  return (
    <>
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