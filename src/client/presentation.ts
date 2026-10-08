/** Pure display geometry shared by the rows/SVG and exercised independently. */
import type { GitGraphDiffLine } from '../domain.ts'
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

export interface DisplayHunk {
  readonly header: string
  readonly lines: readonly GitGraphDiffLine[]
}

/** Reconstruct hunk ranges from actual line numbers, without interpreting content. */
export function displayHunks(lines: readonly GitGraphDiffLine[]): DisplayHunk[] {
  const groups: GitGraphDiffLine[][] = []
  let oldLast: number | undefined
  let newLast: number | undefined
  for (const line of lines) {
    const separated = (line.oldLine !== null && oldLast !== undefined && line.oldLine !== oldLast + 1)
      || (line.newLine !== null && newLast !== undefined && line.newLine !== newLast + 1)
    if (groups.length === 0 || separated) { groups.push([]); oldLast = undefined; newLast = undefined }
    groups[groups.length - 1]?.push(line)
    if (line.oldLine !== null) oldLast = line.oldLine
    if (line.newLine !== null) newLast = line.newLine
  }
  return groups.map(group => {
    const oldLines = group.filter(line => line.oldLine !== null)
    const newLines = group.filter(line => line.newLine !== null)
    return { header: `@@ -${oldLines[0]?.oldLine ?? 0},${oldLines.length} +${newLines[0]?.newLine ?? 0},${newLines.length} @@`, lines: group }
  })
}
