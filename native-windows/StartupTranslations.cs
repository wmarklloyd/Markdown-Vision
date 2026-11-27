// Generated from docs/LOCALIZATION.md by tools/export-localization.cjs.
using System.Globalization;

namespace MarkdownVision.Native;

internal static class StartupTranslations
{
    internal static (string Message, bool RightToLeft) Format(CultureInfo culture, string error)
    {
        var code = culture.Name.ToLowerInvariant();
        var language = culture.TwoLetterISOLanguageName.ToLowerInvariant();
        if (language == "zh")
            language = code.Contains("-hant") || (!code.Contains("-hans") &&
                (code.EndsWith("-tw") || code.EndsWith("-hk") || code.EndsWith("-mo"))) ? "zh-hant" : "zh-hans";
        else if (language == "pt") language = "pt-br";
        var template = language switch
        {
            "ar" => "تعذر بدء تشغيل Markdown Vision. {error}",
            "zh-hans" => "Markdown Vision无法启动。 {error}",
            "zh-hant" => "Markdown Vision無法啟動。 {error}",
            "cs" => "Markdown Vision nelze spustit. {error}",
            "nl" => "Markdown Vision kon niet starten. {error}",
            "fr" => "Markdown Vision n’a pas pu démarrer. {error}",
            "de" => "Markdown Vision konnte nicht gestartet werden. {error}",
            "hi" => "Markdown Vision प्रारंभ नहीं हो सका. {error}",
            "id" => "Markdown Vision tidak dapat memulai. {error}",
            "it" => "Impossibile avviare Markdown Vision. {error}",
            "ja" => "Markdown Vision を起動できませんでした。 {error}",
            "ko" => "Markdown Vision을 시작할 수 없습니다. {error}",
            "pl" => "Nie można uruchomić Markdown Vision. {error}",
            "pt-br" => "Markdown Vision não pôde ser iniciado. {error}",
            "ru" => "Markdown Vision не удалось запустить. {error}",
            "es" => "Markdown Vision no pudo iniciarse. {error}",
            "sv" => "Markdown Vision kunde inte starta. {error}",
            "th" => "Markdown Vision ไม่สามารถสตาร์ทได้ {error}",
            "tr" => "Markdown Vision başlatılamadı. {error}",
            "uk" => "Markdown Vision не вдалося запустити. {error}",
            "vi" => "Markdown Vision không thể khởi động. {error}",
            _ => "Markdown Vision could not start. {error}",
        };
        var rtl = language == "ar";
        var detail = rtl ? "\u2068" + error + "\u2069" : error;
        return (template.Replace("{error}", detail), rtl);
    }
}
