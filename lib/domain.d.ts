/** A ref label attached to a commit in the Git graph. */
export interface GitGraphRef {
    readonly kind: 'head' | 'remote' | 'tag';
    readonly name: string;
}
/** One commit row required by the graph and the commit summary list. */
export interface GitGraphCommit {
    readonly hash: string;
    readonly parents: string[];
    readonly author: string;
    readonly email: string;
    readonly date: string;
    readonly subject: string;
    readonly refs: GitGraphRef[];
    readonly isHead: boolean;
}
/** The bounded, replayable result sent from the Host tool to the Client view. */
export interface GitGraphSnapshot {
    readonly path: string;
    readonly branch: string | null;
    readonly head: string | null;
    readonly workingTree: {
        readonly changed: boolean;
        readonly summary: string;
    };
    readonly commits: GitGraphCommit[];
}
/** The accepted tool input after schema validation and local bounds checks. */
export interface GitGraphInput {
    readonly path?: string;
    readonly maxCommits?: number;
    readonly all?: boolean;
    readonly firstParent?: boolean;
}
/** Upper bound for persisted graph metadata in one tool result. */
export declare const MAX_COMMITS = 500;
