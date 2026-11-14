// Build the standalone file: package used by `pnpm add file:...`.
//
// The Host half is emitted as ordinary ESM files. The Client half is wrapped
// in the ModuleLoader registration used by DSH's client packages, so the
// profile can consume the package without a Harness checkout.

import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, readdirSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const ROOT = resolve(import.meta.dirname, '..')
const SRC = resolve(ROOT, 'src')
const LIB = resolve(ROOT, 'lib')
const CLIENT_ENTRY = resolve(SRC, 'client', 'index.ts')
const CLIENT_ID = 'dsh-git-graph'

const outputs = new Map()

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
  for (const { fileName: specifier } of ts.preProcessFile(source, true, true).importedFiles) {
    if (!specifier.startsWith('.')) continue
    const target = resolveLocal(file, specifier)
    if (target === undefined) throw new Error(`Cannot resolve ${specifier} from ${file}`)
    imports.push(target)
  }
  return imports
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

function emitProject(configName, declarationsOnly, filter) {
  const configFile = resolve(ROOT, configName)
  const read = ts.readConfigFile(configFile, ts.sys.readFile)
  if (read.error) throw new Error(ts.flattenDiagnosticMessageText(read.error.messageText, '\n'))
  const config = ts.parseJsonConfigFileContent(read.config, ts.sys, ROOT, {
    composite: false, noEmit: false, noEmitOnError: true, declaration: true, emitDeclarationOnly: declarationsOnly,
    rootDir: SRC, outDir: LIB, rewriteRelativeImportExtensions: true, newLine: ts.NewLineKind.LineFeed,
  }, configFile)
  const program = ts.createProgram(config.fileNames, config.options)
  const emitted = program.emit(undefined, (file, content) => {
    if (filter(file)) outputs.set(file, content.replace(/(['"])(\.[^'"\n]+?)\.(?:ts|tsx)\1/g, '$1$2.js$1'))
  })
  const errors = [...config.errors, ...ts.getPreEmitDiagnostics(program), ...emitted.diagnostics]
  if (errors.length > 0 || emitted.emitSkipped) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, { getCurrentDirectory: () => ROOT, getCanonicalFileName: file => file, getNewLine: () => '\n' }))
  }
}

function indent(text, spaces) {
  const pad = ' '.repeat(spaces)
  return text.split('\n').map(line => line.length === 0 ? line : pad + line).join('\n')
}

function buildClient() {
  const buildId = process.env.DSH_BUILD_ID ?? 'package'
  const postOrder = []
  const seen = new Set()
  const visit = file => {
    if (seen.has(file)) return
    seen.add(file)
    for (const target of localImports(file)) visit(target)
    postOrder.push(file)
  }
  visit(CLIENT_ENTRY)
  const factories = postOrder.map(file => {
    let body = transpile(readFileSync(file, 'utf8'), file, ts.ModuleKind.CommonJS)
    // Stamp the running bundle so the UI can report which build is live.
    body = body.split('__GIT_GRAPH_BUILD_ID__').join(JSON.stringify(buildId))
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
  outputs.set(resolve(LIB, 'client.js'), output)
}

function prune(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      prune(file)
      if (readdirSync(file).length === 0) rmdirSync(file)
    } else if (!outputs.has(file)) unlinkSync(file)
  }
}

emitProject('tsconfig.host.json', false, () => true)
emitProject('tsconfig.client.json', true, file => relative(LIB, file) === ['client', 'index.d.ts'].join(sep))
buildClient()
mkdirSync(LIB, { recursive: true })
prune(LIB)
for (const [file, content] of outputs) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
}
console.log('[build] standalone Host and Client artifacts written to lib/')
