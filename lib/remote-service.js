import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { loadAvatarAuthors, loadCommitDetails, loadCompare, loadFile, loadFileDiff, loadGitGraph, loadMetadata, loadRepositories, loadWorkingTreeChanges, loadWorkingTreeFile, resolveSubmodule } from './git.js';
import { AvatarStore } from './avatars.js';
/** Resolve the current session working directory for on-demand reads. */
function workspaceOf(agent) {
    return agent.session.header.cwd || process.cwd();
}
/** Read-only Host service for the session-bound right-sidebar Git Graph page. */
export class GitGraphRemoteService extends TypertRemoteService {
    hostContext;
    avatarStore = new AvatarStore();
    constructor(ctx) {
        super(ctx, 'gitGraph');
        this.hostContext = ctx;
    }
    target(agent, request, signal) {
        const cwd = workspaceOf(agent);
        return request.repository === null ? cwd : resolveSubmodule(this.hostContext, cwd, request.repository, signal);
    }
    async repositories(agent, _request, signal) {
        return loadRepositories(this.hostContext, workspaceOf(agent), signal);
    }
    async read(agent, request, signal) {
        return loadGitGraph(this.hostContext, { ...request.input, path: await this.target(agent, request, signal) }, { signal });
    }
    async avatars(agent, request, signal) {
        const { authors, remote } = await loadAvatarAuthors(this.hostContext, await this.target(agent, request, signal), request.input.hashes, signal);
        return { avatars: await this.avatarStore.read(authors, remote, request.input.source, signal) };
    }
    async readCommit(agent, request, signal) {
        return loadCommitDetails(this.hostContext, await this.target(agent, request, signal), request.input.hash, signal);
    }
    async readFile(agent, request, signal) {
        return loadFile(this.hostContext, await this.target(agent, request, signal), request.input, signal);
    }
    async readFileDiff(agent, request, signal) {
        return loadFileDiff(this.hostContext, await this.target(agent, request, signal), request.input, signal);
    }
    async readWorkingTree(agent, request, signal) {
        return loadWorkingTreeChanges(this.hostContext, await this.target(agent, request, signal), signal);
    }
    async readWorkingTreeFile(agent, request, signal) {
        return loadWorkingTreeFile(this.hostContext, await this.target(agent, request, signal), request.input, signal);
    }
    async compare(agent, request, signal) {
        return loadCompare(this.hostContext, await this.target(agent, request, signal), request.input, signal);
    }
    async metadata(agent, request, signal) {
        return loadMetadata(this.hostContext, await this.target(agent, request, signal), signal);
    }
}
