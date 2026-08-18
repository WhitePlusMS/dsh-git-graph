/**
 * Client-only display settings, persisted per repository. Storage keys are
 * derived from a stable hash of the normalized repository path so settings never
 * use the raw (case/separator-sensitive) path as the unique key and never leak
 * between repositories.
 */

export type GraphDateFormat = 'short' | 'full' | 'local'
export type GraphStyle = 'compact' | 'full'

export interface GitGraphDisplaySettings {
  readonly showDate: boolean
  readonly showAuthor: boolean
  readonly showHash: boolean
  readonly dateFormat: GraphDateFormat
  readonly graphStyle: GraphStyle
}

export const DEFAULT_DISPLAY_SETTINGS: GitGraphDisplaySettings = {
  showDate: true,
  showAuthor: true,
  showHash: true,
  dateFormat: 'short',
  graphStyle: 'full',
}

const STORAGE_PREFIX = 'dsh-git-graph:s:'

/** Stable non-negative integer id derived from a normalized repo path. */
export function stableRepoId(path: string): number {
  const normalized = path.replace(/[/\\]+$/u, '').toLocaleLowerCase()
  let hash = 2166136261
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function storageKey(path: string): string {
  return `${STORAGE_PREFIX}${stableRepoId(path).toString(36)}`
}

function isPartial(value: unknown): value is Partial<GitGraphDisplaySettings> {
  return typeof value === 'object' && value !== null
}

/** Load settings for a repository path, falling back to defaults on error. */
export function loadDisplaySettings(path: string): GitGraphDisplaySettings {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return DEFAULT_DISPLAY_SETTINGS
  }
  try {
    const raw = window.localStorage.getItem(storageKey(path))
    if (raw === null) return DEFAULT_DISPLAY_SETTINGS
    const parsed: unknown = JSON.parse(raw)
    if (!isPartial(parsed)) return DEFAULT_DISPLAY_SETTINGS
    const bool = (value: unknown, fallback: boolean): boolean => typeof value === 'boolean' ? value : fallback
    const dateFormat = parsed.dateFormat === 'short' || parsed.dateFormat === 'full' || parsed.dateFormat === 'local'
      ? parsed.dateFormat
      : DEFAULT_DISPLAY_SETTINGS.dateFormat
    const graphStyle = parsed.graphStyle === 'compact' || parsed.graphStyle === 'full'
      ? parsed.graphStyle
      : DEFAULT_DISPLAY_SETTINGS.graphStyle
    return {
      showDate: bool(parsed.showDate, DEFAULT_DISPLAY_SETTINGS.showDate),
      showAuthor: bool(parsed.showAuthor, DEFAULT_DISPLAY_SETTINGS.showAuthor),
      showHash: bool(parsed.showHash, DEFAULT_DISPLAY_SETTINGS.showHash),
      dateFormat,
      graphStyle,
    }
  } catch {
    return DEFAULT_DISPLAY_SETTINGS
  }
}

/** Persist settings for a repository path. Never throws. */
export function saveDisplaySettings(path: string, settings: GitGraphDisplaySettings): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(path), JSON.stringify(settings))
  } catch {
    // Storage quota or privacy mode; display settings are best-effort.
  }
}
