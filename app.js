const root = document.documentElement;
const $ = (selector) => document.querySelector(selector);

const elements = {
  openButton: $('#openButton'),
  fileInput: $('#fileInput'),
  settingsButton: $('#settingsButton'),
  settingsPanel: $('#settingsPanel'),
  closeSettings: $('#closeSettings'),
  themeButton: $('#themeButton'),
  fontInput: $('#fontInput'),
  fontSuggestions: $('#fontSuggestions'),
  fontStatus: $('#fontStatus'),
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
const defaults = { theme: 'light', font: 'Georgia', size: '18', line: '1.75', width: '720' };
const preferenceStorageKey = 'markdown-vision-preferences';
const fontCacheStorageKey = 'markdown-vision-font-cache';
const fontCacheTtlMs = 7 * 24 * 60 * 60 * 1000;
const storedPreferences = readLocalPreferences();
const preferences = { ...defaults, ...JSON.parse(storedPreferences) };
preferences.font = legacyFonts[preferences.font] || preferences.font;
let fontLoadPromise = null;
let installedFonts = [];
let fontSuggestionState = { items: [], activeIndex: -1, open: false };

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

function applyPreferences() {
  root.dataset.theme = preferences.theme;
  const safeFont = String(preferences.font || defaults.font).replace(/["'\\]/g, '');
  root.style.setProperty('--reader-font', `"${safeFont}", serif`);
  root.style.setProperty('--reader-size', `${preferences.size}px`);
  root.style.setProperty('--reader-line', preferences.line);
  root.style.setProperty('--reader-width', `${preferences.width}px`);
  elements.fontInput.value = preferences.font;
  elements.fontSize.value = preferences.size;
  elements.lineHeight.value = preferences.line;
  elements.readingWidth.value = preferences.width;
  elements.fontSizeOutput.value = `${preferences.size}px`;
  elements.lineHeightOutput.value = preferences.line;
  elements.readingWidthOutput.value = `${preferences.width}px`;
  elements.themeButton.setAttribute('aria-label', `Switch to ${preferences.theme === 'light' ? 'dark' : 'light'} mode`);
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

function getFontSuggestions(query, limit = 200) {
  const normalizedQuery = normalizeFontName(query);
  if (!installedFonts.length) return [];
  if (!normalizedQuery) return installedFonts.slice(0, limit);

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

  return [...startsWithMatches, ...wordMatches, ...containsMatches].slice(0, limit);
}

function closeFontSuggestions() {
  fontSuggestionState.open = false;
  fontSuggestionState.activeIndex = -1;
  elements.fontSuggestions.hidden = true;
  elements.fontInput.setAttribute('aria-expanded', 'false');
  elements.fontInput.removeAttribute('aria-activedescendant');
}

function openFontSuggestions() {
  if (!fontSuggestionState.items.length) {
    closeFontSuggestions();
    return;
  }
  fontSuggestionState.open = true;
  elements.fontSuggestions.hidden = false;
  elements.fontInput.setAttribute('aria-expanded', 'true');
}

function renderFontSuggestions(items) {
  fontSuggestionState.items = items;
  if (!items.length) {
    elements.fontSuggestions.replaceChildren();
    closeFontSuggestions();
    return;
  }

  const activeIndex = Math.min(fontSuggestionState.activeIndex, items.length - 1);
  fontSuggestionState.activeIndex = activeIndex;
  elements.fontSuggestions.replaceChildren(...items.map((font, index) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.id = `font-option-${index}`;
    option.className = 'font-suggestion';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(index === activeIndex));
    option.dataset.font = font;
    option.textContent = font;
    return option;
  }));

  if (activeIndex >= 0) elements.fontInput.setAttribute('aria-activedescendant', `font-option-${activeIndex}`);
  else elements.fontInput.removeAttribute('aria-activedescendant');
  openFontSuggestions();
}

function updateFontSuggestions(query = elements.fontInput.value) {
  const suggestions = getFontSuggestions(query);
  renderFontSuggestions(suggestions);
  if (!installedFonts.length) {
    elements.fontStatus.textContent = 'Loading installed fonts...';
    return;
  }
  if (!normalizeFontName(query)) {
    elements.fontStatus.textContent = `${installedFonts.length.toLocaleString()} installed fonts available.`;
    return;
  }
  elements.fontStatus.textContent = `${suggestions.length.toLocaleString()} matches for "${query}".`;
}

function applySelectedFont(font) {
  elements.fontInput.value = font;
  preferences.font = font.trim();
  applyPreferences();
  savePreferences();
  closeFontSuggestions();
}

function moveFontSuggestion(delta) {
  if (!fontSuggestionState.items.length) return;
  if (!fontSuggestionState.open) openFontSuggestions();
  const lastIndex = fontSuggestionState.items.length - 1;
  const nextIndex = fontSuggestionState.activeIndex < 0
    ? (delta > 0 ? 0 : lastIndex)
    : (fontSuggestionState.activeIndex + delta + fontSuggestionState.items.length) % fontSuggestionState.items.length;
  fontSuggestionState.activeIndex = nextIndex;
  renderFontSuggestions(fontSuggestionState.items);
  document.getElementById(`font-option-${nextIndex}`)?.scrollIntoView({ block: 'nearest' });
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

function unescapeMarkdown(text) {
  return String(text || '').replace(/\\([\\`*_[\]{}()#+\-.!|>])/g, '$1');
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

function protectInlineHtml(text, htmlTokens) {
  return text.replace(/<\/?[a-z][^>\n]*>/gi, (tag) => htmlTokens.add(sanitizeInlineHtmlTag(tag)));
}

function inlineMarkdown(text, htmlTokens = createHtmlTokenStore()) {
  const protectedText = protectInlineHtml(unescapeMarkdown(text), htmlTokens);
  const rendered = escapeHtml(protectedText)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
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

function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let cell = '';
  let escaped = false;
  for (const char of trimmed) {
    if (char === '|' && !escaped) {
      cells.push(cell.trim());
      cell = '';
      continue;
    }
    cell += char;
    escaped = char === '\\' && !escaped;
    if (char !== '\\') escaped = false;
  }
  cells.push(cell.trim());
  return cells;
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
    return `<${tag}${style}>${inlineMarkdown(cell || '', htmlTokens)}</${tag}>`;
  };

  const thead = `<thead><tr>${headers.map((cell, columnIndex) => renderCell('th', cell, columnIndex)).join('')}</tr></thead>`;
  const tbody = rows.length
    ? `<tbody>${rows.map((row) => `<tr>${headers.map((_header, columnIndex) => renderCell('td', row[columnIndex] || '', columnIndex)).join('')}</tr>`).join('')}</tbody>`
    : '';
  return { html: `<table>${thead}${tbody}</table>`, nextIndex: index };
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const htmlTokens = createHtmlTokenStore();
  const output = [];
  let paragraph = [], listType = null, inCode = false, code = [], quote = [];
  const flushParagraph = () => { if (paragraph.length) { output.push(`<p>${inlineMarkdown(paragraph.join(' '), htmlTokens)}</p>`); paragraph = []; } };
  const closeList = () => { if (listType) { output.push(`</${listType}>`); listType = null; } };
  const flushQuote = () => { if (quote.length) { output.push(`<blockquote>${inlineMarkdown(quote.join('<br>'), htmlTokens)}</blockquote>`); quote = []; } };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^```/.test(line)) {
      flushParagraph(); closeList(); flushQuote();
      if (inCode) { output.push(`<pre><code>${code.join('\n')}</code></pre>`); code = []; }
      inCode = !inCode; continue;
    }
    if (inCode) { code.push(escapeHtml(line)); continue; }

    const htmlBlockTag = getHtmlBlockTag(line);
    if (htmlBlockTag) {
      flushParagraph(); closeList(); flushQuote();
      const htmlBlock = [line];
      if (!line.includes(`</${htmlBlockTag}>`) && !/\/>\s*$/.test(line.trim())) {
        while (index + 1 < lines.length) {
          index += 1;
          htmlBlock.push(lines[index]);
          if (lines[index].toLowerCase().includes(`</${htmlBlockTag}>`)) break;
        }
      }
      output.push(sanitizeHtml(htmlBlock.join('\n')));
      continue;
    }

    const table = parseTable(lines, index, htmlTokens);
    if (table) {
      flushParagraph(); closeList(); flushQuote();
      output.push(table.html);
      index = table.nextIndex - 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const quoted = line.match(/^>\s?(.*)$/);
    if (heading) { flushParagraph(); closeList(); flushQuote(); const level = heading[1].length; output.push(`<h${level}>${inlineMarkdown(heading[2], htmlTokens)}</h${level}>`); }
    else if (unordered || ordered) {
      flushParagraph(); flushQuote(); const type = unordered ? 'ul' : 'ol';
      if (listType !== type) { closeList(); output.push(`<${type}>`); listType = type; }
      output.push(`<li>${inlineMarkdown((unordered || ordered)[1], htmlTokens)}</li>`);
    }
    else if (quoted) { flushParagraph(); closeList(); quote.push(quoted[1]); }
    else if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) { flushParagraph(); closeList(); flushQuote(); output.push('<hr>'); }
    else if (!line.trim()) { flushParagraph(); closeList(); flushQuote(); }
    else { closeList(); flushQuote(); paragraph.push(line.trim()); }
  }
  if (inCode) output.push(`<pre><code>${code.join('\n')}</code></pre>`);
  flushParagraph(); closeList(); flushQuote();
  return output.join('\n');
}

function showDocument(markdown, name = 'Untitled.md') {
  elements.markdownOutput.innerHTML = parseMarkdown(markdown);
  elements.fileName.textContent = name;
  document.title = `Markdown Vision - ${name}`;
  elements.readerShell.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function openPicker() {
  if (window.desktop?.openMarkdownFile) {
    const document = await window.desktop.openMarkdownFile();
    if (document) showDocument(document.content, document.name);
    return;
  }
  elements.fileInput.click();
}

elements.openButton.addEventListener('click', openPicker);
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
  if (!elements.settingsPanel.hidden) void loadSystemFonts().then(() => updateFontSuggestions(elements.fontInput.value));
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
});

elements.fontInput.addEventListener('input', () => {
  preferences.font = elements.fontInput.value.trim();
  updateFontSuggestions(elements.fontInput.value);
  const safeFont = String(preferences.font || defaults.font).replace(/["'\\]/g, '');
  root.style.setProperty('--reader-font', `"${safeFont}", serif`);
  savePreferences();
});
elements.fontInput.addEventListener('focus', () => {
  void loadSystemFonts().then(() => updateFontSuggestions(elements.fontInput.value));
});
elements.fontInput.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    moveFontSuggestion(1);
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    moveFontSuggestion(-1);
    return;
  }
  if (event.key === 'Enter' && fontSuggestionState.open && fontSuggestionState.activeIndex >= 0) {
    event.preventDefault();
    applySelectedFont(fontSuggestionState.items[fontSuggestionState.activeIndex]);
    return;
  }
  if (event.key === 'Escape' && fontSuggestionState.open) {
    event.preventDefault();
    closeFontSuggestions();
  }
});
elements.fontSuggestions.addEventListener('mousedown', (event) => {
  event.preventDefault();
  const option = event.target.closest('.font-suggestion');
  if (!option) return;
  applySelectedFont(option.dataset.font || '');
});
elements.fontSize.addEventListener('input', () => { preferences.size = elements.fontSize.value; applyPreferences(); savePreferences(); });
elements.lineHeight.addEventListener('input', () => { preferences.line = elements.lineHeight.value; applyPreferences(); savePreferences(); });
elements.readingWidth.addEventListener('input', () => { preferences.width = elements.readingWidth.value; applyPreferences(); savePreferences(); });

document.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') { event.preventDefault(); openPicker(); } });
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
      updateFontSuggestions(elements.fontInput.value);
      return cachedFonts;
    }
    try {
      const fonts = await window.desktop.listSystemFonts();
      if (!Array.isArray(fonts) || fonts.length === 0) {
        installedFonts = [];
        elements.fontStatus.textContent = 'Enter the name of any installed font.';
        return null;
      }
      installedFonts = [...new Set(fonts)].sort((a, b) => a.localeCompare(b));
      updateFontSuggestions(elements.fontInput.value);
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
  window.desktop.onOpenDocument((document) => showDocument(document.content, document.name));
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
    if (document) showDocument(document.content, document.name);
  });
}
