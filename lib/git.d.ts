import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { GitGraphCommit, GitGraphInput, GitGraphSnapshot } from './domain.js';
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
