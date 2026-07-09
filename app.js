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
  folderScanInterval: null,
  searchIndex: [],         // [{ path, name, content }]
  indexBuilt: false,
  recent: [],
  editMode: false,
  editUnsaved: false,
  inlineEditMode: false,
  sourceBlocks: [],
  frontMatterRaw: '',
  activeBlockEditor: null,
  inlineUnsaved: false,
  settings: {
    fontSize: 16,
    readingWidth: '960',
    sidebarCollapsed: false,
    fontFamily: 'sans',
    reloadInterval: 1000,
    theme: 'light',
  },
};

// ── DOM refs ───────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const dom = {
  btnOpen:          $('btn-open'),          // sidebar open button
  btnToggleSidebar: $('btn-toggle-sidebar'),
  btnSearch:        $('btn-search'),
  btnTheme:         $('btn-theme'),
  iconMoon:         $('icon-moon'),
  iconSun:          $('icon-sun'),
  btnReloadToggle:  $('btn-reload-toggle'),
  btnSettings:      $('btn-settings'),
  folderBreadcrumb: $('folder-breadcrumb'),
  folderName:       $('folder-name'),
  btnChangeFolder:  $('btn-change-folder'),
  filePathDisplay:  $('file-path-display'),
  fileBreadcrumb:   $('file-breadcrumb'),
  filterInput:      $('filter-input'),
  fileTree:         $('file-tree'),
  toc:              $('toc'),
  recentList:       $('recent-list'),
  welcome:          $('welcome'),
  contentWrapper:   $('content-wrapper'),
  content:          $('content'),
  readingProgress:  $('reading-progress'),
  statusWords:      $('status-words'),
  statusReadtime:   $('status-readtime'),
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
  sidebar:          $('sidebar'),
  resizeHandle:     $('resize-handle'),
  // Edit mode
  btnEdit:          $('btn-edit'),
  btnInlineEdit:    $('btn-inline-edit'),
  editSplitBtn:     $('edit-split-btn'),
  btnEditCaret:     $('btn-edit-caret'),
  editDropdown:     $('edit-dropdown'),
  fileMeta:         $('file-meta'),
  editorWrapper:    $('editor-wrapper'),
  editorFilename:   $('editor-filename'),
  editorUnsaved:    $('editor-unsaved'),
  btnSaveEditor:    $('btn-save-editor'),
  btnDiscardEditor: $('btn-discard-editor'),
  editorTextarea:   $('editor-textarea'),
  // Find & replace
  findBar:          $('find-bar'),
  findInput:        $('find-input'),
  replaceInput:     $('replace-input'),
  findStatus:       $('find-status'),
  btnFindPrev:      $('btn-find-prev'),
  btnFindNext:      $('btn-find-next'),
  btnReplaceOne:    $('btn-replace-one'),
  btnReplaceAll:    $('btn-replace-all'),
  btnCloseFindBar:  $('btn-close-find'),
  // New file / folder controls
  btnNewFile:       $('btn-new-file'),
  btnRefreshFolder: $('btn-refresh-folder'),
  btnOpenFile:      $('btn-open-file'),
  newFileRow:       $('new-file-row'),
  newFileInput:     $('new-file-input'),
  // Export
  btnExportPdf:     $('btn-export-pdf'),
  // Backlinks
  backlinksPanel:   $('backlinks-panel'),
  // Sticky content header
  contentHeader:    $('content-header'),
};

// ── Init ───────────────────────────────────────────────────────

async function init() {
  await I18n.init();
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
  if (dom.fileBreadcrumb) dom.fileBreadcrumb.style.maxWidth = widthVal;
  if (dom.fileMeta) dom.fileMeta.style.maxWidth = widthVal;
  if (dom.backlinksPanel) dom.backlinksPanel.style.maxWidth = widthVal;
  dom.sidebar.classList.toggle('collapsed', !!s.sidebarCollapsed);
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
  dom.btnTheme.title = isDark ? I18n.t('theme.switchLight') : I18n.t('theme.switchDark');
}

function toggleTheme() {
  state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.settings.theme);
  saveSettings();
}

function toggleSidebar() {
  state.settings.sidebarCollapsed = !state.settings.sidebarCollapsed;
  dom.sidebar.classList.toggle('collapsed', state.settings.sidebarCollapsed);
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
    dom.recentList.innerHTML = '<div class="empty-state"><p>' + I18n.t('sidebar.noRecent') + '</p></div>';
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
  dom.btnNewFile.classList.remove('hidden');
  dom.btnRefreshFolder.classList.remove('hidden');

  state.files.clear();
  state.searchIndex = [];
  state.indexBuilt = false;

  await scanDirectory(handle, '');
  state.tree = buildTree();
  renderFileTree(state.tree);

  // Switch to files tab
  switchSidebarTab('files');

  buildSearchIndex();
  startFolderScan();
}

async function resetFolder() {
  stopHotReload();
  stopFolderScan();

  // Clear persisted handle so it won't restore on next load
  try { await idbSet('folderHandle', null); } catch (_) {}

  if (state.editMode) {
    state.editMode = false;
    state.editUnsaved = false;
    dom.findBar.classList.add('hidden');
    dom.editorWrapper.classList.add('hidden');
  }
  if (state.inlineEditMode) {
    state.inlineEditMode = false;
    state.inlineUnsaved = false;
    state.activeBlockEditor = null;
    state.sourceBlocks = [];
    state.frontMatterRaw = '';
    dom.content.classList.remove('inline-edit-active');
    dom.btnInlineEdit.classList.remove('active');
  }

  state.folderHandle = null;
  state.folderName = '';
  state.files.clear();
  state.tree = null;
  state.searchIndex = [];
  state.indexBuilt = false;
  state.currentPath = null;
  state.currentHandle = null;
  state.currentLastModified = 0;

  dom.folderBreadcrumb.classList.add('hidden');
  dom.btnNewFile.classList.add('hidden');
  dom.btnRefreshFolder.classList.add('hidden');
  dom.contentWrapper.classList.add('hidden');
  dom.contentHeader.classList.add('hidden');
  dom.editSplitBtn.classList.add('hidden');
  dom.filePathDisplay.textContent = '';
  dom.filterInput.value = '';
  dom.statusWords.textContent = '';
  dom.statusReadtime.textContent = '';
  dom.statusModified.textContent = '';
  dom.toc.innerHTML = '<div class="empty-state"><p>' + I18n.t('sidebar.noContent') + '</p></div>';

  showNoFolderState();

  dom.welcome.style.display = '';
  dom.welcome.classList.add('visible');
}

function showNoFolderState() {
  dom.fileTree.innerHTML = `
    <div class="empty-state">
      <svg width="36" height="36" viewBox="0 0 15 15" fill="none" style="opacity:0.35">
        <path d="M1 3.5A1.5 1.5 0 012.5 2h3.379a1.5 1.5 0 011.06.44L8.122 3.5H12.5A1.5 1.5 0 0114 5v6.5A1.5 1.5 0 0112.5 13h-10A1.5 1.5 0 011 11.5v-8z" stroke="currentColor" stroke-width="1" fill="none"/>
      </svg>
      <p>${I18n.t('sidebar.noFolder')}</p>
      <button id="btn-open" class="btn-open-sidebar">
        <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
          <path d="M1 3.5A1.5 1.5 0 012.5 2h3.379a1.5 1.5 0 011.06.44L8.122 3.5H12.5A1.5 1.5 0 0114 5v6.5A1.5 1.5 0 0112.5 13h-10A1.5 1.5 0 011 11.5v-8z" stroke="currentColor" stroke-width="1.3" fill="none"/>
        </svg>
        ${I18n.t('sidebar.openFolder')}
      </button>
    </div>
  `;
  document.getElementById('btn-open')?.addEventListener('click', openFolder);
}

async function scanDirectory(dirHandle, prefix, targetMap = state.files) {
  for await (const [name, entry] of dirHandle.entries()) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (entry.kind === 'directory') {
      if (!name.startsWith('.') && name !== 'node_modules' && name !== '.git') {
        await scanDirectory(entry, path, targetMap);
      }
    } else if (/\.(md|mdx|markdown|mdown|mkd|txt)$/i.test(name)) {
      targetMap.set(path, { handle: entry, name, dir: prefix, lastModified: 0 });
    }
  }
}

// ── Single file opening ────────────────────────────────────────

async function openFileHandle() {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'Markdown files', accept: { 'text/markdown': ['.md', '.mdx', '.markdown', '.mdown', '.mkd', '.txt'] } }],
      multiple: false,
    });
    await openSingleFile(handle);
  } catch (e) {
    if (e.name !== 'AbortError') console.error('Failed to open file:', e);
  }
}

async function openSingleFile(handle) {
  const name = handle.name;
  const path = name;

  stopFolderScan();
  state.folderHandle = null;
  state.folderName = '';
  dom.folderName.textContent = '';
  dom.folderBreadcrumb.classList.add('hidden');
  dom.btnNewFile.classList.add('hidden');
  dom.btnRefreshFolder.classList.add('hidden');

  state.files.clear();
  state.files.set(path, { handle, name, dir: '', lastModified: 0 });
  state.searchIndex = [];
  state.indexBuilt = false;
  state.tree = buildTree();
  renderFileTree(state.tree);
  switchSidebarTab('files');

  await openFile(path);
}

// ── Folder refresh ─────────────────────────────────────────────

let isCheckingFolder = false;

async function refreshFolder() {
  if (!state.folderHandle || isCheckingFolder) return;
  isCheckingFolder = true;
  dom.btnRefreshFolder.disabled = true;
  try {
    const perm = await state.folderHandle.queryPermission({ mode: 'read' });
    if (perm !== 'granted') {
      const newPerm = await state.folderHandle.requestPermission({ mode: 'read' });
      if (newPerm !== 'granted') return;
    }
    const newFiles = new Map();
    await scanDirectory(state.folderHandle, '', newFiles);

    const currentPaths = new Set(state.files.keys());
    const newPaths = new Set(newFiles.keys());
    const added = [...newPaths].filter(p => !currentPaths.has(p));
    const removed = [...currentPaths].filter(p => !newPaths.has(p));

    state.files.clear();
    for (const [p, info] of newFiles) state.files.set(p, info);

    if (state.currentPath && removed.includes(state.currentPath)) {
      state.currentPath = null;
      state.currentHandle = null;
      stopHotReload();
      dom.contentWrapper.classList.add('hidden');
      dom.editSplitBtn.classList.add('hidden');
      dom.welcome.style.display = '';
      dom.welcome.classList.add('visible');
      dom.statusWords.textContent = '';
      dom.statusReadtime.textContent = '';
    }

    state.tree = buildTree();
    renderFileTree(state.tree, dom.filterInput.value);
    if (state.currentPath) updateActiveTreeItem(state.currentPath);

    state.searchIndex = state.searchIndex.filter(e => !removed.includes(e.path));
    for (const p of added) {
      const info = state.files.get(p);
      try {
        const file = await info.handle.getFile();
        const content = await file.text();
        state.searchIndex.push({ path: p, name: info.name, content: content.toLowerCase(), rawContent: content });
      } catch (_) {
        state.searchIndex.push({ path: p, name: info.name, content: '', rawContent: '' });
      }
    }

    dom.statusModified.textContent = I18n.t('viewer.folderRefreshed');
    setTimeout(() => { dom.statusModified.textContent = ''; }, 2000);
  } catch (e) {
    if (e.name !== 'AbortError') console.error('Refresh failed:', e);
  } finally {
    isCheckingFolder = false;
    dom.btnRefreshFolder.disabled = false;
  }
}

// ── Folder structure hot reload ─────────────────────────────────

function startFolderScan() {
  stopFolderScan();
  if (!state.hotReload || !state.folderHandle) return;
  state.folderScanInterval = setInterval(checkFolderChanges, 5000);
}

function stopFolderScan() {
  if (state.folderScanInterval) { clearInterval(state.folderScanInterval); state.folderScanInterval = null; }
}

async function checkFolderChanges() {
  if (!state.folderHandle || isCheckingFolder) return;
  isCheckingFolder = true;
  try {
    const newFiles = new Map();
    await scanDirectory(state.folderHandle, '', newFiles);

    const currentPaths = new Set(state.files.keys());
    const newPaths = new Set(newFiles.keys());
    const added = [...newPaths].filter(p => !currentPaths.has(p));
    const removed = [...currentPaths].filter(p => !newPaths.has(p));

    if (!added.length && !removed.length) return;

    for (const p of removed) state.files.delete(p);
    for (const p of added) state.files.set(p, newFiles.get(p));

    if (state.currentPath && removed.includes(state.currentPath)) {
      state.currentPath = null;
      state.currentHandle = null;
      stopHotReload();
      dom.contentWrapper.classList.add('hidden');
      dom.editSplitBtn.classList.add('hidden');
      dom.welcome.style.display = '';
      dom.welcome.classList.add('visible');
      dom.statusWords.textContent = '';
      dom.statusReadtime.textContent = '';
      dom.statusModified.textContent = I18n.t('viewer.fileDeleted');
      setTimeout(() => { dom.statusModified.textContent = ''; }, 3000);
    }

    state.tree = buildTree();
    renderFileTree(state.tree, dom.filterInput.value);
    if (state.currentPath) updateActiveTreeItem(state.currentPath);

    state.searchIndex = state.searchIndex.filter(e => !removed.includes(e.path));
    for (const p of added) {
      const info = state.files.get(p);
      try {
        const file = await info.handle.getFile();
        const content = await file.text();
        state.searchIndex.push({ path: p, name: info.name, content: content.toLowerCase(), rawContent: content });
      } catch (_) {
        state.searchIndex.push({ path: p, name: info.name, content: '', rawContent: '' });
      }
    }
  } catch (e) {
    if (e.name === 'NotAllowedError') stopFolderScan();
  } finally {
    isCheckingFolder = false;
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
  dom.fileTree.innerHTML = html || '<div class="empty-state"><p>' + I18n.t('sidebar.noMatches') + '</p></div>';
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
        <button class="tree-copy-btn" data-path="${escAttr(file.path)}" title="${I18n.t('file.copyPath')}">
          <svg width="11" height="11" viewBox="0 0 15 15" fill="none">
            <rect x="2" y="4" width="9" height="10" rx="1" stroke="currentColor" stroke-width="1.3"/>
            <path d="M5 4V2.5A1.5 1.5 0 016.5 1h6A1.5 1.5 0 0114 2.5v9A1.5 1.5 0 0112.5 13H11" stroke="currentColor" stroke-width="1.3"/>
          </svg>
        </button>
        <button class="tree-delete-btn" data-path="${escAttr(file.path)}" title="${I18n.t('file.delete')}">
          <svg width="11" height="11" viewBox="0 0 15 15" fill="none">
            <path d="M5 2h5M2 4h11M4 4l.9 9h5.2L11 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
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
  dom.fileTree.querySelectorAll('.tree-copy-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      await navigator.clipboard.writeText(btn.dataset.path);
      const origHTML = btn.innerHTML;
      btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 15 15" fill="none"><path d="M2 8l3.5 3.5L13 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      btn.style.color = '#5D9E72';
      setTimeout(() => { btn.innerHTML = origHTML; btn.style.color = ''; }, 1500);
    });
  });
  dom.fileTree.querySelectorAll('.tree-delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteFile(btn.dataset.path);
    });
  });
}

// ── File deletion ─────────────────────────────────────────────

async function getParentDirHandle(dir) {
  if (!dir) return state.folderHandle;
  let handle = state.folderHandle;
  for (const part of dir.split('/')) {
    handle = await handle.getDirectoryHandle(part);
  }
  return handle;
}

async function deleteFile(path) {
  const info = state.files.get(path);
  if (!info) return;

  if (!confirm(I18n.t('file.deleteConfirm', info.name))) return;

  try {
    const perm = await state.folderHandle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') return;

    const parentDir = await getParentDirHandle(info.dir);
    await parentDir.removeEntry(info.name);

    state.files.delete(path);
    state.searchIndex = state.searchIndex.filter(e => e.path !== path);
    state.recent = state.recent.filter(r => r.path !== path);
    await chromeSet('recent', state.recent);
    renderRecentList();

    state.tree = buildTree();
    renderFileTree(state.tree);

    // If the deleted file was open, return to the welcome screen
    if (state.currentPath === path) {
      stopHotReload();
      if (state.editMode) {
        state.editMode = false;
        state.editUnsaved = false;
        dom.findBar.classList.add('hidden');
        dom.editorWrapper.classList.add('hidden');
        dom.btnEdit.classList.remove('active');
      }
      state.currentPath = null;
      state.currentHandle = null;
      dom.contentWrapper.classList.add('hidden');
      dom.editSplitBtn.classList.add('hidden');
      dom.welcome.style.display = '';
      dom.welcome.classList.add('visible');
      dom.statusWords.textContent = '';
      dom.statusReadtime.textContent = '';
    }
  } catch (e) {
    if (e.name !== 'AbortError') alert(I18n.t('file.deleteFailed', e.message));
  }
}

// ── File opening ───────────────────────────────────────────────

async function openFile(path) {
  const info = state.files.get(path);
  if (!info) return;

  if (state.editMode && !exitEditMode()) return;

  state.currentPath = path;
  state.currentHandle = info.handle;
  dom.editSplitBtn.classList.remove('hidden');

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

function renderDocument(path, name, text, preserveScroll = false) {
  const viewer = document.getElementById('viewer');
  const savedScroll = preserveScroll ? viewer.scrollTop : 0;

  const { html, headings, blocks, frontMatterRaw } = Markdown.parse(text);
  state.sourceBlocks = blocks || [];
  state.frontMatterRaw = frontMatterRaw || '';

  dom.welcome.classList.remove('visible');
  dom.welcome.style.display = 'none';  // override in case no folder was opened yet
  dom.contentWrapper.classList.remove('hidden');
  dom.contentHeader.classList.remove('hidden');
  dom.content.innerHTML = html;

  // Inline edit mode — re-attach block handlers after each render
  if (state.inlineEditMode) attachAllBlockHandlers();

  // Wiki-link click handlers
  dom.content.querySelectorAll('a.wiki-link').forEach(a => {
    const target = a.dataset.wikilink;
    const resolved = resolveWikiLink(target);
    if (resolved) {
      a.addEventListener('click', e => { e.preventDefault(); openFile(resolved); });
    } else {
      a.classList.add('unresolved');
      a.title = I18n.t('viewer.wikiNotFound', target);
      a.addEventListener('click', e => e.preventDefault());
    }
  });

  // Backlinks
  renderBacklinks(path);

  // Copy buttons
  dom.content.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const code = btn.dataset.code || btn.closest('.code-block')?.querySelector('code')?.innerText || '';
      await navigator.clipboard.writeText(code);
      btn.textContent = I18n.t('copy.copied');
      setTimeout(() => { btn.textContent = I18n.t('copy.copy'); }, 1500);
    });
  });

  // Mermaid diagrams
  if (typeof mermaid !== 'undefined') {
    // Defer to avoid blocking the main render
    requestAnimationFrame(() => {
      try {
        mermaid.run({ nodes: document.querySelectorAll('.mermaid') });
      } catch (_) { /* silently ignore render errors */ }
    });
  }

  renderTOC(headings);
  updateStatusBar(name, text);

  viewer.scrollTop = savedScroll;
  if (!preserveScroll) dom.statusModified.textContent = '';
}

// ── Table of Contents ──────────────────────────────────────────

function renderTOC(headings) {
  if (!headings.length) {
    dom.toc.innerHTML = '<div class="empty-state"><p>' + I18n.t('toc.noHeadings') + '</p></div>';
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

  // Sticky header transparency — reduce opacity when scrolled down
  const scrollTop = viewer.scrollTop;
  const isScrolled = scrollTop > 0;
  dom.contentHeader?.classList.toggle('sticky-scrolled', isScrolled);
  document.getElementById('header')?.classList.toggle('sticky-scrolled', isScrolled);

  const headings = dom.content.querySelectorAll('h1,h2,h3,h4,h5,h6');
  if (!headings.length) return;

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
  dom.statusWords.textContent = I18n.t('viewer.words', words.toLocaleString());
  dom.statusReadtime.textContent = I18n.t('viewer.minRead', mins);
}

function updateLiveIndicator() {
  if (state.hotReload) {
    dom.reloadDot.className = 'dot dot-live';
    dom.btnReloadToggle.title = I18n.t('reload.on');
  } else {
    dom.reloadDot.className = 'dot dot-off';
    dom.btnReloadToggle.title = I18n.t('reload.off');
  }
}

// ── Hot reload ─────────────────────────────────────────────────

let isCheckingChanges = false;

function startHotReload() {
  stopHotReload();
  if (!state.hotReload || !state.currentHandle) return;
  state.reloadInterval = setInterval(checkForChanges, state.reloadMs);
}

function stopHotReload() {
  if (state.reloadInterval) { clearInterval(state.reloadInterval); state.reloadInterval = null; }
}

async function checkForChanges() {
  if (!state.currentHandle || isCheckingChanges || state.editMode) return;
  isCheckingChanges = true;
  try {
    const file = await state.currentHandle.getFile();
    if (file.lastModified !== state.currentLastModified) {
      state.currentLastModified = file.lastModified;
      const text = await file.text();
      renderDocument(state.currentPath, state.files.get(state.currentPath)?.name || '', text, true);
      dom.statusModified.textContent = I18n.t('viewer.updated', new Date().toLocaleTimeString());
      setTimeout(() => { dom.statusModified.textContent = ''; }, 3000);
    }
  } catch (e) {
    if (e.name === 'NotAllowedError') {
      stopHotReload();
      stopFolderScan();
      state.hotReload = false;
      updateLiveIndicator();
      dom.statusModified.textContent = I18n.t('viewer.reloadPaused');
      setTimeout(() => { dom.statusModified.textContent = ''; }, 5000);
    }
  } finally {
    isCheckingChanges = false;
  }
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
  if (state.currentPath) renderBacklinks(state.currentPath);
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
      items.push({ section: I18n.t('palette.recentFiles') });
      for (const r of state.recent.slice(0, 6)) {
        if (state.files.has(r.path)) items.push({ type: 'file', path: r.path, name: r.name });
      }
    }
    // Then all files
    items.push({ section: I18n.t('palette.allFiles') });
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
      items.push({ section: I18n.t('palette.files') });
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
        items.push({ section: I18n.t('palette.inFiles') });
        items.push(...contentMatches.slice(0, 6));
      }
    }
  }

  if (items.filter(i => i.type).length === 0) {
    dom.paletteResults.innerHTML = '<div class="empty-state" style="padding:24px"><p>' + I18n.t('palette.noResults') + '</p></div>';
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

function openSettings() {
  dom.settingsPanel.classList.remove('hidden');
  const langSelect = document.getElementById('language-select');
  if (langSelect) langSelect.value = I18n.getLanguage();
}
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

// ── Edit mode ──────────────────────────────────────────────────

async function enterEditMode() {
  if (!state.currentHandle) return;
  if (state.inlineEditMode) exitInlineEditMode(true);
  try {
    const perm = await state.currentHandle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') return;
  } catch (e) {
    return;
  }

  stopHotReload();
  state.editMode = true;
  state.editUnsaved = false;

  const file = await state.currentHandle.getFile();
  const text = await file.text();

  dom.editorFilename.textContent = state.files.get(state.currentPath)?.name || '';
  dom.editorTextarea.value = text;
  dom.editorUnsaved.classList.add('hidden');
  dom.editorUnsaved.textContent = '';

  dom.contentWrapper.classList.add('hidden');
  dom.editorWrapper.classList.remove('hidden');
  dom.btnEdit.classList.add('active');
  dom.btnInlineEdit.classList.add('active');
  dom.editorTextarea.focus();
}

function exitEditMode() {
  if (state.editUnsaved) {
    if (!confirm(I18n.t('editor.discardConfirm'))) return false;
  }
  dom.findBar.classList.add('hidden');
  state.editMode = false;
  state.editUnsaved = false;
  dom.editorWrapper.classList.add('hidden');
  dom.contentWrapper.classList.remove('hidden');
  dom.contentHeader.classList.remove('hidden');
  dom.btnEdit.classList.remove('active');
  dom.btnInlineEdit.classList.remove('active');
  if (state.hotReload) startHotReload();
  return true;
}

async function saveFile() {
  if (!state.currentHandle || !state.editMode) return;
  try {
    const content = dom.editorTextarea.value;
    const writable = await state.currentHandle.createWritable();
    await writable.write(content);
    await writable.close();

    const file = await state.currentHandle.getFile();
    state.currentLastModified = file.lastModified;
    state.editUnsaved = false;

    // Render the updated content and return to view mode
    const info = state.files.get(state.currentPath);
    renderDocument(state.currentPath, info?.name || '', content);

    dom.findBar.classList.add('hidden');
    state.editMode = false;
    dom.editorWrapper.classList.add('hidden');
    dom.btnEdit.classList.remove('active');
    if (state.hotReload) startHotReload();

    dom.statusModified.textContent = I18n.t('viewer.saved');
    setTimeout(() => { dom.statusModified.textContent = ''; }, 2000);
  } catch (e) {
    console.error('Failed to save:', e);
    alert(I18n.t('editor.saveFailed', e.message));
  }
}

// ── Create new file ────────────────────────────────────────────

function showNewFileInput() {
  dom.newFileRow.classList.remove('hidden');
  dom.newFileInput.value = '';
  dom.newFileInput.focus();
}

function hideNewFileInput() {
  dom.newFileRow.classList.add('hidden');
  dom.newFileInput.value = '';
}

async function confirmNewFile() {
  let name = dom.newFileInput.value.trim();
  hideNewFileInput();
  if (!name || !state.folderHandle) return;
  if (!name.includes('.')) name += '.md';

  if (state.files.has(name)) {
    alert(I18n.t('file.alreadyExists', name));
    return;
  }

  try {
    const perm = await state.folderHandle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') return;

    const fileHandle = await state.folderHandle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write('');
    await writable.close();

    state.files.set(name, { handle: fileHandle, name, dir: '', lastModified: 0 });
    state.searchIndex.push({ path: name, name, content: '', rawContent: '' });
    state.tree = buildTree();
    renderFileTree(state.tree);

    await openFile(name);
    await enterEditMode();
  } catch (e) {
    if (e.name !== 'AbortError') alert(I18n.t('file.createFailed', e.message));
  }
}

// ── Find & Replace ─────────────────────────────────────────────

let findMatches = [];
let findCurrentIdx = -1;

function openFindReplace() {
  if (!state.editMode) return;
  dom.findBar.classList.remove('hidden');
  dom.findInput.focus();
  dom.findInput.select();
  updateFindMatches();
}

function closeFindReplace() {
  dom.findBar.classList.add('hidden');
  findMatches = [];
  findCurrentIdx = -1;
  dom.editorTextarea.focus();
}

function updateFindMatches() {
  const query = dom.findInput.value;
  findMatches = [];
  findCurrentIdx = -1;

  if (!query) { updateFindStatus(); return; }

  const text = dom.editorTextarea.value.toLowerCase();
  const q = query.toLowerCase();
  let idx = 0;
  while ((idx = text.indexOf(q, idx)) !== -1) {
    findMatches.push(idx);
    idx += q.length;
  }

  if (findMatches.length) {
    findCurrentIdx = 0;
    selectFindMatch(0);
  }
  updateFindStatus();
}

function selectFindMatch(idx) {
  if (idx < 0 || idx >= findMatches.length) return;
  const start = findMatches[idx];
  const end = start + dom.findInput.value.length;
  dom.editorTextarea.focus();
  dom.editorTextarea.setSelectionRange(start, end);
  const linesBefore = dom.editorTextarea.value.substring(0, start).split('\n').length;
  const lh = parseInt(getComputedStyle(dom.editorTextarea).lineHeight) || 24;
  dom.editorTextarea.scrollTop = Math.max(0, (linesBefore - 5) * lh);
}

function findNext() {
  if (!findMatches.length) return;
  findCurrentIdx = (findCurrentIdx + 1) % findMatches.length;
  selectFindMatch(findCurrentIdx);
  updateFindStatus();
}

function findPrev() {
  if (!findMatches.length) return;
  findCurrentIdx = (findCurrentIdx - 1 + findMatches.length) % findMatches.length;
  selectFindMatch(findCurrentIdx);
  updateFindStatus();
}

function replaceCurrent() {
  if (findCurrentIdx < 0 || !findMatches.length) return;
  const query = dom.findInput.value;
  const replacement = dom.replaceInput.value;
  const start = findMatches[findCurrentIdx];
  dom.editorTextarea.value =
    dom.editorTextarea.value.substring(0, start) +
    replacement +
    dom.editorTextarea.value.substring(start + query.length);
  markEditorUnsaved();
  updateFindMatches();
}

function replaceAll() {
  const query = dom.findInput.value;
  if (!query) return;
  const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  dom.editorTextarea.value = dom.editorTextarea.value.replace(re, dom.replaceInput.value);
  markEditorUnsaved();
  updateFindMatches();
}

function updateFindStatus() {
  if (!dom.findInput.value) {
    dom.findStatus.textContent = '';
    dom.findStatus.classList.remove('no-match');
    return;
  }
  if (!findMatches.length) {
    dom.findStatus.textContent = I18n.t('editor.noResults');
    dom.findStatus.classList.add('no-match');
    return;
  }
  dom.findStatus.classList.remove('no-match');
  dom.findStatus.textContent = `${findCurrentIdx + 1} / ${findMatches.length}`;
}

function markEditorUnsaved() {
  state.editUnsaved = true;
  dom.editorUnsaved.textContent = I18n.t('viewer.unsaved');
  dom.editorUnsaved.classList.remove('hidden', 'saved');
}

// ── Inline edit mode ───────────────────────────────────────────

function enterInlineEditMode() {
  if (state.editMode) exitEditMode();
  if (!state.currentPath) return;
  state.inlineEditMode = true;
  dom.content.classList.add('inline-edit-active');
  dom.btnInlineEdit.classList.add('active');
  attachAllBlockHandlers();
}

function exitInlineEditMode(skipConfirm = false) {
  if (state.activeBlockEditor) commitBlockEdit();
  if (state.inlineUnsaved && !skipConfirm) {
    if (!confirm(I18n.t('editor.discardInlineConfirm'))) return false;
  }
  state.inlineEditMode = false;
  state.inlineUnsaved = false;
  dom.content.classList.remove('inline-edit-active');
  dom.btnInlineEdit.classList.remove('active');
  return true;
}

function attachAllBlockHandlers() {
  dom.content.querySelectorAll('[data-bi]').forEach(el => {
    attachBlockHandler(el, parseInt(el.dataset.bi, 10));
  });
}

function attachBlockHandler(el, bi) {
  el.addEventListener('click', function onBlockClick(e) {
    if (!state.inlineEditMode) return;
    e.stopPropagation();
    if (state.activeBlockEditor?.el === el) return;
    if (state.activeBlockEditor) commitBlockEdit();
    activateBlockEdit(bi, el);
  }, { once: true });
}

function activateBlockEdit(bi, el) {
  const raw = state.sourceBlocks[bi] ?? '';

  const wrap = document.createElement('div');
  wrap.className = 'block-editor-wrap';
  wrap.dataset.bi = bi;

  const textarea = document.createElement('textarea');
  textarea.className = 'block-editor';
  textarea.value = raw;
  textarea.spellcheck = false;
  textarea.setAttribute('autocomplete', 'off');
  textarea.setAttribute('autocorrect', 'off');
  textarea.setAttribute('autocapitalize', 'off');

  const autoResize = () => {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight + 2) + 'px';
  };

  textarea.addEventListener('input', () => {
    autoResize();
    state.inlineUnsaved = true;
    state.sourceBlocks[bi] = textarea.value;
    dom.statusModified.textContent = I18n.t('viewer.unsaved');
  });

  textarea.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); commitBlockEdit(); }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); saveInlineEdits(); }
  });

  textarea.addEventListener('blur', () => {
    setTimeout(() => {
      if (state.activeBlockEditor?.textarea === textarea) commitBlockEdit();
    }, 120);
  });

  wrap.appendChild(textarea);
  el.replaceWith(wrap);
  state.activeBlockEditor = { bi, el, textarea, wrap };

  requestAnimationFrame(() => { autoResize(); textarea.focus(); });
}

function commitBlockEdit() {
  const editor = state.activeBlockEditor;
  if (!editor) return;

  const { bi, textarea, wrap } = editor;
  const newRaw = textarea.value;
  state.sourceBlocks[bi] = newRaw;
  state.activeBlockEditor = null;

  if (!newRaw.trim()) { wrap.remove(); return; }

  const { html } = Markdown.parse(newRaw, false);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html.trim();

  // Tag first element with data-bi so it stays clickable
  const firstEl = tempDiv.firstElementChild;
  if (firstEl) {
    firstEl.dataset.bi = bi;
    attachBlockHandler(firstEl, bi);
  }

  // Reattach copy-btn and wiki-link handlers in the new content
  tempDiv.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const code = btn.dataset.code || btn.closest('.code-block')?.querySelector('code')?.innerText || '';
      await navigator.clipboard.writeText(code);
      btn.textContent = I18n.t('copy.copied');
      setTimeout(() => { btn.textContent = I18n.t('copy.copy'); }, 1500);
    });
  });
  tempDiv.querySelectorAll('a.wiki-link').forEach(a => {
    const target = a.dataset.wikilink;
    const resolved = resolveWikiLink(target);
    if (resolved) {
      a.addEventListener('click', e => { e.preventDefault(); openFile(resolved); });
    } else {
      a.classList.add('unresolved');
      a.addEventListener('click', e => e.preventDefault());
    }
  });

  const frag = document.createDocumentFragment();
  while (tempDiv.firstChild) frag.appendChild(tempDiv.firstChild);
  wrap.replaceWith(frag);

  // Re-render any mermaid diagrams in the replacement
  if (typeof mermaid !== 'undefined') {
    requestAnimationFrame(() => {
      try { mermaid.run({ nodes: document.querySelectorAll('.mermaid') }); } catch (_) {}
    });
  }
}

function reconstructMarkdown() {
  const body = state.sourceBlocks.join('\n\n');
  return state.frontMatterRaw ? state.frontMatterRaw + '\n\n' + body : body;
}

async function saveInlineEdits() {
  if (!state.currentHandle || !state.inlineEditMode) return;
  if (state.activeBlockEditor) commitBlockEdit();
  if (!state.inlineUnsaved) return;

  try {
    const perm = await state.currentHandle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') return;

    const content = reconstructMarkdown();
    const writable = await state.currentHandle.createWritable();
    await writable.write(content);
    await writable.close();

    const file = await state.currentHandle.getFile();
    state.currentLastModified = file.lastModified;
    state.inlineUnsaved = false;
    dom.statusModified.textContent = I18n.t('viewer.saved');
    setTimeout(() => { dom.statusModified.textContent = ''; }, 2000);
  } catch (e) {
    console.error('Failed to save inline edits:', e);
    alert(I18n.t('editor.saveInlineFailed', e.message));
  }
}

// ── Wiki-links ─────────────────────────────────────────────────

function resolveWikiLink(name) {
  const q = name.toLowerCase().trim();
  for (const [path, info] of state.files) {
    if (info.name.toLowerCase() === q) return path;
  }
  // Match by stem (name without extension)
  for (const [path, info] of state.files) {
    const stem = info.name.replace(/\.(md|mdx|markdown|mdown|mkd|txt)$/i, '').toLowerCase();
    if (stem === q) return path;
  }
  return null;
}

// ── Backlinks ──────────────────────────────────────────────────

function renderBacklinks(currentPath) {
  const panel = dom.backlinksPanel;
  if (!panel) return;
  if (!state.indexBuilt || !currentPath) { panel.innerHTML = ''; return; }

  const info = state.files.get(currentPath);
  if (!info) { panel.innerHTML = ''; return; }

  const stem = info.name.replace(/\.(md|mdx|markdown|mdown|mkd|txt)$/i, '');
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\[\\[(?:${esc(stem)}|${esc(info.name)})(?:\\|[^\\]]+)?\\]\\]`, 'i');

  const matches = [];
  for (const entry of state.searchIndex) {
    if (entry.path === currentPath) continue;
    if (re.test(entry.rawContent)) matches.push({ path: entry.path, name: entry.name });
  }

  if (!matches.length) { panel.innerHTML = ''; return; }

  panel.innerHTML = `
    <div class="backlinks-section">
      <div class="backlinks-title">
        <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
          <path d="M4.5 8.5l-3-3 3-3M1.5 5.5h8a4 4 0 014 4v1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ${I18n.t(matches.length === 1 ? 'viewer.backlinks' : 'viewer.backlinks_plural', matches.length)}
      </div>
      <div class="backlinks-list">
        ${matches.map(m => `
          <div class="backlink-item" data-path="${escAttr(m.path)}">
            <svg width="11" height="11" viewBox="0 0 15 15" fill="none">
              <path d="M4 1h5.5L12 3.5V13a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2" fill="none"/>
              <path d="M8 1v3h3" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            <span>${escHtml(m.name)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  panel.querySelectorAll('.backlink-item').forEach(el => {
    el.addEventListener('click', () => openFile(el.dataset.path));
  });
}

// ── Export PDF ─────────────────────────────────────────────────

function exportPDF() {
  window.print();
}

// ── Event bindings ─────────────────────────────────────────────

function bindEvents() {
  // Open / change / refresh folder
  dom.btnOpen.addEventListener('click', openFolder);
  dom.btnChangeFolder.addEventListener('click', resetFolder);
  if (dom.btnOpenFile) dom.btnOpenFile.addEventListener('click', openFileHandle);
  dom.btnRefreshFolder.addEventListener('click', refreshFolder);

  // Edit split button: main click = inline edit, caret = dropdown
  dom.btnInlineEdit.addEventListener('click', () => {
    dom.editDropdown.classList.add('hidden');
    if (state.inlineEditMode) exitInlineEditMode();
    else enterInlineEditMode();
  });
  dom.btnEditCaret.addEventListener('click', e => {
    e.stopPropagation();
    dom.editDropdown.classList.toggle('hidden');
  });
  document.addEventListener('click', () => {
    dom.editDropdown.classList.add('hidden');
  });

  // Full editor (inside dropdown)
  dom.btnEdit.addEventListener('click', () => {
    dom.editDropdown.classList.add('hidden');
    if (state.editMode) exitEditMode();
    else enterEditMode();
  });
  dom.btnSaveEditor.addEventListener('click', saveFile);
  dom.btnDiscardEditor.addEventListener('click', () => exitEditMode());
  dom.editorTextarea.addEventListener('input', markEditorUnsaved);
  dom.editorTextarea.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = e.target.selectionStart;
      const end = e.target.selectionEnd;
      e.target.value = e.target.value.substring(0, s) + '  ' + e.target.value.substring(end);
      e.target.selectionStart = e.target.selectionEnd = s + 2;
    }
  });

  // Find & replace
  dom.findInput.addEventListener('input', updateFindMatches);
  dom.findInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? findPrev() : findNext(); }
    if (e.key === 'Escape') { e.preventDefault(); closeFindReplace(); }
  });
  dom.replaceInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); closeFindReplace(); }
  });
  dom.btnFindPrev.addEventListener('click', findPrev);
  dom.btnFindNext.addEventListener('click', findNext);
  dom.btnReplaceOne.addEventListener('click', replaceCurrent);
  dom.btnReplaceAll.addEventListener('click', replaceAll);
  dom.btnCloseFindBar.addEventListener('click', closeFindReplace);

  // New file
  dom.btnNewFile.addEventListener('click', showNewFileInput);
  dom.newFileInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); confirmNewFile(); }
    if (e.key === 'Escape') { e.preventDefault(); hideNewFileInput(); }
  });
  dom.newFileInput.addEventListener('blur', () => setTimeout(hideNewFileInput, 150));

  // Export PDF
  dom.btnExportPdf.addEventListener('click', exportPDF);

  // Search bar + palette
  $('search-bar').addEventListener('click', openPalette);
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

  // Sidebar toggle
  dom.btnToggleSidebar.addEventListener('click', toggleSidebar);

  // Hot reload toggle
  dom.btnReloadToggle.addEventListener('click', async () => {
    state.hotReload = !state.hotReload;
    if (state.hotReload && state.folderHandle) {
      try {
        const perm = await state.folderHandle.requestPermission({ mode: 'read' });
        if (perm !== 'granted') { state.hotReload = false; }
      } catch (_) {}
    }
    updateLiveIndicator();
    if (state.hotReload) { startHotReload(); startFolderScan(); }
    else { stopHotReload(); stopFolderScan(); }
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

  // Language selector
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    langSelect.value = I18n.getLanguage();
    langSelect.addEventListener('change', async e => {
      await I18n.setLanguage(e.target.value);
    });
  }

  // Sidebar tabs
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => switchSidebarTab(tab.dataset.tab));
  });

  // Scroll spy + reading progress
  document.getElementById('viewer').addEventListener('scroll', updateScrollSpy, { passive: true });

  // Immediately check for changes when the tab regains focus
  // (Chrome throttles setInterval in background tabs)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.hotReload && state.currentHandle) {
      checkForChanges();
    }
  });

  // Global keyboard shortcuts
  document.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey;

    if (mod && e.key === 'k') { e.preventDefault(); openPalette(); return; }
    if (mod && e.shiftKey && e.key === 'f') { e.preventDefault(); openPalette(); return; }
    if (mod && e.key === ']') { e.preventDefault(); navigateFile(1); return; }
    if (mod && e.key === '[') { e.preventDefault(); navigateFile(-1); return; }
    if (mod && e.key === 'b') { e.preventDefault(); toggleSidebar(); return; }
    if (mod && e.key === 's') {
      e.preventDefault();
      if (state.inlineEditMode) saveInlineEdits(); else saveFile();
      return;
    }
    if (mod && e.shiftKey && e.key === 'E' && state.currentPath) {
      e.preventDefault();
      if (state.inlineEditMode) exitInlineEditMode(); else enterInlineEditMode();
      return;
    }
    if (mod && e.key === 'e' && state.currentPath) {
      e.preventDefault();
      if (state.editMode) exitEditMode(); else enterEditMode();
      return;
    }
    if (mod && e.key === 'f' && state.editMode) { e.preventDefault(); openFindReplace(); return; }
    if (e.key === 'Escape') {
      if (!dom.findBar.classList.contains('hidden')) { closeFindReplace(); return; }
      closePalette();
      closeSettings();
    }
  });

  updateLiveIndicator();
  initResizeHandle();

  // Language change → re-translate dynamic strings
  document.addEventListener('i18n-changed', () => {
    updateLiveIndicator();
    applyTheme(state.settings.theme);
    if (!dom.welcome.classList.contains('visible')) {
      renderTOC([]); // force empty TOC re-translate
    }
  });
}

// ── Boot ───────────────────────────────────────────────────────

init().catch(console.error);
