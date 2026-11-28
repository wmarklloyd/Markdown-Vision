# Linux distribution strategy

## Recommendation

Use one signed GitHub release tag as the version and source of truth, then fan that exact source revision out through separate package channels. Do not try to make one Linux binary work as every package type: `.deb`, RPM, Flatpak, Snap, AppImage, and AUR have different dependency models, review rules, and publishing credentials.

The configured candidate matrix uses native Ubuntu 24.04 x86-64/ARM64 runners for DEB packages and AppImages, plus Fedora 44 x86-64/ARM64 containers on matching native runners for RPMs. AppImages must be built on their target architecture because Tauri's linuxdeploy tooling does not cross-compile them. These targets remain validation candidates until GitHub builds, launches, and GUI lifecycle checks pass; do not advertise architectures or distro ranges from configuration alone. Snap and Flatpak need their own packaging manifests. [Tauri Linux distribution formats](https://v2.tauri.app/distribute/)

## Channels to cover

| User ecosystem | Channel | How updates should work | Notes |
| --- | --- | --- | --- |
| Ubuntu/Debian `apt` | Versioned `.deb` attached to GitHub Releases first; then a Launchpad PPA for Ubuntu and/or an OBS-hosted APT repository for the tested Debian/Ubuntu range | Release workflow builds and verifies the DEB; the chosen repository builder publishes signed metadata after approval | Keep the current `markdown-vision` package ID and declared WebKitGTK/GTK/zenity/xdg-utils dependencies. Build on the oldest supported system that supplies WebKitGTK 4.1. Tauri identifies Ubuntu 22.04 and Debian 12 as suitable baselines. [Tauri Debian guidance](https://v2.tauri.app/distribute/debian/) · [Ubuntu PPAs](https://documentation.ubuntu.com/launchpad/user/get-started/) |
| Fedora/RHEL-family `dnf` | RPM on GitHub Releases first; then Fedora COPR or OBS | Build RPMs in the target distro builders; publish to a testing repository, then promote | RPM packaging and dependencies must be validated on each selected Fedora/RHEL-family release. COPR is a third-party repo; official Fedora packaging is a separate review and maintenance commitment. [COPR documentation](https://docs.copr.fedorainfracloud.org/) |
| openSUSE `zypper` | OBS repository | Have OBS build the same packaging source for selected Leap and Tumbleweed targets | OBS can build and distribute packages from source across several Linux distributions. Use explicit target repositories and architectures rather than claiming generic compatibility. [Open Build Service](https://build.opensuse.org/) |
| Desktop app stores | Flathub Flatpak | Submit the app once; maintain its manifest in the Flathub app repository. Updates create a tested PR and a maintainer merges it | Flathub builds the app from its manifest/source; do not upload built binaries into the app repository. Current Flathub policy bars AI-generated/assisted manifest content and AI-agent submission PRs, so the project maintainer must author and submit that work. [Flathub requirements](https://docs.flathub.org/docs/for-app-authors/requirements/) · [Flathub updates](https://docs.flathub.org/docs/for-app-authors/maintenance/) |
| Snap-capable systems | Snap Store | Build from the tagged source, upload to an edge/candidate channel, smoke-test, then promote to stable | Register the snap name and protect the store credential. Snapcraft supports GitHub Actions and store publishing, but stable promotion should be separately gated. [Snap publishing](https://snapcraft.io/docs/releasing-your-app/) |
| Arch `pacman` users | AUR source recipe (`PKGBUILD`), not a binary package | Generate a version/hash update from the release; maintainer reviews and pushes the recipe and `.SRCINFO` | AUR stores build recipes and users build locally. It is community-maintained, not an official Arch binary repository. [AUR submission guidelines](https://wiki.archlinux.org/title/AUR_submission_guidelines) |
| Users who want a portable download | AppImage on GitHub Releases | Publish alongside other direct downloads; optionally embed AppImageUpdate metadata after evaluating its trust and update behavior | AppImage is a portable format, not an `apt`/`dnf` repository. Tauri notes that it may be substantially larger than a system-dependent package and still has a glibc baseline. [Tauri AppImage guidance](https://v2.tauri.app/distribute/appimage/) · [AppImage distribution](https://docs.appimage.org/packaging-guide/distribution.html) |

Do not start by uploading directly to the official Debian or Fedora archives. Debian uploads require an authorized maintainer or sponsor and signed source-package workflow; official Fedora packages have their own review and maintenance process. Start with GitHub Releases, OBS/COPR, Flathub, Snap Store, and AUR, then pursue official distribution archives if the project has an ongoing maintainer for them. [Debian maintainer and upload process](https://www.debian.org/doc/manuals/developers-reference/ch05.en) · [Debian package maintainer responsibilities](https://www.debian.org/doc/debian-policy/ch-binary)

## Identity and packaging gates

- **Settle the Flatpak application ID before submission.** The Tauri identifier is currently `com.markdownvision.desktop`. Flathub requires a reverse-DNS ID tied to a domain the project controls, or an ID matching its code-hosting identity. Confirm the project's proof-of-control path and the exact ID before preparing the human-authored manifest; do not assume the existing Tauri identifier will be accepted. Flathub IDs are long-lived and renames require resubmission. [Flathub ID rules](https://docs.flathub.org/docs/for-app-authors/requirements/#application-id)
- **Plan Flatpak as a source build.** Flathub disables network access during builds and expects sources/dependencies to be explicitly declared. The Tauri Rust and JavaScript dependency trees must be made available through lockfiles and the appropriate Flatpak dependency manifests; a normal online `cargo build` recipe will not be enough. Use portal-based file access and keep sandbox permissions minimal. [Flathub requirements](https://docs.flathub.org/docs/for-app-authors/requirements/)
- **Declare only tested Flatpak architectures.** Flathub builds both x86-64 and ARM64 by default. Until the ARM64 app is built and GUI-tested, the Flatpak submission should explicitly limit its architecture metadata to x86-64. [Flathub architecture requirements](https://docs.flathub.org/docs/for-app-authors/requirements/#flathubjson)
- **Keep Snap confined.** Use strict confinement and the smallest interface set that supports file open/save, desktop launch, and printing. Validate those behaviors inside the actual Snap before promoting it; do not solve a missing permission by defaulting to classic confinement.
- **Keep distro package identity stable.** Preserve the `markdown-vision` package name, desktop ID, MIME types, and preference directory across DEB/RPM updates. Use distro-specific release suffixes only for packaging rebuilds; keep the app's upstream version the same as the Git tag.

## One-tag release pipeline

1. **Cut one version.** The maintainer pushes a signed `vX.Y.Z` tag only after the version checker confirms `native-tauri/tauri.conf.json`, `native-tauri/Cargo.toml`, and any package metadata agree. The tag points to one source commit; downstream jobs must not build from a moving branch or `latest` URL.
2. **Build once per supported target.** Build the native Tauri host on pinned Linux baselines and native architecture runners. Produce DEB, RPM, and AppImage outputs from the same tag. Build Flatpak and Snap from that source tag using their own manifests/build services. Create normalized GitHub asset names by OS, architecture, and format; do not depend on Tauri's generated filename containing the display name.
3. **Run package-specific gates.** Inspect metadata and dependencies; install and launch each package on the oldest and newest declared distributions; verify file associations, desktop launch, printing, open/save, and upgrade behavior. Check AppImage on its claimed baseline. Check Flatpak permissions and portal behavior, and Snap confinement plus file-open behavior. Test architectures independently.
4. **Make a release candidate.** Publish candidate artifacts to GitHub prerelease assets and testing channels first. Generate SHA-256 checksums, an SPDX SBOM, and GitHub build provenance attestations. GitHub documents attestations for binary/package provenance; the workflow needs narrowly scoped permissions and should only attest release builds, not ordinary PR builds. [GitHub artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)
5. **Fan out updates.** A tag-triggered packaging workflow updates the version, source URL, and hash in each downstream manifest. It opens an update PR for channels that require review and submits to staging channels where automated publishing is supported. Keep each destination independent so a delay or rejection in one store does not invalidate the GitHub release or another package.
6. **Promote deliberately.** After the package gates pass, a protected GitHub environment allows the maintainer to promote Snap to stable and publish repository metadata for OBS/COPR. Merge the tested Flathub update PR and reviewed AUR change. Record each destination as `published`, `awaiting review`, `failed`, or `deferred`; never show a single green “all Linux stores updated” state while a required channel is pending.

## Repository layout and automation

Keep package definitions under `packaging/linux/` in the main repository:

```text
packaging/linux/
  README.md
  deb/                  # only if Tauri defaults need a maintained override
  rpm/markdown-vision.spec
  flatpak/              # source manifest template; live Flathub repo remains separate
  snap/snapcraft.yaml
  appimage/             # update metadata/configuration if enabled
  arch/PKGBUILD

docs/linux-release-targets.json # machine-readable artifact/channel map used by CI
```

Use a checked-in artifact map to make the workflow fail if a required package is missing. Keep one canonical version and derive each ecosystem's package revision from it. The updater should generate diffs/PRs for external packaging repositories; it should not silently overwrite their branches. Pin sources to the release tag and verify the SHA-256 before building. Do not put store tokens in pull-request jobs. GitHub recommends least-privilege workflow permissions and protected environments for deployment secrets. [GitHub Actions secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use)

### Suggested update flow

```text
signed vX.Y.Z tag
       |
       +--> test matrix --> DEB / RPM / AppImage --> GitHub prerelease + checksums + provenance
       |                                             |
       |                                             +--> OBS/COPR staging --> protected promotion
       +--> Flatpak source manifest --> Flathub update PR --> tested build --> maintainer merge
       +--> Snap source manifest --> edge/candidate --> smoke test --> protected stable promotion
       +--> AUR PKGBUILD + .SRCINFO update --> maintainer review and push
```

GitHub is the canonical release and fallback download. Distribution channels can publish at different times because their review queues and builders are independent; a failed or delayed channel should be visible and retryable without rebuilding a different version.

## Rollout order

### Stage 1: dependable GitHub release

- Run the Ubuntu 24.04 x86-64/ARM64 and Fedora 44 x86-64/ARM64 candidate workflows. They install and exercise native DEB/RPM packages in virtual desktops; both Ubuntu AppImages receive launch smoke tests on matching native runners.
- Check the generated package dependencies, architecture, file association, desktop entry, sizes, and hashes. Keep CI artifacts separate from GitHub Releases until the full matrix succeeds.
- Add AppImage clean-install/update checks and complete the DEB upgrade test.
- Add a release artifact map, checksums, and verified provenance before creating public package links.
- Do not promise either architecture until its package and GUI checks pass on its native runner and clean supported systems.

### Stage 2: mainstream store and repository channels

- Submit the Flatpak app and establish its Flathub repository/maintainer access.
- Register the Snap name, configure a protected publishing environment, and verify edge-to-stable promotion.
- Stand up an OBS project for RPM and selected Debian/Ubuntu repositories, or COPR for Fedora if that is the sole RPM target initially.
- Add a Launchpad PPA if an Ubuntu-managed `apt install`/upgrade channel is desired; Launchpad builds uploaded source packages for the PPA rather than hosting an arbitrary binary upload. [Ubuntu package development](https://documentation.ubuntu.com/project/contributors/setup/set-up-for-ubuntu-development/)
- Keep GitHub direct downloads available as the common fallback.

### Stage 3: community and official archives

- Publish a source-based AUR recipe and maintain its `.SRCINFO` with each version.
- Add more OBS targets only after package installation/runtime passes on those distributions.
- Decide separately whether Debian official archive sponsorship or official Fedora packaging is worth the long-term maintainer commitment.
- Add ARM64 to each channel only after builds and GUI checks exist for that format and target.

## Completion criteria

- One release tag produces a complete, checksummed, provenance-attested asset set for every required direct-download format.
- Each required store/repository is either updated successfully or has a visible review/deferred status with an owner.
- Clean-install and upgrade tests pass for every distro version advertised as supported.
- Version, architecture, MIME association, dependencies, desktop entry, and signature/checksum are checked automatically.
- Store credentials are isolated by destination and stable publication requires protected approval.
