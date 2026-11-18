# main 合并、备份与体积检查

已将 `codex/asset-loading-performance` 合入 main，当前使用 12.4.1 三角色版本。孙悟空、哪吒、杨戬可选，保留五章十五关、普通/挑战及原分支的加载与构建方式。

## 执行顺序与备份

1. 拉取并核对 main 和功能分支。原 main 为 `2b1bea5`，功能分支为 `f5a5561`。
2. 处理 18 个冲突，采用功能分支的游戏运行源码、Vite 构建和相应内容，同时保留 main 的归档与安全工具。完成真正的双父合并提交 `de3962fe9d143358761dfa0dc900ed47b732db9c`。
3. 基于合并后的 main 创建并推送 [`backup/main-after-asset-loading-merge-20261118`](https://github.com/GOD-OF-PPT/kong-rpg/tree/backup/main-after-asset-loading-merge-20261118)。远端 SHA 已核对为该合并提交。该快照为 5,328 个追踪文件、1,409,308,153 字节。
4. 备份成功后才清理 main。移出 4,638 个历史发行包、HTML、截图、日志和大体积原始结果；82 张运行图、全部音效/音乐源文件和游戏源码均保留。精确归档对象及大小见 [archive-index.json](archive-index.json)。

代码采用 12.4.1 的完整运行链，v4.0 独立改版的冲突内容未机械拼接为混合规则。旧版本及其安全修补原始提交均仍在 Git 历史中。原工作目录 `E:\githome\kong-rpg` 的分支和两份未提交文件保留。

## 合并与清理适配

- 当前网络/离线分发分别生成在 `dist/`、`dist-offline/`。不再依赖旧 `release/`；离线包包含分段加载的图片、音乐及脚本，必须保留整个目录。
- 源 HTML 的 Vite 入口改为 `./src/main.js`，保持相对路径；Vite `base` 仍为 `./`。
- 修复清空历史 artifacts 后打包目录不存在的问题，打包工具自行创建输出目录。
- 两份研究文本改为 ASCII 文件名，内容保持不变；音效试听页改用受控相对 WAV 文件路径。复扫命中的 3 项中风险已处理，前后扫描记录均保留。
- 当前实际 UI 使用 `K.UI.el` 创建节点，不经过 HTML 字符串解析。保留安全攻击样本测试，并将采用旧结算 DOM 类名的断言更新为当前 `.settlement-score` / `.settlement-rating` 消费者。
- 原规则测试要求从磁盘读取 67 MB 的旧 v9 HTML，归档后首次检查报 ENOENT。原始红灯见 [initial-validation-failure.txt](initial-validation-failure.txt)。默认检查继续验证旧存档识别、输入不被迁移及伪造挑战资格拒绝；原历史 SHA-256 断言迁到归档检查，仍对真实备份字节执行，未豁免。
- UI 安全检查首次因旧 `.subtitle` 选择器超时报错，保留在 [ui-security-initial-failure.log](ui-security-initial-failure.log)；修正到当前结算区域后重新通过。

## 当前验证

| 层次 | 本轮结果 | 依据 |
| --- | --- | --- |
| 构建 | 网络版、离线版均通过；清理后重新构建通过 | `npm run build:all` |
| 游戏规则 | 13 项通过，包含三角色、普通/挑战、十五关状态恢复及关卡流程 | `npm run verify`，`evidence/audit-v10/campaign-rules.json` |
| 分发完整性和子目录部署 | 208 项通过，覆盖 82 张图、文件哈希、压缩、字节范围、子目录 HTTP 和离线经典脚本入口 | `node tools/verify-vite-build.cjs --offline`，`evidence/vite/build-verification.json` |
| 实际离线角色入口 | 三角色分别通过选择、首关开局、移动/攻击和暂停；只读快照，真实键鼠输入 | [hero-smoke.json](hero-smoke.json) |
| 浏览器 UI 安全 | 57 项通过；禁用 HTML sink 后仍可操作；恶意种子、历史、受伤文本和属性保持为数据 | [ui-security.log](ui-security.log) |
| Node 安全边界 | 7 项通过；扫描器边界 5 项通过 | `verify-safe-dom.test.cjs` / `test_web_zip_scan.py` |
| 静态技能复扫 | 3 个 HTML、1 个 Vite 配置，0 项命中；保留默认排除范围 | [security-scan.md](security-scan.md) |
| 历史备份完整性 | 4,638 个归档对象身份和大小与远端备份提交一致；原 v9 SHA-256 断言通过 | [archive-verification.json](archive-verification.json) |
| 离线 ZIP | 89 项、48,075,953 字节；CRC、文件集合、逐文件内容及入口 SHA-256 全部匹配 | [package-verification.json](package-verification.json) |

实际浏览器为 Edge 157.0.4341.60，截图尺寸 1440×1000。逐张查看了角色选择和三位角色首关画面，未见本轮合并引起的角色缺失或菜单/HUD 遮挡阻断。截图保留在本机 `evidence/merge-main-20261118/`，初次捕获的对话框淡入帧单独保留，最终截图等待过渡完成后取得。

本轮没有重跑三角色×普通/挑战的完整浏览器通关矩阵，也不替代真人体验、难度、美术全面审查或多浏览器兼容验收。历史报告只对原快照成立，不累计为本轮新结果。

## 交付与恢复

- 离线 ZIP：`artifacts/kong-rpg-offline-v12.4.1.zip`。
- 离线目录入口：`dist-offline/index.html`，请同时保留旁边全部文件。
- 保留证据清单：[retained-evidence.json](retained-evidence.json)。
- 历史文件恢复、体积复算及存储边界：[仓库存储说明](../repository-storage.md)。

本轮清理后 main 当前追踪文件约 94.97 MB，小于 100,000,000 字节；Git 历史与备份分支继续保留完整原文件，不是对 `.git` 或 GitHub 后端物理存储的缩减承诺。
