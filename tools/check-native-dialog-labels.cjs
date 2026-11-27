const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const source = fs.readFileSync('native-cpp/WebViewHost.cpp', 'utf8');
const filterBlocks = [...source.matchAll(/const auto addFilter = \[&\]\([\s\S]*?\n    \};/g)];
assert.equal(filterBlocks.length, 2, 'Expected open and save filter builders');
for (const [block] of filterBlocks) {
  assert.match(block, /rightToLeft\) filter\.push_back\(L'\\x2066'\)/);
  assert.match(block, /rightToLeft\) filter\.push_back\(L'\\x2069'\)/);
  assert.match(block, /filter\.push_back\(L'\\0'\);\s*filter \+= extensions;\s*filter\.push_back\(L'\\0'\)/,
    'The actual file pattern must remain separate and unmodified');
}
const bridge = /const wchar_t\* bridge = LR"JS\(([\s\S]*?)\)JS";/.exec(source)?.[1];
assert.ok(bridge, 'Windows WebView bridge not found');

const requests = [];
const window = {
  markdownVisionReader: { interfaceText: text => 'translated ' + text, interfaceDirection: 'rtl' },
};
let handleNativeMessage;
const opened = { name: 'Document.md', content: 'Markup with "quotes", \\ and \n' };
const chrome = { webview: {
  addEventListener(type, listener) {
    assert.equal(type, 'message');
    handleNativeMessage = listener;
  },
  postMessage(message) {
    requests.push(message);
    const [id, method] = message.split('|', 2);
    const result = method === 'document.initial' || method === 'document.open' ? opened : true;
    queueMicrotask(() => handleNativeMessage({ data: { id, result } }));
  },
} };
vm.runInNewContext(bridge, { window, chrome, Promise });

(async () => {
  assert.equal(await window.desktop.getInitialDocument(), opened);
  assert.equal(await window.desktop.openMarkdownFile(), opened);
  await window.desktop.saveMarkdownFile('id', '100%\0text', true);
  assert.match(requests[0], /^1\|document\.labels\|translated Open Markdown file\|translated Save Markdown file\|translated Markdown files\|translated Text files\|translated All files\|translated Markdown Vision could not read this file\.\|translated Untitled\.md\|rtl$/);
  assert.equal(requests[1], '2|document.initial');
  assert.match(requests[2], /^3\|document\.labels\|/);
  assert.equal(requests[3], '4|document.open');
  assert.match(requests[4], /^5\|document\.labels\|/);
  assert.equal(requests[5], '6|document.saveAs|id|100%25%00text');
  window.markdownVisionReader.interfaceText = () => 'bad|label';
  await window.desktop.openMarkdownFile();
  assert.equal(requests[6], '7|document.open');
  window.markdownVisionReader.interfaceText = () => 'bad\u0085label';
  await window.desktop.openMarkdownFile();
  assert.equal(requests[7], '8|document.open');
  console.log('Windows dialog label bridge preserves save payloads and rejects invalid labels.');
})().catch(error => { console.error(error); process.exitCode = 1; });

const electronHost = fs.readFileSync(path.join(root, 'src/electron/main.cjs'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'src/web/app.js'), 'utf8');
const electronOpenHandler = /ipcMain\.handle\('document:open',[\s\S]*?\n\}\);/.exec(electronHost)?.[0];
assert.ok(electronOpenHandler, 'Electron open-dialog handler not found');
for (const [key, label] of [['open', 'Open Markdown file'], ['markdown', 'Markdown files'], ['text', 'Text files']]) {
  assert.ok(electronOpenHandler.includes(`label('${key}', '${label}')`),
    `Electron open dialog must use the localized ${key} label`);
  assert.ok(renderer.includes(`${key}: interfaceText('${label}')`),
    `Renderer must send the localized ${key} label to Electron`);
}

const generated = /\/\/ BEGIN GENERATED LOCALE PREVIEW\s*([\s\S]*?)\/\/ END GENERATED LOCALE PREVIEW/.exec(renderer)?.[1];
assert.ok(generated, 'Generated application translations not found');
const messages = vm.runInNewContext(`${generated}\npreviewMessages`);
for (const [locale, translation] of Object.entries(messages)) {
  for (const label of ['Open Markdown file', 'Markdown files', 'Text files']) {
    assert.ok(translation.ui?.[label], `${locale}: Electron dialog label is untranslated: ${label}`);
  }
}
console.log('Electron open dialog receives translated labels in every locale.');
