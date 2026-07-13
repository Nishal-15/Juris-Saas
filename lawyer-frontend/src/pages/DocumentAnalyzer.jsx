import React, { useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import './document_analyzer.css';

export default function DocumentAnalyzer() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef();

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setSummary('');
      setError('');
    } else {
      setError('Only PDF files are supported.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) { setError('Please select a PDF document first.'); return; }
    const formData = new FormData();
    formData.append('file', file);
    setIsAnalyzing(true);
    setError('');
    setSummary('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/documents/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token }
      });
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze document. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatSummary = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**'))
        return <h3 key={i} className="da-section-title">{line.replace(/\*\*/g, '')}</h3>;
      if (line.startsWith('- '))
        return <li key={i} className="da-bullet">{line.slice(2)}</li>;
      if (line.trim() === '') return <div key={i} className="da-spacer" />;
      return <p key={i} className="da-line">{line}</p>;
    });
  };

  return (
    <div className="da-page">
      <Sidebar />
      <div className="da-body">

        {/* Header */}
        <div className="da-header">
          <div className="da-header-text">
            <h1 className="da-title">AI Document Analyzer</h1>
            <p className="da-subtitle">Upload any legal PDF and get instant AI-powered insights</p>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          className={`da-dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && fileRef.current.click()}
        >
          <input type="file" accept=".pdf" ref={fileRef} style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files[0])} />

          {file ? (
            <div className="da-file-selected">
              <div className="da-file-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className="da-file-info">
                <div className="da-file-name">{file.name}</div>
                <div className="da-file-size">{(file.size / 1024).toFixed(1)} KB · PDF Document</div>
              </div>
              <button className="da-file-remove" onClick={(e) => { e.stopPropagation(); setFile(null); setSummary(''); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="da-drop-prompt">
              <div className="da-drop-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div className="da-drop-text">Drop your PDF here or <span className="da-drop-link">browse</span></div>
              <div className="da-drop-hint">Supports FIRs, Judgments, Contracts, Affidavits · Max 20MB</div>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <button className={`da-analyze-btn ${isAnalyzing ? 'loading' : ''}`}
          onClick={handleAnalyze} disabled={isAnalyzing || !file}>
          {isAnalyzing ? (
            <><div className="da-spinner" />Analyzing Legal Context... This may take up to 45 seconds</>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>Analyze Document</>
          )}
        </button>

        {error && (
          <div className="da-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {summary && (
          <div className="da-results">
            <div className="da-results-header">
              <h2 className="da-results-title"><span className="da-results-dot" />Analysis Complete</h2>
              <div className="da-results-badge">{file?.name}</div>
            </div>
            <div className="da-results-body">{formatSummary(summary)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
