/*!
 * Markdown Browser — Syntax Highlighter
 * Token-based highlighter for common languages
 */

const Highlighter = (() => {

  // Token types → CSS classes
  const T = {
    keyword:     'hl-keyword',
    string:      'hl-string',
    number:      'hl-number',
    comment:     'hl-comment',
    fn:          'hl-function',
    klass:       'hl-class',
    operator:    'hl-operator',
    builtin:     'hl-builtin',
    type:        'hl-type',
    tag:         'hl-tag',
    attr:        'hl-attr',
    value:       'hl-value',
    decorator:   'hl-decorator',
    regex:       'hl-regex',
    prop:        'hl-property',
    punct:       'hl-punctuation',
  };

  function span(cls, text) {
    return `<span class="${cls}">${text}</span>`;
  }

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Generic tokenizer ──────────────────────────────────────

  function tokenize(src, rules) {
    let out = '';
    while (src.length) {
      let matched = false;
      for (const [cls, re] of rules) {
        const m = re.exec(src);
        if (m && m.index === 0) {
          out += cls ? span(cls, esc(m[0])) : esc(m[0]);
          src = src.slice(m[0].length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        out += esc(src[0]);
        src = src.slice(1);
      }
    }
    return out;
  }

  // ── Language definitions ───────────────────────────────────

  const LANGS = {};

  // JavaScript / TypeScript
  const JS_KEYWORDS = /^(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|static|super|switch|throw|try|typeof|var|void|while|with|yield|async|await|as|declare|enum|implements|interface|namespace|override|private|protected|public|readonly|type|abstract|keyof|infer|never|any|unknown|void|null|undefined|true|false)\b/;
  const JS_BUILTINS  = /^(?:console|Math|JSON|Object|Array|String|Number|Boolean|Promise|Map|Set|WeakMap|WeakSet|Symbol|Error|RegExp|Date|Infinity|NaN|globalThis|window|document|process|module|require|exports|__dirname|__filename)\b/;
  const JS_RULES = [
    [T.comment,  /^\/\/[^\n]*/],
    [T.comment,  /^\/\*[\s\S]*?\*\//],
    [T.string,   /^`(?:[^`\\]|\\.|\$\{[^}]*\})*`/],
    [T.string,   /^"(?:[^"\\]|\\.)*"/],
    [T.string,   /^'(?:[^'\\]|\\.)*'/],
    [T.regex,    /^\/(?!\/)(?:[^/\\\n]|\\.)+\/[gimsuy]*/],
    [T.decorator,/^@[\w.]+/],
    [T.keyword,  JS_KEYWORDS],
    [T.builtin,  JS_BUILTINS],
    [T.klass,    /^[A-Z][A-Za-z0-9_]*/],
    [T.fn,       /^[a-z_$][\w$]*(?=\s*\()/],
    [T.number,   /^0[xXbBoO][0-9a-fA-F_]+|^(?:\d[\d_]*\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[nfFdD]?/],
    [T.operator, /^[+\-*/%&|^~<>!=?:]+/],
    [T.punct,    /^[{}()\[\],;.]/],
    [null,       /^[a-zA-Z_$][\w$]*/],
    [null,       /^\s+/],
  ];
  LANGS['javascript'] = LANGS['js'] = LANGS['jsx'] = JS_RULES;
  LANGS['typescript'] = LANGS['ts'] = LANGS['tsx'] = JS_RULES;

  // Python
  const PY_KEYWORDS = /^(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|True|False|None)\b/;
  const PY_BUILTINS  = /^(?:print|len|range|input|int|float|str|bool|list|dict|set|tuple|type|isinstance|hasattr|getattr|setattr|open|super|object|Exception|ValueError|TypeError|KeyError|IndexError|AttributeError|enumerate|zip|map|filter|sorted|reversed|min|max|sum|abs|round|hex|bin|oct)\b/;
  const PY_RULES = [
    [T.comment,  /^#[^\n]*/],
    [T.string,   /^(?:r|b|f|rb|br|u)?"""[\s\S]*?"""/i],
    [T.string,   /^(?:r|b|f|rb|br|u)?'''[\s\S]*?'''/i],
    [T.string,   /^(?:r|b|f|rb|br|u)?"(?:[^"\\]|\\.)*"/i],
    [T.string,   /^(?:r|b|f|rb|br|u)?'(?:[^'\\]|\\.)*'/i],
    [T.decorator,/^@[\w.]+/],
    [T.keyword,  PY_KEYWORDS],
    [T.builtin,  PY_BUILTINS],
    [T.klass,    /^[A-Z][A-Za-z0-9_]*/],
    [T.fn,       /^[a-z_][\w]*(?=\s*\()/],
    [T.number,   /^0[xXbBoO][0-9a-fA-F_]+|^(?:\d[\d_]*\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[jJ]?/],
    [T.operator, /^[+\-*\/%&|^~<>!=:]+/],
    [T.punct,    /^[{}()\[\],;.]/],
    [null,       /^[a-zA-Z_][\w]*/],
    [null,       /^\s+/],
  ];
  LANGS['python'] = LANGS['py'] = PY_RULES;

  // Bash / Shell
  const SH_KEYWORDS = /^(?:if|then|else|elif|fi|for|while|do|done|case|esac|function|in|select|until|return|break|continue|local|export|readonly|declare|typeset|source|alias|unalias|echo|exit|set|unset|shift|exec|eval)\b/;
  const SH_BUILTINS  = /^(?:cd|ls|cp|mv|rm|mkdir|rmdir|touch|cat|grep|sed|awk|find|sort|uniq|head|tail|wc|curl|wget|chmod|chown|sudo|apt|brew|npm|yarn|pip|git|docker|kubectl)\b/;
  const SH_RULES = [
    [T.comment,  /^#[^\n]*/],
    [T.string,   /^\$'(?:[^'\\]|\\.)*'/],
    [T.string,   /^"(?:[^"\\$]|\\.|(?:\$\{[^}]*\}|\$[\w]+))*"/],
    [T.string,   /^'[^']*'/],
    [T.builtin,  /^\$(?:\{[^}]+\}|[\w@#?$!*-]+)/],
    [T.keyword,  SH_KEYWORDS],
    [T.fn,       SH_BUILTINS],
    [T.number,   /^\d+/],
    [T.operator, /^[|&;<>()]+/],
    [null,       /^[a-zA-Z_][\w-]*/],
    [null,       /^\s+/],
  ];
  LANGS['bash'] = LANGS['sh'] = LANGS['shell'] = LANGS['zsh'] = SH_RULES;

  // CSS / SCSS
  const CSS_RULES = [
    [T.comment,  /^\/\*[\s\S]*?\*\//],
    [T.comment,  /^\/\/[^\n]*/],
    [T.string,   /^"(?:[^"\\]|\\.)*"|^'(?:[^'\\]|\\.)*'/],
    [T.klass,    /^\.[a-zA-Z_-][\w-]*/],
    [T.builtin,  /^#[a-zA-Z_][\w-]*/],
    [T.tag,      /^[a-zA-Z][a-zA-Z0-9-]*(?=\s*[{,])/],
    [T.fn,       /^[a-zA-Z-]+(?=\s*\()/],
    [T.keyword,  /^@[a-zA-Z-]+/],
    [T.prop,     /^--[a-zA-Z-]+|^[a-zA-Z-]+(?=\s*:)/],
    [T.number,   /^-?(?:\d*\.)?\d+(?:px|em|rem|vh|vw|%|deg|ms|s)?/],
    [T.value,    /^#[0-9a-fA-F]{3,8}\b/],
    [T.operator, /^[:!+>~*]/],
    [T.punct,    /^[{}()\[\],;]/],
    [null,       /^[a-zA-Z_-][\w-]*/],
    [null,       /^\s+/],
  ];
  LANGS['css'] = LANGS['scss'] = LANGS['sass'] = LANGS['less'] = CSS_RULES;

  // HTML / XML
  function highlightHtml(src) {
    let out = '';
    const tagRe = /(<\/?)([a-zA-Z][a-zA-Z0-9:-]*)([^>]*?)(\/?>)/g;
    const attrRe = /([a-zA-Z:-]+)(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    let lastIdx = 0;
    let m;
    while ((m = tagRe.exec(src)) !== null) {
      out += esc(src.slice(lastIdx, m.index));
      const open = esc(m[1]);
      const tag  = span(T.tag, esc(m[2]));
      const close = esc(m[4]);
      let attrs = m[3];
      let attrsHtml = '';
      let aLast = 0, aM;
      attrRe.lastIndex = 0;
      while ((aM = attrRe.exec(attrs)) !== null) {
        attrsHtml += esc(attrs.slice(aLast, aM.index));
        attrsHtml += span(T.attr, esc(aM[1]));
        attrsHtml += esc(aM[2]);
        attrsHtml += span(T.value, esc(aM[3]));
        aLast = aM.index + aM[0].length;
      }
      attrsHtml += esc(attrs.slice(aLast));
      out += open + tag + attrsHtml + close;
      lastIdx = m.index + m[0].length;
    }
    out += esc(src.slice(lastIdx));
    // highlight comments
    return out.replace(/(&lt;!--[\s\S]*?--&gt;)/g, s => span(T.comment, s));
  }
  LANGS['html'] = LANGS['xml'] = LANGS['svg'] = { custom: highlightHtml };

  // JSON
  const JSON_RULES = [
    [T.prop,     /^"(?:[^"\\]|\\.)*"(?=\s*:)/],
    [T.string,   /^"(?:[^"\\]|\\.)*"/],
    [T.number,   /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/],
    [T.keyword,  /^(?:true|false|null)\b/],
    [T.punct,    /^[{}\[\],:\s]+/],
  ];
  LANGS['json'] = LANGS['jsonc'] = JSON_RULES;

  // Go
  const GO_KEYWORDS = /^(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var|nil|true|false|iota)\b/;
  const GO_BUILTINS  = /^(?:append|cap|close|complex|copy|delete|imag|len|make|new|panic|print|println|real|recover)\b/;
  const GO_TYPES     = /^(?:bool|byte|complex64|complex128|error|float32|float64|int|int8|int16|int32|int64|rune|string|uint|uint8|uint16|uint32|uint64|uintptr)\b/;
  const GO_RULES = [
    [T.comment,  /^\/\/[^\n]*/],
    [T.comment,  /^\/\*[\s\S]*?\*\//],
    [T.string,   /^`[^`]*`/],
    [T.string,   /^"(?:[^"\\]|\\.)*"/],
    [T.string,   /^'(?:[^'\\]|\\.)*'/],
    [T.keyword,  GO_KEYWORDS],
    [T.type,     GO_TYPES],
    [T.builtin,  GO_BUILTINS],
    [T.klass,    /^[A-Z][A-Za-z0-9_]*/],
    [T.fn,       /^[a-z_][\w]*(?=\s*\()/],
    [T.number,   /^0[xXbBoO][0-9a-fA-F_]+|^(?:\d[\d_]*\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/],
    [T.operator, /^[+\-*\/%&|^~<>!=:]+/],
    [T.punct,    /^[{}()\[\],;.]/],
    [null,       /^[a-zA-Z_][\w]*/],
    [null,       /^\s+/],
  ];
  LANGS['go'] = GO_RULES;

  // Rust
  const RS_KEYWORDS = /^(?:as|async|await|break|const|continue|crate|dyn|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while|abstract|become|box|do|final|macro|override|priv|try|typeof|unsized|virtual|yield)\b/;
  const RS_TYPES     = /^(?:bool|char|f32|f64|i8|i16|i32|i64|i128|isize|str|u8|u16|u32|u64|u128|usize|String|Vec|Option|Result|Box|Rc|Arc|HashMap|HashSet|BTreeMap|BTreeSet)\b/;
  const RS_RULES = [
    [T.comment,  /^\/\/[^\n]*/],
    [T.comment,  /^\/\*[\s\S]*?\*\//],
    [T.string,   /^r#+"(?:[^"])*"+#+/],
    [T.string,   /^b?"(?:[^"\\]|\\.)*"/],
    [T.string,   /^b?'(?:[^'\\]|\\.)*'/],
    [T.decorator,/^#!?\[[\s\S]*?\]/],
    [T.keyword,  RS_KEYWORDS],
    [T.type,     RS_TYPES],
    [T.klass,    /^[A-Z][A-Za-z0-9_]*/],
    [T.fn,       /^[a-z_][\w]*(?=\s*\(|::)/],
    [T.number,   /^0[xXbBoO][0-9a-fA-F_]+|^(?:\d[\d_]*\.?\d*|\.\d+)(?:[eE][+-]?\d+)?(?:_?[uif]\d+)?/],
    [T.operator, /^[+\-*\/%&|^~<>!=?:]+/],
    [T.punct,    /^[{}()\[\],;.]/],
    [null,       /^[a-zA-Z_][\w]*/],
    [null,       /^\s+/],
  ];
  LANGS['rust'] = LANGS['rs'] = RS_RULES;

  // SQL
  const SQL_KEYWORDS = /^(?:SELECT|FROM|WHERE|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|ON|AS|DISTINCT|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|UNION|ALL|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|COLUMN|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|CONSTRAINT|UNIQUE|CHECK|VIEW|PROCEDURE|FUNCTION|TRIGGER|DATABASE|SCHEMA|GRANT|REVOKE|BEGIN|COMMIT|ROLLBACK|TRANSACTION|CASE|WHEN|THEN|ELSE|END|WITH|RECURSIVE)\b/i;
  const SQL_RULES = [
    [T.comment,  /^--[^\n]*/],
    [T.comment,  /^\/\*[\s\S]*?\*\//],
    [T.string,   /^'(?:[^'\\]|\\.)*'|^"(?:[^"\\]|\\.)*"/],
    [T.keyword,  SQL_KEYWORDS],
    [T.fn,       /^[a-zA-Z_][\w]*(?=\s*\()/],
    [T.number,   /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/],
    [T.operator, /^[=<>!+\-*\/%&|^~]+/],
    [T.punct,    /^[(),;.]/],
    [null,       /^[a-zA-Z_][\w]*/],
    [null,       /^\s+/],
  ];
  LANGS['sql'] = SQL_RULES;

  // Markdown (nested)
  LANGS['markdown'] = LANGS['md'] = null;

  // ── Public API ─────────────────────────────────────────────

  function highlight(code, lang) {
    if (!lang) return esc(code);
    const normalized = lang.toLowerCase().split(/[^a-z0-9]/)[0];
    const def = LANGS[normalized];
    if (!def) return esc(code);
    if (def.custom) return def.custom(code);
    return tokenize(code, def);
  }

  return { highlight };

})();
