import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = "http://localhost:5000/api/admin";

export default function VerificationQueue() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/pending-lawyers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPending(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Pending Error:", err);
      setLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this practitioner?`)) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_BASE}/verify-lawyer/${id}`, 
        { status: status === 'approve' ? 'verified' : 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPending(); // Refresh list
    } catch (err) {
      alert("Verification failed: " + err.message);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h2>Practitioner Verification</h2>
        <div className="badge badge-pending">{pending.length} Applications Pending</div>
      </header>

      <div className="content-section">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Practitioner Name</th>
              <th>Specialization</th>
              <th>Experience</th>
              <th>Application Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No pending verifications found. The queue is clean.
                </td>
              </tr>
            ) : (
              pending.map((lawyer) => (
                <tr key={lawyer._id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{lawyer.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{lawyer.email}</div>
                  </td>
                  <td>{lawyer.specialization || "General Practice"}</td>
                  <td>{lawyer.experience || "0"} Years</td>
                  <td>{new Date(lawyer.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="btn-primary" 
                        onClick={() => handleVerify(lawyer._id, 'approve')}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn-outline" 
                        style={{ color: '#ef4444' }}
                        onClick={() => handleVerify(lawyer._id, 'reject')}
                      >
                        Reject
                      </button>
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
