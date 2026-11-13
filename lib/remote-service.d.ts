import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { GitGraphAvatarRequest, GitGraphAvatarResult, GitGraphCommitDetails, GitGraphCommitRequest, GitGraphCompareRequest, GitGraphCompareResult, GitGraphFileContent, GitGraphFileDiff, GitGraphFileDiffRequest, GitGraphFileRequest, GitGraphQuery, GitGraphMetadata, GitGraphSnapshot, GitGraphWorkingTreeChanges, GitGraphWorkingTreeFileRequest, GitGraphRepositories, GitGraphRepositoryRequest, GitGraphRepositoryScope } from './domain.js';
/** Read-only Host service for the session-bound right-sidebar Git Graph page. */
export declare class GitGraphRemoteService extends TypertRemoteService {
    private readonly hostContext;
    private readonly avatarStore;
    constructor(ctx: Context);
    private target;
    repositories(agent: Agent, _request: Record<string, never>, signal: AbortSignal): Promise<GitGraphRepositories>;
    read(agent: Agent, request: GitGraphRepositoryRequest<GitGraphQuery>, signal: AbortSignal): Promise<GitGraphSnapshot>;
    avatars(agent: Agent, request: GitGraphRepositoryRequest<GitGraphAvatarRequest>, signal: AbortSignal): Promise<GitGraphAvatarResult>;
    readCommit(agent: Agent, request: GitGraphRepositoryRequest<GitGraphCommitRequest>, signal: AbortSignal): Promise<GitGraphCommitDetails>;
    readFile(agent: Agent, request: GitGraphRepositoryRequest<GitGraphFileRequest>, signal: AbortSignal): Promise<GitGraphFileContent>;
    readFileDiff(agent: Agent, request: GitGraphRepositoryRequest<GitGraphFileDiffRequest>, signal: AbortSignal): Promise<GitGraphFileDiff>;
    readWorkingTree(agent: Agent, request: GitGraphRepositoryScope, signal: AbortSignal): Promise<GitGraphWorkingTreeChanges>;
    readWorkingTreeFile(agent: Agent, request: GitGraphRepositoryRequest<GitGraphWorkingTreeFileRequest>, signal: AbortSignal): Promise<GitGraphFileDiff>;
    compare(agent: Agent, request: GitGraphRepositoryRequest<GitGraphCompareRequest>, signal: AbortSignal): Promise<GitGraphCompareResult>;
    metadata(agent: Agent, request: GitGraphRepositoryScope, signal: AbortSignal): Promise<GitGraphMetadata>;
}
