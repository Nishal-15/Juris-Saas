import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const res = await axios.post("/auth/login", {
        email: normalizedEmail,
        password,
        role: "lawyer"
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/lawyer/dashboard");

    } catch (err) {
      alert("Invalid credentials. Access denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">

      {/* LEFT PANEL */}
      <div className="login-left">
        <div className="login-content">
          <div className="login-logo">⚖️ Juris<span>Lawyer</span></div>
          <h1>Empowering Legal Experts.</h1>
          <p>Join the next generation of legal AI assistance. Securely manage cases, consult with clients, and streamline your legal workflow with JurisBot.</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        <div className="login-card glass">

          <h2>Secure Login</h2>
          <p className="subtitle">Enter your legal credentials to access your workspace.</p>

          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="expert@lawyer.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-box">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Verifying..." : "Access Workspace"}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '24px', textAlign: 'center', fontSize: '15px', color: 'var(--muted)' }}>
          New legal practitioner? <Link to="/register" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px' }}>Create a Pro Account →</Link>
        </p>

        <div className="security-note">
          <p>Protected by JurisVault™ 256-bit encryption.</p>
        </div>

        </div>
      </div>

    </div>
  );
}