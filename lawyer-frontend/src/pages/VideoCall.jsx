import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./videocall.css";

export default function VideoCall() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isJoined, setIsJoined] = useState(false);
  
  const callLink = location.state?.callLink;

  useEffect(() => {
    if (!callLink) {
      alert("Invalid Call Link. Redirecting to dashboard.");
      navigate("/dashboard");
    }
  }, [callLink, navigate]);

  const initCall = () => {
    setIsJoined(true);
  };

  const leaveCall = () => {
    setIsJoined(false);
    navigate("/dashboard");
  };

  if (!callLink) return null;

  return (
    <div className="v2-call-page">
      {/* -- Secure Header -- */}
      <header className="secure-call-header">
        <div className="secure-header-left">
          <svg className="secure-lock-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <div>
            <h1 className="secure-title">JurisVault Secure Video</h1>
            <p className="secure-subtitle">END-TO-END ENCRYPTED</p>
          </div>
        </div>
        
        {isJoined && (
          <div className="secure-header-right">
            <div className="live-timer">
              <span className="timer-dot"></span> LIVE
            </div>
            <button className="btn-leave-call" onClick={leaveCall}>
              Disconnect
            </button>
          </div>
        )}
      </header>

      {!isJoined ? (
        <div className="secure-waiting-room">
          <div className="waiting-card">
            <div className="waiting-avatar">LAW</div>
            <h3>Expert Console: Ready?</h3>
            <p>Your connection is secured with military-grade encryption. No login is required. Ensure your camera and microphone are connected before joining.</p>
            
            <div className="waiting-actions">
              <button className="btn-secure-join" onClick={initCall}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                Initialize Video Feed
              </button>
              <button className="btn-secure-cancel" onClick={() => navigate("/dashboard")}>
                Cancel Consultation
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="secure-feed-container" style={{ width: '100%', height: 'calc(100vh - 80px)', backgroundColor: '#000' }}>
          <iframe 
            src={callLink}
            allow="camera; microphone; fullscreen; display-capture"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="JurisBot Virtual Courtroom"
          />
        </div>
      )}
    </div>
  );
}
