import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { SubprocessSpawnSpec } from '@deepseek-ai/dsh-subprocess'
import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  loadCompare, loadCommitDetails, loadFile, loadFileDiff, loadMetadata,
  loadRepositories, loadWorkingTreeChanges, loadWorkingTreeFile,
} from '../src/git.ts'
import { AvatarStore } from '../src/avatars.ts'
import { gitGraphHostDescriptors } from '../src/typert.host.ts'
import { gitGraphDescriptors } from '../src/typert.shared.ts'

/**
 * Real-output wire contract.
 *
 * `tests/wire-contracts.test.ts` validates all ten methods through the real
 * codecs, but its payloads are written by hand to mirror the schema — so they
 * agree with the codec by construction. A loader that emits an undeclared key,
 * or a legitimately different shape (`additions: null` from a binary numstat
 * pairing, `binary: true`, the `WORKTREE` sentinel hash), is invisible to it.
 * Only `read` was ever walked from a real loader.
 *
 * Here each operation's result comes from the real loader against one shared
 * temp repository, and is pushed through BOTH faces: the Host zod codecs in
 * `src/typert.host.ts` and the hand-written parse-only codecs in
 * `src/typert.shared.ts`. Those are two independent implementations of the same
 * contract, so this is a cross-check rather than a restatement.
 *
 * Layer reached: loader -> codec (Host) and loader -> codec (Client). The
 * gateway transport and the client face reconstruction are not executed here.
 */

const workspace = mkdtempSync(join(tmpdir(), 'dsh-graph-real-output-'))
const repo = join(workspace, 'repo')
const moduleSource = join(workspace, 'module-src')

/** Real git with streaming stdout; several loaders read raw bytes off the handle. */
function realSubprocess() {
  return {
    spawn(spec: SubprocessSpawnSpec) {
      const child = spawn(spec.argv[0]!, spec.argv.slice(1), { cwd: spec.cwd, env: { ...process.env, ...spec.env }, stdio: ['ignore', 'pipe', 'pipe'] })
      let out = ''
      let err = ''
      if (spec.stdio.stdout !== 'pipe') child.stdout.setEncoding('utf8').on('data', (chunk: string) => { out += chunk })
      child.stderr.setEncoding('utf8').on('data', (chunk: string) => { err += chunk })
      const abort = () => child.kill()
      spec.signal?.addEventListener('abort', abort, { once: true })
      const done = new Promise((resolveDone, reject) => {
        child.once('error', reject)
        child.once('close', (exitCode, processSignal) => {
          spec.signal?.removeEventListener('abort', abort)
          resolveDone({ exitCode, signal: processSignal })
        })
      })
      return {
        done,
        stdout: child.stdout,
        terminate: abort,
        collected: {
          stdout: { readFrom: () => ({ text: out, lossy: false }) },
          stderr: { readFrom: () => ({ text: err, lossy: false }) },
        },
      }
    },
  }
}

const ctx = { subprocess: realSubprocess() } as unknown as Context
const signal = new AbortController().signal

function git(cwd: string, args: string[], input?: string): string {
  const result = spawnSync('git', args, { cwd, input, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`git ${args[0]}: ${result.stderr}`)
  return result.stdout.trim()
}

function commit(cwd: string, message: string): string {
  git(cwd, ['-c', 'user.name=Real', '-c', 'user.email=real@example.com', 'commit', '-q', '-m', message])
  return git(cwd, ['rev-parse', 'HEAD'])
}

let base = ''
let tip = ''

function descriptorOf(list: readonly InvocationDescriptor[], method: string): InvocationDescriptor {
  const found = list.find(entry => entry.method === method)
  if (found === undefined) throw new Error(`missing descriptor for ${method}`)
  return found
}

/**
 * Push one real result through a single face: request parse, then result
 * parse, encode and decode. `payload` is the exact wire request body.
 */
function assertFace(list: readonly InvocationDescriptor[], method: string, payload: unknown, result: unknown): void {
  const invocation = descriptorOf(list, method)
  expect(invocation.cancellation).toEqual({ parameter: 'signal' })
  // Bind each face to a local const: narrowing a property access does not
  // survive into the assertion closures below.
  const requestCodec = invocation.parameters.find(parameter => parameter.wire === 'request')?.codec
  const resultFace = invocation.result
  if (requestCodec?.mode !== 'strict' || resultFace.mode !== 'strict') throw new Error('strict codecs required')
  // The request the loader is actually driven by must survive its own codec.
  expect(requestCodec.create().parse(payload)).toEqual(payload)
  // A real result must satisfy the declared result contract on both faces.
  expect(() => resultFace.create().parse(result)).not.toThrow()
  expect(resultFace.encode?.(result, () => null)).toEqual(result)
  expect(resultFace.decode?.(result)).toEqual(result)
  // Strictness has to actually bite on this real shape, not just on a sample.
  expect(() => resultFace.encode?.({ ...(result as object), undeclaredField: true }, () => null)).toThrow()
}

/** Both faces, for the same real result. */
function assertBothFaces(method: string, payload: unknown, result: unknown): void {
  assertFace(gitGraphHostDescriptors, method, payload, result)
  assertFace(gitGraphDescriptors, method, payload, result)
}

beforeAll(() => {
  mkdirSync(repo)
  mkdirSync(moduleSource)
  // A real local module to give `repositories` something to report.
  for (const dir of [repo, moduleSource]) {
    git(dir, ['init', '-q', '-b', 'main'])
    writeFileSync(join(dir, 'keep.txt'), 'module\n')
    git(dir, ['add', '.'])
    commit(dir, 'module base')
  }
  writeFileSync(join(repo, 'a.txt'), 'line1\n')
  writeFileSync(join(repo, 'old-name.txt'), 'renamed body\n')
  writeFileSync(join(repo, 'gone.txt'), 'delete me\n')
  writeFileSync(join(repo, 'bin.dat'), Buffer.from([0, 1, 2, 255]))
  git(repo, ['add', '.'])
  base = commit(repo, 'base')
  // Second commit: modify text, rename, delete, and change a binary file.
  writeFileSync(join(repo, 'a.txt'), 'line1\nline2\nline3\n')
  git(repo, ['mv', 'old-name.txt', 'new-name.txt'])
  git(repo, ['rm', '-q', 'gone.txt'])
  writeFileSync(join(repo, 'bin.dat'), Buffer.from([9, 9, 9, 0, 255]))
  git(repo, ['add', '-A'])
  tip = commit(repo, 'second')
  git(repo, ['-c', 'user.name=Tagger', '-c', 'user.email=tag@example.com', 'tag', '-a', 'v1', '-m', 'annotated one'])
  git(repo, ['tag', 'light'])
  writeFileSync(join(repo, 'a.txt'), 'line1\nline2\nline3\nstashed\n')
  git(repo, ['-c', 'user.name=Real', '-c', 'user.email=real@example.com', 'stash', 'push', '-q', '-m', 'wip stash'])
  git(repo, ['-c', 'protocol.file.allow=always', 'submodule', 'add', moduleSource, 'packages/子模块 lib'])
  git(repo, ['add', '-A'])
  commit(repo, 'add submodule')
  // Uncommitted state: one modified tracked file and one untracked file.
  writeFileSync(join(repo, 'a.txt'), 'line1\nline2\nline3\nworktree\n')
  writeFileSync(join(repo, 'untracked.txt'), 'u1\nu2\n')
}, 30000)

afterAll(() => rmSync(workspace, { recursive: true, force: true }))

describe('real loader output through the Host and Client codecs', () => {
  it('repositories: real discovery output carries a live submodule entry', async () => {
    const result = await loadRepositories(ctx, repo, signal)
    // Real discovery resolves the main worktree and finds the initialized module.
    expect(result.submodules).toEqual([{ path: 'packages/子模块 lib', available: true }])
    expect(result.main).not.toBeNull()
    assertBothFaces('repositories', {}, result)
  })

  it('readCommit: real commit details include rename, delete and binary changes', async () => {
    const result = await loadCommitDetails(ctx, repo, tip, signal)
    expect(result.fileChanges).toContainEqual({ type: 'R', oldPath: 'old-name.txt', newPath: 'new-name.txt', additions: 0, deletions: 0 })
    assertBothFaces('readCommit', { repository: null, input: { hash: tip } }, result)
  })

  it('readFile: real text and binary reads', async () => {
    const text = await loadFile(ctx, repo, { hash: base, path: 'a.txt' }, signal)
    expect(text).toMatchObject({ kind: 'text', text: 'line1\n', truncated: false })
    assertBothFaces('readFile', { repository: null, input: { hash: base, path: 'a.txt' } }, text)

    const binary = await loadFile(ctx, repo, { hash: base, path: 'bin.dat' }, signal)
    expect(binary).toMatchObject({ kind: 'binary', text: null, size: 4 })
    assertBothFaces('readFile', { repository: null, input: { hash: base, path: 'bin.dat' } }, binary)
  })

  it('readFileDiff: real rename, binary and explicit-base diffs', async () => {
    const rename = await loadFileDiff(ctx, repo, { hash: tip, path: 'new-name.txt' }, signal)
    expect(rename).toMatchObject({ status: 'R', oldPath: 'old-name.txt', path: 'new-name.txt', hunks: [], binary: false })
    assertBothFaces('readFileDiff', { repository: null, input: { hash: tip, path: 'new-name.txt' } }, rename)

    const binary = await loadFileDiff(ctx, repo, { hash: tip, path: 'bin.dat' }, signal)
    expect(binary).toMatchObject({ binary: true, hunks: [] })
    assertBothFaces('readFileDiff', { repository: null, input: { hash: tip, path: 'bin.dat' } }, binary)

    const ranged = await loadFileDiff(ctx, repo, { hash: tip, path: 'a.txt', baseHash: base }, signal)
    expect(ranged.additions).toBe(2)
    assertBothFaces('readFileDiff', { repository: null, input: { hash: tip, path: 'a.txt', baseHash: base } }, ranged)
  })

  it('readWorkingTree: real inventory pairs a modified file with an untracked one', async () => {
    const result = await loadWorkingTreeChanges(ctx, repo, signal)
    expect(result.changes).toContainEqual({ type: 'M', oldPath: 'a.txt', newPath: 'a.txt', additions: 1, deletions: 0 })
    expect(result.changes).toContainEqual({ type: 'A', oldPath: 'untracked.txt', newPath: 'untracked.txt', additions: null, deletions: null })
    assertBothFaces('readWorkingTree', { repository: null }, result)
  })

  it('readWorkingTreeFile: real working-tree diffs, including the WORKTREE sentinel', async () => {
    const modified = await loadWorkingTreeFile(ctx, repo, { path: 'a.txt' }, signal)
    expect(modified).toMatchObject({ hash: 'WORKTREE', status: 'M', additions: 1, deletions: 0 })
    assertBothFaces('readWorkingTreeFile', { repository: null, input: { path: 'a.txt' } }, modified)

    const untracked = await loadWorkingTreeFile(ctx, repo, { path: 'untracked.txt' }, signal)
    expect(untracked).toMatchObject({ hash: 'WORKTREE', status: 'A', additions: 2, deletions: 0 })
    assertBothFaces('readWorkingTreeFile', { repository: null, input: { path: 'untracked.txt' } }, untracked)
  })

  it('compare: real two-commit comparison reuses the commit inventory shapes', async () => {
    const result = await loadCompare(ctx, repo, { baseHash: base, targetHash: tip }, signal)
    expect(result).toMatchObject({ baseHash: base, targetHash: tip })
    expect(result.changes).toContainEqual({ type: 'D', oldPath: 'gone.txt', newPath: 'gone.txt', additions: 0, deletions: 1 })
    assertBothFaces('compare', { repository: null, input: { baseHash: base, targetHash: tip } }, result)
  })

  it('metadata: real tags and a real stash entry', async () => {
    const result = await loadMetadata(ctx, repo, signal)
    const annotated = result.tags.find(tag => tag.name === 'v1')
    expect(annotated?.annotated).toBe(true)
    expect(result.tags.find(tag => tag.name === 'light')).toMatchObject({ annotated: false, detail: null })
    expect(result.stashes).toHaveLength(1)
    assertBothFaces('metadata', { repository: null }, result)
  })

  it('avatars: real AvatarStore output for a resolved and an unavailable author', async () => {
    // `AvatarStore` takes an injectable fetcher, so real Store output can be
    // produced without a network: only the transport is replaced, while URL
    // allow-listing, raster sniffing, the data-URL encoding and the
    // unavailable/bookkeeping all run for real.
    const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.from('body')])
    const store = new AvatarStore(async input => {
      // The gravatar source with no remote is the only provider consulted here.
      return String(input).includes('gravatar')
        ? new Response(png, { status: 200, headers: { 'content-type': 'image/png' } })
        : new Response(null, { status: 404 })
    })
    const authors = [{ email: 'who@example.com', sourceEmail: 'who@example.com' }]

    const resolved = { avatars: await store.read(authors, null, 'gravatar', signal) }
    expect(resolved.avatars).toHaveLength(1)
    expect(resolved.avatars[0]).toMatchObject({ email: 'who@example.com', provider: 'gravatar', unavailable: false })
    expect(resolved.avatars[0]?.image).toMatch(/^data:image\/png;base64,/u)
    assertBothFaces('avatars', { repository: null, input: { hashes: [base], source: 'gravatar' } }, resolved)

    // A provider that answers "no such avatar" is NOT a provider failure: the
    // store reports a null image and provider with unavailable false.
    const missing = new AvatarStore(async () => new Response(null, { status: 404 }))
    const absent = { avatars: await missing.read([{ email: 'none@example.com', sourceEmail: 'none@example.com' }], null, 'gravatar', signal) }
    expect(absent.avatars[0]).toMatchObject({ email: 'none@example.com', image: null, provider: null, unavailable: false })
    assertBothFaces('avatars', { repository: null, input: { hashes: [base], source: 'gravatar' } }, absent)

    // A provider that actually fails produces the third real shape, where
    // image and provider are null and unavailable is true.
    const broken = new AvatarStore(async () => { throw new Error('provider offline') })
    const unavailable = { avatars: await broken.read([{ email: 'down@example.com', sourceEmail: 'down@example.com' }], null, 'gravatar', signal) }
    expect(unavailable.avatars[0]).toMatchObject({ email: 'down@example.com', image: null, provider: null, unavailable: true })
    assertBothFaces('avatars', { repository: null, input: { hashes: [base], source: 'gravatar' } }, unavailable)
  })
})

describe('shapes the hand-written samples never contained', () => {
  /**
   * `tests/wire-contracts.test.ts:9-10` describes a file change as
   * `{ additions: 1, deletions: 1 }` and a diff as `binary: false, hunks: []`.
   * Real loaders produce additional, legitimate combinations that those
   * samples cannot express. Pinning them here means a loader regression that
   * silently started emitting `0` instead of `null`, or dropped the sentinel
   * hash, fails loudly instead of sliding past a schema that allows both.
   */
  it('a binary numstat pairing yields null additions, not zero', async () => {
    const details = await loadCommitDetails(ctx, repo, tip, signal)
    const binary = details.fileChanges.find(change => change.newPath === 'bin.dat')
    // git numstat prints `-\t-` for binary content; the loader must pass that
    // through as null so the sidebar shows no misleading `+0 −0` counter.
    expect(binary).toEqual({ type: 'M', oldPath: 'bin.dat', newPath: 'bin.dat', additions: null, deletions: null })
    const compare = await loadCompare(ctx, repo, { baseHash: base, targetHash: tip }, signal)
    expect(compare.changes.find(change => change.newPath === 'bin.dat')?.additions).toBeNull()
  })

  it('a rename with unchanged content reports zero counts and no hunks', async () => {
    const rename = await loadFileDiff(ctx, repo, { hash: tip, path: 'new-name.txt' }, signal)
    // `binary: false` with an empty hunk list is a real shape the sample file
    // only ever paired with `additions: 1`.
    expect(rename).toEqual({
      hash: tip, path: 'new-name.txt', oldPath: 'old-name.txt', status: 'R',
      hunks: [], binary: false, additions: 0, deletions: 0,
    })
  })

  it('a working-tree diff reports the WORKTREE sentinel as its hash', async () => {
    const result = await loadWorkingTreeFile(ctx, repo, { path: 'a.txt' }, signal)
    // The Host result schema types this as a plain string, while every request
    // schema enforces a real 40/64-hex hash. Pinning the sentinel keeps that
    // asymmetry a known one rather than a future strictness regression.
    expect(result.hash).toBe('WORKTREE')
    expect(result.hash).not.toMatch(/^[0-9a-f]{40}$/u)
  })

  it('an untracked working-tree file has null counters in the inventory but real counts in its diff', async () => {
    const inventory = await loadWorkingTreeChanges(ctx, repo, signal)
    const entry = inventory.changes.find(change => change.newPath === 'untracked.txt')
    expect(entry).toEqual({ type: 'A', oldPath: 'untracked.txt', newPath: 'untracked.txt', additions: null, deletions: null })
    const diff = await loadWorkingTreeFile(ctx, repo, { path: 'untracked.txt' }, signal)
    expect({ additions: diff.additions, deletions: diff.deletions }).toEqual({ additions: 2, deletions: 0 })
  })

  it('an annotated tag reports its tagger email in git angle-bracket form', async () => {
    const metadata = await loadMetadata(ctx, repo, signal)
    const detail = metadata.tags.find(tag => tag.name === 'v1')?.detail
    // `%(taggeremail)` is not a bare address. Both faces only require a string,
    // so a later tightening to an email format would break real output while
    // every hand-written sample kept passing.
    expect(detail?.taggerEmail).toBe('<tag@example.com>')
    expect(detail?.signature).toBeNull()
  })
})
