import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { GitGraphInput, GitGraphSnapshot } from './domain.ts'
import { loadGitGraph } from './git.ts'

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
}
