const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-vision-electron-harness-'));
const harnessPath = path.join(__dirname, 'renderer-ui-harness.cjs');
fs.writeFileSync(path.join(appRoot, 'package.json'), JSON.stringify({ name: 'markdown-vision-renderer-harness', version: '1.0.0', main: 'main.cjs' }));
fs.writeFileSync(path.join(appRoot, 'main.cjs'), `require(${JSON.stringify(harnessPath)});\n`);
try {
  const electronPath = require('electron');
  const result = spawnSync(electronPath, [appRoot, '--no-sandbox', '--disable-gpu'], { stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) console.error(`Electron renderer harness exited with status ${result.status ?? `signal ${result.signal}`}.`);
  process.exitCode = result.status ?? 1;
} finally {
  fs.rmSync(appRoot, { recursive: true, force: true });
}
