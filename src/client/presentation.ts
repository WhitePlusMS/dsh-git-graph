/** Pure display geometry shared by the rows/SVG and exercised independently. */
import type { GitGraphCommit, GitGraphRef } from '../domain.ts'
import type { CommitColumn, GitGraphDisplaySettings } from './settings.ts'

export function graphRowHeight(settings: GitGraphDisplaySettings): number {
  return settings.graphStyle === 'compact' ? 28 : 36
}

export function graphDisplayWidth(laneCount: number): number {
  return Math.max(64, 32 + Math.max(0, laneCount - 1) * 16 + 8)
}

export function visibleColumns(settings: GitGraphDisplaySettings): CommitColumn[] {
  return ['description', ...(settings.showDate ? ['date' as const] : []),
    ...(settings.showAuthor ? ['author' as const] : []), ...(settings.showHash ? ['hash' as const] : [])]
}

export function commitDate(commit: GitGraphCommit, source: GitGraphDisplaySettings['dateSource']): string {
  return source === 'committer' ? commit.committerDate : commit.date
}

export interface ReferenceLabel {
  readonly ref: GitGraphRef
  readonly remotes: readonly GitGraphRef[]
}

/** Combine labels only using real remote names and exact local branch matches. */
export function referenceLabels(refs: readonly GitGraphRef[], remotes: readonly string[], combine: boolean, currentBranch: string | null): ReferenceLabel[] {
  const labels: { ref: GitGraphRef; remotes: GitGraphRef[] }[] = refs.filter(ref => ref.kind !== 'remote').map(ref => ({ ref, remotes: [] }))
  const local = new Map(labels.filter(label => label.ref.kind === 'head').map(label => [label.ref.name, label]))
  const remoteNames = [...remotes].sort((a, b) => b.length - a.length)
  for (const ref of refs.filter(ref => ref.kind === 'remote')) {
    const remote = remoteNames.find(name => ref.name.startsWith(`${name}/`))
    const target = combine && remote !== undefined ? local.get(ref.name.slice(remote.length + 1)) : undefined
    if (target !== undefined) target.remotes.push(ref)
    else labels.push({ ref, remotes: [] })
  }
  const rank = (ref: GitGraphRef) => ref.kind === 'head' && ref.name === currentBranch ? -1 : ref.kind === 'head' ? 0 : ref.kind === 'remote' ? 1 : 2
  return labels.sort((a, b) => rank(a.ref) - rank(b.ref) || a.ref.name.localeCompare(b.ref.name))
}
