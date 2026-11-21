(() => {
  const invoke = window.__TAURI__.core.invoke;
  let closing = false;
  let openCallback = null;
  let processing = false;
  window.__markdownVisionProcessOpenQueue = async () => {
    if (!openCallback || processing || window.markdownVisionReader?.isSaving?.()) return;
    processing = true;
    try {
      while (await invoke('has_pending_document')) {
        const dirty = window.markdownVisionReader?.hasUnsavedChanges?.();
        const accept = !dirty || window.confirm('Discard your unsaved changes and open another document?');
        const document = await invoke('pending_document', { accept });
        if (!document) break;
        if (document.discarded) continue;
        openCallback(document);
      }
    } catch (error) {
      console.error('Unable to open the requested document:', error);
    } finally {
      processing = false;
    }
  };
  window.__markdownVisionRequestClose = async () => {
    if (closing || window.markdownVisionReader?.isSaving?.()) return;
    if (window.markdownVisionReader?.hasUnsavedChanges?.()
        && !window.confirm('Discard your unsaved changes and close Markdown Vision?')) return;
    closing = true;
    try {
      await invoke('close_window');
    } catch {
      closing = false;
    }
  };
  window.desktop = {
    getPreferences: () => invoke('get_preferences'),
    savePreferences: (preferences) => invoke('save_preferences', { preferences }),
    getInitialDocument: () => invoke('initial_document'),
    openMarkdownFile: () => invoke('open_document'),
    saveMarkdownFile: (documentId, content, saveAs) =>
      invoke('save_document', { documentId, content, saveAs }),
    onOpenDocument: (callback) => {
      openCallback = callback;
      window.addEventListener('load', () => setTimeout(window.__markdownVisionProcessOpenQueue, 0), { once: true });
    },
  };
})();
