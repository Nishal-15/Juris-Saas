import { useState, useEffect } from "react";
import axios from "../api/axios";
import Sidebar from "../components/layout/Sidebar";
import "./admindashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ lawyers: 0, pending: 0, citizens: 0, cases: 0 });
  const [pendingLawyers, setPendingLawyers] = useState([]);
  const [broadcast, setBroadcast] = useState({ title: "", message: "", priority: "info", target: "all" });
  const [lawFile, setLawFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lawyersRes, pendingRes, citizensRes, casesRes] = await Promise.all([
        axios.get("/admin/lawyers"),
        axios.get("/admin/pending-lawyers"),
        axios.get("/admin/citizens"),
        axios.get("/admin/all-cases")
      ]);
      setPendingLawyers(pendingRes.data);
      setStats({
        lawyers: lawyersRes.data.length,
        pending: pendingRes.data.length,
        citizens: citizensRes.data.length,
        cases: casesRes.data.length
      });
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await axios.patch(`/admin/verify-lawyer/${id}`, { status });
      fetchData();
    } catch (err) {
      alert("Verification failed");
    }
  };

  const handleBroadcast = async () => {
    if (!broadcast.title || !broadcast.message) return;
    try {
      await axios.post("/admin/broadcast", broadcast);
      alert("Broadcast transmitted successfully!");
      setBroadcast({ title: "", message: "", priority: "info", target: "all" });
    } catch (err) {
      alert("Broadcast failed.");
    }
  };

  const handleUploadLaw = async () => {
    if (!lawFile) return;
    const formData = new FormData();
    formData.append("pdf", lawFile);
    setUploadStatus("Uploading & Indexing...");
    
    try {
      const res = await axios.post("/admin/upload-law", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploadStatus(res.data.message);
      setLawFile(null);
    } catch (err) {
      setUploadStatus("Upload failed.");
    }
  };

  return (
    <div className="admin-page">
      <Sidebar />
      <div className="admin-body">
        
        <div className="admin-header">
          <h1 className="admin-title">System Oversight Command</h1>
          <p className="admin-subtitle">JurisBot Enterprise Administration Console</p>
        </div>

        {/* METRICS */}
        <div className="admin-metrics">
          <div className="metric-card">
            <h3>Verified Lawyers</h3>
            <div className="metric-value">{stats.lawyers}</div>
          </div>
          <div className="metric-card">
            <h3>Pending Approvals</h3>
            <div className="metric-value warning">{stats.pending}</div>
          </div>
          <div className="metric-card">
            <h3>Active Citizens</h3>
            <div className="metric-value">{stats.citizens}</div>
          </div>
          <div className="metric-card">
            <h3>Total Cases</h3>
            <div className="metric-value">{stats.cases}</div>
          </div>
        </div>

        <div className="admin-grid">
          
          {/* VERIFICATION QUEUE */}
          <div className="admin-panel queue-panel">
            <h2 className="panel-title">Lawyer Verification Queue</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Bar ID</th>
                    <th>Specialization</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLawyers.length === 0 ? (
                    <tr><td colSpan="4" className="empty-state">No pending approvals.</td></tr>
                  ) : (
                    pendingLawyers.map(lawyer => (
                      <tr key={lawyer._id}>
                        <td>{lawyer.name}<br/><small>{lawyer.email}</small></td>
                        <td>{lawyer.barCouncilId}</td>
                        <td>{lawyer.specialization}</td>
                        <td>
                          <button className="btn-approve" onClick={() => handleVerify(lawyer._id, "verified")}>Approve</button>
                          <button className="btn-reject" onClick={() => handleVerify(lawyer._id, "rejected")}>Reject</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-side-panels">
            {/* VECTOR DB MANAGER */}
            <div className="admin-panel">
              <h2 className="panel-title">Vector DB (RAG) Manager</h2>
              <p className="panel-desc">Upload a Supreme Court PDF to instantly inject it into the AI's Neural Knowledge Base.</p>
              <div className="upload-box">
                <input type="file" accept=".pdf" onChange={e => setLawFile(e.target.files[0])} />
                <button className="btn-upload" onClick={handleUploadLaw} disabled={!lawFile}>Inject into Vector DB</button>
              </div>
              {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
            </div>

            {/* BROADCAST SYSTEM */}
            <div className="admin-panel">
              <h2 className="panel-title">Institutional Broadcast</h2>
              <p className="panel-desc">Transmit overriding emergency alerts to all connected screens.</p>
              <div className="broadcast-form">
                <select value={broadcast.priority} onChange={e => setBroadcast({...broadcast, priority: e.target.value})}>
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="emergency">Emergency (Red Override)</option>
                </select>
                <input type="text" placeholder="Signal Title" value={broadcast.title} onChange={e => setBroadcast({...broadcast, title: e.target.value})} />
                <textarea placeholder="Signal Message..." value={broadcast.message} onChange={e => setBroadcast({...broadcast, message: e.target.value})} />
                <button className="btn-broadcast" onClick={handleBroadcast}>Transmit Signal</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
