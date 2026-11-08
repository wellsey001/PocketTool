@echo off
title Building PocketTool
cd /d "%~dp0"
echo.
echo  PocketTool builder
echo  ==================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo  Node.js isn't installed yet.
  echo  Download the LTS version from https://nodejs.org, install it,
  echo  then double-click build.bat again.
  echo.
  pause
  exit /b 1
)
echo  Step 1 of 3: installing the building blocks...
call npm install --no-audit --no-fund
if errorlevel 1 goto failed
echo.
echo  Step 2 of 3: gathering libraries, fonts and AI models (about 300 MB the first time)...
call npm run fetch
if errorlevel 1 goto failed
echo.
echo  Step 3 of 3: building PocketTool...
call npm run dist:win
if errorlevel 1 goto failed
echo.
echo  Done! Your PocketTool programs are in the "dist" folder.
start "" "%~dp0dist"
pause
exit /b 0
:failed
echo.
echo  Something went wrong. The messages above say what. Fix it and run build.bat again.
echo.
pause
exit /b 1
