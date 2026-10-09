import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {
  GitGraphAvatarRequest,
  GitGraphAvatarResult,
  GitGraphCommitDetails,
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
  GitGraphWorkingTreeRequest,
} from './domain.ts'
import { loadAvatarAuthors, loadCommitDetails, loadCompare, loadFile, loadFileDiff, loadGitGraph, loadMetadata, loadWorkingTreeChanges, loadWorkingTreeFile } from './git.ts'
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

  async read(agent: Agent, request: GitGraphQuery, signal: AbortSignal): Promise<GitGraphSnapshot> {
    return loadGitGraph(this.hostContext, request, { agent, signal })
  }

  async avatars(agent: Agent, request: GitGraphAvatarRequest, signal: AbortSignal): Promise<GitGraphAvatarResult> {
    const { authors, remote } = await loadAvatarAuthors(this.hostContext, workspaceOf(agent), request.hashes, signal)
    return { avatars: await this.avatarStore.read(authors, remote, request.source, signal) }
  }

  async readCommit(agent: Agent, request: { hash: string }, signal: AbortSignal): Promise<GitGraphCommitDetails> {
    return loadCommitDetails(this.hostContext, workspaceOf(agent), request.hash, signal)
  }

  async readFile(agent: Agent, request: GitGraphFileRequest, signal: AbortSignal): Promise<GitGraphFileContent> {
    return loadFile(this.hostContext, workspaceOf(agent), request, signal)
  }

  async readFileDiff(agent: Agent, request: GitGraphFileDiffRequest, signal: AbortSignal): Promise<GitGraphFileDiff> {
    return loadFileDiff(this.hostContext, workspaceOf(agent), request, signal)
  }

  async readWorkingTree(agent: Agent, _request: GitGraphWorkingTreeRequest, signal: AbortSignal): Promise<GitGraphWorkingTreeChanges> {
    return loadWorkingTreeChanges(this.hostContext, workspaceOf(agent), signal)
  }

  async readWorkingTreeFile(agent: Agent, request: GitGraphWorkingTreeFileRequest, signal: AbortSignal): Promise<GitGraphFileDiff> {
    return loadWorkingTreeFile(this.hostContext, workspaceOf(agent), request, signal)
  }

  async compare(agent: Agent, request: GitGraphCompareRequest, signal: AbortSignal): Promise<GitGraphCompareResult> {
    return loadCompare(this.hostContext, workspaceOf(agent), request, signal)
  }

  async metadata(_agent: Agent, _request: Record<string, never>, signal: AbortSignal): Promise<GitGraphMetadata> {
    return loadMetadata(this.hostContext, workspaceOf(_agent), signal)
  }
}
