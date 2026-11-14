import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { GitGraphBranch, GitGraphCommit, GitGraphCommitDetails, GitGraphCompareRequest, GitGraphCompareResult, GitGraphDiffHunk, GitGraphFileChange, GitGraphFileContent, GitGraphFileDiff, GitGraphFileDiffRequest, GitGraphFileRequest, GitGraphInput, GitGraphMetadata, GitGraphRepositories, GitGraphSignature, GitGraphSnapshot, GitGraphStash, GitGraphTag, GitGraphWorkingTree, GitGraphWorkingTreeChanges, GitGraphWorkingTreeFileRequest } from './domain.js';
import type { AvatarAuthor } from './avatars.js';
/** Minimal execution identity shared by the tool and the independent view. */
export interface GitGraphExecutionContext {
    readonly agent?: Agent;
    readonly signal: AbortSignal;
}
/** A stable error type for all Git acquisition failures. */
export declare class GitGraphError extends Error {
    constructor(message: string, options?: ErrorOptions);
}
export declare class GitObjectMissingError extends GitGraphError {
}
export declare class GitSubmoduleUnavailableError extends GitGraphError {
}
export declare class GitOutputLimitError extends GitGraphError {
}
/** `git log -z --format` terminates fixed-width records with NUL. */
export declare function parseGitLog(text: string): GitGraphCommit[];
/** Parse `git status --porcelain=v1 -b` without interpreting file contents. */
export declare function parseGitStatus(text: string): {
    branch: string | null;
    changed: boolean;
    summary: string;
};
/** Pure parser for the branch listing, exported so it can be tested alone. */
export declare function parseBranches(stdout: string, currentBranch: string | null): GitGraphBranch[];
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
/** Load all tags and their details in one bounded subprocess capture. */
export declare function loadTags(ctx: Context, cwd: string, signal: AbortSignal): Promise<GitGraphTag[]>;
/** Parse `git status -s --porcelain -z` into modified/deleted/untracked inventories. */
export declare function parseWorkingTreeStatus(text: string): GitGraphWorkingTree & {
    readonly conflicts: readonly string[];
};
/** Per-file content cap for `gitGraph/readFile`. */
export declare const FILE_MAX_BYTES: number;
/**
 * Reject absolute paths, NUL bytes and path traversal outside the repository.
 * Git reports every path in its output relative to the repository root, so
 * `root` is that top level — never the session working directory, which may be
 * a subdirectory of it.
 */
export declare function assertRepoRelativePath(path: string, root: string): void;
/**
 * Resolve the repository top level for a working directory that may be any
 * subdirectory of it. Every path Git prints — and every path this module uses
 * as a pathspec or file-system path — is relative to that root, while a bare
 * pathspec is resolved against the process working directory. Reading files and
 * diffs therefore run at the root, so both sides agree.
 */
export declare function repositoryRoot(ctx: Context, cwd: string, signal: AbortSignal): Promise<string>;
/** List direct gitlinks. An undeclared one is usable only with a local Git worktree. */
export declare function loadRepositories(ctx: Context, cwd: string, signal: AbortSignal): Promise<GitGraphRepositories>;
/** Resolve on every read so a removed or deinitialized module cannot reuse an old target. */
export declare function resolveSubmodule(ctx: Context, cwd: string, path: string, signal: AbortSignal): Promise<string>;
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
export declare function parseFileDiff(text: string): GitGraphDiffHunk[];
/**
 * Load one file's diff using the same range as its enclosing file list. An
 * explicit base compares both selected commits; otherwise use the target's
 * first parent (empty tree for a root commit).
 */
export declare function loadFileDiff(ctx: Context, cwd: string, request: GitGraphFileDiffRequest, signal: AbortSignal): Promise<GitGraphFileDiff>;
/** The sentinel hash used for the non-committed working-tree side of a diff. */
export declare const WORKTREE_HASH = "WORKTREE";
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
/** Resolve identity from Git, never from an email or URL supplied by the browser. */
export declare function loadAvatarAuthors(ctx: Context, cwd: string, hashes: readonly string[], signal: AbortSignal): Promise<{
    authors: AvatarAuthor[];
    remote: string | null;
}>;
