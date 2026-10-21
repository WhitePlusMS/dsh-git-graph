/**
 * Development loop: rebuild on save and mirror the artifacts into the installed
 * profile copy.
 *
 * Why a mirror and not a symlink install: the Host half imports real runtime
 * packages (`@deepseek-ai/dsh-typert-protocol`, `@deepseek-ai/dsh-tools`). A
 * symlinked package resolves those from this workspace's `node_modules`, giving
 * the Harness a second instance of its own protocol module. The profile copy
 * keeps resolution identical to the released `.tgz`.
 *
 * What reloads and what does not:
 *   - Client half (`lib/client.js`): `dsh-client-hmr` polls the installed entry
 *     every 500 ms and swaps the plugin into the open page. No publish, no page
 *     refresh, no Host restart. Plugin React state is reset by the swap.
 *   - Host half (`lib/index.js`): loaded once at Host start. Restart the Host
 *     (or `dsh web`) to pick it up.
 *
 * Every write is atomic (temp file + rename) so the HMR poll can never read a
 * half-written bundle and fail the swap.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, watch, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const PACKAGE = 'dsh-git-graph'
const DEBOUNCE_MS = 120

/** Either an explicit target (DSH_PLUGIN_DIR) or every profile that has the plugin. */
function resolveTargets() {
  const explicit = process.env.DSH_PLUGIN_DIR
  if (explicit !== undefined && explicit.length > 0) {
    const dir = resolve(explicit)
    if (!existsSync(join(dir, 'package.json'))) {
      throw new Error(`DSH_PLUGIN_DIR 指向的目录没有 package.json：${dir}`)
    }
    return [{ label: 'DSH_PLUGIN_DIR', dir }]
  }
  const base = join(homedir(), '.dsh', 'profiles')
  if (!existsSync(base)) return []
  const targets = []
  for (const profile of readdirSync(base)) {
    const dir = join(base, profile, 'node_modules', PACKAGE)
    if (existsSync(join(dir, 'package.json'))) targets.push({ label: `profile ${profile}`, dir })
  }
  return targets
}

/**
 * Replace one installed file.
 *
 * Temp file + rename keeps the HMR poll from ever reading a half-written
 * bundle, but Windows refuses the rename while the Host has the destination
 * open, so it is retried and finally downgraded to an in-place write. A sync
 * that cannot land is reported, never fatal: the watcher must outlive it.
 */
function writeAtomic(target, source) {
  mkdirSync(dirname(target), { recursive: true })
  const tmp = `${target}.dsh-tmp-${process.pid}`
  const payload = readFileSync(source)
  writeFileSync(tmp, payload)
  const delays = [0, 40, 120, 300, 700]
  for (const delay of delays) {
    if (delay > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay)
    try {
      renameSync(tmp, target)
      return 'atomic'
    } catch (error) {
      if (error.code !== 'EPERM' && error.code !== 'EBUSY' && error.code !== 'EACCES') {
        rmSync(tmp, { force: true })
        throw error
      }
    }
  }
  // The Host holds the destination; write through it instead.
  try {
    writeFileSync(target, payload)
    return 'in-place'
  } finally {
    rmSync(tmp, { force: true })
  }
}

function listFiles(dir) {
  const files = []
  const visit = current => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) visit(full)
      else if (entry.isFile()) files.push(full)
    }
  }
  if (existsSync(dir)) visit(dir)
  return files
}

/** Mirror what an install needs: the built entries, the dictionaries, the patch. */
const MIRRORED = ['lib', 'locale']
const MIRRORED_FILES = ['cordis.patch.yml', 'package.json']

function sync(targetDir) {
  let copied = 0
  let inPlace = 0
  const failed = []
  const write = (target, source) => {
    try {
      if (writeAtomic(target, source) === 'in-place') inPlace += 1
      copied += 1
    } catch (error) {
      failed.push(`${relative(ROOT, source)}: ${error.code ?? error.message}`)
    }
  }
  for (const name of MIRRORED) {
    const source = join(ROOT, name)
    for (const file of listFiles(source)) write(join(targetDir, relative(ROOT, file)), file)
  }
  for (const name of MIRRORED_FILES) {
    const source = join(ROOT, name)
    if (existsSync(source)) write(join(targetDir, name), source)
  }
  return { copied, inPlace, failed }
}

function build() {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'build.mjs')], { cwd: ROOT, stdio: 'inherit' })
}

const targets = resolveTargets()
if (targets.length === 0) {
  console.error(`[dev] 没找到已安装的 ${PACKAGE}。先执行一次 dsh plugin --profile <name> add <包地址>，`)
  console.error('[dev] 或者用 DSH_PLUGIN_DIR 指向插件安装目录。')
  process.exit(1)
}
for (const target of targets) console.log(`[dev] 目标：${target.label} → ${target.dir}`)

/** One build + mirror pass. A failed build keeps the previously installed bundle. */
function pass(label) {
  try {
    build()
  } catch {
    console.error(`[dev] 构建失败（${label}），安装目录保持上一版，不写入半成品。`)
    return
  }
  for (const target of targets) {
    const { copied, inPlace, failed } = sync(target.dir)
    const suffix = inPlace > 0 ? `（其中 ${inPlace} 个因文件被占用改为原地写入）` : ''
    console.log(`[dev] ${new Date().toLocaleTimeString()} ${label} → 已同步 ${copied} 个文件到 ${target.label}${suffix}`)
    for (const entry of failed) console.error(`[dev]   同步失败 ${entry}`)
  }
}

pass('初始同步')

let timer
const schedule = label => {
  clearTimeout(timer)
  timer = setTimeout(() => pass(label), DEBOUNCE_MS)
}
const watchers = [
  watch(join(ROOT, 'src'), { recursive: true }, () => schedule('src 变更')),
  watch(join(ROOT, 'locale'), { recursive: true }, () => schedule('locale 变更')),
]
console.log(`[dev] 监听中：src/、locale/。客户端改动约 ${500}ms 内热替换；Host 改动需重启。Ctrl+C 结束。`)

const shutdown = () => {
  for (const watcher of watchers) watcher.close()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
