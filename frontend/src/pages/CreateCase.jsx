import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import axiosInstance from "../api/axios"; 
import "./createcase.css";

const CATEGORIES = [
  { id: "prop", icon: "🏠", label: "Property" },
  { id: "fam", icon: "👨‍👩‍👧", label: "Family" },
  { id: "crim", icon: "⚖️", label: "Criminal" },
  { id: "corp", icon: "🏢", label: "Corporate" },
  { id: "tax", icon: "💰", label: "Taxation" },
  { id: "other", icon: "📝", label: "Other" },
];

export default function CreateCase() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "prop",
    description: "",
    urgency: "Normal"
  });

  const handleCreate = async () => {
    if (loading) return; // Prevent double clicks
    
    if (!form.title.trim() || !form.description.trim()) {
      alert("Please provide both a title and a detailed description.");
      return;
    }

    setLoading(true);
    try {
      const selected = CATEGORIES.find(c => c.id === form.category);
      const payload = {
        title: form.title,
        description: form.description,
        type: selected?.label || "General",
        urgency: form.urgency
      };

      console.log("Filing Case Request:", payload);
      
      const response = await axiosInstance.post("/cases", payload);
      
      console.log("Filing Case Response:", response.data);
      alert("✅ Success: Case Filed! Matching you with relevant advocates now.");
      navigate(`/lawyers?type=${selected?.label || "General"}`);
    } catch (error) {
      console.error("CASE FILING ERROR:", error);
      const msg = error.response?.data?.message || error.message || "Failed to submit. Please check your connection.";
      alert("Submission Error: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-case-page">
      <Sidebar />
      <main className="case-main">
        <div className="case-form-container">
          
          <header className="case-header">
            <h1>Start New Consultation</h1>
            <p>Describe your issue for instant AI analysis and lawyer matching.</p>
          </header>

          <div className="case-steps">
            {[1, 2, 3].map(s => (
              <div key={s} className={`step-pip ${step >= s ? 'active' : ''}`} />
            ))}
          </div>

          <div className="case-card">
            {step === 1 && (
              <div className="step-content">
                <div className="form-group">
                  <label>Case Headline</label>
                  <input 
                    className="form-control" 
                    placeholder="e.g. Property inheritance dispute"
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                  />
                  <p className="form-helper">Make it descriptive but brief.</p>
                </div>

                <div className="form-group">
                  <label>Choose Category</label>
                  <div className="category-grid">
                    {CATEGORIES.map(cat => (
                      <div 
                        key={cat.id} 
                        className={`cat-item ${form.category === cat.id ? 'active' : ''}`}
                        onClick={() => setForm({...form, category: cat.id})}
                      >
                        <span className="cat-icon">{cat.icon}</span>
                        <span className="cat-label">{cat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step-content">
                <div className="form-group">
                  <label>Details & Context</label>
                  <textarea 
                    className="form-control" 
                    style={{ minHeight: '180px' }}
                    placeholder="Explain the background, key dates, and involved parties..."
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select 
                    className="form-control"
                    value={form.urgency}
                    onChange={(e) => setForm({...form, urgency: e.target.value})}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-content" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: "50px", marginBottom: "20px" }}>⚖️</div>
                <h3>Review & Submit</h3>
                <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>
                  Review your information. Once submitted, our AI will match you with advocates.
                </p>
                <div style={{ textAlign: 'left', background: 'var(--bg-3)', padding: '20px', borderRadius: '12px' }}>
                  <p><strong>Title:</strong> {form.title}</p>
                  <p><strong>Category:</strong> {CATEGORIES.find(c => c.id === form.category)?.label}</p>
                </div>
              </div>
            )}

            <div className="case-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setStep(prev => Math.max(1, prev - 1))}
                disabled={step === 1}
              >
                Back
              </button>
              
              {step < 3 ? (
                <button className="btn-large" onClick={() => setStep(prev => prev + 1)}>
                  Next Step
                </button>
              ) : (
                <button className="btn-large" onClick={handleCreate} disabled={loading}>
                  {loading ? "Filing..." : "Complete Submission"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
