import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Bell, Database, Cpu, Globe, Save, Trash2, Key } from 'lucide-react';

export default function Settings() {
  const [accessKey, setAccessKey] = useState("admin@juris");
  const [isCleaning, setIsCleaning] = useState(false);
  const [logoPreview, setLogoPreview] = useState("/juris-logo.png");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleCleanup = () => {
    if (window.confirm("CRITICAL: This will purge all old lawyer fields from the Citizen (Users) collection. Proceed?")) {
      setIsCleaning(true);
      // Simulate backend call
      setTimeout(() => {
        setIsCleaning(false);
        alert("Institutional Cleanup Complete. Users collection is now lean.");
      }, 2000);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    setUploadingLogo(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/branding/upload-logo", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });
      // Force refresh preview by adding timestamp
      setLogoPreview(`http://localhost:5000/branding/logo.png?t=${Date.now()}`);
      alert("Platform logo updated globally! Refresh other portals to see changes.");
    } catch (err) {
      alert("Logo upload failed: " + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="settings-container">
      <header className="page-header">
        <h2>Institutional Configuration</h2>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Save size={18} /> Save All Changes
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* SECTION: SECURITY */}
        <div className="content-section">
          <div className="section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield color="#c9a84c" />
              <h3>Security & Access</h3>
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
              Institutional Access Key
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="password" 
                value={accessKey} 
                onChange={(e) => setAccessKey(e.target.value)}
                className="settings-input" 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <button className="btn-outline">Update Key</button>
            </div>
          </div>
          <div style={{ padding: '15px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7' }}>
            <p style={{ fontSize: '0.8rem', color: '#92400e', lineHeight: '1.5' }}>
              <strong>Warning:</strong> Changing this key will immediately log out all active administrative sessions.
            </p>
          </div>
        </div>

        {/* SECTION: AI ENGINE */}
        <div className="content-section">
          <div className="section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu color="#10b981" />
              <h3>AI Brain Settings</h3>
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>Primary AI Model</label>
            <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <option>Groq Llama-3-70b (High Performance)</option>
              <option>Groq Mixtral-8x7b (Legal Logic Focus)</option>
              <option>Local Ollama (Offline Mode)</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontSize: '0.9rem' }}>Enable RAG Context</span>
             <div style={{ width: '40px', height: '20px', background: '#10b981', borderRadius: '10px' }}></div>
          </div>
        </div>

        {/* SECTION: DATA MAINTENANCE */}
        <div className="content-section">
          <div className="section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database color="#3b82f6" />
              <h3>Infrastructure Maintenance</h3>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
            Optimize the platform by removing redundant data and clearing cache.
          </p>
          <button 
            onClick={handleCleanup}
            className="btn-outline" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#ef4444' }}
          >
            <Trash2 size={16} /> {isCleaning ? 'Cleaning...' : 'Purge Lawyer Fields from Citizens'}
          </button>
        </div>

        {/* SECTION: BRANDING */}
        <div className="content-section">
          <div className="section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe color="#c9a84c" />
              <h3>Global Branding</h3>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <img src={logoPreview} style={{ width: '80px', height: '80px', borderRadius: '16px', border: '1px solid #e2e8f0', objectFit: 'contain' }} />
            <div style={{ flex: 1 }}>
               <input type="text" defaultValue="JurisBot" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }} />
               <input type="file" id="logo-upload" hidden accept="image/*" onChange={handleLogoChange} />
               <button 
                onClick={() => document.getElementById('logo-upload').click()}
                className="btn-outline" 
                style={{ fontSize: '0.8rem' }}
                disabled={uploadingLogo}
               >
                {uploadingLogo ? 'Uploading...' : 'Change Platform Logo'}
               </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
