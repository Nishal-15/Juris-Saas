import { useState, useContext } from "react";
import axios, { setAuthToken } from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import "./register.css";

export default function Register() {
  const [form, setForm] = useState({ preferredLanguage: "en" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext); 
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const submit = async () => {
    if (!form.name || !form.email || !form.password || !form.phone) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      // ✅ REGISTER (Returns {token, user} now)
      const res = await axios.post("/auth/register", form);
      const { token, user } = res.data;

      // 2. SET STATE & STORAGE
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      // ✅ CONSISTENT LOGIN
      setAuthToken(token);
      login(res.data);

      // ✅ NAVIGATE BASED ON ROLE
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "lawyer") navigate("/lawyer");
      else navigate("/user");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* LEFT */}
      <div className="register-left">
        <div className="register-left-grid" />
        <div className="register-left-glow" />
        <div className="register-brand">

          <div className="register-logo-wrap">
            <div className="register-logo-icon" style={{ background: '#fff', padding: '2px' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #c9a84c', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
            </div>
            <div>
              <span className="register-logo-name">JurisBot</span>
              <span className="register-logo-sub">Conversation AI for Legal Awareness</span>
            </div>
          </div>

          <h1 className="register-headline">
            Your legal<br />
            journey <em>starts</em><br />
            here.
          </h1>

          <p className="register-tagline">
            Join thousands of Indians who use JurisBot to understand
            their rights and navigate the legal system with confidence.
          </p>

          <div className="register-steps">
            {[
              ["1", "Create your free account", "Sign up in under 60 seconds"],
              ["2", "Ask any legal question", "Get AI-powered answers instantly"],
              ["3", "Connect with a lawyer", "Book verified consultations on demand"],
            ].map(([num, title, desc]) => (
              <div className="register-step" key={num}>
                <div className="register-step-num">{num}</div>
                <div>
                  <div className="register-step-title">{title}</div>
                  <div className="register-step-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* RIGHT (Main Form on Mobile) */}
      <div className="register-right">
        {/* 📱 Mobile-Only Hero Section (Matches Prototype) */}
        <div className="register-mobile-hero">
          <div className="register-hero-img-wrap">
            <img src="/src/assets/gavel_hero.png" alt="Legal Hero" className="register-hero-img" />
            <div className="register-hero-overlay" />
            <h1 className="register-mobile-title">Your legal journey starts here.</h1>
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">FULL NAME</label>
          <div className="input-with-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="field-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <input
              type="text"
              className="form-input"
              placeholder="John Doe"
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">PHONE NUMBER</label>
          <div className="input-with-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="field-icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <input
              type="tel"
              className="form-input"
              placeholder="+91 000-0000"
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">EMAIL ADDRESS</label>
          <div className="input-with-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="field-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input
              type="email"
              className="form-input"
              placeholder="john@example.com"
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">PASSWORD</label>
          <div className="password-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="field-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input
              type={showPassword ? "text" : "password"}
              className="form-input"
              placeholder="••••••••"
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
            </button>
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">PREFERRED LANGUAGE</label>
          <select 
            className="form-input"
            value={form.preferredLanguage}
            onChange={e => setForm({ ...form, preferredLanguage: e.target.value })}
            style={{ paddingLeft: '18px' }}
          >
            {[
              { name: "English", code: "en" },
              { name: "हिंदी (Hindi)", code: "hi" },
              { name: "தமிழ் (Tamil)", code: "ta" },
              { name: "తెలుగు (Telugu)", code: "te" },
              { name: "বাংলা (Bengali)", code: "bn" },
              { name: "ಕನ್ನಡ (Kannada)", code: "kn" },
              { name: "മലയാളം (Malayalam)", code: "ml" },
              { name: "मराठी (Marathi)", code: "mr" },
              { name: "ગુજરાતી (Gujarati)", code: "gu" },
              { name: "ਪੰਜਾਬੀ (Punjabi)", code: "pa" },
              { name: "ଓଡ଼ିଆ (Odia)", code: "or" },
              { name: "অসমীয়া (Assamese)", code: "as" },
              { name: "اردو (Urdu)", code: "ur" }
            ].map(l => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="form-field-check">
          <input type="checkbox" id="terms" onChange={e => setForm({ ...form, agreed: e.target.checked })} />
          <label htmlFor="terms">
            I agree to the <span onClick={() => navigate("/terms")} className="gold-link">Terms of Service</span>.
          </label>
        </div>

        <button className="btn-primary" onClick={submit} disabled={loading || !form.agreed}>
          {loading ? "creating account…" : "Register to Dashboard →"}
        </button>

        <p className="register-login-link" onClick={() => navigate("/")}>
          Already have an account? <span>Sign in →</span>
        </p>

      </div>
    </div>
  );
}
