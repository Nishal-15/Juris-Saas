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
            I agree to the <span onClick={() => navigate("/terms")} style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--gold)' }}>Terms of Service</span> and Privacy Policy. I acknowledge that JurisBot provides AI-generated informational insights and does not constitute formal legal counsel or establish an attorney-client relationship.
          </label>
        </div>

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
