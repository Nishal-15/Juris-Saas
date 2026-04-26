import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import "./notification.css";

const RINGTONE_URL = "https://github.com/shubham-uttam/iPhone-Ringtone/raw/master/iPhone%20Ringtone.mp3";

export default function GlobalCallNotification() {
  const [incomingCall, setIncomingCall] = useState(null);
  const ringtoneRef = useRef(new Audio(RINGTONE_URL));
  const navigate = useNavigate();

  useEffect(() => {
    ringtoneRef.current.loop = true;

    socket.on("incoming-video-call", ({ from, fromName, roomId }) => {
       const user = JSON.parse(localStorage.getItem("user") || "{}");
       const myId = user._id || user.id;
       
       // Only show if the call is NOT from me
       if (from !== myId) {
         setIncomingCall({ from, fromName, roomId });
         ringtoneRef.current.play().catch(() => {});
       }
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
        <div className="call-avatar pulsing">LAW</div>
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
        <button className="btn-ignore" onClick={() => {
          socket.emit("end-call", incomingCall.roomId);
          stopRingtone();
        }}>
          Decline
        </button>
      </div>
    </div>
  );
}
