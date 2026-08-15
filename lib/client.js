window.__ModuleLoader__.load({
  id: "dsh-git-graph",
  factory: (require) => {
    var cache = {};
    var factories = [
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MAX_COMMITS = void 0;
  /** Upper bound for persisted graph metadata in one tool result. */
  exports.MAX_COMMITS = 500;

  }),
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.gitGraphDescriptors = exports.gitGraphInvocation = exports.gitGraphSnapshotSchema = exports.gitGraphInputSchema = exports.TYPERT_PACKAGE = void 0;
  exports.createGitGraphInvocation = createGitGraphInvocation;
  const domain_ts_1 = require(0);
  exports.TYPERT_PACKAGE = 'dsh-git-graph';
  const SESSION_ID_TYPE = '@deepseek-ai/dsh-session/types#SessionId';
  function fail(path, expected) {
      throw new TypeError(`Git Graph Remote: ${path} must be ${expected}`);
  }
  function objectAt(value, path) {
      if (typeof value !== 'object' || value === null || Array.isArray(value))
          fail(path, 'an object');
      return value;
  }
  function rejectUnknown(value, allowed, path) {
      const allowedSet = new Set(allowed);
      for (const key of Object.keys(value)) {
          if (!allowedSet.has(key))
              fail(`${path}.${key}`, 'a supported field');
      }
  }
  function stringAt(value, path) {
      if (typeof value !== 'string')
          fail(path, 'a string');
      return value;
  }
  function booleanAt(value, path) {
      if (typeof value !== 'boolean')
          fail(path, 'a boolean');
      return value;
  }
  function integerAt(value, path, min, max) {
      if (!Number.isSafeInteger(value) || typeof value !== 'number' || value < min || value > max) {
          fail(path, `an integer from ${min} to ${max}`);
      }
      return value;
  }
  function nullableStringAt(value, path) {
      if (value === null)
          return null;
      return stringAt(value, path);
  }
  function arrayAt(value, path) {
      if (!Array.isArray(value))
          fail(path, 'an array');
      return value;
  }
  function refKindAt(value, path) {
      const kind = stringAt(value, path);
      if (kind === 'head' || kind === 'remote' || kind === 'tag')
          return kind;
      fail(path, 'head, remote, or tag');
  }
  function parseRef(value, path) {
      const object = objectAt(value, path);
      rejectUnknown(object, ['kind', 'name'], path);
      return {
          kind: refKindAt(object.kind, `${path}.kind`),
          name: stringAt(object.name, `${path}.name`),
      };
  }
  function parseCommit(value, path) {
      const object = objectAt(value, path);
      rejectUnknown(object, ['hash', 'parents', 'author', 'email', 'date', 'subject', 'refs', 'isHead'], path);
      return {
          hash: stringAt(object.hash, `${path}.hash`),
          parents: arrayAt(object.parents, `${path}.parents`).map((parent, index) => stringAt(parent, `${path}.parents[${index}]`)),
          author: stringAt(object.author, `${path}.author`),
          email: stringAt(object.email, `${path}.email`),
          date: stringAt(object.date, `${path}.date`),
          subject: stringAt(object.subject, `${path}.subject`),
          refs: arrayAt(object.refs, `${path}.refs`).map((ref, index) => parseRef(ref, `${path}.refs[${index}]`)),
          isHead: booleanAt(object.isHead, `${path}.isHead`),
      };
  }
  function parseInput(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['path', 'maxCommits', 'all', 'firstParent'], '$');
      const result = {};
      if (Object.hasOwn(object, 'path'))
          result.path = stringAt(object.path, '$.path');
      if (Object.hasOwn(object, 'maxCommits'))
          result.maxCommits = integerAt(object.maxCommits, '$.maxCommits', 1, domain_ts_1.MAX_COMMITS);
      if (Object.hasOwn(object, 'all'))
          result.all = booleanAt(object.all, '$.all');
      if (Object.hasOwn(object, 'firstParent'))
          result.firstParent = booleanAt(object.firstParent, '$.firstParent');
      return result;
  }
  function parseSnapshot(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['path', 'branch', 'head', 'workingTree', 'commits'], '$');
      const workingTree = objectAt(object.workingTree, '$.workingTree');
      rejectUnknown(workingTree, ['changed', 'summary'], '$.workingTree');
      return {
          path: stringAt(object.path, '$.path'),
          branch: nullableStringAt(object.branch, '$.branch'),
          head: nullableStringAt(object.head, '$.head'),
          workingTree: {
              changed: booleanAt(workingTree.changed, '$.workingTree.changed'),
              summary: stringAt(workingTree.summary, '$.workingTree.summary'),
          },
          commits: arrayAt(object.commits, '$.commits').map((commit, index) => parseCommit(commit, `$.commits[${index}]`)),
      };
  }
  /** Strict wire schemas intentionally use only the Typert `.parse()` contract. */
  exports.gitGraphInputSchema = { parse: parseInput };
  exports.gitGraphSnapshotSchema = { parse: parseSnapshot };
  const sessionIdSchema = { parse: value => stringAt(value, '$.agentId') };
  /** Build the shared endpoint metadata with a face-specific schema runtime. */
  function createGitGraphInvocation(schemas) {
      return {
          id: `${exports.TYPERT_PACKAGE}#gitGraph/read`,
          service: 'gitGraph',
          namespace: 'gitGraph',
          method: 'read',
          invocation: { kind: 'direct' },
          cancellation: { parameter: 'signal' },
          scope: {
              context: 'agent',
              wire: 'agentId',
          },
          parameters: [
              {
                  name: 'agent',
                  wire: 'agentId',
                  source: 'lookup',
                  lookup: 'agent',
                  codec: {
                      mode: 'strict',
                      typeSymbol: SESSION_ID_TYPE,
                      schema: schemas.sessionId,
                  },
              },
              {
                  name: 'request',
                  wire: 'request',
                  source: 'json',
                  codec: {
                      mode: 'strict',
                      typeSymbol: `${exports.TYPERT_PACKAGE}#GitGraphInput`,
                      schema: schemas.input,
                  },
              },
          ],
          result: {
              mode: 'strict',
              typeSymbol: `${exports.TYPERT_PACKAGE}#GitGraphSnapshot`,
              schema: schemas.snapshot,
          },
      };
  }
  /** Client descriptors use the local parse-only schemas to keep the bundle closed. */
  exports.gitGraphInvocation = createGitGraphInvocation({
      input: exports.gitGraphInputSchema,
      snapshot: exports.gitGraphSnapshotSchema,
      sessionId: sessionIdSchema,
  });
  exports.gitGraphDescriptors = [exports.gitGraphInvocation];

  }),
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TYPERT_REMOTE = void 0;
  const typert_shared_ts_1 = require(1);
  /** Client contract selected by the graph view's Cordis fiber. */
  exports.TYPERT_REMOTE = {
      package: typert_shared_ts_1.TYPERT_PACKAGE,
      descriptors: typert_shared_ts_1.gitGraphDescriptors,
  };
  exports.default = exports.TYPERT_REMOTE;

  }),
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.layoutGraph = layoutGraph;
  const NULL_VERTEX = -1;
  function pointOf(vertex) {
      return { lane: vertex.lane, row: vertex.id };
  }
  function nextPointOf(vertex) {
      return { lane: vertex.nextLane, row: vertex.id };
  }
  function connectPoint(vertex, target, branch) {
      for (let lane = 0; lane < vertex.connections.length; lane += 1) {
          const connection = vertex.connections[lane];
          if (connection?.target === target && connection.branch === branch) {
              return { lane, row: vertex.id };
          }
      }
      return undefined;
  }
  function reservePoint(vertex, lane, target, branch) {
      if (lane !== vertex.nextLane)
          return;
      vertex.nextLane += 1;
      vertex.connections[lane] = { target, branch };
  }
  function addEdge(branch, from, to, lockedFirst) {
      branch.edges.push({
          fromLane: from.lane,
          toLane: to.lane,
          row: from.row,
          colour: branch.colour,
          lockedFirst,
      });
  }
  function availableColour(startAt, branchEnds) {
      for (let colour = 0; colour < branchEnds.length; colour += 1) {
          const end = branchEnds[colour];
          if (end !== undefined && startAt > end)
              return colour;
      }
      branchEnds.push(0);
      return branchEnds.length - 1;
  }
  function determinePath(startAt, vertices, branches, branchEnds) {
      let row = startAt;
      let vertex = vertices[row];
      if (vertex === undefined)
          return;
      let parent = vertex.parents[vertex.nextParent];
      let lastPoint = vertex.branch === undefined ? nextPointOf(vertex) : pointOf(vertex);
      // A merge can connect two branches that have already been laid out. Follow
      // the existing parent branch until its reserved connection point appears.
      if (parent !== undefined
          && parent !== NULL_VERTEX
          && vertex.parents.length > 1
          && vertex.branch !== undefined
          && vertices[parent]?.branch !== undefined) {
          const parentBranch = vertices[parent]?.branch;
          if (parentBranch === undefined)
              return;
          const targetBranch = branches[parentBranch];
          if (targetBranch === undefined)
              return;
          let foundParentPoint = false;
          for (row = startAt + 1; row < vertices.length; row += 1) {
              const current = vertices[row];
              if (current === undefined)
                  continue;
              const connectedPoint = connectPoint(current, parent, parentBranch);
              const currentPoint = connectedPoint ?? nextPointOf(current);
              foundParentPoint = connectedPoint !== undefined;
              addEdge(targetBranch, lastPoint, currentPoint, !foundParentPoint && current.id !== parent ? lastPoint.lane < currentPoint.lane : true);
              reservePoint(current, currentPoint.lane, parent, parentBranch);
              lastPoint = currentPoint;
              if (foundParentPoint) {
                  vertex.nextParent += 1;
                  break;
              }
          }
          if (!foundParentPoint)
              vertex.nextParent += 1;
          return;
      }
      const branch = {
          colour: availableColour(startAt, branchEnds),
          edges: [],
          end: row,
      };
      branches.push(branch);
      if (vertex.branch === undefined) {
          vertex.branch = branch.colour;
          vertex.lane = lastPoint.lane;
      }
      reservePoint(vertex, lastPoint.lane, vertex.id, branch.colour);
      for (row = startAt + 1; row < vertices.length; row += 1) {
          const current = vertices[row];
          if (current === undefined)
              continue;
          const currentPoint = parent === current.id && current.branch !== undefined
              ? pointOf(current)
              : nextPointOf(current);
          addEdge(branch, lastPoint, currentPoint, lastPoint.lane < currentPoint.lane);
          reservePoint(current, currentPoint.lane, parent ?? NULL_VERTEX, branch.colour);
          lastPoint = currentPoint;
          if (parent === current.id) {
              vertex.nextParent += 1;
              const parentAlreadyOnBranch = current.branch !== undefined;
              if (!parentAlreadyOnBranch) {
                  current.branch = branch.colour;
                  current.lane = currentPoint.lane;
              }
              vertex = current;
              parent = vertex.parents[vertex.nextParent];
              if (parent === undefined || parentAlreadyOnBranch)
                  break;
          }
      }
      // A missing parent is represented by the end of the visible graph. Mark it
      // processed so the outer pass cannot try to lay out the same branch again.
      if (row === vertices.length && parent === NULL_VERTEX)
          vertex.nextParent += 1;
      branch.end = row;
      branchEnds[branch.colour] = row;
  }
  function createVertices(commits) {
      const lookup = new Map();
      commits.forEach((commit, index) => lookup.set(commit.hash, index));
      return commits.map((commit, id) => ({
          id,
          commit,
          parents: commit.parents.map(parent => lookup.get(parent) ?? NULL_VERTEX),
          children: [],
          connections: [],
          branch: undefined,
          lane: 0,
          nextLane: 0,
          nextParent: 0,
      }));
  }
  /**
   * Lay out commits using the same reserved-point strategy as VS Code Git
   * Graph: a branch owns a continuous path, while merge paths reuse the
   * already-reserved point of their target parent branch. This keeps unrelated
   * lanes from shifting diagonally on every following row.
   */
  function layoutGraph(commits) {
      const vertices = createVertices(commits);
      const branches = [];
      const branchEnds = [];
      for (const vertex of vertices) {
          for (const parent of vertex.parents) {
              if (parent !== NULL_VERTEX)
                  vertices[parent]?.children.push(vertex.id);
          }
      }
      let row = 0;
      while (row < vertices.length) {
          const vertex = vertices[row];
          if (vertex !== undefined && (vertex.branch === undefined || vertex.nextParent < vertex.parents.length)) {
              determinePath(row, vertices, branches, branchEnds);
          }
          else {
              row += 1;
          }
      }
      const nodes = vertices.map(vertex => ({
          commit: vertex.commit,
          lane: vertex.lane,
          row: vertex.id,
          colour: vertex.branch ?? 0,
      }));
      const edges = branches.flatMap(branch => branch.edges);
      const highestLane = Math.max(0, ...nodes.map(node => node.lane), ...edges.map(edge => Math.max(edge.fromLane, edge.toLane)));
      return { nodes, edges, laneCount: highestLane + 1 };
  }

  }),
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.css = void 0;
  exports.installGitGraphStyles = installGitGraphStyles;
  /**
   * Git Graph styles are injected at runtime so the package remains usable as a
   * direct `file:` dependency. The variables deliberately follow DSH surface
   * tokens and keep fallbacks for standalone previews.
   */
  exports.css = {
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
  };
  const STYLE_ID = 'dsh-git-graph-styles';
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
  `;
  /** Install the graph-only stylesheet and return its unload disposer. */
  function installGitGraphStyles() {
      if (typeof document === 'undefined')
          return () => undefined;
      if (document.getElementById(STYLE_ID) !== null)
          return () => undefined;
      const target = document.head ?? document.documentElement;
      if (target === null)
          return () => undefined;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      target.append(style);
      return () => style.remove();
  }

  }),
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.GitGraphView = GitGraphView;
  const jsx_runtime_1 = require("react/jsx-runtime");
  const react_1 = require("react");
  const graph_layout_ts_1 = require(3);
  const styles_ts_1 = require(4);
  const MAX_COMMITS = 500;
  const PAGE_SIZE = 100;
  function shortHash(hash) {
      return hash.slice(0, 8);
  }
  function formatDate(value) {
      const date = new Date(value);
      return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
  }
  function formatShortDate(value) {
      const date = new Date(value);
      return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString();
  }
  function refMatches(commit, filter) {
      return filter === 'all' || commit.refs.some(ref => ref.kind === filter);
  }
  function textMatches(commit, query) {
      if (query.length === 0)
          return true;
      const haystack = [
          commit.hash,
          commit.subject,
          commit.author,
          commit.email,
          ...commit.refs.map(ref => ref.name),
      ].join('\n').toLocaleLowerCase();
      return haystack.includes(query.toLocaleLowerCase());
  }
  function RefBadges({ refs }) {
      return refs.length === 0 ? null : ((0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.refs, "aria-label": "References", children: refs.map(ref => ((0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.ref, "data-kind": ref.kind, title: ref.name, children: [(0, jsx_runtime_1.jsx)("svg", { className: styles_ts_1.css.refIcon, viewBox: "0 0 16 16", "aria-hidden": "true", children: ref.kind === 'tag' ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M3 3h4.1L13 8.9 8.9 13 3 7.1V3Z", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }), (0, jsx_runtime_1.jsx)("circle", { cx: "5.2", cy: "5.2", r: "1", fill: "currentColor" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M5 4.4v7.2M5 8h3a2.5 2.5 0 0 1 2.5 2.5V12", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }), (0, jsx_runtime_1.jsx)("circle", { cx: "5", cy: "3", r: "1.7", fill: "currentColor" }), (0, jsx_runtime_1.jsx)("circle", { cx: "5", cy: "13", r: "1.7", fill: "currentColor" }), (0, jsx_runtime_1.jsx)("circle", { cx: "10.5", cy: "13", r: "1.7", fill: "currentColor" })] })) }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.refName, children: ref.name })] }, `${ref.kind}:${ref.name}`))) }));
  }
  function GraphSvg({ layout, workingTreeChanged, selectedHash, onSelect }) {
      const rowHeight = 28;
      const laneWidth = 16;
      const graphPadding = 16;
      const graphWidth = Math.max(64, graphPadding * 2 + Math.max(0, layout.laneCount - 1) * laneWidth + 8);
      const rowOffset = workingTreeChanged ? 1 : 0;
      const graphHeight = Math.max(rowHeight, (layout.nodes.length + rowOffset) * rowHeight);
      const colours = ['#0085d9', '#d9008f', '#00a86b', '#d98500', '#7b4bc4', '#e138e8', '#00a7a0', '#dc5b23', '#6f24d6', '#b38b00'];
      const headNode = layout.nodes.find(node => node.commit.isHead) ?? layout.nodes[0];
      const pointX = (lane) => graphPadding + lane * laneWidth;
      const pointY = (row) => (row + rowOffset) * rowHeight + rowHeight / 2;
      const pathForEdge = (edge) => {
          const x1 = pointX(edge.fromLane);
          const x2 = pointX(edge.toLane);
          const y1 = pointY(edge.row);
          const y2 = pointY(edge.row + 1);
          if (x1 === x2)
              return `M ${x1} ${y1} L ${x2} ${y2}`;
          const curve = rowHeight * 0.8;
          return `M ${x1} ${y1} C ${x1} ${y1 + curve}, ${x2} ${y2 - curve}, ${x2} ${y2}`;
      };
      return ((0, jsx_runtime_1.jsxs)("svg", { className: styles_ts_1.css.graph, width: graphWidth, height: graphHeight, viewBox: `0 0 ${graphWidth} ${graphHeight}`, role: "img", "aria-label": "Git commit graph", children: [workingTreeChanged && headNode !== undefined && ((0, jsx_runtime_1.jsx)("path", { className: styles_ts_1.css.workingTreeEdge, d: `M ${pointX(0)} ${pointY(-1)} C ${pointX(0)} ${pointY(-1) + rowHeight * 0.8}, ${pointX(headNode.lane)} ${pointY(headNode.row) - rowHeight * 0.8}, ${pointX(headNode.lane)} ${pointY(headNode.row)}` })), layout.edges.map((edge, index) => {
                  const colour = colours[edge.colour % colours.length] ?? colours[0];
                  const path = pathForEdge(edge);
                  return ((0, jsx_runtime_1.jsxs)("g", { children: [(0, jsx_runtime_1.jsx)("path", { className: styles_ts_1.css.graphShadow, d: path }), (0, jsx_runtime_1.jsx)("path", { className: styles_ts_1.css.graphLine, d: path, stroke: colour })] }, `${edge.row}-${edge.fromLane}-${edge.toLane}-${edge.colour}-${index}`));
              }), layout.nodes.map(node => {
                  const x = pointX(node.lane);
                  const y = pointY(node.row);
                  const colour = colours[node.colour % colours.length] ?? colours[0];
                  const selected = node.commit.hash === selectedHash;
                  return ((0, jsx_runtime_1.jsxs)("g", { className: selected ? styles_ts_1.css.graphNodeSelected : styles_ts_1.css.graphNode, role: "button", tabIndex: 0, "aria-current": node.commit.isHead, "aria-label": `Select commit ${shortHash(node.commit.hash)} ${node.commit.subject}`, onClick: () => onSelect(node.commit.hash), onKeyDown: event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onSelect(node.commit.hash);
                          }
                      }, children: [(0, jsx_runtime_1.jsx)("title", { children: `${shortHash(node.commit.hash)} ${node.commit.subject}` }), (0, jsx_runtime_1.jsx)("circle", { className: styles_ts_1.css.graphHitArea, cx: x, cy: y, r: 9 }), (0, jsx_runtime_1.jsx)("circle", { cx: x, cy: y, r: selected ? 5.5 : 4, fill: node.commit.isHead ? 'var(--git-graph-bg, #282a36)' : colour, stroke: node.commit.isHead ? colour : 'var(--git-graph-bg, #282a36)' })] }, node.commit.hash));
              }), workingTreeChanged && (0, jsx_runtime_1.jsx)("circle", { className: styles_ts_1.css.workingTreeNode, cx: pointX(0), cy: pointY(-1), r: 5 })] }));
  }
  function CommitRow({ commit, selected, onSelect }) {
      return ((0, jsx_runtime_1.jsxs)("button", { type: "button", className: selected ? `${styles_ts_1.css.commit} ${styles_ts_1.css.commitSelected}` : styles_ts_1.css.commit, "aria-pressed": selected, onClick: onSelect, children: [(0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.commitDescription, children: [commit.isHead && (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.headDot, title: "\u5F53\u524D HEAD", "aria-label": "\u5F53\u524D HEAD" }), (0, jsx_runtime_1.jsx)(RefBadges, { refs: commit.refs }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.subject, children: commit.subject || '(no subject)' })] }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.commitDate, title: formatDate(commit.date), children: formatShortDate(commit.date) }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.commitAuthor, title: `${commit.author} <${commit.email}>`, children: commit.author }), (0, jsx_runtime_1.jsx)("span", { className: `${styles_ts_1.css.hash} ${styles_ts_1.css.commitHash}`, title: commit.hash, children: shortHash(commit.hash) })] }));
  }
  function CommitDetails({ commit }) {
      const [copied, setCopied] = (0, react_1.useState)(false);
      (0, react_1.useEffect)(() => setCopied(false), [commit?.hash]);
      if (commit === undefined)
          return (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.emptyDetails, children: "\u9009\u62E9\u4E00\u6761\u63D0\u4EA4\u67E5\u770B\u8BE6\u60C5" });
      const copyHash = async () => {
          if (typeof navigator === 'undefined' || navigator.clipboard === undefined)
              return;
          try {
              await navigator.clipboard.writeText(commit.hash);
              setCopied(true);
          }
          catch {
              // Clipboard permission is optional; the full hash remains visible.
          }
      };
      return ((0, jsx_runtime_1.jsxs)("aside", { className: styles_ts_1.css.detailsPanel, "aria-label": "Commit details", children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.detailsHeading, children: [(0, jsx_runtime_1.jsx)("strong", { children: commit.subject || '(no subject)' }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: () => void copyHash(), children: copied ? '已复制' : '复制 Hash' })] }), (0, jsx_runtime_1.jsxs)("dl", { className: styles_ts_1.css.detailsList, children: [(0, jsx_runtime_1.jsx)("dt", { children: "Hash" }), (0, jsx_runtime_1.jsx)("dd", { className: styles_ts_1.css.mono, children: commit.hash }), (0, jsx_runtime_1.jsx)("dt", { children: "\u4F5C\u8005" }), (0, jsx_runtime_1.jsxs)("dd", { children: [commit.author, " <", commit.email, ">"] }), (0, jsx_runtime_1.jsx)("dt", { children: "\u65F6\u95F4" }), (0, jsx_runtime_1.jsx)("dd", { children: formatDate(commit.date) }), (0, jsx_runtime_1.jsx)("dt", { children: "\u7236\u63D0\u4EA4" }), (0, jsx_runtime_1.jsx)("dd", { className: styles_ts_1.css.mono, children: commit.parents.length === 0 ? '(root)' : commit.parents.map(shortHash).join(', ') }), (0, jsx_runtime_1.jsx)("dt", { children: "\u5F15\u7528" }), (0, jsx_runtime_1.jsx)("dd", { children: (0, jsx_runtime_1.jsx)(RefBadges, { refs: commit.refs }) })] })] }));
  }
  function GitGraphView({ read }) {
      const [snapshot, setSnapshot] = (0, react_1.useState)();
      const [selectedHash, setSelectedHash] = (0, react_1.useState)();
      const [query, setQuery] = (0, react_1.useState)('');
      const [refFilter, setRefFilter] = (0, react_1.useState)('all');
      const [maxCommits, setMaxCommits] = (0, react_1.useState)(PAGE_SIZE);
      const [includeAll, setIncludeAll] = (0, react_1.useState)(true);
      const [firstParent, setFirstParent] = (0, react_1.useState)(false);
      const [loading, setLoading] = (0, react_1.useState)(true);
      const [error, setError] = (0, react_1.useState)();
      const load = (0, react_1.useCallback)(async (request) => {
          setLoading(true);
          setError(undefined);
          try {
              const result = await read(request);
              if (!result.ok)
                  throw new Error(result.error.message);
              setSnapshot(result.value);
              setSelectedHash(current => result.value.commits.some(commit => commit.hash === current) ? current : result.value.commits[0]?.hash);
          }
          catch (cause) {
              setError(cause instanceof Error ? cause.message : String(cause));
          }
          finally {
              setLoading(false);
          }
      }, [read]);
      (0, react_1.useEffect)(() => {
          void load({ maxCommits: PAGE_SIZE, all: true, firstParent: false });
      }, [load]);
      const visibleCommits = (0, react_1.useMemo)(() => {
          if (snapshot === undefined)
              return [];
          return snapshot.commits.filter(commit => refMatches(commit, refFilter) && textMatches(commit, query.trim()));
      }, [query, refFilter, snapshot]);
      const layout = (0, react_1.useMemo)(() => (0, graph_layout_ts_1.layoutGraph)(visibleCommits), [visibleCommits]);
      const selectedCommit = snapshot?.commits.find(commit => commit.hash === selectedHash);
      const canLoadMore = snapshot !== undefined && snapshot.commits.length >= maxCommits && maxCommits < MAX_COMMITS;
      const hasGraphRows = snapshot !== undefined && (visibleCommits.length > 0 || snapshot.workingTree.changed);
      const hasNoRepository = snapshot !== undefined && snapshot.commits.length === 0 && snapshot.head === null && !snapshot.workingTree.changed;
      const refresh = () => void load({ maxCommits, all: includeAll, firstParent });
      const loadMore = () => {
          const nextMax = Math.min(MAX_COMMITS, maxCommits + PAGE_SIZE);
          setMaxCommits(nextMax);
          void load({ maxCommits: nextMax, all: includeAll, firstParent });
      };
      return ((0, jsx_runtime_1.jsxs)("section", { className: styles_ts_1.css.card, "data-git-graph": true, children: [(0, jsx_runtime_1.jsxs)("header", { className: styles_ts_1.css.header, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.titleBlock, children: [(0, jsx_runtime_1.jsx)("strong", { children: "Git Graph" }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.path, children: snapshot?.path ?? '正在读取当前工作区…' })] }), snapshot !== undefined && (0, jsx_runtime_1.jsx)("span", { className: snapshot.workingTree.changed ? styles_ts_1.css.dirty : styles_ts_1.css.clean, children: snapshot.workingTree.summary })] }), (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.toolbar, role: "toolbar", "aria-label": "Git graph controls", children: [(0, jsx_runtime_1.jsx)("input", { className: styles_ts_1.css.search, type: "search", value: query, onChange: event => setQuery(event.target.value), placeholder: "\u641C\u7D22\u63D0\u4EA4\u3001\u4F5C\u8005\u6216\u5F15\u7528", "aria-label": "Search commits" }), (0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: refFilter, onChange: event => setRefFilter(event.target.value), "aria-label": "Filter references", children: [(0, jsx_runtime_1.jsx)("option", { value: "all", children: "\u5168\u90E8\u5F15\u7528" }), (0, jsx_runtime_1.jsx)("option", { value: "head", children: "\u672C\u5730\u5206\u652F" }), (0, jsx_runtime_1.jsx)("option", { value: "remote", children: "\u8FDC\u7A0B\u5206\u652F" }), (0, jsx_runtime_1.jsx)("option", { value: "tag", children: "\u6807\u7B7E" })] }), (0, jsx_runtime_1.jsxs)("label", { className: styles_ts_1.css.check, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: includeAll, onChange: event => setIncludeAll(event.target.checked) }), "\u5168\u90E8 refs"] }), (0, jsx_runtime_1.jsxs)("label", { className: styles_ts_1.css.check, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: firstParent, onChange: event => setFirstParent(event.target.checked) }), "\u4EC5\u9996\u7236\u63D0\u4EA4"] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.primaryButton, onClick: refresh, disabled: loading, children: loading ? '读取中…' : '刷新' })] }), error !== undefined && (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.error, role: "alert", children: ["\u8BFB\u53D6 Git Graph \u5931\u8D25\uFF1A", error] }), loading && snapshot === undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: "\u6B63\u5728\u8BFB\u53D6 Git Graph\u2026" }), !loading && error === undefined && snapshot !== undefined && visibleCommits.length === 0 && !snapshot.workingTree.changed && ((0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: hasNoRepository ? '当前目录不是 Git 仓库，或仓库尚无提交。' : '当前筛选条件没有匹配的提交。' })), hasGraphRows && snapshot !== undefined && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.graphPanel, children: [(0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.graphHeader, children: "Graph" }), (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.commitHeader, "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("span", { children: "Description" }), (0, jsx_runtime_1.jsx)("span", { children: "Date" }), (0, jsx_runtime_1.jsx)("span", { children: "Author" }), (0, jsx_runtime_1.jsx)("span", { children: "Commit" })] }), (0, jsx_runtime_1.jsx)(GraphSvg, { layout: layout, workingTreeChanged: snapshot.workingTree.changed, selectedHash: selectedHash, onSelect: setSelectedHash }), (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.commitList, children: [snapshot.workingTree.changed && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.workingTreeRow, children: [(0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.commitDescription, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.headDot }), "\u672A\u63D0\u4EA4\u53D8\u66F4"] }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.commitDate, children: "\u2014" }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.commitAuthor, children: "\u2014" }), (0, jsx_runtime_1.jsx)("span", { className: `${styles_ts_1.css.hash} ${styles_ts_1.css.commitHash}`, children: "WORKTREE" })] })), visibleCommits.map(commit => (0, jsx_runtime_1.jsx)(CommitRow, { commit: commit, selected: commit.hash === selectedHash, onSelect: () => setSelectedHash(commit.hash) }, commit.hash))] })] }), canLoadMore && (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.loadMore, onClick: loadMore, disabled: loading, children: loading ? '读取中…' : '加载更多提交' }), (0, jsx_runtime_1.jsx)(CommitDetails, { commit: selectedCommit })] }))] }));
  }

  }),
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.inject = void 0;
  exports.apply = apply;
  const typert_remote_client_ts_1 = require(2);
  const GitGraphView_tsx_1 = require(5);
  const styles_ts_1 = require(4);
  exports.inject = ['remote', 'slots'];
  function apply(ctx) {
      ctx.effect(styles_ts_1.installGitGraphStyles);
      const remoteReady = ctx.remote.$mount(typert_remote_client_ts_1.TYPERT_REMOTE);
      ctx.effect(() => remoteReady, 'git-graph remote');
      ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'git-graph',
          order: 20,
          label: 'Git Graph',
          inject: sessionId => ({
              read: async (request) => {
                  await remoteReady;
                  const gitGraph = ctx.get('remote.gitGraph');
                  return gitGraph.read(sessionId, request);
              },
          }),
      }, GitGraphView_tsx_1.GitGraphView));
  }

  })
    ];
    function __r(id) {
      if (typeof id !== 'number') return require(id);
      if (cache[id]) return cache[id].exports;
      var module = { exports: {} };
      cache[id] = module;
      factories[id](module, module.exports, __r);
      return module.exports;
    }
    return __r(6);
  }
});
