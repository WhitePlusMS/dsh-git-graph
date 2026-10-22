# Changelog

## 0.6.0 — 2026-10-22

- **只读分支导航与顶栏下拉**：本地 / 远端分支分组、名称筛选、精确聚焦并定位分支最新提交；分支、筛选、设置从顶栏打开，重复点击或 Esc 可收起，不改写工作区或引用。
- **展开后图形对齐**：监听行内详情区域的实际高度变化。提交详情、历史文件 Diff、未提交列表和文件 Diff 加载、展开或收起后，节点与提交标题保持对齐。
- **数据与搜索修复**：Host / Client / 模型工具的分支与搜索截断契约一致；搜索仍最多扫描 2000 条，但明确提示未扫描的历史。保留引用名中的逗号，分支 glob 使用 Git 原生语义，详情 / 比较 / 工作区纳入文件类型变化，修正 porcelain 重命名目标路径。
- **按需读取与刷新**：切换、关闭或卸载视图会取消旧读取；标签 / Stash 展开时才请求，标签详情合并为一次 Git 命令。比较刷新重新读取数据并保留基准选择。
- **仓库身份与交付**：同一 Git 工作树的根目录 / 子目录会话共用显示设置和头像缓存身份。测试源码随仓库交付，CI 校验类型和测试通过后才打包发布。双语 README、安装地址与机器摘要同步更新。

适配 DSH **0.2.0-rc.2**，继续仅通过本仓库 GitHub Release 成品包分发，不发布到同名 npm 项目。升级后请重启同一 profile 的 DSH，确保 Host / Client 严格契约同时生效；原先按子目录保存的显示设置不迁移。

验证：Host / Client / 测试三个 TypeScript 程序检查通过，4 个测试文件共 **31 项**通过；真实 DSH 页面 **23 次**逐态坐标测量通过，41 个节点和分支聚焦后的 35 个节点最大偏差不超过 **0.5px**，并确认旧详情请求取消、metadata 按需读取、比较刷新保留基准。2001 条历史的搜索截断由真实 Git 回归覆盖。详细范围见[修复与验证记录](https://github.com/WhitePlusMS/dsh-git-graph/blob/v0.6.0/docs/ARCHITECTURE_FIX_REPORT_20261022.md)。

### English

- Add read-only branch navigation with local/remote groups, name search, exact history focus, and tip location. Branch, filter, and settings controls open as top-bar dropdowns; repeated clicks or Escape close them.
- Observe inline detail height changes so graph nodes remain aligned while commit details, historical diffs, and uncommitted changes load, expand, or collapse.
- Align Host, Client, and tool data contracts. Report when the 2,000-commit search budget leaves earlier history unscanned; preserve commas in reference names, use native Git branch patterns, include file type changes, and correct porcelain rename destinations.
- Cancel obsolete reads when views change or close. Fetch tag/stash metadata only on expansion and read all tag details in one Git command. Refresh comparisons without resetting the selected base.
- Share repository settings across root/subdirectory sessions in one worktree. Include regression tests in Git and require typecheck/tests before CI packaging. Update both READMEs, installation links, and the machine-readable summary.

Requires DSH **0.2.0-rc.2**. Install from this repository's GitHub Release, not the unrelated npm package. Restart the same DSH profile after updating; old subdirectory-specific settings are not migrated.

Validation: three TypeScript programs and **31 tests** passed; **23 real-DSH layout checks** passed with a maximum node offset of **0.5px**, including branch focus, cancellation, lazy metadata, and comparison refresh. A real 2,001-commit Git fixture covers search truncation. See the [validation record](https://github.com/WhitePlusMS/dsh-git-graph/blob/v0.6.0/docs/ARCHITECTURE_FIX_REPORT_20261022.md).

## 0.5.3 — 2026-10-21

- **设置面板重排**：原来把 15 个控件平铺成三四行的做法改为按问题分组的栅格——引用、日期、作者与头像、提交列表、图形各自成组，组内标题在左、控件在右对齐，控件宽度不再随文字抖动。宽度够时三列并排，变窄依次降到两列、一列；图形三项横向展开并跨列，行末不留空洞。
- **高度可控**：去掉原来 200px 高的滚动小窗。常规宽度下整块约 150–200px 一次看全，只有面板真的很窄时才滚动，且「恢复默认显示 / 关闭设置」固定在底部，不随内容滚走。
- **状态与文案**：工具栏「设置」「查找」用按下态标出对应面板已展开；头像来源改为「自动获取 / 仅 Gravatar」，窄列下不再被截断，完整取值顺序由面板底部的说明承担。

适配 DSH **0.2.0-rc.2**，设置项本身与按仓库保存的语义均未改动。

验证：三个 TypeScript 程序类型检查通过，`lib/` 已重新构建；组件级渲染在 872 / 560 / 360 px 三种宽度下截图核对（三个宽度见[872](docs/screenshots/settings-panel-872-0.5.3.png)、[560](docs/screenshots/settings-panel-560-0.5.3.png)、[360](docs/screenshots/settings-panel-360-0.5.3.png)），面板与图形区无重叠，窄宽度时底部按钮固定可见；本次未触及的提交行图形对齐复测 6 行顶点偏差仍为 0。未在真实 DSH 中做点击验收，上述截图来自组件级 demo，仅以 DSH 深色主题变量近似配色。

### English

- Rebuild the settings panel as a grid of named groups — references, dates, author and avatars, commit list, graph. Captions share one column and controls another, so values no longer shift with the label text; three columns on a wide pane, two and then one as it narrows, with the graph row spreading over the remaining columns instead of leaving a gap.
- Remove the old 200px scrolling box. At normal widths the whole panel fits in roughly 150–200px and only scrolls when the pane is genuinely narrow, where the reset and close actions stay pinned to the bottom.
- The Settings and Find buttons now show a pressed state while their panel is open, and the avatar source reads "Automatic" / "Gravatar only" so it is not clipped in a narrow column; the full lookup order stays in the note under the groups.

Requires DSH **0.2.0-rc.2**. No setting was added or removed, and settings are still stored per repository.

## 0.5.2 — 2026-10-21

- **文件 Diff 路径修正**：会话工作目录位于仓库子目录时，文件 Diff 不再匹配错路径。此前 `git diff` 静默返回空，界面显示「该文件在工作区没有行级变更」，旁边却仍是正确的增删行数；现在先按 `rev-parse --show-toplevel` 取仓库根再校验路径并读取，未提交变更、未跟踪文件与提交内文件 Diff 一并修正。
- **引用全量显示**：提交行不再用「+N」折叠引用。徽标保持原尺寸，放不下时换行；说明文字能留一行就留一行，挤不下才整行下移，行高随之增长。
- **图形跟随实测行高**：图列按每行实际高度绘制顶点与连线（含未提交行与行内展开面板），`引用对齐 = graph` 模式按最宽标签动态预留列宽，标签不再被压成图标。
- **头像来源扩充**：新增仓库所在 Git 服务（Gitea/Gogs 的 `/avatar/<md5>`，含 SHA256 回退）与 GitHub noreply 邮箱直取；查不到时首字母提示区分「没有公开头像」与「加载失败」。

适配 DSH **0.2.0-rc.2**。头像请求仍限制在固定域名、仓库自身 origin 与 `/avatar/<32~64 位十六进制>` 路径，跨服务重定向与带凭据的 remote 被拒绝。

验证：三个 TypeScript 程序类型检查通过；新增的仓库子目录 Diff 回归测试 6 项通过；Git 读取校验 12 项、头像解析校验 18 项通过；组件级渲染逐行核对图形顶点与行中心偏差为 0。本次未在真实 DSH 中重做浏览器点击验收，详见[验收记录](docs/REFS_AVATAR_TEST_REPORT.md)。

### English

- Fix file diffs when the session working directory is a subdirectory of the repository: resolve the path against `rev-parse --show-toplevel` instead of reading with a pathspec that no longer matches. Previously the diff silently came back empty while the `+14 −2` counters stayed correct.
- Show every reference on a commit row instead of collapsing the rest into `+N`; chips keep their size and wrap, and the subject moves to its own line only when a readable slice no longer fits.
- Draw the graph from measured row heights (including the working-tree row and inline panels), and reserve the widest label width for the graph-aligned layout so labels are no longer squeezed into icons.
- Resolve avatars from the repository's own Git service (Gitea/Gogs `/avatar/<md5>`, with an SHA256 fallback) and from GitHub noreply addresses; initials now explain whether an avatar is missing or the request failed.

Requires DSH **0.2.0-rc.2**. Avatar requests stay limited to known hosts, the repository's own origin, and `/avatar/<32-64 hex>` paths; cross-provider redirects and remotes with embedded credentials are refused.

## 0.5.1 — 2026-10-19

- **命名修正**：组合包注册 ID、Host 插件名称、中英文侧栏标题与插件元数据统一为 `dsh-git-graph`，移除早期的 `ui-git-graph` 注册标识。
- **安装说明**：中英文 README 补充 DSH 官方文档、安装检查、同一 profile 约定，以及失效本地目录链接的 remove / add 重装步骤。
- **发布包**：GitHub Actions 检查和打包成功后自动创建 Release，附带预构建 `.tgz` 与 SHA-256 校验文件，可直接通过 DSH 插件页面或 CLI 安装。

适配 DSH **0.2.0-rc.2**。npm 包名仍为 `dsh-git-graph`。

### English

- Use `dsh-git-graph` for the bundle row, Host plugin name, sidebar titles, and plugin metadata.
- Clarify the official DSH installation workflow, verification, profile selection, and reinstallation after a local checkout moves or is deleted.
- Create a GitHub Release after successful checks and packaging, with a prebuilt `.tgz` and SHA-256 checksums for installation through DSH's plugin page or CLI.

Requires DSH **0.2.0-rc.2**. The npm package name remains `dsh-git-graph`.

## 0.5.0 — 2026-10-10

- **两提交 Diff**：选择基准和目标提交后，点击变更文件即可查看两端的统一 Diff；支持文件树 / 列表、重命名、新增和删除。目标最后一次提交未改动该文件时，仍展示所选范围内的变化。
- **完整历史原文**：历史文件查看器新增“完整原文”模式，可切换旧 / 新版本，查看对应路径、Hash、行号和大小，并复制完整文本。
- **交互改进**：更换基准清除旧文件；原文方向键正常滚动，切换文件或版本忽略迟到响应，复制提示保持简短。

适配 DSH **0.2.0-rc.2**。原文单文件读取上限为 **1 MiB**；二进制与超限文件显示状态。本版本提供统一 Diff 和只读文本查看。

验证：115 项自动测试通过；实际 DSH 中 18 项浏览器检查通过，控制台错误为 0；Git 只读审计通过。详细范围与证据见[验收报告](docs/COMPARE_SOURCE_TEST_REPORT.md)。

### English

- Open each changed file's unified diff between a selected base and target commit, including renames, additions, and deletions.
- Read and copy complete historical text, choose the old or new version, and see its path, commit hash, line numbers, and size.
- Improved file-viewer scrolling, selection changes, and copy hints.

Requires DSH **0.2.0-rc.2**. Full text is limited to **1 MiB per file**; binary and oversized files show their status. Validation: 115 automated tests, 18 browser checks in real DSH, zero console errors, and unchanged Git state.
