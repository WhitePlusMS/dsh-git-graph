import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
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
import { loadAvatarAuthors, loadCommitDetails, loadCompare, loadFile, loadFileDiff, loadGitGraph, loadMetadata, loadRepositories, loadWorkingTreeChanges, loadWorkingTreeFile, resolveSubmodule } from './git.ts'
import { AvatarStore } from './avatars.ts'

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

  async repositories(agent: Agent, _request: Record<string, never>, signal: AbortSignal): Promise<GitGraphRepositories> {
    return loadRepositories(this.hostContext, workspaceOf(agent), signal)
  }

  async read(agent: Agent, request: GitGraphRepositoryRequest<GitGraphQuery>, signal: AbortSignal): Promise<GitGraphSnapshot> {
    return loadGitGraph(this.hostContext, { ...request.input, path: await this.target(agent, request, signal) }, { signal })
  }

  async avatars(agent: Agent, request: GitGraphRepositoryRequest<GitGraphAvatarRequest>, signal: AbortSignal): Promise<GitGraphAvatarResult> {
    const { authors, remote } = await loadAvatarAuthors(this.hostContext, await this.target(agent, request, signal), request.input.hashes, signal)
    return { avatars: await this.avatarStore.read(authors, remote, request.input.source, signal) }
  }

  async readCommit(agent: Agent, request: GitGraphRepositoryRequest<GitGraphCommitRequest>, signal: AbortSignal): Promise<GitGraphCommitDetails> {
    return loadCommitDetails(this.hostContext, await this.target(agent, request, signal), request.input.hash, signal)
  }

  async readFile(agent: Agent, request: GitGraphRepositoryRequest<GitGraphFileRequest>, signal: AbortSignal): Promise<GitGraphFileContent> {
    return loadFile(this.hostContext, await this.target(agent, request, signal), request.input, signal)
  }

  async readFileDiff(agent: Agent, request: GitGraphRepositoryRequest<GitGraphFileDiffRequest>, signal: AbortSignal): Promise<GitGraphFileDiff> {
    return loadFileDiff(this.hostContext, await this.target(agent, request, signal), request.input, signal)
  }

  async readWorkingTree(agent: Agent, request: GitGraphRepositoryScope, signal: AbortSignal): Promise<GitGraphWorkingTreeChanges> {
    return loadWorkingTreeChanges(this.hostContext, await this.target(agent, request, signal), signal)
  }

  async readWorkingTreeFile(agent: Agent, request: GitGraphRepositoryRequest<GitGraphWorkingTreeFileRequest>, signal: AbortSignal): Promise<GitGraphFileDiff> {
    return loadWorkingTreeFile(this.hostContext, await this.target(agent, request, signal), request.input, signal)
  }

  async compare(agent: Agent, request: GitGraphRepositoryRequest<GitGraphCompareRequest>, signal: AbortSignal): Promise<GitGraphCompareResult> {
    return loadCompare(this.hostContext, await this.target(agent, request, signal), request.input, signal)
  }

  async metadata(agent: Agent, request: GitGraphRepositoryScope, signal: AbortSignal): Promise<GitGraphMetadata> {
    return loadMetadata(this.hostContext, await this.target(agent, request, signal), signal)
  }
}
