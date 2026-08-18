import { z } from 'zod';
import { MAX_COMMITS } from './domain.js';
import { createGitGraphInvocation, TYPERT_PACKAGE } from './typert.shared.js';
/** Host-only zod codecs required by dsh-typert-loader for RPC registration. */
const hostRefSchema = z.object({
    kind: z.enum(['head', 'remote', 'tag']),
    name: z.string(),
}).strict();
const hostCommitSchema = z.object({
    hash: z.string(),
    parents: z.array(z.string()),
    author: z.string(),
    email: z.string(),
    date: z.string(),
    subject: z.string(),
    refs: z.array(hostRefSchema),
    isHead: z.boolean(),
}).strict();
const hostInputSchema = z.object({
    path: z.string().optional(),
    maxCommits: z.number().int().min(1).max(MAX_COMMITS).optional(),
    all: z.boolean().optional(),
    firstParent: z.boolean().optional(),
    glob: z.array(z.string()).optional(),
    search: z.string().optional(),
    sort: z.enum(['date', 'author-date', 'topological']).optional(),
}).strict();
const hostSnapshotSchema = z.object({
    path: z.string(),
    state: z.enum(['not-git', 'empty', 'ready']),
    branch: z.string().nullable(),
    head: z.string().nullable(),
    workingTree: z.object({
        changed: z.boolean(),
        summary: z.string(),
    }).strict(),
    commits: z.array(hostCommitSchema),
    hasMore: z.boolean(),
}).strict();
const hashSchema = z.string().regex(/^[0-9a-f]{40}$/iu);
const nullableIntSchema = z.number().int().min(0).nullable();
const hostFileChangeSchema = z.object({
    type: z.enum(['A', 'M', 'D', 'R', 'U']),
    oldPath: z.string(),
    newPath: z.string(),
    additions: nullableIntSchema,
    deletions: nullableIntSchema,
}).strict();
const hostSignatureSchema = z.object({
    status: z.enum(['G', 'U', 'X', 'Y', 'R', 'E', 'B']),
    key: z.string().nullable(),
    signer: z.string().nullable(),
}).strict();
const hostCommitRequestSchema = z.object({ hash: hashSchema }).strict();
const hostCommitDetailsSchema = z.object({
    hash: z.string(),
    parents: z.array(z.string()),
    author: z.string(),
    authorEmail: z.string(),
    committer: z.string(),
    committerEmail: z.string(),
    timestamps: z.object({
        authorDate: z.string(),
        committerDate: z.string(),
    }).strict(),
    signature: hostSignatureSchema.nullable(),
    body: z.string(),
    fileChanges: z.array(hostFileChangeSchema),
}).strict();
const hostFileRequestSchema = z.object({ hash: hashSchema, path: z.string() }).strict();
const hostFileContentSchema = z.object({
    hash: z.string(),
    path: z.string(),
    kind: z.enum(['text', 'binary']),
    text: z.string().nullable(),
    size: z.number().int().min(0),
    truncated: z.boolean(),
}).strict();
const hostDiffLineSchema = z.object({
    type: z.enum(['context', 'added', 'removed']),
    content: z.string(),
    oldLine: z.number().int().min(0).nullable(),
    newLine: z.number().int().min(0).nullable(),
}).strict();
const hostFileDiffSchema = z.object({
    hash: z.string(),
    path: z.string(),
    oldPath: z.string(),
    status: z.enum(['A', 'M', 'D', 'R', 'U']),
    additions: z.number().int().min(0),
    deletions: z.number().int().min(0),
    lines: z.array(hostDiffLineSchema),
}).strict();
const hostWorkingTreeChangesSchema = z.object({
    changes: z.array(hostFileChangeSchema),
}).strict();
const hostWorkingTreeRequestSchema = z.object({}).strict();
const hostWorkingTreeFileRequestSchema = z.object({ path: z.string() }).strict();
const hostCompareRequestSchema = z.object({ baseHash: hashSchema, targetHash: hashSchema }).strict();
const hostCompareResultSchema = z.object({
    baseHash: z.string(),
    targetHash: z.string(),
    changes: z.array(hostFileChangeSchema),
}).strict();
const hostTagDetailsSchema = z.object({
    objectHash: z.string(),
    tagger: z.string(),
    taggerEmail: z.string(),
    taggerDate: z.string(),
    message: z.string(),
    signature: hostSignatureSchema.nullable(),
}).strict();
const hostTagSchema = z.object({
    name: z.string(),
    annotated: z.boolean(),
    detail: hostTagDetailsSchema.nullable(),
}).strict();
const hostStashSchema = z.object({
    selector: z.string(),
    hash: z.string(),
    baseHash: z.string(),
    untrackedFilesHash: z.string().nullable(),
    author: z.string(),
    email: z.string(),
    date: z.string(),
    message: z.string(),
}).strict();
const hostMetadataSchema = z.object({
    tags: z.array(hostTagSchema),
    stashes: z.array(hostStashSchema),
}).strict();
const hostEmptyInputSchema = z.object({}).strict();
export const gitGraphHostDescriptors = [
    createGitGraphInvocation({
        method: 'read',
        inputSymbol: 'GitGraphInput',
        resultSymbol: 'GitGraphSnapshot',
        schemas: { input: hostInputSchema, result: hostSnapshotSchema, sessionId: z.string() },
    }),
    createGitGraphInvocation({
        method: 'readCommit',
        inputSymbol: 'GitGraphCommitRequest',
        resultSymbol: 'GitGraphCommitDetails',
        schemas: { input: hostCommitRequestSchema, result: hostCommitDetailsSchema, sessionId: z.string() },
    }),
    createGitGraphInvocation({
        method: 'readFile',
        inputSymbol: 'GitGraphFileRequest',
        resultSymbol: 'GitGraphFileContent',
        schemas: { input: hostFileRequestSchema, result: hostFileContentSchema, sessionId: z.string() },
    }),
    createGitGraphInvocation({
        method: 'readFileDiff',
        inputSymbol: 'GitGraphFileRequest',
        resultSymbol: 'GitGraphFileDiff',
        schemas: { input: hostFileRequestSchema, result: hostFileDiffSchema, sessionId: z.string() },
    }),
    createGitGraphInvocation({
        method: 'readWorkingTree',
        inputSymbol: 'GitGraphWorkingTreeRequest',
        resultSymbol: 'GitGraphWorkingTreeChanges',
        schemas: { input: hostWorkingTreeRequestSchema, result: hostWorkingTreeChangesSchema, sessionId: z.string() },
    }),
    createGitGraphInvocation({
        method: 'readWorkingTreeFile',
        inputSymbol: 'GitGraphWorkingTreeFileRequest',
        resultSymbol: 'GitGraphFileDiff',
        schemas: { input: hostWorkingTreeFileRequestSchema, result: hostFileDiffSchema, sessionId: z.string() },
    }),
    createGitGraphInvocation({
        method: 'compare',
        inputSymbol: 'GitGraphCompareRequest',
        resultSymbol: 'GitGraphCompareResult',
        schemas: { input: hostCompareRequestSchema, result: hostCompareResultSchema, sessionId: z.string() },
    }),
    createGitGraphInvocation({
        method: 'metadata',
        inputSymbol: 'GitGraphMetadataRequest',
        resultSymbol: 'GitGraphMetadata',
        schemas: { input: hostEmptyInputSchema, result: hostMetadataSchema, sessionId: z.string() },
    }),
];
/** Host contract discovered automatically by dsh-typert-loader. */
export const TYPERT = {
    package: TYPERT_PACKAGE,
    face: 'host',
    schemas: [],
    invocations: gitGraphHostDescriptors,
    model: {
        services: [],
        events: [],
        objects: [],
    },
};
export default TYPERT;
