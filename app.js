/*!
 * Markdown Browser — Main Application
 */

'use strict';

// ── State ──────────────────────────────────────────────────────

const state = {
  folderHandle: null,
  folderName: '',
  files: new Map(),        // relativePath → { handle, name, dir, lastModified }
  tree: null,
  currentPath: null,
  currentHandle: null,
  currentLastModified: 0,
  hotReload: true,
  reloadInterval: null,
  reloadMs: 1000,
  searchIndex: [],         // [{ path, name, content }]
  indexBuilt: false,
  recent: [],
  settings: {
    fontSize: 16,
    readingWidth: '780px',
    fontFamily: 'sans',
    reloadInterval: 1000,
    theme: 'light',
  },
};

// ── DOM refs ───────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const dom = {
  btnOpen:          $('btn-open'),          // sidebar open button
  btnSearch:        $('btn-search'),
  btnTheme:         $('btn-theme'),
  iconMoon:         $('icon-moon'),
  iconSun:          $('icon-sun'),
  btnReloadToggle:  $('btn-reload-toggle'),
  btnSettings:      $('btn-settings'),
  folderBreadcrumb: $('folder-breadcrumb'),
  folderName:       $('folder-name'),
  filePathDisplay:  $('file-path-display'),
  filterInput:      $('filter-input'),
  fileTree:         $('file-tree'),
  toc:              $('toc'),
  recentList:       $('recent-list'),
  welcome:          $('welcome'),
  contentWrapper:   $('content-wrapper'),
  content:          $('content'),
  readingProgress:  $('reading-progress'),
  statusFile:       $('status-file'),
  statusWords:      $('status-words'),
  statusReadtime:   $('status-readtime'),
  statusLive:       $('status-live-indicator'),
  statusModified:   $('status-modified'),
  reloadDot:        $('reload-dot'),
  // Command palette
  palette:          $('command-palette'),
  paletteInput:     $('palette-input'),
  paletteResults:   $('palette-results'),
  paletteBackdrop:  $('palette-backdrop'),
  // Settings
  settingsPanel:    $('settings-panel'),
  settingsBackdrop: $('settings-backdrop'),
  btnCloseSettings: $('btn-close-settings'),
  fontDecrease:     $('font-decrease'),
  fontIncrease:     $('font-increase'),
  fontSizeDisplay:  $('font-size-display'),
  readingWidth:     $('reading-width'),
  fontFamily:       $('font-family'),
  reloadIntervalSel:$('reload-interval'),
};

// ── Init ───────────────────────────────────────────────────────

async function init() {
  await loadSettings();
  await loadRecent();
  applySettings();
  bindEvents();
  renderRecentList();

  // Try to restore last folder handle from IndexedDB
  try {
    const saved = await idbGet('folderHandle');
    if (saved) {
      const perm = await saved.queryPermission({ mode: 'read' });
      if (perm === 'granted') {
        await mountFolder(saved);
      }
    }
  } catch (_) {}
}

// ── Settings ───────────────────────────────────────────────────

async function loadSettings() {
  const saved = await chromeGet('settings');
  if (saved) Object.assign(state.settings, saved);
}

async function saveSettings() {
  await chromeSet('settings', state.settings);
}

function applySettings() {
  const s = state.settings;
  document.documentElement.style.setProperty('--reading-font-size', s.fontSize + 'px');
  const widthVal = s.readingWidth === '100%' ? '100%' : s.readingWidth + 'px';
  dom.content.style.maxWidth = widthVal;
  const fontMap = { sans: 'var(--font-reading-sans)', serif: 'var(--font-serif)', mono: 'var(--font-mono)' };
  document.documentElement.style.setProperty('--reading-font', fontMap[s.fontFamily] || fontMap.sans);
  dom.fontSizeDisplay.textContent = s.fontSize + 'px';
  dom.readingWidth.value = s.readingWidth;
  dom.fontFamily.value = s.fontFamily;
  dom.reloadIntervalSel.value = String(s.reloadInterval);
  state.reloadMs = s.reloadInterval;
  applyTheme(s.theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  dom.iconMoon.style.display = isDark  ? '' : 'none';
  dom.iconSun.style.display  = isDark  ? 'none' : '';
  dom.btnTheme.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
}

function toggleTheme() {
  state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.settings.theme);
  saveSettings();
}

// ── Chrome storage helpers ──────────────────────────────────────

function chromeGet(key) {
  return new Promise(res => chrome.storage.local.get(key, data => res(data[key])));
}
function chromeSet(key, value) {
  return new Promise(res => chrome.storage.local.set({ [key]: value }, res));
}

// IndexedDB for FileSystemHandle (chrome.storage.local is JSON-only, can't store handles)
const IDB_NAME = 'markdown-browser';
const IDB_STORE = 'handles';

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(key, value) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(key) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Recent files ───────────────────────────────────────────────

async function loadRecent() {
  state.recent = (await chromeGet('recent')) || [];
}

async function addRecent(path, name) {
  state.recent = state.recent.filter(r => r.path !== path);
  state.recent.unshift({ path, name, ts: Date.now() });
  if (state.recent.length > 20) state.recent = state.recent.slice(0, 20);
  await chromeSet('recent', state.recent);
  renderRecentList();
}

function renderRecentList() {
  if (!state.recent.length) {
    dom.recentList.innerHTML = '<div class="empty-state"><p>No recently opened files</p></div>';
    return;
  }
  dom.recentList.innerHTML = state.recent.map(r => `
    <div class="recent-item" data-path="${escAttr(r.path)}">
      <span class="recent-item-name">${escHtml(r.name)}</span>
      <span class="recent-item-path">${escHtml(r.path)}</span>
    </div>
  `).join('');
  dom.recentList.querySelectorAll('.recent-item').forEach(el => {
    el.addEventListener('click', () => {
      const path = el.dataset.path;
      if (state.files.has(path)) openFile(path);
    });
  });
}

// ── Folder opening ──────────────────────────────────────────────

async function openFolder() {
  try {
    const handle = await window.showDirectoryPicker({ mode: 'read' });
    await idbSet('folderHandle', handle);
    await mountFolder(handle);
  } catch (e) {
    if (e.name !== 'AbortError') console.error('Failed to open folder:', e);
  }
}

async function mountFolder(handle) {
  state.folderHandle = handle;
  state.folderName = handle.name;
  dom.folderName.textContent = handle.name;
  dom.folderBreadcrumb.classList.remove('hidden');

  state.files.clear();
  state.searchIndex = [];
  state.indexBuilt = false;

  await scanDirectory(handle, '');
  state.tree = buildTree();
  renderFileTree(state.tree);

  // Switch to files tab
  switchSidebarTab('files');

  buildSearchIndex();
}

async function scanDirectory(dirHandle, prefix) {
  for await (const [name, entry] of dirHandle.entries()) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (entry.kind === 'directory') {
      if (!name.startsWith('.') && name !== 'node_modules' && name !== '.git') {
        await scanDirectory(entry, path);
      }
    } else if (/\.(md|mdx|markdown|mdown|mkd|txt)$/i.test(name)) {
      state.files.set(path, { handle: entry, name, dir: prefix, lastModified: 0 });
    }
  }
}

// ── File tree ──────────────────────────────────────────────────

function buildTree() {
  const root = { name: '', children: {}, files: [] };
  for (const [path, info] of state.files) {
    const parts = path.split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!node.children[part]) node.children[part] = { name: part, children: {}, files: [] };
      node = node.children[part];
    }
    node.files.push({ path, name: info.name });
  }
  return root;
}

function renderFileTree(tree, filter = '') {
  const filterLow = filter.toLowerCase();
  const html = renderNode(tree, 0, filterLow);
  dom.fileTree.innerHTML = html || '<div class="empty-state"><p>No matches</p></div>';
  bindTreeEvents();
}

function renderNode(node, depth, filter) {
  let html = '';

  // Sort: dirs first, then files, alphabetically
  const dirs = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name));
  const files = node.files.slice().sort((a, b) => a.name.localeCompare(b.name));

  for (const dir of dirs) {
    const childHtml = renderNode(dir, depth + 1, filter);
    if (filter && !childHtml) continue; // prune empty dirs when filtering
    const indent = depth * 14;
    const isOpen = !filter ? '' : 'open';
    html += `
      <div class="tree-item tree-folder ${isOpen}" data-dir="${escAttr(dir.name)}" style="padding-left:${10 + indent}px">
        <span class="tree-arrow">▶</span>
        <svg class="tree-icon tree-icon-folder" width="13" height="13" viewBox="0 0 15 15" fill="none">
          <path d="M1 3.5A1.5 1.5 0 012.5 2h3.379a1.5 1.5 0 011.06.44L8.122 3.5H12.5A1.5 1.5 0 0114 5v6.5A1.5 1.5 0 0112.5 13h-10A1.5 1.5 0 011 11.5v-8z" stroke="currentColor" stroke-width="1.2" fill="none"/>
        </svg>
        <span class="tree-name">${escHtml(dir.name)}</span>
      </div>
      <div class="tree-children ${isOpen}">
        ${childHtml}
      </div>
    `;
  }

  for (const file of files) {
    if (filter && !file.name.toLowerCase().includes(filter)) continue;
    const indent = depth * 14;
    const isActive = file.path === state.currentPath ? 'active' : '';
    html += `
      <div class="tree-item ${isActive}" data-path="${escAttr(file.path)}" style="padding-left:${10 + indent}px" title="${escAttr(file.path)}">
        <svg class="tree-icon" width="12" height="12" viewBox="0 0 15 15" fill="none">
          <path d="M4 1h5.5L12 3.5V13a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2" fill="none"/>
          <path d="M8 1v3h3" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        <span class="tree-name">${highlightMatch(file.name, filter)}</span>
      </div>
    `;
  }

  return html;
}

function bindTreeEvents() {
  dom.fileTree.querySelectorAll('.tree-item[data-path]').forEach(el => {
    el.addEventListener('click', () => openFile(el.dataset.path));
  });
  dom.fileTree.querySelectorAll('.tree-folder').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.toggle('open');
      el.nextElementSibling?.classList.toggle('open');
    });
  });
}

// ── File opening ───────────────────────────────────────────────

async function openFile(path) {
  const info = state.files.get(path);
  if (!info) return;

  state.currentPath = path;
  state.currentHandle = info.handle;

  try {
    const file = await info.handle.getFile();
    state.currentLastModified = file.lastModified;
    const text = await file.text();
    renderDocument(path, info.name, text);
    addRecent(path, info.name);
    updateActiveTreeItem(path);
    dom.filePathDisplay.textContent = path;
    startHotReload();
  } catch (e) {
    console.error('Failed to read file:', e);
  }
}

function renderDocument(path, name, text) {
  const { html, headings } = Markdown.parse(text);

  dom.welcome.classList.remove('visible');
  dom.welcome.style.display = 'none';  // override in case no folder was opened yet
  dom.contentWrapper.classList.remove('hidden');
  dom.content.innerHTML = html;

  // Copy buttons
  dom.content.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const code = btn.dataset.code || btn.closest('.code-block')?.querySelector('code')?.innerText || '';
      await navigator.clipboard.writeText(code);
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
  });

  renderTOC(headings);
  updateStatusBar(name, text);

  // Scroll to top
  document.getElementById('viewer').scrollTop = 0;
  dom.statusModified.textContent = '';
}

// ── Table of Contents ──────────────────────────────────────────

function renderTOC(headings) {
  if (!headings.length) {
    dom.toc.innerHTML = '<div class="empty-state"><p>No headings found</p></div>';
    return;
  }

  dom.toc.innerHTML = headings.map(h => {
    const cls = `toc-item toc-h${h.level}`;
    const id = h.id;
    return `<a class="${cls}" href="#${id}" data-id="${escAttr(id)}">${escHtml(h.text.replace(/<[^>]+>/g, ''))}</a>`;
  }).join('');

  dom.toc.querySelectorAll('.toc-item').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const el = document.getElementById(a.dataset.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// Scroll spy
function updateScrollSpy() {
  const viewer = document.getElementById('viewer');
  const headings = dom.content.querySelectorAll('h1,h2,h3,h4,h5,h6');
  if (!headings.length) return;

  const scrollTop = viewer.scrollTop;
  let active = headings[0];

  for (const h of headings) {
    if (h.offsetTop - 100 <= scrollTop) active = h;
    else break;
  }

  dom.toc.querySelectorAll('.toc-item').forEach(a => {
    a.classList.toggle('active', a.dataset.id === active?.id);
  });

  // Reading progress
  const total = viewer.scrollHeight - viewer.clientHeight;
  const pct = total > 0 ? (scrollTop / total) * 100 : 0;
  dom.readingProgress.style.width = pct + '%';
}

// ── Status bar ─────────────────────────────────────────────────

function updateStatusBar(name, text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  dom.statusFile.textContent = name;
  dom.statusWords.textContent = words.toLocaleString() + ' words';
  dom.statusReadtime.textContent = mins + ' min read';
}

function updateLiveIndicator() {
  if (state.hotReload) {
    dom.reloadDot.className = 'dot dot-live';
    dom.btnReloadToggle.title = 'Hot reload on — click to disable';
    dom.statusLive.innerHTML = '<span class="dot dot-live" title="Hot reload active"></span>';
  } else {
    dom.reloadDot.className = 'dot dot-off';
    dom.btnReloadToggle.title = 'Hot reload off — click to enable';
    dom.statusLive.innerHTML = '';
  }
}

// ── Hot reload ─────────────────────────────────────────────────

function startHotReload() {
  stopHotReload();
  if (!state.hotReload || !state.currentHandle) return;
  state.reloadInterval = setInterval(checkForChanges, state.reloadMs);
}

function stopHotReload() {
  if (state.reloadInterval) { clearInterval(state.reloadInterval); state.reloadInterval = null; }
}

async function checkForChanges() {
  if (!state.currentHandle) return;
  try {
    const file = await state.currentHandle.getFile();
    if (file.lastModified !== state.currentLastModified) {
      state.currentLastModified = file.lastModified;
      const text = await file.text();
      renderDocument(state.currentPath, state.files.get(state.currentPath)?.name || '', text);
      dom.statusModified.textContent = 'Updated ' + new Date().toLocaleTimeString();
      setTimeout(() => { dom.statusModified.textContent = ''; }, 3000);
    }
  } catch (_) {}
}

// ── Search index ───────────────────────────────────────────────

async function buildSearchIndex() {
  state.searchIndex = [];
  for (const [path, info] of state.files) {
    try {
      const file = await info.handle.getFile();
      const content = await file.text();
      state.searchIndex.push({ path, name: info.name, content: content.toLowerCase(), rawContent: content });
    } catch (_) {
      state.searchIndex.push({ path, name: info.name, content: '', rawContent: '' });
    }
  }
  state.indexBuilt = true;
}

// ── Command palette ────────────────────────────────────────────

let paletteSelected = -1;

function openPalette() {
  dom.palette.classList.remove('hidden');
  dom.paletteInput.value = '';
  dom.paletteResults.innerHTML = '';
  paletteSelected = -1;
  requestAnimationFrame(() => dom.paletteInput.focus());
  renderPaletteResults('');
}

function closePalette() {
  dom.palette.classList.add('hidden');
  dom.paletteInput.value = '';
}

function renderPaletteResults(query) {
  const q = query.trim().toLowerCase();
  const items = [];

  if (!q) {
    // Show recent files first
    if (state.recent.length) {
      items.push({ section: 'Recent Files' });
      for (const r of state.recent.slice(0, 6)) {
        if (state.files.has(r.path)) items.push({ type: 'file', path: r.path, name: r.name });
      }
    }
    // Then all files
    items.push({ section: 'All Files' });
    const allFiles = [...state.files.entries()].slice(0, 20);
    for (const [path, info] of allFiles) {
      if (!state.recent.find(r => r.path === path)) {
        items.push({ type: 'file', path, name: info.name });
      }
    }
  } else {
    // Filename matches
    const nameMatches = [];
    for (const [path, info] of state.files) {
      if (info.name.toLowerCase().includes(q) || path.toLowerCase().includes(q)) {
        nameMatches.push({ type: 'file', path, name: info.name });
      }
    }
    if (nameMatches.length) {
      items.push({ section: 'Files' });
      items.push(...nameMatches.slice(0, 8));
    }

    // Full-text matches
    if (state.indexBuilt) {
      const contentMatches = [];
      for (const entry of state.searchIndex) {
        if (entry.content.includes(q)) {
          const idx = entry.content.indexOf(q);
          const start = Math.max(0, idx - 40);
          const snippet = entry.rawContent.slice(start, start + 120).replace(/\n/g, ' ');
          contentMatches.push({ type: 'content', path: entry.path, name: entry.name, snippet, query: q });
        }
      }
      if (contentMatches.length) {
        items.push({ section: 'In Files' });
        items.push(...contentMatches.slice(0, 6));
      }
    }
  }

  if (items.filter(i => i.type).length === 0) {
    dom.paletteResults.innerHTML = '<div class="empty-state" style="padding:24px"><p>No results</p></div>';
    paletteSelected = -1;
    return;
  }

  dom.paletteResults.innerHTML = items.map((item) => {
    if (item.section) {
      return `<div class="palette-section-label">${escHtml(item.section)}</div>`;
    }
    const nameHtml = q ? highlightMatch(item.name, q) : escHtml(item.name);
    const pathHtml = escHtml(item.path);
    let extra = '';
    if (item.snippet) {
      const snippetHtml = escHtml(item.snippet).replace(
        new RegExp(escHtml(item.query), 'gi'),
        m => `<mark>${m}</mark>`
      );
      extra = `<div class="palette-item-snippet">${snippetHtml}</div>`;
    }
    return `
      <div class="palette-item" data-path="${escAttr(item.path)}">
        <svg class="palette-item-icon" width="13" height="13" viewBox="0 0 15 15" fill="none">
          <path d="M4 1h5.5L12 3.5V13a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2" fill="none"/>
          <path d="M8 1v3h3" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        <div class="palette-item-info">
          <div class="palette-item-name">${nameHtml}</div>
          <div class="palette-item-path">${pathHtml}</div>
          ${extra}
        </div>
      </div>
    `;
  }).join('');

  dom.paletteResults.querySelectorAll('.palette-item').forEach(el => {
    el.addEventListener('click', () => {
      openFile(el.dataset.path);
      closePalette();
    });
  });

  paletteSelected = -1;
}

function movePaletteSelection(dir) {
  const items = dom.paletteResults.querySelectorAll('.palette-item');
  if (!items.length) return;
  items[paletteSelected]?.classList.remove('selected');
  paletteSelected = (paletteSelected + dir + items.length) % items.length;
  const sel = items[paletteSelected];
  sel?.classList.add('selected');
  sel?.scrollIntoView({ block: 'nearest' });
}

function confirmPaletteSelection() {
  const sel = dom.paletteResults.querySelector('.palette-item.selected');
  if (sel) {
    openFile(sel.dataset.path);
    closePalette();
  }
}

// ── Sidebar tab switching ──────────────────────────────────────

function switchSidebarTab(tab) {
  document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
  $(`panel-${tab}`)?.classList.add('active');
}

// ── Tree helpers ───────────────────────────────────────────────

function updateActiveTreeItem(path) {
  dom.fileTree.querySelectorAll('.tree-item').forEach(el => {
    el.classList.toggle('active', el.dataset.path === path);
  });
}

// ── File navigation (previous / next) ─────────────────────────

function navigateFile(dir) {
  const paths = [...state.files.keys()].sort();
  if (!paths.length) return;
  const idx = paths.indexOf(state.currentPath);
  const next = paths[(idx + dir + paths.length) % paths.length];
  if (next) openFile(next);
}

// ── Settings panel ─────────────────────────────────────────────

function openSettings() { dom.settingsPanel.classList.remove('hidden'); }
function closeSettings() { dom.settingsPanel.classList.add('hidden'); }

// ── Utilities ──────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(str) { return escHtml(str); }

function highlightMatch(text, query) {
  if (!query) return escHtml(text);
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return escHtml(text).replace(re, '<mark>$1</mark>');
}

// ── Resize sidebar ─────────────────────────────────────────────

function initResizeHandle() {
  const handle = $('resize-handle');
  const sidebar = $('sidebar');
  let dragging = false;
  let startX = 0;
  let startW = 0;

  const viewer = $('viewer');

  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startW = sidebar.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    viewer.style.pointerEvents = 'none';  // prevent iframe/content stealing events
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    e.preventDefault();
    const delta = e.clientX - startX;
    const newW = Math.max(160, Math.min(480, startW + delta));
    sidebar.style.width = newW + 'px';
    document.documentElement.style.setProperty('--sidebar-w', newW + 'px');
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    viewer.style.pointerEvents = '';
  });
}

// ── Event bindings ─────────────────────────────────────────────

function bindEvents() {
  // Open folder
  dom.btnOpen.addEventListener('click', openFolder);

  // Search / palette
  dom.btnSearch.addEventListener('click', openPalette);
  dom.paletteBackdrop.addEventListener('click', closePalette);
  dom.paletteInput.addEventListener('input', e => {
    paletteSelected = -1;
    renderPaletteResults(e.target.value);
  });
  dom.paletteInput.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); movePaletteSelection(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); movePaletteSelection(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); confirmPaletteSelection(); }
    else if (e.key === 'Escape') closePalette();
  });

  // File filter
  dom.filterInput.addEventListener('input', e => {
    renderFileTree(state.tree || buildTree(), e.target.value);
  });

  // Theme toggle
  dom.btnTheme.addEventListener('click', toggleTheme);

  // Hot reload toggle
  dom.btnReloadToggle.addEventListener('click', () => {
    state.hotReload = !state.hotReload;
    updateLiveIndicator();
    if (state.hotReload) startHotReload();
    else stopHotReload();
  });

  // Settings
  dom.btnSettings.addEventListener('click', openSettings);
  dom.btnCloseSettings.addEventListener('click', closeSettings);
  dom.settingsBackdrop.addEventListener('click', closeSettings);

  dom.fontDecrease.addEventListener('click', () => {
    state.settings.fontSize = Math.max(12, state.settings.fontSize - 1);
    applySettings(); saveSettings();
  });
  dom.fontIncrease.addEventListener('click', () => {
    state.settings.fontSize = Math.min(24, state.settings.fontSize + 1);
    applySettings(); saveSettings();
  });
  dom.readingWidth.addEventListener('change', e => {
    state.settings.readingWidth = e.target.value;
    applySettings(); saveSettings();
  });
  dom.fontFamily.addEventListener('change', e => {
    state.settings.fontFamily = e.target.value;
    applySettings(); saveSettings();
  });
  dom.reloadIntervalSel.addEventListener('change', e => {
    state.settings.reloadInterval = Number(e.target.value);
    state.reloadMs = state.settings.reloadInterval;
    saveSettings();
    if (state.hotReload) startHotReload();
  });

  // Sidebar tabs
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => switchSidebarTab(tab.dataset.tab));
  });

  // Scroll spy + reading progress
  document.getElementById('viewer').addEventListener('scroll', updateScrollSpy, { passive: true });

  // Global keyboard shortcuts
  document.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey;

    if (mod && e.key === 'k') { e.preventDefault(); openPalette(); return; }
    if (mod && e.shiftKey && e.key === 'f') { e.preventDefault(); openPalette(); return; }
    if (mod && e.key === ']') { e.preventDefault(); navigateFile(1); return; }
    if (mod && e.key === '[') { e.preventDefault(); navigateFile(-1); return; }
    if (e.key === 'Escape') {
      closePalette();
      closeSettings();
    }
  });

  updateLiveIndicator();
  initResizeHandle();
}

// ── Boot ───────────────────────────────────────────────────────

init().catch(console.error);
