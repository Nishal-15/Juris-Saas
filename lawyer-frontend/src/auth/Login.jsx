import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";
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
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '40px' }}
                  required
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