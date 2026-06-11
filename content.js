/*!
 * Markdown Browser — Content Script
 * Renders markdown for file:// URLs opened directly in Chrome.
 */

(function () {
  // Chrome renders text files as <body><pre>…</pre></body>
  const pre = document.querySelector('body > pre');
  if (!pre) return;

  const raw = pre.textContent;
  const filename = decodeURIComponent(location.pathname.split('/').pop());

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Inject extension stylesheet
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('app.css');
  document.head.appendChild(link);

  // Override app.css rules that assume the full app shell
  const style = document.createElement('style');
  style.textContent = `
    html, body {
      height: auto !important;
      overflow: auto !important;
      background: var(--bg-1) !important;
    }
    body {
      /* top padding accounts for the fixed topbar (40px) */
      padding: 64px max(24px, calc(50vw - 440px)) 80px !important;
      margin: 0 !important;
    }
    #mb-topbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 40px;
      background: var(--bg-2);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 10px;
      font-family: var(--font-ui);
      font-size: 12px;
      color: var(--text-2);
      z-index: 999;
      user-select: none;
    }
    #mb-topbar .mb-brand {
      color: var(--accent);
      font-weight: 600;
      letter-spacing: 0.01em;
    }
    #mb-topbar .mb-sep { color: var(--text-3); }
    #mb-topbar .mb-file {
      color: var(--text-2);
      font-size: 11.5px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 40vw;
    }
  `;
  document.head.appendChild(style);

  document.title = filename;

  // Render markdown
  const { html } = Markdown.parse(raw);
  document.body.innerHTML = `
    <div id="mb-topbar">
      <svg width="15" height="15" viewBox="0 0 52 52" fill="none">
        <rect width="52" height="52" rx="10" fill="#D4622A" fill-opacity="0.18"/>
        <path d="M13 16h26M13 24h20M13 32h16M13 40h22" stroke="#D4622A" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <span class="mb-brand">Markdown Browser</span>
      <span class="mb-sep">·</span>
      <span class="mb-file">${escapeHtml(filename)}</span>
    </div>
    <article class="markdown-body">${html}</article>
  `;

  // Wire copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const code = btn.dataset.code || btn.closest('.code-block')?.querySelector('code')?.innerText || '';
      await navigator.clipboard.writeText(code);
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
  });

  // Apply the user's saved theme (default: dark)
  chrome.storage.local.get('settings', (data) => {
    const theme = data?.settings?.theme ?? 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  });
})();
