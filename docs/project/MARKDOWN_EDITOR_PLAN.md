# Markdown Vision editor implementation plan

## 1. Product behavior

Markdown Vision opens in Reader mode by default. Place a pencil button immediately to the left of the existing folder button. When Edit is active, reveal the formatting suite immediately to the pencil’s left, in the same toolbar row and vertically centered on the pencil. Keep the pencil and folder adjacent. The suite occupies available space to the left. On narrow windows, move secondary commands into a labeled More menu and retain access to every command without overlapping the existing toolbar.

| Mode | Toolbar, left to right | Workspace |
| --- | --- | --- |
| Reader | Pencil, Open, Search, Reading settings, Theme | Existing reader |
| Editor | Formatting suite, Pencil, Open, Search, Reading settings, Theme | Source, Split, or Preview |

Clicking the pencil with a document open starts an editing session from its exact Markdown source. Clicking it without a document starts an untitled draft. Clicking it again returns to Reader mode. Reader mode shows the current draft with an explicit Unsaved indicator where applicable. The same session, selection, scroll position and undo history survive mode changes. The folder remains Open and invokes the unsaved changes guard before replacing a session. Editor and Preview use the current document title, with Save, Save As, and view controls in a workspace header to keep the formatting suite compact.

Default a new session to Split when there is room. Default to Source on narrow windows and expose Preview as a separate view. Adapt a selected Split view as the window narrows, then restore it when space returns. Give both split panes independent scrolling and a keyboard accessible resizable divider. Count words and lines and show save state and cursor line/column in a single compact status area. Keep the last chosen view per profile.

## 2. Research and original design

| Reference | Insight to carry over | Markdown Vision design |
| --- | --- | --- |
| [Reddit formatting guide](https://support.reddithelp.com/hc/en-us/articles/360043033952-Formatting-Guide) | Side by side source and rendered examples help people learn syntax. Basic formatting is discoverable without knowing the syntax. | Use a Markdown cheat sheet with examples for the app’s supported dialect. Insert editable Markdown with a useful selection after each command. |
| [EasyMDE](https://github.com/Ionaru/easy-markdown-editor) | Formatting shortcuts, split preview, and draft recovery solve different stages of the same writing workflow. | Integrate commands with Markdown Vision’s pencil toolbar and reuse its reader as the preview. Put recovery in the desktop session lifecycle, keyed to the current file or untitled draft. |
| [uiw React Markdown Editor](https://www.npmjs.com/package/@uiw/react-md-editor) | Source, live preview, and preview-only views serve different tasks. A command catalog lets keyboard and toolbar actions share behavior. | Build one app-owned command registry used by toolbar, overflow menu, and shortcuts. Use the app’s existing JavaScript and CSS conventions. |
| [GitHub Flavored Markdown specification](https://github.github.com/gfm/) | Tables, task lists, strikethrough, and autolinks have specific parsing rules. GitHub applies additional sanitization. | Use spec examples to validate supported syntax. Render reader and editor previews through one shared pipeline with the app’s content policy. |

Implement the toolbar, selection transforms, session state, preview wiring, and native file integration from scratch. Derive behavior from this plan, the references’ documented interactions, and the existing app. Use original markup, styling, icons drawn for this interface, and tests. Keep the source editor replaceable behind a small adapter. Use locally bundled CodeMirror 6 for generic input, history and search primitives after validating offline WebView2 behavior and package size. Review dependency licenses and include notices. Never import another project’s Markdown editor, toolbar, theme, or command implementations.

## 3. Release scope and command behavior

| Group | Commands and expected behavior |
| --- | --- |
| History | Undo and Redo operate on typing and formatting through a single history. Each toolbar operation is one undo step. Reopening the same editing session preserves history. |
| Inline | Bold, italic, strikethrough, and inline code toggle around a selection. A collapsed selection inserts paired delimiters and positions the caret inside them. Inline code chooses a delimiter longer than any backtick run in the selection. Keep surrounding whitespace outside emphasis markers. |
| Blocks | Heading 1–6 or paragraph changes existing heading markers. Quote, unordered list, ordered list, and task list operate on selected lines and preserve nested indentation. Continue a list, task, or quote on Enter and end it on an empty marker. Indent and outdent list items through commands. Include a thematic break. |
| Insert | Link and image dialogs have label or alt text, destination, and optional title. Prefill from the selection and restore it on cancel. Support a fenced code block with optional language and a fence long enough for its contents. Include a table dialog for headers, dimensions and column alignment, with add/delete row and column in a recognized table. Escape cell pipes and preserve inline code. Disable structural table edits when the current table cannot be parsed safely. |
| Navigation | Find, next/previous, Replace, Replace All, case matching, and optional regex with visible errors and counts. Offer Go to line and an outline based on parsed headings outside code fences. Add Word wrap and a small Markdown help panel. |
| Files | New, Open, Save, Save As, and recovery. Save stays available in Source, Split, and Preview when editing. A link or image may be inserted with a URL or a path relative to a named document. For an untitled draft, prompt for Save As before inserting a relative file path. |

Use Ctrl+N, Ctrl+O, Ctrl+S, Ctrl+Shift+S, Ctrl+Z, Ctrl+Y or Ctrl+Shift+Z, Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+F and Ctrl+H where applicable. In Editor mode, Ctrl+F searches source in Source/Split and uses rendered text search in Preview. Reader Ctrl+F keeps its present behavior. Route shortcuts once, ignore events handled by a dialog or IME composition, and let Tab move focus by default. Preserve multiword font picker input, including when typing a trailing space. Support selection in either direction, multiline selections, mixed list prefixes, Unicode, and literal paste. Each command either performs a valid transformation or leaves the text intact and explains why it cannot apply.

Keep optional enhancements such as HTML/PDF export, live scroll sync, diagrams, math, and rich text editing outside the first release. They should have separate scope decisions and performance budgets.

## 4. Shared UI and renderer architecture

1. Extend `index.html` with the pencil, command group, and edit workspace. Use the existing toolbar layout, color variables, focus indicators, reading width and font variables. Use `--reader-mono-font` for the source and existing settings for rendered text. Test both light and dark themes.
2. Add a dedicated editor module and stylesheet with a small bridge from `app.js`. Bundle locally and load on first Edit activation. Exercise load failure and retry. Keep reader startup free of editor module execution and preserve initial document delivery. Ensure all packaging paths include the extra assets. Add a direct single-module file or use the existing host’s supported local origin policy if file-based module loading fails. Verify in packaged WebView2 early.
3. The editor adapter exposes source, selection, focus, scrolling, history reset, and one atomic transaction for applying changes and selection updates. The command registry contains identifiers, labels, shortcuts, applicability and execution. Pure formatting transforms take text and selection and return changes and the resulting selection. CodeMirror holds active editing text and history. The session tracks persistence and owns the latest snapshot used by Reader and Save.
4. Use one preview entry point for both modes and preserve the current renderer initially. Inventory all supported constructs and compare fixtures before expanding syntax. If a required feature, such as task lists or autolinks, is absent, extend the shared renderer or replace its parser only after proving parity against existing documents. Apply the same HTML and URL policy to all parser output. Preserve embedded HTML and theme-aware picture sources currently supported by the app. Verify relative media paths and Save As rebasing. Render task checkboxes as read-only in Preview. Report any dialect limitations in the syntax help.
5. Debounce live preview, starting at 180 ms. Stamp each render with session and edit revision. Apply only the most recent result for the current session. Skip preview work in Source-only mode and update immediately when Preview opens. For large documents, measure render latency and offer on-demand preview if sustained rendering delays typing.
6. Use labeled toggle controls and proper pressed states. Return focus from dialogs and overflow to the invoking control or editor as appropriate. Preserve screen reader navigation, keyboard search, high contrast, 200% zoom, and narrow layouts. Announce save results and errors through a restrained live region.

## 5. Desktop storage contract

The primary release is the native C++ WebView2 build. The root renderer is also consumed by Electron and WPF. Browser mode keeps file-picker Open and uses an explicit Download action for saving if a desktop capability is absent. Keep Preview Handler read-only. Treat `native-github/` as a separate copy and update it only if it is confirmed to be a release source.

| Operation | Shared contract |
| --- | --- |
| Open or initial document | Return `{documentId, name, content, revision, format}`, with a host-issued opaque ID and a disk revision. Keep native paths inside the host. Use an explicit cancellation or error result. Normalize old bridge responses containing only name/content to a document without in-place Save capability. |
| Save | Send document ID, expected disk revision, source snapshot and requested operation. Resolve the destination from the host’s document map. Return the new revision and document identity on success. |
| Save As | Choose the destination through the host’s Save dialog. Return a canceled result without changing session identity. Update display name, revision, media base, and recovery key only after successful disk write. |
| Conflict | If the file changed outside the app, keep the draft and show Reload, Save As, and explicitly confirmed Overwrite. Reload prompts before discarding local changes. Detect deletion and replacement as well as content changes. |
| Close guard | Native window close and app-level New/Open use Save, Discard, and Cancel for dirty drafts. Save resumes the pending action only after success and only when the saved snapshot still matches the buffer. Dialog cancellation, I/O failure, or a newer edit keeps the session open. |
| Recovery | Save a debounced private draft under the app profile, using an atomic update and a versioned schema. Store identity, base revision, edit snapshot and timestamp. Restore via an explicit prompt. Clean up completed saves and explicit discards if no newer draft exists. Keep separate drafts from multiple windows. |

Preserve supported encoding, BOM, line endings, and final newline on ordinary edits. New files default to UTF-8. Detect mixed line endings and unsupported encodings, preserve untouched bytes where feasible, and require a clear conversion choice before a lossy save. Reject saving a source loaded with replacement characters until the encoding is resolved. Open errors must leave the old session usable. Use a Windows-compatible atomic write via a temporary file in the destination directory, with replacement semantics that preserve destination metadata where supported. Serialize writes per destination, recheck the disk revision as close to replacement as practical, and surface locked, read-only, missing, and disk-full errors. Clean up temporary files. After a save in flight, compare the completed snapshot to the current text before clearing Unsaved.

In `native-cpp/WebViewHost.cpp`, extend the current string bridge with structured request/response data using a real JSON serializer and parser. Keep existing reader requests compatible and validate origin, request shape, method, document ID, and size before dispatch. Limit bridge access to the trusted app document. Keep external navigation outside the app origin and prevent preview content from calling the bridge. Implement equivalent file actions through `main.cjs` and `preload.cjs` and the WPF request dispatcher, or keep feature capabilities gated until the host passes its save tests. Ads, telemetry, cloud services, and runtime CDN downloads are outside this design.

## 6. Implementation ownership and integration order

| Step | Owner | Deliverable and handoff |
| --- | --- | --- |
| 0. Baseline and contracts | Terra + Luna | Identify current native build inputs and preserve the working standalone package. Record startup, reader search, both font pickers, themes, file associations, and representative fixtures. Freeze the operation names and result shapes above, fixture format, editor lifecycle events, and module asset paths. Confirm a supported Windows C++ toolchain can compile the WebView2 host before changing packaging. |
| 1A. Editing session and host | Terra | Own session state and lifecycle: closed/opening/ready/saving, dirty alongside lifecycle state, stale completion rejection, pending close intent, recovery and conflict handling. Own native host, Electron and WPF adapters, and packaging. Give Luna a fake host supporting success, cancellation, error, delay and disk conflict immediately after Step 0. |
| 1B. Editor UI and transforms | Luna | Own pencil layout, responsive toolbar, overflow, editing module, commands and dialogs, accessibility, source settings, find/replace, outline and status. Connect the module to the shared session contract using the fake host. Own command fixtures and keyboard interaction checks. |
| 2. Shared preview and app integration | Terra + Luna | Terra owns the `app.js` bootstrap, open guards and renderer entry point. Luna owns preview scheduling, placement and visual behavior in the editor module. Integrate with the primary native host first. Verify command output against shared render fixtures and resolve syntax parity gaps before expanding rollout. |
| 3. Review and release | Terra + Luna | Cross-review state/IPC and UI/command behavior. Terra builds the native artifacts and checks host regressions. Luna runs native end-to-end keyboard, layout and editing acceptance. Package a fresh native x64 standalone ZIP and installer with `Markdown-Vision.exe`, editor assets and license notices. Keep the previous package available for rollback. |

Coordinate shared files during Step 0. Terra owns final edits to the app bootstrap and build manifests. Luna owns `index.html`, `styles.css`, and the new editor files. Make UI and storage independently reviewable. An archived native executable can support visual work with a mock host, but it cannot ship the new Save bridge. Use a freshly compiled native host for release.

## 7. Verification and release gates

| Area | Required evidence |
| --- | --- |
| Placement and accessibility | Pencil precedes folder in Reader and Editor. Formatting controls appear directly to its left. Verify wide and minimum window sizes, 200% zoom, shortcuts, tab order, dialog focus, high contrast, and screen reader labels. |
| Source correctness | Cover every command with empty and nonempty selections, both selection orientations, existing markup, nested lists, fence/backtick runs, escaped table cells, Unicode, undo/redo, and IME. Preview HTML matches the reader for supported fixtures. |
| File durability | Open, edit, save and reopen UTF-8 with/without BOM and CRLF/LF files. Check untitled Save As, canceled dialogs, Unicode paths, read-only/locked files, external changes, two windows saving one file, editing during a delayed save, and recovery after termination. For each injected failure, verify disk contents and the draft. |
| Reader regressions | Open by folder, drag/drop if supported, and Windows file association. Check search navigation, embedded HTML and themed pictures, relative assets, theme and reading preferences, fixed/variable fonts, and keyboard selection for names such as Noto Sans and Source Code Pro. Check Explorer preview still renders. |
| Host and content handling | Exercise native C++ packaged build first, then Electron, WPF, and browser capability fallback. Check local operation offline, external links, safe rendering of untrusted Markdown and HTML, and rejection of unauthorized save requests. |
| Startup and responsiveness | Record median and worst of at least five comparable cold and warm launches to reader-ready on the same machine and fixture. Gate on no more than 10% median regression, allowing up to 50 ms for measurement noise. Confirm editor assets load only on first Edit activation. Measure first activation, typing and preview latency with 100 KB and 1 MB fixtures. Target p95 typing response under 50 ms on the baseline machine; switch large preview to on-demand if it exceeds that target. |
| Artifacts | Run the extracted ZIP and test clean install and upgrade in an isolated Windows environment. Verify bundled asset manifest, retained file associations and preview handling, the executable name, and the WebView2 requirement. Record test results, package sizes, baseline comparison, and any deferred items. |

Release after the primary native path passes the gates and every other distributed host either passes or advertises its supported capabilities accurately. Record any fixture differences explicitly before accepting them.
