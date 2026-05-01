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

  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem("jurisbot_chat_sessions");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    if (sessions.length === 0) {
      const initialId = Date.now().toString();
      const initialSession = {
        id: initialId,
        title: "New Chat Session",
        messages: [{ role: "ai", text: "Hello! I am JurisBot, your AI Legal Assistant. How can I help you with Indian law, your legal rights, or case guidance today?" }]
      };
      setSessions([initialSession]);
      setCurrentSessionId(initialId);
      setMessages(initialSession.messages);
      localStorage.setItem("jurisbot_chat_sessions", JSON.stringify([initialSession]));
    } else {
      const lastSession = sessions[0];
      setCurrentSessionId(lastSession.id);
      setMessages(lastSession.messages);
    }
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const { i18n, t } = useTranslation();

  const updateSessions = (updatedMessages, textInput) => {
    setMessages(updatedMessages);
    setSessions(prev => {
      const updatedSessions = prev.map(s => {
        if (s.id === currentSessionId) {
          const newTitle = s.title === "New Chat Session" && textInput ? textInput : s.title;
          return { ...s, title: newTitle, messages: updatedMessages };
        }
        return s;
      });
      localStorage.setItem("jurisbot_chat_sessions", JSON.stringify(updatedSessions));
      return updatedSessions;
    });
  };

  const handleNewChat = () => {
    // If an empty new chat session already exists, switch to it instead of creating another.
    const existingEmptySession = sessions.find(
      s => s.title === "New Chat Session" || s.messages.length === 1
    );
    if (existingEmptySession) {
      setCurrentSessionId(existingEmptySession.id);
      setMessages(existingEmptySession.messages);
      return;
    }

    const newId = Date.now().toString();
    const newSession = {
      id: newId,
      title: "New Chat Session",
      messages: [{ role: "ai", text: "Hello! I am JurisBot, your AI Legal Assistant. How can I help you with Indian law, your legal rights, or case guidance today?" }]
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setCurrentSessionId(newId);
    setMessages(newSession.messages);
    localStorage.setItem("jurisbot_chat_sessions", JSON.stringify(updated));
  };

  const handleSelectChat = (id) => {
    const targetSession = sessions.find(s => s.id === id);
    if (targetSession) {
      setCurrentSessionId(id);
      setMessages(targetSession.messages);
    }
  };

  const handleDeleteChat = (e, id) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length === 0) {
      const newId = Date.now().toString();
      const newSession = {
        id: newId,
        title: "New Chat Session",
        messages: [{ role: "ai", text: "Hello! I am JurisBot, your AI Legal Assistant. How can I help you with Indian law, your legal rights, or case guidance today?" }]
      };
      setSessions([newSession]);
      setCurrentSessionId(newId);
      setMessages(newSession.messages);
      localStorage.setItem("jurisbot_chat_sessions", JSON.stringify([newSession]));
    } else {
      setSessions(filtered);
      localStorage.setItem("jurisbot_chat_sessions", JSON.stringify(filtered));
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
        setMessages(filtered[0].messages);
      }
    }
  };

  const send = async (text) => {
    const userText = text ?? input;
    if (!userText.trim() || loading) return;
    setInput("");

    const updated = [...messages, { role: "user", text: userText }, { role: "ai", text: "..." }];
    updateSessions(updated, userText);
    setLoading(true);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userLang = user.preferredLanguage || "en";

    try {
      const res = await axios.post("/chat", { 
        message: userText,
        lang: userLang
      });
      
      let answer = res.data.answer || "I'm sorry, I couldn't process that legal query.";
      if (answer.includes("<svg") || answer.includes("<!DOCTYPE") || answer.startsWith("d=\"M")) {
        answer = "JurisBot encountered a processing error while generating the legal response. Please try rephrasing your question.";
      }

      const finalMessages = [...updated];
      finalMessages[finalMessages.length - 1] = { role: "ai", text: answer };
      updateSessions(finalMessages);

    } catch (err) {
      console.error("Chat error:", err);
      const errMessages = [...updated];
      errMessages[errMessages.length - 1] = { role: "ai", text: "JurisBot is currently experiencing high traffic. Please try again in a few moments or use the 'Consult a Lawyer' section for urgent assistance." };
      updateSessions(errMessages);
    }

    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* ChatGPT-like Left Sidebar */}
      {sidebarOpen && (
        <div className="chat-sidebar" style={{
          width: '280px', background: '#111418', borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%', flexShrink: 0
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={handleNewChat} style={{
              flex: 1, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: '10px', color: '#c9a84c', padding: '12px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', fontSize: '14px',
              transition: 'all 0.2s ease', outline: 'none'
            }}>
              ➕ New Chat
            </button>
            <button onClick={() => setSidebarOpen(false)} title="Close sidebar" style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              color: '#8b949e', width: '42px', height: '42px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'all 0.2s', outline: 'none'
            }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessions.map(s => (
              <div key={s.id} onClick={() => handleSelectChat(s.id)} style={{
                padding: '12px 14px', background: s.id === currentSessionId ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                border: s.id === currentSessionId ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.03)',
                borderRadius: '8px', color: s.id === currentSessionId ? '#fff' : '#8b949e', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', fontSize: '13px'
              }}>
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                  💬 {s.title}
                </span>
                <span onClick={(e) => handleDeleteChat(e, s.id)} style={{ color: '#ff5555', cursor: 'pointer', fontSize: '14px', padding: '2px 6px', borderRadius: '4px' }}>
                  🗑️
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="chat-wrap" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>

        <div className="chat-head">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} title="Open sidebar" style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              color: '#8b949e', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'all 0.2s', outline: 'none', marginRight: '12px'
            }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            </button>
          )}

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
    </div>
  );
}