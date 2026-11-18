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
constexpr wchar_t kDetachedFlag[] = L"--markdown-vision-detached";

constexpr int kOpenButton = 1001;
constexpr int kSettingsButton = 1002;
constexpr int kThemeButton = 1003;
constexpr int kCloseSettings = 1004;
constexpr int kFontCombo = 1005;
constexpr int kSizeTrack = 1006;
constexpr int kLineTrack = 1007;
constexpr int kWidthTrack = 1008;
constexpr int kReader = 1009;
constexpr int kFileName = 1010;
constexpr int kSettingsPanel = 1011;
constexpr int kFontStatus = 1012;
constexpr int kSizeOutput = 1013;
constexpr int kLineOutput = 1014;
constexpr int kWidthOutput = 1015;
constexpr int kFontLabel = 1016;
constexpr int kSizeLabel = 1017;
constexpr int kLineLabel = 1018;
constexpr int kWidthLabel = 1019;

constexpr int kToolbarHeight = 44;
constexpr int kMetaHeight = 28;
constexpr int kSettingsWidth = 334;
constexpr int kSettingsHeight = 286;
constexpr int kToolbarButtonSize = 40;

HWND g_window = nullptr;
HWND g_reader = nullptr;
HWND g_fileName = nullptr;
HWND g_settingsPanel = nullptr;
HWND g_settingsHeading = nullptr;
HWND g_openButton = nullptr;
HWND g_settingsButton = nullptr;
HWND g_themeButton = nullptr;
HWND g_closeSettings = nullptr;
HWND g_fontCombo = nullptr;
HWND g_fontStatus = nullptr;
HWND g_fontLabel = nullptr;
HWND g_sizeTrack = nullptr;
HWND g_lineTrack = nullptr;
HWND g_widthTrack = nullptr;
HWND g_sizeOutput = nullptr;
HWND g_lineOutput = nullptr;
HWND g_widthOutput = nullptr;
HWND g_sizeLabel = nullptr;
HWND g_lineLabel = nullptr;
HWND g_widthLabel = nullptr;

std::wstring g_documentPath;
std::wstring g_markdown;
std::wstring g_font = L"Georgia";
int g_fontSize = 18;
int g_linePercent = 175;
int g_width = 720;
bool g_dark = false;
bool g_settingsVisible = false;
bool g_fontsLoaded = false;
std::vector<std::wstring> g_fonts;

void UpdateFontStatus();

std::wstring Trim(std::wstring value) {
    const auto first = value.find_first_not_of(L" \t\r\n");
    if (first == std::wstring::npos) return {};
    const auto last = value.find_last_not_of(L" \t\r\n");
    return value.substr(first, last - first + 1);
}

std::wstring Lower(std::wstring value) {
    std::transform(value.begin(), value.end(), value.begin(),
        [](wchar_t ch) { return static_cast<wchar_t>(towlower(ch)); });
    return value;
}

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

std::wstring EscapeRtfText(const std::wstring& value) {
    std::wstring escaped;
    escaped.reserve(value.size() * 2);
    for (wchar_t ch : value) {
        if (ch == L'\\' || ch == L'{' || ch == L'}') {
            escaped.push_back(L'\\');
            escaped.push_back(ch);
        } else if (ch == L'\t') {
            escaped += L"\\tab ";
        } else if (ch == L'\n') {
            escaped += L"\\line ";
        } else if (ch >= 32 && ch <= 126) {
            escaped.push_back(ch);
        } else if (ch >= 32) {
            escaped += L"\\u" + std::to_wstring(static_cast<short>(ch)) + L"?";
        }
    }
    return escaped;
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
            return std::wstring(1, static_cast<wchar_t>(
                std::stoul(lower.substr(start, lower.size() - start - 1), nullptr, base)));
        } catch (...) {
        }
    }
    return entity;
}

bool IsSafeUrl(const std::wstring& value) {
    const auto lower = Lower(Trim(value));
    return lower.rfind(L"http://", 0) == 0 || lower.rfind(L"https://", 0) == 0 || lower.rfind(L"mailto:", 0) == 0 ||
        (!lower.empty() && lower[0] == L'#');
}

struct HtmlTag {
    bool closing = false;
    bool selfClosing = false;
    std::wstring name;
    std::wstring href;
    std::wstring src;
    std::wstring alt;
};

HtmlTag ParseHtmlTag(const std::wstring& rawTag) {
    HtmlTag tag;
    const auto trimmed = Trim(rawTag);
    if (trimmed.size() < 3 || trimmed.front() != L'<') return tag;

    size_t index = 1;
    if (trimmed[index] == L'/') {
        tag.closing = true;
        ++index;
    }

    auto body = trimmed.substr(index, trimmed.size() - index - (trimmed.back() == L'>' ? 1 : 0));
    if (!body.empty() && body.back() == L'/') {
        tag.selfClosing = true;
        body.pop_back();
    }
    body = Trim(body);
    if (body.empty()) return tag;

    size_t nameEnd = 0;
    while (nameEnd < body.size() && !iswspace(body[nameEnd])) ++nameEnd;
    tag.name = Lower(body.substr(0, nameEnd));
    if (tag.name.empty()) return tag;

    const std::vector<std::wstring> allowedTags = {
        L"a", L"abbr", L"b", L"br", L"cite", L"code", L"del", L"details", L"div", L"em", L"figure",
        L"figcaption", L"hr", L"i", L"img", L"mark", L"p", L"picture", L"pre", L"s", L"small",
        L"span", L"strong", L"sub", L"summary", L"sup", L"u", L"blockquote", L"li", L"ol", L"ul"
    };
    if (std::find(allowedTags.begin(), allowedTags.end(), tag.name) == allowedTags.end()) {
        tag.name.clear();
        return tag;
    }

    size_t index2 = nameEnd;
    while (index2 < body.size()) {
        while (index2 < body.size() && iswspace(body[index2])) ++index2;
        if (index2 >= body.size()) break;
        const size_t attrStart = index2;
        while (index2 < body.size() && body[index2] != L'=' && !iswspace(body[index2])) ++index2;
        const auto attrName = Lower(body.substr(attrStart, index2 - attrStart));
        while (index2 < body.size() && iswspace(body[index2])) ++index2;

        std::wstring attrValue;
        if (index2 < body.size() && body[index2] == L'=') {
            ++index2;
            while (index2 < body.size() && iswspace(body[index2])) ++index2;
            if (index2 < body.size() && (body[index2] == L'"' || body[index2] == L'\'')) {
                const wchar_t quote = body[index2++];
                const size_t valueStart = index2;
                while (index2 < body.size() && body[index2] != quote) ++index2;
                attrValue = body.substr(valueStart, index2 - valueStart);
                if (index2 < body.size()) ++index2;
            } else {
                const size_t valueStart = index2;
                while (index2 < body.size() && !iswspace(body[index2])) ++index2;
                attrValue = body.substr(valueStart, index2 - valueStart);
            }
        }

        if (attrName.rfind(L"on", 0) == 0) continue;
        if ((attrName == L"href" || attrName == L"src") && !IsSafeUrl(attrValue)) continue;
        if (attrName == L"href") tag.href = attrValue;
        else if (attrName == L"src") tag.src = attrValue;
        else if (attrName == L"alt") tag.alt = attrValue;
    }

    return tag;
}

std::wstring HtmlTagToRtf(const HtmlTag& tag, std::vector<std::wstring>& linkStack) {
    if (tag.name.empty()) return {};

    if (tag.closing) {
        if (tag.name == L"a") {
            if (!linkStack.empty()) linkStack.pop_back();
            return L"\\ul0\\cf1 ";
        }
        if (tag.name == L"b" || tag.name == L"strong") return L"\\b0 ";
        if (tag.name == L"i" || tag.name == L"em") return L"\\i0 ";
        if (tag.name == L"u") return L"\\ul0 ";
        if (tag.name == L"s" || tag.name == L"del") return L"\\strike0 ";
        if (tag.name == L"code" || tag.name == L"pre") return L"\\f1\\highlight0 ";
        if (tag.name == L"p" || tag.name == L"div" || tag.name == L"blockquote" ||
            tag.name == L"figure" || tag.name == L"figcaption" || tag.name == L"details" ||
            tag.name == L"summary" || tag.name == L"li") {
            return L"\\par ";
        }
        return {};
    }

    if (tag.name == L"br") return L"\\line ";
    if (tag.name == L"hr") return L"\\pard\\qc ________________________________\\par ";
    if (tag.name == L"b" || tag.name == L"strong") return L"\\b ";
    if (tag.name == L"i" || tag.name == L"em") return L"\\i ";
    if (tag.name == L"u") return L"\\ul ";
    if (tag.name == L"s" || tag.name == L"del") return L"\\strike ";
    if (tag.name == L"code") return L"\\f2\\highlight3 ";
    if (tag.name == L"pre") return L"\\pard\\f2\\highlight3 ";
    if (tag.name == L"p" || tag.name == L"div" || tag.name == L"blockquote" ||
        tag.name == L"figure" || tag.name == L"figcaption" || tag.name == L"details" ||
        tag.name == L"summary" || tag.name == L"li") {
        return L"\\par ";
    }
    if (tag.name == L"a") {
        if (!tag.href.empty()) {
            linkStack.push_back(tag.href);
            return L"\\ul\\cf2 ";
        }
        return {};
    }
    if (tag.name == L"img") {
        if (!tag.alt.empty()) return EscapeRtfText(tag.alt);
        if (!tag.src.empty()) return EscapeRtfText(tag.src);
        return {};
    }
    return {};
}

std::wstring RtfHyperlink(const std::wstring& text, const std::wstring& url) {
    return L"{\\field{\\*\\fldinst{HYPERLINK \"" + EscapeRtfText(url) + L"\"}}{\\fldrslt{\\ul\\cf2 " +
        EscapeRtfText(text) + L"}}}";
}

std::wstring InlineToRtf(const std::wstring& text) {
    std::wstring output;
    bool bold = false;
    bool italic = false;
    bool code = false;
    std::vector<std::wstring> linkStack;

    for (size_t i = 0; i < text.size();) {
        if (text.compare(i, 2, L"**") == 0 || text.compare(i, 2, L"__") == 0) {
            bold = !bold;
            output += bold ? L"\\b " : L"\\b0 ";
            i += 2;
            continue;
        }
        if (text[i] == L'`') {
            code = !code;
            output += code ? L"\\f2\\highlight3 " : L"\\f1\\highlight0 ";
            ++i;
            continue;
        }
        if (text[i] == L'*' || text[i] == L'_') {
            italic = !italic;
            output += italic ? L"\\i " : L"\\i0 ";
            ++i;
            continue;
        }
        if (text[i] == L'[') {
            const auto close = text.find(L']', i + 1);
            if (close != std::wstring::npos && close + 1 < text.size() && text[close + 1] == L'(') {
                const auto end = text.find(L')', close + 2);
                if (end != std::wstring::npos) {
                    auto label = text.substr(i + 1, close - i - 1);
                    auto url = Trim(text.substr(close + 2, end - close - 2));
                    output += RtfHyperlink(label, url);
                    i = end + 1;
                    continue;
                }
            }
        }
        if (text[i] == L'<') {
            const auto close = text.find(L'>', i + 1);
            if (close != std::wstring::npos) {
                auto tag = ParseHtmlTag(text.substr(i, close - i + 1));
                auto rtf = HtmlTagToRtf(tag, linkStack);
                if (!rtf.empty()) {
                    output += rtf;
                    i = close + 1;
                    continue;
                }
            }
        }
        if (text[i] == L'&') {
            const auto end = text.find(L';', i + 1);
            if (end != std::wstring::npos && end - i < 12) {
                output += EscapeRtfText(DecodeEntity(text.substr(i, end - i + 1)));
                i = end + 1;
                continue;
            }
        }
        output += EscapeRtfText(std::wstring(1, text[i]));
        ++i;
    }

    if (code) output += L"\\f1\\highlight0 ";
    if (italic) output += L"\\i0 ";
    if (bold) output += L"\\b0 ";
    return output;
}

bool IsDividerRow(const std::wstring& line) {
    if (line.find(L'|') == std::wstring::npos) return false;
    for (wchar_t ch : line) {
        if (ch != L'|' && ch != L'-' && ch != L':' && ch != L' ' && ch != L'\t') return false;
    }
    return line.find(L'-') != std::wstring::npos;
}

std::wstring MarkdownToRtf(const std::wstring& markdown) {
    const int textColor = g_dark ? 238 : 42;
    const int mutedColor = g_dark ? 175 : 95;
    const int codeBg = g_dark ? 60 : 235;

    std::wstring rtf = L"{\\rtf1\\ansi\\deff1\\uc1";
    rtf += L"{\\fonttbl{\\f0 Segoe UI;}{\\f1 " + EscapeRtfText(g_font) + L";}{\\f2 Consolas;}}";
    rtf += L"{\\colortbl;";
    rtf += L"\\red" + std::to_wstring(textColor) + L"\\green" + std::to_wstring(textColor) + L"\\blue" + std::to_wstring(textColor) + L";";
    rtf += L"\\red45\\green110\\blue170;";
    rtf += L"\\red" + std::to_wstring(codeBg) + L"\\green" + std::to_wstring(codeBg) + L"\\blue" + std::to_wstring(codeBg) + L";";
    rtf += L"\\red" + std::to_wstring(mutedColor) + L"\\green" + std::to_wstring(mutedColor) + L"\\blue" + std::to_wstring(mutedColor) + L";}";
    rtf += L"\\viewkind4\\pard\\cf1\\f1\\fs" + std::to_wstring(g_fontSize * 2) + L"\\sa180\\sl" +
        std::to_wstring(g_linePercent * 2) + L"\\slmult1 ";

    std::wistringstream stream(markdown);
    std::wstring line;
    bool codeBlock = false;
    bool firstParagraph = true;
    while (std::getline(stream, line)) {
        if (!line.empty() && line.back() == L'\r') line.pop_back();
        auto trimmed = Trim(line);
        if (trimmed.rfind(L"```", 0) == 0 || trimmed.rfind(L"~~~", 0) == 0) {
            codeBlock = !codeBlock;
            if (codeBlock) rtf += L"\\pard\\f2\\highlight3\\fs" + std::to_wstring((g_fontSize - 1) * 2) + L"\\sa60 ";
            else rtf += L"\\highlight0\\f1\\fs" + std::to_wstring(g_fontSize * 2) + L"\\par ";
            continue;
        }
        if (codeBlock) {
            rtf += EscapeRtfText(line) + L"\\line ";
            continue;
        }
        if (trimmed.empty()) {
            if (!firstParagraph) rtf += L"\\par ";
            continue;
        }
        if (trimmed.rfind(L"#", 0) == 0) {
            size_t level = 0;
            while (level < trimmed.size() && trimmed[level] == L'#' && level < 6) ++level;
            if (level > 0 && level < trimmed.size() && trimmed[level] == L' ') {
                rtf += L"\\pard\\cf1\\b\\fs" + std::to_wstring((g_fontSize + static_cast<int>((7 - level) * 3)) * 2) +
                    L" " + InlineToRtf(trimmed.substr(level + 1)) + L"\\b0\\par ";
                firstParagraph = false;
                continue;
            }
        }
        if (trimmed.rfind(L"> ", 0) == 0) {
            rtf += L"\\pard\\li480\\ri240\\cf4\\i " + InlineToRtf(trimmed.substr(2)) + L"\\i0\\cf1\\par ";
        } else if (trimmed.rfind(L"- ", 0) == 0 || trimmed.rfind(L"* ", 0) == 0 || trimmed.rfind(L"+ ", 0) == 0) {
            rtf += L"\\pard\\li480\\fi-240\\bullet\\tab " + InlineToRtf(trimmed.substr(2)) + L"\\par ";
        } else {
            size_t numberEnd = 0;
            while (numberEnd < trimmed.size() && iswdigit(trimmed[numberEnd])) ++numberEnd;
            if (numberEnd > 0 && numberEnd + 1 < trimmed.size() &&
                trimmed[numberEnd] == L'.' && trimmed[numberEnd + 1] == L' ') {
                rtf += L"\\pard\\li480\\fi-300 " + EscapeRtfText(trimmed.substr(0, numberEnd + 1)) +
                    L"\\tab " + InlineToRtf(trimmed.substr(numberEnd + 2)) + L"\\par ";
            } else if (trimmed == L"---" || trimmed == L"***" || trimmed == L"___") {
                rtf += L"\\pard\\qc\\cf4 ________________________________\\cf1\\par ";
            } else if (IsDividerRow(trimmed)) {
                continue;
            } else {
                rtf += L"\\pard\\sa180 " + InlineToRtf(trimmed) + L"\\par ";
            }
        }
        firstParagraph = false;
    }
    rtf += L"}";
    return rtf;
}

std::string WideToUtf8(const std::wstring& value) {
    if (value.empty()) return {};
    const int sizeNeeded = WideCharToMultiByte(CP_UTF8, 0, value.data(), static_cast<int>(value.size()), nullptr, 0, nullptr, nullptr);
    std::string result(sizeNeeded, '\0');
    WideCharToMultiByte(CP_UTF8, 0, value.data(), static_cast<int>(value.size()), result.data(), sizeNeeded, nullptr, nullptr);
    return result;
}

DWORD CALLBACK StreamRtf(DWORD_PTR cookie, LPBYTE buffer, LONG count, LONG* written) {
    auto* stream = reinterpret_cast<std::istringstream*>(cookie);
    stream->read(reinterpret_cast<char*>(buffer), count);
    *written = static_cast<LONG>(stream->gcount());
    return 0;
}

void ApplyControlFont(HWND control) {
    static HFONT font = CreateFontW(-16, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY,
        DEFAULT_PITCH, L"Segoe UI");
    SendMessageW(control, WM_SETFONT, reinterpret_cast<WPARAM>(font), TRUE);
}

void ApplyIconFont(HWND control) {
    static HFONT font = CreateFontW(-18, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY,
        DEFAULT_PITCH, L"Segoe MDL2 Assets");
    SendMessageW(control, WM_SETFONT, reinterpret_cast<WPARAM>(font), TRUE);
}

void UpdateTrackOutputs() {
    SetWindowTextW(g_sizeOutput, (std::to_wstring(g_fontSize) + L"px").c_str());
    std::wstring lineText = std::to_wstring(g_linePercent) + L"%";
    SetWindowTextW(g_lineOutput, lineText.c_str());
    SetWindowTextW(g_widthOutput, (std::to_wstring(g_width) + L"px").c_str());
    SetWindowTextW(g_themeButton, g_dark ? L"Light" : L"Dark");
}

void SyncTrackPositions() {
    SendMessageW(g_sizeTrack, TBM_SETPOS, TRUE, g_fontSize);
    SendMessageW(g_lineTrack, TBM_SETPOS, TRUE, g_linePercent);
    SendMessageW(g_widthTrack, TBM_SETPOS, TRUE, g_width);
    UpdateTrackOutputs();
}

void UpdateReaderMetrics() {
    if (!g_reader) return;
    const RECT client = [] {
        RECT rect{};
        GetClientRect(g_window, &rect);
        return rect;
    }();
    const int availableWidth = std::max(0, static_cast<int>(client.right - client.left) - 48);
    const int desired = std::clamp(g_width, 540, 920);
    const int margin = std::max(16, (availableWidth - desired) / 2);
    SendMessageW(g_reader, EM_SETMARGINS, EC_LEFTMARGIN | EC_RIGHTMARGIN, MAKELPARAM(margin, margin));
}

void RenderDocument() {
    if (!g_reader) return;
    const COLORREF background = g_dark ? RGB(30, 30, 30) : RGB(250, 249, 246);
    const COLORREF text = g_dark ? RGB(238, 236, 232) : RGB(42, 40, 36);
    SendMessageW(g_reader, WM_SETREDRAW, FALSE, 0);
    SendMessageW(g_reader, EM_SETBKGNDCOLOR, 0, background);
    CHARFORMATW format{};
    format.cbSize = sizeof(format);
    format.dwMask = CFM_COLOR | CFM_FACE | CFM_SIZE;
    format.dwEffects = 0;
    format.yHeight = g_fontSize * 20;
    format.crTextColor = text;
    wcsncpy_s(format.szFaceName, g_font.c_str(), _TRUNCATE);
    SendMessageW(g_reader, EM_SETCHARFORMAT, SCF_ALL, reinterpret_cast<LPARAM>(&format));

    auto rtf = WideToUtf8(MarkdownToRtf(g_markdown));
    std::istringstream input(rtf);
    EDITSTREAM editStream{};
    editStream.dwCookie = reinterpret_cast<DWORD_PTR>(&input);
    editStream.pfnCallback = StreamRtf;
    SendMessageW(g_reader, EM_STREAMIN, SF_RTF, reinterpret_cast<LPARAM>(&editStream));
    SendMessageW(g_reader, EM_SETSEL, 0, 0);
    SendMessageW(g_reader, EM_SETREADONLY, TRUE, 0);
    SendMessageW(g_reader, WM_SETREDRAW, TRUE, 0);
    InvalidateRect(g_reader, nullptr, TRUE);
    UpdateReaderMetrics();
}

void ShowDocumentShell(const std::wstring& name) {
    SetWindowTextW(g_fileName, name.c_str());
    ShowWindow(g_fileName, SW_SHOW);
    ShowWindow(g_reader, SW_SHOW);
}

void SetDocument(const std::wstring& path) {
    try {
        g_markdown = ReadTextFile(path);
        g_documentPath = std::filesystem::absolute(path).wstring();
        const auto title = std::wstring(kAppName) + L" - " + std::filesystem::path(path).filename().wstring();
        SetWindowTextW(g_window, title.c_str());
        ShowDocumentShell(std::filesystem::path(path).filename().wstring());
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
    if (g_fontsLoaded) return;
    HDC dc = GetDC(g_window);
    LOGFONTW query{};
    query.lfCharSet = DEFAULT_CHARSET;
    std::vector<std::wstring> fonts;
    EnumFontFamiliesExW(dc, &query, reinterpret_cast<FONTENUMPROCW>(AddFont),
        reinterpret_cast<LPARAM>(&fonts), 0);
    ReleaseDC(g_window, dc);
    std::sort(fonts.begin(), fonts.end());
    fonts.erase(std::unique(fonts.begin(), fonts.end()), fonts.end());
    g_fonts = fonts;
    SendMessageW(g_fontCombo, CB_RESETCONTENT, 0, 0);
    int selection = -1;
    for (const auto& font : g_fonts) {
        const int index = static_cast<int>(SendMessageW(g_fontCombo, CB_ADDSTRING, 0,
            reinterpret_cast<LPARAM>(font.c_str())));
        if (_wcsicmp(font.c_str(), g_font.c_str()) == 0) selection = index;
    }
    if (selection >= 0) SendMessageW(g_fontCombo, CB_SETCURSEL, selection, 0);
    else SetWindowTextW(g_fontCombo, g_font.c_str());
    g_fontsLoaded = true;
    UpdateFontStatus();
}

void SavePreferences() {
    WriteRegistryString(L"Font", g_font);
    WriteRegistryString(L"Size", std::to_wstring(g_fontSize));
    WriteRegistryString(L"Line", std::to_wstring(g_linePercent));
    WriteRegistryString(L"Width", std::to_wstring(g_width));
    WriteRegistryString(L"Theme", g_dark ? L"dark" : L"light");
}

void ApplyFontSelection() {
    wchar_t value[LF_FACESIZE]{};
    GetWindowTextW(g_fontCombo, value, LF_FACESIZE);
    if (*value) {
        g_font = value;
        SavePreferences();
        RenderDocument();
    }
}

void ToggleSettingsVisibility() {
    g_settingsVisible = !g_settingsVisible;
    ShowWindow(g_settingsPanel, g_settingsVisible ? SW_SHOW : SW_HIDE);
    SetWindowTextW(g_settingsButton, g_settingsVisible ? L"Close" : L"Settings");
    if (g_settingsVisible) {
        PopulateFonts();
        SyncTrackPositions();
        UpdateFontStatus();
    }
}

void LayoutControls(HWND window) {
    RECT client{};
    GetClientRect(window, &client);
    const int width = client.right - client.left;
    const int height = client.bottom - client.top;
    const int buttonGap = 7;
    const int right = width - 12;
    const int themeX = right - kToolbarButtonSize;
    const int settingsX = themeX - buttonGap - kToolbarButtonSize;
    const int openX = settingsX - buttonGap - kToolbarButtonSize;
    MoveWindow(g_openButton, openX, 4, kToolbarButtonSize, kToolbarButtonSize, TRUE);
    MoveWindow(g_settingsButton, settingsX, 4, kToolbarButtonSize, kToolbarButtonSize, TRUE);
    MoveWindow(g_themeButton, themeX, 4, kToolbarButtonSize, kToolbarButtonSize, TRUE);

    MoveWindow(g_fileName, 24, kToolbarHeight + 4, std::max(200, width - 48), 24, TRUE);
    MoveWindow(g_reader, 20, kToolbarHeight + kMetaHeight + 8, std::max(0, width - 40), std::max(0, height - (kToolbarHeight + kMetaHeight + 18)), TRUE);
    UpdateReaderMetrics();

    const int panelX = std::max(12, width - kSettingsWidth - 12);
    MoveWindow(g_settingsPanel, panelX, 48, kSettingsWidth, kSettingsHeight, TRUE);
    const int innerX = 14;
    const int innerW = kSettingsWidth - 28;
    MoveWindow(g_settingsHeading, innerX, 12, innerW - 36, 20, TRUE);
    MoveWindow(g_closeSettings, kSettingsWidth - 34, 10, 24, 24, TRUE);
    MoveWindow(g_fontLabel, innerX, 40, innerW - 32, 18, TRUE);
    MoveWindow(g_fontCombo, innerX, 60, innerW, 24, TRUE);
    MoveWindow(g_fontStatus, innerX, 86, innerW, 36, TRUE);
    MoveWindow(g_sizeLabel, innerX, 104, innerW, 18, TRUE);
    MoveWindow(g_sizeTrack, innerX, 124, innerW, 24, TRUE);
    MoveWindow(g_sizeOutput, innerX + innerW - 60, 104, 60, 18, TRUE);
    MoveWindow(g_lineLabel, innerX, 154, innerW, 18, TRUE);
    MoveWindow(g_lineTrack, innerX, 174, innerW, 24, TRUE);
    MoveWindow(g_lineOutput, innerX + innerW - 60, 154, 60, 18, TRUE);
    MoveWindow(g_widthLabel, innerX, 204, innerW, 18, TRUE);
    MoveWindow(g_widthTrack, innerX, 224, innerW, 24, TRUE);
    MoveWindow(g_widthOutput, innerX + innerW - 60, 204, 60, 18, TRUE);
}

void UpdateFontStatus() {
    if (!g_fontsLoaded) {
        SetWindowTextW(g_fontStatus, L"Loading installed fonts...");
        return;
    }
    const std::wstring count = std::to_wstring(g_fonts.size());
    SetWindowTextW(g_fontStatus, (count + L" installed fonts available.").c_str());
}

void ApplyTheme() {
    SetWindowTextW(g_themeButton, g_dark ? L"\u263D" : L"\u263C");
    InvalidateRect(g_window, nullptr, TRUE);
    RenderDocument();
}

void SetSliderRange(HWND slider, int minValue, int maxValue, int tickFreq) {
    SendMessageW(slider, TBM_SETRANGE, TRUE, MAKELPARAM(minValue, maxValue));
    SendMessageW(slider, TBM_SETPAGESIZE, 0, tickFreq);
    SendMessageW(slider, TBM_SETTICFREQ, tickFreq, 0);
}

void CreateUi(HWND window) {
    g_openButton = CreateWindowW(L"BUTTON", L"\uE8E5", WS_CHILD | WS_VISIBLE | BS_FLAT,
        0, 0, kToolbarButtonSize, kToolbarButtonSize, window, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kOpenButton)), nullptr, nullptr);
    g_settingsButton = CreateWindowW(L"BUTTON", L"\uE713", WS_CHILD | WS_VISIBLE | BS_FLAT,
        0, 0, kToolbarButtonSize, kToolbarButtonSize, window, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kSettingsButton)), nullptr, nullptr);
    g_themeButton = CreateWindowW(L"BUTTON", g_dark ? L"\u263D" : L"\u263C", WS_CHILD | WS_VISIBLE | BS_FLAT,
        0, 0, kToolbarButtonSize, kToolbarButtonSize, window, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kThemeButton)), nullptr, nullptr);

    g_fileName = CreateWindowW(L"STATIC", L"", WS_CHILD | SS_LEFT, 0, 0, 100, 24, window, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kFileName)), nullptr, nullptr);
    g_reader = CreateWindowExW(0, MSFTEDIT_CLASS, L"",
        WS_CHILD | WS_VISIBLE | WS_VSCROLL | ES_MULTILINE | ES_READONLY | ES_AUTOVSCROLL | ES_NOHIDESEL,
        0, 0, 100, 100, window, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kReader)), nullptr, nullptr);
    SendMessageW(g_reader, EM_SETEVENTMASK, 0, ENM_LINK);
    SendMessageW(g_reader, EM_AUTOURLDETECT, TRUE, 0);

    g_settingsPanel = CreateWindowExW(WS_EX_TOOLWINDOW, L"STATIC", L"",
        WS_CHILD | WS_BORDER,
        0, 0, kSettingsWidth, kSettingsHeight, window, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kSettingsPanel)), nullptr, nullptr);
    g_settingsHeading = CreateWindowW(L"STATIC", L"Reading settings", WS_CHILD | WS_VISIBLE, 0, 0, 160, 20, g_settingsPanel, nullptr, nullptr, nullptr);
    g_closeSettings = CreateWindowW(L"BUTTON", L"x", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        0, 0, 24, 24, g_settingsPanel, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kCloseSettings)), nullptr, nullptr);
    g_fontLabel = CreateWindowW(L"STATIC", L"System font", WS_CHILD | WS_VISIBLE, 0, 0, 100, 18, g_settingsPanel, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kFontLabel)), nullptr, nullptr);
    g_fontCombo = CreateWindowW(WC_COMBOBOXW, L"", WS_CHILD | WS_VISIBLE | WS_TABSTOP | CBS_DROPDOWN | CBS_AUTOHSCROLL | WS_VSCROLL,
        0, 0, 240, 400, g_settingsPanel, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kFontCombo)), nullptr, nullptr);
    g_fontStatus = CreateWindowW(L"STATIC", L"", WS_CHILD | WS_VISIBLE | SS_LEFT, 0, 0, 100, 36, g_settingsPanel, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kFontStatus)), nullptr, nullptr);

    g_sizeLabel = CreateWindowW(L"STATIC", L"Text size", WS_CHILD | WS_VISIBLE, 0, 0, 100, 18, g_settingsPanel, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kSizeLabel)), nullptr, nullptr);
    g_sizeTrack = CreateWindowW(TRACKBAR_CLASSW, L"", WS_CHILD | WS_VISIBLE | TBS_AUTOTICKS,
        0, 0, 240, 24, g_settingsPanel, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kSizeTrack)), nullptr, nullptr);
    g_sizeOutput = CreateWindowW(L"STATIC", L"", WS_CHILD | WS_VISIBLE | SS_RIGHT, 0, 0, 60, 18, g_settingsPanel, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kSizeOutput)), nullptr, nullptr);

    g_lineLabel = CreateWindowW(L"STATIC", L"Line spacing", WS_CHILD | WS_VISIBLE, 0, 0, 100, 18, g_settingsPanel, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kLineLabel)), nullptr, nullptr);
    g_lineTrack = CreateWindowW(TRACKBAR_CLASSW, L"", WS_CHILD | WS_VISIBLE | TBS_AUTOTICKS,
        0, 0, 240, 24, g_settingsPanel, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kLineTrack)), nullptr, nullptr);
    g_lineOutput = CreateWindowW(L"STATIC", L"", WS_CHILD | WS_VISIBLE | SS_RIGHT, 0, 0, 60, 18, g_settingsPanel, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kLineOutput)), nullptr, nullptr);

    g_widthLabel = CreateWindowW(L"STATIC", L"Page width", WS_CHILD | WS_VISIBLE, 0, 0, 100, 18, g_settingsPanel, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kWidthLabel)), nullptr, nullptr);
    g_widthTrack = CreateWindowW(TRACKBAR_CLASSW, L"", WS_CHILD | WS_VISIBLE | TBS_AUTOTICKS,
        0, 0, 240, 24, g_settingsPanel, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kWidthTrack)), nullptr, nullptr);
    g_widthOutput = CreateWindowW(L"STATIC", L"", WS_CHILD | WS_VISIBLE | SS_RIGHT, 0, 0, 60, 18, g_settingsPanel, reinterpret_cast<HMENU>(static_cast<INT_PTR>(kWidthOutput)), nullptr, nullptr);

    for (HWND control : {g_openButton, g_settingsButton, g_themeButton, g_fileName, g_reader, g_settingsPanel,
        g_settingsHeading, g_closeSettings, g_fontLabel, g_fontCombo, g_fontStatus, g_sizeLabel, g_sizeTrack, g_sizeOutput,
        g_lineLabel, g_lineTrack, g_lineOutput, g_widthLabel, g_widthTrack, g_widthOutput}) {
        ApplyControlFont(control);
    }

    for (HWND control : {g_openButton, g_settingsButton, g_themeButton, g_closeSettings}) {
        ApplyIconFont(control);
    }

    SetSliderRange(g_sizeTrack, 14, 26, 1);
    SetSliderRange(g_lineTrack, 135, 210, 5);
    SetSliderRange(g_widthTrack, 540, 920, 20);

    ShowWindow(g_fileName, SW_HIDE);
    ShowWindow(g_reader, SW_HIDE);
    ShowWindow(g_settingsPanel, SW_HIDE);

    SyncTrackPositions();
    UpdateFontStatus();
    SetWindowTextW(g_themeButton, g_dark ? L"\u263D" : L"\u263C");
}

void ApplyLoadedPreferences() {
    g_font = ReadRegistryString(L"Font", L"Georgia");
    g_fontSize = std::clamp(_wtoi(ReadRegistryString(L"Size", L"18").c_str()), 14, 26);
    g_linePercent = std::clamp(_wtoi(ReadRegistryString(L"Line", L"175").c_str()), 135, 210);
    g_width = std::clamp(_wtoi(ReadRegistryString(L"Width", L"720").c_str()), 540, 920);
    g_dark = ReadRegistryString(L"Theme", L"light") == L"dark";
}

std::wstring StartupDocument() {
    int argumentCount = 0;
    LPWSTR* arguments = CommandLineToArgvW(GetCommandLineW(), &argumentCount);
    std::wstring result;
    for (int i = 1; i < argumentCount; ++i) {
        const std::wstring argument = arguments[i];
        if (_wcsicmp(argument.c_str(), kDetachedFlag) == 0) continue;
        const auto extension = Lower(std::filesystem::path(argument).extension().wstring());
        if ((extension == L".md" || extension == L".markdown" || extension == L".mdown" ||
            extension == L".mkd" || extension == L".txt") && std::filesystem::exists(argument)) {
            result = argument;
            break;
        }
    }
    LocalFree(arguments);
    return result;
}

bool ShouldDetachForStartup(const std::wstring& startupPath) {
    return !startupPath.empty() && std::wstring(GetCommandLineW()).find(kDetachedFlag) == std::wstring::npos;
}

void LaunchDetachedCopy(const std::wstring& path) {
    wchar_t modulePath[MAX_PATH]{};
    GetModuleFileNameW(nullptr, modulePath, MAX_PATH);
    std::wstring commandLine = L"\"";
    commandLine += modulePath;
    commandLine += L"\" ";
    commandLine += kDetachedFlag;
    commandLine += L" \"";
    commandLine += std::filesystem::absolute(path).wstring();
    commandLine += L"\"";

    STARTUPINFOW startup{sizeof(startup)};
    PROCESS_INFORMATION process{};
    if (CreateProcessW(modulePath, commandLine.data(), nullptr, nullptr, FALSE,
        DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP, nullptr, nullptr, &startup, &process)) {
        CloseHandle(process.hThread);
        CloseHandle(process.hProcess);
    }
}

LRESULT CALLBACK WindowProcedure(HWND window, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
    case WM_CREATE:
        g_window = window;
        CreateUi(window);
        if (!g_documentPath.empty()) SetDocument(g_documentPath);
        else RenderDocument();
        return 0;
    case WM_SIZE:
        LayoutControls(window);
        return 0;
    case WM_COMMAND:
        switch (LOWORD(wParam)) {
        case kOpenButton:
            if (HIWORD(wParam) == BN_CLICKED) OpenDocument();
            return 0;
        case kSettingsButton:
            if (HIWORD(wParam) == BN_CLICKED) ToggleSettingsVisibility();
            return 0;
        case kCloseSettings:
            if (HIWORD(wParam) == BN_CLICKED) ToggleSettingsVisibility();
            return 0;
        case kThemeButton:
            if (HIWORD(wParam) == BN_CLICKED) {
                g_dark = !g_dark;
                SavePreferences();
                ApplyTheme();
            }
            return 0;
        case kFontCombo:
            if (HIWORD(wParam) == CBN_SELCHANGE || HIWORD(wParam) == CBN_KILLFOCUS || HIWORD(wParam) == CBN_EDITCHANGE)
                ApplyFontSelection();
            return 0;
        }
        break;
    case WM_HSCROLL:
        if (reinterpret_cast<HWND>(lParam) == g_sizeTrack) {
            g_fontSize = static_cast<int>(SendMessageW(g_sizeTrack, TBM_GETPOS, 0, 0));
            SavePreferences();
            UpdateTrackOutputs();
            RenderDocument();
            return 0;
        }
        if (reinterpret_cast<HWND>(lParam) == g_lineTrack) {
            g_linePercent = static_cast<int>(SendMessageW(g_lineTrack, TBM_GETPOS, 0, 0));
            SavePreferences();
            UpdateTrackOutputs();
            RenderDocument();
            return 0;
        }
        if (reinterpret_cast<HWND>(lParam) == g_widthTrack) {
            g_width = static_cast<int>(SendMessageW(g_widthTrack, TBM_GETPOS, 0, 0));
            SavePreferences();
            UpdateTrackOutputs();
            UpdateReaderMetrics();
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
    case WM_CTLCOLORSTATIC:
    case WM_CTLCOLOREDIT:
    case WM_CTLCOLORLISTBOX: {
        HDC dc = reinterpret_cast<HDC>(wParam);
        SetBkMode(dc, TRANSPARENT);
        SetTextColor(dc, g_dark ? RGB(236, 234, 228) : RGB(48, 44, 40));
        static HBRUSH lightBrush = CreateSolidBrush(RGB(250, 249, 246));
        static HBRUSH darkBrush = CreateSolidBrush(RGB(30, 30, 30));
        return reinterpret_cast<LRESULT>(g_dark ? darkBrush : lightBrush);
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

} // namespace

int APIENTRY wWinMain(HINSTANCE instance, HINSTANCE, LPWSTR, int showCommand) {
    LoadLibraryW(L"Msftedit.dll");
    INITCOMMONCONTROLSEX controls{sizeof(controls), ICC_STANDARD_CLASSES | ICC_BAR_CLASSES};
    InitCommonControlsEx(&controls);

    ApplyLoadedPreferences();
    g_documentPath = StartupDocument();
    if (ShouldDetachForStartup(g_documentPath)) {
        LaunchDetachedCopy(g_documentPath);
        return 0;
    }

    WNDCLASSEXW windowClass{sizeof(windowClass)};
    windowClass.style = CS_HREDRAW | CS_VREDRAW;
    windowClass.lpfnWndProc = WindowProcedure;
    windowClass.hInstance = instance;
    windowClass.hCursor = LoadCursorW(nullptr, IDC_ARROW);
    windowClass.hIcon = LoadIconW(nullptr, IDI_APPLICATION);
    static HBRUSH startupBrush = CreateSolidBrush(RGB(45, 45, 44));
    windowClass.hbrBackground = startupBrush;
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
