import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import html2pdf from 'html2pdf.js';
import './legal_drafter.css';

export default function LegalDrafter() {
  const [docType, setDocType] = useState(() => sessionStorage.getItem('drafter_docType') || 'Bail Application');
  const [facts, setFacts] = useState(() => sessionStorage.getItem('drafter_facts') || '');
  const [draft, setDraft] = useState(() => sessionStorage.getItem('drafter_draft') || '');
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState('');

  const docTypes = [
    'Bail Application',
    'Legal Notice',
    'Non-Disclosure Agreement',
    'Mutual Consent Divorce Petition',
    'Employment Contract'
  ];

  useEffect(() => {
    sessionStorage.setItem('drafter_docType', docType);
    sessionStorage.setItem('drafter_facts', facts);
    sessionStorage.setItem('drafter_draft', draft);
  }, [docType, facts, draft]);

  const handleClear = () => {
    setDocType('Bail Application');
    setFacts('');
    setDraft('');
    setError('');
    sessionStorage.removeItem('drafter_docType');
    sessionStorage.removeItem('drafter_facts');
    sessionStorage.removeItem('drafter_draft');
  };

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
      const res = await axios.post('/documents/draft', {
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

  const handleDownloadPDF = () => {
    const element = document.createElement('div');
    element.innerHTML = draft.split('\n').map(line => {
      if (line.startsWith('**') && line.endsWith('**'))
        return `<h3 style="color: #000; font-family: 'Times New Roman', Georgia, serif; font-size: 14pt; font-weight: bold; text-align: center; margin-top: 20px; margin-bottom: 10px;">${line.replace(/\*\*/g, '')}</h3>`;
      if (line.startsWith('- '))
        return `<li style="margin-left: 20px; margin-bottom: 8px;">${line.slice(2)}</li>`;
      if (line.trim() === '') return `<div style="height: 15px;"></div>`;
      return `<p style="margin-bottom: 10px; line-height: 1.5; font-size: 12pt; text-align: justify;">${line}</p>`;
    }).join('');
    
    element.style.padding = '0';
    element.style.color = '#000';
    element.style.backgroundColor = '#FFFFFF';
    element.style.fontFamily = '"Times New Roman", Georgia, serif';

    const opt = {
      margin:       [1, 1, 1, 1.5], // top, right, bottom, left in inches
      filename:     `${docType.replace(/\s+/g, '_')}_Draft.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const formatDraft = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**'))
        return <h3 key={i} className="drafter-section-title">{line.replace(/\*\*/g, '')}</h3>;
      if (line.startsWith('- '))
        return <li key={i} className="drafter-bullet">{line.slice(2)}</li>;
      if (line.trim() === '') return <div key={i} className="drafter-spacer" />;
      return <p key={i} className="drafter-line">{line}</p>;
    });
  };

  return (
    <div className="drafter-page">
      <Sidebar />
      <div className="drafter-body">
        <div className="drafter-header">
          <h1 className="drafter-title">AI Legal Drafter</h1>
          <p className="drafter-subtitle">Generate fully-formatted legal documents instantly using AI</p>
        </div>

        <div className="drafter-content-wrapper">
          <div className="drafter-input-panel">
            <h2 className="drafter-panel-title">Draft Requirements</h2>
            
            <div className="drafter-form-group">
              <label>Document Type</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                {docTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="drafter-form-group">
              <label>Key Facts & Details</label>
              <textarea 
                placeholder={`Example for Bail:\nClient: Rahul Sharma\nCharge: Sec 420 IPC\nPolice Station: Andheri East\nFacts: First-time offense, falsely accused by rival business partner, willing to cooperate with investigation.`}
                value={facts}
                onChange={(e) => setFacts(e.target.value)}
                rows={8}
              />
            </div>

            {error && <div className="drafter-error">{error}</div>}

            <div className="drafter-actions" style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={`drafter-generate-btn ${isDrafting ? 'loading' : ''}`}
                onClick={handleDraft} 
                disabled={isDrafting}
                style={{ flex: 1 }}
              >
                {isDrafting ? 'Drafting...' : 'Generate Legal Draft'}
              </button>
              <button 
                className="drafter-generate-btn" 
                onClick={handleClear} 
                disabled={isDrafting}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', flex: 'none' }}
                title="Clear all fields"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="drafter-output-panel">
            <div className="drafter-output-header">
              <h2 className="drafter-panel-title">Generated Draft</h2>
              {draft && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="drafter-copy-btn" onClick={handleCopy}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Copy Text
                  </button>
                  <button className="drafter-copy-btn" onClick={handleDownloadPDF}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download PDF
                  </button>
                </div>
              )}
            </div>
            
            <div className="drafter-draft-container">
              {!draft && !isDrafting && (
                <div className="drafter-empty-state">
                  <div className="drafter-empty-icon">📝</div>
                  <p>Your AI-generated draft will appear here.</p>
                </div>
              )}

              {isDrafting && (
                <div className="drafter-loading-state">
                  <div className="drafter-spinner"></div>
                  <p>Analyzing facts and drafting {docType}...</p>
                </div>
              )}

              {draft && (
                <div className="drafter-draft-content">
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
