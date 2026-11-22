param(
    [Parameter(Mandatory = $true)][string]$Root,
    [Parameter(Mandatory = $true)][string]$Output
)

$ErrorActionPreference = 'Stop'
$rootPath = (Resolve-Path -LiteralPath $Root).Path
$assets = @(
    @{ RelativePath = 'index.html'; SourcePath = Join-Path $rootPath 'index.html' },
    @{ RelativePath = 'styles.css'; SourcePath = Join-Path $rootPath 'styles.css' },
    @{ RelativePath = 'app.js'; SourcePath = Join-Path $rootPath 'app.js' },
    @{ RelativePath = 'editor-ui.js'; SourcePath = Join-Path $rootPath 'editor-ui.js' },
    @{ RelativePath = 'vendor/markdown-it.js'; SourcePath = Join-Path $rootPath 'vendor/markdown-it.js' },
    @{ RelativePath = 'vendor/markdown-it-footnote.js'; SourcePath = Join-Path $rootPath 'vendor/markdown-it-footnote.js' }
)

$builder = [System.Text.StringBuilder]::new()
[void]$builder.AppendLine('#pragma once')
[void]$builder.AppendLine('#include <cstddef>')
[void]$builder.AppendLine('struct EmbeddedWebAsset { const wchar_t* path; const unsigned char* data; size_t size; };')

for ($assetIndex = 0; $assetIndex -lt $assets.Count; $assetIndex++) {
    $asset = $assets[$assetIndex]
    $bytes = [System.IO.File]::ReadAllBytes($asset.SourcePath)
    [void]$builder.AppendLine("inline constexpr unsigned char kEmbeddedWebAsset$assetIndex`[] = {")
    for ($offset = 0; $offset -lt $bytes.Length; $offset += 16) {
        $limit = [Math]::Min($offset + 15, $bytes.Length - 1)
        $chunk = for ($i = $offset; $i -le $limit; $i++) { '0x{0:X2}' -f $bytes[$i] }
        [void]$builder.AppendLine('    ' + ($chunk -join ', ') + ',')
    }
    [void]$builder.AppendLine('};')
}

[void]$builder.AppendLine('inline constexpr EmbeddedWebAsset kEmbeddedWebAssets[] = {')
for ($assetIndex = 0; $assetIndex -lt $assets.Count; $assetIndex++) {
    $relativePath = $assets[$assetIndex].RelativePath.Replace('/', '\\')
    $length = (Get-Item -LiteralPath $assets[$assetIndex].SourcePath).Length
    [void]$builder.AppendLine(('    {{ L"{0}", kEmbeddedWebAsset{1}, {2} }},' -f $relativePath, $assetIndex, $length))
}
[void]$builder.AppendLine('};')

$outputPath = [System.IO.Path]::GetFullPath($Output)
[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($outputPath)) | Out-Null
[System.IO.File]::WriteAllText($outputPath, $builder.ToString(), [System.Text.UTF8Encoding]::new($false))
