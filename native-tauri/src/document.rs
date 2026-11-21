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

struct OpenDocument {
    id: String,
    path: PathBuf,
    bytes: Vec<u8>,
    bom: bool,
    ending: &'static str,
    editable: bool,
}

fn open_path(documents: &mut Documents, path: PathBuf) -> Result<Value, String> {
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
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
    let name = path.file_name().unwrap_or_default().to_string_lossy().into_owned();
    documents.sequence += 1;
    let id = documents.sequence.to_string();
    documents.current = Some(OpenDocument { id: id.clone(), path, bytes, bom, ending, editable: valid && !mixed });
    let scheme = if cfg!(windows) { "http://mvimage.localhost" } else { "mvimage://localhost" };
    Ok(json!({ "content": content, "name": name, "documentId": id,
        "imageBase": format!("{scheme}/{id}/") }))
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
    #[cfg(not(target_os = "macos"))]
    match std::env::args_os().nth(1) {
        Some(path) => open_path(&mut documents, path.into()).map(Some),
        None => Ok(None),
    }
}

#[cfg(target_os = "macos")]
pub fn queue_open(documents: &mut Documents, path: PathBuf) {
    documents.pending.push_back(path);
}

#[tauri::command]
pub fn has_pending_document(state: State<'_, Mutex<Documents>>) -> Result<bool, String> {
    Ok(!state.lock().map_err(|e| e.to_string())?.pending.is_empty())
}

#[tauri::command]
pub fn pending_document(state: State<'_, Mutex<Documents>>, accept: bool) -> Result<Option<Value>, String> {
    let mut documents = state.lock().map_err(|e| e.to_string())?;
    let Some(path) = documents.pending.pop_front() else { return Ok(None) };
    if !accept { return Ok(Some(json!({ "discarded": true }))); }
    open_path(&mut documents, path).map(Some)
}

#[tauri::command]
pub fn open_document(state: State<'_, Mutex<Documents>>) -> Result<Option<Value>, String> {
    let path = rfd::FileDialog::new().add_filter("Markdown", &["md", "markdown", "mdown", "mkd"]).pick_file();
    let Some(path) = path else { return Ok(None) };
    let mut documents = state.lock().map_err(|e| e.to_string())?;
    open_path(&mut documents, path).map(Some)
}

#[tauri::command]
pub fn save_document(state: State<'_, Mutex<Documents>>, document_id: Option<String>, content: String, save_as: bool) -> Value {
    match save_impl(state, document_id, content, save_as) {
        Ok(Some(result)) => result,
        Ok(None) => json!({ "status": "canceled" }),
        Err(message) => json!({ "status": "error", "message": message }),
    }
}

fn save_impl(state: State<'_, Mutex<Documents>>, document_id: Option<String>, content: String, save_as: bool) -> Result<Option<Value>, String> {
    let mut documents = state.lock().map_err(|e| e.to_string())?;
    let current = documents.current.as_ref().filter(|d| Some(&d.id) == document_id.as_ref());
    if document_id.is_some() && current.is_none() && !save_as {
        return Err("The document is no longer open. Use Save As.".into());
    }
    if !save_as && current.is_some_and(|d| !d.editable) {
        return Err("This file has mixed line endings or invalid UTF-8. Use Save As.".into());
    }
    let choose = save_as || current.is_none();
    let path = if choose {
        let Some(path) = rfd::FileDialog::new().add_filter("Markdown", &["md", "markdown"])
            .set_file_name("Untitled.md").save_file() else { return Ok(None) };
        path
    } else {
        current.unwrap().path.clone()
    };
    if fs::symlink_metadata(&path).is_ok_and(|metadata| metadata.file_type().is_symlink()) {
        return Err("Saving through a symbolic link is not supported. Use Save As.".into());
    }
    let previous = if choose {
        match fs::read(&path) {
            Ok(bytes) => Some(bytes),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
            Err(e) => return Err(e.to_string()),
        }
    } else { Some(current.unwrap().bytes.clone()) };
    let ending = current.filter(|d| d.editable).map_or("\n", |d| d.ending);
    let bom = current.is_some_and(|d| d.editable && d.bom);
    let normalized = content.replace("\r\n", "\n").replace('\r', "\n").replace('\n', ending);
    let mut bytes = if bom { vec![0xef, 0xbb, 0xbf] } else { Vec::new() };
    bytes.extend_from_slice(normalized.as_bytes());
    let parent = path.parent().ok_or("Invalid destination")?;
    let mut temp = tempfile::NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    if previous.is_some() {
        let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
        temp.as_file().set_permissions(metadata.permissions()).map_err(|e| e.to_string())?;
    }
    temp.write_all(&bytes).and_then(|_| temp.as_file().sync_all()).map_err(|e| e.to_string())?;
    match (&previous, fs::read(&path)) {
        (Some(old), Ok(now)) if *old == now => {},
        (None, Err(e)) if e.kind() == std::io::ErrorKind::NotFound => {},
        _ => return Err("The destination changed on disk. Use Save As to preserve your edits.".into()),
    }
    if previous.is_some() {
        temp.persist(&path).map_err(|e| e.to_string())?;
    } else {
        temp.persist_noclobber(&path).map_err(|e| e.to_string())?;
    }
    let document = open_path(&mut documents, path)?;
    Ok(Some(json!({ "status": "saved", "documentId": document["documentId"],
        "name": document["name"], "imageBase": document["imageBase"] })))
}

#[cfg(test)]
mod tests {
    use super::*;

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
}
