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
  fileName: $('#fileName'),
  pasteButton: $('#pasteButton'),
  pasteDialog: $('#pasteDialog'),
  markdownInput: $('#markdownInput'),
  renderButton: $('#renderButton')
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
const storedPreferences = localStorage.getItem(preferenceStorageKey) || '{}';
const preferences = { ...defaults, ...JSON.parse(storedPreferences) };
preferences.font = legacyFonts[preferences.font] || preferences.font;
let fontLoadPromise = null;
let installedFonts = [];
let fontSuggestionState = { items: [], activeIndex: -1, open: false };

function savePreferences() {
  localStorage.setItem(preferenceStorageKey, JSON.stringify(preferences));
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
  return String(value || '').trim().toLocaleLowerCase();
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

function inlineMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
}

function parseMarkdown(markdown) {
  const lines = escapeHtml(markdown.replace(/\r\n?/g, '\n')).split('\n');
  const output = [];
  let paragraph = [], listType = null, inCode = false, code = [], quote = [];
  const flushParagraph = () => { if (paragraph.length) { output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`); paragraph = []; } };
  const closeList = () => { if (listType) { output.push(`</${listType}>`); listType = null; } };
  const flushQuote = () => { if (quote.length) { output.push(`<blockquote>${inlineMarkdown(quote.join('<br>'))}</blockquote>`); quote = []; } };

  for (const line of lines) {
    if (/^```/.test(line)) {
      flushParagraph(); closeList(); flushQuote();
      if (inCode) { output.push(`<pre><code>${code.join('\n')}</code></pre>`); code = []; }
      inCode = !inCode; continue;
    }
    if (inCode) { code.push(line); continue; }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const quoted = line.match(/^&gt;\s?(.*)$/);
    if (heading) { flushParagraph(); closeList(); flushQuote(); const level = heading[1].length; output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); }
    else if (unordered || ordered) {
      flushParagraph(); flushQuote(); const type = unordered ? 'ul' : 'ol';
      if (listType !== type) { closeList(); output.push(`<${type}>`); listType = type; }
      output.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`);
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
  applyPreferences(); savePreferences();
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

elements.pasteButton.addEventListener('click', () => elements.pasteDialog.showModal());
elements.renderButton.addEventListener('click', (event) => {
  if (!elements.markdownInput.value.trim()) { event.preventDefault(); elements.markdownInput.focus(); return; }
  showDocument(elements.markdownInput.value); elements.pasteDialog.close();
});
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
