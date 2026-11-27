const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const installer = fs.readFileSync(path.join(__dirname, '..', 'native-cpp', 'installer.nsi'), 'utf8');
const translations = fs.readFileSync(path.join(__dirname, '..', 'native-cpp', 'installer-localization.nsh'), 'utf8');
assert.match(installer, /^Caption "\$\(MVSetupCaption\)"\s*$/m, 'Installer caption must use the localized title');
const loaded = [...translations.matchAll(/^LoadLanguageFile /gm)].length;
const captions = [...translations.matchAll(/^LangString MVSetupCaption \d+ /gm)].length;
assert.ok(loaded >= 22, 'Missing installer language tables');
assert.equal(captions, loaded, 'Every installer language needs a translated title');
assert.equal([...translations.matchAll(/^LangString MVPreviewHandler \d+ /gm)].length, loaded,
  'Every installer language needs a translated preview-handler description');
assert.equal([...translations.matchAll(/^LangString MVUninstall \d+ /gm)].length, loaded,
  'Every installer language needs a translated uninstall shortcut label');
assert.match(installer, /CreateShortcut "\$SMPROGRAMS\\Markdown Vision\\\$\(MVUninstall\) - Markdown Vision\.lnk"/,
  'The uninstall shortcut must use the localized label');
assert.equal([...installer.matchAll(/WriteRegStr[^\r\n]+"\$\(MVPreviewHandler\)"/g)].length, 2,
  'Both preview-handler registrations must use the localized description');
const block = (name) => {
  const match = new RegExp(`^Function ${name}\\r?\\n([\\s\\S]*?)^FunctionEnd`, 'm').exec(installer);
  assert.ok(match, `Missing installer function ${name}`);
  return match[1];
};

const choicePage = block('DefaultMarkdownPage');
const choiceSaved = block('DefaultMarkdownPageLeave');
const finishPage = block('FinishPageLeave');
const init = block('.onInit');
const uninstallInit = block('un.onInit');
const chineseFallback = /^!macro SelectChineseInstallerLanguage\r?\n([\s\S]*?)^!macroend/m.exec(installer)?.[1];
assert.ok(chineseFallback, 'Missing Traditional Chinese regional fallback');
for (const id of [3076, 5124, 31748]) assert.match(chineseFallback, new RegExp(`\\$0 == ${id}\\b`));
assert.match(chineseFallback, /StrCpy \$LANGUAGE 1028/);
assert.match(init, /!insertmacro SelectChineseInstallerLanguage/);
assert.match(uninstallInit, /!insertmacro SelectChineseInstallerLanguage/);
assert.match(choicePage, /\$\{NSD_CreateCheckbox\}[^\r\n]*"\$\(MVDefaultApp\)"/);
assert.match(choicePage, /\$\{NSD_SetState\} \$DefaultMarkdownCheckbox \$\{BST_UNCHECKED\}/);
assert.match(choiceSaved, /\$\{NSD_GetState\} \$DefaultMarkdownCheckbox/);
assert.match(finishPage, /\$\{If\} \$SetAsDefaultMarkdown == "1"[\s\S]*?ms-settings:defaultapps[\s\S]*?\$\{EndIf\}/);

for (const extension of ['md', 'markdown', 'mdown', 'mkd']) {
  const key = `Software\\Classes\\.${extension}`;
  const direct = new RegExp(`^\\s*(?:WriteRegStr|DeleteRegValue)\\s+HKLM\\s+"${key.replace(/\\/g, '\\\\').replace('.', '\\.')}"\\s+""`, 'mi');
  assert.doesNotMatch(installer, direct, `${extension}: installer must not overwrite the default handler`);
  assert.ok(installer.includes('"' + key + '\\OpenWithProgids" "${APP_PROGID}"'), `${extension}: missing Open With registration`);
  assert.ok(installer.includes('"${APP_CAPABILITIES}\\FileAssociations" ".' + extension + '" "${APP_PROGID}"'), `${extension}: missing registered capability`);
}
console.log('Installer registers Markdown file types without changing default handlers.');
