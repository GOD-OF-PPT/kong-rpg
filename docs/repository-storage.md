# 仓库存储说明

main 已合并 `codex/asset-loading-performance`，当前版本为 12.4.1，保留孙悟空、哪吒、杨戬三角色和五章十五关。

## 先合并和备份，再清理

合并提交为 `de3962fe9d143358761dfa0dc900ed47b732db9c`，父提交分别为原 main 的 `2b1bea5` 和功能分支的 `f5a5561`。合并完成、瘦身之前，已基于 main 建立并推送完整备份分支 [`backup/main-after-asset-loading-merge-20261118`](https://github.com/GOD-OF-PPT/kong-rpg/tree/backup/main-after-asset-loading-merge-20261118)，并核对 GitHub 远端 SHA 与合并提交一致。

备份提交追踪 5,328 个文件，共 1,409,308,153 字节。备份推送成功后，才从 main 移除历史发行 HTML/ZIP、截图、录像和大量原始采样数据。

main 的目标仍为当前追踪文件总量小于 100,000,000 字节。所有运行素材、音效和音乐源文件、游戏代码、构建工具、来源文档均保留；工具显式引用的 JSON 样本、证据 Markdown 和控制脚本继续追踪。精确归档清单见 [archive-index.json](merge-main-20261118/archive-index.json)，保留证据清单见 [retained-evidence.json](merge-main-20261118/retained-evidence.json)。

## 当前构建与交付

```powershell
npm ci
npm run build:all
npm run verify
python tools/package-release.py
```

- 网络版：`dist/index.html`，部署整个 `dist/`。
- 离线版：`dist-offline/index.html`，解压后双击，必须保留整个 `dist-offline/`。
- 离线 ZIP：`artifacts/kong-rpg-offline-v12.4.1.zip`，由打包命令生成，不追踪到 Git。

构建目录、历史 `release/`、新证据输出和发行 ZIP 由忽略规则保护。历史目录不再是当前运行依赖。当前版本采用分段加载，单独复制一个 `index.html` 不足以运行。

## 按原路径恢复历史资料

```powershell
git fetch origin backup/main-after-asset-loading-merge-20261118
git restore --source=origin/backup/main-after-asset-loading-merge-20261118 --worktree -- release/legacy-v11.html
```

将最后一个路径换为归档清单中的路径即可恢复到本机；默认忽略规则可避免将历史产物重新提交。可选的历史复放、旧报告重建工具可能需要先恢复对应 HTML、JSON 或压缩包，恢复所有历史版本不属于当前构建流程。v4.0 安全修复前后的原始版本仍保留在提交 `2b9f470` / `2b1bea5` 中，旧报告只对对应快照成立。

## 检查当前提交体积

```powershell
$sizes = git ls-tree -r -l HEAD | ForEach-Object {
    if ($_ -match '^\d+ blob [0-9a-f]+\s+(\d+)\t') { [long]$Matches[1] }
}
$bytes = ($sizes | Measure-Object -Sum).Sum
Write-Output "$bytes bytes"
if ($bytes -ge 100000000) { throw 'Tracked files must stay below 100 MB' }
```

这个限制针对 main 当前文件树。Git 历史与备份分支保留完整文件，因此 `.git`、普通克隆下载量和 GitHub 后端物理占用不会随清理提交降到 100 MB 以下。
