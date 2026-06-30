# Markdown Vision Project Description

## Overview

Markdown Vision is a desktop Markdown reader built with Electron. It is designed to open plain-text Markdown files quickly in a clean reading interface without the complexity of a full editor. The application focuses on document viewing, theme switching, typography controls, and simple document ingestion from files or pasted Markdown.

The current project is packaged for Windows as both:

- a portable executable
- an NSIS installer

## Primary Goals

- Provide a focused reading experience for Markdown and text files
- Support opening files directly from the app or from the command line
- Offer light and dark themes
- Let users adjust reading typography and layout
- Keep the application simple enough to distribute as a standalone Windows app

## Core Features

- Opens `.md`, `.markdown`, `.mdown`, `.mkd`, and `.txt` files
- Accepts a filename as a launch argument
- Supports opening associated files from the operating system
- Renders Markdown in a clean document view
- Supports pasted Markdown through a dialog
- Includes adjustable:
  - system font
  - text size
  - line spacing
  - reading width
- Provides light and dark display themes
- Uses a single-instance app model so later launches reuse the existing window
- Shows a subtle bottom border while the window is fullscreen
- Uses a custom `M` / `V` monogram application icon

## Current User Interface

The interface is intentionally minimal.

- A compact top-right toolbar provides:
  - Open file
  - Reading settings
  - Theme toggle
  - Paste Markdown
- The main reading area displays:
  - the current filename
  - the rendered Markdown document
- The old footer branding line has been removed
- The read-time label has been removed
- The main-screen `New document` button has been removed

## Application Behavior

### File Opening

Markdown Vision can open documents in several ways:

- By clicking the open button and choosing a file
- By launching the executable with a supported file path as an argument
- By opening an associated Markdown file from Windows
- By passing content through the paste dialog

The main process resolves incoming file paths carefully for packaged builds. For relative paths, it checks:

- the current working directory
- the portable executable directory when applicable
- the installed executable directory

This avoids failures common in portable Electron builds where the working directory differs from the file location.

### Single-Instance Behavior

The app requests a single-instance lock. If a second launch happens:

- the existing window is focused
- the new file path is captured
- the document is delivered into the already-running instance

### Fullscreen Handling

When the window enters or leaves fullscreen, the main process sends state updates to the renderer. The renderer applies a fullscreen CSS class so the UI can show a subtle bottom border only in fullscreen mode.

### Font Loading

Installed system fonts are not loaded during initial startup anymore. Font enumeration is:

- deferred until the settings panel is opened
- cached in local storage for seven days

This reduces launch-time overhead on Windows by avoiding a PowerShell font scan on every startup.

## Technical Architecture

The project uses a small Electron structure with five main runtime files:

- `main.cjs`
- `preload.cjs`
- `app.js`
- `index.html`
- `styles.css`

### `main.cjs`

This is the Electron main process. It is responsible for:

- creating the main `BrowserWindow`
- resolving and reading incoming document paths
- handling single-instance behavior
- opening the native file dialog
- listing installed Windows fonts through PowerShell
- forwarding fullscreen state changes
- forwarding opened documents to the renderer

### `preload.cjs`

This exposes a narrow bridge from Electron to the renderer using `contextBridge`. The renderer can:

- open a Markdown file
- request the system font list
- receive opened document payloads
- receive fullscreen state updates

### `app.js`

This is the renderer logic. It is responsible for:

- reading and saving local preferences
- toggling themes
- applying typography settings
- parsing Markdown into HTML
- rendering opened or pasted documents
- lazy-loading and caching installed fonts
- responding to fullscreen state updates

### `index.html`

This defines the application shell:

- toolbar
- settings panel
- reading surface
- paste dialog

### `styles.css`

This contains the entire presentation layer, including:

- theme variables
- layout
- toolbar styling
- reader styling
- markdown typography
- fullscreen bottom-border behavior

## Markdown Rendering

The project uses a custom lightweight Markdown parser in `app.js`. It supports a practical subset of Markdown, including:

- headings
- paragraphs
- unordered lists
- ordered lists
- blockquotes
- fenced code blocks
- inline code
- bold
- italics
- strikethrough
- horizontal rules
- links
- images

This parser is intentionally simple and embedded directly in the renderer rather than relying on a large external Markdown package.

## Preferences and Persistence

User preferences are stored in browser local storage under the key:

- `markdown-vision-preferences`

The font cache is stored under:

- `markdown-vision-font-cache`

Saved preferences include:

- theme
- font
- font size
- line height
- reading width

## Build and Packaging

The project is configured with Electron Builder in `package.json`.
The repository also contains a separate Windows-native WebView2 build in `native-windows` for users who want a smaller package and already have the required Windows runtimes installed.

### Windows Targets

The build currently produces:

- `MarkdownVision-Portable-1.0.3.exe`
- `MarkdownVision-Setup-1.0.3.exe`

The installer uses NSIS with:

- non-one-click installation
- per-user installation
- selectable installation directory

### Build Command

```powershell
npm run dist
```

### Development Run Command

```powershell
npm install
npm start
```

## File Associations

The app declares Windows file associations for:

- `.md`
- `.markdown`
- `.mdown`
- `.mkd`

These are registered as Markdown document viewer associations in the packaged build.

## Design Direction

Markdown Vision is intended to feel restrained and reading-first rather than editor-like. The visual system uses:

- warm paper-like light colors
- muted dark theme colors
- serif document typography by default
- compact chrome with minimal distractions

The app is built around the idea that reading Markdown should feel closer to reading a formatted document than interacting with an authoring tool.

## Current Limitations

- It is a reader, not a full Markdown editor
- The Markdown parser is intentionally limited and not fully CommonMark-complete
- The app is currently packaged specifically for Windows
- The internal unpacked executable still uses the spaced product name because Electron Builder derives it from `productName`

## Repository State

The current project branding is fully aligned to `Markdown Vision`. Earlier `Markdownscope` branding has been removed from the active project files and current packaged outputs.

## Summary

Markdown Vision is a lightweight Windows Markdown reading app built on Electron with a minimal UI, configurable reading controls, direct file opening, installer and portable packaging, and a deliberately simple architecture. The codebase is small, understandable, and focused on a single job: opening Markdown documents and presenting them cleanly.
