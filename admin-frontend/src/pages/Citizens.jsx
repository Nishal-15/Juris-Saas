import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useToast } from '../components/Toast';
import { getLangName, getLangFlag, getLangNative, SUPPORTED_LANGUAGES } from '../config/languages';
import LanguageSelector from '../components/LanguageSelector';
import { Users, Mail, MapPin, Search, RefreshCw } from 'lucide-react';

const AVATAR_COLORS = [
  { bg:'rgba(59,130,246,0.12)', color:'#3b82f6' },
  { bg:'rgba(16,185,129,0.12)', color:'#10b981' },
  { bg:'rgba(201,168,76,0.12)', color:'#c9a84c' },
  { bg:'rgba(139,92,246,0.12)', color:'#8b5cf6' },
  { bg:'rgba(245,158,11,0.12)', color:'#f59e0b' },
  { bg:'rgba(239,68,68,0.12)',  color:'#ef4444' },
];

export default function Citizens() {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const toast = useToast();

  useEffect(() => {
    fetchCitizens();
  }, []);

  const fetchCitizens = async () => {
    try {
      const res = await API.get('/admin/citizens');
      setCitizens(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Citizens Error:", err);
      toast.error("Failed to load citizens");
      setLoading(false);
    }
  };

  const getIncomeBadge = (income) => {
    const inc = (income || "").toLowerCase();
    if (inc === "high") return { bg: "var(--gold-dim)", col: "var(--gold)" };
    if (inc === "mid") return { bg: "rgba(59,130,246,0.1)", col: "#3b82f6" };
    if (inc === "low") return { bg: "rgba(16,185,129,0.1)", col: "#10b981" };
    return { bg: "var(--bg-base)", col: "var(--text-muted)" };
  };

  const filtered = citizens.filter(c => {
    const s = search.toLowerCase();
    const matchSearch = !search ||
      (c.name || "").toLowerCase().includes(s) ||
      (c.email || "").toLowerCase().includes(s) ||
      (c.city || "").toLowerCase().includes(s);
    const matchLang = langFilter === "all" || (c.preferredLanguage || "en") === langFilter;
    return matchSearch && matchLang;
  });

  return (
    <div>


      <header className="page-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2>Citizen Records</h2>
          <div className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.85rem' }}>
            {citizens.length} Total Users
          </div>
        </div>
      </header>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: '220px', margin: 0 }}>
          <span className="search-icon">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search by name, email, or city..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={langFilter}
          onChange={e => setLangFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            fontSize: "0.875rem",
            outline: "none",
            cursor: "pointer"
          }}
        >
          <option value="all">All Languages</option>
          {SUPPORTED_LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="content-section" style={{ padding: '24px' }}>
        {loading ? (
          <div className="loading-container">
            <RefreshCw size={32} className="animate-spin" style={{ marginBottom: '16px', color: 'var(--gold)' }} />
            <p>Loading records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-state-icon">
              <Users size={32} />
            </div>
            <p>{search ? "No citizens match your search." : "No records found."}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Citizen Name</th>
                  <th>Contact Details</th>
                  <th>Location</th>
                  <th>Language</th>
                  <th>Income Tier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const incomeBadge = getIncomeBadge(c.incomeTier);
                  const ac = AVATAR_COLORS[(c.name || "U").charCodeAt(0) % 6];
                  return (
                    <tr key={c._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: ac.bg, color: ac.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                            {(c.name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600' }}>{c.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Joined {new Date(c.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                          <Mail size={14} color="#64748b" /> {c.email}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <MapPin size={14} /> {c.city ? `${c.city}, ${c.state || ''}` : "Not specified"}
                        </div>
                      </td>
                      <td>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: "0.82rem"
                        }}>
                          <span style={{ fontSize: "1rem" }}>
                            {getLangFlag(c.preferredLanguage || "en")}
                          </span>
                          <div>
                            <div style={{
                              fontWeight: 600,
                              color: "var(--text-primary)"
                            }}>
                              {getLangName(c.preferredLanguage || "en")}
                            </div>
                            <div style={{
                              fontSize: "0.68rem",
                              color: "var(--text-muted)"
                            }}>
                              {getLangNative(c.preferredLanguage || "en")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: incomeBadge.bg, color: incomeBadge.col, textTransform: 'capitalize' }}>
                          {c.incomeTier || "Unspecified"}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-verified">Active</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
