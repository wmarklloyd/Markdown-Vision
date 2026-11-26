@echo off
setlocal

set "ROOT=%~dp0.."
set "MAKENSIS=%LOCALAPPDATA%\electron-builder\Cache\nsis-3.0.4.1\nsis-3.0.4.1-1mx3n\makensis.exe"

if not "%~1"=="" goto build
call "%~f0" x64
if errorlevel 1 exit /b %errorlevel%
call "%~f0" arm64
exit /b %errorlevel%

:build
set "ARCH=%~1"
if /I not "%ARCH%"=="x64" if /I not "%ARCH%"=="arm64" exit /b 1
set "APP_OUT_NAME=MarkdownVision-Native-Editor-2.8.21"
if /I "%ARCH%"=="arm64" set "APP_OUT_NAME=MarkdownVision-Native-Editor-2.8.21-arm64"
call "%~dp0build.bat" "%APP_OUT_NAME%" "%ARCH%"
if errorlevel 1 exit /b %errorlevel%

if not exist "%MAKENSIS%" (
  echo NSIS compiler not found at "%MAKENSIS%"
  exit /b 1
)

pushd "%~dp0"
if /I "%ARCH%"=="arm64" (
  "%MAKENSIS%" /V2 /DARM64 "installer.nsi"
) else (
  "%MAKENSIS%" /V2 "installer.nsi"
)
set "RESULT=%ERRORLEVEL%"
popd
if not "%RESULT%"=="0" exit /b %RESULT%

if /I "%ARCH%"=="arm64" (
  echo %ROOT%\dist\Markdown-Vision-Native-Setup-2.8.21-Windows-ARM64.exe
) else (
  echo %ROOT%\dist\Markdown-Vision-Native-Setup-2.8.21-Intel-AMD-x64.exe
)
