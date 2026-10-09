window.__ModuleLoader__.load({
  id: "dsh-git-graph",
  factory: (require) => {
    var cache = {};
    var factories = [
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MAX_AVATAR_BATCH = exports.MAX_COMMITS = void 0;
  /** Upper bound for persisted graph metadata in one tool result. */
  exports.MAX_COMMITS = 500;
  /** Avatar reads are bound to actual commit authors in the current workspace. */
  exports.MAX_AVATAR_BATCH = 24;

  }),
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.gitGraphDescriptors = exports.gitGraphMetadataInvocation = exports.gitGraphCompareInvocation = exports.gitGraphWorkingTreeFileInvocation = exports.gitGraphWorkingTreeInvocation = exports.gitGraphFileDiffInvocation = exports.gitGraphFileInvocation = exports.gitGraphReadCommitInvocation = exports.gitGraphInvocation = exports.gitGraphAvatarResultSchema = exports.gitGraphAvatarRequestSchema = exports.gitGraphEmptyInputSchema = exports.gitGraphMetadataSchema = exports.gitGraphCompareResultSchema = exports.gitGraphCompareRequestSchema = exports.gitGraphWorkingTreeFileRequestSchema = exports.gitGraphWorkingTreeChangesSchema = exports.gitGraphFileDiffSchema = exports.gitGraphFileContentSchema = exports.gitGraphFileRequestSchema = exports.gitGraphCommitDetailsSchema = exports.gitGraphCommitRequestSchema = exports.gitGraphSnapshotSchema = exports.gitGraphQuerySchema = exports.TYPERT_PACKAGE = void 0;
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
      rejectUnknown(object, ['hash', 'parents', 'author', 'email', 'date', 'committerDate', 'subject', 'refs', 'isHead'], path);
      return {
          hash: stringAt(object.hash, `${path}.hash`),
          parents: arrayAt(object.parents, `${path}.parents`).map((parent, index) => stringAt(parent, `${path}.parents[${index}]`)),
          author: stringAt(object.author, `${path}.author`),
          email: stringAt(object.email, `${path}.email`),
          date: stringAt(object.date, `${path}.date`),
          committerDate: stringAt(object.committerDate, `${path}.committerDate`),
          subject: stringAt(object.subject, `${path}.subject`),
          refs: arrayAt(object.refs, `${path}.refs`).map((ref, index) => parseRef(ref, `${path}.refs[${index}]`)),
          isHead: booleanAt(object.isHead, `${path}.isHead`),
      };
  }
  function parseInput(value) {
      const object = objectAt(value, '$');
      rejectUnknown(object, ['maxCommits', 'all', 'firstParent', 'glob', 'search', 'sort'], '$');
      const result = {};
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
      rejectUnknown(object, ['path', 'state', 'branch', 'head', 'remotes', 'workingTree', 'commits', 'hasMore'], '$');
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
          remotes: arrayAt(object.remotes, '$.remotes').map((remote, index) => stringAt(remote, `$.remotes[${index}]`)),
          workingTree: {
              changed: booleanAt(workingTree.changed, '$.workingTree.changed'),
              summary: stringAt(workingTree.summary, '$.workingTree.summary'),
          },
          commits: arrayAt(object.commits, '$.commits').map((commit, index) => parseCommit(commit, `$.commits[${index}]`)),
          hasMore: booleanAt(object.hasMore, '$.hasMore'),
      };
  }
  /** Strict wire schemas intentionally use only the Typert `.parse()` contract. */
  exports.gitGraphQuerySchema = { parse: parseInput };
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
      rejectUnknown(object, ['hash', 'path', 'oldPath', 'status', 'binary', 'additions', 'deletions', 'lines'], '$');
      const status = stringAt(object.status, '$.status');
      if (status !== 'A' && status !== 'M' && status !== 'D' && status !== 'R' && status !== 'U')
          fail('$.status', 'A, M, D, R, or U');
      return {
          hash: stringAt(object.hash, '$.hash'),
          path: stringAt(object.path, '$.path'),
          oldPath: stringAt(object.oldPath, '$.oldPath'),
          status,
          binary: booleanAt(object.binary, '$.binary'),
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
  exports.gitGraphAvatarRequestSchema = { parse(value) {
          const request = objectAt(value, '$');
          rejectUnknown(request, ['hashes', 'source'], '$');
          const hashes = arrayAt(request.hashes, '$.hashes').map((hash, index) => hashStringAt(hash, `$.hashes[${index}]`));
          if (hashes.length === 0 || hashes.length > domain_ts_1.MAX_AVATAR_BATCH)
              fail('$.hashes', '1 to 24 commit hashes');
          const source = stringAt(request.source, '$.source');
          if (source !== 'auto' && source !== 'gravatar')
              fail('$.source', 'auto or gravatar');
          return { hashes, source };
      } };
  exports.gitGraphAvatarResultSchema = { parse(value) {
          const result = objectAt(value, '$');
          rejectUnknown(result, ['avatars'], '$');
          const entries = arrayAt(result.avatars, '$.avatars');
          if (entries.length > domain_ts_1.MAX_AVATAR_BATCH)
              fail('$.avatars', 'at most 24 avatars');
          return { avatars: entries.map((entry, index) => {
                  const path = `$.avatars[${index}]`;
                  const avatar = objectAt(entry, path);
                  rejectUnknown(avatar, ['email', 'image', 'provider'], path);
                  const email = stringAt(avatar.email, `${path}.email`);
                  const image = nullableStringAt(avatar.image, `${path}.image`);
                  const provider = nullableStringAt(avatar.provider, `${path}.provider`);
                  if (email.length > 320)
                      fail(`${path}.email`, 'at most 320 characters');
                  if (image !== null && (image.length > 100000 || !/^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+=*$/u.test(image)))
                      fail(`${path}.image`, 'a bounded raster data URL');
                  if (provider !== null && provider !== 'github' && provider !== 'gravatar')
                      fail(`${path}.provider`, 'github, gravatar, or null');
                  if ((image === null) !== (provider === null))
                      fail(path, 'matching image and provider availability');
                  return { email, image, provider };
              }) };
      } };
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
                      create: () => spec.schemas.sessionId,
                  },
              },
              {
                  name: 'request',
                  wire: 'request',
                  source: 'json',
                  codec: {
                      mode: 'strict',
                      typeSymbol: `${exports.TYPERT_PACKAGE}#${spec.inputSymbol}`,
                      create: () => spec.schemas.input,
                  },
              },
          ],
          result: {
              mode: 'strict',
              typeSymbol: `${exports.TYPERT_PACKAGE}#${spec.resultSymbol}`,
              create: () => spec.schemas.result,
          },
      };
  }
  /** Client descriptors use the local parse-only schemas to keep the bundle closed. */
  exports.gitGraphInvocation = createGitGraphInvocation({
      method: 'read',
      inputSymbol: 'GitGraphQuery',
      resultSymbol: 'GitGraphSnapshot',
      schemas: { input: exports.gitGraphQuerySchema, result: exports.gitGraphSnapshotSchema, sessionId: sessionIdSchema },
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
      createGitGraphInvocation({
          method: 'avatars', inputSymbol: 'GitGraphAvatarRequest', resultSymbol: 'GitGraphAvatarResult',
          schemas: { input: exports.gitGraphAvatarRequestSchema, result: exports.gitGraphAvatarResultSchema, sessionId: sessionIdSchema },
      }),
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
  function addEdge(branch, from, to, lockedFirst, missingParent = false) {
      branch.edges.push({
          fromLane: from.lane,
          toLane: to.lane,
          row: from.row,
          colour: branch.colour,
          lockedFirst,
          missingParent,
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
      // A root is an endpoint, even when another unrelated history follows it.
      // Continuing its lane would suggest a parent relationship that does not exist.
      if (parent === undefined) {
          branchEnds[branch.colour] = startAt;
          return;
      }
      for (row = startAt + 1; row < vertices.length; row += 1) {
          const current = vertices[row];
          if (current === undefined)
              continue;
          const currentPoint = parent === current.id && current.branch !== undefined
              ? pointOf(current)
              : nextPointOf(current);
          addEdge(branch, lastPoint, currentPoint, lastPoint.lane < currentPoint.lane, parent === NULL_VERTEX);
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
  exports.DEFAULT_DISPLAY_SETTINGS = exports.COLUMN_LIMITS = void 0;
  exports.clampColumnWidth = clampColumnWidth;
  exports.stableRepoId = stableRepoId;
  exports.loadDisplaySettings = loadDisplaySettings;
  exports.saveDisplaySettings = saveDisplaySettings;
  /** Width bounds apply equally to persisted settings, pointer and keyboard input. */
  exports.COLUMN_LIMITS = {
      description: [180, 1200], date: [80, 360], author: [80, 480], hash: [76, 200],
  };
  function clampColumnWidth(column, width) {
      const [min, max] = exports.COLUMN_LIMITS[column];
      return Math.round(Math.min(max, Math.max(min, width)));
  }
  exports.DEFAULT_DISPLAY_SETTINGS = {
      showDate: true,
      showAuthor: true,
      showHash: true,
      dateFormat: 'short',
      graphStyle: 'full',
      lineStyle: 'curved',
      palette: 'classic',
      columnWidths: { description: 360, date: 112, author: 140, hash: 88 },
      fitDescription: true,
      referenceAlignment: 'normal',
      combineReferences: true,
      dateSource: 'author',
      richText: true,
      showAvatars: true,
      avatarSource: 'auto',
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
          const widths = parsed.columnWidths;
          const width = (column) => {
              const value = typeof widths === 'object' && widths !== null && column in widths ? Reflect.get(widths, column) : undefined;
              return typeof value === 'number' && Number.isFinite(value)
                  ? clampColumnWidth(column, value) : exports.DEFAULT_DISPLAY_SETTINGS.columnWidths[column];
          };
          return {
              showDate: bool(parsed.showDate, exports.DEFAULT_DISPLAY_SETTINGS.showDate),
              showAuthor: bool(parsed.showAuthor, exports.DEFAULT_DISPLAY_SETTINGS.showAuthor),
              showHash: bool(parsed.showHash, exports.DEFAULT_DISPLAY_SETTINGS.showHash),
              dateFormat,
              graphStyle,
              lineStyle: parsed.lineStyle === 'straight' ? 'straight' : 'curved',
              palette: parsed.palette === 'accessible' ? 'accessible' : 'classic',
              columnWidths: { description: width('description'), date: width('date'), author: width('author'), hash: width('hash') },
              fitDescription: bool(parsed.fitDescription, exports.DEFAULT_DISPLAY_SETTINGS.fitDescription),
              referenceAlignment: parsed.referenceAlignment === 'tags-right' || parsed.referenceAlignment === 'graph'
                  ? parsed.referenceAlignment : 'normal',
              combineReferences: bool(parsed.combineReferences, exports.DEFAULT_DISPLAY_SETTINGS.combineReferences),
              dateSource: parsed.dateSource === 'committer' ? 'committer' : 'author',
              richText: bool(parsed.richText, exports.DEFAULT_DISPLAY_SETTINGS.richText),
              showAvatars: bool(parsed.showAvatars, exports.DEFAULT_DISPLAY_SETTINGS.showAvatars),
              avatarSource: parsed.avatarSource === 'gravatar' ? 'gravatar' : 'auto',
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
  exports.graphRowHeight = graphRowHeight;
  exports.graphDisplayWidth = graphDisplayWidth;
  exports.visibleColumns = visibleColumns;
  exports.commitDate = commitDate;
  exports.referenceLabels = referenceLabels;
  exports.displayHunks = displayHunks;
  function graphRowHeight(settings) {
      return settings.graphStyle === 'compact' ? 28 : 36;
  }
  function graphDisplayWidth(laneCount) {
      return Math.max(64, 32 + Math.max(0, laneCount - 1) * 16 + 8);
  }
  function visibleColumns(settings) {
      return ['description', ...(settings.showDate ? ['date'] : []),
          ...(settings.showAuthor ? ['author'] : []), ...(settings.showHash ? ['hash'] : [])];
  }
  function commitDate(commit, source) {
      return source === 'committer' ? commit.committerDate : commit.date;
  }
  /** Combine labels only using real remote names and exact local branch matches. */
  function referenceLabels(refs, remotes, combine, currentBranch) {
      const labels = refs.filter(ref => ref.kind !== 'remote').map(ref => ({ ref, remotes: [] }));
      const local = new Map(labels.filter(label => label.ref.kind === 'head').map(label => [label.ref.name, label]));
      const remoteNames = [...remotes].sort((a, b) => b.length - a.length);
      for (const ref of refs.filter(ref => ref.kind === 'remote')) {
          const remote = remoteNames.find(name => ref.name.startsWith(`${name}/`));
          const target = combine && remote !== undefined ? local.get(ref.name.slice(remote.length + 1)) : undefined;
          if (target !== undefined)
              target.remotes.push(ref);
          else
              labels.push({ ref, remotes: [] });
      }
      const rank = (ref) => ref.kind === 'head' && ref.name === currentBranch ? -1 : ref.kind === 'head' ? 0 : ref.kind === 'remote' ? 1 : 2;
      return labels.sort((a, b) => rank(a.ref) - rank(b.ref) || a.ref.name.localeCompare(b.ref.name));
  }
  /** Reconstruct hunk ranges from actual line numbers, without interpreting content. */
  function displayHunks(lines) {
      const groups = [];
      let oldLast;
      let newLast;
      for (const line of lines) {
          const separated = (line.oldLine !== null && oldLast !== undefined && line.oldLine !== oldLast + 1)
              || (line.newLine !== null && newLast !== undefined && line.newLine !== newLast + 1);
          if (groups.length === 0 || separated) {
              groups.push([]);
              oldLast = undefined;
              newLast = undefined;
          }
          groups[groups.length - 1]?.push(line);
          if (line.oldLine !== null)
              oldLast = line.oldLine;
          if (line.newLine !== null)
              newLast = line.newLine;
      }
      return groups.map(group => {
          const oldLines = group.filter(line => line.oldLine !== null);
          const newLines = group.filter(line => line.newLine !== null);
          return { header: `@@ -${oldLines[0]?.oldLine ?? 0},${oldLines.length} +${newLines[0]?.newLine ?? 0},${newLines.length} @@`, lines: group };
      });
  }

  }),
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.avatarEmail = avatarEmail;
  exports.useAvatars = useAvatars;
  const react_1 = require("react");
  const domain_ts_1 = require(0);
  function avatarEmail(email) { return email.trim().toLowerCase(); }
  /** Keep photos while refreshing; the Host decides cache expiry and re-fetching. */
  function useAvatars(commits, repo, source, enabled, read) {
      const cache = (0, react_1.useRef)({ key: '', images: new Map() });
      const [images, setImages] = (0, react_1.useState)(cache.current.images);
      const [loading, setLoading] = (0, react_1.useState)(false);
      const [error, setError] = (0, react_1.useState)();
      (0, react_1.useEffect)(() => {
          const key = `${repo ?? ''}:${source}`;
          if (cache.current.key !== key) {
              cache.current = { key, images: new Map() };
              setImages(cache.current.images);
          }
          setError(undefined);
          setLoading(false);
          if (!enabled || repo === undefined)
              return;
          const authors = [...new Map(commits.map(commit => [avatarEmail(commit.email), commit])).values()];
          if (authors.length === 0)
              return;
          let cancelled = false;
          const controller = new AbortController();
          setLoading(true);
          void (async () => {
              try {
                  for (let start = 0; start < authors.length && !cancelled; start += domain_ts_1.MAX_AVATAR_BATCH) {
                      const result = await read({ hashes: authors.slice(start, start + domain_ts_1.MAX_AVATAR_BATCH).map(commit => commit.hash), source }, controller.signal);
                      if (cancelled)
                          return;
                      if (!result.ok)
                          throw new Error(result.error.message);
                      const next = new Map(cache.current.images);
                      for (const avatar of result.value.avatars)
                          next.set(avatarEmail(avatar.email), avatar);
                      while (next.size > 512) {
                          const oldest = next.keys().next().value;
                          if (oldest === undefined)
                              break;
                          next.delete(oldest);
                      }
                      cache.current.images = next;
                      setImages(next);
                  }
              }
              catch (cause) {
                  if (!cancelled)
                      setError(cause instanceof Error ? cause.message : String(cause));
              }
              finally {
                  if (!cancelled)
                      setLoading(false);
              }
          })();
          return () => { cancelled = true; controller.abort(); };
      }, [commits, repo, source, enabled, read]);
      return { images, loading, error };
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
   * tokens of the active Harness theme.
   */
  exports.css = {
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
  exports.messageTokens = messageTokens;
  exports.RichMessage = RichMessage;
  const jsx_runtime_1 = require("react/jsx-runtime");
  const react_1 = require("react");
  const styles_ts_1 = require(7);
  /** A bounded inline subset: the source is always text, never executable HTML. */
  function messageTokens(text) {
      const tokens = [];
      const pattern = /\\[\\*_`]|`([^`\n]+)`|\*\*([^\n]+?)\*\*|__([^\n]+?)__|\*([^*\n]+?)\*|(?<![\p{L}\p{N}])_([^_\n]+?)_(?![\p{L}\p{N}])|https?:\/\/[^\s<>`]+/gu;
      let start = 0;
      for (const match of text.matchAll(pattern)) {
          if (match.index > start)
              tokens.push({ kind: 'text', value: text.slice(start, match.index) });
          const raw = match[0];
          if (raw.startsWith('\\'))
              tokens.push({ kind: 'text', value: raw.slice(1) });
          else if (match[1] !== undefined)
              tokens.push({ kind: 'code', value: match[1] });
          else if (match[2] !== undefined || match[3] !== undefined)
              tokens.push({ kind: 'strong', value: match[2] ?? match[3] ?? '' });
          else if (match[4] !== undefined || match[5] !== undefined)
              tokens.push({ kind: 'em', value: match[4] ?? match[5] ?? '' });
          else {
              let url = raw.replace(/[.,;:!?]+$/u, '');
              // Keep balanced URL parentheses, but leave surrounding prose punctuation.
              for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
                  while (url.endsWith(close) && url.split(close).length > url.split(open).length)
                      url = url.slice(0, -1);
              }
              tokens.push({ kind: 'link', value: url });
              if (url.length < raw.length)
                  tokens.push({ kind: 'text', value: raw.slice(url.length) });
          }
          start = match.index + raw.length;
      }
      if (start < text.length)
          tokens.push({ kind: 'text', value: text.slice(start) });
      return tokens;
  }
  function inlineMessage(text, depth = 0) {
      if (depth >= 4)
          return text;
      return messageTokens(text).map((token, index) => {
          if (token.kind === 'link')
              return (0, jsx_runtime_1.jsx)("a", { href: token.value, target: "_blank", rel: "noopener noreferrer", children: token.value }, index);
          if (token.kind === 'code')
              return (0, jsx_runtime_1.jsx)("code", { children: token.value }, index);
          if (token.kind === 'strong')
              return (0, jsx_runtime_1.jsx)("strong", { children: inlineMessage(token.value, depth + 1) }, index);
          if (token.kind === 'em')
              return (0, jsx_runtime_1.jsx)("em", { children: inlineMessage(token.value, depth + 1) }, index);
          return (0, jsx_runtime_1.jsx)(react_1.Fragment, { children: token.value }, index);
      });
  }
  function RichMessage({ text, formatted }) {
      return (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.detailBody, "data-rich-message": formatted, children: formatted ? inlineMessage(text) : text });
  }

  }),
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.en = exports.zh = exports.NS = void 0;
  /** Typed copy shared by the sidebar entry and its nested Git panels. */
  exports.NS = 'gitGraph';
  exports.zh = {
      'common.unknown': '未知',
      'details.authorDate': '作者日期',
      'details.committerDate': '提交者日期',
      'details.key': '签名 Key ID',
      'details.copyKey': '复制签名 Key ID',
      'signature.G': '签名有效',
      'signature.U': '签名正确，信任状态未知',
      'signature.X': '签名正确，但签名已过期',
      'signature.Y': '签名正确，但密钥已过期',
      'signature.R': '签名使用已撤销的密钥',
      'signature.E': '无法验证签名',
      'signature.B': '签名无效',
      'settings.referenceAlignment': '引用对齐',
      'settings.refsNormal': '普通排列',
      'settings.refsTagsRight': '分支在左，Tag 在右',
      'settings.refsGraph': '分支靠图，Tag 在右',
      'settings.combineReferences': '合并同名本地与远端标签',
      'settings.dateSource': '日期来源',
      'settings.richText': '提交正文格式与链接',
      'settings.showAvatars': '获取真实作者头像',
      'settings.avatarSource': '头像来源',
      'settings.avatarAuto': '自动（GitHub / Gravatar）',
      'settings.avatarHint': '开启后访问外部头像服务；GitHub 使用原始作者邮箱查询公开提交，Gravatar 使用邮箱摘要，无图时保留首字母。',
      'avatar.source': '{provider} 作者头像',
      'avatar.error': '头像暂不可用，已保留首字母；刷新可重试。',
      'view.title': 'Git Graph',
      'guide.description': '查看提交、分支和文件变更',
      'common.close': '关闭',
      'common.copied': '已复制',
      'common.copyFailed': '复制失败，请重试',
      'common.retry': '重试',
      'common.copyHash': '复制 Hash',
      'common.copyPath': '复制路径',
      'common.noSubject': '（无提交主题）',
      'status.clean': '工作区干净',
      'status.dirty': '存在未提交变更',
      'status.notGit': '当前目录不是 Git 仓库。',
      'status.empty': '当前是 Git 仓库，但还没有任何提交。',
      'status.noMatches': '当前筛选条件没有匹配的提交。',
      'status.loadingWorkspace': '正在读取当前工作区…',
      'status.loadingGraph': '正在读取 Git Graph…',
      'error.graph': '读取 Git Graph 失败：{message}',
      'refs.aria': '引用',
      'refs.copy': '复制引用 {name}',
      'refs.current': '当前分支',
      'refs.showAll': '查看全部 {count} 个引用',
      'refs.filterHint': '仅显示已加载结果中带所选引用类型标签的提交；虚线表示父提交未加载或被筛选。',
      'refs.remoteHint': '远端跟踪引用来自本地记录，刷新不会执行 Fetch。',
      'graph.aria': 'Git 提交图',
      'graph.selectCommit': '选择提交 {hash} {subject}',
      'graph.head': '当前 HEAD',
      'file.status.A': '新增',
      'file.status.M': '修改',
      'file.status.D': '删除',
      'file.status.R': '重命名',
      'file.status.U': '冲突',
      'file.openDiff': '查看 Diff · {path}',
      'file.noStats': '无文本统计',
      'details.message': '提交说明',
      'graph.headUnavailable': 'HEAD 不在当前加载或筛选范围内。',
      'find.invalidRegex': '正则表达式无效',
      'file.viewMode': '切换文件视图',
      'file.list': '列表',
      'file.tree': '树',
      'details.select': '选择一条提交查看详情',
      'details.aria': '提交详情',
      'details.author': '作者',
      'details.date': '时间',
      'details.committer': '提交者',
      'details.signature': '签名',
      'details.signed': '签名 {status}',
      'details.unsigned': '未签名',
      'details.parents': '父提交',
      'details.root': '（根提交）',
      'details.refs': '引用',
      'details.loading': '正在读取提交详情…',
      'details.error': '读取详情失败：{message}',
      'details.files': '文件变更 ({count})',
      'diff.old': '旧',
      'diff.new': '新',
      'diff.content': '内容',
      'diff.error': '读取文件 Diff 失败：{message}',
      'diff.loading': '正在读取文件变更…',
      'diff.binary': '二进制文件变更，无法以文本 Diff 预览',
      'diff.noChanges': '该提交在此文件上没有行级变更。',
      'worktree.title': '未提交变更',
      'worktree.open': '查看未提交变更',
      'worktree.error': '读取未提交变更失败：{message}',
      'worktree.loading': '正在读取未提交变更…',
      'worktree.empty': '工作区没有未提交变更。',
      'worktree.label': '工作区',
      'worktree.diffError': '读取工作区文件 Diff 失败：{message}',
      'worktree.diffLoading': '正在读取工作区文件变更…',
      'worktree.noChanges': '该文件在工作区没有行级变更。',
      'compare.title': '提交比较',
      'compare.open': '比较提交…',
      'compare.close': '关闭比较',
      'compare.base': '比较基准提交',
      'compare.selectDifferent': '请选择不同的基准提交。',
      'compare.error': '比较失败：{message}',
      'compare.files': '变更文件 ({count})',
      'compare.empty': '两个提交之间没有文件变更。',
      'metadata.empty': '无标签与 Stash 条目',
      'metadata.loading': '正在读取标签与 Stash…',
      'metadata.error': '标签与 Stash 暂不可用：{message}',
      'metadata.tags': '标签',
      'metadata.stashes': 'Stash',
      'metadata.lightweight': '轻量标签',
      'settings.showDate': '显示日期列',
      'settings.showAuthor': '显示作者列',
      'settings.showHash': '显示 Hash 列',
      'settings.dateFormat': '日期格式',
      'settings.short': '简短',
      'settings.full': '完整',
      'settings.local': '本地（含周几）',
      'settings.graphStyle': '图样式',
      'settings.lineStyle': '连线样式',
      'settings.curved': '曲线',
      'settings.straight': '直线',
      'settings.palette': '泳道配色',
      'settings.classic': '经典',
      'settings.accessible': '易辨识',
      'settings.reset': '恢复默认显示',
      'column.resize': '调整{column}列宽（拖拽或方向键，双击恢复）',
      'settings.compact': '紧凑',
      'settings.close': '关闭设置',
      'find.noMatches': '无匹配',
      'find.previous': '◂ 上一个',
      'find.next': '下一个 ▸',
      'find.clear': '清除',
      'find.placeholder': '在当前结果中查找提交…',
      'find.aria': '查找提交',
      'find.case': '区分大小写',
      'find.regex': '正则',
      'toolbar.aria': 'Git 图谱控件',
      'toolbar.searchPlaceholder': '搜索提交、作者、引用或日期',
      'toolbar.search': '搜索提交',
      'toolbar.branchPlaceholder': '分支过滤，逗号分隔（如 main,release-*）',
      'toolbar.branch': '分支过滤',
      'toolbar.refFilter': '引用类型',
      'toolbar.allRefs': '全部引用',
      'toolbar.localBranches': '本地分支',
      'toolbar.remoteBranches': '远程分支',
      'toolbar.sort': '提交排序',
      'toolbar.sortDate': '日期排序',
      'toolbar.sortAuthorDate': '作者日期排序',
      'toolbar.sortTopological': '拓扑排序',
      'toolbar.includeAll': '全部 refs',
      'toolbar.firstParent': '仅首父提交',
      'toolbar.find': '查找',
      'toolbar.settings': '设置',
      'toolbar.loading': '读取中…',
      'toolbar.refresh': '刷新',
      'toolbar.loadMore': '加载更多提交',
      'column.graph': '图谱',
      'column.description': '提交说明',
      'column.date': '日期',
      'column.author': '作者',
      'column.commit': '提交',
  };
  /** English must cover every key in the Chinese dictionary. */
  exports.en = {
      'common.unknown': 'Unknown',
      'details.authorDate': 'Author date',
      'details.committerDate': 'Committer date',
      'details.key': 'Signature Key ID',
      'details.copyKey': 'Copy signature Key ID',
      'signature.G': 'Valid signature',
      'signature.U': 'Good signature; unknown trust',
      'signature.X': 'Good but expired signature',
      'signature.Y': 'Good signature; expired key',
      'signature.R': 'Signature made by a revoked key',
      'signature.E': 'Signature cannot be verified',
      'signature.B': 'Invalid signature',
      'settings.referenceAlignment': 'Reference alignment',
      'settings.refsNormal': 'Normal',
      'settings.refsTagsRight': 'Branches left, tags right',
      'settings.refsGraph': 'Branches by graph, tags right',
      'settings.combineReferences': 'Combine matching local and remote labels',
      'settings.dateSource': 'Date source',
      'settings.richText': 'Commit message formatting and links',
      'settings.showAvatars': 'Fetch real author avatars',
      'settings.avatarSource': 'Avatar source',
      'settings.avatarAuto': 'Automatic (GitHub / Gravatar)',
      'settings.avatarHint': 'Uses external avatar services: GitHub searches public commits by original author email; Gravatar uses an email hash. Initials remain when no image is available.',
      'avatar.source': '{provider} author avatar',
      'avatar.error': 'Avatars unavailable; initials remain. Refresh to retry.',
      'view.title': 'Git Graph',
      'guide.description': 'View commits, branches and file changes',
      'common.close': 'Close',
      'common.copied': 'Copied',
      'common.copyFailed': 'Copy failed; retry',
      'common.retry': 'Retry',
      'common.copyHash': 'Copy hash',
      'common.copyPath': 'Copy path',
      'common.noSubject': '(no subject)',
      'status.clean': 'Working tree clean',
      'status.dirty': 'Uncommitted changes',
      'status.notGit': 'The current directory is not a Git repository.',
      'status.empty': 'This Git repository has no commits yet.',
      'status.noMatches': 'No commits match the current filters.',
      'status.loadingWorkspace': 'Reading the current workspace…',
      'status.loadingGraph': 'Loading Git Graph…',
      'error.graph': 'Could not load Git Graph: {message}',
      'refs.aria': 'References',
      'refs.copy': 'Copy reference {name}',
      'refs.current': 'Current branch',
      'refs.showAll': 'View all {count} references',
      'refs.filterHint': 'Only loaded commits carrying this reference type are shown; dashed lines indicate unloaded or filtered parents.',
      'refs.remoteHint': 'Remote-tracking references are local records. Refresh does not fetch.',
      'graph.aria': 'Git commit graph',
      'graph.selectCommit': 'Select commit {hash} {subject}',
      'graph.head': 'Current HEAD',
      'file.status.A': 'Added',
      'file.status.M': 'Modified',
      'file.status.D': 'Deleted',
      'file.status.R': 'Renamed',
      'file.status.U': 'Conflicted',
      'file.openDiff': 'View diff · {path}',
      'file.noStats': 'No text statistics',
      'details.message': 'Commit message',
      'graph.headUnavailable': 'HEAD is outside the loaded or filtered results.',
      'find.invalidRegex': 'Invalid regular expression',
      'file.viewMode': 'File view mode',
      'file.list': 'List',
      'file.tree': 'Tree',
      'details.select': 'Select a commit to view its details',
      'details.aria': 'Commit details',
      'details.author': 'Author',
      'details.date': 'Date',
      'details.committer': 'Committer',
      'details.signature': 'Signature',
      'details.signed': 'Signature {status}',
      'details.unsigned': 'Unsigned',
      'details.parents': 'Parents',
      'details.root': '(root)',
      'details.refs': 'References',
      'details.loading': 'Loading commit details…',
      'details.error': 'Could not load details: {message}',
      'details.files': 'File changes ({count})',
      'diff.old': 'Old',
      'diff.new': 'New',
      'diff.content': 'Content',
      'diff.error': 'Could not load file diff: {message}',
      'diff.loading': 'Loading file changes…',
      'diff.binary': 'Binary file changes cannot be previewed as a text diff',
      'diff.noChanges': 'This commit has no line changes in this file.',
      'worktree.title': 'Uncommitted changes',
      'worktree.open': 'View uncommitted changes',
      'worktree.error': 'Could not load uncommitted changes: {message}',
      'worktree.loading': 'Loading uncommitted changes…',
      'worktree.empty': 'The working tree has no uncommitted changes.',
      'worktree.label': 'Working tree',
      'worktree.diffError': 'Could not load working-tree file diff: {message}',
      'worktree.diffLoading': 'Loading working-tree file changes…',
      'worktree.noChanges': 'This file has no line changes in the working tree.',
      'compare.title': 'Compare commits',
      'compare.open': 'Compare commit…',
      'compare.close': 'Close comparison',
      'compare.base': 'Base commit',
      'compare.selectDifferent': 'Select a different base commit.',
      'compare.error': 'Comparison failed: {message}',
      'compare.files': 'Changed files ({count})',
      'compare.empty': 'There are no file changes between these commits.',
      'metadata.empty': 'No tags or stash entries',
      'metadata.loading': 'Loading tags and stashes…',
      'metadata.error': 'Tags and stashes unavailable: {message}',
      'metadata.tags': 'Tags',
      'metadata.stashes': 'Stashes',
      'metadata.lightweight': 'Lightweight tag',
      'settings.showDate': 'Show date column',
      'settings.showAuthor': 'Show author column',
      'settings.showHash': 'Show hash column',
      'settings.dateFormat': 'Date format',
      'settings.short': 'Short',
      'settings.full': 'Full',
      'settings.local': 'Local (including weekday)',
      'settings.graphStyle': 'Graph style',
      'settings.lineStyle': 'Line style',
      'settings.curved': 'Curved',
      'settings.straight': 'Straight',
      'settings.palette': 'Lane colours',
      'settings.classic': 'Classic',
      'settings.accessible': 'Distinct',
      'settings.reset': 'Reset display defaults',
      'column.resize': 'Resize {column} column (drag or arrow keys; double-click to reset)',
      'settings.compact': 'Compact',
      'settings.close': 'Close settings',
      'find.noMatches': 'No matches',
      'find.previous': '◂ Previous',
      'find.next': 'Next ▸',
      'find.clear': 'Clear',
      'find.placeholder': 'Find commits in the current results…',
      'find.aria': 'Find commits',
      'find.case': 'Match case',
      'find.regex': 'Regex',
      'toolbar.aria': 'Git graph controls',
      'toolbar.searchPlaceholder': 'Search commits, authors, references or dates',
      'toolbar.search': 'Search commits',
      'toolbar.branchPlaceholder': 'Branch filters, comma separated (e.g. main,release-*)',
      'toolbar.branch': 'Branch glob filter',
      'toolbar.refFilter': 'Reference type',
      'toolbar.allRefs': 'All references',
      'toolbar.localBranches': 'Local branches',
      'toolbar.remoteBranches': 'Remote branches',
      'toolbar.sort': 'Commit order',
      'toolbar.sortDate': 'Date order',
      'toolbar.sortAuthorDate': 'Author date order',
      'toolbar.sortTopological': 'Topological order',
      'toolbar.includeAll': 'All refs',
      'toolbar.firstParent': 'First parent only',
      'toolbar.find': 'Find',
      'toolbar.settings': 'Settings',
      'toolbar.loading': 'Loading…',
      'toolbar.refresh': 'Refresh',
      'toolbar.loadMore': 'Load more commits',
      'column.graph': 'Graph',
      'column.description': 'Description',
      'column.date': 'Date',
      'column.author': 'Author',
      'column.commit': 'Commit',
  };

  }),
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.GitGraphView = GitGraphView;
  const jsx_runtime_1 = require("react/jsx-runtime");
  const react_1 = require("react");
  const graph_layout_ts_1 = require(3);
  const settings_ts_1 = require(4);
  const presentation_ts_1 = require(5);
  const avatars_ts_1 = require(6);
  const RichMessage_tsx_1 = require(8);
  const styles_ts_1 = require(7);
  const MAX_COMMITS = 500;
  const PAGE_SIZE = 100;
  const NO_COMMITS = [];
  /** Share the slot-owned translator with the nested detail and diff panels. */
  const TextContext = (0, react_1.createContext)(undefined);
  function useText() {
      const t = (0, react_1.useContext)(TextContext);
      if (t === undefined)
          throw new Error('Git Graph locale provider is missing');
      return t;
  }
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
  /** One clipboard behavior for hashes, paths and refs, including denied access. */
  function CopyButton({ value, label, className = styles_ts_1.css.secondaryButton, children, hint }) {
      const t = useText();
      const [state, setState] = (0, react_1.useState)('idle');
      (0, react_1.useEffect)(() => { setState('idle'); }, [value]);
      (0, react_1.useEffect)(() => {
          if (state === 'idle')
              return;
          const timer = setTimeout(() => setState('idle'), 2500);
          return () => clearTimeout(timer);
      }, [state]);
      return (0, jsx_runtime_1.jsx)("button", { type: "button", className: className, title: hint ?? `${label} · ${value}`, "aria-label": label, "data-copy-state": state, onClick: event => {
              event.stopPropagation();
              void (async () => {
                  try {
                      await navigator.clipboard.writeText(value);
                      setState('copied');
                  }
                  catch {
                      setState('failed');
                  }
              })();
          }, children: (0, jsx_runtime_1.jsx)("span", { "aria-live": "polite", children: state === 'copied' ? t('common.copied') : state === 'failed' ? t('common.copyFailed') : children ?? label }) });
  }
  function RefBadges({ refs, compact = false, currentBranch, onShowAll, remotes, combine }) {
      const t = useText();
      const ordered = (0, presentation_ts_1.referenceLabels)(refs, remotes, combine, currentBranch ?? null);
      const shown = compact ? ordered.slice(0, 1) : ordered;
      return refs.length === 0 ? null : ((0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.refs, "aria-label": t('refs.aria'), children: [shown.map(({ ref, remotes: joined }) => ((0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.ref, "data-kind": ref.kind, "data-combined": joined.length > 0, title: [ref.name, ...joined.map(remote => remote.name)].join('\n'), children: [(0, jsx_runtime_1.jsxs)(CopyButton, { value: ref.name, label: t('refs.copy', { name: ref.name }), className: styles_ts_1.css.refCopy, hint: `${ref.kind === 'remote' ? t('refs.remoteHint') : ref.kind === 'head' ? t('toolbar.localBranches') : t('metadata.tags')} · ${ref.name}${ref.kind === 'head' && ref.name === currentBranch ? ` · ${t('refs.current')}` : ''}`, children: [(0, jsx_runtime_1.jsx)("svg", { className: styles_ts_1.css.refIcon, viewBox: "0 0 16 16", "aria-hidden": "true", children: ref.kind === 'tag' ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M3 3h4.1L13 8.9 8.9 13 3 7.1V3Z", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }), (0, jsx_runtime_1.jsx)("circle", { cx: "5.2", cy: "5.2", r: "1", fill: "currentColor" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M5 4.4v7.2M5 8h3a2.5 2.5 0 0 1 2.5 2.5V12", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }), (0, jsx_runtime_1.jsx)("circle", { cx: "5", cy: "3", r: "1.7", fill: "currentColor" }), (0, jsx_runtime_1.jsx)("circle", { cx: "5", cy: "13", r: "1.7", fill: "currentColor" }), (0, jsx_runtime_1.jsx)("circle", { cx: "10.5", cy: "13", r: "1.7", fill: "currentColor" })] })) }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.refName, children: ref.name }), ref.kind === 'head' && ref.name === currentBranch && (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.currentBranch, children: t('refs.current') })] }), joined.map(remote => (0, jsx_runtime_1.jsx)(CopyButton, { value: remote.name, label: t('refs.copy', { name: remote.name }), className: styles_ts_1.css.remoteJoined, hint: `${t('refs.remoteHint')} · ${remote.name}`, children: remote.name.slice(0, -ref.name.length - 1) }, remote.name))] }, `${ref.kind}:${ref.name}`))), compact && ordered.length > shown.length && (0, jsx_runtime_1.jsxs)("button", { type: "button", className: styles_ts_1.css.refsMore, title: refs.map(ref => ref.name).join('\n'), "aria-label": t('refs.showAll', { count: refs.length }), onClick: event => { event.stopPropagation(); onShowAll?.(); }, children: ["+", ordered.length - shown.length] })] }));
  }
  function GraphSvg({ layout, workingTreeChanged, selectedHash, gapAfterRow, gapHeight, onSelect, rowHeight, lineStyle, palette, hoveredHash, onHover }) {
      const t = useText();
      const laneWidth = 16;
      const graphPadding = 16;
      const graphWidth = (0, presentation_ts_1.graphDisplayWidth)(layout.laneCount);
      const rowOffset = workingTreeChanged ? 1 : 0;
      const gap = gapAfterRow === undefined ? 0 : gapHeight;
      const graphHeight = Math.max(rowHeight, (layout.nodes.length + rowOffset) * rowHeight) + gap;
      const colours = palette === 'accessible' ? ['#0072b2', '#d55e00', '#009e73', '#cc79a7', '#e69f00', '#56b4e9'] : ['#0085d9', '#d9008f', '#00a86b', '#d98500', '#7b4bc4', '#e138e8', '#00a7a0', '#dc5b23', '#6f24d6', '#b38b00'];
      const headNode = layout.nodes.find(node => node.commit.isHead);
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
          if (lineStyle === 'straight')
              return `M ${x1} ${y1} L ${x2} ${y2}`;
          const span = y2 - y1;
          const curve = span > rowHeight * 1.5 ? span * 0.4 : rowHeight * 0.8;
          return `M ${x1} ${y1} C ${x1} ${y1 + curve}, ${x2} ${y2 - curve}, ${x2} ${y2}`;
      };
      return ((0, jsx_runtime_1.jsxs)("svg", { className: styles_ts_1.css.graph, width: graphWidth, height: graphHeight, viewBox: `0 0 ${graphWidth} ${graphHeight}`, role: "img", "aria-label": t('graph.aria'), children: [workingTreeChanged && headNode !== undefined && ((0, jsx_runtime_1.jsx)("path", { className: styles_ts_1.css.workingTreeEdge, d: `M ${pointX(0)} ${pointY(-1)} C ${pointX(0)} ${pointY(-1) + rowHeight * 0.8}, ${pointX(headNode.lane)} ${pointY(headNode.row) - rowHeight * 0.8}, ${pointX(headNode.lane)} ${pointY(headNode.row)}` })), layout.edges.map((edge, index) => {
                  const colour = colours[edge.colour % colours.length] ?? colours[0];
                  const path = pathForEdge(edge);
                  return ((0, jsx_runtime_1.jsxs)("g", { children: [(0, jsx_runtime_1.jsx)("path", { className: styles_ts_1.css.graphShadow, d: path }), (0, jsx_runtime_1.jsx)("path", { className: styles_ts_1.css.graphLine, d: path, stroke: colour, strokeDasharray: edge.missingParent ? '3 3' : undefined, "data-missing-parent": edge.missingParent })] }, `${edge.row}-${edge.fromLane}-${edge.toLane}-${edge.colour}-${index}`));
              }), layout.nodes.map(node => {
                  const x = pointX(node.lane);
                  const y = pointY(node.row);
                  const colour = colours[node.colour % colours.length] ?? colours[0];
                  const selected = node.commit.hash === selectedHash;
                  return ((0, jsx_runtime_1.jsxs)("g", { className: selected ? styles_ts_1.css.graphNodeSelected : styles_ts_1.css.graphNode, role: "button", tabIndex: 0, "aria-current": node.commit.isHead, "data-hovered": node.commit.hash === hoveredHash, onMouseEnter: () => onHover(node.commit.hash), onMouseLeave: () => onHover(undefined), "aria-label": t('graph.selectCommit', { hash: shortHash(node.commit.hash), subject: node.commit.subject }), onClick: () => onSelect(node.commit.hash), onKeyDown: event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onSelect(node.commit.hash);
                          }
                      }, children: [(0, jsx_runtime_1.jsx)("title", { children: `${shortHash(node.commit.hash)} ${node.commit.subject}` }), (0, jsx_runtime_1.jsx)("circle", { className: styles_ts_1.css.graphHitArea, cx: x, cy: y, r: 9 }), (0, jsx_runtime_1.jsx)("circle", { cx: x, cy: y, r: selected ? 5.5 : 4, fill: node.commit.isHead ? 'var(--git-graph-bg)' : colour, stroke: node.commit.isHead ? colour : 'var(--git-graph-bg)' })] }, node.commit.hash));
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
  /** Labels use the same row/gap geometry as the SVG and follow their own node. */
  function GraphReferenceLabels({ layout, workingTreeChanged, gapAfterRow, gapHeight, rowHeight, remotes, currentBranch, combine, onSelect }) {
      const offset = workingTreeChanged ? 1 : 0;
      return (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.graphRefs, style: { width: 'calc(var(--git-graph-svg-width) + var(--git-graph-ref-width))',
              height: (layout.nodes.length + offset) * rowHeight + (gapAfterRow === undefined ? 0 : gapHeight) }, "data-graph-reference-labels": true, children: layout.nodes.map(node => (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.graphRefRow, "data-ref-commit": node.commit.hash, style: { left: 30 + node.lane * 16, top: (node.row + offset) * rowHeight + (gapAfterRow !== undefined && node.row > gapAfterRow ? gapHeight : 0), height: rowHeight }, children: (0, jsx_runtime_1.jsx)(RefBadges, { refs: node.commit.refs.filter(ref => ref.kind !== 'tag'), compact: true, remotes: remotes, combine: combine, currentBranch: currentBranch, onShowAll: () => onSelect(node.commit.hash) }) }, node.commit.hash)) });
  }
  function CommitRow({ commit, selected, display, findActive, onSelect, onShowRefs, currentBranch, hovered, onHover, remotes, avatar }) {
      const t = useText();
      return ((0, jsx_runtime_1.jsxs)("div", { role: "button", tabIndex: 0, "data-commit-hash": commit.hash, "data-hovered": hovered, className: selected ? `${styles_ts_1.css.commit} ${styles_ts_1.css.commitSelected}` : styles_ts_1.css.commit, "aria-pressed": selected, onClick: onSelect, onMouseEnter: () => onHover(commit.hash), onMouseLeave: () => onHover(undefined), onKeyDown: event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              onSelect();
          } }, children: [(0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.commitDescription, children: [commit.isHead && (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.headDot, title: t('graph.head'), "aria-label": t('graph.head') }), (0, jsx_runtime_1.jsx)(Avatar, { email: commit.email, name: commit.author, avatar: avatar }), display.referenceAlignment !== 'graph' && (0, jsx_runtime_1.jsx)(RefBadges, { refs: display.referenceAlignment === 'normal' ? commit.refs : commit.refs.filter(ref => ref.kind !== 'tag'), compact: true, currentBranch: currentBranch, onShowAll: onShowRefs, remotes: remotes, combine: display.combineReferences }), (0, jsx_runtime_1.jsx)("span", { className: findActive ? `${styles_ts_1.css.subject} ${styles_ts_1.css.findHighlight}` : styles_ts_1.css.subject, title: commit.subject, children: commit.subject || t('common.noSubject') }), display.referenceAlignment !== 'normal' && (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.tagsRight, children: (0, jsx_runtime_1.jsx)(RefBadges, { refs: commit.refs.filter(ref => ref.kind === 'tag'), compact: true, currentBranch: currentBranch, onShowAll: onShowRefs, remotes: remotes, combine: false }) })] }), display.showDate && (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.commitDate, title: `${t(display.dateSource === 'author' ? 'details.authorDate' : 'details.committerDate')} · ${formatDate((0, presentation_ts_1.commitDate)(commit, display.dateSource))}`, children: formatDateValue((0, presentation_ts_1.commitDate)(commit, display.dateSource), display.dateFormat) }), display.showAuthor && (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.commitAuthor, title: `${commit.author} <${commit.email}>`, children: commit.author }), display.showHash && (0, jsx_runtime_1.jsx)("span", { className: `${styles_ts_1.css.hash} ${styles_ts_1.css.commitHash}`, title: commit.hash, children: shortHash(commit.hash) })] }));
  }
  function FileGlyph() {
      return ((0, jsx_runtime_1.jsxs)("svg", { className: styles_ts_1.css.fileGlyph, viewBox: "0 0 16 16", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("path", { d: "M4 1.8h4.8l3.2 3.2v9.2H4V1.8Z", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinejoin: "round" }), (0, jsx_runtime_1.jsx)("path", { d: "M8.8 1.8v3.2H12", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinejoin: "round" })] }));
  }
  function FolderGlyph({ open }) {
      return ((0, jsx_runtime_1.jsx)("svg", { className: styles_ts_1.css.fileGlyph, viewBox: "0 0 16 16", "aria-hidden": "true", children: open ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M1.8 3.2h4.2l1.6 1.8h6.6v2.2H1.8V3.2Z", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinejoin: "round" }), (0, jsx_runtime_1.jsx)("path", { d: "M1.8 7.2h12.4l-1.7 5.6H3.5L1.8 7.2Z", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinejoin: "round" })] })) : ((0, jsx_runtime_1.jsx)("path", { d: "M1.8 3.2h4.2l1.6 1.8h6.6v7.8H1.8V3.2Z", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinejoin: "round" })) }));
  }
  function FileChangeStatus({ type }) {
      const t = useText();
      const label = t(`file.status.${type}`);
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
      const t = useText();
      const textFile = change.additions !== null && change.additions !== undefined && change.deletions !== null && change.deletions !== undefined;
      const showStats = textFile;
      return ((0, jsx_runtime_1.jsxs)("li", { className: styles_ts_1.css.fileLeaf, children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", className: styles_ts_1.css.fileRecord, title: t('file.openDiff', { path: change.newPath }), onClick: () => onOpenFile(change), children: [(0, jsx_runtime_1.jsx)(FileGlyph, {}), (0, jsx_runtime_1.jsx)(FileChangeStatus, { type: change.type }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.fileName, "data-status": change.type, children: name }), change.type === 'R' && (0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.renamePath, title: `${change.oldPath} → ${change.newPath}`, children: [change.oldPath, " \u2192 ", change.newPath] }), !textFile && (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.fileChangeStat, children: t('file.noStats') }), showStats && ((0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileAddDel, children: ["(", (0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileAdd, children: ["+", change.additions] }), "|", (0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileDel, children: ["\u2212", change.deletions] }), ")"] }))] }), (0, jsx_runtime_1.jsx)(CopyButton, { value: change.newPath, label: t('common.copyPath'), className: styles_ts_1.css.fileCopy })] }));
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
      const t = useText();
      return ((0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.viewToggle, role: "group", "aria-label": t('file.viewMode'), children: [(0, jsx_runtime_1.jsx)("button", { type: "button", "aria-pressed": view === 'list', className: view === 'list' ? `${styles_ts_1.css.viewToggleBtn} ${styles_ts_1.css.viewToggleActive}` : styles_ts_1.css.viewToggleBtn, onClick: () => onChange('list'), children: t('file.list') }), (0, jsx_runtime_1.jsx)("button", { type: "button", "aria-pressed": view === 'tree', className: view === 'tree' ? `${styles_ts_1.css.viewToggleBtn} ${styles_ts_1.css.viewToggleActive}` : styles_ts_1.css.viewToggleBtn, onClick: () => onChange('tree'), children: t('file.tree') })] }));
  }
  /** Renders the changed-file area in either the flat list or the folder tree. */
  function FileChangesView({ changes, view, onOpenFile }) {
      return view === 'tree'
          ? (0, jsx_runtime_1.jsx)(FileTree, { changes: changes, onOpenFile: onOpenFile })
          : (0, jsx_runtime_1.jsx)(FlatFileList, { changes: changes, onOpenFile: onOpenFile });
  }
  function CommitDetails({ commit, readCommit, compareActive, onCompare, onOpenFile, currentBranch, remotes, display, avatar, readRevision }) {
      const t = useText();
      const [revision, setRevision] = (0, react_1.useState)(0);
      const [details, setDetails] = (0, react_1.useState)();
      const [detailsError, setDetailsError] = (0, react_1.useState)();
      const [view, setView] = (0, react_1.useState)('tree');
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
      }, [commit?.hash, readCommit, revision, readRevision]);
      if (commit === undefined)
          return (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.emptyDetails, children: t('details.select') });
      const signatureText = details?.signature
          ? `${t(`signature.${details.signature.status}`)}${details.signature.signer ? ` · ${details.signature.signer}` : ''}`
          : t('details.unsigned');
      return ((0, jsx_runtime_1.jsxs)("aside", { className: styles_ts_1.css.detailsPanel, "aria-label": t('details.aria'), children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.detailsHeading, children: [(0, jsx_runtime_1.jsx)("strong", { children: commit.subject || t('common.noSubject') }), (0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.detailsActions, children: [(0, jsx_runtime_1.jsx)(CopyButton, { value: commit.hash, label: t('common.copyHash') }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onCompare, children: compareActive ? t('compare.close') : t('compare.open') })] })] }), (0, jsx_runtime_1.jsxs)("dl", { className: styles_ts_1.css.detailsList, children: [(0, jsx_runtime_1.jsx)("dt", { children: "Hash" }), (0, jsx_runtime_1.jsx)("dd", { className: styles_ts_1.css.mono, children: commit.hash }), (0, jsx_runtime_1.jsx)("dt", { children: t('details.author') }), (0, jsx_runtime_1.jsxs)("dd", { children: [(0, jsx_runtime_1.jsx)(Avatar, { email: commit.email, name: commit.author, avatar: avatar }), " ", commit.author, " <", commit.email, ">"] }), (0, jsx_runtime_1.jsx)("dt", { children: t('details.authorDate') }), (0, jsx_runtime_1.jsx)("dd", { children: formatDate(commit.date) }), (0, jsx_runtime_1.jsx)("dt", { children: t('details.committerDate') }), (0, jsx_runtime_1.jsx)("dd", { children: formatDate(commit.committerDate) }), details !== undefined && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("dt", { children: t('details.committer') }), (0, jsx_runtime_1.jsxs)("dd", { children: [details.committer, " <", details.committerEmail, ">"] }), (0, jsx_runtime_1.jsx)("dt", { children: t('details.signature') }), (0, jsx_runtime_1.jsx)("dd", { title: signatureText, "data-signature-status": details.signature?.status, children: signatureText }), details.signature !== null && (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("dt", { children: t('details.key') }), (0, jsx_runtime_1.jsx)("dd", { className: styles_ts_1.css.mono, children: details.signature.key === null ? t('common.unknown')
                                              : (0, jsx_runtime_1.jsx)(CopyButton, { value: details.signature.key, label: t('details.copyKey'), className: styles_ts_1.css.linkButton, children: details.signature.key }) })] })] })), (0, jsx_runtime_1.jsx)("dt", { children: t('details.parents') }), (0, jsx_runtime_1.jsx)("dd", { className: styles_ts_1.css.mono, children: commit.parents.length === 0 ? t('details.root') : commit.parents.map(parent => (0, jsx_runtime_1.jsx)(CopyButton, { value: parent, label: t('common.copyHash'), className: styles_ts_1.css.linkButton, children: shortHash(parent) }, parent)) }), (0, jsx_runtime_1.jsx)("dt", { children: t('details.refs') }), (0, jsx_runtime_1.jsx)("dd", { children: (0, jsx_runtime_1.jsx)(RefBadges, { refs: commit.refs, currentBranch: currentBranch, remotes: remotes, combine: display.combineReferences }) })] }), details === undefined && detailsError === undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: t('details.loading') }), detailsError !== undefined && (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.error, role: "alert", children: [t('details.error', { message: detailsError }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: () => setRevision(current => current + 1), children: t('common.retry') })] }), details !== undefined && details.body.length > 0 && ((0, jsx_runtime_1.jsxs)("details", { className: styles_ts_1.css.message, open: details.body.length < 600 && details.body.split('\n').length <= 8, children: [(0, jsx_runtime_1.jsx)("summary", { children: t('details.message') }), (0, jsx_runtime_1.jsx)(RichMessage_tsx_1.RichMessage, { text: details.body, formatted: display.richText })] })), details !== undefined && details.fileChanges.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileChanges, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileChangesHeaderRow, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.fileChangesTitle, children: t('details.files', { count: details.fileChanges.length }) }), (0, jsx_runtime_1.jsx)(ViewToggle, { view: view, onChange: setView })] }), (0, jsx_runtime_1.jsx)(FileChangesView, { changes: details.fileChanges, view: view, onOpenFile: change => onOpenFile(commit.hash, change.newPath) })] }))] }));
  }
  function DiffStatusBadge({ status }) {
      return (0, jsx_runtime_1.jsx)(FileChangeStatus, { type: status });
  }
  /** Shared line-by-line diff table used by commit and working-tree file views. */
  function DiffBody({ diff }) {
      const t = useText();
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.diffViewer, "data-diff-viewer": true, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.diffHeader, "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffLineNo, children: t('diff.old') }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffLineNo, children: t('diff.new') }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffMarker }), (0, jsx_runtime_1.jsx)("span", { children: t('diff.content') })] }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.diffBody, children: (0, presentation_ts_1.displayHunks)(diff.lines).map((hunk, hunkIndex) => (0, jsx_runtime_1.jsxs)(react_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.hunkHeader, children: hunk.header }), hunk.lines.map((line, index) => ((0, jsx_runtime_1.jsxs)("div", { className: `${styles_ts_1.css.diffLine} ${line.type === 'added' ? styles_ts_1.css.diffAdded : line.type === 'removed' ? styles_ts_1.css.diffRemoved : styles_ts_1.css.diffContext}`, "data-diff-type": line.type, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffLineNo, children: line.oldLine ?? '' }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffLineNo, children: line.newLine ?? '' }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffMarker, children: line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' ' }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.diffContent, children: line.content })] }, index)))] }, hunkIndex)) })] }));
  }
  function FileViewer({ hash, path, readFileDiff, onClose }) {
      const t = useText();
      const [diff, setDiff] = (0, react_1.useState)();
      const [error, setError] = (0, react_1.useState)();
      const [revision, setRevision] = (0, react_1.useState)(0);
      (0, react_1.useEffect)(() => {
          let cancelled = false;
          setDiff(undefined);
          setError(undefined);
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
      }, [hash, path, readFileDiff, revision]);
      const hasChange = diff !== undefined && diff.lines.some(line => line.type !== 'context');
      const binaryLike = diff?.binary === true;
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileViewer, "data-file-viewer": true, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileViewerHeader, children: [(0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileViewerTitle, children: [diff !== undefined && (0, jsx_runtime_1.jsx)(DiffStatusBadge, { status: diff.status }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.mono, title: diff?.oldPath !== path ? `${diff?.oldPath ?? ''} → ${path}` : path, children: diff?.status === 'R' ? `${diff.oldPath} → ${path}` : path })] }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.fileViewerMeta, children: diff !== undefined && !diff.binary && `+${diff.additions} −${diff.deletions}` }), (0, jsx_runtime_1.jsx)(CopyButton, { value: path, label: t('common.copyPath') }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onClose, children: t('common.close') })] }), error !== undefined && (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.error, role: "alert", children: [t('diff.error', { message: error }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: () => setRevision(current => current + 1), children: t('common.retry') })] }), diff === undefined && error === undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: t('diff.loading') }), diff !== undefined && !hasChange && binaryLike && ((0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: t('diff.binary') })), diff !== undefined && !hasChange && !binaryLike && ((0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: t('diff.noChanges') })), diff !== undefined && hasChange && (0, jsx_runtime_1.jsx)(DiffBody, { diff: diff })] }));
  }
  function WorkingTreeChangesPanel({ changes, error, onClose, onOpenFile, onRetry }) {
      const t = useText();
      const [view, setView] = (0, react_1.useState)('tree');
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.workingTreePanel, "data-working-tree-panel": true, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.workingTreeHeader, children: [(0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileViewerTitle, children: [t('worktree.title'), changes !== undefined ? ` (${changes.changes.length})` : ''] }), (0, jsx_runtime_1.jsx)(ViewToggle, { view: view, onChange: setView }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onClose, children: t('common.close') })] }), error !== undefined && (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.error, role: "alert", children: [t('worktree.error', { message: error }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onRetry, children: t('common.retry') })] }), changes === undefined && error === undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: t('worktree.loading') }), changes !== undefined && changes.changes.length === 0 && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: t('worktree.empty') }), changes !== undefined && changes.changes.length > 0 && ((0, jsx_runtime_1.jsx)(FileChangesView, { changes: changes.changes, view: view, onOpenFile: change => onOpenFile(change.newPath) }))] }));
  }
  function WorkingTreeFileViewer({ path, readWorkingTreeFile, onClose }) {
      const t = useText();
      const [diff, setDiff] = (0, react_1.useState)();
      const [error, setError] = (0, react_1.useState)();
      const [revision, setRevision] = (0, react_1.useState)(0);
      (0, react_1.useEffect)(() => {
          let cancelled = false;
          setDiff(undefined);
          setError(undefined);
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
      }, [path, readWorkingTreeFile, revision]);
      const hasChange = diff !== undefined && diff.lines.some(line => line.type !== 'context');
      const binaryLike = diff?.binary === true;
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileViewer, "data-working-tree-file-viewer": true, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileViewerHeader, children: [(0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileViewerTitle, children: [diff !== undefined && (0, jsx_runtime_1.jsx)(DiffStatusBadge, { status: diff.status }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.mono, title: path, children: diff?.status === 'R' ? `${diff.oldPath} → ${path}` : path })] }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.fileViewerMeta, children: diff !== undefined && !diff.binary && `${t('worktree.label')} · +${diff.additions} −${diff.deletions}` }), (0, jsx_runtime_1.jsx)(CopyButton, { value: path, label: t('common.copyPath') }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onClose, children: t('common.close') })] }), error !== undefined && (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.error, role: "alert", children: [t('worktree.diffError', { message: error }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: () => setRevision(current => current + 1), children: t('common.retry') })] }), diff === undefined && error === undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: t('worktree.diffLoading') }), diff !== undefined && !hasChange && binaryLike && ((0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: t('diff.binary') })), diff !== undefined && !hasChange && !binaryLike && ((0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: t('worktree.noChanges') })), diff !== undefined && hasChange && (0, jsx_runtime_1.jsx)(DiffBody, { diff: diff })] }));
  }
  function ComparePanel({ targetHash, commits, compare, onClose }) {
      const t = useText();
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
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.comparePanel, "data-compare-panel": true, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.compareRow, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.fileViewerTitle, children: t('compare.title') }), (0, jsx_runtime_1.jsx)("select", { className: `${styles_ts_1.css.select} ${styles_ts_1.css.selectWide}`, value: baseHash, onChange: event => setBaseHash(event.target.value), "aria-label": t('compare.base'), children: commits.map(commit => ((0, jsx_runtime_1.jsxs)("option", { value: commit.hash, children: [shortHash(commit.hash), " \u00B7 ", commit.subject || t('common.noSubject')] }, commit.hash))) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onClose, children: t('common.close') })] }), baseHash === targetHash && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.compareHint, children: t('compare.selectDifferent') }), error !== undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.error, role: "alert", children: t('compare.error', { message: error }) }), result !== undefined && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.fileChanges, children: [(0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.fileChangesHeader, children: t('compare.files', { count: result.changes.length }) }), result.changes.length === 0 && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.compareHint, children: t('compare.empty') }), (0, jsx_runtime_1.jsx)("ul", { className: styles_ts_1.css.fileChangesList, children: result.changes.map((change, index) => ((0, jsx_runtime_1.jsxs)("li", { className: styles_ts_1.css.fileChange, children: [(0, jsx_runtime_1.jsx)(FileChangeStatus, { type: change.type }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.mono, title: change.newPath, children: change.newPath }), (0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.fileChangeStat, children: [(change.additions ?? 0) > 0 ? `+${change.additions}` : '', (change.deletions ?? 0) > 0 ? ` −${change.deletions}` : ''] })] }, `${change.type}-${change.oldPath}-${change.newPath}-${index}`))) })] }))] }));
  }
  function Avatar({ email, name, avatar }) {
      const t = useText();
      const [failed, setFailed] = (0, react_1.useState)(false);
      (0, react_1.useEffect)(() => setFailed(false), [avatar?.image]);
      // The deterministic initials remain visible while loading and after failure.
      const palette = ['#0085d9', '#d9008f', '#00a86b', '#d98500', '#7b4bc4', '#d9a800', '#008a7a'];
      let seed = 0;
      for (const char of email)
          seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
      const colour = palette[seed % palette.length];
      const initial = (name.trim().charAt(0) || '?').toLocaleUpperCase();
      const image = !failed && avatar?.image ? avatar.image : undefined;
      return (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.avatar, style: { background: colour }, "aria-hidden": "true", title: image === undefined ? name : t('avatar.source', { provider: avatar?.provider === 'github' ? 'GitHub' : 'Gravatar' }), "data-avatar-provider": image === undefined ? 'initials' : avatar?.provider, children: image === undefined ? initial : (0, jsx_runtime_1.jsx)("img", { src: image, alt: "", loading: "lazy", onError: () => setFailed(true) }) });
  }
  function MetadataStrip({ metadata, error, onRetry }) {
      const t = useText();
      if (error !== undefined)
          return (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.metadataStrip, role: "status", children: [t('metadata.error', { message: error }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.linkButton, onClick: onRetry, children: t('common.retry') })] });
      if (metadata === undefined)
          return (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.metadataStrip, children: t('metadata.loading') });
      if (metadata.tags.length === 0 && metadata.stashes.length === 0) {
          return (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.metadataStrip, children: t('metadata.empty') });
      }
      return ((0, jsx_runtime_1.jsxs)("details", { className: styles_ts_1.css.metadataStrip, children: [(0, jsx_runtime_1.jsxs)("summary", { children: [t('metadata.tags'), " (", metadata.tags.length, ") \u00B7 ", t('metadata.stashes'), " (", metadata.stashes.length, ")"] }), metadata.tags.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.metadataGroup, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.metadataLabel, children: t('metadata.tags') }), metadata.tags.map(tag => ((0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.metaTag, title: tag.annotated ? `${tag.detail?.objectHash ?? ''} · ${tag.detail?.tagger ?? ''}` : t('metadata.lightweight'), children: (0, jsx_runtime_1.jsxs)(CopyButton, { value: tag.name, label: t('refs.copy', { name: tag.name }), className: styles_ts_1.css.metaCopy, children: [tag.name, tag.annotated ? ' ⚑' : ''] }) }, tag.name)))] })), metadata.stashes.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.metadataGroup, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.metadataLabel, children: t('metadata.stashes') }), metadata.stashes.map(stash => ((0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.metaStash, title: `${stash.message} · ${stash.author}`, children: (0, jsx_runtime_1.jsx)(CopyButton, { value: stash.selector, label: t('refs.copy', { name: stash.selector }), className: styles_ts_1.css.metaCopy, children: stash.selector }) }, stash.selector)))] }))] }));
  }
  /** Pointer capture keeps a drag local and cleans up when this header unmounts. */
  function ColumnResizer({ column, width, onChange }) {
      const t = useText();
      const drag = (0, react_1.useRef)();
      const handleRef = (0, react_1.useRef)(null);
      const [actualWidth, setActualWidth] = (0, react_1.useState)(width);
      (0, react_1.useLayoutEffect)(() => {
          const cell = handleRef.current?.parentElement;
          if (cell === undefined || cell === null)
              return;
          const measure = () => setActualWidth(Math.round(cell.getBoundingClientRect().width));
          measure();
          const observer = new ResizeObserver(measure);
          observer.observe(cell);
          return () => observer.disconnect();
      }, [width]);
      const label = t(column === 'hash' ? 'column.commit' : `column.${column}`);
      return (0, jsx_runtime_1.jsx)("span", { ref: handleRef, className: styles_ts_1.css.columnResize, role: "separator", tabIndex: 0, "aria-orientation": "vertical", "aria-label": t('column.resize', { column: label }), title: t('column.resize', { column: label }), "aria-valuemin": settings_ts_1.COLUMN_LIMITS[column][0], "aria-valuemax": settings_ts_1.COLUMN_LIMITS[column][1], "aria-valuenow": actualWidth, onPointerDown: event => { event.preventDefault(); drag.current = { x: event.clientX, width: actualWidth }; event.currentTarget.setPointerCapture(event.pointerId); }, onPointerMove: event => { if (drag.current !== undefined)
              onChange(column, drag.current.width + event.clientX - drag.current.x); }, onPointerUp: event => { drag.current = undefined; event.currentTarget.releasePointerCapture(event.pointerId); }, onPointerCancel: () => { drag.current = undefined; }, onLostPointerCapture: () => { drag.current = undefined; }, onDoubleClick: () => onChange(column, settings_ts_1.DEFAULT_DISPLAY_SETTINGS.columnWidths[column]), onKeyDown: event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              event.stopPropagation();
              onChange(column, actualWidth + (event.key === 'ArrowRight' ? 10 : -10));
          } } });
  }
  function SettingsPanel({ settings, onChange, onClose }) {
      const t = useText();
      const toggle = (key) => onChange({ ...settings, [key]: !settings[key] });
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.settingsPanel, "data-settings-panel": true, children: [(0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [t('settings.referenceAlignment'), (0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: settings.referenceAlignment, onChange: event => onChange({ ...settings, referenceAlignment: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "normal", children: t('settings.refsNormal') }), (0, jsx_runtime_1.jsx)("option", { value: "tags-right", children: t('settings.refsTagsRight') }), (0, jsx_runtime_1.jsx)("option", { value: "graph", children: t('settings.refsGraph') })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.combineReferences, onChange: event => onChange({ ...settings, combineReferences: event.target.checked }) }), t('settings.combineReferences')] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [t('settings.dateSource'), (0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: settings.dateSource, onChange: event => onChange({ ...settings, dateSource: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "author", children: t('details.authorDate') }), (0, jsx_runtime_1.jsx)("option", { value: "committer", children: t('details.committerDate') })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.richText, onChange: event => onChange({ ...settings, richText: event.target.checked }) }), t('settings.richText')] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.showAvatars, onChange: event => onChange({ ...settings, showAvatars: event.target.checked }) }), t('settings.showAvatars')] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [t('settings.avatarSource'), (0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: settings.avatarSource, onChange: event => onChange({ ...settings, avatarSource: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "auto", children: t('settings.avatarAuto') }), (0, jsx_runtime_1.jsx)("option", { value: "gravatar", children: "Gravatar" })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsHint, children: t('settings.avatarHint') }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.showDate, onChange: () => toggle('showDate') }), t('settings.showDate')] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.showAuthor, onChange: () => toggle('showAuthor') }), t('settings.showAuthor')] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.showHash, onChange: () => toggle('showHash') }), t('settings.showHash')] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [t('settings.dateFormat'), (0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: settings.dateFormat, onChange: event => onChange({ ...settings, dateFormat: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "short", children: t('settings.short') }), (0, jsx_runtime_1.jsx)("option", { value: "full", children: t('settings.full') }), (0, jsx_runtime_1.jsx)("option", { value: "local", children: t('settings.local') })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [t('settings.graphStyle'), (0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: settings.graphStyle, onChange: event => onChange({ ...settings, graphStyle: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "full", children: t('settings.full') }), (0, jsx_runtime_1.jsx)("option", { value: "compact", children: t('settings.compact') })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [t('settings.lineStyle'), (0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: settings.lineStyle, onChange: event => onChange({ ...settings, lineStyle: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "curved", children: t('settings.curved') }), (0, jsx_runtime_1.jsx)("option", { value: "straight", children: t('settings.straight') })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.settingsField, children: (0, jsx_runtime_1.jsxs)("label", { children: [t('settings.palette'), (0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: settings.palette, onChange: event => onChange({ ...settings, palette: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "classic", children: t('settings.classic') }), (0, jsx_runtime_1.jsx)("option", { value: "accessible", children: t('settings.accessible') })] })] }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: () => onChange(settings_ts_1.DEFAULT_DISPLAY_SETTINGS), children: t('settings.reset') }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onClose, children: t('settings.close') })] }));
  }
  function FindBar({ count, index, onPrev, onNext, onClear }) {
      const t = useText();
      return ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.findBar, "data-find-bar": true, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.findCount, children: count === 0 ? t('find.noMatches') : `${index + 1}/${count}` }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onPrev, disabled: count === 0, children: t('find.previous') }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onNext, disabled: count === 0, children: t('find.next') }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: onClear, children: t('find.clear') })] }));
  }
  function GitGraphView(props) {
      return (0, jsx_runtime_1.jsx)(TextContext.Provider, { value: props.t, children: (0, jsx_runtime_1.jsx)(GitGraphContent, { ...props }) });
  }
  function GitGraphContent({ read, readCommit, readFileDiff, readWorkingTree, readWorkingTreeFile, compare, metadata, avatars: readAvatars }) {
      const t = useText();
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
      const [metadataError, setMetadataError] = (0, react_1.useState)();
      const [readRevision, setReadRevision] = (0, react_1.useState)(0);
      const [display, setDisplay] = (0, react_1.useState)(settings_ts_1.DEFAULT_DISPLAY_SETTINGS);
      const [showSettings, setShowSettings] = (0, react_1.useState)(false);
      const [findOpen, setFindOpen] = (0, react_1.useState)(false);
      const [findText, setFindText] = (0, react_1.useState)('');
      const [findCase, setFindCase] = (0, react_1.useState)(false);
      const [findRegex, setFindRegex] = (0, react_1.useState)(false);
      const [findIndex, setFindIndex] = (0, react_1.useState)(0);
      const [hoveredHash, setHoveredHash] = (0, react_1.useState)();
      const [navigationHint, setNavigationHint] = (0, react_1.useState)();
      const sectionRef = (0, react_1.useRef)(null);
      const panelRef = (0, react_1.useRef)(null);
      const [settingsRepo, setSettingsRepo] = (0, react_1.useState)();
      const inlineRef = (0, react_1.useRef)(null);
      const [inlineHeight, setInlineHeight] = (0, react_1.useState)(0);
      // Only the newest query may replace the graph, including after unmount.
      const querySequence = (0, react_1.useRef)(0);
      const loadedPath = (0, react_1.useRef)();
      const authorAvatars = (0, avatars_ts_1.useAvatars)(snapshot?.commits ?? NO_COMMITS, snapshot?.path, display.avatarSource, display.showAvatars && settingsRepo === snapshot?.path, readAvatars);
      const findError = (0, react_1.useMemo)(() => {
          if (!findRegex || findText.length === 0)
              return undefined;
          try {
              new RegExp(findText);
              return undefined;
          }
          catch {
              return t('find.invalidRegex');
          }
      }, [findRegex, findText, t]);
      const load = (0, react_1.useCallback)(async (request) => {
          const sequence = ++querySequence.current;
          setLoading(true);
          setError(undefined);
          try {
              const result = await read(request);
              if (sequence !== querySequence.current)
                  return;
              if (!result.ok)
                  throw new Error(result.error.message);
              const firstRead = loadedPath.current !== result.value.path;
              loadedPath.current = result.value.path;
              setSnapshot(result.value);
              // Undefined can mean the user is reading the working tree or has closed
              // details. Refresh must preserve that choice, rather than open row one.
              setSelectedHash(current => result.value.commits.some(commit => commit.hash === current)
                  ? current : firstRead ? result.value.commits[0]?.hash : undefined);
          }
          catch (cause) {
              if (sequence === querySequence.current)
                  setError(cause instanceof Error ? cause.message : String(cause));
          }
          finally {
              if (sequence === querySequence.current)
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
      const refresh = (0, react_1.useCallback)(() => {
          setReadRevision(current => current + 1);
          void load(buildRequest(maxCommits, search));
      }, [load, buildRequest, maxCommits, search]);
      (0, react_1.useEffect)(() => {
          void load(buildRequest(maxCommits, search));
      }, [load, buildRequest, maxCommits, search]);
      (0, react_1.useEffect)(() => () => { querySequence.current += 1; }, [read]);
      (0, react_1.useEffect)(() => {
          let cancelled = false;
          setRepoMetadata(undefined);
          setMetadataError(undefined);
          void metadata().then(result => {
              if (cancelled)
                  return;
              if (result.ok)
                  setRepoMetadata(result.value);
              else
                  setMetadataError(result.error.message);
          }).catch((cause) => { if (!cancelled)
              setMetadataError(cause instanceof Error ? cause.message : String(cause)); });
          return () => { cancelled = true; };
      }, [metadata, readRevision]);
      // Load the uncommitted-changes list when the working-tree panel is opened.
      (0, react_1.useEffect)(() => {
          if (!showWorkingTree)
              return;
          let cancelled = false;
          setWorkingTreeChanges(undefined);
          setWorkingTreeError(undefined);
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
      }, [showWorkingTree, readWorkingTree, readRevision]);
      // Debounce only text; sorting and branch filters preserve the emitted query.
      (0, react_1.useEffect)(() => {
          const timer = setTimeout(() => {
              setSearch(searchText.trim());
              setMaxCommits(PAGE_SIZE);
          }, 350);
          return () => clearTimeout(timer);
      }, [searchText]);
      const visibleCommits = (0, react_1.useMemo)(() => {
          if (snapshot === undefined)
              return [];
          return snapshot.commits.filter(commit => refMatches(commit, refFilter));
      }, [refFilter, snapshot]);
      const layout = (0, react_1.useMemo)(() => (0, graph_layout_ts_1.layoutGraph)(visibleCommits), [visibleCommits]);
      const canLoadMore = snapshot !== undefined && snapshot.state === 'ready' && snapshot.hasMore && maxCommits < MAX_COMMITS;
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
      }, [selectedHash, showWorkingTree, expandedRow, snapshot?.workingTree.changed]);
      const loadMore = () => {
          const nextMax = Math.min(MAX_COMMITS, maxCommits + PAGE_SIZE);
          setMaxCommits(nextMax);
      };
      // Load per-repository display settings once the graph path is known.
      (0, react_1.useEffect)(() => {
          if (snapshot === undefined || snapshot.path.length === 0)
              return;
          setDisplay((0, settings_ts_1.loadDisplaySettings)(snapshot.path));
          setSettingsRepo(snapshot.path);
      }, [snapshot?.path]);
      // Persist display settings scoped to the stable repository id; never touches
      // the Host query or any Git data.
      (0, react_1.useEffect)(() => {
          if (snapshot === undefined || settingsRepo !== snapshot.path)
              return;
          (0, settings_ts_1.saveDisplaySettings)(snapshot.path, display);
      }, [display, snapshot?.path, settingsRepo]);
      // Scroll only on a new selection, not on every query response or diff resize.
      // Moving this panel alone avoids scrolling the surrounding DSH conversation.
      (0, react_1.useLayoutEffect)(() => {
          if (selectedHash === undefined)
              return;
          setShowWorkingTree(false);
          setViewingFile(undefined);
          setCompareTarget(undefined);
          setWorkingTreeFile(undefined);
          setNavigationHint(undefined);
          const panel = panelRef.current;
          const row = panel?.querySelector(`[data-commit-hash="${selectedHash}"]`);
          if (panel === null || row === undefined || row === null)
              return;
          const bounds = panel.getBoundingClientRect();
          const target = row.getBoundingClientRect();
          const top = bounds.top + 36;
          if (target.top < top)
              panel.scrollTop += target.top - top;
          else if (target.bottom > bounds.bottom)
              panel.scrollTop += target.bottom - bounds.bottom;
      }, [selectedHash]);
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
      // Shortcuts belong to this page; never intercept typing in another DSH pane.
      (0, react_1.useEffect)(() => {
          const section = sectionRef.current;
          if (section === null)
              return;
          const onKeyDown = (event) => {
              if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
                  event.preventDefault();
                  if (event.shiftKey)
                      setShowSettings(current => !current);
                  else {
                      setFindOpen(true);
                      setFindIndex(0);
                  }
                  return;
              }
              const target = event.target;
              if (target instanceof HTMLElement && target.closest('input, select, textarea, [contenteditable="true"], [role="separator"]') !== null)
                  return;
              if (findOpen || findText.length > 0)
                  return;
              if (event.key.toLowerCase() === 'h') {
                  const head = visibleCommits.find(commit => commit.isHead);
                  if (head !== undefined)
                      setSelectedHash(head.hash);
                  else
                      setNavigationHint(t('graph.headUnavailable'));
                  return;
              }
              if (visibleCommits.length === 0)
                  return;
              const index = visibleCommits.findIndex(commit => commit.hash === selectedHash);
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  const nextIndex = event.key === 'ArrowDown' ? (index + 1) % visibleCommits.length : Math.max(0, index - 1);
                  setSelectedHash(visibleCommits[nextIndex]?.hash);
              }
          };
          section.addEventListener('keydown', onKeyDown);
          return () => section.removeEventListener('keydown', onKeyDown);
      }, [visibleCommits, selectedHash, findOpen, findText, t]);
      // Share the exact column definition with the header, commits and worktree row.
      const columns = (0, presentation_ts_1.visibleColumns)(display);
      const rowHeight = (0, presentation_ts_1.graphRowHeight)(display);
      const rowMin = columns.reduce((sum, column) => sum + display.columnWidths[column], 12 + (columns.length - 1) * 8);
      const resizeColumn = (column, width) => setDisplay(current => ({ ...current,
          fitDescription: column === 'description' ? false : current.fitDescription,
          columnWidths: { ...current.columnWidths, [column]: (0, settings_ts_1.clampColumnWidth)(column, width) } }));
      const extraGraphWidth = display.referenceAlignment === 'graph' ? 160 : 0;
      const columnStyle = {
          '--git-graph-columns': columns.map(column => column === 'description' && display.fitDescription ? `minmax(${display.columnWidths[column]}px, 1fr)` : `${display.columnWidths[column]}px`).join(' '),
          '--git-graph-row-min': `${rowMin}px`,
          '--git-graph-row-height': `${rowHeight}px`,
          '--git-graph-svg-width': `${(0, presentation_ts_1.graphDisplayWidth)(layout.laneCount) + 8}px`,
          '--git-graph-ref-width': `${extraGraphWidth}px`,
      };
      const selectedCommit = visibleCommits.find(commit => commit.hash === selectedHash);
      const expansion = showWorkingTree ? (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(WorkingTreeChangesPanel, { changes: workingTreeChanges, error: workingTreeError, onRetry: refresh, onClose: () => setShowWorkingTree(false), onOpenFile: path => setWorkingTreeFile(path) }), workingTreeFile !== undefined && (0, jsx_runtime_1.jsx)(WorkingTreeFileViewer, { path: workingTreeFile, readWorkingTreeFile: readWorkingTreeFile, onClose: () => setWorkingTreeFile(undefined) }, `${workingTreeFile}:${readRevision}`)] }) : selectedCommit === undefined || snapshot === undefined ? null : (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(CommitDetails, { currentBranch: snapshot.branch, remotes: snapshot.remotes, display: display, readRevision: readRevision, avatar: display.showAvatars ? authorAvatars.images.get((0, avatars_ts_1.avatarEmail)(selectedCommit.email)) : undefined, commit: selectedCommit, readCommit: readCommit, compareActive: compareTarget === selectedCommit.hash, onCompare: () => setCompareTarget(compareTarget === selectedCommit.hash ? undefined : selectedCommit.hash), onOpenFile: (hash, path) => setViewingFile({ hash, path }) }, selectedCommit.hash), viewingFile !== undefined && viewingFile.hash === selectedCommit.hash && (0, jsx_runtime_1.jsx)(FileViewer, { hash: viewingFile.hash, path: viewingFile.path, readFileDiff: readFileDiff, onClose: () => setViewingFile(undefined) }), compareTarget === selectedCommit.hash && (0, jsx_runtime_1.jsx)(ComparePanel, { targetHash: selectedCommit.hash, commits: snapshot.commits, compare: compare, onClose: () => setCompareTarget(undefined) })] });
      return ((0, jsx_runtime_1.jsxs)("section", { ref: sectionRef, tabIndex: 0, "aria-label": t('view.title'), "aria-busy": loading, style: columnStyle, className: styles_ts_1.css.card, "data-git-graph": true, "data-graph-style": display.graphStyle, "data-ref-alignment": display.referenceAlignment, "data-avatar-loading": authorAvatars.loading, children: [(0, jsx_runtime_1.jsxs)("header", { className: styles_ts_1.css.header, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.titleBlock, children: [(0, jsx_runtime_1.jsx)("strong", { children: t('view.title') }), (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.path, title: snapshot?.path, children: snapshot?.path ?? t('status.loadingWorkspace') })] }), snapshot !== undefined && (0, jsx_runtime_1.jsx)("span", { className: snapshot.workingTree.changed ? styles_ts_1.css.dirty : styles_ts_1.css.clean, children: snapshot.state === 'not-git' ? t('status.notGit') : snapshot.workingTree.changed ? t('status.dirty') : t('status.clean') })] }), (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.toolbar, role: "toolbar", "aria-label": t('toolbar.aria'), children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.toolbarGroup, children: [(0, jsx_runtime_1.jsx)("input", { className: styles_ts_1.css.search, type: "search", value: searchText, onChange: event => setSearchText(event.target.value), placeholder: t('toolbar.searchPlaceholder'), "aria-label": t('toolbar.search') }), (0, jsx_runtime_1.jsx)("input", { className: styles_ts_1.css.search, type: "text", value: branchGlob, onChange: event => setBranchGlob(event.target.value), placeholder: t('toolbar.branchPlaceholder'), "aria-label": t('toolbar.branch') })] }), (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.toolbarGroup, children: [(0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: refFilter, onChange: event => setRefFilter(event.target.value), "aria-label": t('toolbar.refFilter'), children: [(0, jsx_runtime_1.jsx)("option", { value: "all", children: t('toolbar.allRefs') }), (0, jsx_runtime_1.jsx)("option", { value: "head", children: t('toolbar.localBranches') }), (0, jsx_runtime_1.jsx)("option", { value: "remote", children: t('toolbar.remoteBranches') }), (0, jsx_runtime_1.jsx)("option", { value: "tag", children: t('metadata.tags') })] }), (0, jsx_runtime_1.jsxs)("select", { className: styles_ts_1.css.select, value: sort, onChange: event => setSort(event.target.value), "aria-label": t('toolbar.sort'), children: [(0, jsx_runtime_1.jsx)("option", { value: "date", children: t('toolbar.sortDate') }), (0, jsx_runtime_1.jsx)("option", { value: "author-date", children: t('toolbar.sortAuthorDate') }), (0, jsx_runtime_1.jsx)("option", { value: "topological", children: t('toolbar.sortTopological') })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.toolbarGroup, children: [(0, jsx_runtime_1.jsxs)("label", { className: styles_ts_1.css.check, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: includeAll, onChange: event => setIncludeAll(event.target.checked) }), t('toolbar.includeAll')] }), (0, jsx_runtime_1.jsxs)("label", { className: styles_ts_1.css.check, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: firstParent, onChange: event => setFirstParent(event.target.checked) }), t('toolbar.firstParent')] })] }), (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.toolbarActions, children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: () => setFindOpen(current => !current), children: t('toolbar.find') }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: () => setShowSettings(current => !current), children: t('toolbar.settings') }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.primaryButton, onClick: refresh, disabled: loading, children: loading ? t('toolbar.loading') : t('toolbar.refresh') })] })] }), refFilter !== 'all' && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.hint, role: "status", children: t('refs.filterHint') }), refFilter === 'remote' && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.hint, children: t('refs.remoteHint') }), findOpen && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.findContainer, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.findInputRow, children: [(0, jsx_runtime_1.jsx)("input", { className: styles_ts_1.css.findInput, type: "search", value: findText, onChange: event => { setFindText(event.target.value); setFindIndex(0); }, placeholder: t('find.placeholder'), autoFocus: true, "aria-label": t('find.aria') }), (0, jsx_runtime_1.jsxs)("label", { className: styles_ts_1.css.check, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: findCase, onChange: event => setFindCase(event.target.checked) }), t('find.case')] }), (0, jsx_runtime_1.jsxs)("label", { className: styles_ts_1.css.check, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: findRegex, onChange: event => { setFindRegex(event.target.checked); setFindIndex(0); } }), t('find.regex')] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.primaryButton, onClick: () => setFindOpen(false), children: t('common.close') })] }), (0, jsx_runtime_1.jsx)(FindBar, { count: findMatches.length, index: findMatches.length === 0 ? 0 : findIndex, onPrev: () => findStep(-1), onNext: () => findStep(1), onClear: () => { setFindText(''); setFindIndex(0); } }), findError !== undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.error, role: "alert", children: findError })] })), showSettings && snapshot !== undefined && ((0, jsx_runtime_1.jsx)(SettingsPanel, { settings: display, onChange: setDisplay, onClose: () => setShowSettings(false) })), error !== undefined && (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.error, role: "alert", children: [t('error.graph', { message: error }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.secondaryButton, onClick: refresh, disabled: loading, children: t('common.retry') })] }), navigationHint !== undefined && (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.hint, role: "status", children: [navigationHint, (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.linkButton, onClick: () => setNavigationHint(undefined), children: t('common.close') })] }), display.showAvatars && authorAvatars.error !== undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.hint, role: "status", children: t('avatar.error') }), loading && snapshot === undefined && (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.pending, children: t('status.loadingGraph') }), !loading && error === undefined && snapshot !== undefined && visibleCommits.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.pending, children: [snapshot.state === 'not-git' && t('status.notGit'), snapshot.state === 'empty' && t('status.empty'), snapshot.state === 'ready' && t('status.noMatches')] })), hasGraphRows && snapshot !== undefined && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.graphPanel, ref: panelRef, children: [(0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.graphHeader, children: t('column.graph') }), (0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.commitHeader, children: columns.map(column => (0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.headerCell, children: [t(column === 'date' ? display.dateSource === 'author' ? 'details.authorDate' : 'details.committerDate' : column === 'hash' ? 'column.commit' : `column.${column}`), (0, jsx_runtime_1.jsx)(ColumnResizer, { column: column, width: display.columnWidths[column], onChange: resizeColumn })] }, column)) }), (0, jsx_runtime_1.jsx)(GraphSvg, { layout: layout, workingTreeChanged: snapshot.workingTree.changed, selectedHash: selectedHash, gapAfterRow: expandedRow, gapHeight: inlineHeight, onSelect: selectCommit, rowHeight: rowHeight, lineStyle: display.lineStyle, palette: display.palette, hoveredHash: hoveredHash, onHover: setHoveredHash }), display.referenceAlignment === 'graph' && (0, jsx_runtime_1.jsx)(GraphReferenceLabels, { layout: layout, workingTreeChanged: snapshot.workingTree.changed, gapAfterRow: expandedRow, gapHeight: inlineHeight, rowHeight: rowHeight, remotes: snapshot.remotes, currentBranch: snapshot.branch, combine: display.combineReferences, onSelect: setSelectedHash }), (0, jsx_runtime_1.jsxs)("div", { className: styles_ts_1.css.commitList, children: [snapshot.workingTree.changed && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", className: styles_ts_1.css.workingTreeRow, title: t('worktree.open'), onClick: toggleWorkingTree, "aria-expanded": showWorkingTree, children: [(0, jsx_runtime_1.jsxs)("span", { className: styles_ts_1.css.commitDescription, children: [(0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.headDot }), t('worktree.title')] }), display.showDate && (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.commitDate, children: "\u2014" }), display.showAuthor && (0, jsx_runtime_1.jsx)("span", { className: styles_ts_1.css.commitAuthor, children: "\u2014" }), display.showHash && (0, jsx_runtime_1.jsx)("span", { className: `${styles_ts_1.css.hash} ${styles_ts_1.css.commitHash}`, children: "WORKTREE" })] }), showWorkingTree && ((0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.inlineDetails, ref: inlineRef, "data-inline-details": true, children: expansion }))] })), visibleCommits.map(commit => ((0, jsx_runtime_1.jsxs)(react_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(CommitRow, { commit: commit, selected: commit.hash === selectedHash, display: display, findActive: findMatches.length > 0 && findMatches.some(match => match.hash === commit.hash), onSelect: () => selectCommit(commit.hash), currentBranch: snapshot.branch, hovered: hoveredHash === commit.hash, onHover: setHoveredHash, onShowRefs: () => setSelectedHash(commit.hash), remotes: snapshot.remotes, avatar: display.showAvatars ? authorAvatars.images.get((0, avatars_ts_1.avatarEmail)(commit.email)) : undefined }), commit.hash === selectedHash && ((0, jsx_runtime_1.jsx)("div", { className: styles_ts_1.css.inlineDetails, ref: inlineRef, "data-inline-details": true, children: expansion }))] }, commit.hash)))] })] }), canLoadMore && (0, jsx_runtime_1.jsx)("button", { type: "button", className: styles_ts_1.css.loadMore, onClick: loadMore, disabled: loading, children: loading ? t('toolbar.loading') : t('toolbar.loadMore') }), (0, jsx_runtime_1.jsx)(MetadataStrip, { metadata: repoMetadata, error: metadataError, onRetry: refresh })] }))] }));
  }

  }),
  (function (module, exports, require) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.inject = void 0;
  exports.apply = apply;
  const typert_remote_client_ts_1 = require(2);
  const GitGraphView_tsx_1 = require(10);
  const styles_ts_1 = require(7);
  const locales_ts_1 = require(9);
  exports.inject = ['remote', 'slots', 'locale', 'sidebarRightTabs'];
  function apply(ctx) {
      ctx.effect(styles_ts_1.installGitGraphStyles);
      ctx.effect(() => ctx.locale.register(locales_ts_1.NS, { zh: locales_ts_1.zh, en: locales_ts_1.en }), 'git-graph dictionaries');
      const t = ctx.locale.bind(locales_ts_1.NS);
      const remoteReady = ctx.remote.$mount(typert_remote_client_ts_1.TYPERT_REMOTE);
      ctx.effect(() => remoteReady, 'git-graph remote');
      ctx.effect(() => ctx.sidebarRightTabs.register({
          id: 'dsh-git-graph',
          kind: 'git-graph',
          title: () => t('view.title'),
          guide: [{ id: 'git-graph', order: 20, title: () => t('view.title'), description: () => t('guide.description') }],
      }), 'git-graph tab type');
      ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab',
          key: 'dsh-git-graph',
          locale: locales_ts_1.NS,
          inject: (sessionId) => {
              const remote = async () => {
                  await remoteReady;
                  return ctx.get('remote.gitGraph');
              };
              return {
                  avatars: async (request, signal) => (await remote()).avatars(sessionId, request, signal),
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
      }, GitGraphView_tsx_1.GitGraphView)), 'git-graph tab body');
      console.info('[git-graph] Native sidebar registered');
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
    return __r(11);
  }
});
