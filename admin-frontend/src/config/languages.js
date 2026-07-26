export const SUPPORTED_LANGUAGES = [
  {
    code:   "en",
    name:   "English",
    native: "English",
    script: "Latin",
    flag:   "🇬🇧",
    region: "Pan India"
  },
  {
    code:   "hi",
    name:   "Hindi",
    native: "हिन्दी",
    script: "Devanagari",
    flag:   "🇮🇳",
    region: "North India"
  },
  {
    code:   "bn",
    name:   "Bengali",
    native: "বাংলা",
    script: "Bengali",
    flag:   "🇮🇳",
    region: "West Bengal, Assam"
  },
  {
    code:   "te",
    name:   "Telugu",
    native: "తెలుగు",
    script: "Telugu",
    flag:   "🇮🇳",
    region: "Andhra Pradesh, Telangana"
  },
  {
    code:   "mr",
    name:   "Marathi",
    native: "मराठी",
    script: "Devanagari",
    flag:   "🇮🇳",
    region: "Maharashtra"
  },
  {
    code:   "ta",
    name:   "Tamil",
    native: "தமிழ்",
    script: "Tamil",
    flag:   "🇮🇳",
    region: "Tamil Nadu"
  },
  {
    code:   "gu",
    name:   "Gujarati",
    native: "ગુજરાતી",
    script: "Gujarati",
    flag:   "🇮🇳",
    region: "Gujarat"
  },
  {
    code:   "kn",
    name:   "Kannada",
    native: "ಕನ್ನಡ",
    script: "Kannada",
    flag:   "🇮🇳",
    region: "Karnataka"
  },
  {
    code:   "ml",
    name:   "Malayalam",
    native: "മലയാളം",
    script: "Malayalam",
    flag:   "🇮🇳",
    region: "Kerala"
  },
  {
    code:   "or",
    name:   "Odia",
    native: "ଓଡ଼ିଆ",
    script: "Odia",
    flag:   "🇮🇳",
    region: "Odisha"
  },
  {
    code:   "pa",
    name:   "Punjabi",
    native: "ਪੰਜਾਬੀ",
    script: "Gurmukhi",
    flag:   "🇮🇳",
    region: "Punjab"
  },
  {
    code:   "as",
    name:   "Assamese",
    native: "অসমীয়া",
    script: "Assamese",
    flag:   "🇮🇳",
    region: "Assam"
  },
  {
    code:   "ur",
    name:   "Urdu",
    native: "اردو",
    script: "Nastaliq",
    flag:   "🇮🇳",
    region: "UP, J&K, Telangana"
  },
  {
    code:   "mai",
    name:   "Maithili",
    native: "मैथिली",
    script: "Devanagari",
    flag:   "🇮🇳",
    region: "Bihar, Jharkhand"
  },
  {
    code:   "sat",
    name:   "Santali",
    native: "ᱥᱟᱱᱛᱟᱲᱤ",
    script: "Ol Chiki",
    flag:   "🇮🇳",
    region: "Jharkhand, WB, Odisha"
  },
  {
    code:   "kok",
    name:   "Konkani",
    native: "कोंकणी",
    script: "Devanagari",
    flag:   "🇮🇳",
    region: "Goa, Coastal Karnataka"
  },
  {
    code:   "sd",
    name:   "Sindhi",
    native: "سنڌي",
    script: "Perso-Arabic",
    flag:   "🇮🇳",
    region: "Sindhi diaspora"
  },
  {
    code:   "doi",
    name:   "Dogri",
    native: "डोगरी",
    script: "Devanagari",
    flag:   "🇮🇳",
    region: "Jammu"
  },
  {
    code:   "ks",
    name:   "Kashmiri",
    native: "کٲشُر",
    script: "Perso-Arabic",
    flag:   "🇮🇳",
    region: "Kashmir"
  },
  {
    code:   "mni",
    name:   "Manipuri",
    native: "মৈতৈলোন্",
    script: "Meitei",
    flag:   "🇮🇳",
    region: "Manipur"
  },
  {
    code:   "brx",
    name:   "Bodo",
    native: "बर'/बड़",
    script: "Devanagari",
    flag:   "🇮🇳",
    region: "Assam, Arunachal"
  },
  {
    code:   "ne",
    name:   "Nepali",
    native: "नेपाली",
    script: "Devanagari",
    flag:   "🇮🇳",
    region: "Sikkim, WB Hills"
  },
  {
    code:   "sa",
    name:   "Sanskrit",
    native: "संस्कृतम्",
    script: "Devanagari",
    flag:   "🇮🇳",
    region: "Constitutional"
  }
];

export const LANG_MAP = Object.fromEntries(
  SUPPORTED_LANGUAGES.map(l => [l.code, l])
);

export const getLang = (code) =>
  LANG_MAP[code] || LANG_MAP["en"];

export const getLangName = (code) =>
  getLang(code).name;

export const getLangNative = (code) =>
  getLang(code).native;

export const getLangFlag = (code) =>
  getLang(code).flag;

export const RTL_LANGUAGES = [
  "ur", "ks", "sd"
];

export const isRTL = (code) =>
  RTL_LANGUAGES.includes(code);
