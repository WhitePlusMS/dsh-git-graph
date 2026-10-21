import { createHash } from 'node:crypto';
export const AVATAR_MAX_BYTES = 64 * 1024;
const CACHE_SIZE = 128;
const SUCCESS_TTL = 24 * 60 * 60 * 1000;
const FAILURE_TTL = 15 * 60 * 1000;
export function githubRepository(remote) {
    if (remote === null)
        return null;
    const ssh = /^git@github\.com:([^/]+)\/([^/]+)\/?$/u.exec(remote);
    let path;
    if (ssh !== null)
        path = `${ssh[1]}/${ssh[2]}`;
    else {
        try {
            const url = new URL(remote);
            if (url.hostname !== 'github.com' || !['https:', 'http:', 'ssh:'].includes(url.protocol))
                return null;
            path = url.pathname.replace(/^\/+|\/+$/gu, '');
        }
        catch {
            return null;
        }
    }
    path = path.replace(/\.git$/u, '');
    return /^[\w.-]+\/[\w.-]+$/u.test(path) ? path : null;
}
export function gravatarUrl(email) {
    return `https://www.gravatar.com/avatar/${emailDigest(email, 'sha256')}?s=64&d=404&r=g`;
}
function emailDigest(email, algorithm) {
    return createHash(algorithm).update(email.trim().toLowerCase()).digest('hex');
}
/**
 * The web origin of the repository's own Git service (Gitea, Gogs, GitLab…).
 * Those services answer the Gravatar-compatible `GET <origin>/avatar/<md5>` with
 * the avatar the account uploaded there, so a self-hosted team gets real photos
 * even when nobody registered with gravatar.com.
 */
export function gitHostOrigin(remote) {
    if (remote === null)
        return null;
    const ssh = /^(?:[\w.-]+@)?([\w.-]+):(?!\/\/)(.+)$/u.exec(remote);
    const address = ssh !== null ? `https://${ssh[1]}` : remote;
    try {
        const url = new URL(address);
        if (!['https:', 'http:'].includes(url.protocol))
            return null;
        if (url.username !== '' || url.password !== '')
            return null;
        return url.origin;
    }
    catch {
        return null;
    }
}
/**
 * GitHub writes `123456+user@users.noreply.github.com` as a commit email when the
 * author hides their address. That address resolves to a public avatar without
 * any repository context, so a repo hosted elsewhere still gets the photo.
 */
const GITHUB_NOREPLY_RE = /^(?<id>\d+)\+[^@\s]+@users\.noreply\.github\.com$/u;
export function githubNoreplyAvatarUrl(email) {
    const match = GITHUB_NOREPLY_RE.exec(email.trim().toLowerCase());
    const id = match?.groups?.id;
    return id === undefined ? null : `https://avatars.githubusercontent.com/u/${id}?s=64`;
}
function object(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : undefined;
}
/**
 * Restrict every request and redirect, including URLs returned by GitHub. The
 * repository's own Git host is allowed in addition, because its `/avatar/<hash>`
 * endpoint is the team's own avatar store; `allowHostAvatar` limits it to the
 * exact origin the repository is configured against.
 */
function allowedUrl(url, hostOrigin) {
    if (url.username !== '' || url.password !== '')
        return false;
    if (hostOrigin !== null && url.origin === hostOrigin && /^\/avatar\/[0-9a-f]{32,64}$/u.test(url.pathname))
        return true;
    return url.protocol === 'https:' && (url.port === '' || url.port === '443')
        && (url.hostname === 'api.github.com' || /^avatars\d*\.githubusercontent\.com$/u.test(url.hostname)
            || ['www.gravatar.com', 'gravatar.com', 'secure.gravatar.com'].includes(url.hostname));
}
async function boundedBody(response, max) {
    if (Number(response.headers.get('content-length')) > max) {
        await response.body?.cancel();
        throw new Error('Avatar response is too large');
    }
    if (response.body === null)
        throw new Error('Avatar response has no body');
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
        while (true) {
            const chunk = await reader.read();
            if (chunk.done)
                break;
            size += chunk.value.byteLength;
            if (size > max) {
                await reader.cancel();
                throw new Error('Avatar response is too large');
            }
            chunks.push(chunk.value);
        }
    }
    finally {
        reader.releaseLock();
    }
    return Buffer.concat(chunks, size);
}
function rasterType(body) {
    if (body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
        return 'png';
    if (body[0] === 255 && body[1] === 216 && body[2] === 255)
        return 'jpeg';
    if (['GIF87a', 'GIF89a'].includes(body.subarray(0, 6).toString('ascii')))
        return 'gif';
    if (body.subarray(0, 4).toString('ascii') === 'RIFF' && body.subarray(8, 12).toString('ascii') === 'WEBP')
        return 'webp';
    return null;
}
/** Fiber-owned, bounded memory cache. No Git files, credentials or disk writes. */
export class AvatarStore {
    fetcher;
    now;
    cache = new Map();
    githubRetryAt = 0;
    constructor(fetcher = fetch, now = Date.now) {
        this.fetcher = fetcher;
        this.now = now;
    }
    async request(address, signal, accept, hostOrigin = null) {
        let url = new URL(address);
        const timeout = AbortSignal.any([signal, AbortSignal.timeout(4000)]);
        for (let redirects = 0; redirects <= 2; redirects += 1) {
            if (!allowedUrl(url, hostOrigin))
                throw new Error('Unsupported avatar URL');
            const response = await this.fetcher(url, { signal: timeout, redirect: 'manual',
                headers: { Accept: accept, 'User-Agent': 'dsh-git-graph' } });
            if (response.status < 300 || response.status >= 400)
                return response;
            const location = response.headers.get('location');
            await response.body?.cancel();
            if (location === null)
                throw new Error('Avatar redirect has no location');
            const next = new URL(location, url);
            // A redirect must stay inside one provider: the Git host, GitHub's API,
            // GitHub's image CDN, or Gravatar. Anything else is refused.
            const provider = (candidate) => {
                if (hostOrigin !== null && candidate.origin === hostOrigin)
                    return 'host';
                if (candidate.hostname.endsWith('gravatar.com'))
                    return 'gravatar';
                return candidate.hostname === 'api.github.com' ? 'api' : 'github-image';
            };
            if (provider(next) !== provider(url))
                throw new Error('Avatar redirect changed provider');
            url = next;
        }
        throw new Error('Too many avatar redirects');
    }
    async image(url, signal, hostOrigin = null) {
        const response = await this.request(url, signal, 'image/png,image/jpeg,image/webp,image/gif', hostOrigin);
        if (!response.ok) {
            await response.body?.cancel();
            return null;
        }
        const body = await boundedBody(response, AVATAR_MAX_BYTES);
        const type = rasterType(body);
        return type === null ? null : `data:image/${type};base64,${body.toString('base64')}`;
    }
    /**
     * Ask the repository's own Git service for the avatar of this email. Gitea and
     * Gogs expose `/avatar/<md5>` (Gravatar compatible) and answer with the photo
     * uploaded in that account, so a self-hosted team resolves avatars even when
     * nobody registered with gravatar.com.
     */
    async hostImage(origin, email, signal) {
        // Gitea/Gogs index the MD5 form; some deployments also accept the SHA256 form.
        for (const hash of [emailDigest(email, 'md5'), emailDigest(email, 'sha256')]) {
            const image = await this.image(`${origin}/avatar/${hash}?s=64&d=404`, signal, origin);
            if (image !== null)
                return image;
        }
        return null;
    }
    async githubImage(repo, author, signal) {
        if (this.githubRetryAt > this.now())
            return null;
        const url = new URL(`https://api.github.com/repos/${repo}/commits`);
        url.searchParams.set('author', author.sourceEmail);
        url.searchParams.set('per_page', '1');
        const response = await this.request(url.href, signal, 'application/vnd.github+json');
        if (response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0'))
            this.githubRetryAt = this.now() + FAILURE_TTL;
        if (!response.ok) {
            await response.body?.cancel();
            return null;
        }
        const parsed = JSON.parse((await boundedBody(response, 256 * 1024)).toString('utf8'));
        const entry = Array.isArray(parsed) ? object(parsed[0]) : undefined;
        const commitAuthor = object(object(entry?.commit)?.author);
        if (typeof commitAuthor?.email !== 'string' || commitAuthor.email.trim().toLowerCase() !== author.sourceEmail.trim().toLowerCase())
            return null;
        const account = object(entry?.author);
        if (typeof account?.avatar_url !== 'string')
            return null;
        const imageUrl = new URL(account.avatar_url);
        if (!/^avatars\d*\.githubusercontent\.com$/u.test(imageUrl.hostname))
            return null;
        imageUrl.searchParams.set('s', '64');
        return this.image(imageUrl.href, signal);
    }
    async author(author, repo, host, source, signal) {
        const email = author.email.trim().toLowerCase();
        const key = `${source}:${repo ?? host ?? ''}:${email}`;
        const cached = this.cache.get(key);
        if (cached !== undefined && cached.expires > this.now())
            return cached.avatar;
        let image = null;
        let provider = null;
        if (/^[^\s@<>]+@[^\s@<>]+$/u.test(email)) {
            // A GitHub noreply address identifies the account on its own, so it works
            // even when the repository has no GitHub remote to search.
            const noreply = source === 'auto' ? githubNoreplyAvatarUrl(email) : null;
            if (noreply !== null) {
                try {
                    image = await this.image(noreply, signal);
                }
                catch {
                    signal.throwIfAborted();
                }
                if (image !== null)
                    provider = 'github';
            }
            if (image === null && source === 'auto' && repo !== null) {
                try {
                    image = await this.githubImage(repo, author, signal);
                }
                catch {
                    signal.throwIfAborted();
                }
                if (image !== null)
                    provider = 'github';
            }
            // The repository's own Git service knows its members, so ask it before the
            // public Gravatar directory. GitHub remotes are already covered above.
            if (image === null && source === 'auto' && repo === null && host !== null) {
                try {
                    image = await this.hostImage(host, email, signal);
                }
                catch {
                    signal.throwIfAborted();
                }
                if (image !== null)
                    provider = 'host';
            }
            if (image === null) {
                try {
                    image = await this.image(gravatarUrl(email), signal);
                }
                catch {
                    signal.throwIfAborted();
                }
                if (image !== null)
                    provider = 'gravatar';
            }
        }
        signal.throwIfAborted();
        const avatar = { email, image, provider };
        this.cache.delete(key);
        this.cache.set(key, { avatar, expires: this.now() + (image === null ? FAILURE_TTL : SUCCESS_TTL) });
        if (this.cache.size > CACHE_SIZE) {
            const oldest = this.cache.keys().next().value;
            if (oldest !== undefined)
                this.cache.delete(oldest);
        }
        return avatar;
    }
    async read(authors, remote, source, signal) {
        const repo = githubRepository(remote);
        const host = gitHostOrigin(remote);
        const unique = [...new Map(authors.map(author => [author.email.trim().toLowerCase(), author])).values()];
        const result = [];
        let next = 0;
        await Promise.all(Array.from({ length: Math.min(4, unique.length) }, async () => {
            while (next < unique.length) {
                signal.throwIfAborted();
                const author = unique[next++];
                if (author !== undefined)
                    result.push(await this.author(author, repo, host, source, signal));
            }
        }));
        return result;
    }
}
