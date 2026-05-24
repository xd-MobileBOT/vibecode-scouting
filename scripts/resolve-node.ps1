function Resolve-ProjectNode {
  $bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

  if (Test-Path -LiteralPath $bundledNode) {
    return $bundledNode
  }

  return "node"
}
