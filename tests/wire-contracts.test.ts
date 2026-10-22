import { describe, expect, it } from 'vitest'
import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol'
import { gitGraphHostDescriptors } from '../src/typert.host.ts'
import { gitGraphDescriptors } from '../src/typert.shared.ts'
import { MAX_BRANCH_FILTER } from '../src/domain.ts'

const hash = 'a'.repeat(40)
const other = 'b'.repeat(40)
const change = { type: 'T', oldPath: 'file', newPath: 'file', additions: 1, deletions: 1 }
const diff = { hash, path: 'file', oldPath: 'file', status: 'T', binary: false, additions: 1, deletions: 1, lines: [] }
const snapshot = { path: '/repo', state: 'ready', branch: 'main', head: hash, remotes: [], branches: [{ name: 'main', kind: 'local', hash, isCurrent: true }], workingTree: { changed: true, summary: 'changed' }, commits: [], hasMore: false, searchTruncated: true }
const cases: ReadonlyArray<{ method: string; request: unknown; result: unknown }> = [
  { method: 'read', request: { branches: ['main'], glob: ['ram[!a]'] }, result: snapshot },
  { method: 'avatars', request: { hashes: [hash], source: 'auto' }, result: { avatars: [{ email: 'a@example.com', provider: 'host', image: 'data:image/png;base64,AAAA' }] } },
  { method: 'readCommit', request: { hash }, result: { hash, parents: [], author: 'A', authorEmail: 'a@example.com', committer: 'A', committerEmail: 'a@example.com', timestamps: { authorDate: '', committerDate: '' }, signature: null, body: '', fileChanges: [change] } },
  { method: 'readFile', request: { hash, path: 'file' }, result: { hash, path: 'file', kind: 'text', text: '中文\n', size: 7, truncated: false } },
  { method: 'readFileDiff', request: { hash, path: 'file', baseHash: other }, result: diff },
  { method: 'readWorkingTree', request: {}, result: { changes: [change] } },
  { method: 'readWorkingTreeFile', request: { path: 'file' }, result: diff },
  { method: 'compare', request: { baseHash: other, targetHash: hash }, result: { baseHash: other, targetHash: hash, changes: [change] } },
  { method: 'metadata', request: {}, result: { tags: [], stashes: [] } },
]

function descriptor(list: readonly InvocationDescriptor[], method: string): InvocationDescriptor {
  const value = list.find(entry => entry.method === method)
  if (value === undefined) throw new Error(`Missing ${method}`)
  return value
}

describe('Host / Client contract parity', () => {
  for (const sample of cases) {
    it(`validates ${sample.method} through the actual request and result codecs`, () => {
      const host = descriptor(gitGraphHostDescriptors, sample.method)
      const client = descriptor(gitGraphDescriptors, sample.method)
      for (const invocation of [host, client]) {
        expect(invocation.cancellation).toEqual({ parameter: 'signal' })
        const request = invocation.parameters.find(parameter => parameter.wire === 'request')?.codec
        if (request?.mode !== 'strict' || invocation.result.mode !== 'strict') throw new Error('Strict codecs required')
        expect(request.create().parse(sample.request)).toEqual(sample.request)
        expect(() => request.create().parse({ ...sample.request as object, unsupported: true })).toThrow()
        expect(invocation.result.encode?.(sample.result, () => null)).toEqual(sample.result)
        expect(invocation.result.decode?.(sample.result)).toEqual(sample.result)
        expect(() => invocation.result.mode === 'strict' && invocation.result.encode?.({ ...sample.result as object, unsupported: true }, () => null)).toThrow()
        expect(() => invocation.result.mode === 'strict' && invocation.result.decode?.({ ...sample.result as object, unsupported: true })).toThrow()
      }
    })
  }

  it('rejects incomplete snapshots and oversized filters on both faces', () => {
    for (const list of [gitGraphHostDescriptors, gitGraphDescriptors]) {
      const read = descriptor(list, 'read')
      const codec = read.parameters.find(parameter => parameter.wire === 'request')?.codec
      if (codec?.mode !== 'strict' || read.result.mode !== 'strict') throw new Error('Strict codecs required')
      for (const key of ['glob', 'branches']) expect(() => codec.create().parse({ [key]: Array(MAX_BRANCH_FILTER + 1).fill('main') })).toThrow()
      for (const key of ['branches', 'searchTruncated']) {
        const incomplete: Record<string, unknown> = { ...snapshot }
        delete incomplete[key]
        expect(() => read.result.mode === 'strict' && read.result.create().parse(incomplete)).toThrow()
      }
    }
  })
})
