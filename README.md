# Markdown Vision

A native Windows x64 Markdown reader and editor. Markdown Vision uses a Win32 C++ executable with Microsoft Edge WebView2 and provides Visual, Split, and Markdown editing with Save and Save As.

## Download for Windows

**[Download the Markdown Vision 2.0.0 Windows installer (.exe)](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.0.0/Markdown-Vision-Native-Setup-2.0.0.exe)**

Run setup to install `Markdown-Vision.exe`, add Markdown file associations, and register the Explorer Preview Pane handler.

**[Download the portable Windows x64 ZIP](https://github.com/wmarklloyd/Markdown-Vision/releases/download/v2.0.0/MarkdownVision-Native-Editor-2.0.0-win-x64.zip)**

Extract the ZIP and run `Markdown-Vision.exe` from the extracted folder. Keep the adjacent `web\` folder with the executable. You can also pass a Markdown file path as a command-line argument.

Both downloads use the Microsoft Edge WebView2 Runtime.

## Build from source

```powershell
.\native-cpp\build.bat
.\native-cpp\build-installer.bat
```

The ZIP and setup executable are written to `dist\`.

See [the project description](PROJECT_DESCRIPTION.md) for architecture and verification status, and [the native build notes](native-cpp/README.md) for prerequisites.
