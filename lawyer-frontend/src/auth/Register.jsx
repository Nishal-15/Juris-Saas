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

          <div className="input-group full-width" style={{ position: 'relative' }}>
            <label>PASSWORD</label>
            <input 
              type={showPass ? "text" : "password"}
              required 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              placeholder="Secure Password"
              style={{ paddingRight: '40px' }}
            />
            <button 
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: '12px', top: '42px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 0 }}
            >
              {showPass ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </button>
          </div>

          <button type="submit" className="btn-primary-gold" disabled={loading}>
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
