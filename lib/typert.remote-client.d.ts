import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
import type { GitGraphCompareRequest, GitGraphCompareResult, GitGraphCommitDetails, GitGraphFileContent, GitGraphFileDiff, GitGraphFileRequest, GitGraphInput, GitGraphMetadata, GitGraphSnapshot, GitGraphWorkingTreeChanges, GitGraphWorkingTreeFileRequest, GitGraphWorkingTreeRequest } from './domain.js';
import { gitGraphCompareInvocation, gitGraphFileDiffInvocation, gitGraphFileInvocation, gitGraphMetadataInvocation, gitGraphReadCommitInvocation, gitGraphWorkingTreeFileInvocation, gitGraphWorkingTreeInvocation } from './typert.shared.js';
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespace$6769744772617068 {
        read: (agentId: string, request: GitGraphInput) => Promise<RemoteResult<GitGraphSnapshot>>;
        readCommit: (agentId: string, request: {
            hash: string;
        }) => Promise<RemoteResult<GitGraphCommitDetails>>;
        readFile: (agentId: string, request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileContent>>;
        readFileDiff: (agentId: string, request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>;
        readWorkingTree: (agentId: string, request: GitGraphWorkingTreeRequest) => Promise<RemoteResult<GitGraphWorkingTreeChanges>>;
        readWorkingTreeFile: (agentId: string, request: GitGraphWorkingTreeFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>;
        compare: (agentId: string, request: GitGraphCompareRequest) => Promise<RemoteResult<GitGraphCompareResult>>;
        metadata: (agentId: string, request: Record<string, never>) => Promise<RemoteResult<GitGraphMetadata>>;
    }
    interface TypertRemoteMap {
        'gitGraph/read': (agentId: string, request: GitGraphInput) => Promise<RemoteResult<GitGraphSnapshot>>;
        'gitGraph/readCommit': (agentId: string, request: {
            hash: string;
        }) => Promise<RemoteResult<GitGraphCommitDetails>>;
        'gitGraph/readFile': (agentId: string, request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileContent>>;
        'gitGraph/readFileDiff': (agentId: string, request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>;
        'gitGraph/readWorkingTree': (agentId: string, request: GitGraphWorkingTreeRequest) => Promise<RemoteResult<GitGraphWorkingTreeChanges>>;
        'gitGraph/readWorkingTreeFile': (agentId: string, request: GitGraphWorkingTreeFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>;
        'gitGraph/compare': (agentId: string, request: GitGraphCompareRequest) => Promise<RemoteResult<GitGraphCompareResult>>;
        'gitGraph/metadata': (agentId: string, request: Record<string, never>) => Promise<RemoteResult<GitGraphMetadata>>;
    }
    interface TypertRemoteNamespaceMap {
        gitGraph: TypertRemoteNamespace$6769744772617068;
    }
    interface TypertRemoteScopeMap {
        'agent:gitGraph/read': (request: GitGraphInput) => Promise<RemoteResult<GitGraphSnapshot>>;
        'agent:gitGraph/readCommit': (request: {
            hash: string;
        }) => Promise<RemoteResult<GitGraphCommitDetails>>;
        'agent:gitGraph/readFile': (request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileContent>>;
        'agent:gitGraph/readFileDiff': (request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>;
        'agent:gitGraph/readWorkingTree': (request: GitGraphWorkingTreeRequest) => Promise<RemoteResult<GitGraphWorkingTreeChanges>>;
        'agent:gitGraph/readWorkingTreeFile': (request: GitGraphWorkingTreeFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>;
        'agent:gitGraph/compare': (request: GitGraphCompareRequest) => Promise<RemoteResult<GitGraphCompareResult>>;
        'agent:gitGraph/metadata': (request: Record<string, never>) => Promise<RemoteResult<GitGraphMetadata>>;
    }
}
/** Client contract selected by the graph view's Cordis fiber. */
export declare const TYPERT_REMOTE: TypertRemoteContribution;
export { gitGraphReadCommitInvocation, gitGraphFileInvocation, gitGraphFileDiffInvocation, gitGraphWorkingTreeInvocation, gitGraphWorkingTreeFileInvocation, gitGraphCompareInvocation, gitGraphMetadataInvocation, };
export default TYPERT_REMOTE;
