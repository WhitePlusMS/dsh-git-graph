import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { loadAvatarAuthors, loadCommitDetails, loadCompare, loadFile, loadFileDiff, loadGitGraph, loadMetadata, loadWorkingTreeChanges, loadWorkingTreeFile } from './git.js';
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
    async read(agent, request, signal) {
        return loadGitGraph(this.hostContext, request, { agent, signal });
    }
    async avatars(agent, request, signal) {
        const { authors, remote } = await loadAvatarAuthors(this.hostContext, workspaceOf(agent), request.hashes, signal);
        return { avatars: await this.avatarStore.read(authors, remote, request.source, signal) };
    }
    async readCommit(agent, request, signal) {
        return loadCommitDetails(this.hostContext, workspaceOf(agent), request.hash, signal);
    }
    async readFile(agent, request, signal) {
        return loadFile(this.hostContext, workspaceOf(agent), request, signal);
    }
    async readFileDiff(agent, request, signal) {
        return loadFileDiff(this.hostContext, workspaceOf(agent), request, signal);
    }
    async readWorkingTree(agent, _request, signal) {
        return loadWorkingTreeChanges(this.hostContext, workspaceOf(agent), signal);
    }
    async readWorkingTreeFile(agent, request, signal) {
        return loadWorkingTreeFile(this.hostContext, workspaceOf(agent), request, signal);
    }
    async compare(agent, request, signal) {
        return loadCompare(this.hostContext, workspaceOf(agent), request, signal);
    }
    async metadata(_agent, _request, signal) {
        return loadMetadata(this.hostContext, workspaceOf(_agent), signal);
    }
}
