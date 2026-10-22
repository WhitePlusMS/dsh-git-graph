<p align="center">
  <img src="docs/screenshots/readme-header.gif" width="100%" alt="dsh-git-graph — 为 DeepSeek Harness Web 提供只读 Git Graph">
</p>

<p align="center">
  <strong>当前版本 0.6.0</strong> · 适配 DSH 0.2.0-rc.2 · <a href="LICENSE">MIT</a><br>
  <a href="README.md">English</a> · <a href="docs/screenshots/readme-header.svg">静态标题</a>
</p>

# dsh-git-graph

[dsh-git-graph](https://github.com/WhitePlusMS/dsh-git-graph) 是 **WhitePlusMS** 开发的 **DeepSeek Harness（DSH）Web** 只读 Git 可视化插件，位于原生右侧栏。直接浏览工作区的提交历史、分支和文件变更，无需 API Key 或发送对话消息。

**基本信息**

| 项目 | 取值 |
| --- | --- |
| 插件名 | `dsh-git-graph`（仓库名与 DSH 组合包行 ID） |
| 仓库 | https://github.com/WhitePlusMS/dsh-git-graph |
| 安装来源 | GitHub Release 成品包（`dsh-git-graph-0.6.0.tgz`），**不是 npm** |
| 依赖 | DSH **0.2.0-rc.2**、`dsh` CLI、pnpm、DSH Host 上的 Git |
| 操作性质 | 只读：不暂存、不提交、不推送、不拉取、不 Fetch、不合并、不打标签 |
| 语言与许可 | 中 / 英界面 · MIT |

<p align="center">
  <a href="#安装与更新">安装</a> · <a href="#使用">使用</a> · <a href="#快捷键">快捷键</a> · <a href="#常见问题">常见问题</a> · <a href="#使用范围">使用范围</a> · <a href="#卸载">卸载</a> · <a href="#更多文档">更多文档</a>
</p>

![原生侧栏、提交图与筛选演示](docs/screenshots/demo.gif)

GIF 录制于 0.4.0，下方两提交 Diff 与完整原文截图来自 0.5.0，均保留历史版本标注。0.6.0 新增的分支导航、下拉控件和详情展开时的图形对齐已在真实 DSH 中检查，见[修复与验证记录](docs/ARCHITECTURE_FIX_REPORT_20261022.md)。

<details>
<summary>更多截图：两提交比较、完整原文、英文及窄屏</summary>

![真实作者头像与行内提交详情](docs/screenshots/display-avatar.png)

![两提交逐文件 Diff](docs/screenshots/compare-diff-0.5.0.png)

![完整历史原文](docs/screenshots/source-0.5.0.png)

![360px 完整原文](docs/screenshots/source-360-0.5.0.png)

![英文浅色主题](docs/screenshots/display-light-en.png)

![360px 窄侧栏](docs/screenshots/display-360.png)

</details>

## 0.6.0 更新

- 选中本地或远端分支即可聚焦其历史并定位到最新提交，不切换工作区。分支、筛选、设置统一从顶栏下拉打开。
- 提交详情、文件 Diff、未提交变更展开或收起时，图形节点持续跟随实际行高；切换和关闭视图取消旧读取，标签 / Stash 展开时才加载。
- 搜索达到 2000 条扫描上限时明确提示；修正含逗号的引用名、原生 Git 分支模式与文件类型变化。仓库根目录和子目录会话共用仓库设置。

完整修复与升级说明见 [0.6.0 版本记录](CHANGELOG.md#060--2026-10-22)。

## 功能

- **提交历史**：提交拓扑、分支、Tag、HEAD，以及提交搜索和历史筛选。
- **分支查看**：点标题栏的分支名打开分支面板，本地 / 远端分组，可搜索名字，选中即只显示该分支的提交并定位到它的最新提交；只读，不切换工作区。
- **提交详情**：行内展示作者与提交者日期、父提交、引用、签名状态和复制操作。
- **引用显示**：同一提交上的引用全部展示，同名本地 / 远端分支可合并；放不下时换行、行高自适应，另有两种引用布局可选。
- **文件变更**：文件树 / 列表、逐文件 Diff、未提交变更；选择两次提交后，可以打开每个变更文件的 Diff。
- **历史原文**：查看和复制旧 / 新版本的完整文本，显示对应路径、提交 Hash、行号及大小。
- **正文与头像**：正文链接、粗体、斜体、行内代码，以及 GitHub、Gravatar、仓库所在 Git 服务（Gitea/Gogs）的真实作者头像。
- **显示设置**：可调列宽、日期显示、紧凑行高、连线样式和配色，按仓库保存设置。
- **界面适配**：中英文、明暗主题、面板全屏和窄屏显示。

**提交详情与逐文件 Diff**

![提交详情与逐文件 Diff 演示](docs/screenshots/diff.gif)

**提交比较与未提交变更**

![两提交变更清单与工作区 Diff 演示](docs/screenshots/compare.gif)

## 安装与更新

需要 **DSH 0.2.0-rc.2**、可用的 `dsh` CLI、用于安装插件的 pnpm，以及 DSH Host 上已安装的 Git。

通过 DSH 内置插件页面或命令行安装 `v0.6.0` Release 成品包，两者接受同一安装来源。参见官方的[插件管理器说明](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/client/ui-plugin-manager/README.zh.md)与[打包安装文档](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/user/develop/basic/publish.zh.md)。

在 DSH 中打开 **插件 → 添加插件**，粘贴下面的地址，安装后选择**立即启用**：

```text
https://github.com/WhitePlusMS/dsh-git-graph/releases/download/v0.6.0/dsh-git-graph-0.6.0.tgz
```

也可以在终端安装：

```powershell
dsh plugin --profile web add https://github.com/WhitePlusMS/dsh-git-graph/releases/download/v0.6.0/dsh-git-graph-0.6.0.tgz
```

归档已包含构建后的 `lib/` 入口，无需克隆仓库、在本机构建，或保留固定路径的开发目录。

这个 `.tgz` 由 `pnpm pack` 生成并作为 GitHub Release 附件发布，与 GitHub 自动生成的源码归档分开。DSH 官方支持在界面和命令行中使用这个包地址；发布 Release 不会自动完成插件市场收录。仅输入包名安装则需要先发布到 npm。

> **名称说明**：npm 上的 `dsh-git-graph` 是**另一个不相关的插件**（作者 `enoughpower`，0.1.x，带暂存与提交功能）。本项目只通过上面的 Release 成品包安装；这里的 `dsh-git-graph` 仅用作 DSH 组合包行 ID 和仓库内的包名。


检查 `dsh-git-graph` 是否已安装为 `0.6.0`：

```powershell
dsh plugin --profile web list dsh-git-graph
```

使用 `dsh web` 启动 DSH Web；如果已有实例正在运行，重启原实例使插件生效。更新时执行目标发布标签的 `add` 命令，再重启原实例。安装、启动和卸载须使用同一 profile 名称。

升级到 0.6.0 后请重启，使 Host 与 Client 使用一致的严格数据契约。此前按子目录单独保存的显示设置不迁移到工作树根目录设置。

自定义 profile、本地 `.tgz` 安装和源码构建见[开发指南](docs/DEVELOPMENT.md#本地安装与自定义-profile)。

## 使用

1. 在 DSH Web 中选择工作区，打开右侧栏。
2. 从侧栏开始页选择 **dsh-git-graph**。
3. 点击提交查看行内详情，点击文件查看 Diff；点击 **未提交变更** 查看工作区改动。
4. 点击 **比较提交…** 并选择基准提交，再点击变更文件。在历史文件查看器中切换 **Diff / 完整原文**，并选择旧 / 新版本。

通过 **设置** 调整显示效果，设置按仓库分别保存。

真实头像默认开启，会访问外部头像服务：GitHub 仓库按提交作者邮箱查询公开提交；其他仓库先问所在 Git 服务（Gitea/Gogs 的 `/avatar` 接口），再查 Gravatar；GitHub noreply 邮箱可直接取图。可以在设置中关闭；没有公开头像或请求失败时显示首字母头像。

## 卸载

```powershell
dsh plugin --profile web remove dsh-git-graph
```

卸载命令使用安装时的 profile 名称，移除后重启该 profile。

## 快捷键

| 操作 | 效果 |
| --- | --- |
| `Ctrl/Cmd+F` | 在已加载结果中查找 |
| `Ctrl/Cmd+Shift+F` | 切换显示设置 |
| `Esc` | 逐层关闭浮层：先关分支 / 筛选 / 设置面板，再关查找条 |
| `↑` / `↓` | 关闭并清空查找后，选择提交 |
| `H` | 定位 HEAD，超出范围则提示 |
| 行或节点上的 `Enter` / `Space` | 选择提交 |
| 拖拽列分隔线 / `←` / `→` | 调整列宽；方向键需先聚焦分隔线 |
| 双击分隔线 | 恢复默认列宽 |

快捷键在 Git Graph 获得焦点时生效，普通导航键不会拦截输入框中的文字输入或文件查看器中的滚动。

## 常见问题

**如何在 DeepSeek Harness Web 查看提交和文件 Diff？**

为 DSH 0.2.0-rc.2 [安装插件](#安装与更新)，再从原生右侧栏打开 **dsh-git-graph**。两提交比较和完整历史原文的操作见[使用说明](#使用)。

**为什么提示 `cannot resolve profile bundle "dsh-git-graph"`？**

此前从本地目录安装时，插件可能仍链接到已经移动或删除的文件夹。在同一 profile 中重新安装 Release 成品包；先移除再添加，也能让 DSH 在旧安装未启用时重新登记 bundle：

```powershell
dsh plugin --profile web remove dsh-git-graph
dsh plugin --profile web add https://github.com/WhitePlusMS/dsh-git-graph/releases/download/v0.6.0/dsh-git-graph-0.6.0.tgz
```

之后重启该 DSH Web 实例。单独运行 `dsh plugin --profile web install` 会沿用已保存的安装来源，无法修复指向不存在目录的链接。

**`dsh-git-graph` 在 npm 上吗？**

不在。npm 上同名包属于另一个作者的项目；本项目只从上面给出的 Release 成品包地址安装。用 `dsh plugin --profile web add dsh-git-graph`（只给包名）会装到那个项目。

**它和其他 DSH Git 插件是同一个吗？**

不是。`kp-z/dsh-dev-git-graph`、`lengmoXXL/dsh-git`、`EasyTZ/dsh-git`、`LeonZ666/dsh-gitworktree-gui` 等都是各自独立维护的项目。本项目是原生右侧栏的只读 Git Graph，只从本仓库的 Release 安装。

**需要 API Key 或发送对话消息吗？**

不需要。Git Graph 直接读取当前工作区的本地 Git 数据。

**插件会提交、合并、推送、拉取或 Fetch 吗？**

不会。插件只读，刷新图谱不会 Fetch 远端变更，也不会修改仓库。

## 使用范围

- 初始加载 100 条提交，手动加载最多 500 条；搜索最多扫描 2000 条，仍有更早历史未扫描时会明确提示；查找仅针对已加载结果。引用类型筛选只显示直接带对应标签的提交。
- 分支面板只做只读导航：选中分支等于把它变成查询范围并定位到它的最新提交。插件不执行 `checkout`、`merge`、`rebase`、`cherry-pick`、`reset`、`fetch`、`pull`、`push`，也不会改写暂存区或引用。
- 历史文件查看器提供统一 Diff 和完整文本，单文件读取上限为 1 MiB。二进制和超限文件会显示状态，不会将截断文本当作完整内容；重命名、新增和删除按实际存在的版本及对应路径读取。
- 尚无左右 Diff、语法高亮、Tag 签名验证或 Stash Diff；Tag / Stash 条目提供摘要和复制。

## 更多文档

- [0.6.0 修复与验证记录](docs/ARCHITECTURE_FIX_REPORT_20261022.md)

- [llms.txt](llms.txt)——供 AI 助手与索引读取的精简摘要
- [与 vscode-git-graph 的功能差距报告](docs/FEATURE_GAP_VS_VSCODE.md)——逐项对比、可只读补齐清单与「不做」边界
- [开发、本地安装与 API 说明](docs/DEVELOPMENT.md)
- [版本说明](CHANGELOG.md) · [引用与头像验收报告](docs/REFS_AVATAR_TEST_REPORT.md)
- [提交比较与完整原文验收报告](docs/COMPARE_SOURCE_TEST_REPORT.md)
- [显示功能验收报告](docs/DISPLAY_TEST_REPORT.md)
- [P0 报告](docs/P0_TEST_REPORT.md) · [DSH 适配报告](docs/DSH_0.2_TEST_REPORT.md)

---

参考项目：[vscode-git-graph](https://github.com/mhutchie/vscode-git-graph)，感谢其作者和贡献者。

许可证：[MIT](LICENSE)。
