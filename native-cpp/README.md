# Markdown Vision Native C++

This edition is a standalone Win32 C++ application. It does not require
Electron, WebView2, .NET, or another user-installed runtime. The Electron and
WPF/WebView2 editions remain separate.

Build with Visual Studio 2022 C++ Build Tools:

```powershell
.\native-cpp\build.bat
```

The renderer supports Markdown headings, emphasis, code, lists, blockquotes,
links, horizontal rules, and embedded HTML formatting tags. It does not try to
be a browser-grade HTML/CSS engine.
