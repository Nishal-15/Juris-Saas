import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';

const API_BASE = "http://localhost:5000/api/admin";

export default function KnowledgeHub() {
  const [laws, setLaws] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchLaws();
  }, []);

  const fetchLaws = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/laws`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLaws(res.data);
    } catch (err) {
      console.error("Fetch Laws Error:", err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("pdf", file);

    setUploading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/upload-law`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      setMessage(res.data.message);
      fetchLaws();
    } catch (err) {
      setMessage("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h2>AI Knowledge Hub</h2>
        <div className="badge badge-verified">{laws.length} Laws Indexed</div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
        <div className="content-section">
          <div className="section-title">
            <h3>Indexed Legal Documents</h3>
          </div>
          <div className="laws-list">
            {laws.length === 0 ? (
              <p style={{ color: '#64748b' }}>No documents indexed yet.</p>
            ) : (
              laws.map((file, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderBottom: '1px solid #f1f5f9' }}>
                  <FileText color="#c9a84c" />
                  <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{file}</span>
                  <CheckCircle size={14} color="#10b981" style={{ marginLeft: 'auto' }} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="content-section" style={{ background: '#f8fafc' }}>
          <div className="section-title">
            <h3>Inject New Knowledge</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '20px' }}>
            Upload Indian Gazette PDFs or new Penal Codes to update JurisBot's legal brain.
          </p>
          
          <label className="upload-zone" style={{ 
            border: '2px dashed #cbd5e1', 
            borderRadius: '16px', 
            padding: '40px 20px', 
            display: 'block', 
            textAlign: 'center',
            cursor: 'pointer',
            background: 'white'
          }}>
            <input type="file" hidden onChange={handleUpload} accept=".pdf" />
            {uploading ? (
              <Loader2 className="animate-spin" style={{ margin: '0 auto 10px', color: '#c9a84c' }} />
            ) : (
              <Upload style={{ margin: '0 auto 10px', color: '#64748b' }} />
            )}
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
              {uploading ? 'Processing AI Vectors...' : 'Select Legal PDF'}
            </div>
          </label>

          {message && (
            <div style={{ 
              marginTop: '20px', 
              padding: '12px', 
              borderRadius: '8px', 
              background: '#dcfce7', 
              color: '#166534', 
              fontSize: '0.8rem',
              fontWeight: '500'
            }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
