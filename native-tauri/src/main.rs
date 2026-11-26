#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
mod updater;
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};

fn main() {
    let builder = tauri::Builder::default();
    #[cfg(target_os = "linux")]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
        let base = std::path::Path::new(&cwd);
        let state = app.state::<std::sync::Mutex<document::Documents>>();
        if let Ok(mut documents) = state.lock() {
            document::queue_arguments(&mut documents, args.into_iter().skip(1).map(std::ffi::OsString::from), base);
        }
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
            let _ = window.eval("window.__markdownVisionProcessOpenQueue?.()");
        }
    }));
    builder
        .setup(|app| {
            let config = &app.config().app.windows[0];
            let window = tauri::WebviewWindowBuilder::from_config(app, config)?
                .on_navigation(|url| {
                    let local = (url.scheme() == "tauri" && url.host_str() == Some("localhost"))
                        || (matches!(url.scheme(), "http" | "https") && url.host_str() == Some("tauri.localhost"));
                    if !local && matches!(url.scheme(), "http" | "https" | "mailto") {
                        let _ = open::that(url.as_str());
                    }
                    local
                })
                .on_new_window(|url, _| {
                    if matches!(url.scheme(), "http" | "https" | "mailto") {
                        let _ = open::that(url.as_str());
                    }
                    tauri::webview::NewWindowResponse::Deny
                })
                .on_document_title_changed(|window, title| {
                    let _ = window.set_title(&title);
                })
                .build()?;
            let close_window = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = close_window.eval("window.__markdownVisionRequestClose?.()");
                }
            });

            // Route native menu commands back through the same renderer
            // handlers used by the toolbar and keyboard shortcuts. In
            // particular, Close and Quit must pass through the unsaved-change
            // prompt instead of letting the native menu destroy the window.
            let open = MenuItemBuilder::with_id("file-open", "Open…")
                .accelerator("CmdOrCtrl+O").build(app)?;
            let new = MenuItemBuilder::with_id("file-new", "New")
                .accelerator("CmdOrCtrl+N").build(app)?;
            let save = MenuItemBuilder::with_id("file-save", "Save")
                .accelerator("CmdOrCtrl+S").build(app)?;
            let save_as = MenuItemBuilder::with_id("file-save-as", "Save As…")
                .accelerator("CmdOrCtrl+Shift+S").build(app)?;
            let print = MenuItemBuilder::with_id("file-print", "Print…")
                .accelerator("CmdOrCtrl+P").build(app)?;
            let close = MenuItemBuilder::with_id("file-close", "Close")
                .accelerator("CmdOrCtrl+W").build(app)?;
            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&new).item(&open).separator().item(&save).item(&save_as)
                .separator().item(&print).separator().item(&close).build()?;

            #[cfg(target_os = "macos")]
            let menu = {
                let about = MenuItemBuilder::with_id("app-about", "About Markdown Vision…").build(app)?;
                let quit = MenuItemBuilder::with_id("app-quit", "Quit Markdown Vision")
                    .accelerator("CmdOrCtrl+Q").build(app)?;
                let app_menu = SubmenuBuilder::new(app, "Markdown Vision")
                    .item(&about).separator().item(&quit).build()?;
                MenuBuilder::new(app).items(&[&app_menu, &file_menu]).build()?
            };
            #[cfg(not(target_os = "macos"))]
            let menu = {
                let about = MenuItemBuilder::with_id("app-about", "About Markdown Vision").build(app)?;
                let quit = MenuItemBuilder::with_id("app-quit", "Quit")
                    .accelerator("Ctrl+Q").build(app)?;
                let help_menu = SubmenuBuilder::new(app, "Help")
                    .item(&about).separator().item(&quit).build()?;
                MenuBuilder::new(app).items(&[&file_menu, &help_menu]).build()?
            };
            app.set_menu(menu)?;
            app.on_menu_event(|app, event| {
                let action = match event.id().as_ref() {
                    "file-new" => "new",
                    "file-open" => "open",
                    "file-save" => "save",
                    "file-save-as" => "saveAs",
                    "file-print" => "print",
                    "file-close" => "close",
                    "app-quit" => "quit",
                    "app-about" => "about",
                    _ => return,
                };
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.eval(&format!(
                        "window.__markdownVisionDispatchMenuCommand?.({action:?})"
                    ));
                }
            });
            Ok(())
        })
        .manage(std::sync::Mutex::new(document::Documents::default()))
        .register_uri_scheme_protocol("mvimage", |context, request| {
            let state = context.app_handle().state::<std::sync::Mutex<document::Documents>>();
            let result = state.lock().ok().and_then(|documents| document::read_image(&documents, request.uri().path()));
            match result {
                Some((mime, bytes)) => tauri::http::Response::builder()
                    .header("Content-Type", mime)
                    .header("X-Content-Type-Options", "nosniff")
                    .header("Cache-Control", "no-store")
                    .body(bytes).unwrap(),
                None => tauri::http::Response::builder().status(404).body(Vec::new()).unwrap(),
            }
        })
        .invoke_handler(tauri::generate_handler![platform_info, list_system_fonts, updater::install_linux_update, updater::restart_after_update, document::initial_document, document::open_document, document::save_document, document::has_pending_document, document::pending_document, preferences::get_preferences, preferences::save_preferences, confirm_discard, show_open_error, print_document, close_window, quit_application])
        .build(tauri::generate_context!())
        .expect("failed to build Markdown Vision")
        .run(|_app, _event| {
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Opened { urls } = _event {
                let state = _app.state::<std::sync::Mutex<document::Documents>>();
                if let Ok(mut documents) = state.lock() {
                    for url in urls {
                        if let Ok(path) = url.to_file_path() {
                            document::queue_open(&mut documents, path);
                        }
                    }
                }
                if let Some(window) = _app.get_webview_window("main") {
                    let _ = window.eval("window.__markdownVisionProcessOpenQueue?.()");
                }
            }
        });
}

#[tauri::command]
fn list_system_fonts() -> Result<Vec<String>, String> {
    #[cfg(target_os = "linux")]
    {
        let output = std::process::Command::new("fc-list")
            .args(["--format", "%{family}\n"])
            .output().map_err(|error| error.to_string())?;
        if !output.status.success() {
            return Err("Could not enumerate system fonts".into());
        }
        let text = String::from_utf8_lossy(&output.stdout);
        let mut fonts: Vec<String> = text.lines().flat_map(|line| line.split(','))
            .map(str::trim).filter(|name| !name.is_empty())
            .map(str::to_owned).collect();
        fonts.sort();
        fonts.dedup();
        Ok(fonts)
    }
    #[cfg(target_os = "macos")]
    return macos_fonts::list();
    #[cfg(not(any(target_os = "linux", target_os = "macos")))]
    Ok(Vec::new())
}

// Core Text returns the font families currently available to this process,
// including enabled user fonts, without depending on a shell utility.
#[cfg(target_os = "macos")]
mod macos_fonts {
    use std::ffi::{c_char, c_void, CStr};

    type CFRef = *const c_void;
    #[link(name = "CoreText", kind = "framework")]
    extern "C" {
        fn CTFontManagerCopyAvailableFontFamilyNames() -> CFRef;
    }
    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        fn CFArrayGetCount(array: CFRef) -> isize;
        fn CFArrayGetValueAtIndex(array: CFRef, index: isize) -> CFRef;
        fn CFStringGetLength(string: CFRef) -> isize;
        fn CFStringGetMaximumSizeForEncoding(length: isize, encoding: u32) -> isize;
        fn CFStringGetCString(string: CFRef, buffer: *mut c_char, size: isize, encoding: u32) -> u8;
        fn CFRelease(value: CFRef);
    }
    const UTF8: u32 = 0x0800_0100;

    pub fn list() -> Result<Vec<String>, String> {
        unsafe {
            let array = CTFontManagerCopyAvailableFontFamilyNames();
            if array.is_null() { return Err("Could not enumerate system fonts".into()); }
            let mut fonts = Vec::new();
            for index in 0..CFArrayGetCount(array) {
                let name = CFArrayGetValueAtIndex(array, index);
                if name.is_null() { continue; }
                let max = CFStringGetMaximumSizeForEncoding(CFStringGetLength(name), UTF8);
                let Some(size) = max.checked_add(1).and_then(|n| usize::try_from(n).ok()) else { continue; };
                let mut buffer = vec![0u8; size];
                if CFStringGetCString(name, buffer.as_mut_ptr().cast(), size as isize, UTF8) != 0 {
                    if let Ok(value) = CStr::from_ptr(buffer.as_ptr().cast()).to_str() {
                        let value = value.trim();
                        if !value.is_empty() { fonts.push(value.to_owned()); }
                    }
                }
            }
            CFRelease(array);
            fonts.sort();
            fonts.dedup();
            if fonts.is_empty() { Err("No system fonts found".into()) } else { Ok(fonts) }
        }
    }
}

#[tauri::command]
fn platform_info() -> serde_json::Value {
    #[cfg(target_os = "macos")]
    let platform = "macos";
    #[cfg(target_os = "linux")]
    let platform = "linux";
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    let platform = "unknown";

    #[cfg(target_os = "linux")]
    let distribution = std::fs::read_to_string("/etc/os-release")
        .ok()
        .and_then(|contents| {
            contents
                .lines()
                .find_map(|line| line.strip_prefix("ID="))
                .map(str::to_owned)
        })
        .map(|id| id.trim_matches('"').to_ascii_lowercase())
        .unwrap_or_default();
    #[cfg(not(target_os = "linux"))]
    let distribution = String::new();

    serde_json::json!({
        "platform": platform,
        "architecture": std::env::consts::ARCH,
        "distribution": distribution,
    })
}

#[tauri::command]
fn show_open_error(window: tauri::WebviewWindow, message: &str) {
    let dialog = rfd::MessageDialog::new()
        .set_title("Could not open document")
        .set_description(format!("The document could not be opened. Your current changes are still available.\n\n{message}"))
        .set_level(rfd::MessageLevel::Error)
        .set_buttons(rfd::MessageButtons::Ok);
    #[cfg(target_os = "macos")]
    let dialog = dialog.set_parent(&window);
    #[cfg(not(target_os = "macos"))]
    let _ = window;
    dialog.show();
}

#[tauri::command]
fn confirm_discard(window: tauri::WebviewWindow, action: &str) -> Result<bool, String> {
    let message = match action {
        "open" => "Discard your unsaved changes and open another document?",
        "close" => "Discard your unsaved changes and close Markdown Vision?",
        "quit" => "Discard your unsaved changes and quit Markdown Vision?",
        _ => return Err("Unknown confirmation request".into()),
    };
    // macOS assigns Escape to the second button. Zenity treats the cancel
    // button and window dismissal alike, so Discard must be its extra button.
    #[cfg(target_os = "macos")]
    let buttons = rfd::MessageButtons::YesNoCancelCustom(
        "Keep Editing".into(), "Cancel".into(), "Discard".into(),
    );
    #[cfg(not(target_os = "macos"))]
    let buttons = rfd::MessageButtons::YesNoCancelCustom(
        "Keep Editing".into(), "Discard".into(), "Cancel".into(),
    );
    let dialog = rfd::MessageDialog::new()
        .set_title("Unsaved changes")
        .set_description(message)
        .set_level(rfd::MessageLevel::Warning)
        .set_buttons(buttons);
    #[cfg(target_os = "macos")]
    let dialog = dialog.set_parent(&window);
    #[cfg(not(target_os = "macos"))]
    let _ = window;
    let result = dialog.show();
    Ok(result == rfd::MessageDialogResult::Custom("Discard".into()))
}

#[tauri::command]
fn print_document(window: tauri::WebviewWindow) -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    let result = window.print();
    #[cfg(not(target_os = "macos"))]
    let result = window.eval("window.print()");
    result.map(|_| true).map_err(|error| error.to_string())
}

#[tauri::command]
fn close_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.destroy().map_err(|error| error.to_string())
}

#[tauri::command]
fn quit_application(app: tauri::AppHandle) {
    app.exit(0);
}

mod document;
mod preferences;
