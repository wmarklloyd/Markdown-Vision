Unicode True

!include "LogicLib.nsh"
!include "nsDialogs.nsh"
!include "installer-localization.nsh"

!define APP_NAME "Markdown Vision"
!define APP_VERSION "2.8.29"
!define APP_ID "8d1dd6d6-9e38-5fc2-8139-94aece1f4a40"
!ifndef SOURCE_DIR
!ifdef ARM64
!define SOURCE_DIR "..\dist\MarkdownVision-Native-Editor-${APP_VERSION}-arm64"
!else
!define SOURCE_DIR "..\dist\MarkdownVision-Native-Editor-${APP_VERSION}"
!endif
!endif
!ifdef ARM64
!define SETUP_SUFFIX "-Windows-ARM64"
!else
!define SETUP_SUFFIX "-Intel-AMD-x64"
!endif
!define APP_EXE "Markdown-Vision.exe"
!define APP_PROGID "MarkdownVision.Document"
!define PREVIEW_HANDLER_CLSID "{1f0cc1d8-7d91-4f93-8a20-a09f3f714dc8}"
!define PREVIEW_HANDLER_KEY "{8895b1c6-b41f-4c1c-a562-0d564250836f}"
!define APP_CAPABILITIES "Software\Classes\Applications\${APP_EXE}\Capabilities"

Name "${APP_NAME} ${APP_VERSION} (Native)"
Caption "$(MVSetupCaption)"
!ifndef OUTPUT_FILE
!define OUTPUT_FILE "..\dist\Markdown-Vision-Native-Setup-${APP_VERSION}${SETUP_SUFFIX}.exe"
!endif
OutFile "${OUTPUT_FILE}"
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
Page custom FinishPage FinishPageLeave
UninstPage uninstConfirm
UninstPage instfiles

Var DefaultMarkdownCheckbox
Var SetAsDefaultMarkdown
Var MarkdownIsDefault
Var LaunchAfterInstallCheckbox

; NSIS falls back by primary language when no exact locale is available.
; Hong Kong and Macau need Traditional Chinese, even though only the Taiwan
; Traditional language file is bundled. The neutral Traditional LANGID is
; included for systems that report a script rather than a region.
!macro SelectChineseInstallerLanguage
  System::Call 'kernel32::GetUserDefaultUILanguage() i .r0'
  ${If} $0 == 3076
  ${OrIf} $0 == 5124
  ${OrIf} $0 == 31748
    StrCpy $LANGUAGE 1028
  ${EndIf}
!macroend

Function .onInit
  !insertmacro SelectChineseInstallerLanguage
!ifdef ARM64
  System::Call 'kernel32::IsWow64Process2(p -1, *i .r0, *i .r1) i.r2'
  IntOp $1 $1 & 0xffff
  ${If} $2 == 0
  ${OrIf} $1 != 43620
    MessageBox MB_ICONSTOP "$(MVRequiresArm64)"
    SetErrorLevel 1
    Abort
  ${EndIf}
!endif
  SetRegView 64
  ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "InstallLocation"
  StrCpy $MarkdownIsDefault "0"
  ReadRegStr $1 HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.md\UserChoice" "ProgId"
  ${If} $1 != ""
    ${If} $1 == "${APP_PROGID}"
      StrCpy $MarkdownIsDefault "1"
    ${EndIf}
  ${Else}
    ReadRegStr $1 HKCU "Software\Classes\.md" ""
    ${If} $1 == ""
      ReadRegStr $1 HKLM "Software\Classes\.md" ""
    ${EndIf}
    ${If} $1 == "${APP_PROGID}"
      StrCpy $MarkdownIsDefault "1"
    ${EndIf}
  ${EndIf}
  ${If} $0 != ""
    ; Preferences belong to the WebView profile for the installed app page.
    ; Keep custom installation paths as the default for upgrades.
    ${If} $INSTDIR == "$PROGRAMFILES64\MarkdownVision"
      StrCpy $INSTDIR $0
    ${EndIf}
  ${EndIf}
FunctionEnd

Function un.onInit
  !insertmacro SelectChineseInstallerLanguage
FunctionEnd

Function CloseRunningApp
check_running:
  nsExec::ExecToStack 'powershell.exe -NoProfile -NonInteractive -Command "if (Get-Process -Name Markdown-Vision -ErrorAction SilentlyContinue) { exit 1 }"'
  Pop $0
  Pop $1
  StrCmp $0 "0" done
  StrCmp $0 "1" running
  SetErrorLevel 1
  Abort
running:
  IfSilent silent_running
  MessageBox MB_YESNO|MB_ICONQUESTION "$(MVAppRunning)" IDYES close_app
  SetErrorLevel 1
  Abort
close_app:
  nsExec::ExecToStack 'powershell.exe -NoProfile -NonInteractive -Command "Get-Process -Name Markdown-Vision -ErrorAction SilentlyContinue | ForEach-Object { [void]$$_.CloseMainWindow() }; Start-Sleep -Seconds 2"'
  Pop $0
  Pop $1
  StrCmp $0 "0" check_after_close
  MessageBox MB_ICONSTOP "$(MVCloseFailed)"
  SetErrorLevel 1
  Abort
check_after_close:
  nsExec::ExecToStack 'powershell.exe -NoProfile -NonInteractive -Command "if (Get-Process -Name Markdown-Vision -ErrorAction SilentlyContinue) { exit 1 }"'
  Pop $0
  Pop $1
  StrCmp $0 "0" done
  MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "$(MVStillRunning)" IDRETRY check_running
silent_running:
  SetErrorLevel 1
  Abort
done:
FunctionEnd

Function RemovePreviousInstall
  SetRegView 64
  ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "UninstallString"
  ReadRegStr $2 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}" "InstallLocation"
  StrCmp $0 "" no_previous_install
  DetailPrint "$(MVRemoving)"
  ExecWait '$0 /S _?=$2' $1
  StrCmp $1 "0" no_previous_install
  MessageBox MB_ICONSTOP "$(MVRemoveFailed)"
  Abort
no_previous_install:
FunctionEnd

Function DefaultMarkdownPage
  ${If} $MarkdownIsDefault == "1"
    Abort
  ${EndIf}
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  ${If} $LANGUAGE == 1025
    nsDialogs::SetRTL 1
  ${EndIf}

  ; Allow translated text to wrap without colliding with the checkbox.
  ${NSD_CreateLabel} 0 0 100% 44u "$(MVRegisterViewer)"
  Pop $0
  ${NSD_CreateCheckbox} 0 48u 100% 44u "$(MVDefaultApp)"
  Pop $DefaultMarkdownCheckbox
  ${NSD_SetState} $DefaultMarkdownCheckbox ${BST_UNCHECKED}
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

Function FinishPage
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  ${If} $LANGUAGE == 1025
    nsDialogs::SetRTL 1
  ${EndIf}
  ${NSD_CreateLabel} 0 0 100% 28u "$(MVInstalled)"
  Pop $0
  ${NSD_CreateCheckbox} 0 32u 100% 40u "$(MVLaunch)"
  Pop $LaunchAfterInstallCheckbox
  ${NSD_SetState} $LaunchAfterInstallCheckbox ${BST_CHECKED}
  nsDialogs::Show
FunctionEnd

Function FinishPageLeave
  ${NSD_GetState} $LaunchAfterInstallCheckbox $0
  ${If} $0 = ${BST_CHECKED}
    Exec '"$WINDIR\explorer.exe" "$INSTDIR\${APP_EXE}"'
  ${EndIf}
  ${If} $SetAsDefaultMarkdown == "1"
  ${AndIf} $MarkdownIsDefault != "1"
    Exec '"$WINDIR\explorer.exe" "ms-settings:defaultapps"'
  ${EndIf}
FunctionEnd

Section "Markdown Vision" SEC_APP
  Call CloseRunningApp
  Call RemovePreviousInstall
  SetRegView 64
  SetShellVarContext all
  ; The per-user WebView profile lives in LocalAppData, outside this cleanup.
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
  File /r "${SOURCE_DIR}\web\vendor"
  File /r "${SOURCE_DIR}\web\fonts"

  IfFileExists "$INSTDIR\${APP_EXE}" native_executable_ready
  MessageBox MB_ICONSTOP "$(MVInstallFailed)"
  Abort
native_executable_ready:
  WriteUninstaller "$INSTDIR\UninstallMarkdownVision.exe"

  CreateDirectory "$SMPROGRAMS\Markdown Vision"
  CreateShortcut "$SMPROGRAMS\Markdown Vision\Markdown Vision.lnk" "$INSTDIR\${APP_EXE}"
  CreateShortcut "$SMPROGRAMS\Markdown Vision\$(MVUninstall) - Markdown Vision.lnk" "$INSTDIR\UninstallMarkdownVision.exe"
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

  WriteRegStr HKLM "Software\Classes\${APP_PROGID}" "" "$(MVDocument)"
  WriteRegStr HKLM "Software\Classes\${APP_PROGID}\DefaultIcon" "" "$INSTDIR\${APP_EXE},0"
  WriteRegStr HKLM "Software\Classes\${APP_PROGID}\shell\open\command" "" '"$INSTDIR\${APP_EXE}" "%1"'

  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXE}" "" "Markdown Vision"
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXE}\DefaultIcon" "" "$INSTDIR\${APP_EXE},0"
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXE}\shell\open\command" "" '"$INSTDIR\${APP_EXE}" "%1"'
  WriteRegStr HKLM "Software\Classes\CLSID\${PREVIEW_HANDLER_CLSID}" "" "$(MVPreviewHandler)"
  WriteRegStr HKLM "Software\Classes\CLSID\${PREVIEW_HANDLER_CLSID}\InprocServer32" "" "$INSTDIR\MarkdownVisionPreviewHandler.dll"
  WriteRegStr HKLM "Software\Classes\CLSID\${PREVIEW_HANDLER_CLSID}\InprocServer32" "ThreadingModel" "Apartment"
  WriteRegStr HKLM "${APP_CAPABILITIES}" "ApplicationName" "${APP_NAME}"
  WriteRegStr HKLM "${APP_CAPABILITIES}" "ApplicationDescription" "$(MVViewer)"
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
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\PreviewHandlers" "${PREVIEW_HANDLER_CLSID}" "$(MVPreviewHandler)"
  WriteRegStr HKLM "Software\Classes\.md\OpenWithProgids" "${APP_PROGID}" ""
  WriteRegStr HKLM "Software\Classes\.markdown\OpenWithProgids" "${APP_PROGID}" ""
  WriteRegStr HKLM "Software\Classes\.mdown\OpenWithProgids" "${APP_PROGID}" ""
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
