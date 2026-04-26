import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import "./notification.css";

const RINGTONE_URL = "https://www.soundjay.com/phone/phone-calling-1.mp3";

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

         if (!ringtoneRef.current) {
           ringtoneRef.current = new Audio(RINGTONE_URL);
           ringtoneRef.current.loop = true;
         }

         ringtoneRef.current.play().catch(e => {
            console.warn("Audio blocked by browser. Click to enable.", e);
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
