# Markdown Vision localization catalog

Source baseline: Markdown Vision 2.8.25. This catalog covers the shared reader and editor, accessibility labels, and app-owned native menus, dialogs, installer and updater messages. System-provided text and user documents are outside the catalog.

The 21 target locales cover 20 languages, with separate Simplified and Traditional Chinese locales. English is the source. This catalog contains machine translation drafts with targeted context and terminology corrections. Several strings outside the focused revisions still need translation or copy editing. Native review is needed for every locale.

Use the [localization release checklist](LOCALIZATION-RELEASE-CHECKLIST.md) to record native-language, rendered-interface, packaged-platform, and automated review evidence for each locale.

## Translator guidance

- Preserve placeholders, keyboard shortcuts, file extensions, and the symbols ↔ and ↕ where the English includes them.
- For this draft, keep **Markdown Vision**, **Markdown Vision Native**, and **Markdown** as written. Translate **Untitled.md** as a safe suggested filename, retaining the `.md` extension. Also preserve **Native** in the versioned edition name; translate words such as “Setup” or “Uninstall” in installer titles. Treat the translated filenames and the generic Spanish target as draft choices. Use neutral Spanish across regions and standard desktop UI phrasing in every locale.
- The translated **Uninstall** label is also used in the Windows Start menu shortcut name, followed by “ - Markdown Vision”. Keep it short and avoid Windows filename characters such as `:`, `/`, `\`, `?`, and `*`.
- Use the same translation of **Save As**, **Edit item**, **Edit note**, and **Remove item** when mentioning these actions in sentences. Drop the command’s ellipsis in prose and use the locale’s quotation conventions. These translations still require native review.
- In list-editing messages, **item** means an entry or bullet in a list, not an article or a product. Indent nests an entry under another; outdent moves it one level outward.
- In table guidance, the **underlying table** is the Markdown source for the whole table, not just its structure or a default table. For complex cell content, the instruction describes how to edit existing content, not how to obtain or view more complex content.
- In footnote guidance, **supported footnote text** refers to the portion that the visual editor can edit. Confirm the instruction does not imply that an entire footnote must be supported before it can be changed.
- Check typing instructions for an explicit location: users enter text directly inside the indicated code block or cell. In list-editing text, **item** means an entry, not a physical object.
- A **font** is a typeface or font family, not an individual character or glyph. A **fixed-width** or **monospaced** font uses the same character width; it does not mean single line spacing. Keep the names and hints for fixed-width and variable-width fonts distinct, and use each locale’s established term consistently in the setting labels, count labels, and no-match messages. Font-count labels use a single displayed form, so phrase each as a count label that reads naturally for any number, including one.
- The English column records the 2.8.25 source text and some proposed patterns. The console-only open error is listed for traceability.
- Keep English singular and plural pair keys as references.
- Catalog keys are stable identifiers and can retain wording from an earlier English source. Use the current English column and translator context as authoritative. The renderer selects count forms with `Intl.PluralRules` where needed and uses count labels where appropriate. Validate every category used by the locale, including zero, dual and other Arabic forms. Do not choose a translated branch with an English `count === 1` check.
- Brazilian Portuguese explicitly uses the plural form for a displayed zero count, even though its CLDR cardinal rule selects `one` for zero. Check both search and word counts at zero, one, and two.
- For the displayed word counter, edit the [word-count forms](#word-count-forms) table; the per-locale `{count} word` and `{count} words` rows are reference translations. For search results, edit the per-locale `{count} match` and `{count} matches` rows and, where present, the [additional search-result plural forms](#additional-search-result-plural-forms). An additional category overrides the corresponding general form.
- Test the Arabic interface in the running app. Check keyboard and visual order, the physical pane positions and separator, and mixed-direction paths, queries, shortcuts and search counts.
- Check key parity, placeholders, shortcuts, invisible characters, script consistency, and accidental English carryover. Terminology, register and sentence meaning also need native review.

Run `node tools/export-localization.cjs --check` to validate the catalog, `node tools/export-localization.cjs --check-generated` to detect stale generated resources, or `node tools/export-localization.cjs --check-release-ready` to require every locale's native-language, rendered-interface, and packaged-platform gates to pass with reviewer, date, build, and linked evidence recorded for each gate. Tagged GitHub releases, manual Linux/Fedora/macOS asset uploads, and branch builds that target an existing release enforce the readiness check. Run the script without a check option to write the draft translation data as JSON to standard output. The export includes source context, links to related command keys, the five pairs of English count references, language-selector labels, word-count forms, and additional search-result plural forms. The renderer uses locale-specific plural rules for search and word counts where those forms are needed; font counts use labels that do not require inflection. Console diagnostics and proposed labels appear in the separate `references` field. Keep existing keys when editing their English wording.

Source locations refer to the 2.8.25 baseline. In the working tree, the editor now segments scripts that commonly omit spaces between words when the webview supports it.
If the webview lacks word segmentation, the editor identifies counts containing those scripts as approximate because the whitespace-based count is only an estimate.

### Interface language and testing

In this working tree, the Settings panel contains a language selector. By default it follows the system language, including Simplified and Traditional Chinese; the user does not need to opt in to that behavior. Portuguese currently maps to Brazilian Portuguese. The chosen language takes effect the next time the app opens, so changing it does not interrupt an open document. The Tauri and Electron hosts also save the choice in their preferences. For testing, a query such as `?previewLocale=pl` temporarily overrides the saved choice.

Case-insensitive document search uses the selected interface language for casing. For example, Turkish distinguishes dotted and dotless I even if the operating system uses another language. A document can use a different language, so reviewers should also check multilingual searches and make this tradeoff explicit when reviewing search behavior.

The current translations cover search, settings, the formatting toolbar, editor layout and save controls, visual editing dialogs, the new-document confirmation, code-copy feedback, and the shared About and update messages. The Tauri host also receives translated menu and confirmation labels. The Windows native installer and its app-owned file dialogs have translated labels; platform-provided dialog controls follow the operating system language.

For a visual review aid, set `MARKDOWN_VISION_LOCALE_SCREENSHOTS` to an output directory before running `node tools/run-renderer-ui-harness.cjs`. The harness writes Settings and Search panel PNGs with an empty search field for each locale using a 480×700 CSS-pixel window, plus Editor, About, new-file confirmation, visual-link dialog, and script-fallback samples at 1000×750 CSS pixels, then restores its test viewport. It also writes an `index.html` gallery that groups the captures by locale and verifies the full screenshot set exists. The Search capture shows the localized placeholder and zero-result count. The script samples use each language's native name in reader prose and a code block to reveal missing glyphs or poor font fallback. These captures help reviewers compare translated labels and wrapping; they do not replace the rendered-interface review of other screens, scripts, accessibility, or packaged builds.

Run `node tools/export-localization.cjs --sync-preview` after updating application text, count forms, or language-selector labels. This regenerates the messages used by the shared renderer, including the selector definitions. Run `--check-generated` to detect any stale generated files before building.

The Windows native installer uses `native-cpp/installer-localization.nsh`, generated with `node tools/export-localization.cjs --sync-installer`. Its standard pages and custom messages follow the Windows interface language when supported. The native installer build regenerates this file from the catalog.

Windows startup errors that occur before the webview loads use the Windows display language, since the app's saved language is not yet available. The Windows Explorer preview handler also uses the Windows display language for file-read errors because it runs outside the app. The generated native and managed Windows translations are updated with `node tools/export-localization.cjs --sync-startup`.

Run `dotnet run --project tools/managed-startup-tests/ManagedStartupTests.csproj` to check the managed Windows startup locale selection and error-detail formatting.

macOS document type names are generated into `native-tauri/macos-localizations` with `node tools/export-localization.cjs --sync-macos`. The macOS build checks that these resources are present in the app bundle; Finder behavior still needs testing on macOS.

DEB and RPM launchers use `native-tauri/launcher.desktop`, generated with `node tools/export-localization.cjs --sync-launcher`. The AppImage bundler also uses the DEB desktop template when preparing its contents. Desktop environments select the translated generic app description using their own locale; the in-app language setting does not change system launcher metadata. Package validation checks the descriptions in the DEB, RPM, and AppImage artifacts.

Run `node tools/export-localization.cjs --check-generated` to verify the generated renderer, installer, Windows startup, Linux launcher and macOS translations match the catalog. The package build scripts run this check before assembling application assets. `node tools/test-localization-generation.cjs` checks that each stale generated output is rejected using temporary copies.

The native Windows build and Tauri staging also run `node tools/check-native-error-localization.cjs` to check the supported language lists and that recognized native updater, save and dialog messages have renderer translations.

- **Polish**: Compare zero, one, two, five, twelve and twenty-two words or search results to check the plural forms. Zero uses the `many` form, so a zero-result search should read naturally as `0 wyników wyszukiwania`.
- **Japanese**: Enter a sentence without spaces to check word segmentation. Navigate search hits and check that the total comes first.
- **Arabic**: Check the ordering of the count, current search hit, and scope. Type a Latin font name and check the placement of the quotation marks around it. The toolbar, search, settings, editor header and status, and new-document confirmation use right-to-left order; check the remaining controls and physical split-pane positions separately in a running app.

## Word-count forms

These forms are used by the editor word counter. Each value is a JSON string or an object of plural categories; preserve `{count}` in every form.

| Locale | Forms |
| --- | --- |
| ar | "عدد الكلمات: {count}" |
| zh-hans | "{count} 个词" |
| zh-hant | "{count} 個詞" |
| cs | {"one":"{count} slovo","few":"{count} slova","other":"{count} slov"} |
| nl | {"one":"{count} woord","other":"{count} woorden"} |
| fr | {"one":"{count} mot","other":"{count} mots"} |
| de | {"one":"{count} Wort","other":"{count} Wörter"} |
| hi | "{count} शब्द" |
| id | "{count} kata" |
| it | {"one":"{count} parola","other":"{count} parole"} |
| ja | "{count} 語" |
| ko | "단어 {count}개" |
| pl | {"one":"{count} słowo","few":"{count} słowa","many":"{count} słów","other":"{count} słowa"} |
| pt-br | {"one":"{count} palavra","other":"{count} palavras"} |
| ru | {"one":"{count} слово","few":"{count} слова","many":"{count} слов","other":"{count} слова"} |
| es | {"one":"{count} palabra","other":"{count} palabras"} |
| sv | "{count} ord" |
| th | "{count} คำ" |
| tr | "{count} kelime" |
| uk | {"one":"{count} слово","few":"{count} слова","many":"{count} слів","other":"{count} слова"} |
| vi | "{count} từ" |

## Additional search-result plural forms

These forms supplement the singular and plural search-result messages for locales that need additional categories. Preserve `{count}` in every form.

| Locale | Forms |
| --- | --- |
| cs | {"few":"{count} výsledky hledání","other":"{count} výsledků hledání"} |
| pl | {"few":"{count} wyniki wyszukiwania","many":"{count} wyników wyszukiwania","other":"{count} wyniku wyszukiwania"} |
| ru | {"few":"{count} результата поиска"} |
| uk | {"few":"{count} результати пошуку"} |

## Language selector

Each JSON array contains the language name, the language label, the restart notice, and the system-language option, in that order.

| Locale | Labels |
| --- | --- |
| en | ["English","Language","Restart the app to change the language.","System language"] |
| ar | ["العربية","اللغة","أعد تشغيل التطبيق لتغيير اللغة.","لغة النظام"] |
| zh-hans | ["简体中文","语言","重新启动应用以更改语言。","系统语言"] |
| zh-hant | ["繁體中文","語言","重新啟動應用程式以變更語言。","系統語言"] |
| cs | ["Čeština","Jazyk","Změna jazyka se projeví po restartování aplikace.","Jazyk systému"] |
| nl | ["Nederlands","Taal","Start de app opnieuw om de taal te wijzigen.","Systeemtaal"] |
| fr | ["Français","Langue","Redémarrez l’application pour changer de langue.","Langue du système"] |
| de | ["Deutsch","Sprache","Starten Sie die App neu, um die Sprache zu ändern.","Systemsprache"] |
| hi | ["हिन्दी","भाषा","भाषा बदलने के लिए ऐप फिर से शुरू करें।","सिस्टम की भाषा"] |
| id | ["Bahasa Indonesia","Bahasa","Mulai ulang aplikasi untuk mengubah bahasa.","Bahasa sistem"] |
| it | ["Italiano","Lingua","Riavvia l’app per cambiare lingua.","Lingua di sistema"] |
| ja | ["日本語","言語","言語を変更するにはアプリを再起動してください。","システムの言語"] |
| ko | ["한국어","언어","언어를 변경하려면 앱을 다시 시작하세요.","시스템 언어"] |
| pl | ["Polski","Język","Uruchom ponownie aplikację, aby zmienić język.","Język systemu"] |
| pt-br | ["Português (Brasil)","Idioma","Reinicie o aplicativo para alterar o idioma.","Idioma do sistema"] |
| ru | ["Русский","Язык","Перезапустите приложение, чтобы изменить язык.","Язык системы"] |
| es | ["Español","Idioma","Reinicie la aplicación para cambiar el idioma.","Idioma del sistema"] |
| sv | ["Svenska","Språk","Starta om appen för att byta språk.","Systemspråk"] |
| th | ["ไทย","ภาษา","เริ่มแอปใหม่เพื่อเปลี่ยนภาษา","ภาษาของระบบ"] |
| tr | ["Türkçe","Dil","Dili değiştirmek için uygulamayı yeniden başlatın.","Sistem dili"] |
| uk | ["Українська","Мова","Перезапустіть програму, щоб змінити мову.","Мова системи"] |
| vi | ["Tiếng Việt","Ngôn ngữ","Khởi động lại ứng dụng để đổi ngôn ngữ.","Ngôn ngữ hệ thống"] |

## Contents

- [Word-count forms](#word-count-forms)
- [Additional search-result plural forms](#additional-search-result-plural-forms)
- [Language selector](#language-selector)
- [English source and locations](#english-source-and-locations)
- [Arabic](#locale-ar)
- [Chinese (Simplified)](#locale-zh-hans)
- [Chinese (Traditional)](#locale-zh-hant)
- [Czech](#locale-cs)
- [Dutch](#locale-nl)
- [French](#locale-fr)
- [German](#locale-de)
- [Hindi](#locale-hi)
- [Indonesian](#locale-id)
- [Italian](#locale-it)
- [Japanese](#locale-ja)
- [Korean](#locale-ko)
- [Polish](#locale-pl)
- [Portuguese (Brazil)](#locale-pt-br)
- [Russian](#locale-ru)
- [Spanish](#locale-es)
- [Swedish](#locale-sv)
- [Thai](#locale-th)
- [Turkish](#locale-tr)
- [Ukrainian](#locale-uk)
- [Vietnamese](#locale-vi)

## English source and locations

| Key | English | Source locations | Translator context |
| --- | --- | --- | --- |
| `markdown_formatting_bc5026` | Markdown formatting | `src/web/index.html:13` | Group label for the toolbar commands that format document text using Markdown. |
| `undo_a8283a` | Undo | `src/web/index.html:14` | Toolbar command that reverses the most recent editing action. |
| `redo_742739` | Redo | `src/web/index.html:15` | Toolbar command that reapplies the most recently undone editing action. |
| `bold_ctrl_b_84787d` | Bold (Ctrl+B) | `src/web/index.html:17` | Toolbar command that toggles bold formatting for the current selection or typing position. Keep the shortcut unchanged. |
| `bold_94fee6` | Bold | `src/web/index.html:17` | Accessible name for the bold-formatting toolbar button. |
| `italic_ctrl_i_ccc60d` | Italic (Ctrl+I) | `src/web/index.html:18` | Toolbar command that toggles italic formatting for the current selection or typing position. Keep the shortcut unchanged. |
| `italic_9bf37c` | Italic | `src/web/index.html:18` | Accessible name for the italic-formatting toolbar button. |
| `strikethrough_9aabbc` | Strikethrough | `src/web/index.html:19` | Toolbar command that applies or removes strikethrough formatting. |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Cycle heading level (H1–H6, then normal text) | `src/web/index.html:20` | Toolbar action. Advance through H1 to H6 and then ordinary paragraph text. |
| `cycle_heading_level_bde9c4` | Cycle heading level | `src/web/index.html:20` | Accessible name for the toolbar button that advances through document heading levels. |
| `bulleted_list_ce51b3` | Bulleted list | `src/web/index.html:21` | Toolbar command that starts or toggles an unordered list. |
| `task_list_5d3253` | Task list | `src/web/index.html:22` | Toolbar action to insert a Markdown list with a checkbox for each task. |
| `numbered_list_cc62f6` | Numbered list | `src/web/index.html:23` | Toolbar command that starts or toggles an ordered, numbered list. |
| `quote_eb4cde` | Quote | `src/web/index.html:24` | Markdown blockquote formatting. |
| `inline_code_e767de` | Inline code | `src/web/index.html:25` | Toolbar action to format a short span of text as code within a paragraph. |
| `code_block_754538` | Code block | `src/web/index.html:26` | Toolbar action to insert a separate block of computer code. |
| `link_a6a32d` | Link | `src/web/index.html:27` | Toolbar action to insert a clickable hyperlink. |
| `insert_table_67318e` | Insert table | `src/web/index.html:28` | Toolbar command that inserts a Markdown table at the current editing position. |
| `edit_markdown_6ff388` | Edit Markdown | `src/web/editor-ui.js:2248`, `src/web/editor-ui.js:2249`, `src/web/index.html:30` | Command that switches from visual editing to editing the Markdown source. |
| `new_markdown_file_ctrl_n_f22ed5` | New Markdown file (Ctrl+N) | `src/web/index.html:33` | Command that starts a new document in the visual editor. Preserve the shortcut. |
| `new_markdown_file_0928e9` | New Markdown file | `src/web/index.html:33` | Command that starts a new document in the visual editor. |
| `open_markdown_file_b7764a` | Open Markdown file | `native-cpp/WebViewHost.cpp:264`, `native-windows/MainWindow.xaml.cs:119`, `src/electron/main.cjs:149`, `src/web/index.html:36` | File-picker title or toolbar command for opening an existing Markdown document. |
| `print_ctrl_p_5c4406` | Print (Ctrl+P) | `src/web/index.html:41` | Toolbar command that opens the platform print dialog for the current document. Preserve the shortcut. |
| `print_document_2a024b` | Print document | `src/web/index.html:41` | Accessible name for the toolbar button that prints the current document. |
| `search_text_38d268` | Search text | `src/web/index.html:45`, `src/web/index.html:77` | Accessible name and tooltip for the toolbar button that opens document search. Use a natural action label meaning “find text in this document.” |
| `settings_74a883` | Settings | `src/web/index.html:49`, `src/web/index.html:89`, `src/web/index.html:91` | Name of the application preferences panel, not device or operating-system settings. |
| `switch_to_dark_mode_fc43ea` | Switch to dark mode | `src/web/index.html:53` | Action that changes the app’s color theme to dark. |
| `about_markdown_vision_08f9a5` | About Markdown Vision | `native-tauri/src/main.rs:83`, `src/web/index.html:58` | Label for the app’s About panel. Preserve the product name. |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd | `src/web/index.html:61` | Copyright attribution in the About panel. Preserve the name and year exactly. |
| `gnu_gplv3_license_6ae397` | GNU GPLv3 license | `src/web/index.html:62` | Link label to the application’s GNU GPL version 3 license. Preserve the license name. |
| `version_version_a18745` | Version {version} | `src/web/index.html:65` | About-panel label followed by the installed app version. Preserve the version placeholder. |
| `latest_version_checking_4bfedc` | Latest version: checking… | `src/web/app.js:1312`, `src/web/index.html:66` | Temporary status shown while the app checks the release service for a newer version. |
| `update_c1c100` | Update | `src/web/index.html:67` | Update the application to a newer version. |
| `update_text_editor` | Update text | `src/web/editor-ui.js:1798` | Apply the edited text in a visual editing dialog. |
| `keep_unchanged_editor` | Keep unchanged | `src/web/editor-ui.js:1798` | Leave the document unchanged when no other operation is selected in a visual editing dialog. |
| `check_for_updates_f26f32` | Check for updates | `src/web/index.html:68` | Command that checks whether a newer application release is available. |
| `restart_markdown_vision_7e50f8` | Restart Markdown Vision | `src/web/index.html:69` | Command that closes and relaunches the app so an installed update can take effect. |
| `text_search_10155f` | Text search | `src/web/index.html:75` | Heading for the document-search pane. Keep it distinct from the toolbar button label, which is an action. |
| `count_match_ef9195` | {count} match | `src/web/app.js:757`, `src/web/index.html:78` | Number of search hits in the document. Use the locale’s count rules. |
| `count_matches_43682a` | {count} matches | `src/web/app.js:757`, `src/web/index.html:78` | Plural reference for the document search hit count. |
| `previous_match_daa2f8` | Previous match | `src/web/index.html:79` | Navigate to the preceding text search hit. |
| `next_match_825e5a` | Next match | `src/web/index.html:82` | Navigate to the next text search hit. |
| `close_search_55656b` | Close search | `src/web/index.html:85` | Accessible name for the button that closes the document-search panel. |
| `close_settings_0ccfef` | Close settings | `src/web/index.html:92` | Accessible name for the button that closes the app’s settings panel. |
| `variable_width_font_0836b2` | Variable-width font | `src/web/index.html:95` | Text font with proportional character widths. |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Type a font name or choose an installed font. | `src/web/index.html:107` | Help text for the font picker search field. Users can filter the installed fonts by typing or select a font from the list. |
| `fixed_width_font_3de094` | Fixed-width font | `src/web/index.html:109` | Font with equal character widths, used for code. |
| `used_for_code_and_other_monospaced_text_84b6ed` | Used for code and other monospaced text. | `src/web/index.html:121` | Hint under the fixed-width font picker explaining where the selected font is applied. |
| `text_size_d68761` | Text size | `src/web/index.html:122` | Label for the slider that changes the reader’s text size. It refers to font size, not the overall zoom level or page dimensions. |
| `automatic_text_size_919785` | Automatic text size | `src/web/index.html:123` | Option in the text-size selector that lets the app choose a size suited to the current window and display. |
| `automatic_d461a4` | Automatic | `src/web/index.html:123`, `src/web/index.html:128` | Option to let the app choose the text size or reading-column width based on the display and window. |
| `line_spacing_0db45d` | Line spacing | `src/web/index.html:125` | Label for the slider controlling the vertical distance between lines of text. |
| `page_width_limit_19528b` | Page width limit | `src/web/index.html:127` | Label for the maximum reading-column width. It limits line length; it does not set the application window width. |
| `automatic_page_width_bd5c30` | Automatic page width | `src/web/index.html:128` | Option in the page-width selector that lets the app adapt the reading column to the available window width. |
| `markdown_editor_da0ea6` | Markdown editor | `src/web/index.html:134` | Text editor for raw Markdown source. |
| `editor_view_1d1833` | Editor view | `src/web/index.html:137` | Group label for choosing an editor layout. |
| `markdown_0e52f6` | Markdown | `native-tauri/src/document.rs:132`, `native-tauri/src/document.rs:156`, `src/electron/main.cjs:152`, `src/web/index.html:138` | Name of the Markdown source pane and document format. Keep “Markdown” untranslated. |
| `markdown_left_visual_right_763989` | Markdown left, Visual right | `src/web/index.html:139` | Tooltip describing the physical positions of the two editor panes. Confirm positions in RTL. |
| `split_0b61a1` | Split ↔ | `src/web/index.html:139` | Place editor panes side by side. Preserve the horizontal arrow. |
| `visual_above_markdown_a04e0f` | Visual above Markdown | `src/web/index.html:140` | The rich text editor pane is physically above the Markdown source pane. |
| `split_b3b924` | Split ↕ | `src/web/index.html:140` | Stack editor panes vertically. Preserve the vertical arrow. |
| `visual_ba3033` | Visual | `src/web/index.html:141` | Switch to the rich text editor pane only. |
| `save_ctrl_s_4be89e` | Save (Ctrl+S) | `src/web/index.html:144` | Command that writes the current document’s edits to its file. Preserve the shortcut. |
| `save_1509f5` | Save | `native-tauri/src/main.rs:60`, `src/web/index.html:144`, `src/web/index.html:188` | File-menu command or dialog button that writes the current document’s edits to its file. |
| `save_as_ctrl_shift_s_0f132a` | Save As (Ctrl+Shift+S) | `src/web/index.html:145` | Save a new copy. This is a tooltip with a shortcut. |
| `save_as_a4b76a` | Save As… | `native-tauri/src/main.rs:62`, `src/web/index.html:145` | Command that opens the save dialog. Use the same translated label in instructions, without the ellipsis. |
| `markdown_source_580118` | Markdown source | `src/web/index.html:150`, `src/web/index.html:151`, `src/web/index.html:152` | Raw Markdown source text, distinct from the choice of font. |
| `markdown_pane_width_ab0129` | Markdown pane width | `src/web/editor-ui.js:2148`, `src/web/index.html:154` | Accessible label for the divider that resizes the Markdown editor panel. |
| `percent_markdown_0a45d1` | {percent}% Markdown | `src/web/index.html:154` | Percentage of the editing split assigned to the Markdown source pane. Preserve the percentage placeholder. |
| `percent_visual_a8635d` | {percent}% Visual | `src/web/index.html:154` | Percentage of the editing split assigned to the Visual pane. Preserve the percentage placeholder. |
| `visual_editor_5665dd` | Visual editor | `src/web/index.html:157`, `src/web/index.html:158` | The rich text editor pane, where editing is visual. |
| `visual_editing_restriction_d42cea` | Visual editing restriction | `src/web/index.html:159` | Heading for guidance about content the visual editor cannot safely modify; users can switch to Markdown editing. |
| `edit_in_markdown_165fd4` | Edit in Markdown | `src/web/editor-ui.js:1162`, `src/web/editor-ui.js:739`, `src/web/index.html:162` | Action that opens the current item’s Markdown source for editing when the visual editor cannot safely represent its structure. |
| `dismiss_48845b` | Dismiss | `src/web/index.html:163` | Hide the visual editing restriction notice. |
| `count_word_1f505c` | {count} word | `src/web/editor-ui.js:312`, `src/web/index.html:169` | Singular reference for the editor status bar. The count describes the open document. |
| `count_words_caab29` | {count} words | `src/web/editor-ui.js:312`, `src/web/index.html:169` | Plural reference for the editor status bar. Scripts that commonly omit spaces use word segmentation when available; otherwise the separate approximate-count message is shown. |
| `approximate_word_count_7b987a` | Approximate word count: {count} | `src/web/editor-ui.js:350` | Status shown when word segmentation is unavailable for a script that commonly omits spaces. Preserve {count}; this is an estimate. |
| `line_line_column_column_21e9f4` | Line {line}, column {column} | `src/web/editor-ui.js:2140`, `src/web/index.html:169` | Cursor position in the Markdown source. Both numbers begin at one. Column means position on the text line. |
| `untitled_md_2dccf8` | Untitled.md | `native-cpp/WebViewHost.cpp:271`, `native-tauri/src/document.rs:157`, `src/web/app.js:953`, `src/web/editor-ui.js:2243`, `src/web/editor-ui.js:29`, `src/web/editor-ui.js:3024`, `src/web/index.html:173` | Suggested name for a new document. |
| `save_your_changes_56dd16` | Save your changes? | `src/web/index.html:183` | Confirmation before leaving or replacing a document with unsaved edits. |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Save your current document before creating a new file. | `src/web/index.html:184` | Prompt detail explaining that the current document must be saved before starting another one. |
| `cancel_19766e` | Cancel | `native-tauri/src/main.rs:273`, `native-tauri/src/main.rs:277`, `src/web/editor-ui.js:1760`, `src/web/index.html:186` | Back out of the dialog and keep the current state. |
| `discard_changes_f9bfa3` | Discard changes | `src/web/index.html:187` | Abandon unsaved edits. |
| `switch_to_light_mode_bfa0ca` | Switch to light mode | `src/web/app.js:181` | Switch the interface from dark to light appearance. |
| `enter_the_name_of_any_installed_font_b57a72` | Enter the name of any installed font. | `src/web/app.js:1254`, `src/web/app.js:1264`, `src/web/app.js:312` | Placeholder inviting one font name. |
| `loading_installed_fonts_200c74` | Loading installed fonts… | `src/web/app.js:312` | Status while enumerating fonts installed on the system. |
| `count_fixed_width_font_available_5488f8` | {count} fixed-width font available. | `src/web/app.js:317` | Reference translation for the fixed-width font-count label; preserve {count}. |
| `count_fixed_width_fonts_available_5df530` | {count} fixed-width fonts available. | `src/web/app.js:317` | Displayed fixed-width font-count label for every count. Use a count-label construction that reads naturally at zero, one, and higher counts; preserve {count}. |
| `count_variable_width_font_available_583582` | {count} variable-width font available. | `src/web/app.js:317` | Reference translation for the proportional font-count label; preserve {count}. |
| `count_variable_width_fonts_available_9d234c` | {count} variable-width fonts available. | `src/web/app.js:317` | Displayed proportional font-count label for every count. Use a count-label construction that reads naturally at zero, one, and higher counts; preserve {count}. |
| `count_match_for_query_2e77ac` | {count} match for "{query}". | `src/web/app.js:321` | Number of font names matching the typed query. |
| `count_matches_for_query_7db710` | {count} matches for "{query}". | `src/web/app.js:321` | Plural reference for the count of installed font names matching the current query. Translations may naturally phrase these as matching or search results. |
| `no_fixed_width_fonts_match_query_fb1fab` | No fixed-width fonts match "{query}". | `src/web/app.js:322` | No matching monospaced font name. |
| `no_variable_width_fonts_match_query_a64030` | No variable-width fonts match "{query}". | `src/web/app.js:322` | No matching proportional font name. |
| `current_of_total_35d900` | {current} of {total} | `src/web/app.js:756` | Position among search hits, for example 3 of 10. |
| `current_of_total_scope_94ebe5` | {current} of {total} · {scope} | `src/web/app.js:756` | Position among search hits plus the editor pane or view where searching takes place. |
| `copy_code_49a005` | Copy code | `src/web/app.js:889`, `src/web/app.js:890` | Button that copies one code block. |
| `clipboard_unavailable_4ff69f` | Clipboard unavailable | `src/web/app.js:923` | Error shown when the platform clipboard API cannot be accessed while copying a code block. |
| `code_copied_39868c` | Code copied | `src/web/app.js:946` | Confirmation after successfully copying a code block. |
| `could_not_copy_code_4a563f` | Could not copy code | `src/web/app.js:947` | Error shown after the attempt to copy a code block to the clipboard fails. |
| `the_native_print_dialog_could_not_open_320714` | The system print dialog could not open. | `src/web/app.js:1009` | Error shown when the desktop host cannot open the operating system or WebView print dialog. “System” means supplied by the platform, not a dialog built into Markdown Vision. |
| `could_not_open_the_print_dialog_4bd85a` | Could not open the print dialog. | `src/web/app.js:1015` | Error shown when the browser print dialog cannot be opened in the web-based preview. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Discard your unsaved changes and open another document? | `native-tauri/bridge.js:12`, `src/web/app.js:1057` | Confirmation shown before replacing the current document. If accepted, unsaved edits are discarded and another file opens. |
| `could_not_open_document_69abda` | Could not open document: | `src/web/app.js:1069`, `src/web/app.js:1466` | Developer console log. Exclude from user-facing translation exports. |
| `release_check_failed_7b2758` | Release check failed | `src/web/app.js:1326` | Error heading when the app cannot retrieve or process the published release information. |
| `unrecognized_release_list_62d1cb` | Unrecognized release list | `src/web/app.js:1328` | Error detail for a release response whose list of releases is missing or has an unexpected format. |
| `unrecognized_version_d1b8d2` | Unrecognized version | `src/web/app.js:1333` | Error detail when a release entry does not contain a valid version number. |
| `latest_version_version_d1c996` | Latest version: {version} | `src/web/app.js:1334` | Status showing the newest application version found by the release check. Preserve the version placeholder. |
| `unsupported_architecture_087e4f` | Unsupported architecture | `src/web/app.js:1340`, `src/web/app.js:1354` | Error shown when no release package is provided for the computer’s processor architecture, such as x64 or ARM64. |
| `installer_verification_is_unavailable_98306d` | Installer verification is unavailable | `src/web/app.js:1344` | Error detail explaining that the app cannot verify the downloaded installer’s integrity on this platform. |
| `unsupported_platform_a96892` | Unsupported platform | `src/web/app.js:1351` | Error shown when automatic installation is not supported for the current operating system. |
| `latest_compatible_version_version_fa3079` | Latest compatible version: {version} | `src/web/app.js:1374`, `src/web/app.js:1378` | Status naming the newest release available for this operating system and processor architecture. Preserve the version placeholder. |
| `upgrade_markdown_vision_de1b45` | Upgrade Markdown Vision | `src/web/app.js:1385` | Button that starts the in-app update for the current platform. It does not open a generic download page. |
| `download_macos_update_95d8f3` | Download macOS update | `src/web/app.js:1386` | Link to download the macOS update when automatic installation is unavailable. |
| `download_linux_update_707c5e` | Download Linux update | `src/web/app.js:1386` | Link to download the Linux update when automatic installation is unavailable. |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Unable to check for updates. Check your internet connection and try again. | `src/web/app.js:1389` | Error shown when the release service cannot be reached; it suggests checking connectivity and retrying. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Downloading and verifying the update. You may be asked to authenticate. | `src/web/app.js:1410` | Progress status. An operating system prompt may ask for authentication. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Update installed. Restart to use the new version. | `src/web/app.js:1415` | Status after an update has been installed. The new version takes effect only after restarting the app. |
| `update_failed_error_e4f7dc` | Update failed: {error} | `src/web/app.js:1418` | Error status when downloading or installing the Linux update fails. Preserve the appended error-detail placeholder. |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Download and run the Markdown Vision installer? Save any open documents first. Setup may ask to close Markdown Vision. | `src/web/app.js:1428` | Installer confirmation shown before download and launch. |
| `downloading_and_verifying_update_02b3ba` | Downloading and verifying update… | `src/web/app.js:1432` | Progress status while the update package is downloaded and its integrity is checked. |
| `installer_started_865e10` | Installer started. | `src/web/app.js:1434` | Status confirming that the downloaded platform installer has launched. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Could not download, verify, or start the installer. Please try again. | `src/web/app.js:1436` | Recovery message when any stage of getting or launching the platform installer fails. |
| `discard_unsaved_changes_and_restart_6d1602` | Discard unsaved changes and restart? | `src/web/app.js:1446` | Confirmation before restarting after an update. If accepted, unsaved document edits are discarded. |
| `could_not_restart_error_71e2d2` | Could not restart: {error} | `src/web/app.js:1454` | Error shown when the app fails to relaunch after an update. Preserve the appended error-detail placeholder. |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Double-click or press Alt+Enter to edit this item | `src/web/editor-ui.js:59` | Two alternatives for opening the item editor: double-click, or press the shortcut. |
| `saving_23e392` | Saving… | `src/web/editor-ui.js:308` | Progress status while writing a document to disk. |
| `unsaved_6250d5` | Unsaved | `src/web/editor-ui.js:308` | Brief document-status label indicating there are edits not yet written to the file. |
| `saved_b5c120` | Saved | `src/web/editor-ui.js:308` | Brief document-status label indicating the latest edits were written to the file. |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Could not save the draft. Your edits are still open. | `src/web/editor-ui.js:340`, `src/web/editor-ui.js:359` | Save-error status reassuring users that their unsaved edits remain open in the editor. |
| `embedded_content_1bca8f` | Embedded content | `src/web/editor-ui.js:419` | Label for content nested inside a Markdown block, such as a child element in a quote or list. |
| `edit_table_source_c7189f` | Edit table source | `src/web/editor-ui.js:1031`, `src/web/editor-ui.js:480` | Action that switches from visual table editing to editing the table’s Markdown source. |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Select a cell to edit it or change the table. Press Alt+Enter while typing. | `src/web/editor-ui.js:559` | Instruction for a visual table: select a cell to type in it, or use Alt+Enter to open table-structure options. Preserve the shortcut. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | This block contains formatting that needs to be edited in Markdown. | `src/web/editor-ui.js:575` | Notice that this content includes formatting the visual editor cannot safely change; edit its source in Markdown. |
| `code_contents_5a1f26` | Code contents | `src/web/editor-ui.js:581` | Label for the text inside a code block, distinguishing it from the block’s Markdown delimiters. |
| `type_directly_to_edit_this_indented_code_block_769291` | Type directly to edit this indented code block. | `src/web/editor-ui.js:590` | Instruction for an indented code block that can be edited by typing directly into it. “Indented” describes Markdown code-block syntax. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Type directly in the code block to edit its contents. Use Markdown to edit the lines that mark where it starts and ends. | `src/web/editor-ui.js:591` | Instruction for an editable fenced code block. Users can change the code directly but must use Markdown to change its opening or closing fence. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Use Edit item to change the text. To change the nesting, edit the list in Markdown. | `src/web/editor-ui.js:595` | Refer to the translated Edit item action. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Use Edit item or the checkboxes to change this list. | `src/web/editor-ui.js:596` | Refer to the translated Edit item action. |
| `edit_list_item_text_a982e6` | Edit list item text | `src/web/editor-ui.js:631`, `src/web/editor-ui.js:787`, `src/web/editor-ui.js:851` | Action for editing the words in a list entry; it does not edit the list’s Markdown markers or nesting. |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Edit item text directly. Edit the list structure in Markdown. | `src/web/editor-ui.js:635` | For list entries, “item” means one entry or bullet. The text is directly editable; markers and nesting must be changed in Markdown. |
| `task_4bc74b` | Task | `src/web/editor-ui.js:646` | Label for a Markdown task-list item (a checklist entry), not a work assignment in the application. |
| `edit_item_9f84ee` | Edit item | `src/web/editor-ui.js:651` | Edit a list item, including a task list item. |
| `list_options_fc3320` | List options | `src/web/editor-ui.js:1836`, `src/web/editor-ui.js:658` | Menu for changing a Markdown list. |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | This table needs to be edited in Markdown. | `src/web/editor-ui.js:663` | Notice explaining that the table contains structure the visual editor cannot safely change. |
| `add_text_to_this_empty_cell_37f900` | Add text to this empty cell | `src/web/editor-ui.js:680` | Instruction to type content into an empty Markdown table cell. |
| `edit_this_cell_in_markdown_4304b1` | Edit this cell in Markdown | `src/web/editor-ui.js:1161`, `src/web/editor-ui.js:685` | Action for editing the selected cell’s Markdown source when its content cannot be safely edited visually. |
| `edit_table_cell_a4212e` | Edit table cell | `src/web/editor-ui.js:1972`, `src/web/editor-ui.js:2000`, `src/web/editor-ui.js:685`, `src/web/editor-ui.js:718` | Action for editing the contents of one table cell. Use the table-specific meaning of “cell,” not a spreadsheet application or phone cell. |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Select a cell to edit it. You can edit the underlying table in Markdown. | `src/web/editor-ui.js:687` | Edit a table cell or edit the source table as Markdown. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | This cell contains HTML. Edit this cell in Markdown. | `src/web/editor-ui.js:691` | Notice that a table cell contains HTML syntax and must be edited in the Markdown source. Preserve HTML and Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | This cell uses Markdown references. Edit this cell in Markdown. | `src/web/editor-ui.js:692` | Notice that a table cell uses reference-style Markdown syntax and must be edited in the Markdown source. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Type to edit this cell. Press Alt+Enter for table options. | `src/web/editor-ui.js:720` | Instruction for editing the selected table cell; Alt+Enter opens the table options. Preserve the shortcut. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Type directly in plain cells. Use table options or edit the Markdown for more complex content. | `src/web/editor-ui.js:721` | “Plain cells” contain only text or line breaks and can be edited directly. Richer cell content requires table options or Markdown editing. |
| `table_options_cf924a` | Table options | `src/web/editor-ui.js:727` | Menu for changing rows, columns or alignment in a Markdown table. |
| `edit_note_299e60` | Edit note | `src/web/editor-ui.js:732` | Edit the text of a Markdown footnote. |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Use Edit note to change supported footnote text. | `src/web/editor-ui.js:734` | Refer to the translated Edit note action. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | This layout uses HTML. Edit it in Markdown. | `src/web/editor-ui.js:736` | Notice that the layout is written in HTML and its structure must be edited in the Markdown source. Preserve HTML and Markdown. |
| `edit_inline_code_bf93ee` | Edit inline code | `src/web/editor-ui.js:787` | Action for editing code formatted within a text line, not a fenced code block. |
| `edit_list_structure_in_markdown_17a222` | Edit list structure in Markdown | `src/web/editor-ui.js:800` | Action for changing list markers, ordering, or nesting in the Markdown source. |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Edit the plain list text directly. Edit the list structure in Markdown. | `src/web/editor-ui.js:871` | Instruction for list entries whose text can be edited directly; markers and nesting remain in the Markdown source. |
| `edit_code_in_table_cell_535cb9` | Edit code in table cell | `src/web/editor-ui.js:921` | Action for editing code contained inside one table cell. |
| `edit_table_cell_text_ca30e7` | Edit table cell text | `src/web/editor-ui.js:950` | Action for editing the plain-text contents of one table cell. |
| `edit_preformatted_text_9737bd` | Edit preformatted text | `src/web/editor-ui.js:950` | Accessible label for editing text in an HTML preformatted element, which preserves spaces and line breaks. |
| `edit_disclosure_title_79fb92` | Edit disclosure title | `src/web/editor-ui.js:950` | Accessible label for editing the visible summary of an expandable HTML details element. |
| `edit_text_7967d9` | Edit text | `src/web/editor-ui.js:950` | Generic short action label for editing text when no more specific table-cell, preformatted-text, or disclosure-title label applies. |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Type in the cell text. Press Alt+Enter for cell options. | `src/web/editor-ui.js:1025` | Instruction for editing text inside a table cell; Alt+Enter opens cell options. Preserve the shortcut. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Edit the text directly. Edit the surrounding structure in Markdown. | `src/web/editor-ui.js:1028` | Instruction that text is editable here while its enclosing structure must be changed in Markdown. |
| `edit_structure_in_markdown_fe607e` | Edit structure in Markdown | `src/web/editor-ui.js:1031` | Action for changing a table’s Markdown syntax, such as its rows, columns, or alignment markers. |
| `edit_quoted_text_9de474` | Edit quoted text | `src/web/editor-ui.js:1054` | Action for editing the words inside a Markdown block quote. |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Edit the plain text directly. Edit the quote structure in Markdown. | `src/web/editor-ui.js:1062` | Quote means Markdown blockquote. |
| `edit_heading_text_f3806c` | Edit heading text | `src/web/editor-ui.js:1093` | Action for editing a heading’s wording, not its Markdown heading level. |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Edit the heading text directly. Edit the heading style in Markdown. | `src/web/editor-ui.js:1099` | Instruction that heading wording is editable directly, but its Markdown level or style must be changed in the source. |
| `heading_style_c0c25b` | Heading style | `src/web/editor-ui.js:1101`, `src/web/editor-ui.js:1868` | Formatting level of a document heading. |
| `edit_this_item_in_markdown_83b112` | Edit this item in Markdown | `src/web/editor-ui.js:1162` | Action for editing the selected list item in Markdown, including its markers or nesting. |
| `markdown_only_f6e1f7` | Markdown only | `src/web/editor-ui.js:1646` | Editor-layout option showing only the Markdown source pane. |
| `visual_only_29a136` | Visual only | `src/web/editor-ui.js:1647` | Editor-layout option showing only the rich-text Visual pane. |
| `action_64cff1` | Action | `src/web/editor-ui.js:1755` | Label for an operation to perform in a dialog. |
| `apply_31e392` | Apply | `src/web/editor-ui.js:1764` | Confirm and apply changes in the editor dialog. |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | The Markdown changed. Reopen this editor to try again. | `src/web/editor-ui.js:1770` | Conflict notice when the source changed after this visual-editing dialog opened; reopen it to load the latest content. |
| `edit_list_item_f69436` | Edit list item | `src/web/editor-ui.js:1801` | Heading for a dialog that edits one list entry. |
| `item_text_markdown_0bbe7d` | Item text (Markdown) | `src/web/editor-ui.js:1801` | Editable raw Markdown text of a list item. |
| `new_item_b84cad` | New item | `src/web/editor-ui.js:1806`, `src/web/editor-ui.js:1843` | Add an entry to a list. |
| `enter_item_text_or_choose_remove_item_e4003a` | Enter item text or choose Remove item. | `src/web/editor-ui.js:1814` | Refer to the translated Remove item action. |
| `enter_item_text_82c7ea` | Enter item text. | `src/web/editor-ui.js:1814` | Placeholder asking for the words of a list entry. |
| `add_item_below_a6d694` | Add item below | `src/web/editor-ui.js:1816`, `src/web/editor-ui.js:1828` | List-editing command that creates a new entry after the current entry. |
| `remove_item_5a89ed` | Remove item | `src/web/editor-ui.js:1816`, `src/web/editor-ui.js:1830` | Remove a list item. |
| `indent_under_previous_item_2e6b03` | Indent under previous item | `src/web/editor-ui.js:1831` | Nest this item beneath its preceding sibling. |
| `outdent_item_07e9b1` | Outdent item | `src/web/editor-ui.js:1833` | Move the list item one nesting level outward. |
| `this_item_has_no_parent_to_outdent_from_dd148a` | This item has no parent to outdent from. | `src/web/editor-ui.js:1857` | The item has no enclosing list item from which it can move outward. |
| `heading_b34f17` | Heading | `src/web/editor-ui.js:1867` | Document heading used in the heading style picker. |
| `edit_footnote_cdcee6` | Edit footnote | `src/web/editor-ui.js:1887` | Heading for a dialog that edits supported footnote text. |
| `note_text_369e75` | Note text | `src/web/editor-ui.js:1887` | Text of a Markdown footnote. |
| `enter_the_note_text_on_one_line_3a7a5a` | Enter the note text on one line. | `src/web/editor-ui.js:1889` | Instruction for entering a footnote’s content; line breaks are not supported in this field. |
| `cell_text_9cd173` | Cell text | `src/web/editor-ui.js:1972` | Text in one cell of a Markdown table. |
| `add_row_below_3d4830` | Add row below | `src/web/editor-ui.js:1990` | Table command that inserts a new row after the selected row. |
| `add_column_after_38817e` | Add column after | `src/web/editor-ui.js:1990` | Table command that inserts a new column after the selected column. |
| `new_column_editor` | New column | `src/web/editor-ui.js:2077` | Default table header inserted into the user's Markdown when adding a column. Keep it short and avoid Markdown formatting characters. |
| `remove_row_1810fd` | Remove row | `src/web/editor-ui.js:1991` | Table command that deletes the selected row. |
| `remove_column_9807a2` | Remove column | `src/web/editor-ui.js:1992` | Table command that deletes the selected column. |
| `align_column_left_6d9399` | Align column left | `src/web/editor-ui.js:1995` | Table command that sets the selected column’s Markdown alignment to left. |
| `center_column_1b9b8b` | Center column | `src/web/editor-ui.js:1995` | Center-align the contents of the table column. |
| `align_column_right_850a8f` | Align column right | `src/web/editor-ui.js:1996` | Table command that sets the selected column’s Markdown alignment to right. |
| `cell_text_markdown_a9e5f9` | Cell text (Markdown) | `src/web/editor-ui.js:2000` | Raw Markdown text in one table cell. |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Close inline code before adding a line break. | `src/web/editor-ui.js:2005` | Instruction for Markdown syntax: close the backtick-delimited inline-code span before inserting a line break. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | This cell text would change the table structure. Add a space before the separator in Markdown. | `src/web/editor-ui.js:2009` | Warning that a pipe in the cell would be parsed as a Markdown column separator. Insert a space before the pipe so it remains part of the cell text. |
| `alt_text_16f898` | Alt text | `src/web/editor-ui.js:2058` | Alternative text describing an image for accessibility. |
| `link_text_markdown_9b92bd` | Link text (Markdown) | `src/web/editor-ui.js:2058` | Field label for the visible link wording, not the destination address. |
| `image_url_e55026` | Image URL | `src/web/editor-ui.js:2059` | Field label for the address of the linked image. Keep URL untranslated. |
| `link_url_9dfd0b` | Link URL | `src/web/editor-ui.js:2060`, `src/web/editor-ui.js:2454`, `src/web/editor-ui.js:2649` | Field label for the destination address of a link. Keep URL untranslated. |
| `url_e7a241` | URL | `src/web/editor-ui.js:2060` | Label for a web-address field. Keep the acronym URL unchanged. |
| `edit_linked_image_2f9456` | Edit linked image | `src/web/editor-ui.js:2061` | Action for editing an image that is embedded by a Markdown URL. |
| `edit_image_d9d12b` | Edit image | `src/web/editor-ui.js:2061` | Action for editing the Markdown image syntax and its alternative text. |
| `edit_link_94026c` | Edit link | `src/web/editor-ui.js:2061` | Action for editing a Markdown link’s visible text or destination URL. |
| `enter_text_without_a_closing_bracket_0e7315` | Enter text without a closing bracket. | `src/web/editor-ui.js:2062` | Prompt for link text; the editor adds the Markdown closing bracket automatically, so users should not type one. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Enter an HTTP or HTTPS URL without spaces or parentheses. | `src/web/editor-ui.js:2066` | Validation hint for a link or image address. Preserve HTTP and HTTPS and do not add spaces or parentheses. |
| `visual_pane_height_4ad683` | Visual pane height | `src/web/editor-ui.js:2148` | Accessible label for the divider that resizes the visual editor panel. |
| `return_to_reader_dcd8f7` | Return to reader | `src/web/editor-ui.js:2248`, `src/web/editor-ui.js:2249` | Leave editing mode and show the document in reading mode. |
| `number_of_columns_2_8_893663` | Number of columns (2–8) | `src/web/editor-ui.js:2424` | Setting for the number of columns created when inserting a table. Keep the supported range 2–8. |
| `header_number_b79482` | Header {number} | `src/web/editor-ui.js:2426` | Label for the header cell of a numbered table column. |
| `cell_75fa38` | Cell | `src/web/editor-ui.js:2427` | A cell in a Markdown table. |
| `open_1f1d59` | Open… | `native-tauri/src/main.rs:56` | Open a file via a dialog. |
| `new_18fdd5` | New | `native-tauri/src/main.rs:58` | Native File menu command for starting a new document. |
| `print_07c371` | Print… | `native-tauri/src/main.rs:64` | File-menu command that opens the platform print dialog for the current document. Retain the menu ellipsis convention in translation. |
| `close_7d9eb7` | Close | `native-tauri/src/main.rs:66`, `native-tauri/bridge.js:31` | File-menu command that closes the current document window and action that dismisses the native open-error dialog. |
| `file_50009c` | File | `native-tauri/src/main.rs:68` | Native File menu. |
| `about_markdown_vision_c6d62d` | About Markdown Vision… | `native-tauri/src/main.rs:74` | Application-menu command that opens the About panel. Retain the menu ellipsis convention in translation. |
| `quit_markdown_vision_01c01b` | Quit Markdown Vision | `native-tauri/src/main.rs:75` | Exit the Markdown Vision app. |
| `quit_b3eb37` | Quit | `native-tauri/src/main.rs:84` | Exit the app. |
| `help_b79cac` | Help | `native-tauri/src/main.rs:86` | Native Help menu. |
| `could_not_enumerate_system_fonts_00e652` | Could not enumerate system fonts | `native-tauri/src/main.rs:153`, `native-tauri/src/main.rs:194` | Error returned when the app cannot retrieve the fonts installed on the operating system. |
| `no_system_fonts_found_a8a9af` | No system fonts found | `native-tauri/src/main.rs:212` | Error returned when the operating system reports an empty installed-font list. |
| `could_not_open_document_640c27` | Could not open document | `native-tauri/bridge.js:29` | Error heading shown when the app cannot open the selected document. |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | The document could not be opened. Your current changes are still available. {message} | `native-tauri/bridge.js:30` | Open-failure dialog that reassures the user the current edits remain available. Preserve the appended error-detail placeholder. |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Discard your unsaved changes and close Markdown Vision? | `native-tauri/bridge.js:13` | Confirmation before closing the current app window; accepting discards unsaved edits. |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Discard your unsaved changes and quit Markdown Vision? | `native-tauri/bridge.js:14` | Confirmation before quitting the entire application; accepting discards unsaved edits. |
| `unknown_confirmation_request_feea29` | Unknown confirmation request | `native-tauri/src/main.rs:408` | Diagnostic for an unsupported confirmation type sent by the app interface to the native host. |
| `keep_editing_624a83` | Keep editing | `native-tauri/bridge.js:19` | Keep the editor open and retain edits. |
| `discard_eb1a70` | Discard | `native-tauri/bridge.js:21` | Abandon edits after confirming. |
| `unsaved_changes_a710c2` | Unsaved changes | `native-tauri/bridge.js:17` | Title for the native confirmation dialog shown before closing or replacing a document with edits not yet saved. |
| `the_document_is_no_longer_open_use_save_as_671c50` | The document is no longer open. Use Save As. | `native-tauri/src/document.rs:166`, `native-tauri/src/document.rs:187` | Save As refers to the translated command from the file menu or editor toolbar. |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | This file has mixed line endings or invalid UTF-8. Use Save As. | `native-tauri/src/document.rs:190` | Save As refers to the translated command from the file menu or editor toolbar. |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | Saving through a symbolic link is not supported. Use Save As. | `native-tauri/src/document.rs:204` | Save As refers to the translated command from the file menu or editor toolbar. |
| `invalid_destination_14f03f` | Invalid destination | `native-tauri/src/document.rs:206` | Save error for a destination path or file URL that cannot be used as a valid document location. |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | The destination changed on disk. Use Save As to preserve your edits. | `native-tauri/src/document.rs:218` | Save As refers to the translated command from the file menu or editor toolbar. |
| `the_update_process_failed_010689` | The update process failed. | `native-tauri/src/updater.rs:4` | Native update status or error. |
| `could_not_restore_the_open_document_69d724` | Could not restore the open document. | `native-tauri/src/updater.rs:11` | Native update status or error. |
| `could_not_restart_markdown_vision_6ead36` | Could not restart Markdown Vision. | `native-tauri/src/updater.rs:18` | Native update status or error. |
| `restart_is_not_available_on_this_platform_998ef6` | Restart is not available on this platform. | `native-tauri/src/updater.rs:23` | Native update status or error. |
| `the_update_information_is_invalid_dbcffc` | The update information is invalid. | `native-tauri/src/updater.rs:32` | Native update status or error. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Automatic updates require an installed DEB or RPM package. | `native-tauri/src/updater.rs:35` | Native update status or error. |
| `this_architecture_is_not_supported_ae063c` | This architecture is not supported. | `native-tauri/src/updater.rs:40` | Native update status or error. |
| `could_not_identify_the_linux_distribution_18bbdb` | Could not identify the Linux distribution. | `native-tauri/src/updater.rs:42` | Native update status or error. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | The RPM package manager is unavailable. | `native-tauri/src/updater.rs:48` | Native update status or error. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision is not installed as a compatible RPM package. | `native-tauri/src/updater.rs:53` | Native update status or error. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | This update is not newer than the installed package. | `native-tauri/src/updater.rs:56`, `native-tauri/src/updater.rs:69` | Native update status or error. |
| `the_debian_package_manager_is_unavailable_b5d66b` | The Debian package manager is unavailable. | `native-tauri/src/updater.rs:60` | Native update status or error. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision is not installed as a DEB package. | `native-tauri/src/updater.rs:64` | Native update status or error. |
| `could_not_determine_the_installed_version_f1a1f1` | Could not determine the installed version. | `native-tauri/src/updater.rs:66` | Native update status or error. |
| `could_not_compare_package_versions_465d4e` | Could not compare package versions. | `native-tauri/src/updater.rs:68` | Native update status or error. |
| `could_not_create_a_temporary_download_folder_36407c` | Could not create a temporary download folder. | `native-tauri/src/updater.rs:72` | Native update status or error. |
| `could_not_start_the_download_b4acf0` | Could not start the download. | `native-tauri/src/updater.rs:77` | Native update status or error. |
| `the_update_could_not_be_downloaded_4d6fd7` | The update could not be downloaded. | `native-tauri/src/updater.rs:78` | Native update status or error. |
| `could_not_verify_the_update_2cd2c5` | Could not verify the update. | `native-tauri/src/updater.rs:79` | Native update status or error. |
| `the_downloaded_update_failed_verification_60519b` | The downloaded update failed verification. | `native-tauri/src/updater.rs:82` | Native update status or error. |
| `could_not_inspect_the_update_package_9812b2` | Could not inspect the update package. | `native-tauri/src/updater.rs:86`, `native-tauri/src/updater.rs:94` | Native update status or error. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | The downloaded package has unexpected metadata. | `native-tauri/src/updater.rs:89`, `native-tauri/src/updater.rs:96` | Native update status or error. |
| `version_dd1679` | Version | `native-tauri/src/updater.rs:92` | Native update status or error. |
| `could_not_start_the_system_installer_907ba2` | Could not start the system installer. | `native-tauri/src/updater.rs:102` | Native update status or error. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | Installation was cancelled or failed. Please try again. | `native-tauri/src/updater.rs:103` | Native update status or error. |
| `could_not_verify_the_installed_update_04a200` | Could not verify the installed update. | `native-tauri/src/updater.rs:106` | Native update status or error. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | The installer did not update Markdown Vision to the expected version. | `native-tauri/src/updater.rs:108` | Native update status or error. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Automatic DEB updates are only available on Linux. | `native-tauri/src/updater.rs:140` | Native update status or error. |
| `invalid_preferences_bc6b57` | Invalid preferences | `native-tauri/src/preferences.rs:10` | Diagnostic for a saved application-preferences file that is malformed or has an unsupported format. |
| `invalid_key_b06fe9` | Invalid {key} | `native-tauri/src/preferences.rs:14`, `native-tauri/src/preferences.rs:23` | Diagnostic naming a preference key whose stored value has the wrong type. Preserve the key placeholder. |
| `unsupported_preferences_version_54734c` | Unsupported preferences version | `native-tauri/src/preferences.rs:42` | Diagnostic when the saved settings file was created by a newer or incompatible version of the app. |
| `missing_preferences_679970` | Missing preferences | `native-tauri/src/preferences.rs:44` | Diagnostic when the app expects a saved preference that is absent. |
| `invalid_preferences_directory_a6f362` | Invalid preferences directory | `native-tauri/src/preferences.rs:54` | Diagnostic for an application-settings directory path that cannot be used. |
| `markdown_vision_native_9b1051` | Markdown Vision Native | `native-cpp/WebViewHost.cpp:176`, `native-cpp/WebViewHost.cpp:628`, `native-windows/MainWindow.xaml.cs:38` | Windows edition name. Preserve the full name. |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision could not read this file. | `native-cpp/WebViewHost.cpp:235` | Error when the Windows preview handler cannot read the selected Markdown file to render its preview. |
| `markdown_files_177420` | Markdown files | `native-cpp/WebViewHost.cpp:262`, `native-cpp/WebViewHost.cpp:263`, `native-cpp/WebViewHost.cpp:278`, `native-cpp/WebViewHost.cpp:279`, `native-windows/MainWindow.xaml.cs:120` | File-picker filter for Markdown document extensions. |
| `text_files_c5df15` | Text files | `native-cpp/WebViewHost.cpp:262`, `native-cpp/WebViewHost.cpp:263`, `native-cpp/WebViewHost.cpp:278`, `native-cpp/WebViewHost.cpp:279`, `native-windows/MainWindow.xaml.cs:120` | File-picker filter for plain-text files. |
| `all_files_866956` | All files | `native-cpp/WebViewHost.cpp:279` | File-picker filter that displays files of any type. |
| `save_markdown_file_813f90` | Save Markdown file | `native-cpp/WebViewHost.cpp:280` | Title shown in the native Windows Save dialog. Keep the label concise and use the locale's established term for Markdown. |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | This document is no longer open. Reopen the file or use Save As. | `native-cpp/WebViewHost.cpp:363` | Save As refers to the translated command from the file menu or editor toolbar. |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Use Save As to create a UTF-8 copy of this file. | `native-cpp/WebViewHost.cpp:365` | Save As refers to the translated command from the file menu or editor toolbar. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | This file uses mixed line endings. Use Save As to create a copy with consistent line endings. | `native-cpp/WebViewHost.cpp:367` | Save As refers to the translated command from the file menu or editor toolbar. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows could not open the Save As dialog. | `native-cpp/WebViewHost.cpp:373` | Save As refers to the translated command from the file menu or editor toolbar. |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | The draft could not be encoded as UTF-8. | `native-cpp/WebViewHost.cpp:380` | Save error when the edited text cannot be represented in the UTF-8 file format. Preserve UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows could not read the selected destination. | `native-cpp/WebViewHost.cpp:385` | Save error when Windows cannot read the target file contents before replacing it. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | The file changed on disk or is unavailable. Use Save As to keep your edits in a separate copy. | `native-cpp/WebViewHost.cpp:391` | Save As refers to the translated command from the file menu or editor toolbar. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows could not save the file. Check that the file is writable, or use Save As. | `native-cpp/WebViewHost.cpp:393` | Save As refers to the translated command from the file menu or editor toolbar. |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows could not restore the original file during the save. The original is at {path}. | `native-cpp/WebViewHost.cpp:395` | Recovery error after a failed save; the placeholder is the path to the preserved original file. Keep the placeholder intact. |
| `the_save_request_could_not_be_completed_75cfa5` | The save request could not be completed. | `native-cpp/WebViewHost.cpp:545` | General error returned when the Windows host cannot finish a save request and has no more specific user-facing detail. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision could not prepare its application files in your local app data folder. | `native-cpp/WebViewHost.cpp:622` | Windows startup error when bundled web assets cannot be prepared in the current user’s `%LOCALAPPDATA%` directory. “Local app data” names this Windows per-user folder, not data for an app described as local. Preserve `%LOCALAPPDATA%` only if you include it in the translation. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Microsoft Edge WebView2 Runtime is required. | `native-cpp/WebViewHost.cpp:635` | Startup error naming the Microsoft Edge WebView2 Runtime dependency. Preserve the product name exactly. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) | `native-cpp/installer.nsi:201`, `native-cpp/installer.nsi:22` | Versioned name of the Windows edition. Preserve Native. |
| `markdown_vision_native_setup_c91176` | Markdown Vision Native Setup | `native-cpp/installer.nsi:25` | Title of the installer for Markdown Vision Native. Translate Setup. |
| `licensed_under_gpl_3_0_only_5f7e0f` | Licensed under GPL-3.0-only | `native-cpp/installer.nsi:27` | Windows installer interface. |
| `this_installer_requires_windows_on_arm64_ef7f28` | This installer requires Windows on ARM64. | `native-cpp/installer.nsi:53` | Windows installer interface. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision is running. Save any unsaved documents before continuing. Close Markdown Vision and continue setup? | `native-cpp/installer.nsi:85` | Windows installer interface. |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | Setup could not close Markdown Vision. Close it manually and run setup again. | `native-cpp/installer.nsi:93` | Windows installer interface. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision is still running. Close it and select Retry, or cancel setup. | `native-cpp/installer.nsi:101` | Windows installer interface. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Removing the currently installed Markdown Vision edition… | `native-cpp/installer.nsi:113` | Installer progress. The existing edition is being removed. |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | The existing Markdown Vision installation could not be removed. Setup will stop without installing the native edition. | `native-cpp/installer.nsi:116` | Blocking installer failure. Setup stops and the Native edition will not be installed. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | You can choose Markdown Vision as the default app for Markdown files in Windows Settings. | `native-cpp/installer.nsi:128` | Installer choice. Windows lets the user choose the default application. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Open Windows default app settings after installation | `native-cpp/installer.nsi:130` | Installer choice. Windows lets the user choose the default application. |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision has been installed. | `native-cpp/installer.nsi:155` | Successful installation message. |
| `open_markdown_vision_when_setup_closes_8422c7` | Open Markdown Vision when setup closes | `native-cpp/installer.nsi:157` | Windows installer interface. |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native could not be installed. Setup will stop without registering an incomplete installation. | `native-cpp/installer.nsi:191` | Blocking installer failure. No incomplete installation is registered. |
| `markdown_document_00271f` | Markdown document | `native-cpp/installer.nsi:211` | Windows installer interface. |
| `markdown_vision_preview_handler_8c95f7` | Markdown Vision Preview Handler | `native-cpp/installer.nsi:218`, `native-cpp/installer.nsi:236` | Windows installer interface. |
| `markdown_file_viewer_c36ee7` | Markdown file viewer | `native-cpp/installer.nsi:222` | Short app description used in the Windows installer and the Linux desktop launcher. |
| `uninstall_fe1995` | Uninstall | `native-cpp/installer.nsi:257` | Windows installer interface. |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision could not start. {error} | `native-windows/MainWindow.xaml.cs:64` | Startup error shown when the Windows app host cannot initialize. Preserve the error-detail placeholder. |
| `unknown_native_method_method_cc7ca9` | Unknown native method: {method} | `native-windows/MainWindow.xaml.cs:96` | Diagnostic error for an unsupported request sent between the app’s web interface and Windows host. “Method” means an internal operation, not a person’s technique. Preserve the placeholder. |
| `text_71988c` | Text | `src/electron/main.cjs:153` | Label for the plain-text file type in the native file picker. |
| `title_shortcut_9aa219` | {title} ({shortcut}) | Example: `src/web/index.html:145` | Proposed reusable tooltip pattern. |
| `heading_level_a6cd26` | Heading {level} | `src/web/editor-ui.js:1867` | One of the heading levels in the heading style picker. |
| `normal_text_a2adc4` | Normal text | Toolbar reference: `src/web/index.html:20` | Proposed name for ordinary paragraph styling. |
| `footnotes_ad6fb5` | Footnotes | Rendered section: `src/web/app.js:624` (no standalone visible label) | Proposed label for the generated Markdown footnotes section. |
| `size_px_8d05e6` | {size} px | `src/web/app.js:165` | Pixel measurement for the text size or page width settings. |
| `link_text_insert_default` | link text | `src/web/editor-ui.js:2457` | Initial text inserted inside a new Markdown link when no text is selected. |
| `back_to_footnote_reference` | Back to footnote reference | `src/web/app.js` | Accessible name for the arrow returning from a footnote to its reference in the document. |

## Locale ar

Arabic

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | تنسيق Markdown |
| `undo_a8283a` | تراجع |
| `redo_742739` | إعادة |
| `bold_ctrl_b_84787d` | غامق (Ctrl+B) |
| `bold_94fee6` | غامق |
| `italic_ctrl_i_ccc60d` | مائل (Ctrl+I) |
| `italic_9bf37c` | مائل |
| `strikethrough_9aabbc` | يتوسطه خط |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | تغيير مستوى العنوان بالتتابع (H1–H6، ثم النص العادي) |
| `cycle_heading_level_bde9c4` | تغيير مستوى العنوان بالتتابع |
| `bulleted_list_ce51b3` | قائمة نقطية |
| `task_list_5d3253` | قائمة المهام |
| `numbered_list_cc62f6` | قائمة مرقمة |
| `quote_eb4cde` | اقتباس |
| `inline_code_e767de` | تعليمات برمجية مضمنة |
| `code_block_754538` | كتلة التعليمات البرمجية |
| `link_a6a32d` | رابط |
| `insert_table_67318e` | إدراج جدول |
| `edit_markdown_6ff388` | تحرير Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | ملف Markdown جديد (Ctrl+N) |
| `new_markdown_file_0928e9` | ملف Markdown جديد |
| `open_markdown_file_b7764a` | افتح ملف Markdown |
| `print_ctrl_p_5c4406` | طباعة (Ctrl+P) |
| `print_document_2a024b` | طباعة الوثيقة |
| `search_text_38d268` | بحث في النص |
| `settings_74a883` | الإعدادات |
| `switch_to_dark_mode_fc43ea` | التبديل إلى الوضع المظلم |
| `about_markdown_vision_08f9a5` | حول Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | رخصة GNU GPLv3 |
| `version_version_a18745` | الإصدار {version} |
| `latest_version_checking_4bfedc` | أحدث إصدار: جاري التحقق… |
| `update_c1c100` | تحديث |
| `update_text_editor` | تحديث النص |
| `keep_unchanged_editor` | إبقاء دون تغيير |
| `check_for_updates_f26f32` | التحقق من وجود تحديثات |
| `restart_markdown_vision_7e50f8` | أعد تشغيل Markdown Vision |
| `text_search_10155f` | البحث في النص |
| `count_match_ef9195` | عدد نتائج البحث: {count} |
| `count_matches_43682a` | عدد نتائج البحث: {count} |
| `previous_match_daa2f8` | نتيجة البحث السابقة |
| `next_match_825e5a` | نتيجة البحث التالية |
| `close_search_55656b` | إغلاق البحث |
| `close_settings_0ccfef` | إغلاق الإعدادات |
| `variable_width_font_0836b2` | الخط ذو العرض المتغير |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | اكتب اسم الخط أو اختر خطًا مثبتًا. |
| `fixed_width_font_3de094` | الخط ذو العرض الثابت |
| `used_for_code_and_other_monospaced_text_84b6ed` | يُستخدم للشيفرة والنصوص الأخرى ذات العرض الثابت. |
| `text_size_d68761` | حجم النص |
| `automatic_text_size_919785` | حجم النص التلقائي |
| `automatic_d461a4` | تلقائي |
| `line_spacing_0db45d` | تباعد الأسطر |
| `page_width_limit_19528b` | حد عرض الصفحة |
| `automatic_page_width_bd5c30` | عرض الصفحة التلقائي |
| `markdown_editor_da0ea6` | محرر Markdown |
| `editor_view_1d1833` | عرض المحرر |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown على اليسار، والمحرر المرئي على اليمين |
| `split_0b61a1` | تقسيم ↔ |
| `visual_above_markdown_a04e0f` | المحرر المرئي أعلى Markdown |
| `split_b3b924` | تقسيم ↕ |
| `visual_ba3033` | المحرر المرئي |
| `save_ctrl_s_4be89e` | حفظ (Ctrl+S) |
| `save_1509f5` | حفظ |
| `save_as_ctrl_shift_s_0f132a` | حفظ باسم (Ctrl+Shift+S) |
| `save_as_a4b76a` | حفظ باسم… |
| `markdown_source_580118` | مصدر Markdown |
| `markdown_pane_width_ab0129` | عرض لوحة Markdown |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% المحرر المرئي |
| `visual_editor_5665dd` | المحرر المرئي |
| `visual_editing_restriction_d42cea` | تقييد التحرير المرئي |
| `edit_in_markdown_165fd4` | تحرير في Markdown |
| `dismiss_48845b` | إغلاق الإشعار |
| `count_word_1f505c` | عدد الكلمات: {count} |
| `count_words_caab29` | عدد الكلمات: {count} |
| `approximate_word_count_7b987a` | عدد الكلمات التقريبي: {count} |
| `line_line_column_column_21e9f4` | السطر {line}، العمود {column} |
| `untitled_md_2dccf8` | بلا عنوان.md |
| `save_your_changes_56dd16` | هل تريد حفظ تغييراتك؟ |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | احفظ المستند الحالي قبل إنشاء ملف جديد. |
| `cancel_19766e` | إلغاء |
| `discard_changes_f9bfa3` | تجاهل التغييرات |
| `switch_to_light_mode_bfa0ca` | التبديل إلى المظهر الفاتح |
| `enter_the_name_of_any_installed_font_b57a72` | أدخل اسم أي خط مثبت. |
| `loading_installed_fonts_200c74` | جارٍ تحميل الخطوط المثبتة… |
| `count_fixed_width_font_available_5488f8` | عدد الخطوط المتاحة ذات العرض الثابت: {count} |
| `count_fixed_width_fonts_available_5df530` | عدد الخطوط المتاحة ذات العرض الثابت: {count} |
| `count_variable_width_font_available_583582` | عدد الخطوط المتاحة ذات العرض المتغير: {count} |
| `count_variable_width_fonts_available_9d234c` | عدد الخطوط المتاحة ذات العرض المتغير: {count} |
| `count_match_for_query_2e77ac` | عرض نتائج البحث عن «{query}»: {count} |
| `count_matches_for_query_7db710` | عرض نتائج البحث عن «{query}»: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | لا توجد خطوط ذات عرض ثابت تتطابق مع "{query}". |
| `no_variable_width_fonts_match_query_a64030` | لا توجد خطوط ذات عرض متغير تتطابق مع "{query}". |
| `current_of_total_35d900` | {current} من {total} |
| `current_of_total_scope_94ebe5` | {current} من {total} · {scope} |
| `copy_code_49a005` | نسخ التعليمات البرمجية |
| `clipboard_unavailable_4ff69f` | الحافظة غير متاحة |
| `code_copied_39868c` | تم نسخ التعليمات البرمجية |
| `could_not_copy_code_4a563f` | تعذر نسخ التعليمات البرمجية |
| `the_native_print_dialog_could_not_open_320714` | تعذر فتح مربع حوار الطباعة الخاص بالنظام. |
| `could_not_open_the_print_dialog_4bd85a` | لا يمكن فتح مربع حوار الطباعة. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | هل تريد تجاهل التغييرات غير المحفوظة وفتح مستند آخر؟ |
| `could_not_open_document_69abda` | تعذر فتح المستند |
| `release_check_failed_7b2758` | تعذر التحقق من الإصدار |
| `unrecognized_release_list_62d1cb` | قائمة إصدارات غير صالحة |
| `unrecognized_version_d1b8d2` | نسخة غير معترف بها |
| `latest_version_version_d1c996` | أحدث إصدار: {version} |
| `unsupported_architecture_087e4f` | بنية غير مدعومة |
| `installer_verification_is_unavailable_98306d` | يتعذر التحقق من سلامة حزمة التثبيت. |
| `unsupported_platform_a96892` | منصة غير مدعومة |
| `latest_compatible_version_version_fa3079` | أحدث إصدار متوافق: {version} |
| `upgrade_markdown_vision_de1b45` | ترقية Markdown Vision |
| `download_macos_update_95d8f3` | تنزيل تحديث macOS |
| `download_linux_update_707c5e` | تنزيل تحديث Linux |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | غير قادر على التحقق من وجود تحديثات. تحقق من اتصالك بالإنترنت وحاول مرة أخرى. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | جارٍ تنزيل التحديث والتحقق منه. قد يُطلب منك تأكيد هويتك. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | تم تثبيت التحديث. أعد التشغيل لاستخدام الإصدار الجديد. |
| `update_failed_error_e4f7dc` | فشل التحديث: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | هل تريد تنزيل برنامج التثبيت Markdown Vision وتشغيله؟ احفظ أي مستندات مفتوحة أولاً. قد يطلب برنامج الإعداد إغلاق Markdown Vision. |
| `downloading_and_verifying_update_02b3ba` | جارٍ التنزيل والتحقق من التحديث… |
| `installer_started_865e10` | بدأ برنامج التثبيت. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | تعذر تنزيل برنامج التثبيت أو التحقق منه أو بدء تشغيله. يرجى المحاولة مرة أخرى. |
| `discard_unsaved_changes_and_restart_6d1602` | هل تريد تجاهل التغييرات غير المحفوظة وإعادة التشغيل؟ |
| `could_not_restart_error_71e2d2` | تعذر إعادة التشغيل: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | انقر نقرًا مزدوجًا أو اضغط على Alt+Enter لتحرير هذا العنصر |
| `saving_23e392` | جارٍ الحفظ… |
| `unsaved_6250d5` | غير محفوظ |
| `saved_b5c120` | تم الحفظ |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | تعذر حفظ المسودة. لا تزال تغييراتك في المحرر. |
| `embedded_content_1bca8f` | المحتوى المضمن |
| `edit_table_source_c7189f` | تحرير مصدر الجدول |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | حدد خلية لتحريرها أو تغيير الجدول. اضغط على Alt+Enter أثناء الكتابة. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | تحتوي هذه الكتلة على التنسيق الذي يجب تحريره في Markdown. |
| `code_contents_5a1f26` | محتويات الكود |
| `type_directly_to_edit_this_indented_code_block_769291` | اكتب مباشرةً في كتلة التعليمات البرمجية ذات المسافة البادئة هذه لتحريرها. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | اكتب مباشرة في مقطع التعليمات البرمجية لتحرير محتوياته. استخدم Markdown لتحرير الأسطر التي تحدد مكان البداية والنهاية. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | استخدم «تحرير عنصر القائمة» لتغيير النص. لتغيير تداخل العناصر، حرّر القائمة في Markdown. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | لتغيير القائمة، استخدم «تحرير عنصر القائمة» أو مربعات الاختيار. |
| `edit_list_item_text_a982e6` | تحرير نص عنصر القائمة |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | تحرير نص العنصر مباشرة. قم بتحرير بنية القائمة في Markdown. |
| `task_4bc74b` | المهمة |
| `edit_item_9f84ee` | تحرير عنصر القائمة |
| `list_options_fc3320` | خيارات القائمة |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | يحتاج هذا الجدول إلى التحرير في Markdown. |
| `add_text_to_this_empty_cell_37f900` | أضف نصًا إلى هذه الخلية الفارغة |
| `edit_this_cell_in_markdown_4304b1` | قم بتحرير هذه الخلية في Markdown |
| `edit_table_cell_a4212e` | تحرير خلية الجدول |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | حدد خلية لتحريرها. يمكنك تحرير الجدول الأساسي في Markdown. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | تحتوي هذه الخلية على HTML. قم بتحرير هذه الخلية في Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | تستخدم هذه الخلية مراجع Markdown. قم بتحرير هذه الخلية في Markdown. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | اكتب لتحرير هذه الخلية. اضغط على Alt+Enter للحصول على خيارات الجدول. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | اكتب مباشرة في الخلايا التي تحتوي على نص عادي فقط. للمحتوى الأكثر تعقيدًا، استخدم خيارات الجدول أو حرّر Markdown. |
| `table_options_cf924a` | خيارات الجدول |
| `edit_note_299e60` | تحرير الملاحظة |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | استخدم «تحرير الملاحظة» لتغيير نص الحاشية السفلية القابل للتحرير. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | يستخدم هذا التخطيط HTML. حرّره في Markdown. |
| `edit_inline_code_bf93ee` | تحرير التعليمات البرمجية المضمنة |
| `edit_list_structure_in_markdown_17a222` | تحرير بنية القائمة في Markdown |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | تحرير نص القائمة العادي مباشرة. قم بتحرير بنية القائمة في Markdown. |
| `edit_code_in_table_cell_535cb9` | تحرير التعليمات البرمجية في خلية الجدول |
| `edit_table_cell_text_ca30e7` | تحرير نص خلية الجدول |
| `edit_preformatted_text_9737bd` | تحرير النص المنسق مسبقا |
| `edit_disclosure_title_79fb92` | تعديل عنوان القسم القابل للتوسيع |
| `edit_text_7967d9` | تحرير النص |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | اكتب نص الخلية. اضغط على Alt+Enter للحصول على خيارات الخلية. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | تحرير النص مباشرة. قم بتحرير البنية المحيطة في Markdown. |
| `edit_structure_in_markdown_fe607e` | تحرير الهيكل في Markdown |
| `edit_quoted_text_9de474` | تحرير النص المقتبس |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | عدّل النص العادي مباشرةً. عدّل بنية الاقتباس في Markdown. |
| `edit_heading_text_f3806c` | تحرير نص العنوان |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | تحرير نص العنوان مباشرة. قم بتحرير نمط العنوان في Markdown. |
| `heading_style_c0c25b` | أسلوب العنوان |
| `edit_this_item_in_markdown_83b112` | قم بتحرير هذا العنصر في Markdown |
| `markdown_only_f6e1f7` | في Markdown فقط |
| `visual_only_29a136` | في المحرر المرئي فقط |
| `action_64cff1` | الإجراء |
| `apply_31e392` | تطبيق |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | تم تغيير Markdown. أعد فتح هذا المحرر للمحاولة مرة أخرى. |
| `edit_list_item_f69436` | تحرير عنصر القائمة |
| `item_text_markdown_0bbe7d` | نص العنصر (Markdown) |
| `new_item_b84cad` | عنصر قائمة جديد |
| `enter_item_text_or_choose_remove_item_e4003a` | أدخل نص عنصر القائمة أو اختر «حذف العنصر». |
| `enter_item_text_82c7ea` | أدخل نص العنصر. |
| `add_item_below_a6d694` | أضف العنصر أدناه |
| `remove_item_5a89ed` | حذف العنصر |
| `indent_under_previous_item_2e6b03` | مسافة بادئة تحت العنصر السابق |
| `outdent_item_07e9b1` | تقليل المسافة البادئة للعنصر |
| `this_item_has_no_parent_to_outdent_from_dd148a` | لا يوجد عنصر أعلى لهذا العنصر، لذا لا يمكن تقليل المسافة البادئة. |
| `heading_b34f17` | عنوان |
| `edit_footnote_cdcee6` | تحرير الحاشية السفلية |
| `note_text_369e75` | نص الحاشية |
| `enter_the_note_text_on_one_line_3a7a5a` | أدخل نص الملاحظة على سطر واحد. |
| `cell_text_9cd173` | نص الخلية |
| `add_row_below_3d4830` | إضافة صف أدناه |
| `add_column_after_38817e` | إضافة عمود بعد العمود الحالي |
| `new_column_editor` | عمود جديد |
| `remove_row_1810fd` | إزالة الصف |
| `remove_column_9807a2` | إزالة العمود |
| `align_column_left_6d9399` | محاذاة العمود إلى اليسار |
| `center_column_1b9b8b` | توسيط محتوى العمود |
| `align_column_right_850a8f` | محاذاة العمود إلى اليمين |
| `cell_text_markdown_a9e5f9` | نص الخلية (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | أغلق التعليمات البرمجية المضمنة قبل إضافة فاصل أسطر. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | سيؤدي نص الخلية هذا إلى تغيير بنية الجدول. أضف مسافة قبل الفاصل في Markdown. |
| `alt_text_16f898` | نص بديل |
| `link_text_markdown_9b92bd` | نص الارتباط (Markdown) |
| `image_url_e55026` | عنوان URL للصورة |
| `link_url_9dfd0b` | عنوان URL للرابط |
| `url_e7a241` | عنوان URL |
| `edit_linked_image_2f9456` | تحرير الصورة المرتبطة |
| `edit_image_d9d12b` | تحرير الصورة |
| `edit_link_94026c` | تعديل الرابط |
| `enter_text_without_a_closing_bracket_0e7315` | أدخل نصًا بدون قوس إغلاق. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | أدخل عنوان URL HTTP أو HTTPS بدون مسافات أو أقواس. |
| `visual_pane_height_4ad683` | ارتفاع لوحة المحرر المرئي |
| `return_to_reader_dcd8f7` | العودة إلى وضع القراءة |
| `number_of_columns_2_8_893663` | عدد الأعمدة (2-8) |
| `header_number_b79482` | رأس العمود {number} |
| `cell_75fa38` | خلية |
| `open_1f1d59` | فتح… |
| `new_18fdd5` | جديد |
| `print_07c371` | طباعة… |
| `close_7d9eb7` | إغلاق |
| `file_50009c` | ملف |
| `about_markdown_vision_c6d62d` | حول Markdown Vision… |
| `quit_markdown_vision_01c01b` | قم بإنهاء Markdown Vision |
| `quit_b3eb37` | إنهاء |
| `help_b79cac` | مساعدة |
| `could_not_enumerate_system_fonts_00e652` | تعذر الحصول على قائمة خطوط النظام |
| `no_system_fonts_found_a8a9af` | لم يتم العثور على خطوط النظام |
| `could_not_open_document_640c27` | لا يمكن فتح المستند |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | لا يمكن فتح المستند. التغييرات الحالية لا تزال متاحة. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | هل تريد تجاهل التغييرات غير المحفوظة وإغلاق Markdown Vision؟ |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | هل تريد تجاهل التغييرات غير المحفوظة والخروج من Markdown Vision؟ |
| `unknown_confirmation_request_feea29` | طلب تأكيد غير معروف |
| `keep_editing_624a83` | استمر في التحرير |
| `discard_eb1a70` | تجاهل |
| `unsaved_changes_a710c2` | التغييرات غير المحفوظة |
| `the_document_is_no_longer_open_use_save_as_671c50` | المستند لم يعد مفتوحاً. استخدم حفظ باسم. |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | يحتوي هذا الملف على نهايات أسطر مختلطة أو ترميز UTF-8 غير صالح. استخدم «حفظ باسم». |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | الحفظ من خلال رابط رمزي غير مدعوم. استخدم حفظ باسم. |
| `invalid_destination_14f03f` | وجهة غير صالحة |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | تغير الملف المستهدف على القرص. استخدم «حفظ باسم» للحفاظ على تعديلاتك. |
| `the_update_process_failed_010689` | فشلت عملية التحديث. |
| `could_not_restore_the_open_document_69d724` | لا يمكن استعادة المستند المفتوح. |
| `could_not_restart_markdown_vision_6ead36` | تعذر إعادة تشغيل Markdown Vision. |
| `restart_is_not_available_on_this_platform_998ef6` | إعادة التشغيل غير متوفرة على هذا النظام الأساسي. |
| `the_update_information_is_invalid_dbcffc` | معلومات التحديث غير صالحة. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | تتطلب التحديثات التلقائية تثبيت حزمة DEB أو RPM. |
| `this_architecture_is_not_supported_ae063c` | هذه البنية غير مدعومة. |
| `could_not_identify_the_linux_distribution_18bbdb` | تعذر التعرف على توزيع Linux. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | مدير حزمة RPM غير متوفر. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | لم يتم تثبيت Markdown Vision كحزمة RPM متوافقة. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | هذا التحديث ليس أحدث من الحزمة المثبتة. |
| `the_debian_package_manager_is_unavailable_b5d66b` | مدير حزم دبيان غير متوفر. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | لم يتم تثبيت Markdown Vision كحزمة DEB. |
| `could_not_determine_the_installed_version_f1a1f1` | لا يمكن تحديد الإصدار المثبت. |
| `could_not_compare_package_versions_465d4e` | لا يمكن مقارنة إصدارات الحزمة. |
| `could_not_create_a_temporary_download_folder_36407c` | لا يمكن إنشاء مجلد تنزيل مؤقت. |
| `could_not_start_the_download_b4acf0` | تعذر بدء التنزيل. |
| `the_update_could_not_be_downloaded_4d6fd7` | لا يمكن تنزيل التحديث. |
| `could_not_verify_the_update_2cd2c5` | تعذر التحقق من التحديث. |
| `the_downloaded_update_failed_verification_60519b` | فشل التحقق من التحديث الذي تم تنزيله. |
| `could_not_inspect_the_update_package_9812b2` | لا يمكن فحص حزمة التحديث. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | تحتوي الحزمة التي تم تنزيلها على بيانات تعريف غير متوقعة. |
| `version_dd1679` | الإصدار |
| `could_not_start_the_system_installer_907ba2` | تعذر بدء تشغيل مثبت النظام. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | أُلغيت عملية التثبيت أو فشلت. يرجى المحاولة مرة أخرى. |
| `could_not_verify_the_installed_update_04a200` | تعذر التحقق من التحديث المثبت. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | لم يقم المثبت بتحديث Markdown Vision إلى الإصدار المتوقع. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | تتوفر تحديثات DEB التلقائية فقط على Linux. |
| `invalid_preferences_bc6b57` | التفضيلات غير صالحة |
| `invalid_key_b06fe9` | {key} غير صالح |
| `unsupported_preferences_version_54734c` | إصدار التفضيلات غير معتمد |
| `missing_preferences_679970` | التفضيلات المفقودة |
| `invalid_preferences_directory_a6f362` | دليل التفضيلات غير صالح |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision لم يتمكن من قراءة هذا الملف. |
| `markdown_files_177420` | ملفات Markdown |
| `text_files_c5df15` | ملفات نصية |
| `all_files_866956` | جميع الملفات |
| `save_markdown_file_813f90` | احفظ ملف Markdown |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | هذه الوثيقة لم تعد مفتوحة. أعد فتح الملف أو استخدم حفظ باسم. |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | استخدم "حفظ باسم" لإنشاء نسخة UTF-8 من هذا الملف. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | يستخدم هذا الملف نهايات أسطر مختلفة. استخدم «حفظ باسم» لإنشاء نسخة ذات نهايات أسطر موحّدة. |
| `windows_could_not_open_the_save_as_dialog_702a77` | تعذر على Windows فتح مربع الحوار "حفظ باسم". |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | لا يمكن ترميز المسودة كـ UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows لم يتمكن من قراءة الوجهة المحددة. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | تم تغيير الملف على القرص أو أنه غير متوفر. استخدم "حفظ باسم" للاحتفاظ بتعديلاتك في نسخة منفصلة. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | تعذر على Windows حفظ الملف. تأكد من أن الملف قابل للكتابة، أو استخدم حفظ باسم. |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | تعذر على Windows استعادة الملف الأصلي أثناء الحفظ. الأصل موجود في {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | لا يمكن إكمال طلب الحفظ. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | تعذر على Markdown Vision إعداد ملفات التطبيق الخاصة به في مجلد بيانات التطبيق المحلي لديك. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | مطلوب مكوّن Microsoft Edge WebView2 Runtime. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | تثبيت Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | مرخص بموجب GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | يتطلب هذا المثبت Windows على ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision قيد التشغيل. احفظ أي مستندات غير محفوظة قبل المتابعة. هل تريد إغلاق Markdown Vision ومتابعة الإعداد؟ |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | تعذر على برنامج الإعداد إغلاق Markdown Vision. قم بإغلاقه يدويًا وتشغيل برنامج الإعداد مرة أخرى. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | لا يزال Markdown Vision قيد التشغيل. أغلقه واختر إعادة المحاولة، أو ألغِ التثبيت. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | جارٍ إزالة إصدار Markdown Vision المثبت حاليًا… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | تعذر إزالة تثبيت Markdown Vision الحالي. سيتوقف برنامج التثبيت دون تثبيت Markdown Vision Native. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | يمكنك اختيار Markdown Vision تطبيقًا افتراضيًا لملفات Markdown في إعدادات Windows. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | فتح إعدادات التطبيقات الافتراضية في Windows بعد التثبيت |
| `markdown_vision_has_been_installed_40d44f` | تم تثبيت Markdown Vision. |
| `open_markdown_vision_when_setup_closes_8422c7` | افتح Markdown Vision عند إغلاق برنامج التثبيت |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | تعذر تثبيت Markdown Vision Native. سيتوقف الإعداد دون تسجيل تثبيت غير كامل. |
| `markdown_document_00271f` | وثيقة Markdown |
| `markdown_vision_preview_handler_8c95f7` | معالج المعاينة Markdown Vision |
| `markdown_file_viewer_c36ee7` | عارض ملفات Markdown |
| `uninstall_fe1995` | إلغاء التثبيت |
| `markdown_vision_could_not_start_error_7950eb` | تعذر بدء تشغيل Markdown Vision. {error} |
| `unknown_native_method_method_cc7ca9` | طريقة أصلية غير معروفة: {method} |
| `text_71988c` | نص |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | عنوان {level} |
| `normal_text_a2adc4` | نص عادي |
| `footnotes_ad6fb5` | الحواشي |
| `size_px_8d05e6` | {size} بكسل |
| `link_text_insert_default` | نص الرابط |
| `back_to_footnote_reference` | العودة إلى موضع الحاشية |

## Locale zh-hans

Chinese (Simplified)

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Markdown 格式化 |
| `undo_a8283a` | 撤销 |
| `redo_742739` | 重做 |
| `bold_ctrl_b_84787d` | 加粗 (Ctrl+B) |
| `bold_94fee6` | 加粗 |
| `italic_ctrl_i_ccc60d` | 斜体 (Ctrl+I) |
| `italic_9bf37c` | 斜体 |
| `strikethrough_9aabbc` | 删除线 |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | 循环切换标题级别 (H1–H6, 然后切换到正文) |
| `cycle_heading_level_bde9c4` | 循环切换标题级别 |
| `bulleted_list_ce51b3` | 项目符号列表 |
| `task_list_5d3253` | 任务清单 |
| `numbered_list_cc62f6` | 编号列表 |
| `quote_eb4cde` | 引用 |
| `inline_code_e767de` | 内联代码 |
| `code_block_754538` | 代码块 |
| `link_a6a32d` | 链接 |
| `insert_table_67318e` | 插入表格 |
| `edit_markdown_6ff388` | 编辑Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | 新 Markdown 文件 (Ctrl+N) |
| `new_markdown_file_0928e9` | 新 Markdown 文件 |
| `open_markdown_file_b7764a` | 打开 Markdown 文件 |
| `print_ctrl_p_5c4406` | 打印（Ctrl+P） |
| `print_document_2a024b` | 打印文件 |
| `search_text_38d268` | 搜索文本 |
| `settings_74a883` | 设置 |
| `switch_to_dark_mode_fc43ea` | 切换到深色模式 |
| `about_markdown_vision_08f9a5` | 关于Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | GNU GPLv3许可证 |
| `version_version_a18745` | 版本{version} |
| `latest_version_checking_4bfedc` | 最新版本：正在检查… |
| `update_c1c100` | 更新 |
| `update_text_editor` | 更新文本 |
| `keep_unchanged_editor` | 保持不变 |
| `check_for_updates_f26f32` | 检查更新 |
| `restart_markdown_vision_7e50f8` | 重启Markdown Vision |
| `text_search_10155f` | 文本搜索 |
| `count_match_ef9195` | {count}个搜索结果 |
| `count_matches_43682a` | {count}个搜索结果 |
| `previous_match_daa2f8` | 上一个搜索结果 |
| `next_match_825e5a` | 下一个搜索结果 |
| `close_search_55656b` | 关闭搜索 |
| `close_settings_0ccfef` | 关闭设置 |
| `variable_width_font_0836b2` | 比例字体 |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | 输入字体名称或选择已安装的字体。 |
| `fixed_width_font_3de094` | 等宽字体 |
| `used_for_code_and_other_monospaced_text_84b6ed` | 用于代码和其他等宽文本。 |
| `text_size_d68761` | 文字大小 |
| `automatic_text_size_919785` | 自动文字大小 |
| `automatic_d461a4` | 自动 |
| `line_spacing_0db45d` | 行距 |
| `page_width_limit_19528b` | 页面宽度限制 |
| `automatic_page_width_bd5c30` | 自动页面宽度 |
| `markdown_editor_da0ea6` | Markdown编辑器 |
| `editor_view_1d1833` | 编辑器视图 |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | 左侧 Markdown，右侧可视化编辑器 |
| `split_0b61a1` | 左右分屏 ↔ |
| `visual_above_markdown_a04e0f` | 可视化编辑器在上，Markdown 在下 |
| `split_b3b924` | 上下分屏 ↕ |
| `visual_ba3033` | 可视化 |
| `save_ctrl_s_4be89e` | 保存（Ctrl+S） |
| `save_1509f5` | 保存 |
| `save_as_ctrl_shift_s_0f132a` | 另存为 (Ctrl+Shift+S) |
| `save_as_a4b76a` | 另存为… |
| `markdown_source_580118` | Markdown源码 |
| `markdown_pane_width_ab0129` | Markdown 窗格宽度 |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}%视觉 |
| `visual_editor_5665dd` | 可视化编辑器 |
| `visual_editing_restriction_d42cea` | 可视化编辑限制 |
| `edit_in_markdown_165fd4` | 编辑于Markdown |
| `dismiss_48845b` | 关闭提示 |
| `count_word_1f505c` | {count}字 |
| `count_words_caab29` | {count}字 |
| `approximate_word_count_7b987a` | 估计词数：{count} |
| `line_line_column_column_21e9f4` | 行{line}，列{column} |
| `untitled_md_2dccf8` | 未命名.md |
| `save_your_changes_56dd16` | 保存您的更改吗？ |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | 创建新文件之前保存当前文档。 |
| `cancel_19766e` | 取消 |
| `discard_changes_f9bfa3` | 放弃更改 |
| `switch_to_light_mode_bfa0ca` | 切换到浅色模式 |
| `enter_the_name_of_any_installed_font_b57a72` | 输入任何已安装字体的名称。 |
| `loading_installed_fonts_200c74` | 正在加载已安装的字体… |
| `count_fixed_width_font_available_5488f8` | 可用的等宽字体：{count} |
| `count_fixed_width_fonts_available_5df530` | 可用的等宽字体：{count} |
| `count_variable_width_font_available_583582` | 可用的比例字体：{count} |
| `count_variable_width_fonts_available_9d234c` | 可用的比例字体：{count} |
| `count_match_for_query_2e77ac` | “{query}”的搜索结果：{count} |
| `count_matches_for_query_7db710` | “{query}”的搜索结果：{count} |
| `no_fixed_width_fonts_match_query_fb1fab` | 没有与“{query}”匹配的等宽字体。 |
| `no_variable_width_fonts_match_query_a64030` | 没有与“{query}”匹配的比例字体。 |
| `current_of_total_35d900` | 第 {current} 个，共 {total} 个 |
| `current_of_total_scope_94ebe5` | 第 {current} 个，共 {total} 个 · {scope} |
| `copy_code_49a005` | 复制代码 |
| `clipboard_unavailable_4ff69f` | 剪贴板不可用 |
| `code_copied_39868c` | 代码已复制 |
| `could_not_copy_code_4a563f` | 无法复制代码 |
| `the_native_print_dialog_could_not_open_320714` | 无法打开系统打印对话框。 |
| `could_not_open_the_print_dialog_4bd85a` | 无法打开打印对话框。 |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | 放弃未保存的更改并打开另一个文档？ |
| `could_not_open_document_69abda` | 无法打开文档 |
| `release_check_failed_7b2758` | 版本检查失败 |
| `unrecognized_release_list_62d1cb` | 无法识别的版本列表 |
| `unrecognized_version_d1b8d2` | 无法识别的版本 |
| `latest_version_version_d1c996` | 最新版本：{version} |
| `unsupported_architecture_087e4f` | 不支持的架构 |
| `installer_verification_is_unavailable_98306d` | 安装程序验证不可用 |
| `unsupported_platform_a96892` | 不支持的平台 |
| `latest_compatible_version_version_fa3079` | 最新兼容版本：{version} |
| `upgrade_markdown_vision_de1b45` | 更新 Markdown Vision |
| `download_macos_update_95d8f3` | 下载 macOS 更新 |
| `download_linux_update_707c5e` | 下载 Linux 更新 |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | 无法检查更新。检查您的互联网连接，然后重试。 |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | 正在下载并验证更新。可能会要求您进行身份验证。 |
| `update_installed_restart_to_use_the_new_version_bb8a43` | 已安装更新。重新启动即可使用新版本。 |
| `update_failed_error_e4f7dc` | 更新失败：{error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | 下载并运行 Markdown Vision 安装程序？首先保存所有打开的文档。安装程序可能会要求关闭 Markdown Vision。 |
| `downloading_and_verifying_update_02b3ba` | 正在下载并验证更新… |
| `installer_started_865e10` | 安装程序开始。 |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | 无法下载、验证或启动安装程序。请再试一次。 |
| `discard_unsaved_changes_and_restart_6d1602` | 放弃未保存的更改并重新启动？ |
| `could_not_restart_error_71e2d2` | 无法重新启动：{error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | 双击或按 Alt+Enter 编辑此项 |
| `saving_23e392` | 正在保存… |
| `unsaved_6250d5` | 未保存 |
| `saved_b5c120` | 已保存 |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | 无法保存草稿。您的更改仍在编辑器中。 |
| `embedded_content_1bca8f` | 嵌入内容 |
| `edit_table_source_c7189f` | 编辑表格源码 |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | 选择一个单元格进行编辑或更改表格。打字时按 Alt+Enter。 |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | 该块包含需要在 Markdown 中编辑的格式。 |
| `code_contents_5a1f26` | 代码内容 |
| `type_directly_to_edit_this_indented_code_block_769291` | 直接在此缩进代码块中输入即可编辑。 |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | 直接在代码块中键入以编辑其内容。使用 Markdown 编辑标记其开始和结束位置的行。 |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | 使用“编辑列表项”更改文本。要更改嵌套层级，请在 Markdown 中编辑列表。 |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | 使用“编辑列表项”或复选框更改此列表。 |
| `edit_list_item_text_a982e6` | 编辑列表项文本 |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | 直接编辑列表项文本。在 Markdown 中编辑列表结构。 |
| `task_4bc74b` | 任务 |
| `edit_item_9f84ee` | 编辑列表项 |
| `list_options_fc3320` | 列表选项 |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | 该表需要在Markdown中编辑。 |
| `add_text_to_this_empty_cell_37f900` | 将文本添加到此空单元格 |
| `edit_this_cell_in_markdown_4304b1` | 在 Markdown 中编辑此单元格 |
| `edit_table_cell_a4212e` | 编辑表格单元格 |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | 选择一个单元格进行编辑。您可以在 Markdown 中编辑原始表格。 |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | 该单元格包含 HTML。在 Markdown 中编辑此单元格。 |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | 该单元格使用 Markdown 引用。在 Markdown 中编辑此单元格。 |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | 键入以编辑此单元格。按 Alt+Enter 查看表格选项。 |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | 可直接在纯文本单元格中输入。若内容较复杂，请使用表格选项或编辑 Markdown。 |
| `table_options_cf924a` | 表格选项 |
| `edit_note_299e60` | 编辑脚注 |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | 使用“编辑脚注”更改支持编辑的脚注文本。 |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | 此布局使用 HTML。在 Markdown 中编辑。 |
| `edit_inline_code_bf93ee` | 编辑内联代码 |
| `edit_list_structure_in_markdown_17a222` | 编辑Markdown中的列表结构 |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | 直接编辑纯列表文本。编辑Markdown中的列表结构。 |
| `edit_code_in_table_cell_535cb9` | 在表格单元格中编辑代码 |
| `edit_table_cell_text_ca30e7` | 编辑表格单元格文本 |
| `edit_preformatted_text_9737bd` | 编辑预格式化文本 |
| `edit_disclosure_title_79fb92` | 编辑展开区域的标题 |
| `edit_text_7967d9` | 编辑文字 |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | 输入单元格文本。按 Alt+Enter 查看单元格选项。 |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | 直接编辑文本。编辑Markdown中的周围结构。 |
| `edit_structure_in_markdown_fe607e` | 在Markdown中编辑结构 |
| `edit_quoted_text_9de474` | 编辑引用的文本 |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | 直接编辑纯文本。在 Markdown 中编辑块引用结构。 |
| `edit_heading_text_f3806c` | 编辑标题文本 |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | 直接编辑标题文本。编辑Markdown中的标题样式。 |
| `heading_style_c0c25b` | 标题样式 |
| `edit_this_item_in_markdown_83b112` | 在 Markdown 中编辑此列表项 |
| `markdown_only_f6e1f7` | 仅 Markdown |
| `visual_only_29a136` | 仅可视化编辑器 |
| `action_64cff1` | 操作 |
| `apply_31e392` | 应用 |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Markdown发生了变化。重新打开此编辑器再试一次。 |
| `edit_list_item_f69436` | 编辑列表项 |
| `item_text_markdown_0bbe7d` | 列表项文本 (Markdown) |
| `new_item_b84cad` | 新建列表项 |
| `enter_item_text_or_choose_remove_item_e4003a` | 输入列表项文本，或选择“移除列表项”。 |
| `enter_item_text_82c7ea` | 输入列表项文本。 |
| `add_item_below_a6d694` | 在下方添加列表项 |
| `remove_item_5a89ed` | 移除列表项 |
| `indent_under_previous_item_2e6b03` | 在上一项下缩进 |
| `outdent_item_07e9b1` | 减少列表项缩进 |
| `this_item_has_no_parent_to_outdent_from_dd148a` | 此列表项没有上级列表项，无法减少缩进。 |
| `heading_b34f17` | 标题 |
| `edit_footnote_cdcee6` | 编辑脚注 |
| `note_text_369e75` | 脚注文本 |
| `enter_the_note_text_on_one_line_3a7a5a` | 在一行中输入注释文本。 |
| `cell_text_9cd173` | 单元格文本 |
| `add_row_below_3d4830` | 在下方添加一行 |
| `add_column_after_38817e` | 在当前列之后添加一列 |
| `new_column_editor` | 新列 |
| `remove_row_1810fd` | 删除行 |
| `remove_column_9807a2` | 删除列 |
| `align_column_left_6d9399` | 左对齐列 |
| `center_column_1b9b8b` | 将列内容居中 |
| `align_column_right_850a8f` | 右对齐列 |
| `cell_text_markdown_a9e5f9` | 单元格文本 (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | 添加换行符之前关闭内联代码。 |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | 该单元格文本将更改表格结构。在 Markdown 中的分隔符之前添加一个空格。 |
| `alt_text_16f898` | 替代文本 |
| `link_text_markdown_9b92bd` | 链接文字（Markdown） |
| `image_url_e55026` | 图片网址 |
| `link_url_9dfd0b` | 链接网址 |
| `url_e7a241` | 网址 |
| `edit_linked_image_2f9456` | 编辑链接图像 |
| `edit_image_d9d12b` | 编辑图像 |
| `edit_link_94026c` | 编辑链接 |
| `enter_text_without_a_closing_bracket_0e7315` | 输入不带右括号的文本。 |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | 输入不带空格或括号的 HTTP 或 HTTPS URL。 |
| `visual_pane_height_4ad683` | 可视化窗格高度 |
| `return_to_reader_dcd8f7` | 返回阅读视图 |
| `number_of_columns_2_8_893663` | 列数 (2–8) |
| `header_number_b79482` | 列标题 {number} |
| `cell_75fa38` | 单元格 |
| `open_1f1d59` | 打开… |
| `new_18fdd5` | 新 |
| `print_07c371` | 打印… |
| `close_7d9eb7` | 关闭 |
| `file_50009c` | 文件 |
| `about_markdown_vision_c6d62d` | 关于Markdown Vision… |
| `quit_markdown_vision_01c01b` | 退出 Markdown Vision |
| `quit_b3eb37` | 退出 |
| `help_b79cac` | 帮助 |
| `could_not_enumerate_system_fonts_00e652` | 无法枚举系统字体 |
| `no_system_fonts_found_a8a9af` | 没有找到系统字体 |
| `could_not_open_document_640c27` | 无法打开文档 |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | 无法打开该文档。您当前的更改仍然可用。 {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | 放弃未保存的更改并关闭 Markdown Vision？ |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | 放弃未保存的更改并退出 Markdown Vision？ |
| `unknown_confirmation_request_feea29` | 未知的确认请求 |
| `keep_editing_624a83` | 继续编辑 |
| `discard_eb1a70` | 丢弃 |
| `unsaved_changes_a710c2` | 未保存的更改 |
| `the_document_is_no_longer_open_use_save_as_671c50` | 此文档已关闭。请使用“另存为”。 |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | 此文件混用了不同的换行符，或包含无效的 UTF-8 编码。请使用“另存为”。 |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | 不支持通过符号链接保存。请使用“另存为”。 |
| `invalid_destination_14f03f` | 目的地无效 |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | 磁盘上的目标文件已更改。请使用“另存为”保留您的修改。 |
| `the_update_process_failed_010689` | 更新过程失败。 |
| `could_not_restore_the_open_document_69d724` | 无法恢复打开的文档。 |
| `could_not_restart_markdown_vision_6ead36` | 无法重新启动 Markdown Vision。 |
| `restart_is_not_available_on_this_platform_998ef6` | 在此平台上无法重新启动。 |
| `the_update_information_is_invalid_dbcffc` | 更新信息无效。 |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | 自动更新需要安装 DEB 或 RPM 软件包。 |
| `this_architecture_is_not_supported_ae063c` | 不支持此架构。 |
| `could_not_identify_the_linux_distribution_18bbdb` | 无法识别 Linux 发行版。 |
| `the_rpm_package_manager_is_unavailable_9ce83b` | RPM 包管理器不可用。 |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision 未作为兼容的 RPM 软件包安装。 |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | 此更新并不比已安装的软件包新。 |
| `the_debian_package_manager_is_unavailable_b5d66b` | Debian 软件包管理器不可用。 |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision 未作为 DEB 软件包安装。 |
| `could_not_determine_the_installed_version_f1a1f1` | 无法确定安装的版本。 |
| `could_not_compare_package_versions_465d4e` | 无法比较软件包版本。 |
| `could_not_create_a_temporary_download_folder_36407c` | 无法创建临时下载文件夹。 |
| `could_not_start_the_download_b4acf0` | 无法开始下载。 |
| `the_update_could_not_be_downloaded_4d6fd7` | 无法下载更新。 |
| `could_not_verify_the_update_2cd2c5` | 无法验证更新。 |
| `the_downloaded_update_failed_verification_60519b` | 下载的更新验证失败。 |
| `could_not_inspect_the_update_package_9812b2` | 无法检查更新包。 |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | 下载的包包含意外的元数据。 |
| `version_dd1679` | 版本 |
| `could_not_start_the_system_installer_907ba2` | 无法启动系统安装程序。 |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | 安装被取消或失败。请再试一次。 |
| `could_not_verify_the_installed_update_04a200` | 无法验证已安装的更新。 |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | 安装程序未将 Markdown Vision 更新到预期版本。 |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | 自动 DEB 更新仅适用于 Linux。 |
| `invalid_preferences_bc6b57` | 无效的偏好设置 |
| `invalid_key_b06fe9` | 无效{key} |
| `unsupported_preferences_version_54734c` | 不支持的首选项版本 |
| `missing_preferences_679970` | 缺少偏好 |
| `invalid_preferences_directory_a6f362` | 首选项目录无效 |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision 无法读取该文件。 |
| `markdown_files_177420` | Markdown 文件 |
| `text_files_c5df15` | 文本文件 |
| `all_files_866956` | 所有文件 |
| `save_markdown_file_813f90` | 保存 Markdown 文件 |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | 此文档已关闭。请重新打开文件或使用“另存为”。 |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | 使用“另存为”创建此文件的 UTF-8 副本。 |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | 该文件使用混合行结尾。使用“另存为”创建行结尾一致的副本。 |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows 无法打开“另存为”对话框。 |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | 草稿无法编码为 UTF-8。 |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows 无法读取所选目的地。 |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | 文件在磁盘上已更改或不可用。使用“另存为”将您的编辑保存在单独的副本中。 |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows 无法保存文件。检查文件是否可写，或使用“另存为”。 |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows 保存过程中无法恢复原始文件。原件位于{path}。 |
| `the_save_request_could_not_be_completed_75cfa5` | 无法完成保存请求。 |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision 无法在本地应用程序数据文件夹中准备其应用程序文件。 |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | 需要 Microsoft Edge WebView2 运行时。 |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Markdown Vision Native 安装程序 |
| `licensed_under_gpl_3_0_only_5f7e0f` | 已获得 GPL-3.0-only 许可 |
| `this_installer_requires_windows_on_arm64_ef7f28` | 此安装程序需要 ARM64 上的 Windows。 |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision 正在运行。继续之前请保存所有未保存的文档。关闭 Markdown Vision 并继续安装吗？ |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | 安装程序无法关闭 Markdown Vision。手动关闭它并再次运行安装程序。 |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision 仍在运行。请关闭它并选择“重试”，或取消安装。 |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | 正在删除当前安装的 Markdown Vision 版本… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | 无法移除现有的 Markdown Vision 安装。安装程序将停止，不会安装 Markdown Vision Native。 |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | 您可以在 Windows 设置中选择 Markdown Vision 作为 Markdown 文件的默认应用。 |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | 安装后打开 Windows 默认应用设置 |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision 已安装。 |
| `open_markdown_vision_when_setup_closes_8422c7` | 安装程序关闭时打开 Markdown Vision |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | 无法安装 Markdown Vision Native。安装程序将停止，不会注册未完成的安装。 |
| `markdown_document_00271f` | Markdown 文档 |
| `markdown_vision_preview_handler_8c95f7` | Markdown Vision 预览处理程序 |
| `markdown_file_viewer_c36ee7` | Markdown 文件查看器 |
| `uninstall_fe1995` | 卸载 |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision无法启动。 {error} |
| `unknown_native_method_method_cc7ca9` | 未知的本机方法：{method} |
| `text_71988c` | 文字 |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | {level} 级标题 |
| `normal_text_a2adc4` | 普通文本 |
| `footnotes_ad6fb5` | 脚注 |
| `size_px_8d05e6` | {size} 像素 |
| `link_text_insert_default` | 链接文本 |
| `back_to_footnote_reference` | 返回脚注引用处 |

## Locale zh-hant

Chinese (Traditional)

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Markdown 格式化 |
| `undo_a8283a` | 復原 |
| `redo_742739` | 重做 |
| `bold_ctrl_b_84787d` | 粗體 (Ctrl+B) |
| `bold_94fee6` | 粗體 |
| `italic_ctrl_i_ccc60d` | 斜體 (Ctrl+I) |
| `italic_9bf37c` | 斜體 |
| `strikethrough_9aabbc` | 刪除線 |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | 循環切換標題層級 (H1–H6, 接著切換至正文) |
| `cycle_heading_level_bde9c4` | 循環切換標題層級 |
| `bulleted_list_ce51b3` | 項目符號清單 |
| `task_list_5d3253` | 任務清單 |
| `numbered_list_cc62f6` | 編號清單 |
| `quote_eb4cde` | 引文 |
| `inline_code_e767de` | 內聯程式碼 |
| `code_block_754538` | 程式碼區塊 |
| `link_a6a32d` | 連結 |
| `insert_table_67318e` | 插入表格 |
| `edit_markdown_6ff388` | 編輯Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | 新 Markdown 檔案 (Ctrl+N) |
| `new_markdown_file_0928e9` | 新 Markdown 檔案 |
| `open_markdown_file_b7764a` | 開啟 Markdown 檔案 |
| `print_ctrl_p_5c4406` | 列印（Ctrl+P） |
| `print_document_2a024b` | 列印文件 |
| `search_text_38d268` | 搜尋文字 |
| `settings_74a883` | 設定 |
| `switch_to_dark_mode_fc43ea` | 切換到深色模式 |
| `about_markdown_vision_08f9a5` | 關於Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | GNU GPLv3許可證 |
| `version_version_a18745` | 版本{version} |
| `latest_version_checking_4bfedc` | 最新版本：正在檢查… |
| `update_c1c100` | 更新 |
| `update_text_editor` | 更新文字 |
| `keep_unchanged_editor` | 保持不變 |
| `check_for_updates_f26f32` | 檢查更新 |
| `restart_markdown_vision_7e50f8` | 重啟Markdown Vision |
| `text_search_10155f` | 文字搜尋 |
| `count_match_ef9195` | {count}筆搜尋結果 |
| `count_matches_43682a` | {count}筆搜尋結果 |
| `previous_match_daa2f8` | 上一筆搜尋結果 |
| `next_match_825e5a` | 下一筆搜尋結果 |
| `close_search_55656b` | 關閉搜尋 |
| `close_settings_0ccfef` | 關閉設定 |
| `variable_width_font_0836b2` | 比例字型 |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | 輸入字型名稱或選擇已安裝的字型。 |
| `fixed_width_font_3de094` | 等寬字型 |
| `used_for_code_and_other_monospaced_text_84b6ed` | 用於程式碼和其他等寬文字。 |
| `text_size_d68761` | 文字大小 |
| `automatic_text_size_919785` | 自動文字大小 |
| `automatic_d461a4` | 自動 |
| `line_spacing_0db45d` | 行距 |
| `page_width_limit_19528b` | 頁面寬度限制 |
| `automatic_page_width_bd5c30` | 自動頁面寬度 |
| `markdown_editor_da0ea6` | Markdown編輯器 |
| `editor_view_1d1833` | 編輯器檢視 |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | 左側 Markdown，右側視覺化編輯器 |
| `split_0b61a1` | 左右分割 ↔ |
| `visual_above_markdown_a04e0f` | 視覺化編輯器在上，Markdown 在下 |
| `split_b3b924` | 上下分割 ↕ |
| `visual_ba3033` | 視覺 |
| `save_ctrl_s_4be89e` | 儲存（Ctrl+S） |
| `save_1509f5` | 儲存 |
| `save_as_ctrl_shift_s_0f132a` | 另存新檔 (Ctrl+Shift+S) |
| `save_as_a4b76a` | 另存新檔… |
| `markdown_source_580118` | Markdown原始碼 |
| `markdown_pane_width_ab0129` | Markdown 窗格寬度 |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}%視覺 |
| `visual_editor_5665dd` | 視覺化編輯器 |
| `visual_editing_restriction_d42cea` | 視覺化編輯限制 |
| `edit_in_markdown_165fd4` | 在 Markdown 中編輯 |
| `dismiss_48845b` | 關閉通知 |
| `count_word_1f505c` | {count}字 |
| `count_words_caab29` | {count}字 |
| `approximate_word_count_7b987a` | 估計字詞數：{count} |
| `line_line_column_column_21e9f4` | 行{line}，列{column} |
| `untitled_md_2dccf8` | 未命名.md |
| `save_your_changes_56dd16` | 儲存您的變更嗎？ |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | 在建立新檔案之前儲存目前檔案。 |
| `cancel_19766e` | 取消 |
| `discard_changes_f9bfa3` | 放棄變更 |
| `switch_to_light_mode_bfa0ca` | 切換至淺色模式 |
| `enter_the_name_of_any_installed_font_b57a72` | 輸入任何已安裝字型的名稱。 |
| `loading_installed_fonts_200c74` | 正在載入已安裝的字型… |
| `count_fixed_width_font_available_5488f8` | 可用的等寬字型：{count} |
| `count_fixed_width_fonts_available_5df530` | 可用的等寬字型：{count} |
| `count_variable_width_font_available_583582` | 可用的比例字型：{count} |
| `count_variable_width_fonts_available_9d234c` | 可用的比例字型：{count} |
| `count_match_for_query_2e77ac` | 「{query}」的搜尋結果：{count} |
| `count_matches_for_query_7db710` | 「{query}」的搜尋結果：{count} |
| `no_fixed_width_fonts_match_query_fb1fab` | 沒有符合「{query}」的等寬字型。 |
| `no_variable_width_fonts_match_query_a64030` | 沒有符合「{query}」的比例字型。 |
| `current_of_total_35d900` | 第 {current} 筆，共 {total} 筆 |
| `current_of_total_scope_94ebe5` | 第 {current} 筆，共 {total} 筆 · {scope} |
| `copy_code_49a005` | 複製程式碼 |
| `clipboard_unavailable_4ff69f` | 剪貼簿不可用 |
| `code_copied_39868c` | 程式碼已複製 |
| `could_not_copy_code_4a563f` | 無法複製程式碼 |
| `the_native_print_dialog_could_not_open_320714` | 無法開啟系統列印對話方塊。 |
| `could_not_open_the_print_dialog_4bd85a` | 無法開啟列印對話方塊。 |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | 放棄未儲存的變更並開啟另一份文件？ |
| `could_not_open_document_69abda` | 無法開啟文件 |
| `release_check_failed_7b2758` | 版本檢查失敗 |
| `unrecognized_release_list_62d1cb` | 無法辨識的版本清單 |
| `unrecognized_version_d1b8d2` | 無法辨識的版本 |
| `latest_version_version_d1c996` | 最新版本：{version} |
| `unsupported_architecture_087e4f` | 不支援的架構 |
| `installer_verification_is_unavailable_98306d` | 無法驗證安裝程式的完整性 |
| `unsupported_platform_a96892` | 不支援的平台 |
| `latest_compatible_version_version_fa3079` | 最新相容版本：{version} |
| `upgrade_markdown_vision_de1b45` | 更新 Markdown Vision |
| `download_macos_update_95d8f3` | 下載 macOS 更新 |
| `download_linux_update_707c5e` | 下載 Linux 更新 |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | 無法檢查更新。檢查您的網路連接，然後再試一次。 |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | 正在下載並驗證更新。系統可能會要求您驗證身分。 |
| `update_installed_restart_to_use_the_new_version_bb8a43` | 已安裝更新。重新啟動即可使用新版本。 |
| `update_failed_error_e4f7dc` | 更新失敗：{error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | 下載並執行 Markdown Vision 安裝程式？首先儲存所有開啟的檔案。安裝程式可能會要求關閉 Markdown Vision。 |
| `downloading_and_verifying_update_02b3ba` | 正在下載並驗證更新… |
| `installer_started_865e10` | 安裝程式開始。 |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | 無法下載、驗證或啟動安裝程式。請再試一次。 |
| `discard_unsaved_changes_and_restart_6d1602` | 放棄未儲存的變更並重新啟動？ |
| `could_not_restart_error_71e2d2` | 無法重新啟動：{error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | 雙擊或按 Alt+Enter 編輯此項 |
| `saving_23e392` | 正在儲存… |
| `unsaved_6250d5` | 未儲存 |
| `saved_b5c120` | 已儲存 |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | 無法儲存草稿。您的變更仍在編輯器中。 |
| `embedded_content_1bca8f` | 嵌入內容 |
| `edit_table_source_c7189f` | 編輯表格原始碼 |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | 選擇一個儲存格進行編輯或變更表格。打字時按 Alt+Enter。 |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | 此區塊包含需要在 Markdown 中編輯的格式。 |
| `code_contents_5a1f26` | 程式碼內容 |
| `type_directly_to_edit_this_indented_code_block_769291` | 直接在此縮排程式碼區塊中輸入即可編輯。 |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | 直接在程式碼區塊中鍵入以編輯其內容。使用 Markdown 編輯標記其開始和結束位置的行。 |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | 使用「編輯清單項目」變更文字。若要變更巢狀層級，請在 Markdown 中編輯清單。 |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | 使用「編輯清單項目」或核取方塊變更此清單。 |
| `edit_list_item_text_a982e6` | 編輯清單項目文字 |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | 直接編輯清單項目的文字。在 Markdown 中編輯清單結構。 |
| `task_4bc74b` | 任務 |
| `edit_item_9f84ee` | 編輯清單項目 |
| `list_options_fc3320` | 清單選項 |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | 表格需要在Markdown中編輯。 |
| `add_text_to_this_empty_cell_37f900` | 將文字新增至此空白儲存格 |
| `edit_this_cell_in_markdown_4304b1` | 在 Markdown 中編輯此儲存格 |
| `edit_table_cell_a4212e` | 編輯表格儲存格 |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | 選擇一個儲存格進行編輯。您可以在 Markdown 中編輯原始表格。 |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | 該儲存格包含 HTML。在 Markdown 中編輯此儲存格。 |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | 此儲存格使用 Markdown 引用。在 Markdown 中編輯此儲存格。 |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | 鍵入以編輯此儲存格。按 Alt+Enter 查看表格選項。 |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | 可直接在純文字儲存格中輸入。若內容較複雜，請使用表格選項或編輯 Markdown。 |
| `table_options_cf924a` | 表格選項 |
| `edit_note_299e60` | 編輯註腳 |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | 使用「編輯註腳」變更支援編輯的註腳文字。 |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | 此版面配置使用 HTML。在 Markdown 中編輯。 |
| `edit_inline_code_bf93ee` | 編輯內聯程式碼 |
| `edit_list_structure_in_markdown_17a222` | 在 Markdown 中編輯清單結構 |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | 直接編輯清單的純文字。在 Markdown 中編輯清單結構。 |
| `edit_code_in_table_cell_535cb9` | 在表格儲存格中編輯程式碼 |
| `edit_table_cell_text_ca30e7` | 編輯表格儲存格文字 |
| `edit_preformatted_text_9737bd` | 編輯預先格式化的文字 |
| `edit_disclosure_title_79fb92` | 編輯展開區域的標題 |
| `edit_text_7967d9` | 編輯文字 |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | 輸入儲存格文字。按 Alt+Enter 查看儲存格選項。 |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | 直接編輯文字。編輯Markdown中的周圍結構。 |
| `edit_structure_in_markdown_fe607e` | 在Markdown中編輯結構 |
| `edit_quoted_text_9de474` | 編輯引用的文字 |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | 直接編輯純文字。在 Markdown 中編輯區塊引文結構。 |
| `edit_heading_text_f3806c` | 編輯標題文字 |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | 直接編輯標題文字。編輯Markdown中的標題樣式。 |
| `heading_style_c0c25b` | 標題樣式 |
| `edit_this_item_in_markdown_83b112` | 在 Markdown 中編輯此清單項目 |
| `markdown_only_f6e1f7` | 僅 Markdown |
| `visual_only_29a136` | 僅視覺化編輯器 |
| `action_64cff1` | 操作 |
| `apply_31e392` | 套用 |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Markdown發生了變化。重新開啟此編輯器再試一次。 |
| `edit_list_item_f69436` | 編輯清單項目 |
| `item_text_markdown_0bbe7d` | 清單項目文字 (Markdown) |
| `new_item_b84cad` | 新增清單項目 |
| `enter_item_text_or_choose_remove_item_e4003a` | 輸入清單項目文字，或選擇「移除清單項目」。 |
| `enter_item_text_82c7ea` | 輸入清單項目文字。 |
| `add_item_below_a6d694` | 在下方新增清單項目 |
| `remove_item_5a89ed` | 移除清單項目 |
| `indent_under_previous_item_2e6b03` | 在上一項下縮排 |
| `outdent_item_07e9b1` | 減少清單項目縮排 |
| `this_item_has_no_parent_to_outdent_from_dd148a` | 此清單項目沒有上層項目，因此無法減少縮排。 |
| `heading_b34f17` | 標題 |
| `edit_footnote_cdcee6` | 編輯註腳 |
| `note_text_369e75` | 註腳文字 |
| `enter_the_note_text_on_one_line_3a7a5a` | 在一行中輸入註釋文字。 |
| `cell_text_9cd173` | 儲存格文字 |
| `add_row_below_3d4830` | 在下方新增一列 |
| `add_column_after_38817e` | 在目前的欄之後新增一欄 |
| `new_column_editor` | 新欄 |
| `remove_row_1810fd` | 刪除列 |
| `remove_column_9807a2` | 刪除欄 |
| `align_column_left_6d9399` | 將欄內容靠左對齊 |
| `center_column_1b9b8b` | 將欄內容置中 |
| `align_column_right_850a8f` | 將欄內容靠右對齊 |
| `cell_text_markdown_a9e5f9` | 儲存格文字 (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | 新增換行符之前關閉內聯代碼。 |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | 此儲存格文字會變更表格結構。請在 Markdown 的分隔符號前新增一個空格。 |
| `alt_text_16f898` | 替代文字 |
| `link_text_markdown_9b92bd` | 連結文字（Markdown） |
| `image_url_e55026` | 圖片網址 |
| `link_url_9dfd0b` | 連結網址 |
| `url_e7a241` | 網址 |
| `edit_linked_image_2f9456` | 編輯連結圖像 |
| `edit_image_d9d12b` | 編輯影像 |
| `edit_link_94026c` | 編輯連結 |
| `enter_text_without_a_closing_bracket_0e7315` | 輸入不帶右括號的文字。 |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | 輸入不含空格或括號的 HTTP 或 HTTPS URL。 |
| `visual_pane_height_4ad683` | 視覺化窗格高度 |
| `return_to_reader_dcd8f7` | 返回閱讀檢視 |
| `number_of_columns_2_8_893663` | 欄數 (2–8) |
| `header_number_b79482` | 欄標題 {number} |
| `cell_75fa38` | 儲存格 |
| `open_1f1d59` | 開啟… |
| `new_18fdd5` | 新 |
| `print_07c371` | 列印… |
| `close_7d9eb7` | 關閉 |
| `file_50009c` | 檔案 |
| `about_markdown_vision_c6d62d` | 關於Markdown Vision… |
| `quit_markdown_vision_01c01b` | 退出 Markdown Vision |
| `quit_b3eb37` | 結束 |
| `help_b79cac` | 說明 |
| `could_not_enumerate_system_fonts_00e652` | 無法列舉系統字型 |
| `no_system_fonts_found_a8a9af` | 沒有找到系統字型 |
| `could_not_open_document_640c27` | 無法開啟文件 |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | 無法開啟此文件。您目前的變更仍然可用。 {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | 放棄未儲存的變更並關閉 Markdown Vision？ |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | 放棄未儲存的變更並退出 Markdown Vision？ |
| `unknown_confirmation_request_feea29` | 未知的確認請求 |
| `keep_editing_624a83` | 繼續編輯 |
| `discard_eb1a70` | 丟棄 |
| `unsaved_changes_a710c2` | 未儲存的變更 |
| `the_document_is_no_longer_open_use_save_as_671c50` | 這份文件已關閉。請使用「另存新檔」。 |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | 此檔案混用了不同的換行字元，或包含無效的 UTF-8 編碼。請使用「另存新檔」。 |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | 不支援透過符號連結儲存。請使用「另存新檔」。 |
| `invalid_destination_14f03f` | 目的地無效 |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | 磁碟上的目標檔案已變更。請使用「另存新檔」保留您的修改。 |
| `the_update_process_failed_010689` | 更新過程失敗。 |
| `could_not_restore_the_open_document_69d724` | 無法還原已開啟的文件。 |
| `could_not_restart_markdown_vision_6ead36` | 無法重新啟動 Markdown Vision。 |
| `restart_is_not_available_on_this_platform_998ef6` | 在此平臺上無法重新啟動。 |
| `the_update_information_is_invalid_dbcffc` | 更新資訊無效。 |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | 自動更新需要安裝 DEB 或 RPM 套件。 |
| `this_architecture_is_not_supported_ae063c` | 不支援此架構。 |
| `could_not_identify_the_linux_distribution_18bbdb` | 無法識別 Linux 發行版本。 |
| `the_rpm_package_manager_is_unavailable_9ce83b` | RPM 套件管理器不可用。 |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision 未安裝為相容的 RPM 套件。 |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | 此更新並不比已安裝的套件新。 |
| `the_debian_package_manager_is_unavailable_b5d66b` | Debian 軟體套件管理器不可用。 |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision 並非以 DEB 套件安裝。 |
| `could_not_determine_the_installed_version_f1a1f1` | 無法確定安裝的版本。 |
| `could_not_compare_package_versions_465d4e` | 無法比較套件版本。 |
| `could_not_create_a_temporary_download_folder_36407c` | 無法建立臨時下載資料夾。 |
| `could_not_start_the_download_b4acf0` | 無法開始下載。 |
| `the_update_could_not_be_downloaded_4d6fd7` | 無法下載更新。 |
| `could_not_verify_the_update_2cd2c5` | 無法驗證更新。 |
| `the_downloaded_update_failed_verification_60519b` | 下載的更新驗證失敗。 |
| `could_not_inspect_the_update_package_9812b2` | 無法檢查更新包。 |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | 下載的套件包含意外的元資料。 |
| `version_dd1679` | 版本 |
| `could_not_start_the_system_installer_907ba2` | 無法啟動系統安裝程式。 |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | 安裝被取消或失敗。請再試一次。 |
| `could_not_verify_the_installed_update_04a200` | 無法驗證已安裝的更新。 |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | 安裝程式未將 Markdown Vision 更新到預期版本。 |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | 自動 DEB 更新僅適用於 Linux。 |
| `invalid_preferences_bc6b57` | 無效的偏好設定 |
| `invalid_key_b06fe9` | 無效{key} |
| `unsupported_preferences_version_54734c` | 不支援的偏好設定版本 |
| `missing_preferences_679970` | 缺少偏好 |
| `invalid_preferences_directory_a6f362` | 偏好設定目錄無效 |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision 無法讀取該檔案。 |
| `markdown_files_177420` | Markdown 檔案 |
| `text_files_c5df15` | 文字檔案 |
| `all_files_866956` | 所有檔案 |
| `save_markdown_file_813f90` | 儲存 Markdown 檔案 |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | 這份文件已關閉。請重新開啟檔案或使用「另存新檔」。 |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | 請使用「另存新檔」建立此檔案的 UTF-8 副本。 |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | 此檔案混用了不同的換行字元。請使用「另存新檔」建立換行格式一致的副本。 |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows 無法開啟「另存新檔」對話方塊。 |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | 草稿無法編碼為 UTF-8。 |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows 無法讀取所選目的地。 |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | 磁碟上的檔案已變更或無法使用。請使用「另存新檔」將變更儲存在另一份副本中。 |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows 無法儲存檔案。請確認檔案是否可寫入，或使用「另存新檔」。 |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows 儲存過程中無法恢復原始檔案。原件位於{path}。 |
| `the_save_request_could_not_be_completed_75cfa5` | 無法完成儲存請求。 |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision 無法在本機應用程式資料夾中準備應用程式檔案。 |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | 需要 Microsoft Edge WebView2 執行階段。 |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Markdown Vision Native 安裝程式 |
| `licensed_under_gpl_3_0_only_5f7e0f` | 已獲得 GPL-3.0-only 許可 |
| `this_installer_requires_windows_on_arm64_ef7f28` | 此安裝程式需要 ARM64 上的 Windows。 |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision 正在執行。繼續之前請儲存所有未儲存的文件。要關閉 Markdown Vision 並繼續安裝嗎？ |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | 安裝程式無法關閉 Markdown Vision。手動關閉它並再次運行安裝程式。 |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision 仍在執行。請關閉程式並選擇「重試」，或取消安裝。 |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | 正在刪除目前安裝的 Markdown Vision 版本… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | 無法移除現有的 Markdown Vision 安裝。安裝程式將停止，不會安裝 Markdown Vision Native。 |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | 您可以在 Windows 設定中選擇 Markdown Vision 作為 Markdown 檔案的預設應用程式。 |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | 安裝後開啟 Windows 預設應用程式設定 |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision 已安裝。 |
| `open_markdown_vision_when_setup_closes_8422c7` | 安裝程式關閉時開啟 Markdown Vision |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | 無法安裝 Markdown Vision Native。安裝程式將停止，不會註冊未完成的安裝。 |
| `markdown_document_00271f` | Markdown 文件 |
| `markdown_vision_preview_handler_8c95f7` | Markdown Vision 預覽處理程式 |
| `markdown_file_viewer_c36ee7` | Markdown 檔案檢視器 |
| `uninstall_fe1995` | 解除安裝 |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision無法啟動。 {error} |
| `unknown_native_method_method_cc7ca9` | 未知的本機方法：{method} |
| `text_71988c` | 文字 |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | {level} 級標題 |
| `normal_text_a2adc4` | 普通文字 |
| `footnotes_ad6fb5` | 註腳 |
| `size_px_8d05e6` | {size} 像素 |
| `link_text_insert_default` | 連結文字 |
| `back_to_footnote_reference` | 返回註腳引用處 |

## Locale cs

Czech

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Formátování Markdown |
| `undo_a8283a` | Vrátit zpět |
| `redo_742739` | Znovu |
| `bold_ctrl_b_84787d` | Tučné (Ctrl+B) |
| `bold_94fee6` | Tučné |
| `italic_ctrl_i_ccc60d` | Kurzíva (Ctrl+I) |
| `italic_9bf37c` | Kurzíva |
| `strikethrough_9aabbc` | Přeškrtnutí |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Střídat úrovně nadpisu (H1–H6, poté běžný text) |
| `cycle_heading_level_bde9c4` | Střídat úrovně nadpisu |
| `bulleted_list_ce51b3` | Seznam s odrážkami |
| `task_list_5d3253` | Seznam úkolů |
| `numbered_list_cc62f6` | Číslovaný seznam |
| `quote_eb4cde` | Citace |
| `inline_code_e767de` | Vložený kód |
| `code_block_754538` | Blok kódu |
| `link_a6a32d` | Odkaz |
| `insert_table_67318e` | Vložit tabulku |
| `edit_markdown_6ff388` | Upravit Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | Nový soubor Markdown (Ctrl+N) |
| `new_markdown_file_0928e9` | Nový soubor Markdown |
| `open_markdown_file_b7764a` | Otevřít soubor Markdown |
| `print_ctrl_p_5c4406` | Tisk (Ctrl+P) |
| `print_document_2a024b` | Tisk dokumentu |
| `search_text_38d268` | Hledat v textu |
| `settings_74a883` | Nastavení |
| `switch_to_dark_mode_fc43ea` | Přepnout do tmavého režimu |
| `about_markdown_vision_08f9a5` | O Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | Licence GNU GPLv3 |
| `version_version_a18745` | Verze {version} |
| `latest_version_checking_4bfedc` | Nejnovější verze: kontrola… |
| `update_c1c100` | Aktualizovat |
| `update_text_editor` | Aktualizovat text |
| `keep_unchanged_editor` | Ponechat beze změny |
| `check_for_updates_f26f32` | Zkontrolovat aktualizace |
| `restart_markdown_vision_7e50f8` | Restartovat Markdown Vision |
| `text_search_10155f` | Vyhledávání v textu |
| `count_match_ef9195` | {count} výsledek hledání |
| `count_matches_43682a` | {count} výsledky hledání |
| `previous_match_daa2f8` | Předchozí výsledek hledání |
| `next_match_825e5a` | Další výsledek hledání |
| `close_search_55656b` | Zavřít vyhledávání |
| `close_settings_0ccfef` | Zavřít nastavení |
| `variable_width_font_0836b2` | Proporcionální písmo |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Zadejte název písma nebo vyberte nainstalované písmo. |
| `fixed_width_font_3de094` | Písmo s pevnou šířkou |
| `used_for_code_and_other_monospaced_text_84b6ed` | Používá se pro kód a další text s pevnou šířkou znaků. |
| `text_size_d68761` | Velikost textu |
| `automatic_text_size_919785` | Automatická velikost textu |
| `automatic_d461a4` | Automaticky |
| `line_spacing_0db45d` | Řádkování |
| `page_width_limit_19528b` | Limit šířky stránky |
| `automatic_page_width_bd5c30` | Automatická šířka stránky |
| `markdown_editor_da0ea6` | Editor Markdown |
| `editor_view_1d1833` | Zobrazení editoru |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown vlevo, vizuální editor vpravo |
| `split_0b61a1` | Rozdělit ↔ |
| `visual_above_markdown_a04e0f` | Vizuální editor nad Markdownem |
| `split_b3b924` | Rozdělit ↕ |
| `visual_ba3033` | Vizuální |
| `save_ctrl_s_4be89e` | Uložit (Ctrl+S) |
| `save_1509f5` | Uložit |
| `save_as_ctrl_shift_s_0f132a` | Uložit jako (Ctrl+Shift+S) |
| `save_as_a4b76a` | Uložit jako… |
| `markdown_source_580118` | Zdroj Markdown |
| `markdown_pane_width_ab0129` | Šířka panelu Markdown |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% Vizuální |
| `visual_editor_5665dd` | Vizuální editor |
| `visual_editing_restriction_d42cea` | Omezení vizuální úpravy |
| `edit_in_markdown_165fd4` | Upravit v Markdown |
| `dismiss_48845b` | Zavřít oznámení |
| `count_word_1f505c` | Slovo {count} |
| `count_words_caab29` | Slova {count} |
| `approximate_word_count_7b987a` | Přibližný počet slov: {count} |
| `line_line_column_column_21e9f4` | Řádek {line}, sloupec {column} |
| `untitled_md_2dccf8` | Bez názvu.md |
| `save_your_changes_56dd16` | Uložit změny? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Před vytvořením nového souboru uložte aktuální dokument. |
| `cancel_19766e` | Zrušit |
| `discard_changes_f9bfa3` | Zahodit změny |
| `switch_to_light_mode_bfa0ca` | Přepnout na světlý režim |
| `enter_the_name_of_any_installed_font_b57a72` | Zadejte název libovolného nainstalovaného písma. |
| `loading_installed_fonts_200c74` | Načítání nainstalovaných písem… |
| `count_fixed_width_font_available_5488f8` | Dostupná neproporcionální písma: {count} |
| `count_fixed_width_fonts_available_5df530` | Dostupná neproporcionální písma: {count} |
| `count_variable_width_font_available_583582` | Dostupná proporcionální písma: {count} |
| `count_variable_width_fonts_available_9d234c` | Dostupná proporcionální písma: {count} |
| `count_match_for_query_2e77ac` | Výsledky hledání pro „{query}“: {count} |
| `count_matches_for_query_7db710` | Výsledky hledání pro „{query}“: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | Žádné neproporcionální písmo neodpovídá výrazu „{query}“. |
| `no_variable_width_fonts_match_query_a64030` | Žádné proporcionální písmo neodpovídá výrazu „{query}“. |
| `current_of_total_35d900` | {current} z {total} |
| `current_of_total_scope_94ebe5` | {current} z {total} · {scope} |
| `copy_code_49a005` | Kopírovat kód |
| `clipboard_unavailable_4ff69f` | Schránka není k dispozici |
| `code_copied_39868c` | Kód zkopírován |
| `could_not_copy_code_4a563f` | Kód se nepodařilo zkopírovat |
| `the_native_print_dialog_could_not_open_320714` | Systémové dialogové okno tisku se nepodařilo otevřít. |
| `could_not_open_the_print_dialog_4bd85a` | Nelze otevřít dialogové okno tisku. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Zahodit neuložené změny a otevřít jiný dokument? |
| `could_not_open_document_69abda` | Dokument nelze otevřít |
| `release_check_failed_7b2758` | Kontrola verze se nezdařila |
| `unrecognized_release_list_62d1cb` | Nerozpoznaný seznam verzí |
| `unrecognized_version_d1b8d2` | Nerozpoznaná verze |
| `latest_version_version_d1c996` | Nejnovější verze: {version} |
| `unsupported_architecture_087e4f` | Nepodporovaná architektura |
| `installer_verification_is_unavailable_98306d` | Ověření instalátoru není k dispozici |
| `unsupported_platform_a96892` | Nepodporovaná platforma |
| `latest_compatible_version_version_fa3079` | Poslední kompatibilní verze: {version} |
| `upgrade_markdown_vision_de1b45` | Aktualizovat Markdown Vision |
| `download_macos_update_95d8f3` | Stáhnout aktualizaci pro macOS |
| `download_linux_update_707c5e` | Stáhnout aktualizaci pro Linux |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Nelze zkontrolovat aktualizace. Zkontrolujte připojení k internetu a zkuste to znovu. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Probíhá stahování a ověřování aktualizace. Můžete být požádáni o ověření totožnosti. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Aktualizace nainstalována. Chcete-li používat novou verzi, restartujte. |
| `update_failed_error_e4f7dc` | Aktualizace se nezdařila: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Stáhnout a spustit instalační program Markdown Vision? Všechny otevřené dokumenty nejprve uložte. Instalační program může požádat o ukončení Markdown Vision. |
| `downloading_and_verifying_update_02b3ba` | Stahování a ověřování aktualizace… |
| `installer_started_865e10` | Instalační program byl spuštěn. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Nelze stáhnout, ověřit nebo spustit instalační program. Zkuste to prosím znovu. |
| `discard_unsaved_changes_and_restart_6d1602` | Zahodit neuložené změny a restartovat? |
| `could_not_restart_error_71e2d2` | Nelze restartovat: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Položku upravíte dvojitým kliknutím nebo stisknutím Alt+Enter |
| `saving_23e392` | Ukládání… |
| `unsaved_6250d5` | Neuloženo |
| `saved_b5c120` | Uloženo |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Koncept se nepodařilo uložit. Vaše změny zůstaly v editoru. |
| `embedded_content_1bca8f` | Vložený obsah |
| `edit_table_source_c7189f` | Upravit zdroj tabulky |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Vyberte buňku a upravte ji nebo změňte tabulku. Během psaní stiskněte Alt+Enter. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Tento blok obsahuje formátování, které je třeba upravit v Markdownu. |
| `code_contents_5a1f26` | Obsah kódu |
| `type_directly_to_edit_this_indented_code_block_769291` | Obsah tohoto odsazeného bloku kódu upravíte přímým psaním. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Obsah upravte psaním přímo do bloku kódu. Řádky označující jeho začátek a konec upravte v Markdownu. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Text změníte volbou „Upravit položku seznamu“. Vnoření upravte přímo v seznamu v Markdownu. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Seznam změníte volbou „Upravit položku seznamu“ nebo pomocí zaškrtávacích políček. |
| `edit_list_item_text_a982e6` | Upravit text položky seznamu |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Text položky upravte přímo. Strukturu seznamu upravte v Markdownu. |
| `task_4bc74b` | Úkol |
| `edit_item_9f84ee` | Upravit položku seznamu |
| `list_options_fc3320` | Možnosti seznamu |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Tuto tabulku je třeba upravit v Markdown. |
| `add_text_to_this_empty_cell_37f900` | Přidejte text do této prázdné buňky |
| `edit_this_cell_in_markdown_4304b1` | Upravte tuto buňku v Markdown |
| `edit_table_cell_a4212e` | Upravit buňku tabulky |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Vyberte buňku, kterou chcete upravit. Podkladovou tabulku můžete upravit v Markdownu. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Tato buňka obsahuje HTML. Upravte ji v Markdownu. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | Tato buňka používá odkazy Markdownu. Upravte ji v Markdownu. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Pište přímo do této buňky. Možnosti tabulky zobrazíte stisknutím Alt+Enter. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Do buněk obsahujících pouze prostý text pište přímo. U složitějšího obsahu použijte možnosti tabulky nebo upravte Markdown. |
| `table_options_cf924a` | Možnosti tabulky |
| `edit_note_299e60` | Upravit poznámku |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Pomocí Upravit poznámku můžete změnit podporovaný text poznámky pod čarou. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | Toto rozložení používá HTML. Upravte jej v Markdown. |
| `edit_inline_code_bf93ee` | Upravit vložený kód |
| `edit_list_structure_in_markdown_17a222` | Upravit strukturu seznamu v Markdownu |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Přímo upravte prostý text seznamu. Strukturu seznamu upravte v Markdownu. |
| `edit_code_in_table_cell_535cb9` | Upravte kód v buňce tabulky |
| `edit_table_cell_text_ca30e7` | Upravit text buňky tabulky |
| `edit_preformatted_text_9737bd` | Upravit předformátovaný text |
| `edit_disclosure_title_79fb92` | Upravit název rozbalovací části |
| `edit_text_7967d9` | Upravit text |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Zadejte text buňky. Stisknutím Alt+Enter zobrazíte možnosti buňky. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Upravte text přímo. Upravte okolní strukturu v Markdown. |
| `edit_structure_in_markdown_fe607e` | Upravte strukturu v Markdown |
| `edit_quoted_text_9de474` | Upravit citovaný text |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Prostý text upravte přímo. Strukturu blokové citace upravte v Markdownu. |
| `edit_heading_text_f3806c` | Upravit text nadpisu |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Přímo upravte text nadpisu. Upravte styl nadpisu v Markdown. |
| `heading_style_c0c25b` | Styl nadpisu |
| `edit_this_item_in_markdown_83b112` | Upravit tuto položku v Markdownu |
| `markdown_only_f6e1f7` | Pouze Markdown |
| `visual_only_29a136` | Pouze vizuální editor |
| `action_64cff1` | Akce |
| `apply_31e392` | Použít |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Markdown se změnil. Znovu otevřete tento editor a zkuste to znovu. |
| `edit_list_item_f69436` | Upravit položku seznamu |
| `item_text_markdown_0bbe7d` | Text položky (Markdown) |
| `new_item_b84cad` | Nová položka seznamu |
| `enter_item_text_or_choose_remove_item_e4003a` | Zadejte text položky nebo zvolte Odebrat položku. |
| `enter_item_text_82c7ea` | Zadejte text položky. |
| `add_item_below_a6d694` | Přidat položku níže |
| `remove_item_5a89ed` | Odebrat položku |
| `indent_under_previous_item_2e6b03` | Odsadit pod předchozí položku |
| `outdent_item_07e9b1` | Zmenšit odsazení položky |
| `this_item_has_no_parent_to_outdent_from_dd148a` | Tato položka nemá nadřazenou položku, takže nelze zmenšit její odsazení. |
| `heading_b34f17` | Nadpis |
| `edit_footnote_cdcee6` | Upravit poznámku pod čarou |
| `note_text_369e75` | Text poznámky pod čarou |
| `enter_the_note_text_on_one_line_3a7a5a` | Zadejte text poznámky na jeden řádek. |
| `cell_text_9cd173` | Text buňky |
| `add_row_below_3d4830` | Přidejte řádek níže |
| `add_column_after_38817e` | Přidat sloupec za |
| `new_column_editor` | Nový sloupec |
| `remove_row_1810fd` | Odebrat řádek |
| `remove_column_9807a2` | Odebrat sloupec |
| `align_column_left_6d9399` | Zarovnat sloupec doleva |
| `center_column_1b9b8b` | Zarovnat obsah sloupce na střed |
| `align_column_right_850a8f` | Zarovnat sloupec doprava |
| `cell_text_markdown_a9e5f9` | Text buňky (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Před přidáním konce řádku zavřete vložený kód. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Tento text buňky by změnil strukturu tabulky. Přidejte mezeru před oddělovač v Markdown. |
| `alt_text_16f898` | Alternativní text |
| `link_text_markdown_9b92bd` | Text odkazu (Markdown) |
| `image_url_e55026` | Adresa URL obrázku |
| `link_url_9dfd0b` | URL odkazu |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | Upravit propojený obrázek |
| `edit_image_d9d12b` | Upravit obrázek |
| `edit_link_94026c` | Upravit odkaz |
| `enter_text_without_a_closing_bracket_0e7315` | Zadejte text bez uzavírací závorky. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Zadejte adresu URL HTTP nebo HTTPS bez mezer nebo závorek. |
| `visual_pane_height_4ad683` | Výška panelu vizuálního editoru |
| `return_to_reader_dcd8f7` | Zpět do režimu čtení |
| `number_of_columns_2_8_893663` | Počet sloupců (2–8) |
| `header_number_b79482` | Záhlaví sloupce {number} |
| `cell_75fa38` | Buňka |
| `open_1f1d59` | Otevřít… |
| `new_18fdd5` | Nové |
| `print_07c371` | Tisk… |
| `close_7d9eb7` | Zavřít |
| `file_50009c` | Soubor |
| `about_markdown_vision_c6d62d` | O Markdown Vision… |
| `quit_markdown_vision_01c01b` | Ukončete Markdown Vision |
| `quit_b3eb37` | Ukončit |
| `help_b79cac` | Nápověda |
| `could_not_enumerate_system_fonts_00e652` | Nelze načíst seznam systémových písem |
| `no_system_fonts_found_a8a9af` | Nebyla nalezena žádná systémová písma |
| `could_not_open_document_640c27` | Dokument nelze otevřít |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | Dokument nelze otevřít. Vaše aktuální změny jsou stále k dispozici. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Zahodit neuložené změny a zavřít Markdown Vision? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Zahodit neuložené změny a ukončit Markdown Vision? |
| `unknown_confirmation_request_feea29` | Neznámý požadavek na potvrzení |
| `keep_editing_624a83` | Pokračovat v úpravách |
| `discard_eb1a70` | Zahodit |
| `unsaved_changes_a710c2` | Neuložené změny |
| `the_document_is_no_longer_open_use_save_as_671c50` | Dokument již není otevřen. Použijte Uložit jako. |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Tento soubor má smíšené konce řádků nebo neplatné kódování UTF-8. Použijte „Uložit jako“. |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | Ukládání prostřednictvím symbolického odkazu není podporováno. Použijte Uložit jako. |
| `invalid_destination_14f03f` | Neplatný cíl |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | Cílový soubor na disku se změnil. Chcete-li zachovat své úpravy, použijte „Uložit jako“. |
| `the_update_process_failed_010689` | Proces aktualizace se nezdařil. |
| `could_not_restore_the_open_document_69d724` | Otevřený dokument nelze obnovit. |
| `could_not_restart_markdown_vision_6ead36` | Nelze restartovat Markdown Vision. |
| `restart_is_not_available_on_this_platform_998ef6` | Restart není na této platformě k dispozici. |
| `the_update_information_is_invalid_dbcffc` | Informace o aktualizaci jsou neplatné. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Automatické aktualizace vyžadují nainstalovaný balíček DEB nebo RPM. |
| `this_architecture_is_not_supported_ae063c` | Tato architektura není podporována. |
| `could_not_identify_the_linux_distribution_18bbdb` | Nelze identifikovat distribuci Linux. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | Správce balíčků RPM není k dispozici. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision není nainstalován jako kompatibilní balíček RPM. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Tato aktualizace není novější než nainstalovaný balíček. |
| `the_debian_package_manager_is_unavailable_b5d66b` | Správce balíčků Debian je nedostupný. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision není nainstalován jako balíček DEB. |
| `could_not_determine_the_installed_version_f1a1f1` | Nelze určit nainstalovanou verzi. |
| `could_not_compare_package_versions_465d4e` | Verze balíčků nelze porovnat. |
| `could_not_create_a_temporary_download_folder_36407c` | Nelze vytvořit dočasnou složku pro stahování. |
| `could_not_start_the_download_b4acf0` | Stahování nelze spustit. |
| `the_update_could_not_be_downloaded_4d6fd7` | Aktualizaci nelze stáhnout. |
| `could_not_verify_the_update_2cd2c5` | Aktualizaci nelze ověřit. |
| `the_downloaded_update_failed_verification_60519b` | Ověření stažené aktualizace se nezdařilo. |
| `could_not_inspect_the_update_package_9812b2` | Aktualizační balíček nelze zkontrolovat. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | Stažený balíček obsahuje neočekávaná metadata. |
| `version_dd1679` | Verze |
| `could_not_start_the_system_installer_907ba2` | Nelze spustit instalační program systému. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | Instalace byla zrušena nebo selhala. Zkuste to prosím znovu. |
| `could_not_verify_the_installed_update_04a200` | Nelze ověřit nainstalovanou aktualizaci. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | Instalační program neaktualizoval Markdown Vision na očekávanou verzi. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Automatické aktualizace DEB jsou dostupné pouze u Linux. |
| `invalid_preferences_bc6b57` | Neplatné předvolby |
| `invalid_key_b06fe9` | Neplatné {key} |
| `unsupported_preferences_version_54734c` | Nepodporovaná verze předvoleb |
| `missing_preferences_679970` | Chybí předvolby |
| `invalid_preferences_directory_a6f362` | Neplatný adresář předvoleb |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision nemohl přečíst tento soubor. |
| `markdown_files_177420` | Soubory Markdown |
| `text_files_c5df15` | Textové soubory |
| `all_files_866956` | Všechny soubory |
| `save_markdown_file_813f90` | Uložte soubor Markdown |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Tento dokument již není otevřen. Znovu otevřete soubor nebo použijte Uložit jako. |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Pomocí „Uložit jako“ vytvořte kopii tohoto souboru v kódování UTF-8. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | Tento soubor používá různé typy konců řádků. Pomocí „Uložit jako“ vytvořte kopii s jednotnými konci řádků. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows nemohl otevřít dialogové okno Uložit jako. |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | Návrh nelze zakódovat jako UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows nemohl přečíst vybraný cíl. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | Soubor se na disku změnil nebo je nedostupný. Chcete-li uložit své úpravy v samostatné kopii, použijte Uložit jako. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows nemohl uložit soubor. Zkontrolujte, zda je soubor zapisovatelný, nebo použijte Uložit jako. |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows nemohl během ukládání obnovit původní soubor. Původní soubor najdete zde: {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | Požadavek na uložení nebylo možné dokončit. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision nemohl připravit své aplikační soubory ve vaší místní datové složce aplikace. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Je vyžadován běhový modul Microsoft Edge WebView2. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Instalace Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | Licencováno pod GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | Tento instalační program vyžaduje Windows na ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision běží. Než budete pokračovat, uložte všechny neuložené dokumenty. Zavřít Markdown Vision a pokračovat v instalaci? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | Instalačnímu programu se nepodařilo zavřít Markdown Vision. Zavřete jej ručně a znovu spusťte instalaci. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision stále běží. Zavřete jej a vyberte Opakovat nebo zrušte instalaci. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Odebírání aktuálně nainstalované edice Markdown Vision… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | Stávající instalaci Markdown Vision se nepodařilo odebrat. Instalace se ukončí bez instalace Markdown Vision Native. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | Ve Windows můžete v Nastavení zvolit Markdown Vision jako výchozí aplikaci pro soubory Markdown. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Po instalaci otevřít nastavení výchozích aplikací Windows |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision byl nainstalován. |
| `open_markdown_vision_when_setup_closes_8422c7` | Po ukončení instalátoru otevřít Markdown Vision |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native nelze nainstalovat. Instalace se zastaví bez registrace nedokončené instalace. |
| `markdown_document_00271f` | Dokument Markdown |
| `markdown_vision_preview_handler_8c95f7` | Popisovač náhledu Markdown Vision |
| `markdown_file_viewer_c36ee7` | Prohlížeč souborů Markdown |
| `uninstall_fe1995` | Odinstalovat |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision nelze spustit. {error} |
| `unknown_native_method_method_cc7ca9` | Neznámá nativní metoda: {method} |
| `text_71988c` | Text |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | Nadpis {level} |
| `normal_text_a2adc4` | Normální text |
| `footnotes_ad6fb5` | Poznámky pod čarou |
| `size_px_8d05e6` | {size} px |
| `link_text_insert_default` | text odkazu |
| `back_to_footnote_reference` | Zpět na odkaz na poznámku |

## Locale nl

Dutch

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Markdown-opmaak |
| `undo_a8283a` | Ongedaan maken |
| `redo_742739` | Opnieuw uitvoeren |
| `bold_ctrl_b_84787d` | Vet (Ctrl+B) |
| `bold_94fee6` | Vet |
| `italic_ctrl_i_ccc60d` | Cursief (Ctrl+I) |
| `italic_9bf37c` | Cursief |
| `strikethrough_9aabbc` | Doorhalen |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Kopniveau doorlopen (H1–H6, daarna gewone tekst) |
| `cycle_heading_level_bde9c4` | Kopniveau doorlopen |
| `bulleted_list_ce51b3` | Lijst met opsommingstekens |
| `task_list_5d3253` | Takenlijst |
| `numbered_list_cc62f6` | Genummerde lijst |
| `quote_eb4cde` | Citaat |
| `inline_code_e767de` | Inline-code |
| `code_block_754538` | Codeblok |
| `link_a6a32d` | Koppeling |
| `insert_table_67318e` | Tabel invoegen |
| `edit_markdown_6ff388` | Bewerk Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | Nieuw Markdown-bestand (Ctrl+N) |
| `new_markdown_file_0928e9` | Nieuw Markdown-bestand |
| `open_markdown_file_b7764a` | Open het Markdown-bestand |
| `print_ctrl_p_5c4406` | Afdrukken (Ctrl+P) |
| `print_document_2a024b` | Document afdrukken |
| `search_text_38d268` | Zoeken in tekst |
| `settings_74a883` | Instellingen |
| `switch_to_dark_mode_fc43ea` | Schakel over naar de donkere modus |
| `about_markdown_vision_08f9a5` | Over Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | GNU GPLv3-licentie |
| `version_version_a18745` | Versie {version} |
| `latest_version_checking_4bfedc` | Nieuwste versie: controleren… |
| `update_c1c100` | Bijwerken |
| `update_text_editor` | Tekst bijwerken |
| `keep_unchanged_editor` | Ongewijzigd laten |
| `check_for_updates_f26f32` | Controleer op updates |
| `restart_markdown_vision_7e50f8` | Start Markdown Vision opnieuw |
| `text_search_10155f` | Zoeken in tekst |
| `count_match_ef9195` | {count} zoekresultaat |
| `count_matches_43682a` | {count} zoekresultaten |
| `previous_match_daa2f8` | Vorig zoekresultaat |
| `next_match_825e5a` | Volgend zoekresultaat |
| `close_search_55656b` | Zoekopdracht sluiten |
| `close_settings_0ccfef` | Instellingen sluiten |
| `variable_width_font_0836b2` | Lettertype met variabele breedte |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Typ een lettertypenaam of kies een geïnstalleerd lettertype. |
| `fixed_width_font_3de094` | Lettertype met vaste breedte |
| `used_for_code_and_other_monospaced_text_84b6ed` | Gebruikt voor code en andere tekst met vaste tekenbreedte. |
| `text_size_d68761` | Tekstgrootte |
| `automatic_text_size_919785` | Automatische tekstgrootte |
| `automatic_d461a4` | Automatisch |
| `line_spacing_0db45d` | Regelafstand |
| `page_width_limit_19528b` | Limiet voor paginabreedte |
| `automatic_page_width_bd5c30` | Automatische paginabreedte |
| `markdown_editor_da0ea6` | Markdown-editor |
| `editor_view_1d1833` | Editorweergave |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown links, visuele editor rechts |
| `split_0b61a1` | Splitsen ↔ |
| `visual_above_markdown_a04e0f` | Visuele editor boven Markdown |
| `split_b3b924` | Splitsen ↕ |
| `visual_ba3033` | Visueel |
| `save_ctrl_s_4be89e` | Opslaan (Ctrl+S) |
| `save_1509f5` | Opslaan |
| `save_as_ctrl_shift_s_0f132a` | Opslaan als (Ctrl+Shift+S) |
| `save_as_a4b76a` | Opslaan als… |
| `markdown_source_580118` | Markdown-bron |
| `markdown_pane_width_ab0129` | Breedte van het Markdown-paneel |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% Visueel |
| `visual_editor_5665dd` | Visuele editor |
| `visual_editing_restriction_d42cea` | Beperking voor visuele bewerking |
| `edit_in_markdown_165fd4` | Bewerken in Markdown |
| `dismiss_48845b` | Melding sluiten |
| `count_word_1f505c` | {count}-woord |
| `count_words_caab29` | {count}-woorden |
| `approximate_word_count_7b987a` | Geschat aantal woorden: {count} |
| `line_line_column_column_21e9f4` | Regel {line}, kolom {column} |
| `untitled_md_2dccf8` | Naamloos.md |
| `save_your_changes_56dd16` | Uw wijzigingen opslaan? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Sla uw huidige document op voordat u een nieuw bestand maakt. |
| `cancel_19766e` | Annuleer |
| `discard_changes_f9bfa3` | Wijzigingen verwerpen |
| `switch_to_light_mode_bfa0ca` | Overschakelen naar lichte modus |
| `enter_the_name_of_any_installed_font_b57a72` | Voer de naam van een geïnstalleerd lettertype in. |
| `loading_installed_fonts_200c74` | Geïnstalleerde lettertypen laden… |
| `count_fixed_width_font_available_5488f8` | Beschikbare lettertypen met vaste breedte: {count} |
| `count_fixed_width_fonts_available_5df530` | Beschikbare lettertypen met vaste breedte: {count} |
| `count_variable_width_font_available_583582` | Beschikbaar lettertype met variabele breedte: {count} |
| `count_variable_width_fonts_available_9d234c` | Beschikbare lettertypen met variabele breedte: {count} |
| `count_match_for_query_2e77ac` | Zoekresultaten voor ‘{query}’: {count} |
| `count_matches_for_query_7db710` | Zoekresultaten voor ‘{query}’: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | Er zijn geen lettertypen met een vaste breedte die overeenkomen met '{query}'. |
| `no_variable_width_fonts_match_query_a64030` | Er zijn geen lettertypen met variabele breedte die overeenkomen met '{query}'. |
| `current_of_total_35d900` | {current} van {total} |
| `current_of_total_scope_94ebe5` | {current} van {total} · {scope} |
| `copy_code_49a005` | Kopieer code |
| `clipboard_unavailable_4ff69f` | Klembord niet beschikbaar |
| `code_copied_39868c` | Code gekopieerd |
| `could_not_copy_code_4a563f` | Kon de code niet kopiëren |
| `the_native_print_dialog_could_not_open_320714` | Het systeemdialoogvenster voor afdrukken kon niet worden geopend. |
| `could_not_open_the_print_dialog_4bd85a` | Kon het afdrukdialoogvenster niet openen. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Uw niet-opgeslagen wijzigingen verwerpen en een ander document openen? |
| `could_not_open_document_69abda` | Kon het document niet openen |
| `release_check_failed_7b2758` | Versiecontrole mislukt |
| `unrecognized_release_list_62d1cb` | Niet-herkende versielijst |
| `unrecognized_version_d1b8d2` | Niet-herkende versie |
| `latest_version_version_d1c996` | Nieuwste versie: {version} |
| `unsupported_architecture_087e4f` | Niet-ondersteunde architectuur |
| `installer_verification_is_unavailable_98306d` | Verificatie van het installatiebestand is niet beschikbaar |
| `unsupported_platform_a96892` | Niet-ondersteund platform |
| `latest_compatible_version_version_fa3079` | Nieuwste compatibele versie: {version} |
| `upgrade_markdown_vision_de1b45` | Markdown Vision bijwerken |
| `download_macos_update_95d8f3` | macOS-update downloaden |
| `download_linux_update_707c5e` | Linux-update downloaden |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Kan niet controleren op updates. Controleer uw internetverbinding en probeer het opnieuw. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | De update wordt gedownload en gecontroleerd. Mogelijk wordt u gevraagd uw identiteit te bevestigen. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Update geïnstalleerd. Start opnieuw op om de nieuwe versie te gebruiken. |
| `update_failed_error_e4f7dc` | Update mislukt: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Download en voer het Markdown Vision-installatieprogramma uit? Sla eventuele geopende documenten eerst op. Het installatieprogramma vraagt mogelijk om Markdown Vision te sluiten. |
| `downloading_and_verifying_update_02b3ba` | Update downloaden en verifiëren… |
| `installer_started_865e10` | Het installatieprogramma is gestart. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Kan het installatieprogramma niet downloaden, verifiëren of starten. Probeer het opnieuw. |
| `discard_unsaved_changes_and_restart_6d1602` | Niet-opgeslagen wijzigingen verwerpen en opnieuw opstarten? |
| `could_not_restart_error_71e2d2` | Kan niet opnieuw opstarten: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Dubbelklik of druk op Alt+Enter om dit item te bewerken |
| `saving_23e392` | Opslaan… |
| `unsaved_6250d5` | Niet opgeslagen |
| `saved_b5c120` | Opgeslagen |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Het concept kon niet worden opgeslagen. Uw wijzigingen staan nog in de editor. |
| `embedded_content_1bca8f` | Ingesloten inhoud |
| `edit_table_source_c7189f` | Tabelbron bewerken |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Selecteer een cel om deze te bewerken of de tabel te wijzigen. Druk tijdens het typen op Alt+Enter. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Dit blok bevat opmaak die moet worden bewerkt in Markdown. |
| `code_contents_5a1f26` | Code-inhoud |
| `type_directly_to_edit_this_indented_code_block_769291` | Typ rechtstreeks in dit ingesprongen codeblok om het te bewerken. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Typ rechtstreeks in het codeblok om de inhoud te bewerken. Bewerk de regels die het begin en einde markeren in Markdown. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Gebruik ‘Lijstitem bewerken’ om de tekst te wijzigen. Bewerk de lijst in Markdown om de inspringniveaus te wijzigen. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Gebruik ‘Lijstitem bewerken’ of de selectievakjes om de lijst te wijzigen. |
| `edit_list_item_text_a982e6` | Tekst van lijstitem bewerken |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Bewerk de itemtekst rechtstreeks. Bewerk de lijststructuur in Markdown. |
| `task_4bc74b` | Taak |
| `edit_item_9f84ee` | Lijstitem bewerken |
| `list_options_fc3320` | Lijstopties |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Deze tabel moet worden bewerkt in Markdown. |
| `add_text_to_this_empty_cell_37f900` | Voeg tekst toe aan deze lege cel |
| `edit_this_cell_in_markdown_4304b1` | Bewerk deze cel in Markdown |
| `edit_table_cell_a4212e` | Tabelcel bewerken |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Selecteer een cel om deze te bewerken. U kunt de onderliggende tabel bewerken in Markdown. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Deze cel bevat HTML. Bewerk deze cel in Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | Deze cel gebruikt Markdown-referenties. Bewerk deze cel in Markdown. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Typ om deze cel te bewerken. Druk op Alt+Enter voor tabelopties. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Typ rechtstreeks in cellen met alleen platte tekst. Gebruik tabelopties of bewerk de Markdown voor complexere inhoud. |
| `table_options_cf924a` | Tabelopties |
| `edit_note_299e60` | Voetnoot bewerken |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Gebruik ‘Voetnoot bewerken’ om de bewerkbare tekst van de voetnoot te wijzigen. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | Deze lay-out maakt gebruik van HTML. Bewerk het in Markdown. |
| `edit_inline_code_bf93ee` | Inlinecode bewerken |
| `edit_list_structure_in_markdown_17a222` | Bewerk de lijststructuur in Markdown |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Bewerk de gewone lijsttekst rechtstreeks. Bewerk de lijststructuur in Markdown. |
| `edit_code_in_table_cell_535cb9` | Bewerk code in tabelcel |
| `edit_table_cell_text_ca30e7` | Tabelceltekst bewerken |
| `edit_preformatted_text_9737bd` | Bewerk vooraf opgemaakte tekst |
| `edit_disclosure_title_79fb92` | Titel van uitklapbare sectie bewerken |
| `edit_text_7967d9` | Tekst bewerken |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Typ de celtekst. Druk op Alt+Enter voor celopties. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Bewerk de tekst direct. Bewerk de omringende structuur in Markdown. |
| `edit_structure_in_markdown_fe607e` | Structuur bewerken in Markdown |
| `edit_quoted_text_9de474` | Bewerk de geciteerde tekst |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Bewerk de platte tekst rechtstreeks. Bewerk de structuur van het citaatblok in Markdown. |
| `edit_heading_text_f3806c` | Koptekst bewerken |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Bewerk de koptekst rechtstreeks. Bewerk de kopstijl in Markdown. |
| `heading_style_c0c25b` | Kopstijl |
| `edit_this_item_in_markdown_83b112` | Bewerk dit item in Markdown |
| `markdown_only_f6e1f7` | Alleen Markdown |
| `visual_only_29a136` | Alleen visuele editor |
| `action_64cff1` | Actie |
| `apply_31e392` | Toepassen |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | De Markdown is gewijzigd. Open deze editor opnieuw om het nogmaals te proberen. |
| `edit_list_item_f69436` | Lijstitem bewerken |
| `item_text_markdown_0bbe7d` | Tekst van het lijstitem (Markdown) |
| `new_item_b84cad` | Nieuw lijstitem |
| `enter_item_text_or_choose_remove_item_e4003a` | Voer de tekst van het lijstitem in of kies ‘Lijstitem verwijderen’. |
| `enter_item_text_82c7ea` | Voer de tekst van het lijstitem in. |
| `add_item_below_a6d694` | Voeg hieronder een item toe |
| `remove_item_5a89ed` | Lijstitem verwijderen |
| `indent_under_previous_item_2e6b03` | Inspringen onder vorig item |
| `outdent_item_07e9b1` | Lijstitem minder inspringen |
| `this_item_has_no_parent_to_outdent_from_dd148a` | Dit lijstitem heeft geen bovenliggend item en kan niet minder worden ingesprongen. |
| `heading_b34f17` | Kop |
| `edit_footnote_cdcee6` | Voetnoot bewerken |
| `note_text_369e75` | Voetnoottekst |
| `enter_the_note_text_on_one_line_3a7a5a` | Voer de voetnoottekst op één regel in. |
| `cell_text_9cd173` | Celtekst |
| `add_row_below_3d4830` | Voeg hieronder een rij toe |
| `add_column_after_38817e` | Kolom erna toevoegen |
| `new_column_editor` | Nieuwe kolom |
| `remove_row_1810fd` | Rij verwijderen |
| `remove_column_9807a2` | Kolom verwijderen |
| `align_column_left_6d9399` | Kolom links uitlijnen |
| `center_column_1b9b8b` | Kolominhoud centreren |
| `align_column_right_850a8f` | Kolom rechts uitlijnen |
| `cell_text_markdown_a9e5f9` | Celtekst (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Sluit de inlinecode voordat u een regeleinde toevoegt. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Deze celtekst zou de tabelstructuur veranderen. Voeg een spatie toe vóór het scheidingsteken in Markdown. |
| `alt_text_16f898` | Alt-tekst |
| `link_text_markdown_9b92bd` | Linktekst (Markdown) |
| `image_url_e55026` | Afbeeldings-URL |
| `link_url_9dfd0b` | Link-URL |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | Gekoppelde afbeelding bewerken |
| `edit_image_d9d12b` | Afbeelding bewerken |
| `edit_link_94026c` | Link bewerken |
| `enter_text_without_a_closing_bracket_0e7315` | Voer tekst in zonder haakje sluiten. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Voer een HTTP- of HTTPS-URL in zonder spaties of haakjes. |
| `visual_pane_height_4ad683` | Hoogte van het visuele paneel |
| `return_to_reader_dcd8f7` | Terug naar leesweergave |
| `number_of_columns_2_8_893663` | Aantal kolommen (2–8) |
| `header_number_b79482` | Kolomkop {number} |
| `cell_75fa38` | Cel |
| `open_1f1d59` | Openen… |
| `new_18fdd5` | Nieuw |
| `print_07c371` | Afdrukken… |
| `close_7d9eb7` | Sluiten |
| `file_50009c` | Bestand |
| `about_markdown_vision_c6d62d` | Over Markdown Vision… |
| `quit_markdown_vision_01c01b` | Sluit Markdown Vision af |
| `quit_b3eb37` | Afsluiten |
| `help_b79cac` | Help |
| `could_not_enumerate_system_fonts_00e652` | Kan de lijst met systeemlettertypen niet ophalen |
| `no_system_fonts_found_a8a9af` | Geen systeemlettertypen gevonden |
| `could_not_open_document_640c27` | Kan document niet openen |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | Het document kon niet worden geopend. Uw huidige wijzigingen zijn nog steeds beschikbaar. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Uw niet-opgeslagen wijzigingen verwerpen en Markdown Vision sluiten? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Uw niet-opgeslagen wijzigingen verwerpen en Markdown Vision afsluiten? |
| `unknown_confirmation_request_feea29` | Onbekend bevestigingsverzoek |
| `keep_editing_624a83` | Blijf bewerken |
| `discard_eb1a70` | Verwerpen |
| `unsaved_changes_a710c2` | Niet-opgeslagen wijzigingen |
| `the_document_is_no_longer_open_use_save_as_671c50` | Het document is niet langer geopend. Gebruik Opslaan als. |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Dit bestand heeft verschillende regeleinden of ongeldige UTF-8-codering. Gebruik ‘Opslaan als’. |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | Opslaan via een symbolische link wordt niet ondersteund. Gebruik Opslaan als. |
| `invalid_destination_14f03f` | Ongeldige bestemming |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | Het doelbestand op schijf is gewijzigd. Gebruik ‘Opslaan als’ om uw wijzigingen te bewaren. |
| `the_update_process_failed_010689` | Het updateproces is mislukt. |
| `could_not_restore_the_open_document_69d724` | Kan het geopende document niet herstellen. |
| `could_not_restart_markdown_vision_6ead36` | Kan Markdown Vision niet opnieuw opstarten. |
| `restart_is_not_available_on_this_platform_998ef6` | Opnieuw opstarten is niet beschikbaar op dit platform. |
| `the_update_information_is_invalid_dbcffc` | De update-informatie is ongeldig. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Voor automatische updates is een geïnstalleerd DEB- of RPM-pakket vereist. |
| `this_architecture_is_not_supported_ae063c` | Deze architectuur wordt niet ondersteund. |
| `could_not_identify_the_linux_distribution_18bbdb` | Kan de Linux-distributie niet identificeren. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | De RPM-pakketbeheerder is niet beschikbaar. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision is niet geïnstalleerd als een compatibel RPM-pakket. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Deze update is niet nieuwer dan het geïnstalleerde pakket. |
| `the_debian_package_manager_is_unavailable_b5d66b` | De pakketbeheerder van Debian is niet beschikbaar. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision is niet geïnstalleerd als DEB-pakket. |
| `could_not_determine_the_installed_version_f1a1f1` | Kan de geïnstalleerde versie niet bepalen. |
| `could_not_compare_package_versions_465d4e` | Kan pakketversies niet vergelijken. |
| `could_not_create_a_temporary_download_folder_36407c` | Kan geen tijdelijke downloadmap maken. |
| `could_not_start_the_download_b4acf0` | Kan het downloaden niet starten. |
| `the_update_could_not_be_downloaded_4d6fd7` | De update kon niet worden gedownload. |
| `could_not_verify_the_update_2cd2c5` | Kan de update niet verifiëren. |
| `the_downloaded_update_failed_verification_60519b` | De verificatie van de gedownloade update is mislukt. |
| `could_not_inspect_the_update_package_9812b2` | Kan het updatepakket niet inspecteren. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | Het gedownloade pakket bevat onverwachte metagegevens. |
| `version_dd1679` | Versie |
| `could_not_start_the_system_installer_907ba2` | Kan het systeeminstallatieprogramma niet starten. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | De installatie is geannuleerd of mislukt. Probeer het opnieuw. |
| `could_not_verify_the_installed_update_04a200` | Kan de geïnstalleerde update niet verifiëren. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | Het installatieprogramma heeft Markdown Vision niet bijgewerkt naar de verwachte versie. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Automatische DEB-updates zijn alleen beschikbaar op Linux. |
| `invalid_preferences_bc6b57` | Ongeldige voorkeuren |
| `invalid_key_b06fe9` | Ongeldige {key} |
| `unsupported_preferences_version_54734c` | Niet-ondersteunde voorkeursversie |
| `missing_preferences_679970` | Er ontbreken voorkeuren |
| `invalid_preferences_directory_a6f362` | Ongeldige voorkeurenmap |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision kan dit bestand niet lezen. |
| `markdown_files_177420` | Markdown-bestanden |
| `text_files_c5df15` | Tekstbestanden |
| `all_files_866956` | Alle bestanden |
| `save_markdown_file_813f90` | Markdown-bestand opslaan |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Dit document is niet langer geopend. Open het bestand opnieuw of gebruik Opslaan als. |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Gebruik Opslaan als om een UTF-8-kopie van dit bestand te maken. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | Dit bestand gebruikt gemengde regeleinden. Gebruik Opslaan als om een kopie met consistente regeleinden te maken. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows kan het dialoogvenster Opslaan als niet openen. |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | Het concept kan niet worden gecodeerd als UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows kan de geselecteerde bestemming niet lezen. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | Het bestand is gewijzigd op schijf of is niet beschikbaar. Gebruik Opslaan als om uw bewerkingen in een aparte kopie te bewaren. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows kan het bestand niet opslaan. Controleer of het bestand beschrijfbaar is, of gebruik Opslaan als. |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows kon het originele bestand niet herstellen tijdens het opslaan. Het origineel staat op {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | Het opslagverzoek kon niet worden voltooid. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision kan de applicatiebestanden in uw lokale app-gegevensmap niet voorbereiden. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Microsoft Edge WebView2 Runtime is vereist. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Installatie van Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | Gelicentieerd onder GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | Dit installatieprogramma vereist Windows op ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision is actief. Sla alle niet-opgeslagen documenten op voordat u doorgaat. Markdown Vision sluiten en doorgaan met de installatie? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | Het installatieprogramma kan Markdown Vision niet sluiten. Sluit het handmatig en start het installatieprogramma opnieuw. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision is nog steeds actief. Sluit het en selecteer Opnieuw proberen of annuleer de installatie. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | De momenteel geïnstalleerde Markdown Vision-editie verwijderen… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | De bestaande installatie van Markdown Vision kon niet worden verwijderd. Het installatieprogramma stopt zonder Markdown Vision Native te installeren. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | U kunt Markdown Vision in Windows-instellingen kiezen als standaardapp voor Markdown-bestanden. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Na installatie de instellingen voor standaardapps van Windows openen |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision is geïnstalleerd. |
| `open_markdown_vision_when_setup_closes_8422c7` | Markdown Vision openen wanneer het installatieprogramma wordt gesloten |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native kan niet worden geïnstalleerd. De installatie stopt zonder dat er een onvolledige installatie wordt geregistreerd. |
| `markdown_document_00271f` | Markdown-document |
| `markdown_vision_preview_handler_8c95f7` | Markdown Vision Preview-handler |
| `markdown_file_viewer_c36ee7` | Markdown-bestandsviewer |
| `uninstall_fe1995` | Verwijderen |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision kon niet starten. {error} |
| `unknown_native_method_method_cc7ca9` | Onbekende native methode: {method} |
| `text_71988c` | Tekst |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | Kop {level} |
| `normal_text_a2adc4` | Normale tekst |
| `footnotes_ad6fb5` | Voetnoten |
| `size_px_8d05e6` | {size} px |
| `link_text_insert_default` | linktekst |
| `back_to_footnote_reference` | Terug naar de voetnootverwijzing |

## Locale fr

French

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Formatage Markdown |
| `undo_a8283a` | Annuler |
| `redo_742739` | Refaire |
| `bold_ctrl_b_84787d` | Gras (Ctrl+B) |
| `bold_94fee6` | Gras |
| `italic_ctrl_i_ccc60d` | Italique (Ctrl+I) |
| `italic_9bf37c` | Italique |
| `strikethrough_9aabbc` | Barré |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Parcourir les niveaux de titre (H1–H6, puis texte normal) |
| `cycle_heading_level_bde9c4` | Parcourir les niveaux de titre |
| `bulleted_list_ce51b3` | Liste à puces |
| `task_list_5d3253` | Liste des tâches |
| `numbered_list_cc62f6` | Liste numérotée |
| `quote_eb4cde` | Citation |
| `inline_code_e767de` | Code en ligne |
| `code_block_754538` | Bloc de code |
| `link_a6a32d` | Lien |
| `insert_table_67318e` | Insérer un tableau |
| `edit_markdown_6ff388` | Modifier Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | Nouveau fichier Markdown (Ctrl+N) |
| `new_markdown_file_0928e9` | Nouveau fichier Markdown |
| `open_markdown_file_b7764a` | Ouvrir le fichier Markdown |
| `print_ctrl_p_5c4406` | Imprimer (Ctrl+P) |
| `print_document_2a024b` | Imprimer le document |
| `search_text_38d268` | Rechercher dans le texte |
| `settings_74a883` | Paramètres |
| `switch_to_dark_mode_fc43ea` | Passer en mode sombre |
| `about_markdown_vision_08f9a5` | À propos de Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | Licence GNU GPLv3 |
| `version_version_a18745` | Version {version} |
| `latest_version_checking_4bfedc` | Dernière version : vérification… |
| `update_c1c100` | Mettre à jour |
| `update_text_editor` | Mettre à jour le texte |
| `keep_unchanged_editor` | Ne rien modifier |
| `check_for_updates_f26f32` | Vérifier les mises à jour |
| `restart_markdown_vision_7e50f8` | Redémarrer Markdown Vision |
| `text_search_10155f` | Recherche dans le texte |
| `count_match_ef9195` | {count} résultat de recherche |
| `count_matches_43682a` | {count} résultats de recherche |
| `previous_match_daa2f8` | Résultat précédent |
| `next_match_825e5a` | Résultat suivant |
| `close_search_55656b` | Fermer la recherche |
| `close_settings_0ccfef` | Fermer les paramètres |
| `variable_width_font_0836b2` | Police proportionnelle |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Tapez un nom de police ou choisissez une police installée. |
| `fixed_width_font_3de094` | Police à chasse fixe |
| `used_for_code_and_other_monospaced_text_84b6ed` | Utilisée pour le code et tout autre texte à espacement fixe. |
| `text_size_d68761` | Taille du texte |
| `automatic_text_size_919785` | Taille du texte automatique |
| `automatic_d461a4` | Automatique |
| `line_spacing_0db45d` | Espacement des lignes |
| `page_width_limit_19528b` | Limite de largeur de page |
| `automatic_page_width_bd5c30` | Largeur de page automatique |
| `markdown_editor_da0ea6` | Éditeur Markdown |
| `editor_view_1d1833` | Vue d’édition |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown à gauche, éditeur visuel à droite |
| `split_0b61a1` | Scinder ↔ |
| `visual_above_markdown_a04e0f` | Éditeur visuel au-dessus de Markdown |
| `split_b3b924` | Scinder ↕ |
| `visual_ba3033` | Visuel |
| `save_ctrl_s_4be89e` | Enregistrer (Ctrl+S) |
| `save_1509f5` | Enregistrer |
| `save_as_ctrl_shift_s_0f132a` | Enregistrer sous (Ctrl+Shift+S) |
| `save_as_a4b76a` | Enregistrer sous… |
| `markdown_source_580118` | Source Markdown |
| `markdown_pane_width_ab0129` | Largeur du volet Markdown |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% Visuel |
| `visual_editor_5665dd` | Éditeur visuel |
| `visual_editing_restriction_d42cea` | Restriction d’édition visuelle |
| `edit_in_markdown_165fd4` | Modifier dans Markdown |
| `dismiss_48845b` | Fermer la notification |
| `count_word_1f505c` | {count} mot |
| `count_words_caab29` | {count} mots |
| `approximate_word_count_7b987a` | Nombre approximatif de mots : {count} |
| `line_line_column_column_21e9f4` | Ligne {line}, colonne {column} |
| `untitled_md_2dccf8` | Sans titre.md |
| `save_your_changes_56dd16` | Enregistrer vos modifications ? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Enregistrez votre document actuel avant de créer un nouveau fichier. |
| `cancel_19766e` | Annuler |
| `discard_changes_f9bfa3` | Abandonner les modifications |
| `switch_to_light_mode_bfa0ca` | Passer au mode clair |
| `enter_the_name_of_any_installed_font_b57a72` | Entrez le nom de n’importe quelle police installée. |
| `loading_installed_fonts_200c74` | Chargement des polices installées… |
| `count_fixed_width_font_available_5488f8` | Nombre de polices à chasse fixe disponibles : {count} |
| `count_fixed_width_fonts_available_5df530` | Nombre de polices à chasse fixe disponibles : {count} |
| `count_variable_width_font_available_583582` | Nombre de polices proportionnelles disponibles : {count} |
| `count_variable_width_fonts_available_9d234c` | Nombre de polices proportionnelles disponibles : {count} |
| `count_match_for_query_2e77ac` | Résultats pour « {query} »: {count} |
| `count_matches_for_query_7db710` | Résultats pour « {query} » : {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | Aucune police à chasse fixe ne correspond à « {query} ». |
| `no_variable_width_fonts_match_query_a64030` | Aucune police proportionnelle ne correspond à « {query} ». |
| `current_of_total_35d900` | {current} sur {total} |
| `current_of_total_scope_94ebe5` | {current} sur {total} · {scope} |
| `copy_code_49a005` | Copier le code |
| `clipboard_unavailable_4ff69f` | Presse-papiers indisponible |
| `code_copied_39868c` | Code copié |
| `could_not_copy_code_4a563f` | Impossible de copier le code |
| `the_native_print_dialog_could_not_open_320714` | La boîte de dialogue d’impression du système n’a pas pu s’ouvrir. |
| `could_not_open_the_print_dialog_4bd85a` | Impossible d’ouvrir la boîte de dialogue d’impression. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Abandonner vos modifications non enregistrées et ouvrir un autre document ? |
| `could_not_open_document_69abda` | Impossible d’ouvrir le document |
| `release_check_failed_7b2758` | La vérification de la version a échoué |
| `unrecognized_release_list_62d1cb` | Liste des versions non reconnues |
| `unrecognized_version_d1b8d2` | Version non reconnue |
| `latest_version_version_d1c996` | Dernière version : {version} |
| `unsupported_architecture_087e4f` | Architecture non prise en charge |
| `installer_verification_is_unavailable_98306d` | La vérification du fichier d’installation n’est pas disponible. |
| `unsupported_platform_a96892` | Plateforme non prise en charge |
| `latest_compatible_version_version_fa3079` | Dernière version compatible : {version} |
| `upgrade_markdown_vision_de1b45` | Mettre à jour Markdown Vision |
| `download_macos_update_95d8f3` | Télécharger la mise à jour macOS |
| `download_linux_update_707c5e` | Télécharger la mise à jour Linux |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Impossible de vérifier les mises à jour. Vérifiez votre connexion Internet et réessayez. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Téléchargement et vérification de la mise à jour. Il vous sera peut-être demandé de vous authentifier. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Mise à jour installée. Redémarrez pour utiliser la nouvelle version. |
| `update_failed_error_e4f7dc` | Échec de la mise à jour : {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Télécharger et exécuter le programme d’installation de Markdown Vision ? Enregistrez d’abord tous les documents ouverts. Le programme d’installation peut demander de fermer Markdown Vision. |
| `downloading_and_verifying_update_02b3ba` | Téléchargement et vérification de la mise à jour… |
| `installer_started_865e10` | Le programme d’installation a démarré. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Impossible de télécharger, vérifier ou démarrer le programme d’installation. Veuillez réessayer. |
| `discard_unsaved_changes_and_restart_6d1602` | Supprimer les modifications non enregistrées et redémarrer ? |
| `could_not_restart_error_71e2d2` | Impossible de redémarrer : {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Double-cliquez ou appuyez sur Alt+Enter pour modifier cet élément |
| `saving_23e392` | Enregistrement… |
| `unsaved_6250d5` | Non enregistré |
| `saved_b5c120` | Enregistré |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Impossible d’enregistrer le brouillon. Vos modifications sont toujours dans l’éditeur. |
| `embedded_content_1bca8f` | Contenu intégré |
| `edit_table_source_c7189f` | Modifier la source du tableau |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Sélectionnez une cellule pour la modifier ou modifier le tableau. Appuyez sur Alt+Enter pendant la saisie. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Ce bloc contient un formatage qui doit être modifié dans Markdown. |
| `code_contents_5a1f26` | Contenu du code |
| `type_directly_to_edit_this_indented_code_block_769291` | Tapez directement dans ce bloc de code en retrait pour le modifier. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Tapez directement dans le bloc de code pour modifier son contenu. Utilisez Markdown pour modifier les lignes qui marquent le début et la fin. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Pour modifier le texte, choisissez « Modifier l’élément de liste ». Pour modifier l’imbrication, modifiez la liste en Markdown. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Pour modifier cette liste, choisissez « Modifier l’élément de liste » ou utilisez les cases à cocher. |
| `edit_list_item_text_a982e6` | Modifier le texte d’un élément de liste |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Modifiez directement le texte de l’élément. Modifiez la structure de la liste dans Markdown. |
| `task_4bc74b` | Tâche |
| `edit_item_9f84ee` | Modifier l’élément de liste |
| `list_options_fc3320` | Options de la liste |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Ce tableau doit être modifié dans Markdown. |
| `add_text_to_this_empty_cell_37f900` | Ajouter du texte à cette cellule vide |
| `edit_this_cell_in_markdown_4304b1` | Modifier cette cellule dans Markdown |
| `edit_table_cell_a4212e` | Modifier une cellule du tableau |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Sélectionnez une cellule pour la modifier. Vous pouvez modifier le tableau sous-jacent dans Markdown. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Cette cellule contient du HTML. Modifiez cette cellule dans Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | Cette cellule utilise les références Markdown. Modifiez cette cellule dans Markdown. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Tapez pour modifier cette cellule. Appuyez sur Alt+Enter pour les options du tableau. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Saisissez directement dans les cellules qui ne contiennent que du texte. Pour un contenu plus complexe, utilisez les options du tableau ou modifiez le Markdown. |
| `table_options_cf924a` | Options du tableau |
| `edit_note_299e60` | Modifier la note |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Utilisez « Modifier la note » pour modifier le texte modifiable de la note de bas de page. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | Cette mise en page utilise du HTML. Modifiez-la en Markdown. |
| `edit_inline_code_bf93ee` | Modifier le code en ligne |
| `edit_list_structure_in_markdown_17a222` | Modifier la structure de la liste dans Markdown |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Modifiez directement le texte brut de la liste. Modifiez la structure de la liste dans Markdown. |
| `edit_code_in_table_cell_535cb9` | Modifier le code dans la cellule du tableau |
| `edit_table_cell_text_ca30e7` | Modifier le texte de la cellule du tableau |
| `edit_preformatted_text_9737bd` | Modifier le texte préformaté |
| `edit_disclosure_title_79fb92` | Modifier le titre de la section dépliable |
| `edit_text_7967d9` | Modifier le texte |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Tapez le texte de la cellule. Appuyez sur Alt+Enter pour les options de cellule. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Modifiez le texte directement. Modifiez la structure environnante dans Markdown. |
| `edit_structure_in_markdown_fe607e` | Modifier la structure dans Markdown |
| `edit_quoted_text_9de474` | Modifier le texte cité |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Modifiez directement le texte brut. Modifiez la structure du bloc de citation en Markdown. |
| `edit_heading_text_f3806c` | Modifier le texte du titre |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Modifiez directement le texte du titre. Modifiez le style de titre dans Markdown. |
| `heading_style_c0c25b` | Style de titre |
| `edit_this_item_in_markdown_83b112` | Modifier cet élément dans Markdown |
| `markdown_only_f6e1f7` | Markdown uniquement |
| `visual_only_29a136` | Éditeur visuel uniquement |
| `action_64cff1` | Action |
| `apply_31e392` | Appliquer |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Le Markdown a changé. Rouvrez cet éditeur pour réessayer. |
| `edit_list_item_f69436` | Modifier l’élément de liste |
| `item_text_markdown_0bbe7d` | Texte de l’élément (Markdown) |
| `new_item_b84cad` | Nouvel élément de liste |
| `enter_item_text_or_choose_remove_item_e4003a` | Saisissez le texte de l’élément ou choisissez « Supprimer l’élément ». |
| `enter_item_text_82c7ea` | Saisissez le texte de l’élément. |
| `add_item_below_a6d694` | Ajouter un élément en dessous |
| `remove_item_5a89ed` | Supprimer l’élément |
| `indent_under_previous_item_2e6b03` | Mettre en retrait sous l’élément précédent |
| `outdent_item_07e9b1` | Réduire le retrait de l’élément |
| `this_item_has_no_parent_to_outdent_from_dd148a` | Cet élément n’a pas d’élément parent ; son retrait ne peut pas être réduit. |
| `heading_b34f17` | Titre |
| `edit_footnote_cdcee6` | Modifier la note de bas de page |
| `note_text_369e75` | Texte de la note de bas de page |
| `enter_the_note_text_on_one_line_3a7a5a` | Saisissez le texte de la note sur une seule ligne. |
| `cell_text_9cd173` | Texte de cellule |
| `add_row_below_3d4830` | Ajouter une ligne ci-dessous |
| `add_column_after_38817e` | Ajouter une colonne après |
| `new_column_editor` | Nouvelle colonne |
| `remove_row_1810fd` | Supprimer la ligne |
| `remove_column_9807a2` | Supprimer la colonne |
| `align_column_left_6d9399` | Aligner la colonne à gauche |
| `center_column_1b9b8b` | Centrer le contenu de la colonne |
| `align_column_right_850a8f` | Aligner la colonne à droite |
| `cell_text_markdown_a9e5f9` | Texte de cellule (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Fermez le code en ligne avant d’ajouter un saut de ligne. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Ce texte de cellule modifierait la structure du tableau. Ajoutez un espace avant le séparateur dans Markdown. |
| `alt_text_16f898` | Texte alternatif |
| `link_text_markdown_9b92bd` | Texte du lien (Markdown) |
| `image_url_e55026` | URL de l’image |
| `link_url_9dfd0b` | URL du lien |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | Modifier l’image liée |
| `edit_image_d9d12b` | Modifier l’image |
| `edit_link_94026c` | Modifier le lien |
| `enter_text_without_a_closing_bracket_0e7315` | Saisissez le texte sans crochet fermant. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Saisissez une URL HTTP ou HTTPS sans espaces ni parenthèses. |
| `visual_pane_height_4ad683` | Hauteur du volet visuel |
| `return_to_reader_dcd8f7` | Revenir au mode lecture |
| `number_of_columns_2_8_893663` | Nombre de colonnes (2 à 8) |
| `header_number_b79482` | En-tête de colonne {number} |
| `cell_75fa38` | Cellule |
| `open_1f1d59` | Ouvrir… |
| `new_18fdd5` | Nouveau |
| `print_07c371` | Imprimer… |
| `close_7d9eb7` | Fermer |
| `file_50009c` | Fichier |
| `about_markdown_vision_c6d62d` | À propos du Markdown Vision… |
| `quit_markdown_vision_01c01b` | Quitter Markdown Vision |
| `quit_b3eb37` | Quitter |
| `help_b79cac` | Aide |
| `could_not_enumerate_system_fonts_00e652` | Impossible d’énumérer les polices système |
| `no_system_fonts_found_a8a9af` | Aucune police système trouvée |
| `could_not_open_document_640c27` | Impossible d’ouvrir le document |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | Le document n’a pas pu être ouvert. Vos modifications actuelles sont toujours disponibles. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Abandonner vos modifications non enregistrées et fermer Markdown Vision ? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Abandonner vos modifications non enregistrées et quitter Markdown Vision ? |
| `unknown_confirmation_request_feea29` | Demande de confirmation inconnue |
| `keep_editing_624a83` | Continuer à modifier |
| `discard_eb1a70` | Abandonner |
| `unsaved_changes_a710c2` | Modifications non enregistrées |
| `the_document_is_no_longer_open_use_save_as_671c50` | Le document n’est plus ouvert. Utilisez « Enregistrer sous ». |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Ce fichier comporte des fins de ligne différentes ou un encodage UTF-8 non valide. Utilisez « Enregistrer sous ». |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | L’enregistrement via un lien symbolique n’est pas pris en charge. Utilisez « Enregistrer sous ». |
| `invalid_destination_14f03f` | Destination invalide |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | Le fichier de destination a changé sur le disque. Utilisez « Enregistrer sous » pour conserver vos modifications. |
| `the_update_process_failed_010689` | Le processus de mise à jour a échoué. |
| `could_not_restore_the_open_document_69d724` | Impossible de restaurer le document ouvert. |
| `could_not_restart_markdown_vision_6ead36` | Impossible de redémarrer Markdown Vision. |
| `restart_is_not_available_on_this_platform_998ef6` | Le redémarrage n’est pas disponible sur cette plateforme. |
| `the_update_information_is_invalid_dbcffc` | Les informations de mise à jour ne sont pas valides. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Les mises à jour automatiques nécessitent un package DEB ou RPM installé. |
| `this_architecture_is_not_supported_ae063c` | Cette architecture n’est pas prise en charge. |
| `could_not_identify_the_linux_distribution_18bbdb` | Impossible d’identifier la distribution Linux. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | Le gestionnaire de packages RPM n’est pas disponible. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision n’est pas installé en tant que package RPM compatible. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Cette mise à jour n’est pas plus récente que le package installé. |
| `the_debian_package_manager_is_unavailable_b5d66b` | Le gestionnaire de paquets Debian n’est pas disponible. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision n’est pas installé en tant que package DEB. |
| `could_not_determine_the_installed_version_f1a1f1` | Impossible de déterminer la version installée. |
| `could_not_compare_package_versions_465d4e` | Impossible de comparer les versions des packages. |
| `could_not_create_a_temporary_download_folder_36407c` | Impossible de créer un dossier de téléchargement temporaire. |
| `could_not_start_the_download_b4acf0` | Impossible de démarrer le téléchargement. |
| `the_update_could_not_be_downloaded_4d6fd7` | La mise à jour n’a pas pu être téléchargée. |
| `could_not_verify_the_update_2cd2c5` | Impossible de vérifier la mise à jour. |
| `the_downloaded_update_failed_verification_60519b` | La vérification de la mise à jour téléchargée a échoué. |
| `could_not_inspect_the_update_package_9812b2` | Impossible d’inspecter le package de mise à jour. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | Le package téléchargé contient des métadonnées inattendues. |
| `version_dd1679` | Version |
| `could_not_start_the_system_installer_907ba2` | Impossible de démarrer le programme d’installation du système. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | L’installation a été annulée ou a échoué. Veuillez réessayer. |
| `could_not_verify_the_installed_update_04a200` | Impossible de vérifier la mise à jour installée. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | Le programme d’installation n’a pas mis à jour Markdown Vision vers la version attendue. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Les mises à jour automatiques DEB ne sont disponibles que sur Linux. |
| `invalid_preferences_bc6b57` | Préférences invalides |
| `invalid_key_b06fe9` | {key} invalide |
| `unsupported_preferences_version_54734c` | Version des préférences non prise en charge |
| `missing_preferences_679970` | Préférences manquantes |
| `invalid_preferences_directory_a6f362` | Répertoire de préférences invalide |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision n’a pas pu lire ce fichier. |
| `markdown_files_177420` | Fichiers Markdown |
| `text_files_c5df15` | Fichiers texte |
| `all_files_866956` | Tous les fichiers |
| `save_markdown_file_813f90` | Enregistrer le fichier Markdown |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Ce document n’est plus ouvert. Rouvrez le fichier ou utilisez « Enregistrer sous ». |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Utilisez « Enregistrer sous » pour créer une copie UTF-8 de ce fichier. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | Ce fichier utilise différentes fins de ligne. Utilisez « Enregistrer sous » pour créer une copie avec des fins de ligne uniformes. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows n’a pas pu ouvrir la boîte de dialogue « Enregistrer sous ». |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | Le brouillon n’a pas pu être codé sous la forme UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows n’a pas pu lire la destination sélectionnée. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | Le fichier a changé sur le disque ou n’est pas disponible. Utilisez « Enregistrer sous » pour conserver vos modifications dans une copie distincte. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows n’a pas pu enregistrer le fichier. Vérifiez qu’il est accessible en écriture ou utilisez « Enregistrer sous ». |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows n’a pas pu restaurer le fichier d’origine lors de l’enregistrement. L’original se trouve à {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | La demande de sauvegarde n’a pas pu être complétée. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision n’a pas pu préparer ses fichiers dans votre dossier local de données d’application. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Le runtime Microsoft Edge WebView2 est requis. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Installation de Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | Sous licence GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | Ce programme d’installation nécessite Windows sur ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision est en cours d’exécution. Enregistrez tous les documents non enregistrés avant de continuer. Fermer Markdown Vision et poursuivre l’installation ? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | Le programme d’installation n’a pas pu fermer Markdown Vision. Fermez-le manuellement et réexécutez l’installation. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision est toujours en cours d’exécution. Fermez-le et sélectionnez Réessayer, ou annulez l’installation. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Suppression de l’édition Markdown Vision actuellement installée… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | Impossible de supprimer l’installation existante de Markdown Vision. Le programme d’installation va s’arrêter sans installer Markdown Vision Native. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | Dans les paramètres Windows, vous pouvez choisir Markdown Vision comme application par défaut pour les fichiers Markdown. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Ouvrir les paramètres des applications par défaut de Windows après l’installation |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision a été installé. |
| `open_markdown_vision_when_setup_closes_8422c7` | Ouvrir Markdown Vision à la fermeture du programme d’installation |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native n’a pas pu être installé. L’installation s’arrêtera sans enregistrer une installation incomplète. |
| `markdown_document_00271f` | Document Markdown |
| `markdown_vision_preview_handler_8c95f7` | Gestionnaire d’aperçu Markdown Vision |
| `markdown_file_viewer_c36ee7` | Visionneuse de fichiers Markdown |
| `uninstall_fe1995` | Désinstaller |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision n’a pas pu démarrer. {error} |
| `unknown_native_method_method_cc7ca9` | Méthode native inconnue : {method} |
| `text_71988c` | Texte |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | Titre {level} |
| `normal_text_a2adc4` | Texte normal |
| `footnotes_ad6fb5` | Notes de bas de page |
| `size_px_8d05e6` | {size} px |
| `link_text_insert_default` | texte du lien |
| `back_to_footnote_reference` | Retour à l’appel de note |

## Locale de

German

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Markdown-Formatierung |
| `undo_a8283a` | Rückgängig machen |
| `redo_742739` | Wiederholen |
| `bold_ctrl_b_84787d` | Fett (Ctrl+B) |
| `bold_94fee6` | Fett |
| `italic_ctrl_i_ccc60d` | Kursiv (Ctrl+I) |
| `italic_9bf37c` | Kursiv |
| `strikethrough_9aabbc` | Durchgestrichen |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Überschriftenebenen durchschalten (H1–H6, danach normaler Text) |
| `cycle_heading_level_bde9c4` | Überschriftenebenen durchschalten |
| `bulleted_list_ce51b3` | Liste mit Aufzählungszeichen |
| `task_list_5d3253` | Aufgabenliste |
| `numbered_list_cc62f6` | Nummerierte Liste |
| `quote_eb4cde` | Zitat |
| `inline_code_e767de` | Inline-Code |
| `code_block_754538` | Codeblock |
| `link_a6a32d` | Link |
| `insert_table_67318e` | Tabelle einfügen |
| `edit_markdown_6ff388` | Markdown bearbeiten |
| `new_markdown_file_ctrl_n_f22ed5` | Neue Markdown-Datei (Ctrl+N) |
| `new_markdown_file_0928e9` | Neue Markdown-Datei |
| `open_markdown_file_b7764a` | Markdown-Datei öffnen |
| `print_ctrl_p_5c4406` | Drucken (Ctrl+P) |
| `print_document_2a024b` | Dokument drucken |
| `search_text_38d268` | Im Text suchen |
| `settings_74a883` | Einstellungen |
| `switch_to_dark_mode_fc43ea` | Wechseln Sie in den Dunkelmodus |
| `about_markdown_vision_08f9a5` | Über Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | GNU GPLv3-Lizenz |
| `version_version_a18745` | Version {version} |
| `latest_version_checking_4bfedc` | Neueste Version: Überprüfung… |
| `update_c1c100` | Aktualisieren |
| `update_text_editor` | Text aktualisieren |
| `keep_unchanged_editor` | Unverändert lassen |
| `check_for_updates_f26f32` | Nach Updates suchen |
| `restart_markdown_vision_7e50f8` | Markdown Vision neu starten |
| `text_search_10155f` | Textsuche |
| `count_match_ef9195` | {count} Suchtreffer |
| `count_matches_43682a` | {count} Suchtreffer |
| `previous_match_daa2f8` | Vorheriger Suchtreffer |
| `next_match_825e5a` | Nächster Suchtreffer |
| `close_search_55656b` | Suche schließen |
| `close_settings_0ccfef` | Einstellungen schließen |
| `variable_width_font_0836b2` | Schriftart mit variabler Breite |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Geben Sie einen Schriftartnamen ein oder wählen Sie eine installierte Schriftart aus. |
| `fixed_width_font_3de094` | Schriftart mit fester Breite |
| `used_for_code_and_other_monospaced_text_84b6ed` | Wird für Code und andere Texte mit fester Zeichenbreite verwendet. |
| `text_size_d68761` | Textgröße |
| `automatic_text_size_919785` | Automatische Textgröße |
| `automatic_d461a4` | Automatisch |
| `line_spacing_0db45d` | Zeilenabstand |
| `page_width_limit_19528b` | Begrenzung der Seitenbreite |
| `automatic_page_width_bd5c30` | Automatische Seitenbreite |
| `markdown_editor_da0ea6` | Markdown-Editor |
| `editor_view_1d1833` | Editoransicht |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown links, visueller Editor rechts |
| `split_0b61a1` | Teilen ↔ |
| `visual_above_markdown_a04e0f` | Visueller Editor über Markdown |
| `split_b3b924` | Teilen ↕ |
| `visual_ba3033` | Visuell |
| `save_ctrl_s_4be89e` | Speichern (Ctrl+S) |
| `save_1509f5` | Speichern |
| `save_as_ctrl_shift_s_0f132a` | Speichern unter (Ctrl+Shift+S) |
| `save_as_a4b76a` | Speichern unter… |
| `markdown_source_580118` | Markdown-Quelle |
| `markdown_pane_width_ab0129` | Breite des Markdown-Bereichs |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% Visuell |
| `visual_editor_5665dd` | Visueller Editor |
| `visual_editing_restriction_d42cea` | Einschränkung der visuellen Bearbeitung |
| `edit_in_markdown_165fd4` | Bearbeiten in Markdown |
| `dismiss_48845b` | Hinweis schließen |
| `count_word_1f505c` | {count} Wort |
| `count_words_caab29` | {count} Wörter |
| `approximate_word_count_7b987a` | Ungefähre Wortzahl: {count} |
| `line_line_column_column_21e9f4` | Zeile {line}, Spalte {column} |
| `untitled_md_2dccf8` | Unbenannt.md |
| `save_your_changes_56dd16` | Änderungen speichern? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Speichern Sie Ihr aktuelles Dokument, bevor Sie eine neue Datei erstellen. |
| `cancel_19766e` | Abbrechen |
| `discard_changes_f9bfa3` | Änderungen verwerfen |
| `switch_to_light_mode_bfa0ca` | Zum hellen Modus wechseln |
| `enter_the_name_of_any_installed_font_b57a72` | Geben Sie den Namen einer beliebigen installierten Schriftart ein. |
| `loading_installed_fonts_200c74` | Installierte Schriftarten werden geladen… |
| `count_fixed_width_font_available_5488f8` | Anzahl verfügbarer Schriftarten mit fester Breite: {count} |
| `count_fixed_width_fonts_available_5df530` | Anzahl verfügbarer Schriftarten mit fester Breite: {count} |
| `count_variable_width_font_available_583582` | Anzahl verfügbarer Schriftarten mit variabler Breite: {count} |
| `count_variable_width_fonts_available_9d234c` | Anzahl verfügbarer Schriftarten mit variabler Breite: {count} |
| `count_match_for_query_2e77ac` | Suchtreffer für „{query}“: {count} |
| `count_matches_for_query_7db710` | Suchtreffer für „{query}“: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | Keine Schriftart mit fester Breite passt zu „{query}“. |
| `no_variable_width_fonts_match_query_a64030` | Keine Schriftart mit variabler Breite passt zu „{query}“. |
| `current_of_total_35d900` | {current} von {total} |
| `current_of_total_scope_94ebe5` | {current} von {total} · {scope} |
| `copy_code_49a005` | Code kopieren |
| `clipboard_unavailable_4ff69f` | Zwischenablage nicht verfügbar |
| `code_copied_39868c` | Code kopiert |
| `could_not_copy_code_4a563f` | Code konnte nicht kopiert werden |
| `the_native_print_dialog_could_not_open_320714` | Der Systemdruckdialog konnte nicht geöffnet werden. |
| `could_not_open_the_print_dialog_4bd85a` | Der Druckdialog konnte nicht geöffnet werden. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Ihre nicht gespeicherten Änderungen verwerfen und ein anderes Dokument öffnen? |
| `could_not_open_document_69abda` | Dokument konnte nicht geöffnet werden |
| `release_check_failed_7b2758` | Versionsprüfung fehlgeschlagen |
| `unrecognized_release_list_62d1cb` | Versionsliste nicht erkannt |
| `unrecognized_version_d1b8d2` | Unbekannte Version |
| `latest_version_version_d1c996` | Neueste Version: {version} |
| `unsupported_architecture_087e4f` | Nicht unterstützte Architektur |
| `installer_verification_is_unavailable_98306d` | Die Überprüfung des Installationsprogramms ist nicht verfügbar |
| `unsupported_platform_a96892` | Nicht unterstützte Plattform |
| `latest_compatible_version_version_fa3079` | Neueste kompatible Version: {version} |
| `upgrade_markdown_vision_de1b45` | Markdown Vision aktualisieren |
| `download_macos_update_95d8f3` | macOS-Update herunterladen |
| `download_linux_update_707c5e` | Linux-Update herunterladen |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Es kann nicht nach Updates gesucht werden. Überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Herunterladen und Überprüfen des Updates. Möglicherweise werden Sie zur Authentifizierung aufgefordert. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Update installiert. Starten Sie neu, um die neue Version zu verwenden. |
| `update_failed_error_e4f7dc` | Aktualisierung fehlgeschlagen: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Das Markdown Vision-Installationsprogramm herunterladen und ausführen? Speichern Sie zunächst alle geöffneten Dokumente. Das Installationsprogramm fordert möglicherweise dazu auf, Markdown Vision zu schließen. |
| `downloading_and_verifying_update_02b3ba` | Update wird heruntergeladen und überprüft… |
| `installer_started_865e10` | Das Installationsprogramm wurde gestartet. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Das Installationsprogramm konnte nicht heruntergeladen, überprüft oder gestartet werden. Bitte versuchen Sie es erneut. |
| `discard_unsaved_changes_and_restart_6d1602` | Nicht gespeicherte Änderungen verwerfen und neu starten? |
| `could_not_restart_error_71e2d2` | Konnte nicht neu gestartet werden: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Doppelklicken oder drücken Sie Alt+Enter, um dieses Element zu bearbeiten |
| `saving_23e392` | Wird gespeichert… |
| `unsaved_6250d5` | Nicht gespeichert |
| `saved_b5c120` | Gespeichert |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Der Entwurf konnte nicht gespeichert werden. Ihre Änderungen sind noch im Editor. |
| `embedded_content_1bca8f` | Eingebetteter Inhalt |
| `edit_table_source_c7189f` | Tabellenquelle bearbeiten |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Wählen Sie eine Zelle aus, um sie zu bearbeiten oder die Tabelle zu ändern. Drücken Sie während der Eingabe Alt+Enter. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Dieser Block enthält Formatierungen, die in Markdown bearbeitet werden müssen. |
| `code_contents_5a1f26` | Codeinhalte |
| `type_directly_to_edit_this_indented_code_block_769291` | Schreiben Sie direkt in diesen eingerückten Codeblock, um ihn zu bearbeiten. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Geben Sie direkt im Codeblock Text ein, um seinen Inhalt zu bearbeiten. Bearbeiten Sie die Zeilen, die Anfang und Ende markieren, in Markdown. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Wählen Sie „Listeneintrag bearbeiten“, um den Text zu ändern. Bearbeiten Sie die Liste in Markdown, um die Verschachtelung zu ändern. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Ändern Sie die Liste über „Listeneintrag bearbeiten“ oder die Kontrollkästchen. |
| `edit_list_item_text_a982e6` | Text des Listeneintrags bearbeiten |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Bearbeiten Sie den Text des Listeneintrags direkt. Bearbeiten Sie die Listenstruktur in Markdown. |
| `task_4bc74b` | Aufgabe |
| `edit_item_9f84ee` | Listeneintrag bearbeiten |
| `list_options_fc3320` | Listenoptionen |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Diese Tabelle muss in Markdown bearbeitet werden. |
| `add_text_to_this_empty_cell_37f900` | Text zu dieser leeren Zelle hinzufügen |
| `edit_this_cell_in_markdown_4304b1` | Diese Zelle in Markdown bearbeiten |
| `edit_table_cell_a4212e` | Tabellenzelle bearbeiten |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Wählen Sie eine Zelle aus, um sie zu bearbeiten. Sie können die zugrunde liegende Tabelle in Markdown bearbeiten. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Diese Zelle enthält HTML. Bearbeiten Sie diese Zelle in Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | Diese Zelle verwendet Markdown-Referenzen. Bearbeiten Sie diese Zelle in Markdown. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Schreiben Sie direkt in diese Zelle. Drücken Sie Alt+Enter, um die Tabellenoptionen anzuzeigen. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Geben Sie Text direkt in Zellen ein, die nur einfachen Text enthalten. Für komplexere Inhalte verwenden Sie die Tabellenoptionen oder bearbeiten Sie Markdown. |
| `table_options_cf924a` | Tabellenoptionen |
| `edit_note_299e60` | Notiz bearbeiten |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Verwenden Sie „Notiz bearbeiten“, um den bearbeitbaren Text der Fußnote zu ändern. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | Dieses Layout verwendet HTML. Bearbeiten Sie es in Markdown. |
| `edit_inline_code_bf93ee` | Inline-Code bearbeiten |
| `edit_list_structure_in_markdown_17a222` | Listenstruktur in Markdown bearbeiten |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Bearbeiten Sie den einfachen Listentext direkt. Bearbeiten Sie die Listenstruktur in Markdown. |
| `edit_code_in_table_cell_535cb9` | Code in der Tabellenzelle bearbeiten |
| `edit_table_cell_text_ca30e7` | Tabellenzellentext bearbeiten |
| `edit_preformatted_text_9737bd` | Vorformatierten Text bearbeiten |
| `edit_disclosure_title_79fb92` | Titel des aufklappbaren Abschnitts bearbeiten |
| `edit_text_7967d9` | Text bearbeiten |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Geben Sie den Zellentext ein. Drücken Sie Alt+Enter für Zellenoptionen. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Bearbeiten Sie den Text direkt. Bearbeiten Sie die umgebende Struktur in Markdown. |
| `edit_structure_in_markdown_fe607e` | Struktur in Markdown bearbeiten |
| `edit_quoted_text_9de474` | Zitierten Text bearbeiten |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Bearbeiten Sie den einfachen Text direkt. Bearbeiten Sie die Struktur des Blockzitats in Markdown. |
| `edit_heading_text_f3806c` | Überschriftentext bearbeiten |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Bearbeiten Sie den Überschriftentext direkt. Bearbeiten Sie den Überschriftenstil in Markdown. |
| `heading_style_c0c25b` | Überschriftenstil |
| `edit_this_item_in_markdown_83b112` | Diesen Eintrag in Markdown bearbeiten |
| `markdown_only_f6e1f7` | Nur Markdown |
| `visual_only_29a136` | Nur visueller Editor |
| `action_64cff1` | Aktion |
| `apply_31e392` | Anwenden |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Der Markdown hat sich geändert. Öffnen Sie diesen Editor erneut, um es erneut zu versuchen. |
| `edit_list_item_f69436` | Listeneintrag bearbeiten |
| `item_text_markdown_0bbe7d` | Text des Listeneintrags (Markdown) |
| `new_item_b84cad` | Neuer Listeneintrag |
| `enter_item_text_or_choose_remove_item_e4003a` | Geben Sie den Text des Listeneintrags ein oder wählen Sie „Listeneintrag entfernen“. |
| `enter_item_text_82c7ea` | Geben Sie den Text des Listeneintrags ein. |
| `add_item_below_a6d694` | Listeneintrag darunter hinzufügen |
| `remove_item_5a89ed` | Listeneintrag entfernen |
| `indent_under_previous_item_2e6b03` | Unter dem vorherigen Punkt einrücken |
| `outdent_item_07e9b1` | Einzug des Listeneintrags verringern |
| `this_item_has_no_parent_to_outdent_from_dd148a` | Dieser Listeneintrag hat keinen übergeordneten Eintrag, daher kann sein Einzug nicht verringert werden. |
| `heading_b34f17` | Überschrift |
| `edit_footnote_cdcee6` | Fußnote bearbeiten |
| `note_text_369e75` | Fußnotentext |
| `enter_the_note_text_on_one_line_3a7a5a` | Geben Sie den Notiztext in einer Zeile ein. |
| `cell_text_9cd173` | Zellentext |
| `add_row_below_3d4830` | Zeile unten hinzufügen |
| `add_column_after_38817e` | Spalte danach hinzufügen |
| `new_column_editor` | Neue Spalte |
| `remove_row_1810fd` | Zeile entfernen |
| `remove_column_9807a2` | Spalte entfernen |
| `align_column_left_6d9399` | Spalte links ausrichten |
| `center_column_1b9b8b` | Spalteninhalt zentrieren |
| `align_column_right_850a8f` | Spalte rechts ausrichten |
| `cell_text_markdown_a9e5f9` | Zellentext (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Schließen Sie den Inline-Code, bevor Sie einen Zeilenumbruch hinzufügen. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Dieser Zellentext würde die Tabellenstruktur verändern. Fügen Sie vor dem Trennzeichen in Markdown ein Leerzeichen ein. |
| `alt_text_16f898` | Alt-Text |
| `link_text_markdown_9b92bd` | Linktext (Markdown) |
| `image_url_e55026` | Bild-URL |
| `link_url_9dfd0b` | Link-URL |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | Verlinktes Bild bearbeiten |
| `edit_image_d9d12b` | Bild bearbeiten |
| `edit_link_94026c` | Link bearbeiten |
| `enter_text_without_a_closing_bracket_0e7315` | Geben Sie Text ohne schließende Klammer ein. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Geben Sie eine HTTP- oder HTTPS-URL ohne Leerzeichen oder Klammern ein. |
| `visual_pane_height_4ad683` | Höhe des visuellen Bereichs |
| `return_to_reader_dcd8f7` | Zurück zur Leseansicht |
| `number_of_columns_2_8_893663` | Anzahl der Spalten (2–8) |
| `header_number_b79482` | Spaltenüberschrift {number} |
| `cell_75fa38` | Zelle |
| `open_1f1d59` | Öffnen… |
| `new_18fdd5` | Neu |
| `print_07c371` | Drucken… |
| `close_7d9eb7` | Schließen |
| `file_50009c` | Datei |
| `about_markdown_vision_c6d62d` | Über Markdown Vision… |
| `quit_markdown_vision_01c01b` | Markdown Vision beenden |
| `quit_b3eb37` | Beenden |
| `help_b79cac` | Hilfe |
| `could_not_enumerate_system_fonts_00e652` | Systemschriftarten konnten nicht aufgelistet werden |
| `no_system_fonts_found_a8a9af` | Keine Systemschriftarten gefunden |
| `could_not_open_document_640c27` | Dokument konnte nicht geöffnet werden |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | Das Dokument konnte nicht geöffnet werden. Ihre aktuellen Änderungen sind weiterhin verfügbar. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Ihre nicht gespeicherten Änderungen verwerfen und Markdown Vision schließen? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Ihre nicht gespeicherten Änderungen verwerfen und Markdown Vision beenden? |
| `unknown_confirmation_request_feea29` | Unbekannte Bestätigungsanfrage |
| `keep_editing_624a83` | Weiter bearbeiten |
| `discard_eb1a70` | Verwerfen |
| `unsaved_changes_a710c2` | Nicht gespeicherte Änderungen |
| `the_document_is_no_longer_open_use_save_as_671c50` | Das Dokument ist nicht mehr geöffnet. Verwenden Sie „Speichern unter“. |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Diese Datei enthält unterschiedliche Zeilenenden oder ungültig kodierten UTF-8-Text. Verwenden Sie „Speichern unter“. |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | Das Speichern über einen symbolischen Link wird nicht unterstützt. Verwenden Sie „Speichern unter“. |
| `invalid_destination_14f03f` | Ungültiges Ziel |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | Die Zieldatei wurde auf dem Datenträger geändert. Verwenden Sie „Speichern unter“, um Ihre Änderungen zu erhalten. |
| `the_update_process_failed_010689` | Der Aktualisierungsvorgang ist fehlgeschlagen. |
| `could_not_restore_the_open_document_69d724` | Das geöffnete Dokument konnte nicht wiederhergestellt werden. |
| `could_not_restart_markdown_vision_6ead36` | Markdown Vision konnte nicht neu gestartet werden. |
| `restart_is_not_available_on_this_platform_998ef6` | Neustart ist auf dieser Plattform nicht verfügbar. |
| `the_update_information_is_invalid_dbcffc` | Die Update-Informationen sind ungültig. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Für automatische Updates ist ein installiertes DEB- oder RPM-Paket erforderlich. |
| `this_architecture_is_not_supported_ae063c` | Diese Architektur wird nicht unterstützt. |
| `could_not_identify_the_linux_distribution_18bbdb` | Die Linux-Distribution konnte nicht identifiziert werden. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | Der RPM-Paketmanager ist nicht verfügbar. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision ist nicht als kompatibles RPM-Paket installiert. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Dieses Update ist nicht neuer als das installierte Paket. |
| `the_debian_package_manager_is_unavailable_b5d66b` | Der Debian-Paketmanager ist nicht verfügbar. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision ist nicht als DEB-Paket installiert. |
| `could_not_determine_the_installed_version_f1a1f1` | Die installierte Version konnte nicht ermittelt werden. |
| `could_not_compare_package_versions_465d4e` | Paketversionen konnten nicht verglichen werden. |
| `could_not_create_a_temporary_download_folder_36407c` | Es konnte kein temporärer Download-Ordner erstellt werden. |
| `could_not_start_the_download_b4acf0` | Der Download konnte nicht gestartet werden. |
| `the_update_could_not_be_downloaded_4d6fd7` | Das Update konnte nicht heruntergeladen werden. |
| `could_not_verify_the_update_2cd2c5` | Das Update konnte nicht überprüft werden. |
| `the_downloaded_update_failed_verification_60519b` | Die Überprüfung des heruntergeladenen Updates ist fehlgeschlagen. |
| `could_not_inspect_the_update_package_9812b2` | Das Update-Paket konnte nicht überprüft werden. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | Das heruntergeladene Paket enthält unerwartete Metadaten. |
| `version_dd1679` | Version |
| `could_not_start_the_system_installer_907ba2` | Das Systeminstallationsprogramm konnte nicht gestartet werden. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | Die Installation wurde abgebrochen oder ist fehlgeschlagen. Bitte versuchen Sie es erneut. |
| `could_not_verify_the_installed_update_04a200` | Das installierte Update konnte nicht überprüft werden. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | Das Installationsprogramm hat Markdown Vision nicht auf die erwartete Version aktualisiert. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Automatische DEB-Updates sind nur auf Linux verfügbar. |
| `invalid_preferences_bc6b57` | Ungültige Einstellungen |
| `invalid_key_b06fe9` | Ungültiges {key} |
| `unsupported_preferences_version_54734c` | Nicht unterstützte Einstellungsversion |
| `missing_preferences_679970` | Fehlende Präferenzen |
| `invalid_preferences_directory_a6f362` | Ungültiges Einstellungsverzeichnis |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision konnte diese Datei nicht lesen. |
| `markdown_files_177420` | Markdown-Dateien |
| `text_files_c5df15` | Textdateien |
| `all_files_866956` | Alle Dateien |
| `save_markdown_file_813f90` | Markdown-Datei speichern |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Dieses Dokument ist nicht mehr geöffnet. Öffnen Sie die Datei erneut oder verwenden Sie „Speichern unter“. |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Verwenden Sie „Speichern unter“, um eine UTF-8-Kopie dieser Datei zu erstellen. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | Diese Datei verwendet gemischte Zeilenenden. Verwenden Sie „Speichern unter“, um eine Kopie mit konsistenten Zeilenenden zu erstellen. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows konnte das Dialogfeld „Speichern unter“ nicht öffnen. |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | Der Entwurf konnte nicht als UTF-8 codiert werden. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows konnte das ausgewählte Ziel nicht lesen. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | Die Datei wurde auf der Festplatte geändert oder ist nicht verfügbar. Verwenden Sie „Speichern unter“, um Ihre Änderungen in einer separaten Kopie zu speichern. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows konnte die Datei nicht speichern. Überprüfen Sie, ob die Datei beschreibbar ist, oder verwenden Sie „Speichern unter“. |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows konnte die Originaldatei während des Speicherns nicht wiederherstellen. Das Original befindet sich unter {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | Die Speicheranforderung konnte nicht abgeschlossen werden. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision konnte seine Anwendungsdateien in Ihrem lokalen App-Datenordner nicht vorbereiten. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Microsoft Edge WebView2 Runtime ist erforderlich. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Installation von Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | Lizenziert unter GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | Dieses Installationsprogramm erfordert Windows auf ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision läuft. Speichern Sie alle nicht gespeicherten Dokumente, bevor Sie fortfahren. Soll Markdown Vision geschlossen und die Installation fortgesetzt werden? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | Das Installationsprogramm konnte Markdown Vision nicht schließen. Schließen Sie es manuell und starten Sie das Installationsprogramm erneut. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision läuft noch. Schließen Sie es und wählen Sie „Wiederholen“ oder brechen Sie die Installation ab. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Entfernen der aktuell installierten Markdown Vision-Edition… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | Die vorhandene Installation von Markdown Vision konnte nicht entfernt werden. Das Installationsprogramm wird beendet, ohne Markdown Vision Native zu installieren. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | Sie können Markdown Vision in den Windows-Einstellungen als Standard-App für Markdown-Dateien auswählen. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Windows-Einstellungen für Standard-Apps nach der Installation öffnen |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision wurde installiert. |
| `open_markdown_vision_when_setup_closes_8422c7` | Markdown Vision nach dem Schließen des Installationsprogramms öffnen |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native konnte nicht installiert werden. Das Installationsprogramm wird beendet, ohne dass eine unvollständige Installation registriert wird. |
| `markdown_document_00271f` | Markdown-Dokument |
| `markdown_vision_preview_handler_8c95f7` | Markdown Vision Vorschau-Handler |
| `markdown_file_viewer_c36ee7` | Markdown-Dateibetrachter |
| `uninstall_fe1995` | Deinstallieren |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision konnte nicht gestartet werden. {error} |
| `unknown_native_method_method_cc7ca9` | Unbekannte native Methode: {method} |
| `text_71988c` | Text |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | Überschrift {level} |
| `normal_text_a2adc4` | Normaler Text |
| `footnotes_ad6fb5` | Fußnoten |
| `size_px_8d05e6` | {size} px |
| `link_text_insert_default` | Linktext |
| `back_to_footnote_reference` | Zurück zum Fußnotenverweis |

## Locale hi

Hindi

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Markdown स्वरूपण |
| `undo_a8283a` | पूर्ववत करें |
| `redo_742739` | पुनः करें |
| `bold_ctrl_b_84787d` | बोल्ड (Ctrl+B) |
| `bold_94fee6` | बोल्ड |
| `italic_ctrl_i_ccc60d` | इटैलिक (Ctrl+I) |
| `italic_9bf37c` | इटैलिक |
| `strikethrough_9aabbc` | स्ट्राइकथ्रू |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | शीर्षक के स्तर क्रम से बदलें (H1–H6, फिर सामान्य पाठ) |
| `cycle_heading_level_bde9c4` | शीर्षक के स्तर क्रम से बदलें |
| `bulleted_list_ce51b3` | बुलेटेड सूची |
| `task_list_5d3253` | कार्य सूची |
| `numbered_list_cc62f6` | क्रमांकित सूची |
| `quote_eb4cde` | उद्धरण |
| `inline_code_e767de` | इनलाइन कोड |
| `code_block_754538` | कोड ब्लॉक |
| `link_a6a32d` | लिंक |
| `insert_table_67318e` | तालिका सम्मिलित करें |
| `edit_markdown_6ff388` | Markdown संपादित करें |
| `new_markdown_file_ctrl_n_f22ed5` | नई Markdown फ़ाइल (Ctrl+N) |
| `new_markdown_file_0928e9` | नई Markdown फ़ाइल |
| `open_markdown_file_b7764a` | Markdown फ़ाइल खोलें |
| `print_ctrl_p_5c4406` | प्रिंट करें (Ctrl+P) |
| `print_document_2a024b` | दस्तावेज़ प्रिंट करें |
| `search_text_38d268` | पाठ में खोजें |
| `settings_74a883` | सेटिंग्स |
| `switch_to_dark_mode_fc43ea` | डार्क मोड पर स्विच करें |
| `about_markdown_vision_08f9a5` | Markdown Vision के बारे में |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | GNU GPLv3 लाइसेंस |
| `version_version_a18745` | संस्करण {version} |
| `latest_version_checking_4bfedc` | नवीनतम संस्करण: जाँच हो रही है… |
| `update_c1c100` | अपडेट करें |
| `update_text_editor` | पाठ अपडेट करें |
| `keep_unchanged_editor` | अपरिवर्तित रखें |
| `check_for_updates_f26f32` | अपडेट के लिए जांचें |
| `restart_markdown_vision_7e50f8` | Markdown Vision को पुनरारंभ करें |
| `text_search_10155f` | पाठ में खोज |
| `count_match_ef9195` | {count} खोज परिणाम |
| `count_matches_43682a` | {count} खोज परिणाम |
| `previous_match_daa2f8` | पिछला खोज परिणाम |
| `next_match_825e5a` | अगला खोज परिणाम |
| `close_search_55656b` | खोज बंद करें |
| `close_settings_0ccfef` | सेटिंग्स बंद करें |
| `variable_width_font_0836b2` | अनुपाती फ़ॉन्ट |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | एक फ़ॉन्ट नाम टाइप करें या एक स्थापित फ़ॉन्ट चुनें। |
| `fixed_width_font_3de094` | समान-चौड़ाई वाला फ़ॉन्ट |
| `used_for_code_and_other_monospaced_text_84b6ed` | कोड और अन्य मोनोस्पेस्ड टेक्स्ट के लिए उपयोग किया जाता है। |
| `text_size_d68761` | पाठ का आकार |
| `automatic_text_size_919785` | स्वचालित पाठ आकार |
| `automatic_d461a4` | स्वचालित |
| `line_spacing_0db45d` | पंक्ति रिक्ति |
| `page_width_limit_19528b` | पृष्ठ चौड़ाई सीमा |
| `automatic_page_width_bd5c30` | स्वचालित पृष्ठ चौड़ाई |
| `markdown_editor_da0ea6` | Markdown संपादक |
| `editor_view_1d1833` | संपादक दृश्य |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | बाएँ Markdown, दाएँ विज़ुअल संपादक |
| `split_0b61a1` | विभाजित ↔ |
| `visual_above_markdown_a04e0f` | ऊपर विज़ुअल संपादक, नीचे Markdown |
| `split_b3b924` | विभाजित ↕ |
| `visual_ba3033` | दृश्य |
| `save_ctrl_s_4be89e` | सहेजें (Ctrl+S) |
| `save_1509f5` | सहेजें |
| `save_as_ctrl_shift_s_0f132a` | इस रूप में सहेजें (Ctrl+Shift+S) |
| `save_as_a4b76a` | इस रूप में सहेजें… |
| `markdown_source_580118` | Markdown स्रोत |
| `markdown_pane_width_ab0129` | Markdown पैनल की चौड़ाई |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% दृश्य |
| `visual_editor_5665dd` | विज़ुअल संपादक |
| `visual_editing_restriction_d42cea` | दृश्य संपादन प्रतिबंध |
| `edit_in_markdown_165fd4` | Markdown में संपादित करें |
| `dismiss_48845b` | सूचना बंद करें |
| `count_word_1f505c` | {count} शब्द |
| `count_words_caab29` | {count} शब्द |
| `approximate_word_count_7b987a` | अनुमानित शब्द संख्या: {count} |
| `line_line_column_column_21e9f4` | लाइन {line}, कॉलम {column} |
| `untitled_md_2dccf8` | शीर्षक रहित.md |
| `save_your_changes_56dd16` | अपने परिवर्तन सहेजें? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | नई फ़ाइल बनाने से पहले अपना वर्तमान दस्तावेज़ सहेजें। |
| `cancel_19766e` | रद्द करें |
| `discard_changes_f9bfa3` | परिवर्तन त्यागें |
| `switch_to_light_mode_bfa0ca` | हल्के मोड पर जाएँ |
| `enter_the_name_of_any_installed_font_b57a72` | किसी भी स्थापित फ़ॉन्ट का नाम दर्ज करें। |
| `loading_installed_fonts_200c74` | इंस्टॉल किए गए फ़ॉन्ट लोड हो रहे हैं… |
| `count_fixed_width_font_available_5488f8` | उपलब्ध समान-चौड़ाई वाले फ़ॉन्ट: {count} |
| `count_fixed_width_fonts_available_5df530` | उपलब्ध समान-चौड़ाई वाले फ़ॉन्ट: {count} |
| `count_variable_width_font_available_583582` | उपलब्ध अनुपाती फ़ॉन्ट: {count} |
| `count_variable_width_fonts_available_9d234c` | उपलब्ध अनुपाती फ़ॉन्ट: {count} |
| `count_match_for_query_2e77ac` | “{query}” के खोज परिणाम: {count} |
| `count_matches_for_query_7db710` | “{query}” के खोज परिणाम: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | कोई समान-चौड़ाई वाला फ़ॉन्ट "{query}" से मेल नहीं खाता। |
| `no_variable_width_fonts_match_query_a64030` | कोई अनुपाती फ़ॉन्ट "{query}" से मेल नहीं खाता। |
| `current_of_total_35d900` | {total} में से {current} |
| `current_of_total_scope_94ebe5` | {total} में से {current} · {scope} |
| `copy_code_49a005` | कोड कॉपी करें |
| `clipboard_unavailable_4ff69f` | क्लिपबोर्ड अनुपलब्ध |
| `code_copied_39868c` | कोड कॉपी किया गया |
| `could_not_copy_code_4a563f` | कोड कॉपी नहीं किया जा सका |
| `the_native_print_dialog_could_not_open_320714` | सिस्टम का प्रिंट डायलॉग नहीं खुल सका. |
| `could_not_open_the_print_dialog_4bd85a` | प्रिंट संवाद नहीं खुल सका. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | अपने सहेजे न गए परिवर्तन त्यागें और दूसरा दस्तावेज़ खोलें? |
| `could_not_open_document_69abda` | दस्तावेज़ नहीं खुल सका |
| `release_check_failed_7b2758` | संस्करण जाँच विफल रही |
| `unrecognized_release_list_62d1cb` | संस्करण सूची पहचानी नहीं गई |
| `unrecognized_version_d1b8d2` | अपरिचित संस्करण |
| `latest_version_version_d1c996` | नवीनतम संस्करण: {version} |
| `unsupported_architecture_087e4f` | असमर्थित वास्तुकला |
| `installer_verification_is_unavailable_98306d` | इंस्टॉलर सत्यापन उपलब्ध नहीं है |
| `unsupported_platform_a96892` | असमर्थित प्लेटफ़ॉर्म |
| `latest_compatible_version_version_fa3079` | नवीनतम संगत संस्करण: {version} |
| `upgrade_markdown_vision_de1b45` | Markdown Vision अपडेट करें |
| `download_macos_update_95d8f3` | macOS के लिए अपडेट डाउनलोड करें |
| `download_linux_update_707c5e` | Linux के लिए अपडेट डाउनलोड करें |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | अद्यतनों की जाँच करने में असमर्थ. अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें। |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | अपडेट डाउनलोड और सत्यापित किया जा रहा है। आपसे अपनी पहचान की पुष्टि करने के लिए कहा जा सकता है। |
| `update_installed_restart_to_use_the_new_version_bb8a43` | अद्यतन स्थापित किया गया. नए संस्करण का उपयोग करने के लिए पुनः प्रारंभ करें. |
| `update_failed_error_e4f7dc` | अद्यतन विफल: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Markdown Vision इंस्टॉलर डाउनलोड करें और चलाएं? किसी भी खुले दस्तावेज़ को पहले सहेजें। सेटअप Markdown Vision को बंद करने के लिए कह सकता है। |
| `downloading_and_verifying_update_02b3ba` | अपडेट डाउनलोड और सत्यापित किया जा रहा है… |
| `installer_started_865e10` | इंस्टॉलर प्रारंभ हुआ. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | इंस्टॉलर को डाउनलोड, सत्यापित या प्रारंभ नहीं किया जा सका. कृपया पुन: प्रयास करें। |
| `discard_unsaved_changes_and_restart_6d1602` | सहेजे न गए परिवर्तन त्यागें और पुनः प्रारंभ करें? |
| `could_not_restart_error_71e2d2` | पुनः आरंभ नहीं किया जा सका: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | इस आइटम को संपादित करने के लिए डबल-क्लिक करें या Alt+Enter दबाएँ |
| `saving_23e392` | सहेजा जा रहा है… |
| `unsaved_6250d5` | सहेजा नहीं गया |
| `saved_b5c120` | सहेजा गया |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | ड्राफ़्ट सहेजा नहीं जा सका। आपके बदलाव अभी भी संपादक में हैं। |
| `embedded_content_1bca8f` | एंबेडेड सामग्री |
| `edit_table_source_c7189f` | तालिका स्रोत संपादित करें |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | किसी सेल को संपादित करने या तालिका बदलने के लिए उसका चयन करें। टाइप करते समय Alt+Enter दबाएँ। |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | इस ब्लॉक में फ़ॉर्मेटिंग शामिल है जिसे Markdown में संपादित करने की आवश्यकता है। |
| `code_contents_5a1f26` | कोड सामग्री |
| `type_directly_to_edit_this_indented_code_block_769291` | इस इंडेंटेड कोड ब्लॉक में सीधे टाइप करके इसे संपादित करें। |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | सामग्री संपादित करने के लिए सीधे कोड ब्लॉक में टाइप करें। ब्लॉक की शुरुआत और अंत दर्शाने वाली पंक्तियों को Markdown में संपादित करें। |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | पाठ बदलने के लिए “सूची आइटम संपादित करें” चुनें। सूची का नेस्टिंग स्तर बदलने के लिए सूची को Markdown में संपादित करें। |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | सूची बदलने के लिए “सूची आइटम संपादित करें” या चेकबॉक्स का उपयोग करें। |
| `edit_list_item_text_a982e6` | सूची आइटम टेक्स्ट संपादित करें |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | सूची आइटम का पाठ सीधे संपादित करें। सूची की संरचना Markdown में संपादित करें। |
| `task_4bc74b` | कार्य |
| `edit_item_9f84ee` | सूची आइटम संपादित करें |
| `list_options_fc3320` | सूची के विकल्प |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | इस तालिका को Markdown में संपादित करने की आवश्यकता है। |
| `add_text_to_this_empty_cell_37f900` | इस खाली सेल में टेक्स्ट जोड़ें |
| `edit_this_cell_in_markdown_4304b1` | इस सेल को Markdown में संपादित करें |
| `edit_table_cell_a4212e` | तालिका सेल संपादित करें |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | इसे संपादित करने के लिए एक सेल का चयन करें। आप Markdown में अंतर्निहित तालिका को संपादित कर सकते हैं। |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | इस सेल में HTML है. इस सेल को Markdown में संपादित करें। |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | यह सेल Markdown संदर्भों का उपयोग करता है। इस सेल को Markdown में संपादित करें। |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | इस सेल को संपादित करने के लिए टाइप करें। तालिका विकल्पों के लिए Alt+Enter दबाएँ। |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | केवल सादा पाठ वाली सेल में सीधे टाइप करें। अधिक जटिल सामग्री के लिए तालिका विकल्पों का उपयोग करें या Markdown संपादित करें। |
| `table_options_cf924a` | तालिका के विकल्प |
| `edit_note_299e60` | पाद-टिप्पणी संपादित करें |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | जिस पाद-टिप्पणी का पाठ संपादित किया जा सकता है, उसके लिए “पाद-टिप्पणी संपादित करें” का उपयोग करें। |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | यह लेआउट HTML का उपयोग करता है. इसे Markdown में संपादित करें। |
| `edit_inline_code_bf93ee` | इनलाइन कोड संपादित करें |
| `edit_list_structure_in_markdown_17a222` | Markdown में सूची संरचना संपादित करें |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | सादे सूची पाठ को सीधे संपादित करें। Markdown में सूची संरचना संपादित करें। |
| `edit_code_in_table_cell_535cb9` | तालिका सेल में कोड संपादित करें |
| `edit_table_cell_text_ca30e7` | तालिका सेल टेक्स्ट संपादित करें |
| `edit_preformatted_text_9737bd` | पूर्व स्वरूपित पाठ संपादित करें |
| `edit_disclosure_title_79fb92` | विस्तार योग्य अनुभाग का शीर्षक संपादित करें |
| `edit_text_7967d9` | पाठ संपादित करें |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | सेल टेक्स्ट टाइप करें. सेल विकल्पों के लिए Alt+Enter दबाएँ। |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | पाठ को सीधे संपादित करें. Markdown में आसपास की संरचना संपादित करें। |
| `edit_structure_in_markdown_fe607e` | Markdown में संरचना संपादित करें |
| `edit_quoted_text_9de474` | उद्धृत पाठ संपादित करें |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | सादा पाठ सीधे संपादित करें। Markdown में ब्लॉक उद्धरण की संरचना संपादित करें। |
| `edit_heading_text_f3806c` | शीर्षक पाठ संपादित करें |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | शीर्षक पाठ को सीधे संपादित करें. Markdown में शीर्षक शैली संपादित करें। |
| `heading_style_c0c25b` | शीर्षक शैली |
| `edit_this_item_in_markdown_83b112` | इस आइटम को Markdown में संपादित करें |
| `markdown_only_f6e1f7` | केवल Markdown |
| `visual_only_29a136` | केवल विज़ुअल संपादक |
| `action_64cff1` | कार्रवाई |
| `apply_31e392` | लागू करें |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Markdown बदल गया। पुनः प्रयास करने के लिए इस संपादक को पुनः खोलें। |
| `edit_list_item_f69436` | सूची आइटम संपादित करें |
| `item_text_markdown_0bbe7d` | आइटम टेक्स्ट (Markdown) |
| `new_item_b84cad` | नया सूची आइटम |
| `enter_item_text_or_choose_remove_item_e4003a` | सूची आइटम का पाठ दर्ज करें या “सूची आइटम हटाएँ” चुनें। |
| `enter_item_text_82c7ea` | आइटम टेक्स्ट दर्ज करें. |
| `add_item_below_a6d694` | नीचे आइटम जोड़ें |
| `remove_item_5a89ed` | सूची आइटम हटाएँ |
| `indent_under_previous_item_2e6b03` | पिछले आइटम के अंतर्गत इंडेंट |
| `outdent_item_07e9b1` | सूची आइटम का इंडेंट घटाएँ |
| `this_item_has_no_parent_to_outdent_from_dd148a` | इस सूची आइटम का कोई उच्च-स्तरीय आइटम नहीं है, इसलिए इसका इंडेंट कम नहीं किया जा सकता। |
| `heading_b34f17` | शीर्षक |
| `edit_footnote_cdcee6` | पाद-टिप्पणी संपादित करें |
| `note_text_369e75` | पाद-टिप्पणी का पाठ |
| `enter_the_note_text_on_one_line_3a7a5a` | नोट टेक्स्ट को एक पंक्ति में दर्ज करें. |
| `cell_text_9cd173` | सेल टेक्स्ट |
| `add_row_below_3d4830` | नीचे पंक्ति जोड़ें |
| `add_column_after_38817e` | बाद में कॉलम जोड़ें |
| `new_column_editor` | नया स्तंभ |
| `remove_row_1810fd` | पंक्ति हटाएँ |
| `remove_column_9807a2` | कॉलम हटाएँ |
| `align_column_left_6d9399` | स्तंभ को बाईं ओर संरेखित करें |
| `center_column_1b9b8b` | कॉलम की सामग्री केंद्र में करें |
| `align_column_right_850a8f` | कॉलम को दाईं ओर संरेखित करें |
| `cell_text_markdown_a9e5f9` | सेल टेक्स्ट (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | लाइन ब्रेक जोड़ने से पहले इनलाइन कोड बंद करें। |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | यह सेल टेक्स्ट तालिका संरचना को बदल देगा। Markdown में विभाजक से पहले एक स्थान जोड़ें। |
| `alt_text_16f898` | वैकल्पिक पाठ |
| `link_text_markdown_9b92bd` | लिंक टेक्स्ट (Markdown) |
| `image_url_e55026` | छवि यूआरएल |
| `link_url_9dfd0b` | लिंक यूआरएल |
| `url_e7a241` | यूआरएल |
| `edit_linked_image_2f9456` | लिंक की गई छवि संपादित करें |
| `edit_image_d9d12b` | छवि संपादित करें |
| `edit_link_94026c` | लिंक संपादित करें |
| `enter_text_without_a_closing_bracket_0e7315` | समापन कोष्ठक के बिना पाठ दर्ज करें। |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | रिक्त स्थान या कोष्ठक के बिना HTTP या HTTPS URL दर्ज करें। |
| `visual_pane_height_4ad683` | विज़ुअल पैनल की ऊँचाई |
| `return_to_reader_dcd8f7` | पठन दृश्य पर लौटें |
| `number_of_columns_2_8_893663` | स्तंभों की संख्या (2-8) |
| `header_number_b79482` | कॉलम शीर्षलेख {number} |
| `cell_75fa38` | सेल |
| `open_1f1d59` | खोलें… |
| `new_18fdd5` | नया |
| `print_07c371` | प्रिंट करें… |
| `close_7d9eb7` | बंद करें |
| `file_50009c` | फ़ाइल |
| `about_markdown_vision_c6d62d` | Markdown Vision के बारे में… |
| `quit_markdown_vision_01c01b` | Markdown Vision से बाहर निकलें |
| `quit_b3eb37` | ऐप बंद करें |
| `help_b79cac` | सहायता |
| `could_not_enumerate_system_fonts_00e652` | सिस्टम फ़ॉन्ट की सूची प्राप्त नहीं की जा सकी |
| `no_system_fonts_found_a8a9af` | कोई सिस्टम फ़ॉन्ट नहीं मिला |
| `could_not_open_document_640c27` | दस्तावेज़ नहीं खोला जा सका |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | दस्तावेज़ खोला नहीं जा सका. आपके वर्तमान परिवर्तन अभी भी उपलब्ध हैं. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | अपने सहेजे न गए परिवर्तन त्यागें और Markdown Vision बंद करें? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | अपने सहेजे न गए परिवर्तन त्यागें और Markdown Vision छोड़ें? |
| `unknown_confirmation_request_feea29` | अज्ञात पुष्टिकरण अनुरोध |
| `keep_editing_624a83` | संपादन करते रहें |
| `discard_eb1a70` | त्यागें |
| `unsaved_changes_a710c2` | सहेजे न गए परिवर्तन |
| `the_document_is_no_longer_open_use_save_as_671c50` | दस्तावेज़ अब खुला नहीं है. इस रूप में सहेजें का उपयोग करें. |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | इस फ़ाइल में अलग-अलग लाइन एंडिंग हैं या यह मान्य UTF-8 में नहीं है। “इस रूप में सहेजें” का उपयोग करें। |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | प्रतीकात्मक लिंक के माध्यम से सहेजना समर्थित नहीं है। “इस रूप में सहेजें” का उपयोग करें। |
| `invalid_destination_14f03f` | अमान्य गंतव्य |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | डिस्क पर लक्ष्य फ़ाइल बदल गई है। अपने बदलाव सुरक्षित रखने के लिए “इस रूप में सहेजें” का उपयोग करें। |
| `the_update_process_failed_010689` | अद्यतन प्रक्रिया विफल रही. |
| `could_not_restore_the_open_document_69d724` | खुले दस्तावेज़ को पुनर्स्थापित नहीं किया जा सका. |
| `could_not_restart_markdown_vision_6ead36` | Markdown Vision पुनः प्रारंभ नहीं किया जा सका. |
| `restart_is_not_available_on_this_platform_998ef6` | इस प्लेटफ़ॉर्म पर पुनरारंभ उपलब्ध नहीं है. |
| `the_update_information_is_invalid_dbcffc` | अद्यतन जानकारी अमान्य है. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | स्वचालित अपडेट के लिए एक स्थापित DEB या RPM पैकेज की आवश्यकता होती है। |
| `this_architecture_is_not_supported_ae063c` | यह आर्किटेक्चर समर्थित नहीं है. |
| `could_not_identify_the_linux_distribution_18bbdb` | Linux वितरण की पहचान नहीं कर सका। |
| `the_rpm_package_manager_is_unavailable_9ce83b` | RPM पैकेज प्रबंधक अनुपलब्ध है. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision संगत RPM पैकेज के रूप में स्थापित नहीं है। |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | यह अद्यतन स्थापित पैकेज से नया नहीं है. |
| `the_debian_package_manager_is_unavailable_b5d66b` | डेबियन पैकेज मैनेजर अनुपलब्ध है। |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision DEB पैकेज के रूप में स्थापित नहीं है। |
| `could_not_determine_the_installed_version_f1a1f1` | स्थापित संस्करण निर्धारित नहीं किया जा सका. |
| `could_not_compare_package_versions_465d4e` | पैकेज संस्करणों की तुलना नहीं की जा सकी. |
| `could_not_create_a_temporary_download_folder_36407c` | अस्थायी डाउनलोड फ़ोल्डर नहीं बनाया जा सका. |
| `could_not_start_the_download_b4acf0` | डाउनलोड प्रारंभ नहीं हो सका. |
| `the_update_could_not_be_downloaded_4d6fd7` | अपडेट डाउनलोड नहीं किया जा सका. |
| `could_not_verify_the_update_2cd2c5` | अद्यतन सत्यापित नहीं किया जा सका. |
| `the_downloaded_update_failed_verification_60519b` | डाउनलोड किए गए अपडेट का सत्यापन विफल रहा। |
| `could_not_inspect_the_update_package_9812b2` | अद्यतन पैकेज़ का निरीक्षण नहीं किया जा सका. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | डाउनलोड किए गए पैकेज में अप्रत्याशित मेटाडेटा है। |
| `version_dd1679` | संस्करण |
| `could_not_start_the_system_installer_907ba2` | सिस्टम इंस्टॉलर प्रारंभ नहीं हो सका. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | इंस्टॉल करने की प्रक्रिया रद्द हो गई या विफल रही। कृपया फिर से प्रयास करें। |
| `could_not_verify_the_installed_update_04a200` | स्थापित अद्यतन को सत्यापित नहीं किया जा सका. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | इंस्टॉलर ने Markdown Vision को अपेक्षित संस्करण में अपडेट नहीं किया। |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | स्वचालित DEB अपडेट केवल Linux पर उपलब्ध हैं। |
| `invalid_preferences_bc6b57` | अमान्य प्राथमिकताएँ |
| `invalid_key_b06fe9` | अमान्य {key} |
| `unsupported_preferences_version_54734c` | असमर्थित प्राथमिकताएँ संस्करण |
| `missing_preferences_679970` | गुम प्राथमिकताएँ |
| `invalid_preferences_directory_a6f362` | अमान्य प्राथमिकता निर्देशिका |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision इस फ़ाइल को नहीं पढ़ सका। |
| `markdown_files_177420` | Markdown फ़ाइलें |
| `text_files_c5df15` | पाठ फ़ाइलें |
| `all_files_866956` | सभी फ़ाइलें |
| `save_markdown_file_813f90` | Markdown फ़ाइल सहेजें |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | यह दस्तावेज़ अब खुला नहीं है. फ़ाइल को दोबारा खोलें या इस रूप में सहेजें का उपयोग करें। |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | इस फ़ाइल की UTF-8 प्रतिलिपि बनाने के लिए “इस रूप में सहेजें” का उपयोग करें। |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | इस फ़ाइल में पंक्तियों के अंत के अलग-अलग प्रारूप हैं। एक समान प्रारूप वाली प्रति बनाने के लिए “इस रूप में सहेजें” का उपयोग करें। |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows इस रूप में सहेजें संवाद नहीं खोल सका। |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | ड्राफ्ट को UTF-8 के रूप में एन्कोड नहीं किया जा सका। |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows चयनित गंतव्य को नहीं पढ़ सका। |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | फ़ाइल डिस्क पर बदल गई है या अनुपलब्ध है. अपने संपादनों को एक अलग प्रतिलिपि में रखने के लिए इस रूप में सहेजें का उपयोग करें। |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows फ़ाइल सहेज नहीं सका. जांचें कि फ़ाइल लिखने योग्य है, या इस रूप में सहेजें का उपयोग करें। |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows सेव के दौरान मूल फ़ाइल को पुनर्स्थापित नहीं कर सका। मूल {path} पर है। |
| `the_save_request_could_not_be_completed_75cfa5` | सहेजने का अनुरोध पूरा नहीं किया जा सका. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision आपके स्थानीय ऐप डेटा फ़ोल्डर में अपनी एप्लिकेशन फ़ाइलें तैयार नहीं कर सका। |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Microsoft Edge WebView2 रनटाइम आवश्यक है। |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Markdown Vision Native सेटअप |
| `licensed_under_gpl_3_0_only_5f7e0f` | GPL-3.0-only के तहत लाइसेंस प्राप्त है |
| `this_installer_requires_windows_on_arm64_ef7f28` | इस इंस्टॉलर को ARM64 पर Windows की आवश्यकता है। |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision चल रहा है. जारी रखने से पहले किसी भी सहेजे न गए दस्तावेज़ को सहेजें। Markdown Vision बंद करें और सेटअप जारी रखें? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | सेटअप Markdown Vision बंद नहीं कर सका. इसे मैन्युअल रूप से बंद करें और सेटअप फिर से चलाएँ। |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision अभी भी चल रहा है। इसे बंद करके “पुनः प्रयास करें” चुनें, या इंस्टॉलेशन रद्द करें। |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | वर्तमान में स्थापित Markdown Vision संस्करण को हटाया जा रहा है… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | Markdown Vision का मौजूदा इंस्टॉलेशन हटाया नहीं जा सका। सेटअप Markdown Vision Native को इंस्टॉल किए बिना बंद हो जाएगा। |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | आप Windows सेटिंग में Markdown फ़ाइलों के लिए Markdown Vision को डिफ़ॉल्ट ऐप चुन सकते हैं। |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | इंस्टॉल करने के बाद Windows की डिफ़ॉल्ट ऐप सेटिंग खोलें |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision इंस्टॉल हो गया है। |
| `open_markdown_vision_when_setup_closes_8422c7` | सेटअप बंद होने पर Markdown Vision खोलें |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native इंस्टॉल नहीं किया जा सका। अधूरे इंस्टॉलेशन को पंजीकृत किए बिना सेटअप बंद हो जाएगा। |
| `markdown_document_00271f` | Markdown दस्तावेज़ |
| `markdown_vision_preview_handler_8c95f7` | Markdown Vision पूर्वावलोकन हैंडलर |
| `markdown_file_viewer_c36ee7` | Markdown फ़ाइल व्यूअर |
| `uninstall_fe1995` | अनइंस्टॉल करें |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision प्रारंभ नहीं हो सका. {error} |
| `unknown_native_method_method_cc7ca9` | अज्ञात मूल विधि: {method} |
| `text_71988c` | पाठ |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | स्तर {level} का शीर्षक |
| `normal_text_a2adc4` | सामान्य पाठ |
| `footnotes_ad6fb5` | फ़ुटनोट |
| `size_px_8d05e6` | {size} px |
| `link_text_insert_default` | लिंक का पाठ |
| `back_to_footnote_reference` | पाद-टिप्पणी के संदर्भ पर वापस जाएँ |

## Locale id

Indonesian

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Pemformatan Markdown |
| `undo_a8283a` | Urungkan |
| `redo_742739` | Ulangi |
| `bold_ctrl_b_84787d` | Tebal (Ctrl+B) |
| `bold_94fee6` | Tebal |
| `italic_ctrl_i_ccc60d` | Miring (Ctrl+I) |
| `italic_9bf37c` | Miring |
| `strikethrough_9aabbc` | Dicoret |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Ganti tingkat judul secara bergiliran (H1–H6, lalu teks biasa) |
| `cycle_heading_level_bde9c4` | Ganti tingkat judul secara bergiliran |
| `bulleted_list_ce51b3` | Daftar berpoin |
| `task_list_5d3253` | Daftar tugas |
| `numbered_list_cc62f6` | Daftar bernomor |
| `quote_eb4cde` | Kutipan |
| `inline_code_e767de` | Kode sebaris |
| `code_block_754538` | Blok kode |
| `link_a6a32d` | Tautan |
| `insert_table_67318e` | Sisipkan tabel |
| `edit_markdown_6ff388` | Sunting Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | Berkas Markdown baru (Ctrl+N) |
| `new_markdown_file_0928e9` | Berkas Markdown baru |
| `open_markdown_file_b7764a` | Buka berkas Markdown |
| `print_ctrl_p_5c4406` | Cetak (Ctrl+P) |
| `print_document_2a024b` | Cetak dokumen |
| `search_text_38d268` | Cari dalam teks |
| `settings_74a883` | Pengaturan |
| `switch_to_dark_mode_fc43ea` | Beralih ke mode gelap |
| `about_markdown_vision_08f9a5` | Tentang Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | Lisensi GNU GPLv3 |
| `version_version_a18745` | Versi {version} |
| `latest_version_checking_4bfedc` | Versi terbaru: memeriksa… |
| `update_c1c100` | Perbarui |
| `update_text_editor` | Perbarui teks |
| `keep_unchanged_editor` | Biarkan tanpa perubahan |
| `check_for_updates_f26f32` | Periksa pembaruan |
| `restart_markdown_vision_7e50f8` | Mulai ulang Markdown Vision |
| `text_search_10155f` | Pencarian teks |
| `count_match_ef9195` | {count} hasil pencarian |
| `count_matches_43682a` | {count} hasil pencarian |
| `previous_match_daa2f8` | Hasil pencarian sebelumnya |
| `next_match_825e5a` | Hasil pencarian berikutnya |
| `close_search_55656b` | Tutup pencarian |
| `close_settings_0ccfef` | Tutup pengaturan |
| `variable_width_font_0836b2` | Font dengan lebar variabel |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Ketikkan nama font atau pilih font yang diinstal. |
| `fixed_width_font_3de094` | Font dengan lebar tetap |
| `used_for_code_and_other_monospaced_text_84b6ed` | Digunakan untuk kode dan teks lain dengan lebar karakter tetap. |
| `text_size_d68761` | Ukuran teks |
| `automatic_text_size_919785` | Ukuran teks otomatis |
| `automatic_d461a4` | Otomatis |
| `line_spacing_0db45d` | Spasi baris |
| `page_width_limit_19528b` | Batas lebar halaman |
| `automatic_page_width_bd5c30` | Lebar halaman otomatis |
| `markdown_editor_da0ea6` | Penyunting Markdown |
| `editor_view_1d1833` | Tampilan editor |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown di kiri, editor visual di kanan |
| `split_0b61a1` | Bagi ↔ |
| `visual_above_markdown_a04e0f` | Editor visual di atas Markdown |
| `split_b3b924` | Bagi ↕ |
| `visual_ba3033` | Visual |
| `save_ctrl_s_4be89e` | Simpan (Ctrl+S) |
| `save_1509f5` | Simpan |
| `save_as_ctrl_shift_s_0f132a` | Simpan sebagai (Ctrl+Shift+S) |
| `save_as_a4b76a` | Simpan sebagai… |
| `markdown_source_580118` | Sumber Markdown |
| `markdown_pane_width_ab0129` | Lebar panel Markdown |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% Visual |
| `visual_editor_5665dd` | Editor visual |
| `visual_editing_restriction_d42cea` | Pembatasan pengeditan visual |
| `edit_in_markdown_165fd4` | Sunting di Markdown |
| `dismiss_48845b` | Tutup pemberitahuan |
| `count_word_1f505c` | kata {count} |
| `count_words_caab29` | kata-kata {count} |
| `approximate_word_count_7b987a` | Perkiraan jumlah kata: {count} |
| `line_line_column_column_21e9f4` | Baris {line}, kolom {column} |
| `untitled_md_2dccf8` | Tanpa judul.md |
| `save_your_changes_56dd16` | Simpan perubahan Anda? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Simpan dokumen Anda saat ini sebelum membuat file baru. |
| `cancel_19766e` | Batalkan |
| `discard_changes_f9bfa3` | Buang perubahan |
| `switch_to_light_mode_bfa0ca` | Beralih ke mode terang |
| `enter_the_name_of_any_installed_font_b57a72` | Masukkan nama font apa pun yang diinstal. |
| `loading_installed_fonts_200c74` | Memuat font yang diinstal… |
| `count_fixed_width_font_available_5488f8` | Font lebar tetap yang tersedia: {count} |
| `count_fixed_width_fonts_available_5df530` | Font lebar tetap yang tersedia: {count} |
| `count_variable_width_font_available_583582` | Font lebar variabel yang tersedia: {count} |
| `count_variable_width_fonts_available_9d234c` | Font lebar variabel yang tersedia: {count} |
| `count_match_for_query_2e77ac` | Hasil pencarian untuk “{query}”: {count} |
| `count_matches_for_query_7db710` | Hasil pencarian untuk “{query}”: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | Tidak ada font dengan lebar tetap yang cocok dengan "{query}". |
| `no_variable_width_fonts_match_query_a64030` | Tidak ada font dengan lebar variabel yang cocok dengan "{query}". |
| `current_of_total_35d900` | {current} dari {total} |
| `current_of_total_scope_94ebe5` | {current} dari {total} · {scope} |
| `copy_code_49a005` | Salin kode |
| `clipboard_unavailable_4ff69f` | Papan klip tidak tersedia |
| `code_copied_39868c` | Kode disalin |
| `could_not_copy_code_4a563f` | Tidak dapat menyalin kode |
| `the_native_print_dialog_could_not_open_320714` | Dialog cetak sistem tidak dapat dibuka. |
| `could_not_open_the_print_dialog_4bd85a` | Tidak dapat membuka dialog pencetakan. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Buang perubahan yang belum disimpan dan buka dokumen lain? |
| `could_not_open_document_69abda` | Tidak dapat membuka dokumen |
| `release_check_failed_7b2758` | Pemeriksaan versi gagal |
| `unrecognized_release_list_62d1cb` | Daftar versi tidak dikenali |
| `unrecognized_version_d1b8d2` | Versi tidak dikenal |
| `latest_version_version_d1c996` | Versi terbaru: {version} |
| `unsupported_architecture_087e4f` | Arsitektur tidak didukung |
| `installer_verification_is_unavailable_98306d` | Verifikasi integritas paket pemasangan tidak tersedia. |
| `unsupported_platform_a96892` | Platform tidak didukung |
| `latest_compatible_version_version_fa3079` | Versi terbaru yang kompatibel: {version} |
| `upgrade_markdown_vision_de1b45` | Perbarui Markdown Vision |
| `download_macos_update_95d8f3` | Unduh pembaruan untuk macOS |
| `download_linux_update_707c5e` | Unduh pembaruan untuk Linux |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Tidak dapat memeriksa pembaruan. Periksa koneksi internet Anda dan coba lagi. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Mengunduh dan memverifikasi pembaruan. Anda mungkin diminta untuk mengautentikasi. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Pembaruan diinstal. Mulai ulang untuk menggunakan versi baru. |
| `update_failed_error_e4f7dc` | Pembaruan gagal: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Unduh dan jalankan penginstal Markdown Vision? Simpan semua dokumen yang terbuka terlebih dahulu. Penyiapan mungkin meminta untuk menutup Markdown Vision. |
| `downloading_and_verifying_update_02b3ba` | Mengunduh dan memverifikasi pembaruan… |
| `installer_started_865e10` | Penginstal dimulai. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Tidak dapat mengunduh, memverifikasi, atau memulai penginstal. Silakan coba lagi. |
| `discard_unsaved_changes_and_restart_6d1602` | Buang perubahan yang belum disimpan dan mulai ulang? |
| `could_not_restart_error_71e2d2` | Tidak dapat memulai ulang: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Klik dua kali atau tekan Alt+Enter untuk mengedit item ini |
| `saving_23e392` | Menyimpan… |
| `unsaved_6250d5` | Belum disimpan |
| `saved_b5c120` | Disimpan |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Draf tidak dapat disimpan. Perubahan Anda masih ada di editor. |
| `embedded_content_1bca8f` | Konten yang disematkan |
| `edit_table_source_c7189f` | Sunting sumber tabel |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Pilih sel untuk mengeditnya atau mengubah tabel. Tekan Alt+Enter saat mengetik. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Blok ini berisi format yang perlu diedit di Markdown. |
| `code_contents_5a1f26` | Isi kode |
| `type_directly_to_edit_this_indented_code_block_769291` | Ketik langsung di dalam blok kode berindentasi ini untuk mengeditnya. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Ketik langsung di dalam blok kode untuk mengedit isinya. Gunakan Markdown untuk mengedit baris yang menandai awal dan akhir blok. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Gunakan “Sunting item daftar” untuk mengubah teks. Untuk mengubah tingkat inden, sunting daftar dalam Markdown. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Gunakan “Sunting item daftar” atau kotak centang untuk mengubah daftar. |
| `edit_list_item_text_a982e6` | Sunting teks item daftar |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Sunting teks item secara langsung. Sunting struktur daftar di Markdown. |
| `task_4bc74b` | Tugas |
| `edit_item_9f84ee` | Sunting item daftar |
| `list_options_fc3320` | Opsi daftar |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Tabel ini perlu diedit di Markdown. |
| `add_text_to_this_empty_cell_37f900` | Tambahkan teks ke sel kosong ini |
| `edit_this_cell_in_markdown_4304b1` | Sunting sel ini di Markdown |
| `edit_table_cell_a4212e` | Sunting sel tabel |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Pilih sel untuk mengeditnya. Anda dapat mengedit tabel sumber di Markdown. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Sel ini berisi HTML. Sunting sel ini di Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | Sel ini menggunakan referensi Markdown. Sunting sel ini di Markdown. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Ketik untuk mengedit sel ini. Tekan Alt+Enter untuk opsi tabel. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Ketik langsung di sel yang hanya berisi teks biasa. Gunakan opsi tabel atau edit Markdown untuk konten yang lebih kompleks. |
| `table_options_cf924a` | Opsi tabel |
| `edit_note_299e60` | Sunting catatan |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Gunakan “Sunting catatan” untuk mengubah teks catatan kaki yang dapat diedit. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | Tata letak ini menggunakan HTML. Sunting di Markdown. |
| `edit_inline_code_bf93ee` | Sunting kode sebaris |
| `edit_list_structure_in_markdown_17a222` | Sunting struktur daftar di Markdown |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Sunting teks daftar biasa secara langsung. Sunting struktur daftar di Markdown. |
| `edit_code_in_table_cell_535cb9` | Sunting kode di sel tabel |
| `edit_table_cell_text_ca30e7` | Sunting teks sel tabel |
| `edit_preformatted_text_9737bd` | Sunting teks yang telah diformat sebelumnya |
| `edit_disclosure_title_79fb92` | Sunting judul bagian yang dapat diperluas |
| `edit_text_7967d9` | Sunting teks |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Ketikkan teks sel. Tekan Alt+Enter untuk opsi sel. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Sunting teks secara langsung. Sunting struktur sekitarnya di Markdown. |
| `edit_structure_in_markdown_fe607e` | Sunting struktur di Markdown |
| `edit_quoted_text_9de474` | Sunting teks yang dikutip |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Sunting teks biasa secara langsung. Sunting struktur kutipan blok di Markdown. |
| `edit_heading_text_f3806c` | Sunting teks judul |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Sunting teks judul secara langsung. Sunting gaya judul di Markdown. |
| `heading_style_c0c25b` | Gaya judul |
| `edit_this_item_in_markdown_83b112` | Sunting item ini di Markdown |
| `markdown_only_f6e1f7` | Hanya Markdown |
| `visual_only_29a136` | Hanya editor visual |
| `action_64cff1` | Tindakan |
| `apply_31e392` | Terapkan |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Markdown berubah. Buka kembali editor ini untuk mencoba lagi. |
| `edit_list_item_f69436` | Sunting item daftar |
| `item_text_markdown_0bbe7d` | Teks item (Markdown) |
| `new_item_b84cad` | Item daftar baru |
| `enter_item_text_or_choose_remove_item_e4003a` | Masukkan teks item daftar atau pilih “Hapus item daftar”. |
| `enter_item_text_82c7ea` | Masukkan teks item. |
| `add_item_below_a6d694` | Tambahkan item di bawah |
| `remove_item_5a89ed` | Hapus item daftar |
| `indent_under_previous_item_2e6b03` | Indentasi di bawah item sebelumnya |
| `outdent_item_07e9b1` | Kurangi inden item daftar |
| `this_item_has_no_parent_to_outdent_from_dd148a` | Item ini tidak memiliki item induk, sehingga indentasinya tidak dapat dikurangi. |
| `heading_b34f17` | Judul |
| `edit_footnote_cdcee6` | Sunting catatan kaki |
| `note_text_369e75` | Teks catatan kaki |
| `enter_the_note_text_on_one_line_3a7a5a` | Masukkan teks catatan dalam satu baris. |
| `cell_text_9cd173` | Teks sel |
| `add_row_below_3d4830` | Tambahkan baris di bawah |
| `add_column_after_38817e` | Tambahkan kolom setelahnya |
| `new_column_editor` | Kolom baru |
| `remove_row_1810fd` | Hapus baris |
| `remove_column_9807a2` | Hapus kolom |
| `align_column_left_6d9399` | Sejajarkan kolom ke kiri |
| `center_column_1b9b8b` | Ratakan isi kolom ke tengah |
| `align_column_right_850a8f` | Sejajarkan kolom ke kanan |
| `cell_text_markdown_a9e5f9` | Teks sel (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Tutup kode sebaris sebelum menambahkan jeda baris. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Teks sel ini akan mengubah struktur tabel. Tambahkan spasi sebelum pemisah di Markdown. |
| `alt_text_16f898` | Teks alternatif |
| `link_text_markdown_9b92bd` | Teks tautan (Markdown) |
| `image_url_e55026` | URL gambar |
| `link_url_9dfd0b` | URL tautan |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | Sunting gambar tertaut |
| `edit_image_d9d12b` | Sunting gambar |
| `edit_link_94026c` | Sunting tautan |
| `enter_text_without_a_closing_bracket_0e7315` | Masukkan teks tanpa tanda kurung tutup. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Masukkan URL HTTP atau HTTPS tanpa spasi atau tanda kurung. |
| `visual_pane_height_4ad683` | Tinggi panel visual |
| `return_to_reader_dcd8f7` | Kembali ke tampilan baca |
| `number_of_columns_2_8_893663` | Jumlah kolom (2–8) |
| `header_number_b79482` | Judul kolom {number} |
| `cell_75fa38` | Sel |
| `open_1f1d59` | Buka… |
| `new_18fdd5` | Baru |
| `print_07c371` | Cetak… |
| `close_7d9eb7` | Tutup |
| `file_50009c` | Berkas |
| `about_markdown_vision_c6d62d` | Tentang Markdown Vision… |
| `quit_markdown_vision_01c01b` | Keluar dari Markdown Vision |
| `quit_b3eb37` | Keluar |
| `help_b79cac` | Bantuan |
| `could_not_enumerate_system_fonts_00e652` | Tidak dapat memperoleh daftar font sistem |
| `no_system_fonts_found_a8a9af` | Tidak ada font sistem yang ditemukan |
| `could_not_open_document_640c27` | Tidak dapat membuka dokumen |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | Dokumen itu tidak dapat dibuka. Perubahan Anda saat ini masih tersedia. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Buang perubahan Anda yang belum disimpan dan tutup Markdown Vision? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Buang perubahan Anda yang belum disimpan dan keluar dari Markdown Vision? |
| `unknown_confirmation_request_feea29` | Permintaan konfirmasi tidak diketahui |
| `keep_editing_624a83` | Lanjutkan pengeditan |
| `discard_eb1a70` | Buang |
| `unsaved_changes_a710c2` | Perubahan yang belum disimpan |
| `the_document_is_no_longer_open_use_save_as_671c50` | Dokumen tidak lagi terbuka. Gunakan “Simpan sebagai”. |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Berkas ini memiliki akhiran baris yang berbeda-beda atau pengodean UTF-8 yang tidak valid. Gunakan “Simpan sebagai”. |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | Menyimpan melalui tautan simbolis tidak didukung. Gunakan “Simpan sebagai”. |
| `invalid_destination_14f03f` | Tujuan tidak valid |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | Berkas tujuan telah berubah di disk. Gunakan “Simpan sebagai” untuk mempertahankan perubahan Anda. |
| `the_update_process_failed_010689` | Proses pembaruan gagal. |
| `could_not_restore_the_open_document_69d724` | Tidak dapat memulihkan dokumen yang terbuka. |
| `could_not_restart_markdown_vision_6ead36` | Tidak dapat memulai ulang Markdown Vision. |
| `restart_is_not_available_on_this_platform_998ef6` | Mulai ulang tidak tersedia di platform ini. |
| `the_update_information_is_invalid_dbcffc` | Informasi pembaruan tidak valid. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Pembaruan otomatis memerlukan paket DEB atau RPM yang diinstal. |
| `this_architecture_is_not_supported_ae063c` | Arsitektur ini tidak didukung. |
| `could_not_identify_the_linux_distribution_18bbdb` | Tidak dapat mengidentifikasi distribusi Linux. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | Manajer paket RPM tidak tersedia. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision tidak diinstal sebagai paket RPM yang kompatibel. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Pembaruan ini tidak lebih baru dari paket yang diinstal. |
| `the_debian_package_manager_is_unavailable_b5d66b` | Manajer paket Debian tidak tersedia. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision tidak diinstal sebagai paket DEB. |
| `could_not_determine_the_installed_version_f1a1f1` | Tidak dapat menentukan versi yang diinstal. |
| `could_not_compare_package_versions_465d4e` | Tidak dapat membandingkan versi paket. |
| `could_not_create_a_temporary_download_folder_36407c` | Tidak dapat membuat folder unduhan sementara. |
| `could_not_start_the_download_b4acf0` | Tidak dapat memulai pengunduhan. |
| `the_update_could_not_be_downloaded_4d6fd7` | Pembaruan tidak dapat diunduh. |
| `could_not_verify_the_update_2cd2c5` | Tidak dapat memverifikasi pembaruan. |
| `the_downloaded_update_failed_verification_60519b` | Pembaruan yang diunduh gagal verifikasi. |
| `could_not_inspect_the_update_package_9812b2` | Tidak dapat memeriksa paket pembaruan. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | Paket yang diunduh memiliki metadata yang tidak terduga. |
| `version_dd1679` | Versi |
| `could_not_start_the_system_installer_907ba2` | Tidak dapat memulai penginstal sistem. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | Instalasi dibatalkan atau gagal. Silakan coba lagi. |
| `could_not_verify_the_installed_update_04a200` | Tidak dapat memverifikasi pembaruan yang diinstal. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | Penginstal tidak memperbarui Markdown Vision ke versi yang diharapkan. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Pembaruan DEB otomatis hanya tersedia di Linux. |
| `invalid_preferences_bc6b57` | Preferensi tidak valid |
| `invalid_key_b06fe9` | {key} tidak valid |
| `unsupported_preferences_version_54734c` | Versi preferensi tidak didukung |
| `missing_preferences_679970` | Preferensi tidak ada |
| `invalid_preferences_directory_a6f362` | Direktori preferensi tidak valid |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision tidak dapat membaca file ini. |
| `markdown_files_177420` | Berkas Markdown |
| `text_files_c5df15` | File teks |
| `all_files_866956` | Semua file |
| `save_markdown_file_813f90` | Simpan berkas Markdown |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Dokumen ini tidak lagi terbuka. Buka kembali file atau gunakan Simpan Sebagai. |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Gunakan “Simpan sebagai” untuk membuat salinan UTF-8 dari berkas ini. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | Berkas ini menggunakan akhiran baris yang berbeda-beda. Gunakan “Simpan sebagai” untuk membuat salinan dengan akhiran baris yang konsisten. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows tidak dapat membuka dialog Simpan Sebagai. |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | Draf tidak dapat dikodekan sebagai UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows tidak dapat membaca tujuan yang dipilih. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | File diubah pada disk atau tidak tersedia. Gunakan Simpan Sebagai untuk menyimpan hasil edit Anda dalam salinan terpisah. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows tidak dapat menyimpan berkas. Periksa apakah berkas dapat ditulis, atau gunakan “Simpan sebagai”. |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows tidak dapat mengembalikan file asli selama penyimpanan. Yang asli ada di {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | Permintaan penyimpanan tidak dapat diselesaikan. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision tidak dapat menyiapkan file aplikasinya di folder data aplikasi lokal Anda. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Microsoft Edge WebView2 Runtime diperlukan. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Pemasang Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | Berlisensi di bawah GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | Penginstal ini memerlukan Windows di ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision sedang berjalan. Simpan semua dokumen yang belum disimpan sebelum melanjutkan. Tutup Markdown Vision dan lanjutkan penyiapan? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | Penginstal tidak dapat menutup Markdown Vision. Tutup secara manual dan jalankan penginstal lagi. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision masih berjalan. Tutup aplikasi dan pilih Coba lagi, atau batalkan pemasangan. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Menghapus edisi Markdown Vision yang saat ini diinstal… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | Pemasangan Markdown Vision yang ada tidak dapat dihapus. Pemasang akan berhenti tanpa memasang Markdown Vision Native. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | Anda dapat memilih Markdown Vision sebagai aplikasi bawaan untuk berkas Markdown di Pengaturan Windows. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Buka pengaturan aplikasi bawaan Windows setelah pemasangan |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision telah dipasang. |
| `open_markdown_vision_when_setup_closes_8422c7` | Buka Markdown Vision saat penginstal ditutup |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native tidak dapat dipasang. Pemasang akan berhenti tanpa mendaftarkan pemasangan yang tidak lengkap. |
| `markdown_document_00271f` | Dokumen Markdown |
| `markdown_vision_preview_handler_8c95f7` | Pengendali Pratinjau Markdown Vision |
| `markdown_file_viewer_c36ee7` | Penampil berkas Markdown |
| `uninstall_fe1995` | Copot pemasangan |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision tidak dapat memulai. {error} |
| `unknown_native_method_method_cc7ca9` | Metode asli tidak diketahui: {method} |
| `text_71988c` | Teks |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | Judul {level} |
| `normal_text_a2adc4` | Teks biasa |
| `footnotes_ad6fb5` | Catatan kaki |
| `size_px_8d05e6` | {size} piksel |
| `link_text_insert_default` | teks tautan |
| `back_to_footnote_reference` | Kembali ke rujukan catatan kaki |

## Locale it

Italian

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Formattazione Markdown |
| `undo_a8283a` | Annulla |
| `redo_742739` | Ripeti |
| `bold_ctrl_b_84787d` | Grassetto (Ctrl+B) |
| `bold_94fee6` | Grassetto |
| `italic_ctrl_i_ccc60d` | Corsivo (Ctrl+I) |
| `italic_9bf37c` | Corsivo |
| `strikethrough_9aabbc` | Barrato |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Scorri i livelli di intestazione (H1–H6, poi testo normale) |
| `cycle_heading_level_bde9c4` | Scorri i livelli di intestazione |
| `bulleted_list_ce51b3` | Elenco puntato |
| `task_list_5d3253` | Elenco attività |
| `numbered_list_cc62f6` | Elenco numerato |
| `quote_eb4cde` | Citazione |
| `inline_code_e767de` | Codice in linea |
| `code_block_754538` | Blocco di codice |
| `link_a6a32d` | Collegamento |
| `insert_table_67318e` | Inserisci tabella |
| `edit_markdown_6ff388` | Modifica Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | Nuovo file Markdown (Ctrl+N) |
| `new_markdown_file_0928e9` | Nuovo file Markdown |
| `open_markdown_file_b7764a` | Apri il file Markdown |
| `print_ctrl_p_5c4406` | Stampa (Ctrl+P) |
| `print_document_2a024b` | Stampa documento |
| `search_text_38d268` | Cerca nel testo |
| `settings_74a883` | Impostazioni |
| `switch_to_dark_mode_fc43ea` | Passa alla modalità oscura |
| `about_markdown_vision_08f9a5` | Informazioni su Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | Licenza GNU GPLv3 |
| `version_version_a18745` | Versione {version} |
| `latest_version_checking_4bfedc` | Ultima versione: controllo… |
| `update_c1c100` | Aggiorna |
| `update_text_editor` | Aggiorna testo |
| `keep_unchanged_editor` | Lascia invariato |
| `check_for_updates_f26f32` | Controlla gli aggiornamenti |
| `restart_markdown_vision_7e50f8` | Riavvia Markdown Vision |
| `text_search_10155f` | Ricerca nel testo |
| `count_match_ef9195` | {count} risultato della ricerca |
| `count_matches_43682a` | {count} risultati della ricerca |
| `previous_match_daa2f8` | Risultato precedente |
| `next_match_825e5a` | Risultato successivo |
| `close_search_55656b` | Chiudi la ricerca |
| `close_settings_0ccfef` | Chiudi le impostazioni |
| `variable_width_font_0836b2` | Font proporzionale |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Digita il nome di un font o scegli un font installato. |
| `fixed_width_font_3de094` | Font a larghezza fissa |
| `used_for_code_and_other_monospaced_text_84b6ed` | Utilizzato per il codice e altro testo a larghezza fissa. |
| `text_size_d68761` | Dimensione del testo |
| `automatic_text_size_919785` | Dimensione automatica del testo |
| `automatic_d461a4` | Automatico |
| `line_spacing_0db45d` | Interlinea |
| `page_width_limit_19528b` | Limite di larghezza della pagina |
| `automatic_page_width_bd5c30` | Larghezza pagina automatica |
| `markdown_editor_da0ea6` | Editor Markdown |
| `editor_view_1d1833` | Vista di modifica |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown a sinistra, editor visuale a destra |
| `split_0b61a1` | Dividi ↔ |
| `visual_above_markdown_a04e0f` | Editor visuale sopra Markdown |
| `split_b3b924` | Dividi ↕ |
| `visual_ba3033` | Visuale |
| `save_ctrl_s_4be89e` | Salva (Ctrl+S) |
| `save_1509f5` | Salva |
| `save_as_ctrl_shift_s_0f132a` | Salva con nome (Ctrl+Shift+S) |
| `save_as_a4b76a` | Salva con nome… |
| `markdown_source_580118` | Sorgente Markdown |
| `markdown_pane_width_ab0129` | Larghezza del riquadro Markdown |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% visuale |
| `visual_editor_5665dd` | Editor visuale |
| `visual_editing_restriction_d42cea` | Restrizione alla modifica visiva |
| `edit_in_markdown_165fd4` | Modifica in Markdown |
| `dismiss_48845b` | Chiudi avviso |
| `count_word_1f505c` | Parola {count} |
| `count_words_caab29` | Parole {count} |
| `approximate_word_count_7b987a` | Numero approssimativo di parole: {count} |
| `line_line_column_column_21e9f4` | Riga {line}, colonna {column} |
| `untitled_md_2dccf8` | Senza titolo.md |
| `save_your_changes_56dd16` | Vuoi salvare le modifiche? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Salva il documento corrente prima di creare un nuovo file. |
| `cancel_19766e` | Annulla |
| `discard_changes_f9bfa3` | Scarta modifiche |
| `switch_to_light_mode_bfa0ca` | Passa alla modalità chiara |
| `enter_the_name_of_any_installed_font_b57a72` | Digita il nome di un font installato. |
| `loading_installed_fonts_200c74` | Caricamento dei font installati… |
| `count_fixed_width_font_available_5488f8` | Font a larghezza fissa disponibili: {count} |
| `count_fixed_width_fonts_available_5df530` | Font a larghezza fissa disponibili: {count} |
| `count_variable_width_font_available_583582` | Font proporzionali disponibili: {count} |
| `count_variable_width_fonts_available_9d234c` | Font proporzionali disponibili: {count} |
| `count_match_for_query_2e77ac` | Risultati per «{query}»: {count} |
| `count_matches_for_query_7db710` | Risultati per «{query}»: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | Nessun font a larghezza fissa corrisponde a "{query}". |
| `no_variable_width_fonts_match_query_a64030` | Nessun font proporzionale corrisponde a "{query}". |
| `current_of_total_35d900` | {current} di {total} |
| `current_of_total_scope_94ebe5` | {current} di {total} · {scope} |
| `copy_code_49a005` | Copia il codice |
| `clipboard_unavailable_4ff69f` | Appunti non disponibili |
| `code_copied_39868c` | Codice copiato |
| `could_not_copy_code_4a563f` | Impossibile copiare il codice |
| `the_native_print_dialog_could_not_open_320714` | Impossibile aprire la finestra di dialogo di stampa del sistema. |
| `could_not_open_the_print_dialog_4bd85a` | Impossibile aprire la finestra di dialogo di stampa. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Eliminare le modifiche non salvate e aprire un altro documento? |
| `could_not_open_document_69abda` | Impossibile aprire il documento |
| `release_check_failed_7b2758` | Controllo della versione non riuscito |
| `unrecognized_release_list_62d1cb` | Elenco delle versioni non riconosciuto |
| `unrecognized_version_d1b8d2` | Versione non riconosciuta |
| `latest_version_version_d1c996` | Ultima versione: {version} |
| `unsupported_architecture_087e4f` | Architettura non supportata |
| `installer_verification_is_unavailable_98306d` | Non è possibile verificare l'integrità del programma di installazione. |
| `unsupported_platform_a96892` | Piattaforma non supportata |
| `latest_compatible_version_version_fa3079` | Ultima versione compatibile: {version} |
| `upgrade_markdown_vision_de1b45` | Aggiorna Markdown Vision |
| `download_macos_update_95d8f3` | Scarica l'aggiornamento macOS |
| `download_linux_update_707c5e` | Scarica l'aggiornamento Linux |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Impossibile controllare gli aggiornamenti. Controlla la connessione Internet e riprova. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Download e verifica dell'aggiornamento. Potrebbe esserti chiesto di autenticarti. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Aggiornamento installato. Riavvia per utilizzare la nuova versione. |
| `update_failed_error_e4f7dc` | Aggiornamento non riuscito: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Scaricare ed eseguire il programma di installazione Markdown Vision? Salvare prima tutti i documenti aperti. Il programma di installazione potrebbe chiedere di chiudere Markdown Vision. |
| `downloading_and_verifying_update_02b3ba` | Download e verifica dell'aggiornamento… |
| `installer_started_865e10` | Avviato il programma di installazione. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Impossibile scaricare, verificare o avviare il programma di installazione. Per favore riprova. |
| `discard_unsaved_changes_and_restart_6d1602` | Eliminare le modifiche non salvate e riavviare? |
| `could_not_restart_error_71e2d2` | Impossibile riavviare: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Fai doppio clic o premi Alt+Enter per modificare questa voce |
| `saving_23e392` | Salvataggio in corso… |
| `unsaved_6250d5` | Non salvato |
| `saved_b5c120` | Salvato |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Impossibile salvare la bozza. Le modifiche sono ancora nell’editor. |
| `embedded_content_1bca8f` | Contenuto incorporato |
| `edit_table_source_c7189f` | Modifica origine tabella |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Seleziona una cella per modificarla o cambiare la tabella. Premi Alt+Enter durante la digitazione. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Questo blocco contiene la formattazione che deve essere modificata in Markdown. |
| `code_contents_5a1f26` | Contenuto del codice |
| `type_directly_to_edit_this_indented_code_block_769291` | Digita direttamente in questo blocco di codice rientrato per modificarlo. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Digita direttamente nel blocco di codice per modificarne il contenuto. Usa Markdown per modificare le righe che ne segnano l'inizio e la fine. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Usa «Modifica la voce di elenco» per cambiare il testo. Per cambiare il livello di annidamento, modifica l’elenco in Markdown. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Usa «Modifica la voce di elenco» o le caselle di spunta per cambiare l’elenco. |
| `edit_list_item_text_a982e6` | Modifica il testo dell'elemento dell'elenco |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Modifica direttamente il testo dell'elemento. Modifica la struttura dell'elenco in Markdown. |
| `task_4bc74b` | Compito |
| `edit_item_9f84ee` | Modifica la voce di elenco |
| `list_options_fc3320` | Opzioni dell’elenco |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Questa tabella deve essere modificata in Markdown. |
| `add_text_to_this_empty_cell_37f900` | Aggiungi testo a questa cella vuota |
| `edit_this_cell_in_markdown_4304b1` | Modifica questa cella in Markdown |
| `edit_table_cell_a4212e` | Modifica la cella della tabella |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Seleziona una cella per modificarla. È possibile modificare la tabella sottostante in Markdown. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Questa cella contiene HTML. Modifica questa cella in Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | Questa cella utilizza i riferimenti Markdown. Modifica questa cella in Markdown. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Digita per modificare questa cella. Premi Alt+Enter per visualizzare le opzioni della tabella. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Digita direttamente nelle celle che contengono solo testo semplice. Per contenuti più complessi, utilizza le opzioni della tabella o modifica Markdown. |
| `table_options_cf924a` | Opzioni della tabella |
| `edit_note_299e60` | Modifica nota |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Usa «Modifica nota» per cambiare il testo modificabile della nota a piè di pagina. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | Questo layout utilizza HTML. Modificalo in Markdown. |
| `edit_inline_code_bf93ee` | Modifica il codice in linea |
| `edit_list_structure_in_markdown_17a222` | Modifica la struttura dell'elenco in Markdown |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Modifica direttamente il testo dell'elenco semplice. Modifica la struttura dell'elenco in Markdown. |
| `edit_code_in_table_cell_535cb9` | Modifica il codice nella cella della tabella |
| `edit_table_cell_text_ca30e7` | Modifica il testo della cella della tabella |
| `edit_preformatted_text_9737bd` | Modifica testo preformattato |
| `edit_disclosure_title_79fb92` | Modifica il titolo della sezione espandibile |
| `edit_text_7967d9` | Modifica testo |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Digita il testo della cella. Premi Alt+Enter per le opzioni della cella. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Modifica direttamente il testo. Modifica la struttura circostante in Markdown. |
| `edit_structure_in_markdown_fe607e` | Modifica la struttura in Markdown |
| `edit_quoted_text_9de474` | Modifica il testo citato |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Modifica direttamente il testo semplice. Modifica la struttura della citazione a blocco in Markdown. |
| `edit_heading_text_f3806c` | Modifica il testo dell'intestazione |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Modifica direttamente il testo dell'intestazione. Modifica lo stile dell'intestazione in Markdown. |
| `heading_style_c0c25b` | Stile di intestazione |
| `edit_this_item_in_markdown_83b112` | Modifica questo elemento in Markdown |
| `markdown_only_f6e1f7` | Solo Markdown |
| `visual_only_29a136` | Solo editor visuale |
| `action_64cff1` | Azione |
| `apply_31e392` | Applica |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Il testo Markdown è cambiato. Riapri questo editor per riprovare. |
| `edit_list_item_f69436` | Modifica la voce di elenco |
| `item_text_markdown_0bbe7d` | Testo dell'elemento (Markdown) |
| `new_item_b84cad` | Nuova voce di elenco |
| `enter_item_text_or_choose_remove_item_e4003a` | Inserisci il testo della voce o scegli “Rimuovi voce”. |
| `enter_item_text_82c7ea` | Inserisci il testo dell'elemento. |
| `add_item_below_a6d694` | Aggiungi un elemento sotto |
| `remove_item_5a89ed` | Rimuovi voce |
| `indent_under_previous_item_2e6b03` | Rientra sotto la voce precedente |
| `outdent_item_07e9b1` | Riduci il rientro della voce |
| `this_item_has_no_parent_to_outdent_from_dd148a` | Questo elemento non ha un elemento superiore, quindi non è possibile ridurne il rientro. |
| `heading_b34f17` | Intestazione |
| `edit_footnote_cdcee6` | Modifica nota a piè di pagina |
| `note_text_369e75` | Testo della nota a piè di pagina |
| `enter_the_note_text_on_one_line_3a7a5a` | Inserisci il testo della nota su una riga. |
| `cell_text_9cd173` | Testo della cella |
| `add_row_below_3d4830` | Aggiungi la riga qui sotto |
| `add_column_after_38817e` | Aggiungi colonna dopo |
| `new_column_editor` | Nuova colonna |
| `remove_row_1810fd` | Rimuovi riga |
| `remove_column_9807a2` | Rimuovi colonna |
| `align_column_left_6d9399` | Allinea la colonna a sinistra |
| `center_column_1b9b8b` | Centra il contenuto della colonna |
| `align_column_right_850a8f` | Allinea la colonna a destra |
| `cell_text_markdown_a9e5f9` | Testo cella (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Chiudi il codice in linea prima di aggiungere un'interruzione di riga. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Questo testo della cella cambierebbe la struttura della tabella. Aggiungi uno spazio prima del separatore in Markdown. |
| `alt_text_16f898` | Testo alternativo |
| `link_text_markdown_9b92bd` | Testo del collegamento (Markdown) |
| `image_url_e55026` | URL dell'immagine |
| `link_url_9dfd0b` | URL di collegamento |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | Modifica l'immagine collegata |
| `edit_image_d9d12b` | Modifica immagine |
| `edit_link_94026c` | Modifica collegamento |
| `enter_text_without_a_closing_bracket_0e7315` | Inserisci il testo senza parentesi di chiusura. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Inserisci un URL HTTP o HTTPS senza spazi o parentesi. |
| `visual_pane_height_4ad683` | Altezza del riquadro visuale |
| `return_to_reader_dcd8f7` | Torna alla vista di lettura |
| `number_of_columns_2_8_893663` | Numero di colonne (2–8) |
| `header_number_b79482` | Intestazione della colonna {number} |
| `cell_75fa38` | Cella |
| `open_1f1d59` | Apri… |
| `new_18fdd5` | Nuovo |
| `print_07c371` | Stampa… |
| `close_7d9eb7` | Chiudi |
| `file_50009c` | File |
| `about_markdown_vision_c6d62d` | Informazioni su Markdown Vision… |
| `quit_markdown_vision_01c01b` | Esci da Markdown Vision |
| `quit_b3eb37` | Esci |
| `help_b79cac` | Aiuto |
| `could_not_enumerate_system_fonts_00e652` | Impossibile elencare i font di sistema |
| `no_system_fonts_found_a8a9af` | Nessun font di sistema trovato |
| `could_not_open_document_640c27` | Impossibile aprire il documento |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | Impossibile aprire il documento. Le modifiche attuali sono ancora disponibili. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Eliminare le modifiche non salvate e chiudere Markdown Vision? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Eliminare le modifiche non salvate ed uscire da Markdown Vision? |
| `unknown_confirmation_request_feea29` | Richiesta di conferma sconosciuta |
| `keep_editing_624a83` | Continua a modificare |
| `discard_eb1a70` | Scarta |
| `unsaved_changes_a710c2` | Modifiche non salvate |
| `the_document_is_no_longer_open_use_save_as_671c50` | Il documento non è più aperto. Utilizza «Salva con nome». |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Questo file contiene terminazioni di riga diverse o una codifica UTF-8 non valida. Utilizza «Salva con nome». |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | Il salvataggio tramite un collegamento simbolico non è supportato. Utilizza «Salva con nome». |
| `invalid_destination_14f03f` | Destinazione non valida |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | Il file di destinazione è cambiato sul disco. Usa «Salva con nome» per conservare le modifiche. |
| `the_update_process_failed_010689` | Il processo di aggiornamento non è riuscito. |
| `could_not_restore_the_open_document_69d724` | Impossibile ripristinare il documento aperto. |
| `could_not_restart_markdown_vision_6ead36` | Impossibile riavviare Markdown Vision. |
| `restart_is_not_available_on_this_platform_998ef6` | Il riavvio non è disponibile su questa piattaforma. |
| `the_update_information_is_invalid_dbcffc` | Le informazioni sull'aggiornamento non sono valide. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Gli aggiornamenti automatici richiedono un pacchetto DEB o RPM installato. |
| `this_architecture_is_not_supported_ae063c` | Questa architettura non è supportata. |
| `could_not_identify_the_linux_distribution_18bbdb` | Impossibile identificare la distribuzione Linux. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | Il gestore pacchetti RPM non è disponibile. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision non è installato come pacchetto RPM compatibile. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Questo aggiornamento non è più recente del pacchetto installato. |
| `the_debian_package_manager_is_unavailable_b5d66b` | Il gestore pacchetti Debian non è disponibile. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision non è installato come pacchetto DEB. |
| `could_not_determine_the_installed_version_f1a1f1` | Impossibile determinare la versione installata. |
| `could_not_compare_package_versions_465d4e` | Impossibile confrontare le versioni del pacchetto. |
| `could_not_create_a_temporary_download_folder_36407c` | Impossibile creare una cartella di download temporanea. |
| `could_not_start_the_download_b4acf0` | Impossibile avviare il download. |
| `the_update_could_not_be_downloaded_4d6fd7` | Impossibile scaricare l'aggiornamento. |
| `could_not_verify_the_update_2cd2c5` | Impossibile verificare l'aggiornamento. |
| `the_downloaded_update_failed_verification_60519b` | L'aggiornamento scaricato non ha superato la verifica. |
| `could_not_inspect_the_update_package_9812b2` | Impossibile controllare il pacchetto di aggiornamento. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | Il pacchetto scaricato contiene metadati imprevisti. |
| `version_dd1679` | Versione |
| `could_not_start_the_system_installer_907ba2` | Impossibile avviare il programma di installazione del sistema. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | L'installazione è stata annullata o non è riuscita. Per favore riprova. |
| `could_not_verify_the_installed_update_04a200` | Impossibile verificare l'aggiornamento installato. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | Il programma di installazione non ha aggiornato Markdown Vision alla versione prevista. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Gli aggiornamenti DEB automatici sono disponibili solo su Linux. |
| `invalid_preferences_bc6b57` | Preferenze non valide |
| `invalid_key_b06fe9` | {key} non valido |
| `unsupported_preferences_version_54734c` | Versione delle preferenze non supportata |
| `missing_preferences_679970` | Preferenze mancanti |
| `invalid_preferences_directory_a6f362` | Directory delle preferenze non valida |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision non è riuscito a leggere questo file. |
| `markdown_files_177420` | File Markdown |
| `text_files_c5df15` | File di testo |
| `all_files_866956` | Tutti i file |
| `save_markdown_file_813f90` | Salva il file Markdown |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Questo documento non è più aperto. Riapri il file o utilizza «Salva con nome». |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Utilizza «Salva con nome» per creare una copia UTF-8 di questo file. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | Questo file utilizza terminazioni di riga miste. Utilizza «Salva con nome» per creare una copia con terminazioni di riga coerenti. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows non è riuscito ad aprire la finestra di dialogo «Salva con nome». |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | Non è stato possibile codificare la bozza come UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows non è riuscito a leggere la destinazione selezionata. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | Il file è stato modificato sul disco o non è disponibile. Utilizza «Salva con nome» per mantenere le modifiche in una copia separata. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows non è riuscito a salvare il file. Verifica che il file sia scrivibile o utilizza «Salva con nome». |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows non è riuscito a ripristinare il file originale durante il salvataggio. L'originale è a {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | Impossibile completare la richiesta di salvataggio. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision non è riuscito a preparare i file dell'applicazione nella cartella locale dei dati dell'app. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | È richiesto il runtime di Microsoft Edge WebView2. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Installazione di Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | Concesso in licenza con GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | Questo programma di installazione richiede Windows su ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision è in esecuzione. Salvare eventuali documenti non salvati prima di continuare. Chiudere Markdown Vision e continuare l’installazione? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | Impossibile chiudere Markdown Vision. Chiuderlo manualmente e avviare nuovamente l’installazione. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision è ancora in esecuzione. Chiudilo e seleziona Riprova oppure annulla l’installazione. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Rimozione dell'edizione Markdown Vision attualmente installata… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | Non è stato possibile rimuovere l’installazione esistente di Markdown Vision. Il programma di installazione si interromperà senza installare Markdown Vision Native. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | Nelle impostazioni di Windows puoi scegliere Markdown Vision come app predefinita per i file Markdown. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Apri le impostazioni delle app predefinite di Windows dopo l’installazione |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision è stato installato. |
| `open_markdown_vision_when_setup_closes_8422c7` | Apri Markdown Vision alla chiusura del programma di installazione |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Impossibile installare Markdown Vision Native. L'installazione verrà interrotta senza registrare un'installazione incompleta. |
| `markdown_document_00271f` | Documento Markdown |
| `markdown_vision_preview_handler_8c95f7` | Gestore di anteprima Markdown Vision |
| `markdown_file_viewer_c36ee7` | Visualizzatore di file Markdown |
| `uninstall_fe1995` | Disinstallare |
| `markdown_vision_could_not_start_error_7950eb` | Impossibile avviare Markdown Vision. {error} |
| `unknown_native_method_method_cc7ca9` | Metodo nativo sconosciuto: {method} |
| `text_71988c` | Testo |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | Intestazione {level} |
| `normal_text_a2adc4` | Testo normale |
| `footnotes_ad6fb5` | Note a piè di pagina |
| `size_px_8d05e6` | {size}px |
| `link_text_insert_default` | testo del link |
| `back_to_footnote_reference` | Torna al riferimento della nota |

## Locale ja

Japanese

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Markdownのフォーマット |
| `undo_a8283a` | 元に戻す |
| `redo_742739` | やり直し |
| `bold_ctrl_b_84787d` | 太字 (Ctrl+B) |
| `bold_94fee6` | 太字 |
| `italic_ctrl_i_ccc60d` | 斜体 (Ctrl+I) |
| `italic_9bf37c` | 斜体 |
| `strikethrough_9aabbc` | 取り消し線 |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | 見出しレベルを順に切り替え (H1–H6, その後は標準テキスト) |
| `cycle_heading_level_bde9c4` | 見出しレベルを順に切り替え |
| `bulleted_list_ce51b3` | 箇条書きリスト |
| `task_list_5d3253` | タスクリスト |
| `numbered_list_cc62f6` | 番号付きリスト |
| `quote_eb4cde` | 引用 |
| `inline_code_e767de` | インラインコード |
| `code_block_754538` | コードブロック |
| `link_a6a32d` | リンク |
| `insert_table_67318e` | 表を挿入 |
| `edit_markdown_6ff388` | Markdownを編集 |
| `new_markdown_file_ctrl_n_f22ed5` | 新しい Markdown ファイル (Ctrl+N) |
| `new_markdown_file_0928e9` | 新しい Markdown ファイル |
| `open_markdown_file_b7764a` | Markdownファイルを開く |
| `print_ctrl_p_5c4406` | 印刷 (Ctrl+P) |
| `print_document_2a024b` | 文書を印刷する |
| `search_text_38d268` | テキストを検索 |
| `settings_74a883` | 設定 |
| `switch_to_dark_mode_fc43ea` | ダークモードに切り替える |
| `about_markdown_vision_08f9a5` | Markdown Visionについて |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | GNU GPLv3ライセンス |
| `version_version_a18745` | バージョン {version} |
| `latest_version_checking_4bfedc` | 最新バージョン: チェック中… |
| `update_c1c100` | 更新 |
| `update_text_editor` | テキストを更新 |
| `keep_unchanged_editor` | 変更しない |
| `check_for_updates_f26f32` | アップデートをチェックする |
| `restart_markdown_vision_7e50f8` | Markdown Visionを再起動 |
| `text_search_10155f` | テキスト検索 |
| `count_match_ef9195` | {count}件の検索結果 |
| `count_matches_43682a` | {count}件の検索結果 |
| `previous_match_daa2f8` | 前の検索結果 |
| `next_match_825e5a` | 次の検索結果 |
| `close_search_55656b` | 検索を閉じる |
| `close_settings_0ccfef` | 設定を閉じる |
| `variable_width_font_0836b2` | プロポーショナルフォント |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | フォント名を入力するか、インストールされているフォントを選択します。 |
| `fixed_width_font_3de094` | 等幅フォント |
| `used_for_code_and_other_monospaced_text_84b6ed` | コードやその他の等幅テキストに使用されます。 |
| `text_size_d68761` | 文字サイズ |
| `automatic_text_size_919785` | 自動文字サイズ |
| `automatic_d461a4` | 自動 |
| `line_spacing_0db45d` | 行間 |
| `page_width_limit_19528b` | ページ幅制限 |
| `automatic_page_width_bd5c30` | 自動ページ幅 |
| `markdown_editor_da0ea6` | Markdownエディター |
| `editor_view_1d1833` | 編集ビュー |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | 左に Markdown、右にビジュアルエディター |
| `split_0b61a1` | 分割 ↔ |
| `visual_above_markdown_a04e0f` | 上にビジュアルエディター、下に Markdown |
| `split_b3b924` | 分割 ↕ |
| `visual_ba3033` | ビジュアル |
| `save_ctrl_s_4be89e` | 保存 (Ctrl+S) |
| `save_1509f5` | 保存 |
| `save_as_ctrl_shift_s_0f132a` | 名前を付けて保存 (Ctrl+Shift+S) |
| `save_as_a4b76a` | 名前を付けて保存… |
| `markdown_source_580118` | Markdownソース |
| `markdown_pane_width_ab0129` | Markdown ペインの幅 |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% ビジュアル |
| `visual_editor_5665dd` | ビジュアルエディター |
| `visual_editing_restriction_d42cea` | ビジュアル編集の制限 |
| `edit_in_markdown_165fd4` | Markdownで編集 |
| `dismiss_48845b` | 通知を閉じる |
| `count_word_1f505c` | {count}語 |
| `count_words_caab29` | {count}語 |
| `approximate_word_count_7b987a` | 単語数（概算）：{count} |
| `line_line_column_column_21e9f4` | 行 {line}、列 {column} |
| `untitled_md_2dccf8` | 無題.md |
| `save_your_changes_56dd16` | 変更を保存しますか? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | 新しいファイルを作成する前に、現在のドキュメントを保存してください。 |
| `cancel_19766e` | キャンセル |
| `discard_changes_f9bfa3` | 変更を破棄する |
| `switch_to_light_mode_bfa0ca` | ライトモードに切り替え |
| `enter_the_name_of_any_installed_font_b57a72` | インストールされているフォントの名前を入力します。 |
| `loading_installed_fonts_200c74` | インストールされているフォントを読み込んでいます… |
| `count_fixed_width_font_available_5488f8` | 利用できる等幅フォント: {count} |
| `count_fixed_width_fonts_available_5df530` | 利用できる等幅フォント: {count} |
| `count_variable_width_font_available_583582` | 利用できるプロポーショナルフォント: {count} |
| `count_variable_width_fonts_available_9d234c` | 利用できるプロポーショナルフォント: {count} |
| `count_match_for_query_2e77ac` | 「{query}」の検索結果: {count} |
| `count_matches_for_query_7db710` | 「{query}」の検索結果: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | 「{query}」に一致する等幅フォントはありません。 |
| `no_variable_width_fonts_match_query_a64030` | 「{query}」に一致するプロポーショナルフォントはありません。 |
| `current_of_total_35d900` | {total} 件中 {current} 件目 |
| `current_of_total_scope_94ebe5` | {total} 件中 {current} 件目 · {scope} |
| `copy_code_49a005` | コードをコピーする |
| `clipboard_unavailable_4ff69f` | クリップボードが使用できません |
| `code_copied_39868c` | コードをコピーしました |
| `could_not_copy_code_4a563f` | コードをコピーできませんでした |
| `the_native_print_dialog_could_not_open_320714` | システムの印刷ダイアログを開けませんでした。 |
| `could_not_open_the_print_dialog_4bd85a` | 印刷ダイアログを開けませんでした。 |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | 未保存の変更を破棄して別のドキュメントを開きますか? |
| `could_not_open_document_69abda` | ドキュメントを開けませんでした |
| `release_check_failed_7b2758` | バージョンの確認に失敗しました |
| `unrecognized_release_list_62d1cb` | バージョン一覧を認識できません |
| `unrecognized_version_d1b8d2` | 認識されないバージョン |
| `latest_version_version_d1c996` | 最新バージョン: {version} |
| `unsupported_architecture_087e4f` | サポートされていないアーキテクチャ |
| `installer_verification_is_unavailable_98306d` | インストーラの検証は利用できません |
| `unsupported_platform_a96892` | サポートされていないプラットフォーム |
| `latest_compatible_version_version_fa3079` | 最新の互換バージョン：{version} |
| `upgrade_markdown_vision_de1b45` | Markdown Visionをアップグレード |
| `download_macos_update_95d8f3` | macOS アップデートをダウンロード |
| `download_linux_update_707c5e` | Linux アップデートをダウンロード |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | 更新を確認できません。インターネット接続を確認して、もう一度試してください。 |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | アップデートをダウンロードして確認しています。認証を求められる場合があります。 |
| `update_installed_restart_to_use_the_new_version_bb8a43` | アップデートがインストールされました。新しいバージョンを使用するには再起動してください。 |
| `update_failed_error_e4f7dc` | アップデートに失敗しました: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Markdown Vision インストーラーをダウンロードして実行しますか？先に開いているドキュメントを保存してください。セットアップ中に Markdown Vision を閉じるよう求められる場合があります。 |
| `downloading_and_verifying_update_02b3ba` | アップデートをダウンロードして確認しています… |
| `installer_started_865e10` | インストーラーが起動しました。 |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | インストーラーをダウンロード、検証、または起動できませんでした。もう一度試してください。 |
| `discard_unsaved_changes_and_restart_6d1602` | 保存されていない変更を破棄して再起動しますか? |
| `could_not_restart_error_71e2d2` | 再起動できませんでした: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | この項目を編集するには、ダブルクリックするか、Alt+Enter を押してください。 |
| `saving_23e392` | 保存中… |
| `unsaved_6250d5` | 未保存 |
| `saved_b5c120` | 保存されました |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | 下書きを保存できませんでした。変更内容はエディターに残っています。 |
| `embedded_content_1bca8f` | 埋め込みコンテンツ |
| `edit_table_source_c7189f` | 表のソースを編集 |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | セルを選択して編集するか、テーブルを変更します。入力中に Alt+Enter を押します。 |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | このブロックには、Markdown で編集する必要がある書式設定が含まれています。 |
| `code_contents_5a1f26` | コードの内容 |
| `type_directly_to_edit_this_indented_code_block_769291` | このインデントされたコードブロック内に直接入力して編集します。 |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | コードブロック内に直接入力して内容を編集できます。開始と終了を示す行は Markdown で編集してください。 |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | テキストを変更するには「リスト項目を編集」を使います。階層を変更するにはリストを Markdown で編集してください。 |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | リストを変更するには「リスト項目を編集」またはチェックボックスを使います。 |
| `edit_list_item_text_a982e6` | リスト項目のテキストを編集する |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | リスト項目のテキストは直接編集できます。リストの構造は Markdown で編集してください。 |
| `task_4bc74b` | タスク |
| `edit_item_9f84ee` | リスト項目を編集 |
| `list_options_fc3320` | リストのオプション |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | このテーブルは Markdown で編集する必要があります。 |
| `add_text_to_this_empty_cell_37f900` | この空のセルにテキストを追加します |
| `edit_this_cell_in_markdown_4304b1` | このセルを Markdown で編集 |
| `edit_table_cell_a4212e` | 表のセルを編集する |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | セルを選択して編集します。元の表は Markdown で編集できます。 |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | このセルには HTML が含まれています。このセルは Markdown で編集してください。 |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | このセルは Markdown 参照を使用しています。このセルは Markdown で編集してください。 |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | セルに入力して編集します。表のオプションを開くには Alt+Enter を押してください。 |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | テキストだけのセルなら直接入力できます。複雑な内容は、表のオプションを使うか Markdown を編集してください。 |
| `table_options_cf924a` | 表のオプション |
| `edit_note_299e60` | 脚注を編集 |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | 対応している脚注のテキストは「脚注を編集」で変更できます。 |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | このレイアウトには HTML が使われています。Markdown で編集してください。 |
| `edit_inline_code_bf93ee` | インラインコードを編集する |
| `edit_list_structure_in_markdown_17a222` | Markdown のリスト構造を編集する |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | リストの通常のテキストは直接編集できます。リストの構造は Markdown で編集してください。 |
| `edit_code_in_table_cell_535cb9` | 表のセル内のコードを編集する |
| `edit_table_cell_text_ca30e7` | 表のセルのテキストを編集する |
| `edit_preformatted_text_9737bd` | 書式設定済みのテキストを編集する |
| `edit_disclosure_title_79fb92` | 展開可能なセクションのタイトルを編集 |
| `edit_text_7967d9` | テキストを編集する |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | セルのテキストを入力します。セルのオプションについては、Alt+Enter を押してください。 |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | テキストを直接編集します。 Markdownで周囲の構造を編集します。 |
| `edit_structure_in_markdown_fe607e` | Markdown で構造を編集する |
| `edit_quoted_text_9de474` | 引用されたテキストを編集する |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | プレーンテキストは直接編集できます。ブロック引用の構造は Markdown で編集してください。 |
| `edit_heading_text_f3806c` | 見出しテキストを編集する |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | 見出しテキストを直接編集します。 Markdown で見出しスタイルを編集します。 |
| `heading_style_c0c25b` | 見出しスタイル |
| `edit_this_item_in_markdown_83b112` | この項目を Markdown で編集します |
| `markdown_only_f6e1f7` | Markdown のみ |
| `visual_only_29a136` | ビジュアルエディターのみ |
| `action_64cff1` | アクション |
| `apply_31e392` | 適用 |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Markdownが変わりました。このエディタを再度開いて、もう一度試してください。 |
| `edit_list_item_f69436` | リスト項目を編集 |
| `item_text_markdown_0bbe7d` | リスト項目のテキスト (Markdown) |
| `new_item_b84cad` | 新しいリスト項目 |
| `enter_item_text_or_choose_remove_item_e4003a` | 項目のテキストを入力するか、「リスト項目を削除」を選びます。 |
| `enter_item_text_82c7ea` | リスト項目のテキストを入力してください。 |
| `add_item_below_a6d694` | 以下に項目を追加 |
| `remove_item_5a89ed` | リスト項目を削除 |
| `indent_under_previous_item_2e6b03` | 前の項目の下にインデントします |
| `outdent_item_07e9b1` | リスト項目のインデントを減らす |
| `this_item_has_no_parent_to_outdent_from_dd148a` | この項目にはインデントを解除する親がありません。 |
| `heading_b34f17` | 見出し |
| `edit_footnote_cdcee6` | 脚注を編集する |
| `note_text_369e75` | 脚注のテキスト |
| `enter_the_note_text_on_one_line_3a7a5a` | 注記のテキストを 1 行に入力します。 |
| `cell_text_9cd173` | セルのテキスト |
| `add_row_below_3d4830` | 下に行を追加 |
| `add_column_after_38817e` | 後に列を追加 |
| `new_column_editor` | 新しい列 |
| `remove_row_1810fd` | 行を削除 |
| `remove_column_9807a2` | 列を削除 |
| `align_column_left_6d9399` | 列を左揃えにする |
| `center_column_1b9b8b` | 列の内容を中央揃え |
| `align_column_right_850a8f` | 列を右揃えにする |
| `cell_text_markdown_a9e5f9` | セルのテキスト (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | 改行を追加する前にインライン コードを閉じてください。 |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | このセルのテキストにより、テーブルの構造が変更されます。 Markdown の区切り文字の前にスペースを追加します。 |
| `alt_text_16f898` | 代替テキスト |
| `link_text_markdown_9b92bd` | リンクテキスト (Markdown) |
| `image_url_e55026` | 画像URL |
| `link_url_9dfd0b` | リンクURL |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | リンクされた画像を編集する |
| `edit_image_d9d12b` | 画像の編集 |
| `edit_link_94026c` | リンクを編集 |
| `enter_text_without_a_closing_bracket_0e7315` | 右括弧を付けずにテキストを入力します。 |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | HTTP または HTTPS URL をスペースや括弧なしで入力します。 |
| `visual_pane_height_4ad683` | ビジュアルペインの高さ |
| `return_to_reader_dcd8f7` | 閲覧ビューに戻る |
| `number_of_columns_2_8_893663` | 列数 (2 ～ 8) |
| `header_number_b79482` | 列見出し {number} |
| `cell_75fa38` | セル |
| `open_1f1d59` | 開く… |
| `new_18fdd5` | 新しい |
| `print_07c371` | 印刷… |
| `close_7d9eb7` | 閉じる |
| `file_50009c` | ファイル |
| `about_markdown_vision_c6d62d` | Markdown Visionについて… |
| `quit_markdown_vision_01c01b` | Markdown Visionを終了する |
| `quit_b3eb37` | 終了 |
| `help_b79cac` | ヘルプ |
| `could_not_enumerate_system_fonts_00e652` | システムフォントを列挙できませんでした |
| `no_system_fonts_found_a8a9af` | システムフォントが見つかりません |
| `could_not_open_document_640c27` | ドキュメントを開けませんでした |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | ドキュメントを開けませんでした。現在の変更は引き続き利用できます。 {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | 未保存の変更を破棄して、Markdown Vision を閉じますか? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | 未保存の変更を破棄して、Markdown Vision を終了しますか? |
| `unknown_confirmation_request_feea29` | 不明な確認リクエスト |
| `keep_editing_624a83` | 編集を続ける |
| `discard_eb1a70` | 破棄する |
| `unsaved_changes_a710c2` | 未保存の変更 |
| `the_document_is_no_longer_open_use_save_as_671c50` | ドキュメントはすでに閉じられています。「名前を付けて保存」を使用してください。 |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | このファイルには複数の改行コードが混在しているか、無効な UTF-8 が含まれています。「名前を付けて保存」を使用してください。 |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | シンボリックリンクを介した保存には対応していません。「名前を付けて保存」を使用してください。 |
| `invalid_destination_14f03f` | 無効な宛先です |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | ディスク上の保存先ファイルが変更されました。編集内容を保持するには、「名前を付けて保存」を使用してください。 |
| `the_update_process_failed_010689` | 更新処理に失敗しました。 |
| `could_not_restore_the_open_document_69d724` | 開いているドキュメントを復元できませんでした。 |
| `could_not_restart_markdown_vision_6ead36` | Markdown Visionを再起動できませんでした。 |
| `restart_is_not_available_on_this_platform_998ef6` | このプラットフォームでは再起動は利用できません。 |
| `the_update_information_is_invalid_dbcffc` | 更新情報が不正です。 |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | 自動更新には、DEB または RPM パッケージがインストールされている必要があります。 |
| `this_architecture_is_not_supported_ae063c` | このアーキテクチャはサポートされていません。 |
| `could_not_identify_the_linux_distribution_18bbdb` | Linux ディストリビューションを識別できませんでした。 |
| `the_rpm_package_manager_is_unavailable_9ce83b` | RPM パッケージ マネージャーは使用できません。 |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision は互換性のある RPM パッケージとしてインストールされていません。 |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | このアップデートは、インストールされているパッケージよりも新しいものではありません。 |
| `the_debian_package_manager_is_unavailable_b5d66b` | Debian パッケージ マネージャーは使用できません。 |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision は DEB パッケージとしてインストールされていません。 |
| `could_not_determine_the_installed_version_f1a1f1` | インストールされているバージョンを特定できませんでした。 |
| `could_not_compare_package_versions_465d4e` | パッケージのバージョンを比較できませんでした。 |
| `could_not_create_a_temporary_download_folder_36407c` | 一時ダウンロードフォルダーを作成できませんでした。 |
| `could_not_start_the_download_b4acf0` | ダウンロードを開始できませんでした。 |
| `the_update_could_not_be_downloaded_4d6fd7` | アップデートをダウンロードできませんでした。 |
| `could_not_verify_the_update_2cd2c5` | アップデートを確認できませんでした。 |
| `the_downloaded_update_failed_verification_60519b` | ダウンロードしたアップデートの検証に失敗しました。 |
| `could_not_inspect_the_update_package_9812b2` | 更新パッケージを検査できませんでした。 |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | ダウンロードしたパッケージには予期しないメタデータが含まれています。 |
| `version_dd1679` | バージョン |
| `could_not_start_the_system_installer_907ba2` | システムインストーラーを起動できませんでした。 |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | インストールがキャンセルされたか、失敗しました。もう一度試してください。 |
| `could_not_verify_the_installed_update_04a200` | インストールされたアップデートを確認できませんでした。 |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | インストーラーは Markdown Vision を予定されたバージョンに更新できませんでした。 |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | 自動 DEB アップデートは、Linux でのみ利用可能です。 |
| `invalid_preferences_bc6b57` | 無効な設定 |
| `invalid_key_b06fe9` | 無効な{key} |
| `unsupported_preferences_version_54734c` | サポートされていない環境設定バージョン |
| `missing_preferences_679970` | 設定がありません |
| `invalid_preferences_directory_a6f362` | 無効な環境設定ディレクトリ |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision はこのファイルを読み取れませんでした。 |
| `markdown_files_177420` | Markdown ファイル |
| `text_files_c5df15` | テキストファイル |
| `all_files_866956` | すべてのファイル |
| `save_markdown_file_813f90` | Markdown ファイルを保存 |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | この文書はすでに閉じられています。ファイルを開き直すか、「名前を付けて保存」を使用してください。 |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | 「名前を付けて保存」を使用して、このファイルの UTF-8 形式のコピーを作成してください。 |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | このファイルには複数の改行コードが混在しています。「名前を付けて保存」を使用して、改行コードを統一したコピーを作成してください。 |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows は [名前を付けて保存] ダイアログを開けませんでした。 |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | ドラフトを UTF-8 としてエンコードできませんでした。 |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows は選択された宛先を読み取ることができませんでした。 |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | ファイルがディスク上で変更されたか、使用できません。編集内容を別のファイルに保存するには、「名前を付けて保存」を使用してください。 |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows はファイルを保存できませんでした。ファイルに書き込めることを確認するか、「名前を付けて保存」を使用してください。 |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows は保存中に元のファイルを復元できませんでした。オリジナルは{path}にあります。 |
| `the_save_request_could_not_be_completed_75cfa5` | 保存リクエストを完了できませんでした。 |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision は、ローカル アプリ データ フォルダーにアプリケーション ファイルを準備できませんでした。 |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Microsoft Edge WebView2 ランタイムが必要です。 |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Markdown Vision Native セットアップ |
| `licensed_under_gpl_3_0_only_5f7e0f` | GPL-3.0-only に基づいてライセンスされています |
| `this_installer_requires_windows_on_arm64_ef7f28` | このインストーラーには、ARM64 上の Windows が必要です。 |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision が実行中です。続行する前に、未保存のドキュメントを保存してください。Markdown Vision を閉じてセットアップを続行しますか？ |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | セットアップで Markdown Vision を閉じられませんでした。手動で閉じてから、セットアップを再度実行してください。 |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision はまだ実行中です。閉じて「再試行」を選択するか、セットアップをキャンセルしてください。 |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | 現在インストールされている Markdown Vision エディションを削除しています… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | 既存の Markdown Vision を削除できませんでした。Markdown Vision Native をインストールせずにセットアップを終了します。 |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | Windows の設定で Markdown Vision を Markdown ファイルの既定のアプリに選択できます。 |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | インストール後に Windows の既定のアプリの設定を開く |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision をインストールしました。 |
| `open_markdown_vision_when_setup_closes_8422c7` | セットアップが終了したら、Markdown Vision を開きます |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native をインストールできませんでした。不完全なインストールは登録せずに、セットアップを終了します。 |
| `markdown_document_00271f` | Markdown ドキュメント |
| `markdown_vision_preview_handler_8c95f7` | Markdown Vision プレビュー ハンドラー |
| `markdown_file_viewer_c36ee7` | Markdown ファイルビューア |
| `uninstall_fe1995` | アンインストール |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision を起動できませんでした。 {error} |
| `unknown_native_method_method_cc7ca9` | 不明なネイティブ メソッド: {method} |
| `text_71988c` | テキスト |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | 見出し {level} |
| `normal_text_a2adc4` | 通常のテキスト |
| `footnotes_ad6fb5` | 脚注 |
| `size_px_8d05e6` | {size} ピクセル |
| `link_text_insert_default` | リンクテキスト |
| `back_to_footnote_reference` | 脚注の参照元に戻る |

## Locale ko

Korean

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Markdown 형식 |
| `undo_a8283a` | 실행 취소 |
| `redo_742739` | 다시 실행 |
| `bold_ctrl_b_84787d` | 굵게 (Ctrl+B) |
| `bold_94fee6` | 굵게 |
| `italic_ctrl_i_ccc60d` | 기울임꼴 (Ctrl+I) |
| `italic_9bf37c` | 기울임꼴 |
| `strikethrough_9aabbc` | 취소선 |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | 제목 수준을 순서대로 전환 (H1–H6, 그다음 일반 텍스트) |
| `cycle_heading_level_bde9c4` | 제목 수준을 순서대로 전환 |
| `bulleted_list_ce51b3` | 글머리 기호 목록 |
| `task_list_5d3253` | 작업 목록 |
| `numbered_list_cc62f6` | 번호가 매겨진 목록 |
| `quote_eb4cde` | 인용 |
| `inline_code_e767de` | 인라인 코드 |
| `code_block_754538` | 코드 블록 |
| `link_a6a32d` | 링크 |
| `insert_table_67318e` | 표 삽입 |
| `edit_markdown_6ff388` | Markdown 편집 |
| `new_markdown_file_ctrl_n_f22ed5` | 새 Markdown 파일(Ctrl+N) |
| `new_markdown_file_0928e9` | 새 Markdown 파일 |
| `open_markdown_file_b7764a` | Markdown 파일 열기 |
| `print_ctrl_p_5c4406` | 인쇄(Ctrl+P) |
| `print_document_2a024b` | 문서 인쇄 |
| `search_text_38d268` | 텍스트 검색 |
| `settings_74a883` | 설정 |
| `switch_to_dark_mode_fc43ea` | 어두운 모드로 전환 |
| `about_markdown_vision_08f9a5` | Markdown Vision 소개 |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | GNU GPLv3 라이선스 |
| `version_version_a18745` | 버전 {version} |
| `latest_version_checking_4bfedc` | 최신 버전: 확인 중… |
| `update_c1c100` | 업데이트 |
| `update_text_editor` | 텍스트 업데이트 |
| `keep_unchanged_editor` | 변경하지 않음 |
| `check_for_updates_f26f32` | 업데이트 확인 |
| `restart_markdown_vision_7e50f8` | Markdown Vision 다시 시작 |
| `text_search_10155f` | 텍스트 검색 |
| `count_match_ef9195` | {count}개의 검색 결과 |
| `count_matches_43682a` | {count}개의 검색 결과 |
| `previous_match_daa2f8` | 이전 검색 결과 |
| `next_match_825e5a` | 다음 검색 결과 |
| `close_search_55656b` | 검색 닫기 |
| `close_settings_0ccfef` | 설정 닫기 |
| `variable_width_font_0836b2` | 가변 너비 글꼴 |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | 글꼴 이름을 입력하거나 설치된 글꼴을 선택합니다. |
| `fixed_width_font_3de094` | 고정 너비 글꼴 |
| `used_for_code_and_other_monospaced_text_84b6ed` | 코드 및 기타 고정 폭 텍스트에 사용됩니다. |
| `text_size_d68761` | 텍스트 크기 |
| `automatic_text_size_919785` | 자동 텍스트 크기 |
| `automatic_d461a4` | 자동 |
| `line_spacing_0db45d` | 줄 간격 |
| `page_width_limit_19528b` | 페이지 너비 제한 |
| `automatic_page_width_bd5c30` | 자동 페이지 너비 |
| `markdown_editor_da0ea6` | Markdown 편집기 |
| `editor_view_1d1833` | 편집기 보기 |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | 왼쪽에 Markdown, 오른쪽에 시각 편집기 |
| `split_0b61a1` | 분할 ↔ |
| `visual_above_markdown_a04e0f` | 위에 시각 편집기, 아래에 Markdown |
| `split_b3b924` | 분할 ↕ |
| `visual_ba3033` | 시각 편집 |
| `save_ctrl_s_4be89e` | 저장(Ctrl+S) |
| `save_1509f5` | 저장 |
| `save_as_ctrl_shift_s_0f132a` | 다른 이름으로 저장 (Ctrl+Shift+S) |
| `save_as_a4b76a` | 다른 이름으로 저장… |
| `markdown_source_580118` | Markdown 소스 |
| `markdown_pane_width_ab0129` | Markdown 창 너비 |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% 시각 편집 |
| `visual_editor_5665dd` | 시각 편집기 |
| `visual_editing_restriction_d42cea` | 시각적 편집 제한 |
| `edit_in_markdown_165fd4` | Markdown에서 편집 |
| `dismiss_48845b` | 알림 닫기 |
| `count_word_1f505c` | {count} 워드 |
| `count_words_caab29` | {count} 단어 |
| `approximate_word_count_7b987a` | 대략적인 단어 수: {count} |
| `line_line_column_column_21e9f4` | 라인 {line}, 열 {column} |
| `untitled_md_2dccf8` | 제목 없음.md |
| `save_your_changes_56dd16` | 변경 사항을 저장하시겠습니까? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | 새 파일을 만들기 전에 현재 문서를 저장하세요. |
| `cancel_19766e` | 취소 |
| `discard_changes_f9bfa3` | 변경 사항 버리기 |
| `switch_to_light_mode_bfa0ca` | 라이트 모드로 전환 |
| `enter_the_name_of_any_installed_font_b57a72` | 설치된 글꼴의 이름을 입력합니다. |
| `loading_installed_fonts_200c74` | 설치된 글꼴 로드 중… |
| `count_fixed_width_font_available_5488f8` | 사용 가능한 고정 너비 글꼴: {count} |
| `count_fixed_width_fonts_available_5df530` | 사용 가능한 고정 너비 글꼴: {count} |
| `count_variable_width_font_available_583582` | 사용 가능한 가변 너비 글꼴: {count} |
| `count_variable_width_fonts_available_9d234c` | 사용 가능한 가변 너비 글꼴: {count} |
| `count_match_for_query_2e77ac` | ‘{query}’ 검색 결과: {count} |
| `count_matches_for_query_7db710` | ‘{query}’ 검색 결과: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | "{query}"와 일치하는 고정 너비 글꼴이 없습니다. |
| `no_variable_width_fonts_match_query_a64030` | "{query}"와 일치하는 가변 너비 글꼴이 없습니다. |
| `current_of_total_35d900` | {total}개 중 {current}번째 |
| `current_of_total_scope_94ebe5` | {total}개 중 {current}번째 · {scope} |
| `copy_code_49a005` | 코드 복사 |
| `clipboard_unavailable_4ff69f` | 클립보드를 사용할 수 없습니다 |
| `code_copied_39868c` | 코드가 복사되었습니다 |
| `could_not_copy_code_4a563f` | 코드를 복사할 수 없습니다 |
| `the_native_print_dialog_could_not_open_320714` | 시스템 인쇄 대화 상자를 열 수 없습니다. |
| `could_not_open_the_print_dialog_4bd85a` | 인쇄 대화 상자를 열 수 없습니다. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | 저장되지 않은 변경 사항을 버리고 다른 문서를 여시겠습니까? |
| `could_not_open_document_69abda` | 문서를 열 수 없습니다 |
| `release_check_failed_7b2758` | 버전 확인 실패 |
| `unrecognized_release_list_62d1cb` | 잘못된 버전 목록 |
| `unrecognized_version_d1b8d2` | 인식할 수 없는 버전 |
| `latest_version_version_d1c996` | 최신 버전: {version} |
| `unsupported_architecture_087e4f` | 지원되지 않는 아키텍처 |
| `installer_verification_is_unavailable_98306d` | 설치 프로그램 확인을 사용할 수 없습니다 |
| `unsupported_platform_a96892` | 지원되지 않는 플랫폼 |
| `latest_compatible_version_version_fa3079` | 최신 호환 버전: {version} |
| `upgrade_markdown_vision_de1b45` | Markdown Vision 업그레이드 |
| `download_macos_update_95d8f3` | macOS 업데이트 다운로드 |
| `download_linux_update_707c5e` | Linux 업데이트 다운로드 |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | 업데이트를 확인할 수 없습니다. 인터넷 연결을 확인하고 다시 시도하세요. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | 업데이트를 다운로드하고 확인하는 중입니다. 인증하라는 메시지가 표시될 수 있습니다. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | 업데이트가 설치되었습니다. 새 버전을 사용하려면 다시 시작하세요. |
| `update_failed_error_e4f7dc` | 업데이트 실패: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Markdown Vision 설치 프로그램을 다운로드하고 실행하시겠습니까? 열려 있는 문서를 먼저 저장하세요. 설치 프로그램에서 Markdown Vision을 닫도록 요청할 수 있습니다. |
| `downloading_and_verifying_update_02b3ba` | 업데이트 다운로드 및 확인 중… |
| `installer_started_865e10` | 설치 프로그램이 시작되었습니다. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | 설치 프로그램을 다운로드, 확인 또는 시작할 수 없습니다. 다시 시도해 주세요. |
| `discard_unsaved_changes_and_restart_6d1602` | 저장되지 않은 변경 사항을 버리고 다시 시작하시겠습니까? |
| `could_not_restart_error_71e2d2` | 다시 시작할 수 없습니다: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | 이 항목을 편집하려면 두 번 클릭하거나 Alt+Enter를 누르세요 |
| `saving_23e392` | 저장 중… |
| `unsaved_6250d5` | 저장되지 않음 |
| `saved_b5c120` | 저장됨 |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | 초안을 저장하지 못했습니다. 변경 내용은 편집기에 남아 있습니다. |
| `embedded_content_1bca8f` | 삽입된 콘텐츠 |
| `edit_table_source_c7189f` | 표 원본 편집 |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | 셀을 편집하거나 표를 변경하려면 셀을 선택하세요. 입력하는 동안 Alt+Enter를 누르세요. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | 이 블록에는 Markdown에서 편집해야 하는 형식이 포함되어 있습니다. |
| `code_contents_5a1f26` | 코드 내용 |
| `type_directly_to_edit_this_indented_code_block_769291` | 이 들여쓰기된 코드 블록에 직접 입력하여 편집하세요. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | 내용을 편집하려면 코드 블록에 직접 입력하세요. Markdown을 사용하여 시작과 끝을 표시하는 줄을 편집합니다. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | 텍스트를 바꾸려면 ‘목록 항목 편집’을 선택하세요. 중첩 단계를 바꾸려면 Markdown에서 목록을 편집하세요. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | 이 목록을 바꾸려면 ‘목록 항목 편집’ 또는 확인란을 사용하세요. |
| `edit_list_item_text_a982e6` | 목록 항목 텍스트 편집 |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | 항목 텍스트를 직접 편집합니다. Markdown에서 목록 구조를 편집합니다. |
| `task_4bc74b` | 작업 |
| `edit_item_9f84ee` | 목록 항목 편집 |
| `list_options_fc3320` | 목록 옵션 |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | 이 표는 Markdown에서 편집해야 합니다. |
| `add_text_to_this_empty_cell_37f900` | 이 빈 셀에 텍스트를 추가하세요 |
| `edit_this_cell_in_markdown_4304b1` | Markdown에서 이 셀을 편집하세요 |
| `edit_table_cell_a4212e` | 표 셀 편집 |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | 편집할 셀을 선택하세요. 원본 표는 Markdown에서 편집할 수 있습니다. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | 이 셀에는 HTML이 포함되어 있습니다. Markdown에서 이 셀을 편집합니다. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | 이 셀은 Markdown 참조를 사용합니다. Markdown에서 이 셀을 편집합니다. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | 이 셀을 편집하려면 입력하세요. 표 옵션을 보려면 Alt+Enter를 누르세요. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | 텍스트만 있는 셀에 직접 입력하세요. 더 복잡한 내용은 표 옵션을 사용하거나 Markdown을 편집하세요. |
| `table_options_cf924a` | 표 옵션 |
| `edit_note_299e60` | 각주 편집 |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | 편집할 수 있는 각주 텍스트를 변경하려면 “각주 편집”을 사용하세요. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | 이 레이아웃은 HTML을 사용합니다. Markdown에서 편집하세요. |
| `edit_inline_code_bf93ee` | 인라인 코드 편집 |
| `edit_list_structure_in_markdown_17a222` | Markdown의 목록 구조 편집 |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | 일반 목록 텍스트를 직접 편집합니다. Markdown에서 목록 구조를 편집합니다. |
| `edit_code_in_table_cell_535cb9` | 표 셀의 코드 편집 |
| `edit_table_cell_text_ca30e7` | 표 셀 텍스트 편집 |
| `edit_preformatted_text_9737bd` | 미리 서식이 지정된 텍스트 편집 |
| `edit_disclosure_title_79fb92` | 펼칠 수 있는 섹션의 제목 편집 |
| `edit_text_7967d9` | 텍스트 편집 |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | 셀 텍스트를 입력합니다. 셀 옵션을 보려면 Alt+Enter를 누르세요. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | 텍스트를 직접 편집하세요. Markdown에서 주변 구조를 편집합니다. |
| `edit_structure_in_markdown_fe607e` | Markdown의 구조 편집 |
| `edit_quoted_text_9de474` | 인용된 텍스트 편집 |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | 일반 텍스트를 직접 편집하세요. 인용 블록의 구조는 Markdown에서 편집하세요. |
| `edit_heading_text_f3806c` | 제목 텍스트 수정 |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | 제목 텍스트를 직접 편집하세요. Markdown에서 제목 스타일을 편집합니다. |
| `heading_style_c0c25b` | 제목 스타일 |
| `edit_this_item_in_markdown_83b112` | Markdown에서 이 항목을 편집하세요 |
| `markdown_only_f6e1f7` | Markdown에서만 |
| `visual_only_29a136` | 시각 편집기에서만 |
| `action_64cff1` | 액션 |
| `apply_31e392` | 적용 |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Markdown이 변경되었습니다. 다시 시도하려면 이 편집기를 다시 여세요. |
| `edit_list_item_f69436` | 목록 항목 편집 |
| `item_text_markdown_0bbe7d` | 아이템 텍스트(Markdown) |
| `new_item_b84cad` | 새 목록 항목 |
| `enter_item_text_or_choose_remove_item_e4003a` | 목록 항목의 텍스트를 입력하거나 “목록 항목 제거”를 선택하세요. |
| `enter_item_text_82c7ea` | 항목 텍스트를 입력하세요. |
| `add_item_below_a6d694` | 아래 항목 추가 |
| `remove_item_5a89ed` | 목록 항목 제거 |
| `indent_under_previous_item_2e6b03` | 이전 항목 아래에 들여쓰기 |
| `outdent_item_07e9b1` | 목록 항목 내어쓰기 |
| `this_item_has_no_parent_to_outdent_from_dd148a` | 이 항목에는 내어쓰기할 상위 항목이 없습니다. |
| `heading_b34f17` | 제목 |
| `edit_footnote_cdcee6` | 각주 편집 |
| `note_text_369e75` | 각주 텍스트 |
| `enter_the_note_text_on_one_line_3a7a5a` | 한 줄에 메모 텍스트를 입력합니다. |
| `cell_text_9cd173` | 셀 텍스트 |
| `add_row_below_3d4830` | 아래에 행 추가 |
| `add_column_after_38817e` | 현재 열 뒤에 열 추가 |
| `new_column_editor` | 새 열 |
| `remove_row_1810fd` | 행 제거 |
| `remove_column_9807a2` | 열 제거 |
| `align_column_left_6d9399` | 열을 왼쪽으로 정렬 |
| `center_column_1b9b8b` | 열 내용 가운데 정렬 |
| `align_column_right_850a8f` | 열을 오른쪽으로 정렬 |
| `cell_text_markdown_a9e5f9` | 셀 텍스트(Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | 줄바꿈을 추가하기 전에 인라인 코드를 닫으세요. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | 이 셀 텍스트는 표 구조를 변경합니다. Markdown에서 구분 기호 앞에 공백을 추가합니다. |
| `alt_text_16f898` | 대체 텍스트 |
| `link_text_markdown_9b92bd` | 링크 텍스트(Markdown) |
| `image_url_e55026` | 이미지 URL |
| `link_url_9dfd0b` | 링크 URL |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | 연결된 이미지 편집 |
| `edit_image_d9d12b` | 이미지 편집 |
| `edit_link_94026c` | 링크 수정 |
| `enter_text_without_a_closing_bracket_0e7315` | 닫는 괄호 없이 텍스트를 입력하세요. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | 공백이나 괄호 없이 HTTP 또는 HTTPS URL을 입력하세요. |
| `visual_pane_height_4ad683` | 시각 편집 창 높이 |
| `return_to_reader_dcd8f7` | 읽기 보기로 돌아가기 |
| `number_of_columns_2_8_893663` | 열 수(2~8) |
| `header_number_b79482` | 열 머리글 {number} |
| `cell_75fa38` | 셀 |
| `open_1f1d59` | 열기… |
| `new_18fdd5` | 새로운 |
| `print_07c371` | 인쇄… |
| `close_7d9eb7` | 닫기 |
| `file_50009c` | 파일 |
| `about_markdown_vision_c6d62d` | Markdown Vision 소개… |
| `quit_markdown_vision_01c01b` | Markdown Vision 종료 |
| `quit_b3eb37` | 종료 |
| `help_b79cac` | 도움말 |
| `could_not_enumerate_system_fonts_00e652` | 시스템 글꼴을 열거할 수 없습니다 |
| `no_system_fonts_found_a8a9af` | 시스템 글꼴을 찾을 수 없습니다 |
| `could_not_open_document_640c27` | 문서를 열 수 없습니다 |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | 문서를 열 수 없습니다. 현재 변경 사항을 계속 사용할 수 있습니다. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | 저장되지 않은 변경 사항을 버리고 Markdown Vision을 닫으시겠습니까? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | 저장되지 않은 변경 사항을 버리고 Markdown Vision을 종료하시겠습니까? |
| `unknown_confirmation_request_feea29` | 알 수 없는 확인 요청 |
| `keep_editing_624a83` | 계속 편집 |
| `discard_eb1a70` | 변경 사항 버리기 |
| `unsaved_changes_a710c2` | 저장되지 않은 변경 사항 |
| `the_document_is_no_longer_open_use_save_as_671c50` | 문서가 더 이상 열려 있지 않습니다. ‘다른 이름으로 저장’을 사용하세요. |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | 이 파일에는 서로 다른 줄바꿈 형식이 섞여 있거나 잘못된 UTF-8 인코딩이 포함되어 있습니다. ‘다른 이름으로 저장’을 사용하세요. |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | 심볼릭 링크를 통한 저장은 지원되지 않습니다. ‘다른 이름으로 저장’을 사용하세요. |
| `invalid_destination_14f03f` | 잘못된 목적지 |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | 디스크의 대상 파일이 변경되었습니다. 편집 내용을 보존하려면 ‘다른 이름으로 저장’을 사용하세요. |
| `the_update_process_failed_010689` | 업데이트 프로세스가 실패했습니다. |
| `could_not_restore_the_open_document_69d724` | 열려 있는 문서를 복원할 수 없습니다. |
| `could_not_restart_markdown_vision_6ead36` | Markdown Vision을 다시 시작할 수 없습니다. |
| `restart_is_not_available_on_this_platform_998ef6` | 이 플랫폼에서는 다시 시작할 수 없습니다. |
| `the_update_information_is_invalid_dbcffc` | 업데이트 정보가 올바르지 않습니다. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | 자동 업데이트를 위해서는 DEB 또는 RPM 패키지가 설치되어 있어야 합니다. |
| `this_architecture_is_not_supported_ae063c` | 이 아키텍처는 지원되지 않습니다. |
| `could_not_identify_the_linux_distribution_18bbdb` | Linux 배포판을 식별할 수 없습니다. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | RPM 패키지 관리자를 사용할 수 없습니다. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision은 호환되는 RPM 패키지로 설치되어 있지 않습니다. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | 이 업데이트는 설치된 패키지보다 최신이 아닙니다. |
| `the_debian_package_manager_is_unavailable_b5d66b` | 데비안 패키지 관리자를 사용할 수 없습니다. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision은 DEB 패키지로 설치되어 있지 않습니다. |
| `could_not_determine_the_installed_version_f1a1f1` | 설치된 버전을 확인할 수 없습니다. |
| `could_not_compare_package_versions_465d4e` | 패키지 버전을 비교할 수 없습니다. |
| `could_not_create_a_temporary_download_folder_36407c` | 임시 다운로드 폴더를 생성할 수 없습니다. |
| `could_not_start_the_download_b4acf0` | 다운로드를 시작할 수 없습니다. |
| `the_update_could_not_be_downloaded_4d6fd7` | 업데이트를 다운로드할 수 없습니다. |
| `could_not_verify_the_update_2cd2c5` | 업데이트를 확인할 수 없습니다. |
| `the_downloaded_update_failed_verification_60519b` | 다운로드한 업데이트의 검증에 실패했습니다. |
| `could_not_inspect_the_update_package_9812b2` | 업데이트 패키지를 검사할 수 없습니다. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | 다운로드한 패키지에 예상치 못한 메타데이터가 있습니다. |
| `version_dd1679` | 버전 |
| `could_not_start_the_system_installer_907ba2` | 시스템 설치 프로그램을 시작할 수 없습니다. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | 설치가 취소되었거나 실패했습니다. 다시 시도해 주세요. |
| `could_not_verify_the_installed_update_04a200` | 설치된 업데이트를 확인할 수 없습니다. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | 설치 프로그램이 Markdown Vision을 예상 버전으로 업데이트하지 않았습니다. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | 자동 DEB 업데이트는 Linux에서만 사용할 수 있습니다. |
| `invalid_preferences_bc6b57` | 잘못된 환경설정 |
| `invalid_key_b06fe9` | 잘못된 {key} |
| `unsupported_preferences_version_54734c` | 지원되지 않는 환경설정 버전 |
| `missing_preferences_679970` | 누락된 환경설정 |
| `invalid_preferences_directory_a6f362` | 잘못된 기본 설정 디렉토리 |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision이 이 파일을 읽을 수 없습니다. |
| `markdown_files_177420` | Markdown 파일 |
| `text_files_c5df15` | 텍스트 파일 |
| `all_files_866956` | 모든 파일 |
| `save_markdown_file_813f90` | Markdown 파일 저장 |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | 이 문서는 더 이상 열려 있지 않습니다. 파일을 다시 열거나 ‘다른 이름으로 저장’을 사용하세요. |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | ‘다른 이름으로 저장’을 사용하여 이 파일의 UTF-8 복사본을 만드세요. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | 이 파일에는 서로 다른 줄바꿈 형식이 섞여 있습니다. 줄바꿈 형식이 통일된 복사본을 만들려면 ‘다른 이름으로 저장’을 사용하세요. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows가 ‘다른 이름으로 저장’ 대화 상자를 열 수 없습니다. |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | 초안을 UTF-8로 인코딩할 수 없습니다. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows가 선택한 대상을 읽을 수 없습니다. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | 파일이 디스크에서 변경되었거나 사용할 수 없습니다. 별도의 복사본에 편집 내용을 보관하려면 ‘다른 이름으로 저장’을 사용하세요. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows가 파일을 저장할 수 없습니다. 파일에 쓸 수 있는지 확인하거나 ‘다른 이름으로 저장’을 사용하세요. |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows는 저장 중에 원본 파일을 복원할 수 없습니다. 원본은 {path}에 있습니다. |
| `the_save_request_could_not_be_completed_75cfa5` | 저장 요청을 완료할 수 없습니다. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision은 로컬 앱 데이터 폴더에서 해당 애플리케이션 파일을 준비할 수 없습니다. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Microsoft Edge WebView2 런타임이 필요합니다. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Markdown Vision Native 설치 |
| `licensed_under_gpl_3_0_only_5f7e0f` | GPL-3.0-only에 따라 라이선스가 부여됨 |
| `this_installer_requires_windows_on_arm64_ef7f28` | 이 설치 프로그램에는 ARM64에 Windows가 필요합니다. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision이 실행 중입니다. 계속하기 전에 저장하지 않은 문서를 저장하세요. Markdown Vision을 닫고 설치를 계속하시겠습니까? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | 설치 프로그램에서 Markdown Vision을 닫을 수 없습니다. 수동으로 닫고 설치를 다시 실행하십시오. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision이 아직 실행 중입니다. 앱을 닫고 다시 시도를 선택하거나 설치를 취소하세요. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | 현재 설치된 Markdown Vision 에디션을 제거하는 중… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | 기존 Markdown Vision 설치를 제거하지 못했습니다. 설치 프로그램이 Markdown Vision Native를 설치하지 않고 종료됩니다. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | Windows 설정에서 Markdown Vision을 Markdown 파일의 기본 앱으로 선택할 수 있습니다. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | 설치 후 Windows 기본 앱 설정 열기 |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision이 설치되었습니다. |
| `open_markdown_vision_when_setup_closes_8422c7` | 설치 프로그램이 종료되면 Markdown Vision 열기 |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native를 설치할 수 없습니다. 불완전한 설치를 등록하지 않고 설치 프로그램이 종료됩니다. |
| `markdown_document_00271f` | Markdown 문서 |
| `markdown_vision_preview_handler_8c95f7` | Markdown Vision 미리보기 핸들러 |
| `markdown_file_viewer_c36ee7` | Markdown 파일 뷰어 |
| `uninstall_fe1995` | 제거 |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision을 시작할 수 없습니다. {error} |
| `unknown_native_method_method_cc7ca9` | 알 수 없는 기본 메소드: {method} |
| `text_71988c` | 텍스트 |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | 제목 {level} |
| `normal_text_a2adc4` | 일반 텍스트 |
| `footnotes_ad6fb5` | 각주 |
| `size_px_8d05e6` | {size} px |
| `link_text_insert_default` | 링크 텍스트 |
| `back_to_footnote_reference` | 각주 참조로 돌아가기 |

## Locale pl

Polish

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Formatowanie Markdown |
| `undo_a8283a` | Cofnij |
| `redo_742739` | Powtórz |
| `bold_ctrl_b_84787d` | Pogrubienie (Ctrl+B) |
| `bold_94fee6` | Pogrubienie |
| `italic_ctrl_i_ccc60d` | Kursywa (Ctrl+I) |
| `italic_9bf37c` | Kursywa |
| `strikethrough_9aabbc` | Przekreślenie |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Przełączaj poziomy nagłówka (H1–H6, następnie zwykły tekst) |
| `cycle_heading_level_bde9c4` | Przełączaj poziomy nagłówka |
| `bulleted_list_ce51b3` | Lista punktowana |
| `task_list_5d3253` | Lista zadań |
| `numbered_list_cc62f6` | Lista numerowana |
| `quote_eb4cde` | Cytat |
| `inline_code_e767de` | Kod w tekście |
| `code_block_754538` | Blok kodu |
| `link_a6a32d` | Link |
| `insert_table_67318e` | Wstaw tabelę |
| `edit_markdown_6ff388` | Edytuj Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | Nowy plik Markdown (Ctrl+N) |
| `new_markdown_file_0928e9` | Nowy plik Markdown |
| `open_markdown_file_b7764a` | Otwórz plik Markdown |
| `print_ctrl_p_5c4406` | Drukuj (Ctrl+P) |
| `print_document_2a024b` | Wydrukuj dokument |
| `search_text_38d268` | Szukaj w tekście |
| `settings_74a883` | Ustawienia |
| `switch_to_dark_mode_fc43ea` | Przełącz na tryb ciemny |
| `about_markdown_vision_08f9a5` | Informacje o Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | Licencja GNU GPLv3 |
| `version_version_a18745` | Wersja {version} |
| `latest_version_checking_4bfedc` | Najnowsza wersja: sprawdzanie… |
| `update_c1c100` | Aktualizuj |
| `update_text_editor` | Zaktualizuj tekst |
| `keep_unchanged_editor` | Pozostaw bez zmian |
| `check_for_updates_f26f32` | Sprawdź aktualizacje |
| `restart_markdown_vision_7e50f8` | Uruchom ponownie Markdown Vision |
| `text_search_10155f` | Wyszukiwanie w tekście |
| `count_match_ef9195` | {count} wynik wyszukiwania |
| `count_matches_43682a` | {count} wyniki wyszukiwania |
| `previous_match_daa2f8` | Poprzedni wynik wyszukiwania |
| `next_match_825e5a` | Następny wynik wyszukiwania |
| `close_search_55656b` | Zamknij wyszukiwanie |
| `close_settings_0ccfef` | Zamknij ustawienia |
| `variable_width_font_0836b2` | Czcionka o zmiennej szerokości |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Wpisz nazwę czcionki lub wybierz zainstalowaną czcionkę. |
| `fixed_width_font_3de094` | Czcionka o stałej szerokości |
| `used_for_code_and_other_monospaced_text_84b6ed` | Używana do kodu i innego tekstu o stałej szerokości. |
| `text_size_d68761` | Rozmiar tekstu |
| `automatic_text_size_919785` | Automatyczny rozmiar tekstu |
| `automatic_d461a4` | Automatyczny |
| `line_spacing_0db45d` | Odstępy między wierszami |
| `page_width_limit_19528b` | Limit szerokości strony |
| `automatic_page_width_bd5c30` | Automatyczna szerokość strony |
| `markdown_editor_da0ea6` | Edytor Markdown |
| `editor_view_1d1833` | Widok edytora |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown po lewej, edytor wizualny po prawej |
| `split_0b61a1` | Podziel ↔ |
| `visual_above_markdown_a04e0f` | Edytor wizualny nad Markdownem |
| `split_b3b924` | Podziel ↕ |
| `visual_ba3033` | Wizualny |
| `save_ctrl_s_4be89e` | Zapisz (Ctrl+S) |
| `save_1509f5` | Zapisz |
| `save_as_ctrl_shift_s_0f132a` | Zapisz jako (Ctrl+Shift+S) |
| `save_as_a4b76a` | Zapisz jako… |
| `markdown_source_580118` | Źródło Markdown |
| `markdown_pane_width_ab0129` | Szerokość panelu Markdown |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% widoku wizualnego |
| `visual_editor_5665dd` | Edytor wizualny |
| `visual_editing_restriction_d42cea` | Ograniczenia edycji wizualnej |
| `edit_in_markdown_165fd4` | Edytuj w Markdown |
| `dismiss_48845b` | Zamknij powiadomienie |
| `count_word_1f505c` | Słowo {count} |
| `count_words_caab29` | {count} słowa |
| `approximate_word_count_7b987a` | Przybliżona liczba słów: {count} |
| `line_line_column_column_21e9f4` | Linia {line}, kolumna {column} |
| `untitled_md_2dccf8` | Bez tytułu.md |
| `save_your_changes_56dd16` | Zapisać zmiany? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Zapisz bieżący dokument przed utworzeniem nowego pliku. |
| `cancel_19766e` | Anuluj |
| `discard_changes_f9bfa3` | Odrzuć zmiany |
| `switch_to_light_mode_bfa0ca` | Przełącz na tryb jasny |
| `enter_the_name_of_any_installed_font_b57a72` | Wprowadź nazwę dowolnej zainstalowanej czcionki. |
| `loading_installed_fonts_200c74` | Ładowanie zainstalowanych czcionek… |
| `count_fixed_width_font_available_5488f8` | Dostępne czcionki o stałej szerokości: {count} |
| `count_fixed_width_fonts_available_5df530` | Dostępne czcionki o stałej szerokości: {count} |
| `count_variable_width_font_available_583582` | Dostępne czcionki o zmiennej szerokości: {count} |
| `count_variable_width_fonts_available_9d234c` | Dostępne czcionki o zmiennej szerokości: {count} |
| `count_match_for_query_2e77ac` | Wyniki wyszukiwania dla „{query}”: {count} |
| `count_matches_for_query_7db710` | Wyniki wyszukiwania dla „{query}”: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | Żadna czcionka o stałej szerokości nie pasuje do „{query}”. |
| `no_variable_width_fonts_match_query_a64030` | Żadna czcionka o zmiennej szerokości nie pasuje do „{query}”. |
| `current_of_total_35d900` | {current} z {total} |
| `current_of_total_scope_94ebe5` | {current} z {total} · {scope} |
| `copy_code_49a005` | Skopiuj kod |
| `clipboard_unavailable_4ff69f` | Schowek niedostępny |
| `code_copied_39868c` | Kod skopiowany |
| `could_not_copy_code_4a563f` | Nie udało się skopiować kodu |
| `the_native_print_dialog_could_not_open_320714` | Nie można otworzyć systemowego okna drukowania. |
| `could_not_open_the_print_dialog_4bd85a` | Nie można otworzyć okna drukowania. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Odrzucić niezapisane zmiany i otworzyć inny dokument? |
| `could_not_open_document_69abda` | Nie można otworzyć dokumentu |
| `release_check_failed_7b2758` | Sprawdzanie wersji nie powiodło się |
| `unrecognized_release_list_62d1cb` | Nieprawidłowa lista wersji |
| `unrecognized_version_d1b8d2` | Nierozpoznana wersja |
| `latest_version_version_d1c996` | Najnowsza wersja: {version} |
| `unsupported_architecture_087e4f` | Nieobsługiwana architektura |
| `installer_verification_is_unavailable_98306d` | Weryfikacja instalatora jest niedostępna |
| `unsupported_platform_a96892` | Nieobsługiwana platforma |
| `latest_compatible_version_version_fa3079` | Najnowsza kompatybilna wersja: {version} |
| `upgrade_markdown_vision_de1b45` | Uaktualnij Markdown Vision |
| `download_macos_update_95d8f3` | Pobierz aktualizację macOS |
| `download_linux_update_707c5e` | Pobierz aktualizację dla systemu Linux |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Nie można sprawdzić dostępności aktualizacji. Sprawdź swoje połączenie internetowe i spróbuj ponownie. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Pobieranie i weryfikacja aktualizacji. Możesz zostać poproszony o uwierzytelnienie. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Aktualizacja zainstalowana. Uruchom ponownie, aby korzystać z nowej wersji. |
| `update_failed_error_e4f7dc` | Aktualizacja nie powiodła się: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Pobrać i uruchomić instalator Markdown Vision? Najpierw zapisz wszystkie otwarte dokumenty. Instalator może poprosić o zamknięcie Markdown Vision. |
| `downloading_and_verifying_update_02b3ba` | Pobieram i weryfikuję aktualizację… |
| `installer_started_865e10` | Instalator został uruchomiony. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Nie można pobrać, zweryfikować ani uruchomić instalatora. Spróbuj ponownie. |
| `discard_unsaved_changes_and_restart_6d1602` | Odrzucić niezapisane zmiany i uruchomić ponownie? |
| `could_not_restart_error_71e2d2` | Nie można uruchomić ponownie: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Kliknij dwukrotnie lub naciśnij Alt+Enter, aby edytować ten element |
| `saving_23e392` | Zapisywanie… |
| `unsaved_6250d5` | Niezapisane |
| `saved_b5c120` | Zapisano |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Nie udało się zapisać wersji roboczej. Twoje zmiany nadal są w edytorze. |
| `embedded_content_1bca8f` | Osadzone treści |
| `edit_table_source_c7189f` | Edytuj źródło tabeli |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Wybierz komórkę, aby ją edytować lub zmienić tabelę. Naciśnij Alt+Enter podczas pisania. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Ten blok zawiera formatowanie, które należy edytować w Markdown. |
| `code_contents_5a1f26` | Zawartość kodu |
| `type_directly_to_edit_this_indented_code_block_769291` | Pisz bezpośrednio w tym bloku kodu z wcięciem, aby go edytować. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Wpisz bezpośrednio w bloku kodu, aby edytować jego zawartość. Użyj Markdown, aby edytować linie oznaczające początek i koniec. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Aby zmienić tekst, wybierz „Edytuj element listy”. Aby zmienić poziom zagnieżdżenia, edytuj listę w Markdown. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Aby zmienić tę listę, wybierz „Edytuj element listy” lub użyj pól wyboru. |
| `edit_list_item_text_a982e6` | Edytuj tekst elementu listy |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Edytuj bezpośrednio tekst elementu listy. Strukturę listy edytuj w Markdown. |
| `task_4bc74b` | Zadanie |
| `edit_item_9f84ee` | Edytuj element listy |
| `list_options_fc3320` | Opcje listy |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Ta tabela wymaga edycji w Markdown. |
| `add_text_to_this_empty_cell_37f900` | Dodaj tekst do tej pustej komórki |
| `edit_this_cell_in_markdown_4304b1` | Edytuj tę komórkę w Markdown |
| `edit_table_cell_a4212e` | Edytuj komórkę tabeli |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Wybierz komórkę, aby ją edytować. Możesz edytować tabelę bazową w Markdown. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Ta komórka zawiera kod HTML. Edytuj tę komórkę w Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | Ta komórka wykorzystuje odniesienia Markdown. Edytuj tę komórkę w Markdown. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Wpisz, aby edytować tę komórkę. Naciśnij Alt+Enter, aby wyświetlić opcje tabeli. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Pisz bezpośrednio w komórkach zawierających tylko zwykły tekst. W przypadku bardziej złożonej treści użyj opcji tabeli lub edytuj Markdown. |
| `table_options_cf924a` | Opcje tabeli |
| `edit_note_299e60` | Edytuj notatkę |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Użyj opcji „Edytuj notatkę”, aby zmienić edytowalny tekst przypisu. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | Ten układ wykorzystuje HTML. Edytuj go w Markdown. |
| `edit_inline_code_bf93ee` | Edytuj kod w tekście |
| `edit_list_structure_in_markdown_17a222` | Edytuj strukturę listy w Markdown |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Edytuj bezpośrednio zwykły tekst listy. Edytuj strukturę listy w Markdown. |
| `edit_code_in_table_cell_535cb9` | Edytuj kod w komórce tabeli |
| `edit_table_cell_text_ca30e7` | Edytuj tekst komórki tabeli |
| `edit_preformatted_text_9737bd` | Edytuj wstępnie sformatowany tekst |
| `edit_disclosure_title_79fb92` | Edytuj tytuł rozwijanej sekcji |
| `edit_text_7967d9` | Edytuj tekst |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Wpisz tekst komórki. Naciśnij Alt+Enter, aby wyświetlić opcje komórki. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Edytuj tekst bezpośrednio. Edytuj otaczającą konstrukcję w Markdown. |
| `edit_structure_in_markdown_fe607e` | Edytuj strukturę w Markdown |
| `edit_quoted_text_9de474` | Edytuj cytowany tekst |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Edytuj zwykły tekst bezpośrednio. Edytuj strukturę cytatu blokowego w Markdownie. |
| `edit_heading_text_f3806c` | Edytuj tekst nagłówka |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Edytuj bezpośrednio tekst nagłówka. Edytuj styl nagłówka w Markdown. |
| `heading_style_c0c25b` | Styl nagłówka |
| `edit_this_item_in_markdown_83b112` | Edytuj ten element w Markdown |
| `markdown_only_f6e1f7` | Tylko Markdown |
| `visual_only_29a136` | Tylko edytor wizualny |
| `action_64cff1` | Akcja |
| `apply_31e392` | Zastosuj |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Markdown uległ zmianie. Otwórz ponownie ten edytor, aby spróbować jeszcze raz. |
| `edit_list_item_f69436` | Edytuj element listy |
| `item_text_markdown_0bbe7d` | Tekst elementu listy (Markdown) |
| `new_item_b84cad` | Nowy element listy |
| `enter_item_text_or_choose_remove_item_e4003a` | Wprowadź tekst elementu lub wybierz opcję „Usuń element listy”. |
| `enter_item_text_82c7ea` | Wprowadź tekst elementu. |
| `add_item_below_a6d694` | Dodaj element poniżej |
| `remove_item_5a89ed` | Usuń element listy |
| `indent_under_previous_item_2e6b03` | Zwiększ wcięcie pod poprzednim elementem |
| `outdent_item_07e9b1` | Zmniejsz wcięcie elementu |
| `this_item_has_no_parent_to_outdent_from_dd148a` | Ten element nie ma elementu nadrzędnego, więc nie można zmniejszyć jego wcięcia. |
| `heading_b34f17` | Nagłówek |
| `edit_footnote_cdcee6` | Edytuj przypis |
| `note_text_369e75` | Tekst przypisu |
| `enter_the_note_text_on_one_line_3a7a5a` | Wprowadź tekst notatki w jednym wierszu. |
| `cell_text_9cd173` | Tekst komórki |
| `add_row_below_3d4830` | Dodaj wiersz poniżej |
| `add_column_after_38817e` | Dodaj kolumnę po |
| `new_column_editor` | Nowa kolumna |
| `remove_row_1810fd` | Usuń wiersz |
| `remove_column_9807a2` | Usuń kolumnę |
| `align_column_left_6d9399` | Wyrównaj kolumnę do lewej |
| `center_column_1b9b8b` | Wyśrodkuj zawartość kolumny |
| `align_column_right_850a8f` | Wyrównaj kolumnę do prawej |
| `cell_text_markdown_a9e5f9` | Tekst w komórce (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Zamknij kod wbudowany przed dodaniem podziału wiersza. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Ten tekst komórki zmieniłby strukturę tabeli. Dodaj spację przed separatorem w Markdown. |
| `alt_text_16f898` | Tekst alternatywny |
| `link_text_markdown_9b92bd` | Tekst łącza (Markdown) |
| `image_url_e55026` | Adres URL obrazu |
| `link_url_9dfd0b` | Adres URL linku |
| `url_e7a241` | Adres URL |
| `edit_linked_image_2f9456` | Edytuj połączony obraz |
| `edit_image_d9d12b` | Edytuj obraz |
| `edit_link_94026c` | Edytuj link |
| `enter_text_without_a_closing_bracket_0e7315` | Wprowadź tekst bez nawiasu zamykającego. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Wprowadź adres URL HTTP lub HTTPS bez spacji i nawiasów. |
| `visual_pane_height_4ad683` | Wysokość panelu wizualnego |
| `return_to_reader_dcd8f7` | Wróć do widoku czytania |
| `number_of_columns_2_8_893663` | Liczba kolumn (2–8) |
| `header_number_b79482` | Nagłówek kolumny {number} |
| `cell_75fa38` | Komórka |
| `open_1f1d59` | Otwórz… |
| `new_18fdd5` | Nowy |
| `print_07c371` | Drukuj… |
| `close_7d9eb7` | Zamknij |
| `file_50009c` | Plik |
| `about_markdown_vision_c6d62d` | O Markdown Vision… |
| `quit_markdown_vision_01c01b` | Wyjdź z Markdown Vision |
| `quit_b3eb37` | Zakończ |
| `help_b79cac` | Pomoc |
| `could_not_enumerate_system_fonts_00e652` | Nie można pobrać listy czcionek systemowych |
| `no_system_fonts_found_a8a9af` | Nie znaleziono czcionek systemowych |
| `could_not_open_document_640c27` | Nie można otworzyć dokumentu |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | Nie można otworzyć dokumentu. Bieżące zmiany są nadal dostępne. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Odrzucić niezapisane zmiany i zamknąć Markdown Vision? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Odrzucić niezapisane zmiany i zamknąć Markdown Vision? |
| `unknown_confirmation_request_feea29` | Nieznana prośba o potwierdzenie |
| `keep_editing_624a83` | Edytuj dalej |
| `discard_eb1a70` | Odrzuć |
| `unsaved_changes_a710c2` | Niezapisane zmiany |
| `the_document_is_no_longer_open_use_save_as_671c50` | Dokument nie jest już otwarty. Użyj opcji „Zapisz jako”. |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Ten plik zawiera różne zakończenia linii lub nieprawidłowe kodowanie UTF-8. Użyj opcji „Zapisz jako”. |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | Zapisywanie poprzez dowiązanie symboliczne nie jest obsługiwane. Użyj opcji „Zapisz jako”. |
| `invalid_destination_14f03f` | Nieprawidłowy cel |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | Plik docelowy został zmieniony na dysku. Użyj opcji „Zapisz jako”, aby zachować zmiany. |
| `the_update_process_failed_010689` | Proces aktualizacji nie powiódł się. |
| `could_not_restore_the_open_document_69d724` | Nie można przywrócić otwartego dokumentu. |
| `could_not_restart_markdown_vision_6ead36` | Nie można ponownie uruchomić Markdown Vision. |
| `restart_is_not_available_on_this_platform_998ef6` | Ponowne uruchomienie nie jest dostępne na tej platformie. |
| `the_update_information_is_invalid_dbcffc` | Informacje o aktualizacji są nieprawidłowe. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Aktualizacje automatyczne wymagają zainstalowanego pakietu DEB lub RPM. |
| `this_architecture_is_not_supported_ae063c` | Ta architektura nie jest obsługiwana. |
| `could_not_identify_the_linux_distribution_18bbdb` | Nie udało się rozpoznać dystrybucji Linuksa. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | Menedżer pakietów RPM jest niedostępny. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision nie jest zainstalowany jako zgodny pakiet RPM. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Ta aktualizacja nie jest nowsza niż zainstalowany pakiet. |
| `the_debian_package_manager_is_unavailable_b5d66b` | Menedżer pakietów Debiana jest niedostępny. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision nie jest zainstalowany jako pakiet DEB. |
| `could_not_determine_the_installed_version_f1a1f1` | Nie można określić zainstalowanej wersji. |
| `could_not_compare_package_versions_465d4e` | Nie można porównać wersji pakietów. |
| `could_not_create_a_temporary_download_folder_36407c` | Nie można utworzyć tymczasowego folderu pobierania. |
| `could_not_start_the_download_b4acf0` | Nie można rozpocząć pobierania. |
| `the_update_could_not_be_downloaded_4d6fd7` | Nie można pobrać aktualizacji. |
| `could_not_verify_the_update_2cd2c5` | Nie można zweryfikować aktualizacji. |
| `the_downloaded_update_failed_verification_60519b` | Pobrana aktualizacja nie przeszła weryfikacji. |
| `could_not_inspect_the_update_package_9812b2` | Nie można sprawdzić pakietu aktualizacji. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | Pobrany pakiet zawiera nieoczekiwane metadane. |
| `version_dd1679` | Wersja |
| `could_not_start_the_system_installer_907ba2` | Nie można uruchomić instalatora systemu. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | Instalacja została anulowana lub nie powiodła się. Spróbuj ponownie. |
| `could_not_verify_the_installed_update_04a200` | Nie można zweryfikować zainstalowanej aktualizacji. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | Instalator nie zaktualizował Markdown Vision do oczekiwanej wersji. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Automatyczne aktualizacje DEB są dostępne tylko w systemie Linux. |
| `invalid_preferences_bc6b57` | Nieprawidłowe preferencje |
| `invalid_key_b06fe9` | Nieprawidłowy {key} |
| `unsupported_preferences_version_54734c` | Nieobsługiwana wersja preferencji |
| `missing_preferences_679970` | Brakujące preferencje |
| `invalid_preferences_directory_a6f362` | Nieprawidłowy katalog preferencji |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision nie mógł odczytać tego pliku. |
| `markdown_files_177420` | Pliki Markdown |
| `text_files_c5df15` | Pliki tekstowe |
| `all_files_866956` | Wszystkie pliki |
| `save_markdown_file_813f90` | Zapisz plik Markdown |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Ten dokument nie jest już otwarty. Otwórz ponownie plik lub użyj opcji Zapisz jako. |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Użyj opcji „Zapisz jako”, aby utworzyć kopię tego pliku w kodowaniu UTF-8. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | W tym pliku zastosowano mieszane zakończenia linii. Użyj opcji „Zapisz jako”, aby utworzyć kopię ze spójnymi zakończeniami linii. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows nie mógł otworzyć okna dialogowego „Zapisz jako”. |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | Wersja robocza nie mogła zostać zakodowana jako UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows nie mógł odczytać wybranego miejsca docelowego. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | Plik został zmieniony na dysku lub jest niedostępny. Użyj opcji „Zapisz jako”, aby zachować zmiany w osobnej kopii. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows nie mógł zapisać pliku. Sprawdź, czy plik nadaje się do zapisu lub użyj opcji Zapisz jako. |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows nie mógł przywrócić oryginalnego pliku podczas zapisywania. Oryginał znajduje się pod adresem {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | Nie można ukończyć żądania zapisania. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision nie mógł przygotować plików aplikacji w lokalnym folderze danych aplikacji. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Wymagane jest środowisko wykonawcze Microsoft Edge WebView2. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Instalator Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | Licencja pod GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | Ten instalator wymaga Windows na ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision działa. Przed kontynuowaniem zapisz wszystkie niezapisane dokumenty. Zamknąć Markdown Vision i kontynuować instalację? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | Instalator nie mógł zamknąć Markdown Vision. Zamknij go ręcznie i ponownie uruchom instalację. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision nadal działa. Zamknij program i wybierz opcję Spróbuj ponownie lub anuluj instalację. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Usuwanie aktualnie zainstalowanej wersji Markdown Vision… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | Nie udało się usunąć istniejącej instalacji Markdown Vision. Instalator zakończy działanie bez instalowania Markdown Vision Native. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | W ustawieniach systemu Windows można wybrać Markdown Vision jako domyślną aplikację do plików Markdown. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Otwórz ustawienia aplikacji domyślnych Windows po instalacji |
| `markdown_vision_has_been_installed_40d44f` | Zainstalowano Markdown Vision. |
| `open_markdown_vision_when_setup_closes_8422c7` | Otwórz Markdown Vision po zamknięciu instalatora |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Nie można zainstalować Markdown Vision Native. Instalacja zostanie zatrzymana bez zarejestrowania niekompletnej instalacji. |
| `markdown_document_00271f` | Dokument Markdown |
| `markdown_vision_preview_handler_8c95f7` | Markdown Vision Moduł obsługi podglądu |
| `markdown_file_viewer_c36ee7` | Przeglądarka plików Markdown |
| `uninstall_fe1995` | Odinstaluj |
| `markdown_vision_could_not_start_error_7950eb` | Nie można uruchomić Markdown Vision. {error} |
| `unknown_native_method_method_cc7ca9` | Nieznana metoda natywna: {method} |
| `text_71988c` | Tekst |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | Nagłówek {level} |
| `normal_text_a2adc4` | Normalny tekst |
| `footnotes_ad6fb5` | Przypisy |
| `size_px_8d05e6` | {size} pikseli |
| `link_text_insert_default` | tekst linku |
| `back_to_footnote_reference` | Wróć do odwołania do przypisu |

## Locale pt-br

Portuguese (Brazil)

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Formatação Markdown |
| `undo_a8283a` | Desfazer |
| `redo_742739` | Refazer |
| `bold_ctrl_b_84787d` | Negrito (Ctrl+B) |
| `bold_94fee6` | Negrito |
| `italic_ctrl_i_ccc60d` | Itálico (Ctrl+I) |
| `italic_9bf37c` | Itálico |
| `strikethrough_9aabbc` | Tachado |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Alternar entre níveis de título (H1–H6, depois, texto normal) |
| `cycle_heading_level_bde9c4` | Alternar entre níveis de título |
| `bulleted_list_ce51b3` | Lista com marcadores |
| `task_list_5d3253` | Lista de tarefas |
| `numbered_list_cc62f6` | Lista numerada |
| `quote_eb4cde` | Citação |
| `inline_code_e767de` | Código embutido |
| `code_block_754538` | Bloco de código |
| `link_a6a32d` | Link |
| `insert_table_67318e` | Inserir tabela |
| `edit_markdown_6ff388` | Editar Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | Novo arquivo Markdown (Ctrl+N) |
| `new_markdown_file_0928e9` | Novo arquivo Markdown |
| `open_markdown_file_b7764a` | Abrir arquivo Markdown |
| `print_ctrl_p_5c4406` | Imprimir (Ctrl+P) |
| `print_document_2a024b` | Imprimir documento |
| `search_text_38d268` | Buscar no texto |
| `settings_74a883` | Configurações |
| `switch_to_dark_mode_fc43ea` | Mudar para o modo escuro |
| `about_markdown_vision_08f9a5` | Sobre Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | Licença GNU GPLv3 |
| `version_version_a18745` | Versão {version} |
| `latest_version_checking_4bfedc` | Versão mais recente: verificando… |
| `update_c1c100` | Atualizar |
| `update_text_editor` | Atualizar texto |
| `keep_unchanged_editor` | Manter sem alterações |
| `check_for_updates_f26f32` | Verificar atualizações |
| `restart_markdown_vision_7e50f8` | Reiniciar Markdown Vision |
| `text_search_10155f` | Busca no texto |
| `count_match_ef9195` | {count} resultado da busca |
| `count_matches_43682a` | {count} resultados da busca |
| `previous_match_daa2f8` | Resultado anterior |
| `next_match_825e5a` | Próximo resultado |
| `close_search_55656b` | Fechar busca |
| `close_settings_0ccfef` | Fechar configurações |
| `variable_width_font_0836b2` | Fonte de largura variável |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Digite um nome de fonte ou escolha uma fonte instalada. |
| `fixed_width_font_3de094` | Fonte de largura fixa |
| `used_for_code_and_other_monospaced_text_84b6ed` | Usado para código e outros textos monoespaçados. |
| `text_size_d68761` | Tamanho do texto |
| `automatic_text_size_919785` | Tamanho de texto automático |
| `automatic_d461a4` | Automático |
| `line_spacing_0db45d` | Espaçamento entre linhas |
| `page_width_limit_19528b` | Limite de largura da página |
| `automatic_page_width_bd5c30` | Largura de página automática |
| `markdown_editor_da0ea6` | Editor Markdown |
| `editor_view_1d1833` | Visualização do editor |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown à esquerda, editor visual à direita |
| `split_0b61a1` | Dividir ↔ |
| `visual_above_markdown_a04e0f` | Editor visual acima do Markdown |
| `split_b3b924` | Dividir ↕ |
| `visual_ba3033` | Visual |
| `save_ctrl_s_4be89e` | Salvar (Ctrl+S) |
| `save_1509f5` | Salvar |
| `save_as_ctrl_shift_s_0f132a` | Salvar como (Ctrl+Shift+S) |
| `save_as_a4b76a` | Salvar como… |
| `markdown_source_580118` | Código-fonte Markdown |
| `markdown_pane_width_ab0129` | Largura do painel de Markdown |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% Visual |
| `visual_editor_5665dd` | Editor visual |
| `visual_editing_restriction_d42cea` | Restrição de edição visual |
| `edit_in_markdown_165fd4` | Editar em Markdown |
| `dismiss_48845b` | Fechar aviso |
| `count_word_1f505c` | Palavra {count} |
| `count_words_caab29` | Palavras {count} |
| `approximate_word_count_7b987a` | Contagem aproximada de palavras: {count} |
| `line_line_column_column_21e9f4` | Linha {line}, coluna {column} |
| `untitled_md_2dccf8` | Sem título.md |
| `save_your_changes_56dd16` | Salvar suas alterações? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Salve seu documento atual antes de criar um novo arquivo. |
| `cancel_19766e` | Cancelar |
| `discard_changes_f9bfa3` | Descartar alterações |
| `switch_to_light_mode_bfa0ca` | Mudar para o modo claro |
| `enter_the_name_of_any_installed_font_b57a72` | Digite o nome de qualquer fonte instalada. |
| `loading_installed_fonts_200c74` | Carregando fontes instaladas… |
| `count_fixed_width_font_available_5488f8` | Fontes de largura fixa disponíveis: {count} |
| `count_fixed_width_fonts_available_5df530` | Fontes de largura fixa disponíveis: {count} |
| `count_variable_width_font_available_583582` | Fontes de largura variável disponíveis: {count} |
| `count_variable_width_fonts_available_9d234c` | Fontes de largura variável disponíveis: {count} |
| `count_match_for_query_2e77ac` | Resultados da busca por “{query}”: {count} |
| `count_matches_for_query_7db710` | Resultados da busca por “{query}”: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | Nenhuma fonte de largura fixa corresponde a "{query}". |
| `no_variable_width_fonts_match_query_a64030` | Nenhuma fonte de largura variável corresponde a "{query}". |
| `current_of_total_35d900` | {current} de {total} |
| `current_of_total_scope_94ebe5` | {current} de {total} · {scope} |
| `copy_code_49a005` | Copiar código |
| `clipboard_unavailable_4ff69f` | Área de transferência indisponível |
| `code_copied_39868c` | Código copiado |
| `could_not_copy_code_4a563f` | Não foi possível copiar o código |
| `the_native_print_dialog_could_not_open_320714` | Não foi possível abrir a caixa de diálogo de impressão do sistema. |
| `could_not_open_the_print_dialog_4bd85a` | Não foi possível abrir a caixa de diálogo de impressão. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Descartar suas alterações não salvas e abrir outro documento? |
| `could_not_open_document_69abda` | Não foi possível abrir o documento |
| `release_check_failed_7b2758` | Falha ao verificar a versão |
| `unrecognized_release_list_62d1cb` | Lista de versões não reconhecida |
| `unrecognized_version_d1b8d2` | Versão não reconhecida |
| `latest_version_version_d1c996` | Versão mais recente: {version} |
| `unsupported_architecture_087e4f` | Arquitetura não suportada |
| `installer_verification_is_unavailable_98306d` | A verificação do instalador não está disponível |
| `unsupported_platform_a96892` | Plataforma não suportada |
| `latest_compatible_version_version_fa3079` | Última versão compatível: {version} |
| `upgrade_markdown_vision_de1b45` | Atualizar Markdown Vision |
| `download_macos_update_95d8f3` | Baixar atualização para macOS |
| `download_linux_update_707c5e` | Baixar atualização para Linux |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Não foi possível verificar se há atualizações. Verifique sua conexão com a Internet e tente novamente. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Baixando e verificando a atualização. Você pode ser solicitado a se autenticar. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Atualização instalada. Reinicie para usar a nova versão. |
| `update_failed_error_e4f7dc` | Falha na atualização: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Baixar e executar o instalador do Markdown Vision? Salve os documentos abertos primeiro. O instalador pode pedir para fechar o Markdown Vision. |
| `downloading_and_verifying_update_02b3ba` | Baixando e verificando a atualização… |
| `installer_started_865e10` | O instalador foi iniciado. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Não foi possível baixar, verificar ou iniciar o instalador. Por favor, tente novamente. |
| `discard_unsaved_changes_and_restart_6d1602` | Descartar alterações não salvas e reiniciar? |
| `could_not_restart_error_71e2d2` | Não foi possível reiniciar: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Clique duas vezes ou pressione Alt+Enter para editar este item |
| `saving_23e392` | Salvando… |
| `unsaved_6250d5` | Não salvo |
| `saved_b5c120` | Salvo |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Não foi possível salvar o rascunho. Suas alterações continuam no editor. |
| `embedded_content_1bca8f` | Conteúdo incorporado |
| `edit_table_source_c7189f` | Editar código-fonte da tabela |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Selecione uma célula para editá-la ou alterar a tabela. Pressione Alt+Enter enquanto digita. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Este bloco contém formatação que precisa ser editada em Markdown. |
| `code_contents_5a1f26` | Conteúdo do código |
| `type_directly_to_edit_this_indented_code_block_769291` | Digite diretamente neste bloco de código recuado para editá-lo. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Digite diretamente no bloco de código para editar seu conteúdo. Use Markdown para editar as linhas que marcam o início e o fim do bloco. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Use “Editar item da lista” para alterar o texto. Para alterar o nível de aninhamento, edite a lista em Markdown. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Use “Editar item da lista” ou as caixas de seleção para alterar esta lista. |
| `edit_list_item_text_a982e6` | Editar texto do item da lista |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Edite o texto do item diretamente. Edite a estrutura da lista em Markdown. |
| `task_4bc74b` | Tarefa |
| `edit_item_9f84ee` | Editar item da lista |
| `list_options_fc3320` | Opções da lista |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Esta tabela precisa ser editada em Markdown. |
| `add_text_to_this_empty_cell_37f900` | Adicione texto a esta célula vazia |
| `edit_this_cell_in_markdown_4304b1` | Editar esta célula em Markdown |
| `edit_table_cell_a4212e` | Editar célula da tabela |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Selecione uma célula para editá-la. Você pode editar a tabela subjacente em Markdown. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Esta célula contém HTML. Edite esta célula em Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | Esta célula usa referências Markdown. Edite esta célula em Markdown. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Digite para editar esta célula. Pressione Alt+Enter para ver as opções da tabela. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Digite diretamente nas células que contêm apenas texto simples. Para conteúdo mais complexo, use as opções da tabela ou edite o Markdown. |
| `table_options_cf924a` | Opções da tabela |
| `edit_note_299e60` | Editar nota |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Use “Editar nota” para alterar o texto editável da nota de rodapé. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | Este layout usa HTML. Edite-o em Markdown. |
| `edit_inline_code_bf93ee` | Editar código embutido |
| `edit_list_structure_in_markdown_17a222` | Editar estrutura de lista em Markdown |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Edite o texto simples da lista diretamente. Edite a estrutura da lista em Markdown. |
| `edit_code_in_table_cell_535cb9` | Editar código na célula da tabela |
| `edit_table_cell_text_ca30e7` | Editar o texto da célula da tabela |
| `edit_preformatted_text_9737bd` | Editar texto pré-formatado |
| `edit_disclosure_title_79fb92` | Editar o título da seção expansível |
| `edit_text_7967d9` | Editar texto |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Digite o texto da célula. Pressione Alt+Enter para opções de células. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Edite o texto diretamente. Edite a estrutura circundante em Markdown. |
| `edit_structure_in_markdown_fe607e` | Editar estrutura em Markdown |
| `edit_quoted_text_9de474` | Editar texto citado |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Edite o texto simples diretamente. Edite a estrutura do bloco de citação em Markdown. |
| `edit_heading_text_f3806c` | Editar texto do título |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Edite o texto do título diretamente. Edite o estilo do título em Markdown. |
| `heading_style_c0c25b` | Estilo de título |
| `edit_this_item_in_markdown_83b112` | Editar este item em Markdown |
| `markdown_only_f6e1f7` | Somente Markdown |
| `visual_only_29a136` | Somente editor visual |
| `action_64cff1` | Ação |
| `apply_31e392` | Aplicar |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | O Markdown mudou. Reabra este editor para tentar novamente. |
| `edit_list_item_f69436` | Editar item da lista |
| `item_text_markdown_0bbe7d` | Texto do item (Markdown) |
| `new_item_b84cad` | Novo item da lista |
| `enter_item_text_or_choose_remove_item_e4003a` | Insira o texto do item ou escolha Remover item. |
| `enter_item_text_82c7ea` | Insira o texto do item. |
| `add_item_below_a6d694` | Adicione o item abaixo |
| `remove_item_5a89ed` | Remover item |
| `indent_under_previous_item_2e6b03` | Aumentar o recuo sob o item anterior |
| `outdent_item_07e9b1` | Diminuir o recuo do item |
| `this_item_has_no_parent_to_outdent_from_dd148a` | Este item não tem um item superior do qual possa ser removido o recuo. |
| `heading_b34f17` | Título |
| `edit_footnote_cdcee6` | Editar nota de rodapé |
| `note_text_369e75` | Texto da nota de rodapé |
| `enter_the_note_text_on_one_line_3a7a5a` | Insira o texto da nota em uma linha. |
| `cell_text_9cd173` | Texto da célula |
| `add_row_below_3d4830` | Adicionar linha abaixo |
| `add_column_after_38817e` | Adicionar coluna depois |
| `new_column_editor` | Nova coluna |
| `remove_row_1810fd` | Remover linha |
| `remove_column_9807a2` | Remover coluna |
| `align_column_left_6d9399` | Alinhar coluna à esquerda |
| `center_column_1b9b8b` | Centralizar o conteúdo da coluna |
| `align_column_right_850a8f` | Alinhar coluna à direita |
| `cell_text_markdown_a9e5f9` | Texto da célula (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Feche o código embutido antes de adicionar uma quebra de linha. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Este texto de célula mudaria a estrutura da tabela. Adicione um espaço antes do separador em Markdown. |
| `alt_text_16f898` | Texto alternativo |
| `link_text_markdown_9b92bd` | Texto do link (Markdown) |
| `image_url_e55026` | URL da imagem |
| `link_url_9dfd0b` | URL do link |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | Editar imagem vinculada |
| `edit_image_d9d12b` | Editar imagem |
| `edit_link_94026c` | Editar link |
| `enter_text_without_a_closing_bracket_0e7315` | Insira o texto sem colchete de fechamento. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Insira um URL HTTP ou HTTPS sem espaços ou parênteses. |
| `visual_pane_height_4ad683` | Altura do painel visual |
| `return_to_reader_dcd8f7` | Voltar à visualização de leitura |
| `number_of_columns_2_8_893663` | Número de colunas (2–8) |
| `header_number_b79482` | Cabeçalho da coluna {number} |
| `cell_75fa38` | Célula |
| `open_1f1d59` | Abrir… |
| `new_18fdd5` | Novo |
| `print_07c371` | Imprimir… |
| `close_7d9eb7` | Fechar |
| `file_50009c` | Arquivo |
| `about_markdown_vision_c6d62d` | Sobre Markdown Vision… |
| `quit_markdown_vision_01c01b` | Sair do Markdown Vision |
| `quit_b3eb37` | Sair |
| `help_b79cac` | Ajuda |
| `could_not_enumerate_system_fonts_00e652` | Não foi possível obter a lista de fontes do sistema |
| `no_system_fonts_found_a8a9af` | Nenhuma fonte do sistema encontrada |
| `could_not_open_document_640c27` | Não foi possível abrir o documento |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | Não foi possível abrir o documento. Suas alterações atuais ainda estão disponíveis. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Descartar suas alterações não salvas e fechar Markdown Vision? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Descartar suas alterações não salvas e sair do Markdown Vision? |
| `unknown_confirmation_request_feea29` | Solicitação de confirmação desconhecida |
| `keep_editing_624a83` | Continue editando |
| `discard_eb1a70` | Descartar |
| `unsaved_changes_a710c2` | Alterações não salvas |
| `the_document_is_no_longer_open_use_save_as_671c50` | O documento não está mais aberto. Use “Salvar como”. |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Este arquivo contém finais de linha diferentes ou codificação UTF-8 inválida. Use “Salvar como”. |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | Não há suporte para salvar por meio de um link simbólico. Use “Salvar como”. |
| `invalid_destination_14f03f` | Destino inválido |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | O arquivo de destino foi alterado no disco. Use “Salvar como” para preservar suas edições. |
| `the_update_process_failed_010689` | O processo de atualização falhou. |
| `could_not_restore_the_open_document_69d724` | Não foi possível restaurar o documento aberto. |
| `could_not_restart_markdown_vision_6ead36` | Não foi possível reiniciar Markdown Vision. |
| `restart_is_not_available_on_this_platform_998ef6` | A reinicialização não está disponível nesta plataforma. |
| `the_update_information_is_invalid_dbcffc` | As informações de atualização são inválidas. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | As atualizações automáticas requerem um pacote DEB ou RPM instalado. |
| `this_architecture_is_not_supported_ae063c` | Esta arquitetura não é suportada. |
| `could_not_identify_the_linux_distribution_18bbdb` | Não foi possível identificar a distribuição Linux. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | O gerenciador de pacotes RPM não está disponível. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision não está instalado como um pacote RPM compatível. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Esta atualização não é mais recente que o pacote instalado. |
| `the_debian_package_manager_is_unavailable_b5d66b` | O gerenciador de pacotes Debian não está disponível. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision não está instalado como um pacote DEB. |
| `could_not_determine_the_installed_version_f1a1f1` | Não foi possível determinar a versão instalada. |
| `could_not_compare_package_versions_465d4e` | Não foi possível comparar as versões do pacote. |
| `could_not_create_a_temporary_download_folder_36407c` | Não foi possível criar uma pasta de download temporária. |
| `could_not_start_the_download_b4acf0` | Não foi possível iniciar o download. |
| `the_update_could_not_be_downloaded_4d6fd7` | Não foi possível baixar a atualização. |
| `could_not_verify_the_update_2cd2c5` | Não foi possível verificar a atualização. |
| `the_downloaded_update_failed_verification_60519b` | A atualização baixada falhou na verificação. |
| `could_not_inspect_the_update_package_9812b2` | Não foi possível inspecionar o pacote de atualização. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | O pacote baixado contém metadados inesperados. |
| `version_dd1679` | Versão |
| `could_not_start_the_system_installer_907ba2` | Não foi possível iniciar o instalador do sistema. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | A instalação foi cancelada ou falhou. Por favor, tente novamente. |
| `could_not_verify_the_installed_update_04a200` | Não foi possível verificar a atualização instalada. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | O instalador não atualizou Markdown Vision para a versão esperada. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | As atualizações automáticas de DEB estão disponíveis apenas em Linux. |
| `invalid_preferences_bc6b57` | Preferências inválidas |
| `invalid_key_b06fe9` | {key} inválido |
| `unsupported_preferences_version_54734c` | Versão de preferências não suportada |
| `missing_preferences_679970` | Preferências ausentes |
| `invalid_preferences_directory_a6f362` | Diretório de preferências inválido |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision não pôde ler este arquivo. |
| `markdown_files_177420` | Arquivos Markdown |
| `text_files_c5df15` | Arquivos de texto |
| `all_files_866956` | Todos os arquivos |
| `save_markdown_file_813f90` | Salvar arquivo Markdown |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Este documento não está mais aberto. Abra novamente o arquivo ou use “Salvar como”. |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Use “Salvar como” para criar uma cópia deste arquivo com codificação UTF-8. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | Este arquivo usa finais de linha diferentes. Use “Salvar como” para criar uma cópia com finais de linha uniformes. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows não pôde abrir a caixa de diálogo “Salvar como”. |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | O rascunho não pôde ser codificado como UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows não conseguiu ler o destino selecionado. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | O arquivo foi alterado no disco ou está indisponível. Use “Salvar como” para manter suas edições em uma cópia separada. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | O Windows não conseguiu salvar o arquivo. Verifique se é possível gravar no arquivo ou use “Salvar como”. |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows não pôde restaurar o arquivo original durante o salvamento. O original está em {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | A solicitação de salvamento não pôde ser concluída. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | O Markdown Vision não conseguiu preparar seus arquivos na pasta local de dados do aplicativo. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | O tempo de execução do Microsoft Edge WebView2 é necessário. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Instalador do Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | Licenciado sob GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | Este instalador requer Windows no ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision está em execução. Salve todos os documentos não salvos antes de continuar. Fechar Markdown Vision e continuar a instalação? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | O instalador não conseguiu fechar o Markdown Vision. Feche-o manualmente e execute o instalador novamente. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision ainda está em execução. Feche-o e selecione Tentar novamente ou cancele a instalação. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Removendo a edição Markdown Vision atualmente instalada… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | Não foi possível remover a instalação existente do Markdown Vision. O instalador será encerrado sem instalar o Markdown Vision Native. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | Nas configurações do Windows, você pode escolher o Markdown Vision como aplicativo padrão para arquivos Markdown. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Abrir as configurações de aplicativos padrão do Windows após a instalação |
| `markdown_vision_has_been_installed_40d44f` | O Markdown Vision foi instalado. |
| `open_markdown_vision_when_setup_closes_8422c7` | Abrir o Markdown Vision ao fechar o instalador |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native não pôde ser instalado. A instalação será interrompida sem registrar uma instalação incompleta. |
| `markdown_document_00271f` | Documento Markdown |
| `markdown_vision_preview_handler_8c95f7` | Manipulador de visualização Markdown Vision |
| `markdown_file_viewer_c36ee7` | Visualizador de arquivo Markdown |
| `uninstall_fe1995` | Desinstalar |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision não pôde ser iniciado. {error} |
| `unknown_native_method_method_cc7ca9` | Método nativo desconhecido: {method} |
| `text_71988c` | Texto |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | Título {level} |
| `normal_text_a2adc4` | Texto normal |
| `footnotes_ad6fb5` | Notas de rodapé |
| `size_px_8d05e6` | {size}px |
| `link_text_insert_default` | texto do link |
| `back_to_footnote_reference` | Voltar à referência da nota de rodapé |

## Locale ru

Russian

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Форматирование Markdown |
| `undo_a8283a` | Отменить |
| `redo_742739` | Повторить |
| `bold_ctrl_b_84787d` | Полужирный (Ctrl+B) |
| `bold_94fee6` | Полужирный |
| `italic_ctrl_i_ccc60d` | Курсив (Ctrl+I) |
| `italic_9bf37c` | Курсив |
| `strikethrough_9aabbc` | Зачеркивание |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Поочерёдно менять уровень заголовка (H1–H6, затем обычный текст) |
| `cycle_heading_level_bde9c4` | Поочерёдно менять уровень заголовка |
| `bulleted_list_ce51b3` | Маркированный список |
| `task_list_5d3253` | Список задач |
| `numbered_list_cc62f6` | Нумерованный список |
| `quote_eb4cde` | Цитата |
| `inline_code_e767de` | Встроенный код |
| `code_block_754538` | Кодовый блок |
| `link_a6a32d` | Ссылка |
| `insert_table_67318e` | Вставить таблицу |
| `edit_markdown_6ff388` | Редактировать Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | Новый файл Markdown (Ctrl+N) |
| `new_markdown_file_0928e9` | Новый файл Markdown |
| `open_markdown_file_b7764a` | Открыть файл Markdown |
| `print_ctrl_p_5c4406` | Распечатать (Ctrl+P) |
| `print_document_2a024b` | Распечатать документ |
| `search_text_38d268` | Найти в тексте |
| `settings_74a883` | Настройки |
| `switch_to_dark_mode_fc43ea` | Переключиться в темный режим |
| `about_markdown_vision_08f9a5` | О Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | Лицензия GNU GPLv3 |
| `version_version_a18745` | Версия {version} |
| `latest_version_checking_4bfedc` | Последняя версия: проверка… |
| `update_c1c100` | Обновить |
| `update_text_editor` | Обновить текст |
| `keep_unchanged_editor` | Оставить без изменений |
| `check_for_updates_f26f32` | Проверьте наличие обновлений |
| `restart_markdown_vision_7e50f8` | Перезапустить Markdown Vision |
| `text_search_10155f` | Поиск в тексте |
| `count_match_ef9195` | {count} результат поиска |
| `count_matches_43682a` | {count} результатов поиска |
| `previous_match_daa2f8` | Предыдущий результат поиска |
| `next_match_825e5a` | Следующий результат поиска |
| `close_search_55656b` | Закрыть поиск |
| `close_settings_0ccfef` | Закрыть настройки |
| `variable_width_font_0836b2` | Пропорциональный шрифт |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Введите имя шрифта или выберите установленный шрифт. |
| `fixed_width_font_3de094` | Моноширинный шрифт |
| `used_for_code_and_other_monospaced_text_84b6ed` | Используется для кода и другого моноширинного текста. |
| `text_size_d68761` | Размер текста |
| `automatic_text_size_919785` | Автоматический размер текста |
| `automatic_d461a4` | Автоматический |
| `line_spacing_0db45d` | Межстрочный интервал |
| `page_width_limit_19528b` | Ограничение ширины страницы |
| `automatic_page_width_bd5c30` | Автоматическая ширина страницы |
| `markdown_editor_da0ea6` | Редактор Markdown |
| `editor_view_1d1833` | Вид редактора |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown слева, визуальный редактор справа |
| `split_0b61a1` | Разделить ↔ |
| `visual_above_markdown_a04e0f` | Визуальный редактор над Markdown |
| `split_b3b924` | Разделить ↕ |
| `visual_ba3033` | Визуальный |
| `save_ctrl_s_4be89e` | Сохранить (Ctrl+S) |
| `save_1509f5` | Сохранить |
| `save_as_ctrl_shift_s_0f132a` | Сохранить как (Ctrl+Shift+S) |
| `save_as_a4b76a` | Сохранить как… |
| `markdown_source_580118` | Источник Markdown |
| `markdown_pane_width_ab0129` | Ширина панели Markdown |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% Визуальный |
| `visual_editor_5665dd` | Визуальный редактор |
| `visual_editing_restriction_d42cea` | Ограничение визуального редактирования |
| `edit_in_markdown_165fd4` | Редактировать в Markdown |
| `dismiss_48845b` | Закрыть уведомление |
| `count_word_1f505c` | слово {count} |
| `count_words_caab29` | Слова {count} |
| `approximate_word_count_7b987a` | Примерное число слов: {count} |
| `line_line_column_column_21e9f4` | Строка {line}, столбец {column} |
| `untitled_md_2dccf8` | Без названия.md |
| `save_your_changes_56dd16` | Сохранить изменения? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Сохраните текущий документ перед созданием нового файла. |
| `cancel_19766e` | Отмена |
| `discard_changes_f9bfa3` | Отбросить изменения |
| `switch_to_light_mode_bfa0ca` | Переключиться на светлую тему |
| `enter_the_name_of_any_installed_font_b57a72` | Введите имя любого установленного шрифта. |
| `loading_installed_fonts_200c74` | Загрузка установленных шрифтов… |
| `count_fixed_width_font_available_5488f8` | Доступные моноширинные шрифты: {count} |
| `count_fixed_width_fonts_available_5df530` | Доступные моноширинные шрифты: {count} |
| `count_variable_width_font_available_583582` | Доступные пропорциональные шрифты: {count} |
| `count_variable_width_fonts_available_9d234c` | Доступные пропорциональные шрифты: {count} |
| `count_match_for_query_2e77ac` | Результаты поиска по запросу «{query}»: {count} |
| `count_matches_for_query_7db710` | Результаты поиска по запросу «{query}»: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | Нет моноширинных шрифтов, соответствующих «{query}». |
| `no_variable_width_fonts_match_query_a64030` | Нет пропорциональных шрифтов, соответствующих «{query}». |
| `current_of_total_35d900` | {current} из {total} |
| `current_of_total_scope_94ebe5` | {current} из {total} · {scope} |
| `copy_code_49a005` | Скопировать код |
| `clipboard_unavailable_4ff69f` | Буфер обмена недоступен |
| `code_copied_39868c` | Код скопирован |
| `could_not_copy_code_4a563f` | Не удалось скопировать код |
| `the_native_print_dialog_could_not_open_320714` | Не удалось открыть системный диалог печати. |
| `could_not_open_the_print_dialog_4bd85a` | Не удалось открыть диалоговое окно печати. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Отбросить несохранённые изменения и открыть другой документ? |
| `could_not_open_document_69abda` | Не удалось открыть документ: |
| `release_check_failed_7b2758` | Не удалось проверить версию |
| `unrecognized_release_list_62d1cb` | Некорректный список версий |
| `unrecognized_version_d1b8d2` | Неопознанная версия |
| `latest_version_version_d1c996` | Последняя версия: {version} |
| `unsupported_architecture_087e4f` | Неподдерживаемая архитектура |
| `installer_verification_is_unavailable_98306d` | Проверка установщика недоступна |
| `unsupported_platform_a96892` | Неподдерживаемая платформа |
| `latest_compatible_version_version_fa3079` | Последняя совместимая версия: {version} |
| `upgrade_markdown_vision_de1b45` | Обновить Markdown Vision |
| `download_macos_update_95d8f3` | Скачать обновление для macOS |
| `download_linux_update_707c5e` | Скачать обновление для Linux |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Невозможно проверить наличие обновлений. Проверьте подключение к Интернету и повторите попытку. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Загрузка и проверка обновления. Вас могут попросить пройти аутентификацию. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Обновление установлено. Перезапустите приложение, чтобы использовать новую версию. |
| `update_failed_error_e4f7dc` | Обновление не выполнено: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Скачать и запустить установщик Markdown Vision? Сначала сохраните все открытые документы. Программа установки может попросить закрыть Markdown Vision. |
| `downloading_and_verifying_update_02b3ba` | Загрузка и проверка обновления… |
| `installer_started_865e10` | Установщик запустился. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Не удалось загрузить, проверить или запустить установщик. Пожалуйста, попробуйте еще раз. |
| `discard_unsaved_changes_and_restart_6d1602` | Отбросить несохранённые изменения и перезапустить? |
| `could_not_restart_error_71e2d2` | Не удалось перезапустить: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Дважды щелкните или нажмите Alt+Enter, чтобы отредактировать этот элемент |
| `saving_23e392` | Сохранение… |
| `unsaved_6250d5` | Не сохранено |
| `saved_b5c120` | Сохранено |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Не удалось сохранить черновик. Ваши изменения остались в редакторе. |
| `embedded_content_1bca8f` | Встроенный контент |
| `edit_table_source_c7189f` | Изменить источник таблицы |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Выберите ячейку, чтобы отредактировать ее или изменить таблицу. Нажмите Alt+Enter во время набора текста. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Этот блок содержит форматирование, которое необходимо отредактировать в Markdown. |
| `code_contents_5a1f26` | Содержимое кода |
| `type_directly_to_edit_this_indented_code_block_769291` | Вводите текст прямо в этом блоке кода с отступом, чтобы изменить его содержимое. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Вводите текст прямо в блоке кода, чтобы изменить его содержимое. Строки, обозначающие начало и конец блока, редактируйте в Markdown. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Чтобы изменить текст, выберите «Изменить элемент списка». Для изменения вложенности отредактируйте список в Markdown. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Чтобы изменить список, выберите «Изменить элемент списка» или воспользуйтесь флажками. |
| `edit_list_item_text_a982e6` | Редактировать текст элемента списка |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Редактируйте текст элемента напрямую. Отредактируйте структуру списка в Markdown. |
| `task_4bc74b` | Задача |
| `edit_item_9f84ee` | Изменить элемент списка |
| `list_options_fc3320` | Параметры списка |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Эту таблицу необходимо отредактировать в Markdown. |
| `add_text_to_this_empty_cell_37f900` | Добавьте текст в эту пустую ячейку |
| `edit_this_cell_in_markdown_4304b1` | Отредактируйте эту ячейку в Markdown |
| `edit_table_cell_a4212e` | Редактировать ячейку таблицы |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Выберите ячейку, чтобы отредактировать ее. Вы можете редактировать базовую таблицу в Markdown. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Эта ячейка содержит HTML. Отредактируйте эту ячейку в Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | В этой ячейке используются ссылки Markdown. Отредактируйте эту ячейку в Markdown. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Вводите текст, чтобы изменить эту ячейку. Нажмите Alt+Enter, чтобы просмотреть параметры таблицы. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Вводите текст прямо в ячейки, содержащие только обычный текст. Для более сложного содержимого используйте параметры таблицы или редактируйте Markdown. |
| `table_options_cf924a` | Параметры таблицы |
| `edit_note_299e60` | Изменить сноску |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Чтобы изменить редактируемый текст сноски, выберите «Изменить сноску». |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | В этом макете используется HTML. Отредактируйте его в Markdown. |
| `edit_inline_code_bf93ee` | Редактировать встроенный код |
| `edit_list_structure_in_markdown_17a222` | Редактировать структуру списка в Markdown |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Отредактируйте простой текст списка напрямую. Отредактируйте структуру списка в Markdown. |
| `edit_code_in_table_cell_535cb9` | Изменить код в ячейке таблицы |
| `edit_table_cell_text_ca30e7` | Редактировать текст ячейки таблицы |
| `edit_preformatted_text_9737bd` | Редактировать предварительно отформатированный текст |
| `edit_disclosure_title_79fb92` | Изменить заголовок раскрываемого раздела |
| `edit_text_7967d9` | Редактировать текст |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Введите текст ячейки. Нажмите Alt+Enter, чтобы просмотреть параметры ячейки. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Отредактируйте текст напрямую. Отредактируйте окружающую структуру в Markdown. |
| `edit_structure_in_markdown_fe607e` | Редактировать структуру в Markdown |
| `edit_quoted_text_9de474` | Редактировать цитируемый текст |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Редактируйте обычный текст напрямую. Изменяйте структуру блока цитаты в Markdown. |
| `edit_heading_text_f3806c` | Редактировать текст заголовка |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Отредактируйте текст заголовка напрямую. Отредактируйте стиль заголовка в Markdown. |
| `heading_style_c0c25b` | Стиль заголовка |
| `edit_this_item_in_markdown_83b112` | Отредактируйте этот элемент в Markdown |
| `markdown_only_f6e1f7` | Только в Markdown |
| `visual_only_29a136` | Только в визуальном редакторе |
| `action_64cff1` | Действие |
| `apply_31e392` | Применить |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Код Markdown изменился. Откройте этот редактор заново и повторите попытку. |
| `edit_list_item_f69436` | Изменить элемент списка |
| `item_text_markdown_0bbe7d` | Текст элемента (Markdown) |
| `new_item_b84cad` | Новый элемент списка |
| `enter_item_text_or_choose_remove_item_e4003a` | Введите текст или выберите «Удалить элемент списка». |
| `enter_item_text_82c7ea` | Введите текст элемента. |
| `add_item_below_a6d694` | Добавить элемент ниже |
| `remove_item_5a89ed` | Удалить элемент списка |
| `indent_under_previous_item_2e6b03` | Вложить в предыдущий пункт |
| `outdent_item_07e9b1` | Уменьшить отступ элемента |
| `this_item_has_no_parent_to_outdent_from_dd148a` | У элемента нет родительского элемента, поэтому уменьшить отступ нельзя. |
| `heading_b34f17` | Заголовок |
| `edit_footnote_cdcee6` | Изменить сноску |
| `note_text_369e75` | Текст сноски |
| `enter_the_note_text_on_one_line_3a7a5a` | Введите текст заметки в одну строку. |
| `cell_text_9cd173` | Текст ячейки |
| `add_row_below_3d4830` | Добавить строку ниже |
| `add_column_after_38817e` | Добавить столбец после |
| `new_column_editor` | Новый столбец |
| `remove_row_1810fd` | Удалить строку |
| `remove_column_9807a2` | Удалить столбец |
| `align_column_left_6d9399` | Выровнять столбец по левому краю |
| `center_column_1b9b8b` | Выровнять содержимое столбца по центру |
| `align_column_right_850a8f` | Выровнять столбец по правому краю |
| `cell_text_markdown_a9e5f9` | Текст ячейки (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Закройте встроенный код перед добавлением разрыва строки. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Этот текст ячейки изменит структуру таблицы. Добавьте пробел перед разделителем в Markdown. |
| `alt_text_16f898` | Альтернативный текст |
| `link_text_markdown_9b92bd` | Текст ссылки (Markdown) |
| `image_url_e55026` | URL-адрес изображения |
| `link_url_9dfd0b` | URL-адрес ссылки |
| `url_e7a241` | URL-адрес |
| `edit_linked_image_2f9456` | Изменить связанное изображение |
| `edit_image_d9d12b` | Редактировать изображение |
| `edit_link_94026c` | Изменить ссылку |
| `enter_text_without_a_closing_bracket_0e7315` | Введите текст без закрывающей скобки. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Введите URL-адрес HTTP или HTTPS без пробелов и круглых скобок. |
| `visual_pane_height_4ad683` | Высота визуальной панели |
| `return_to_reader_dcd8f7` | Вернуться в режим чтения |
| `number_of_columns_2_8_893663` | Количество столбцов (2–8) |
| `header_number_b79482` | Заголовок столбца {number} |
| `cell_75fa38` | Ячейка |
| `open_1f1d59` | Открыть… |
| `new_18fdd5` | Новый |
| `print_07c371` | Распечатать… |
| `close_7d9eb7` | Закрыть |
| `file_50009c` | Файл |
| `about_markdown_vision_c6d62d` | О Markdown Vision… |
| `quit_markdown_vision_01c01b` | Выйти из Markdown Vision |
| `quit_b3eb37` | Выход |
| `help_b79cac` | Справка |
| `could_not_enumerate_system_fonts_00e652` | Не удалось перечислить системные шрифты |
| `no_system_fonts_found_a8a9af` | Системные шрифты не найдены |
| `could_not_open_document_640c27` | Не удалось открыть документ |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | Документ не удалось открыть. Текущие изменения все еще доступны. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Отбросить несохранённые изменения и закрыть Markdown Vision? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Отбросить несохранённые изменения и выйти из Markdown Vision? |
| `unknown_confirmation_request_feea29` | Неизвестный запрос подтверждения |
| `keep_editing_624a83` | Продолжить редактирование |
| `discard_eb1a70` | Отбросить |
| `unsaved_changes_a710c2` | Несохранённые изменения |
| `the_document_is_no_longer_open_use_save_as_671c50` | Документ больше не открыт. Используйте «Сохранить как». |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Этот файл имеет смешанные окончания строк или неверный UTF-8. Используйте «Сохранить как». |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | Сохранение через символическую ссылку не поддерживается. Используйте «Сохранить как». |
| `invalid_destination_14f03f` | Неверный пункт назначения |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | Файл назначения изменился на диске. Используйте «Сохранить как», чтобы сохранить изменения. |
| `the_update_process_failed_010689` | Процесс обновления не удался. |
| `could_not_restore_the_open_document_69d724` | Не удалось восстановить открытый документ. |
| `could_not_restart_markdown_vision_6ead36` | Не удалось перезапустить Markdown Vision. |
| `restart_is_not_available_on_this_platform_998ef6` | Перезапуск недоступен на этой платформе. |
| `the_update_information_is_invalid_dbcffc` | Информация об обновлении недействительна. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Для автоматических обновлений требуется установленный пакет DEB или RPM. |
| `this_architecture_is_not_supported_ae063c` | Эта архитектура не поддерживается. |
| `could_not_identify_the_linux_distribution_18bbdb` | Не удалось идентифицировать дистрибутив Linux. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | Менеджер пакетов RPM недоступен. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision не установлен как совместимый пакет RPM. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Это обновление не новее установленного пакета. |
| `the_debian_package_manager_is_unavailable_b5d66b` | Менеджер пакетов Debian недоступен. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision не установлен как пакет DEB. |
| `could_not_determine_the_installed_version_f1a1f1` | Не удалось определить установленную версию. |
| `could_not_compare_package_versions_465d4e` | Не удалось сравнить версии пакетов. |
| `could_not_create_a_temporary_download_folder_36407c` | Не удалось создать временную папку загрузки. |
| `could_not_start_the_download_b4acf0` | Не удалось начать загрузку. |
| `the_update_could_not_be_downloaded_4d6fd7` | Обновление не удалось загрузить. |
| `could_not_verify_the_update_2cd2c5` | Не удалось проверить обновление. |
| `the_downloaded_update_failed_verification_60519b` | Загруженное обновление не прошло проверку. |
| `could_not_inspect_the_update_package_9812b2` | Не удалось проверить пакет обновления. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | Загруженный пакет содержит неожиданные метаданные. |
| `version_dd1679` | Версия |
| `could_not_start_the_system_installer_907ba2` | Не удалось запустить установщик системы. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | Установка была отменена или не удалась. Пожалуйста, попробуйте еще раз. |
| `could_not_verify_the_installed_update_04a200` | Не удалось проверить установленное обновление. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | Установщик не обновил Markdown Vision до ожидаемой версии. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Автоматические обновления DEB доступны только на Linux. |
| `invalid_preferences_bc6b57` | Неверные настройки |
| `invalid_key_b06fe9` | Неверный {key} |
| `unsupported_preferences_version_54734c` | Неподдерживаемая версия настроек |
| `missing_preferences_679970` | Отсутствуют настройки |
| `invalid_preferences_directory_a6f362` | Неверный каталог настроек |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision не смог прочитать этот файл. |
| `markdown_files_177420` | Файлы Markdown |
| `text_files_c5df15` | Текстовые файлы |
| `all_files_866956` | Все файлы |
| `save_markdown_file_813f90` | Сохранить файл Markdown |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Этот документ больше не открыт. Откройте файл повторно или используйте «Сохранить как». |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Используйте «Сохранить как», чтобы создать копию этого файла в кодировке UTF-8. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | В этом файле используются смешанные окончания строк. Используйте «Сохранить как», чтобы создать копию с одинаковыми окончаниями строк. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows не удалось открыть диалоговое окно «Сохранить как». |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | Черновик не удалось закодировать как UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows не удалось прочитать выбранное место назначения. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | Файл изменён на диске или недоступен. Используйте «Сохранить как», чтобы сохранить изменения в отдельной копии. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows не удалось сохранить файл. Убедитесь, что файл доступен для записи, или используйте «Сохранить как». |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows не смог восстановить исходный файл во время сохранения. Оригинал находится по адресу {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | Запрос на сохранение не удалось выполнить. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision не удалось подготовить файлы приложения в локальной папке данных приложения. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Требуется среда выполнения Microsoft Edge WebView2. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Установка Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | Лицензия GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | Для этого установщика требуется Windows на ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision работает. Прежде чем продолжить, сохраните все несохранённые документы. Закрыть Markdown Vision и продолжить установку? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | Программе установки не удалось закрыть Markdown Vision. Закройте его вручную и снова запустите установку. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision всё ещё работает. Закройте его и выберите «Повторить» или отмените установку. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Удаление установленной на данный момент версии Markdown Vision… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | Не удалось удалить существующую версию Markdown Vision. Программа установки завершит работу без установки Markdown Vision Native. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | В параметрах Windows можно выбрать Markdown Vision приложением по умолчанию для файлов Markdown. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Открыть параметры приложений по умолчанию Windows после установки |
| `markdown_vision_has_been_installed_40d44f` | Приложение Markdown Vision установлено. |
| `open_markdown_vision_when_setup_closes_8422c7` | Открыть Markdown Vision после закрытия программы установки |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native не удалось установить. Установка прекратится без регистрации незавершенной установки. |
| `markdown_document_00271f` | Документ Markdown |
| `markdown_vision_preview_handler_8c95f7` | Обработчик предварительного просмотра Markdown Vision |
| `markdown_file_viewer_c36ee7` | Просмотрщик файлов Markdown |
| `uninstall_fe1995` | Удалить |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision не удалось запустить. {error} |
| `unknown_native_method_method_cc7ca9` | Неизвестный собственный метод: {method} |
| `text_71988c` | Текст |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | Заголовок {level} |
| `normal_text_a2adc4` | Обычный текст |
| `footnotes_ad6fb5` | Сноски |
| `size_px_8d05e6` | {size} px |
| `link_text_insert_default` | текст ссылки |
| `back_to_footnote_reference` | Вернуться к ссылке на сноску |

## Locale es

Spanish

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Formato Markdown |
| `undo_a8283a` | Deshacer |
| `redo_742739` | Rehacer |
| `bold_ctrl_b_84787d` | Negrita (Ctrl+B) |
| `bold_94fee6` | Negrita |
| `italic_ctrl_i_ccc60d` | Cursiva (Ctrl+I) |
| `italic_9bf37c` | Cursiva |
| `strikethrough_9aabbc` | Tachado |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Recorrer los niveles de encabezado (H1–H6 y, después, texto normal) |
| `cycle_heading_level_bde9c4` | Alternar entre niveles de encabezado |
| `bulleted_list_ce51b3` | Lista con viñetas |
| `task_list_5d3253` | Lista de tareas |
| `numbered_list_cc62f6` | Lista numerada |
| `quote_eb4cde` | Cita |
| `inline_code_e767de` | Código en línea |
| `code_block_754538` | Bloque de código |
| `link_a6a32d` | Enlace |
| `insert_table_67318e` | Insertar tabla |
| `edit_markdown_6ff388` | Editar Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | Nuevo archivo Markdown (Ctrl+N) |
| `new_markdown_file_0928e9` | Nuevo archivo Markdown |
| `open_markdown_file_b7764a` | Abrir archivo Markdown |
| `print_ctrl_p_5c4406` | Imprimir (Ctrl+P) |
| `print_document_2a024b` | Imprimir documento |
| `search_text_38d268` | Buscar en el texto |
| `settings_74a883` | Configuración |
| `switch_to_dark_mode_fc43ea` | Cambiar al modo oscuro |
| `about_markdown_vision_08f9a5` | Acerca de Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | Licencia GNU GPLv3 |
| `version_version_a18745` | Versión {version} |
| `latest_version_checking_4bfedc` | Última versión: comprobando… |
| `update_c1c100` | Actualizar |
| `update_text_editor` | Actualizar texto |
| `keep_unchanged_editor` | Mantener sin cambios |
| `check_for_updates_f26f32` | Buscar actualizaciones |
| `restart_markdown_vision_7e50f8` | Reiniciar Markdown Vision |
| `text_search_10155f` | Búsqueda en el texto |
| `count_match_ef9195` | {count} resultado de búsqueda |
| `count_matches_43682a` | {count} resultados de búsqueda |
| `previous_match_daa2f8` | Resultado anterior |
| `next_match_825e5a` | Resultado siguiente |
| `close_search_55656b` | Cerrar búsqueda |
| `close_settings_0ccfef` | Cerrar configuración |
| `variable_width_font_0836b2` | Fuente proporcional |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Escriba un nombre de fuente o elija una fuente instalada. |
| `fixed_width_font_3de094` | Fuente monoespaciada |
| `used_for_code_and_other_monospaced_text_84b6ed` | Se utiliza para código y otro texto monoespaciado. |
| `text_size_d68761` | Tamaño del texto |
| `automatic_text_size_919785` | Tamaño de texto automático |
| `automatic_d461a4` | Automático |
| `line_spacing_0db45d` | Interlineado |
| `page_width_limit_19528b` | Límite de ancho de página |
| `automatic_page_width_bd5c30` | Ancho de página automático |
| `markdown_editor_da0ea6` | Editor Markdown |
| `editor_view_1d1833` | Vista del editor |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown a la izquierda, editor visual a la derecha |
| `split_0b61a1` | Dividir ↔ |
| `visual_above_markdown_a04e0f` | Editor visual encima de Markdown |
| `split_b3b924` | Dividir ↕ |
| `visual_ba3033` | Visual |
| `save_ctrl_s_4be89e` | Guardar (Ctrl+S) |
| `save_1509f5` | Guardar |
| `save_as_ctrl_shift_s_0f132a` | Guardar como (Ctrl+Shift+S) |
| `save_as_a4b76a` | Guardar como… |
| `markdown_source_580118` | Código Markdown |
| `markdown_pane_width_ab0129` | Ancho del panel de Markdown |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% visual |
| `visual_editor_5665dd` | Editor visual |
| `visual_editing_restriction_d42cea` | Restricción de edición visual |
| `edit_in_markdown_165fd4` | Editar en Markdown |
| `dismiss_48845b` | Cerrar aviso |
| `count_word_1f505c` | {count} palabra |
| `count_words_caab29` | {count} palabras |
| `approximate_word_count_7b987a` | Número aproximado de palabras: {count} |
| `line_line_column_column_21e9f4` | Línea {line}, columna {column} |
| `untitled_md_2dccf8` | Sin título.md |
| `save_your_changes_56dd16` | ¿Guardar los cambios? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Guarde su documento actual antes de crear un nuevo archivo. |
| `cancel_19766e` | Cancelar |
| `discard_changes_f9bfa3` | Descartar cambios |
| `switch_to_light_mode_bfa0ca` | Cambiar al modo claro |
| `enter_the_name_of_any_installed_font_b57a72` | Escriba el nombre de cualquier fuente instalada. |
| `loading_installed_fonts_200c74` | Cargando fuentes instaladas… |
| `count_fixed_width_font_available_5488f8` | Fuentes monoespaciadas disponibles: {count} |
| `count_fixed_width_fonts_available_5df530` | Fuentes monoespaciadas disponibles: {count} |
| `count_variable_width_font_available_583582` | Fuentes proporcionales disponibles: {count} |
| `count_variable_width_fonts_available_9d234c` | Fuentes proporcionales disponibles: {count} |
| `count_match_for_query_2e77ac` | Resultados de búsqueda para «{query}»: {count} |
| `count_matches_for_query_7db710` | Resultados de búsqueda para «{query}»: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | Ninguna fuente monoespaciada coincide con "{query}". |
| `no_variable_width_fonts_match_query_a64030` | Ninguna fuente proporcional coincide con "{query}". |
| `current_of_total_35d900` | {current} de {total} |
| `current_of_total_scope_94ebe5` | {current} de {total} · {scope} |
| `copy_code_49a005` | Copiar código |
| `clipboard_unavailable_4ff69f` | Portapapeles no disponible |
| `code_copied_39868c` | Código copiado |
| `could_not_copy_code_4a563f` | No se pudo copiar el código |
| `the_native_print_dialog_could_not_open_320714` | No se pudo abrir el cuadro de diálogo de impresión del sistema. |
| `could_not_open_the_print_dialog_4bd85a` | No se pudo abrir el cuadro de diálogo de impresión. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | ¿Descartar los cambios no guardados y abrir otro documento? |
| `could_not_open_document_69abda` | No se pudo abrir el documento |
| `release_check_failed_7b2758` | No se pudo comprobar la versión |
| `unrecognized_release_list_62d1cb` | Lista de versiones no reconocidas |
| `unrecognized_version_d1b8d2` | Versión no reconocida |
| `latest_version_version_d1c996` | Última versión: {version} |
| `unsupported_architecture_087e4f` | Arquitectura no compatible |
| `installer_verification_is_unavailable_98306d` | La verificación del instalador no está disponible |
| `unsupported_platform_a96892` | Plataforma no compatible |
| `latest_compatible_version_version_fa3079` | Última versión compatible: {version} |
| `upgrade_markdown_vision_de1b45` | Actualizar Markdown Vision |
| `download_macos_update_95d8f3` | Descargar la actualización para macOS |
| `download_linux_update_707c5e` | Descargar la actualización para Linux |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | No se pueden buscar actualizaciones. Verifique su conexión a Internet e inténtelo nuevamente. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Descargando y verificando la actualización. Es posible que se le solicite que se autentique. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Actualización instalada. Reinicie para usar la nueva versión. |
| `update_failed_error_e4f7dc` | Error en la actualización: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | ¿Descargar y ejecutar el instalador de Markdown Vision? Guarde primero los documentos abiertos. Es posible que el instalador le pida cerrar Markdown Vision. |
| `downloading_and_verifying_update_02b3ba` | Descargando y verificando la actualización… |
| `installer_started_865e10` | Se inició el instalador. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | No se pudo descargar, verificar o iniciar el instalador. Inténtelo de nuevo. |
| `discard_unsaved_changes_and_restart_6d1602` | ¿Descartar los cambios no guardados y reiniciar? |
| `could_not_restart_error_71e2d2` | No se pudo reiniciar: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Haga doble clic o presione Alt+Enter para editar este elemento |
| `saving_23e392` | Guardando… |
| `unsaved_6250d5` | No guardado |
| `saved_b5c120` | Guardado |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | No se pudo guardar el borrador. Sus cambios siguen en el editor. |
| `embedded_content_1bca8f` | Contenido incrustado |
| `edit_table_source_c7189f` | Editar código fuente de la tabla |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Seleccione una celda para editarla o cambiar la tabla. Presione Alt+Enter mientras escribe. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Este bloque contiene formato que debe editarse en Markdown. |
| `code_contents_5a1f26` | Contenido del código |
| `type_directly_to_edit_this_indented_code_block_769291` | Escriba directamente en este bloque de código con sangría para editarlo. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Escriba directamente en el bloque de código para editar su contenido. Utilice Markdown para editar las líneas que marcan dónde comienza y termina. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Use «Editar elemento de la lista» para cambiar el texto. Para cambiar el nivel de anidamiento, edite la lista en Markdown. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Use «Editar elemento de la lista» o las casillas para cambiar esta lista. |
| `edit_list_item_text_a982e6` | Editar texto del elemento de la lista |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Edite el texto del elemento directamente. Edite la estructura de la lista en Markdown. |
| `task_4bc74b` | Tarea |
| `edit_item_9f84ee` | Editar elemento de la lista |
| `list_options_fc3320` | Opciones de lista |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Esta tabla debe editarse en Markdown. |
| `add_text_to_this_empty_cell_37f900` | Agregar texto a esta celda vacía |
| `edit_this_cell_in_markdown_4304b1` | Edite esta celda en Markdown |
| `edit_table_cell_a4212e` | Editar celda de tabla |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Seleccione una celda para editarla. Puede editar la tabla subyacente en Markdown. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Esta celda contiene HTML. Edite esta celda en Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | Esta celda utiliza referencias Markdown. Edite esta celda en Markdown. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Escriba para editar esta celda. Presione Alt+Enter para ver las opciones de la tabla. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Escriba directamente en las celdas con texto sin formato. Para contenido más complejo, use las opciones de la tabla o edite el Markdown. |
| `table_options_cf924a` | Opciones de tabla |
| `edit_note_299e60` | Editar nota |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Use «Editar nota» para cambiar el texto editable de la nota al pie. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | Este diseño utiliza HTML. Edítelo en Markdown. |
| `edit_inline_code_bf93ee` | Editar código en línea |
| `edit_list_structure_in_markdown_17a222` | Editar estructura de lista en Markdown |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Edite directamente el texto de la lista. Para cambiar su estructura, edite el Markdown. |
| `edit_code_in_table_cell_535cb9` | Editar código en la celda de la tabla |
| `edit_table_cell_text_ca30e7` | Editar texto de celda de tabla |
| `edit_preformatted_text_9737bd` | Editar texto preformateado |
| `edit_disclosure_title_79fb92` | Editar el título de la sección desplegable |
| `edit_text_7967d9` | Editar texto |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Escriba el texto de la celda. Presione Alt+Enter para ver las opciones de celda. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Edite el texto directamente. Edite la estructura circundante en Markdown. |
| `edit_structure_in_markdown_fe607e` | Editar estructura en Markdown |
| `edit_quoted_text_9de474` | Editar texto citado |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Edite el texto sin formato directamente. Edite la estructura del bloque de cita en Markdown. |
| `edit_heading_text_f3806c` | Editar texto del encabezado |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Edite el texto del encabezado directamente. Edite el estilo del encabezado en Markdown. |
| `heading_style_c0c25b` | Estilo de encabezado |
| `edit_this_item_in_markdown_83b112` | Editar este elemento en Markdown |
| `markdown_only_f6e1f7` | Solo en Markdown |
| `visual_only_29a136` | Solo en el editor visual |
| `action_64cff1` | Acción |
| `apply_31e392` | Aplicar |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | El Markdown cambió. Vuelva a abrir este editor para intentarlo de nuevo. |
| `edit_list_item_f69436` | Editar elemento de la lista |
| `item_text_markdown_0bbe7d` | Texto del elemento (Markdown) |
| `new_item_b84cad` | Nuevo elemento de lista |
| `enter_item_text_or_choose_remove_item_e4003a` | Escriba el texto del elemento o elija Eliminar elemento. |
| `enter_item_text_82c7ea` | Escriba el texto del elemento. |
| `add_item_below_a6d694` | Agregar elemento a continuación |
| `remove_item_5a89ed` | Eliminar elemento |
| `indent_under_previous_item_2e6b03` | Aumentar sangría bajo el elemento anterior |
| `outdent_item_07e9b1` | Reducir la sangría del elemento |
| `this_item_has_no_parent_to_outdent_from_dd148a` | Este elemento no tiene ningún elemento principal del que se pueda quitar la sangría. |
| `heading_b34f17` | Encabezado |
| `edit_footnote_cdcee6` | Editar nota al pie |
| `note_text_369e75` | Texto de la nota al pie |
| `enter_the_note_text_on_one_line_3a7a5a` | Escriba el texto de la nota en una línea. |
| `cell_text_9cd173` | Texto de celda |
| `add_row_below_3d4830` | Agregar fila a continuación |
| `add_column_after_38817e` | Agregar columna después |
| `new_column_editor` | Nueva columna |
| `remove_row_1810fd` | Quitar fila |
| `remove_column_9807a2` | Quitar columna |
| `align_column_left_6d9399` | Alinear columna a la izquierda |
| `center_column_1b9b8b` | Centrar el contenido de la columna |
| `align_column_right_850a8f` | Alinear columna a la derecha |
| `cell_text_markdown_a9e5f9` | Texto de celda (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Cierre el código en línea antes de agregar un salto de línea. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Este texto de celda cambiaría la estructura de la tabla. Agregue un espacio antes del separador en Markdown. |
| `alt_text_16f898` | Texto alternativo |
| `link_text_markdown_9b92bd` | Texto del enlace (Markdown) |
| `image_url_e55026` | URL de la imagen |
| `link_url_9dfd0b` | URL del enlace |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | Editar imagen vinculada |
| `edit_image_d9d12b` | Editar imagen |
| `edit_link_94026c` | Editar enlace |
| `enter_text_without_a_closing_bracket_0e7315` | Escriba texto sin corchetes de cierre. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Escriba una URL HTTP o HTTPS sin espacios ni paréntesis. |
| `visual_pane_height_4ad683` | Altura del panel visual |
| `return_to_reader_dcd8f7` | Volver a la vista de lectura |
| `number_of_columns_2_8_893663` | Número de columnas (2 a 8) |
| `header_number_b79482` | Encabezado de columna {number} |
| `cell_75fa38` | Celda |
| `open_1f1d59` | Abrir… |
| `new_18fdd5` | Nuevo |
| `print_07c371` | Imprimir… |
| `close_7d9eb7` | Cerrar |
| `file_50009c` | Archivo |
| `about_markdown_vision_c6d62d` | Acerca de Markdown Vision… |
| `quit_markdown_vision_01c01b` | Salir de Markdown Vision |
| `quit_b3eb37` | Salir |
| `help_b79cac` | Ayuda |
| `could_not_enumerate_system_fonts_00e652` | No se pudieron enumerar las fuentes del sistema |
| `no_system_fonts_found_a8a9af` | No se encontraron fuentes del sistema |
| `could_not_open_document_640c27` | No se pudo abrir el documento |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | No se pudo abrir el documento. Sus cambios actuales todavía están disponibles. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | ¿Descartar los cambios no guardados y cerrar Markdown Vision? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | ¿Descartar los cambios no guardados y salir de Markdown Vision? |
| `unknown_confirmation_request_feea29` | Solicitud de confirmación desconocida |
| `keep_editing_624a83` | Seguir editando |
| `discard_eb1a70` | Descartar |
| `unsaved_changes_a710c2` | Cambios no guardados |
| `the_document_is_no_longer_open_use_save_as_671c50` | El documento ya no está abierto. Utilice «Guardar como». |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Este archivo contiene distintos finales de línea o una codificación UTF-8 no válida. Utilice «Guardar como». |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | No se admite guardar a través de un enlace simbólico. Utilice «Guardar como». |
| `invalid_destination_14f03f` | Destino no válido |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | El archivo de destino cambió en el disco. Utilice «Guardar como» para conservar sus cambios. |
| `the_update_process_failed_010689` | El proceso de actualización falló. |
| `could_not_restore_the_open_document_69d724` | No se pudo restaurar el documento abierto. |
| `could_not_restart_markdown_vision_6ead36` | No se pudo reiniciar Markdown Vision. |
| `restart_is_not_available_on_this_platform_998ef6` | El reinicio no está disponible en esta plataforma. |
| `the_update_information_is_invalid_dbcffc` | La información de actualización no es válida. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Las actualizaciones automáticas requieren un paquete DEB o RPM instalado. |
| `this_architecture_is_not_supported_ae063c` | Esta arquitectura no es compatible. |
| `could_not_identify_the_linux_distribution_18bbdb` | No se pudo identificar la distribución Linux. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | El administrador de paquetes RPM no está disponible. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision no está instalado como un paquete RPM compatible. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Esta actualización no es más nueva que el paquete instalado. |
| `the_debian_package_manager_is_unavailable_b5d66b` | El administrador de paquetes de Debian no está disponible. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision no está instalado como un paquete DEB. |
| `could_not_determine_the_installed_version_f1a1f1` | No se pudo determinar la versión instalada. |
| `could_not_compare_package_versions_465d4e` | No se pudieron comparar las versiones del paquete. |
| `could_not_create_a_temporary_download_folder_36407c` | No se pudo crear una carpeta de descarga temporal. |
| `could_not_start_the_download_b4acf0` | No se pudo iniciar la descarga. |
| `the_update_could_not_be_downloaded_4d6fd7` | No se pudo descargar la actualización. |
| `could_not_verify_the_update_2cd2c5` | No se pudo verificar la actualización. |
| `the_downloaded_update_failed_verification_60519b` | La actualización descargada falló en la verificación. |
| `could_not_inspect_the_update_package_9812b2` | No se pudo inspeccionar el paquete de actualización. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | El paquete descargado tiene metadatos inesperados. |
| `version_dd1679` | Versión |
| `could_not_start_the_system_installer_907ba2` | No se pudo iniciar el instalador del sistema. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | La instalación se canceló o falló. Inténtelo de nuevo. |
| `could_not_verify_the_installed_update_04a200` | No se pudo verificar la actualización instalada. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | El instalador no actualizó Markdown Vision a la versión esperada. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Las actualizaciones automáticas de DEB solo están disponibles en Linux. |
| `invalid_preferences_bc6b57` | Preferencias no válidas |
| `invalid_key_b06fe9` | {key} no válido |
| `unsupported_preferences_version_54734c` | Versión de preferencias no admitida |
| `missing_preferences_679970` | Preferencias faltantes |
| `invalid_preferences_directory_a6f362` | Directorio de preferencias no válido |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision no pudo leer este archivo. |
| `markdown_files_177420` | Archivos Markdown |
| `text_files_c5df15` | Archivos de texto |
| `all_files_866956` | Todos los archivos |
| `save_markdown_file_813f90` | Guardar archivo Markdown |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Este documento ya no está abierto. Vuelva a abrir el archivo o utilice «Guardar como». |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Utilice «Guardar como» para crear una copia UTF-8 de este archivo. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | Este archivo utiliza distintos finales de línea. Utilice «Guardar como» para crear una copia con finales de línea uniformes. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows no pudo abrir el cuadro de diálogo «Guardar como». |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | El borrador no se pudo codificar como UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows no pudo leer el destino seleccionado. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | El archivo cambió en el disco o no está disponible. Utilice «Guardar como» para mantener sus ediciones en una copia separada. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows no pudo guardar el archivo. Compruebe que se pueda escribir en él o utilice «Guardar como». |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows no pudo restaurar el archivo original durante el guardado. El original está en {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | No se pudo completar la solicitud de guardado. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision no pudo preparar los archivos de la aplicación en la carpeta local de datos de aplicaciones de Windows. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Se requiere el entorno de ejecución de Microsoft Edge WebView2. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Instalación de Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | Licenciado bajo GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | Este instalador requiere Windows en ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision se está ejecutando. Guarde los documentos pendientes antes de continuar. ¿Cerrar Markdown Vision y continuar con la instalación? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | El instalador no pudo cerrar Markdown Vision. Ciérrelo manualmente y vuelva a ejecutar el instalador. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision sigue en ejecución. Ciérrelo y seleccione Reintentar, o cancele la instalación. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Eliminando la edición Markdown Vision actualmente instalada… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | No se ha podido eliminar la instalación existente de Markdown Vision. El instalador se cerrará sin instalar Markdown Vision Native. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | En la configuración de Windows puede elegir Markdown Vision como aplicación predeterminada para archivos Markdown. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Abrir la configuración de aplicaciones predeterminadas de Windows después de la instalación |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision se ha instalado. |
| `open_markdown_vision_when_setup_closes_8422c7` | Abrir Markdown Vision al cerrar el instalador |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | No se pudo instalar Markdown Vision Native. La instalación se detendrá sin registrar una instalación incompleta. |
| `markdown_document_00271f` | Documento Markdown |
| `markdown_vision_preview_handler_8c95f7` | Controlador de vista previa Markdown Vision |
| `markdown_file_viewer_c36ee7` | Visor de archivos Markdown |
| `uninstall_fe1995` | Desinstalar |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision no pudo iniciarse. {error} |
| `unknown_native_method_method_cc7ca9` | Método nativo desconocido: {method} |
| `text_71988c` | Texto |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | Encabezado {level} |
| `normal_text_a2adc4` | Texto normal |
| `footnotes_ad6fb5` | Notas a pie de página |
| `size_px_8d05e6` | {size} píxeles |
| `link_text_insert_default` | texto del enlace |
| `back_to_footnote_reference` | Volver a la referencia de la nota al pie |

## Locale sv

Swedish

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Markdown-formatering |
| `undo_a8283a` | Ångra |
| `redo_742739` | Gör om |
| `bold_ctrl_b_84787d` | Fetstil (Ctrl+B) |
| `bold_94fee6` | Fetstil |
| `italic_ctrl_i_ccc60d` | Kursiv (Ctrl+I) |
| `italic_9bf37c` | Kursiv |
| `strikethrough_9aabbc` | Genomstruken |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Växla mellan rubriknivåer (H1–H6, därefter brödtext) |
| `cycle_heading_level_bde9c4` | Växla mellan rubriknivåer |
| `bulleted_list_ce51b3` | Punktlista |
| `task_list_5d3253` | Uppgiftslista |
| `numbered_list_cc62f6` | Numrerad lista |
| `quote_eb4cde` | Citat |
| `inline_code_e767de` | Kod i löptext |
| `code_block_754538` | Kodblock |
| `link_a6a32d` | Länk |
| `insert_table_67318e` | Sätt in tabell |
| `edit_markdown_6ff388` | Redigera Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | Ny Markdown-fil (Ctrl+N) |
| `new_markdown_file_0928e9` | Ny Markdown-fil |
| `open_markdown_file_b7764a` | Öppna Markdown-fil |
| `print_ctrl_p_5c4406` | Skriv ut (Ctrl+P) |
| `print_document_2a024b` | Skriv ut dokument |
| `search_text_38d268` | Sök i texten |
| `settings_74a883` | Inställningar |
| `switch_to_dark_mode_fc43ea` | Växla till mörkt läge |
| `about_markdown_vision_08f9a5` | Om Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | GNU GPLv3-licens |
| `version_version_a18745` | Version {version} |
| `latest_version_checking_4bfedc` | Senaste versionen: kontrollerar… |
| `update_c1c100` | Uppdatera |
| `update_text_editor` | Uppdatera text |
| `keep_unchanged_editor` | Lämna oförändrat |
| `check_for_updates_f26f32` | Sök efter uppdateringar |
| `restart_markdown_vision_7e50f8` | Starta om Markdown Vision |
| `text_search_10155f` | Textsökning |
| `count_match_ef9195` | {count} sökresultat |
| `count_matches_43682a` | {count} sökresultat |
| `previous_match_daa2f8` | Föregående sökresultat |
| `next_match_825e5a` | Nästa sökresultat |
| `close_search_55656b` | Stäng sökning |
| `close_settings_0ccfef` | Stäng inställningarna |
| `variable_width_font_0836b2` | Teckensnitt med variabel bredd |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Skriv ett teckensnittsnamn eller välj ett installerat teckensnitt. |
| `fixed_width_font_3de094` | Teckensnitt med fast bredd |
| `used_for_code_and_other_monospaced_text_84b6ed` | Används för kod och annan text med fast teckenbredd. |
| `text_size_d68761` | Textstorlek |
| `automatic_text_size_919785` | Automatisk textstorlek |
| `automatic_d461a4` | Automatisk |
| `line_spacing_0db45d` | Radavstånd |
| `page_width_limit_19528b` | Sidbreddgräns |
| `automatic_page_width_bd5c30` | Automatisk sidbredd |
| `markdown_editor_da0ea6` | Markdown-redigerare |
| `editor_view_1d1833` | Redigeringsvy |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown till vänster, visuell redigerare till höger |
| `split_0b61a1` | Dela ↔ |
| `visual_above_markdown_a04e0f` | Visuell redigerare ovanför Markdown |
| `split_b3b924` | Dela ↕ |
| `visual_ba3033` | Visuell |
| `save_ctrl_s_4be89e` | Spara (Ctrl+S) |
| `save_1509f5` | Spara |
| `save_as_ctrl_shift_s_0f132a` | Spara som (Ctrl+Shift+S) |
| `save_as_a4b76a` | Spara som… |
| `markdown_source_580118` | Markdown-källtext |
| `markdown_pane_width_ab0129` | Markdown-panelens bredd |
| `percent_markdown_0a45d1` | {percent} % Markdown |
| `percent_visual_a8635d` | {percent} % Visuell |
| `visual_editor_5665dd` | Visuell redigerare |
| `visual_editing_restriction_d42cea` | Visuell redigeringsbegränsning |
| `edit_in_markdown_165fd4` | Redigera i Markdown |
| `dismiss_48845b` | Stäng meddelandet |
| `count_word_1f505c` | {count} ord |
| `count_words_caab29` | {count} ord |
| `approximate_word_count_7b987a` | Ungefärligt antal ord: {count} |
| `line_line_column_column_21e9f4` | Rad {line}, kolumn {column} |
| `untitled_md_2dccf8` | Namnlös.md |
| `save_your_changes_56dd16` | Spara dina ändringar? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Spara ditt nuvarande dokument innan du skapar en ny fil. |
| `cancel_19766e` | Avbryt |
| `discard_changes_f9bfa3` | Släng ändringar |
| `switch_to_light_mode_bfa0ca` | Byt till ljust läge |
| `enter_the_name_of_any_installed_font_b57a72` | Ange namnet på valfritt installerat teckensnitt. |
| `loading_installed_fonts_200c74` | Laddar installerade teckensnitt… |
| `count_fixed_width_font_available_5488f8` | Tillgängliga teckensnitt med fast bredd: {count} |
| `count_fixed_width_fonts_available_5df530` | Tillgängliga teckensnitt med fast bredd: {count} |
| `count_variable_width_font_available_583582` | Tillgängliga teckensnitt med variabel bredd: {count} |
| `count_variable_width_fonts_available_9d234c` | Tillgängliga teckensnitt med variabel bredd: {count} |
| `count_match_for_query_2e77ac` | Sökresultat för ”{query}”: {count} |
| `count_matches_for_query_7db710` | Sökresultat för ”{query}”: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | Inga teckensnitt med fast bredd matchar "{query}". |
| `no_variable_width_fonts_match_query_a64030` | Inga teckensnitt med variabel bredd matchar "{query}". |
| `current_of_total_35d900` | {current} av {total} |
| `current_of_total_scope_94ebe5` | {current} av {total} · {scope} |
| `copy_code_49a005` | Kopiera kod |
| `clipboard_unavailable_4ff69f` | Urklipp är inte tillgängligt |
| `code_copied_39868c` | Koden kopierad |
| `could_not_copy_code_4a563f` | Det gick inte att kopiera koden |
| `the_native_print_dialog_could_not_open_320714` | Systemets utskriftsdialogruta kunde inte öppnas. |
| `could_not_open_the_print_dialog_4bd85a` | Det gick inte att öppna utskriftsdialogrutan. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Släng dina osparade ändringar och öppna ett annat dokument? |
| `could_not_open_document_69abda` | Det gick inte att öppna dokumentet |
| `release_check_failed_7b2758` | Versionskontrollen misslyckades |
| `unrecognized_release_list_62d1cb` | Okänd versionslista |
| `unrecognized_version_d1b8d2` | Okänd version |
| `latest_version_version_d1c996` | Senaste version: {version} |
| `unsupported_architecture_087e4f` | Arkitektur som inte stöds |
| `installer_verification_is_unavailable_98306d` | Verifiering av installationsfilen är inte tillgänglig. |
| `unsupported_platform_a96892` | Ej stödd plattform |
| `latest_compatible_version_version_fa3079` | Senaste kompatibla version: {version} |
| `upgrade_markdown_vision_de1b45` | Uppgradera Markdown Vision |
| `download_macos_update_95d8f3` | Ladda ner macOS-uppdatering |
| `download_linux_update_707c5e` | Ladda ner Linux-uppdatering |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Det går inte att söka efter uppdateringar. Kontrollera din internetanslutning och försök igen. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Laddar ner och verifierar uppdateringen. Du kan bli ombedd att autentisera. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Uppdatering installerad. Starta om för att använda den nya versionen. |
| `update_failed_error_e4f7dc` | Uppdatering misslyckades: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Ladda ner och kör Markdown Vision installationsprogrammet? Spara alla öppna dokument först. Installationen kan begära att stänga Markdown Vision. |
| `downloading_and_verifying_update_02b3ba` | Laddar ned och verifierar uppdatering… |
| `installer_started_865e10` | Installationsprogrammet har startat. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Det gick inte att ladda ner, verifiera eller starta installationsprogrammet. Försök igen. |
| `discard_unsaved_changes_and_restart_6d1602` | Vill du slänga osparade ändringar och starta om? |
| `could_not_restart_error_71e2d2` | Kunde inte starta om: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Dubbelklicka eller tryck på Alt+Enter för att redigera detta objekt |
| `saving_23e392` | Sparar… |
| `unsaved_6250d5` | Ej sparad |
| `saved_b5c120` | Sparad |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Det gick inte att spara utkastet. Dina ändringar finns kvar i redigeraren. |
| `embedded_content_1bca8f` | Inbäddat innehåll |
| `edit_table_source_c7189f` | Redigera tabellkälla |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Välj en cell för att redigera den eller ändra tabellen. Tryck på Alt+Enter medan du skriver. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Detta block innehåller formatering som behöver redigeras i Markdown. |
| `code_contents_5a1f26` | Kodens innehåll |
| `type_directly_to_edit_this_indented_code_block_769291` | Skriv direkt i detta indragna kodblock för att redigera det. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Skriv direkt i kodblocket för att redigera dess innehåll. Använd Markdown för att redigera raderna som markerar var blocket börjar och slutar. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Använd ”Redigera listpost” för att ändra texten. Redigera listan i Markdown för att ändra indraget. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Använd ”Redigera listpost” eller kryssrutorna för att ändra listan. |
| `edit_list_item_text_a982e6` | Redigera listpostens text |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Redigera listpostens text direkt. Redigera liststrukturen i Markdown. |
| `task_4bc74b` | Uppgift |
| `edit_item_9f84ee` | Redigera listpost |
| `list_options_fc3320` | Listalternativ |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Denna tabell måste redigeras i Markdown. |
| `add_text_to_this_empty_cell_37f900` | Lägg till text i den här tomma cellen |
| `edit_this_cell_in_markdown_4304b1` | Redigera denna cell i Markdown |
| `edit_table_cell_a4212e` | Redigera tabellcell |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Välj en cell för att redigera den. Du kan redigera den underliggande tabellen i Markdown. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Denna cell innehåller HTML. Redigera denna cell i Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | Den här cellen använder Markdown-referenser. Redigera denna cell i Markdown. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Skriv för att redigera den här cellen. Tryck på Alt+Enter för tabellalternativ. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Skriv direkt i celler som bara innehåller vanlig text. Använd tabellalternativen eller redigera Markdown för mer komplext innehåll. |
| `table_options_cf924a` | Tabellalternativ |
| `edit_note_299e60` | Redigera anteckning |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Använd ”Redigera anteckning” för att ändra den redigerbara fotnotstexten. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | Denna layout använder HTML. Redigera den i Markdown. |
| `edit_inline_code_bf93ee` | Redigera inline-kod |
| `edit_list_structure_in_markdown_17a222` | Redigera liststruktur i Markdown |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Redigera den vanliga listtexten direkt. Redigera liststrukturen i Markdown. |
| `edit_code_in_table_cell_535cb9` | Redigera kod i tabellcell |
| `edit_table_cell_text_ca30e7` | Redigera tabellcelltext |
| `edit_preformatted_text_9737bd` | Redigera förformaterad text |
| `edit_disclosure_title_79fb92` | Redigera rubriken för det expanderbara avsnittet |
| `edit_text_7967d9` | Redigera text |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Skriv in celltexten. Tryck på Alt+Enter för cellalternativ. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Redigera texten direkt. Redigera den omgivande strukturen i Markdown. |
| `edit_structure_in_markdown_fe607e` | Redigera struktur i Markdown |
| `edit_quoted_text_9de474` | Redigera citerad text |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Redigera den vanliga texten direkt. Redigera blockcitatets struktur i Markdown. |
| `edit_heading_text_f3806c` | Redigera rubriktext |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Redigera rubriktexten direkt. Redigera rubrikstilen i Markdown. |
| `heading_style_c0c25b` | Rubrikformat |
| `edit_this_item_in_markdown_83b112` | Redigera detta objekt i Markdown |
| `markdown_only_f6e1f7` | Endast Markdown |
| `visual_only_29a136` | Endast i den visuella redigeraren |
| `action_64cff1` | Åtgärd |
| `apply_31e392` | Verkställ |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Markdown har ändrats. Öppna redigeraren igen för att försöka igen. |
| `edit_list_item_f69436` | Redigera listpost |
| `item_text_markdown_0bbe7d` | Listpunktens text (Markdown) |
| `new_item_b84cad` | Ny listpost |
| `enter_item_text_or_choose_remove_item_e4003a` | Ange text för listposten eller välj ”Ta bort listpost”. |
| `enter_item_text_82c7ea` | Ange listpunktens text. |
| `add_item_below_a6d694` | Lägg till objekt nedan |
| `remove_item_5a89ed` | Ta bort listpost |
| `indent_under_previous_item_2e6b03` | Dra in under föregående punkt |
| `outdent_item_07e9b1` | Minska listpostens indrag |
| `this_item_has_no_parent_to_outdent_from_dd148a` | Den här listpunkten har ingen överordnad punkt och kan inte minska sitt indrag. |
| `heading_b34f17` | Rubrik |
| `edit_footnote_cdcee6` | Redigera fotnot |
| `note_text_369e75` | Fotnotstext |
| `enter_the_note_text_on_one_line_3a7a5a` | Skriv in anteckningstexten på en rad. |
| `cell_text_9cd173` | Celltext |
| `add_row_below_3d4830` | Lägg till rad nedan |
| `add_column_after_38817e` | Lägg till kolumn efter |
| `new_column_editor` | Ny kolumn |
| `remove_row_1810fd` | Ta bort raden |
| `remove_column_9807a2` | Ta bort kolumn |
| `align_column_left_6d9399` | Justera kolumnen till vänster |
| `center_column_1b9b8b` | Centrera kolumnens innehåll |
| `align_column_right_850a8f` | Högerjustera kolumnen |
| `cell_text_markdown_a9e5f9` | Celltext (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Stäng inline-koden innan du lägger till en radbrytning. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Denna celltext skulle ändra tabellstrukturen. Lägg till ett mellanslag före avgränsaren i Markdown. |
| `alt_text_16f898` | Alternativtext |
| `link_text_markdown_9b92bd` | Länktext (Markdown) |
| `image_url_e55026` | Bildens webbadress |
| `link_url_9dfd0b` | Länk-URL |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | Redigera länkad bild |
| `edit_image_d9d12b` | Redigera bild |
| `edit_link_94026c` | Redigera länk |
| `enter_text_without_a_closing_bracket_0e7315` | Skriv in text utan avslutande parentes. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Ange en HTTP- eller HTTPS-URL utan mellanslag eller parentes. |
| `visual_pane_height_4ad683` | Den visuella panelens höjd |
| `return_to_reader_dcd8f7` | Tillbaka till läsvyn |
| `number_of_columns_2_8_893663` | Antal kolumner (2–8) |
| `header_number_b79482` | Kolumnrubrik {number} |
| `cell_75fa38` | Cell |
| `open_1f1d59` | Öppna… |
| `new_18fdd5` | Nytt |
| `print_07c371` | Skriv ut… |
| `close_7d9eb7` | Stäng |
| `file_50009c` | Arkiv |
| `about_markdown_vision_c6d62d` | Om Markdown Vision… |
| `quit_markdown_vision_01c01b` | Avsluta Markdown Vision |
| `quit_b3eb37` | Avsluta |
| `help_b79cac` | Hjälp |
| `could_not_enumerate_system_fonts_00e652` | Det gick inte att hämta listan över systemets teckensnitt |
| `no_system_fonts_found_a8a9af` | Inga systemteckensnitt hittades |
| `could_not_open_document_640c27` | Det gick inte att öppna dokumentet |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | Dokumentet kunde inte öppnas. Dina nuvarande ändringar är fortfarande tillgängliga. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Vill du slänga dina osparade ändringar och stänga Markdown Vision? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Släng dina osparade ändringar och avsluta Markdown Vision? |
| `unknown_confirmation_request_feea29` | Okänd bekräftelseförfrågan |
| `keep_editing_624a83` | Fortsätt redigera |
| `discard_eb1a70` | Släng |
| `unsaved_changes_a710c2` | Osparade ändringar |
| `the_document_is_no_longer_open_use_save_as_671c50` | Dokumentet är inte längre öppet. Använd Spara som. |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Den här filen har blandade radändelser eller ogiltig UTF-8-kodning. Använd ”Spara som”. |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | Spara via en symbolisk länk stöds inte. Använd Spara som. |
| `invalid_destination_14f03f` | Ogiltig destination |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | Målfilen har ändrats på disken. Använd ”Spara som” för att bevara dina ändringar. |
| `the_update_process_failed_010689` | Uppdateringsprocessen misslyckades. |
| `could_not_restore_the_open_document_69d724` | Det gick inte att återställa det öppna dokumentet. |
| `could_not_restart_markdown_vision_6ead36` | Kunde inte starta om Markdown Vision. |
| `restart_is_not_available_on_this_platform_998ef6` | Omstart är inte tillgängligt på den här plattformen. |
| `the_update_information_is_invalid_dbcffc` | Uppdateringsinformationen är ogiltig. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Automatiska uppdateringar kräver ett installerat DEB- eller RPM-paket. |
| `this_architecture_is_not_supported_ae063c` | Den här arkitekturen stöds inte. |
| `could_not_identify_the_linux_distribution_18bbdb` | Det gick inte att identifiera Linux-distributionen. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | RPM-pakethanteraren är inte tillgänglig. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision är inte installerat som ett kompatibelt RPM-paket. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Den här uppdateringen är inte nyare än det installerade paketet. |
| `the_debian_package_manager_is_unavailable_b5d66b` | Debians pakethanterare är inte tillgänglig. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision är inte installerat som ett DEB-paket. |
| `could_not_determine_the_installed_version_f1a1f1` | Det gick inte att fastställa den installerade versionen. |
| `could_not_compare_package_versions_465d4e` | Det gick inte att jämföra paketversioner. |
| `could_not_create_a_temporary_download_folder_36407c` | Det gick inte att skapa en tillfällig nedladdningsmapp. |
| `could_not_start_the_download_b4acf0` | Det gick inte att starta nedladdningen. |
| `the_update_could_not_be_downloaded_4d6fd7` | Uppdateringen kunde inte laddas ned. |
| `could_not_verify_the_update_2cd2c5` | Det gick inte att verifiera uppdateringen. |
| `the_downloaded_update_failed_verification_60519b` | Verifieringen av den nedladdade uppdateringen misslyckades. |
| `could_not_inspect_the_update_package_9812b2` | Det gick inte att inspektera uppdateringspaketet. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | Det nedladdade paketet har oväntad metadata. |
| `version_dd1679` | Version |
| `could_not_start_the_system_installer_907ba2` | Kunde inte starta systeminstallationsprogrammet. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | Installationen avbröts eller misslyckades. Försök igen. |
| `could_not_verify_the_installed_update_04a200` | Det gick inte att verifiera den installerade uppdateringen. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | Installationsprogrammet uppdaterade inte Markdown Vision till den förväntade versionen. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Automatiska DEB-uppdateringar är endast tillgängliga på Linux. |
| `invalid_preferences_bc6b57` | Ogiltiga inställningar |
| `invalid_key_b06fe9` | Ogiltig {key} |
| `unsupported_preferences_version_54734c` | Inställningsversion som inte stöds |
| `missing_preferences_679970` | Saknade inställningar |
| `invalid_preferences_directory_a6f362` | Ogiltig inställningskatalog |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision kunde inte läsa den här filen. |
| `markdown_files_177420` | Markdown-filer |
| `text_files_c5df15` | Textfiler |
| `all_files_866956` | Alla filer |
| `save_markdown_file_813f90` | Spara filen Markdown |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Detta dokument är inte längre öppet. Öppna filen igen eller använd Spara som. |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Använd ”Spara som” för att skapa en UTF-8-kopia av filen. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | Den här filen använder blandade radändelser. Använd Spara som för att skapa en kopia med konsekventa radslut. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows kunde inte öppna dialogrutan Spara som. |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | Utkastet kunde inte kodas som UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows kunde inte läsa den valda destinationen. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | Filen har ändrats på disk eller är otillgänglig. Använd Spara som för att spara dina redigeringar i en separat kopia. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows kunde inte spara filen. Kontrollera att filen är skrivbar eller använd Spara som. |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows kunde inte återställa den ursprungliga filen under lagringen. Originalet finns på {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | Sparningsförfrågan kunde inte slutföras. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision kunde inte förbereda sina programfiler i din lokala appdatamapp. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Microsoft Edge WebView2 Runtime krävs. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Installation av Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | Licensierad under GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | Detta installationsprogram kräver Windows på ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision körs. Spara osparade dokument innan du fortsätter. Vill du stänga Markdown Vision och fortsätta installationen? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | Installationen kunde inte stänga Markdown Vision. Stäng den manuellt och kör installationen igen. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision körs fortfarande. Stäng programmet och välj Försök igen eller avbryt installationen. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Tar bort den för närvarande installerade Markdown Vision-utgåvan… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | Det gick inte att ta bort den befintliga installationen av Markdown Vision. Installationsprogrammet avslutas utan att installera Markdown Vision Native. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | I Windows-inställningarna kan du välja Markdown Vision som standardapp för Markdown-filer. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Öppna Windows inställningar för standardappar efter installationen |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision har installerats. |
| `open_markdown_vision_when_setup_closes_8422c7` | Öppna Markdown Vision när installationsprogrammet stängs |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native kunde inte installeras. Installationen avbryts utan att en ofullständig installation registreras. |
| `markdown_document_00271f` | Markdown-dokument |
| `markdown_vision_preview_handler_8c95f7` | Markdown Vision Förhandsgranskningshanterare |
| `markdown_file_viewer_c36ee7` | Markdown-filvisare |
| `uninstall_fe1995` | Avinstallera |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision kunde inte starta. {error} |
| `unknown_native_method_method_cc7ca9` | Okänd inbyggd metod: {method} |
| `text_71988c` | Text |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | Rubrik {level} |
| `normal_text_a2adc4` | Brödtext |
| `footnotes_ad6fb5` | Fotnoter |
| `size_px_8d05e6` | {size} px |
| `link_text_insert_default` | länktext |
| `back_to_footnote_reference` | Tillbaka till fotnotshänvisningen |

## Locale th

Thai

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | การจัดรูปแบบ Markdown |
| `undo_a8283a` | เลิกทำ |
| `redo_742739` | ทำซ้ำ |
| `bold_ctrl_b_84787d` | ตัวหนา (Ctrl+B) |
| `bold_94fee6` | ตัวหนา |
| `italic_ctrl_i_ccc60d` | ตัวเอียง (Ctrl+I) |
| `italic_9bf37c` | ตัวเอียง |
| `strikethrough_9aabbc` | ขีดทับ |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | สลับระดับหัวเรื่องตามลำดับ (H1–H6, จากนั้นเป็นข้อความปกติ) |
| `cycle_heading_level_bde9c4` | สลับระดับหัวเรื่องตามลำดับ |
| `bulleted_list_ce51b3` | รายการหัวข้อย่อย |
| `task_list_5d3253` | รายการงาน |
| `numbered_list_cc62f6` | รายการลำดับเลข |
| `quote_eb4cde` | ข้อความอ้างอิง |
| `inline_code_e767de` | โค้ดอินไลน์ |
| `code_block_754538` | บล็อกโค้ด |
| `link_a6a32d` | ลิงก์ |
| `insert_table_67318e` | แทรกตาราง |
| `edit_markdown_6ff388` | แก้ไข Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | ไฟล์ Markdown ใหม่ (Ctrl+N) |
| `new_markdown_file_0928e9` | ไฟล์ Markdown ใหม่ |
| `open_markdown_file_b7764a` | เปิดไฟล์ Markdown |
| `print_ctrl_p_5c4406` | พิมพ์ (Ctrl+P) |
| `print_document_2a024b` | พิมพ์เอกสาร |
| `search_text_38d268` | ค้นหาในข้อความ |
| `settings_74a883` | การตั้งค่า |
| `switch_to_dark_mode_fc43ea` | สลับไปที่โหมดมืด |
| `about_markdown_vision_08f9a5` | เกี่ยวกับ Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | ใบอนุญาต GNU GPLv3 |
| `version_version_a18745` | เวอร์ชัน {version} |
| `latest_version_checking_4bfedc` | เวอร์ชันล่าสุด: กำลังตรวจสอบ… |
| `update_c1c100` | อัปเดต |
| `update_text_editor` | อัปเดตข้อความ |
| `keep_unchanged_editor` | คงไว้โดยไม่เปลี่ยนแปลง |
| `check_for_updates_f26f32` | ตรวจสอบการอัปเดต |
| `restart_markdown_vision_7e50f8` | รีสตาร์ท Markdown Vision |
| `text_search_10155f` | ค้นหาข้อความ |
| `count_match_ef9195` | ผลการค้นหา {count} รายการ |
| `count_matches_43682a` | ผลการค้นหา {count} รายการ |
| `previous_match_daa2f8` | ผลการค้นหาก่อนหน้า |
| `next_match_825e5a` | ผลการค้นหาถัดไป |
| `close_search_55656b` | ปิดการค้นหา |
| `close_settings_0ccfef` | ปิดการตั้งค่า |
| `variable_width_font_0836b2` | แบบอักษรที่มีความกว้างแปรผัน |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | พิมพ์ชื่อแบบอักษรหรือเลือกแบบอักษรที่ติดตั้ง |
| `fixed_width_font_3de094` | แบบอักษรที่มีความกว้างคงที่ |
| `used_for_code_and_other_monospaced_text_84b6ed` | ใช้สำหรับโค้ดและข้อความอื่นที่มีความกว้างคงที่ |
| `text_size_d68761` | ขนาดข้อความ |
| `automatic_text_size_919785` | ขนาดข้อความอัตโนมัติ |
| `automatic_d461a4` | อัตโนมัติ |
| `line_spacing_0db45d` | ระยะห่างระหว่างบรรทัด |
| `page_width_limit_19528b` | ขีดจำกัดความกว้างของหน้า |
| `automatic_page_width_bd5c30` | ความกว้างของหน้าอัตโนมัติ |
| `markdown_editor_da0ea6` | โปรแกรมแก้ไข Markdown |
| `editor_view_1d1833` | มุมมองตัวแก้ไข |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown อยู่ซ้าย ตัวแก้ไขแบบภาพอยู่ขวา |
| `split_0b61a1` | แบ่งมุมมอง ↔ |
| `visual_above_markdown_a04e0f` | ตัวแก้ไขแบบภาพอยู่เหนือ Markdown |
| `split_b3b924` | แบ่งมุมมอง ↕ |
| `visual_ba3033` | ภาพ |
| `save_ctrl_s_4be89e` | บันทึก (Ctrl+S) |
| `save_1509f5` | บันทึก |
| `save_as_ctrl_shift_s_0f132a` | บันทึกเป็น (Ctrl+Shift+S) |
| `save_as_a4b76a` | บันทึกเป็น… |
| `markdown_source_580118` | แหล่งที่มา Markdown |
| `markdown_pane_width_ab0129` | ความกว้างของแผง Markdown |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% ตัวแก้ไขแบบภาพ |
| `visual_editor_5665dd` | ตัวแก้ไขแบบภาพ |
| `visual_editing_restriction_d42cea` | ข้อจำกัดในการแก้ไขภาพ |
| `edit_in_markdown_165fd4` | แก้ไขใน Markdown |
| `dismiss_48845b` | ปิดการแจ้งเตือน |
| `count_word_1f505c` | คำว่า {count} |
| `count_words_caab29` | คำ {count} |
| `approximate_word_count_7b987a` | จำนวนคำโดยประมาณ: {count} |
| `line_line_column_column_21e9f4` | บรรทัด {line} คอลัมน์ {column} |
| `untitled_md_2dccf8` | ไม่มีชื่อ.md |
| `save_your_changes_56dd16` | บันทึกการเปลี่ยนแปลงของคุณ? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | บันทึกเอกสารปัจจุบันของคุณก่อนที่จะสร้างไฟล์ใหม่ |
| `cancel_19766e` | ยกเลิก |
| `discard_changes_f9bfa3` | ละทิ้งการเปลี่ยนแปลง |
| `switch_to_light_mode_bfa0ca` | สลับเป็นโหมดสว่าง |
| `enter_the_name_of_any_installed_font_b57a72` | ป้อนชื่อของแบบอักษรที่ติดตั้ง |
| `loading_installed_fonts_200c74` | กำลังโหลดแบบอักษรที่ติดตั้ง… |
| `count_fixed_width_font_available_5488f8` | แบบอักษรความกว้างคงที่ที่ใช้ได้: {count} |
| `count_fixed_width_fonts_available_5df530` | แบบอักษรความกว้างคงที่ที่ใช้ได้: {count} |
| `count_variable_width_font_available_583582` | แบบอักษรที่มีความกว้างแปรผันที่ใช้ได้: {count} |
| `count_variable_width_fonts_available_9d234c` | แบบอักษรที่มีความกว้างแปรผันที่ใช้ได้: {count} |
| `count_match_for_query_2e77ac` | ผลการค้นหาสำหรับ “{query}”: {count} |
| `count_matches_for_query_7db710` | ผลการค้นหาสำหรับ “{query}”: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | ไม่มีแบบอักษรที่มีความกว้างคงที่ที่ตรงกับ "{query}" |
| `no_variable_width_fonts_match_query_a64030` | ไม่มีแบบอักษรที่มีความกว้างแปรผันที่ตรงกับ "{query}" |
| `current_of_total_35d900` | รายการที่ {current} จาก {total} |
| `current_of_total_scope_94ebe5` | รายการที่ {current} จาก {total} · {scope} |
| `copy_code_49a005` | คัดลอกโค้ด |
| `clipboard_unavailable_4ff69f` | คลิปบอร์ดไม่พร้อมใช้งาน |
| `code_copied_39868c` | คัดลอกโค้ดแล้ว |
| `could_not_copy_code_4a563f` | ไม่สามารถคัดลอกโค้ดได้ |
| `the_native_print_dialog_could_not_open_320714` | ไม่สามารถเปิดกล่องโต้ตอบการพิมพ์ของระบบได้ |
| `could_not_open_the_print_dialog_4bd85a` | ไม่สามารถเปิดกล่องโต้ตอบการพิมพ์ได้ |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | ละทิ้งการเปลี่ยนแปลงที่ยังไม่ได้บันทึกและเปิดเอกสารอื่นใช่ไหม |
| `could_not_open_document_69abda` | ไม่สามารถเปิดเอกสารได้ |
| `release_check_failed_7b2758` | ตรวจสอบเวอร์ชันไม่สำเร็จ |
| `unrecognized_release_list_62d1cb` | รายการเวอร์ชันไม่ถูกต้อง |
| `unrecognized_version_d1b8d2` | รุ่นที่ไม่รู้จัก |
| `latest_version_version_d1c996` | เวอร์ชันล่าสุด: {version} |
| `unsupported_architecture_087e4f` | สถาปัตยกรรมที่ไม่รองรับ |
| `installer_verification_is_unavailable_98306d` | การยืนยันตัวติดตั้งไม่พร้อมใช้งาน |
| `unsupported_platform_a96892` | แพลตฟอร์มที่ไม่รองรับ |
| `latest_compatible_version_version_fa3079` | เวอร์ชันล่าสุดที่เข้ากันได้: {version} |
| `upgrade_markdown_vision_de1b45` | อัปเดต Markdown Vision |
| `download_macos_update_95d8f3` | ดาวน์โหลดการอัปเดตสำหรับ macOS |
| `download_linux_update_707c5e` | ดาวน์โหลดการอัปเดตสำหรับ Linux |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | ไม่สามารถตรวจสอบการอัปเดตได้ ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณแล้วลองอีกครั้ง |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | กำลังดาวน์โหลดและตรวจสอบการอัปเดต คุณอาจถูกขอให้ตรวจสอบสิทธิ์ |
| `update_installed_restart_to_use_the_new_version_bb8a43` | ติดตั้งการอัปเดตแล้ว รีสตาร์ทเพื่อใช้เวอร์ชันใหม่ |
| `update_failed_error_e4f7dc` | การอัปเดตล้มเหลว: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | ดาวน์โหลดและรันโปรแกรมติดตั้ง Markdown Vision หรือไม่ บันทึกเอกสารที่เปิดอยู่ก่อน โปรแกรมติดตั้งอาจขอให้ปิด Markdown Vision |
| `downloading_and_verifying_update_02b3ba` | กำลังดาวน์โหลดและยืนยันการอัปเดต… |
| `installer_started_865e10` | ตัวติดตั้งเริ่มต้นขึ้น |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | ไม่สามารถดาวน์โหลด ตรวจสอบ หรือเริ่มโปรแกรมติดตั้งได้ โปรดลองอีกครั้ง |
| `discard_unsaved_changes_and_restart_6d1602` | ละทิ้งการเปลี่ยนแปลงที่ยังไม่ได้บันทึกแล้วรีสตาร์ทใช่ไหม |
| `could_not_restart_error_71e2d2` | ไม่สามารถรีสตาร์ท: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | ดับเบิลคลิกหรือกด Alt+Enter เพื่อแก้ไขรายการนี้ |
| `saving_23e392` | กำลังบันทึก… |
| `unsaved_6250d5` | ไม่ได้บันทึก |
| `saved_b5c120` | บันทึกแล้ว |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | ไม่สามารถบันทึกฉบับร่างได้ การเปลี่ยนแปลงของคุณยังอยู่ในตัวแก้ไข |
| `embedded_content_1bca8f` | เนื้อหาที่ฝัง |
| `edit_table_source_c7189f` | แก้ไขแหล่งที่มาของตาราง |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | เลือกเซลล์เพื่อแก้ไขหรือเปลี่ยนตาราง กด Alt+Enter ขณะพิมพ์ |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | บล็อกนี้มีการจัดรูปแบบที่ต้องแก้ไขใน Markdown |
| `code_contents_5a1f26` | เนื้อหาโค้ด |
| `type_directly_to_edit_this_indented_code_block_769291` | พิมพ์ในบล็อกโค้ดที่เยื้องนี้โดยตรงเพื่อแก้ไข |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | พิมพ์ลงในบล็อกโค้ดโดยตรงเพื่อแก้ไขเนื้อหา ใช้ Markdown เพื่อแก้ไขบรรทัดที่ทำเครื่องหมายจุดเริ่มต้นและจุดสิ้นสุด |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | ใช้ “แก้ไขรายการ” เพื่อเปลี่ยนข้อความ หากต้องการเปลี่ยนระดับการซ้อน ให้แก้ไขรายการใน Markdown |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | ใช้ “แก้ไขรายการ” หรือช่องทำเครื่องหมายเพื่อเปลี่ยนรายการนี้ |
| `edit_list_item_text_a982e6` | แก้ไขข้อความรายการ |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | แก้ไขข้อความรายการโดยตรง แก้ไขโครงสร้างรายการใน Markdown |
| `task_4bc74b` | งาน |
| `edit_item_9f84ee` | แก้ไขรายการ |
| `list_options_fc3320` | ตัวเลือกของรายการ |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | ตารางนี้ต้องได้รับการแก้ไขใน Markdown |
| `add_text_to_this_empty_cell_37f900` | เพิ่มข้อความลงในเซลล์ว่างนี้ |
| `edit_this_cell_in_markdown_4304b1` | แก้ไขเซลล์นี้ใน Markdown |
| `edit_table_cell_a4212e` | แก้ไขเซลล์ตาราง |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | เลือกเซลล์ที่ต้องการแก้ไข คุณสามารถแก้ไขตารางต้นฉบับใน Markdown ได้ |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | เซลล์นี้มี HTML แก้ไขเซลล์นี้ใน Markdown |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | เซลล์นี้ใช้การอ้างอิง Markdown แก้ไขเซลล์นี้ใน Markdown |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | พิมพ์เพื่อแก้ไขเซลล์นี้ กด Alt+Enter เพื่อดูตัวเลือกตาราง |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | พิมพ์โดยตรงในเซลล์ที่มีเฉพาะข้อความธรรมดา หากเนื้อหาซับซ้อนกว่านี้ ให้ใช้ตัวเลือกตารางหรือแก้ไข Markdown |
| `table_options_cf924a` | ตัวเลือกตาราง |
| `edit_note_299e60` | แก้ไขบันทึก |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | ใช้ “แก้ไขบันทึก” เพื่อเปลี่ยนข้อความเชิงอรรถที่แก้ไขได้ |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | เค้าโครงนี้ใช้ HTML แก้ไขใน Markdown |
| `edit_inline_code_bf93ee` | แก้ไขโค้ดอินไลน์ |
| `edit_list_structure_in_markdown_17a222` | แก้ไขโครงสร้างรายการใน Markdown |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | แก้ไขข้อความรายการธรรมดาโดยตรง แก้ไขโครงสร้างรายการใน Markdown |
| `edit_code_in_table_cell_535cb9` | แก้ไขโค้ดในเซลล์ตาราง |
| `edit_table_cell_text_ca30e7` | แก้ไขข้อความเซลล์ตาราง |
| `edit_preformatted_text_9737bd` | แก้ไขข้อความที่จัดรูปแบบไว้ล่วงหน้า |
| `edit_disclosure_title_79fb92` | แก้ไขชื่อส่วนที่ขยายได้ |
| `edit_text_7967d9` | แก้ไขข้อความ |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | พิมพ์ข้อความในเซลล์ กด Alt+Enter เพื่อดูตัวเลือกเซลล์ |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | แก้ไขข้อความโดยตรง แก้ไขโครงสร้างโดยรอบใน Markdown |
| `edit_structure_in_markdown_fe607e` | แก้ไขโครงสร้างใน Markdown |
| `edit_quoted_text_9de474` | แก้ไขข้อความที่ยกมา |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | แก้ไขข้อความธรรมดาได้โดยตรง แก้ไขโครงสร้างบล็อกข้อความอ้างอิงใน Markdown |
| `edit_heading_text_f3806c` | แก้ไขข้อความหัวเรื่อง |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | แก้ไขข้อความส่วนหัวโดยตรง แก้ไขสไตล์ส่วนหัวใน Markdown |
| `heading_style_c0c25b` | สไตล์หัวเรื่อง |
| `edit_this_item_in_markdown_83b112` | แก้ไขรายการนี้ใน Markdown |
| `markdown_only_f6e1f7` | เฉพาะ Markdown |
| `visual_only_29a136` | เฉพาะตัวแก้ไขแบบภาพ |
| `action_64cff1` | การดำเนินการ |
| `apply_31e392` | นำไปใช้ |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | เปลี่ยน Markdown แล้ว เปิดตัวแก้ไขนี้อีกครั้งเพื่อลองอีกครั้ง |
| `edit_list_item_f69436` | แก้ไขรายการ |
| `item_text_markdown_0bbe7d` | ข้อความรายการ (Markdown) |
| `new_item_b84cad` | รายการใหม่ |
| `enter_item_text_or_choose_remove_item_e4003a` | ป้อนข้อความรายการหรือเลือกลบรายการ |
| `enter_item_text_82c7ea` | ป้อนข้อความรายการ |
| `add_item_below_a6d694` | เพิ่มรายการด้านล่าง |
| `remove_item_5a89ed` | ลบรายการ |
| `indent_under_previous_item_2e6b03` | เยื้องใต้รายการก่อนหน้า |
| `outdent_item_07e9b1` | ลดการเยื้องรายการ |
| `this_item_has_no_parent_to_outdent_from_dd148a` | รายการนี้ไม่มีรายการระดับบน จึงลดระยะเยื้องไม่ได้ |
| `heading_b34f17` | หัวเรื่อง |
| `edit_footnote_cdcee6` | แก้ไขเชิงอรรถ |
| `note_text_369e75` | ข้อความเชิงอรรถ |
| `enter_the_note_text_on_one_line_3a7a5a` | ป้อนข้อความบันทึกย่อในหนึ่งบรรทัด |
| `cell_text_9cd173` | ข้อความของเซลล์ |
| `add_row_below_3d4830` | เพิ่มแถวด้านล่าง |
| `add_column_after_38817e` | เพิ่มคอลัมน์หลัง |
| `new_column_editor` | คอลัมน์ใหม่ |
| `remove_row_1810fd` | ลบแถว |
| `remove_column_9807a2` | ลบคอลัมน์ |
| `align_column_left_6d9399` | จัดแนวคอลัมน์ไปทางซ้าย |
| `center_column_1b9b8b` | จัดเนื้อหาในคอลัมน์ให้อยู่กึ่งกลาง |
| `align_column_right_850a8f` | จัดแนวคอลัมน์ไปทางขวา |
| `cell_text_markdown_a9e5f9` | ข้อความเซลล์ (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | ปิดโค้ดอินไลน์ก่อนที่จะเพิ่มตัวแบ่งบรรทัด |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | ข้อความในเซลล์นี้จะเปลี่ยนโครงสร้างตาราง เพิ่มช่องว่างหน้าตัวคั่นใน Markdown |
| `alt_text_16f898` | ข้อความแสดงแทน |
| `link_text_markdown_9b92bd` | ข้อความลิงค์ (Markdown) |
| `image_url_e55026` | URL รูปภาพ |
| `link_url_9dfd0b` | ลิงก์ URL |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | แก้ไขภาพที่เชื่อมโยง |
| `edit_image_d9d12b` | แก้ไขภาพ |
| `edit_link_94026c` | แก้ไขลิงค์ |
| `enter_text_without_a_closing_bracket_0e7315` | ป้อนข้อความโดยไม่มีวงเล็บปิด |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | ป้อน HTTP หรือ HTTPS URL โดยไม่ต้องเว้นวรรคหรือวงเล็บ |
| `visual_pane_height_4ad683` | ความสูงของแผงแก้ไขแบบภาพ |
| `return_to_reader_dcd8f7` | กลับไปยังมุมมองการอ่าน |
| `number_of_columns_2_8_893663` | จำนวนคอลัมน์ (2–8) |
| `header_number_b79482` | หัวคอลัมน์ {number} |
| `cell_75fa38` | เซลล์ |
| `open_1f1d59` | เปิด… |
| `new_18fdd5` | ใหม่ |
| `print_07c371` | พิมพ์… |
| `close_7d9eb7` | ปิด |
| `file_50009c` | ไฟล์ |
| `about_markdown_vision_c6d62d` | เกี่ยวกับ Markdown Vision… |
| `quit_markdown_vision_01c01b` | ออกจาก Markdown Vision |
| `quit_b3eb37` | ออกจากแอป |
| `help_b79cac` | วิธีใช้ |
| `could_not_enumerate_system_fonts_00e652` | ไม่สามารถรับรายการแบบอักษรของระบบได้ |
| `no_system_fonts_found_a8a9af` | ไม่พบแบบอักษรของระบบ |
| `could_not_open_document_640c27` | ไม่สามารถเปิดเอกสารได้ |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | ไม่สามารถเปิดเอกสารได้ การเปลี่ยนแปลงปัจจุบันของคุณยังคงมีอยู่ {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | ละทิ้งการเปลี่ยนแปลงที่ยังไม่ได้บันทึกและปิด Markdown Vision หรือไม่ |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | ละทิ้งการเปลี่ยนแปลงที่ยังไม่ได้บันทึกและออกจาก Markdown Vision หรือไม่ |
| `unknown_confirmation_request_feea29` | คำขอยืนยันที่ไม่รู้จัก |
| `keep_editing_624a83` | แก้ไขต่อไป |
| `discard_eb1a70` | ละทิ้งการเปลี่ยนแปลง |
| `unsaved_changes_a710c2` | การเปลี่ยนแปลงที่ไม่ได้บันทึก |
| `the_document_is_no_longer_open_use_save_as_671c50` | เอกสารไม่ได้เปิดอีกต่อไป ใช้บันทึกเป็น |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | ไฟล์นี้มีรูปแบบการลงท้ายบรรทัดปะปนกันหรือมีการเข้ารหัส UTF-8 ที่ไม่ถูกต้อง ใช้ “บันทึกเป็น” |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | ไม่รองรับการบันทึกผ่านลิงก์สัญลักษณ์ ใช้บันทึกเป็น |
| `invalid_destination_14f03f` | ปลายทางไม่ถูกต้อง |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | ไฟล์ปลายทางบนดิสก์มีการเปลี่ยนแปลง ใช้ “บันทึกเป็น” เพื่อเก็บการแก้ไขของคุณไว้ |
| `the_update_process_failed_010689` | กระบวนการอัปเดตล้มเหลว |
| `could_not_restore_the_open_document_69d724` | ไม่สามารถกู้คืนเอกสารที่เปิดอยู่ |
| `could_not_restart_markdown_vision_6ead36` | ไม่สามารถรีสตาร์ท Markdown Vision ได้ |
| `restart_is_not_available_on_this_platform_998ef6` | การรีสตาร์ทไม่พร้อมใช้งานบนแพลตฟอร์มนี้ |
| `the_update_information_is_invalid_dbcffc` | ข้อมูลการอัพเดตไม่ถูกต้อง |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | การอัปเดตอัตโนมัติจำเป็นต้องมีแพ็คเกจ DEB หรือ RPM ที่ติดตั้งไว้ |
| `this_architecture_is_not_supported_ae063c` | ไม่รองรับสถาปัตยกรรมนี้ |
| `could_not_identify_the_linux_distribution_18bbdb` | ไม่สามารถระบุการกระจาย Linux ได้ |
| `the_rpm_package_manager_is_unavailable_9ce83b` | ตัวจัดการแพ็คเกจ RPM ไม่พร้อมใช้งาน |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision ไม่ได้ติดตั้งเป็นแพ็คเกจ RPM ที่เข้ากันได้ |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | โปรแกรมปรับปรุงนี้ไม่ใหม่กว่าแพ็คเกจที่ติดตั้ง |
| `the_debian_package_manager_is_unavailable_b5d66b` | ตัวจัดการแพ็คเกจ Debian ไม่พร้อมใช้งาน |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision ไม่ได้ถูกติดตั้งเป็นแพ็คเกจ DEB |
| `could_not_determine_the_installed_version_f1a1f1` | ไม่สามารถระบุเวอร์ชันที่ติดตั้งได้ |
| `could_not_compare_package_versions_465d4e` | ไม่สามารถเปรียบเทียบเวอร์ชันแพ็คเกจได้ |
| `could_not_create_a_temporary_download_folder_36407c` | ไม่สามารถสร้างโฟลเดอร์ดาวน์โหลดชั่วคราวได้ |
| `could_not_start_the_download_b4acf0` | ไม่สามารถเริ่มการดาวน์โหลดได้ |
| `the_update_could_not_be_downloaded_4d6fd7` | ไม่สามารถดาวน์โหลดการอัปเดตได้ |
| `could_not_verify_the_update_2cd2c5` | ไม่สามารถตรวจสอบการอัปเดตได้ |
| `the_downloaded_update_failed_verification_60519b` | การอัปเดตที่ดาวน์โหลดไม่ผ่านการตรวจสอบ |
| `could_not_inspect_the_update_package_9812b2` | ไม่สามารถตรวจสอบแพ็คเกจการอัปเดตได้ |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | แพ็คเกจที่ดาวน์โหลดมีข้อมูลเมตาที่ไม่คาดคิด |
| `version_dd1679` | เวอร์ชัน |
| `could_not_start_the_system_installer_907ba2` | ไม่สามารถเริ่มตัวติดตั้งระบบได้ |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | การติดตั้งถูกยกเลิกหรือล้มเหลว โปรดลองอีกครั้ง |
| `could_not_verify_the_installed_update_04a200` | ไม่สามารถตรวจสอบการอัปเดตที่ติดตั้งได้ |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | โปรแกรมติดตั้งไม่ได้อัปเดต Markdown Vision เป็นเวอร์ชันที่คาดไว้ |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | การอัปเดต DEB อัตโนมัติมีเฉพาะใน Linux เท่านั้น |
| `invalid_preferences_bc6b57` | ค่ากำหนดไม่ถูกต้อง |
| `invalid_key_b06fe9` | {key} ไม่ถูกต้อง |
| `unsupported_preferences_version_54734c` | เวอร์ชันการตั้งค่าที่ไม่รองรับ |
| `missing_preferences_679970` | ค่ากำหนดที่ขาดหายไป |
| `invalid_preferences_directory_a6f362` | ไดเรกทอรีการตั้งค่าไม่ถูกต้อง |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision ไม่สามารถอ่านไฟล์นี้ได้ |
| `markdown_files_177420` | ไฟล์ Markdown |
| `text_files_c5df15` | ไฟล์ข้อความ |
| `all_files_866956` | ไฟล์ทั้งหมด |
| `save_markdown_file_813f90` | บันทึกไฟล์ Markdown |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | เอกสารนี้ไม่ได้เปิดอีกต่อไป เปิดไฟล์อีกครั้งหรือใช้บันทึกเป็น |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | ใช้บันทึกเป็นเพื่อสร้างสำเนา UTF-8 ของไฟล์นี้ |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | ไฟล์นี้ใช้การลงท้ายบรรทัดแบบผสม ใช้บันทึกเป็นเพื่อสร้างสำเนาที่มีการลงท้ายบรรทัดที่สอดคล้องกัน |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows ไม่สามารถเปิดกล่องโต้ตอบบันทึกเป็นได้ |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | ไม่สามารถเข้ารหัสแบบร่างเป็น UTF-8 ได้ |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows ไม่สามารถอ่านปลายทางที่เลือกได้ |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | ไฟล์มีการเปลี่ยนแปลงบนดิสก์หรือไม่พร้อมใช้งาน ใช้บันทึกเป็นเพื่อเก็บการแก้ไขของคุณไว้ในสำเนาแยกต่างหาก |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows ไม่สามารถบันทึกไฟล์ได้ ตรวจสอบว่าไฟล์สามารถเขียนได้ หรือใช้บันทึกเป็น |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows ไม่สามารถกู้คืนไฟล์ต้นฉบับระหว่างการบันทึก ต้นฉบับอยู่ที่ {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | ไม่สามารถดำเนินการตามคำขอบันทึกได้ |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision ไม่สามารถเตรียมไฟล์แอปพลิเคชันในโฟลเดอร์ข้อมูลแอปในเครื่องของคุณได้ |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | ต้องใช้รันไทม์ Microsoft Edge WebView2 |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | โปรแกรมติดตั้ง Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | ได้รับอนุญาตภายใต้ GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | โปรแกรมติดตั้งนี้ต้องการ Windows บน ARM64 |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision กำลังทำงานอยู่ โปรดบันทึกเอกสารที่ยังไม่ได้บันทึกก่อนดำเนินการต่อ ต้องการปิด Markdown Vision และติดตั้งต่อหรือไม่ |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | โปรแกรมติดตั้งไม่สามารถปิด Markdown Vision ได้ โปรดปิดด้วยตนเองแล้วเรียกใช้โปรแกรมติดตั้งอีกครั้ง |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision ยังคงทำงานอยู่ โปรดปิดโปรแกรมแล้วเลือกลองอีกครั้ง หรือยกเลิกการติดตั้ง |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | กำลังลบรุ่น Markdown Vision ที่ติดตั้งอยู่ในปัจจุบัน… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | ไม่สามารถนำ Markdown Vision ที่ติดตั้งอยู่ออกได้ โปรแกรมติดตั้งจะหยุดโดยไม่ติดตั้ง Markdown Vision Native |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | คุณสามารถเลือก Markdown Vision เป็นแอปเริ่มต้นสำหรับไฟล์ Markdown ได้ในการตั้งค่า Windows |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | เปิดการตั้งค่าแอปเริ่มต้นของ Windows หลังติดตั้ง |
| `markdown_vision_has_been_installed_40d44f` | ติดตั้ง Markdown Vision แล้ว |
| `open_markdown_vision_when_setup_closes_8422c7` | เปิด Markdown Vision เมื่อปิดโปรแกรมติดตั้ง |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | ไม่สามารถติดตั้ง Markdown Vision Native ได้ โปรแกรมติดตั้งจะหยุดโดยไม่ลงทะเบียนการติดตั้งที่ไม่สมบูรณ์ |
| `markdown_document_00271f` | เอกสาร Markdown |
| `markdown_vision_preview_handler_8c95f7` | ตัวจัดการตัวอย่าง Markdown Vision |
| `markdown_file_viewer_c36ee7` | โปรแกรมดูไฟล์ Markdown |
| `uninstall_fe1995` | ถอนการติดตั้ง |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision ไม่สามารถสตาร์ทได้ {error} |
| `unknown_native_method_method_cc7ca9` | วิธีการดั้งเดิมที่ไม่รู้จัก: {method} |
| `text_71988c` | ข้อความ |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | หัวเรื่อง {level} |
| `normal_text_a2adc4` | ข้อความปกติ |
| `footnotes_ad6fb5` | เชิงอรรถ |
| `size_px_8d05e6` | {size} พิกเซล |
| `link_text_insert_default` | ข้อความลิงก์ |
| `back_to_footnote_reference` | กลับไปยังจุดอ้างอิงเชิงอรรถ |

## Locale tr

Turkish

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Markdown biçimlendirmesi |
| `undo_a8283a` | Geri al |
| `redo_742739` | Yinele |
| `bold_ctrl_b_84787d` | Kalın (Ctrl+B) |
| `bold_94fee6` | Kalın |
| `italic_ctrl_i_ccc60d` | İtalik (Ctrl+I) |
| `italic_9bf37c` | İtalik |
| `strikethrough_9aabbc` | Üstü çizili |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Başlık düzeyleri arasında sırayla geçiş yap (H1–H6, ardından normal metin) |
| `cycle_heading_level_bde9c4` | Başlık düzeyleri arasında sırayla geçiş yap |
| `bulleted_list_ce51b3` | Madde işaretli liste |
| `task_list_5d3253` | Görev listesi |
| `numbered_list_cc62f6` | Numaralı liste |
| `quote_eb4cde` | Alıntı |
| `inline_code_e767de` | Satır içi kod |
| `code_block_754538` | Kod bloğu |
| `link_a6a32d` | Bağlantı |
| `insert_table_67318e` | Tablo ekle |
| `edit_markdown_6ff388` | Markdown'ı düzenleyin |
| `new_markdown_file_ctrl_n_f22ed5` | Yeni Markdown dosyası (Ctrl+N) |
| `new_markdown_file_0928e9` | Yeni Markdown dosyası |
| `open_markdown_file_b7764a` | Markdown dosyasını aç |
| `print_ctrl_p_5c4406` | Yazdır (Ctrl+P) |
| `print_document_2a024b` | Belgeyi yazdır |
| `search_text_38d268` | Metinde ara |
| `settings_74a883` | Ayarlar |
| `switch_to_dark_mode_fc43ea` | Karanlık moda geç |
| `about_markdown_vision_08f9a5` | Markdown Vision Hakkında |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | GNU GPLv3 lisansı |
| `version_version_a18745` | Sürüm {version} |
| `latest_version_checking_4bfedc` | En son sürüm: kontrol ediliyor… |
| `update_c1c100` | Güncelle |
| `update_text_editor` | Metni güncelle |
| `keep_unchanged_editor` | Değiştirmeden bırak |
| `check_for_updates_f26f32` | Güncellemeleri kontrol et |
| `restart_markdown_vision_7e50f8` | Markdown Vision'ı yeniden başlat |
| `text_search_10155f` | Metinde arama |
| `count_match_ef9195` | {count} arama sonucu |
| `count_matches_43682a` | {count} arama sonucu |
| `previous_match_daa2f8` | Önceki arama sonucu |
| `next_match_825e5a` | Sonraki arama sonucu |
| `close_search_55656b` | Aramayı kapat |
| `close_settings_0ccfef` | Ayarları kapat |
| `variable_width_font_0836b2` | Değişken genişlikli yazı tipi |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Bir yazı tipi adı yazın veya yüklü bir yazı tipini seçin. |
| `fixed_width_font_3de094` | Sabit genişlikli yazı tipi |
| `used_for_code_and_other_monospaced_text_84b6ed` | Kod ve diğer eşit genişlikli metinler için kullanılır. |
| `text_size_d68761` | Metin boyutu |
| `automatic_text_size_919785` | Otomatik metin boyutu |
| `automatic_d461a4` | Otomatik |
| `line_spacing_0db45d` | Satır aralığı |
| `page_width_limit_19528b` | Sayfa genişliği sınırı |
| `automatic_page_width_bd5c30` | Otomatik sayfa genişliği |
| `markdown_editor_da0ea6` | Markdown düzenleyici |
| `editor_view_1d1833` | Düzenleyici görünümü |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown solda, görsel düzenleyici sağda |
| `split_0b61a1` | Böl ↔ |
| `visual_above_markdown_a04e0f` | Görsel düzenleyici üstte, Markdown altta |
| `split_b3b924` | Böl ↕ |
| `visual_ba3033` | Görsel |
| `save_ctrl_s_4be89e` | Kaydet (Ctrl+S) |
| `save_1509f5` | Kaydet |
| `save_as_ctrl_shift_s_0f132a` | Farklı Kaydet (Ctrl+Shift+S) |
| `save_as_a4b76a` | Farklı Kaydet… |
| `markdown_source_580118` | Markdown kaynağı |
| `markdown_pane_width_ab0129` | Markdown bölmesinin genişliği |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% Görsel |
| `visual_editor_5665dd` | Görsel düzenleyici |
| `visual_editing_restriction_d42cea` | Görsel düzenleme kısıtlaması |
| `edit_in_markdown_165fd4` | Markdown'da düzenleyin |
| `dismiss_48845b` | Bildirimi kapat |
| `count_word_1f505c` | {count} kelimesi |
| `count_words_caab29` | {count} kelimeler |
| `approximate_word_count_7b987a` | Yaklaşık sözcük sayısı: {count} |
| `line_line_column_column_21e9f4` | {line} satırı, {column} sütunu |
| `untitled_md_2dccf8` | Adsız.md |
| `save_your_changes_56dd16` | Değişiklikleriniz kaydedilsin mi? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Yeni bir dosya oluşturmadan önce mevcut belgenizi kaydedin. |
| `cancel_19766e` | İptal |
| `discard_changes_f9bfa3` | Değişiklikleri at |
| `switch_to_light_mode_bfa0ca` | Açık moda geç |
| `enter_the_name_of_any_installed_font_b57a72` | Yüklü herhangi bir yazı tipinin adını girin. |
| `loading_installed_fonts_200c74` | Yüklü yazı tipleri yükleniyor… |
| `count_fixed_width_font_available_5488f8` | Kullanılabilir sabit genişlikli yazı tipleri: {count} |
| `count_fixed_width_fonts_available_5df530` | Kullanılabilir sabit genişlikli yazı tipleri: {count} |
| `count_variable_width_font_available_583582` | Kullanılabilir değişken genişlikli yazı tipleri: {count} |
| `count_variable_width_fonts_available_9d234c` | Kullanılabilir değişken genişlikli yazı tipleri: {count} |
| `count_match_for_query_2e77ac` | “{query}” için arama sonuçları: {count} |
| `count_matches_for_query_7db710` | “{query}” için arama sonuçları: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | "{query}" ile eşleşen sabit genişlikli yazı tipi yok. |
| `no_variable_width_fonts_match_query_a64030` | "{query}" ile eşleşen değişken genişlikli yazı tipi yok. |
| `current_of_total_35d900` | {current} / {total} |
| `current_of_total_scope_94ebe5` | {current} / {total} · {scope} |
| `copy_code_49a005` | Kodu kopyala |
| `clipboard_unavailable_4ff69f` | Pano kullanılamıyor |
| `code_copied_39868c` | Kod kopyalandı |
| `could_not_copy_code_4a563f` | Kod kopyalanamadı |
| `the_native_print_dialog_could_not_open_320714` | Sistemin yazdırma iletişim kutusu açılamadı. |
| `could_not_open_the_print_dialog_4bd85a` | Yazdırma iletişim kutusu açılamadı. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Kaydedilmemiş değişiklikleriniz silinip başka bir belge açılsın mı? |
| `could_not_open_document_69abda` | Belge açılamadı |
| `release_check_failed_7b2758` | Sürüm kontrol edilemedi |
| `unrecognized_release_list_62d1cb` | Geçersiz sürüm listesi |
| `unrecognized_version_d1b8d2` | Tanınmayan sürüm |
| `latest_version_version_d1c996` | En son sürüm: {version} |
| `unsupported_architecture_087e4f` | Desteklenmeyen mimari |
| `installer_verification_is_unavailable_98306d` | Yükleyici doğrulaması kullanılamıyor |
| `unsupported_platform_a96892` | Desteklenmeyen platform |
| `latest_compatible_version_version_fa3079` | En son uyumlu sürüm: {version} |
| `upgrade_markdown_vision_de1b45` | Markdown Vision'ı güncelle |
| `download_macos_update_95d8f3` | macOS güncellemesini indir |
| `download_linux_update_707c5e` | Linux güncellemesini indir |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Güncellemeler kontrol edilemiyor. İnternet bağlantınızı kontrol edip tekrar deneyin. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Güncelleme indiriliyor ve doğrulanıyor. Kimliğinizi doğrulamanız istenebilir. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Güncelleme yüklendi. Yeni sürümü kullanmak için yeniden başlatın. |
| `update_failed_error_e4f7dc` | Güncelleme başarısız oldu: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Markdown Vision yükleyicisi indirilsin ve çalıştırılsın mı? Önce açık belgeleri kaydedin. Yükleyici, Markdown Vision uygulamasını kapatmanızı isteyebilir. |
| `downloading_and_verifying_update_02b3ba` | Güncelleme indiriliyor ve doğrulanıyor… |
| `installer_started_865e10` | Yükleyici başlatıldı. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Yükleyici indirilemedi, doğrulanamadı veya başlatılamadı. Lütfen tekrar deneyin. |
| `discard_unsaved_changes_and_restart_6d1602` | Kaydedilmemiş değişiklikler atılıp yeniden başlatılsın mı? |
| `could_not_restart_error_71e2d2` | Yeniden başlatılamadı: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Bu öğeyi düzenlemek için çift tıklayın veya Alt+Enter tuşuna basın |
| `saving_23e392` | Kaydediliyor… |
| `unsaved_6250d5` | Kaydedilmemiş |
| `saved_b5c120` | Kaydedildi |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Taslak kaydedilemedi. Değişiklikleriniz düzenleyicide duruyor. |
| `embedded_content_1bca8f` | Gömülü içerik |
| `edit_table_source_c7189f` | Tablo kaynağını düzenle |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Düzenlemek veya tabloyu değiştirmek için bir hücreyi seçin. Yazarken Alt+Enter tuşuna basın. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Bu blok, Markdown'da düzenlenmesi gereken formatlamayı içerir. |
| `code_contents_5a1f26` | Kod içeriği |
| `type_directly_to_edit_this_indented_code_block_769291` | Düzenlemek için doğrudan bu girintili kod bloğuna yazın. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | İçeriğini düzenlemek için doğrudan kod bloğuna yazın. Başladığı ve bittiği yeri işaretleyen satırları düzenlemek için Markdown'ı kullanın. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Metni değiştirmek için “Liste öğesini düzenle” seçeneğini kullanın. İç içe geçme düzeyini değiştirmek için listeyi Markdown biçiminde düzenleyin. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Listeyi değiştirmek için “Liste öğesini düzenle” seçeneğini veya onay kutularını kullanın. |
| `edit_list_item_text_a982e6` | Liste öğesi metnini düzenle |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Öğe metnini doğrudan düzenleyin. Liste yapısını Markdown'da düzenleyin. |
| `task_4bc74b` | Görev |
| `edit_item_9f84ee` | Liste öğesini düzenle |
| `list_options_fc3320` | Liste seçenekleri |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Bu tablonun Markdown'da düzenlenmesi gerekiyor. |
| `add_text_to_this_empty_cell_37f900` | Bu boş hücreye metin ekleyin |
| `edit_this_cell_in_markdown_4304b1` | Bu hücreyi Markdown'da düzenleyin |
| `edit_table_cell_a4212e` | Tablo hücresini düzenle |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Düzenlemek için bir hücre seçin. Kaynak tabloyu Markdown'da düzenleyebilirsiniz. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Bu hücre HTML içeriyor. Bu hücreyi Markdown'da düzenleyin. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | Bu hücre Markdown referanslarını kullanır. Bu hücreyi Markdown'da düzenleyin. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Bu hücreyi düzenlemek için yazın. Tablo seçenekleri için Alt+Enter tuşuna basın. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Yalnızca düz metin içeren hücrelere doğrudan yazın. Daha karmaşık içerikler için tablo seçeneklerini kullanın veya Markdown'ı düzenleyin. |
| `table_options_cf924a` | Tablo seçenekleri |
| `edit_note_299e60` | Dipnotu düzenle |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Dipnotun düzenlenebilir metnini değiştirmek için “Dipnotu düzenle” seçeneğini kullanın. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | Bu düzen HTML kullanır. Markdown'da düzenleyin. |
| `edit_inline_code_bf93ee` | Satır içi kodu düzenle |
| `edit_list_structure_in_markdown_17a222` | Markdown'da liste yapısını düzenleyin |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Düz liste metnini doğrudan düzenleyin. Liste yapısını Markdown'da düzenleyin. |
| `edit_code_in_table_cell_535cb9` | Tablo hücresindeki kodu düzenleyin |
| `edit_table_cell_text_ca30e7` | Tablo hücresi metnini düzenle |
| `edit_preformatted_text_9737bd` | Önceden biçimlendirilmiş metni düzenleyin |
| `edit_disclosure_title_79fb92` | Genişletilebilir bölümün başlığını düzenleyin |
| `edit_text_7967d9` | Metni düzenle |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Hücre metnini yazın. Hücre seçenekleri için Alt+Enter tuşuna basın. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Metni doğrudan düzenleyin. Çevreleyen yapıyı Markdown'da düzenleyin. |
| `edit_structure_in_markdown_fe607e` | Markdown'daki yapıyı düzenleyin |
| `edit_quoted_text_9de474` | Alıntılanan metni düzenle |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Düz metni doğrudan düzenleyin. Blok alıntının yapısını Markdown içinde düzenleyin. |
| `edit_heading_text_f3806c` | Başlık metnini düzenle |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Başlık metnini doğrudan düzenleyin. Başlık stilini Markdown'da düzenleyin. |
| `heading_style_c0c25b` | Başlık stili |
| `edit_this_item_in_markdown_83b112` | Bu öğeyi Markdown'da düzenle |
| `markdown_only_f6e1f7` | Yalnızca Markdown |
| `visual_only_29a136` | Yalnızca görsel düzenleyici |
| `action_64cff1` | Eylem |
| `apply_31e392` | Uygula |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Markdown değişti. Tekrar denemek için bu düzenleyiciyi yeniden açın. |
| `edit_list_item_f69436` | Liste öğesini düzenle |
| `item_text_markdown_0bbe7d` | Öğe metni (Markdown) |
| `new_item_b84cad` | Yeni liste öğesi |
| `enter_item_text_or_choose_remove_item_e4003a` | Öğe metnini girin veya “Öğeyi kaldır” seçeneğini seçin. |
| `enter_item_text_82c7ea` | Öğe metnini girin. |
| `add_item_below_a6d694` | Aşağıya öğe ekle |
| `remove_item_5a89ed` | Öğeyi kaldır |
| `indent_under_previous_item_2e6b03` | Önceki öğenin altına girintile |
| `outdent_item_07e9b1` | Öğenin girintisini azalt |
| `this_item_has_no_parent_to_outdent_from_dd148a` | Bu öğenin üst öğesi olmadığı için girintisi azaltılamaz. |
| `heading_b34f17` | Başlık |
| `edit_footnote_cdcee6` | Dipnotu düzenle |
| `note_text_369e75` | Dipnot metni |
| `enter_the_note_text_on_one_line_3a7a5a` | Not metnini tek satıra girin. |
| `cell_text_9cd173` | Hücre metni |
| `add_row_below_3d4830` | Aşağıya satır ekle |
| `add_column_after_38817e` | Sonrasına sütun ekle |
| `new_column_editor` | Yeni sütun |
| `remove_row_1810fd` | Satırı kaldır |
| `remove_column_9807a2` | Sütunu kaldır |
| `align_column_left_6d9399` | Sütunu sola hizala |
| `center_column_1b9b8b` | Sütun içeriğini ortala |
| `align_column_right_850a8f` | Sütunu sağa hizala |
| `cell_text_markdown_a9e5f9` | Hücre metni (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Satır sonu eklemeden önce satır içi kodu kapatın. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Bu hücre metni tablo yapısını değiştirir. Markdown'da ayırıcının önüne bir boşluk ekleyin. |
| `alt_text_16f898` | Alternatif metin |
| `link_text_markdown_9b92bd` | Bağlantı metni (Markdown) |
| `image_url_e55026` | Resim URL'si |
| `link_url_9dfd0b` | Bağlantı URL'si |
| `url_e7a241` | URL'si |
| `edit_linked_image_2f9456` | Bağlantılı resmi düzenle |
| `edit_image_d9d12b` | Resmi düzenle |
| `edit_link_94026c` | Bağlantıyı düzenle |
| `enter_text_without_a_closing_bracket_0e7315` | Metni kapanış parantezi olmadan girin. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Boşluk veya parantez olmadan bir HTTP veya HTTPS URL'si girin. |
| `visual_pane_height_4ad683` | Görsel düzenleme bölmesinin yüksekliği |
| `return_to_reader_dcd8f7` | Okuma görünümüne dön |
| `number_of_columns_2_8_893663` | Sütun sayısı (2–8) |
| `header_number_b79482` | Sütun başlığı {number} |
| `cell_75fa38` | Hücre |
| `open_1f1d59` | Aç… |
| `new_18fdd5` | Yeni |
| `print_07c371` | Yazdır… |
| `close_7d9eb7` | Kapat |
| `file_50009c` | Dosya |
| `about_markdown_vision_c6d62d` | Markdown Vision Hakkında… |
| `quit_markdown_vision_01c01b` | Markdown Vision'dan çık |
| `quit_b3eb37` | Çık |
| `help_b79cac` | Yardım |
| `could_not_enumerate_system_fonts_00e652` | Sistem yazı tipleri listelenemedi |
| `no_system_fonts_found_a8a9af` | Sistem yazı tipi bulunamadı |
| `could_not_open_document_640c27` | Belge açılamadı |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | Belge açılamadı. Mevcut değişiklikleriniz hâlâ kullanılabilir. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Kaydedilmemiş değişiklikleriniz silinsin ve Markdown Vision kapatılsın mı? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Kaydedilmemiş değişikliklerinizi atıp Markdown Vision'dan çıkılsın mı? |
| `unknown_confirmation_request_feea29` | Bilinmeyen onay isteği |
| `keep_editing_624a83` | Düzenlemeye devam et |
| `discard_eb1a70` | At |
| `unsaved_changes_a710c2` | Kaydedilmemiş değişiklikler |
| `the_document_is_no_longer_open_use_save_as_671c50` | Belge artık açık değil. Farklı Kaydet'i kullanın. |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Bu dosyada farklı satır sonları veya geçersiz UTF-8 kodlaması var. Farklı Kaydet'i kullanın. |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | Sembolik bağlantı aracılığıyla kaydetme desteklenmez. Farklı Kaydet'i kullanın. |
| `invalid_destination_14f03f` | Geçersiz hedef |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | Diskteki hedef dosya değişti. Düzenlemelerinizi korumak için Farklı Kaydet'i kullanın. |
| `the_update_process_failed_010689` | Güncelleme işlemi başarısız oldu. |
| `could_not_restore_the_open_document_69d724` | Açık belge geri yüklenemedi. |
| `could_not_restart_markdown_vision_6ead36` | Markdown Vision yeniden başlatılamadı. |
| `restart_is_not_available_on_this_platform_998ef6` | Yeniden başlatma bu platformda mevcut değil. |
| `the_update_information_is_invalid_dbcffc` | Güncelleme bilgileri geçersiz. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Otomatik güncellemeler yüklü bir DEB veya RPM paketi gerektirir. |
| `this_architecture_is_not_supported_ae063c` | Bu mimari desteklenmiyor. |
| `could_not_identify_the_linux_distribution_18bbdb` | Linux dağıtımı tanımlanamadı. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | RPM paket yöneticisi kullanılamıyor. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision uyumlu bir RPM paketi olarak kurulu değil. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Bu güncelleme kurulu paketten daha yeni değil. |
| `the_debian_package_manager_is_unavailable_b5d66b` | Debian paket yöneticisi kullanılamıyor. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision bir DEB paketi olarak kurulu değil. |
| `could_not_determine_the_installed_version_f1a1f1` | Yüklü sürüm belirlenemedi. |
| `could_not_compare_package_versions_465d4e` | Paket sürümleri karşılaştırılamadı. |
| `could_not_create_a_temporary_download_folder_36407c` | Geçici bir indirme klasörü oluşturulamadı. |
| `could_not_start_the_download_b4acf0` | İndirme işlemi başlatılamadı. |
| `the_update_could_not_be_downloaded_4d6fd7` | Güncelleme indirilemedi. |
| `could_not_verify_the_update_2cd2c5` | Güncelleme doğrulanamadı. |
| `the_downloaded_update_failed_verification_60519b` | İndirilen güncellemenin doğrulanması başarısız oldu. |
| `could_not_inspect_the_update_package_9812b2` | Güncelleme paketi incelenemedi. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | İndirilen pakette beklenmeyen meta veriler var. |
| `version_dd1679` | Sürüm |
| `could_not_start_the_system_installer_907ba2` | Sistem yükleyicisi başlatılamadı. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | Yükleme iptal edildi veya başarısız oldu. Lütfen tekrar deneyin. |
| `could_not_verify_the_installed_update_04a200` | Yüklenen güncelleme doğrulanamadı. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | Yükleyici Markdown Vision'ı beklenen sürüme güncellemedi. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Otomatik DEB güncellemeleri yalnızca Linux'ta mevcuttur. |
| `invalid_preferences_bc6b57` | Geçersiz tercihler |
| `invalid_key_b06fe9` | Geçersiz {key} |
| `unsupported_preferences_version_54734c` | Desteklenmeyen tercihler sürümü |
| `missing_preferences_679970` | Eksik tercihler |
| `invalid_preferences_directory_a6f362` | Geçersiz tercihler dizini |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision bu dosyayı okuyamadı. |
| `markdown_files_177420` | Markdown dosyaları |
| `text_files_c5df15` | Metin dosyaları |
| `all_files_866956` | Tüm dosyalar |
| `save_markdown_file_813f90` | Markdown dosyasını kaydet |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Bu belge artık açık değil. Dosyayı yeniden açın veya Farklı Kaydet'i kullanın. |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Bu dosyanın UTF-8 kopyasını oluşturmak için Farklı Kaydet'i kullanın. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | Bu dosya karışık satır sonları kullanıyor. Tutarlı satır sonlarına sahip bir kopya oluşturmak için Farklı Kaydet'i kullanın. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows Farklı Kaydet iletişim kutusunu açamadı. |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | Taslak UTF-8 olarak kodlanamadı. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows seçilen hedefi okuyamadı. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | Dosya diskte değiştirildi veya kullanılamıyor. Düzenlemelerinizi ayrı bir kopyada tutmak için Farklı Kaydet'i kullanın. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows dosyayı kaydedemedi. Dosyanın yazılabilir olup olmadığını kontrol edin veya Farklı Kaydet'i kullanın. |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows, kaydetme sırasında orijinal dosyayı geri yükleyemedi. Orijinali {path} adresindedir. |
| `the_save_request_could_not_be_completed_75cfa5` | Kaydetme isteği tamamlanamadı. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision, uygulama dosyalarını yerel uygulama verileri klasörünüzde hazırlayamadı. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Microsoft Edge WebView2 Çalışma Zamanı gereklidir. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Markdown Vision Native Kurulumu |
| `licensed_under_gpl_3_0_only_5f7e0f` | GPL-3.0-only kapsamında lisanslanmıştır |
| `this_installer_requires_windows_on_arm64_ef7f28` | Bu yükleyici ARM64'te Windows gerektirir. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision çalışıyor. Devam etmeden önce kaydedilmemiş belgeleri kaydedin. Markdown Vision kapatılıp kuruluma devam edilsin mi? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | Kurulum Markdown Vision'ı kapatamadı. Manuel olarak kapatın ve kurulumu tekrar çalıştırın. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision hala çalışıyor. Kapatın ve Yeniden Dene'yi seçin veya kurulumu iptal edin. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Şu anda yüklü olan Markdown Vision sürümü kaldırılıyor… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | Mevcut Markdown Vision kurulumu kaldırılamadı. Kurulum, Markdown Vision Native kurulmadan durdurulacak. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | Windows ayarlarında Markdown Vision uygulamasını Markdown dosyaları için varsayılan olarak seçebilirsiniz. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Kurulumdan sonra Windows varsayılan uygulama ayarlarını aç |
| `markdown_vision_has_been_installed_40d44f` | Markdown Vision kuruldu. |
| `open_markdown_vision_when_setup_closes_8422c7` | Kurulum kapandığında Markdown Vision'ı açın |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native yüklenemedi. Tamamlanmamış bir kurulum kaydedilmeden kurulum durdurulacaktır. |
| `markdown_document_00271f` | Markdown belgesi |
| `markdown_vision_preview_handler_8c95f7` | Markdown Vision Önizleme İşleyicisi |
| `markdown_file_viewer_c36ee7` | Markdown dosya görüntüleyici |
| `uninstall_fe1995` | Kaldır |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision başlatılamadı. {error} |
| `unknown_native_method_method_cc7ca9` | Bilinmeyen yerel yöntem: {method} |
| `text_71988c` | Metin |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | {level}. düzey başlık |
| `normal_text_a2adc4` | Normal metin |
| `footnotes_ad6fb5` | Dipnotlar |
| `size_px_8d05e6` | {size} piksel |
| `link_text_insert_default` | bağlantı metni |
| `back_to_footnote_reference` | Dipnot başvurusuna dön |

## Locale uk

Ukrainian

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Форматування Markdown |
| `undo_a8283a` | Скасувати |
| `redo_742739` | Повторити |
| `bold_ctrl_b_84787d` | Напівжирний (Ctrl+B) |
| `bold_94fee6` | Напівжирний |
| `italic_ctrl_i_ccc60d` | Курсив (Ctrl+I) |
| `italic_9bf37c` | Курсив |
| `strikethrough_9aabbc` | Закреслення |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Послідовно змінювати рівень заголовка (H1–H6, потім звичайний текст) |
| `cycle_heading_level_bde9c4` | Послідовно змінювати рівень заголовка |
| `bulleted_list_ce51b3` | Маркірований список |
| `task_list_5d3253` | Список завдань |
| `numbered_list_cc62f6` | Нумерований список |
| `quote_eb4cde` | Цитата |
| `inline_code_e767de` | Вбудований код |
| `code_block_754538` | Кодовий блок |
| `link_a6a32d` | Посилання |
| `insert_table_67318e` | Вставити таблицю |
| `edit_markdown_6ff388` | Редагувати Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | Новий файл Markdown (Ctrl+N) |
| `new_markdown_file_0928e9` | Новий файл Markdown |
| `open_markdown_file_b7764a` | Відкрити файл Markdown |
| `print_ctrl_p_5c4406` | Друк (Ctrl+P) |
| `print_document_2a024b` | Роздрукувати документ |
| `search_text_38d268` | Шукати в тексті |
| `settings_74a883` | Налаштування |
| `switch_to_dark_mode_fc43ea` | Перемкнутися на темну тему |
| `about_markdown_vision_08f9a5` | Про Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | Ліцензія GNU GPLv3 |
| `version_version_a18745` | Версія {version} |
| `latest_version_checking_4bfedc` | Остання версія: перевірка… |
| `update_c1c100` | Оновити |
| `update_text_editor` | Оновити текст |
| `keep_unchanged_editor` | Залишити без змін |
| `check_for_updates_f26f32` | Перевірити наявність оновлень |
| `restart_markdown_vision_7e50f8` | Перезапустити Markdown Vision |
| `text_search_10155f` | Пошук у тексті |
| `count_match_ef9195` | {count} результат пошуку |
| `count_matches_43682a` | {count} результатів пошуку |
| `previous_match_daa2f8` | Попередній результат пошуку |
| `next_match_825e5a` | Наступний результат пошуку |
| `close_search_55656b` | Закрити пошук |
| `close_settings_0ccfef` | Закрити налаштування |
| `variable_width_font_0836b2` | Пропорційний шрифт |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Введіть назву шрифту або виберіть встановлений шрифт. |
| `fixed_width_font_3de094` | Моноширинний шрифт |
| `used_for_code_and_other_monospaced_text_84b6ed` | Використовується для коду та іншого моноширинного тексту. |
| `text_size_d68761` | Розмір тексту |
| `automatic_text_size_919785` | Автоматичний розмір тексту |
| `automatic_d461a4` | Автоматичний |
| `line_spacing_0db45d` | Міжрядковий інтервал |
| `page_width_limit_19528b` | Обмеження ширини сторінки |
| `automatic_page_width_bd5c30` | Автоматична ширина сторінки |
| `markdown_editor_da0ea6` | Редактор Markdown |
| `editor_view_1d1833` | Вигляд редактора |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown ліворуч, візуальний редактор праворуч |
| `split_0b61a1` | Розділити ↔ |
| `visual_above_markdown_a04e0f` | Візуальний редактор над Markdown |
| `split_b3b924` | Розділити ↕ |
| `visual_ba3033` | Візуальний |
| `save_ctrl_s_4be89e` | Зберегти (Ctrl+S) |
| `save_1509f5` | Зберегти |
| `save_as_ctrl_shift_s_0f132a` | Зберегти як (Ctrl+Shift+S) |
| `save_as_a4b76a` | Зберегти як… |
| `markdown_source_580118` | Джерело Markdown |
| `markdown_pane_width_ab0129` | Ширина панелі Markdown |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% Візуальний |
| `visual_editor_5665dd` | Візуальний редактор |
| `visual_editing_restriction_d42cea` | Обмеження візуального редагування |
| `edit_in_markdown_165fd4` | Редагувати в Markdown |
| `dismiss_48845b` | Закрити сповіщення |
| `count_word_1f505c` | Слово {count} |
| `count_words_caab29` | {count} слова |
| `approximate_word_count_7b987a` | Приблизна кількість слів: {count} |
| `line_line_column_column_21e9f4` | Рядок {line}, стовпець {column} |
| `untitled_md_2dccf8` | Без назви.md |
| `save_your_changes_56dd16` | Зберегти зміни? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Збережіть поточний документ перед створенням нового файлу. |
| `cancel_19766e` | Скасувати |
| `discard_changes_f9bfa3` | Відкинути зміни |
| `switch_to_light_mode_bfa0ca` | Перейти на світлу тему |
| `enter_the_name_of_any_installed_font_b57a72` | Введіть назву будь-якого встановленого шрифту. |
| `loading_installed_fonts_200c74` | Завантаження встановлених шрифтів… |
| `count_fixed_width_font_available_5488f8` | Доступні моноширинні шрифти: {count} |
| `count_fixed_width_fonts_available_5df530` | Доступні моноширинні шрифти: {count} |
| `count_variable_width_font_available_583582` | Доступні пропорційні шрифти: {count} |
| `count_variable_width_fonts_available_9d234c` | Доступні пропорційні шрифти: {count} |
| `count_match_for_query_2e77ac` | Результати пошуку за запитом «{query}»: {count} |
| `count_matches_for_query_7db710` | Результати пошуку за запитом «{query}»: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | Немає моноширинних шрифтів, що відповідають "{query}". |
| `no_variable_width_fonts_match_query_a64030` | Жоден пропорційний шрифт не відповідає "{query}". |
| `current_of_total_35d900` | {current} з {total} |
| `current_of_total_scope_94ebe5` | {current} з {total} · {scope} |
| `copy_code_49a005` | Скопіюйте код |
| `clipboard_unavailable_4ff69f` | Буфер обміну недоступний |
| `code_copied_39868c` | Код скопійовано |
| `could_not_copy_code_4a563f` | Не вдалося скопіювати код |
| `the_native_print_dialog_could_not_open_320714` | Не вдалося відкрити системне діалогове вікно друку. |
| `could_not_open_the_print_dialog_4bd85a` | Не вдалося відкрити діалогове вікно друку. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Відкинути незбережені зміни та відкрити інший документ? |
| `could_not_open_document_69abda` | Не вдалося відкрити документ |
| `release_check_failed_7b2758` | Не вдалося перевірити версію |
| `unrecognized_release_list_62d1cb` | Некоректний список версій |
| `unrecognized_version_d1b8d2` | Нерозпізнана версія |
| `latest_version_version_d1c996` | Остання версія: {version} |
| `unsupported_architecture_087e4f` | Непідтримувана архітектура |
| `installer_verification_is_unavailable_98306d` | Перевірка інсталятора недоступна |
| `unsupported_platform_a96892` | Непідтримувана платформа |
| `latest_compatible_version_version_fa3079` | Остання сумісна версія: {version} |
| `upgrade_markdown_vision_de1b45` | Оновити Markdown Vision |
| `download_macos_update_95d8f3` | Завантажити оновлення для macOS |
| `download_linux_update_707c5e` | Завантажити оновлення для Linux |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Не вдалося перевірити наявність оновлень. Перевірте підключення до Інтернету та повторіть спробу. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Завантаження та перевірка оновлення. Вас можуть попросити пройти автентифікацію. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Оновлення встановлено. Перезапустіть, щоб використовувати нову версію. |
| `update_failed_error_e4f7dc` | Помилка оновлення: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Завантажити та запустити програму встановлення Markdown Vision? Спершу збережіть усі відкриті документи. Інсталятор може попросити закрити Markdown Vision. |
| `downloading_and_verifying_update_02b3ba` | Завантаження та перевірка оновлення… |
| `installer_started_865e10` | Інсталятор запущено. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Не вдалося завантажити, перевірити чи запустити програму встановлення. Спробуйте ще раз. |
| `discard_unsaved_changes_and_restart_6d1602` | Відкинути незбережені зміни та перезапустити? |
| `could_not_restart_error_71e2d2` | Не вдалося перезапустити: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Двічі клацніть або натисніть Alt+Enter, щоб редагувати цей елемент |
| `saving_23e392` | Збереження… |
| `unsaved_6250d5` | Не збережено |
| `saved_b5c120` | Збережено |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Не вдалося зберегти чернетку. Ваші зміни залишилися в редакторі. |
| `embedded_content_1bca8f` | Вбудований вміст |
| `edit_table_source_c7189f` | Редагувати джерело таблиці |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Виберіть клітинку, щоб відредагувати її або змінити таблицю. Під час введення натисніть Alt+Enter. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Цей блок містить форматування, яке потрібно відредагувати в Markdown. |
| `code_contents_5a1f26` | Вміст коду |
| `type_directly_to_edit_this_indented_code_block_769291` | Вводьте текст безпосередньо в цьому блоці коду з відступом, щоб змінити його вміст. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Введіть безпосередньо в блок коду, щоб редагувати його вміст. Використовуйте Markdown для редагування рядків, які позначають, де він починається і закінчується. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Щоб змінити текст, виберіть «Редагувати елемент списку». Щоб змінити вкладеність, відредагуйте список у Markdown. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Щоб змінити список, виберіть «Редагувати елемент списку» або скористайтеся прапорцями. |
| `edit_list_item_text_a982e6` | Редагувати текст елемента списку |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Редагуйте текст елемента списку безпосередньо. Структуру списку редагуйте в Markdown. |
| `task_4bc74b` | Завдання |
| `edit_item_9f84ee` | Редагувати елемент списку |
| `list_options_fc3320` | Параметри списку |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Цю таблицю потрібно відредагувати в Markdown. |
| `add_text_to_this_empty_cell_37f900` | Додайте текст до цієї порожньої комірки |
| `edit_this_cell_in_markdown_4304b1` | Відредагуйте цю клітинку в Markdown |
| `edit_table_cell_a4212e` | Редагувати клітинку таблиці |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Виберіть клітинку, щоб відредагувати її. Ви можете редагувати базову таблицю в Markdown. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Ця комірка містить HTML. Відредагуйте цю комірку в Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | Ця комірка використовує посилання Markdown. Відредагуйте цю клітинку в Markdown. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Вводьте текст, щоб редагувати цю клітинку. Натисніть Alt+Enter, щоб переглянути параметри таблиці. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Вводьте текст безпосередньо в клітинки, що містять лише звичайний текст. Для складнішого вмісту використовуйте параметри таблиці або редагуйте Markdown. |
| `table_options_cf924a` | Параметри таблиці |
| `edit_note_299e60` | Редагувати виноску |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Щоб змінити редагований текст виноски, виберіть «Редагувати виноску». |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | Цей макет використовує HTML. Відредагуйте його в Markdown. |
| `edit_inline_code_bf93ee` | Редагувати вбудований код |
| `edit_list_structure_in_markdown_17a222` | Редагувати структуру списку в Markdown |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Відредагуйте звичайний текст списку безпосередньо. Відредагуйте структуру списку в Markdown. |
| `edit_code_in_table_cell_535cb9` | Відредагуйте код у клітинці таблиці |
| `edit_table_cell_text_ca30e7` | Редагувати текст комірки таблиці |
| `edit_preformatted_text_9737bd` | Редагувати попередньо відформатований текст |
| `edit_disclosure_title_79fb92` | Редагувати заголовок розгортаного розділу |
| `edit_text_7967d9` | Редагувати текст |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Введіть текст у клітинку. Натисніть Alt+Enter для опцій комірки. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Відредагуйте текст безпосередньо. Відредагуйте навколишню структуру в Markdown. |
| `edit_structure_in_markdown_fe607e` | Редагувати структуру в Markdown |
| `edit_quoted_text_9de474` | Відредагуйте цитований текст |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Редагуйте звичайний текст безпосередньо. Змінюйте структуру блоку цитати в Markdown. |
| `edit_heading_text_f3806c` | Редагувати текст заголовка |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Відредагуйте безпосередньо текст заголовка. Відредагуйте стиль заголовка в Markdown. |
| `heading_style_c0c25b` | Стиль заголовка |
| `edit_this_item_in_markdown_83b112` | Відредагуйте цей елемент у Markdown |
| `markdown_only_f6e1f7` | Лише в Markdown |
| `visual_only_29a136` | Лише у візуальному редакторі |
| `action_64cff1` | Дія |
| `apply_31e392` | Застосувати |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Markdown змінився. Повторно відкрийте цей редактор, щоб повторити спробу. |
| `edit_list_item_f69436` | Редагувати елемент списку |
| `item_text_markdown_0bbe7d` | Текст позиції (Markdown) |
| `new_item_b84cad` | Новий елемент списку |
| `enter_item_text_or_choose_remove_item_e4003a` | Введіть текст або виберіть «Видалити елемент списку». |
| `enter_item_text_82c7ea` | Введіть текст елемента. |
| `add_item_below_a6d694` | Додайте елемент нижче |
| `remove_item_5a89ed` | Видалити елемент списку |
| `indent_under_previous_item_2e6b03` | Вкласти в попередній пункт |
| `outdent_item_07e9b1` | Зменшити відступ елемента |
| `this_item_has_no_parent_to_outdent_from_dd148a` | У цього елемента немає батьківського елемента, тому зменшити відступ неможливо. |
| `heading_b34f17` | Заголовок |
| `edit_footnote_cdcee6` | Редагувати виноску |
| `note_text_369e75` | Текст виноски |
| `enter_the_note_text_on_one_line_3a7a5a` | Введіть текст нотатки в один рядок. |
| `cell_text_9cd173` | Текст клітинки |
| `add_row_below_3d4830` | Додайте рядок нижче |
| `add_column_after_38817e` | Додайте стовпець після |
| `new_column_editor` | Новий стовпець |
| `remove_row_1810fd` | Видалити рядок |
| `remove_column_9807a2` | Видалити стовпець |
| `align_column_left_6d9399` | Вирівняти стовпець ліворуч |
| `center_column_1b9b8b` | Вирівняти вміст стовпця по центру |
| `align_column_right_850a8f` | Вирівняти стовпець праворуч |
| `cell_text_markdown_a9e5f9` | Текст клітинки (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Закрийте вбудований код перед додаванням розриву рядка. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Цей текст комірки змінить структуру таблиці. Додайте пробіл перед роздільником у Markdown. |
| `alt_text_16f898` | Альтернативний текст |
| `link_text_markdown_9b92bd` | Текст посилання (Markdown) |
| `image_url_e55026` | URL зображення |
| `link_url_9dfd0b` | URL-адреса посилання |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | Редагувати пов'язане зображення |
| `edit_image_d9d12b` | Редагувати зображення |
| `edit_link_94026c` | Редагувати посилання |
| `enter_text_without_a_closing_bracket_0e7315` | Введіть текст без закриваючої дужки. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Введіть URL-адресу HTTP або HTTPS без пробілів і дужок. |
| `visual_pane_height_4ad683` | Висота візуальної панелі |
| `return_to_reader_dcd8f7` | Повернутися до режиму читання |
| `number_of_columns_2_8_893663` | Кількість стовпців (2–8) |
| `header_number_b79482` | Заголовок стовпця {number} |
| `cell_75fa38` | Комірка |
| `open_1f1d59` | Відкрити… |
| `new_18fdd5` | Новий |
| `print_07c371` | Роздрукувати… |
| `close_7d9eb7` | Закрити |
| `file_50009c` | Файл |
| `about_markdown_vision_c6d62d` | Про Markdown Vision… |
| `quit_markdown_vision_01c01b` | Вийти з Markdown Vision |
| `quit_b3eb37` | Вийти |
| `help_b79cac` | Довідка |
| `could_not_enumerate_system_fonts_00e652` | Не вдалося отримати список системних шрифтів |
| `no_system_fonts_found_a8a9af` | Системних шрифтів не знайдено |
| `could_not_open_document_640c27` | Не вдалося відкрити документ |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | Не вдалося відкрити документ. Ваші поточні зміни все ще доступні. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Відкинути незбережені зміни та закрити Markdown Vision? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Відкинути незбережені зміни та вийти з Markdown Vision? |
| `unknown_confirmation_request_feea29` | Невідомий запит на підтвердження |
| `keep_editing_624a83` | Продовжити редагування |
| `discard_eb1a70` | Відкинути |
| `unsaved_changes_a710c2` | Незбережені зміни |
| `the_document_is_no_longer_open_use_save_as_671c50` | Документ більше не відкритий. Скористайтеся командою «Зберегти як». |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Цей файл містить різні закінчення рядків або некоректне кодування UTF-8. Скористайтеся командою «Зберегти як». |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | Збереження через символічне посилання не підтримується. Скористайтеся командою «Зберегти як». |
| `invalid_destination_14f03f` | Недійсний пункт призначення |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | Файл призначення змінено на диску. Скористайтеся командою «Зберегти як», щоб зберегти свої зміни. |
| `the_update_process_failed_010689` | Помилка процесу оновлення. |
| `could_not_restore_the_open_document_69d724` | Не вдалося відновити відкритий документ. |
| `could_not_restart_markdown_vision_6ead36` | Не вдалося перезапустити Markdown Vision. |
| `restart_is_not_available_on_this_platform_998ef6` | Перезапуск недоступний на цій платформі. |
| `the_update_information_is_invalid_dbcffc` | Інформація про оновлення недійсна. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Для автоматичного оновлення потрібен встановлений пакет DEB або RPM. |
| `this_architecture_is_not_supported_ae063c` | Ця архітектура не підтримується. |
| `could_not_identify_the_linux_distribution_18bbdb` | Не вдалося визначити дистрибутив Linux. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | Менеджер пакетів RPM недоступний. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision не встановлено як сумісний пакет RPM. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Це оновлення не є новішим за встановлений пакет. |
| `the_debian_package_manager_is_unavailable_b5d66b` | Менеджер пакетів Debian недоступний. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision не встановлено як пакет DEB. |
| `could_not_determine_the_installed_version_f1a1f1` | Не вдалося визначити встановлену версію. |
| `could_not_compare_package_versions_465d4e` | Не вдалося порівняти версії пакетів. |
| `could_not_create_a_temporary_download_folder_36407c` | Не вдалося створити тимчасову папку для завантаження. |
| `could_not_start_the_download_b4acf0` | Не вдалося почати завантаження. |
| `the_update_could_not_be_downloaded_4d6fd7` | Не вдалося завантажити оновлення. |
| `could_not_verify_the_update_2cd2c5` | Не вдалося перевірити оновлення. |
| `the_downloaded_update_failed_verification_60519b` | Завантажене оновлення не пройшло перевірку. |
| `could_not_inspect_the_update_package_9812b2` | Не вдалося перевірити пакет оновлень. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | Завантажений пакет містить неочікувані метадані. |
| `version_dd1679` | Версія |
| `could_not_start_the_system_installer_907ba2` | Не вдалося запустити інсталятор системи. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | Встановлення скасовано або не вдалося. Спробуйте ще раз. |
| `could_not_verify_the_installed_update_04a200` | Не вдалося перевірити встановлене оновлення. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | Інсталятор не оновив Markdown Vision до очікуваної версії. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Автоматичні оновлення DEB доступні лише на Linux. |
| `invalid_preferences_bc6b57` | Недійсні параметри |
| `invalid_key_b06fe9` | Недійсний {key} |
| `unsupported_preferences_version_54734c` | Непідтримувана версія налаштувань |
| `missing_preferences_679970` | Відсутні налаштування |
| `invalid_preferences_directory_a6f362` | Недійсний каталог налаштувань |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision не вдалося прочитати цей файл. |
| `markdown_files_177420` | Файли Markdown |
| `text_files_c5df15` | Текстові файли |
| `all_files_866956` | Всі файли |
| `save_markdown_file_813f90` | Зберегти файл Markdown |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Цей документ більше не відкритий. Повторно відкрийте файл або скористайтеся командою «Зберегти як». |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Скористайтеся командою «Зберегти як», щоб створити копію цього файлу в кодуванні UTF-8. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | Цей файл використовує змішані закінчення рядків. Використовуйте «Зберегти як», щоб створити копію з узгодженими закінченнями рядків. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows не вдалося відкрити діалогове вікно «Зберегти як». |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | Чернетку не вдалося закодувати як UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows не вдалося прочитати вибране місце призначення. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | Файл змінено на диску або недоступний. Використовуйте Зберегти як, щоб зберегти свої зміни в окремій копії. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows не вдалося зберегти файл. Переконайтеся, що файл доступний для запису, або скористайтеся командою «Зберегти як». |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows не вдалося відновити вихідний файл під час збереження. Оригінал розташовано за адресою {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | Не вдалося виконати запит на збереження. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision не зміг підготувати файли своєї програми в локальній папці даних програми. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Потрібен Microsoft Edge WebView2 Runtime. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Установлення Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | Ліцензія: GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | Для цього інсталятора потрібен Windows на ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision працює. Перш ніж продовжити, збережіть усі незбережені документи. Закрити Markdown Vision і продовжити встановлення? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | Програмі встановлення не вдалося закрити Markdown Vision. Закрийте його вручну та знову запустіть установлення. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision усе ще працює. Закрийте його та виберіть Повторити або скасуйте встановлення. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Видалення поточної встановленої версії Markdown Vision… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | Не вдалося видалити наявну версію Markdown Vision. Програма встановлення завершить роботу без установлення Markdown Vision Native. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | У параметрах Windows можна вибрати Markdown Vision типовою програмою для файлів Markdown. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Відкрити параметри типових програм Windows після встановлення |
| `markdown_vision_has_been_installed_40d44f` | Програму Markdown Vision установлено. |
| `open_markdown_vision_when_setup_closes_8422c7` | Відкрити Markdown Vision після закриття програми встановлення |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Markdown Vision Native не вдалося встановити. Налаштування буде зупинено без реєстрації неповної інсталяції. |
| `markdown_document_00271f` | Документ Markdown |
| `markdown_vision_preview_handler_8c95f7` | Обробник попереднього перегляду Markdown Vision |
| `markdown_file_viewer_c36ee7` | Переглядач файлів Markdown |
| `uninstall_fe1995` | Видалити |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision не вдалося запустити. {error} |
| `unknown_native_method_method_cc7ca9` | Невідомий рідний метод: {method} |
| `text_71988c` | Текст |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | Заголовок {level} |
| `normal_text_a2adc4` | Звичайний текст |
| `footnotes_ad6fb5` | Виноски |
| `size_px_8d05e6` | {size} px |
| `link_text_insert_default` | текст посилання |
| `back_to_footnote_reference` | Повернутися до посилання на виноску |

## Locale vi

Vietnamese

| Key | Translation |
| --- | --- |
| `markdown_formatting_bc5026` | Định dạng Markdown |
| `undo_a8283a` | Hoàn tác |
| `redo_742739` | Làm lại |
| `bold_ctrl_b_84787d` | In đậm (Ctrl+B) |
| `bold_94fee6` | In đậm |
| `italic_ctrl_i_ccc60d` | In nghiêng (Ctrl+I) |
| `italic_9bf37c` | In nghiêng |
| `strikethrough_9aabbc` | Gạch ngang |
| `cycle_heading_level_h1_h6_then_normal_text_7eec48` | Lần lượt chuyển qua các cấp tiêu đề (H1–H6, sau đó là văn bản thường) |
| `cycle_heading_level_bde9c4` | Lần lượt chuyển qua các cấp tiêu đề |
| `bulleted_list_ce51b3` | Danh sách có dấu đầu dòng |
| `task_list_5d3253` | Danh sách nhiệm vụ |
| `numbered_list_cc62f6` | Danh sách đánh số |
| `quote_eb4cde` | Trích dẫn |
| `inline_code_e767de` | Mã nội tuyến |
| `code_block_754538` | Khối mã |
| `link_a6a32d` | Liên kết |
| `insert_table_67318e` | Chèn bảng |
| `edit_markdown_6ff388` | Chỉnh sửa Markdown |
| `new_markdown_file_ctrl_n_f22ed5` | Tệp Markdown mới (Ctrl+N) |
| `new_markdown_file_0928e9` | Tệp Markdown mới |
| `open_markdown_file_b7764a` | Mở tệp Markdown |
| `print_ctrl_p_5c4406` | In (Ctrl+P) |
| `print_document_2a024b` | In tài liệu |
| `search_text_38d268` | Tìm trong văn bản |
| `settings_74a883` | Cài đặt |
| `switch_to_dark_mode_fc43ea` | Chuyển sang chế độ tối |
| `about_markdown_vision_08f9a5` | Giới thiệu về Markdown Vision |
| `2026_mark_lloyd_12c607` | © 2026 Mark Lloyd |
| `gnu_gplv3_license_6ae397` | Giấy phép GNU GPLv3 |
| `version_version_a18745` | Phiên bản {version} |
| `latest_version_checking_4bfedc` | Phiên bản mới nhất: đang kiểm tra… |
| `update_c1c100` | Cập nhật |
| `update_text_editor` | Cập nhật văn bản |
| `keep_unchanged_editor` | Giữ nguyên |
| `check_for_updates_f26f32` | Kiểm tra các bản cập nhật |
| `restart_markdown_vision_7e50f8` | Khởi động lại Markdown Vision |
| `text_search_10155f` | Tìm kiếm văn bản |
| `count_match_ef9195` | {count} kết quả tìm kiếm |
| `count_matches_43682a` | {count} kết quả tìm kiếm |
| `previous_match_daa2f8` | Kết quả tìm kiếm trước |
| `next_match_825e5a` | Kết quả tìm kiếm tiếp theo |
| `close_search_55656b` | Đóng tìm kiếm |
| `close_settings_0ccfef` | Đóng cài đặt |
| `variable_width_font_0836b2` | Phông chữ có chiều rộng thay đổi |
| `type_a_font_name_or_choose_an_installed_font_244fa3` | Nhập tên phông chữ hoặc chọn phông chữ đã cài đặt. |
| `fixed_width_font_3de094` | Phông chữ có chiều rộng cố định |
| `used_for_code_and_other_monospaced_text_84b6ed` | Dùng cho mã và các văn bản khác có độ rộng ký tự cố định. |
| `text_size_d68761` | Kích thước văn bản |
| `automatic_text_size_919785` | Kích thước văn bản tự động |
| `automatic_d461a4` | Tự động |
| `line_spacing_0db45d` | Khoảng cách dòng |
| `page_width_limit_19528b` | Giới hạn chiều rộng trang |
| `automatic_page_width_bd5c30` | Chiều rộng trang tự động |
| `markdown_editor_da0ea6` | Trình chỉnh sửa Markdown |
| `editor_view_1d1833` | Chế độ xem trình soạn thảo |
| `markdown_0e52f6` | Markdown |
| `markdown_left_visual_right_763989` | Markdown bên trái, trình soạn thảo trực quan bên phải |
| `split_0b61a1` | Chia ↔ |
| `visual_above_markdown_a04e0f` | Trình soạn thảo trực quan ở trên, Markdown ở dưới |
| `split_b3b924` | Chia ↕ |
| `visual_ba3033` | Trực quan |
| `save_ctrl_s_4be89e` | Lưu (Ctrl+S) |
| `save_1509f5` | Lưu |
| `save_as_ctrl_shift_s_0f132a` | Lưu dưới dạng (Ctrl+Shift+S) |
| `save_as_a4b76a` | Lưu dưới dạng… |
| `markdown_source_580118` | Nguồn Markdown |
| `markdown_pane_width_ab0129` | Chiều rộng khung Markdown |
| `percent_markdown_0a45d1` | {percent}% Markdown |
| `percent_visual_a8635d` | {percent}% trực quan |
| `visual_editor_5665dd` | Trình chỉnh sửa trực quan |
| `visual_editing_restriction_d42cea` | Hạn chế chỉnh sửa trực quan |
| `edit_in_markdown_165fd4` | Chỉnh sửa trong Markdown |
| `dismiss_48845b` | Đóng thông báo |
| `count_word_1f505c` | Từ {count} |
| `count_words_caab29` | Từ {count} |
| `approximate_word_count_7b987a` | Số từ ước tính: {count} |
| `line_line_column_column_21e9f4` | Dòng {line}, cột {column} |
| `untitled_md_2dccf8` | Không có tiêu đề.md |
| `save_your_changes_56dd16` | Lưu thay đổi của bạn? |
| `save_your_current_document_before_creating_a_new_file_ff6f25` | Lưu tài liệu hiện tại của bạn trước khi tạo một tập tin mới. |
| `cancel_19766e` | Hủy bỏ |
| `discard_changes_f9bfa3` | Bỏ các thay đổi |
| `switch_to_light_mode_bfa0ca` | Chuyển sang chế độ sáng |
| `enter_the_name_of_any_installed_font_b57a72` | Nhập tên của bất kỳ phông chữ nào đã được cài đặt. |
| `loading_installed_fonts_200c74` | Đang tải phông chữ đã cài đặt… |
| `count_fixed_width_font_available_5488f8` | Phông chữ có chiều rộng cố định có sẵn: {count} |
| `count_fixed_width_fonts_available_5df530` | Phông chữ có chiều rộng cố định có sẵn: {count} |
| `count_variable_width_font_available_583582` | Phông chữ có chiều rộng thay đổi có sẵn: {count} |
| `count_variable_width_fonts_available_9d234c` | Phông chữ có chiều rộng thay đổi có sẵn: {count} |
| `count_match_for_query_2e77ac` | Kết quả tìm kiếm cho “{query}”: {count} |
| `count_matches_for_query_7db710` | Kết quả tìm kiếm cho “{query}”: {count} |
| `no_fixed_width_fonts_match_query_fb1fab` | Không có phông chữ có chiều rộng cố định nào khớp với "{query}". |
| `no_variable_width_fonts_match_query_a64030` | Không có phông chữ có chiều rộng thay đổi nào khớp với "{query}". |
| `current_of_total_35d900` | {current} trên {total} |
| `current_of_total_scope_94ebe5` | {current} trên {total} · {scope} |
| `copy_code_49a005` | Sao chép mã |
| `clipboard_unavailable_4ff69f` | Không có bảng nhớ tạm |
| `code_copied_39868c` | Đã sao chép mã |
| `could_not_copy_code_4a563f` | Không thể sao chép mã |
| `the_native_print_dialog_could_not_open_320714` | Không thể mở hộp thoại in của hệ thống. |
| `could_not_open_the_print_dialog_4bd85a` | Không thể mở hộp thoại in. |
| `discard_your_unsaved_changes_and_open_another_document_d01eb9` | Bỏ các thay đổi chưa lưu và mở tài liệu khác? |
| `could_not_open_document_69abda` | Không thể mở tài liệu |
| `release_check_failed_7b2758` | Không thể kiểm tra phiên bản |
| `unrecognized_release_list_62d1cb` | Không nhận dạng được danh sách phiên bản |
| `unrecognized_version_d1b8d2` | Phiên bản không được công nhận |
| `latest_version_version_d1c996` | Phiên bản mới nhất: {version} |
| `unsupported_architecture_087e4f` | Kiến trúc không được hỗ trợ |
| `installer_verification_is_unavailable_98306d` | Xác minh trình cài đặt không khả dụng |
| `unsupported_platform_a96892` | Nền tảng không được hỗ trợ |
| `latest_compatible_version_version_fa3079` | Phiên bản tương thích mới nhất: {version} |
| `upgrade_markdown_vision_de1b45` | Cập nhật Markdown Vision |
| `download_macos_update_95d8f3` | Tải xuống bản cập nhật cho macOS |
| `download_linux_update_707c5e` | Tải xuống bản cập nhật cho Linux |
| `unable_to_check_for_updates_check_your_internet_connect_31ebd2` | Không thể kiểm tra cập nhật. Hãy kiểm tra kết nối Internet của bạn và thử lại. |
| `downloading_and_verifying_the_update_you_may_be_asked_t_99b46d` | Đang tải xuống và xác minh bản cập nhật. Bạn có thể được yêu cầu xác thực. |
| `update_installed_restart_to_use_the_new_version_bb8a43` | Đã cài đặt bản cập nhật. Khởi động lại để sử dụng phiên bản mới. |
| `update_failed_error_e4f7dc` | Cập nhật không thành công: {error} |
| `download_and_run_the_markdown_vision_installer_save_any_3e315d` | Tải xuống và chạy trình cài đặt Markdown Vision? Lưu mọi tài liệu đang mở trước tiên. Thiết lập có thể yêu cầu đóng Markdown Vision. |
| `downloading_and_verifying_update_02b3ba` | Đang tải xuống và xác minh bản cập nhật… |
| `installer_started_865e10` | Trình cài đặt đã bắt đầu. |
| `could_not_download_verify_or_start_the_installer_please_b0d6ee` | Không thể tải xuống, xác minh hoặc khởi động trình cài đặt. Vui lòng thử lại. |
| `discard_unsaved_changes_and_restart_6d1602` | Bỏ các thay đổi chưa lưu và khởi động lại? |
| `could_not_restart_error_71e2d2` | Không thể khởi động lại: {error} |
| `double_click_or_press_alt_enter_to_edit_this_item_5c41ce` | Nhấp đúp hoặc nhấn Alt+Enter để chỉnh sửa mục này |
| `saving_23e392` | Đang lưu… |
| `unsaved_6250d5` | Chưa lưu |
| `saved_b5c120` | Đã lưu |
| `could_not_save_the_draft_your_edits_are_still_open_6a69a6` | Không thể lưu bản nháp. Các thay đổi của bạn vẫn còn trong trình soạn thảo. |
| `embedded_content_1bca8f` | Nội dung được nhúng |
| `edit_table_source_c7189f` | Chỉnh sửa nguồn bảng |
| `select_a_cell_to_edit_it_or_change_the_table_press_alt_56b30f` | Chọn một ô để chỉnh sửa hoặc thay đổi bảng. Nhấn Alt+Enter trong khi gõ. |
| `this_block_contains_formatting_that_needs_to_be_edited_c2c5d4` | Khối này chứa định dạng cần chỉnh sửa trong Markdown. |
| `code_contents_5a1f26` | Nội dung mã |
| `type_directly_to_edit_this_indented_code_block_769291` | Nhập trực tiếp vào khối mã thụt lề này để chỉnh sửa. |
| `type_directly_in_the_code_block_to_edit_its_contents_us_57266a` | Nhập trực tiếp vào khối mã để chỉnh sửa nội dung của nó. Sử dụng Markdown để chỉnh sửa các dòng đánh dấu nơi bắt đầu và kết thúc. |
| `use_edit_item_to_change_the_text_to_change_the_nesting_75146c` | Dùng “Chỉnh sửa mục danh sách” để đổi nội dung. Để đổi cấp lồng, hãy sửa danh sách trong Markdown. |
| `use_edit_item_or_the_checkboxes_to_change_this_list_730d9b` | Dùng “Chỉnh sửa mục danh sách” hoặc các hộp kiểm để thay đổi danh sách này. |
| `edit_list_item_text_a982e6` | Chỉnh sửa văn bản mục danh sách |
| `edit_item_text_directly_edit_the_list_structure_in_mark_af9c40` | Chỉnh sửa văn bản mục trực tiếp. Chỉnh sửa cấu trúc danh sách trong Markdown. |
| `task_4bc74b` | Nhiệm vụ |
| `edit_item_9f84ee` | Chỉnh sửa mục danh sách |
| `list_options_fc3320` | Tùy chọn danh sách |
| `this_table_needs_to_be_edited_in_markdown_8a62a4` | Bảng này cần được chỉnh sửa trong Markdown. |
| `add_text_to_this_empty_cell_37f900` | Thêm văn bản vào ô trống này |
| `edit_this_cell_in_markdown_4304b1` | Chỉnh sửa ô này trong Markdown |
| `edit_table_cell_a4212e` | Chỉnh sửa ô bảng |
| `select_a_cell_to_edit_it_you_can_edit_the_underlying_ta_1bdbc1` | Chọn ô cần sửa. Bạn có thể sửa bảng gốc trong Markdown. |
| `this_cell_contains_html_edit_this_cell_in_markdown_04e59f` | Ô này chứa HTML. Chỉnh sửa ô này trong Markdown. |
| `this_cell_uses_markdown_references_edit_this_cell_in_ma_bb2d82` | Ô này sử dụng tham chiếu Markdown. Chỉnh sửa ô này trong Markdown. |
| `type_to_edit_this_cell_press_alt_enter_for_table_option_0f91ed` | Nhập để chỉnh sửa ô này. Nhấn Alt+Enter để có các tùy chọn bảng. |
| `type_directly_in_plain_cells_use_table_options_or_edit_5bc433` | Gõ trực tiếp vào các ô chỉ chứa văn bản thuần. Với nội dung phức tạp hơn, hãy dùng tùy chọn bảng hoặc chỉnh sửa Markdown. |
| `table_options_cf924a` | Tùy chọn bảng |
| `edit_note_299e60` | Sửa chú thích cuối trang |
| `use_edit_note_to_change_supported_footnote_text_2805fa` | Dùng “Sửa chú thích cuối trang” để thay đổi phần văn bản có thể chỉnh sửa của chú thích. |
| `this_layout_uses_html_edit_it_in_markdown_3bcc5c` | Bố cục này sử dụng HTML. Chỉnh sửa nó trong Markdown. |
| `edit_inline_code_bf93ee` | Chỉnh sửa mã nội tuyến |
| `edit_list_structure_in_markdown_17a222` | Chỉnh sửa cấu trúc danh sách trong Markdown |
| `edit_the_plain_list_text_directly_edit_the_list_structu_f7679e` | Chỉnh sửa văn bản danh sách đơn giản trực tiếp. Chỉnh sửa cấu trúc danh sách trong Markdown. |
| `edit_code_in_table_cell_535cb9` | Chỉnh sửa mã trong ô bảng |
| `edit_table_cell_text_ca30e7` | Chỉnh sửa văn bản ô bảng |
| `edit_preformatted_text_9737bd` | Chỉnh sửa văn bản được định dạng sẵn |
| `edit_disclosure_title_79fb92` | Chỉnh sửa tiêu đề của phần có thể mở rộng |
| `edit_text_7967d9` | Chỉnh sửa văn bản |
| `type_in_the_cell_text_press_alt_enter_for_cell_options_e3772e` | Nhập văn bản ô. Nhấn Alt+Enter để có các tùy chọn ô. |
| `edit_the_text_directly_edit_the_surrounding_structure_i_2e635c` | Chỉnh sửa văn bản trực tiếp. Chỉnh sửa cấu trúc xung quanh trong Markdown. |
| `edit_structure_in_markdown_fe607e` | Chỉnh sửa cấu trúc trong Markdown |
| `edit_quoted_text_9de474` | Chỉnh sửa văn bản được trích dẫn |
| `edit_the_plain_text_directly_edit_the_quote_structure_i_34c1cf` | Chỉnh sửa trực tiếp văn bản thuần túy. Sửa cấu trúc khối trích dẫn trong Markdown. |
| `edit_heading_text_f3806c` | Chỉnh sửa văn bản tiêu đề |
| `edit_the_heading_text_directly_edit_the_heading_style_i_aa8552` | Chỉnh sửa văn bản tiêu đề trực tiếp. Chỉnh sửa kiểu tiêu đề trong Markdown. |
| `heading_style_c0c25b` | Kiểu tiêu đề |
| `edit_this_item_in_markdown_83b112` | Chỉnh sửa mục này trong Markdown |
| `markdown_only_f6e1f7` | Chỉ trong Markdown |
| `visual_only_29a136` | Chỉ trong trình soạn thảo trực quan |
| `action_64cff1` | Hành động |
| `apply_31e392` | Áp dụng |
| `the_markdown_changed_reopen_this_editor_to_try_again_f8f91b` | Markdown đã thay đổi. Mở lại trình chỉnh sửa này để thử lại. |
| `edit_list_item_f69436` | Chỉnh sửa mục danh sách |
| `item_text_markdown_0bbe7d` | Văn bản mục (Markdown) |
| `new_item_b84cad` | Mục danh sách mới |
| `enter_item_text_or_choose_remove_item_e4003a` | Nhập nội dung hoặc chọn “Xóa mục”. |
| `enter_item_text_82c7ea` | Nhập văn bản mục. |
| `add_item_below_a6d694` | Thêm mục bên dưới |
| `remove_item_5a89ed` | Xóa mục |
| `indent_under_previous_item_2e6b03` | Thụt lề dưới mục trước |
| `outdent_item_07e9b1` | Giảm thụt lề của mục |
| `this_item_has_no_parent_to_outdent_from_dd148a` | Không có mục cha nên không thể giảm thụt lề cho mục này. |
| `heading_b34f17` | Tiêu đề |
| `edit_footnote_cdcee6` | Chỉnh sửa chú thích cuối trang |
| `note_text_369e75` | Văn bản chú thích cuối trang |
| `enter_the_note_text_on_one_line_3a7a5a` | Nhập văn bản ghi chú trên một dòng. |
| `cell_text_9cd173` | Văn bản ô |
| `add_row_below_3d4830` | Thêm hàng bên dưới |
| `add_column_after_38817e` | Thêm cột sau |
| `new_column_editor` | Cột mới |
| `remove_row_1810fd` | Xóa hàng |
| `remove_column_9807a2` | Xóa cột |
| `align_column_left_6d9399` | Căn chỉnh cột trái |
| `center_column_1b9b8b` | Căn giữa nội dung cột |
| `align_column_right_850a8f` | Căn chỉnh cột phải |
| `cell_text_markdown_a9e5f9` | Văn bản ô (Markdown) |
| `close_inline_code_before_adding_a_line_break_1d66a9` | Đóng mã nội tuyến trước khi thêm ngắt dòng. |
| `this_cell_text_would_change_the_table_structure_add_a_s_984ac6` | Văn bản ô này sẽ thay đổi cấu trúc bảng. Thêm dấu cách trước dấu phân cách trong Markdown. |
| `alt_text_16f898` | Văn bản thay thế |
| `link_text_markdown_9b92bd` | Văn bản liên kết (Markdown) |
| `image_url_e55026` | URL hình ảnh |
| `link_url_9dfd0b` | URL liên kết |
| `url_e7a241` | URL |
| `edit_linked_image_2f9456` | Chỉnh sửa hình ảnh được liên kết |
| `edit_image_d9d12b` | Chỉnh sửa hình ảnh |
| `edit_link_94026c` | Chỉnh sửa liên kết |
| `enter_text_without_a_closing_bracket_0e7315` | Nhập văn bản không có dấu ngoặc đóng. |
| `enter_an_http_or_https_url_without_spaces_or_parenthese_0f4abf` | Nhập URL HTTP hoặc HTTPS không có dấu cách hoặc dấu ngoặc đơn. |
| `visual_pane_height_4ad683` | Chiều cao khung trực quan |
| `return_to_reader_dcd8f7` | Quay lại chế độ đọc |
| `number_of_columns_2_8_893663` | Số cột (2–8) |
| `header_number_b79482` | Tiêu đề cột {number} |
| `cell_75fa38` | Ô |
| `open_1f1d59` | Mở… |
| `new_18fdd5` | Mới |
| `print_07c371` | In… |
| `close_7d9eb7` | Đóng |
| `file_50009c` | Tệp |
| `about_markdown_vision_c6d62d` | Về Markdown Vision… |
| `quit_markdown_vision_01c01b` | Thoát khỏi Markdown Vision |
| `quit_b3eb37` | Thoát |
| `help_b79cac` | Trợ giúp |
| `could_not_enumerate_system_fonts_00e652` | Không thể liệt kê phông chữ hệ thống |
| `no_system_fonts_found_a8a9af` | Không tìm thấy phông chữ hệ thống |
| `could_not_open_document_640c27` | Không thể mở tài liệu |
| `the_document_could_not_be_opened_your_current_changes_a_7cb440` | Không thể mở được tài liệu này. Những thay đổi hiện tại của bạn vẫn có sẵn. {message} |
| `discard_your_unsaved_changes_and_close_markdown_vision_4f26aa` | Bỏ các thay đổi chưa lưu và đóng Markdown Vision? |
| `discard_your_unsaved_changes_and_quit_markdown_vision_454379` | Bỏ các thay đổi chưa lưu và thoát Markdown Vision? |
| `unknown_confirmation_request_feea29` | Yêu cầu xác nhận không xác định |
| `keep_editing_624a83` | Tiếp tục chỉnh sửa |
| `discard_eb1a70` | Bỏ thay đổi |
| `unsaved_changes_a710c2` | Những thay đổi chưa được lưu |
| `the_document_is_no_longer_open_use_save_as_671c50` | Tài liệu không còn mở nữa. Sử dụng Lưu dưới dạng. |
| `this_file_has_mixed_line_endings_or_invalid_utf_8_use_s_c39db0` | Tệp này dùng nhiều kiểu kết thúc dòng hoặc có mã hóa UTF-8 không hợp lệ. Chọn “Lưu dưới dạng”. |
| `saving_through_a_symbolic_link_is_not_supported_use_sav_fdda24` | Lưu thông qua liên kết tượng trưng không được hỗ trợ. Sử dụng Lưu dưới dạng. |
| `invalid_destination_14f03f` | Điểm đến không hợp lệ |
| `the_destination_changed_on_disk_use_save_as_to_preserve_54ab44` | Tệp đích trên đĩa đã thay đổi. Chọn “Lưu dưới dạng” để giữ các chỉnh sửa của bạn. |
| `the_update_process_failed_010689` | Quá trình cập nhật không thành công. |
| `could_not_restore_the_open_document_69d724` | Không thể khôi phục tài liệu đang mở. |
| `could_not_restart_markdown_vision_6ead36` | Không thể khởi động lại Markdown Vision. |
| `restart_is_not_available_on_this_platform_998ef6` | Khởi động lại không có sẵn trên nền tảng này. |
| `the_update_information_is_invalid_dbcffc` | Thông tin cập nhật không hợp lệ. |
| `automatic_updates_require_an_installed_deb_or_rpm_packa_d688fe` | Cập nhật tự động yêu cầu cài đặt gói DEB hoặc RPM. |
| `this_architecture_is_not_supported_ae063c` | Kiến trúc này không được hỗ trợ. |
| `could_not_identify_the_linux_distribution_18bbdb` | Không thể xác định bản phân phối Linux. |
| `the_rpm_package_manager_is_unavailable_9ce83b` | Trình quản lý gói RPM không khả dụng. |
| `markdown_vision_is_not_installed_as_a_compatible_rpm_pa_d38aa6` | Markdown Vision chưa được cài đặt dưới dạng gói RPM tương thích. |
| `this_update_is_not_newer_than_the_installed_package_bc5e4e` | Bản cập nhật này không mới hơn gói đã cài đặt. |
| `the_debian_package_manager_is_unavailable_b5d66b` | Trình quản lý gói Debian không khả dụng. |
| `markdown_vision_is_not_installed_as_a_deb_package_555573` | Markdown Vision chưa được cài đặt dưới dạng gói DEB. |
| `could_not_determine_the_installed_version_f1a1f1` | Không thể xác định phiên bản đã cài đặt. |
| `could_not_compare_package_versions_465d4e` | Không thể so sánh các phiên bản gói. |
| `could_not_create_a_temporary_download_folder_36407c` | Không thể tạo thư mục tải xuống tạm thời. |
| `could_not_start_the_download_b4acf0` | Không thể bắt đầu tải xuống. |
| `the_update_could_not_be_downloaded_4d6fd7` | Không thể tải xuống bản cập nhật. |
| `could_not_verify_the_update_2cd2c5` | Không thể xác minh bản cập nhật. |
| `the_downloaded_update_failed_verification_60519b` | Xác minh bản cập nhật đã tải xuống không thành công. |
| `could_not_inspect_the_update_package_9812b2` | Không thể kiểm tra gói cập nhật. |
| `the_downloaded_package_has_unexpected_metadata_36a60e` | Gói đã tải xuống có siêu dữ liệu không mong muốn. |
| `version_dd1679` | Phiên bản |
| `could_not_start_the_system_installer_907ba2` | Không thể khởi động trình cài đặt hệ thống. |
| `installation_was_cancelled_or_failed_please_try_again_3c0c74` | Quá trình cài đặt đã bị hủy hoặc không thành công. Vui lòng thử lại. |
| `could_not_verify_the_installed_update_04a200` | Không thể xác minh bản cập nhật đã cài đặt. |
| `the_installer_did_not_update_markdown_vision_to_the_exp_7ecc66` | Trình cài đặt không cập nhật Markdown Vision lên phiên bản dự kiến. |
| `automatic_deb_updates_are_only_available_on_linux_7cc807` | Cập nhật DEB tự động chỉ khả dụng trên Linux. |
| `invalid_preferences_bc6b57` | Tùy chọn không hợp lệ |
| `invalid_key_b06fe9` | {key} không hợp lệ |
| `unsupported_preferences_version_54734c` | Phiên bản tùy chọn không được hỗ trợ |
| `missing_preferences_679970` | Thiếu tùy chọn |
| `invalid_preferences_directory_a6f362` | Thư mục tùy chọn không hợp lệ |
| `markdown_vision_native_9b1051` | Markdown Vision Native |
| `markdown_vision_could_not_read_this_file_275538` | Markdown Vision không thể đọc tệp này. |
| `markdown_files_177420` | Tệp Markdown |
| `text_files_c5df15` | Tệp văn bản |
| `all_files_866956` | Tất cả các tập tin |
| `save_markdown_file_813f90` | Lưu tệp Markdown |
| `this_document_is_no_longer_open_reopen_the_file_or_use_be1bdc` | Tài liệu này không còn mở nữa. Mở lại tệp hoặc sử dụng Lưu dưới dạng. |
| `use_save_as_to_create_a_utf_8_copy_of_this_file_a71be2` | Sử dụng Lưu dưới dạng để tạo bản sao UTF-8 của tệp này. |
| `this_file_uses_mixed_line_endings_use_save_as_to_create_20186e` | Tệp này dùng nhiều kiểu xuống dòng. Chọn “Lưu dưới dạng” để tạo bản sao dùng cùng một kiểu xuống dòng. |
| `windows_could_not_open_the_save_as_dialog_702a77` | Windows không thể mở hộp thoại Lưu dưới dạng. |
| `the_draft_could_not_be_encoded_as_utf_8_a38015` | Không thể mã hóa bản nháp thành UTF-8. |
| `windows_could_not_read_the_selected_destination_2c13f6` | Windows không thể đọc đích đã chọn. |
| `the_file_changed_on_disk_or_is_unavailable_use_save_as_284380` | Tệp đã thay đổi trên đĩa hoặc không có sẵn. Sử dụng Lưu dưới dạng để giữ các chỉnh sửa của bạn trong một bản sao riêng. |
| `windows_could_not_save_the_file_check_that_the_file_is_c478f9` | Windows không thể lưu tệp. Kiểm tra xem tệp có thể ghi được hay không hoặc sử dụng Lưu dưới dạng. |
| `windows_could_not_restore_the_original_file_during_the_fa41b0` | Windows không thể khôi phục tệp gốc trong quá trình lưu. Bản gốc có tại {path}. |
| `the_save_request_could_not_be_completed_75cfa5` | Yêu cầu lưu không thể hoàn thành. |
| `markdown_vision_could_not_prepare_its_application_files_372c11` | Markdown Vision không thể chuẩn bị các tệp ứng dụng trong thư mục dữ liệu ứng dụng cục bộ của bạn. |
| `microsoft_edge_webview2_runtime_is_required_a565a2` | Cần có môi trường chạy Microsoft Edge WebView2. |
| `markdown_vision_version_native_414223` | Markdown Vision {version} (Native) |
| `markdown_vision_native_setup_c91176` | Trình cài đặt Markdown Vision Native |
| `licensed_under_gpl_3_0_only_5f7e0f` | Được cấp phép theo GPL-3.0-only |
| `this_installer_requires_windows_on_arm64_ef7f28` | Trình cài đặt này yêu cầu Windows trên ARM64. |
| `markdown_vision_is_running_save_any_unsaved_documents_b_52a23b` | Markdown Vision đang chạy. Hãy lưu mọi tài liệu chưa được lưu trước khi tiếp tục. Đóng Markdown Vision và tiếp tục cài đặt? |
| `setup_could_not_close_markdown_vision_close_it_manually_f94a3c` | Trình cài đặt không thể đóng Markdown Vision. Hãy đóng ứng dụng theo cách thủ công rồi chạy lại trình cài đặt. |
| `markdown_vision_is_still_running_close_it_and_select_re_7c911d` | Markdown Vision vẫn đang chạy. Hãy đóng ứng dụng và chọn Thử lại hoặc hủy cài đặt. |
| `removing_the_currently_installed_markdown_vision_editio_2fa13b` | Đang xóa phiên bản Markdown Vision hiện được cài đặt… |
| `the_existing_markdown_vision_installation_could_not_be_5fb02b` | Không thể gỡ bản Markdown Vision hiện có. Trình cài đặt sẽ dừng và không cài đặt Markdown Vision Native. |
| `markdown_vision_can_register_itself_as_a_viewer_for_mar_3f55d9` | Bạn có thể chọn Markdown Vision làm ứng dụng mặc định cho tệp Markdown trong Cài đặt Windows. |
| `set_markdown_vision_as_the_default_application_for_mark_ce44e2` | Mở cài đặt ứng dụng mặc định của Windows sau khi cài đặt |
| `markdown_vision_has_been_installed_40d44f` | Đã cài đặt Markdown Vision. |
| `open_markdown_vision_when_setup_closes_8422c7` | Mở Markdown Vision khi đóng trình cài đặt |
| `markdown_vision_native_could_not_be_installed_setup_wil_a877f0` | Không thể cài đặt Markdown Vision Native. Quá trình thiết lập sẽ dừng mà không đăng ký cài đặt chưa hoàn tất. |
| `markdown_document_00271f` | Tài liệu Markdown |
| `markdown_vision_preview_handler_8c95f7` | Trình xử lý xem trước Markdown Vision |
| `markdown_file_viewer_c36ee7` | Trình xem tập tin Markdown |
| `uninstall_fe1995` | Gỡ cài đặt |
| `markdown_vision_could_not_start_error_7950eb` | Markdown Vision không thể khởi động. {error} |
| `unknown_native_method_method_cc7ca9` | Phương thức gốc không xác định: {method} |
| `text_71988c` | văn bản |
| `title_shortcut_9aa219` | {title} ({shortcut}) |
| `heading_level_a6cd26` | Tiêu đề {level} |
| `normal_text_a2adc4` | Văn bản bình thường |
| `footnotes_ad6fb5` | Chú thích cuối trang |
| `size_px_8d05e6` | {size} pixel |
| `link_text_insert_default` | văn bản liên kết |
| `back_to_footnote_reference` | Quay lại vị trí tham chiếu chú thích |
