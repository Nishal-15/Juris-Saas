import { useState, useEffect } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import MaterialDatePicker from "../components/chat/MaterialDatePicker";
import LanguageModal, { ALL_LANGUAGES } from "../components/common/LanguageModal";
import "./createcase.css";

// 🌍 22 Scheduled Languages of India
const INDIAN_LANGUAGES = [
  { code: "en-IN", name: "English", flag: "🇮🇳" },
  { code: "ta-IN", name: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { code: "hi-IN", name: "Hindi (हिन्दी)", flag: "🇮🇳" },
  { code: "te-IN", name: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { code: "kn-IN", name: "Kannada (ಕನ್ನಡ)", flag: "🇮🇳" },
  { code: "ml-IN", name: "Malayalam (മലയാളം)", flag: "🇮🇳" },
  { code: "mr-IN", name: "Marathi (मराठी)", flag: "🇮🇳" },
  { code: "gu-IN", name: "Gujarati (ગુજરાતી)", flag: "🇮🇳" },
  { code: "bn-IN", name: "Bengali (বাংলা)", flag: "🇮🇳" },
  { code: "pa-IN", name: "Punjabi (ਪੰਜਾਬੀ)", flag: "🇮🇳" },
  { code: "or-IN", name: "Odia (ଓଡ଼ିଆ)", flag: "🇮🇳" },
  { code: "as-IN", name: "Assamese (অসমীয়া)", flag: "🇮🇳" },
  { code: "mai-IN", name: "Maithili (मैथिली)", flag: "🇮🇳" },
  { code: "doi-IN", name: "Dogri (डोगरी)", flag: "🇮🇳" },
  { code: "ks-IN", name: "Kashmiri (کٲشُر)", flag: "🇮🇳" },
  { code: "kok-IN", name: "Konkani (कोंकणी)", flag: "🇮🇳" },
  { code: "mni-IN", name: "Manipuri (মণিপুরী)", flag: "🇮🇳" },
  { code: "ne-IN", name: "Nepali (नेपाली)", flag: "🇮🇳" },
  { code: "sa-IN", name: "Sanskrit (संस्कृतम्)", flag: "🇮🇳" },
  { code: "sat-IN", name: "Santali (संताली)", flag: "🇮🇳" },
  { code: "sd-IN", name: "Sindhi (सिंधी)", flag: "🇮🇳" },
  { code: "ur-IN", name: "Urdu (اردو)", flag: "🇮🇳" }
];

export default function FilingConsole() {
  const [step, setStep] = useState(1);
  const [selectedLang, setSelectedLang] = useState(INDIAN_LANGUAGES[0]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    legalType: "Civil Law",
    incidentDate: "",
    oppositeParty: "",
    urgency: "Normal",
    sections: [],
    court: "",
    draft: "",
    mediationRequested: false
  });
  const [aiMessage, setAiMessage] = useState("Ready to help. I can assist you with your legal case filing!");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [matchedLawyers, setMatchedLawyers] = useState([]);
  const [currentCaseId, setCurrentCaseId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mediationData, setMediationData] = useState(null);
  const [showMediationInterception, setShowMediationInterception] = useState(false);
  const [interceptionData, setInterceptionData] = useState(null);
  const [avatarLang, setAvatarLang] = useState("en");
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [speechSynthesisActive, setSpeechSynthesisActive] = useState(false);
  const [activeCaption, setActiveCaption] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState([]); // ✅ Evidence file state
  const navigate = useNavigate();

  const avatarScripts = {
    en: { name: "English", flag: "🇬🇧", voiceLang: "en-IN", script: "Hello. I'm JurisVault, your AI Legal Assistant. Thank you for explaining your situation. Based on what you've shared, I have a preliminary understanding of your legal issue. At this stage, it appears that mediation or arbitration could be a suitable option, provided the necessary legal requirements are met. This process resolves disputes through an independent expert instead of a regular court trial, saving time, reducing costs, and keeping proceedings confidential. Before making a detailed assessment, we ask a few questions to better understand the facts and provide accurate guidance." },
    hi: { name: "Hindi (हिन्दी)", flag: "🇮🇳", voiceLang: "hi-IN", script: "नमस्ते। मैं ज्यूरिसवॉल्ट, आपका AI कानूनी सहायक हूँ। अपनी स्थिति समझाने के लिए धन्यवाद। आपके द्वारा साझा की गई जानकारी के आधार पर, मुझे आपकी कानूनी समस्या की प्रारंभिक समझ हो गई है। इस स्तर पर, ऐसा प्रतीत होता है कि मध्यस्थता या आर्बिट्रेशन एक उपयुक्त विकल्प हो सकता है, बशर्ते आवश्यक कानूनी शर्तें पूरी हों। यह प्रक्रिया एक नियमित अदालती मुकदमे के बजाय एक स्वतंत्र विशेषज्ञ द्वारा विवादों को सुलझाती है, जिससे समय और पैसे की बचत होती है और कार्यवाही गोपनीय रहती है। अधिक विस्तृत मूल्यांकन करने से पहले, हम तथ्यों को बेहतर ढंग से समझने के लिए कुछ प्रश्न पूछना चाहेंगे।" },
    bn: { 
      name: "Bengali (বাংলা)", flag: "🇮🇳", voiceLang: "bn-IN", 
      script: "নমস্কার। আমি জুরিসভল্ট, আপনার AI আইনি সহকারী। আপনার পরিস্থিতি ব্যাখ্যা করার জন্য ধন্যবাদ। আপনার শেয়ার করা তথ্যের ভিত্তিতে, আপনার আইনি সমস্যা সম্পর্কে আমার একটি প্রাথমিক ধারণা হয়েছে। এই পর্যায়ে মনে হচ্ছে, প্রয়োজনীয় আইনি শর্ত পূরণ হলে মধ্যস্থতা বা সালিশি একটি উপযুক্ত বিকল্প হতে পারে। এটি নিয়মিত আদালত বিচারের পরিবর্তে একজন স্বাধীন বিশেষজ্ঞের মাধ্যমে বিরোধ নিষ্পত্তি করে, যা সময় ও খরচ বাঁচায় এবং গোপনীয়তা বজায় রাখে।",
      audioFallback: "नोमोश्कार। आमि जुरिसव्हॉल्ट, आपनार एआई आइनी शोहोकारी। आपनार पोरिस्थिति ब्याक्खा कोरार जोन्यो धोन्नोबाद। आपनार शेयर कोरा तोथ्येर भित्तिते, आपनार आइनी शोमोस्सा शोम्पोर्के आमार एकटि प्राथोमिक धारोना होयेछे। एइ पोर्जाए मोने होच्छे, प्रोयोजोनियो आइनी शोर्तो पूरोन होले मोद्धोस्तोता बा शालिशी एकटि उपोजुक्तो बिकोल्पो होते पारे। एटि नियोगितो आदालत बिचारेर पोरीबोर्ते एकजोन शाधीन बिशेषोग्गेर माद्धोमे बिरोध निष्पोत्ति करे, जा शोमोय ओ खोरोच बाँचाय एबं गोपोनीयोता बोयाय राखे।"
    },
    te: { 
      name: "Telugu (తెలుగు)", flag: "🇮🇳", voiceLang: "te-IN", 
      script: "నమస్కారం. నేను జ్యూరిస్వాల్ట్, మీ AI న్యాయ సహాయకుడిని. మీ పరిస్థితిని వివరించినందుకు ధన్యవాదాలు. మీరు పంచుకున్న సమాచారం ఆధారంగా, మీ చట్టపరమైన సమస్యపై నాకు ప్రాథమిక అవగాహన వచ్చింది. ఈ దశలో, అవసరమైన చట్టపరమైన షరతులు నెరవేరితే, మధ్యవర్తిత్వం లేదా ఆర్బిట్రేషన్ తగిన ఎంపికగా అనిపిస్తోంది. ఇది సాధారణ కోర్టు విచారణకు బదులుగా స్వతంత్ర నిపుణుడి ద్వారా వివాదాలను పరిష్కరిస్తుంది, సమయం మరియు ఖర్చులను తగ్గిస్తుంది మరియు రహస్యంగా ఉంచుతుంది.",
      audioFallback: "नमस्कारीम। नेनु जुरिसव्हॉल्ट, मी एआई न्याय सहायकुडिनी। मी परिस्थीतिनी विवरींचिनंदुकु धन्यवादाल्लु। मीरु पंचुकुन्न समाचारीम आधारंगा, मी चट्टपरमैन समस्यपै नाकु प्राथमीक अवगाहन वच्चिंदी। ई दशलो, अवसरमैन चट्टपरमैन शरतुलु नेरवेरिते, मध्यवर्तीत्वं लेदा आर्बिट्रेशन तगिन एम्पिकगा अनिपीस्तोंदी। इदि साधारण कोर्टु विचारणकु बदुलुगा स्वतंत्र निपुणुडी द्वारा विवादालनु परिष्करिस्तोंदी, समयं मरियु खर्चुलनु तग्गिस्तोंदी मरियु रहस्यंगा उंचुतुंदी।"
    },
    mr: { name: "Marathi (मराठी)", flag: "🇮🇳", voiceLang: "mr-IN", script: "नमस्कार. मी ज्युरिसवॉल्ट, तुमचा AI कायदेशीर सहाय्यक आहे. तुमची परिस्थिती स्पष्ट केल्याबद्दल धन्यवाद. तुम्ही सामायिक केलेल्या माहितीच्या आधारे, मला तुमच्या कायदेशीर समस्येची प्राथमिक समज मिळाली आहे. या टप्प्यावर, असे दिसते की आवश्यक कायदेशीर अटी पूर्ण झाल्यास मध्यस्थी किंवा लवाद हा एक योग्य पर्याय असू शकतो. ही प्रक्रिया नियमित न्यायालयीन खटल्याऐवजी स्वतंत्र तज्ज्ञांद्वारे विवाद सोडवते, ज्यामुळे वेळ आणि खर्चाची बचत होते आणि कार्यवाही गोपनीय राहते." },
    ta: { 
      name: "Tamil (தமிழ்)", flag: "🇮🇳", voiceLang: "ta-IN", 
      script: "வணக்கம். நான் ஜூரிஸ்வால்ட், உங்கள் AI சட்ட உதவி. உங்கள் நிலைமையை விளக்கியதற்கு நன்றி. நீங்கள் பகிர்ந்து கொண்ட தகவலின் அடிப்படையில், உங்கள் சட்டப் பிரச்சனை குறித்து எனக்கு ஒரு தொடக்கப் புரிதல் ஏற்பட்டுள்ளது. இந்த நிலையில், தேவையான சட்ட நிபந்தனைகள் பூர்த்தி செய்யப்பட்டால், சமரசம் அல்லது நடுவர் மன்றம் ஒரு தகுந்த தேர்வாக இருக்கும் என்று தோன்றுகிறது. இது வழக்கமான நீதிமன்ற விசாரணைக்கு பதிலாக ஒரு சுதந்திரமான நிபுணர் மூலம் பிரச்சினைகளைத் தீர்க்கிறது, நேரம் மற்றும் செலவுகளைக் குறைக்கிறது மற்றும் ரகசியத்தைக் காக்கிறது.",
      audioFallback: "वणक्कम। नान जुरिसव्हॉल्ट, उंगल एआई सट्ट उदयवि। उंगल निलयिमैयै विलक्कियदरकु नन्री। नींगल पगिरंदु कोंड तगवलिन अदीपडयिल, उंगल सट्ट प्रच्चनै कुरित्तु एनक्कु ओरु तोडक्क पुरिदल एरपट्टुल्लदु। इंद निलयिल, तेवयैना सट्ट निबंदैनैगल पूर्ती सेय्यप्पट्टाल, समरसम अल्लदु नडुवर मन्रम ओरु तगुंद तेर्वाग इरुक्कुम एन्रु तोंरुगिर्दु। इदु वळक्कमाना नीदिमन्र विचारणैक्कु बदिलाग ओरु सुदंदिरमाना निपुणर मूलम प्रच्चनैगलै तीर्किर्दु, नेरम मर्रुम सेलवुगलै कुरैक्किर्दु मर्रुम रगासियत्तै काक्किर्दु।"
    },
    ur: { 
      name: "Urdu (اردو)", flag: "🇮🇳", voiceLang: "ur-IN", 
      script: "آداب۔ میں جیورس والٹ ہوں، آپ کا AI قانونی معاون۔ اپنی صورتحال کی وضاحت کرنے کے لیے آپ کا شکریہ۔ آپ کی فراہم کردہ معلومات کی بنیاد پر، مجھے آپ کے قانونی مسئلے کی ابتدائی سمجھ آ گئی ہے۔ اس مرحلے پر، ایسا لگتا ہے کہ ثالثی یا آرکیٹریشن ایک مناسب آپشن ہو سکتا ہے، بشرطیکہ ضروری قانونی تقاضے پورے ہوں۔ یہ عمل باقاعدہ عدالتی کارروائی کے بجائے ایک آزاد ماہر کے ذریعے تنازعات کو حل کرتا ہے، جس سے وقت اور اخراجات کی بچت ہوتی ہے اور کارروائی خفیہ رہتی ہے۔",
      audioFallback: "आदाब। मैं जुरिसव्हॉल्ट हूँ, आपका एआई कानूनी मावुन। अपनी सूरत-ए-हाल की वज़ाहत करने के लिए आपका शुक्रिया। आपकी फराहम करदा मालूमात की बुनियाद पर, मुझे आपके कानूनी मसले की इब्तिदाई समझ आ गई है। इस मरहले पर, ऐसा लगता है कि सालिसी या आर्बिट्रेशन एक मुनासिब ऑप्शन हो सकता है, बशर्ते जरूरी कानूनी तकाजे पूरे हों। यह अमल बाकायदा अदालती कार्रवाई के बजाय एक आजाद माहिर के जरिए तनाजात को हल करता है, जिससे वक्त और अखराजात की बचत होती है और कार्रवाई खुफिया रहती है।"
    },
    gu: { 
      name: "Gujarati (ગુજરાતી)", flag: "🇮🇳", voiceLang: "gu-IN", 
      script: "નમસ્તે. હું જ્યુરિસવોલ્ટ છું, તમારો AI કાનૂની સહાયક. તમારી પરિસ્થિતિ સમજાવવા બદલ આભાર. તમે શેર કરેલી માહિતીના આધારે, મને તમારી કાનૂની સમસ્યાની પ્રાથમિક સમજ મળી છે. આ તબક્કે, એવું લાગે છે કે જો જરૂરી કાનૂની શરતો પૂરી થાય તો મધ્યસ્થી અથવા આર્બિટ્રેશન એક યોગ્ય વિકલ્પ હોઈ શકે છે. આ પ્રક્રિયા નિયમિત અદાલતી સુનાવણીના બદલે સ્વતંત્ર નિષ્ણાત દ્વારા વિવાદોને ઉકેલે છે, જેનાથી સમય અને ખર્ચની બચત થાય છે અને કાર્યવાહી ગોપનીય રહે છે.",
      audioFallback: "नमस्ते। हूँ जुरिसव्हॉल्ट छू, तमारो एआई कानूनी सहायक। तमारी परिस्थिति समझाव्वा बदल आभार। तमे शेयर करेली माहितीना आधारे, मने तमारी कानूनी समस्यानी प्राथमिक समझ मळी छे। आ तबक्के, एवु लागे छे के जो जरूरी कानूनी शरतो पूरी थाय तो मध्यस्थी अथवा आर्बिट्रेशन एक योग्य विकल्प होई शके छे। आ प्रक्रिया नियमित अदालती सुनावणीना बदले स्वतंत्र निष्णांत द्वारा विवादोने उकेले छे, जेनाथी समय अने खर्चनी बचत थाय छे अने कारवाही गोपनीय रहे छे।"
    },
    kn: { 
      name: "Kannada (ಕನ್ನಡ)", flag: "🇮🇳", voiceLang: "kn-IN", 
      script: "ನಮಸ್ಕಾರ. ನಾನು ಜ್ಯುರಿಸ್ವಾಲ್ಟ್, ನಿಮ್ಮ AI ಕಾನೂನು ಸಹಾಯಕ. ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಯನ್ನು ವಿವರಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನೀವು ಹಂಚಿಕೊಂಡ ಮಾಹಿತಿಯ ಆಧಾರದ ಮೇಲೆ, ನಿಮ್ಮ ಕಾನೂನು ಸಮಸ್ಯೆಯ ಪ್ರಾಥಮಿಕ ತಿಳುವಳಿಕೆ ನನಗೆ ಸಿಕ್ಕಿದೆ. ಈ ಹಂತದಲ್ಲಿ, ಅಗತ್ಯ ಕಾನೂನು ಷರತ್ತುಗಳನ್ನು ಪೂರೈಸಿದರೆ ಮಧ್ಯಸ್ಥಿಕೆ ಅಥವಾ ಆರ್ಬಿಟ್ರೇಷನ್ ಸೂಕ್ತ ಆಯ್ಕೆಯಾಗಿರಬಹುದು ಎಂದು ತೋರುತ್ತದೆ. ಇದು ಸಾಮಾನ್ಯ ನ್ಯಾಯಾಲಯದ ವಿಚಾರಣೆಯ ಬದಲಿಗೆ ಸ್ವತಂತ್ರ ತಜ್ಞರ ಮೂಲಕ ವಿವಾದಗಳನ್ನು ಪರಿಹರಿಸುತ್ತದೆ, ಸಮಯ ಮತ್ತು ವೆಚ್ಚವನ್ನು ಉಳಿಸುತ್ತದೆ ಮತ್ತು ಗೌಪ್ಯತೆಯನ್ನು ಕಾಪಾಡುತ್ತದೆ.",
      audioFallback: "नमस्कार। नानु जुरिसव्हॉल्ट, निम्म एआई कानूनु सहायक। निम्म परिस्थितियनु विवरीसिद्दक्कागी धन्यवादगलु। नीवु हंचिकोंड माहितिय आधारेद मेले, निम्म कानूनु समस्येय प्राथमिक तिलुवलिके ननगे सिक्किदे। ई हंतदल्ली, अगत्त्य कानूनु षरत्तुगलनु पूरेसिदरे मध्यस्थिके अथवा आर्बिट्रेशन सूक्त ಆಯ್ಕೆಯಾಗಿರಬಹುದು एंदु तोरुत्तदे। इदु सामान्य न्यायालयद विचारणेय बदलेंगे स्वतंत्र तज्झर मूलक विवादगलनु परिहरीसुत्तदे, समय मत्तु वेच्चवनु उलिसुत्तदे मत्तु गौप्यतेयनु कापाडुत्तदे।"
    },
    ml: { 
      name: "Malayalam (മലയാളം)", flag: "🇮🇳", voiceLang: "ml-IN", 
      script: "നമസ്കാരം. ഞാൻ ജുറിസ്വാൾട്ട്, നിങ്ങളുടെ AI നിയമ സഹായകൻ. നിങ്ങളുടെ സാഹചര്യം വിശദീകരിച്ചതിന് നന്ദി. നിങ്ങൾ പങ്കിട്ട വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ, നിങ്ങളുടെ നിയമപരമായ പ്രശ്നത്തെക്കുറിച്ച് എനിക്ക് പ്രാഥമിക ധാരണ ലഭിച്ചു. ഈ ഘട്ടത്തിൽ, ആവശ്യമായ നിയമപരമായ നിബന്ധനകൾ പാലിക്കുകയാണെങ്കിൽ മധ്യസ്ഥത അല്ലെങ്കിൽ ആർബിട്രേഷൻ ഒരു അനുയോജ്യമായ ഓപ്ഷനായിരിക്കാം എന്ന് തോന്നുന്നു. ഇത് സാധാരണ കോടതി വിചാരണയ്ക്ക് പകരം സ്വതന്ത്ര വിദഗ്ദ്ധൻ വഴി തർക്കങ്ങൾ പരിഹരിക്കുന്നു, സമയവും ചെലവും ലാഭിക്കുകയും രഹസ്യാത്മകത സൂക്ഷിക്കുകയും ചെയ്യുന്നു.",
      audioFallback: "नमस्कारम। ज्ञान जुरिसव्हॉल्ट, निंगलुडे एआई नियम सहायकन। निंगलुडे साहाचर्यम विशादीकरीच्चातिनु नंदी। निंगल पंगुवेच्चा विवरंगलुडे अदीस्थानाथिल, निंगलुडे नियमपरमाय प्रश्नत्तेक्कुरिच्चु एनिक्कु प्राथमीका धारणा लभीच्चु। ई घट्टाथिल, आवश्यमाय नियमपरमाय निबन्धनगल पालिकुगायाणेंगिल मध्यस्थता अल्लेंगिल आर्बिट्रेशन ओरु अनुयोज्यमाय ऑप्शन आयिरिक्काम एनु तोन्नुनु। इतु साधारण कोर्ट विचारणयक्कु पकरम स्वतंत्र विदग्धन् वली तर्कांगल परिहरिकुनु, समयवुम चेलवुम लाभिकुगायुम रहस्यात्मकता सूक्ष्मिकुगायुम चेय्युनु।"
    },
    or: { 
      name: "Odia (ଓଡ଼ିଆ)", flag: "🇮🇳", voiceLang: "or-IN", 
      script: "ନମସ୍କାର। ମୁଁ ଜୁରିସଭଲ୍ଟ, ଆପଣଙ୍କର AI ଆଇନଗତ ସହାୟକ। ଆପଣଙ୍କ ପରିସ୍ଥିତି ବୁଝାଇଥିବାରୁ ଧନ୍ୟବାଦ। ଆପଣ ସେୟାର କରିଥିବା ସୂଚନା ଆଧାରରେ, ମୋତେ ଆପଣଙ୍କ ଆଇନଗତ ସମସ୍ୟାର ଏକ ପ୍ରାଥମିକ ବୁଝାମଣା ମିଳିଛି। ଏହି ପର୍ଯ୍ୟାୟରେ ଏହା ମନେହୁଏ ଯେ ଆବଶ୍ୟକୀୟ ଆଇନଗତ ସର୍ତ୍ତ ପୂରଣ ହେଲେ ମଧ୍ୟସ୍ଥତା କିମ୍ବା ଆର୍ବିଟ୍ରେସନ ଏକ ଉପଯୁକ୍ତ ବିକଳ୍ପ ହୋଇପାରେ। ଏହା ନିୟମିତ କୋର୍ଟ ବିଚାର ପରିବର୍ତ୍ତେ ଜଣେ ସ୍ୱାଧୀନ ବିଶେଷଜ୍ଞଙ୍କ ଦ୍ୱାରା ବିବାଦର ସମାଧାନ କରେ, ଯାହା ସମୟ ଓ ଖର୍ଚ୍ଚ ବଞ୍ଚାଏ ଏବଂ ଗୋପନୀୟତା ବଜାୟ ରଖେ।",
      audioFallback: "नमस्कार। मुँ जुरिसव्हॉल्ट, आपणंकर एआई आइनगत सहायक। आपणंक परिस्थित्ति बुझाइथिबारु धन्यवाद। आपण शेयर करिथिबा सूचना आधाररे, मोते आपणंक आइनगत समस्यार एक प्राथमिक बुझामणा मिळिछि। एहि परज्याएरे एहा मनेहुए जे आबश्यकीय आइनगत सर्त पूरण हेले मध्यस्थता किम्बा आर्बिट्रेशन एक उपयुक्त बिकाल्प होईपारे। एहा नियमित कोर्ट बिचार परिबर्ते जणे शाधीन बिशेषज्ञंक द्वारा बिबादरो समाधान करे, जाहा समय ओ खर्च बचाए एबं गोपनीयोता बजॉय राखे।"
    },
    pa: { 
      name: "Punjabi (ਪੰਜਾਬੀ)", flag: "🇮🇳", voiceLang: "pa-IN", 
      script: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ। ਮੈਂ ਜਿਊਰਿਸਵਾਲਟ ਹਾਂ, ਤੁਹਾਡਾ AI ਕਾਨੂੰਨੀ ਸਹਾਇਕ। ਆਪਣੀ ਸਥਿਤੀ ਸਮਝਾਉਣ ਲਈ ਧੰਨਵਾਦ। ਤੁਹਾਡੇ ਵੱਲੋਂ ਸਾਂਝੀ ਕੀਤੀ ਗਈ ਜਾਣਕਾਰੀ ਦੇ ਆਧਾਰ 'ਤੇ, ਮੈਨੂੰ ਤੁਹਾਡੀ ਕਾਨੂੰਨੀ ਸਮੱਸਿਆ ਦੀ ਮੁੱਢਲੀ ਸਮਝ ਆ ਗਈ ਹੈ। ਇਸ ਪੜਾਅ 'ਤੇ, ਅਜਿਹਾ ਲੱਗਦਾ ਹੈ ਕਿ ਜੇਕਰ ਲੋੜੀਂਦੀਆਂ ਕਾਨੂੰਨੀ ਸ਼ਰਤਾਂ ਪੂਰੀਆਂ ਹੁੰਦੀਆਂ ਹਨ ਤਾਂ ਵਿਚੋਲਗੀ ਜਾਂ ਆਰਬਿਟਰੇਸ਼ਨ ਇੱਕ ਢੁਕਵਾਂ ਵਿਕਲਪ ਹੋ ਸਕਦਾ ਹੈ। ਇਹ ਪ੍ਰਕਿਰਿਆ ਨਿਯਮਤ ਅਦਾਲਤੀ ਸੁਣਵਾਈ ਦੀ ਬਜਾਏ ਇੱਕ ਸੁਤੰਤਰ ਮਾਹਰ ਦੁਆਰਾ ਵਿਵਾਦਾਂ ਨੂੰ ਹੱਲ ਕਰਦੀ ਹੈ, ਜਿਸ ਨਾਲ ਸਮੇਂ ਅਤੇ ਖਰਚੇ ਦੀ ਬੱਚਤ ਹੁੰਦੀ ਹੈ ਅਤੇ ਕਾਰਵਾਈ ਗੁਪਤ ਰਹਿੰਦੀ ਹੈ।",
      audioFallback: "सत श्री अकाल। मैं जुरिसव्हॉल्ट हाँ, तुहाडा एआई कानूनी सहायक। आपणी स्थिति समझाउण लई धन्यवाद। तुहाडे वल्लों सांझी कीती गई जांकारी दे आधार ते, मैनूँ तुहाडी कानूनी समस्या दी मुड्ढली समझ आ गई है। इस पड़ाव ते, अजहा लगदा है कि जेकर लोड़ींदीयाँ कानूनी शर्तां पूरीयाँ हुंदीयाँ हन तां विचोलगी जां आर्बिट्रेशन इक्क ढुकवाँ विकल्प हो सकदा है। इह प्रक्रिया नियमत अदालती सुणवाई दी बजाय इक्क सुतंतर माहिर द्वारा विवादां नूँ हल करदी है, जिस नाल समें अते खर्चे दी बच्त हुंदी है अते कारवाई गुप्त रहिंदी है।"
    },
    as: { 
      name: "Assamese (অসমীয়া)", flag: "🇮🇳", voiceLang: "as-IN", 
      script: "নমস্কাৰ। মই জুৰিছভল্ট, আপোনাৰ AI আইনী সহায়ক। আপোনাৰ পৰিস্থিতি ব্যাখ্যা কৰাৰ বাবে ধন্যবাদ। আপুনি শ্বেয়াৰ কৰা তথ্যৰ আধাৰত, মোৰ আপোনাৰ আইনী সমস্যাৰ এক প্ৰাথমিক ধাৰণা হৈছে। এই পৰ্যায়ত, এনে লাগে যে প্ৰয়োজনীয় আইনী চৰ্তসমূহ পূৰণ হ'লে মধ্যস্থতা বা আৰ্বিটেচন এক উপযুক্ত বিকল্প হ'ব পাৰে। ই নিয়মীয়া আদালতৰ বিচাৰৰ সলনি এজন স্বতন্ত্ৰ বিশেষজ্ঞৰ জৰিয়তে বিবাদ নিষ্পত্তি কৰে, যিয়ে সময় আৰু খৰচ ৰাহি কৰে আৰু গোপনীয়তা বৰ্তাই ৰাখে।",
      audioFallback: "नोमोश्कार। मोइ जुरिसव्हॉल्ट, आपोनार एआई आइनी शोहायोक। आपोनार पोरिस्थिति ब्याक्खा कोरार बाबे धोन्नोबाद। आपुनि शेयर कोरा तोथ्योर आधरोत, मोर आपोनार आइनी शोमोस्सार एक प्राथोमिक धारोना होइछे। एइ पोर्जाएत, एने लागे जे प्रोयोजोनियो आइनी चोर्तोशोमुह पुरोन होले मोद्धोस्तोता बा आर्बिट्रेशन एक उपोजुक्तो बिकोल्पो होबो पारे। इ नियोमिया आदालोतोर बिचारोर सोलोनि एजोन शाधीन बिशेषोग्गोर जोरियोते बिबाद निष्पोत्ति कोरे, जिये शोमोय आरु खोरोच राही कोरे आरु गोपोनीयोता बोर्तोइ राखे।"
    },
    mai: { name: "Maithili (मैथिली)", flag: "🇮🇳", voiceLang: "mai-IN", script: "नमस्कार। हम ज्यूरिसवॉल्ट छी, अहाँक AI कानूनी सहायक। अपन स्थिति समझायब लेल धन्यवाद। अहाँक द्वारा साझा कएल गेल जानकारी क आधार पर, हमरा अहाँक कानूनी समस्या क प्रारंभिक समझ भ गेल अछि। एहि स्तर पर, एहन बुझाइत अछि जे आवश्यक कानूनी शर्त पूरा हेबाक स्थिति मे मध्यस्थता वा आर्बिट्रेशन एकटा उपयुक्त विकल्प भ सकैत अछि। ई प्रक्रिया नियमित अदालती मुकदमा क बजाय एकटा स्वतंत्र विशेषज्ञ क द्वारा विवाद क समाधान करैत अछि, जकर कारण समय आओर पैसाक बचत होइत अछि आओर कार्यवाही गोपनीय रहैत अछि।" },
    sat: { 
      name: "Santali (ᱥᱟᱱᱛᱟᱲᱤ)", flag: "🇮🇳", voiceLang: "sat-IN", 
      script: "ᱡᱚᱦᱟᱨ. ᱤᱧ ᱫᱚ ᱡᱩᱨᱤᱥᱵᱷᱚᱞᱴ ᱠᱟᱹᱱᱟᱹᱧ, ᱟᱢᱤᱡ AI ᱟᱹᱱᱟᱹᱨᱤ ᱜᱚᱲᱚᱭᱤᱡ. ᱟᱢᱟᱜ ᱟᱱᱟᱴ ᱞᱟᱹᱭ ᱥᱚᱫᱚᱨ ᱞᱟᱹᱜᱤᱫ ᱥᱟᱨᱦᱟᱣ. ᱟᱢᱟᱜ ᱠᱟᱛᱷᱟ ᱞᱮᱠᱟᱛᱮ, ᱟᱢᱟᱜ ᱟᱹᱱᱟᱹᱨᱤ ᱮᱴᱠᱮᱴᱚᱬᱮ ᱨᱮᱱᱟᱜ ᱮᱛᱚᱦᱚᱵ ᱵᱩᱡᱷᱟᱹᱣ ᱤᱧ ᱧᱟᱢ ᱟᱠᱟᱫᱟ. ᱱᱚᱣᱟ ᱛᱷᱚᱠ ᱨᱮ, ᱢᱚᱱᱮᱜ ᱠᱟᱱᱟ ᱡᱮ ᱞᱟᱹᱠᱛᱤᱭᱟᱱ ᱟᱹᱱᱟᱹᱨᱤ ᱥᱚᱨᱛᱚ ᱯᱩᱨᱟᱹᱣ ᱞᱮᱱ ᱠᱷᱟᱱ ᱢᱚᱫᱷᱭᱚᱥᱛᱷᱚᱛᱟ ᱵᱟᱝᱠᱷᱟᱱ ᱟᱨᱵᱤᱴᱨᱮᱥᱚᱱ ᱢᱤᱫ ᱵᱷᱟᱹᱜᱤ ᱩᱯᱟᱹᱭ ᱦᱩᱭ ᱫᱟᱲᱮᱭᱟᱜᱼᱟ. ᱱᱚᱣᱟ ᱫᱚ ᱥᱟᱫᱷᱟᱨᱚᱬ ᱠᱚᱨᱴ ᱵᱤᱪᱟᱹᱨ ᱵᱚᱫᱚᱞ ᱛᱮ ᱢᱤᱫ ᱯᱷᱩᱨᱜᱟᱹᱞ ᱵᱤᱥᱮᱥᱚᱜᱽᱭᱚ ᱦᱚᱛᱮᱛᱮ ᱵᱤᱵᱟᱹᱫᱽ ᱮ ᱥᱚᱞᱦᱮᱭᱟ, ᱡᱟᱦᱟᱸ ᱛᱮ ᱚᱠᱛᱚ ᱟᱨ ᱠᱷᱚᱨᱚᱪ ᱵᱟᱧᱪᱟᱣᱜᱼᱟ ᱟᱨ ᱩᱠᱩ ᱛᱟᱦᱮᱸᱱᱟ.",
      audioFallback: "जोहार। इंज दो जुरिसव्हॉल्ट कानांज, आमीज एआई आनारी गोडोयीज। आमाग आनाट लाय सोदोर लागीद सारहाव। आमाग काथा लेकाते, आमाग आनारी एटकेटोणे रेनाग एतोहोब बुझाव इंज अंजाम आकादा। नोवा थोक रे, मोनेग काना जे लाकतीयान आनारी सोरतो पुराव लेन खान मोध्योस्थोता बांगखान आर्बिट्रेशन मीद भागी उपाय हुय दाडेयाग-आ। नोवा दो साधारण कोर्ट विचार बोदोल ते मीद फुरगाल बिशेषोग्यो होतेते बिबाद ए सोल्हेया, जाहा ते ओक्तो आर खोरोच बांचावग-आ आर उकु ताहेना।"
    },
    ks: { 
      name: "Kashmiri (کٲشُر)", flag: "🇮🇳", voiceLang: "ks-IN", 
      script: "آداب۔ بٕہ چھُس جیوٗرِس والٹ، تُہُنٛد AI قونوٗنی مَدَتھ گار۔ پنٕنؠ صوٗرتحال وَضاحت کَرنٕچ خٲطرٕ شُکریہ۔ تُہنٛدِ فراہم کَرنہٕ آمٕتِ معلوماتکِہ بۄنیادِ پیٚٹھ، مےٚ چھےٚ تُہنٛدِ قونوٗنی مَسلہٕ چِہ اِبتدٲیی سَمَجھ آمٕژ۔ اَتھ مرحلَس پیٚٹھ، چھُ باسان زِ ضروٗری قونوٗنی شَرطٕ پوٗرٕ گَژھنہٕ سٟتؠ ہیٚکہِ ثالثی یا آرکِٹریشن اَکھ مُناسب اِنتخاب ٲسِتھ۔ یہِ عَمَل چھِ باقاعدٕ عدالتی کارروٲیی ہِنٛدِ بَجائے اَکھ آزاد ماہر سٟتؠ تَنازعات حَل کَران، ییٚمہِ سٟتؠ وَقٕت تہٕ خرچہٕ بَچان چھُ تہٕ کارروٲیی صِرف خُفیہ روزان چھےٚ۔",
      audioFallback: "आदाब। ब्य छूस जुरिसव्हॉल्ट, तुहुंद एआई कानूनी मदतगार। पानीन सूरत-ए-हाल वजाहत करनच खातर शुक्रिया। तुहुंदी फराहम करना आमति मालूमातकी बुनियादी पेठ, म्य छ्य तुहुंदी कानूनी मसलेची इब्तिदाई समझ आमज़। अथ मरहलस पेठ, छू बासान जि जरूरी कानूनी शर्त पूरा गछना सीत हेकी सालिसी या आर्बिट्रेशन अख मुनासिब इंतखाब आसिथ। यि अमल छि बाकायदा अदालती कार्रवाई हिंदी बजाय अख आजाद माहिर सीत तनाजात हल करान, य्यमि सीत वकत तु खर्चा बचन छू तु कार्रवाई खुफिया रोजान छ्य।"
    },
    ne: { name: "Nepali (नेपाली)", flag: "🇮🇳", voiceLang: "ne-IN", script: "नमस्ते। म ज्यूरिसभल्ट हुँ, तपाईंको AI कानुनी सहायक। आफ्नो स्थिति स्पष्ट पार्नुभएकोमा धन्यवाद। तपाईंले साझा गर्नुभएको जानकारीको आधारमा, मलाई तपाईंको कानुनी समस्याको प्रारम्भिक समझ प्राप्त भएको छ। यस चरणमा, आवश्यक कानुनी सर्तहरू पूरा भएमा मध्यस्थता वा आर्बिट्रेसन एक उपयुक्त विकल्प हुन सक्छ जस्तो देखिन्छ। यो प्रक्रियाले नियमित अदालती सुनुवाइको सट्टा एक स्वतन्त्र विशेषज्ञमार्फत विवादहरू समाधान गर्दछ, जसले समय र लागत बचत गर्दछ र कारबाहीलाई गोप्य राख्दछ।" },
    kok: { name: "Konkani (कोंकणी)", flag: "🇮🇳", voiceLang: "kok-IN", script: "नमस्कार. हांव ज्युरीसव्हॉल्ट, तुमचो AI कायदो सहाय्यक. तुमची परिस्थिती स्पष्ट केल्याबद्दल धन्यवाद. तुम्ही सामायिक केलेल्या माहितीच्या आधारे, म्हाका तुमच्या कायदेशीर समस्येची प्राथमिक समज मेळ्ळ्या. या टप्प्यार, आवश्यक कायदेशीर अटी पूर्ण झाल्यार मध्यस्थी वा लवाद हो एक योग्य पर्याय आसूं येता अशें दिसता. ही प्रक्रिया नियमित न्यायालयीन खटल्याऐवजी स्वतंत्र तज्ज्ञांमार्फत विवाद सोडयता, जेन्ना वेळ आणि खर्चाची बचत जाता आणि कार्यवाही गोपनीय उरता." },
    sd: { 
      name: "Sindhi (سنڌي)", flag: "🇮🇳", voiceLang: "sd-IN", 
      script: "نمستي. مان جيورس والٽ آهيان، توهان جو AI قانوني مددگار. پنهنجي صورتحال جي وضاحت ڪرڻ لاءِ مهرباني. توهان جي شيئر ڪيل معلومات جي بنياد تي، مون کي توهان جي قانوني مسئلي جي شروعاتي سمجهاڻي ملي وئي آهي. هن مرحلي تي، اهو لڳي ٿو ته ضروري قانوني شرطون پوريون ٿيڻ جي صورت ۾ ٽياڪڙي يا آرڪيٽريشن هڪ مناسب اختيار ٿي سگهي ٿو. هي عمل باقاعده عدالتي ڪارروائي جي بدران هڪ آزاد ماهر ذريعي تڪرارن کي حل ڪري ٿو، جنهن سان وقت ۽ خرچ جي بچت ٿئي ٿي ۽ ڪارروائي ڳجهي رهي ٿي.",
      audioFallback: "नमस्ते। मान जुरिसव्हॉल्ट आहियां, तव्हां जो एआई कानूनी मददगार। पंहिंजी सूरत-ए-हाल जी वजाहत करण लाएं मेहरबानी। तव्हां जी शेयर केल मालूमात जे बुनियाद ते, मूं खे तव्हां जे कानूनी मसले जी शुरुआती समझानी मिली वई आहे। हिन मरहले ते, इहो लगे थो त जरूरी कानूनी शर्तूं पूरियूं थीण जी सूरत में टियाकड़ी या आर्बिट्रेशन हिकु मुनासिब इख्तियार थी सघे थो। ही अमल बाकायदा अदालती कार्रवाई जे बद्रान हिकु आजाद माहिर जरिए तकरारन खे हल करे थो, जंहिन सां वक्त ऐं खर्च जी बचत थीए थी ऐं कार्रवाई गुझी रहे थी।"
    },
    doi: { name: "Dogri (डोगरी)", flag: "🇮🇳", voiceLang: "doi-IN", script: "नमस्ते। मैं ज्यूरिसवॉल्ट आं, तुंदा AI कानूनी सहायक। अपनी स्थिति स्पष्ट करने लेई धन्यवाद। तुंदे द्वारा सांझा कीती गई जानकारी दे आधार उप्पर, मिगी तुंदी कानूनी समस्या दी प्रारंभिक समझ होई गेई ऐ। इस स्तर उप्पर, ऐसा लगदा ऐ जे जरूरी कानूनी शर्तां पूरियां होने उप्पर मध्यस्थता जां आर्बिट्रेशन इक उपयुक्त विकल्प होई सकदा ऐ। इह प्रक्रिया नियमित अदालती मुकदमे दे बजाय इक स्वतंत्र विशेषज्ञ दे जरिए विवादें गी हल करदी ऐ, जिस्सै नाल समें ते पैसे दी बचत होवे ऐ ते कार्यवाही गोपनीय रौंहदी ऐ।" },
    mni: { 
      name: "Manipuri (ꯃꯩꯇꯩꯂꯣꯟ)", flag: "🇮🇳", voiceLang: "mni-IN", 
      script: "ꯈꯨꯔꯨꯝꯖꯔꯤ꯫ ꯑꯏ ꯖ꯭ꯌꯨꯔꯤꯁꯚꯣꯜꯠꯅꯤ, ꯑꯗꯣꯝꯒꯤ AI ꯑꯥꯏꯟꯒꯤ ꯃꯇꯦꯡ ꯄꯥꯡꯂꯤꯕ꯫ ꯑꯗꯣꯝꯒꯤ ꯐꯤꯚꯝ ꯁꯟꯗꯣꯛꯅꯥ ꯇꯥꯛꯄꯤꯕꯒꯤꯗꯃꯛ ꯊꯥꯒꯠꯆꯔꯤ꯫ ꯑꯗꯣꯝꯅꯥ ꯄꯤꯕꯤꯕꯥ ꯃꯇꯥꯡ ꯑꯁꯤꯒꯤ ꯃꯈꯥꯗꯥ, ꯑꯏꯅꯥ ꯑꯗꯣꯝꯒꯤ ꯑꯥꯏꯟꯒꯤ ꯑꯋꯥꯕꯒꯤ ꯃꯇꯥꯡꯗꯥ ꯑꯍꯥꯟꯕꯥ ꯋꯥꯈꯜꯂꯣꯟ ꯑꯃꯥ ꯐꯪꯂꯦ꯫ ꯇꯥꯡꯀꯛ ꯑꯁꯤꯗꯥ, ꯃꯊꯧ ꯇꯥꯕꯥ ꯑꯥꯏꯟꯒꯤ ꯌꯥꯅꯕꯥ ꯁꯔꯇꯁꯤꯡ ꯃꯄꯨꯡ ꯐꯥꯔꯕꯗꯤ ꯃꯤꯗꯤꯌꯦꯁꯟ ꯅꯠꯇ꯭ꯔꯒꯥ ꯑꯥꯔꯕꯤꯇ꯭ꯔꯦꯁꯟ ꯑꯁꯤ ꯆꯨꯝꯕꯥ ꯄꯥꯝꯕꯩ ꯑꯃꯥ ꯑꯣꯏꯕꯥ ꯌꯥꯏ꯫ ꯃꯁꯤꯅꯥ ꯆꯥꯡ ꯅꯥꯏꯅꯥ ꯀꯣꯔꯠꯀꯤ ꯋꯥꯌꯦꯜꯒꯤ ꯃꯍꯨꯠꯇꯥ ꯅꯤꯡꯇꯝꯕꯥ ꯑꯈꯟꯅꯕꯥ ꯃꯤꯑꯣꯏ ꯑꯃꯒꯤ ꯈꯨꯠꯊꯥꯡꯗꯥ ꯃꯨꯛꯅꯕꯁꯤꯡ ꯂꯣꯏꯁꯤꯟꯍꯜꯂꯤ, ꯃꯇꯝ ꯑꯃꯁꯨꯡ ꯁꯦꯟꯐꯝ ꯀꯟꯕꯥ ꯉꯝꯃꯤ ꯑꯃꯁꯨꯡ ꯊꯧꯔꯝ ꯑꯁꯤ ꯑꯔꯣꯟꯕꯥ ꯑꯣꯏꯅꯥ ꯊꯝꯃꯤ꯫",
      audioFallback: "खुरूमजरी। ओई जुरिसव्हॉल्टनी, अदोमगी एआई आइनगी मतेंग पांगलिबा। अदोमगी फिवम संदोकना ताकपिबगीदमक थागतचरी। अदोमना पिबिबा मतांग असीगी मखादा, ओईना अदोमगी आइनगी अवाबगी मतांगदा अहानबा वाखल्लोन अमा फंगले। तांगक असीदा, मथौ ताबा आइनगी यानबा शरतसिंग मपुंग फारबदी मीडियेशन नत्त्रगा आर्बिट्रेशन असी चुम्बा पाम्बई अमा ओइबा याई। मसीना चांग नाइना कोर्टकी वायेल्गी महुत्ता निंगतमबा अखन्नबा मिओइ अमगी खुत्थांगदा मुकनबसींग लोइसिनहल्ली, मतम अमसुंग सेनफम कनबा ंगम्मी अमसुंग ठौरम असी अरोनबा ओइना थम्मी।"
    },
    brx: { name: "Bodo (बड़ो)", flag: "🇮🇳", voiceLang: "brx-IN", script: "खुलुमबाय। आं जुरिसभल्ट, नोंथांनि AI आइनि हेफाजाबगिरि। नोंथांनि थासारि बेखेवना होनायनि थाखाय हामबाय। नोंथांआ सेयार खालामनाय खौरांनि सायात, आं नोंथांनि आइनि जेंनानि सायात सेथि बुजिमोन्नाय मोनबाय। बे खोन्दोआव, बेयो नुयो दि जुदि गोनांथार आइनि सर्तफोरखौ आबुं खालामोब्ला गेजेरथि बा आर्बिट्रेशन मोनसे आरजाथाव उफाय जानो हागौ। बे बिखान्थिया नियमित अदालत बिजिरनायनि सोलाय सासे उदां आखा-फाखा सुबुंनि गेजेरजों दावराव-दावसि सुस्राङो, जाय समय आरो खरसा बाचायो आरो खामानिखौ गोहोनां लाखियो।" },
    sa: { name: "Sanskrit (संस्कृतम्)", flag: "🇮🇳", voiceLang: "sa-IN", script: "नमस्ते। अहम् भवताम् ज्यूरिसवॉल्ट् विधि-सलाहकारः अस्मि। भवताम् कथनस्य आधारेण, भवताम् प्रकरणम् मध्यस्थता-अधिनियमः २०२३ इत्यस्य धारा ४ अन्तर्गतम् पूर्व-वाद-मध्यस्थतायाः योग्यम् अस्ति। एकः प्रमाणितः मध्यस्थः ३० तः ९० दिनेषु वैधानिक-समझौताम् प्राप्तुम् सहायताम् करिष्यति।" }
  };

  const compDict = {
    en: {
      mTitle: "Mediation",
      mPoints: ["Mutual settlement focus", "Highly confidential", "Fraction of court costs", "Resolved in 30-90 days"],
      lTitle: "Litigation",
      lPoints: ["Adversarial court battle", "Public record", "High court & lawyer fees", "Takes 2-5 years on average"]
    },
    hi: {
      mTitle: "मध्यस्थता (Mediation)",
      mPoints: ["पारस्परिक समझौते पर जोर", "अत्यंत गोपनीय", "अदालती खर्च का एक अंश", "30-90 दिनों में समाधान"],
      lTitle: "मुकदमेबाजी (Litigation)",
      lPoints: ["विरोधात्मक अदालती लड़ाई", "सार्वजनिक रिकॉर्ड", "उच्च न्यायालय और वकील की फीस", "औसतन 2-5 साल लगते हैं"]
    },
    bn: {
      mTitle: "মধ্যস্থতা",
      mPoints: ["পারস্পরিক মীমাংসার উপর জোর", "অত্যন্ত গোপনীয়", "আদালতের খরচের একটি ভগ্নাংশ", "৩০-৯০ দিনের মধ্যে সমাধান"],
      lTitle: "মোকদ্দমা",
      lPoints: ["প্রতিকূল আইনি লড়াই", "পাবলিক রেকর্ড", "উচ্চ আদালত এবং আইনজীবীর ফি", "গড়ে ২-৫ বছর সময় লাগে"]
    },
    ta: {
      mTitle: "சமரசம்",
      mPoints: ["பரஸ்பர தீர்வு", "மிகவும் ரகசியமானது", "நீதிமன்ற செலவுகளில் ஒரு பகுதி", "30-90 நாட்களில் தீர்வு"],
      lTitle: "வழக்கு",
      lPoints: ["எதிர்நீதிமன்றப் போராட்டம்", "பொது பதிவு", "அதிக நீதிமன்ற மற்றும் வழக்கறிஞர் கட்டணம்", "சராசரியாக 2-5 ஆண்டுகள் ஆகும்"]
    },
    te: {
      mTitle: "మధ్యవర్తిత్వం",
      mPoints: ["పరస్పర పరిష్కారం", "అత్యంత గోప్యమైనది", "కోర్టు ఖర్చులలో కొంత భాగం", "30-90 రోజుల్లో పరిష్కారం"],
      lTitle: "వ్యాజ్యం",
      lPoints: ["కోర్టు పోరాటం", "పబ్లిక్ రికార్డ్", "అధిక కోర్టు & న్యాయవాది ఫీజులు", "సగటున 2-5 సంవత్సరాలు పడుతుంది"]
    },
    mr: {
      mTitle: "मध्यस्थी",
      mPoints: ["परस्पर समझोत्यावर भर", "अत्यंत गोपनीय", "न्यायालयाच्या खर्चाचा एक अंश", "३०-९० दिवसांत निराकरण"],
      lTitle: "खटला",
      lPoints: ["न्यायालयीन लढा", "सार्वजनिक रेकॉर्ड", "उच्च न्यायालय आणि वकील फी", "सरासरी २-५ वर्षे लागतात"]
    },
    gu: {
      mTitle: "મધ્યસ્થી",
      mPoints: ["પરસ્પર સમાધાન પર ભાર", "અત્યંત ગોપનીય", "કોર્ટના ખર્ચનો એક અંશ", "30-90 દિવસમાં ઉકેલ"],
      lTitle: "મુદ્દમા",
      lPoints: ["પ્રતિકૂળ કાનૂની લડાઈ", "જાહેર રેકોર્ડ", "ઉચ્ચ અદાલત અને વકીલની ફી", "સરેરાશ 2-5 વર્ષ લાગે છે"]
    },
    kn: {
      mTitle: "ಮಧ್ಯಸ್ಥಿಕೆ",
      mPoints: ["ಪರಸ್ಪರ ಇತ್ಯರ್ಥ", "ಅತ್ಯಂತ ಗೌಪ್ಯ", "ನ್ಯಾಯಾಲಯದ ವೆಚ್ಚದ ಒಂದು ಭಾಗ", "30-90 ದಿನಗಳಲ್ಲಿ ಪರಿಹಾರ"],
      lTitle: "ವ್ಯಾಜ್ಯ",
      lPoints: ["ನ್ಯಾಯಾಲಯದ ಹೋರಾಟ", "ಸಾರ್ವಜನಿಕ ದಾಖಲೆ", "ಹೆಚ್ಚಿನ ನ್ಯಾಯಾಲಯ ಮತ್ತು ವಕೀಲರ ಶುಲ್ಕಗಳು", "ಸರಾಸರಿ 2-5 ವರ್ಷಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ"]
    },
    ml: {
      mTitle: "മധ്യസ്ഥത",
      mPoints: ["പരസ്പര ഒത്തുതീർപ്പ്", "വളരെ രഹസ്യമായത്", "കോടതി ചെലവുകളുടെ ഒരു ഭാഗം", "30-90 ദിവസങ്ങൾക്കുള്ളിൽ പരിഹാരം"],
      lTitle: "വ്യവഹാരം",
      lPoints: ["കോടതി പോരാട്ടം", "പൊതു രേഖ", "ഉയർന്ന കോടതി & അഭിഭാഷക ഫീസ്", "ശരാശരി 2-5 വർഷമെടുക്കും"]
    },
    pa: {
      mTitle: "ਵਿਚੋਲਗੀ",
      mPoints: ["ਆਪਸੀ ਸਮਝੌਤੇ 'ਤੇ ਜ਼ੋਰ", "ਬਹੁਤ ਗੁਪਤ", "ਅਦਾਲਤੀ ਖਰਚਿਆਂ ਦਾ ਇੱਕ ਹਿੱਸਾ", "30-90 ਦਿਨਾਂ ਵਿੱਚ ਹੱਲ"],
      lTitle: "ਮੁਕੱਦਮੇਬਾਜ਼ੀ",
      lPoints: ["ਵਿਰੋਧੀ ਅਦਾਲਤੀ ਲੜਾਈ", "ਜਨਤਕ ਰਿਕਾਰਡ", "ਹਾਈ ਕੋਰਟ ਅਤੇ ਵਕੀਲ ਦੀ ਫੀਸ", "ਔਸਤਨ 2-5 ਸਾਲ ਲੱਗਦੇ ਹਨ"]
    },
    ur: {
      mTitle: "ثالثی (Mediation)",
      mPoints: ["باہمی تصفیہ پر زور", "انتہائی خفیہ", "عدالتی اخراجات کا ایک حصہ", "30-90 دنوں میں حل"],
      lTitle: "مقدمہ بازی (Litigation)",
      lPoints: ["مخالفانہ قانونی جنگ", "عوامی ریکارڈ", "ہائی کورٹ اور وکیل کی فیس", "اوسطاً 2-5 سال لگتے ہیں"]
    }
  };

  const activeComp = compDict[avatarLang] || compDict.en;

  const handlePlayAvatarVideo = () => {
    setIsPlayingVideo(true);
    setSpeechSynthesisActive(true);
    const scriptText = (avatarLang === "en" && interceptionData?.script) 
      ? interceptionData.script 
      : (avatarScripts[avatarLang]?.script || avatarScripts.en.script);
    setActiveCaption(scriptText);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const targetLangCode = avatarScripts[avatarLang]?.voiceLang || "en-IN";
      const voices = window.speechSynthesis.getVoices();
      const exactVoice = voices.find(v => v.lang.replace('_', '-').toLowerCase() === targetLangCode.toLowerCase());
      const prefixVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLangCode.split('-')[0].toLowerCase()));
      
      let textToSpeak = scriptText;
      const utterance = new SpeechSynthesisUtterance();

      if (exactVoice) {
        utterance.voice = exactVoice;
        utterance.lang = exactVoice.lang;
      } else if (prefixVoice) {
        utterance.voice = prefixVoice;
        utterance.lang = prefixVoice.lang;
      } else {
        // FOOLPROOF WINDOWS TTS FALLBACK:
        // When regional voice packs (like Tamil, Bengali, Telugu, Gujarati, etc.) are NOT installed on Windows,
        // feeding regional Unicode script into English/Hindi synthesizers causes 100% silence!
        // To guarantee audible, clear pronunciation in all 22 languages without fail, we pass the phonetic audioFallback
        // to an available Hindi or Indian English voice!
        const hindiVoice = voices.find(v => v.lang.replace('_', '-').toLowerCase().includes('hi-in') || v.name.toLowerCase().includes('hindi'));
        const indianVoice = voices.find(v => v.lang.replace('_', '-').toLowerCase().includes('in'));
        if (hindiVoice) {
          utterance.voice = hindiVoice;
          utterance.lang = "hi-IN";
        } else if (indianVoice) {
          utterance.voice = indianVoice;
          utterance.lang = indianVoice.lang;
        } else if (voices.length > 0) {
          utterance.voice = voices[0];
          utterance.lang = voices[0].lang;
        }
        if (avatarScripts[avatarLang]?.audioFallback) {
          textToSpeak = avatarScripts[avatarLang].audioFallback;
        }
      }

      utterance.text = textToSpeak;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeechSynthesisActive(false);
      utterance.onerror = () => setSpeechSynthesisActive(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setSpeechSynthesisActive(false), 12000);
    }
  };

  const handleStopAvatarVideo = () => {
    setIsPlayingVideo(false);
    setSpeechSynthesisActive(false);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const categories = [
    { id: "property", label: "Home & Property", icon: "🏠", desc: "Problems with land, rent, or neighbors" },
    { id: "work",     label: "Job & Salary",     icon: "💼", desc: "Issues with boss, pay, or contracts" },
    { id: "family",   label: "Family Matters",   icon: "❤️", desc: "Marriage, children, or inheritance" },
    { id: "money",    label: "Money & Loans",    icon: "💰", desc: "Cheques, debt, or bank issues" },
    { id: "other",    label: "Something Else",   icon: "⚖️", desc: "Any other legal problem" }
  ];





  // 🕒 PROACTIVE AUTO-FILL: Detect stops in typing
  useEffect(() => {
    if (formData.description.length < 20) return;
    
    const timer = setTimeout(() => {
      handleAIAutoFill();
    }, 2500); // 2.5s delay after typing stops

    return () => clearTimeout(timer);
  }, [formData.description]);

  // Normalize legalType: API returns 'Criminal Law', dropdown expects 'Criminal Law'
  // Handles both short ('Criminal') and long ('Criminal Law') formats from any AI engine
  const normalizeLegalType = (raw) => {
    if (!raw) return "Civil Law";
    const map = {
      "criminal":      "Criminal Law",
      "criminal law":  "Criminal Law",
      "civil":         "Civil Law",
      "civil law":     "Civil Law",
      "family":        "Family Law",
      "family law":    "Family Law",
      "labor":         "Labor Law",
      "labour":        "Labor Law",
      "labor law":     "Labor Law",
      "labour law":    "Labor Law",
      "tax":           "Tax Law",
      "taxation":      "Tax Law",
      "tax law":       "Tax Law",
      "cyber":         "Cyber Law",
      "cyber law":     "Cyber Law",
      "corporate":     "Corporate Law",
      "corporate law": "Corporate Law",
      "consumer":      "Consumer Protection",
      "consumer protection": "Consumer Protection",
    };
    return map[raw.toLowerCase().trim()] || raw;
  };

  // ✨ MAGIC AUTO-FILL: AI Analyze the story
  const handleAIAutoFill = async () => {
    if (formData.description.length < 20) return;
    setIsAnalyzing(true);
    setAiMessage("JurisBot AI is analyzing your story to generate a professional title...");
    try {
      const res = await axios.post("/cases/analyze-story", { description: formData.description });
      const normalizedType = normalizeLegalType(res.data.legalType);
      setFormData(prev => ({ 
        ...prev, 
        title: res.data.title || prev.title,
        category: res.data.category || prev.category,
        legalType: normalizedType,
        sections: res.data.sections || [],
        court: res.data.court || "",
        draft: res.data.draft || ""
      }));
      setAiMessage(`✨ Analysis complete — Classified as ${normalizedType}. Title, Sections & Draft generated.`);
    } catch (err) {
      setAiMessage("I've captured your story. Please review the details below.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.category || !formData.incidentDate) {
      return alert("Incomplete Details: Please provide Title, Description, Category, and Date of Incident before finalizing.");
    }
    setLoading(true);
    try {
      // ✅ Use FormData to support file uploads
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        if (Array.isArray(formData[key])) {
          formData[key].forEach(v => payload.append(key, v));
        } else {
          payload.append(key, formData[key]);
        }
      });
      evidenceFiles.forEach(f => payload.append('evidence', f));
      
      // Append the mediation preference
      payload.append('mediationRequested', formData.mediationRequested || false);

      const res = await axios.post("/cases", payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCurrentCaseId(res.data.case?._id);
      setMatchedLawyers(res.data.suggestedLawyers || []);
      if (res.data.mediationEligible && res.data.mediationInfo) {
        setMediationData(res.data.mediationInfo);
      }
      setShowSuccessModal(true);
    } catch (err) {
      console.error("❌ Submission Failed:", err);
      alert("Failed to file case: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleProceedFromNarration = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/cases/check-mediation", {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        legalType: formData.legalType
      });
      if (res.data && res.data.eligible) {
        setInterceptionData(res.data);
        setShowMediationInterception(true);
      } else {
        setStep(3);
      }
    } catch (err) {
      console.warn("Mediation check failed, proceeding to evidence:", err);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (lawyerId) => {
    setIsConnecting(true);
    try {
      await axios.post(`/cases/connect/${currentCaseId}/${lawyerId}`);
      setTimeout(() => {
        navigate("/cases");
      }, 2000);
    } catch (err) {
      alert("Connection failed.");
      setIsConnecting(false);
    }
  };

  return (
    <div className="wizard-page light-theme">
      <Sidebar />
      
      <main className="wizard-main">
        {/* 🤖 Advanced AI Header Dock */}
        <div className="wizard-ai-dock">
          <div className="ai-dock-info">
            <div className="ai-mini-avatar">🤖</div>
            <div className="ai-text-container">
              <span className="ai-dock-label">JURISBOT CORE INTELLIGENCE</span>
              <p className="ai-dock-msg">{aiMessage}</p>
            </div>
          </div>

        </div>

        {/* Progress Bar */}
        <div className="wizard-header">
          <div className="wizard-progress">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`wizard-step-node ${step >= s ? 'active' : ''}`}>
                <div className="node-circle">{s}</div>
                <span className="node-label">
                  {s === 1 ? "Category" : s === 2 ? "Narration" : s === 3 ? "Evidence" : "Finalize"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="wizard-content">
          {step === 1 && (
            <div className="wizard-slide fade-in">
              <h1 className="wizard-title">Select Matter Category <span className="req">*</span></h1>
              <p className="wizard-subtitle">Classify your legal concern for specialized expert matching.</p>
              
              <div className="category-grid">
                {categories.map(c => (
                  <button 
                    key={c.id} 
                    className={`category-card ${formData.category === c.label ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, category: c.label})}
                  >
                    <span className="cat-icon">{c.icon}</span>
                    <div className="cat-info">
                      <h3>{c.label}</h3>
                      <p>{c.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="wizard-actions">
                <div />
                <button className="wizard-btn-next" disabled={!formData.category} onClick={() => setStep(2)}>
                  Continue to Narration →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-slide fade-in">
              <h1 className="wizard-title">Incident Narration <span className="req">*</span></h1>
              <p className="wizard-subtitle">Provide a detailed account of the incident for legal analysis.</p>
              
              <div className="wizard-form-box">
                <div className="form-group">
                    <label>Statement of Facts</label>
                  <textarea 
                    className="wizard-textarea"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    onBlur={handleAIAutoFill}
                    placeholder="Describe the incident details here..."
                    rows="6"
                  />
                </div>

                <div className="form-group">
                  <label>Smart Case Title</label>
                  <div className={`input-container ${isAnalyzing ? 'glow' : ''}`}>
                    <input 
                      className="wizard-input"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder={isAnalyzing ? "Processing narration..." : "Formal title for legal filing"}
                    />
                    {formData.title && !isAnalyzing && <span className="ai-tag">SMART GEN</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Legal Classification</label>
                  <select 
                    className="wizard-input"
                    value={formData.legalType}
                    onChange={e => setFormData({...formData, legalType: e.target.value})}
                  >
                    <option value="Civil Law">Civil Law</option>
                    <option value="Criminal Law">Criminal Law</option>
                    <option value="Family Law">Family Law</option>
                    <option value="Labor Law">Labor Law</option>
                    <option value="Tax Law">Tax Law</option>
                    <option value="Cyber Law">Cyber Law</option>
                    <option value="Corporate Law">Corporate Law</option>
                    <option value="Consumer Protection">Consumer Protection</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Urgency Level</label>
                  <select 
                    className="wizard-input"
                    value={formData.urgency}
                    onChange={e => setFormData({...formData, urgency: e.target.value})}
                  >
                    <option value="Normal">Normal — Standard Processing</option>
                    <option value="Urgent">Urgent — Requires Prompt Action</option>
                    <option value="Emergency">Emergency — Immediate Life/Liberty Threat</option>
                  </select>
                </div>

                {formData.sections && formData.sections.length > 0 && (
                  <div className="form-group">
                    <label>Applicable Law Sections</label>
                    <div className="wizard-input" style={{ background: '#f8fafc', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {formData.sections.map((sec, idx) => (
                        <span key={idx} style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{sec}</span>
                      ))}
                    </div>
                  </div>
                )}

                {formData.court && (
                  <div className="form-group">
                    <label>Recommended Court Jurisdiction</label>
                    <div className="wizard-input" style={{ background: '#f8fafc', fontWeight: 'bold', color: '#334155' }}>
                      🏛️ {formData.court}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Date of Incident <span className="req">*</span></label>
                  <div className="material-date-trigger" onClick={() => setShowDatePicker(true)}>
                    {formData.incidentDate || "Select Date"}
                    <span className="cal-icon">📅</span>
                  </div>
                  {showDatePicker && (
                    <MaterialDatePicker 
                      value={formData.incidentDate} 
                      onChange={(date) => setFormData({...formData, incidentDate: date})}
                      onClose={() => setShowDatePicker(false)}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label>Adversary Details</label>
                  <input 
                    className="wizard-input"
                    value={formData.oppositeParty}
                    onChange={e => setFormData({...formData, oppositeParty: e.target.value})}
                    placeholder="Name of opposing person or entity"
                  />
                </div>
              </div>

              <div className="wizard-actions">
                <button className="wizard-btn-back" onClick={() => setStep(1)}>← Previous</button>
                <button 
                  className="wizard-btn-next" 
                  disabled={!formData.description.trim() || loading} 
                  onClick={handleProceedFromNarration}
                >
                  {loading ? "Checking Mediation..." : "Proceed to Evidence →"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-slide fade-in">
              <h1 className="wizard-title">Evidence</h1>
              <p className="wizard-subtitle">Upload photos, videos, or documents related to your case.</p>

              <div className="upload-zone" onClick={() => document.getElementById('f-up').click()} style={{ cursor: 'pointer', border: '2px dashed rgba(201,168,76,0.4)', borderRadius: '12px', padding: '30px', textAlign: 'center', background: 'rgba(201,168,76,0.04)', marginBottom: '16px' }}>
                <input
                  type="file"
                  id="f-up"
                  style={{ display: 'none' }}
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files);
                    setEvidenceFiles(prev => [...prev, ...newFiles]);
                  }}
                />
                <span className="upload-icon" style={{ fontSize: '2rem' }}>📂</span>
                <p style={{ margin: '8px 0 4px', fontWeight: 600 }}>Click to add documents or photos</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Images, PDFs, Videos supported</p>
              </div>

              {/* ✅ File Preview List */}
              {evidenceFiles.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '0.85rem', color: '#c9a84c', fontWeight: 600, marginBottom: '8px' }}>📎 {evidenceFiles.length} file(s) selected:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {evidenceFiles.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem' }}>
                        <span>{f.type.startsWith('image') ? '🖼️' : f.type.includes('pdf') ? '📄' : f.type.startsWith('video') ? '🎥' : '📁'}</span>
                        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEvidenceFiles(prev => prev.filter((_, idx) => idx !== i)); }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: '0', lineHeight: 1 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="wizard-actions">
                <button className="wizard-btn-back" onClick={() => setStep(2)}>← Back</button>
                <button className="wizard-btn-next" onClick={() => setStep(4)}>Final Review →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="wizard-slide fade-in">
              <h1 className="wizard-title">Review & Submit</h1>
              <p className="wizard-subtitle">Please double-check everything before sending to our lawyers.</p>
              <div className="review-card">
                <div className="review-item"><strong>CATEGORY:</strong> {formData.category}</div>
                <div className="review-item"><strong>URGENCY:</strong> <span style={{ color: formData.urgency === 'Emergency' ? '#ef4444' : formData.urgency === 'High' ? '#f59e0b' : '#10b981', fontWeight: 700 }}>{formData.urgency}</span></div>
                <div className="review-item"><strong>SUBJECT:</strong> {formData.title}</div>
                <div className="review-item"><strong>DATE:</strong> {formData.incidentDate || "N/A"}</div>
                <div className="review-item"><strong>OPPONENT:</strong> {formData.oppositeParty || "N/A"}</div>
                <div className="review-item"><strong>DESCRIPTION:</strong> {formData.description}</div>
                {evidenceFiles.length > 0 && (
                  <div className="review-item"><strong>EVIDENCE:</strong> {evidenceFiles.length} file(s) attached — {evidenceFiles.map(f => f.name).join(', ')}</div>
                )}
              </div>
              <div className="wizard-actions">
                <button className="wizard-btn-back" onClick={() => setStep(formData.mediationRequested ? 2 : 3)}>← Edit</button>
                <button className="wizard-btn-submit" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Filing..." : "FINALIZE & FILE CASE"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ⚖️ PRE-FILING MEDIATION INTERCEPTION MODAL (COMPACT AI STUDIO) */}
        {showMediationInterception && interceptionData && (
          <div className="expert-modal-overlay" style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, background: "rgba(5, 8, 16, 0.85)", backdropFilter: "blur(12px)" }}>
            <div className="expert-modal-card" style={{ maxWidth: "580px", width: "100%", background: "linear-gradient(145deg, #0e1626 0%, #080c16 100%)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "20px", padding: "20px 24px", boxShadow: "0 30px 60px -15px rgba(0,0,0,0.9), 0 0 40px rgba(201,168,76,0.1)", color: "#fff", textAlign: "left", position: "relative" }}>
              
              {/* TOP HEADER & LANGUAGE DROPDOWN */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0.05) 100%)", border: "1px solid rgba(201,168,76,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", boxShadow: "0 0 10px rgba(201,168,76,0.2)" }}>
                    ⚖️
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif", letterSpacing: "0.2px" }}>
                      JurisVault™ Mediation Studio
                    </h2>
                    <span style={{ fontSize: "0.7rem", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      Governed by {interceptionData.actName || "The Mediation Act, 2023"}
                    </span>
                  </div>
                </div>

                {/* SLEEK GOLD PILL LANGUAGE SELECTOR */}
                <div 
                  onClick={() => setIsLangModalOpen(true)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.5)", padding: "4px 12px", borderRadius: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)", cursor: "pointer", transition: "all 0.2s" }}
                >
                  <span style={{ fontSize: "0.7rem", color: "#c9a84c", fontWeight: 700 }}>🗣️ Lang:</span>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.75rem" }}>
                    {avatarScripts[avatarLang]?.flag || "🌐"} {avatarScripts[avatarLang]?.name || "English"} ▾
                  </span>
                </div>
              </div>

              {/* CENTER: WIDESCREEN CINEMATIC EXECUTIVE AI PRESENTER SCREEN */}
              <div style={{ position: "relative", width: "100%", height: "220px", background: "linear-gradient(135deg, #0a0f1d 0%, #050811 100%)", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 10px 25px rgba(0,0,0,0.6), inset 0 0 15px rgba(0,0,0,0.5)", marginBottom: "16px" }}>
                
                {/* ALWAYS-PRESENT VIDEO BACKGROUND WITH DUAL CDNS FOR ZERO FAILURE */}
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: isPlayingVideo ? 0.95 : 0.45,
                    transition: "all 0.5s ease",
                    filter: isPlayingVideo ? "none" : "grayscale(35%) brightness(0.7)"
                  }}
                >
                  <source src="https://assets.mixkit.co/videos/preview/mixkit-business-woman-talking-in-a-video-conference-41386-large.mp4" type="video/mp4" />
                  <source src="https://assets.mixkit.co/videos/preview/mixkit-working-on-a-laptop-in-a-modern-office-41380-large.mp4" type="video/mp4" />
                </video>

                {/* IDLE STATE: STUNNING INTERACTIVE START BUTTON OVERLAY */}
                {!isPlayingVideo && (
                  <div
                    onClick={handlePlayAvatarVideo}
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "radial-gradient(circle, rgba(14,22,38,0.5) 0%, rgba(5,8,16,0.8) 100%)",
                      backdropFilter: "blur(2px)",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <div style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #c9a84c 0%, #a88520 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 20px rgba(201,168,76,0.5)",
                      marginBottom: "10px",
                      border: "2px solid #fff",
                      transition: "transform 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <span style={{ fontSize: "1.4rem", marginLeft: "4px", color: "#090d16" }}>▶️</span>
                    </div>
                    <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff", letterSpacing: "1px", textShadow: "0 2px 4px rgba(0,0,0,0.9)", textTransform: "uppercase" }}>
                      Start AI Legal Presenter
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#c9a84c", fontWeight: 600, marginTop: "6px", background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: "10px", border: "1px solid rgba(201,168,76,0.3)" }}>
                      🎥 Sync Video/Audio in {avatarScripts[avatarLang]?.name}
                    </span>
                  </div>
                )}

                {/* ACTIVE PLAYING STATE: LIVE TELEPROMPTER & EQUALIZER WAVES */}
                {isPlayingVideo && (
                  <>
                    <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(9, 13, 22, 0.9)", padding: "4px 10px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "6px", border: "1px solid rgba(34,197,94,0.5)", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
                      <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }}></span>
                      <span style={{ fontSize: "0.65rem", color: "#22c55e", fontWeight: 800, letterSpacing: "1px" }}>AI NARRATION</span>
                      <div style={{ display: "flex", gap: "2px", alignItems: "center", height: "12px", marginLeft: "4px" }}>
                        <span style={{ display: "inline-block", width: "2px", height: speechSynthesisActive ? "12px" : "3px", background: "#38bdf8", transition: "height 0.2s" }}></span>
                        <span style={{ display: "inline-block", width: "2px", height: speechSynthesisActive ? "6px" : "3px", background: "#38bdf8", transition: "height 0.2s" }}></span>
                        <span style={{ display: "inline-block", width: "2px", height: speechSynthesisActive ? "14px" : "3px", background: "#38bdf8", transition: "height 0.2s" }}></span>
                        <span style={{ display: "inline-block", width: "2px", height: speechSynthesisActive ? "8px" : "3px", background: "#38bdf8", transition: "height 0.2s" }}></span>
                      </div>
                    </div>

                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(5, 8, 16, 0.96) 0%, rgba(9, 13, 22, 0.85) 75%, transparent 100%)", padding: "16px 16px 10px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#fff", lineHeight: 1.4, fontStyle: "italic", textShadow: "0 2px 4px rgba(0,0,0,0.9)", maxHeight: "48px", overflowY: "auto", fontWeight: 500 }}>
                        "{activeCaption}"
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* BELOW VIDEO: CLEAN EXECUTIVE CASE STATEMENT */}
              <div style={{ background: "rgba(255, 255, 255, 0.025)", border: "1px solid rgba(255, 255, 255, 0.08)", borderLeft: "4px solid #c9a84c", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.9rem" }}>📜</span>
                  <span style={{ fontSize: "0.75rem", color: "#c9a84c", fontWeight: 800, letterSpacing: "0.6px", textTransform: "uppercase" }}>
                    Case Assessment Summary
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.5, margin: 0, maxHeight: "70px", overflowY: "auto", paddingRight: "6px" }}>
                  {(avatarLang === "en" && interceptionData?.script) 
                    ? interceptionData.script 
                    : (avatarScripts[avatarLang]?.script || interceptionData?.script)}
                </p>
              </div>

              {/* MEDIATION VS LITIGATION COMPARISON (DARK THEME) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "rgba(22, 163, 74, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "12px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                  <div style={{ fontWeight: 800, color: "#4ade80", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <span style={{ fontSize: "1rem" }}>⚖️</span> {activeComp.mTitle}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "18px", color: "rgba(255, 255, 255, 0.8)", fontSize: "0.75rem", lineHeight: 1.6 }}>
                    {activeComp.mPoints.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "12px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                  <div style={{ fontWeight: 800, color: "#f87171", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <span style={{ fontSize: "1rem" }}>🏛️</span> {activeComp.lTitle}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "18px", color: "rgba(255, 255, 255, 0.8)", fontSize: "0.75rem", lineHeight: 1.6 }}>
                    {activeComp.lPoints.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* BOTTOM ACTIONS BAR */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "16px", flexWrap: "wrap", gap: "10px" }}>
                <button
                  onClick={() => {
                    if (isPlayingVideo) handleStopAvatarVideo();
                    setShowMediationInterception(false);
                    setFormData(prev => ({...prev, mediationRequested: false}));
                    setStep(3);
                  }}
                  style={{
                    background: "transparent",
                    color: "rgba(255,255,255,0.65)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => { e.target.style.color = "#fff"; e.target.style.borderColor = "rgba(255,255,255,0.5)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseOut={(e) => { e.target.style.color = "rgba(255,255,255,0.65)"; e.target.style.borderColor = "rgba(255,255,255,0.25)"; e.target.style.background = "transparent"; }}
                >
                  ⚡ Skip & Proceed to Court Filing
                </button>
                
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {isPlayingVideo && (
                    <button
                      onClick={handleStopAvatarVideo}
                      style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.4)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                      onMouseOver={(e) => e.target.style.background = "rgba(239,68,68,0.3)"}
                      onMouseOut={(e) => e.target.style.background = "rgba(239,68,68,0.15)"}
                    >
                      ⏹️ Stop Narration
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (isPlayingVideo) handleStopAvatarVideo();
                      setShowMediationInterception(false);
                      setFormData(prev => ({...prev, mediationRequested: true}));
                      setStep(4);
                    }}
                    style={{
                      background: "linear-gradient(135deg, #c9a84c 0%, #a88520 100%)",
                      color: "#090d16",
                      border: "1px solid #e2c46e",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontWeight: 800,
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(201,168,76,0.3)",
                      transition: "all 0.2s",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px"
                    }}
                    onMouseOver={(e) => { e.target.style.boxShadow = "0 6px 20px rgba(201,168,76,0.4)"; e.target.style.transform = "translateY(-1px)"; }}
                    onMouseOut={(e) => { e.target.style.boxShadow = "0 4px 15px rgba(201,168,76,0.3)"; e.target.style.transform = "translateY(0)"; }}
                  >
                    Opt-in for Pre-Litigation Mediation →
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 🏆 EXPERT MATCHING SUCCESS MODAL */}
        {showSuccessModal && (
          <div className="expert-modal-overlay">
            <div className="expert-modal-card" style={{ maxHeight: "82vh", overflowY: "auto", padding: "26px", maxWidth: "580px" }}>
              {isConnecting ? (
                <div className="connecting-view">
                  <div className="pulse-loader">⚖️</div>
                  <h2 className="modal-title">Connecting to Advocate...</h2>
                  <p className="modal-subtitle">Your case details are being shared with the expert. Please wait.</p>
                </div>
              ) : (
                <>
                  <div className="modal-confetti">🏢</div>
                  <h2 className="modal-title">Case Filed Successfully!</h2>
                  <p className="modal-subtitle">
                    We've found {matchedLawyers.length} verified advocate{matchedLawyers.length === 1 ? '' : 's'} qualified to represent your {formData.legalType} case.
                  </p>
                  
                  <div className="matched-lawyers-list" style={{ marginTop: "14px" }}>
                    {matchedLawyers.length > 0 ? (
                      matchedLawyers.map(lawyer => (
                        <div key={lawyer._id} className="matched-lawyer-item" style={{ background: lawyer.isDirectMatch ? "#fff" : "#f8fafc", border: lawyer.isDirectMatch ? "1px solid #e2e8f0" : "1px dashed #cbd5e1", padding: "12px 14px", borderRadius: "10px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                          <div style={{ display: "flex", gap: "12px", alignItems: "center", textAlign: "left" }}>
                            <div className="lawyer-avatar" style={{ fontSize: "1.5rem", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", borderRadius: "50%" }}>⚖️</div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a" }}>{lawyer.name}</h4>
                                <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: lawyer.isDirectMatch ? "#dcfce7" : "#e0f2fe", color: lawyer.isDirectMatch ? "#166534" : "#0369a1", fontWeight: 600 }}>
                                  {lawyer.isDirectMatch ? "Direct Specialist" : "Cross-Specialization Expert"}
                                </span>
                              </div>
                              <div style={{ fontSize: "0.78rem", color: "#334155", margin: "3px 0", fontWeight: 500 }}>
                                Primary: {lawyer.specialization} · <span style={{ color: "#64748b" }}>Can handle: {formData.legalType}</span>
                              </div>
                              <div style={{ display: "flex", gap: "10px", fontSize: "0.75rem", color: "#64748b" }}>
                                <span>⭐ {lawyer.rating || "5.0"}</span>
                                <span>💼 {lawyer.experience || "5+"} yrs exp</span>
                              </div>
                            </div>
                          </div>
                          <button className="connect-btn" onClick={() => handleConnect(lawyer._id)} style={{ flexShrink: 0, padding: "8px 14px", fontSize: "0.82rem", background: "var(--gold, #c9a84c)", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Connect</button>
                        </div>
                      ))
                    ) : (
                      <div className="no-experts-fallback">
                        <p>No immediate matches found. Our legal team is reviewing your case and will connect with you shortly.</p>
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button className="view-cases-btn" onClick={() => navigate("/cases")}>Go to Dashboard</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        <LanguageModal
          isOpen={isLangModalOpen}
          onClose={() => setIsLangModalOpen(false)}
          selectedLang={avatarLang}
          onSelect={(code) => {
            setAvatarLang(code);
            if (isPlayingVideo) handleStopAvatarVideo();
          }}
        />
      </main>
    </div>
  );
}
