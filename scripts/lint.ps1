$ErrorActionPreference = "Stop"

. "$PSScriptRoot\resolve-node.ps1"

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$nodeExe = Resolve-ProjectNode
$eslintBin = Join-Path $projectRoot "node_modules\eslint\bin\eslint.js"

if (-not (Test-Path -LiteralPath $eslintBin)) {
  throw "ESLint was not found at $eslintBin. Run Bun install, then rerun this script."
}

& $nodeExe $eslintBin .
