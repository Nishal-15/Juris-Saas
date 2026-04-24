import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import "./notification.css";

const RINGTONE_URL = "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";

export default function GlobalCallNotification() {
  const [incomingCall, setIncomingCall] = useState(null);
  const ringtoneRef = useRef(new Audio(RINGTONE_URL));
  const navigate = useNavigate();

  useEffect(() => {
    ringtoneRef.current.loop = true;

    socket.on("incoming-video-call", ({ from, fromName, roomId }) => {
       setIncomingCall({ from, fromName, roomId });
       ringtoneRef.current.play().catch(() => {});
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
    <div className="global-call-alert glass">
      <div className="call-info">
        <div className="call-avatar pulsing">⚖️</div>
        <div className="call-text">
          <h4>{incomingCall.fromName}</h4>
          <p>Incoming Legal Request...</p>
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
          Accept Call
        </button>
        <button className="btn-ignore" onClick={stopRingtone}>
          Decline
        </button>
      </div>
    </div>
  );
}
