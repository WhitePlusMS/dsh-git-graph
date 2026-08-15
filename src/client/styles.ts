/**
 * Git Graph styles are injected at runtime so the package remains usable as a
 * direct `file:` dependency. The variables deliberately follow DSH surface
 * tokens and keep fallbacks for standalone previews.
 */
export const css = {
  card: 'dsh-git-graph-card',
  header: 'dsh-git-graph-header',
  titleBlock: 'dsh-git-graph-title-block',
  path: 'dsh-git-graph-path',
  clean: 'dsh-git-graph-clean',
  dirty: 'dsh-git-graph-dirty',
  toolbar: 'dsh-git-graph-toolbar',
  search: 'dsh-git-graph-search',
  select: 'dsh-git-graph-select',
  check: 'dsh-git-graph-check',
  primaryButton: 'dsh-git-graph-primary-button',
  secondaryButton: 'dsh-git-graph-secondary-button',
  graphPanel: 'dsh-git-graph-panel',
  graph: 'dsh-git-graph-svg',
  graphHeader: 'dsh-git-graph-graph-header',
  commitHeader: 'dsh-git-graph-commit-header',
  graphShadow: 'dsh-git-graph-shadow',
  graphLine: 'dsh-git-graph-line',
  graphHitArea: 'dsh-git-graph-hit-area',
  graphNode: 'dsh-git-graph-node',
  graphNodeSelected: 'dsh-git-graph-node-selected',
  workingTreeEdge: 'dsh-git-graph-working-tree-edge',
  workingTreeNode: 'dsh-git-graph-working-tree-node',
  commitList: 'dsh-git-graph-commit-list',
  workingTreeRow: 'dsh-git-graph-working-tree-row',
  commit: 'dsh-git-graph-commit',
  commitSelected: 'dsh-git-graph-commit-selected',
  commitDescription: 'dsh-git-graph-commit-description',
  commitDate: 'dsh-git-graph-commit-date',
  commitAuthor: 'dsh-git-graph-commit-author',
  commitHash: 'dsh-git-graph-commit-hash',
  headDot: 'dsh-git-graph-head-dot',
  hash: 'dsh-git-graph-hash',
  mono: 'dsh-git-graph-mono',
  subject: 'dsh-git-graph-subject',
  refs: 'dsh-git-graph-refs',
  ref: 'dsh-git-graph-ref',
  refIcon: 'dsh-git-graph-ref-icon',
  refName: 'dsh-git-graph-ref-name',
  detailsPanel: 'dsh-git-graph-details-panel',
  detailsHeading: 'dsh-git-graph-details-heading',
  detailsList: 'dsh-git-graph-details-list',
  emptyDetails: 'dsh-git-graph-empty-details',
  loadMore: 'dsh-git-graph-load-more',
  error: 'dsh-git-graph-error',
  pending: 'dsh-git-graph-pending',
} as const

const STYLE_ID = 'dsh-git-graph-styles'

const CSS = `
.dsh-git-graph-card {
  --git-graph-bg: var(--dsw-alias-bg-layer-2, #282a36);
  --git-graph-layer: var(--dsw-alias-bg-layer-3, #30333f);
  --git-graph-text: var(--dsw-alias-label-primary, #f8f8f2);
  --git-graph-secondary: var(--dsw-alias-label-secondary, #c5cad6);
  --git-graph-tertiary: var(--dsw-alias-label-tertiary, #969eaf);
  --git-graph-border: var(--dsw-alias-border-l2, rgb(255 255 255 / 12%));
  --git-graph-hover: var(--dsw-alias-interactive-bg-hover, rgb(255 255 255 / 8%));
  overflow: hidden;
  border: 1px solid var(--git-graph-border);
  border-radius: 10px;
  background: var(--git-graph-bg);
  color: var(--git-graph-text);
  box-shadow: 0 2px 8px rgb(0 0 0 / 18%);
}
.dsh-git-graph-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--git-graph-border);
  font-size: 13px;
}
.dsh-git-graph-title-block { min-width: 0; }
.dsh-git-graph-title-block strong { display: block; margin-bottom: 2px; }
.dsh-git-graph-path {
  display: block;
  max-width: 620px;
  overflow: hidden;
  color: var(--git-graph-tertiary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-git-graph-clean,
.dsh-git-graph-dirty { white-space: nowrap; font-size: 11px; }
.dsh-git-graph-clean { color: #27864a; }
.dsh-git-graph-dirty { color: #b54708; }
.dsh-git-graph-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--git-graph-border);
  background: var(--git-graph-layer);
}
.dsh-git-graph-search,
.dsh-git-graph-select {
  min-height: 28px;
  border: 1px solid var(--git-graph-border);
  border-radius: 6px;
  background: var(--git-graph-layer);
  color: inherit;
  font-size: 12px;
}
.dsh-git-graph-search { flex: 1 1 180px; min-width: 140px; padding: 0 8px; }
.dsh-git-graph-select { padding: 0 6px; }
.dsh-git-graph-check {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--git-graph-secondary);
  font-size: 11px;
  white-space: nowrap;
}
.dsh-git-graph-check input { margin: 0; }
.dsh-git-graph-primary-button,
.dsh-git-graph-secondary-button,
.dsh-git-graph-load-more {
  min-height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
.dsh-git-graph-primary-button {
  padding: 0 11px;
  border: 1px solid #386bd8;
  background: #386bd8;
  color: #fff;
}
.dsh-git-graph-secondary-button {
  padding: 0 8px;
  border: 1px solid var(--git-graph-border);
  background: var(--git-graph-layer);
  color: var(--git-graph-secondary);
}
.dsh-git-graph-primary-button:hover,
.dsh-git-graph-secondary-button:hover,
.dsh-git-graph-load-more:hover { filter: brightness(.96); }
.dsh-git-graph-primary-button:focus-visible,
.dsh-git-graph-secondary-button:focus-visible,
.dsh-git-graph-load-more:focus-visible,
.dsh-git-graph-search:focus-visible,
.dsh-git-graph-select:focus-visible,
.dsh-git-graph-commit:focus-visible,
.dsh-git-graph-node:focus-visible,
.dsh-git-graph-node-selected:focus-visible { outline: 2px solid #6b9cff; outline-offset: 1px; }
.dsh-git-graph-primary-button:disabled,
.dsh-git-graph-load-more:disabled { cursor: wait; opacity: .65; }
.dsh-git-graph-panel {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  grid-template-rows: 32px minmax(0, auto);
  max-height: 620px;
  min-width: 560px;
  overflow: auto;
}
.dsh-git-graph-graph-header,
.dsh-git-graph-commit-header {
  position: sticky;
  top: 0;
  z-index: 2;
  box-sizing: border-box;
  min-height: 32px;
  border-bottom: 1px solid var(--git-graph-border);
  background: var(--git-graph-layer);
  color: var(--git-graph-secondary);
  font-size: 11px;
  font-weight: 600;
}
.dsh-git-graph-graph-header {
  display: flex;
  align-items: center;
  justify-content: center;
  grid-column: 1;
  grid-row: 1;
  min-width: 64px;
  padding: 0 8px;
}
.dsh-git-graph-commit-header {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 120px 140px 76px;
  align-items: center;
  grid-column: 2;
  grid-row: 1;
  padding: 0 10px 0 2px;
}
.dsh-git-graph-svg {
  display: block;
  grid-column: 1;
  grid-row: 2;
  margin: 0 4px;
  overflow: visible;
}
.dsh-git-graph-svg path { fill: none; stroke-linecap: round; pointer-events: none; }
.dsh-git-graph-svg .dsh-git-graph-shadow { stroke: var(--git-graph-bg); stroke-width: 4; stroke-opacity: .9; }
.dsh-git-graph-svg .dsh-git-graph-line { stroke-width: 2; }
.dsh-git-graph-svg .dsh-git-graph-working-tree-edge { stroke: #d97706; stroke-dasharray: 3 2; }
.dsh-git-graph-svg .dsh-git-graph-working-tree-node { fill: var(--git-graph-bg); stroke: #d6a84f; stroke-width: 1.5; }
.dsh-git-graph-svg circle { stroke-width: 1.5; }
.dsh-git-graph-svg .dsh-git-graph-hit-area { fill: transparent; stroke: transparent; stroke-width: 0; pointer-events: all; }
.dsh-git-graph-node,
.dsh-git-graph-node-selected { cursor: pointer; }
.dsh-git-graph-node-selected circle:not(.dsh-git-graph-hit-area) { stroke: #1f2937; stroke-width: 2.5; }
.dsh-git-graph-commit-list {
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
}
.dsh-git-graph-working-tree-row,
.dsh-git-graph-commit {
  box-sizing: border-box;
  width: 100%;
  min-height: 28px;
  border: 0;
  border-bottom: 1px solid var(--git-graph-border);
  background: transparent;
  text-align: left;
}
.dsh-git-graph-working-tree-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 120px 140px 76px;
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 2px;
  color: #d6a84f;
  font-size: 12px;
}
.dsh-git-graph-commit {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 120px 140px 76px;
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 2px;
  cursor: pointer;
  color: inherit;
  font: inherit;
}
.dsh-git-graph-commit:hover,
.dsh-git-graph-commit-selected { background: var(--git-graph-hover); }
.dsh-git-graph-commit-selected { box-shadow: inset 2px 0 #386bd8; }
.dsh-git-graph-commit-description {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
}
.dsh-git-graph-head-dot {
  box-sizing: border-box;
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border: 2px solid #0085d9;
  border-radius: 50%;
}
.dsh-git-graph-commit-date,
.dsh-git-graph-commit-author,
.dsh-git-graph-commit-hash {
  min-width: 0;
  overflow: hidden;
  color: var(--git-graph-tertiary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-git-graph-commit-hash { text-align: right; }
.dsh-git-graph-hash {
  color: var(--git-graph-tertiary);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}
.dsh-git-graph-mono { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
.dsh-git-graph-subject {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-git-graph-refs { display: inline-flex; flex: 0 0 auto; gap: 4px; margin: 0 3px 0 0; }
.dsh-git-graph-ref {
  --git-graph-ref-color: #d6008f;
  display: inline-flex;
  max-width: 240px;
  min-height: 20px;
  align-items: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--git-graph-ref-color) 70%, transparent);
  border-radius: 5px;
  background: rgb(255 255 255 / 6%);
  color: var(--git-graph-text);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
}
.dsh-git-graph-ref[data-kind='remote'] { --git-graph-ref-color: #0078d4; }
.dsh-git-graph-ref[data-kind='tag'] { --git-graph-ref-color: #c0841a; }
.dsh-git-graph-ref-icon {
  display: block;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  box-sizing: border-box;
  padding: 3px;
  background: var(--git-graph-ref-color);
  color: #fff;
}
.dsh-git-graph-ref-name {
  min-width: 0;
  overflow: hidden;
  padding: 0 7px;
  text-overflow: ellipsis;
}
.dsh-git-graph-details-panel {
  margin: 10px 12px 12px;
  padding: 12px;
  border: 1px solid var(--git-graph-border);
  border-radius: 8px;
  background: var(--git-graph-layer);
}
.dsh-git-graph-details-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.dsh-git-graph-details-heading strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsh-git-graph-details-list {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 6px 12px;
  margin: 12px 0 0;
  color: var(--git-graph-secondary);
  font-size: 11px;
}
.dsh-git-graph-details-list dt { color: var(--git-graph-tertiary); }
.dsh-git-graph-details-list dd { min-width: 0; margin: 0; overflow-wrap: anywhere; color: var(--git-graph-text); }
.dsh-git-graph-empty-details,
.dsh-git-graph-pending,
.dsh-git-graph-error { padding: 14px; font-size: 12px; }
.dsh-git-graph-empty-details,
.dsh-git-graph-pending { color: var(--git-graph-tertiary); }
.dsh-git-graph-error { color: #b42318; background: #fff5f4; }
.dsh-git-graph-load-more { display: block; margin: 10px auto; padding: 0 12px; border: 1px solid var(--git-graph-border); background: var(--git-graph-layer); color: var(--git-graph-secondary); }
@media (max-width: 680px) {
  .dsh-git-graph-header { align-items: flex-start; flex-direction: column; }
  .dsh-git-graph-panel { min-width: 0; }
  .dsh-git-graph-ref { display: none; }
}
`

/** Install the graph-only stylesheet and return its unload disposer. */
export function installGitGraphStyles(): () => void {
  if (typeof document === 'undefined') return () => undefined
  if (document.getElementById(STYLE_ID) !== null) return () => undefined
  const target = document.head ?? document.documentElement
  if (target === null) return () => undefined
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  target.append(style)
  return () => style.remove()
}
