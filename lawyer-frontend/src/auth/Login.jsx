import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
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
      if (res.data.user && res.data.user.verificationStatus !== "verified") {
        navigate("/lawyer/verification-pending");
      } else {
        navigate("/lawyer/dashboard");
      }

    } catch (err) {
      setError("Invalid credentials. Access denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', background: '#0f111a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <style>{`
        .login-input {
          width: 100%; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.12);
          color: white; border-radius: 10px; padding: 13px 16px; box-sizing: border-box; font-family: 'Inter', sans-serif; transition: all 0.3s;
        }
        .login-input:focus { border-color: rgba(201,168,76,0.6); outline: none; }
        .login-input::placeholder { color: rgba(255,255,255,0.3); }
        .password-toggle { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
        .password-toggle:hover { color: white; }
      `}</style>

      {/* Orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '600px', height: '600px', background: '#c9a84c', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '500px', height: '500px', background: '#3b82f6', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', top: '30%', right: '-10%', width: '400px', height: '400px', background: '#8b5cf6', opacity: 0.18, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>

      {/* Grid overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, width: '420px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '24px', padding: '44px 40px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <img src="/logo.png" alt="JurisBot" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '18px', border: '1px solid #c9a84c', marginBottom: '24px', background: 'white', padding: '2px' }} />
        
        <h1 style={{ fontFamily: 'Playfair Display', color: 'white', margin: '0 0 6px 0', fontSize: '1.8rem' }}>Lawyer Portal</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 24px 0', fontSize: '0.9rem' }}>Access your legal workspace</p>

        {error && (
          <div style={{ width: '100%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '10px', padding: '12px', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          
          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Email Address</label>
          <input 
            type="email" 
            required 
            className="login-input" 
            style={{ marginBottom: '20px' }} 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="example@lawyer.com" 
          />
          
          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Password</label>
          <div style={{ position: 'relative', marginBottom: '30px' }}>
            <input 
              type={showPass ? "text" : "password"} 
              required 
              className="login-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter your password" 
            />
            <button 
              type="button" 
              className="password-toggle" 
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            style={{ width: '100%', padding: '14px', background: '#c9a84c', color: '#0f111a', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}
          >
            {loading ? 'VERIFYING...' : 'ACCESS WORKSPACE'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
          New legal practitioner? <span onClick={() => navigate("/register")} style={{ color: '#c9a84c', cursor: 'pointer', textDecoration: 'underline' }}>Create an Account</span>
        </p>

      </div>
    </div>
  );
}