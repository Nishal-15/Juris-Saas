import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../../api/socket";
import "./notification.css";

// 🔔 PREMIUM RINGTONE URL
const RINGTONE_URL = "https://raw.githubusercontent.com/shubham-uttam/iPhone-Ringtone/master/iPhone%20Ringtone.mp3";

export default function GlobalCallNotification() {
  const [incomingCall, setIncomingCall] = useState(null);
  const ringtoneRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("incoming-video-call", ({ from, fromName, roomId }) => {
       console.log("RECEIVING CALL FROM:", fromName);
       const user = JSON.parse(localStorage.getItem("user") || "{}");
       const myId = user._id || user.id;

       if (from !== myId) {
         setIncomingCall({ from, fromName, roomId });
         
         // Initialize and Play Ringtone
         if (!ringtoneRef.current) {
           ringtoneRef.current = new Audio(RINGTONE_URL);
           ringtoneRef.current.loop = true;
         }
         ringtoneRef.current.play().catch(e => {
           console.warn("Audio blocked! Click anywhere on the page to enable sound.", e);
         });
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
    <div className="global-call-alert">
      <div className="call-info">
        <div className="call-avatar pulsing">LAW</div>
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
