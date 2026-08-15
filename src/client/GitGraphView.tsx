import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { GitGraphCommit, GitGraphInput, GitGraphRef, GitGraphSnapshot } from '../domain.ts'
import { layoutGraph, type GraphLayout } from './graph-layout.ts'
import { css } from './styles.ts'

interface GitGraphViewInjected {
  readonly read: (request: GitGraphInput) => Promise<RemoteResult<GitGraphSnapshot>>
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

function formatShortDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString()
}

function refMatches(commit: GitGraphCommit, filter: RefFilter): boolean {
  return filter === 'all' || commit.refs.some(ref => ref.kind === filter)
}

function textMatches(commit: GitGraphCommit, query: string): boolean {
  if (query.length === 0) return true
  const haystack = [
    commit.hash,
    commit.subject,
    commit.author,
    commit.email,
    ...commit.refs.map(ref => ref.name),
  ].join('\n').toLocaleLowerCase()
  return haystack.includes(query.toLocaleLowerCase())
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
  readonly onSelect: (hash: string) => void
}

function GraphSvg({ layout, workingTreeChanged, selectedHash, onSelect }: GraphSvgProps) {
  const rowHeight = 28
  const laneWidth = 16
  const graphPadding = 16
  const graphWidth = Math.max(64, graphPadding * 2 + Math.max(0, layout.laneCount - 1) * laneWidth + 8)
  const rowOffset = workingTreeChanged ? 1 : 0
  const graphHeight = Math.max(rowHeight, (layout.nodes.length + rowOffset) * rowHeight)
  const colours = ['#0085d9', '#d9008f', '#00a86b', '#d98500', '#7b4bc4', '#e138e8', '#00a7a0', '#dc5b23', '#6f24d6', '#b38b00']
  const headNode = layout.nodes.find(node => node.commit.isHead) ?? layout.nodes[0]
  const pointX = (lane: number) => graphPadding + lane * laneWidth
  const pointY = (row: number) => (row + rowOffset) * rowHeight + rowHeight / 2
  const pathForEdge = (edge: GraphLayout['edges'][number]) => {
    const x1 = pointX(edge.fromLane)
    const x2 = pointX(edge.toLane)
    const y1 = pointY(edge.row)
    const y2 = pointY(edge.row + 1)
    if (x1 === x2) return `M ${x1} ${y1} L ${x2} ${y2}`
    const curve = rowHeight * 0.8
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

function CommitRow({ commit, selected, onSelect }: { readonly commit: GitGraphCommit; readonly selected: boolean; readonly onSelect: () => void }) {
  return (
    <button type="button" className={selected ? `${css.commit} ${css.commitSelected}` : css.commit} aria-pressed={selected} onClick={onSelect}>
      <span className={css.commitDescription}>
        {commit.isHead && <span className={css.headDot} title="当前 HEAD" aria-label="当前 HEAD" />}
        <RefBadges refs={commit.refs} />
        <span className={css.subject}>{commit.subject || '(no subject)'}</span>
      </span>
      <span className={css.commitDate} title={formatDate(commit.date)}>{formatShortDate(commit.date)}</span>
      <span className={css.commitAuthor} title={`${commit.author} <${commit.email}>`}>{commit.author}</span>
      <span className={`${css.hash} ${css.commitHash}`} title={commit.hash}>{shortHash(commit.hash)}</span>
    </button>
  )
}

function CommitDetails({ commit }: { readonly commit: GitGraphCommit | undefined }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => setCopied(false), [commit?.hash])

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

  return (
    <aside className={css.detailsPanel} aria-label="Commit details">
      <div className={css.detailsHeading}>
        <strong>{commit.subject || '(no subject)'}</strong>
        <button type="button" className={css.secondaryButton} onClick={() => void copyHash()}>
          {copied ? '已复制' : '复制 Hash'}
        </button>
      </div>
      <dl className={css.detailsList}>
        <dt>Hash</dt><dd className={css.mono}>{commit.hash}</dd>
        <dt>作者</dt><dd>{commit.author} &lt;{commit.email}&gt;</dd>
        <dt>时间</dt><dd>{formatDate(commit.date)}</dd>
        <dt>父提交</dt><dd className={css.mono}>{commit.parents.length === 0 ? '(root)' : commit.parents.map(shortHash).join(', ')}</dd>
        <dt>引用</dt><dd><RefBadges refs={commit.refs} /></dd>
      </dl>
    </aside>
  )
}

export function GitGraphView({ read }: Props) {
  const [snapshot, setSnapshot] = useState<GitGraphSnapshot | undefined>()
  const [selectedHash, setSelectedHash] = useState<string>()
  const [query, setQuery] = useState('')
  const [refFilter, setRefFilter] = useState<RefFilter>('all')
  const [maxCommits, setMaxCommits] = useState(PAGE_SIZE)
  const [includeAll, setIncludeAll] = useState(true)
  const [firstParent, setFirstParent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

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

  useEffect(() => {
    void load({ maxCommits: PAGE_SIZE, all: true, firstParent: false })
  }, [load])

  const visibleCommits = useMemo(() => {
    if (snapshot === undefined) return []
    return snapshot.commits.filter(commit => refMatches(commit, refFilter) && textMatches(commit, query.trim()))
  }, [query, refFilter, snapshot])
  const layout = useMemo(() => layoutGraph(visibleCommits), [visibleCommits])
  const selectedCommit = snapshot?.commits.find(commit => commit.hash === selectedHash)
  const canLoadMore = snapshot !== undefined && snapshot.commits.length >= maxCommits && maxCommits < MAX_COMMITS
  const hasGraphRows = snapshot !== undefined && (visibleCommits.length > 0 || snapshot.workingTree.changed)
  const hasNoRepository = snapshot !== undefined && snapshot.commits.length === 0 && snapshot.head === null && !snapshot.workingTree.changed

  const refresh = () => void load({ maxCommits, all: includeAll, firstParent })
  const loadMore = () => {
    const nextMax = Math.min(MAX_COMMITS, maxCommits + PAGE_SIZE)
    setMaxCommits(nextMax)
    void load({ maxCommits: nextMax, all: includeAll, firstParent })
  }

  return (
    <section className={css.card} data-git-graph>
      <header className={css.header}>
        <div className={css.titleBlock}>
          <strong>Git Graph</strong>
          <span className={css.path}>{snapshot?.path ?? '正在读取当前工作区…'}</span>
        </div>
        {snapshot !== undefined && <span className={snapshot.workingTree.changed ? css.dirty : css.clean}>{snapshot.workingTree.summary}</span>}
      </header>

      <div className={css.toolbar} role="toolbar" aria-label="Git graph controls">
        <input className={css.search} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索提交、作者或引用" aria-label="Search commits" />
        <select className={css.select} value={refFilter} onChange={event => setRefFilter(event.target.value as RefFilter)} aria-label="Filter references">
          <option value="all">全部引用</option>
          <option value="head">本地分支</option>
          <option value="remote">远程分支</option>
          <option value="tag">标签</option>
        </select>
        <label className={css.check}><input type="checkbox" checked={includeAll} onChange={event => setIncludeAll(event.target.checked)} />全部 refs</label>
        <label className={css.check}><input type="checkbox" checked={firstParent} onChange={event => setFirstParent(event.target.checked)} />仅首父提交</label>
        <button type="button" className={css.primaryButton} onClick={refresh} disabled={loading}>{loading ? '读取中…' : '刷新'}</button>
      </div>

      {error !== undefined && <div className={css.error} role="alert">读取 Git Graph 失败：{error}</div>}
      {loading && snapshot === undefined && <div className={css.pending}>正在读取 Git Graph…</div>}
      {!loading && error === undefined && snapshot !== undefined && visibleCommits.length === 0 && !snapshot.workingTree.changed && (
        <div className={css.pending}>{hasNoRepository ? '当前目录不是 Git 仓库，或仓库尚无提交。' : '当前筛选条件没有匹配的提交。'}</div>
      )}

      {hasGraphRows && snapshot !== undefined && (
        <>
          <div className={css.graphPanel}>
            <div className={css.graphHeader}>Graph</div>
            <div className={css.commitHeader} aria-hidden="true">
              <span>Description</span>
              <span>Date</span>
              <span>Author</span>
              <span>Commit</span>
            </div>
            <GraphSvg layout={layout} workingTreeChanged={snapshot.workingTree.changed} selectedHash={selectedHash} onSelect={setSelectedHash} />
            <div className={css.commitList}>
              {snapshot.workingTree.changed && (
                <div className={css.workingTreeRow}>
                  <span className={css.commitDescription}><span className={css.headDot} />未提交变更</span>
                  <span className={css.commitDate}>—</span>
                  <span className={css.commitAuthor}>—</span>
                  <span className={`${css.hash} ${css.commitHash}`}>WORKTREE</span>
                </div>
              )}
              {visibleCommits.map(commit => <CommitRow key={commit.hash} commit={commit} selected={commit.hash === selectedHash} onSelect={() => setSelectedHash(commit.hash)} />)}
            </div>
          </div>
          {canLoadMore && <button type="button" className={css.loadMore} onClick={loadMore} disabled={loading}>{loading ? '读取中…' : '加载更多提交'}</button>}
          <CommitDetails commit={selectedCommit} />
        </>
      )}
    </section>
  )
}
