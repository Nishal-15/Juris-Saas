import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useToast } from '../components/Toast';
import { Database, Upload, FileText, CheckCircle, Loader2, RefreshCw, Server, AlertCircle } from 'lucide-react';

export default function KnowledgeHub() {
  const [laws, setLaws] = useState([]);
  const [syncHistory, setSyncHistory] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSource, setSyncSource] = useState("all");
  
  const toast = useToast();

  useEffect(() => {
    fetchLaws();
    fetchSyncHistory();
  }, []);

  const fetchLaws = async () => {
    try {
      const res = await API.get('/admin/laws');
      setLaws(res.data);
    } catch (err) {
      console.error("Fetch Laws Error:", err);
    }
  };

  const fetchSyncHistory = async () => {
    try {
      const res = await API.get('/admin/law-sync-status');
      setSyncHistory(res.data);
    } catch (err) {
      console.error("Fetch Sync History Error:", err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("pdf", file);

    setUploading(true);
    try {
      const res = await API.post('/admin/upload-law', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(res.data.message || "Document injected successfully");
      fetchLaws();
    } catch (err) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      toast.info(`Initiating auto-sync for: ${syncSource}`);
      const res = await API.post('/admin/trigger-law-sync', { source: syncSource });
      toast.success(res.data.message || "Sync pipeline triggered");
      // refresh history after a short delay since sync runs async
      setTimeout(fetchSyncHistory, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to trigger sync");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <header className="page-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2>AI Knowledge Hub</h2>
          <div className="badge badge-verified">{laws.length} Manual Files</div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
        
        {/* Left Column: Sync Controls & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Autonomous Sync Card */}
          <div className="content-section" style={{ background: 'var(--bg-card)', padding: '24px' }}>
            <div className="section-title" style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={20} color="var(--gold)" />
                <h3 style={{ margin: 0 }}>Autonomous Legal Sync Pipeline</h3>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Trigger the AI web scraper to automatically fetch the latest statutes, judgments, and gazettes.
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <select 
                value={syncSource} 
                onChange={(e) => setSyncSource(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-dark)', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}
                disabled={syncing}
              >
                <option value="all">All Sources</option>
                <option value="IndianKanoon">IndianKanoon (Judgments)</option>
                <option value="IndiaCode">IndiaCode (Statutes)</option>
                <option value="Gazette">eGazette (Notifications)</option>
              </select>
              <button 
                className="btn-primary" 
                onClick={triggerSync} 
                disabled={syncing}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', opacity: syncing ? 0.7 : 1, cursor: syncing ? 'not-allowed' : 'pointer' }}
              >
                {syncing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {syncing ? "Syncing Pipeline..." : "Trigger Sync"}
              </button>
            </div>
          </div>

          {/* Sync History Table */}
          <div className="content-section" style={{ padding: '24px' }}>
            <div className="section-title">
              <h3 style={{ margin: 0 }}>Recent Sync Operations</h3>
              <button onClick={fetchSyncHistory} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            
            <div className="table-wrap" style={{ marginTop: '15px' }}>
              {syncHistory.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No sync operations logged yet.
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Source</th>
                      <th>Docs Added</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncHistory.map(record => {
                      let statusBadge = { bg: 'var(--bg-base)', col: 'var(--text-muted)' };
                      if (record.status === 'success') statusBadge = { bg: 'var(--green-dim)', col: 'var(--green)' };
                      if (record.status === 'failed') statusBadge = { bg: 'var(--red-dim)', col: 'var(--red)' };
                      if (record.status === 'partial') statusBadge = { bg: 'var(--amber-dim)', col: 'var(--amber)' };
                      if (record.status === 'running') statusBadge = { bg: 'var(--blue-dim)', col: 'var(--blue)' };

                      return (
                        <tr key={record._id}>
                          <td style={{ fontSize: '0.8rem' }}>{new Date(record.createdAt).toLocaleString()}</td>
                          <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{record.source}</td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {record.status === 'running' ? '-' : (record.documentsAdded || 0)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="badge" style={{ background: statusBadge.bg, color: statusBadge.col, textTransform: 'capitalize' }}>
                                {record.status}
                              </span>
                              {record.errorMessage && (
                                <AlertCircle size={14} color="var(--red)" title={record.errorMessage} style={{ cursor: 'help' }} />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
        </div>

        {/* Right Column: Manual Upload & File List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div className="content-section" style={{ background: 'var(--bg-card)' }}>
            <div className="section-title">
              <h3>Manual Injection</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Upload local PDFs directly to the FAISS vector database.
            </p>
            
            <label className="upload-zone" style={{ 
              border: '2px dashed var(--border-dark)', 
              borderRadius: '16px', 
              padding: '40px 20px', 
              display: 'block', 
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: 'var(--bg-base)',
              transition: 'var(--transition)'
            }}>
              <input type="file" hidden onChange={handleUpload} accept=".pdf" disabled={uploading} />
              {uploading ? (
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--gold)' }} />
              ) : (
                <Upload size={32} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
              )}
              <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {uploading ? 'Processing Vectors...' : 'Select Legal PDF'}
              </div>
            </label>
          </div>

          <div className="content-section">
            <div className="section-title">
              <h3>Manual Documents</h3>
            </div>
            <div className="laws-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {laws.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px 0' }}>No manual documents indexed.</p>
              ) : (
                laws.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 10px', borderBottom: '1px solid var(--border)' }}>
                    <FileText size={16} color="var(--gold)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{file}</span>
                    <CheckCircle size={14} color="var(--green)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
