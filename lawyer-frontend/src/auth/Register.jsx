import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

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
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFile = (e) => setFile(e.target.files[0]);
  const handleAvatar = (e) => setAvatar(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("You must agree to the Terms of Service.");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (file) data.append("certificate", file);
      if (avatar) data.append("avatar", avatar);

      const res = await axios.post("/auth/register-lawyer", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert(res.data.message);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', background: '#0f111a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '40px 20px' }}>
      <style>{`
        .login-input {
          width: 100%; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.12);
          color: white; border-radius: 10px; padding: 13px 16px; box-sizing: border-box; font-family: 'Inter', sans-serif; transition: all 0.3s;
        }
        .login-input:focus { border-color: rgba(201,168,76,0.6); outline: none; }
        .login-input::placeholder { color: rgba(255,255,255,0.3); }
        .password-toggle { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
        .password-toggle:hover { color: white; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; margin-bottom: 20px; }
        @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; gap: 15px; } }

        /* Custom File Input */
        .file-upload-wrapper { position: relative; width: 100%; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1.5px dashed rgba(255,255,255,0.12); overflow: hidden; display: flex; align-items: center; justify-content: center; transition: all 0.3s; cursor: pointer; }
        .file-upload-wrapper:hover { border-color: rgba(201,168,76,0.6); }
        .file-upload-wrapper input[type="file"] { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
        .file-dummy { color: rgba(255,255,255,0.5); font-size: 0.85rem; font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '600px', height: '600px', background: '#c9a84c', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '500px', height: '500px', background: '#3b82f6', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', top: '30%', right: '-10%', width: '400px', height: '400px', background: '#8b5cf6', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>

      {/* Grid overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, width: '800px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '24px', padding: '44px 40px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', flexShrink: 0 }}>
          <img src="/logo.png" alt="JurisBot" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #c9a84c', background: 'white', padding: '2px' }} />
          <h1 style={{ fontFamily: 'Playfair Display', color: 'white', margin: 0, fontSize: '1.8rem' }}>JurisBot <span style={{ background: 'linear-gradient(90deg, #c9a84c, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PRO</span></h1>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 30px 0', fontSize: '0.9rem', textAlign: 'center' }}>Legal Practitioner Onboarding. Join India's elite legal network.</p>

        {error && (
          <div style={{ width: '100%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '10px', padding: '12px', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          
          <div className="form-grid">
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Full Name *</label>
              <input type="text" required className="login-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="As per Bar Enrollment" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Email ID *</label>
              <input type="email" required className="login-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="professional@email.com" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Phone Number *</label>
              <input type="tel" required className="login-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Bar Council ID *</label>
              <input type="text" required className="login-input" value={formData.barId} onChange={e => setFormData({ ...formData, barId: e.target.value })} placeholder="BCI/XX/XXXXX" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Experience (Years) *</label>
              <input type="number" required className="login-input" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} placeholder="e.g. 10" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Specialization *</label>
              <input type="text" required className="login-input" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} placeholder="Criminal, Corporate, etc." />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Professional Portrait *</label>
              <div className="file-upload-wrapper">
                <input type="file" required onChange={handleAvatar} accept="image/*" />
                <div className="file-dummy">
                  <span>{avatar ? avatar.name : "Select Portrait (Image)"}</span>
                </div>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Enrollment Certificate *</label>
              <div className="file-upload-wrapper">
                <input type="file" required onChange={handleFile} accept=".pdf,.jpg,.jpeg,.png" />
                <div className="file-dummy">
                  <span>{file ? file.name : "Upload Document (PDF/Image)"}</span>
                </div>
              </div>
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Secure Password *</label>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input type={showPass ? "text" : "password"} required className="login-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Create a strong password" />
            <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)}>
              {showPass ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'flex-start', marginBottom: '30px' }}>
            <input type="checkbox" required id="lawyer-terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: '16px', height: '16px', marginTop: '3px', cursor: 'pointer' }} />
            <label htmlFor="lawyer-terms" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: '1.5', cursor: 'pointer', margin: 0, textAlign: 'left' }}>
              I agree to the <span onClick={(e) => { e.preventDefault(); setShowTerms(true); }} style={{ textDecoration: 'underline', color: '#c9a84c' }}>Professional Terms of Service</span>. I confirm that the credentials provided are accurate and authorize JurisBot to verify them with the respective Bar Council.
            </label>
          </div>
          
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #c9a84c, #fcd34d)', color: '#0f111a', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
            {loading ? 'PROCESSING...' : 'SUBMIT FOR VERIFICATION'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
          Already have a pro account? <span onClick={() => navigate("/")} style={{ color: '#c9a84c', cursor: 'pointer', textDecoration: 'underline' }}>Login here</span>
        </p>

      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0f111a', border: '1px solid #c9a84c', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button type="button" onClick={() => setShowTerms(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            <h2 style={{ color: '#c9a84c', marginBottom: '15px', fontFamily: 'Playfair Display' }}>JurisBot Professional Terms</h2>
            <div style={{ color: '#c9d1d9', fontSize: '14px', lineHeight: '1.6' }}>
              <p><strong>1. Verification of Credentials:</strong> By registering, you grant JurisBot the authorization to verify your Bar Council ID. Falsifying credentials will lead to a permanent ban.</p>
              <p><strong>2. Professional Conduct:</strong> You agree to maintain the highest standard of professional ethics.</p>
              <p><strong>3. Use of AI Tools:</strong> Our AI Drafter and Analyzer are assistive tools. You are solely responsible for reviewing and verifying all AI-generated drafts.</p>
              <p><strong>4. Confidentiality:</strong> You agree to uphold strict attorney-client privilege.</p>
            </div>
            <button type="button" onClick={() => setShowTerms(false)} style={{ width: '100%', background: '#c9a84c', border: 'none', padding: '12px', color: '#0f111a', fontWeight: 'bold', marginTop: '20px', borderRadius: '6px', cursor: 'pointer' }}>Close and Continue</button>
          </div>
        </div>
      )}

    </div>
  );
}
