import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { loadGitGraph } from './git.js';
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
}
