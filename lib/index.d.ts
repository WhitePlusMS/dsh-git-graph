/**
 * DSH Loader entry. The browser half is discovered from package.json
 * `dsh.client` and `exports["./client"]`; it is intentionally not imported by
 * this Host module.
 */
export declare const name = "ui-git-graph";
export declare const inject: string[];
export { apply } from './runtime.js';
export { GitGraphRemoteService } from './remote-service.js';
export type { GitGraphCommit, GitGraphInput, GitGraphRef, GitGraphSnapshot } from './domain.js';
