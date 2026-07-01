Unicode True

!define APP_NAME "Markdown Vision"
!define APP_VERSION "1.0.4"
!define APP_ID "8d1dd6d6-9e38-5fc2-8139-94aece1f4a40"
!define SOURCE_DIR "..\dist\MarkdownVision-Native-Standalone-1.0.4"

Name "${APP_NAME} ${APP_VERSION} (Native)"
OutFile "..\dist\MarkdownVision-Native-Setup-${APP_VERSION}.exe"
InstallDir "$PROGRAMFILES64\${APP_NAME}"
InstallDirRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "InstallLocation"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
Icon "MarkdownVision.ico"
UninstallIcon "MarkdownVision.ico"

Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

Function RemovePreviousInstall
  SetRegView 64
  ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "UninstallString"
  StrCmp $0 "" no_previous_install
  DetailPrint "Removing the currently installed Markdown Vision edition..."
  ExecWait '$0 /S' $1
no_previous_install:
FunctionEnd

Section "Markdown Vision" SEC_APP
  Call RemovePreviousInstall
  SetRegView 64
  SetShellVarContext all
  RMDir /r "$INSTDIR"
  CreateDirectory "$INSTDIR"
  SetOutPath "$INSTDIR"
  File "${SOURCE_DIR}\Markdown Vision Native.exe"
  Rename "$INSTDIR\Markdown Vision Native.exe" "$INSTDIR\Markdown Vision.exe"
  File "${SOURCE_DIR}\LICENSE"
  SetOutPath "$INSTDIR\web"
  File "${SOURCE_DIR}\web\index.html"
  File "${SOURCE_DIR}\web\styles.css"
  File "${SOURCE_DIR}\web\app.js"

  WriteUninstaller "$INSTDIR\Uninstall Markdown Vision.exe"

  CreateDirectory "$SMPROGRAMS\Markdown Vision"
  CreateShortcut "$SMPROGRAMS\Markdown Vision\Markdown Vision.lnk" "$INSTDIR\Markdown Vision.exe"
  CreateShortcut "$SMPROGRAMS\Markdown Vision\Uninstall Markdown Vision.lnk" "$INSTDIR\Uninstall Markdown Vision.exe"
  CreateShortcut "$DESKTOP\Markdown Vision.lnk" "$INSTDIR\Markdown Vision.exe"

  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "DisplayName" "${APP_NAME} ${APP_VERSION} (Native)"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "Publisher" "${APP_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "DisplayIcon" "$INSTDIR\Markdown Vision.exe,0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "UninstallString" '"$INSTDIR\Uninstall Markdown Vision.exe"'
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "QuietUninstallString" '"$INSTDIR\Uninstall Markdown Vision.exe" /S'
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "NoRepair" 1

  WriteRegStr HKLM "Software\Classes\MarkdownVision.Document" "" "Markdown document"
  WriteRegStr HKLM "Software\Classes\MarkdownVision.Document\DefaultIcon" "" "$INSTDIR\Markdown Vision.exe,0"
  WriteRegStr HKLM "Software\Classes\MarkdownVision.Document\shell\open\command" "" '"$INSTDIR\Markdown Vision.exe" "%1"'
  WriteRegStr HKLM "Software\Classes\.md" "" "MarkdownVision.Document"
  WriteRegStr HKLM "Software\Classes\.markdown" "" "MarkdownVision.Document"
  WriteRegStr HKLM "Software\Classes\.mdown" "" "MarkdownVision.Document"
  WriteRegStr HKLM "Software\Classes\.mkd" "" "MarkdownVision.Document"

  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
SectionEnd

Section "Uninstall"
  SetRegView 64
  SetShellVarContext all

  Delete "$DESKTOP\Markdown Vision.lnk"
  RMDir /r "$SMPROGRAMS\Markdown Vision"
  RMDir /r "$INSTDIR"

  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}"
  DeleteRegKey HKLM "Software\Classes\MarkdownVision.Document"
  DeleteRegKey HKLM "Software\Classes\.md"
  DeleteRegKey HKLM "Software\Classes\.markdown"
  DeleteRegKey HKLM "Software\Classes\.mdown"
  DeleteRegKey HKLM "Software\Classes\.mkd"

  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
SectionEnd
