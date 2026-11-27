#[tauri::command]
pub fn is_markdown_default() -> Result<bool, String> {
    #[cfg(target_os = "linux")]
    return linux::is_default();

    #[cfg(target_os = "macos")]
    return macos::is_default();

    #[cfg(not(any(target_os = "linux", target_os = "macos")))]
    Ok(false)
}

#[tauri::command]
pub async fn associate_markdown() -> Result<(), String> {
    #[cfg(target_os = "linux")]
    return linux::set_default();

    #[cfg(target_os = "macos")]
    return macos::set_default().await;

    #[cfg(not(any(target_os = "linux", target_os = "macos")))]
    Err("Markdown file association is unavailable on this platform.".into())
}

#[cfg(target_os = "linux")]
mod linux {
    use std::{env, fs, path::{Path, PathBuf}, process::Command};

    fn first_exec_argument(line: &str) -> Option<String> {
        let mut chars = line.chars().peekable();
        while matches!(chars.peek(), Some(' ' | '\t')) { chars.next(); }
        let mut argument = String::new();
        let mut quoted = false;
        while let Some(character) = chars.next() {
            match character {
                '"' => quoted = !quoted,
                '\\' if quoted => {
                    if let Some(escaped) = chars.next() { argument.push(escaped); }
                }
                ' ' | '\t' if !quoted => break,
                value => argument.push(value),
            }
        }
        (!argument.is_empty()).then_some(argument)
    }

    fn user_applications_dir() -> Option<PathBuf> {
        env::var_os("XDG_DATA_HOME").map(PathBuf::from)
            .or_else(|| env::var_os("HOME").map(|home| PathBuf::from(home).join(".local/share")))
            .map(|data_home| data_home.join("applications"))
    }

    fn desktop_id() -> Option<String> {
        let executable = env::current_exe().ok()?;
        let executable_name = executable.file_name()?.to_string_lossy().to_lowercase();
        let appimage = env::var_os("APPIMAGE").and_then(|image| PathBuf::from(image).canonicalize().ok());
        let mut directories = Vec::new();
        if let Some(data_home) = env::var_os("XDG_DATA_HOME") {
            directories.push(PathBuf::from(data_home).join("applications"));
        } else if let Some(home) = env::var_os("HOME") {
            directories.push(PathBuf::from(home).join(".local/share/applications"));
        }
        let data_dirs = env::var_os("XDG_DATA_DIRS")
            .map(|value| value.to_string_lossy().into_owned())
            .unwrap_or_else(|| "/usr/local/share:/usr/share".into());
        directories.extend(env::split_paths(&data_dirs).map(|path| path.join("applications")));

        for directory in directories {
            let Ok(entries) = fs::read_dir(directory) else { continue };
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().is_none_or(|extension| extension != "desktop") { continue; }
                let Ok(contents) = fs::read_to_string(&path) else { continue };
                let exec = contents.lines().find_map(|line| line.strip_prefix("Exec="));
                let Some(command) = exec.and_then(first_exec_argument) else { continue };
                let command_path = Path::new(&command);
                let same_appimage = appimage.as_ref().is_some_and(|image| {
                    command_path.canonicalize().ok().as_ref() == Some(image)
                });
                let command_name = command_path.file_name()
                    .map(|name| name.to_string_lossy().to_lowercase());
                let matches_current_app = if appimage.is_some() {
                    same_appimage
                } else {
                    command_name.as_deref() == Some(executable_name.as_str())
                };
                if matches_current_app {
                    return path.file_name().map(|name| name.to_string_lossy().into_owned());
                }
            }
        }
        None
    }

    fn appimage_desktop_id() -> Result<Option<String>, String> {
        let Some(image) = env::var_os("APPIMAGE") else { return Ok(None) };
        let image = PathBuf::from(image).canonicalize()
            .map_err(|_| "Could not locate the AppImage file.".to_string())?;
        let applications = user_applications_dir()
            .ok_or_else(|| "Could not locate the user applications folder.".to_string())?;
        let id = "markdown-vision-appimage.desktop";
        let path = applications.join(id);
        if let Ok(existing) = fs::read_to_string(&path) {
            if existing.contains(&image.to_string_lossy().to_string()) { return Ok(Some(id.into())); }
            return Err("A different launcher already uses Markdown Vision's AppImage association.".into());
        }
        if image.to_string_lossy().contains('\n') || image.to_string_lossy().contains('\r') {
            return Err("The AppImage path cannot be used in a desktop launcher.".into());
        }
        let quoted = image.to_string_lossy().replace('\\', "\\\\")
            .replace('"', "\\\"").replace('$', "\\$").replace('`', "\\`");
        fs::create_dir_all(&applications).map_err(|_| "Could not create the user applications folder.".to_string())?;
        let launcher = format!(
            "[Desktop Entry]\nType=Application\nName=Markdown Vision\nExec=\"{quoted}\" %F\nTerminal=false\nMimeType=text/markdown;\n"
        );
        fs::write(path, launcher).map_err(|_| "Could not register the AppImage desktop launcher.".to_string())?;
        Ok(Some(id.into()))
    }

    fn current_default() -> Result<String, String> {
        let output = Command::new("xdg-mime").args(["query", "default", "text/markdown"])
            .output().map_err(|_| "The desktop file association tool is unavailable.".to_string())?;
        if !output.status.success() {
            return Err("Could not query the current Markdown file association.".into());
        }
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }

    pub fn is_default() -> Result<bool, String> {
        let Some(id) = desktop_id() else { return Ok(false) };
        Ok(current_default()? == id)
    }

    pub fn set_default() -> Result<(), String> {
        let id = match desktop_id() {
            Some(id) => id,
            None => appimage_desktop_id()?.ok_or_else(|| "Markdown Vision's desktop launcher could not be found.".to_string())?,
        };
        if current_default()? == id { return Ok(()); }
        let status = Command::new("xdg-mime").arg("default").arg(&id).arg("text/markdown")
            .status().map_err(|_| "Could not start the desktop file association tool.".to_string())?;
        if !status.success() || current_default()? != id {
            return Err("The desktop environment did not set Markdown Vision as the default for Markdown files.".into());
        }
        Ok(())
    }
}

#[cfg(target_os = "macos")]
mod macos {
    use block2::RcBlock;
    use objc2_app_kit::NSWorkspace;
    use objc2_foundation::{NSBundle, NSString};
    use objc2_uniform_type_identifiers::UTType;
    use std::{sync::mpsc, time::Duration};

    fn markdown_type() -> Result<objc2::rc::Retained<UTType>, String> {
        let extension = NSString::from_str("md");
        UTType::typeWithFilenameExtension(&extension)
            .ok_or_else(|| "macOS could not identify Markdown files.".into())
    }

    pub fn is_default() -> Result<bool, String> {
        let content_type = markdown_type()?;
        let app_url = NSBundle::mainBundle().bundleURL();
        let current = NSWorkspace::sharedWorkspace().URLForApplicationToOpenContentType(&content_type);
        Ok(current.is_some_and(|url| url.isEqual(&app_url)))
    }

    pub async fn set_default() -> Result<(), String> {
        let content_type = markdown_type()?;
        let app_url = NSBundle::mainBundle().bundleURL();
        let (sender, receiver) = mpsc::channel();
        let completion = RcBlock::new(move |error: *mut objc2_foundation::NSError| {
            let _ = sender.send(error.is_null());
        });
        NSWorkspace::sharedWorkspace().setDefaultApplicationAtURL_toOpenContentType_completionHandler(
            &app_url, &content_type, Some(&completion),
        );
        let result = tauri::async_runtime::spawn_blocking(move || receiver.recv_timeout(Duration::from_secs(180)))
            .await
            .map_err(|_| "macOS could not complete the Markdown file association request.".to_string())?;
        match result {
            Ok(true) => Ok(()),
            Ok(false) => Err("macOS could not set Markdown Vision as the default Markdown app.".into()),
            Err(_) => Err("macOS did not complete the Markdown file association request.".into()),
        }
    }
}
