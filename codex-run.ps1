param(
  [switch]$Check
)

$ErrorActionPreference = "Stop"

$bunBin = Join-Path $env:USERPROFILE ".bun\bin"
$bunExe = Join-Path $bunBin "bun.exe"
$bunxExe = Join-Path $bunBin "bunx.exe"

if (-not (Test-Path -LiteralPath $bunExe)) {
  throw "Bun was not found at $bunExe. Install Bun first, then rerun this script."
}

if (-not (Test-Path -LiteralPath $bunxExe)) {
  throw "Bunx was not found at $bunxExe. Reinstall Bun, then rerun this script."
}

$env:PATH = "$bunBin;$env:PATH"

if ($Check) {
  & $bunExe --version
  exit $LASTEXITCODE
}

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

& $bunExe install
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$convexProcess = Start-Process `
  -FilePath $bunxExe `
  -ArgumentList @("convex", "dev") `
  -WorkingDirectory $projectRoot `
  -NoNewWindow `
  -PassThru

try {
  & $bunExe run dev
  exit $LASTEXITCODE
} finally {
  if ($convexProcess -and -not $convexProcess.HasExited) {
    Stop-Process -Id $convexProcess.Id -Force -ErrorAction SilentlyContinue
  }
}
