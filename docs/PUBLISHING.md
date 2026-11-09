# Putting PocketTool on GitHub

## 1. Create the repository

1. Sign in to [github.com](https://github.com) and choose **New repository** (the **+** at the top right).
2. Name it `pockettool`, choose **Public** or **Private**, and leave "Add a README" unticked, because this project already has one.
3. Select **Create repository**.

## 2. Upload the project

The easiest way is [GitHub Desktop](https://desktop.github.com):

1. In GitHub Desktop, choose **File > Add local repository**, pick the `pockettool` folder, and when asked, choose **create a repository**.
2. Select **Publish repository**, choose your account and select **Publish**.

Or, with Git on the command line, from inside the `pockettool` folder:

```bash
git init
git add .
git commit -m "PocketTool 1.1.0"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/pockettool.git
git push -u origin main
```

Uploading through the GitHub website also works, but make sure the hidden `.github` folder is included, because that's what runs the automatic builds.

## 3. Build the programs

1. Open your repository on GitHub and go to the **Actions** tab. If asked, enable workflows.
2. Choose **Build PocketTool**, then **Run workflow**.
3. After about 15 minutes, open the finished run. The Windows and Linux programs are under **Artifacts**.

## 4. Publish a release

Releases put the programs on your repository's Releases page, where anyone can download them.

1. Go to **Releases > Draft a new release**.
2. Under **Choose a tag**, type `v1.1.0` and select **Create new tag**.
3. Select **Publish release**. GitHub builds the programs and attaches them to the release within about 15 minutes.

For later versions, publish a release with a new tag, such as `v1.4.1`. The build takes the version number from the tag, so everyone who uses "Check for updates" is told about it. (It's still tidy to raise the version in `package.json` too.)

## Uploading new or changed files

When a new version adds files, every one must reach GitHub, or the build fails with "Cannot find module". Uploading through the website only adds files to the folder you're in, so for new folders, drag in the folder itself. GitHub Desktop avoids this entirely: it uploads exactly what's in your folder, hidden files included.

## Tidy-ups before you publish

- In `package.json`, change `homepage` to your repository's address, `repository` to your GitHub name and project (for example `jane-smith/pockettool`; this is only needed for builds made on your own computer, as GitHub fills it in automatically), and `author` to your name.
- In `LICENSE`, put your name on the copyright line.
- Check the RMBG-1.4 licence note in the README if PocketTool will be used commercially.
