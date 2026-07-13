import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import './legal_drafter.css';

export default function LegalDrafter() {
  const [docType, setDocType] = useState('Bail Application');
  const [facts, setFacts] = useState('');
  const [draft, setDraft] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState('');

  const docTypes = [
    'Bail Application',
    'Legal Notice',
    'Non-Disclosure Agreement',
    'Mutual Consent Divorce Petition',
    'Employment Contract'
  ];

  const handleDraft = async () => {
    if (!facts.trim()) {
      setError('Please provide key facts for the document.');
      return;
    }
    setError('');
    setDraft('');
    setIsDrafting(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/documents/draft', {
        docType,
        facts
      }, {
        headers: { 'x-auth-token': token }
      });
      setDraft(res.data.draft);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate draft. Please try again.');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    alert("Draft copied to clipboard!");
  };

  const formatDraft = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**'))
        return <h3 key={i} className="ld-section-title">{line.replace(/\*\*/g, '')}</h3>;
      if (line.startsWith('- '))
        return <li key={i} className="ld-bullet">{line.slice(2)}</li>;
      if (line.trim() === '') return <div key={i} className="ld-spacer" />;
      return <p key={i} className="ld-line">{line}</p>;
    });
  };

  return (
    <div className="ld-page">
      <Sidebar />
      <div className="ld-body">
        <div className="ld-header">
          <h1 className="ld-title">AI Legal Drafter</h1>
          <p className="ld-subtitle">Generate fully-formatted legal documents instantly using AI</p>
        </div>

        <div className="ld-content-wrapper">
          <div className="ld-input-panel">
            <h2 className="ld-panel-title">Draft Requirements</h2>
            
            <div className="ld-form-group">
              <label>Document Type</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                {docTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="ld-form-group">
              <label>Key Facts & Details</label>
              <textarea 
                placeholder={`Example for Bail:\nClient: Rahul Sharma\nCharge: Sec 420 IPC\nPolice Station: Andheri East\nFacts: First-time offense, falsely accused by rival business partner, willing to cooperate with investigation.`}
                value={facts}
                onChange={(e) => setFacts(e.target.value)}
                rows={8}
              />
            </div>

            {error && <div className="ld-error">{error}</div>}

            <button 
              className={`ld-generate-btn ${isDrafting ? 'loading' : ''}`}
              onClick={handleDraft}
              disabled={isDrafting}
            >
              {isDrafting ? 'Drafting Document...' : 'Generate Legal Draft'}
            </button>
          </div>

          <div className="ld-output-panel">
            <div className="ld-output-header">
              <h2 className="ld-panel-title">Generated Draft</h2>
              {draft && (
                <button className="ld-copy-btn" onClick={handleCopy}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy Text
                </button>
              )}
            </div>
            
            <div className="ld-draft-container">
              {!draft && !isDrafting && (
                <div className="ld-empty-state">
                  <div className="ld-empty-icon">📝</div>
                  <p>Your AI-generated draft will appear here.</p>
                </div>
              )}

              {isDrafting && (
                <div className="ld-loading-state">
                  <div className="ld-spinner"></div>
                  <p>Analyzing facts and drafting {docType}...</p>
                </div>
              )}

              {draft && (
                <div className="ld-draft-content">
                  {formatDraft(draft)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
