/** A ref label attached to a commit in the Git graph. */
export interface GitGraphRef {
    readonly kind: 'head' | 'remote' | 'tag';
    readonly name: string;
}
/**
 * One commit row required by the graph and the commit summary list.
 * Phase 0 extends the graph row with the data vscode-git-graph loads lazily
 * for the details view; the coarse graph list keeps the original fields.
 */
export interface GitGraphCommit {
    readonly hash: string;
    readonly parents: string[];
    readonly author: string;
    readonly email: string;
    /** ISO-8601 author timestamp. */
    readonly date: string;
    /** Commit subject (first line). */
    readonly subject: string;
    readonly refs: GitGraphRef[];
    readonly isHead: boolean;
}
/**
 * Repository availability state. These three states must be distinguishable so
 * a caller can tell "this directory is not a Git repository" apart from "this
 * is a Git repository with no commits yet" apart from "history is readable".
 * Git failures, cancellation and size overflows are reported through the
 * transport error result, never collapsed into `empty`.
 */
export type GitGraphRepoState = 'not-git' | 'empty' | 'ready';
/** The bounded, replayable result sent from the Host tool to the Client view. */
export interface GitGraphSnapshot {
    readonly path: string;
    /** `not-git` | `empty` | `ready`. */
    readonly state: GitGraphRepoState;
    readonly branch: string | null;
    readonly head: string | null;
    readonly workingTree: {
        readonly changed: boolean;
        readonly summary: string;
    };
    readonly commits: GitGraphCommit[];
    /** True when more commits exist beyond the requested page (Host uses maxCommits+1). */
    readonly hasMore: boolean;
}
/** How the Host orders the returned commit stream. */
export type GitGraphSort = 'date' | 'author-date' | 'topological';
/** The accepted tool input after schema validation and local bounds checks. */
export interface GitGraphInput {
    readonly path?: string;
    readonly maxCommits?: number;
    readonly all?: boolean;
    readonly firstParent?: boolean;
    /** Branch-name glob filters (OR). Normalized by the Host. */
    readonly glob?: string[];
    /** Free-text search applied to hash, subject, author, email, ref name and date. */
    readonly search?: string;
    readonly sort?: GitGraphSort;
}
/** GPG signature status of a commit or annotated tag (matches %G? codes). */
export type GitGraphSignatureStatus = 'G' | 'U' | 'X' | 'Y' | 'R' | 'E' | 'B';
/** GPG signature detail for a commit or annotated tag. */
export interface GitGraphSignature {
    readonly status: GitGraphSignatureStatus;
    /** Key id (for commits, %GK; for tags, the verify-tag key). */
    readonly key: string | null;
    /** Signer name for commits (%GS). */
    readonly signer: string | null;
}
/** Timestamps distinguish author and committer (vscode-git-graph does too). */
export interface GitGraphTimestamps {
    /** ISO-8601 author date (defaults to the row date). */
    readonly authorDate: string;
    /** ISO-8601 committer date. */
    readonly committerDate: string;
}
/** A single changed file within a commit or comparison. */
export interface GitGraphFileChange {
    readonly type: 'A' | 'M' | 'D' | 'R' | 'U';
    readonly oldPath: string;
    readonly newPath: string;
    /** Number of lines added, when known (text file). */
    readonly additions: number | null;
    /** Number of lines deleted, when known (text file). */
    readonly deletions: number | null;
}
/** Full detail for one commit, loaded on demand for the details view. */
export interface GitGraphCommitDetails {
    readonly hash: string;
    readonly parents: string[];
    readonly author: string;
    readonly authorEmail: string;
    readonly committer: string;
    readonly committerEmail: string;
    readonly timestamps: GitGraphTimestamps;
    readonly signature: GitGraphSignature | null;
    /** Full commit message body (multi-line). */
    readonly body: string;
    readonly fileChanges: GitGraphFileChange[];
}
/** An annotated or lightweight tag. */
export interface GitGraphTag {
    readonly name: string;
    readonly annotated: boolean;
    /** Populated only for annotated tags. */
    readonly detail: GitGraphTagDetails | null;
}
/** Detail of an annotated tag (object + tagger + message + signature). */
export interface GitGraphTagDetails {
    /** Hash the tag points to (the object). */
    readonly objectHash: string;
    readonly tagger: string;
    readonly taggerEmail: string;
    /** ISO-8601 tagger timestamp. */
    readonly taggerDate: string;
    readonly message: string;
    readonly signature: GitGraphSignature | null;
}
/** A stash that is mapped onto the graph at a commit. */
export interface GitGraphStash {
    readonly selector: string;
    readonly hash: string;
    readonly baseHash: string;
    /** Present when the stash has an untracked-files commit (3 parents). */
    readonly untrackedFilesHash: string | null;
    readonly author: string;
    readonly email: string;
    readonly date: string;
    readonly message: string;
}
/** Read-only repository and user configuration (vscode-git-graph config surface). */
export interface GitGraphRepoConfig {
    /** Per-branch upstream/pushremote (from local config). */
    readonly branches: Record<string, {
        readonly remote: string | null;
        readonly pushRemote: string | null;
    }>;
    readonly diffTool: string | null;
    readonly guiDiffTool: string | null;
    readonly pushDefault: string | null;
    /** Remote name -> url / pushUrl from local config. */
    readonly remotes: Array<{
        readonly name: string;
        readonly url: string | null;
        readonly pushUrl: string | null;
    }>;
    readonly user: {
        readonly name: {
            readonly local: string | null;
            readonly global: string | null;
        };
        readonly email: {
            readonly local: string | null;
            readonly global: string | null;
        };
    };
}
/** Inventory of working-tree changes (deleted + untracked + modified counts). */
export interface GitGraphWorkingTree {
    readonly changed: boolean;
    readonly deleted: string[];
    readonly untracked: string[];
    readonly modified: string[];
}
/** Upper bound for persisted graph metadata in one tool result. */
export declare const MAX_COMMITS = 500;
/** Request body for `gitGraph/readCommit`. */
export interface GitGraphCommitRequest {
    readonly hash: string;
}
/** Content read from one version of a file. */
export interface GitGraphFileContent {
    readonly hash: string;
    readonly path: string;
    /** `text` when the bytes decoded cleanly, `binary` otherwise. */
    readonly kind: 'text' | 'binary';
    /** Decoded content; `null` for binary files. */
    readonly text: string | null;
    /** Byte size of the raw blob. */
    readonly size: number;
    /** True when the blob exceeded the configured per-file size cap. */
    readonly truncated: boolean;
}
/** Request body for `gitGraph/readFile`. */
export interface GitGraphFileRequest {
    readonly hash: string;
    readonly path: string;
}
/** One rendered line inside a file diff hunk. */
export interface GitGraphDiffLine {
    readonly type: 'context' | 'added' | 'removed';
    /** Line content without the leading +/-/space marker. */
    readonly content: string;
    /** Line number in the base version (null for pure-added lines). */
    readonly oldLine: number | null;
    /** Line number in the new version (null for pure-removed lines). */
    readonly newLine: number | null;
}
/**
 * Per-file change inside a commit, rendered as added/deleted lines the way
 * vscode-git-graph shows a file diff. The base is the commit's first parent
 * (or the empty tree for a root commit), matching `loadCommitDetails`.
 */
export interface GitGraphFileDiff {
    readonly hash: string;
    readonly path: string;
    readonly oldPath: string;
    readonly status: GitGraphFileChange['type'];
    readonly additions: number;
    readonly deletions: number;
    /** A context line where the file is entirely added/deleted has no head. */
    readonly lines: GitGraphDiffLine[];
}
/** Request body for `gitGraph/readFileDiff`. */
export interface GitGraphFileDiffRequest {
    readonly hash: string;
    readonly path: string;
}
/** The list of files changed in the working tree relative to HEAD (or empty tree). */
export interface GitGraphWorkingTreeChanges {
    readonly changes: GitGraphFileChange[];
}
/** Request body for `gitGraph/readWorkingTree` (the working directory is implicit). */
export interface GitGraphWorkingTreeRequest {
    readonly includeUntracked?: boolean;
}
/** Request body for `gitGraph/readWorkingTreeFile`: diff one file vs the working tree. */
export interface GitGraphWorkingTreeFileRequest {
    readonly path: string;
}
/** File-change comparison between two commits (left → right). */
export interface GitGraphCompareResult {
    readonly baseHash: string;
    readonly targetHash: string;
    readonly changes: GitGraphFileChange[];
}
/** Request body for `gitGraph/compare`. */
export interface GitGraphCompareRequest {
    readonly baseHash: string;
    readonly targetHash: string;
}
/** Repository-level read-only metadata requested on demand (not per commit). */
export interface GitGraphMetadata {
    readonly tags: GitGraphTag[];
    readonly stashes: GitGraphStash[];
}
