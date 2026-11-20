$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path $PSScriptRoot -Parent
$localDotnet = Join-Path $repositoryRoot '.tmp\dotnet\dotnet.exe'
$dotnet = if (Test-Path $localDotnet) { $localDotnet } else { 'dotnet' }
$project = Join-Path $PSScriptRoot 'MarkdownVision.Native.csproj'
$output = Join-Path $repositoryRoot 'dist\MarkdownVision-Native-SC-2.8.1-win-x64'

& $dotnet publish $project `
  --configuration Release `
  --runtime win-x64 `
  --self-contained true `
  -p:PublishSingleFile=true `
  -p:IncludeNativeLibrariesForSelfExtract=true `
  -p:EnableCompressionInSingleFile=true `
  --output $output

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$archive = "$output.zip"
if (Test-Path $archive) {
  Remove-Item -LiteralPath $archive
}
Compress-Archive -Path (Join-Path $output '*') -DestinationPath $archive -CompressionLevel Optimal

Write-Output $archive
