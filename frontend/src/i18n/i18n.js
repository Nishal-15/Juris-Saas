import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { login:"Member Login", email:"Email", password:"Password", btn:"LOGIN" }},
    ta: { translation: { login:"உறுப்பினர் உள்நுழைவு", email:"மின்னஞ்சல்", password:"கடவுச்சொல்", btn:"உள்நுழை" }},
    hi: { translation: { login:"सदस्य लॉगिन", email:"ईमेल", password:"पासवर्ड", btn:"लॉगिन" }},
    te: { translation: { login:"సభ్యుల లాగిన్", email:"ఇమెయిల్", password:"పాస్వర్డ్", btn:"లాగిన్" }},
    ml: { translation: { login:"അംഗ ലോഗിൻ", email:"ഇമെയിൽ", password:"പാസ്‌വേഡ്", btn:"ലോഗിൻ" }}
  },
  lng: "en",
  interpolation:{escapeValue:false}
});
