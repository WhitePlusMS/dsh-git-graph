import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { GitGraphInput, GitGraphSnapshot } from './domain.js';
/** Read-only Host service for the independent conversation Git Graph view. */
export declare class GitGraphRemoteService extends TypertRemoteService {
    private readonly hostContext;
    constructor(ctx: Context);
    read(agent: Agent, request: GitGraphInput, signal: AbortSignal): Promise<GitGraphSnapshot>;
}
