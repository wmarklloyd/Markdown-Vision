#include <windows.h>
#include <commdlg.h>
#include <dwmapi.h>
#include <shellapi.h>
#include <shlwapi.h>
#include <shlobj.h>
#include <wrl.h>
#include <WebView2.h>

#include <algorithm>
#include <filesystem>
#include <fstream>
#include <limits>
#include <optional>
#include <string>
#include <vector>

using Microsoft::WRL::Callback;
using Microsoft::WRL::ComPtr;

namespace {
constexpr wchar_t kClassName[] = L"MarkdownVisionNativeWebView";
constexpr wchar_t kAppName[] = L"Markdown Vision";
constexpr wchar_t kDetachedFlag[] = L"--markdown-vision-detached";
constexpr UINT kPrintShortcut = WM_APP + 1;

HWND g_window = nullptr;
ComPtr<ICoreWebView2Controller> g_controller;
ComPtr<ICoreWebView2> g_webView;
ComPtr<ICoreWebView2Environment> g_environment;
std::wstring g_startupPath;
bool g_initialTaken = false;
bool g_saving = false;
unsigned long long g_documentSequence = 0;

enum class LineEnding { lf, crlf, cr, mixed };

struct OpenDocument {
    std::wstring id;
    std::wstring path;
    std::string bytes;
    LineEnding lineEnding = LineEnding::lf;
    bool bom = false;
    bool validUtf8 = true;
};

std::optional<OpenDocument> g_document;
std::wstring Lower(std::wstring value);

std::wstring MapDocumentImages(const OpenDocument& document) {
    return L"https://markdownvision-images.invalid/" + document.id + L"/";
}

void ServeDocumentImage(ICoreWebView2WebResourceRequestedEventArgs* args) {
    ComPtr<ICoreWebView2WebResourceRequest> request;
    LPWSTR rawUri = nullptr;
    if (FAILED(args->get_Request(&request)) || FAILED(request->get_Uri(&rawUri)) || !rawUri) return;
    std::wstring uri(rawUri);
    CoTaskMemFree(rawUri);
    const std::wstring prefix = L"https://markdownvision-images.invalid/";
    ComPtr<IStream> stream;
    std::wstring mime;
    if (g_document && uri.rfind(prefix + g_document->id + L"/", 0) == 0) {
        std::wstring path = uri.substr(prefix.size() + g_document->id.size() + 1);
        const auto query = path.find_first_of(L"?#");
        if (query != std::wstring::npos) path.resize(query);
        std::vector<wchar_t> decoded(path.size() + 1);
        DWORD size = static_cast<DWORD>(decoded.size());
        if (SUCCEEDED(UrlUnescapeW(path.data(), decoded.data(), &size, URL_UNESCAPE_AS_UTF8))) {
            std::error_code error;
            const auto root = std::filesystem::weakly_canonical(
                std::filesystem::path(g_document->path).parent_path(), error);
            const auto file = std::filesystem::weakly_canonical(root / decoded.data(), error);
            const auto relative = file.lexically_relative(root);
            if (!error && !relative.empty() && !relative.is_absolute() && *relative.begin() != L"..") {
                const auto extension = Lower(file.extension().wstring());
                if (extension == L".png") mime = L"image/png";
                else if (extension == L".jpg" || extension == L".jpeg") mime = L"image/jpeg";
                else if (extension == L".gif") mime = L"image/gif";
                else if (extension == L".webp") mime = L"image/webp";
                else if (extension == L".bmp") mime = L"image/bmp";
                else if (extension == L".svg") mime = L"image/svg+xml";
                if (!mime.empty()) SHCreateStreamOnFileEx(file.c_str(), STGM_READ | STGM_SHARE_DENY_NONE,
                    FILE_ATTRIBUTE_NORMAL, FALSE, nullptr, &stream);
            }
        }
    }
    ComPtr<ICoreWebView2WebResourceResponse> response;
    const std::wstring headers = L"Content-Type: " + mime + L"\r\nCache-Control: no-store\r\n";
    if (SUCCEEDED(g_environment->CreateWebResourceResponse(stream.Get(), stream ? 200 : 404,
        stream ? L"OK" : L"Not Found", headers.c_str(), &response))) args->put_Response(response.Get());
}

bool SystemUsesDarkMode() {
    DWORD lightTheme = 1;
    DWORD size = sizeof(lightTheme);
    RegGetValueW(HKEY_CURRENT_USER,
        L"Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",
        L"AppsUseLightTheme", RRF_RT_REG_DWORD, nullptr, &lightTheme, &size);
    return lightTheme == 0;
}

void ApplySystemWindowFrame(HWND window) {
    const BOOL dark = SystemUsesDarkMode();
    constexpr DWORD useImmersiveDarkMode = 20;
    DwmSetWindowAttribute(window, useImmersiveDarkMode, &dark, sizeof(dark));
}

std::wstring Lower(std::wstring value) {
    std::transform(value.begin(), value.end(), value.begin(),
        [](wchar_t ch) { return static_cast<wchar_t>(towlower(ch)); });
    return value;
}

bool ReadFileBytes(const std::wstring& path, std::string& bytes) {
    std::ifstream stream(std::filesystem::path(path), std::ios::binary);
    if (!stream) return false;
    bytes.clear();
    char buffer[16384];
    while (stream.read(buffer, sizeof(buffer)) || stream.gcount()) {
        bytes.append(buffer, static_cast<size_t>(stream.gcount()));
    }
    return stream.eof() && !stream.bad();
}

LineEnding DetectLineEnding(const std::string& bytes) {
    bool crlf = false, cr = false, lf = false;
    for (size_t i = 0; i < bytes.size(); ++i) {
        if (bytes[i] == '\r') {
            if (i + 1 < bytes.size() && bytes[i + 1] == '\n') { crlf = true; ++i; }
            else cr = true;
        } else if (bytes[i] == '\n') lf = true;
    }
    if (static_cast<int>(crlf) + static_cast<int>(cr) + static_cast<int>(lf) > 1) return LineEnding::mixed;
    return crlf ? LineEnding::crlf : cr ? LineEnding::cr : LineEnding::lf;
}

std::wstring DecodeText(OpenDocument& document) {
    document.bom = document.bytes.compare(0, 3, "\xef\xbb\xbf") == 0;
    document.lineEnding = DetectLineEnding(document.bytes);
    const size_t skip = document.bom ? 3 : 0;
    if (document.bytes.size() == skip) return {};
    const char* bytes = document.bytes.data() + skip;
    const int length = static_cast<int>(document.bytes.size() - skip);
    int count = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, bytes, length, nullptr, 0);
    document.validUtf8 = count > 0;
    if (!document.validUtf8) count = MultiByteToWideChar(CP_UTF8, 0, bytes, length, nullptr, 0);
    std::wstring result(count, L'\0');
    if (count) MultiByteToWideChar(CP_UTF8, 0, bytes, length, result.data(), count);
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
    OpenDocument document;
    if (!ReadFileBytes(path, document.bytes) ||
        document.bytes.size() > static_cast<size_t>((std::numeric_limits<int>::max)())) {
        MessageBoxW(g_window, L"Markdown Vision could not read this file.", kAppName, MB_OK | MB_ICONERROR);
        return L"null";
    }
    document.id = std::to_wstring(++g_documentSequence);
    document.path = path;
    const auto text = DecodeText(document);
    const auto json = L"{\"name\":" + JsonString(std::filesystem::path(path).filename().wstring()) +
        L",\"documentId\":" + JsonString(document.id) + L",\"imageBase\":" +
        JsonString(MapDocumentImages(document)) + L",\"content\":" + JsonString(text) + L"}";
    g_document = std::move(document);
    return json;
}

void SetDocumentTitle(const std::wstring& path) {
    const std::wstring title = path.empty()
        ? kAppName
        : std::wstring(kAppName) + L" - " + std::filesystem::path(path).filename().wstring();
    SetWindowTextW(g_window, title.c_str());
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
    dialog.Flags = OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST | OFN_NOCHANGEDIR;
    if (!GetOpenFileNameW(&dialog)) return {};
    return path;
}

std::wstring PickSavePath(const OpenDocument* document) {
    wchar_t path[32768] = L"Untitled.md";
    const std::wstring directory = document ? std::filesystem::path(document->path).parent_path().wstring() : L"";
    if (document) wcsncpy_s(path, document->path.c_str(), _TRUNCATE);
    OPENFILENAMEW dialog{sizeof(dialog)};
    dialog.hwndOwner = g_window;
    dialog.lpstrFile = path;
    dialog.nMaxFile = static_cast<DWORD>(std::size(path));
    dialog.lpstrFilter = L"Markdown files (*.md;*.markdown;*.mdown;*.mkd)\0*.md;*.markdown;*.mdown;*.mkd\0"
        L"Text files (*.txt)\0*.txt\0All files\0*.*\0\0";
    dialog.lpstrTitle = L"Save Markdown file";
    dialog.lpstrInitialDir = directory.empty() ? nullptr : directory.c_str();
    dialog.lpstrDefExt = L"md";
    dialog.Flags = OFN_OVERWRITEPROMPT | OFN_PATHMUSTEXIST | OFN_NOCHANGEDIR;
    return GetSaveFileNameW(&dialog) ? std::wstring(path) : L"";
}

bool EncodeText(const std::wstring& text, LineEnding ending, bool bom, std::string& bytes) {
    std::wstring normalized;
    normalized.reserve(text.size());
    for (size_t i = 0; i < text.size(); ++i) {
        const wchar_t ch = text[i];
        if (ch != L'\r' && ch != L'\n') {
            normalized += ch;
            continue;
        }
        if (ch == L'\r' && i + 1 < text.size() && text[i + 1] == L'\n') ++i;
        if (ending == LineEnding::cr || ending == LineEnding::crlf) normalized += L'\r';
        if (ending != LineEnding::cr) normalized += L'\n';
    }
    bytes = bom ? "\xef\xbb\xbf" : "";
    if (normalized.empty()) return true;
    if (normalized.size() > static_cast<size_t>((std::numeric_limits<int>::max)())) return false;
    const int length = static_cast<int>(normalized.size());
    const int count = WideCharToMultiByte(CP_UTF8, WC_ERR_INVALID_CHARS, normalized.data(), length, nullptr, 0, nullptr, nullptr);
    if (!count) return false;
    const size_t offset = bytes.size();
    bytes.resize(offset + count);
    return WideCharToMultiByte(CP_UTF8, WC_ERR_INVALID_CHARS, normalized.data(), length,
        bytes.data() + offset, count, nullptr, nullptr) == count;
}

enum class FileWriteResult { saved, changed, error, recovery };

FileWriteResult ReplaceDocument(const std::wstring& path, const std::string& bytes, const std::string* previous,
    std::wstring& recoveryPath) {
    GUID id{};
    wchar_t suffix[40]{};
    if (FAILED(CoCreateGuid(&id)) || !StringFromGUID2(id, suffix, static_cast<int>(std::size(suffix)))) return FileWriteResult::error;
    const auto temporary = std::filesystem::path(path).parent_path() /
        (std::wstring(L".markdown-vision-") + suffix + L".tmp");
    const HANDLE file = CreateFileW(temporary.c_str(), GENERIC_WRITE, 0, nullptr, CREATE_NEW, FILE_ATTRIBUTE_NORMAL, nullptr);
    if (file == INVALID_HANDLE_VALUE) return FileWriteResult::error;
    size_t offset = 0;
    while (offset < bytes.size()) {
        const DWORD count = static_cast<DWORD>(std::min<size_t>(bytes.size() - offset, 1048576));
        DWORD written = 0;
        if (!WriteFile(file, bytes.data() + offset, count, &written, nullptr) || !written) break;
        offset += written;
    }
    const bool flushed = offset == bytes.size() && FlushFileBuffers(file);
    const bool closed = CloseHandle(file);
    auto result = FileWriteResult::error;
    if (flushed && closed) {
        if (previous) {
            std::string current;
            if (!ReadFileBytes(path, current) || current != *previous) {
                result = FileWriteResult::changed;
            } else {
                const std::wstring backup = temporary.wstring() + L".bak";
                if (ReplaceFileW(path.c_str(), temporary.c_str(), backup.c_str(), 0, nullptr, nullptr)) {
                    DeleteFileW(backup.c_str());
                    result = FileWriteResult::saved;
                } else if (GetLastError() == ERROR_UNABLE_TO_MOVE_REPLACEMENT_2
                    && !MoveFileExW(backup.c_str(), path.c_str(), MOVEFILE_WRITE_THROUGH)) {
                    recoveryPath = backup;
                    result = FileWriteResult::recovery;
                }
            }
        } else if (MoveFileExW(temporary.c_str(), path.c_str(), MOVEFILE_WRITE_THROUGH)) {
            result = FileWriteResult::saved;
        }
    }
    if (result != FileWriteResult::saved) DeleteFileW(temporary.c_str());
    return result;
}

std::wstring SaveError(const std::wstring& message) {
    return L"{\"status\":\"error\",\"message\":" + JsonString(message) + L"}";
}

std::wstring SaveDocument(const std::wstring& id, const std::wstring& text, bool saveAs) {
    const OpenDocument* current = g_document && g_document->id == id ? &*g_document : nullptr;
    if (!id.empty() && !current && !saveAs) return SaveError(L"This document is no longer open. Reopen the file or use Save As.");
    const bool choosePath = saveAs || !current;
    if (!choosePath && !current->validUtf8) return SaveError(L"Use Save As to create a UTF-8 copy of this file.");
    if (!choosePath && current->lineEnding == LineEnding::mixed) {
        return SaveError(L"This file uses mixed line endings. Use Save As to create a copy with consistent line endings.");
    }

    OpenDocument next;
    next.path = choosePath ? PickSavePath(current) : current->path;
    if (next.path.empty()) {
        if (CommDlgExtendedError()) return SaveError(L"Windows could not open the Save As dialog.");
        return L"{\"status\":\"canceled\"}";
    }
    if (current && current->validUtf8 && current->lineEnding != LineEnding::mixed) {
        next.lineEnding = current->lineEnding;
        next.bom = current->bom;
    }
    if (!EncodeText(text, next.lineEnding, next.bom, next.bytes)) return SaveError(L"The draft could not be encoded as UTF-8.");

    std::string confirmed;
    const std::string* previous = !choosePath ? &current->bytes : nullptr;
    if (choosePath && GetFileAttributesW(next.path.c_str()) != INVALID_FILE_ATTRIBUTES) {
        if (!ReadFileBytes(next.path, confirmed)) return SaveError(L"Windows could not read the selected destination.");
        previous = &confirmed;
    }
    std::wstring recoveryPath;
    switch (ReplaceDocument(next.path, next.bytes, previous, recoveryPath)) {
    case FileWriteResult::changed:
        return SaveError(L"The file changed on disk or is unavailable. Use Save As to keep your edits in a separate copy.");
    case FileWriteResult::error:
        return SaveError(L"Windows could not save the file. Check that the file is writable, or use Save As.");
    case FileWriteResult::recovery:
        return SaveError(L"Windows could not restore the original file during the save. The original is at " + recoveryPath);
    case FileWriteResult::saved:
        break;
    }
    next.id = choosePath ? std::to_wstring(++g_documentSequence) : current->id;
    const auto json = L"{\"status\":\"saved\",\"documentId\":" + JsonString(next.id) + L",\"name\":" +
        JsonString(std::filesystem::path(next.path).filename().wstring()) + L",\"imageBase\":" +
        JsonString(MapDocumentImages(next)) + L"}";
    g_document = std::move(next);
    return json;
}

std::wstring DecodeSavePayload(const std::wstring& text) {
    std::wstring output;
    output.reserve(text.size());
    for (size_t i = 0; i < text.size(); ++i) {
        if (text[i] == L'%' && i + 2 < text.size()) {
            if (text.compare(i, 3, L"%00") == 0) { output += L'\0'; i += 2; continue; }
            if (text.compare(i, 3, L"%25") == 0) { output += L'%'; i += 2; continue; }
        }
        output += text[i];
    }
    return output;
}

std::wstring ModuleDirectory();

bool IsLocalAppMessage(ICoreWebView2WebMessageReceivedEventArgs* args) {
    LPWSTR url = nullptr;
    if (FAILED(args->get_Source(&url)) || !url) return false;
    wchar_t path[32768]{};
    DWORD length = static_cast<DWORD>(std::size(path));
    const HRESULT parsed = PathCreateFromUrlW(url, path, &length, 0);
    CoTaskMemFree(url);
    const auto expected = std::filesystem::path(ModuleDirectory()) / L"web" / L"index.html";
    return SUCCEEDED(parsed) && _wcsicmp(path, expected.c_str()) == 0;
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
    const size_t argument = message.find(L'|', separator + 1);
    const auto method = message.substr(separator + 1, argument == std::wstring::npos ? argument : argument - separator - 1);
    if (method == L"document.initial") {
        Resolve(id, g_initialTaken ? L"null" : DocumentJson(g_startupPath));
        g_initialTaken = true;
    } else if (method == L"document.open") Resolve(id, g_saving ? L"null" : DocumentJson(PickDocument()));
    else if (method == L"document.save" || method == L"document.saveAs") {
        const size_t body = argument == std::wstring::npos ? argument : message.find(L'|', argument + 1);
        if (g_saving || body == std::wstring::npos || !IsLocalAppMessage(args)) {
            Resolve(id, SaveError(L"The save request could not be completed."));
            return;
        }
        g_saving = true;
        const auto result = SaveDocument(message.substr(argument + 1, body - argument - 1),
            DecodeSavePayload(message.substr(body + 1)), method == L"document.saveAs");
        g_saving = false;
        Resolve(id, result);
    } else if (method == L"document.print") {
        ComPtr<ICoreWebView2_16> printView;
        const bool opened = !g_saving && IsLocalAppMessage(args)
            && SUCCEEDED(g_webView.As(&printView)) && printView
            && SUCCEEDED(printView->ShowPrintUI(COREWEBVIEW2_PRINT_DIALOG_KIND_SYSTEM));
        Resolve(id, opened ? L"true" : L"false");
    } else if (method == L"fonts.list") Resolve(id, FontJson());
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
                g_environment = environment;
                return environment->CreateCoreWebView2Controller(g_window,
                    Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler>(
                        [](HRESULT result2, ICoreWebView2Controller* controller) -> HRESULT {
                            if (FAILED(result2) || !controller) return result2;
                            g_controller = controller;
                            controller->get_CoreWebView2(&g_webView);
                            g_webView->AddWebResourceRequestedFilter(L"https://markdownvision-images.invalid/*",
                                COREWEBVIEW2_WEB_RESOURCE_CONTEXT_IMAGE);
                            EventRegistrationToken imageToken{};
                            g_webView->add_WebResourceRequested(
                                Callback<ICoreWebView2WebResourceRequestedEventHandler>(
                                    [](ICoreWebView2*, ICoreWebView2WebResourceRequestedEventArgs* args) -> HRESULT {
                                        ServeDocumentImage(args);
                                        return S_OK;
                                    }).Get(), &imageToken);
                            ResizeWebView();

                            ComPtr<ICoreWebView2Controller2> controller2;
                            if (SUCCEEDED(controller->QueryInterface(IID_PPV_ARGS(&controller2))) && controller2) {
                                COREWEBVIEW2_COLOR background{255, 28, 28, 27};
                                controller2->put_DefaultBackgroundColor(background);
                            }

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
  const request = (method, payload = '') => new Promise((resolve) => {
    const id = String(nextId++);
    pending.set(id, resolve);
    chrome.webview.postMessage(id + '|' + method + payload);
  });
  window.desktop = {
    getInitialDocument: () => request('document.initial'),
    openMarkdownFile: () => request('document.open'),
    saveMarkdownFile: (documentId, content, saveAs) => request(saveAs ? 'document.saveAs' : 'document.save',
      '|' + (documentId || '') + '|' + content.replaceAll('%', '%25').replaceAll('\0', '%00')),
    printMarkdown: () => request('document.print'),
    listSystemFonts: () => request('fonts.list'),
    onOpenDocument: () => {},
    onFullscreenChange: () => {}
  };
})();
)JS";
                            g_webView->AddScriptToExecuteOnDocumentCreated(bridge, nullptr);

                            EventRegistrationToken token{};
                            controller->add_AcceleratorKeyPressed(
                                Callback<ICoreWebView2AcceleratorKeyPressedEventHandler>(
                                    [](ICoreWebView2Controller*, ICoreWebView2AcceleratorKeyPressedEventArgs* args) -> HRESULT {
                                        UINT key = 0;
                                        COREWEBVIEW2_KEY_EVENT_KIND kind{};
                                        args->get_VirtualKey(&key);
                                        args->get_KeyEventKind(&kind);
                                        if (key == 'P' && kind == COREWEBVIEW2_KEY_EVENT_KIND_KEY_DOWN
                                            && GetKeyState(VK_CONTROL) < 0 && GetKeyState(VK_MENU) >= 0
                                            && GetKeyState(VK_SHIFT) >= 0) {
                                            args->put_Handled(TRUE);
                                            COREWEBVIEW2_PHYSICAL_KEY_STATUS status{};
                                            args->get_PhysicalKeyStatus(&status);
                                            if (!status.WasKeyDown) PostMessageW(g_window, kPrintShortcut, 0, 0);
                                        }
                                        return S_OK;
                                    }).Get(), &token);
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
        SetDocumentTitle(g_startupPath);
        ApplySystemWindowFrame(window);
        InitializeWebView();
        return 0;
    case WM_SETTINGCHANGE:
        ApplySystemWindowFrame(window);
        return 0;
    case WM_SIZE:
        ResizeWebView();
        return 0;
    case kPrintShortcut:
        if (g_webView) g_webView->ExecuteScript(L"window.markdownVisionReader?.printDocument()", nullptr);
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
    windowClass.hIcon = LoadIconW(instance, MAKEINTRESOURCEW(101));
    windowClass.hIconSm = static_cast<HICON>(LoadImageW(
        instance, MAKEINTRESOURCEW(101), IMAGE_ICON,
        GetSystemMetrics(SM_CXSMICON), GetSystemMetrics(SM_CYSMICON), LR_DEFAULTCOLOR));
    static HBRUSH startupBrush = CreateSolidBrush(RGB(28, 28, 27));
    windowClass.hbrBackground = startupBrush;
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
