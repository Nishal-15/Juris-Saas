import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import socket from "../api/socket";
import "./videocall.css";

const servers = {
  iceServers: [{ urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] }],
};

export default function VideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pc = useRef(new RTCPeerConnection(servers));

  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [status, setStatus] = useState("Securing Tunnel...");

  useEffect(() => {
    let isPolite = false;
    const startCall = async () => {
      // 1. Join Socket Room
      socket.emit("join-room", roomId);
      setStatus("Establishing Secure Link...");

      // 2. Local Stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => pc.current.addTrack(track, stream));

      const iceQueue = [];

      pc.current.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        setStatus("Consultation Live ●");
      };

      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { candidate: event.candidate, room: roomId });
        }
      };

      pc.current.oniceconnectionstatechange = () => {
        const state = pc.current.iceConnectionState;
        console.log("🧊 ICE:", state);
        if (state === "connected" || state === "completed") setStatus("Consultation Live ●");
        if (state === "failed" || state === "disconnected") {
           setStatus("Reconnecting Tunnel...");
           pc.current.restartIce();
        }
      };

      // 📡 SIGNALING SYNC
      socket.on("user-joined", async () => {
        console.log("🤝 Connection Triggered by Peer Join");
        isPolite = false; // Initiator
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        socket.emit("offer", { offer, room: roomId });
        setStatus("Handshaking...");
      });

      socket.on("offer", async (data) => {
        console.log("📨 Offer Received");
        isPolite = true; // Receiver
        await pc.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        socket.emit("answer", { answer, room: roomId });
        
        while (iceQueue.length) {
          await pc.current.addIceCandidate(iceQueue.shift()).catch(e => {});
        }
      });

      socket.on("answer", async (data) => {
        console.log("📨 Answer Received");
        if (pc.current.signalingState !== "stable") {
           await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
           while (iceQueue.length) {
              await pc.current.addIceCandidate(iceQueue.shift()).catch(e => {});
           }
        }
      });

      socket.on("ice-candidate", async (data) => {
        const candidate = new RTCIceCandidate(data.candidate);
        if (pc.current.remoteDescription && pc.current.remoteDescription.type) {
           await pc.current.addIceCandidate(candidate).catch(e => {});
        } else {
           iceQueue.push(candidate);
        }
      });

      // 🔥 AUTO-INITIATE: If both are in the room, somebody must start.
      // We wait 1 second; if no offer comes, we become the initiator.
      setTimeout(async () => {
        if (pc.current.signalingState === "stable" && !pc.current.remoteDescription) {
           console.log("⚡ Auto-Initiating Handshake after 1s silence...");
           const offer = await pc.current.createOffer();
           await pc.current.setLocalDescription(offer);
           socket.emit("offer", { offer, room: roomId });
        }
      }, 2500);

      socket.on("end-call", () => {
         console.log("🛑 Peer terminated the consultation");
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
            <h3>Connecting Private Link...</h3>
            <p>Wait for the expert to join</p>
          </div>
        )}
      </div>

      {/* LOCAL (FLOATING) */}
      <div className="local-wrapper">
        <video ref={localVideoRef} autoPlay muted playsInline />
        <div className="local-name">You</div>
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
