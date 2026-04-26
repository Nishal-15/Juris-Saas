import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import "./videocall.css";

export default function VideoCall() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userName = user.name || "Advocate";

    const loadJitsi = () => {
      if (window.JitsiMeetExternalAPI) {
        const domain = "8x8.vc";
        const options = {
          roomName: `vpaas-magic-cookie-3d02773950264b388b7764951478546b/${roomId}`,
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
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
              'security'
            ],
          }
        };
        
        apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

        apiRef.current.addEventListeners({
          readyToClose: () => {
            socket.emit("end-call", roomId);
            navigate(-1);
          },
          videoConferenceLeft: () => {
            socket.emit("end-call", roomId);
            navigate(-1);
          }
        });
      } else {
        console.error("Jitsi SDK not loaded");
        // Retry in 1 second
        setTimeout(loadJitsi, 1000);
      }
    };

    loadJitsi();

    socket.on("end-call", () => {
       if (apiRef.current) apiRef.current.dispose();
       navigate(-1);
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
