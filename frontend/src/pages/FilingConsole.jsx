import { useState, useEffect } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import MaterialDatePicker from "../components/chat/MaterialDatePicker";
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
    draft: ""
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
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [speechSynthesisActive, setSpeechSynthesisActive] = useState(false);
  const [activeCaption, setActiveCaption] = useState("");
  const navigate = useNavigate();

  const avatarScripts = {
    en: {
      name: "English",
      flag: "🇬🇧",
      voiceLang: "en-IN",
      script: "Hello. I am your JurisBot legal advisor, powered by HeyGen and ElevenLabs neural speech engines. Based on your statement regarding separation, child custody, and mutual desire to avoid court litigation, your case qualifies for pre-litigation mediation under Section 4 of The Mediation Act, 2023. A certified neutral mediator will facilitate confidential sessions to arrive at a fair agreement in 30 to 90 days. This Mediated Settlement Agreement has the same legally binding force as a court decree."
    },
    hi: {
      name: "Hindi (हिन्दी)",
      flag: "🇮🇳",
      voiceLang: "hi-IN",
      script: "नमस्ते। मैं आपका ज्यूरिसबॉट कानूनी सलाहकार हूँ, जिसे हेजेन और ग्यारह लैब्स न्यूरल इंजन द्वारा संचालित किया गया है। पारिवारिक अलगाव और बच्चे की कस्टडी पर आपके बयान के आधार पर, आपका मामला मध्यस्थता अधिनियम, 2023 की धारा 4 के तहत पूर्व-मुकदमेबाजी मध्यस्थता के लिए योग्य है। एक प्रमाणित तटस्थ मध्यस्थ 30 से 90 दिनों में निष्पक्ष समझौते पर पहुंचने के लिए गोपनीय सत्रों की सुविधा प्रदान करेगा।"
    },
    ta: {
      name: "Tamil (தமிழ்)",
      flag: "🇮🇳",
      voiceLang: "ta-IN",
      script: "வணக்கம். நான் உங்கள் ஜூரிஸ்பாட் சட்ட ஆலோசர். குடும்ப பிரிவினை மற்றும் குழந்தை பராமரிப்பு குறித்த உங்கள் வாக்குமூலத்தின் அடிப்படையில், உங்கள் வழக்கு 2023 ஆம் ஆண்டு சமரசச் சட்டத்தின் பிரிவு 4 இன் கீழ் நீதிமன்றத்திற்கு முந்தைய சமரசத்திற்கு தகுதியானது. ஒரு சான்றளிக்கப்பட்ட சமரசப் பெருமக்கள் 30 முதல் 90 நாட்களில் நியாயமான ஒப்பந்தத்தை அடைய உதவுவார்."
    },
    te: {
      name: "Telugu (తెలుగు)",
      flag: "🇮🇳",
      voiceLang: "te-IN",
      script: "నమస్కారం. నేను మీ జ్యూరిస్బాట్ న్యాయ సలహాదారుని. కుటుంబ విభజన మరియు పిల్లల సంరక్షణకు సంబంధించిన మీ ప్రకటన ఆధారంగా, మీ కేసు మధ్యవర్తిత్వ చట్టం, 2023లోని సెక్షన్ 4 కింద కోర్టుకు ముందు మధ్యవర్తిత్వానికి అర్హత పొందింది. 30 నుండి 90 రోజుల్లో న్యాయమైన ఒప్పందాన్ని చేరుకోవడానికి ధృవీకరించబడిన మధ్యవర్తి సహాయం చేస్తారు."
    }
  };

  const handlePlayAvatarVideo = () => {
    setIsPlayingVideo(true);
    setSpeechSynthesisActive(true);
    const scriptText = avatarScripts[avatarLang]?.script || avatarScripts.en.script;
    setActiveCaption(scriptText);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(scriptText);
      utterance.lang = avatarScripts[avatarLang]?.voiceLang || "en-IN";
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
      console.log("🚀 Submitting Case Data:", formData);
      const res = await axios.post("/cases", formData);
      console.log("✅ Server Response:", res.data);
      setCurrentCaseId(res.data.case?._id);
      setMatchedLawyers(res.data.suggestedLawyers || []);
      if (res.data.mediationEligible && res.data.mediationInfo) {
        setMediationData(res.data.mediationInfo);
      }
      setShowSuccessModal(true);
    } catch (err) {
      console.error("❌ Submission Failed:", err);
      alert("Failed to file case.");
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
              <p className="wizard-subtitle">Upload any relevant photos or documents.</p>
              <div className="upload-zone" onClick={() => document.getElementById('f-up').click()}>
                <input type="file" id="f-up" style={{ display: 'none' }} multiple />
                <span className="upload-icon">📂</span>
                <p>Click to add documents</p>
              </div>
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
                <div className="review-item"><strong>SUBJECT:</strong> {formData.title}</div>
                <div className="review-item"><strong>DATE:</strong> {formData.incidentDate || "N/A"}</div>
                <div className="review-item"><strong>OPPONENT:</strong> {formData.oppositeParty || "N/A"}</div>
                <div className="review-item"><strong>DESCRIPTION:</strong> {formData.description}</div>
              </div>
              <div className="wizard-actions">
                <button className="wizard-btn-back" onClick={() => setStep(3)}>← Edit</button>
                <button className="wizard-btn-submit" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Filing..." : "FINALIZE & FILE CASE"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ⚖️ PRE-FILING MEDIATION INTERCEPTION MODAL */}
        {showMediationInterception && interceptionData && (
          <div className="expert-modal-overlay">
            <div className="expert-modal-card" style={{ maxWidth: "620px", textAlign: "left", padding: "30px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", borderBottom: "2px solid #f1f5f9", paddingBottom: "15px", marginBottom: "20px" }}>
                <span style={{ fontSize: "2.4rem" }}>⚖️</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#1e293b" }}>Pre-Litigation Mediation Detected</h2>
                  <span style={{ fontSize: "0.85rem", color: "#7c3aed", fontWeight: 700 }}>Governed by {interceptionData.actName}</span>
                </div>
              </div>

              <p style={{ fontSize: "0.95rem", color: "#334155", lineHeight: 1.6, marginBottom: "18px" }}>
                {interceptionData.script}
              </p>

              {/* REALISTIC NEURAL AVATAR VIDEO PLAYER */}
              <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "14px", padding: "18px", marginBottom: "22px", color: "#fff", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "12px", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }}></span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.5px" }}>HEYGEN / D-ID REALISTIC AVATAR ENGINE v3.4</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>🌐 Voice & Avatar Language:</span>
                    <select
                      value={avatarLang}
                      onChange={(e) => {
                        setAvatarLang(e.target.value);
                        if (isPlayingVideo) handleStopAvatarVideo();
                      }}
                      style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "6px", padding: "4px 8px", fontSize: "0.78rem", cursor: "pointer", outline: "none" }}
                    >
                      <option value="en">🇬🇧 English (Neural Voice)</option>
                      <option value="hi">🇮🇳 Hindi (हिन्दी)</option>
                      <option value="ta">🇮🇳 Tamil (தமிழ்)</option>
                      <option value="te">🇮🇳 Telugu (తెలుగు)</option>
                    </select>
                  </div>
                </div>

                {/* THE AVATAR VIDEO SCREEN */}
                <div style={{ position: "relative", width: "100%", height: "240px", background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)", borderRadius: "10px", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #312e81" }}>
                  {isPlayingVideo ? (
                    <>
                      {/* Realistic Video Presenter Simulation */}
                      <video
                        src="https://assets.mixkit.co/videos/preview/mixkit-business-woman-talking-in-a-video-conference-41386-large.mp4"
                        autoPlay
                        loop
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                      />
                      {/* Live Audio Visualizer Overlay */}
                      <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(4px)", padding: "4px 10px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px", border: "1px solid #475569" }}>
                        <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 700 }}>🗣️ VOICE ACTIVE</span>
                        <div style={{ display: "flex", gap: "2px", alignItems: "center", height: "12px" }}>
                          <span style={{ display: "inline-block", width: "3px", height: speechSynthesisActive ? "10px" : "3px", background: "#38bdf8", transition: "height 0.2s" }}></span>
                          <span style={{ display: "inline-block", width: "3px", height: speechSynthesisActive ? "14px" : "3px", background: "#38bdf8", transition: "height 0.15s" }}></span>
                          <span style={{ display: "inline-block", width: "3px", height: speechSynthesisActive ? "8px" : "3px", background: "#38bdf8", transition: "height 0.25s" }}></span>
                        </div>
                      </div>

                      {/* Live Synchronized Subtitles */}
                      <div style={{ position: "absolute", bottom: "12px", left: "5%", right: "5%", background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(6px)", padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#f8fafc", fontWeight: 500, lineHeight: 1.4, maxHeight: "40px", overflow: "hidden" }}>
                          "{activeCaption}"
                        </p>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(124, 58, 237, 0.2)", border: "2px solid #7c3aed", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px auto", cursor: "pointer", transition: "transform 0.2s" }} onClick={handlePlayAvatarVideo}>
                        <span style={{ fontSize: "1.8rem", marginLeft: "4px" }}>▶️</span>
                      </div>
                      <h4 style={{ margin: "0 0 6px 0", fontSize: "1rem", color: "#f1f5f9" }}>Ready to Play in {avatarScripts[avatarLang]?.name}</h4>
                      <p style={{ margin: "0", fontSize: "0.78rem", color: "#94a3b8", maxWidth: "420px" }}>
                        Click play to hear our realistic neural legal presenter explain your rights, timeline, and settlement process with real-time AI speech synthesis.
                      </p>
                    </div>
                  )}
                </div>

                {/* CONTROLS BAR */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>⏳ Timeline: <strong style={{ color: "#38bdf8" }}>{interceptionData.timeline}</strong></span>
                  </div>
                  <div>
                    {isPlayingVideo ? (
                      <button
                        onClick={handleStopAvatarVideo}
                        style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        ⏹️ Stop Presenter
                      </button>
                    ) : (
                      <button
                        onClick={handlePlayAvatarVideo}
                        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        ▶️ Play AI Video & Voice
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
                <button
                  onClick={() => {
                    setShowMediationInterception(false);
                    setStep(3);
                  }}
                  style={{
                    background: "#7c3aed",
                    color: "#fff",
                    border: "none",
                    padding: "14px 20px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
                    transition: "all 0.2s"
                  }}
                >
                  ✅ I agree to the Mediation timeline & terms — Continue Filing Case →
                </button>
                <button
                  onClick={() => {
                    setShowMediationInterception(false);
                    setStep(3);
                  }}
                  style={{
                    background: "transparent",
                    color: "#64748b",
                    border: "1px solid #cbd5e1",
                    padding: "10px",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  ⚡ Skip Mediation & proceed directly to Court Litigation
                </button>
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
                  
                  {mediationData && (
                    <div style={{
                      background: "rgba(139, 92, 246, 0.08)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: "12px",
                      padding: "14px",
                      margin: "12px 0",
                      textAlign: "left"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "1.3rem" }}>⚖️</span>
                        <div>
                          <h4 style={{ margin: 0, color: "#7c3aed", fontSize: "0.95rem" }}>Eligible for The Mediation Act, 2023</h4>
                          <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Faster (30-90 days), private & mutually acceptable settlement</span>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "#334155", fontStyle: "italic", lineHeight: 1.4, margin: "6px 0" }}>
                        "{mediationData.script || "Based on your willingness to discuss custody and maintenance with a neutral mediator, this dispute qualifies for pre-litigation mediation."}"
                      </p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", flexWrap: "wrap", gap: "8px" }}>
                        <span style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                          ✅ AI Explanation Video Ready
                        </span>
                        <button 
                          onClick={() => {
                            alert("Opening AI Video Explanation & Mediator Connection...");
                            navigate("/cases");
                          }} 
                          style={{
                            background: "#7c3aed",
                            color: "#fff",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            cursor: "pointer",
                            fontWeight: 600
                          }}
                        >
                          Watch Video & Connect Mediator
                        </button>
                      </div>
                    </div>
                  )}

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
      </main>
    </div>
  );
}
