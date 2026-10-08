# `dsh-git-graph`

[中文说明](README.zh.md)

A read-only Git Graph in the native right sidebar of DeepSeek Harness Web. Version **0.1.0** targets **DSH 0.2.0-rc.2**, the official default release verified on 2026-10-08. DSH has not published a non-prerelease stable version yet.

Open the graph from the sidebar's start page, including in an empty session. No API key or conversation message is needed to inspect the current session workspace.

![Git Graph in the native DSH sidebar](docs/screenshots/dsh-0.2.0-light.jpg)

## Features of the published v0.1.0

The list below and the v0.1.0 archive describe the published release. This checkout also contains completed, unpublished P0 display improvements; build a local package to use them, as described below.

- A native `Git Graph` sidebar tab with a start-page entry and pane fullscreen.
- Commit topology with branch, merge, and parent relationships.
- Local branch, remote branch, tag, and HEAD reference labels.
- The clean or dirty working-tree state in the graph header.
- Search commit hashes, subjects, authors, emails, reference names, and dates beyond the initially loaded page. Search scans at most 2,000 commits in the selected history; the graph displays up to 500 results, initially 100.
- Local branch-name glob filters (e.g. `main,release-*`, combined with OR), reference-kind filtering, and an option to include all refs.
- Date, author-date, and topological commit ordering, plus a first-parent mode for the mainline history.
- Selecting a commit expands its details **inline below the commit's row**: hash, author, committer, date, parents, signature status, and references, with a layout aligned to vscode-git-graph.
- File changes in tree or list view: folder icons with compacted single-child folders and change-type colouring. Text modifications and renames show `(+added|−deleted)` stats; added, deleted, and binary file rows omit these counts.
- Click a file to view its line-by-line diff with old/new line numbers and add/remove highlighting, including deleted files, renames, root commits, and merges compared with their first parent. Binary changes are identified explicitly.
- Expand the `Uncommitted Changes` row to inspect working-tree files and their per-file diffs, including staged files before the first commit.
- Compare file changes between two commits from the currently loaded query results.
- A metadata strip listing the repository's tags and stashes.
- An in-results find bar with case sensitivity, regex, and previous/next navigation.
- A display settings panel: date/author/hash columns, date format, and graph style, persisted per repository.
- Keyboard controls while focus is inside the graph: `Ctrl/Cmd+F` finds and `Ctrl/Cmd+Shift+F` toggles settings, including from text inputs. With find closed and its text cleared, `↑`/`↓` select visible commits and `H` selects HEAD if it is visible; these ordinary keys are not intercepted in inputs.
- Live Chinese/English localization, DSH light/dark themes, and narrow-screen scrolling.
- Refresh the current repository without creating a conversation message or tool trace entry.
- Load more commits as needed, up to 500 commits.
- Display an empty state instead of an error when the current directory is not a Git repository or the repository has no commits yet.

The current release is read-only. It does not create, delete, rename, merge, rebase, push, pull, fetch, create tags, stash, or reset Git data.

![Commit details and a line-by-line diff](docs/screenshots/dsh-0.2.0-diff.jpg)

## Open Git Graph

Install the package into your DSH Web profile and restart that profile. Select a workspace, open the native right sidebar, and select `Git Graph` from the sidebar's start page. Use the pane's fullscreen control when you need more space.

The page reads the current session workspace. Refresh operations call the plugin's Typert Remote directly; they are not rendered as conversation tool cards and do not append refresh events to the trajectory.

## Git data and path handling

The Host reads Git data through fixed subprocess arguments without using a shell. The UI loads repository status, HEAD, bounded commit history, commit details, file diffs, working-tree changes, and commit comparisons on demand. A separate `readFile` Remote API exists, but the UI's file viewers use the diff APIs.

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

Prerequisites: DSH **0.2.0-rc.2** with the `dsh` CLI available, and Git available on the DSH Host. Install the versioned GitHub archive into the Web profile:

```powershell
dsh plugin --profile web add https://github.com/WhitePlusMS/dsh-git-graph/archive/refs/tags/v0.1.0.tar.gz
dsh web
```

The archive includes the committed `lib/` artifacts, so users do not need to clone or build this project. The first `add` creates the named `web` profile with the Web template if it does not already exist. Stop an already running Web profile before updating, then restart it after `add`; running processes keep the package code loaded at startup. For later releases, replace the tag in the URL with the desired version.

For a new custom Web profile, initialize it with `dsh --profile my-web --from-default-profile web --dump-config`, install with `dsh plugin --profile my-web add <archive-url>`, and launch with `dsh --profile my-web`.

Alternatively, build a local package from this checkout:

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm pack --pack-destination .scratch/release
dsh plugin --profile web add ./.scratch/release/dsh-git-graph-0.1.0.tgz
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

The current checkout completes P0: resizable columns, synchronized compact/full rows and SVG, line/palette presets, folded reference labels with copy feedback, responsive details, collapsible messages, file statistics, hunk headings and long-line scrolling, scoped navigation, and working-tree refresh without losing the open file. Unverified tag signatures and reference classification are corrected. The local verification passed **88 automated tests and 56 browser checks**; see the [P0 report](docs/P0_TEST_REPORT.md). These changes have not been released under a new tag.

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
```

The build writes standalone Host and browser artifacts to `lib/`. Profile installation uses these artifacts and does not require a Harness monorepo checkout. The root TypeScript solution references separate Host, Client, and test programs. Client registration uses Cordis effects, typed locales, native sidebar services, and theme aliases from the target DSH release.

The repository currently excludes `tests/` from version control. A fresh clone has no test files; run `pnpm test` only in a local workspace containing that suite. The test counts below describe the completed local upgrade verification, rather than a test suite shipped with the repository.

The upgrade passed **78 automated tests and 48 real browser cases** against DSH built from its release source. See the [upgrade and test report](docs/DSH_0.2_TEST_REPORT.md) for evidence, reproduction steps, and coverage.

![English interface using the DSH dark theme](docs/screenshots/dsh-0.2.0-dark.jpg)

## Reference and inspiration

This project was created with reference to the following open-source project: [vscode-git-graph](https://github.com/mhutchie/vscode-git-graph). We would like to express our thanks to its authors and contributors.

## License

MIT
