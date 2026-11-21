# Markdown Vision Native C++

This edition is a native Win32 C++ WebView2 application. It does not require
Electron, Node.js, or .NET. It uses the WebView2 Runtime included with current
supported Windows installations. The Electron installer remains separate.
The standalone application executable is `Markdown-Vision.exe`.

Build version 2.8.11 with the Visual Studio C++ toolchain configured in `build.bat` and the WebView2 SDK in the local NuGet cache:

```powershell
.\native-cpp\build.bat
```

Build the replacement installer:

```powershell
.\native-cpp\build-installer.bat
```

To build the ARM64 application, preview handler, portable ZIP, and installer,
install the Visual Studio ARM64 C++ tools and run:

```powershell
.\native-cpp\build-installer.bat arm64
```

The ARM64 installer is `dist\Markdown-Vision-Native-Setup-2.8.11-arm64.exe`
and the portable archive is `dist\MarkdownVision-Native-Editor-2.8.11-win-arm64.zip`.
The target Windows installation needs the ARM64 WebView2 Runtime. The installer
uses the existing product identity and replaces an installed x64 edition.

The native installer uses the existing Markdown Vision product identity and
installation directory, so it removes and replaces an installed Electron
edition instead of installing side by side.

The standalone ZIP is `dist\MarkdownVision-Native-Editor-2.8.11-win-x64.zip`.
The installer is `dist\Markdown-Vision-Native-Setup-2.8.11.exe`.
The native application bundles the shared reader and editor assets from the repository root.
