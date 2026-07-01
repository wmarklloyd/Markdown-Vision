# Markdown Vision Native C++

This edition is a native Win32 C++ WebView2 application. It does not require
Electron, Node.js, or .NET. It uses the WebView2 Runtime included with current
supported Windows installations. The Electron installer remains separate.

Build with Visual Studio 2022 C++ Build Tools:

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

The renderer uses the Electron edition's exact HTML, CSS, and JavaScript assets,
including its settings panel, font picker, Markdown parser, and embedded HTML
support.
