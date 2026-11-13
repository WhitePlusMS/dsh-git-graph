import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, realpathSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MAX_SEARCH_COMMITS } from '../src/domain.ts'
import { loadCommitDetails, loadCompare, loadFileDiff, loadGitGraph, loadRepositories, loadTags, loadWorkingTreeChanges, parseWorkingTreeStatus, resolveSubmodule } from '../src/git.ts'
import { gitGraphSnapshotSchema } from '../src/typert.shared.ts'

/** Real Git fixtures keep platform/path and native wildcard semantics honest. */
const workspace = mkdtempSync(join(tmpdir(), 'dsh-graph-regressions-'))
const repo = join(workspace, 'repo')
const history = join(workspace, 'history')
const signal = new AbortController().signal
const calls: string[][] = []

function git(cwd: string, args: string[], input?: string): string {
  const result = spawnSync('git', args, { cwd, input, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`git ${args[0]}: ${result.stderr}`)
  return result.stdout.trim()
}

const ctx = {
  subprocess: {
    spawn(spec: { argv: readonly string[]; cwd: string; signal: AbortSignal }) {
      calls.push([...spec.argv])
      const child = spawn(spec.argv[0]!, spec.argv.slice(1), { cwd: spec.cwd, stdio: ['ignore', 'pipe', 'pipe'] })
      let out = ''
      let err = ''
      child.stdout.setEncoding('utf8').on('data', (chunk: string) => { out += chunk })
      child.stderr.setEncoding('utf8').on('data', (chunk: string) => { err += chunk })
      const abort = () => child.kill()
      spec.signal.addEventListener('abort', abort, { once: true })
      const done = new Promise((resolveDone, reject) => {
        child.once('error', reject)
        child.once('close', (exitCode, processSignal) => {
          spec.signal.removeEventListener('abort', abort)
          resolveDone({ exitCode, signal: processSignal })
        })
      })
      return { done, collected: {
        stdout: { readFrom: () => ({ text: out, lossy: false }) },
        stderr: { readFrom: () => ({ text: err, lossy: false }) },
      } }
    },
  },
} as unknown as Context

function commit(cwd: string, message: string): string {
  git(cwd, ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', message])
  return git(cwd, ['rev-parse', 'HEAD'])
}

let base = ''
let typed = ''
beforeAll(() => {
  mkdirSync(repo)
  git(repo, ['init', '-q', '-b', 'main'])
  mkdirSync(join(repo, 'sub'))
  writeFileSync(join(repo, 'target.txt'), 'content\n')
  writeFileSync(join(repo, 'sub', 'mode.txt'), 'ordinary file\n')
  git(repo, ['add', '.'])
  base = commit(repo, 'base')
  for (const branch of ['feature,comma', 'rama', 'ramb']) git(repo, ['branch', branch])
  // Index-only symlink creation works even on Windows without symlink privilege.
  const blob = git(repo, ['hash-object', '-w', '--stdin'], '../target.txt\n')
  git(repo, ['update-index', '--cacheinfo', `120000,${blob},sub/mode.txt`])
  typed = commit(repo, 'change file type')
  // Treat the actual regular file as such on Windows too; core.symlinks=false
  // deliberately makes Git emulate symlinks and would report only content M.
  git(repo, ['config', 'core.symlinks', 'true'])
  git(repo, ['tag', 'ramb'])
  for (const tag of ['v1', 'v10']) {
    git(repo, ['-c', 'user.name=Tagger', '-c', 'user.email=tag@example.com', 'tag', '-a', tag, '-m', `message ${tag}\nsecond line\u001e separator`])
  }
  git(repo, ['tag', 'light'])

  mkdirSync(history)
  git(history, ['init', '-q', '-b', 'main'])
  // Fast-import avoids 2,001 child processes and supplies deterministic history.
  let input = ''
  for (let i = 0; i <= MAX_SEARCH_COMMITS; i += 1) {
    const message = i === 0 ? 'needle-beyond-search-budget' : `history ${i}`
    input += `commit refs/heads/main\ncommitter Test <test@example.com> ${1700000000 + i} +0000\ndata ${Buffer.byteLength(message)}\n${message}\n\n`
  }
  git(history, ['fast-import', '--quiet'], input)
}, 15000)

afterAll(() => rmSync(workspace, { recursive: true, force: true }))

describe('Git acquisition regressions', () => {
  it('preserves commas in real reference decorations', async () => {
    const graph = await loadGitGraph(ctx, { path: repo }, { signal })
    expect(graph.commits.flatMap(entry => entry.refs.map(ref => ref.name))).toContain('feature,comma')
  })

  it('uses native negated classes and handles malformed ranges without JS errors', async () => {
    const graph = await loadGitGraph(ctx, { path: repo, glob: ['ram[!a]'] }, { signal })
    expect(graph.commits.map(entry => entry.hash)).toEqual([base])
    const empty = await loadGitGraph(ctx, { path: repo, glob: ['ram[z-a]'] }, { signal })
    expect(empty.commits).toEqual([])
    const prefix = await loadGitGraph(ctx, { path: repo, glob: ['ram'] }, { signal })
    expect(prefix.commits.map(entry => entry.hash)).toEqual([base])
  })

  it('shares repository identity between root and nested session directories', async () => {
    const root = await loadGitGraph(ctx, { path: repo }, { signal })
    const nested = await loadGitGraph(ctx, { path: join(repo, 'sub') }, { signal })
    expect(nested.path).toBe(root.path)
    expect(nested.commits).toEqual(root.commits)
  })

  it('reports a search that stopped before an older existing match', async () => {
    const result = await loadGitGraph(ctx, { path: history, search: 'needle-beyond-search-budget' }, { signal })
    expect(result).toMatchObject({ state: 'ready', commits: [], hasMore: false, searchTruncated: true })
    expect(() => gitGraphSnapshotSchema.parse(result)).not.toThrow()
    expect(git(history, ['log', '--all', '--format=%s', '--grep=needle-beyond-search-budget'])).toBe('needle-beyond-search-budget')
  })

  it('does not report truncation for a fully scanned short history', async () => {
    const result = await loadGitGraph(ctx, { path: repo, search: 'absent' }, { signal })
    expect(result).toMatchObject({ commits: [], searchTruncated: false })
  })

  it('includes type changes in commit, comparison and worktree inventories', async () => {
    const details = await loadCommitDetails(ctx, repo, typed, signal)
    expect(details.fileChanges).toContainEqual(expect.objectContaining({ type: 'T', newPath: 'sub/mode.txt' }))
    const compare = await loadCompare(ctx, repo, { baseHash: base, targetHash: typed }, signal)
    expect(compare.changes).toContainEqual(expect.objectContaining({ type: 'T', newPath: 'sub/mode.txt' }))
    const working = await loadWorkingTreeChanges(ctx, repo, signal)
    expect(working.changes).toContainEqual(expect.objectContaining({ type: 'T', newPath: 'sub/mode.txt' }))
  })

  it('retains the destination in either porcelain rename status column', () => {
    expect(parseWorkingTreeStatus('R  new.txt\0old.txt\0?? extra.txt\0')).toEqual({ changed: true, modified: ['new.txt'], deleted: [], untracked: ['extra.txt'] })
    expect(parseWorkingTreeStatus(' R new.txt\0old.txt\0 D gone.txt\0').modified).toEqual(['new.txt'])
  })

  it('reads lightweight and annotated tags in one command, preserving messages', async () => {
    const start = calls.length
    const tags = await loadTags(ctx, repo, signal)
    expect(calls.slice(start)).toHaveLength(1)
    expect(tags.find(tag => tag.name === 'light')).toMatchObject({ annotated: false, detail: null })
    for (const name of ['v1', 'v10']) {
      expect(tags.find(tag => tag.name === name)?.detail).toMatchObject({ tagger: 'Tagger', message: `message ${name}\nsecond line\u001e separator`, signature: null })
    }
  })

  it('does not spawn Git for an already cancelled request', async () => {
    const controller = new AbortController()
    controller.abort()
    const start = calls.length
    await expect(loadGitGraph(ctx, { path: repo }, { signal: controller.signal })).rejects.toThrow()
    expect(calls).toHaveLength(start)
  })

  it('passes in-flight cancellation to the subprocess and stops the query', async () => {
    const controller = new AbortController()
    let count = 0
    const pending = { subprocess: { spawn(spec: { signal: AbortSignal }) {
      count += 1
      expect(spec.signal).toBe(controller.signal)
      return { done: new Promise(resolveDone => spec.signal.addEventListener('abort', () => resolveDone({ exitCode: null, signal: 'SIGTERM' }), { once: true })) }
    } } } as unknown as Context
    const query = loadGitGraph(pending, { path: repo }, { signal: controller.signal })
    controller.abort()
    await expect(query).rejects.toThrow('已取消')
    expect(count).toBe(1)
  })
})

describe('session repository and direct submodules', () => {
  it('lists initialized and uninitialized modules without reading nested or stale declarations', async () => {
    const root = join(workspace, 'parent')
    const source = join(workspace, 'module')
    const clone = join(workspace, 'local')
    const modulePath = 'packages/子模块 lib'
    const missing = 'tools/simulator'
    for (const [dir, label] of [[root, 'parent'], [source, 'child']] as const) {
      mkdirSync(dir)
      git(dir, ['init', '-qb', 'main'])
      writeFileSync(join(dir, 'shared.txt'), `${label} original\n`)
      git(dir, ['add', 'shared.txt'])
      commit(dir, `${label} initial`)
      writeFileSync(join(dir, 'shared.txt'), `${label} updated\n`)
      git(dir, ['add', 'shared.txt'])
      commit(dir, `${label} update`)
    }
    git(source, ['-c', 'protocol.file.allow=always', 'submodule', 'add', history, 'nested/history'])
    commit(source, 'child added nested module')
    for (const path of [modulePath, missing]) git(root, ['-c', 'protocol.file.allow=always', 'submodule', 'add', source, path])
    git(root, ['config', '-f', '.gitmodules', 'submodule.stale.path', 'ordinary'])
    git(root, ['add', '.gitmodules'])
    commit(root, 'parent registered modules')
    git(workspace, ['clone', '-q', '--no-recurse-submodules', root, clone])
    git(clone, ['-c', 'protocol.file.allow=always', 'submodule', 'update', '--init', '--recursive', '--', modulePath])
    mkdirSync(join(clone, 'ordinary'))
    git(join(clone, 'ordinary'), ['init', '-q'])

    expect(await loadRepositories(ctx, workspace, signal)).toEqual({ main: null, submodules: [] })
    expect(await loadRepositories(ctx, join(clone, 'packages'), signal)).toEqual({
      main: realpathSync(clone),
      submodules: [{ path: modulePath, available: true }, { path: missing, available: false }],
    })
    const target = await resolveSubmodule(ctx, clone, modulePath, signal)
    const graph = await loadGitGraph(ctx, { path: target }, { signal })
    expect(graph.branch).toBeNull()
    const child = graph.commits.find(entry => entry.subject === 'child update')
    expect(child).toBeDefined()
    expect(graph.commits.some(entry => entry.subject === 'parent update')).toBe(false)
    if (child === undefined) throw new Error('Child commit is missing')
    expect((await loadCommitDetails(ctx, target, child.hash, signal)).fileChanges[0]?.newPath).toBe('shared.txt')
    const diff = await loadFileDiff(ctx, target, { hash: child.hash, path: 'shared.txt' }, signal)
    expect(diff.lines.map(line => line.content)).toEqual(['child original', 'child updated'])

    for (const path of [missing, 'ordinary', `${modulePath}/nested/history`, '../module', source]) {
      await expect(resolveSubmodule(ctx, clone, path, signal)).rejects.toThrow('所选子模块不可用')
    }
    git(clone, ['submodule', 'deinit', '-f', '--', modulePath])
    await expect(resolveSubmodule(ctx, clone, modulePath, signal)).rejects.toThrow('所选子模块不可用')
    // A manually embedded repo can already have a gitlink without a .gitmodules entry.
    git(clone, ['config', '-f', '.gitmodules', '--remove-section', `submodule.${modulePath}`])
    expect((await loadRepositories(ctx, clone, signal)).submodules).toEqual([{ path: missing, available: false }])
    git(clone, ['-c', 'protocol.file.allow=always', 'clone', '-q', source, modulePath])
    expect((await loadRepositories(ctx, clone, signal)).submodules).toEqual([
      { path: modulePath, available: true }, { path: missing, available: false },
    ])
    await expect(resolveSubmodule(ctx, clone, modulePath, signal)).resolves.toBe(target)
    unlinkSync(join(clone, '.gitmodules'))
    expect((await loadRepositories(ctx, clone, signal)).submodules).toEqual([{ path: modulePath, available: true }])
  }, 20000)
})
