import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Scale, Star, Briefcase } from 'lucide-react';

const API_BASE = "http://localhost:5000/api/admin";

export default function LegalExperts() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLawyers();
  }, []);

  const fetchLawyers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/lawyers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLawyers(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Lawyers Error:", err);
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h2>Legal Experts Directory</h2>
        <div className="badge badge-verified">{lawyers.length} Verified Practitioners</div>
      </header>

      <div className="content-section">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Expert Name</th>
              <th>Specialization</th>
              <th>Experience</th>
              <th>Rating</th>
              <th>Active Cases</th>
            </tr>
          </thead>
          <tbody>
            {lawyers.map((l) => (
              <tr key={l._id}>
                <td>
                  <div style={{ fontWeight: '600' }}>{l.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{l.email}</div>
                </td>
                <td><span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{l.specialization}</span></td>
                <td>{l.experience} Years</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#eab308' }}>
                    <Star size={14} fill="#eab308" /> {l.rating || "4.5"}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{l.caseCount || 0}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
