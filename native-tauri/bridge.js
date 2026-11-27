(() => {
  const invoke = window.__TAURI__.core.invoke;
  let closing = false;
  let openCallback = null;
  let processing = false;
  let retryOpenQueue = false;
  let startupPending = true;
  const translate = (text, values = {}) => window.markdownVisionReader?.interfaceText?.(text, values)
    ?? text.replace(/\{(\w+)\}/g, (placeholder, key) => values[key] ?? placeholder);
  const discardLabels = (action) => {
    const messages = {
      open: 'Discard your unsaved changes and open another document?',
      close: 'Discard your unsaved changes and close Markdown Vision?',
      quit: 'Discard your unsaved changes and quit Markdown Vision?',
    };
    return {
      title: translate('Unsaved changes'),
      message: translate(messages[action]),
      keep: translate('Keep editing'),
      cancel: translate('Cancel'),
      discard: translate('Discard'),
    };
  };
  const confirmDiscard = (action) => invoke('confirm_discard', { action, labels: discardLabels(action) });
  const reportOpenError = (error) => {
    const message = window.markdownVisionReader?.localizedNativeError?.(error) ?? String(error);
    return invoke('show_open_error', {
      title: translate('Could not open document'),
      description: translate('The document could not be opened. Your current changes are still available. {message}', { message }),
      close: translate('Close'),
    });
  };
  const fileDialogLabels = () => ({
    markdown: translate('Markdown files'),
    open: translate('Open Markdown file'),
    save: translate('Save Markdown file'),
    untitled: translate('Untitled.md'),
  });
  window.__markdownVisionProcessOpenQueue = async () => {
    if (!openCallback || startupPending) return;
    if (processing) {
      retryOpenQueue = true;
      return;
    }
    if (window.markdownVisionReader?.isSaving?.()) {
      setTimeout(window.__markdownVisionProcessOpenQueue, 250);
      return;
    }
    processing = true;
    try {
      while (await invoke('has_pending_document')) {
        const dirty = window.markdownVisionReader?.hasUnsavedChanges?.();
        const accept = !dirty || await confirmDiscard('open');
        const document = await invoke('pending_document', { accept });
        if (!document) break;
        if (document.discarded) continue;
        if (document.error) {
          await reportOpenError(document.error);
          continue;
        }
        openCallback(document);
      }
    } catch (error) {
      console.error('Unable to open the requested document:', error);
    } finally {
      processing = false;
      if (retryOpenQueue) {
        retryOpenQueue = false;
        setTimeout(window.__markdownVisionProcessOpenQueue, 0);
      }
    }
  };
  window.__markdownVisionRequestClose = async (quit = false) => {
    if (closing || window.markdownVisionReader?.isSaving?.()) return;
    closing = true;
    try {
      const action = quit ? 'quit' : 'close';
      if (window.markdownVisionReader?.hasUnsavedChanges?.()
          && !await confirmDiscard(action)) {
        closing = false;
        return;
      }
      await invoke(quit ? 'quit_application' : 'close_window');
    } catch {
      closing = false;
    }
  };
  const usesNativeMenu = window.__markdownVisionUsesNativeMenu !== false;
  if (!usesNativeMenu) {
    document.addEventListener('keydown', (event) => {
      if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || event.isComposing) return;
      const key = event.key.toLowerCase();
      if (key !== 'w' && key !== 'q') return;
      event.preventDefault();
      if (!event.repeat) void window.__markdownVisionRequestClose(key === 'q');
    });
  }
  window.desktop = {
    ...(usesNativeMenu ? { setNativeMenuLabels: (labels) => invoke('update_menu_labels', { labels }) } : {}),
    getPreferences: () => invoke('get_preferences'),
    getPlatformInfo: () => invoke('platform_info'),
    listSystemFonts: () => invoke('list_system_fonts'),
    installLinuxUpdate: (version, digest) => invoke('install_linux_update', { version, digest }),
    restartAfterUpdate: (documentId) => invoke('restart_after_update', { documentId }),
    savePreferences: (preferences) => invoke('save_preferences', { preferences }),
    printMarkdown: () => invoke('print_document'),
    confirmDiscard,
    reportOpenError,
    getInitialDocument: async () => {
      try {
        return await invoke('initial_document');
      } finally {
        startupPending = false;
        setTimeout(window.__markdownVisionProcessOpenQueue, 0);
      }
    },
    openMarkdownFile: () => invoke('open_document', { labels: fileDialogLabels() }),
    saveMarkdownFile: (documentId, content, saveAs) =>
      invoke('save_document', { documentId, content, saveAs, labels: fileDialogLabels() }),
    onOpenDocument: (callback) => {
      openCallback = callback;
      window.addEventListener('load', () => setTimeout(window.__markdownVisionProcessOpenQueue, 0), { once: true });
    },
  };
})();
