# Markdown Vision Native

This is a separate Windows-native WPF and WebView2 host for Markdown Vision.
The Electron application in the repository root remains unchanged.

## Build

Install the .NET 8 SDK, then run:

```powershell
.\native-windows\build.ps1
```

To publish a self-contained build that does not require the .NET runtime on the
target machine, run:

```powershell
.\native-windows\build-self-contained.ps1
```

The application uses the Windows WebView2 runtime and links the existing
Markdown Vision renderer files into its build output.

The default published package is framework-dependent. The target computer must
have the Microsoft .NET 8 Desktop Runtime and Microsoft Edge WebView2 Runtime.
The self-contained package still requires Microsoft Edge WebView2 Runtime.
