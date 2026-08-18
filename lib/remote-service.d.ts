import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { GitGraphCommitDetails, GitGraphCompareRequest, GitGraphCompareResult, GitGraphFileContent, GitGraphFileDiff, GitGraphFileDiffRequest, GitGraphFileRequest, GitGraphInput, GitGraphMetadata, GitGraphSnapshot, GitGraphWorkingTreeChanges, GitGraphWorkingTreeFileRequest, GitGraphWorkingTreeRequest } from './domain.js';
/** Read-only Host service for the independent conversation Git Graph view. */
export declare class GitGraphRemoteService extends TypertRemoteService {
    private readonly hostContext;
    constructor(ctx: Context);
    read(agent: Agent, request: GitGraphInput, signal: AbortSignal): Promise<GitGraphSnapshot>;
    readCommit(agent: Agent, request: {
        hash: string;
    }, signal: AbortSignal): Promise<GitGraphCommitDetails>;
    readFile(agent: Agent, request: GitGraphFileRequest, signal: AbortSignal): Promise<GitGraphFileContent>;
    readFileDiff(agent: Agent, request: GitGraphFileDiffRequest, signal: AbortSignal): Promise<GitGraphFileDiff>;
    readWorkingTree(agent: Agent, _request: GitGraphWorkingTreeRequest, signal: AbortSignal): Promise<GitGraphWorkingTreeChanges>;
    readWorkingTreeFile(agent: Agent, request: GitGraphWorkingTreeFileRequest, signal: AbortSignal): Promise<GitGraphFileDiff>;
    compare(agent: Agent, request: GitGraphCompareRequest, signal: AbortSignal): Promise<GitGraphCompareResult>;
    metadata(_agent: Agent, _request: Record<string, never>, signal: AbortSignal): Promise<GitGraphMetadata>;
}
