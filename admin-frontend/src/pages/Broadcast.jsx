import React, { useState } from 'react';
import API from '../api/axios';
import { useToast } from '../components/Toast';
import { SUPPORTED_LANGUAGES, getLangFlag } from '../config/languages';
import { Megaphone, ShieldAlert, Send, CheckCircle, Terminal, AlertTriangle, Info, Zap, Loader2 } from 'lucide-react';



export default function Broadcast() {
  const [formData, setFormData] = useState({
    target: 'all',
    title: '',
    message: '',
    priority: 'normal',
    lang: 'all'
  });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const toast = useToast();

  const handleTransmit = async () => {
    if (!formData.title || !formData.message) {
      toast.error("Please complete the signal content.");
      return;
    }
    
    setSending(true);
    try {
      await API.post('/admin/broadcast', formData);
      toast.success("Signal transmitted successfully.");
      
      const newEntry = {
        id: Date.now(),
        title: formData.title,
        message: formData.message,
        target: formData.target,
        priority: formData.priority,
        lang: formData.lang,
        date: new Date().toISOString()
      };
      setHistory([newEntry, ...history]);
      
      setFormData({ ...formData, title: '', message: '', lang: 'all' });
    } catch (err) {
      toast.error("Signal failed to transmit.");
    } finally {
      setSending(false);
    }
  };

  const getPriorityStyle = (priority) => {
    switch(priority) {
      case 'emergency': return { bg: 'var(--red-dim)', color: 'var(--red)', icon: <AlertTriangle size={14} />, label: 'alert' };
      case 'update': return { bg: 'var(--gold-dim)', color: 'var(--gold)', icon: <Zap size={14} />, label: 'update' };
      case 'success': return { bg: 'var(--green-dim)', color: 'var(--green)', icon: <CheckCircle size={14} />, label: 'success' };
      default: return { bg: 'var(--blue-dim)', color: 'var(--blue)', icon: <Info size={14} />, label: 'info' };
    }
  };

  return (
    <div>
      <header className="page-header" style={{ marginBottom: '30px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Megaphone color="var(--gold)" /> Signal Tower
          </h2>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
        
        {/* TRANSMIT CONSOLE */}
        <div className="content-section" style={{ background: 'var(--bg-card)', padding: '30px' }}>
          <div className="section-title">
            <h3>Transmit Command</h3>
            <div className="badge badge-verified" style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)' }}>
              <ShieldAlert size={12} /> Root Access
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Broadcasts bypass standard notification layers and are pushed instantly to the chosen network sector via websockets.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Target Sector</label>
                <select 
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none', transition: 'var(--transition)' }}
                  value={formData.target}
                  onChange={e => setFormData({...formData, target: e.target.value})}
                >
                  <option value="all">Global Network (All Users)</option>
                  <option value="lawyer">Legal Experts Only</option>
                  <option value="citizen">Citizens Only</option>
                </select>
              </div>
              
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  marginBottom: "8px"
                }}>
                  Language
                </label>
                <select
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    borderRadius: "8px",
                    outline: "none",
                    transition: "var(--transition)"
                  }}
                  value={formData.lang}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      lang: e.target.value
                    })
                  }
                >
                  <option value="all">
                    🌐 All Languages (English)
                  </option>
                  {SUPPORTED_LANGUAGES
                    .filter(l => l.code !== "en")
                    .map(l => (
                      <option
                        key={l.code}
                        value={l.code}
                      >
                        {l.flag} {l.name} — {l.native}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Signal Priority</label>
                <select 
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none', transition: 'var(--transition)' }}
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="normal">Normal / Informational</option>
                  <option value="update">Update / Feature</option>
                  <option value="success">Success / Milestone</option>
                  <option value="emergency">Emergency / Alert</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Signal Title</label>
              <input 
                type="text" 
                placeholder="e.g., Scheduled Core Maintenance"
                style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none', transition: 'var(--transition)', boxSizing: 'border-box' }}
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Signal Payload</label>
              <textarea 
                rows="4"
                placeholder="Enter detailed broadcast message..."
                style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none', transition: 'var(--transition)', resize: 'vertical', fontFamily: 'Inter', boxSizing: 'border-box' }}
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
              ></textarea>
            </div>

            {formData.lang !== "all" && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                marginBottom: 8
              }}>
                <span>
                  {getLangFlag(formData.lang)}
                </span>
                Broadcasting in:
                <strong style={{
                  color: "var(--gold)"
                }}>
                  {SUPPORTED_LANGUAGES.find(
                    l => l.code === formData.lang
                  )?.name}
                </strong>
              </div>
            )}

            <button 
              className={formData.priority === 'emergency' ? 'btn-danger' : 'btn-primary'}
              onClick={handleTransmit}
              disabled={sending}
              style={{ width: '100%', padding: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '0.95rem', borderRadius: '10px', opacity: sending ? 0.7 : 1, cursor: sending ? 'not-allowed' : 'pointer' }}
            >
              {sending ? (
                <><Loader2 className="animate-spin" size={18} /> Transmitting to network...</>
              ) : (
                <><Send size={18} /> Execute Transmission</>
              )}
            </button>
            
          </div>
        </div>

        {/* TRANSMISSION LOG */}
        <div className="content-section" style={{ background: 'var(--bg-dark)', padding: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="section-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '15px', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '10px' }}><Terminal size={18} color="var(--text-muted)" /> Network Log</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
            {history.length === 0 ? (
              <div className="empty-state-container" style={{ padding: '40px 0' }}>
                <div className="empty-state-icon">📡</div>
                <p className="empty-state-title" style={{ color: 'rgba(255,255,255,0.4)' }}>No signals transmitted yet.</p>
                <p className="empty-state-desc" style={{ color: 'rgba(255,255,255,0.25)' }}>Signals will appear here after they are transmitted.</p>
              </div>
            ) : (
              history.map((log) => {
                const pStyle = getPriorityStyle(log.priority);
                return (
                  <div key={log.id} style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${pStyle.color}`, borderRadius: '6px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ color: 'var(--text-white)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: pStyle.color, display: 'flex' }}>{pStyle.icon}</span>
                        {log.title}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                    
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>{log.message}</p>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Target: {log.target}
                      </span>
                      <span style={{ fontSize: '0.65rem', background: pStyle.bg, color: pStyle.color, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {pStyle.label}
                      </span>
                      {log.lang && log.lang !== "all" && (
                        <span style={{
                          fontSize: "0.65rem",
                          background: "rgba(255,255,255,0.06)",
                          color: "var(--text-muted)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          textTransform: "uppercase"
                        }}>
                          {getLangFlag(log.lang)} {log.lang}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
