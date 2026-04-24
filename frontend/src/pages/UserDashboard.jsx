import Sidebar from "../components/layout/Sidebar";
import RightPanel from "../components/layout/RightPanel";
import ChatWindow from "../components/chat/ChatWindow";
import "./user.css";

export default function UserDashboard() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-center">
        <ChatWindow />
      </div>
      <RightPanel />
    </div>
  );
}