import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
import type { GitGraphAvatarRequest, GitGraphAvatarResult, GitGraphCompareRequest, GitGraphCompareResult, GitGraphCommitDetails, GitGraphCommitRequest, GitGraphFileContent, GitGraphFileDiff, GitGraphFileDiffRequest, GitGraphFileRequest, GitGraphQuery, GitGraphMetadata, GitGraphSnapshot, GitGraphWorkingTreeChanges, GitGraphWorkingTreeFileRequest, GitGraphRepositories, GitGraphRepositoryRequest, GitGraphRepositoryScope } from './domain.js';
import { gitGraphCompareInvocation, gitGraphFileDiffInvocation, gitGraphFileInvocation, gitGraphMetadataInvocation, gitGraphReadCommitInvocation, gitGraphWorkingTreeFileInvocation, gitGraphWorkingTreeInvocation } from './typert.shared.js';
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespace$6769744772617068 {
        repositories: (agentId: SessionId, request: Record<string, never>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphRepositories>>;
        avatars: (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphAvatarRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphAvatarResult>>;
        read: (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphQuery>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphSnapshot>>;
        readCommit: (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphCommitRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphCommitDetails>>;
        readFile: (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphFileRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileContent>>;
        readFileDiff: (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphFileDiffRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>;
        readWorkingTree: (agentId: SessionId, request: GitGraphRepositoryScope, signal?: AbortSignal) => Promise<RemoteResult<GitGraphWorkingTreeChanges>>;
        readWorkingTreeFile: (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphWorkingTreeFileRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>;
        compare: (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphCompareRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphCompareResult>>;
        metadata: (agentId: SessionId, request: GitGraphRepositoryScope, signal?: AbortSignal) => Promise<RemoteResult<GitGraphMetadata>>;
    }
    interface TypertRemoteMap {
        'gitGraph/repositories': (agentId: SessionId, request: Record<string, never>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphRepositories>>;
        'gitGraph/avatars': (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphAvatarRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphAvatarResult>>;
        'gitGraph/read': (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphQuery>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphSnapshot>>;
        'gitGraph/readCommit': (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphCommitRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphCommitDetails>>;
        'gitGraph/readFile': (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphFileRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileContent>>;
        'gitGraph/readFileDiff': (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphFileDiffRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>;
        'gitGraph/readWorkingTree': (agentId: SessionId, request: GitGraphRepositoryScope, signal?: AbortSignal) => Promise<RemoteResult<GitGraphWorkingTreeChanges>>;
        'gitGraph/readWorkingTreeFile': (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphWorkingTreeFileRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>;
        'gitGraph/compare': (agentId: SessionId, request: GitGraphRepositoryRequest<GitGraphCompareRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphCompareResult>>;
        'gitGraph/metadata': (agentId: SessionId, request: GitGraphRepositoryScope, signal?: AbortSignal) => Promise<RemoteResult<GitGraphMetadata>>;
    }
    interface TypertRemoteNamespaceMap {
        gitGraph: TypertRemoteNamespace$6769744772617068;
    }
    interface TypertRemoteScopeMap {
        'agent:gitGraph/repositories': (request: Record<string, never>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphRepositories>>;
        'agent:gitGraph/avatars': (request: GitGraphRepositoryRequest<GitGraphAvatarRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphAvatarResult>>;
        'agent:gitGraph/read': (request: GitGraphRepositoryRequest<GitGraphQuery>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphSnapshot>>;
        'agent:gitGraph/readCommit': (request: GitGraphRepositoryRequest<GitGraphCommitRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphCommitDetails>>;
        'agent:gitGraph/readFile': (request: GitGraphRepositoryRequest<GitGraphFileRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileContent>>;
        'agent:gitGraph/readFileDiff': (request: GitGraphRepositoryRequest<GitGraphFileDiffRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>;
        'agent:gitGraph/readWorkingTree': (request: GitGraphRepositoryScope, signal?: AbortSignal) => Promise<RemoteResult<GitGraphWorkingTreeChanges>>;
        'agent:gitGraph/readWorkingTreeFile': (request: GitGraphRepositoryRequest<GitGraphWorkingTreeFileRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>;
        'agent:gitGraph/compare': (request: GitGraphRepositoryRequest<GitGraphCompareRequest>, signal?: AbortSignal) => Promise<RemoteResult<GitGraphCompareResult>>;
        'agent:gitGraph/metadata': (request: GitGraphRepositoryScope, signal?: AbortSignal) => Promise<RemoteResult<GitGraphMetadata>>;
    }
}
/** Client contract selected by the graph view's Cordis fiber. */
export declare const TYPERT_REMOTE: TypertRemoteContribution;
export { gitGraphReadCommitInvocation, gitGraphFileInvocation, gitGraphFileDiffInvocation, gitGraphWorkingTreeInvocation, gitGraphWorkingTreeFileInvocation, gitGraphCompareInvocation, gitGraphMetadataInvocation, };
export default TYPERT_REMOTE;
