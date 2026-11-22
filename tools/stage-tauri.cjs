const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const checkOnly = process.argv.includes('--check-only');
const destinationArg = process.argv.indexOf('--destination');
const destination = destinationArg >= 0
  ? path.resolve(root, process.argv[destinationArg + 1] || '')
  : path.join(root, '.tmp', 'tauri-frontend');
if (destinationArg >= 0 && !process.argv[destinationArg + 1]) {
  throw new Error('--destination requires a directory path.');
}
const files = [
  'index.html',
  'styles.css',
  'app.js',
  'editor-ui.js',
  'native-tauri/bridge.js',
  'vendor/markdown-it.js',
  'vendor/markdown-it-footnote.js',
  'vendor/markdown-it.LICENSE.txt',
  'vendor/markdown-it-footnote.LICENSE.txt',
];

const supportedLocalAsset = (url) => {
  if (!url || url.startsWith('#') || /^(?:[a-z]+:|\/\/)/i.test(url) || url.startsWith('data:')) return null;
  return decodeURIComponent(url.split(/[?#]/, 1)[0]).replace(/^\.\//, '');
};
const html = fs.readFileSync(path.join(root, 'src', 'web', 'index.html'), 'utf8');
const referenced = new Set();
for (const match of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
  const asset = supportedLocalAsset(match[1]);
  if (asset && !asset.startsWith('mailto:')) referenced.add(asset);
}
for (const file of referenced) {
  if (!files.includes(file)) throw new Error(`HTML references unstaged asset: ${file}`);
}
for (const file of files) {
  if (!fs.existsSync(path.join(root, file === 'native-tauri/bridge.js' ? file : path.join('src', 'web', file)))) throw new Error(`Staged asset is missing from the source tree: ${file}`);
}

if (!checkOnly) {
  for (const file of files) {
    const target = path.join(destination, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, file === 'native-tauri/bridge.js' ? file : path.join('src', 'web', file)), target);
  }

  const indexPath = path.join(destination, 'index.html');
  const stagedHtml = fs.readFileSync(indexPath, 'utf8');
  if (!stagedHtml.includes('<script src="app.js"></script>')) {
    throw new Error('Could not locate app.js in index.html to inject the Tauri bridge.');
  }
  fs.writeFileSync(indexPath, stagedHtml.replace('<script src="app.js"></script>',
    '<script src="native-tauri/bridge.js"></script>\n    <script src="app.js"></script>'));
}
console.log(`${checkOnly ? 'Checked' : 'Staged'} ${files.length} shared assets; HTML local references are covered${checkOnly ? '.' : ` in ${path.relative(root, destination)}.`}`);
