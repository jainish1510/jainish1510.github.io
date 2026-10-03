@echo off
rem Double-click to start the site on Windows.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org and run this again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing for the first time - this takes a few minutes...
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
)
start "" cmd /c "timeout /t 12 >nul & start http://localhost:3000"
call npm run dev
pause
