/*!
 * Markdown Browser — Content Script
 * Detects markdown files opened directly in Chrome (file:// URLs),
 * stores the content, and redirects to the full app.html SPA.
 */

(function () {
  'use strict';

  // Chrome renders text files as <body><pre>…</pre></body>
  const pre = document.querySelector('body > pre');
  if (!pre) return;

  const raw = pre.textContent;
  const pathname = decodeURIComponent(location.pathname);
  const filename = pathname.split('/').pop();
  // Convert file:///C:/Users/.../foo.md → C:\Users\...\foo.md
  const fullPath = pathname.replace(/^\/([A-Za-z]:)/, '$1').replace(/\//g, '\\');

  // Store the file content + name + full disk path so app.html can pick it up
  const payload = { raw, filename, fullPath, timestamp: Date.now() };
  chrome.storage.local.set({ 'singleFile': payload }, () => {
    // Redirect to the full SPA in single-file mode
    const url = chrome.runtime.getURL('app.html') + '?mode=single';
    location.replace(url);
  });
})();
