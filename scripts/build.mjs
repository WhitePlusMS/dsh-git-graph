// Build the standalone file: package used by `pnpm add file:...`.
//
// The Host half is emitted as ordinary ESM files. The Client half is wrapped
// in the ModuleLoader registration used by DSH's client packages, so the
// profile can consume the package without a Harness checkout.

import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const ROOT = resolve(import.meta.dirname, '..')
const SRC = resolve(ROOT, 'src')
const LIB = resolve(ROOT, 'lib')
const HOST_ENTRY = resolve(SRC, 'index.ts')
const HOST_CONTRACT_ENTRY = resolve(SRC, 'typert.host.ts')
const CLIENT_CONTRACT_ENTRY = resolve(SRC, 'typert.remote-client.ts')
const CLIENT_ENTRY = resolve(SRC, 'client', 'index.ts')
const CLIENT_ID = 'dsh-git-graph'

const REL_IMPORT = /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"](\.[^'"]+)['"]/g

function sourceCandidates(file, specifier) {
  const base = specifier.replace(/\.(?:js|jsx|ts|tsx)$/u, '')
  const stem = resolve(dirname(file), base)
  return [stem + '.ts', stem + '.tsx']
}

function resolveLocal(file, specifier) {
  for (const candidate of sourceCandidates(file, specifier)) {
    try {
      readFileSync(candidate)
      return candidate
    } catch {
      // Continue with the next TypeScript extension.
    }
  }
  return undefined
}

function localImports(file) {
  const source = readFileSync(file, 'utf8')
  const imports = []
  const regex = new RegExp(REL_IMPORT.source, 'g')
  let match
  while ((match = regex.exec(source)) !== null) {
    const specifier = match[1]
    if (specifier === undefined) continue
    const target = resolveLocal(file, specifier)
    if (target !== undefined) imports.push({ specifier, target })
  }
  return imports
}

function collect(entry) {
  const files = []
  const seen = new Set()
  const visit = file => {
    if (seen.has(file)) return
    seen.add(file)
    files.push(file)
    for (const { target } of localImports(file)) visit(target)
  }
  visit(entry)
  return files
}

function transpile(source, file, moduleKind) {
  const output = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: moduleKind,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      isolatedModules: true,
    },
  }).outputText
  return output.replace(/(['"])(\.[^'"\n]+?)\.(?:ts|tsx)\1/g, '$1$2.js$1')
}

function declaration(source, file) {
  if (typeof ts.transpileDeclaration !== 'function') return ''
  return ts.transpileDeclaration(source, {
    fileName: file,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      jsx: ts.JsxEmit.ReactJSX,
      isolatedDeclarations: false,
    },
  }).outputText.replace(/(['"])(\.[^'"\n]+?)\.(?:ts|tsx)\1/g, '$1$2.js$1')
}

function outputPath(file, extension) {
  const rel = relative(SRC, file).split(sep).join('/')
  return resolve(LIB, rel.replace(/\.(?:ts|tsx)$/u, extension))
}

function buildHost() {
  for (const entry of [HOST_ENTRY, HOST_CONTRACT_ENTRY, CLIENT_CONTRACT_ENTRY]) {
    for (const file of collect(entry)) {
      const source = readFileSync(file, 'utf8')
      const output = transpile(source, file, ts.ModuleKind.ESNext)
      const target = outputPath(file, '.js')
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, output)
      const dts = declaration(source, file)
      if (dts.length > 0) {
        const declarationPath = outputPath(file, '.d.ts')
        mkdirSync(dirname(declarationPath), { recursive: true })
        writeFileSync(declarationPath, dts)
      }
    }
  }
}

function indent(text, spaces) {
  const pad = ' '.repeat(spaces)
  return text.split('\n').map(line => line.length === 0 ? line : pad + line).join('\n')
}

function buildClient() {
  const order = collect(CLIENT_ENTRY)
  const postOrder = []
  const seen = new Set()
  const visit = file => {
    if (seen.has(file)) return
    seen.add(file)
    for (const { target } of localImports(file)) visit(target)
    postOrder.push(file)
  }
  visit(CLIENT_ENTRY)
  const factories = postOrder.map(file => {
    let body = transpile(readFileSync(file, 'utf8'), file, ts.ModuleKind.CommonJS)
    body = body.replace(/require\((['"])(\.[^'"]+)\1\)/g, (_all, quote, specifier) => {
      const target = resolveLocal(file, specifier)
      const id = target === undefined ? undefined : postOrder.indexOf(target)
      return id === undefined ? `require(${quote}${specifier}${quote})` : `require(${id})`
    })
    return `  (function (module, exports, require) {\n${indent(body, 2)}\n  })`
  })
  const entryId = postOrder.indexOf(CLIENT_ENTRY)
  const output = [
    'window.__ModuleLoader__.load({',
    `  id: ${JSON.stringify(CLIENT_ID)},`,
    '  factory: (require) => {',
    '    var cache = {};',
    '    var factories = [',
    factories.join(',\n'),
    '    ];',
    '    function __r(id) {',
    "      if (typeof id !== 'number') return require(id);",
    '      if (cache[id]) return cache[id].exports;',
    '      var module = { exports: {} };',
    '      cache[id] = module;',
    '      factories[id](module, module.exports, __r);',
    '      return module.exports;',
    '    }',
    `    return __r(${entryId});`,
    '  }',
    '});',
    '',
  ].join('\n')
  const target = resolve(LIB, 'client.js')
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, output)
  const dts = declaration(readFileSync(CLIENT_ENTRY, 'utf8'), CLIENT_ENTRY)
  if (dts.length > 0) {
    const declarationPath = resolve(LIB, 'client', 'index.d.ts')
    mkdirSync(dirname(declarationPath), { recursive: true })
    writeFileSync(declarationPath, dts)
  }
}

mkdirSync(LIB, { recursive: true })
buildHost()
buildClient()
console.log('[build] standalone Host and Client artifacts written to lib/')
