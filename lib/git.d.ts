import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { GitGraphCommit, GitGraphCommitDetails, GitGraphFileChange, GitGraphInput, GitGraphRepoConfig, GitGraphSignature, GitGraphSnapshot, GitGraphStash, GitGraphTag, GitGraphTagDetails, GitGraphWorkingTree } from './domain.js';
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
