# Luna cross-platform release readiness

This is a draft verification record, not a release approval. No release is published from these instructions.

The Windows release is now 2.8.15. Results below that name 2.8.12 are historical and should not be read as evidence for the current version. The About renderer harness now reads the installed version dynamically, checks a genuinely newer version, and opens About asynchronously while a simulated network request is pending. Its full UI run passed in the elevated Windows environment. Linux CI is configured to retain packages, package hashes and metadata, PDFs, screenshots, and logs, and to emit a versioned artifact manifest. Those CI workflow changes have not yet run on GitHub.

## Build and package matrix

| Platform / package | Build runner and expected output | Metadata and checks |
| --- | --- | --- |
| Windows x64 / ARM64 | Existing Win32 C++ build on matching Windows hardware; `native-cpp/build-installer.bat [x64|arm64]` writes the installer and portable ZIP under `dist/`. | Current release names: `Markdown-Vision-Native-Setup-2.8.15-Intel-AMD-x64.exe` and `Markdown-Vision-Native-Setup-2.8.15-Windows-ARM64.exe`, plus `MarkdownVision-Native-Editor-2.8.15-win-x64.zip` and `MarkdownVision-Native-Editor-2.8.15-win-arm64.zip`. Check architecture, native file version 2.8.15, associations, ZIP contents, and SHA-256. ARM64 release verification requires native ARM64 Windows hardware. |
| macOS universal DMG | `macos-14` signed-build workflow with the protected `macos-signing` environment; output is `native-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg`. | Expected Tauri name: `Markdown Vision_2.8.15_universal.dmg`. Bundle version 2.8.15, `com.markdownvision.desktop`, Apple Silicon and Intel slices, Developer ID signature, notarization ticket, and Gatekeeper assessment. Keep signing credentials out of pull-request jobs. Install by dragging the app into Applications after Gatekeeper accepts the disk image. |
| Linux x86-64 DEB | Ubuntu 22.04 build; output is `native-tauri/target/release/bundle/deb/*.deb`. | Expected Tauri name: `Markdown Vision_2.8.15_amd64.deb`. Bundle version 2.8.15, `text/markdown` association, and runtime dependencies `libwebkit2gtk-4.1-0`, `libgtk-3-0`, `zenity`, and `xdg-utils`. The CI lane audits package metadata, installs the built DEB, and runs the Linux GUI lifecycle script in Xvfb/D-Bus. Supported distro range remains unselected until install checks pass on named Debian/Ubuntu releases. |
| Linux x86-64 RPM and AppImage | `linux-build.yml` builds RPM and AppImage beside the DEB, logs sizes and checksums, validates RPM metadata/dependencies, launches the AppImage in Xvfb, and uploads candidates plus evidence as a CI artifact. | This revised workflow has not run on GitHub. RPM still needs install testing on a Fedora/RPM system; AppImage compatibility and update behavior need testing on the oldest and newest claimed distributions. These are candidate builds, not published release assets. |

Tauri metadata is currently set in `native-tauri/tauri.conf.json` and `native-tauri/Cargo.toml`. The Linux CI lane builds DEB, RPM, and AppImage candidates; only the DEB currently receives a package install and full GUI lifecycle check. Intel-only macOS and ARM64 Linux have no selected release package yet. The workflow `cross-platform-toolchains.yml` performs unsigned builds and uploads CI artifacts on Windows, macOS, and Linux. The protected macOS workflow is the only job intended to produce a signed/notarized candidate.

## Draft release layout

Use one version heading and label every download by operating system, architecture, and package type. Populate links only from reviewed, checksum-verified artifacts:

- **Windows x64:** `Markdown-Vision-Native-Setup-2.8.15-Intel-AMD-x64.exe` · `MarkdownVision-Native-Editor-2.8.15-win-x64.zip`
- **Windows ARM64:** `Markdown-Vision-Native-Setup-2.8.15-Windows-ARM64.exe` · `MarkdownVision-Native-Editor-2.8.15-win-arm64.zip`
- **macOS universal:** `Markdown Vision_2.8.15_universal.dmg` (signed and notarized)
- **Linux x86-64:** `Markdown Vision_2.8.15_amd64.deb` (package manager install)
- **Checksums:** SHA-256 manifest covering every selected download

No links are populated because there is no reviewed set of matching current-version artifacts yet. Do not label the experimental Linux development package as broadly compatible.

## About behavior and shortcut labels

The About panel opens asynchronously and starts the release check only while About is opened. It has a retry action after a network or API failure. With a successful check, an equal/older version shows the latest version and no update link; a newer version exposes the release link. A host with the Windows verified-installer capability can start a digest-verified installer. macOS/Linux omit that capability and use the signed download/package instructions linked by the release page. A disconnected machine follows the same error and retry path as a failed API response.

Toolbar commands and their keyboard equivalents share renderer handlers. Windows/Linux display Ctrl in tooltips; macOS displays ⌘. Open, print, and search dispatch to the same operations as their toolbar buttons. Save, Save As, and New likewise share the editor's save/new handlers. This mapping is source-reviewed; keyboard and toolbar parity still needs actual interaction checks on every target webview.

## Release checks: current state

The 2.8.15 shared Tauri workspace passed `cargo check --locked --manifest-path native-tauri/Cargo.toml` and 11 Rust unit tests on Windows using an isolated temporary target directory. This confirms the common Rust code and Windows target compile. It does not validate Linux/macOS conditional code or native packaging. This machine has no installed WSL distribution, Docker, or Podman, so Linux packaging must run on Linux CI or a Linux machine.

| Gate | Evidence currently available | Remaining work / owner dependency |
| --- | --- | --- |
| Shared asset list and references | `tools/stage-tauri.cjs --check-only` passed locally. `--destination <path>` staged all nine assets (349,318 bytes) under `%TEMP%`, avoiding the locked repository staging directory. | The default `.tmp/tauri-frontend` destination remains locked in this session. CI stages to a fresh runner path and performs a native package build. |
| Bridge/UI contract fixtures | The fixture check and expanded renderer harness passed on 2026-11-22. The harness covers Open, Save, Save As, Print, Search, errors/cancellation, About states, toolbar/keyboard parity, asynchronous preference merging, and Close/Quit menu prompts. The normal sandboxed Electron launch is denied by Chromium's `mojo platform_channel`; the harness passed when run with desktop-process access. | The matching Windows CI run has not yet occurred. |
| Product metadata | `node tools/check-cross-platform-metadata.cjs` passed on 2026-11-22: all four version sources agree at 2.8.15; product identity, Markdown extensions/MIME type, and Linux dialog dependencies are present. | Runner package architecture and actual installed file associations still need platform package installation checks. |
| Local Windows Tauri package | Historical 2.8.12 evidence: with an alternate staged asset directory and temporary Cargo target, the release build compiled `markdown-vision.exe` (6,287,360 bytes; SHA-256 `5AE03C275904B9F136510808C783C79685445053EA4E33973FB8C533726A517E`). | This is not current-version build evidence. The 2.8.12 NSIS packaging step stopped when Tauri tried to download `nsis-3.13.zip` and the connection was refused. A local launch attempt exited with code 101 and WebView2 CDP on port 9338 timed out. No packaged-app launch pass is claimed. |
| Windows performance baseline | Historical local Electron 1.0.4 portable and setup files are 91,472,257 and 91,719,905 bytes, respectively. | These figures are not a current like-for-like comparison. Measure ten cold launches and idle memory for the current 2.8.15 Win32 host on x64 and ARM64 machines. |
| macOS/Linux functional gates | Terra's review records unsigned Apple Silicon GUI/PDF checks and Ubuntu 22.04 DEB/GUI/PDF checks. | Remaining engine, distribution, lifecycle, and upgrade checks are in `docs/terra-release-gate-review.md`; Luna has not independently replayed them. |
| Performance and size ratios | No comparable same-machine system-webview baselines or ten-run measurements are recorded. | Must compare same OS/hardware and equivalent startup/open work, include webview child processes, and report actual measures, medians, worst run, and ratios. |
| Linux package install and desktop lifecycle | `linux-build.yml` records runner/WebKitGTK versions, validates DEB version, architecture, runtime dependencies, executable path, and Markdown MIME association, installs the DEB with apt, and runs `tools/check-linux-lifecycle.sh` in Xvfb/D-Bus. It validates RPM metadata, launches the AppImage, and uploads packages and evidence as a CI artifact. | This revised CI job has not run yet. A passing Ubuntu 22.04 CI run will cover that runner only; verify clean installs on the named supported distributions, RPM installation, and package-manager upgrades before choosing a support range. |
| Install/upgrade and distribution | Linux DEB installation and GUI lifecycle are automated for the Ubuntu 22.04 runner; Windows native naming/layout is documented. | Linux clean installs on every selected distro and a package-manager upgrade; Windows x64 and ARM64, custom path, Explorer preview and retained preferences; signed macOS Gatekeeper validation remain open. |
| Signing and notarization | Protected workflow is prepared. | Depends on Terra T6 and configured Apple Developer environment credentials plus clean-Mac validation. No credentials were inspected or used. |

The historical 2.8.12 temporary-target `tauri build` completed Rust release compilation, but its NSIS packaging step needed a network download and failed with `Connection refused`. The current 2.8.15 Rust tests and compile check use `%TEMP%\markdown-vision-tauri-check`; all 11 Windows-target unit tests pass. Keep local build output in an OS temporary directory. Running `tools/windows-tauri-env.ps1` directly may be blocked by PowerShell execution policy; setting `RUSTUP_HOME` and `CARGO_HOME` for the session works without invoking that script.

### Repeatable local commands

From the repository root:

```powershell
node tools/stage-tauri.cjs --check-only
node tools/stage-tauri.cjs --destination "$env:TEMP\MarkdownVision-stage"
. .\tools\windows-tauri-env.ps1
cargo test --locked --manifest-path native-tauri/Cargo.toml
cargo check --locked --manifest-path native-tauri/Cargo.toml
node tools/check-desktop-bridge-fixture.cjs
node tools/check-cross-platform-metadata.cjs
node tools/run-renderer-ui-harness.cjs
```

Package builds must run on supported platform runners. Use the native package commands and expected output paths in the matrix above. Record OS build, architecture, WebView/WebKit runtime, artifact SHA-256, and exact steps with each manual result. Never treat successful compilation alone as a release-gate pass.
