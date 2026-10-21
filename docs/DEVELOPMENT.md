# 开发说明

[使用说明](../README.zh.md) · [English README](../README.md)

本项目当前版本为 0.5.2，适配 DSH 0.2.0-rc.2。这里记录本地安装、构建、内部数据接口及验收依据。

## 本地安装与自定义 profile

在源码目录生成安装包：

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm pack --pack-destination .scratch/release
dsh plugin --profile web add ./.scratch/release/dsh-git-graph-0.5.2.tgz
dsh web
```

`pack` 会执行构建，包内包含 `lib/`，使用者从 GitHub 归档安装时无需本地构建。已有 `.tgz` 时可直接将包路径传给 `dsh plugin --profile web add`。更新已运行的 profile 前先停止它，安装后重启，加载新包。

首次安装到不存在的 `web` profile 时，CLI 会按 Web 模板创建它。自定义 Web profile 可以执行：

```powershell
dsh --profile my-web --from-default-profile web --dump-config
dsh plugin --profile my-web add ./.scratch/release/dsh-git-graph-0.5.2.tgz
dsh --profile my-web
```

安装、启动和卸载必须使用同一个 profile 名称。

## 构建与客户端接入

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
```

构建生成独立 Host 和浏览器端产物到 `lib/`，安装包不要求检出 Harness monorepo。根 TypeScript solution 分别引用 Host、Client 和测试程序。客户端通过 Cordis effect、类型化本地化及 DSH 原生侧栏服务注册，并使用目标版本的主题别名。

源码与 `lib/` 产物需要一起提交，供 GitHub 标签归档安装；不保留旧 DSH API 兼容分支。

组合包行 ID、Host 导出名称、侧栏标题和插件元数据统一使用 `dsh-git-graph`，与 npm 包名一致。修改名称后须重新生成 `lib/`，再打包安装。

## 发布 GitHub Release 成品包

同步 `package.json` 版本、源码、`lib/` 和 `CHANGELOG.md` 后，将以 `release:` 开头的发布提交合入 `master`，例如 `release: publish dsh-git-graph v0.5.2`。也可在 GitHub Actions 网页手动运行 `Package release`。

`.github/workflows/release.yml` 执行类型检查和 `pnpm pack`，成功后以本次提交创建对应版本标签与 Release，附带含 `lib/` 的 `.tgz` 和 `SHA256SUMS.txt`；发布说明取自 `CHANGELOG.md` 的当前版本。普通提交不会发布，已发布版本不会被覆盖。检查 Actions 成功且附件可下载后，再用 README 中的地址安装。该过程不发布到 npm，也不自动完成市场目录收录。

## Git 数据与路径处理

Host 通过固定、不经过 shell 的 subprocess 参数读取 Git 数据，采用字面路径匹配并禁用可选索引更新。界面按需读取仓库状态、HEAD、有界历史、提交详情、文件 Diff、工作区变更和提交比较。历史文件查看器使用 `readFileDiff` 读取统一 Diff，使用 `readFile` 按需读取完整原文，两个接口沿用 domain DTO 与 `RemoteResult`。

`readFileDiff` 接收 `hash`、仓库相对 `path` 及可选 `baseHash`。明确基准时比较两端树，不使用 merge-base；未指定时比较目标与首父提交，根提交比较空树。两端变更列表决定文件状态和重命名前后的路径，即使目标最后一次提交未修改该文件也能读取范围 Diff。`readFile` 只接收 `hash` / `path`，单文件上限为 1 MiB；新增、删除、重命名读取各自存在的一端，空文件、二进制和超限分别展示。

浏览器请求绑定当前会话工作区，不接受任意仓库 `path`。文件请求必须使用仓库相对路径；绝对路径和仓库外路径被拒绝。非 Git 目录和无提交仓库有独立空状态；无提交仓库仍可查看暂存文件。

独立模型工具 `git_graph` 的参数如下：

```text
git_graph({
  path?: string,          // 仓库目录，默认当前会话工作区
  max_commits?: number,   // 1..500，默认 100
  all?: boolean,          // 包含所有可达 refs，默认 true
  first_parent?: boolean, // 只跟随首父提交，默认 false
  glob?: string[],        // 本地分支名 glob（OR），提供时覆盖 --all
  search?: string,        // Hash、主题、作者、邮箱、引用名、日期；扫描上限 2000
  sort?: string           // date、author-date、topological，默认 date
})
```

模型工具的 `path` 仅作为 Git subprocess 工作目录，不拼接到 shell 命令。提交数据显示姓名和邮箱时采用 Git mailmap，记录作者日期与提交者日期；引用合并依据实际远端名称和同一提交上的本地分支名。

## 真实头像

浏览器只提交当前会话的提交 Hash 和头像来源；Host 从 Git 读取原始 / mailmap 作者身份。取图顺序为：GitHub noreply 邮箱（`<id>+user@users.noreply.github.com` 直接取账号头像）→ 仓库所在 Git 服务（`{remote 的 origin}/avatar/<邮箱md5>`，Gitea/Gogs 的 Gravatar 兼容接口，未命中再试 SHA256）→ GitHub 公开提交（仅 `github.com` 远端，用原始作者邮箱）→ Gravatar（映射邮箱的 SHA-256 摘要）。浏览器接收栅格图片数据 URL。

请求只允许已知域名、仓库自身 origin 及 `/avatar/<32~64 位十六进制>` 路径；跨服务重定向被拒绝，remote 中带账号密码时直接忽略该来源。缓存最多 128 条，成功缓存 24 小时、失败缓存 15 分钟；缓存仅存在于 Host 内存，重启清空，不写仓库文件。关闭头像、切换仓库或来源会取消旧请求，失败使用首字母头像。域名、大小、时间、并发限制及实际联网验证范围见[显示功能报告](DISPLAY_TEST_REPORT.md)与[0.5.2 验收记录](REFS_AVATAR_TEST_REPORT.md)。

## 引用显示与行高

提交行的引用不再折叠为「+N」：徽标保持原尺寸，放不下时在容器内换行；说明文字使用 `flex: 1 1 0` 与 `min-width: min(14ch, 100%)`，能保留一行就保留一行，挤不下才整行下移，行高随内容增长。因此行高不是常量：`GitGraphContent` 用 `useLayoutEffect` + `ResizeObserver` 量出每行（含未提交行、行内展开面板）的 `top` / `height`，`GraphSvg` 的顶点、连线与 `引用对齐 = graph` 的标签层都按这份实测数据定位；该模式还会按最宽标签动态预留标签列宽（160–360px）。新增可折叠内容时不需要再单独上报空档高度。

## 验收依据

仓库按现有规则忽略 `tests/`，新克隆不附带测试集。仅在保留本地测试文件的工作区运行 `pnpm test`。

| 验收阶段 | 自动测试 | 浏览器检查 | 详细报告 |
| --- | --- | --- | --- |
| DSH 0.2 适配 | 78 项通过 | 48 项通过 | [DSH 适配报告](DSH_0.2_TEST_REPORT.md) |
| 0.3.0 的 P0 显示优化 | 88 项通过 | 56 项通过 | [P0 报告](P0_TEST_REPORT.md) |
| 0.4.0 的显示更新 | 106 项通过 | 26 项通过 | [显示功能报告](DISPLAY_TEST_REPORT.md) |
| 0.5.0 的两提交 Diff 与完整原文 | 115 项通过 | 18 项通过 | [提交比较与原文报告](COMPARE_SOURCE_TEST_REPORT.md) |
| 0.5.2 的引用显示、头像来源与子目录 Diff | 回归 6 项 + 校验 30 项通过 | 未执行（改用组件级渲染测量） | [引用与头像验收记录](REFS_AVATAR_TEST_REPORT.md) |

各阶段数量不相加。P0 验收时临时包为 0.1.0，后纳入 0.3.0；0.4.0 显示实现验收时临时包仍为 0.3.0；0.5.0 比较与原文实现验收时临时包仍为 0.4.0。0.5.2 的验收在检出中缺少历史测试集的情况下进行，未重做真实 DSH 浏览器检查。版本调整另行通过类型检查、构建和打包，未因版本号变化重复浏览器验收。正式版本记录见[版本说明](../CHANGELOG.md)。
