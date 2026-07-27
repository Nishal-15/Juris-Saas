import React from "react";

export const ALL_LANGUAGES = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", native: "हिंदी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇮🇳" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "as", name: "Assamese", native: "অসমীয়া", flag: "🇮🇳" },
  { code: "mai", name: "Maithili", native: "मैथिली", flag: "🇮🇳" },
  { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ", flag: "🇮🇳" },
  { code: "kok", name: "Konkani", native: "कोंकणी", flag: "🇮🇳" },
  { code: "sd", name: "Sindhi", native: "سنڌي", flag: "🇮🇳" },
  { code: "doi", name: "Dogri", native: "डोगरी", flag: "🇮🇳" },
  { code: "ks", name: "Kashmiri", native: "کٲشُر", flag: "🇮🇳" },
  { code: "mni", name: "Manipuri", native: "ꯃꯩꯇꯩꯂꯣꯟ", flag: "🇮🇳" },
  { code: "brx", name: "Bodo", native: "बड़ो", flag: "🇮🇳" },
  { code: "ne", name: "Nepali", native: "नेपाली", flag: "🇮🇳" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्", flag: "🇮🇳" }
];

export default function LanguageModal({ isOpen, onClose, selectedLang, onSelect }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(10, 13, 22, 0.88)",
        backdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(145deg, #161b28 0%, #0d111a 100%)",
          border: "1px solid rgba(201, 168, 76, 0.4)",
          borderRadius: "22px",
          width: "100%",
          maxWidth: "460px",
          maxHeight: "82vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 60px rgba(0,0,0,0.8), 0 0 40px rgba(201,168,76,0.15)",
          overflow: "hidden",
          color: "#fff"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(201, 168, 76, 0.05)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.4rem" }}>🌐</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif" }}>
                Select Language / भाषा
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.5px" }}>
                22 SCHEDULED INDIAN LANGUAGES + ENGLISH
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#aaa",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              transition: "all 0.2s"
            }}
          >
            ✕
          </button>
        </div>

        {/* Language List */}
        <div style={{ overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {ALL_LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <div
                key={lang.code}
                onClick={() => {
                  onSelect(lang.code);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  background: isSelected ? "linear-gradient(90deg, rgba(201, 168, 76, 0.22) 0%, rgba(201, 168, 76, 0.08) 100%)" : "rgba(255, 255, 255, 0.03)",
                  border: isSelected ? "1px solid #c9a84c" : "1px solid rgba(255, 255, 255, 0.06)",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.07)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ fontSize: "1.5rem" }}>{lang.flag}</span>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: isSelected ? "#fff" : "#ddd" }}>
                      {lang.native} <span style={{ fontSize: "0.8rem", color: isSelected ? "#c9a84c" : "#888", fontWeight: 500 }}>({lang.name})</span>
                    </div>
                  </div>
                </div>

                {/* Custom Radio Button */}
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: isSelected ? "6px solid #c9a84c" : "2px solid rgba(255, 255, 255, 0.3)",
                    background: isSelected ? "#fff" : "transparent",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected ? "0 0 10px rgba(201, 168, 76, 0.5)" : "none"
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
