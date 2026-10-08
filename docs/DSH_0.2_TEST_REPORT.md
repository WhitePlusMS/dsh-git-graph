# DSH 0.2 插件升级与测试报告

验收日期：2026-10-08。插件版本：`dsh-git-graph@0.1.0`。

## 版本与源码依据

- 目标为官方 npm `latest` 对应的 `@deepseek-ai/dsh@0.2.0-rc.2`。官方尚无不带预发布后缀的正式稳定版本，本报告不将 RC 称为正式稳定版。
- 官方源码标签：[dsh-v0.2.0-rc.2](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.0-rc.2)。提交：`639ed015397290b3745d163aafe02ffee4aa3f84`。
- 本地源码：`.scratch/dsh-0.2.0-rc.2/`，实际执行 `pnpm install --frozen-lockfile`、`pnpm run build`，构建 Host、Client、Web 成功，记录 347 个客户端产物。
- 环境：Windows、PowerShell、Node.js 22.22.1、Git；浏览器连接源码构建的 DSH Web。
- 规范依据是该标签中的 `AGENTS.md`、`cordis-plugin-development` skill 及 UI/Host、生命周期、类型边界和发布指南。

## 实际迁移

| 范围 | 变更与目的 |
| --- | --- |
| 依赖 | DSH 依赖固定为 0.2.0-rc.2；删除新版已移除的 client-runtime，使用官方 Cordis Context 与明确服务依赖 |
| 页面入口 | 删除 conversation.view 注册，接入 sidebarRightTabs 类型 / 开始页入口 / sidebar.right.pane.tab 正文；空会话也能打开 |
| 生命周期 | 注册、样式和字典通过 effect 管理；停用可清理，启用可重新注册；Remote 挂载完成后再查询 |
| 本地化与主题 | 类型化中英文界面、插件管理页元信息与图标；控件和 Diff 使用官方主题别名 |
| 协议 | 新版 codec create 工厂、SessionId 类型、严格 DTO；浏览器 Query 无任意 path，Host 读取当前会话工作区 |
| 编译 | Host、Client、测试分别建立 TypeScript compiler face，根配置为 solution；修复已发现的类型错误 |
| Git 行为 | 修复多分支 HEAD、merge 首父 Diff、重命名 NUL numstat、删除 / binary Diff、首提交前暂存文件、以 +++ / --- 开头的真实内容行及不存在路径错误 |
| 界面行为 | 搜索后排序保留条件，旧响应不覆盖新查询；按键限定图谱区域，输入不被抢占；修复窄侧栏列重叠、紧凑样式与无匹配提示 |

不保留旧 DSH API 兼容层，复用原有 Git 查询、图谱布局、详情与设置实现。

## 自动检查

| 检查 | 结果 | 本地记录 |
| --- | --- | --- |
| DSH 源码安装、完整构建 | 通过 | `.scratch/dsh-source-build.log` |
| 插件 Host / Client / tests 类型检查 | 通过 | `pnpm run typecheck` |
| 根 solution 类型检查 | 通过 | `pnpm exec tsc -p tsconfig.json --noEmit` |
| 全量测试 | 10 个文件、78 项通过 | `.scratch/upgrade-full-tests.log` |
| 独立插件构建与 tgz 打包 | 通过 | `.scratch/release/dsh-git-graph-0.1.0.tgz` |
| tgz 官方 CLI 安装与真实 Host / Client 加载 | 通过 | 独立 `git-graph-e2e` profile 与实际页面 |

最初基线有 3 项失败；新增实际缺陷回归后先确认失败，再修复业务代码。两项原工作区 fixture 的文件已被重命名，已修正检出基准，不再将未跟踪文件当作跟踪修改。

## 真实浏览器操作

对安装了构建包的 DSH 执行点击、键盘、剪贴板、设置和工作区切换，48 项均通过。没有用模拟 DOM 或请求成功代替页面验收。

| 覆盖范围 | 项数 | 实际检查 |
| --- | ---: | --- |
| 入口和生命周期 | 6 | 空会话加载、原生全屏、插件管理页元信息、停用清理、启用注册并成功读取 |
| 历史与元数据 | 2 | 默认 100 条加载到 114 条后结束；Tag / Stash 展示 |
| 查询与过滤 | 8 | 跨页搜索、排序保留搜索、单分支 / OR glob、本地分支 / Tag 筛选、当前分支首父、脏工作区无匹配 |
| 提交和 Diff | 8 | 修改及新旧行号、重命名、删除、binary、merge 详情与首父 Diff、目录折叠、根提交列表与中文内容 |
| 复制与比较 | 3 | 复制路径、复制 Hash、两个提交比较 |
| 工作区与无首提交 | 5 | 修改文件、未跟踪文件、树 / 列表、空仓库状态、首提交前暂存文件 Diff |
| 键盘 | 3 | 按钮焦点下上下选择、H 跳 HEAD、输入不被 H 抢占 |
| 结果内查找 | 3 | 正则与跳转、大小写敏感无匹配、非法正则反馈 |
| 显示设置 | 3 | 列显示、紧凑样式、关闭再开页签后持久化 |
| 语言与主题 | 3 | 英文即时切换、暗色、恢复中文与浅色 |
| 小屏 | 1 | 640×760 视口下原生全屏与滚动，之后恢复视口 |
| 非 Git 目录 | 2 | 独立空状态、刷新正常 |
| 控制台 | 1 | 本轮验收期浏览器 error 为 0 |

逐项结果在 `.scratch/ui-qa-results.json`。测试结束已恢复语言、主题、默认显示设置、视口和剪贴板内容。

## 只读与会话验证

使用专用临时目录中的真实 Git 仓库，包含分支、merge、A/M/D/R、binary、中文、轻量 / annotated Tag、Stash、114 条历史及未提交变更。另建无首提交仓库和非 Git 目录。

验收前后实际比较 HEAD Hash、所有 refs 的名称与对象 Hash、`git status --porcelain`，三项均保持一致。

没有发送对话消息。隔离 DSH_HOME 的 5 份会话日志核对无对话消息和模型工具调用事件；脚本完整读取日志中的全部 zstd frames，只输出事件类型。脚本与结果在 `.scratch/final-verification.mjs`、`.scratch/final-verification.json`。

## 复现安装与启动

在插件根目录：

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm pack --pack-destination .scratch/release
```

仓库按原有规则忽略 `tests/`，因此新克隆不包含测试集。本次 78 项自动测试在作者保留测试目录的本地工作区通过；有该测试集时再额外执行 `pnpm test`，它不是安装插件所需步骤。

在已构建的 DSH 源码根目录初始化隔离 profile，然后安装包：

```powershell
$env:DSH_HOME = 'C:\Users\admin\Desktop\dsh-git-graph\.scratch\dsh-e2e-home'
pnpm dsh --profile git-graph-e2e --from-default-profile web --dump-config
node --import tsx/esm apps/cli/src/bin.ts plugin --profile git-graph-e2e add C:/Users/admin/Desktop/dsh-git-graph/.scratch/release/dsh-git-graph-0.1.0.tgz
node --import tsx/esm apps/cli/src/bin.ts --profile git-graph-e2e --patch apps/web/tests/pin-browse-picker.overlay.yml --no-open --port 3087
```

使用启动输出中的本地 Web 地址访问，添加测试工作区，从原生右侧栏开始页打开 Git Graph。`--patch` 使用上游测试的浏览器目录选择器；显式指定 profile 后不再添加位置参数 `web`。

本次测试 DSH 在验收结束后关闭；源码、安装包、截图与日志保留，方便复查。

## 截图与覆盖边界

- [原生侧栏 / 浅色](screenshots/dsh-0.2.0-light.jpg)。
- [提交详情 / Diff](screenshots/dsh-0.2.0-diff.jpg)。
- [英文 / 暗色](screenshots/dsh-0.2.0-dark.jpg)。
- [640px 视口](screenshots/dsh-0.2.0-small.jpg)。

本次覆盖 Windows 上的 DSH 0.2.0-rc.2 Web 和现有只读功能；其他 DSH 版本、操作系统或生产部署不属于已验收范围。搜索扫描上限 2000 条，图谱显示上限 500 条。模型工具的协议与 loader 有自动测试，浏览器验收没有发起实际模型对话。
