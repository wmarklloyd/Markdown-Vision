# Desktop bridge contract

The renderer uses `window.desktop` when a host supplies it. Methods that interact with the operating system return promises. The bridge must be available before `app.js` runs. The current Windows host injects it before the document loads. A host must settle each request, including cancellation and failure.

| Method | Request | Result | Windows host | Tauri target | Fake host |
| --- | --- | --- | --- | --- | --- |
| `getInitialDocument()` | None | Document or null. A startup document is consumed once. | Implemented | Implemented; Linux startup files are queued | Implemented in `tools/desktop-bridge-fixture.cjs` |
| `openMarkdownFile()` | None | Document or null when canceled | Native file picker | Implemented | Implemented, including cancellation and rejection cases |
| `saveMarkdownFile(id, text, saveAs)` | Opaque ID or null, Markdown text, boolean | Saved, canceled, or error result | Implemented | Implemented | Implemented, including Save As and canceled/error cases |
| `listSystemFonts()` | None | Array of font names | Implemented | Optional, with existing fallback | Implemented and omitted by the no-optional-capabilities fixture |
| `printMarkdown()` | None | Boolean indicating print request accepted | Native print dialog | Implemented; macOS uses native WebView printing | Implemented and omitted by the no-optional-capabilities fixture |
| `getPreferences()` | None | Preferences object or null | Absent, renderer uses local storage | Implemented with migration-safe initialization | Implemented |
| `savePreferences(preferences)` | Preference object | Promise settled after save | Absent, renderer uses local storage | Implemented | Implemented and omitted by the no-optional-capabilities fixture |
| `confirmDiscard(action)` | `open`, `close`, or `quit` | Boolean, true only for an explicit discard | Absent, renderer uses its existing prompt | Implemented with native dialogs | Implemented, including keep-editing response |
| `reportOpenError(error)` | Error to display | Promise settled after the error is shown | Absent | Implemented | Implemented |
| `updateArchitecture()` | None | `x64`, `arm64`, or unsupported | Implemented | Omit while manual updates are used | Omitted when unsupported |
| `installUpdate(version, digest)` | Version and SHA-256 | Boolean indicating installer started | Implemented with verification | Omit while manual updates are used | Omitted when unsupported |
| `onOpenDocument(callback)` | Callback receiving a document | Subscription | Present but currently no-op | Implemented with an ordered queue and dirty-document prompt | Implemented with an event-emission helper |
| `onFullscreenChange(callback)` | Callback receiving boolean | Subscription | Present but currently no-op | Optional | Omitted |

A document has `content`, `name`, `documentId`, and `imageBase`. A successful save returns `{status: 'saved', documentId, name, imageBase}`. Cancellation returns `{status: 'canceled'}` and failure returns `{status: 'error', message}`. The host owns paths and maps IDs to open documents. A stale ID must not save over a different document.

## Tauri file replacement policy

- Reject a destination that is itself a symbolic link. Image access may follow links only after canonicalization proves the target remains inside the active document directory.
- Save through a temporary file in the destination directory, flush it, compare the on-disk bytes with the bytes read for the active document, then atomically replace. A new Save or Save As destination must not clobber a file that appeared after the dialog selection. This detects observed changes but is not a lock against a concurrent writer racing the final comparison and replacement.
- Preserve the permission state exposed by the runtime: the Unix permission mode and the Windows read-only flag. The replacement gets the current process owner; group ownership, ACLs, extended attributes, and timestamps are not preserved. The modified time advances on save.
- Fail without discarding the in-memory draft when reading, writing, flushing, replacing, or permission checks fail. Do not retry a failed replacement by truncating the destination in place.

The metadata limits above are a deliberate initial policy, not a claim of full metadata preservation. Before release, verify the permission behavior on each supported filesystem and decide whether richer ACL/xattr preservation is required for the chosen user base.

The current renderer treats method presence as capability detection. An adapter must omit an unsupported method rather than provide a nonfunctional implementation. The current Windows no-op event methods are exceptions that should be corrected when event handling is implemented. The renderer currently accepts null for canceled open and uses a generic error for rejected calls. Adapters must not report success before durable replacement finishes.

For Tauri, accept commands only from the application webview and restrict native capabilities to those commands. Local images must resolve under the current document directory after canonicalization, including symlink resolution, and only for supported image extensions. Invalidate the image mapping when the active document changes. Remote navigation must not gain access to the bridge. Open permitted external links using the system browser.

Run `node tools/check-desktop-bridge-fixture.cjs` to verify the fixture response shapes. These are unit-level bridge checks; actual interaction of those fixtures with the renderer and browser keyboard/toolbar paths still requires a GUI check. The current Windows bridge has no preference methods and stores renderer preferences in the existing WebView2 profile. Changing that profile or origin requires a migration that preserves the user's saved settings. The current About updater expects Windows installer asset names and architecture; expose no automatic installer method on a platform that does not implement that protocol.
