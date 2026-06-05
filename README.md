# Markdown Browser

A Chrome extension for reading, writing, and organizing local markdown files — fast, private, and fully offline.

![Markdown Browser](icons/icon128.png)

## Features

### Reading
- **Local file reading** via the File System Access API — no uploads, no cloud
- **Sidebar file tree** with collapsible folders and live filter
- **Hot reload** — viewer auto-refreshes when you save in an external editor
- **Full-text search** across all markdown files (`⌘K`)
- **Table of contents** with scroll-spy highlighting
- **Syntax highlighting** for JS, TS, Python, Go, Rust, SQL, CSS, HTML, Bash, JSON
- **GitHub Flavored Markdown** — tables, task lists, front matter, code blocks
- **Recent files** history
- **Light & dark mode** with preference saved

### Editing
- **In-browser editor** — edit any file directly, save with `⌘S`
- **Create new files** — add `.md` files to your folder from the sidebar
- **Delete files** — remove files with a confirmation prompt
- **Find & Replace** — `⌘F` to search and replace within the editor
- **Export to PDF** — clean, print-ready output via the browser's print dialog

### Customisation
- **Resizable sidebar**, adjustable font size, reading width, font family
- **100% offline** — no data ever leaves your machine

## Installation

### From Chrome Web Store
[Install Markdown Browser](https://chrome.google.com/webstore/detail/markdown-browser)

### Load unpacked (development)

1. Clone or download this repository
2. Open `icons/generate-icons.html` in Chrome → click **Download All** → place the 4 PNGs in `icons/`
3. Go to `chrome://extensions`
4. Enable **Developer mode** (top-right toggle)
5. Click **Load unpacked** → select this folder
6. Click the extension icon in your toolbar

## Usage

1. Click the Markdown Browser icon in the Chrome toolbar
2. In the sidebar, click **Open Folder** and select a local directory
3. Click any `.md` file to open it
4. Press `⌘K` to search across all files
5. Click **Edit** in the file breadcrumb to edit the file directly

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` | Open command palette / search |
| `⌘[` | Previous file |
| `⌘]` | Next file |
| `⌘⇧F` | Full-text search |
| `⌘E` | Enter / exit edit mode |
| `⌘S` | Save file (edit mode) |
| `⌘F` | Find & replace (edit mode) |
| `ESC` | Close palette, settings, or find bar |

## Supported File Types

`.md` · `.mdx` · `.markdown` · `.mdown` · `.mkd` · `.txt`

## Privacy

This extension operates entirely offline. Read and write access to your files is granted only through Chrome's built-in permission dialog at your explicit request. No data is collected or transmitted. See the [Privacy Policy](https://markdownbrowser.abhikuchbhi.in/privacy.html) for the full policy.

## Development

Pure vanilla JS — no build step, no dependencies, no bundler.

```
markdown-browser/
├── manifest.json        MV3 manifest (v2.0.0)
├── background.js        Service worker (opens app tab)
├── app.html             Main single-page app
├── app.js               App logic
├── app.css              Anthropic-inspired dark/light theme
├── lib/
│   ├── markdown.js      Custom GFM parser
│   └── highlighter.js   Syntax highlighter
├── about.html           About page
├── privacy.html         Privacy policy
└── icons/               Extension icons (PNG)
```

## Changelog

### v2.0.0
- In-browser markdown editor with `⌘S` save
- Create new files from the sidebar
- Delete files with confirmation
- Find & Replace (`⌘F`) in editor
- Export to PDF with clean print output
- Persistent search bar in the header
- Visible Edit / PDF buttons in the file breadcrumb

### v1.0.0
- Initial release: read-only markdown viewer, hot reload, full-text search, TOC, syntax highlighting

## License

MIT — see [LICENSE](LICENSE)

## Author

[abhikuchbhi.in](https://abhikuchbhi.in)
