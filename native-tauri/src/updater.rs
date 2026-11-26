#[tauri::command]
pub async fn install_linux_update(version: String, digest: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || install(&version, &digest))
        .await.map_err(|_| "The update process failed.".to_string())?
}

#[tauri::command]
pub fn restart_after_update(app: tauri::AppHandle, state: tauri::State<'_, std::sync::Mutex<crate::document::Documents>>, document_id: Option<String>) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let documents = state.lock().map_err(|_| "Could not restore the open document.")?;
        let path = crate::document::current_path(&documents, document_id.as_deref());
        drop(documents);
        let mut command = std::process::Command::new("/bin/sh");
        command.args(["-c", "while kill -0 \"$1\" 2>/dev/null; do sleep 0.2; done; shift; exec \"$@\"", "markdown-vision-restart"])
            .arg(std::process::id().to_string()).arg("/usr/bin/markdown-vision");
        if let Some(path) = path { command.arg(path); }
        command.spawn().map_err(|_| "Could not restart Markdown Vision.")?;
        app.exit(0);
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = (app, state, document_id); Err("Restart is not available on this platform.".into()) }
}

#[cfg(target_os = "linux")]
fn install(version: &str, digest: &str) -> Result<(), String> {
    use std::process::Command;
    let valid_version = version.split('.').count() == 3 && version.split('.').all(|part|
        !part.is_empty() && part.len() <= 9 && part.bytes().all(|c| c.is_ascii_digit()));
    if !valid_version || digest.len() != 64 || !digest.bytes().all(|c| c.is_ascii_hexdigit()) {
        return Err("The update information is invalid.".into());
    }
    if std::env::var_os("APPIMAGE").is_some() {
        return Err("Automatic updates require the installed DEB package.".into());
    }
    let arch = match std::env::consts::ARCH {
        "x86_64" => ("x86_64", "amd64"),
        "aarch64" => ("aarch64", "arm64"),
        _ => return Err("This architecture is not supported.".into()),
    };
    let installed = Command::new("dpkg-query").args(["-W", "-f=${Status}\n${Version}", "markdown-vision"])
        .output().map_err(|_| "The Debian package manager is unavailable.")?;
    let installed_text = String::from_utf8_lossy(&installed.stdout);
    let mut lines = installed_text.lines();
    if !installed.status.success() || lines.next() != Some("install ok installed") {
        return Err("Markdown Vision is not installed as a DEB package.".into());
    }
    let current = lines.next().ok_or("Could not determine the installed version.")?;
    if !Command::new("dpkg").args(["--compare-versions", version, "gt", current])
        .status().map_err(|_| "Could not compare package versions.")?.success() {
        return Err("This update is not newer than the installed package.".into());
    }
    let dir = tempfile::tempdir().map_err(|_| "Could not create a temporary download folder.")?;
    let package = dir.path().join("markdown-vision-update.deb");
    let url = format!("https://github.com/wmarklloyd/Markdown-Vision/releases/download/v{version}/Markdown-Vision-{version}-ubuntu-{}.deb", arch.0);
    let downloaded = Command::new("curl").args(["--fail", "--silent", "--show-error", "--location", "--proto", "=https", "--proto-redir", "=https", "--max-time", "300", "--output"])
        .arg(&package).arg(url).status().map_err(|_| "Could not start the download.")?;
    if !downloaded.success() { return Err("The update could not be downloaded.".into()); }
    let hash = Command::new("sha256sum").arg(&package).output().map_err(|_| "Could not verify the update.")?;
    if !hash.status.success() || String::from_utf8_lossy(&hash.stdout).split_whitespace().next()
        .map(|actual| !actual.eq_ignore_ascii_case(digest)).unwrap_or(true) {
        return Err("The downloaded update failed verification.".into());
    }
    for (field, expected) in [("Package", "markdown-vision"), ("Version", version), ("Architecture", arch.1)] {
        let output = Command::new("dpkg-deb").arg("--field").arg(&package).arg(field)
            .output().map_err(|_| "Could not inspect the update package.")?;
        if !output.status.success() || String::from_utf8_lossy(&output.stdout).trim() != expected {
            return Err("The downloaded package has unexpected metadata.".into());
        }
    }
    let status = Command::new("pkexec").args(["/usr/bin/apt-get", "install", "-y", "--"])
        .arg(&package).status().map_err(|_| "Could not start the system installer.")?;
    if !status.success() { return Err("Installation was cancelled or failed. Please try again.".into()); }
    Ok(())
}

#[cfg(not(target_os = "linux"))]
fn install(_version: &str, _digest: &str) -> Result<(), String> {
    Err("Automatic DEB updates are only available on Linux.".into())
}
