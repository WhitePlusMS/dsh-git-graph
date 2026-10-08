# dsh-git-graph —— 为 DeepSeek Harness Web 打造独立的 Git Graph 会话视图插件

## 场景/行业

开发者工具 / 插件开发 —— 给 DeepSeek Harness 的 Web 界面补上一个独立的 **Git Graph 视图**（在 Chat、Trajectory 之外新增一个 Tab），交互设计参考开源项目 [vscode-git-graph](https://github.com/mhutchie/vscode-git-graph) 的成熟体验，将其移植为 dsh 插件，属于"插件开发 + 前端会话视图"方向。

## dsh 版本/模型

- 目标平台：`@deepseek-ai/dsh-*` `^0.1.0-rc.6`、`@deepseek-ai/cordis ^4.0.1`
- 开源版本：`v0.0.2`（已打 tag 发布）
- 模型：本项目为纯前端 + Host 工具，本身不依赖具体模型推理；开发/自检走 `deepseek-v4-flash`

## 做了什么

为 DeepSeek Harness Web 开发了一个独立的 `Git Graph` 会话视图插件（standalone conversation view），在 Chat / Trajectory 旁新增 Tab，用来可视化当前工作区的 Git 提交拓扑。核心能力包括：

- **提交拓扑**：分支 / 合并 / 父提交关系、本地分支、远程分支、tag、HEAD 引用标签，工作区干净/脏状态显示在头部；
- **按需读取**：提交详情、文件变更（tree/list 双视图 + 折叠目录 + (+加/−删) 统计）、逐行 Diff、未提交工作区更改、任意两提交比较、仓库 tag/stash 元数据；
- **全范围检索**：跨 hash/主题/作者/邮箱/引用名的检索，分支名 glob 过滤、引用类型过滤、日期/作者日期/拓扑排序、first-parent 主线模式、折叠行内详情、显示设置面板（按仓库持久化）；
- **包私有的 Host 刷新链路**：刷新走 Typert Remote 直连 Host，不产生对话消息、不写轨迹；
- **只读安全保证**：当前版本不 create/delete/rename/merge/rebase/push/pull/fetch/tag/stash/reset 任何 Git 数据。

本项目从设计到交互均参考了开源项目 [vscode-git-graph](https://github.com/mhutchie/vscode-git-graph)，以其成熟的 Git 可视化交互（分支拓扑、行内提交详情、文件树/Diff、查找与设置面板等）为蓝本，结合 DeepSeek Harness 的 Host/Client 与 Typert Remote 机制重新实现；在此感谢其作者与贡献者。


## 结果

- **产物**：已开源 → https://github.com/WhitePlusMS/dsh-git-graph
- **安装/验证方式**：
  ```powershell
  dsh plugin --profile web add https://github.com/WhitePlusMS/dsh-git-graph/archive/refs/tags/v0.0.2.tar.gz
  ```
  安装后重启 `dsh web`，在视图切换器里点 `Git Graph` 即可；同样命令可升级，`dsh plugin --profile web remove dsh-git-graph` 可卸载。

## 踩了什么坑

1. **`git` 的退出码 128 会"假告警"**：空仓库、无提交仓库、没有 stash 时，多个 git 命令都会返回退出码 `128`——它们其实是"正常空状态"，不是查询失败。踩完后在协议层把仓库状态拆成「非 Git 目录 / 空仓库 / 可读取」三种并放行退出码，客户端据此显示差异化文案。
2. **分支筛选不要直接丢给 git 的 `--branches=<pat>`**：它在 Windows 上行为不可靠。改成自己列出分支、用 glob 匹配、再把结果作为固定参数传给 `git log`，既稳定又不依赖 shell 拼接。
3. **提交 diff 的基准一开始传错了**：对根提交（没有父提交）和合并提交，直接取"它的上一个提交"做基准会出错。改成以提交本身为基准比对，并补了根提交/合并提交的真实用例。
4. **`-z`（NUL 分隔）不是"以防万一"，而是必须**：路径里真的会出现空格、换行、tab，只按空格分隔解析必炸；rename（两个路径）和 binary 文件也要单独处理。
5. **Host 的任意文件读取防线要落到实处**：git 子进程全部走固定参数、不经 shell，文件读取做双重前置校验（拒绝绝对路径、`..` 穿越、空路径），并有测试守着。

## 可公开链接

- 仓库：https://github.com/WhitePlusMS/dsh-git-graph
