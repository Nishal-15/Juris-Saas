import React, { useState } from 'react';
import axios from 'axios';
import { Radio, Megaphone, ShieldAlert, Send, CheckCircle } from 'lucide-react';

const API_BASE = "http://localhost:5000/api/admin";

export default function Broadcast() {
  const [formData, setFormData] = useState({
    target: 'all',
    title: '',
    message: '',
    priority: 'normal'
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleTransmit = async () => {
    if (!formData.title || !formData.message) return alert("Please complete the signal content.");
    
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/broadcast`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setFormData({ ...formData, title: '', message: '' });
    } catch (err) {
      alert("Signal failed to transmit.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h2>Institutional Signal Tower</h2>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
        
        <div className="content-section">
          <div className="section-title">
            <h3>Compose Broadcast</h3>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>Target Audience</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              {['all', 'lawyer', 'user'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setFormData({...formData, target: t})}
                  style={{ 
                    flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0',
                    background: formData.target === t ? '#0f111a' : 'white',
                    color: formData.target === t ? 'white' : '#64748b',
                    cursor: 'pointer', fontWeight: '600', textTransform: 'capitalize'
                  }}
                >
                  {t === 'user' ? 'Citizens' : t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>Signal Title</label>
            <input 
              type="text" 
              placeholder="e.g. New Penal Code Amendment 2026"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>Message Body</label>
            <textarea 
              rows="6"
              placeholder="Detailed instructions or alert text..."
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none' }}
            />
          </div>

          <button 
            disabled={sending}
            onClick={handleTransmit}
            className="btn-primary" 
            style={{ width: '100%', padding: '18px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
          >
            {success ? <CheckCircle /> : <Send />}
            {sending ? 'Transmitting...' : success ? 'Signal Sent!' : 'Transmit Institutional Signal'}
          </button>
        </div>

        <div className="content-section" style={{ background: '#f8fafc' }}>
          <div className="section-title">
             <h3>Signal Priority</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '12px', 
              background: 'white', border: formData.priority === 'normal' ? '2px solid #3b82f6' : '1px solid #e2e8f0', cursor: 'pointer' 
            }}>
              <input type="radio" checked={formData.priority === 'normal'} onChange={() => setFormData({...formData, priority: 'normal'})} />
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Normal Alert</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Standard platform notification.</div>
              </div>
            </label>

            <label style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '12px', 
              background: '#fff1f2', border: formData.priority === 'emergency' ? '2px solid #ef4444' : '1px solid #fecaca', cursor: 'pointer' 
            }}>
              <input type="radio" checked={formData.priority === 'emergency'} onChange={() => setFormData({...formData, priority: 'emergency'})} />
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#ef4444' }}>🔴 Emergency</div>
                <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>High-priority legal alert.</div>
              </div>
            </label>
          </div>

          <div style={{ marginTop: '40px', padding: '20px', background: '#eff6ff', borderRadius: '16px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldAlert size={18} color="#3b82f6" />
              Protocol Info
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#1e40af', lineHeight: '1.5' }}>
              Signals are distributed via real-time WebSocket tunnels. Active users will see an immediate institutional popup.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
