# Changes

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
