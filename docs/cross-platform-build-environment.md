# Cross-platform build environment

The Windows workspace has Rust and the Tauri 2 CLI under `.tmp`. Run the following in PowerShell to put them on the current session's PATH:

```powershell
. .\tools\windows-tauri-env.ps1
rustc --version
tauri.cmd --version
```

`tools/stage-tauri.cjs` is the deliberate frontend asset list for native Tauri packages. It checks local HTML references before staging to `.tmp/tauri-frontend`; `node tools/stage-tauri.cjs --check-only` runs the reference check without touching that directory. Pass `--destination <directory>` to use a temporary or otherwise unlocked staging path. The native package reads only the staged directory. The Win32 C++ package continues to use its existing `web` layout and NSIS/portable names described in [native-cpp/README.md](../native-cpp/README.md). Current inputs and artifact sizes are listed in [cross-platform-inventory.md](cross-platform-inventory.md).

The existing Visual Studio C++ tools, Node.js and WebView2 are used by the Windows build. npm can be invoked as `npm.cmd` when PowerShell script execution is restricted. The local tool installation does not modify the user's PATH.

To recreate these local tools, download the official Rust installer, set `RUSTUP_HOME` to the workspace `.tmp\rustup` directory and `CARGO_HOME` to `.tmp\cargo`, then run the installer with `-y --no-modify-path --profile minimal --default-toolchain stable`. Run `npm.cmd install --prefix .tmp\tauri-tools --no-save --no-package-lock @tauri-apps/cli@2.12.6` from the repository root.

The GitHub Actions workflow `cross-platform-toolchains.yml` prepares Rust, Node, Tauri and native SDK dependencies on Windows, Ubuntu and macOS. It stages the shared application assets, checks the bridge fixtures, compile-checks and tests the native host, builds a native package, verifies the expected package file exists, and uploads unsigned CI artifacts for review. It does not publish releases. The host provides document and preference services, document-scoped local images, external links, a macOS native print hook, and a queue for file-open events. Native GUI checks on macOS and Ubuntu have produced readable PDFs; broader release verification is still required. The native cross-platform host is experimental; the release gates in `CROSS_PLATFORM_PLAN.md` have not yet been met.

The `markdown-vision-webview-reference` workspace package is a minimal Tao/Wry host for the T2 performance comparison. It loads the same unmodified renderer files from a local frontend directory and accepts an optional startup Markdown file:

```sh
cargo run --release --locked --manifest-path native-tauri/Cargo.toml \
  --package markdown-vision-webview-reference -- src/web tests/fixtures/Markdown-total-torture-test.md
```

The cross-platform toolchain workflow builds this reference on macOS and Linux. On Linux it currently uses Tao's X11 WebView path, so measure it in an X11 session and compare only against the Tauri build on the same machine, with the same frontend files and startup document. It has no production filesystem bridge or package metadata and is not a release candidate. Cold-start, process-tree memory, and equivalent package-size measurements remain to be collected.

An unsigned debug macOS application bundle was built on Apple Silicon using `tools/check-tauri-mac.sh`. Interactive checks covered opening a document, saving a new document, printing to the system dialog, editing, undo, redo, and unsaved-change prompts. A signed and notarized build and a clean-machine Gatekeeper check are still required.

For a Linux development machine, install the Debian/Ubuntu dependencies listed in the workflow, then install Rust and Node. A graphical desktop session and WebKitGTK 4.1 are needed to exercise the app. For macOS, use a Mac with Xcode or the Xcode Command Line Tools, Rust and Node. Building a DMG requires macOS. Distribution with Developer ID signing and notarization additionally requires Apple credentials configured as protected CI secrets.

The Linux package workflows target Ubuntu 24.04 x86-64 and ARM64 runners and Fedora 44 containers on matching native x86-64 and ARM64 runners. Ubuntu builds DEB packages for both architectures and an x86-64 AppImage candidate; Fedora builds RPMs for both architectures. The DEB declares `libwebkit2gtk-4.1-0`, `libgtk-3-0`, `zenity`, and `xdg-utils`; the RPM declares `webkit2gtk4.1`, `gtk3`, `zenity`, and `xdg-utils`. Each lane installs its native package and runs the desktop lifecycle script under Xvfb and D-Bus. The x86-64 AppImage receives a launch smoke test. The workflows record OS, kernel, architecture, Rust, Cargo, Node, Tauri CLI, WebKitGTK, package sizes, and hashes, then upload candidates and evidence as GitHub Actions artifacts. This matrix is configured but must pass on GitHub before it is considered build evidence; CI artifacts are not published releases. Fedora/Ubuntu compatibility outside these exact build images and AppImage compatibility remain unverified. The single-instance plugin uses the desktop session D-Bus to forward later file-open requests.

The manually triggered `macos-signed-build.yml` job is intended for a protected `macos-signing` GitHub environment. Configure environment protection in GitHub and provide `APPLE_CERTIFICATE` (base64-encoded Developer ID Application `.p12`), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` (an app-specific password), and `APPLE_TEAM_ID` as environment secrets. The job imports the certificate into a temporary keychain, builds a universal DMG, verifies both architectures, signing and stapling, and uploads an artifact; it does not publish a release. It cannot be considered validated until run with valid credentials and checked on a clean Mac.

Reference: [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) and [GitHub Actions guidance](https://v2.tauri.app/distribute/pipelines/github/).
