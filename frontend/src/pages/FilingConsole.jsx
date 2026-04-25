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
    legalType: "Civil",
    incidentDate: "",
    oppositeParty: "",
    urgency: "Normal"
  });
  const [aiMessage, setAiMessage] = useState("Ready to help. I can assist you with your legal case filing!");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const navigate = useNavigate();

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

  // ✨ MAGIC AUTO-FILL: AI Analyze the story
  const handleAIAutoFill = async () => {
    if (formData.description.length < 20) return;
    setIsAnalyzing(true);
    setAiMessage("JurisBot AI is analyzing your story to generate a professional title...");
    try {
      const res = await axios.post("/cases/analyze-story", { description: formData.description });
      setFormData(prev => ({ 
        ...prev, 
        title: res.data.title || prev.title,
        category: res.data.category || prev.category,
        legalType: res.data.legalType || prev.legalType
      }));
      setAiMessage("✨ Magic! I've suggested a Title and Category for you based on your story.");
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
      await axios.post("/cases", formData);
      alert("✅ Your case has been successfully filed!");
      navigate("/cases");
    } catch (err) {
      alert("Failed to file case.");
    } finally {
      setLoading(false);
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
                    <option value="Civil">Civil</option>
                    <option value="Criminal">Criminal</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Family">Family</option>
                    <option value="Labor">Labor</option>
                    <option value="Taxation">Taxation</option>
                    <option value="Cyber">Cyber</option>
                  </select>
                </div>

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
                  disabled={!formData.description.trim()} 
                  onClick={() => setStep(3)}
                >
                  Proceed to Evidence →
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
      </main>
    </div>
  );
}
