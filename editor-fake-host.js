/* In-memory host for editor development. It never writes to disk. */
(function (global) {
  function createEditorFakeHost(initialDocuments = []) {
    const documents = new Map();
    let nextId = 1;
    let nextRevision = 1;
    let nextOpenId = null;
    let nextSaveName = 'Untitled.md';
    let nextResult = null;
    let delayMs = 0;

    function addDocument(name, content, format = null) {
      const documentId = String(nextId++);
      const document = { documentId, name, content, format, revision: String(nextRevision++) };
      documents.set(documentId, document);
      return documentId;
    }

    for (const document of initialDocuments) addDocument(document.name, document.content, document.format);

    async function responseOverride() {
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
      const result = nextResult;
      nextResult = null;
      return result;
    }

    return {
      addDocument,
      selectOpen(documentId) { nextOpenId = documentId; },
      setSaveAsName(name) { nextSaveName = name; },
      setDelay(milliseconds) { delayMs = milliseconds; },
      setNextResult(result) { nextResult = result; },
      externalEdit(documentId, content) {
        const document = documents.get(documentId);
        if (!document) throw new Error('Document not found');
        document.content = content;
        document.revision = String(nextRevision++);
      },
      async openDocument() {
        const override = await responseOverride();
        if (override) return override;
        const document = documents.get(nextOpenId);
        return document ? { status: 'ok', document: { ...document } } : { status: 'canceled' };
      },
      async saveDocument(request) {
        const override = await responseOverride();
        if (override) return override;
        let document = documents.get(request.documentId);
        if (request.saveAs) {
          const id = addDocument(nextSaveName, request.content, request.format);
          document = documents.get(id);
        } else {
          if (!document || (!request.overwrite && document.revision !== request.expectedRevision)) {
            return { status: 'conflict' };
          }
          document.content = request.content;
          document.revision = String(nextRevision++);
        }
        const { documentId, name, revision, format } = document;
        return { status: 'ok', documentId, name, revision, format };
      }
    };
  }

  global.createMarkdownEditorFakeHost = createEditorFakeHost;
  if (typeof module !== 'undefined') module.exports = { createEditorFakeHost };
})(globalThis);
