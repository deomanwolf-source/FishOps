@echo off
setlocal

cd /d "%~dp0"

set "NODE_DIR="
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_DIR=%ProgramFiles%\nodejs"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_DIR=%ProgramFiles(x86)%\nodejs"
if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE_DIR=%LocalAppData%\Programs\nodejs"
if defined NODE_DIR set "PATH=%NODE_DIR%;%PATH%"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo Install Node.js LTS, then run this file again.
  echo.
  echo Option 1: https://nodejs.org
  echo Option 2: Use PowerShell Admin - winget install OpenJS.NodeJS.LTS
  pause
  exit /b 1
)

echo Starting FishOps backend + web server on port 8080...
echo Use the LAN URL shown in terminal on other computers.
echo.
node server\index.mjs
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
  echo.
  echo Server exited with code %EXIT_CODE%.
  pause
)

exit /b %EXIT_CODE%
