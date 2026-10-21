import type { GitGraphAvatar, GitGraphAvatarRequest } from './domain.js';
export interface AvatarAuthor {
    readonly email: string;
    /** GitHub searches the original commit identity; mailmap controls display. */
    readonly sourceEmail: string;
}
export declare const AVATAR_MAX_BYTES: number;
export declare function githubRepository(remote: string | null): string | null;
export declare function gravatarUrl(email: string): string;
/**
 * The web origin of the repository's own Git service (Gitea, Gogs, GitLab…).
 * Those services answer the Gravatar-compatible `GET <origin>/avatar/<md5>` with
 * the avatar the account uploaded there, so a self-hosted team gets real photos
 * even when nobody registered with gravatar.com.
 */
export declare function gitHostOrigin(remote: string | null): string | null;
export declare function githubNoreplyAvatarUrl(email: string): string | null;
/** Fiber-owned, bounded memory cache. No Git files, credentials or disk writes. */
export declare class AvatarStore {
    private readonly fetcher;
    private readonly now;
    private readonly cache;
    private githubRetryAt;
    constructor(fetcher?: typeof fetch, now?: () => number);
    private request;
    private image;
    /**
     * Ask the repository's own Git service for the avatar of this email. Gitea and
     * Gogs expose `/avatar/<md5>` (Gravatar compatible) and answer with the photo
     * uploaded in that account, so a self-hosted team resolves avatars even when
     * nobody registered with gravatar.com.
     */
    private hostImage;
    private githubImage;
    private author;
    read(authors: readonly AvatarAuthor[], remote: string | null, source: GitGraphAvatarRequest['source'], signal: AbortSignal): Promise<GitGraphAvatar[]>;
}
