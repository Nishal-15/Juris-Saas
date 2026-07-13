import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    barId: "",
    experience: "",
    specialization: ""
  });
  const [file, setFile] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFile = (e) => setFile(e.target.files[0]);
  const handleAvatar = (e) => setAvatar(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 3: Proceed with multipart registration
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (file) data.append("certificate", file);
      if (avatar) data.append("avatar", avatar);

      const res = await axios.post("/auth/register-lawyer", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert(res.data.message);
      // Redirect to login or verification pending page
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card pro-onboarding">
        <div className="auth-header">
          <h1 className="logo-text gold-gradient">JurisBot <span className="pro-badge">PRO</span></h1>
          <h2>Legal Practitioner Onboarding</h2>
          <p>Register your credentials to join India's elite legal network.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-grid">
            <div className="input-group">
              <label>FULL NAME</label>
              <input 
                type="text" 
                required 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                placeholder="As per Bar Enrollment"
              />
            </div>

            <div className="input-group">
              <label>EMAIL ID</label>
              <input 
                type="email" 
                required 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                placeholder="professional@email.com"
              />
            </div>

            <div className="input-group">
              <label>PHONE NUMBER</label>
              <input 
                type="tel" 
                required 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div className="input-group">
              <label>BAR COUNCIL ID</label>
              <input 
                type="text" 
                required 
                onChange={(e) => setFormData({ ...formData, barId: e.target.value })} 
                placeholder="BCI/XX/XXXXX"
              />
            </div>

            <div className="input-group">
              <label>EXPERIENCE (YEARS)</label>
              <input 
                type="number" 
                required 
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })} 
                placeholder="e.g. 10"
              />
            </div>

            <div className="input-group">
              <label>SPECIALIZATION</label>
              <input 
                type="text" 
                required 
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} 
                placeholder="Criminal, Corporate, etc."
              />
            </div>

            <div className="input-group">
              <label>PROFESSIONAL PORTRAIT</label>
              <div className="file-upload-wrapper" style={{ height: "45px" }}>
                <input type="file" required onChange={handleAvatar} accept="image/*" />
                <div className="file-dummy">
                  <span>{avatar ? avatar.name : "Select Portrait"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="input-group full-width">
            <label>ENROLLMENT CERTIFICATE (PDF/IMAGE)</label>
            <div className="file-upload-wrapper">
              <input type="file" required onChange={handleFile} accept=".pdf,.jpg,.jpeg,.png" />
              <div className="file-dummy">
                <span>{file ? file.name : "Click to upload document"}</span>
              </div>
            </div>
          </div>

          <div className="input-group full-width">
            <label>PASSWORD</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPass ? "text" : "password"}
                required 
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                placeholder="Secure Password"
                style={{ width: '100%', paddingRight: '40px' }}
              />
              <button 
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >
                {showPass ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'flex-start', marginTop: '15px', marginBottom: '15px', gridColumn: '1 / -1' }}>
            <input 
              type="checkbox" 
              id="lawyer-terms" 
              onChange={e => setAgreed(e.target.checked)} 
              style={{ width: '16px', height: '16px', marginTop: '3px', cursor: 'pointer' }}
            />
            <label htmlFor="lawyer-terms" style={{ color: 'var(--muted)', fontSize: '14px', textTransform: 'none', letterSpacing: 'normal', cursor: 'pointer', margin: 0, textAlign: 'left', lineHeight: '1.5' }}>
              I agree to the <span onClick={(e) => { e.preventDefault(); setShowTerms(true); }} style={{ textDecoration: 'underline', color: 'var(--gold)' }}>Professional Terms of Service</span> and Privacy Policy. I confirm that the credentials provided are accurate and authorize JurisBot to verify them with the respective Bar Council.
            </label>
          </div>

          {/* Terms Modal */}
          {showTerms && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#0f111a', border: '1px solid #c9a84c', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
                <button type="button" onClick={() => setShowTerms(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✖</button>
                <h2 style={{ color: 'var(--gold)', marginBottom: '15px', fontFamily: 'Playfair Display', textTransform: 'none' }}>JurisBot Professional Terms</h2>
                <div style={{ color: '#c9d1d9', fontSize: '14px', lineHeight: '1.6', textTransform: 'none', letterSpacing: 'normal' }}>
                  <p><strong>1. Verification of Credentials:</strong> By registering as a Legal Practitioner, you grant JurisBot the authorization to verify your Bar Council ID and provided credentials with the respective state or national Bar Councils. Falsifying credentials will lead to a permanent ban and potential legal action.</p>
                  <p><strong>2. Professional Conduct:</strong> You agree to maintain the highest standard of professional ethics when communicating with citizens. JurisBot provides a medium for consultation; however, any formal retainer must be executed independently of the platform.</p>
                  <p><strong>3. Use of AI Tools:</strong> Our AI Drafter and Analyzer are assistive tools. You are solely responsible for reviewing and verifying all AI-generated drafts before filing them in any court of law.</p>
                  <p><strong>4. Confidentiality:</strong> You agree to uphold strict attorney-client privilege regarding any case details discussed or shared by citizens over the platform.</p>
                  <p><strong>5. Acceptance:</strong> Checking the box constitutes your digital signature and binding agreement to these Professional Terms of Service.</p>
                </div>
                <button type="button" onClick={() => setShowTerms(false)} style={{ width: '100%', background: 'var(--gold)', border: 'none', padding: '12px', color: '#0f111a', fontWeight: 'bold', marginTop: '20px', borderRadius: '6px', cursor: 'pointer' }}>Close and Continue</button>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary-gold" disabled={loading || !agreed}>
            {loading ? "PROCESSING..." : "SUBMIT FOR VERIFICATION"}
          </button>
        </form>

        <p className="auth-footer">
          Already have a pro account? <Link to="/">Login here</Link>
        </p>
      </div>
    </div>
  );
}
