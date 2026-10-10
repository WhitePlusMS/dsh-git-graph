# Changelog

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
