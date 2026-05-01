import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import Sidebar from '../components/Sidebar';
import './subscription.css';

export default function Subscription() {
    const [lawyer, setLawyer] = useState(null);
    const [loading, setLoading] = useState(true);

    // Simulated Payment Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paying, setPaying] = useState(false);

    // Modal Configuration Form Inputs
    const [billingType, setBillingType] = useState('Monthly'); // 'Monthly' or 'Annual'
    const [seats, setSeats] = useState(1);
    const [formInputs, setFormInputs] = useState({ cardName: '', cardNumber: '', expiry: '', cvv: '', upi: '', email: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get("/lawyers/me");
            setLawyer(res.data);
            setFormInputs((prev) => ({ ...prev, email: res.data.email || '' }));
            setLoading(false);
        } catch (err) {
            console.error("Profile fetch failed", err);
        }
    };

    const handleOpenPayment = (planName, price) => {
        setSelectedPlan({ planName, price });
        setBillingType('Monthly');
        setSeats(1);
        setFormInputs({ cardName: '', cardNumber: '', expiry: '', cvv: '', upi: '', email: lawyer?.email || '' });
        setModalOpen(true);
    };

    const handleConfirmPayment = async (e) => {
        e.preventDefault();
        setPaying(true);
        try {
            if (!formInputs.cardName.trim()) {
                alert("Please enter your name.");
                setPaying(false);
                return;
            }
            if (!formInputs.upi.trim() && !formInputs.cardNumber.trim()) {
                alert("Please enter either a UPI ID or a Credit/Debit Card.");
                setPaying(false);
                return;
            }

            // Construct and trigger standard UPI deep link redirection
            if (formInputs.upi.trim()) {
                const upiUrl = `upi://pay?pa=${encodeURIComponent(formInputs.upi)}&pn=${encodeURIComponent(formInputs.cardName)}&am=${totalDue}&cu=INR&tn=${encodeURIComponent(selectedPlan.planName + "_Upgrade")}`;
                window.location.href = upiUrl;
            }

            // Simulated payment delay for premium UX
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Explicit payment failure condition
            if (formInputs.upi.toLowerCase().includes("fail") || formInputs.cardName.toLowerCase().includes("fail")) {
                throw new Error("Payment declined by issuing bank.");
            }

            // Execute actual plan upgrade
            await axios.patch("/lawyers/upgrade", { planType: selectedPlan.planName });
            
            alert(`🎉 Payment Successful! Welcome to the ${selectedPlan.planName} Plan.`);
            setModalOpen(false);
            fetchProfile();
        } catch (err) {
            alert(err.message || "Upgrade failed. Please try again.");
        } finally {
            setPaying(false);
        }
    };

    if (loading) return <div className="loading">Loading JurisBot SaaS...</div>;

    const rawDays = Math.ceil((new Date(lawyer.subscriptionExpiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    const daysLeft = rawDays > 30 ? 30 : Math.max(0, rawDays);
    const usagePercent = Math.min((lawyer.casesClaimedCount / lawyer.caseLimit) * 100, 100);

    const totalDue = billingType === 'Monthly' ? (selectedPlan?.price || 0) : Math.round((selectedPlan?.price || 0) * 10.8);

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <div className="subscription-container" style={{ position: 'relative', width: '100%' }}>
                <header className="subscription-header">
                    <h1>SaaS Marketplace & Tiers</h1>
                    <p>Manage your practice growth and case quotas.</p>
                </header>

                {lawyer.limitExceeded && (
                    <div className="limit-warning" style={{ background: '#ff333333', border: '1px solid #ff3333', padding: '12px 20px', borderRadius: '8px', color: '#ffaaaa', marginBottom: '20px', fontSize: '15px' }}>
                        ⚠️ You have reached or exceeded your {lawyer.subscriptionTier} plan's case limit ({lawyer.caseLimit} Cases)! Please upgrade your tier below to accept more cases.
                    </div>
                )}

                <div className="status-card">
                    <div className="status-info">
                        <h2>Current Membership</h2>
                        <div className="current-tier">{lawyer.subscriptionTier}</div>
                    </div>

                    <div className="usage-section">
                        <div className="usage-labels">
                            <span>Case Usage</span>
                            <span>{lawyer.casesClaimedCount} / {lawyer.caseLimit === 9999 ? "∞" : lawyer.caseLimit} Cases</span>
                        </div>
                        <div className="usage-bar-bg">
                            <div className="usage-bar-fill" style={{ width: `${lawyer.caseLimit === 9999 ? 100 : usagePercent}%` }}></div>
                        </div>
                    </div>

                    <div className="expiry-info">
                        <h2>Renews In</h2>
                        <div className="expiry-days">{daysLeft > 0 ? `${daysLeft} Days` : "Expired"}</div>
                    </div>
                </div>

                <div className="pricing-grid">
                    {/* Trial */}
                    <div className={`pricing-card ${lawyer.subscriptionTier === 'Trial' ? 'popular' : ''}`}>
                        <div className="plan-name">Free Trial</div>
                        <div className="plan-price">₹0<span>/month</span></div>
                        <ul className="plan-features">
                            <li>2 Active Cases</li>
                            <li>Basic AI Assistant</li>
                            <li>WhatsApp Alerts for Hearings</li>
                            <li>Community Support</li>
                            <li>30 Days Duration</li>
                        </ul>
                        {lawyer.subscriptionTier === 'Trial' ? (
                            <button className="upgrade-btn current-plan-btn">Current Plan</button>
                        ) : (
                            <button className="upgrade-btn" disabled>Already Used</button>
                        )}
                    </div>

                    {/* Starter */}
                    <div className={`pricing-card ${lawyer.subscriptionTier === 'Starter' ? 'popular' : ''}`}>
                        <div className="popular-badge">POPULAR</div>
                        <div className="plan-name">Starter Plan</div>
                        <div className="plan-price">₹499<span>/month</span></div>
                        <ul className="plan-features">
                            <li>5 Active Cases</li>
                            <li>Priority AI Access</li>
                            <li>WhatsApp Alerts</li>
                            <li>Document Auto-Brief</li>
                        </ul>
                        {lawyer.subscriptionTier === 'Starter' ? (
                            <button className="upgrade-btn current-plan-btn" onClick={() => handleOpenPayment("Starter", 499)}>Renew Plan</button>
                        ) : (
                            <button className="upgrade-btn" onClick={() => handleOpenPayment("Starter", 499)}>
                                {lawyer.subscriptionTier === 'Trial' ? 'Upgrade Now' : 'Switch to Starter'}
                            </button>
                        )}
                    </div>

                    {/* Pro */}
                    <div className={`pricing-card ${lawyer.subscriptionTier === 'Pro' ? 'popular' : ''}`}>
                        <div className="plan-name">Pro Plan</div>
                        <div className="plan-price">₹1999<span>/month</span></div>
                        <ul className="plan-features">
                            <li>Unlimited Cases</li>
                            <li>Deep-Dive AI Legal Research</li>
                            <li>Unlimited Video Consultations</li>
                            <li>WhatsApp Alerts Suite</li>
                            <li>Premium Dashboard Analytics</li>
                        </ul>
                        {lawyer.subscriptionTier === 'Pro' ? (
                            <button className="upgrade-btn current-plan-btn" onClick={() => handleOpenPayment("Pro", 1999)}>Renew Plan</button>
                        ) : (
                            <button className="upgrade-btn" onClick={() => handleOpenPayment("Pro", 1999)}>Go Unlimited</button>
                        )}
                    </div>
                </div>

                {/* 💳 STUNNING ADVANCED REFERENCE CHECKOUT FULL-SCREEN OVERLAY */}
                {modalOpen && (
                    <div className="checkout-overlay" style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: '#131317', display: 'flex', zIndex: 9999, overflowY: 'auto',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#fff'
                    }}>
                        <div className="checkout-content-wrapper" style={{
                            display: 'flex', width: '100%', maxWidth: '1200px', margin: 'auto', padding: '40px 20px', gap: '50px'
                        }}>
                            {/* LEFT SIDE: CONFIGURATION & PLAN INFO */}
                            <div className="checkout-left" style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '30px', color: '#8b949e' }} onClick={() => setModalOpen(false)}>
                                    <span style={{ fontSize: '24px', marginRight: '8px' }}>‹</span>
                                    <span style={{ fontSize: '18px', fontWeight: '500' }}>Configure your plan</span>
                                </div>

                                {/* Plan details */}
                                <div style={{ marginBottom: '40px' }}>
                                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#fff' }}>Plan details</h4>
                                    <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
                                        <div onClick={() => setBillingType('Monthly')} style={{
                                            flex: 1, padding: '20px', background: billingType === 'Monthly' ? '#22252a' : '#1a1d22',
                                            border: billingType === 'Monthly' ? '1.5px solid #2f81f7' : '1.5px solid #30363d',
                                            borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease'
                                        }}>
                                            <div style={{ fontWeight: '600', fontSize: '15px' }}>Monthly billing</div>
                                            <div style={{ fontSize: '13px', color: '#8b949e', marginTop: '4px' }}>INR ₹{selectedPlan?.price} seat/mo</div>
                                        </div>
                                        <div onClick={() => setBillingType('Annual')} style={{
                                            flex: 1, padding: '20px', background: billingType === 'Annual' ? '#22252a' : '#1a1d22',
                                            border: billingType === 'Annual' ? '1.5px solid #2f81f7' : '1.5px solid #30363d',
                                            borderRadius: '12px', cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease'
                                        }}>
                                            <span style={{
                                                position: 'absolute', top: '14px', right: '14px', background: '#238636', color: '#fff',
                                                fontSize: '11px', padding: '3px 8px', borderRadius: '12px', fontWeight: '600'
                                            }}>SAVE 10%</span>
                                            <div style={{ fontWeight: '600', fontSize: '15px' }}>Annual billing</div>
                                            <div style={{ fontSize: '13px', color: '#8b949e', marginTop: '4px' }}>INR ₹{Math.round((selectedPlan?.price || 0) * 10.8)} seat/yr</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div style={{ marginBottom: '40px' }}>
                                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#fff' }}>Contact information</h4>
                                    <div style={{ background: '#1a1d22', border: '1px solid #30363d', borderRadius: '12px', padding: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8b949e', marginBottom: '6px' }}>EMAIL</label>
                                        <input type="email" value={formInputs.email} onChange={e => setFormInputs({ ...formInputs, email: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '15px', outline: 'none' }} />
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#fff' }}>Payment method</h4>
                                    <div style={{ background: '#1a1d22', border: '1px solid #30363d', borderRadius: '12px', padding: '24px', marginBottom: '15px' }}>
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8b949e', marginBottom: '6px' }}>CARDHOLDER / ADVOCATE NAME</label>
                                            <input type="text" placeholder="Advocate Nishal" required value={formInputs.cardName} onChange={e => setFormInputs({ ...formInputs, cardName: e.target.value })} style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', padding: '14px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                                        </div>

                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8b949e', marginBottom: '6px' }}>UPI ID</label>
                                                <input type="text" placeholder="name@upi" value={formInputs.upi} onChange={e => setFormInputs({ ...formInputs, upi: e.target.value })} style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', padding: '14px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8b949e', marginBottom: '6px' }}>CREDIT / DEBIT CARD</label>
                                                <input type="text" placeholder="4242 4242 4242 4242" value={formInputs.cardNumber} onChange={e => setFormInputs({ ...formInputs, cardNumber: e.target.value })} style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', padding: '14px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SIDE: SUMMARY & ACTION BUTTON */}
                            <div className="checkout-right" style={{ width: '420px' }}>
                                <div style={{ background: '#1d1e24', border: '1px solid #30363d', borderRadius: '16px', padding: '35px', position: 'sticky', top: '40px' }}>
                                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#fff' }}>{selectedPlan?.planName} Plan</h3>
                                    
                                    <div style={{ fontSize: '14px', color: '#8b949e', marginTop: '15px' }}>Top features</div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0 30px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#c9d1d9' }}>
                                            <span style={{ color: '#2f81f7', marginRight: '10px', fontSize: '18px' }}>🌐</span> Advanced access to top legal tiers
                                        </li>
                                        <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#c9d1d9' }}>
                                            <span style={{ color: '#2f81f7', marginRight: '10px', fontSize: '18px' }}>🛡️</span> Secure dashboard & case logs
                                        </li>
                                        <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#c9d1d9' }}>
                                            <span style={{ color: '#2f81f7', marginRight: '10px', fontSize: '18px' }}>🤖</span> Team tools like custom AI legal research
                                        </li>
                                        <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#c9d1d9' }}>
                                            <span style={{ color: '#2f81f7', marginRight: '10px', fontSize: '18px' }}>📱</span> WhatsApp updates & notifications suite
                                        </li>
                                    </ul>

                                    <div style={{ borderTop: '1px solid #30363d', paddingTop: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                                            <span style={{ color: '#8b949e' }}>{billingType} subscription</span>
                                            <span>₹{totalDue.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px' }}>
                                            <span style={{ color: '#8b949e' }}>Estimated tax</span>
                                            <span>₹0.00</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #30363d', paddingTop: '15px', marginBottom: '25px', fontWeight: '700', fontSize: '18px' }}>
                                            <span>Due today</span>
                                            <span style={{ color: '#fff' }}>₹{totalDue.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div style={{ background: '#21262d', padding: '12px', borderRadius: '8px', color: '#79c0ff', fontSize: '12px', textAlign: 'center', marginBottom: '20px' }}>
                                        ➕ 10,000+ businesses created a workspace today
                                    </div>

                                    <button onClick={handleConfirmPayment} disabled={paying} style={{
                                        width: '100%', background: paying ? '#f0f6fc66' : '#f0f6fc', border: 'none', color: '#0d1117', padding: '16px',
                                        borderRadius: '30px', cursor: paying ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold', transition: 'all 0.3s ease'
                                    }}>
                                        {paying ? "SUBMITTING..." : "Subscribe"}
                                    </button>

                                    <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '16px', textAlign: 'center' }}>
                                        Renews {billingType.toLowerCase()}ly until cancelled. You'll be charged ₹{totalDue.toLocaleString()} based on active seats.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
