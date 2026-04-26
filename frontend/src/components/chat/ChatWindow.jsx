import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios"; // 👈 Standard project axios
import "./chat.css";
import { startListening } from "./VoiceControls";

const CHIPS = [
  { icon: "", label: "Fundamental Rights (Constitution of India)" },
  { icon: "", label: "Family Law (Divorce, Child Custody & Alimony)" },
  { icon: "", label: "Property Law (Inheritance, Disputes & Gift Deeds)" },
  { icon: "", label: "Criminal Justice (Bail, FIR & Rights of Accused)" },
  { icon: "", label: "Consumer Protection (Deficiency in Service & Claims)" },
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
          <button className="chat-btn-voice" onClick={() => startListening(setInput)}>MIC</button>
          <button className="chat-btn-send" disabled={loading} onClick={() => send()}>SEND</button>
        </div>
        <p className="chat-input-hint">JurisBot may make errors. Verify critical legal information with a qualified lawyer.</p>
      </div>

    </div>
  );
}