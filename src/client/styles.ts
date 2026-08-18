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
  workingTreePanel: 'dsh-git-graph-working-tree-panel',
  workingTreeHeader: 'dsh-git-graph-working-tree-header',
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
  avatar: 'dsh-git-graph-avatar',
  metadataStrip: 'dsh-git-graph-metadata-strip',
  metadataGroup: 'dsh-git-graph-metadata-group',
  metadataLabel: 'dsh-git-graph-metadata-label',
  metaTag: 'dsh-git-graph-meta-tag',
  metaStash: 'dsh-git-graph-meta-stash',
  detailsPanel: 'dsh-git-graph-details-panel',
  detailsHeading: 'dsh-git-graph-details-heading',
  detailsActions: 'dsh-git-graph-details-actions',
  detailsList: 'dsh-git-graph-details-list',
  emptyDetails: 'dsh-git-graph-empty-details',
  detailBody: 'dsh-git-graph-detail-body',
  fileStatus: 'dsh-git-graph-file-status',
  fileChanges: 'dsh-git-graph-file-changes',
  fileChangesHeader: 'dsh-git-graph-file-changes-header',
  fileChangesHeaderRow: 'dsh-git-graph-file-changes-header-row',
  fileChangesTitle: 'dsh-git-graph-file-changes-title',
  viewToggle: 'dsh-git-graph-view-toggle',
  viewToggleBtn: 'dsh-git-graph-view-toggle-btn',
  viewToggleActive: 'dsh-git-graph-view-toggle-active',
  fileChangesList: 'dsh-git-graph-file-changes-list',
  fileChange: 'dsh-git-graph-file-change',
  fileChangeStat: 'dsh-git-graph-file-change-stat',
  tree: 'dsh-git-graph-tree',
  treeChildren: 'dsh-git-graph-tree-children',
  treeFolder: 'dsh-git-graph-tree-folder',
  treeFolderToggle: 'dsh-git-graph-tree-folder-toggle',
  treeFolderName: 'dsh-git-graph-tree-folder-name',
  fileList: 'dsh-git-graph-file-list',
  fileLeaf: 'dsh-git-graph-file-leaf',
  fileRecord: 'dsh-git-graph-file-record',
  fileRecordDisabled: 'dsh-git-graph-file-record-disabled',
  fileGlyph: 'dsh-git-graph-file-glyph',
  fileName: 'dsh-git-graph-file-name',
  fileAddDel: 'dsh-git-graph-file-add-del',
  fileAdd: 'dsh-git-graph-file-add',
  fileDel: 'dsh-git-graph-file-del',
  inlineDetails: 'dsh-git-graph-inline-details',
  linkButton: 'dsh-git-graph-link-button',
  fileViewer: 'dsh-git-graph-file-viewer',
  fileViewerHeader: 'dsh-git-graph-file-viewer-header',
  fileViewerTitle: 'dsh-git-graph-file-viewer-title',
  fileViewerMeta: 'dsh-git-graph-file-viewer-meta',
  fileViewerContent: 'dsh-git-graph-file-viewer-content',
  diffViewer: 'dsh-git-graph-diff-viewer',
  diffHeader: 'dsh-git-graph-diff-header',
  diffBody: 'dsh-git-graph-diff-body',
  diffLine: 'dsh-git-graph-diff-line',
  diffAdded: 'dsh-git-graph-diff-added',
  diffRemoved: 'dsh-git-graph-diff-removed',
  diffContext: 'dsh-git-graph-diff-context',
  diffLineNo: 'dsh-git-graph-diff-line-no',
  diffMarker: 'dsh-git-graph-diff-marker',
  diffContent: 'dsh-git-graph-diff-content',
  comparePanel: 'dsh-git-graph-compare-panel',
  compareRow: 'dsh-git-graph-compare-row',
  compareHint: 'dsh-git-graph-compare-hint',
  selectWide: 'dsh-git-graph-select-wide',
  loadMore: 'dsh-git-graph-load-more',
  settingsPanel: 'dsh-git-graph-settings-panel',
  settingsField: 'dsh-git-graph-settings-field',
  findContainer: 'dsh-git-graph-find-container',
  findInputRow: 'dsh-git-graph-find-input-row',
  findInput: 'dsh-git-graph-find-input',
  findBar: 'dsh-git-graph-find-bar',
  findCount: 'dsh-git-graph-find-count',
  findHighlight: 'dsh-git-graph-find-highlight',
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
  cursor: pointer;
  font: inherit;
}
.dsh-git-graph-working-tree-row:hover { background: var(--git-graph-hover); }
.dsh-git-graph-working-tree-panel { margin: 12px 0 0; }
.dsh-git-graph-working-tree-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.dsh-git-graph-working-tree-header .dsh-git-graph-view-toggle { margin-left: auto; }
.dsh-git-graph-working-tree-header .dsh-git-graph-secondary-button { min-height: 24px; padding: 0 8px; flex: none; font-size: 11px; }
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
.dsh-git-graph-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  user-select: none;
}
.dsh-git-graph-metadata-strip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0 12px 10px;
  padding: 10px 12px;
  border: 1px solid var(--git-graph-border);
  border-radius: 8px;
  background: var(--git-graph-layer);
  font-size: 11px;
}
.dsh-git-graph-metadata-strip.empty { color: var(--git-graph-tertiary); }
.dsh-git-graph-metadata-group { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.dsh-git-graph-metadata-label { color: var(--git-graph-tertiary); font-size: 10px; margin-right: 2px; }
.dsh-git-graph-meta-tag,
.dsh-git-graph-meta-stash {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px;
  border: 1px solid var(--git-graph-border);
}
.dsh-git-graph-meta-tag { background: rgb(129 140 248 / 18%); color: #818cf8; }
.dsh-git-graph-meta-stash { background: rgb(0 169 104 / 16%); color: #34d399; }
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
  padding: 10px 12px 12px;
  border: 1px solid var(--git-graph-border);
  border-radius: 8px;
  background: var(--git-graph-layer);
}
.dsh-git-graph-details-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px 10px;
}
.dsh-git-graph-details-heading strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsh-git-graph-details-actions {
  display: flex;
  align-items: center;
  flex: none;
  gap: 6px;
  margin-left: auto;
}
.dsh-git-graph-details-actions .dsh-git-graph-secondary-button { min-height: 24px; padding: 0 8px; font-size: 11px; }
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
.dsh-git-graph-detail-body {
  margin: 12px 0 0;
  padding: 10px;
  overflow: auto;
  border: 1px solid var(--git-graph-border);
  border-radius: 6px;
  background: rgb(0 0 0 / 14%);
  color: var(--git-graph-text);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.dsh-git-graph-file-changes { margin: 12px 0 0; }
.dsh-git-graph-file-changes-header {
  margin-bottom: 6px;
  color: var(--git-graph-secondary);
  font-size: 11px;
  font-weight: 600;
}
.dsh-git-graph-file-changes-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.dsh-git-graph-file-changes-title {
  color: var(--git-graph-secondary);
  font-size: 11px;
  font-weight: 600;
}
.dsh-git-graph-view-toggle {
  display: inline-flex;
  flex: none;
  overflow: hidden;
  border: 1px solid var(--git-graph-border);
  border-radius: 5px;
  background: var(--git-graph-layer);
}
.dsh-git-graph-view-toggle-btn {
  padding: 2px 10px;
  border: 0;
  background: transparent;
  color: var(--git-graph-tertiary);
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
}
.dsh-git-graph-view-toggle-btn + .dsh-git-graph-view-toggle-btn { border-left: 1px solid var(--git-graph-border); }
.dsh-git-graph-view-toggle-btn:hover { color: var(--git-graph-text); }
.dsh-git-graph-view-toggle-active {
  background: var(--git-graph-hover);
  color: var(--git-graph-text);
}
.dsh-git-graph-file-changes-list { margin: 0; padding: 0; list-style: none; }
.dsh-git-graph-file-change {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  border-bottom: 1px solid var(--git-graph-border);
  font-size: 11px;
}
.dsh-git-graph-file-change:last-child { border-bottom: 0; }
.dsh-git-graph-file-status {
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
}
.dsh-git-graph-file-status[data-status='A'] { background: rgb(35 134 74 / 22%); color: #34a35f; }
.dsh-git-graph-file-status[data-status='M'] { background: rgb(180 83 9 / 20%); color: #d97706; }
.dsh-git-graph-file-status[data-status='D'] { background: rgb(180 35 24 / 18%); color: #e5484d; }
.dsh-git-graph-file-status[data-status='R'] { background: rgb(100 116 190 / 20%); color: #818cf8; }
.dsh-git-graph-file-status[data-status='U'] { background: rgb(180 35 24 / 25%); color: #f87171; }
.dsh-git-graph-file-change-stat { color: var(--git-graph-tertiary); }
.dsh-git-graph-tree,
.dsh-git-graph-file-list { margin: 0; padding: 0; list-style: none; }
.dsh-git-graph-tree-children { margin: 0; padding: 0 0 0 18px; list-style: none; }
.dsh-git-graph-tree-folder,
.dsh-git-graph-file-leaf { margin-top: 2px; }
.dsh-git-graph-tree > li:first-child,
.dsh-git-graph-tree-children > li:first-child,
.dsh-git-graph-file-list > li:first-child { margin-top: 0; }
.dsh-git-graph-tree-folder-toggle,
.dsh-git-graph-file-record {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  min-height: 22px;
  padding: 2px 4px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--git-graph-secondary);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  text-align: left;
}
.dsh-git-graph-tree-folder-toggle:hover,
.dsh-git-graph-file-record:hover { background: var(--git-graph-hover); }
.dsh-git-graph-file-record-disabled { cursor: default; }
.dsh-git-graph-file-record-disabled:hover { background: transparent; }
.dsh-git-graph-file-glyph {
  width: 13px;
  height: 13px;
  flex: none;
  margin-right: 6px;
  color: var(--git-graph-tertiary);
}
.dsh-git-graph-tree-folder-name,
.dsh-git-graph-file-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-git-graph-file-name { color: var(--git-graph-text); }
.dsh-git-graph-file-name[data-status='A'],
.dsh-git-graph-file-name[data-status='U'] { color: #34a35f; }
.dsh-git-graph-file-name[data-status='M'] { color: #d97706; }
.dsh-git-graph-file-name[data-status='D'] { color: #e5484d; }
.dsh-git-graph-file-name[data-status='R'] { color: #818cf8; }
.dsh-git-graph-file-add-del { margin-left: 8px; flex: none; color: var(--git-graph-tertiary); }
.dsh-git-graph-file-add { padding: 0 3px; color: #34a35f; }
.dsh-git-graph-file-del { padding: 0 3px; color: #e5484d; }
.dsh-git-graph-inline-details {
  padding: 8px 10px;
  border-bottom: 1px solid var(--git-graph-border);
  background: rgb(128 128 128 / 8%);
}
.dsh-git-graph-inline-details .dsh-git-graph-details-panel,
.dsh-git-graph-inline-details .dsh-git-graph-working-tree-panel { margin: 0; }
.dsh-git-graph-link-button {
  border: 0;
  background: transparent;
  color: #6b9cff;
  cursor: pointer;
  font-size: 11px;
  padding: 0;
}
.dsh-git-graph-link-button:hover { text-decoration: underline; }
.dsh-git-graph-file-viewer { margin: 12px 0 0; }
.dsh-git-graph-file-viewer-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.dsh-git-graph-file-viewer-header .dsh-git-graph-link-button,
.dsh-git-graph-file-viewer-header .dsh-git-graph-secondary-button {
  min-height: 24px;
  padding: 0 8px;
  flex: none;
  font-size: 11px;
}
.dsh-git-graph-file-viewer-title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--git-graph-secondary);
  white-space: nowrap;
}
.dsh-git-graph-file-viewer-title .dsh-git-graph-mono {
  overflow: hidden;
  text-overflow: ellipsis;
}
.dsh-git-graph-file-viewer-meta {
  margin-right: auto;
  color: var(--git-graph-tertiary);
  font-size: 10px;
  white-space: nowrap;
}
.dsh-git-graph-file-viewer-content {
  max-height: 320px;
  margin: 0;
  padding: 10px;
  overflow: auto;
  border: 1px solid var(--git-graph-border);
  border-radius: 6px;
  background: rgb(0 0 0 / 14%);
  color: var(--git-graph-text);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.dsh-git-graph-diff-viewer {
  max-height: 380px;
  overflow: auto;
  border: 1px solid var(--git-graph-border);
  border-radius: 6px;
  background: rgb(0 0 0 / 14%);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
  line-height: 18px;
}
.dsh-git-graph-diff-header,
.dsh-git-graph-diff-line {
  display: flex;
  align-items: center;
  padding: 0 8px;
}
.dsh-git-graph-diff-line { min-height: 18px; }
.dsh-git-graph-diff-header {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 24px;
  background: var(--git-graph-layer);
  border-bottom: 1px solid var(--git-graph-border);
  color: var(--git-graph-tertiary);
  font-weight: 600;
}
.dsh-git-graph-diff-line-no {
  width: 40px;
  flex: none;
  text-align: right;
  padding-right: 8px;
  color: var(--git-graph-tertiary);
  user-select: none;
}
.dsh-git-graph-diff-marker {
  width: 14px;
  flex: none;
  text-align: center;
  color: var(--git-graph-tertiary);
  user-select: none;
}
.dsh-git-graph-diff-content { white-space: pre-wrap; word-break: break-word; }
.dsh-git-graph-diff-added { background: rgb(40 185 115 / 16%); }
.dsh-git-graph-diff-added .dsh-git-graph-diff-marker { color: #28b973; }
.dsh-git-graph-diff-removed { background: rgb(235 78 78 / 16%); }
.dsh-git-graph-diff-removed .dsh-git-graph-diff-marker { color: #eb4e4e; }
.dsh-git-graph-diff-context .dsh-git-graph-diff-marker { color: var(--git-graph-tertiary); }
.dsh-git-graph-compare-panel { margin: 12px 0 0; }
.dsh-git-graph-compare-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 11px; }
.dsh-git-graph-compare-hint { color: var(--git-graph-tertiary); }
.dsh-git-graph-select-wide { flex: 1 1 220px; min-width: 160px; }
.dsh-git-graph-settings-panel {
  margin: 0 12px 10px;
  padding: 10px 12px;
  border: 1px solid var(--git-graph-border);
  border-radius: 8px;
  background: var(--git-graph-layer);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11px;
}
.dsh-git-graph-settings-field,
.dsh-git-graph-settings-field label { display: flex; align-items: center; gap: 6px; }
.dsh-git-graph-find-container {
  margin: 0 12px 10px;
  padding: 8px 10px;
  border: 1px solid var(--git-graph-border);
  border-radius: 8px;
  background: var(--git-graph-layer);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dsh-git-graph-find-input-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.dsh-git-graph-find-input { flex: 1 1 220px; min-width: 180px; }
.dsh-git-graph-find-bar { display: flex; align-items: center; gap: 8px; font-size: 11px; }
.dsh-git-graph-find-count { color: var(--git-graph-secondary); font-weight: 600; }
.dsh-git-graph-find-highlight {
  background: rgb(255 214 92 / 26%);
  border-radius: 3px;
  box-shadow: 0 0 0 2px rgb(255 214 92 / 34%);
}
.dsh-git-graph[data-graph-style='compact'] .dsh-git-graph-commit { padding-top: 3px; padding-bottom: 3px; }
.dsh-git-graph[data-graph-style='compact'] .dsh-git-graph-avatar { width: 15px; height: 15px; font-size: 9px; }
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
