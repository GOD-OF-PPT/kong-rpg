# 仓库存储说明

2026-11-17，清理基线为 `cb4cdfafb56f231242d9afe66e5a22403d005d50`。完整基线已推送到 GitHub 的 [`backup/main-before-size-reduction-20261117`](https://github.com/GOD-OF-PPT/kong-rpg/tree/backup/main-before-size-reduction-20261117) 分支。

本次目标是 main 当前提交追踪的文件总量小于 100,000,000 字节。清理前为 196,647,521 字节。

- 移除 `evidence/` 下的 PNG 截图，共 98,544,783 字节；历史报告引用的原图在备份分支按相同路径保留。
- 移除 `artifacts/` 下的发行 ZIP，共 40,357,918 字节；已有压缩包可从备份分支取回。
- 保留全部 `src/`、`assets/`、构建和验证工具、JSON 验收记录及旧存档样本。
- 保留 `release/index.html` 与 `release/legacy-v1.html`，继续支持直接离线打开及旧旅程入口。

`.gitignore` 已忽略上述生成文件，后续截图和 ZIP 在本机生成后不会自动进入提交。`tools/verify-package.cjs` 检查发行 ZIP 前，须先在本机准备 `artifacts/kong-rpg-offline-v2.0.0.zip`，或从备份分支恢复该文件；这个工具需要 ZIP 输入，游戏运行和 `npm run build`、`npm run verify` 不需要 ZIP。

以下 PowerShell 命令检查某个提交的追踪文件大小，超过限制会报错：

```powershell
$sizes = git ls-tree -r -l HEAD | ForEach-Object {
    if ($_ -match '^\d+ blob [0-9a-f]+\s+(\d+)\t') { [long]$Matches[1] }
}
$bytes = ($sizes | Measure-Object -Sum).Sum
Write-Output "$bytes bytes"
if ($bytes -ge 100000000) { throw 'Tracked files must stay below 100 MB' }
```

这是当前文件树的体积限制。Git 历史和备份分支保留原文件，因此 `.git`、普通克隆下载量和 GitHub 后端占用不会随本次提交降到 100 MB 以下。
