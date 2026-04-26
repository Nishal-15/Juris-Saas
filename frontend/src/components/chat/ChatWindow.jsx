import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios"; // 👈 Standard project axios
import "./chat.css";
import { startListening } from "./VoiceControls";

const CHIPS = [
  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: "Fundamental Rights (Constitution of India)" },
  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: "Family Law (Divorce, Child Custody & Alimony)" },
  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: "Property Law (Inheritance, Disputes & Gift Deeds)" },
  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/></svg>, label: "Criminal Justice (Bail, FIR & Rights of Accused)" },
  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>, label: "Consumer Protection (Deficiency in Service & Claims)" },
];

export default function ChatWindow() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    // 🔥 PROACTIVE WELCOME GREETING
    setMessages([
      { role: "ai", text: "Hello! I am JurisBot, your AI Legal Assistant. How can I help you with Indian law, your legal rights, or case guidance today?" }
    ]);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const { i18n, t } = useTranslation();

  const send = async (text) => {
    const userText = text ?? input;
    if (!userText.trim() || loading) return;
    setInput("");

    setMessages(prev => [...prev, { role: "user", text: userText }, { role: "ai", text: "..." }]);
    setLoading(true);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userLang = user.preferredLanguage || "en";

    try {
      const res = await axios.post("/chat", { 
        message: userText,
        lang: userLang
      });
      
      setMessages(prev => {
        const updated = [...prev];
        let answer = res.data.answer || "I'm sorry, I couldn't process that legal query.";
        
        // 🛡️ Safety Check: If AI returns raw SVG/HTML code (hallucination or crash)
        if (answer.includes("<svg") || answer.includes("<!DOCTYPE") || answer.startsWith("d=\"M")) {
          answer = "JurisBot encountered a processing error while generating the legal response. Please try rephrasing your question.";
        }

        updated[updated.length - 1] = { role: "ai", text: answer };
        return updated;
      });

    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "ai", text: "JurisBot is currently experiencing high traffic. Please try again in a few moments or use the 'Consult a Lawyer' section for urgent assistance." };
        return updated;
      });
    }

    setLoading(false);
  };

  return (
    <div className="chat-wrap">

      <div className="chat-head">
        <div className="chat-head-icon" style={{ background: '#fff', padding: '2px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #c9a84c' }} />
        </div>
        <div>
          <div className="chat-head-name">JurisBot AI</div>
          <div className="chat-head-sub">Global Law & Justice Assistant</div>
        </div>
        <div className="chat-head-status">Online</div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
             {/* Empty check handled by useEffect now */}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="message-container">
               <div className={`bubble ${m.role}`}>
                 {m.text}
                 {loading && i === messages.length - 1 && m.role === "ai" && (
                   <span className="cursor">|</span>
                 )}
               </div>
               
               {/* Show Library only after the first AI message */}
               {i === 0 && m.role === "ai" && (
                 <div className="legal-library fade-in">
                    <p className="library-title">Explore Legal Topics:</p>
                    <div className="chat-chips">
                       {CHIPS.map(c => (
                         <button className="chat-chip glass" key={c.label} onClick={() => send(c.label)}>
                           <span className="chip-icon">{c.icon}</span>
                           <span className="chip-label">{c.label}</span>
                         </button>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-box">
          <input
            placeholder="Ask your legal question…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
          />
          <button className="chat-btn-voice" onClick={() => startListening(setInput)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>
          <button className="chat-btn-send" disabled={loading} onClick={() => send()}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <p className="chat-input-hint">JurisBot may make errors. Verify critical legal information with a qualified lawyer.</p>
      </div>

    </div>
  );
}