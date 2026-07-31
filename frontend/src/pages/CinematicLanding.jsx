import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./cinematic.css";

export default function CinematicLanding() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const navigate = useNavigate();

  const handleStart = () => {
    const token = localStorage.getItem("token");
    if (token) navigate("/user");
    else navigate("/login");
  };

  // --- 1. HERO SECTION TRANSFORMS (0 to 0.25) ---
  const heroQuestionsOpacity = useTransform(scrollYProgress, [0, 0.1, 0.15], [1, 1, 0]);
  const heroQuestionsBlur = useTransform(scrollYProgress, [0, 0.15], ["blur(0px)", "blur(20px)"]);
  const heroQuestionsScale = useTransform(scrollYProgress, [0, 0.15], [1, 1.2]);
  
  const heroLightOpacity = useTransform(scrollYProgress, [0.15, 0.2, 0.25, 0.3], [0, 1, 1, 0]);
  const heroLightScale = useTransform(scrollYProgress, [0.15, 0.25], [0.5, 2]);

  const heroHeadlineOpacity = useTransform(scrollYProgress, [0.2, 0.25, 0.3, 0.35], [0, 1, 1, 0]);
  const heroHeadlineY = useTransform(scrollYProgress, [0.2, 0.25], [40, 0]);

  // --- 2. STORY JOURNEY TRANSFORMS (0.35 to 0.65) ---
  const storySets = [
    { p: "I don't know my rights.", s: "AI Legal Guidance" },
    { p: "I don't know what documents are required.", s: "Smart Document Guidance" },
    { p: "I don't know which lawyer I need.", s: "Find the Right Lawyer" },
    { p: "I need to file my case.", s: "Guided Case Filing" },
    { p: "I want everything in one secure place.", s: "Legal Document Vault" }
  ];

  const getStoryOpacity = (index) => {
    const start = 0.35 + (index * 0.06);
    const mid = start + 0.03;
    const end = start + 0.06;
    return useTransform(scrollYProgress, [start - 0.01, start, mid, end - 0.01, end], [0, 1, 1, 1, 0]);
  };

  const getProblemOpacity = (index) => {
    const start = 0.35 + (index * 0.06);
    const mid = start + 0.025;
    return useTransform(scrollYProgress, [start, start + 0.01, mid - 0.01, mid], [0, 1, 1, 0]);
  };

  const getSolutionOpacity = (index) => {
    const start = 0.35 + (index * 0.06);
    const mid = start + 0.025;
    const end = start + 0.06;
    return useTransform(scrollYProgress, [mid, mid + 0.01, end - 0.01, end], [0, 1, 1, 0]);
  };

  // --- 3. TIMELINE TRANSFORMS (0.65 to 0.85) ---
  const timelineContainerOpacity = useTransform(scrollYProgress, [0.65, 0.7, 0.85, 0.9], [0, 1, 1, 0]);
  const timelineProgressHeight = useTransform(scrollYProgress, [0.7, 0.85], ["0%", "100%"]);

  const milestones = [
    "Confused", "Understand Rights", "AI Guidance", "Prepare Documents", 
    "Find Lawyer", "Consult", "File Case", "Track Progress", "Move Forward With Confidence"
  ];

  // --- 4. ENDING TRANSFORMS (0.9 to 1.0) ---
  const endingOpacity = useTransform(scrollYProgress, [0.85, 0.95], [0, 1]);
  const endingY = useTransform(scrollYProgress, [0.85, 0.95], [50, 0]);

  // Floating animation for initial questions
  const floatingAnimation = {
    y: ["-10px", "10px", "-10px"],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  };

  return (
    <div ref={containerRef} className="cinematic-page" style={{ height: "450vh" }}>
      
      {/* Sticky viewport container */}
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
        
        {/* ======================================================== */}
        {/* 1. HERO SECTION (CONFUSION -> CLARITY)                     */}
        {/* ======================================================== */}
        <motion.div style={{ position: "absolute", inset: 0, opacity: heroQuestionsOpacity, filter: heroQuestionsBlur, scale: heroQuestionsScale, pointerEvents: "none", zIndex: 10 }}>
          <motion.div animate={floatingAnimation} className="cine-question q1">"Which lawyer should I approach?"</motion.div>
          <motion.div animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 1 } }} className="cine-question q2">"Which court handles my issue?"</motion.div>
          <motion.div animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 2 } }} className="cine-question q3">"What documents do I need?"</motion.div>
          <motion.div animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 1.5 } }} className="cine-question q4">"Can this dispute be resolved through mediation?"</motion.div>
          <motion.div animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 0.5 } }} className="cine-question q5">"How much time will this take?"</motion.div>
          <motion.div animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 2.5 } }} className="cine-question q6">"How much will this cost?"</motion.div>
          
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "40px", height: "100px", borderRadius: "20px", background: "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.01))" }} />
        </motion.div>

        {/* The Soft Blue Light of Clarity */}
        <motion.div style={{ position: "absolute", opacity: heroLightOpacity, scale: heroLightScale, zIndex: 11 }} className="cine-orb-blue" />

        {/* Hero Clarity Headline */}
        <motion.div style={{ position: "absolute", opacity: heroHeadlineOpacity, y: heroHeadlineY, textAlign: "center", zIndex: 12, width: "100%", padding: "0 20px", boxSizing: "border-box" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
            <span style={{ fontSize: 'clamp(2rem, 6vw, 2.5rem)' }}>⚖️</span>
            <h1 className="cine-title cine-hero-title">JurisBot</h1>
          </div>
          <h2 className="cine-text cine-hero-subtitle">
            Legal help shouldn't begin with confusion.
          </h2>
          <p className="cine-text cine-hero-desc">
            Understanding your first legal step shouldn't be the hardest part.
          </p>
          <div className="cine-hero-buttons">
            <button className="cine-btn-primary" onClick={handleStart}>Start Your Legal Journey</button>
            <button className="cine-btn-secondary" onClick={() => window.scrollBy({ top: window.innerHeight * 0.5, behavior: 'smooth' })}>Scroll to Explore</button>
          </div>
        </motion.div>

        {/* ======================================================== */}
        {/* 2. STORY JOURNEY (0.35 TO 0.65)                            */}
        {/* ======================================================== */}
        {storySets.map((set, i) => (
          <motion.div key={i} style={{ position: "absolute", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", opacity: getStoryOpacity(i), zIndex: 20 }}>
            {/* The Problem */}
            <motion.div style={{ position: "absolute", opacity: getProblemOpacity(i), textAlign: "center", padding: "0 20px" }}>
              <p className="cine-text" style={{ fontSize: "1rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "15px" }}>The Reality</p>
              <h2 className="cine-title cine-story-reality">"{set.p}"</h2>
            </motion.div>
            
            {/* The Solution */}
            <motion.div style={{ position: "absolute", opacity: getSolutionOpacity(i), textAlign: "center", padding: "0 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "15px", background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "25px", color: "#3b82f6" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ width: "30px", height: "30px" }}>
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <p className="cine-text" style={{ fontSize: "1rem", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "15px" }}>The JurisBot Solution</p>
              <h2 className="cine-title cine-story-solution">{set.s}</h2>
            </motion.div>
          </motion.div>
        ))}

        {/* ======================================================== */}
        {/* 3. LEGAL JOURNEY TIMELINE (0.65 TO 0.85)                 */}
        {/* ======================================================== */}
        <motion.div style={{ position: "absolute", opacity: timelineContainerOpacity, zIndex: 30, width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          
          <div className="cine-timeline-wrapper">
            
            <div className="cine-timeline-line" />
            
            <div className="cine-timeline-progress-container">
              <motion.div className="cine-timeline-progress" style={{ height: timelineProgressHeight }} />
            </div>

            {milestones.map((m, i) => {
              const triggerPoint = 0.7 + ((i / (milestones.length - 1)) * 0.15);
              
              const opacity = useTransform(scrollYProgress, [triggerPoint - 0.05, triggerPoint], [0.3, 1]);
              const color = useTransform(scrollYProgress, [triggerPoint - 0.05, triggerPoint], ["rgba(255,255,255,0.3)", "#ffffff"]);
              const scale = useTransform(scrollYProgress, [triggerPoint - 0.05, triggerPoint], [0.8, 1.1]);
              const dotBg = useTransform(scrollYProgress, [triggerPoint - 0.05, triggerPoint], ["#080A12", "#3b82f6"]);
              const dotBorder = useTransform(scrollYProgress, [triggerPoint - 0.05, triggerPoint], ["rgba(255,255,255,0.2)", "#3b82f6"]);

              const isLeft = i % 2 === 0;

              return (
                <div key={i} className="cine-timeline-dot-wrapper">
                  
                  {isLeft && (
                    <motion.div className="cine-timeline-label left" style={{ opacity, color }}>
                      <span className="cine-text cine-timeline-text">{m}</span>
                    </motion.div>
                  )}

                  <motion.div style={{ width: "16px", height: "16px", borderRadius: "50%", background: dotBg, border: "2px solid", borderColor: dotBorder, scale, zIndex: 4, position: "absolute" }} />

                  {!isLeft && (
                    <motion.div className="cine-timeline-label right" style={{ opacity, color }}>
                      <span className="cine-text cine-timeline-text">{m}</span>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ======================================================== */}
        {/* 4. ENDING (0.85 TO 1.0)                                    */}
        {/* ======================================================== */}
        <motion.div style={{ position: "absolute", opacity: endingOpacity, y: endingY, zIndex: 40, textAlign: "center", padding: "0 20px" }}>
          <div style={{ width: "80px", height: "80px", margin: "0 auto 30px auto", background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))", borderRadius: "20px", display: "flex", justifyContent: "center", alignItems: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: "2rem" }}>⚖️</span>
          </div>
          <h2 className="cine-title cine-ending-title">
            Justice begins with understanding.
          </h2>
          <p className="cine-text cine-ending-desc">
            JurisBot helps you take the first step with clarity, confidence, and guidance. The journey to resolving your legal dispute starts here.
          </p>
          <button className="cine-btn-primary" onClick={handleStart} style={{ padding: "20px 50px", fontSize: "1.3rem" }}>
            Start with JurisBot
          </button>
        </motion.div>

        {/* Global scroll indicator at bottom */}
        <motion.div style={{ position: "absolute", bottom: "40px", opacity: useTransform(scrollYProgress, [0, 0.05], [1, 0]), display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", zIndex: 50 }}>
          <span className="cine-text" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.4)" }}>Scroll to experience</span>
          <div style={{ width: "1px", height: "40px", background: "linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)" }} />
        </motion.div>

      </div>
    </div>
  );
}
