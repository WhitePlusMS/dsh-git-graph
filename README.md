# `dsh-git-graph`

[中文说明](README.zh.md)

A read-only Git Graph in the native right sidebar of DeepSeek Harness Web. Plugin **0.4.0** targets **DSH 0.2.0-rc.2**, the release used for local verification on 2026-10-08 and 2026-10-09.

Open the graph from the sidebar's start page, including in an empty session. No API key or conversation message is needed to inspect the current session workspace.

[Install or update](#install-or-update) · [Uninstall](#uninstall) · [Keyboard controls](#keyboard-and-column-controls) · [Development](#development)

![Real author avatars and inline details in the native DSH sidebar](docs/screenshots/display-avatar.png)

## Display updates in v0.4.0

Version 0.4.0 adds the following displays to the P0 improvements included in 0.3.0. The existing `v0.3.0` tag retains its earlier implementation; see the installation instructions for 0.4.0 below.

- **Inline details only**, below the selected commit or working-tree row. There is no bottom panel or display-location setting.
- Three reference layouts: normal, branches left with tags right, or branches beside the graph with tags right. Matching local/remote branch labels combine only when they point to the same commit; their names remain separately copyable.
- Commit messages support HTTP(S) links, bold, italic, and inline code. HTML remains literal text; formatting can be disabled. Issue linking and emoji shortcodes are not implemented.
- Select author or committer dates for the date column; details show both. Git mailmap names/emails are used consistently. Commit signature statuses have explanations and a copyable key ID when Git returns one.
- **Real author avatars**, enabled by default, with automatic GitHub/Gravatar lookup or Gravatar-only lookup. Missing images, network failures, and rate limits retain the initials avatar. This can be disabled per repository.

Avatar requests run on the DSH Host. GitHub lookup uses the original author email from Git to search public commits in the GitHub `origin` repository; Gravatar receives a SHA-256 email hash. The Host caches up to 128 entries in memory, for 24 hours on success and 15 minutes on failure. The cache clears on restart; no avatar files are written to the repository. See the [display acceptance report](docs/DISPLAY_TEST_REPORT.md) for verification and provider limits.

## Main features

The current version includes column resizing, consistent row/SVG geometry, reference folding and copying, responsive inline details, file diffs, and navigation, together with the 0.4.0 additions above.

- A native `Git Graph` sidebar tab with a start-page entry and pane fullscreen.
- Commit topology with branch, merge, and parent relationships; parents outside the loaded range use dashed edges.
- Local branch, remote branch, tag, and HEAD reference labels, with current-branch priority, folded labels, full details, and copy feedback.
- The clean or dirty working-tree state in the graph header.
- Search commit hashes, subjects, authors, emails, reference names, and dates beyond the initially loaded page. Search scans at most 2,000 commits in the selected history; the graph displays up to 500 results, initially 100.
- Local branch-name glob filters (e.g. `main,release-*`, combined with OR) and an option to include all refs. Reference-kind filtering narrows the loaded rows to commits directly carrying a local, remote, or tag label.
- Date, author-date, and topological commit ordering, plus a first-parent mode for the mainline history.
- Selecting a commit expands its details **inline below the commit's row**: hash, author, committer, date, parents, signature status, and references, with a layout aligned to vscode-git-graph. Long messages can be folded; hashes, parent hashes, and paths can be copied with success or failure feedback.
- File changes in tree or list view: folder icons with compacted single-child folders and change-type colouring. All available text counts show `(+added|−deleted)` stats, including additions and deletions; missing counts are labelled as unavailable. Renames show both paths.
- Click a file to view its line-by-line diff with old/new line numbers, hunk headings, add/remove highlighting, and horizontal scrolling for long lines, including deleted files, renames, root commits, and merges compared with their first parent. Binary changes are identified explicitly.
- Expand the `Uncommitted Changes` row to inspect working-tree files and their per-file diffs, including staged files before the first commit.
- Compare the changed-file list and available line counts between two commits from the currently loaded query results.
- A collapsible metadata strip with tag and stash summaries and name copying.
- An in-results find bar with case sensitivity, regex, and previous/next navigation.
- A display settings panel: resizable columns, date/author/hash visibility, date format/source, compact/full row density, curved/straight lines, palette presets, reference alignment/combining, message formatting, and avatar source, persisted per repository.
- Keyboard navigation with automatic scrolling to the selected commit, plus explicit feedback when HEAD is outside the visible results.
- Live Chinese/English localization, DSH light/dark themes, and narrow-screen scrolling.
- Refresh the current repository and its metadata while keeping the open working-tree file, without creating a conversation message or tool trace entry.
- Load more commits as needed, up to 500 commits.
- Display an empty state instead of an error when the current directory is not a Git repository or the repository has no commits yet.

## Current scope

- The plugin reads Git data. Checkout, branch/tag creation or deletion, commit, merge, rebase, push, pull, fetch, stash changes, and reset are not provided. Refresh reads local repository data; remote-tracking labels are local records and are not fetched.
- The graph starts with 100 commits and loads more manually, up to 500. Top-level search scans at most 2,000 commits; Find searches only the currently visible results. Reference-kind filtering is not a full branch-history selector.
- Two-commit comparison currently shows a changed-file list. Per-file diffs in that comparison, full revision text, and side-by-side diffs are not available.
- Tag and stash entries provide summaries and copying, without dedicated detail or stash-diff views. Tag signature verification is not implemented. Message formatting supports the inline forms listed above; avatar lookup supports GitHub and Gravatar.

## Keyboard and column controls

| Control | Action |
| --- | --- |
| `Ctrl/Cmd+F` | Open Find within the current results |
| `Ctrl/Cmd+Shift+F` | Toggle display settings |
| `↑` / `↓` | Select a visible commit when Find is closed and its text is cleared |
| `H` | Select the visible HEAD commit, or show an out-of-range hint |
| `Enter` / `Space` on a row or graph node | Select that commit |
| Drag a column divider | Resize the column |
| `←` / `→` on a focused column divider | Adjust its width by 10px |
| Double-click a column divider | Restore that column's default width |

Shortcuts apply while focus is inside Git Graph. The Find/settings shortcuts also work from its text inputs; ordinary navigation keys are not intercepted in inputs, selectors, editable text, or column dividers. Display settings are saved separately for each repository; the settings panel can restore all defaults.

## Screenshots

Version 0.4.0 in English with the light theme, real avatars, and inline details:

![0.4.0 English light theme](docs/screenshots/display-light-en.png)

<details>
<summary>360px sidebar with references beside the graph and inline details</summary>

![0.4.0 narrow sidebar](docs/screenshots/display-360.png)

</details>

These screenshots were captured during local acceptance checks. The [0.4.0 display report](docs/DISPLAY_TEST_REPORT.md) contains detailed coverage; the historical [P0 report](docs/P0_TEST_REPORT.md) retains its before/after comparison.

## Open Git Graph

Install the package into your DSH Web profile and restart that profile. Select a workspace, open the native right sidebar, and select `Git Graph` from the sidebar's start page. Use the pane's fullscreen control when you need more space.

The page reads the current session workspace. Refresh reads repository data directly without sending a conversation message, creating a conversation tool card, or appending a tool trace entry.

## Git data and path handling

The Host reads Git data through fixed subprocess arguments without using a shell, with literal pathspecs and optional index updates disabled. The UI loads repository status, HEAD, bounded commit history, commit details, file diffs, working-tree changes, and commit comparisons on demand. A separate `readFile` Remote API exists, but the UI's file viewers use the diff APIs.

Browser queries are bound to the current session workspace and reject an arbitrary repository `path`. The separate model tool retains the following parameters:

```text
git_graph({
  path?: string,          // Repository directory; defaults to the current session workspace
  max_commits?: number,   // 1..500, defaults to 100
  all?: boolean,          // Include all reachable refs, defaults to true
  first_parent?: boolean, // Follow only the first parent, defaults to false
  glob?: string[],        // Local branch-name globs (OR); overrides --all when provided
  search?: string,        // Hash, subject, author, email, ref name, date; scan cap 2,000
  sort?: string           // Commit ordering: date, author-date, or topological; defaults to date
})
```

The model tool's path is used only as the Git subprocess working directory and is never interpolated into a shell command. File requests must use a repository-relative path; absolute paths and paths outside the repository are rejected. The sidebar uses the session workspace and displays separate empty states for a non-Git directory and a repository with no commits, where staged files can still be inspected.

## Install or update

Prerequisites: DSH **0.2.0-rc.2** with the `dsh` CLI available, and Git available on the DSH Host. Once the `v0.4.0` tag has been created and pushed to GitHub, install its archive into the Web profile. Until then, use the local package instructions below.

```powershell
dsh plugin --profile web add https://github.com/WhitePlusMS/dsh-git-graph/archive/refs/tags/v0.4.0.tar.gz
dsh web
```

The archive includes the committed `lib/` artifacts, so users do not need to clone or build this project. The first `add` creates the named `web` profile with the Web template if it does not already exist. Stop an already running Web profile before updating, then restart it after `add`; running processes keep the package code loaded at startup. For later releases, replace the tag in the URL with the desired version.

For a new custom Web profile, initialize it with `dsh --profile my-web --from-default-profile web --dump-config`, install with `dsh plugin --profile my-web add <archive-url>`, and launch with `dsh --profile my-web`.

Alternatively, build a local package from this checkout:

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm pack --pack-destination .scratch/release
dsh plugin --profile web add ./.scratch/release/dsh-git-graph-0.4.0.tgz
```

If you already have the `.tgz`, pass its path directly to `dsh plugin --profile web add`. Restart `dsh web` after installation so the Host and browser client use the new package. Replace `web` with your custom profile name when appropriate.

The new implementation does not retain old DSH API compatibility.

## Uninstall

Remove the current package from the `web` profile:

```powershell
dsh plugin --profile web remove dsh-git-graph
```

Restart that profile after removal to unload the plugin from a running application. The CLI removes both the package dependency and its bundle entry. Use the same profile name that you installed into.

## Development

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
```

The build writes standalone Host and browser artifacts to `lib/`. Profile installation uses these artifacts and does not require a Harness monorepo checkout. The root TypeScript solution references separate Host, Client, and test programs. Client registration uses Cordis effects, typed locales, native sidebar services, and theme aliases from the target DSH release.

The repository currently excludes `tests/` from version control. A fresh clone has no test files; run `pnpm test` only in a local workspace containing that suite. The counts below describe completed local acceptance checks, rather than a test suite shipped with the repository.

| Verification phase | Automated tests | Browser checks | DSH runtime and evidence |
| --- | --- | --- | --- |
| DSH 0.2 adaptation | 78 passed | 48 passed | Built from the official release source; [upgrade report](docs/DSH_0.2_TEST_REPORT.md) |
| P0 display improvements included in 0.3.0 | 88 passed | 56 passed | Official CLI distribution, isolated home/profile; [P0 report](docs/P0_TEST_REPORT.md) |
| Display updates included in 0.4.0 | 106 passed | 26 passed | Official CLI distribution, isolated home/profile; [display report](docs/DISPLAY_TEST_REPORT.md) |

These are separate verification phases; the counts are not added together. P0 was tested in a temporary package numbered 0.1.0 before its inclusion in 0.3.0. The 0.4.0 display implementation was tested on 2026-10-09 in a temporary package still numbered 0.3.0. Both version updates passed type checking, build, and packaging; the browser checks were not repeated for version-number changes. Local verification does not confirm that a tag has been published.

## Reference and inspiration

This project was created with reference to the following open-source project: [vscode-git-graph](https://github.com/mhutchie/vscode-git-graph). We would like to express our thanks to its authors and contributors.

## License

MIT
