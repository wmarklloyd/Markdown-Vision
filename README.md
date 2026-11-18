# Markdown Vision

A Windows Markdown reader and editor with light and dark themes, configurable typography, and Visual, Split, and Markdown editing views. Version 2.0.0 uses the native C++ application with Microsoft Edge WebView2. The editor provides Save and Save As.

## Build the native Windows app

```powershell
.\native-cpp\build.bat
```

Extract `dist/MarkdownVision-Native-Editor-2.0.0-win-x64.zip` and run `Markdown-Vision.exe`. Keep the adjacent `web/` directory with the executable. You can also pass a Markdown file path as a command-line argument.

## Build the Windows installer

```powershell
.\native-cpp\build-installer.bat
```

The setup executable is written to `dist/Markdown-Vision-Native-Setup-2.0.0.exe`.

See [the project description](PROJECT_DESCRIPTION.md) for architecture and verification status, and [the native build notes](native-cpp/README.md) for prerequisites.
