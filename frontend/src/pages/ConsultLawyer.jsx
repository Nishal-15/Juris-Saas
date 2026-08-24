import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import BottomNav from "../components/layout/BottomNav";
import MobileHeader from "../components/layout/MobileHeader";
import axios from "../api/axios";
import socket from "../api/socket";
import "./consult.css";

export default function ConsultLawyer() {
  const navigate = useNavigate();
  const location = useLocation();
  const filterType = new URLSearchParams(location.search).get("type");
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [booking, setBooking] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lawRes, appRes] = await Promise.all([
          axios.get("/lawyers"),
          axios.get("/appointments/my")
        ]);
        let list = lawRes.data.lawyers || lawRes.data;
        if (filterType) list = list.filter(l => l.specialization?.toLowerCase().includes(filterType.toLowerCase()));
        setLawyers(list);
        setAppointments(appRes.data);
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, [filterType]);

  const bookConsultation = async (lawyerId) => {
    setBooking(lawyerId);
    try {
      await axios.post("/appointments", { lawyerId, date: new Date().toLocaleDateString("en-GB"), time: "10:30 AM" });
      socket.emit("notify", { to: lawyerId, text: "New consultation request received." });
      const appRes = await axios.get("/appointments/my");
      setAppointments(appRes.data);
    } catch (err) {
      alert("Booking failed: " + (err.response?.data?.message || err.message));
    } finally { setBooking(null); }
  };

  const getStatus = (lawyerId) => {
    const app = appointments.find(a => a.lawyerId?._id === lawyerId || a.lawyerId === lawyerId);
    return app ? app.status : null;
  };

  // Extract unique specializations for the dropdown
  const uniqueSpecializations = [...new Set(
    lawyers.map(l => {
      if (!l.specialization) return null;
      if (typeof l.specialization === 'string') return l.specialization.split(",")[0]?.trim();
      if (Array.isArray(l.specialization)) return l.specialization[0]?.trim();
      return String(l.specialization);
    }).filter(Boolean)
  )].sort();

  // Filter Logic
  const displayedLawyers = lawyers.filter(l => {
    const matchesSearch = 
      (l.name && l.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.firm && l.firm.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let spec = "";
    if (typeof l.specialization === 'string') {
      spec = l.specialization.split(",")[0]?.trim();
    } else if (Array.isArray(l.specialization)) {
      spec = l.specialization[0]?.trim();
    } else if (l.specialization) {
      spec = String(l.specialization);
    }

    const matchesSpec = selectedSpec === "" || spec === selectedSpec;

    return matchesSearch && matchesSpec;
  });

  return (
    <div className="cl-page">
      <MobileHeader />
      <Sidebar />
      <div className="cl-body">
        <div className="cl-header">
          <div className="cl-header-text">
            <h1 className="cl-title">Expert Advocates</h1>
            {filterType ? (
              <p className="cl-subtitle">Showing advocates specialising in <strong style={{ color: "#c9a84c" }}>{filterType}</strong></p>
            ) : (
              <p className="cl-subtitle">Book a consultation with verified legal professionals. Chat opens after expert acceptance.</p>
            )}
          </div>
          {filterType && (
            <button className="cl-clear-filter" onClick={() => navigate("/lawyers")}>
              Clear Category Filter
            </button>
          )}
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="cl-controls">
          <div className="cl-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search by advocate or firm name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="cl-filter-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <select value={selectedSpec} onChange={(e) => setSelectedSpec(e.target.value)}>
              <option value="">All Specializations</option>
              {uniqueSpecializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="cl-empty"><div className="cl-spinner" /> Loading advocates...</div>
        ) : displayedLawyers.length === 0 ? (
          <div className="cl-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <p>No advocates match your search criteria.</p>
            {(searchTerm || selectedSpec) && (
              <button className="cl-clear-filter" onClick={() => { setSearchTerm(""); setSelectedSpec(""); }}>
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="cl-grid">
            {displayedLawyers.map(lawyer => {
              const status = getStatus(lawyer._id);
              const initials = lawyer.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div className="cl-card premium-card" key={lawyer._id}>
                  {/* Top Certified Header */}
                  <div className="cl-certified-header">JURISBOT CERTIFIED</div>

                  {/* Pro/Verified Badge */}
                  <div className="cl-pro-badge">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" style={{ marginRight: "4px" }}>
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    VERIFIED BY JURISBOT
                  </div>

                  {/* Halo Avatar */}
                  <div 
                    className="cl-avatar-wrap-premium" 
                    onClick={() => { if (lawyer.photo || lawyer.avatar) setSelectedImage(lawyer.photo || lawyer.avatar); }}
                    style={{ cursor: (lawyer.photo || lawyer.avatar) ? 'pointer' : 'default' }}
                  >
                    {(lawyer.photo || lawyer.avatar) ? (
                      <img src={lawyer.photo || lawyer.avatar} alt="Profile" className="cl-avatar-img" />
                    ) : (
                      <div className="cl-avatar-premium">{initials}</div>
                    )}
                  </div>

                  {/* Name & Title */}
                  <div className="cl-name">{lawyer.name}</div>
                  <div className="cl-title-adv">Senior Advocate</div>

                  {/* Subtitle / Location */}
                  <div className="cl-location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {lawyer.firm || "National Legal Identification"}
                  </div>

                  {/* Experience Card Section */}
                  <div className="cl-experience-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                      <path d="M12 20V10M18 20V4M6 20v-4" />
                    </svg>
                    <div className="cl-experience-text">
                      <span className="cl-exp-label">Years of</span>
                      <span className="cl-exp-value">Experience: {lawyer.experience || "10+"}+</span>
                    </div>
                  </div>

                  {/* Explicit Details Section */}
                  <div className="cl-details-list">
                    <div className="cl-detail-item"><strong>Bar Council Reg:</strong> {lawyer.barId || "BAR2023IND987"}</div>
                    <div className="cl-detail-item"><strong>Firm:</strong> {lawyer.firm || "Capital Legal Chambers"}</div>
                    <div className="cl-detail-item">
                      <strong>Specialization:</strong> {
                        typeof lawyer.specialization === 'string' ? lawyer.specialization.split(",")[0]?.trim() :
                        Array.isArray(lawyer.specialization) ? lawyer.specialization[0]?.trim() :
                        lawyer.specialization ? String(lawyer.specialization) : "General Practice"
                      }
                    </div>
                  </div>

                  {/* Certificate Expiry Block */}
                  <div className="cl-expiry-block">
                    <span>ISSUED: 14 NOV 2024</span>
                    <span>EXPIRES: 14 NOV 2029</span>
                  </div>

                  {/* CTA Button */}
                  {!status ? (
                    <button
                      className="cl-btn cl-btn-book"
                      onClick={() => bookConsultation(lawyer._id)}
                      disabled={booking === lawyer._id}
                    >
                      {booking === lawyer._id ? "Sending Request..." : "Book Consultation"}
                    </button>
                  ) : status === "Accepted" ? (
                    <button className="cl-btn cl-btn-active" onClick={() => navigate(`/chat/${lawyer._id}`)}>
                      <span className="cl-active-dot" />
                      Active Consultation
                    </button>
                  ) : (
                    <button className="cl-btn cl-btn-pending" disabled>
                      Reviewing Request...
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="image-lightbox" onClick={() => setSelectedImage(null)}>
          <span className="lightbox-close">&times;</span>
          <img src={selectedImage} alt="Full Profile" className="lightbox-content" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <BottomNav />
    </div>
  );
}
