use serde_json::{json, Value};
use std::{collections::VecDeque, fs, io::Write, path::PathBuf, sync::Mutex};
use tauri::State;

#[derive(Default)]
pub struct Documents {
    current: Option<OpenDocument>,
    sequence: u64,
    initial_consumed: bool,
    pending: VecDeque<PathBuf>,
}

pub fn current_path(documents: &Documents, document_id: Option<&str>) -> Option<PathBuf> {
    documents.current.as_ref().filter(|document| Some(document.id.as_str()) == document_id)
        .map(|document| document.path.clone())
}

struct OpenDocument {
    id: String,
    path: PathBuf,
    bytes: Vec<u8>,
    bom: bool,
    ending: &'static str,
    editable: bool,
}

fn read_document(path: PathBuf) -> Result<(OpenDocument, String), String> {
    let bytes = fs::read(&path).map_err(|_| "Markdown Vision could not read this file.")?;
    let bom = bytes.starts_with(&[0xef, 0xbb, 0xbf]);
    let body = if bom { &bytes[3..] } else { &bytes[..] };
    let text = String::from_utf8_lossy(body);
    let valid = std::str::from_utf8(body).is_ok();
    let crlf = text.matches("\r\n").count();
    let cr = text.matches('\r').count() - crlf;
    let lf = text.matches('\n').count() - crlf;
    let mixed = [crlf > 0, cr > 0, lf > 0].into_iter().filter(|v| *v).count() > 1;
    let ending = if crlf > 0 { "\r\n" } else if cr > 0 { "\r" } else { "\n" };
    let content = text.replace("\r\n", "\n").replace('\r', "\n");
    Ok((OpenDocument { id: String::new(), path, bytes, bom, ending, editable: valid && !mixed }, content))
}

fn register_document(documents: &mut Documents, mut document: OpenDocument, content: String) -> Value {
    let name = document.path.file_name().unwrap_or_default().to_string_lossy().into_owned();
    documents.sequence += 1;
    let id = documents.sequence.to_string();
    document.id.clone_from(&id);
    documents.current = Some(document);
    let scheme = if cfg!(windows) { "http://mvimage.localhost" } else { "mvimage://localhost" };
    json!({ "content": content, "name": name, "documentId": id,
        "imageBase": format!("{scheme}/{id}/") })
}

fn open_path(documents: &mut Documents, path: PathBuf) -> Result<Value, String> {
    let (document, content) = read_document(path)?;
    Ok(register_document(documents, document, content))
}

async fn read_and_register(
    state: &Mutex<Documents>, path: PathBuf, sequence: u64,
) -> Result<Option<Value>, String> {
    // Slow reads and text decoding must not run on the desktop event loop or
    // hold the lock needed by open requests from the operating system.
    let (document, content) = tauri::async_runtime::spawn_blocking(move || read_document(path))
        .await.map_err(|_| "Markdown Vision could not read this file.".to_string())??;
    let mut documents = state.lock().map_err(|error| error.to_string())?;
    if documents.sequence != sequence { return Ok(None); }
    Ok(Some(register_document(&mut documents, document, content)))
}

pub fn read_image(documents: &Documents, request_path: &str) -> Option<(&'static str, Vec<u8>)> {
    let (id, encoded_path) = request_path.strip_prefix('/')?.split_once('/')?;
    let current = documents.current.as_ref().filter(|document| document.id == id)?;
    let decoded = percent_encoding::percent_decode_str(encoded_path).decode_utf8().ok()?;
    if decoded.contains('\\') || decoded.contains('\0') { return None; }
    let relative = std::path::Path::new(decoded.as_ref());
    if relative.components().any(|part| !matches!(part, std::path::Component::Normal(_))) {
        return None;
    }
    let root = current.path.parent()?.canonicalize().ok()?;
    let file = root.join(relative).canonicalize().ok()?;
    if !file.starts_with(&root) || !file.is_file() { return None; }
    let mime = match file.extension()?.to_str()?.to_ascii_lowercase().as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        "svg" => "image/svg+xml",
        _ => return None,
    };
    Some((mime, fs::read(file).ok()?))
}

#[tauri::command]
pub fn initial_document(state: State<'_, Mutex<Documents>>) -> Result<Option<Value>, String> {
    let mut documents = state.lock().map_err(|e| e.to_string())?;
    if documents.initial_consumed { return Ok(None); }
    documents.initial_consumed = true;
    #[cfg(target_os = "macos")]
    return Ok(None);
    #[cfg(target_os = "linux")]
    {
        let cwd = std::env::current_dir().map_err(|error| error.to_string())?;
        let mut startup = Documents::default();
        queue_arguments(&mut startup, std::env::args_os().skip(1), &cwd);
        startup.pending.append(&mut documents.pending);
        documents.pending = startup.pending;
        return Ok(None);
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    match std::env::args_os().nth(1) {
        Some(path) => open_path(&mut documents, path.into()).map(Some),
        None => Ok(None),
    }
}

#[cfg(any(target_os = "macos", target_os = "linux"))]
pub fn queue_open(documents: &mut Documents, path: PathBuf) {
    documents.pending.push_back(path);
}

#[cfg(target_os = "linux")]
pub fn queue_arguments(documents: &mut Documents, arguments: impl IntoIterator<Item = std::ffi::OsString>, base: &std::path::Path) {
    let mut positional_only = false;
    for argument in arguments {
        if !positional_only && argument == "--" {
            positional_only = true;
            continue;
        }
        if !positional_only && argument.to_string_lossy().starts_with('-') { continue; }
        let path = PathBuf::from(argument);
        queue_open(documents, if path.is_absolute() { path } else { base.join(path) });
    }
}

#[tauri::command]
pub fn has_pending_document(state: State<'_, Mutex<Documents>>) -> Result<bool, String> {
    Ok(!state.lock().map_err(|e| e.to_string())?.pending.is_empty())
}

#[tauri::command]
pub async fn pending_document(state: State<'_, Mutex<Documents>>, accept: bool) -> Result<Option<Value>, String> {
    let (path, sequence) = {
        let mut documents = state.lock().map_err(|e| e.to_string())?;
        let Some(path) = documents.pending.pop_front() else { return Ok(None) };
        (path, documents.sequence)
    };
    if !accept { return Ok(Some(json!({ "discarded": true }))); }
    match read_and_register(state.inner(), path, sequence).await {
        Ok(Some(document)) => Ok(Some(document)),
        Ok(None) => Ok(Some(json!({ "discarded": true }))),
        Err(error) => Ok(Some(json!({ "error": error }))),
    }
}

fn dialog_label<'a>(labels: &'a Option<Value>, key: &str, default: &'a str) -> &'a str {
    labels.as_ref().and_then(|value| value.get(key)).and_then(Value::as_str)
        .filter(|text| !text.trim().is_empty() && !text.chars().any(char::is_control))
        .unwrap_or(default)
}

fn suggested_filename(labels: &Option<Value>) -> &str {
    let text = dialog_label(labels, "untitled", "Untitled.md");
    if text.encode_utf16().count() > 200 || !text.ends_with(".md") || text.starts_with('.') || text.trim() != text
        || text.chars().any(|ch| ch.is_control() || "<>:\"/\\|?*".contains(ch)) {
        "Untitled.md"
    } else {
        text
    }
}

fn save_dialog_filename(current: Option<&OpenDocument>, labels: &Option<Value>) -> String {
    current.and_then(|document| document.path.file_name())
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_else(|| suggested_filename(labels).to_owned())
}

#[tauri::command]
pub async fn open_document(state: State<'_, Mutex<Documents>>, labels: Option<Value>) -> Result<Option<Value>, String> {
    let sequence = state.lock().map_err(|error| error.to_string())?.sequence;
    let file = rfd::AsyncFileDialog::new()
        .set_title(dialog_label(&labels, "open", "Open Markdown file"))
        .add_filter(dialog_label(&labels, "markdown", "Markdown files"), &["md", "markdown", "mdown", "mkd"])
        .pick_file().await;
    let Some(file) = file else { return Ok(None) };
    read_and_register(state.inner(), file.path().to_path_buf(), sequence).await
}

#[tauri::command]
pub fn save_document(state: State<'_, Mutex<Documents>>, document_id: Option<String>, content: String, save_as: bool, labels: Option<Value>) -> Value {
    match save_impl(state, document_id, content, save_as, &labels) {
        Ok(Some(result)) => result,
        Ok(None) => json!({ "status": "canceled" }),
        Err(message) => json!({ "status": "error", "message": message }),
    }
}

fn save_impl(state: State<'_, Mutex<Documents>>, document_id: Option<String>, content: String, save_as: bool, labels: &Option<Value>) -> Result<Option<Value>, String> {
    let (choose, suggested_name) = {
        let documents = state.lock().map_err(|e| e.to_string())?;
        let current = current_for_save(&documents, document_id.as_deref(), save_as)?;
        (save_as || current.is_none(), save_dialog_filename(current, labels))
    };
    // File dialogs run a native event loop. Do not hold the document lock while
    // they are open: Finder can deliver another open request on that same loop.
    let chosen_path = if choose {
        let Some(path) = rfd::FileDialog::new()
            .set_title(dialog_label(labels, "save", "Save Markdown file"))
            .add_filter(dialog_label(labels, "markdown", "Markdown files"), &["md", "markdown"])
            .set_file_name(suggested_name.as_str()).save_file() else { return Ok(None) };
        Some(path)
    } else {
        None
    };
    let mut documents = state.lock().map_err(|e| e.to_string())?;
    let current = current_for_save(&documents, document_id.as_deref(), save_as)?;
    let path = match chosen_path {
        Some(path) => path,
        None => current.ok_or("The document is no longer open. Use Save As.")?.path.clone(),
    };
    let previous = if choose {
        match fs::read(&path) {
            Ok(bytes) => Some(bytes),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
            Err(e) => return Err(e.to_string()),
        }
    } else { Some(current.unwrap().bytes.clone()) };
    let ending = current.filter(|d| d.editable).map_or("\n", |d| d.ending);
    let bom = current.is_some_and(|d| d.editable && d.bom);
    let bytes = encode_content(&content, bom, ending);
    replace_document(&path, &bytes, previous.as_deref())?;
    let document = open_path(&mut documents, path)?;
    Ok(Some(json!({ "status": "saved", "documentId": document["documentId"],
        "name": document["name"], "imageBase": document["imageBase"] })))
}

fn current_for_save<'a>(documents: &'a Documents, document_id: Option<&str>, save_as: bool) -> Result<Option<&'a OpenDocument>, String> {
    let current = documents.current.as_ref().filter(|d| Some(d.id.as_str()) == document_id);
    if document_id.is_some() && current.is_none() && !save_as {
        return Err("The document is no longer open. Use Save As.".into());
    }
    if !save_as && current.is_some_and(|d| !d.editable) {
        return Err("This file has mixed line endings or invalid UTF-8. Use Save As.".into());
    }
    Ok(current)
}

fn encode_content(content: &str, bom: bool, ending: &str) -> Vec<u8> {
    let normalized = content.replace("\r\n", "\n").replace('\r', "\n").replace('\n', ending);
    let mut bytes = if bom { vec![0xef, 0xbb, 0xbf] } else { Vec::new() };
    bytes.extend_from_slice(normalized.as_bytes());
    bytes
}

fn replace_document(path: &std::path::Path, bytes: &[u8], previous: Option<&[u8]>) -> Result<(), String> {
    if fs::symlink_metadata(path).is_ok_and(|metadata| metadata.file_type().is_symlink()) {
        return Err("Saving through a symbolic link is not supported. Use Save As.".into());
    }
    let parent = path.parent().ok_or("Invalid destination")?;
    let mut temp = tempfile::NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    if previous.is_some() {
        // A writable parent directory must not bypass a file's own write permissions.
        fs::OpenOptions::new().write(true).open(path).map_err(|e| e.to_string())?;
        let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
        temp.as_file().set_permissions(metadata.permissions()).map_err(|e| e.to_string())?;
    }
    temp.write_all(bytes).and_then(|_| temp.as_file().sync_all()).map_err(|e| e.to_string())?;
    match (previous, fs::read(path)) {
        (Some(old), Ok(now)) if old == now => {},
        (None, Err(e)) if e.kind() == std::io::ErrorKind::NotFound => {},
        _ => return Err("The destination changed on disk. Use Save As to preserve your edits.".into()),
    }
    if previous.is_some() {
        temp.persist(path).map_err(|e| e.to_string())?;
    } else {
        temp.persist_noclobber(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn localized_suggested_filename_rejects_paths_and_invalid_names() {
        assert_eq!(suggested_filename(&Some(json!({"untitled": "Sans titre.md"}))), "Sans titre.md");
        let unicode_name = format!("{}.md", "文".repeat(80));
        let unicode_labels = Some(json!({"untitled": unicode_name.clone()}));
        assert_eq!(suggested_filename(&unicode_labels), unicode_name);
        let long_name = format!("{}.md", "a".repeat(198));
        assert_eq!(suggested_filename(&Some(json!({"untitled": long_name}))), "Untitled.md");
        for invalid in ["../outside.md", "folder\\name.md", "bad:name.md", ".md", "name.txt", "name\n.md"] {
            assert_eq!(suggested_filename(&Some(json!({"untitled": invalid}))), "Untitled.md");
        }
        assert_eq!(suggested_filename(&None), "Untitled.md");
    }

    #[test]
    fn missing_document_returns_translatable_error_without_replacing_current_document() {
        let dir = tempfile::tempdir().unwrap();
        let existing = dir.path().join("existing.md");
        fs::write(&existing, "original").unwrap();
        let mut documents = Documents::default();
        open_path(&mut documents, existing.clone()).unwrap();
        let error = open_path(&mut documents, dir.path().join("missing.md")).unwrap_err();
        assert_eq!(error, "Markdown Vision could not read this file.");
        assert_eq!(documents.current.unwrap().path, existing);
    }

    #[cfg(any(target_os = "macos", target_os = "linux"))]
    #[test]
    fn queued_unicode_paths_keep_their_order() {
        let mut documents = Documents::default();
        let paths = [PathBuf::from("文書.md"), PathBuf::from("ملف.md")];
        for path in &paths { queue_open(&mut documents, path.clone()); }
        assert_eq!(documents.pending.into_iter().collect::<Vec<_>>(), paths);
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn linux_open_arguments_preserve_order_and_resolve_relative_paths() {
        let mut documents = Documents::default();
        let base = std::path::Path::new("/tmp/markdown-vision-test");
        queue_arguments(&mut documents, ["--verbose", "one.md", "--", "-two.md", "/tmp/three.md"].map(std::ffi::OsString::from), base);
        assert_eq!(documents.pending.into_iter().collect::<Vec<_>>(), vec![
            base.join("one.md"), base.join("-two.md"), PathBuf::from("/tmp/three.md"),
        ]);
    }

    #[test]
    fn detects_bom_and_line_endings() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("document.md");
        fs::write(&path, b"\xef\xbb\xbffirst\r\nsecond\r\n").unwrap();
        let mut documents = Documents::default();
        let result = open_path(&mut documents, path).unwrap();
        assert_eq!(result["content"], "first\nsecond\n");
        let current = documents.current.unwrap();
        assert!(current.bom && current.editable);
        assert_eq!(current.ending, "\r\n");
    }

    #[test]
    fn unicode_document_names_are_preserved() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("文書-📘.md");
        fs::write(&path, "text").unwrap();
        let mut documents = Documents::default();
        let result = open_path(&mut documents, path).unwrap();
        assert_eq!(result["name"], "文書-📘.md");
        let labels = Some(json!({"untitled": "Sans titre.md"}));
        assert_eq!(save_dialog_filename(documents.current.as_ref(), &labels), "文書-📘.md");
        assert_eq!(save_dialog_filename(None, &labels), "Sans titre.md");
    }

    #[test]
    fn saving_encoding_preserves_utf8_bom_and_cr_line_endings() {
        let original = b"\xef\xbb\xbffirst\rsecond\r";
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("document.md");
        fs::write(&path, original).unwrap();
        let mut documents = Documents::default();
        open_path(&mut documents, path).unwrap();
        let current = documents.current.unwrap();
        assert!(current.bom && current.editable);
        assert_eq!(current.ending, "\r");
        assert_eq!(encode_content("updated\ntext\n", current.bom, current.ending),
            b"\xef\xbb\xbfupdated\rtext\r");
    }

    #[test]
    fn mixed_endings_and_invalid_utf8_require_save_as() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("document.md");
        for bytes in [&b"first\r\nsecond\n"[..], &b"bad\xff"[..]] {
            fs::write(&path, bytes).unwrap();
            let mut documents = Documents::default();
            open_path(&mut documents, path.clone()).unwrap();
            assert!(!documents.current.unwrap().editable);
        }
    }

    #[test]
    fn stale_document_cannot_overwrite_the_current_document() {
        let directory = tempfile::tempdir().unwrap();
        let first = directory.path().join("first.md");
        let second = directory.path().join("second.md");
        fs::write(&first, "first").unwrap();
        fs::write(&second, "second").unwrap();
        let mut documents = Documents::default();
        open_path(&mut documents, first).unwrap();
        open_path(&mut documents, second.clone()).unwrap();
        assert!(current_for_save(&documents, Some("1"), false).is_err());
        assert!(current_for_save(&documents, Some("1"), true).unwrap().is_none());
        assert_eq!(fs::read_to_string(second).unwrap(), "second");
    }

    #[test]
    fn images_are_scoped_to_the_active_document() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("document.md");
        fs::write(&path, "text").unwrap();
        fs::write(directory.path().join("image.png"), b"image").unwrap();
        let mut documents = Documents::default();
        open_path(&mut documents, path.clone()).unwrap();
        assert_eq!(read_image(&documents, "/1/image.png").unwrap().1, b"image");
        assert!(read_image(&documents, "/1/%2e%2e/image.png").is_none());
        assert!(read_image(&documents, "/1/document.md").is_none());
        open_path(&mut documents, path).unwrap();
        assert!(read_image(&documents, "/1/image.png").is_none());
        assert!(read_image(&documents, "/2/image.png").is_some());
    }

    #[test]
    fn save_as_moves_relative_image_scope_to_the_new_directory() {
        let source = tempfile::tempdir().unwrap();
        let destination = tempfile::tempdir().unwrap();
        let original = source.path().join("document.md");
        let saved_as = destination.path().join("renamed.md");
        fs::write(&original, "![image](image.png)").unwrap();
        fs::write(source.path().join("image.png"), b"source image").unwrap();
        fs::write(destination.path().join("image.png"), b"destination image").unwrap();
        let mut documents = Documents::default();
        open_path(&mut documents, original).unwrap();
        assert_eq!(read_image(&documents, "/1/image.png").unwrap().1, b"source image");

        replace_document(&saved_as, b"![image](image.png)", None).unwrap();
        let saved = open_path(&mut documents, saved_as).unwrap();
        assert_eq!(saved["documentId"], "2");
        assert!(read_image(&documents, "/1/image.png").is_none());
        assert_eq!(read_image(&documents, "/2/image.png").unwrap().1, b"destination image");
    }

    #[test]
    fn save_detects_external_changes_and_preserves_contents() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("document.md");
        fs::write(&path, b"external change").unwrap();
        assert!(replace_document(&path, b"draft", Some(b"original")).is_err());
        assert_eq!(fs::read(&path).unwrap(), b"external change");
        assert!(replace_document(&path, b"draft", None).is_err());
        assert_eq!(fs::read(&path).unwrap(), b"external change");
        replace_document(&path, b"draft", Some(b"external change")).unwrap();
        assert_eq!(fs::read(&path).unwrap(), b"draft");
    }

    #[cfg(unix)]
    #[test]
    fn save_rejects_symbolic_links() {
        use std::os::unix::fs::symlink;
        let directory = tempfile::tempdir().unwrap();
        let target = directory.path().join("target.md");
        let link = directory.path().join("link.md");
        fs::write(&target, b"original").unwrap();
        symlink(&target, &link).unwrap();
        assert!(replace_document(&link, b"draft", Some(b"original")).is_err());
        assert_eq!(fs::read(&target).unwrap(), b"original");
    }

    #[cfg(unix)]
    #[test]
    fn read_only_documents_are_not_replaced() {
        use std::os::unix::fs::PermissionsExt;
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("document.md");
        fs::write(&path, b"original").unwrap();
        fs::set_permissions(&path, fs::Permissions::from_mode(0o444)).unwrap();
        // Privileged users can write read-only files, so test only where the OS denies it.
        if fs::OpenOptions::new().write(true).open(&path).is_err() {
            assert!(replace_document(&path, b"draft", Some(b"original")).is_err());
            assert_eq!(fs::read(&path).unwrap(), b"original");
        }
    }

    #[cfg(unix)]
    #[test]
    fn images_cannot_follow_symlinks_outside_document_directory() {
        use std::os::unix::fs::symlink;
        let directory = tempfile::tempdir().unwrap();
        let outside = tempfile::tempdir().unwrap();
        let path = directory.path().join("document.md");
        let target = outside.path().join("outside.png");
        fs::write(&path, "text").unwrap();
        fs::write(&target, b"private").unwrap();
        symlink(&target, directory.path().join("linked.png")).unwrap();
        let mut documents = Documents::default();
        open_path(&mut documents, path).unwrap();
        assert!(read_image(&documents, "/1/linked.png").is_none());
    }
}
