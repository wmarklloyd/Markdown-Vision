# Markdown Vision Project Description

## Overview and current status

Markdown Vision is a reading-first Windows desktop application for Markdown and plain-text documents. It combines a formatted reader, configurable typography, document search, and an in-memory Markdown editor. The primary application is the x64 Win32 C++ build in `native-cpp/`. It uses Microsoft Edge WebView2 to display the bundled interface and needs no Electron, Node.js, or .NET runtime.

The current version is **2.8.7**. Visual view supports direct edits to mapped formatting, code spans, and link labels in table cells, including supported tables inside lists and quotes. Empty positions in short rows can be filled through the Visual cell editor. Version 2.8.3 expanded direct editing in references, quotations, and HTML containers.

| Area | Current state |
| --- | --- |
| Desktop reader | Opens files through the Windows picker or a launch argument. Displays formatted Markdown with light and dark themes, reading settings, and text search. |
| Editor | The pencil opens Visual, Split, or Markdown view. Edits update an in-memory draft and can be viewed in the reader. |
| Standalone distribution | The verified x64 build contains the native executable and its adjacent `web/` assets. |
| NSIS installer | The installer packages the current native app and editor assets. It carries the existing product identity for upgrades. |
| Explorer Preview Pane | A separate native COM DLL implements a read-only RTF preview. It compiled with the standalone build. Explorer registration and rendering were outside the latest native smoke test. |
| Document persistence | Save writes an opened file back to disk. Untitled drafts and Save As use a native file dialog. The editor retains the draft when an in-place save detects an external change. Open and close guards and draft recovery are pending. |

## User experience

The application starts in reader view, including when no document is open. The Edit button creates an untitled document when needed. The reader opens `.md`, `.markdown`, `.mdown`, `.mkd`, and `.txt` files. It shows the file name in the document header and native window title. Reading settings include a proportional font, a separate fixed-width font for source and code, font size, line spacing, and page width. The defaults are Georgia and Consolas at 18 px, with 1.75 line spacing and a 720 px reading width. Ctrl+F opens case-insensitive search with previous and next navigation.

The editor offers three views:

- **Visual** presents editable rendered Markdown. Code blocks accept direct typing. Structured controls edit task and list items, links, images and linked badges, and tables. Supported headings, nested and multiline list text, link labels, inline code, and ordinary table cells can be edited in place. Blocked edits show a nearby explanation and provide navigation to the relevant Markdown.
- **Split** shows Markdown on the left and Visual on the right. The divider starts at 50/50 and supports dragging or keyboard resizing. Toolbar actions follow the pane with focus. The matching word or selection is highlighted in the other pane when it can be mapped to rendered text.
- **Markdown** exposes the raw source in a textarea. It shows line and column position and supports the full set of current toolbar commands.

Both editing surfaces offer undo and redo, heading cycling, bold, italic, strikethrough, bulleted and numbered lists, quotes, inline code, fenced code blocks, and links. Task-list and table insertion are available in the source pane. The Visual cell editor accepts multiple lines and stores line breaks as `<br>` inside the Markdown row. Existing task lists show interactive checkboxes in Visual and read-only checkboxes in the reader. Markdown view can continue list and task markers on Enter and inserts two spaces on Tab. The status bar shows the draft word count.

Editor search uses the active view. In Split, a shared list of matches pairs rendered words with their Markdown. Next and Previous highlight and center the current occurrence in both panes where it exists. The counter identifies hits that appear in just one pane, such as a URL found only in Markdown.

The Print button and Ctrl+P open the Windows system print dialog from the native app. Printing renders the current Markdown, including the unsaved editor draft, with paper styles for page margins, wrapped code, and repeating table headings.

The pencil also returns to the reader, which can display the draft. **Save** in the editor header, or Ctrl+S, writes the current draft. **Save As**, or Ctrl+Shift+S, chooses a destination. The **Unsaved** indicator compares the buffer against the last loaded or successfully saved snapshot. Opening another file or exiting can lose an unsaved draft.

## Runtime architecture

| Component | Responsibility |
| --- | --- |
| [`native-cpp/WebViewHost.cpp`](native-cpp/WebViewHost.cpp) | Win32 window and WebView2 lifecycle, file picker, startup argument handling, UTF-8 reads, installed-font enumeration, native title updates, and the JavaScript bridge. This is the host compiled by the primary build. |
| [`index.html`](index.html) and [`styles.css`](styles.css) | Shared reader and editor layout, toolbars, settings and search panels, theme variables, Markdown typography, and protected-block presentation. |
| [`app.js`](app.js) | Renderer bootstrap, document display, Markdown parsing, HTML filtering, settings, font suggestions, and in-document search. |
| [`editor-ui.js`](editor-ui.js) | In-memory draft, source and Visual editing, command handling, selection, history, and pane synchronization. |
| [`native-cpp/PreviewHandler.cpp`](native-cpp/PreviewHandler.cpp) | Explorer preview handler. Converts a Markdown subset to RTF and displays it in a Rich Edit control. |
| [`native-cpp/installer.nsi`](native-cpp/installer.nsi) | Machine-wide setup, replacement of an earlier installation, application shortcuts, Markdown associations, and preview-handler registration. |

### Native host and document flow

1. The host chooses the first existing launch argument with a supported extension. A file launch starts a detached copy with the absolute path, allowing its window to outlive the process that invoked it.
2. The Win32 window initializes WebView2 and navigates to `web/index.html` beside the executable. The default WebView2 profile is under `%LOCALAPPDATA%\Markdown Vision Native\WebView2`.
3. Before the page scripts run, the host injects `window.desktop`. Requests use `chrome.webview.postMessage` with an ID and method separated by a pipe. The host resolves the Promise with `window.__markdownVisionResolve`.
4. The native bridge implements `document.initial`, `document.open`, `document.save`, `document.saveAs`, `document.print`, and `fonts.list`. A document payload contains `{ name, content, documentId }`. The host keeps the path and original bytes. Saving preserves a UTF-8 BOM and consistent line endings, checks for external changes before in-place replacement, and writes through a temporary file in the destination directory. Mixed line endings and invalid UTF-8 require Save As for a UTF-8 copy. Printing calls WebView2's Windows system dialog on the dedicated print surface.
5. `showDocument` renders the reading view, updates the page and window title, and sends the `markdownvision:documentchanged` event to initialize the editor buffer. The Visual editor calls the same parser through `window.markdownVisionReader`.

The host uses Windows font enumeration. Opening Reading settings starts the font request. The renderer can display a seven-day local cache while it refreshes the installed-font list. Appearance preferences and the font cache use the local-storage keys `markdown-vision-preferences` and `markdown-vision-font-cache`. Document edits live in the editor buffer.

### Markdown rendering

The shared JavaScript parser handles headings, paragraphs, flat lists, blockquotes, thematic breaks, fenced code, pipe tables with column alignment, and a subset of inline emphasis, code, links, and images. Two trailing spaces create a hard line break within a paragraph. Embedded HTML is filtered through tag, attribute, style, and URL checks. Supported picture sources can respond to the app's theme. The native host sends links that request a new window to the Windows shell.

The parser is a project-specific subset. Nested Markdown structures, reference-style links, relative media resolution, and full CommonMark or GitHub Flavored Markdown compatibility remain incomplete. Explorer uses its own RTF parser and has a more limited rendering feature set.

### Editing, synchronization, and code formatting

The source textarea holds the current Markdown draft. The renderer returns HTML and source ranges for each block. Structured Visual controls patch the affected range and use a single undo step. Direct Visual typing preserves unchanged block source and whitespace between tracked blocks while serializing the edited DOM back to Markdown. Changes in Visual update the source immediately. Typing in the Split source pane schedules a Visual refresh after 180 ms. The Visual editor manages undo and redo snapshots that include the corresponding Markdown. Source toolbar commands use the browser's textarea editing operations where available. Rebuilding Visual after a source-pane edit resets its local history.

Converting a normal block to code in Visual copies its original Markdown when available. For a block already modified in Visual, the editor serializes its current formatting first. Code displays that Markdown literally, retaining markers, indentation, and line breaks. The serializer chooses a fence longer than any backtick run in its body. Source toggling and the shared parser use the same fence recognition for backticks and tildes, including delimiter length and matching closing lines.

An unchanged code block can toggle back to its original Visual formatting while its origin is still held in the current Visual editor. After a reload, removing the fence in Markdown view exposes the preserved source. Visual conversion of loaded or edited code back to normal text uses the existing plain-text paragraph behavior and retains line breaks in the Visual view. Other Visual edits can normalize Markdown syntax and the blank lines between blocks.

## Build and distribution

The primary build script targets x64, uses the configured Visual Studio Community C++ environment and Windows SDK, and looks for WebView2 SDK version `1.0.3537.50` in the user's NuGet cache. The script links the WebView2 static loader. The target machine needs the Microsoft Edge WebView2 Runtime.

```powershell
.\native-cpp\build.bat
.\native-cpp\build-installer.bat
```

The default output directory is `dist\MarkdownVision-Native-Editor-2.8.7\`. Its archive is `dist\MarkdownVision-Native-Editor-2.8.7-win-x64.zip`. The optional build argument names an isolated output directory and its matching archive. The bundle includes `Markdown-Vision.exe`, `MarkdownVisionPreviewHandler.dll`, `LICENSE`, and `web\` with `index.html`, `styles.css`, `app.js`, and `editor-ui.js`, plus the bundled parser and license notices in `vendor\`. Keep `web\` beside the executable when running an extracted build.

The [native installer entry point](native-cpp/build-installer.bat) invokes the standalone build and then uses the cached NSIS compiler. The script currently locates that compiler under an Electron Builder cache path. That path is a build-time dependency only. The setup defaults to `%ProgramFiles%\MarkdownVision`, uses the previous product's uninstall identity for replacement, and registers the app and Explorer handler for the four Markdown extensions. The setup checkbox controls the registry association written for `.md`.

NSIS reads the default 2.8.7 build directory and includes the complete web asset list. Its output is `dist\Markdown-Vision-Native-Setup-2.8.7.exe`. The executable and installer expose version 2.8.7 in Windows file properties.

## Repository and integration status

- `main.cjs`, `preload.cjs`, and the Electron Builder configuration are retained from the earlier Electron edition. `native-windows/` is a separate WPF host with WebView2. The active native build uses neither host.
- `native-cpp/MarkdownVision.cpp` is the earlier Win32 reader implementation. The active build script compiles `WebViewHost.cpp` and `PreviewHandler.cpp`.
- `native-github/` is a separate native distribution snapshot. The active build takes assets from the workspace root.
- `editor-session.js` prototypes document identity, revision tracking, save snapshots, and leave decisions. `editor-recovery.js` prototypes debounced draft storage through an injected store. `editor-fake-host.js` supplies an in-memory host for testing saves and conflicts. These modules are outside the native page's script list and package.
- [The editor plan](MARKDOWN_EDITOR_PLAN.md) describes file durability, editor controls, and verification. The active implementation uses a textarea and a contenteditable Visual surface. Planned features include close and open guards, recovery, and replace.

## Verification

- The 2.0.0 build compiled the x64 native host and Explorer preview DLL. ZIP inspection and NSIS compiler output confirmed that both packages include the editor script. The executable and installer both report file and product version 2.0.0.
- A smoke test passed against the 2.0.0 Win32 application's WebView2 page. It checked the native bridge, Visual toggle round trips, preserved formatting markers and whitespace, long backtick fences, headings and quotes, empty blocks, undo and redo, and Markdown-mode fence toggles.
- The separate `dist/MarkdownVision-Native-Visual-Tools-2.0.0-win-x64.zip` build passed native WebView2 checks for task and list actions, labeled fences, link and image edits, table changes, and source selection for complex blocks. The checks compared Markdown before and after each targeted edit and exercised undo and redo.
- The `dist/MarkdownVision-Native-Visual-Fixture-2.0.0-win-x64.zip` build passed the same checks and added coverage using `test.md` for linked badges, nested list text, ordinary cells in a table with HTML and a spacer row, and exact source selection for protected HTML.
- The `dist/MarkdownVision-Native-Visual-Feedback-2.0.0-win-x64.zip` build passed the native smoke suite with additional checks for protected-edit messages, selection preservation, keyboard access, and exact-source navigation after the explicit Markdown action.
- The `dist/MarkdownVision-Native-Visual-Navigation-2.0.0-win-x64.zip` build passed checks for nested item selection, paired scrolling past wrapped source lines, and plain-language code block help.
- The `dist/MarkdownVision-Native-Inline-Code-2.0.0-win-x64.zip` build passed native checks for typing in the middle of labeled code, preserving surrounding source, undo and redo, and carrying the code selection into Markdown.
- The `dist/MarkdownVision-Native-Split-Search-2.0.0-win-x64.zip` build passed native checks for matching and centering the same occurrence in both panes, counting repeats, wrapping navigation, handling source-only results, and updating results after edits.
- The `dist/MarkdownVision-Native-Save-2.0.0-win-x64.zip` build passed native tests for in-place Save, Ctrl+S, UTF-8 BOM and CRLF preservation, external change detection, cancellation, Save As to a separate file, and saving an untitled document.
- The `dist/MarkdownVision-Native-Print-2.0.0-win-x64.zip` build passed the native editor smoke suite. An offline print sample from an unsaved draft was paginated by WebView2 and visually verified with the Windows PDF renderer. The test session reported no configured printers.
- The 2.1.0 release packages passed version and asset checks. The bundled native executable passed the WebView2 smoke suite, including file saving, multiline table-cell edits, split search, and print layout from an unsaved draft.
- Installer execution, upgrade behavior, shell registration, Explorer Preview Pane behavior, and the separate WPF build were outside the latest verification.
- This describes the local working tree, which includes in-progress and untracked source files. The local standalone build is separate from any published release.
