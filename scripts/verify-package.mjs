import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { runInNewContext } from 'node:vm'

const root = resolve(process.argv[2] ?? '.')
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
for (const entry of ['.', './client', './typert', './remote']) {
  for (const target of Object.values(manifest.exports[entry])) assert(statSync(resolve(root, target)).isFile(), `${entry} → ${target}`)
}

const host = await import(pathToFileURL(resolve(root, manifest.exports['.'].default)))
const typert = await import(pathToFileURL(resolve(root, manifest.exports['./typert'].default)))
const remote = await import(pathToFileURL(resolve(root, manifest.exports['./remote'].default)))
assert.equal(host.name, manifest.name)
assert.equal(typeof host.apply, 'function')
assert(typert.TYPERT.invocations.length > 0)
assert.equal(remote.TYPERT_REMOTE.package, manifest.name)

let registration
const browser = { __ModuleLoader__: { load: value => { registration = value } } }
runInNewContext(readFileSync(resolve(root, manifest.exports['./client'].default), 'utf8'), { window: browser })
assert.equal(registration.id, manifest.name)
const client = registration.factory(module => {
  // The DSH loader provides these at runtime; React context is created eagerly.
  if (module === 'react') return { createContext: () => ({}) }
  if (module === 'react/jsx-runtime') return {}
  throw new Error(`Unexpected browser dependency ${module}`)
})
assert.equal(typeof client.apply, 'function')
assert(client.inject.includes('remote'))
console.log(`[verify-package] ${manifest.name}@${manifest.version} Host, Typert and Client entries load`)
