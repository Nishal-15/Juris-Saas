import { useState, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "../components/layout/Sidebar";

export default function Profile() {
  const { user, login } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);

  const update = async () => {
    setLoading(true);
    try {
      const res = await axios.put("/auth/update", { name, phone });
      // Update local storage and context
      const token = localStorage.getItem("token");
      localStorage.setItem("user", JSON.stringify(res.data));
      login({ token, user: res.data });
      alert("✅ Profile updated successfully!");
    } catch (err) {
      alert("❌ Update failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', background: 'var(--bg)', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px' }}>
        <h2 style={{ color: 'var(--white)', fontFamily: 'var(--font-display)', marginBottom: '32px' }}>My Legal Profile</h2>
        
        <div style={{ background: 'var(--bg-2)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', maxWidth: '500px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>FULL NAME</label>
            <input 
              style={{ width: '100%', padding: '12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--white)' }}
              value={name}
              onChange={e => setName(e.target.value)} 
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>PHONE NUMBER</label>
            <input 
              style={{ width: '100%', padding: '12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--white)' }}
              value={phone}
              onChange={e => setPhone(e.target.value)} 
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>EMAIL ADDRESS</label>
            <input 
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--muted)', cursor: 'not-allowed' }}
              value={user.email}
              disabled
            />
          </div>

          <button 
            style={{ width: '100%', padding: '14px', background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={update}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </main>
    </div>
  );
}
