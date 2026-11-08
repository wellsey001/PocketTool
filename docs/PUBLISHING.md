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
git remote add origin https://github.com/wellsey001/pockettool.git
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

For later versions, raise the version in `package.json` first, then publish a release with the matching tag, such as `v1.1.1`.

## Tidy-ups before you publish

- In `package.json`, change `homepage` to your repository's address and `author` to your name.
- In `LICENSE`, put your name on the copyright line.
- Check the RMBG-1.4 licence note in the README if PocketTool will be used commercially.
