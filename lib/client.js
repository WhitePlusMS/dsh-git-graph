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
  exports.gitGraphDescriptors = exports.gitGraphMetadataInvocation = exports.gitGraphCompareInvocation = exports.gitGraphWorkingTreeFileInvocation = exports.gitGraphWorkingTreeInvocation = exports.gitGraphFileDiffInvocation = exports.gitGraphFileInvocation = exports.gitGraphReadCommitInvocation = exports.gitGraphInvocation = exports.gitGraphEmptyInputSchema = exports.gitGraphMetadataSchema = exports.gitGraphCompareResultSchema = exports.gitGraphCompareRequestSchema = exports.gitGraphWorkingTreeFileRequestSchema = exports.gitGraphWorkingTreeChangesSchema = exports.gitGraphFileDiffSchema = exports.gitGraphFileContentSchema = exports.gitGraphFileRequestSchema = exports.gitGraphCommitDetailsSchema = exports.gitGraphCommitRequestSchema = exports.gitGraphSnapshotSchema = exports.gitGraphInputSchema = exports.TYPERT_PACKAGE = void 0;
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
      rejectUnknown(object, ['path', 'maxCommits', 'all', 'firstParent', 'glob', 'search', 'sort'], '$');
      const result = {};
      if (Object.hasOwn(object, 'path'))
          result.path = stringAt(object.path, '$.path');
      if (Object.hasOwn(object, 'maxCommits'))
          result.maxCommits = integerAt(object.maxCommits, '$.maxCommits', 1, domain_ts_1.MAX_COMMITS);
      if (Object.hasOwn(object, 'all'))
          result.all = booleanAt(object.all, '$.all');
      if (Object.hasOwn(object, 'firstParent'))
          result.firstParent = booleanAt(object.firstParent, '$.firstParent');
      if (Object.hasOwn(object, 'glob')) {
          result.glob = arrayAt(object.glob, '$.glob').map((item, index) => stringAt(item, `$.glob[${index}]`));
      }
      if (Object.hasOwn(object, 'search'))
          result.search = stringAt(object.search, '$.search');
      if (Object.hasOwn(object, 'sort')) {
          const sort = stringAt(object.sort, '$.sort');
          if (sort !== 'date' && sort !== 'author-date' && sort !== 'topological')
              fail('$.sort', 'date, author-date, or topological');
          result.sort = sort;
      }
      return result;
  }
  function parseSnapshot(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['path', 'state', 'branch', 'head', 'workingTree', 'commits', 'hasMore'], '$');
      const workingTree = objectAt(object.workingTree, '$.workingTree');
      rejectUnknown(workingTree, ['changed', 'summary'], '$.workingTree');
      const state = stringAt(object.state, '$.state');
      if (state !== 'not-git' && state !== 'empty' && state !== 'ready')
          fail('$.state', 'not-git, empty, or ready');
      return {
          path: stringAt(object.path, '$.path'),
          state: state,
          branch: nullableStringAt(object.branch, '$.branch'),
          head: nullableStringAt(object.head, '$.head'),
          workingTree: {
              changed: booleanAt(workingTree.changed, '$.workingTree.changed'),
              summary: stringAt(workingTree.summary, '$.workingTree.summary'),
          },
          commits: arrayAt(object.commits, '$.commits').map((commit, index) => parseCommit(commit, `$.commits[${index}]`)),
          hasMore: booleanAt(object.hasMore, '$.hasMore'),
      };
  }
  /** Strict wire schemas intentionally use only the Typert `.parse()` contract. */
  exports.gitGraphInputSchema = { parse: parseInput };
  exports.gitGraphSnapshotSchema = { parse: parseSnapshot };
  const sessionIdSchema = { parse: value => stringAt(value, '$.agentId') };
  /* ------------------------------------------------------------------ *
   * On-demand detail DTO schemas (strict, parse-only).
   * ------------------------------------------------------------------ */
  const HASH_RE = /^[0-9a-f]{40}$/iu;
  function hashStringAt(value, path) {
      const text = stringAt(value, path);
      if (!HASH_RE.test(text))
          fail(path, 'a full 40-char commit hash');
      return text;
  }
  /**
   * Detect whether decoded blob text is unsafe to render as text. The Host has
   * already classified the blob as text or binary via `isTextContent`
   * (any NUL/U+FFFD byte means binary); this client-side guard is only a
   * defense-in-depth echo of that decision. It must NOT reject ordinary UTF-8
   * text — e.g. Chinese comments — which is why only NUL and the replacement
   * character count as binary markers, not every non-ASCII code point.
   */
  function isTextContentSafe(text) {
      return !text.includes('\u0000') && !text.includes('\uFFFD');
  }
  function parseFileChange(value, path) {
      const object = objectAt(value, path);
      rejectUnknown(object, ['type', 'oldPath', 'newPath', 'additions', 'deletions'], path);
      const type = stringAt(object.type, `${path}.type`);
      if (type !== 'A' && type !== 'M' && type !== 'D' && type !== 'R' && type !== 'U') {
          fail(`${path}.type`, 'A, M, D, R, or U');
      }
      return {
          type,
          oldPath: stringAt(object.oldPath, `${path}.oldPath`),
          newPath: stringAt(object.newPath, `${path}.newPath`),
          additions: nullableIntAt(object.additions, `${path}.additions`),
          deletions: nullableIntAt(object.deletions, `${path}.deletions`),
      };
  }
  function nullableIntAt(value, path) {
      if (value === null)
          return null;
      if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
          fail(path, 'a non-negative integer or null');
      return value;
  }
  function parseSignature(value, path) {
      if (value === null)
          return null;
      const object = objectAt(value, path);
      rejectUnknown(object, ['status', 'key', 'signer'], path);
      const status = stringAt(object.status, `${path}.status`);
      if (!/^[GUXRYEB]$/u.test(status))
          fail(`${path}.status`, 'G, U, X, Y, R, E, or B');
      return {
          status: status,
          key: nullableStringAt(object.key, `${path}.key`),
          signer: nullableStringAt(object.signer, `${path}.signer`),
      };
  }
  function parseCommitDetails(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['hash', 'parents', 'author', 'authorEmail', 'committer', 'committerEmail', 'timestamps', 'signature', 'body', 'fileChanges'], '$');
      const timestamps = objectAt(object.timestamps, '$.timestamps');
      rejectUnknown(timestamps, ['authorDate', 'committerDate'], '$.timestamps');
      return {
          hash: stringAt(object.hash, '$.hash'),
          parents: arrayAt(object.parents, '$.parents').map((parent, index) => stringAt(parent, `$.parents[${index}]`)),
          author: stringAt(object.author, '$.author'),
          authorEmail: stringAt(object.authorEmail, '$.authorEmail'),
          committer: stringAt(object.committer, '$.committer'),
          committerEmail: stringAt(object.committerEmail, '$.committerEmail'),
          timestamps: {
              authorDate: stringAt(timestamps.authorDate, '$.timestamps.authorDate'),
              committerDate: stringAt(timestamps.committerDate, '$.timestamps.committerDate'),
          },
          signature: parseSignature(object.signature, '$.signature'),
          body: stringAt(object.body, '$.body'),
          fileChanges: arrayAt(object.fileChanges, '$.fileChanges').map((entry, index) => parseFileChange(entry, `$.fileChanges[${index}]`)),
      };
  }
  function parseCommitRequest(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['hash'], '$');
      return { hash: hashStringAt(object.hash, '$.hash') };
  }
  function parseFileRequest(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['hash', 'path'], '$');
      return { hash: hashStringAt(object.hash, '$.hash'), path: stringAt(object.path, '$.path') };
  }
  function parseCompareRequest(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['baseHash', 'targetHash'], '$');
      return { baseHash: hashStringAt(object.baseHash, '$.baseHash'), targetHash: hashStringAt(object.targetHash, '$.targetHash') };
  }
  function parseFileContent(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['hash', 'path', 'kind', 'text', 'size', 'truncated'], '$');
      const kind = stringAt(object.kind, '$.kind');
      if (kind !== 'text' && kind !== 'binary')
          fail('$.kind', 'text or binary');
      const text = object.text === null ? null : stringAt(object.text, '$.text');
      if (kind === 'text' && text !== null && !isTextContentSafe(text))
          fail('$.text', 'text content without binary control bytes');
      return {
          hash: stringAt(object.hash, '$.hash'),
          path: stringAt(object.path, '$.path'),
          kind,
          text,
          size: integerAt(object.size, '$.size', 0, Number.MAX_SAFE_INTEGER),
          truncated: booleanAt(object.truncated, '$.truncated'),
      };
  }
  function parseDiffLine(value, path) {
      const object = objectAt(value, path);
      rejectUnknown(object, ['type', 'content', 'oldLine', 'newLine'], path);
      const type = stringAt(object.type, `${path}.type`);
      if (type !== 'context' && type !== 'added' && type !== 'removed')
          fail(`${path}.type`, 'context, added, or removed');
      return {
          type,
          content: stringAt(object.content, `${path}.content`),
          oldLine: nullableIntAt(object.oldLine, `${path}.oldLine`),
          newLine: nullableIntAt(object.newLine, `${path}.newLine`),
      };
  }
  function parseFileDiff(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['hash', 'path', 'oldPath', 'status', 'additions', 'deletions', 'lines'], '$');
      const status = stringAt(object.status, '$.status');
      if (status !== 'A' && status !== 'M' && status !== 'D' && status !== 'R' && status !== 'U')
          fail('$.status', 'A, M, D, R, or U');
      return {
          hash: stringAt(object.hash, '$.hash'),
          path: stringAt(object.path, '$.path'),
          oldPath: stringAt(object.oldPath, '$.oldPath'),
          status,
          additions: integerAt(object.additions, '$.additions', 0, Number.MAX_SAFE_INTEGER),
          deletions: integerAt(object.deletions, '$.deletions', 0, Number.MAX_SAFE_INTEGER),
          lines: arrayAt(object.lines, '$.lines').map((entry, index) => parseDiffLine(entry, `$.lines[${index}]`)),
      };
  }
  function parseWorkingTreeChanges(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['changes'], '$');
      return {
          changes: arrayAt(object.changes, '$.changes').map((entry, index) => parseFileChange(entry, `$.changes[${index}]`)),
      };
  }
  function parseWorkingTreeFileRequest(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['path'], '$');
      return { path: stringAt(object.path, '$.path') };
  }
  function parseCompareResult(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['baseHash', 'targetHash', 'changes'], '$');
      return {
          baseHash: stringAt(object.baseHash, '$.baseHash'),
          targetHash: stringAt(object.targetHash, '$.targetHash'),
          changes: arrayAt(object.changes, '$.changes').map((entry, index) => parseFileChange(entry, `$.changes[${index}]`)),
      };
  }
  exports.gitGraphCommitRequestSchema = { parse: parseCommitRequest };
  exports.gitGraphCommitDetailsSchema = { parse: parseCommitDetails };
  exports.gitGraphFileRequestSchema = { parse: parseFileRequest };
  exports.gitGraphFileContentSchema = { parse: parseFileContent };
  exports.gitGraphFileDiffSchema = { parse: parseFileDiff };
  exports.gitGraphWorkingTreeChangesSchema = { parse: parseWorkingTreeChanges };
  exports.gitGraphWorkingTreeFileRequestSchema = { parse: parseWorkingTreeFileRequest };
  exports.gitGraphCompareRequestSchema = { parse: parseCompareRequest };
  exports.gitGraphCompareResultSchema = { parse: parseCompareResult };
  /* ------------------------------------------------------------------ *
   * Repository metadata (tags + stashes) for the on-demand view.
   * ------------------------------------------------------------------ */
  function parseTagDetails(value, path) {
      if (value === null)
          return null;
      const object = objectAt(value, path);
      rejectUnknown(object, ['objectHash', 'tagger', 'taggerEmail', 'taggerDate', 'message', 'signature'], path);
      return {
          objectHash: stringAt(object.objectHash, `${path}.objectHash`),
          tagger: stringAt(object.tagger, `${path}.tagger`),
          taggerEmail: stringAt(object.taggerEmail, `${path}.taggerEmail`),
          taggerDate: stringAt(object.taggerDate, `${path}.taggerDate`),
          message: stringAt(object.message, `${path}.message`),
          signature: parseSignature(object.signature, `${path}.signature`),
      };
  }
  function parseTag(value, path) {
      const object = objectAt(value, path);
      rejectUnknown(object, ['name', 'annotated', 'detail'], path);
      const annotated = booleanAt(object.annotated, `${path}.annotated`);
      return {
          name: stringAt(object.name, `${path}.name`),
          annotated,
          detail: annotated ? parseTagDetails(object.detail, `${path}.detail`) : null,
      };
  }
  function parseStash(value, path) {
      const object = objectAt(value, path);
      rejectUnknown(object, ['selector', 'hash', 'baseHash', 'untrackedFilesHash', 'author', 'email', 'date', 'message'], path);
      return {
          selector: stringAt(object.selector, `${path}.selector`),
          hash: stringAt(object.hash, `${path}.hash`),
          baseHash: stringAt(object.baseHash, `${path}.baseHash`),
          untrackedFilesHash: nullableStringAt(object.untrackedFilesHash, `${path}.untrackedFilesHash`),
          author: stringAt(object.author, `${path}.author`),
          email: stringAt(object.email, `${path}.email`),
          date: stringAt(object.date, `${path}.date`),
          message: stringAt(object.message, `${path}.message`),
      };
  }
  function parseMetadata(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['tags', 'stashes'], '$');
      return {
          tags: arrayAt(object.tags, '$.tags').map((entry, index) => parseTag(entry, `$.tags[${index}]`)),
          stashes: arrayAt(object.stashes, '$.stashes').map((entry, index) => parseStash(entry, `$.stashes[${index}]`)),
      };
  }
  function parseEmptyInput(_value) {
      const object = objectAt(_value, '$');
      rejectUnknown(object, [], '$');
      return {};
  }
  exports.gitGraphMetadataSchema = { parse: parseMetadata };
  exports.gitGraphEmptyInputSchema = { parse: parseEmptyInput };
  /** Build the shared endpoint metadata with a face-specific schema runtime. */
  function createGitGraphInvocation(spec) {
      return {
          id: `${exports.TYPERT_PACKAGE}#gitGraph/${spec.method}`,
          service: 'gitGraph',
          namespace: 'gitGraph',
          method: spec.method,
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
                      schema: spec.schemas.sessionId,
                  },
              },
              {
                  name: 'request',
                  wire: 'request',
                  source: 'json',
                  codec: {
                      mode: 'strict',
                      typeSymbol: `${exports.TYPERT_PACKAGE}#${spec.inputSymbol}`,
                      schema: spec.schemas.input,
                  },
              },
          ],
          result: {
              mode: 'strict',
              typeSymbol: `${exports.TYPERT_PACKAGE}#${spec.resultSymbol}`,
              schema: spec.schemas.result,
          },
      };
  }
  /** Client descriptors use the local parse-only schemas to keep the bundle closed. */
  exports.gitGraphInvocation = createGitGraphInvocation({
      method: 'read',
      inputSymbol: 'GitGraphInput',
      resultSymbol: 'GitGraphSnapshot',
      schemas: { input: exports.gitGraphInputSchema, result: exports.gitGraphSnapshotSchema, sessionId: sessionIdSchema },
  });
  exports.gitGraphReadCommitInvocation = createGitGraphInvocation({
      method: 'readCommit',
      inputSymbol: 'GitGraphCommitRequest',
      resultSymbol: 'GitGraphCommitDetails',
      schemas: { input: exports.gitGraphCommitRequestSchema, result: exports.gitGraphCommitDetailsSchema, sessionId: sessionIdSchema },
  });
  exports.gitGraphFileInvocation = createGitGraphInvocation({
      method: 'readFile',
      inputSymbol: 'GitGraphFileRequest',
      resultSymbol: 'GitGraphFileContent',
      schemas: { input: exports.gitGraphFileRequestSchema, result: exports.gitGraphFileContentSchema, sessionId: sessionIdSchema },
  });
  exports.gitGraphFileDiffInvocation = createGitGraphInvocation({
      method: 'readFileDiff',
      inputSymbol: 'GitGraphFileRequest',
      resultSymbol: 'GitGraphFileDiff',
      schemas: { input: exports.gitGraphFileRequestSchema, result: exports.gitGraphFileDiffSchema, sessionId: sessionIdSchema },
  });
  exports.gitGraphWorkingTreeInvocation = createGitGraphInvocation({
      method: 'readWorkingTree',
      inputSymbol: 'GitGraphWorkingTreeRequest',
      resultSymbol: 'GitGraphWorkingTreeChanges',
      schemas: { input: exports.gitGraphEmptyInputSchema, result: exports.gitGraphWorkingTreeChangesSchema, sessionId: sessionIdSchema },
  });
  exports.gitGraphWorkingTreeFileInvocation = createGitGraphInvocation({
      method: 'readWorkingTreeFile',
      inputSymbol: 'GitGraphWorkingTreeFileRequest',
      resultSymbol: 'GitGraphFileDiff',
      schemas: { input: exports.gitGraphWorkingTreeFileRequestSchema, result: exports.gitGraphFileDiffSchema, sessionId: sessionIdSchema },
  });
  exports.gitGraphCompareInvocation = createGitGraphInvocation({
      method: 'compare',
      inputSymbol: 'GitGraphCompareRequest',
      resultSymbol: 'GitGraphCompareResult',
      schemas: { input: exports.gitGraphCompareRequestSchema, result: exports.gitGraphCompareResultSchema, sessionId: sessionIdSchema },
  });
  exports.gitGraphMetadataInvocation = createGitGraphInvocation({
      method: 'metadata',
      inputSymbol: 'GitGraphMetadataRequest',
      resultSymbol: 'GitGraphMetadata',
      schemas: { input: exports.gitGraphEmptyInputSchema, result: exports.gitGraphMetadataSchema, sessionId: sessionIdSchema },
  });
  exports.gitGraphDescriptors = [
      exports.gitGraphInvocation,
      exports.gitGraphReadCommitInvocation,
      exports.gitGraphFileInvocation,
      exports.gitGraphFileDiffInvocation,
      exports.gitGraphWorkingTreeInvocation,
      exports.gitGraphWorkingTreeFileInvocation,
      exports.gitGraphCompareInvocation,
      exports.gitGraphMetadataInvocation,
  ];

  }),
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.gitGraphMetadataInvocation = exports.gitGraphCompareInvocation = exports.gitGraphWorkingTreeFileInvocation = exports.gitGraphWorkingTreeInvocation = exports.gitGraphFileDiffInvocation = exports.gitGraphFileInvocation = exports.gitGraphReadCommitInvocation = exports.TYPERT_REMOTE = void 0;
  const typert_shared_ts_1 = require(1);
  Object.defineProperty(exports, "gitGraphCompareInvocation", { enumerable: true, get: function () { return typert_shared_ts_1.gitGraphCompareInvocation; } });
  Object.defineProperty(exports, "gitGraphFileDiffInvocation", { enumerable: true, get: function () { return typert_shared_ts_1.gitGraphFileDiffInvocation; } });
  Object.defineProperty(exports, "gitGraphFileInvocation", { enumerable: true, get: function () { return typert_shared_ts_1.gitGraphFileInvocation; } });
  Object.defineProperty(exports, "gitGraphMetadataInvocation", { enumerable: true, get: function () { return typert_shared_ts_1.gitGraphMetadataInvocation; } });
  Object.defineProperty(exports, "gitGraphReadCommitInvocation", { enumerable: true, get: function () { return typert_shared_ts_1.gitGraphReadCommitInvocation; } });
  Object.defineProperty(exports, "gitGraphWorkingTreeFileInvocation", { enumerable: true, get: function () { return typert_shared_ts_1.gitGraphWorkingTreeFileInvocation; } });
  Object.defineProperty(exports, "gitGraphWorkingTreeInvocation", { enumerable: true, get: function () { return typert_shared_ts_1.gitGraphWorkingTreeInvocation; } });
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
  /**
   * Client-only display settings, persisted per repository. Storage keys are
   * derived from a stable hash of the normalized repository path so settings never
   * use the raw (case/separator-sensitive) path as the unique key and never leak
   * between repositories.
   */
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DEFAULT_DISPLAY_SETTINGS = void 0;
  exports.stableRepoId = stableRepoId;
  exports.loadDisplaySettings = loadDisplaySettings;
  exports.saveDisplaySettings = saveDisplaySettings;
  exports.DEFAULT_DISPLAY_SETTINGS = {
      showDate: true,
      showAuthor: true,
      showHash: true,
      dateFormat: 'short',
      graphStyle: 'full',
  };
  const STORAGE_PREFIX = 'dsh-git-graph:s:';
  /** Stable non-negative integer id derived from a normalized repo path. */
  function stableRepoId(path) {
      const normalized = path.replace(/[/\\]+$/u, '').toLocaleLowerCase();
      let hash = 2166136261;
      for (let i = 0; i < normalized.length; i += 1) {
          hash ^= normalized.charCodeAt(i);
          hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
  }
  function storageKey(path) {
      return `${STORAGE_PREFIX}${stableRepoId(path).toString(36)}`;
  }
  function isPartial(value) {
      return typeof value === 'object' && value !== null;
  }
  /** Load settings for a repository path, falling back to defaults on error. */
  function loadDisplaySettings(path) {
      if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
          return exports.DEFAULT_DISPLAY_SETTINGS;
      }
      try {
          const raw = window.localStorage.getItem(storageKey(path));
          if (raw === null)
              return exports.DEFAULT_DISPLAY_SETTINGS;
          const parsed = JSON.parse(raw);
          if (!isPartial(parsed))
              return exports.DEFAULT_DISPLAY_SETTINGS;
          const bool = (value, fallback) => typeof value === 'boolean' ? value : fallback;
          const dateFormat = parsed.dateFormat === 'short' || parsed.dateFormat === 'full' || parsed.dateFormat === 'local'
              ? parsed.dateFormat
              : exports.DEFAULT_DISPLAY_SETTINGS.dateFormat;
          const graphStyle = parsed.graphStyle === 'compact' || parsed.graphStyle === 'full'
              ? parsed.graphStyle
              : exports.DEFAULT_DISPLAY_SETTINGS.graphStyle;
          return {
              showDate: bool(parsed.showDate, exports.DEFAULT_DISPLAY_SETTINGS.showDate),
              showAuthor: bool(parsed.showAuthor, exports.DEFAULT_DISPLAY_SETTINGS.showAuthor),
              showHash: bool(parsed.showHash, exports.DEFAULT_DISPLAY_SETTINGS.showHash),
              dateFormat,
              graphStyle,
          };
      }
      catch {
          return exports.DEFAULT_DISPLAY_SETTINGS;
      }
  }
  /** Persist settings for a repository path. Never throws. */
  function saveDisplaySettings(path, settings) {
      if (typeof window === 'undefined' || typeof window.localStorage === 'undefined')
          return;
      try {
          window.localStorage.setItem(storageKey(path), JSON.stringify(settings));
      }
      catch {
          // Storage quota or privacy mode; display settings are best-effort.
      }
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
  const settings_ts_1 = require(4);
  const styles_ts_1 = require(5);
  const MAX_COMMITS = 500;
  const PAGE_SIZE = 100;
  function shortHash(hash) {
      return hash.slice(0, 8);
  }
  function formatDate(value) {
      const date = new Date(value);
      return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
  }
  function formatDateValue(value, format) {
      const date = new Date(value);
      if (Number.isNaN(date.valueOf()))
          return value;
      if (format === 'full')
          return date.toLocaleString();
      if (format === 'local')
          return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
      return date.toLocaleDateString();
  }
  function refMatches(commit, filter) {
      return filter === 'all' || commit.refs.some(ref => ref.kind === filter);
  }
  function RefBadges({ refs }) {
      return refs.length === 0 ? null : ((0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.refs, "aria-label": "References", children: refs.map(ref => ((0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.ref, "data-kind": ref.kind, title: ref.name, children: [(0, jsx_runtime_1.jsx)("svg", { className: styles_ts_1.css.refIcon, viewBox: "0 0 16 16", "aria-hidden": "true", children: ref.kind === 'tag' ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M3 3h4.1L13 8.9 8.9 13 3 7.1V3Z", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }), (0, jsx_runtime_1.jsx)("circle", { cx: "5.2", cy: "5.2", r: "1", fill: "currentColor" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M5 4.4v7.2M5 8h3a2.5 2.5 0 0 1 2.5 2.5V12", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }), (0, jsx_runtime_1.jsx)("circle", { cx: "5", cy: "3", r: "1.7", fill: "currentColor" }), (0, jsx_runtime_1.jsx)("circle", { cx: "5", cy: "13", r: "1.7", fill: "currentColor" }), (0, jsx_runtime_1.jsx)("circle", { cx: "10.5", cy: "13", r: "1.7", fill: "currentColor" })] })) }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.refName, children: ref.name })] }, `${ref.kind}:${ref.name}`))) }));
  }
  function GraphSvg({ layout, workingTreeChanged, selectedHash, gapAfterRow, gapHeight, onSelect }) {
      const rowHeight = 28;
      const laneWidth = 16;
      const graphPadding = 16;
      const graphWidth = Math.max(64, graphPadding * 2 + Math.max(0, layout.laneCount - 1) * laneWidth + 8);
      const rowOffset = workingTreeChanged ? 1 : 0;
      const gap = gapAfterRow === undefined ? 0 : gapHeight;
      const graphHeight = Math.max(rowHeight, (layout.nodes.length + rowOffset) * rowHeight) + gap;
      const colours = ['#0085d9', '#d9008f', '#00a86b', '#d98500', '#7b4bc4', '#e138e8', '#00a7a0', '#dc5b23', '#6f24d6', '#b38b00'];
      const headNode = layout.nodes.find(node => node.commit.isHead) ?? layout.nodes[0];
      const pointX = (lane) => graphPadding + lane * laneWidth;
      // Rows below the expanded row are pushed down so the graph keeps lining up
      // with the commit rows next to the inline details view.
      const pointY = (row) => {
          const base = (row + rowOffset) * rowHeight + rowHeight / 2;
          return gapAfterRow !== undefined && row > gapAfterRow ? base + gap : base;
      };
      const pathForEdge = (edge) => {
          const x1 = pointX(edge.fromLane);
          const x2 = pointX(edge.toLane);
          const y1 = pointY(edge.row);
          const y2 = pointY(edge.row + 1);
          if (x1 === x2)
              return `M ${x1} ${y1} L ${x2} ${y2}`;
          const span = y2 - y1;
          const curve = span > rowHeight * 1.5 ? span * 0.4 : rowHeight * 0.8;
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
  function commitMatchesFind(commit, text, caseSensitive, regex) {
      if (text.length === 0)
          return false;
      try {
          if (regex) {
              const flags = caseSensitive ? '' : 'i';
              return new RegExp(text, flags).test([commit.subject, commit.author, commit.email, commit.hash, ...commit.refs.map(ref => ref.name)].join(' '));
          }
      }
      catch {
          return false;
      }
      const needle = caseSensitive ? text : text.toLocaleLowerCase();
      const haystack = caseSensitive
          ? [commit.subject, commit.author, commit.email, commit.hash, ...commit.refs.map(ref => ref.name)].join(' ')
          : [commit.subject, commit.author, commit.email, commit.hash, ...commit.refs.map(ref => ref.name)].join(' ').toLocaleLowerCase();
      return haystack.includes(needle);
  }
  function CommitRow({ commit, selected, display, findActive, onSelect }) {
      return ((0, jsx_runtime_1.jsxs)("button", { type: "button", className: selected ? `${styles_ts_1.css.commit} ${styles_ts_1.css.commitSelected}` : styles_ts_1.css.commit, "aria-pressed": selected, onClick: onSelect, children: [(0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.commitDescription, children: [commit.isHead && (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.headDot, title: "\u5F53\u524D HEAD", "aria-label": "\u5F53\u524D HEAD" }), (0, jsx_runtime_1.jsx)(Avatar, { email: commit.email, name: commit.author }), (0, jsx_runtime_1.jsx)(RefBadges, { refs: commit.refs }), (0, jsx_runtime_1.jsx)("span", { className: findActive ? styles_ts_1.css.findHighlight : styles_ts_1.css.subject, children: commit.subject || '(no subject)' })] }), display.showDate && (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.commitDate, title: formatDate(commit.date), children: formatDateValue(commit.date, display.dateFormat) }), display.showAuthor && (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.commitAuthor, title: `${commit.author} <${commit.email}>`, children: commit.author }), display.showHash && (0, jsx_runtime_1.jsx)("span", { className: `${styles_ts_1.css.hash} ${styles_ts_1.css.commitHash}`, title: commit.hash, children: shortHash(commit.hash) })] }));
  }
  function FileGlyph() {
      return ((0, jsx_runtime_1.jsxs)("svg", { className: styles_ts_1.css.fileGlyph, viewBox: "0 0 16 16", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("path", { d: "M4 1.8h4.8l3.2 3.2v9.2H4V1.8Z", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinejoin: "round" }), (0, jsx_runtime_1.jsx)("path", { d: "M8.8 1.8v3.2H12", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinejoin: "round" })] }));
  }
  function FolderGlyph({ open }) {
      return ((0, jsx_runtime_1.jsx)("svg", { className: styles_ts_1.css.fileGlyph, viewBox: "0 0 16 16", "aria-hidden": "true", children: open ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M1.8 3.2h4.2l1.6 1.8h6.6v2.2H1.8V3.2Z", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinejoin: "round" }), (0, jsx_runtime_1.jsx)("path", { d: "M1.8 7.2h12.4l-1.7 5.6H3.5L1.8 7.2Z", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinejoin: "round" })] })) : ((0, jsx_runtime_1.jsx)("path", { d: "M1.8 3.2h4.2l1.6 1.8h6.6v7.8H1.8V3.2Z", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinejoin: "round" })) }));
  }
  function FileChangeStatus({ type }) {
      const label = type === 'A' ? '新增' : type === 'M' ? '修改' : type === 'D' ? '删除' : type === 'R' ? '重命名' : '冲突';
      return (0, jsx_runtime_1.jsx)("code", { className: `${styles_ts_1.css.hash} ${styles_ts_1.css.fileStatus}`, "data-status": type, title: label, children: type });
  }
  function pathSegments(path) {
      return path.split(/[/\\]+/u).filter(segment => segment.length > 0);
  }
  /**
   * Group changed file paths into a directory tree (like vscode-git-graph).
   * Directory nodes collect nested folders; leaves carry the file change.
   */
  function buildFileTree(changes) {
      const rootGroup = { children: new Map(), files: new Map() };
      for (const change of changes) {
          const segments = pathSegments(change.newPath);
          let group = rootGroup;
          for (const segment of segments.slice(0, -1)) {
              let next = group.children.get(segment);
              if (next === undefined) {
                  next = { children: new Map(), files: new Map() };
                  group.children.set(segment, next);
              }
              group = next;
          }
          const name = segments[segments.length - 1] ?? change.newPath;
          group.files.set(name, change);
      }
      const build = (group, prefix) => {
          const nodes = [];
          for (const [name, child] of [...group.children].sort(([a], [b]) => a.localeCompare(b))) {
              // Compact chains of folders that contain nothing but a single subfolder
              // into one row ("a / b"), like vscode-git-graph's compact folders.
              let displayName = name;
              let fullPath = prefix.length === 0 ? name : `${prefix}/${name}`;
              let current = child;
              while (current.files.size === 0 && current.children.size === 1) {
                  const entry = [...current.children][0];
                  if (entry === undefined)
                      break;
                  displayName += ` / ${entry[0]}`;
                  fullPath += `/${entry[0]}`;
                  current = entry[1];
              }
              nodes.push({ kind: 'folder', name: displayName, fullPath, children: build(current, fullPath) });
          }
          for (const [name, change] of [...group.files].sort(([a], [b]) => a.localeCompare(b))) {
              nodes.push({ kind: 'file', name, change });
          }
          return nodes;
      };
      return build(rootGroup, '');
  }
  /** A single changed-file row, shared by the tree leaves and the flat list. */
  function FileLeaf({ change, name, onOpenFile }) {
      const textFile = change.additions !== null && change.additions !== undefined && change.deletions !== null && change.deletions !== undefined;
      // Like vscode-git-graph, add/del stats are only shown for modified/renamed
      // text files; for added files every line is an addition anyway.
      const showStats = textFile && change.type !== 'A' && change.type !== 'D';
      const diffPossible = change.type !== 'D';
      return ((0, jsx_runtime_1.jsx)("li", { className: styles_ts_1.css.fileLeaf, children: (0, jsx_runtime_1.jsxs)("button", { type: "button", className: diffPossible ? styles_ts_1.css.fileRecord : `${styles_ts_1.css.fileRecord} ${styles_ts_1.css.fileRecordDisabled}`, title: diffPossible ? `查看 Diff · ${change.newPath}` : `文件已删除 · ${change.newPath}`, onClick: () => { if (diffPossible)
                  onOpenFile(change); }, children: [(0, jsx_runtime_1.jsx)(FileGlyph, {}), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.fileName, "data-status": change.type, children: name }), showStats && ((0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileAddDel, children: ["(", (0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileAdd, children: ["+", change.additions] }), "|", (0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileDel, children: ["\u2212", change.deletions] }), ")"] }))] }) }));
  }
  function FileTree({ changes, onOpenFile }) {
      const [collapsed, setCollapsed] = (0, react_1.useState)(() => new Set());
      const nodes = (0, react_1.useMemo)(() => buildFileTree(changes), [changes]);
      const toggle = (fullPath) => {
          setCollapsed(prev => {
              const next = new Set(prev);
              if (next.has(fullPath))
                  next.delete(fullPath);
              else
                  next.add(fullPath);
              return next;
          });
      };
      const renderNode = (node) => {
          if (node.kind === 'folder') {
              const isCollapsed = collapsed.has(node.fullPath);
              return ((0, jsx_runtime_1.jsxs)("li", { className: styles_ts_1.css.treeFolder, children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", className: styles_ts_1.css.treeFolderToggle, onClick: () => toggle(node.fullPath), "aria-expanded": !isCollapsed, title: node.fullPath, children: [(0, jsx_runtime_1.jsx)(FolderGlyph, { open: !isCollapsed }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.treeFolderName, children: node.name })] }), !isCollapsed && (0, jsx_runtime_1.jsx)("ul", { className: styles_ts_1.css.treeChildren, children: node.children.map(renderNode) })] }, node.fullPath));
          }
          return (0, jsx_runtime_1.jsx)(FileLeaf, { change: node.change, name: node.name, onOpenFile: onOpenFile }, node.change.newPath);
      };
      return (0, jsx_runtime_1.jsx)("ul", { className: styles_ts_1.css.tree, role: "tree", children: nodes.map(renderNode) });
  }
  /** Flat path list rendering, kept as an alternative to the tree view. */
  function FlatFileList({ changes, onOpenFile }) {
      return ((0, jsx_runtime_1.jsx)("ul", { className: styles_ts_1.css.fileList, children: changes.map((change, index) => ((0, jsx_runtime_1.jsx)(FileLeaf, { change: change, name: change.newPath, onOpenFile: onOpenFile }, `${change.type}-${change.oldPath}-${change.newPath}-${index}`))) }));
  }
  function ViewToggle({ view, onChange }) {
      return ((0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.viewToggle, role: "group", "aria-label": "\u5207\u6362\u89C6\u56FE", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: view === 'list' ? `${styles_ts_1.css.viewToggleBtn} ${styles_ts_1.css.viewToggleActive}` : styles_ts_1.css.viewToggleBtn, onClick: () => onChange('list'), children: "\u5217\u8868" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: view === 'tree' ? `${styles_ts_1.css.viewToggleBtn} ${styles_ts_1.css.viewToggleActive}` : styles_ts_1.css.viewToggleBtn, onClick: () => onChange('tree'), children: "\u6811" })] }));
  }
  /** Renders the changed-file area in either the flat list or the folder tree. */
  function FileChangesView({ changes, view, onOpenFile }) {
      return view === 'tree'
          ? (0, jsx_runtime_1.jsx)(FileTree, { changes: changes, onOpenFile: onOpenFile })
          : (0, jsx_runtime_1.jsx)(FlatFileList, { changes: changes, onOpenFile: onOpenFile });
  }
  function CommitDetails({ commit, readCommit, compareActive, onCompare, onOpenFile }) {
      const [copied, setCopied] = (0, react_1.useState)(false);
      const [details, setDetails] = (0, react_1.useState)();
      const [detailsError, setDetailsError] = (0, react_1.useState)();
      const [view, setView] = (0, react_1.useState)('tree');
      (0, react_1.useEffect)(() => setCopied(false), [commit?.hash]);
      (0, react_1.useEffect)(() => {
          setDetails(undefined);
          setDetailsError(undefined);
          if (commit === undefined)
              return;
          let cancelled = false;
          void readCommit({ hash: commit.hash }).then(result => {
              if (cancelled)
                  return;
              if (result.ok)
                  setDetails(result.value);
              else
                  setDetailsError(result.error.message);
          }).catch((cause) => {
              if (!cancelled)
                  setDetailsError(cause instanceof Error ? cause.message : String(cause));
          });
          return () => { cancelled = true; };
      }, [commit?.hash, readCommit]);
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
      const signatureText = details?.signature
          ? `签名 ${details.signature.status}${details.signature.signer ? ` · ${details.signature.signer}` : ''}`
          : '未签名';
      return ((0, jsx_runtime_1.jsxs)("aside", { className: styles_ts_1.css.detailsPanel, "aria-label": "Commit details", children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.detailsHeading, children: [(0, jsx_runtime_1.jsx)("strong", { children: commit.subject || '(no subject)' }), (0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.detailsActions, children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: () => void copyHash(), children: copied ? '已复制' : '复制 Hash' }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onCompare, children: compareActive ? '关闭比较' : '比较提交…' })] })] }), (0, jsx_runtime_1.jsxs)("dl", { className: styles_ts_1.css.detailsList, children: [(0, jsx_runtime_1.jsx)("dt", { children: "Hash" }), (0, jsx_runtime_1.jsx)("dd", { className: styles_ts_1.css.mono, children: commit.hash }), (0, jsx_runtime_1.jsx)("dt", { children: "\u4F5C\u8005" }), (0, jsx_runtime_1.jsxs)("dd", { children: [commit.author, " <", commit.email, ">"] }), (0, jsx_runtime_1.jsx)("dt", { children: "\u65F6\u95F4" }), (0, jsx_runtime_1.jsx)("dd", { children: formatDate(commit.date) }), details !== undefined && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("dt", { children: "\u63D0\u4EA4\u8005" }), (0, jsx_runtime_1.jsxs)("dd", { children: [details.committer, " <", details.committerEmail, ">"] }), (0, jsx_runtime_1.jsx)("dt", { children: "\u7B7E\u540D" }), (0, jsx_runtime_1.jsx)("dd", { children: signatureText })] })), (0, jsx_runtime_1.jsx)("dt", { children: "\u7236\u63D0\u4EA4" }), (0, jsx_runtime_1.jsx)("dd", { className: styles_ts_1.css.mono, children: commit.parents.length === 0 ? '(root)' : commit.parents.map(shortHash).join(', ') }), (0, jsx_runtime_1.jsx)("dt", { children: "\u5F15\u7528" }), (0, jsx_runtime_1.jsx)("dd", { children: (0, jsx_runtime_1.jsx)(RefBadges, { refs: commit.refs }) })] }), details === undefined && detailsError === undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: "\u6B63\u5728\u8BFB\u53D6\u63D0\u4EA4\u8BE6\u60C5\u2026" }), detailsError !== undefined && (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.error, role: "alert", children: ["\u8BFB\u53D6\u8BE6\u60C5\u5931\u8D25\uFF1A", detailsError] }), details !== undefined && details.body.length > 0 && ((0, jsx_runtime_1.jsx)("pre", { className: styles_ts_1.css.detailBody, children: details.body })), details !== undefined && details.fileChanges.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileChanges, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileChangesHeaderRow, children: [(0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileChangesTitle, children: ["\u6587\u4EF6\u53D8\u66F4 (", details.fileChanges.length, ")"] }), (0, jsx_runtime_1.jsx)(ViewToggle, { view: view, onChange: setView })] }), (0, jsx_runtime_1.jsx)(FileChangesView, { changes: details.fileChanges, view: view, onOpenFile: change => onOpenFile(commit.hash, change.newPath) })] }))] }));
  }
  function DiffStatusBadge({ status }) {
      const label = status === 'A' ? '新增' : status === 'M' ? '修改' : status === 'D' ? '删除' : status === 'R' ? '重命名' : '冲突';
      return (0, jsx_runtime_1.jsx)("code", { className: `${styles_ts_1.css.hash} ${styles_ts_1.css.fileStatus}`, "data-status": status, title: label, children: status });
  }
  /** Shared line-by-line diff table used by commit and working-tree file views. */
  function DiffBody({ diff }) {
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.diffViewer, "data-diff-viewer": true, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.diffHeader, "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffLineNo, children: "\u65E7" }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffLineNo, children: "\u65B0" }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffMarker }), (0, jsx_runtime_1.jsx)("span", { children: "\u5185\u5BB9" })] }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.diffBody, children: diff.lines.map((line, index) => ((0, jsx_runtime_1.jsxs)("div", { className: `${styles_ts_1.css.diffLine} ${line.type === 'added' ? styles_ts_1.css.diffAdded : line.type === 'removed' ? styles_ts_1.css.diffRemoved : styles_ts_1.css.diffContext}`, "data-diff-type": line.type, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffLineNo, children: line.oldLine ?? '' }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffLineNo, children: line.newLine ?? '' }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffMarker, children: line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' ' }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffContent, children: line.content })] }, index))) })] }));
  }
  function FileViewer({ hash, path, readFileDiff, onClose }) {
      const [diff, setDiff] = (0, react_1.useState)();
      const [error, setError] = (0, react_1.useState)();
      const [copied, setCopied] = (0, react_1.useState)(false);
      (0, react_1.useEffect)(() => {
          let cancelled = false;
          void readFileDiff({ hash, path }).then(result => {
              if (cancelled)
                  return;
              if (result.ok)
                  setDiff(result.value);
              else
                  setError(result.error.message);
          }).catch((cause) => {
              if (!cancelled)
                  setError(cause instanceof Error ? cause.message : String(cause));
          });
          return () => { cancelled = true; };
      }, [hash, path, readFileDiff]);
      const copyPath = async () => {
          if (typeof navigator === 'undefined' || navigator.clipboard === undefined)
              return;
          try {
              await navigator.clipboard.writeText(path);
              setCopied(true);
          }
          catch { /* clipboard is optional */ }
      };
      const hasChange = diff !== undefined && diff.lines.some(line => line.type !== 'context');
      const binaryLike = diff !== undefined && diff.lines.length === 0 && (diff.additions > 0 || diff.deletions > 0);
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileViewer, "data-file-viewer": true, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileViewerHeader, children: [(0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileViewerTitle, children: [diff !== undefined && (0, jsx_runtime_1.jsx)(DiffStatusBadge, { status: diff.status }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.mono, children: path })] }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.fileViewerMeta, children: diff !== undefined && `+${diff.additions} −${diff.deletions}` }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.linkButton, onClick: () => void copyPath(), children: copied ? '已复制' : '复制路径' }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onClose, children: "\u5173\u95ED" })] }), error !== undefined && (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.error, role: "alert", children: ["\u8BFB\u53D6\u6587\u4EF6 Diff \u5931\u8D25\uFF1A", error] }), diff === undefined && error === undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: "\u6B63\u5728\u8BFB\u53D6\u6587\u4EF6\u53D8\u66F4\u2026" }), diff !== undefined && !hasChange && binaryLike && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.pending, children: ["\u4E8C\u8FDB\u5236\u6587\u4EF6\u53D8\u66F4\uFF0C\u65E0\u6CD5\u4EE5\u6587\u672C Diff \u9884\u89C8\uFF08+", diff.additions, " \u2212", diff.deletions, "\uFF09"] })), diff !== undefined && !hasChange && !binaryLike && ((0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: "\u8BE5\u63D0\u4EA4\u5728\u6B64\u6587\u4EF6\u4E0A\u6CA1\u6709\u884C\u7EA7\u53D8\u66F4\u3002" })), diff !== undefined && hasChange && (0, jsx_runtime_1.jsx)(DiffBody, { diff: diff })] }));
  }
  function WorkingTreeChangesPanel({ changes, error, onClose, onOpenFile }) {
      const [view, setView] = (0, react_1.useState)('tree');
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.workingTreePanel, "data-working-tree-panel": true, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.workingTreeHeader, children: [(0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileViewerTitle, children: ["\u672A\u63D0\u4EA4\u53D8\u66F4", changes !== undefined ? ` (${changes.changes.length})` : ''] }), (0, jsx_runtime_1.jsx)(ViewToggle, { view: view, onChange: setView }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onClose, children: "\u5173\u95ED" })] }), error !== undefined && (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.error, role: "alert", children: ["\u8BFB\u53D6\u672A\u63D0\u4EA4\u53D8\u66F4\u5931\u8D25\uFF1A", error] }), changes === undefined && error === undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: "\u6B63\u5728\u8BFB\u53D6\u672A\u63D0\u4EA4\u53D8\u66F4\u2026" }), changes !== undefined && changes.changes.length === 0 && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: "\u5DE5\u4F5C\u533A\u6CA1\u6709\u672A\u63D0\u4EA4\u53D8\u66F4\u3002" }), changes !== undefined && changes.changes.length > 0 && ((0, jsx_runtime_1.jsx)(FileChangesView, { changes: changes.changes, view: view, onOpenFile: change => onOpenFile(change.newPath) }))] }));
  }
  function WorkingTreeFileViewer({ path, readWorkingTreeFile, onClose }) {
      const [diff, setDiff] = (0, react_1.useState)();
      const [error, setError] = (0, react_1.useState)();
      const [copied, setCopied] = (0, react_1.useState)(false);
      (0, react_1.useEffect)(() => {
          let cancelled = false;
          void readWorkingTreeFile({ path }).then(result => {
              if (cancelled)
                  return;
              if (result.ok)
                  setDiff(result.value);
              else
                  setError(result.error.message);
          }).catch((cause) => {
              if (!cancelled)
                  setError(cause instanceof Error ? cause.message : String(cause));
          });
          return () => { cancelled = true; };
      }, [path, readWorkingTreeFile]);
      const copyPath = async () => {
          if (typeof navigator === 'undefined' || navigator.clipboard === undefined)
              return;
          try {
              await navigator.clipboard.writeText(path);
              setCopied(true);
          }
          catch { /* clipboard is optional */ }
      };
      const hasChange = diff !== undefined && diff.lines.some(line => line.type !== 'context');
      const binaryLike = diff !== undefined && diff.lines.length === 0 && (diff.additions > 0 || diff.deletions > 0);
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileViewer, "data-working-tree-file-viewer": true, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileViewerHeader, children: [(0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileViewerTitle, children: [diff !== undefined && (0, jsx_runtime_1.jsx)(DiffStatusBadge, { status: diff.status }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.mono, children: path })] }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.fileViewerMeta, children: diff !== undefined && `工作区 · +${diff.additions} −${diff.deletions}` }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.linkButton, onClick: () => void copyPath(), children: copied ? '已复制' : '复制路径' }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onClose, children: "\u5173\u95ED" })] }), error !== undefined && (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.error, role: "alert", children: ["\u8BFB\u53D6\u5DE5\u4F5C\u533A\u6587\u4EF6 Diff \u5931\u8D25\uFF1A", error] }), diff === undefined && error === undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: "\u6B63\u5728\u8BFB\u53D6\u5DE5\u4F5C\u533A\u6587\u4EF6\u53D8\u66F4\u2026" }), diff !== undefined && !hasChange && binaryLike && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.pending, children: ["\u4E8C\u8FDB\u5236\u6587\u4EF6\u53D8\u66F4\uFF0C\u65E0\u6CD5\u4EE5\u6587\u672C Diff \u9884\u89C8\uFF08+", diff.additions, " \u2212", diff.deletions, "\uFF09"] })), diff !== undefined && !hasChange && !binaryLike && ((0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: "\u8BE5\u6587\u4EF6\u5728\u5DE5\u4F5C\u533A\u6CA1\u6709\u884C\u7EA7\u53D8\u66F4\u3002" })), diff !== undefined && hasChange && (0, jsx_runtime_1.jsx)(DiffBody, { diff: diff })] }));
  }
  function ComparePanel({ targetHash, commits, compare, onClose }) {
      const [baseHash, setBaseHash] = (0, react_1.useState)(commits[0]?.hash ?? '');
      const [result, setResult] = (0, react_1.useState)();
      const [error, setError] = (0, react_1.useState)();
      (0, react_1.useEffect)(() => {
          setResult(undefined);
          setError(undefined);
          if (baseHash.length === 0 || baseHash === targetHash)
              return;
          let cancelled = false;
          void compare({ baseHash, targetHash }).then(res => {
              if (cancelled)
                  return;
              if (res.ok)
                  setResult(res.value);
              else
                  setError(res.error.message);
          }).catch((cause) => {
              if (!cancelled)
                  setError(cause instanceof Error ? cause.message : String(cause));
          });
          return () => { cancelled = true; };
      }, [baseHash, targetHash, compare]);
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.comparePanel, "data-compare-panel": true, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.compareRow, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.fileViewerTitle, children: "\u63D0\u4EA4\u6BD4\u8F83" }), (0, jsx_runtime_1.jsx)("select", { className: `${styles_ts_1.css.select} ${styles_ts_1.css.selectWide}`, value: baseHash, onChange: event => setBaseHash(event.target.value), "aria-label": "\u6BD4\u8F83\u57FA\u51C6\u63D0\u4EA4", children: commits.map(commit => ((0, jsx_runtime_1.jsxs)("option", { value: commit.hash, children: [shortHash(commit.hash), " \u00B7 ", commit.subject || '(no subject)'] }, commit.hash))) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onClose, children: "\u5173\u95ED" })] }), baseHash === targetHash && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.compareHint, children: "\u8BF7\u9009\u62E9\u4E0D\u540C\u7684\u57FA\u51C6\u63D0\u4EA4\u3002" }), error !== undefined && (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.error, role: "alert", children: ["\u6BD4\u8F83\u5931\u8D25\uFF1A", error] }), result !== undefined && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileChanges, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileChangesHeader, children: ["\u53D8\u66F4\u6587\u4EF6 (", result.changes.length, ")"] }), result.changes.length === 0 && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.compareHint, children: "\u4E24\u4E2A\u63D0\u4EA4\u4E4B\u95F4\u6CA1\u6709\u6587\u4EF6\u53D8\u66F4\u3002" }), (0, jsx_runtime_1.jsx)("ul", { className: styles_ts_1.css.fileChangesList, children: result.changes.map((change, index) => ((0, jsx_runtime_1.jsxs)("li", { className: styles_ts_1.css.fileChange, children: [(0, jsx_runtime_1.jsx)(FileChangeStatus, { type: change.type }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.mono, title: change.newPath, children: change.newPath }), (0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileChangeStat, children: [(change.additions ?? 0) > 0 ? `+${change.additions}` : '', (change.deletions ?? 0) > 0 ? ` −${change.deletions}` : ''] })] }, `${change.type}-${change.oldPath}-${change.newPath}-${index}`))) })] }))] }));
  }
  function Avatar({ email, name }) {
      // Deterministic initial + colour avatar. It never requires the network, so a
      // failed/absent remote avatar can never block the graph or its details.
      const palette = ['#0085d9', '#d9008f', '#00a86b', '#d98500', '#7b4bc4', '#d9a800', '#008a7a'];
      let seed = 0;
      for (const char of email)
          seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
      const colour = palette[seed % palette.length];
      const initial = (name.trim().charAt(0) || '?').toLocaleUpperCase();
      return (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.avatar, style: { background: colour }, "aria-hidden": "true", children: initial });
  }
  function MetadataStrip({ metadata }) {
      if (metadata === undefined || (metadata.tags.length === 0 && metadata.stashes.length === 0)) {
          return (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.metadataStrip, children: "\u65E0\u6807\u7B7E\u4E0E\u6682\u5B58\u533A\u6761\u76EE" });
      }
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.metadataStrip, children: [metadata.tags.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.metadataGroup, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.metadataLabel, children: "\u6807\u7B7E" }), metadata.tags.map(tag => ((0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.metaTag, title: tag.annotated ? `${tag.detail?.objectHash ?? ''} · ${tag.detail?.tagger ?? ''}` : '轻量标签', children: [tag.name, tag.annotated ? ' ⚑' : ''] }, tag.name)))] })), metadata.stashes.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.metadataGroup, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.metadataLabel, children: "\u6682\u5B58" }), metadata.stashes.map(stash => ((0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.metaStash, title: `${stash.message} · ${stash.author}`, children: stash.selector }, stash.selector)))] }))] }));
  }
  function SettingsPanel({ settings, onChange, onClose }) {
      const toggle = (key) => onChange({ ...settings, [key]: !settings[key] });
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.settingsPanel, "data-settings-panel": true, children: [(0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.showDate, onChange: () => toggle('showDate') }), "\u663E\u793A\u65E5\u671F\u5217"] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.showAuthor, onChange: () => toggle('showAuthor') }), "\u663E\u793A\u4F5C\u8005\u5217"] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.showHash, onChange: () => toggle('showHash') }), "\u663E\u793A Hash \u5217"] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: ["\u65E5\u671F\u683C\u5F0F", (0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: settings.dateFormat, onChange: event => onChange({ ...settings, dateFormat: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "short", children: "\u7B80\u77ED" }), (0, jsx_runtime_1.jsx)("option", { value: "full", children: "\u5B8C\u6574" }), (0, jsx_runtime_1.jsx)("option", { value: "local", children: "\u672C\u5730\uFF08\u542B\u5468\u51E0\uFF09" })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: ["\u56FE\u6837\u5F0F", (0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: settings.graphStyle, onChange: event => onChange({ ...settings, graphStyle: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "full", children: "\u5B8C\u6574" }), (0, jsx_runtime_1.jsx)("option", { value: "compact", children: "\u7D27\u51D1" })] })] }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onClose, children: "\u5173\u95ED\u8BBE\u7F6E" })] }));
  }
  function FindBar({ count, index, onPrev, onNext, onClear }) {
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.findBar, "data-find-bar": true, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.findCount, children: count === 0 ? '无匹配' : `${index + 1}/${count}` }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onPrev, disabled: count === 0, children: "\u25C2 \u4E0A\u4E00\u4E2A" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onNext, disabled: count === 0, children: "\u4E0B\u4E00\u4E2A \u25B8" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onClear, children: "\u6E05\u9664" })] }));
  }
  function GitGraphView({ read, readCommit, readFileDiff, readWorkingTree, readWorkingTreeFile, compare, metadata }) {
      const [snapshot, setSnapshot] = (0, react_1.useState)();
      const [selectedHash, setSelectedHash] = (0, react_1.useState)();
      const [searchText, setSearchText] = (0, react_1.useState)('');
      // The emitted search reaches the Host (full-range); keep a debounced copy.
      const [search, setSearch] = (0, react_1.useState)('');
      const [refFilter, setRefFilter] = (0, react_1.useState)('all');
      const [maxCommits, setMaxCommits] = (0, react_1.useState)(PAGE_SIZE);
      const [includeAll, setIncludeAll] = (0, react_1.useState)(true);
      const [firstParent, setFirstParent] = (0, react_1.useState)(false);
      const [branchGlob, setBranchGlob] = (0, react_1.useState)('');
      const [sort, setSort] = (0, react_1.useState)('date');
      const [loading, setLoading] = (0, react_1.useState)(true);
      const [error, setError] = (0, react_1.useState)();
      const [viewingFile, setViewingFile] = (0, react_1.useState)();
      const [compareTarget, setCompareTarget] = (0, react_1.useState)();
      const [showWorkingTree, setShowWorkingTree] = (0, react_1.useState)(false);
      const [workingTreeChanges, setWorkingTreeChanges] = (0, react_1.useState)();
      const [workingTreeError, setWorkingTreeError] = (0, react_1.useState)();
      const [workingTreeFile, setWorkingTreeFile] = (0, react_1.useState)();
      const [repoMetadata, setRepoMetadata] = (0, react_1.useState)();
      const [display, setDisplay] = (0, react_1.useState)(settings_ts_1.DEFAULT_DISPLAY_SETTINGS);
      const [showSettings, setShowSettings] = (0, react_1.useState)(false);
      const [findOpen, setFindOpen] = (0, react_1.useState)(false);
      const [findText, setFindText] = (0, react_1.useState)('');
      const [findCase, setFindCase] = (0, react_1.useState)(false);
      const [findRegex, setFindRegex] = (0, react_1.useState)(false);
      const [findIndex, setFindIndex] = (0, react_1.useState)(0);
      const sectionRef = (0, react_1.useRef)(null);
      const inlineRef = (0, react_1.useRef)(null);
      const [inlineHeight, setInlineHeight] = (0, react_1.useState)(0);
      // Tracks the search text a full-range Host reload was last triggered with, so
      // the debounced search effect never re-fires from a `loading` toggle.
      const lastSearchedRef = (0, react_1.useRef)('');
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
      const buildRequest = (0, react_1.useCallback)((max, emittedSearch) => {
          const globs = branchGlob.split(',').map(item => item.trim()).filter(item => item.length > 0);
          return {
              maxCommits: max,
              ...(includeAll === true ? {} : { all: false }),
              ...(firstParent === true ? { firstParent: true } : {}),
              ...(globs.length > 0 ? { glob: globs } : {}),
              ...(emittedSearch.length > 0 ? { search: emittedSearch } : {}),
              sort,
          };
      }, [branchGlob, includeAll, firstParent, sort]);
      const refresh = (0, react_1.useCallback)(() => void load(buildRequest(maxCommits, search)), [load, buildRequest, maxCommits, search]);
      (0, react_1.useEffect)(() => {
          void load(buildRequest(PAGE_SIZE, ''));
          // Mount only.
      }, [load, buildRequest]);
      (0, react_1.useEffect)(() => {
          let cancelled = false;
          void metadata().then(result => {
              if (cancelled)
                  return;
              if (result.ok)
                  setRepoMetadata(result.value);
          }).catch(() => { });
          return () => { cancelled = true; };
      }, [metadata]);
      // Load the uncommitted-changes list when the working-tree panel is opened.
      (0, react_1.useEffect)(() => {
          if (!showWorkingTree)
              return;
          let cancelled = false;
          setWorkingTreeChanges(undefined);
          setWorkingTreeError(undefined);
          setWorkingTreeFile(undefined);
          void readWorkingTree().then(result => {
              if (cancelled)
                  return;
              if (result.ok)
                  setWorkingTreeChanges(result.value);
              else
                  setWorkingTreeError(result.error.message);
          }).catch((cause) => {
              if (!cancelled)
                  setWorkingTreeError(cause instanceof Error ? cause.message : String(cause));
          });
          return () => { cancelled = true; };
      }, [showWorkingTree, readWorkingTree]);
      (0, react_1.useEffect)(() => {
          // Debounce the emitted full-range search. A ref guard means a completed
          // load (which flips `loading`) never re-schedules another reload — without
          // it, every finished load would restart this debounce and loop forever.
          const text = searchText.trim();
          if (text === lastSearchedRef.current)
              return;
          const timer = setTimeout(() => {
              lastSearchedRef.current = text;
              setMaxCommits(PAGE_SIZE);
              void load(buildRequest(PAGE_SIZE, text));
          }, 350);
          return () => clearTimeout(timer);
      }, [searchText, load, buildRequest]);
      // Search changes trigger a full-range Host query; keep the debounced copy in
      // sync so the ordering of committed search vs scroll is stable.
      (0, react_1.useEffect)(() => {
          setSearch(searchText.trim());
      }, [searchText]);
      const visibleCommits = (0, react_1.useMemo)(() => {
          if (snapshot === undefined)
              return [];
          return snapshot.commits.filter(commit => refMatches(commit, refFilter));
      }, [refFilter, snapshot]);
      const layout = (0, react_1.useMemo)(() => (0, graph_layout_ts_1.layoutGraph)(visibleCommits), [visibleCommits]);
      const canLoadMore = snapshot !== undefined && snapshot.state === 'ready' && snapshot.hasMore;
      const hasGraphRows = snapshot !== undefined && (visibleCommits.length > 0 || snapshot.workingTree.changed);
      // Only one inline expansion is open at a time (like vscode-git-graph):
      // either the working-tree panel or a commit's details view.
      const selectCommit = (hash) => {
          if (hash === selectedHash) {
              setSelectedHash(undefined);
              return;
          }
          if (viewingFile !== undefined)
              setViewingFile(undefined);
          if (compareTarget !== undefined)
              setCompareTarget(undefined);
          setShowWorkingTree(false);
          setWorkingTreeFile(undefined);
          setSelectedHash(hash);
      };
      const toggleWorkingTree = () => {
          setViewingFile(undefined);
          setCompareTarget(undefined);
          setSelectedHash(undefined);
          setShowWorkingTree(current => !current);
      };
      // Layout row after which the inline expansion is inserted; the graph SVG
      // reserves this much vertical space so its lines stay aligned with rows.
      const expandedRow = showWorkingTree ? -1 : layout.nodes.find(node => node.commit.hash === selectedHash)?.row;
      // Measure the inline expansion (it grows as details/diffs stream in) so the
      // graph column can keep pace with the commit list column.
      (0, react_1.useLayoutEffect)(() => {
          const element = inlineRef.current;
          if (element === null) {
              setInlineHeight(0);
              return;
          }
          const update = () => setInlineHeight(element.offsetHeight);
          update();
          if (typeof ResizeObserver === 'undefined')
              return;
          const observer = new ResizeObserver(update);
          observer.observe(element);
          return () => observer.disconnect();
      }, [selectedHash, showWorkingTree]);
      const loadMore = () => {
          const nextMax = Math.min(MAX_COMMITS, maxCommits + PAGE_SIZE);
          setMaxCommits(nextMax);
          void load(buildRequest(nextMax, search));
      };
      // Load per-repository display settings once the graph path is known.
      (0, react_1.useEffect)(() => {
          if (snapshot === undefined || snapshot.path.length === 0)
              return;
          setDisplay((0, settings_ts_1.loadDisplaySettings)(snapshot.path));
      }, [snapshot?.path]);
      // Persist display settings scoped to the stable repository id; never touches
      // the Host query or any Git data.
      (0, react_1.useEffect)(() => {
          if (snapshot === undefined)
              return;
          (0, settings_ts_1.saveDisplaySettings)(snapshot.path, display);
      }, [display, snapshot?.path]);
      const findMatches = (0, react_1.useMemo)(() => {
          if (findText.length === 0 || findRegex) {
              return findText.length === 0
                  ? []
                  : visibleCommits.filter(commit => commitMatchesFind(commit, findText, findCase, true));
          }
          return visibleCommits.filter(commit => commitMatchesFind(commit, findText, findCase, false));
      }, [findText, findCase, findRegex, visibleCommits]);
      // Keep the active find index in range and sync the selection to the match.
      (0, react_1.useEffect)(() => {
          const count = findMatches.length;
          setFindIndex(current => {
              if (count === 0)
                  return 0;
              if (current >= count)
                  return 0;
              return current;
          });
      }, [findMatches.length]);
      (0, react_1.useEffect)(() => {
          const target = findMatches[findIndex];
          if (target !== undefined && target.hash !== selectedHash)
              setSelectedHash(target.hash);
      }, [findMatches, findIndex, selectedHash]);
      const findStep = (delta) => {
          const count = findMatches.length;
          if (count === 0)
              return;
          setFindIndex(current => (current + delta + count) % count);
      };
      // Keyboard navigation: ArrowUp/Down cycle rows, Home/H jump to HEAD, Cmd/Ctrl+F
      // focuses the Find Bar, and Cmd/Ctrl+S toggles the settings panel.
      (0, react_1.useEffect)(() => {
          const section = sectionRef.current;
          if (section === null)
              return;
          const onKeyDown = (event) => {
              if (event.target !== section && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement)) {
                  return;
              }
              if (findOpen || findText.length > 0)
                  return;
              const rows = visibleCommits;
              if (rows.length === 0)
                  return;
              const idx = rows.findIndex(commit => commit.hash === selectedHash);
              if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setSelectedHash(idx >= 0 ? (rows[idx + 1]?.hash ?? rows[0]?.hash) : rows[0]?.hash);
              }
              else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setSelectedHash(idx > 0 ? (rows[idx - 1]?.hash ?? rows[0]?.hash) : rows[0]?.hash);
              }
              else if (event.key.toLowerCase() === 'h') {
                  const head = rows.find(commit => commit.isHead);
                  if (head !== undefined)
                      setSelectedHash(head.hash);
              }
          };
          section.addEventListener('keydown', onKeyDown);
          return () => section.removeEventListener('keydown', onKeyDown);
      }, [visibleCommits, selectedHash, findOpen, findText]);
      // Global Cmd/Ctrl+F to open the Find Bar, Cmd/Ctrl+Shift+F to open settings.
      (0, react_1.useEffect)(() => {
          const onKeyDown = (event) => {
              if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
                  if (!event.shiftKey) {
                      event.preventDefault();
                      setFindOpen(true);
                      setFindIndex(0);
                  }
                  else {
                      event.preventDefault();
                      setShowSettings(current => !current);
                  }
              }
          };
          window.addEventListener('keydown', onKeyDown);
          return () => window.removeEventListener('keydown', onKeyDown);
      }, []);
      return ((0, jsx_runtime_1.jsxs)("section", { ref: sectionRef, className: styles_ts_1.css.card, "data-git-graph": true, "data-graph-style": display.graphStyle, children: [(0, jsx_runtime_1.jsxs)("header", { className: styles_ts_1.css.header, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.titleBlock, children: [(0, jsx_runtime_1.jsx)("strong", { children: "Git Graph" }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.path, children: snapshot?.path ?? '正在读取当前工作区…' })] }), snapshot !== undefined && (0, jsx_runtime_1.jsx)("span", { className: snapshot.workingTree.changed ? styles_ts_1.css.dirty : styles_ts_1.css.clean, children: snapshot.workingTree.summary })] }), (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.toolbar, role: "toolbar", "aria-label": "Git graph controls", children: [(0, jsx_runtime_1.jsx)("input", { className: styles_ts_1.css.search, type: "search", value: searchText, onChange: event => setSearchText(event.target.value), placeholder: "\u641C\u7D22\u63D0\u4EA4\u3001\u4F5C\u8005\u3001\u5F15\u7528\u6216\u65E5\u671F\uFF08\u5168\u8303\u56F4\uFF09", "aria-label": "Search commits" }), (0, jsx_runtime_1.jsx)("input", { className: styles_ts_1.css.search, type: "text", value: branchGlob, onChange: event => setBranchGlob(event.target.value), placeholder: "\u5206\u652F\u8FC7\u6EE4\uFF0C\u9017\u53F7\u5206\u9694\uFF08\u5982 main,release-*\uFF09", "aria-label": "Branch glob filter" }), (0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: refFilter, onChange: event => setRefFilter(event.target.value), "aria-label": "Filter references", children: [(0, jsx_runtime_1.jsx)("option", { value: "all", children: "\u5168\u90E8\u5F15\u7528" }), (0, jsx_runtime_1.jsx)("option", { value: "head", children: "\u672C\u5730\u5206\u652F" }), (0, jsx_runtime_1.jsx)("option", { value: "remote", children: "\u8FDC\u7A0B\u5206\u652F" }), (0, jsx_runtime_1.jsx)("option", { value: "tag", children: "\u6807\u7B7E" })] }), (0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: sort, onChange: event => setSort(event.target.value), "aria-label": "Commit order", children: [(0, jsx_runtime_1.jsx)("option", { value: "date", children: "\u65E5\u671F\u6392\u5E8F" }), (0, jsx_runtime_1.jsx)("option", { value: "author-date", children: "\u4F5C\u8005\u65E5\u671F\u6392\u5E8F" }), (0, jsx_runtime_1.jsx)("option", { value: "topological", children: "\u62D3\u6251\u6392\u5E8F" })] }), (0, jsx_runtime_1.jsxs)("label", { className: styles_ts_1.css.check, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: includeAll, onChange: event => setIncludeAll(event.target.checked) }), "\u5168\u90E8 refs"] }), (0, jsx_runtime_1.jsxs)("label", { className: styles_ts_1.css.check, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: firstParent, onChange: event => setFirstParent(event.target.checked) }), "\u4EC5\u9996\u7236\u63D0\u4EA4"] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: () => setFindOpen(current => !current), children: "\u67E5\u627E" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: () => setShowSettings(current => !current), children: "\u8BBE\u7F6E" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.primaryButton, onClick: refresh, disabled: loading, children: loading ? '读取中…' : '刷新' })] }), findOpen && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.findContainer, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.findInputRow, children: [(0, jsx_runtime_1.jsx)("input", { className: styles_ts_1.css.findInput, type: "search", value: findText, onChange: event => { setFindText(event.target.value); setFindIndex(0); }, placeholder: "\u5728\u5F53\u524D\u7ED3\u679C\u4E2D\u67E5\u627E\u63D0\u4EA4\u2026", autoFocus: true, "aria-label": "Find commits" }), (0, jsx_runtime_1.jsxs)("label", { className: styles_ts_1.css.check, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: findCase, onChange: event => setFindCase(event.target.checked) }), "\u533A\u5206\u5927\u5C0F\u5199"] }), (0, jsx_runtime_1.jsxs)("label", { className: styles_ts_1.css.check, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: findRegex, onChange: event => { setFindRegex(event.target.checked); setFindIndex(0); } }), "\u6B63\u5219"] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.primaryButton, onClick: () => setFindOpen(false), children: "\u5173\u95ED" })] }), (0, jsx_runtime_1.jsx)(FindBar, { count: findMatches.length, index: findMatches.length === 0 ? 0 : findIndex, onPrev: () => findStep(-1), onNext: () => findStep(1), onClear: () => { setFindText(''); setFindIndex(0); } })] })), showSettings && snapshot !== undefined && ((0, jsx_runtime_1.jsx)(SettingsPanel, { settings: display, onChange: setDisplay, onClose: () => setShowSettings(false) })), error !== undefined && (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.error, role: "alert", children: ["\u8BFB\u53D6 Git Graph \u5931\u8D25\uFF1A", error] }), loading && snapshot === undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: "\u6B63\u5728\u8BFB\u53D6 Git Graph\u2026" }), !loading && error === undefined && snapshot !== undefined && visibleCommits.length === 0 && !snapshot.workingTree.changed && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.pending, children: [snapshot.state === 'not-git' && '当前目录不是 Git 仓库。', snapshot.state === 'empty' && '当前是 Git 仓库，但还没有任何提交。', snapshot.state === 'ready' && '当前筛选条件没有匹配的提交。'] })), hasGraphRows && snapshot !== undefined && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.graphPanel, children: [(0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.graphHeader, children: "Graph" }), (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.commitHeader, "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("span", { children: "Description" }), display.showDate && (0, jsx_runtime_1.jsx)("span", { children: "Date" }), display.showAuthor && (0, jsx_runtime_1.jsx)("span", { children: "Author" }), display.showHash && (0, jsx_runtime_1.jsx)("span", { children: "Commit" })] }), (0, jsx_runtime_1.jsx)(GraphSvg, { layout: layout, workingTreeChanged: snapshot.workingTree.changed, selectedHash: selectedHash, gapAfterRow: expandedRow, gapHeight: inlineHeight, onSelect: selectCommit }), (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.commitList, children: [snapshot.workingTree.changed && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", className: styles_ts_1.css.workingTreeRow, title: "\u67E5\u770B\u672A\u63D0\u4EA4\u53D8\u66F4", onClick: toggleWorkingTree, "aria-expanded": showWorkingTree, children: [(0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.commitDescription, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.headDot }), "\u672A\u63D0\u4EA4\u53D8\u66F4"] }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.commitDate, children: "\u2014" }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.commitAuthor, children: "\u2014" }), (0, jsx_runtime_1.jsx)("span", { className: `${styles_ts_1.css.hash} ${styles_ts_1.css.commitHash}`, children: "WORKTREE" })] }), showWorkingTree && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.inlineDetails, ref: inlineRef, "data-inline-details": true, children: [(0, jsx_runtime_1.jsx)(WorkingTreeChangesPanel, { changes: workingTreeChanges, error: workingTreeError, onClose: () => setShowWorkingTree(false), onOpenFile: path => setWorkingTreeFile(path) }), workingTreeFile !== undefined && ((0, jsx_runtime_1.jsx)(WorkingTreeFileViewer, { path: workingTreeFile, readWorkingTreeFile: readWorkingTreeFile, onClose: () => setWorkingTreeFile(undefined) }))] }))] })), visibleCommits.map(commit => ((0, jsx_runtime_1.jsxs)(react_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(CommitRow, { commit: commit, selected: commit.hash === selectedHash, display: display, findActive: findMatches.length > 0 && findMatches.some(match => match.hash === commit.hash), onSelect: () => selectCommit(commit.hash) }), commit.hash === selectedHash && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.inlineDetails, ref: inlineRef, "data-inline-details": true, children: [(0, jsx_runtime_1.jsx)(CommitDetails, { commit: commit, readCommit: readCommit, compareActive: compareTarget === commit.hash, onCompare: () => setCompareTarget(compareTarget === commit.hash ? undefined : commit.hash), onOpenFile: (hash, path) => setViewingFile({ hash, path }) }), viewingFile !== undefined && viewingFile.hash === commit.hash && ((0, jsx_runtime_1.jsx)(FileViewer, { hash: viewingFile.hash, path: viewingFile.path, readFileDiff: readFileDiff, onClose: () => setViewingFile(undefined) })), compareTarget === commit.hash && ((0, jsx_runtime_1.jsx)(ComparePanel, { targetHash: commit.hash, commits: snapshot.commits, compare: compare, onClose: () => setCompareTarget(undefined) }))] }))] }, commit.hash)))] })] }), canLoadMore && (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.loadMore, onClick: loadMore, disabled: loading, children: loading ? '读取中…' : '加载更多提交' }), (0, jsx_runtime_1.jsx)(MetadataStrip, { metadata: repoMetadata })] }))] }));
  }

  }),
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.inject = void 0;
  exports.apply = apply;
  const typert_remote_client_ts_1 = require(2);
  const GitGraphView_tsx_1 = require(6);
  const styles_ts_1 = require(5);
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
          inject: sessionId => {
              const remote = async () => {
                  await remoteReady;
                  return ctx.get('remote.gitGraph');
              };
              return {
                  read: async (request) => (await remote()).read(sessionId, request),
                  readCommit: async (request) => (await remote()).readCommit(sessionId, request),
                  readFile: async (request) => (await remote()).readFile(sessionId, request),
                  readFileDiff: async (request) => (await remote()).readFileDiff(sessionId, request),
                  readWorkingTree: async () => (await remote()).readWorkingTree(sessionId, {}),
                  readWorkingTreeFile: async (request) => (await remote()).readWorkingTreeFile(sessionId, request),
                  compare: async (request) => (await remote()).compare(sessionId, request),
                  metadata: async () => (await remote()).metadata(sessionId, {}),
              };
          },
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
    return __r(7);
  }
});
