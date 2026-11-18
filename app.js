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
  'a', 'abbr', 'b', 'br', 'caption', 'cite', 'code', 'col', 'colgroup', 'dd', 'del', 'details', 'div', 'dl', 'dt',
  'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'kbd', 'li', 'mark', 'ol',
  'p', 'picture', 'pre', 's', 'small', 'source', 'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody',
  'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul'
]);
const allowedHtmlAttributes = new Set([
  'align', 'alt', 'aria-label', 'class', 'colspan', 'height', 'href', 'media', 'rel', 'rowspan', 'src', 'srcset',
  'style', 'target', 'title', 'width'
]);
const allowedStyleProperties = new Set([
  'align-items', 'background', 'background-color', 'color', 'display', 'font-size', 'font-weight', 'height',
  'justify-content', 'margin', 'margin-bottom', 'margin-left', 'margin-right', 'margin-top', 'max-width', 'padding',
  'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'text-align', 'text-decoration', 'width'
]);
const htmlBlockTags = new Set([
  'blockquote', 'details', 'div', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'ol', 'p', 'pre', 'table', 'ul'
]);

function isSafeUrl(value) {
  return /^(https?:|mailto:|#|\/(?!\/))/i.test(String(value || '').trim());
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
      const value = attribute.value;
      if (name.startsWith('on') || !allowedHtmlAttributes.has(name)) {
        node.removeAttribute(attribute.name);
        continue;
      }
      if ((name === 'href' || name === 'src') && !isSafeUrl(value)) {
        node.removeAttribute(attribute.name);
        continue;
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

    if (tagName === 'a') {
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

function sanitizeInlineHtmlTag(rawTag) {
  const closing = rawTag.match(/^<\/\s*([a-z][\w:-]*)\s*>$/i);
  if (closing) {
    const tagName = closing[1].toLowerCase();
    return allowedHtmlTags.has(tagName) ? `</${tagName}>` : '';
  }

  const template = document.createElement('template');
  template.innerHTML = rawTag;
  const element = template.content.firstElementChild;
  if (!element) return '';

  const tagName = element.tagName.toLowerCase();
  if (!allowedHtmlTags.has(tagName)) return '';

  const attributes = [];
  for (const attribute of [...element.attributes]) {
    const name = attribute.name.toLowerCase();
    let value = attribute.value;
    if (name.startsWith('on') || !allowedHtmlAttributes.has(name)) continue;
    if ((name === 'href' || name === 'src') && !isSafeUrl(value)) continue;
    if (name === 'srcset' && /javascript:/i.test(value)) continue;
    if (name === 'style') {
      value = sanitizeStyle(value);
      if (!value) continue;
    }
    attributes.push(`${name}="${escapeHtml(value)}"`);
  }

  if (tagName === 'a') {
    attributes.push('target="_blank"', 'rel="noopener noreferrer"');
  }

  const suffix = ['br', 'col', 'hr', 'img', 'source'].includes(tagName) ? ' />' : '>';
  return `<${tagName}${attributes.length ? ` ${attributes.join(' ')}` : ''}${suffix}`;
}

function createHtmlTokenStore() {
  const values = [];
  return {
    add(html) {
      const token = `\u0000HTML_${values.length}\u0000`;
      values.push(html);
      return token;
    },
    restore(text) {
      return text.replace(/\u0000HTML_(\d+)\u0000/g, (_match, index) => values[Number(index)] || '');
    }
  };
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

function inlineMarkdown(text, htmlTokens = createHtmlTokenStore(), inTable = false) {
  const code = text.replace(inlineCodePattern, (_match, _delimiter, value) => {
    const literal = inTable ? value.replace(/\\\|/g, '|') : value;
    const body = literal.startsWith(' ') && literal.endsWith(' ') && literal.trim() ? literal.slice(1, -1) : literal;
    return htmlTokens.add('<code>' + escapeHtml(body) + '</code>');
  });
  // Keep escaped punctuation literal until after inline formatting.
  const escaped = code.replace(/\\([\\\x60*_[\]{}()#+\-.!|<>~])/g,
    (_match, character) => htmlTokens.add(escapeHtml(character)));
  const protectedText = escaped.replace(inlineHtmlPattern, (tag) => htmlTokens.add(sanitizeInlineHtmlTag(tag)));
  let encoded = escapeHtml(protectedText);
  for (const asset of readInlineAssets(encoded).reverse()) {
    if (asset.type !== 'linked-image' || [asset.url, asset.imageUrl, asset.label].some((value) => value.includes('\u0000'))) continue;
    const badge = '<a href="' + asset.url + '" target="_blank" rel="noopener noreferrer"><img src="'
      + asset.imageUrl + '" alt="' + asset.label + '" loading="lazy"></a>';
    encoded = encoded.slice(0, asset.start) + htmlTokens.add(badge) + encoded.slice(asset.end);
  }
  const rendered = encoded
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return htmlTokens.restore(rendered);
}

function getHtmlBlockTag(line) {
  const match = line.trim().match(/^<([a-z][\w:-]*)(?:\s|>|\/>)/i);
  if (!match) return null;
  const tagName = match[1].toLowerCase();
  return htmlBlockTags.has(tagName) ? tagName : null;
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

function isTableDivider(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseTable(lines, startIndex, htmlTokens) {
  if (!lines[startIndex]?.includes('|') || !isTableDivider(lines[startIndex + 1] || '')) return null;
  const headers = splitTableRow(lines[startIndex]);
  const alignments = splitTableRow(lines[startIndex + 1]).map((cell) => {
    const value = cell.trim();
    if (value.startsWith(':') && value.endsWith(':')) return 'center';
    if (value.endsWith(':')) return 'right';
    return 'left';
  });
  const rows = [];
  let index = startIndex + 2;
  while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
    rows.push(splitTableRow(lines[index]));
    index += 1;
  }

  const renderCell = (tag, cell, columnIndex) => {
    const alignment = alignments[columnIndex] || 'left';
    const style = alignment === 'left' ? '' : ` style="text-align: ${alignment}"`;
    return `<${tag}${style}>${inlineMarkdown(cell || '', htmlTokens, true)}</${tag}>`;
  };

  const thead = `<thead><tr>${headers.map((cell, columnIndex) => renderCell('th', cell, columnIndex)).join('')}</tr></thead>`;
  const tbody = rows.length
    ? `<tbody>${rows.map((row) => `<tr>${headers.map((_header, columnIndex) => renderCell('td', row[columnIndex] || '', columnIndex)).join('')}</tr>`).join('')}</tbody>`
    : '';
  return { html: `<table>${thead}${tbody}</table>`, nextIndex: index };
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

function parseMarkdown(markdown, describeBlocks = false) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  let offset = 0;
  const offsets = describeBlocks ? lines.map((line) => {
    const start = offset;
    offset += line.length + 1;
    return start;
  }) : null;
  const htmlTokens = createHtmlTokenStore();
  const output = [];
  let paragraph = [], listType = null, listStart = '', fence = '', code = [], quote = [], items = [];
  let start = 0;
  const emit = (html, end, kind = '') => output.push(describeBlocks
    ? { html, source: lines.slice(start, end).join('\n'), kind, start: offsets[start],
        end: (offsets[end] ?? offset) - 1 }
    : html);
  const flushParagraph = (end) => {
    if (!paragraph.length) return;
    const text = paragraph.map((line, index) => {
      if (index === paragraph.length - 1) return line.trim();
      return line.trim() + (/ {2,}$/.test(line) ? '<br>' : ' ');
    }).join('');
    emit(`<p>${inlineMarkdown(text, htmlTokens)}</p>`, end);
    paragraph = [];
  };
  const closeList = (end) => {
    if (!listType) return;
    const attributes = listType === 'ol' && listStart !== '1' ? ` start="${listStart}"` : '';
    emit(`<${listType}${attributes}>\n${items.join('\n')}\n</${listType}>`, end, 'list');
    listType = null;
    items = [];
  };
  const flushQuote = (end) => { if (quote.length) { emit(`<blockquote>${inlineMarkdown(quote.join('<br>'), htmlTokens)}</blockquote>`, end); quote = []; } };
  const flush = (end) => { flushParagraph(end); closeList(end); flushQuote(end); };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const delimiter = readCodeFence(line, fence)?.[1];
    if (fence) {
      if (delimiter) {
        emit(`<pre><code>${code.join('\n')}</code></pre>`, index + 1, 'code');
        code = [];
        fence = '';
      } else code.push(escapeHtml(line));
      continue;
    }
    if (delimiter) {
      flush(index);
      start = index;
      fence = delimiter;
      continue;
    }

    const htmlBlockTag = getHtmlBlockTag(line);
    if (htmlBlockTag) {
      flush(index);
      start = index;
      const htmlBlock = [line];
      if (!line.includes(`</${htmlBlockTag}>`) && !/\/>\s*$/.test(line.trim())) {
        while (index + 1 < lines.length) {
          index += 1;
          htmlBlock.push(lines[index]);
          if (lines[index].toLowerCase().includes(`</${htmlBlockTag}>`)) break;
        }
      }
      emit(sanitizeHtml(htmlBlock.join('\n')), index + 1, 'html');
      continue;
    }

    const table = parseTable(lines, index, htmlTokens);
    if (table) {
      flush(index);
      start = index;
      emit(table.html, table.nextIndex, 'table');
      index = table.nextIndex - 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const item = readListItem(line);
    const quoted = line.match(/^>\s?(.*)$/);
    if (heading) {
      flush(index);
      start = index;
      const level = heading[1].length;
      emit(`<h${level}>${inlineMarkdown(heading[2], htmlTokens)}</h${level}>`, index + 1);
    }
    else if (item) {
      flushParagraph(index); flushQuote(index); const type = /^\d/.test(item.marker) ? 'ol' : 'ul';
      if (listType !== type) { closeList(index); start = index; listType = type; listStart = item.marker.slice(0, -1); }
      const task = item.task;
      const checkbox = task ? `<input type="checkbox" aria-label="Task" disabled${task === '[ ]' ? '' : ' checked'}> ` : '';
      items.push(`<li${task ? ' class="markdown-task"' : ''}>${checkbox}${inlineMarkdown(item.body, htmlTokens)}</li>`);
    }
    else if (quoted) {
      flushParagraph(index); closeList(index);
      if (!quote.length) start = index;
      quote.push(quoted[1]);
    }
    else if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) { flush(index); start = index; emit('<hr>', index + 1); }
    else if (!line.trim()) flush(index);
    else {
      closeList(index); flushQuote(index);
      if (!paragraph.length) start = index;
      paragraph.push(line);
    }
  }
  if (fence) emit(`<pre><code>${code.join('\n')}</code></pre>`, lines.length, 'code');
  flush(lines.length);
  return describeBlocks ? output : output.join('\n');
}

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

function showDocument(markdown, name = 'Untitled.md', documentId = null) {
  currentDocument = { content: markdown, name, documentId };
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
    if (document) showDocument(document.content, document.name, document.documentId);
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
  window.desktop.onOpenDocument((document) => showDocument(document.content, document.name, document.documentId));
}

if (window.desktop?.onFullscreenChange) {
  window.desktop.onFullscreenChange((isFullscreen) => {
    document.body.classList.toggle('is-fullscreen', Boolean(isFullscreen));
  });
}

applyPreferences();
void loadPreferences();

if (window.desktop?.getInitialDocument) {
  void window.desktop.getInitialDocument().then((document) => {
    if (document) showDocument(document.content, document.name, document.documentId);
  });
}
