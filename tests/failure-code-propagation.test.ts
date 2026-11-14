import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { RemoteError, remoteErrorOf } from '@deepseek-ai/dsh-typert-protocol'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  GitGraphError, GitObjectMissingError, GitOutputLimitError, GitSubmoduleUnavailableError,
  loadFile, loadWorkingTreeChanges, resolveSubmodule,
} from '../src/git.ts'
import { GitGraphRemoteService } from '../src/remote-service.ts'
import { AvatarStore } from '../src/avatars.ts'

/**
 * Failure-code propagation, with the reached layer named on every test.
 *
 * Four codes are declared by the owner in `src/remote-service.ts:27-34`:
 *   gitGraph/missing-object, gitGraph/output-limit,
 *   gitGraph/submodule-unavailable, gitGraph/timeout.
 *
 * The layers are:
 *   loader    — `src/git.ts` converts a git failure into a typed GitGraphError.
 *   adapter   — `GitGraphRemoteService.git()` (`src/remote-service.ts:56-68`)
 *               maps those classes onto `RemoteError` codes.
 *   gateway   — the Host gateway's `rpcFailure`, which keeps `remote.code`
 *               verbatim for a RemoteError and degrades anything else to
 *               `gateway/internal`. NOT EXECUTED HERE: it is not exported by
 *               `@deepseek-ai/dsh-typert-protocol`, so there is no in-process
 *               entry point to call it.
 *   client    — the client face rebuilding a RemoteError from the wire. NOT
 *               EXECUTED HERE: it lives inside the DSH gateway/client bundle.
 *
 * What IS asserted below, per the owner's instruction, is (a) each reachable
 * code keeps its declared value out of the layer that owns it, and (b) the
 * degradation premise from the ordinary-error side: an unmapped GitGraphError
 * is structurally not a RemoteError, so a gateway that keys on the
 * `isDSHRemoteError` marker has nothing to preserve. Any plain GitGraphError
 * that is neither separately mapped nor caught earlier in the path and that
 * actually reaches the gateway is degraded — this file does not claim that all
 * of them do, because some are caught mid-path before the gateway sees them.
 */

const workspace = mkdtempSync(join(tmpdir(), 'dsh-graph-failure-codes-'))
const repo = join(workspace, 'repo')
let hash = ''
const signal = new AbortController().signal

function git(cwd: string, args: string[]): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`git ${args[0]}: ${result.stderr}`)
  return result.stdout.trim()
}

/** A Cordis Context is one per service: registration is keyed at the root. */
function serviceWith(subprocess: unknown): GitGraphRemoteService {
  const ctx = new Context()
  ;(ctx as unknown as { subprocess: unknown }).subprocess = subprocess
  return new GitGraphRemoteService(ctx as never)
}

/** Real git with streaming stdout, for loaders that read raw bytes. */
function realSubprocess() {
  return {
    spawn(spec: { argv: readonly string[]; cwd: string; env?: Record<string, string>; stdio?: { stdout?: unknown }; signal?: AbortSignal }) {
      const child = spawn(spec.argv[0]!, spec.argv.slice(1) as string[], { cwd: spec.cwd, env: { ...process.env, ...spec.env }, stdio: ['ignore', 'pipe', 'pipe'] })
      let out = ''
      let err = ''
      if (spec.stdio?.stdout !== 'pipe') child.stdout.setEncoding('utf8').on('data', (chunk: string) => { out += chunk })
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

/**
 * A scripted answer-source. Only the git binary is replaced: the real loaders,
 * their parsing, and the real adapter above them all still run. `lossy` is how
 * the subprocess protocol reports that a capture exceeded its byte cap, so it
 * is the honest way to reach the output limit without writing 8 MiB.
 */
function scripted(respond: (argv: readonly string[]) => { exitCode?: number | null; stdout?: string; stderr?: string; lossy?: boolean }) {
  return {
    spawn(spec: { argv: readonly string[] }) {
      const answer = respond(spec.argv)
      return {
        done: Promise.resolve({ exitCode: answer.exitCode ?? 0, signal: null }),
        terminate: () => {},
        collected: {
          stdout: { readFrom: () => ({ text: answer.stdout ?? '', lossy: answer.lossy === true }) },
          stderr: { readFrom: () => ({ text: answer.stderr ?? '', lossy: false }) },
        },
      }
    },
  }
}

const agent = () => ({ session: { header: { cwd: repo } } }) as never

beforeAll(() => {
  mkdirSync(repo)
  git(repo, ['init', '-q', '-b', 'main'])
  writeFileSync(join(repo, 'a.txt'), 'one\n')
  git(repo, ['add', '.'])
  git(repo, ['-c', 'user.name=Fail', '-c', 'user.email=fail@example.com', 'commit', '-q', '-m', 'base'])
  hash = git(repo, ['rev-parse', 'HEAD'])
}, 20000)

afterAll(() => rmSync(workspace, { recursive: true, force: true }))

describe('layer: loader — the typed classes the adapter keys on', () => {
  it('produces GitObjectMissingError, GitOutputLimitError and GitSubmoduleUnavailableError itself', async () => {
    // The adapter discriminates by `instanceof` (src/remote-service.ts:63-65),
    // so the identity of the thrown class is part of the contract between the
    // two modules. A second copy of src/git.ts would silently break the mapping.
    const missingCtx = { subprocess: scripted(argv => {
      if (argv.includes('--show-toplevel')) return { exitCode: 0, stdout: repo }
      if (argv.includes('ls-tree')) return { exitCode: 0, stdout: `100644 blob ${'a'.repeat(40)}\ta.txt\n` }
      if (argv.includes('-s')) return { exitCode: 128, stdout: '', stderr: 'missing object' }
      return { exitCode: 0, stdout: '' }
    }) } as unknown as Context
    await expect(loadFile(missingCtx, repo, { hash, path: 'a.txt' }, signal)).rejects.toBeInstanceOf(GitObjectMissingError)

    const lossyCtx = { subprocess: scripted(() => ({ exitCode: 0, stdout: '', lossy: true })) } as unknown as Context
    await expect(loadWorkingTreeChanges(lossyCtx, repo, signal)).rejects.toBeInstanceOf(GitOutputLimitError)

    const realCtx = { subprocess: realSubprocess() } as unknown as Context
    // A path that the index never recorded cannot be resolved as a module.
    await expect(resolveSubmodule(realCtx, repo, 'not-a-submodule', signal)).rejects.toBeInstanceOf(GitSubmoduleUnavailableError)
  }, 20000)
})

describe('layer: loader + adapter — each reachable code keeps its declared value', () => {
  it('maps a missing Git object to gitGraph/missing-object', async () => {
    // Reached: loader throws GitObjectMissingError -> adapter maps it.
    // Not reached: gateway encoding, client face reconstruction.
    const service = serviceWith(scripted(argv => {
      if (argv.includes('--show-toplevel')) return { exitCode: 0, stdout: repo }
      if (argv.includes('ls-tree')) return { exitCode: 0, stdout: `100644 blob ${'a'.repeat(40)}\ta.txt\n` }
      if (argv.includes('-s')) return { exitCode: 128, stdout: '', stderr: 'missing object' }
      return { exitCode: 0, stdout: '' }
    }))
    const error = await service.readFile(agent(), { repository: null, input: { hash, path: 'a.txt' } }, signal).then(
      () => { throw new Error('expected readFile to fail') },
      (cause: unknown) => cause,
    )
    const failure = remoteErrorOf(error)
    expect(failure?.code).toBe('gitGraph/missing-object')
    // The marker is what the gateway keys on; without it the code is lost.
    expect(failure?.isDSHRemoteError).toBe(true)
    expect(failure?.details).toEqual({})
    // The cause survives in-process only, which is why the detail payload is empty.
    expect((error as Error).cause).toBeInstanceOf(GitObjectMissingError)
  }, 20000)

  it('maps an over-cap capture to gitGraph/output-limit', async () => {
    // Reached: loader throws GitOutputLimitError -> adapter maps it.
    const service = serviceWith(scripted(() => ({ exitCode: 0, stdout: '', lossy: true })))
    const error = await service.read(agent(), { repository: null, input: {} }, signal).then(
      () => { throw new Error('expected read to fail') },
      (cause: unknown) => cause,
    )
    const failure = remoteErrorOf(error)
    expect(failure?.code).toBe('gitGraph/output-limit')
    expect((error as Error).cause).toBeInstanceOf(GitOutputLimitError)
  }, 20000)

  it('maps an unavailable submodule to gitGraph/submodule-unavailable', async () => {
    // Reached: real git, real repository discovery -> resolveSubmodule throws
    // GitSubmoduleUnavailableError inside the adapter's own read callback, so
    // the mapping is exercised on the path a real sidebar request takes.
    const service = serviceWith(realSubprocess())
    const error = await service.read(agent(), { repository: 'not-a-submodule', input: {} }, signal).then(
      () => { throw new Error('expected read to fail') },
      (cause: unknown) => cause,
    )
    const failure = remoteErrorOf(error)
    expect(failure?.code).toBe('gitGraph/submodule-unavailable')
    expect((error as Error).cause).toBeInstanceOf(GitSubmoduleUnavailableError)
  }, 20000)

  it('keeps request cancellation from being reported as gitGraph/timeout', async () => {
    // Reached: adapter signal composition. `this.git` composes the request
    // signal with `AbortSignal.timeout(30_000)` via AbortSignal.any, and its
    // catch runs `signal.throwIfAborted()` BEFORE the timeout branch. That
    // ordering is observable without waiting 30s: a user cancel must never be
    // relabelled as a timeout.
    const controller = new AbortController()
    const cancelling = {
      spawn(spec: { signal?: AbortSignal }) {
        const done = new Promise(resolveDone => {
          spec.signal?.addEventListener('abort', () => resolveDone({ exitCode: null, signal: 'SIGTERM' }), { once: true })
        })
        return {
          done,
          terminate: () => {},
          collected: {
            stdout: { readFrom: () => ({ text: '', lossy: false }) },
            stderr: { readFrom: () => ({ text: '', lossy: false }) },
          },
        }
      },
    }
    const service = serviceWith(cancelling)
    const pending = service.read(agent(), { repository: null, input: {} }, controller.signal)
    controller.abort()
    const error = await pending.then(
      () => { throw new Error('expected the cancelled read to reject') },
      (cause: unknown) => cause,
    )
    // `throwIfAborted()` rethrows the request's own reason, so a user cancel
    // stays a cancel: not a RemoteError, and not relabelled as a timeout.
    expect(error).toBe(controller.signal.reason)
    expect(remoteErrorOf(error)).toBeUndefined()
  }, 20000)
})

describe('layer: degradation premise — an unmapped ordinary error is not a RemoteError', () => {
  it('lets a plain GitGraphError through the adapter unchanged', async () => {
    // Reached: loader throws GitGraphError -> adapter rethrows it as-is.
    // The gateway keeps `remote.code` only for a RemoteError and otherwise
    // falls back to `gateway/internal`, so this error loses its identity there.
    // Verified from the ordinary-error side: we assert what the adapter hands
    // to the gateway, not what the gateway does with it.
    const service = serviceWith(realSubprocess())
    const error = await service.readFile(agent(), { repository: null, input: { hash, path: 'absent.txt' } }, signal).then(
      () => { throw new Error('expected readFile to fail') },
      (cause: unknown) => cause,
    )
    expect(error).toBeInstanceOf(GitGraphError)
    expect(remoteErrorOf(error)).toBeUndefined()
    expect((error as Error & { isDSHRemoteError?: unknown }).isDSHRemoteError).toBeUndefined()
  }, 20000)

  it('carries no code at all on a non-RemoteError, whatever its subclass', async () => {
    // Any plain GitGraphError that is neither separately mapped nor caught
    // earlier in the path and that actually reaches the gateway is degraded.
    // This file does not claim that every raise site in src/git.ts propagates
    // that far — some are caught mid-path before the gateway sees them.
    const errors = [new GitGraphError('plain'), new GitObjectMissingError('subclassed by the loader')]
    for (const error of errors) {
      expect(remoteErrorOf(error)).toBeUndefined()
      // Only the mapped four carry a `code`; the marker is absent too.
      expect((error as Error & { code?: unknown }).code).toBeUndefined()
      expect((error as Error & { isDSHRemoteError?: unknown }).isDSHRemoteError).toBeUndefined()
    }
    // The contrast: a RemoteError is recognisable structurally, by code, even
    // when the class instance comes from another module copy.
    const mapped = new RemoteError('gitGraph/missing-object', 'mapped', {})
    expect(remoteErrorOf(mapped)?.code).toBe('gitGraph/missing-object')
    expect(mapped.isDSHRemoteError).toBe(true)
  })

  it('leaves AvatarStore failures outside the RemoteError vocabulary entirely', async () => {
    // The adapter maps only the four Git classes; a provider failure is caught
    // inside the store and reported as data (`unavailable`), not as a code.
    const store = new AvatarStore(async () => { throw new Error('provider offline') })
    const avatars = await store.read([{ email: 'a@example.com', sourceEmail: 'a@example.com' }], null, 'gravatar', signal)
    expect(avatars).toMatchObject([{ image: null, unavailable: true }])
  })
})

describe('documented gaps — layers that cannot be reached in-process', () => {
  /**
   * What is established: the 30s ceiling is a fixed literal inside a private
   * method (src/remote-service.ts:57), and every code path that would observe
   * its expiry runs through it. What is NOT established is what control is
   * actually available for observing expiry — whether a controllable clock or
   * signal source could be substituted without editing that method is an open
   * question, and a fixed timeout makes deterministic observation harder
   * without by itself settling which mechanism would work. Recording the
   * difficulty here rather than prescribing a remedy.
   */
  it.todo('gateway payload: gitGraph/timeout expiry is unverified — the ceiling is a fixed 30s literal inside a private method, and no substitute clock or signal source is wired today; which control mechanism would actually work is an open question')
  it.todo('gateway payload: rpcFailure rewriting an unmapped error to gateway/internal — rpcFailure is not exported by @deepseek-ai/dsh-typert-protocol, so there is no in-process entry point')
  it.todo('client face: rebuilding a RemoteError instance from the wire — the reconstruction lives inside the DSH gateway/client bundle, which this package does not load')
})
