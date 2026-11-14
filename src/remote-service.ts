import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {
  GitGraphAvatarRequest,
  GitGraphAvatarResult,
  GitGraphCommitDetails,
  GitGraphCommitRequest,
  GitGraphCompareRequest,
  GitGraphCompareResult,
  GitGraphFileContent,
  GitGraphFileDiff,
  GitGraphFileDiffRequest,
  GitGraphFileRequest,
  GitGraphQuery,
  GitGraphMetadata,
  GitGraphSnapshot,
  GitGraphWorkingTreeChanges,
  GitGraphWorkingTreeFileRequest,
  GitGraphRepositories,
  GitGraphRepositoryRequest,
  GitGraphRepositoryScope,
} from './domain.ts'
import { GitObjectMissingError, GitOutputLimitError, GitSubmoduleUnavailableError, loadAvatarAuthors, loadCommitDetails, loadCompare, loadFile, loadFileDiff, loadGitGraph, loadMetadata, loadRepositories, loadWorkingTreeChanges, loadWorkingTreeFile, resolveSubmodule } from './git.ts'
import { AvatarStore } from './avatars.ts'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    'gitGraph/missing-object': Record<string, never>
    'gitGraph/output-limit': Record<string, never>
    'gitGraph/submodule-unavailable': Record<string, never>
    'gitGraph/timeout': Record<string, never>
  }
}

/** Resolve the current session working directory for on-demand reads. */
function workspaceOf(agent: Agent): string {
  return agent.session.header.cwd || process.cwd()
}

/** Read-only Host service for the session-bound right-sidebar Git Graph page. */
export class GitGraphRemoteService extends TypertRemoteService {
  private readonly hostContext: Context
  private readonly avatarStore = new AvatarStore()

  constructor(ctx: Context) {
    super(ctx, 'gitGraph')
    this.hostContext = ctx
  }

  private target(agent: Agent, request: GitGraphRepositoryScope, signal: AbortSignal): string | Promise<string> {
    const cwd = workspaceOf(agent)
    return request.repository === null ? cwd : resolveSubmodule(this.hostContext, cwd, request.repository, signal)
  }

  private async git<T>(signal: AbortSignal, read: (operation: AbortSignal) => Promise<T>): Promise<T> {
    const timeout = AbortSignal.timeout(30_000)
    try {
      return await read(AbortSignal.any([signal, timeout]))
    } catch (error) {
      signal.throwIfAborted()
      if (timeout.aborted) throw new RemoteError('gitGraph/timeout', 'Git 读取超时，请重试', {}, { cause: error })
      if (error instanceof GitObjectMissingError) throw new RemoteError('gitGraph/missing-object', error.message, {}, { cause: error })
      if (error instanceof GitOutputLimitError) throw new RemoteError('gitGraph/output-limit', error.message, {}, { cause: error })
      if (error instanceof GitSubmoduleUnavailableError) throw new RemoteError('gitGraph/submodule-unavailable', error.message, {}, { cause: error })
      throw error
    }
  }

  async repositories(agent: Agent, _request: Record<string, never>, signal: AbortSignal): Promise<GitGraphRepositories> {
    return this.git(signal, operation => loadRepositories(this.hostContext, workspaceOf(agent), operation))
  }

  async read(agent: Agent, request: GitGraphRepositoryRequest<GitGraphQuery>, signal: AbortSignal): Promise<GitGraphSnapshot> {
    return this.git(signal, async operation => loadGitGraph(this.hostContext, { ...request.input, path: await this.target(agent, request, operation) }, { signal: operation }))
  }

  async avatars(agent: Agent, request: GitGraphRepositoryRequest<GitGraphAvatarRequest>, signal: AbortSignal): Promise<GitGraphAvatarResult> {
    const { authors, remote } = await this.git(signal, async operation => loadAvatarAuthors(this.hostContext, await this.target(agent, request, operation), request.input.hashes, operation))
    return { avatars: await this.avatarStore.read(authors, remote, request.input.source, signal) }
  }

  async readCommit(agent: Agent, request: GitGraphRepositoryRequest<GitGraphCommitRequest>, signal: AbortSignal): Promise<GitGraphCommitDetails> {
    return this.git(signal, async operation => loadCommitDetails(this.hostContext, await this.target(agent, request, operation), request.input.hash, operation))
  }

  async readFile(agent: Agent, request: GitGraphRepositoryRequest<GitGraphFileRequest>, signal: AbortSignal): Promise<GitGraphFileContent> {
    return this.git(signal, async operation => loadFile(this.hostContext, await this.target(agent, request, operation), request.input, operation))
  }

  async readFileDiff(agent: Agent, request: GitGraphRepositoryRequest<GitGraphFileDiffRequest>, signal: AbortSignal): Promise<GitGraphFileDiff> {
    return this.git(signal, async operation => loadFileDiff(this.hostContext, await this.target(agent, request, operation), request.input, operation))
  }

  async readWorkingTree(agent: Agent, request: GitGraphRepositoryScope, signal: AbortSignal): Promise<GitGraphWorkingTreeChanges> {
    return this.git(signal, async operation => loadWorkingTreeChanges(this.hostContext, await this.target(agent, request, operation), operation))
  }

  async readWorkingTreeFile(agent: Agent, request: GitGraphRepositoryRequest<GitGraphWorkingTreeFileRequest>, signal: AbortSignal): Promise<GitGraphFileDiff> {
    return this.git(signal, async operation => loadWorkingTreeFile(this.hostContext, await this.target(agent, request, operation), request.input, operation))
  }

  async compare(agent: Agent, request: GitGraphRepositoryRequest<GitGraphCompareRequest>, signal: AbortSignal): Promise<GitGraphCompareResult> {
    return this.git(signal, async operation => loadCompare(this.hostContext, await this.target(agent, request, operation), request.input, operation))
  }

  async metadata(agent: Agent, request: GitGraphRepositoryScope, signal: AbortSignal): Promise<GitGraphMetadata> {
    return this.git(signal, async operation => loadMetadata(this.hostContext, await this.target(agent, request, operation), operation))
  }
}
