@echo off
setlocal

set "ROOT=%~dp0.."
node "%ROOT%\tools\export-localization.cjs" --check-generated
if errorlevel 1 exit /b %errorlevel%
node "%ROOT%\tools\check-native-error-localization.cjs"
if errorlevel 1 exit /b %errorlevel%
set "ARCH=%~2"
if "%ARCH%"=="" set "ARCH=x64"
if /I not "%ARCH%"=="x64" if /I not "%ARCH%"=="arm64" exit /b 1
set "OUT_NAME=MarkdownVision-Native-Editor-2.8.28"
if /I "%ARCH%"=="arm64" set "OUT_NAME=MarkdownVision-Native-Editor-2.8.28-arm64"
if not "%~1"=="" set "OUT_NAME=%~1"
set "OUT=%ROOT%\dist\%OUT_NAME%"
set "TEST_DEFINE="
if /I "%~3"=="isolated-test" (
  if "%~1"=="" exit /b 1
  if /I "%OUT_NAME%"=="MarkdownVision-Native-Editor-2.8.28" exit /b 1
  if /I "%OUT_NAME%"=="MarkdownVision-Native-Editor-2.8.28-arm64" exit /b 1
  set "TEST_DEFINE=/DMARKDOWN_VISION_ISOLATED_TEST"
)
set "WV2=%USERPROFILE%\.nuget\packages\microsoft.web.webview2\1.0.3537.50\build\native"
if not exist "%OUT%" mkdir "%OUT%"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0embed-web-assets.ps1" -Root "%ROOT%" -Output "%OUT%\EmbeddedWebAssets.h"
if errorlevel 1 exit /b %errorlevel%

call "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\VsDevCmd.bat" -arch=%ARCH% -host_arch=x64
if errorlevel 1 exit /b %errorlevel%

if /I "%ARCH%"=="x64" (
  cl /nologo /std:c++17 /EHsc "%ROOT%\tools\test-startup-translations.cpp" ^
    /Fo:"%OUT%\test-startup-translations.obj" /Fe:"%OUT%\test-startup-translations.exe"
  if errorlevel 1 exit /b 1
  "%OUT%\test-startup-translations.exe"
  if errorlevel 1 exit /b 1
  del "%OUT%\test-startup-translations.obj" "%OUT%\test-startup-translations.exe"
)

if exist "%OUT%\MarkdownVisionNative.exe" del "%OUT%\MarkdownVisionNative.exe"
if exist "%OUT%\Markdown-Vision.exe" del "%OUT%\Markdown-Vision.exe"
if exist "%OUT%\MarkdownVisionPreviewHandler.dll" del "%OUT%\MarkdownVisionPreviewHandler.dll"

rc /nologo /fo "%OUT%\MarkdownVision.res" "%~dp0MarkdownVision.rc"
if errorlevel 1 exit /b %errorlevel%

cl /nologo /std:c++17 /O2 /EHsc /W4 /DUNICODE /D_UNICODE /DNOMINMAX %TEST_DEFINE% ^
  /I"%WV2%\include" "%~dp0WebViewHost.cpp" "%OUT%\MarkdownVision.res" ^
  /I"%OUT%" ^
  /Fo:"%OUT%\MarkdownVision.obj" ^
  /Fe:"%OUT%\Markdown-Vision.exe" ^
  /link /SUBSYSTEM:WINDOWS user32.lib gdi32.lib comctl32.lib comdlg32.lib ^
  shell32.lib advapi32.lib ole32.lib shlwapi.lib dwmapi.lib urlmon.lib bcrypt.lib "%WV2%\%ARCH%\WebView2LoaderStatic.lib"
if errorlevel 1 exit /b %errorlevel%

cl /nologo /std:c++17 /O2 /EHsc /W4 /DUNICODE /D_UNICODE /DNOMINMAX /LD ^
  "%~dp0PreviewHandler.cpp" ^
  /Fo:"%OUT%\PreviewHandler.obj" ^
  /Fe:"%OUT%\MarkdownVisionPreviewHandler.dll" ^
  /link /SUBSYSTEM:WINDOWS user32.lib gdi32.lib ole32.lib shell32.lib comctl32.lib ^
  uuid.lib
if errorlevel 1 exit /b %errorlevel%

del "%OUT%\MarkdownVision.res" 2>nul
del "%OUT%\MarkdownVision.obj" 2>nul
del "%OUT%\PreviewHandler.obj" 2>nul
copy /y "%ROOT%\LICENSE" "%OUT%\LICENSE" >nul
if not exist "%OUT%\web" mkdir "%OUT%\web"
copy /y "%ROOT%\src\web\index.html" "%OUT%\web\index.html" >nul
copy /y "%ROOT%\src\web\styles.css" "%OUT%\web\styles.css" >nul
copy /y "%ROOT%\src\web\app.js" "%OUT%\web\app.js" >nul
copy /y "%ROOT%\src\web\editor-ui.js" "%OUT%\web\editor-ui.js" >nul
if not exist "%OUT%\web\vendor" mkdir "%OUT%\web\vendor"
copy /y "%ROOT%\src\web\vendor\*" "%OUT%\web\vendor\" >nul
if errorlevel 1 exit /b %errorlevel%
if not exist "%OUT%\web\fonts\libertinus" mkdir "%OUT%\web\fonts\libertinus"
copy /y "%ROOT%\src\web\fonts\libertinus\*" "%OUT%\web\fonts\libertinus\" >nul
if errorlevel 1 exit /b %errorlevel%

set "ARCHIVE=%ROOT%\dist\%OUT_NAME%-win-%ARCH%.zip"
if /I "%ARCH%"=="arm64" if /I "%OUT_NAME%"=="MarkdownVision-Native-Editor-2.8.28-arm64" set "ARCHIVE=%ROOT%\dist\MarkdownVision-Native-Editor-2.8.28-win-arm64.zip"
if exist "%ARCHIVE%" del "%ARCHIVE%"
powershell.exe -NoProfile -NonInteractive -Command ^
  "Compress-Archive -Path '%OUT%\Markdown-Vision.exe' -DestinationPath '%ARCHIVE%' -CompressionLevel Optimal"
if errorlevel 1 exit /b %errorlevel%

echo %ARCHIVE%
