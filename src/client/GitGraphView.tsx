import { createContext, Fragment, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { GitGraphCommit, GitGraphCommitDetails, GitGraphCompareRequest, GitGraphCompareResult, GitGraphFileChange, GitGraphFileContent, GitGraphFileDiff, GitGraphFileRequest, GitGraphQuery, GitGraphMetadata, GitGraphRef, GitGraphSnapshot, GitGraphWorkingTreeChanges, GitGraphWorkingTreeFileRequest } from '../domain.ts'
import { layoutGraph, type GraphLayout } from './graph-layout.ts'
import { loadDisplaySettings, saveDisplaySettings, DEFAULT_DISPLAY_SETTINGS, type GitGraphDisplaySettings, type GraphDateFormat, type GraphStyle } from './settings.ts'
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

function RefBadges({ refs }: { readonly refs: readonly GitGraphRef[] }) {
  const t = useText()
  return refs.length === 0 ? null : (
    <span className={css.refs} aria-label={t('refs.aria')}>
      {refs.map(ref => (
        <span key={`${ref.kind}:${ref.name}`} className={css.ref} data-kind={ref.kind} title={ref.name}>
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
        </span>
      ))}
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
}

function GraphSvg({ layout, workingTreeChanged, selectedHash, gapAfterRow, gapHeight, onSelect }: GraphSvgProps) {
  const t = useText()
  const rowHeight = 28
  const laneWidth = 16
  const graphPadding = 16
  const graphWidth = Math.max(64, graphPadding * 2 + Math.max(0, layout.laneCount - 1) * laneWidth + 8)
  const rowOffset = workingTreeChanged ? 1 : 0
  const gap = gapAfterRow === undefined ? 0 : gapHeight
  const graphHeight = Math.max(rowHeight, (layout.nodes.length + rowOffset) * rowHeight) + gap
  const colours = ['#0085d9', '#d9008f', '#00a86b', '#d98500', '#7b4bc4', '#e138e8', '#00a7a0', '#dc5b23', '#6f24d6', '#b38b00']
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
            <path className={css.graphLine} d={path} stroke={colour} />
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

function CommitRow({ commit, selected, display, findActive, onSelect }: {
  readonly commit: GitGraphCommit
  readonly selected: boolean
  readonly display: GitGraphDisplaySettings
  readonly findActive: boolean
  readonly onSelect: () => void
}) {
  const t = useText()
  return (
    <button type="button" className={selected ? `${css.commit} ${css.commitSelected}` : css.commit} aria-pressed={selected} onClick={onSelect}>
      <span className={css.commitDescription}>
        {commit.isHead && <span className={css.headDot} title={t('graph.head')} aria-label={t('graph.head')} />}
        <Avatar email={commit.email} name={commit.author} />
        <RefBadges refs={commit.refs} />
        <span className={findActive ? css.findHighlight : css.subject}>{commit.subject || t('common.noSubject')}</span>
      </span>
      {display.showDate && <span className={css.commitDate} title={formatDate(commit.date)}>{formatDateValue(commit.date, display.dateFormat)}</span>}
      {display.showAuthor && <span className={css.commitAuthor} title={`${commit.author} <${commit.email}>`}>{commit.author}</span>}
      {display.showHash && <span className={`${css.hash} ${css.commitHash}`} title={commit.hash}>{shortHash(commit.hash)}</span>}
    </button>
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
  // Like vscode-git-graph, add/del stats are only shown for modified/renamed
  // text files; for added files every line is an addition anyway.
  const showStats = textFile && change.type !== 'A' && change.type !== 'D'
  return (
    <li className={css.fileLeaf}>
      <button
        type="button"
        className={css.fileRecord}
        title={t('file.openDiff', { path: change.newPath })}
        onClick={() => onOpenFile(change)}
      >
        <FileGlyph />
        <span className={css.fileName} data-status={change.type}>{name}</span>
        {showStats && (
          <span className={css.fileAddDel}>
            (<span className={css.fileAdd}>+{change.additions}</span>|<span className={css.fileDel}>−{change.deletions}</span>)
          </span>
        )}
      </button>
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
      <button type="button" className={view === 'list' ? `${css.viewToggleBtn} ${css.viewToggleActive}` : css.viewToggleBtn} onClick={() => onChange('list')}>{t('file.list')}</button>
      <button type="button" className={view === 'tree' ? `${css.viewToggleBtn} ${css.viewToggleActive}` : css.viewToggleBtn} onClick={() => onChange('tree')}>{t('file.tree')}</button>
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

function CommitDetails({ commit, readCommit, compareActive, onCompare, onOpenFile }: {
  readonly commit: GitGraphCommit | undefined
  readonly readCommit: GitGraphViewInjected['readCommit']
  readonly compareActive: boolean
  readonly onCompare: () => void
  readonly onOpenFile: (hash: string, path: string) => void
}) {
  const t = useText()
  const [copied, setCopied] = useState(false)
  const [details, setDetails] = useState<GitGraphCommitDetails>()
  const [detailsError, setDetailsError] = useState<string>()
  const [view, setView] = useState<FileListKind>('tree')

  useEffect(() => setCopied(false), [commit?.hash])

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
  }, [commit?.hash, readCommit])

  if (commit === undefined) return <div className={css.emptyDetails}>{t('details.select')}</div>

  const copyHash = async () => {
    if (typeof navigator === 'undefined' || navigator.clipboard === undefined) return
    try {
      await navigator.clipboard.writeText(commit.hash)
      setCopied(true)
    } catch {
      // Clipboard permission is optional; the full hash remains visible.
    }
  }

  const signatureText = details?.signature
    ? `${t('details.signed', { status: details.signature.status })}${details.signature.signer ? ` · ${details.signature.signer}` : ''}`
    : t('details.unsigned')

  return (
    <aside className={css.detailsPanel} aria-label={t('details.aria')}>
      <div className={css.detailsHeading}>
        <strong>{commit.subject || t('common.noSubject')}</strong>
        <span className={css.detailsActions}>
          <button type="button" className={css.secondaryButton} onClick={() => void copyHash()}>
            {copied ? t('common.copied') : t('common.copyHash')}
          </button>
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
        <dt>{t('details.parents')}</dt><dd className={css.mono}>{commit.parents.length === 0 ? t('details.root') : commit.parents.map(shortHash).join(', ')}</dd>
        <dt>{t('details.refs')}</dt><dd><RefBadges refs={commit.refs} /></dd>
      </dl>

      {details === undefined && detailsError === undefined && <div className={css.pending}>{t('details.loading')}</div>}
      {detailsError !== undefined && <div className={css.error} role="alert">{t('details.error', { message: detailsError })}</div>}

      {details !== undefined && details.body.length > 0 && (
        <pre className={css.detailBody}>{details.body}</pre>
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
        {diff.lines.map((line, index) => (
          <div key={index} className={`${css.diffLine} ${line.type === 'added' ? css.diffAdded : line.type === 'removed' ? css.diffRemoved : css.diffContext}`} data-diff-type={line.type}>
            <span className={css.diffLineNo}>{line.oldLine ?? ''}</span>
            <span className={css.diffLineNo}>{line.newLine ?? ''}</span>
            <span className={css.diffMarker}>{line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}</span>
            <span className={css.diffContent}>{line.content}</span>
          </div>
        ))}
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
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    void readFileDiff({ hash, path }).then(result => {
      if (cancelled) return
      if (result.ok) setDiff(result.value)
      else setError(result.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true }
  }, [hash, path, readFileDiff])

  const copyPath = async () => {
    if (typeof navigator === 'undefined' || navigator.clipboard === undefined) return
    try {
      await navigator.clipboard.writeText(path)
      setCopied(true)
    } catch { /* clipboard is optional */ }
  }

  const hasChange = diff !== undefined && diff.lines.some(line => line.type !== 'context')
  const binaryLike = diff?.binary === true

  return (
    <div className={css.fileViewer} data-file-viewer>
      <div className={css.fileViewerHeader}>
        <span className={css.fileViewerTitle}>
          {diff !== undefined && <DiffStatusBadge status={diff.status} />}
          <span className={css.mono}>{path}</span>
        </span>
        <span className={css.fileViewerMeta}>
          {diff !== undefined && !diff.binary && `+${diff.additions} −${diff.deletions}`}
        </span>
        <button type="button" className={css.linkButton} onClick={() => void copyPath()}>{copied ? t('common.copied') : t('common.copyPath')}</button>
        <button type="button" className={css.secondaryButton} onClick={onClose}>{t('common.close')}</button>
      </div>
      {error !== undefined && <div className={css.error} role="alert">{t('diff.error', { message: error })}</div>}
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

function WorkingTreeChangesPanel({ changes, error, onClose, onOpenFile }: {
  readonly changes: GitGraphWorkingTreeChanges | undefined
  readonly error: string | undefined
  readonly onClose: () => void
  readonly onOpenFile: (path: string) => void
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
      {error !== undefined && <div className={css.error} role="alert">{t('worktree.error', { message: error })}</div>}
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
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    void readWorkingTreeFile({ path }).then(result => {
      if (cancelled) return
      if (result.ok) setDiff(result.value)
      else setError(result.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true }
  }, [path, readWorkingTreeFile])

  const copyPath = async () => {
    if (typeof navigator === 'undefined' || navigator.clipboard === undefined) return
    try {
      await navigator.clipboard.writeText(path)
      setCopied(true)
    } catch { /* clipboard is optional */ }
  }

  const hasChange = diff !== undefined && diff.lines.some(line => line.type !== 'context')
  const binaryLike = diff?.binary === true

  return (
    <div className={css.fileViewer} data-working-tree-file-viewer>
      <div className={css.fileViewerHeader}>
        <span className={css.fileViewerTitle}>
          {diff !== undefined && <DiffStatusBadge status={diff.status} />}
          <span className={css.mono}>{path}</span>
        </span>
        <span className={css.fileViewerMeta}>
          {diff !== undefined && !diff.binary && `${t('worktree.label')} · +${diff.additions} −${diff.deletions}`}
        </span>
        <button type="button" className={css.linkButton} onClick={() => void copyPath()}>{copied ? t('common.copied') : t('common.copyPath')}</button>
        <button type="button" className={css.secondaryButton} onClick={onClose}>{t('common.close')}</button>
      </div>
      {error !== undefined && <div className={css.error} role="alert">{t('worktree.diffError', { message: error })}</div>}
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

function MetadataStrip({ metadata }: { readonly metadata: GitGraphMetadata | undefined }) {
  const t = useText()
  if (metadata === undefined || (metadata.tags.length === 0 && metadata.stashes.length === 0)) {
    return <div className={css.metadataStrip}>{t('metadata.empty')}</div>
  }
  return (
    <div className={css.metadataStrip}>
      {metadata.tags.length > 0 && (
        <div className={css.metadataGroup}>
          <span className={css.metadataLabel}>{t('metadata.tags')}</span>
          {metadata.tags.map(tag => (
            <span key={tag.name} className={css.metaTag} title={tag.annotated ? `${tag.detail?.objectHash ?? ''} · ${tag.detail?.tagger ?? ''}` : t('metadata.lightweight')}>
              {tag.name}{tag.annotated ? ' ⚑' : ''}
            </span>
          ))}
        </div>
      )}
      {metadata.stashes.length > 0 && (
        <div className={css.metadataGroup}>
          <span className={css.metadataLabel}>{t('metadata.stashes')}</span>
          {metadata.stashes.map(stash => (
            <span key={stash.selector} className={css.metaStash} title={`${stash.message} · ${stash.author}`}>
              {stash.selector}
            </span>
          ))}
        </div>
      )}
    </div>
  )
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
  const [display, setDisplay] = useState<GitGraphDisplaySettings>(DEFAULT_DISPLAY_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const [findOpen, setFindOpen] = useState(false)
  const [findText, setFindText] = useState('')
  const [findCase, setFindCase] = useState(false)
  const [findRegex, setFindRegex] = useState(false)
  const [findIndex, setFindIndex] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const inlineRef = useRef<HTMLDivElement>(null)
  const [inlineHeight, setInlineHeight] = useState(0)
  // Only the newest query may replace the graph, including after unmount.
  const querySequence = useRef(0)

  const load = useCallback(async (request: GitGraphQuery) => {
    const sequence = ++querySequence.current
    setLoading(true)
    setError(undefined)
    try {
      const result = await read(request)
      if (sequence !== querySequence.current) return
      if (!result.ok) throw new Error(result.error.message)
      setSnapshot(result.value)
      setSelectedHash(current => result.value.commits.some(commit => commit.hash === current) ? current : result.value.commits[0]?.hash)
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

  const refresh = useCallback(() => void load(buildRequest(maxCommits, search)), [load, buildRequest, maxCommits, search])

  useEffect(() => {
    void load(buildRequest(maxCommits, search))
  }, [load, buildRequest, maxCommits, search])

  useEffect(() => () => { querySequence.current += 1 }, [read])

  useEffect(() => {
    let cancelled = false
    void metadata().then(result => {
      if (cancelled) return
      if (result.ok) setRepoMetadata(result.value)
    }).catch(() => { /* metadata is best-effort and non-blocking */ })
    return () => { cancelled = true }
  }, [metadata])

  // Load the uncommitted-changes list when the working-tree panel is opened.
  useEffect(() => {
    if (!showWorkingTree) return
    let cancelled = false
    setWorkingTreeChanges(undefined)
    setWorkingTreeError(undefined)
    setWorkingTreeFile(undefined)
    void readWorkingTree().then(result => {
      if (cancelled) return
      if (result.ok) setWorkingTreeChanges(result.value)
      else setWorkingTreeError(result.error.message)
    }).catch((cause: unknown) => {
      if (!cancelled) setWorkingTreeError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true }
  }, [showWorkingTree, readWorkingTree])

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
  }, [snapshot?.path])

  // Persist display settings scoped to the stable repository id; never touches
  // the Host query or any Git data.
  useEffect(() => {
    if (snapshot === undefined) return
    saveDisplaySettings(snapshot.path, display)
  }, [display, snapshot?.path])

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
      if (target instanceof HTMLElement && target.closest('input, select, textarea, [contenteditable="true"]') !== null) return
      if (findOpen || findText.length > 0 || visibleCommits.length === 0) return
      const index = visibleCommits.findIndex(commit => commit.hash === selectedHash)
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const nextIndex = event.key === 'ArrowDown' ? (index + 1) % visibleCommits.length : Math.max(0, index - 1)
        setSelectedHash(visibleCommits[nextIndex]?.hash)
      } else if (event.key.toLowerCase() === 'h') {
        const head = visibleCommits.find(commit => commit.isHead)
        if (head !== undefined) setSelectedHash(head.hash)
      }
    }
    section.addEventListener('keydown', onKeyDown)
    return () => section.removeEventListener('keydown', onKeyDown)
  }, [visibleCommits, selectedHash, findOpen, findText])

  // Share the exact column definition with the header, commits and worktree row.
  const columns = ['minmax(240px, 1fr)']
  let rowMin = 252
  if (display.showDate) { columns.push('100px'); rowMin += 108 }
  if (display.showAuthor) { columns.push('120px'); rowMin += 128 }
  if (display.showHash) { columns.push('76px'); rowMin += 84 }
  const columnStyle: CSSProperties & { '--git-graph-columns': string; '--git-graph-row-min': string } = {
    '--git-graph-columns': columns.join(' '),
    '--git-graph-row-min': `${rowMin}px`,
  }

  return (
    <section ref={sectionRef} tabIndex={0} aria-label={t('view.title')} style={columnStyle} className={css.card} data-git-graph data-graph-style={display.graphStyle}>
      <header className={css.header}>
        <div className={css.titleBlock}>
          <strong>{t('view.title')}</strong>
          <span className={css.path}>{snapshot?.path ?? t('status.loadingWorkspace')}</span>
        </div>
        {snapshot !== undefined && <span className={snapshot.workingTree.changed ? css.dirty : css.clean}>{snapshot.state === 'not-git' ? t('status.notGit') : snapshot.workingTree.changed ? t('status.dirty') : t('status.clean')}</span>}
      </header>

      <div className={css.toolbar} role="toolbar" aria-label={t('toolbar.aria')}>
        <input className={css.search} type="search" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder={t('toolbar.searchPlaceholder')} aria-label={t('toolbar.search')} />
        <input className={css.search} type="text" value={branchGlob} onChange={event => setBranchGlob(event.target.value)} placeholder={t('toolbar.branchPlaceholder')} aria-label={t('toolbar.branch')} />
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
        <label className={css.check}><input type="checkbox" checked={includeAll} onChange={event => setIncludeAll(event.target.checked)} />{t('toolbar.includeAll')}</label>
        <label className={css.check}><input type="checkbox" checked={firstParent} onChange={event => setFirstParent(event.target.checked)} />{t('toolbar.firstParent')}</label>
        <button type="button" className={css.secondaryButton} onClick={() => setFindOpen(current => !current)}>{t('toolbar.find')}</button>
        <button type="button" className={css.secondaryButton} onClick={() => setShowSettings(current => !current)}>{t('toolbar.settings')}</button>
        <button type="button" className={css.primaryButton} onClick={refresh} disabled={loading}>{loading ? t('toolbar.loading') : t('toolbar.refresh')}</button>
      </div>

      {findOpen && (
        <div className={css.findContainer}>
          <div className={css.findInputRow}>
            <input className={css.findInput} type="search" value={findText} onChange={event => { setFindText(event.target.value); setFindIndex(0) }} placeholder={t('find.placeholder')} autoFocus aria-label={t('find.aria')} />
            <label className={css.check}><input type="checkbox" checked={findCase} onChange={event => setFindCase(event.target.checked)} />{t('find.case')}</label>
            <label className={css.check}><input type="checkbox" checked={findRegex} onChange={event => { setFindRegex(event.target.checked); setFindIndex(0) }} />{t('find.regex')}</label>
            <button type="button" className={css.primaryButton} onClick={() => setFindOpen(false)}>{t('common.close')}</button>
          </div>
          <FindBar count={findMatches.length} index={findMatches.length === 0 ? 0 : findIndex} onPrev={() => findStep(-1)} onNext={() => findStep(1)} onClear={() => { setFindText(''); setFindIndex(0) }} />
        </div>
      )}
      {showSettings && snapshot !== undefined && (
        <SettingsPanel settings={display} onChange={setDisplay} onClose={() => setShowSettings(false)} />
      )}

      {error !== undefined && <div className={css.error} role="alert">{t('error.graph', { message: error })}</div>}
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
          <div className={css.graphPanel}>
            <div className={css.graphHeader}>{t('column.graph')}</div>
            <div className={css.commitHeader} aria-hidden="true">
              <span>{t('column.description')}</span>
              {display.showDate && <span>{t('column.date')}</span>}
              {display.showAuthor && <span>{t('column.author')}</span>}
              {display.showHash && <span>{t('column.commit')}</span>}
            </div>
            <GraphSvg layout={layout} workingTreeChanged={snapshot.workingTree.changed} selectedHash={selectedHash} gapAfterRow={expandedRow} gapHeight={inlineHeight} onSelect={selectCommit} />
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
                        onClose={() => setShowWorkingTree(false)}
                        onOpenFile={path => setWorkingTreeFile(path)}
                      />
                      {workingTreeFile !== undefined && (
                        <WorkingTreeFileViewer path={workingTreeFile} readWorkingTreeFile={readWorkingTreeFile} onClose={() => setWorkingTreeFile(undefined)} />
                      )}
                    </div>
                  )}
                </>
              )}
              {visibleCommits.map(commit => (
                <Fragment key={commit.hash}>
                  <CommitRow commit={commit} selected={commit.hash === selectedHash} display={display} findActive={findMatches.length > 0 && findMatches.some(match => match.hash === commit.hash)} onSelect={() => selectCommit(commit.hash)} />
                  {commit.hash === selectedHash && (
                    <div className={css.inlineDetails} ref={inlineRef} data-inline-details>
                      <CommitDetails
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
          <MetadataStrip metadata={repoMetadata} />
        </>
      )}
    </section>
  )
}
