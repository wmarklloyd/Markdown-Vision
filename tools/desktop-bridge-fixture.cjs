/* Deterministic window.desktop fixture for exercising renderer host paths. */
function createDesktopBridgeFixture(scenario = 'default') {
  let activeScenario = scenario;
  const document = {
    content: '# Fixture document\n',
    name: 'fixture.md',
    documentId: 'fixture-1',
    imageBase: 'mvimage://localhost/fixture-1/',
  };
  const calls = [];
  let resolvePendingPreferences;
  const fixture = {
    calls,
    async getInitialDocument() {
      calls.push(['getInitialDocument']);
      return activeScenario === 'initial-open' ? { ...document } : null;
    },
    async openMarkdownFile() {
      calls.push(['openMarkdownFile']);
      if (activeScenario === 'open-error') throw new Error('Fixture open failure');
      return activeScenario === 'open-cancel' ? null : { ...document, name: 'opened.md' };
    },
    async saveMarkdownFile(documentId, content, saveAs) {
      calls.push(['saveMarkdownFile', documentId, content, saveAs]);
      if (activeScenario === 'save-error') throw new Error('Fixture save failure');
      if (activeScenario === 'save-cancel') return { status: 'canceled' };
      if (activeScenario === 'save-error-result') return { status: 'error', message: 'Fixture save failure' };
      return {
        status: 'saved',
        documentId: saveAs ? 'fixture-save-as' : (documentId || 'fixture-new'),
        name: saveAs ? 'saved-as.md' : 'saved.md',
        imageBase: 'mvimage://localhost/fixture-save/',
      };
    },
    async confirmDiscard(action) {
      calls.push(['confirmDiscard', action]);
      return activeScenario !== 'keep-editing';
    },
    async reportOpenError(error) { calls.push(['reportOpenError', String(error)]); },
    async printMarkdown() { calls.push(['printMarkdown']); return true; },
    async listSystemFonts() { calls.push(['listSystemFonts']); return ['Arial', 'Georgia']; },
    async getPreferences() {
      calls.push(['getPreferences']);
      if (activeScenario === 'preferences-pending') {
        return new Promise((resolve) => { resolvePendingPreferences = resolve; });
      }
      if (activeScenario === 'preferences-stored') {
        return { theme: 'dark', font: 'Georgia', monoFont: 'Consolas', size: '20', line: '1.8', width: '800' };
      }
      return null;
    },
    async savePreferences(preferences) { calls.push(['savePreferences', preferences]); },
    onOpenDocument(callback) { calls.push(['onOpenDocument']); fixture.openCallback = callback; },
  };
  if (activeScenario === 'optional-capabilities') {
    delete fixture.listSystemFonts;
    delete fixture.printMarkdown;
    delete fixture.savePreferences;
    delete fixture.installUpdate;
    delete fixture.updateArchitecture;
  }
  fixture.setScenario = (value) => { activeScenario = value; };
  fixture.resolvePreferences = (value) => {
    if (!resolvePendingPreferences) throw new Error('No pending preferences read');
    resolvePendingPreferences(value);
    resolvePendingPreferences = null;
  };
  fixture.emitOpen = (value = document) => fixture.openCallback?.({ ...value });
  return fixture;
}

if (typeof globalThis !== 'undefined') globalThis.createDesktopBridgeFixture = createDesktopBridgeFixture;
if (typeof module !== 'undefined') module.exports = { createDesktopBridgeFixture };
