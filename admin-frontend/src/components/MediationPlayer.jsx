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
      <style>{`
        @keyframes medPulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(201,168,76,0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(201,168,76,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(201,168,76,0); }
        }
      `}</style>

      <div
        style={{
          maxWidth: "680px",
          width: "100%",
          background: "#0d0f1a",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: "20px",
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10
          }}
        >
          <X size={18} />
        </button>

        {/* HEADER SECTION */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(201,168,76,0.2)",
            position: "relative"
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(201,168,76,0.2)",
              color: "#c9a84c",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "2px 10px",
              borderRadius: "12px",
              marginBottom: "8px"
            }}
          >
            Mediation Act 2023
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.3rem", fontWeight: 700 }}>
            {mediationInfo.mediationAct?.actName || "The Mediation Act, 2023"}
          </div>
          <div style={{ color: "#8b949e", fontSize: "0.75rem", marginTop: "4px" }}>
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

        {/* VIDEO / CONTENT SECTION */}
        <div style={{ padding: "24px", background: "#080a12" }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#c9a84c", fontWeight: 600, fontSize: "0.95rem", marginBottom: "12px" }}>
                <BookOpen size={18} color="#c9a84c" />
                <span>Your Mediation Explanation</span>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: "12px",
                  padding: "20px",
                  fontSize: "0.95rem",
                  color: "rgba(255,255,255,0.85)",
                  maxHeight: "280px",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  direction: isRTL(mediationInfo.lang || "en") ? "rtl" : "ltr",
                  textAlign: isRTL(mediationInfo.lang || "en") ? "right" : "left",
                  fontFamily: isRTL(mediationInfo.lang || "en")
                    ? "'Noto Nastaliq Urdu', serif"
                    : "'Inter', sans-serif",
                  lineHeight: isRTL(mediationInfo.lang || "en") ? 2.2 : 1.8
                }}
              >
                {scriptText}
              </div>
              <div style={{ color: "#8b949e", fontSize: "0.72rem", textAlign: "center", marginTop: "12px" }}>
                AI video unavailable — text explanation shown
              </div>
            </div>
          )}

          {/* BENEFITS STRIP */}
          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "14px 16px",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "1.6rem", marginBottom: "6px" }}>⏱</div>
              <div style={{ fontWeight: 700, color: "#c9a84c", fontSize: "0.9rem" }}>30-90 Days</div>
              <div style={{ color: "#8b949e", fontSize: "0.72rem" }}>vs 3-5 years in court</div>
            </div>

            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "14px 16px",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "1.6rem", marginBottom: "6px" }}>💰</div>
              <div style={{ fontWeight: 700, color: "#c9a84c", fontSize: "0.9rem" }}>Fraction of Cost</div>
              <div style={{ color: "#8b949e", fontSize: "0.72rem" }}>vs lakhs in court fees</div>
            </div>

            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "14px 16px",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "1.6rem", marginBottom: "6px" }}>🔒</div>
              <div style={{ fontWeight: 700, color: "#c9a84c", fontSize: "0.9rem" }}>Private</div>
              <div style={{ color: "#8b949e", fontSize: "0.72rem" }}>Nothing becomes public record</div>
            </div>
          </div>
        </div>

        {/* CTA SECTION */}
        {(videoStatus === "done" || videoStatus === "fallback") && (
          <div
            style={{
              padding: "20px 24px",
              background: "rgba(0,0,0,0.3)",
              borderTop: "1px solid rgba(255,255,255,0.06)"
            }}
          >
            <div style={{ color: "white", fontSize: "0.9rem", fontWeight: 600, marginBottom: "12px" }}>
              How would you like to proceed?
            </div>
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <button
                onClick={onChooseMediator}
                style={{
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  color: "white",
                  padding: "12px 20px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <Scale size={16} />
                <span>Talk to a Mediator</span>
              </button>

              <button
                onClick={onChooseLawyer}
                style={{
                  background: "linear-gradient(135deg, #c9a84c, #e8c96a)",
                  color: "#0f0e09",
                  padding: "12px 20px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <Users size={16} />
                <span>Find a Lawyer</span>
              </button>
            </div>
            <div style={{ color: "#8b949e", fontSize: "0.72rem", textAlign: "center" }}>
              Both options are free to explore. JurisBot will match you to the right professional.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
