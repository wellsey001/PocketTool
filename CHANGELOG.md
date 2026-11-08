# Changes

## 1.1.1

- Fixed: the AI upscaler in the desktop app said it couldn't download its model. The app now bundles the exact library versions the browser version uses, and only serves a bundled file for the exact version asked for.
- The upscaler recognises its model however the model package presents it, and explains what it found if something's missing.
- Builds no longer install the libraries through npm, which removes the npm version warning, and use Node.js 22.

## 1.1.0

- New look: PocketTool logo, deep indigo sidebar with an icon for every tool, consistent tool headers, Instrument Sans typeface, and refined dark mode.
- The desktop app now bundles every library, font and AI model, so it works fully offline.
- Builds for Windows and Linux are made automatically on GitHub.
- Fixes from a full test pass: the date calculator no longer freezes on very large numbers; Sign & add text no longer repeats the date in new text; PDF to images and Fill in forms work with all PDF.js versions; Compress says "bigger" instead of showing a negative saving; clear messages for damaged files and broken JSON; the phone layout uses the full screen width.

## 1.0.0

- First version: image, PDF and everyday utility tools, a Home screen that suggests tools for any file, remembered settings, and Windows and Linux desktop builds.
