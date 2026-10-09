# `dsh-git-graph`

[中文说明](README.zh.md)

A read-only Git Graph for the native right sidebar of DeepSeek Harness Web. Browse your workspace's history, branches, and file changes without an API key or conversation message.

**Version 0.4.0 · DSH 0.2.0-rc.2**

[Install](#install-or-update) · [Usage](#usage) · [Uninstall](#uninstall) · [Documentation](#documentation)

![Real author avatars and inline commit details](docs/screenshots/display-avatar.png)

## Features

- Commit topology, branches, tags, HEAD, search, and history filters.
- Inline commit details with author/committer dates, parents, references, signature status, and copying.
- Three reference layouts and combined labels for matching local/remote branches at the same commit.
- File tree/list views, per-file diffs, and uncommitted changes; compare the changed-file lists of two commits.
- Commit messages with links, bold, italic, and inline code; real GitHub/Gravatar author avatars.
- Resizable columns, date display options, compact rows, line styles, and colour presets, saved per repository.
- Chinese/English, light/dark themes, pane fullscreen, and narrow-screen support.

## Install or update

Requires DSH **0.2.0-rc.2**, the `dsh` CLI, and Git installed on the DSH Host.

Once the `v0.4.0` tag is published to GitHub:

```powershell
dsh plugin --profile web add https://github.com/WhitePlusMS/dsh-git-graph/archive/refs/tags/v0.4.0.tar.gz
dsh web
```

For updates, stop DSH Web, run `add` for the desired version, then restart it.

For a custom profile, local `.tgz` installation, or source builds, see the [development guide](docs/DEVELOPMENT.md#本地安装与自定义-profile).

## Usage

1. Select a workspace in DSH Web and open the right sidebar.
2. Select **Git Graph** from the sidebar's start page.
3. Select a commit for inline details, or a file for its diff. Select **Uncommitted Changes** to inspect working-tree changes.

Use **Settings** to adjust the display. Settings are saved separately for each repository.

Real avatars are enabled by default and access GitHub/Gravatar. GitHub queries use the commit author's email; Gravatar uses an email hash. You can disable them in Settings; missing images or failed requests retain initials.

## Uninstall

```powershell
dsh plugin --profile web remove dsh-git-graph
```

Use the profile you installed into, and restart it after removal.

## Keyboard controls

| Control | Action |
| --- | --- |
| `Ctrl/Cmd+F` | Find within loaded results |
| `Ctrl/Cmd+Shift+F` | Toggle display settings |
| `↑` / `↓` | Select a commit when Find is closed and cleared |
| `H` | Locate HEAD, or show an out-of-range hint |
| `Enter` / `Space` on a row or node | Select that commit |
| Drag a column divider / `←` / `→` | Resize a column; arrow keys work when the divider is focused |
| Double-click a divider | Restore its default width |

Shortcuts apply while focus is inside Git Graph. Normal navigation keys do not intercept typing in inputs.

## Scope

- The graph reads the current workspace's local Git data. Refresh does not fetch remote changes or modify the repository.
- Initially loads 100 commits, with manual loading up to 500. Search scans up to 2,000 commits; Find searches loaded results. Reference-type filters show commits directly carrying the selected kind of label.
- Two-commit comparison shows file lists. Side-by-side diffs, full revision text, tag signature verification, and stash diffs are not available. Tag/stash entries provide summaries and copying.

<details>
<summary>More screenshots: English light theme and 360px sidebar</summary>

![English light theme](docs/screenshots/display-light-en.png)

![360px sidebar](docs/screenshots/display-360.png)

</details>

## Documentation

- [Development, local installation, and API details](docs/DEVELOPMENT.md)
- [Display acceptance report](docs/DISPLAY_TEST_REPORT.md)
- [P0 report](docs/P0_TEST_REPORT.md) · [DSH adaptation report](docs/DSH_0.2_TEST_REPORT.md)

Inspired by [vscode-git-graph](https://github.com/mhutchie/vscode-git-graph). Thanks to its authors and contributors.

Licensed under [MIT](LICENSE).
