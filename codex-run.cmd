@echo off
set "BUN_BIN=%USERPROFILE%\.bun\bin"
set "BUN_EXE=%BUN_BIN%\bun.exe"
set "BUNX_EXE=%BUN_BIN%\bunx.exe"

if not exist "%BUN_EXE%" (
  echo Bun was not found at "%BUN_EXE%".
  echo Install Bun first, then rerun this script.
  exit /b 1
)

if not exist "%BUNX_EXE%" (
  echo Bunx was not found at "%BUNX_EXE%".
  echo Reinstall Bun, then rerun this script.
  exit /b 1
)

set "PATH=%BUN_BIN%;%PATH%"

if /I "%~1"=="/check" (
  "%BUN_EXE%" --version
  exit /b %ERRORLEVEL%
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0codex-run.ps1"
exit /b %ERRORLEVEL%
