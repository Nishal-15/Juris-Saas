import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./cinematic.css";

export default function CinematicLanding() {
  const [scene, setScene] = useState(0); 
  const [storyIndex, setStoryIndex] = useState(0);
  const navigate = useNavigate();

  const handleStart = () => {
    const token = localStorage.getItem("token");
    if (token) navigate("/user");
    else navigate("/login");
  };

  useEffect(() => {
    // Scene 0: Confusion (0-3s)
    // Scene 1: Clarity (3-5s)
    const t1 = setTimeout(() => setScene(1), 3000);
    
    // Scene 2: Story Flashes (5-10s)
    const t2 = setTimeout(() => setScene(2), 5000);
    
    // Scene 3: Timeline (10-13s)
    const t3 = setTimeout(() => setScene(3), 10000);
    
    // Scene 4: Ending CTA (13s+)
    const t4 = setTimeout(() => setScene(4), 13000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  useEffect(() => {
    if (scene === 2) {
      const interval = setInterval(() => {
        setStoryIndex(prev => prev < 4 ? prev + 1 : prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [scene]);

  const storySets = [
    { p: "I don't know my rights.", s: "AI Legal Guidance" },
    { p: "I don't know what documents are required.", s: "Smart Document Guidance" },
    { p: "I don't know which lawyer I need.", s: "Find the Right Lawyer" },
    { p: "I need to file my case.", s: "Guided Case Filing" },
    { p: "I want everything in one secure place.", s: "Legal Document Vault" }
  ];

  const milestones = [
    "Confused", "Understand Rights", "AI Guidance", "Prepare Documents", 
    "Find Lawyer", "Consult", "File Case", "Track Progress", "Move Forward With Confidence"
  ];

  const floatingAnimation = {
    y: ["-10px", "10px", "-10px"],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  };

  return (
    <div className="cinematic-page">
      <AnimatePresence>
        {/* ======================================================== */}
        {/* SCENE 0: CONFUSION (0s - 3s)                             */}
        {/* ======================================================== */}
        {scene === 0 && (
          <motion.div 
            key="scene-confusion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)", scale: 1.2, transition: { duration: 1.5 } }}
            style={{ position: "absolute", inset: 0, zIndex: 10 }}
          >
            <motion.div animate={floatingAnimation} className="cine-question q1">"Which lawyer should I approach?"</motion.div>
            <motion.div animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 1 } }} className="cine-question q2">"Which court handles my issue?"</motion.div>
            <motion.div animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 2 } }} className="cine-question q3">"What documents do I need?"</motion.div>
            <motion.div animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 1.5 } }} className="cine-question q4">"Can this dispute be resolved through mediation?"</motion.div>
            <motion.div animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 0.5 } }} className="cine-question q5">"How much time will this take?"</motion.div>
            <motion.div animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 2.5 } }} className="cine-question q6">"How much will this cost?"</motion.div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* SCENE 1: CLARITY (3s - 5s)                               */}
        {/* ======================================================== */}
        {scene === 1 && (
          <motion.div 
            key="scene-clarity"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 1.5 } }}
            exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.8 } }}
            style={{ position: "absolute", zIndex: 12, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px" }}
          >
            {/* Glowing Orb */}
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 2 }} transition={{ duration: 2 }}
              className="cine-orb-blue" style={{ zIndex: -1 }} 
            />
            
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
                <span style={{ fontSize: 'clamp(2rem, 6vw, 2.5rem)' }}>⚖️</span>
                <h1 className="cine-title cine-hero-title">JurisBot</h1>
              </div>
              <h2 className="cine-text cine-hero-subtitle" style={{ textAlign: "center" }}>
                Legal help shouldn't begin with confusion.
              </h2>
            </motion.div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* SCENE 2: STORY FLASHES (5s - 10s)                        */}
        {/* ======================================================== */}
        {scene === 2 && (
          <motion.div 
            key="scene-story"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            style={{ position: "absolute", zIndex: 20, width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={storyIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                style={{ textAlign: "center", padding: "0 20px", display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                {/* AI Icon */}
                <div style={{ width: "60px", height: "60px", borderRadius: "15px", background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "25px", color: "#3b82f6" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ width: "30px", height: "30px" }}>
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                
                <p className="cine-text" style={{ fontSize: "1rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "15px" }}>The Reality</p>
                <h2 className="cine-title cine-story-reality" style={{ marginBottom: "30px", opacity: 0.7 }}>"{storySets[storyIndex].p}"</h2>
                
                <p className="cine-text" style={{ fontSize: "1rem", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "15px" }}>The JurisBot Solution</p>
                <h2 className="cine-title cine-story-solution">{storySets[storyIndex].s}</h2>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* SCENE 3: TIMELINE (10s - 13s)                             */}
        {/* ======================================================== */}
        {scene === 3 && (
          <motion.div 
            key="scene-timeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.5 } }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            style={{ position: "absolute", zIndex: 30, width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            <div className="cine-timeline-wrapper">
              <div className="cine-timeline-line" />
              
              <div className="cine-timeline-progress-container">
                {/* Auto-fill the line over 2.5 seconds */}
                <motion.div 
                  initial={{ height: "0%" }}
                  animate={{ height: "100%" }}
                  transition={{ duration: 2.5, ease: "linear" }}
                  className="cine-timeline-progress" 
                />
              </div>

              {milestones.map((m, i) => {
                const isLeft = i % 2 === 0;
                // Stagger the fade-in of dots based on index to match the 2.5s line fill
                const delay = (2.5 / milestones.length) * i;

                return (
                  <div key={i} className="cine-timeline-dot-wrapper">
                    {isLeft && (
                      <motion.div 
                        initial={{ opacity: 0, color: "rgba(255,255,255,0.3)" }} 
                        animate={{ opacity: 1, color: "#ffffff" }} 
                        transition={{ delay }}
                        className="cine-timeline-label left"
                      >
                        <span className="cine-text cine-timeline-text">{m}</span>
                      </motion.div>
                    )}

                    <motion.div 
                      initial={{ background: "#080A12", borderColor: "rgba(255,255,255,0.2)", scale: 0.8 }}
                      animate={{ background: "#3b82f6", borderColor: "#3b82f6", scale: 1.1 }}
                      transition={{ delay }}
                      style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid", zIndex: 4, position: "absolute" }} 
                    />

                    {!isLeft && (
                      <motion.div 
                        initial={{ opacity: 0, color: "rgba(255,255,255,0.3)" }} 
                        animate={{ opacity: 1, color: "#ffffff" }} 
                        transition={{ delay }}
                        className="cine-timeline-label right"
                      >
                        <span className="cine-text cine-timeline-text">{m}</span>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* SCENE 4: ENDING (13s+)                                     */}
        {/* ======================================================== */}
        {scene === 4 && (
          <motion.div 
            key="scene-ending"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 1 } }}
            style={{ position: "absolute", zIndex: 40, textAlign: "center", padding: "0 20px" }}
          >
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
        )}
      </AnimatePresence>
    </div>
  );
}
