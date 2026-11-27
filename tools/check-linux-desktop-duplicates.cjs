const fs = require('node:fs');

const path = process.argv[2];
if (!path) throw new Error('Usage: node check-linux-desktop-duplicates.cjs LAUNCHER.desktop');
function entries(file) {
  const seen = new Map();
  let inDesktopEntry = false;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const section = line.match(/^\[([^\]]+)\]\s*$/);
    if (section) {
      inDesktopEntry = section[1] === 'Desktop Entry';
      continue;
    }
    if (!inDesktopEntry) continue;
    const match = line.match(/^(GenericName(?:\[[^\]]+\])?)=(.*)$/);
    if (!match) continue;
    if (seen.has(match[1])) throw new Error(`Duplicate localized launcher entry: ${match[1]}`);
    seen.set(match[1], match[2]);
  }
  return seen;
}

const actual = entries(path);
if (process.argv[3]) {
  for (const [key, value] of entries(process.argv[3])) {
    if (actual.get(key) !== value) throw new Error(`Missing or incorrect localized launcher entry: ${key}`);
  }
}
