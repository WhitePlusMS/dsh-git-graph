import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { loadCommitDetails, loadCompare, loadFile, loadFileDiff, loadGitGraph, loadMetadata, loadWorkingTreeChanges, loadWorkingTreeFile } from './git.js';
/** Resolve the current session working directory for on-demand reads. */
function workspaceOf(agent) {
    return agent.session.header.cwd || process.cwd();
}
/** Read-only Host service for the independent conversation Git Graph view. */
export class GitGraphRemoteService extends TypertRemoteService {
    hostContext;
    constructor(ctx) {
        super(ctx, 'gitGraph');
        this.hostContext = ctx;
    }
    async read(agent, request, signal) {
        return loadGitGraph(this.hostContext, request, { agent, signal });
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
