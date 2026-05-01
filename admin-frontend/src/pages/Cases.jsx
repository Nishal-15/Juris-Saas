import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, User, Scale, Clock } from 'lucide-react';

const API_BASE = "http://localhost:5000/api/admin";

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/all-cases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCases(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Cases Error:", err);
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h2>Global Case Intelligence</h2>
        <div className="badge badge-verified">{cases.length} Total Matters</div>
      </header>

      <div className="content-section">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Case Details</th>
              <th>Citizen</th>
              <th>Assigned Lawyer</th>
              <th>Status</th>
              <th>Date Filed</th>
            </tr>
          </thead>
          <tbody>
            {cases.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No cases found on the national grid.
                </td>
              </tr>
            ) : (
              cases.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{c.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>#{c._id.slice(-6)}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} color="#64748b" />
                      {c.user?.name || "Unknown"}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Scale size={14} color="#c9a84c" />
                      {c.assignedLawyer?.name || <span style={{ color: '#ef4444' }}>Unassigned</span>}
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ 
                        background: c.status === 'closed' ? '#f1f5f9' : '#dcfce7', 
                        color: c.status === 'closed' ? '#475569' : '#166534' 
                    }}>
                        {c.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      <Clock size={14} color="#64748b" />
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
