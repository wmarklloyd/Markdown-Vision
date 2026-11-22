(() => {
  const invoke = window.__TAURI__.core.invoke;
  let closing = false;
  let openCallback = null;
  let processing = false;
  let retryOpenQueue = false;
  let startupPending = true;
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
        const accept = !dirty || await invoke('confirm_discard', { action: 'open' });
        const document = await invoke('pending_document', { accept });
        if (!document) break;
        if (document.discarded) continue;
        if (document.error) {
          await invoke('show_open_error', { message: String(document.error) });
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
          && !await invoke('confirm_discard', { action })) {
        closing = false;
        return;
      }
      await invoke(quit ? 'quit_application' : 'close_window');
    } catch {
      closing = false;
    }
  };
  window.desktop = {
    getPreferences: () => invoke('get_preferences'),
    savePreferences: (preferences) => invoke('save_preferences', { preferences }),
    printMarkdown: () => invoke('print_document'),
    confirmDiscard: (action) => invoke('confirm_discard', { action }),
    reportOpenError: (error) => invoke('show_open_error', { message: String(error) }),
    getInitialDocument: async () => {
      try {
        return await invoke('initial_document');
      } finally {
        startupPending = false;
        setTimeout(window.__markdownVisionProcessOpenQueue, 0);
      }
    },
    openMarkdownFile: () => invoke('open_document'),
    saveMarkdownFile: (documentId, content, saveAs) =>
      invoke('save_document', { documentId, content, saveAs }),
    onOpenDocument: (callback) => {
      openCallback = callback;
      window.addEventListener('load', () => setTimeout(window.__markdownVisionProcessOpenQueue, 0), { once: true });
    },
  };
})();
