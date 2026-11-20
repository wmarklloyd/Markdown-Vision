@echo off
setlocal

set "ROOT=%~dp0.."
set "OUT_NAME=MarkdownVision-Native-Editor-2.8.3"
if not "%~1"=="" set "OUT_NAME=%~1"
set "OUT=%ROOT%\dist\%OUT_NAME%"
set "WV2=%USERPROFILE%\.nuget\packages\microsoft.web.webview2\1.0.3537.50\build\native"
if not exist "%OUT%" mkdir "%OUT%"

call "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\VsDevCmd.bat" -arch=x64 -host_arch=x64
if errorlevel 1 exit /b %errorlevel%

if exist "%OUT%\MarkdownVisionNative.exe" del "%OUT%\MarkdownVisionNative.exe"
if exist "%OUT%\Markdown-Vision.exe" del "%OUT%\Markdown-Vision.exe"
if exist "%OUT%\MarkdownVisionPreviewHandler.dll" del "%OUT%\MarkdownVisionPreviewHandler.dll"

rc /nologo /fo "%OUT%\MarkdownVision.res" "%~dp0MarkdownVision.rc"
if errorlevel 1 exit /b %errorlevel%

cl /nologo /std:c++17 /O2 /EHsc /W4 /DUNICODE /D_UNICODE /DNOMINMAX ^
  /I"%WV2%\include" "%~dp0WebViewHost.cpp" "%OUT%\MarkdownVision.res" ^
  /Fo:"%OUT%\MarkdownVision.obj" ^
  /Fe:"%OUT%\Markdown-Vision.exe" ^
  /link /SUBSYSTEM:WINDOWS user32.lib gdi32.lib comctl32.lib comdlg32.lib ^
  shell32.lib advapi32.lib ole32.lib shlwapi.lib dwmapi.lib "%WV2%\x64\WebView2LoaderStatic.lib"
if errorlevel 1 exit /b %errorlevel%

cl /nologo /std:c++17 /O2 /EHsc /W4 /DUNICODE /D_UNICODE /DNOMINMAX /LD ^
  "%~dp0PreviewHandler.cpp" ^
  /Fe:"%OUT%\MarkdownVisionPreviewHandler.dll" ^
  /link /SUBSYSTEM:WINDOWS user32.lib gdi32.lib ole32.lib shell32.lib comctl32.lib ^
  uuid.lib
if errorlevel 1 exit /b %errorlevel%

del "%OUT%\MarkdownVision.res" 2>nul
del "%OUT%\MarkdownVision.obj" 2>nul
copy /y "%ROOT%\LICENSE" "%OUT%\LICENSE" >nul
if not exist "%OUT%\web" mkdir "%OUT%\web"
copy /y "%ROOT%\index.html" "%OUT%\web\index.html" >nul
copy /y "%ROOT%\styles.css" "%OUT%\web\styles.css" >nul
copy /y "%ROOT%\app.js" "%OUT%\web\app.js" >nul
copy /y "%ROOT%\editor-ui.js" "%OUT%\web\editor-ui.js" >nul
if not exist "%OUT%\web\vendor" mkdir "%OUT%\web\vendor"
copy /y "%ROOT%\vendor\*" "%OUT%\web\vendor\" >nul
if errorlevel 1 exit /b %errorlevel%

set "ARCHIVE=%ROOT%\dist\%OUT_NAME%-win-x64.zip"
if exist "%ARCHIVE%" del "%ARCHIVE%"
powershell.exe -NoProfile -NonInteractive -Command ^
  "Compress-Archive -Path '%OUT%\*' -DestinationPath '%ARCHIVE%' -CompressionLevel Optimal"
if errorlevel 1 exit /b %errorlevel%

echo %ARCHIVE%
