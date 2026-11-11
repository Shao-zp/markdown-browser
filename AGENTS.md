# Markdown Browser

A Chrome extension for reading, writing, and organizing local markdown files — fully offline, no build step, pure vanilla JS.

## Project

- **Stack:** Chrome Extension (MV3), vanilla JavaScript, CSS custom properties
- **Entry points:**
  - `background.js` — service worker: opens `app.html` on toolbar click
  - `app.html` + `app.js` — main SPA (sidebar + viewer + editor)
  - `content.js` — content script injected on `file://*.md` URLs, renders markdown directly
- **Manifest:** `manifest.json` (v3, version `2.4.1`)
- **No package.json / bundler** — zero dependencies, zero build step
- **Vendored third-party libs** (the only exceptions to "no dependencies", both must stay offline & eval-free): `lib/mermaid.min.js` (v11 diagram renderer), `lib/panzoom.min.js` (@panzoom/panzoom 4.6.2, MIT, pan/zoom for mermaid cards)

## Commands

```
# No build / test / lint tooling exists (pure vanilla JS).
# For development:
1. Open chrome://extensions → Developer mode → Load unpacked → select this folder
2. Generate icons first: open icons/generate-icons.html in Chrome → Download All
3. Reload the extension after editing any file
```

## Architecture

| Module | Role |
|---|---|
| `app.js` (2780 lines) | Main SPA: state management, DOM refs, event binding, file tree, editor, settings, search, backlinks, mermaid viewer |
| `app.css` (1965 lines) | Anthropic-inspired dark/light theme via `[data-theme]` switching |
| `lib/markdown.js` | Custom GFM parser: lists (nested, ordered `start`, task lists), tables, front matter, callouts, wiki-links, code blocks with copy buttons, auto-heading anchors |
| `lib/highlighter.js` | Token-based syntax highlighter for 10+ languages (JS, TS, Python, Go, Rust, SQL, CSS, HTML, Bash, JSON) |
| `background.js` | Service worker: single action — opens `app.html` in new tab |
| `content.js` | Content script: renders markdown on `file://*.md` pages with a top bar |

**Data flow:**
- File System Access API (`showDirectoryPicker`) to open local folders
- `chrome.storage.local` for settings, recent files
- IndexedDB via `idbGet`/`idbSet` helpers to persist folder handle across sessions
- Service worker is stateless; heavy lifting is all in `app.js`

## Conventions

- **No external dependencies** — pure vanilla JS only
- **Strict mode** — every JS file starts with `'use strict'` (content.js uses an IIFE)
- **Naming:** `camelCase` for variables/functions, `kebab-case` for CSS custom properties and IDs
- **DOM queries:** `document.getElementById` via a `dom` lookup table (not `querySelector` everywhere)
- **Chrome storage:** promisified wrappers `chromeGet(key)` / `chromeSet(key, value)`
- **Event binding:** all listeners wired in a single `bindEvents()` function in `app.js`
- **CSS:** CSS custom properties (logical property names with `--` prefix, e.g. `--bg-1`), dark/light via `:root[data-theme="light"]`
- **Error handling:** `try/catch` around async file operations; no global error handler
- **File organization:** flat structure, lib/ for parser + highlighter only
- **Async:** `async/await` throughout, no raw promise chains
- **Indentation:** 2 spaces

## Notes

- **i18n:** `lib/i18n.js` — 中英文翻译模块。HTML 用 `data-i18n`/`data-i18n-title`/`data-i18n-placeholder`/`data-i18n-html` 属性标记可翻译元素，JS 动态字符串用 `I18n.t(key, ...args)`。语言自动检测（`navigator.language`）并持久化到 `chrome.storage.local`。
- **Mermaid:** markdown 中的 ````mermaid` 代码块渲染为卡片式示意图，走 `app.js` 的 `renderMermaidNodes()`（`renderDocument()` 与 `commitBlockEdit()` 都调用），`content.js` 只是跳转到 SPA。要点：
  - 主题用 `theme: 'base'` + `mermaidThemeVars(isDark)`（见 `app.js`），配色对齐 app.css；**切换明暗主题必须调 `rerenderMermaid()`**，mermaid 会把配色烘进 SVG，不重渲染就是深色底配浅色图。
  - `useMaxWidth: false` 让 mermaid 输出像素宽高，才能交给 Panzoom 做缩放平移；初始视图是「按宽度适配」（`fitWidth()`），不要改回 `fit()`，否则长流程图会被压到看不清。
  - 渲染后由 `enhanceMermaidFigure()` 套上工具栏 + `.mermaid-canvas`，Panzoom 实例挂在 `el._panzoom`；重渲染前必须 `destroyMermaidFigure()`（内含 `destroy()` 与清理 `data-processed`）。
  - **Panzoom 坐标系陷阱**：Panzoom 对 `<svg>` 根元素设的是 `transform-origin: 50% 50%`（它只在 `nodeName !== 'svg'` 的内层元素上用 `0 0`），所以视觉位置 = `(1 - scale) * 尺寸 / 2 + scale * translate`。居中与平移边界必须用 `panToVis()` / `visToPan()` / `centerPan()` 在**视觉坐标**里算，不要把 `translate` 直接当视觉位置；也不要在 CSS 里覆盖 `transform-origin`（会破坏滚轮定点缩放）。
  - 平移边界是「自由平移 + 可见性保护」（`clampAxis()`，至少保留画布 25% 可见），**不要**改回「严格包含」：严格包含会让「图宽恰等于画布宽」或「适应窗口后」的某一维区间退化成 `[0,0]`，表现为图完全拖不动。
  - 源码在首次渲染前存进 `el.dataset.mermaidSrc`（未插 `<br/>` 的原始版本）；已渲染的元素**绝不能**再读 `textContent` 当源码（会读到 SVG 里的 CSS，产生乱码）。
- **列表解析:** `lib/markdown.js` 的 `collectList()` + `renderList()` 整块收集列表（连续条目、空行隔开的续号条目、嵌套子列表、条目内代码块/引用）。改动时注意：`collectList()` 返回的 `source` 必须**逐字等于** `src` 中被消费的前缀（含只带空格的空行），`parse()` 用 `source.length + 1` 前进；一旦 source 比实际消费的短，列表尾部就会被重复渲染成一个多余段落。
- **行内图片/链接的目标语法:** `parseInline()` 里图片与链接**各有两条正则**，尖括号形式 `![alt](<path>)` / `[text](<path>)` 的那条**必须排在普通形式之前**，并用 `||` 兜底普通形式。尖括号是 CommonMark 给「路径含空格」的写法，全库有 11 份文档、207 张图 + 766 个链接在用；若被普通正则先匹配，`<` `>` 会被 `escapeHtml()` 转义进 `src`/`href`，浏览器请求带尖括号的文件名直接 404 破图。
- **本地图片验证的两个坑**（写 Playwright 测试时必踩）：① `lib/markdown.js` 生成的 `<img>` 带 `loading="lazy"`，不把图片滚进视口就永远是 `naturalWidth === 0`，看起来像"全部加载失败"；② MV3 扩展页 CSP 默认 `img-src 'self' data: blob:`，测试里把 `src` 换成 `http://127.0.0.1/...` 会被拦，验证真实解码要用 blob URL（或另开普通页面跑静态服务）。真实运行路径是 `resolveLocalImages()`（`app.js`）通过 File System Access API 读文件后换 blob URL，不经过 HTTP。
