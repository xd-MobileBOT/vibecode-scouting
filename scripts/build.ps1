$ErrorActionPreference = "Stop"

. "$PSScriptRoot\resolve-node.ps1"

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$nodeExe = Resolve-ProjectNode
$tscBin = Join-Path $projectRoot "node_modules\typescript\lib\tsc.js"
$viteBin = Join-Path $projectRoot "node_modules\vite\bin\vite.js"

& $nodeExe $tscBin -b
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

& $nodeExe $viteBin build
