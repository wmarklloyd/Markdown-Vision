const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const destination = path.join(root, '.tmp', 'tauri-frontend');
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

for (const file of files) {
  const target = path.join(destination, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, file), target);
}

const indexPath = path.join(destination, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');
fs.writeFileSync(indexPath, html.replace('<script src="app.js"></script>',
  '<script src="native-tauri/bridge.js"></script>\n    <script src="app.js"></script>'));
