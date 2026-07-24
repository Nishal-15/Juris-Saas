import { useState, useContext } from "react";
import axios, { setAuthToken } from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function Register() {
  const [form, setForm] = useState({ preferredLanguage: "en" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext); 
  const navigate = useNavigate();

  const submit = async () => {
    setError("");
    if (!form.name || !form.email || !form.password || !form.phone || !form.agreed) {
      setError("Please fill all required fields and agree to the terms.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/auth/register", form);
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      setAuthToken(token);
      login(res.data);

      if (user.role === "admin") navigate("/admin");
      else if (user.role === "lawyer") navigate("/lawyer");
      else navigate("/user");
    } catch (err) {
      console.error(err);
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
        .login-input option { background: #0f111a; color: white; }
        .password-toggle { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
        .password-toggle:hover { color: white; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; margin-bottom: 20px; }
        @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; gap: 15px; } }
      `}</style>

      {/* Orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '600px', height: '600px', background: '#c9a84c', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '500px', height: '500px', background: '#3b82f6', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', top: '30%', right: '-10%', width: '400px', height: '400px', background: '#8b5cf6', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>

      {/* Grid overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, width: '600px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '24px', padding: '44px 40px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <img src="/logo.png" alt="JurisBot" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '14px', border: '1px solid #c9a84c', marginBottom: '20px', background: 'white', padding: '2px', flexShrink: 0 }} />
        
        <h1 style={{ fontFamily: 'Playfair Display', color: 'white', margin: '0 0 6px 0', fontSize: '1.8rem', textAlign: 'center' }}>Create an Account</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 30px 0', fontSize: '0.9rem', textAlign: 'center' }}>Join thousands of citizens using JurisBot for legal awareness.</p>

        {error && (
          <div style={{ width: '100%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '10px', padding: '12px', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ width: '100%' }}>
          
          <div className="form-grid">
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Full Name *</label>
              <input type="text" required className="login-input" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Phone Number *</label>
              <input type="tel" required className="login-input" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Email Address *</label>
          <input type="email" required className="login-input" style={{ marginBottom: '20px' }} value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="example@gmail.com" />

          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Preferred Language *</label>
          <select required className="login-input" style={{ marginBottom: '20px' }} value={form.preferredLanguage} onChange={e => setForm({ ...form, preferredLanguage: e.target.value })}>
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
            <option value="ur">اردو (Urdu)</option>
          </select>
          
          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Password *</label>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input type={showPassword ? "text" : "password"} required className="login-input" value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Create a strong password" />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'flex-start', marginBottom: '30px' }}>
            <input type="checkbox" required id="terms" checked={form.agreed || false} onChange={e => setForm({ ...form, agreed: e.target.checked })} style={{ width: '16px', height: '16px', marginTop: '3px', cursor: 'pointer' }} />
            <label htmlFor="terms" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: '1.5', cursor: 'pointer', margin: 0, textAlign: 'left' }}>
              I agree to the <span onClick={(e) => { e.preventDefault(); setShowTerms(true); }} style={{ textDecoration: 'underline', color: '#c9a84c' }}>Terms of Service</span>. I acknowledge JurisBot provides AI insights, not formal legal counsel.
            </label>
          </div>
          
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: '#c9a84c', color: '#0f111a', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
            {loading ? 'CREATING ACCOUNT...' : 'REGISTER FOR FREE'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
          Already have an account? <span onClick={() => navigate("/")} style={{ color: '#c9a84c', cursor: 'pointer', textDecoration: 'underline' }}>Sign in</span>
        </p>

      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0f111a', border: '1px solid #c9a84c', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button type="button" onClick={() => setShowTerms(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            <h2 style={{ color: '#c9a84c', marginBottom: '15px', fontFamily: 'Playfair Display' }}>JurisBot Terms of Service</h2>
            <div style={{ color: '#c9d1d9', fontSize: '14px', lineHeight: '1.6' }}>
              <p><strong>1. Nature of Service:</strong> JurisBot is an AI-powered legal information assistant. It is NOT a human lawyer and does NOT provide formal legal advice.</p>
              <p><strong>2. No Attorney-Client Relationship:</strong> Interacting with JurisBot does not establish an attorney-client relationship.</p>
              <p><strong>3. Data Privacy:</strong> We employ end-to-end encryption. Your case facts and documents are strictly confidential.</p>
              <p><strong>4. Acceptance:</strong> By checking the box and creating an account, you legally agree to these terms.</p>
            </div>
            <button type="button" onClick={() => setShowTerms(false)} style={{ width: '100%', background: '#c9a84c', border: 'none', padding: '12px', color: '#0f111a', fontWeight: 'bold', marginTop: '20px', borderRadius: '6px', cursor: 'pointer' }}>Close and Continue</button>
          </div>
        </div>
      )}

    </div>
  );
}
