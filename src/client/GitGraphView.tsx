import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { GitGraphCommit, GitGraphCommitDetails, GitGraphCompareRequest, GitGraphCompareResult, GitGraphFileChange, GitGraphFileContent, GitGraphFileDiff, GitGraphFileRequest, GitGraphInput, GitGraphMetadata, GitGraphRef, GitGraphSnapshot, GitGraphWorkingTreeChanges, GitGraphWorkingTreeFileRequest } from '../domain.ts'
import { layoutGraph, type GraphLayout } from './graph-layout.ts'
import { loadDisplaySettings, saveDisplaySettings, DEFAULT_DISPLAY_SETTINGS, type GitGraphDisplaySettings, type GraphDateFormat, type GraphStyle } from './settings.ts'
import { css } from './styles.ts'

interface GitGraphViewInjected {
  readonly read: (request: GitGraphInput) => Promise<RemoteResult<GitGraphSnapshot>>
  readonly readCommit: (request: { hash: string }) => Promise<RemoteResult<GitGraphCommitDetails>>
  readonly readFile: (request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileContent>>
  readonly readFileDiff: (request: GitGraphFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>
  readonly readWorkingTree: () => Promise<RemoteResult<GitGraphWorkingTreeChanges>>
  readonly readWorkingTreeFile: (request: GitGraphWorkingTreeFileRequest) => Promise<RemoteResult<GitGraphFileDiff>>
  readonly compare: (request: GitGraphCompareRequest) => Promise<RemoteResult<GitGraphCompareResult>>
  readonly metadata: () => Promise<RemoteResult<GitGraphMetadata>>
}

type Props = ConvViewProps & GitGraphViewInjected
type RefFilter = 'all' | GitGraphRef['kind']

const MAX_COMMITS = 500
const PAGE_SIZE = 100

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
  return refs.length === 0 ? null : (
    <span className={css.refs} aria-label="References">
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
  const rowHeight = 28
  const laneWidth = 16
  const graphPadding = 16
  const graphWidth = Math.max(64, graphPadding * 2 + Math.max(0, layout.laneCount - 1) * laneWidth + 8)
  const rowOffset = workingTreeChanged ? 1 : 0
  const gap = gapAfterRow === undefined ? 0 : gapHeight
  const graphHeight = Math.max(rowHeight, (layout.nodes.length + rowOffset) * rowHeight) + gap
  const colours = ['#0085d9', '#d9008f', '#00a86b', '#d98500', '#7b4bc4', '#e138e8', '#00a7a0', '#dc5b23', '#6f24d6', '#b38b00']
  const headNode = layout.nodes.find(node => node.commit.isHead) ?? layout.nodes[0]
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
      aria-label="Git commit graph"
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
            aria-label={`Select commit ${shortHash(node.commit.hash)} ${node.commit.subject}`}
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
            <circle cx={x} cy={y} r={selected ? 5.5 : 4} fill={node.commit.isHead ? 'var(--git-graph-bg, #282a36)' : colour} stroke={node.commit.isHead ? colour : 'var(--git-graph-bg, #282a36)'} />
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
  return (
    <button type="button" className={selected ? `${css.commit} ${css.commitSelected}` : css.commit} aria-pressed={selected} onClick={onSelect}>
      <span className={css.commitDescription}>
        {commit.isHead && <span className={css.headDot} title="当前 HEAD" aria-label="当前 HEAD" />}
        <Avatar email={commit.email} name={commit.author} />
        <RefBadges refs={commit.refs} />
        <span className={findActive ? css.findHighlight : css.subject}>{commit.subject || '(no subject)'}</span>
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
  const label = type === 'A' ? '新增' : type === 'M' ? '修改' : type === 'D' ? '删除' : type === 'R' ? '重命名' : '冲突'
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
  const textFile = change.additions !== null && change.additions !== undefined && change.deletions !== null && change.deletions !== undefined
  // Like vscode-git-graph, add/del stats are only shown for modified/renamed
  // text files; for added files every line is an addition anyway.
  const showStats = textFile && change.type !== 'A' && change.type !== 'D'
  const diffPossible = change.type !== 'D'
  return (
    <li className={css.fileLeaf}>
      <button
        type="button"
        className={diffPossible ? css.fileRecord : `${css.fileRecord} ${css.fileRecordDisabled}`}
        title={diffPossible ? `查看 Diff · ${change.newPath}` : `文件已删除 · ${change.newPath}`}
        onClick={() => { if (diffPossible) onOpenFile(change) }}
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
  return (
    <span className={css.viewToggle} role="group" aria-label="切换视图">
      <button type="button" className={view === 'list' ? `${css.viewToggleBtn} ${css.viewToggleActive}` : css.viewToggleBtn} onClick={() => onChange('list')}>列表</button>
      <button type="button" className={view === 'tree' ? `${css.viewToggleBtn} ${css.viewToggleActive}` : css.viewToggleBtn} onClick={() => onChange('tree')}>树</button>
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

  if (commit === undefined) return <div className={css.emptyDetails}>选择一条提交查看详情</div>

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
    ? `签名 ${details.signature.status}${details.signature.signer ? ` · ${details.signature.signer}` : ''}`
    : '未签名'

  return (
    <aside className={css.detailsPanel} aria-label="Commit details">
      <div className={css.detailsHeading}>
        <strong>{commit.subject || '(no subject)'}</strong>
        <span className={css.detailsActions}>
          <button type="button" className={css.secondaryButton} onClick={() => void copyHash()}>
            {copied ? '已复制' : '复制 Hash'}
          </button>
          <button type="button" className={css.secondaryButton} onClick={onCompare}>
            {compareActive ? '关闭比较' : '比较提交…'}
          </button>
        </span>
      </div>
      <dl className={css.detailsList}>
        <dt>Hash</dt><dd className={css.mono}>{commit.hash}</dd>
        <dt>作者</dt><dd>{commit.author} &lt;{commit.email}&gt;</dd>
        <dt>时间</dt><dd>{formatDate(commit.date)}</dd>
        {details !== undefined && (
          <>
            <dt>提交者</dt><dd>{details.committer} &lt;{details.committerEmail}&gt;</dd>
            <dt>签名</dt><dd>{signatureText}</dd>
          </>
        )}
        <dt>父提交</dt><dd className={css.mono}>{commit.parents.length === 0 ? '(root)' : commit.parents.map(shortHash).join(', ')}</dd>
        <dt>引用</dt><dd><RefBadges refs={commit.refs} /></dd>
      </dl>

      {details === undefined && detailsError === undefined && <div className={css.pending}>正在读取提交详情…</div>}
      {detailsError !== undefined && <div className={css.error} role="alert">读取详情失败：{detailsError}</div>}

      {details !== undefined && details.body.length > 0 && (
        <pre className={css.detailBody}>{details.body}</pre>
      )}

      {details !== undefined && details.fileChanges.length > 0 && (
        <div className={css.fileChanges}>
          <div className={css.fileChangesHeaderRow}>
            <span className={css.fileChangesTitle}>文件变更 ({details.fileChanges.length})</span>
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
  const label = status === 'A' ? '新增' : status === 'M' ? '修改' : status === 'D' ? '删除' : status === 'R' ? '重命名' : '冲突'
  return <code className={`${css.hash} ${css.fileStatus}`} data-status={status} title={label}>{status}</code>
}

/** Shared line-by-line diff table used by commit and working-tree file views. */
function DiffBody({ diff }: { readonly diff: GitGraphFileDiff }) {
  return (
    <div className={css.diffViewer} data-diff-viewer>
      <div className={css.diffHeader} aria-hidden="true">
        <span className={css.diffLineNo}>旧</span>
        <span className={css.diffLineNo}>新</span>
        <span className={css.diffMarker} />
        <span>内容</span>
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
  const binaryLike = diff !== undefined && diff.lines.length === 0 && (diff.additions > 0 || diff.deletions > 0)

  return (
    <div className={css.fileViewer} data-file-viewer>
      <div className={css.fileViewerHeader}>
        <span className={css.fileViewerTitle}>
          {diff !== undefined && <DiffStatusBadge status={diff.status} />}
          <span className={css.mono}>{path}</span>
        </span>
        <span className={css.fileViewerMeta}>
          {diff !== undefined && `+${diff.additions} −${diff.deletions}`}
        </span>
        <button type="button" className={css.linkButton} onClick={() => void copyPath()}>{copied ? '已复制' : '复制路径'}</button>
        <button type="button" className={css.secondaryButton} onClick={onClose}>关闭</button>
      </div>
      {error !== undefined && <div className={css.error} role="alert">读取文件 Diff 失败：{error}</div>}
      {diff === undefined && error === undefined && <div className={css.pending}>正在读取文件变更…</div>}
      {diff !== undefined && !hasChange && binaryLike && (
        <div className={css.pending}>二进制文件变更，无法以文本 Diff 预览（+{diff.additions} −{diff.deletions}）</div>
      )}
      {diff !== undefined && !hasChange && !binaryLike && (
        <div className={css.pending}>该提交在此文件上没有行级变更。</div>
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
  const [view, setView] = useState<FileListKind>('tree')
  return (
    <div className={css.workingTreePanel} data-working-tree-panel>
      <div className={css.workingTreeHeader}>
        <span className={css.fileViewerTitle}>未提交变更{changes !== undefined ? ` (${changes.changes.length})` : ''}</span>
        <ViewToggle view={view} onChange={setView} />
        <button type="button" className={css.secondaryButton} onClick={onClose}>关闭</button>
      </div>
      {error !== undefined && <div className={css.error} role="alert">读取未提交变更失败：{error}</div>}
      {changes === undefined && error === undefined && <div className={css.pending}>正在读取未提交变更…</div>}
      {changes !== undefined && changes.changes.length === 0 && <div className={css.pending}>工作区没有未提交变更。</div>}
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
  const binaryLike = diff !== undefined && diff.lines.length === 0 && (diff.additions > 0 || diff.deletions > 0)

  return (
    <div className={css.fileViewer} data-working-tree-file-viewer>
      <div className={css.fileViewerHeader}>
        <span className={css.fileViewerTitle}>
          {diff !== undefined && <DiffStatusBadge status={diff.status} />}
          <span className={css.mono}>{path}</span>
        </span>
        <span className={css.fileViewerMeta}>
          {diff !== undefined && `工作区 · +${diff.additions} −${diff.deletions}`}
        </span>
        <button type="button" className={css.linkButton} onClick={() => void copyPath()}>{copied ? '已复制' : '复制路径'}</button>
        <button type="button" className={css.secondaryButton} onClick={onClose}>关闭</button>
      </div>
      {error !== undefined && <div className={css.error} role="alert">读取工作区文件 Diff 失败：{error}</div>}
      {diff === undefined && error === undefined && <div className={css.pending}>正在读取工作区文件变更…</div>}
      {diff !== undefined && !hasChange && binaryLike && (
        <div className={css.pending}>二进制文件变更，无法以文本 Diff 预览（+{diff.additions} −{diff.deletions}）</div>
      )}
      {diff !== undefined && !hasChange && !binaryLike && (
        <div className={css.pending}>该文件在工作区没有行级变更。</div>
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
        <span className={css.fileViewerTitle}>提交比较</span>
        <select className={`${css.select} ${css.selectWide}`} value={baseHash} onChange={event => setBaseHash(event.target.value)} aria-label="比较基准提交">
          {commits.map(commit => (
            <option key={commit.hash} value={commit.hash}>
              {shortHash(commit.hash)} · {commit.subject || '(no subject)'}
            </option>
          ))}
        </select>
        <button type="button" className={css.secondaryButton} onClick={onClose}>关闭</button>
      </div>
      {baseHash === targetHash && <div className={css.compareHint}>请选择不同的基准提交。</div>}
      {error !== undefined && <div className={css.error} role="alert">比较失败：{error}</div>}
      {result !== undefined && (
        <div className={css.fileChanges}>
          <div className={css.fileChangesHeader}>变更文件 ({result.changes.length})</div>
          {result.changes.length === 0 && <div className={css.compareHint}>两个提交之间没有文件变更。</div>}
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
  if (metadata === undefined || (metadata.tags.length === 0 && metadata.stashes.length === 0)) {
    return <div className={css.metadataStrip}>无标签与暂存区条目</div>
  }
  return (
    <div className={css.metadataStrip}>
      {metadata.tags.length > 0 && (
        <div className={css.metadataGroup}>
          <span className={css.metadataLabel}>标签</span>
          {metadata.tags.map(tag => (
            <span key={tag.name} className={css.metaTag} title={tag.annotated ? `${tag.detail?.objectHash ?? ''} · ${tag.detail?.tagger ?? ''}` : '轻量标签'}>
              {tag.name}{tag.annotated ? ' ⚑' : ''}
            </span>
          ))}
        </div>
      )}
      {metadata.stashes.length > 0 && (
        <div className={css.metadataGroup}>
          <span className={css.metadataLabel}>暂存</span>
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
  const toggle = (key: 'showDate' | 'showAuthor' | 'showHash') => onChange({ ...settings, [key]: !settings[key] })
  return (
    <div className={css.settingsPanel} data-settings-panel>
      <div className={css.settingsField}><label><input type="checkbox" checked={settings.showDate} onChange={() => toggle('showDate')} />显示日期列</label></div>
      <div className={css.settingsField}><label><input type="checkbox" checked={settings.showAuthor} onChange={() => toggle('showAuthor')} />显示作者列</label></div>
      <div className={css.settingsField}><label><input type="checkbox" checked={settings.showHash} onChange={() => toggle('showHash')} />显示 Hash 列</label></div>
      <div className={css.settingsField}>
        <label>日期格式
          <select className={css.select} value={settings.dateFormat} onChange={event => onChange({ ...settings, dateFormat: event.target.value as GraphDateFormat })}>
            <option value="short">简短</option>
            <option value="full">完整</option>
            <option value="local">本地（含周几）</option>
          </select>
        </label>
      </div>
      <div className={css.settingsField}>
        <label>图样式
          <select className={css.select} value={settings.graphStyle} onChange={event => onChange({ ...settings, graphStyle: event.target.value as GraphStyle })}>
            <option value="full">完整</option>
            <option value="compact">紧凑</option>
          </select>
        </label>
      </div>
      <button type="button" className={css.secondaryButton} onClick={onClose}>关闭设置</button>
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
  return (
    <div className={css.findBar} data-find-bar>
      <span className={css.findCount}>{count === 0 ? '无匹配' : `${index + 1}/${count}`}</span>
      <button type="button" className={css.secondaryButton} onClick={onPrev} disabled={count === 0}>◂ 上一个</button>
      <button type="button" className={css.secondaryButton} onClick={onNext} disabled={count === 0}>下一个 ▸</button>
      <button type="button" className={css.secondaryButton} onClick={onClear}>清除</button>
    </div>
  )
}

export function GitGraphView({ read, readCommit, readFileDiff, readWorkingTree, readWorkingTreeFile, compare, metadata }: Props) {
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
  // Tracks the search text a full-range Host reload was last triggered with, so
  // the debounced search effect never re-fires from a `loading` toggle.
  const lastSearchedRef = useRef<string>('')

  const load = useCallback(async (request: GitGraphInput) => {
    setLoading(true)
    setError(undefined)
    try {
      const result = await read(request)
      if (!result.ok) throw new Error(result.error.message)
      setSnapshot(result.value)
      setSelectedHash(current => result.value.commits.some(commit => commit.hash === current) ? current : result.value.commits[0]?.hash)
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setLoading(false)
    }
  }, [read])

  const buildRequest = useCallback((max: number, emittedSearch: string): GitGraphInput => {
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
    void load(buildRequest(PAGE_SIZE, ''))
    // Mount only.
  }, [load, buildRequest])

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

  useEffect(() => {
    // Debounce the emitted full-range search. A ref guard means a completed
    // load (which flips `loading`) never re-schedules another reload — without
    // it, every finished load would restart this debounce and loop forever.
    const text = searchText.trim()
    if (text === lastSearchedRef.current) return
    const timer = setTimeout(() => {
      lastSearchedRef.current = text
      setMaxCommits(PAGE_SIZE)
      void load(buildRequest(PAGE_SIZE, text))
    }, 350)
    return () => clearTimeout(timer)
  }, [searchText, load, buildRequest])

  // Search changes trigger a full-range Host query; keep the debounced copy in
  // sync so the ordering of committed search vs scroll is stable.
  useEffect(() => {
    setSearch(searchText.trim())
  }, [searchText])

  const visibleCommits = useMemo(() => {
    if (snapshot === undefined) return []
    return snapshot.commits.filter(commit => refMatches(commit, refFilter))
  }, [refFilter, snapshot])
  const layout = useMemo(() => layoutGraph(visibleCommits), [visibleCommits])
  const canLoadMore = snapshot !== undefined && snapshot.state === 'ready' && snapshot.hasMore
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
    void load(buildRequest(nextMax, search))
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

  // Keyboard navigation: ArrowUp/Down cycle rows, Home/H jump to HEAD, Cmd/Ctrl+F
  // focuses the Find Bar, and Cmd/Ctrl+S toggles the settings panel.
  useEffect(() => {
    const section = sectionRef.current
    if (section === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target !== section && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement)) {
        return
      }
      if (findOpen || findText.length > 0) return
      const rows = visibleCommits
      if (rows.length === 0) return
      const idx = rows.findIndex(commit => commit.hash === selectedHash)
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedHash(idx >= 0 ? (rows[idx + 1]?.hash ?? rows[0]?.hash) : rows[0]?.hash)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedHash(idx > 0 ? (rows[idx - 1]?.hash ?? rows[0]?.hash) : rows[0]?.hash)
      } else if (event.key.toLowerCase() === 'h') {
        const head = rows.find(commit => commit.isHead)
        if (head !== undefined) setSelectedHash(head.hash)
      }
    }
    section.addEventListener('keydown', onKeyDown)
    return () => section.removeEventListener('keydown', onKeyDown)
  }, [visibleCommits, selectedHash, findOpen, findText])

  // Global Cmd/Ctrl+F to open the Find Bar, Cmd/Ctrl+Shift+F to open settings.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
        if (!event.shiftKey) {
          event.preventDefault()
          setFindOpen(true)
          setFindIndex(0)
        } else {
          event.preventDefault()
          setShowSettings(current => !current)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <section ref={sectionRef} className={css.card} data-git-graph data-graph-style={display.graphStyle}>
      <header className={css.header}>
        <div className={css.titleBlock}>
          <strong>Git Graph</strong>
          <span className={css.path}>{snapshot?.path ?? '正在读取当前工作区…'}</span>
        </div>
        {snapshot !== undefined && <span className={snapshot.workingTree.changed ? css.dirty : css.clean}>{snapshot.workingTree.summary}</span>}
      </header>

      <div className={css.toolbar} role="toolbar" aria-label="Git graph controls">
        <input className={css.search} type="search" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="搜索提交、作者、引用或日期（全范围）" aria-label="Search commits" />
        <input className={css.search} type="text" value={branchGlob} onChange={event => setBranchGlob(event.target.value)} placeholder="分支过滤，逗号分隔（如 main,release-*）" aria-label="Branch glob filter" />
        <select className={css.select} value={refFilter} onChange={event => setRefFilter(event.target.value as RefFilter)} aria-label="Filter references">
          <option value="all">全部引用</option>
          <option value="head">本地分支</option>
          <option value="remote">远程分支</option>
          <option value="tag">标签</option>
        </select>
        <select className={css.select} value={sort} onChange={event => setSort(event.target.value as 'date' | 'author-date' | 'topological')} aria-label="Commit order">
          <option value="date">日期排序</option>
          <option value="author-date">作者日期排序</option>
          <option value="topological">拓扑排序</option>
        </select>
        <label className={css.check}><input type="checkbox" checked={includeAll} onChange={event => setIncludeAll(event.target.checked)} />全部 refs</label>
        <label className={css.check}><input type="checkbox" checked={firstParent} onChange={event => setFirstParent(event.target.checked)} />仅首父提交</label>
        <button type="button" className={css.secondaryButton} onClick={() => setFindOpen(current => !current)}>查找</button>
        <button type="button" className={css.secondaryButton} onClick={() => setShowSettings(current => !current)}>设置</button>
        <button type="button" className={css.primaryButton} onClick={refresh} disabled={loading}>{loading ? '读取中…' : '刷新'}</button>
      </div>

      {findOpen && (
        <div className={css.findContainer}>
          <div className={css.findInputRow}>
            <input className={css.findInput} type="search" value={findText} onChange={event => { setFindText(event.target.value); setFindIndex(0) }} placeholder="在当前结果中查找提交…" autoFocus aria-label="Find commits" />
            <label className={css.check}><input type="checkbox" checked={findCase} onChange={event => setFindCase(event.target.checked)} />区分大小写</label>
            <label className={css.check}><input type="checkbox" checked={findRegex} onChange={event => { setFindRegex(event.target.checked); setFindIndex(0) }} />正则</label>
            <button type="button" className={css.primaryButton} onClick={() => setFindOpen(false)}>关闭</button>
          </div>
          <FindBar count={findMatches.length} index={findMatches.length === 0 ? 0 : findIndex} onPrev={() => findStep(-1)} onNext={() => findStep(1)} onClear={() => { setFindText(''); setFindIndex(0) }} />
        </div>
      )}
      {showSettings && snapshot !== undefined && (
        <SettingsPanel settings={display} onChange={setDisplay} onClose={() => setShowSettings(false)} />
      )}

      {error !== undefined && <div className={css.error} role="alert">读取 Git Graph 失败：{error}</div>}
      {loading && snapshot === undefined && <div className={css.pending}>正在读取 Git Graph…</div>}
      {!loading && error === undefined && snapshot !== undefined && visibleCommits.length === 0 && !snapshot.workingTree.changed && (
        <div className={css.pending}>
          {snapshot.state === 'not-git' && '当前目录不是 Git 仓库。'}
          {snapshot.state === 'empty' && '当前是 Git 仓库，但还没有任何提交。'}
          {snapshot.state === 'ready' && '当前筛选条件没有匹配的提交。'}
        </div>
      )}

      {hasGraphRows && snapshot !== undefined && (
        <>
          <div className={css.graphPanel}>
            <div className={css.graphHeader}>Graph</div>
            <div className={css.commitHeader} aria-hidden="true">
              <span>Description</span>
              {display.showDate && <span>Date</span>}
              {display.showAuthor && <span>Author</span>}
              {display.showHash && <span>Commit</span>}
            </div>
            <GraphSvg layout={layout} workingTreeChanged={snapshot.workingTree.changed} selectedHash={selectedHash} gapAfterRow={expandedRow} gapHeight={inlineHeight} onSelect={selectCommit} />
            <div className={css.commitList}>
              {snapshot.workingTree.changed && (
                <>
                  <button type="button" className={css.workingTreeRow} title="查看未提交变更" onClick={toggleWorkingTree} aria-expanded={showWorkingTree}>
                    <span className={css.commitDescription}><span className={css.headDot} />未提交变更</span>
                    <span className={css.commitDate}>—</span>
                    <span className={css.commitAuthor}>—</span>
                    <span className={`${css.hash} ${css.commitHash}`}>WORKTREE</span>
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
          {canLoadMore && <button type="button" className={css.loadMore} onClick={loadMore} disabled={loading}>{loading ? '读取中…' : '加载更多提交'}</button>}
          <MetadataStrip metadata={repoMetadata} />
        </>
      )}
    </section>
  )
}
