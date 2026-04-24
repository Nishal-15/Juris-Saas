import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import axios from "../api/axios";
import "./documents.css";

const fileIcon = (type) => {
  if (!type) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  );
  if (type.includes("pdf")) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="11" y2="11"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
};

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    try { const res = await axios.get("/documents"); setDocs(res.data); }
    catch {} finally { setLoading(false); }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);
    try {
      await axios.post("/documents/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      fetchDocs();
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    } finally { setIsUploading(false); }
  };

  const getExt = (name) => name?.split(".").pop()?.toUpperCase() || "FILE";

  return (
    <div className="dv-page">
      <Sidebar />
      <div className="dv-body">
        <div className="dv-header">
          <div>
            <h1 className="dv-title">Legal Vault</h1>
            <p className="dv-subtitle">Securely store and manage your legal documentation and exhibits.</p>
          </div>
        </div>

        {/* Upload Zone */}
        <label
          className={`dv-upload-zone ${dragOver ? "drag-over" : ""} ${isUploading ? "uploading" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files[0]); }}
        >
          <input type="file" style={{ display: "none" }} onChange={e => handleUpload(e.target.files[0])} disabled={isUploading} />
          <div className="dv-upload-icon">
            {isUploading ? (
              <div className="dv-spinner" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
              </svg>
            )}
          </div>
          <div className="dv-upload-text">
            {isUploading ? "Storing securely..." : "Drop files here or click to upload"}
          </div>
          <div className="dv-upload-hint">PDF, DOC, JPG, PNG — Max 10MB</div>
        </label>

        {/* Document Grid */}
        {loading ? (
          <div className="dv-empty"><div className="dv-spinner" /> Loading vault...</div>
        ) : docs.length === 0 ? (
          <div className="dv-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
            <p>Your vault is empty. Upload your first document above.</p>
          </div>
        ) : (
          <div className="dv-grid">
            {docs.map(doc => (
              <div
                key={doc._id}
                className="dv-doc-card"
                onClick={() => window.open(`http://localhost:5000${doc.fileUrl}`, "_blank")}
              >
                <div className="dv-doc-icon">{fileIcon(doc.type?.toLowerCase())}</div>
                <div className="dv-doc-info">
                  <div className="dv-doc-name">{doc.name}</div>
                  <div className="dv-doc-meta">
                    <span className="dv-ext-badge">{getExt(doc.name)}</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
                <button className="dv-doc-open">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}