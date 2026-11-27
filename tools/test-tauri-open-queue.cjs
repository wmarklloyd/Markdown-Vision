const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function main() {
  const pending = [];
  const opened = [];
  let saving = false;
  let dirty = false;
  let accept = false;
  const errors = [];
  const confirmActions = [];
  const confirmLabels = [];
  const errorDialogs = [];
  const closeCommands = [];
  const fileDialogs = [];
  let load;
  const window = {
    __TAURI__: { core: { invoke: async (command, args) => {
      if (command === 'initial_document') return null;
      if (command === 'has_pending_document') return pending.length > 0;
      if (command === 'confirm_discard') { confirmActions.push(args.action); confirmLabels.push(args.labels); return accept; }
      if (command === 'pending_document') {
        const document = pending.shift();
        if (document.error) return document;
        return args.accept ? document : { discarded: true };
      }
      if (command === 'show_open_error') { errors.push(args.description); errorDialogs.push(args); return; }
      if (command === 'open_document' || command === 'save_document') { fileDialogs.push([command, args]); return null; }
      if (command === 'close_window' || command === 'quit_application') { closeCommands.push(command); return; }
      throw new Error(`Unexpected command: ${command}`);
    } } },
    markdownVisionReader: {
      isSaving: () => saving,
      hasUnsavedChanges: () => dirty,
      interfaceText: (text, values) => 'translated:' + text.replace('{message}', values?.message ?? '{message}'),
      localizedNativeError: (error) => 'native:' + error,
    },
    addEventListener: (name, callback) => { if (name === 'load') load = callback; },
  };
  vm.runInNewContext(fs.readFileSync('native-tauri/bridge.js', 'utf8'), { window, setTimeout, console });
  window.desktop.onOpenDocument(document => opened.push(document.name));
  await window.desktop.openMarkdownFile();
  await window.desktop.saveMarkdownFile('document-id', 'text', true);
  assert.equal(fileDialogs[0][1].labels.open, 'translated:Open Markdown file');
  assert.equal(fileDialogs[0][1].labels.markdown, 'translated:Markdown files');
  assert.equal(fileDialogs[1][1].labels.save, 'translated:Save Markdown file');
  assert.equal(fileDialogs[1][1].labels.untitled, 'translated:Untitled.md');
  assert.equal(fileDialogs[1][1].documentId, 'document-id');
  assert.equal(fileDialogs[1][1].content, 'text');
  assert.equal(fileDialogs[1][1].saveAs, true);
  load();
  pending.push({ name: 'startup.md' });
  await window.__markdownVisionProcessOpenQueue();
  assert.deepEqual(opened, []);
  await window.desktop.getInitialDocument();
  await window.__markdownVisionProcessOpenQueue();
  assert.deepEqual(opened, ['startup.md']);
  opened.length = 0;
  saving = true;
  pending.push({ name: 'deferred.md' });
  await window.__markdownVisionProcessOpenQueue();
  assert.deepEqual(opened, []);
  saving = false;
  await new Promise(resolve => setTimeout(resolve, 350));
  assert.deepEqual(opened, ['deferred.md']);
  dirty = true;
  pending.push({ name: 'canceled.md' });
  await window.__markdownVisionProcessOpenQueue();
  assert.deepEqual(opened, ['deferred.md']);
  accept = true;
  pending.push({ name: 'accepted.md' });
  await window.__markdownVisionProcessOpenQueue();
  assert.deepEqual(opened, ['deferred.md', 'accepted.md']);
  dirty = false;
  pending.push({ error: 'Permission denied' }, { name: 'after-error.md' });
  await window.__markdownVisionProcessOpenQueue();
  assert.match(errors[0], /native:Permission denied/);
  assert.match(errorDialogs[0].description, /native:Permission denied/);
  assert.equal(errorDialogs[0].message, undefined, 'native dialog receives only the localized error description');
  assert.equal(errorDialogs[0].title, 'translated:Could not open document');
  assert.equal(errorDialogs[0].close, 'translated:Close');
  assert.deepEqual(opened, ['deferred.md', 'accepted.md', 'after-error.md']);
  dirty = true;
  accept = false;
  await window.__markdownVisionRequestClose(false);
  assert.equal(confirmActions.at(-1), 'close');
  assert.equal(confirmLabels.at(-1).message, 'translated:Discard your unsaved changes and close Markdown Vision?');
  assert.equal(confirmLabels.at(-1).discard, 'translated:Discard');
  assert.deepEqual(closeCommands, []);
  await window.__markdownVisionRequestClose(true);
  assert.equal(confirmActions.at(-1), 'quit');
  assert.deepEqual(closeCommands, [], 'canceling the Quit prompt keeps the app running');
  accept = true;
  await window.__markdownVisionRequestClose(true);
  assert.equal(confirmActions.at(-1), 'quit');
  assert.deepEqual(closeCommands, ['quit_application']);
  console.log('Open queue defers while saving, respects discard decisions, and routes Quit through app exit.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
