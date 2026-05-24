$ErrorActionPreference = "Stop"

. "$PSScriptRoot\resolve-node.ps1"

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$viteTemp = Join-Path $projectRoot "node_modules\.vite-temp"
$nodeExe = Resolve-ProjectNode
$viteBin = Join-Path $projectRoot "node_modules\vite\bin\vite.js"

if (Test-Path -LiteralPath $viteTemp) {
  Remove-Item -LiteralPath $viteTemp -Recurse -Force
}

if (-not (Test-Path -LiteralPath $viteBin)) {
  throw "Vite was not found at $viteBin. Run Bun install, then rerun this script."
}

& $nodeExe $viteBin --host 0.0.0.0
