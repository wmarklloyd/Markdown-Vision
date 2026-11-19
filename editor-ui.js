(() => {
  const $ = (selector) => document.querySelector(selector);
  const toggle = $('#editorToggle');
  const tools = $('#editorTools');
  const workspace = $('#editorWorkspace');
  const reader = $('#readerShell');
  const source = $('#markdownSource');
  const preview = $('#editorPreview');
  const panes = $('#editorPanes');
  const divider = $('#editorDivider');
  const editDialog = $('#visualEditDialog');
  const searchOverlay = $('#editorSearchOverlay');
  const restriction = $('#visualRestriction');
  const restrictionSource = $('#visualRestrictionSource');
  const restrictionMessage = $('#visualRestrictionMessage');
  const restrictionAnnouncement = $('#visualRestrictionAnnouncement');
  const dirtyLabel = $('#editorDirty');
  const saveButton = $('#editorSave');
  const saveAsButton = $('#editorSaveAs');
  const saveError = $('#editorSaveError');
  const current = window.markdownVisionReader?.getDocument();
  let original = current?.content || '';
  let fileName = current?.name || 'Untitled.md';
  let documentId = current?.documentId || null;
  let imageBase = current?.imageBase || '';
  let documentGeneration = 0;
  let saving = false;
  let saved = false;
  let dirty = false;
  let active = false;
  let showingDraft = false;
  let previewTimer = null;
  let previewSource = null;
  let visualBaseline = null;
  let visualBlocks = new Map();
  let visualRanges = new Map();
  let visualCodeOrigins = new Map();
  let nextCodeOrigin = 0;
  let nextDraftBlock = 0;
  let lastVisualHtml = '';
  let editingSurface = preview;
  const visualUndo = [];
  const visualRedo = [];
  let visualInput = null;
  let restrictionAnchor = null;
  let visualCommandActive = false;
  let lastTyping = null;
  const visitedCodeEditors = new WeakSet();
  let dividerGrabOffset = 0;
  const minSourceShare = Number(divider.getAttribute('aria-valuemin'));
  const maxSourceShare = Number(divider.getAttribute('aria-valuemax'));
  const listItemHint = 'Double-click or press Alt+Enter to edit this item';
  let searchQuery = '';
  let searchMatches = [];
  let searchIndex = -1;
  let searchDraft = '';
  let searchView = '';
  let searchRefreshTimer = null;
  let searchPaintFrame = null;
  let searchNeedsMeasurement = false;
  let searchFields = new Map();

  function fenceCode(text) {
    const length = (text.match(/\x60+/g) || []).reduce((max, run) => Math.max(max, run.length + 1), 3);
    const delimiter = '\x60'.repeat(length);
    return `${delimiter}\n${text}\n${delimiter}`;
  }

  function closedCodeBlock(text) {
    const lines = text.split('\n');
    const opener = window.markdownVisionReader.readCodeFence(lines[0]);
    const closer = opener && lines.length > 1 && window.markdownVisionReader.readCodeFence(lines.at(-1), opener[1]);
    return closer ? { opener, closer, body: lines.slice(1, -1).join('\n') } : null;
  }

  function updateCodeBody(text, body) {
    const code = closedCodeBlock(text);
    if (!code || code.body === body) return text;
    const { opener, closer } = code;
    const marker = opener[1][0];
    const width = body.split('\n').reduce((longest, line) => {
      const run = line.match(/^(\x60+|~+)[ \t]*$/)?.[1];
      return run?.[0] === marker ? Math.max(longest, run.length + 1) : longest;
    }, opener[1].length);
    const closingWidth = Math.max(width, closer[1].length);
    return [marker.repeat(width) + opener[2], body, marker.repeat(closingWidth) + closer[2]].join('\n');
  }

  function resizeCodeEditor(field) {
    field.rows = field.value.split('\n').length;
  }

  function visualCodeText(block) {
    // Chromium uses line-break elements when code is edited, and text newlines when it is loaded.
    return block.querySelector('br,div') ? block.innerText : block.textContent;
  }

  function visualMarkdown(root, preserveWhitespace = false) {
    const escape = (text) => text.replace(/[\\<>\x60*_\[\]~|]/g, '\\$&');
    const inline = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return escape(node.data.replace(/\u00a0/g, ' '));
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      const value = Array.from(node.childNodes, inline).join('');
      const mark = (delimiter) => value.replace(/^(\s*)(.*?)(\s*)$/s, (_, before, text, after) =>
        text ? before + delimiter + text + delimiter + after : value);
      switch (node.tagName) {
        case 'B': case 'STRONG': return mark('**');
        case 'I': case 'EM': return mark('*');
        case 'DEL': case 'S': case 'STRIKE': return mark('~~');
        case 'CODE': {
          const text = node.textContent;
          const length = (text.match(/\x60+/g) || []).reduce((max, run) => Math.max(max, run.length + 1), 1);
          const delimiter = '\x60'.repeat(length);
          const pad = (/^\x60|\x60$/.test(text) || (text.startsWith(' ') && text.endsWith(' ') && text.trim())) ? ' ' : '';
          return delimiter + pad + text + pad + delimiter;
        }
        case 'BR': return '\n';
        case 'A': return '[' + value + '](' + node.getAttribute('href') + ')';
        case 'IMG': return '![' + escape(node.alt) + '](' + node.getAttribute('src') + ')';
        default: return value;
      }
    };
    const lines = (node) => {
      const text = Array.from(node.childNodes, inline).join('');
      return preserveWhitespace ? text : text.trim();
    };
    const block = (node, original) => {
      const tag = node.tagName;
      if (/^H[1-6]$/.test(tag)) return '#'.repeat(Number(tag[1])) + ' ' + lines(node);
      if (tag === 'BLOCKQUOTE') return lines(node).split('\n').map((line) => '> ' + line).join('\n');
      if (tag === 'PRE') return fenceCode(visualCodeText(node));
      if (tag === 'HR') return '---';
      if (tag === 'UL' || tag === 'OL') {
        const usedItems = new Set();
        return Array.from(node.children, (item, index) => {
          if (root === preview) item.title = listItemHint;
          const id = item.dataset.listItem;
          const existing = original?.listItems?.[id];
          if (existing && !usedItems.has(id)) {
            usedItems.add(id);
            return item.innerHTML === existing.html ? existing.line
              : existing.prefix + lines(item).replace(/\n/g, ' ') + existing.trailing;
          }
          return (tag === 'OL' ? (index + 1) + '. ' : '- ') + lines(item);
        }).join('\n');
      }
      if (tag === 'TABLE') {
        const makeRow = (cells) => '| ' + cells.join(' | ') + ' |';
        const rows = Array.from(node.rows, (row) => Array.from(row.cells, (cell) => lines(cell).replace(/\n/g, ' ')));
        if (rows.length < 1) return '';
        const divider = Array.from(node.rows[0].cells, (cell) =>
          ({ center: ':---:', right: '---:' })[cell.style.textAlign] || '---');
        return [makeRow(rows[0]), makeRow(divider), ...rows.slice(1).map(makeRow)].join('\n');
      }
      if (node.hasAttribute('data-unfenced')) {
        return protectParagraph(Array.from(node.childNodes, inline).join(''), '  \n');
      }
      return protectParagraph(lines(node), preserveWhitespace ? '  \n' : '\n\n');
    };
    const protectParagraph = (text, lineBreak = '\n\n') => text
      .replace(/^([ \t]*)([#+-])(?=[ \t]|[#-])/gm, '$1\\$2')
      .replace(/^([ \t]*\d+)([.)])(?=[ \t])/gm, '$1\\$2')
      .replace(/\n/g, lineBreak);
    const paragraphs = [];
    const used = new Set();
    let loose = '';
    const flushLoose = () => {
      if (loose.trim()) paragraphs.push({ text: protectParagraph(loose.trim()) });
      loose = '';
    };
    for (const node of root.childNodes) {
      let id = node.dataset?.visualBlock;
      const original = used.has(id) ? null : visualBlocks.get(id);
      if (original || /^(P|DIV|H[1-6]|BLOCKQUOTE|PRE|HR|UL|OL|TABLE)$/.test(node.tagName || '')) {
        flushLoose();
        if (root === preview && (!id || used.has(id))) {
          id = 'draft-' + nextDraftBlock++;
          node.dataset.visualBlock = id;
        }
        const codeEditor = original?.kind === 'code' && node.querySelector('.visual-code-editor');
        const span = codeEditor && visualRanges.get(id);
        const text = span ? updateCodeBody(source.value.slice(span.start, span.end), codeEditor.value)
          : original && (original.locked || node.outerHTML === original.html) ? original.source : block(node, original);
        paragraphs.push({ text, original, id });
        if (id) used.add(id);
      } else {
        loose += inline(node);
      }
    }
    flushLoose();
    const parts = paragraphs.filter(({ text }) => preserveWhitespace || text.trim());
    if (root !== preview) return parts.map(({ text }) => text).join('\n\n');
    const originals = [...visualBlocks.values()];
    const baseline = visualBaseline.source;
    let markdown = originals.length ? baseline.slice(0, originals[0].start) : '';
    let previous;
    visualRanges = new Map();
    for (const { text, original, id } of parts) {
      if (previous) {
        const gap = previous.original && original && previous.original.end <= original.start
          ? baseline.slice(previous.original.end, original.start) : null;
        markdown += gap !== null && !gap.trim() ? gap : '\n\n';
      }
      if (id) visualRanges.set(id, { start: markdown.length, end: markdown.length + text.length });
      markdown += text;
      previous = { original };
    }
    return markdown + (originals.length ? baseline.slice(originals.at(-1).end) : '');
  }

  function updateDirty() {
    dirty = source.value !== original;
    dirtyLabel.textContent = saving ? 'Saving…' : dirty ? 'Unsaved' : saved ? 'Saved' : '';
    saveButton.disabled = saving || !dirty;
    saveAsButton.disabled = saving;
    const text = source.value.trim();
    $('#editorStats').textContent = (text ? text.split(/\s+/).length : 0) + ' words';
    window.markdownVisionReader.updatePrintButton();
    if (searchQuery && source.value !== searchDraft) {
      clearTimeout(searchRefreshTimer);
      searchRefreshTimer = setTimeout(() => window.markdownVisionReader.refreshEditorSearch({ preserve: true, scroll: false }), 100);
    }
  }

  function showDraftInReader() {
    showingDraft = true;
    try {
      window.markdownVisionReader.showDocument(source.value, fileName, documentId, imageBase);
    } finally {
      showingDraft = false;
    }
  }

  async function saveDraft(saveAs = false) {
    if (!active || saving || (!saveAs && !dirty) || !window.desktop?.saveMarkdownFile) return;
    const snapshot = source.value;
    const generation = documentGeneration;
    saveError.hidden = true;
    saving = true;
    updateDirty();
    try {
      const result = await window.desktop.saveMarkdownFile(documentId, snapshot, saveAs);
      if (generation !== documentGeneration || result?.status === 'canceled') return;
      if (result?.status !== 'saved') {
        saveError.textContent = result?.message || 'Windows could not save the draft. Your edits are still open.';
        saveError.hidden = false;
        return;
      }
      original = snapshot;
      const previousImageBase = imageBase;
      documentId = result.documentId;
      imageBase = result.imageBase || '';
      fileName = result.name;
      saved = true;
      $('#editorFileName').textContent = fileName;
      document.title = 'Markdown Vision - ' + fileName;
      if (!active || imageBase !== previousImageBase) showDraftInReader();
      if (active && imageBase !== previousImageBase) {
        reader.hidden = true;
        previewSource = null;
        updatePreview(false);
      }
    } catch {
      if (generation === documentGeneration) {
        saveError.textContent = 'Windows could not save the draft. Your edits are still open.';
        saveError.hidden = false;
      }
    } finally {
      saving = false;
      updateDirty();
    }
  }

  function needsMarkdown(text, referenceLabels, table = false) {
    let inline = window.markdownVisionReader.withoutInlineCode(text);
    if (table) inline = inline.replace(/<br[ \t]*\/?>/gi, '');
    return /<\/?[a-z][\w:-]*(?=[ \t/>])[^>\n]*>|^[ \t]*\[[^\]]+\]:|\[[^\]\n]+\]\[[^\]\n]*\]/im.test(inline)
      || (referenceLabels.size > 0 && [...inline.matchAll(/\[([^\]\n]+)\](?!\()/g)]
        .some((match) => referenceLabels.has(match[1].trim().toLowerCase())));
  }

  function updatePreview(resetHistory = true) {
    clearTimeout(previewTimer);
    if (!active || panes.dataset.view === 'source' || source.value === previewSource) return;
    hideRestriction();
    previewSource = source.value;
    preview.replaceChildren();
    visualBlocks = new Map();
    visualRanges = new Map();
    visualCodeOrigins = new Map();
    const blocks = window.markdownVisionReader.renderBlocks(previewSource);
    const referenceLabels = new Set(blocks.filter(({ kind }) => kind !== 'code').flatMap(({ source }) =>
      [...source.matchAll(/^[ \t]*\[([^\]\n]+)\]:/gm)].map((match) => match[1].trim().toLowerCase())));
    let previousLocked = true;
    for (const [index, block] of blocks.entries()) {
      const previous = blocks[index - 1];
      const following = blocks[index + 1];
      const indented = /^[ \t]+\S/m.test(block.source);
      const continuation = /^[ \t]+\S/.test(block.source) && previous?.kind === 'list'
        && block.start === previous.end + 1;
      const hasIndentedChild = following?.start === block.end + 1 && /^[ \t]+\S/.test(following.source);
      const nestedList = (block.kind === 'list' && (indented || hasIndentedChild)) || continuation;
      const inlineMarkup = block.kind !== 'code' && needsMarkdown(block.source, referenceLabels, block.kind === 'table');
      const locked = ['html', 'complex', 'footnotes', 'definitions'].includes(block.kind)
        || (block.kind === 'code' && window.markdownVisionReader.readCodeFence(block.source.split('\n')[0])?.[2].trim())
        || inlineMarkup
        || (block.kind !== 'code' && /^>[ \t]*(?:>|[-+*][ \t]|\d+[.)][ \t])/m.test(block.source))
        || nestedList;
      const template = document.createElement('template');
      template.innerHTML = block.html;
      const rendered = template.content.firstElementChild;
      const hasTasks = block.kind === 'list' && rendered?.querySelector('.markdown-task');
      const protectedBlock = Boolean(locked || hasTasks || block.kind === 'table');
      const node = protectedBlock ? document.createElement('div') : rendered;
      if (!node) continue;
      if (protectedBlock) {
        if (previousLocked) appendTypingLine();
        node.contentEditable = 'false';
        node.className = 'visual-protected-block';
        if (block.kind === 'definitions') node.hidden = true;
        if (template.content.childNodes.length) node.append(template.content);
        else node.textContent = 'Embedded content';
      }
      const id = String(index);
      node.dataset.visualBlock = id;
      preview.append(node);
      const record = { ...block, locked: protectedBlock, node };
      if (block.kind === 'list' && !protectedBlock) {
        const lines = block.source.split('\n');
        record.listItems = Array.from(node.children, (item, itemIndex) => {
          const line = lines[itemIndex];
          const info = window.markdownVisionReader.readListItem(line);
          item.dataset.listItem = String(itemIndex);
          return { line, html: item.innerHTML, prefix: info.prefix, trailing: info.body.match(/[ \t]*$/)[0] };
        });
      }
      configureVisualBlock(record, rendered, { inlineMarkup, nestedList, referenceLabels });
      visualBlocks.set(id, record);
      visualRanges.set(id, { start: block.start, end: block.end });
      previousLocked = protectedBlock;
    }
    if (previousLocked && visualBlocks.size) appendTypingLine();
    window.markdownVisionReader.syncPictureSourcesToTheme(preview);
    for (const block of visualBlocks.values()) block.html = block.node.outerHTML;
    preview.contentEditable = 'true';
    preview.tabIndex = 0;
    $('#visualEditorNotice').hidden = ![...visualBlocks.values()].some((block) => block.locked);
    visualBaseline = { html: preview.innerHTML, source: previewSource };
    lastVisualHtml = visualBaseline.html;
    if (resetHistory) {
      visualUndo.length = 0;
      visualRedo.length = 0;
    }
    visualInput = null;
    lastTyping = null;
    updateTools();
  }

  function appendTypingLine() {
    const paragraph = document.createElement('p');
    paragraph.append(document.createElement('br'));
    preview.append(paragraph);
  }

  function visualAction(label, action, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.visualEdit = action;
    if (index !== undefined) button.dataset.index = String(index);
    return button;
  }

  function blockLines(markdown) {
    let start = 0;
    return markdown.split('\n').map((text) => {
      const line = { text, start, end: start + text.length };
      start = line.end + 1;
      return line;
    });
  }

  function editableTable(markdown) {
    const rows = blockLines(markdown).map((line) => ({
      ...line, cells: window.markdownVisionReader.tableCellRanges(line.text)
    }));
    const columns = rows[0].cells.length;
    if (columns < 2 || rows.length < 2 || rows.some((row, index) => row.cells.length !== columns
        && !(index > 1 && /^\|[ \t]*\|$/.test(row.text.trim())))
        || !rows[1].cells.every(({ start, end }) => /^:?-{3,}:?$/.test(rows[1].text.slice(start, end)))) return null;
    return rows;
  }

  function configureVisualBlock(block, rendered, { inlineMarkup, nestedList, referenceLabels }) {
    if (!block.locked) {
      if (block.kind === 'list') {
        for (const item of rendered.children) item.title = listItemHint;
      }
      for (const image of rendered.querySelectorAll('img')) image.tabIndex = 0;
      return;
    }
    const actions = document.createElement('div');
    actions.className = 'visual-block-actions';
    let reason = 'This block contains formatting that needs to be edited in Markdown.';
    if (block.kind === 'code') {
      const code = closedCodeBlock(block.source);
      if (code) {
        const field = document.createElement('textarea');
        field.className = 'visual-code-editor';
        field.setAttribute('aria-label', 'Code contents');
        field.spellcheck = false;
        field.autocapitalize = 'off';
        field.wrap = 'off';
        field.value = code.body;
        resizeCodeEditor(field);
        rendered.classList.add('visual-code-frame');
        rendered.replaceChildren(field);
        actions.append(visualAction('Change language', 'code-language'));
        reason = 'Type directly in the code block to edit its contents. Use Markdown to edit the lines that mark where it starts and ends.';
      }
    } else if (block.kind === 'list' && !inlineMarkup) {
      reason = nestedList
        ? 'Use Edit item to change the text. To change the nesting, edit the list in Markdown.'
        : 'Use Edit item or the checkboxes to change this list.';
      for (const [index, item] of [...rendered.querySelectorAll('li')].entries()) {
        if (nestedList) {
          item.dataset.visualRestriction = reason;
          item.dataset.sourceListItem = String(index);
        }
        const checkbox = item.querySelector('input');
        if (checkbox && !nestedList) {
          checkbox.disabled = false;
          checkbox.setAttribute('aria-label', item.textContent.trim() || 'Task');
          checkbox.dataset.visualEdit = 'task';
          checkbox.dataset.index = String(index);
        }
        item.insertBefore(visualAction('Edit item', nestedList ? 'list-text' : 'list-item', index),
          item.querySelector(':scope > ul, :scope > ol'));
      }
    } else if (block.kind === 'table') {
      reason = 'This table needs to be edited in Markdown.';
      const rows = editableTable(block.source);
      const displayed = [...rendered.rows];
      const markup = window.markdownVisionReader.withoutInlineCode(block.source);
      if (rows && displayed.length === rows.length - 1 && displayed.every((row) => row.cells.length === rows[0].cells.length)
          && !/<\/?(?:table|tbody|thead|tfoot|tr|th|td|caption|col|colgroup)\b/i.test(markup)) {
        const allowStructure = !inlineMarkup && rows.every((row) => row.cells.length === rows[0].cells.length);
        for (const [row, line] of displayed.entries()) {
          const raw = rows[row ? row + 1 : 0];
          if (raw.cells.length !== line.cells.length) continue;
          for (const [column, cell] of [...line.cells].entries()) {
            const { start, end } = raw.cells[column];
            const sourceOnly = needsMarkdown(raw.text.slice(start, end), referenceLabels, true);
            cell.tabIndex = 0;
            cell.title = sourceOnly ? 'Edit this cell in Markdown' : 'Edit table cell';
            cell.dataset.visualEdit = sourceOnly ? 'table-cell-source' : 'table-cell';
            if (!sourceOnly) reason = 'Select a cell to edit it. You can edit the underlying table in Markdown.';
            if (sourceOnly) {
              const value = window.markdownVisionReader.withoutInlineCode(raw.text.slice(start, end));
              cell.dataset.visualRestriction = /<\/?[a-z][\w:-]*(?=[ \t/>])/i.test(value)
                ? 'This cell contains HTML. Edit this cell in Markdown.'
                : 'This cell uses Markdown references. Edit this cell in Markdown.';
            }
            cell.dataset.row = String(row);
            cell.dataset.index = String(column);
            if (allowStructure) cell.dataset.tableStructure = 'true';
          }
        }
      }
    } else if (block.kind === 'html') {
      reason = 'This layout uses HTML. Edit it in Markdown.';
    }
    block.node.dataset.visualRestriction = reason;
    const sourceAction = visualAction('Edit in Markdown', 'source');
    sourceAction.title = reason;
    actions.append(sourceAction);
    block.node.append(actions);
  }

  function displayedBlock(target) {
    const node = target.closest('[data-visual-block]');
    const id = node?.dataset.visualBlock;
    const span = visualRanges.get(id);
    if (node?.parentElement !== preview || !span || source.value !== previewSource) return null;
    return { ...span, node, text: source.value.slice(span.start, span.end) };
  }

  function restrictionFor(node) {
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    return preview.contains(element) ? element.closest('[data-visual-restriction]') : null;
  }

  function currentVisualRange() {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return null;
    const range = selection.getRangeAt(0);
    return preview.contains(range.startContainer) && preview.contains(range.endContainer) ? range : null;
  }

  function protectedEditTarget(target, range = currentVisualRange()) {
    return restrictionFor(target) || restrictionFor(range?.startContainer) || restrictionFor(range?.endContainer)
      || (range && [...preview.querySelectorAll('.visual-protected-block')].find((node) => range.intersectsNode(node)));
  }

  function hideRestriction(restoreFocus = false) {
    if (!restrictionAnchor) return;
    const target = restrictionAnchor;
    restrictionAnchor = null;
    restriction.hidden = true;
    restrictionAnnouncement.textContent = '';
    if (restoreFocus) (target.isConnected && target.tabIndex >= 0 ? target : preview).focus({ preventScroll: true });
  }

  function positionRestriction() {
    if (!restrictionAnchor) return;
    if (!restrictionAnchor.isConnected) {
      hideRestriction();
      return;
    }
    const element = restrictionAnchor.getBoundingClientRect();
    const surface = preview.getBoundingClientRect();
    const left = Math.max(12, Math.min(element.left, window.innerWidth - restriction.offsetWidth - 12));
    const below = Math.max(element.bottom, surface.top) + 8;
    const above = Math.min(element.top, surface.bottom) - restriction.offsetHeight - 8;
    const bottomLimit = Math.min(surface.bottom, window.innerHeight) - restriction.offsetHeight;
    const top = below <= bottomLimit ? below : above >= surface.top ? above
      : Math.max(surface.top, Math.min(element.top + 8, bottomLimit));
    restriction.style.left = left + 'px';
    restriction.style.top = top + 'px';
  }

  function showRestriction(target, focusAction = false) {
    if (restrictionAnchor !== target) {
      restrictionAnchor = target;
      const message = target.dataset.visualRestriction;
      restrictionMessage.textContent = message;
      restrictionSource.textContent = target.dataset.visualEdit === 'table-cell-source' ? 'Edit this cell in Markdown'
        : target.hasAttribute('data-source-list-item') ? 'Edit this item in Markdown' : 'Edit in Markdown';
      restriction.hidden = false;
      restrictionAnnouncement.textContent = message;
    }
    positionRestriction();
    if (focusAction && restrictionAnchor) restrictionSource.focus({ preventScroll: true });
  }

  function withTextareaLayout(field, measure) {
    // A textarea's wrapped lines are unavailable as DOM nodes. Measure the same text at its current width.
    const layout = getComputedStyle(field);
    const mirror = document.createElement('div');
    mirror.className = 'source-position-mirror';
    for (const property of ['font', 'lineHeight', 'padding', 'whiteSpace', 'overflowWrap', 'wordBreak',
      'letterSpacing', 'wordSpacing', 'tabSize', 'direction']) {
      mirror.style[property] = layout[property];
    }
    mirror.style.width = field.clientWidth + 'px';
    const text = document.createTextNode(field.value);
    mirror.append(text);
    document.body.append(mirror);
    try {
      return measure(text, mirror.getBoundingClientRect());
    } finally {
      mirror.remove();
    }
  }

  function measureSourcePosition(offset) {
    return withTextareaLayout(source, (text, origin) => {
      const range = document.createRange();
      range.setStart(text, offset);
      range.setEnd(text, Math.min(offset + 1, text.length));
      const character = range.getBoundingClientRect();
      return { top: character.top - origin.top, left: character.left - origin.left };
    });
  }

  function literalPattern(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function searchPositions(text, pattern) {
    return [...text.matchAll(new RegExp(pattern, 'giu'))].map((match) => ({
      start: match.index, end: match.index + match[0].length
    }));
  }

  function occurrences(text, query) {
    return searchPositions(text, literalPattern(query));
  }

  function visibleSearchText(root) {
    const segments = [];
    let text = '';
    let boundary = false;
    const visit = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.data) return;
        if (boundary && text && !text.endsWith('\n')) text += '\n';
        boundary = false;
        segments.push({ node, start: text.length, end: text.length + node.length });
        text += node.data;
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE
          && node.matches('button,input,textarea,script,style,[hidden],.visual-block-actions')) return;
      if (node.tagName === 'DETAILS' && !node.open) {
        const summary = node.querySelector(':scope > summary');
        if (summary) visit(summary);
        return;
      }
      const block = node !== root && node.nodeType === Node.ELEMENT_NODE
        && node.matches('br,p,div,li,ul,ol,blockquote,pre,table,tr,th,td,hr,h1,h2,h3,h4,h5,h6,summary,figure,figcaption');
      if (block) boundary = true;
      node.childNodes.forEach(visit);
      if (block) boundary = true;
    };
    visit(root);
    return { text, segments };
  }

  function visibleSearchRange(segments, match) {
    const first = segments.find(({ start, end }) => start <= match.start && match.start < end);
    const last = segments.find(({ start, end }) => start < match.end && match.end <= end);
    if (!first || !last) return null;
    const range = document.createRange();
    range.setStart(first.node, match.start - first.start);
    range.setEnd(last.node, match.end - last.start);
    return range;
  }

  function traceSearchMatches(span, hits, visualText) {
    if (span.text === visualText) return new Map(hits.map((hit) => [hit.source.end - span.start, hit]));
    // An invisible marker follows each raw hit. Only markers that survive in the rendered text can pair with Visual.
    let marker = '\uE000';
    while (span.text.includes(marker)) marker += '\uE000';
    let marked = '';
    let offset = 0;
    hits.forEach((hit, index) => {
      const end = hit.source.end - span.start;
      marked += span.text.slice(offset, end) + marker + index + '\uE001';
      offset = end;
    });
    const template = document.createElement('template');
    template.innerHTML = window.markdownVisionReader.render(marked + span.text.slice(offset));
    const traced = visibleSearchText(template.content).text;
    const byEnd = new Map();
    let rendered = '';
    offset = 0;
    for (const token of traced.matchAll(new RegExp(marker + '(\\d+)\\uE001', 'g'))) {
      rendered += traced.slice(offset, token.index);
      byEnd.set(rendered.length, hits[Number(token[1])]);
      offset = token.index + token[0].length;
    }
    return rendered + traced.slice(offset) === visualText ? byEnd : new Map();
  }

  function addVisualSearchMatches(query, matches) {
    const extra = [];
    let cursor = 0;
    for (const node of preview.children) {
      const span = displayedBlock(node);
      if (!span) continue;
      while (cursor < matches.length && matches[cursor].source.start < span.start) cursor += 1;
      const hits = [];
      while (cursor < matches.length && matches[cursor].source.start < span.end) {
        if (matches[cursor].source.end <= span.end) hits.push(matches[cursor]);
        cursor += 1;
      }
      const code = node.querySelector('.visual-code-editor');
      const rawCode = code && closedCodeBlock(span.text);
      if (rawCode) {
        const start = span.start + span.text.indexOf('\n') + 1;
        for (const hit of hits) {
          if (hit.source.start >= start && hit.source.end <= start + rawCode.body.length) {
            hit.visual = { field: code, start: hit.source.start - start, end: hit.source.end - start };
          }
        }
        continue;
      }
      const visible = visibleSearchText(node);
      const positions = occurrences(visible.text, query);
      if (!positions.length) continue;
      const syntax = /[*_~\x60\\]/;
      const formatted = query.length <= 80 && !syntax.test(query) && syntax.test(span.text)
        ? searchPositions(span.text, [...query].map(literalPattern).join('[*_~\\x60\\\\]*'))
          .filter(({ start, end }) => end - start > query.length)
          .map(({ start, end }) => ({ source: { start: span.start + start, end: span.start + end }, order: span.start + start }))
          .filter((item) => !hits.some((hit) => hit.source.start < item.source.end && item.source.start < hit.source.end)) : [];
      const candidates = hits.concat(formatted).sort((left, right) => left.source.end - right.source.end);
      const byEnd = candidates.length ? traceSearchMatches(span, candidates, visible.text) : new Map();
      const pending = new Set(formatted);
      for (const position of positions) {
        const range = visibleSearchRange(visible.segments, position);
        if (!range) continue;
        const hit = byEnd.get(position.end);
        if (hit) {
          hit.visual = { range };
          if (pending.has(hit)) extra.push(hit);
        }
        else extra.push({ order: span.start + (span.end - span.start) * position.start / visible.text.length, visual: { range } });
      }
    }
    return matches.concat(extra).sort((left, right) => left.order - right.order);
  }

  function measureSearchFields() {
    const fields = new Map();
    const add = (mark, field, index) => {
      if (!fields.has(field)) fields.set(field, []);
      fields.get(field).push({ mark, index });
    };
    searchMatches.forEach((match, index) => {
      if (match.source && searchView !== 'visual') add(match.source, source, index);
      if (match.visual?.field) add(match.visual, match.visual.field, index);
    });
    for (const [field, entries] of fields) {
      withTextareaLayout(field, (text, origin) => {
        const range = document.createRange();
        for (const { mark } of entries) {
          range.setStart(text, mark.start);
          range.setEnd(text, mark.end);
          mark.rects = [...range.getClientRects()].map((rect) => ({
            left: rect.left - origin.left, right: rect.right - origin.left,
            top: rect.top - origin.top, bottom: rect.bottom - origin.top
          }));
        }
      });
    }
    return fields;
  }

  function paintSearchOverlay() {
    const marks = document.createDocumentFragment();
    const visualBounds = preview.getBoundingClientRect();
    for (const [field, entries] of searchFields) {
      const bounds = field.getBoundingClientRect();
      const right = bounds.left + field.clientWidth;
      const bottom = bounds.top + field.clientHeight;
      const clipTop = field === source ? bounds.top : Math.max(bounds.top, visualBounds.top);
      const clipBottom = field === source ? bottom : Math.min(bottom, visualBounds.bottom);
      const clipLeft = field === source ? bounds.left : Math.max(bounds.left, visualBounds.left);
      const clipRight = field === source ? right : Math.min(right, visualBounds.right);
      const x = bounds.left - field.scrollLeft;
      const y = bounds.top - field.scrollTop;
      for (const { mark, index } of entries) {
        for (const rect of mark.rects) {
          const left = Math.max(clipLeft, x + rect.left);
          const top = Math.max(clipTop, y + rect.top);
          const width = Math.min(clipRight, x + rect.right) - left;
          const height = Math.min(clipBottom, y + rect.bottom) - top;
          if (width <= 0 || height <= 0) continue;
          const highlight = document.createElement('span');
          if (index === searchIndex) highlight.className = 'is-active';
          Object.assign(highlight.style, { left: left + 'px', top: top + 'px', width: width + 'px', height: height + 'px' });
          marks.append(highlight);
        }
      }
    }
    searchOverlay.replaceChildren(marks);
  }

  function scheduleSearchPaint(remeasure = false) {
    if (!searchMatches.length) return;
    searchNeedsMeasurement ||= remeasure;
    if (searchPaintFrame !== null) return;
    searchPaintFrame = requestAnimationFrame(() => {
      searchPaintFrame = null;
      if (searchNeedsMeasurement) searchFields = measureSearchFields();
      searchNeedsMeasurement = false;
      paintSearchOverlay();
    });
  }

  function centerFieldMatch(field, match) {
    const rect = match.rects?.[0];
    if (!rect) return;
    field.scrollTop = (rect.top + rect.bottom - field.clientHeight) / 2;
    field.scrollLeft = (rect.left + rect.right - field.clientWidth) / 2;
    if (field !== source) {
      const y = field.getBoundingClientRect().top + (rect.top + rect.bottom) / 2 - field.scrollTop;
      preview.scrollTop += y - preview.getBoundingClientRect().top - preview.clientHeight / 2;
    }
  }

  function centerVisualMatch(range) {
    const ancestor = range.commonAncestorContainer;
    let element = ancestor.nodeType === Node.ELEMENT_NODE ? ancestor : ancestor.parentElement;
    for (; element && element !== preview; element = element.parentElement) {
      if (element.scrollWidth <= element.clientWidth || !/^(auto|scroll)$/.test(getComputedStyle(element).overflowX)) continue;
      const rect = range.getClientRects()[0];
      if (rect) element.scrollLeft += (rect.left + rect.right) / 2 - element.getBoundingClientRect().left - element.clientWidth / 2;
    }
    const rect = range.getClientRects()[0];
    if (rect) preview.scrollTop += (rect.top + rect.bottom) / 2 - preview.getBoundingClientRect().top - preview.clientHeight / 2;
  }

  function showEditorSearch(index, center) {
    searchIndex = index;
    const activeMatch = searchMatches[index];
    if (CSS.highlights && typeof Highlight === 'function') {
      const all = new Highlight();
      for (const { visual } of searchMatches) {
        if (visual?.range) all.add(visual.range);
      }
      CSS.highlights.set('editor-search', all);
      const current = activeMatch?.visual?.range ? new Highlight(activeMatch.visual.range) : new Highlight();
      current.priority = 1;
      CSS.highlights.set('editor-search-active', current);
    }
    if (center && activeMatch) {
      if (activeMatch.source && searchView !== 'visual') centerFieldMatch(source, activeMatch.source);
      if (activeMatch.visual?.field) {
        centerFieldMatch(activeMatch.visual.field, activeMatch.visual);
      } else if (activeMatch.visual?.range) {
        centerVisualMatch(activeMatch.visual.range);
      }
    }
    paintSearchOverlay();
  }

  function findEditorSearch(query, preserve) {
    clearTimeout(searchRefreshTimer);
    const previous = preserve && query === searchQuery ? searchMatches[searchIndex] : null;
    let previousOrder = previous?.order;
    if (previous && source.value !== searchDraft) {
      const nextDraft = source.value;
      let unchangedTail = 0;
      while (unchangedTail < Math.min(searchDraft.length, nextDraft.length)
          && searchDraft.at(-1 - unchangedTail) === nextDraft.at(-1 - unchangedTail)) unchangedTail += 1;
      if (previousOrder >= searchDraft.length - unchangedTail) previousOrder += nextDraft.length - searchDraft.length;
    }
    const view = panes.dataset.view;
    if (query && view !== 'source') updatePreview();
    const raw = query ? occurrences(source.value, query).map((hit) => ({ source: hit, order: hit.start })) : [];
    searchQuery = query;
    searchDraft = source.value;
    searchView = view;
    searchMatches = query && view !== 'source' ? addVisualSearchMatches(query, raw) : raw;
    if (view === 'visual') searchMatches = searchMatches.filter((match) => match.visual);
    searchFields = measureSearchFields();
    let index = searchMatches.length ? 0 : -1;
    if (previous && index >= 0) {
      for (let i = 1; i < searchMatches.length; i += 1) {
        if (Math.abs(searchMatches[i].order - previousOrder) < Math.abs(searchMatches[index].order - previousOrder)) index = i;
      }
    }
    return { index, count: searchMatches.length };
  }

  window.markdownVisionEditorSearch = {
    find: findEditorSearch,
    show: showEditorSearch,
    remeasure: () => scheduleSearchPaint(true),
    isStale: () => searchDraft !== source.value || searchView !== panes.dataset.view,
    scope(index) {
      const match = searchMatches[index];
      if (!match || searchView !== 'split') return '';
      if (!match.visual) return 'Markdown only';
      return match.source ? '' : 'Visual only';
    },
    clear() {
      clearTimeout(searchRefreshTimer);
      searchQuery = '';
      searchMatches = [];
      searchFields.clear();
      searchIndex = -1;
      CSS.highlights?.delete('editor-search');
      CSS.highlights?.delete('editor-search-active');
      searchOverlay.replaceChildren();
    }
  };

  function focusSource(span, target = span.node, targetOffset = 0) {
    const targetTop = () => target.getBoundingClientRect().top + targetOffset;
    const previousTop = targetTop() - preview.getBoundingClientRect().top;
    selectView('split', source);
    source.setSelectionRange(span.start, span.end, 'backward');

    const visualBounds = preview.getBoundingClientRect();
    const visualOffset = Math.max(24, Math.min(previousTop, preview.clientHeight / 3));
    preview.scrollTop += targetTop() - visualBounds.top - visualOffset;

    const position = measureSourcePosition(span.start);
    const sourceBounds = source.getBoundingClientRect();
    const sourceOffset = targetTop() - sourceBounds.top;
    const visibleOffset = Math.max(18, Math.min(sourceOffset, source.clientHeight - 32));
    source.scrollTop = position.top - visibleOffset;
    source.scrollLeft = Math.max(0, position.left - source.clientWidth / 2);
    updateCursor();
  }

  function focusBlockSource(span) {
    const field = span.node.querySelector('.visual-code-editor');
    if (!field || !visitedCodeEditors.has(field)) {
      focusSource(span);
      return;
    }
    const bodyStart = span.start + span.text.indexOf('\n') + 1;
    const line = field.value.slice(0, field.selectionStart).split('\n').length - 1;
    const lineOffset = line * parseFloat(getComputedStyle(field).lineHeight) - field.scrollTop;
    focusSource({ start: bodyStart + field.selectionStart, end: bodyStart + field.selectionEnd }, field, lineOffset);
  }

  function applyVisualPatch(start, end, text) {
    if (source.value.slice(start, end) === text) return;
    const before = visualSnapshot();
    const top = preview.scrollTop;
    source.value = source.value.slice(0, start) + text + source.value.slice(end);
    updatePreview(false);
    preview.scrollTop = top;
    preview.focus();
    rememberVisualChange(before);
    updateDirty();
  }

  function showVisualEdit(title, fields, apply, extraActions = []) {
    hideRestriction();
    const snapshot = source.value;
    const form = editDialog.querySelector('form');
    const inputs = $('#visualEditFields');
    const footer = $('#visualEditActions');
    const error = $('#visualEditError');
    $('#visualEditTitle').textContent = title;
    error.hidden = true;
    inputs.replaceChildren();
    footer.replaceChildren();
    for (const [name, label, value, multiline, caret] of fields) {
      const group = document.createElement('label');
      const input = document.createElement(multiline ? 'textarea' : 'input');
      input.name = name;
      input.value = value;
      if (multiline) {
        input.rows = Math.min(10, Math.max(3, value.split('\n').length));
        input.setSelectionRange(caret, caret);
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing) {
            event.preventDefault();
            form.requestSubmit();
          }
        });
      }
      group.append(label, input);
      inputs.append(group);
    }
    if (extraActions.length) {
      const label = document.createElement('label');
      const select = document.createElement('select');
      select.name = 'operation';
      for (const [value, text] of [['save', 'Update'], ...extraActions]) {
        select.add(new Option(text, value));
      }
      label.append('Action', select);
      inputs.append(label);
    }
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => editDialog.close());
    const confirm = document.createElement('button');
    confirm.type = 'submit';
    confirm.textContent = 'Apply';
    confirm.className = 'primary-button';
    footer.append(cancel, confirm);
    form.onsubmit = (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const patch = source.value === snapshot ? apply(data, data.operation || 'save') : 'The Markdown changed. Reopen this editor to try again.';
      if (typeof patch === 'string') {
        error.textContent = patch;
        error.hidden = false;
        return;
      }
      editDialog.close();
      if (patch) applyVisualPatch(...patch);
    };
    editDialog.showModal();
    const first = inputs.querySelector('input,textarea');
    first.focus();
    if (first.tagName !== 'TEXTAREA') first.select();
  }

  function editVisualListItem(span, index, allowStructure = true) {
    const lines = blockLines(span.text);
    const line = lines[index];
    if (!line) return;
    const item = window.markdownVisionReader.readListItem(line.text);
    if (!item || (item.indent && allowStructure)) return;
    const trailing = item.body.match(/[ \t]*$/)[0];
    const itemText = item.body.slice(0, item.body.length - trailing.length);
    showVisualEdit('Edit list item', [['text', 'Item text (Markdown)', itemText]], ({ text }, action) => {
      if (action === 'add') {
        const marker = item.marker.replace(/^\d+/, (number) => String(Number(number) + 1));
        const prefix = item.prefix.replace(item.marker, marker);
        const task = item.task ? '[ ]' + item.taskSpacing : '';
        return [span.start + line.end, span.start + line.end, '\n' + prefix + task + 'New item'];
      }
      if (action === 'remove') {
        const start = index === lines.length - 1 && index > 0 ? line.start - 1 : line.start;
        const end = index < lines.length - 1 ? line.end + 1 : line.end;
        return [span.start + start, span.start + end, ''];
      }
      if (text === itemText) return null;
      if (!text.trim()) return allowStructure ? 'Enter item text or choose Remove item.' : 'Enter item text.';
      return [span.start + line.start + item.bodyStart, span.start + line.end - trailing.length, text.trim()];
    }, allowStructure ? [['add', 'Add item below'], ['remove', 'Remove item']] : []);
  }

  function editDirectListItem(target) {
    const item = target?.closest('li');
    const span = item && displayedBlock(item);
    if (!span || item.parentElement !== span.node) return false;
    editVisualListItem(span, [...item.parentElement.children].indexOf(item));
    return true;
  }

  function toggleVisualTask(span, index) {
    const line = blockLines(span.text)[index];
    if (!line) return;
    const item = window.markdownVisionReader.readListItem(line.text);
    if (!item?.task) return;
    const marker = span.start + line.start + item.prefix.length + 1;
    applyVisualPatch(marker, marker + 1, item.task === '[ ]' ? 'x' : ' ');
  }

  function editVisualCodeLanguage(span) {
    const code = closedCodeBlock(span.text);
    if (!code) return;
    const [, delimiter, info] = code.opener;
    const [, spacing, language, rest] = info.match(/^([ \t]*)([^\s]*)(.*)$/);
    showVisualEdit('Change code language', [['language', 'Language', language]], ({ language: value }) => {
      const next = value.trim();
      if (next && !/^[\w.+#-]+$/.test(next)) return 'Enter a single language name, such as javascript or c++.';
      if (!next && rest.trim()) return 'Use Markdown to remove the language while keeping the extra options on the opening line.';
      const from = span.start + delimiter.length + spacing.length;
      return [from, from + language.length, next];
    });
  }

  function readMultilineCell(markdown) {
    const visible = window.markdownVisionReader.withoutInlineCode(markdown);
    const breaks = [];
    let value = '';
    let start = 0;
    for (const match of visible.matchAll(/(\\*)<br[ \t]*\/?>/gi)) {
      const slashes = match[1].length;
      if (slashes % 2) continue;
      const position = match.index + slashes;
      const end = match.index + match[0].length;
      value += markdown.slice(start, position) + '\n';
      breaks.push(markdown.slice(position, end));
      start = end;
    }
    return { value: value + markdown.slice(start), breaks };
  }

  function writeMultilineCell(value, breaks) {
    const lines = value.replace(/\r\n?/g, '\n').split('\n');
    return lines.map((line, index) => {
      const precedingBreak = index ? breaks[index - 1] || '<br>' : '';
      const slashes = line.match(/\\+$/)?.[0].length || 0;
      const escape = index < lines.length - 1 && slashes % 2 ? '\\' : '';
      return precedingBreak + line + escape;
    })
      .join('').trim().replace(/(\\*)\|/g, (match, slashes) => slashes.length % 2 ? match : slashes + '\\|');
  }

  function renderedCellText(root) {
    let text = '';
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.TEXT_NODE) text += node.data;
      else if (node.tagName === 'BR') text += '\n';
    }
    return text;
  }

  function tableEditCaret(control, value, event) {
    if (!event) return 0;
    const position = document.caretRangeFromPoint(event.clientX, event.clientY);
    if (!position || !control.contains(position.startContainer)) return 0;
    const parts = [...value.matchAll(/\\([\\\x60*_[\]{}()#+\-.!|<>~])|[\s\S]/g)];
    if (parts.map((part) => part[1] || part[0]).join('') !== renderedCellText(control)) return 0;
    const prefix = document.createRange();
    prefix.setStart(control, 0);
    prefix.setEnd(position.startContainer, position.startOffset);
    return parts[renderedCellText(prefix.cloneContents()).length]?.index ?? value.length;
  }

  function editVisualTableCell(span, control, event) {
    const rows = editableTable(span.text);
    const rowIndex = Number(control.dataset.row);
    const column = Number(control.dataset.index);
    const index = rowIndex ? rowIndex + 1 : 0;
    const row = rows?.[index];
    const cell = row?.cells[column];
    if (!cell) return;
    const start = span.start + row.start + cell.start;
    const end = span.start + row.start + cell.end;
    if (control.dataset.visualEdit === 'table-cell-source') {
      focusSource({ start, end }, control);
      return;
    }
    const operations = [['add-row', 'Add row below'], ['add-column', 'Add column after'],
      ['align-left', 'Align column left'], ['align-center', 'Center column'], ['align-right', 'Align column right']];
    if (index) operations.push(['remove-row', 'Remove row']);
    if (row.cells.length > 2) operations.push(['remove-column', 'Remove column']);
    const { value, breaks } = readMultilineCell(row.text.slice(cell.start, cell.end));
    const caret = tableEditCaret(control, value, event);
    showVisualEdit('Edit table cell', [['cell', 'Cell text (Markdown)', value, true, caret]], (data, action) => {
      if (action === 'save') {
        if (data.cell === value) return null;
        const text = writeMultilineCell(data.cell, breaks);
        if (readMultilineCell(text).breaks.length < data.cell.split('\n').length - 1) {
          return 'Close inline code before adding a line break.';
        }
        const next = row.text.slice(0, cell.start) + text + row.text.slice(cell.end);
        if (window.markdownVisionReader.tableCellRanges(next).length !== row.cells.length) {
          return 'This cell text would change the table structure. Add a space before the separator in Markdown.';
        }
        return [start, end, text];
      }
      if (action === 'add-row') {
        const after = rows[Math.max(index, 1)].end;
        const added = '\n|' + '   |'.repeat(row.cells.length);
        return [span.start + after, span.start + after, added];
      }
      if (action === 'remove-row') return [span.start + row.start - 1, span.start + row.end, ''];
      const replacement = rows.map((line, i) => {
        const part = line.cells[column];
        if (action === 'add-column') {
          const text = i === 0 ? ' New column ' : i === 1 ? ' --- ' : '   ';
          return line.text.slice(0, part.fieldEnd) + '|' + text + line.text.slice(part.fieldEnd);
        }
        if (action === 'remove-column') {
          const last = column === line.cells.length - 1;
          return line.text.slice(0, part.fieldStart - Number(last)) + line.text.slice(part.fieldEnd + Number(!last));
        }
        if (i !== 1) return line.text;
        const dashes = line.text.slice(part.start, part.end).replaceAll(':', '');
        const mark = action === 'align-left' ? ':' + dashes : action === 'align-center' ? ':' + dashes + ':' : dashes + ':';
        return line.text.slice(0, part.start) + mark + line.text.slice(part.end);
      }).join('\n');
      return [span.start, span.end, replacement];
    }, control.dataset.tableStructure === 'true' ? operations : []);
  }

  function editVisualAsset(span, target) {
    if (target.closest('code') || span.node.classList.contains('visual-protected-block')) return;
    const nodes = [...span.node.querySelectorAll('a,img')].filter((node) => !node.matches('img') || !node.closest('a'));
    const assets = window.markdownVisionReader.readInlineAssets(span.text);
    const item = assets[nodes.indexOf(target.closest('a') || target)];
    if (!item || nodes.length !== assets.length || nodes.some((node, index) => {
      const { type, url, imageUrl } = assets[index];
      if (type === 'image') return !node.matches('img') || node.getAttribute('src') !== url;
      return !node.matches('a') || node.getAttribute('href') !== url
        || (type === 'linked-image' && node.querySelector('img')?.getAttribute('src') !== imageUrl);
    })) {
      focusSource(span);
      return;
    }
    const isImage = item.type !== 'link';
    const linked = item.type === 'linked-image';
    const fields = [['label', isImage ? 'Alt text' : 'Link text (Markdown)', item.label]];
    if (linked) fields.push(['imageUrl', 'Image URL', item.imageUrl]);
    fields.push(['url', linked ? 'Link URL' : 'URL', item.url]);
    showVisualEdit(linked ? 'Edit linked image' : isImage ? 'Edit image' : 'Edit link', fields, (data) => {
      if ((!isImage && !data.label.trim()) || data.label.includes(']')) return 'Enter text without a closing bracket.';
      const url = data.url.trim();
      const imageUrl = linked ? data.imageUrl.trim() : url;
      const validUrl = (value) => /^https?:\/\/[^\s()<>"\\]+$/.test(value);
      if (!validUrl(url) || !validUrl(imageUrl)) return 'Enter an HTTP or HTTPS URL without spaces or parentheses.';
      const asset = (isImage ? '!' : '') + '[' + data.label + '](' + imageUrl + ')';
      return [span.start + item.start, span.start + item.end, linked ? '[' + asset + '](' + url + ')' : asset];
    });
  }

  function runVisualEdit(target, event) {
    const control = target.closest('[data-visual-edit]') || target.closest('a,img');
    if (!control) return;
    const span = displayedBlock(control);
    if (!span) return;
    const index = Number(control.dataset.index);
    switch (control.dataset.visualEdit) {
      case 'source': focusBlockSource(span); break;
      case 'code-language': editVisualCodeLanguage(span); break;
      case 'table-cell-source': showRestriction(control); break;
      case 'table-cell': editVisualTableCell(span, control, event); break;
      case 'list-item': editVisualListItem(span, index); break;
      case 'list-text': editVisualListItem(span, index, false); break;
      case 'task': toggleVisualTask(span, index); break;
      default:
        if (!control.closest('table')) editVisualAsset(span, control);
    }
  }

  function syncVisualDraft() {
    if (!active || !preview.isContentEditable) return;
    clearTimeout(previewTimer);
    const intact = new Set([...preview.children]
      .filter((node) => node.contentEditable === 'false')
      .map((node) => node.dataset.visualBlock));
    const missing = [...visualBlocks].find(([id, block]) => block.locked && !intact.has(id));
    if (missing) {
      preview.innerHTML = lastVisualHtml;
      restoreCodeEditors();
      const restored = preview.querySelector('[data-visual-block="' + missing[0] + '"]');
      if (restored) showRestriction(restored);
      return;
    }
    const onBaseline = visualBaseline?.html === preview.innerHTML
      && ![...preview.querySelectorAll('.visual-code-editor')].some((field) => {
        const baseline = visualBlocks.get(field.closest('[data-visual-block]').dataset.visualBlock);
        return !baseline || field.value !== closedCodeBlock(baseline.source)?.body;
      });
    const markdown = onBaseline ? visualBaseline.source : visualMarkdown(preview);
    if (onBaseline) visualRanges = new Map([...visualBlocks].map(([id, { start, end }]) => [id, { start, end }]));
    lastVisualHtml = preview.innerHTML;
    if (markdown !== source.value) source.value = markdown;
    previewSource = source.value;
    updateDirty();
  }

  function updateCursor() {
    const before = source.value.slice(0, source.selectionStart);
    const lines = before.split('\n');
    $('#editorCursor').textContent = `Ln ${lines.length}, Col ${lines.at(-1).length + 1}`;
  }

  function selectView(view, surface = view === 'source' ? source : preview) {
    hideRestriction();
    panes.dataset.view = view;
    document.querySelectorAll('[data-view]').forEach((button) => {
      if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.view === view));
    });
    editingSurface = surface;
    updatePreview();
    updateTools();
    if (editingSurface === source || preview.isContentEditable) editingSurface.focus({ preventScroll: true });
    window.markdownVisionReader.refreshEditorSearch({ preserve: true });
  }

  function resizeSplit(percent) {
    const width = Math.min(maxSourceShare, Math.max(minSourceShare, percent));
    panes.style.setProperty('--source-pane-share', String(width / 100));
    const rounded = Math.round(width);
    divider.setAttribute('aria-valuenow', String(rounded));
    divider.setAttribute('aria-valuetext', rounded + '% Markdown');
    positionRestriction();
    scheduleSearchPaint(true);
  }

  function setActive(value) {
    hideRestriction();
    const newDocument = value && !window.markdownVisionReader.getDocument();
    if (newDocument) {
      window.markdownVisionReader.showDocument('', 'Untitled.md');
    }
    active = value;
    toggle.setAttribute('aria-pressed', String(value));
    toggle.setAttribute('aria-label', value ? 'Return to reader' : 'Edit Markdown');
    toggle.title = value ? 'Return to reader' : 'Edit Markdown';
    tools.hidden = !value;
    workspace.hidden = !value;
    reader.hidden = value || !window.markdownVisionReader.getDocument();
    document.body.classList.toggle('is-editing', value);
    if (value) {
      tools.scrollLeft = 0;
      selectView(newDocument ? 'visual' : panes.dataset.view);
    } else if (dirty || (saved && (window.markdownVisionReader.getDocument()?.content !== source.value
        || window.markdownVisionReader.getDocument()?.documentId !== documentId))) {
      showDraftInReader();
      updateDirty();
    } else window.markdownVisionReader.refreshEditorSearch();
    window.markdownVisionReader.updatePrintButton();
  }

  function replaceSelection(transform, block = false) {
    const start = source.selectionStart;
    const end = source.selectionEnd;
    const direction = source.selectionDirection;
    const selected = source.value.slice(start, end);
    let from = start;
    let to = end;
    if (block) {
      from = source.value.lastIndexOf('\n', start - 1) + 1;
      const nextLine = source.value.indexOf('\n', end > start && source.value[end - 1] === '\n' ? end - 1 : end);
      to = nextLine < 0 ? source.value.length : nextLine;
    }
    const changed = transform(block ? source.value.slice(from, to) : selected);
    source.focus();
    source.setSelectionRange(from, to, direction);
    if (!document.execCommand(changed.text ? 'insertText' : 'delete', false, changed.text)) {
      source.setRangeText(changed.text, from, to);
      source.dispatchEvent(new Event('input', { bubbles: true }));
    }
    source.setSelectionRange(from + changed.start, from + changed.end, direction);
    updateCursor();
  }

  const sourceBlockFormats = {
    heading: /^(#{1,6})[ \t]+/,
    list: /^([ \t]*)[-+*][ \t]+(?!\[[ xX]\][ \t])/,
    ordered: /^([ \t]*)\d+[.)][ \t]+/,
    task: /^([ \t]*)[-+*][ \t]+\[[ xX]\][ \t]+/,
    quote: /^>[ \t]?/
  };
  const listPrefix = /^([ \t]*)(?:[-+*]|\d+[.)])[ \t]+(?:\[[ xX]\][ \t]+)?/;
  const sourceMarkers = { bold: '**', italic: '*', strike: '~~', code: '\x60' };
  const markerExpressions = {
    bold: /(?<![\\*])\*\*[^*\n]+\*\*(?!\*)|(?<![\\_])__[^_\n]+__(?!_)/g,
    italic: /(?<![\\*])\*[^*\n]+\*(?!\*)/g,
    strike: /(?<![\\~])~~[^~\n]+~~(?!~)/g,
    code: /(?<![\\\x60])\x60[^\x60\n]+\x60(?!\x60)/g
  };

  function nextHeadingLevel(levels) {
    const current = levels[0] || 0;
    return levels.every((level) => level === current) ? (current + 1) % 7 : 1;
  }

  function sourceBlockToggle(command) {
    const pattern = sourceBlockFormats[command];
    replaceSelection((text) => {
      const lines = text.split('\n');
      const nonblank = lines.filter((line) => line.trim());
      if (command === 'heading') {
        const level = nextHeadingLevel(nonblank.map((line) => line.match(pattern)?.[1].length || 0));
        const prefix = level ? '#'.repeat(level) + ' ' : '';
        const output = lines.map((line) => line.trim() || lines.length === 1
          ? prefix + line.replace(pattern, '') : line).join('\n');
        return { text: output, start: 0, end: output.length };
      }
      const remove = nonblank.length > 0 && nonblank.every((line) => pattern.test(line));
      let number = 0;
      const output = lines.map((line) => {
        if (!line.trim() && lines.length > 1) return line;
        if (remove) return line.replace(pattern, command === 'quote' ? '' : '$1');
        if (pattern.test(line) && command !== 'ordered') return line;
        if (command === 'quote') return '> ' + line;
        const indent = line.match(/^[ \t]*/)[0];
        const prefix = command === 'ordered' ? (++number) + '. ' : command === 'task' ? '- [ ] ' : '- ';
        return indent + prefix + line.replace(listPrefix, '$1').slice(indent.length);
      }).join('\n');
      return { text: output, start: 0, end: output.length };
    }, true);
  }

  function sourceInlineToggle(command) {
    const marker = sourceMarkers[command];
    const value = source.value;
    const selectionStart = source.selectionStart;
    const selectionEnd = source.selectionEnd;
    const matches = [...value.matchAll(markerExpressions[command])];
    const isCaret = selectionStart === selectionEnd;
    const matchingCaret = matches.find((match) => match.index < selectionStart && match.index + match[0].length > selectionStart);
    const from = isCaret && matchingCaret ? matchingCaret.index : selectionStart;
    const to = isCaret && matchingCaret ? matchingCaret.index + matchingCaret[0].length : selectionEnd;
    const spans = matches.filter((match) => match.index < to && match.index + match[0].length > from);
    // Expand to whole formatted runs at the edges. This keeps delimiters paired
    // even when the user selects only part of an existing run.
    const start = Math.min(from, spans[0]?.index ?? from);
    const last = spans.at(-1);
    const end = Math.max(to, last ? last.index + last[0].length : to);
    let cursor = start;
    const parts = [];
    for (const span of spans) {
      parts.push({ text: value.slice(cursor, span.index), formatted: false });
      parts.push({ text: span[0], formatted: true });
      cursor = span.index + span[0].length;
    }
    parts.push({ text: value.slice(cursor, end), formatted: false });
    const remove = spans.length > 0 && parts.every((part) => part.formatted || !part.text.trim());
    const changed = remove
      ? parts.map(({ text, formatted }) => formatted ? text.slice(marker.length, -marker.length) : text).join('')
      : parts.map(({ text, formatted }) => formatted ? text.slice(marker.length, -marker.length) : text)
        .join('').replace(/\S(?:[^\n]*\S)?/g, (line) => marker + line + marker);
    source.setSelectionRange(start, end, source.selectionDirection);
    replaceSelection(() => isCaret && !matchingCaret
      ? { text: marker + marker, start: marker.length, end: marker.length }
      : { text: changed, start: 0, end: changed.length });
  }

  function sourceFenceToggle() {
    const value = source.value;
    const lines = value.split('\n');
    const start = value.slice(0, source.selectionStart).split('\n').length - 1;
    const selectionEnd = source.selectionEnd > source.selectionStart && value[source.selectionEnd - 1] === '\n'
      ? source.selectionEnd - 1 : source.selectionEnd;
    const end = value.slice(0, selectionEnd).split('\n').length - 1;
    const fenced = new Map();
    let opening = null;
    for (const [index, line] of lines.entries()) {
      const fence = window.markdownVisionReader.readCodeFence(line, opening?.delimiter);
      if (!fence) continue;
      if (!opening) opening = { start: index, delimiter: fence[1], end: lines.length - 1 };
      else {
        opening.end = index;
        opening.closed = true;
        for (let row = opening.start; row <= opening.end; row += 1) fenced.set(row, opening);
        opening = null;
      }
    }
    if (opening) for (let row = opening.start; row <= opening.end; row += 1) fenced.set(row, opening);
    const from = fenced.get(start)?.start ?? start;
    const to = fenced.get(end)?.end ?? end;
    const remove = lines.slice(from, to + 1).every((line, i) => !line.trim() || fenced.has(from + i))
      && lines.slice(from, to + 1).some((_, i) => fenced.has(from + i));
    const output = [];
    for (let row = from; row <= to;) {
      const block = fenced.get(row);
      if (block) {
        output.push(...lines.slice(remove ? row + 1 : row, block.end + (remove && block.closed ? 0 : 1)));
        row = block.end + 1;
      } else if (remove || !lines[row].trim()) {
        output.push(lines[row++]);
      } else {
        const first = row++;
        while (row <= to && !fenced.has(row)) row += 1;
        const content = lines.slice(first, row);
        while (content.length > 1 && !content.at(-1).trim()) content.pop();
        output.push(fenceCode(content.join('\n')), ...lines.slice(first + content.length, row));
      }
    }
    if (from === to && !lines[from].trim() && !fenced.has(from)) output.splice(0, 1, fenceCode(lines[from]));
    const offset = (line) => line ? lines.slice(0, line).join('\n').length + 1 : 0;
    source.setSelectionRange(offset(from), offset(to) + lines[to].length, source.selectionDirection);
    const text = output.join('\n');
    replaceSelection(() => ({ text, start: 0, end: text.length }));
  }

  const commands = {
    table: () => {
      const columns = Number(window.prompt('Number of columns (2–8)', '3'));
      if (!Number.isInteger(columns) || columns < 2 || columns > 8) return;
      const heading = Array.from({ length: columns }, (_, index) => `Header ${index + 1}`);
      const row = Array.from({ length: columns }, () => 'Cell');
      const value = `| ${heading.join(' | ')} |\n| ${heading.map(() => '---').join(' | ')} |\n| ${row.join(' | ')} |`;
      const end = source.selectionEnd;
      const lineEnd = source.value.indexOf('\n', end);
      const insertAt = lineEnd < 0 ? source.value.length : lineEnd;
      source.setSelectionRange(insertAt, insertAt);
      const prefix = insertAt ? '\n\n' : '';
      const suffix = insertAt < source.value.length ? '\n' : '';
      replaceSelection(() => ({ text: prefix + value + suffix, start: prefix.length + 2, end: prefix.length + 2 + heading[0].length }));
    },
    link: () => {
      const start = source.selectionStart;
      const end = source.selectionEnd;
      const links = [...source.value.matchAll(/(?<![!\\])\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g)];
      const matches = links.filter((match) => match.index < end && match.index + match[0].length > start);
      const from = Math.min(start, matches[0]?.index ?? start);
      const tail = matches.at(-1);
      const to = Math.max(end, tail ? tail.index + tail[0].length : end);
      const parts = [];
      let cursor = from;
      for (const match of matches) {
        parts.push({ raw: source.value.slice(cursor, match.index) });
        parts.push({ raw: match[0], label: match[1] });
        cursor = match.index + match[0].length;
      }
      parts.push({ raw: source.value.slice(cursor, to) });
      const remove = matches.length > 0 && parts.every((part) => part.label || !part.raw.trim());
      const url = remove ? '' : window.prompt('Link URL', 'https://')?.trim();
      if (!remove && !/^https?:\/\/[^\s()]+$/i.test(url || '')) return;
      const wrap = (label) => '[' + label + '](' + url + ')';
      const text = from === to ? wrap('link text') : parts.map(({ label, raw }) => {
        if (label) return remove ? label : raw;
        return remove ? raw : raw.replace(/\S(?:[^\n]*\S)?/g, wrap);
      }).join('');
      source.setSelectionRange(from, to, source.selectionDirection);
      replaceSelection(() => ({ text, start: from === to ? 1 : 0, end: from === to ? 10 : text.length }));
    },
    undo: () => document.execCommand('undo'),
    redo: () => document.execCommand('redo')
  };

  const visualCommands = {
    bold: ['bold'], italic: ['italic'], strike: ['strikeThrough'],
    list: ['insertUnorderedList'], ordered: ['insertOrderedList'],
  };
  const visualBlocksByCommand = { heading: 'h1,h2,h3,h4,h5,h6', quote: 'blockquote', codeblock: 'pre' };
  const visualMarks = { bold: 'b,strong', italic: 'i,em', strike: 's,del,strike', code: 'code', link: 'a' };
  const visualListTypes = { list: 'ul', ordered: 'ol' };

  function visualRange() {
    const range = currentVisualRange();
    return protectedEditTarget(null, range) ? null : range;
  }

  function visualRuns(range, root = preview) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const runs = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!range.intersectsNode(node)) continue;
      const start = node === range.startContainer ? range.startOffset : 0;
      const end = node === range.endContainer ? range.endOffset : node.length;
      if (end > start) runs.push({ node, start, end });
    }
    return runs;
  }

  function visualTargets(range) {
    if (!range) return [];
    const blocks = [...preview.children].filter((node) => range.intersectsNode(node));
    if (range.collapsed) return blocks;
    const runs = visualRuns(range);
    return blocks.filter((node) => runs.some((run) => node.contains(run.node)) || !node.textContent);
  }

  function visualFormatState(command, range) {
    if (!range) return false;
    const blockSelector = visualBlocksByCommand[command];
    if (blockSelector) {
      const blocks = visualTargets(range);
      return !!blocks.length && blocks.every((block) => block.matches(blockSelector));
    }
    const selector = visualMarks[command] || visualListTypes[command];
    if (!selector) return false;
    const inside = (node) => (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement).closest(selector);
    if (range.collapsed) return Boolean(inside(range.startContainer));
    const runs = visualRuns(range).filter(({ node, start, end }) => node.data.slice(start, end).trim());
    return !!runs.length && runs.every(({ node }) => inside(node));
  }

  function pointAtTextOffset(root, offset, preferEnd = false) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let last = null;
    while (walker.nextNode()) {
      last = walker.currentNode;
      if (offset < last.length || (preferEnd && offset === last.length)) return [last, offset];
      offset -= last.length;
    }
    return last ? [last, last.length] : [root, 0];
  }

  function textOffset(root, container, offset) {
    const range = document.createRange();
    range.selectNodeContents(root);
    range.setEnd(container, offset);
    return range.toString().length;
  }

  function selectTextOffsets(root, start, end, backward) {
    const first = pointAtTextOffset(root, start);
    const last = start === end ? first : pointAtTextOffset(root, end, true);
    window.getSelection().setBaseAndExtent(...(backward ? [...last, ...first] : [...first, ...last]));
  }

  function visualSnapshot(html = preview.innerHTML) {
    const selection = window.getSelection();
    const point = (node, offset) => preview.contains(node) ? textOffset(preview, node, offset) : 0;
    const field = document.activeElement.closest('.visual-code-editor');
    return {
      html,
      markdown: source.value,
      blocks: visualBlocks,
      ranges: visualRanges,
      origins: visualCodeOrigins,
      baseline: visualBaseline,
      codeSelection: field ? {
        id: field.closest('[data-visual-block]').dataset.visualBlock,
        start: field.selectionStart, end: field.selectionEnd, direction: field.selectionDirection,
        top: field.scrollTop, left: field.scrollLeft
      } : null,
      anchor: point(selection.anchorNode, selection.anchorOffset),
      focus: point(selection.focusNode, selection.focusOffset)
    };
  }

  function rememberVisualChange(before, inputType = '') {
    if (before.html === lastVisualHtml && before.markdown === source.value) return;
    const time = performance.now();
    const typing = /^(insertText|insertCompositionText|deleteContentBackward|deleteContentForward)$/.test(inputType);
    const start = before.codeSelection?.start ?? before.anchor;
    const end = before.codeSelection?.end ?? before.focus;
    const merge = typing && lastTyping?.type === inputType && time - lastTyping.time < 700
      && lastTyping.codeId === before.codeSelection?.id && lastTyping.position === start && start === end;
    if (!merge) visualUndo.push(before);
    let bytes = 0;
    for (let i = visualUndo.length - 1; i >= 0; i -= 1) {
      bytes += visualUndo[i].html.length + visualUndo[i].markdown.length;
      if (i < visualUndo.length - 1 && (bytes > 4_000_000 || visualUndo.length - i > 100)) {
        visualUndo.splice(0, i + 1);
        break;
      }
    }
    visualRedo.length = 0;
    const after = typing ? visualSnapshot() : null;
    lastTyping = after ? { type: inputType, time, codeId: after.codeSelection?.id,
      position: after.codeSelection?.start ?? after.anchor } : null;
  }

  function restoreCodeEditors() {
    for (const field of preview.querySelectorAll('.visual-code-editor')) {
      const span = displayedBlock(field);
      if (!span) continue;
      field.value = closedCodeBlock(span.text)?.body ?? '';
      resizeCodeEditor(field);
    }
  }

  function stepVisualHistory(command) {
    const from = command === 'undo' ? visualUndo : visualRedo;
    const to = command === 'undo' ? visualRedo : visualUndo;
    const snapshot = from.pop();
    if (!snapshot) return;
    hideRestriction();
    to.push(visualSnapshot());
    preview.innerHTML = snapshot.html;
    source.value = snapshot.markdown;
    previewSource = source.value;
    lastVisualHtml = snapshot.html;
    visualBlocks = snapshot.blocks;
    visualRanges = snapshot.ranges;
    visualCodeOrigins = snapshot.origins;
    visualBaseline = snapshot.baseline;
    restoreCodeEditors();
    $('#visualEditorNotice').hidden = !preview.querySelector('.visual-protected-block');
    const caret = snapshot.codeSelection;
    const field = caret && preview.querySelector('[data-visual-block="' + caret.id + '"] .visual-code-editor');
    if (field) {
      field.focus({ preventScroll: true });
      field.setSelectionRange(caret.start, caret.end, caret.direction);
      field.scrollTop = caret.top;
      field.scrollLeft = caret.left;
    } else {
      preview.focus({ preventScroll: true });
      selectTextOffsets(preview, Math.min(snapshot.anchor, snapshot.focus), Math.max(snapshot.anchor, snapshot.focus),
        snapshot.anchor > snapshot.focus);
    }
    lastTyping = null;
    updateDirty();
    updateTools();
  }

  function replaceVisualSelection(range, transform) {
    const start = textOffset(preview, range.startContainer, range.startOffset);
    const end = textOffset(preview, range.endContainer, range.endOffset);
    const backward = window.getSelection().anchorNode === range.endContainer
      && window.getSelection().anchorOffset === range.endOffset;
    const draft = preview.cloneNode(true);
    transform(draft, start, end);
    if (draft.innerHTML === preview.innerHTML) return;
    preview.replaceChildren(...draft.childNodes);
    restoreCodeEditors();
    selectTextOffsets(preview, start, end, backward);
  }

  function toggleVisualMark(command, range) {
    const selector = visualMarks[command];
    const remove = visualFormatState(command, range);
    if (range.collapsed && !remove) return;
    const caretContainer = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer : range.startContainer.parentElement;
    const caretMark = range.collapsed && caretContainer.closest(selector);
    const caretStart = caretMark ? textOffset(preview, caretMark, 0) : null;
    const caretEnd = caretMark ? caretStart + caretMark.textContent.length : null;
    const url = command === 'link' && !remove ? window.prompt('Link URL', 'https://')?.trim() : null;
    if (command === 'link' && !remove && !/^https?:\/\/[^\s()]+$/i.test(url || '')) return;
    replaceVisualSelection(range, (draft, start, end) => {
      const selected = document.createRange();
      selected.setStart(...pointAtTextOffset(draft, caretStart ?? start));
      selected.setEnd(...pointAtTextOffset(draft, caretEnd ?? end, true));
      if (remove) {
        for (const mark of [...draft.querySelectorAll(selector)]) {
          if (!mark.isConnected && !draft.contains(mark)) continue;
          if (mark.closest('pre')) continue;
          const offset = textOffset(draft, mark, 0);
          const from = Math.max(0, (caretStart ?? start) - offset);
          const to = Math.min(mark.textContent.length, (caretEnd ?? end) - offset);
          if (from >= to) continue;
          const split = (left, right) => {
            const clone = mark.cloneNode(true);
            const tail = document.createRange();
            tail.selectNodeContents(clone);
            tail.setStart(...pointAtTextOffset(clone, right, true));
            tail.deleteContents();
            const head = document.createRange();
            head.selectNodeContents(clone);
            head.setEnd(...pointAtTextOffset(clone, left));
            head.deleteContents();
            return [...clone.childNodes];
          };
          const before = mark.cloneNode(false);
          const after = mark.cloneNode(false);
          const middle = split(from, to);
          if (from) before.append(...split(0, from));
          if (to < mark.textContent.length) after.append(...split(to, mark.textContent.length));
          mark.replaceWith(...(from ? [before] : []), ...middle, ...(after.hasChildNodes() ? [after] : []));
        }
      } else {
        for (const { node, start: at, end: until } of visualRuns(selected, draft).reverse()) {
          if (node.parentElement.closest(selector + ',pre') || !node.data.slice(at, until).trim()) continue;
          const part = node.splitText(at);
          part.splitText(until - at);
          const mark = document.createElement(({ bold: 'strong', italic: 'em', strike: 'del', code: 'code', link: 'a' })[command]);
          if (url) mark.setAttribute('href', url);
          part.replaceWith(mark);
          mark.append(part);
        }
        draft.normalize();
        for (const mark of [...draft.querySelectorAll(selector)]) {
          while (mark.nextSibling?.nodeType === Node.ELEMENT_NODE
            && mark.nextSibling.matches(selector)
            && mark.getAttribute('href') === mark.nextSibling.getAttribute('href')) {
            const next = mark.nextSibling;
            mark.append(...next.childNodes);
            next.remove();
          }
        }
      }
    });
  }

  function toggleVisualBlock(command, range) {
    const targets = visualTargets(range);
    const selector = visualBlocksByCommand[command];
    const allowed = command === 'heading' ? 'p,div,' + selector : 'p,div,h1,h2,h3,h4,h5,h6,pre,blockquote';
    const blocks = targets.filter((node) => node.matches(allowed));
    if (command === 'heading') {
      const level = nextHeadingLevel(blocks.map((block) => Number(block.localName.match(/^h([1-6])$/)?.[1] || 0)));
      const tag = level ? 'h' + level : 'p';
      if (targets.length === 0) {
        document.execCommand('formatBlock', false, tag);
      } else if (blocks.length) {
        replaceVisualBlocks(range, blocks, (block) => {
          const replacement = document.createElement(tag);
          replacement.append(...block.childNodes);
          return replacement;
        });
      }
      return;
    }
    if (!blocks.length) {
      document.execCommand('formatBlock', false, command === 'quote' ? 'blockquote' : 'pre');
      return;
    }
    if (command === 'codeblock') {
      toggleVisualCodeBlocks(range, blocks);
      return;
    }
    const remove = blocks.every((node) => node.matches(selector));
    if (remove) {
      document.execCommand('outdent');
      return;
    }
    replaceVisualBlocks(range, blocks, (block) => {
      if (block.matches(selector)) return block;
      const replacement = document.createElement('blockquote');
      if (block.matches('pre')) {
        for (const [index, line] of block.textContent.split('\n').entries()) {
          if (index) replacement.append(document.createElement('br'));
          replacement.append(line);
        }
      } else replacement.append(...block.childNodes);
      return replacement;
    });
  }

  function toggleVisualCodeBlocks(range, blocks) {
    const remove = blocks.every((block) => block.matches('pre'));
    const selection = window.getSelection();
    const collapsed = range.collapsed;
    const backward = selection.anchorNode === range.endContainer && selection.anchorOffset === range.endOffset;
    const caret = collapsed && blocks[0].contains(range.startContainer)
      ? textOffset(blocks[0], range.startContainer, range.startOffset) : 0;
    const replacements = blocks.map((block) => {
      if (remove) {
        const text = visualCodeText(block);
        const origin = visualCodeOrigins.get(block.dataset.codeOrigin);
        if (origin?.text === text) return origin.block.cloneNode(true);
        const paragraph = document.createElement('p');
        paragraph.dataset.unfenced = '';
        paragraph.textContent = text;
        return paragraph;
      }
      if (block.matches('pre')) return block;
      const originalBlock = visualBlocks.get(block.dataset.visualBlock);
      let text = originalBlock?.source;
      if (!originalBlock || block.outerHTML !== originalBlock.html) {
        text = '';
        if (block.childNodes.length !== 1 || block.firstChild.nodeName !== 'BR') {
          const container = document.createElement('div');
          container.append(block.cloneNode(true));
          text = visualMarkdown(container, true);
        }
      }
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = text;
      pre.append(code);
      pre.dataset.codeOrigin = String(nextCodeOrigin++);
      visualCodeOrigins.set(pre.dataset.codeOrigin, { block: block.cloneNode(true), text });
      return pre;
    });
    blocks.forEach((block, index) => {
      if (block.dataset.visualBlock) replacements[index].dataset.visualBlock = block.dataset.visualBlock;
      block.replaceWith(replacements[index]);
    });
    const first = replacements[0];
    const last = replacements.at(-1);
    if (collapsed) {
      selection.collapse(...pointAtTextOffset(first, caret));
    } else {
      const start = [first, 0];
      const end = [last, last.childNodes.length];
      selection.setBaseAndExtent(...(backward ? [...end, ...start] : [...start, ...end]));
    }
  }

  function replaceVisualBlocks(range, blocks, transform) {
    const children = [...preview.children];
    const indices = blocks.map((block) => children.indexOf(block));
    replaceVisualSelection(range, (draft) => {
      const copies = [...draft.children];
      for (const index of indices) {
        const current = copies[index];
        const replacement = transform(current);
        if (current.dataset.visualBlock) replacement.dataset.visualBlock = current.dataset.visualBlock;
        current.replaceWith(replacement);
      }
    });
  }

  function toggleVisualList(command, range) {
    const tag = visualListTypes[command];
    const targets = visualTargets(range).filter((node) => node.matches('p,div,h1,h2,h3,h4,h5,h6,ul,ol'));
    if (!targets.length) {
      document.execCommand(visualCommands[command][0]);
      return;
    }
    if (targets.every((node) => node.matches(tag))) {
      document.execCommand(visualCommands[command][0]);
      return;
    }
    const runs = visualRuns(range);
    const children = [...preview.children];
    const selectedItems = new Map(targets.map((node) => [children.indexOf(node), new Set(
      [...node.children].flatMap((item, index) => item.matches('li') &&
        (range.collapsed ? item.contains(range.startContainer) : runs.some((run) => item.contains(run.node)))
        ? [index] : [])
    )]));
    replaceVisualSelection(range, (draft) => {
      const blocks = [...draft.children];
      for (const [index, selected] of selectedItems) {
        const block = blocks[index];
        if (block.matches('ul,ol')) {
          if (block.matches(tag) || !selected.size) continue;
          const replacement = document.createDocumentFragment();
          let group = null;
          for (const [itemIndex, item] of [...block.children].entries()) {
            const itemTag = selected.has(itemIndex) ? tag : block.localName;
            if (group?.localName !== itemTag) {
              group = document.createElement(itemTag);
              replacement.append(group);
            }
            group.append(item);
          }
          block.replaceWith(replacement);
        } else {
          const group = document.createElement(tag);
          const item = document.createElement('li');
          item.append(...block.childNodes);
          group.append(item);
          block.replaceWith(group);
        }
      }
      for (const group of [...draft.children]) {
        while (group.matches(tag) && group.nextElementSibling?.matches(tag)
            && !group.nextElementSibling.dataset.visualBlock) {
          const next = group.nextElementSibling;
          group.append(...next.childNodes);
          next.remove();
        }
      }
    });
  }

  function updateTools() {
    const range = editingSurface === preview ? visualRange() : null;
    const inCode = document.activeElement.matches('.visual-code-editor');
    for (const button of tools.querySelectorAll('[data-command]')) {
      const { command } = button.dataset;
      const history = command === 'undo' || command === 'redo';
      button.disabled = editingSurface === preview && (!preview.isContentEditable
        || (!history && (inCode || !(command in visualCommands || command in visualMarks || command in visualBlocksByCommand))));
      if (command in visualMarks || command in visualBlocksByCommand || command in sourceBlockFormats) {
        if (editingSurface === preview && !button.disabled) {
          button.setAttribute('aria-pressed', String(visualFormatState(command, range)));
        } else button.removeAttribute('aria-pressed');
      }
    }
    $('#editorCursor').hidden = editingSurface === preview;
  }

  function runCommand(command) {
    if (editingSurface === source) {
      source.focus();
      if (command in sourceMarkers) sourceInlineToggle(command);
      else if (command in sourceBlockFormats) sourceBlockToggle(command);
      else if (command === 'codeblock') sourceFenceToggle();
      else commands[command]?.();
      return;
    }
    if (!preview.isContentEditable) return;
    const history = command === 'undo' || command === 'redo';
    if (!history) {
      if (document.activeElement.matches('.visual-code-editor')) return;
      const protectedBlock = protectedEditTarget(document.activeElement);
      if (protectedBlock) {
        showRestriction(protectedBlock);
        return;
      }
    }
    if (history) {
      stepVisualHistory(command);
      return;
    }
    preview.focus();
    document.execCommand('styleWithCSS', false, false);
    const range = visualRange();
    if (!range) return;
    const before = visualSnapshot();
    visualCommandActive = true;
    try {
      if (command in visualBlocksByCommand) {
        toggleVisualBlock(command, range);
      } else if (command in visualListTypes) {
        toggleVisualList(command, range);
      } else if (command in visualMarks && (!range.collapsed || command === 'code' || command === 'link')) {
        toggleVisualMark(command, range);
      } else if (visualCommands[command]) {
        const [action, argument] = visualCommands[command];
        document.execCommand(action, false, argument);
      }
    } finally {
      visualCommandActive = false;
      syncVisualDraft();
      rememberVisualChange(before);
      updateTools();
    }
  }

  restrictionSource.addEventListener('click', () => {
    const target = restrictionAnchor;
    if (!target) return;
    const span = displayedBlock(target);
    if (!span) {
      hideRestriction(true);
      return;
    }
    if (target.dataset.visualEdit === 'table-cell-source') {
      editVisualTableCell(span, target);
    } else if (target.hasAttribute('data-source-list-item')) {
      const line = blockLines(span.text)[Number(target.dataset.sourceListItem)];
      focusSource(line ? { start: span.start + line.start, end: span.start + line.end } : span, target);
    } else {
      focusBlockSource(span);
    }
  });
  $('#visualRestrictionDismiss').addEventListener('click', () => hideRestriction(true));
  preview.addEventListener('scroll', positionRestriction, { passive: true });
  preview.addEventListener('scroll', () => scheduleSearchPaint(), { capture: true, passive: true });
  source.addEventListener('scroll', () => scheduleSearchPaint(), { passive: true });
  window.addEventListener('resize', positionRestriction);
  window.addEventListener('resize', () => scheduleSearchPaint(true));
  document.addEventListener('pointerdown', (event) => {
    if (restrictionAnchor && !restriction.contains(event.target) && !restrictionAnchor.contains(event.target)) hideRestriction();
  });
  document.addEventListener('keydown', (event) => {
    if (!active || editDialog.open || event.isComposing) return;
    if (event.key === 'Escape' && restrictionAnchor) {
      event.preventDefault();
      hideRestriction(restriction.contains(document.activeElement));
      return;
    }
    if (!preview.contains(event.target) && event.target !== document.body) return;
    if (event.key === 'Tab' && !event.shiftKey && restrictionAnchor) {
      event.preventDefault();
      restrictionSource.focus({ preventScroll: true });
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('button,input,textarea')) return;
    const activatingControl = ['Enter', ' '].includes(event.key) && event.target.matches('td[data-visual-edit],th[data-visual-edit],img[tabindex]');
    if (activatingControl || !(event.key.length === 1 || ['Backspace', 'Delete', 'Enter'].includes(event.key))) return;
    const target = protectedEditTarget(event.target);
    if (target) {
      event.preventDefault();
      showRestriction(target);
    }
  });
  for (const eventType of ['cut', 'paste']) {
    document.addEventListener(eventType, (event) => {
      if (!active || editDialog.open || (!preview.contains(event.target) && event.target !== document.body)) return;
      if (event.target.matches('.visual-code-editor')) return;
      const target = protectedEditTarget(event.target);
      if (target) {
        event.preventDefault();
        event.stopPropagation();
        showRestriction(target);
      }
    }, true);
  }

  toggle.addEventListener('click', () => setActive(!active));
  $('#editorSaveActions').hidden = !window.desktop?.saveMarkdownFile;
  window.markdownVisionReader.isSaving = () => saving;
  window.markdownVisionReader.getPrintDraft = () => active ? { content: source.value, name: fileName } : null;
  saveButton.addEventListener('click', () => saveDraft());
  saveAsButton.addEventListener('click', () => saveDraft(true));
  document.addEventListener('keydown', (event) => {
    if (!active || editDialog.open || event.isComposing || !(event.ctrlKey || event.metaKey)
        || event.altKey || event.key.toLowerCase() !== 's' || !window.desktop?.saveMarkdownFile) return;
    event.preventDefault();
    void saveDraft(event.shiftKey);
  });
  divider.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    dividerGrabOffset = event.clientX - divider.getBoundingClientRect().left;
    divider.setPointerCapture(event.pointerId);
  });
  divider.addEventListener('pointermove', (event) => {
    if (!divider.hasPointerCapture(event.pointerId)) return;
    const bounds = panes.getBoundingClientRect();
    const usableWidth = bounds.width - divider.offsetWidth;
    if (usableWidth > 0) resizeSplit(100 * (event.clientX - bounds.left - dividerGrabOffset) / usableWidth);
  });
  divider.addEventListener('dblclick', () => resizeSplit(50));
  divider.addEventListener('keydown', (event) => {
    const current = Number(divider.getAttribute('aria-valuenow'));
    const widths = { ArrowLeft: current - 5, ArrowRight: current + 5, Home: minSourceShare, End: maxSourceShare };
    if (!Object.hasOwn(widths, event.key)) return;
    event.preventDefault();
    resizeSplit(widths[event.key]);
  });
  document.addEventListener('selectionchange', () => {
    if (active && editingSurface === preview) updateTools();
  });
  tools.addEventListener('mousedown', (event) => {
    if (event.target.closest('button')) event.preventDefault();
  });
  tools.addEventListener('click', (event) => {
    const command = event.target.closest('[data-command]')?.dataset.command;
    if (command) runCommand(command);
  });
  document.querySelectorAll('.editor-views [data-view]').forEach((button) => button.addEventListener('click', () => selectView(button.dataset.view)));
  source.addEventListener('input', () => {
    updateDirty();
    clearTimeout(previewTimer);
    if (panes.dataset.view === 'split') previewTimer = setTimeout(updatePreview, 180);
    updateCursor();
  });
  source.addEventListener('focus', () => {
    hideRestriction();
    editingSurface = source;
    updateTools();
  });
  preview.addEventListener('focusin', (event) => {
    updatePreview();
    if (event.target.matches('.visual-code-editor')) {
      visitedCodeEditors.add(event.target);
      hideRestriction();
    }
    editingSurface = preview;
    updateTools();
  });
  preview.addEventListener('beforeinput', (event) => {
    if (visualCommandActive) return;
    if (event.inputType === 'historyUndo' || event.inputType === 'historyRedo') {
      if (event.cancelable) {
        event.preventDefault();
        stepVisualHistory(event.inputType === 'historyUndo' ? 'undo' : 'redo');
      }
      return;
    }
    if (event.target.matches('.visual-code-editor')) {
      visualInput = visualSnapshot(lastVisualHtml);
      return;
    }
    const boundary = event.getTargetRanges?.()[0];
    let range = currentVisualRange();
    if (boundary && preview.contains(boundary.startContainer) && preview.contains(boundary.endContainer)) {
      range = document.createRange();
      range.setStart(boundary.startContainer, boundary.startOffset);
      range.setEnd(boundary.endContainer, boundary.endOffset);
    }
    const target = protectedEditTarget(event.target, range);
    if (target) {
      showRestriction(target);
      if (event.cancelable) {
        event.preventDefault();
        return;
      }
    } else hideRestriction();
    visualInput = visualSnapshot(lastVisualHtml);
  });
  preview.addEventListener('input', (event) => {
    if (visualCommandActive) return;
    const before = visualInput || visualSnapshot(lastVisualHtml);
    visualInput = null;
    if (event.target.matches('.visual-code-editor')) resizeCodeEditor(event.target);
    syncVisualDraft();
    rememberVisualChange(before, event.inputType);
    updateTools();
  });
  preview.addEventListener('keydown', (event) => {
    if (event.target.matches('.visual-code-editor')
        && (!(event.ctrlKey || event.metaKey) || !['y', 'z'].includes(event.key.toLowerCase()))) return;
    if (!event.isComposing && event.altKey && event.key === 'Enter') {
      const anchor = window.getSelection().anchorNode;
      if (editDirectListItem(anchor?.nodeType === Node.ELEMENT_NODE ? anchor : anchor?.parentElement)) {
        event.preventDefault();
      } else {
        const target = protectedEditTarget(event.target);
        if (target) {
          event.preventDefault();
          showRestriction(target, true);
        }
      }
      return;
    }
    if (!event.isComposing && ['Enter', ' '].includes(event.key)
        && event.target.matches('td[data-visual-edit],th[data-visual-edit],img[tabindex]')) {
      event.preventDefault();
      if (event.target.dataset.visualEdit === 'table-cell-source') showRestriction(event.target, true);
      else runVisualEdit(event.target);
      return;
    }
    if (event.isComposing || !(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    const command = key === 'z' ? (event.shiftKey ? 'redo' : 'undo')
      : ({ b: 'bold', i: 'italic', k: 'link', y: 'redo' })[key];
    if (!command) return;
    event.preventDefault();
    runCommand(command);
  });
  preview.addEventListener('paste', (event) => {
    if (event.target.matches('.visual-code-editor')) return;
    event.preventDefault();
    visualInput = visualSnapshot(lastVisualHtml);
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
    visualInput = null;
  });
  preview.addEventListener('drop', (event) => {
    if (!event.target.matches('.visual-code-editor')) event.preventDefault();
  });
  preview.addEventListener('click', (event) => {
    const control = event.target.closest('[data-visual-edit]');
    const asset = event.target.closest('a,img');
    if (!control && !asset) return;
    if (control?.dataset.visualEdit !== 'table-cell-source' || asset?.closest('a')) event.preventDefault();
    const target = !control && restrictionFor(event.target);
    if (target) showRestriction(target);
    else runVisualEdit(event.target, event);
  });
  preview.addEventListener('dblclick', (event) => {
    if (event.target.closest('a,img,button,input,textarea,[data-visual-edit]')) return;
    const target = restrictionFor(event.target);
    if (target) showRestriction(target);
    else editDirectListItem(event.target);
  });
  source.addEventListener('click', updateCursor);
  source.addEventListener('keyup', updateCursor);
  source.addEventListener('keydown', (event) => {
    if (event.isComposing) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') { event.preventDefault(); runCommand('bold'); }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') { event.preventDefault(); runCommand('italic'); }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); runCommand('link'); }
    else if (event.key === 'Tab') {
      event.preventDefault();
      source.setRangeText('  ', source.selectionStart, source.selectionEnd, 'end');
      source.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (event.key === 'Enter' && source.selectionStart === source.selectionEnd) {
      const lineStart = source.value.lastIndexOf('\n', source.selectionStart - 1) + 1;
      const line = source.value.slice(lineStart, source.selectionStart);
      const list = line.match(/^(\s*)([-+*]|\d+\.)(?:\s+\[[ xX]\])?\s+(.*)$/);
      if (list) {
        event.preventDefault();
        if (!list[3]) {
          const markerStart = lineStart + list[1].length;
          source.setRangeText('', markerStart, source.selectionStart, 'end');
        } else {
          const marker = /^\d+\.$/.test(list[2]) ? `${Number.parseInt(list[2], 10) + 1}.` : list[2];
          const task = /\s+\[[ xX]\]/.test(line) ? '[ ] ' : '';
          source.setRangeText(`\n${list[1]}${marker} ${task}`, source.selectionStart, source.selectionEnd, 'end');
        }
        source.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });
  document.addEventListener('markdownvision:documentchanged', (event) => {
    fileName = event.detail.name;
    $('#editorFileName').textContent = fileName;
    if (showingDraft) return;
    documentId = event.detail.documentId || null;
    imageBase = event.detail.imageBase || '';
    documentGeneration += 1;
    saved = false;
    saveError.hidden = true;
    source.value = event.detail.content;
    original = source.value;
    previewSource = null;
    updateDirty();
    if (active) updatePreview();
  });

  source.value = original;
  original = source.value;
  $('#editorFileName').textContent = fileName;
  updateDirty();
})();
