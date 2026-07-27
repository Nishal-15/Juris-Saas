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
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
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
          background: "#202124",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "400px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
          overflowY: "auto",
          color: "#fff"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {ALL_LANGUAGES.map((lang, idx) => {
          const isSelected = selectedLang === lang.code;
          const isFirst = idx === 0;
          const isLast = idx === ALL_LANGUAGES.length - 1;

          // Format text like Image 2: "English (🇬🇧)" or "हिंदी (Hindi) 🇮🇳"
          const displayText = lang.code === "en" 
            ? `English (${lang.flag})` 
            : `${lang.native} (${lang.name}) ${lang.flag}`;

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
                padding: "16px 20px",
                borderBottom: isLast ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                borderTopLeftRadius: isFirst ? "24px" : "0",
                borderTopRightRadius: isFirst ? "24px" : "0",
                borderBottomLeftRadius: isLast ? "24px" : "0",
                borderBottomRightRadius: isLast ? "24px" : "0",
                background: isSelected ? "rgba(138, 180, 248, 0.08)" : "transparent",
                cursor: "pointer",
                transition: "background 0.15s ease"
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <div style={{ fontSize: "1.1rem", color: "#e8eaed", fontWeight: isSelected ? 600 : 400 }}>
                {displayText}
              </div>

              {/* Native Android / Google Style Radio Button */}
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  border: isSelected ? "2px solid #8ab4f8" : "2px solid #8e918f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s ease"
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "#8ab4f8"
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
