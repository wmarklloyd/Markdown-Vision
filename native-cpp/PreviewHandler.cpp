#include <windows.h>
#include <commctrl.h>
#include <richedit.h>
#include <shobjidl_core.h>
#include <unknwn.h>

#include <algorithm>
#include <filesystem>
#include <fstream>
#include <iterator>
#include <memory>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

#include <wrl.h>

using Microsoft::WRL::ComPtr;

namespace {
constexpr wchar_t kClassName[] = L"MarkdownVisionPreviewHandler";
constexpr wchar_t kAppName[] = L"Markdown Vision Preview Handler";

const CLSID CLSID_MarkdownVisionPreviewHandler =
{ 0x1f0cc1d8, 0x7d91, 0x4f93, { 0x8a, 0x20, 0xa0, 0x9f, 0x3f, 0x71, 0x4d, 0xc8 } };

HINSTANCE g_instance = nullptr;
long g_lockCount = 0;

std::wstring Trim(std::wstring value) {
    const auto first = value.find_first_not_of(L" \t\r\n");
    if (first == std::wstring::npos) return {};
    const auto last = value.find_last_not_of(L" \t\r\n");
    return value.substr(first, last - first + 1);
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

std::wstring Utf8ToWide(const std::string& value) {
    if (value.empty()) return {};
    int length = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, value.data(), static_cast<int>(value.size()), nullptr, 0);
    UINT codePage = CP_UTF8;
    DWORD flags = MB_ERR_INVALID_CHARS;
    if (length == 0) {
        codePage = CP_ACP;
        flags = 0;
        length = MultiByteToWideChar(codePage, flags, value.data(), static_cast<int>(value.size()), nullptr, 0);
    }
    std::wstring result(length, L'\0');
    MultiByteToWideChar(codePage, flags, value.data(), static_cast<int>(value.size()), result.data(), length);
    return result;
}

std::string WideToUtf8(const std::wstring& value) {
    if (value.empty()) return {};
    const int sizeNeeded = WideCharToMultiByte(CP_UTF8, 0, value.data(), static_cast<int>(value.size()), nullptr, 0, nullptr, nullptr);
    std::string result(sizeNeeded, '\0');
    WideCharToMultiByte(CP_UTF8, 0, value.data(), static_cast<int>(value.size()), result.data(), sizeNeeded, nullptr, nullptr);
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

std::wstring ReadTextFileOrMessage(const std::wstring& path) {
    try {
        return ReadTextFile(path);
    } catch (const std::exception& exception) {
        return Utf8ToWide(exception.what());
    }
}

std::wstring InlineToRtf(const std::wstring& text);

bool IsDividerRow(const std::wstring& line) {
    if (line.find(L'|') == std::wstring::npos) return false;
    for (wchar_t ch : line) {
        if (ch != L'|' && ch != L'-' && ch != L':' && ch != L' ' && ch != L'\t') return false;
    }
    return line.find(L'-') != std::wstring::npos;
}

std::wstring MarkdownToRtf(const std::wstring& markdown) {
    const int textColor = 235;
    const int mutedColor = 175;
    const int codeBg = 60;

    std::wstring rtf = L"{\\rtf1\\ansi\\deff1\\uc1";
    rtf += L"{\\fonttbl{\\f0 Segoe UI;}{\\f1 Georgia;}{\\f2 Consolas;}}";
    rtf += L"{\\colortbl;";
    rtf += L"\\red" + std::to_wstring(textColor) + L"\\green" + std::to_wstring(textColor) + L"\\blue" + std::to_wstring(textColor) + L";";
    rtf += L"\\red45\\green110\\blue170;";
    rtf += L"\\red" + std::to_wstring(codeBg) + L"\\green" + std::to_wstring(codeBg) + L"\\blue" + std::to_wstring(codeBg) + L";";
    rtf += L"\\red" + std::to_wstring(mutedColor) + L"\\green" + std::to_wstring(mutedColor) + L"\\blue" + std::to_wstring(mutedColor) + L";}";
    rtf += L"\\viewkind4\\pard\\cf1\\f1\\fs36\\sa180\\sl350\\slmult1 ";

    std::wistringstream stream(markdown);
    std::wstring line;
    bool codeBlock = false;
    bool firstParagraph = true;
    while (std::getline(stream, line)) {
        if (!line.empty() && line.back() == L'\r') line.pop_back();
        const auto trimmed = Trim(line);
        if (trimmed.rfind(L"```", 0) == 0 || trimmed.rfind(L"~~~", 0) == 0) {
            codeBlock = !codeBlock;
            if (codeBlock) rtf += L"\\pard\\f2\\highlight3\\fs34\\sa60 ";
            else rtf += L"\\highlight0\\f1\\fs36\\par ";
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
                rtf += L"\\pard\\cf1\\b\\fs" + std::to_wstring((24 + static_cast<int>((7 - level) * 3)) * 2) +
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

std::wstring InlineToRtf(const std::wstring& text) {
    std::wstring output;
    bool bold = false;
    bool italic = false;
    bool code = false;

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
                    const auto label = text.substr(i + 1, close - i - 1);
                    const auto url = Trim(text.substr(close + 2, end - close - 2));
                    output += L"{\\field{\\*\\fldinst{HYPERLINK \"" + EscapeRtfText(url) + L"\"}}{\\fldrslt{\\ul\\cf2 " +
                        EscapeRtfText(label) + L"}}}";
                    i = end + 1;
                    continue;
                }
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

DWORD CALLBACK StreamRtf(DWORD_PTR cookie, LPBYTE buffer, LONG count, LONG* written) {
    auto* stream = reinterpret_cast<std::istringstream*>(cookie);
    stream->read(reinterpret_cast<char*>(buffer), count);
    *written = static_cast<LONG>(stream->gcount());
    return 0;
}

class PreviewHandler final :
    public IInitializeWithFile,
    public IPreviewHandler,
    public IObjectWithSite,
    public IOleWindow {
public:
    PreviewHandler() = default;
    ~PreviewHandler() {
        if (m_site) m_site->Release();
    }

    STDMETHODIMP QueryInterface(REFIID riid, void** object) override {
        if (!object) return E_POINTER;
        *object = nullptr;
        if (riid == IID_IUnknown || riid == IID_IInitializeWithFile) {
            *object = static_cast<IInitializeWithFile*>(this);
        } else if (riid == IID_IPreviewHandler) {
            *object = static_cast<IPreviewHandler*>(this);
        } else if (riid == IID_IObjectWithSite) {
            *object = static_cast<IObjectWithSite*>(this);
        } else if (riid == IID_IOleWindow) {
            *object = static_cast<IOleWindow*>(this);
        } else {
            return E_NOINTERFACE;
        }
        AddRef();
        return S_OK;
    }

    STDMETHODIMP_(ULONG) AddRef() override { return static_cast<ULONG>(InterlockedIncrement(&m_refs)); }
    STDMETHODIMP_(ULONG) Release() override {
        const auto refs = static_cast<ULONG>(InterlockedDecrement(&m_refs));
        if (!refs) delete this;
        return refs;
    }

    STDMETHODIMP Initialize(LPCWSTR filePath, DWORD) override {
        if (!filePath) return E_INVALIDARG;
        m_filePath = filePath;
        return S_OK;
    }

    STDMETHODIMP SetWindow(HWND hwnd, const RECT* rect) override {
        m_parent = hwnd;
        if (rect) m_rect = *rect;
        if (m_preview) {
            SetParent(m_preview, m_parent);
            MoveWindow(m_preview, 0, 0, Width(), Height(), TRUE);
        }
        return S_OK;
    }

    STDMETHODIMP SetRect(const RECT* rect) override {
        if (rect) m_rect = *rect;
        if (m_preview) MoveWindow(m_preview, 0, 0, Width(), Height(), TRUE);
        return S_OK;
    }

    STDMETHODIMP DoPreview() override {
        if (!m_parent) return E_FAIL;
        EnsureWindow();
        const auto markdown = ReadTextFileOrMessage(m_filePath);
        const auto rtf = MarkdownToRtf(markdown);
        auto utf8 = WideToUtf8(rtf);
        auto stream = std::make_unique<std::istringstream>(utf8);

        EDITSTREAM editStream{};
        editStream.dwCookie = reinterpret_cast<DWORD_PTR>(stream.get());
        editStream.pfnCallback = StreamRtf;
        SendMessageW(m_preview, WM_SETREDRAW, FALSE, 0);
        SendMessageW(m_preview, EM_STREAMIN, SF_RTF, reinterpret_cast<LPARAM>(&editStream));
        SendMessageW(m_preview, EM_SETSEL, 0, 0);
        SendMessageW(m_preview, WM_SETREDRAW, TRUE, 0);
        InvalidateRect(m_preview, nullptr, TRUE);
        m_rtfStream = std::move(stream);
        ShowWindow(m_preview, SW_SHOW);
        UpdateWindow(m_preview);
        return S_OK;
    }

    STDMETHODIMP Unload() override {
        if (m_preview) {
            DestroyWindow(m_preview);
            m_preview = nullptr;
        }
        m_rtfStream.reset();
        m_filePath.clear();
        return S_OK;
    }

    STDMETHODIMP SetFocus() override {
        if (!m_preview) return E_FAIL;
        ::SetFocus(m_preview);
        return S_OK;
    }

    STDMETHODIMP QueryFocus(HWND* hwnd) override {
        if (!hwnd) return E_POINTER;
        *hwnd = ::GetFocus();
        return S_OK;
    }

    STDMETHODIMP TranslateAccelerator(MSG* message) override {
        if (m_frame && message) return m_frame->TranslateAccelerator(message);
        return S_FALSE;
    }

    STDMETHODIMP GetWindow(HWND* hwnd) override {
        if (!hwnd) return E_POINTER;
        if (!m_preview) return E_FAIL;
        *hwnd = m_preview;
        return S_OK;
    }

    STDMETHODIMP ContextSensitiveHelp(BOOL) override { return E_NOTIMPL; }

    STDMETHODIMP SetSite(IUnknown* site) override {
        if (m_site) {
            m_site->Release();
            m_site = nullptr;
        }
        m_site = site;
        if (m_site) m_site->AddRef();
        m_frame.Reset();
        if (m_site) m_site->QueryInterface(__uuidof(IPreviewHandlerFrame), reinterpret_cast<void**>(m_frame.ReleaseAndGetAddressOf()));
        return S_OK;
    }

    STDMETHODIMP GetSite(REFIID riid, void** site) override {
        if (!site) return E_POINTER;
        *site = nullptr;
        if (!m_site) return E_FAIL;
        return m_site->QueryInterface(riid, site);
    }

private:
    int Width() const { return std::max<LONG>(0, m_rect.right - m_rect.left); }
    int Height() const { return std::max<LONG>(0, m_rect.bottom - m_rect.top); }

    void EnsureWindow() {
        if (m_preview) {
            MoveWindow(m_preview, 0, 0, Width(), Height(), TRUE);
            return;
        }

        LoadLibraryW(L"Msftedit.dll");
        m_preview = CreateWindowExW(
            WS_EX_CLIENTEDGE,
            MSFTEDIT_CLASS,
            L"",
            WS_CHILD | WS_VISIBLE | ES_MULTILINE | ES_AUTOVSCROLL | ES_NOHIDESEL | ES_READONLY | WS_VSCROLL,
            0, 0, Width(), Height(),
            m_parent,
            nullptr,
            g_instance,
            nullptr);
        if (!m_preview) throw std::runtime_error("Unable to create preview window.");

        constexpr COLORREF background = RGB(30, 30, 30);
        constexpr COLORREF text = RGB(236, 234, 228);
        SendMessageW(m_preview, EM_SETBKGNDCOLOR, 0, background);
        CHARFORMATW format{};
        format.cbSize = sizeof(format);
        format.dwMask = CFM_COLOR | CFM_FACE | CFM_SIZE;
        format.crTextColor = text;
        format.yHeight = 18 * 2;
        wcscpy_s(format.szFaceName, L"Georgia");
        SendMessageW(m_preview, EM_SETCHARFORMAT, SCF_ALL, reinterpret_cast<LPARAM>(&format));
        MoveWindow(m_preview, 0, 0, Width(), Height(), TRUE);
    }

    long m_refs = 1;
    HWND m_parent = nullptr;
    HWND m_preview = nullptr;
    RECT m_rect{};
    std::wstring m_filePath;
    IUnknown* m_site = nullptr;
    ComPtr<IPreviewHandlerFrame> m_frame;
    std::unique_ptr<std::istringstream> m_rtfStream;
};

class PreviewHandlerClassFactory final : public IClassFactory {
public:
    STDMETHODIMP QueryInterface(REFIID riid, void** object) override {
        if (!object) return E_POINTER;
        *object = nullptr;
        if (riid == IID_IUnknown || riid == IID_IClassFactory) {
            *object = static_cast<IClassFactory*>(this);
            AddRef();
            return S_OK;
        }
        return E_NOINTERFACE;
    }

    STDMETHODIMP_(ULONG) AddRef() override { return static_cast<ULONG>(InterlockedIncrement(&m_refs)); }
    STDMETHODIMP_(ULONG) Release() override {
        const auto refs = static_cast<ULONG>(InterlockedDecrement(&m_refs));
        if (!refs) delete this;
        return refs;
    }

    STDMETHODIMP CreateInstance(IUnknown* outer, REFIID riid, void** object) override {
        if (outer) return CLASS_E_NOAGGREGATION;
        auto* handler = new (std::nothrow) PreviewHandler();
        if (!handler) return E_OUTOFMEMORY;
        const auto hr = handler->QueryInterface(riid, object);
        handler->Release();
        return hr;
    }

    STDMETHODIMP LockServer(BOOL lock) override {
        if (lock) InterlockedIncrement(&g_lockCount);
        else InterlockedDecrement(&g_lockCount);
        return S_OK;
    }

private:
    long m_refs = 1;
};

} // namespace

extern "C" BOOL APIENTRY DllMain(HINSTANCE instance, DWORD reason, LPVOID) {
    if (reason == DLL_PROCESS_ATTACH) {
        g_instance = instance;
        DisableThreadLibraryCalls(instance);
    }
    return TRUE;
}

extern "C" HRESULT __stdcall DllCanUnloadNow() {
    return g_lockCount == 0 ? S_OK : S_FALSE;
}

extern "C" HRESULT __stdcall DllGetClassObject(REFCLSID clsid, REFIID riid, void** object) {
    if (clsid != CLSID_MarkdownVisionPreviewHandler) return CLASS_E_CLASSNOTAVAILABLE;
    auto* factory = new (std::nothrow) PreviewHandlerClassFactory();
    if (!factory) return E_OUTOFMEMORY;
    const auto hr = factory->QueryInterface(riid, object);
    factory->Release();
    return hr;
}
