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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFile = (e) => setFile(e.target.files[0]);
  const handleAvatar = (e) => setAvatar(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (file) data.append("certificate", file);
    if (avatar) data.append("avatar", avatar);


    try {
      const res = await axios.post("/auth/register-lawyer", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert(res.data.message);
      // Redirect to login or verification pending page
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
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
            <input 
              type="password" 
              required 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              placeholder="Secure Password"
            />
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
