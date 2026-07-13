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

  const initJitsi = () => {
    if (!window.JitsiMeetExternalAPI) {
      alert("Jitsi API not loaded. Please check your internet connection.");
      return;
    }

    setIsJoined(true);

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
      },
      interfaceConfigOverwrite: {
        SHOW_CHROME_EXTENSION_BANNER: false,
      },
    };

    apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

    apiRef.current.addListener("videoConferenceLeft", () => {
      leaveCall();
    });
  };

  const leaveCall = () => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    socket.emit("end-call", roomId);
    navigate("/user/dashboard");
  };

  return (
    <div className="v2-call-page" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {!isJoined ? (
        <div className="error-overlay" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <div className="avatar-placeholder pulsing" style={{ fontSize: "2rem", padding: "20px", background: "#333", borderRadius: "50%", marginBottom: "20px" }}>USR</div>
          <h3>Client Console: Ready?</h3>
          <p>Click below to initialize your secure video feed.</p>
          <div className="error-actions" style={{ marginTop: "20px" }}>
            <button className="btn-retry" onClick={initJitsi} style={{ padding: "10px 20px", background: "var(--gold)", border: "none", color: "white", cursor: "pointer", borderRadius: "4px", fontSize: "1.1rem" }}>
              Join Consultation
            </button>
            <button className="btn-cancel" onClick={() => navigate("/user/dashboard")} style={{ padding: "10px 20px", background: "transparent", border: "1px solid white", color: "white", cursor: "pointer", borderRadius: "4px", fontSize: "1.1rem", marginLeft: "10px" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div ref={jitsiContainerRef} style={{ flexGrow: 1, width: "100%" }} />
      )}
    </div>
  );
}
