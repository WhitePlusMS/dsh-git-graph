import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
import type { GitGraphAvatarRequest, GitGraphAvatarResult, GitGraphCompareRequest, GitGraphCompareResult, GitGraphCommitDetails, GitGraphFileContent, GitGraphFileDiff, GitGraphFileDiffRequest, GitGraphFileRequest, GitGraphQuery, GitGraphMetadata, GitGraphSnapshot, GitGraphWorkingTreeChanges, GitGraphWorkingTreeFileRequest, GitGraphWorkingTreeRequest } from './domain.js';
import { gitGraphCompareInvocation, gitGraphFileDiffInvocation, gitGraphFileInvocation, gitGraphMetadataInvocation, gitGraphReadCommitInvocation, gitGraphWorkingTreeFileInvocation, gitGraphWorkingTreeInvocation } from './typert.shared.js';
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespace$6769744772617068 {
        avatars: (agentId: SessionId, request: GitGraphAvatarRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphAvatarResult>>;
        read: (agentId: SessionId, request: GitGraphQuery, signal?: AbortSignal) => Promise<RemoteResult<GitGraphSnapshot>>;
        readCommit: (agentId: SessionId, request: {
            hash: string;
        }, signal?: AbortSignal) => Promise<RemoteResult<GitGraphCommitDetails>>;
        readFile: (agentId: SessionId, request: GitGraphFileRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileContent>>;
        readFileDiff: (agentId: SessionId, request: GitGraphFileDiffRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>;
        readWorkingTree: (agentId: SessionId, request: GitGraphWorkingTreeRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphWorkingTreeChanges>>;
        readWorkingTreeFile: (agentId: SessionId, request: GitGraphWorkingTreeFileRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>;
        compare: (agentId: SessionId, request: GitGraphCompareRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphCompareResult>>;
        metadata: (agentId: SessionId, request: Record<string, never>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphMetadata>>;
    }
    interface TypertRemoteMap {
        'gitGraph/avatars': (agentId: SessionId, request: GitGraphAvatarRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphAvatarResult>>;
        'gitGraph/read': (agentId: SessionId, request: GitGraphQuery, signal?: AbortSignal) => Promise<RemoteResult<GitGraphSnapshot>>;
        'gitGraph/readCommit': (agentId: SessionId, request: {
            hash: string;
        }, signal?: AbortSignal) => Promise<RemoteResult<GitGraphCommitDetails>>;
        'gitGraph/readFile': (agentId: SessionId, request: GitGraphFileRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileContent>>;
        'gitGraph/readFileDiff': (agentId: SessionId, request: GitGraphFileDiffRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>;
        'gitGraph/readWorkingTree': (agentId: SessionId, request: GitGraphWorkingTreeRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphWorkingTreeChanges>>;
        'gitGraph/readWorkingTreeFile': (agentId: SessionId, request: GitGraphWorkingTreeFileRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>;
        'gitGraph/compare': (agentId: SessionId, request: GitGraphCompareRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphCompareResult>>;
        'gitGraph/metadata': (agentId: SessionId, request: Record<string, never>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphMetadata>>;
    }
    interface TypertRemoteNamespaceMap {
        gitGraph: TypertRemoteNamespace$6769744772617068;
    }
    interface TypertRemoteScopeMap {
        'agent:gitGraph/avatars': (request: GitGraphAvatarRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphAvatarResult>>;
        'agent:gitGraph/read': (request: GitGraphQuery, signal?: AbortSignal) => Promise<RemoteResult<GitGraphSnapshot>>;
        'agent:gitGraph/readCommit': (request: {
            hash: string;
        }, signal?: AbortSignal) => Promise<RemoteResult<GitGraphCommitDetails>>;
        'agent:gitGraph/readFile': (request: GitGraphFileRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileContent>>;
        'agent:gitGraph/readFileDiff': (request: GitGraphFileDiffRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>;
        'agent:gitGraph/readWorkingTree': (request: GitGraphWorkingTreeRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphWorkingTreeChanges>>;
        'agent:gitGraph/readWorkingTreeFile': (request: GitGraphWorkingTreeFileRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>;
        'agent:gitGraph/compare': (request: GitGraphCompareRequest, signal?: AbortSignal) => Promise<RemoteResult<GitGraphCompareResult>>;
        'agent:gitGraph/metadata': (request: Record<string, never>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphMetadata>>;
    }
}
/** Client contract selected by the graph view's Cordis fiber. */
export declare const TYPERT_REMOTE: TypertRemoteContribution;
export { gitGraphReadCommitInvocation, gitGraphFileInvocation, gitGraphFileDiffInvocation, gitGraphWorkingTreeInvocation, gitGraphWorkingTreeFileInvocation, gitGraphCompareInvocation, gitGraphMetadataInvocation, };
export default TYPERT_REMOTE;
