# `dsh-git-graph`

Git Graph for the DeepSeek Harness web interface. Open a dedicated `Git Graph` view beside Chat and Trajectory to inspect the current workspace's Git history; refreshing the graph does not create a conversation message or write to the trajectory.

![Git Graph view in the DeepSeek Harness web interface](docs/image1.png)

## Features

- A dedicated `Git Graph` entry beside Chat and Trajectory.
- Commit topology with branch, merge, and parent relationships.
- Local branch, remote branch, tag, and HEAD reference labels.
- The clean or dirty working-tree state in the graph header.
- Full-range search across commit hashes, subjects, authors, email addresses, and reference names.
- Branch-name glob filters (e.g. `main,release-*`), reference-kind filtering, and an option to include all refs.
- Date, author-date, and topological commit ordering, plus a first-parent mode for the mainline history.
- Selecting a commit expands its details **inline below the commit's row**: hash, author, committer, date, parents, signature status, and references, with a layout aligned to vscode-git-graph.
- File changes in tree or list view: folder icons with compacted single-child folders, change-type colouring, and `(+added|−deleted)` stats.
- Click a file to view its line-by-line diff with old/new line numbers and add/remove highlighting.
- Expand the `Uncommitted Changes` row to inspect working-tree files and their per-file diffs.
- Compare file changes between any two commits.
- A metadata strip listing the repository's tags and stashes.
- An in-results find bar with case sensitivity, regex, and previous/next navigation.
- A display settings panel: date/author/hash columns, date format, and graph style, persisted per repository.
- Keyboard support: `↑` / `↓` to move the selection, `Ctrl+F` to find, `Ctrl+Shift+F` for settings.
- Refresh the current repository without creating a conversation message or tool trace entry.
- Load more commits as needed, up to 500 commits.
- Display an empty state instead of an error when the current directory is not a Git repository or the repository has no commits yet.

The current release is read-only. It does not create, delete, rename, merge, rebase, push, pull, fetch, create tags, stash, or reset Git data.

![Uncommitted changes list and per-file diff preview](docs/image2.png)

## Open Git Graph

After installing the plugin and restarting DSH Web, click `Git Graph` in the view switcher beside Chat and Trajectory.

The page reads the current session workspace. Refresh operations call the plugin's Typert Remote directly; they are not rendered as conversation tool cards and do not append refresh events to the trajectory.

## Git data and path handling

The Host reads Git data through fixed subprocess arguments without using a shell. It reads repository status, HEAD, and bounded commit history, and loads commit details, file contents, file diffs, working-tree changes, and commit comparisons on demand.

The model tool supports the following parameters:

```text
git_graph({
  path?: string,          // Repository directory; defaults to the current session workspace
  max_commits?: number,   // 1..500, defaults to 100
  all?: boolean,          // Include all reachable refs, defaults to true
  first_parent?: boolean, // Follow only the first parent, defaults to false
  glob?: string[],        // Branch-name glob filters (OR); overrides --all when provided
  search?: string,        // Full-range search: hash, subject, author, email, ref name, date
  sort?: string           // Commit ordering: date, author-date, or topological; defaults to date
})
```

The provided path is used only as the Git subprocess working directory and is never interpolated into a shell command; file-read requests are validated to stay inside the repository. If the path is not a Git repository, the page displays an empty state instead of a repository error. A Git repository with no commits is handled the same way.

## Install or update

Install version `v0.0.2` from GitHub:

```powershell
dsh plugin --profile web add https://github.com/WhitePlusMS/dsh-git-graph/archive/refs/tags/v0.0.2.tar.gz
```

Use the same command to update an existing installation. Restart `dsh web` after installation so the Host entry and browser client load the new version.

## Uninstall

Remove the current package from the `web` profile:

```powershell
dsh plugin --profile web remove dsh-git-graph
```

## Development

```powershell
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
```

The build writes the standalone Host and browser artifacts to `lib/`. Profile installation uses these generated artifacts and does not require a Harness monorepo checkout.

## Reference and inspiration

This project was created with reference to the following open-source project: [vscode-git-graph](https://github.com/mhutchie/vscode-git-graph). We would like to express our thanks to its authors and contributors.

## License

MIT
