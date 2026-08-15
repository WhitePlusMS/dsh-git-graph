/**
 * Host-side Git adapter. The only process seam is ctx.subprocess; no shell
 * interpolation is used, so a repository path never becomes command text.
 */
import { resolve } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { SubprocessHandle, SubprocessSpawnSpec } from '@deepseek-ai/dsh-subprocess'
import type { GitGraphCommit, GitGraphInput, GitGraphRef, GitGraphSnapshot } from './domain.ts'
import { MAX_COMMITS } from './domain.ts'

const LOG_FORMAT = '%H%x00%P%x00%an%x00%ae%x00%aI%x00%s%x00%D%x00%x1e'
const OUTPUT_MAX_BYTES = 8 * 1024 * 1024
const STDERR_MAX_BYTES = 64 * 1024
const GRACE_MS = 3_000

/** Minimal execution identity shared by the tool and the independent view. */
export interface GitGraphExecutionContext {
  readonly agent?: Agent
  readonly signal: AbortSignal
}

/** A stable error type for all Git acquisition failures. */
export class GitGraphError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'GitGraphError'
  }
}

interface GitCommandResult {
  readonly exitCode: number | null
  readonly signal: NodeJS.Signals | null
  readonly stdout: string
  readonly stderr: string
}

function outputOf(handle: SubprocessHandle, stream: 'stdout' | 'stderr'): string {
  const reader = handle.collected[stream]
  if (reader === undefined) throw new GitGraphError(`git ${stream} output was not collected`)
  const result = reader.readFrom(0)
  if (result.lossy) throw new GitGraphError(`git ${stream} output exceeded the capture limit`)
  return result.text
}

async function runGit(
  ctx: Context,
  cwd: string,
  args: readonly string[],
  signal: AbortSignal,
  allowedExitCodes: readonly number[] = [0],
): Promise<GitCommandResult> {
  let handle: SubprocessHandle
  try {
    const spec: SubprocessSpawnSpec = {
      argv: ['git', ...args],
      cwd,
      stdio: {
        stdin: 'ignore',
        stdout: { maxBytes: OUTPUT_MAX_BYTES },
        stderr: { maxBytes: STDERR_MAX_BYTES },
      },
      graceMs: GRACE_MS,
      signal,
    }
    handle = ctx.subprocess.spawn(spec)
  } catch (error: unknown) {
    throw new GitGraphError(`无法启动 Git：${String(error)}`, { cause: error })
  }

  let outcome: { exitCode: number | null; signal: NodeJS.Signals | null }
  try {
    outcome = await handle.done
  } catch (error: unknown) {
    throw new GitGraphError(`Git 进程启动失败：${String(error)}`, { cause: error })
  }
  if (signal.aborted) throw new GitGraphError('Git 图谱请求已取消')

  const stdout = outputOf(handle, 'stdout')
  const stderr = outputOf(handle, 'stderr')
  if (outcome.signal !== null || outcome.exitCode === null) {
    throw new GitGraphError(`Git 进程被信号终止：${outcome.signal ?? 'unknown'}`)
  }
  if (!allowedExitCodes.includes(outcome.exitCode)) {
    const detail = stderr.trim()
    throw new GitGraphError(`Git 命令失败（退出码 ${outcome.exitCode}）${detail.length > 0 ? `：${detail}` : ''}`)
  }
  return { ...outcome, stdout, stderr }
}

function parseRefs(decorations: string): GitGraphRef[] {
  const refs: GitGraphRef[] = []
  for (const raw of decorations.split(',').map(item => item.trim()).filter(item => item.length > 0)) {
    if (raw.startsWith('HEAD -> ')) {
      refs.push({ kind: 'head', name: raw.slice('HEAD -> '.length) })
      continue
    }
    if (raw === 'HEAD') {
      refs.push({ kind: 'head', name: 'HEAD' })
      continue
    }
    if (raw.startsWith('tag: ')) {
      refs.push({ kind: 'tag', name: raw.slice('tag: '.length) })
      continue
    }
    if (raw.startsWith('remotes/')) {
      refs.push({ kind: 'remote', name: raw.slice('remotes/'.length) })
      continue
    }
    if (raw.includes('/')) {
      refs.push({ kind: 'remote', name: raw })
      continue
    }
    refs.push({ kind: 'head', name: raw })
  }
  return refs
}

/** Parse the NUL/record-separated log format independently of the process seam. */
export function parseGitLog(text: string): GitGraphCommit[] {
  const commits: GitGraphCommit[] = []
  for (const rawRecord of text.split('\u001e')) {
    // `git log --format` inserts a line break between formatted records. After
    // splitting on RS, that separator prefixes every record except the first;
    // leaving it attached to the hash breaks exact parent-hash lookup.
    const record = rawRecord.replace(/^[\r\n]+/u, '')
    if (record.trim().length === 0) continue
    const fields = record.split('\u0000')
    if (fields.length < 7) throw new GitGraphError('Git log 输出格式不完整')
    const hash = fields[0]
    const parents = fields[1]
    const author = fields[2]
    const email = fields[3]
    const date = fields[4]
    const subject = fields[5]
    const decorations = fields[6]
    if (hash === undefined || parents === undefined || author === undefined || email === undefined
      || date === undefined || subject === undefined || decorations === undefined || hash.length === 0) {
      throw new GitGraphError('Git log 输出包含空提交记录')
    }
    const refs = parseRefs(decorations)
    commits.push({
      hash,
      parents: parents.length === 0 ? [] : parents.split(' '),
      author,
      email,
      date,
      subject,
      refs,
      isHead: refs.some(ref => ref.kind === 'head' && (ref.name === 'HEAD' || ref.name.length > 0)),
    })
  }
  return commits
}

/** Parse `git status --porcelain=v1 -b` without interpreting file contents. */
export function parseGitStatus(text: string): { branch: string | null; changed: boolean; summary: string } {
  const lines = text.split(/\r?\n/u).filter(line => line.length > 0)
  const header = lines[0]?.startsWith('## ') === true ? lines[0].slice(3) : ''
  const rawBranch = header.split('...')[0]?.trim() ?? ''
  const branch = rawBranch.length === 0 || rawBranch === 'HEAD' || rawBranch.startsWith('HEAD (') || rawBranch.startsWith('No commits yet')
    ? null
    : rawBranch
  const changedCount = lines.slice(header.length > 0 ? 1 : 0).length
  return {
    branch,
    changed: changedCount > 0,
    summary: changedCount === 0 ? '工作区干净' : `${changedCount} 个路径有未提交变更`,
  }
}

function validateInput(input: GitGraphInput): Required<Pick<GitGraphInput, 'maxCommits' | 'all' | 'firstParent'>> & GitGraphInput {
  const maxCommits = input.maxCommits ?? 100
  if (!Number.isSafeInteger(maxCommits) || maxCommits < 1 || maxCommits > MAX_COMMITS) {
    throw new GitGraphError(`max_commits 必须是 1 到 ${MAX_COMMITS} 之间的整数`)
  }
  return {
    ...input,
    maxCommits,
    all: input.all ?? true,
    firstParent: input.firstParent ?? false,
  }
}

function workingDirectory(input: GitGraphInput, exec: GitGraphExecutionContext): string {
  const candidate = input.path?.trim() || exec.agent?.session.header.cwd || process.cwd()
  if (candidate.length === 0) throw new GitGraphError('path 不能为空')
  return resolve(candidate)
}

function isNotGitRepositoryError(error: unknown): boolean {
  return error instanceof GitGraphError && /not a git repository/iu.test(error.message)
}

function emptyRepositorySnapshot(cwd: string): GitGraphSnapshot {
  return {
    path: cwd,
    branch: null,
    head: null,
    workingTree: {
      changed: false,
      summary: '不是 Git 仓库',
    },
    commits: [],
  }
}

/** Load the bounded graph snapshot used by the model result and Client renderer. */
export async function loadGitGraph(
  ctx: Context,
  input: GitGraphInput,
  exec: GitGraphExecutionContext,
): Promise<GitGraphSnapshot> {
  const validated = validateInput(input)
  const cwd = workingDirectory(validated, exec)
  let status: GitCommandResult
  try {
    status = await runGit(ctx, cwd, ['status', '--porcelain=v1', '-b'], exec.signal)
  } catch (error: unknown) {
    if (isNotGitRepositoryError(error)) return emptyRepositorySnapshot(cwd)
    throw error
  }
  const statusInfo = parseGitStatus(status.stdout)
  const headResult = await runGit(ctx, cwd, ['rev-parse', '--verify', 'HEAD'], exec.signal, [0, 1])
  const headText = headResult.exitCode === 0 ? headResult.stdout.trim() : ''
  const head = headText.length > 0 ? headText : null
  const logArgs = [
    'log',
    ...(validated.all ? ['--all'] : []),
    '--date-order',
    ...(validated.firstParent ? ['--first-parent'] : []),
    `--max-count=${validated.maxCommits}`,
    `--format=${LOG_FORMAT}`,
  ]
  const log = await runGit(ctx, cwd, logArgs, exec.signal)
  const parsed = parseGitLog(log.stdout)
  const commits = head === null
    ? parsed
    : parsed.map(commit => commit.hash === head ? { ...commit, isHead: true } : commit)
  return {
    path: cwd,
    branch: statusInfo.branch,
    head,
    workingTree: {
      changed: statusInfo.changed,
      summary: statusInfo.summary,
    },
    commits,
  }
}
