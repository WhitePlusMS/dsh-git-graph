/**
 * Host-side Git adapter. The only process seam is ctx.subprocess; no shell
 * interpolation is used, so a repository path never becomes command text.
 */
import { resolve } from 'node:path';
import { MAX_COMMITS } from './domain.js';
const LOG_FORMAT = '%H%x00%P%x00%an%x00%ae%x00%aI%x00%s%x00%D%x00%x1e';
const OUTPUT_MAX_BYTES = 8 * 1024 * 1024;
const STDERR_MAX_BYTES = 64 * 1024;
const GRACE_MS = 3_000;
/** Upper bound for full-range commit scanning when a search is active. */
const SEARCH_CAP = MAX_COMMITS * 4;
/** A stable error type for all Git acquisition failures. */
export class GitGraphError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = 'GitGraphError';
    }
}
function outputOf(handle, stream) {
    const reader = handle.collected[stream];
    if (reader === undefined)
        throw new GitGraphError(`git ${stream} output was not collected`);
    const result = reader.readFrom(0);
    if (result.lossy)
        throw new GitGraphError(`git ${stream} output exceeded the capture limit`);
    return result.text;
}
async function runGit(ctx, cwd, args, signal, allowedExitCodes = [0]) {
    let handle;
    try {
        const spec = {
            argv: ['git', ...args],
            cwd,
            stdio: {
                stdin: 'ignore',
                stdout: { maxBytes: OUTPUT_MAX_BYTES },
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
    try {
        outcome = await handle.done;
    }
    catch (error) {
        throw new GitGraphError(`Git 进程启动失败：${String(error)}`, { cause: error });
    }
    if (signal.aborted)
        throw new GitGraphError('Git 图谱请求已取消');
    const stdout = outputOf(handle, 'stdout');
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
function parseRefs(decorations) {
    const refs = [];
    for (const raw of decorations.split(',').map(item => item.trim()).filter(item => item.length > 0)) {
        if (raw.startsWith('HEAD -> ')) {
            refs.push({ kind: 'head', name: raw.slice('HEAD -> '.length) });
            continue;
        }
        if (raw === 'HEAD') {
            refs.push({ kind: 'head', name: 'HEAD' });
            continue;
        }
        if (raw.startsWith('tag: ')) {
            refs.push({ kind: 'tag', name: raw.slice('tag: '.length) });
            continue;
        }
        if (raw.startsWith('remotes/')) {
            refs.push({ kind: 'remote', name: raw.slice('remotes/'.length) });
            continue;
        }
        if (raw.includes('/')) {
            refs.push({ kind: 'remote', name: raw });
            continue;
        }
        refs.push({ kind: 'head', name: raw });
    }
    return refs;
}
/** Parse the NUL/record-separated log format independently of the process seam. */
export function parseGitLog(text) {
    const commits = [];
    for (const rawRecord of text.split('\u001e')) {
        // `git log --format` inserts a line break between formatted records. After
        // splitting on RS, that separator prefixes every record except the first;
        // leaving it attached to the hash breaks exact parent-hash lookup.
        const record = rawRecord.replace(/^[\r\n]+/u, '');
        if (record.trim().length === 0)
            continue;
        const fields = record.split('\u0000');
        if (fields.length < 7)
            throw new GitGraphError('Git log 输出格式不完整');
        const hash = fields[0];
        const parents = fields[1];
        const author = fields[2];
        const email = fields[3];
        const date = fields[4];
        const subject = fields[5];
        const decorations = fields[6];
        if (hash === undefined || parents === undefined || author === undefined || email === undefined
            || date === undefined || subject === undefined || decorations === undefined || hash.length === 0) {
            throw new GitGraphError('Git log 输出包含空提交记录');
        }
        const refs = parseRefs(decorations);
        commits.push({
            hash,
            parents: parents.length === 0 ? [] : parents.split(' '),
            author,
            email,
            date,
            subject,
            refs,
            isHead: refs.some(ref => ref.kind === 'head' && (ref.name === 'HEAD' || ref.name.length > 0)),
        });
    }
    return commits;
}
/** Parse `git status --porcelain=v1 -b` without interpreting file contents. */
export function parseGitStatus(text) {
    const lines = text.split(/\r?\n/u).filter(line => line.length > 0);
    const header = lines[0]?.startsWith('## ') === true ? lines[0].slice(3) : '';
    const rawBranch = header.split('...')[0]?.trim() ?? '';
    const branch = rawBranch.length === 0 || rawBranch === 'HEAD' || rawBranch.startsWith('HEAD (') || rawBranch.startsWith('No commits yet')
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
    const search = (input.search ?? '').trim();
    return {
        ...input,
        maxCommits,
        all: input.all ?? true,
        firstParent: input.firstParent ?? false,
        sort,
        glob,
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
        ...commit.refs.map(ref => ref.name),
    ].join('\n').toLocaleLowerCase();
    return haystack.includes(needle);
}
/**
 * Match a short branch name against a git-style glob. Follows git's rules:
 * `*` matches any run, `?` one character, `[abc]` a class, and a pattern with
 * no magic characters is treated as a prefix (implicit trailing `*`). Matching
 * is case-sensitive.
 */
export function branchNameMatches(name, pattern) {
    const magic = /[*?[]/u;
    const source = magic.test(pattern) ? pattern : `${pattern}*`;
    const regex = new RegExp(`^${globToRegexSource(source)}$`, 'u');
    return regex.test(name);
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}
function globToRegexSource(glob) {
    let out = '';
    for (let i = 0; i < glob.length; i += 1) {
        const char = glob[i];
        if (char === undefined)
            break;
        if (char === '*')
            out += '.*';
        else if (char === '?')
            out += '.';
        else if (char === '[') {
            // Copy the character class verbatim (git supports ranges/caret negations).
            const close = glob.indexOf(']', i + 1);
            if (close === -1) {
                out += '\\[';
                continue;
            }
            out += glob.slice(i, close + 1);
            i = close;
        }
        else {
            out += escapeRegExp(char);
        }
    }
    return out;
}
/** Enumerate short local branch names (`refs/heads/*`). */
async function listBranches(ctx, cwd, signal) {
    const result = await runGit(ctx, cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads'], signal);
    return result.stdout.split(/\r?\n/u).filter(name => name.length > 0);
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
        workingTree: {
            changed: false,
            summary: '不是 Git 仓库',
        },
        commits: [],
        hasMore: false,
    };
}
/** Load the bounded graph snapshot used by the model result and Client renderer. */
export async function loadGitGraph(ctx, input, exec) {
    const validated = validateInput(input);
    const cwd = workingDirectory(validated, exec);
    let status;
    try {
        status = await runGit(ctx, cwd, ['status', '--porcelain=v1', '-b'], exec.signal);
    }
    catch (error) {
        if (isNotGitRepositoryError(error))
            return nonGitRepositorySnapshot(cwd);
        throw error;
    }
    const statusInfo = parseGitStatus(status.stdout);
    // `rev-parse --verify HEAD` on a fresh repo (no commits yet) exits 128, so a
    // missing HEAD is treated as an empty repository, not a query failure.
    const headResult = await runGit(ctx, cwd, ['rev-parse', '--verify', 'HEAD'], exec.signal, [0, 1, 128]);
    const headText = headResult.exitCode === 0 ? headResult.stdout.trim() : '';
    const head = headText.length > 0 ? headText : null;
    const orderFlag = validated.sort === 'author-date' ? '--author-date-order'
        : validated.sort === 'topological' ? '--topo-order'
            : '--date-order';
    // Branch-name glob filters select exact branches (OR across globs) by
    // resolving `refs/heads/*` and passing matched refs as fixed rev arguments.
    // Without globs we fall back to `--all` (all refs) or HEAD only when
    // `all=false`.
    const selectedBranches = validated.glob.length > 0
        ? (await listBranches(ctx, cwd, exec.signal)).filter(name => validated.glob.some(glob => branchNameMatches(name, glob)))
        : [];
    const refArgs = validated.glob.length > 0
        ? selectedBranches
        : validated.all ? ['--all'] : [];
    // A glob that matches no branch yields an empty graph rather than falling
    // back to HEAD history. The repository itself may still be non-empty.
    if (validated.glob.length > 0 && selectedBranches.length === 0) {
        return {
            path: cwd,
            state: head === null ? 'empty' : 'ready',
            branch: statusInfo.branch,
            head,
            workingTree: {
                changed: statusInfo.changed,
                summary: statusInfo.summary,
            },
            commits: [],
            hasMore: false,
        };
    }
    // Search scans the full query range (bounded by a capture cap) so results are
    // not wrongly limited to the first page; paging is applied to matches.
    const cap = validated.search.length > 0 ? SEARCH_CAP : validated.maxCommits + 1;
    const logArgs = [
        'log',
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
    const isHead = head === null ? (_commit) => false : (commit) => commit.hash === head;
    const allCommits = parsed.map(commit => isHead(commit) ? { ...commit, isHead: true } : commit);
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
        workingTree: {
            changed: statusInfo.changed,
            summary: statusInfo.summary,
        },
        commits,
        hasMore,
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
    '%x1e', // record separator
].join('%x00');
const DETAILS_FIELD_COUNT = 12;
const GIT_LOG_SEPARATOR = 'XX7Nal-YARtTpjCikii9nJxER19D6diSyk-AWkPb';
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
    for (const rawRecord of text.split('\u001e')) {
        const record = rawRecord.replace(/^[\r\n]+/u, '');
        if (record.trim().length === 0)
            continue;
        return parseCommitDetailsRecord(record);
    }
    throw new GitGraphError('Git commit details 输出为空');
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
    // git numstat separates records with NUL; fields with TAB. For renames with -z,
    // the format is "<add>\t<del>\t<oldPath>\t<newPath>" separated by NUL.
    const records = text.split('\u0000').filter(t => t.length > 0);
    const map = new Map();
    for (const record of records) {
        const fields = record.split('\t');
        if (fields.length < 3)
            continue;
        const additionsText = fields[0];
        const deletionsText = fields[1];
        const lastPath = fields[fields.length - 1];
        if (lastPath === undefined)
            continue;
        const additions = additionsText === '-' || additionsText === undefined ? null : Number.parseInt(additionsText, 10);
        const deletions = deletionsText === '-' || deletionsText === undefined ? null : Number.parseInt(deletionsText, 10);
        const add = Number.isNaN(additions ?? NaN) ? null : additions;
        const del = Number.isNaN(deletions ?? NaN) ? null : deletions;
        map.set(lastPath, { additions: add, deletions: del });
    }
    return map;
}
/** Merge name-status and numstat into file changes (reusing vscode semantics). */
export function mergeFileChanges(nameStatus, numStat) {
    return nameStatus.map(entry => {
        const stat = numStat.get(entry.newPath);
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
    const show = await runGit(ctx, cwd, ['-c', 'log.showSignature=false', 'show', '--quiet', hash, `--format=${DETAILS_FORMAT}`], signal);
    const details = parseCommitDetails(show.stdout);
    // `git diff-tree <commit>` already compares the commit against its first
    // parent (and, with --root, an empty tree for a root commit). Passing the
    // commit hash directly yields exactly the changes this commit introduced.
    const fromCommit = hash;
    const baseArgs = ['-c', 'log.showSignature=false'];
    // --no-commit-id suppresses the leading <commit> line that plain diff -z emits.
    const nameArgs = [...baseArgs, 'diff-tree', '--name-status', '-r', '--root', '--no-commit-id', '--find-renames', '--diff-filter=AMDR', '-z', fromCommit];
    const numArgs = [...baseArgs, 'diff-tree', '--numstat', '-r', '--root', '--no-commit-id', '--find-renames', '--diff-filter=AMDR', '-z', fromCommit];
    const [nameResult, numResult] = await Promise.all([
        runGit(ctx, cwd, nameArgs, signal),
        runGit(ctx, cwd, numArgs, signal),
    ]);
    const nameEntries = parseDiffNameStatus(nameResult.stdout);
    const numMap = parseDiffNumStat(numResult.stdout);
    return { ...details, fileChanges: mergeFileChanges(nameEntries, numMap) };
}
/** Parse `git reflog refs/stash --format=<fmt>` into stash entries. */
export function parseStashReflog(text) {
    const stashes = [];
    for (const rawRecord of text.split('\u001e')) {
        const record = rawRecord.replace(/^[\r\n]+/u, '');
        if (record.trim().length === 0)
            continue;
        const fields = record.split('\u0000');
        if (fields.length < 6)
            throw new GitGraphError('Git stash reflog 输出格式不完整');
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
    const stashFormat = ['%H', '%P', '%gD', '%aN', '%aE', '%aI', '%s', '%x1e'].join('%x00');
    // When no stash exists, `git reflog refs/stash` exits 128 ("bad revision").
    // Those exit codes mean "no stashes", not a query failure.
    const result = await runGit(ctx, cwd, ['reflog', `--format=${stashFormat}`, 'refs/stash', '--'], signal, [0, 1, 128]);
    if (result.exitCode !== 0 && result.stdout.trim().length === 0)
        return [];
    return parseStashReflog(result.stdout);
}
/** Parse `git for-each-ref refs/tags` lines into (name, object, annotated) triples. */
export function parseForEachRefTags(text) {
    const tags = [];
    for (const line of text.split(/\r?\n/u)) {
        if (line.length === 0)
            continue;
        // Format: <objectname>\t<refname>\t<objecttype>. An annotated tag has
        // objecttype "tag"; a lightweight tag points straight at a "commit".
        const parts = line.split('\t');
        if (parts.length < 3)
            continue;
        const object = parts[0] ?? '';
        const ref = parts[1] ?? '';
        const objectType = parts[2] ?? '';
        const match = /^refs\/tags\/(.+)$/u.exec(ref);
        if (match === null)
            continue;
        tags.push({ name: match[1] ?? '', object, annotated: objectType === 'tag' });
    }
    return tags;
}
/** Parse `git for-each-ref refs/tags/<name>` annotated-tag detail record. */
export function parseAnnotatedTagDetail(text) {
    const fields = text.split(GIT_LOG_SEPARATOR);
    if (fields.length < 5)
        throw new GitGraphError('Git annotated tag 详情输出格式不完整');
    const objectHash = fields[0];
    const tagger = fields[1];
    const taggerEmail = fields[2];
    const taggerDate = fields[3];
    const sigStatus = fields[4];
    const contents = fields.slice(5).join(GIT_LOG_SEPARATOR);
    if (objectHash === undefined || objectHash.length === 0)
        throw new GitGraphError('Git annotated tag 详情包含空字段');
    const message = (contents ?? '').replace(/\s+$/u, '');
    return {
        objectHash,
        tagger: (tagger ?? '').trim(),
        taggerEmail: (taggerEmail ?? '').trim(),
        taggerDate: taggerDate ?? '',
        message,
        signature: sigStatus !== undefined && sigStatus.trim().length > 0
            ? { status: 'G', key: sigStatus.trim() || null, signer: null }
            : null,
    };
}
/** Load tag refs (name + object + annotated flag) and annotated-tag details. */
export async function loadTags(ctx, cwd, signal) {
    const listFormat = ['%(objectname)', '%(refname)', '%(objecttype)'].join('\t');
    const list = await runGit(ctx, cwd, ['for-each-ref', 'refs/tags', `--format=${listFormat}`], signal);
    const entries = parseForEachRefTags(list.stdout);
    const tags = [];
    for (const entry of entries) {
        if (!entry.annotated) {
            tags.push({ name: entry.name, annotated: false, detail: null });
            continue;
        }
        const detailFields = ['%(objectname)', '%(taggername)', '%(taggeremail)', '%(taggerdate:iso-strict)', '%(contents:signature)', '%(contents)'];
        const detailFormat = detailFields.join(GIT_LOG_SEPARATOR);
        const detailResult = await runGit(ctx, cwd, ['for-each-ref', `refs/tags/${entry.name}`, `--format=${detailFormat}`], signal);
        tags.push({
            name: entry.name,
            annotated: true,
            detail: parseAnnotatedTagDetail(detailResult.stdout),
        });
    }
    return tags;
}
/** Parse `git config --list -z --includes [--local|--global]` into key/value pairs. */
export function parseConfigList(text) {
    const map = new Map();
    // --null terminates each key with a newline and each value with NUL, so each
    // NUL token is "<key>\n<value>" (value may itself be multi-line). Accept LF or
    // CRLF separators to stay robust across git versions/platforms.
    for (const pair of text.split('\u0000')) {
        if (pair.length === 0)
            continue;
        const match = /^(.*?)(?:\r?\n)([\s\S]*)$/u.exec(pair);
        if (match === null)
            continue;
        const key = match[1] ?? '';
        const value = (match[2] ?? '').replace(/\r$/u, '');
        map.set(key, value);
    }
    return map;
}
/** Load consolidated/local/global config lists and build the read-only repo config. */
export async function loadRepoConfig(ctx, cwd, remotes, signal) {
    const [consolidated, local, global] = await Promise.all([
        runGit(ctx, cwd, ['--no-pager', 'config', '--list', '-z', '--includes'], signal),
        runGit(ctx, cwd, ['--no-pager', 'config', '--list', '-z', '--includes', '--local'], signal),
        runGit(ctx, cwd, ['--no-pager', 'config', '--list', '-z', '--includes', '--global'], signal),
    ]);
    const consolidatedMap = parseConfigList(consolidated.stdout);
    const localMap = parseConfigList(local.stdout);
    const globalMap = parseConfigList(global.stdout);
    const branches = {};
    for (const key of localMap.keys()) {
        const remoteMatch = /^branch\.(.+)\.remote$/u.exec(key);
        const pushMatch = /^branch\.(.+)\.pushremote$/u.exec(key);
        if (remoteMatch !== null) {
            const name = remoteMatch[1];
            branches[name] = { ...(branches[name] ?? { remote: null, pushRemote: null }), remote: localMap.get(key) ?? null };
        }
        else if (pushMatch !== null) {
            const name = pushMatch[1];
            branches[name] = { ...(branches[name] ?? { remote: null, pushRemote: null }), pushRemote: localMap.get(key) ?? null };
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
    };
}
/** Parse `git status -s --porcelain -z` into modified/deleted/untracked inventories. */
export function parseWorkingTreeStatus(text) {
    const tokens = text.split('\u0000').filter(t => t.length > 0);
    const modified = [];
    const deleted = [];
    const untracked = [];
    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];
        if (token === undefined)
            break;
        // Porcelain v1 -z format is "XY<SP>path": two status columns, a space,
        // then the path. Rename/copy entries ("R  <old>") list the new path as the
        // following NUL token, so advance i past it.
        const status = token.slice(0, 2);
        let path = token.slice(3);
        let consumedPath = path.length > 0;
        if (/^[RC]/u.test(status)) {
            const newPath = tokens[i + 1];
            if (newPath !== undefined && consumedPath) {
                path = newPath;
                i += 2;
                consumedPath = true;
            }
            else {
                i += 1;
            }
            if (!consumedPath)
                i += 1;
        }
        else {
            i += 1;
        }
        if (consumedPath && path.length > 0) {
            if (status.includes('D') && !status.includes('A'))
                deleted.push(path);
            else if (status.startsWith('?'))
                untracked.push(path);
            else
                modified.push(path);
        }
    }
    const changed = modified.length > 0 || deleted.length > 0 || untracked.length > 0;
    return { changed, deleted, untracked, modified };
}
/** Load the working-tree change inventory. */
export async function loadWorkingTree(ctx, cwd, includeUntracked, signal) {
    const untracked = includeUntracked ? 'all' : 'no';
    const result = await runGit(ctx, cwd, ['status', '-s', `--untracked-files=${untracked}`, '--porcelain', '-z'], signal);
    return parseWorkingTreeStatus(result.stdout);
}
/* ------------------------------------------------------------------ *
 * On-demand file read and commit comparison (tickets 04).
 * Paths are validated to stay repo-relative; no shell is used.
 * ------------------------------------------------------------------ */
/** Per-file content cap for `gitGraph/readFile`. */
export const FILE_MAX_BYTES = 1 * 1024 * 1024;
/** Reject absolute paths, NUL bytes and path traversal outside the workspace. */
export function assertRepoRelativePath(path, cwd) {
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
    const resolved = resolve(cwd, path);
    if (resolved !== cwd && !resolved.startsWith(`${cwd}${resolved.length > cwd.length ? '\\' : ''}`)) {
        throw new GitGraphError('文件路径超出工作区范围');
    }
    if (resolved === cwd)
        throw new GitGraphError('文件路径不能指向工作区本身');
}
/**
 * Reject a malformed commit hash up front (defense-in-depth). The Typert wire
 * schema already enforces a full 40-hex hash; this guard also protects any
 * direct loader call and yields a stable GitGraphError instead of a git spell.
 */
function assertValidHash(hash) {
    if (!/^[0-9a-f]{40}$/u.test(hash))
        throw new GitGraphError('提交 Hash 必须为 40 位十六进制');
}
/** Detect whether decoded blob text looks like text rather than binary data. */
function isTextContent(text) {
    // A NUL or replacement character indicates binary bytes were decoded.
    return !text.includes('\u0000') && !text.includes('\uFFFD');
}
/** Read one version of a repo-relative file at a full commit hash. */
export async function loadFile(ctx, cwd, request, signal) {
    // The Typert schema already enforces a full 40-char hash.
    assertValidHash(request.hash);
    assertRepoRelativePath(request.path, cwd);
    const specifier = `${request.hash}:${request.path}`;
    const sizeResult = await runGit(ctx, cwd, ['cat-file', '-s', specifier], signal);
    const size = Number.parseInt(sizeResult.stdout.trim(), 10);
    if (Number.isNaN(size) || size < 0)
        throw new GitGraphError('无法读取文件大小');
    if (size > FILE_MAX_BYTES) {
        return { hash: request.hash, path: request.path, kind: 'binary', text: null, size, truncated: true };
    }
    const content = await runGit(ctx, cwd, ['cat-file', 'blob', specifier], signal);
    const text = content.stdout;
    return {
        hash: request.hash,
        path: request.path,
        kind: isTextContent(text) ? 'text' : 'binary',
        text: isTextContent(text) ? text : null,
        size,
        truncated: false,
    };
}
/** The empty-tree object Git uses as a synthetic root-parent base. */
const EMPTY_TREE_HASH = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
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
    const lines = [];
    let oldNo = 0;
    let newNo = 0;
    for (const rawLine of text.split(/\r?\n/u)) {
        if (rawLine.length === 0)
            continue;
        const head = parseHunkHeader(rawLine);
        if (head !== null) {
            oldNo = head.oldStart;
            newNo = head.newStart;
            continue;
        }
        if (rawLine.startsWith('+++') || rawLine.startsWith('---'))
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
    return lines;
}
/**
 * Load the added/deleted line diff of one file inside a commit, rendered like
 * vscode-git-graph. The base is the commit's first parent (empty tree for the
 * root commit), matching `loadCommitDetails`'s comparison base.
 */
export async function loadFileDiff(ctx, cwd, request, signal) {
    assertValidHash(request.hash);
    assertRepoRelativePath(request.path, cwd);
    // Resolve the base revision: first parent, or the empty tree for a root
    // commit (a root commit has nothing to compare against except nothing).
    const parentResult = await runGit(ctx, cwd, ['rev-list', '--parents', '-n', '1', request.hash], signal);
    const fields = parentResult.stdout.trim().split(/\s+/u);
    const base = fields.length > 1 ? fields[1] : EMPTY_TREE_HASH;
    let diff;
    try {
        diff = await runGit(ctx, cwd, ['-c', 'log.showSignature=false', 'diff', '--no-color', '--no-ext-diff', '--unified=3', base, request.hash, '--', request.path], signal);
    }
    catch (error) {
        if (error instanceof GitGraphError && /no such file|does not exist|did not match any files?/iu.test(error.message)) {
            throw new GitGraphError(`文件在提交中不存在：${request.path}`, { cause: error });
        }
        throw error;
    }
    const numResult = await runGit(ctx, cwd, ['diff', '--numstat', base, request.hash, '--', request.path], signal);
    const numFields = numResult.stdout.trim().split(/\s+/u);
    const additions = Number.parseInt(numFields[0] ?? '0', 10);
    const deletions = Number.parseInt(numFields[1] ?? '0', 10);
    // Determine an observed status from the numstat shape: an absent added line
    // count with a present deletions side means a pure deletion; a binary
    // `-`-marked numstat also renders as a no-context change below.
    const status = additions > 0 && deletions === 0 ? 'A' : additions === 0 && deletions > 0 ? 'D' : 'M';
    return {
        hash: request.hash,
        path: request.path,
        oldPath: request.path,
        status: status,
        additions: Number.isNaN(additions) ? 0 : additions,
        deletions: Number.isNaN(deletions) ? 0 : deletions,
        lines: parseFileDiff(diff.stdout),
    };
}
/** The sentinel hash used for the non-committed working-tree side of a diff. */
export const WORKTREE_HASH = 'WORKTREE';
/**
 * The set of files with uncommitted changes relative to HEAD (or to the empty
 * tree in a repository with no commits yet). Tracked modifications come from
 * `git diff HEAD`; untracked files are listed separately as additions. Binary
 * or truncated diffs keep `additions`/`deletions` as `null`.
 */
export async function loadWorkingTreeChanges(ctx, cwd, signal) {
    const tracked = [];
    const headResult = await runGit(ctx, cwd, ['rev-parse', '--verify', 'HEAD'], signal, [0, 1, 128]);
    const hasHead = headResult.exitCode === 0 && headResult.stdout.trim().length > 0;
    // In a no-HEAD repository the status inventory is all we can diff against an
    // empty tree; tracked diffs are then driven purely from `git status`.
    if (hasHead) {
        const common = ['-c', 'log.showSignature=false', 'diff', 'HEAD', '--no-commit-id', '--find-renames', '--diff-filter=AMDR', '-z'];
        const [nameResult, numResult] = await Promise.all([
            runGit(ctx, cwd, [...common, '--name-status'], signal),
            runGit(ctx, cwd, [...common, '--numstat'], signal),
        ]);
        tracked.push(...mergeFileChanges(parseDiffNameStatus(nameResult.stdout), parseDiffNumStat(numResult.stdout)));
    }
    const statusResult = await runGit(ctx, cwd, ['status', '--porcelain', '--untracked-files=all', '-z'], signal);
    const { untracked } = parseWorkingTreeStatus(statusResult.stdout);
    const changes = [
        ...tracked,
        ...untracked.map(path => ({ type: 'A', oldPath: path, newPath: path, additions: null, deletions: null })),
    ];
    return { changes };
}
/**
 * Diff one file in the working tree against HEAD (or the empty tree for an
 * untracked file). This is the working-tree counterpart of `loadFileDiff` and
 * drives the per-file diff view for uncommitted changes.
 */
export async function loadWorkingTreeFile(ctx, cwd, request, signal) {
    assertRepoRelativePath(request.path, cwd);
    const statusResult = await runGit(ctx, cwd, ['status', '--porcelain', '--untracked-files=all', '-z'], signal);
    const { untracked } = parseWorkingTreeStatus(statusResult.stdout);
    const isUntracked = untracked.includes(request.path);
    let diff;
    let additions = 0;
    let deletions = 0;
    let status = isUntracked ? 'A' : 'M';
    if (isUntracked) {
        // An untracked file has no HEAD side; diff it against the empty side.
        // `--no-index` uses the unified long form and exits 1 when differences exist.
        const absolute = resolve(cwd, request.path);
        diff = await runGit(ctx, cwd, ['diff', '--no-index', '--no-color', '--no-ext-diff', '--unified=3', '/dev/null', absolute], signal, [0, 1]);
        additions = diff.stdout.split(/\r?\n/u).filter(line => line.startsWith('+') && !line.startsWith('+++')).length;
    }
    else {
        diff = await runGit(ctx, cwd, ['-c', 'log.showSignature=false', 'diff', '--no-color', '--no-ext-diff', '--unified=3', 'HEAD', '--', request.path], signal, [0, 1, 128]);
        const numResult = await runGit(ctx, cwd, ['diff', '--numstat', 'HEAD', '--', request.path], signal, [0, 1, 128]);
        const numFields = numResult.stdout.trim().split(/\s+/u);
        const add = Number.parseInt(numFields[0] ?? '0', 10);
        const del = Number.parseInt(numFields[1] ?? '0', 10);
        additions = Number.isNaN(add) ? 0 : add;
        deletions = Number.isNaN(del) ? 0 : del;
        status = additions > 0 && deletions === 0 ? 'A' : additions === 0 && deletions > 0 ? 'D' : 'M';
    }
    return {
        hash: WORKTREE_HASH,
        path: request.path,
        oldPath: request.path,
        status,
        additions,
        deletions,
        lines: parseFileDiff(diff.stdout),
    };
}
/** Compare two commits (left → right) and return file status/line counts. */
export async function loadCompare(ctx, cwd, request, signal) {
    assertValidHash(request.baseHash);
    assertValidHash(request.targetHash);
    const range = `${request.baseHash}..${request.targetHash}`;
    const common = ['-c', 'log.showSignature=false', 'diff', '--no-commit-id', '--find-renames', '--diff-filter=AMDR', '-z', range];
    const [nameResult, numResult] = await Promise.all([
        runGit(ctx, cwd, [...common, '--name-status'], signal),
        runGit(ctx, cwd, [...common, '--numstat'], signal),
    ]);
    const nameEntries = parseDiffNameStatus(nameResult.stdout);
    const numMap = parseDiffNumStat(numResult.stdout);
    return {
        baseHash: request.baseHash,
        targetHash: request.targetHash,
        changes: mergeFileChanges(nameEntries, numMap),
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
