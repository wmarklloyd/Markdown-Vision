#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
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
        .invoke_handler(tauri::generate_handler![document::initial_document, document::open_document, document::save_document, document::has_pending_document, document::pending_document, preferences::get_preferences, preferences::save_preferences, confirm_discard, print_document, close_window])
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
fn confirm_discard(action: &str) -> Result<bool, String> {
    let message = match action {
        "open" => "Discard your unsaved changes and open another document?",
        "close" => "Discard your unsaved changes and close Markdown Vision?",
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
    let result = rfd::MessageDialog::new()
        .set_title("Unsaved changes")
        .set_description(message)
        .set_level(rfd::MessageLevel::Warning)
        .set_buttons(buttons)
        .show();
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

mod document;
mod preferences;
