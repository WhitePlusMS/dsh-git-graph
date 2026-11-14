import { RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { GitObjectMissingError, GitOutputLimitError, GitSubmoduleUnavailableError, loadAvatarAuthors, loadCommitDetails, loadCompare, loadFile, loadFileDiff, loadGitGraph, loadMetadata, loadRepositories, loadWorkingTreeChanges, loadWorkingTreeFile, resolveSubmodule } from "./git.js";
import { AvatarStore } from "./avatars.js";
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
    async git(signal, read) {
        const timeout = AbortSignal.timeout(30_000);
        try {
            return await read(AbortSignal.any([signal, timeout]));
        }
        catch (error) {
            signal.throwIfAborted();
            if (timeout.aborted)
                throw new RemoteError('gitGraph/timeout', 'Git 读取超时，请重试', {}, { cause: error });
            if (error instanceof GitObjectMissingError)
                throw new RemoteError('gitGraph/missing-object', error.message, {}, { cause: error });
            if (error instanceof GitOutputLimitError)
                throw new RemoteError('gitGraph/output-limit', error.message, {}, { cause: error });
            if (error instanceof GitSubmoduleUnavailableError)
                throw new RemoteError('gitGraph/submodule-unavailable', error.message, {}, { cause: error });
            throw error;
        }
    }
    async repositories(agent, _request, signal) {
        return this.git(signal, operation => loadRepositories(this.hostContext, workspaceOf(agent), operation));
    }
    async read(agent, request, signal) {
        return this.git(signal, async (operation) => loadGitGraph(this.hostContext, { ...request.input, path: await this.target(agent, request, operation) }, { signal: operation }));
    }
    async avatars(agent, request, signal) {
        const { authors, remote } = await this.git(signal, async (operation) => loadAvatarAuthors(this.hostContext, await this.target(agent, request, operation), request.input.hashes, operation));
        return { avatars: await this.avatarStore.read(authors, remote, request.input.source, signal) };
    }
    async readCommit(agent, request, signal) {
        return this.git(signal, async (operation) => loadCommitDetails(this.hostContext, await this.target(agent, request, operation), request.input.hash, operation));
    }
    async readFile(agent, request, signal) {
        return this.git(signal, async (operation) => loadFile(this.hostContext, await this.target(agent, request, operation), request.input, operation));
    }
    async readFileDiff(agent, request, signal) {
        return this.git(signal, async (operation) => loadFileDiff(this.hostContext, await this.target(agent, request, operation), request.input, operation));
    }
    async readWorkingTree(agent, request, signal) {
        return this.git(signal, async (operation) => loadWorkingTreeChanges(this.hostContext, await this.target(agent, request, operation), operation));
    }
    async readWorkingTreeFile(agent, request, signal) {
        return this.git(signal, async (operation) => loadWorkingTreeFile(this.hostContext, await this.target(agent, request, operation), request.input, operation));
    }
    async compare(agent, request, signal) {
        return this.git(signal, async (operation) => loadCompare(this.hostContext, await this.target(agent, request, operation), request.input, operation));
    }
    async metadata(agent, request, signal) {
        return this.git(signal, async (operation) => loadMetadata(this.hostContext, await this.target(agent, request, operation), operation));
    }
}
