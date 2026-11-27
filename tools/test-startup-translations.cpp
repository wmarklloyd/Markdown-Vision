#include "../native-cpp/StartupTranslations.h"
#include <cassert>
#include <cwchar>
#include <initializer_list>
#include <utility>

int main() {
    const auto english = StartupErrorsForLanguage(0x0409);
    const unsigned supported[] = {0x0401, 0x0405, 0x0413, 0x040c, 0x0407, 0x0439,
        0x0421, 0x0410, 0x0411, 0x0412, 0x0415, 0x0416, 0x0419, 0x0c0a,
        0x041d, 0x041e, 0x041f, 0x0422, 0x042a, 0x0804, 0x0404};
    for (auto language : supported) {
        const auto text = StartupErrorsForLanguage(language);
        assert(std::wcscmp(text.assets, english.assets) != 0);
        assert(std::wcscmp(text.webview, english.webview) != 0);
        assert(std::wcscmp(text.read, english.read) != 0);
    }
    assert(StartupErrorsForLanguage(0x0401).rtl);
    assert(!StartupErrorsForLanguage(0x0409).rtl);
    assert(std::wcscmp(StartupErrorsForLanguage(0x0c04).assets, StartupErrorsForLanguage(0x0404).assets) == 0);
    assert(std::wcscmp(StartupErrorsForLanguage(0x1404).assets, StartupErrorsForLanguage(0x0404).assets) == 0);
    assert(std::wcscmp(StartupErrorsForLanguage(0x0c04).read, StartupErrorsForLanguage(0x0404).read) == 0);
    assert(std::wcscmp(StartupErrorsForLanguage(0x1404).read, StartupErrorsForLanguage(0x0404).read) == 0);
    assert(std::wcscmp(StartupErrorsForLanguage(0x0c04).webview, StartupErrorsForLanguage(0x0404).webview) == 0);
    assert(std::wcscmp(StartupErrorsForLanguage(0x1404).webview, StartupErrorsForLanguage(0x0404).webview) == 0);
    assert(std::wcscmp(StartupErrorsForLanguage(0x7c04).assets, StartupErrorsForLanguage(0x0404).assets) == 0);
    assert(std::wcscmp(StartupErrorsForLanguage(0x0804).assets, StartupErrorsForLanguage(0x0404).assets) != 0);
    assert(std::wcscmp(StartupErrorsForLanguage(0x1004).assets, StartupErrorsForLanguage(0x0804).assets) == 0); // Chinese (Singapore)
    assert(std::wcscmp(StartupErrorsForLanguage(0x1004).webview, StartupErrorsForLanguage(0x0804).webview) == 0);
    assert(std::wcscmp(StartupErrorsForLanguage(0x1004).read, StartupErrorsForLanguage(0x0804).read) == 0);
    for (const auto pair : {std::pair<unsigned, unsigned>{0x0c01, 0x0401}, // Arabic (Egypt)
                            {0x0c0c, 0x040c}, // French (Canada)
                            {0x0c07, 0x0407}, // German (Austria)
                            {0x080a, 0x0c0a}, // Spanish (Mexico)
                            {0x340a, 0x0c0a}, // Spanish (Chile)
                            {0x0816, 0x0416}}) { // Portuguese (Portugal)
        const auto regional = StartupErrorsForLanguage(pair.first);
        const auto primary = StartupErrorsForLanguage(pair.second);
        assert(std::wcscmp(regional.assets, primary.assets) == 0);
        assert(std::wcscmp(regional.webview, primary.webview) == 0);
        assert(std::wcscmp(regional.read, primary.read) == 0);
        assert(regional.rtl == primary.rtl);
    }
    assert(std::wcscmp(StartupErrorsForLanguage(0x040f).assets, english.assets) == 0);
}
