import { useRef, useEffect } from "react";
import io from "socket.io-client";
import "./video.css";

const socket = io("http://localhost:5000");

export default function VideoCall({ room, onEnd }) {
  const localRef  = useRef();
  const remoteRef = useRef();
  const pc = new RTCPeerConnection();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      localRef.current.srcObject = stream;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
    });

    socket.emit("join", room);

    pc.ontrack = e => { remoteRef.current.srcObject = e.streams[0]; };
    pc.onicecandidate = e => {
      if (e.candidate) socket.emit("signal", { room, signal: e.candidate });
    };

    socket.on("signal", async s => {
      if (s.type) {
        await pc.setRemoteDescription(s);
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        socket.emit("signal", { room, signal: ans });
      } else {
        await pc.addIceCandidate(s);
      }
    });
  }, []);

  return (
    <div className="video-wrap">
      <div className="video-info">
        <div className="video-dot" />
        Live Call — Adv. Rahul Verma
      </div>

      <video ref={remoteRef} className="video-remote" autoPlay />
      <video ref={localRef}  className="video-local"  autoPlay muted />

      <div className="video-controls">
        <button className="video-btn">🎤</button>
        <button className="video-btn">📷</button>
        <button className="video-btn video-btn-end" onClick={onEnd}>📵</button>
      </div>
    </div>
  );
}