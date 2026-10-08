import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import type {
  GitGraphCompareRequest,
  GitGraphCompareResult,
  GitGraphCommitDetails,
  GitGraphFileContent,
  GitGraphFileDiff,
  GitGraphFileRequest,
  GitGraphQuery,
  GitGraphMetadata,
  GitGraphSnapshot,
  GitGraphWorkingTreeChanges,
  GitGraphWorkingTreeFileRequest,
  GitGraphWorkingTreeRequest,
} from './domain.ts'
import {
  gitGraphCompareInvocation,
  gitGraphDescriptors,
  gitGraphFileDiffInvocation,
  gitGraphFileInvocation,
  gitGraphMetadataInvocation,
  gitGraphReadCommitInvocation,
  gitGraphWorkingTreeFileInvocation,
  gitGraphWorkingTreeInvocation,
  TYPERT_PACKAGE,
} from './typert.shared.ts'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespace$6769744772617068 {
    read: (agentId: SessionId, request: GitGraphQuery) => Promise<RemoteResult<GitGraphSnapshot>>
    readCommit: (agentId: SessionId, request: { hash: string }) => Promise<RemoteResult<GitGraphCommitDetails>>
    readFile: (agentId: SessionId, request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileContent>>
    readFileDiff: (agentId: SessionId, request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>
    readWorkingTree: (agentId: SessionId, request: GitGraphWorkingTreeRequest) => Promise<RemoteResult<GitGraphWorkingTreeChanges>>
    readWorkingTreeFile: (agentId: SessionId, request: GitGraphWorkingTreeFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>
    compare: (agentId: SessionId, request: GitGraphCompareRequest) => Promise<RemoteResult<GitGraphCompareResult>>
    metadata: (agentId: SessionId, request: Record<string, never>) => Promise<RemoteResult<GitGraphMetadata>>
  }

  interface TypertRemoteMap {
    'gitGraph/read': (agentId: SessionId, request: GitGraphQuery) => Promise<RemoteResult<GitGraphSnapshot>>
    'gitGraph/readCommit': (agentId: SessionId, request: { hash: string }) => Promise<RemoteResult<GitGraphCommitDetails>>
    'gitGraph/readFile': (agentId: SessionId, request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileContent>>
    'gitGraph/readFileDiff': (agentId: SessionId, request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>
    'gitGraph/readWorkingTree': (agentId: SessionId, request: GitGraphWorkingTreeRequest) => Promise<RemoteResult<GitGraphWorkingTreeChanges>>
    'gitGraph/readWorkingTreeFile': (agentId: SessionId, request: GitGraphWorkingTreeFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>
    'gitGraph/compare': (agentId: SessionId, request: GitGraphCompareRequest) => Promise<RemoteResult<GitGraphCompareResult>>
    'gitGraph/metadata': (agentId: SessionId, request: Record<string, never>) => Promise<RemoteResult<GitGraphMetadata>>
  }

  interface TypertRemoteNamespaceMap {
    gitGraph: TypertRemoteNamespace$6769744772617068
  }

  interface TypertRemoteScopeMap {
    'agent:gitGraph/read': (request: GitGraphQuery) => Promise<RemoteResult<GitGraphSnapshot>>
    'agent:gitGraph/readCommit': (request: { hash: string }) => Promise<RemoteResult<GitGraphCommitDetails>>
    'agent:gitGraph/readFile': (request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileContent>>
    'agent:gitGraph/readFileDiff': (request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>
    'agent:gitGraph/readWorkingTree': (request: GitGraphWorkingTreeRequest) => Promise<RemoteResult<GitGraphWorkingTreeChanges>>
    'agent:gitGraph/readWorkingTreeFile': (request: GitGraphWorkingTreeFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>
    'agent:gitGraph/compare': (request: GitGraphCompareRequest) => Promise<RemoteResult<GitGraphCompareResult>>
    'agent:gitGraph/metadata': (request: Record<string, never>) => Promise<RemoteResult<GitGraphMetadata>>
  }
}

/** Client contract selected by the graph view's Cordis fiber. */
export const TYPERT_REMOTE: TypertRemoteContribution = {
  package: TYPERT_PACKAGE,
  descriptors: gitGraphDescriptors,
}

export {
  gitGraphReadCommitInvocation,
  gitGraphFileInvocation,
  gitGraphFileDiffInvocation,
  gitGraphWorkingTreeInvocation,
  gitGraphWorkingTreeFileInvocation,
  gitGraphCompareInvocation,
  gitGraphMetadataInvocation,
}

export default TYPERT_REMOTE
