const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function main() {
  const pending = [];
  const opened = [];
  let saving = false;
  let dirty = false;
  let accept = false;
  let load;
  const window = {
    __TAURI__: { core: { invoke: async (command, args) => {
      if (command === 'has_pending_document') return pending.length > 0;
      if (command === 'confirm_discard') return accept;
      if (command === 'pending_document') {
        const document = pending.shift();
        return args.accept ? document : { discarded: true };
      }
      throw new Error(`Unexpected command: ${command}`);
    } } },
    markdownVisionReader: {
      isSaving: () => saving,
      hasUnsavedChanges: () => dirty,
    },
    addEventListener: (name, callback) => { if (name === 'load') load = callback; },
  };
  vm.runInNewContext(fs.readFileSync('native-tauri/bridge.js', 'utf8'), { window, setTimeout, console });
  window.desktop.onOpenDocument(document => opened.push(document.name));
  load();
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
  console.log('Open queue defers while saving and respects discard decisions.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
