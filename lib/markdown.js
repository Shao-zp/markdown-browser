/*!
 * Markdown Browser — GFM Parser
 * Parses GitHub Flavored Markdown to HTML
 */

const Markdown = (() => {

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // ── Inline parser ──────────────────────────────────────────

  function parseInline(src) {
    if (!src) return '';
    let out = '';

    while (src.length) {
      let m;

      // Escape
      m = /^\\([\\`*_{}\[\]()#+\-.!~=|])/.exec(src);
      if (m) { out += escapeHtml(m[1]); src = src.slice(m[0].length); continue; }

      // Code span
      m = /^(`+)([\s\S]*?[^`])\1(?!`)/.exec(src) || /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/.exec(src);
      if (m) {
        const code = m[2] !== undefined ? m[2] : m[1];
        out += `<code>${escapeHtml(code.trim())}</code>`;
        src = src.slice(m[0].length); continue;
      }

      // Image (before link)
      m = /^!\[([^\]]*)\]\(([^)\s"']+)(?:\s+"([^"]+)")?\)/.exec(src);
      if (m) {
        const alt = escapeHtml(m[1]);
        const href = escapeHtml(m[2]);
        const title = m[3] ? ` title="${escapeHtml(m[3])}"` : '';
        out += `<img src="${href}" alt="${alt}"${title} loading="lazy">`;
        src = src.slice(m[0].length); continue;
      }

      // Link
      m = /^\[([^\]]+)\]\(([^)\s"']+)(?:\s+"([^"]+)")?\)/.exec(src);
      if (m) {
        const text = parseInline(m[1]);
        const href = escapeHtml(m[2]);
        const title = m[3] ? ` title="${escapeHtml(m[3])}"` : '';
        const external = /^https?:\/\//.test(m[2]) ? ' target="_blank" rel="noopener"' : '';
        out += `<a href="${href}"${title}${external}>${text}</a>`;
        src = src.slice(m[0].length); continue;
      }

      // Autolink
      m = /^<(https?:\/\/[^\s>]+)>/.exec(src);
      if (m) {
        out += `<a href="${escapeHtml(m[1])}" target="_blank" rel="noopener">${escapeHtml(m[1])}</a>`;
        src = src.slice(m[0].length); continue;
      }

      // Email autolink
      m = /^<([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})>/.exec(src);
      if (m) {
        out += `<a href="mailto:${escapeHtml(m[1])}">${escapeHtml(m[1])}</a>`;
        src = src.slice(m[0].length); continue;
      }

      // Bold + Italic (triple)
      m = /^\*{3}([\s\S]+?)\*{3}/.exec(src) || /^_{3}([\s\S]+?)_{3}/.exec(src);
      if (m) {
        out += `<strong><em>${parseInline(m[1])}</em></strong>`;
        src = src.slice(m[0].length); continue;
      }

      // Bold
      m = /^\*{2}([\s\S]+?)\*{2}/.exec(src) || /^_{2}([^_\n]+?)_{2}/.exec(src);
      if (m) {
        out += `<strong>${parseInline(m[1])}</strong>`;
        src = src.slice(m[0].length); continue;
      }

      // Italic
      m = /^\*([^*\n]+?)\*(?!\*)/.exec(src) || /^_([^_\n]+?)_(?!_)/.exec(src);
      if (m) {
        out += `<em>${parseInline(m[1])}</em>`;
        src = src.slice(m[0].length); continue;
      }

      // Strikethrough
      m = /^~~([\s\S]+?)~~/.exec(src);
      if (m) {
        out += `<del>${parseInline(m[1])}</del>`;
        src = src.slice(m[0].length); continue;
      }

      // Highlight
      m = /^==([\s\S]+?)==/.exec(src);
      if (m) {
        out += `<mark>${parseInline(m[1])}</mark>`;
        src = src.slice(m[0].length); continue;
      }

      // Hard line break
      m = /^ {2,}\n|\\\n/.exec(src);
      if (m) { out += '<br>\n'; src = src.slice(m[0].length); continue; }

      // Consume up to next special char
      m = /^[\s\S]+?(?=[\\`*_{}\[\]!<>=~]|~~|==| {2,}\n|\\\n|$)/.exec(src);
      if (m) { out += escapeHtml(m[0]); src = src.slice(m[0].length); continue; }

      out += escapeHtml(src[0]);
      src = src.slice(1);
    }

    return out;
  }

  // ── Front matter ────────────────────────────────────────────

  function parseFrontMatter(yaml) {
    const data = {};
    const lines = yaml.split('\n');
    for (const line of lines) {
      const m = /^([\w-]+)\s*:\s*(.*)/.exec(line.trim());
      if (!m) continue;
      let val = m[2].trim();
      if (/^\[.*\]$/.test(val)) {
        try { val = JSON.parse(val.replace(/'/g, '"')); } catch (_) {}
      } else if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
      else val = val.replace(/^["']|["']$/g, '');
      data[m[1]] = val;
    }
    return data;
  }

  function renderFrontMatter(data) {
    if (!data || !Object.keys(data).length) return '';
    const rows = Object.entries(data).map(([k, v]) => {
      let valHtml;
      if (Array.isArray(v)) {
        valHtml = v.map(t => `<span class="frontmatter-tag">${escapeHtml(String(t))}</span>`).join(' ');
      } else {
        valHtml = `<span class="frontmatter-val">${escapeHtml(String(v))}</span>`;
      }
      return `<span class="frontmatter-key">${escapeHtml(k)}</span>${valHtml}`;
    });
    return `<div class="frontmatter-panel"><h4>Front Matter</h4><div class="frontmatter-grid">${rows.join('')}</div></div>`;
  }

  // ── List parser ─────────────────────────────────────────────

  function parseList(src) {
    const ordered = /^[ \t]*\d+\./.test(src.trim());
    const tag = ordered ? 'ol' : 'ul';
    const items = [];
    let current = null;

    for (const line of src.split('\n')) {
      const m = /^([ \t]*)(?:[*+\-]|\d+\.)\s+(.*)/.exec(line);
      if (m) {
        if (current !== null) items.push(current);
        current = m[2];
      } else if (current !== null) {
        const cont = /^[ \t]{2,}(.*)/.exec(line);
        if (cont) current += '\n' + cont[1];
        else if (line.trim()) current += ' ' + line.trim();
      }
    }
    if (current !== null) items.push(current);

    let out = `<${tag}>\n`;
    for (const item of items) {
      const task = /^\[([x ])\]\s+([\s\S]*)/.exec(item);
      if (task) {
        const checked = task[1].toLowerCase() === 'x';
        out += `<li class="task-item"><input type="checkbox"${checked ? ' checked' : ''} disabled> ${parseInline(task[2])}</li>\n`;
      } else {
        out += `<li>${parseInline(item.replace(/\n/g, ' '))}</li>\n`;
      }
    }
    out += `</${tag}>\n`;
    return out;
  }

  // ── Block parser ────────────────────────────────────────────

  function parse(src) {
    src = src.replace(/\r\n|\r/g, '\n').replace(/\t/g, '  ');

    let html = '';
    let frontMatter = null;
    const headings = [];

    // Front matter
    const fmM = /^---\n([\s\S]*?)\n---\s*\n?/.exec(src);
    if (fmM) {
      frontMatter = parseFrontMatter(fmM[1]);
      html += renderFrontMatter(frontMatter);
      src = src.slice(fmM[0].length);
    }

    while (src.length) {
      let m;

      // Blank lines
      m = /^\n+/.exec(src);
      if (m) { src = src.slice(m[0].length); continue; }

      // ATX heading
      m = /^(#{1,6})[ \t]+(.+?)[ \t]*(?:#+[ \t]*)?\n/.exec(src);
      if (!m) m = /^(#{1,6})[ \t]+(.+?)[ \t]*(?:#+[ \t]*)?$/.exec(src);
      if (m) {
        const level = m[1].length;
        const raw = m[2].trim();
        const id = slugify(raw);
        const text = parseInline(raw);
        headings.push({ level, text: raw, id });
        html += `<h${level} id="${id}">${text}</h${level}>\n`;
        src = src.slice(m[0].length); continue;
      }

      // Fenced code block
      m = /^(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\n?\1[ \t]*\n?/.exec(src);
      if (m) {
        const fence = m[1];
        const infoLine = m[2].trim();
        const lang = infoLine.split(/\s+/)[0];
        const codeRaw = m[3];
        const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : '';
        const langLabel = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : '';
        const highlighted = lang ? Highlighter.highlight(codeRaw, lang) : escapeHtml(codeRaw);
        html += `<div class="code-block">${langLabel}<pre><code${langClass}>${highlighted}</code></pre><button class="copy-btn" data-code="${escapeHtml(codeRaw)}">Copy</button></div>\n`;
        src = src.slice(m[0].length); continue;
      }

      // Indented code block (4 spaces)
      m = /^((?:[ ]{4}[^\n]*\n?)+)/.exec(src);
      if (m) {
        const code = m[0].replace(/^    /gm, '');
        html += `<div class="code-block"><pre><code>${escapeHtml(code)}</code></pre></div>\n`;
        src = src.slice(m[0].length); continue;
      }

      // Blockquote
      m = /^((?:>[ \t]?[^\n]*\n?)+)/.exec(src);
      if (m) {
        const inner = m[0].replace(/^>[ \t]?/gm, '').replace(/\n$/, '\n');
        html += `<blockquote>${parse(inner).html}</blockquote>\n`;
        src = src.slice(m[0].length); continue;
      }

      // Horizontal rule (must come before setext)
      m = /^(?:---+|___+|\*\*\*+)[ \t]*\n/.exec(src);
      if (m) { html += '<hr>\n'; src = src.slice(m[0].length); continue; }

      // GFM Table
      m = /^(\|.+\|[ \t]*\n)([ \t]*\|[ \t]*:?-{3,}:?[ \t]*(?:\|[ \t]*:?-{3,}:?[ \t]*)*\|[ \t]*\n)((?:\|.+\|[ \t]*\n)*)/.exec(src);
      if (!m) m = /^(.+\|.+\n)([ \t]*:?-{3,}:?(?:[ \t]*\|[ \t]*:?-{3,}:?)+[ \t]*\n)((?:.+\|.+\n)*)/.exec(src);
      if (m) {
        const parseRow = row => row.trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim());
        const headers = parseRow(m[1]);
        const alignRow = parseRow(m[2]);
        const aligns = alignRow.map(s => {
          if (/^:.*:$/.test(s)) return 'center';
          if (/^:/.test(s)) return 'left';
          if (/:$/.test(s)) return 'right';
          return '';
        });
        const rows = m[3].trim() ? m[3].trim().split('\n').map(parseRow) : [];

        let t = '<div class="table-wrapper"><table>\n<thead><tr>';
        headers.forEach((h, i) => {
          const a = aligns[i] ? ` style="text-align:${aligns[i]}"` : '';
          t += `<th${a}>${parseInline(h)}</th>`;
        });
        t += '</tr></thead>\n<tbody>\n';
        rows.forEach(row => {
          t += '<tr>';
          headers.forEach((_, i) => {
            const a = aligns[i] ? ` style="text-align:${aligns[i]}"` : '';
            t += `<td${a}>${parseInline(row[i] ?? '')}</td>`;
          });
          t += '</tr>\n';
        });
        t += '</tbody></table></div>\n';
        html += t;
        src = src.slice(m[0].length); continue;
      }

      // List
      m = /^([ \t]*(?:[*+\-]|\d+\.)[ \t]+[\s\S]+?)(?=\n(?![ \t])|\n{2,}|$)/.exec(src);
      if (m && /^[ \t]*(?:[*+\-]|\d+\.)[ \t]+/.test(m[0])) {
        html += parseList(m[0]);
        src = src.slice(m[0].length); continue;
      }

      // Setext heading
      m = /^([^\n]+)\n(={3,}|-{3,})[ \t]*\n/.exec(src);
      if (m) {
        const level = m[2][0] === '=' ? 1 : 2;
        const raw = m[1].trim();
        const id = slugify(raw);
        const text = parseInline(raw);
        headings.push({ level, text: raw, id });
        html += `<h${level} id="${id}">${text}</h${level}>\n`;
        src = src.slice(m[0].length); continue;
      }

      // Raw HTML block
      m = /^<(div|section|article|header|footer|nav|aside|main|details|summary|figure|figcaption|pre|table|ul|ol|h[1-6])[^>]*>[\s\S]*?<\/\1>[ \t]*\n/i.exec(src);
      if (m) { html += m[0]; src = src.slice(m[0].length); continue; }

      // Paragraph — consume until blank line or block-level element
      m = /^((?:[^\n]+\n?)+?)(?:\n{2,}|(?=#{1,6}[ \t]|```|~~~|[ ]{4}|>[ \t]?|[ \t]*[-*+]\s|[ \t]*\d+\.\s|\|.*\||(?:---+|___+|\*\*\*+)[ \t]*\n|$))/.exec(src);
      if (m && m[1].trim()) {
        const lines = m[1].trimEnd().replace(/\n/g, ' ');
        html += `<p>${parseInline(lines)}</p>\n`;
        src = src.slice(m[0].length); continue;
      }

      // Fallback: consume one line
      m = /^[^\n]+\n?/.exec(src);
      if (m) {
        if (m[0].trim()) html += `<p>${parseInline(m[0].trim())}</p>\n`;
        src = src.slice(m[0].length); continue;
      }

      src = src.slice(1);
    }

    return { html, headings, frontMatter };
  }

  return { parse, parseInline, escapeHtml, slugify };

})();
