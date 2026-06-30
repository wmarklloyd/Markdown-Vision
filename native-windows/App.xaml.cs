using System.Diagnostics;
using System.IO;
using System.Windows;

namespace MarkdownVision.Native;

public partial class App : Application
{
    private const string DetachedLaunchFlag = "--markdown-vision-detached";

    protected override void OnStartup(StartupEventArgs e)
    {
        if (ShouldDetach(e.Args))
        {
            LaunchDetachedCopy(e.Args);
            Shutdown();
            return;
        }

        base.OnStartup(e);
    }

    private static bool ShouldDetach(IReadOnlyList<string> args)
    {
        return FindDocumentPath(args) is not null && !args.Contains(DetachedLaunchFlag, StringComparer.OrdinalIgnoreCase);
    }

    private static void LaunchDetachedCopy(IReadOnlyList<string> args)
    {
        var documentPath = FindDocumentPath(args);
        if (documentPath is null) return;

        var startInfo = new ProcessStartInfo
        {
            FileName = Environment.ProcessPath ?? throw new InvalidOperationException("Process path unavailable."),
            UseShellExecute = false,
            CreateNoWindow = true,
            WorkingDirectory = Directory.GetCurrentDirectory()
        };
        startInfo.ArgumentList.Add(DetachedLaunchFlag);
        startInfo.ArgumentList.Add(Path.GetFullPath(documentPath));

        Process.Start(startInfo);
    }

    private static string? FindDocumentPath(IEnumerable<string> arguments)
    {
        var supportedExtensions = new HashSet<string>(
            [".md", ".markdown", ".mdown", ".mkd", ".txt"],
            StringComparer.OrdinalIgnoreCase);

        return arguments
            .Select(argument => argument.Trim('"'))
            .FirstOrDefault(argument =>
                !argument.StartsWith('-') &&
                supportedExtensions.Contains(Path.GetExtension(argument)) &&
                File.Exists(argument));
    }
}
