// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FileSource, MetadataStrip, TextContext } from '../src/client/GitGraphView.tsx'
import { en } from '../src/client/locales.ts'
import type { GitGraphFileContent, GitGraphMetadata } from '../src/domain.ts'

/**
 * Panel lifecycle, characterized as observed behaviour.
 *
 * The two panels reached the same question by different routes in source:
 *   FileSource    — effect deps [hash, path, readFile, revision]; guards late
 *                   replies with a `let cancelled = false` closure flag set in
 *                   effect cleanup, which also aborts its controller.
 *   MetadataStrip — effect deps [open, readMetadata, readRevision, revision];
 *                   returns early when closed (so a closed panel never reads);
 *                   guards late replies by checking `controller.signal.aborted`.
 *
 * Nothing here assumes those idioms are equivalent: every row below is an
 * assertion about what actually happened.
 *
 * jsdom implements `<details>`/`<summary>` toggling, so expanding is a real
 * `summary.click()` rather than a hand-dispatched event. Its `toggle` event is
 * queued as a task, so expanding must be awaited.
 */

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const LOADING_SOURCE = en['source.loading']
const LOADING_METADATA = en['metadata.loading']
const RETRY = en['common.retry']

/** The slot translator, resolved against the real English dictionary. */
function translate(key: string, params?: Record<string, string | number>): string {
  const template = (en as Record<string, string>)[key] ?? key
  return params === undefined ? template : template.replace(/\{(\w+)\}/gu, (_, name: string) => String(params[name] ?? `{${name}}`))
}
const t = translate as never

interface Deferred<T> {
  readonly signal: AbortSignal
  readonly settle: (result: RemoteResult<T>) => Promise<void>
  readonly fail: (error: unknown) => Promise<void>
  readonly aborted: () => boolean
}

interface ReaderHarness<T, R> {
  readonly calls: Array<{ request: unknown; signal: AbortSignal }>
  readonly reader: R
  readonly at: (index: number) => Deferred<T>
}

/** The harness reader seen as each panel's own reader prop. */
type FileReader = Parameters<typeof FileSource>[0]['readFile']
type MetadataReader = Parameters<typeof MetadataStrip>[0]['readMetadata']

/**
 * A counting fake whose promises settle only when the test says so, so request
 * ordering (including an older reply arriving last) is under explicit control.
 * `reader` is cast once to the panel's own reader type; every call is still
 * recorded here, and that record is what the matrix asserts against.
 */
function harness<T, R>(): ReaderHarness<T, R> {
  const calls: Array<{ request: unknown; signal: AbortSignal }> = []
  const deferred: Array<Deferred<T>> = []
  const reader = (...args: unknown[]): Promise<RemoteResult<T>> => {
    const signal = args[args.length - 1] as AbortSignal
    const request = args.length > 1 ? args[0] : undefined
    calls.push({ request, signal })
    let settle!: (result: RemoteResult<T>) => void
    let fail!: (error: unknown) => void
    const promise = new Promise<RemoteResult<T>>((resolve, reject) => { settle = resolve; fail = reject })
    deferred.push({
      signal,
      aborted: () => signal.aborted,
      settle: async result => { await act(async () => { settle(result); await Promise.resolve() }) },
      fail: async error => { await act(async () => { fail(error); await Promise.resolve() }) },
    })
    return promise
  }
  return { calls, reader: reader as R, at: index => deferred[index]! }
}

const CONTENT: GitGraphFileContent = { hash: 'a'.repeat(40), path: 'a.txt', kind: 'text', text: 'hello\n', size: 6, truncated: false }
const METADATA: GitGraphMetadata = { tags: [], stashes: [] }
const ok = <T,>(value: T): RemoteResult<T> => ({ ok: true, value }) as RemoteResult<T>
const failed = <T,>(message: string): RemoteResult<T> => ({ ok: false, error: { code: 'gateway/internal', message } }) as unknown as RemoteResult<T>

/** Let React flush every microtask the panels scheduled. */
async function settle(): Promise<void> {
  await act(async () => { await Promise.resolve() })
  await act(async () => { await Promise.resolve() })
}

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => { root.unmount() })
  host.remove()
  vi.restoreAllMocks()
})

function renderFileSource(hash: string, path: string, readFile: FileReader): void {
  act(() => {
    root.render(<TextContext.Provider value={t}><FileSource hash={hash} path={path} readFile={readFile} /></TextContext.Provider>)
  })
}

function renderMetadataStrip(readMetadata: MetadataReader, readRevision: number): void {
  act(() => {
    root.render(<TextContext.Provider value={t}><MetadataStrip readMetadata={readMetadata} readRevision={readRevision} /></TextContext.Provider>)
  })
}

const sourceText = (): string | null => host.querySelector('[data-source-text]')?.textContent ?? null

describe('FileSource — reads on mount and whenever hash or path changes', () => {
  it('mount issues exactly one read with {hash, path}, shows loading, then paints the content', async () => {
    const reads = harness<GitGraphFileContent, FileReader>()
    renderFileSource('a'.repeat(40), 'a.txt', reads.reader)

    expect(reads.calls).toHaveLength(1)
    expect(reads.calls[0]?.request).toEqual({ hash: 'a'.repeat(40), path: 'a.txt' })
    expect(host.textContent).toContain(LOADING_SOURCE)
    expect(sourceText()).toBeNull()

    await reads.at(0).settle(ok(CONTENT))
    expect(sourceText()).toBe('hello\n')
    expect(host.textContent).not.toContain(LOADING_SOURCE)
    expect(reads.calls).toHaveLength(1)
  })

  it('changing hash issues exactly one more read, and a late reply for the previous hash never paints', async () => {
    const reads = harness<GitGraphFileContent, FileReader>()
    renderFileSource('a'.repeat(40), 'a.txt', reads.reader)
    await reads.at(0).settle(ok(CONTENT))

    renderFileSource('b'.repeat(40), 'a.txt', reads.reader)
    expect(reads.calls).toHaveLength(2)
    expect(reads.calls[1]?.request).toEqual({ hash: 'b'.repeat(40), path: 'a.txt' })
    // The previous read was cancelled when its effect tore down.
    expect(reads.at(0).aborted()).toBe(true)
    expect(reads.at(1).aborted()).toBe(false)

    // Resolve the NEW read, then let the OLD one arrive last.
    await reads.at(1).settle(ok({ ...CONTENT, text: 'new\n', hash: 'b'.repeat(40) }))
    await reads.at(0).settle(ok({ ...CONTENT, text: 'stale\n' }))
    expect(sourceText()).toBe('new\n')
    expect(reads.calls).toHaveLength(2)
  })

  it('changing path issues exactly one more read with the new path', async () => {
    const reads = harness<GitGraphFileContent, FileReader>()
    renderFileSource('a'.repeat(40), 'a.txt', reads.reader)
    await reads.at(0).settle(ok(CONTENT))

    renderFileSource('a'.repeat(40), 'b.txt', reads.reader)
    expect(reads.calls).toHaveLength(2)
    expect(reads.calls[1]?.request).toEqual({ hash: 'a'.repeat(40), path: 'b.txt' })
    await reads.at(1).settle(ok({ ...CONTENT, path: 'b.txt', text: 'b\n' }))
    expect(sourceText()).toBe('b\n')
  })

  it('result.ok === false shows an error with a retry that issues exactly one more read', async () => {
    const reads = harness<GitGraphFileContent, FileReader>()
    renderFileSource('a'.repeat(40), 'a.txt', reads.reader)
    await reads.at(0).settle(failed('boom'))

    const alert = host.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('boom')
    const retry = [...host.querySelectorAll('button')].find(button => button.textContent === RETRY)
    expect(retry).toBeDefined()

    act(() => { retry!.click() })
    expect(reads.calls).toHaveLength(2)
    expect(reads.calls[1]?.request).toEqual({ hash: 'a'.repeat(40), path: 'a.txt' })
    await reads.at(1).settle(ok(CONTENT))
    expect(sourceText()).toBe('hello\n')
  })

  it('a rejected promise takes the same error path as result.ok === false', async () => {
    const reads = harness<GitGraphFileContent, FileReader>()
    renderFileSource('a'.repeat(40), 'a.txt', reads.reader)
    await reads.at(0).fail(new Error('network down'))

    expect(host.querySelector('[role="alert"]')?.textContent).toContain('network down')
    expect(reads.calls).toHaveLength(1)
  })

  it('unmounting while pending aborts the signal and a late reply sets no state', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const reads = harness<GitGraphFileContent, FileReader>()
    renderFileSource('a'.repeat(40), 'a.txt', reads.reader)
    expect(reads.at(0).aborted()).toBe(false)

    act(() => { root.unmount() })
    expect(reads.at(0).aborted()).toBe(true)

    // Arriving after teardown must not warn or throw.
    await act(async () => { await Promise.resolve() })
    expect(errors).not.toHaveBeenCalled()

    root = createRoot(host)
  })

  it('two reads in flight with the older reply arriving last still paints the newer one', async () => {
    const reads = harness<GitGraphFileContent, FileReader>()
    renderFileSource('a'.repeat(40), 'a.txt', reads.reader)
    renderFileSource('b'.repeat(40), 'a.txt', reads.reader)
    renderFileSource('c'.repeat(40), 'a.txt', reads.reader)
    expect(reads.calls).toHaveLength(3)

    await reads.at(2).settle(ok({ ...CONTENT, text: 'third\n' }))
    await reads.at(1).settle(ok({ ...CONTENT, text: 'second\n' }))
    await reads.at(0).settle(ok({ ...CONTENT, text: 'first\n' }))
    expect(sourceText()).toBe('third\n')
    expect(reads.calls).toHaveLength(3)
  })

  /**
   * The extraction's chosen semantic, pinned rather than left as folklore.
   *
   * The shared hook invokes the read through a ref, so the reader is absent
   * from its dependency list and a NEW function identity for the SAME logical
   * read does not restart it. That is the semantic this experiment wants: a
   * parent that builds its reader inline re-renders constantly, and if identity
   * were a trigger every one of those renders would fire a duplicate request.
   * This is the 「不会出现多发请求」 property asserted rather than assumed.
   */
  it('swapping the reader while a read is pending cancels the old request and starts a new one', async () => {
    const reads = harness<GitGraphFileContent, FileReader>()
    renderFileSource('a'.repeat(40), 'a.txt', reads.reader)
    await settle()
    expect(reads.calls).toHaveLength(1)
    expect(reads.at(0).aborted()).toBe(false)

    // Same request fields, different data source, old reply still in flight.
    const swapped: FileReader = (request, signal) => reads.reader(request, signal)
    expect(swapped).not.toBe(reads.reader)
    renderFileSource('a'.repeat(40), 'a.txt', swapped)
    await settle()

    // Old request cancelled, exactly one new request started.
    expect(reads.at(0).aborted()).toBe(true)
    expect(reads.calls).toHaveLength(2)
    expect(reads.at(1).aborted()).toBe(false)

    // The cancelled read's late reply must not paint.
    await reads.at(0).settle(ok({ ...CONTENT, text: 'stale\n' }))
    expect(sourceText()).toBeNull()

    // The new source's reply is the one that lands.
    await reads.at(1).settle(ok({ ...CONTENT, text: 'fresh\n' }))
    expect(sourceText()).toBe('fresh\n')
    expect(reads.calls).toHaveLength(2)
  })

  it('a re-render with the same reader issues no second read', async () => {
    const reads = harness<GitGraphFileContent, FileReader>()
    renderFileSource('a'.repeat(40), 'a.txt', reads.reader)
    await reads.at(0).settle(ok(CONTENT))
    expect(reads.calls).toHaveLength(1)

    // Identical props and reader identity: nothing to re-read.
    renderFileSource('a'.repeat(40), 'a.txt', reads.reader)
    await settle()
    expect(reads.calls).toHaveLength(1)
    expect(sourceText()).toBe('hello\n')

    // Liveness control: the re-render above really did commit, so the count
    // staying at 1 is identity-stability and not a dead render. A genuine
    // change to the request still reads again.
    renderFileSource('a'.repeat(40), 'b.txt', reads.reader)
    expect(reads.calls).toHaveLength(2)
    expect(reads.calls[1]?.request).toEqual({ hash: 'a'.repeat(40), path: 'b.txt' })
  })
})

describe('MetadataStrip — reads only when expanded, also driven by readRevision', () => {
  const expand = async (): Promise<void> => {
    await act(async () => { host.querySelector('summary')!.click(); await Promise.resolve() })
  }
  const collapse = expand

  it('closed panel issues zero reads', async () => {
    const reads = harness<GitGraphMetadata, MetadataReader>()
    renderMetadataStrip(reads.reader, 0)
    await settle()
    expect(reads.calls).toHaveLength(0)
    expect(host.querySelector('summary')).not.toBeNull()
  })

  it('expanding issues exactly one read and shows loading, then content', async () => {
    const reads = harness<GitGraphMetadata, MetadataReader>()
    renderMetadataStrip(reads.reader, 0)
    await expand()

    expect(reads.calls).toHaveLength(1)
    expect(host.textContent).toContain(LOADING_METADATA)
    await reads.at(0).settle(ok(METADATA))
    expect(host.textContent).toContain(en['metadata.empty'])
    expect(reads.calls).toHaveLength(1)
  })

  it('closing while pending aborts the in-flight request', async () => {
    const reads = harness<GitGraphMetadata, MetadataReader>()
    renderMetadataStrip(reads.reader, 0)
    await expand()
    expect(reads.at(0).aborted()).toBe(false)

    await collapse()
    expect(reads.at(0).aborted()).toBe(true)
    await reads.at(0).settle(ok(METADATA))
    expect(reads.calls).toHaveLength(1)
  })

  it('re-expanding issues exactly one more read, not two', async () => {
    const reads = harness<GitGraphMetadata, MetadataReader>()
    renderMetadataStrip(reads.reader, 0)
    await expand()
    await reads.at(0).settle(ok(METADATA))
    await collapse()
    await expand()

    expect(reads.calls).toHaveLength(2)
    await reads.at(1).settle(ok(METADATA))
    expect(reads.calls).toHaveLength(2)
  })

  it('readRevision changing while open issues exactly one more read', async () => {
    const reads = harness<GitGraphMetadata, MetadataReader>()
    renderMetadataStrip(reads.reader, 0)
    await expand()
    await reads.at(0).settle(ok(METADATA))

    renderMetadataStrip(reads.reader, 1)
    expect(reads.calls).toHaveLength(2)
    await reads.at(1).settle(ok(METADATA))
    expect(reads.calls).toHaveLength(2)
  })

  it('readRevision changing while closed issues zero reads', async () => {
    const reads = harness<GitGraphMetadata, MetadataReader>()
    renderMetadataStrip(reads.reader, 0)
    await settle()
    renderMetadataStrip(reads.reader, 1)
    renderMetadataStrip(reads.reader, 2)
    await settle()
    expect(reads.calls).toHaveLength(0)
  })

  it('retry after a failure issues exactly one more read', async () => {
    const reads = harness<GitGraphMetadata, MetadataReader>()
    renderMetadataStrip(reads.reader, 0)
    await expand()
    await reads.at(0).settle(failed('nope'))

    const status = host.querySelector('[role="status"]')
    expect(status?.textContent).toContain('nope')
    const retry = [...host.querySelectorAll('button')].find(button => button.textContent === RETRY)
    expect(retry).toBeDefined()

    act(() => { retry!.click() })
    expect(reads.calls).toHaveLength(2)
    await reads.at(1).settle(ok(METADATA))
    expect(host.textContent).toContain(en['metadata.empty'])
  })

  it('unmounting while pending aborts the signal and a late reply sets no state', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const reads = harness<GitGraphMetadata, MetadataReader>()
    renderMetadataStrip(reads.reader, 0)
    await expand()
    expect(reads.at(0).aborted()).toBe(false)

    act(() => { root.unmount() })
    expect(reads.at(0).aborted()).toBe(true)
    await act(async () => { await Promise.resolve() })
    expect(errors).not.toHaveBeenCalled()

    root = createRoot(host)
  })

  /** Same preserved semantic as the FileSource entry above, on the open panel. */
  it('swapping the reader while open cancels the pending read and starts a new one', async () => {
    const reads = harness<GitGraphMetadata, MetadataReader>()
    renderMetadataStrip(reads.reader, 0)
    await expand()
    await settle()
    expect(reads.calls).toHaveLength(1)
    expect(reads.at(0).aborted()).toBe(false)

    const swapped: MetadataReader = signal => reads.reader(signal)
    expect(swapped).not.toBe(reads.reader)
    renderMetadataStrip(swapped, 0)
    await settle()

    expect(reads.at(0).aborted()).toBe(true)
    expect(reads.calls).toHaveLength(2)
    expect(reads.at(1).aborted()).toBe(false)

    // The cancelled read's late reply must not paint; the new one lands.
    await reads.at(0).settle(ok({ tags: [{ name: 'stale' } as never], stashes: [] }))
    await reads.at(1).settle(ok(METADATA))
    expect(host.textContent).toContain(en['metadata.empty'])
    expect(host.textContent).not.toContain('stale')
  })

  it('a re-render with the same reader while open issues no second read', async () => {
    const reads = harness<GitGraphMetadata, MetadataReader>()
    renderMetadataStrip(reads.reader, 0)
    await expand()
    await reads.at(0).settle(ok(METADATA))
    expect(reads.calls).toHaveLength(1)

    renderMetadataStrip(reads.reader, 0)
    await settle()
    expect(reads.calls).toHaveLength(1)
    expect(host.textContent).toContain(en['metadata.empty'])

    // Liveness control, as in the FileSource entry: a real trigger still reads.
    renderMetadataStrip(reads.reader, 1)
    expect(reads.calls).toHaveLength(2)
  })
})
