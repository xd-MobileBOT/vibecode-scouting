$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$viteTemp = Join-Path $projectRoot "node_modules\.vite-temp"
$bunBin = Join-Path $env:USERPROFILE ".bun\bin"
$bunxExe = Join-Path $bunBin "bunx.exe"

if (Test-Path -LiteralPath $viteTemp) {
  Remove-Item -LiteralPath $viteTemp -Recurse -Force
}

if (-not (Test-Path -LiteralPath $bunxExe)) {
  throw "Bunx was not found at $bunxExe. Reinstall Bun, then rerun this script."
}

$env:PATH = "$bunBin;$env:PATH"
& $bunxExe vite --host 0.0.0.0
