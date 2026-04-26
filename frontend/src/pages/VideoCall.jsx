import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../api/socket";
import "./videocall.css";

// Use a demo App ID for testing
const AGORA_APP_ID = "9a91fa9f0728438686eb9f2e26fb9b67";

export default function VideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [remoteUser, setRemoteUser] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isJoined, setIsJoined] = useState(false);

  const client = useRef(null);
  const localTracks = useRef([]);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const initAgora = async () => {
    setLoading(true);
    setError(null);

    if (!window.AgoraRTC) {
      const script = document.createElement("script");
      script.src = "https://download.agora.io/sdk/release/AgoraRTC_N-4.18.2.js";
      script.onload = () => initAgora();
      document.body.appendChild(script);
      return;
    }

    try {
      // 1. HARDWARE HANDOFF: Release camera if other tabs were using it
      const hardwarePromise = navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Camera Timeout: Hardware is busy or blocked.")), 10000)
      );

      const stream = await Promise.race([hardwarePromise, timeoutPromise]);
      stream.getTracks().forEach(t => t.stop());
      
      // Small delay to let OS release hardware
      await new Promise(r => setTimeout(r, 800));

      client.current = window.AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      client.current.on("user-published", async (user, mediaType) => {
        await client.current.subscribe(user, mediaType);
        if (mediaType === "video") {
          setRemoteUser(user);
          setTimeout(() => user.videoTrack.play(remoteVideoRef.current), 100);
        }
        if (mediaType === "audio") user.audioTrack.play();
      });

      client.current.on("user-unpublished", () => setRemoteUser(null));

      await client.current.join(AGORA_APP_ID, roomId, null, null);
      
      const [audioTrack, videoTrack] = await window.AgoraRTC.createMicrophoneAndCameraTracks();
      localTracks.current = [audioTrack, videoTrack];
      
      videoTrack.play(localVideoRef.current);
      await client.current.publish(localTracks.current);
      
      setIsJoined(true);
      setLoading(false);
    } catch (err) {
      console.error("Agora Critical Error:", err);
      setError(err.message || "Camera Locked: Please ensure NO other tabs are using the camera and try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    socket.on("end-call", () => leaveCall());
    return () => {
      leaveCall();
      socket.off("end-call");
    };
  }, [roomId]);

  const leaveCall = async () => {
    if (localTracks.current.length > 0) {
      localTracks.current.forEach(track => {
        track.stop();
        track.close();
      });
    }
    if (client.current) {
      await client.current.leave();
    }
    socket.emit("end-call", roomId);
    navigate("/user");
  };

  const toggleMute = async () => {
    await localTracks.current[0].setEnabled(isMuted);
    setIsMuted(!isMuted);
  };

  const toggleCam = async () => {
    await localTracks.current[1].setEnabled(isCamOff);
    setIsCamOff(!isCamOff);
  };

  return (
    <div className="v2-call-page">
      {!isJoined ? (
        <div className="error-overlay">
          <div className="avatar-placeholder pulsing">LAW</div>
          <h3>Ready for Consultation?</h3>
          <p>Please ensure all other browser tabs using your camera are closed.</p>
          <div className="error-actions">
            <button className="btn-retry" onClick={initAgora} disabled={loading}>
              {loading ? "Waking up..." : "Start Video Call"}
            </button>
            <button className="btn-cancel" onClick={() => navigate("/user")}>Not Now</button>
          </div>
          {error && <p className="error-text" style={{color: '#ea4335', marginTop: '15px'}}>{error}</p>}
        </div>
      ) : (
        <>
          <div className="remote-wrapper">
            <div ref={remoteVideoRef} className="remote-video-el" />
            {!remoteUser && (
              <div className="connecting-overlay">
                <div className="avatar-placeholder pulsing">LAW</div>
                <h3>Establishing Secure Bridge...</h3>
                <p>Wait for the expert to join</p>
              </div>
            )}
          </div>

          <div className="local-preview">
            <div ref={localVideoRef} className="local-video-el" />
            <div className="local-label">You</div>
          </div>
        </>
      )}

      <div className="call-controls-wrap">
        <div className="call-controls glass">
          <button className={`control-btn ${isMuted ? 'off' : ''}`} onClick={toggleMute}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
            </svg>
          </button>
          <button className={`control-btn ${isCamOff ? 'off' : ''}`} onClick={toggleCam}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
            </svg>
          </button>
          <button className="control-btn hangup" onClick={leaveCall}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
