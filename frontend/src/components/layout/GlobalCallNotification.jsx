import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../../api/socket";
import "./notification.css";

// 🔔 PREMIUM RINGTONE URL
const RINGTONE_URL = "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";

export default function GlobalCallNotification() {
  const [incomingCall, setIncomingCall] = useState(null);
  const ringtoneRef = useRef(new Audio(RINGTONE_URL));
  const navigate = useNavigate();

  useEffect(() => {
    ringtoneRef.current.loop = true;

    socket.off("incoming-video-call");
    socket.on("incoming-video-call", ({ from, fromName, roomId }) => {
       console.log("📹 AUDIBLE ALERT: Incoming call from", fromName);
       setIncomingCall({ from, fromName, roomId });
       
       // Play Ringtone (Requires user interaction first per browser policy)
       ringtoneRef.current.play().catch(e => console.log("🔈 Audio awaiting interaction"));
    });

    return () => {
       socket.off("incoming-video-call");
       ringtoneRef.current.pause();
    };
  }, []);

  const stopRingtone = () => {
     ringtoneRef.current.pause();
     ringtoneRef.current.currentTime = 0;
     setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <div className="global-call-alert">
      <div className="call-info">
        <div className="call-avatar pulsing">👨‍⚖️</div>
        <div className="call-text">
          <h4>Expert {incomingCall.fromName}</h4>
          <p>Incoming Video Consultation...</p>
        </div>
      </div>
      <div className="call-actions">
        <button 
          className="btn-join" 
          onClick={() => {
            navigate(`/video/${incomingCall.roomId}`);
            stopRingtone();
          }}
        >
          Join Call
        </button>
        <button className="btn-ignore" onClick={stopRingtone}>
          Ignore
        </button>
      </div>
    </div>
  );
}
