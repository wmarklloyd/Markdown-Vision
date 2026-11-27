const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const stylesheet = fs.readFileSync(path.join(root, 'src/web/styles.css'), 'utf8');
assert.match(stylesheet, /--reader-font:\s*'Libertinus Serif',\s*serif\s*;/,
  'Reader font stack must keep a generic serif fallback for uncovered scripts');
assert.match(stylesheet, /--reader-mono-font:\s*'Libertinus Mono',\s*monospace\s*;/,
  'Code font stack must keep a generic monospace fallback for uncovered scripts');
const fontFaces = [...stylesheet.matchAll(/@font-face\s*\{([^}]+)\}/g)];
assert.equal(fontFaces.length, 7, 'Expected all seven bundled Libertinus font faces');
for (const [, rule] of fontFaces) {
  assert.match(rule, /font-display:\s*swap\s*;/,
    'Bundled fonts must not hide localized text while the font loads');
  const source = /url\(['"]?([^'")]+)['"]?\)/.exec(rule)?.[1];
  assert.ok(source, 'Bundled font face has no local asset');
  assert.ok(fs.existsSync(path.join(root, 'src/web', source)), `Bundled font asset is missing: ${source}`);
}
const source = fs.readFileSync(path.join(root, 'src/web/app.js'), 'utf8');
const block = /\/\/ BEGIN GENERATED LOCALE PREVIEW\s*([\s\S]*?)\/\/ END GENERATED LOCALE PREVIEW/.exec(source)?.[1];
assert.ok(block, 'Missing generated application translations');
const messages = vm.runInNewContext(`${block}\npreviewMessages`);
function conditionalInterfaceLiterals(text) {
  const found = [];
  for (const match of text.matchAll(/\binterfaceText\s*\(/g)) {
    let depth = 0;
    for (let i = match.index + match[0].length; i < text.length; i++) {
      const char = text[i];
      if (char === "'" || char === '"') {
        const start = i++;
        let previous = start - 1;
        while (previous >= 0 && /\s/.test(text[previous])) previous--;
        while (i < text.length && text[i] !== char) {
          if (text[i] === '\\') i++;
          i++;
        }
        if (i < text.length && (text[previous] === '?' || text[previous] === ':')) {
          found.push(vm.runInNewContext(text.slice(start, i + 1)));
        }
      } else if ('([{'.includes(char)) depth++;
      else if (')]}'.includes(char)) {
        if (depth === 0) break;
        depth--;
      } else if (char === ',' && depth === 0) break;
    }
  }
  return found;
}
const catalog = fs.readFileSync(path.join(root, 'docs/LOCALIZATION.md'), 'utf8');
const locales = [...catalog.matchAll(/^## Locale ([\w-]+)\s*$/gm)].map(match => match[1]);
assert.deepEqual(Object.keys(messages).sort(), [...locales].sort(), 'Application translations and catalog differ');
const englishSourceSection = /^## English source and locations\s*\r?\n([\s\S]*?)(?=^## )/m.exec(catalog)?.[1];
assert.ok(englishSourceSection, 'Missing English source table');
const catalogSources = new Set([...englishSourceSection.matchAll(/^\| `[^`]+` \| (.*?) \| /gm)]
  .map(match => match[1].replace(/\\\|/g, '|')));
const html = fs.readFileSync(path.join(root, 'src/web/index.html'), 'utf8');
assert.doesNotMatch(html, /Libertinus fonts|Libertinus font license/i,
  'Font attribution and license details belong in repository license notices, not the About panel');
const fontLicensePath = path.join(root, 'src/web/fonts/libertinus/OFL.txt');
assert.ok(fs.existsSync(fontLicensePath), 'The Libertinus font license must remain beside the bundled font files');
const fontLicense = fs.readFileSync(fontLicensePath, 'utf8');
assert.match(fontLicense, /Copyright .+The Libertinus Project Authors/s,
  'The bundled font license must retain the Libertinus authorship notice');
assert.match(fontLicense, /SIL Open Font License, Version 1\.1/,
  'The bundled font license must remain the complete SIL Open Font License 1.1 text');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.ok(packageJson.build?.files?.includes('src/web/fonts/**/*'),
  'Electron packages must include the font files and their adjacent OFL.txt');
const tauriStaging = fs.readFileSync(path.join(root, 'tools/stage-tauri.cjs'), 'utf8');
assert.ok(tauriStaging.includes("'fonts/libertinus/OFL.txt'"),
  'Tauri staging must include the adjacent font license');
const cppEmbedding = fs.readFileSync(path.join(root, 'native-cpp/embed-web-assets.ps1'), 'utf8');
assert.ok(cppEmbedding.includes("RelativePath = 'fonts/libertinus/OFL.txt'"),
  'The native C++ host must embed the adjacent font license');
const windowsProject = fs.readFileSync(path.join(root, 'native-windows/MarkdownVision.Native.csproj'), 'utf8');
assert.ok(windowsProject.includes('fonts\\libertinus\\*'),
  'The managed Windows host must copy the font directory, including OFL.txt');
const htmlCandidates = [];
for (const match of html.matchAll(/\b(?:title|aria-label|aria-description|aria-valuetext|placeholder)="([^"]*)"/g)) {
  htmlCandidates.push({ text: match[1], offset: match.index });
}
const visibleHtml = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '');
for (const match of visibleHtml.matchAll(/>([^<>]+)</g)) {
  const text = match[1].trim().replace(/\s+/g, ' ');
  if (text) htmlCandidates.push({ text, offset: match.index + 1 });
}
const dynamicHtmlText = [
  /^\d+ (?:matches|words)$/,
  /^Ln \d+, Col \d+$/,
  /^Version \d+(?:\.\d+)+$/,
];
for (const { text: rawText, offset } of htmlCandidates) {
  const text = rawText.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  if (!/[A-Za-z]{2}/.test(text) || text === 'Markdown Vision' || text === 'Language'
      || dynamicHtmlText.some(pattern => pattern.test(text))) continue;
  const source = text.replace(/^\d+(% Markdown)$/, '{percent}$1');
  assert.ok(catalogSources.has(source),
    `src/web/index.html:${html.slice(0, offset).split('\n').length}: static interface text is missing from the localization catalog: ${text}`);
}
for (const file of ['src/web/app.js', 'src/web/editor-ui.js']) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of text.matchAll(/(?<![\w$.])(?:window\.|globalThis\.)?(?:alert|confirm|prompt)\s*\(\s*/g)) {
    assert.ok(text.slice(match.index + match[0].length).startsWith('interfaceText('),
      `${file}: browser dialog messages must use interfaceText`);
  }
  assert.doesNotMatch(text, /\.(?:textContent|title|placeholder)\s*=\s*(['"])[A-Za-z][^'"\n]*\1/,
    `${file}: literal interface text must use the localization layer`);
  assert.doesNotMatch(text, /\.setAttribute\(\s*(['"])(?:title|aria-label|aria-description|aria-valuetext|placeholder)\1\s*,\s*(['"])[^'"\n]*[A-Za-z][^'"\n]*\2/,
    `${file}: literal interface attributes must use the localization layer`);
  assert.doesNotMatch(text, /\binterfaceText\s*\(\s*`/,
    `${file}: use a stable translation key with placeholders instead of a template literal`);
  const literals = new Set([...text.matchAll(/interfaceText\(\s*('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g)]
    .map(match => vm.runInNewContext(match[1])));
  for (const literal of conditionalInterfaceLiterals(text)) literals.add(literal);
  for (const match of text.matchAll(/setLocalizedAccessible(?:Label|Description)\(\s*[^,\n]+,\s*('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g)) {
    literals.add(vm.runInNewContext(match[1]));
  }
  for (const match of text.matchAll(/setLocalizedAccessible(?:Label|Description)\(\s*[^,\n]+,\s*([^\n)]*\?[^\n)]*)\)/g)) {
    for (const branch of match[1].matchAll(/[?:]\s*('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g)) {
      literals.add(vm.runInNewContext(branch[1]));
    }
  }
  for (const match of text.matchAll(/setLocalizedErrorStatus\(\s*[^,\n]+,\s*('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g)) {
    literals.add(vm.runInNewContext(match[1]));
  }
  if (file === 'src/web/editor-ui.js') {
    for (const match of text.matchAll(/(?:\breason\s*=\s*|\bshowVisualEdit\(\s*|\bvisualAction\(\s*)('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g)) {
      literals.add(vm.runInNewContext(match[1]));
    }
    const quoted = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g;
    for (const match of text.matchAll(/\[(?:'text'|'cell'|'label'|'url'|'imageUrl'|'add'|'remove'|'indent'|'outdent'|'add-row'|'add-column'|'remove-row'|'remove-column'|'align-left'|'align-center'|'align-right')\s*,\s*([^,\n]+)/g)) {
      for (const literal of match[1].match(quoted) || []) literals.add(vm.runInNewContext(literal));
    }
    for (const match of text.matchAll(/\bshowVisualEdit\(\s*([^,\n]+)/g)) {
      for (const literal of match[1].match(quoted) || []) literals.add(vm.runInNewContext(literal));
    }
    for (const match of text.matchAll(/\breturn\b[^;\n]*/g)) {
      for (const literal of match[0].match(quoted) || []) {
        const value = vm.runInNewContext(literal);
        if (/^[A-Z].*[.!]$/.test(value)) literals.add(value);
      }
    }
  }
  for (const [locale, translation] of Object.entries(messages)) {
    for (const literal of literals) {
      assert.ok(translation.ui?.[literal], `${locale}: ${file} text is not translated: ${literal}`);
    }
  }
  console.log(`Checked ${literals.size} literal interface texts in ${file}.`);
}
const optionBlock = /const languageOptions = (\[[\s\S]*?\n\]);/.exec(source)?.[1];
assert.ok(optionBlock, 'Missing language selector options');
const options = vm.runInNewContext(optionBlock).map(option => option[0]);
assert.deepEqual([...options].sort(), ['en', ...locales].sort(), 'Language selector and catalog differ');
const systemLabelsBlock = /const systemLanguageLabels = (\{[\s\S]*?\n\});/.exec(source)?.[1];
assert.ok(systemLabelsBlock, 'Missing system language labels');
const systemLabels = vm.runInNewContext(`(${systemLabelsBlock})`);
assert.deepEqual(Object.keys(systemLabels).sort(), ['en', ...locales].sort(), 'System language labels and catalog differ');
for (const [locale, label] of Object.entries(systemLabels)) {
  assert.ok(typeof label === 'string' && label.trim(), `${locale}: empty system language label`);
}
const preferences = fs.readFileSync(path.join(root, 'native-tauri/src/preferences.rs'), 'utf8');
const languageValidator = /fn is_supported_language\(text: &str\) -> bool \{([\s\S]*?)\n\}/.exec(preferences)?.[1];
assert.ok(languageValidator, 'Missing native language validator');
const nativeLanguages = [...languageValidator.matchAll(/"([\w-]+)"/g)].map(match => match[1]);
assert.deepEqual(nativeLanguages.sort(), ['system', 'en', ...locales].sort(), 'Native and catalog language lists differ');
for (const [file, minimum] of [['updater.rs', 20], ['document.rs', 5]]) {
  const native = fs.readFileSync(path.join(root, 'native-tauri/src', file), 'utf8');
  const errors = new Set([...native.matchAll(/(?:Err\(|ok_or\(|map_err\(\|_\|\s*)"([^"\\]+)"/g)]
    .map(match => match[1]));
  assert.ok(errors.size >= minimum, `${file}: error extraction did not find the expected messages`);
  for (const [locale, translation] of Object.entries(messages)) {
    for (const error of errors) {
      assert.ok(translation.ui?.[error], `${locale}: ${file} error is not translated: ${error}`);
    }
  }
  console.log(`Checked ${errors.size} ${file} errors in ${Object.keys(messages).length} locales.`);
}
const windows = fs.readFileSync(path.join(root, 'native-cpp/WebViewHost.cpp'), 'utf8');
const windowsErrors = new Set([...windows.matchAll(/SaveError\(L"([^"\\]+)"/g)]
  .map(match => match[1]));
assert.ok(windowsErrors.size >= 10, 'Windows save error extraction did not find the expected messages');
const recoveryPrefix = 'Windows could not restore the original file during the save. The original is at ';
for (const [locale, translation] of Object.entries(messages)) {
  for (const error of windowsErrors) {
    const key = error === recoveryPrefix ? `${recoveryPrefix}{path}.` : error;
    assert.ok(translation.ui?.[key], `${locale}: Windows save error is not translated: ${key}`);
  }
}
console.log(`Checked ${windowsErrors.size} Windows save errors in ${Object.keys(messages).length} locales.`);

const bridge = fs.readFileSync(path.join(root, 'native-tauri/bridge.js'), 'utf8');
const bridgeTexts = new Set([...bridge.matchAll(/translate\('([^']+)'/g)].map(match => match[1]));
const discardMessages = /const messages = \{([\s\S]*?)\};/.exec(bridge)?.[1] ?? '';
for (const match of discardMessages.matchAll(/(?:open|close|quit): '([^']+)'/g)) bridgeTexts.add(match[1]);
assert.ok(bridgeTexts.size >= 12, 'Native dialog extraction did not find the expected labels and messages');
for (const [locale, translation] of Object.entries(messages)) {
  for (const text of bridgeTexts) {
    assert.ok(translation.ui?.[text], `${locale}: native dialog text is not translated: ${text}`);
  }
}
console.log(`Checked ${bridgeTexts.size} native dialog texts in ${Object.keys(messages).length} locales.`);

const tauriMain = fs.readFileSync(path.join(root, 'native-tauri/src/main.rs'), 'utf8');
const menuUpdateHandler = /fn update_menu_labels\([\s\S]*?\r?\n}\r?\n/.exec(tauriMain)?.[0];
assert.ok(menuUpdateHandler?.includes('required_native_menu_label(&labels, submenu_id)?')
  && menuUpdateHandler.includes('required_native_menu_label(&labels, key)?'),
  'Tauri must require translated labels for every menu and menu item that exists');
const requiredMenuLabel = /fn required_native_menu_label[\s\S]*?\r?\n}\r?\n/.exec(tauriMain)?.[0];
assert.ok(requiredMenuLabel?.includes('valid_native_label(text)')
  && requiredMenuLabel.includes('ok_or_else'),
  'Tauri native menu labels must reject missing or invalid translations');
const openErrorHandler = /fn show_open_error\([\s\S]*?\r?\n}\r?\n/.exec(tauriMain)?.[0];
assert.ok(openErrorHandler?.includes('title: String, description: String, close: String'),
  'Tauri open-error dialogs must require localized title, description, and close labels');
assert.ok(openErrorHandler.includes('valid_native_label(&title)')
  && openErrorHandler.includes('valid_native_message(&description)')
  && openErrorHandler.includes('valid_native_label(&close)'),
  'Tauri open-error dialog text must be validated before display');
assert.doesNotMatch(openErrorHandler, /unwrap_or_else/,
  'Tauri open-error dialogs must not silently fall back to English');
const nativeMessageValidator = /fn valid_native_message\([\s\S]*?\r?\n}\r?\n/.exec(tauriMain)?.[0];
assert.ok(nativeMessageValidator?.includes('chars().count() <= 16_384')
  && nativeMessageValidator.includes('ch.is_control()')
  && nativeMessageValidator.includes("'\\n' | '\\r' | '\\t'"),
  'Tauri native error descriptions must be bounded and reject non-formatting control characters');
const confirmationHandler = /fn confirm_discard\([\s\S]*?\r?\n}\r?\n/.exec(tauriMain)?.[0];
assert.ok(confirmationHandler?.includes('labels: serde_json::Value'),
  'Tauri confirmation labels must be required so the host cannot fall back to English');
assert.ok(confirmationHandler.includes('read_discard_labels(labels)?'),
  'Tauri confirmation labels must be validated before displaying the native dialog');
assert.doesNotMatch(confirmationHandler, /unwrap_or_else\s*\(\s*\|\|\s*DiscardLabels/,
  'Tauri native confirmations must not have an English fallback');
const discardLabelReader = /fn read_discard_labels\([\s\S]*?\r?\n}\r?\n/.exec(tauriMain)?.[0];
assert.ok(discardLabelReader, 'Missing Tauri native confirmation label validation');
assert.ok(discardLabelReader.includes('valid_native_label(text)'),
  'Tauri native confirmation labels must use the shared label validator');
const nativeLabelValidator = /fn valid_native_label\([\s\S]*?\r?\n}\r?\n/.exec(tauriMain)?.[0];
assert.ok(nativeLabelValidator?.includes('chars().count() <= 256')
  && nativeLabelValidator.includes('char::is_control'),
  'Tauri native confirmation labels must have a bounded length and reject control characters');
const nativeMenuLabels = new Set([
  ...[...tauriMain.matchAll(/MenuItemBuilder::with_id\(\s*"[^"]+"\s*,\s*"([^"]+)"/g)]
    .map(match => match[1]),
  ...[...tauriMain.matchAll(/SubmenuBuilder::with_id\(\s*app\s*,\s*"[^"]+"\s*,\s*"([^"]+)"/g)]
    .map(match => match[1]),
]);
const rendererSource = fs.readFileSync(path.join(root, 'src/web/app.js'), 'utf8');
assert.ok(rendererSource.includes("'app-menu': 'Markdown Vision'"),
  'macOS must send the preserved product name for its native application menu');
nativeMenuLabels.delete('Markdown Vision');
assert.ok(nativeMenuLabels.size >= 12, 'Tauri native menu extraction did not find the expected labels');
for (const [locale, translation] of Object.entries(messages)) {
  for (const label of nativeMenuLabels) {
    assert.ok(translation.ui?.[label], `${locale}: Tauri native menu label is not translated: ${label}`);
  }
}
console.log(`Checked ${nativeMenuLabels.size} Tauri native menu labels in ${Object.keys(messages).length} locales.`);

const managedWindows = fs.readFileSync(path.join(root, 'native-windows/MainWindow.xaml.cs'), 'utf8');
const managedWindowsTexts = new Set([
  ...[...managedWindows.matchAll(/FileDialogLabel\(labels,\s*"[^"]+"\s*,\s*"([^"]+)"/g)]
    .map(match => match[1]),
  ...[...managedWindows.matchAll(/new InvalidOperationException\(\$"([^"]+)"\)/g)]
    .map(match => match[1].replace('{request.Method}', '{method}')),
]);
assert.ok(managedWindowsTexts.size >= 4, 'Managed Windows host extraction did not find dialog labels and bridge errors');
for (const [locale, translation] of Object.entries(messages)) {
  for (const text of managedWindowsTexts) {
    assert.ok(translation.ui?.[text], `${locale}: managed Windows host text is not translated: ${text}`);
  }
}
console.log(`Checked ${managedWindowsTexts.size} managed Windows host strings in ${Object.keys(messages).length} locales.`);

const managedApp = fs.readFileSync(path.join(root, 'native-windows/App.xaml.cs'), 'utf8');
const detachedLaunchHandler = /if\s*\(ShouldDetach\(e\.Args\)\)\s*\{([\s\S]*?)\n\s{8}\}/.exec(managedApp)?.[1];
assert.ok(detachedLaunchHandler && /catch\s*\(Exception exception\)/.test(detachedLaunchHandler)
    && /StartupTranslations\.Format\(startupCulture, exception\.Message\)/.test(detachedLaunchHandler),
  'Managed Windows detached-launch failures must use localized startup messages');

const cppDialogValues = /const values = \[([\s\S]*?)\]\s*\.map\(\(source\) => translate\(source\)\)/.exec(windows)?.[1];
assert.ok(cppDialogValues, 'C++ WebView file-dialog labels were not found');
const cppDialogLabels = new Set([...cppDialogValues.matchAll(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g)]
  .map(match => vm.runInNewContext(match[0])));
assert.equal(cppDialogLabels.size, 7, 'Expected seven localized C++ WebView file-dialog labels');
for (const [locale, translation] of Object.entries(messages)) {
  for (const label of cppDialogLabels) {
    assert.ok(translation.ui?.[label], `${locale}: Windows WebView dialog text is not translated: ${label}`);
  }
}
console.log(`Checked ${cppDialogLabels.size} native C++ Windows dialog labels in ${Object.keys(messages).length} locales.`);
