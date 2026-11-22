/* Shared editing session. The host supplies openDocument and saveDocument. */
(function (global) {
  function createEditorSession(host, onChange = () => {}) {
    let generation = 0;
    let savedContent = '';
    let state = {
      status: 'closed', documentId: null, name: 'Untitled.md',
      content: '', revision: null, format: null, dirty: false
    };

    function publish(patch) {
      state = { ...state, ...patch };
      onChange({ ...state });
    }

    function setDocument(document) {
      generation += 1;
      savedContent = document.content || '';
      publish({
        status: 'ready', documentId: document.documentId || null,
        name: document.name || 'Untitled.md', content: savedContent,
        revision: document.revision ?? null, format: document.format || null,
        dirty: false
      });
    }

    function newDocument() {
      setDocument({ content: '' });
    }

    function edit(content) {
      if (state.status === 'closed' || state.status === 'opening') return;
      publish({ content, dirty: content !== savedContent });
    }

    async function open() {
      if (state.status === 'opening' || state.status === 'saving') return { status: 'busy' };
      const previousStatus = state.status;
      const operation = ++generation;
      publish({ status: 'opening' });
      try {
        const result = await host.openDocument();
        if (operation !== generation) return { status: 'stale' };
        if (result.status === 'ok') setDocument(result.document);
        else publish({ status: previousStatus });
        return result;
      } catch (error) {
        if (operation === generation) publish({ status: previousStatus });
        return { status: 'error', message: String(error.message || error) };
      }
    }

    async function save(options = {}) {
      if (state.status !== 'ready') return { status: 'busy' };
      const operation = generation;
      const snapshot = state.content;
      const request = {
        documentId: state.documentId, expectedRevision: state.revision,
        content: snapshot, format: state.format,
        saveAs: Boolean(options.saveAs || !state.documentId),
        overwrite: Boolean(options.overwrite)
      };
      publish({ status: 'saving' });
      try {
        const result = await host.saveDocument(request);
        if (operation !== generation) return { status: 'stale' };
        if (result.status === 'ok') {
          savedContent = snapshot;
          publish({
            status: 'ready', documentId: result.documentId,
            name: result.name, revision: result.revision,
            format: result.format || state.format, dirty: state.content !== snapshot
          });
        } else publish({ status: 'ready' });
        return result;
      } catch (error) {
        if (operation === generation) publish({ status: 'ready' });
        return { status: 'error', message: String(error.message || error) };
      }
    }

    // The caller chooses Save, Discard, or Cancel before replacing a dirty draft.
    async function canLeave(decision) {
      if (state.status === 'opening' || state.status === 'saving') return false;
      if (!state.dirty) return true;
      if (decision === 'discard') return true;
      if (decision !== 'save') return false;
      const result = await save();
      return result.status === 'ok' && !state.dirty;
    }

    return { getState: () => ({ ...state }), setDocument, newDocument, edit, open, save, canLeave };
  }

  global.createMarkdownEditorSession = createEditorSession;
  if (typeof module !== 'undefined') module.exports = { createEditorSession };
})(globalThis);
