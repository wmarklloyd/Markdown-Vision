const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

const sourceRoot = path.resolve(__dirname, '..');
const sourceHtml = fs.readFileSync(path.join(sourceRoot, 'src/web/index.html'), 'utf8');
const installedVersion = /id="installedVersion" data-version="([^"]+)"/.exec(sourceHtml)?.[1];
assert.ok(installedVersion, 'Could not read the installed version from the shared app page.');
const newerVersion = installedVersion.replace(/(\d+)$/, (_, patch) => String(Number(patch) + 1));
const copyFiles = [
  'index.html', 'styles.css', 'app.js', 'editor-ui.js',
  'vendor/markdown-it.js', 'vendor/markdown-it-footnote.js',
];
const wait = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));

async function evaluate(window, source) {
  return window.webContents.executeJavaScript(source);
}

async function waitFor(window, expression, label, timeoutMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await evaluate(window, expression)) return;
    await wait(25);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function run() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-vision-renderer-fixture-'));
  for (const file of copyFiles) {
    const target = path.join(fixtureRoot, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(sourceRoot, 'src', 'web', file), target);
  }
  fs.copyFileSync(path.join(sourceRoot, 'tools/desktop-bridge-fixture.cjs'), path.join(fixtureRoot, 'desktop-bridge-fixture.js'));
  const indexFile = path.join(fixtureRoot, 'index.html');
  const html = fs.readFileSync(indexFile, 'utf8');
  const scriptAnchor = '<script src="vendor/markdown-it.js"></script>';
  if (!html.includes(scriptAnchor)) throw new Error('Could not find renderer script insertion point.');
  fs.writeFileSync(indexFile, html.replace(scriptAnchor,
    '<script src="desktop-bridge-fixture.js"></script>\n' +
    '<script>window.__desktopFixture = createDesktopBridgeFixture("preferences-pending"); window.desktop = window.__desktopFixture; window.fetch = () => Promise.reject(new Error("Offline fixture"));</script>\n' +
    scriptAnchor));

  const window = new BrowserWindow({
    show: false,
    width: 1000,
    height: 750,
    webPreferences: { contextIsolation: false, nodeIntegration: false, sandbox: true },
  });
  try {
    await window.loadFile(indexFile);
    await waitFor(window, 'window.markdownVisionReader && window.__desktopFixture.calls.some(([name]) => name === "getInitialDocument")', 'renderer initialization');

    const checkTitle = async (expected, message) => assert.equal(await evaluate(window, 'document.title'), expected, message);
    const calls = async (name) => evaluate(window, `window.__desktopFixture.calls.filter(([call]) => call === ${JSON.stringify(name)}).length`);
    const click = async (selector) => evaluate(window, `document.querySelector(${JSON.stringify(selector)}).click()`);
    const key = async (value, modifiers = {}) => evaluate(window,
      `document.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(value)}, bubbles: true, cancelable: true, ctrlKey: ${Boolean(modifiers.ctrlKey)}, metaKey: ${Boolean(modifiers.metaKey)}, shiftKey: ${Boolean(modifiers.shiftKey)} }))`);
    const editSource = async (text) => evaluate(window, `(() => { const source = document.querySelector('#markdownSource'); source.value = ${JSON.stringify(text)}; source.dispatchEvent(new Event('input', { bubbles: true })); })()`);

    assert.equal(await calls('getInitialDocument'), 1, 'startup UI path requests its initial document');
    await click('#themeButton');
    await evaluate(window, `window.__desktopFixture.resolvePreferences({ theme: 'dark', font: 'Georgia', monoFont: 'Consolas', size: '20', line: '1.8', width: '800' })`);
    await waitFor(window, 'document.documentElement.dataset.theme === "light" && document.querySelector("#fontSize").value === "20" && document.querySelector("#lineHeight").value === "1.8" && document.querySelector("#readingWidth").value === "800"', 'late native preference restore without overwriting a newer theme change');
    assert.equal(await evaluate(window, 'document.querySelector("#fontInput").value'), 'Georgia');
    assert.equal(await evaluate(window, 'document.querySelector("#monoFontInput").value'), 'Consolas');
    await waitFor(window, 'window.__desktopFixture.calls.some(([name, value]) => name === "savePreferences" && value.theme === "light" && value.size === "20" && value.width === "800")', 'persisting merged preferences');
    await evaluate(window, 'window.__desktopFixture.setScenario("default")');
    await click('#openButton');
    await waitFor(window, 'document.title === "opened.md"', 'toolbar Open');
    assert.equal(await calls('openMarkdownFile'), 1);
    await key('o', { ctrlKey: true });
    await waitFor(window, 'window.__desktopFixture.calls.filter(([name]) => name === "openMarkdownFile").length === 2', 'Ctrl+O');
    await waitFor(window, 'document.title === "opened.md"', 'keyboard Open result');

    await evaluate(window, 'window.__desktopFixture.setScenario("open-cancel")');
    await click('#openButton');
    await waitFor(window, 'window.__desktopFixture.calls.filter(([name]) => name === "openMarkdownFile").length === 3', 'canceled Open');
    await checkTitle('opened.md', 'canceled Open keeps the current document');
    await evaluate(window, 'window.__desktopFixture.setScenario("open-error")');
    await click('#openButton');
    await waitFor(window, 'window.__desktopFixture.calls.some(([name]) => name === "reportOpenError")', 'open error reporting');
    await checkTitle('opened.md', 'open error keeps the current document');

    await evaluate(window, 'window.__desktopFixture.setScenario("default")');
    await click('#editorToggle');
    await waitFor(window, '!document.querySelector("#editorWorkspace").hidden', 'editor toolbar');
    await editSource('# Unsaved draft\n');
    await click('#editorSaveAs');
    await waitFor(window, 'window.__desktopFixture.calls.some(([name, id, text, saveAs]) => name === "saveMarkdownFile" && saveAs === true && text.includes("Unsaved draft"))', 'Save As toolbar');
    await checkTitle('saved-as.md', 'Save As updates the document name');

    await editSource('# Canceled draft\n');
    await evaluate(window, 'window.__desktopFixture.setScenario("save-cancel")');
    await click('#editorSave');
    await waitFor(window, 'window.__desktopFixture.calls.some(([name, id, text, saveAs]) => name === "saveMarkdownFile" && saveAs === false && text.includes("Canceled draft"))', 'canceled Save');
    await assert.equal(await evaluate(window, 'document.querySelector("#editorDirty").textContent'), 'Unsaved', 'canceled Save leaves edits dirty');

    await evaluate(window, 'window.__desktopFixture.setScenario("save-error-result")');
    await editSource('# Error draft\n');
    await click('#editorSave');
    await waitFor(window, '!document.querySelector("#editorSaveError").hidden', 'save error UI');
    await assert.equal(await evaluate(window, 'document.querySelector("#editorDirty").textContent'), 'Unsaved', 'save error leaves edits dirty');
    await evaluate(window, 'window.__desktopFixture.setScenario("default")');
    await editSource('# Clean draft\n');
    await click('#editorSave');
    await waitFor(window, 'document.querySelector("#editorDirty").textContent === "Saved"', 'toolbar Save');

    await editSource('# Keyboard draft\n');
    const savesBeforeKeyboard = await calls('saveMarkdownFile');
    await key('s', { ctrlKey: true });
    await waitFor(window, `window.__desktopFixture.calls.filter(([name]) => name === "saveMarkdownFile").length === ${savesBeforeKeyboard + 1}`, 'Ctrl+S');
    await waitFor(window, 'document.querySelector("#editorDirty").textContent === "Saved"', 'keyboard Save');
    await editSource('# Keyboard Save As\n');
    const beforeSaveAsShortcut = await calls('saveMarkdownFile');
    await key('s', { ctrlKey: true, shiftKey: true });
    await waitFor(window, `window.__desktopFixture.calls.filter(([name]) => name === "saveMarkdownFile").length === ${beforeSaveAsShortcut + 1} && window.__desktopFixture.calls.at(-1)[3] === true`, 'Ctrl+Shift+S');

    const printBefore = await calls('printMarkdown');
    await click('#printButton');
    await waitFor(window, `window.__desktopFixture.calls.filter(([name]) => name === "printMarkdown").length === ${printBefore + 1}`, 'Print toolbar');
    await key('p', { ctrlKey: true });
    await waitFor(window, `window.__desktopFixture.calls.filter(([name]) => name === "printMarkdown").length === ${printBefore + 2}`, 'Ctrl+P');

    await click('#searchButton');
    await waitFor(window, '!document.querySelector("#searchPanel").hidden', 'Search toolbar');
    await evaluate(window, 'document.querySelector("#searchPanel").hidden = true');
    await key('f', { ctrlKey: true });
    await waitFor(window, '!document.querySelector("#searchPanel").hidden', 'Ctrl+F');

    const titleBeforeMac = await evaluate(window, 'document.querySelector("#printButton").title');
    assert.match(titleBeforeMac, /Ctrl/);
    assert.equal(await evaluate(window, 'window.markdownVisionReader.applyShortcutLabels("MacIntel", "Mac OS X")'), '⌘');
    assert.match(await evaluate(window, 'document.querySelector("#printButton").title'), /⌘/);
    assert.match(await evaluate(window, 'document.querySelector("#editorSave").title'), /⌘/);
    assert.equal(await evaluate(window, 'window.markdownVisionReader.applyShortcutLabels("Linux x86_64", "Linux")'), 'Ctrl');
    assert.match(await evaluate(window, 'document.querySelector("#printButton").title'), /Ctrl/);
    await evaluate(window, 'window.markdownVisionReader.applyShortcutLabels()');

    await evaluate(window, 'window.fetch = () => new Promise((resolve, reject) => { window.__rejectReleaseCheck = reject; }); document.querySelector(".about-menu summary").click()');
    await waitFor(window, 'document.querySelector(".about-menu").open && document.querySelector("#latestVersion").textContent.includes("checking")', 'nonblocking About release check');
    await evaluate(window, 'window.__rejectReleaseCheck(new Error("Offline fixture"))');
    await waitFor(window, 'document.querySelector("#retryUpdateCheck").hidden === false', 'About offline state');
    assert.match(await evaluate(window, 'document.querySelector("#latestVersion").textContent'), /Unable to check/);
    await evaluate(window, `window.fetch = async () => ({ ok: true, json: async () => ({ tag_name: "v${installedVersion}", assets: [] }) }); document.querySelector(".about-menu").open = false; document.querySelector(".about-menu").open = true`);
    await waitFor(window, `document.querySelector("#latestVersion").textContent === "Latest version: ${installedVersion}"`, 'About current-version state');
    assert.equal(await evaluate(window, 'document.querySelector("#updateLink").hidden'), true);
    await evaluate(window, `window.fetch = async () => ({ ok: true, json: async () => ({ tag_name: "v${newerVersion}", assets: [] }) }); document.querySelector(".about-menu").open = false; document.querySelector(".about-menu").open = true`);
    await waitFor(window, `document.querySelector("#latestVersion").textContent === "Latest version: ${newerVersion}"`, 'About newer-version state');
    assert.equal(await evaluate(window, 'document.querySelector("#updateLink").hidden'), false, 'manual release link appears without auto-updater capability');

    await editSource('# Quit handling draft\n');
    await evaluate(window, `window.__shutdownRequests = []; window.__markdownVisionRequestClose = async (quit = false) => { const action = quit ? 'quit' : 'close'; const discard = !window.markdownVisionReader.hasUnsavedChanges() || await window.desktop.confirmDiscard(action); if (discard) window.__shutdownRequests.push(action); }; window.__desktopFixture.setScenario('keep-editing'); window.__markdownVisionDispatchMenuCommand('quit')`);
    await waitFor(window, 'window.__desktopFixture.calls.some(([name, action]) => name === "confirmDiscard" && action === "quit")', 'Quit unsaved-change prompt');
    assert.deepEqual(await evaluate(window, 'window.__shutdownRequests'), [], 'choosing Keep Editing cancels Quit');
    await evaluate(window, `window.__desktopFixture.setScenario('default'); window.__markdownVisionDispatchMenuCommand('close')`);
    await waitFor(window, 'window.__shutdownRequests.includes("close")', 'Close menu dispatch');
    await evaluate(window, 'window.__markdownVisionDispatchMenuCommand("quit")');
    await waitFor(window, 'window.__shutdownRequests.includes("quit")', 'Quit menu dispatch');

console.log('Renderer UI harness passed: Open/cancel/error, Save/Save As/cancel/error, Print, Search, Windows/macOS/Linux shortcut labels, toolbar/keyboard parity, async preference merge/persistence, About offline/current/newer states, and Close/Quit menu prompts.');
  } finally {
    window.destroy();
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

app.whenReady().then(run).then(() => app.quit()).catch((error) => {
  console.error(error);
  app.exit(1);
});
