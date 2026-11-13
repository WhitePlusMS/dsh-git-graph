# dsh-git-graph 与 vscode-git-graph 的功能差距报告

> v0.7.0 已实现直接子模块自动发现和侧栏切换，并通过真实 DSH 0.2.2-rc.1 验证。下面保留 v0.6.2 的对比基线和 v0.5.3 的历史快照。

## 2026-11-13 复核：子模块与 v0.6.2 功能差距

对比对象为 [VS Code Git Graph `mhutchie.git-graph` v1.30.0](https://github.com/mhutchie/vscode-git-graph/releases/tag/v1.30.0) 和本项目 v0.6.2（提交 `2c1d30f`）。结论来自两侧源码、官方文档和本地 Git 夹具。旧报告把仓库切换标为「不适用」。在同一 DSH 会话中切换侧栏读取的仓库即可支持子模块，原有工作区绑定允许承载这项功能。

### 子模块支持：可做，难度中等

VS Code Git Graph 从 v1.15.0 起读取 `.gitmodules` 自动添加子模块。v1.30.0 源码逐个解析已检出模块的 Git 根目录并递归注册，用户在 `Repo` 下拉中切换查看。普通嵌套仓库还可以手动添加，是另一条入口。[v1.15.0 发布说明](https://github.com/mhutchie/vscode-git-graph/releases/tag/v1.15.0) · [上游发现逻辑](https://github.com/mhutchie/vscode-git-graph/blob/881a9e613045bacbbadf8940f6b6c5b8bd699335/src/repoManager.ts#L508-L528) · [上游切换逻辑](https://github.com/mhutchie/vscode-git-graph/blob/881a9e613045bacbbadf8940f6b6c5b8bd699335/web/main.ts#L169-L221)

本项目的 `src/git.ts` 已可按 `cwd` 读取目标 Git 仓库，`src/client/graph-layout.ts` 只需要提交拓扑。缺口在于 `src/remote-service.ts` 和 `src/client/index.ts` 将侧栏请求绑定到会话目录，`src/domain.ts` 的侧栏查询也刻意省略了模型工具可用的 `path`。要切换的是侧栏选中的仓库。每次读取都应在 Host 解析目标，再调用原有读取器。

| 改动 | 建议实现 |
| --- | --- |
| 自动发现 | 在会话所在 Git 根目录读取 `.gitmodules` 的 `submodule.*.path`，使用 Git 配置解析和 NUL 分隔输出。可一次读取索引，用 `160000` 条目确认这些目录确实是子模块。首次打开和手动刷新时重新发现，递归场景只沿已初始化的子模块继续发现。 |
| 仓库选择 | 复用顶栏下拉。在有子模块时显示主仓库和子模块，用相对路径区分同名项。未初始化项可标为不可选。会话若本来就在已初始化的子模块内，首版以它为发现起点，向上查找父仓库可单独加入。 |
| 请求归属 | 侧栏请求携带 Host 发出的仓库标识，由 Host 在当前会话发现的集合内解析。校验目录位于允许的根下，Git 返回的规范化仓库根应与候选目录一致。提交图、详情、原文、Diff、未提交文件、两提交比较、Tag/Stash、头像都绑定同一个标识。同步更新 Host 与浏览器的 Typert 契约。 |
| 切换状态 | 切换时取消上一仓库的请求，关闭详情、比较和工作区面板，重置分支筛选、搜索和分页。按已存在的仓库根路径机制载入显示设置。目标失效时显示不可用，重新选择主仓库后再读。 |

首版建议覆盖直接子模块的发现、切换和现有只读能力，预计 **2–3 个工作日**，含 Host、前端、协议和真实 DSH 回归。要达到上游的嵌套发现体验，预计再加 **0.5–1 个工作日**，主要验证递归、刷新和已失效目录。估时是基于当前结构的工程预估。主仓库和子模块各自保有独立历史。普通嵌套仓库管理、主仓库对子模块提交指针的专用比较可单独评估。[Git 子模块说明](https://git-scm.com/docs/gitsubmodules) · [git-config](https://git-scm.com/docs/git-config) · [git-ls-files](https://git-scm.com/docs/git-ls-files) · [git-rev-parse](https://git-scm.com/docs/git-rev-parse)

**已验证的行为**（Git for Windows 2.48.1，Node 24.22.1，临时本地仓库，直接调用现有读取器）：

- 路径包含中文和空格时，Git 能读出 `.gitmodules` 路径。给现有读取器传入已初始化的子模块目录，可得到其独立历史、提交详情、文件 Diff、未提交文件与子模块专属 Tag。子模块处在 detached HEAD 时也有自己的 HEAD。
- 普通 clone 产生的未初始化子模块目录虽然存在，现有读取器仍会向上找到主仓库，返回主仓库的提交。这是发现时必须核对 Git 根目录的原因。
- 主仓库记录的子模块条目是 `160000` 模式的 Git 提交指针。现有 Diff 在夹具中显示两行 `Subproject commit` 指针变化，历史原文读取会报错。若后续要点开指针并查看两个子模块版本之间的文件差异，需要独立处理 gitlink。上游普通 Diff 走文件内容提供器，另有此诉求的开放议题。[上游 Diff 内容提供器](https://github.com/mhutchie/vscode-git-graph/blob/881a9e613045bacbbadf8940f6b6c5b8bd699335/src/diffDocProvider.ts) · [上游议题 #944](https://github.com/mhutchie/vscode-git-graph/issues/944)

本轮验证范围是读取器。以后验收侧栏功能时，需要在真实 DSH 中跑主仓库 → 子模块 → 主仓库，覆盖快速连续切换、两个仓库存在同路径文件、无子模块的单仓库、未初始化模块、失效模块和 detached HEAD。递归实现后加入已初始化和未初始化的多层模块。

### 其他功能差距

以下比较以 v0.6.2 已有功能为基础。当前版本已经提供可搜索的本地和远端分支面板、筛选与排序、两提交逐文件 Diff、完整历史原文和按仓库保存显示设置。差距集中在以下具体能力。上游配置和行为见 [扩展功能与命令](https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph) · [官方设置](https://github.com/mhutchie/vscode-git-graph/wiki/Extension-Settings) · [v1.30.0 视图源码](https://github.com/mhutchie/vscode-git-graph/blob/881a9e613045bacbbadf8940f6b6c5b8bd699335/web/main.ts)。

| 能力 | 本项目当前差距 | 补齐难度 |
| --- | --- | --- |
| 仓库管理 | 没有自动发现子模块、仓库切换、手动添加或移除普通嵌套仓库。 | 中。先做子模块。 |
| 分支筛选和默认视图 | 已有单分支聚焦和手输 glob。缺界面多选、命名 glob 预设、隐藏远端分支、按仓库记住分支筛选和排序、指定打开时的分支。 | 低至中。多选可复用 Host 的 `branches` 数组。 |
| 提交图导航 | 父提交只可复制 Hash，缺点击跳转、沿父子关系的快捷键、节点悬停显示哪些分支/Tag/Stash 包含该提交、弱化不属于 HEAD 历史的提交。 | 父提交点击跳转低，图关系和可达性中。 |
| 工作区比较 | 已有两提交比较，未提交变更只能和 HEAD 或空树比较。缺和任意历史提交比较。 | 中。需定义已跟踪、未跟踪文件的显示范围。 |
| Tag 和 Stash | 已有底部列表。缺 annotated Tag 的完整详情、Stash 图节点、快捷跳转、Stash 详情和文件 Diff。上游源码还有 Stash 的未跟踪文件处理。 | Tag 详情低，Stash 中。 |
| 分页和历史来源 | 目前手动加载，每次增加 100 条，最多加载 500 条。缺滚动自动加载、可配初始量和步长、可选纳入 reflog 引用的提交、独立显示选项控制 Stash 或仅由 Tag 引用的提交。 | 设置低至中。提高读取上限需单独验证性能。 |
| Diff 与文件查看 | 已有单列 hunk Diff 和完整原文。缺 VS Code 原生 Diff 提供的并排、语法高亮体验，以及扩展提供的工作区文件对比入口、绝对路径复制、历史文件编码选择。 | 复制路径低，并排、高亮和多编码中至高。 |
| 审阅进度 | 缺本地记录每个提交或比较中哪些文件已审阅、上次看了哪个文件，以及跨会话恢复。 | 中。 |
| 正文、查找和显示 | 缺 emoji 短码、自定义 Issue 自动链接、正文中的提交 Hash 跳转、底部固定详情面板、更多可配置快捷键。现有查找已联动选中并打开详情，面板内仍缺按日期匹配。 | 低至中。 |

可优先做 **子模块发现与切换 → 父提交跳转和 Tag 详情 → 任意提交与工作区比较、Stash Diff**。父提交和 Tag 数据已经在 Host 返回，增加入口即可。上游另有分支切换、合并、Rebase、Cherry-pick、Reset、Fetch/Pull/Push、Tag 和 Stash 写操作、远端配置管理，以及预填 PR 链接、导出归档和仓库配置。状态栏、命令面板、源码管理入口、集成终端和外部目录 Diff 则依赖 VS Code 宿主或本地工具。这些能力可按项目的只读定位和 DSH 使用场景单独判断。[上游功能与命令](https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph)

---

## 0. 证据与方法（先说明可信度）

**vscode-git-graph 一侧**

`docs.mhutchie.com`、`raw.githubusercontent.com`、`api.github.com`、`open-vsx.org`、`marketplace.visualstudio.com`、`cdn.jsdelivr.net` 在本机均返回
`resolves to a non-public IP address`，无法抓取。`web_search` 只返回了候选 URL 而没有摘要正文。

因此改用**直接克隆仓库读源码**（`github.com` 可达）：

```
git clone --depth 1 https://github.com/mhutchie/vscode-git-graph
# package.json: "version": "1.30.0", "engines": { "vscode": "^1.38.0" }
```

实际读取的文件：`README.md`、`package.json`（`contributes` 全量）、`web/main.ts`（3580 行上下文菜单/工具栏/键盘）、
`web/findWidget.ts`、`web/graph.ts`（顶点悬停提示）、`web/dropdown.ts`、`web/settingsWidget.ts`、
`src/utils.ts`（`viewDiff`）、`src/diffDocProvider.ts`、`src/dataSource.ts`、`src/gitGraphView.ts`。

**本项目一侧**

读取了 `src/domain.ts`、`src/git.ts`、`src/client/GitGraphView.tsx`、`src/client/settings.ts`、`src/client/styles.ts`、
`src/client/RichMessage.tsx`、`src/typert.shared.ts`、`src/avatars.ts`、`README.zh.md`。

**重要状态说明（写作期间仓库正在变动）**：本项目工作区当前处于**未提交改动中**（基线提交 `ef309a5` / v0.5.3）。
我在写这份报告的过程中，`git status` 里的被改文件从 5 个变成了 6 个，`src/client/GitGraphView.tsx` 新增了约 486 行改动，
落地了一整套「Sheet 浮层 + 分支选择 + 筛选面板 + Escape」。

因此本报告采用**双时间线**写法：

- **第 2 章表格的主体**以**已提交的 v0.5.3 行为**为本项目基线（稳定、可复核）；
- 凡是这轮未提交改动已经影响的结论，我在表格里标 **〔WIP〕**，并在**第 6 章**单独记录我在改动过程中实际看到的实现；
- 第 3 章的补齐清单据此重排：已经被这轮改动做掉的项目，标注为**已完成 / 已部分完成**。

**观察时间窗**：本项目源码的观察时间为 **2026-10-21 22:35–22:46**。这段时间内工作区被持续修改
（`src/` 6 个文件 + `lib/` 构建产物），因此本报告对「本项目」的描述只在上述时间窗与所列文件内容范围内成立。

**搜索摘要的作用**：仅用于发现仓库地址；本报告对 vscode-git-graph 的所有具体结论都来自上表源码，不依赖搜索摘要。

---

## 1. 一句话结论

vscode-git-graph 是「右键菜单 + Ctrl/Cmd 点选」驱动的**可写 Git 客户端**（81 项有效配置、58 个右键动作、7 类目标各有专属菜单），
而本项目 v0.5.3 是「一条工具栏 + 单点行内面板」驱动的**只读查看器**（15 个显示设置、0 个右键菜单、9 个只读 RPC）；
两者的真实差距不在 Git 能力，而在**把已有数据接到交互上的那一层**：入口组织（对象级菜单 vs 页面级按钮）、
选中模型（两个选中态 + 修饰键 vs 单选中 + 下拉）、呈现深度（整文件原生 diff vs 自绘 hunk diff、Tag/Stash 详情、悬停提示）。
补充：写作期间项目正在落地的 Sheet/分支选择改造，恰好把「最像 vscode 的那一块」（分支选择与筛选面板）补上了，
剩下最硬的结构性差距就是**没有任何右键菜单**。

---

## 2. 逐项对比表

差距类型定义：`已有` = 两边都有（差异写在备注里）；`可只读补齐` = 不需要任何写操作即可实现；
`需写操作（本项目只读，不做）` = 实现即违反只读定位；`不适用` = 平台差异导致无意义。

### 2.1 工具栏、筛选与排序

| 能力 | vscode-git-graph | 本项目 | 差距类型 |
| --- | --- | --- | --- |
| 分支筛选方式 | 顶栏 `Branches` **多选下拉**：含 `Show All`、`Filter Branches...` 输入框（`web/dropdown.ts` 过滤输入）、`git-graph.customBranchGlobPatterns` 预设分组；选中分支被逐个追加为 `git log` 的 rev 参数，`Show All` 则展开为 `--branches --tags (--reflog) (--remotes) <stash base hashes…> HEAD`（`src/dataSource.ts:1499-1531`） | v0.5.3：顶栏一个**分支 glob 文本框**（逗号分隔多个），Host 用 `for-each-ref refs/heads` + `branchNameMatches` 展开为 rev 参数（`src/git.ts:244-279,337-361`）。**〔WIP〕** 未提交改动已加 `BranchSheet`：可搜索、本地/远端分组、当前分支徽章、tip 短 hash、选中即聚焦该分支（单分支，`branches: [name]`），带「显示全部分支」清除 | 可只读补齐 → **〔WIP〕基本落地**（仍差：多分支同时选中、glob 预设分组） |
| 引用类型筛选 | 无独立控件（远端分支靠 Branches 下拉 + `showRemoteBranches` 复选框） | 下拉 `全部/本地分支/远端分支/Tag`，**仅在已加载结果上客户端过滤**（`GitGraphView.tsx:60-62`）。**〔WIP〕** 已移入 `FilterSheet`，并显示生效筛选数量 | 已有（本项目独有） |
| 全历史搜索 | **没有**全历史搜索；Find Widget 只搜已加载提交 | 顶栏搜索框，Host 扫最多 `SEARCH_CAP = 500×4 = 2000` 条，匹配 hash/subject/作者/邮箱/引用名/作者与提交日期（`src/git.ts:224-236,364,388-392`），350ms 防抖 | 已有（**本项目更强**） |
| 查找（Find） | `Ctrl/Cmd+F` 打开 Find Widget：大小写、正则、上一/下一、位置计数、「打开当前匹配的提交详情」（`web/findWidget.ts`）；匹配 commit message/作者/**日期**/hash/分支/tag | `Ctrl/Cmd+F` 打开查找条：大小写、正则、上一/下一、计数、清除；匹配 subject/作者/邮箱/hash/引用名（`commitMatchesFind`，**不含日期**） | 已有（本项目缺「日期」与「打开详情」联动） |
| 排序 | **列头右键菜单**三选一（Commit Timestamp / Author Timestamp / Topological），**每仓库持久化**，全局默认 `git-graph.repository.commits.order` | 工具栏下拉三选一，会话内有效，**不持久化**（`buildRequest`）。**〔WIP〕** 下拉已移入 `FilterSheet`（「筛选」按钮 + 生效项计数徽章） | 已有（缺持久化，`可只读补齐`） |
| 显示远端分支开关 | `showRemoteBranches`（全局默认 + 下拉中每仓库复选框） | 无开关，远端引用始终作为 ref 显示 | 可只读补齐（低价值） |
| 加载更多 | `Load More Commits` 按钮 **或**滚到底自动加载（`loadMoreCommitsAutomatically`，`web/main.ts:2008-2013`），初始/步长可配 | 「加载更多」按钮，每页 100，上限 500（`MAX_COMMITS`），**无自动加载** | 已有（缺自动加载与可配步长） |
| 仓库切换 | 仓库下拉，`.gitmodules` 自动发现子模块，普通嵌套仓库可手动添加 | 绑定当前 DSH 会话工作区，单仓库，无切换 | 可只读补齐，见 2026-11-13 复核 |
| 仓库级初始分支 | `onLoad.showCheckedOutBranch`、`onLoad.showSpecificBranches`、`onLoad.scrollToHead` | 无（固定 `--all` 或 HEAD） | 可只读补齐（低价值） |
| 状态栏 / 命令面板入口 | `ShowStatusBarItem`、`git-graph.view` 等 10 个命令、SCM 标题按钮 | DSH 原生右侧栏插件页签 | 不适用 |

### 2.2 分支与提交操作

| 能力 | vscode-git-graph | 本项目 | 差距类型 |
| --- | --- | --- | --- |
| 分支右键菜单 | 12 项：Checkout、Rename、Delete（可连带远端）、Merge into current、Rebase current onto、Push（Normal/ForceWithLease/Force + Set Upstream）、View Issue、Create Pull Request、Create Archive、Select/Unselect in Branches Dropdown、Copy Branch Name（`web/main.ts:971-1096`） | **无右键菜单**（客户端全文件无 `contextmenu` 监听） | 需写操作（本项目只读，不做）；其中 Copy / Select-in-dropdown 属 `可只读补齐` |
| 远端分支右键菜单 | 11 项：Checkout、Delete Remote Branch、Fetch into local branch、Merge、Pull、View Issue、Create Pull Request、Create Archive、Select/Unselect、Copy Name | 无 | 需写操作（本项目只读，不做） |
| 提交右键菜单 | 11 项：Add Tag、Create Branch、Checkout、Cherry Pick（含 merge commit 选 parent、Record Origin、No Commit）、Revert（merge 选 parent）、Drop、Merge into current、Rebase current on this Commit、Reset current branch（Soft/Mixed/Hard）、Copy Commit Hash、Copy Commit Subject（`web/main.ts:1099-1237`） | 无右键；详情面板内只有「复制 Hash」「比较提交…」两个动作 | 需写操作（本项目只读，不做）；`Copy Subject`、`Copy Hash` 属 `可只读补齐` |
| 双击分支标签 | 直接 checkout 该分支（`web/main.ts:2241-2274`） | 无 | 需写操作（本项目只读，不做） |
| Tag 右键菜单 | 5 项：View Details（annotated）、Delete、Push、Create Archive、Copy Tag Name | 无右键 | 需写操作（本项目只读，不做）；View Details / Copy 属 `可只读补齐` |
| Stash 右键菜单 | 6 项：Apply、Create Branch from、Pop、Drop、Copy Stash Name、Copy Stash Hash | 无右键 | 需写操作（本项目只读，不做）；Copy 属 `可只读补齐` |
| 未提交变更右键菜单 | 4 项：Stash uncommitted changes、Reset uncommitted changes（Mixed/Hard）、Clean untracked files、Open Source Control View | 无右键；「未提交变更」行点击展开文件清单 | 需写操作（本项目只读，不做）；Open SCM 属 `不适用` |
| 右键菜单可见性 | `git-graph.contextMenuActionsVisibility`：**58 个动作**（branch 12 / commit 11 / remoteBranch 11 / commitDetailsViewFile 9 / stash 6 / tag 5 / uncommittedChanges 4）可逐项隐藏 | 无右键菜单，故无此设置 | 不适用（若将来加菜单再考虑） |

### 2.3 Diff 能力

| 能力 | vscode-git-graph | 本项目 | 差距类型 |
| --- | --- | --- | --- |
| 两提交比较的入口 | **先点提交 A 打开详情，再 `Ctrl/Cmd` 点提交 B** → 比较视图；再 Ctrl 点 B 取消（`web/main.ts:2217-2236`） | 详情面板「比较提交…」按钮 → 面板内 `<select>` 选**基准**，目标 = 当前提交（`GitGraphView.tsx:896-965`）；基准只能从已加载提交里选 | 已有（入口模型不同，能力近似） |
| Diff 渲染方式 | 调用 VS Code 原生 diff 编辑器：`vscode.commands.executeCommand('vscode.diff', …)`，两侧内容由虚拟文档 `git-graph://` 提供**整文件内容**（`src/utils.ts:418-439`、`src/diffDocProvider.ts:49-72`） | **自绘** hunk 视图：`git diff --unified=3` 解析成行级记录（old/new 行号 + 标记），单列展示（`src/git.ts:912-991`、`DiffBody`） | 已有 |
| 左右并排 | 由 VS Code diff 编辑器决定（扩展本身不提供开关） | 无并排，只有单列统一 diff | 可只读补齐（纯前端工作量） |
| 语法高亮 | 由 VS Code 原生提供 | 无（纯文本 `pre`） | 可只读补齐（需引入高亮器） |
| 空白字符处理 | **没有相关设置**（110 个配置键中无 whitespace 相关项，已核实） | 无 | 可只读补齐（`git diff -w`） |
| Diff 上下文行数 | 无 hunk 概念（整文件对比，上下文由编辑器呈现） | 固定 `--unified=3`（`src/git.ts:978,1050`），用户不可调 | 可只读补齐（`--unified=N`） |
| 外部 diff 工具 | 「Open External Directory Diff」→ `git difftool --dir-diff`，工具名取自 `diff.tool`/`diff.guitool`（`src/dataSource.ts:1268`、`web/main.ts:3116-3128`） | 无 | 不适用（需拉起外部 GUI 程序） |
| 文件级 diff 入口 | 点击详情/比较视图里的文件即打开 diff；文件右键「View Diff」 | 点击文件行 → 行内文件查看器（Diff / 完整原文 切换） | 已有 |
| 与工作区文件比较 | 「View Diff with Working File」 | 未提交变更面板里对单文件做 vs HEAD 的 diff | 已有（入口位置不同） |
| 未提交变更 vs 任意提交 | 支持（README 明示「compare the uncommitted changes with any commit」） | **不支持**：`compare` 只接受 40 位 hash；未提交只能 vs HEAD/空树（`src/git.ts:1002-1072`） | 可只读补齐（用 `WORKTREE` 哨兵扩展 compare 协议） |
| 二进制 / 超大文件 | 二进制不可 diff（提示），文件编码可配 `git-graph.fileEncoding` | 二进制/超限有明确提示；单文件 1 MiB 上限（`FILE_MAX_BYTES`），`truncated` 不冒充完整内容 | 已有（本项目缺编码选择） |
| 「文件最后查看」标记 | 有（`#cdvLastFileViewed` 眼睛图标） | 无 | 可只读补齐（纯本地状态） |
| 代码审查（Code Review） | 开始/结束审查，未看文件加粗，看过取消加粗，跨会话持久化、90 天过期（README + `web/main.ts:3141-3149`） | 无 | 可只读补齐（纯本地状态，不碰仓库） |

### 2.4 文件操作与提交详情

| 能力 | vscode-git-graph | 本项目 | 差距类型 |
| --- | --- | --- | --- |
| 打开文件 | 「Open File」在编辑器打开当前版本；「View File at this Revision」打开历史版本；diff 编辑器标题栏还有 `git-graph.openFile` 按钮 | 无编辑器可打开；提供「完整原文」查看器（`git cat-file blob`，带行号/大小/版本切换/复制） | 不适用（DSH Web 无文本编辑器）；历史版本查看已 `已有` |
| 复制路径 | 「Copy Absolute File Path」「Copy Relative File Path」两项 | 复制**仓库相对路径**（`change.newPath`），文件行、文件查看器、原文工具栏各有按钮 | 已有（缺绝对路径，`可只读补齐`） |
| 文件树 / 列表 | 两种视图，`commitDetailsView.fileView.type` 设默认，`fileTree.compactFolders` 压平单子目录 | 两种视图（Tree/List 切换），`buildFileTree` 也做单子目录压平（`GitGraphView.tsx:404-448`），但**无开关** | 已有（缺 compact 开关） |
| 作者 / 提交者 | 作者 + 提交者（含邮箱 mailto 链接），两者日期不同时才显示作者日期 | 作者（含邮箱）、作者日期、提交者、提交者日期；全部常显 | 已有 |
| 签名状态 | 图标 + tooltip（`git-graph.repository.commits.showSignatureStatus` 可关），GPG / X.509 | 文本状态 + 签名者 + GPG Key（可复制），**无开关**（`src/git.ts:424-427`） | 已有（显示更全，缺图标/开关） |
| 父提交 | 可**点击跳转**到该父提交（已加载时；`web/main.ts:2551-2558`） | 只显示短 hash + 复制按钮，**不能跳转** | 可只读补齐（零成本，纯前端） |
| 复制 Hash / Key | Copy Commit Hash（右键）、Copy Tag/Stash/Branch Name | 详情面板复制 Hash、复制签名 Key、复制引用名、复制路径 | 已有 |
| 提交正文格式化 | Markdown 子集 + emoji 短码（含 gitmoji，`customEmojiShortcodeMappings`）+ URL + Issue Linking + 提交号引用 | 粗体/斜体/行内代码/裸 URL 自动链接（`RichMessage.tsx`），无 emoji、无 Issue 链接、无 `#hash` 引用解析 | 可只读补齐（emoji / commit 号 / issue 链接均可只读实现） |
| 头像 | GitHub / GitLab / Gravatar，可关，开启时提示会外发邮箱（`src/avatarManager.ts`） | GitHub（含 noreply）、仓库所在 Git 服务 `/avatar/<hash>`（Gitea/Gogs）、Gravatar，首字母回退，可关（`src/avatars.ts`） | 已有（本项目多一个 host 来源） |
| 详情面板位置 | `Inline` 或 `Docked to Bottom`（可拖高度） | 仅行内插入在选中行下方 | 已有（缺 docked 模式，非必需） |
| 图表顶点悬停提示 | 悬停 100ms 显示：是否包含在 HEAD、包含该提交的分支 / tag / stash（`web/graph.ts:778-849`） | 只有节点 `<title>` 与行内引用标签，无「是否祖先于 HEAD」提示 | 可只读补齐 |

### 2.5 Tag / Stash / Reflog

| 能力 | vscode-git-graph | 本项目 | 差距类型 |
| --- | --- | --- | --- |
| Tag 在图上显示 | 有（图上 ref 标签，右键有菜单） | 有（`refs` 含 `tag`，支持「标签右置」布局） | 已有 |
| Tag 详情 | 「View Details」对话框：tag 名、tagger 名/邮箱/日期、消息、签名 | **数据已读到但没用起来**：`GitGraphTagDetails`（objectHash/tagger/taggerEmail/taggerDate/message/signature）只出现在 `title` 提示里 | 可只读补齐（数据已在手，缺一个详情面板） |
| Tag 签名验证 | 2026-11-13 复核：上游有提交签名状态，annotated Tag 详情的读取未执行独立的 Tag 签名校验 | 只把 `%(contents:signature)` 存在性记为 `E`（无法校验） | 属于独立增强项 |
| Tag 操作 | Delete、Push、Create Archive；可配签名 `repository.sign.tags` | 无 | 需写操作（本项目只读，不做） |
| Tag 列表 | 无独立列表（散在图与下拉里） | **有**可折叠的 Metadata 条：Tag 列表（annotated 带 ⚑）+ 复制 | 已有（本项目独有） |
| Stash 在图上 | 作为图上的**节点/行**参与布局：`git log` 的 rev 列表里显式加入每个 stash 的 `baseHash`，stash 自身信息来自 `git reflog --format=… refs/stash`（`src/dataSource.ts:1523-1525,1614`），支持 `Ctrl/Cmd+S` 上/下一个 stash 跳转 | 仅底部 Metadata 条列出 `stash@{n}`，不入图、不可跳转 | 可只读补齐（`loadStashes` 已带回 baseHash/untrackedFilesHash） |
| Stash 内容 diff | 无专门 stash diff 入口（stash 作为提交节点，可走提交详情/比较）——**未经核实**其 stash 节点点击行为 | 无 | 可只读补齐（`git diff <base> <stash>` 或 `git stash show -p`） |
| Reflog | 只有 `includeCommitsMentionedByReflogs` 开关（`git log --reflog`，`src/dataSource.ts:1512`），**无独立 reflog 视图** | 无 | 可只读补齐（低成本加 `--reflog`） |
| 未跟踪文件开关 | `repository.showUntrackedFiles` | 未提交面板固定 `--untracked-files=all` | 可只读补齐（低价值） |

### 2.6 键盘、可访问性、主题

| 能力 | vscode-git-graph | 本项目 | 差距类型 |
| --- | --- | --- | --- |
| 视图内快捷键 | 4 个**可配置**：`Ctrl/Cmd+F` 查找、`Ctrl/Cmd+R` 刷新、`Ctrl/Cmd+H` 滚到 HEAD、`Ctrl/Cmd+S`/`+Shift` 上/下一个 stash（`web/main.ts:2076-2092`） | `Ctrl/Cmd+F` 查找、`Ctrl/Cmd+Shift+F` 设置、`H` 定位 HEAD、`↑/↓` 选提交、`Enter/Space` 选中、列宽处 `←/→`（`GitGraphView.tsx:1466-1497`）；**不可自定义** | 已有（缺可配置 + 刷新快捷键） |
| Escape | 关闭右键菜单 / 对话框 / 详情（`web/main.ts:2028-2109`） | v0.5.3 无 Escape 处理；**〔WIP〕已实现**：按层回退（先关 Sheet，再关查找），见未提交的 `GitGraphView.tsx` Escape 分支 | 已有（`〔WIP〕`） |
| 详情内方向键导航 | `↑/↓` 上下提交、`Ctrl+↑/↓` 沿父子提交走、`+Shift` 走另一侧分支 | `↑/↓` 线性切换选中行 | 已有（缺「父/子」图遍历） |
| 对话框键盘 | `Enter` 提交主操作、`Escape` 关闭 | v0.5.3 无对话框体系（内联面板/原生表单）；**〔WIP〕** 已有 `Sheet`（`role=dialog`）外壳与 Escape 关闭，但是否支持 Enter 提交主操作**未经核实** | 已有（`〔WIP〕`，Enter 待核实） |
| 无障碍 | `enhancedAccessibility` 开关：色盲情况下显示 A/M/D/R/U 文字标记；其余靠 DOM 结构 | 默认就有 A/M/D/R/U 文字徽标、`role=button/tree/separator`、`aria-pressed/expanded/valuenow`、复制按钮 `aria-live` | 已有（**本项目默认更完整**） |
| 主题适配 | 用 VS Code 主题变量 + `tabIconColourTheme` + `graph.colours` 自定义 | 用 DSH 设计变量 `--dsw-alias-*`（`styles.ts:185-191`）自动明暗；调色板 `classic/accessible` 二选一 | 已有（缺自定义颜色） |
| 图形样式 | `graph.style`：rounded / angular；`graph.uncommittedChanges`：未提交变更画成圆还是画在 HEAD 上 | `lineStyle`：curved / straight；未提交变更固定画在 HEAD 上方 | 已有 |

### 2.7 设置项

| 能力 | vscode-git-graph | 本项目 | 差距类型 |
| --- | --- | --- | --- |
| 配置规模 | **110 个配置键**：29 个带 `deprecationMessage` 的旧名 + 81 个有效设置 | **15 个显示设置**（`GitGraphDisplaySettings`，`settings.ts:27-44`） | 差距约 5 倍，但多数 vscode 项是写操作/编辑器集成相关 |
| 组织方式 | VS Code 设置面板（点分命名空间：`repository.*`、`commitDetailsView.*`、`dialog.*`、`graph.*`、`keyboardShortcut.*`）+ 视图内「Repository Settings」部件（仓库名、初始分支、Show Stashes/Tags、reflog、first parent、远端增删改/抓取/清理/隐藏、Issue Linking、Pull Request、导出仓库配置） | 视图内「设置」面板，6 个分组（引用/日期/作者/列/图形 + 提示），**每仓库**存 `localStorage`（key 为仓库路径稳定哈希） | 已有（组织思路接近，规模不同） |
| `dialog.*` 默认值（13 项） | 有（Add Tag/Apply Stash/Cherry Pick/Create Branch/Delete Branch/Fetch/Pull/Rebase/Reset/Stash… 的默认勾选） | 无表单默认值：v0.5.3 没有对话框，**〔WIP〕** 的 Sheet 也只承载只读选择（分支/筛选/设置），没有需要默认勾选的写操作表单 | 不适用 |
| 视图状态持久化 | 列宽、列可见性、排序、分支过滤、详情高度、滚动位置均可按仓库持久化 | 仅显示设置持久化；**排序 / glob / 引用筛选 / 页大小不持久化** | 可只读补齐（复用现有 storage key 机制） |
| 设置项与只读定位冲突 | `repository.sign.*`、`fetchAndPrune*`、`integratedTerminalShell`、`openNewTabEditorGroup` 等只能用于写/编辑器集成 | 无 | 不适用 |

---

## 3. 「可只读补齐」清单（按用户价值排序）

每条给出所需数据/命令。**这些都不需要任何写操作**。

1. **分支下拉（列表 + 搜索 + 聚焦 + 跳到 tip）** —— 价值最高，直接对齐 vscode-git-graph 的主筛选入口。
   **状态：写作期间已基本落地（未提交）**。数据：`git for-each-ref --format='%(refname)%00%(objectname)%00%(refname:short)%00%(symref)' refs/heads refs/remotes`
   → `{ name, hash, kind, isCurrent }`（`parseBranches`/`loadBranches`）；查询侧 `branches: string[]`（精确名，上限 `MAX_BRANCH_FILTER = 64`）；
   UI 为 `BranchSheet`（搜索 + 本地/远端分组 + 当前徽章 + tip hash + 聚焦）。**剩余差口**：vscode 支持多选与 glob 预设分组，本项目一次只聚焦一个分支。

2. **父提交 / 引用可点击跳转** —— 零成本、高频。数据：`GitGraphCommit.parents` 已在快照里；
   在 `commitLookup` 中命中即滚动并选中，未加载时可回退为「复制 hash」。

3. **Tag 详情面板（annotated）** —— 数据已经在手，只是没展示。数据：`GitGraphTagDetails`
   （`loadTags` + `parseAnnotatedTagDetail`，字段 objectHash/tagger/taggerEmail/taggerDate/message/signature）；
   签名若需真实状态再加 `git verify-tag --raw <tag>`。

4. **Stash 只读呈现与 diff** —— 数据：`loadStashes` 已有 `selector/hash/baseHash/untrackedFilesHash/author/email/date/message`；
   内容 diff 用 `git diff <baseHash> <stashHash>`（或 `git stash show -p <selector>`，需确认参数只读性）；
   可选把 stash 画成图上的行（对齐 vscode 的 stash 节点与 `Ctrl/Cmd+S` 跳转）。

5. **未提交变更 vs 任意提交** —— 数据/命令：`git diff <baseHash> --`（工作区侧）、`git diff <baseHash>`（索引+工作区）；
   协议上给 `compare` 增加 `WORKTREE` 哨兵（`src/git.ts` 已有 `WORKTREE_HASH` 常量，但只用于 file diff 的返回侧）。

6. **提交详情里的悬停/起点提示：该提交是否祖先于 HEAD、哪些分支/tag 包含它** ——
   命令：`git merge-base --is-ancestor <hash> HEAD`（批量可用 `git log --format=%H HEAD..` 反推），
   或一次性算 `git for-each-ref --contains <hash> --format='%(refname:short)' refs/heads refs/tags refs/remotes`。

7. **Diff 上下文行数可调 + 忽略空白** —— 命令：`git diff --unified=N`、`git diff -w`；只是把两个参数暴露成 UI。

8. **复制提交标题（subject）与绝对路径** —— 数据已在快照（`subject`）与 Host（`repositoryRoot`）：
   `git rev-parse --show-toplevel` 拼出绝对路径。

9. **快捷键可配置（Escape 已随 WIP 落地）** —— Escape 按层回退已在未提交改动里实现；
   剩下的是「快捷键自定义 + 补一个刷新快捷键」，纯前端；配置沿用 `settings.ts` 的每仓库存储。

10. **排序 / 分支筛选 / 引用筛选 / 页大小持久化** —— 纯前端，复用 `stableRepoId()` 存储键。

11. **正文增强：emoji 短码、`#<hash>` 提交引用自动链接、Issue Linking** —— 纯前端 + 已加载提交表查找；
    Issue 规则可仿 vscode 的 `issueLinkingConfig`（正则 + URL 模板），全部离线。

12. **Reflog 提交开关** —— 命令：`git log --reflog`（必要时 `git reflog show --format=%H` 取集合）。成本极低。

13. **代码审查标记（本地）** —— 无需 Git 命令，纯 `localStorage` 状态 + 文件行加粗。

14. **语法高亮 / 左右并排 diff** —— 前端工程量最大；数据侧只需把两侧整文件内容读出
    （现有 `readFile` + `cat-file blob` 已能取到 old/new 全文，注意 1 MiB 上限）。

**明确不做（写操作）**：checkout、create/rename/delete branch、merge、rebase、cherry-pick、revert、reset、drop、tag 增删推、
stash push/apply/pop/drop、fetch/pull/push、clean、git archive、difftool、终端、远端配置增删改。

---

## 4. 交互方式专章：vscode-git-graph 如何组织，本项目如何组织，差在哪

### 4.1 vscode-git-graph：四个层次，「对象 → 菜单」而不是「页面 → 按钮」

**第 1 层：顶栏控制条（`#controls`）**
仓库下拉（单仓库时隐藏）→ `Branches` 多选下拉（`Show All` + 过滤输入框 + 自定义 glob 分组）→ `Show Remote Branches` 复选框
→ `Refresh` → `Fetch (& Prune)` → `Find` → `Settings`（齿轮，打开 Repository Settings 部件）→ `Terminal`。
按钮语义由 `renderFetchButton()` 根据有无远端启用/禁用（`web/main.ts:933-941,148-162`）。

**第 2 层：列头右键菜单**
列头既是拖拽调宽的手柄，也是「视图选项」入口：三个列显隐复选项 + 三个提交排序单选项，
排序选择**按仓库保存**并触发重新加载（`web/main.ts:1808-1865`）。

**第 3 层：表格内的上下文敏感右键（核心设计）**
同一张表里，右键命中不同 DOM 目标就换整套菜单（`web/main.ts:2278-2345`）：

- `.gitRef` + 是 stash → stash 菜单（6 项）
- `.gitRef` + 是 tag → tag 菜单（5 项，`View Details` 仅 annotated 可见）
- `.gitRef` + 是 head → 分支菜单（12 项）
- `.gitRef` + 是 remote → 远端分支菜单（11 项）
- 未提交变更行 → 未提交菜单（4 项）
- 普通提交行 → 提交菜单（11 项）
- 详情/比较视图里的文件行 → 文件菜单（9 项，`View Diff` / `View File at this Revision` / `View Diff with Working File` / `Open File` / 审查标记 / `Reset File to this Revision` / 复制绝对/相对路径）

菜单本身带分组（`ContextMenuActions` 是**二维数组**，渲染时用分隔线隔开逻辑组），并按 `contextMenuActionsVisibility` 逐项显隐。
**选中模型**：单击提交 = 打开详情；详情打开后再 `Ctrl/Cmd` 单击另一提交 = 打开比较（同一目标再点 = 取消）；
双击分支标签 = 直接 checkout。也就是说「比较」不是按钮，而是**选中态的第二种修饰符**。

**第 4 层：视图内联部件**

- 提交详情（CDV）：`Inline`（插在提交行后）或 `Docked to Bottom`，可拖高度，自带关闭/代码审查/文件树/文件列表/外部 diff 按钮（`web/main.ts:2535-2584`）。
- Find Widget：浮层，`Ctrl+F` 打开，含 `Aa`/`.*`/位置计数/上一/下一/「打开当前匹配的详情」。
- Repository Settings 部件：仓库名、初始分支、Show Stashes/Tags、reflog、first parent、远端表格（fetch/prune/edit/delete/hide）、Issue Linking、Pull Request、导出仓库配置。

**总特征**：**能力挂在对象上**（分支/提交/tag/stash/文件各自有菜单），全局选项挂在控制条和列头上，选中态用修饰键扩展语义。

### 4.2 本项目（v0.5.3）：一条工具栏 + 单点行内面板

- **工具栏（一个 `role="toolbar"` 行）**：搜索框 → 分支 glob 框 → 引用类型下拉 → 排序下拉 → 「全部引用」「仅第一父」复选框 → `查找`/`设置`/`刷新` 按钮（`GitGraphView.tsx:1549-1573`）。
  控件全是**扁平表单控件**，没有下拉面板、没有分组菜单。
- **选中模型**：单击行或图节点 = 选中（再点取消），选中行下方插入 `inlineDetails`；同一时刻只允许一个展开（未提交变更 或 提交详情 二选一，`selectCommit`/`toggleWorkingTree`）。
- **提交详情**：`<dl>` 键值表（Hash / 作者 / 作者日期 / 提交者 / 提交者日期 / 签名 / Key / 父提交 / 引用）→ 正文 `<details>` → 文件变更（Tree/List 切换）。
- **比较**：详情里一个「比较提交…」按钮，展开 `ComparePanel`，用 `<select>` 选基准提交。
- **文件**：点文件行 → 行内 `FileViewer`（Diff / 完整原文 + 旧/新版本切换）。
- **Tag/Stash**：底部可折叠 `MetadataStrip`，只做「列出 + 复制」。
- **查找**：工具栏「查找」按钮展开一个查找条（不是浮层），`Ctrl+F` 也能开。
- **设置**：工具栏「设置」按钮展开分节面板（6 节 + 重置/关闭）。

> **正在变化**：未提交改动把上面这套改成了「头部当前分支按钮 + 筛选按钮 + `Sheet` 浮层（分支/筛选/设置）+ Escape 分层回退」，
> 即从「一行扁平控件」转向 vscode 的「入口收敛成几个按钮，细节进面板」。细节与最后观察时间见第 6 章。

### 4.3 差在哪（按影响排序）

1. **没有右键菜单，等于没有「对象级能力入口」。** 本项目所有动作都被迫挤到「详情面板」或「工具栏」里；
   凡是「针对某个分支/tag/stash 的只读动作」（复制名、看详情、聚焦该分支）现在都无处安放——
   这是差距里唯一**结构性**的一条，但它可以只用只读动作填满。
2. **分支选择正在从「猜 glob」变成「选对象」，但还没到 vscode 的粒度。** vscode 用多选下拉（可同时勾多个分支 + glob 预设分组）；
   v0.5.3 要你手输 `feature/*`；未提交的 `BranchSheet` 已经能看见全部分支并单选聚焦，**多选与预设分组仍缺**。
3. **比较的选中模型不同。** vscode 是「两个选中态 + 修饰键」，本项目是「一个选中态 + 下拉选基准」。
   后者对键盘/触屏更友好，但**看不到图上的第二个提交**，也无法跨页比较（基准只能从已加载提交里选）。
4. **状态不记忆。** vscode 把列宽/列显隐/排序/分支过滤按仓库记住；本项目只记住显示设置，
   每次回来排序与筛选都回到默认值（含 `BranchSheet` 的聚焦分支）——这是最容易被用户感知的「廉价差距」。
5. **数据没接到 UI 上。** `GitGraphTagDetails`、`GitGraphStash.baseHash`、`GitGraphCommit.parents` 都已经取到了，
   但分别只出现在 `title` 提示、`selector` 文本、短 hash 文本里——三个「零成本可补齐」的现成缺口。
6. **diff 呈现模型不同。** vscode 把**整文件**交给编辑器（于是天然有并排/高亮/折叠）；
   本项目渲染**hunk**（于是天然有行号与精确标记，但没有并排/高亮/上下文可调）。两者互补，不是简单落后。
7. **键盘覆盖更窄。** v0.5.3 缺 `Escape`（未提交改动已补）、缺「刷新」快捷键、快捷键不可配置；
   vscode 的 `Ctrl+↑/↓` 沿父/子提交遍历属于图结构导航，本项目只有线性上下。

---

## 5. 存疑项（明确未验证，不编造）

标注约定：**[未经核实]** = 我既没有读到源码也没有读到可靠文档；**[读到但有限]** = 读到了代码，但只读到局部、行为未实测。

1. **[未经核实]** vscode-git-graph 的 stash 节点被点击/右键时的完整行为。我只确认它有 stash 右键菜单（apply/pop/drop/branch/copy），
   没有验证「点击 stash 节点是否打开一个 stash 专属详情/比较视图」。
2. **[未经核实]** vscode-git-graph 是否提供「stash 内容 diff」。其 diff 通道是 `vscode.diff` + 提交内容提供器，
   理论上可传 stash hash，但我没有找到专门的 stash-diff 调用点。
3. **[未经核实]** VS Code 原生 diff 编辑器在该扩展下的并排/内联表现与「忽略空白」行为。
   这属于用户 VS Code 设置（非扩展代码），我没有实测；本报告只确认**扩展自身没有空白字符相关设置**（110 个配置键已穷举）。
4. **[未经核实]** vscode-git-graph 的 Marketplace 安装量、评分、最近发布日期——`marketplace.visualstudio.com` 不可达，
   我也没有采用任何搜索摘要里的数字。版本号来自仓库 `package.json`（1.30.0）。
5. **[未经核实]** vscode-git-graph 的 Wiki 内容（`docs.mhutchie.com`、`github.com/.../wiki`）。
   README 多处把细节指向 Wiki（如 `contextMenuActionsVisibility` 的完整说明、自定义 Pull Request provider 配置），
   这部分我读不到，只能以 `package.json` 的 schema 与实际 `web/main.ts` 代码为准。
6. **[读到但有限]** 本报告对 vscode-git-graph「代码审查 90 天过期」的描述来自 README 正文，我没有在 `src/` 里逐行核对过期逻辑。
7. **[读到但有限]** 本项目「分支下拉」的最终形态。写作早期它还不存在（只有 Host 协议与文案），后期我读到未提交的
   `BranchSheet`/`FilterSheet`/`Sheet` 实现；但该文件仍在我写作期间变化，**最终形态未经核实**（尤其是多选、持久化、无障碍细节）。
8. **[未经核实]** 本项目在真实 DSH Web（http://127.0.0.1:3080）里当前的渲染效果。本报告基于源码阅读，
   没有截图比对，也没有实际点击验证（例如列宽拖拽手感、窄屏下的换行行为、`aria-modal` Sheet 的焦点陷阱是否真的存在）。
9. **[未经核实]** 本项目 `src/git.ts` 中 `search` 对**合并提交与多引用**的匹配边界（例如一个提交有 5 个引用时命中任一即可，
   我已读到 `commitMatchesSearch` 的拼接逻辑，但未实测极端数据）。
10. **[未经核实]** `git stash show -p <selector>` 是否严格只读（它默认 `--stat`，`-p` 展开 patch；理论上不修改仓库，
    但我没有在只读约束下实测，落地前应验证）。同理 `git verify-tag` 的退出码语义（签名无效时非 0）需要额外处理。
11. **[未经核实]** 未提交的 `BranchSheet` 中「聚焦分支」的查询语义在我最后一次读取时是单分支（`branches: [name]`）；
    若后续改为多选，第 2 章与第 3 章的相关结论需要更新。

---

## 6. 写作期间正在落地的改动（未提交，可能再变）

这一章记录的**不是稳定结论**，而是我在同一工作区里观察到的、尚未提交的实现快照（`git status` 显示
`GitGraphView.tsx` +486 行，`styles.ts` +383 行，`locales.ts` +38 行，`git.ts` +74 行，`domain.ts` / `typert.shared.ts` 各 +24/+33 行）。
目的是解释：为什么第 2 章有些\"差距\"看起来马上就要消失，以及它朝哪个方向收敛。

| 新组件/行为 | 我读到的实现 | 对应的 vscode-git-graph 概念 |
| --- | --- | --- |
| `Sheet` 浮层外壳 | `role="dialog" aria-modal="true"` + 标题栏 + 关闭按钮；渲染在 `.body` 内覆盖图谱（`GitGraphView.tsx:1242-1260`） | 相当于 vscode 的对话框/设置部件，但用覆盖式面板而非编辑器内嵌 |
| `BranchSheet` | 分支搜索框 + `Show all`（有聚焦时）+ 本地/远端分组标题 + 当前分支徽章 + tip 短 hash；选中即 `branches:[name]` 聚焦并跳到 tip（`:1267-1318`、`:1569-1581`） | `Branches` 下拉（`web/dropdown.ts`）的只读版；缺多选与 glob 预设 |
| `FilterSheet` | 引用类型、排序、glob、`全部引用`/`仅第一父` 复选项 + 重置/关闭（`:1321-1377`） | 相当于 vscode「列头右键 + 控制条复选框」的合并面板 |
| 筛选计数徽章 | `activeFilterCount` 统计筛选面板内生效项（`:1588-1592`） | vscode 无对应（它的列头菜单用勾选态表达） |
| 头部改为「当前分支按钮 + 脏标记 + 路径 + 刷新/设置图标」 | `:1801-1822` | 更接近 vscode 顶栏的仓库/分支下拉 + Refresh 按钮 |
| `Escape` 分层回退 | 先关 Sheet，再关查找（`:1723-1725`） | vscode 的 `Escape` 分层关闭（`web/main.ts:2028-2109`） |
| 查找条与筛选按钮图标化 | `SearchGlyph/FunnelGlyph/RefreshGlyph/SlidersGlyph`（`:1200-1240`） | vscode 的 SVG 图标按钮（`SVG_ICONS.*`） |

**这轮改动没有碰**：右键菜单（仍然没有）、Tag/Stash 详情、父提交跳转、悬停提示、diff 渲染方式、`.diff` 上下文与空白处理、
设置项数量、状态持久化范围。因此第 2 章里这些行的结论仍然成立。

---

## 附：可作为实现依据的关键源码位置

> 本项目列的行号基于**已提交版本 v0.5.3**；工作区里的未提交改动（第 6 章）会让 `GitGraphView.tsx` 的行号整体后移。

| 主题 | vscode-git-graph | 本项目 |
| --- | --- | --- |
| 配置清单 | `package.json` → `contributes.configuration`（110 键） | `src/client/settings.ts`（15 字段） |
| 右键菜单 | `web/main.ts:971-1520`、`web/main.ts:3022-3103` | 无 |
| 分支下拉 | `web/dropdown.ts`、`web/main.ts:523-540`、`src/dataSource.ts:1499-1531` | v0.5.3 无；未提交 WIP：`BranchSheet`（`GitGraphView.tsx:1267-1318`）、`src/git.ts` `parseBranches` |
| 比较入口 | `web/main.ts:2217-2236` | `GitGraphView.tsx:896-965`（ComparePanel） |
| Diff 渲染 | `src/utils.ts:418-439`、`src/diffDocProvider.ts:49-72` | `src/git.ts:912-991`（hunk 解析）、`GitGraphView.tsx` `DiffBody` |
| 查找 | `web/findWidget.ts` | `GitGraphView.tsx:278-293,1166-1182,1577-1588` |
| 键盘 | `web/main.ts:2025-2109` | `GitGraphView.tsx:1466-1497`（v0.5.3）；Escape 见未提交 WIP |
| 设置部件 | `web/settingsWidget.ts` | `GitGraphView.tsx:1102-1164` |
| 悬停提示 | `web/graph.ts:778-849` | 无 |
