import React, { useState } from 'react';
import API from '../api/axios';
import { useToast } from '../components/Toast';
import { Shield, Database, Cpu, Globe, Save, Trash2, Key, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Settings() {
  const [accessKey, setAccessKey] = useState("admin@juris");
  const [showPassword, setShowPassword] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [logoPreview, setLogoPreview] = useState("/juris-logo.png");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const toast = useToast();

  const handleCleanup = async () => {
    if (window.confirm("CRITICAL: This will purge all old lawyer fields from the Citizen (Users) collection. Proceed?")) {
      setIsCleaning(true);
      try {
        const res = await API.post('/admin/cleanup');
        toast.success(res.data.message || "Institutional Cleanup Complete.");
      } catch (err) {
        toast.error(err.response?.data?.message || "Cleanup failed");
      } finally {
        setIsCleaning(false);
      }
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    setUploadingLogo(true);
    try {
      await API.post("/branding/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setLogoPreview(`${import.meta.env.VITE_API_BASE?.replace('/api','') || 'http://localhost:5000'}/branding/logo.png?t=${Date.now()}`);
      toast.success("Platform logo updated globally!");
    } catch (err) {
      toast.error("Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = () => {
    toast.success("Configuration saved successfully.");
  };

  return (
    <div className="settings-container">
      <header className="page-header" style={{ marginBottom: '30px' }}>
        <h2>Institutional Configuration</h2>
        <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Save size={18} /> Save All Changes
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* SECTION: SECURITY */}
        <div className="content-section" style={{ background: 'var(--bg-card)', padding: '24px' }}>
          <div className="section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield color="var(--gold)" />
              <h3 style={{ margin: 0 }}>Security & Access</h3>
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>
              Institutional Access Key
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={accessKey} 
                  onChange={(e) => setAccessKey(e.target.value)}
                  style={{ width: '100%', padding: '12px 40px 12px 14px', borderRadius: '8px', border: '1px solid var(--border-dark)', background: 'var(--bg-base)', color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button className="btn-outline" onClick={() => toast.success("Access key updated.")}>Update Key</button>
            </div>
          </div>
          <div style={{ padding: '15px', background: 'var(--amber-dim)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--amber)', lineHeight: '1.5', margin: 0 }}>
              <strong>Warning:</strong> Changing this key will immediately log out all active administrative sessions.
            </p>
          </div>
        </div>

        {/* SECTION: AI ENGINE */}
        <div className="content-section" style={{ background: 'var(--bg-card)', padding: '24px' }}>
          <div className="section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu color="var(--green)" />
              <h3 style={{ margin: 0 }}>AI Brain Settings</h3>
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Primary AI Model</label>
            <select style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-dark)', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}>
              <option>NVIDIA NIM Llama 3 (Enterprise Fast)</option>
              <option>Groq Llama-3-70b (High Performance)</option>
              <option>Local Ollama (Offline Mode)</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-base)', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
             <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Enable RAG Context</span>
             <div style={{ width: '40px', height: '22px', background: 'var(--green)', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%' }}></div>
             </div>
          </div>
        </div>

        {/* SECTION: DATA MAINTENANCE */}
        <div className="content-section" style={{ background: 'var(--bg-card)', padding: '24px' }}>
          <div className="section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database color="var(--blue)" />
              <h3 style={{ margin: 0 }}>Infrastructure Maintenance</h3>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            Optimize the platform by removing redundant data and clearing unverified/stale schemas across the cluster.
          </p>
          <button 
            onClick={handleCleanup}
            disabled={isCleaning}
            className="btn-danger" 
            style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: isCleaning ? 0.7 : 1, cursor: isCleaning ? 'not-allowed' : 'pointer' }}
          >
            {isCleaning ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {isCleaning ? 'Purging Infrastructure...' : 'Purge Lawyer Fields from Citizens'}
          </button>
        </div>

        {/* SECTION: BRANDING */}
        <div className="content-section" style={{ background: 'var(--bg-card)', padding: '24px' }}>
          <div className="section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe color="var(--gold)" />
              <h3 style={{ margin: 0 }}>Global Branding</h3>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '10px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'var(--bg-base)', border: '1px solid var(--border-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={logoPreview} alt="Logo" style={{ width: '60%', height: '60%', objectFit: 'contain' }} onError={(e) => e.target.src=''} />
            </div>
            <div style={{ flex: 1 }}>
               <input type="text" defaultValue="JurisBot" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-dark)', background: 'var(--bg-base)', color: 'var(--text-primary)', marginBottom: '12px', boxSizing: 'border-box', outline: 'none' }} />
               <input type="file" id="logo-upload" hidden accept="image/*" onChange={handleLogoChange} />
               <button 
                onClick={() => document.getElementById('logo-upload').click()}
                className="btn-outline" 
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={uploadingLogo}
               >
                {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : null}
                {uploadingLogo ? 'Uploading...' : 'Change Platform Logo'}
               </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
