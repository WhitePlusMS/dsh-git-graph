/**
 * Host-side Git adapter. The only process seam is ctx.subprocess; no shell
 * interpolation is used, so a repository path never becomes command text.
 */
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { lstat, mkdtemp, realpath, rmdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { branchRef, COMMIT_HASH_PATTERN, MAX_AVATAR_BATCH, MAX_BRANCH_FILTER, MAX_COMMITS, MAX_SEARCH_COMMITS } from "./domain.js";
const LOG_FORMAT = '%H%x00%P%x00%aN%x00%aE%x00%aI%x00%cI%x00%s%x00%D';
const OUTPUT_MAX_BYTES = 8 * 1024 * 1024;
const STDERR_MAX_BYTES = 64 * 1024;
const GRACE_MS = 3_000;
const DIFF_OPTIONS = ['--no-color', '--no-ext-diff', '--no-textconv', '--no-relative', '--find-renames'];
const PATCH_OPTIONS = ['--unified=3', '--output-indicator-new=+', '--output-indicator-old=-', '--output-indicator-context= '];
/** A stable error type for all Git acquisition failures. */
export class GitGraphError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = 'GitGraphError';
    }
}
export class GitObjectMissingError extends GitGraphError {
}
export class GitSubmoduleUnavailableError extends GitGraphError {
}
export class GitOutputLimitError extends GitGraphError {
}
function outputOf(handle, stream) {
    const reader = handle.collected[stream];
    if (reader === undefined)
        throw new GitGraphError(`git ${stream} output was not collected`);
    const result = reader.readFrom(0);
    if (result.lossy)
        throw new GitOutputLimitError(`git ${stream} output exceeded the capture limit`);
    return result.text;
}
async function runGit(ctx, cwd, args, signal, allowedExitCodes = [0], readStdout) {
    signal.throwIfAborted();
    let handle;
    try {
        const spec = {
            // The protocol allowlist also blocks transport on Git versions that do not
            // honor GIT_NO_LAZY_FETCH. Keep read commands local, including in partial clones.
            argv: ['git', '--no-pager', '--no-optional-locks', '--literal-pathspecs',
                '-c', 'core.fsmonitor=false', '-c', 'log.showSignature=false', '-c', 'diff.suppressBlankEmpty=false', ...args],
            cwd,
            env: { GIT_NO_LAZY_FETCH: '1', GIT_ALLOW_PROTOCOL: '', LC_ALL: 'C' },
            stdio: {
                stdin: 'ignore',
                stdout: readStdout === undefined ? { maxBytes: OUTPUT_MAX_BYTES } : 'pipe',
                stderr: { maxBytes: STDERR_MAX_BYTES },
            },
            graceMs: GRACE_MS,
            signal,
        };
        handle = ctx.subprocess.spawn(spec);
    }
    catch (error) {
        throw new GitGraphError(`无法启动 Git：${String(error)}`, { cause: error });
    }
    let outcome;
    let stdout;
    try {
        if (readStdout === undefined) {
            outcome = await handle.done;
            if (signal.aborted)
                throw new GitGraphError('Git 图谱请求已取消', { cause: signal.reason });
            stdout = outputOf(handle, 'stdout');
        }
        else {
            [outcome, stdout] = await Promise.all([handle.done, readStdout(handle)]);
        }
    }
    catch (error) {
        if (error instanceof GitGraphError)
            throw error;
        throw new GitGraphError(`Git 进程启动失败：${String(error)}`, { cause: error });
    }
    if (signal.aborted)
        throw new GitGraphError('Git 图谱请求已取消', { cause: signal.reason });
    const stderr = outputOf(handle, 'stderr');
    if (outcome.signal !== null || outcome.exitCode === null) {
        throw new GitGraphError(`Git 进程被信号终止：${outcome.signal ?? 'unknown'}`);
    }
    if (!allowedExitCodes.includes(outcome.exitCode)) {
        const detail = stderr.trim();
        throw new GitGraphError(`Git 命令失败（退出码 ${outcome.exitCode}）${detail.length > 0 ? `：${detail}` : ''}`);
    }
    return { ...outcome, stdout, stderr };
}
async function readGitBytes(handle, maxBytes) {
    if (handle.stdout === undefined)
        throw new GitGraphError('Git 原始输出不可用');
    const chunks = [];
    let size = 0;
    for await (const chunk of handle.stdout) {
        size += chunk.length;
        if (size > maxBytes) {
            handle.terminate();
            throw new GitOutputLimitError('Git 原始输出超过读取上限');
        }
        chunks.push(chunk);
    }
    return Buffer.concat(chunks, size);
}
function parseRefs(decorations) {
    const refs = [];
    for (const raw of decorations.split(', ').map(item => item.trim()).filter(item => item.length > 0)) {
        if (raw.startsWith('HEAD -> refs/heads/')) {
            refs.push({ kind: 'head', name: raw.slice('HEAD -> refs/heads/'.length) });
            continue;
        }
        if (raw === 'HEAD') {
            // HEAD is represented by isHead, not by a fabricated local branch.
            continue;
        }
        if (raw.startsWith('tag: refs/tags/')) {
            refs.push({ kind: 'tag', name: raw.slice('tag: refs/tags/'.length) });
            continue;
        }
        if (raw.startsWith('refs/remotes/')) {
            refs.push({ kind: 'remote', name: raw.slice('refs/remotes/'.length) });
            continue;
        }
        if (raw.startsWith('refs/heads/'))
            refs.push({ kind: 'head', name: raw.slice('refs/heads/'.length) });
        // Other namespaces (e.g. refs/stash) are not branch labels. The Git
        // command supplies full decorations, so slash guessing is unnecessary.
    }
    return refs;
}
/** `git log -z --format` terminates fixed-width records with NUL. */
export function parseGitLog(text) {
    const commits = [];
    for (const fields of gitRecords(text, 8)) {
        const [hash, parents, author, email, date, committerDate, subject, decorations] = fields;
        if (hash === undefined || parents === undefined || author === undefined || email === undefined
            || date === undefined || committerDate === undefined || subject === undefined || decorations === undefined || hash.length === 0) {
            throw new GitGraphError('Git log 输出包含空提交记录');
        }
        const refs = parseRefs(decorations);
        commits.push({
            hash,
            parents: parents.length === 0 ? [] : parents.split(' '),
            author,
            email,
            date,
            committerDate,
            subject,
            refs,
            isHead: decorations.split(', ').some(ref => ref.trim() === 'HEAD' || ref.trim().startsWith('HEAD -> ')),
        });
    }
    return commits;
}
function* gitRecords(text, width) {
    if (text.length === 0)
        return;
    const fields = text.split('\u0000');
    if (fields.pop() !== '' || fields.length % width !== 0)
        throw new GitGraphError('Git 输出记录格式不完整');
    for (let index = 0; index < fields.length; index += width)
        yield fields.slice(index, index + width);
}
/** Parse `git status --porcelain=v1 -b` without interpreting file contents. */
export function parseGitStatus(text) {
    const lines = text.split(/\r?\n/u).filter(line => line.length > 0);
    const header = lines[0]?.startsWith('## ') === true ? lines[0].slice(3) : '';
    const rawBranch = (header.split('...')[0]?.trim() ?? '').replace(/^No commits yet on /u, '');
    const branch = rawBranch.length === 0 || rawBranch === 'HEAD' || rawBranch.startsWith('HEAD (')
        ? null
        : rawBranch;
    const changedCount = lines.slice(header.length > 0 ? 1 : 0).length;
    return {
        branch,
        changed: changedCount > 0,
        summary: changedCount === 0 ? '工作区干净' : `${changedCount} 个路径有未提交变更`,
    };
}
function validateInput(input) {
    const maxCommits = input.maxCommits ?? 100;
    if (!Number.isSafeInteger(maxCommits) || maxCommits < 1 || maxCommits > MAX_COMMITS) {
        throw new GitGraphError(`max_commits 必须是 1 到 ${MAX_COMMITS} 之间的整数`);
    }
    const sort = input.sort ?? 'date';
    if (sort !== 'date' && sort !== 'author-date' && sort !== 'topological') {
        throw new GitGraphError('sort 必须是 date、author-date 或 topological');
    }
    const glob = (input.glob ?? []).map(item => item.trim()).filter(item => item.length > 0);
    if (glob.length > MAX_BRANCH_FILTER)
        throw new GitGraphError(`glob 最多 ${MAX_BRANCH_FILTER} 项`);
    // Exact branch focus is bounded for the same reason as globs: the value is
    // joined into one bounded query, not an unbounded selector list.
    const branches = (input.branches ?? []).map(item => item.trim()).filter(item => item.length > 0);
    if (branches.length > MAX_BRANCH_FILTER) {
        throw new GitGraphError(`branches 最多 ${MAX_BRANCH_FILTER} 项`);
    }
    const search = (input.search ?? '').trim();
    return {
        ...input,
        maxCommits,
        all: input.all ?? true,
        firstParent: input.firstParent ?? false,
        sort,
        glob,
        branches,
        search,
    };
}
/** Case-insensitive substring match against the full search surface of a commit. */
function commitMatchesSearch(commit, query) {
    const needle = query.toLocaleLowerCase();
    const haystack = [
        commit.hash,
        commit.subject,
        commit.author,
        commit.email,
        commit.date,
        commit.committerDate,
        ...commit.refs.map(ref => ref.name),
    ].join('\n').toLocaleLowerCase();
    return haystack.includes(needle);
}
/** Wire format for one branch row: full ref, tip, short name, symbolic target. */
const BRANCH_FORMAT = '%(refname)%00%(objectname)%00%(refname:short)%00%(symref)';
/** Pure parser for the branch listing, exported so it can be tested alone. */
export function parseBranches(stdout, currentBranch) {
    const branches = [];
    for (const line of stdout.split(/\r?\n/u)) {
        if (line.length === 0)
            continue;
        const [refname, hash, short, symref] = line.split('\u0000');
        if (refname === undefined || hash === undefined || short === undefined)
            continue;
        if (short.length === 0 || hash.length === 0)
            continue;
        if (symref !== undefined && symref.length > 0)
            continue;
        const kind = refname.startsWith('refs/heads/') ? 'local'
            : refname.startsWith('refs/remotes/') ? 'remote'
                : undefined;
        if (kind === undefined)
            continue;
        const name = refname.slice(kind === 'local' ? 'refs/heads/'.length : 'refs/remotes/'.length);
        branches.push({ name, hash, kind, isCurrent: kind === 'local' && name === currentBranch });
    }
    return branches;
}
/** Load every branch once per snapshot; one command covers local and remote. */
async function loadBranches(ctx, cwd, currentBranch, signal, globs = []) {
    // Delegate wildmatch (negation, ranges and malformed classes) to Git itself.
    // Preserve the UI's plain-prefix convention while constraining namespaces.
    const refs = globs.length === 0 ? ['refs/heads', 'refs/remotes']
        : globs.flatMap(pattern => {
            const suffix = /[*?[]/u.test(pattern) ? pattern : `${pattern}*`;
            return [`refs/heads/${suffix}`, `refs/remotes/${suffix}`];
        });
    const result = await runGit(ctx, cwd, ['for-each-ref', `--format=${BRANCH_FORMAT}`, ...refs], signal);
    return parseBranches(result.stdout, currentBranch);
}
function workingDirectory(input, exec) {
    const candidate = input.path?.trim() || exec.agent?.session.header.cwd || process.cwd();
    if (candidate.length === 0)
        throw new GitGraphError('path 不能为空');
    return resolve(candidate);
}
function isNotGitRepositoryError(error) {
    return error instanceof GitGraphError && /not a git repository/iu.test(error.message);
}
function nonGitRepositorySnapshot(cwd) {
    return {
        path: cwd,
        state: 'not-git',
        branch: null,
        head: null,
        remotes: [],
        branches: [],
        workingTree: {
            changed: false,
            summary: '不是 Git 仓库',
        },
        commits: [],
        hasMore: false,
        searchTruncated: false,
    };
}
/** Load the bounded graph snapshot used by the model result and Client renderer. */
export async function loadGitGraph(ctx, input, exec) {
    const validated = validateInput(input);
    const requestedCwd = workingDirectory(validated, exec);
    let cwd = requestedCwd;
    let status;
    try {
        status = await runGit(ctx, cwd, ['status', '--porcelain=v1', '-b', '--untracked-files=normal'], exec.signal);
    }
    catch (error) {
        if (isNotGitRepositoryError(error))
            return nonGitRepositorySnapshot(cwd);
        throw error;
    }
    const statusInfo = parseGitStatus(status.stdout);
    cwd = await repositoryRoot(ctx, requestedCwd, exec.signal);
    // `rev-parse --verify HEAD` on a fresh repo (no commits yet) exits 128, so a
    // missing HEAD is treated as an empty repository, not a query failure.
    const headResult = await runGit(ctx, cwd, ['rev-parse', '--verify', 'HEAD'], exec.signal, [0, 1, 128]);
    const headText = headResult.exitCode === 0 ? headResult.stdout.trim() : '';
    const head = headText.length > 0 ? headText : null;
    const remoteResult = await runGit(ctx, cwd, ['remote'], exec.signal);
    const remotes = remoteResult.stdout.split(/\r?\n/u).filter(name => name.length > 0);
    // Listed once per snapshot so the Client can jump to a branch tip and focus
    // exactly that branch without running any write command of its own.
    const branches = await loadBranches(ctx, cwd, statusInfo.branch, exec.signal);
    const orderFlag = validated.sort === 'author-date' ? '--author-date-order'
        : validated.sort === 'topological' ? '--topo-order'
            : '--date-order';
    // Two filters select branches by resolving the real ref list and passing the
    // matched full refs as fixed rev arguments. Exact names win when both are sent:
    // focusing one branch must never silently widen into a glob.
    const nameFilterActive = validated.branches.length > 0 || validated.glob.length > 0;
    const selectedBranches = validated.branches.length > 0
        ? branches.filter(branch => validated.branches.includes(branchRef(branch)))
        : validated.glob.length > 0
            ? await loadBranches(ctx, cwd, statusInfo.branch, exec.signal, validated.glob)
            : [];
    const refArgs = nameFilterActive
        ? selectedBranches.map(branchRef)
        : validated.all ? ['--all'] : [];
    // A branch filter that matches nothing yields an empty graph rather than
    // falling back to HEAD history. The repository itself may still be non-empty.
    if (nameFilterActive && selectedBranches.length === 0) {
        return {
            path: cwd,
            state: head === null ? 'empty' : 'ready',
            branch: statusInfo.branch,
            head,
            remotes,
            branches,
            workingTree: {
                changed: statusInfo.changed,
                summary: statusInfo.summary,
            },
            commits: [],
            hasMore: false,
            searchTruncated: false,
        };
    }
    // Search scans beyond the displayed page up to its explicit resource budget;
    // paging is applied to matches and truncation is reported independently.
    const searching = validated.search.length > 0;
    // One extra record detects truncation without presenting it as a search hit.
    const cap = searching ? MAX_SEARCH_COMMITS + 1 : validated.maxCommits + 1;
    const logArgs = [
        'log',
        '-z',
        '--decorate=full',
        '--decorate-refs=HEAD',
        '--decorate-refs=refs/heads/*',
        '--decorate-refs=refs/remotes/*',
        '--decorate-refs=refs/tags/*',
        ...refArgs,
        orderFlag,
        ...(validated.firstParent ? ['--first-parent'] : []),
        `--max-count=${cap}`,
        `--format=${LOG_FORMAT}`,
    ];
    // A fresh repository (no commits) makes `git log` exit 128 with "Needed a
    // single revision"; treat that as an empty repository, not a failure.
    let log;
    try {
        log = await runGit(ctx, cwd, logArgs, exec.signal);
    }
    catch (error) {
        if (error instanceof GitGraphError && /Needed a single revision|does not have any commits/iu.test(error.message)) {
            log = { exitCode: 128, signal: null, stdout: '', stderr: '' };
        }
        else {
            throw error;
        }
    }
    const parsed = parseGitLog(log.stdout);
    const searchTruncated = searching && parsed.length > MAX_SEARCH_COMMITS;
    const allCommits = (searching ? parsed.slice(0, MAX_SEARCH_COMMITS) : parsed).map(commit => ({ ...commit, isHead: commit.hash === head }));
    const searched = validated.search.length === 0
        ? allCommits
        : allCommits.filter(commit => commitMatchesSearch(commit, validated.search));
    const hasMore = searched.length > validated.maxCommits;
    const commits = searched.slice(0, validated.maxCommits);
    return {
        path: cwd,
        state: allCommits.length === 0 ? 'empty' : 'ready',
        branch: statusInfo.branch,
        head,
        remotes,
        branches,
        workingTree: {
            changed: statusInfo.changed,
            summary: statusInfo.summary,
        },
        commits,
        hasMore,
        searchTruncated,
    };
}
/* ------------------------------------------------------------------ *
 * Phase 0 — read-only data pipeline (commit details, tags, stashes,
 * config, working-tree inventory). Pure parsers are exported for tests;
 * command loaders reuse the no-shell runGit seam.
 * ------------------------------------------------------------------ */
/** NUL/record separator used between records and fields (matches the log). */
const DETAILS_FORMAT = [
    '%H', // 0 hash
    '%P', // 1 parents
    '%aN', // 2 author name
    '%aE', // 3 author email
    '%aI', // 4 author ISO date
    '%cN', // 5 committer name
    '%cE', // 6 committer email
    '%cI', // 7 committer ISO date
    '%G?', // 8 signature status (G/U/X/Y/R/E/B or empty)
    '%GS', // 9 signature signer
    '%GK', // 10 signature key
    '%B', // 11 body
].join('%x00');
const DETAILS_FIELD_COUNT = 12;
/** Parse an empty-or-status signature string ("", or G/U/X/Y/R/E/B) into a signature. */
export function parseSignatureStatus(status, signer, key) {
    const trimmed = status.trim();
    if (trimmed.length === 0)
        return null;
    const statuses = ['G', 'U', 'X', 'Y', 'R', 'E', 'B'];
    if (!statuses.includes(trimmed))
        return null;
    return {
        status: trimmed,
        key: key.trim() || null,
        signer: signer.trim() || null,
    };
}
/** Parse one `git show --quiet` details record into a details object. */
function parseCommitDetailsRecord(record) {
    const fields = record.split('\u0000');
    if (fields.length < DETAILS_FIELD_COUNT)
        throw new GitGraphError('Git commit details 输出格式不完整');
    const [hash, parents, author, authorEmail, authorDate, committer, committerEmail, committerDate, sigStatus, sigSigner, sigKey, body,] = fields;
    // Root commits have no parents, so `parents` is allowed to be empty; the
    // remaining header fields must all be populated.
    for (const field of [hash, author, authorEmail, authorDate, committer, committerEmail, committerDate]) {
        if (field === undefined || field.length === 0)
            throw new GitGraphError('Git commit details 包含空字段');
    }
    return {
        hash: hash,
        parents: parents.length === 0 ? [] : parents.split(' '),
        author: author,
        authorEmail: authorEmail,
        committer: committer,
        committerEmail: committerEmail,
        timestamps: {
            authorDate: authorDate,
            committerDate: committerDate,
        },
        signature: parseSignatureStatus(sigStatus ?? '', sigSigner ?? '', sigKey ?? ''),
        body: (body ?? '').replace(/\s+$/u, ''),
        fileChanges: [],
    };
}
/** Parse the whole `git show --quiet` stream (may contain one record). */
export function parseCommitDetails(text) {
    return parseCommitDetailsRecord(text);
}
/** Parse `git diff-tree/diff --name-status -z` records into path/status pairs. */
export function parseDiffNameStatus(text) {
    const tokens = text.split('\u0000');
    const result = [];
    let i = 0;
    while (i < tokens.length) {
        const statusToken = tokens[i];
        if (statusToken === undefined || statusToken.length === 0) {
            i += 1;
            continue;
        }
        // Rename/copy status come as "R100" / "C80" with two paths after.
        const isRename = /^[RC]/u.test(statusToken);
        if (isRename) {
            const oldPath = tokens[i + 1];
            const newPath = tokens[i + 2];
            if (oldPath === undefined || newPath === undefined)
                throw new GitGraphError('Git diff name-status 重命名记录不完整');
            result.push({ type: 'R', oldPath, newPath });
            i += 3;
        }
        else {
            const path = tokens[i + 1];
            if (path === undefined)
                throw new GitGraphError('Git diff name-status 记录不完整');
            const type = (statusToken[0] ?? 'M');
            result.push({ type, oldPath: path, newPath: path });
            i += 2;
        }
    }
    return result;
}
/** Parse `git diff-tree/diff --numstat -z` records: "add\tdel\tpath" (or old/new for renames). */
export function parseDiffNumStat(text) {
    // With -z a rename has an empty path field followed by old/new NUL tokens.
    // Read only the first two TAB separators; a filename may itself contain TAB.
    const records = text.split('\u0000');
    const map = new Map();
    let index = 0;
    while (index < records.length) {
        const record = records[index++];
        if (record === undefined || record.length === 0)
            continue;
        const fields = /^(-|\d+)\t(-|\d+)\t([\s\S]*)$/u.exec(record);
        if (fields === null)
            throw new GitGraphError('Git numstat 记录格式不完整');
        let path = fields[3] ?? '';
        if (path.length === 0) {
            const oldPath = records[index++];
            const newPath = records[index++];
            if (!oldPath || !newPath)
                throw new GitGraphError('Git numstat 重命名记录不完整');
            path = newPath;
        }
        const additions = fields[1] === '-' ? null : Number(fields[1]);
        const deletions = fields[2] === '-' ? null : Number(fields[2]);
        if ((additions !== null && !Number.isSafeInteger(additions)) || (deletions !== null && !Number.isSafeInteger(deletions))) {
            throw new GitGraphError('Git numstat 行数超出安全整数范围');
        }
        map.set(path, { additions, deletions });
    }
    return map;
}
/** Merge name-status and numstat into file changes (reusing vscode semantics). */
export function mergeFileChanges(nameStatus, numStat) {
    return nameStatus.map(entry => {
        const stat = numStat.get(entry.newPath);
        if (stat === undefined)
            throw new GitGraphError(`Git numstat 缺少文件记录：${entry.newPath}`);
        return {
            type: entry.type,
            oldPath: entry.oldPath,
            newPath: entry.newPath,
            additions: stat?.additions ?? null,
            deletions: stat?.deletions ?? null,
        };
    });
}
/**
 * Load the full details of one commit: `git show --quiet` for the header +
 * `diff-tree --name-status/--numstat` against its first parent (or root).
 */
export async function loadCommitDetails(ctx, cwd, hash, signal) {
    assertValidHash(hash);
    const show = await runGit(ctx, cwd, ['show', '--quiet', hash, `--format=${DETAILS_FORMAT}`], signal);
    const details = parseCommitDetails(show.stdout);
    const base = details.parents[0] ?? await firstParentOrEmptyTree(ctx, cwd, hash, signal);
    return { ...details, fileChanges: await loadChangeInventory(ctx, cwd, [base, hash], signal) };
}
/** Parse `git reflog refs/stash --format=<fmt>` into stash entries. */
export function parseStashReflog(text) {
    const stashes = [];
    for (const fields of gitRecords(text, 7)) {
        const [hash, parents, selector, author, email, date, subject] = fields;
        if (hash === undefined || parents === undefined || selector === undefined || author === undefined || email === undefined || date === undefined || subject === undefined) {
            throw new GitGraphError('Git stash reflog 包含空字段');
        }
        const parentHashes = parents.length === 0 ? [] : parents.split(' ');
        const baseHash = parentHashes[0] ?? '';
        // A 3-parent stash has an untracked-files commit as the third parent.
        const untrackedFilesHash = parentHashes.length >= 3 ? parentHashes[2] ?? null : null;
        stashes.push({
            selector,
            hash,
            baseHash,
            untrackedFilesHash,
            author,
            email,
            date,
            message: subject,
        });
    }
    return stashes;
}
/** Load all stashes (`git reflog refs/stash`). */
export async function loadStashes(ctx, cwd, signal) {
    const stashFormat = ['%H', '%P', '%gD', '%aN', '%aE', '%aI', '%s'].join('%x00');
    // When no stash exists, `git reflog refs/stash` exits 128 ("bad revision").
    // Those exit codes mean "no stashes", not a query failure.
    const result = await runGit(ctx, cwd, ['reflog', '-z', `--format=${stashFormat}`, 'refs/stash', '--'], signal, [0, 1, 128]);
    if (result.exitCode !== 0 && result.stdout.trim().length === 0)
        return [];
    return parseStashReflog(result.stdout);
}
/** Load all tags and their details in one bounded subprocess capture. */
export async function loadTags(ctx, cwd, signal) {
    // Fixed-width NUL fields preserve multiline messages and separator characters.
    // Git adds one newline after each record; only strip it from the next hash.
    const fields = ['%(objectname)', '%(refname)', '%(objecttype)', '%(taggername)', '%(taggeremail)', '%(taggerdate:iso-strict)', '%(contents:signature)', '%(contents)'];
    const result = await runGit(ctx, cwd, ['for-each-ref', 'refs/tags', `--format=${fields.join('%00')}%00`], signal);
    const tokens = result.stdout.split('\u0000');
    const tags = [];
    for (let index = 0; index + 7 < tokens.length; index += 8) {
        const [rawHash = '', ref = '', kind = '', tagger = '', email = '', date = '', signature = '', message = ''] = tokens.slice(index, index + 8);
        const objectHash = rawHash.replace(/^[\r\n]+/u, '');
        if (!ref.startsWith('refs/tags/') || objectHash.length === 0)
            throw new GitGraphError('Git tag 输出格式不完整');
        const annotated = kind === 'tag';
        tags.push({
            name: ref.slice('refs/tags/'.length),
            annotated,
            detail: annotated ? {
                objectHash,
                tagger: tagger.trim(),
                taggerEmail: email.trim(),
                taggerDate: date,
                message: message.replace(/\s+$/u, ''),
                // Signature presence does not establish verification or signer identity.
                signature: signature.trim().length > 0 ? { status: 'E', key: null, signer: null } : null,
            } : null,
        });
    }
    return tags;
}
/** Parse `git status -s --porcelain -z` into modified/deleted/untracked inventories. */
export function parseWorkingTreeStatus(text) {
    const tokens = text.split('\u0000').filter(t => t.length > 0);
    const modified = [];
    const deleted = [];
    const untracked = [];
    const conflicts = [];
    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];
        if (token === undefined)
            break;
        // In porcelain v1 -z the destination comes first; the next token is the
        // source path. Both index and worktree columns can report a rename/copy.
        const status = token.slice(0, 2);
        const path = token.slice(3);
        const consumedPath = path.length > 0;
        i += /[RC]/u.test(status) ? 2 : 1;
        if (consumedPath && path.length > 0) {
            if (['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU'].includes(status)) {
                conflicts.push(path);
                modified.push(path);
            }
            else if (status.includes('D') && !status.includes('A'))
                deleted.push(path);
            else if (status.startsWith('?'))
                untracked.push(path);
            else
                modified.push(path);
        }
    }
    const changed = modified.length > 0 || deleted.length > 0 || untracked.length > 0;
    return { changed, deleted, untracked, modified, conflicts };
}
/* ------------------------------------------------------------------ *
 * On-demand file read and commit comparison (tickets 04).
 * Paths are validated to stay repo-relative; no shell is used.
 * ------------------------------------------------------------------ */
/** Per-file content cap for `gitGraph/readFile`. */
export const FILE_MAX_BYTES = 1 * 1024 * 1024;
/**
 * Reject absolute paths, NUL bytes and path traversal outside the repository.
 * Git reports every path in its output relative to the repository root, so
 * `root` is that top level — never the session working directory, which may be
 * a subdirectory of it.
 */
export function assertRepoRelativePath(path, root) {
    if (path.length === 0)
        throw new GitGraphError('文件路径不能为空');
    if (path.includes('\u0000'))
        throw new GitGraphError('文件路径不能包含 NUL 字节');
    if (path.startsWith('/') || path.startsWith('\\'))
        throw new GitGraphError('文件路径不能是绝对路径');
    if (/^[A-Za-z]:/u.test(path))
        throw new GitGraphError('文件路径不能包含盘符');
    const parts = path.split(/[/\\]+/u);
    if (parts.includes('..'))
        throw new GitGraphError('文件路径不能包含路径穿越');
    const resolved = resolve(root, path);
    const within = relative(resolve(root), resolved);
    if (within === '..' || within.startsWith(`..${sep}`) || isAbsolute(within)) {
        throw new GitGraphError('文件路径超出工作区范围');
    }
    if (within.length === 0)
        throw new GitGraphError('文件路径不能指向工作区本身');
}
/**
 * Resolve the repository top level for a working directory that may be any
 * subdirectory of it. Every path Git prints — and every path this module uses
 * as a pathspec or file-system path — is relative to that root, while a bare
 * pathspec is resolved against the process working directory. Reading files and
 * diffs therefore run at the root, so both sides agree.
 */
export async function repositoryRoot(ctx, cwd, signal) {
    const result = await runGit(ctx, cwd, ['rev-parse', '--show-toplevel'], signal);
    const root = result.stdout.trim();
    // A worktree-less (bare) or unusual layout still resolves paths the old way.
    return root.length === 0 ? cwd : resolve(root);
}
function missingPath(error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR')
        return null;
    throw error;
}
/** Use Git's config parser for quoted paths and preserve whitespace in their values. */
async function declaredSubmodulePaths(ctx, root, signal) {
    const file = await lstat(resolve(root, '.gitmodules')).catch(missingPath);
    if (file?.isFile() !== true)
        return [];
    const result = await runGit(ctx, root, [
        'config', '--no-includes', '--file', '.gitmodules', '--null', '--get-regexp', '^submodule\\..*\\.path$',
    ], signal, [0, 1]);
    const paths = new Set();
    for (const entry of result.stdout.split('\u0000')) {
        const newline = entry.indexOf('\n');
        if (newline < 0)
            continue;
        const path = entry.slice(newline + 1);
        // Only canonical relative Git paths may be used as repository identifiers.
        if (!isRepositoryPath(path))
            continue;
        paths.add(path);
    }
    return [...paths];
}
/** Only resolved gitlinks in the current repository's own index can be selected. */
async function indexedGitlinks(ctx, root, signal, path) {
    const result = await runGit(ctx, root, ['ls-files', '--stage', '-z', '--', ...(path === undefined ? [] : [path])], signal, [0], async (handle) => {
        if (handle.stdout === undefined)
            throw new GitGraphError('Git 索引输出不可用');
        const links = [];
        let pending = '';
        for await (const chunk of handle.stdout.setEncoding('utf8')) {
            const records = (pending + chunk).split('\u0000');
            pending = records.pop() ?? '';
            if (pending.length > OUTPUT_MAX_BYTES) {
                handle.terminate();
                throw new GitOutputLimitError('单条 Git 索引记录超过读取上限');
            }
            for (const entry of records) {
                const tab = entry.indexOf('\t');
                if (tab >= 0 && /^160000 [0-9a-f]+ 0$/u.test(entry.slice(0, tab)))
                    links.push(entry.slice(tab + 1));
            }
        }
        if (pending.length !== 0)
            throw new GitGraphError('Git 索引记录不完整');
        return links;
    });
    return result.stdout;
}
function isRepositoryPath(path) {
    return !path.includes('\\') && !path.includes('\u0000') && !/^[A-Za-z]:/u.test(path)
        && !path.split('/').some(part => part === '' || part === '.' || part === '..');
}
async function submoduleRoot(ctx, root, path, signal) {
    const candidate = resolve(root, path);
    const actual = await realpath(candidate).catch(missingPath);
    // An aliased path must not redirect the browser to another working tree.
    if (actual === null || relative(candidate, actual) !== '')
        return null;
    if (!(await lstat(actual).catch(missingPath))?.isDirectory())
        return null;
    const result = await runGit(ctx, actual, ['rev-parse', '--show-toplevel'], signal, [0, 128]);
    // Git walks up from an uninitialized module directory to the superproject.
    if (result.exitCode !== 0 || relative(actual, resolve(result.stdout.trimEnd())) !== '')
        return null;
    return actual;
}
/** List direct gitlinks. An undeclared one is usable only with a local Git worktree. */
export async function loadRepositories(ctx, cwd, signal) {
    let root;
    try {
        root = await realpath(await repositoryRoot(ctx, cwd, signal));
    }
    catch (error) {
        if (isNotGitRepositoryError(error))
            return { main: null, submodules: [] };
        throw error;
    }
    const [declared, links] = await Promise.all([
        declaredSubmodulePaths(ctx, root, signal),
        indexedGitlinks(ctx, root, signal),
    ]);
    const declaredPaths = new Set(declared);
    const paths = links.filter(isRepositoryPath).sort();
    const submodules = [];
    // Bound concurrent probes and avoid walking arbitrary nested directories.
    for (let i = 0; i < paths.length; i += 8) {
        const batch = await Promise.all(paths.slice(i, i + 8).map(async (path) => {
            const available = await submoduleRoot(ctx, root, path, signal) !== null;
            return available || declaredPaths.has(path) ? { path, available } : null;
        }));
        submodules.push(...batch.filter(module => module !== null));
    }
    return { main: root, submodules };
}
/** Resolve on every read so a removed or deinitialized module cannot reuse an old target. */
export async function resolveSubmodule(ctx, cwd, path, signal) {
    const root = await realpath(await repositoryRoot(ctx, cwd, signal));
    if (isRepositoryPath(path) && (await indexedGitlinks(ctx, root, signal, path)).includes(path)) {
        const target = await submoduleRoot(ctx, root, path, signal);
        if (target !== null)
            return target;
    }
    throw new GitSubmoduleUnavailableError('所选子模块不可用，请刷新仓库列表');
}
/**
 * Reject a malformed commit hash up front (defense-in-depth). The Typert wire
 * schema already enforces a full 40-hex hash; this guard also protects any
 * direct loader call and yields a stable GitGraphError instead of a git spell.
 */
function assertValidHash(hash) {
    if (!COMMIT_HASH_PATTERN.test(hash))
        throw new GitGraphError('提交 Hash 必须为 40 或 64 位十六进制');
}
/** Read one version of a repo-relative file at a full commit hash. */
export async function loadFile(ctx, cwd, request, signal) {
    // The Typert schema already enforces a full 40-char hash.
    assertValidHash(request.hash);
    const root = await repositoryRoot(ctx, cwd, signal);
    assertRepoRelativePath(request.path, root);
    const entry = (await runGit(ctx, root, ['ls-tree', '--full-tree', '-z', request.hash, '--', request.path], signal)).stdout.split('\u0000')[0];
    const object = /^(\d+) (\S+) ([a-f0-9]+)\t/u.exec(entry ?? '');
    const oid = object?.[3];
    if (object === null || oid === undefined)
        throw new GitGraphError('所选版本没有该文件');
    if (object[1] === '160000') {
        const text = `Subproject commit ${oid}\n`;
        return { ...request, kind: 'text', text, size: Buffer.byteLength(text), truncated: false };
    }
    if (object[2] !== 'blob')
        throw new GitGraphError('所选路径不是文件');
    const sizeResult = await runGit(ctx, root, ['cat-file', '-s', oid], signal, [0, 128]);
    if (sizeResult.exitCode !== 0)
        throw new GitObjectMissingError('本地缺少文件对象，无法读取原文');
    const size = Number.parseInt(sizeResult.stdout.trim(), 10);
    if (Number.isNaN(size) || size < 0)
        throw new GitGraphError('无法读取文件大小');
    if (size > FILE_MAX_BYTES) {
        return { hash: request.hash, path: request.path, kind: 'binary', text: null, size, truncated: true };
    }
    const content = await runGit(ctx, root, ['cat-file', 'blob', oid], signal, [0], handle => readGitBytes(handle, FILE_MAX_BYTES));
    let text = null;
    if (!content.stdout.includes(0)) {
        try {
            text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(content.stdout);
        }
        catch { /* Invalid UTF-8 is binary. */ }
    }
    return { ...request, kind: text === null ? 'binary' : 'text', text, size, truncated: false };
}
/** Git knows the empty tree for either object format without writing it. */
async function emptyTree(ctx, root, signal) {
    return (await runGit(ctx, root, ['hash-object', '-t', 'tree', '--stdin'], signal)).stdout.trim();
}
async function firstParentOrEmptyTree(ctx, root, hash, signal) {
    // %P hides the boundary parent in shallow clones. Read the actual object
    // headers before deciding that this is a root commit.
    const commit = (await runGit(ctx, root, ['cat-file', 'commit', hash], signal)).stdout;
    const parent = /^parent ([a-f0-9]+)$/mu.exec(commit.split('\n\n', 1)[0] ?? '')?.[1];
    if (parent === undefined)
        return emptyTree(ctx, root, signal);
    const present = await runGit(ctx, root, ['cat-file', '-e', `${parent}^{commit}`], signal, [0, 1, 128]);
    if (present.exitCode !== 0)
        throw new GitObjectMissingError('本地缺少父提交，无法读取首父 Diff');
    return parent;
}
const INVENTORY_ARGS = ['diff', ...DIFF_OPTIONS, '--diff-filter=AMDRTU', '-z'];
async function loadChangeInventory(ctx, root, revisions, signal) {
    const [names, numbers] = await Promise.all([
        runGit(ctx, root, [...INVENTORY_ARGS, '--name-status', ...revisions, '--'], signal),
        runGit(ctx, root, [...INVENTORY_ARGS, '--numstat', ...revisions, '--'], signal),
    ]);
    return mergeFileChanges(parseDiffNameStatus(names.stdout), parseDiffNumStat(numbers.stdout));
}
function exactDiffPaths(oldPath, path) {
    const paths = [...new Set([oldPath, path])];
    // Literal pathspecs still match descendants. Exclude them explicitly when
    // one side of a rename also exists as a directory on the other side.
    return paths.flatMap(file => [`:(literal)${file}`, `:(exclude,literal)${file}/`]);
}
function patchArgs(revisions, oldPath, path) {
    return ['--no-literal-pathspecs', 'diff', ...DIFF_OPTIONS, ...PATCH_OPTIONS, ...revisions, '--', ...exactDiffPaths(oldPath, path)];
}
const HUNK_HEAD_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/u;
/** Parse a `git diff` hunk header like `@@ -a,b +c,d @@` into base/new heads. */
export function parseHunkHeader(line) {
    const match = HUNK_HEAD_RE.exec(line);
    if (match === null)
        return null;
    return {
        oldStart: Number.parseInt(match[1] ?? '1', 10),
        newStart: Number.parseInt(match[3] ?? '1', 10),
    };
}
/**
 * Parse the unified text of ONE file diff (`git diff --unified=<n> <base> <new>
 * -- <path>`, where the output is guaranteed to describe a single file) into
 * line records. Old/new line numbers track the two heads so the renderer can
 * show line numbers exactly like vscode-git-graph.
 */
export function parseFileDiff(text) {
    const hunks = [];
    let oldNo = 0;
    let newNo = 0;
    let lines;
    for (const rawLine of text.split(/\r?\n/u)) {
        if (rawLine.length === 0)
            continue;
        const head = parseHunkHeader(rawLine);
        if (head !== null) {
            lines = [];
            hunks.push({ header: rawLine, lines });
            oldNo = head.oldStart;
            newNo = head.newStart;
            continue;
        }
        if (rawLine.startsWith('diff --git '))
            lines = undefined;
        if (lines === undefined)
            continue;
        const marker = rawLine[0];
        if (marker === '+') {
            lines.push({ type: 'added', content: rawLine.slice(1), oldLine: null, newLine: newNo });
            newNo += 1;
        }
        else if (marker === '-') {
            lines.push({ type: 'removed', content: rawLine.slice(1), oldLine: oldNo, newLine: null });
            oldNo += 1;
        }
        else if (marker === ' ') {
            lines.push({ type: 'context', content: rawLine.slice(1), oldLine: oldNo, newLine: newNo });
            oldNo += 1;
            newNo += 1;
        }
        // Any other line (`diff --git`, `index`, `old mode`, `\ No newline`, …)
        // is a patch header and is skipped, never treated as context content.
    }
    return hunks;
}
function diffContent(patch) {
    const hunks = parseFileDiff(patch);
    const lines = hunks.flatMap(hunk => hunk.lines);
    return { hunks, binary: /^Binary files /mu.test(patch),
        additions: lines.filter(line => line.type === 'added').length,
        deletions: lines.filter(line => line.type === 'removed').length };
}
/**
 * Load one file's diff using the same range as its enclosing file list. An
 * explicit base compares both selected commits; otherwise use the target's
 * first parent (empty tree for a root commit).
 */
export async function loadFileDiff(ctx, cwd, request, signal) {
    assertValidHash(request.hash);
    // Paths in the file list are repository-root-relative, so they are resolved
    // (and read) at the top level rather than at the session working directory.
    const root = await repositoryRoot(ctx, cwd, signal);
    assertRepoRelativePath(request.path, root);
    if (request.baseHash !== undefined)
        assertValidHash(request.baseHash);
    const base = request.baseHash ?? await firstParentOrEmptyTree(ctx, root, request.hash, signal);
    const names = await runGit(ctx, root, [...INVENTORY_ARGS, '--name-status', base, request.hash, '--'], signal);
    const changes = parseDiffNameStatus(names.stdout);
    const change = changes.find(file => file.newPath === request.path) ?? changes.find(file => file.oldPath === request.path);
    if (change === undefined)
        throw new GitGraphError(`文件在所选比较范围内不存在或没有变更：${request.path}`);
    const diff = await runGit(ctx, root, patchArgs([base, request.hash], change.oldPath, change.newPath), signal);
    return {
        hash: request.hash,
        path: change.newPath,
        oldPath: change.oldPath,
        status: change.type,
        ...diffContent(diff.stdout),
    };
}
/** The sentinel hash used for the non-committed working-tree side of a diff. */
export const WORKTREE_HASH = 'WORKTREE';
/** Read the comparison base and status once for the inventory and each file read. */
async function workingTreeInventory(ctx, root, signal, countLines) {
    const [head, porcelain] = await Promise.all([
        runGit(ctx, root, ['rev-parse', '--verify', 'HEAD'], signal, [0, 1, 128]),
        runGit(ctx, root, ['status', '--porcelain=v1', '--untracked-files=all', '-z'], signal),
    ]);
    const base = head.exitCode === 0 ? head.stdout.trim() : await emptyTree(ctx, root, signal);
    const status = parseWorkingTreeStatus(porcelain.stdout);
    const tracked = countLines
        ? await loadChangeInventory(ctx, root, [base], signal)
        : parseDiffNameStatus((await runGit(ctx, root, [...INVENTORY_ARGS, '--name-status', base, '--'], signal)).stdout)
            .map(change => ({ ...change, additions: null, deletions: null }));
    const changes = new Map(tracked.map(change => [change.newPath, change]));
    const recreated = new Set();
    for (const path of status.untracked) {
        if (changes.get(path)?.type === 'D')
            recreated.add(path);
        changes.set(path, { type: recreated.has(path) ? 'M' : 'A', oldPath: path, newPath: path, additions: null, deletions: null });
    }
    for (const path of status.conflicts) {
        const change = changes.get(path);
        changes.set(path, { oldPath: path, newPath: path, additions: null, deletions: null, ...change, type: 'U' });
    }
    return { base, changes, untracked: new Set(status.untracked), recreated };
}
export async function loadWorkingTreeChanges(ctx, cwd, signal) {
    const root = await repositoryRoot(ctx, cwd, signal);
    const { changes } = await workingTreeInventory(ctx, root, signal, true);
    return { changes: [...changes.values()] };
}
async function diffUntracked(ctx, root, path, base, signal) {
    const args = ['diff', '--no-index', ...DIFF_OPTIONS, ...PATCH_OPTIONS, '--'];
    const target = resolve(root, path);
    if (base === undefined)
        return (await runGit(ctx, root, [...args, '/dev/null', target], signal, [0, 1])).stdout;
    // The recreated file is outside the index. Compare it with the previous
    // blob using a temporary file, leaving the working tree and index untouched.
    const old = (await runGit(ctx, root, ['cat-file', 'blob', `${base}:${path}`], signal, [0], handle => readGitBytes(handle, OUTPUT_MAX_BYTES))).stdout;
    const dir = await mkdtemp(resolve(tmpdir(), 'dsh-git-diff-'));
    const file = resolve(dir, 'base');
    try {
        await writeFile(file, old);
        return (await runGit(ctx, root, [...args, file, target], signal, [0, 1])).stdout;
    }
    finally {
        await unlink(file).catch(error => { missingPath(error); });
        await rmdir(dir);
    }
}
/**
 * Diff one file in the working tree against HEAD (or the empty tree for an
 * untracked file). This is the working-tree counterpart of `loadFileDiff` and
 * drives the per-file diff view for uncommitted changes.
 */
export async function loadWorkingTreeFile(ctx, cwd, request, signal) {
    // The path came from the change inventory, which Git reports relative to the
    // repository root; a pathspec, by contrast, is resolved against the process
    // working directory. Resolve both at the root so a session that runs in a
    // subdirectory still matches its own files.
    const root = await repositoryRoot(ctx, cwd, signal);
    assertRepoRelativePath(request.path, root);
    const { base, changes, untracked, recreated } = await workingTreeInventory(ctx, root, signal, false);
    const change = changes.get(request.path) ?? [...changes.values()].find(file => file.oldPath === request.path);
    if (change === undefined)
        throw new GitGraphError(`文件在工作区不存在或没有变更：${request.path}`);
    const patch = untracked.has(change.newPath)
        ? await diffUntracked(ctx, root, change.newPath, recreated.has(change.newPath) ? base : undefined, signal)
        : (await runGit(ctx, root, patchArgs([base], change.oldPath, change.newPath), signal)).stdout;
    return {
        hash: WORKTREE_HASH,
        path: change.newPath,
        oldPath: change.oldPath,
        status: change.type,
        ...diffContent(patch),
    };
}
/** Compare two commits (left → right) and return file status/line counts. */
export async function loadCompare(ctx, cwd, request, signal) {
    assertValidHash(request.baseHash);
    assertValidHash(request.targetHash);
    return {
        baseHash: request.baseHash,
        targetHash: request.targetHash,
        changes: await loadChangeInventory(ctx, cwd, [request.baseHash, request.targetHash], signal),
    };
}
/** Load repository-level metadata (tags + stashes) for the on-demand view. */
export async function loadMetadata(ctx, cwd, signal) {
    const [tags, stashes] = await Promise.all([
        loadTags(ctx, cwd, signal),
        loadStashes(ctx, cwd, signal),
    ]);
    return { tags, stashes };
}
/** Resolve identity from Git, never from an email or URL supplied by the browser. */
export async function loadAvatarAuthors(ctx, cwd, hashes, signal) {
    if (hashes.length === 0 || hashes.length > MAX_AVATAR_BATCH)
        throw new GitGraphError('头像请求数量超出范围');
    for (const hash of hashes)
        assertValidHash(hash);
    const [log, remote] = await Promise.all([
        runGit(ctx, cwd, ['log', '-z', '--no-walk=unsorted', '--format=%aE%x00%ae', ...hashes, '--'], signal),
        runGit(ctx, cwd, ['config', '--null', '--get-regexp', '^remote\\..*\\.url$'], signal, [0, 1]),
    ]);
    const authors = [...gitRecords(log.stdout, 2)].map(([email, sourceEmail]) => {
        if (email === undefined || sourceEmail === undefined)
            throw new GitGraphError('Git 头像作者字段不完整');
        return { email: email.trim(), sourceEmail: sourceEmail.trim() };
    });
    const remotes = remote.stdout.split('\u0000').filter(Boolean);
    const preferred = remotes.find(record => record.startsWith('remote.origin.url\n')) ?? (remotes.length === 1 ? remotes[0] : undefined);
    return { authors, remote: preferred?.slice(preferred.indexOf('\n') + 1).trim() ?? null };
}
