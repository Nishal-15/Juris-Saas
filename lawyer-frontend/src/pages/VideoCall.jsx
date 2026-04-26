import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import "./videocall.css";

const servers = {
  iceServers: [
    { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
    { urls: ["stun:stun3.l.google.com:19302", "stun:stun4.l.google.com:19302"] },
    { urls: ["stun:stun.l.google.com:19302"] },
  ],
};

export default function VideoCall() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pc = useRef(new RTCPeerConnection(servers));
  const iceQueue = useRef([]);

  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [status, setStatus] = useState("Initializing Secure Tunnel...");

  useEffect(() => {
    const startCall = async () => {
      socket.emit("join-room", roomId);
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => pc.current.addTrack(track, stream));

      pc.current.ontrack = (event) => {
        console.log("Remote Stream Event:", event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setStatus("Consultation Live");
        } else {
          console.warn("Remote video ref not ready, retrying...");
          setTimeout(() => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
              setStatus("Consultation Live");
            }
          }, 1500);
        }
      };

      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { candidate: event.candidate, room: roomId });
        }
      };

      pc.current.oniceconnectionstatechange = () => {
        const state = pc.current.iceConnectionState;
        if(state === "connected" || state === "completed") setStatus("Consultation Live");
        if(state === "failed") setStatus("Reconnecting...");
      };

      socket.on("user-joined", async () => {
        console.log("Peer joined, initiating handshake...");
        setTimeout(async () => {
          if (pc.current.signalingState === "stable") {
            const offer = await pc.current.createOffer();
            await pc.current.setLocalDescription(offer);
            socket.emit("offer", { offer, room: roomId });
          }
        }, 500);
      });

      socket.on("offer", async (data) => {
        if (pc.current.signalingState !== "stable") return;
        await pc.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        socket.emit("answer", { answer, room: roomId });
        while (iceQueue.current.length) {
          await pc.current.addIceCandidate(iceQueue.current.shift()).catch(e => {});
        }
      });

      socket.on("answer", async (data) => {
        if (pc.current.signalingState === "have-local-offer") {
          await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          while (iceQueue.current.length) {
            await pc.current.addIceCandidate(iceQueue.current.shift()).catch(e => {});
          }
        }
      });

      socket.on("ice-candidate", async (data) => {
        const candidate = new RTCIceCandidate(data.candidate);
        if (pc.current.remoteDescription && pc.current.remoteDescription.type) {
          await pc.current.addIceCandidate(candidate).catch(e => {});
        } else {
          iceQueue.current.push(candidate);
        }
      });

      setTimeout(async () => {
        if (pc.current.signalingState === "stable" && !pc.current.remoteDescription) {
           const offer = await pc.current.createOffer();
           await pc.current.setLocalDescription(offer);
           socket.emit("offer", { offer, room: roomId });
        }
      }, 3000);

      socket.on("end-call", () => {
        cleanup();
        navigate(-1);
      });
    };

    startCall();
    return () => cleanup();
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
      <div className="remote-wrapper">
        <video ref={remoteVideoRef} autoPlay playsInline />
        {!remoteVideoRef.current?.srcObject && (
          <div className="connecting-overlay">
            <div className="avatar-placeholder pulsing">LAW</div>
            <h3>Establishing Secure Bridge...</h3>
            <p>{status}</p>
          </div>
        )}
      </div>

      <div className="local-wrapper">
        <video ref={localVideoRef} autoPlay muted playsInline />
        <div className="local-name">Expert View</div>
      </div>

      <div className="call-header">
        <div className="status-badge">{status}</div>
      </div>

      <div className="call-footer">
        <div className="tool-controls glass">
          <button className={`ctrl-btn ${isMuted ? 'off' : ''}`} onClick={toggleMute} title="Toggle Mic">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {isMuted ? (
                <><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/></>
              ) : (
                <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>
              )}
            </svg>
          </button>
          
          <button className={`ctrl-btn ${isCamOff ? 'off' : ''}`} onClick={toggleCam} title="Toggle Camera">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {isCamOff ? (
                <><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"/><line x1="1" y1="1" x2="23" y2="23"/></>
              ) : (
                <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>
              )}
            </svg>
          </button>

          <button className="ctrl-btn hangup" onClick={endCall} title="End Call">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
