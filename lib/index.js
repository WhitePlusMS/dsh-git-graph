/**
 * DSH Loader entry. The browser half is discovered from package.json
 * `dsh.client` and `exports["./client"]`; it is intentionally not imported by
 * this Host module.
 */
export const name = 'ui-git-graph';
export const inject = ['subprocess', 'tools', 'systemPrompt'];
export { apply } from './runtime.js';
export { GitGraphRemoteService } from './remote-service.js';
