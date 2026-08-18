/** A ref label attached to a commit in the Git graph. */
export interface GitGraphRef {
  readonly kind: 'head' | 'remote' | 'tag'
  readonly name: string
}

/**
 * One commit row required by the graph and the commit summary list.
 * Phase 0 extends the graph row with the data vscode-git-graph loads lazily
 * for the details view; the coarse graph list keeps the original fields.
 */
export interface GitGraphCommit {
  readonly hash: string
  readonly parents: string[]
  readonly author: string
  readonly email: string
  /** ISO-8601 author timestamp. */
  readonly date: string
  /** Commit subject (first line). */
  readonly subject: string
  readonly refs: GitGraphRef[]
  readonly isHead: boolean
}

/** The bounded, replayable result sent from the Host tool to the Client view. */
export interface GitGraphSnapshot {
  readonly path: string
  readonly branch: string | null
  readonly head: string | null
  readonly workingTree: {
    readonly changed: boolean
    readonly summary: string
  }
  readonly commits: GitGraphCommit[]
}

/** The accepted tool input after schema validation and local bounds checks. */
export interface GitGraphInput {
  readonly path?: string
  readonly maxCommits?: number
  readonly all?: boolean
  readonly firstParent?: boolean
}

/* ------------------------------------------------------------------ *
 * Phase 0 read-only data pipeline types.
 * ------------------------------------------------------------------ */

/** GPG signature status of a commit or annotated tag (matches %G? codes). */
export type GitGraphSignatureStatus =
  | 'G'  // good (valid)
  | 'U'  // good, unknown validity
  | 'X'  // good, but expired
  | 'Y'  // good, but made by expired key
  | 'R'  // good, but made by revoked key
  | 'E'  // cannot be checked
  | 'B'  // bad

/** GPG signature detail for a commit or annotated tag. */
export interface GitGraphSignature {
  readonly status: GitGraphSignatureStatus
  /** Key id (for commits, %GK; for tags, the verify-tag key). */
  readonly key: string | null
  /** Signer name for commits (%GS). */
  readonly signer: string | null
}

/** Timestamps distinguish author and committer (vscode-git-graph does too). */
export interface GitGraphTimestamps {
  /** ISO-8601 author date (defaults to the row date). */
  readonly authorDate: string
  /** ISO-8601 committer date. */
  readonly committerDate: string
}

/** A single changed file within a commit or comparison. */
export interface GitGraphFileChange {
  readonly type: 'A' | 'M' | 'D' | 'R' | 'U'
  readonly oldPath: string
  readonly newPath: string
  /** Number of lines added, when known (text file). */
  readonly additions: number | null
  /** Number of lines deleted, when known (text file). */
  readonly deletions: number | null
}

/** Full detail for one commit, loaded on demand for the details view. */
export interface GitGraphCommitDetails {
  readonly hash: string
  readonly parents: string[]
  readonly author: string
  readonly authorEmail: string
  readonly committer: string
  readonly committerEmail: string
  readonly timestamps: GitGraphTimestamps
  readonly signature: GitGraphSignature | null
  /** Full commit message body (multi-line). */
  readonly body: string
  readonly fileChanges: GitGraphFileChange[]
}

/** An annotated or lightweight tag. */
export interface GitGraphTag {
  readonly name: string
  readonly annotated: boolean
  /** Populated only for annotated tags. */
  readonly detail: GitGraphTagDetails | null
}

/** Detail of an annotated tag (object + tagger + message + signature). */
export interface GitGraphTagDetails {
  /** Hash the tag points to (the object). */
  readonly objectHash: string
  readonly tagger: string
  readonly taggerEmail: string
  /** ISO-8601 tagger timestamp. */
  readonly taggerDate: string
  readonly message: string
  readonly signature: GitGraphSignature | null
}

/** A stash that is mapped onto the graph at a commit. */
export interface GitGraphStash {
  readonly selector: string
  readonly hash: string
  readonly baseHash: string
  /** Present when the stash has an untracked-files commit (3 parents). */
  readonly untrackedFilesHash: string | null
  readonly author: string
  readonly email: string
  readonly date: string
  readonly message: string
}

/** Read-only repository and user configuration (vscode-git-graph config surface). */
export interface GitGraphRepoConfig {
  /** Per-branch upstream/pushremote (from local config). */
  readonly branches: Record<string, { readonly remote: string | null; readonly pushRemote: string | null }>
  readonly diffTool: string | null
  readonly guiDiffTool: string | null
  readonly pushDefault: string | null
  /** Remote name -> url / pushUrl from local config. */
  readonly remotes: Array<{ readonly name: string; readonly url: string | null; readonly pushUrl: string | null }>
  readonly user: {
    readonly name: { readonly local: string | null; readonly global: string | null }
    readonly email: { readonly local: string | null; readonly global: string | null }
  }
}

/** Inventory of working-tree changes (deleted + untracked + modified counts). */
export interface GitGraphWorkingTree {
  readonly changed: boolean
  readonly deleted: string[]
  readonly untracked: string[]
  readonly modified: string[]
}

/** Upper bound for persisted graph metadata in one tool result. */
export const MAX_COMMITS = 500
