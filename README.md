# Markdown Vision

A focused standalone Markdown reader with light and dark themes and access to your installed system fonts.

## Run locally

```powershell
npm install
npm start
```

## Build the portable Windows app

```powershell
npm run dist
```

The standalone executable is written to `dist/MarkdownVision-Portable-1.0.4.exe`. It does not require installation. Markdown files can also be passed to the executable from the command line.

## Build the smaller Windows-native app

```powershell
npm run dist-native
```

This builds the separate WebView2-based Windows edition into `dist`. It is smaller than the Electron package, but it depends on the Microsoft Edge WebView2 Runtime and the .NET 8 Desktop Runtime on the target machine.
