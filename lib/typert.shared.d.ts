import type { InvocationDescriptor, TypertSchema } from '@deepseek-ai/dsh-typert-protocol';
import type { GitGraphInput, GitGraphSnapshot } from './domain.js';
export declare const TYPERT_PACKAGE = "dsh-git-graph";
/** Strict wire schemas intentionally use only the Typert `.parse()` contract. */
export declare const gitGraphInputSchema: TypertSchema<GitGraphInput>;
export declare const gitGraphSnapshotSchema: TypertSchema<GitGraphSnapshot>;
export interface GitGraphInvocationSchemas {
    readonly input: TypertSchema;
    readonly snapshot: TypertSchema;
    readonly sessionId: TypertSchema;
}
/** Build the shared endpoint metadata with a face-specific schema runtime. */
export declare function createGitGraphInvocation(schemas: GitGraphInvocationSchemas): InvocationDescriptor;
/** Client descriptors use the local parse-only schemas to keep the bundle closed. */
export declare const gitGraphInvocation: InvocationDescriptor;
export declare const gitGraphDescriptors: readonly [InvocationDescriptor];
