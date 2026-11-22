# Cross-platform implementation inventory

This inventory records the current Windows host and the frontend inputs that the Tauri pilot packages. It is a source-tree snapshot; generated `dist-*` directories are local build outputs and are not release artifacts.

## Renderer and package inputs

| Input | Use |
| --- | --- |
| `src/web/index.html`, `styles.css`, `app.js`, `editor-ui.js` | Shared reader, settings, About UI, and editor loaded by both native hosts. |
| `src/web/vendor/markdown-it.js`, `markdown-it-footnote.js` and their license files | Offline Markdown parsing and bundled license notices. |
| `native-tauri/bridge.js` | Tauri-only adapter injected before `app.js`; excluded from the Win32 host. |
| `tools/stage-tauri.cjs` | Stages the deliberate Tauri input list under `.tmp/tauri-frontend` and validates local HTML references. |
| `native-cpp/WebViewHost.cpp` | Win32/WebView2 host. It serves the repository's `index.html`, `styles.css`, `app.js`, `editor-ui.js` and complete `vendor` directory from the existing `web` folder in its portable ZIP and installer. |
| `native-tauri/tauri.conf.json` | Tauri points `frontendDist` at the staged directory, declares Markdown file associations, Linux `.deb` metadata, and the application identifier. |

Electron's existing `package.json` file list remains separate from the native distributions. The NSIS and portable names and native C++ `dist` folder layout are documented in [native-cpp/README.md](../native-cpp/README.md); this pilot does not rename or replace them.

## Bridge call map

| Call | Renderer entry point and visible behavior | Windows implementation |
| --- | --- | --- |
| `getInitialDocument` | `app.js` load handler; displays a file supplied at startup or stays at the empty-reader screen. | Supplied by native startup; Electron can supply a startup file. |
| `openMarkdownFile` | Open toolbar and Ctrl/Cmd+O; selected file replaces the reader after the dirty-document prompt. | Native picker. |
| `saveMarkdownFile` | Editor Save, Save As, Ctrl/Cmd+S and Ctrl/Cmd+Shift+S; first save chooses a path, cancel retains edits, failure displays an inline error. | Native save dialog and atomic save. |
| `listSystemFonts` | Settings font pickers; uses fallback behavior if absent or rejected. | System font enumeration. |
| `printMarkdown` | Print toolbar and Ctrl/Cmd+P; prepares the current draft and opens the host print dialog. | WebView2 print dialog. |
| `getPreferences` / `savePreferences` | Settings initialization and changes to theme, fonts, size, line spacing, and page width. | Renderer local storage in the existing WebView2 profile. |
| `confirmDiscard` | Opening a file from the toolbar while edits are dirty; false preserves the current document. | Renderer confirmation prompt. |
| `reportOpenError` | Open failure; displays an error while retaining the current document. | Renderer console fallback. |
| `updateArchitecture` / `installUpdate` | About panel when a newer release is found; only the verified native Windows installer is eligible for direct installation. | Architecture detection and digest-verified installer. |
| `onOpenDocument` | Host-delivered open request; renders the new document through the same reader path. | Present but no-op in Win32. |
| `onFullscreenChange` | Optional host fullscreen notification; no renderer action is required if unavailable. | Present but no-op in Win32. |

Cancellation is distinct from failure. A canceled open returns no document. A canceled save leaves the current draft dirty. A successful save returns `status: saved`, the opaque document ID, display name, and optional image base. Save failures may reject or return an error; both leave the draft available. Optional methods are detected by presence, so an unsupported capability must be omitted.

## Existing Windows baseline snapshot

Measured file sizes on this checkout on 2026-11-21:

| Available artifact | Bytes | Version/notes |
| --- | ---: | --- |
| `dist-fast/MarkdownVision-Portable-1.0.4.exe` | 91,472,257 | Local Electron output; not the current native build. |
| `dist-fast/MarkdownVision-Setup-1.0.4.exe` | 91,719,905 | Local Electron output; not the current native build. |

The native source version fields currently agree at **2.8.15**: `native-cpp/MarkdownVision.rc` file/product versions, `package.json`, `native-tauri/Cargo.toml`, and `native-tauri/tauri.conf.json`. The available download files report Electron version 1.0.4, so they are only a recorded workspace snapshot, not a like-for-like release-size or performance baseline. No ARM64 package of the current version is available in this Windows x64 environment.
