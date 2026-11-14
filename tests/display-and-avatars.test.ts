import { describe, expect, it, vi } from 'vitest'
import { AvatarStore, gitHostOrigin } from '../src/avatars.ts'
import { layoutGraph } from '../src/client/graph-layout.ts'
import { DEFAULT_DISPLAY_SETTINGS, loadDisplaySettings, saveDisplaySettings } from '../src/client/settings.ts'
import type { GitGraphCommit } from '../src/domain.ts'

describe('graph rendering data and storage', () => {
  it('keeps merge colors after lane color reuse and marks a missing tail parent', () => {
    const commit = (hash: string, parents: string[] = []): GitGraphCommit => ({ hash, parents,
      author: '', email: '', date: '', committerDate: '', subject: hash, refs: [], isHead: false })
    const graph = layoutGraph([commit('R'), commit('A', ['M']), commit('B', ['Q']), commit('M', ['P', 'Q']), commit('Q'), commit('P')])
    const merge = graph.nodes.find(node => node.commit.hash === 'M')!
    const parent = graph.nodes.find(node => node.commit.hash === 'Q')!
    expect(graph.edges).toContainEqual(expect.objectContaining({ row: merge.row, fromLane: merge.lane, toLane: parent.lane, colour: parent.colour }))
    expect(layoutGraph([commit('tip', ['missing'])]).edges).toContainEqual(expect.objectContaining({ row: 0, missingParent: true }))
  })

  it('isolates repositories by case-sensitive paths and tolerates a blocked storage getter', () => {
    const storage = new Map<string, string>()
    vi.stubGlobal('window', { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } })
    try {
      saveDisplaySettings('/repo/A', { ...DEFAULT_DISPLAY_SETTINGS, showDate: false })
      expect(loadDisplaySettings('/repo/A').showDate).toBe(false)
      expect(loadDisplaySettings('/repo/a').showDate).toBe(true)
      vi.stubGlobal('window', { get localStorage() { throw new DOMException('Blocked', 'SecurityError') } })
      expect(loadDisplaySettings('/repo/A')).toBe(DEFAULT_DISPLAY_SETTINGS)
      expect(() => saveDisplaySettings('/repo/A', DEFAULT_DISPLAY_SETTINGS)).not.toThrow()
    } finally { vi.unstubAllGlobals() }
  })
})

describe('avatar providers', () => {
  it('shares overlapping requests and limits aggregate concurrency', async () => {
    let calls = 0
    let active = 0
    let peak = 0
    const store = new AvatarStore(async () => {
      calls += 1
      peak = Math.max(peak, ++active)
      await new Promise(resolve => setTimeout(resolve, 10))
      active -= 1
      return new Response(null, { status: 404 })
    })
    const authors = Array.from({ length: 8 }, (_, index) => ({ email: `a${index}@example.com`, sourceEmail: `a${index}@example.com` }))
    const signal = new AbortController().signal
    const results = await Promise.all([store.read(authors, null, 'gravatar', signal), store.read(authors, null, 'gravatar', signal)])
    expect(results.map(result => result.length)).toEqual([8, 8])
    expect({ calls, peak }).toEqual({ calls: 8, peak: 4 })
  })

  it('allows retry after a provider failure and uses the SSH hostname as a Web candidate', async () => {
    let calls = 0
    const store = new AvatarStore(async input => {
      calls += 1
      if (new URL(String(input)).hostname === 'git.example.com') throw new Error('Offline')
      return new Response(null, { status: 404 })
    })
    const remote = 'ssh://git@git.example.com:2222/team/repo.git'
    expect(gitHostOrigin(remote)).toBe('https://git.example.com')
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = await store.read([{ email: 'a@example.com', sourceEmail: 'a@example.com' }], remote, 'auto', new AbortController().signal)
      expect(result).toMatchObject([{ image: null, unavailable: true }])
    }
    expect(calls).toBe(4)
  })
})
