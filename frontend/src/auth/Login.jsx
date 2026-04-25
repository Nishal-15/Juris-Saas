import { useState, useContext } from "react";
import axios, { setAuthToken } from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const submit = async () => {
    if (!email || !password) return;

    setLoading(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const res = await axios.post("/auth/login", { email: normalizedEmail, password });
      const { token, user } = res.data;

      // ✅ SAVE SESSION
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ UPDATE APPS STATE
      setAuthToken(token);
      login(res.data); // ✅ PASS ENTIRE DATA {token, user}

      // ✅ NAVIGATE BASED ON ROLE
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "lawyer") navigate("/lawyer");
      else navigate("/user");

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT */}
      <div className="login-left">
        <div className="login-left-grid" />
        <div className="login-left-glow" />
        <div className="login-brand">
          <div className="login-logo-wrap">
            <div className="login-logo-icon" style={{ background: '#fff', padding: '2px' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #c9a84c', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
            </div>
            <div>
              <span className="login-logo-name">JurisBot</span>
              <span className="login-logo-sub">Conversation AI for Legal Awareness</span>
            </div>
          </div>

          <h1 className="login-headline">
            Justice,<br />
            <em>intelligently</em><br />
            delivered.
          </h1>

          <p className="login-tagline">
            India's most trusted AI-powered legal assistant. Understanding your rights has never been this simple.
          </p>
        </div>
      </div>

      {/* RIGHT (Main Form on Mobile) */}
      <div className="login-right">
        {/* 📱 Mobile-Only Hero Section (Matches Prototype) */}
        <div className="login-mobile-hero">
          <div className="login-logo-icon mini">
            <img src="/logo.png" alt="Logo" />
          </div>
          <h1 className="login-mobile-title">Justice,<br />intelligently<br />delivered.</h1>
          <p className="login-mobile-sub">India's most trusted AI-powered legal assistant.</p>
        </div>

        <h2 className="login-form-title">login</h2>
        <p className="login-form-sub">Enter your credentials to access your legal workspace.</p>

        <div className="form-field">
          <label className="form-label">EMAIL ADDRESS</label>
          <div className="input-with-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="field-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input
              className="form-input"
              placeholder="professional@firm.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
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

        <button
          className="btn-primary"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "signing in..." : "Login to Dashboard →"}
        </button>

        <div className="form-divider">OR</div>

        <p className="form-link" onClick={() => navigate("/register")}>
          Don't have an account? <span>Create one for free →</span>
        </p>

        <div className="login-footer-trust">
          <span>🛡️ SECURED BY INDUSTRY STANDARDS</span>
          <div className="trust-badges">
            <span>256-BIT AES</span>
            <span>ISO 27001</span>
          </div>
        </div>
      </div>
    </div>
  );
}
