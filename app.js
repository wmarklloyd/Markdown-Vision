const root = document.documentElement;
const $ = (selector) => document.querySelector(selector);

const elements = {
  openButton: $('#openButton'),
  fileInput: $('#fileInput'),
  printButton: $('#printButton'),
  printStatus: $('#printStatus'),
  printDocument: $('#printDocument'),
  searchButton: $('#searchButton'),
  searchPanel: $('#searchPanel'),
  searchInput: $('#searchInput'),
  searchCount: $('#searchCount'),
  previousSearchMatch: $('#previousSearchMatch'),
  nextSearchMatch: $('#nextSearchMatch'),
  closeSearch: $('#closeSearch'),
  settingsButton: $('#settingsButton'),
  settingsPanel: $('#settingsPanel'),
  closeSettings: $('#closeSettings'),
  themeButton: $('#themeButton'),
  fontInput: $('#fontInput'),
  fontSuggestions: $('#fontSuggestions'),
  fontStatus: $('#fontStatus'),
  monoFontInput: $('#monoFontInput'),
  monoFontSuggestions: $('#monoFontSuggestions'),
  monoFontStatus: $('#monoFontStatus'),
  fontSize: $('#fontSize'),
  fontSizeOutput: $('#fontSizeOutput'),
  lineHeight: $('#lineHeight'),
  lineHeightOutput: $('#lineHeightOutput'),
  readingWidth: $('#readingWidth'),
  readingWidthOutput: $('#readingWidthOutput'),
  readerShell: $('#readerShell'),
  markdownOutput: $('#markdownOutput'),
  fileName: $('#fileName')
};

const legacyFonts = {
  serif: 'Georgia',
  sans: 'Arial',
  mono: 'Consolas',
  humanist: 'Segoe UI'
};
const defaults = { theme: 'light', font: 'Georgia', monoFont: 'Consolas', size: '18', line: '1.75', width: '720' };
const preferenceStorageKey = 'markdown-vision-preferences';
const fontCacheStorageKey = 'markdown-vision-font-cache';
const fontCacheTtlMs = 7 * 24 * 60 * 60 * 1000;
const storedPreferences = readLocalPreferences();
const preferences = { ...defaults, ...JSON.parse(storedPreferences) };
preferences.font = legacyFonts[preferences.font] || preferences.font;
let fontLoadPromise = null;
let installedFonts = [];
const fontPickers = [
  { key: 'system', input: elements.fontInput, suggestions: elements.fontSuggestions, status: elements.fontStatus, preference: 'font' },
  { key: 'mono', input: elements.monoFontInput, suggestions: elements.monoFontSuggestions, status: elements.monoFontStatus, preference: 'monoFont' }
];
const fontSuggestionStates = new Map(fontPickers.map((picker) => [picker.key, { items: [], activeIndex: -1, open: false }]));
let searchMatchCount = 0;
let activeSearchMatchIndex = -1;
let currentDocument = null;
let printPreparing = false;
let printSnapshot = null;
let renderedForPrint = null;
let printStatusTimer = null;

function readLocalPreferences() {
  try {
    return localStorage.getItem(preferenceStorageKey) || '{}';
  } catch {
    return '{}';
  }
}

async function loadPreferences() {
  if (!window.desktop?.getPreferences) return;
  try {
    const stored = await window.desktop.getPreferences();
    if (!stored || typeof stored !== 'object') {
      savePreferences();
      return;
    }
    Object.assign(preferences, defaults, stored);
    preferences.font = legacyFonts[preferences.font] || preferences.font;
    applyPreferences();
  } catch {}
}

function savePreferences() {
  try {
    localStorage.setItem(preferenceStorageKey, JSON.stringify(preferences));
  } catch {}
  if (window.desktop?.savePreferences) void window.desktop.savePreferences(preferences);
}

function applyFontStyle(preference, fontValue = preferences[preference]) {
  const safeFont = String(fontValue || defaults[preference]).replace(/["'\\]/g, '');
  if (preference === 'font') {
    root.style.setProperty('--reader-font', `"${safeFont}", serif`);
  } else {
    root.style.setProperty('--reader-mono-font', `"${safeFont}", ui-monospace, SFMono-Regular, Consolas, monospace`);
  }
}

function applyPreferences() {
  root.dataset.theme = preferences.theme;
  applyFontStyle('font');
  applyFontStyle('monoFont');
  root.style.setProperty('--reader-size', `${preferences.size}px`);
  root.style.setProperty('--reader-line', preferences.line);
  root.style.setProperty('--reader-width', `${preferences.width}px`);
  elements.fontInput.value = preferences.font;
  elements.monoFontInput.value = preferences.monoFont;
  elements.fontSize.value = preferences.size;
  elements.lineHeight.value = preferences.line;
  elements.readingWidth.value = preferences.width;
  elements.fontSizeOutput.value = `${preferences.size}px`;
  elements.lineHeightOutput.value = preferences.line;
  elements.readingWidthOutput.value = `${preferences.width}px`;
  elements.themeButton.setAttribute('aria-label', `Switch to ${preferences.theme === 'light' ? 'dark' : 'light'} mode`);
  syncPictureSourcesToTheme();
  window.markdownVisionEditorSearch?.remeasure();
}

function readCachedFonts() {
  try {
    const cachedFonts = JSON.parse(localStorage.getItem(fontCacheStorageKey) || 'null');
    if (!cachedFonts || !Array.isArray(cachedFonts.fonts) || typeof cachedFonts.savedAt !== 'number') return null;
    if (!cachedFonts.fonts.length) return null;
    if ((Date.now() - cachedFonts.savedAt) > fontCacheTtlMs) return null;
    return cachedFonts.fonts;
  } catch {
    return null;
  }
}

function writeCachedFonts(fonts) {
  if (Array.isArray(fonts) && fonts.length) {
    localStorage.setItem(fontCacheStorageKey, JSON.stringify({ fonts, savedAt: Date.now() }));
  }
}

function normalizeFontName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function getFontSuggestions(query) {
  const normalizedQuery = normalizeFontName(query);
  if (!installedFonts.length) return [];
  if (!normalizedQuery) return installedFonts.slice(0, 200);

  const startsWithMatches = [];
  const wordMatches = [];
  const containsMatches = [];

  for (const font of installedFonts) {
    const normalizedFont = normalizeFontName(font);
    if (normalizedFont.startsWith(normalizedQuery)) {
      startsWithMatches.push(font);
      continue;
    }
    if (normalizedFont.split(/\s+/).some((word) => word.startsWith(normalizedQuery))) {
      wordMatches.push(font);
      continue;
    }
    if (normalizedFont.includes(normalizedQuery)) containsMatches.push(font);
  }

  return [...startsWithMatches, ...wordMatches, ...containsMatches];
}

const fontMeasureCanvas = document.createElement('canvas');
const fontMeasureContext = fontMeasureCanvas.getContext('2d');
const fontWidthKinds = new Map();

function getFontWidthKind(font) {
  if (fontWidthKinds.has(font)) return fontWidthKinds.get(font);
  let kind = 'Variable-width';
  if (fontMeasureContext) {
    fontMeasureContext.font = `16px "${String(font).replace(/["'\\]/g, '')}"`;
    const narrowWidth = fontMeasureContext.measureText('iiiiiiii').width;
    const wideWidth = fontMeasureContext.measureText('WWWWWWWW').width;
    if (Math.abs(narrowWidth - wideWidth) < 0.5) kind = 'Fixed-width';
  }
  fontWidthKinds.set(font, kind);
  return kind;
}

function closeFontSuggestions(picker = null) {
  for (const current of (picker ? [picker] : fontPickers)) {
    const state = fontSuggestionStates.get(current.key);
    state.open = false;
    state.activeIndex = -1;
    current.suggestions.hidden = true;
    current.input.setAttribute('aria-expanded', 'false');
    current.input.removeAttribute('aria-activedescendant');
  }
}

function openFontSuggestions(picker) {
  const state = fontSuggestionStates.get(picker.key);
  if (!state.items.length) {
    closeFontSuggestions(picker);
    return;
  }
  fontPickers.filter((current) => current !== picker).forEach((current) => closeFontSuggestions(current));
  state.open = true;
  picker.suggestions.hidden = false;
  picker.input.setAttribute('aria-expanded', 'true');
}

function renderFontSuggestions(picker, items) {
  const state = fontSuggestionStates.get(picker.key);
  state.items = items;
  if (!items.length) {
    picker.suggestions.replaceChildren();
    closeFontSuggestions(picker);
    return;
  }

  const activeIndex = Math.min(state.activeIndex, items.length - 1);
  state.activeIndex = activeIndex;
  picker.suggestions.replaceChildren(...items.map((font, index) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.id = `${picker.key}-font-option-${index}`;
    option.className = 'font-suggestion';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(index === activeIndex));
    option.dataset.font = font;
    const name = document.createElement('span');
    name.textContent = font;
    const kind = document.createElement('small');
    kind.className = 'font-kind';
    kind.textContent = getFontWidthKind(font);
    option.append(name, kind);
    return option;
  }));

  if (activeIndex >= 0) picker.input.setAttribute('aria-activedescendant', `${picker.key}-font-option-${activeIndex}`);
  else picker.input.removeAttribute('aria-activedescendant');
  openFontSuggestions(picker);
}

function updateFontSuggestions(picker, query = picker.input.value) {
  const suggestions = getFontSuggestions(query);
  renderFontSuggestions(picker, suggestions);
  if (!installedFonts.length) {
    picker.status.textContent = 'Loading installed fonts...';
    return;
  }
  if (!normalizeFontName(query)) {
    picker.status.textContent = `${installedFonts.length.toLocaleString()} installed fonts available.`;
    return;
  }
  picker.status.textContent = `${suggestions.length.toLocaleString()} matches for "${query}".`;
}

function updateAllFontSuggestions() {
  fontPickers.forEach((picker) => updateFontSuggestions(picker));
}

function applySelectedFont(picker, font) {
  picker.input.value = font;
  preferences[picker.preference] = font.trim();
  applyPreferences();
  savePreferences();
  closeFontSuggestions(picker);
}

function moveFontSuggestion(picker, delta) {
  const state = fontSuggestionStates.get(picker.key);
  if (!state.items.length) return;
  if (!state.open) openFontSuggestions(picker);
  const lastIndex = state.items.length - 1;
  const nextIndex = state.activeIndex < 0
    ? (delta > 0 ? 0 : lastIndex)
    : (state.activeIndex + delta + state.items.length) % state.items.length;
  state.activeIndex = nextIndex;
  renderFontSuggestions(picker, state.items);
  document.getElementById(`${picker.key}-font-option-${nextIndex}`)?.scrollIntoView({ block: 'nearest' });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}

const allowedHtmlTags = new Set([
  'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'col', 'colgroup', 'dd', 'del', 'details', 'div', 'dl', 'dt',
  'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'input', 'kbd', 'li', 'mark', 'ol',
  'p', 'picture', 'pre', 's', 'section', 'small', 'source', 'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody',
  'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul'
]);
const allowedHtmlAttributes = new Set([
  'align', 'alt', 'aria-label', 'class', 'colspan', 'height', 'href', 'media', 'rel', 'rowspan', 'src', 'srcset',
  'checked', 'data-section-anchor', 'disabled', 'id', 'open', 'start', 'style', 'target', 'title', 'type', 'width'
]);
const allowedStyleProperties = new Set([
  'align-items', 'background', 'background-color', 'color', 'display', 'font-size', 'font-weight', 'height',
  'justify-content', 'margin', 'margin-bottom', 'margin-left', 'margin-right', 'margin-top', 'max-width', 'padding',
  'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'text-align', 'text-decoration', 'width'
]);
function isSafeUrl(value) {
  const url = String(value || '').trim();
  if (!url || /[\x00-\x1f\\]/.test(url) || url.startsWith('//')) return false;
  return /^(https?:|mailto:)/i.test(url) || !/^[a-z][a-z\d+.-]*:/i.test(url);
}

function resolveDocumentImage(value) {
  const base = currentDocument?.imageBase;
  if (!base || !value || /^(?:[a-z][a-z\d+.-]*:|[\\/]|#)/i.test(value)) return value;
  const path = value.replace(/%5c/gi, '/').replace(/\\/g, '/');
  try {
    const resolved = new URL(path, base);
    return resolved.origin === new URL(base).origin ? resolved.href : value;
  } catch {
    return value;
  }
}

function sanitizeStyle(value) {
  return String(value || '')
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separator = declaration.indexOf(':');
      if (separator < 1) return '';
      const property = declaration.slice(0, separator).trim().toLowerCase();
      const styleValue = declaration.slice(separator + 1).trim();
      if (!allowedStyleProperties.has(property)) return '';
      if (/url\s*\(|expression\s*\(|javascript:/i.test(styleValue)) return '';
      return `${property}: ${styleValue}`;
    })
    .filter(Boolean)
    .join('; ');
}

function sanitizeHtml(rawHtml) {
  const template = document.createElement('template');
  template.innerHTML = rawHtml;

  const cleanNode = (node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.remove();
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tagName = node.tagName.toLowerCase();
    if (!allowedHtmlTags.has(tagName)) {
      node.replaceWith(document.createTextNode(node.textContent || ''));
      return;
    }

    for (const attribute of [...node.attributes]) {
      const name = attribute.name.toLowerCase();
      let value = attribute.value;
      if (name.startsWith('on') || !allowedHtmlAttributes.has(name)) {
        node.removeAttribute(attribute.name);
        continue;
      }
      if (tagName === 'img' && name === 'src') value = resolveDocumentImage(value);
      if ((name === 'href' || name === 'src') && !isSafeUrl(value)) {
        node.removeAttribute(attribute.name);
        continue;
      }
      if (tagName === 'img' && name === 'src') {
        node.setAttribute('src', value);
      }
      if (name === 'srcset' && /javascript:/i.test(value)) {
        node.removeAttribute(attribute.name);
        continue;
      }
      if (name === 'style') {
        const cleanStyle = sanitizeStyle(value);
        if (cleanStyle) node.setAttribute('style', cleanStyle);
        else node.removeAttribute(attribute.name);
      }
    }

    if (tagName === 'input') {
      if (node.getAttribute('type') !== 'checkbox') node.remove();
      else node.disabled = true;
    }
    if (tagName === 'a' && !node.getAttribute('href')?.startsWith('#')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  };

  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(cleanNode);
  return template.innerHTML;
}

const inlineCodePattern = /(?<![\\\x60])(\x60+)(?!\x60)([^\n]*?)(?<!\x60)\1(?!\x60)/g;
const inlineHtmlPattern = /<\/?[a-z][\w:-]*(?=[ \t/>])[^>\n]*>/gi;

function withoutInlineCode(text) {
  return text.replace(inlineCodePattern, (code) => ' '.repeat(code.length));
}

function readInlineAssets(text) {
  const pattern = /\[!\[([^\]\n]*)\]\((https?:\/\/[^\s)]+)\)\]\((https?:\/\/[^\s)]+)\)|(!?)\[([^\]\n]*)\]\((https?:\/\/[^\s)]+)\)/dg;
  return [...withoutInlineCode(text).matchAll(pattern)].flatMap((match) => {
    const [, , imageUrl, linkUrl, image, label, url] = match;
    const range = { start: match.index, end: match.index + match[0].length };
    if (linkUrl) return [{ ...range, type: 'linked-image', label: text.slice(...match.indices[1]), imageUrl, url: linkUrl }];
    return image || label ? [{ ...range, type: image ? 'image' : 'link', label: text.slice(...match.indices[5]), url }] : [];
  });
}

function tableCellRanges(line) {
  let from = line.length - line.trimStart().length;
  let to = line.trimEnd().length;
  if (line[from] === '|') from += 1;
  if (line[to - 1] === '|' && (line.slice(0, to - 1).match(/\\+$/)?.[0].length || 0) % 2 === 0) to -= 1;
  const cells = [];
  let start = from;
  const addCell = (end) => {
    const cell = line.slice(start, end);
    const left = start + cell.length - cell.trimStart().length;
    cells.push({ start: left, end: Math.max(left, start + cell.trimEnd().length), fieldStart: start, fieldEnd: end });
    start = end + 1;
  };
  let escaped = false;
  for (let i = from; i < to; i += 1) {
    const char = line[i];
    if (char === '|' && !escaped) {
      addCell(i);
    }
    escaped = char === '\\' && !escaped;
  }
  addCell(to);
  return cells;
}

function splitTableRow(line) {
  return tableCellRanges(line).map(({ start, end }) => line.slice(start, end));
}

function readListItem(line) {
  const item = line.match(/^([ \t]*)([-+*]|\d+[.)])([ \t]+)(?:(\[[ xX]\])([ \t]+))?(.+)$/);
  if (!item) return null;
  const [, indent, marker, spacing, task, taskSpacing, body] = item;
  const prefix = indent + marker + spacing;
  if (task && /^\d/.test(marker)) return { indent, marker, prefix, body: line.slice(prefix.length), bodyStart: prefix.length };
  return { indent, marker, prefix, task, taskSpacing, body, bodyStart: line.length - body.length };
}

function readCodeFence(line, opening = '') {
  const match = line.match(/^(\x60{3,}|~{3,})(.*)$/);
  if (!match) return null;
  const [, delimiter, info] = match;
  if (opening) {
    return delimiter[0] === opening[0] && delimiter.length >= opening.length && !info.trim() ? match : null;
  }
  return delimiter[0] === '\x60' && info.includes('\x60') ? null : match;
}

const markdownParser = window.markdownit({ html: true, linkify: true, maxNesting: 100 })
  .use(window.markdownitFootnote);

markdownParser.renderer.rules.softbreak = () => ' ';
markdownParser.renderer.rules.fence = (tokens, index) =>
  '<pre><code>' + escapeHtml(tokens[index].content.replace(/\n$/, '')) + '</code></pre>\n';

function decorateMarkdown(tokens, lines) {
  const aliases = new Map();
  const usedIds = new Set();
  for (const token of tokens) {
    if (token.type !== 'inline') continue;
    const children = token.children;
    for (let index = 0; index < children.length - 2; index += 1) {
      const link = children[index];
      const label = children[index + 1];
      const href = link.type === 'link_open' && link.attrGet('href');
      if (href && /^#[\w-]+$/.test(href) && label.type === 'text' && children[index + 2].type === 'link_close') {
        aliases.set(label.content.toLowerCase(), href.slice(1));
      }
    }
  }

  for (const [index, token] of tokens.entries()) {
    if (token.type === 'heading_open') {
      const text = tokens[index + 1].children.map(({ type, content }) =>
        ['text', 'code_inline', 'image'].includes(type) ? content : '').join('').trim().toLowerCase();
      const slug = text.replace(/[^\p{L}\p{N}_ -]/gu, '').replace(/\s+/g, '-');
      const section = text.match(/^(\d+)\.\s/);
      const base = aliases.get(text) || slug || 'section';
      let id = base;
      for (let suffix = 1; usedIds.has(id); suffix += 1) id = base + '-' + suffix;
      usedIds.add(id);
      token.attrSet('id', id);
      if (section) {
        const shortId = 'section-' + section[1];
        if (!usedIds.has(shortId)) {
          usedIds.add(shortId);
          token.attrSet('data-section-anchor', shortId);
        }
      }
    }

    if (token.type !== 'list_item_open' || !token.map) continue;
    const item = readListItem(lines[token.map[0]]);
    const inline = tokens[index + 2];
    const text = inline?.children?.[0];
    if (!item?.task || tokens[index + 1]?.type !== 'paragraph_open' || text?.type !== 'text'
        || !text.content.startsWith(item.task)) continue;
    token.attrJoin('class', 'markdown-task');
    text.content = text.content.slice(item.task.length).trimStart();
    const checkbox = Object.assign(new token.constructor('html_inline', '', 0), {
      content: '<input type="checkbox" aria-label="Task" disabled'
        + (item.task === '[ ]' ? '' : ' checked') + '> '
    });
    inline.children.unshift(checkbox);
  }
}

function parseMarkdown(markdown, describeBlocks = false) {
  const source = markdown.replace(/\r\n?/g, '\n');
  const lines = source.split('\n');
  const env = {};
  const tokens = markdownParser.parse(source, env);
  decorateMarkdown(tokens, lines);
  const render = (group) => sanitizeHtml(markdownParser.renderer.render(group, markdownParser.options, env)).trim();
  if (!describeBlocks) return render(tokens);

  let offset = 0;
  const offsets = lines.map((line) => {
    const start = offset;
    offset += line.length + 1;
    return start;
  });
  const blocks = [];
  let nextLine = 0;
  const add = (startLine, endLine, kind, html) => {
    const start = offsets[startLine] ?? source.length;
    const end = Math.max(start, (offsets[endLine] ?? offset) - 1);
    blocks.push({ kind, start, end, source: source.slice(start, end), html });
  };
  const addDefinitions = (endLine) => {
    if (lines.slice(nextLine, endLine).some((line) => line.trim())) {
      add(nextLine, endLine, 'definitions', '<div hidden></div>');
    }
  };
  for (let first = 0; first < tokens.length;) {
    const token = tokens[first];
    let last = first + 1;
    if (token.nesting === 1) {
      let nesting = 1;
      while (nesting && last < tokens.length) nesting += tokens[last++].nesting;
    }
    if (token.type === 'footnote_block_open') {
      add(nextLine, lines.length, 'footnotes', render(tokens.slice(first, last)));
      return blocks;
    }
    if (token.map) {
      const start = token.map[0];
      let end = token.map[1];
      addDefinitions(start);
      let kind = '';
      if (token.type === 'fence') kind = 'code';
      else if (token.type === 'table_open') kind = 'table';
      else if (token.type === 'html_block') {
        kind = 'html';
        // Keep Markdown between the two halves of a raw container inside the same
        // protected Visual block. The reader renders the full token stream at once.
        const open = token.content.match(/^\s*<(div|details|figure)\b/i);
        if (open) {
          const tags = new RegExp('<(/?)' + open[1] + '\\b[^>]*>', 'gi');
          const balance = (html) => [...html.matchAll(tags)].reduce((depth, match) =>
            depth + (match[1] ? -1 : match[0].endsWith('/>') ? 0 : 1), 0);
          let depth = balance(token.content);
          for (let cursor = last; depth > 0 && cursor < tokens.length; cursor += 1) {
            const closing = tokens[cursor];
            if (closing.type !== 'html_block' || closing.level !== 0) continue;
            depth += balance(closing.content);
            if (depth <= 0) {
              last = cursor + 1;
              end = closing.map[1];
            }
          }
        }
      }
      else if (['bullet_list_open', 'ordered_list_open'].includes(token.type)) {
        while (end > start && !lines[end - 1].trim()) end -= 1;
        const itemCount = tokens.slice(first, last).filter((entry) => entry.type === 'list_item_open').length;
        kind = itemCount === end - start && lines.slice(start, end).every((line) => readListItem(line))
          ? 'list' : 'complex';
      } else if (token.type === 'code_block' || token.markup === '=' || token.markup === '-'
          || (token.type === 'blockquote_open' && tokens.slice(first + 1, last - 1).some((entry) => entry.block &&
            !['paragraph_open', 'paragraph_close', 'inline'].includes(entry.type)))) kind = 'complex';
      add(start, end, kind, render(tokens.slice(first, last)));
      nextLine = end;
    }
    first = last;
  }
  addDefinitions(lines.length);
  return blocks;
}

document.addEventListener('click', (event) => {
  const link = event.target.closest?.('.markdown-body a[href^="#"]');
  if (!link) return;
  const container = link.closest('.markdown-body');
  let fragment;
  try {
    fragment = CSS.escape(decodeURIComponent(link.getAttribute('href').slice(1)));
  } catch {
    return;
  }
  if (!fragment) return;
  const target = container.querySelector('#' + fragment)
    || container.querySelector('[data-section-anchor=' + fragment + ']');
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ block: 'start' });
});



function syncPictureSourcesToTheme(container = elements.markdownOutput, theme = preferences.theme) {
  container.querySelectorAll('picture source[media]').forEach((source) => {
    const originalMedia = source.dataset.markdownVisionMedia || source.getAttribute('media') || '';
    source.dataset.markdownVisionMedia = originalMedia;
    const colorScheme = originalMedia.match(/prefers-color-scheme\s*:\s*(dark|light)/i)?.[1]?.toLowerCase();
    if (!colorScheme) return;

    const backgroundElement = source.closest('picture')?.parentElement?.closest('[style*="background"]');
    const background = backgroundElement ? getComputedStyle(backgroundElement).backgroundColor : '';
    const channels = background.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number);
    const backgroundTheme = channels && channels.length === 3
      ? ((channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000 > 160 ? 'light' : 'dark')
      : theme;
    source.media = colorScheme === backgroundTheme ? 'all' : 'not all';
  });
}

function editorSearch() {
  return document.body.classList.contains('is-editing') ? window.markdownVisionEditorSearch : null;
}

function clearSearchHighlights() {
  elements.markdownOutput.querySelectorAll('mark.search-highlight').forEach((highlight) => {
    highlight.replaceWith(document.createTextNode(highlight.textContent || ''));
  });
  elements.markdownOutput.normalize();
  searchMatchCount = 0;
  activeSearchMatchIndex = -1;
}

function updateSearchCount() {
  const hasQuery = Boolean(elements.searchInput.value.trim());
  const label = searchMatchCount === 1 ? 'match' : 'matches';
  const scope = editorSearch()?.scope(activeSearchMatchIndex);
  elements.searchCount.textContent = searchMatchCount && activeSearchMatchIndex >= 0
    ? `${(activeSearchMatchIndex + 1).toLocaleString()} of ${searchMatchCount.toLocaleString()}${scope ? ' · ' + scope : ''}`
    : `${searchMatchCount.toLocaleString()} ${label}`;
  elements.previousSearchMatch.disabled = !hasQuery || searchMatchCount < 1;
  elements.nextSearchMatch.disabled = !hasQuery || searchMatchCount < 1;
}

function getSearchHighlights() {
  return [...elements.markdownOutput.querySelectorAll('mark.search-highlight')];
}

function setActiveSearchMatch(index, options = {}) {
  const editing = editorSearch();
  if (editing) {
    activeSearchMatchIndex = searchMatchCount ? (index + searchMatchCount) % searchMatchCount : -1;
    editing.show(activeSearchMatchIndex, options.scroll !== false);
    updateSearchCount();
    return;
  }
  const highlights = getSearchHighlights();
  if (!highlights.length) {
    activeSearchMatchIndex = -1;
    updateSearchCount();
    return;
  }

  const nextIndex = (index + highlights.length) % highlights.length;
  highlights.forEach((highlight, highlightIndex) => {
    highlight.classList.toggle('is-active', highlightIndex === nextIndex);
  });
  activeSearchMatchIndex = nextIndex;
  updateSearchCount();
  if (options.scroll !== false) {
    highlights[nextIndex].scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

function moveSearchMatch(delta) {
  if (editorSearch()?.isStale()) runSearch({ preserve: true, scroll: false });
  if (!searchMatchCount) return;
  const startIndex = activeSearchMatchIndex >= 0 ? activeSearchMatchIndex : 0;
  setActiveSearchMatch(startIndex + delta);
}

function highlightTextNode(node, query) {
  const text = node.nodeValue || '';
  const lowerText = text.toLocaleLowerCase();
  const lowerQuery = query.toLocaleLowerCase();
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  let index = lowerText.indexOf(lowerQuery);

  while (index !== -1) {
    if (index > cursor) fragment.append(document.createTextNode(text.slice(cursor, index)));
    const mark = document.createElement('mark');
    mark.className = 'search-highlight';
    mark.textContent = text.slice(index, index + query.length);
    fragment.append(mark);
    searchMatchCount += 1;
    cursor = index + query.length;
    index = lowerText.indexOf(lowerQuery, cursor);
  }

  if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
  node.replaceWith(fragment);
}

function runSearch(options = {}) {
  clearSearchHighlights();
  const query = elements.searchInput.value.trim();
  const editing = editorSearch();
  if (editing) {
    const { count, index } = editing.find(query, options.preserve === true);
    searchMatchCount = count;
    setActiveSearchMatch(index, options);
    return;
  }
  window.markdownVisionEditorSearch?.clear();
  if (!query) {
    updateSearchCount();
    return;
  }

  const walker = document.createTreeWalker(elements.markdownOutput, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest('script, style, mark.search-highlight')) return NodeFilter.FILTER_REJECT;
      return node.nodeValue?.toLocaleLowerCase().includes(query.toLocaleLowerCase())
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    }
  });
  const matches = [];
  while (walker.nextNode()) matches.push(walker.currentNode);
  matches.forEach((node) => highlightTextNode(node, query));
  setActiveSearchMatch(0);
}

function closeSearchPanel() {
  elements.searchPanel.hidden = true;
  elements.searchButton.setAttribute('aria-expanded', 'false');
  elements.searchInput.value = '';
  clearSearchHighlights();
  window.markdownVisionEditorSearch?.clear();
  updateSearchCount();
}

function openSearchPanel() {
  elements.searchPanel.hidden = false;
  elements.searchButton.setAttribute('aria-expanded', 'true');
  elements.settingsPanel.hidden = true;
  elements.settingsButton.setAttribute('aria-expanded', 'false');
  closeFontSuggestions();
  elements.searchInput.focus();
  elements.searchInput.select();
  if (editorSearch()) runSearch({ preserve: true });
}

function showDocument(markdown, name = 'Untitled.md', documentId = null, imageBase = '') {
  currentDocument = { content: markdown, name, documentId, imageBase };
  renderedForPrint = null;
  clearSearchHighlights();
  elements.markdownOutput.innerHTML = parseMarkdown(markdown);
  syncPictureSourcesToTheme();
  elements.fileName.textContent = name;
  document.title = `Markdown Vision - ${name}`;
  elements.readerShell.hidden = false;
  document.dispatchEvent(new CustomEvent('markdownvision:documentchanged', { detail: { ...currentDocument } }));
  updatePrintButton();
  if (elements.searchInput.value.trim()) runSearch();
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

function printableDocument() {
  return window.markdownVisionReader?.getPrintDraft?.() || currentDocument;
}

function updatePrintButton() {
  const draft = printableDocument();
  elements.printButton.disabled = printPreparing || !draft?.content.trim();
  if (!printPreparing && printSnapshot && printSnapshot.content !== draft?.content) printSnapshot = null;
}

function renderPrintDocument(document) {
  const markdown = document?.content || '';
  if (markdown === renderedForPrint) return;
  renderedForPrint = markdown;
  const target = elements.printDocument;
  target.innerHTML = parseMarkdown(markdown);
  target.querySelectorAll('details').forEach((details) => { details.open = true; });
  target.querySelectorAll('img').forEach((image) => { image.loading = 'eager'; });
  syncPictureSourcesToTheme(target, 'light');
}

async function printCurrentDocument() {
  const draft = printableDocument();
  if (printPreparing || !draft?.content.trim() || $('#visualEditDialog').open) return;
  printPreparing = true;
  printSnapshot = draft;
  clearTimeout(printStatusTimer);
  elements.printStatus.hidden = true;
  updatePrintButton();
  let timeout;
  try {
    renderPrintDocument(draft);
    const images = [...elements.printDocument.querySelectorAll('img')];
    await Promise.race([
      Promise.allSettled([document.fonts?.ready, ...images.map((image) => image.decode())]),
      new Promise((resolve) => { timeout = setTimeout(resolve, 2000); })
    ]);
    if (window.desktop?.printMarkdown) {
      if (!await window.desktop.printMarkdown()) throw new Error('The native print dialog could not open.');
    } else {
      window.print();
    }
  } catch {
    printSnapshot = null;
    elements.printStatus.textContent = 'Windows could not open the print dialog.';
    elements.printStatus.hidden = false;
    printStatusTimer = setTimeout(() => { elements.printStatus.hidden = true; }, 6000);
  } finally {
    clearTimeout(timeout);
    printPreparing = false;
    updatePrintButton();
  }
}

window.addEventListener('beforeprint', () => renderPrintDocument(printSnapshot || printableDocument()));
window.addEventListener('afterprint', () => { printSnapshot = null; });

// The editor uses the same renderer and document source as the reader.
window.markdownVisionReader = {
  getDocument: () => currentDocument ? { ...currentDocument } : null,
  render: (markdown) => parseMarkdown(markdown),
  renderBlocks: (markdown) => parseMarkdown(markdown, true),
  readCodeFence,
  readListItem,
  tableCellRanges,
  readInlineAssets,
  withoutInlineCode,
  printDocument: printCurrentDocument,
  updatePrintButton,
  refreshEditorSearch(options) {
    if (!elements.searchPanel.hidden) runSearch(options);
  },
  syncPictureSourcesToTheme,
  showDocument
};

async function openPicker() {
  if (window.markdownVisionReader.isSaving?.()) return;
  if (window.desktop?.openMarkdownFile) {
    const document = await window.desktop.openMarkdownFile();
    if (document) showDocument(document.content, document.name, document.documentId, document.imageBase);
    return;
  }
  elements.fileInput.click();
}

elements.openButton.addEventListener('click', openPicker);
elements.printButton.addEventListener('click', printCurrentDocument);
elements.searchButton.addEventListener('click', () => {
  if (elements.searchPanel.hidden) openSearchPanel();
  else closeSearchPanel();
});
elements.closeSearch.addEventListener('click', closeSearchPanel);
elements.searchInput.addEventListener('input', runSearch);
elements.searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeSearchPanel();
    elements.searchButton.focus();
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    moveSearchMatch(event.shiftKey ? -1 : 1);
  }
});
elements.previousSearchMatch.addEventListener('click', () => moveSearchMatch(-1));
elements.nextSearchMatch.addEventListener('click', () => moveSearchMatch(1));
elements.fileInput.addEventListener('change', async () => {
  const file = elements.fileInput.files[0];
  if (!file) return;
  showDocument(await file.text(), file.name);
  elements.fileInput.value = '';
});

elements.themeButton.addEventListener('click', () => {
  preferences.theme = preferences.theme === 'light' ? 'dark' : 'light';
  applyPreferences(); savePreferences();
});
elements.settingsButton.addEventListener('click', () => {
  elements.settingsPanel.hidden = !elements.settingsPanel.hidden;
  elements.settingsButton.setAttribute('aria-expanded', String(!elements.settingsPanel.hidden));
  if (!elements.settingsPanel.hidden) {
    elements.searchPanel.hidden = true;
    elements.searchButton.setAttribute('aria-expanded', 'false');
    void loadSystemFonts().then(updateAllFontSuggestions);
  }
  else closeFontSuggestions();
});
elements.closeSettings.addEventListener('click', () => {
  elements.settingsPanel.hidden = true;
  elements.settingsButton.setAttribute('aria-expanded', 'false');
  closeFontSuggestions();
});
document.addEventListener('click', (event) => {
  if (!elements.settingsPanel.hidden && !elements.settingsPanel.contains(event.target) && !elements.settingsButton.contains(event.target)) {
    elements.settingsPanel.hidden = true;
    elements.settingsButton.setAttribute('aria-expanded', 'false');
    closeFontSuggestions();
  }
  if (!elements.searchPanel.hidden && !elements.searchPanel.contains(event.target) && !elements.searchButton.contains(event.target)) {
    elements.searchPanel.hidden = true;
    elements.searchButton.setAttribute('aria-expanded', 'false');
  }
});

function bindFontPicker(picker) {
  picker.input.addEventListener('input', () => {
    preferences[picker.preference] = picker.input.value.trim();
    updateFontSuggestions(picker);
    applyFontStyle(picker.preference);
    savePreferences();
  });
  picker.input.addEventListener('focus', () => {
    void loadSystemFonts().then(() => updateFontSuggestions(picker));
  });
  picker.input.addEventListener('keydown', (event) => {
    const state = fontSuggestionStates.get(picker.key);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveFontSuggestion(picker, event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Enter' && state.open && state.activeIndex >= 0) {
      event.preventDefault();
      applySelectedFont(picker, state.items[state.activeIndex]);
      return;
    }
    if (event.key === 'Escape' && state.open) {
      event.preventDefault();
      closeFontSuggestions(picker);
    }
  });
  picker.suggestions.addEventListener('mousedown', (event) => {
    event.preventDefault();
    const option = event.target.closest('.font-suggestion');
    if (!option) return;
    applySelectedFont(picker, option.dataset.font || '');
  });
}

fontPickers.forEach(bindFontPicker);
elements.fontSize.addEventListener('input', () => { preferences.size = elements.fontSize.value; applyPreferences(); savePreferences(); });
elements.lineHeight.addEventListener('input', () => { preferences.line = elements.lineHeight.value; applyPreferences(); savePreferences(); });
elements.readingWidth.addEventListener('input', () => { preferences.width = elements.readingWidth.value; applyPreferences(); savePreferences(); });

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'p') {
    event.preventDefault();
    if (!event.repeat) void printCurrentDocument();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
    event.preventDefault();
    openPicker();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
    event.preventDefault();
    openSearchPanel();
  }
});
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  if (!event.target.closest('.font-picker')) closeFontSuggestions();
});

async function loadSystemFonts() {
  if (fontLoadPromise) return fontLoadPromise;
  if (!window.desktop?.listSystemFonts) return;
  fontLoadPromise = (async () => {
    const cachedFonts = readCachedFonts();
    if (cachedFonts?.length) {
      installedFonts = [...new Set(cachedFonts)].sort((a, b) => a.localeCompare(b));
      updateAllFontSuggestions();
    }
    try {
      const fonts = await window.desktop.listSystemFonts();
      if (!Array.isArray(fonts) || fonts.length === 0) {
        installedFonts = [];
        elements.fontStatus.textContent = 'Enter the name of any installed font.';
        return null;
      }
      installedFonts = [...new Set(fonts)].sort((a, b) => a.localeCompare(b));
      updateAllFontSuggestions();
      writeCachedFonts(fonts);
      return fonts;
    } catch {
      elements.fontStatus.textContent = 'Enter the name of any installed font.';
      return null;
    }
  })();
  return fontLoadPromise;
}

if (window.desktop?.onOpenDocument) {
  window.desktop.onOpenDocument((document) => showDocument(document.content, document.name, document.documentId, document.imageBase));
}

if (window.desktop?.onFullscreenChange) {
  window.desktop.onFullscreenChange((isFullscreen) => {
    document.body.classList.toggle('is-fullscreen', Boolean(isFullscreen));
  });
}

applyPreferences();
void loadPreferences();

window.addEventListener('load', async () => {
  const initialDocument = await window.desktop?.getInitialDocument?.();
  if (currentDocument) return;
  if (initialDocument) showDocument(initialDocument.content, initialDocument.name, initialDocument.documentId, initialDocument.imageBase);
  else $('#editorToggle').click();
});
