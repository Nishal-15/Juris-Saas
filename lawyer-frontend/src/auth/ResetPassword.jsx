import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post("/auth/reset-password", { token, newPassword });
      setMessage(res.data.message || "Password reset successfully!");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', background: '#0f111a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .reset-input {
          width: 100%; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.12);
          color: white; border-radius: 10px; padding: 13px 16px; box-sizing: border-box; transition: all 0.3s;
        }
        .reset-input:focus { border-color: rgba(201,168,76,0.6); outline: none; }
      `}</style>

      {/* Orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '500px', height: '500px', background: '#c9a84c', opacity: 0.15, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '500px', height: '500px', background: '#3b82f6', opacity: 0.15, filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>

      <div style={{ position: 'relative', zIndex: 10, width: '420px', maxWidth: '92%', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '24px', padding: '40px 28px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Playfair Display', color: 'white', margin: '0 0 10px 0', fontSize: '1.8rem' }}>Advocate Password Reset</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 24px 0', fontSize: '0.9rem' }}>Enter your new practitioner password below.</p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '10px', padding: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '10px', padding: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleReset} style={{ textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>New Password</label>
          <input 
            type="password" 
            required 
            className="reset-input" 
            style={{ marginBottom: '20px' }} 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
            placeholder="At least 6 characters" 
          />

          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>Confirm New Password</label>
          <input 
            type="password" 
            required 
            className="reset-input" 
            style={{ marginBottom: '30px' }} 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            placeholder="Repeat password" 
          />

          <button 
            type="submit" 
            disabled={loading || !!message} 
            style={{ width: '100%', padding: '14px', background: '#c9a84c', color: '#0f111a', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}
          >
            {loading ? 'RESETTING...' : 'SAVE NEW PASSWORD'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} onClick={() => navigate("/")}>
          ← Return to Login
        </p>
      </div>
    </div>
  );
}
