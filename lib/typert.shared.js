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
    rejectUnknown(object, ['path', 'maxCommits', 'all', 'firstParent'], '$');
    const result = {};
    if (Object.hasOwn(object, 'path'))
        result.path = stringAt(object.path, '$.path');
    if (Object.hasOwn(object, 'maxCommits'))
        result.maxCommits = integerAt(object.maxCommits, '$.maxCommits', 1, MAX_COMMITS);
    if (Object.hasOwn(object, 'all'))
        result.all = booleanAt(object.all, '$.all');
    if (Object.hasOwn(object, 'firstParent'))
        result.firstParent = booleanAt(object.firstParent, '$.firstParent');
    return result;
}
function parseSnapshot(value) {
    const object = objectAt(value, '$');
    rejectUnknown(object, ['path', 'branch', 'head', 'workingTree', 'commits'], '$');
    const workingTree = objectAt(object.workingTree, '$.workingTree');
    rejectUnknown(workingTree, ['changed', 'summary'], '$.workingTree');
    return {
        path: stringAt(object.path, '$.path'),
        branch: nullableStringAt(object.branch, '$.branch'),
        head: nullableStringAt(object.head, '$.head'),
        workingTree: {
            changed: booleanAt(workingTree.changed, '$.workingTree.changed'),
            summary: stringAt(workingTree.summary, '$.workingTree.summary'),
        },
        commits: arrayAt(object.commits, '$.commits').map((commit, index) => parseCommit(commit, `$.commits[${index}]`)),
    };
}
/** Strict wire schemas intentionally use only the Typert `.parse()` contract. */
export const gitGraphInputSchema = { parse: parseInput };
export const gitGraphSnapshotSchema = { parse: parseSnapshot };
const sessionIdSchema = { parse: value => stringAt(value, '$.agentId') };
/** Build the shared endpoint metadata with a face-specific schema runtime. */
export function createGitGraphInvocation(schemas) {
    return {
        id: `${TYPERT_PACKAGE}#gitGraph/read`,
        service: 'gitGraph',
        namespace: 'gitGraph',
        method: 'read',
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
                    schema: schemas.sessionId,
                },
            },
            {
                name: 'request',
                wire: 'request',
                source: 'json',
                codec: {
                    mode: 'strict',
                    typeSymbol: `${TYPERT_PACKAGE}#GitGraphInput`,
                    schema: schemas.input,
                },
            },
        ],
        result: {
            mode: 'strict',
            typeSymbol: `${TYPERT_PACKAGE}#GitGraphSnapshot`,
            schema: schemas.snapshot,
        },
    };
}
/** Client descriptors use the local parse-only schemas to keep the bundle closed. */
export const gitGraphInvocation = createGitGraphInvocation({
    input: gitGraphInputSchema,
    snapshot: gitGraphSnapshotSchema,
    sessionId: sessionIdSchema,
});
export const gitGraphDescriptors = [gitGraphInvocation];
