import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import "./videocall.css";

const servers = {
  iceServers: [{ urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] }],
};

export default function VideoCall() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pc = useRef(new RTCPeerConnection(servers));

  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [status, setStatus] = useState("Initializing Secure Tunnel...");

  useEffect(() => {
    const startCall = async () => {
      // 1. Join Socket Room
      socket.emit("join-room", roomId);
      setStatus("Initializing Secure Tunnel...");

      // 2. Media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => pc.current.addTrack(track, stream));

      // 3. Remote Tracking
      pc.current.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        setStatus("Consultation Live ●");
      };

      // 4. ICE Handshake
      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { candidate: event.candidate, room: roomId });
        }
      };

      pc.current.oniceconnectionstatechange = () => {
        if(pc.current.iceConnectionState === "connected") setStatus("Consultation Live ●");
        if(pc.current.iceConnectionState === "failed") setStatus("Tunnel Interrupted. Re-joining...");
      };

      // 5. Handshake Listeners
      socket.on("user-joined", async () => {
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        socket.emit("offer", { offer, room: roomId });
      });

      socket.on("offer", async (data) => {
        await pc.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        socket.emit("answer", { answer, room: roomId });
      });

      socket.on("answer", async (data) => {
        await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      });

      socket.on("ice-candidate", (data) => {
        pc.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(e => console.error(e));
      });
      socket.on("end-call", () => {
        cleanup();
        navigate(-1);
      });
    };

    startCall();

    return () => {
      cleanup();
    };
  }, [roomId]);

  const cleanup = () => {
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");
    socket.off("user-joined");
    socket.off("end-call");
    if (localVideoRef.current?.srcObject) {
       localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    pc.current?.close();
  };

  const endCall = () => {
    socket.emit("end-call", roomId);
    cleanup();
    navigate(-1);
  };

  const toggleMute = () => {
    const s = localVideoRef.current.srcObject;
    if (s) {
      s.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleCam = () => {
    const s = localVideoRef.current.srcObject;
    if (s) {
      s.getVideoTracks()[0].enabled = isCamOff;
      setIsCamOff(!isCamOff);
    }
  };

  return (
    <div className="v2-call-page">
      {/* REMOTE (FULL SCREEN) */}
      <div className="remote-wrapper">
        <video ref={remoteVideoRef} autoPlay playsInline />
        {!remoteVideoRef.current?.srcObject && (
          <div className="connecting-overlay">
            <div className="avatar-placeholder pulsing">⚖️</div>
            <h3>Establishing Secure Bridge...</h3>
            <p>{status}</p>
          </div>
        )}
      </div>

      {/* LOCAL (FLOATING) */}
      <div className="local-wrapper">
        <video ref={localVideoRef} autoPlay muted playsInline />
        <div className="local-name">Expert View</div>
      </div>

      {/* CALL HEADER */}
      <div className="call-header">
        <div className="status-badge">{status}</div>
      </div>

      {/* CALL TOOLBAR */}
      <div className="call-footer">
        <div className="tool-controls glass">
          <button className={`ctrl-btn ${isMuted ? 'off' : ''}`} onClick={toggleMute}>
            {isMuted ? "🔇" : "🎤"}
          </button>
          <button className={`ctrl-btn ${isCamOff ? 'off' : ''}`} onClick={toggleCam}>
            {isCamOff ? "🙈" : "📹"}
          </button>
          <button className="ctrl-btn add" onClick={() => alert("Invite link copied!")}>+</button>
          <button className="ctrl-btn hangup" onClick={endCall}>📞</button>
        </div>
      </div>
    </div>
  );
}
