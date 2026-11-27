# Localization release checklist

The catalog and interface checks confirm coverage and behavior; they do not certify translation quality. Keep every locale in draft status until its native-language and packaged-interface reviews are complete.

## Review gates

For each locale and each review gate, record the reviewer, date, build tested, and linked evidence in the gate cell. Use `Pass (reviewer: Name; date: YYYY-MM-DD; build: version/platform; evidence: [review notes](docs/reviews/locale-platform-date.md))` for a passed gate. Repository links must target an existing file; external review evidence must use HTTPS. Use the same format with `Blocked` when the review found a blocking issue; link the issue or review notes. Leave unreviewed gates as `Pending`.

1. **Native-language review:** A fluent reviewer checks meaning, grammar, register, consistent terminology, plural forms, filenames, shortcuts, and all translator guidance in [`LOCALIZATION.md`](LOCALIZATION.md). The reviewer checks messages in context and records corrections in the catalog.
2. **Rendered-interface review:** Test the locale in the application at normal and narrow/high-zoom sizes. Check clipping, wrapping, dialogs, search counts, editor actions, accessible names and descriptions, and screen-reader pronunciation. Verify every script renders without missing-glyph boxes in the interface, reader text, and code; check that platform font fallback remains legible where bundled fonts do not cover the script. For Arabic, also check right-to-left order, mixed-direction text, and physical pane positions, and confirm the UI direction does not override the reading direction of user documents.
3. **Packaged-platform review:** Install and launch the release candidate on Windows, macOS, and Linux. Check the application language selector and restart behavior, native menus and dialogs, file associations, launcher metadata, installer text, and update flow. Record platform-specific gaps even when they come from the operating system.
4. **Release checks:** Run `node tools/export-localization.cjs --check`, `node tools/export-localization.cjs --check-generated`, `node tools/export-localization.cjs --check-release-ready`, `node tools/check-native-error-localization.cjs`, `node tools/test-localization-generation.cjs`, and `node tools/run-renderer-ui-harness.cjs` on the final catalog and generated resources. Tagged GitHub releases, manually selected Linux/Fedora/macOS releases, and branch builds that find an existing release to update enforce the readiness check before uploading release assets.

Do not mark a gate complete from source inspection alone. The catalog checker validates that every passed or blocked gate names a reviewer, a valid date, a build, and evidence linked to an existing repository file or HTTPS URL. If a gate does not apply, record why and who approved the exception in the linked evidence.

## Locale status

All entries start as **Draft**. Change a gate to **Pass** only after recording its evidence. The locale is ready only when all three review gates and release checks pass.

| Locale | Native-language review | Rendered-interface review | Packaged-platform review | Status / evidence |
| --- | --- | --- | --- | --- |
| Arabic (`ar`) | Pending | Pending | Pending | Draft |
| Simplified Chinese (`zh-hans`) | Pending | Pending | Pending | Draft |
| Traditional Chinese (`zh-hant`) | Pending | Pending | Pending | Draft |
| Czech (`cs`) | Pending | Pending | Pending | Draft |
| Dutch (`nl`) | Pending | Pending | Pending | Draft |
| French (`fr`) | Pending | Pending | Pending | Draft |
| German (`de`) | Pending | Pending | Pending | Draft |
| Hindi (`hi`) | Pending | Pending | Pending | Draft |
| Indonesian (`id`) | Pending | Pending | Pending | Draft |
| Italian (`it`) | Pending | Pending | Pending | Draft |
| Japanese (`ja`) | Pending | Pending | Pending | Draft |
| Korean (`ko`) | Pending | Pending | Pending | Draft |
| Polish (`pl`) | Pending | Pending | Pending | Draft |
| Brazilian Portuguese (`pt-br`) | Pending | Pending | Pending | Draft |
| Russian (`ru`) | Pending | Pending | Pending | Draft |
| Spanish (`es`) | Pending | Pending | Pending | Draft |
| Swedish (`sv`) | Pending | Pending | Pending | Draft |
| Thai (`th`) | Pending | Pending | Pending | Draft |
| Turkish (`tr`) | Pending | Pending | Pending | Draft |
| Ukrainian (`uk`) | Pending | Pending | Pending | Draft |
| Vietnamese (`vi`) | Pending | Pending | Pending | Draft |

## Current automated evidence

Update these results after running the commands above on the final release candidate.

| Check | Result | Evidence |
| --- | --- | --- |
| Catalog coverage and translation structure | Pass (working tree, 2026-11-26) | `node tools/export-localization.cjs --check` — 321 draft messages and 4 reference rows across 21 locales; rejects untranslated English phrases and unapproved exact single-word matches, checks for expected native scripts, common Simplified-only characters in Traditional Chinese, and capitalization in reviewed Indonesian/Ukrainian labels |
| Embedded English phrase detection | Pass (working tree, 2026-11-26) | `node tools/export-localization.cjs --check` now checks source phrase sequences inside translated messages; the regression suite rejects a French string containing the English phrase "Search text" while keeping documented technical terms |
| Installer terminology | Pass (working tree, 2026-11-26) | `node tools/export-localization.cjs --check` rejects untranslated "Setup" or "Uninstall" in installer messages; German and Dutch prompts now use localized installation terms |
| Spanish input-prompt consistency | Pass (editorial consistency only, 2026-11-26) | Standardized six Spanish text-entry prompts from mixed `Introduzca`/`Escriba` wording to `Escriba`; catalog validation and generated-resource checks pass. This is not a native-speaker review. |
| Generated resources match catalog | Pass (working tree, 2026-11-26) | `node tools/export-localization.cjs --check-generated` |
| Static HTML and renderer source coverage | Pass (working tree, 2026-11-26) | `node tools/check-native-error-localization.cjs` extracts human-readable text and accessibility attributes from `src/web/index.html`, checks them against catalog entries, verifies renderer literals are translated in every locale, and rejects raw browser-dialog and UI-text assignments. |
| Bundled-font fallback contract | Pass (source and Windows/Electron script-sample check, 2026-11-26) | `node tools/check-native-error-localization.cjs` verifies all seven local font assets exist, the reader and code stacks retain generic serif/monospace fallbacks, and bundled faces use `font-display: swap`. Optional renderer captures show each locale's native language name and digits in reader prose and a code block without missing-glyph boxes in this Windows/Electron run (`MARKDOWN_VISION_LOCALE_SCREENSHOTS` output). This sample does not prove complete glyph coverage or packaged macOS/Linux font fallback; those remain in the rendered-interface review gate. |
| Libertinus license notice and packaging | Pass (working tree, 2026-11-27) | `node tools/check-native-error-localization.cjs` verifies the adjacent OFL.txt copyright/license text, confirms the About panel omits font attribution, and checks Electron, Tauri, C++, and managed Windows packaging include the font license. README links `THIRD-PARTY-LICENSES.md`. |
| Native and renderer messages have translations | Pass (working tree, 2026-11-26) | `node tools/check-native-error-localization.cjs` — renderer, updater, document, Windows save, and native dialog strings |
| Generation regression tests | Pass (working tree, 2026-11-26) | `node tools/test-localization-generation.cjs` — includes regressions for untranslated phrases and single-word labels, unlocalized installer-title terminology, missing Devanagari script, Simplified characters in Traditional Chinese, lowercase Ukrainian labels, Korean table-term consistency, added Korean terminal punctuation, and incorrect Korean particle usage |
| Renderer interface harness | Pass (working tree, 2026-11-26) | `node tools/run-renderer-ui-harness.cjs` — search labels, zero-result counts, document-root language metadata, user-document language/direction isolation, accessible input names/language metadata, native menus, and visual table editor checked in all 21 draft locales; scans initial and interactive UI for untranslated English; word/search counters exercise reachable ICU plural categories, with exact edge cases for cs, pl, pt-br, ru, and uk; both font-picker count labels are rendered with deterministic matching fonts in all 21 locales and checked for localized number formatting; compact and wide reader widths, very narrow translated panels, 2× settings zoom, dialog overflow, and code-copy/scrollbar clearance are exercised. With `MARKDOWN_VISION_LOCALE_SCREENSHOTS` enabled, the Windows/Electron run also captured Settings, Search, Editor, About, new-file confirmation, visual-link dialog, and native-script reader/code samples for every locale, and wrote `index.html` with 168 images grouped under 21 locale sections; this capture set does not replace packaged-platform or accessibility review. |
| Tauri native menu coverage | Source and renderer checks pass (Rust compile pending; 2026-11-26) | `node tools/check-native-error-localization.cjs` checks all 12 Rust menu labels against every locale and enforces required, valid labels for each menu present; `node tools/test-localization-generation.cjs` rejects untranslated labels and a regression that skips required translations. The Electron renderer harness checks the complete map including macOS’s preserved `Markdown Vision` application-menu title. Rust unit tests cover missing and blank labels; Cargo is unavailable on this host. |
| Tauri discard confirmation localization | Implemented (source check pass, Rust compile pending; 2026-11-26) | Native confirmation dialogs now require all five localized labels; the host rejects missing, blank, oversized, or control-character labels rather than displaying an English fallback. The localization checker enforces required labels and validation. Rust unit tests cover valid and invalid label sets; compilation remains unverified on this Windows host because Cargo is unavailable. |
| Tauri open-error dialog localization | Implemented (source and bridge checks pass, Rust compile pending; 2026-11-26) | Native error dialogs require localized title, description, and close labels, validate their size and content, and have no English fallback. The bridge sends the localized error description without a duplicate raw-message field; if the native dialog rejects it, the renderer falls back to its localized in-app dialog. |
| Managed Windows detached launch error | Pass (working tree, 2026-11-26) | Native-message check verifies detached-process launch failures use the localized startup message; the generation regression suite rejects removing that localization path |
| Managed Windows host strings | Pass (working tree, 2026-11-26) | Native-message check covers three file-dialog fallbacks and the bridge error across 21 locales; renderer harness verifies a runtime method name is inserted into the localized error template in every locale |
| Managed Windows startup language selection | Pass (working tree, 2026-11-26) | `tools/managed-startup-tests` compiled to temp storage and ran under the installed .NET 11 runtime with major-version roll-forward; verifies saved app locale selection, Traditional Chinese and Brazilian Portuguese mapping, system/invalid fallback, malformed preferences, and localized startup errors |
| Native C++ Windows dialog coverage | Pass (working tree, 2026-11-26) | `node tools/check-native-error-localization.cjs` checks all seven labels sent by the WebView host against all 21 locales; the generation regression suite verifies an untranslated label is rejected |
| Windows WPF host compile | Pass (working tree, 2026-11-26) | Current `App.xaml.cs`, `MainWindow.xaml.cs`, and startup-culture helper compile with the installed .NET 11 SDK into temp output; 0 warnings and errors. Runtime and installer review remain pending |
| Windows localized host package in CI | Pending CI run | `Localization checks` now publishes the WPF host for `win-x64` with intermediate and publish output in runner temp storage, then verifies that generated locale data is included. A hosted workflow run is still needed; this build check does not replace install, runtime, accessibility, or installer review. |
| Native Windows x64 compile | Pass (working tree, 2026-11-26) | `native-cpp/build.bat localization-ko-latest-20261126 x64 isolated-test` — clean x64 build; staged `web/app.js` SHA-256 `2A11253BEB971313D3BC7E8DE2D5C62889BC96084A0EB0BE4667ECBC476ACF66` matches the current renderer. Windows app runtime review remains pending |
| Native dialog label bridge | Pass (working tree, 2026-11-26) | `node tools/check-native-dialog-labels.cjs` confirms translated Windows dialog labels preserve save payloads and invalid labels are rejected |
| Linux launcher locale entries | Pass (working tree, 2026-11-26) | `node tools/check-linux-desktop-duplicates.cjs native-tauri/launcher.desktop` and `node tools/test-linux-desktop-duplicates.cjs` verify localized entries are unique and appear in the correct desktop-entry section |
| Cross-platform metadata | Pass (working tree, 2026-11-26) | `node tools/check-cross-platform-metadata.cjs` validates product/version metadata, Markdown associations, and DEB/RPM dialog dependencies |
| Windows installer compile | Pass (working tree, 2026-11-26) | NSIS compiled `%TEMP%\MarkdownVision-localization-ko-review.exe` from current localized installer strings and fresh `dist/localization-ko-latest-20261126` staging. Install and runtime review remain pending |
