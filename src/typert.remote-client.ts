import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import type { GitGraphInput, GitGraphSnapshot } from './domain.ts'
import { gitGraphDescriptors, TYPERT_PACKAGE } from './typert.shared.ts'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespace$6769744772617068 {
    read: (agentId: string, request: GitGraphInput) => Promise<RemoteResult<GitGraphSnapshot>>
  }

  interface TypertRemoteMap {
    'gitGraph/read': (agentId: string, request: GitGraphInput) => Promise<RemoteResult<GitGraphSnapshot>>
  }

  interface TypertRemoteNamespaceMap {
    gitGraph: TypertRemoteNamespace$6769744772617068
  }

  interface TypertRemoteScopeMap {
    'agent:gitGraph/read': (request: GitGraphInput) => Promise<RemoteResult<GitGraphSnapshot>>
  }
}

/** Client contract selected by the graph view's Cordis fiber. */
export const TYPERT_REMOTE: TypertRemoteContribution = {
  package: TYPERT_PACKAGE,
  descriptors: gitGraphDescriptors,
}

export default TYPERT_REMOTE
