/* The store provides read(key), write(key, value), and remove(key). */
(function (global) {
  function createEditorRecovery(store, key, delay = 500) {
    let timer = null;
    let pendingDraft = null;
    let queued = Promise.resolve();
    let failure = null;

    function enqueue(action) {
      queued = queued.catch(() => {}).then(action).catch((error) => {
        failure = error;
      });
      return queued;
    }

    function cancelTimer() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      pendingDraft = null;
    }

    function writePending() {
      if (!pendingDraft) return;
      const draft = pendingDraft;
      pendingDraft = null;
      enqueue(() => store.write(key, draft));
    }

    function schedule(session) {
      cancelTimer();
      if (!session.dirty) return;
      pendingDraft = {
        version: 1,
        documentId: session.documentId,
        name: session.name,
        revision: session.revision,
        format: session.format,
        content: session.content,
        savedAt: Date.now()
      };
      timer = setTimeout(() => {
        timer = null;
        writePending();
      }, delay);
    }

    async function clear() {
      cancelTimer();
      await enqueue(() => store.remove(key));
    }

    async function read() {
      await queued;
      const draft = await store.read(key);
      if (!draft || draft.version !== 1 || typeof draft.content !== 'string') return null;
      return draft;
    }

    async function flush() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      writePending();
      await queued;
      if (failure) {
        const error = failure;
        failure = null;
        throw error;
      }
    }

    return { schedule, clear, read, flush };
  }

  global.createMarkdownEditorRecovery = createEditorRecovery;
  if (typeof module !== 'undefined') module.exports = { createEditorRecovery };
})(globalThis);
