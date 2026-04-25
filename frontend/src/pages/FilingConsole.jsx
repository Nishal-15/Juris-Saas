import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import "./createcase.css";

export default function FilingConsole() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Home & Property",
    oppositeParty: "",
    urgency: "Normal",
    documents: []
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const categories = [
    { id: "property", label: "Home & Property", icon: "🏠", desc: "Problems with land, rent, or neighbors" },
    { id: "work",     label: "Job & Salary",     icon: "💼", desc: "Issues with boss, pay, or contracts" },
    { id: "family",   label: "Family Matters",   icon: "❤️", desc: "Marriage, children, or inheritance" },
    { id: "money",    label: "Money & Loans",    icon: "💰", desc: "Cheques, debt, or bank issues" },
    { id: "other",    label: "Something Else",   icon: "⚖️", desc: "Any other legal problem" }
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Map layman category back to internal role-based category if needed, or just send as is
      await axios.post("/cases", formData);
      alert("✅ Your case has been successfully filed! We are matching you with the best legal experts.");
      navigate("/cases");
    } catch (err) {
      alert("Failed to file case. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wizard-page">
      <Sidebar />
      
      <main className="wizard-main">
        {/* Progress Bar */}
        <div className="wizard-header">
          <div className="wizard-progress">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`wizard-step-node ${step >= s ? 'active' : ''}`}>
                <div className="node-circle">{s}</div>
                <span className="node-label">
                  {s === 1 ? "Basic Info" : s === 2 ? "Details" : s === 3 ? "Evidence" : "Finish"}
                </span>
              </div>
            ))}
            <div className="wizard-progress-line">
              <div className="line-fill" style={{ width: `${(step - 1) * 33.33}%` }}></div>
            </div>
          </div>
        </div>

        <div className="wizard-content">
          {/* STEP 1: CATEGORY SELECTION */}
          {step === 1 && (
            <div className="wizard-slide fade-in">
              <h1 className="wizard-title">What is the main problem?</h1>
              <p className="wizard-subtitle">Select the option that best describes your situation.</p>
              
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
                <button className="wizard-btn-next" onClick={() => setStep(2)}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <div className="wizard-slide fade-in">
              <h1 className="wizard-title">Tell us your story</h1>
              <p className="wizard-subtitle">Describe what happened in simple words. The more detail, the better.</p>
              
              <div className="wizard-form-box">
                <div className="form-group">
                  <label>Give this a short name (e.g. Salary Dispute)</label>
                  <input 
                    className="wizard-input"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Short summary..."
                  />
                </div>

                <div className="form-group">
                  <label>Tell us what happened</label>
                  <textarea 
                    className="wizard-textarea"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe your problem here..."
                    rows="8"
                  />
                </div>

                <div className="form-group">
                  <label>Who is this against? (Opposite Party)</label>
                  <input 
                    className="wizard-input"
                    value={formData.oppositeParty}
                    onChange={e => setFormData({...formData, oppositeParty: e.target.value})}
                    placeholder="Name of person or company"
                  />
                </div>
              </div>

              <div className="wizard-actions">
                <button className="wizard-btn-back" onClick={() => setStep(1)}>← Back</button>
                <button className="wizard-btn-next" onClick={() => setStep(3)}>Add Proof →</button>
              </div>
            </div>
          )}

          {/* STEP 3: EVIDENCE */}
          {step === 3 && (
            <div className="wizard-slide fade-in">
              <h1 className="wizard-title">Show us the Proof</h1>
              <p className="wizard-subtitle">Upload any photos, bills, or documents that can help your case.</p>
              
              <div className="upload-zone">
                <div className="upload-box">
                  <span className="upload-icon">📁</span>
                  <p>Click or drag files to upload</p>
                  <span>Supports: PDF, JPG, PNG</span>
                </div>
              </div>

              <div className="wizard-actions">
                <button className="wizard-btn-back" onClick={() => setStep(2)}>← Back</button>
                <button className="wizard-btn-next" onClick={() => setStep(4)}>Final Review →</button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {step === 4 && (
            <div className="wizard-slide fade-in">
              <h1 className="wizard-title">Ready to File?</h1>
              <p className="wizard-subtitle">Please review your information before submitting to our legal team.</p>
              
              <div className="review-card">
                <div className="review-item">
                  <span className="review-label">PROBLEM TYPE</span>
                  <span className="review-val">{formData.category}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">SUBJECT</span>
                  <span className="review-val">{formData.title || "Not specified"}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">AGAINST</span>
                  <span className="review-val">{formData.oppositeParty || "Not specified"}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">STORY</span>
                  <p className="review-desc">{formData.description || "No description provided."}</p>
                </div>
              </div>

              <div className="wizard-actions">
                <button className="wizard-btn-back" onClick={() => setStep(3)}>← Edit</button>
                <button className="wizard-btn-submit" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Filing Case..." : "SUBMIT TO LEGAL TEAM"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Assistant Bubble (Design purely visual as per mockup) */}
        <div className="wizard-ai-bubble">
          <div className="ai-avatar">🤖</div>
          <div className="ai-text">
            Need help? Describe your problem and I will categorize it for you!
          </div>
        </div>
      </main>
    </div>
  );
}
