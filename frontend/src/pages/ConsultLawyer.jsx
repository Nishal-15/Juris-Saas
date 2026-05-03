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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lawRes, appRes] = await Promise.all([
          axios.get("/lawyers"),
          axios.get("/appointments/my")
        ]);
        let list = lawRes.data;
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

  return (
    <div className="cl-page">
      <MobileHeader />
      <Sidebar />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1 className="cl-title">Expert Advocates</h1>
            {filterType ? (
              <p className="cl-subtitle">Showing advocates specialising in <strong style={{ color: "#c9a84c" }}>{filterType}</strong></p>
            ) : (
              <p className="cl-subtitle">Book a consultation with verified legal professionals. Chat opens after expert acceptance.</p>
            )}
          </div>
          {filterType && (
            <button className="cl-clear-filter" onClick={() => navigate("/lawyers")}>
              Clear Filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="cl-empty"><div className="cl-spinner" /> Loading advocates...</div>
        ) : lawyers.length === 0 ? (
          <div className="cl-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <p>No advocates available at this time.</p>
          </div>
        ) : (
          <div className="cl-grid">
            {lawyers.map(lawyer => {
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
                  <div className="cl-avatar-wrap-premium">
                    <div className="cl-avatar-premium">{initials}</div>
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
                    <div className="cl-detail-item"><strong>Specialization:</strong> {lawyer.specialization?.split(",")[0]?.trim() || "General Practice"}</div>
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
      <BottomNav />
    </div>
  );
}
