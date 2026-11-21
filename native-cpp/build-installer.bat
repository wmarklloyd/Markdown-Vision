@echo off
setlocal

set "ROOT=%~dp0.."
set "MAKENSIS=%LOCALAPPDATA%\electron-builder\Cache\nsis-3.0.4.1\nsis-3.0.4.1-1mx3n\makensis.exe"

call "%~dp0build.bat"
if errorlevel 1 exit /b %errorlevel%

if not exist "%MAKENSIS%" (
  echo NSIS compiler not found at "%MAKENSIS%"
  exit /b 1
)

pushd "%~dp0"
"%MAKENSIS%" /V2 "installer.nsi"
set "RESULT=%ERRORLEVEL%"
popd
if not "%RESULT%"=="0" exit /b %RESULT%

echo %ROOT%\dist\Markdown-Vision-Native-Setup-2.8.8.exe
