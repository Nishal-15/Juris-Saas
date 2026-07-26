import React from "react";
import { SUPPORTED_LANGUAGES, getLang, isRTL } from "../config/languages";

export default function LanguageSelector({
  value,
  onChange,
  compact = false,
  showNative = false,
  label,
  style = {}
}) {
  return (
    <div>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "6px"
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: compact ? "8px 32px 8px 10px" : "11px 36px 11px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1.5px solid var(--border-dark)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            fontFamily: "'Inter', sans-serif",
            fontSize: compact ? "0.8rem" : "0.875rem",
            outline: "none",
            cursor: "pointer",
            appearance: "none",
            transition: "var(--transition)",
            ...style
          }}
          onFocus={e => (e.target.style.borderColor = "var(--gold)")}
          onBlur={e => (e.target.style.borderColor = "var(--border-dark)")}
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <option
              key={lang.code}
              value={lang.code}
              dir={isRTL(lang.code) ? "rtl" : "ltr"}
            >
              {lang.flag} {lang.name}
              {showNative && lang.native !== lang.name
                ? ` — ${lang.native}`
                : ""}
            </option>
          ))}
        </select>

        <div
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--text-muted)",
            fontSize: "0.7rem"
          }}
        >
          ▼
        </div>
      </div>
    </div>
  );
}

export function LanguageBadge({ code, size = "sm" }) {
  const lang = getLang(code);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: size === "sm" ? "2px 8px" : "4px 12px",
        borderRadius: "12px",
        background: "rgba(201,168,76,0.08)",
        border: "1px solid rgba(201,168,76,0.2)",
        fontSize: size === "sm" ? "0.68rem" : "0.8rem",
        fontWeight: 600,
        color: "var(--gold)",
        whiteSpace: "nowrap"
      }}
    >
      {lang.flag} {lang.name}
    </span>
  );
}
