/**
 * Git Graph styles are injected at runtime so the package remains usable as a
 * direct `file:` dependency. The variables deliberately follow DSH surface
 * tokens of the active Harness theme.
 */
export const css = {
  card: 'dsh-git-graph-card',
  header: 'dsh-git-graph-header',
  titleBlock: 'dsh-git-graph-title-block',
  path: 'dsh-git-graph-path',
  clean: 'dsh-git-graph-clean',
  dirty: 'dsh-git-graph-dirty',
  toolbar: 'dsh-git-graph-toolbar',
  toolbarGroup: 'dsh-git-graph-toolbar-group',
  toolbarActions: 'dsh-git-graph-toolbar-actions',
  hint: 'dsh-git-graph-hint',
  headerCell: 'dsh-git-graph-header-cell',
  columnResize: 'dsh-git-graph-column-resize',
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
  refCopy: 'dsh-git-graph-ref-copy',
  refsMore: 'dsh-git-graph-refs-more',
  currentBranch: 'dsh-git-graph-current-branch',
  remoteJoined: 'dsh-git-graph-remote-joined',
  tagsRight: 'dsh-git-graph-tags-right',
  graphRefs: 'dsh-git-graph-graph-refs',
  graphRefRow: 'dsh-git-graph-graph-ref-row',
  settingsHint: 'dsh-git-graph-settings-hint',
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
  message: 'dsh-git-graph-message',
  metaCopy: 'dsh-git-graph-meta-copy',
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
  renamePath: 'dsh-git-graph-rename-path',
  fileCopy: 'dsh-git-graph-file-copy',
  hunkHeader: 'dsh-git-graph-hunk-header',
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
  fileViewerToolbar: 'dsh-git-graph-file-viewer-toolbar',
  sourceViewer: 'dsh-git-graph-source-viewer',
  sourceLineNumbers: 'dsh-git-graph-source-line-numbers',
  sourceText: 'dsh-git-graph-source-text',
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
  --git-graph-bg: var(--dsw-alias-bg-base);
  --git-graph-layer: var(--dsw-alias-bg-layer-1);
  --git-graph-text: var(--dsw-alias-label-primary);
  --git-graph-secondary: var(--dsw-alias-label-secondary);
  --git-graph-tertiary: var(--dsw-alias-label-tertiary);
  --git-graph-border: var(--dsw-alias-border-l2);
  --git-graph-hover: var(--dsw-alias-interactive-bg-hover);
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  container-type: inline-size;
  container-name: git-graph;
  font: 12px/1.5 system-ui, sans-serif;
  border: 0;
  background: var(--git-graph-bg);
  color: var(--git-graph-text);
  outline: none;
}
.dsh-git-graph-header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--git-graph-border);
  font-size: 13px;
}
.dsh-git-graph-title-block { min-width: 0; flex: 1; width: 100%; }
.dsh-git-graph-title-block strong { display: block; margin-bottom: 2px; }
.dsh-git-graph-path {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--git-graph-tertiary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-git-graph-clean,
.dsh-git-graph-dirty { padding: 3px 8px; border: 1px solid var(--git-graph-border); border-radius: 999px; font-size: 11px; }
.dsh-git-graph-clean { color: var(--dsw-alias-state-success-primary); }
.dsh-git-graph-dirty { color: var(--dsw-alias-state-warn-label); }
.dsh-git-graph-toolbar {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--git-graph-border);
  background: var(--git-graph-layer);
}
.dsh-git-graph-toolbar-group,
.dsh-git-graph-toolbar-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; }
.dsh-git-graph-toolbar-group:first-child { flex: 1 1 100%; }
.dsh-git-graph-toolbar-actions { margin-left: auto; }
.dsh-git-graph-hint { display: flex; gap: 8px; align-items: center; padding: 6px 12px; font-size: 11px; color: var(--git-graph-secondary); flex: none; }
.dsh-git-graph-search,
.dsh-git-graph-select {
  min-height: 30px;
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
  min-height: 30px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
.dsh-git-graph-primary-button {
  padding: 0 11px;
  border: 1px solid var(--dsw-alias-button-primary-fill);
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-alias-label-primary-inverted);
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
.dsh-git-graph-node-selected:focus-visible { outline: 2px solid var(--dsw-alias-link); outline-offset: 1px; }
.dsh-git-graph-primary-button:disabled,
.dsh-git-graph-load-more:disabled { cursor: wait; opacity: .65; }
.dsh-git-graph-panel {
  display: grid;
  grid-template-columns: max-content minmax(var(--git-graph-row-min), 1fr);
  grid-template-rows: 32px minmax(0, auto);
  flex: 1 1 0;
  min-height: 160px;
  min-width: 0;
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
.dsh-git-graph-header-cell { position: relative; min-width: 0; padding-right: 10px; overflow: visible; white-space: nowrap; }
.dsh-git-graph-column-resize { position: absolute; right: -5px; top: -8px; bottom: -8px; width: 10px; cursor: col-resize; touch-action: none; border-right: 1px solid var(--git-graph-border); }
.dsh-git-graph-column-resize:hover,
.dsh-git-graph-column-resize:focus-visible { background: color-mix(in srgb, var(--dsw-alias-link) 18%, transparent); outline: 1px solid var(--dsw-alias-link); }
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
  grid-template-columns: var(--git-graph-columns);
  align-items: center;
  grid-column: 2;
  grid-row: 1;
  gap: 8px;
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
.dsh-git-graph-svg .dsh-git-graph-working-tree-edge { stroke: var(--dsw-alias-state-warn-primary); stroke-dasharray: 3 2; }
.dsh-git-graph-svg .dsh-git-graph-working-tree-node { fill: var(--git-graph-bg); stroke: var(--dsw-alias-state-warn-primary); stroke-width: 1.5; }
.dsh-git-graph-svg circle { stroke-width: 1.5; }
.dsh-git-graph-svg .dsh-git-graph-hit-area { fill: transparent; stroke: transparent; stroke-width: 0; pointer-events: all; }
.dsh-git-graph-node,
.dsh-git-graph-node-selected { cursor: pointer; }
.dsh-git-graph-node-selected circle:not(.dsh-git-graph-hit-area) { stroke: var(--git-graph-text); stroke-width: 2.5; }
.dsh-git-graph-node[data-hovered='true'] circle:not(.dsh-git-graph-hit-area) { stroke: var(--git-graph-text); stroke-width: 2.5; }
.dsh-git-graph-commit-list {
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
}
.dsh-git-graph-working-tree-row,
.dsh-git-graph-commit {
  box-sizing: border-box;
  width: 100%;
  height: var(--git-graph-row-height);
  min-height: var(--git-graph-row-height);
  border: 0;
  border-bottom: 1px solid var(--git-graph-border);
  background: transparent;
  text-align: left;
}
.dsh-git-graph-working-tree-row {
  display: grid;
  grid-template-columns: var(--git-graph-columns);
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 2px;
  color: var(--dsw-alias-state-warn-primary);
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
  grid-template-columns: var(--git-graph-columns);
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 2px;
  cursor: pointer;
  color: inherit;
  font: inherit;
}
.dsh-git-graph-commit:hover,
.dsh-git-graph-commit[data-hovered='true'],
.dsh-git-graph-commit-selected { background: var(--git-graph-hover); }
.dsh-git-graph-commit-selected { box-shadow: inset 2px 0 var(--dsw-alias-button-primary-fill); }
.dsh-git-graph-commit-description {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  overflow: hidden;
}
.dsh-git-graph-commit-description .dsh-git-graph-refs { flex: 0 1 auto; max-width: 60%; min-width: 0; }
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
.dsh-git-graph-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
.dsh-git-graph-graph-refs { grid-column: 1; grid-row: 2; position: relative; pointer-events: none; }
.dsh-git-graph-graph-ref-row { position: absolute; width: 160px; display: flex; align-items: center; pointer-events: auto; }
.dsh-git-graph-graph-ref-row .dsh-git-graph-refs { max-width: 160px; }
.dsh-git-graph-graph-ref-row .dsh-git-graph-current-branch { display: none; }
.dsh-git-graph-tags-right { margin-left: auto; flex: 0 1 auto; min-width: 0; max-width: 40%; }
.dsh-git-graph-tags-right .dsh-git-graph-refs { max-width: 100%; }
.dsh-git-graph-remote-joined { flex: none; max-width: 64px; border: 0; border-left: 1px solid var(--git-graph-border); padding: 0 4px; overflow: hidden; text-overflow: ellipsis; color: var(--dsw-alias-state-business-primary); background: transparent; font: inherit; cursor: pointer; }
.dsh-git-graph-ref > .dsh-git-graph-ref-copy { flex: 1; }
.dsh-git-graph-settings-hint { flex: 1 1 100%; color: var(--git-graph-tertiary); font-size: 11px; }
.dsh-git-graph-metadata-strip {
  flex: none;
  max-height: 120px;
  overflow: auto;
  margin: 0;
  padding: 8px 12px;
  border-top: 1px solid var(--git-graph-border);
  background: var(--git-graph-layer);
  font-size: 11px;
}
.dsh-git-graph-metadata-strip summary { color: var(--git-graph-secondary); cursor: pointer; }
.dsh-git-graph-metadata-strip[open] .dsh-git-graph-metadata-group { margin-top: 8px; }
.dsh-git-graph-meta-copy { border: 0; background: transparent; color: inherit; font: inherit; cursor: pointer; padding: 0; }
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
.dsh-git-graph-meta-tag { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent); color: var(--dsw-alias-state-business-primary); }
.dsh-git-graph-meta-stash { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent); color: var(--dsw-alias-state-success-primary); }
.dsh-git-graph-head-dot {
  box-sizing: border-box;
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border: 2px solid var(--dsw-alias-state-business-primary);
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
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-git-graph-refs { display: inline-flex; flex: 0 0 auto; gap: 4px; margin: 0 3px 0 0; min-width: 0; }
.dsh-git-graph-details-list .dsh-git-graph-refs { flex-wrap: wrap; }
.dsh-git-graph-ref-copy { display: inline-flex; align-items: center; min-width: 0; padding: 0; border: 0; color: inherit; background: transparent; cursor: pointer; font: inherit; }
.dsh-git-graph-ref-copy > span { display: inline-flex; align-items: center; min-width: 0; }
.dsh-git-graph-current-branch { padding: 0 4px; font-size: 9px; color: var(--git-graph-ref-color); }
.dsh-git-graph-commit-description .dsh-git-graph-current-branch { display: none; }
.dsh-git-graph-refs-more { flex: none; min-width: 25px; border: 1px solid var(--git-graph-border); border-radius: 5px; background: var(--git-graph-layer); color: var(--git-graph-secondary); cursor: pointer; font: inherit; padding: 0 3px; }
.dsh-git-graph-ref {
  --git-graph-ref-color: var(--dsw-alias-state-business-primary);
  display: inline-flex;
  max-width: 200px;
  min-width: 0;
  min-height: 20px;
  align-items: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--git-graph-ref-color) 70%, transparent);
  border-radius: 5px;
  background: var(--git-graph-layer);
  color: var(--git-graph-text);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
}
.dsh-git-graph-ref[data-kind='head'] { --git-graph-ref-color: var(--dsw-alias-state-success-primary); }
.dsh-git-graph-ref[data-kind='remote'] { --git-graph-ref-color: var(--dsw-alias-state-business-primary); }
.dsh-git-graph-ref[data-kind='tag'] { --git-graph-ref-color: var(--dsw-alias-state-warn-label); }
.dsh-git-graph-ref-icon {
  display: block;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  box-sizing: border-box;
  padding: 3px;
  background: color-mix(in srgb, var(--git-graph-ref-color) 14%, transparent);
  color: var(--git-graph-ref-color);
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
.dsh-git-graph-details-heading strong { min-width: 0; overflow-wrap: anywhere; font-size: 14px; }
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
.dsh-git-graph-details-list .dsh-git-graph-link-button { margin-right: 8px; }
.dsh-git-graph-message { margin-top: 12px; border-top: 1px solid var(--git-graph-border); padding-top: 8px; }
.dsh-git-graph-message summary { cursor: pointer; color: var(--git-graph-secondary); }
.dsh-git-graph-detail-body {
  margin: 12px 0 0;
  padding: 10px;
  overflow: auto;
  max-height: 240px;
  border: 1px solid var(--git-graph-border);
  border-radius: 6px;
  background: var(--dsw-alias-markdown-code-block);
  color: var(--git-graph-text);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.dsh-git-graph-detail-body a { color: var(--dsw-alias-link); text-decoration: underline; }
.dsh-git-graph-detail-body code { padding: 1px 3px; border-radius: 3px; background: var(--git-graph-hover); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
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
.dsh-git-graph-file-status[data-status='A'] { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent); color: var(--dsw-alias-state-success-primary); }
.dsh-git-graph-file-status[data-status='M'] { background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent); color: var(--dsw-alias-state-warn-primary); }
.dsh-git-graph-file-status[data-status='D'] { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent); color: var(--dsw-alias-state-error-primary); }
.dsh-git-graph-file-status[data-status='R'] { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent); color: var(--dsw-alias-state-business-primary); }
.dsh-git-graph-file-status[data-status='U'] { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent); color: var(--dsw-alias-state-error-primary); }
.dsh-git-graph-file-change-stat { color: var(--git-graph-tertiary); }
.dsh-git-graph-tree,
.dsh-git-graph-file-list { margin: 0; padding: 0; list-style: none; }
.dsh-git-graph-tree-children { margin: 0; padding: 0 0 0 18px; list-style: none; }
.dsh-git-graph-tree-folder,
.dsh-git-graph-file-leaf { margin-top: 2px; }
.dsh-git-graph-file-leaf { display: flex; align-items: center; gap: 6px; min-width: 0; }
.dsh-git-graph-file-leaf > .dsh-git-graph-file-record { flex: 1; min-width: 0; }
.dsh-git-graph-file-copy { flex: none; padding: 3px 6px; border: 1px solid var(--git-graph-border); border-radius: 4px; background: transparent; color: var(--git-graph-secondary); font: inherit; font-size: 10px; cursor: pointer; }
.dsh-git-graph-file-record .dsh-git-graph-file-status { margin-right: 6px; flex: none; }
.dsh-git-graph-rename-path { min-width: 0; margin-left: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--git-graph-tertiary); }
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
.dsh-git-graph-file-name[data-status='U'] { color: var(--dsw-alias-state-success-primary); }
.dsh-git-graph-file-name[data-status='M'] { color: var(--dsw-alias-state-warn-primary); }
.dsh-git-graph-file-name[data-status='D'] { color: var(--dsw-alias-state-error-primary); }
.dsh-git-graph-file-name[data-status='R'] { color: var(--dsw-alias-state-business-primary); }
.dsh-git-graph-file-add-del { margin-left: 8px; flex: none; color: var(--git-graph-tertiary); }
.dsh-git-graph-file-add { padding: 0 3px; color: var(--dsw-alias-state-success-primary); }
.dsh-git-graph-file-del { padding: 0 3px; color: var(--dsw-alias-state-error-primary); }
.dsh-git-graph-inline-details {
  box-sizing: border-box;
  width: min(calc(100% + var(--git-graph-ref-width)), calc(100cqw - var(--git-graph-svg-width)));
  margin-left: calc(0px - var(--git-graph-ref-width));
  min-width: 200px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--git-graph-border);
  background: var(--git-graph-hover);
}
.dsh-git-graph-inline-details .dsh-git-graph-details-panel,
.dsh-git-graph-inline-details .dsh-git-graph-working-tree-panel { margin: 0; }
.dsh-git-graph-link-button {
  border: 0;
  background: transparent;
  color: var(--dsw-alias-link);
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
  padding: 8px;
  border: 1px solid var(--git-graph-border);
  border-radius: 6px 6px 0 0;
  background: var(--git-graph-layer);
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
  flex: 1 1 100%;
  overflow-wrap: anywhere;
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
  background: var(--dsw-alias-markdown-code-block);
  color: var(--git-graph-text);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.dsh-git-graph-file-viewer-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 8px 0; }
.dsh-git-graph-source-viewer {
  display: flex;
  max-height: 380px;
  overflow: auto;
  border: 1px solid var(--git-graph-border);
  border-radius: 6px;
  background: var(--dsw-alias-markdown-code-block);
  color: var(--git-graph-text);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
  line-height: 18px;
}
.dsh-git-graph-source-line-numbers,
.dsh-git-graph-source-text { margin: 0; font: inherit; white-space: pre; tab-size: 4; }
.dsh-git-graph-source-line-numbers {
  position: sticky;
  left: 0;
  flex: none;
  padding: 8px;
  text-align: right;
  color: var(--git-graph-tertiary);
  background: var(--git-graph-layer);
  user-select: none;
}
.dsh-git-graph-source-text { flex: 1; min-width: max-content; padding: 8px 12px; }
.dsh-git-graph-diff-viewer {
  max-height: 380px;
  overflow: auto;
  border: 1px solid var(--git-graph-border);
  border-radius: 0 0 6px 6px;
  background: var(--dsw-alias-markdown-code-block);
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
.dsh-git-graph-diff-line { min-height: 20px; }
.dsh-git-graph-diff-body { min-width: 100%; width: max-content; }
.dsh-git-graph-hunk-header { padding: 4px 12px; color: var(--git-graph-secondary); background: var(--git-graph-layer); border-bottom: 1px solid var(--git-graph-border); white-space: nowrap; }
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
.dsh-git-graph-diff-content { white-space: pre; tab-size: 4; }
.dsh-git-graph-diff-added { background: var(--dsw-alias-file-diff-added-bg); }
.dsh-git-graph-diff-added .dsh-git-graph-diff-marker { color: var(--dsw-alias-file-diff-added-marker); }
.dsh-git-graph-diff-removed { background: var(--dsw-alias-file-diff-deleted-bg); }
.dsh-git-graph-diff-removed .dsh-git-graph-diff-marker { color: var(--dsw-alias-file-diff-deleted-marker); }
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
  flex-wrap: wrap;
  max-height: 200px;
  overflow: auto;
  flex: none;
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
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 22%, transparent);
  border-radius: 3px;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-warn-primary) 28%, transparent);
}
.dsh-git-graph-card[data-graph-style='compact'] .dsh-git-graph-avatar { width: 15px; height: 15px; font-size: 9px; }
.dsh-git-graph-empty-details,
.dsh-git-graph-pending,
.dsh-git-graph-error { padding: 14px; font-size: 12px; }
.dsh-git-graph-empty-details,
.dsh-git-graph-pending { color: var(--git-graph-tertiary); }
.dsh-git-graph-error { color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, var(--git-graph-bg)); }
.dsh-git-graph-error .dsh-git-graph-secondary-button { margin-left: 8px; }
.dsh-git-graph-card button:focus-visible { outline: 2px solid var(--dsw-alias-link); outline-offset: -2px; }
.dsh-git-graph-load-more { display: block; margin: 10px auto; padding: 0 12px; border: 1px solid var(--git-graph-border); background: var(--git-graph-layer); color: var(--git-graph-secondary); }
@container git-graph (max-width: 480px) {
  .dsh-git-graph-header { align-items: flex-start; flex-direction: column; }
  .dsh-git-graph-toolbar-group:first-child { flex-direction: column; align-items: stretch; }
  .dsh-git-graph-toolbar-group:first-child .dsh-git-graph-search { flex: none; width: 100%; box-sizing: border-box; }
  .dsh-git-graph-toolbar-group .dsh-git-graph-select { flex: 1; max-width: 100%; }
  .dsh-git-graph-details-list { gap: 6px; }
  .dsh-git-graph-details-actions { margin-left: 0; }
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
