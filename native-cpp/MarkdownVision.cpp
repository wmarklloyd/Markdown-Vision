#include <windows.h>
#include <commctrl.h>
#include <commdlg.h>
#include <richedit.h>
#include <shellapi.h>

#include <algorithm>
#include <cctype>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>

namespace {

constexpr wchar_t kClassName[] = L"MarkdownVisionNativeWindow";
constexpr wchar_t kAppName[] = L"Markdown Vision";
constexpr wchar_t kRegistryKey[] = L"Software\\Markdown Vision\\Native";
constexpr int kOpenButton = 1001;
constexpr int kFontCombo = 1002;
constexpr int kSizeCombo = 1003;
constexpr int kThemeButton = 1004;
constexpr int kReader = 1005;
constexpr int kToolbarHeight = 44;

HWND g_window = nullptr;
HWND g_reader = nullptr;
HWND g_fontCombo = nullptr;
HWND g_sizeCombo = nullptr;
HWND g_themeButton = nullptr;
std::wstring g_documentPath;
std::wstring g_markdown;
std::wstring g_font = L"Georgia";
int g_fontSize = 18;
bool g_dark = false;

std::wstring ReadRegistryString(const wchar_t* name, const wchar_t* fallback) {
    wchar_t value[256]{};
    DWORD size = sizeof(value);
    if (RegGetValueW(HKEY_CURRENT_USER, kRegistryKey, name, RRF_RT_REG_SZ, nullptr, value, &size) == ERROR_SUCCESS) {
        return value;
    }
    return fallback;
}

void WriteRegistryString(const wchar_t* name, const std::wstring& value) {
    HKEY key = nullptr;
    if (RegCreateKeyExW(HKEY_CURRENT_USER, kRegistryKey, 0, nullptr, 0, KEY_SET_VALUE, nullptr, &key, nullptr) == ERROR_SUCCESS) {
        RegSetValueExW(key, name, 0, REG_SZ,
            reinterpret_cast<const BYTE*>(value.c_str()),
            static_cast<DWORD>((value.size() + 1) * sizeof(wchar_t)));
        RegCloseKey(key);
    }
}

std::wstring Utf8ToWide(const std::string& value) {
    if (value.empty()) return {};
    int length = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, value.data(),
        static_cast<int>(value.size()), nullptr, 0);
    UINT codePage = CP_UTF8;
    DWORD flags = MB_ERR_INVALID_CHARS;
    if (length == 0) {
        codePage = CP_ACP;
        flags = 0;
        length = MultiByteToWideChar(codePage, flags, value.data(),
            static_cast<int>(value.size()), nullptr, 0);
    }
    std::wstring result(length, L'\0');
    MultiByteToWideChar(codePage, flags, value.data(), static_cast<int>(value.size()), result.data(), length);
    return result;
}

std::wstring ReadTextFile(const std::wstring& path) {
    std::ifstream stream(std::filesystem::path(path), std::ios::binary);
    if (!stream) throw std::runtime_error("Unable to open the document.");
    std::string bytes((std::istreambuf_iterator<char>(stream)), std::istreambuf_iterator<char>());
    if (bytes.size() >= 3 &&
        static_cast<unsigned char>(bytes[0]) == 0xEF &&
        static_cast<unsigned char>(bytes[1]) == 0xBB &&
        static_cast<unsigned char>(bytes[2]) == 0xBF) {
        bytes.erase(0, 3);
    }
    return Utf8ToWide(bytes);
}

std::wstring Trim(std::wstring value) {
    const auto first = value.find_first_not_of(L" \t\r");
    if (first == std::wstring::npos) return {};
    const auto last = value.find_last_not_of(L" \t\r");
    return value.substr(first, last - first + 1);
}

std::wstring Lower(std::wstring value) {
    std::transform(value.begin(), value.end(), value.begin(),
        [](wchar_t ch) { return static_cast<wchar_t>(towlower(ch)); });
    return value;
}

std::string RtfEscape(const std::wstring& value) {
    std::string result;
    for (wchar_t ch : value) {
        if (ch == L'\\' || ch == L'{' || ch == L'}') {
            result.push_back('\\');
            result.push_back(static_cast<char>(ch));
        } else if (ch == L'\t') {
            result += "\\tab ";
        } else if (ch == L'\n') {
            result += "\\line ";
        } else if (ch >= 32 && ch <= 126) {
            result.push_back(static_cast<char>(ch));
        } else if (ch >= 32) {
            const short signedValue = static_cast<short>(ch);
            result += "\\u" + std::to_string(signedValue) + "?";
        }
    }
    return result;
}

std::wstring DecodeEntity(const std::wstring& entity) {
    const auto lower = Lower(entity);
    if (lower == L"&amp;") return L"&";
    if (lower == L"&lt;") return L"<";
    if (lower == L"&gt;") return L">";
    if (lower == L"&quot;") return L"\"";
    if (lower == L"&#39;" || lower == L"&apos;") return L"'";
    if (lower == L"&nbsp;") return L" ";
    if (lower.size() > 3 && lower[1] == L'#') {
        try {
            int base = 10;
            size_t start = 2;
            if (lower[start] == L'x') {
                base = 16;
                ++start;
            }
            return std::wstring(1, static_cast<wchar_t>(std::stoul(lower.substr(start, lower.size() - start - 1), nullptr, base)));
        } catch (...) {
        }
    }
    return entity;
}

std::string InlineToRtf(const std::wstring& text) {
    std::string output;
    bool bold = false;
    bool italic = false;
    bool code = false;

    for (size_t i = 0; i < text.size();) {
        if (text.compare(i, 2, L"**") == 0 || text.compare(i, 2, L"__") == 0) {
            bold = !bold;
            output += bold ? "\\b " : "\\b0 ";
            i += 2;
            continue;
        }
        if (text[i] == L'`') {
            code = !code;
            output += code ? "\\f2\\highlight3 " : "\\f1\\highlight0 ";
            ++i;
            continue;
        }
        if (text[i] == L'*' || text[i] == L'_') {
            italic = !italic;
            output += italic ? "\\i " : "\\i0 ";
            ++i;
            continue;
        }
        if (text[i] == L'[') {
            const auto close = text.find(L']', i + 1);
            if (close != std::wstring::npos && close + 1 < text.size() && text[close + 1] == L'(') {
                const auto end = text.find(L')', close + 2);
                if (end != std::wstring::npos) {
                    output += "\\cf2\\ul " + RtfEscape(text.substr(i + 1, close - i - 1)) + "\\ul0\\cf1 ";
                    i = end + 1;
                    continue;
                }
            }
        }
        if (text[i] == L'<') {
            const auto close = text.find(L'>', i + 1);
            if (close != std::wstring::npos) {
                auto tag = Lower(Trim(text.substr(i + 1, close - i - 1)));
                const auto space = tag.find(L' ');
                if (space != std::wstring::npos) tag.resize(space);
                if (tag == L"br" || tag == L"br/" || tag == L"p" || tag == L"/p" ||
                    tag == L"div" || tag == L"/div") output += "\\line ";
                else if (tag == L"b" || tag == L"strong") output += "\\b ";
                else if (tag == L"/b" || tag == L"/strong") output += "\\b0 ";
                else if (tag == L"i" || tag == L"em") output += "\\i ";
                else if (tag == L"/i" || tag == L"/em") output += "\\i0 ";
                else if (tag == L"u") output += "\\ul ";
                else if (tag == L"/u") output += "\\ul0 ";
                else if (tag == L"code" || tag == L"pre") output += "\\f2\\highlight3 ";
                else if (tag == L"/code" || tag == L"/pre") output += "\\f1\\highlight0 ";
                else if (tag == L"li") output += "\\line\\bullet\\tab ";
                else if (tag == L"hr" || tag == L"hr/") output += "\\line ________________________________\\line ";
                i = close + 1;
                continue;
            }
        }
        if (text[i] == L'&') {
            const auto end = text.find(L';', i + 1);
            if (end != std::wstring::npos && end - i < 12) {
                output += RtfEscape(DecodeEntity(text.substr(i, end - i + 1)));
                i = end + 1;
                continue;
            }
        }
        output += RtfEscape(std::wstring(1, text[i]));
        ++i;
    }
    if (code) output += "\\f1\\highlight0 ";
    if (italic) output += "\\i0 ";
    if (bold) output += "\\b0 ";
    return output;
}

bool IsDividerRow(const std::wstring& line) {
    if (line.find(L'|') == std::wstring::npos) return false;
    for (wchar_t ch : line) {
        if (ch != L'|' && ch != L'-' && ch != L':' && ch != L' ' && ch != L'\t') return false;
    }
    return line.find(L'-') != std::wstring::npos;
}

std::string MarkdownToRtf(const std::wstring& markdown) {
    const int foreground = g_dark ? 238 : 42;
    const int muted = g_dark ? 175 : 95;
    const int backgroundCode = g_dark ? 52 : 235;
    std::string rtf = "{\\rtf1\\ansi\\deff1\\uc1";
    rtf += "{\\fonttbl{\\f0 Segoe UI;}{\\f1 " + RtfEscape(g_font) + ";}{\\f2 Consolas;}}";
    rtf += "{\\colortbl;";
    rtf += "\\red" + std::to_string(foreground) + "\\green" + std::to_string(foreground) + "\\blue" + std::to_string(foreground) + ";";
    rtf += "\\red45\\green110\\blue170;";
    rtf += "\\red" + std::to_string(backgroundCode) + "\\green" + std::to_string(backgroundCode) + "\\blue" + std::to_string(backgroundCode) + ";";
    rtf += "\\red" + std::to_string(muted) + "\\green" + std::to_string(muted) + "\\blue" + std::to_string(muted) + ";}";
    rtf += "\\viewkind4\\pard\\cf1\\f1\\fs" + std::to_string(g_fontSize * 2) + "\\sa180\\sl360\\slmult1 ";

    std::wistringstream stream(markdown);
    std::wstring line;
    bool codeBlock = false;
    bool firstParagraph = true;
    while (std::getline(stream, line)) {
        if (!line.empty() && line.back() == L'\r') line.pop_back();
        auto trimmed = Trim(line);
        if (trimmed.rfind(L"```", 0) == 0 || trimmed.rfind(L"~~~", 0) == 0) {
            codeBlock = !codeBlock;
            if (codeBlock) rtf += "\\pard\\f2\\highlight3\\fs" + std::to_string((g_fontSize - 1) * 2) + "\\sa60 ";
            else rtf += "\\highlight0\\f1\\fs" + std::to_string(g_fontSize * 2) + "\\par ";
            continue;
        }
        if (codeBlock) {
            rtf += RtfEscape(line) + "\\line ";
            continue;
        }
        if (trimmed.empty()) {
            if (!firstParagraph) rtf += "\\par ";
            continue;
        }
        if (IsDividerRow(trimmed)) continue;

        int heading = 0;
        while (heading < 6 && heading < static_cast<int>(trimmed.size()) && trimmed[heading] == L'#') ++heading;
        if (heading > 0 && heading < static_cast<int>(trimmed.size()) && trimmed[heading] == L' ') {
            const int sizes[] = {0, 36, 30, 26, 23, 21, 19};
            rtf += "\\pard\\keepn\\b\\fs" + std::to_string(sizes[heading] * 2) + "\\sa180 ";
            rtf += InlineToRtf(trimmed.substr(heading + 1));
            rtf += "\\b0\\fs" + std::to_string(g_fontSize * 2) + "\\par ";
        } else if (trimmed.rfind(L">", 0) == 0) {
            auto quote = Trim(trimmed.substr(1));
            rtf += "\\pard\\li480\\ri240\\cf4\\i " + InlineToRtf(quote) + "\\i0\\cf1\\par ";
        } else if (trimmed.rfind(L"- ", 0) == 0 || trimmed.rfind(L"* ", 0) == 0 || trimmed.rfind(L"+ ", 0) == 0) {
            rtf += "\\pard\\li480\\fi-240\\bullet\\tab " + InlineToRtf(trimmed.substr(2)) + "\\par ";
        } else {
            size_t numberEnd = 0;
            while (numberEnd < trimmed.size() && iswdigit(trimmed[numberEnd])) ++numberEnd;
            if (numberEnd > 0 && numberEnd + 1 < trimmed.size() &&
                trimmed[numberEnd] == L'.' && trimmed[numberEnd + 1] == L' ') {
                rtf += "\\pard\\li480\\fi-300 " + RtfEscape(trimmed.substr(0, numberEnd + 1)) +
                    "\\tab " + InlineToRtf(trimmed.substr(numberEnd + 2)) + "\\par ";
            } else if (trimmed == L"---" || trimmed == L"***" || trimmed == L"___") {
                rtf += "\\pard\\qc\\cf4 ________________________________\\cf1\\par ";
            } else {
                rtf += "\\pard\\sa180 " + InlineToRtf(trimmed) + "\\par ";
            }
        }
        firstParagraph = false;
    }
    rtf += "}";
    return rtf;
}

DWORD CALLBACK StreamRtf(DWORD_PTR cookie, LPBYTE buffer, LONG count, LONG* written) {
    auto* stream = reinterpret_cast<std::istringstream*>(cookie);
    stream->read(reinterpret_cast<char*>(buffer), count);
    *written = static_cast<LONG>(stream->gcount());
    return 0;
}

void RenderDocument() {
    if (!g_reader) return;
    SendMessageW(g_reader, WM_SETREDRAW, FALSE, 0);
    const COLORREF background = g_dark ? RGB(30, 30, 30) : RGB(250, 249, 246);
    SendMessageW(g_reader, EM_SETBKGNDCOLOR, 0, background);
    auto rtf = MarkdownToRtf(g_markdown);
    std::istringstream input(rtf);
    EDITSTREAM editStream{reinterpret_cast<DWORD_PTR>(&input), 0, StreamRtf};
    SendMessageW(g_reader, EM_STREAMIN, SF_RTF, reinterpret_cast<LPARAM>(&editStream));
    SendMessageW(g_reader, EM_SETSEL, 0, 0);
    SendMessageW(g_reader, EM_SETREADONLY, TRUE, 0);
    SendMessageW(g_reader, WM_SETREDRAW, TRUE, 0);
    InvalidateRect(g_reader, nullptr, TRUE);
}

void SetDocument(const std::wstring& path) {
    try {
        g_markdown = ReadTextFile(path);
        g_documentPath = std::filesystem::absolute(path).wstring();
        const auto title = std::wstring(kAppName) + L" - " + std::filesystem::path(path).filename().wstring();
        SetWindowTextW(g_window, title.c_str());
        RenderDocument();
    } catch (const std::exception& exception) {
        MessageBoxA(g_window, exception.what(), "Markdown Vision", MB_OK | MB_ICONERROR);
    }
}

void OpenDocument() {
    wchar_t filePath[MAX_PATH]{};
    OPENFILENAMEW dialog{sizeof(dialog)};
    dialog.hwndOwner = g_window;
    dialog.lpstrFilter =
        L"Markdown files (*.md;*.markdown;*.mdown;*.mkd)\0*.md;*.markdown;*.mdown;*.mkd\0"
        L"Text files (*.txt)\0*.txt\0All files (*.*)\0*.*\0";
    dialog.lpstrFile = filePath;
    dialog.nMaxFile = MAX_PATH;
    dialog.Flags = OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST;
    dialog.lpstrTitle = L"Open Markdown file";
    if (GetOpenFileNameW(&dialog)) SetDocument(filePath);
}

int CALLBACK AddFont(const LOGFONTW* font, const TEXTMETRICW*, DWORD, LPARAM parameter) {
    auto* fonts = reinterpret_cast<std::vector<std::wstring>*>(parameter);
    if (font->lfFaceName[0] != L'@') fonts->emplace_back(font->lfFaceName);
    return 1;
}

void PopulateFonts() {
    HDC dc = GetDC(g_window);
    LOGFONTW query{};
    query.lfCharSet = DEFAULT_CHARSET;
    std::vector<std::wstring> fonts;
    EnumFontFamiliesExW(dc, &query, reinterpret_cast<FONTENUMPROCW>(AddFont),
        reinterpret_cast<LPARAM>(&fonts), 0);
    ReleaseDC(g_window, dc);
    std::sort(fonts.begin(), fonts.end());
    fonts.erase(std::unique(fonts.begin(), fonts.end()), fonts.end());
    int selection = -1;
    for (const auto& font : fonts) {
        const int index = static_cast<int>(SendMessageW(g_fontCombo, CB_ADDSTRING, 0,
            reinterpret_cast<LPARAM>(font.c_str())));
        if (_wcsicmp(font.c_str(), g_font.c_str()) == 0) selection = index;
    }
    if (selection >= 0) SendMessageW(g_fontCombo, CB_SETCURSEL, selection, 0);
    else SetWindowTextW(g_fontCombo, g_font.c_str());
}

void ApplyToolbarFont(HWND control) {
    static HFONT font = CreateFontW(-16, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY,
        DEFAULT_PITCH, L"Segoe UI");
    SendMessageW(control, WM_SETFONT, reinterpret_cast<WPARAM>(font), TRUE);
}

void SaveAndRenderFont() {
    wchar_t value[LF_FACESIZE]{};
    GetWindowTextW(g_fontCombo, value, LF_FACESIZE);
    if (*value) {
        g_font = value;
        WriteRegistryString(L"Font", g_font);
        RenderDocument();
    }
}

LRESULT CALLBACK WindowProcedure(HWND window, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
    case WM_CREATE: {
        g_window = window;
        CreateWindowW(L"BUTTON", L"Open...", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
            10, 8, 72, 28, window, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kOpenButton)), nullptr, nullptr);
        CreateWindowW(L"STATIC", L"Font:", WS_CHILD | WS_VISIBLE | SS_CENTERIMAGE,
            96, 8, 38, 28, window, nullptr, nullptr, nullptr);
        g_fontCombo = CreateWindowW(WC_COMBOBOXW, L"", WS_CHILD | WS_VISIBLE | WS_TABSTOP |
            CBS_DROPDOWN | CBS_AUTOHSCROLL | WS_VSCROLL,
            136, 8, 230, 400, window, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kFontCombo)), nullptr, nullptr);
        CreateWindowW(L"STATIC", L"Size:", WS_CHILD | WS_VISIBLE | SS_CENTERIMAGE,
            380, 8, 36, 28, window, nullptr, nullptr, nullptr);
        g_sizeCombo = CreateWindowW(WC_COMBOBOXW, L"", WS_CHILD | WS_VISIBLE | WS_TABSTOP |
            CBS_DROPDOWNLIST | WS_VSCROLL,
            418, 8, 62, 300, window, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kSizeCombo)), nullptr, nullptr);
        g_themeButton = CreateWindowW(L"BUTTON", g_dark ? L"Light" : L"Dark",
            WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
            494, 8, 66, 28, window, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kThemeButton)), nullptr, nullptr);
        g_reader = CreateWindowExW(0, MSFTEDIT_CLASS, L"",
            WS_CHILD | WS_VISIBLE | WS_VSCROLL | ES_MULTILINE | ES_READONLY |
            ES_AUTOVSCROLL | ES_NOHIDESEL,
            0, kToolbarHeight, 100, 100, window, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kReader)), nullptr, nullptr);
        SendMessageW(g_reader, EM_SETEVENTMASK, 0, ENM_LINK);
        SendMessageW(g_reader, EM_AUTOURLDETECT, TRUE, 0);
        for (HWND control = GetWindow(window, GW_CHILD); control; control = GetWindow(control, GW_HWNDNEXT))
            ApplyToolbarFont(control);
        for (int size = 14; size <= 26; ++size) {
            const auto value = std::to_wstring(size);
            int index = static_cast<int>(SendMessageW(g_sizeCombo, CB_ADDSTRING, 0,
                reinterpret_cast<LPARAM>(value.c_str())));
            if (size == g_fontSize) SendMessageW(g_sizeCombo, CB_SETCURSEL, index, 0);
        }
        PopulateFonts();
        if (!g_documentPath.empty()) SetDocument(g_documentPath);
        else RenderDocument();
        return 0;
    }
    case WM_SIZE: {
        const int width = LOWORD(lParam);
        const int height = HIWORD(lParam);
        MoveWindow(g_reader, 0, kToolbarHeight, width, std::max(0, height - kToolbarHeight), TRUE);
        return 0;
    }
    case WM_COMMAND:
        switch (LOWORD(wParam)) {
        case kOpenButton:
            if (HIWORD(wParam) == BN_CLICKED) OpenDocument();
            return 0;
        case kThemeButton:
            if (HIWORD(wParam) == BN_CLICKED) {
                g_dark = !g_dark;
                WriteRegistryString(L"Theme", g_dark ? L"dark" : L"light");
                SetWindowTextW(g_themeButton, g_dark ? L"Light" : L"Dark");
                RenderDocument();
            }
            return 0;
        case kFontCombo:
            if (HIWORD(wParam) == CBN_SELCHANGE || HIWORD(wParam) == CBN_KILLFOCUS)
                SaveAndRenderFont();
            return 0;
        case kSizeCombo:
            if (HIWORD(wParam) == CBN_SELCHANGE) {
                wchar_t value[8]{};
                GetWindowTextW(g_sizeCombo, value, 8);
                g_fontSize = _wtoi(value);
                WriteRegistryString(L"Size", value);
                RenderDocument();
            }
            return 0;
        }
        break;
    case WM_NOTIFY: {
        const auto* header = reinterpret_cast<NMHDR*>(lParam);
        if (header->idFrom == kReader && header->code == EN_LINK) {
            const auto* link = reinterpret_cast<ENLINK*>(lParam);
            if (link->msg == WM_LBUTTONUP) {
                TEXTRANGEW range{link->chrg, nullptr};
                std::vector<wchar_t> value(link->chrg.cpMax - link->chrg.cpMin + 1);
                range.lpstrText = value.data();
                SendMessageW(g_reader, EM_GETTEXTRANGE, 0, reinterpret_cast<LPARAM>(&range));
                ShellExecuteW(window, L"open", value.data(), nullptr, nullptr, SW_SHOWNORMAL);
            }
        }
        return 0;
    }
    case WM_GETMINMAXINFO:
        reinterpret_cast<MINMAXINFO*>(lParam)->ptMinTrackSize = {680, 520};
        return 0;
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProcW(window, message, wParam, lParam);
}

std::wstring StartupDocument() {
    int argumentCount = 0;
    LPWSTR* arguments = CommandLineToArgvW(GetCommandLineW(), &argumentCount);
    std::wstring result;
    for (int i = 1; i < argumentCount; ++i) {
        const auto extension = Lower(std::filesystem::path(arguments[i]).extension().wstring());
        if ((extension == L".md" || extension == L".markdown" || extension == L".mdown" ||
            extension == L".mkd" || extension == L".txt") && std::filesystem::exists(arguments[i])) {
            result = arguments[i];
            break;
        }
    }
    LocalFree(arguments);
    return result;
}

} // namespace

int APIENTRY wWinMain(HINSTANCE instance, HINSTANCE, LPWSTR, int showCommand) {
    LoadLibraryW(L"Msftedit.dll");
    INITCOMMONCONTROLSEX controls{sizeof(controls), ICC_STANDARD_CLASSES};
    InitCommonControlsEx(&controls);

    g_font = ReadRegistryString(L"Font", L"Georgia");
    g_fontSize = std::clamp(_wtoi(ReadRegistryString(L"Size", L"18").c_str()), 14, 26);
    g_dark = ReadRegistryString(L"Theme", L"light") == L"dark";
    g_documentPath = StartupDocument();

    WNDCLASSEXW windowClass{sizeof(windowClass)};
    windowClass.style = CS_HREDRAW | CS_VREDRAW;
    windowClass.lpfnWndProc = WindowProcedure;
    windowClass.hInstance = instance;
    windowClass.hCursor = LoadCursorW(nullptr, IDC_ARROW);
    windowClass.hIcon = LoadIconW(nullptr, IDI_APPLICATION);
    windowClass.hbrBackground = reinterpret_cast<HBRUSH>(COLOR_WINDOW + 1);
    windowClass.lpszClassName = kClassName;
    RegisterClassExW(&windowClass);

    g_window = CreateWindowExW(0, kClassName, kAppName, WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT, 1180, 820, nullptr, nullptr, instance, nullptr);
    if (!g_window) return 1;
    ShowWindow(g_window, showCommand);
    UpdateWindow(g_window);

    MSG message{};
    while (GetMessageW(&message, nullptr, 0, 0) > 0) {
        TranslateMessage(&message);
        DispatchMessageW(&message);
    }
    return static_cast<int>(message.wParam);
}
