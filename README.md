# Markdown Browser

A Chrome extension for reading and organizing local markdown files — fast, private, and fully offline.

![Markdown Browser](icons/icon128.png)

## Features

- **Local file reading** via the File System Access API — no uploads, no cloud
- **Sidebar file tree** with collapsible folders and live filter
- **Hot reload** — viewer auto-refreshes when you save in your editor
- **Full-text search** across all markdown files with `⌘K`
- **Table of contents** with scroll-spy highlighting
- **Syntax highlighting** — JS, TS, Python, Go, Rust, SQL, CSS, HTML, Bash, JSON
- **Front matter** display (YAML metadata)
- **Light & dark mode** toggle
- **Resizable sidebar**, adjustable font size, reading width, font family
- **Recent files** history
- **100% offline** — no data leaves your machine

## Installation

### From Chrome Web Store
*(Coming soon)*

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

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` | Open command palette / search |
| `⌘[` | Previous file |
| `⌘]` | Next file |
| `⌘⇧F` | Full-text search |
| `ESC` | Close palette or settings |

## Supported File Types

`.md` · `.mdx` · `.markdown` · `.mdown` · `.mkd`

## Privacy

This extension operates entirely offline. It does not collect, transmit, or store any data outside your local machine. See [privacy.html](privacy.html) for the full policy.

## Development

Pure vanilla JS — no build step, no dependencies, no bundler.

```
markdown-browser/
├── manifest.json       MV3 manifest
├── background.js       Service worker (opens app tab)
├── app.html            Main single-page app
├── app.js              App logic
├── app.css             Anthropic-inspired dark/light theme
├── lib/
│   ├── markdown.js     Custom GFM parser
│   └── highlighter.js  Syntax highlighter
├── about.html          About page
├── privacy.html        Privacy policy
└── icons/              Extension icons (PNG)
```

## License

MIT — see [LICENSE](LICENSE)

## Author

[abhikuchbhi.in](https://abhikuchbhi.in)
