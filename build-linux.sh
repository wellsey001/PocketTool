#!/usr/bin/env bash
# Builds PocketTool as an AppImage on Linux (including Bazzite).
set -e
cd "$(dirname "$0")"
echo
echo " PocketTool builder (Linux)"
echo " =========================="
echo
if ! command -v node >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo " Node.js isn't installed. Installing it with Homebrew..."
    brew install node
  else
    echo " Node.js isn't installed, and Homebrew wasn't found."
    echo " Install Node.js 20 or newer from https://nodejs.org and run this again."
    exit 1
  fi
fi
echo " Step 1 of 3: installing the building blocks..."
npm install --no-audit --no-fund
echo
echo " Step 2 of 3: gathering libraries, fonts and AI models (about 300 MB the first time)..."
npm run fetch
echo
echo " Step 3 of 3: building PocketTool..."
npm run dist:linux
chmod +x dist/*.AppImage
echo
echo " Done! Your program is in the dist folder:"
ls -1 dist/*.AppImage
echo " Open it with Gear Lever to add PocketTool to your app menu."
xdg-open dist >/dev/null 2>&1 || true
