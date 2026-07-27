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

  if (!isMobile && !deferredPrompt) return null;

  return (
    <>
      <style>{`
        .pwa-floating-pill {
          position: fixed;
          top: 68px;
          right: 14px;
          z-index: 9999999;
          background: linear-gradient(135deg, #c9a84c 0%, #fcd34d 100%);
          color: #0f111a;
          padding: 10px 18px;
          border-radius: 50px;
          font-weight: 800;
          font-size: 0.88rem;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 8px 25px rgba(201, 168, 76, 0.6), 0 0 15px rgba(0,0,0,0.8);
          border: 1.5px solid #fff;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: pwaPulse 3s infinite;
        }
        .pwa-floating-pill:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 12px 30px rgba(201, 168, 76, 0.8);
        }
        @keyframes pwaPulse {
          0%, 100% { box-shadow: 0 8px 25px rgba(201, 168, 76, 0.5); }
          50% { box-shadow: 0 8px 35px rgba(201, 168, 76, 0.9); }
        }
        @media (min-width: 769px) {
          .pwa-floating-pill { display: none; }
        }
      `}</style>

      <button onClick={handleClick} className="pwa-floating-pill" title="Install JurisBot Citizen App">
        <span style={{ fontSize: "1.1rem" }}>📲</span>
        <span>Install App</span>
      </button>

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
