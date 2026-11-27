const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

const localeScreenshotDirectory = process.env.MARKDOWN_VISION_LOCALE_SCREENSHOTS;
if (localeScreenshotDirectory) fs.mkdirSync(localeScreenshotDirectory, { recursive: true });
function writeLocaleScreenshotGallery() {
  if (!localeScreenshotDirectory) return;
  const kinds = [
    ['Settings', 'settings'], ['Search', 'search'], ['Editor', 'editor'], ['About and updates', 'about'],
    ['Save before creating a file', 'new-file'], ['Visual link dialog', 'visual-edit-dialog'],
    ['Reader script sample', 'glyph-reader'], ['Editor script and code sample', 'glyph-editor'],
  ];
  const locales = fs.readdirSync(localeScreenshotDirectory)
    .filter(name => /^[a-z-]+-settings\.png$/.test(name))
    .map(name => name.replace(/-settings\.png$/, '')).sort();
  if (locales.length !== 21) throw new Error(`Expected 21 locale screenshot sets, found ${locales.length}`);
  for (const locale of locales) for (const [, suffix] of kinds) {
    if (!fs.existsSync(path.join(localeScreenshotDirectory, `${locale}-${suffix}.png`))) {
      throw new Error(`Missing locale screenshot: ${locale}-${suffix}.png`);
    }
  }
  const sections = locales.map(locale => `<section><h2>${locale}</h2><div class="screens">${kinds.map(([label, suffix]) =>
    `<figure><figcaption>${label}</figcaption><a href="${locale}-${suffix}.png"><img loading="lazy" src="${locale}-${suffix}.png" alt="${locale}: ${label}"></a></figure>`).join('')}</div></section>`);
  const html = [
    '<!doctype html>', '<html lang="en">', '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Markdown Vision locale review</title>',
    '<style>body{font:16px system-ui,sans-serif;margin:2rem;background:#202124;color:#eee}h1{margin-bottom:.4rem}p{max-width:70ch;color:#bbb}section{border-top:1px solid #555;padding:1rem 0}h2{font-size:1.2rem}.screens{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem}figure{margin:0;padding:.6rem;background:#303134;border-radius:.5rem}figcaption{margin:0 0 .5rem;color:#ddd}img{display:block;width:100%;height:auto}a:focus-visible{outline:3px solid #e78664}</style>',
    '<h1>Markdown Vision locale review</h1>',
    '<p>Rendered preview captures for draft locales. These images support review and do not replace native-language, accessibility, or packaged-platform checks.</p>',
    ...sections, '</html>',
  ].join('\n');
  fs.writeFileSync(path.join(localeScreenshotDirectory, 'index.html'), html, 'utf8');
}

const sourceRoot = path.resolve(__dirname, '..');
const sourceHtml = fs.readFileSync(path.join(sourceRoot, 'src/web/index.html'), 'utf8');
const installedVersion = /id="installedVersion" data-version="([^"]+)"/.exec(sourceHtml)?.[1];
assert.ok(installedVersion, 'Could not read the installed version from the shared app page.');
const newerVersion = installedVersion.replace(/(\d+)$/, (_, patch) => String(Number(patch) + 1));
const copyFiles = [
  'index.html', 'styles.css', 'app.js', 'editor-ui.js',
  'vendor/markdown-it.js', 'vendor/markdown-it-footnote.js',
  'fonts/libertinus/LibertinusSerif-Regular.woff2', 'fonts/libertinus/LibertinusSerif-Italic.woff2',
  'fonts/libertinus/LibertinusSerif-Semibold.woff2', 'fonts/libertinus/LibertinusSerif-SemiboldItalic.woff2',
  'fonts/libertinus/LibertinusSerif-Bold.woff2', 'fonts/libertinus/LibertinusSerif-BoldItalic.woff2',
  'fonts/libertinus/LibertinusMono-Regular.woff2',
];
const wait = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));

async function evaluate(window, source) {
  return window.webContents.executeJavaScript(source);
}

async function waitFor(window, expression, label, timeoutMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await evaluate(window, expression)) return;
    await wait(25);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function checkLocalizedInterface(window, indexFile) {
  const repairedLabels = {
    ar: ['عمود جديد', 'تحديث النص', 'إبقاء دون تغيير'],
    'zh-hans': ['新列', '更新文本', '保持不变'],
    ko: ['새 열', '텍스트 업데이트', '변경하지 않음'],
    ru: ['Новый столбец', 'Обновить текст', 'Оставить без изменений'],
  };
  await window.loadFile(indexFile, { query: { previewLocale: 'en' } });
  const englishCasing = await evaluate(window, `({
    dotted: window.markdownVisionReader.caseInsensitivePositions('I ı İ i', 'i'),
    dotless: window.markdownVisionReader.caseInsensitivePositions('I ı İ i', 'ı')
  })`);
  assert.deepEqual(englishCasing, {
    dotted: [{ start: 0, end: 1 }, { start: 4, end: 5 }, { start: 6, end: 7 }],
    dotless: [{ start: 2, end: 3 }],
  }, 'English search uses English casing for dotted and dotless I');
  const englishFontLabels = await evaluate(window, `['fontInput', 'monoFontInput'].map(id => {
    const input = document.getElementById(id);
    const label = document.querySelector('label[for="' + id + '"]');
    return { text: label?.textContent, accessible: input.getAttribute('aria-label'), associated: label?.control === input };
  })`);
  assert.deepEqual(englishFontLabels, [
    { text: 'Variable-width font', accessible: 'Variable-width font', associated: true },
    { text: 'Fixed-width font', accessible: 'Fixed-width font', associated: true },
  ], 'English font controls have visible, associated labels');
  await evaluate(window, "localStorage.setItem('markdown-vision-preferences', JSON.stringify({ language: 'en' }))");
  await window.loadFile(indexFile, { query: { testSystemLanguage: 'pl-PL' } });
  assert.equal(await evaluate(window, 'document.documentElement.lang'), 'pl');
  assert.equal(await evaluate(window, 'document.querySelector("#languageSelect")'), null);
  await window.loadFile(indexFile, { query: { testSystemLanguage: 'pl-PL', testLanguageOverride: 'fr-CA' } });
  assert.equal(await evaluate(window, 'document.documentElement.lang'), 'fr');
  await window.loadFile(indexFile, { query: { testSystemLanguage: 'pl-PL', testLanguageOverride: 'unsupported' } });
  assert.equal(await evaluate(window, 'document.documentElement.lang'), 'pl');
  await evaluate(window, "localStorage.removeItem('markdown-vision-preferences')");
  const resolved = await evaluate(window, `[
    resolveSystemLanguage(['zh-TW']), resolveSystemLanguage(['zh-CN']),
    resolveSystemLanguage(['pt-PT']), resolveSystemLanguage(['invalid_tag', 'pl-PL']),
    resolveSystemLanguage(['zz-ZZ']), resolveSystemLanguage(['zh_HK']),
    resolveSystemLanguage(['zh-Hans-TW']), resolveSystemLanguage(['zh-Hant-CN']),
    resolveSystemLanguage(['zh_TW.UTF-8@traditional']), resolveSystemLanguage(['fr_CA.ISO-8859-1']),
    resolveSystemLanguage(['invalid@modifier', 'de_DE.UTF-8'])
  ]`);
  assert.deepEqual(resolved, ['zh-hant', 'zh-hans', 'pt-br', 'pl', 'en', 'zh-hant', 'zh-hans', 'zh-hant',
    'zh-hant', 'fr', 'de']);
  await window.loadFile(indexFile, { query: { previewLocale: 'ar', testMacShortcuts: '1' } });
  const macRecovery = await evaluate(window, `(() => {
    const path = '/Users/example/ملفات/Alt+Enter {draft}.md';
    const prefix = 'Windows could not restore the original file during the save. The original is at ';
    return { path, message: window.markdownVisionReader.localizedNativeError(prefix + path) };
  })()`);
  assert.ok(macRecovery.message.includes(`\u2068${macRecovery.path}\u2069`),
    'Arabic recovery paths remain intact and isolated when macOS shortcut labels are active');
  await window.loadFile(indexFile);
  const withoutLocaleApi = await evaluate(window, `(() => {
    const original = Intl.Locale;
    try {
      Intl.Locale = undefined;
      return [resolveSystemLanguage(['zh_HK']), resolveSystemLanguage(['zh-Hans-TW']),
        resolveSystemLanguage(['pt-PT']), resolveSystemLanguage(['invalid_tag', 'pl-PL'])];
    } finally { Intl.Locale = original; }
  })()`);
  assert.deepEqual(withoutLocaleApi, ['zh-hant', 'zh-hans', 'pt-br', 'pl']);
  const regionalVariants = [
    ['ar-EG', 'ar'], ['zh-SG', 'zh-hans'], ['zh-MO', 'zh-hant'], ['cs-CZ', 'cs'],
    ['nl-BE', 'nl'], ['fr-CA', 'fr'], ['de-AT', 'de'], ['hi-IN', 'hi'],
    ['id-ID', 'id'], ['it-CH', 'it'], ['ja-JP', 'ja'], ['ko-KR', 'ko'],
    ['pl-PL', 'pl'], ['pt-PT', 'pt-br'], ['ru-RU', 'ru'], ['es-MX', 'es'],
    ['sv-FI', 'sv'], ['th-TH', 'th'], ['tr-TR', 'tr'], ['uk-UA', 'uk'], ['vi-VN', 'vi'],
    ['pl_PL.UTF-8', 'pl'], ['zh_TW.utf8', 'zh-hant'], ['pt_BR.UTF-8', 'pt-br'],
  ];
  const actualVariants = await evaluate(window, `(() => {
    const variants = ${JSON.stringify(regionalVariants)};
    const normal = variants.map(([tag]) => resolveSystemLanguage([tag]));
    const original = Intl.Locale;
    try { Intl.Locale = undefined; return { normal, fallback: variants.map(([tag]) => resolveSystemLanguage([tag])) }; }
    finally { Intl.Locale = original; }
  })()`);
  assert.deepEqual(actualVariants.normal, regionalVariants.map(([, expected]) => expected));
  assert.deepEqual(actualVariants.fallback, regionalVariants.map(([, expected]) => expected));
  const withoutMaximize = await evaluate(window, `(() => {
    const original = Intl.Locale;
    try { Intl.Locale = class { constructor() { this.language = 'zh'; } }; return resolveSystemLanguage(['zh-HK']); }
    finally { Intl.Locale = original; }
  })()`);
  assert.equal(withoutMaximize, 'zh-hant', 'Chinese fallback works without locale maximization');
  for (const [variant, expected] of [['fr-CA', 'fr'], ['zh-TW', 'zh-hant'], ['zh-CN', 'zh-hans'], ['pt-PT', 'pt-br']]) {
    await window.loadFile(indexFile, { query: { previewLocale: variant } });
    assert.equal(await evaluate(window, 'document.querySelector("#searchPanel").lang'), expected, variant);
  }
  await window.loadFile(indexFile, { query: { previewLocale: 'pl', testMacShortcuts: '1' } });
  const macMenu = await evaluate(window, `({ actual: window.__nativeMenuLabels,
    about: window.markdownVisionReader.interfaceText('About Markdown Vision…'),
    quit: window.markdownVisionReader.interfaceText('Quit Markdown Vision') })`);
  assert.equal(macMenu.actual['app-about'], macMenu.about, 'macOS About menu translation');
  assert.equal(macMenu.actual['app-quit'], macMenu.quit, 'macOS Quit menu translation');
  const macHint = await evaluate(window, `window.markdownVisionReader.interfaceText('Double-click or press Alt+Enter to edit this item')`);
  assert.match(macHint, /⌥\+Enter/, 'macOS editor instructions use the Option key');
  assert.doesNotMatch(macHint, /Alt\+Enter/, 'macOS editor instructions should not show the Alt key');
  const userValue = await evaluate(window, `window.markdownVisionReader.interfaceText('Update failed: {error}', { error: 'Alt+Enter is part of a file name' })`);
  assert.ok(userValue.includes('Alt+Enter is part of a file name'), 'shortcut formatting must not change inserted user data');
  const dynamicMacHints = await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('- Item\\n\\n| Header |\\n| --- |\\n| Value |\\n', 'shortcuts.md');
    document.querySelector('#editorToggle').click();
    return { list: document.querySelector('#editorPreview li')?.title,
      cell: document.querySelector('#editorPreview td[role="textbox"]')?.title };
  })()`);
  assert.match(dynamicMacHints.list, /⌥\+Enter/, 'dynamic list hint uses Option');
  assert.match(dynamicMacHints.cell, /⌥\+Enter/, 'dynamic table hint uses Option');
  const optionAction = await evaluate(window, `(() => {
    const cell = document.querySelector('#editorPreview td[role="textbox"]');
    const event = new KeyboardEvent('keydown', { key: 'Enter', altKey: true, bubbles: true, cancelable: true });
    cell.dispatchEvent(event);
    return { handled: event.defaultPrevented, dialog: document.querySelector('#visualEditDialog').open };
  })()`);
  assert.deepEqual(optionAction, { handled: true, dialog: true }, 'Option+Enter opens the advertised table action');
  const pluralExamples = {
    'pt-br': { 0: ['0 resultados da busca', '0 palavras'], 1: ['1 resultado da busca', '1 palavra'],
      2: ['2 resultados da busca', '2 palavras'] },
    cs: { 0: ['0 výsledků hledání', '0 slov'], 1: ['1 výsledek hledání', '1 slovo'],
      2: ['2 výsledky hledání', '2 slova'], 5: ['5 výsledků hledání', '5 slov'], 11: ['11 výsledků hledání', '11 slov'],
      12: ['12 výsledků hledání', '12 slov'], 21: ['21 výsledků hledání', '21 slov'], 22: ['22 výsledků hledání', '22 slov'], 100: ['100 výsledků hledání', '100 slov'] },
    pl: { 0: ['0 wyników wyszukiwania', '0 słów'], 1: ['1 wynik wyszukiwania', '1 słowo'],
      2: ['2 wyniki wyszukiwania', '2 słowa'], 5: ['5 wyników wyszukiwania', '5 słów'], 11: ['11 wyników wyszukiwania', '11 słów'],
      12: ['12 wyników wyszukiwania', '12 słów'], 21: ['21 wyników wyszukiwania', '21 słów'], 22: ['22 wyniki wyszukiwania', '22 słowa'], 100: ['100 wyników wyszukiwania', '100 słów'],
      101: ['101 wyników wyszukiwania', '101 słów'], 102: ['102 wyniki wyszukiwania', '102 słowa'],
      112: ['112 wyników wyszukiwania', '112 słów'], 122: ['122 wyniki wyszukiwania', '122 słowa'] },
    ru: { 0: ['0 результатов поиска', '0 слов'], 1: ['1 результат поиска', '1 слово'],
      2: ['2 результата поиска', '2 слова'], 5: ['5 результатов поиска', '5 слов'], 11: ['11 результатов поиска', '11 слов'],
      12: ['12 результатов поиска', '12 слов'], 21: ['21 результат поиска', '21 слово'], 22: ['22 результата поиска', '22 слова'], 100: ['100 результатов поиска', '100 слов'],
      101: ['101 результат поиска', '101 слово'], 102: ['102 результата поиска', '102 слова'],
      112: ['112 результатов поиска', '112 слов'], 122: ['122 результата поиска', '122 слова'] },
    uk: { 0: ['0 результатів пошуку', '0 слів'], 1: ['1 результат пошуку', '1 слово'],
      2: ['2 результати пошуку', '2 слова'], 5: ['5 результатів пошуку', '5 слів'], 11: ['11 результатів пошуку', '11 слів'],
      12: ['12 результатів пошуку', '12 слів'], 21: ['21 результат пошуку', '21 слово'], 22: ['22 результати пошуку', '22 слова'], 100: ['100 результатів пошуку', '100 слів'],
      101: ['101 результат пошуку', '101 слово'], 102: ['102 результати пошуку', '102 слова'],
      112: ['112 результатів пошуку', '112 слів'], 122: ['122 результати пошуку', '122 слова'] },
  };
  for (const [locale, examples] of Object.entries(pluralExamples)) {
    await window.loadFile(indexFile, { query: { previewLocale: locale } });
    for (const [count, expected] of Object.entries(examples)) {
      const actual = await evaluate(window, `[counterText('search', { count: ${Number(count)} }), counterText('words', { count: ${Number(count)} })]`);
      assert.deepEqual(actual, expected, `${locale}: count ${count}`);
    }
  }
  const localizedSearchLocales = await evaluate(window, `['en', ...Object.keys(previewMessages)]`);
  for (const locale of localizedSearchLocales) {
    await window.loadFile(indexFile, { query: { previewLocale: locale } });
    assert.equal(await evaluate(window, 'document.documentElement.lang'), locale,
      `${locale}: document language metadata follows the selected interface locale`);
    assert.equal(await evaluate(window, 'document.documentElement.getAttribute("dir")'), null,
      `${locale}: interface localization does not impose direction on user documents`);
    assert.deepEqual(await evaluate(window, `({
      reader: document.querySelector('#markdownOutput').getAttribute('lang'),
      editor: document.querySelector('#editorPreview').getAttribute('lang'),
      source: document.querySelector('#markdownSource').getAttribute('lang'),
    })`), { reader: '', editor: '', source: '' },
    `${locale}: user-document surfaces do not inherit the interface language`);
    await waitFor(window, 'window.__nativeMenuLabels && Object.keys(window.__nativeMenuLabels).length >= 8',
      `${locale}: native menu labels become available`);
    const nativeMenu = await evaluate(window, `(() => {
      const mac = /Mac|iPhone|iPad/i.test(navigator.platform + ' ' + navigator.userAgent);
      const sources = {
        'file-menu': 'File', 'file-new': 'New', 'file-open': 'Open…',
        'file-save': 'Save', 'file-save-as': 'Save As…', 'file-print': 'Print…',
        'file-close': 'Close', 'help-menu': 'Help',
        'app-about': mac ? 'About Markdown Vision…' : 'About Markdown Vision',
        'app-quit': mac ? 'Quit Markdown Vision' : 'Quit',
      };
      return Object.fromEntries(Object.entries(sources)
        .map(([key, source]) => [key, [window.__nativeMenuLabels[key], interfaceText(source)]]));
    })()`);
    for (const [key, [actual, expected]] of Object.entries(nativeMenu)) {
      assert.equal(actual, expected, `${locale}: native menu item ${key}`);
    }
    const searchLabels = await evaluate(window, `(() => {
      const input = document.querySelector('#searchInput');
      const button = document.querySelector('#searchButton');
      const panel = document.querySelector('#searchPanel');
      const expected = counterLocale === 'en' ? {
        searchText: 'Search text', searchPanel: 'Text search',
        previousMatch: 'Previous match', nextMatch: 'Next match', closeSearch: 'Close search',
      } : counterMessages;
      return {
        locale: counterLocale,
        placeholder: input.placeholder,
        buttonTitle: button.title,
        buttonLabel: button.getAttribute('aria-label'),
        panelLabel: panel.getAttribute('aria-label'),
        previousLabel: document.querySelector('#previousSearchMatch').getAttribute('aria-label'),
        nextLabel: document.querySelector('#nextSearchMatch').getAttribute('aria-label'),
        closeLabel: document.querySelector('#closeSearch').getAttribute('aria-label'),
        zeroCount: document.querySelector('#searchCount').textContent,
        expected: {
          searchText: expected.searchText,
          searchPanel: expected.searchPanel,
          previousMatch: expected.previousMatch,
          nextMatch: expected.nextMatch,
          closeSearch: expected.closeSearch,
          zeroCount: counterText('search', { count: 0 }),
        },
      };
    })()`);
    assert.equal(searchLabels.locale, locale, `${locale}: active search locale`);
    assert.equal(searchLabels.placeholder, searchLabels.expected.searchText, `${locale}: search placeholder`);
    assert.equal(searchLabels.buttonTitle, searchLabels.expected.searchText, `${locale}: search button title`);
    assert.equal(searchLabels.buttonLabel, searchLabels.expected.searchText, `${locale}: search button accessible name`);
    assert.equal(searchLabels.panelLabel, searchLabels.expected.searchPanel, `${locale}: search panel accessible name`);
    assert.equal(searchLabels.previousLabel, searchLabels.expected.previousMatch, `${locale}: previous-match label`);
    assert.equal(searchLabels.nextLabel, searchLabels.expected.nextMatch, `${locale}: next-match label`);
    assert.equal(searchLabels.closeLabel, searchLabels.expected.closeSearch, `${locale}: close-search label`);
    assert.equal(searchLabels.zeroCount, searchLabels.expected.zeroCount, `${locale}: zero-result counter`);
    const pluralOutputs = await evaluate(window, `(() => {
      const rules = new Intl.PluralRules(counterLocale);
      const candidates = [0, 1, 2, 3, 4, 5, 11, 12, 14, 20, 21, 22, 25, 100, 101, 102, 111,
        1000, 1000000, 1000001, 0.5, 1.1, 1.2, 1.5, 2.5, 5.5];
      const representatives = new Map();
      for (const count of candidates) {
        const category = rules.select(count);
        if (!representatives.has(category)) representatives.set(category, count);
      }
      const format = (forms, count) => {
        const category = counterLocale === 'pt-br' && count === 0 ? 'other' : rules.select(count);
        const template = typeof forms === 'string' ? forms : (forms[category] ?? forms.other);
        const number = new Intl.NumberFormat(counterLocale).format(count);
        return template.replace('{count}', counterLocale === 'ar' ? '\\u2068' + number + '\\u2069' : number);
      };
      return [...representatives].map(([category, count]) => ({ category, count,
        search: counterText('search', { count }), searchExpected: format(counterMessages.search, count),
        words: counterText('words', { count }), wordsExpected: format(counterMessages.words, count) }));
    })()`);
    for (const output of pluralOutputs) {
      assert.equal(output.search, output.searchExpected, `${locale}: search plural category ${output.category}`);
      assert.equal(output.words, output.wordsExpected, `${locale}: word-count plural category ${output.category}`);
    }
    if (locale !== 'en') {
      for (const text of ['Search text', 'Text search', 'Previous match', 'Next match', 'Close search']) {
        assert.ok(!Object.values(searchLabels).includes(text), `${locale}: English search label leaked into the interface`);
      }
      const untranslatedStaticText = await evaluate(window, `(() => {
        const rendered = new Set();
        for (const element of document.querySelectorAll('body *')) {
          if (!element.children.length) {
            const text = element.textContent.trim().replace(/\\s+/g, ' ');
            if (text) rendered.add(text);
          }
          for (const attribute of ['title', 'aria-label', 'aria-description', 'aria-valuetext', 'placeholder']) {
            const value = element.getAttribute(attribute)?.trim();
            if (value) rendered.add(value);
          }
        }
        return Object.entries(counterMessages.ui)
          .filter(([source, translated]) => source !== translated && rendered.has(source))
          .map(([source]) => source);
      })()`);
      assert.deepEqual(untranslatedStaticText, [], `${locale}: English static interface text leaked through`);
      const untranslatedInteractiveText = await evaluate(window, `(() => {
        window.markdownVisionReader.showDocument('- Item\\n\\n| Header |\\n| --- |\\n| Value |\\n', 'locale-review.md');
        document.querySelector('#editorToggle').click();
        const cell = document.querySelector('#editorPreview td[role="textbox"]');
        if (!cell) return { leaked: ['Table editor preview did not render'], dialogOpen: false };
        cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', altKey: true, bubbles: true, cancelable: true }));
        const rendered = new Set();
        for (const element of document.querySelectorAll('body *')) {
          const inEditorPreview = element.closest('#editorPreview');
          const inUserDocument = element.closest('#markdownOutput, #markdownSource') || inEditorPreview;
          if (!inUserDocument && !element.children.length) {
            const text = element.textContent.trim().replace(/\\s+/g, ' ');
            if (text) rendered.add(text);
          }
          if (!inUserDocument || element.matches('#editorPreview') || inEditorPreview) {
            for (const attribute of ['title', 'aria-label', 'aria-description', 'aria-valuetext', 'placeholder']) {
              const value = element.getAttribute(attribute)?.trim();
              if (value) rendered.add(value);
            }
          }
        }
        return {
          leaked: Object.entries(counterMessages.ui)
            .filter(([source, translated]) => source !== translated && rendered.has(source))
            .map(([source]) => source),
          dialogOpen: document.querySelector('#visualEditDialog')?.open,
        };
      })()`);
      assert.equal(untranslatedInteractiveText.dialogOpen, true, `${locale}: visual table editor opens`);
      assert.deepEqual(untranslatedInteractiveText.leaked, [],
        `${locale}: English text leaked into visual table editor controls`);
    }
  }
  await window.loadFile(indexFile, { query: { previewLocale: 'pt-br' } });
  const portugueseWordCounter = await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('', 'empty.md');
    document.querySelector('#editorToggle').click();
    const source = document.querySelector('#markdownSource');
    return ['', 'palavra', 'duas palavras'].map(value => {
      source.value = value;
      source.dispatchEvent(new Event('input', { bubbles: true }));
      return document.querySelector('#editorStats').textContent;
    });
  })()`);
  assert.deepEqual(portugueseWordCounter, ['0 palavras', '1 palavra', '2 palavras'],
    'Portuguese editor word counter uses the correct zero, singular, and plural forms');
  await window.loadFile(indexFile, { query: { previewLocale: 'ar' } });
  const arabicCounts = await evaluate(window, `[0, 1, 2, 3, 11, 100].map(count => ({
    search: counterText('search', { count }), words: counterText('words', { count }),
    number: new Intl.NumberFormat('ar').format(count)
  }))`);
  for (const count of arabicCounts) {
    assert.equal(count.search, `عدد نتائج البحث: \u2068${count.number}\u2069`, 'Arabic search count');
    assert.equal(count.words, `عدد الكلمات: \u2068${count.number}\u2069`, 'Arabic word count');
  }
  const inputLabelLocales = await evaluate(window, `['en', ...Object.keys(previewMessages)]`);
  for (const locale of inputLabelLocales) {
    await window.loadFile(indexFile, { query: { previewLocale: locale } });
    assert.equal(await evaluate(window, 'window.markdownVisionReader.interfaceDirection'),
      locale === 'ar' ? 'rtl' : 'ltr', `${locale}: native interface direction`);
    const inputLabels = await evaluate(window, `['#searchInput', '#fontInput', '#monoFontInput'].map(selector => {
      const field = document.querySelector(selector);
      const label = document.getElementById(field.getAttribute('aria-labelledby'));
      return { inputLanguage: field.getAttribute('lang'), labelLanguage: label?.lang,
        labelText: label?.textContent, accessibleName: field.getAttribute('aria-label') };
    })`);
    for (const label of inputLabels) {
      assert.equal(label.inputLanguage, '', `${locale}: input language is not forced to the interface language`);
      assert.equal(label.labelLanguage, locale, `${locale}: accessible label language`);
      assert.ok(label.labelText, `${locale}: accessible label is present`);
      assert.equal(label.labelText, label.accessibleName, `${locale}: accessible label text`);
    }
    const fieldDirections = await evaluate(window, `(() => {
      const fields = ['#searchInput', '#fontInput', '#monoFontInput'].map(selector => document.querySelector(selector));
      return fields.map(field => {
        field.value = 'مرحبا';
        const arabic = getComputedStyle(field).direction;
        field.value = 'Latin';
        return [field.dir, arabic, getComputedStyle(field).direction];
      });
    })()`);
    for (const directions of fieldDirections) {
      assert.deepEqual(directions, ['auto', 'rtl', 'ltr'], `${locale}: mixed-script input direction`);
    }
  }
  await window.loadFile(indexFile, { query: { previewLocale: 'en' } });
  const englishCopyLanguage = await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('~~~\\ncode\\n~~~', 'code.md');
    const button = document.querySelector('#markdownOutput .code-copy-button');
    return { language: button.getAttribute('lang'), label: button.getAttribute('aria-label'),
      documentLanguage: document.querySelector('#markdownOutput').getAttribute('lang') };
  })()`);
  assert.deepEqual(englishCopyLanguage, { language: 'en', label: 'Copy code', documentLanguage: '' },
    'English interface controls inside user documents carry the interface language');
  const englishErrorLanguage = await evaluate(window, `(async () => {
    const previous = window.desktop.reportOpenError;
    try {
      delete window.desktop.reportOpenError;
      await reportDocumentOpenError('Markdown Vision could not read this file.');
      return document.querySelector('#openErrorMessage bdi')?.lang;
    } finally {
      document.querySelector('#openErrorDialog').close();
      window.desktop.reportOpenError = previous;
    }
  })()`);
  assert.equal(englishErrorLanguage, 'en', 'recognized English app errors retain the interface language');
  const canonicalFontSearch = await evaluate(window, `(() => {
    const original = installedFonts;
    try {
      installedFonts = ['Café Sans'];
      fontWidthKinds.set('Café Sans', 'Variable-width');
      return getFontSuggestions(fontPickers.find(picker => picker.key === 'system'), 'Cafe\\u0301');
    } finally { installedFonts = original; fontWidthKinds.delete('Café Sans'); }
  })()`);
  assert.deepEqual(canonicalFontSearch, ['Café Sans'], 'font search accepts canonically equivalent Unicode names');
  const unicodeSearch = await evaluate(window, `(() => {
    const text = 'İx target target';
    window.markdownVisionReader.showDocument(text, 'unicode.md');
    document.querySelector('#searchButton').click();
    const input = document.querySelector('#searchInput');
    input.value = 'target';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return { text: document.querySelector('#markdownOutput').textContent,
      marks: [...document.querySelectorAll('#markdownOutput mark.search-highlight')].map(mark => mark.textContent) };
  })()`);
  assert.deepEqual(unicodeSearch, { text: 'İx target target', marks: ['target', 'target'] },
    'case folding before a search hit must not shift highlights or alter document text');
  const editorUnicodeSearch = await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('İx target i', 'unicode.md');
    const input = document.querySelector('#searchInput');
    input.value = 'i';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const reader = [...document.querySelectorAll('#markdownOutput mark.search-highlight')].map(mark => mark.textContent);
    document.querySelector('#editorToggle').click();
    document.querySelector('.editor-views [data-view="source"]').click();
    const editor = window.markdownVisionEditorSearch.find('i', false);
    const source = document.querySelector('#markdownSource').value;
    document.querySelector('#editorToggle').click();
    return { reader, count: editor.count, source };
  })()`);
  assert.deepEqual(editorUnicodeSearch, { reader: ['İ', 'i'], count: 2, source: 'İx target i' },
    'reader and editor search agree on case-folding expansions');
  const canonicalSearch = await evaluate(window, `(() => {
    const text = 'Cafe\\u0301 café';
    window.markdownVisionReader.showDocument(text, 'accents.md');
    const input = document.querySelector('#searchInput');
    input.value = 'café';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const reader = [...document.querySelectorAll('#markdownOutput mark.search-highlight')].map(mark => mark.textContent);
    document.querySelector('#editorToggle').click();
    document.querySelector('.editor-views [data-view="source"]').click();
    const count = window.markdownVisionEditorSearch.find('café', false).count;
    const source = document.querySelector('#markdownSource').value;
    document.querySelector('#editorToggle').click();
    return { reader, count, source };
  })()`);
  assert.deepEqual(canonicalSearch, { reader: ['Cafe\u0301', 'café'], count: 2, source: 'Cafe\u0301 café' },
    'reader and editor find canonically equivalent accents without changing the document');
  const canonicalFallback = await evaluate(window, `(() => {
    const original = Intl.Segmenter;
    try {
      Intl.Segmenter = undefined;
      return window.markdownVisionReader.caseInsensitivePositions('Cafe\\u0301 café', 'café');
    } finally { Intl.Segmenter = original; }
  })()`);
  assert.deepEqual(canonicalFallback, [{ start: 0, end: 5 }, { start: 6, end: 10 }],
    'canonical search works without Intl.Segmenter');
  const sigmaSearch = await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('Σ σ ς', 'greek.md');
    const input = document.querySelector('#searchInput');
    input.value = 'σ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const reader = [...document.querySelectorAll('#markdownOutput mark.search-highlight')].map(mark => mark.textContent);
    document.querySelector('#editorToggle').click();
    document.querySelector('.editor-views [data-view="source"]').click();
    const count = window.markdownVisionEditorSearch.find('σ', false).count;
    document.querySelector('#editorToggle').click();
    return { reader, count };
  })()`);
  assert.deepEqual(sigmaSearch, { reader: ['Σ', 'σ', 'ς'], count: 3 },
    'Greek sigma variants match consistently in reader and editor');
  const germanSearch = await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('Straße STRASSE straẞe', 'german.md');
    const input = document.querySelector('#searchInput');
    input.value = 'strasse';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const reader = [...document.querySelectorAll('#markdownOutput mark.search-highlight')].map(mark => mark.textContent);
    document.querySelector('#editorToggle').click();
    document.querySelector('.editor-views [data-view="source"]').click();
    const count = window.markdownVisionEditorSearch.find('straße', false).count;
    document.querySelector('#editorToggle').click();
    return { reader, count };
  })()`);
  assert.deepEqual(germanSearch, { reader: ['Straße', 'STRASSE', 'straẞe'], count: 3 },
    'German sharp s and ss match in reader and editor without changing the displayed text');
  const germanFormattedSearch = await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('Stra**ße** STRA**SSE**', 'german-formatting.md');
    const input = document.querySelector('#searchInput');
    input.value = 'strasse';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const marks = [...document.querySelectorAll('#markdownOutput mark.search-highlight')];
    const result = { count: searchMatchCount, marks: marks.map(mark => [mark.dataset.searchMatch, mark.textContent]),
      partial: window.markdownVisionReader.caseInsensitivePositions('ß', 's') };
    document.querySelector('#editorToggle').click();
    document.querySelector('.editor-views [data-view="split"]').click();
    result.editorCount = window.markdownVisionEditorSearch.find('straße', false).count;
    document.querySelector('#editorToggle').click();
    return result;
  })()`);
  assert.deepEqual(germanFormattedSearch, { count: 2, marks: [['0', 'Stra'], ['0', 'ße'], ['1', 'STRA'], ['1', 'SSE']],
    partial: [{ start: 0, end: 1 }], editorCount: 2 },
    'German search maps expanded characters across formatting and avoids overlapping highlights');
  const reorderedMarks = await evaluate(window, `(() => {
    const text = 'e\\u0301\\u0327';
    const query = 'e\\u0327\\u0301';
    const original = Intl.Segmenter;
    const normal = window.markdownVisionReader.caseInsensitivePositions(text, query);
    try {
      Intl.Segmenter = undefined;
      return { normal, fallback: window.markdownVisionReader.caseInsensitivePositions(text, query) };
    } finally { Intl.Segmenter = original; }
  })()`);
  assert.deepEqual(reorderedMarks, { normal: [{ start: 0, end: 3 }], fallback: [{ start: 0, end: 3 }] },
    'canonically reordered combining marks map to the whole original character');
  const formattedUnicodeSearch = await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('İ**test**', 'unicode.md');
    document.querySelector('#editorToggle').click();
    document.querySelector('.editor-views [data-view="split"]').click();
    const found = window.markdownVisionEditorSearch.find('i\u0307t', false);
    const result = { count: found.count, scope: window.markdownVisionEditorSearch.scope(0),
      source: document.querySelector('#markdownSource').value };
    document.querySelector('#editorToggle').click();
    return result;
  })()`);
  assert.deepEqual(formattedUnicodeSearch, { count: 1, scope: '', source: 'İ**test**' },
    'formatted Unicode match maps to both source and visual panes');
  const formattedCanonicalSearch = await evaluate(window, `(() => {
    const source = 'Ca**fe\\u0301**';
    window.markdownVisionReader.showDocument(source, 'accents.md');
    document.querySelector('#editorToggle').click();
    document.querySelector('.editor-views [data-view="split"]').click();
    const found = window.markdownVisionEditorSearch.find('café', false);
    const result = { count: found.count, scope: window.markdownVisionEditorSearch.scope(0),
      source: document.querySelector('#markdownSource').value };
    document.querySelector('#editorToggle').click();
    return result;
  })()`);
  assert.deepEqual(formattedCanonicalSearch, { count: 1, scope: '', source: 'Ca**fe\u0301**' },
    'canonical search across formatting maps to both editor panes');
  const formattedSearchCases = await evaluate(window, `(() => {
    const search = (content, query) => {
      window.markdownVisionReader.showDocument(content, 'formatted.md');
      document.querySelector('#editorToggle').click();
      document.querySelector('.editor-views [data-view="split"]').click();
      const found = window.markdownVisionEditorSearch.find(query, false);
      const result = { count: found.count,
        scopes: Array.from({ length: found.count }, (_, index) => window.markdownVisionEditorSearch.scope(index)) };
      document.querySelector('#editorToggle').click();
      return result;
    };
    return [search('pre**fix** pre**fix**', 'prefix'), search('a\\\\*b ab', 'ab')];
  })()`);
  assert.deepEqual(formattedSearchCases, [{ count: 2, scopes: ['', ''] }, { count: 1, scopes: [''] }],
    'formatted search handles repeated matches and literal escaped punctuation');
  const readerFormattedSearch = await evaluate(window, `(() => {
    const markdown = 'Ca**fe\\u0301** and ca**fé**\\n\\nSeparate text';
    window.markdownVisionReader.showDocument(markdown, 'formatted.md');
    if (document.querySelector('#searchPanel').hidden) document.querySelector('#searchButton').click();
    const input = document.querySelector('#searchInput');
    input.value = 'café';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const marks = [...document.querySelectorAll('#markdownOutput mark.search-highlight')];
    const result = { groups: marks.map(mark => [mark.dataset.searchMatch, mark.textContent]),
      count: searchMatchCount, active: marks.filter(mark => mark.classList.contains('is-active')).map(mark => mark.dataset.searchMatch),
      text: document.querySelector('#markdownOutput').textContent };
    document.querySelector('#nextSearchMatch').click();
    result.nextActive = [...document.querySelectorAll('#markdownOutput mark.is-active')].map(mark => mark.dataset.searchMatch);
    document.querySelector('#closeSearch').click();
    result.restored = document.querySelector('#markdownOutput').textContent;
    return result;
  })()`);
  assert.deepEqual(readerFormattedSearch, { groups: [['0', 'Ca'], ['0', 'fe\u0301'], ['1', 'ca'], ['1', 'fé']],
    count: 2, active: ['0', '0'], nextActive: ['1', '1'], text: 'Cafe\u0301 and café\nSeparate text',
    restored: 'Cafe\u0301 and café\nSeparate text' }, 'reader search groups matches across formatting');
  const highlightedCaret = await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('Ca**fe\\u0301**', 'caret.md');
    document.querySelector('#editorToggle').click();
    document.querySelector('.editor-views [data-view="source"]').click();
    document.querySelector('#editorToggle').click();
    document.querySelector('#searchButton').click();
    const input = document.querySelector('#searchInput');
    input.value = 'café';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const mark = document.querySelector('#markdownOutput strong mark');
    window.getSelection().collapse(mark.firstChild, 1);
    document.dispatchEvent(new Event('selectionchange'));
    document.querySelector('#editorToggle').click();
    const source = document.querySelector('#markdownSource');
    return { position: source.selectionStart, value: source.value };
  })()`);
  assert.deepEqual(highlightedCaret, { position: 'Ca**f'.length, value: 'Ca**fe\u0301**' },
    'reader caret inside a search highlight maps to the original Markdown');
  await evaluate(window, `document.querySelector('#editorToggle').click(); document.querySelector('#closeSearch').click();`);
  const readerBlockBoundary = await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('alpha\\n\\nbeta', 'blocks.md');
    document.querySelector('#searchButton').click();
    const input = document.querySelector('#searchInput');
    input.value = 'alphabeta';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return { count: searchMatchCount, marks: document.querySelectorAll('#markdownOutput mark.search-highlight').length };
  })()`);
  assert.deepEqual(readerBlockBoundary, { count: 0, marks: 0 }, 'reader search does not join separate paragraphs');
  const multilingualFormattedSearch = await evaluate(window, `(() => {
    const input = document.querySelector('#searchInput');
    return [
      ['\\u0645\\u0631**\\u062d\\u0628\\u0627** \\u0645\\u0631**\\u062d\\u0628\\u0627**', '\\u0645\\u0631\\u062d\\u0628\\u0627'],
      ['\\u65e5**\\u672c\\u8a9e** \\u65e5**\\u672c\\u8a9e**', '\\u65e5\\u672c\\u8a9e'],
      ['\\u041f\\u0440**\\u0438\\u0432\\u0435\\u0442** \\u043f\\u0440**\\u0438\\u0432\\u0435\\u0442**', '\\u043f\\u0440\\u0438\\u0432\\u0435\\u0442']
    ].map(([markdown, query]) => {
      window.markdownVisionReader.showDocument(markdown, 'multilingual.md');
      input.value = query;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const count = searchMatchCount;
      const first = [...document.querySelectorAll('#markdownOutput mark.is-active')].map(mark => mark.dataset.searchMatch);
      document.querySelector('#nextSearchMatch').click();
      const second = [...document.querySelectorAll('#markdownOutput mark.is-active')].map(mark => mark.dataset.searchMatch);
      return { count, first, second, label: document.querySelector('#searchCount').textContent,
        expectedLabel: counterText('position', { current: 2, total: 2 }) };
    });
  })()`);
  for (const result of multilingualFormattedSearch) {
    assert.deepEqual(result, { count: 2, first: ['0', '0'], second: ['1', '1'],
      label: result.expectedLabel, expectedLabel: result.expectedLabel },
    'multilingual formatted matches are counted and navigated as whole results');
  }
  const readerLinksAndCode = await evaluate(window, `(() => {
    const source = '[ca**fé**](https://example.invalid)\\n\\n~~~\\ncafé\\n~~~';
    window.markdownVisionReader.showDocument(source, 'links.md');
    const input = document.querySelector('#searchInput');
    input.value = 'café';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const link = document.querySelector('#markdownOutput a');
    const code = document.querySelector('#markdownOutput pre code');
    const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    let copied = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true,
      value: { writeText: async text => { copied = text; } } });
    code.parentElement.querySelector('.code-copy-button').click();
    const result = { count: searchMatchCount, href: link.getAttribute('href'),
      linkText: link.textContent, codeText: code.textContent, copied,
      copyButton: !!code.parentElement.querySelector('.code-copy-button') };
    if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
    else delete navigator.clipboard;
    document.querySelector('#closeSearch').click();
    result.restoredLink = link.textContent;
    result.restoredCode = code.textContent;
    return result;
  })()`);
  assert.deepEqual(readerLinksAndCode, { count: 2, href: 'https://example.invalid', linkText: 'café',
    codeText: 'café', copied: 'café', copyButton: true, restoredLink: 'café', restoredCode: 'café' },
    'reader search preserves links and code blocks');
  await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('<details><summary>Section</summary>hidden target</details>', 'details.md');
    document.querySelector('#searchButton').click();
    const input = document.querySelector('#searchInput');
    input.value = 'target';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  assert.equal(await evaluate(window, 'searchMatchCount'), 1, 'collapsed content is included in search');
  assert.equal(await evaluate(window, `document.querySelector('#markdownOutput details').open`), true,
    'navigating to a hidden match expands its section');
  await evaluate(window, `document.querySelector('#markdownOutput details').open = false;
    document.querySelector('#nextSearchMatch').click()`);
  assert.equal(await evaluate(window, `document.querySelector('#markdownOutput details').open`), true,
    'navigating back to a collapsed match reopens its section');
  const summarySearch = await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('<details><summary>target</summary>hidden text</details>', 'summary.md');
    const input = document.querySelector('#searchInput');
    input.value = 'target';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return { count: searchMatchCount, open: document.querySelector('#markdownOutput details').open };
  })()`);
  assert.deepEqual(summarySearch, { count: 1, open: false }, 'a visible summary match does not expand its section');
  const searchCases = await evaluate(window, `[
    ['İx target target', 'i'], ['😀 İ test 😀', 'test'],
    ['Σίσυφος ΣΊΣΥΦΟΣ', 'σίσυφος'], ['İ a.b a.b', 'a.b'], ['日本語 日本語', '日本語']
  ].map(([text, query]) => {
    window.markdownVisionReader.showDocument(text, 'unicode.md');
    const input = document.querySelector('#searchInput');
    input.value = query;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return { text: document.querySelector('#markdownOutput').textContent,
      marks: [...document.querySelectorAll('#markdownOutput mark.search-highlight')].map(mark => mark.textContent) };
  })`);
  assert.deepEqual(searchCases, [
    { text: 'İx target target', marks: ['İ'] }, { text: '😀 İ test 😀', marks: ['test'] },
    { text: 'Σίσυφος ΣΊΣΥΦΟΣ', marks: ['Σίσυφος', 'ΣΊΣΥΦΟΣ'] },
    { text: 'İ a.b a.b', marks: ['a.b', 'a.b'] }, { text: '日本語 日本語', marks: ['日本語', '日本語'] },
  ], 'multilingual and literal search highlights must preserve the source text');
  const searchOffsets = await evaluate(window, `[
    ['İİ', 'i'], ['😀İxİ', 'i'], ['İİ', 'i\\u0307'], ['a.b a.b', '.'], ['日本語', '']
  ].map(([text, query]) => window.markdownVisionReader.caseInsensitivePositions(text, query))`);
  assert.deepEqual(searchOffsets, [
    [{ start: 0, end: 1 }, { start: 1, end: 2 }],
    [{ start: 2, end: 3 }, { start: 4, end: 5 }],
    [{ start: 0, end: 1 }, { start: 1, end: 2 }],
    [{ start: 1, end: 2 }, { start: 5, end: 6 }], [],
  ], 'case-folded search offsets must refer to original UTF-16 text');
  const clearedUnicodeSearch = await evaluate(window, `(() => {
    const original = 'İx target 😀 target';
    window.markdownVisionReader.showDocument(original, 'unicode.md');
    const input = document.querySelector('#searchInput');
    input.value = 'target';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.value = 'i';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const marks = [...document.querySelectorAll('#markdownOutput mark.search-highlight')].map(mark => mark.textContent);
    document.querySelector('#closeSearch').click();
    return { marks, text: document.querySelector('#markdownOutput').textContent,
      remaining: document.querySelectorAll('#markdownOutput mark.search-highlight').length };
  })()`);
  assert.deepEqual(clearedUnicodeSearch, { marks: ['İ'], text: 'İx target 😀 target', remaining: 0 },
    'changing and clearing a multilingual query preserves the document');
  await window.loadFile(indexFile, { query: { previewLocale: 'ar' } });
  const emptyTaskVariants = await evaluate(window, `['- [ ]', '- [x]', '- [ ] ', '- [x] '].map(line => {
    const item = window.markdownVisionReader.readListItem(line);
    return { task: item?.task, spacing: item?.taskSpacing, body: item?.body,
      bodyStart: item?.bodyStart, length: line.length };
  })`);
  assert.deepEqual(emptyTaskVariants, [
    { task: '[ ]', spacing: '', body: '', bodyStart: 5, length: 5 },
    { task: '[x]', spacing: '', body: '', bodyStart: 5, length: 5 },
    { task: '[ ]', spacing: ' ', body: '', bodyStart: 6, length: 6 },
    { task: '[x]', spacing: ' ', body: '', bodyStart: 6, length: 6 },
  ], 'empty checked and unchecked task markers remain distinct from item text');
  const fileNameLanguage = await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('test', 'ملف.md');
    const name = document.querySelector('#fileName');
    return { text: name.textContent, language: name.getAttribute('lang'), direction: name.dir };
  })()`);
  assert.deepEqual(fileNameLanguage, { text: 'ملف.md', language: '', direction: 'auto' },
    'user-provided file names do not inherit the interface language');
  const editedEmptyTask = await evaluate(window, `(() => {
    const reader = window.markdownVisionReader;
    reader.showDocument('- [x]', 'empty-task.md');
    document.querySelector('#editorToggle').click();
    const checkbox = document.querySelector('#editorPreview input[type="checkbox"]');
    const accessible = document.getElementById(checkbox?.getAttribute('aria-labelledby'));
    const fallback = { label: checkbox?.getAttribute('aria-label'), language: accessible?.lang,
      text: accessible?.textContent, expected: reader.interfaceText('Task') };
    const control = document.querySelector('#editorPreview [data-visual-edit="list-item"]');
    if (!control) return { available: false };
    control.click();
    const dialog = document.querySelector('#visualEditDialog');
    dialog.querySelector('[name="text"]').value = 'Finished';
    dialog.querySelector('form').requestSubmit();
    const updated = document.querySelector('#editorPreview input[type="checkbox"]');
    return { available: true, value: document.querySelector('#markdownSource').value, fallback,
      updated: { label: updated?.getAttribute('aria-label'), language: updated?.getAttribute('lang'),
        reference: updated?.getAttribute('aria-labelledby') } };
  })()`);
  assert.deepEqual(editedEmptyTask, { available: true, value: '- [x] Finished',
    fallback: { label: 'المهمة', language: 'ar', text: 'المهمة', expected: 'المهمة' },
    updated: { label: 'Finished', language: '', reference: null } },
    'editing an empty checked task keeps the marker and inserts a separator');
  const addedEmptyTask = await evaluate(window, `(() => {
    const reader = window.markdownVisionReader;
    document.querySelector('#editorToggle').click();
    reader.showDocument('- [x]', 'empty-task.md');
    document.querySelector('#editorToggle').click();
    document.querySelector('#editorPreview [data-visual-edit="list-structure"]').click();
    const dialog = document.querySelector('#visualEditDialog');
    dialog.querySelector('select[name="operation"]').value = 'add';
    dialog.querySelector('form').requestSubmit();
    return { value: document.querySelector('#markdownSource').value, newItem: reader.interfaceText('New item') };
  })()`);
  assert.equal(addedEmptyTask.value, `- [x]\n- [ ] ${addedEmptyTask.newItem}`,
    'adding after an empty task separates the new checkbox from its localized text');
  const complexTaskLabel = await evaluate(window, `(() => {
    document.querySelector('#editorToggle').click();
    window.markdownVisionReader.showDocument('- [ ] English task label\\n- **bold**\\n', 'task.md');
    document.querySelector('#editorToggle').click();
    const checkbox = document.querySelector('#editorPreview input[type="checkbox"]');
    return { label: checkbox?.getAttribute('aria-label'), lang: checkbox?.getAttribute('lang'), disabled: checkbox?.disabled };
  })()`);
  assert.deepEqual(complexTaskLabel, { label: 'English task label', lang: '', disabled: false },
    'a document-provided task label does not inherit the interface language');
  const nestedTaskLabel = await evaluate(window, `(() => {
    document.querySelector('#editorToggle').click();
    window.markdownVisionReader.showDocument('- [ ] Parent task\\n  - Nested child', 'nested-task.md');
    document.querySelector('#editorToggle').click();
    const checkbox = document.querySelector('#editorPreview input[type="checkbox"]');
    return { label: checkbox?.getAttribute('aria-label'), language: checkbox?.getAttribute('lang'), disabled: checkbox?.disabled };
  })()`);
  assert.deepEqual(nestedTaskLabel, { label: 'Parent task', language: '', disabled: false },
    'a parent task label excludes nested items and translated editor controls');
  const emptyNestedTask = await evaluate(window, `(() => {
    document.querySelector('#editorToggle').click();
    const reader = window.markdownVisionReader;
    reader.showDocument('- [ ]\\n  - Nested child', 'empty-nested-task.md');
    document.querySelector('#editorToggle').click();
    const checkbox = document.querySelector('#editorPreview input[type="checkbox"]');
    const label = document.getElementById(checkbox?.getAttribute('aria-labelledby'));
    return { label: checkbox?.getAttribute('aria-label'), expected: reader.interfaceText('Task'), language: label?.lang };
  })()`);
  assert.deepEqual(emptyNestedTask, { label: 'المهمة', expected: 'المهمة', language: 'ar' },
    'an empty parent task uses the localized fallback instead of a child item');
  for (const [locale, text, expected] of [
    ['zh-hans', '你好世界', '2 个词'], ['ja', '日本語の文章', '3 語'],
    ['th', 'ภาษาไทย', '2 คำ'], ['zh-hant', '漢字 hello', '2 個詞'],
    ['en', '日本語の文章', '3 words'], ['en', 'ภาษาไทย', '2 words'],
    ['ja', 'English text', '2 語'],
  ]) {
    await window.loadFile(indexFile, { query: { previewLocale: locale } });
    const label = await evaluate(window, `(() => {
      window.markdownVisionReader.showDocument(${JSON.stringify(text)}, 'words.md');
      document.querySelector('#editorToggle').click();
      return document.querySelector('#editorStats').textContent;
    })()`);
    assert.equal(label, expected, `${locale}: word segmentation`);
  }
  await window.loadFile(indexFile, { query: { previewLocale: 'zh-hans', testNoSegmenter: '1' } });
  const fallback = await evaluate(window, `(() => {
    window.markdownVisionReader.showDocument('你好世界 example', 'words.md');
    document.querySelector('#editorToggle').click();
    return document.querySelector('#editorStats').textContent;
  })()`);
  assert.equal(fallback, '估计词数：2', 'word count describes the fallback as approximate without Intl.Segmenter');
  const fallbackLatin = await evaluate(window, `(() => {
    const source = document.querySelector('#markdownSource');
    source.value = 'one two';
    source.dispatchEvent(new Event('input', { bubbles: true }));
    return document.querySelector('#editorStats').textContent;
  })()`);
  assert.equal(fallbackLatin, '2 个词', 'space-separated fallback is not marked approximate');
  const previousSize = window.getContentSize();
  window.setContentSize(320, 500);
  for (const locale of ['ar', 'zh-hans', 'zh-hant', 'cs', 'nl', 'fr', 'de', 'hi', 'id', 'it', 'ja',
    'ko', 'pl', 'pt-br', 'ru', 'es', 'sv', 'th', 'tr', 'uk', 'vi']) {
    await window.loadFile(indexFile, { query: { previewLocale: locale, testNoSegmenter: '1' } });
    const approximate = await evaluate(window, `(() => {
      const reader = window.markdownVisionReader;
      reader.showDocument('你好世界 example', 'words.md');
      document.querySelector('#editorToggle').click();
      const count = document.querySelector('#editorStats');
      const status = count.parentElement;
      return { text: count.textContent, expected: reader.interfaceText('Approximate word count: {count}', { count: 2 }),
        language: count.lang, direction: getComputedStyle(count).direction,
        content: status.scrollWidth, width: status.clientWidth };
    })()`);
    assert.equal(approximate.text, approximate.expected, `${locale}: approximate word count`);
    assert.equal(approximate.language, locale, `${locale}: approximate count language`);
    assert.equal(approximate.direction, locale === 'ar' ? 'rtl' : 'ltr', `${locale}: approximate count direction`);
    assert.ok(approximate.content <= approximate.width + 1, `${locale}: approximate count overflows`);
    assert.doesNotMatch(approximate.text, /Approximate word count/, `${locale}: approximate count is untranslated`);
  }
  window.setContentSize(...previousSize);
  for (const [locale, count] of [['ar', '٣'], ['hi', '३'], ['th', '๓'], ['ja', '３'], ['en', '3']]) {
    await window.loadFile(indexFile, { query: { previewLocale: locale } });
    const table = await evaluate(window, `(() => {
      window.prompt = () => ${JSON.stringify(count)};
      window.markdownVisionReader.showDocument('', 'table.md');
      document.querySelector('#editorToggle').click();
      document.querySelector('.editor-views [data-view="source"]').click();
      document.querySelector('#editorTools [data-command="table"]').click();
      const source = document.querySelector('#markdownSource');
      return { value: source.value, selection: source.value.slice(source.selectionStart, source.selectionEnd),
        heading: window.markdownVisionReader.interfaceText('Header {number}', { number: 1 }, false),
        cell: window.markdownVisionReader.interfaceText('Cell') };
    })()`);
    const lines = table.value.split('\n');
    assert.equal(lines.length, 3, `${locale}: table should have three rows`);
    assert.equal(lines[0].split('|').length, 5, `${locale}: table should have three columns`);
    assert.equal(table.selection, table.heading, `${locale}: first header selection`);
    assert.ok(lines[2].includes(table.cell), `${locale}: localized table cells`);
  }
  for (const value of [null, '', '١', '९', '٣x', '-٣']) {
    await window.loadFile(indexFile, { query: { previewLocale: 'ar' } });
    const content = await evaluate(window, `(() => {
      window.prompt = () => ${JSON.stringify(value)};
      window.markdownVisionReader.showDocument('Existing text', 'table.md');
      document.querySelector('#editorToggle').click();
      document.querySelector('.editor-views [data-view="source"]').click();
      document.querySelector('#editorTools [data-command="table"]').click();
      return document.querySelector('#markdownSource').value;
    })()`);
    assert.equal(content, 'Existing text', `invalid column count ${String(value)} must not alter the document`);
  }
  for (const locale of ['ar', 'zh-hans', 'zh-hant', 'cs', 'nl', 'fr', 'de', 'hi', 'id', 'it', 'ja',
    'ko', 'pl', 'pt-br', 'ru', 'es', 'sv', 'th', 'tr', 'uk', 'vi']) {
    await window.loadFile(indexFile, { query: { previewLocale: locale } });
    const task = await evaluate(window, `(() => {
      const reader = window.markdownVisionReader;
      reader.showDocument('- [ ] Example task\\n', 'task.md');
      const checkbox = document.querySelector('#markdownOutput input[type=checkbox]');
      return { label: checkbox.getAttribute('aria-label'), lang: checkbox.lang, expected: reader.interfaceText('Task') };
    })()`);
    assert.equal(task.lang, locale);
    assert.equal(task.label, task.expected);
    assert.notEqual(task.label, 'Task');
    const editorTasks = await evaluate(window, `(() => {
      const reader = window.markdownVisionReader;
      reader.showDocument('- [ ]\\n- [ ] Example task', 'task-labels.md');
      document.querySelector('#editorToggle').click();
      const [empty, written] = document.querySelectorAll('#editorPreview input[type=checkbox]');
      const label = document.getElementById(empty?.getAttribute('aria-labelledby'));
      const result = { emptyLabel: empty?.getAttribute('aria-label'), emptyLanguage: label?.lang,
        emptyLabelText: label?.textContent, expected: reader.interfaceText('Task'),
        writtenLabel: written?.getAttribute('aria-label'), writtenLanguage: written?.getAttribute('lang'),
        writtenReference: written?.getAttribute('aria-labelledby') };
      document.querySelector('#editorToggle').click();
      return result;
    })()`);
    assert.equal(editorTasks.emptyLabel, editorTasks.expected, `${locale}: empty task label`);
    assert.equal(editorTasks.emptyLabelText, editorTasks.expected, `${locale}: empty task accessible text`);
    assert.equal(editorTasks.emptyLanguage, locale, `${locale}: empty task accessible language`);
    assert.equal(editorTasks.writtenLabel, 'Example task', `${locale}: document task label`);
    assert.equal(editorTasks.writtenLanguage, '', `${locale}: document task language`);
    assert.equal(editorTasks.writtenReference, null, `${locale}: document task uses stale translated label`);
    const tablePrompt = await evaluate(window, `(() => {
      const previousPrompt = window.prompt;
      let promptText = '';
      try {
        window.prompt = text => { promptText = text; return null; };
        window.markdownVisionReader.showDocument('existing content', 'prompt.md');
        document.querySelector('#editorToggle').click();
        document.querySelector('.editor-views [data-view="source"]').click();
        document.querySelector('[data-command="table"]').click();
        const result = { promptText, expected: window.markdownVisionReader.interfaceText('Number of columns (2–8)'),
          content: document.querySelector('#markdownSource').value };
        document.querySelector('.editor-views [data-view="visual"]').click();
        document.querySelector('#editorToggle').click();
        return result;
      } finally { window.prompt = previousPrompt; }
    })()`);
    assert.equal(tablePrompt.promptText, tablePrompt.expected, `${locale}: table prompt language`);
    assert.notEqual(tablePrompt.promptText, 'Number of columns (2–8)', `${locale}: untranslated table prompt`);
    assert.equal(tablePrompt.content, 'existing content', `${locale}: canceled table prompt altered the document`);
    const tableCell = await evaluate(window, `(() => {
      window.markdownVisionReader.showDocument('| Header |\\n| --- |\\n| User text |\\n', 'table.md');
      document.querySelector('#editorToggle').click();
      const cell = document.querySelector('#editorPreview td[role="textbox"]');
      const label = cell && document.getElementById(cell.getAttribute('aria-labelledby'));
      const description = cell && document.getElementById(cell.getAttribute('aria-describedby'));
      const result = { exists: !!cell, text: cell?.textContent, lang: cell?.lang,
        labelLanguage: label?.lang, label: label?.textContent,
        descriptionLanguage: description?.lang, description: description?.textContent,
        expectedDescription: window.markdownVisionReader.interfaceText('Type to edit this cell. Press Alt+Enter for table options.'),
        expected: window.markdownVisionReader.interfaceText('Edit table cell') };
      cell?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', altKey: true, bubbles: true }));
      const dialog = document.querySelector('#visualEditDialog');
      const operation = dialog.querySelector('select[name="operation"]');
      if (operation?.querySelector('option[value="add-column"]')) {
        operation.value = 'add-column';
        dialog.querySelector('form').requestSubmit();
        result.markdown = document.querySelector('#markdownSource').value;
        result.newColumn = window.markdownVisionReader.interfaceText('New column');
      }
      document.querySelector('#editorToggle').click();
      result.renderedHeaders = [...document.querySelectorAll('#markdownOutput thead th')].map(cell => cell.textContent.trim());
      return result;
    })()`);
    assert.equal(tableCell.exists, true, `${locale}: editable table cell missing`);
    assert.equal(tableCell.text, 'User text');
    assert.ok(tableCell.newColumn && tableCell.newColumn !== 'New column', `${locale}: untranslated new column`);
    if (repairedLabels[locale]) assert.equal(tableCell.newColumn, repairedLabels[locale][0], `${locale}: corrupted column label`);
    assert.ok(tableCell.markdown?.includes('| ' + tableCell.newColumn + ' |'), `${locale}: new column header missing`);
    assert.deepEqual(tableCell.renderedHeaders, ['Header', tableCell.newColumn], `${locale}: localized table header did not render`);
    assert.equal(tableCell.lang, '', `${locale}: document cell inherited UI language`);
    assert.equal(tableCell.labelLanguage, locale, `${locale}: table label language missing`);
    assert.equal(tableCell.label, tableCell.expected);
    assert.equal(tableCell.descriptionLanguage, locale, `${locale}: table instructions language`);
    assert.equal(tableCell.description, tableCell.expectedDescription, `${locale}: table instructions`);
    const nestedTable = await evaluate(window, `(() => {
      const reader = window.markdownVisionReader;
      reader.showDocument('> | Header |\\n> | --- |\\n> | Text |\\n', 'nested-table.md');
      document.querySelector('#editorToggle').click();
      const cell = document.querySelector('#editorPreview [data-visual-edit="table-cell-nested"]');
      const description = cell && document.getElementById(cell.getAttribute('aria-describedby'));
      const result = { found: !!cell, language: description?.lang, text: description?.textContent,
        expected: reader.interfaceText('Select a cell to edit it or change the table. Press Alt+Enter while typing.') };
      document.querySelector('.editor-views [data-view="source"]').click();
      document.querySelector('.editor-views [data-view="visual"]').click();
      const refreshed = document.querySelector('#editorPreview [data-visual-edit="table-cell-nested"]');
      const refreshedDescription = refreshed && document.getElementById(refreshed.getAttribute('aria-describedby'));
      result.refreshedLanguage = refreshedDescription?.lang;
      result.refreshedText = refreshedDescription?.textContent;
      document.querySelector('#editorToggle').click();
      return result;
    })()`);
    assert.equal(nestedTable.found, true, `${locale}: nested table cell missing`);
    assert.equal(nestedTable.language, locale, `${locale}: nested table instructions language`);
    assert.equal(nestedTable.text, nestedTable.expected, `${locale}: nested table instructions`);
    assert.equal(nestedTable.refreshedLanguage, locale, `${locale}: refreshed nested table instructions language`);
    assert.equal(nestedTable.refreshedText, nestedTable.expected, `${locale}: refreshed nested table instructions`);
    const font = await evaluate(window, `(() => {
      const input = document.querySelector('#fontInput');
      const status = document.getElementById(input.getAttribute('aria-describedby'));
      const slider = document.querySelector('#fontSize');
      const line = document.querySelector('#lineHeight');
      return { statusRole: status?.getAttribute('role'), lang: status?.lang, direction: status?.dir,
        sizeText: slider.getAttribute('aria-valuetext'), sizeOutput: document.querySelector('#fontSizeOutput').value,
        lineText: line.getAttribute('aria-valuetext'), lineOutput: document.querySelector('#lineHeightOutput').value };
    })()`);
    assert.equal(font.statusRole, 'status');
    assert.equal(font.lang, locale);
    assert.equal(font.direction, locale === 'ar' ? 'rtl' : 'ltr', `${locale}: font status direction`);
    assert.equal(font.sizeText, font.sizeOutput);
    assert.equal(font.lineText, font.lineOutput);
    if (locale === 'pl') assert.match(font.lineOutput, /,/);
    const fontCountLabels = await evaluate(window, `(() => {
      const originalFonts = installedFonts;
      const originalKinds = new Map(fontWidthKinds);
      const originalValues = fontPickers.map(picker => picker.input.value);
      const originalStatus = fontPickers.map(picker => picker.status.textContent);
      try {
        installedFonts = ['Harness Fixed One', 'Harness Fixed Two', 'Harness Variable One', 'Harness Variable Two'];
        fontWidthKinds.clear();
        fontWidthKinds.set('Harness Fixed One', 'Fixed-width');
        fontWidthKinds.set('Harness Fixed Two', 'Fixed-width');
        fontWidthKinds.set('Harness Variable One', 'Variable-width');
        fontWidthKinds.set('Harness Variable Two', 'Variable-width');
        return fontPickers.map(picker => {
          picker.input.value = '';
          updateFontSuggestions(picker, '');
          const name = picker.key === 'mono' ? 'fixedFonts' : 'proportionalFonts';
          const count = getFontSuggestions(picker, '').length;
          return { locale: counterLocale, name, count, label: picker.status.textContent,
            expected: counterText(name, { count }), number: new Intl.NumberFormat(counterLocale).format(count) };
        });
      } finally {
        installedFonts = originalFonts;
        fontWidthKinds.clear();
        for (const [name, kind] of originalKinds) fontWidthKinds.set(name, kind);
        fontPickers.forEach((picker, index) => {
          picker.input.value = originalValues[index];
          picker.status.textContent = originalStatus[index];
        });
        closeFontSuggestions();
      }
    })()`);
    for (const result of fontCountLabels) {
      assert.equal(result.count, 4, `${locale}: deterministic ${result.name} font count`);
      assert.equal(result.label, result.expected, `${locale}: rendered ${result.name} count label`);
      assert.ok(result.label.includes(result.number), `${locale}: ${result.name} count is formatted locally`);
      assert.ok(!result.label.includes('{count}'), `${locale}: ${result.name} count placeholder is replaced`);
      if (locale === 'ar') {
        assert.ok(result.label.includes(`\u2068${result.number}\u2069`), 'Arabic font count is isolated in RTL text');
      }
    }
    await evaluate(window, `(async () => {
      document.querySelector('#settingsButton').click();
      const input = document.querySelector('#fontInput');
      await loadSystemFonts();
      input.focus();
      await Promise.resolve();
      input.value = 'Libertinus';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await waitFor(window, '!document.querySelector("#fontSuggestions").hidden', `${locale} font suggestions`);
    if (locale === 'ar') {
      await waitFor(window, 'document.querySelector("#fontStatus").textContent.includes("Libertinus")', 'Arabic filtered font feedback');
      const status = await evaluate(window, 'document.querySelector("#fontStatus").textContent');
      assert.ok(status.includes('\u2068Libertinus\u2069'), 'Arabic font feedback isolates a Latin query');
      const localizedOne = await evaluate(window, "new Intl.NumberFormat('ar').format(1)");
      assert.ok(status.includes(`\u2068${localizedOne}\u2069`), 'Arabic font feedback isolates the localized count');
    }
    const selection = await evaluate(window, `(() => {
      const input = document.querySelector('#fontInput');
      const option = document.querySelector('#fontSuggestions [role=option]');
      const tabIndex = option.tabIndex;
      const fontNameDirection = option.querySelector('span').dir;
      const fontNameLanguage = option.querySelector('span').getAttribute('lang');
      const alignment = getComputedStyle(option).textAlign;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
      const active = input.getAttribute('aria-activedescendant');
      const expected = document.getElementById(active)?.dataset.font;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      return { tabIndex, fontNameDirection, fontNameLanguage, alignment, active, expected, value: input.value, expanded: input.getAttribute('aria-expanded') };
    })()`);
    assert.equal(selection.tabIndex, -1);
    assert.equal(selection.fontNameDirection, 'auto');
    assert.equal(selection.fontNameLanguage, '', 'font names do not inherit the interface language');
    assert.equal(selection.alignment, 'start', 'font suggestions follow the interface direction');
    assert.ok(selection.active);
    assert.equal(selection.value, selection.expected);
    assert.equal(selection.expanded, 'false');
    const syntheticSelection = await evaluate(window, `(() => {
      const input = document.querySelector('#fontInput');
      input.value = 'Libertinus';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const option = document.querySelector('#fontSuggestions [role=option]');
      const expected = option.dataset.font;
      option.click();
      return { expected, actual: input.value };
    })()`);
    assert.equal(syntheticSelection.actual, syntheticSelection.expected, 'assistive technology click selects the font');
    await evaluate(window, "document.querySelector('#settingsButton').click()");
    const editorLabel = await evaluate(window, `(() => {
      const source = document.querySelector('#markdownSource');
      const label = document.getElementById(source.getAttribute('aria-labelledby'));
      return { elementLanguage: source.lang, labelLanguage: label?.lang, label: label?.textContent,
        documentLanguages: ['#markdownSource', '#editorPreview', '#markdownOutput', '#printDocument']
          .map(selector => document.querySelector(selector).getAttribute('lang')),
        expected: window.markdownVisionReader.interfaceText('Markdown source') };
    })()`);
    assert.equal(editorLabel.elementLanguage, '', 'document text does not inherit the interface language');
    assert.deepEqual(editorLabel.documentLanguages, ['', '', '', ''], `${locale}: document language should be unspecified`);
    assert.equal(editorLabel.labelLanguage, locale);
    assert.equal(editorLabel.label, editorLabel.expected);
    const documentLanguage = await evaluate(window, `(() => {
      window.markdownVisionReader.showDocument('<span lang="fr">Bonjour</span> <span lang="ar" dir="rtl">نص</span> <span dir="auto">Text</span> <span dir="invalid">Text</span> <bdi>نص</bdi> <bdo dir="rtl">text</bdo>', 'language.md');
      const spans = document.querySelectorAll('#markdownOutput span');
      return { language: spans[0]?.getAttribute('lang'), arabicLanguage: spans[1]?.getAttribute('lang'),
        arabicDirection: spans[1]?.getAttribute('dir'), automaticDirection: spans[2]?.getAttribute('dir'),
        invalidDirection: spans[3]?.getAttribute('dir'), isolated: document.querySelector('#markdownOutput bdi')?.textContent,
        override: document.querySelector('#markdownOutput bdo')?.getAttribute('dir') };
    })()`);
    assert.deepEqual(documentLanguage, { language: 'fr', arabicLanguage: 'ar', arabicDirection: 'rtl',
      automaticDirection: 'auto', invalidDirection: null, isolated: 'نص', override: 'rtl' }, `${locale}: document language or direction was not preserved`);
    const documentDirections = await evaluate(window, `(() => {
      window.markdownVisionReader.showDocument('# عنوان عربي\\n\\nEnglish paragraph.\\n\\nفقرة عربية.\\n\\n<div dir="ltr"><p id="explicit-direction">نص عربي</p></div>\\n\\n<ul><li id="mixed-item">نص عربي<p id="nested-english">English text</p></li></ul>\\n\\n| English | عربي | صريح |\\n| --- | --- | ---: |\\n| Text | نص | مثال |\\n\\n\`\`\`\\nconst x = 1;\\n\`\`\`', 'direction.md');
      const root = document.querySelector('#markdownOutput');
      const paragraphs = root.querySelectorAll(':scope > p');
      return { heading: getComputedStyle(root.querySelector('h1')).direction,
        english: getComputedStyle(paragraphs[0]).direction, arabic: getComputedStyle(paragraphs[1]).direction,
        explicit: getComputedStyle(root.querySelector('#explicit-direction')).direction,
        item: getComputedStyle(root.querySelector('#mixed-item')).direction,
        nested: getComputedStyle(root.querySelector('#nested-english')).direction,
        cell: getComputedStyle(root.querySelector('tbody tr').cells[1]).direction,
        cellAlignment: getComputedStyle(root.querySelector('tbody tr').cells[1]).textAlign,
        explicitAlignment: getComputedStyle(root.querySelector('tbody tr').cells[2]).textAlign,
        code: root.querySelector('pre').getAttribute('dir') };
    })()`);
    assert.deepEqual(documentDirections, { heading: 'rtl', english: 'ltr', arabic: 'rtl', explicit: 'ltr', item: 'rtl', nested: 'ltr',
      cell: 'rtl', cellAlignment: 'start', explicitAlignment: 'right', code: null },
      `${locale}: document block direction`);
    const arabicEdit = await evaluate(window, `(() => {
      window.markdownVisionReader.showDocument('فقرة عربية.', 'arabic.md');
      document.querySelector('#editorToggle').click();
      const paragraph = document.querySelector('#editorPreview p');
      const direction = getComputedStyle(paragraph).direction;
      paragraph.textContent = 'فقرة عربية معدلة.';
      paragraph.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      const source = document.querySelector('#markdownSource').value;
      document.querySelector('#editorToggle').click();
      return { direction, source };
    })()`);
    assert.deepEqual(arabicEdit, { direction: 'rtl', source: 'فقرة عربية معدلة.' }, `${locale}: Arabic visual edit`);
    const arabicTableEdit = await evaluate(window, `(() => {
      window.markdownVisionReader.showDocument('| Heading | عنوان |\\n| :--- | ---: |\\n| Text | نص |', 'table.md');
      document.querySelector('#editorToggle').click();
      const cell = document.querySelector('#editorPreview tbody tr td:nth-child(2)');
      const direction = getComputedStyle(cell).direction;
      const alignment = getComputedStyle(cell).textAlign;
      cell.textContent = 'نص معدل';
      cell.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      const source = document.querySelector('#markdownSource').value;
      document.querySelector('#editorToggle').click();
      return { direction, alignment, source };
    })()`);
    assert.equal(arabicTableEdit.direction, 'rtl', `${locale}: Arabic table direction`);
    assert.equal(arabicTableEdit.alignment, 'right', `${locale}: explicit table alignment`);
    assert.equal(arabicTableEdit.source, '| Heading | عنوان |\n| :--- | ---: |\n| Text | نص معدل |',
      `${locale}: table edit changed Markdown alignment`);
    if (locale === 'ar') {
      const directions = await evaluate(window, `(() => {
        const input = document.querySelector('#searchInput');
        const previous = document.querySelector('#previousSearchMatch');
        document.querySelector('#searchButton').click();
        const name = document.querySelector('#fileName');
        name.textContent = 'report.md';
        const latinNameDirection = getComputedStyle(name).direction;
        name.textContent = '\\u0645\\u0644\\u0641.md';
        const arabicNameDirection = getComputedStyle(name).direction;
        const inputLeft = input.getBoundingClientRect().left;
        const previousLeft = previous.getBoundingClientRect().left;
        const openButtonLeft = document.querySelector('#openButton').getBoundingClientRect().left;
        const searchButtonLeft = document.querySelector('#searchButton').getBoundingClientRect().left;
        const searchPanelLeft = document.querySelector('#searchPanel').getBoundingClientRect().left;
        const editorWasHidden = document.querySelector('#editorWorkspace').hidden;
        if (editorWasHidden) document.querySelector('#editorToggle').click();
        const oldView = document.querySelector('#editorPanes').dataset.view;
        document.querySelector('.editor-views [data-view="split"]').click();
        const sourcePane = document.querySelector('#editorSourcePane').getBoundingClientRect();
        const visualPane = document.querySelector('.preview-pane').getBoundingClientRect();
        const sourcePaneLeft = sourcePane.left;
        const visualPaneLeft = visualPane.left;
        document.querySelector('.editor-views [data-view="' + oldView + '"]').click();
        const result = {
          panel: document.querySelector('#searchPanel').dir,
          settings: document.querySelector('#settingsPanel').dir,
          input: input.dir,
          placeholderAlignment: getComputedStyle(input).textAlign,
          inputLeft, previousLeft,
          openButtonLeft, searchButtonLeft, searchPanelLeft,
          documentDirection: getComputedStyle(document.querySelector('#markdownOutput')).direction,
          headerDirection: getComputedStyle(document.querySelector('.editor-header')).direction,
          statusDirection: getComputedStyle(document.querySelector('.editor-status')).direction,
          panesDirection: getComputedStyle(document.querySelector('#editorPanes')).direction,
          sourcePaneLeft, visualPaneLeft,
          headerWidth: document.querySelector('.editor-header').clientWidth,
          headerContentWidth: document.querySelector('.editor-header').scrollWidth,
          saveBounds: document.querySelector('#editorSaveActions').getBoundingClientRect().toJSON(),
          saveHidden: document.querySelector('#editorSaveActions').hidden,
          viewportWidth: innerWidth,
          sourceButtonLeft: document.querySelector('.editor-views [data-view="source"]').getBoundingClientRect().left,
          visualButtonLeft: document.querySelector('.editor-views [data-view="visual"]').getBoundingClientRect().left,
          fileNameDirection: document.querySelector('#fileName').dir,
          latinNameDirection, arabicNameDirection,
        };
        if (editorWasHidden) document.querySelector('#editorToggle').click();
        return result;
      })()`);
      assert.equal(directions.panel, 'rtl');
      assert.equal(directions.settings, 'rtl');
      assert.equal(directions.input, 'auto');
      assert.equal(directions.placeholderAlignment, 'right');
      assert.ok(directions.inputLeft > directions.previousLeft, 'Arabic search controls follow right-to-left order');
      assert.ok(directions.openButtonLeft > directions.searchButtonLeft, 'Arabic toolbar follows right-to-left order');
      assert.ok(directions.searchPanelLeft >= 0 && directions.searchPanelLeft < 2, 'Arabic search panel opens on the left');
      assert.equal(directions.documentDirection, 'ltr', 'Interface direction does not override document content');
      assert.equal(directions.headerDirection, 'rtl', 'Arabic editor controls use right-to-left order');
      assert.ok(directions.sourceButtonLeft > directions.visualButtonLeft, 'Arabic view buttons follow right-to-left order');
      assert.equal(directions.statusDirection, 'rtl', 'Arabic editor status uses right-to-left order');
      assert.equal(directions.panesDirection, 'ltr', 'Arabic controls do not change physical editor pane positions');
      assert.ok(directions.sourcePaneLeft < directions.visualPaneLeft, 'Arabic split view keeps Markdown left and visual right');
      assert.ok(directions.headerContentWidth <= directions.headerWidth + 1, 'Arabic editor header fits the compact window');
      assert.equal(directions.saveHidden, false, 'Arabic save controls are visible while editing');
      assert.ok(directions.saveBounds.left >= 0 && directions.saveBounds.right <= directions.viewportWidth,
        'Arabic save controls remain within the window');
      assert.equal(directions.fileNameDirection, 'auto', 'The document name determines its own direction');
      assert.equal(directions.latinNameDirection, 'ltr', 'Latin document names stay left to right in Arabic');
      assert.equal(directions.arabicNameDirection, 'rtl', 'Arabic document names use right-to-left direction');
      const newDialogDirection = await evaluate(window, `(() => {
        const dialog = document.querySelector('#newFileDialog');
        dialog.showModal();
        const actions = dialog.querySelector('.visual-edit-actions');
        const result = { language: dialog.lang, direction: getComputedStyle(dialog).direction,
          actionDirection: getComputedStyle(actions).direction,
          contentWidth: actions.scrollWidth, width: actions.clientWidth };
        dialog.close();
        return result;
      })()`);
      assert.deepEqual(newDialogDirection, { language: 'ar', direction: 'rtl', actionDirection: 'rtl',
        contentWidth: newDialogDirection.contentWidth, width: newDialogDirection.width },
      'Arabic new-document confirmation follows the interface language and direction');
      assert.ok(newDialogDirection.contentWidth <= newDialogDirection.width + 1,
        'Arabic new-document actions fit the compact dialog');
      await evaluate(window, `(() => {
        window.markdownVisionReader.showDocument('Original draft', 'draft.md');
        if (document.querySelector('#editorWorkspace').hidden) document.querySelector('#editorToggle').click();
        const source = document.querySelector('#markdownSource');
        source.value = 'Keep this draft';
        source.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('#newFileButton').click();
      })()`);
      assert.equal(await evaluate(window, 'document.querySelector("#newFileDialog").open'), true,
        'Arabic new-document confirmation opens for unsaved edits');
      await evaluate(window, `document.querySelector('#newFileDialog button[value="cancel"]').click()`);
      await waitFor(window, `!document.querySelector('#newFileDialog').open`, 'closing Arabic new-document confirmation');
      assert.equal(await evaluate(window, `document.querySelector('#markdownSource').value`), 'Keep this draft');
      assert.equal(await evaluate(window, 'window.markdownVisionReader.hasUnsavedChanges()'), true);
      await evaluate(window, `document.querySelector('#editorToggle').click()`);
    }
    const version = JSON.stringify(installedVersion);
    const result = await evaluate(window, `(() => {
      const reader = window.markdownVisionReader;
      reader.showDocument('[Example](https://example.invalid)\\n', 'locale.md');
      document.querySelector('#editorToggle').click();
      document.querySelector('#editorPreview a').click();
      const dialog = document.querySelector('#visualEditDialog');
      const title = document.querySelector('#visualEditTitle').textContent;
      dialog.querySelector('[name=label]').value = '';
      dialog.querySelector('form').requestSubmit();
      return {
        open: dialog.open,
        lang: dialog.lang,
        dir: dialog.dir,
        title,
        expectedTitle: reader.interfaceText('Edit link'),
        error: document.querySelector('#visualEditError').textContent,
        expectedError: reader.interfaceText('Enter text without a closing bracket.'),
        userInputLanguage: dialog.querySelector('[name=label]').getAttribute('lang'),
        userInputDirection: dialog.querySelector('[name=label]').dir,
        version: document.querySelector('#installedVersion').textContent,
        expectedVersion: reader.interfaceText('Version {version}', { version: ${version} }),
        menu: window.__nativeMenuLabels,
        expectedMenu: reader.interfaceText('File'),
        expectedQuit: reader.interfaceText('Quit'),
      };
    })()`);
    assert.equal(result.open, true, locale);
    assert.equal(result.lang, locale);
    assert.equal(result.dir, locale === 'ar' ? 'rtl' : '');
    assert.equal(result.title, result.expectedTitle);
    assert.notEqual(result.title, 'Edit link');
    assert.equal(result.error, result.expectedError);
    assert.notEqual(result.error, 'Enter text without a closing bracket.');
    assert.equal(result.userInputLanguage, '', `${locale}: document text inherited the interface language`);
    assert.equal(result.userInputDirection, 'auto', `${locale}: document input direction is fixed`);
    assert.equal(result.version, result.expectedVersion);
    assert.equal(result.menu['file-menu'], result.expectedMenu);
    assert.equal(result.menu['app-quit'], result.expectedQuit);
    const nativeError = await evaluate(window, `(() => {
      const reader = window.markdownVisionReader;
      const path = 'C:\\\\Recovery folder\\\\draft {final}.md';
      return {
        localized: reader.localizedNativeError(new Error('The update process failed.')),
        expected: reader.interfaceText('The update process failed.'),
        unknown: reader.localizedNativeError('An unrecognized native error'),
        recovery: reader.localizedNativeError('Windows could not restore the original file during the save. The original is at ' + path),
        expectedRecovery: reader.interfaceText('Windows could not restore the original file during the save. The original is at {path}.', { path }),
        path,
      };
    })()`);
    assert.equal(nativeError.localized, nativeError.expected);
    assert.notEqual(nativeError.localized, 'The update process failed.');
    assert.equal(nativeError.unknown, 'An unrecognized native error');
    assert.equal(nativeError.recovery, nativeError.expectedRecovery);
    assert.ok(nativeError.recovery.includes(nativeError.path), 'recovery path is preserved exactly');
    const fallbackOpen = await evaluate(window, `(async () => {
      const previousReport = window.desktop.reportOpenError;
      const dialog = document.querySelector('#openErrorDialog');
      const readDialog = () => ({ open: dialog.open, lang: dialog.lang, dir: dialog.dir,
        focused: document.activeElement?.id,
        title: document.querySelector('#openErrorTitle').textContent,
        message: document.querySelector('#openErrorMessage').textContent,
        detailLanguage: document.querySelector('#openErrorMessage bdi')?.lang,
        close: document.querySelector('#openErrorClose').textContent });
      try {
        delete window.desktop.reportOpenError;
        await reportDocumentOpenError('Markdown Vision could not read this file.');
        const noReporter = readDialog();
        document.querySelector('#openErrorClose').click();
        const dismissed = !dialog.open;
        window.desktop.reportOpenError = async () => { throw new Error('Dialog unavailable'); };
        await reportDocumentOpenError('Markdown Vision could not read this file.');
        return { noReporter, dismissed, failedReporter: readDialog(), expected: {
          open: true, lang: counterLocale, dir: counterLocale === 'ar' ? 'rtl' : '',
          focused: 'openErrorClose',
          title: window.markdownVisionReader.interfaceText('Could not open document'),
          detailLanguage: counterLocale,
          close: window.markdownVisionReader.interfaceText('Close'),
          message: window.markdownVisionReader.interfaceText(
            'The document could not be opened. Your current changes are still available. {message}',
            { message: window.markdownVisionReader.interfaceText('Markdown Vision could not read this file.') }) } };
      } finally { window.desktop.reportOpenError = previousReport; if (dialog.open) dialog.close(); }
    })()`);
    assert.deepEqual(fallbackOpen.noReporter, fallbackOpen.expected, `${locale}: missing localized fallback open error`);
    assert.equal(fallbackOpen.dismissed, true, `${locale}: close button did not dismiss the error dialog`);
    assert.deepEqual(fallbackOpen.failedReporter, fallbackOpen.expected, `${locale}: failed native dialog did not fall back`);
    if (locale === 'ar') {
      const incompleteRecovery = await evaluate(window, `(async () => {
        const previous = window.desktop.reportOpenError;
        const dialog = document.querySelector('#openErrorDialog');
        try {
          delete window.desktop.reportOpenError;
          await reportDocumentOpenError('Windows could not restore the original file during the save. The original is at ');
          const detail = document.querySelector('#openErrorMessage bdi');
          return { text: detail.textContent, language: detail.getAttribute('lang') };
        } finally { window.desktop.reportOpenError = previous; if (dialog.open) dialog.close(); }
      })()`);
      assert.equal(incompleteRecovery.language, '', 'An incomplete untranslated system detail has no forced language');
      assert.ok(incompleteRecovery.text.startsWith('Windows could not restore'), 'The incomplete detail remains available');
    }
    await evaluate(window, 'document.querySelector("#visualEditDialog").close(); document.querySelector(".about-menu").open = true');
    await waitFor(window, '!document.querySelector("#retryUpdateCheck").hidden', `${locale} offline update status`);
    const updateError = await evaluate(window, 'document.querySelector("#latestVersion").textContent');
    assert.doesNotMatch(updateError, /Unable to check for updates/);
    const updateErrors = await evaluate(window, `(async () => {
      const previousFetch = window.fetch;
      const previousInstall = window.desktop.installUpdate;
      const previousPlatform = window.desktop.getPlatformInfo;
      const previousArchitecture = window.desktop.updateArchitecture;
      try {
        delete window.desktop.installUpdate;
        window.fetch = async () => ({ ok: true, json: async () => [] });
        window.desktop.getPlatformInfo = async () => ({ platform: 'linux', architecture: 'unknown' });
        await checkForUpdates();
        const results = [document.querySelector('#latestVersion').textContent];
        window.desktop.getPlatformInfo = async () => ({ platform: 'unknown' });
        await checkForUpdates();
        results.push(document.querySelector('#latestVersion').textContent);
        window.desktop.installUpdate = async () => {};
        window.desktop.updateArchitecture = async () => 'x64';
        window.fetch = async () => ({ ok: true, json: async () => ({ tag_name: 'v999.0.0', assets: [] }) });
        await checkForUpdates();
        results.push(document.querySelector('#latestVersion').textContent);
        return { actual: results, expected: ['Unsupported architecture', 'Unsupported platform',
          'Installer verification is unavailable'].map(text => window.markdownVisionReader.interfaceText(text)) };
      } finally {
        window.fetch = previousFetch;
        window.desktop.installUpdate = previousInstall;
        window.desktop.getPlatformInfo = previousPlatform;
        window.desktop.updateArchitecture = previousArchitecture;
      }
    })()`);
    assert.deepEqual(updateErrors.actual, updateErrors.expected, `${locale}: specific update errors`);
    assert.notEqual(updateErrors.actual[0], 'Unsupported architecture', `${locale}: untranslated architecture error`);
    assert.notEqual(updateErrors.actual[1], 'Unsupported platform', `${locale}: untranslated platform error`);
    assert.notEqual(updateErrors.actual[2], 'Installer verification is unavailable', `${locale}: untranslated verification error`);
  }
  window.setContentSize(320, 500);
  const locales = ['ar', 'zh-hans', 'zh-hant', 'cs', 'nl', 'fr', 'de', 'hi', 'id', 'it', 'ja',
    'ko', 'pl', 'pt-br', 'ru', 'es', 'sv', 'th', 'tr', 'uk', 'vi'];
  for (const locale of locales) {
    await window.loadFile(indexFile, { query: { previewLocale: locale } });
    if (localeScreenshotDirectory) {
      window.setContentSize(480, 700);
      await waitFor(window, 'innerWidth === 480', `${locale}: screenshot viewport`);
      await evaluate(window, `document.querySelector('#settingsButton').click()`);
      await waitFor(window, '!document.querySelector("#settingsPanel").hidden', `${locale}: screenshot settings`);
      const screenshot = await window.capturePage();
      fs.writeFileSync(path.join(localeScreenshotDirectory, `${locale}-settings.png`), screenshot.toPNG());
      await evaluate(window, `document.querySelector('#closeSettings').click()`);
      await waitFor(window, 'document.querySelector("#settingsPanel").hidden', `${locale}: close screenshot settings`);
      await evaluate(window, `(() => {
        window.markdownVisionReader.showDocument('# Search preview\\n\\nLocalized search controls.', 'search-preview.md');
        document.querySelector('#searchButton').click();
      })()`);
      await waitFor(window, `!document.querySelector('#searchPanel').hidden &&
        document.querySelector('#searchInput').value === ''`, `${locale}: screenshot search`);
      await wait(180);
      const searchScreenshot = await window.capturePage();
      fs.writeFileSync(path.join(localeScreenshotDirectory, `${locale}-search.png`), searchScreenshot.toPNG());
      await evaluate(window, `document.querySelector('#closeSearch').click()`);
      window.setContentSize(1000, 750);
      await waitFor(window, 'innerWidth === 1000', `${locale}: editor screenshot viewport`);
      await evaluate(window, `document.querySelector('#editorToggle').click()`);
      await waitFor(window, '!document.querySelector("#editorWorkspace").hidden', `${locale}: screenshot editor`);
      await wait(180);
      const editorScreenshot = await window.capturePage();
      fs.writeFileSync(path.join(localeScreenshotDirectory, `${locale}-editor.png`), editorScreenshot.toPNG());
      await evaluate(window, `document.querySelector('.about-menu').open = true`);
      await waitFor(window, 'document.querySelector(".about-menu").open', `${locale}: screenshot About`);
      await wait(180);
      const aboutScreenshot = await window.capturePage();
      fs.writeFileSync(path.join(localeScreenshotDirectory, `${locale}-about.png`), aboutScreenshot.toPNG());
      await evaluate(window, `document.querySelector('.about-menu').open = false; document.querySelector('#newFileDialog').showModal()`);
      await waitFor(window, 'document.querySelector("#newFileDialog").open', `${locale}: screenshot new-file dialog`);
      await wait(120);
      const newFileScreenshot = await window.capturePage();
      fs.writeFileSync(path.join(localeScreenshotDirectory, `${locale}-new-file.png`), newFileScreenshot.toPNG());
      await evaluate(window, `document.querySelector('#newFileDialog').close()`);
      await evaluate(window, `document.querySelector('#editorToggle').click()`);
      await waitFor(window, 'document.querySelector("#editorWorkspace").hidden', `${locale}: close screenshot editor`);
      await evaluate(window, `(() => {
        const locale = ${JSON.stringify(locale)};
        const language = new Intl.DisplayNames([locale], { type: "language" }).of(locale);
        const content = ['# ' + language, '', language + ' 0123456789', '', '~~~text', language, '~~~']
          .join(String.fromCharCode(10));
        window.markdownVisionReader.showDocument(content, locale + '-glyph-review.md');
      })()`);
      await waitFor(window, '!document.querySelector("#readerShell").hidden', `${locale}: glyph fallback reader`);
      await wait(180);
      const glyphReaderScreenshot = await window.capturePage();
      fs.writeFileSync(path.join(localeScreenshotDirectory, `${locale}-glyph-reader.png`), glyphReaderScreenshot.toPNG());
      await evaluate(window, `document.querySelector('#editorToggle').click()`);
      await waitFor(window, '!document.querySelector("#editorWorkspace").hidden', `${locale}: glyph fallback editor`);
      await wait(180);
      const glyphEditorScreenshot = await window.capturePage();
      fs.writeFileSync(path.join(localeScreenshotDirectory, `${locale}-glyph-editor.png`), glyphEditorScreenshot.toPNG());
      await evaluate(window, `document.querySelector('#editorToggle').click()`);
      await waitFor(window, 'document.querySelector("#editorWorkspace").hidden', `${locale}: close glyph editor`);
      await evaluate(window, `(() => {
        window.markdownVisionReader.showDocument('[Localized link](https://example.invalid)', 'dialog-preview.md');
        document.querySelector('#editorToggle').click();
      })()`);
      await waitFor(window, '!document.querySelector("#editorWorkspace").hidden', `${locale}: visual-dialog editor`);
      await evaluate(window, `document.querySelector('#editorPreview a').click()`);
      await waitFor(window, 'document.querySelector("#visualEditDialog").open', `${locale}: visual link dialog`);
      await wait(180);
      const visualDialogScreenshot = await window.capturePage();
      fs.writeFileSync(path.join(localeScreenshotDirectory, `${locale}-visual-edit-dialog.png`), visualDialogScreenshot.toPNG());
      await evaluate(window, `document.querySelector('#visualEditDialog').close(); document.querySelector('#editorToggle').click()`);
      await waitFor(window, 'document.querySelector("#editorWorkspace").hidden', `${locale}: close visual-dialog editor`);
      window.setContentSize(320, 500);
      await waitFor(window, 'innerWidth === 320', `${locale}: restore narrow viewport`);
    }
    if (locale === 'tr') {
      const turkishSearch = await evaluate(window, `(() => {
        const reader = window.markdownVisionReader;
        const text = 'I ı İ i I\\u0307';
        reader.showDocument(text, 'turkish.md');
        document.querySelector('#searchButton').click();
        const input = document.querySelector('#searchInput');
        const find = query => {
          input.value = query;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          return [...document.querySelectorAll('#markdownOutput mark.search-highlight')].map(mark => mark.textContent);
        };
        const dotted = find('i');
        const dotless = find('ı');
        document.querySelector('#closeSearch').click();
        document.querySelector('#editorToggle').click();
        document.querySelector('.editor-views [data-view="source"]').click();
        const editorDotted = window.markdownVisionEditorSearch.find('i', false).count;
        const editorDotless = window.markdownVisionEditorSearch.find('ı', false).count;
        document.querySelector('.editor-views [data-view="visual"]').click();
        document.querySelector('#editorToggle').click();
        return { dotted, dotless, editorDotted, editorDotless };
      })()`);
      assert.deepEqual(turkishSearch, { dotted: ['İ', 'i', 'I\u0307'], dotless: ['I', 'ı'], editorDotted: 3, editorDotless: 2 },
        'Turkish dotted and dotless I match according to the selected interface language');
    }
    const readError = await evaluate(window, `window.markdownVisionReader.localizedNativeError('Markdown Vision could not read this file.')`);
    assert.notEqual(readError, 'Markdown Vision could not read this file.', `${locale}: document read error was not translated`);
    const managedMethodError = await evaluate(window, `(() => {
      const error = 'Unknown native method: test.operation';
      return { known: isKnownNativeError(error),
        actual: localizedNativeError(error),
        expected: window.markdownVisionReader.interfaceText('Unknown native method: {method}', { method: 'test.operation' }) };
    })()`);
    assert.equal(managedMethodError.known, true, `${locale}: managed Windows bridge error is recognized`);
    assert.equal(managedMethodError.actual, managedMethodError.expected,
      `${locale}: managed Windows bridge error and method name are localized`);
    const errorLayout = await evaluate(window, `(async () => {
      const previousReport = window.desktop.reportOpenError;
      const dialog = document.querySelector('#openErrorDialog');
      try {
        delete window.desktop.reportOpenError;
        await reportDocumentOpenError('C:\\\\' + 'longfilename'.repeat(30) + '.md');
        const close = document.querySelector('#openErrorClose');
        close.focus();
        const box = dialog.getBoundingClientRect();
        const closeBox = close.getBoundingClientRect();
        return { left: box.left, right: box.right, width: innerWidth,
          scroll: dialog.scrollWidth, client: dialog.clientWidth,
          closeTop: closeBox.top, closeBottom: closeBox.bottom, viewportHeight: innerHeight,
          detailLanguage: document.querySelector('#openErrorMessage bdi')?.getAttribute('lang') };
      } finally { window.desktop.reportOpenError = previousReport; if (dialog.open) dialog.close(); }
    })()`);
    assert.ok(errorLayout.left >= 0 && errorLayout.right <= errorLayout.width, `${locale}: open error dialog exceeds viewport`);
    assert.ok(errorLayout.scroll <= errorLayout.client + 1, `${locale}: open error text overflows`);
    assert.ok(errorLayout.closeTop >= 0 && errorLayout.closeBottom <= errorLayout.viewportHeight,
      `${locale}: focused close button is outside the viewport`);
    assert.equal(errorLayout.detailLanguage, '', `${locale}: system open error inherited the interface language`);
    const displayedCounts = await evaluate(window, `[0, 1, 2, 5, 21].map(count => ({
      number: new Intl.NumberFormat(counterLocale).format(count),
      search: counterText('search', { count }), words: counterText('words', { count })
    }))`);
    for (const count of displayedCounts) {
      for (const text of [count.search, count.words]) {
        assert.ok(text.includes(count.number), `${locale}: count is not formatted for the locale`);
        assert.doesNotMatch(text, /\{count\}/, `${locale}: count placeholder was not replaced`);
      }
    }
    const footnote = await evaluate(window, `(() => {
      window.markdownVisionReader.showDocument('Text[^1] and again[^1].\\n\\n[^1]: Note', 'footnote.md');
      const backs = [...document.querySelectorAll('#markdownOutput .footnote-backref')];
      return { links: backs.map(back => ({ label: back.getAttribute('aria-label'), lang: back.getAttribute('lang'),
        href: back.getAttribute('href'), target: !!document.getElementById(back.getAttribute('href').slice(1)) })),
        expected: window.markdownVisionReader.interfaceText('Back to footnote reference') };
    })()`);
    assert.equal(footnote.links.length, 2, `${locale}: footnote return links`);
    assert.equal(new Set(footnote.links.map(link => link.href)).size, 2, `${locale}: distinct footnote destinations`);
    for (const link of footnote.links) {
      assert.equal(link.label, footnote.expected, `${locale}: footnote return label`);
      assert.notEqual(link.label, 'Back to footnote reference', `${locale}: untranslated footnote return label`);
      assert.equal(link.lang, locale, `${locale}: footnote label language`);
      assert.match(link.href, /^#fnref/);
      assert.ok(link.target, `${locale}: footnote destination is missing`);
    }
    const footnoteEditor = await evaluate(window, `(() => {
      document.querySelector('#editorToggle').click();
      const button = document.querySelector('#editorPreview [data-visual-edit="footnote-text"]');
      const label = button?.textContent;
      button?.click();
      const dialog = document.querySelector('#visualEditDialog');
      const result = { label, expectedLabel: window.markdownVisionReader.interfaceText('Edit note'),
        open: dialog.open, title: document.querySelector('#visualEditTitle').textContent,
        expectedTitle: window.markdownVisionReader.interfaceText('Edit footnote'),
        field: dialog.querySelector('[name="text"]')?.parentElement.textContent,
        dialogLanguage: dialog.lang, dialogDirection: getComputedStyle(dialog).direction,
        inputLanguage: dialog.querySelector('[name="text"]')?.getAttribute('lang'),
        inputDirection: dialog.querySelector('[name="text"]')?.getAttribute('dir'),
        expectedField: window.markdownVisionReader.interfaceText('Note text') };
      if (dialog.open) {
        dialog.querySelector('[name="text"]').value = '';
        dialog.querySelector('form').requestSubmit();
        result.error = document.querySelector('#visualEditError').textContent;
        result.expectedError = window.markdownVisionReader.interfaceText('Enter the note text on one line.');
        result.dialogWidth = dialog.clientWidth;
        result.dialogContent = dialog.scrollWidth;
      }
      if (dialog.open) dialog.close();
      document.querySelector('#editorToggle').click();
      return result;
    })()`);
    assert.equal(footnoteEditor.open, true, `${locale}: footnote editor did not open`);
    assert.equal(footnoteEditor.label, footnoteEditor.expectedLabel, `${locale}: footnote edit control`);
    assert.equal(footnoteEditor.title, footnoteEditor.expectedTitle, `${locale}: footnote editor title`);
    assert.equal(footnoteEditor.field, footnoteEditor.expectedField, `${locale}: footnote editor field`);
    assert.equal(footnoteEditor.dialogLanguage, locale, `${locale}: footnote dialog language`);
    assert.equal(footnoteEditor.dialogDirection, locale === 'ar' ? 'rtl' : 'ltr', `${locale}: footnote dialog direction`);
    assert.equal(footnoteEditor.inputLanguage, '', `${locale}: document text inherited the interface language`);
    assert.equal(footnoteEditor.inputDirection, 'auto', `${locale}: document text direction is not automatic`);
    assert.equal(footnoteEditor.error, footnoteEditor.expectedError, `${locale}: footnote validation message`);
    assert.ok(footnoteEditor.dialogContent <= footnoteEditor.dialogWidth + 1,
      `${locale}: translated validation message overflows the dialog`);
    const editorOperations = await evaluate(window, `(() => { try {
      const reader = window.markdownVisionReader;
      const original = '- [ ] \\n- [ ] Second item\\n';
      reader.showDocument(original, 'operations.md');
      document.querySelector('#editorToggle').click();
      const listItem = document.querySelector('#editorPreview [data-visual-edit="list-item"]');
      const listOptions = document.querySelector('#editorPreview [data-visual-edit="list-structure"]');
      const actionLabels = [
        { actual: listItem.textContent, language: listItem.lang, expected: reader.interfaceText('Edit item') },
        { actual: listOptions.textContent, language: listOptions.lang, expected: reader.interfaceText('List options') },
      ];
      listItem.click();
      const dialog = document.querySelector('#visualEditDialog');
      const update = dialog.querySelector('select[name="operation"] option[value="save"]').textContent;
      const bounds = dialog.getBoundingClientRect();
      const updateSelect = dialog.querySelector('select[name="operation"]');
      const selectBounds = updateSelect.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = getComputedStyle(updateSelect).font;
      const layout = { left: bounds.left, right: bounds.right, width: innerWidth,
        scroll: dialog.scrollWidth, client: dialog.clientWidth,
        selectLeft: selectBounds.left, selectRight: selectBounds.right,
        textWidth: context.measureText(update).width, availableTextWidth: selectBounds.width - 35 };
      dialog.querySelector('[name="text"]').value = 'Updated task';
      dialog.querySelector('form').requestSubmit();
      const updated = document.querySelector('#markdownSource').value;
      document.querySelector('#editorPreview [data-visual-edit="list-structure"][data-index="1"]').click();
      const keep = dialog.querySelector('select[name="operation"] option[value="save"]').textContent;
      layout.keepTextWidth = context.measureText(keep).width;
      const structureSelect = dialog.querySelector('select[name="operation"]');
      const fullSelection = dialog.querySelector('.visual-edit-full-selection');
      layout.operationTextWidths = [...structureSelect.options].map(option => {
        structureSelect.value = option.value;
        structureSelect.dispatchEvent(new Event('change', { bubbles: true }));
        return { text: option.textContent, width: context.measureText(option.textContent).width,
          fullText: fullSelection.textContent, visible: !fullSelection.hidden,
          fullWidth: fullSelection.clientWidth, fullScrollWidth: fullSelection.scrollWidth,
          hiddenFromAccessibility: fullSelection.getAttribute('aria-hidden') };
      });
      structureSelect.value = 'save';
      structureSelect.dispatchEvent(new Event('change', { bubbles: true }));
      dialog.querySelector('form').requestSubmit();
      const unchanged = document.querySelector('#markdownSource').value;
      document.querySelector('#editorToggle').click();
      return { update, keep, updated, unchanged, original, layout, actionLabels,
        expectedUpdate: reader.interfaceText('Update text'), expectedKeep: reader.interfaceText('Keep unchanged') };
      } catch (error) { return { error: String(error.stack || error) }; }
    })()`);
    assert.ok(!editorOperations.error, `${locale}: ${editorOperations.error}`);
    for (const label of editorOperations.actionLabels) {
      assert.equal(label.actual, label.expected, `${locale}: list action label`);
      assert.equal(label.language, locale, `${locale}: list action language`);
    }
    assert.equal(editorOperations.update, editorOperations.expectedUpdate, `${locale}: update text operation`);
    assert.equal(editorOperations.keep, editorOperations.expectedKeep, `${locale}: keep unchanged operation`);
    if (repairedLabels[locale]) {
      assert.equal(editorOperations.update, repairedLabels[locale][1], `${locale}: corrupted update label`);
      assert.equal(editorOperations.keep, repairedLabels[locale][2], `${locale}: corrupted keep label`);
    }
    assert.equal(editorOperations.updated, editorOperations.original.replace('- [ ] ', '- [ ] Updated task'),
      `${locale}: update text did not apply the edit`);
    assert.equal(editorOperations.unchanged, editorOperations.updated, `${locale}: keep unchanged modified the document`);
    assert.ok(editorOperations.layout.left >= 0 && editorOperations.layout.right <= editorOperations.layout.width &&
      editorOperations.layout.scroll <= editorOperations.layout.client + 1 &&
      editorOperations.layout.selectLeft >= editorOperations.layout.left &&
      editorOperations.layout.selectRight <= editorOperations.layout.right, `${locale}: editor operation dialog overflows`);
    assert.ok(editorOperations.layout.textWidth <= editorOperations.layout.availableTextWidth,
      `${locale}: update operation text does not fit in the selector`);
    assert.ok(editorOperations.layout.keepTextWidth <= editorOperations.layout.availableTextWidth,
      `${locale}: keep operation text does not fit in the selector`);
    for (const option of editorOperations.layout.operationTextWidths) {
      if (option.width > editorOperations.layout.availableTextWidth) {
        assert.equal(option.visible, true, `${locale}: truncated list operation has no full label`);
        assert.equal(option.fullText, option.text, `${locale}: full list operation label differs`);
        assert.ok(option.fullScrollWidth <= option.fullWidth + 1, `${locale}: expanded list operation overflows`);
        assert.equal(option.hiddenFromAccessibility, 'true', `${locale}: duplicated list operation is announced twice`);
      }
    }
    if (locale === 'cs') {
      const resizeState = await evaluate(window, `(async () => {
        const reader = window.markdownVisionReader;
        reader.showDocument('- [ ] First\\n- [ ] Second\\n', 'resize.md');
        document.querySelector('#editorToggle').click();
        document.querySelector('#editorPreview [data-visual-edit="list-structure"][data-index="1"]').click();
        const dialog = document.querySelector('#visualEditDialog');
        const select = dialog.querySelector('select[name="operation"]');
        const full = dialog.querySelector('.visual-edit-full-selection');
        select.value = 'indent';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        select.style.width = '80px';
        await frame();
        const narrow = { visible: !full.hidden, text: full.textContent };
        select.style.width = '600px';
        await frame();
        const wide = { visible: !full.hidden };
        select.style.width = '80px';
        await frame();
        const narrowAgain = { visible: !full.hidden, text: full.textContent };
        dialog.close();
        document.querySelector('#editorToggle').click();
        return { narrow, wide, narrowAgain, expected: reader.interfaceText('Indent under previous item') };
      })()`);
      assert.deepEqual(resizeState.narrow, { visible: true, text: resizeState.expected }, 'long list action at narrow width');
      assert.equal(resizeState.wide.visible, false, 'full list action is hidden when the selector is wide enough');
      assert.deepEqual(resizeState.narrowAgain, { visible: true, text: resizeState.expected }, 'long list action after narrowing');
      const fallbackResize = await evaluate(window, `(() => {
        const original = window.ResizeObserver;
        window.ResizeObserver = undefined;
        try {
          window.markdownVisionReader.showDocument('- [ ] First\\n- [ ] Second\\n', 'fallback-resize.md');
          document.querySelector('#editorToggle').click();
          document.querySelector('#editorPreview [data-visual-edit="list-structure"][data-index="1"]').click();
          const dialog = document.querySelector('#visualEditDialog');
          const select = dialog.querySelector('select[name="operation"]');
          const full = dialog.querySelector('.visual-edit-full-selection');
          select.value = 'indent';
          select.style.width = '80px';
          window.dispatchEvent(new Event('resize'));
          const narrow = !full.hidden;
          select.style.width = '600px';
          window.dispatchEvent(new Event('resize'));
          const wide = !full.hidden;
          dialog.close();
          document.querySelector('#editorToggle').click();
          return { narrow, wide };
        } finally { window.ResizeObserver = original; }
      })()`);
      assert.deepEqual(fallbackResize, { narrow: true, wide: false }, 'list action resize fallback');
    }
    const tableActions = await evaluate(window, `(() => {
      const reader = window.markdownVisionReader;
      reader.showDocument('| Header |\\n| --- |\\n| Value |\\n', 'table.md');
      document.querySelector('#editorToggle').click();
      const button = document.querySelector('#editorPreview [data-visual-edit="table-options"]');
      const label = button.textContent;
      const language = button.lang;
      button.click();
      const dialog = document.querySelector('#visualEditDialog');
      const options = ['add-row', 'add-column'].map(value => dialog.querySelector('option[value="' + value + '"]').textContent);
      const select = dialog.querySelector('select[name="operation"]');
      const context = document.createElement('canvas').getContext('2d');
      context.font = getComputedStyle(select).font;
      const optionWidths = options.map(text => context.measureText(text).width);
      const availableWidth = select.getBoundingClientRect().width - 35;
      dialog.close();
      document.querySelector('#editorToggle').click();
      return { label, language, options, optionWidths, availableWidth, expectedLabel: reader.interfaceText('Table options'),
        expectedOptions: ['Add row below', 'Add column after'].map(text => reader.interfaceText(text)) };
    })()`);
    assert.equal(tableActions.label, tableActions.expectedLabel, `${locale}: table action label`);
    assert.equal(tableActions.language, locale, `${locale}: table action language`);
    assert.deepEqual(tableActions.options, tableActions.expectedOptions, `${locale}: table operation labels`);
    assert.ok(tableActions.optionWidths.every(width => width <= tableActions.availableWidth),
      `${locale}: a table operation label does not fit in the selector`);
    await evaluate(window, `(() => {
      window.__copyClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
      window.__copyExecCommand = document.execCommand;
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__localizedCopied = value; } } });
      window.markdownVisionReader.showDocument('\`\`\`\\ncode\\n\`\`\`', 'copy.md');
      document.querySelector('#markdownOutput .code-copy-button').click();
    })()`);
    await waitFor(window, `document.querySelector('#codeCopyStatus')?.textContent === window.markdownVisionReader.interfaceText('Code copied')`,
      `${locale}: translated copy success`);
    const copyLabel = await evaluate(window, `({ label: document.querySelector('#markdownOutput .code-copy-button').getAttribute('aria-label'),
      expected: window.markdownVisionReader.interfaceText('Copy code'), copied: window.__localizedCopied,
      statusLanguage: document.querySelector('#codeCopyStatus').lang, statusDirection: document.querySelector('#codeCopyStatus').dir })`);
    assert.equal(copyLabel.label, copyLabel.expected, `${locale}: copy button label`);
    assert.equal(copyLabel.copied, 'code', `${locale}: copying changed code text`);
    assert.equal(copyLabel.statusLanguage, locale, `${locale}: copy feedback language`);
    assert.equal(copyLabel.statusDirection, locale === 'ar' ? 'rtl' : '', `${locale}: copy feedback direction`);
    await evaluate(window, `(() => {
      navigator.clipboard.writeText = async () => { throw new Error('fixture'); };
      document.execCommand = () => false;
      document.querySelector('#markdownOutput .code-copy-button').click();
    })()`);
    await waitFor(window, `document.querySelector('#codeCopyStatus')?.textContent === window.markdownVisionReader.interfaceText('Could not copy code')`,
      `${locale}: translated copy failure`);
    const copyStatusLayout = await evaluate(window, `(() => {
      const status = document.querySelector('#codeCopyStatus');
      const bounds = status.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, viewport: innerWidth,
        contentWidth: status.scrollWidth, width: status.clientWidth };
    })()`);
    assert.ok(copyStatusLayout.left >= 0 && copyStatusLayout.right <= copyStatusLayout.viewport &&
      copyStatusLayout.contentWidth <= copyStatusLayout.width, `${locale}: copy feedback overflows the window`);
    await evaluate(window, `(() => {
      if (window.__copyClipboardDescriptor) Object.defineProperty(navigator, 'clipboard', window.__copyClipboardDescriptor);
      else delete navigator.clipboard;
      document.execCommand = window.__copyExecCommand;
    })()`);
    const recoveryPaths = await evaluate(window, `(() => {
      const prefix = 'Windows could not restore the original file during the save. The original is at ';
      return ['C:\\\\Users\\\\Mark\\\\draft {version} Alt+Enter.md', 'C:\\\\ملفات\\\\draft ١.md', 'C:\\\\100%\\\\file.md']
        .map(path => ({ path, message: window.markdownVisionReader.localizedNativeError(prefix + path) }));
    })()`);
    for (const item of recoveryPaths) {
      assert.ok(item.message.includes(item.path), `${locale}: recovery path changed`);
      if (locale === 'ar') assert.ok(item.message.includes(`\u2068${item.path}\u2069`), 'Arabic recovery path is not isolated');
    }
    const menuLabels = await evaluate(window, `(() => {
      const sources = { 'file-menu': 'File', 'file-new': 'New', 'file-open': 'Open…',
        'file-save': 'Save', 'file-save-as': 'Save As…', 'file-print': 'Print…',
        'file-close': 'Close', 'app-menu': 'Markdown Vision', 'help-menu': 'Help',
        'app-about': 'About Markdown Vision', 'app-quit': 'Quit' };
      return { actual: window.__nativeMenuLabels,
        expected: Object.fromEntries(Object.entries(sources).map(([id, text]) => [id, window.markdownVisionReader.interfaceText(text)])) };
    })()`);
    assert.deepEqual(menuLabels.actual, menuLabels.expected, `${locale}: native menu labels`);
    const insertedLink = await evaluate(window, `(() => {
      let promptText = '';
      window.prompt = text => { promptText = text; return 'https://example.invalid'; };
      window.markdownVisionReader.showDocument('', 'link.md');
      document.querySelector('#editorToggle').click();
      document.querySelector('.editor-views [data-view="source"]').click();
      const source = document.querySelector('#markdownSource');
      source.focus();
      source.setSelectionRange(0, 0);
      document.querySelector('#editorTools [data-command="link"]').click();
      return { value: source.value, selected: source.value.slice(source.selectionStart, source.selectionEnd), promptText,
        expectedPrompt: window.markdownVisionReader.interfaceText('Link URL'),
        expected: window.markdownVisionReader.interfaceText('link text') };
    })()`);
    assert.equal(insertedLink.value, `[${insertedLink.expected}](https://example.invalid)`, `${locale}: inserted link`);
    assert.equal(insertedLink.selected, insertedLink.expected, `${locale}: inserted link text selection`);
    assert.equal(insertedLink.promptText, insertedLink.expectedPrompt, `${locale}: link prompt language`);
    await window.loadFile(indexFile, { query: { previewLocale: locale } });
    const localizedControls = await evaluate(window, `({
      search: document.querySelector('#searchInput').placeholder,
      searchLabel: document.querySelector('#searchInput').getAttribute('aria-label'),
      settings: document.querySelector('#settingsPanel .settings-heading strong').textContent,
      open: document.querySelector('#openButton').getAttribute('aria-label'),
      editorStatusLanguage: document.querySelector('.editor-status').lang,
      saveStatusLanguage: document.querySelector('#editorDirty').lang,
      documentLanguage: document.querySelector('#editorPreview').getAttribute('lang'),
      selectedLocale: counterLocale,
      expectedSearch: previewMessages[${JSON.stringify(locale)}].searchText,
      expectedZero: counterText('search', { count: 0 }),
    })`);
    assert.equal(localizedControls.selectedLocale, locale, `${locale}: selected interface language`);
    assert.equal(localizedControls.editorStatusLanguage, locale, `${locale}: editor status language`);
    assert.equal(localizedControls.saveStatusLanguage, locale, `${locale}: save status language`);
    assert.equal(localizedControls.documentLanguage, '', `${locale}: document language must not be forced`);
    assert.equal(localizedControls.search, localizedControls.expectedSearch, `${locale}: search placeholder language`);
    const documentNames = await evaluate(window, `(() => {
      const reader = window.markdownVisionReader;
      reader.showDocument('');
      const suggested = reader.getDocument().name;
      const title = document.title;
      document.querySelector('#editorToggle').click();
      document.querySelector('#newFileButton').click();
      const newFile = reader.getDocument().name;
      document.querySelector('#editorToggle').click();
      reader.showDocument('existing', 'Untitled.md', 'existing-document');
      return { suggested, title, newFile, existing: reader.getDocument().name, expected: reader.interfaceText('Untitled.md') };
    })()`);
    assert.equal(documentNames.suggested, documentNames.expected, `${locale}: new document name`);
    assert.equal(documentNames.title, documentNames.expected, `${locale}: new document window title`);
    assert.equal(documentNames.newFile, documentNames.expected, `${locale}: new file action name`);
    assert.equal(documentNames.existing, 'Untitled.md', `${locale}: existing document name changed`);
    assert.ok(documentNames.suggested.endsWith('.md'), `${locale}: suggested filename has no Markdown extension`);
    const untranslatedAttributes = await evaluate(window, `Array.from(document.querySelectorAll('[title], [aria-label], [aria-description], [placeholder]'))
      .flatMap(element => ['title', 'aria-label', 'aria-description', 'placeholder']
        .filter(attribute => element.hasAttribute(attribute) && element.getAttribute(attribute)
          && interfaceText(element.getAttribute(attribute)) !== element.getAttribute(attribute))
        .map(attribute => [element.id || element.tagName, attribute, element.getAttribute(attribute)]))`);
    assert.deepEqual(untranslatedAttributes, [], `${locale}: interface attributes contain known untranslated text`);
    const untranslatedText = await evaluate(window, `Array.from(document.querySelectorAll(
      '.topbar *, .editor-header *, #newFileDialog *, #visualEditDialog *'))
      .filter(element => !element.children.length && element.textContent.trim()
        && interfaceText(element.textContent.trim()) !== element.textContent.trim())
      .map(element => [element.id || element.tagName, element.textContent.trim()])`);
    assert.deepEqual(untranslatedText, [], `${locale}: interface contains known untranslated text`);
    assert.notEqual(localizedControls.search, 'Search text', `${locale}: search placeholder is English`);
    assert.equal(localizedControls.searchLabel, localizedControls.search, `${locale}: search accessible name differs`);
    assert.notEqual(localizedControls.settings, 'Settings', `${locale}: settings heading is English`);
    assert.notEqual(localizedControls.open, 'Open Markdown file', `${locale}: open accessible name is English`);
    const staticLabels = await evaluate(window, `(() => {
      const labels = {
        '#newFileButton': 'New Markdown file', '#openButton': 'Open Markdown file',
        '#printButton': 'Print document', '.about-menu summary': 'About Markdown Vision',
        '#editorWorkspace': 'Markdown editor', '.editor-views': 'Editor view',
        '#editorSourcePane': 'Markdown source', '#editorPreview': 'Visual editor',
        '#visualRestriction': 'Visual editing restriction'
      };
      return Object.entries(labels).map(([selector, source]) => ({ selector,
        actual: document.querySelector(selector).getAttribute('aria-label'),
        expected: window.markdownVisionReader.interfaceText(source) }));
    })()`);
    for (const label of staticLabels) {
      assert.equal(label.actual, label.expected, `${locale}: ${label.selector} accessible label`);
    }
    const dynamicLabels = await evaluate(window, `(() => {
      const reader = window.markdownVisionReader;
      reader.showDocument('test', 'labels.md');
      const editor = document.querySelector('#editorToggle');
      editor.click();
      const editing = editor.getAttribute('aria-label');
      const divider = document.querySelector('#editorDivider');
      document.querySelector('.editor-views [data-view="split"]').click();
      const horizontal = { label: divider.getAttribute('aria-label'), text: divider.getAttribute('aria-valuetext'),
        value: Number(divider.getAttribute('aria-valuenow')) };
      document.querySelector('.editor-views [data-view="split-vertical"]').click();
      const vertical = { label: divider.getAttribute('aria-label'), text: divider.getAttribute('aria-valuetext'),
        value: Number(divider.getAttribute('aria-valuenow')) };
      editor.click();
      const reading = editor.getAttribute('aria-label');
      const theme = document.querySelector('#themeButton');
      const originalTheme = document.documentElement.dataset.theme;
      theme.click();
      const changedTheme = document.documentElement.dataset.theme;
      const themeLabel = theme.getAttribute('aria-label');
      theme.click();
      return { editing, reading, themeLabel, originalTheme, changedTheme, horizontal, vertical,
        expectedEditing: reader.interfaceText('Return to reader'), expectedReading: reader.interfaceText('Edit Markdown'),
        expectedTheme: reader.interfaceText(changedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'),
        expectedHorizontal: { label: reader.interfaceText('Markdown pane width'),
          text: reader.interfaceText('{percent}% Markdown', { percent: horizontal.value }) },
        expectedVertical: { label: reader.interfaceText('Visual pane height'),
          text: reader.interfaceText('{percent}% Visual', { percent: vertical.value }) } };
    })()`);
    assert.equal(dynamicLabels.editing, dynamicLabels.expectedEditing, `${locale}: editing mode label`);
    assert.equal(dynamicLabels.reading, dynamicLabels.expectedReading, `${locale}: reading mode label`);
    assert.notEqual(dynamicLabels.originalTheme, dynamicLabels.changedTheme, `${locale}: theme did not change`);
    assert.equal(dynamicLabels.themeLabel, dynamicLabels.expectedTheme, `${locale}: theme action label`);
    for (const [actual, expected] of [[dynamicLabels.horizontal, dynamicLabels.expectedHorizontal],
      [dynamicLabels.vertical, dynamicLabels.expectedVertical]]) {
      assert.equal(actual.label, expected.label, `${locale}: split pane accessible label`);
      assert.equal(actual.text, expected.text, `${locale}: split pane localized value`);
    }
    const navigationLabels = await evaluate(window, `['#previousSearchMatch', '#nextSearchMatch', '#closeSearch'].map(selector => {
      const button = document.querySelector(selector);
      return { label: button.getAttribute('aria-label'), title: button.getAttribute('title') };
    })`);
    const navigationExpected = await evaluate(window, `[counterMessages.previousMatch, counterMessages.nextMatch, counterMessages.closeSearch]`);
    navigationLabels.forEach((button, index) => {
      assert.equal(button.label, navigationExpected[index], `${locale}: search navigation accessible label`);
      if (button.title !== null) assert.equal(button.title, navigationExpected[index], `${locale}: search navigation tooltip`);
    });
    const inputLanguages = await evaluate(window, `['#searchInput', '#fontInput', '#monoFontInput'].map(selector => {
      const input = document.querySelector(selector);
      const label = document.getElementById(input.getAttribute('aria-labelledby'));
      return { input: input.getAttribute('lang'), label: label?.textContent, labelLanguage: label?.lang,
        accessibleName: input.getAttribute('aria-label') };
    })`);
    for (const input of inputLanguages) {
      assert.equal(input.input, '', `${locale}: user input inherited the interface language`);
      assert.equal(input.labelLanguage, locale, `${locale}: input label language`);
      assert.equal(input.label, input.accessibleName, `${locale}: input label text`);
    }
    const visibleFontLabels = await evaluate(window, `['fontInput', 'monoFontInput'].map(id => {
      const input = document.getElementById(id);
      const label = document.querySelector('label[for="' + id + '"]');
      return { text: label?.textContent, accessible: input.getAttribute('aria-label'),
        associated: label?.control === input, visible: !!label && getComputedStyle(label).display !== 'none' };
    })`);
    for (const label of visibleFontLabels) {
      assert.equal(label.text, label.accessible, `${locale}: visible font label differs from its accessible name`);
      assert.equal(label.associated, true, `${locale}: font label is associated with the wrong input`);
      assert.equal(label.visible, true, `${locale}: font label is not visible`);
    }
    const counts = await evaluate(window, `(() => {
      window.markdownVisionReader.showDocument('unique-localization-token', 'locale.md');
      document.querySelector('#searchButton').click();
      const input = document.querySelector('#searchInput');
      input.value = 'not-present-localization-token';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const none = document.querySelector('#searchCount').textContent;
      const box = document.querySelector('.search-box');
      const noneWidth = { scroll: box.scrollWidth, client: box.clientWidth };
      input.value = 'unique-localization-token';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const one = document.querySelector('#searchCount').textContent;
      document.querySelector('#closeSearch').click();
      return { none, one, noneWidth };
    })()`);
    assert.notEqual(counts.none, counts.one, `${locale}: search result count did not update`);
    assert.equal(counts.none, localizedControls.expectedZero, `${locale}: zero-result language`);
    if (locale === 'pt-br') {
      assert.equal(counts.none, '0 resultados da busca', 'Portuguese search shows the plural for zero results');
    }
    if (locale === 'th') {
      assert.equal(counts.none, `ผลการค้นหา ${new Intl.NumberFormat('th').format(0)} รายการ`,
        'Thai search uses a natural result-count phrase');
    }
    assert.ok(counts.noneWidth.scroll <= counts.noneWidth.client + 1, `${locale}: search controls overflow at narrow width`);
    assert.doesNotMatch(counts.none, /\b(?:match|matches|search result|search results)\b/i, `${locale}: zero results are English`);
    assert.doesNotMatch(counts.one, /\b(?:match|matches|search result|search results)\b/i, `${locale}: one result is English`);
    if (['ar', 'ja', 'pl'].includes(locale)) {
      const manyResults = await evaluate(window, `(() => {
        window.markdownVisionReader.showDocument(Array(1001).fill('needle').join(' '), 'many-results.md');
        document.querySelector('#searchButton').click();
        const input = document.querySelector('#searchInput');
        input.value = 'needle';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const count = document.querySelector('#searchCount');
        const box = document.querySelector('.search-box');
        const result = { text: count.textContent, number: new Intl.NumberFormat(counterLocale).format(1001),
          countWidth: count.clientWidth, countScroll: count.scrollWidth,
          boxWidth: box.clientWidth, boxScroll: box.scrollWidth };
        document.querySelector('#closeSearch').click();
        return result;
      })()`);
      assert.ok(manyResults.text.includes(manyResults.number), `${locale}: large result total is not localized`);
      assert.ok(manyResults.countScroll <= manyResults.countWidth + 1 && manyResults.boxScroll <= manyResults.boxWidth + 1,
        `${locale}: large result count overflows the search panel`);
    }
    const expectedPositions = {
      pl: ['1 z 2', '2 z 2'], 'pt-br': ['1 de 2', '2 de 2'],
      ja: ['2 件中 1 件目', '2 件中 2 件目'],
      ar: null,
    };
    if (Object.hasOwn(expectedPositions, locale)) {
      const positions = await evaluate(window, `(() => {
        window.markdownVisionReader.showDocument('target target', 'positions.md');
        document.querySelector('#searchButton').click();
        const input = document.querySelector('#searchInput');
        input.value = 'target';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const first = document.querySelector('#searchCount').textContent;
        document.querySelector('#nextSearchMatch').click();
        const second = document.querySelector('#searchCount').textContent;
        document.querySelector('#closeSearch').click();
        return [first, second];
      })()`);
      if (locale === 'ar') {
        assert.match(positions[0], /^\u2068[1١]\u2069 من \u2068[2٢]\u2069$/, 'Arabic first result position');
        assert.match(positions[1], /^\u2068[2٢]\u2069 من \u2068[2٢]\u2069$/, 'Arabic second result position');
      } else {
        assert.deepEqual(positions, expectedPositions[locale], `${locale}: search position text`);
      }
    }
    const layout = await evaluate(window, `(() => {
      window.markdownVisionReader.showDocument('[Example](https://example.invalid)\\n', 'locale.md');
      document.querySelector('#editorToggle').click();
      document.querySelector('#editorPreview a').click();
      const dialog = document.querySelector('#visualEditDialog');
      const actions = document.querySelector('#visualEditActions');
      const box = dialog.getBoundingClientRect();
      return {
        open: dialog.open,
        dialogLeft: box.left,
        dialogRight: box.right,
        viewport: innerWidth,
        actionWidth: actions.clientWidth,
        actionScrollWidth: actions.scrollWidth,
      };
    })()`);
    assert.equal(layout.open, true, locale);
    assert.ok(layout.dialogLeft >= 0 && layout.dialogRight <= layout.viewport, `${locale}: dialog exceeds viewport`);
    assert.ok(layout.actionScrollWidth <= layout.actionWidth + 1, `${locale}: dialog actions overflow`);
    const about = await evaluate(window, `(() => {
      document.querySelector('#visualEditDialog').close();
      document.querySelector('.about-menu').open = true;
      const panel = document.querySelector('.about-panel');
      const rect = panel.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: innerWidth, scrollWidth: panel.scrollWidth, clientWidth: panel.clientWidth };
    })()`);
    assert.ok(about.left >= 0 && about.right <= about.width, `${locale}: About panel exceeds viewport`);
    assert.ok(about.scrollWidth <= about.clientWidth + 1, `${locale}: About text overflows`);
    const settings = await evaluate(window, `(() => {
      document.querySelector('.about-menu').open = false;
      document.querySelector('#settingsButton').click();
      const panel = document.querySelector('#settingsPanel');
      const rect = panel.getBoundingClientRect();
      return { hidden: panel.hidden, left: rect.left, right: rect.right, width: innerWidth,
        scrollWidth: panel.scrollWidth, clientWidth: panel.clientWidth };
    })()`);
    assert.equal(settings.hidden, false, `${locale}: settings did not open`);
    assert.ok(settings.left >= 0 && settings.right <= settings.width, `${locale}: Settings panel exceeds viewport`);
    assert.ok(settings.scrollWidth <= settings.clientWidth + 1, `${locale}: Settings content overflows`);
    await evaluate(window, `(() => {
      window.__desktopFixture.setScenario('save-error-result');
      const source = document.querySelector('#markdownSource');
      source.value += '\\nUnsaved changes';
      source.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#editorSave').click();
    })()`);
    await waitFor(window, '!document.querySelector("#editorSaveError").hidden', `${locale}: save error`);
    const saveError = await evaluate(window, `({
      message: document.querySelector('#editorSaveError').textContent,
      explanation: window.markdownVisionReader.interfaceText('Could not save the draft. Your edits are still open.'),
      dirty: window.markdownVisionReader.hasUnsavedChanges(),
      detailLanguage: document.querySelector('#editorSaveError bdi')?.getAttribute('lang'),
    })`);
    assert.ok(saveError.message.startsWith(saveError.explanation), `${locale}: missing localized save explanation`);
    assert.ok(saveError.message.includes('Fixture save failure'), `${locale}: missing system error detail`);
    assert.equal(saveError.detailLanguage, '', `${locale}: system error detail inherited the interface language`);
    assert.equal(saveError.dirty, true, `${locale}: save failure lost dirty state`);
  }
  window.setContentSize(480, 700);
  for (const zoom of [1.5, 2]) {
  window.webContents.setZoomFactor(zoom);
  for (const locale of ['ar', 'zh-hans', 'zh-hant', 'cs', 'nl', 'fr', 'de', 'hi', 'id', 'it', 'ja',
    'ko', 'pl', 'pt-br', 'ru', 'es', 'sv', 'th', 'tr', 'uk', 'vi']) {
    await window.loadFile(indexFile, { query: { previewLocale: locale } });
    window.webContents.setZoomFactor(zoom);
    assert.ok(Math.abs(window.webContents.getZoomFactor() - zoom) < 0.01, `${locale}: requested zoom was not applied`);
    await waitFor(window, `Math.abs(innerWidth - ${480 / zoom}) < 3`, `${locale}: zoomed viewport`);
    const searchLayout = await evaluate(window, `(() => {
      window.markdownVisionReader.showDocument('a short document', 'scale.md');
      document.querySelector('#searchButton').click();
      const panel = document.querySelector('#searchPanel');
      const box = panel.querySelector('.search-box');
      const rect = panel.getBoundingClientRect();
      return { visible: !panel.hidden, left: rect.left, right: rect.right, viewport: innerWidth,
        width: box.clientWidth, content: box.scrollWidth };
    })()`);
    assert.equal(searchLayout.visible, true, `${locale}: scaled search is hidden`);
    assert.ok(searchLayout.left >= 0 && searchLayout.right <= searchLayout.viewport + 1, `${locale}: scaled search exceeds viewport`);
    assert.ok(searchLayout.content <= searchLayout.width + 1, `${locale}: scaled search content overflows`);
    if (zoom === 2 && ['ar', 'ja', 'pl'].includes(locale)) {
      const scaledManyResults = await evaluate(window, `(() => {
        window.markdownVisionReader.showDocument(Array(1001).fill('needle').join(' '), 'scaled-results.md');
        const input = document.querySelector('#searchInput');
        input.value = 'needle';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const count = document.querySelector('#searchCount');
        const box = document.querySelector('.search-box');
        return { text: count.textContent, total: new Intl.NumberFormat(counterLocale).format(1001),
          width: count.clientWidth, content: count.scrollWidth, boxWidth: box.clientWidth, boxContent: box.scrollWidth };
      })()`);
      assert.ok(scaledManyResults.text.includes(scaledManyResults.total), `${locale}: scaled result total is not localized`);
      assert.ok(scaledManyResults.content <= scaledManyResults.width + 1 &&
        scaledManyResults.boxContent <= scaledManyResults.boxWidth + 1, `${locale}: scaled result total overflows`);
    }
    const settingsLayout = await evaluate(window, `(() => {
      document.querySelector('#closeSearch').click();
      document.querySelector('#settingsButton').click();
      const panel = document.querySelector('#settingsPanel');
      const rect = panel.getBoundingClientRect();
      return { visible: !panel.hidden, left: rect.left, right: rect.right, viewport: innerWidth,
        width: panel.clientWidth, content: panel.scrollWidth };
    })()`);
    assert.equal(settingsLayout.visible, true, `${locale}: scaled settings are hidden`);
    assert.ok(settingsLayout.left >= 0 && settingsLayout.right <= settingsLayout.viewport + 1, `${locale}: scaled settings exceed viewport`);
    assert.ok(settingsLayout.content <= settingsLayout.width + 1, `${locale}: scaled settings content overflows`);
    if (locale === 'ar') {
      const editorLayout = await evaluate(window, `(() => {
        document.querySelector('#closeSettings').click();
        document.querySelector('#editorToggle').click();
        const header = document.querySelector('.editor-header');
        const toolbar = document.querySelector('.toolbar');
        const actions = document.querySelector('#editorSaveActions');
        const rect = actions.getBoundingClientRect();
        return { width: header.clientWidth, content: header.scrollWidth, hidden: actions.hidden,
          toolbarWidth: toolbar.clientWidth, toolbarContent: toolbar.scrollWidth,
          left: rect.left, right: rect.right, viewport: innerWidth };
      })()`);
      assert.equal(editorLayout.hidden, false, `${locale}: scaled save controls are hidden`);
      assert.ok(editorLayout.content <= editorLayout.width + 1, `${locale}: scaled editor header overflows`);
      assert.ok(editorLayout.toolbarContent <= editorLayout.toolbarWidth + 1, `${locale}: scaled toolbar overflows`);
      assert.ok(editorLayout.left >= 0 && editorLayout.right <= editorLayout.viewport + 1,
        `${locale}: scaled save controls exceed the viewport`);
    }
    const updateLayouts = await evaluate(window, `(() => {
      const menu = document.querySelector('.about-menu');
      menu.open = true;
      const panel = menu.querySelector('.about-panel');
      const status = document.querySelector('#latestVersion');
      return ['Unsupported architecture', 'Unsupported platform', 'Installer verification is unavailable'].map(text => {
        status.textContent = window.markdownVisionReader.interfaceText(text);
        const bounds = panel.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, viewport: innerWidth,
          width: panel.clientWidth, content: panel.scrollWidth };
      });
    })()`);
    for (const layout of updateLayouts) {
      assert.ok(layout.left >= 0 && layout.right <= layout.viewport + 1 && layout.content <= layout.width + 1,
        `${locale}: scaled update error overflows`);
    }
    const scaledActions = await evaluate(window, `(() => {
      const reader = window.markdownVisionReader;
      reader.showDocument('- [ ] First\\n- [ ] Second\\n', 'scaled-list.md');
      if (!document.body.classList.contains('is-editing')) document.querySelector('#editorToggle').click();
      const toolbar = document.querySelector('.toolbar');
      const toolbarControls = [...toolbar.querySelectorAll(':scope > button, :scope > .about-menu > summary')]
        .filter(control => control.getClientRects().length)
        .map(control => { const rect = control.getBoundingClientRect(); return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }; });
      const views = document.querySelector('.editor-views').getBoundingClientRect();
      const topbar = document.querySelector('.topbar').getBoundingClientRect();
      const workspaceElement = document.querySelector('#editorWorkspace');
      const workspace = workspaceElement.getBoundingClientRect();
      document.querySelector('#editorPreview [data-visual-edit="list-structure"][data-index="1"]').click();
      const dialog = document.querySelector('#visualEditDialog');
      const select = dialog.querySelector('select[name="operation"]');
      const full = dialog.querySelector('.visual-edit-full-selection');
      const context = document.createElement('canvas').getContext('2d');
      context.font = getComputedStyle(select).font;
      const options = [...select.options].map(option => {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return { text: option.textContent, width: context.measureText(option.textContent).width,
          visible: !full.hidden, displayed: full.textContent, fullWidth: full.clientWidth, fullScroll: full.scrollWidth };
      });
      const rect = dialog.getBoundingClientRect();
      const result = { options, available: select.clientWidth - 35, left: rect.left, right: rect.right,
        viewport: innerWidth, content: dialog.scrollWidth, width: dialog.clientWidth,
        toolbarWidth: toolbar.clientWidth, toolbarContent: toolbar.scrollWidth, toolbarControls,
        viewsWidth: views.width, viewsLeft: views.left, viewsRight: views.right, viewsTop: views.top, viewsBottom: views.bottom,
        barTop: topbar.top, barBottom: topbar.bottom, workspaceTop: workspace.top };
      dialog.close();
      document.querySelector('#editorToggle').click();
      return result;
    })()`);
    assert.ok(scaledActions.left >= 0 && scaledActions.right <= scaledActions.viewport + 1 &&
      scaledActions.content <= scaledActions.width + 1, `${locale}: scaled list dialog overflows`);
    assert.ok(scaledActions.toolbarContent <= scaledActions.toolbarWidth + 1 && scaledActions.toolbarControls.length >= 7 &&
      scaledActions.toolbarControls.every(control => control.left >= -1 && control.right <= scaledActions.viewport + 1) &&
      scaledActions.viewsWidth >= 80 && scaledActions.viewsLeft >= -1 && scaledActions.viewsRight <= scaledActions.viewport + 1,
      `${locale}: scaled toolbar controls are clipped: ${JSON.stringify(scaledActions)}`);
    assert.ok(scaledActions.toolbarControls.every(control => control.top >= scaledActions.barTop - 1 && control.bottom <= scaledActions.barBottom + 1) &&
      scaledActions.viewsTop >= scaledActions.barTop - 1 && scaledActions.viewsBottom <= scaledActions.barBottom + 1 &&
      scaledActions.workspaceTop >= scaledActions.barBottom - 1, `${locale}: toolbar overlaps the editor: ${JSON.stringify(scaledActions)}`);
    for (const option of scaledActions.options) {
      if (option.width > scaledActions.available) {
        assert.equal(option.visible, true, `${locale}: scaled list operation is clipped`);
        assert.equal(option.displayed, option.text, `${locale}: scaled list operation text differs`);
        assert.ok(option.fullScroll <= option.fullWidth + 1, `${locale}: scaled full operation overflows`);
      }
    }
    if (zoom === 2) {
      await window.loadFile(indexFile, { query: { previewLocale: locale, testNoSegmenter: '1' } });
      window.webContents.setZoomFactor(zoom);
      assert.ok(Math.abs(window.webContents.getZoomFactor() - zoom) < 0.01, `${locale}: fallback zoom was not applied`);
      await waitFor(window, `Math.abs(innerWidth - ${480 / zoom}) < 3`, `${locale}: zoomed fallback viewport`);
      const scaledApproximate = await evaluate(window, `(() => {
        const reader = window.markdownVisionReader;
        reader.showDocument('你好世界 example', 'scaled-words.md');
        document.querySelector('#editorToggle').click();
        document.querySelector('.editor-views [data-view="source"]').click();
        const count = document.querySelector('#editorStats');
        const cursor = document.querySelector('#editorCursor');
        const status = count.parentElement;
        const a = count.getBoundingClientRect(), b = cursor.getBoundingClientRect(), box = status.getBoundingClientRect();
        return { text: count.textContent, expected: reader.interfaceText('Approximate word count: {count}', { count: 2 }),
          width: status.clientWidth, content: status.scrollWidth,
          countLeft: a.left, countRight: a.right, countTop: a.top, countBottom: a.bottom,
          cursorLeft: b.left, cursorRight: b.right, cursorTop: b.top, cursorBottom: b.bottom,
          boxLeft: box.left, boxRight: box.right };
      })()`);
      assert.equal(scaledApproximate.text, scaledApproximate.expected, `${locale}: scaled approximate count`);
      assert.ok(scaledApproximate.content <= scaledApproximate.width + 1 &&
        scaledApproximate.countLeft >= scaledApproximate.boxLeft - 1 && scaledApproximate.countRight <= scaledApproximate.boxRight + 1 &&
        scaledApproximate.cursorLeft >= scaledApproximate.boxLeft - 1 && scaledApproximate.cursorRight <= scaledApproximate.boxRight + 1,
        `${locale}: scaled approximate count overflows: ${JSON.stringify(scaledApproximate)}`);
      assert.ok(scaledApproximate.countRight <= scaledApproximate.cursorLeft || scaledApproximate.cursorRight <= scaledApproximate.countLeft ||
        scaledApproximate.countBottom <= scaledApproximate.cursorTop || scaledApproximate.cursorBottom <= scaledApproximate.countTop,
        `${locale}: scaled count overlaps the cursor position`);
    }
  }
  }
  window.setContentSize(320, 500);
  for (const locale of locales) {
    await window.loadFile(indexFile, { query: { previewLocale: locale } });
    window.webContents.setZoomFactor(2);
    await waitFor(window, 'Math.abs(innerWidth - 160) < 3', `${locale}: very narrow zoomed viewport`);
    const narrowToolbar = await evaluate(window, `(async () => {
      window.markdownVisionReader.showDocument('test', 'narrow.md');
      const readBar = document.querySelector('.topbar').getBoundingClientRect();
      const readToolbar = document.querySelector('.toolbar');
      const readControls = [...readToolbar.querySelectorAll(':scope > button, :scope > .about-menu > summary')]
        .filter(control => control.getClientRects().length)
        .map(control => { const rect = control.getBoundingClientRect(); return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }; });
      const reader = document.querySelector('#readerShell').getBoundingClientRect();
      const panelBounds = () => {
        document.querySelector('#searchButton').click();
        const search = document.querySelector('#searchPanel');
        const searchRect = search.getBoundingClientRect();
        const searchInput = search.querySelector('#searchInput').getBoundingClientRect();
        const searchResult = { kind: 'search', left: searchRect.left, right: searchRect.right, bottom: searchRect.bottom,
          width: search.clientWidth, content: search.scrollWidth, inputWidth: searchInput.width };
        document.querySelector('#closeSearch').click();
        document.querySelector('#settingsButton').click();
        const settings = document.querySelector('#settingsPanel');
        const settingsRect = settings.getBoundingClientRect();
        const settingsResult = { kind: 'settings', left: settingsRect.left, right: settingsRect.right, bottom: settingsRect.bottom,
          width: settings.clientWidth, content: settings.scrollWidth,
          headingHeight: settings.querySelector('.settings-heading strong').getBoundingClientRect().height,
          overflowing: [...settings.querySelectorAll('*')].filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.id || node.tagName) };
        document.querySelector('#closeSettings').click();
        const menu = document.querySelector('.about-menu');
        menu.open = true;
        const about = menu.querySelector('.about-panel');
        const aboutRect = about.getBoundingClientRect();
        const aboutResult = { kind: 'about', left: aboutRect.left, right: aboutRect.right, bottom: aboutRect.bottom,
          width: about.clientWidth, content: about.scrollWidth,
          overflowing: [...about.querySelectorAll('*')].filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.id || node.tagName) };
        menu.open = false;
        return [searchResult, settingsResult, aboutResult];
      };
      const readState = { controls: readControls, barTop: readBar.top, barBottom: readBar.bottom,
        readerTop: reader.top, width: readToolbar.clientWidth, content: readToolbar.scrollWidth, panels: panelBounds() };
      document.querySelector('#editorToggle').click();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const bar = document.querySelector('.topbar').getBoundingClientRect();
      const workspaceElement = document.querySelector('#editorWorkspace');
      const workspace = workspaceElement.getBoundingClientRect();
      const initialPane = document.querySelector('.preview-pane').getBoundingClientRect();
      const initiallyVisiblePane = Math.max(0, Math.min(initialPane.bottom, workspace.bottom) - Math.max(initialPane.top, workspace.top));
      workspaceElement.scrollTop = 0;
      const toolbar = document.querySelector('.toolbar');
      const header = document.querySelector('.editor-header');
      const saveActions = document.querySelector('#editorSaveActions');
      const saveButtons = [...saveActions.querySelectorAll('button')].map(button => {
        const rect = button.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      });
      const reachableSaveButtons = [...saveActions.querySelectorAll('button')].map(button => {
        button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const rect = button.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      });
      const controls = [...toolbar.querySelectorAll(':scope > button, :scope > .about-menu > summary')]
        .filter(control => control.getClientRects().length)
        .map(control => { const rect = control.getBoundingClientRect(); return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }; });
      const views = document.querySelector('.editor-views').getBoundingClientRect();
      const pane = document.querySelector('.preview-pane').getBoundingClientRect();
      workspaceElement.scrollTop = workspaceElement.scrollHeight;
      const scrolledPane = document.querySelector('.preview-pane').getBoundingClientRect();
      const visiblePaneHeight = Math.max(0, Math.min(scrolledPane.bottom, workspace.bottom) - Math.max(scrolledPane.top, workspace.top));
      document.querySelector('.editor-views [data-view="source"]').click();
      workspaceElement.scrollTop = workspaceElement.scrollHeight;
      const sourcePane = document.querySelector('#markdownSource').getBoundingClientRect();
      const visibleSourceHeight = Math.max(0, Math.min(sourcePane.bottom, workspace.bottom) - Math.max(sourcePane.top, workspace.top));
      return { controls, readState, barTop: bar.top, barBottom: bar.bottom, workspaceTop: workspace.top,
        viewport: innerWidth, viewportHeight: innerHeight, panels: panelBounds(), toolbarWidth: toolbar.clientWidth, toolbarContent: toolbar.scrollWidth,
        viewsWidth: views.width, viewsTop: views.top, viewsBottom: views.bottom, paneHeight: pane.height,
        initiallyVisiblePane, visiblePaneHeight, visibleSourceHeight, saveButtons, reachableSaveButtons, workspaceBottom: workspace.bottom,
        headerWidth: header.clientWidth, headerContent: header.scrollWidth,
        scrollable: workspaceElement.scrollHeight > workspaceElement.clientHeight };
    })()`);
    assert.ok(narrowToolbar.toolbarContent <= narrowToolbar.toolbarWidth + 1 && narrowToolbar.controls.length >= 7 &&
      narrowToolbar.controls.every(control => control.left >= -1 && control.right <= narrowToolbar.viewport + 1 &&
        control.top >= narrowToolbar.barTop - 1 && control.bottom <= narrowToolbar.barBottom + 1) &&
      narrowToolbar.viewsWidth >= 80 && narrowToolbar.viewsTop >= narrowToolbar.barTop - 1 &&
      narrowToolbar.viewsBottom <= narrowToolbar.barBottom + 1 && narrowToolbar.workspaceTop >= narrowToolbar.barBottom - 1,
      `${locale}: very narrow toolbar is clipped or overlaps the editor: ${JSON.stringify(narrowToolbar)}`);
    assert.ok(narrowToolbar.readState.content <= narrowToolbar.readState.width + 1 && narrowToolbar.readState.controls.length >= 6 &&
      narrowToolbar.readState.controls.every(control => control.left >= -1 && control.right <= narrowToolbar.viewport + 1 &&
        control.top >= narrowToolbar.readState.barTop - 1 && control.bottom <= narrowToolbar.readState.barBottom + 1) &&
      narrowToolbar.readState.readerTop >= narrowToolbar.readState.barBottom - 1,
      `${locale}: very narrow reader toolbar is clipped or overlaps the document: ${JSON.stringify(narrowToolbar.readState)}`);
    assert.ok(narrowToolbar.paneHeight >= 30, `${locale}: editor has too little space for text: ${JSON.stringify(narrowToolbar)}`);
    assert.ok(narrowToolbar.initiallyVisiblePane >= 30, `${locale}: editor text is not visible on entry: ${JSON.stringify(narrowToolbar)}`);
    assert.ok(narrowToolbar.visiblePaneHeight >= 30, `${locale}: editor text is not reachable by scrolling: ${JSON.stringify(narrowToolbar)}`);
    assert.ok(narrowToolbar.visibleSourceHeight >= 30, `${locale}: Markdown source is not reachable by scrolling: ${JSON.stringify(narrowToolbar)}`);
    assert.ok(narrowToolbar.headerContent <= narrowToolbar.headerWidth + 1 &&
      narrowToolbar.saveButtons.every(button => button.left >= -1 && button.right <= narrowToolbar.viewport + 1),
      `${locale}: save controls overflow the narrow editor: ${JSON.stringify(narrowToolbar)}`);
    assert.ok(narrowToolbar.reachableSaveButtons.every(button => button.top >= narrowToolbar.workspaceTop - 1 &&
      button.bottom <= narrowToolbar.workspaceBottom + 1), `${locale}: save controls are not reachable by scrolling`);
    for (const panel of [...narrowToolbar.readState.panels, ...narrowToolbar.panels]) {
      assert.ok(panel.left >= -1 && panel.right <= narrowToolbar.viewport + 1 && panel.bottom <= narrowToolbar.viewportHeight + 1 &&
        panel.content <= panel.width + 1, `${locale}: very narrow panel overflows: ${JSON.stringify(panel)}`);
      if (panel.kind === 'search') assert.ok(panel.inputWidth >= 80, `${locale}: search field is too narrow`);
      if (panel.kind === 'settings' && locale === 'ar') {
        assert.ok(panel.headingHeight <= 20, `${locale}: settings heading wraps awkwardly: ${JSON.stringify(panel)}`);
      }
    }
  }
  window.setContentSize(480, 700);
  window.webContents.setZoomFactor(1);
  for (const locale of locales) {
    await window.loadFile(indexFile, { query: { previewLocale: locale } });
    await evaluate(window, `(() => {
      window.desktop.updateArchitecture = async () => 'x64';
      window.desktop.installUpdate = async () => { throw new Error('Native bridge failed'); };
      window.fetch = async () => ({ ok: true, json: async () => ({ tag_name: 'v${newerVersion}',
        assets: [{ name: 'Markdown-Vision-Native-Setup-${newerVersion}-Intel-AMD-x64.exe', digest: 'sha256:' + 'a'.repeat(64) }] }) });
      window.confirm = () => true;
      document.querySelector('.about-menu').open = true;
    })()`);
    await waitFor(window, '!document.querySelector("#updateLink").hidden', `${locale}: Windows update available`);
    await evaluate(window, 'document.querySelector("#updateLink").click()');
    await waitFor(window, `document.querySelector('#latestVersion').textContent === window.markdownVisionReader.interfaceText('Could not download, verify, or start the installer. Please try again.')`,
      `${locale}: Windows update bridge failure`);
    const status = await evaluate(window, `({ retryVisible: !document.querySelector('#updateLink').hidden,
      lang: document.querySelector('#latestVersion').lang, live: document.querySelector('#latestVersion').getAttribute('aria-live') })`);
    assert.equal(status.retryVisible, true, `${locale}: update retry should remain available`);
    assert.equal(status.lang, locale);
    assert.equal(status.live, 'polite');
  }
  for (const locale of locales) {
    await window.loadFile(indexFile, { query: { previewLocale: locale } });
    await evaluate(window, `(() => {
      window.desktop.getPlatformInfo = async () => ({ platform: 'linux', architecture: 'x86_64', distribution: 'ubuntu' });
      window.desktop.installLinuxUpdate = async () => { throw new Error('The downloaded update failed verification.'); };
      window.fetch = async () => ({ ok: true, json: async () => [{ tag_name: 'v${newerVersion}',
        assets: [{ name: 'Markdown-Vision-${newerVersion}-ubuntu-x86_64.deb', browser_download_url: 'https://example.invalid/update.deb',
          digest: 'sha256:' + 'a'.repeat(64) }] }] });
      document.querySelector('.about-menu').open = true;
    })()`);
    await waitFor(window, '!document.querySelector("#updateLink").hidden', `${locale}: Linux update available`);
    await evaluate(window, 'document.querySelector("#updateLink").click()');
    await waitFor(window, `document.querySelector('#latestVersion').textContent === window.markdownVisionReader.interfaceText('Update failed: {error}',
      { error: window.markdownVisionReader.localizedNativeError('The downloaded update failed verification.') })`,
    `${locale}: Linux update failure`);
    const status = await evaluate(window, `({ text: document.querySelector('#latestVersion').textContent,
      retryVisible: !document.querySelector('#updateLink').hidden, lang: document.querySelector('#latestVersion').lang,
      detailLanguage: document.querySelector('#latestVersion bdi')?.getAttribute('lang') })`);
    assert.doesNotMatch(status.text, /The downloaded update failed verification/);
    assert.equal(status.retryVisible, true, `${locale}: Linux update retry should remain available`);
    assert.equal(status.lang, locale);
    assert.equal(status.detailLanguage, locale, `${locale}: translated update detail language`);
    await evaluate(window, `window.desktop.installLinuxUpdate = async () => { throw new Error('System <detail> {error}'); };
      document.querySelector('#updateLink').click()`);
    await waitFor(window, `document.querySelector('#latestVersion bdi')?.textContent === 'System <detail> {error}'`,
      `${locale}: system update error`);
    assert.equal(await evaluate(window, `document.querySelector('#latestVersion bdi').getAttribute('lang')`), '',
      `${locale}: system update detail must not inherit the interface language`);
    assert.equal(await evaluate(window, `document.querySelector('#latestVersion bdi').children.length`), 0,
      `${locale}: system update detail must remain text`);
    await evaluate(window, `window.desktop.installLinuxUpdate = async () => {};
      window.desktop.restartAfterUpdate = async () => { throw new Error('System restart detail'); };
      document.querySelector('#updateLink').click()`);
    await waitFor(window, `!document.querySelector('#restartAfterUpdate').hidden`, `${locale}: restart action`);
    await evaluate(window, `document.querySelector('#restartAfterUpdate').click()`);
    await waitFor(window, `document.querySelector('#latestVersion bdi')?.textContent === 'System restart detail'`,
      `${locale}: system restart error`);
    const restartFailure = await evaluate(window, `({ text: document.querySelector('#latestVersion').textContent,
      detailLanguage: document.querySelector('#latestVersion bdi').getAttribute('lang'),
      disabled: document.querySelector('#restartAfterUpdate').disabled,
      expected: window.markdownVisionReader.interfaceText('Could not restart: {error}', { error: 'System restart detail' }) })`);
    assert.equal(restartFailure.text, restartFailure.expected, `${locale}: localized restart explanation`);
    assert.equal(restartFailure.detailLanguage, '', `${locale}: system restart detail language`);
    assert.equal(restartFailure.disabled, false, `${locale}: restart can be retried`);
  }
}

async function run() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-vision-renderer-fixture-'));
  for (const file of copyFiles) {
    const target = path.join(fixtureRoot, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(sourceRoot, 'src', 'web', file), target);
  }
  fs.copyFileSync(path.join(sourceRoot, 'tools/desktop-bridge-fixture.cjs'), path.join(fixtureRoot, 'desktop-bridge-fixture.js'));
  const indexFile = path.join(fixtureRoot, 'index.html');
  const html = fs.readFileSync(indexFile, 'utf8');
  const scriptAnchor = '<script src="vendor/markdown-it.js"></script>';
  if (!html.includes(scriptAnchor)) throw new Error('Could not find renderer script insertion point.');
  fs.writeFileSync(indexFile, html.replace(scriptAnchor,
    '<script src="desktop-bridge-fixture.js"></script>\n' +
    `<script>
      window.__desktopFixture = createDesktopBridgeFixture("preferences-pending");
      window.desktop = window.__desktopFixture;
      if (new URLSearchParams(location.search).has('testMacShortcuts')) {
        Object.defineProperty(navigator, 'platform', { configurable: true, value: 'MacIntel' });
      }
      const systemLanguage = new URLSearchParams(location.search).get('testSystemLanguage');
      window.__markdownVisionLanguageOverride = new URLSearchParams(location.search).get('testLanguageOverride');
      if (systemLanguage) {
        Object.defineProperty(navigator, 'languages', { configurable: true, value: [systemLanguage] });
      }
      if (new URLSearchParams(location.search).has('testNoSegmenter')) Intl.Segmenter = undefined;
      if (new URLSearchParams(location.search).has('testNoResizeObserver')) window.ResizeObserver = undefined;
      window.__menuAttempts = 0;
      window.desktop.setNativeMenuLabels = async labels => {
        window.__menuAttempts++;
        if (new URLSearchParams(location.search).has('testMenuDelay') && window.__menuAttempts < 3) {
          throw new Error('Application menu unavailable');
        }
        window.__nativeMenuLabels = labels;
      };
      const testLanguage = new URLSearchParams(location.search).get('testNativeLanguage');
      if (testLanguage) {
        sessionStorage.setItem('test-startup-loads', Number(sessionStorage.getItem('test-startup-loads') || 0) + 1);
        window.desktop.getPreferences = async () => {
          if (new URLSearchParams(location.search).has('testPreferenceFailure')) {
            throw new Error('Native preferences unavailable');
          }
          if (new URLSearchParams(location.search).has('testSlowPreferences')) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          return { language: testLanguage };
        };
        window.desktop.getInitialDocument = async () => {
          sessionStorage.setItem('test-initial-requests', Number(sessionStorage.getItem('test-initial-requests') || 0) + 1);
          return { content: 'Startup document', name: 'startup.md' };
        };
      }
      window.fetch = () => Promise.reject(new Error("Offline fixture"));
    </script>\n` +
    scriptAnchor));

  const window = new BrowserWindow({
    show: false,
    width: 1000,
    height: 750,
    webPreferences: { contextIsolation: false, nodeIntegration: false, sandbox: true, partition: `font-test-${process.pid}` },
  });
  try {
    await window.loadFile(indexFile);
    await waitFor(window, 'window.markdownVisionReader && window.__desktopFixture.calls.some(([name]) => name === "getInitialDocument")', 'renderer initialization');

    const checkTitle = async (expected, message) => assert.equal(await evaluate(window, 'document.title'), expected, message);
    const calls = async (name) => evaluate(window, `window.__desktopFixture.calls.filter(([call]) => call === ${JSON.stringify(name)}).length`);
    const click = async (selector) => evaluate(window, `document.querySelector(${JSON.stringify(selector)}).click()`);
    const key = async (value, modifiers = {}) => evaluate(window,
      `document.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(value)}, bubbles: true, cancelable: true, ctrlKey: ${Boolean(modifiers.ctrlKey)}, metaKey: ${Boolean(modifiers.metaKey)}, shiftKey: ${Boolean(modifiers.shiftKey)} }))`);
    const editSource = async (text) => evaluate(window, `(() => { const source = document.querySelector('#markdownSource'); source.value = ${JSON.stringify(text)}; source.dispatchEvent(new Event('input', { bubbles: true })); })()`);

    assert.equal(await calls('getInitialDocument'), 1, 'startup UI path requests its initial document');
    assert.equal(await evaluate(window, 'document.querySelector("#fontInput").value'), 'Libertinus Serif');
    assert.equal(await evaluate(window, 'document.querySelector("#monoFontInput").value'), 'Libertinus Mono');
    const measureReadingLayout = () => evaluate(window, `(() => {
      const page = document.querySelector('#markdownOutput');
      const viewport = document.querySelector('#readerShell');
      const style = getComputedStyle(page);
      return { size: parseFloat(style.fontSize), limit: parseFloat(style.maxWidth),
        width: page.getBoundingClientRect().width, viewport: viewport.clientWidth,
        horizontalOverflow: viewport.scrollWidth > viewport.clientWidth };
    })()`);
    await evaluate(window, "window.markdownVisionReader.showDocument('A responsive reading column.', 'layout.md')");
    assert.equal(await evaluate(window, "document.querySelector('#autoFontSize').checked && document.querySelector('#autoReadingWidth').checked"), true);
    window.setContentSize(420, 400);
    await waitFor(window, 'innerWidth === 420', 'compact reading window');
    const compact = await measureReadingLayout();
    assert.equal(compact.horizontalOverflow, false);
    assert.ok(compact.width < compact.viewport && compact.width > compact.viewport * .85, 'compact reader uses the available width');
    window.setContentSize(1280, 750);
    await waitFor(window, 'innerWidth === 1280', 'wide reading window');
    const wide = await measureReadingLayout();
    assert.ok(wide.size > compact.size && wide.limit > compact.limit, 'automatic settings scale with window width');
    assert.ok(wide.width < wide.viewport * .8, 'wide window keeps a readable column');
    window.setContentSize(1000, 750);
    await waitFor(window, 'innerWidth === 1000', 'normal reading window');
    assert.equal(await evaluate(window, `Promise.all([
      document.fonts.load('400 18px "Libertinus Serif"'),
      document.fonts.load('italic 700 18px "Libertinus Serif"'),
      document.fonts.load('400 18px "Libertinus Mono"')
    ]).then(faces => faces.every(group => group.length && group.every(face => face.status === 'loaded')))`), true,
    'bundled fonts and bold italic face load successfully');
    await evaluate(window, `Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copiedCode = text; } } }); window.markdownVisionReader.showDocument('~~~js\\nconst value = "hello";\\n~~~\\n\\n    indented <text>\\n', 'copy.md');`);
    assert.equal(await evaluate(window, 'document.querySelectorAll("#markdownOutput pre .code-copy-button").length'), 2, 'fenced and indented blocks have copy buttons');
    await click('#markdownOutput pre:first-of-type .code-copy-button');
    await waitFor(window, 'window.__copiedCode === \'const value = "hello";\'', 'copying fenced code');
    await evaluate(window, 'document.querySelectorAll("#markdownOutput pre .code-copy-button")[1].click()');
    await waitFor(window, 'window.__copiedCode === "indented <text>\\n"', 'copying indented code exactly');
    await evaluate(window, `window.__originalExecCommand = document.execCommand.bind(document); document.execCommand = command => { if (command !== 'copy') return false; window.__fallbackCopy = document.activeElement.value; return true; }; navigator.clipboard.writeText = async () => { throw Error('Clipboard API unavailable'); }; void 0;`);
    await click('#markdownOutput pre:first-of-type .code-copy-button');
    await waitFor(window, 'window.__fallbackCopy === \'const value = "hello";\'', 'clipboard fallback');
    await evaluate(window, `document.execCommand = window.__originalExecCommand; navigator.clipboard.writeText = async text => { window.__copiedCode = text; }; void 0;`);
    const copyLayout = await evaluate(window, `(() => {
      window.markdownVisionReader.showDocument('~~~\\n' + 'M'.repeat(60) + '\\n~~~\\n', 'layout.md');
      const pre = document.querySelector('#markdownOutput pre');
      const code = pre.querySelector('code');
      const button = pre.querySelector('.code-copy-button');
      const lineWidth = code.getBoundingClientRect().width;
      pre.style.width = (lineWidth + parseFloat(getComputedStyle(pre).paddingLeft) + parseFloat(getComputedStyle(pre).paddingRight) + 4) + 'px';
      const near = { button: button.getBoundingClientRect().toJSON(), code: code.getBoundingClientRect().toJSON(), overflow: pre.scrollWidth > pre.clientWidth };
      pre.style.width = '160px';
      const before = button.getBoundingClientRect().toJSON();
      const codeTop = code.getBoundingClientRect().top;
      const overflow = pre.scrollWidth > pre.clientWidth;
      const trackHeight = pre.offsetHeight - pre.clientHeight;
      const clearance = pre.getBoundingClientRect().top + pre.clientHeight - code.getBoundingClientRect().bottom;
      pre.scrollLeft = pre.scrollWidth;
      const after = button.getBoundingClientRect().toJSON();
      return { near, before, after, codeTop, overflow, trackHeight, clearance };
    })()`);
    assert.equal(copyLayout.near.overflow, false, 'nearly full code block does not scroll');
    assert.ok(copyLayout.near.code.top >= copyLayout.near.button.bottom, 'copy icon does not cover a nearly full line');
    assert.equal(copyLayout.overflow, true, 'long code block scrolls');
    assert.ok(copyLayout.trackHeight > 0 && copyLayout.clearance > 0, 'horizontal scrollbar has a separate track below reader code');
    assert.ok(copyLayout.codeTop >= copyLayout.before.bottom, 'copy icon does not cover an overflowing line');
    assert.ok(Math.abs(copyLayout.before.right - copyLayout.after.right) < 2, 'copy icon stays at the right while scrolling');
    assert.equal(await evaluate(window, 'document.querySelectorAll("#printDocument .code-copy-button").length'), 0, 'print output has no copy controls');
    await evaluate(window, `(() => { window.markdownVisionReader.showDocument('First **bold** text.\\n\\nRepeat line.\\n\\nRepeat line.\\n', 'position.md'); const node = document.querySelectorAll('#markdownOutput p')[2].firstChild; window.getSelection().collapse(node, 6); document.dispatchEvent(new Event('selectionchange')); })()`);
    await click('#editorToggle');
    assert.equal(await evaluate(window, 'window.getSelection().focusNode?.parentElement?.textContent'), 'Repeat line.', 'edit opens in the selected repeated paragraph');
    assert.equal(await evaluate(window, 'window.getSelection().focusOffset'), 6, 'edit retains the character position');
    assert.equal(await evaluate(window, 'Array.from(document.querySelectorAll("#editorPreview [data-visual-block]")).indexOf(window.getSelection().focusNode.parentElement)'), 2, 'second repeated paragraph remains selected');
    await click('.editor-views [data-view="source"]');
    await click('#editorToggle');
    await evaluate(window, `(() => { const node = document.querySelector('#markdownOutput strong').firstChild; window.getSelection().collapse(node, 2); document.dispatchEvent(new Event('selectionchange')); })()`);
    await click('#editorToggle');
    assert.equal(await evaluate(window, 'document.activeElement.id'), 'markdownSource', 'Markdown mode receives focus');
    assert.equal(await evaluate(window, 'document.querySelector("#markdownSource").selectionStart'), 'First **bo'.length, 'formatted reader text maps to Markdown source');
    await click('.editor-views [data-view="visual"]');
    await click('#editorToggle');
    await evaluate(window, `(() => { window.markdownVisionReader.showDocument('~~~\\ncode text\\n~~~\\n', 'position-code.md'); const node = document.querySelector('#markdownOutput pre code').firstChild; window.getSelection().collapse(node, 4); document.dispatchEvent(new Event('selectionchange')); })()`);
    await click('#editorToggle');
    assert.equal(await evaluate(window, 'window.getSelection().focusNode?.parentElement?.tagName'), 'CODE', 'code block receives edit focus');
    assert.equal(await evaluate(window, 'window.getSelection().focusOffset'), 4, 'code block caret retains its position');
    await click('#editorToggle');
    await evaluate(window, `(() => { window.markdownVisionReader.showDocument('~~~js\\ncode text\\n~~~\\n', 'position-code-language.md'); const node = document.querySelector('#markdownOutput pre code').firstChild; window.getSelection().collapse(node, 4); document.dispatchEvent(new Event('selectionchange')); })()`);
    await click('#editorToggle');
    assert.equal(await evaluate(window, 'document.activeElement.classList.contains("visual-code-editor")'), true, 'language-marked code receives edit focus');
    assert.equal(await evaluate(window, 'document.activeElement.selectionStart'), 4, 'language-marked code retains the character position');
    await click('#editorToggle');
    await click('#themeButton');
    await evaluate(window, `window.__desktopFixture.resolvePreferences({ theme: 'dark', font: 'Georgia', monoFont: 'Consolas', size: '20', line: '1.8', width: '800' })`);
    await waitFor(window, 'document.documentElement.dataset.theme === "light" && document.querySelector("#fontSize").value === "20" && document.querySelector("#lineHeight").value === "1.8" && document.querySelector("#readingWidth").value === "800"', 'late native preference restore without overwriting a newer theme change');
    assert.equal(await evaluate(window, 'document.querySelector("#fontInput").value'), 'Georgia');
    assert.equal(await evaluate(window, 'document.querySelector("#monoFontInput").value'), 'Consolas');
    await waitFor(window, 'window.__desktopFixture.calls.some(([name, value]) => name === "savePreferences" && value.theme === "light" && value.size === "20" && value.width === "800")', 'persisting merged preferences');
    window.setContentSize(420, 400);
    await waitFor(window, 'innerWidth === 420', 'compact window with manual settings');
    const manual = await measureReadingLayout();
    assert.equal(manual.size, 20);
    assert.equal(manual.limit, 800);
    assert.equal(manual.horizontalOverflow, false, 'manual page width is capped by the available space');
    await click('#autoFontSize');
    await click('#autoReadingWidth');
    const reset = await measureReadingLayout();
    assert.equal(reset.size, compact.size, 'switching back to automatic restores responsive text sizing');
    assert.equal(reset.limit, compact.limit, 'switching back to automatic restores responsive width');
    await waitFor(window, 'window.__desktopFixture.calls.some(([name, value]) => name === "savePreferences" && value.size === "auto" && value.width === "auto")', 'persisting automatic settings');
    window.setContentSize(1000, 750);
    await waitFor(window, 'innerWidth === 1000', 'restored reading window');
    await evaluate(window, 'window.__desktopFixture.setScenario("default")');
    await click('#openButton');
    await waitFor(window, 'document.title === "opened.md"', 'toolbar Open');
    assert.equal(await calls('openMarkdownFile'), 1);
    await key('o', { ctrlKey: true });
    await waitFor(window, 'window.__desktopFixture.calls.filter(([name]) => name === "openMarkdownFile").length === 2', 'Ctrl+O');
    await waitFor(window, 'document.title === "opened.md"', 'keyboard Open result');

    await evaluate(window, 'window.__desktopFixture.setScenario("open-cancel")');
    await click('#openButton');
    await waitFor(window, 'window.__desktopFixture.calls.filter(([name]) => name === "openMarkdownFile").length === 3', 'canceled Open');
    await checkTitle('opened.md', 'canceled Open keeps the current document');
    await evaluate(window, 'window.__desktopFixture.setScenario("open-error")');
    await click('#openButton');
    await waitFor(window, 'window.__desktopFixture.calls.some(([name]) => name === "reportOpenError")', 'open error reporting');
    await checkTitle('opened.md', 'open error keeps the current document');
    await evaluate(window, `(() => {
      window.__savedOpenReporter = window.desktop.reportOpenError;
      delete window.desktop.reportOpenError;
    })()`);
    await click('#openButton');
    await waitFor(window, 'document.querySelector("#openErrorDialog").open', 'fallback open error reporting');
    const fallbackMessage = await evaluate(window, 'document.querySelector("#openErrorMessage").textContent');
    assert.match(fallbackMessage, /The document could not be opened/);
    assert.match(fallbackMessage, /Fixture open failure/);
    await checkTitle('opened.md', 'fallback open error keeps the current document');
    await evaluate(window, `(() => {
      document.querySelector('#openErrorDialog').close();
      window.__savedFileText = File.prototype.text;
      File.prototype.text = async () => { throw new Error('Fixture file read failure'); };
      const input = document.querySelector('#fileInput');
      const files = new DataTransfer();
      files.items.add(new File(['content'], 'failed.md', { type: 'text/markdown' }));
      input.files = files.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await waitFor(window, 'document.querySelector("#openErrorDialog").open', 'browser file read error');
    assert.match(await evaluate(window, 'document.querySelector("#openErrorMessage").textContent'), /Fixture file read failure/);
    assert.equal(await evaluate(window, 'document.querySelector("#fileInput").value'), '', 'failed file read can be retried');
    await checkTitle('opened.md', 'browser read error keeps the current document');
    await evaluate(window, `(() => {
      window.desktop.reportOpenError = window.__savedOpenReporter;
      document.querySelector('#openErrorDialog').close();
      File.prototype.text = window.__savedFileText;
    })()`);

    await evaluate(window, 'window.__desktopFixture.setScenario("default")');
    await click('#editorToggle');
    await waitFor(window, '!document.querySelector("#editorWorkspace").hidden', 'editor toolbar');
    await click('.editor-views [data-view="split"]');
    await editSource('```\nvisual code\n```\n');
    await waitFor(window, 'document.querySelector("#editorPreview pre .code-copy-button")', 'copy button in visual editor');
    await click('#editorPreview pre .code-copy-button');
    await waitFor(window, 'window.__copiedCode === "visual code"', 'copying editable code');
    assert.equal(await evaluate(window, 'document.querySelector("#markdownSource").value'), '```\nvisual code\n```\n', 'copy does not modify Markdown source');
    await editSource('~~~js\n' + 'M'.repeat(180) + '\n~~~\n');
    await waitFor(window, 'document.querySelector("#editorPreview .visual-code-editor")?.value.length === 180', 'long editable code block');
    assert.equal(await evaluate(window, `(() => {
      const field = document.querySelector('#editorPreview .visual-code-editor');
      return field.scrollWidth > field.clientWidth && field.offsetHeight > field.clientHeight
        && field.clientHeight >= parseFloat(getComputedStyle(field).lineHeight);
    })()`), true, 'editable code fits a full line above its horizontal scrollbar');
    await editSource('# Unsaved draft\n');
    await click('#editorSaveAs');
    await waitFor(window, 'window.__desktopFixture.calls.some(([name, id, text, saveAs]) => name === "saveMarkdownFile" && saveAs === true && text.includes("Unsaved draft"))', 'Save As toolbar');
    await checkTitle('saved-as.md', 'Save As updates the document name');

    await editSource('# Canceled draft\n');
    await evaluate(window, 'window.__desktopFixture.setScenario("save-cancel")');
    await click('#editorSave');
    await waitFor(window, 'window.__desktopFixture.calls.some(([name, id, text, saveAs]) => name === "saveMarkdownFile" && saveAs === false && text.includes("Canceled draft"))', 'canceled Save');
    await assert.equal(await evaluate(window, 'document.querySelector("#editorDirty").textContent'), 'Unsaved', 'canceled Save leaves edits dirty');

    await evaluate(window, 'window.__desktopFixture.setScenario("save-error-result")');
    await editSource('# Error draft\n');
    await click('#editorSave');
    await waitFor(window, '!document.querySelector("#editorSaveError").hidden', 'save error UI');
    await assert.equal(await evaluate(window, 'document.querySelector("#editorDirty").textContent'), 'Unsaved', 'save error leaves edits dirty');
    await evaluate(window, 'window.__desktopFixture.setScenario("default")');
    await editSource('# Clean draft\n');
    await click('#editorSave');
    await waitFor(window, 'document.querySelector("#editorDirty").textContent === "Saved"', 'toolbar Save');

    await editSource('# Keyboard draft\n');
    const savesBeforeKeyboard = await calls('saveMarkdownFile');
    await key('s', { ctrlKey: true });
    await waitFor(window, `window.__desktopFixture.calls.filter(([name]) => name === "saveMarkdownFile").length === ${savesBeforeKeyboard + 1}`, 'Ctrl+S');
    await waitFor(window, 'document.querySelector("#editorDirty").textContent === "Saved"', 'keyboard Save');
    await editSource('# Keyboard Save As\n');
    const beforeSaveAsShortcut = await calls('saveMarkdownFile');
    await key('s', { ctrlKey: true, shiftKey: true });
    await waitFor(window, `window.__desktopFixture.calls.filter(([name]) => name === "saveMarkdownFile").length === ${beforeSaveAsShortcut + 1} && window.__desktopFixture.calls.at(-1)[3] === true`, 'Ctrl+Shift+S');

    const printBefore = await calls('printMarkdown');
    await click('#printButton');
    await waitFor(window, `window.__desktopFixture.calls.filter(([name]) => name === "printMarkdown").length === ${printBefore + 1}`, 'Print toolbar');
    await key('p', { ctrlKey: true });
    await waitFor(window, `window.__desktopFixture.calls.filter(([name]) => name === "printMarkdown").length === ${printBefore + 2}`, 'Ctrl+P');

    await click('#searchButton');
    await waitFor(window, '!document.querySelector("#searchPanel").hidden', 'Search toolbar');
    await evaluate(window, 'document.querySelector("#searchPanel").hidden = true');
    await key('f', { ctrlKey: true });
    await waitFor(window, '!document.querySelector("#searchPanel").hidden', 'Ctrl+F');

    const titleBeforeMac = await evaluate(window, 'document.querySelector("#printButton").title');
    assert.match(titleBeforeMac, /Ctrl/);
    assert.equal(await evaluate(window, 'window.markdownVisionReader.applyShortcutLabels("MacIntel", "Mac OS X")'), '⌘');
    assert.match(await evaluate(window, 'document.querySelector("#printButton").title'), /⌘/);
    assert.match(await evaluate(window, 'document.querySelector("#editorSave").title'), /⌘/);
    assert.equal(await evaluate(window, 'window.markdownVisionReader.applyShortcutLabels("Linux x86_64", "Linux")'), 'Ctrl');
    assert.match(await evaluate(window, 'document.querySelector("#printButton").title'), /Ctrl/);
    await evaluate(window, 'window.markdownVisionReader.applyShortcutLabels()');

    await evaluate(window, 'window.fetch = () => new Promise((resolve, reject) => { window.__rejectReleaseCheck = reject; }); document.querySelector(".about-menu summary").click()');
    await waitFor(window, 'document.querySelector(".about-menu").open && document.querySelector("#latestVersion").textContent.includes("checking")', 'nonblocking About release check');
    await evaluate(window, 'window.__rejectReleaseCheck(new Error("Offline fixture"))');
    await waitFor(window, 'document.querySelector("#retryUpdateCheck").hidden === false', 'About offline state');
    assert.match(await evaluate(window, 'document.querySelector("#latestVersion").textContent'), /Unable to check/);
    await evaluate(window, `window.desktop.getPlatformInfo = async () => ({ platform: 'linux', architecture: 'x86_64', distribution: 'ubuntu' }); window.fetch = async () => ({ ok: true, json: async () => [{ tag_name: "v${installedVersion}", assets: [] }] }); document.querySelector(".about-menu").open = false; document.querySelector(".about-menu").open = true`);
    await waitFor(window, `document.querySelector("#latestVersion").textContent === "Latest compatible version: ${installedVersion}"`, 'About current-version state');
    assert.equal(await evaluate(window, 'document.querySelector("#updateLink").hidden'), true);
    await evaluate(window, `window.fetch = async () => ({ ok: true, json: async () => [{ tag_name: "v${newerVersion}", assets: [{name: 'Markdown-Vision-${newerVersion}-ubuntu-x86_64.deb', browser_download_url: 'https://example.com/update.deb'}] }] }); document.querySelector(".about-menu").open = false; document.querySelector(".about-menu").open = true`);
    await waitFor(window, `document.querySelector("#latestVersion").textContent === "Latest compatible version: ${newerVersion}"`, 'About newer-version state');
    assert.equal(await evaluate(window, 'document.querySelector("#updateLink").hidden'), false, 'manual release link appears without auto-updater capability');
    await evaluate(window, `window.desktop.getPlatformInfo = async () => ({ platform: 'linux', architecture: 'x86_64', distribution: 'fedora' }); window.desktop.installLinuxUpdate = async () => {}; window.fetch = async () => ({ ok: true, json: async () => [{ tag_name: 'v${newerVersion}', assets: [{name: 'Markdown-Vision-${newerVersion}-ubuntu-x86_64.deb', browser_download_url: 'https://example.com/update.deb', digest: 'sha256:' + 'a'.repeat(64)}, {name: 'Markdown-Vision-${newerVersion}-fedora-x86_64.rpm', browser_download_url: 'https://example.com/update.rpm', digest: 'sha256:' + 'b'.repeat(64)}] }] }); document.querySelector('.about-menu').open = false; document.querySelector('.about-menu').open = true;`);
    await waitFor(window, 'document.querySelector("#updateLink").textContent === "Upgrade Markdown Vision" && document.querySelector("#updateLink").href.endsWith("update.rpm")', 'Fedora in-app RPM upgrade');
    await evaluate(window, `document.querySelector('#installedVersion').dataset.version = '2.8.99'; window.fetch = async () => ({ ok: true, json: async () => [{ tag_name: 'v2.9.0', assets: [{name: 'Markdown-Vision-2.9.0-fedora-x86_64.rpm', browser_download_url: 'https://example.com/2.9.0.rpm', digest: 'sha256:' + 'b'.repeat(64)}] }] }); document.querySelector('.about-menu').open = false; document.querySelector('.about-menu').open = true;`);
    await waitFor(window, 'document.querySelector("#latestVersion").textContent === "Latest compatible version: 2.9.0" && !document.querySelector("#updateLink").hidden', 'minor version upgrade 2.8 to 2.9');
    await evaluate(window, `document.querySelector('#installedVersion').dataset.version = '2.10.0'; document.querySelector('.about-menu').open = false; document.querySelector('.about-menu').open = true;`);
    await waitFor(window, 'document.querySelector("#latestVersion").textContent === "Latest compatible version: 2.10.0" && document.querySelector("#updateLink").hidden', 'reject older minor version');
    await evaluate(window, `document.querySelector('#installedVersion').dataset.version = '${installedVersion}'; void 0;`);
    await evaluate(window, `window.desktop.getPlatformInfo = async () => ({ platform: 'linux', architecture: 'x86_64', distribution: 'ubuntu' }); void 0;`);
    await evaluate(window, `window.__upgradeCalls = []; window.desktop.installLinuxUpdate = async (version, digest) => window.__upgradeCalls.push(['install', version, digest]); window.desktop.restartAfterUpdate = async id => window.__upgradeCalls.push(['restart', id]); window.fetch = async () => ({ ok: true, json: async () => [{ tag_name: 'v${newerVersion}', assets: [{name: 'Markdown-Vision-${newerVersion}-ubuntu-x86_64.deb', browser_download_url: 'https://example.com/update.deb', digest: 'sha256:' + 'a'.repeat(64)}] }] }); document.querySelector('.about-menu').open = false; document.querySelector('.about-menu').open = true;`);
    await waitFor(window, 'document.querySelector("#updateLink").textContent === "Upgrade Markdown Vision"', 'graphical upgrade button');
    await click('#updateLink');
    await waitFor(window, '!document.querySelector("#restartAfterUpdate").hidden', 'restart option after installation');
    await evaluate(window, `window.__oldDirtyCheck = window.markdownVisionReader.hasUnsavedChanges; window.markdownVisionReader.hasUnsavedChanges = () => true; window.__desktopFixture.setScenario('keep-editing');`);
    await click('#restartAfterUpdate');
    await waitFor(window, 'window.__desktopFixture.calls.some(([name, action]) => name === "confirmDiscard" && action === "quit")', 'unsaved changes prompt before restart');
    assert.equal(await evaluate(window, 'window.__upgradeCalls.some(([name]) => name === "restart")'), false, 'cancelled restart keeps the app open');
    await evaluate(window, `window.markdownVisionReader.hasUnsavedChanges = () => false; void 0;`);
    await click('#restartAfterUpdate');
    await waitFor(window, 'window.__upgradeCalls.some(([name]) => name === "restart")', 'restart request');
    await evaluate(window, `window.markdownVisionReader.hasUnsavedChanges = window.__oldDirtyCheck; void 0;`);

    await editSource('# Quit handling draft\n');
    await evaluate(window, `window.__shutdownRequests = []; window.__markdownVisionRequestClose = async (quit = false) => { const action = quit ? 'quit' : 'close'; const discard = !window.markdownVisionReader.hasUnsavedChanges() || await window.desktop.confirmDiscard(action); if (discard) window.__shutdownRequests.push(action); }; window.__desktopFixture.setScenario('keep-editing'); window.__markdownVisionDispatchMenuCommand('quit')`);
    await waitFor(window, 'window.__desktopFixture.calls.some(([name, action]) => name === "confirmDiscard" && action === "quit")', 'Quit unsaved-change prompt');
    assert.deepEqual(await evaluate(window, 'window.__shutdownRequests'), [], 'choosing Keep Editing cancels Quit');
    await evaluate(window, `window.__desktopFixture.setScenario('default'); window.__markdownVisionDispatchMenuCommand('close')`);
    await waitFor(window, 'window.__shutdownRequests.includes("close")', 'Close menu dispatch');
    await evaluate(window, 'window.__markdownVisionDispatchMenuCommand("quit")');
    await waitFor(window, 'window.__shutdownRequests.includes("quit")', 'Quit menu dispatch');

    await checkLocalizedInterface(window, indexFile);
    writeLocaleScreenshotGallery();
    console.log('Renderer UI harness passed: Open/cancel/error, Save/Save As/cancel/error, Print, Search, Windows/macOS/Linux shortcut labels, toolbar/keyboard parity, async preference merge/persistence, About offline/current/newer states, Close/Quit menu prompts, and localized link dialogs and update status.');
  } finally {
    window.destroy();
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

app.whenReady().then(run).then(() => app.quit()).catch((error) => {
  console.error(error);
  app.exit(1);
});
