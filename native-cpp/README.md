# Markdown Vision Native C++

This edition is a native Win32 C++ WebView2 application. It does not require
Electron, Node.js, or .NET. It uses the WebView2 Runtime included with current
supported Windows installations. The Electron installer remains separate.
The standalone application executable is `Markdown-Vision.exe`.

Build version 2.8.5 with the Visual Studio C++ toolchain configured in `build.bat` and the WebView2 SDK in the local NuGet cache:

```powershell
.\native-cpp\build.bat
```

Build the replacement installer:

```powershell
.\native-cpp\build-installer.bat
```

The native installer uses the existing Markdown Vision product identity and
installation directory, so it removes and replaces an installed Electron
edition instead of installing side by side.

The standalone ZIP is `dist\MarkdownVision-Native-Editor-2.8.5-win-x64.zip`.
The installer is `dist\Markdown-Vision-Native-Setup-2.8.5.exe`.
The native application bundles the shared reader and editor assets from the repository root.
