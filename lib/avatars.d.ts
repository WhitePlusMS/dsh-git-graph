import type { GitGraphAvatar, GitGraphAvatarRequest } from './domain.js';
export interface AvatarAuthor {
    readonly email: string;
    /** GitHub searches the original commit identity; mailmap controls display. */
    readonly sourceEmail: string;
}
export declare const AVATAR_MAX_BYTES: number;
export declare function githubRepository(remote: string | null): string | null;
export declare function gravatarUrl(email: string): string;
/** Fiber-owned, bounded memory cache. No Git files, credentials or disk writes. */
export declare class AvatarStore {
    private readonly fetcher;
    private readonly now;
    private readonly cache;
    private githubRetryAt;
    constructor(fetcher?: typeof fetch, now?: () => number);
    private request;
    private image;
    private githubImage;
    private author;
    read(authors: readonly AvatarAuthor[], remote: string | null, source: GitGraphAvatarRequest['source'], signal: AbortSignal): Promise<GitGraphAvatar[]>;
}
