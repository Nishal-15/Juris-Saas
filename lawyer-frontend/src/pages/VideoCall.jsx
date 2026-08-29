import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";
import "./videocall.css";

export default function VideoCall() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isJoined, setIsJoined] = useState(false);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const targetUser = location.state?.targetUser;
  const isCaller = location.state?.isCaller;

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const streamRef = useRef(null);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (!targetUser) {
      alert("Invalid Call Session. Redirecting to dashboard.");
      navigate("/dashboard");
    }
    
    const handleSignal = async (data) => {
      if (data.from !== targetUser) return;
      const { payload } = data;
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        if (payload.type === "ready" && isCaller) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-signal", { to: targetUser, payload: { type: "offer", offer } });
        } else if (payload.type === "offer" && !isCaller) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc-signal", { to: targetUser, payload: { type: "answer", answer } });
        } else if (payload.type === "answer" && isCaller) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        } else if (payload.type === "candidate") {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (err) {
        console.error("WebRTC Signaling Error:", err);
      }
    };

    socket.on("webrtc-signal", handleSignal);
    
    socket.on("call-rejected", () => {
      alert("Call was ended by the other person.");
      leaveCall();
    });

    return () => {
      socket.off("webrtc-signal", handleSignal);
      socket.off("call-rejected");
      stopMedia();
    };
  }, [targetUser, isCaller, navigate]);

  useEffect(() => {
    if (targetUser && !isJoined && !isInitializing.current) {
      isInitializing.current = true;
      initCall();
    }
  }, [targetUser, isJoined]);

  const initCall = async () => {
    setIsJoined(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-signal", { to: targetUser, payload: { type: "candidate", candidate: event.candidate } });
        }
      };

      if (!isCaller) {
        socket.emit("webrtc-signal", { to: targetUser, payload: { type: "ready" } });
      }

    } catch (err) {
      console.error("Failed to start media:", err);
      alert("Could not access camera/microphone.");
      leaveCall();
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop(); // Stops the camera light
      });
      streamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const leaveCall = () => {
    socket.emit("call-rejected", { to: targetUser });
    stopMedia();
    setIsJoined(false);
    navigate("/dashboard");
  };

  if (!targetUser) return null;

  return (
    <div className="v2-call-page" style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
      <header className="secure-call-header" style={{ position: 'absolute', top: 0, width: '100%', zIndex: 10, padding: '20px', display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
        <div className="secure-header-left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <svg className="secure-lock-icon" viewBox="0 0 24 24" width="24" height="24" fill="#22c55e" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <div>
            <h1 className="secure-title" style={{ margin: 0, fontSize: '18px', color: '#fff' }}>JurisVault Secure Video</h1>
            <p className="secure-subtitle" style={{ margin: 0, fontSize: '12px', color: '#22c55e', fontWeight: 'bold' }}>END-TO-END ENCRYPTED</p>
          </div>
        </div>
        
        {isJoined && (
          <div className="secure-header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="live-timer" style={{ color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="timer-dot" style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span> LIVE
            </div>
          </div>
        )}
      </header>

      {!isJoined ? (
        <div className="secure-waiting-room" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="waiting-card" style={{ background: '#111', padding: '40px', borderRadius: '16px', textAlign: 'center', color: '#fff', border: '1px solid #333' }}>
            <div className="waiting-avatar" style={{ width: '60px', height: '60px', background: '#c9a84c', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontWeight: 'bold', fontSize: '20px' }}>LAW</div>
            <h3>{isCaller ? 'Calling...' : 'Connecting...'}</h3>
            <p style={{ color: '#888', maxWidth: '300px', margin: '15px auto 30px' }}>Establishing military-grade encrypted peer-to-peer connection.</p>
            
            <div className="waiting-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn-secure-cancel" onClick={leaveCall} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancel Call
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="secure-feed-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* Remote Video (Full Screen) */}
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          
          {/* Local Video (Floating Corner) */}
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ 
              position: 'absolute', 
              top: '80px', 
              right: '20px', 
              width: '160px', 
              height: '220px', 
              objectFit: 'cover', 
              borderRadius: '12px', 
              border: '2px solid #c9a84c',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              transform: 'scaleX(-1)',
              zIndex: 10
            }} 
          />

          {/* Call Controls Overlay */}
          <div className="call-controls" style={{
            position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '20px', background: 'rgba(0,0,0,0.6)', padding: '15px 30px',
            borderRadius: '50px', backdropFilter: 'blur(10px)', zIndex: 100
          }}>
            <button onClick={toggleMute} title={isMuted ? "Unmute Microphone" : "Mute Microphone"} style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', background: isMuted ? '#ef4444' : '#333', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line>{isMuted && <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor"></line>}</svg>
            </button>
            <button onClick={toggleVideo} title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"} style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', background: isVideoOff ? '#ef4444' : '#333', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>{isVideoOff && <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor"></line>}</svg>
            </button>
            <button onClick={leaveCall} title="End Call" style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" y1="1" x2="1" y2="23" stroke="currentColor"></line></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
