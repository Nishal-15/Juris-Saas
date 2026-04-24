import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import CustomDatePicker from "../components/common/CustomDatePicker";
import "./createcase.css";

export default function FilingConsole() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Civil",
    incidentDate: "",
    location: "",
    urgency: "Normal"
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const categories = ["Civil", "Criminal", "Corporate", "Family", "Labor", "Taxation", "Cyber"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/cases", formData);
      alert("✅ Legal Case Filed Successfully! Matching your matter with specialized experts...");
      navigate(`/lawyers?type=${formData.category}`);
    } catch (err) {
      alert("Failed to file case. Please try again.");
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
            <h1>Case Filing Console</h1>
            <p>Submit your legal matter for professional evaluation.</p>
          </header>

          <div className="case-steps">
            <div className={`step-pip ${step >= 1 ? 'active' : ''}`} />
            <div className={`step-pip ${step >= 2 ? 'active' : ''}`} />
            <div className={`step-pip ${step >= 3 ? 'active' : ''}`} />
          </div>

          <div className="case-card">
            {step === 1 && (
              <div className="wizard-body">
                <h3>General Information</h3>
                <div className="form-group">
                  <label>Case Title / Subject</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Briefly describe the matter"
                  />
                </div>
                <div className="form-group">
                  <label>Legal Category</label>
                  <select 
                    className="form-control"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="case-footer">
                  <div />
                  <button className="btn-large" onClick={() => setStep(2)}>Continue</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="wizard-body">
                <h3>Incident Context</h3>
                <div className="form-group">
                  <CustomDatePicker 
                    label="Date of Incident"
                    value={formData.incidentDate}
                    onChange={date => setFormData({...formData, incidentDate: date})}
                  />
                </div>
                <div className="form-group">
                  <label>Location / Jurisdiction</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. Mumbai, Maharashtra"
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Detailed Description</label>
                  <textarea 
                    className="form-control"
                    rows="6"
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Provide a comprehensive narrative of the facts..."
                  ></textarea>
                </div>
                <div className="case-footer">
                  <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                  <button className="btn-large" onClick={() => setStep(3)}>Final Review</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="wizard-body">
                <h3>Review Submission</h3>
                <div className="review-summary">
                  <p><strong>Title:</strong> {formData.title}</p>
                  <p><strong>Category:</strong> {formData.category}</p>
                  <p><strong>Description:</strong> {formData.description.substring(0, 300)}...</p>
                </div>
                <div className="case-footer">
                  <button className="btn-secondary" onClick={() => setStep(2)}>Edit Details</button>
                  <button className="btn-large" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Filing..." : "Submit Case"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
