# Changes

## 2.2.0

- New: Folio on its own for Windows. Folio-Setup.exe installs just the PDF app as a standalone program, with its own Start menu entry, desktop shortcut, taskbar icon and settings. It includes only what Folio needs, so it's a small download.
- A standalone Folio opens straight into Folio, with no app switcher and no suggestions for apps that aren't installed, and its update check offers the Folio installer.
- Fix: the family's update check now always offers the PocketTool installer, never another program's.
- Every Windows build now produces both PocketTool and Folio; build-folio.bat (or npm run dist:folio) builds Folio alone.

## 2.1.0

- The desktop download is much smaller: the background remover's AI models are no longer built in.
- On first open, PocketTool asks whether to download these extra packages, showing the size for your computer (about 670 MB with a graphics card, about 270 MB without). Downloads show progress, can be stopped and carried on, resume after interruptions, and every file is checked against its published fingerprint.
- "Not now" is remembered; Lens's background remover asks again when it's needed, and the launcher's new Extra packages section (also Help > Extra packages…) downloads or removes them at any time.
- The web version is unchanged.

## 2.0.0

- PocketTool is now a family: the PocketTool launcher and five focused apps, each with its own name, icon, colour and home screen: Lens (images), Folio (PDFs), Reel (video and audio), Kit (utilities) and Cloak (privacy).
- Each app shows only its own tools. Dropping a file an app doesn't handle offers to open it in the right app; dropping a file on the launcher opens the right app straight away.
- The Password generator has moved to Cloak.
- Desktop: each app opens in its own window with its own taskbar icon; the Windows installer adds a Start menu entry for each app; the new Apps menu (Ctrl+1 to Ctrl+6) opens any app; files are handed to the right app's window.
- Old links such as #compress still work and open the right app.

## 1.4.0

- New "Check for updates" button, and Help > Check for updates… in the desktop app. It compares your version with the latest GitHub release, shows the release notes, and offers the right download: the installer on Windows, the AppImage on Linux, or the web version in a browser. An automatic daily check can be switched on.
- Releases now include the web version (pockettool.html) too.
- Builds stamp the version and repository into the app automatically, taking the version from the release tag.

## 1.3.0

- Remove background now uses BiRefNet, one of the best open cutout models, with three choices: Best quality (full BiRefNet, for computers with a graphics card), Standard (BiRefNet Lite, the default, also works without a graphics card) and People, quick (MODNet). The models are pinned to exact versions.
- New edge clean-up: the outline follows the real edges in your photo, and the halo of old background colour is removed. In testing it more than halved edge errors, with no speckles on busy backgrounds.
- BRIA RMBG-1.4, which was for non-commercial use only, has been removed.

## 1.2.0

- New Video & audio tools: Trim (instant or frame-exact), Compress video (by quality or to a target size), Convert (MP4, WebM, MP3, M4A, WAV), Video to GIF, and Extract audio. Each has a preview with start and end controls, and works offline in the desktop app.
- Home recognises video and audio files and suggests these tools.

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
