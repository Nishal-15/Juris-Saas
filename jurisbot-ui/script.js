/* ─────────────────────────────────────────────────────────
   JurisBot AI — script.js
   Sidebar toggle · localStorage persistence · Chat logic
   Mobile overlay · Auto-resize textarea · Suggestion chips
───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ═══════════════ ELEMENT REFS ════════════════════════ */
  const sidebar       = document.getElementById('sidebar');
  const mainWrapper   = document.getElementById('mainWrapper');
  const toggleBtn     = document.getElementById('sidebarToggle');
  const overlay       = document.getElementById('sidebarOverlay');
  const chatInput     = document.getElementById('chatInput');
  const sendBtn       = document.getElementById('sendBtn');
  const micBtn        = document.getElementById('micBtn');
  const messagesEl    = document.getElementById('messagesContainer');
  const welcomeEl     = document.getElementById('chatWelcome');
  const newConsultBtn = document.getElementById('newConsultBtn');
  const topbarTitle   = document.getElementById('topbarTitle');
  const suggestions   = document.querySelectorAll('.suggestion-chip');
  const navItems      = document.querySelectorAll('.nav-item');

  /* ═══════════════ SIDEBAR TOGGLE ══════════════════════ */
  const STORAGE_KEY = 'jurisbot_sidebar';
  const isMobile = () => window.innerWidth <= 768;

  function applyState(collapsed, animate = false) {
    if (!animate) {
      sidebar.style.transition = 'none';
      mainWrapper.style.transition = 'none';
      requestAnimationFrame(() => {
        sidebar.style.transition = '';
        mainWrapper.style.transition = '';
      });
    }

    if (collapsed) {
      sidebar.classList.add('collapsed');
      mainWrapper.classList.add('expanded');
      overlay.classList.remove('active');
    } else {
      sidebar.classList.remove('collapsed');
      mainWrapper.classList.remove('expanded');
      if (isMobile()) overlay.classList.add('active');
    }
  }

  function toggleSidebar() {
    const willCollapse = !sidebar.classList.contains('collapsed');
    applyState(willCollapse, true);
    if (!isMobile()) {
      localStorage.setItem(STORAGE_KEY, willCollapse ? 'collapsed' : 'open');
    }
  }

  // Restore state on load
  (function restoreState() {
    if (isMobile()) {
      applyState(true, false);
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      applyState(saved === 'collapsed', false);
    }
  })();

  toggleBtn.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', () => applyState(true, true));

  // Keyboard shortcut: Ctrl+B or Cmd+B
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    }
    if (e.key === 'Escape' && isMobile() && !sidebar.classList.contains('collapsed')) {
      applyState(true, true);
    }
  });

  window.addEventListener('resize', () => {
    if (!isMobile()) {
      overlay.classList.remove('active');
      const saved = localStorage.getItem(STORAGE_KEY);
      applyState(saved === 'collapsed', false);
    } else {
      applyState(true, false);
    }
  });

  /* ═══════════════ NAV ITEMS ════════════════════════════ */
  const pageTitles = {
    chat:    'Legal AI Chat',
    cases:   'My Cases',
    lawyers: 'Consult a Lawyer',
    docs:    'Documents',
    notif:   'Notifications',
  };

  const pageIcons = {
    chat:    '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
    cases:   '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    lawyers: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    docs:    '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>',
    notif:   '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
  };

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const page = item.dataset.page;
      if (page && pageTitles[page]) {
        topbarTitle.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="1.8" stroke-linecap="round" width="16" height="16">
            ${pageIcons[page] || ''}
          </svg>
          ${pageTitles[page]}
        `;
      }
      if (isMobile()) applyState(true, true);
    });
  });

  /* ═══════════════ AUTO-RESIZE TEXTAREA ════════════════ */
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px';
  });

  /* ═══════════════ CHAT ENGINE ══════════════════════════ */
  let isTyping = false;
  const AI_ENDPOINT = 'http://127.0.0.1:8088/chat';

  function formatTime() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  function hideWelcome() {
    if (welcomeEl && welcomeEl.style.display !== 'none') {
      welcomeEl.style.opacity = '0';
      welcomeEl.style.transition = 'opacity 0.3s';
      setTimeout(() => { welcomeEl.style.display = 'none'; }, 300);
    }
  }

  function scrollToBottom() {
    const area = document.getElementById('chatArea');
    area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
  }

  function renderMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/^(?!<[hlu])(.+)$/gm, (m) => m.trim() ? m : '')
      .replace(/(<\/ul>)\s*(<ul>)/g, '</ul><ul>');
  }

  function appendMessage(role, text) {
    const row = document.createElement('div');
    row.className = `msg-row ${role}`;

    const avatarLetter = role === 'ai' ? 'J' : 'N';
    const content = role === 'ai' ? renderMarkdown(text) : escapeHtml(text);

    row.innerHTML = `
      <div class="msg-avatar">${avatarLetter}</div>
      <div>
        <div class="msg-bubble">${role === 'ai' ? `<p>${content}</p>` : content}</div>
        <div class="msg-time">${formatTime()}</div>
      </div>
    `;
    messagesEl.appendChild(row);
    scrollToBottom();
    return row;
  }

  function showTyping() {
    const row = document.createElement('div');
    row.className = 'msg-row ai typing-indicator';
    row.id = 'typingRow';
    row.innerHTML = `
      <div class="msg-avatar">J</div>
      <div>
        <div class="msg-bubble">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    messagesEl.appendChild(row);
    scrollToBottom();
  }

  function removeTyping() {
    const el = document.getElementById('typingRow');
    if (el) el.remove();
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function sendMessage(text) {
    if (!text.trim() || isTyping) return;
    isTyping = true;
    sendBtn.disabled = true;

    hideWelcome();
    appendMessage('user', text);
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
      appendMessage('ai', data.answer || data.error || 'JurisBot could not process your request right now.');
    } catch (err) {
      removeTyping();
      appendMessage('ai', 'Unable to connect to JurisBot AI server. Please ensure the service is running on port 8088.');
    } finally {
      isTyping = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  /* ── Send on button click ─────────────────────────────── */
  sendBtn.addEventListener('click', () => sendMessage(chatInput.value));

  /* ── Send on Enter (Shift+Enter = newline) ────────────── */
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput.value);
    }
  });

  /* ── Suggestion chips ─────────────────────────────────── */
  suggestions.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.q;
      if (q) sendMessage(q);
    });
  });

  /* ── New Consultation ─────────────────────────────────── */
  newConsultBtn.addEventListener('click', () => {
    messagesEl.innerHTML = '';
    if (welcomeEl) {
      welcomeEl.style.display = 'flex';
      welcomeEl.style.opacity = '1';
      welcomeEl.style.transition = '';
    }
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatInput.focus();
    if (isMobile()) applyState(true, true);
  });

  /* ═══════════════ VOICE INPUT (Web Speech API) ═════════ */
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isRecording = false;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      chatInput.value = transcript;
      chatInput.dispatchEvent(new Event('input'));
    };
    recognition.onend = () => {
      isRecording = false;
      micBtn.classList.remove('recording');
    };
    recognition.onerror = () => {
      isRecording = false;
      micBtn.classList.remove('recording');
    };

    micBtn.addEventListener('click', () => {
      if (isRecording) {
        recognition.stop();
      } else {
        recognition.start();
        isRecording = true;
        micBtn.classList.add('recording');
      }
    });
  } else {
    micBtn.title = 'Voice input not supported in this browser';
    micBtn.style.opacity = '0.4';
    micBtn.style.cursor = 'not-allowed';
  }

})();
