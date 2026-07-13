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
  const [showTerms, setShowTerms] = useState(false);
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
      // Direct registration
      const res = await axios.post("/auth/register", form);
      const { token, user } = res.data;

      // SET STATE & STORAGE
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
      alert(err.response?.data?.message || err.message || "Registration failed");
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

      {/* RIGHT */}
      <div className="register-right">

        <div className="form-field">
          <label className="form-label">CHOOSE YOUR LANGUAGE AND GET THE ANSWERS FROM CHATBOT IN YOUR OWN LANGUAGE</label>
          <select 
            className="form-input"
            value={form.preferredLanguage}
            onChange={e => setForm({ ...form, preferredLanguage: e.target.value })}
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
              { name: "اردو (Urdu)", code: "ur" },
              { name: "संस्कृतम् (Sanskrit)", code: "sa" },
              { name: "मैथिली (Maithili)", code: "mai" },
              { name: "कोंಕಣಿ (Konkani)", code: "kok" },
              { name: "डोगरी (Dogri)", code: "doi" },
              { name: "नेपाली (Nepali)", code: "ne" },
              { name: "सिंधी (Sindhi)", code: "sd" },
              { name: "संताली (Santali)", code: "sat" },
              { name: "मणिपुरी (Manipuri)", code: "mni" },
              { name: "বোডো (Bodo)", code: "brx" },
              { name: "कश्मीरी (Kashmiri)", code: "ks" }
            ].map(l => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">PHONE NUMBER</label>
          <input
            type="tel"
            className="form-input"
            placeholder="+91 98765 43210"
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <h2 className="register-form-title">register</h2>
        <p className="register-form-sub">Free forever. No credit card required.</p>

        <div className="form-field">
          <label className="form-label">NAME</label>
          <input
            type="text"
            className="form-input"
            placeholder="Your full name"
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="form-field">
          <label className="form-label">EMAIL</label>
          <input
            type="email"
            className="form-input"
            placeholder="example@gmail.com"
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="form-field">
          <label className="form-label">PASSWORD</label>
          <div className="password-box">
            <input
              type={showPassword ? "text" : "password"}
              className="form-input"
              placeholder="Create a strong password"
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

        <div className="form-field-check">
          <input 
            type="checkbox" 
            id="terms" 
            onChange={e => setForm({ ...form, agreed: e.target.checked })} 
          />
          <label htmlFor="terms">
            I agree to the <span onClick={() => setShowTerms(true)} style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--gold)' }}>Terms of Service</span> and Privacy Policy. I acknowledge that JurisBot provides AI-generated informational insights and does not constitute formal legal counsel or establish an attorney-client relationship.
          </label>
        </div>

        {/* Terms Modal */}
        {showTerms && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#0f111a', border: '1px solid #c9a84c', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
              <button onClick={() => setShowTerms(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✖</button>
              <h2 style={{ color: 'var(--gold)', marginBottom: '15px', fontFamily: 'Playfair Display' }}>JurisBot Terms of Service</h2>
              <div style={{ color: '#c9d1d9', fontSize: '14px', lineHeight: '1.6' }}>
                <p><strong>1. Nature of Service:</strong> JurisBot is an AI-powered legal information assistant. It is NOT a human lawyer and does NOT provide formal legal advice. By using JurisBot, you acknowledge that all AI-generated drafts, answers, and summaries are for informational purposes only.</p>
                <p><strong>2. No Attorney-Client Relationship:</strong> Interacting with JurisBot does not establish an attorney-client relationship. If you require binding legal counsel, you must hire a verified practitioner through our platform.</p>
                <p><strong>3. Data Privacy:</strong> We employ end-to-end encryption. Your case facts and documents are strictly confidential and are not used to train public AI models.</p>
                <p><strong>4. Practitioner Verification:</strong> All lawyers on the JurisBot network are independently verified via the Bar Council. However, JurisBot is not liable for the outcome of any direct consultations between citizens and lawyers.</p>
                <p><strong>5. Acceptance:</strong> By checking the box and creating an account, you legally agree to these terms.</p>
              </div>
              <button onClick={() => setShowTerms(false)} style={{ width: '100%', background: 'var(--gold)', border: 'none', padding: '12px', color: '#0f111a', fontWeight: 'bold', marginTop: '20px', borderRadius: '6px', cursor: 'pointer' }}>Close and Continue</button>
            </div>
          </div>
        )}

        <button className="btn-primary" onClick={submit} disabled={loading || !form.agreed}>
          {loading ? "creating account…" : "create"}
        </button>

        <div className="form-divider">or</div>

        <p className="register-login-link" onClick={() => navigate("/")}>
          Already have an account? <span>Sign in →</span>
        </p>

      </div>
    </div>
  );
}
