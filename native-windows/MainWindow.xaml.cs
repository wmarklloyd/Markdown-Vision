using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Media;
using Microsoft.Win32;
using Microsoft.Web.WebView2.Core;

namespace MarkdownVision.Native;

public partial class MainWindow : Window
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly string PreferencesPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "Markdown Vision",
        "preferences.json");

    private readonly string? _startupDocumentPath;
    private DocumentData? _initialDocument;

    public MainWindow()
    {
        InitializeComponent();
        _startupDocumentPath = FindDocumentPath(Environment.GetCommandLineArgs().Skip(1));
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        try
        {
            if (_startupDocumentPath is not null)
                _initialDocument = ReadDocument(_startupDocumentPath);

            var userDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Markdown Vision Native",
                "WebView2");
            var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: userDataFolder);
            Browser.DefaultBackgroundColor = System.Drawing.Color.FromArgb(0xFF, 0x1C, 0x1C, 0x1B);
            await Browser.EnsureCoreWebView2Async(environment);
            await Browser.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(BridgeScript);

            Browser.CoreWebView2.Settings.AreDevToolsEnabled = false;
            Browser.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            Browser.CoreWebView2.WebMessageReceived += OnWebMessageReceived;
            Browser.CoreWebView2.DocumentTitleChanged += (_, _) =>
                Dispatcher.Invoke(() => Title = Browser.CoreWebView2.DocumentTitle);
            Browser.CoreWebView2.ContainsFullScreenElementChanged += (_, _) =>
                Browser.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new
                {
                    type = "window.fullscreen",
                    fullscreen = Browser.CoreWebView2.ContainsFullScreenElement
                }, JsonOptions));
            Browser.CoreWebView2.NewWindowRequested += OnNewWindowRequested;

            var indexPath = Path.Combine(AppContext.BaseDirectory, "web", "index.html");
            Browser.Source = new Uri(indexPath);
        }
        catch (Exception exception)
        {
            MessageBox.Show(
                $"Markdown Vision could not start.\n\n{exception.Message}",
                "Markdown Vision",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            Close();
        }
    }

    private async void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        BridgeRequest? request;
        try
        {
            request = JsonSerializer.Deserialize<BridgeRequest>(e.WebMessageAsJson, JsonOptions);
        }
        catch (JsonException)
        {
            return;
        }

        if (request is null || string.IsNullOrWhiteSpace(request.Id))
            return;

        try
        {
            object? result = request.Method switch
            {
                "document.initial" => TakeInitialDocument(),
                "document.open" => OpenDocument(),
                "preferences.get" => ReadPreferences(),
                "preferences.set" => WritePreferences(request.Payload),
                "fonts.list" => ListSystemFonts(),
                _ => throw new InvalidOperationException($"Unknown native method: {request.Method}")
            };
            PostResponse(request.Id, result, null);
        }
        catch (Exception exception)
        {
            PostResponse(request.Id, null, exception.Message);
        }

        await Task.CompletedTask;
    }

    private DocumentData? TakeInitialDocument()
    {
        var document = _initialDocument;
        _initialDocument = null;
        return document;
    }

    private DocumentData? OpenDocument()
    {
        var dialog = new OpenFileDialog
        {
            Title = "Open Markdown file",
            Filter = "Markdown files (*.md;*.markdown;*.mdown;*.mkd)|*.md;*.markdown;*.mdown;*.mkd|Text files (*.txt)|*.txt",
            CheckFileExists = true,
            Multiselect = false
        };
        return dialog.ShowDialog(this) == true ? ReadDocument(dialog.FileName) : null;
    }

    private static DocumentData ReadDocument(string filePath)
    {
        var resolvedPath = Path.GetFullPath(filePath);
        return new DocumentData(Path.GetFileName(resolvedPath), File.ReadAllText(resolvedPath));
    }

    private static string? FindDocumentPath(IEnumerable<string> arguments)
    {
        var supportedExtensions = new HashSet<string>(
            [".md", ".markdown", ".mdown", ".mkd", ".txt"],
            StringComparer.OrdinalIgnoreCase);

        return arguments
            .Select(argument => argument.Trim('"'))
            .FirstOrDefault(argument =>
                !argument.StartsWith('-') &&
                supportedExtensions.Contains(Path.GetExtension(argument)) &&
                File.Exists(argument));
    }

    private static Dictionary<string, string>? ReadPreferences()
    {
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(
                File.ReadAllText(PreferencesPath),
                JsonOptions);
        }
        catch (IOException)
        {
            return null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static Dictionary<string, string> WritePreferences(JsonElement payload)
    {
        var defaults = new Dictionary<string, string>
        {
            ["theme"] = "light",
            ["font"] = "Libertinus Serif",
            ["monoFont"] = "Libertinus Mono",
            ["size"] = "18",
            ["line"] = "1.75",
            ["width"] = "720"
        };
        if (payload.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in payload.EnumerateObject())
                defaults[property.Name] = property.Value.ToString();
        }

        Directory.CreateDirectory(Path.GetDirectoryName(PreferencesPath)!);
        File.WriteAllText(
            PreferencesPath,
            JsonSerializer.Serialize(defaults, new JsonSerializerOptions(JsonOptions) { WriteIndented = true }));
        return defaults;
    }

    private static string[] ListSystemFonts() =>
        Fonts.SystemFontFamilies
            .Select(family => family.Source)
            .Distinct(StringComparer.CurrentCultureIgnoreCase)
            .OrderBy(name => name, StringComparer.CurrentCultureIgnoreCase)
            .ToArray();

    private void PostResponse(string id, object? result, string? error)
    {
        var json = JsonSerializer.Serialize(new
        {
            type = "response",
            id,
            result,
            error
        }, JsonOptions);
        Browser.CoreWebView2.PostWebMessageAsJson(json);
    }

    private static void OnNewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
    {
        e.Handled = true;
        if (Uri.TryCreate(e.Uri, UriKind.Absolute, out var uri) &&
            (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
        {
            Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true });
        }
    }

    private sealed record BridgeRequest(string Id, string Method, JsonElement Payload);
    private sealed record DocumentData(string Name, string Content);

    private const string BridgeScript = """
        (() => {
          let nextRequestId = 1;
          const pending = new Map();
          const documentListeners = [];
          const fullscreenListeners = [];

          chrome.webview.addEventListener('message', (event) => {
            const message = event.data;
            if (message?.type === 'response') {
              const request = pending.get(message.id);
              if (!request) return;
              pending.delete(message.id);
              if (message.error) request.reject(new Error(message.error));
              else request.resolve(message.result);
            } else if (message?.type === 'document.opened') {
              documentListeners.forEach((listener) => listener(message.document));
            } else if (message?.type === 'window.fullscreen') {
              fullscreenListeners.forEach((listener) => listener(Boolean(message.fullscreen)));
            }
          });

          const request = (method, payload = null) => new Promise((resolve, reject) => {
            const id = String(nextRequestId++);
            pending.set(id, { resolve, reject });
            chrome.webview.postMessage({ id, method, payload });
          });

          window.desktop = {
            getInitialDocument: () => request('document.initial'),
            getPreferences: () => request('preferences.get'),
            savePreferences: (preferences) => request('preferences.set', preferences),
            openMarkdownFile: () => request('document.open'),
            listSystemFonts: () => request('fonts.list'),
            onOpenDocument: (callback) => documentListeners.push(callback),
            onFullscreenChange: (callback) => fullscreenListeners.push(callback)
          };
        })();
        """;
}
