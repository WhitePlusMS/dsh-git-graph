import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { valueSchemaSpecToJsonSchema, validateJsonSchemaValue, type ValueSchemaSpec } from '@deepseek-ai/dsh-tools'
import { MAX_BRANCH_FILTER, type GitGraphSnapshot } from '../src/domain.ts'
import { loadGitGraph } from '../src/git.ts'
import { GRAPH_OUTPUT_SCHEMA } from '../src/runtime.ts'
import { TYPERT } from '../src/typert.host.ts'

/**
 * Boundary drift guard.
 *
 * The sidebar sends `branches` when a branch is focused and the Host always
 * lists branch tips back, so both directions have to be declared by the Host
 * codecs — a `.strict()` zod schema silently rejects an undeclared key and the
 * gateway reports `wire field "request" failed boundary validation`. The tool
 * output schema has the same failure shape (`additionalProperties: false`), so
 * one test walks a real snapshot through every boundary the read crosses.
 */

let repo = ''
let mainCommit = ''
let featureCommit = ''

function git(cwd: string, argv: readonly string[]): Promise<{ code: number | null; out: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', argv, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => { out += chunk })
    child.stderr.resume()
    child.on('error', reject)
    child.on('close', code => resolve({ code, out }))
  })
}

const commit = (cwd: string, message: string): Promise<{ code: number | null; out: string }> =>
  git(cwd, ['-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '-qm', message])

/** The narrow ctx.subprocess seam the Git loaders consume. */
const ctx = {
  subprocess: {
    spawn(spec: { argv: readonly string[]; cwd: string }) {
      const child = spawn(spec.argv[0] as string, spec.argv.slice(1), { cwd: spec.cwd, stdio: ['ignore', 'pipe', 'pipe'] })
      let out = ''
      let err = ''
      child.stdout.setEncoding('utf8').on('data', (chunk: string) => { out += chunk })
      child.stderr.setEncoding('utf8').on('data', (chunk: string) => { err += chunk })
      const done = new Promise(resolveDone => child.on('close', (exitCode, signal) => resolveDone({ exitCode, signal })))
      return {
        done,
        collected: {
          stdout: { readFrom: () => ({ text: out, lossy: false }) },
          stderr: { readFrom: () => ({ text: err, lossy: false }) },
        },
      }
    },
  },
} as unknown as Context

const signal = new AbortController().signal

interface RequestCodec { parse(value: unknown): unknown }
interface ResultCodec { parse(value: unknown): unknown; encode(value: unknown, params?: unknown): unknown }

function readBoundary(): { request: RequestCodec; result: ResultCodec } {
  const read = TYPERT.invocations.find(invocation => invocation.method === 'read')
  if (read === undefined) throw new Error('gitGraph/read descriptor is missing')
  const request = read.parameters.find(parameter => parameter.wire === 'request')
  if (request === undefined) throw new Error('gitGraph/read request descriptor is missing')
  return {
    request: (request.codec as { create(): RequestCodec }).create(),
    result: (read.result as unknown as { create(): ResultCodec }).create(),
  }
}

beforeAll(async () => {
  repo = mkdtempSync(join(tmpdir(), 'dsh-git-graph-contract-'))
  mkdirSync(repo, { recursive: true })
  await git(repo, ['init', '-q', '-b', 'main', '.'])
  writeFileSync(join(repo, 'README.md'), 'root\n')
  await git(repo, ['add', '-A'])
  await commit(repo, 'base')
  // The feature branch starts from base, so each branch has one commit the
  // other cannot reach — that is what "focus exactly this branch" must mean.
  await git(repo, ['checkout', '-q', '-b', 'feature'])
  writeFileSync(join(repo, 'feature.txt'), 'feature\n')
  await git(repo, ['add', '-A'])
  await commit(repo, 'feat: branch work')
  featureCommit = (await git(repo, ['rev-parse', 'HEAD'])).out.trim()
  await git(repo, ['checkout', '-q', 'main'])
  writeFileSync(join(repo, 'main.txt'), 'main\n')
  await git(repo, ['add', '-A'])
  await commit(repo, 'feat: main work')
  mainCommit = (await git(repo, ['rev-parse', 'HEAD'])).out.trim()
})

afterAll(() => {
  if (repo.length > 0) rmSync(repo, { recursive: true, force: true })
})

describe('gitGraph/read boundary contract', () => {
  it('accepts an exact branch focus in the request', () => {
    const { request } = readBoundary()
    expect(() => request.parse({ maxCommits: 50, sort: 'date', branches: ['feature'] })).not.toThrow()
    expect(() => request.parse({ branches: [] })).not.toThrow()
  })

  it('keeps rejecting an over-long branch filter and unknown request fields', () => {
    const { request } = readBoundary()
    expect(() => request.parse({ branches: Array.from({ length: MAX_BRANCH_FILTER + 1 }, () => 'main') })).toThrow()
    expect(() => request.parse({ branch: 'main' })).toThrow()
    expect(() => request.parse({ maxCommits: 0 })).toThrow()
  })

  it('describes the branch list the Host actually returns', async () => {
    const snapshot = await loadGitGraph(ctx, { path: repo, maxCommits: 20 }, { signal })
    expect(snapshot.branches?.map(branch => branch.name).sort()).toEqual(['feature', 'main'])
    const current = snapshot.branches?.filter(branch => branch.isCurrent).map(branch => branch.name)
    expect(current).toEqual(['main'])
    const { result } = readBoundary()
    // The descriptor now validates results through encode/decode; its schema
    // must describe every field that a real Host snapshot produces.
    expect(() => result.parse(snapshot)).not.toThrow()
    expect(() => result.encode(snapshot, () => null)).not.toThrow()
  })

  it('narrows history to the focused branch without hiding the branch list', async () => {
    const snapshot = await loadGitGraph(ctx, { path: repo, maxCommits: 20, branches: ['feature'] }, { signal })
    expect(snapshot.commits.map(entry => entry.hash)).toContain(featureCommit)
    expect(snapshot.commits.map(entry => entry.hash)).not.toContain(mainCommit)
    expect(snapshot.branches?.map(branch => branch.name).sort()).toEqual(['feature', 'main'])
  })
  it('accepts the tool result the Host returns (model-facing git_graph)', async () => {
    const snapshot: GitGraphSnapshot = await loadGitGraph(ctx, { path: repo, maxCommits: 20 }, { signal })
    const schema = valueSchemaSpecToJsonSchema(GRAPH_OUTPUT_SCHEMA as unknown as ValueSchemaSpec)
    expect(validateJsonSchemaValue(schema, snapshot)).toEqual([])
  })
})
