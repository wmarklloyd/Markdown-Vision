@echo off
setlocal

set "ROOT=%~dp0.."
set "OUT=%ROOT%\dist\MarkdownVision-Native-Standalone-1.0.4"
if not exist "%OUT%" mkdir "%OUT%"

call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=x64 -host_arch=x64
if errorlevel 1 exit /b %errorlevel%

rc /nologo /fo "%OUT%\MarkdownVision.res" "%~dp0MarkdownVision.rc"
if errorlevel 1 exit /b %errorlevel%

cl /nologo /std:c++17 /O2 /EHsc /W4 /DUNICODE /D_UNICODE /DNOMINMAX ^
  "%~dp0MarkdownVision.cpp" "%OUT%\MarkdownVision.res" ^
  /Fo:"%OUT%\MarkdownVision.obj" ^
  /Fe:"%OUT%\Markdown Vision Native.exe" ^
  /link /SUBSYSTEM:WINDOWS user32.lib gdi32.lib comctl32.lib comdlg32.lib ^
  shell32.lib advapi32.lib ole32.lib
if errorlevel 1 exit /b %errorlevel%

del "%OUT%\MarkdownVision.res" 2>nul
del "%OUT%\MarkdownVision.obj" 2>nul
copy /y "%ROOT%\LICENSE" "%OUT%\LICENSE" >nul

set "ARCHIVE=%ROOT%\dist\MarkdownVision-Native-Standalone-1.0.4-win-x64.zip"
if exist "%ARCHIVE%" del "%ARCHIVE%"
powershell.exe -NoProfile -NonInteractive -Command ^
  "Compress-Archive -LiteralPath '%OUT%\Markdown Vision Native.exe','%OUT%\LICENSE' -DestinationPath '%ARCHIVE%' -CompressionLevel Optimal"
if errorlevel 1 exit /b %errorlevel%

echo %ARCHIVE%
