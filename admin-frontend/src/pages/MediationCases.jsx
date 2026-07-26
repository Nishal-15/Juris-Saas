import React, { useState, useEffect } from "react";
import API from "../api/axios";
import { useToast } from "../components/Toast";
import MediationPlayer from "../components/MediationPlayer";
import MediationBanner from "../components/MediationBanner";
import { Scale, RefreshCw, FileText, User } from "lucide-react";

export default function MediationCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchMediationCases();
  }, []);

  const fetchMediationCases = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/all-cases?limit=100");
      const data = Array.isArray(res.data) ? res.data : (res.data.cases || []);
      const medCases = data.filter(c => c.isMediationEligible);
      setCases(medCases);
    } catch {
      toast.error("Failed to load cases");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status = "Active") => {
    const s = status.toLowerCase();
    if (s.includes("closed") || s.includes("resolved")) return { bg: "var(--bg-base)", col: "var(--text-muted)" };
    if (s.includes("pending")) return { bg: "var(--amber-dim)", col: "var(--amber)" };
    return { bg: "var(--green-dim)", col: "var(--green)" };
  };

  return (
    <div className="animate-fade-in">
      <style>{`
        .med-card {
          background: #fff;
          border: 1px solid var(--border);
          border-top: 3px solid #8b5cf6;
          border-radius: 12px;
          padding: 20px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
        }
        .med-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.06);
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {/* Page Header */}
      <header className="page-header" style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Mediation Act 2023 Cases</h2>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "6px" }}>
            {cases.length} cases eligible for mediation
          </div>
        </div>
        <button className="btn-outline" onClick={fetchMediationCases} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {/* Info Banner */}
      <div
        style={{
          background: "rgba(139,92,246,0.06)",
          border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: "14px",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px"
        }}
      >
        <div style={{ fontSize: "1.8rem" }}>⚖️</div>
        <div style={{ color: "var(--text-primary)", fontSize: "0.88rem", lineHeight: 1.5 }}>
          <strong style={{ color: "#8b5cf6" }}>These cases qualify for resolution under The Mediation Act, 2023 (enforced 9 Oct 2023).</strong>{" "}
          Mediation is faster (30-90 days), cheaper, and private. No court appearance required.
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px", color: "var(--text-muted)" }}>
          <RefreshCw size={32} className="animate-spin" style={{ marginBottom: "16px", color: "#8b5cf6" }} />
          <p>Loading mediation cases...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="empty-state" style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)", background: "#fff", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>⚖️</div>
          <p style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "6px" }}>
            No mediation eligible cases found yet.
          </p>
          <p style={{ fontSize: "0.9rem" }}>
            Cases are automatically detected when filed.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            gap: "20px"
          }}
        >
          {cases.map((c) => {
            const statBadge = getStatusBadge(c.status);
            const scriptSnippet = c.mediationScript ? (c.mediationScript.slice(0, 120) + (c.mediationScript.length > 120 ? "..." : "")) : null;

            return (
              <div key={c._id} className="med-card">
                {/* Card Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(139,92,246,0.12)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "1rem", marginBottom: "2px" }}>
                        {c.title || "Untitled Matter"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        #{c._id.slice(-6)} · {c.category || c.legalType || "General"}
                      </div>
                    </div>
                  </div>
                  <span className="badge" style={{ background: statBadge.bg, color: statBadge.col }}>
                    {c.status || "Active"}
                  </span>
                </div>

                {/* Citizen Row */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
                  <User size={15} color="var(--text-muted)" />
                  <span>Citizen: <strong style={{ color: "var(--text-primary)" }}>{c.user?.name || "Unknown Citizen"}</strong></span>
                </div>

                {/* Script Preview */}
                {scriptSnippet ? (
                  <blockquote
                    style={{
                      background: "rgba(139,92,246,0.06)",
                      borderLeft: "3px solid #8b5cf6",
                      borderRadius: "0 8px 8px 0",
                      padding: "10px 14px",
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      fontStyle: "italic",
                      margin: "0 0 16px 0"
                    }}
                  >
                    "{scriptSnippet}"
                  </blockquote>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.82rem", margin: "0 0 16px 0" }}>
                    Script being generated...
                  </div>
                )}

                {/* Video status indicator */}
                <div style={{ marginBottom: "16px" }}>
                  {c.mediationVideoUrl && c.mediationVideoUrl.startsWith("pending:") ? (
                    <div style={{ color: "#f59e0b", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                      <span>🔄</span> Video generating...
                    </div>
                  ) : c.mediationVideoUrl ? (
                    <div style={{ color: "#10b981", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                      <span>✅</span> Video ready
                    </div>
                  ) : (
                    <div style={{ color: "#c9a84c", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                      <span>📝</span> Text explanation available
                    </div>
                  )}
                </div>

                {/* Button Row */}
                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--border-light)" }}>
                  <button
                    className="btn-primary"
                    style={{ padding: "8px 16px", fontSize: "0.85rem", background: "#8b5cf6", borderColor: "#8b5cf6" }}
                    onClick={() => {
                      setSelectedCase(c);
                      setShowPlayer(true);
                    }}
                  >
                    View Explanation
                  </button>
                  <span style={{ fontSize: "0.75rem", background: "var(--bg-light)", padding: "4px 10px", borderRadius: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                    {c.mediationLangName || "English"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MediationPlayer Modal */}
      {showPlayer && selectedCase && (
        <MediationPlayer
          mediationInfo={{
            eligible: true,
            script: selectedCase.mediationScript,
            videoUrl: selectedCase.mediationVideoUrl,
            lang: "en",
            langName: "English",
            mediationAct: {
              actName: "The Mediation Act, 2023",
              enforcedDate: "9 October 2023",
              keyBenefit: "Faster private resolution"
            }
          }}
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
            setSelectedCase(null);
          }}
        />
      )}
    </div>
  );
}
