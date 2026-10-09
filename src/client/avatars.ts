import { useEffect, useRef, useState } from 'react'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import { MAX_AVATAR_BATCH, type GitGraphAvatar, type GitGraphAvatarRequest, type GitGraphAvatarResult, type GitGraphCommit } from '../domain.ts'
import type { AvatarSource } from './settings.ts'

export function avatarEmail(email: string): string { return email.trim().toLowerCase() }

/** Keep photos while refreshing; the Host decides cache expiry and re-fetching. */
export function useAvatars(commits: readonly GitGraphCommit[], repo: string | undefined, source: AvatarSource, enabled: boolean,
  read: (request: GitGraphAvatarRequest, signal: AbortSignal) => Promise<RemoteResult<GitGraphAvatarResult>>) {
  const cache = useRef({ key: '', images: new Map<string, GitGraphAvatar>() })
  const [images, setImages] = useState<ReadonlyMap<string, GitGraphAvatar>>(cache.current.images)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  useEffect(() => {
    const key = `${repo ?? ''}:${source}`
    if (cache.current.key !== key) {
      cache.current = { key, images: new Map() }
      setImages(cache.current.images)
    }
    setError(undefined)
    setLoading(false)
    if (!enabled || repo === undefined) return
    const authors = [...new Map(commits.map(commit => [avatarEmail(commit.email), commit])).values()]
    if (authors.length === 0) return
    let cancelled = false
    const controller = new AbortController()
    setLoading(true)
    void (async () => {
      try {
        for (let start = 0; start < authors.length && !cancelled; start += MAX_AVATAR_BATCH) {
          const result = await read({ hashes: authors.slice(start, start + MAX_AVATAR_BATCH).map(commit => commit.hash), source }, controller.signal)
          if (cancelled) return
          if (!result.ok) throw new Error(result.error.message)
          const next = new Map(cache.current.images)
          for (const avatar of result.value.avatars) next.set(avatarEmail(avatar.email), avatar)
          while (next.size > 512) {
            const oldest = next.keys().next().value
            if (oldest === undefined) break
            next.delete(oldest)
          }
          cache.current.images = next
          setImages(next)
        }
      } catch (cause: unknown) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      } finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true; controller.abort() }
  }, [commits, repo, source, enabled, read])
  return { images, loading, error }
}
