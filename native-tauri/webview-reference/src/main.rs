use serde_json::json;
use std::{env, fs, path::PathBuf, process};
use tao::{
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::WindowBuilder,
};
use url::Url;
use wry::WebViewBuilder;

fn fail(message: &str) -> ! {
    eprintln!("webview-reference: {message}");
    process::exit(2);
}

fn main() {
    let mut args = env::args_os().skip(1);
    let Some(frontend) = args.next() else {
        fail("usage: markdown-vision-webview-reference <frontend-directory> [markdown-file]");
    };
    let frontend = fs::canonicalize(PathBuf::from(frontend))
        .unwrap_or_else(|error| fail(&format!("could not resolve frontend directory: {error}")));
    let index = frontend.join("index.html");
    if !index.is_file() {
        fail("frontend directory must contain index.html");
    }
    let initial_document = args.next().map(|path| {
        let path = PathBuf::from(path);
        let content = fs::read_to_string(&path)
            .unwrap_or_else(|error| fail(&format!("could not read startup document: {error}")));
        json!({
            "content": content,
            "name": path.file_name().unwrap_or_default().to_string_lossy(),
            "documentId": "webview-reference",
            "imageBase": ""
        })
    });
    let initial_document = initial_document.unwrap_or(serde_json::Value::Null);
    let initialization_script = format!(
        "window.desktop = {{ getInitialDocument: async () => ({initial_document}) }};"
    );
    let page = Url::from_file_path(index).unwrap_or_else(|_| fail("frontend path cannot be represented as a file URL"));

    let event_loop = EventLoop::new();
    let window = WindowBuilder::new()
        .with_title("Markdown Vision WebView Reference")
        .with_inner_size(tao::dpi::LogicalSize::new(1100.0, 800.0))
        .build(&event_loop)
        .unwrap_or_else(|error| fail(&format!("could not create window: {error}")));
    let _webview = WebViewBuilder::new()
        .with_initialization_script(&initialization_script)
        .with_url(page.as_str())
        .and_then(|builder| builder.build(&window))
        .unwrap_or_else(|error| fail(&format!("could not create system WebView: {error}")));

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;
        if matches!(event, Event::WindowEvent { event: WindowEvent::CloseRequested, .. }) {
            *control_flow = ControlFlow::Exit;
        }
    });
}
