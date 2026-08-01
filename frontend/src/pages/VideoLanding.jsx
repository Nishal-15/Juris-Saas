import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./video_landing.css";

export default function VideoLanding() {
  const [showUI, setShowUI] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    // Failsafe: if video fails to load or end event doesn't fire, show UI after a set time.
    // The video should play and trigger onEnded naturally.
    const timer = setTimeout(() => setShowUI(true), 15000); // 15s fallback
    return () => clearTimeout(timer);
  }, []);

  const handleVideoEnd = () => {
    setShowUI(true);
  };

  return (
    <div className="vl-container">
      {/* Background Video Layer */}
      <video
        ref={videoRef}
        src="/citizen.mp4"
        autoPlay
        muted
        playsInline
        className="vl-video-bg"
        onEnded={handleVideoEnd}
      />

      {/* Dark Overlay that dims slightly when UI shows */}
      <div className={`vl-overlay ${showUI ? "vl-overlay-active" : ""}`} />

      {/* UI Layer */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            className="vl-ui-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            {/* Top Navbar */}
            <nav className="vl-navbar">
              <div className="vl-nav-logo">
                <img src="/logo.png" alt="JurisBot Logo" className="vl-nav-logo-img" />
                JURIS
                <span className="vl-nav-tagline">The Future of Legal Tech</span>
              </div>
              
              <button className="vl-nav-btn" onClick={() => navigate("/login")}>
                Get Started
              </button>
            </nav>

            {/* Centered CTA */}
            <div className="vl-center-content">
              <button 
                className="vl-start-btn"
                onClick={() => navigate("/login")}
              >
                Start Your Journey
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="vl-arrow">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>

            {/* Watermark Hider */}
            <div className="vl-watermark-hider"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Border Frame (Always visible) */}
      <div className="vl-fullscreen-frame"></div>
    </div>
  );
}
