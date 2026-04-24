import { Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import Register from "./auth/Register";
import UserDashboard from "./pages/UserDashboard";
import LawyerDashboard from "./pages/LawyerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
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

// ✅ AUTO TOKEN LOAD
if (localStorage.token) {
setAuthToken(localStorage.token);
}

export default function App() {
return ( 
<>
  <GlobalCallNotification />
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/terms" element={<Terms />} />


      <Route path="/user" element={
        <ProtectedRoute allowedRoles={["user", "admin"]}><UserDashboard /></ProtectedRoute>
      }/>

    <Route path="/create-case" element={
      <ProtectedRoute allowedRoles={["user", "admin"]}><FilingConsole /></ProtectedRoute>
    }/>

      <Route path="/lawyer" element={
        <ProtectedRoute allowedRoles={["lawyer", "admin"]}><LawyerDashboard /></ProtectedRoute>
      }/>

      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>
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
    </Routes>
  </>
);
}
