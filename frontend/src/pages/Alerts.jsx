import Sidebar from "../components/layout/Sidebar";
import RightPanel from "../components/layout/RightPanel";
import BottomNav from "../components/layout/BottomNav";
import MobileHeader from "../components/layout/MobileHeader";
import "./user.css";

export default function Alerts() {
  return (
    <div className="layout">
      <MobileHeader />
      <Sidebar />
      <div className="layout-center alerts-page-scroll">
        <div className="alerts-container">
           <h1 className="alerts-header-title">Legal Hub</h1>
           <RightPanel />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
