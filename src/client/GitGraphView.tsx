import { createContext, Fragment, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { GitGraphCommit, GitGraphCommitDetails, GitGraphCompareRequest, GitGraphCompareResult, GitGraphFileChange, GitGraphFileContent, GitGraphFileDiff, GitGraphFileRequest, GitGraphQuery, GitGraphMetadata, GitGraphRef, GitGraphSnapshot, GitGraphWorkingTreeChanges, GitGraphWorkingTreeFileRequest } from '../domain.ts'
import { layoutGraph, type GraphLayout } from './graph-layout.ts'
import { loadDisplaySettings, saveDisplaySettings, DEFAULT_DISPLAY_SETTINGS, COLUMN_LIMITS, clampColumnWidth, type CommitColumn, type GitGraphDisplaySettings, type GraphDateFormat, type GraphStyle, type GraphLineStyle, type GraphPalette } from './settings.ts'
import { displayHunks, graphDisplayWidth, graphRowHeight, visibleColumns } from './presentation.ts'
import { css } from './styles.ts'
import { NS, type GitGraphTranslate } from './locales.ts'

export interface GitGraphViewInjected {
  readonly read: (request: GitGraphQuery) => Promise<RemoteResult<GitGraphSnapshot>>
  readonly readCommit: (request: { hash: string }) => Promise<RemoteResult<GitGraphCommitDetails>>
  readonly readFile: (request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileContent>>
  readonly readFileDiff: (request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>
  readonly readWorkingTree: () => Promise<RemoteResult<GitGraphWorkingTreeChanges>>
  readonly readWorkingTreeFile: (request: GitGraphWorkingTreeFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>
  readonly compare: (request: GitGraphCompareRequest) => Promise<RemoteResult<GitGraphCompareResult>>
  readonly metadata: () => Promise<RemoteResult<GitGraphMetadata>>
}

type Props = PropsRuntime<'sidebar.right.pane.tab'> & PropsLocale<typeof NS> & GitGraphViewInjected
type RefFilter = 'all' | GitGraphRef['kind']

const MAX_COMMITS = 500
const PAGE_SIZE = 100

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

function RefBadges({ refs, compact = false, currentBranch, onShowAll }: {
  readonly refs: readonly GitGraphRef[]; readonly compact?: boolean; readonly currentBranch?: string | null; readonly onShowAll?: () => void
}) {
  const t = useText()
  const ordered = [...refs].sort((a, b) => {
    const rank = (ref: GitGraphRef) => ref.kind === 'head' && ref.name === currentBranch ? -1 : ref.kind === 'head' ? 0 : ref.kind === 'remote' ? 1 : 2
    return rank(a) - rank(b) || a.name.localeCompare(b.name)
  })
  const shown = compact ? ordered.slice(0, 1) : ordered
  return refs.length === 0 ? null : (
    <span className={css.refs} aria-label={t('refs.aria')}>
      {shown.map(ref => (
        <span key={`${ref.kind}:${ref.name}`} className={css.ref} data-kind={ref.kind} title={ref.name}>
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
        </span>
      ))}
      {compact && ordered.length > shown.length && <button type="button" className={css.refsMore} title={ordered.map(ref => ref.name).join('\n')} aria-label={t('refs.showAll', { count: ordered.length })} onClick={event => { event.stopPropagation(); onShowAll?.() }}>+{ordered.length - shown.length}</button>}
    </span>
  )
}

interface GraphSvgProps {
  readonly layout: GraphLayout
  readonly workingTreeChanged: boolean
  readonly selectedHash: string | undefined
  /** Layout row after which an inline expansion sits; -1 means above all rows. */
  readonly gapAfterRow: number | undefined
  /** Pixel height reserved for the inline expansion; 0 when nothing is open. */
  readonly gapHeight: number
  readonly onSelect: (hash: string) => void
  readonly rowHeight: number
  readonly lineStyle: GraphLineStyle
  readonly palette: GraphPalette
  readonly hoveredHash: string | undefined
  readonly onHover: (hash: string | undefined) => void
}

function GraphSvg({ layout, workingTreeChanged, selectedHash, gapAfterRow, gapHeight, onSelect, rowHeight, lineStyle, palette, hoveredHash, onHover }: GraphSvgProps) {
  const t = useText()
  const laneWidth = 16
  const graphPadding = 16
  const graphWidth = graphDisplayWidth(layout.laneCount)
  const rowOffset = workingTreeChanged ? 1 : 0
  const gap = gapAfterRow === undefined ? 0 : gapHeight
  const graphHeight = Math.max(rowHeight, (layout.nodes.length + rowOffset) * rowHeight) + gap
  const colours = palette === 'accessible' ? ['#0072b2', '#d55e00', '#009e73', '#cc79a7', '#e69f00', '#56b4e9'] : ['#0085d9', '#d9008f', '#00a86b', '#d98500', '#7b4bc4', '#e138e8', '#00a7a0', '#dc5b23', '#6f24d6', '#b38b00']
  const headNode = layout.nodes.find(node => node.commit.isHead)
  const pointX = (lane: number) => graphPadding + lane * laneWidth
  // Rows below the expanded row are pushed down so the graph keeps lining up
  // with the commit rows next to the inline details view.
  const pointY = (row: number) => {
    const base = (row + rowOffset) * rowHeight + rowHeight / 2
    return gapAfterRow !== undefined && row > gapAfterRow ? base + gap : base
  }
  const pathForEdge = (edge: GraphLayout['edges'][number]) => {
    const x1 = pointX(edge.fromLane)
    const x2 = pointX(edge.toLane)
    const y1 = pointY(edge.row)
    const y2 = pointY(edge.row + 1)
    if (x1 === x2) return `M ${x1} ${y1} L ${x2} ${y2}`
    if (lineStyle === 'straight') return `M ${x1} ${y1} L ${x2} ${y2}`
    const span = y2 - y1
    const curve = span > rowHeight * 1.5 ? span * 0.4 : rowHeight * 0.8
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
          d={`M ${pointX(0)} ${pointY(-1)} C ${pointX(0)} ${pointY(-1) + rowHeight * 0.8}, ${pointX(headNode.lane)} ${pointY(headNode.row) - rowHeight * 0.8}, ${pointX(headNode.lane)} ${pointY(headNode.row)}`}
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

function CommitRow({ commit, selected, display, findActive, onSelect, onShowRefs, currentBranch, hovered, onHover }: {
  readonly commit: GitGraphCommit
  readonly selected: boolean
  readonly display: GitGraphDisplaySettings
  readonly findActive: boolean
  readonly onSelect: () => void
  readonly onShowRefs: () => void
  readonly currentBranch: string | null
  readonly hovered: boolean
  readonly onHover: (hash: string | undefined) => void
}) {
  const t = useText()
  return (
    <div role="button" tabIndex={0} data-commit-hash={commit.hash} data-hovered={hovered} className={selected ? `${css.commit} ${css.commitSelected}` : css.commit} aria-pressed={selected} onClick={onSelect}
      onMouseEnter={() => onHover(commit.hash)} onMouseLeave={() => onHover(undefined)}
      onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onSelect() } }}>
      <span className={css.commitDescription}>
        {commit.isHead && <span className={css.headDot} title={t('graph.head')} aria-label={t('graph.head')} />}
        <Avatar email={commit.email} name={commit.author} />
        <RefBadges refs={commit.refs} compact currentBranch={currentBranch} onShowAll={onShowRefs} />
        <span className={findActive ? `${css.subject} ${css.findHighlight}` : css.subject} title={commit.subject}>{commit.subject || t('common.noSubject')}</span>
      </span>
      {display.showDate && <span className={css.commitDate} title={formatDate(commit.date)}>{formatDateValue(commit.date, display.dateFormat)}</span>}
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

function CommitDetails({ commit, readCommit, compareActive, onCompare, onOpenFile, currentBranch }: {
  readonly commit: GitGraphCommit | undefined
  readonly readCommit: GitGraphViewInjected['readCommit']
  readonly compareActive: boolean
  readonly onCompare: () => void
  readonly onOpenFile: (hash: string, path: string) => void
  readonly currentBranch: string | null
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
    void readCommit({ hash: commit.hash }).then(result => {
      if (cancelled) return
      if (result.ok) setDetails(result.value)
      else setDetailsError(result.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setDetailsError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true }
  }, [commit?.hash, readCommit, revision])

  if (commit === undefined) return <div className={css.emptyDetails}>{t('details.select')}</div>

  const signatureText = details?.signature
    ? `${t('details.signed', { status: details.signature.status })}${details.signature.signer ? ` · ${details.signature.signer}` : ''}`
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
        <dt>{t('details.author')}</dt><dd>{commit.author} &lt;{commit.email}&gt;</dd>
        <dt>{t('details.date')}</dt><dd>{formatDate(commit.date)}</dd>
        {details !== undefined && (
          <>
            <dt>{t('details.committer')}</dt><dd>{details.committer} &lt;{details.committerEmail}&gt;</dd>
            <dt>{t('details.signature')}</dt><dd>{signatureText}</dd>
          </>
        )}
        <dt>{t('details.parents')}</dt><dd className={css.mono}>{commit.parents.length === 0 ? t('details.root') : commit.parents.map(parent => <CopyButton key={parent} value={parent} label={t('common.copyHash')} className={css.linkButton}>{shortHash(parent)}</CopyButton>)}</dd>
        <dt>{t('details.refs')}</dt><dd><RefBadges refs={commit.refs} currentBranch={currentBranch} /></dd>
      </dl>

      {details === undefined && detailsError === undefined && <div className={css.pending}>{t('details.loading')}</div>}
      {detailsError !== undefined && <div className={css.error} role="alert">{t('details.error', { message: detailsError })}<button type="button" className={css.secondaryButton} onClick={() => setRevision(current => current + 1)}>{t('common.retry')}</button></div>}

      {details !== undefined && details.body.length > 0 && (
        <details className={css.message} open={details.body.length < 600 && details.body.split('\n').length <= 8}>
          <summary>{t('details.message')}</summary><pre className={css.detailBody}>{details.body}</pre>
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
            onOpenFile={change => onOpenFile(commit.hash, change.newPath)}
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

function FileViewer({ hash, path, readFileDiff, onClose }: {
  readonly hash: string
  readonly path: string
  readonly readFileDiff: GitGraphViewInjected['readFileDiff']
  readonly onClose: () => void
}) {
  const t = useText()
  const [diff, setDiff] = useState<GitGraphFileDiff>()
  const [error, setError] = useState<string>()
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let cancelled = false
    setDiff(undefined)
    setError(undefined)
    void readFileDiff({ hash, path }).then(result => {
      if (cancelled) return
      if (result.ok) setDiff(result.value)
      else setError(result.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true }
  }, [hash, path, readFileDiff, revision])

  const hasChange = diff !== undefined && diff.lines.some(line => line.type !== 'context')
  const binaryLike = diff?.binary === true

  return (
    <div className={css.fileViewer} data-file-viewer>
      <div className={css.fileViewerHeader}>
        <span className={css.fileViewerTitle}>
          {diff !== undefined && <DiffStatusBadge status={diff.status} />}
          <span className={css.mono} title={diff?.oldPath !== path ? `${diff?.oldPath ?? ''} → ${path}` : path}>{diff?.status === 'R' ? `${diff.oldPath} → ${path}` : path}</span>
        </span>
        <span className={css.fileViewerMeta}>
          {diff !== undefined && !diff.binary && `+${diff.additions} −${diff.deletions}`}
        </span>
        <CopyButton value={path} label={t('common.copyPath')} />
        <button type="button" className={css.secondaryButton} onClick={onClose}>{t('common.close')}</button>
      </div>
      {error !== undefined && <div className={css.error} role="alert">{t('diff.error', { message: error })}<button type="button" className={css.secondaryButton} onClick={() => setRevision(current => current + 1)}>{t('common.retry')}</button></div>}
      {diff === undefined && error === undefined && <div className={css.pending}>{t('diff.loading')}</div>}
      {diff !== undefined && !hasChange && binaryLike && (
        <div className={css.pending}>{t('diff.binary')}</div>
      )}
      {diff !== undefined && !hasChange && !binaryLike && (
        <div className={css.pending}>{t('diff.noChanges')}</div>
      )}
      {diff !== undefined && hasChange && <DiffBody diff={diff} />}
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
    setDiff(undefined)
    setError(undefined)
    void readWorkingTreeFile({ path }).then(result => {
      if (cancelled) return
      if (result.ok) setDiff(result.value)
      else setError(result.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true }
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

function ComparePanel({ targetHash, commits, compare, onClose }: {
  readonly targetHash: string
  readonly commits: readonly GitGraphCommit[]
  readonly compare: GitGraphViewInjected['compare']
  readonly onClose: () => void
}) {
  const t = useText()
  const [baseHash, setBaseHash] = useState<string>(commits[0]?.hash ?? '')
  const [result, setResult] = useState<GitGraphCompareResult>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    setResult(undefined)
    setError(undefined)
    if (baseHash.length === 0 || baseHash === targetHash) return
    let cancelled = false
    void compare({ baseHash, targetHash }).then(res => {
      if (cancelled) return
      if (res.ok) setResult(res.value)
      else setError(res.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true }
  }, [baseHash, targetHash, compare])

  return (
    <div className={css.comparePanel} data-compare-panel>
      <div className={css.compareRow}>
        <span className={css.fileViewerTitle}>{t('compare.title')}</span>
        <select className={`${css.select} ${css.selectWide}`} value={baseHash} onChange={event => setBaseHash(event.target.value)} aria-label={t('compare.base')}>
          {commits.map(commit => (
            <option key={commit.hash} value={commit.hash}>
              {shortHash(commit.hash)} · {commit.subject || t('common.noSubject')}
            </option>
          ))}
        </select>
        <button type="button" className={css.secondaryButton} onClick={onClose}>{t('common.close')}</button>
      </div>
      {baseHash === targetHash && <div className={css.compareHint}>{t('compare.selectDifferent')}</div>}
      {error !== undefined && <div className={css.error} role="alert">{t('compare.error', { message: error })}</div>}
      {result !== undefined && (
        <div className={css.fileChanges}>
          <div className={css.fileChangesHeader}>{t('compare.files', { count: result.changes.length })}</div>
          {result.changes.length === 0 && <div className={css.compareHint}>{t('compare.empty')}</div>}
          <ul className={css.fileChangesList}>
            {result.changes.map((change, index) => (
              <li key={`${change.type}-${change.oldPath}-${change.newPath}-${index}`} className={css.fileChange}>
                <FileChangeStatus type={change.type} />
                <span className={css.mono} title={change.newPath}>{change.newPath}</span>
                <span className={css.fileChangeStat}>{(change.additions ?? 0) > 0 ? `+${change.additions}` : ''}{(change.deletions ?? 0) > 0 ? ` −${change.deletions}` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Avatar({ email, name }: { readonly email: string; readonly name: string }) {
  // Deterministic initial + colour avatar. It never requires the network, so a
  // failed/absent remote avatar can never block the graph or its details.
  const palette = ['#0085d9', '#d9008f', '#00a86b', '#d98500', '#7b4bc4', '#d9a800', '#008a7a']
  let seed = 0
  for (const char of email) seed = (seed * 31 + char.charCodeAt(0)) >>> 0
  const colour = palette[seed % palette.length]
  const initial = (name.trim().charAt(0) || '?').toLocaleUpperCase()
  return <span className={css.avatar} style={{ background: colour }} aria-hidden="true">{initial}</span>
}

function MetadataStrip({ metadata, error, onRetry }: { readonly metadata: GitGraphMetadata | undefined; readonly error: string | undefined; readonly onRetry: () => void }) {
  const t = useText()
  if (error !== undefined) return <div className={css.metadataStrip} role="status">{t('metadata.error', { message: error })}<button type="button" className={css.linkButton} onClick={onRetry}>{t('common.retry')}</button></div>
  if (metadata === undefined) return <div className={css.metadataStrip}>{t('metadata.loading')}</div>
  if (metadata.tags.length === 0 && metadata.stashes.length === 0) {
    return <div className={css.metadataStrip}>{t('metadata.empty')}</div>
  }
  return (
    <details className={css.metadataStrip}>
      <summary>{t('metadata.tags')} ({metadata.tags.length}) · {t('metadata.stashes')} ({metadata.stashes.length})</summary>
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

function SettingsPanel({ settings, onChange, onClose }: {
  readonly settings: GitGraphDisplaySettings
  readonly onChange: (next: GitGraphDisplaySettings) => void
  readonly onClose: () => void
}) {
  const t = useText()
  const toggle = (key: 'showDate' | 'showAuthor' | 'showHash') => onChange({ ...settings, [key]: !settings[key] })
  return (
    <div className={css.settingsPanel} data-settings-panel>
      <div className={css.settingsField}><label><input type="checkbox" checked={settings.showDate} onChange={() => toggle('showDate')} />{t('settings.showDate')}</label></div>
      <div className={css.settingsField}><label><input type="checkbox" checked={settings.showAuthor} onChange={() => toggle('showAuthor')} />{t('settings.showAuthor')}</label></div>
      <div className={css.settingsField}><label><input type="checkbox" checked={settings.showHash} onChange={() => toggle('showHash')} />{t('settings.showHash')}</label></div>
      <div className={css.settingsField}>
        <label>{t('settings.dateFormat')}
          <select className={css.select} value={settings.dateFormat} onChange={event => onChange({ ...settings, dateFormat: event.target.value as GraphDateFormat })}>
            <option value="short">{t('settings.short')}</option>
            <option value="full">{t('settings.full')}</option>
            <option value="local">{t('settings.local')}</option>
          </select>
        </label>
      </div>
      <div className={css.settingsField}>
        <label>{t('settings.graphStyle')}
          <select className={css.select} value={settings.graphStyle} onChange={event => onChange({ ...settings, graphStyle: event.target.value as GraphStyle })}>
            <option value="full">{t('settings.full')}</option>
            <option value="compact">{t('settings.compact')}</option>
          </select>
        </label>
      </div>
      <div className={css.settingsField}><label>{t('settings.lineStyle')}
        <select className={css.select} value={settings.lineStyle} onChange={event => onChange({ ...settings, lineStyle: event.target.value as GraphLineStyle })}>
          <option value="curved">{t('settings.curved')}</option><option value="straight">{t('settings.straight')}</option>
        </select></label></div>
      <div className={css.settingsField}><label>{t('settings.palette')}
        <select className={css.select} value={settings.palette} onChange={event => onChange({ ...settings, palette: event.target.value as GraphPalette })}>
          <option value="classic">{t('settings.classic')}</option><option value="accessible">{t('settings.accessible')}</option>
        </select></label></div>
      <button type="button" className={css.secondaryButton} onClick={() => onChange(DEFAULT_DISPLAY_SETTINGS)}>{t('settings.reset')}</button>
      <button type="button" className={css.secondaryButton} onClick={onClose}>{t('settings.close')}</button>
    </div>
  )
}

function FindBar({ count, index, onPrev, onNext, onClear }: {
  readonly count: number
  readonly index: number
  readonly onPrev: () => void
  readonly onNext: () => void
  readonly onClear: () => void
}) {
  const t = useText()
  return (
    <div className={css.findBar} data-find-bar>
      <span className={css.findCount}>{count === 0 ? t('find.noMatches') : `${index + 1}/${count}`}</span>
      <button type="button" className={css.secondaryButton} onClick={onPrev} disabled={count === 0}>{t('find.previous')}</button>
      <button type="button" className={css.secondaryButton} onClick={onNext} disabled={count === 0}>{t('find.next')}</button>
      <button type="button" className={css.secondaryButton} onClick={onClear}>{t('find.clear')}</button>
    </div>
  )
}

export function GitGraphView(props: Props) {
  return <TextContext.Provider value={props.t}><GitGraphContent {...props} /></TextContext.Provider>
}

function GitGraphContent({ read, readCommit, readFileDiff, readWorkingTree, readWorkingTreeFile, compare, metadata }: Props) {
  const t = useText()
  const [snapshot, setSnapshot] = useState<GitGraphSnapshot | undefined>()
  const [selectedHash, setSelectedHash] = useState<string>()
  const [searchText, setSearchText] = useState('')
  // The emitted search reaches the Host (full-range); keep a debounced copy.
  const [search, setSearch] = useState('')
  const [refFilter, setRefFilter] = useState<RefFilter>('all')
  const [maxCommits, setMaxCommits] = useState(PAGE_SIZE)
  const [includeAll, setIncludeAll] = useState(true)
  const [firstParent, setFirstParent] = useState(false)
  const [branchGlob, setBranchGlob] = useState('')
  const [sort, setSort] = useState<'date' | 'author-date' | 'topological'>('date')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [viewingFile, setViewingFile] = useState<{ hash: string; path: string }>()
  const [compareTarget, setCompareTarget] = useState<string>()
  const [showWorkingTree, setShowWorkingTree] = useState(false)
  const [workingTreeChanges, setWorkingTreeChanges] = useState<GitGraphWorkingTreeChanges>()
  const [workingTreeError, setWorkingTreeError] = useState<string>()
  const [workingTreeFile, setWorkingTreeFile] = useState<string>()
  const [repoMetadata, setRepoMetadata] = useState<GitGraphMetadata>()
  const [metadataError, setMetadataError] = useState<string>()
  const [readRevision, setReadRevision] = useState(0)
  const [display, setDisplay] = useState<GitGraphDisplaySettings>(DEFAULT_DISPLAY_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
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
  const inlineRef = useRef<HTMLDivElement>(null)
  const [inlineHeight, setInlineHeight] = useState(0)
  // Only the newest query may replace the graph, including after unmount.
  const querySequence = useRef(0)
  const loadedPath = useRef<string>()
  const findError = useMemo(() => {
    if (!findRegex || findText.length === 0) return undefined
    try { new RegExp(findText); return undefined } catch { return t('find.invalidRegex') }
  }, [findRegex, findText, t])

  const load = useCallback(async (request: GitGraphQuery) => {
    const sequence = ++querySequence.current
    setLoading(true)
    setError(undefined)
    try {
      const result = await read(request)
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
      ...(emittedSearch.length > 0 ? { search: emittedSearch } : {}),
      sort,
    }
  }, [branchGlob, includeAll, firstParent, sort])

  const refresh = useCallback(() => {
    setReadRevision(current => current + 1)
    void load(buildRequest(maxCommits, search))
  }, [load, buildRequest, maxCommits, search])

  useEffect(() => {
    void load(buildRequest(maxCommits, search))
  }, [load, buildRequest, maxCommits, search])

  useEffect(() => () => { querySequence.current += 1 }, [read])

  useEffect(() => {
    let cancelled = false
    setRepoMetadata(undefined)
    setMetadataError(undefined)
    void metadata().then(result => {
      if (cancelled) return
      if (result.ok) setRepoMetadata(result.value)
      else setMetadataError(result.error.message)
    }).catch((cause: unknown) => { if (!cancelled) setMetadataError(cause instanceof Error ? cause.message : String(cause)) })
    return () => { cancelled = true }
  }, [metadata, readRevision])

  // Load the uncommitted-changes list when the working-tree panel is opened.
  useEffect(() => {
    if (!showWorkingTree) return
    let cancelled = false
    setWorkingTreeChanges(undefined)
    setWorkingTreeError(undefined)
    void readWorkingTree().then(result => {
      if (cancelled) return
      if (result.ok) setWorkingTreeChanges(result.value)
      else setWorkingTreeError(result.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setWorkingTreeError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true }
  }, [showWorkingTree, readWorkingTree, readRevision])

  // Debounce only text; sorting and branch filters preserve the emitted query.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim())
      setMaxCommits(PAGE_SIZE)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchText])

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

  // Layout row after which the inline expansion is inserted; the graph SVG
  // reserves this much vertical space so its lines stay aligned with rows.
  const expandedRow = showWorkingTree ? -1 : layout.nodes.find(node => node.commit.hash === selectedHash)?.row

  // Measure the inline expansion (it grows as details/diffs stream in) so the
  // graph column can keep pace with the commit list column.
  useLayoutEffect(() => {
    const element = inlineRef.current
    if (element === null) {
      setInlineHeight(0)
      return
    }
    const update = () => setInlineHeight(element.offsetHeight)
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [selectedHash, showWorkingTree])

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
        if (event.shiftKey) setShowSettings(current => !current)
        else { setFindOpen(true); setFindIndex(0) }
        return
      }
      const target = event.target
      if (target instanceof HTMLElement && target.closest('input, select, textarea, [contenteditable="true"], [role="separator"]') !== null) return
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
  }, [visibleCommits, selectedHash, findOpen, findText, t])

  // Share the exact column definition with the header, commits and worktree row.
  const columns = visibleColumns(display)
  const rowHeight = graphRowHeight(display)
  const rowMin = columns.reduce((sum, column) => sum + display.columnWidths[column], 12 + (columns.length - 1) * 8)
  const resizeColumn = (column: CommitColumn, width: number) => setDisplay(current => ({ ...current,
    fitDescription: column === 'description' ? false : current.fitDescription,
    columnWidths: { ...current.columnWidths, [column]: clampColumnWidth(column, width) } }))
  const columnStyle: CSSProperties & { '--git-graph-columns': string; '--git-graph-row-min': string; '--git-graph-row-height': string; '--git-graph-svg-width': string } = {
    '--git-graph-columns': columns.map(column => column === 'description' && display.fitDescription ? `minmax(${display.columnWidths[column]}px, 1fr)` : `${display.columnWidths[column]}px`).join(' '),
    '--git-graph-row-min': `${rowMin}px`,
    '--git-graph-row-height': `${rowHeight}px`,
    '--git-graph-svg-width': `${graphDisplayWidth(layout.laneCount) + 8}px`,
  }

  return (
    <section ref={sectionRef} tabIndex={0} aria-label={t('view.title')} aria-busy={loading} style={columnStyle} className={css.card} data-git-graph data-graph-style={display.graphStyle}>
      <header className={css.header}>
        <div className={css.titleBlock}>
          <strong>{t('view.title')}</strong>
          <span className={css.path} title={snapshot?.path}>{snapshot?.path ?? t('status.loadingWorkspace')}</span>
        </div>
        {snapshot !== undefined && <span className={snapshot.workingTree.changed ? css.dirty : css.clean}>{snapshot.state === 'not-git' ? t('status.notGit') : snapshot.workingTree.changed ? t('status.dirty') : t('status.clean')}</span>}
      </header>

      <div className={css.toolbar} role="toolbar" aria-label={t('toolbar.aria')}>
        <div className={css.toolbarGroup}>
        <input className={css.search} type="search" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder={t('toolbar.searchPlaceholder')} aria-label={t('toolbar.search')} />
        <input className={css.search} type="text" value={branchGlob} onChange={event => setBranchGlob(event.target.value)} placeholder={t('toolbar.branchPlaceholder')} aria-label={t('toolbar.branch')} />
        </div><div className={css.toolbarGroup}>
        <select className={css.select} value={refFilter} onChange={event => setRefFilter(event.target.value as RefFilter)} aria-label={t('toolbar.refFilter')}>
          <option value="all">{t('toolbar.allRefs')}</option>
          <option value="head">{t('toolbar.localBranches')}</option>
          <option value="remote">{t('toolbar.remoteBranches')}</option>
          <option value="tag">{t('metadata.tags')}</option>
        </select>
        <select className={css.select} value={sort} onChange={event => setSort(event.target.value as 'date' | 'author-date' | 'topological')} aria-label={t('toolbar.sort')}>
          <option value="date">{t('toolbar.sortDate')}</option>
          <option value="author-date">{t('toolbar.sortAuthorDate')}</option>
          <option value="topological">{t('toolbar.sortTopological')}</option>
        </select>
        </div><div className={css.toolbarGroup}>
        <label className={css.check}><input type="checkbox" checked={includeAll} onChange={event => setIncludeAll(event.target.checked)} />{t('toolbar.includeAll')}</label>
        <label className={css.check}><input type="checkbox" checked={firstParent} onChange={event => setFirstParent(event.target.checked)} />{t('toolbar.firstParent')}</label>
        </div><div className={css.toolbarActions}>
        <button type="button" className={css.secondaryButton} onClick={() => setFindOpen(current => !current)}>{t('toolbar.find')}</button>
        <button type="button" className={css.secondaryButton} onClick={() => setShowSettings(current => !current)}>{t('toolbar.settings')}</button>
        <button type="button" className={css.primaryButton} onClick={refresh} disabled={loading}>{loading ? t('toolbar.loading') : t('toolbar.refresh')}</button>
        </div>
      </div>
      {refFilter !== 'all' && <div className={css.hint} role="status">{t('refs.filterHint')}</div>}
      {refFilter === 'remote' && <div className={css.hint}>{t('refs.remoteHint')}</div>}

      {findOpen && (
        <div className={css.findContainer}>
          <div className={css.findInputRow}>
            <input className={css.findInput} type="search" value={findText} onChange={event => { setFindText(event.target.value); setFindIndex(0) }} placeholder={t('find.placeholder')} autoFocus aria-label={t('find.aria')} />
            <label className={css.check}><input type="checkbox" checked={findCase} onChange={event => setFindCase(event.target.checked)} />{t('find.case')}</label>
            <label className={css.check}><input type="checkbox" checked={findRegex} onChange={event => { setFindRegex(event.target.checked); setFindIndex(0) }} />{t('find.regex')}</label>
            <button type="button" className={css.primaryButton} onClick={() => setFindOpen(false)}>{t('common.close')}</button>
          </div>
          <FindBar count={findMatches.length} index={findMatches.length === 0 ? 0 : findIndex} onPrev={() => findStep(-1)} onNext={() => findStep(1)} onClear={() => { setFindText(''); setFindIndex(0) }} />
          {findError !== undefined && <div className={css.error} role="alert">{findError}</div>}
        </div>
      )}
      {showSettings && snapshot !== undefined && (
        <SettingsPanel settings={display} onChange={setDisplay} onClose={() => setShowSettings(false)} />
      )}

      {error !== undefined && <div className={css.error} role="alert">{t('error.graph', { message: error })}<button type="button" className={css.secondaryButton} onClick={refresh} disabled={loading}>{t('common.retry')}</button></div>}
      {navigationHint !== undefined && <div className={css.hint} role="status">{navigationHint}<button type="button" className={css.linkButton} onClick={() => setNavigationHint(undefined)}>{t('common.close')}</button></div>}
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
              {columns.map(column => <span key={column} className={css.headerCell}>{t(column === 'hash' ? 'column.commit' : `column.${column}`)}<ColumnResizer column={column} width={display.columnWidths[column]} onChange={resizeColumn} /></span>)}
            </div>
            <GraphSvg layout={layout} workingTreeChanged={snapshot.workingTree.changed} selectedHash={selectedHash} gapAfterRow={expandedRow} gapHeight={inlineHeight} onSelect={selectCommit} rowHeight={rowHeight} lineStyle={display.lineStyle} palette={display.palette} hoveredHash={hoveredHash} onHover={setHoveredHash} />
            <div className={css.commitList}>
              {snapshot.workingTree.changed && (
                <>
                  <button type="button" className={css.workingTreeRow} title={t('worktree.open')} onClick={toggleWorkingTree} aria-expanded={showWorkingTree}>
                    <span className={css.commitDescription}><span className={css.headDot} />{t('worktree.title')}</span>
                    {display.showDate && <span className={css.commitDate}>—</span>}
                    {display.showAuthor && <span className={css.commitAuthor}>—</span>}
                    {display.showHash && <span className={`${css.hash} ${css.commitHash}`}>WORKTREE</span>}
                  </button>
                  {showWorkingTree && (
                    <div className={css.inlineDetails} ref={inlineRef} data-inline-details>
                      <WorkingTreeChangesPanel
                        changes={workingTreeChanges}
                        error={workingTreeError}
                        onRetry={refresh}
                        onClose={() => setShowWorkingTree(false)}
                        onOpenFile={path => setWorkingTreeFile(path)}
                      />
                      {workingTreeFile !== undefined && (
                        <WorkingTreeFileViewer key={`${workingTreeFile}:${readRevision}`} path={workingTreeFile} readWorkingTreeFile={readWorkingTreeFile} onClose={() => setWorkingTreeFile(undefined)} />
                      )}
                    </div>
                  )}
                </>
              )}
              {visibleCommits.map(commit => (
                <Fragment key={commit.hash}>
                  <CommitRow commit={commit} selected={commit.hash === selectedHash} display={display} findActive={findMatches.length > 0 && findMatches.some(match => match.hash === commit.hash)} onSelect={() => selectCommit(commit.hash)} currentBranch={snapshot.branch} hovered={hoveredHash === commit.hash} onHover={setHoveredHash} onShowRefs={() => setSelectedHash(commit.hash)} />
                  {commit.hash === selectedHash && (
                    <div className={css.inlineDetails} ref={inlineRef} data-inline-details>
                      <CommitDetails
                        currentBranch={snapshot.branch}
                        commit={commit}
                        readCommit={readCommit}
                        compareActive={compareTarget === commit.hash}
                        onCompare={() => setCompareTarget(compareTarget === commit.hash ? undefined : commit.hash)}
                        onOpenFile={(hash, path) => setViewingFile({ hash, path })}
                      />
                      {viewingFile !== undefined && viewingFile.hash === commit.hash && (
                        <FileViewer hash={viewingFile.hash} path={viewingFile.path} readFileDiff={readFileDiff} onClose={() => setViewingFile(undefined)} />
                      )}
                      {compareTarget === commit.hash && (
                        <ComparePanel targetHash={commit.hash} commits={snapshot.commits} compare={compare} onClose={() => setCompareTarget(undefined)} />
                      )}
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
          {canLoadMore && <button type="button" className={css.loadMore} onClick={loadMore} disabled={loading}>{loading ? t('toolbar.loading') : t('toolbar.loadMore')}</button>}
          <MetadataStrip metadata={repoMetadata} error={metadataError} onRetry={refresh} />
        </>
      )}
    </section>
  )
}
