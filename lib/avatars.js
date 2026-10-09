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
    const hash = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?s=64&d=404&r=g`;
}
function object(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : undefined;
}
/** Restrict every request and redirect, including URLs returned by GitHub. */
function allowedUrl(url) {
    return url.protocol === 'https:' && url.username === '' && url.password === '' && (url.port === '' || url.port === '443')
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
    async request(address, signal, accept) {
        let url = new URL(address);
        const timeout = AbortSignal.any([signal, AbortSignal.timeout(4000)]);
        for (let redirects = 0; redirects <= 2; redirects += 1) {
            if (!allowedUrl(url))
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
            // GitHub API redirects stay on its API; images stay on the same provider.
            const provider = (host) => host.endsWith('gravatar.com') ? 'gravatar' : host === 'api.github.com' ? 'api' : 'github-image';
            if (provider(next.hostname) !== provider(url.hostname))
                throw new Error('Avatar redirect changed provider');
            url = next;
        }
        throw new Error('Too many avatar redirects');
    }
    async image(url, signal) {
        const response = await this.request(url, signal, 'image/png,image/jpeg,image/webp,image/gif');
        if (!response.ok) {
            await response.body?.cancel();
            return null;
        }
        const body = await boundedBody(response, AVATAR_MAX_BYTES);
        const type = rasterType(body);
        return type === null ? null : `data:image/${type};base64,${body.toString('base64')}`;
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
    async author(author, repo, source, signal) {
        const email = author.email.trim().toLowerCase();
        const key = `${source}:${repo ?? ''}:${email}`;
        const cached = this.cache.get(key);
        if (cached !== undefined && cached.expires > this.now())
            return cached.avatar;
        let image = null;
        let provider = null;
        if (/^[^\s@<>]+@[^\s@<>]+$/u.test(email)) {
            if (source === 'auto' && repo !== null) {
                try {
                    image = await this.githubImage(repo, author, signal);
                }
                catch {
                    signal.throwIfAborted();
                }
                if (image !== null)
                    provider = 'github';
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
        const unique = [...new Map(authors.map(author => [author.email.trim().toLowerCase(), author])).values()];
        const result = [];
        let next = 0;
        await Promise.all(Array.from({ length: Math.min(4, unique.length) }, async () => {
            while (next < unique.length) {
                signal.throwIfAborted();
                const author = unique[next++];
                if (author !== undefined)
                    result.push(await this.author(author, repo, source, signal));
            }
        }));
        return result;
    }
}
