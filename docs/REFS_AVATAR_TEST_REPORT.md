# 引用显示、头像来源与文件 Diff 路径验收

- 日期：2026-10-21。
- 运行环境：Windows、Node.js 22.22.1、pnpm 11.22.0、仓库自带 DSH 0.2.0-rc.2 依赖。
- 范围：0.5.2 的三项改动——子目录工作目录下的文件 Diff 路径、引用全量显示与按行高对齐、头像来源扩充。
- 与前几个版本不同，本次**没有在真实 DSH 中重新做浏览器点击验收**，也没有安装到运行中的 profile。下面记录的是实际执行过的检查；组件级检查使用真实 React 组件与真实样式表在独立页面中渲染，并直接读取 DOM 几何。

## 实际实现

| 项目 | 最终行为 |
| --- | --- |
| 文件 Diff 路径 | `loadFile` / `loadFileDiff` / `loadWorkingTreeFile` 先用 `git rev-parse --show-toplevel` 取仓库根，再按根校验路径并执行 `git diff`；未跟踪文件的 `--no-index` 也从根拼绝对路径 |
| 引用显示 | 提交行的所有引用全部渲染，不再出现「+N」；徽标保持原尺寸，放不下时在自身容器内换行 |
| 行高 | 行由固定高度改为最小高度；说明文字能挤一行就保留一行（`flex: 1 1 0` + `min-width: min(14ch, 100%)`），挤不下才整行下移 |
| 图形对齐 | `useLayoutEffect` + `ResizeObserver` 量出每行（含未提交行、展开面板）的 `top`/`height`，SVG 顶点、连线以及 graph 对齐模式的标签层都按实测行盒定位；原先的 `inlineHeight` / `gapAfterRow` 空档计算移除 |
| 引用对齐＝graph | 按最宽标签动态预留列宽（160–360px，上限内不再压缩徽标） |
| 头像来源 | GitHub noreply 邮箱 → 仓库所在 Git 服务（Gitea/Gogs `/avatar/<md5>`，退回 SHA256）→ GitHub 公开提交（仅 github.com 远端）→ Gravatar；查不到时首字母 tooltip 区分「没有公开头像」与加载失败 |

头像请求仍只允许固定域名、仓库自身 origin 与 `/avatar/<32~64 位十六进制>` 路径，跨服务重定向被拒绝，带凭据的 remote 直接忽略；图片 64 KiB 上限、栅格格式校验、4 并发、4 秒超时、128 条缓存与 24 小时 / 15 分钟有效期不变。

## 自动检查

| 检查 | 结果 |
| --- | --- |
| `pnpm typecheck`（Host / Client / Tests 三个程序） | 通过 |
| `pnpm build`（`lib/` 产物） | 通过 |
| `pnpm pack`（含 `prepack` 构建） | 通过，产物为 `dsh-git-graph-0.5.2.tgz` |
| `tests/git-file-diff-cwd.test.ts`（新增） | 6 项通过 |
| `.scratch/verify-file-diff.mjs`（Git 读取，真实临时仓库） | 12 项通过 |
| `.scratch/verify-avatars.mjs`（头像解析，伪 fetcher） | 18 项通过 |

`tests/` 目录沿用仓库既有的忽略规则，不随仓库分发；本次检出中除新增的回归测试外没有历史测试文件，因此**没有**执行此前版本记录的完整测试集。`.scratch` 下的两个校验脚本同样不纳入版本库。

### 文件 Diff 路径（真实临时仓库）

仓库根位于 `…/verify-repo`，会话工作目录取其子目录 `前端/go-view-pro-web`，工作区保留 14 增 2 删的改动：

| 场景 | 修复前 | 修复后 |
| --- | --- | --- |
| 子目录 cwd 下的工作区文件 Diff | 增删行数 +14 −2，行级内容为空 | 14 增 2 删全部返回 |
| 子目录 cwd 下的未跟踪文件 | 空 | 新增行全部返回 |
| 子目录 cwd 下的提交文件 Diff | 空 | 20 行新增全部返回 |
| 仓库根 cwd（原有路径） | 正常 | 与子目录结果逐行一致 |

### 引用显示与图形对齐（真实组件）

用 esbuild 将 `GitGraphView` 挂到普通页面（注入假数据，样式来自插件自身 `installGitGraphStyles`），再用无头 Chrome 截图并在页面内测量。773px 面板、6 条提交（含 1 条 4 引用的提交）结果：

```text
panel h=397 scroll=397
list h=365 rows=6 svg=284
r0 top=36  h=36 center=54  vertex=54  delta=0
r1 top=72  h=68 center=106 vertex=106 delta=0
r2 top=140 h=36 center=158 vertex=158 delta=0
r3 top=176 h=36 center=194 vertex=194 delta=0
r4 top=212 h=36 center=230 vertex=230 delta=0
r5 top=248 h=36 center=266 vertex=266 delta=0
```

- 每行中心与对应 SVG 顶点偏差为 0，包含被引用撑高的 68px 行；
- 面板 `scrollHeight` 与可视高度一致，说明图形高度不再反向撑高列表；
- 360px / 560px 窄宽度下徽标仍保持原尺寸，仅引用较多的行变高；
- `引用对齐＝graph` 模式下标签层与各行 `top` 一致，列宽按最宽标签预留。

截图：`.scratch/demo-773.png`、`.scratch/demo-560.png`、`.scratch/demo-graph.png`（本地临时文件，不随仓库分发）。

### 头像来源（伪 fetcher，不访问外网）

| 场景 | 期望 | 结果 |
| --- | --- | --- |
| GitHub noreply 邮箱 + 无 GitHub 远端 | 直接取 `avatars.githubusercontent.com/u/<id>` | 通过 |
| 普通邮箱 + 自建 remote | 先请求 `{origin}/avatar/<md5>`，成功即止 | 通过 |
| 自建 remote 返回 404 | 继续 SHA256，再回落 Gravatar | 通过 |
| github.com 远端 | 只走公开提交查询，不请求 `github.com/avatar` | 通过 |
| 头像来源＝仅 Gravatar | 不访问 Git 服务与 GitHub | 通过 |
| 带账号密码的 remote | 推导 origin 时拒绝 | 通过 |
| 查不到头像 | 返回 `image: null`，保持首字母，不抛错 | 通过 |

另用真实网络确认 `hlh19980910@163.com` 在 Gravatar 上为 404（MD5 与 SHA256 一致），而对照邮箱返回 200，说明此前「没有头像」属于该邮箱未注册，并非请求或摘要算法故障。

## 未覆盖

- 未在真实 DSH 会话中点击验证，也未截取插件在 DSH 内的新截图；`README` 中的截图仍是此前版本。
- 自建 Gitea/Gogs 的 `/avatar` 端点只用伪 fetcher 验证了请求形态，未对真实实例发起请求。
- 完整测试集（此前的 11 个测试文件）不在本次检出中，未执行。
