import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Mail, MapPin } from 'lucide-react';

const API_BASE = "http://localhost:5000/api/admin";

export default function Citizens() {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCitizens();
  }, []);

  const fetchCitizens = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/citizens`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCitizens(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Citizens Error:", err);
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h2>Citizen Records</h2>
        <div className="badge badge-verified" style={{ background: '#e0f2fe', color: '#0369a1' }}>
          {citizens.length} Total Users
        </div>
      </header>

      <div className="content-section">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Citizen Name</th>
              <th>Contact Details</th>
              <th>Joined Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {citizens.map((c) => (
              <tr key={c._id}>
                <td>
                  <div style={{ fontWeight: '600' }}>{c.name}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <Mail size={14} color="#64748b" /> {c.email}
                  </div>
                </td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className="badge badge-verified">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
