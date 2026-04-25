import Sidebar from "../components/layout/Sidebar";
import RightPanel from "../components/layout/RightPanel";
import ChatWindow from "../components/chat/ChatWindow";
import BottomNav from "../components/layout/BottomNav";
import MobileHeader from "../components/layout/MobileHeader";
import "./user.css";

export default function UserDashboard() {
  return (
    <div className="layout">
      <MobileHeader />
      <Sidebar />
      <div className="layout-center">
        <ChatWindow />
      </div>
      <RightPanel />
      <BottomNav />
    </div>
  );
}