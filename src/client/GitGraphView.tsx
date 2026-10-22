import { createContext, Fragment, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { GitGraphAvatar, GitGraphAvatarRequest, GitGraphAvatarResult } from '../domain.ts'
import type { GitGraphBranch, GitGraphCommit, GitGraphCommitDetails, GitGraphCompareRequest, GitGraphCompareResult, GitGraphFileChange, GitGraphFileContent, GitGraphFileDiff, GitGraphFileDiffRequest, GitGraphFileRequest, GitGraphQuery, GitGraphMetadata, GitGraphRef, GitGraphSnapshot, GitGraphWorkingTreeChanges, GitGraphWorkingTreeFileRequest } from '../domain.ts'
import { MAX_SEARCH_COMMITS } from '../domain.ts'
import { layoutGraph, type GraphLayout } from './graph-layout.ts'
import { loadDisplaySettings, saveDisplaySettings, DEFAULT_DISPLAY_SETTINGS, COLUMN_LIMITS, clampColumnWidth, type CommitColumn, type GitGraphDisplaySettings, type GraphDateFormat, type GraphLineStyle, type GraphPalette } from './settings.ts'
import { commitDate, displayHunks, graphDisplayWidth, graphRowHeight, referenceLabels, visibleColumns } from './presentation.ts'
import { avatarEmail, useAvatars } from './avatars.ts'
import { BUILD_ID } from './build-info.ts'
import { RichMessage } from './RichMessage.tsx'
import { css } from './styles.ts'
import { NS, type GitGraphTranslate } from './locales.ts'

export interface GitGraphViewInjected {
  readonly avatars: (request: GitGraphAvatarRequest, signal: AbortSignal) => Promise<RemoteResult<GitGraphAvatarResult>>
  readonly read: (request: GitGraphQuery, signal: AbortSignal) => Promise<RemoteResult<GitGraphSnapshot>>
  readonly readCommit: (request: { hash: string }, signal: AbortSignal) => Promise<RemoteResult<GitGraphCommitDetails>>
  readonly readFile: (request: GitGraphFileRequest, signal: AbortSignal) => Promise<RemoteResult<GitGraphFileContent>>
  readonly readFileDiff: (request: GitGraphFileDiffRequest, signal: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>
  readonly readWorkingTree: (signal: AbortSignal) => Promise<RemoteResult<GitGraphWorkingTreeChanges>>
  readonly readWorkingTreeFile: (request: GitGraphWorkingTreeFileRequest, signal: AbortSignal) => Promise<RemoteResult<GitGraphFileDiff>>
  readonly compare: (request: GitGraphCompareRequest, signal: AbortSignal) => Promise<RemoteResult<GitGraphCompareResult>>
  readonly metadata: (signal: AbortSignal) => Promise<RemoteResult<GitGraphMetadata>>
}

type Props = PropsRuntime<'sidebar.right.pane.tab'> & PropsLocale<typeof NS> & GitGraphViewInjected
type RefFilter = 'all' | GitGraphRef['kind']
/** The secondary surfaces that cover the graph instead of stacking above it. */
type SheetKind = 'branch' | 'filter' | 'settings'

const MAX_COMMITS = 500
const PAGE_SIZE = 100
const NO_COMMITS: readonly GitGraphCommit[] = []

/** Share the slot-owned translator with the nested detail and diff panels. */
const TextContext = createContext<GitGraphTranslate | undefined>(undefined)

function useText(): GitGraphTranslate {
  const t = useContext(TextContext)
  if (t === undefined) throw new Error('Git Graph locale provider is missing')
  return t
}

function shortHash(hash: string): string {
  return hash.slice(0, 8)
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString()
}

function formatDateValue(value: string, format: GraphDateFormat): string {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return value
  if (format === 'full') return date.toLocaleString()
  if (format === 'local') return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' })
  return date.toLocaleDateString()
}

function refMatches(commit: GitGraphCommit, filter: RefFilter): boolean {
  return filter === 'all' || commit.refs.some(ref => ref.kind === filter)
}

/** One clipboard behavior for hashes, paths and refs, including denied access. */
function CopyButton({ value, label, className = css.secondaryButton, children, hint }: {
  readonly value: string; readonly label: string; readonly className?: string; readonly children?: ReactNode; readonly hint?: string
}) {
  const t = useText()
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  useEffect(() => { setState('idle') }, [value])
  useEffect(() => {
    if (state === 'idle') return
    const timer = setTimeout(() => setState('idle'), 2500)
    return () => clearTimeout(timer)
  }, [state])
  return <button type="button" className={className} title={hint ?? `${label} · ${value}`} aria-label={label} data-copy-state={state}
    onClick={event => {
      event.stopPropagation()
      void (async () => {
        try { await navigator.clipboard.writeText(value); setState('copied') }
        catch { setState('failed') }
      })()
    }}><span aria-live="polite">{state === 'copied' ? t('common.copied') : state === 'failed' ? t('common.copyFailed') : children ?? label}</span></button>
}

/**
 * Draws every reference on the commit, never a "+N" summary: the row trades
 * subject width for reference width, and each chip ellipsizes its own name when
 * the row is too narrow, so no reference is silently hidden.
 */
function RefBadges({ refs, currentBranch, remotes, combine }: {
  readonly refs: readonly GitGraphRef[]; readonly currentBranch?: string | null
  readonly remotes: readonly string[]; readonly combine: boolean
}) {
  const t = useText()
  const ordered = referenceLabels(refs, remotes, combine, currentBranch ?? null)
  return refs.length === 0 ? null : (
    <span className={css.refs} aria-label={t('refs.aria')}>
      {ordered.map(({ ref, remotes: joined }) => (
        <span key={`${ref.kind}:${ref.name}`} className={css.ref} data-kind={ref.kind} data-combined={joined.length > 0} title={[ref.name, ...joined.map(remote => remote.name)].join('\n')}>
          <CopyButton value={ref.name} label={t('refs.copy', { name: ref.name })} className={css.refCopy}
            hint={`${ref.kind === 'remote' ? t('refs.remoteHint') : ref.kind === 'head' ? t('toolbar.localBranches') : t('metadata.tags')} · ${ref.name}${ref.kind === 'head' && ref.name === currentBranch ? ` · ${t('refs.current')}` : ''}`}>
          <svg className={css.refIcon} viewBox="0 0 16 16" aria-hidden="true">
            {ref.kind === 'tag' ? (
              <>
                <path d="M3 3h4.1L13 8.9 8.9 13 3 7.1V3Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <circle cx="5.2" cy="5.2" r="1" fill="currentColor" />
              </>
            ) : (
              <>
                <path d="M5 4.4v7.2M5 8h3a2.5 2.5 0 0 1 2.5 2.5V12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="5" cy="3" r="1.7" fill="currentColor" />
                <circle cx="5" cy="13" r="1.7" fill="currentColor" />
                <circle cx="10.5" cy="13" r="1.7" fill="currentColor" />
              </>
            )}
          </svg>
          <span className={css.refName}>{ref.name}</span>
          {ref.kind === 'head' && ref.name === currentBranch && <span className={css.currentBranch}>{t('refs.current')}</span>}
          </CopyButton>
          {joined.map(remote => <CopyButton key={remote.name} value={remote.name} label={t('refs.copy', { name: remote.name })} className={css.remoteJoined}
            hint={`${t('refs.remoteHint')} · ${remote.name}`}>{remote.name.slice(0, -ref.name.length - 1)}</CopyButton>)}
        </span>
      ))}
    </span>
  )
}

/** One rendered row's vertical box inside the commit list. */
interface RowBox {
  readonly top: number
  readonly height: number
}

/**
 * Measured boxes of the rendered rows. `rows[0]` is the first commit row and
 * `workingTree` the uncommitted-changes row above it; rows grow when a commit
 * carries enough references to wrap the labels onto a second line.
 */
interface RowMetrics {
  readonly workingTree: RowBox | undefined
  readonly rows: readonly RowBox[]
  readonly total: number
}

function rowBox(metrics: RowMetrics, row: number, rowHeight: number): RowBox {
  const box = row < 0 ? metrics.workingTree : metrics.rows[row]
  if (box !== undefined) return box
  const shift = metrics.workingTree === undefined ? 0 : rowHeight
  return row < 0 ? { top: 0, height: rowHeight } : { top: shift + row * rowHeight, height: rowHeight }
}

/** Geometry to draw with before the first measurement lands. */
function uniformRowMetrics(rowCount: number, workingTreeChanged: boolean, rowHeight: number): RowMetrics {
  const shift = workingTreeChanged ? rowHeight : 0
  return {
    workingTree: workingTreeChanged ? { top: 0, height: rowHeight } : undefined,
    rows: Array.from({ length: rowCount }, (_, index) => ({ top: shift + index * rowHeight, height: rowHeight })),
    total: shift + rowCount * rowHeight,
  }
}

/** Same geometry within half a pixel, so the measuring effect settles. */
function sameRowBox(left: RowBox | undefined, right: RowBox | undefined): boolean {
  if (left === undefined || right === undefined) return left === right
  return Math.abs(left.top - right.top) < 0.5 && Math.abs(left.height - right.height) < 0.5
}

function sameRowMetrics(left: RowMetrics, right: RowMetrics): boolean {
  if (!sameRowBox(left.workingTree, right.workingTree) || Math.abs(left.total - right.total) >= 0.5) return false
  if (left.rows.length !== right.rows.length) return false
  return left.rows.every((box, index) => sameRowBox(box, right.rows[index]))
}

interface GraphSvgProps {
  readonly layout: GraphLayout
  readonly workingTreeChanged: boolean
  readonly selectedHash: string | undefined
  /** Measured vertical box of every row, so wrapping reference labels stay aligned. */
  readonly metrics: RowMetrics
  readonly onSelect: (hash: string) => void
  readonly rowHeight: number
  readonly lineStyle: GraphLineStyle
  readonly palette: GraphPalette
  readonly hoveredHash: string | undefined
  readonly onHover: (hash: string | undefined) => void
}

function GraphSvg({ layout, workingTreeChanged, selectedHash, metrics, onSelect, rowHeight, lineStyle, palette, hoveredHash, onHover }: GraphSvgProps) {
  const t = useText()
  const laneWidth = 16
  const graphPadding = 16
  const graphWidth = graphDisplayWidth(layout.laneCount)
  const graphHeight = Math.max(rowHeight, metrics.total)
  const colours = palette === 'accessible' ? ['#0072b2', '#d55e00', '#009e73', '#cc79a7', '#e69f00', '#56b4e9'] : ['#0085d9', '#d9008f', '#00a86b', '#d98500', '#7b4bc4', '#e138e8', '#00a7a0', '#dc5b23', '#6f24d6', '#b38b00']
  const headNode = layout.nodes.find(node => node.commit.isHead)
  const pointX = (lane: number) => graphPadding + lane * laneWidth
  const pointY = (row: number) => {
    const box = rowBox(metrics, row, rowHeight)
    return box.top + box.height / 2
  }
  const pathForEdge = (edge: GraphLayout['edges'][number]) => {
    const x1 = pointX(edge.fromLane)
    const x2 = pointX(edge.toLane)
    const y1 = pointY(edge.row)
    const y2 = pointY(edge.row + 1)
    if (x1 === x2) return `M ${x1} ${y1} L ${x2} ${y2}`
    if (lineStyle === 'straight') return `M ${x1} ${y1} L ${x2} ${y2}`
    const from = rowBox(metrics, edge.row, rowHeight)
    const to = rowBox(metrics, edge.row + 1, rowHeight)
    const span = y2 - y1
    // A tall row (wrapped labels) or an open inline panel gets a longer, gentler
    // curve instead of a fixed radius measured in rows.
    const curve = span > Math.min(from.height, to.height) * 1.5 ? span * 0.4 : Math.min(from.height, to.height) * 0.8
    return `M ${x1} ${y1} C ${x1} ${y1 + curve}, ${x2} ${y2 - curve}, ${x2} ${y2}`
  }

  return (
    <svg
      className={css.graph}
      width={graphWidth}
      height={graphHeight}
      viewBox={`0 0 ${graphWidth} ${graphHeight}`}
      role="img"
      aria-label={t('graph.aria')}
    >
      {workingTreeChanged && headNode !== undefined && (
        <path
          className={css.workingTreeEdge}
          d={`M ${pointX(0)} ${pointY(-1)} C ${pointX(0)} ${pointY(-1) + rowBox(metrics, -1, rowHeight).height * 0.8}, ${pointX(headNode.lane)} ${pointY(headNode.row) - rowBox(metrics, headNode.row, rowHeight).height * 0.8}, ${pointX(headNode.lane)} ${pointY(headNode.row)}`}
        />
      )}
      {layout.edges.map((edge, index) => {
        const colour = colours[edge.colour % colours.length] ?? colours[0]
        const path = pathForEdge(edge)
        return (
          <g key={`${edge.row}-${edge.fromLane}-${edge.toLane}-${edge.colour}-${index}`}>
            <path className={css.graphShadow} d={path} />
            <path className={css.graphLine} d={path} stroke={colour} strokeDasharray={edge.missingParent ? '3 3' : undefined} data-missing-parent={edge.missingParent} />
          </g>
        )
      })}
      {layout.nodes.map(node => {
        const x = pointX(node.lane)
        const y = pointY(node.row)
        const colour = colours[node.colour % colours.length] ?? colours[0]
        const selected = node.commit.hash === selectedHash
        return (
          <g
            key={node.commit.hash}
            className={selected ? css.graphNodeSelected : css.graphNode}
            role="button"
            tabIndex={0}
            aria-current={node.commit.isHead}
            data-hovered={node.commit.hash === hoveredHash}
            onMouseEnter={() => onHover(node.commit.hash)}
            onMouseLeave={() => onHover(undefined)}
            aria-label={t('graph.selectCommit', { hash: shortHash(node.commit.hash), subject: node.commit.subject })}
            onClick={() => onSelect(node.commit.hash)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(node.commit.hash)
              }
            }}
          >
            <title>{`${shortHash(node.commit.hash)} ${node.commit.subject}`}</title>
            <circle className={css.graphHitArea} cx={x} cy={y} r={9} />
            <circle cx={x} cy={y} r={selected ? 5.5 : 4} fill={node.commit.isHead ? 'var(--git-graph-bg)' : colour} stroke={node.commit.isHead ? colour : 'var(--git-graph-bg)'} />
          </g>
        )
      })}
      {workingTreeChanged && <circle className={css.workingTreeNode} cx={pointX(0)} cy={pointY(-1)} r={5} />}
    </svg>
  )
}

function commitMatchesFind(commit: GitGraphCommit, text: string, caseSensitive: boolean, regex: boolean): boolean {
  if (text.length === 0) return false
  try {
    if (regex) {
      const flags = caseSensitive ? '' : 'i'
      return new RegExp(text, flags).test([commit.subject, commit.author, commit.email, commit.hash, ...commit.refs.map(ref => ref.name)].join(' '))
    }
  } catch {
    return false
  }
  const needle = caseSensitive ? text : text.toLocaleLowerCase()
  const haystack = caseSensitive
    ? [commit.subject, commit.author, commit.email, commit.hash, ...commit.refs.map(ref => ref.name)].join(' ')
    : [commit.subject, commit.author, commit.email, commit.hash, ...commit.refs.map(ref => ref.name)].join(' ').toLocaleLowerCase()
  return haystack.includes(needle)
}

/**
 * Labels use the same measured row boxes as the SVG and follow their own node.
 * They report how far right their widest row reaches, so the graph column can
 * reserve exactly that much room and keep every label at its natural size.
 */
function GraphReferenceLabels({ layout, metrics, remotes, currentBranch, combine, onExtent }: {
  readonly layout: GraphLayout; readonly metrics: RowMetrics; readonly remotes: readonly string[]
  readonly currentBranch: string | null; readonly combine: boolean
  readonly onExtent: (extent: number) => void
}) {
  const layerRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const layer = layerRef.current
    if (layer === null) return
    let extent = 0
    for (const row of layer.querySelectorAll<HTMLElement>(`.${css.graphRefRow}`)) {
      const container = row.querySelector<HTMLElement>(`.${css.refs}`)
      if (container === null) continue
      // The chips never shrink here, so this is the natural label width.
      extent = Math.max(extent, Number.parseFloat(row.style.left) + container.getBoundingClientRect().width)
    }
    onExtent(extent)
  }, [layout, combine, remotes, onExtent])
  return <div className={css.graphRefs} ref={layerRef} style={{ width: 'calc(var(--git-graph-svg-width) + var(--git-graph-ref-width))',
    height: metrics.total }} data-graph-reference-labels>
    {layout.nodes.map(node => <div key={node.commit.hash} className={css.graphRefRow} data-ref-commit={node.commit.hash}
      style={{ left: 30 + node.lane * 16, top: (metrics.rows[node.row] ?? metrics.workingTree)?.top ?? 0, height: (metrics.rows[node.row] ?? metrics.workingTree)?.height }}>
      <RefBadges refs={node.commit.refs.filter(ref => ref.kind !== 'tag')} remotes={remotes} combine={combine} currentBranch={currentBranch} />
    </div>)}
  </div>
}

function CommitRow({ commit, selected, display, findActive, onSelect, currentBranch, hovered, onHover, remotes, avatar }: {
  readonly commit: GitGraphCommit
  readonly selected: boolean
  readonly display: GitGraphDisplaySettings
  readonly findActive: boolean
  readonly onSelect: () => void
  readonly currentBranch: string | null
  readonly hovered: boolean
  readonly onHover: (hash: string | undefined) => void
  readonly remotes: readonly string[]
  readonly avatar: GitGraphAvatar | undefined
}) {
  const t = useText()
  return (
    <div role="button" tabIndex={0} data-commit-hash={commit.hash} data-hovered={hovered} className={selected ? `${css.commit} ${css.commitSelected}` : css.commit} aria-pressed={selected} onClick={onSelect}
      onMouseEnter={() => onHover(commit.hash)} onMouseLeave={() => onHover(undefined)}
      onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onSelect() } }}>
      <span className={css.commitDescription}>
        {/* The head dot and avatar stay centred beside the whole two-line body:
            when the references wrap, the subject drops below them as one block. */}
        <span className={css.commitLead}>
          {commit.isHead && <span className={css.headDot} title={t('graph.head')} aria-label={t('graph.head')} />}
          <Avatar email={commit.email} name={commit.author} avatar={avatar} />
        </span>
        <span className={css.commitBody}>
          {display.referenceAlignment !== 'graph' && <RefBadges refs={display.referenceAlignment === 'normal' ? commit.refs : commit.refs.filter(ref => ref.kind !== 'tag')} currentBranch={currentBranch} remotes={remotes} combine={display.combineReferences} />}
          <span className={findActive ? `${css.subject} ${css.findHighlight}` : css.subject} title={commit.subject}>{commit.subject || t('common.noSubject')}</span>
          {display.referenceAlignment !== 'normal' && <span className={css.tagsRight}><RefBadges refs={commit.refs.filter(ref => ref.kind === 'tag')} currentBranch={currentBranch} remotes={remotes} combine={false} /></span>}
        </span>
      </span>
      {display.showDate && <span className={css.commitDate} title={`${t(display.dateSource === 'author' ? 'details.authorDate' : 'details.committerDate')} · ${formatDate(commitDate(commit, display.dateSource))}`}>{formatDateValue(commitDate(commit, display.dateSource), display.dateFormat)}</span>}
      {display.showAuthor && <span className={css.commitAuthor} title={`${commit.author} <${commit.email}>`}>{commit.author}</span>}
      {display.showHash && <span className={`${css.hash} ${css.commitHash}`} title={commit.hash}>{shortHash(commit.hash)}</span>}
    </div>
  )
}

function FileGlyph() {
  return (
    <svg className={css.fileGlyph} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 1.8h4.8l3.2 3.2v9.2H4V1.8Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8.8 1.8v3.2H12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function FolderGlyph({ open }: { readonly open: boolean }) {
  return (
    <svg className={css.fileGlyph} viewBox="0 0 16 16" aria-hidden="true">
      {open ? (
        <>
          <path d="M1.8 3.2h4.2l1.6 1.8h6.6v2.2H1.8V3.2Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M1.8 7.2h12.4l-1.7 5.6H3.5L1.8 7.2Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </>
      ) : (
        <path d="M1.8 3.2h4.2l1.6 1.8h6.6v7.8H1.8V3.2Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      )}
    </svg>
  )
}

function FileChangeStatus({ type }: { readonly type: GitGraphCommitDetails['fileChanges'][number]['type'] }) {
  const t = useText()
  const label = t(`file.status.${type}`)
  return <code className={`${css.hash} ${css.fileStatus}`} data-status={type} title={label}>{type}</code>
}

type FileTreeNode =
  | { readonly kind: 'folder'; readonly name: string; readonly fullPath: string; readonly children: FileTreeNode[] }
  | { readonly kind: 'file'; readonly name: string; readonly change: GitGraphFileChange }

function pathSegments(path: string): string[] {
  return path.split(/[/\\]+/u).filter(segment => segment.length > 0)
}

/**
 * Group changed file paths into a directory tree (like vscode-git-graph).
 * Directory nodes collect nested folders; leaves carry the file change.
 */
function buildFileTree(changes: readonly GitGraphFileChange[]): FileTreeNode[] {
  interface Group { readonly children: Map<string, Group>; readonly files: Map<string, GitGraphFileChange> }
  const rootGroup: Group = { children: new Map(), files: new Map() }
  for (const change of changes) {
    const segments = pathSegments(change.newPath)
    let group = rootGroup
    for (const segment of segments.slice(0, -1)) {
      let next = group.children.get(segment)
      if (next === undefined) {
        next = { children: new Map(), files: new Map() }
        group.children.set(segment, next)
      }
      group = next
    }
    const name = segments[segments.length - 1] ?? change.newPath
    group.files.set(name, change)
  }
  const build = (group: Group, prefix: string): FileTreeNode[] => {
    const nodes: FileTreeNode[] = []
    for (const [name, child] of [...group.children].sort(([a], [b]) => a.localeCompare(b))) {
      // Compact chains of folders that contain nothing but a single subfolder
      // into one row ("a / b"), like vscode-git-graph's compact folders.
      let displayName = name
      let fullPath = prefix.length === 0 ? name : `${prefix}/${name}`
      let current = child
      while (current.files.size === 0 && current.children.size === 1) {
        const entry = [...current.children][0]
        if (entry === undefined) break
        displayName += ` / ${entry[0]}`
        fullPath += `/${entry[0]}`
        current = entry[1]
      }
      nodes.push({ kind: 'folder', name: displayName, fullPath, children: build(current, fullPath) })
    }
    for (const [name, change] of [...group.files].sort(([a], [b]) => a.localeCompare(b))) {
      nodes.push({ kind: 'file', name, change })
    }
    return nodes
  }
  return build(rootGroup, '')
}

/** A single changed-file row, shared by the tree leaves and the flat list. */
function FileLeaf({ change, name, onOpenFile }: {
  readonly change: GitGraphFileChange
  readonly name: string
  readonly onOpenFile: (change: GitGraphFileChange) => void
}) {
  const t = useText()
  const textFile = change.additions !== null && change.additions !== undefined && change.deletions !== null && change.deletions !== undefined
  const showStats = textFile
  return (
    <li className={css.fileLeaf}>
      <button
        type="button"
        className={css.fileRecord}
        title={t('file.openDiff', { path: change.newPath })}
        onClick={() => onOpenFile(change)}
      >
        <FileGlyph />
        <FileChangeStatus type={change.type} />
        <span className={css.fileName} data-status={change.type}>{name}</span>
        {change.type === 'R' && <span className={css.renamePath} title={`${change.oldPath} → ${change.newPath}`}>{change.oldPath} → {change.newPath}</span>}
        {!textFile && <span className={css.fileChangeStat}>{t('file.noStats')}</span>}
        {showStats && (
          <span className={css.fileAddDel}>
            (<span className={css.fileAdd}>+{change.additions}</span>|<span className={css.fileDel}>−{change.deletions}</span>)
          </span>
        )}
      </button>
      <CopyButton value={change.newPath} label={t('common.copyPath')} className={css.fileCopy} />
    </li>
  )
}

function FileTree({ changes, onOpenFile }: {
  readonly changes: readonly GitGraphFileChange[]
  readonly onOpenFile: (change: GitGraphFileChange) => void
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const nodes = useMemo(() => buildFileTree(changes), [changes])
  const toggle = (fullPath: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(fullPath)) next.delete(fullPath)
      else next.add(fullPath)
      return next
    })
  }
  const renderNode = (node: FileTreeNode): ReactNode => {
    if (node.kind === 'folder') {
      const isCollapsed = collapsed.has(node.fullPath)
      return (
        <li key={node.fullPath} className={css.treeFolder}>
          <button type="button" className={css.treeFolderToggle} onClick={() => toggle(node.fullPath)} aria-expanded={!isCollapsed} title={node.fullPath}>
            <FolderGlyph open={!isCollapsed} />
            <span className={css.treeFolderName}>{node.name}</span>
          </button>
          {!isCollapsed && <ul className={css.treeChildren}>{node.children.map(renderNode)}</ul>}
        </li>
      )
    }
    return <FileLeaf key={node.change.newPath} change={node.change} name={node.name} onOpenFile={onOpenFile} />
  }
  return <ul className={css.tree} role="tree">{nodes.map(renderNode)}</ul>
}

type FileListKind = 'list' | 'tree'

/** Flat path list rendering, kept as an alternative to the tree view. */
function FlatFileList({ changes, onOpenFile }: {
  readonly changes: readonly GitGraphFileChange[]
  readonly onOpenFile: (change: GitGraphFileChange) => void
}) {
  return (
    <ul className={css.fileList}>
      {changes.map((change, index) => (
        <FileLeaf key={`${change.type}-${change.oldPath}-${change.newPath}-${index}`} change={change} name={change.newPath} onOpenFile={onOpenFile} />
      ))}
    </ul>
  )
}

function ViewToggle({ view, onChange }: {
  readonly view: FileListKind
  readonly onChange: (view: FileListKind) => void
}) {
  const t = useText()
  return (
    <span className={css.viewToggle} role="group" aria-label={t('file.viewMode')}>
      <button type="button" aria-pressed={view === 'list'} className={view === 'list' ? `${css.viewToggleBtn} ${css.viewToggleActive}` : css.viewToggleBtn} onClick={() => onChange('list')}>{t('file.list')}</button>
      <button type="button" aria-pressed={view === 'tree'} className={view === 'tree' ? `${css.viewToggleBtn} ${css.viewToggleActive}` : css.viewToggleBtn} onClick={() => onChange('tree')}>{t('file.tree')}</button>
    </span>
  )
}

/** Renders the changed-file area in either the flat list or the folder tree. */
function FileChangesView({ changes, view, onOpenFile }: {
  readonly changes: readonly GitGraphFileChange[]
  readonly view: FileListKind
  readonly onOpenFile: (change: GitGraphFileChange) => void
}) {
  return view === 'tree'
    ? <FileTree changes={changes} onOpenFile={onOpenFile} />
    : <FlatFileList changes={changes} onOpenFile={onOpenFile} />
}

function CommitDetails({ commit, readCommit, compareActive, onCompare, onOpenFile, currentBranch, remotes, display, avatar, readRevision }: {
  readonly commit: GitGraphCommit | undefined
  readonly readCommit: GitGraphViewInjected['readCommit']
  readonly compareActive: boolean
  readonly onCompare: () => void
  readonly onOpenFile: (hash: string, change: GitGraphFileChange) => void
  readonly currentBranch: string | null
  readonly remotes: readonly string[]
  readonly display: GitGraphDisplaySettings
  readonly avatar: GitGraphAvatar | undefined
  readonly readRevision: number
}) {
  const t = useText()
  const [revision, setRevision] = useState(0)
  const [details, setDetails] = useState<GitGraphCommitDetails>()
  const [detailsError, setDetailsError] = useState<string>()
  const [view, setView] = useState<FileListKind>('tree')

  useEffect(() => {
    setDetails(undefined)
    setDetailsError(undefined)
    if (commit === undefined) return
    let cancelled = false
    const controller = new AbortController()
    void readCommit({ hash: commit.hash }, controller.signal).then(result => {
      if (cancelled) return
      if (result.ok) setDetails(result.value)
      else setDetailsError(result.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setDetailsError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true; controller.abort() }
  }, [commit?.hash, readCommit, revision, readRevision])

  if (commit === undefined) return <div className={css.emptyDetails}>{t('details.select')}</div>

  const signatureText = details?.signature
    ? `${t(`signature.${details.signature.status}`)}${details.signature.signer ? ` · ${details.signature.signer}` : ''}`
    : t('details.unsigned')

  return (
    <aside className={css.detailsPanel} aria-label={t('details.aria')}>
      <div className={css.detailsHeading}>
        <strong>{commit.subject || t('common.noSubject')}</strong>
        <span className={css.detailsActions}>
          <CopyButton value={commit.hash} label={t('common.copyHash')} />
          <button type="button" className={css.secondaryButton} onClick={onCompare}>
            {compareActive ? t('compare.close') : t('compare.open')}
          </button>
        </span>
      </div>
      <dl className={css.detailsList}>
        <dt>Hash</dt><dd className={css.mono}>{commit.hash}</dd>
        <dt>{t('details.author')}</dt><dd><Avatar email={commit.email} name={commit.author} avatar={avatar} /> {commit.author} &lt;{commit.email}&gt;</dd>
        <dt>{t('details.authorDate')}</dt><dd>{formatDate(commit.date)}</dd>
        <dt>{t('details.committerDate')}</dt><dd>{formatDate(commit.committerDate)}</dd>
        {details !== undefined && (
          <>
            <dt>{t('details.committer')}</dt><dd>{details.committer} &lt;{details.committerEmail}&gt;</dd>
            <dt>{t('details.signature')}</dt><dd title={signatureText} data-signature-status={details.signature?.status}>{signatureText}</dd>
            {details.signature !== null && <><dt>{t('details.key')}</dt><dd className={css.mono}>{details.signature.key === null ? t('common.unknown')
              : <CopyButton value={details.signature.key} label={t('details.copyKey')} className={css.linkButton}>{details.signature.key}</CopyButton>}</dd></>}
          </>
        )}
        <dt>{t('details.parents')}</dt><dd className={css.mono}>{commit.parents.length === 0 ? t('details.root') : commit.parents.map(parent => <CopyButton key={parent} value={parent} label={t('common.copyHash')} className={css.linkButton}>{shortHash(parent)}</CopyButton>)}</dd>
        <dt>{t('details.refs')}</dt><dd><RefBadges refs={commit.refs} currentBranch={currentBranch} remotes={remotes} combine={display.combineReferences} /></dd>
      </dl>

      {details === undefined && detailsError === undefined && <div className={css.pending}>{t('details.loading')}</div>}
      {detailsError !== undefined && <div className={css.error} role="alert">{t('details.error', { message: detailsError })}<button type="button" className={css.secondaryButton} onClick={() => setRevision(current => current + 1)}>{t('common.retry')}</button></div>}

      {details !== undefined && details.body.length > 0 && (
        <details className={css.message} open={details.body.length < 600 && details.body.split('\n').length <= 8}>
          <summary>{t('details.message')}</summary><RichMessage text={details.body} formatted={display.richText} />
        </details>
      )}

      {details !== undefined && details.fileChanges.length > 0 && (
        <div className={css.fileChanges}>
          <div className={css.fileChangesHeaderRow}>
            <span className={css.fileChangesTitle}>{t('details.files', { count: details.fileChanges.length })}</span>
            <ViewToggle view={view} onChange={setView} />
          </div>
          <FileChangesView
            changes={details.fileChanges}
            view={view}
            onOpenFile={change => onOpenFile(commit.hash, change)}
          />
        </div>
      )}
    </aside>
  )
}

function DiffStatusBadge({ status }: { readonly status: GitGraphFileDiff['status'] }) {
  return <FileChangeStatus type={status} />
}

/** Shared line-by-line diff table used by commit and working-tree file views. */
function DiffBody({ diff }: { readonly diff: GitGraphFileDiff }) {
  const t = useText()
  return (
    <div className={css.diffViewer} data-diff-viewer>
      <div className={css.diffHeader} aria-hidden="true">
        <span className={css.diffLineNo}>{t('diff.old')}</span>
        <span className={css.diffLineNo}>{t('diff.new')}</span>
        <span className={css.diffMarker} />
        <span>{t('diff.content')}</span>
      </div>
      <div className={css.diffBody}>
        {displayHunks(diff.lines).map((hunk, hunkIndex) => <Fragment key={hunkIndex}>
          <div className={css.hunkHeader}>{hunk.header}</div>
          {hunk.lines.map((line, index) => (
          <div key={index} className={`${css.diffLine} ${line.type === 'added' ? css.diffAdded : line.type === 'removed' ? css.diffRemoved : css.diffContext}`} data-diff-type={line.type}>
            <span className={css.diffLineNo}>{line.oldLine ?? ''}</span>
            <span className={css.diffLineNo}>{line.newLine ?? ''}</span>
            <span className={css.diffMarker}>{line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}</span>
            <span className={css.diffContent}>{line.content}</span>
          </div>
          ))}
        </Fragment>)}
      </div>
    </div>
  )
}

/** Read the whole Git blob on demand; switching versions discards late replies. */
function FileSource({ hash, path, readFile }: {
  readonly hash: string
  readonly path: string
  readonly readFile: GitGraphViewInjected['readFile']
}) {
  const t = useText()
  const [content, setContent] = useState<GitGraphFileContent>()
  const [error, setError] = useState<string>()
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    setContent(undefined)
    setError(undefined)
    void readFile({ hash, path }, controller.signal).then(result => {
      if (cancelled) return
      if (result.ok) setContent(result.value)
      else setError(result.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true; controller.abort() }
  }, [hash, path, readFile, revision])

  // Two text nodes keep even a many-line, bounded blob from creating a DOM
  // element per line. Copy uses the untouched text, including its final newline.
  const lineNumbers = useMemo(() => {
    const text = content?.text
    if (text === undefined || text === null || text.length === 0) return ''
    const count = text.split('\n').length - (text.endsWith('\n') ? 1 : 0)
    return Array.from({ length: count }, (_, index) => index + 1).join('\n')
  }, [content?.text])

  return <div data-source-file data-source-hash={hash} data-source-path={path}>
    <div className={css.fileViewerToolbar}>
      <span className={`${css.fileViewerMeta} ${css.mono}`}>{t('source.version', { hash: shortHash(hash), path })}</span>
      {content !== undefined && <span className={css.fileViewerMeta}>{t('source.size', { size: content.size.toLocaleString() })}</span>}
      {content?.kind === 'text' && content.text !== null && <CopyButton value={content.text} label={t('source.copy')} hint={t('source.copy')} />}
    </div>
    {error !== undefined && <div className={css.error} role="alert">{t('source.error', { message: error })}<button type="button" className={css.secondaryButton} onClick={() => setRevision(current => current + 1)}>{t('common.retry')}</button></div>}
    {content === undefined && error === undefined && <div className={css.pending}>{t('source.loading')}</div>}
    {content?.truncated === true && <div className={css.pending}>{t('source.tooLarge', { size: content.size.toLocaleString() })}</div>}
    {content !== undefined && !content.truncated && (content.kind === 'binary' || content.text === null) && <div className={css.pending}>{t('source.binary')}</div>}
    {content?.kind === 'text' && !content.truncated && content.text !== null && (
      content.text.length === 0 ? <div className={css.pending}>{t('source.empty')}</div> :
        <div className={css.sourceViewer} data-source-viewer role="region" aria-label={t('source.aria')}>
          <pre className={css.sourceLineNumbers} aria-hidden="true">{lineNumbers}</pre>
          <pre className={css.sourceText} data-source-text tabIndex={0}>{content.text}</pre>
        </div>
    )}
  </div>
}

/** One historical viewer shared by a commit's changes and any selected pair. */
function FileViewer({ hash, baseHash, change, readFileDiff, readFile, onClose }: {
  readonly hash: string
  readonly baseHash: string | undefined
  readonly change: GitGraphFileChange
  readonly readFileDiff: GitGraphViewInjected['readFileDiff']
  readonly readFile: GitGraphViewInjected['readFile']
  readonly onClose: () => void
}) {
  const t = useText()
  const [diff, setDiff] = useState<GitGraphFileDiff>()
  const [error, setError] = useState<string>()
  const [revision, setRevision] = useState(0)
  const [mode, setMode] = useState<'diff' | 'source'>('diff')
  const [side, setSide] = useState<'base' | 'target'>('target')
  const path = change.newPath

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    setDiff(undefined)
    setError(undefined)
    void readFileDiff({ hash, path, ...(baseHash === undefined ? {} : { baseHash }) }, controller.signal).then(result => {
      if (cancelled) return
      if (result.ok) setDiff(result.value)
      else setError(result.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true; controller.abort() }
  }, [hash, baseHash, path, readFileDiff, revision])

  const hasChange = diff !== undefined && diff.lines.some(line => line.type !== 'context')
  const binaryLike = diff?.binary === true
  const baseExists = baseHash !== undefined && change.type !== 'A'
  const targetExists = change.type !== 'D'
  // A deletion has no target blob. Its complete source belongs to the base;
  // renamed files read the matching old/new path for each selected version.
  const sourceSide = targetExists ? side : 'base'
  const sourceHash = sourceSide === 'base' ? baseHash : hash
  const sourcePath = sourceSide === 'base' ? change.oldPath : change.newPath

  return (
    <div className={css.fileViewer} data-file-viewer>
      <div className={css.fileViewerHeader}>
        <span className={css.fileViewerTitle}>
          <DiffStatusBadge status={change.type} />
          <span className={css.mono} title={change.type === 'R' ? `${change.oldPath} → ${path}` : path}>{change.type === 'R' ? `${change.oldPath} → ${path}` : path}</span>
        </span>
        <span className={css.fileViewerMeta}>
          {mode === 'diff' && diff !== undefined && !diff.binary && `+${diff.additions} −${diff.deletions}`}
        </span>
        <CopyButton value={mode === 'source' ? sourcePath : path} label={t('common.copyPath')} />
        <button type="button" className={css.secondaryButton} onClick={onClose}>{t('common.close')}</button>
      </div>
      <div className={css.fileViewerToolbar}>
        <span className={css.viewToggle} role="group" aria-label={t('file.contentMode')}>
          <button type="button" aria-pressed={mode === 'diff'} className={mode === 'diff' ? `${css.viewToggleBtn} ${css.viewToggleActive}` : css.viewToggleBtn} onClick={() => setMode('diff')}>{t('file.diffMode')}</button>
          <button type="button" aria-pressed={mode === 'source'} className={mode === 'source' ? `${css.viewToggleBtn} ${css.viewToggleActive}` : css.viewToggleBtn} onClick={() => setMode('source')}>{t('source.mode')}</button>
        </span>
        {mode === 'source' && <span className={css.viewToggle} role="group" aria-label={t('source.side')}>
          <button type="button" aria-pressed={sourceSide === 'base'} disabled={!baseExists} title={!baseExists ? t('source.absent') : baseHash} className={sourceSide === 'base' ? `${css.viewToggleBtn} ${css.viewToggleActive}` : css.viewToggleBtn} onClick={() => setSide('base')}>{t('source.old')}</button>
          <button type="button" aria-pressed={sourceSide === 'target'} disabled={!targetExists} title={!targetExists ? t('source.absent') : hash} className={sourceSide === 'target' ? `${css.viewToggleBtn} ${css.viewToggleActive}` : css.viewToggleBtn} onClick={() => setSide('target')}>{t('source.new')}</button>
        </span>}
      </div>
      {mode === 'source' && (sourceHash === undefined ? <div className={css.pending}>{t('source.absent')}</div> :
        <FileSource key={`${sourceHash}:${sourcePath}`} hash={sourceHash} path={sourcePath} readFile={readFile} />)}
      {mode === 'diff' && error !== undefined && <div className={css.error} role="alert">{t('diff.error', { message: error })}<button type="button" className={css.secondaryButton} onClick={() => setRevision(current => current + 1)}>{t('common.retry')}</button></div>}
      {mode === 'diff' && diff === undefined && error === undefined && <div className={css.pending}>{t('diff.loading')}</div>}
      {mode === 'diff' && diff !== undefined && !hasChange && binaryLike && (
        <div className={css.pending}>{t('diff.binary')}</div>
      )}
      {mode === 'diff' && diff !== undefined && !hasChange && !binaryLike && (
        <div className={css.pending}>{t('diff.noChanges')}</div>
      )}
      {mode === 'diff' && diff !== undefined && hasChange && <DiffBody diff={diff} />}
    </div>
  )
}

function WorkingTreeChangesPanel({ changes, error, onClose, onOpenFile, onRetry }: {
  readonly changes: GitGraphWorkingTreeChanges | undefined
  readonly error: string | undefined
  readonly onClose: () => void
  readonly onOpenFile: (path: string) => void
  readonly onRetry: () => void
}) {
  const t = useText()
  const [view, setView] = useState<FileListKind>('tree')
  return (
    <div className={css.workingTreePanel} data-working-tree-panel>
      <div className={css.workingTreeHeader}>
        <span className={css.fileViewerTitle}>{t('worktree.title')}{changes !== undefined ? ` (${changes.changes.length})` : ''}</span>
        <ViewToggle view={view} onChange={setView} />
        <button type="button" className={css.secondaryButton} onClick={onClose}>{t('common.close')}</button>
      </div>
      {error !== undefined && <div className={css.error} role="alert">{t('worktree.error', { message: error })}<button type="button" className={css.secondaryButton} onClick={onRetry}>{t('common.retry')}</button></div>}
      {changes === undefined && error === undefined && <div className={css.pending}>{t('worktree.loading')}</div>}
      {changes !== undefined && changes.changes.length === 0 && <div className={css.pending}>{t('worktree.empty')}</div>}
      {changes !== undefined && changes.changes.length > 0 && (
        <FileChangesView
          changes={changes.changes}
          view={view}
          onOpenFile={change => onOpenFile(change.newPath)}
        />
      )}
    </div>
  )
}

function WorkingTreeFileViewer({ path, readWorkingTreeFile, onClose }: {
  readonly path: string
  readonly readWorkingTreeFile: GitGraphViewInjected['readWorkingTreeFile']
  readonly onClose: () => void
}) {
  const t = useText()
  const [diff, setDiff] = useState<GitGraphFileDiff>()
  const [error, setError] = useState<string>()
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    setDiff(undefined)
    setError(undefined)
    void readWorkingTreeFile({ path }, controller.signal).then(result => {
      if (cancelled) return
      if (result.ok) setDiff(result.value)
      else setError(result.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true; controller.abort() }
  }, [path, readWorkingTreeFile, revision])

  const hasChange = diff !== undefined && diff.lines.some(line => line.type !== 'context')
  const binaryLike = diff?.binary === true

  return (
    <div className={css.fileViewer} data-working-tree-file-viewer>
      <div className={css.fileViewerHeader}>
        <span className={css.fileViewerTitle}>
          {diff !== undefined && <DiffStatusBadge status={diff.status} />}
          <span className={css.mono} title={path}>{diff?.status === 'R' ? `${diff.oldPath} → ${path}` : path}</span>
        </span>
        <span className={css.fileViewerMeta}>
          {diff !== undefined && !diff.binary && `${t('worktree.label')} · +${diff.additions} −${diff.deletions}`}
        </span>
        <CopyButton value={path} label={t('common.copyPath')} />
        <button type="button" className={css.secondaryButton} onClick={onClose}>{t('common.close')}</button>
      </div>
      {error !== undefined && <div className={css.error} role="alert">{t('worktree.diffError', { message: error })}<button type="button" className={css.secondaryButton} onClick={() => setRevision(current => current + 1)}>{t('common.retry')}</button></div>}
      {diff === undefined && error === undefined && <div className={css.pending}>{t('worktree.diffLoading')}</div>}
      {diff !== undefined && !hasChange && binaryLike && (
        <div className={css.pending}>{t('diff.binary')}</div>
      )}
      {diff !== undefined && !hasChange && !binaryLike && (
        <div className={css.pending}>{t('worktree.noChanges')}</div>
      )}
      {diff !== undefined && hasChange && <DiffBody diff={diff} />}
    </div>
  )
}

function ComparePanel({ targetHash, commits, compare, readFileDiff, readFile, onClose, readRevision }: {
  readonly targetHash: string
  readonly commits: readonly GitGraphCommit[]
  readonly compare: GitGraphViewInjected['compare']
  readonly readFileDiff: GitGraphViewInjected['readFileDiff']
  readonly readFile: GitGraphViewInjected['readFile']
  readonly onClose: () => void
  readonly readRevision: number
}) {
  const t = useText()
  const [baseHash, setBaseHash] = useState<string>(commits.find(commit => commit.hash !== targetHash)?.hash ?? '')
  const [result, setResult] = useState<GitGraphCompareResult>()
  const [error, setError] = useState<string>()
  const [file, setFile] = useState<GitGraphFileChange>()
  const [view, setView] = useState<FileListKind>('list')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    setResult(undefined)
    setError(undefined)
    setFile(undefined)
    if (baseHash.length === 0 || baseHash === targetHash) return
    let cancelled = false
    const controller = new AbortController()
    void compare({ baseHash, targetHash }, controller.signal).then(res => {
      if (cancelled) return
      if (res.ok) setResult(res.value)
      else setError(res.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true; controller.abort() }
  }, [baseHash, targetHash, compare, revision, readRevision])

  return (
    <div className={css.comparePanel} data-compare-panel>
      <div className={css.compareRow}>
        <span className={css.fileViewerTitle}>{t('compare.title')}</span>
        <select className={`${css.select} ${css.selectWide}`} value={baseHash} onChange={event => {
          // Remove old-range files immediately, before the next request effect.
          setFile(undefined)
          setResult(undefined)
          setError(undefined)
          setBaseHash(event.target.value)
        }} aria-label={t('compare.base')}>
          {commits.map(commit => (
            <option key={commit.hash} value={commit.hash}>
              {shortHash(commit.hash)} · {commit.subject || t('common.noSubject')}
            </option>
          ))}
        </select>
        <button type="button" className={css.secondaryButton} onClick={onClose}>{t('common.close')}</button>
      </div>
      {baseHash.length > 0 && baseHash !== targetHash && <div className={`${css.compareHint} ${css.mono}`} data-compare-range>{t('compare.range', { base: shortHash(baseHash), target: shortHash(targetHash) })}</div>}
      {baseHash === targetHash && <div className={css.compareHint}>{t('compare.selectDifferent')}</div>}
      {baseHash.length > 0 && baseHash !== targetHash && result === undefined && error === undefined && <div className={css.pending}>{t('compare.loading')}</div>}
      {error !== undefined && <div className={css.error} role="alert">{t('compare.error', { message: error })}<button type="button" className={css.secondaryButton} onClick={() => setRevision(current => current + 1)}>{t('common.retry')}</button></div>}
      {result !== undefined && (
        <div className={css.fileChanges}>
          <div className={css.fileChangesHeaderRow}>
            <span className={css.fileChangesTitle}>{t('compare.files', { count: result.changes.length })}</span>
            <ViewToggle view={view} onChange={setView} />
          </div>
          {result.changes.length === 0 && <div className={css.compareHint}>{t('compare.empty')}</div>}
          <FileChangesView changes={result.changes} view={view} onOpenFile={change => setFile(change)} />
          {file !== undefined && <FileViewer key={`${baseHash}:${targetHash}:${file.newPath}`} hash={targetHash} baseHash={baseHash}
            change={file} readFileDiff={readFileDiff} readFile={readFile} onClose={() => setFile(undefined)} />}
        </div>
      )}
    </div>
  )
}

function Avatar({ email, name, avatar }: { readonly email: string; readonly name: string; readonly avatar: GitGraphAvatar | undefined }) {
  const t = useText()
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [avatar?.image])
  // The deterministic initials remain visible while loading and after failure.
  const palette = ['#0085d9', '#d9008f', '#00a86b', '#d98500', '#7b4bc4', '#d9a800', '#008a7a']
  let seed = 0
  for (const char of email) seed = (seed * 31 + char.charCodeAt(0)) >>> 0
  const colour = palette[seed % palette.length]
  const initial = (name.trim().charAt(0) || '?').toLocaleUpperCase()
  const image = !failed && avatar?.image ? avatar.image : undefined
  // "Not loaded yet" and "this email has no public avatar" look the same on
  // screen, so only the second one explains itself on hover.
  const missing = image === undefined && avatar !== undefined && avatar.image === null
  const provider = avatar?.provider === 'github' ? 'GitHub' : avatar?.provider === 'host' ? t('avatar.providerHost') : 'Gravatar'
  const title = image !== undefined
    ? t('avatar.source', { provider })
    : missing ? t('avatar.missing', { email, name }) : name
  return <span className={css.avatar} style={{ background: colour }} aria-hidden="true" title={title}
    data-avatar-provider={image === undefined ? 'initials' : avatar?.provider}>
    {image === undefined ? initial : <img src={image} alt="" loading="lazy" onError={() => setFailed(true)} />}
  </span>
}

function MetadataStrip({ readMetadata, readRevision }: { readonly readMetadata: GitGraphViewInjected['metadata']; readonly readRevision: number }) {
  const t = useText()
  const [open, setOpen] = useState(false)
  const [metadata, setMetadata] = useState<GitGraphMetadata>()
  const [error, setError] = useState<string>()
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setMetadata(undefined)
    setError(undefined)
    void readMetadata(controller.signal).then(result => {
      if (controller.signal.aborted) return
      if (result.ok) setMetadata(result.value)
      else setError(result.error.message)
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => controller.abort()
  }, [open, readMetadata, readRevision, revision])

  return (
    <details className={css.metadataStrip} onToggle={event => setOpen(event.currentTarget.open)}>
      <summary>{t('metadata.tags')}{metadata === undefined ? '' : ` (${metadata.tags.length})`} · {t('metadata.stashes')}{metadata === undefined ? '' : ` (${metadata.stashes.length})`}</summary>
      {error !== undefined && <div role="status">{t('metadata.error', { message: error })}<button type="button" className={css.linkButton} onClick={() => setRevision(current => current + 1)}>{t('common.retry')}</button></div>}
      {metadata === undefined && error === undefined && <div>{t('metadata.loading')}</div>}
      {metadata !== undefined && metadata.tags.length === 0 && metadata.stashes.length === 0 && <div>{t('metadata.empty')}</div>}
      {metadata !== undefined && <>
        {metadata.tags.length > 0 && (
          <div className={css.metadataGroup}>
            <span className={css.metadataLabel}>{t('metadata.tags')}</span>
            {metadata.tags.map(tag => (
              <span key={tag.name} className={css.metaTag} title={tag.annotated ? `${tag.detail?.objectHash ?? ''} · ${tag.detail?.tagger ?? ''}` : t('metadata.lightweight')}>
                <CopyButton value={tag.name} label={t('refs.copy', { name: tag.name })} className={css.metaCopy}>{tag.name}{tag.annotated ? ' ⚑' : ''}</CopyButton>
              </span>
            ))}
          </div>
        )}
        {metadata.stashes.length > 0 && (
          <div className={css.metadataGroup}>
            <span className={css.metadataLabel}>{t('metadata.stashes')}</span>
            {metadata.stashes.map(stash => (
              <span key={stash.selector} className={css.metaStash} title={`${stash.message} · ${stash.author}`}>
                <CopyButton value={stash.selector} label={t('refs.copy', { name: stash.selector })} className={css.metaCopy}>{stash.selector}</CopyButton>
              </span>
            ))}
          </div>
        )}
      </>}
    </details>
  )
}

/** Pointer capture keeps a drag local and cleans up when this header unmounts. */
function ColumnResizer({ column, width, onChange }: {
  readonly column: CommitColumn; readonly width: number; readonly onChange: (column: CommitColumn, width: number) => void
}) {
  const t = useText()
  const drag = useRef<{ x: number; width: number }>()
  const handleRef = useRef<HTMLSpanElement>(null)
  const [actualWidth, setActualWidth] = useState(width)
  useLayoutEffect(() => {
    const cell = handleRef.current?.parentElement
    if (cell === undefined || cell === null) return
    const measure = () => setActualWidth(Math.round(cell.getBoundingClientRect().width))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(cell)
    return () => observer.disconnect()
  }, [width])
  const label = t(column === 'hash' ? 'column.commit' : `column.${column}`)
  return <span ref={handleRef} className={css.columnResize} role="separator" tabIndex={0} aria-orientation="vertical"
    aria-label={t('column.resize', { column: label })} title={t('column.resize', { column: label })}
    aria-valuemin={COLUMN_LIMITS[column][0]} aria-valuemax={COLUMN_LIMITS[column][1]} aria-valuenow={actualWidth}
    onPointerDown={event => { event.preventDefault(); drag.current = { x: event.clientX, width: actualWidth }; event.currentTarget.setPointerCapture(event.pointerId) }}
    onPointerMove={event => { if (drag.current !== undefined) onChange(column, drag.current.width + event.clientX - drag.current.x) }}
    onPointerUp={event => { drag.current = undefined; event.currentTarget.releasePointerCapture(event.pointerId) }}
    onPointerCancel={() => { drag.current = undefined }} onLostPointerCapture={() => { drag.current = undefined }}
    onDoubleClick={() => onChange(column, DEFAULT_DISPLAY_SETTINGS.columnWidths[column])}
    onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); onChange(column, actualWidth + (event.key === 'ArrowRight' ? 10 : -10)) } }} />
}

/**
 * Settings are grouped by the question they answer, not by the order the fields
 * happen to exist: one section per decision keeps a flat run of fifteen
 * controls from reading as a wall.
 */
function SettingsSection({ title, className = '', children }: {
  readonly title: string
  readonly className?: string
  readonly children: ReactNode
}) {
  return (
    <div className={`${css.settingsSection} ${className}`.trim()} role="group" aria-label={title}>
      <span className={css.settingsSectionTitle}>{title}</span>
      {children}
    </div>
  )
}

/** One labelled select: the caption keeps a shared width, the control fills the rest. */
function SettingsSelect<T extends string>({ label, value, options, onChange }: {
  readonly label: string
  readonly value: T
  readonly options: ReadonlyArray<readonly [T, string]>
  readonly onChange: (value: T) => void
}) {
  return (
    <label className={css.settingsField}>
      <span className={css.settingsLabel}>{label}</span>
      <select className={`${css.select} ${css.settingsControl}`} value={value} onChange={event => onChange(event.target.value as T)}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  )
}

function SettingsToggle({ label, checked, onChange }: {
  readonly label: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
}) {
  return (
    <label className={css.settingsCheck}>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function SettingsPanel({ settings, onChange, onClose, diagnostics }: {
  readonly settings: GitGraphDisplaySettings
  readonly onChange: (next: GitGraphDisplaySettings) => void
  readonly onClose: () => void
  /** Which bundle is running and what geometry it measured; `undefined` hides it. */
  readonly diagnostics?: string
}) {
  const t = useText()
  return (
    <div className={css.settingsPanel} data-settings-panel>
      <SettingsSection title={t('settings.groupRefs')}>
        <SettingsSelect label={t('settings.referenceAlignment')} value={settings.referenceAlignment}
          options={[['normal', t('settings.refsNormal')], ['tags-right', t('settings.refsTagsRight')], ['graph', t('settings.refsGraph')]] as const}
          onChange={referenceAlignment => onChange({ ...settings, referenceAlignment })} />
        <SettingsToggle label={t('settings.combineReferences')} checked={settings.combineReferences}
          onChange={combineReferences => onChange({ ...settings, combineReferences })} />
      </SettingsSection>
      <SettingsSection title={t('settings.groupDate')}>
        <SettingsSelect label={t('settings.dateSource')} value={settings.dateSource}
          options={[['author', t('details.authorDate')], ['committer', t('details.committerDate')]] as const}
          onChange={dateSource => onChange({ ...settings, dateSource })} />
        <SettingsSelect label={t('settings.dateFormat')} value={settings.dateFormat}
          options={[['short', t('settings.short')], ['full', t('settings.full')], ['local', t('settings.local')]] as const}
          onChange={dateFormat => onChange({ ...settings, dateFormat })} />
      </SettingsSection>
      <SettingsSection title={t('settings.groupAuthor')}>
        <SettingsToggle label={t('settings.showAvatars')} checked={settings.showAvatars}
          onChange={showAvatars => onChange({ ...settings, showAvatars })} />
        <SettingsSelect label={t('settings.avatarSource')} value={settings.avatarSource}
          options={[['auto', t('settings.avatarAuto')], ['gravatar', t('settings.avatarGravatar')]] as const}
          onChange={avatarSource => onChange({ ...settings, avatarSource })} />
      </SettingsSection>
      <SettingsSection title={t('settings.groupColumns')}>
        <div className={css.settingsToggles}>
          <SettingsToggle label={t('settings.showDate')} checked={settings.showDate}
            onChange={showDate => onChange({ ...settings, showDate })} />
          <SettingsToggle label={t('settings.showAuthor')} checked={settings.showAuthor}
            onChange={showAuthor => onChange({ ...settings, showAuthor })} />
          <SettingsToggle label={t('settings.showHash')} checked={settings.showHash}
            onChange={showHash => onChange({ ...settings, showHash })} />
          <SettingsToggle label={t('settings.richText')} checked={settings.richText}
            onChange={richText => onChange({ ...settings, richText })} />
        </div>
      </SettingsSection>
      <SettingsSection title={t('settings.groupGraph')} className={css.settingsWide}>
        <div className={css.settingsInline}>
          <SettingsSelect label={t('settings.graphStyle')} value={settings.graphStyle}
            options={[['full', t('settings.full')], ['compact', t('settings.compact')]] as const}
            onChange={graphStyle => onChange({ ...settings, graphStyle })} />
          <SettingsSelect label={t('settings.lineStyle')} value={settings.lineStyle}
            options={[['curved', t('settings.curved')], ['straight', t('settings.straight')]] as const}
            onChange={lineStyle => onChange({ ...settings, lineStyle })} />
          <SettingsSelect label={t('settings.palette')} value={settings.palette}
            options={[['classic', t('settings.classic')], ['accessible', t('settings.accessible')]] as const}
            onChange={palette => onChange({ ...settings, palette })} />
        </div>
      </SettingsSection>
      <p className={css.settingsNote}>{t('settings.avatarHint')}</p>
      {diagnostics !== undefined && <p className={`${css.settingsNote} ${css.mono}`} data-build-id>{diagnostics}</p>}
      <div className={css.settingsActions}>
        <button type="button" className={css.secondaryButton} onClick={() => onChange(DEFAULT_DISPLAY_SETTINGS)}>{t('settings.reset')}</button>
        <button type="button" className={css.secondaryButton} onClick={onClose}>{t('settings.close')}</button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Chrome: icons, one sheet shell, and the panels that replace the old
 * inline control wall. Sheets cover the graph instead of pushing it down.
 * ------------------------------------------------------------------ */

function BranchGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4.5 4.4v7.2" />
        <path d="M4.5 8.2h3a2.4 2.4 0 0 1 2.4 2.4v.6" />
      </g>
      <circle cx="4.5" cy="3" r="1.6" fill="currentColor" />
      <circle cx="4.5" cy="13" r="1.6" fill="currentColor" />
      <circle cx="9.9" cy="13" r="1.6" fill="currentColor" />
    </svg>
  )
}

function ChevronGlyph({ direction = 'down' }: { readonly direction?: 'up' | 'down' }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d={direction === 'up' ? 'M2 6.5 5 3.5 8 6.5' : 'M2 3.5 5 6.5 8 3.5'} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.6 2.6 9.4 9.4M9.4 2.6 2.6 9.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function FunnelGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 3.2h12L9.4 8.4v4.2l-2.8 1.2V8.4L2 3.2Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

function SearchGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.2 10.2 13.4 13.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function RefreshGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M13 8a5 5 0 1 1-1.7-3.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.2 2.6v3.2H10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SlidersGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M2.6 4.6h10.8M2.6 11.4h10.8" />
      </g>
      <circle cx="6" cy="4.6" r="1.9" fill="var(--git-graph-bg)" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10.4" cy="11.4" r="1.9" fill="var(--git-graph-bg)" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

/**
 * A surface that hangs under the bar it belongs to.
 *
 * Nothing in this panel takes the graph over: a menu chooses one row, and the
 * settings form is a live preview — the list behind it is what the options act
 * on. `tall` only raises the height limit for the form.
 */
function Dropdown({ label, tall = false, children }: {
  readonly label: string
  readonly tall?: boolean
  readonly children: ReactNode
}) {
  return (
    <div className={tall ? `${css.dropdown} ${css.dropdownTall}` : css.dropdown} role="dialog" aria-label={label} data-git-graph-dropdown>
      {children}
    </div>
  )
}

/**
 * Read-only branch navigation. Selecting a branch focuses exactly that branch
 * and jumps to its tip, so the graph answers "what is on this branch" without
 * ever running a write command or touching the working tree.
 */
function BranchMenu({ branches, focused, onSelect, onShowAll }: {
  readonly branches: readonly GitGraphBranch[]
  readonly focused: string | undefined
  readonly onSelect: (branch: GitGraphBranch) => void
  readonly onShowAll: () => void
}) {
  const t = useText()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLocaleLowerCase()
  const matches = (branch: GitGraphBranch) => needle.length === 0 || branch.name.toLocaleLowerCase().includes(needle)
  const local = branches.filter(branch => branch.kind === 'local' && matches(branch))
  const remote = branches.filter(branch => branch.kind === 'remote' && matches(branch))
  const row = (branch: GitGraphBranch) => (
    <li key={`${branch.kind}:${branch.name}`}>
      <button
        type="button"
        data-current={branch.isCurrent}
        title={t('branch.jump', { name: branch.name })}
        className={branch.name === focused ? `${css.branchRow} ${css.branchRowActive}` : css.branchRow}
        onClick={() => onSelect(branch)}
      >
        <span className={css.branchRowName}>{branch.name}</span>
        {branch.isCurrent && <span className={css.branchRowBadge}>{t('branch.current')}</span>}
        <span className={css.branchRowMeta}>{shortHash(branch.hash)}</span>
      </button>
    </li>
  )
  return (
    <Dropdown label={t('branch.title')}>
      {branches.length > 0 && (
        <input className={css.branchSearch} type="search" value={query} onChange={event => setQuery(event.target.value)}
          placeholder={t('branch.search')} aria-label={t('branch.search')} autoFocus />
      )}
      <ul className={css.branchList}>
        {focused !== undefined && (
          <li>
            <button type="button" className={css.branchRow} onClick={onShowAll} title={t('branch.showAll')}>
              <span className={css.branchRowName}>{t('branch.showAll')}</span>
              <CloseGlyph />
            </button>
          </li>
        )}
        {local.length > 0 && <li className={css.sheetGroupTitle}>{t('branch.local')}</li>}
        {local.map(row)}
        {remote.length > 0 && <li className={css.sheetGroupTitle}>{t('branch.remote')}</li>}
        {remote.map(row)}
        {local.length === 0 && remote.length === 0 && (
          <li className={css.sheetNote}>{branches.length === 0 ? t('branch.empty') : t('find.noMatches')}</li>
        )}
      </ul>
    </Dropdown>
  )
}

/** Ref type, ordering and the raw glob live together, away from the graph. */
function FilterMenu({ refFilter, sort, includeAll, firstParent, branchGlob, onRefFilter, onSort, onIncludeAll, onFirstParent, onBranchGlob, onReset, onClose }: {
  readonly refFilter: RefFilter
  readonly sort: 'date' | 'author-date' | 'topological'
  readonly includeAll: boolean
  readonly firstParent: boolean
  readonly branchGlob: string
  readonly onRefFilter: (value: RefFilter) => void
  readonly onSort: (value: 'date' | 'author-date' | 'topological') => void
  readonly onIncludeAll: (value: boolean) => void
  readonly onFirstParent: (value: boolean) => void
  readonly onBranchGlob: (value: string) => void
  readonly onReset: () => void
  readonly onClose: () => void
}) {
  const t = useText()
  return (
    <Dropdown label={t('filter.title')}>
      <div className={css.dropdownBody}>
        <div className={css.sheetGroup}>
          <label className={css.sheetField}>
            <span className={css.sheetLabel}>{t('toolbar.refFilter')}</span>
            <select className={`${css.select} ${css.sheetControl}`} value={refFilter} onChange={event => onRefFilter(event.target.value as RefFilter)}>
              <option value="all">{t('toolbar.allRefs')}</option>
              <option value="head">{t('toolbar.localBranches')}</option>
              <option value="remote">{t('toolbar.remoteBranches')}</option>
              <option value="tag">{t('metadata.tags')}</option>
            </select>
          </label>
          <label className={css.sheetField}>
            <span className={css.sheetLabel}>{t('toolbar.sort')}</span>
            <select className={`${css.select} ${css.sheetControl}`} value={sort} onChange={event => onSort(event.target.value as 'date' | 'author-date' | 'topological')}>
              <option value="date">{t('toolbar.sortDate')}</option>
              <option value="author-date">{t('toolbar.sortAuthorDate')}</option>
              <option value="topological">{t('toolbar.sortTopological')}</option>
            </select>
          </label>
        </div>
        <div className={css.sheetGroup}>
          <label className={css.sheetField}>
            <span className={css.sheetLabel}>{t('filter.advanced')}</span>
            <input className={`${css.search} ${css.sheetControl}`} type="text" value={branchGlob}
              onChange={event => onBranchGlob(event.target.value)} placeholder={t('toolbar.branchPlaceholder')} aria-label={t('toolbar.branch')} />
          </label>
        </div>
        <div className={css.sheetGroup}>
          <label className={css.check}><input type="checkbox" checked={includeAll} onChange={event => onIncludeAll(event.target.checked)} />{t('toolbar.includeAll')}</label>
          <label className={css.check}><input type="checkbox" checked={firstParent} onChange={event => onFirstParent(event.target.checked)} />{t('toolbar.firstParent')}</label>
        </div>
        <p className={css.sheetNote}>{t('filter.hint')}</p>
      </div>
      <div className={css.sheetFooter}>
        <button type="button" className={css.secondaryButton} onClick={onReset}>{t('filter.reset')}</button>
        <button type="button" className={css.secondaryButton} onClick={onClose}>{t('common.close')}</button>
      </div>
    </Dropdown>
  )
}

/** Compact find controls: the count and three actions share one row. */
function FindBar({ count, index, onPrev, onNext, onClear }: {
  readonly count: number
  readonly index: number
  readonly onPrev: () => void
  readonly onNext: () => void
  readonly onClear: () => void
}) {
  const t = useText()
  return (
    <span className={css.findBar} data-find-bar>
      <span className={css.findCount}>{count === 0 ? t('find.noMatches') : `${index + 1}/${count}`}</span>
      <button type="button" className={css.iconButton} onClick={onPrev} disabled={count === 0} title={t('find.previous')} aria-label={t('find.previous')}><ChevronGlyph direction="up" /></button>
      <button type="button" className={css.iconButton} onClick={onNext} disabled={count === 0} title={t('find.next')} aria-label={t('find.next')}><ChevronGlyph direction="down" /></button>
      <button type="button" className={css.iconButton} onClick={onClear} title={t('find.clear')} aria-label={t('find.clear')}><CloseGlyph /></button>
    </span>
  )
}

export function GitGraphView(props: Props) {
  return <TextContext.Provider value={props.t}><GitGraphContent {...props} /></TextContext.Provider>
}

function GitGraphContent({ read, readCommit, readFile, readFileDiff, readWorkingTree, readWorkingTreeFile, compare, metadata, avatars: readAvatars }: Props) {
  const t = useText()
  const [snapshot, setSnapshot] = useState<GitGraphSnapshot | undefined>()
  const [selectedHash, setSelectedHash] = useState<string>()
  const [searchText, setSearchText] = useState('')
  // The emitted search reaches the Host (bounded scan); keep a debounced copy.
  const [search, setSearch] = useState('')
  const [refFilter, setRefFilter] = useState<RefFilter>('all')
  const [maxCommits, setMaxCommits] = useState(PAGE_SIZE)
  const [includeAll, setIncludeAll] = useState(true)
  const [firstParent, setFirstParent] = useState(false)
  const [branchGlob, setBranchGlob] = useState('')
  const [sort, setSort] = useState<'date' | 'author-date' | 'topological'>('date')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [viewingFile, setViewingFile] = useState<{ hash: string; change: GitGraphFileChange }>()
  const [compareTarget, setCompareTarget] = useState<string>()
  const [showWorkingTree, setShowWorkingTree] = useState(false)
  const [workingTreeChanges, setWorkingTreeChanges] = useState<GitGraphWorkingTreeChanges>()
  const [workingTreeError, setWorkingTreeError] = useState<string>()
  const [workingTreeFile, setWorkingTreeFile] = useState<string>()
  const [readRevision, setReadRevision] = useState(0)
  const [display, setDisplay] = useState<GitGraphDisplaySettings>(DEFAULT_DISPLAY_SETTINGS)
  const [sheet, setSheet] = useState<SheetKind>()
  // Exact branch focus: the graph shows one branch without any write command.
  const [focusedBranch, setFocusedBranch] = useState<string>()
  const [findOpen, setFindOpen] = useState(false)
  const [findText, setFindText] = useState('')
  const [findCase, setFindCase] = useState(false)
  const [findRegex, setFindRegex] = useState(false)
  const [findIndex, setFindIndex] = useState(0)
  const [hoveredHash, setHoveredHash] = useState<string>()
  const [navigationHint, setNavigationHint] = useState<string>()
  const sectionRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [settingsRepo, setSettingsRepo] = useState<string>()
  // Rows are measured, not assumed to be one line tall: a commit with many
  // references wraps its labels, so the graph column follows the real boxes.
  const listRef = useRef<HTMLDivElement>(null)
  /** Last measurement outcome, surfaced in the settings sheet for diagnosis. */
  const measureLog = useRef('未测量')
  const [measured, setMeasured] = useState<{ key: string; metrics: RowMetrics }>()
  // Only the newest query may replace the graph, including after unmount.
  const querySequence = useRef(0)
  const queryController = useRef<AbortController>()
  const loadedPath = useRef<string>()
  const authorAvatars = useAvatars(snapshot?.commits ?? NO_COMMITS, snapshot?.path, display.avatarSource,
    display.showAvatars && settingsRepo === snapshot?.path, readAvatars)
  const findError = useMemo(() => {
    if (!findRegex || findText.length === 0) return undefined
    try { new RegExp(findText); return undefined } catch { return t('find.invalidRegex') }
  }, [findRegex, findText, t])

  const load = useCallback(async (request: GitGraphQuery) => {
    const sequence = ++querySequence.current
    queryController.current?.abort()
    const controller = new AbortController()
    queryController.current = controller
    setLoading(true)
    setError(undefined)
    try {
      const result = await read(request, controller.signal)
      if (sequence !== querySequence.current) return
      if (!result.ok) throw new Error(result.error.message)
      const firstRead = loadedPath.current !== result.value.path
      loadedPath.current = result.value.path
      setSnapshot(result.value)
      // Undefined can mean the user is reading the working tree or has closed
      // details. Refresh must preserve that choice, rather than open row one.
      setSelectedHash(current => result.value.commits.some(commit => commit.hash === current)
        ? current : firstRead ? result.value.commits[0]?.hash : undefined)
    } catch (cause: unknown) {
      if (sequence === querySequence.current) setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      if (sequence === querySequence.current) setLoading(false)
    }
  }, [read])

  const buildRequest = useCallback((max: number, emittedSearch: string): GitGraphQuery => {
    const globs = branchGlob.split(',').map(item => item.trim()).filter(item => item.length > 0)
    return {
      maxCommits: max,
      ...(includeAll === true ? {} : { all: false }),
      ...(firstParent === true ? { firstParent: true } : {}),
      ...(globs.length > 0 ? { glob: globs } : {}),
      ...(focusedBranch === undefined ? {} : { branches: [focusedBranch] }),
      ...(emittedSearch.length > 0 ? { search: emittedSearch } : {}),
      sort,
    }
  }, [branchGlob, firstParent, focusedBranch, includeAll, sort])

  const refresh = useCallback(() => {
    setReadRevision(current => current + 1)
    void load(buildRequest(maxCommits, search))
  }, [load, buildRequest, maxCommits, search])

  useEffect(() => {
    void load(buildRequest(maxCommits, search))
  }, [load, buildRequest, maxCommits, search])

  useEffect(() => () => { querySequence.current += 1; queryController.current?.abort() }, [read])

  // Load the uncommitted-changes list when the working-tree panel is opened.
  useEffect(() => {
    if (!showWorkingTree) return
    let cancelled = false
    const controller = new AbortController()
    setWorkingTreeChanges(undefined)
    setWorkingTreeError(undefined)
    void readWorkingTree(controller.signal).then(result => {
      if (cancelled) return
      if (result.ok) setWorkingTreeChanges(result.value)
      else setWorkingTreeError(result.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setWorkingTreeError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true; controller.abort() }
  }, [showWorkingTree, readWorkingTree, readRevision])

  // Debounce only text; sorting and branch filters preserve the emitted query.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim())
      setMaxCommits(PAGE_SIZE)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchText])

  // A new branch scope always starts from the first page again.
  useEffect(() => { setMaxCommits(PAGE_SIZE) }, [branchGlob, focusedBranch])

  const visibleCommits = useMemo(() => {
    if (snapshot === undefined) return []
    return snapshot.commits.filter(commit => refMatches(commit, refFilter))
  }, [refFilter, snapshot])
  const layout = useMemo(() => layoutGraph(visibleCommits), [visibleCommits])
  const canLoadMore = snapshot !== undefined && snapshot.state === 'ready' && snapshot.hasMore && maxCommits < MAX_COMMITS
  const hasGraphRows = snapshot !== undefined && (visibleCommits.length > 0 || snapshot.workingTree.changed)

  // Only one inline expansion is open at a time (like vscode-git-graph):
  // either the working-tree panel or a commit's details view.
  const selectCommit = (hash: string) => {
    if (hash === selectedHash) {
      setSelectedHash(undefined)
      return
    }
    if (viewingFile !== undefined) setViewingFile(undefined)
    if (compareTarget !== undefined) setCompareTarget(undefined)
    setShowWorkingTree(false)
    setWorkingTreeFile(undefined)
    setSelectedHash(hash)
  }
  const toggleWorkingTree = () => {
    setViewingFile(undefined)
    setCompareTarget(undefined)
    setSelectedHash(undefined)
    setShowWorkingTree(current => !current)
  }

  // Focusing a branch is a read-only navigation: it narrows the query to that
  // exact branch and selects its tip. Nothing is checked out or written.
  const selectBranch = (branch: GitGraphBranch) => {
    // Choosing the branch that is already focused changes no state, so nothing
    // would reload; treat the click as an explicit refresh instead of a no-op.
    const alreadyFocused = branch.name === focusedBranch
    setFocusedBranch(branch.name)
    setBranchGlob('')
    setRefFilter('all')
    setSearchText('')
    setSearch('')
    setMaxCommits(PAGE_SIZE)
    setViewingFile(undefined)
    setCompareTarget(undefined)
    setShowWorkingTree(false)
    setSelectedHash(branch.hash)
    setSheet(undefined)
    if (alreadyFocused) void refresh()
  }
  const clearBranchFocus = () => {
    setFocusedBranch(undefined)
    setMaxCommits(PAGE_SIZE)
  }
  // The badge counts only the filters that live in the filter sheet; branch
  // focus has its own visible line, so counting it twice would mislead.
  const activeFilterCount = (refFilter === 'all' ? 0 : 1)
    + (sort === 'date' ? 0 : 1)
    + (includeAll ? 0 : 1)
    + (firstParent ? 1 : 0)
    + (branchGlob.trim().length === 0 ? 0 : 1)

  const rowHeight = graphRowHeight(display)
  const workingTreeChanged = snapshot?.workingTree.changed === true
  const metricKey = `${layout.nodes.length}:${workingTreeChanged ? 1 : 0}`
  // Until the current rows have been measured, draw with uniform rows. The
  // layout effect measures before paint, so this is never visible for long.
  const measuredOk = measured !== undefined && measured.key === metricKey && measured.metrics.rows.length === layout.nodes.length
  const rowMetrics = measured !== undefined && measuredOk
    ? measured.metrics
    : uniformRowMetrics(layout.nodes.length, workingTreeChanged, rowHeight)

  // Measure every row (including the working-tree row and any open inline
  // panel) so the SVG and the graph-aligned labels track the real list.
  useLayoutEffect(() => {
    const list = listRef.current
    if (list === null) { measureLog.current = '列表未挂载'; return undefined }
    /**
     * Re-read every rendered row box. The returned signature lets the settle
     * loop below stop as soon as two consecutive passes agree; an empty
     * signature means the rows were not all in the DOM yet, so the pass is
     * skipped instead of publishing a mix of real and guessed boxes.
     *
     * Rows are read from the DOM in document order rather than from a ref
     * array: an inline ref callback is detached and re-attached on every
     * render, so a pass that runs mid-churn would see nulls for rows that are
     * on screen, publish nothing, and leave the graph on stale geometry.
     */
    const measure = (): string => {
      const listRect = list.getBoundingClientRect()
      const elements = list.querySelectorAll<HTMLElement>('[data-commit-hash]')
      if (elements.length !== layout.nodes.length) {
        measureLog.current = `行数不符 ${elements.length}/${layout.nodes.length}`
        return ''
      }
      const rows: RowBox[] = []
      for (const element of elements) {
        const rect = element.getBoundingClientRect()
        rows.push({ top: Math.round(rect.top - listRect.top), height: Math.round(rect.height) })
      }
      const workingTreeElement = list.querySelector<HTMLElement>('[data-worktree-row]')
      const workingTreeRect = workingTreeElement?.getBoundingClientRect()
      const workingTree = workingTreeRect === undefined
        ? undefined
        : { top: Math.round(workingTreeRect.top - listRect.top), height: Math.round(workingTreeRect.height) }
      const last = rows[rows.length - 1]
      // Derive the height from the rows only: reading the list's own scroll
      // height would feed the SVG height back into the row layout and keep the
      // graph stretched after a tall inline panel closes.
      const total = Math.max(
        last === undefined ? 0 : last.top + last.height,
        workingTree === undefined ? 0 : workingTree.top + workingTree.height)
      const metrics: RowMetrics = { workingTree, rows, total }
      const key = `${layout.nodes.length}:${workingTreeChanged ? 1 : 0}`
      measureLog.current = `已测量 ${rows.length} 行 · 首行 ${rows[0]?.top ?? 0} · 总高 ${total}`
      setMeasured(current => current !== undefined && current.key === key && sameRowMetrics(current.metrics, metrics)
        ? current : { key, metrics })
      return rows.map(box => `${box.top}/${box.height}`).join(',')
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(() => { measure() })
    observer.observe(list)
    // Inline details are siblings of commit rows. Their async content can move
    // later rows without resizing either those rows or the constrained list box,
    // so observe the panels themselves as well as wrapped reference rows.
    for (const element of list.querySelectorAll('[data-commit-hash], [data-inline-details]')) observer.observe(element)
    // A diff or source viewer settles several frames after it opens, and fonts
    // or images can reflow a row in frames that carry no observer callback.
    // Re-measure until two consecutive passes agree, with a bounded sweep so a
    // permanently unstable layout still stops.
    let previous = ''
    let frames = 0
    let frameId = requestAnimationFrame(function settle() {
      frames += 1
      const signature = measure()
      if (signature.length > 0 && signature === previous) return
      previous = signature
      if (frames < 120) frameId = requestAnimationFrame(settle)
    })
    return () => { cancelAnimationFrame(frameId); observer.disconnect() }
    // The inline panels are dependencies on purpose: opening a file diff or a
    // comparison changes row heights without changing the row count.
  }, [layout, workingTreeChanged, rowHeight, selectedHash, showWorkingTree, display, viewingFile, compareTarget, workingTreeFile])

  const loadMore = () => {
    const nextMax = Math.min(MAX_COMMITS, maxCommits + PAGE_SIZE)
    setMaxCommits(nextMax)
  }

  // Load per-repository display settings once the graph path is known.
  useEffect(() => {
    if (snapshot === undefined || snapshot.path.length === 0) return
    setDisplay(loadDisplaySettings(snapshot.path))
    setSettingsRepo(snapshot.path)
  }, [snapshot?.path])

  // Persist display settings scoped to the stable repository id; never touches
  // the Host query or any Git data.
  useEffect(() => {
    if (snapshot === undefined || settingsRepo !== snapshot.path) return
    saveDisplaySettings(snapshot.path, display)
  }, [display, snapshot?.path, settingsRepo])

  // Scroll only on a new selection, not on every query response or diff resize.
  // Moving this panel alone avoids scrolling the surrounding DSH conversation.
  useLayoutEffect(() => {
    if (selectedHash === undefined) return
    setShowWorkingTree(false)
    setViewingFile(undefined)
    setCompareTarget(undefined)
    setWorkingTreeFile(undefined)
    setNavigationHint(undefined)
    const panel = panelRef.current
    const row = panel?.querySelector<HTMLElement>(`[data-commit-hash="${selectedHash}"]`)
    if (panel === null || row === undefined || row === null) return
    const bounds = panel.getBoundingClientRect()
    const target = row.getBoundingClientRect()
    const top = bounds.top + 36
    if (target.top < top) panel.scrollTop += target.top - top
    else if (target.bottom > bounds.bottom) panel.scrollTop += target.bottom - bounds.bottom
  }, [selectedHash])

  const findMatches = useMemo(() => {
    if (findText.length === 0 || findRegex) {
      return findText.length === 0
        ? []
        : visibleCommits.filter(commit => commitMatchesFind(commit, findText, findCase, true))
    }
    return visibleCommits.filter(commit => commitMatchesFind(commit, findText, findCase, false))
  }, [findText, findCase, findRegex, visibleCommits])

  // Keep the active find index in range and sync the selection to the match.
  useEffect(() => {
    const count = findMatches.length
    setFindIndex(current => {
      if (count === 0) return 0
      if (current >= count) return 0
      return current
    })
  }, [findMatches.length])

  useEffect(() => {
    const target = findMatches[findIndex]
    if (target !== undefined && target.hash !== selectedHash) setSelectedHash(target.hash)
  }, [findMatches, findIndex, selectedHash])

  const findStep = (delta: number) => {
    const count = findMatches.length
    if (count === 0) return
    setFindIndex(current => (current + delta + count) % count)
  }

  // Shortcuts belong to this page; never intercept typing in another DSH pane.
  useEffect(() => {
    const section = sectionRef.current
    if (section === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        if (event.shiftKey) setSheet(current => current === 'settings' ? undefined : 'settings')
        else { setFindOpen(true); setFindIndex(0) }
        return
      }
      const target = event.target
      const inField = target instanceof HTMLElement
        && target.closest('input, select, textarea, [contenteditable="true"], [role="separator"], [data-file-viewer]') !== null
      // Escape unwinds one layer at a time: sheet first, then find.
      if (event.key === 'Escape') {
        if (sheet !== undefined) { event.preventDefault(); setSheet(undefined); return }
        if (findOpen) { event.preventDefault(); setFindOpen(false); return }
      }
      // Direction keys inside a historical viewer scroll its content, rather
      // than replacing the selected commit and discarding the open file.
      if (inField) return
      // An open sheet owns the panel, so graph navigation stays inert under it.
      if (sheet !== undefined) return
      if (findOpen || findText.length > 0) return
      if (event.key.toLowerCase() === 'h') {
        const head = visibleCommits.find(commit => commit.isHead)
        if (head !== undefined) setSelectedHash(head.hash)
        else setNavigationHint(t('graph.headUnavailable'))
        return
      }
      if (visibleCommits.length === 0) return
      const index = visibleCommits.findIndex(commit => commit.hash === selectedHash)
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const nextIndex = event.key === 'ArrowDown' ? (index + 1) % visibleCommits.length : Math.max(0, index - 1)
        setSelectedHash(visibleCommits[nextIndex]?.hash)
      }
    }
    section.addEventListener('keydown', onKeyDown)
    return () => section.removeEventListener('keydown', onKeyDown)
  }, [visibleCommits, selectedHash, findOpen, findText, sheet, t])

  // A menu closes on a click anywhere else. The menu itself and any trigger are
  // exempt, so pressing a trigger toggles its menu instead of closing it on
  // mousedown and immediately reopening it on click.
  useEffect(() => {
    if (sheet === undefined) return undefined
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('[data-git-graph-dropdown], [data-git-graph-dropdown-trigger], [aria-haspopup="dialog"]') !== null) return
      setSheet(undefined)
    }
    document.addEventListener('mousedown', onPointerDown, true)
    return () => document.removeEventListener('mousedown', onPointerDown, true)
  }, [sheet])

  // Share the exact column definition with the header, commits and worktree row.
  const columns = visibleColumns(display)
  const rowMin = columns.reduce((sum, column) => sum + display.columnWidths[column], 12 + (columns.length - 1) * 8)
  const resizeColumn = (column: CommitColumn, width: number) => setDisplay(current => ({ ...current,
    fitDescription: column === 'description' ? false : current.fitDescription,
    columnWidths: { ...current.columnWidths, [column]: clampColumnWidth(column, width) } }))
  // Graph-aligned labels ask for the width their widest row reaches; every other
  // alignment keeps the plain commit row and reserves nothing.
  const [graphRefWidth, setGraphRefWidth] = useState(160)
  const graphSvgWidth = graphDisplayWidth(layout.laneCount) + 8
  const reserveGraphRefs = useCallback((extent: number) => {
    const width = Math.min(360, Math.max(160, Math.ceil(extent - graphSvgWidth)))
    setGraphRefWidth(current => Math.abs(current - width) < 1 ? current : width)
  }, [graphSvgWidth])
  const extraGraphWidth = display.referenceAlignment === 'graph' ? graphRefWidth : 0
  const columnStyle: CSSProperties & { '--git-graph-columns': string; '--git-graph-row-min': string; '--git-graph-row-height': string; '--git-graph-svg-width': string; '--git-graph-ref-width': string } = {
    '--git-graph-columns': columns.map(column => column === 'description' && display.fitDescription ? `minmax(${display.columnWidths[column]}px, 1fr)` : `${display.columnWidths[column]}px`).join(' '),
    '--git-graph-row-min': `${rowMin}px`,
    '--git-graph-row-height': `${rowHeight}px`,
    '--git-graph-svg-width': `${graphDisplayWidth(layout.laneCount) + 8}px`,
    '--git-graph-ref-width': `${extraGraphWidth}px`,
  }

  const selectedCommit = visibleCommits.find(commit => commit.hash === selectedHash)
  const expansion = showWorkingTree ? <>
    <WorkingTreeChangesPanel changes={workingTreeChanges} error={workingTreeError} onRetry={refresh}
      onClose={() => setShowWorkingTree(false)} onOpenFile={path => setWorkingTreeFile(path)} />
    {workingTreeFile !== undefined && <WorkingTreeFileViewer key={`${workingTreeFile}:${readRevision}`} path={workingTreeFile} readWorkingTreeFile={readWorkingTreeFile} onClose={() => setWorkingTreeFile(undefined)} />}
  </> : selectedCommit === undefined || snapshot === undefined ? null : <>
    <CommitDetails key={selectedCommit.hash} currentBranch={snapshot.branch} remotes={snapshot.remotes} display={display} readRevision={readRevision}
      avatar={display.showAvatars ? authorAvatars.images.get(avatarEmail(selectedCommit.email)) : undefined}
      commit={selectedCommit} readCommit={readCommit} compareActive={compareTarget === selectedCommit.hash}
      onCompare={() => setCompareTarget(compareTarget === selectedCommit.hash ? undefined : selectedCommit.hash)}
      onOpenFile={(hash, change) => setViewingFile({ hash, change })} />
    {viewingFile !== undefined && viewingFile.hash === selectedCommit.hash && <FileViewer key={`${viewingFile.hash}:${viewingFile.change.newPath}:${readRevision}`}
      hash={viewingFile.hash} baseHash={selectedCommit.parents[0]} change={viewingFile.change} readFileDiff={readFileDiff} readFile={readFile} onClose={() => setViewingFile(undefined)} />}
    {compareTarget === selectedCommit.hash && <ComparePanel readRevision={readRevision} targetHash={selectedCommit.hash} commits={snapshot.commits} compare={compare}
      readFileDiff={readFileDiff} readFile={readFile} onClose={() => setCompareTarget(undefined)} />}
  </>

  const branches = snapshot?.branches
  const statusLabel = snapshot === undefined ? t('status.loadingWorkspace')
    : snapshot.state === 'not-git' ? t('status.notGit')
      : snapshot.workingTree.changed ? t('status.dirty') : t('status.clean')

  return (
    <section ref={sectionRef} tabIndex={0} aria-label={t('view.title')} aria-busy={loading} style={columnStyle} className={css.card} data-git-graph data-graph-style={display.graphStyle} data-ref-alignment={display.referenceAlignment} data-avatar-loading={authorAvatars.loading}>
      {/* One line of orientation: which branch, whether the tree is dirty, where
          we are, and the two actions that are not about narrowing the graph. */}
      <header className={css.header}>
        <div className={css.headerMain}>
          {snapshot !== undefined && snapshot.state !== 'not-git' && (
            <button type="button" className={css.branchButton} data-detached={snapshot.branch === null}
              data-git-graph-dropdown-trigger
              onClick={() => setSheet(sheet === 'branch' ? undefined : 'branch')}
              aria-expanded={sheet === 'branch'} aria-haspopup="dialog"
              title={t('branch.title')} aria-label={`${t('branch.aria')}: ${snapshot.branch ?? t('branch.detached')}`}>
              <BranchGlyph />
              <span className={css.branchName}>{snapshot.branch ?? t('branch.detached')}</span>
              <ChevronGlyph />
            </button>)}
          {snapshot !== undefined && (
            <span className={snapshot.workingTree.changed ? css.dirty : css.clean} title={statusLabel} role="img" aria-label={statusLabel} />
          )}
          <span className={css.path} title={snapshot?.path}>{snapshot?.path ?? t('status.loadingWorkspace')}</span>
        </div>
        <div className={css.toolbarActions}>
          <button type="button" className={css.iconButton} data-loading={loading} onClick={() => void refresh()} disabled={loading} title={t('toolbar.refresh')} aria-label={t('toolbar.refresh')}><RefreshGlyph /></button>
          <button type="button" className={css.iconButton} data-git-graph-dropdown-trigger
            onClick={() => setSheet(current => current === 'settings' ? undefined : 'settings')}
            aria-pressed={sheet === 'settings'} aria-expanded={sheet === 'settings'} aria-haspopup="dialog"
            title={t('toolbar.settings')} aria-label={t('toolbar.settings')}><SlidersGlyph /></button>
        </div>
        {/* Menus are absolutely positioned children of the bar, so they hang
            below it without disturbing its single-line layout, and the graph
            stays visible behind them. */}
        {sheet === 'branch' && branches !== undefined && (
          <BranchMenu branches={branches} focused={focusedBranch} onSelect={selectBranch} onShowAll={clearBranchFocus} />
        )}
        {/* Reference-type filtering uses the loaded page; refresh the Host
            query as well so every filter action gives visible feedback. */}
        {sheet === 'filter' && (
          <FilterMenu refFilter={refFilter} sort={sort} includeAll={includeAll} firstParent={firstParent} branchGlob={branchGlob}
            onRefFilter={value => { setRefFilter(value); void refresh() }}
            onSort={setSort} onIncludeAll={setIncludeAll} onFirstParent={setFirstParent} onBranchGlob={setBranchGlob}
            onReset={() => { setRefFilter('all'); setSort('date'); setIncludeAll(true); setFirstParent(false); setBranchGlob('') }}
            onClose={() => setSheet(undefined)} />
        )}
        {sheet === 'settings' && (
          <Dropdown label={t('toolbar.settings')} tall>
            <div className={css.sheetHeader}>
              <span className={css.sheetTitle}>{t('toolbar.settings')}</span>
              <button type="button" className={css.iconButton} onClick={() => setSheet(undefined)} title={t('common.close')} aria-label={t('common.close')}><CloseGlyph /></button>
            </div>
            <div className={css.dropdownBody}>
              <SettingsPanel settings={display} onChange={setDisplay} onClose={() => setSheet(undefined)}
                diagnostics={`build ${BUILD_ID} · ${measuredOk ? '已测量' : '等距回退'} · ${measureLog.current} · 节点 ${layout.nodes.length}`} />
            </div>
          </Dropdown>
        )}
      </header>

      <div className={css.toolbar} role="toolbar" aria-label={t('toolbar.aria')}>
        <input className={css.search} type="search" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder={t('toolbar.searchPlaceholder')} aria-label={t('toolbar.search')} />
        <button type="button" className={css.iconButton} onClick={() => setFindOpen(current => !current)} aria-pressed={findOpen} title={t('toolbar.find')} aria-label={t('toolbar.find')}><SearchGlyph /></button>
        <button type="button" className={css.filterButton} data-git-graph-dropdown-trigger onClick={() => setSheet(current => current === 'filter' ? undefined : 'filter')} aria-expanded={sheet === 'filter'} aria-haspopup="dialog" title={t('filter.title')}>
          <FunnelGlyph />
          <span className={css.filterLabel}>{t('toolbar.filter')}</span>
          {activeFilterCount > 0 && <span className={css.filterBadge}>{activeFilterCount}</span>}
        </button>
      </div>

      {focusedBranch !== undefined && (
        <div className={css.hint} role="status">
          <span>{t('branch.focusActive', { name: focusedBranch })}</span>
          <button type="button" className={css.linkButton} onClick={clearBranchFocus}>{t('branch.showAll')}</button>
        </div>
      )}

      {findOpen && (
        <div className={css.findStrip}>
          <input className={css.findStripInput} type="search" value={findText} onChange={event => { setFindText(event.target.value); setFindIndex(0) }} placeholder={t('find.placeholder')} autoFocus aria-label={t('find.aria')} />
          <button type="button" className={css.iconButton} aria-pressed={findCase} title={t('find.case')} aria-label={t('find.case')} onClick={() => setFindCase(current => !current)}>Aa</button>
          <button type="button" className={css.iconButton} aria-pressed={findRegex} title={t('find.regex')} aria-label={t('find.regex')} onClick={() => { setFindRegex(current => !current); setFindIndex(0) }}>.*</button>
          <FindBar count={findMatches.length} index={findMatches.length === 0 ? 0 : findIndex} onPrev={() => findStep(-1)} onNext={() => findStep(1)} onClear={() => { setFindText(''); setFindIndex(0) }} />
        </div>
      )}
      {findOpen && findError !== undefined && <div className={css.error} role="alert">{findError}</div>}

      {/* Everything below the chrome. Every secondary surface is anchored to
          the bar above, so nothing here takes the graph over. */}
      <div className={css.body}>
        {error !== undefined && <div className={css.error} role="alert">{t('error.graph', { message: error })}<button type="button" className={css.secondaryButton} onClick={() => void refresh()} disabled={loading}>{t('common.retry')}</button></div>}
        {navigationHint !== undefined && <div className={css.hint} role="status">{navigationHint}<button type="button" className={css.linkButton} onClick={() => setNavigationHint(undefined)}>{t('common.close')}</button></div>}
        {display.showAvatars && authorAvatars.error !== undefined && <div className={css.hint} role="status">{t('avatar.error')}</div>}
        {refFilter !== 'all' && <div className={css.hint} role="status">{t('refs.filterHint')}</div>}
        {refFilter === 'remote' && <div className={css.hint}>{t('refs.remoteHint')}</div>}
        {snapshot?.searchTruncated === true && <div className={css.hint} role="status" data-search-truncated>{t('search.truncated', { limit: MAX_SEARCH_COMMITS })}</div>}
        {loading && snapshot === undefined && <div className={css.pending}>{t('status.loadingGraph')}</div>}
        {!loading && error === undefined && snapshot !== undefined && visibleCommits.length === 0 && (
          <div className={css.pending}>
            {snapshot.state === 'not-git' && t('status.notGit')}
            {snapshot.state === 'empty' && t('status.empty')}
            {snapshot.state === 'ready' && t('status.noMatches')}
          </div>
        )}

        {hasGraphRows && snapshot !== undefined && (
          <>
            <div className={css.graphPanel} ref={panelRef}>
              <div className={css.graphHeader}>{t('column.graph')}</div>
              <div className={css.commitHeader}>
                {columns.map(column => <span key={column} className={css.headerCell}>{t(column === 'date' ? display.dateSource === 'author' ? 'details.authorDate' : 'details.committerDate' : column === 'hash' ? 'column.commit' : `column.${column}`)}<ColumnResizer column={column} width={display.columnWidths[column]} onChange={resizeColumn} /></span>)}
              </div>
              <GraphSvg layout={layout} workingTreeChanged={snapshot.workingTree.changed} selectedHash={selectedHash} metrics={rowMetrics} onSelect={selectCommit} rowHeight={rowHeight} lineStyle={display.lineStyle} palette={display.palette} hoveredHash={hoveredHash} onHover={setHoveredHash} />
              {display.referenceAlignment === 'graph' && <GraphReferenceLabels layout={layout} metrics={rowMetrics} onExtent={reserveGraphRefs}
                remotes={snapshot.remotes} currentBranch={snapshot.branch} combine={display.combineReferences} />}
              <div className={css.commitList} ref={listRef}>
                {snapshot.workingTree.changed && (
                  <>
                    <button type="button" className={css.workingTreeRow} data-worktree-row title={t('worktree.open')} onClick={toggleWorkingTree} aria-expanded={showWorkingTree}>
                      <span className={css.commitDescription}><span className={css.headDot} />{t('worktree.title')}</span>
                      {display.showDate && <span className={css.commitDate}>—</span>}
                      {display.showAuthor && <span className={css.commitAuthor}>—</span>}
                      {display.showHash && <span className={`${css.hash} ${css.commitHash}`}>WORKTREE</span>}
                    </button>
                    {showWorkingTree && (
                      <div className={css.inlineDetails} data-inline-details>
                        {expansion}
                      </div>
                    )}
                  </>
                )}
                {visibleCommits.map(commit => (
                  <Fragment key={commit.hash}>
                    <CommitRow commit={commit} selected={commit.hash === selectedHash} display={display} findActive={findMatches.length > 0 && findMatches.some(match => match.hash === commit.hash)} onSelect={() => selectCommit(commit.hash)} currentBranch={snapshot.branch} hovered={hoveredHash === commit.hash} onHover={setHoveredHash} remotes={snapshot.remotes} avatar={display.showAvatars ? authorAvatars.images.get(avatarEmail(commit.email)) : undefined} />
                    {commit.hash === selectedHash && (
                      <div className={css.inlineDetails} data-inline-details>
                        {expansion}
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
            {canLoadMore && <button type="button" className={css.loadMore} onClick={loadMore} disabled={loading}>{loading ? t('toolbar.loading') : t('toolbar.loadMore')}</button>}
            <MetadataStrip readMetadata={metadata} readRevision={readRevision} />
          </>
        )}
      </div>
    </section>
  )
}
