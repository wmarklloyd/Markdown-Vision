param(
  [switch]$Publish
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Test-Path -LiteralPath '.\node_modules')) {
  throw 'Dependencies are missing. Run npm install first.'
}

$env:DEBUG = $null

if ($Publish) {
  npx electron-builder --config electron-builder.json --win
} else {
  npx electron-builder --config electron-builder.json --win --x64
}
