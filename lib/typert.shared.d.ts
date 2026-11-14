import type { InvocationDescriptor, TypertSchema } from '@deepseek-ai/dsh-typert-protocol';
import type { GitGraphFileDiff, GitGraphQuery, GitGraphRepositories, GitGraphSnapshot } from './domain.js';
export declare const TYPERT_PACKAGE = "dsh-git-graph";
/** Strict wire schemas intentionally use only the Typert `.parse()` contract. */
export declare const gitGraphQuerySchema: TypertSchema<GitGraphQuery>;
export declare const gitGraphSnapshotSchema: TypertSchema<GitGraphSnapshot>;
/**
 * The Host validates UTF-8 from raw bytes. A valid replacement character is
 * ordinary text. Enforce the same result contract on both Typert faces.
 */
export declare function validFileText(value: Pick<import('./domain.js').GitGraphFileContent, 'kind' | 'text' | 'truncated'>): boolean;
export declare const gitGraphCommitRequestSchema: TypertSchema<import('./domain.js').GitGraphCommitRequest>;
export declare const gitGraphCommitDetailsSchema: TypertSchema<import('./domain.js').GitGraphCommitDetails>;
export declare const gitGraphFileRequestSchema: TypertSchema<import('./domain.js').GitGraphFileRequest>;
export declare const gitGraphFileDiffRequestSchema: TypertSchema<import('./domain.js').GitGraphFileDiffRequest>;
export declare const gitGraphFileContentSchema: TypertSchema<import('./domain.js').GitGraphFileContent>;
export declare const gitGraphFileDiffSchema: TypertSchema<GitGraphFileDiff>;
export declare const gitGraphWorkingTreeChangesSchema: TypertSchema<import('./domain.js').GitGraphWorkingTreeChanges>;
export declare const gitGraphWorkingTreeFileRequestSchema: TypertSchema<import('./domain.js').GitGraphWorkingTreeFileRequest>;
export declare const gitGraphCompareRequestSchema: TypertSchema<import('./domain.js').GitGraphCompareRequest>;
export declare const gitGraphCompareResultSchema: TypertSchema<import('./domain.js').GitGraphCompareResult>;
export declare const gitGraphMetadataSchema: TypertSchema<import('./domain.js').GitGraphMetadata>;
export declare const gitGraphEmptyInputSchema: TypertSchema<Record<string, never>>;
export declare const gitGraphRepositoriesSchema: TypertSchema<GitGraphRepositories>;
export declare const gitGraphAvatarRequestSchema: TypertSchema<import('./domain.js').GitGraphAvatarRequest>;
export declare const gitGraphAvatarResultSchema: TypertSchema<import('./domain.js').GitGraphAvatarResult>;
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
export declare const gitGraphInvocation: InvocationDescriptor;
export declare const gitGraphReadCommitInvocation: InvocationDescriptor;
export declare const gitGraphFileInvocation: InvocationDescriptor;
export declare const gitGraphFileDiffInvocation: InvocationDescriptor;
export declare const gitGraphWorkingTreeInvocation: InvocationDescriptor;
export declare const gitGraphWorkingTreeFileInvocation: InvocationDescriptor;
export declare const gitGraphCompareInvocation: InvocationDescriptor;
export declare const gitGraphMetadataInvocation: InvocationDescriptor;
export declare const gitGraphDescriptors: readonly [InvocationDescriptor, InvocationDescriptor, InvocationDescriptor, InvocationDescriptor, InvocationDescriptor, InvocationDescriptor, InvocationDescriptor, InvocationDescriptor, InvocationDescriptor, InvocationDescriptor];
export {};
