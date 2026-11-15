@echo off
title Building Folio
cd /d "%~dp0"
echo.
echo  Folio builder (Windows)
echo  =======================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo  Node.js isn't installed yet. Download the LTS version from https://nodejs.org,
  echo  install it, then double-click build-folio.bat again.
  echo.
  pause
  exit /b 1
)
echo  Step 1 of 3: installing the building blocks...
call npm install --no-audit --no-fund
if errorlevel 1 goto failed
echo.
echo  Step 2 of 3: gathering the PDF libraries and fonts...
call npm run fetch
if errorlevel 1 goto failed
echo.
echo  Step 3 of 3: building Folio...
call npm run dist:folio
if errorlevel 1 goto failed
echo.
echo  Done! Folio-Setup is in the "dist" folder. Double-click it to install Folio.
start "" "%~dp0dist"
pause
exit /b 0
:failed
echo.
echo  Something went wrong. The messages above say what. Fix it and run build-folio.bat again.
echo.
pause
exit /b 1
