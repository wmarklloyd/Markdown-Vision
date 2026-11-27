using System;
using System.Collections.Generic;
using System.Globalization;

namespace MarkdownVision.Native;

internal static class StartupCulture
{
    private static readonly HashSet<string> SupportedLanguages = new(StringComparer.OrdinalIgnoreCase)
    {
        "en", "ar", "zh-hans", "zh-hant", "cs", "nl", "fr", "de", "hi", "id", "it",
        "ja", "ko", "pl", "pt-br", "ru", "es", "sv", "th", "tr", "uk", "vi"
    };

    internal static CultureInfo FromLanguage(string? language, CultureInfo systemCulture)
    {
        language = language?.Trim();
        if (string.IsNullOrWhiteSpace(language) ||
            language.Equals("system", StringComparison.OrdinalIgnoreCase) ||
            !SupportedLanguages.Contains(language))
            return systemCulture;

        var cultureName = language.ToLowerInvariant() switch
        {
            "zh-hans" => "zh-CN",
            "zh-hant" => "zh-TW",
            "pt-br" => "pt-BR",
            _ => language
        };

        try { return CultureInfo.GetCultureInfo(cultureName); }
        catch (CultureNotFoundException) { return systemCulture; }
    }
}
