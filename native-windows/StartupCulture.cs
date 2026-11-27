using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text.Json;

namespace MarkdownVision.Native;

internal static class StartupCulture
{
    private static readonly HashSet<string> SupportedLanguages = new(StringComparer.OrdinalIgnoreCase)
    {
        "en", "ar", "zh-hans", "zh-hant", "cs", "nl", "fr", "de", "hi", "id", "it",
        "ja", "ko", "pl", "pt-br", "ru", "es", "sv", "th", "tr", "uk", "vi"
    };

    internal static CultureInfo FromPreferences(string preferencesPath, CultureInfo systemCulture)
    {
        try
        {
            using var preferences = JsonDocument.Parse(File.ReadAllText(preferencesPath));
            if (preferences.RootElement.ValueKind == JsonValueKind.Object &&
                preferences.RootElement.TryGetProperty("language", out var language) &&
                language.ValueKind == JsonValueKind.String)
                return FromLanguage(language.GetString(), systemCulture);
        }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
        catch (JsonException) { }

        return systemCulture;
    }

    internal static CultureInfo FromLanguage(string? language, CultureInfo systemCulture)
    {
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
