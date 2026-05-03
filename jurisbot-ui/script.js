/**
 * JurisBot AI — script.js
 * Sidebar: transform + margin-left sync (zero layout jump)
 * Persistence: localStorage key "jb_sidebar"
 * Mobile: overlay pattern
 * Chat: fetch → AI service at :8088/chat
 */

(function () {
  'use strict';

  /* ── Refs ────────────────────────────────────────── */
  const sidebar     = document.getElementById('sidebar');
  const mainWrapper = document.getElementById('mainWrapper');
  const toggleBtn   = document.getElementById('toggleBtn');
  const overlay     = document.getElementById('overlay');
  const welcome     = document.getElementById('welcome');
  const messages    = document.getElementById('messages');
  const chatArea    = document.getElementById('chatArea');
  const chatInput   = document.getElementById('chatInput');
  const sendBtn     = document.getElementById('sendBtn');
  const micBtn      = document.getElementById('micBtn');
  const newChatBtn  = document.getElementById('newChatBtn');
  const pageTitle   = document.getElementById('pageTitle');
  const chips       = document.querySelectorAll('.chip');
  const navLinks    = document.querySelectorAll('.nav-link');

  const STORAGE_KEY  = 'jb_sidebar';
  const AI_ENDPOINT  = 'http://127.0.0.1:8088/chat';
  const isMobile     = () => window.innerWidth <= 768;

  /* ══════════════════════════════════════════════════
     SIDEBAR — Core toggle logic
     Desktop: sidebar slides, main margin animates in sync
     Mobile:  sidebar overlays, main stays full-width
  ══════════════════════════════════════════════════ */
  function setSidebar(collapsed, save = true) {
    if (collapsed) {
      sidebar.classList.add('collapsed');
      mainWrapper.classList.add('expanded');
      // Mobile: remove overlay
      overlay.classList.remove('active');
    } else {
      sidebar.classList.remove('collapsed');
      mainWrapper.classList.remove('expanded');
      // Mobile: show overlay so clicking outside closes sidebar
      if (isMobile()) overlay.classList.add('active');
    }
    if (save && !isMobile()) {
      localStorage.setItem(STORAGE_KEY, collapsed ? 'closed' : 'open');
    }
  }

  function toggleSidebar() {
    const isCollapsed = sidebar.classList.contains('collapsed');
    setSidebar(!isCollapsed);
  }

  /* Restore saved state — run BEFORE first paint to avoid flash */
  (function restoreState() {
    if (isMobile()) {
      // Mobile always starts closed (overlay mode)
      setSidebar(true, false);
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      // Default: open — only close if explicitly saved as 'closed'
      setSidebar(saved === 'closed', false);
    }
  })();

  /* Disable transitions during initial restore to avoid flash */
  document.documentElement.style.setProperty('--dur', '0s');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.style.removeProperty('--dur');
    });
  });

  /* ── Event Listeners ─────────────────────────────── */
  toggleBtn.addEventListener('click', toggleSidebar);

  // Click overlay → close sidebar (mobile)
  overlay.addEventListener('click', () => setSidebar(true));

  // Keyboard shortcut Ctrl+B / Cmd+B
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    }
    // Escape closes sidebar on mobile
    if (e.key === 'Escape' && isMobile()) setSidebar(true);
  });

  // Reapply correct state when screen resizes across breakpoint
  let lastMobile = isMobile();
  window.addEventListener('resize', () => {
    const nowMobile = isMobile();
    if (nowMobile === lastMobile) return;
    lastMobile = nowMobile;
    if (nowMobile) {
      setSidebar(true, false);
    } else {
      overlay.classList.remove('active');
      const saved = localStorage.getItem(STORAGE_KEY);
      setSidebar(saved === 'closed', false);
    }
  });

  /* ══════════════════════════════════════════════════
     NAV LINKS
  ══════════════════════════════════════════════════ */
  const PAGE_META = {
    chat:    { label: 'Legal AI Chat',      icon: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>' },
    cases:   { label: 'My Cases',           icon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
    lawyers: { label: 'Consult a Lawyer',   icon: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
    docs:    { label: 'Documents',          icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/>' },
    notif:   { label: 'Notifications',      icon: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>' },
  };

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const page = link.dataset.page;
      const meta = PAGE_META[page];
      if (meta) {
        pageTitle.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="1.8"
               stroke-linecap="round" width="15" height="15">${meta.icon}</svg>
          ${meta.label}`;
      }
      // Close sidebar on mobile after navigation
      if (isMobile()) setSidebar(true);
    });
  });

  /* ══════════════════════════════════════════════════
     TEXTAREA AUTO-RESIZE
  ══════════════════════════════════════════════════ */
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px';
  });

  /* ══════════════════════════════════════════════════
     CHAT ENGINE
  ══════════════════════════════════════════════════ */
  let busy = false;

  function now() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  function hideWelcome() {
    if (!welcome.hidden) {
      welcome.style.opacity = '0';
      setTimeout(() => { welcome.hidden = true; welcome.style.opacity = ''; }, 280);
    }
  }

  function scrollBottom() {
    chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
  }

  /* Minimal markdown: bold, headers, bullets */
  function md(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^#{1,3} (.+)$/gm, '<b style="color:#c9a84c;display:block;margin:10px 0 4px">$1</b>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
      .replace(/(<\/ul>)\s*(<ul>)/g, '')
      .split(/\n{2,}/).map(p => p.startsWith('<') ? p : `<p>${p}</p>`).join('');
  }

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function addMsg(role, html) {
    const isAI = role === 'ai';
    const row = document.createElement('div');
    row.className = `msg-row ${role}`;
    row.innerHTML = `
      <div class="msg-av">${isAI ? 'J' : 'N'}</div>
      <div>
        <div class="msg-bubble">${html}</div>
        <div class="msg-time">${now()}</div>
      </div>`;
    messages.appendChild(row);
    scrollBottom();
    return row;
  }

  function showTyping() {
    const row = document.createElement('div');
    row.className = 'msg-row ai typing';
    row.id = 'typing';
    row.innerHTML = `
      <div class="msg-av">J</div>
      <div>
        <div class="msg-bubble">
          <div class="dot"></div><div class="dot"></div><div class="dot"></div>
        </div>
      </div>`;
    messages.appendChild(row);
    scrollBottom();
  }

  function removeTyping() {
    const el = document.getElementById('typing');
    if (el) el.remove();
  }

  async function send(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;

    hideWelcome();
    addMsg('user', esc(text));
    chatInput.value = '';
    chatInput.style.height = 'auto';
    showTyping();

    try {
      const res = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, lang: 'en', userName: 'Nishal' }),
      });
      const data = await res.json();
      removeTyping();
      addMsg('ai', md(data.answer || data.error || 'JurisBot could not process your request.'));
    } catch {
      removeTyping();
      addMsg('ai', 'Could not connect to JurisBot AI. Make sure the Python service is running on port 8088.');
    } finally {
      busy = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  sendBtn.addEventListener('click', () => send(chatInput.value));
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(chatInput.value); }
  });

  chips.forEach(c => c.addEventListener('click', () => send(c.dataset.q)));

  newChatBtn.addEventListener('click', () => {
    messages.innerHTML = '';
    welcome.hidden = false;
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatInput.focus();
    if (isMobile()) setSidebar(true);
  });

  /* ══════════════════════════════════════════════════
     VOICE INPUT (Web Speech API)
  ══════════════════════════════════════════════════ */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.continuous = false;
    rec.interimResults = false;
    let active = false;

    rec.onresult = (e) => {
      chatInput.value = e.results[0][0].transcript;
      chatInput.dispatchEvent(new Event('input'));
    };
    rec.onend = () => { active = false; micBtn.classList.remove('recording'); };
    rec.onerror = () => { active = false; micBtn.classList.remove('recording'); };

    micBtn.addEventListener('click', () => {
      if (active) { rec.stop(); }
      else { rec.start(); active = true; micBtn.classList.add('recording'); }
    });
  } else {
    micBtn.title = 'Voice input not supported';
    micBtn.style.opacity = '0.4';
    micBtn.style.cursor = 'not-allowed';
  }

})();
