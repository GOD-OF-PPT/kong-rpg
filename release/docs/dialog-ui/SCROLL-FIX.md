# v3.0.1 舍利卷轴排版修正

基线：`codex/combat-and-world-v3`，`6d9dc7228efb7b39161485d462c92a9aa7915198`。只修改共用卡片排版，完整保留七种选项的说明、代价和实际效果。

## 问题与修正

用户截图和同版本运行截图均能看到确认文字压住底框。旧版只检查按钮外边界，没有检查卷轴内部的印章、框线，也漏查了绝对定位的确认文字。

- 将确认文字放回正常文档流，与代价说明保持 8px 间隔。
- 按贴图的内框留出左右空白，底部留出印章与卷轴空间。
- 卡片保留最小高度并允许随内容增长；禁止挤缩文字块。短窗口由整个对话框滚动，不裁掉说明或操作。
- 正文、代价的字号不变，未删减、截断文案。

## 运行证据

`evidence/scroll-layout/` 中的 `before.png` / `before.json` 为修改前实测，`http-*.png` / `file-*.png`、`http-dialogs.json` / `file-dialogs.json` 为当前发行入口结果。原始录屏在报告的 `video` 路径，本机保留。

Windows、Edge 156.0.4314.42、Playwright。覆盖 1440×1000、1366×768、1320×760、1280×720、1024×600；全部七种选项，以及启程、奖励、替换。检查完整文字位于贴图内部安静纸面、元素没有重叠或裁切、确认文字避开底部装饰。新版确认文字底部位于卡片高度约 83.9%，旧版约 93.0%。较短窗口允许对话框滚动。

同时检查方向键、Tab、Enter、数字速选、替换取消、暂停输入隔离、导出导入及替换后恢复。HTTP 与停止服务器后的全新断网 file 会话均无脚本异常；file 会话没有 HTTP(S) 请求。运行截图已按实际尺寸审看；不将这些检查作为真人体验评价。

发行入口 SHA-256：`9ebd8dc19de7c0853705cd0c1bd483d37231b9301f63935f36f0e85f3fda7fa1`。离线包：`artifacts/kong-rpg-offline-v3.0.1.zip`，保留既有 v3.0.0 包。

复现：先 `npm run build`，设置可用的 Playwright `NODE_PATH` 和 `EVIDENCE_DIR=evidence/scroll-layout`，启动 `node tools/serve.cjs` 后运行 `node tools/dialog-ui-verify.cjs http`；停止服务器，设置 `REQUIRE_SERVER_OFF=1`，运行 `node tools/dialog-ui-verify.cjs file`。
