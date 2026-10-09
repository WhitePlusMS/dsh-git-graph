# `dsh-git-graph`

[English](README.md)

为 DeepSeek Harness Web 的原生右侧栏提供只读 Git Graph。插件 **0.4.0** 适配 **DSH 0.2.0-rc.2**，2026-10-08 和 2026-10-09 的本地验收均使用该 DSH 版本。

从右侧栏开始页打开图谱，即使是空会话也能查看当前工作区，不需要配置 API Key 或发送对话消息。

[安装或更新](#安装或更新) · [卸载](#卸载) · [快捷键](#快捷键与列宽操作) · [开发](#开发)

![原生右侧栏中的真实作者头像与行内详情](docs/screenshots/display-avatar.png)

## v0.4.0 的显示更新

0.4.0 在 0.3.0 的 P0 优化基础上增加以下显示功能。现有 `v0.3.0` 标签仍保留此前实现；0.4.0 的安装方法见下方说明。

- **只保留行内详情**，在选中的提交行或未提交变更行下面展开，没有底部面板和详情位置设置。
- 三种引用布局：普通排列、分支在左且 Tag 在右、分支靠图且 Tag 在右。同名本地与远端分支仅在指向同一提交时合并，完整名称仍可分别复制。
- 提交正文支持 HTTP(S) 链接、粗体、斜体和行内代码，HTML 保留为字面文本；可以关闭格式化。尚未提供 Issue 链接和 Emoji shortcode。
- 日期栏可切换作者日期 / 提交者日期，详情同时显示两者；统一采用 Git mailmap 的姓名和邮箱。提交签名状态提供文字解释，Git 返回 Key ID 时可以复制。
- **真实作者头像**默认开启，可选择自动 GitHub / Gravatar 或仅 Gravatar。无图片、网络失败或限流时保留首字母头像，支持按仓库关闭。

头像由 DSH Host 获取。GitHub 使用 Git 原始作者邮箱，在 GitHub `origin` 仓库的公开提交中查询；Gravatar 接收 SHA-256 邮箱摘要。Host 最多缓存 128 条，成功缓存 24 小时、失败缓存 15 分钟，重启后清空；不向仓库写入头像文件。验证结果和服务限制见[显示功能验收报告](docs/DISPLAY_TEST_REPORT.md)。

## 主要功能

当前版本包含可调列宽、行与 SVG 几何同步、引用折叠与复制、窄侧栏行内详情、文件 Diff、定位导航，以及上文的 0.4.0 显示更新。

- 在原生右侧栏提供 `Git Graph` 页签、开始页入口和面板全屏。
- 显示提交拓扑、分支、合并和父提交关系；加载范围外的父提交使用虚线。
- 显示本地分支、远程分支、tag 和 HEAD 引用标签，当前分支优先，支持引用折叠、详情完整名单及复制反馈。
- 在图谱头部显示工作区干净或存在未提交变更的状态。
- 跨初始页面搜索 Hash、主题、作者、邮箱、引用名和日期。搜索最多扫描所选历史的 2000 条提交；图谱初始显示 100 条，最多显示 500 条结果。
- 按本地分支名 glob 过滤（如 `main,release-*`，OR 组合），选择是否包含全部 refs。引用类型筛选只保留已加载结果中直接带本地、远端或 Tag 标签的提交。
- 支持日期、作者日期、拓扑三种提交排序，以及仅首父提交模式。
- 选中提交后在**该提交行下方内联展开**详情：Hash、作者、提交者、时间、父提交、签名状态和引用标签，布局对齐 vscode-git-graph。长正文可折叠，Hash、父提交 Hash 和路径可复制，并显示成功或失败反馈。
- 文件变更支持树 / 列表两种视图、文件夹图标与单链目录压缩、按变更类型着色。所有已有文本统计均显示 `(+增|−删)`，包括新增和删除；未知统计明确标为无文本统计，重命名显示前后路径。
- 点击文件查看带新旧行号、分段标题、增删着色及长行横向滚动的逐行 Diff，支持删除文件、重命名、根提交及相对首父的合并提交；明确区分二进制变更。
- 展开 `未提交变更` 行查看工作区文件列表和逐文件 Diff，包括首提交前已暂存的文件。
- 从当前查询已加载的提交中选择两个，比较变更文件清单和已有行数统计。
- 在可折叠的元数据条中查看 Tag 和 Stash 摘要，并复制名称。
- 结果内查找栏：大小写敏感、正则、上一个 / 下一个跳转。
- 显示设置面板：可调列宽、日期 / 作者 / Hash 列开关、日期格式与来源、紧凑 / 完整行高、曲线 / 直线、配色预设、引用对齐与合并、正文格式及头像来源，按仓库持久化。
- 键盘定位后自动滚动到所选提交；HEAD 超出当前可见结果时显示明确提示。
- 中英文实时切换、DSH 明暗主题、窄屏滚动。
- 刷新当前仓库和元数据，保留已打开的工作区文件，且不会生成对话消息或工具轨迹记录。
- 按需加载更多提交，最多读取 500 条。
- 当前目录不是 Git 仓库或仓库尚无提交时显示空状态，不显示错误。

## 当前功能范围

- 插件只读取 Git 数据，未提供 Checkout、分支 / Tag 创建删除、Commit、Merge、Rebase、Push、Pull、Fetch、Stash 修改或 Reset。刷新读取本地仓库；远端跟踪标签是本地记录，不会自动 Fetch。
- 图谱初始加载 100 条提交，手动加载更多，最多 500 条。顶部搜索最多扫描 2000 条；查找栏只搜索当前可见结果。引用类型筛选不等同于完整分支历史选择。
- 两提交比较目前仅显示变更文件清单，未提供该比较的逐文件 Diff、完整版本原文或左右并排 Diff。
- Tag / Stash 条目提供摘要和复制，尚无专属详情或 Stash Diff；未实现 Tag 签名验证。正文格式限于上文列出的行内形式；头像来源支持 GitHub 和 Gravatar。

## 快捷键与列宽操作

| 操作 | 效果 |
| --- | --- |
| `Ctrl/Cmd+F` | 打开当前结果内的查找栏 |
| `Ctrl/Cmd+Shift+F` | 切换显示设置 |
| `↑` / `↓` | 查找栏关闭且查找文本清空时，选择可见提交 |
| `H` | 定位可见 HEAD，超出范围则提示 |
| 提交行或图谱节点上的 `Enter` / `Space` | 选择该提交 |
| 拖拽列分隔线 | 调整列宽 |
| 列分隔线获得焦点后的 `←` / `→` | 每次调整 10px |
| 双击列分隔线 | 恢复该列默认宽度 |

快捷键只在 Git Graph 内获得焦点时生效。查找 / 设置快捷键在内部输入框中也生效；普通导航键不拦截输入框、选择框、可编辑文本或列分隔线。显示设置按仓库单独保存，设置面板可恢复全部默认值。

## 界面截图

0.4.0 英文浅色主题、真实头像与行内详情：

![0.4.0 英文浅色界面](docs/screenshots/display-light-en.png)

<details>
<summary>360px 窄侧栏中的靠图引用与行内详情</summary>

![0.4.0 窄侧栏](docs/screenshots/display-360.png)

</details>

截图来自本地验收过程。详细覆盖范围见 [0.4.0 显示功能报告](docs/DISPLAY_TEST_REPORT.md)；历史 [P0 报告](docs/P0_TEST_REPORT.md) 保留当时的改动前后对比。

## 打开 Git Graph

将插件安装到 DSH Web 使用的 profile，重启该 profile。选择工作区，打开原生右侧栏，在侧栏开始页选择 `Git Graph`；需要更大空间时使用面板的原生全屏按钮。

页面读取当前会话的工作区。刷新直接读取仓库数据，不发送对话消息、不生成对话工具卡片，也不会追加工具轨迹记录。

## Git 数据与路径处理

Host 侧通过固定且不经过 shell 的 subprocess 参数读取 Git 数据，按字面路径匹配，并禁用可选索引更新。界面按需加载仓库状态、HEAD、有数量限制的提交历史、提交详情、文件 Diff、工作区变更和提交比较结果。另有独立 `readFile` Remote API，但界面的文件查看器使用 Diff API。

浏览器查询绑定当前会话工作区，拒绝任意仓库 `path`。独立的模型工具保留以下参数：

```text
git_graph({
  path?: string,          // 仓库目录，默认使用当前会话工作区
  max_commits?: number,   // 1..500，默认 100
  all?: boolean,          // 是否包含所有可达 refs，默认 true
  first_parent?: boolean, // 是否只跟随首父提交，默认 false
  glob?: string[],        // 本地分支名 glob 过滤（OR），提供时覆盖 --all
  search?: string,        // Hash、主题、作者、邮箱、引用名、日期；扫描上限 2000
  sort?: string           // 提交排序：date、author-date 或 topological，默认 date
})
```

模型工具传入的路径只作为 Git subprocess 工作目录，不拼接进 shell 命令。文件请求必须使用仓库相对路径，绝对路径与指向仓库外的路径会被拒绝。侧栏使用当前会话工作区，分别显示非 Git 目录和无提交仓库的空状态；无提交仓库仍可查看已暂存文件。

## 安装或更新

前提：已安装 **DSH 0.2.0-rc.2** 且可使用 `dsh` CLI，DSH Host 上可以执行 Git。创建 `v0.4.0` 标签并推送至 GitHub 后，可从该归档安装到 Web profile；此前使用下方本地包安装步骤。

```powershell
dsh plugin --profile web add https://github.com/WhitePlusMS/dsh-git-graph/archive/refs/tags/v0.4.0.tar.gz
dsh web
```

归档包含已提交的 `lib/` 产物，使用者无需克隆或构建项目。首次 `add` 时，如果名为 `web` 的 profile 不存在，CLI 会按 Web 模板自动创建。更新已运行的 Web profile 前先停止它，执行 `add` 后重新启动；运行中的进程保留启动时加载的包代码。后续版本更新时，将 URL 中的标签替换为目标版本。

全新的自定义 Web profile 可先执行 `dsh --profile my-web --from-default-profile web --dump-config`，再用 `dsh plugin --profile my-web add <归档URL>` 安装，通过 `dsh --profile my-web` 启动。

也可以在本项目目录生成本地安装包：

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm pack --pack-destination .scratch/release
dsh plugin --profile web add ./.scratch/release/dsh-git-graph-0.4.0.tgz
```

已有 `.tgz` 时直接将包路径传给 `dsh plugin --profile web add`。安装后重启 `dsh web`，使 Host 和浏览器端加载新包；使用自定义 profile 时替换命令中的 `web`。

新实现不保留旧 DSH API 兼容。


## 卸载

从 `web` profile 卸载当前包：

```powershell
dsh plugin --profile web remove dsh-git-graph
```

移除后重启该 profile，让运行中的应用卸载插件。CLI 会同时移除包依赖和 bundle 列表项；卸载时使用安装时相同的 profile 名称。

## 开发

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
```

构建将独立 Host 和浏览器端产物写入 `lib/`，安装包不要求检出 Harness monorepo。根 TypeScript solution 分别引用 Host、Client 和测试程序；客户端使用 Cordis effect、类型化本地化、原生侧栏服务和目标 DSH 版本的主题别名。

仓库目前不追踪 `tests/`，新克隆中没有测试文件。仅在保留本地测试集的工作区执行 `pnpm test`；下述数量对应已完成的本地验收，并不表示仓库附带该测试集。

| 验收阶段 | 自动测试 | 浏览器检查 | DSH 运行方式与证据 |
| --- | --- | --- | --- |
| DSH 0.2 适配 | 78 项通过 | 48 项通过 | 官方发布源码构建；[升级报告](docs/DSH_0.2_TEST_REPORT.md) |
| 0.3.0 包含的 P0 显示优化 | 88 项通过 | 56 项通过 | 官方 CLI 发行版、隔离 home/profile；[P0 报告](docs/P0_TEST_REPORT.md) |
| 0.4.0 包含的显示更新 | 106 项通过 | 26 项通过 | 官方 CLI 发行版、隔离 home/profile；[显示报告](docs/DISPLAY_TEST_REPORT.md) |

各行对应不同验收阶段，数量不相加。P0 验收时临时包为 0.1.0，随后纳入 0.3.0；0.4.0 的显示实现于 2026-10-09 验收，当时临时包仍为 0.3.0。两次版本号调整均通过类型检查、构建和打包，没有因版本号变化重复点击验收。本地验证不代表标签已经发布。


## 参考与灵感来源

本项目的诞生与参考完全基于以下开源项目：[vscode-git-graph](https://github.com/mhutchie/vscode-git-graph)，再次对其表示感谢。

## 许可证

MIT
