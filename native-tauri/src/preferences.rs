use serde_json::{json, Map, Value};
use std::{fs, io::Write, path::PathBuf};
use tauri::{AppHandle, Manager};

fn path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_config_dir().map(|dir| dir.join("preferences.json")).map_err(|e| e.to_string())
}

fn is_supported_language(text: &str) -> bool {
    matches!(text,
        "system" | "en" | "ar" | "zh-hans" | "zh-hant" | "cs" | "nl" | "fr" | "de" |
        "hi" | "id" | "it" | "ja" | "ko" | "pl" | "pt-br" | "ru" | "es" | "sv" |
        "th" | "tr" | "uk" | "vi")
}

fn validate(value: &Value) -> Result<Value, String> {
    let object = value.as_object().ok_or("Invalid preferences")?;
    let mut result = Map::new();
    for key in ["theme", "font", "monoFont", "size", "line", "width", "language", "readingDefaultsVersion"] {
        let Some(item) = object.get(key) else { continue };
        let text = item.as_str().ok_or_else(|| format!("Invalid {key}"))?;
        let valid = match key {
            "theme" => matches!(text, "light" | "dark"),
            "font" | "monoFont" => text.len() <= 256 && !text.chars().any(char::is_control),
            "size" => text == "auto" || text.parse::<f64>().is_ok_and(|n| (14.0..=26.0).contains(&n)),
            "line" => text.parse::<f64>().is_ok_and(|n| (1.35..=2.1).contains(&n)),
            "width" => text == "auto" || text.parse::<f64>().is_ok_and(|n| (540.0..=920.0).contains(&n)),
            "language" => is_supported_language(text),
            "readingDefaultsVersion" => text == "1",
            _ => false,
        };
        if !valid { return Err(format!("Invalid {key}")); }
        result.insert(key.into(), item.clone());
    }
    Ok(Value::Object(result))
}

#[tauri::command]
pub fn get_preferences(app: AppHandle) -> Result<Option<Value>, String> {
    read_preferences(&path(&app)?)
}

fn read_preferences(path: &std::path::Path) -> Result<Option<Value>, String> {
    let bytes = match fs::read(path) {
        Ok(bytes) => bytes,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.to_string()),
    };
    let stored: Value = serde_json::from_slice(&bytes).map_err(|e| e.to_string())?;
    if stored.get("version").and_then(Value::as_u64) != Some(1) {
        return Err("Unsupported preferences version".into());
    }
    let mut preferences = stored.get("preferences").ok_or("Missing preferences")?.clone();
    if let Some(object) = preferences.as_object_mut() {
        if object.get("language").is_some_and(|language| !language.as_str().is_some_and(is_supported_language)) {
            object.insert("language".into(), Value::String("system".into()));
        }
    }
    validate(&preferences).map(Some)
}

#[tauri::command]
pub fn save_preferences(app: AppHandle, preferences: Value) -> Result<(), String> {
    write_preferences(&path(&app)?, &preferences)
}

fn write_preferences(path: &std::path::Path, preferences: &Value) -> Result<(), String> {
    let preferences = validate(&preferences)?;
    let parent = path.parent().ok_or("Invalid preferences directory")?;
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    let bytes = serde_json::to_vec(&json!({ "version": 1, "preferences": preferences }))
        .map_err(|e| e.to_string())?;
    let mut file = tempfile::NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    file.write_all(&bytes).and_then(|_| file.as_file().sync_all()).map_err(|e| e.to_string())?;
    file.persist(path).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_known_settings_and_ignores_unknown_fields() {
        let value = json!({"theme":"dark","font":"Georgia","size":"18","line":"1.75","width":"720","extra":"ignored"});
        let result = validate(&value).unwrap();
        assert_eq!(result["theme"], "dark");
        assert!(result.get("extra").is_none());
    }

    #[test]
    fn rejects_invalid_values() {
        for value in [json!({"theme":"brown"}), json!({"size":"NaN"}),
            json!({"width":"999999"}), json!({"font":"bad\nfont"}), json!({"language":"invalid"})] {
            assert!(validate(&value).is_err());
        }
    }

    #[test]
    fn preserves_supported_language_preferences() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("preferences.json");
        for language in ["system", "en", "ar", "zh-hans", "zh-hant", "cs", "nl", "fr", "de",
            "hi", "id", "it", "ja", "ko", "pl", "pt-br", "ru", "es", "sv", "th", "tr", "uk", "vi"] {
            let value = json!({"language": language});
            assert_eq!(validate(&value).unwrap(), value);
            write_preferences(&path, &value).unwrap();
            assert_eq!(read_preferences(&path).unwrap(), Some(value));
        }
    }

    #[test]
    fn recovers_unsupported_saved_language_without_losing_other_preferences() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("preferences.json");
        for language in [json!("unsupported"), json!(42), Value::Null] {
            let stored = json!({"version": 1, "preferences": {"language": language, "theme": "dark", "size": "20"}});
            fs::write(&path, serde_json::to_vec(&stored).unwrap()).unwrap();
            let actual = read_preferences(&path).unwrap().unwrap();
            assert_eq!(actual, json!({"language": "system", "theme": "dark", "size": "20"}));
        }
        assert!(validate(&json!({"language": "unsupported"})).is_err());
    }

    #[test]
    fn persists_settings_and_refuses_unrecognized_versions() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("settings").join("preferences.json");
        assert!(read_preferences(&path).unwrap().is_none());
        let preferences = json!({
            "theme":"dark", "font":"Georgia", "monoFont":"Cascadia Mono",
            "size":"18", "line":"1.75", "width":"720", "readingDefaultsVersion":"1"
        });
        write_preferences(&path, &preferences).unwrap();
        assert_eq!(read_preferences(&path).unwrap(), Some(preferences));
        fs::write(&path, br#"{"version":2,"preferences":{}}"#).unwrap();
        assert!(read_preferences(&path).is_err());
    }
}
