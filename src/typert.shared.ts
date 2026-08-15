import type { InvocationDescriptor, TypertSchema } from '@deepseek-ai/dsh-typert-protocol'
import type { GitGraphCommit, GitGraphInput, GitGraphRef, GitGraphSnapshot } from './domain.ts'
import { MAX_COMMITS } from './domain.ts'

export const TYPERT_PACKAGE = 'dsh-git-graph'
const SESSION_ID_TYPE = '@deepseek-ai/dsh-session/types#SessionId'

type WireObject = Record<string, unknown>

function fail(path: string, expected: string): never {
  throw new TypeError(`Git Graph Remote: ${path} must be ${expected}`)
}

function objectAt(value: unknown, path: string): WireObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(path, 'an object')
  return value as WireObject
}

function rejectUnknown(value: WireObject, allowed: readonly string[], path: string): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) fail(`${path}.${key}`, 'a supported field')
  }
}

function stringAt(value: unknown, path: string): string {
  if (typeof value !== 'string') fail(path, 'a string')
  return value
}

function booleanAt(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') fail(path, 'a boolean')
  return value
}

function integerAt(value: unknown, path: string, min: number, max: number): number {
  if (!Number.isSafeInteger(value) || typeof value !== 'number' || value < min || value > max) {
    fail(path, `an integer from ${min} to ${max}`)
  }
  return value
}

function nullableStringAt(value: unknown, path: string): string | null {
  if (value === null) return null
  return stringAt(value, path)
}

function arrayAt(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) fail(path, 'an array')
  return value
}

function refKindAt(value: unknown, path: string): GitGraphRef['kind'] {
  const kind = stringAt(value, path)
  if (kind === 'head' || kind === 'remote' || kind === 'tag') return kind
  fail(path, 'head, remote, or tag')
}

function parseRef(value: unknown, path: string): GitGraphRef {
  const object = objectAt(value, path)
  rejectUnknown(object, ['kind', 'name'], path)
  return {
    kind: refKindAt(object.kind, `${path}.kind`),
    name: stringAt(object.name, `${path}.name`),
  }
}

function parseCommit(value: unknown, path: string): GitGraphCommit {
  const object = objectAt(value, path)
  rejectUnknown(object, ['hash', 'parents', 'author', 'email', 'date', 'subject', 'refs', 'isHead'], path)
  return {
    hash: stringAt(object.hash, `${path}.hash`),
    parents: arrayAt(object.parents, `${path}.parents`).map((parent, index) => stringAt(parent, `${path}.parents[${index}]`)),
    author: stringAt(object.author, `${path}.author`),
    email: stringAt(object.email, `${path}.email`),
    date: stringAt(object.date, `${path}.date`),
    subject: stringAt(object.subject, `${path}.subject`),
    refs: arrayAt(object.refs, `${path}.refs`).map((ref, index) => parseRef(ref, `${path}.refs[${index}]`)),
    isHead: booleanAt(object.isHead, `${path}.isHead`),
  }
}

function parseInput(value: unknown): GitGraphInput {
  const object = objectAt(value, '$')
  rejectUnknown(object, ['path', 'maxCommits', 'all', 'firstParent'], '$')
  const result: { path?: string; maxCommits?: number; all?: boolean; firstParent?: boolean } = {}
  if (Object.hasOwn(object, 'path')) result.path = stringAt(object.path, '$.path')
  if (Object.hasOwn(object, 'maxCommits')) result.maxCommits = integerAt(object.maxCommits, '$.maxCommits', 1, MAX_COMMITS)
  if (Object.hasOwn(object, 'all')) result.all = booleanAt(object.all, '$.all')
  if (Object.hasOwn(object, 'firstParent')) result.firstParent = booleanAt(object.firstParent, '$.firstParent')
  return result
}

function parseSnapshot(value: unknown): GitGraphSnapshot {
  const object = objectAt(value, '$')
  rejectUnknown(object, ['path', 'branch', 'head', 'workingTree', 'commits'], '$')
  const workingTree = objectAt(object.workingTree, '$.workingTree')
  rejectUnknown(workingTree, ['changed', 'summary'], '$.workingTree')
  return {
    path: stringAt(object.path, '$.path'),
    branch: nullableStringAt(object.branch, '$.branch'),
    head: nullableStringAt(object.head, '$.head'),
    workingTree: {
      changed: booleanAt(workingTree.changed, '$.workingTree.changed'),
      summary: stringAt(workingTree.summary, '$.workingTree.summary'),
    },
    commits: arrayAt(object.commits, '$.commits').map((commit, index) => parseCommit(commit, `$.commits[${index}]`)),
  }
}

/** Strict wire schemas intentionally use only the Typert `.parse()` contract. */
export const gitGraphInputSchema: TypertSchema<GitGraphInput> = { parse: parseInput }
export const gitGraphSnapshotSchema: TypertSchema<GitGraphSnapshot> = { parse: parseSnapshot }
const sessionIdSchema: TypertSchema<string> = { parse: value => stringAt(value, '$.agentId') }

export interface GitGraphInvocationSchemas {
  readonly input: TypertSchema
  readonly snapshot: TypertSchema
  readonly sessionId: TypertSchema
}

/** Build the shared endpoint metadata with a face-specific schema runtime. */
export function createGitGraphInvocation(schemas: GitGraphInvocationSchemas): InvocationDescriptor {
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
  }
}

/** Client descriptors use the local parse-only schemas to keep the bundle closed. */
export const gitGraphInvocation = createGitGraphInvocation({
  input: gitGraphInputSchema,
  snapshot: gitGraphSnapshotSchema,
  sessionId: sessionIdSchema,
})

export const gitGraphDescriptors = [gitGraphInvocation] as const
