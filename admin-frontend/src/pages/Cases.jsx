import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useToast } from '../components/Toast';
import MediationBanner from '../components/MediationBanner';
import MediationPlayer from '../components/MediationPlayer';
import { getLangName, getLangFlag } from '../config/languages';
import { LanguageBadge } from '../components/LanguageSelector';
import { FileText, Search, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMediation, setSelectedMediation] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  
  const toast = useToast();

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await API.get('/admin/all-cases');
      setCases(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Cases Error:", err);
      toast.error("Failed to load cases");
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    const s = search.toLowerCase().trim();
    const matchSearch = !s || 
      (c.title || "").toLowerCase().includes(s) ||
      (c.user?.name || "").toLowerCase().includes(s) ||
      (c.assignedLawyer?.name || "").toLowerCase().includes(s) ||
      (c._id || "").slice(-6).includes(s);
      
    const statusLower = (c.status || "Open").toLowerCase();
    const filterStatLower = statusFilter.toLowerCase();
    const matchStatus = statusFilter === "All" || statusLower.includes(filterStatLower) || (filterStatLower === "active" && statusLower.includes("progress"));
    
    const urgLower = (c.urgency || "Normal").toLowerCase();
    const filterUrgLower = urgencyFilter.toLowerCase();
    const matchUrg = urgencyFilter === "All" || urgLower === filterUrgLower || (filterUrgLower === "high" && urgLower === "urgent");
    
    return matchSearch && matchStatus && matchUrg;
  });

  const getUrgencyBadge = (urgency = "Normal") => {
    const u = urgency.toLowerCase();
    if (u === 'emergency') return { bg: 'var(--red-dim)', col: 'var(--red)' };
    if (u === 'high') return { bg: 'var(--amber-dim)', col: 'var(--amber)' };
    if (u === 'low') return { bg: 'var(--bg-base)', col: 'var(--text-muted)' };
    return { bg: 'var(--blue-dim)', col: 'var(--blue)' };
  };

  const getStatusBadge = (status = "Active") => {
    const s = status.toLowerCase();
    if (s.includes('closed') || s.includes('resolved')) return { bg: 'var(--bg-base)', col: 'var(--text-muted)' };
    if (s.includes('pending')) return { bg: 'var(--amber-dim)', col: 'var(--amber)' };
    return { bg: 'var(--green-dim)', col: 'var(--green)' };
  };

  const getCourtExplanation = (courtLevel) => {
    const map = {
      "Supreme Court": {
        why: "Involves fundamental rights, constitutional questions, or national jurisdiction.",
        timeline: "1–3 years (initial admission hearing within weeks)",
        estimatedCost: "₹50,000 – ₹5,00,000+",
        nextStep: "File Writ Petition or Special Leave Petition (SLP) with certified case record."
      },
      "High Court": {
        why: "Involves substantial questions of law, state-level jurisdiction, or statutory appeals.",
        timeline: "1–2 years",
        estimatedCost: "₹25,000 – ₹2,00,000",
        nextStep: "Engage High Court advocate to file Writ Petition or Civil/Criminal Appeal."
      },
      "Consumer Forum": {
        why: "Dispute arises from purchase of goods or services with deficiency or defect.",
        timeline: "6–18 months",
        estimatedCost: "₹2,000 – ₹25,000",
        nextStep: "Issue statutory legal notice to seller/service provider before filing."
      },
      "Family Court": {
        why: "Matrimonial dispute, divorce, child custody, alimony, or domestic relations.",
        timeline: "6 months – 2 years (6 months mandatory cooling-off for mutual divorce)",
        estimatedCost: "₹10,000 – ₹1,00,000",
        nextStep: "File petition before Family Court with marriage certificate and address proof."
      },
      "Tribunal": {
        why: "Specialized subject matter requiring expert tribunal jurisdiction (Labor, NCLT, DRT, CAT, Cyber).",
        timeline: "6–18 months",
        estimatedCost: "₹15,000 – ₹1,50,000",
        nextStep: "File application before relevant tribunal with supporting documents and fee."
      },
      "District Court": {
        why: "Civil suit or criminal complaint within territorial and pecuniary district jurisdiction.",
        timeline: "1–3 years",
        estimatedCost: "₹10,000 – ₹75,000",
        nextStep: "Engage local district advocate to draft plaint or criminal complaint."
      }
    };
    return map[courtLevel] || map["District Court"];
  };

  return (
    <div>
      <style>{`
        .cases-pill { padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
        .filter-select { background: var(--bg-card); border: 1px solid var(--border-dark); color: var(--text-primary); padding: 10px 16px; border-radius: var(--radius-sm); outline: none; font-family: 'Inter', sans-serif; cursor: pointer; }
        .filter-select:focus { border-color: var(--gold); }
        .search-wrap { position: relative; flex: 1; }
        .search-wrap input { width: 100%; padding: 10px 16px 10px 42px; border: 1px solid var(--border-dark); border-radius: var(--radius-sm); box-sizing: border-box; color: var(--text-primary); font-family: 'Inter', sans-serif; outline: none; }
        .search-wrap input:focus { border-color: var(--gold); }
        .search-wrap svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
      `}</style>
      
      <header className="page-header" style={{ marginBottom: '20px' }}>
        <h2>Global Case Intelligence</h2>
      </header>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="cases-pill" style={{ background: 'var(--blue-dim)', color: 'var(--blue)', border: '1px solid var(--blue)' }}>
          <span>Total Cases</span> <span style={{ fontWeight: 800 }}>{cases.length}</span>
        </div>
        <div className="cases-pill" style={{ background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid var(--amber)' }}>
          <span>Unassigned</span> <span style={{ fontWeight: 800 }}>{cases.filter(c => !c.assignedLawyer).length}</span>
        </div>
        <div className="cases-pill" style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)' }}>
          <span>Emergency</span> <span style={{ fontWeight: 800 }}>{cases.filter(c => (c.urgency||'').toLowerCase() === 'emergency').length}</span>
        </div>
        <div className="cases-pill" style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green)' }}>
          <span>Showing</span> <span style={{ fontWeight: 800 }}>{filteredCases.length}</span>
        </div>
      </div>

      <div className="content-section" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="search-wrap">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by title, citizen, lawyer, or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Open">Open</option>
            <option value="Active">In Progress</option>
            <option value="Pending">Pending</option>
            <option value="Closed">Closed</option>
          </select>
          <select className="filter-select" value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
            <option value="All">All Urgency</option>
            <option value="Emergency">Emergency</option>
            <option value="Urgent">Urgent</option>
            <option value="Normal">Normal</option>
          </select>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <RefreshCw size={32} className="animate-spin" style={{ marginBottom: '16px', color: 'var(--gold)' }} />
              <p>Loading cases...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚖️</div>
              <p>No cases match your filters.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Case Details</th>
                  <th>Citizen</th>
                  <th>Assigned Lawyer</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Date Filed</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => {
                  const urgBadge = getUrgencyBadge(c.urgency);
                  const statBadge = getStatusBadge(c.status);
                  return (
                    <tr key={c._id}>
                      <td>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--gold-dim)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{c.title || "Untitled Matter"}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>#{c._id.slice(-6)} · {c.category || c.legalType || 'General'}</div>
                            <div style={{ marginTop: '6px', position: 'relative' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  color: '#0284c7',
                                  background: '#e0f2fe',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setActiveTooltip(activeTooltip === c._id ? null : c._id)}
                              >
                                🏛️ {c.courtLevel || "District Court"} ℹ️
                              </span>
                              {activeTooltip === c._id && (() => {
                                const exp = c.courtExplanation || getCourtExplanation(c.courtLevel || "District Court");
                                return (
                                  <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    zIndex: 10,
                                    background: 'white',
                                    border: '1px solid var(--border-dark)',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    width: '280px',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-primary)',
                                    marginTop: '4px'
                                  }}>
                                    <div style={{ fontWeight: 700, marginBottom: '6px', color: '#0284c7' }}>🏛️ {c.courtLevel || "District Court"}</div>
                                    <div style={{ marginBottom: '4px' }}><strong>Why this court:</strong> {exp.why}</div>
                                    <div style={{ marginBottom: '4px' }}><strong>Est. Timeline:</strong> {exp.timeline}</div>
                                    <div style={{ marginBottom: '4px' }}><strong>Est. Cost:</strong> {exp.estimatedCost}</div>
                                    <div><strong>Next Steps:</strong> {exp.nextStep}</div>
                                    <div style={{ textAlign: 'right', marginTop: '6px' }}>
                                      <button onClick={() => setActiveTooltip(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem', textDecoration: 'underline' }}>Close</button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                            {(c.user?.name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 500 }}>{c.user?.name || "Unknown"}</span>
                            {c.user?.preferredLanguage &&
                             c.user.preferredLanguage !== "en" && (
                              <div style={{
                                fontSize: "0.68rem",
                                color: "var(--text-muted)",
                                marginTop: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 3
                              }}>
                                {getLangFlag(c.user.preferredLanguage)}
                                {getLangName(c.user.preferredLanguage)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {c.assignedLawyer ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gold-dim)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                              {c.assignedLawyer.name[0].toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500 }}>{c.assignedLawyer.name}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--red)', fontSize: '0.9rem', fontWeight: 500 }}>
                            <AlertTriangle size={16} /> Unassigned
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge" style={{ background: urgBadge.bg, color: urgBadge.col }}>
                          {c.urgency || "Normal"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span className="badge" style={{ background: statBadge.bg, color: statBadge.col }}>
                            {c.status || "Active"}
                          </span>
                          {c.isMediationEligible && (() => {
                            const medLang = c.mediationLang || c.lang || c.user?.preferredLanguage || "en";
                            return (
                              <span
                                title="Mediation eligible case"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  color: "#c9a84c",
                                  background: "rgba(201,168,76,0.1)",
                                  border: "1px solid rgba(201,168,76,0.3)",
                                  borderRadius: 12,
                                  padding: "2px 7px",
                                  marginTop: 4,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap"
                                }}
                                onClick={() => {
                                  setSelectedMediation({
                                    eligible: true,
                                    script: c.mediationScript,
                                    videoUrl: c.mediationVideoUrl,
                                    lang: medLang,
                                    langName: getLangName(medLang),
                                    mediationAct: {
                                      actName: "The Mediation Act, 2023",
                                      enforcedDate: "9 October 2023",
                                      keyBenefit: "Faster private resolution"
                                    }
                                  });
                                  setShowPlayer(true);
                                }}
                              >
                                ⚖️ Mediation Eligible
                                {medLang !== "en" && (
                                  <span style={{
                                    fontSize: "0.62rem",
                                    color: "var(--text-muted)"
                                  }}>
                                    {getLangFlag(medLang)}
                                  </span>
                                )}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <Clock size={14} />
                          {new Date(c.createdAt).toLocaleDateString('en-IN')}
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

      {showPlayer && selectedMediation && (
        <MediationPlayer
          mediationInfo={selectedMediation}
          onChooseMediator={() => {
            setShowPlayer(false);
            toast.info("Mediator connection coming soon.");
          }}
          onChooseLawyer={() => {
            setShowPlayer(false);
            toast.info("Lawyer matching is already active for this case.");
          }}
          onClose={() => {
            setShowPlayer(false);
            setSelectedMediation(null);
          }}
        />
      )}
    </div>
  );
}
