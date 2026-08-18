/**
 * Host-side Git adapter. The only process seam is ctx.subprocess; no shell
 * interpolation is used, so a repository path never becomes command text.
 */
import { resolve } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { SubprocessHandle, SubprocessSpawnSpec } from '@deepseek-ai/dsh-subprocess'
import type {
  GitGraphCommit,
  GitGraphCommitDetails,
  GitGraphFileChange,
  GitGraphInput,
  GitGraphRef,
  GitGraphRepoConfig,
  GitGraphSignature,
  GitGraphSignatureStatus,
  GitGraphSnapshot,
  GitGraphStash,
  GitGraphTag,
  GitGraphTagDetails,
  GitGraphWorkingTree,
} from './domain.ts'
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

/* ------------------------------------------------------------------ *
 * Phase 0 — read-only data pipeline (commit details, tags, stashes,
 * config, working-tree inventory). Pure parsers are exported for tests;
 * command loaders reuse the no-shell runGit seam.
 * ------------------------------------------------------------------ */

/** NUL/record separator used between records and fields (matches the log). */
const DETAILS_FORMAT = [
  '%H',      // 0 hash
  '%P',      // 1 parents
  '%aN',     // 2 author name
  '%aE',     // 3 author email
  '%aI',     // 4 author ISO date
  '%cN',     // 5 committer name
  '%cE',     // 6 committer email
  '%cI',     // 7 committer ISO date
  '%G?',     // 8 signature status (G/U/X/Y/R/E/B or empty)
  '%GS',     // 9 signature signer
  '%GK',     // 10 signature key
  '%B',      // 11 body
  '%x1e',    // record separator
].join('%x00')

const DETAILS_FIELD_COUNT = 12

const GIT_LOG_SEPARATOR = 'XX7Nal-YARtTpjCikii9nJxER19D6diSyk-AWkPb'

/** Parse an empty-or-status signature string ("", or G/U/X/Y/R/E/B) into a signature. */
export function parseSignatureStatus(status: string, signer: string, key: string): GitGraphSignature | null {
  const trimmed = status.trim()
  if (trimmed.length === 0) return null
  const statuses: GitGraphSignatureStatus[] = ['G', 'U', 'X', 'Y', 'R', 'E', 'B']
  if (!(statuses as string[]).includes(trimmed)) return null
  return {
    status: trimmed as GitGraphSignatureStatus,
    key: key.trim() || null,
    signer: signer.trim() || null,
  }
}

/** Parse one `git show --quiet` details record into a details object. */
function parseCommitDetailsRecord(record: string): GitGraphCommitDetails {
  const fields = record.split('\u0000')
  if (fields.length < DETAILS_FIELD_COUNT) throw new GitGraphError('Git commit details 输出格式不完整')
  const [
    hash, parents, author, authorEmail, authorDate,
    committer, committerEmail, committerDate, sigStatus, sigSigner, sigKey, body,
  ] = fields
  for (const field of [hash, parents, author, authorEmail, authorDate, committer, committerEmail, committerDate]) {
    if (field === undefined || field.length === 0) throw new GitGraphError('Git commit details 包含空字段')
  }
  return {
    hash: hash!,
    parents: parents!.length === 0 ? [] : parents!.split(' '),
    author: author!,
    authorEmail: authorEmail!,
    committer: committer!,
    committerEmail: committerEmail!,
    timestamps: {
      authorDate: authorDate!,
      committerDate: committerDate!,
    },
    signature: parseSignatureStatus(sigStatus ?? '', sigSigner ?? '', sigKey ?? ''),
    body: (body ?? '').replace(/\s+$/u, ''),
    fileChanges: [],
  }
}

/** Parse the whole `git show --quiet` stream (may contain one record). */
export function parseCommitDetails(text: string): GitGraphCommitDetails {
  for (const rawRecord of text.split('\u001e')) {
    const record = rawRecord.replace(/^[\r\n]+/u, '')
    if (record.trim().length === 0) continue
    return parseCommitDetailsRecord(record)
  }
  throw new GitGraphError('Git commit details 输出为空')
}

/** Parse `git diff-tree/diff --name-status -z` records into path/status pairs. */
export function parseDiffNameStatus(text: string): Array<{ readonly type: GitGraphFileChange['type']; readonly oldPath: string; readonly newPath: string }> {
  const tokens = text.split('\u0000')
  const result: Array<{ readonly type: GitGraphFileChange['type']; readonly oldPath: string; readonly newPath: string }> = []
  let i = 0
  while (i < tokens.length) {
    const statusToken = tokens[i]
    if (statusToken === undefined || statusToken.length === 0) { i += 1; continue }
    // Rename/copy status come as "R100" / "C80" with two paths after.
    const isRename = /^[RC]/u.test(statusToken)
    if (isRename) {
      const oldPath = tokens[i + 1]
      const newPath = tokens[i + 2]
      if (oldPath === undefined || newPath === undefined) throw new GitGraphError('Git diff name-status 重命名记录不完整')
      result.push({ type: 'R', oldPath, newPath })
      i += 3
    } else {
      const path = tokens[i + 1]
      if (path === undefined) throw new GitGraphError('Git diff name-status 记录不完整')
      const type = (statusToken[0] ?? 'M') as GitGraphFileChange['type']
      result.push({ type, oldPath: path, newPath: path })
      i += 2
    }
  }
  return result
}

/** Parse `git diff-tree/diff --numstat -z` records: "add\tdel\tpath" (or old/new for renames). */
export function parseDiffNumStat(text: string): Map<string, { readonly additions: number | null; readonly deletions: number | null }> {
  // git numstat separates records with NUL; fields with TAB. For renames with -z,
  // the format is "<add>\t<del>\t<oldPath>\t<newPath>" separated by NUL.
  const records = text.split('\u0000').filter(t => t.length > 0)
  const map = new Map<string, { readonly additions: number | null; readonly deletions: number | null }>()
  for (const record of records) {
    const fields = record.split('\t')
    if (fields.length < 3) continue
    const additionsText = fields[0]
    const deletionsText = fields[1]
    const lastPath = fields[fields.length - 1]
    if (lastPath === undefined) continue
    const additions = additionsText === '-' || additionsText === undefined ? null : Number.parseInt(additionsText, 10)
    const deletions = deletionsText === '-' || deletionsText === undefined ? null : Number.parseInt(deletionsText, 10)
    const add = Number.isNaN(additions ?? NaN) ? null : additions
    const del = Number.isNaN(deletions ?? NaN) ? null : deletions
    map.set(lastPath, { additions: add, deletions: del })
  }
  return map
}

/** Merge name-status and numstat into file changes (reusing vscode semantics). */
export function mergeFileChanges(
  nameStatus: ReadonlyArray<{ readonly type: GitGraphFileChange['type']; readonly oldPath: string; readonly newPath: string }>,
  numStat: Map<string, { readonly additions: number | null; readonly deletions: number | null }>,
): GitGraphFileChange[] {
  return nameStatus.map(entry => {
    const stat = numStat.get(entry.newPath)
    return {
      type: entry.type,
      oldPath: entry.oldPath,
      newPath: entry.newPath,
      additions: stat?.additions ?? null,
      deletions: stat?.deletions ?? null,
    }
  })
}

/**
 * Load the full details of one commit: `git show --quiet` for the header +
 * `diff-tree --name-status/--numstat` against its first parent (or root).
 */
export async function loadCommitDetails(
  ctx: Context,
  cwd: string,
  hash: string,
  signal: AbortSignal,
): Promise<GitGraphCommitDetails> {
  const show = await runGit(ctx, cwd, ['-c', 'log.showSignature=false', 'show', '--quiet', hash, `--format=${DETAILS_FORMAT}`], signal)
  const details = parseCommitDetails(show.stdout)

  const fromCommit = details.parents.length > 0 ? `${hash}^` : hash
  const baseArgs = ['-c', 'log.showSignature=false']
  // --no-commit-id suppresses the leading <commit> line that plain diff -z emits.
  const nameArgs = [...baseArgs, 'diff-tree', '--name-status', '-r', '--root', '--no-commit-id', '--find-renames', '--diff-filter=AMDR', '-z', fromCommit]
  const numArgs = [...baseArgs, 'diff-tree', '--numstat', '-r', '--root', '--no-commit-id', '--find-renames', '--diff-filter=AMDR', '-z', fromCommit]
  const [nameResult, numResult] = await Promise.all([
    runGit(ctx, cwd, nameArgs, signal),
    runGit(ctx, cwd, numArgs, signal),
  ])
  const nameEntries = parseDiffNameStatus(nameResult.stdout)
  const numMap = parseDiffNumStat(numResult.stdout)
  return { ...details, fileChanges: mergeFileChanges(nameEntries, numMap) }
}

/** Parse `git reflog refs/stash --format=<fmt>` into stash entries. */
export function parseStashReflog(text: string): GitGraphStash[] {
  const stashes: GitGraphStash[] = []
  for (const rawRecord of text.split('\u001e')) {
    const record = rawRecord.replace(/^[\r\n]+/u, '')
    if (record.trim().length === 0) continue
    const fields = record.split('\u0000')
    if (fields.length < 6) throw new GitGraphError('Git stash reflog 输出格式不完整')
    const [hash, parents, selector, author, email, date, subject] = fields
    if (hash === undefined || parents === undefined || selector === undefined || author === undefined || email === undefined || date === undefined || subject === undefined) {
      throw new GitGraphError('Git stash reflog 包含空字段')
    }
    const parentHashes = parents.length === 0 ? [] : parents.split(' ')
    const baseHash = parentHashes[0] ?? ''
    // A 3-parent stash has an untracked-files commit as the third parent.
    const untrackedFilesHash = parentHashes.length >= 3 ? parentHashes[2] ?? null : null
    stashes.push({
      selector,
      hash,
      baseHash,
      untrackedFilesHash,
      author,
      email,
      date,
      message: subject,
    })
  }
  return stashes
}

/** Load all stashes (`git reflog refs/stash`). */
export async function loadStashes(ctx: Context, cwd: string, signal: AbortSignal): Promise<GitGraphStash[]> {
  const stashFormat = ['%H', '%P', '%gD', '%aN', '%aE', '%aI', '%s', '%x1e'].join('%x00')
  const result = await runGit(ctx, cwd, ['reflog', `--format=${stashFormat}`, 'refs/stash', '--'], signal, [0, 1])
  if (result.exitCode === 1 && result.stdout.trim().length === 0) return []
  return parseStashReflog(result.stdout)
}

/** Parse `git for-each-ref refs/tags` lines into (name, object, annotated) triples. */
export function parseForEachRefTags(text: string): Array<{ readonly name: string; readonly object: string; readonly annotated: boolean }> {
  const tags: Array<{ readonly name: string; readonly object: string; readonly annotated: boolean }> = []
  for (const line of text.split(/\r?\n/u)) {
    if (line.length === 0) continue
    // Format: <objectname>\t<refname>\t<objecttype>. An annotated tag has
    // objecttype "tag"; a lightweight tag points straight at a "commit".
    const parts = line.split('\t')
    if (parts.length < 3) continue
    const object = parts[0] ?? ''
    const ref = parts[1] ?? ''
    const objectType = parts[2] ?? ''
    const match = /^refs\/tags\/(.+)$/u.exec(ref)
    if (match === null) continue
    tags.push({ name: match[1] ?? '', object, annotated: objectType === 'tag' })
  }
  return tags
}

/** Parse `git for-each-ref refs/tags/<name>` annotated-tag detail record. */
export function parseAnnotatedTagDetail(text: string): GitGraphTagDetails {
  const fields = text.split(GIT_LOG_SEPARATOR)
  if (fields.length < 5) throw new GitGraphError('Git annotated tag 详情输出格式不完整')
  const objectHash = fields[0]
  const tagger = fields[1]
  const taggerEmail = fields[2]
  const taggerDate = fields[3]
  const sigStatus = fields[4]
  const contents = fields.slice(5).join(GIT_LOG_SEPARATOR)
  if (objectHash === undefined || objectHash.length === 0) throw new GitGraphError('Git annotated tag 详情包含空字段')
  const message = (contents ?? '').replace(/\s+$/u, '')
  return {
    objectHash,
    tagger: (tagger ?? '').trim(),
    taggerEmail: (taggerEmail ?? '').trim(),
    taggerDate: taggerDate ?? '',
    message,
    signature: sigStatus !== undefined && sigStatus.trim().length > 0
      ? { status: 'G', key: sigStatus.trim() || null, signer: null }
      : null,
  }
}

/** Load tag refs (name + object + annotated flag) and annotated-tag details. */
export async function loadTags(ctx: Context, cwd: string, signal: AbortSignal): Promise<GitGraphTag[]> {
  const listFormat = ['%(objectname)', '%(refname)', '%(objecttype)'].join('\t')
  const list = await runGit(ctx, cwd, ['for-each-ref', 'refs/tags', `--format=${listFormat}`], signal)
  const entries = parseForEachRefTags(list.stdout)
  const tags: GitGraphTag[] = []
  for (const entry of entries) {
    if (!entry.annotated) {
      tags.push({ name: entry.name, annotated: false, detail: null })
      continue
    }
    const detailFields = ['%(objectname)', '%(taggername)', '%(taggeremail)', '%(taggerdate:iso-strict)', '%(contents:signature)', '%(contents)']
    const detailFormat = detailFields.join(GIT_LOG_SEPARATOR)
    const detailResult = await runGit(ctx, cwd, ['for-each-ref', `refs/tags/${entry.name}`, `--format=${detailFormat}`], signal)
    tags.push({
      name: entry.name,
      annotated: true,
      detail: parseAnnotatedTagDetail(detailResult.stdout),
    })
  }
  return tags
}

/** Parse `git config --list -z --includes [--local|--global]` into key/value pairs. */
export function parseConfigList(text: string): Map<string, string> {
  const map = new Map<string, string>()
  // --null terminates each key with a newline and each value with NUL, so each
  // NUL token is "<key>\n<value>" (value may itself be multi-line). Accept LF or
  // CRLF separators to stay robust across git versions/platforms.
  for (const pair of text.split('\u0000')) {
    if (pair.length === 0) continue
    const match = /^(.*?)(?:\r?\n)([\s\S]*)$/u.exec(pair)
    if (match === null) continue
    const key = match[1] ?? ''
    const value = (match[2] ?? '').replace(/\r$/u, '')
    map.set(key, value)
  }
  return map
}

/** Load consolidated/local/global config lists and build the read-only repo config. */
export async function loadRepoConfig(ctx: Context, cwd: string, remotes: readonly string[], signal: AbortSignal): Promise<GitGraphRepoConfig> {
  const [consolidated, local, global] = await Promise.all([
    runGit(ctx, cwd, ['--no-pager', 'config', '--list', '-z', '--includes'], signal),
    runGit(ctx, cwd, ['--no-pager', 'config', '--list', '-z', '--includes', '--local'], signal),
    runGit(ctx, cwd, ['--no-pager', 'config', '--list', '-z', '--includes', '--global'], signal),
  ])
  const consolidatedMap = parseConfigList(consolidated.stdout)
  const localMap = parseConfigList(local.stdout)
  const globalMap = parseConfigList(global.stdout)

  const branches: Record<string, { readonly remote: string | null; readonly pushRemote: string | null }> = {}
  for (const key of localMap.keys()) {
    const remoteMatch = /^branch\.(.+)\.remote$/u.exec(key)
    const pushMatch = /^branch\.(.+)\.pushremote$/u.exec(key)
    if (remoteMatch !== null) {
      const name = remoteMatch[1]!
      branches[name] = { ...(branches[name] ?? { remote: null, pushRemote: null }), remote: localMap.get(key) ?? null }
    } else if (pushMatch !== null) {
      const name = pushMatch[1]!
      branches[name] = { ...(branches[name] ?? { remote: null, pushRemote: null }), pushRemote: localMap.get(key) ?? null }
    }
  }

  return {
    branches,
    diffTool: consolidatedMap.get('diff.tool') ?? null,
    guiDiffTool: consolidatedMap.get('diff.guitool') ?? null,
    pushDefault: consolidatedMap.get('remote.pushdefault') ?? null,
    remotes: remotes.map(remote => ({
      name: remote,
      url: localMap.get(`remote.${remote}.url`) ?? null,
      pushUrl: localMap.get(`remote.${remote}.pushurl`) ?? null,
    })),
    user: {
      name: { local: localMap.get('user.name') ?? null, global: globalMap.get('user.name') ?? null },
      email: { local: localMap.get('user.email') ?? null, global: globalMap.get('user.email') ?? null },
    },
  }
}

/** Parse `git status -s --porcelain -z` into modified/deleted/untracked inventories. */
export function parseWorkingTreeStatus(text: string): GitGraphWorkingTree {
  const tokens = text.split('\u0000').filter(t => t.length > 0)
  const modified: string[] = []
  const deleted: string[] = []
  const untracked: string[] = []
  let i = 0
  while (i < tokens.length) {
    const token = tokens[i]
    if (token === undefined) break
    // Porcelain v1 -z format is "XY<SP>path": two status columns, a space,
    // then the path. Rename/copy entries ("R  <old>") list the new path as the
    // following NUL token, so advance i past it.
    const status = token.slice(0, 2)
    let path = token.slice(3)
    let consumedPath = path.length > 0
    if (/^[RC]/u.test(status)) {
      const newPath = tokens[i + 1]
      if (newPath !== undefined && consumedPath) {
        path = newPath
        i += 2
        consumedPath = true
      } else {
        i += 1
      }
      if (!consumedPath) i += 1
    } else {
      i += 1
    }
    if (consumedPath && path.length > 0) {
      if (status.includes('D') && !status.includes('A')) deleted.push(path)
      else if (status.startsWith('?')) untracked.push(path)
      else modified.push(path)
    }
  }
  const changed = modified.length > 0 || deleted.length > 0 || untracked.length > 0
  return { changed, deleted, untracked, modified }
}

/** Load the working-tree change inventory. */
export async function loadWorkingTree(ctx: Context, cwd: string, includeUntracked: boolean, signal: AbortSignal): Promise<GitGraphWorkingTree> {
  const untracked = includeUntracked ? 'all' : 'no'
  const result = await runGit(ctx, cwd, ['status', '-s', `--untracked-files=${untracked}`, '--porcelain', '-z'], signal)
  return parseWorkingTreeStatus(result.stdout)
}
