import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import "./videocall.css";

export default function VideoCall() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const [isJoined, setIsJoined] = useState(false);
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    socket.on("end-call", () => leaveCall());
    return () => {
      leaveCall();
      socket.off("end-call");
    };
  }, [roomId]);

  useEffect(() => {
    if (isJoined && jitsiContainerRef.current && !apiRef.current) {
      if (!window.JitsiMeetExternalAPI) {
        alert("Jitsi API not loaded. Please check your internet connection.");
        return;
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const domain = "meet.jit.si";
      const options = {
        roomName: `jurisbot-consultation-${roomId}`,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user.name || "Citizen Client",
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          SHOW_CHROME_EXTENSION_BANNER: false,
        },
      };

      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current.addListener("videoConferenceLeft", () => {
        leaveCall();
      });
    }
  }, [isJoined, roomId]);

  const initJitsi = () => {
    setIsJoined(true);
  };

  const leaveCall = () => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    socket.emit("end-call", roomId);
    navigate("/dashboard");
  };

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
            <div className="waiting-avatar">USR</div>
            <h3>Client Console: Ready?</h3>
            <p>Your connection is secured with military-grade encryption. Ensure your camera and microphone are connected before joining the consultation.</p>
            
            <div className="waiting-actions">
              <button className="btn-secure-join" onClick={initJitsi}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                Initialize Video Feed
              </button>
              <button className="btn-secure-cancel" onClick={() => navigate("/user/dashboard")}>
                Cancel Consultation
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="secure-feed-container" ref={jitsiContainerRef} />
      )}
    </div>
  );
}
