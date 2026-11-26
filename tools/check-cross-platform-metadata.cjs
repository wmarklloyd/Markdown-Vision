const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const electron = JSON.parse(read('package.json'));
const tauri = JSON.parse(read('native-tauri/tauri.conf.json'));
const cargo = read('native-tauri/Cargo.toml');
const winResource = read('native-cpp/MarkdownVision.rc');
const versions = [
  ['package.json', electron.version],
  ['tauri.conf.json', tauri.version],
  ['Cargo.toml', /^version\s*=\s*"([^"]+)"/m.exec(cargo)?.[1]],
  ['MarkdownVision.rc', /^ FILEVERSION\s+([\d,]+)/m.exec(winResource)?.[1]?.split(',').slice(0, 3).join('.')],
];
for (const [source, version] of versions) assert.ok(version, `Version is missing from ${source}`);
assert.equal(new Set(versions.map(([, version]) => version)).size, 1, `Version mismatch: ${JSON.stringify(versions)}`);

const expectedExtensions = ['md', 'markdown', 'mdown', 'mkd'];
const associations = tauri.bundle.fileAssociations;
assert.ok(Array.isArray(associations) && associations.length > 0, 'Tauri file associations are missing');
assert.deepEqual(associations[0].ext, expectedExtensions);
assert.equal(associations[0].mimeType, 'text/markdown');
assert.equal(tauri.identifier, 'com.markdownvision.desktop');
assert.equal(tauri.productName, 'Markdown Vision');
assert.ok(tauri.bundle.linux.deb.depends.includes('zenity'), 'Linux confirmation dialog dependency is missing');
assert.ok(tauri.bundle.linux.deb.depends.includes('xdg-utils'), 'Linux default-browser integration dependency is missing');
for (const required of ['webkit2gtk4.1', 'gtk3', 'zenity', 'xdg-utils', 'fontconfig', 'curl', 'polkit', 'dnf']) {
  assert.ok(tauri.bundle.linux.rpm.depends.includes(required), `Linux RPM runtime dependency is missing: ${required}`);
}
console.log(`Metadata checks passed: version ${versions[0][1]}, product identity, Markdown associations, and DEB/RPM dialog dependencies.`);
