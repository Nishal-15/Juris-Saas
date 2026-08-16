import React, { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import { Scale, Users, BookOpen, X } from "lucide-react";
import { getLang, getLangNative, getLangFlag, isRTL } from "../config/languages";

export default function MediationPlayer({
  mediationInfo = {},
  onChooseMediator,
  onChooseLawyer,
  onClose
}) {
  const [videoStatus, setVideoStatus] = useState("loading");
  const [pollCount, setPollCount] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [progress, setProgress] = useState(0);

  const pollIntervalRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const langCode = mediationInfo.lang || "en";
  const langObj = getLang(langCode);
  const langName = langObj.name;

  useEffect(() => {
    if (isRTL(mediationInfo?.lang)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap";
      if (!document.head.querySelector(`link[href="${link.href}"]`)) {
        document.head.appendChild(link);
      }
    }
  }, [mediationInfo?.lang]);

  useEffect(() => {
    const rawUrl = mediationInfo.videoUrl;

    if (rawUrl && rawUrl.startsWith("pending:")) {
      const videoId = rawUrl.replace("pending:", "");
      setVideoStatus("loading");
      setPollCount(0);
      setProgress(5);

      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          return prev + 1.5;
        });
      }, 1000);

      let currentPolls = 0;
      pollIntervalRef.current = setInterval(async () => {
        currentPolls += 1;
        setPollCount(currentPolls);
        try {
          const res = await API.get(`/cases/mediation-video/status/${videoId}`);
          const status = res.data?.status;
          const url = res.data?.videoUrl;
          if (status === "completed" && url) {
            setVideoUrl(url);
            setVideoStatus("ready");
            clearInterval(pollIntervalRef.current);
            clearInterval(progressIntervalRef.current);
          } else if (status === "failed" || currentPolls > 36) {
            setVideoStatus("fallback");
            clearInterval(pollIntervalRef.current);
            clearInterval(progressIntervalRef.current);
          }
        } catch (e) {
          if (currentPolls > 36) {
            setVideoStatus("fallback");
            clearInterval(pollIntervalRef.current);
            clearInterval(progressIntervalRef.current);
          }
        }
      }, 5000);
    } else if (rawUrl && !rawUrl.startsWith("pending:")) {
      setVideoUrl(rawUrl);
      setVideoStatus("ready");
    } else {
      setVideoStatus("fallback");
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [mediationInfo.videoUrl]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const scriptText = mediationInfo.script || mediationInfo.mediationAct?.keyBenefit || "Faster private resolution under The Mediation Act, 2023.";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <div
        className="med-player-glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mediation-title"
        style={{
          maxWidth: "520px",
          width: "95%",
          borderRadius: "20px",
          overflow: "hidden",
          position: "relative",
          animation: "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10
          }}
        >
          <X size={14} />
        </button>

        {/* HEADER SECTION */}
        <div
          style={{
            background: "linear-gradient(180deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0) 100%)",
            padding: "24px 24px 16px",
            position: "relative"
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
              color: "#e8c96a",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "12px",
              marginBottom: "12px",
              letterSpacing: "0.8px",
              textTransform: "uppercase"
            }}
          >
            Mediation Act 2023
          </div>
          <div id="mediation-title" style={{ fontFamily: "'Playfair Display', serif", color: "#ffffff", fontSize: "1.4rem", fontWeight: 600, letterSpacing: "-0.3px", lineHeight: "1.2" }}>
            {mediationInfo.mediationAct?.actName || "The Mediation Act, 2023"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", marginTop: "6px", fontWeight: 400 }}>
            Enforced {mediationInfo.mediationAct?.enforcedDate || "9 October 2023"}
          </div>

          {/* Language indicator */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "60px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.12)"
            }}
          >
            <span style={{ fontSize: "1rem" }}>
              {getLangFlag(mediationInfo.lang || "en")}
            </span>
            <div>
              <div style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "white"
              }}>
                {getLang(mediationInfo.lang || "en").name}
              </div>
              <div style={{
                fontSize: "0.62rem",
                color: "rgba(255,255,255,0.5)",
                direction: isRTL(mediationInfo.lang || "en") ? "rtl" : "ltr"
              }}>
                {getLangNative(mediationInfo.lang || "en")}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT SECTION */}
        <div style={{ padding: "0 24px 24px", background: "transparent" }}>
          {videoStatus === "loading" && (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  border: "3px solid #c9a84c",
                  margin: "0 auto 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "medPulse 2s infinite"
                }}
              >
                <Scale size={36} color="#c9a84c" />
              </div>
              <div style={{ color: "white", fontSize: "1rem", fontWeight: 600, marginBottom: "8px" }}>
                Generating your personalized AI explanation in {getLang(mediationInfo.lang || "en").name} ({getLangNative(mediationInfo.lang || "en")})...
              </div>
              <div style={{ color: "#8b949e", fontSize: "0.8rem", marginBottom: "20px" }}>
                This usually takes 30-60 seconds
              </div>
              {/* Progress bar */}
              <div
                style={{
                  width: "100%",
                  maxWidth: "320px",
                  background: "rgba(255,255,255,0.1)",
                  height: "6px",
                  borderRadius: "3px",
                  margin: "0 auto 20px",
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: "#c9a84c",
                    width: `${progress}%`,
                    transition: "width 1s linear"
                  }}
                />
              </div>
              <span
                onClick={() => setVideoStatus("fallback")}
                style={{ color: "#c9a84c", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}
              >
                Your text explanation is ready while you wait →
              </span>
            </div>
          )}

          {videoStatus === "ready" && (
            <div>
              <video
                src={videoUrl}
                controls
                autoPlay
                style={{ width: "100%", borderRadius: "12px", background: "black", maxHeight: "360px" }}
                onEnded={() => setVideoStatus("done")}
              />
              <div style={{ color: "#8b949e", fontSize: "0.75rem", textAlign: "center", marginTop: "12px" }}>
                {langName} · Personalized for your case
              </div>
            </div>
          )}

          {videoStatus === "done" && (
            <div style={{ padding: "30px 0", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
              <div style={{ color: "white", fontSize: "1.1rem", fontWeight: 600 }}>
                You've watched the explanation
              </div>
            </div>
          )}

          {videoStatus === "fallback" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(201,168,76,0.9)", fontWeight: 500, fontSize: "0.8rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <BookOpen size={14} color="rgba(201,168,76,0.9)" />
                <span>Mediation Explanation</span>
              </div>
              <div
                className="custom-scrollbar"
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "12px",
                  padding: "16px",
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.75)",
                  maxHeight: "180px",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  direction: isRTL(mediationInfo.lang || "en") ? "rtl" : "ltr",
                  textAlign: isRTL(mediationInfo.lang || "en") ? "right" : "left",
                  fontFamily: isRTL(mediationInfo.lang || "en")
                    ? "'Noto Nastaliq Urdu', serif"
                    : "'Inter', sans-serif",
                  lineHeight: isRTL(mediationInfo.lang || "en") ? 2.0 : 1.6
                }}
              >
                {scriptText}
              </div>
            </div>
          )}

          {/* BENEFITS STRIP - COMPACT */}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: "8px",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
              }}
            >
              <div style={{ fontWeight: 600, color: "#e8c96a", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <span>⏱</span> 30-90 Days
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", marginTop: "2px" }}>vs 3-5 years</div>
            </div>

            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: "8px",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
              }}
            >
              <div style={{ fontWeight: 600, color: "#e8c96a", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <span>💰</span> Fraction of Cost
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", marginTop: "2px" }}>vs court fees</div>
            </div>

            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: "8px",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
              }}
            >
              <div style={{ fontWeight: 600, color: "#e8c96a", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <span>🔒</span> Private
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", marginTop: "2px" }}>Confidential</div>
            </div>
          </div>
        </div>

        {/* CTA SECTION */}
        {(videoStatus === "done" || videoStatus === "fallback") && (
          <div
            style={{
              padding: "20px 24px",
              background: "rgba(0,0,0,0.4)",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", fontWeight: 500, textAlign: "center" }}>
              How would you like to proceed?
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="med-btn-hover"
                onClick={onChooseMediator}
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)"
                }}
              >
                <Scale size={16} />
                <span>Talk to a Mediator</span>
              </button>

              <button
                className="med-btn-hover"
                onClick={onChooseLawyer}
                style={{
                  background: "linear-gradient(135deg, #d4af37 0%, #aa8c2c 100%)",
                  color: "#0a0a0a",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(212, 175, 55, 0.2)"
                }}
              >
                <Users size={16} />
                <span>Find a Lawyer</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
