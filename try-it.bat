@echo off
title PocketTool (test run)
cd /d "%~dp0"
if not exist node_modules (
  echo Installing the building blocks first, this takes a few minutes...
  call npm install --no-audit --no-fund || (pause & exit /b 1)
)
if not exist offline (
  echo Gathering libraries, fonts and AI models...
  call npm run fetch || (pause & exit /b 1)
)
call npm start
