const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-desktop-check-'));
try {
  const fixture = path.join(dir, 'launcher.desktop');
  const run = () => spawnSync(process.execPath,
    [path.join(__dirname, 'check-linux-desktop-duplicates.cjs'), fixture], { encoding: 'utf8' });
  fs.writeFileSync(fixture, '[Desktop Entry]\nGenericName=Viewer\nGenericName[ar]=عارض\n[Desktop Action Open]\nGenericName=Other\n');
  assert.equal(run().status, 0, 'distinct locale entries are valid');
  fs.appendFileSync(fixture, '[Desktop Entry]\nGenericName[ar]=wrong\n');
  const duplicate = run();
  assert.notEqual(duplicate.status, 0, 'duplicate locale entry must be rejected');
  assert.match(duplicate.stderr, /GenericName\[ar\]/);
  const template = path.join(dir, 'template.desktop');
  fs.writeFileSync(template, '[Desktop Entry]\nGenericName=Viewer\nGenericName[ar]=عارض\n');
  fs.writeFileSync(fixture, '[Desktop Entry]\nGenericName=Viewer\n[Desktop Action Open]\nGenericName[ar]=عارض\n');
  const misplaced = spawnSync(process.execPath,
    [path.join(__dirname, 'check-linux-desktop-duplicates.cjs'), fixture, template], { encoding: 'utf8' });
  assert.notEqual(misplaced.status, 0, 'translation in another section must not satisfy the launcher check');
  assert.match(misplaced.stderr, /GenericName\[ar\]/);
  console.log('Linux launcher duplicate validation passed.');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
