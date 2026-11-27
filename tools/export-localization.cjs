const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const catalogPath = path.join(root, 'docs', 'LOCALIZATION.md');
const rendererPath = path.join(root, 'src', 'web', 'app.js');

const previewKeys = {
  previousMatch: 'previous_match_daa2f8',
  nextMatch: 'next_match_825e5a',
  closeSearch: 'close_search_55656b',
  fixedFonts: 'count_fixed_width_fonts_available_5df530',
  proportionalFonts: 'count_variable_width_fonts_available_9d234c',
  fontMatches: 'count_matches_for_query_7db710',
  noFixedFonts: 'no_fixed_width_fonts_match_query_fb1fab',
  noProportionalFonts: 'no_variable_width_fonts_match_query_a64030',
  fontLoading: 'loading_installed_fonts_200c74',
  fontName: 'enter_the_name_of_any_installed_font_b57a72',
  position: 'current_of_total_35d900',
  scopedPosition: 'current_of_total_scope_94ebe5',
  settings: 'settings_74a883',
  closeSettings: 'close_settings_0ccfef',
  proportionalFont: 'variable_width_font_0836b2',
  fixedFont: 'fixed_width_font_3de094',
  proportionalHint: 'type_a_font_name_or_choose_an_installed_font_244fa3',
  fixedHint: 'used_for_code_and_other_monospaced_text_84b6ed',
  textSize: 'text_size_d68761',
  automaticTextSize: 'automatic_text_size_919785',
  automatic: 'automatic_d461a4',
  lineSpacing: 'line_spacing_0db45d',
  pageWidth: 'page_width_limit_19528b',
  automaticPageWidth: 'automatic_page_width_bd5c30',
  cursor: 'line_line_column_column_21e9f4',
  saving: 'saving_23e392',
  unsaved: 'unsaved_6250d5',
  saved: 'saved_b5c120',
  sizePx: 'size_px_8d05e6',
};

const untranslatedPhraseStopWords = new Set([
  'a', 'an', 'and', 'as', 'at', 'be', 'before', 'by', 'can', 'could', 'do', 'for', 'from',
  'has', 'have', 'in', 'into', 'is', 'it', 'of', 'on', 'or', 'please', 'should', 'the', 'then',
  'this', 'to', 'use', 'with', 'you', 'your',
]);
const preservedEnglishTerms = new Set([
  'Alt', 'Ctrl', 'DEB', 'Edge', 'Font', 'GNU', 'GPL', 'HTTP', 'HTTPS', 'License', 'Libertinus',
  'Linux', 'Lloyd', 'Markdown', 'Mark', 'Microsoft', 'Native', 'Open', 'RPM', 'SIL', 'URL',
  'UTF', 'Vision', 'WebView2', 'Windows', 'macOS',
].map(term => term.toLowerCase()));
const untranslatedPhraseExceptions = new Map([
  ['unknown_native_method_method_cc7ca9', new Map([['nl', new Set(['native method'])]])],
]);
const installerTerminologyKeys = new Set([
  'markdown_vision_native_setup_c91176',
  'download_and_run_the_markdown_vision_installer_save_any_3e315d',
  'markdown_vision_is_running_save_any_unsaved_documents_b_52a23b',
  'markdown_vision_is_still_running_close_it_and_select_re_7c911d',
  'setup_could_not_close_markdown_vision_close_it_manually_f94a3c',
  'the_existing_markdown_vision_installation_could_not_be_5fb02b',
  'open_markdown_vision_when_setup_closes_8422c7',
  'markdown_vision_native_could_not_be_installed_setup_wil_a877f0',
  'uninstall_fe1995',
]);



const previewInterfaceSources = [
  'Markdown formatting', 'Undo', 'Redo', 'Bold (Ctrl+B)', 'Bold', 'Italic (Ctrl+I)', 'Italic',
  'Strikethrough', 'Cycle heading level (H1–H6, then normal text)', 'Cycle heading level',
  'Bulleted list', 'Task list', 'Numbered list', 'Quote', 'Inline code', 'Code block', 'Link', 'Insert table',
  'Edit Markdown', 'Return to reader', 'New Markdown file (Ctrl+N)', 'New Markdown file', 'Open Markdown file',
  'Print (Ctrl+P)', 'Print document', 'Switch to dark mode', 'Switch to light mode', 'About Markdown Vision',
  'Markdown editor', 'Editor view', 'Markdown', 'Markdown left, Visual right', 'Split ↔',
  'Visual above Markdown', 'Split ↕', 'Visual', 'Save (Ctrl+S)', 'Save', 'Save As (Ctrl+Shift+S)', 'Save As…',
  'Markdown source', 'Visual editor', 'Visual editing restriction', 'Edit in Markdown', 'Dismiss',
  'Markdown pane width', 'Visual pane height', '{percent}% Markdown', '{percent}% Visual',
  'Save your changes?', 'Save your current document before creating a new file.', 'Cancel', 'Discard changes',
  'Could not save the draft. Your edits are still open.', 'Copy code', 'Code copied', 'Could not copy code',
  'Could not open the print dialog.', 'Back to footnote reference',
  '© 2026 Mark Lloyd', 'GNU GPLv3 license',
  'Version {version}', 'Latest version: checking…', 'Latest version: {version}',
  'Latest compatible version: {version}', 'Update', 'Check for updates', 'Restart Markdown Vision',
  'Unsupported architecture', 'Unsupported platform', 'Installer verification is unavailable',
  'Upgrade Markdown Vision', 'Download macOS update', 'Download Linux update',
  'Unable to check for updates. Check your internet connection and try again.',
  'Downloading and verifying the update. You may be asked to authenticate.',
  'Update installed. Restart to use the new version.', 'Update failed: {error}',
  'Would you like Markdown Vision to open Markdown files by default?',
  'Could not set Markdown Vision as the default Markdown app.',
  'Download and run the Markdown Vision installer? Save any open documents first. Setup may ask to close Markdown Vision.',
  'Downloading and verifying update…', 'Installer started.',
  'Could not download, verify, or start the installer. Please try again.',
  'Discard unsaved changes and restart?', 'Could not restart: {error}',
  'Discard your unsaved changes and open another document?',
];

function syncPreview({ messages, locales, wordForms, searchForms }, checkOnly = false) {
  const bySource = new Map(Object.values(messages).map(message => [message.source, message]));
  const interfaceSources = new Set(previewInterfaceSources);
  for (const message of Object.values(messages)) {
    if (message.locations.includes('`src/web/editor-ui.js:')
        || message.locations.includes('`native-tauri/src/document.rs:')
        || message.locations.includes('`native-tauri/src/updater.rs:')
        || message.locations.includes('`native-tauri/src/main.rs:')
        || message.locations.includes('`native-tauri/bridge.js:')
        || message.locations.includes('`native-cpp/WebViewHost.cpp:')
        || message.locations.includes('`native-windows/MainWindow.xaml.cs:')) {
      interfaceSources.add(message.source);
    }
  }
  const entries = locales.map(locale => {
    const words = wordForms[locale];
    const read = (key) => messages[key]?.translations[locale] ?? fail(`No preview translation for ${locale}: ${key}`);
    const searchText = read('search_text_38d268');
    const searchPanel = read('text_search_10155f');
    const sourceOnly = read('markdown_only_f6e1f7');
    const visualOnly = read('visual_only_29a136');
    const copy = Object.fromEntries(Object.entries(previewKeys).map(([name, key]) => [name, read(key)]));
    const one = read('count_match_ef9195');
    const other = read('count_matches_43682a');
    const search = one === other && !Object.hasOwn(searchForms, locale)
      ? other : { one, other, ...searchForms[locale] };
    const ui = Object.fromEntries([...interfaceSources].map(source => {
      const text = bySource.get(source)?.translations[locale] ?? fail(`No preview translation for ${locale}: ${source}`);
      return [source, text];
    }));
    return [locale, { searchText, searchPanel, words, search, sourceOnly, visualOnly, ...copy, ui }];
  });
  const start = '// BEGIN GENERATED LOCALE PREVIEW';
  const end = '// END GENERATED LOCALE PREVIEW';
  const source = fs.readFileSync(rendererPath, 'utf8');
  const from = source.indexOf(start);
  const to = source.indexOf(end);
  if (from < 0 || to <= from) fail('Missing locale preview markers in the renderer');
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const rows = entries.map(([locale, copy]) => `  ${JSON.stringify(locale)}: ${JSON.stringify(copy)},`);
  const block = [start, 'const previewMessages = {', ...rows, '};', end].join(newline);
  const revised = source.slice(0, from) + block + source.slice(to + end.length);
  if (revised !== source) {
    if (checkOnly) fail('Application translations are stale. Run node tools/export-localization.cjs --sync-preview');
    fs.writeFileSync(rendererPath, revised, 'utf8');
  }
  if (!checkOnly) console.log(`Synced renderer preview for ${entries.length} locales.`);
}

function syncInstaller({ messages, locales }, checkOnly = false) {
  const languages = {
    en: ['English', 1033], ar: ['Arabic', 1025], 'zh-hans': ['SimpChinese', 2052],
    'zh-hant': ['TradChinese', 1028], cs: ['Czech', 1029], nl: ['Dutch', 1043],
    fr: ['French', 1036], de: ['German', 1031], hi: ['Hindi', 1081],
    id: ['Indonesian', 1057], it: ['Italian', 1040], ja: ['Japanese', 1041],
    ko: ['Korean', 1042], pl: ['Polish', 1045], 'pt-br': ['PortugueseBR', 1046],
    ru: ['Russian', 1049], es: ['SpanishInternational', 3082], sv: ['Swedish', 1053],
    th: ['Thai', 1054], tr: ['Turkish', 1055], uk: ['Ukrainian', 1058],
    vi: ['Vietnamese', 1066],
  };
  const installerMessages = {
    MVSetupCaption: 'markdown_vision_native_setup_c91176',
    MVRequiresArm64: 'this_installer_requires_windows_on_arm64_ef7f28',
    MVAppRunning: 'markdown_vision_is_running_save_any_unsaved_documents_b_52a23b',
    MVCloseFailed: 'setup_could_not_close_markdown_vision_close_it_manually_f94a3c',
    MVStillRunning: 'markdown_vision_is_still_running_close_it_and_select_re_7c911d',
    MVRemoving: 'removing_the_currently_installed_markdown_vision_editio_2fa13b',
    MVRemoveFailed: 'the_existing_markdown_vision_installation_could_not_be_5fb02b',
    MVRegisterViewer: 'markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9',
    MVDefaultApp: 'set_markdown_vision_as_the_default_application_for_mark_ce44e2',
    MVInstalled: 'markdown_vision_has_been_installed_40d44f',
    MVLaunch: 'open_markdown_vision_when_setup_closes_8422c7',
    MVInstallFailed: 'markdown_vision_native_could_not_be_installed_setup_wil_a877f0',
    MVUninstall: 'uninstall_fe1995',
    MVDocument: 'markdown_document_00271f',
    MVViewer: 'markdown_file_viewer_c36ee7',
    MVPreviewHandler: 'markdown_vision_preview_handler_8c95f7',
  };
  const codes = ['en', ...locales];
  if (codes.some(code => !languages[code])) fail('Missing installer language definition');
  const lines = ['; Generated from docs/LOCALIZATION.md by tools/export-localization.cjs.',
    ...codes.map(code => `LoadLanguageFile "\u0024{NSISDIR}\\Contrib\\Language files\\${languages[code][0]}.nlf"`), ''];
  for (const [name, key] of Object.entries(installerMessages)) {
    const message = messages[key];
    if (!message) fail(`Missing installer message ${key}`);
    for (const code of codes) {
      const text = code === 'en' ? message.source : message.translations[code];
      if (!text || /[\r\n\x00-\x1f]/.test(text)) fail(`Invalid installer text ${key}: ${code}`);
      if (name === 'MVUninstall' && (/[<>:"/\\|?*]/.test(text) || /[. ]$/.test(text))) {
        fail(`Invalid uninstall shortcut name for ${code}`);
      }
      const escaped = text.replace(/\$/g, '$$$$').replace(/"/g, '$\\"');
      lines.push(`LangString ${name} ${languages[code][1]} "${escaped}"`);
    }
    lines.push('');
  }
  const target = path.join(root, 'native-cpp', 'installer-localization.nsh');
  const output = '\ufeff' + lines.join('\r\n');
  if (checkOnly) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== output.replace(/\r\n/g, '\n')) {
      fail('Installer translations are stale. Run node tools/export-localization.cjs --sync-installer');
    }
  } else {
    fs.writeFileSync(target, output, 'utf8');
    console.log(`Generated installer strings for ${codes.length} languages.`);
  }
}

// These errors can occur before the webview and its saved preference are available.
function syncStartupErrors({ messages, locales }, checkOnly = false) {
  const primaryIds = {
    ar: 1, cs: 5, nl: 19, fr: 12, de: 7, hi: 57, id: 33, it: 16,
    ja: 17, ko: 18, pl: 21, 'pt-br': 22, ru: 25, es: 10, sv: 29,
    th: 30, tr: 31, uk: 34, vi: 42,
  };
  const keys = ['markdown_vision_could_not_prepare_its_application_files_372c11',
    'microsoft_edge_webview2_runtime_is_required_a565a2',
    'markdown_vision_could_not_read_this_file_275538'];
  const literal = text => 'L"' + Array.from(text, char => {
    const value = char.codePointAt(0);
    if (char === '"' || char === '\\') return '\\' + char;
    if (value >= 32 && value <= 126) return char;
    return value <= 0xffff ? `\\u${value.toString(16).padStart(4, '0')}`
      : `\\U${value.toString(16).padStart(8, '0')}`;
  }).join('') + '"';
  const codes = ['en', ...locales];
  if (codes.some(code => !['en', 'zh-hans', 'zh-hant'].includes(code) && !primaryIds[code])) {
    fail('Missing native startup language definition');
  }
  const lines = ['// Generated from docs/LOCALIZATION.md by tools/export-localization.cjs.',
    '#pragma once', '', 'struct StartupErrors { const wchar_t* assets; const wchar_t* webview; const wchar_t* read; bool rtl; };',
    'inline StartupErrors StartupErrorsForLanguage(unsigned int language) {',
    '    switch (language & 0x3ffu) {'];
  const row = code => {
    const values = keys.map(key => {
      const message = messages[key] ?? fail(`Missing startup message ${key}`);
      return literal(code === 'en' ? message.source : message.translations[code]);
    });
    return `{ ${values.join(', ')}, ${code === 'ar' ? 'true' : 'false'} }`;
  };
  lines.push('    case 4: // Traditional Chinese, Taiwan, Hong Kong and Macau.',
    `        if (language == 0x7c04u || language == 0x0404u || language == 0x0c04u || language == 0x1404u) return ${row('zh-hant')};`,
    `        return ${row('zh-hans')};`);
  for (const code of locales.filter(code => !code.startsWith('zh-'))) {
    lines.push(`    case ${primaryIds[code]}: return ${row(code)}; // ${code}`);
  }
  lines.push(`    default: return ${row('en')};`, '    }', '}', '');
  const target = path.join(root, 'native-cpp', 'StartupTranslations.h');
  const output = lines.join('\n');
  if (checkOnly) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== output) {
      fail('Native startup translations are stale. Run node tools/export-localization.cjs --sync-startup');
    }
  } else {
    fs.writeFileSync(target, output, 'utf8');
    console.log(`Generated native startup errors for ${codes.length} locales.`);
  }

  const managedKey = 'markdown_vision_could_not_start_error_7950eb';
  const managedMessage = messages[managedKey] ?? fail(`Missing startup message ${managedKey}`);
  const managed = [
    '// Generated from docs/LOCALIZATION.md by tools/export-localization.cjs.',
    'using System.Globalization;', '', 'namespace MarkdownVision.Native;', '',
    'internal static class StartupTranslations', '{',
    '    internal static (string Message, bool RightToLeft) Format(CultureInfo culture, string error)',
    '    {',
    '        var code = culture.Name.ToLowerInvariant();',
    '        var language = culture.TwoLetterISOLanguageName.ToLowerInvariant();',
    '        if (language == "zh")',
    '            language = code.Contains("-hant") || (!code.Contains("-hans") &&',
    '                (code.EndsWith("-tw") || code.EndsWith("-hk") || code.EndsWith("-mo"))) ? "zh-hant" : "zh-hans";',
    '        else if (language == "pt") language = "pt-br";',
    '        var template = language switch', '        {',
    ...locales.map(code => `            ${JSON.stringify(code)} => ${JSON.stringify(managedMessage.translations[code])},`),
    `            _ => ${JSON.stringify(managedMessage.source)},`,
    '        };',
    '        var rtl = language == "ar";',
    '        var detail = rtl ? "\\u2068" + error + "\\u2069" : error;',
    '        return (template.Replace("{error}", detail), rtl);',
    '    }', '}', '',
  ].join('\n');
  const managedTarget = path.join(root, 'native-windows', 'StartupTranslations.cs');
  if (checkOnly) {
    if (!fs.existsSync(managedTarget) || fs.readFileSync(managedTarget, 'utf8').replace(/\r\n/g, '\n') !== managed) {
      fail('Managed startup translations are stale. Run node tools/export-localization.cjs --sync-startup');
    }
  } else {
    fs.writeFileSync(managedTarget, managed, 'utf8');
    console.log(`Generated managed startup errors for ${codes.length} locales.`);
  }
}

function syncLinuxLauncher({ messages, locales }, checkOnly = false) {
  const message = messages.markdown_file_viewer_c36ee7 ?? fail('Missing Linux launcher description');
  // Desktop-entry locale suffixes use POSIX names rather than BCP 47 tags.
  const suffixes = {
    'zh-hans': ['zh', 'zh_CN', 'zh_SG'], 'zh-hant': ['zh_TW', 'zh_HK', 'zh_MO'],
    'pt-br': ['pt', 'pt_BR'],
  };
  const lines = ['# Generated from docs/LOCALIZATION.md by tools/export-localization.cjs.',
    '[Desktop Entry]', 'Categories={{categories}}', '{{#if comment}}', 'Comment={{comment}}', '{{/if}}',
    'Exec={{exec}}', 'StartupWMClass={{exec}}', 'Icon={{icon}}', 'Name={{name}}',
    `GenericName=${message.source}`];
  for (const locale of locales) {
    const value = message.translations[locale];
    if (!value || /[\r\n\x00-\x1f\\]/u.test(value)) fail(`${locale}: invalid Linux launcher text`);
    for (const suffix of suffixes[locale] ?? [locale]) lines.push(`GenericName[${suffix}]=${value}`);
  }
  lines.push('Terminal=false', 'Type=Application', '{{#if mime_type}}', 'MimeType={{mime_type}}', '{{/if}}', '');
  const output = lines.join('\n');
  const target = path.join(root, 'native-tauri', 'launcher.desktop');
  if (checkOnly) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== output) {
      fail('Linux launcher translations are stale. Run node tools/export-localization.cjs --sync-launcher');
    }
  } else {
    fs.writeFileSync(target, output, 'utf8');
    console.log(`Generated Linux launcher descriptions for ${locales.length} locales.`);
  }
}

function syncMacDocumentTypes({ messages, locales }, checkOnly = false) {
  const message = messages.markdown_document_00271f ?? fail('Missing macOS document type name');
  const directory = path.join(root, 'native-tauri', 'macos-localizations');
  const appleLocaleFor = locale => ({ 'zh-hans': 'zh-Hans', 'zh-hant': 'zh-Hant', 'pt-br': 'pt-BR' }[locale] ?? locale);
  const expectedDirectories = new Set(['en', ...locales].map(locale => `${appleLocaleFor(locale)}.lproj`));
  if (fs.existsSync(directory)) {
    for (const entry of fs.readdirSync(directory)) {
      if (entry.endsWith('.lproj') && !expectedDirectories.has(entry)) {
        fail(`Unexpected macOS localization directory: ${entry}`);
      }
    }
  }
  for (const locale of ['en', ...locales]) {
    const name = locale === 'en' ? message.source : message.translations[locale];
    if (!name || /[\r\n\x00-\x1f]/u.test(name)) fail(`${locale}: invalid macOS document type name`);
    const appleLocale = appleLocaleFor(locale);
    const file = path.join(directory, `${appleLocale}.lproj`, 'InfoPlist.strings');
    const output = `/* Generated from docs/LOCALIZATION.md. */\n${JSON.stringify(message.source)} = ${JSON.stringify(name)};\n"CFBundleTypeName" = ${JSON.stringify(name)};\n`;
    if (checkOnly) {
      if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== output) {
        fail(`macOS document type translations are stale. Run node tools/export-localization.cjs --sync-macos (${locale})`);
      }
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, output, 'utf8');
    }
  }
  if (!checkOnly) console.log(`Generated macOS document type names for ${locales.length + 1} locales.`);
}

const referenceOnly = new Map([
  ['could_not_open_document_69abda', 'Developer console diagnostic'],
  ['title_shortcut_9aa219', 'Proposed reusable tooltip pattern'],
  ['normal_text_a2adc4', 'Proposed standalone paragraph style label'],
  ['footnotes_ad6fb5', 'Proposed standalone footnotes label'],
]);

const commandReferences = new Map([
  ['Edit item', 'edit_item_9f84ee'],
  ['Edit note', 'edit_note_299e60'],
  ['Remove item', 'remove_item_5a89ed'],
  ['Save As', 'save_as_a4b76a'],
]);

const intactCommandLabels = new Set(['save_as_a4b76a', 'edit_item_9f84ee', 'edit_note_299e60', 'remove_item_5a89ed']);

const countGroups = [
  ['count_match_ef9195', 'count_matches_43682a'],
  ['count_word_1f505c', 'count_words_caab29'],
  ['count_fixed_width_font_available_5488f8', 'count_fixed_width_fonts_available_5df530'],
  ['count_variable_width_font_available_583582', 'count_variable_width_fonts_available_9d234c'],
  ['count_match_for_query_2e77ac', 'count_matches_for_query_7db710'],
];

// These values are inserted as Markdown source by editor commands.
const documentTextKeys = new Set([
  'new_item_b84cad', 'header_number_b79482', 'cell_75fa38', 'link_text_insert_default', 'new_column_editor',
]);
const nativeDialogLabelKeys = new Set([
  'open_markdown_file_b7764a', 'save_markdown_file_813f90', 'markdown_files_177420',
  'text_files_c5df15', 'all_files_866956', 'markdown_vision_could_not_read_this_file_275538',
]);
const untranslatedEnglishPhraseExceptions = new Set([
  '2026_mark_lloyd_12c607', 'markdown_vision_native_9b1051', 'markdown_vision_version_native_414223',
]);
// Exact English single-word labels can otherwise slip past the phrase check below.
// Keep only reviewed terms whose spelling is intentionally identical in these locales.
const untranslatedEnglishWordExceptions = new Map([
  ['markdown_0e52f6', new Set(['ar', 'zh-hans', 'zh-hant', 'cs', 'nl', 'fr', 'de', 'hi', 'id', 'it', 'ja', 'ko', 'pl', 'pt-br', 'ru', 'es', 'sv', 'th', 'tr', 'uk', 'vi'])],
  ['url_e7a241', new Set(['cs', 'nl', 'fr', 'de', 'id', 'it', 'ja', 'ko', 'pt-br', 'es', 'sv', 'th', 'uk', 'vi'])],
  ['action_64cff1', new Set(['fr'])],
  ['version_dd1679', new Set(['fr', 'de', 'sv'])],
  ['link_a6a32d', new Set(['de', 'pl', 'pt-br'])],
  ['text_71988c', new Set(['cs', 'de', 'sv'])],
  ['help_b79cac', new Set(['nl'])],
  ['file_50009c', new Set(['it'])],
  ['cell_75fa38', new Set(['sv'])],
  ['visual_ba3033', new Set(['id', 'pt-br', 'es'])],
]);
const capitalizedLocaleLabels = new Map([
  ['id', new Set(['alt_text_16f898'])],
  ['uk', new Set(['task_4bc74b', 'new_18fdd5', 'text_71988c'])],
]);
const labelsWithoutTerminalPunctuation = new Map([
  ['ko', new Set(['clipboard_unavailable_4ff69f', 'code_copied_39868c', 'could_not_copy_code_4a563f',
    'installer_verification_is_unavailable_98306d', 'add_text_to_this_empty_cell_37f900',
    'edit_this_cell_in_markdown_4304b1', 'edit_this_item_in_markdown_83b112',
    'could_not_enumerate_system_fonts_00e652', 'no_system_fonts_found_a8a9af', 'could_not_open_document_640c27'])],
  ['ru', new Set(['code_copied_39868c', 'latest_version_version_d1c996',
    'latest_compatible_version_version_fa3079', 'update_failed_error_e4f7dc',
    'double_click_or_press_alt_enter_to_edit_this_item_5c41ce', 'edit_this_cell_in_markdown_4304b1',
    'licensed_under_gpl_3_0_only_5f7e0f', 'unknown_native_method_method_cc7ca9'])],
]);
const localeScripts = {
  ar: /\p{Script=Arabic}/u,
  'zh-hans': /\p{Script=Han}/u,
  'zh-hant': /\p{Script=Han}/u,
  hi: /\p{Script=Devanagari}/u,
  ja: /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u,
  ko: /\p{Script=Hangul}/u,
  ru: /\p{Script=Cyrillic}/u,
  th: /\p{Script=Thai}/u,
  uk: /\p{Script=Cyrillic}/u,
};
// Han script alone cannot distinguish Traditional Chinese from Simplified Chinese.
const simplifiedOnlyTraditionalChinese = /[这为来时无对现开关听说书车实电话国画术体档应软变号头边宽与汉机门马鸟鱼龙见问简场动样顶买贵卖价东园学阶层编辑码选项设连续断读备结进级记数线标过还爱办写将让并报认试声网压语词译总儿兴从权转类调静盘区条]/u;
const localeScriptExceptions = new Set([
  '2026_mark_lloyd_12c607', 'markdown_0e52f6', 'percent_markdown_0a45d1',
  'markdown_vision_native_9b1051', 'markdown_vision_version_native_414223', 'title_shortcut_9aa219',
  'url_e7a241', 'size_px_8d05e6',
]);

function fail(message) {
  throw new Error(message);
}

function hasEncodingDamage(text) {
  return /\?{2,}|\p{L}\?\p{L}|\u00c3[\u0080-\u00bf]|\u00c2[\u0080-\u00bf]|\u00e2\u20ac|\u00f0\u0178/u.test(text);
}

function readWordForms(locales) {
  const catalog = fs.readFileSync(catalogPath, 'utf8');
  const section = /^## Word-count forms\s*\r?\n([\s\S]*?)(?=^## )/m.exec(catalog)?.[1];
  if (!section) fail('Missing word-count forms');
  const required = {
    cs: ['one', 'few', 'other'], nl: ['one', 'other'], fr: ['one', 'other'],
    de: ['one', 'other'], it: ['one', 'other'], pl: ['one', 'few', 'many', 'other'],
    'pt-br': ['one', 'other'], ru: ['one', 'few', 'many', 'other'],
    es: ['one', 'other'], uk: ['one', 'few', 'many', 'other'],
  };
  const forms = {};
  for (const match of section.matchAll(/^\| ([\w-]+) \| (.+) \|\s*$/gm)) {
    const [, locale, encoded] = match;
    if (locale === 'Locale' || locale === '---') continue;
    if (Object.hasOwn(forms, locale)) fail(`${locale}: duplicate word-count forms`);
    let value;
    try { value = JSON.parse(encoded); } catch { fail(`${locale}: invalid word-count forms JSON`); }
    const choices = typeof value === 'string' ? [value] : value && typeof value === 'object' && !Array.isArray(value)
      && typeof value.other === 'string' && Object.keys(value).every(key => ['zero', 'one', 'two', 'few', 'many', 'other'].includes(key))
      ? Object.values(value) : [];
    if (!choices.length || choices.some(text => typeof text !== 'string' || !text.trim()
        || (text.match(/\{count\}/g) || []).length !== 1 || /[\x00-\x1f\x7f\u200B\uFEFF\uFFFD]/u.test(text)
        || /\{(?!count\})[^}]*\}/u.test(text) || hasEncodingDamage(text))) fail(`${locale}: invalid word-count form`);
    if (Object.hasOwn(required, locale) && (typeof value !== 'object'
        || required[locale].some(category => !Object.hasOwn(value, category)))) {
      fail(`${locale}: missing required word-count category`);
    }
    forms[locale] = value;
  }
  if (JSON.stringify(Object.keys(forms).sort()) !== JSON.stringify([...locales].sort())) fail('Word-count locales and catalog differ');
  return forms;
}

function readSearchForms() {
  const catalog = fs.readFileSync(catalogPath, 'utf8');
  const section = /^## Additional search-result plural forms\s*\r?\n([\s\S]*?)(?=^## )/m.exec(catalog)?.[1];
  if (!section) fail('Missing additional search-result plural forms');
  const expected = { cs: ['few', 'other'], pl: ['few', 'many', 'other'], ru: ['few'], uk: ['few'] };
  const forms = {};
  for (const match of section.matchAll(/^\| ([\w-]+) \| (.+) \|\s*$/gm)) {
    const [, locale, encoded] = match;
    if (locale === 'Locale' || locale === '---') continue;
    if (!Object.hasOwn(expected, locale) || Object.hasOwn(forms, locale)) fail(`${locale}: unexpected or duplicate search-result forms`);
    let value;
    try { value = JSON.parse(encoded); } catch { fail(`${locale}: invalid search-result forms JSON`); }
    if (!value || typeof value !== 'object' || Array.isArray(value)
        || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected[locale]].sort())
        || Object.values(value).some(text => typeof text !== 'string' || !text.trim()
          || (text.match(/\{count\}/g) || []).length !== 1 || /[\x00-\x1f\x7f\u200B\uFEFF\uFFFD]/u.test(text)
          || /\{(?!count\})[^}]*\}/u.test(text) || hasEncodingDamage(text))) fail(`${locale}: invalid search-result form`);
    forms[locale] = value;
  }
  if (JSON.stringify(Object.keys(forms).sort()) !== JSON.stringify(Object.keys(expected).sort())) fail('Missing search-result plural forms');
  return forms;
}

function readLanguageSelector(locales) {
  const catalog = fs.readFileSync(catalogPath, 'utf8');
  const section = /^## Language selector\s*\r?\n([\s\S]*?)(?=^## )/m.exec(catalog)?.[1];
  if (!section) fail('Missing language selector translations');
  const labels = {};
  for (const match of section.matchAll(/^\| ([\w-]+) \| (.+) \|\s*$/gm)) {
    const [, locale, encoded] = match;
    if (locale === 'Locale' || locale === '---') continue;
    if (Object.hasOwn(labels, locale)) fail(`${locale}: duplicate language selector`);
    let values;
    try { values = JSON.parse(encoded); } catch { fail(`${locale}: invalid language selector JSON`); }
    if (!Array.isArray(values) || values.length !== 4 || values.some(value => typeof value !== 'string'
        || !value.trim() || /[\x00-\x1f\x7f\u200B\uFEFF\uFFFD]/u.test(value) || hasEncodingDamage(value))) fail(`${locale}: invalid language selector labels`);
    labels[locale] = values;
  }
  if (JSON.stringify(Object.keys(labels).sort()) !== JSON.stringify(['en', ...locales].sort())) fail('Language selector and catalog differ');
  for (const locale of locales) {
    if (new Set(labels[locale]).size !== labels[locale].length) fail(`${locale}: duplicate language-selector labels`);
    for (const [index, label] of labels[locale].entries()) {
      if (label === labels.en[index]) fail(`${locale}: untranslated English language-selector label at position ${index + 1}`);
    }
  }
  return labels;
}

function checkReleaseChecklistLocales(locales) {
  const checklist = fs.readFileSync(path.join(root, 'docs/LOCALIZATION-RELEASE-CHECKLIST.md'), 'utf8');
  const section = /^## Locale status\s*\r?\n([\s\S]*?)(?=^## )/m.exec(checklist)?.[1];
  if (!section) fail('Missing locale status table in localization release checklist');
  const rows = [];
  const pending = [];
  for (const line of section.split(/\r?\n/)) {
    if (!/^\| /.test(line)) continue;
    const cells = line.slice(2, -2).split(/ \| /);
    if (cells[0] === 'Locale') continue;
    if (cells.every(value => /^:?-{3,}:?$/.test(value))) continue;
    const locale = /^.*\(`([\w-]+)`\)$/.exec(cells[0])?.[1];
    if (!locale || cells.length !== 5) fail(`Invalid localization release checklist row: ${line}`);
    rows.push(locale);
    const gates = cells.slice(1, 4).map(value => /^(Pending|Pass|Blocked)\b/.exec(value)?.[1]);
    if (gates.some(value => !value)) fail(`${locale}: invalid localization review gate status`);
    for (let index = 0; index < gates.length; index += 1) {
      if (gates[index] === 'Pending') continue;
      const evidence = /^(Pass|Blocked) \(reviewer: ([^;]+); date: (\d{4}-\d{2}-\d{2}); build: ([^;]+); evidence: (\[[^\]]+\]\((?:https:\/\/[^\s)]+|\/?(?:\.\.?\/)?[\w.-]+\/[^)]+)\))\)$/.exec(cells[index + 1]);
      if (!evidence || !evidence[2].trim() || !evidence[4].trim()
          || Number.isNaN(Date.parse(`${evidence[3]}T00:00:00Z`))
          || new Date(`${evidence[3]}T00:00:00Z`).toISOString().slice(0, 10) !== evidence[3]) {
        fail(`${locale}: ${['native-language', 'rendered-interface', 'packaged-platform'][index]} review must record reviewer, valid date, build, and linked evidence`);
      }
      const linkTarget = /^\[[^\]]+\]\(([^)]+)\)$/.exec(evidence[5])?.[1];
      if (linkTarget && !linkTarget.startsWith('https://')) {
        let evidencePath;
        try {
          evidencePath = path.resolve(root, decodeURIComponent(linkTarget.replace(/^\//, '')));
        } catch {
          fail(`${locale}: review evidence link is invalid`);
        }
        const relativeEvidencePath = path.relative(root, evidencePath);
        if (!relativeEvidencePath || relativeEvidencePath === '..' || relativeEvidencePath.startsWith(`..${path.sep}`)
            || path.isAbsolute(relativeEvidencePath) || !fs.existsSync(evidencePath)
            || !fs.statSync(evidencePath).isFile()) {
          fail(`${locale}: review evidence must link to an existing file in the repository or an HTTPS URL`);
        }
      }
    }
    const ready = /^Ready\b/.test(cells[4]);
    const draft = /^Draft\b/.test(cells[4]);
    if (!ready && !draft) fail(`${locale}: invalid localization release status`);
    if (ready !== gates.every(value => value === 'Pass')) fail(`${locale}: release status does not match review gate statuses`);
    if (!ready) pending.push(locale);
  }
  if (new Set(rows).size !== rows.length || JSON.stringify(rows.slice().sort()) !== JSON.stringify(locales.slice().sort())) {
    fail('Localization release checklist locale rows differ from catalog');
  }
  return pending;
}

function readRows(lines, columnCount, section) {
  const rows = new Map();
  for (const line of lines) {
    if (!/^\| `/.test(line)) continue;
    const fields = line.slice(2, -2).split(/(?<!\\) \| /);
    const key = /^`([a-z0-9_]+)`$/.exec(fields[0])?.[1];
    if (!line.endsWith(' |') || fields.length !== columnCount || !key || fields.some(field => !field.trim())) {
      fail(`${section}: invalid table row ${line}`);
    }
    if (rows.has(key)) fail(`${section}: duplicate key ${key}`);
    rows.set(key, fields.slice(1));
  }
  if (rows.size === 0) fail(`${section}: table has no rows`);
  return rows;
}

function tokens(text) {
  return (text.match(/\{\w+\}|(?:Ctrl|Alt)\+(?:Shift\+)?(?:Enter|[A-Z])\b|[↔↕]/g) || []).sort();
}

function readCatalog(markdown) {
  const sections = markdown.split(/^## Locale ([\w-]+)\s*$/m);
  const english = readRows(sections[0].split(/\r?\n/), 4, 'English');
  const localeLinks = [...sections[0].matchAll(/^\s*- \[[^\]]+\]\(#locale-([\w-]+)\)/gm)].map(match => match[1]);
  const locales = sections.filter((_, index) => index % 2 === 1);
  if (!locales.length || JSON.stringify(localeLinks) !== JSON.stringify(locales) || new Set(locales).size !== locales.length) {
    fail('Locale headings must be unique and match the table of contents in order');
  }
  const wordForms = readWordForms(locales);
  const searchForms = readSearchForms();
  const languageSelector = readLanguageSelector(locales);
  const releasePendingLocales = checkReleaseChecklistLocales(locales);
  const translations = new Map();
  for (const [index, locale] of locales.entries()) {
    const rows = readRows(sections[index * 2 + 2].split(/\r?\n/), 2, locale);
    for (const key of rows.keys()) if (!english.has(key)) fail(`${locale}: extra key ${key}`);
    for (const [key, [source]] of english) {
      const text = rows.get(key)?.[0];
      if (!text) fail(`${locale}: missing key ${key}`);
      if (nativeDialogLabelKeys.has(key) && (text.length > 256 || /[|\x00-\x1f\x7f-\x9f]/u.test(text))) {
        fail(`${locale}: ${key} is invalid for the native dialog bridge`);
      }
      if (key === 'number_of_columns_2_8_893663' && !/2[^0-9]*8/u.test(text)) {
        fail(`${locale}: ${key} must describe the supported column range 2–8`);
      }
      if (key === '2026_mark_lloyd_12c607' && text !== source) {
        fail(`${locale}: preserve the copyright attribution in ${key}`);
      }
      if (installerTerminologyKeys.has(key) && /\b(?:setup|uninstall)\b/i.test(text)) {
        fail(`${locale}: translate installer terminology in ${key}`);
      }
      if (capitalizedLocaleLabels.get(locale)?.has(key) &&
          text[0] !== text[0].toLocaleUpperCase(locale)) {
        fail(`${locale}: ${key} must start with an uppercase letter`);
      }
      if (labelsWithoutTerminalPunctuation.get(locale)?.has(key) && /[.!?…。！？؟]$/u.test(text)) {
        fail(`${locale}: ${key} must not add terminal punctuation to this UI label`);
      }
      if (!untranslatedEnglishPhraseExceptions.has(key)
          && text === source && /[a-z]{3,}\s+[a-z]{3,}/i.test(source)) {
        fail(`${locale}: untranslated English phrase in ${key}`);
      }
      if (text === source && /^[A-Za-z]+$/u.test(source)
          && !untranslatedEnglishWordExceptions.get(key)?.has(locale)) {
        fail(`${locale}: untranslated English word in ${key}`);
      }
        const sourceWords = source
          .replace(/\{[^}]+\}/g, ' ')
          .replace(/\b(?:Ctrl|Alt)\+(?:Shift\+)?(?:Enter|[A-Z])\b/g, ' ')
          .match(/[A-Za-z]{3,}/g) || [];
        for (let length = 2; length <= Math.min(5, sourceWords.length); length += 1) {
          for (let start = 0; start + length <= sourceWords.length; start += 1) {
            const phraseWords = sourceWords.slice(start, start + length);
            if (phraseWords.some(word => untranslatedPhraseStopWords.has(word.toLowerCase())
                || preservedEnglishTerms.has(word.toLowerCase()))) continue;
            const phrase = phraseWords.join(' ');
            if (untranslatedPhraseExceptions.get(key)?.get(locale)?.has(phrase.toLowerCase())) continue;
            if (text.toLocaleLowerCase('en').includes(phrase.toLowerCase())) {
              fail(`${locale}: untranslated English phrase in ${key} (${phrase})`);
            }
          }
        }
      if (localeScripts[locale] && !localeScriptExceptions.has(key) && !localeScripts[locale].test(text)) {
        fail(`${locale}: translation in ${key} is missing the expected script`);
      }
      if (locale === 'zh-hant' && simplifiedOnlyTraditionalChinese.test(text)) {
        fail(`${locale}: translation in ${key} contains a Simplified Chinese character`);
      }
      if (/[\u200B\uFEFF\uFFFD]/u.test(text)) fail(`${locale}: stray or invalid character in ${key}`);
      if (/(?:\u00c3[\u0080-\u00bf]|\u00c2[\u0080-\u00bf]|\u00e2\u20ac|\u00f0\u0178)/u.test(text)) {
        fail(`${locale}: possible mojibake in ${key}`);
      }
      if (/\?{2,}|\p{L}\?\p{L}/u.test(text)) fail(`${locale}: possible character encoding corruption in ${key}`);
      if (['new_column_editor', 'update_text_editor', 'keep_unchanged_editor'].includes(key) && text.includes('?')) {
        fail(`${locale}: possible character encoding corruption in ${key}`);
      }
      if (['new_column_editor', 'update_text_editor', 'keep_unchanged_editor'].includes(key)) {
        const scripts = { ar: /\p{Script=Arabic}/u, 'zh-hans': /\p{Script=Han}/u, 'zh-hant': /\p{Script=Han}/u,
          hi: /\p{Script=Devanagari}/u, ja: /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u,
          ko: /\p{Script=Hangul}/u, ru: /\p{Script=Cyrillic}/u, th: /\p{Script=Thai}/u, uk: /\p{Script=Cyrillic}/u };
        if (scripts[locale] && !scripts[locale].test(text)) fail(`${locale}: ${key} is missing its expected script`);
      }
      if (locale === 'tr' && /(?:Markdown['’](?:de|yi|nin)|Vision['’](?:yi|den|nin)|Linux['’]de)/u.test(text)) {
        fail(`${locale}: check the suffix after the product name in ${key}`);
      }
      if (locale === 'ko' && /(?:Vision[를가는]|Markdown[를가]|UTF-8가)/u.test(text)) {
        fail(`${locale}: check the particle after the product name in ${key}`);
      }
      if (locale === 'ko' && text.includes('테이블')) {
        fail(`${locale}: use 표 consistently for table terminology in ${key}`);
      }
      if (documentTextKeys.has(key) && (/[\r\n\\`[\]<>|*_~&]/u.test(text)
          || /^\s*(?:[#>+-]|\d+[.)]\s)/u.test(text))) {
        fail(`${locale}: ${key} contains Markdown syntax in inserted text`);
      }
      if (key === 'untitled_md_2dccf8' && (!text.endsWith('.md') || text.length > 200
          || /[<>:"/\\|?*\x00-\x1f\x7f-\x9f]/u.test(text) || text.startsWith('.') || text.trim() !== text
          || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])\./iu.test(text))) {
        fail(`${locale}: invalid suggested Markdown filename`);
      }
      if (tokens(text).join(' ') !== tokens(source).join(' ')) {
        fail(`${locale}: placeholder, shortcut, or arrow differs from English in ${key}`);
      }
      for (const brand of ['Markdown Vision Native', 'Markdown Vision']) {
        if (source.includes(brand) && !text.includes(brand)) {
          fail(`${locale}: ${key} must preserve the product name ${brand}`);
        }
      }
      for (const term of ['DEB', 'RPM', 'UTF-8']) {
        if (source.includes(term) && !text.includes(term)) {
          fail(`${locale}: ${key} must preserve ${term}`);
        }
      }
    }
    translations.set(locale, rows);
  }
  for (const [locale, rows] of translations) {
    const discard = rows.get('discard_eb1a70')[0].trim().toLocaleLowerCase(locale);
    const alternatives = ['cancel_19766e', 'keep_editing_624a83']
      .map(key => rows.get(key)[0].trim().toLocaleLowerCase(locale));
    if (alternatives.includes(discard)) fail(`${locale}: discard must be distinct from cancel and keep editing`);
    const newDocumentChoices = ['save_1509f5', 'discard_changes_f9bfa3', 'cancel_19766e']
      .map(key => rows.get(key)[0].trim().toLocaleLowerCase(locale));
    if (new Set(newDocumentChoices).size !== newDocumentChoices.length) {
      fail(`${locale}: save, discard changes and cancel must have distinct labels`);
    }
    const dismiss = rows.get('dismiss_48845b')[0].trim().toLocaleLowerCase(locale);
    if (newDocumentChoices.slice(1).includes(dismiss)) {
      fail(`${locale}: dismiss must be distinct from discard changes and cancel`);
    }
    for (const [first, second] of [
      ['cancel_19766e', 'apply_31e392'], ['undo_a8283a', 'redo_742739'],
      ['previous_match_daa2f8', 'next_match_825e5a'],
      ['indent_under_previous_item_2e6b03', 'outdent_item_07e9b1'],
    ]) {
      const labels = [first, second].map(key => rows.get(key)[0].trim().normalize('NFKC').toLocaleLowerCase(locale));
      if (labels[0] === labels[1]) fail(`${locale}: opposing actions ${first} and ${second} must have distinct labels`);
    }
  }
  for (const [label, key] of commandReferences) {
    if (!english.has(key)) fail(`Missing referenced label ${label} (${key})`);
  }
  // These choices appear together in confirmations that can discard work.
  // A translated destructive action must remain distinct from the safe exits.
  for (const locale of locales) {
    const rows = translations.get(locale);
    const normalized = key => rows.get(key)?.[0].normalize('NFKC').trim().toLocaleLowerCase(locale);
    const tableActions = ['update_text_editor', 'add_row_below_3d4830', 'add_column_after_38817e',
      'remove_row_1810fd', 'remove_column_9807a2', 'align_column_left_6d9399',
      'center_column_1b9b8b', 'align_column_right_850a8f'].map(normalized);
    if (tableActions.some(value => !value) || new Set(tableActions).size !== tableActions.length) {
      fail(`${locale}: table action labels must be distinct`);
    }
    const safe = ['cancel_19766e', 'keep_editing_624a83'].map(normalized);
    for (const key of ['discard_eb1a70', 'discard_changes_f9bfa3']) {
      if (!normalized(key) || safe.includes(normalized(key))) {
        fail(`${locale}: ${key} must differ from the safe confirmation choices`);
      }
    }
    for (const [labelKey, tooltipKey] of [
      ['bold_94fee6', 'bold_ctrl_b_84787d'], ['italic_9bf37c', 'italic_ctrl_i_ccc60d'],
      ['new_markdown_file_0928e9', 'new_markdown_file_ctrl_n_f22ed5'],
      ['save_1509f5', 'save_ctrl_s_4be89e'], ['save_as_a4b76a', 'save_as_ctrl_shift_s_0f132a'],
    ]) {
      const label = rows.get(labelKey)?.[0].replace(/…$/, '').toLocaleLowerCase(locale);
      const tooltip = rows.get(tooltipKey)?.[0].toLocaleLowerCase(locale);
      if (!label || !tooltip?.includes(label)) fail(`${locale}: ${tooltipKey} must contain its translated command label`);
    }
  }
  for (const key of referenceOnly.keys()) {
    if (!english.has(key)) fail(`Missing reference-only row ${key}`);
  }
  for (const group of countGroups) {
    for (const key of group) {
      if (!english.get(key)?.[0].includes('{count}')) fail(`Invalid count reference ${key}`);
    }
  }

  const messages = {};
  const references = {};
  for (const [key, [source, locations, context]] of english) {
    const relatedKeys = [...commandReferences]
      .filter(([label, target]) => key !== target && (source.includes(`Use ${label}`)
        || source.includes(`use ${label}`) || source.includes(`choose ${label}`)
        || source.includes(`the ${label} dialog`)))
      .map(([, target]) => target);
    const entry = {
      source,
      locations,
      context,
      relatedKeys,
      translations: Object.fromEntries(locales.map(locale => [locale, translations.get(locale).get(key)[0]])),
    };
    for (const relatedKey of relatedKeys.filter(key => intactCommandLabels.has(key))) {
      for (const [locale, text] of Object.entries(entry.translations)) {
        const label = translations.get(locale).get(relatedKey)[0].replace(/…$/, '');
        if (!text.toLocaleLowerCase(locale).includes(label.toLocaleLowerCase(locale))) {
          fail(`${locale}: ${key} must reference the localized command label (${label})`);
        }
      }
    }
    if (referenceOnly.has(key)) references[key] = { ...entry, reason: referenceOnly.get(key) };
    else messages[key] = entry;
  }
  const baseline = /^Source baseline: Markdown Vision ([\d.]+)\./m.exec(sections[0])?.[1];
  if (!baseline) fail('Missing source version in the catalog');
  return { baseline, sourceLocale: 'en', status: 'draft', locales, releasePendingLocales, countGroups, wordForms, searchForms, languageSelector, messages, references };
}

try {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && !['--check', '--check-generated', '--check-release-ready', '--sync-preview', '--sync-installer', '--sync-startup', '--sync-launcher', '--sync-macos'].includes(args[0]))) {
    fail('Usage: node tools/export-localization.cjs [--check | --check-generated | --check-release-ready | --sync-preview | --sync-installer | --sync-startup | --sync-launcher | --sync-macos]');
  }
  const result = readCatalog(fs.readFileSync(catalogPath, 'utf8'));
  if (args[0] === '--check') {
    console.log(`Validated ${Object.keys(result.messages).length} draft messages and ${Object.keys(result.references).length} reference rows across ${result.locales.length} locales.`);
  } else if (args[0] === '--check-generated') {
    syncPreview(result, true);
    syncInstaller(result, true);
    syncStartupErrors(result, true);
    syncLinuxLauncher(result, true);
    syncMacDocumentTypes(result, true);
    console.log('Application, installer, startup, Linux launcher, and macOS translations match the catalog.');
  } else if (args[0] === '--check-release-ready') {
    if (result.releasePendingLocales.length) {
      fail(`Localization release gates are incomplete for: ${result.releasePendingLocales.join(', ')}`);
    }
    console.log(`All ${result.locales.length} locales have passing release reviews.`);
  } else if (args[0] === '--sync-preview') {
    syncPreview(result);
  } else if (args[0] === '--sync-installer') {
    syncInstaller(result);
  } else if (args[0] === '--sync-startup') {
    syncStartupErrors(result);
  } else if (args[0] === '--sync-launcher') {
    syncLinuxLauncher(result);
  } else if (args[0] === '--sync-macos') {
    syncMacDocumentTypes(result);
  } else {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
