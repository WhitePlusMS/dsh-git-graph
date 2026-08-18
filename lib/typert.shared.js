import { MAX_COMMITS } from './domain.js';
export const TYPERT_PACKAGE = 'dsh-git-graph';
const SESSION_ID_TYPE = '@deepseek-ai/dsh-session/types#SessionId';
function fail(path, expected) {
    throw new TypeError(`Git Graph Remote: ${path} must be ${expected}`);
}
function objectAt(value, path) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        fail(path, 'an object');
    return value;
}
function rejectUnknown(value, allowed, path) {
    const allowedSet = new Set(allowed);
    for (const key of Object.keys(value)) {
        if (!allowedSet.has(key))
            fail(`${path}.${key}`, 'a supported field');
    }
}
function stringAt(value, path) {
    if (typeof value !== 'string')
        fail(path, 'a string');
    return value;
}
function booleanAt(value, path) {
    if (typeof value !== 'boolean')
        fail(path, 'a boolean');
    return value;
}
function integerAt(value, path, min, max) {
    if (!Number.isSafeInteger(value) || typeof value !== 'number' || value < min || value > max) {
        fail(path, `an integer from ${min} to ${max}`);
    }
    return value;
}
function nullableStringAt(value, path) {
    if (value === null)
        return null;
    return stringAt(value, path);
}
function arrayAt(value, path) {
    if (!Array.isArray(value))
        fail(path, 'an array');
    return value;
}
function refKindAt(value, path) {
    const kind = stringAt(value, path);
    if (kind === 'head' || kind === 'remote' || kind === 'tag')
        return kind;
    fail(path, 'head, remote, or tag');
}
function parseRef(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, ['kind', 'name'], path);
    return {
        kind: refKindAt(object.kind, `${path}.kind`),
        name: stringAt(object.name, `${path}.name`),
    };
}
function parseCommit(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, ['hash', 'parents', 'author', 'email', 'date', 'subject', 'refs', 'isHead'], path);
    return {
        hash: stringAt(object.hash, `${path}.hash`),
        parents: arrayAt(object.parents, `${path}.parents`).map((parent, index) => stringAt(parent, `${path}.parents[${index}]`)),
        author: stringAt(object.author, `${path}.author`),
        email: stringAt(object.email, `${path}.email`),
        date: stringAt(object.date, `${path}.date`),
        subject: stringAt(object.subject, `${path}.subject`),
        refs: arrayAt(object.refs, `${path}.refs`).map((ref, index) => parseRef(ref, `${path}.refs[${index}]`)),
        isHead: booleanAt(object.isHead, `${path}.isHead`),
    };
}
function parseInput(value) {
    const object = objectAt(value, '$');
    rejectUnknown(object, ['path', 'maxCommits', 'all', 'firstParent', 'glob', 'search', 'sort'], '$');
    const result = {};
    if (Object.hasOwn(object, 'path'))
        result.path = stringAt(object.path, '$.path');
    if (Object.hasOwn(object, 'maxCommits'))
        result.maxCommits = integerAt(object.maxCommits, '$.maxCommits', 1, MAX_COMMITS);
    if (Object.hasOwn(object, 'all'))
        result.all = booleanAt(object.all, '$.all');
    if (Object.hasOwn(object, 'firstParent'))
        result.firstParent = booleanAt(object.firstParent, '$.firstParent');
    if (Object.hasOwn(object, 'glob')) {
        result.glob = arrayAt(object.glob, '$.glob').map((item, index) => stringAt(item, `$.glob[${index}]`));
    }
    if (Object.hasOwn(object, 'search'))
        result.search = stringAt(object.search, '$.search');
    if (Object.hasOwn(object, 'sort')) {
        const sort = stringAt(object.sort, '$.sort');
        if (sort !== 'date' && sort !== 'author-date' && sort !== 'topological')
            fail('$.sort', 'date, author-date, or topological');
        result.sort = sort;
    }
    return result;
}
function parseSnapshot(value) {
    const object = objectAt(value, '$');
    rejectUnknown(object, ['path', 'state', 'branch', 'head', 'workingTree', 'commits', 'hasMore'], '$');
    const workingTree = objectAt(object.workingTree, '$.workingTree');
    rejectUnknown(workingTree, ['changed', 'summary'], '$.workingTree');
    const state = stringAt(object.state, '$.state');
    if (state !== 'not-git' && state !== 'empty' && state !== 'ready')
        fail('$.state', 'not-git, empty, or ready');
    return {
        path: stringAt(object.path, '$.path'),
        state: state,
        branch: nullableStringAt(object.branch, '$.branch'),
        head: nullableStringAt(object.head, '$.head'),
        workingTree: {
            changed: booleanAt(workingTree.changed, '$.workingTree.changed'),
            summary: stringAt(workingTree.summary, '$.workingTree.summary'),
        },
        commits: arrayAt(object.commits, '$.commits').map((commit, index) => parseCommit(commit, `$.commits[${index}]`)),
        hasMore: booleanAt(object.hasMore, '$.hasMore'),
    };
}
/** Strict wire schemas intentionally use only the Typert `.parse()` contract. */
export const gitGraphInputSchema = { parse: parseInput };
export const gitGraphSnapshotSchema = { parse: parseSnapshot };
const sessionIdSchema = { parse: value => stringAt(value, '$.agentId') };
/* ------------------------------------------------------------------ *
 * On-demand detail DTO schemas (strict, parse-only).
 * ------------------------------------------------------------------ */
const HASH_RE = /^[0-9a-f]{40}$/iu;
function hashStringAt(value, path) {
    const text = stringAt(value, path);
    if (!HASH_RE.test(text))
        fail(path, 'a full 40-char commit hash');
    return text;
}
/**
 * Detect whether decoded blob text is unsafe to render as text. The Host has
 * already classified the blob as text or binary via `isTextContent`
 * (any NUL/U+FFFD byte means binary); this client-side guard is only a
 * defense-in-depth echo of that decision. It must NOT reject ordinary UTF-8
 * text — e.g. Chinese comments — which is why only NUL and the replacement
 * character count as binary markers, not every non-ASCII code point.
 */
function isTextContentSafe(text) {
    return !text.includes('\u0000') && !text.includes('\uFFFD');
}
function parseFileChange(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, ['type', 'oldPath', 'newPath', 'additions', 'deletions'], path);
    const type = stringAt(object.type, `${path}.type`);
    if (type !== 'A' && type !== 'M' && type !== 'D' && type !== 'R' && type !== 'U') {
        fail(`${path}.type`, 'A, M, D, R, or U');
    }
    return {
        type,
        oldPath: stringAt(object.oldPath, `${path}.oldPath`),
        newPath: stringAt(object.newPath, `${path}.newPath`),
        additions: nullableIntAt(object.additions, `${path}.additions`),
        deletions: nullableIntAt(object.deletions, `${path}.deletions`),
    };
}
function nullableIntAt(value, path) {
    if (value === null)
        return null;
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
        fail(path, 'a non-negative integer or null');
    return value;
}
function parseSignature(value, path) {
    if (value === null)
        return null;
    const object = objectAt(value, path);
    rejectUnknown(object, ['status', 'key', 'signer'], path);
    const status = stringAt(object.status, `${path}.status`);
    if (!/^[GUXRYEB]$/u.test(status))
        fail(`${path}.status`, 'G, U, X, Y, R, E, or B');
    return {
        status: status,
        key: nullableStringAt(object.key, `${path}.key`),
        signer: nullableStringAt(object.signer, `${path}.signer`),
    };
}
function parseCommitDetails(value) {
    const object = objectAt(value, '$');
    rejectUnknown(object, ['hash', 'parents', 'author', 'authorEmail', 'committer', 'committerEmail', 'timestamps', 'signature', 'body', 'fileChanges'], '$');
    const timestamps = objectAt(object.timestamps, '$.timestamps');
    rejectUnknown(timestamps, ['authorDate', 'committerDate'], '$.timestamps');
    return {
        hash: stringAt(object.hash, '$.hash'),
        parents: arrayAt(object.parents, '$.parents').map((parent, index) => stringAt(parent, `$.parents[${index}]`)),
        author: stringAt(object.author, '$.author'),
        authorEmail: stringAt(object.authorEmail, '$.authorEmail'),
        committer: stringAt(object.committer, '$.committer'),
        committerEmail: stringAt(object.committerEmail, '$.committerEmail'),
        timestamps: {
            authorDate: stringAt(timestamps.authorDate, '$.timestamps.authorDate'),
            committerDate: stringAt(timestamps.committerDate, '$.timestamps.committerDate'),
        },
        signature: parseSignature(object.signature, '$.signature'),
        body: stringAt(object.body, '$.body'),
        fileChanges: arrayAt(object.fileChanges, '$.fileChanges').map((entry, index) => parseFileChange(entry, `$.fileChanges[${index}]`)),
    };
}
function parseCommitRequest(value) {
    const object = objectAt(value, '$');
    rejectUnknown(object, ['hash'], '$');
    return { hash: hashStringAt(object.hash, '$.hash') };
}
function parseFileRequest(value) {
    const object = objectAt(value, '$');
    rejectUnknown(object, ['hash', 'path'], '$');
    return { hash: hashStringAt(object.hash, '$.hash'), path: stringAt(object.path, '$.path') };
}
function parseCompareRequest(value) {
    const object = objectAt(value, '$');
    rejectUnknown(object, ['baseHash', 'targetHash'], '$');
    return { baseHash: hashStringAt(object.baseHash, '$.baseHash'), targetHash: hashStringAt(object.targetHash, '$.targetHash') };
}
function parseFileContent(value) {
    const object = objectAt(value, '$');
    rejectUnknown(object, ['hash', 'path', 'kind', 'text', 'size', 'truncated'], '$');
    const kind = stringAt(object.kind, '$.kind');
    if (kind !== 'text' && kind !== 'binary')
        fail('$.kind', 'text or binary');
    const text = object.text === null ? null : stringAt(object.text, '$.text');
    if (kind === 'text' && text !== null && !isTextContentSafe(text))
        fail('$.text', 'text content without binary control bytes');
    return {
        hash: stringAt(object.hash, '$.hash'),
        path: stringAt(object.path, '$.path'),
        kind,
        text,
        size: integerAt(object.size, '$.size', 0, Number.MAX_SAFE_INTEGER),
        truncated: booleanAt(object.truncated, '$.truncated'),
    };
}
function parseDiffLine(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, ['type', 'content', 'oldLine', 'newLine'], path);
    const type = stringAt(object.type, `${path}.type`);
    if (type !== 'context' && type !== 'added' && type !== 'removed')
        fail(`${path}.type`, 'context, added, or removed');
    return {
        type,
        content: stringAt(object.content, `${path}.content`),
        oldLine: nullableIntAt(object.oldLine, `${path}.oldLine`),
        newLine: nullableIntAt(object.newLine, `${path}.newLine`),
    };
}
function parseFileDiff(value) {
    const object = objectAt(value, '$');
    rejectUnknown(object, ['hash', 'path', 'oldPath', 'status', 'additions', 'deletions', 'lines'], '$');
    const status = stringAt(object.status, '$.status');
    if (status !== 'A' && status !== 'M' && status !== 'D' && status !== 'R' && status !== 'U')
        fail('$.status', 'A, M, D, R, or U');
    return {
        hash: stringAt(object.hash, '$.hash'),
        path: stringAt(object.path, '$.path'),
        oldPath: stringAt(object.oldPath, '$.oldPath'),
        status,
        additions: integerAt(object.additions, '$.additions', 0, Number.MAX_SAFE_INTEGER),
        deletions: integerAt(object.deletions, '$.deletions', 0, Number.MAX_SAFE_INTEGER),
        lines: arrayAt(object.lines, '$.lines').map((entry, index) => parseDiffLine(entry, `$.lines[${index}]`)),
    };
}
function parseWorkingTreeChanges(value) {
    const object = objectAt(value, '$');
    rejectUnknown(object, ['changes'], '$');
    return {
        changes: arrayAt(object.changes, '$.changes').map((entry, index) => parseFileChange(entry, `$.changes[${index}]`)),
    };
}
function parseWorkingTreeFileRequest(value) {
    const object = objectAt(value, '$');
    rejectUnknown(object, ['path'], '$');
    return { path: stringAt(object.path, '$.path') };
}
function parseCompareResult(value) {
    const object = objectAt(value, '$');
    rejectUnknown(object, ['baseHash', 'targetHash', 'changes'], '$');
    return {
        baseHash: stringAt(object.baseHash, '$.baseHash'),
        targetHash: stringAt(object.targetHash, '$.targetHash'),
        changes: arrayAt(object.changes, '$.changes').map((entry, index) => parseFileChange(entry, `$.changes[${index}]`)),
    };
}
export const gitGraphCommitRequestSchema = { parse: parseCommitRequest };
export const gitGraphCommitDetailsSchema = { parse: parseCommitDetails };
export const gitGraphFileRequestSchema = { parse: parseFileRequest };
export const gitGraphFileContentSchema = { parse: parseFileContent };
export const gitGraphFileDiffSchema = { parse: parseFileDiff };
export const gitGraphWorkingTreeChangesSchema = { parse: parseWorkingTreeChanges };
export const gitGraphWorkingTreeFileRequestSchema = { parse: parseWorkingTreeFileRequest };
export const gitGraphCompareRequestSchema = { parse: parseCompareRequest };
export const gitGraphCompareResultSchema = { parse: parseCompareResult };
/* ------------------------------------------------------------------ *
 * Repository metadata (tags + stashes) for the on-demand view.
 * ------------------------------------------------------------------ */
function parseTagDetails(value, path) {
    if (value === null)
        return null;
    const object = objectAt(value, path);
    rejectUnknown(object, ['objectHash', 'tagger', 'taggerEmail', 'taggerDate', 'message', 'signature'], path);
    return {
        objectHash: stringAt(object.objectHash, `${path}.objectHash`),
        tagger: stringAt(object.tagger, `${path}.tagger`),
        taggerEmail: stringAt(object.taggerEmail, `${path}.taggerEmail`),
        taggerDate: stringAt(object.taggerDate, `${path}.taggerDate`),
        message: stringAt(object.message, `${path}.message`),
        signature: parseSignature(object.signature, `${path}.signature`),
    };
}
function parseTag(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, ['name', 'annotated', 'detail'], path);
    const annotated = booleanAt(object.annotated, `${path}.annotated`);
    return {
        name: stringAt(object.name, `${path}.name`),
        annotated,
        detail: annotated ? parseTagDetails(object.detail, `${path}.detail`) : null,
    };
}
function parseStash(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, ['selector', 'hash', 'baseHash', 'untrackedFilesHash', 'author', 'email', 'date', 'message'], path);
    return {
        selector: stringAt(object.selector, `${path}.selector`),
        hash: stringAt(object.hash, `${path}.hash`),
        baseHash: stringAt(object.baseHash, `${path}.baseHash`),
        untrackedFilesHash: nullableStringAt(object.untrackedFilesHash, `${path}.untrackedFilesHash`),
        author: stringAt(object.author, `${path}.author`),
        email: stringAt(object.email, `${path}.email`),
        date: stringAt(object.date, `${path}.date`),
        message: stringAt(object.message, `${path}.message`),
    };
}
function parseMetadata(value) {
    const object = objectAt(value, '$');
    rejectUnknown(object, ['tags', 'stashes'], '$');
    return {
        tags: arrayAt(object.tags, '$.tags').map((entry, index) => parseTag(entry, `$.tags[${index}]`)),
        stashes: arrayAt(object.stashes, '$.stashes').map((entry, index) => parseStash(entry, `$.stashes[${index}]`)),
    };
}
function parseEmptyInput(_value) {
    const object = objectAt(_value, '$');
    rejectUnknown(object, [], '$');
    return {};
}
export const gitGraphMetadataSchema = { parse: parseMetadata };
export const gitGraphEmptyInputSchema = { parse: parseEmptyInput };
/** Build the shared endpoint metadata with a face-specific schema runtime. */
export function createGitGraphInvocation(spec) {
    return {
        id: `${TYPERT_PACKAGE}#gitGraph/${spec.method}`,
        service: 'gitGraph',
        namespace: 'gitGraph',
        method: spec.method,
        invocation: { kind: 'direct' },
        cancellation: { parameter: 'signal' },
        scope: {
            context: 'agent',
            wire: 'agentId',
        },
        parameters: [
            {
                name: 'agent',
                wire: 'agentId',
                source: 'lookup',
                lookup: 'agent',
                codec: {
                    mode: 'strict',
                    typeSymbol: SESSION_ID_TYPE,
                    schema: spec.schemas.sessionId,
                },
            },
            {
                name: 'request',
                wire: 'request',
                source: 'json',
                codec: {
                    mode: 'strict',
                    typeSymbol: `${TYPERT_PACKAGE}#${spec.inputSymbol}`,
                    schema: spec.schemas.input,
                },
            },
        ],
        result: {
            mode: 'strict',
            typeSymbol: `${TYPERT_PACKAGE}#${spec.resultSymbol}`,
            schema: spec.schemas.result,
        },
    };
}
/** Client descriptors use the local parse-only schemas to keep the bundle closed. */
export const gitGraphInvocation = createGitGraphInvocation({
    method: 'read',
    inputSymbol: 'GitGraphInput',
    resultSymbol: 'GitGraphSnapshot',
    schemas: { input: gitGraphInputSchema, result: gitGraphSnapshotSchema, sessionId: sessionIdSchema },
});
export const gitGraphReadCommitInvocation = createGitGraphInvocation({
    method: 'readCommit',
    inputSymbol: 'GitGraphCommitRequest',
    resultSymbol: 'GitGraphCommitDetails',
    schemas: { input: gitGraphCommitRequestSchema, result: gitGraphCommitDetailsSchema, sessionId: sessionIdSchema },
});
export const gitGraphFileInvocation = createGitGraphInvocation({
    method: 'readFile',
    inputSymbol: 'GitGraphFileRequest',
    resultSymbol: 'GitGraphFileContent',
    schemas: { input: gitGraphFileRequestSchema, result: gitGraphFileContentSchema, sessionId: sessionIdSchema },
});
export const gitGraphFileDiffInvocation = createGitGraphInvocation({
    method: 'readFileDiff',
    inputSymbol: 'GitGraphFileRequest',
    resultSymbol: 'GitGraphFileDiff',
    schemas: { input: gitGraphFileRequestSchema, result: gitGraphFileDiffSchema, sessionId: sessionIdSchema },
});
export const gitGraphWorkingTreeInvocation = createGitGraphInvocation({
    method: 'readWorkingTree',
    inputSymbol: 'GitGraphWorkingTreeRequest',
    resultSymbol: 'GitGraphWorkingTreeChanges',
    schemas: { input: gitGraphEmptyInputSchema, result: gitGraphWorkingTreeChangesSchema, sessionId: sessionIdSchema },
});
export const gitGraphWorkingTreeFileInvocation = createGitGraphInvocation({
    method: 'readWorkingTreeFile',
    inputSymbol: 'GitGraphWorkingTreeFileRequest',
    resultSymbol: 'GitGraphFileDiff',
    schemas: { input: gitGraphWorkingTreeFileRequestSchema, result: gitGraphFileDiffSchema, sessionId: sessionIdSchema },
});
export const gitGraphCompareInvocation = createGitGraphInvocation({
    method: 'compare',
    inputSymbol: 'GitGraphCompareRequest',
    resultSymbol: 'GitGraphCompareResult',
    schemas: { input: gitGraphCompareRequestSchema, result: gitGraphCompareResultSchema, sessionId: sessionIdSchema },
});
export const gitGraphMetadataInvocation = createGitGraphInvocation({
    method: 'metadata',
    inputSymbol: 'GitGraphMetadataRequest',
    resultSymbol: 'GitGraphMetadata',
    schemas: { input: gitGraphEmptyInputSchema, result: gitGraphMetadataSchema, sessionId: sessionIdSchema },
});
export const gitGraphDescriptors = [
    gitGraphInvocation,
    gitGraphReadCommitInvocation,
    gitGraphFileInvocation,
    gitGraphFileDiffInvocation,
    gitGraphWorkingTreeInvocation,
    gitGraphWorkingTreeFileInvocation,
    gitGraphCompareInvocation,
    gitGraphMetadataInvocation,
];
