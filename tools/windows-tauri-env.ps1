$repositoryRoot = Split-Path $PSScriptRoot -Parent
$env:RUSTUP_HOME = Join-Path $repositoryRoot '.tmp\rustup'
$env:CARGO_HOME = Join-Path $repositoryRoot '.tmp\cargo'
$cargoBin = Join-Path $env:CARGO_HOME 'bin'
$tauriBin = Join-Path $repositoryRoot '.tmp\tauri-tools\node_modules\.bin'
if (-not (Test-Path (Join-Path $cargoBin 'cargo.exe')) -or
    -not (Test-Path (Join-Path $tauriBin 'tauri.cmd'))) {
  throw 'Workspace Rust or Tauri CLI is missing. See docs/cross-platform-build-environment.md.'
}
$env:Path = "$cargoBin;$tauriBin;$env:Path"
Write-Output 'Workspace Rust and Tauri tools are available in this PowerShell session.'
