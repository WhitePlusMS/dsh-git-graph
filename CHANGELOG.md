# Changelog

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
