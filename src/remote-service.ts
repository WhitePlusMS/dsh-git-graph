import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {
  GitGraphCommitDetails,
  GitGraphCompareRequest,
  GitGraphCompareResult,
  GitGraphFileContent,
  GitGraphFileDiff,
  GitGraphFileDiffRequest,
  GitGraphFileRequest,
  GitGraphInput,
  GitGraphMetadata,
  GitGraphSnapshot,
  GitGraphWorkingTreeChanges,
  GitGraphWorkingTreeFileRequest,
  GitGraphWorkingTreeRequest,
} from './domain.ts'
import { loadCommitDetails, loadCompare, loadFile, loadFileDiff, loadGitGraph, loadMetadata, loadWorkingTreeChanges, loadWorkingTreeFile } from './git.ts'

/** Resolve the current session working directory for on-demand reads. */
function workspaceOf(agent: Agent): string {
  return agent.session.header.cwd || process.cwd()
}

/** Read-only Host service for the independent conversation Git Graph view. */
export class GitGraphRemoteService extends TypertRemoteService {
  private readonly hostContext: Context

  constructor(ctx: Context) {
    super(ctx, 'gitGraph')
    this.hostContext = ctx
  }

  async read(agent: Agent, request: GitGraphInput, signal: AbortSignal): Promise<GitGraphSnapshot> {
    return loadGitGraph(this.hostContext, request, { agent, signal })
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
