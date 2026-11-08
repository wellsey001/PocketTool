# Building PocketTool

These steps make the PocketTool programs on your own computer. If you only want to use PocketTool, download it from the Releases page instead.

## Windows

1. Install [Node.js](https://nodejs.org): download the version marked **LTS** and accept the default options.
2. Download or clone this project, then double-click **build.bat**.
3. Wait. The first build downloads the building blocks and about 300 MB of AI models, so it can take 10 to 20 minutes. Later builds are much quicker.
4. When it finishes, the **dist** folder opens with:
   - **PocketTool-Setup-1.1.0.exe**, an installer that adds Start menu and desktop shortcuts.
   - **PocketTool-1.1.0-portable.exe**, which runs without installing.

To try PocketTool without building, double-click **try-it.bat**.

## Linux, including Bazzite

1. Open a terminal in the project folder. In the Dolphin file manager, right-click an empty space and choose **Open Terminal Here**.
2. Run `./build-linux.sh` (or `bash build-linux.sh`). If Node.js is missing, the script installs it with Homebrew, which comes with Bazzite.
3. The **dist** folder then contains **PocketTool-1.1.0.AppImage**. Open it with **Gear Lever** from the Bazaar app store to add it to your app menu.

To use PocketTool in Bazzite's Game Mode, add the AppImage to Steam with **Games > Add a Non-Steam Game to My Library** while in Desktop Mode.

## Updating PocketTool

1. Replace `app/index.html` with the new version.
2. Raise the version in `package.json`, for example from `1.1.0` to `1.1.1`.
3. Build again. The AI models are kept, so this is quick.

## If something goes wrong

- **"npm is not recognized"**: restart your computer after installing Node.js, then try again.
- **The fetch step reports problems**: check your internet connection and run `npm run fetch` again. It carries on from where it stopped.
- **Antivirus blocks the build**: allow the project folder, or try again.
- **The AppImage won't start**: run it from a terminal to see the error message.
