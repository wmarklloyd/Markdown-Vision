# Markdown Vision

A native Windows Markdown reader and editor with Intel/AMD x64 and ARM64 builds. The Win32 C++ app uses Microsoft Edge WebView2 and supports Visual, Split, and Markdown editing, saving, and system printing.

## Download for Windows

**[Windows installer — Intel/AMD x64 (.exe)](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.16/Markdown-Vision-Native-Setup-2.8.16-Intel-AMD-x64.exe)** · **[Windows installer — ARM64 (.exe)](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.16/Markdown-Vision-Native-Setup-2.8.16-Windows-ARM64.exe)**

Portable ZIPs: [Windows x64](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.16/MarkdownVision-Native-Editor-2.8.16-win-x64.zip) · [Windows ARM64](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.16/MarkdownVision-Native-Editor-2.8.16-win-arm64.zip)

## Linux builds (v2.8.15)

These Linux packages passed build and desktop validation. Download the package for your distribution and processor:

- Ubuntu/Debian x86_64: [DEB package and AppImage](https://github.com/wmarklloyd/Markdown-Vision/actions/runs/45100946243)
- Ubuntu/Debian ARM64: [DEB package](https://github.com/wmarklloyd/Markdown-Vision/actions/runs/45100946243)
- Fedora x86_64: [RPM package](https://github.com/wmarklloyd/Markdown-Vision/actions/runs/45100946151)
- Fedora ARM64: [RPM package](https://github.com/wmarklloyd/Markdown-Vision/actions/runs/45100946151)

Open the workflow run and download the matching architecture artifact. GitHub Actions artifacts are temporary and expire after the repository's artifact retention period.

![Markdown Vision showing its own README five levels deep](docs/markdown-vision-recursive.png)

Run setup to install `Markdown-Vision.exe`, add Markdown file associations, and register the Explorer Preview Pane handler. The standalone ZIP build contains a single `Markdown-Vision.exe`; extract it and run it directly. When no adjacent `web` folder is present, the app prepares its embedded web assets in your local app data folder. You can pass a Markdown file path as a command-line argument.

Both editions require the Microsoft Edge WebView2 Runtime.

## Build from source

```powershell
.\native-cpp\build.bat
.\native-cpp\build-installer.bat
```

The ZIP and setup executable are written to `dist\`.

See [the project description](docs/project/PROJECT_DESCRIPTION.md) for architecture and verification status, [the editor implementation plan](docs/project/MARKDOWN_EDITOR_PLAN.md), and [the native build notes](native-cpp/README.md) for prerequisites.

## Markdown renderer test document

[Markdown-total-torture-test.md](tests/fixtures/Markdown-total-torture-test.md) exercises the renderer with a broad range of Markdown syntax and embedded content.
