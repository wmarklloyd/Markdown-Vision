const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-vision-localization-'));
const generated = [
  'src/web/app.js', 'native-cpp/installer-localization.nsh', 'native-cpp/StartupTranslations.h',
  'native-windows/StartupTranslations.cs', 'native-tauri/launcher.desktop',
];
const bundledFonts = [
  'src/web/fonts/libertinus/LibertinusSerif-Regular.woff2',
  'src/web/fonts/libertinus/LibertinusSerif-Italic.woff2',
  'src/web/fonts/libertinus/LibertinusSerif-Semibold.woff2',
  'src/web/fonts/libertinus/LibertinusSerif-SemiboldItalic.woff2',
  'src/web/fonts/libertinus/LibertinusSerif-Bold.woff2',
  'src/web/fonts/libertinus/LibertinusSerif-BoldItalic.woff2',
  'src/web/fonts/libertinus/LibertinusMono-Regular.woff2',
  'src/web/fonts/libertinus/OFL.txt',
];
for (const entry of fs.readdirSync(path.join(root, 'native-tauri', 'macos-localizations'))) {
  if (entry.endsWith('.lproj')) generated.push(`native-tauri/macos-localizations/${entry}/InfoPlist.strings`);
}
try {
  for (const file of ['tools/export-localization.cjs', 'tools/check-native-error-localization.cjs',
    'native-tauri/src/preferences.rs', 'native-tauri/src/updater.rs', 'native-tauri/src/document.rs',
    'native-tauri/src/main.rs', 'native-windows/MainWindow.xaml.cs', 'native-windows/App.xaml.cs',
    'native-tauri/bridge.js', 'native-cpp/WebViewHost.cpp', 'src/web/editor-ui.js', 'docs/LOCALIZATION.md',
    'src/web/index.html', 'src/web/styles.css', 'docs/LOCALIZATION-RELEASE-CHECKLIST.md', 'package.json',
    'tools/stage-tauri.cjs', 'native-cpp/embed-web-assets.ps1', 'native-windows/MarkdownVision.Native.csproj',
    ...generated, ...bundledFonts]) {
    const target = path.join(fixture, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, file), target);
  }
  const check = () => spawnSync(process.execPath, [path.join(fixture, 'tools/export-localization.cjs'), '--check-generated'],
    { encoding: 'utf8' });
  const baseline = check();
  assert.equal(baseline.status, 0, baseline.stderr);
  const releaseReadiness = () => spawnSync(process.execPath,
    [path.join(fixture, 'tools/export-localization.cjs'), '--check-release-ready'], { encoding: 'utf8' });
  const draftRelease = releaseReadiness();
  assert.notEqual(draftRelease.status, 0, 'Draft locales were accepted for release');
  assert.match(draftRelease.stderr, /Localization release gates are incomplete for: ar, zh-hans/);
  const checklistFile = path.join(fixture, 'docs/LOCALIZATION-RELEASE-CHECKLIST.md');
  const originalChecklist = fs.readFileSync(checklistFile, 'utf8');
  const unauditedChecklist = originalChecklist.replace(
    /^\| (?!Locale\b)([^|]+) \| Pending \| Pending \| Pending \| Draft \|$/gm,
    '| $1 | Pass | Pass | Pass | Ready |');
  assert.notEqual(unauditedChecklist, originalChecklist, 'Could not create unaudited-locale checklist fixture');
  fs.writeFileSync(checklistFile, unauditedChecklist, 'utf8');
  const unauditedRelease = releaseReadiness();
  assert.notEqual(unauditedRelease.status, 0, 'A release without review evidence was accepted');
  assert.match(unauditedRelease.stderr, /review must record reviewer, valid date, build, and linked evidence/);
  const readyChecklist = originalChecklist.replace(
    /^\| (?!Locale\b)([^|]+) \| Pending \| Pending \| Pending \| Draft \|$/gm,
    '| $1 | Pass (reviewer: Fixture Reviewer; date: 2026-11-26; build: 2.8.25; evidence: [fixture](docs/reviews/fixture.md)) | Pass (reviewer: Fixture Reviewer; date: 2026-11-26; build: 2.8.25; evidence: [fixture](docs/reviews/fixture.md)) | Pass (reviewer: Fixture Reviewer; date: 2026-11-26; build: 2.8.25; evidence: [fixture](docs/reviews/fixture.md)) | Ready |');
  assert.notEqual(readyChecklist, originalChecklist, 'Could not create ready-locale checklist fixture');
  const reviewEvidence = path.join(fixture, 'docs/reviews/fixture.md');
  fs.mkdirSync(path.dirname(reviewEvidence), { recursive: true });
  fs.writeFileSync(reviewEvidence, '# Fixture review evidence\n', 'utf8');
  const missingEvidenceChecklist = readyChecklist.replaceAll('docs/reviews/fixture.md', 'docs/reviews/missing.md');
  fs.writeFileSync(checklistFile, missingEvidenceChecklist, 'utf8');
  const missingReviewEvidence = releaseReadiness();
  assert.notEqual(missingReviewEvidence.status, 0, 'A missing local review-evidence file was accepted');
  assert.match(missingReviewEvidence.stderr, /review evidence must link to an existing file/);
  fs.writeFileSync(checklistFile, readyChecklist, 'utf8');
  const readyRelease = releaseReadiness();
  assert.equal(readyRelease.status, 0, readyRelease.stderr);
  fs.writeFileSync(checklistFile, originalChecklist, 'utf8');
  fs.writeFileSync(checklistFile, originalChecklist.replace(/^\| Czech \(`cs`\) \|.*\r?\n/m, ''));
  const missingChecklistLocale = check();
  assert.notEqual(missingChecklistLocale.status, 0, 'A locale missing from the release checklist was accepted');
  assert.match(missingChecklistLocale.stderr, /release checklist locale rows differ from catalog/);
  fs.writeFileSync(checklistFile, originalChecklist, 'utf8');
  fs.writeFileSync(checklistFile, originalChecklist.replace(
    '| Arabic (`ar`) | Pending | Pending | Pending | Draft |',
    '| Arabic (`ar`) | Pending | Pending | Pending | Ready |'));
  const prematureReadyLocale = check();
  assert.notEqual(prematureReadyLocale.status, 0, 'A locale with pending gates was marked ready');
  assert.match(prematureReadyLocale.stderr, /release status does not match review gate statuses/);
  fs.writeFileSync(checklistFile, originalChecklist, 'utf8');
  const catalogFile = path.join(fixture, 'docs/LOCALIZATION.md');
  const selectorCatalogOriginal = fs.readFileSync(catalogFile, 'utf8');
  const untranslatedPhraseCatalog = selectorCatalogOriginal.replace(
    '| `search_text_38d268` | Rechercher dans le texte |',
    '| `search_text_38d268` | Search text |');
  assert.notEqual(untranslatedPhraseCatalog, selectorCatalogOriginal, 'Could not alter the French search translation fixture');
  fs.writeFileSync(catalogFile, untranslatedPhraseCatalog, 'utf8');
  const untranslatedPhrase = check();
  assert.notEqual(untranslatedPhrase.status, 0, 'An untranslated English phrase was accepted');
  assert.match(untranslatedPhrase.stderr, /untranslated English phrase/);
  fs.writeFileSync(catalogFile, selectorCatalogOriginal, 'utf8');
  const embeddedUntranslatedPhraseCatalog = selectorCatalogOriginal.replace(
    '| `search_text_38d268` | Rechercher dans le texte |',
    '| `search_text_38d268` | Rechercher dans le texte (Search text) |');
  assert.notEqual(embeddedUntranslatedPhraseCatalog, selectorCatalogOriginal,
    'Could not alter the French embedded-phrase fixture');
  fs.writeFileSync(catalogFile, embeddedUntranslatedPhraseCatalog, 'utf8');
  const embeddedUntranslatedPhrase = check();
  assert.notEqual(embeddedUntranslatedPhrase.status, 0, 'An embedded English phrase was accepted');
  assert.match(embeddedUntranslatedPhrase.stderr, /untranslated English phrase.*Search text/);
  fs.writeFileSync(catalogFile, selectorCatalogOriginal, 'utf8');
  const untranslatedWordCatalog = selectorCatalogOriginal.replace(
    '| `undo_a8283a` | Annuler |', '| `undo_a8283a` | Undo |');
  assert.notEqual(untranslatedWordCatalog, selectorCatalogOriginal, 'Could not alter the French single-word fixture');
  fs.writeFileSync(catalogFile, untranslatedWordCatalog, 'utf8');
  const untranslatedWord = check();
  assert.notEqual(untranslatedWord.status, 0, 'An untranslated English word was accepted');
  assert.match(untranslatedWord.stderr, /untranslated English word/);
  fs.writeFileSync(catalogFile, selectorCatalogOriginal, 'utf8');
  const untranslatedInstallerTitle = selectorCatalogOriginal.replace(
    /(^## Locale de\s*\r?\n[\s\S]*?^\| `markdown_vision_native_setup_c91176` \| ).*?( \|)/m,
    '$1Setup für Markdown Vision Native$2');
  assert.notEqual(untranslatedInstallerTitle, selectorCatalogOriginal, 'Could not alter the German installer-title fixture');
  fs.writeFileSync(catalogFile, untranslatedInstallerTitle, 'utf8');
  const untranslatedInstallerTerm = check();
  assert.notEqual(untranslatedInstallerTerm.status, 0, 'An untranslated installer title term was accepted');
  assert.match(untranslatedInstallerTerm.stderr, /translate installer terminology/);
  fs.writeFileSync(catalogFile, selectorCatalogOriginal, 'utf8');
  const untranslatedInstallerMessage = selectorCatalogOriginal.replace(
    /(^## Locale de\s*\r?\n[\s\S]*?^\| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` \| [^\r\n]*)/m,
    line => line.replace('die Installation fortgesetzt', 'Setup fortgesetzt'));
  assert.notEqual(untranslatedInstallerMessage, selectorCatalogOriginal,
    'Could not alter the German installer-message fixture');
  fs.writeFileSync(catalogFile, untranslatedInstallerMessage, 'utf8');
  const untranslatedInstallerMessageResult = check();
  assert.notEqual(untranslatedInstallerMessageResult.status, 0, 'An untranslated installer message term was accepted');
  assert.match(untranslatedInstallerMessageResult.stderr, /translate installer terminology/);
  fs.writeFileSync(catalogFile, selectorCatalogOriginal, 'utf8');
  const wrongScriptTranslation = selectorCatalogOriginal.replace(
    /(^## Locale hi\s*\r?\n[\s\S]*?^\| `search_text_38d268` \| ).*?( \|)/m,
    '$1Buscar en el texto$2');
  assert.notEqual(wrongScriptTranslation, selectorCatalogOriginal, 'Could not alter the Hindi script fixture');
  fs.writeFileSync(catalogFile, wrongScriptTranslation, 'utf8');
  const wrongScriptPhrase = check();
  assert.notEqual(wrongScriptPhrase.status, 0, 'A Hindi phrase without Devanagari text was accepted');
  assert.match(wrongScriptPhrase.stderr, /missing the expected script/);
  fs.writeFileSync(catalogFile, selectorCatalogOriginal, 'utf8');
  const simplifiedTraditionalText = selectorCatalogOriginal.replace(
    /(^## Locale zh-hant\s*\r?\n[\s\S]*?^\| `search_text_38d268` \| ).*?( \|)/m,
    '$1简体文本$2');
  assert.notEqual(simplifiedTraditionalText, selectorCatalogOriginal, 'Could not alter Traditional Chinese script fixture');
  fs.writeFileSync(catalogFile, simplifiedTraditionalText, 'utf8');
  const simplifiedTraditional = check();
  assert.notEqual(simplifiedTraditional.status, 0, 'Simplified Chinese characters were accepted in zh-hant');
  assert.match(simplifiedTraditional.stderr, /contains a Simplified Chinese character/);
  fs.writeFileSync(catalogFile, selectorCatalogOriginal, 'utf8');
  const lowercaseUkrainianLabel = selectorCatalogOriginal.replace(
    '| `task_4bc74b` | Завдання |', '| `task_4bc74b` | завдання |');
  assert.notEqual(lowercaseUkrainianLabel, selectorCatalogOriginal, 'Could not alter Ukrainian capitalization fixture');
  fs.writeFileSync(catalogFile, lowercaseUkrainianLabel, 'utf8');
  const capitalizationError = check();
  assert.notEqual(capitalizationError.status, 0, 'A lowercase Ukrainian standalone label was accepted');
  assert.match(capitalizationError.stderr, /must start with an uppercase letter/);
  fs.writeFileSync(catalogFile, selectorCatalogOriginal, 'utf8');
  const koreanPunctuation = selectorCatalogOriginal.replace(
    '| `code_copied_39868c` | 코드가 복사되었습니다 |', '| `code_copied_39868c` | 코드가 복사되었습니다. |');
  assert.notEqual(koreanPunctuation, selectorCatalogOriginal, 'Could not alter Korean punctuation fixture');
  fs.writeFileSync(catalogFile, koreanPunctuation, 'utf8');
  const punctuationError = check();
  assert.notEqual(punctuationError.status, 0, 'A Korean UI toast with an added full stop was accepted');
  assert.match(punctuationError.stderr, /must not add terminal punctuation/);
  fs.writeFileSync(catalogFile, selectorCatalogOriginal, 'utf8');
  const inconsistentKoreanTableTerm = selectorCatalogOriginal.replace(
    '| `edit_table_source_c7189f` | 표 원본 편집 |',
    '| `edit_table_source_c7189f` | 테이블 소스 편집 |');
  assert.notEqual(inconsistentKoreanTableTerm, selectorCatalogOriginal, 'Could not alter the Korean table-terminology fixture');
  fs.writeFileSync(catalogFile, inconsistentKoreanTableTerm, 'utf8');
  const koreanTableTermError = check();
  assert.notEqual(koreanTableTermError.status, 0, 'Inconsistent Korean table terminology was accepted');
  assert.match(koreanTableTermError.stderr, /use 표 consistently for table terminology/);
  fs.writeFileSync(catalogFile, selectorCatalogOriginal, 'utf8');
  fs.writeFileSync(catalogFile, selectorCatalogOriginal.replace('| fr | ["Français",', '| fr | ["English",'));
  const untranslatedLanguageName = check();
  assert.notEqual(untranslatedLanguageName.status, 0, 'An English language-selector name was accepted in another locale');
  assert.match(untranslatedLanguageName.stderr, /untranslated English language-selector label/);
  fs.writeFileSync(catalogFile, selectorCatalogOriginal, 'utf8');
  fs.writeFileSync(catalogFile, selectorCatalogOriginal.replace(
    '| hi | ["हिन्दी","भाषा","भाषा बदलने के लिए ऐप फिर से शुरू करें।","सिस्टम की भाषा"] |',
    '| hi | ["हिन्दी","भाषा","भाषा","सिस्टम की भाषा"] |'));
  const duplicateLanguageLabel = check();
  assert.notEqual(duplicateLanguageLabel.status, 0, 'A duplicate language-selector label was accepted');
  assert.match(duplicateLanguageLabel.stderr, /duplicate language-selector labels/);
  fs.writeFileSync(catalogFile, selectorCatalogOriginal, 'utf8');
  const checkNative = () => spawnSync(process.execPath, [path.join(fixture, 'tools/check-native-error-localization.cjs')],
    { encoding: 'utf8' });
  const nativeBaseline = checkNative();
  assert.equal(nativeBaseline.status, 0, nativeBaseline.stderr);
  const nativeMain = path.join(fixture, 'native-tauri/src/main.rs');
  const originalNativeMain = fs.readFileSync(nativeMain, 'utf8');
  fs.writeFileSync(nativeMain, originalNativeMain.replace(
    'MenuItemBuilder::with_id("file-open", "Open…")',
    'MenuItemBuilder::with_id("file-open", "Unlocalized menu command")'), 'utf8');
  const missingNativeMenuTranslation = checkNative();
  assert.notEqual(missingNativeMenuTranslation.status, 0, 'An unlocalized Tauri menu label was accepted');
  assert.match(missingNativeMenuTranslation.stderr, /Tauri native menu label is not translated/);
  fs.writeFileSync(nativeMain, originalNativeMain, 'utf8');
  const optionalNativeMenuLabel = originalNativeMain.replace(
    'let text = required_native_menu_label(&labels, key)?;',
    'let text = labels.get(*key).map(String::as_str).unwrap_or_default();');
  assert.notEqual(optionalNativeMenuLabel, originalNativeMain, 'Could not alter the native menu-label validation fixture');
  fs.writeFileSync(nativeMain, optionalNativeMenuLabel, 'utf8');
  const optionalNativeMenuLabels = checkNative();
  assert.notEqual(optionalNativeMenuLabels.status, 0,
    'A Tauri menu update that silently skips missing localized labels was accepted');
  assert.match(optionalNativeMenuLabels.stderr, /must require translated labels for every menu and menu item/);
  fs.writeFileSync(nativeMain, originalNativeMain, 'utf8');
  const optionalOpenErrorLabels = originalNativeMain.replace(
    'title: String, description: String, close: String',
    'title: Option<String>, description: Option<String>, close: Option<String>');
  assert.notEqual(optionalOpenErrorLabels, originalNativeMain, 'Could not alter the native open-error label signature fixture');
  fs.writeFileSync(nativeMain, optionalOpenErrorLabels, 'utf8');
  const optionalNativeOpenErrorLabels = checkNative();
  assert.notEqual(optionalNativeOpenErrorLabels.status, 0,
    'Optional native open-error labels with English fallbacks were accepted');
  assert.match(optionalNativeOpenErrorLabels.stderr, /must require localized title, description, and close labels/);
  fs.writeFileSync(nativeMain, originalNativeMain, 'utf8');
  fs.writeFileSync(nativeMain, originalNativeMain.replace(
    'let labels = read_discard_labels(labels)?;', 'let labels = labels;'), 'utf8');
  const unvalidatedNativeConfirmationLabels = checkNative();
  assert.notEqual(unvalidatedNativeConfirmationLabels.status, 0,
    'Tauri native confirmation labels without validation were accepted');
  assert.match(unvalidatedNativeConfirmationLabels.stderr, /must be validated before displaying the native dialog/);
  fs.writeFileSync(nativeMain, originalNativeMain, 'utf8');
  const managedMain = path.join(fixture, 'native-windows/MainWindow.xaml.cs');
  const originalManagedMain = fs.readFileSync(managedMain, 'utf8');
  fs.writeFileSync(managedMain, originalManagedMain.replace(
    'FileDialogLabel(labels, "text", "Text files")',
    'FileDialogLabel(labels, "text", "Plain text files")'), 'utf8');
  const missingManagedDialogTranslation = checkNative();
  assert.notEqual(missingManagedDialogTranslation.status, 0, 'An unlocalized managed Windows dialog label was accepted');
  assert.match(missingManagedDialogTranslation.stderr, /managed Windows host text is not translated/);
  fs.writeFileSync(managedMain, originalManagedMain, 'utf8');
  const managedApp = path.join(fixture, 'native-windows/App.xaml.cs');
  const originalManagedApp = fs.readFileSync(managedApp, 'utf8');
  fs.writeFileSync(managedApp, originalManagedApp.replace(
    'StartupTranslations.Format(startupCulture, exception.Message)', 'exception.Message'), 'utf8');
  const unlocalizedManagedLaunchError = checkNative();
  assert.notEqual(unlocalizedManagedLaunchError.status, 0, 'An unlocalized managed Windows launch failure was accepted');
  assert.match(unlocalizedManagedLaunchError.stderr, /detached-launch failures must use localized startup messages/);
  fs.writeFileSync(managedApp, originalManagedApp, 'utf8');
  const cppHost = path.join(fixture, 'native-cpp/WebViewHost.cpp');
  const originalCppHost = fs.readFileSync(cppHost, 'utf8');
  fs.writeFileSync(cppHost, originalCppHost.replace(
    "const values = ['Open Markdown file'",
    "const values = ['Open document'"), 'utf8');
  const missingCppDialogTranslation = checkNative();
  assert.notEqual(missingCppDialogTranslation.status, 0, 'An unlocalized C++ WebView dialog label was accepted');
  assert.match(missingCppDialogTranslation.stderr, /Windows WebView dialog text is not translated/);
  fs.writeFileSync(cppHost, originalCppHost, 'utf8');
  const html = path.join(fixture, 'src/web/index.html');
  const originalHtml = fs.readFileSync(html, 'utf8');
  fs.writeFileSync(html, originalHtml.replace('<title>Markdown Vision</title>', '<title>Unlocalized interface label</title>'), 'utf8');
  const missingHtmlLocalization = checkNative();
  assert.notEqual(missingHtmlLocalization.status, 0, 'Static HTML interface text without a catalog row was accepted');
  assert.match(missingHtmlLocalization.stderr, /static interface text is missing from the localization catalog/);
  fs.writeFileSync(html, originalHtml, 'utf8');
  const editor = path.join(fixture, 'src/web/editor-ui.js');
  const originalEditor = fs.readFileSync(editor, 'utf8');
  fs.writeFileSync(editor, originalEditor + "\nwindow.prompt('Untranslated prompt');\n", 'utf8');
  const missingPrompt = checkNative();
  assert.notEqual(missingPrompt.status, 0, 'A browser prompt without localization was accepted');
  assert.match(missingPrompt.stderr, /browser dialog messages must use interfaceText/);
  fs.writeFileSync(editor, originalEditor + "\nconfirm('Untranslated confirmation');\n", 'utf8');
  const missingConfirmation = checkNative();
  assert.notEqual(missingConfirmation.status, 0, 'A direct browser confirmation without localization was accepted');
  assert.match(missingConfirmation.stderr, /browser dialog messages must use interfaceText/);
  fs.writeFileSync(editor, originalEditor + "\nfield.textContent = 'Untranslated label';\n", 'utf8');
  const missingLiteralLabel = checkNative();
  assert.notEqual(missingLiteralLabel.status, 0, 'A hard-coded interface label was accepted');
  assert.match(missingLiteralLabel.stderr, /literal interface text must use the localization layer/);
  fs.writeFileSync(editor, originalEditor + "\nfield.placeholder = 'Untranslated placeholder';\n", 'utf8');
  const missingLiteralPlaceholder = checkNative();
  assert.notEqual(missingLiteralPlaceholder.status, 0, 'A hard-coded placeholder was accepted');
  assert.match(missingLiteralPlaceholder.stderr, /literal interface text must use the localization layer/);
  fs.writeFileSync(editor, originalEditor + "\nfield.setAttribute('aria-label', 'Untranslated label');\n", 'utf8');
  const missingLiteralAttribute = checkNative();
  assert.notEqual(missingLiteralAttribute.status, 0, 'A hard-coded accessible label was accepted');
  assert.match(missingLiteralAttribute.stderr, /literal interface attributes must use the localization layer/);
  fs.writeFileSync(editor, originalEditor + "\nfield.setAttribute('aria-valuetext', '50% Visual');\n", 'utf8');
  const missingLiteralValue = checkNative();
  assert.notEqual(missingLiteralValue.status, 0, 'A hard-coded accessible value was accepted');
  assert.match(missingLiteralValue.stderr, /literal interface attributes must use the localization layer/);
  fs.writeFileSync(editor, originalEditor + "\ninterfaceText('Untranslated fixture message');\n", 'utf8');
  const missingText = checkNative();
  assert.notEqual(missingText.status, 0, 'An untranslated interface message was accepted');
  assert.match(missingText.stderr, /text is not translated: Untranslated fixture message/);
  fs.writeFileSync(editor, originalEditor + "\nsetLocalizedAccessibleLabel(field, 'Untranslated accessible label');\n", 'utf8');
  const missingLabel = checkNative();
  assert.notEqual(missingLabel.status, 0, 'An untranslated accessible label was accepted');
  assert.match(missingLabel.stderr, /text is not translated: Untranslated accessible label/);
  fs.writeFileSync(editor, originalEditor + "\nsetLocalizedAccessibleDescription(field, 'Untranslated accessible description');\n", 'utf8');
  const missingDescription = checkNative();
  assert.notEqual(missingDescription.status, 0, 'An untranslated accessible description was accepted');
  assert.match(missingDescription.stderr, /text is not translated: Untranslated accessible description/);
  fs.writeFileSync(editor, originalEditor + "\nsetLocalizedAccessibleDescription(field, flag ? 'Save' : 'Untranslated alternate description');\n", 'utf8');
  const missingAlternateDescription = checkNative();
  assert.notEqual(missingAlternateDescription.status, 0, 'An untranslated conditional accessible description was accepted');
  assert.match(missingAlternateDescription.stderr, /text is not translated: Untranslated alternate description/);
  fs.writeFileSync(editor, originalEditor + '\ninterfaceText("Untranslated double-quoted message");\n', 'utf8');
  const missingDoubleQuoted = checkNative();
  assert.notEqual(missingDoubleQuoted.status, 0, 'An untranslated double-quoted message was accepted');
  assert.match(missingDoubleQuoted.stderr, /text is not translated: Untranslated double-quoted message/);
  fs.writeFileSync(editor, originalEditor + "\ninterfaceText(flag ? 'Save' : 'Untranslated alternate');\n", 'utf8');
  const missingAlternate = checkNative();
  assert.notEqual(missingAlternate.status, 0, 'An untranslated conditional alternative was accepted');
  assert.match(missingAlternate.stderr, /text is not translated: Untranslated alternate/);
  fs.writeFileSync(editor, originalEditor + '\ninterfaceText(`Version ${version}`);\n', 'utf8');
  const dynamicKey = checkNative();
  assert.notEqual(dynamicKey.status, 0, 'A dynamic translation key was accepted');
  assert.match(dynamicKey.stderr, /stable translation key with placeholders/);
  fs.writeFileSync(editor, originalEditor + "\nreason = 'Untranslated restriction';\n", 'utf8');
  const missingRestriction = checkNative();
  assert.notEqual(missingRestriction.status, 0, 'An untranslated visual-editor restriction was accepted');
  assert.match(missingRestriction.stderr, /text is not translated: Untranslated restriction/);
  fs.writeFileSync(editor, originalEditor + "\nvisualAction('Untranslated action', 'fixture');\n", 'utf8');
  const missingAction = checkNative();
  assert.notEqual(missingAction.status, 0, 'An untranslated visual-editor action was accepted');
  assert.match(missingAction.stderr, /text is not translated: Untranslated action/);
  fs.writeFileSync(editor, originalEditor + "\nconst fields = [['text', 'Untranslated field', '']];\n", 'utf8');
  const missingField = checkNative();
  assert.notEqual(missingField.status, 0, 'An untranslated visual-editor field was accepted');
  assert.match(missingField.stderr, /text is not translated: Untranslated field/);
  fs.writeFileSync(editor, originalEditor + "\nconst actions = [['add-row', 'Untranslated table action']];\n", 'utf8');
  const missingChoice = checkNative();
  assert.notEqual(missingChoice.status, 0, 'An untranslated contextual choice was accepted');
  assert.match(missingChoice.stderr, /text is not translated: Untranslated table action/);
  fs.writeFileSync(editor, originalEditor + "\nfunction fixture() { return 'Untranslated validation message.'; }\n", 'utf8');
  const missingValidation = checkNative();
  assert.notEqual(missingValidation.status, 0, 'An untranslated validation message was accepted');
  assert.match(missingValidation.stderr, /text is not translated: Untranslated validation message/);
  fs.writeFileSync(editor, originalEditor + "\nsetLocalizedErrorStatus(field, 'Untranslated error: {error}', error);\n", 'utf8');
  const missingErrorTemplate = checkNative();
  assert.notEqual(missingErrorTemplate.status, 0, 'An untranslated error-status template was accepted');
  assert.match(missingErrorTemplate.stderr, /text is not translated: Untranslated error: \{error\}/);
  fs.writeFileSync(editor, originalEditor, 'utf8');
  const app = path.join(fixture, 'src/web/app.js');
  const originalApp = fs.readFileSync(app, 'utf8');
  const nativePreferences = path.join(fixture, 'native-tauri/src/preferences.rs');
  const originalPreferences = fs.readFileSync(nativePreferences, 'utf8');
  const wrongPreferences = originalPreferences.replace('"pl" |', '"xx" |');
  assert.notEqual(wrongPreferences, originalPreferences, 'Could not alter native language fixture');
  fs.writeFileSync(nativePreferences, wrongPreferences, 'utf8');
  const missingNative = checkNative();
  assert.notEqual(missingNative.status, 0, 'An incorrect native language list was accepted');
  assert.match(missingNative.stderr, /Native and catalog language lists differ/);
  fs.writeFileSync(nativePreferences, originalPreferences, 'utf8');
  for (const file of generated) {
    const target = path.join(fixture, file);
    const original = fs.readFileSync(target, 'utf8');
    // Modify within the generated renderer block; the other outputs are wholly generated.
    const modified = file === 'src/web/app.js'
      ? original.replace('// BEGIN GENERATED LOCALE PREVIEW', '// BEGIN GENERATED LOCALE PREVIEW\n// stale')
      : original + '\nSTALE';
    assert.notEqual(modified, original, `Could not alter fixture for ${file}`);
    fs.writeFileSync(target, modified, 'utf8');
    const result = check();
    assert.notEqual(result.status, 0, `Stale ${file} was accepted`);
    assert.match(result.stderr, /stale/i, `Unexpected validation error for ${file}: ${result.stderr}`);
    fs.writeFileSync(target, original, 'utf8');
  }
  const catalog = path.join(fixture, 'docs/LOCALIZATION.md');
  const originalCatalog = fs.readFileSync(catalog, 'utf8');
  const englishCarryover = originalCatalog.replace('| `save_your_changes_56dd16` | هل تريد حفظ تغييراتك؟ |',
    '| `save_your_changes_56dd16` | Save your changes? |');
  assert.notEqual(englishCarryover, originalCatalog, 'Could not alter Arabic translation fixture');
  fs.writeFileSync(catalog, englishCarryover, 'utf8');
  const untranslated = check();
  assert.notEqual(untranslated.status, 0, 'An untranslated Arabic message was accepted');
  assert.match(untranslated.stderr, /untranslated English phrase/);
  const duplicateDiscard = originalCatalog.replace('| `discard_eb1a70` | 변경 사항 버리기 |',
    '| `discard_eb1a70` | 취소 |');
  assert.notEqual(duplicateDiscard, originalCatalog, 'Could not alter Korean discard label');
  fs.writeFileSync(catalog, duplicateDiscard, 'utf8');
  const invalidDiscard = check();
  assert.notEqual(invalidDiscard.status, 0, 'A discard label identical to cancel was accepted');
  assert.match(invalidDiscard.stderr, /discard must be distinct/);
  const duplicateNewDocument = originalCatalog.replace('| `discard_changes_f9bfa3` | 변경 사항 버리기 |',
    '| `discard_changes_f9bfa3` | 취소 |');
  assert.notEqual(duplicateNewDocument, originalCatalog, 'Could not alter Korean new-document discard label');
  fs.writeFileSync(catalog, duplicateNewDocument, 'utf8');
  const invalidNewDocument = check();
  assert.notEqual(invalidNewDocument.status, 0, 'Duplicate new-document confirmation labels were accepted');
  assert.match(invalidNewDocument.stderr, /save, discard changes and cancel must have distinct labels/);
  const duplicateDismiss = originalCatalog.replace('| `dismiss_48845b` | ปิดการแจ้งเตือน |',
    '| `dismiss_48845b` | ยกเลิก |');
  assert.notEqual(duplicateDismiss, originalCatalog, 'Could not alter Thai dismiss label');
  fs.writeFileSync(catalog, duplicateDismiss, 'utf8');
  const invalidDismiss = check();
  assert.notEqual(invalidDismiss.status, 0, 'A dismiss label identical to cancel was accepted');
  assert.match(invalidDismiss.stderr, /dismiss must be distinct/);
  const duplicateDirection = originalCatalog.replace('| `next_match_825e5a` | ผลการค้นหาถัดไป |',
    '| `next_match_825e5a` | ผลการค้นหาก่อนหน้า |');
  assert.notEqual(duplicateDirection, originalCatalog, 'Could not alter Thai search navigation label');
  fs.writeFileSync(catalog, duplicateDirection, 'utf8');
  const invalidDirection = check();
  assert.notEqual(invalidDirection.status, 0, 'Identical previous and next labels were accepted');
  assert.match(invalidDirection.stderr, /opposing actions.*must have distinct labels/);
  const polishStart = originalCatalog.indexOf('## Locale pl');
  const polishEnd = originalCatalog.indexOf('\n## Locale ', polishStart);
  assert.ok(polishStart >= 0 && polishEnd > polishStart, 'Could not locate Polish catalog section');
  const polish = originalCatalog.slice(polishStart, polishEnd);
  const matchingForms = polish.replace('| `count_match_ef9195` | {count} wynik wyszukiwania |',
    '| `count_match_ef9195` | {count} wyniki wyszukiwania |');
  assert.notEqual(matchingForms, polish, 'Could not align Polish singular and general search forms');
  fs.writeFileSync(catalog, originalCatalog.slice(0, polishStart) + matchingForms + originalCatalog.slice(polishEnd), 'utf8');
  const syncPlural = spawnSync(process.execPath, [path.join(fixture, 'tools/export-localization.cjs'), '--sync-preview'], { encoding: 'utf8' });
  assert.equal(syncPlural.status, 0, syncPlural.stderr);
  const generatedApp = fs.readFileSync(app, 'utf8');
  const previewBlock = /const previewMessages = (\{[\s\S]*?\n\});/.exec(generatedApp)?.[1];
  assert.ok(previewBlock, 'Missing generated messages in plural fixture');
  const polishSearch = vm.runInNewContext(`(${previewBlock})`).pl.search;
  assert.equal(polishSearch.few, '{count} wyniki wyszukiwania');
  assert.equal(polishSearch.many, '{count} wyników wyszukiwania');
  fs.writeFileSync(app, originalApp, 'utf8');
  const changedWords = originalCatalog.replace('{"one":"{count} słowo"', '{"one":"{count} wyraz"');
  assert.notEqual(changedWords, originalCatalog, 'Could not alter Polish word-count form');
  fs.writeFileSync(catalog, changedWords, 'utf8');
  const staleWords = check();
  assert.notEqual(staleWords.status, 0, 'A changed word-count form did not invalidate the renderer');
  assert.match(staleWords.stderr, /Application translations are stale/);
  fs.writeFileSync(catalog, originalCatalog.replace('{"one":"{count} słowo"', '{"one":"słowo"'), 'utf8');
  const invalidWords = check();
  assert.notEqual(invalidWords.status, 0, 'A word-count form without its count was accepted');
  assert.match(invalidWords.stderr, /invalid word-count form/);
  const controlWord = originalCatalog.replace('{"one":"{count} słowo"', '{"one":"{count} słowo\\u0001"');
  assert.notEqual(controlWord, originalCatalog, 'Could not alter Polish word-count control-character fixture');
  fs.writeFileSync(catalog, controlWord, 'utf8');
  const invalidControl = check();
  assert.notEqual(invalidControl.status, 0, 'A word-count form with a control character was accepted');
  assert.match(invalidControl.stderr, /invalid word-count form/);
  const missingWordCategory = originalCatalog.replace('"few":"{count} słowa",', '');
  assert.notEqual(missingWordCategory, originalCatalog, 'Could not remove Polish word-count category');
  fs.writeFileSync(catalog, missingWordCategory, 'utf8');
  const invalidCategory = check();
  assert.notEqual(invalidCategory.status, 0, 'A required Polish word-count category was omitted');
  assert.match(invalidCategory.stderr, /missing required word-count category/);
  const changedSearchForm = originalCatalog.replace('{"few":"{count} wyniki wyszukiwania"',
    '{"few":"{count} wyniki szukania"');
  assert.notEqual(changedSearchForm, originalCatalog, 'Could not alter Polish search-result form');
  fs.writeFileSync(catalog, changedSearchForm, 'utf8');
  const staleSearchForm = check();
  assert.notEqual(staleSearchForm.status, 0, 'A changed search-result form did not invalidate the renderer');
  assert.match(staleSearchForm.stderr, /Application translations are stale/);
  fs.writeFileSync(catalog, originalCatalog.replace('{"few":"{count} wyniki wyszukiwania"',
    '{"few":"wyniki wyszukiwania"'), 'utf8');
  const invalidSearchForm = check();
  assert.notEqual(invalidSearchForm.status, 0, 'A search-result form without its count was accepted');
  assert.match(invalidSearchForm.stderr, /invalid search-result form/);
  const changedSearch = originalCatalog.replace('| `search_text_38d268` | Szukaj w tekście |',
    '| `search_text_38d268` | Znajdź tekst |');
  assert.notEqual(changedSearch, originalCatalog, 'Could not alter Polish search label fixture');
  fs.writeFileSync(catalog, changedSearch, 'utf8');
  const staleSearch = check();
  assert.notEqual(staleSearch.status, 0, 'A changed search label did not invalidate the renderer');
  assert.match(staleSearch.stderr, /Application translations are stale/);
  const changedScope = originalCatalog.replace('| `visual_only_29a136` | Tylko edytor wizualny |',
    '| `visual_only_29a136` | Wyłącznie edytor wizualny |');
  assert.notEqual(changedScope, originalCatalog, 'Could not alter Polish search scope fixture');
  fs.writeFileSync(catalog, changedScope, 'utf8');
  const staleScope = check();
  assert.notEqual(staleScope.status, 0, 'A changed search scope did not invalidate the renderer');
  assert.match(staleScope.stderr, /Application translations are stale/);
  const unsafeFilename = originalCatalog.replace('| `untitled_md_2dccf8` | Sans titre.md |',
    '| `untitled_md_2dccf8` | ../outside.md |');
  assert.notEqual(unsafeFilename, originalCatalog, 'Could not alter suggested filename fixture');
  fs.writeFileSync(catalog, unsafeFilename, 'utf8');
  const invalidFilename = check();
  assert.notEqual(invalidFilename.status, 0, 'A path used as a suggested filename was accepted');
  assert.match(invalidFilename.stderr, /invalid suggested Markdown filename/);
  const controlFilename = originalCatalog.replace('| `untitled_md_2dccf8` | Sans titre.md |',
    '| `untitled_md_2dccf8` | Sans\u0085titre.md |');
  assert.notEqual(controlFilename, originalCatalog, 'Could not alter filename control-character fixture');
  fs.writeFileSync(catalog, controlFilename, 'utf8');
  const invalidControlFilename = check();
  assert.notEqual(invalidControlFilename.status, 0, 'A filename containing a C1 control character was accepted');
  assert.match(invalidControlFilename.stderr, /invalid suggested Markdown filename/);
  const unicodeFilename = originalCatalog.replace('| `untitled_md_2dccf8` | Sans titre.md |',
    `| \`untitled_md_2dccf8\` | ${'文'.repeat(80)}.md |`);
  assert.notEqual(unicodeFilename, originalCatalog, 'Could not alter Unicode filename fixture');
  fs.writeFileSync(catalog, unicodeFilename, 'utf8');
  const validUnicodeFilename = spawnSync(process.execPath, [path.join(fixture, 'tools/export-localization.cjs'), '--check'],
    { encoding: 'utf8' });
  assert.equal(validUnicodeFilename.status, 0, validUnicodeFilename.stderr);
  const reservedFilename = originalCatalog.replace('| `untitled_md_2dccf8` | Sans titre.md |',
    '| `untitled_md_2dccf8` | CON.md |');
  assert.notEqual(reservedFilename, originalCatalog, 'Could not alter reserved filename fixture');
  fs.writeFileSync(catalog, reservedFilename, 'utf8');
  const invalidReservedFilename = check();
  assert.notEqual(invalidReservedFilename.status, 0, 'A reserved Windows filename was accepted');
  assert.match(invalidReservedFilename.stderr, /invalid suggested Markdown filename/);
  const unsafeShortcut = originalCatalog.replace('| `uninstall_fe1995` | Désinstaller |',
    '| `uninstall_fe1995` | Désinstaller: Markdown Vision |');
  assert.notEqual(unsafeShortcut, originalCatalog, 'Could not alter uninstall shortcut fixture');
  fs.writeFileSync(catalog, unsafeShortcut, 'utf8');
  const invalidShortcut = check();
  assert.notEqual(invalidShortcut.status, 0, 'An invalid Windows shortcut name was accepted');
  assert.match(invalidShortcut.stderr, /Invalid uninstall shortcut name for fr/);
  const damagedCatalog = originalCatalog.replace(
    '| `number_of_columns_2_8_893663` | Nombre de colonnes (2 à 8) |',
    '| `number_of_columns_2_8_893663` | Nombre de colonnes (2 à 9) |');
  assert.notEqual(damagedCatalog, originalCatalog, 'Could not alter column-range fixture');
  fs.writeFileSync(catalog, damagedCatalog, 'utf8');
  const invalidRange = check();
  assert.notEqual(invalidRange.status, 0, 'Wrong translated column range was accepted');
  assert.match(invalidRange.stderr, /supported column range 2–8/);
  const longLabelCatalog = originalCatalog.replace(
    '| `open_markdown_file_b7764a` | Ouvrir le fichier Markdown |',
    `| \`open_markdown_file_b7764a\` | ${'x'.repeat(257)} |`);
  assert.notEqual(longLabelCatalog, originalCatalog, 'Could not alter dialog-label fixture');
  fs.writeFileSync(catalog, longLabelCatalog, 'utf8');
  const longLabel = check();
  assert.notEqual(longLabel.status, 0, 'Oversized native dialog label was accepted');
  assert.match(longLabel.stderr, /invalid for the native dialog bridge/);
  const wrongTurkish = originalCatalog.replace("Markdown'da düzenleyin", "Markdown'de düzenleyin");
  assert.notEqual(wrongTurkish, originalCatalog, 'Could not alter Turkish suffix fixture');
  fs.writeFileSync(catalog, wrongTurkish, 'utf8');
  const turkishError = check();
  assert.notEqual(turkishError.status, 0, 'An incorrect Turkish product suffix was accepted');
  assert.match(turkishError.stderr, /check the suffix after the product name/);
  const wrongKorean = originalCatalog.replace('Markdown Vision을 닫으시겠습니까?', 'Markdown Vision를 닫으시겠습니까?');
  assert.notEqual(wrongKorean, originalCatalog, 'Could not alter Korean particle fixture');
  fs.writeFileSync(catalog, wrongKorean, 'utf8');
  const koreanError = check();
  assert.notEqual(koreanError.status, 0, 'An incorrect Korean product particle was accepted');
  assert.match(koreanError.stderr, /check the particle after the product name/);
  const unsafeColumn = originalCatalog.replace('| `new_column_editor` | Neue Spalte |',
    '| `new_column_editor` | Neue *Spalte* |');
  assert.notEqual(unsafeColumn, originalCatalog, 'Could not alter inserted table header fixture');
  fs.writeFileSync(catalog, unsafeColumn, 'utf8');
  const invalidColumn = check();
  assert.notEqual(invalidColumn.status, 0, 'Markdown syntax in an inserted table header was accepted');
  assert.match(invalidColumn.stderr, /new_column_editor contains Markdown syntax/);
  const entityColumn = originalCatalog.replace('| `new_column_editor` | Neue Spalte |',
    '| `new_column_editor` | Neue &amp; Spalte |');
  assert.notEqual(entityColumn, originalCatalog, 'Could not alter table header entity fixture');
  fs.writeFileSync(catalog, entityColumn, 'utf8');
  const invalidEntity = check();
  assert.notEqual(invalidEntity.status, 0, 'An HTML entity in an inserted table header was accepted');
  assert.match(invalidEntity.stderr, /new_column_editor contains Markdown syntax/);
  const corruptedColumn = originalCatalog.replace('| `new_column_editor` | Nowa kolumna |',
    '| `new_column_editor` | Now?kolumna |');
  assert.notEqual(corruptedColumn, originalCatalog, 'Could not alter corrupted text fixture');
  fs.writeFileSync(catalog, corruptedColumn, 'utf8');
  const encodingError = check();
  assert.notEqual(encodingError.status, 0, 'A corrupted translation was accepted');
  assert.match(encodingError.stderr, /possible character encoding corruption/);
  const partialCorruption = originalCatalog.replace('| `new_column_editor` | Nový sloupec |',
    '| `new_column_editor` | Nov? sloupec |');
  assert.notEqual(partialCorruption, originalCatalog, 'Could not alter partial corruption fixture');
  fs.writeFileSync(catalog, partialCorruption, 'utf8');
  const partialEncodingError = check();
  assert.notEqual(partialEncodingError.status, 0, 'A partly corrupted translation was accepted');
  assert.match(partialEncodingError.stderr, /possible character encoding corruption/);
  const wrongScript = originalCatalog.replace('| `new_column_editor` | 새 열 |',
    '| `new_column_editor` | Column |');
  assert.notEqual(wrongScript, originalCatalog, 'Could not alter script validation fixture');
  fs.writeFileSync(catalog, wrongScript, 'utf8');
  const scriptError = check();
  assert.notEqual(scriptError.status, 0, 'A label missing the target script was accepted');
  assert.match(scriptError.stderr, /missing (?:its|the) expected script/);
  const mojibakeColumn = originalCatalog.replace('| `new_column_editor` | Nouvelle colonne |',
    '| `new_column_editor` | Nouvelle colonn\u00c3\u00a9 |');
  assert.notEqual(mojibakeColumn, originalCatalog, 'Could not alter mojibake fixture');
  fs.writeFileSync(catalog, mojibakeColumn, 'utf8');
  const mojibakeError = check();
  assert.notEqual(mojibakeError.status, 0, 'Mojibake in a translation was accepted');
  assert.match(mojibakeError.stderr, /possible mojibake/);
  const corruptLanguage = originalCatalog.replace('["Español","Idioma",', '["Espa?ol","Idioma",');
  assert.notEqual(corruptLanguage, originalCatalog, 'Could not alter language selector encoding fixture');
  fs.writeFileSync(catalog, corruptLanguage, 'utf8');
  const languageEncodingError = check();
  assert.notEqual(languageEncodingError.status, 0, 'A corrupted language name was accepted');
  assert.match(languageEncodingError.stderr, /invalid language selector labels/);
  const ambiguousTable = originalCatalog.replace('| `remove_column_9807a2` | Odebrat sloupec |',
    '| `remove_column_9807a2` | Odebrat řádek |');
  assert.notEqual(ambiguousTable, originalCatalog, 'Could not alter table action fixture');
  fs.writeFileSync(catalog, ambiguousTable, 'utf8');
  const duplicateTableAction = check();
  assert.notEqual(duplicateTableAction.status, 0, 'Ambiguous table actions were accepted');
  assert.match(duplicateTableAction.stderr, /table action labels must be distinct/);
  fs.writeFileSync(catalog, originalCatalog, 'utf8');
  const unexpected = path.join(fixture, 'native-tauri/macos-localizations/obsolete.lproj');
  fs.mkdirSync(unexpected);
  const extraLocale = check();
  assert.notEqual(extraLocale.status, 0, 'Unexpected macOS localization directory was accepted');
  assert.match(extraLocale.stderr, /Unexpected macOS localization directory/);
  fs.rmdirSync(unexpected);
  fs.unlinkSync(path.join(fixture, 'native-tauri/macos-localizations/zh-Hant.lproj/InfoPlist.strings'));
  const missingLocale = check();
  assert.notEqual(missingLocale.status, 0, 'Missing Traditional Chinese macOS resources were accepted');
  assert.match(missingLocale.stderr, /macOS document type translations are stale/);
  console.log('Localization generation checks reject stale outputs for all platforms.');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
