# Markdown Browser

A Chrome extension for reading, writing, and organizing local markdown files — fully offline, no build step, pure vanilla JS.

## Project

- **Stack:** Chrome Extension (MV3), vanilla JavaScript, CSS custom properties
- **Entry points:**
  - `background.js` — service worker: opens `app.html` on toolbar click
  - `app.html` + `app.js` — main SPA (sidebar + viewer + editor)
  - `content.js` — content script injected on `file://*.md` URLs, renders markdown directly
- **Manifest:** `manifest.json` (v3, version `2.1.0`)
- **No package.json / bundler** — zero dependencies, zero build step

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
| `app.js` (1782 lines) | Main SPA: state management, DOM refs, event binding, file tree, editor, settings, search, backlinks |
| `app.css` (1803 lines) | Anthropic-inspired dark/light theme via `[data-theme]` switching |
| `lib/markdown.js` | Custom GFM parser: tables, task lists, front matter, callouts, wiki-links, code blocks with copy buttons, auto-heading anchors |
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
- **Mermaid:** `lib/mermaid.min.js` — markdown 中 ````mermaid` 代码块自动渲染为流程图。在 `app.js` 的 `renderDocument()` 和 `commitBlockEdit()` 中调用，`content.js` 中也支持。
