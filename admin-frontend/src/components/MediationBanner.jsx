import React from "react";

export default function MediationBanner({
  mediationInfo = {},
  onLearnMore,
  onDismiss
}) {
  const lang = mediationInfo.lang || "en";
  const langName = mediationInfo.langName || "English";

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.06))",
        border: "1px solid rgba(201,168,76,0.3)",
        borderLeft: "4px solid #c9a84c",
        borderRadius: "12px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        position: "relative",
        animation: "fadeInUp 0.4s ease"
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Left Icon */}
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "rgba(201,168,76,0.15)",
          border: "2px solid rgba(201,168,76,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.6rem",
          flexShrink: 0
        }}
      >
        ⚖️
      </div>

      {/* Middle Content */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#c9a84c" }}>
          Your case may qualify for Mediation
        </div>
        <div style={{ color: "#8b949e", fontSize: "0.8rem", marginTop: "4px" }}>
          Under the Mediation Act 2023 — faster, cheaper, and private resolution without going to court.
        </div>
        {lang !== "en" && (
          <div
            style={{
              background: "rgba(16,185,129,0.1)",
              color: "#10b981",
              fontSize: "0.72rem",
              padding: "2px 8px",
              borderRadius: "12px",
              marginTop: "6px",
              display: "inline-block",
              fontWeight: 600
            }}
          >
            Explanation available in {langName}
          </div>
        )}
      </div>

      {/* Right Side */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <button
          onClick={onLearnMore}
          style={{
            background: "linear-gradient(135deg, #c9a84c, #e8c96a)",
            color: "#0f0e09",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.82rem",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          Watch Explanation
        </button>

        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              cursor: "pointer",
              fontSize: "1rem",
              position: "absolute",
              top: "10px",
              right: "10px",
              padding: "4px"
            }}
            title="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
