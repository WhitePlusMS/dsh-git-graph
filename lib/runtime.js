import { defineTool } from '@deepseek-ai/dsh-tools';
import { MAX_COMMITS } from './domain.js';
import { loadGitGraph } from './git.js';
import { GitGraphRemoteService } from './remote-service.js';
const GRAPH_OUTPUT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        path: { type: 'string', required: true },
        branch: { oneOf: [{ type: 'string' }, { type: 'null' }], required: true },
        head: { oneOf: [{ type: 'string' }, { type: 'null' }], required: true },
        workingTree: {
            type: 'object',
            additionalProperties: false,
            required: true,
            properties: {
                changed: { type: 'boolean', required: true },
                summary: { type: 'string', required: true },
            },
        },
        commits: {
            type: 'array',
            required: true,
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    hash: { type: 'string', required: true },
                    parents: { type: 'array', required: true, items: { type: 'string' } },
                    author: { type: 'string', required: true },
                    email: { type: 'string', required: true },
                    date: { type: 'string', required: true },
                    subject: { type: 'string', required: true },
                    refs: {
                        type: 'array',
                        required: true,
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                kind: { type: 'string', required: true, enum: ['head', 'remote', 'tag'] },
                                name: { type: 'string', required: true },
                            },
                        },
                    },
                    isHead: { type: 'boolean', required: true },
                },
            },
        },
    },
};
function summaryText(value) {
    const branch = value.branch === null ? 'detached/unknown' : value.branch;
    const head = value.head === null ? 'no commits' : value.head.slice(0, 12);
    const lines = [`Git graph: ${value.path}`, `branch=${branch}, head=${head}, ${value.workingTree.summary}`, `commits=${value.commits.length}`];
    for (const commit of value.commits.slice(0, 8)) {
        const refs = commit.refs.length === 0 ? '' : ` [${commit.refs.map(ref => ref.name).join(', ')}]`;
        lines.push(`${commit.hash.slice(0, 8)} ${commit.subject}${refs}`);
    }
    return lines.join('\n');
}
/** Register the single read-only Git graph tool. */
export function apply(ctx) {
    // The service is session-scoped by the Host context and is read by the
    // independently mounted Client conversation view through Typert RPC.
    new GitGraphRemoteService(ctx);
    ctx.systemPrompt.section({
        name: 'tool:git_graph',
        order: 116,
        text: `Use git_graph to inspect the repository commit topology, branch/tag/remote references, and working-tree state. It accepts an optional path, max_commits from 1 to ${MAX_COMMITS}, all, and first_parent. It is read-only; do not infer that it can mutate Git.`,
    });
    ctx.tools.register(defineTool({
        name: 'git_graph',
        description: 'Read a repository Git graph with commits, parents, branch/tag/remote references, HEAD, and working-tree state. This tool is read-only.',
        parameters: {
            path: { type: 'string', description: 'Repository directory. Defaults to the current session workspace.' },
            max_commits: { type: 'number', description: `Maximum commits to load, from 1 to ${MAX_COMMITS}. Defaults to 100.` },
            all: { type: 'boolean', description: 'Include all reachable refs. Defaults to true.' },
            first_parent: { type: 'boolean', description: 'Follow only first parents. Defaults to false.' },
        },
        output: {
            schema: GRAPH_OUTPUT_SCHEMA,
            render: (_args, value) => [{ type: 'text', text: summaryText(value) }],
            presentationMeta: (_args, value) => value,
        },
        timeoutMs: 30_000,
        execute: (args, exec) => loadGitGraph(ctx, {
            ...(args.path === undefined ? {} : { path: args.path }),
            ...(args.max_commits === undefined ? {} : { maxCommits: args.max_commits }),
            ...(args.all === undefined ? {} : { all: args.all }),
            ...(args.first_parent === undefined ? {} : { firstParent: args.first_parent }),
        }, exec),
        presentCall: args => ({
            card: 'generic',
            title: 'Load Git graph',
            kind: 'read',
            ...args.path === undefined ? {} : { locations: [{ path: args.path, line: 1 }] },
        }),
    }));
}
