import React, { useState, useEffect } from "react";

export default function PwaInstallPill() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);

    const pwaHandler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const openModalHandler = () => handleClickRef.current();
    window.addEventListener("beforeinstallprompt", pwaHandler);
    window.addEventListener("open-pwa-modal", openModalHandler);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("beforeinstallprompt", pwaHandler);
      window.removeEventListener("open-pwa-modal", openModalHandler);
    };
  }, []);

  const handleClickRef = React.useRef();
  const handleClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    } else {
      setShowModal(true);
    }
  };
  handleClickRef.current = handleClick;

  return (
    <>
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999999, padding: "20px" }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#131722", border: "1px solid #c9a84c", borderRadius: "20px", padding: "26px", maxWidth: "420px", width: "100%", color: "#fff", textAlign: "left", boxShadow: "0 20px 50px rgba(0,0,0,0.9)", fontFamily: "'Inter', sans-serif" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, color: "#c9a84c", fontSize: "1.25rem", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>📲 Install Citizen PWA</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: "1.3rem", cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.5, color: "#ccc", marginBottom: "18px" }}>
              Install JurisBot directly to your mobile home screen or tablet for fast, offline legal guidance:
            </p>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "12px", marginBottom: "12px", fontSize: "0.9rem", border: "1px solid rgba(255,255,255,0.1)" }}>
              <strong style={{ color: "#fff", display: "block", marginBottom: "4px" }}>🤖 Android / Chrome:</strong>
              <div style={{ color: "#aaa" }}>Tap browser menu (⋮) at top right → Select <span style={{ color: "#c9a84c", fontWeight: 700 }}>Install app</span> or <span style={{ color: "#c9a84c", fontWeight: 700 }}>Add to Home screen</span>.</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "12px", marginBottom: "22px", fontSize: "0.9rem", border: "1px solid rgba(255,255,255,0.1)" }}>
              <strong style={{ color: "#fff", display: "block", marginBottom: "4px" }}>🍎 iOS / Safari:</strong>
              <div style={{ color: "#aaa" }}>Tap Share button (⎋) at bottom of Safari → Scroll down and tap <span style={{ color: "#c9a84c", fontWeight: 700 }}>Add to Home Screen ➕</span>.</div>
            </div>
            <button 
              onClick={() => setShowModal(false)} 
              style={{ width: "100%", background: "linear-gradient(135deg, #c9a84c 0%, #a6852e 100%)", border: "none", color: "#000", fontWeight: 800, padding: "14px", borderRadius: "12px", cursor: "pointer", fontSize: "1rem" }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
