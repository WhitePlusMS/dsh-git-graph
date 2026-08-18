import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { GitGraphCommit, GitGraphCommitDetails, GitGraphCompareRequest, GitGraphCompareResult, GitGraphDiffLine, GitGraphFileChange, GitGraphFileContent, GitGraphFileDiff, GitGraphFileDiffRequest, GitGraphFileRequest, GitGraphInput, GitGraphMetadata, GitGraphRepoConfig, GitGraphSignature, GitGraphSnapshot, GitGraphStash, GitGraphTag, GitGraphTagDetails, GitGraphWorkingTree, GitGraphWorkingTreeChanges, GitGraphWorkingTreeFileRequest } from './domain.js';
/** Minimal execution identity shared by the tool and the independent view. */
export interface GitGraphExecutionContext {
    readonly agent?: Agent;
    readonly signal: AbortSignal;
}
/** A stable error type for all Git acquisition failures. */
export declare class GitGraphError extends Error {
    constructor(message: string, options?: ErrorOptions);
}
/** Parse the NUL/record-separated log format independently of the process seam. */
export declare function parseGitLog(text: string): GitGraphCommit[];
/** Parse `git status --porcelain=v1 -b` without interpreting file contents. */
export declare function parseGitStatus(text: string): {
    branch: string | null;
    changed: boolean;
    summary: string;
};
/**
 * Match a short branch name against a git-style glob. Follows git's rules:
 * `*` matches any run, `?` one character, `[abc]` a class, and a pattern with
 * no magic characters is treated as a prefix (implicit trailing `*`). Matching
 * is case-sensitive.
 */
export declare function branchNameMatches(name: string, pattern: string): boolean;
/** Load the bounded graph snapshot used by the model result and Client renderer. */
export declare function loadGitGraph(ctx: Context, input: GitGraphInput, exec: GitGraphExecutionContext): Promise<GitGraphSnapshot>;
/** Parse an empty-or-status signature string ("", or G/U/X/Y/R/E/B) into a signature. */
export declare function parseSignatureStatus(status: string, signer: string, key: string): GitGraphSignature | null;
/** Parse the whole `git show --quiet` stream (may contain one record). */
export declare function parseCommitDetails(text: string): GitGraphCommitDetails;
/** Parse `git diff-tree/diff --name-status -z` records into path/status pairs. */
export declare function parseDiffNameStatus(text: string): Array<{
    readonly type: GitGraphFileChange['type'];
    readonly oldPath: string;
    readonly newPath: string;
}>;
/** Parse `git diff-tree/diff --numstat -z` records: "add\tdel\tpath" (or old/new for renames). */
export declare function parseDiffNumStat(text: string): Map<string, {
    readonly additions: number | null;
    readonly deletions: number | null;
}>;
/** Merge name-status and numstat into file changes (reusing vscode semantics). */
export declare function mergeFileChanges(nameStatus: ReadonlyArray<{
    readonly type: GitGraphFileChange['type'];
    readonly oldPath: string;
    readonly newPath: string;
}>, numStat: Map<string, {
    readonly additions: number | null;
    readonly deletions: number | null;
}>): GitGraphFileChange[];
/**
 * Load the full details of one commit: `git show --quiet` for the header +
 * `diff-tree --name-status/--numstat` against its first parent (or root).
 */
export declare function loadCommitDetails(ctx: Context, cwd: string, hash: string, signal: AbortSignal): Promise<GitGraphCommitDetails>;
/** Parse `git reflog refs/stash --format=<fmt>` into stash entries. */
export declare function parseStashReflog(text: string): GitGraphStash[];
/** Load all stashes (`git reflog refs/stash`). */
export declare function loadStashes(ctx: Context, cwd: string, signal: AbortSignal): Promise<GitGraphStash[]>;
/** Parse `git for-each-ref refs/tags` lines into (name, object, annotated) triples. */
export declare function parseForEachRefTags(text: string): Array<{
    readonly name: string;
    readonly object: string;
    readonly annotated: boolean;
}>;
/** Parse `git for-each-ref refs/tags/<name>` annotated-tag detail record. */
export declare function parseAnnotatedTagDetail(text: string): GitGraphTagDetails;
/** Load tag refs (name + object + annotated flag) and annotated-tag details. */
export declare function loadTags(ctx: Context, cwd: string, signal: AbortSignal): Promise<GitGraphTag[]>;
/** Parse `git config --list -z --includes [--local|--global]` into key/value pairs. */
export declare function parseConfigList(text: string): Map<string, string>;
/** Load consolidated/local/global config lists and build the read-only repo config. */
export declare function loadRepoConfig(ctx: Context, cwd: string, remotes: readonly string[], signal: AbortSignal): Promise<GitGraphRepoConfig>;
/** Parse `git status -s --porcelain -z` into modified/deleted/untracked inventories. */
export declare function parseWorkingTreeStatus(text: string): GitGraphWorkingTree;
/** Load the working-tree change inventory. */
export declare function loadWorkingTree(ctx: Context, cwd: string, includeUntracked: boolean, signal: AbortSignal): Promise<GitGraphWorkingTree>;
/** Per-file content cap for `gitGraph/readFile`. */
export declare const FILE_MAX_BYTES: number;
/** Reject absolute paths, NUL bytes and path traversal outside the workspace. */
export declare function assertRepoRelativePath(path: string, cwd: string): void;
/** Read one version of a repo-relative file at a full commit hash. */
export declare function loadFile(ctx: Context, cwd: string, request: GitGraphFileRequest, signal: AbortSignal): Promise<GitGraphFileContent>;
/** Parse a `git diff` hunk header like `@@ -a,b +c,d @@` into base/new heads. */
export declare function parseHunkHeader(line: string): {
    oldStart: number;
    newStart: number;
} | null;
/**
 * Parse the unified text of ONE file diff (`git diff --unified=<n> <base> <new>
 * -- <path>`, where the output is guaranteed to describe a single file) into
 * line records. Old/new line numbers track the two heads so the renderer can
 * show line numbers exactly like vscode-git-graph.
 */
export declare function parseFileDiff(text: string): GitGraphDiffLine[];
/**
 * Load the added/deleted line diff of one file inside a commit, rendered like
 * vscode-git-graph. The base is the commit's first parent (empty tree for the
 * root commit), matching `loadCommitDetails`'s comparison base.
 */
export declare function loadFileDiff(ctx: Context, cwd: string, request: GitGraphFileDiffRequest, signal: AbortSignal): Promise<GitGraphFileDiff>;
/** The sentinel hash used for the non-committed working-tree side of a diff. */
export declare const WORKTREE_HASH = "WORKTREE";
/**
 * The set of files with uncommitted changes relative to HEAD (or to the empty
 * tree in a repository with no commits yet). Tracked modifications come from
 * `git diff HEAD`; untracked files are listed separately as additions. Binary
 * or truncated diffs keep `additions`/`deletions` as `null`.
 */
export declare function loadWorkingTreeChanges(ctx: Context, cwd: string, signal: AbortSignal): Promise<GitGraphWorkingTreeChanges>;
/**
 * Diff one file in the working tree against HEAD (or the empty tree for an
 * untracked file). This is the working-tree counterpart of `loadFileDiff` and
 * drives the per-file diff view for uncommitted changes.
 */
export declare function loadWorkingTreeFile(ctx: Context, cwd: string, request: GitGraphWorkingTreeFileRequest, signal: AbortSignal): Promise<GitGraphFileDiff>;
/** Compare two commits (left → right) and return file status/line counts. */
export declare function loadCompare(ctx: Context, cwd: string, request: GitGraphCompareRequest, signal: AbortSignal): Promise<GitGraphCompareResult>;
/** Load repository-level metadata (tags + stashes) for the on-demand view. */
export declare function loadMetadata(ctx: Context, cwd: string, signal: AbortSignal): Promise<GitGraphMetadata>;
