/*!
 * Markdown Browser — i18n Module
 * Lightweight translation system for English & Chinese.
 */

const I18n = (() => {
  'use strict';

  // ── Language packs ──────────────────────────────────────────

  const en = {
    /* App */
    'app.title':             'Markdown Browser',
    'app.tagline':           'A local markdown reader & editor — fast, private, offline.',

    /* Header */
    'header.toggleSidebar':  'Toggle sidebar (⌘B)',
    'header.search':         'Search files and content (⌘K)',
    'header.searchPlaceholder': 'Search files and content…',
    'header.quickSearch':    'Quick search (⌘K)',
    'header.toggleTheme':    'Toggle light / dark mode',
    'header.toggleReload':   'Toggle hot reload',
    'header.live':           'Live',
    'header.settings':       'Settings',

    /* Sidebar */
    'sidebar.closeFolder':   'Close folder',
    'sidebar.files':         'Files',
    'sidebar.contents':      'Contents',
    'sidebar.recent':        'Recent',
    'sidebar.filter':        'Filter files…',
    'sidebar.newFile':       'New file',
    'sidebar.refresh':       'Refresh folder',
    'sidebar.newFilePlaceholder': 'filename.md',
    'sidebar.noFolder':      'No folder open yet',
    'sidebar.openFolder':    'Open Folder',
    'sidebar.noContent':     'Open a file to see its contents',
    'sidebar.noRecent':      'No recently opened files',
    'sidebar.noMatches':     'No matches',
    'sidebar.resize':        'Drag to resize',

    /* File tree */
    'file.copyPath':         'Copy path',
    'file.delete':           'Delete file',
    'file.deleteConfirm':    'Delete "{0}"?\n\nThis action cannot be undone.',
    'file.deleteFailed':     'Failed to delete file: {0}',
    'file.alreadyExists':    '"{0}" already exists.',
    'file.createFailed':     'Failed to create file: {0}',
    'file.openFile':         'Open file',

    /* Viewer */
    'viewer.edit':           'Edit',
    'viewer.inlineEdit':     'Inline edit (⌘⇧E)',
    'viewer.moreOptions':    'More edit options',
    'viewer.fullEditor':     'Full editor',
    'viewer.exportPdf':      'Export to PDF',
    'viewer.pdf':            'PDF',
    'viewer.words':          '{0} words',
    'viewer.minRead':        '{0} min read',
    'viewer.saved':          'Saved',
    'viewer.folderRefreshed':'Folder refreshed',
    'viewer.fileDeleted':    'File deleted externally',
    'viewer.updated':        'Updated {0}',
    'viewer.reloadPaused':   'Live reload paused — re-open folder to resume',
    'viewer.unsaved':        '● Unsaved',
    'viewer.wikiNotFound':   '"{0}" not found in folder',
    'viewer.backlinks':      '{0} backlink',
    'viewer.backlinks_plural': '{0} backlinks',
    'toc.noHeadings':      'No headings found',

    /* Editor */
    'editor.discard':        'Discard',
    'editor.save':           'Save',
    'editor.findPlaceholder':'Find…',
    'editor.replacePlaceholder': 'Replace with…',
    'editor.replace':        'Replace',
    'editor.replaceAll':     'All',
    'editor.findPrev':       'Previous (Shift+Enter)',
    'editor.findNext':       'Next (Enter)',
    'editor.findClose':      'Close (Esc)',
    'editor.noResults':      'No results',
    'editor.discardConfirm': 'You have unsaved changes. Discard them?',
    'editor.discardInlineConfirm': 'You have unsaved inline edits. Discard them?',
    'editor.saveFailed':     'Failed to save file: {0}',
    'editor.needFolder':     'Open a folder first to enable editing. Click "Open Folder" in the sidebar.',
    'editor.saveInlineFailed': 'Failed to save: {0}',

    /* Palette */
    'palette.searchPlaceholder': 'Search files and content…',
    'palette.navigate':      '↑↓ navigate',
    'palette.open':          '↵ open',
    'palette.close':         'ESC close',
    'palette.recentFiles':   'Recent Files',
    'palette.allFiles':      'All Files',
    'palette.files':         'Files',
    'palette.inFiles':       'In Files',
    'palette.noResults':     'No results',

    /* Settings */
    'settings.title':        'Settings',
    'settings.fontSize':     'Font size',
    'settings.decrease':     'A−',
    'settings.increase':     'A+',
    'settings.readingWidth': 'Reading width',
    'settings.widthNarrow':  'Narrow (680px)',
    'settings.widthNormal':  'Normal (780px)',
    'settings.widthWide':    'Wide (960px)',
    'settings.widthFull':    'Full width',
    'settings.fontFamily':   'Font family',
    'settings.fontSans':     'System sans-serif',
    'settings.fontSerif':    'Serif',
    'settings.fontMono':     'Monospace',
    'settings.reloadInterval':'Hot reload interval',
    'settings.interval500':  '500ms',
    'settings.interval1s':   '1 second',
    'settings.interval2s':   '2 seconds',
    'settings.interval5s':   '5 seconds',
    'settings.language':     'Language',
    'settings.langEn':       'English',
    'settings.langZh':       '中文',
    'settings.about':        'About',
    'settings.privacy':      'Privacy Policy',

    /* Welcome */
    'welcome.about':         'About',
    'welcome.aboutP1':       'Markdown Browser lets you read, write, and search your local .md files directly in Chrome — no uploads, no cloud, no internet required. Your files stay on your machine.',
    'welcome.aboutP2':       'Built with the File System Access API so Chrome accesses your folder directly with your explicit permission.',
    'welcome.howTo':         'How to use',
    'welcome.step1Title':    'Open a folder',
    'welcome.step1Desc':     'Click Open Folder in the sidebar and select any local directory. All .md, .mdx, and .markdown files will appear in the file tree.',
    'welcome.step2Title':    'Browse & read',
    'welcome.step2Desc':     'Click any file to open it. Use the Contents tab to jump to headings, and Recent to revisit past files. Use {0} / {1} to navigate between files.',
    'welcome.step3Title':    'Edit & save',
    'welcome.step3Desc':     'Click Edit in the breadcrumb (or {0}) to edit blocks inline — click any paragraph, heading, or list to edit it in place. Use the ▾ dropdown for the full-screen editor ({1}). Press {2} to save.',
    'welcome.step4Title':    'Wiki-links & callouts',
    'welcome.step4Desc':     'Link between files with [[filename]] — a backlinks panel shows which files reference the current one. Use Obsidian-style callouts: > [!NOTE], > [!WARNING], > [!TIP], and more.',
    'welcome.step5Title':    'Create, delete & search',
    'welcome.step5Desc':     'Click + in the sidebar to create a file. Hover any file to reveal the delete button. Press {0} to search filenames and content across your entire folder instantly.',
    'welcome.step6Title':    'Export & hot reload',
    'welcome.step6Desc':     'Click PDF in the breadcrumb to export a clean print. Toggle Live in the header to auto-refresh when you save in an external editor.',
    'welcome.shortcuts':     'Keyboard shortcuts',
    'welcome.shortcutSearch':'Search files and content',
    'welcome.shortcutInlineEdit': 'Inline edit mode',
    'welcome.shortcutFullEditor': 'Full editor mode',
    'welcome.shortcutSave':  'Save file',
    'welcome.shortcutFind':  'Find & replace (full editor)',
    'welcome.shortcutPrev':  'Previous file',
    'welcome.shortcutNext':  'Next file',
    'welcome.shortcutSidebar': 'Toggle sidebar',
    'welcome.shortcutClose': 'Close palette, settings, or find bar',
    'welcome.features':      'Features',
    'welcome.featureInlineEdit': 'Inline editing — click any block in the preview to edit it in place ({0})',
    'welcome.featureFullEditor': 'Full-screen editor — edit files directly with find & replace, save with {0}',
    'welcome.featureWikiLinks': 'Wiki-links — [[filename]] cross-links with a backlinks panel per file',
    'welcome.featureCallouts': 'Callout blocks — Obsidian-style > [!NOTE], > [!WARNING], > [!TIP] and more',
    'welcome.featureFileMgmt': 'Create & delete files — manage your markdown folder without leaving the app',
    'welcome.featurePdf':    'Export to PDF — clean, print-ready output',
    'welcome.featureGfm':    'Full GitHub Flavored Markdown — tables, task lists, front matter, code blocks',
    'welcome.featureHighlighting': 'Syntax highlighting for JS, TS, Python, Go, Rust, SQL, CSS, HTML, Bash, JSON',
    'welcome.featureHotReload': 'Hot reload — live preview as you edit in any external editor',
    'welcome.featureSearch': 'Full-text search across all files in the folder',
    'welcome.featureToc':    'Table of contents with scroll-spy highlighting',
    'welcome.featureLayout': 'Resizable sidebar, font size & reading width controls',
    'welcome.featureTheme':  'Light & dark mode — toggle in the header',
    'welcome.featureOffline':'100% offline & private — no data ever leaves your machine',
    'welcome.madeBy':        'Made by {0}',

    /* Copy button */
    'copy.copy':             'Copy',
    'copy.copied':           'Copied!',

    /* Theme toggle */
    'theme.switchLight':     'Switch to light mode',
    'theme.switchDark':      'Switch to dark mode',

    /* Reload toggle */
    'reload.on':             'Hot reload on — click to disable',
    'reload.off':            'Hot reload off — click to enable',
  };

  // ── Chinese (Simplified) ─────────────────────────────────────

  const zh = {
    /* App */
    'app.title':             'Markdown Browser',
    'app.tagline':           '本地 Markdown 阅读器与编辑器 — 快速、隐私、离线。',

    /* Header */
    'header.toggleSidebar':  '切换侧边栏 (⌘B)',
    'header.search':         '搜索文件和内容 (⌘K)',
    'header.searchPlaceholder': '搜索文件和内容…',
    'header.quickSearch':    '快速搜索 (⌘K)',
    'header.toggleTheme':    '切换亮色 / 暗色模式',
    'header.toggleReload':   '切换热加载',
    'header.live':           '热加载',
    'header.settings':       '设置',

    /* Sidebar */
    'sidebar.closeFolder':   '关闭文件夹',
    'sidebar.files':         '文件',
    'sidebar.contents':      '目录',
    'sidebar.recent':        '最近',
    'sidebar.filter':        '筛选文件…',
    'sidebar.newFile':       '新建文件',
    'sidebar.refresh':       '刷新文件夹',
    'sidebar.newFilePlaceholder': '文件名.md',
    'sidebar.noFolder':      '尚未打开文件夹',
    'sidebar.openFolder':    '打开文件夹',
    'sidebar.noContent':     '打开文件以查看内容',
    'sidebar.noRecent':      '暂无最近打开的文件',
    'sidebar.noMatches':     '无匹配',
    'sidebar.resize':        '拖动调整大小',

    /* File tree */
    'file.copyPath':         '复制路径',
    'file.delete':           '删除文件',
    'file.deleteConfirm':    '确定要删除 "{0}" 吗？\n\n此操作无法撤销。',
    'file.deleteFailed':     '删除文件失败：{0}',
    'file.alreadyExists':    '"{0}" 已存在。',
    'file.createFailed':     '创建文件失败：{0}',
    'file.openFile':         '打开文件',

    /* Viewer */
    'viewer.edit':           '编辑',
    'viewer.inlineEdit':     '行内编辑 (⌘⇧E)',
    'viewer.moreOptions':    '更多编辑选项',
    'viewer.fullEditor':     '全屏编辑器',
    'viewer.exportPdf':      '导出为 PDF',
    'viewer.pdf':            'PDF',
    'viewer.words':          '{0} 字',
    'viewer.minRead':        '阅读约 {0} 分钟',
    'viewer.saved':          '已保存',
    'viewer.folderRefreshed':'文件夹已刷新',
    'viewer.fileDeleted':    '文件已被外部删除',
    'viewer.updated':        '已更新 {0}',
    'viewer.reloadPaused':   '热加载已暂停 — 重新打开文件夹以恢复',
    'viewer.unsaved':        '● 未保存',
    'viewer.wikiNotFound':   '未找到 "{0}"',
    'viewer.backlinks':      '{0} 条反向链接',
    'viewer.backlinks_plural': '{0} 条反向链接',
    'toc.noHeadings':      '未找到标题',

    /* Editor */
    'editor.discard':        '放弃',
    'editor.save':           '保存',
    'editor.findPlaceholder':'查找…',
    'editor.replacePlaceholder': '替换为…',
    'editor.replace':        '替换',
    'editor.replaceAll':     '全部',
    'editor.findPrev':       '上一个 (Shift+Enter)',
    'editor.findNext':       '下一个 (Enter)',
    'editor.findClose':      '关闭 (Esc)',
    'editor.noResults':      '无结果',
    'editor.discardConfirm': '您有未保存的更改，确定要放弃吗？',
    'editor.discardInlineConfirm': '您有未保存的行内编辑，确定要放弃吗？',
    'editor.saveFailed':     '保存文件失败：{0}',
    'editor.needFolder':     '请先打开文件夹以启用编辑功能。点击左侧的"打开文件夹"。',
    'editor.saveInlineFailed': '保存失败：{0}',

    /* Palette */
    'palette.searchPlaceholder': '搜索文件和内容…',
    'palette.navigate':      '↑↓ 导航',
    'palette.open':          '↵ 打开',
    'palette.close':         'ESC 关闭',
    'palette.recentFiles':   '最近文件',
    'palette.allFiles':      '所有文件',
    'palette.files':         '文件',
    'palette.inFiles':       '文件内容',
    'palette.noResults':     '无结果',

    /* Settings */
    'settings.title':        '设置',
    'settings.fontSize':     '字体大小',
    'settings.decrease':     'A−',
    'settings.increase':     'A+',
    'settings.readingWidth': '阅读宽度',
    'settings.widthNarrow':  '窄 (680px)',
    'settings.widthNormal':  '标准 (780px)',
    'settings.widthWide':    '宽 (960px)',
    'settings.widthFull':    '全宽',
    'settings.fontFamily':   '字体',
    'settings.fontSans':     '系统无衬线字体',
    'settings.fontSerif':    '衬线字体',
    'settings.fontMono':     '等宽字体',
    'settings.reloadInterval':'热加载间隔',
    'settings.interval500':  '500 毫秒',
    'settings.interval1s':   '1 秒',
    'settings.interval2s':   '2 秒',
    'settings.interval5s':   '5 秒',
    'settings.language':     '语言',
    'settings.langEn':       'English',
    'settings.langZh':       '中文',
    'settings.about':        '关于',
    'settings.privacy':      '隐私政策',

    /* Welcome */
    'welcome.about':         '关于',
    'welcome.aboutP1':       'Markdown Browser 让您直接在 Chrome 中阅读、编辑和搜索本地的 .md 文件——无需上传、无需云服务、无需联网。您的文件始终保存在本地。',
    'welcome.aboutP2':       '基于 File System Access API 构建，Chrome 在您明确授权后才能访问您的文件夹。',
    'welcome.howTo':         '使用指南',
    'welcome.step1Title':    '打开文件夹',
    'welcome.step1Desc':     '点击侧边栏的"打开文件夹"，选择一个本地目录。所有 .md、.mdx 和 .markdown 文件将显示在文件树中。',
    'welcome.step2Title':    '浏览与阅读',
    'welcome.step2Desc':     '点击任意文件打开。使用"目录"标签跳转到标题，"最近"标签查看历史文件。使用 {0} / {1} 在文件间切换。',
    'welcome.step3Title':    '编辑与保存',
    'welcome.step3Desc':     '点击面包屑中的"编辑"（或按 {0}）进入行内编辑——点击任意段落、标题或列表即可编辑。使用 ▾ 下拉菜单进入全屏编辑器（{1}），按 {2} 保存。',
    'welcome.step4Title':    'Wiki 链接与 Callout',
    'welcome.step4Desc':     '使用 [[文件名]] 在文件间建立链接——反向链接面板会显示引用了当前文件的其他文件。支持 Obsidian 风格的 callout：> [!NOTE]、> [!WARNING]、> [!TIP] 等。',
    'welcome.step5Title':    '创建、删除与搜索',
    'welcome.step5Desc':     '点击侧边栏的 + 号创建新文件。悬停文件可显示删除按钮。按 {0} 可即时搜索整个文件夹中的文件名和内容。',
    'welcome.step6Title':    '导出与热重载',
    'welcome.step6Desc':     '点击面包屑中的 PDF 按钮导出干净的打印文档。在顶部启用"热重载"后，使用外部编辑器保存时自动刷新预览。',
    'welcome.shortcuts':     '快捷键',
    'welcome.shortcutSearch':'搜索文件和内容',
    'welcome.shortcutInlineEdit': '行内编辑模式',
    'welcome.shortcutFullEditor': '全屏编辑模式',
    'welcome.shortcutSave':  '保存文件',
    'welcome.shortcutFind':  '查找与替换（全屏编辑器）',
    'welcome.shortcutPrev':  '上一个文件',
    'welcome.shortcutNext':  '下一个文件',
    'welcome.shortcutSidebar': '切换侧边栏',
    'welcome.shortcutClose': '关闭面板、设置或查找栏',
    'welcome.features':      '功能特性',
    'welcome.featureInlineEdit': '行内编辑 — 在预览中点击任意区块即可原地编辑（{0}）',
    'welcome.featureFullEditor': '全屏编辑器 — 直接编辑文件，支持查找替换，按 {0} 保存',
    'welcome.featureWikiLinks': 'Wiki 链接 — [[文件名]] 跨文件链接，附带反向链接面板',
    'welcome.featureCallouts': 'Callout 块 — Obsidian 风格的 > [!NOTE]、> [!WARNING]、> [!TIP] 等',
    'welcome.featureFileMgmt': '创建与删除文件 — 无需离开应用即可管理 Markdown 文件夹',
    'welcome.featurePdf':    '导出 PDF — 整洁的打印输出',
    'welcome.featureGfm':    '完整 GFM 支持 — 表格、任务列表、Front Matter、代码块',
    'welcome.featureHighlighting': '语法高亮 — JS, TS, Python, Go, Rust, SQL, CSS, HTML, Bash, JSON',
    'welcome.featureHotReload': '热重载 — 在外部编辑器中编辑时实时预览',
    'welcome.featureSearch': '全文搜索 — 搜索文件夹中的所有文件',
    'welcome.featureToc':    '目录导航 — 附带滚动高亮',
    'welcome.featureLayout': '可调整侧边栏、字体大小和阅读宽度',
    'welcome.featureTheme':  '亮色与暗色模式 — 在顶栏切换',
    'welcome.featureOffline':'100% 离线与隐私 — 数据永不离开您的计算机',
    'welcome.madeBy':        '由 {0} 制作',

    /* Copy button */
    'copy.copy':             '复制',
    'copy.copied':           '已复制！',

    /* Theme toggle */
    'theme.switchLight':     '切换到亮色模式',
    'theme.switchDark':      '切换到暗色模式',

    /* Reload toggle */
    'reload.on':             '热加载已开启 — 点击关闭',
    'reload.off':            '热加载已关闭 — 点击开启',
  };

  // ── State ──────────────────────────────────────────────────

  let currentLang = 'en';
  const fallbackLang = 'en';
  const supportedLangs = ['en', 'zh'];
  const packs = { en, zh };

  // ── Auto-detect ────────────────────────────────────────────

  function detectLanguage() {
    const lang = (navigator.language || '').toLowerCase();
    if (lang.startsWith('zh')) return 'zh';
    return 'en';
  }

  // ── Translation function ───────────────────────────────────

  function t(key, ...args) {
    let text = packs[currentLang]?.[key] || packs[fallbackLang]?.[key] || key;
    if (args.length) {
      args.forEach((arg, i) => {
        text = text.replace(new RegExp(`\\{${i}\\}`, 'g'), String(arg));
      });
    }
    return text;
  }

  // ── Apply translations to DOM ──────────────────────────────

  function applyLanguage(lang) {
    if (lang) currentLang = lang;
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';

    // data-i18n-html — replace innerHTML (for complex content with child elements)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });

    // data-i18n — replace textContent
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translation = t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translation;
      } else if (el.title !== undefined && el.dataset.i18nTitle !== undefined) {
        // handled by data-i18n-title
      } else {
        el.textContent = translation;
      }
    });

    // data-i18n-title — replace title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.dataset.i18nTitle);
    });

    // data-i18n-placeholder — replace placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    // data-i18n-value — replace value of <option>/<select>/buttons
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
      el.value = t(el.dataset.i18nValue);
    });

    // Fire a custom event so app.js can re-translate dynamic content
    document.dispatchEvent(new CustomEvent('i18n-changed', { detail: { lang: currentLang } }));
  }

  // ── Init ───────────────────────────────────────────────────

  async function init() {
    // Try to load saved language preference
    try {
      const saved = await new Promise(res => {
        chrome.storage.local.get('language', data => res(data.language));
      });
      if (saved && supportedLangs.includes(saved)) {
        currentLang = saved;
      } else {
        currentLang = detectLanguage();
      }
    } catch (_) {
      currentLang = detectLanguage();
    }
    applyLanguage(currentLang);
    return currentLang;
  }

  // ── Switch language ───────────────────────────────────────

  async function setLanguage(lang) {
    if (!supportedLangs.includes(lang)) return;
    currentLang = lang;
    try {
      await new Promise(res => chrome.storage.local.set({ language: lang }, res));
    } catch (_) {}
    applyLanguage(lang);
  }

  function getLanguage() { return currentLang; }
  function getSupportedLanguages() { return [...supportedLangs]; }

  return { init, t, applyLanguage, setLanguage, getLanguage, getSupportedLanguages };
})();
