import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import "./notification.css";

const RINGTONE_URL = "https://raw.githubusercontent.com/shubham-uttam/iPhone-Ringtone/master/iPhone%20Ringtone.mp3";

export default function GlobalCallNotification() {
  const [incomingCall, setIncomingCall] = useState(null);
  const activeAudio = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("incoming-video-call", ({ from, fromName, roomId }) => {
       const user = JSON.parse(localStorage.getItem("user") || "{}");
       const myId = user._id || user.id;
       
       if (from !== myId) {
         setIncomingCall({ from, fromName, roomId });

         if (activeAudio.current) {
           activeAudio.current.pause();
           activeAudio.current.currentTime = 0;
         }

         const audio = new Audio(RINGTONE_URL);
         audio.loop = true;
         activeAudio.current = audio;

         audio.play().catch(() => {
            const fallback = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTtvT18AZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==");
            fallback.loop = true;
            activeAudio.current = fallback;
            fallback.play().catch(e => console.error("Sound blocked", e));
         });
       }
    });

    return () => {
       socket.off("incoming-video-call");
       if (activeAudio.current) activeAudio.current.pause();
    };
  }, []);

  const stopRingtone = () => {
     if (activeAudio.current) {
       activeAudio.current.pause();
       activeAudio.current.currentTime = 0;
       activeAudio.current = null;
     }
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
