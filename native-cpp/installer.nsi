Unicode True

!include "LogicLib.nsh"
!include "nsDialogs.nsh"

!define APP_NAME "Markdown Vision"
!define APP_VERSION "2.1.0"
!define APP_ID "8d1dd6d6-9e38-5fc2-8139-94aece1f4a40"
!define SOURCE_DIR "..\dist\MarkdownVision-Native-Editor-${APP_VERSION}"
!define APP_EXE "Markdown-Vision.exe"
!define APP_PROGID "MarkdownVision.Document"
!define PREVIEW_HANDLER_CLSID "{1f0cc1d8-7d91-4f93-8a20-a09f3f714dc8}"
!define PREVIEW_HANDLER_KEY "{8895b1c6-b41f-4c1c-a562-0d564250836f}"
!define APP_CAPABILITIES "Software\Classes\Applications\${APP_EXE}\Capabilities"

Name "${APP_NAME} ${APP_VERSION} (Native)"
OutFile "..\dist\Markdown-Vision-Native-Setup-${APP_VERSION}.exe"
VIProductVersion "${APP_VERSION}.0"
VIAddVersionKey "FileDescription" "Markdown Vision Native Setup"
VIAddVersionKey "FileVersion" "${APP_VERSION}"
VIAddVersionKey "LegalCopyright" "Licensed under GPL-3.0-only"
VIAddVersionKey "ProductName" "${APP_NAME}"
VIAddVersionKey "ProductVersion" "${APP_VERSION}"
InstallDir "$PROGRAMFILES64\MarkdownVision"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
Icon "MarkdownVision.ico"
UninstallIcon "MarkdownVision.ico"

Page directory
Page custom DefaultMarkdownPage DefaultMarkdownPageLeave
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

Var DefaultMarkdownCheckbox
Var SetAsDefaultMarkdown

Function RemovePreviousInstall
  SetRegView 64
  ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "UninstallString"
  ReadRegStr $2 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "InstallLocation"
  StrCmp $0 "" no_previous_install
  DetailPrint "Removing the currently installed Markdown Vision edition..."
  ExecWait '$0 /S _?=$2' $1
  StrCmp $1 "0" no_previous_install
  MessageBox MB_ICONSTOP "The existing Markdown Vision installation could not be removed. Setup will stop without installing the native edition."
  Abort
no_previous_install:
FunctionEnd

Function DefaultMarkdownPage
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 24u "Markdown Vision can register itself as a viewer for markdown files."
  Pop $0
  ${NSD_CreateCheckbox} 0 28u 100% 12u "Set Markdown Vision as the default application for markdown files"
  Pop $DefaultMarkdownCheckbox
  ${NSD_SetState} $DefaultMarkdownCheckbox ${BST_CHECKED}
  nsDialogs::Show
FunctionEnd

Function DefaultMarkdownPageLeave
  ${NSD_GetState} $DefaultMarkdownCheckbox $0
  ${If} $0 = ${BST_CHECKED}
    StrCpy $SetAsDefaultMarkdown "1"
  ${Else}
    StrCpy $SetAsDefaultMarkdown "0"
  ${EndIf}
FunctionEnd

Section "Markdown Vision" SEC_APP
  Call RemovePreviousInstall
  SetRegView 64
  SetShellVarContext all
  RMDir /r "$INSTDIR"
  CreateDirectory "$INSTDIR"
  SetOutPath "$INSTDIR"
  File "${SOURCE_DIR}\${APP_EXE}"
  File "${SOURCE_DIR}\MarkdownVisionPreviewHandler.dll"
  File "${SOURCE_DIR}\LICENSE"
  SetOutPath "$INSTDIR\web"
  File "${SOURCE_DIR}\web\index.html"
  File "${SOURCE_DIR}\web\styles.css"
  File "${SOURCE_DIR}\web\app.js"
  File "${SOURCE_DIR}\web\editor-ui.js"

  IfFileExists "$INSTDIR\${APP_EXE}" native_executable_ready
  MessageBox MB_ICONSTOP "Markdown Vision Native could not be installed. Setup will stop without registering an incomplete installation."
  Abort
native_executable_ready:
  WriteUninstaller "$INSTDIR\UninstallMarkdownVision.exe"

  CreateDirectory "$SMPROGRAMS\Markdown Vision"
  CreateShortcut "$SMPROGRAMS\Markdown Vision\Markdown Vision.lnk" "$INSTDIR\${APP_EXE}"
  CreateShortcut "$SMPROGRAMS\Markdown Vision\Uninstall Markdown Vision.lnk" "$INSTDIR\UninstallMarkdownVision.exe"
  CreateShortcut "$DESKTOP\Markdown Vision.lnk" "$INSTDIR\${APP_EXE}"

  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "DisplayName" "${APP_NAME} ${APP_VERSION} (Native)"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "Publisher" "${APP_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "DisplayIcon" "$INSTDIR\${APP_EXE},0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "UninstallString" '"$INSTDIR\UninstallMarkdownVision.exe"'
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "QuietUninstallString" '"$INSTDIR\UninstallMarkdownVision.exe" /S'
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "NoRepair" 1

  WriteRegStr HKLM "Software\Classes\${APP_PROGID}" "" "Markdown document"
  WriteRegStr HKLM "Software\Classes\${APP_PROGID}\DefaultIcon" "" "$INSTDIR\${APP_EXE},0"
  WriteRegStr HKLM "Software\Classes\${APP_PROGID}\shell\open\command" "" '"$INSTDIR\${APP_EXE}" "%1"'

  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXE}" "" "Markdown Vision"
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXE}\DefaultIcon" "" "$INSTDIR\${APP_EXE},0"
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXE}\shell\open\command" "" '"$INSTDIR\${APP_EXE}" "%1"'
  WriteRegStr HKLM "Software\Classes\CLSID\${PREVIEW_HANDLER_CLSID}" "" "Markdown Vision Preview Handler"
  WriteRegStr HKLM "Software\Classes\CLSID\${PREVIEW_HANDLER_CLSID}\InprocServer32" "" "$INSTDIR\MarkdownVisionPreviewHandler.dll"
  WriteRegStr HKLM "Software\Classes\CLSID\${PREVIEW_HANDLER_CLSID}\InprocServer32" "ThreadingModel" "Apartment"
  WriteRegStr HKLM "${APP_CAPABILITIES}" "ApplicationName" "${APP_NAME}"
  WriteRegStr HKLM "${APP_CAPABILITIES}" "ApplicationDescription" "Markdown file viewer"
  WriteRegStr HKLM "${APP_CAPABILITIES}\FileAssociations" ".md" "${APP_PROGID}"
  WriteRegStr HKLM "${APP_CAPABILITIES}\FileAssociations" ".markdown" "${APP_PROGID}"
  WriteRegStr HKLM "${APP_CAPABILITIES}\FileAssociations" ".mdown" "${APP_PROGID}"
  WriteRegStr HKLM "${APP_CAPABILITIES}\FileAssociations" ".mkd" "${APP_PROGID}"
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXE}\SupportedTypes" ".md" ""
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXE}\SupportedTypes" ".markdown" ""
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXE}\SupportedTypes" ".mdown" ""
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXE}\SupportedTypes" ".mkd" ""
  WriteRegStr HKLM "Software\Classes\${APP_PROGID}\shellex\${PREVIEW_HANDLER_KEY}" "" "${PREVIEW_HANDLER_CLSID}"
  WriteRegStr HKLM "Software\Classes\SystemFileAssociations\.md\shellex\${PREVIEW_HANDLER_KEY}" "" "${PREVIEW_HANDLER_CLSID}"
  WriteRegStr HKLM "Software\Classes\SystemFileAssociations\.markdown\shellex\${PREVIEW_HANDLER_KEY}" "" "${PREVIEW_HANDLER_CLSID}"
  WriteRegStr HKLM "Software\Classes\SystemFileAssociations\.mdown\shellex\${PREVIEW_HANDLER_KEY}" "" "${PREVIEW_HANDLER_CLSID}"
  WriteRegStr HKLM "Software\Classes\SystemFileAssociations\.mkd\shellex\${PREVIEW_HANDLER_KEY}" "" "${PREVIEW_HANDLER_CLSID}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\PreviewHandlers" "${PREVIEW_HANDLER_CLSID}" "Markdown Vision Preview Handler"
  ${If} $SetAsDefaultMarkdown == "1"
    WriteRegStr HKLM "Software\Classes\.md" "" "${APP_PROGID}"
  ${Else}
    DeleteRegValue HKLM "Software\Classes\.md" ""
  ${EndIf}
  WriteRegStr HKLM "Software\Classes\.md\OpenWithProgids" "${APP_PROGID}" ""
  WriteRegStr HKLM "Software\Classes\.markdown" "" "${APP_PROGID}"
  WriteRegStr HKLM "Software\Classes\.markdown\OpenWithProgids" "${APP_PROGID}" ""
  WriteRegStr HKLM "Software\Classes\.mdown" "" "${APP_PROGID}"
  WriteRegStr HKLM "Software\Classes\.mdown\OpenWithProgids" "${APP_PROGID}" ""
  WriteRegStr HKLM "Software\Classes\.mkd" "" "${APP_PROGID}"
  WriteRegStr HKLM "Software\Classes\.mkd\OpenWithProgids" "${APP_PROGID}" ""
  WriteRegStr HKLM "Software\RegisteredApplications" "${APP_NAME}" "${APP_CAPABILITIES}"

  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
SectionEnd

Section "Uninstall"
  SetRegView 64
  SetShellVarContext all

  Delete "$DESKTOP\Markdown Vision.lnk"
  RMDir /r "$SMPROGRAMS\Markdown Vision"
  RMDir /r "$INSTDIR"

  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}"
  DeleteRegValue HKLM "Software\RegisteredApplications" "${APP_NAME}"
  DeleteRegKey HKLM "Software\Classes\Applications\${APP_EXE}"
  DeleteRegKey HKLM "Software\Classes\CLSID\${PREVIEW_HANDLER_CLSID}"
  DeleteRegKey HKLM "Software\Classes\${APP_PROGID}"
  DeleteRegKey HKLM "Software\Classes\MarkdownVision.Document"
  DeleteRegKey HKLM "Software\Classes\${APP_PROGID}\shellex\${PREVIEW_HANDLER_KEY}"
  DeleteRegKey HKLM "Software\Classes\SystemFileAssociations\.md\shellex\${PREVIEW_HANDLER_KEY}"
  DeleteRegKey HKLM "Software\Classes\SystemFileAssociations\.markdown\shellex\${PREVIEW_HANDLER_KEY}"
  DeleteRegKey HKLM "Software\Classes\SystemFileAssociations\.mdown\shellex\${PREVIEW_HANDLER_KEY}"
  DeleteRegKey HKLM "Software\Classes\SystemFileAssociations\.mkd\shellex\${PREVIEW_HANDLER_KEY}"
  DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\PreviewHandlers" "${PREVIEW_HANDLER_CLSID}"

  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
SectionEnd
