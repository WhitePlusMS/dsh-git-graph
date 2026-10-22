import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadFile, loadFileDiff, loadWorkingTreeFile } from '../src/git.ts'
import type { Context } from '@deepseek-ai/cordis'

/**
 * Regression coverage for a repository whose Git root sits ABOVE the session
 * working directory. Git prints paths relative to the repository root, while a
 * pathspec is resolved against the process working directory; reading a file
 * diff from a subdirectory used to find nothing and report "no line changes"
 * next to the correct `+14 −2` counter.
 */
const BODY = Array.from({ length: 20 }, (_, index) => `line ${index + 1}`)
const SUB = '前端/go-view-pro-web'
const FILE = `${SUB}/src/BZKJ_Monitor2D/runtime/usePlcButtonControl.ts`
const UNTRACKED = `${SUB}/untracked.ts`

let repo = ''
let sub = ''

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

/** The narrow ctx.subprocess seam the loaders consume. */
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
let firstCommit = ''

beforeAll(async () => {
  repo = mkdtempSync(join(tmpdir(), 'dsh-git-graph-cwd-'))
  sub = join(repo, SUB)
  mkdirSync(join(sub, 'src/BZKJ_Monitor2D/runtime'), { recursive: true })
  await git(repo, ['init', '-q', '.'])
  writeFileSync(join(repo, 'UPDATE_LOG.md'), 'root note\n')
  writeFileSync(join(repo, FILE), `${BODY.join('\n')}\n`)
  await git(repo, ['add', '-A'])
  await git(repo, ['-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '-qm', 'base'])
  firstCommit = (await git(repo, ['rev-parse', 'HEAD'])).out.trim()
  writeFileSync(join(sub, 'other.ts'), 'export const other = 1\n')
  await git(repo, ['add', '-A'])
  await git(repo, ['-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '-qm', 'feat: unrelated file'])

  // Uncommitted state: 14 additions and 2 deletions, plus one untracked file.
  const changed = [...BODY.slice(0, 10), ...Array.from({ length: 14 }, (_, index) => `added ${index + 1}`), ...BODY.slice(12)]
  writeFileSync(join(repo, FILE), `${changed.join('\n')}\n`)
  writeFileSync(join(sub, 'untracked.ts'), 'export const a = 1\nexport const b = 2\n')
})

afterAll(() => {
  if (repo.length > 0) rmSync(repo, { recursive: true, force: true })
})

describe('file diff paths from a subdirectory working directory', () => {
  it('renders the uncommitted diff even though the repository root is above the cwd', async () => {
    const diff = await loadWorkingTreeFile(ctx, sub, { path: FILE }, signal)
    expect(diff.additions).toBe(14)
    expect(diff.deletions).toBe(2)
    expect(diff.lines.filter(line => line.type === 'added')).toHaveLength(14)
    expect(diff.lines.filter(line => line.type === 'removed')).toHaveLength(2)
  })

  it('renders the same lines from the repository root', async () => {
    const fromRoot = await loadWorkingTreeFile(ctx, repo, { path: FILE }, signal)
    const fromSub = await loadWorkingTreeFile(ctx, sub, { path: FILE }, signal)
    expect(fromRoot.lines).toEqual(fromSub.lines)
  })

  it('reads an untracked file from a subdirectory working directory', async () => {
    const diff = await loadWorkingTreeFile(ctx, sub, { path: UNTRACKED }, signal)
    expect(diff.lines.filter(line => line.type === 'added')).toHaveLength(2)
  })

  it('renders a commit file diff from a subdirectory working directory', async () => {
    const diff = await loadFileDiff(ctx, sub, { hash: firstCommit, path: FILE }, signal)
    expect(diff.status).toBe('A')
    expect(diff.lines.filter(line => line.type === 'added')).toHaveLength(BODY.length)
  })

  it('still reads a version file from a subdirectory working directory', async () => {
    const file = await loadFile(ctx, sub, { hash: firstCommit, path: FILE }, signal)
    expect(file.kind).toBe('text')
    expect(file.text?.split('\n')).toHaveLength(BODY.length + 1)
  })

  it('keeps rejecting absolute paths and path traversal', async () => {
    for (const bad of ['../outside.ts', '/etc/passwd', 'C:/Windows/win.ini', '']) {
      await expect(loadFile(ctx, sub, { hash: firstCommit, path: bad }, signal)).rejects.toThrow()
    }
  })
})
