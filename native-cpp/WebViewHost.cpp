#include <windows.h>
#include <commdlg.h>
#include <shellapi.h>
#include <shlobj.h>
#include <wrl.h>
#include <WebView2.h>

#include <algorithm>
#include <filesystem>
#include <fstream>
#include <string>
#include <vector>

using Microsoft::WRL::Callback;
using Microsoft::WRL::ComPtr;

namespace {
constexpr wchar_t kClassName[] = L"MarkdownVisionNativeWebView";
constexpr wchar_t kAppName[] = L"Markdown Vision";
constexpr wchar_t kDetachedFlag[] = L"--markdown-vision-detached";

HWND g_window = nullptr;
ComPtr<ICoreWebView2Controller> g_controller;
ComPtr<ICoreWebView2> g_webView;
std::wstring g_startupPath;
bool g_initialTaken = false;

std::wstring Lower(std::wstring value) {
    std::transform(value.begin(), value.end(), value.begin(),
        [](wchar_t ch) { return static_cast<wchar_t>(towlower(ch)); });
    return value;
}

std::wstring ReadTextFile(const std::wstring& path) {
    std::ifstream stream(std::filesystem::path(path), std::ios::binary);
    if (!stream) return {};
    std::string bytes((std::istreambuf_iterator<char>(stream)), {});
    if (bytes.size() >= 3 && static_cast<unsigned char>(bytes[0]) == 0xef &&
        static_cast<unsigned char>(bytes[1]) == 0xbb && static_cast<unsigned char>(bytes[2]) == 0xbf)
        bytes.erase(0, 3);
    if (bytes.empty()) return {};
    const int count = MultiByteToWideChar(CP_UTF8, 0, bytes.data(), static_cast<int>(bytes.size()), nullptr, 0);
    std::wstring result(count, L'\0');
    MultiByteToWideChar(CP_UTF8, 0, bytes.data(), static_cast<int>(bytes.size()), result.data(), count);
    return result;
}

std::wstring JsonString(const std::wstring& value) {
    std::wstring output = L"\"";
    for (wchar_t ch : value) {
        switch (ch) {
        case L'\\': output += L"\\\\"; break;
        case L'"': output += L"\\\""; break;
        case L'\r': output += L"\\r"; break;
        case L'\n': output += L"\\n"; break;
        case L'\t': output += L"\\t"; break;
        default:
            if (ch < 32) {
                wchar_t escaped[7]{};
                swprintf_s(escaped, L"\\u%04x", ch);
                output += escaped;
            } else output += ch;
        }
    }
    return output + L"\"";
}

std::wstring DocumentJson(const std::wstring& path) {
    if (path.empty()) return L"null";
    return L"{\"name\":" + JsonString(std::filesystem::path(path).filename().wstring()) +
        L",\"content\":" + JsonString(ReadTextFile(path)) + L"}";
}

std::wstring PickDocument() {
    wchar_t path[32768]{};
    OPENFILENAMEW dialog{sizeof(dialog)};
    dialog.hwndOwner = g_window;
    dialog.lpstrFile = path;
    dialog.nMaxFile = static_cast<DWORD>(std::size(path));
    dialog.lpstrFilter =
        L"Markdown files (*.md;*.markdown;*.mdown;*.mkd)\0*.md;*.markdown;*.mdown;*.mkd\0"
        L"Text files (*.txt)\0*.txt\0\0";
    dialog.lpstrTitle = L"Open Markdown file";
    dialog.Flags = OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST;
    return GetOpenFileNameW(&dialog) ? path : L"";
}

int CALLBACK CollectFont(const LOGFONTW* font, const TEXTMETRICW*, DWORD, LPARAM value) {
    auto* fonts = reinterpret_cast<std::vector<std::wstring>*>(value);
    if (font->lfFaceName[0] != L'@') fonts->push_back(font->lfFaceName);
    return 1;
}

std::wstring FontJson() {
    std::vector<std::wstring> fonts;
    HDC dc = GetDC(g_window);
    LOGFONTW query{};
    query.lfCharSet = DEFAULT_CHARSET;
    EnumFontFamiliesExW(dc, &query, CollectFont, reinterpret_cast<LPARAM>(&fonts), 0);
    ReleaseDC(g_window, dc);
    std::sort(fonts.begin(), fonts.end());
    fonts.erase(std::unique(fonts.begin(), fonts.end()), fonts.end());
    std::wstring json = L"[";
    for (size_t i = 0; i < fonts.size(); ++i) {
        if (i) json += L",";
        json += JsonString(fonts[i]);
    }
    return json + L"]";
}

void Resolve(const std::wstring& id, const std::wstring& result) {
    if (!g_webView) return;
    const std::wstring script = L"window.__markdownVisionResolve(" + JsonString(id) + L"," + result + L");";
    g_webView->ExecuteScript(script.c_str(), nullptr);
}

void HandleMessage(ICoreWebView2WebMessageReceivedEventArgs* args) {
    LPWSTR raw = nullptr;
    if (FAILED(args->TryGetWebMessageAsString(&raw)) || !raw) return;
    std::wstring message(raw);
    CoTaskMemFree(raw);
    const size_t separator = message.find(L'|');
    if (separator == std::wstring::npos) return;
    const auto id = message.substr(0, separator);
    const auto method = message.substr(separator + 1);
    if (method == L"document.initial") {
        Resolve(id, g_initialTaken ? L"null" : DocumentJson(g_startupPath));
        g_initialTaken = true;
    } else if (method == L"document.open") Resolve(id, DocumentJson(PickDocument()));
    else if (method == L"fonts.list") Resolve(id, FontJson());
    else Resolve(id, L"null");
}

std::wstring ModuleDirectory() {
    wchar_t path[MAX_PATH]{};
    GetModuleFileNameW(nullptr, path, MAX_PATH);
    return std::filesystem::path(path).parent_path().wstring();
}

std::wstring StartupDocument() {
    int count = 0;
    LPWSTR* arguments = CommandLineToArgvW(GetCommandLineW(), &count);
    std::wstring result;
    for (int i = 1; i < count; ++i) {
        const std::wstring argument = arguments[i];
        if (_wcsicmp(argument.c_str(), kDetachedFlag) == 0) continue;
        const auto extension = Lower(std::filesystem::path(argument).extension().wstring());
        if ((extension == L".md" || extension == L".markdown" || extension == L".mdown" ||
            extension == L".mkd" || extension == L".txt") && std::filesystem::exists(argument)) {
            result = std::filesystem::absolute(argument).wstring();
            break;
        }
    }
    LocalFree(arguments);
    return result;
}

void LaunchDetached(const std::wstring& path) {
    wchar_t executable[MAX_PATH]{};
    GetModuleFileNameW(nullptr, executable, MAX_PATH);
    std::wstring command = L"\"" + std::wstring(executable) + L"\" " + kDetachedFlag + L" \"" + path + L"\"";
    STARTUPINFOW startup{sizeof(startup)};
    PROCESS_INFORMATION process{};
    if (CreateProcessW(executable, command.data(), nullptr, nullptr, FALSE,
        DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP, nullptr, nullptr, &startup, &process)) {
        CloseHandle(process.hThread);
        CloseHandle(process.hProcess);
    }
}

void ResizeWebView() {
    if (!g_controller) return;
    RECT bounds{};
    GetClientRect(g_window, &bounds);
    g_controller->put_Bounds(bounds);
}

void InitializeWebView() {
    PWSTR localAppData = nullptr;
    SHGetKnownFolderPath(FOLDERID_LocalAppData, 0, nullptr, &localAppData);
    const auto userData = std::filesystem::path(localAppData) / L"Markdown Vision Native" / L"WebView2";
    CoTaskMemFree(localAppData);

    CreateCoreWebView2EnvironmentWithOptions(nullptr, userData.c_str(), nullptr,
        Callback<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler>(
            [](HRESULT result, ICoreWebView2Environment* environment) -> HRESULT {
                if (FAILED(result) || !environment) {
                    MessageBoxW(g_window, L"Microsoft Edge WebView2 Runtime is required.", kAppName, MB_OK | MB_ICONERROR);
                    return result;
                }
                return environment->CreateCoreWebView2Controller(g_window,
                    Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler>(
                        [](HRESULT result2, ICoreWebView2Controller* controller) -> HRESULT {
                            if (FAILED(result2) || !controller) return result2;
                            g_controller = controller;
                            controller->get_CoreWebView2(&g_webView);
                            ResizeWebView();

                            ComPtr<ICoreWebView2Settings> settings;
                            g_webView->get_Settings(&settings);
                            settings->put_AreDevToolsEnabled(FALSE);
                            settings->put_AreDefaultContextMenusEnabled(TRUE);

                            const wchar_t* bridge = LR"JS(
(() => {
  let nextId = 1;
  const pending = new Map();
  window.__markdownVisionResolve = (id, result) => {
    const resolve = pending.get(id);
    if (resolve) { pending.delete(id); resolve(result); }
  };
  const request = (method) => new Promise((resolve) => {
    const id = String(nextId++);
    pending.set(id, resolve);
    chrome.webview.postMessage(id + '|' + method);
  });
  window.desktop = {
    getInitialDocument: () => request('document.initial'),
    openMarkdownFile: () => request('document.open'),
    listSystemFonts: () => request('fonts.list'),
    onOpenDocument: () => {},
    onFullscreenChange: () => {}
  };
})();
)JS";
                            g_webView->AddScriptToExecuteOnDocumentCreated(bridge, nullptr);

                            EventRegistrationToken token{};
                            g_webView->add_WebMessageReceived(
                                Callback<ICoreWebView2WebMessageReceivedEventHandler>(
                                    [](ICoreWebView2*, ICoreWebView2WebMessageReceivedEventArgs* args) -> HRESULT {
                                        HandleMessage(args);
                                        return S_OK;
                                    }).Get(), &token);
                            g_webView->add_DocumentTitleChanged(
                                Callback<ICoreWebView2DocumentTitleChangedEventHandler>(
                                    [](ICoreWebView2* sender, IUnknown*) -> HRESULT {
                                        LPWSTR title = nullptr;
                                        if (SUCCEEDED(sender->get_DocumentTitle(&title)) && title) {
                                            SetWindowTextW(g_window, title);
                                            CoTaskMemFree(title);
                                        }
                                        return S_OK;
                                    }).Get(), &token);
                            g_webView->add_NewWindowRequested(
                                Callback<ICoreWebView2NewWindowRequestedEventHandler>(
                                    [](ICoreWebView2*, ICoreWebView2NewWindowRequestedEventArgs* args) -> HRESULT {
                                        LPWSTR uri = nullptr;
                                        if (SUCCEEDED(args->get_Uri(&uri)) && uri) {
                                            ShellExecuteW(nullptr, L"open", uri, nullptr, nullptr, SW_SHOWNORMAL);
                                            CoTaskMemFree(uri);
                                        }
                                        args->put_Handled(TRUE);
                                        return S_OK;
                                    }).Get(), &token);

                            const auto index = std::filesystem::path(ModuleDirectory()) / L"web" / L"index.html";
                            std::wstring indexUrl = L"file:///" + index.wstring();
                            std::replace(indexUrl.begin(), indexUrl.end(), L'\\', L'/');
                            g_webView->Navigate(indexUrl.c_str());
                            return S_OK;
                        }).Get());
            }).Get());
}

LRESULT CALLBACK WindowProcedure(HWND window, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
    case WM_CREATE:
        g_window = window;
        InitializeWebView();
        return 0;
    case WM_SIZE:
        ResizeWebView();
        return 0;
    case WM_GETMINMAXINFO:
        reinterpret_cast<MINMAXINFO*>(lParam)->ptMinTrackSize = {680, 520};
        return 0;
    case WM_DESTROY:
        g_webView.Reset();
        g_controller.Reset();
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProcW(window, message, wParam, lParam);
}
} // namespace

int APIENTRY wWinMain(HINSTANCE instance, HINSTANCE, LPWSTR, int showCommand) {
    CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
    g_startupPath = StartupDocument();
    if (!g_startupPath.empty() && std::wstring(GetCommandLineW()).find(kDetachedFlag) == std::wstring::npos) {
        LaunchDetached(g_startupPath);
        CoUninitialize();
        return 0;
    }

    WNDCLASSEXW windowClass{sizeof(windowClass)};
    windowClass.lpfnWndProc = WindowProcedure;
    windowClass.hInstance = instance;
    windowClass.hCursor = LoadCursorW(nullptr, IDC_ARROW);
    windowClass.hIcon = LoadIconW(nullptr, IDI_APPLICATION);
    windowClass.hbrBackground = reinterpret_cast<HBRUSH>(COLOR_WINDOW + 1);
    windowClass.lpszClassName = kClassName;
    RegisterClassExW(&windowClass);

    HWND window = CreateWindowExW(0, kClassName, kAppName, WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT, 1180, 820, nullptr, nullptr, instance, nullptr);
    if (!window) return 1;
    ShowWindow(window, showCommand);
    UpdateWindow(window);

    MSG message{};
    while (GetMessageW(&message, nullptr, 0, 0) > 0) {
        TranslateMessage(&message);
        DispatchMessageW(&message);
    }
    CoUninitialize();
    return static_cast<int>(message.wParam);
}
