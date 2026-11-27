# Markdown Vision

A Markdown reader and editor for Windows, Linux, and macOS. It supports Visual, Split, and Markdown editing, saving, and system printing.

## Download for Windows

**Current Windows version: v2.8.29**

**[Windows installer — Intel/AMD x64 (.exe)](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.29/Markdown-Vision-Native-Setup-2.8.29-Intel-AMD-x64.exe)** · **[Windows installer — ARM64 (.exe)](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.29/Markdown-Vision-Native-Setup-2.8.29-Windows-ARM64.exe)**

Portable ZIPs: [Windows x64](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.29/MarkdownVision-Native-Editor-2.8.29-win-x64.zip) · [Windows ARM64](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.29/MarkdownVision-Native-Editor-2.8.29-win-arm64.zip)

## Linux downloads (v2.8.29)

Choose the DEB for Ubuntu or the RPM for Fedora. The AppImage is a portable option for x86_64.

- Ubuntu x86_64: [DEB package](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.29/Markdown-Vision-2.8.29-ubuntu-x86_64.deb) · [AppImage](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.29/Markdown-Vision-2.8.29-ubuntu-x86_64.AppImage)
- Ubuntu ARM64: [DEB package](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.29/Markdown-Vision-2.8.29-ubuntu-aarch64.deb)
- Fedora x86_64: [RPM package](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.29/Markdown-Vision-2.8.29-fedora-x86_64.rpm)
- Fedora ARM64: [RPM package](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.29/Markdown-Vision-2.8.29-fedora-aarch64.rpm)

The links download the packages directly from the GitHub release. Ubuntu x86_64 users can install the DEB with `sudo apt install ./Markdown-Vision-2.8.29-ubuntu-x86_64.deb` or run the AppImage.

## macOS download (v2.8.29)

Download the universal macOS disk image. This build is unsigned, so macOS may ask you to approve opening it in Privacy & Security settings:

- [macOS universal DMG](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.8.29/Markdown-Vision-2.8.29-macos-universal.dmg)

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
