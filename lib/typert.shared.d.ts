import type { InvocationDescriptor, TypertSchema } from '@deepseek-ai/dsh-typert-protocol';
import type { GitGraphFileDiff, GitGraphInput, GitGraphSnapshot } from './domain.js';
export declare const TYPERT_PACKAGE = "dsh-git-graph";
/** Strict wire schemas intentionally use only the Typert `.parse()` contract. */
export declare const gitGraphInputSchema: TypertSchema<GitGraphInput>;
export declare const gitGraphSnapshotSchema: TypertSchema<GitGraphSnapshot>;
export declare const gitGraphCommitRequestSchema: TypertSchema<import('./domain.js').GitGraphCommitRequest>;
export declare const gitGraphCommitDetailsSchema: TypertSchema<import('./domain.js').GitGraphCommitDetails>;
export declare const gitGraphFileRequestSchema: TypertSchema<import('./domain.js').GitGraphFileRequest>;
export declare const gitGraphFileContentSchema: TypertSchema<import('./domain.js').GitGraphFileContent>;
export declare const gitGraphFileDiffSchema: TypertSchema<GitGraphFileDiff>;
export declare const gitGraphWorkingTreeChangesSchema: TypertSchema<import('./domain.js').GitGraphWorkingTreeChanges>;
export declare const gitGraphWorkingTreeFileRequestSchema: TypertSchema<import('./domain.js').GitGraphWorkingTreeFileRequest>;
export declare const gitGraphCompareRequestSchema: TypertSchema<import('./domain.js').GitGraphCompareRequest>;
export declare const gitGraphCompareResultSchema: TypertSchema<import('./domain.js').GitGraphCompareResult>;
export declare const gitGraphMetadataSchema: TypertSchema<import('./domain.js').GitGraphMetadata>;
export declare const gitGraphEmptyInputSchema: TypertSchema<Record<string, never>>;
export interface GitGraphInvocationSchemas {
    readonly input: TypertSchema;
    readonly result: TypertSchema;
    readonly sessionId: TypertSchema;
}
interface InvocationSpec {
    readonly method: string;
    readonly inputSymbol: string;
    readonly resultSymbol: string;
    readonly schemas: GitGraphInvocationSchemas;
}
/** Build the shared endpoint metadata with a face-specific schema runtime. */
export declare function createGitGraphInvocation(spec: InvocationSpec): InvocationDescriptor;
/** Client descriptors use the local parse-only schemas to keep the bundle closed. */
export declare const gitGraphInvocation: InvocationDescriptor;
export declare const gitGraphReadCommitInvocation: InvocationDescriptor;
export declare const gitGraphFileInvocation: InvocationDescriptor;
export declare const gitGraphFileDiffInvocation: InvocationDescriptor;
export declare const gitGraphWorkingTreeInvocation: InvocationDescriptor;
export declare const gitGraphWorkingTreeFileInvocation: InvocationDescriptor;
export declare const gitGraphCompareInvocation: InvocationDescriptor;
export declare const gitGraphMetadataInvocation: InvocationDescriptor;
export declare const gitGraphDescriptors: readonly [InvocationDescriptor, InvocationDescriptor, InvocationDescriptor, InvocationDescriptor, InvocationDescriptor, InvocationDescriptor, InvocationDescriptor, InvocationDescriptor];
export {};
