# 架构审查问题修复记录

本文记录发布前的本机修复验收；正式版本入口见 [v0.6.0 Release](https://github.com/WhitePlusMS/dsh-git-graph/releases/tag/v0.6.0)。

日期：2026-10-22。对应前次审查的 F01–F12，基线为 `2f6107f`，保留并整合开始时已有的 Host 契约补丁。

## 修复范围

| 编号 | 修复 | 验证依据 |
| --- | --- | --- |
| F01 | Host 查询允许有上限的 `branches`；快照必填分支列表，与 Client 一致 | 真实 Git 快照穿过 Host / Client codec；页面聚焦 `origin/master` 返回 35 条可达提交 |
| F02 | 模型工具输出声明 `branches`、`searchTruncated` | 使用 DSH Tools 实际 JSON Schema 转换和校验函数验证真实快照 |
| F03 | 取消忽略测试源码；Vitest 自动发现项目测试；PR / master 检查，发布依赖验证任务 | 本地 4 个文件、31 项测试；CI 配置已补齐，尚未在远端运行 |
| F04 | 保留 2000 条扫描预算，多取一条判断截断；DTO、工具及中英文页面明确告知 | 2001 条真实 Git 历史中，范围外旧提交确实存在，返回空匹配及 `searchTruncated: true` |
| F05 | 按 Git decoration 的逗号加空格分隔，保留引用名中的逗号 | 真实 `feature,comma` 分支的引用名完整返回 |
| F06 | 分支 glob 委托 Git 原生匹配，删除手写正则转换 | 原生 `[!a]` 否定字符类回归 |
| F07 | 同上；非法范围由 Git 的匹配语义处理，不再构造 JS 正则 | `[z-a]` 返回无匹配，未抛 JS SyntaxError；普通前缀匹配仍有效 |
| F08 | 详情、比较、工作区读取包含 `T` / `U`；类型、codec、状态文案贯通 | 真实普通文件与 Git 符号链接对象间的类型变化，在三条读取路径均返回 `T` |
| F09 | porcelain `-z` 保留首个目标路径，跳过后续来源路径 | 两个状态列的 rename 回归，后续条目不会错位 |
| F10 | 全部读取接口透传取消信号；替换、关闭、卸载时取消旧请求；保留迟到响应保护 | 浏览器快速切换 3 次详情读取，其中 2 次旧请求被取消；子进程信号及停止派生请求回归 |
| F11 | 标签 / Stash 展开时才读取；标签详情单次批量获取，删除旧串行解析路径 | 页面折叠时 metadata 0 次，首次展开 1 次；多个 annotated / lightweight tag 仅 1 次标签 Git 命令 |
| F12 | 快照 `path` 使用 Git 工作树根目录；会话 cwd 保留请求上下文含义 | 同一真实仓库根目录与子目录返回相同 path 和提交；设置、头像缓存复用此身份 |

## 相关实现

- `src/domain.ts`、`src/runtime.ts`、`src/typert.host.ts`、`src/typert.shared.ts`：严格 DTO、边界契约及搜索预算。Gateway 实际结果 encode / decode 钩子执行校验。
- `src/git.ts`：原生分支过滤、完整 ref 消歧、解析修复、搜索边界、批量标签和仓库根目录。
- `src/typert.remote-client.ts`、`src/client/index.ts`、`src/client/GitGraphView.tsx`：取消生命周期、按需元数据、截断提示，以及比较刷新保留基准选择。
- `src/client/locales.ts`、双语 README、`GLOSSARY.md`：用户文案及仓库身份、搜索截断的领域含义。
- `.gitignore`、`package.json`、`vitest.config.ts`、`.github/workflows/release.yml`、`tests/`：测试交付与门禁。
- `lib/`：由项目构建脚本重新生成，供 DSH 直接加载。

保留既有 Host Zod / Client 轻量 parser 分层，并用全部 9 个 endpoint 的双向契约测试约束漂移；没有为了拆文件新增抽象层。没有旧版本字段缺失兼容分支。

## 自动验证

- `npm run typecheck`：Host、Client、测试三套 TypeScript 检查通过。
- `npm test`：4 个文件、31 项通过。
- `npm run build`：Host / Client 产物生成成功。
- `git diff --check`：通过。修正了属性内 JSX 注释造成的生成代码行尾空格。

测试文件为 `git-file-diff-cwd.test.ts`、`host-typert-contract.test.ts`、`git-regressions.test.ts`、`wire-contracts.test.ts`。Git 测试只创建并清理专用临时仓库；Windows 类型变化使用 index 对象构造，无需系统符号链接权限。

## 本机页面验证

使用现有 `web` profile 的插件安装副本。同步前备份 `lib/`，同步后校验哈希；临时 DSH 实例仅监听 `127.0.0.1:3080`。没有启动前后端 dev watcher，没有调用网页端 GPT。

在真实 DSH 页面测量 SVG 实际高度、提交行中心与节点圆心，覆盖详情、历史 Diff、未提交列表及未提交文件 Diff 的展开、异步内容加载完成和收起，并检查远端分支聚焦与快速切换提交。原始测量保存在项目本地 `.scratch/architecture-fixes-20261022/live-measurements.json`。

最终共 23 次逐态测量全部通过；41 个提交节点的最大垂直误差不超过 0.5px，分支聚焦后的 35 个节点也通过。浏览器 Network 记录确认按需 metadata 与旧详情请求取消。

搜索截断的正向场景由 2001 条历史的真实 Git 回归覆盖；当前项目页面只有 41 条提交，不把它声称为超限搜索页面验收。模型工具输出使用 SDK 校验验证，没有发送模型对话。此修复阶段尚未执行远端 CI、发布与推送，正式发布状态以 Release 及对应 Actions 为准。

最终页面构建标识为 `2026-10-21T16:15:51Z`。刷新比较数据后基准选择保持不变，Network 确认重新调用 compare；页面无 alert 或 console error。截图为本地 `.scratch/architecture-fixes-20261022/final-page.png`。

本次临时 DSH 服务 PID 15652 已终止，并确认 3080 无监听。修复后的安装产物保留在 web profile，重新启动 DSH 即加载；该修复阶段没有提交、推送或发布；后续版本发布另行记录。
