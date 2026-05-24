param(
  [switch]$Check
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot\scripts\resolve-node.ps1"

$bunBin = Join-Path $env:USERPROFILE ".bun\bin"
$bunExe = Join-Path $bunBin "bun.exe"
$nodeExe = Resolve-ProjectNode

if (-not (Test-Path -LiteralPath $bunExe)) {
  throw "Bun was not found at $bunExe. Install Bun first, then rerun this script."
}

$env:PATH = "$bunBin;$env:PATH"

if ($Check) {
  & $bunExe --version
  exit $LASTEXITCODE
}

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$nodeModules = Join-Path $projectRoot "node_modules"
if (-not (Test-Path -LiteralPath $nodeModules)) {
  & $bunExe install --ignore-scripts
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

$convexProcess = Start-Process `
  -FilePath $nodeExe `
  -ArgumentList @("node_modules\convex\bin\main.js", "dev") `
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
