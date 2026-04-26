import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../api/socket";
import "./videocall.css";

export default function VideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userName = user.name || "Citizen";

    const loadJitsi = () => {
      if (window.JitsiMeetExternalAPI) {
        const domain = "meet.jit.si";
        const options = {
          roomName: `JurisBotConsultation_${roomId}`,
          width: "100%",
          height: "100%",
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: userName
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'tileview', 'videobackgroundblur', 'help'
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
          }
        };
        
        apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

        apiRef.current.addEventListeners({
          readyToClose: () => {
            socket.emit("end-call", roomId);
            navigate("/dashboard");
          },
          videoConferenceLeft: () => {
            socket.emit("end-call", roomId);
            navigate("/dashboard");
          }
        });
      } else {
        console.error("Jitsi SDK not loaded");
        setTimeout(loadJitsi, 1000);
      }
    };

    loadJitsi();

    socket.on("end-call", () => {
       if (apiRef.current) apiRef.current.dispose();
       navigate("/dashboard");
    });

    return () => {
      if (apiRef.current) apiRef.current.dispose();
      socket.off("end-call");
    };
  }, [roomId, navigate]);

  return (
    <div className="v2-call-page" style={{ height: "100vh", background: "#000" }}>
      <div ref={jitsiContainerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
