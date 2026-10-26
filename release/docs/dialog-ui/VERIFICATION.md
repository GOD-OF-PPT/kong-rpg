# v2.1 游戏弹窗验收（2026-10-26）

基线 cb4cdfa / main；开发分支 codex/game-dialog-art。当前源码的战斗模拟、输入动作映射与存档模块无改动；版本号更新到2.1.0。改动范围是DOM弹窗、图集样式、菜单导航和本地菜单音效。

发行HTML SHA-256：`a2b22371d0815f88a58d3c96eb9450b29ba12346f03aff0d931d476ed6dc737e`；27,773,450字节。界面、流程与存档验收JSON中的入口sha256与之对应；package.json另记录ZIP自身hash。

## 已实现与画面审看

覆盖11种模态状态：开篇、初始舍利、暂停、手记、奖励、替换、失败、胜利、尾声、历史、旧旅程；奖励另查中途/过境，历史另查空簿/八条满档。经卷、舍利实物图、线装双页、悟空立像、供灯和莲章都已接入真实游戏。功能说明仍是DOM文字，装饰未烘焙文字。

1440×1000与1366×768全部状态均做布局检查，代表性画面分小批查看（每次至多两张）。主要选择、正文、按钮和底部按键提示均在画面内，不需整体弹窗滚动；满档历史在书页内部滚动，使用End实际读到末条。纸面与书脊留白经过修正，不以原始概念图作验收。最终截图以http-*、file-*为前缀，before-*保留旧版本对照；*-draft为中途稿，不算最终画面。

小字代价颜色 #54351f 对经卷静区较暗5%分位纹理亮度的对比约5.18:1，方法及数值在http-dialogs.json/file-dialogs.json。不将局部纹理抽样当作全部XAG合规、弱视用户验证或系统屏幕阅读器认证。

## 已实际运行

- **HTTP与file弹窗检查**：http-dialogs.json、file-dialogs.json覆盖26个定点画面/布局，检查方向键、Tab/ShiftTab循环、Enter、1/2/3、取消替换、焦点返回、设置滑杆、Esc、历史滚动及减少动态。素材解码与CSS纹理都实际生效；零页面错误。
- **连续流程**：http-playthrough.json、file-playthrough.json从正常开篇/选舍利出发，先验证暂停和真实导出导入，再由实际键鼠连续走过三境/六阵/借灯/奖励/无天/结算/尾声；不传送、不注入血量、不调用模拟控制接口。控制器读取状态决定输入，因此是浏览器自动化，不冒充真人首次体验。
- **离线**：停止已核对的5188预览服务后，确认端口不可连接；新浏览器会话设离线并拦截HTTP(S)，直接打开release/index.html。连续通关与全部弹窗均通过，零HTTP(S)请求。运行不依赖CDN、在线字体、在线生成或预缓存。
- **兼容与保存**：ui.json中实际恢复待替换状态，检查坏档不覆盖当前旅程、声音/屏震保留、失败同缘重开、v1.2旧档在保留的旧入口恢复。禁用自动存储仍可导出；解压包的package-entry.json另核对导出后真正导入恢复。
- **发行包**：artifacts/kong-rpg-offline-v2.1.0.zip；解压到不名为release的目录后检查启动、分身、旧入口与存档。ZIP全部CRC与入口哈希通过，记录在package.json。保留legacy-v1.html历史兼容入口的旧界面。

HTTP与file的菜单截图定点场景通过合法存档导入构造，用于检查特定状态，不混入连续通关结论。源PNG、提示词、素材hash、入口hash、输入记录和错误记录均保留。原始未剪辑WebM与trace路径写在对应JSON；大体积运行材料及重复截图仅本机保留，不提交Git；代表性对照截图提交到仓库。重复迭代的旧trace会清理，只保留当前JSON引用的证据。

## 性能与环境

Windows11、Intel i5-14600K、Edge156.0.4314.42、Node22.12.0、Playwright headless，1440×1000桌面视口。HTTP帧间隔p95为16.9ms，事件到模拟后渲染提交p95为30.8ms；file分别为16.9ms与15.8ms。排除显示扫描与外设延迟；不以平均FPS代替输入体验。

## 结论与边界

功能证据支持：全套弹窗仍能完成原来的游戏流程，键鼠输入不会泄漏到战斗，离线和旧档能力保留。开发侧画面判断是材质、构图和选择层级比旧版统一矩形面板更贴近游戏。

尚无外部玩家的审美/理解评价，也未做人类试听、屏幕阅读器实机或跨系统浏览器验收。本轮优先PC键鼠，不宣称广泛移动端适配。参考游戏只观察公开静态截图和开发说明，未亲玩或编造动画数据；调研来源及取舍见DESIGN.md。

## 复现

先npm run build。浏览器工具需要Playwright与Edge；本机使用Codex捆绑NODE_PATH。

```powershell
$env:EVIDENCE_DIR='evidence/dialog-ui'
npm run verify
node tools/ui-v2.cjs
node tools/dialog-ui-verify.cjs http
node tools/playthrough-v2.cjs http
# 停止预览服务后：
$env:REQUIRE_SERVER_OFF='1'
node tools/playthrough-v2.cjs file
node tools/dialog-ui-verify.cjs file
```
