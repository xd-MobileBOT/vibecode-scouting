$ErrorActionPreference = "Stop"

. "$PSScriptRoot\resolve-node.ps1"

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$nodeExe = Resolve-ProjectNode
$tscBin = Join-Path $projectRoot "node_modules\typescript\lib\tsc.js"

if (-not (Test-Path -LiteralPath $tscBin)) {
  throw "TypeScript was not found at $tscBin. Run Bun install, then rerun this script."
}

& $nodeExe $tscBin -b
