using System;
using System.Globalization;
using System.IO;
using MarkdownVision.Native;

static (string Message, bool RightToLeft) Message(string locale) =>
    StartupTranslations.Format(CultureInfo.GetCultureInfo(locale), "DETAIL");

static void Check(bool condition, string description)
{
    if (!condition) throw new Exception(description);
}

var english = Message("en-US");
foreach (var locale in new[] { "ar", "zh-CN", "zh-TW", "cs", "nl", "fr", "de", "hi", "id",
    "it", "ja", "ko", "pl", "pt-BR", "ru", "es", "sv", "th", "tr", "uk", "vi" })
{
    var result = Message(locale);
    Check(result.Message != english.Message, $"{locale}: missing translation");
    Check(result.Message.Contains("DETAIL"), $"{locale}: missing error detail");
    Check(!result.Message.Contains("{error}"), $"{locale}: unsubstituted error placeholder");
}
Check(Message("ar").RightToLeft && !english.RightToLeft, "Arabic text direction");
Check(Message("ar").Message.Contains("\u2068DETAIL\u2069"), "Arabic error detail isolation");
Check(Message("zh-HK").Message == Message("zh-TW").Message, "Traditional Chinese region");
Check(Message("zh-CN").Message != Message("zh-TW").Message, "Chinese script selection");
Check(Message("zh-Hans-TW").Message == Message("zh-CN").Message, "Explicit Simplified script");
Check(Message("zh-Hant-CN").Message == Message("zh-TW").Message, "Explicit Traditional script");
Check(Message("pt-PT").Message == Message("pt-BR").Message, "Portuguese fallback");
Check(Message("is").Message == english.Message, "Unsupported language fallback");
var systemCulture = CultureInfo.GetCultureInfo("fr-FR");
Check(StartupCulture.FromLanguage("system", systemCulture) == systemCulture, "System language override");
Check(StartupCulture.FromLanguage("ar", systemCulture).TwoLetterISOLanguageName == "ar", "External Arabic override");
Check(StartupCulture.FromLanguage("zh-hant", systemCulture).Name == "zh-TW", "External Traditional Chinese override");
Check(StartupCulture.FromLanguage("pt-br", systemCulture).Name == "pt-BR", "External Brazilian Portuguese override");
Check(StartupCulture.FromLanguage("unsupported", systemCulture) == systemCulture, "Unsupported override fallback");
Console.WriteLine("Managed startup localization tests passed.");
