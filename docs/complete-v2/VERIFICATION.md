# v2.0 当前版本验收（2026-10-26）

基线 c797b3d；开发分支 codex/complete-journey-v2。当前发行入口 SHA-256：

`658080d7b64f21d3c5ed336d3bb5bd84c79c71d21ade28f32c38c5876a74151e`

HTML 20,041,349字节。所有脚本、CSS与8张ImageGen图随HTML内嵌；无CDN、远程字体、模块导入、fetch或运行时生成接口。当前判定依据是本目录与 evidence/complete-v2；历史版本文档不作当前验收。

## 已实现

三境各自的平台布置、六座阵眼、分段引导、中途借灯、三枚舍利上限与明确替换/调息、无天两阶段节奏与移形预警、胜负结算/原创尾声/同缘重开。死亡清除局内成长，旅程记录不加永久战力。保留v1.2美术环境，新增跑动序列、阵眼/灯/山门；金色准备、红粉生效、青色分身、DOM命中数字与本地声音。

## 已实际验证

|层次|本轮证据|结果|
|---|---|---|
|连续键鼠流程|http-playthrough.json、file-playthrough.json及其中完整视频/trace路径|经正常开篇、选择、三境所有中途机会、六阵、无天、结算、尾声；无设置生命、传送或直接调用模拟控制|
|离线|file-playthrough.json|实际停止5188服务器并确认端口不可用；新Edge上下文设置离线；全程零HTTP(S)请求、零运行异常|
|解压发行入口|package-entry.json|ZIP解压至不含release名称的目录，离线启动、分身、原版入口均成功；禁用localStorage后导出再导入恢复真实进度|
|存档和界面|ui.json|满位替换跨重载保留、暂停导出/导入、设置保留、损坏存档不覆盖旅程、失败同缘重开；实际v1.2 schema2旧档在旧入口恢复同地图/生命/战斗规则|
|输入边界|visual.json|Tab先暂停再进入DOM，界面按J/L不推进世界，窗口失焦暂停；鼠标攻击和分身在连续流程中使用|
|长局可靠性|rules.json|远处敌人15秒后计时仍可存档；原型中负计时无限累积问题已修复|
|实际画面|warning-blade/seal/boss/shift、lamp、gate、run-actual-scale及visual视频|1440×1000逐张/每次最多两张检查；1366×768界面无页面溢出。平台亮边和地面危险可见，阵眼/灯/山门轮廓独立|

截图中的定点场景通过合法导入存档布置，只用于画面/边界检查，不算作从头通关。完整通关脚本先经正常界面开局，开始处导出/导入一次后连续键鼠推进；脚本读取状态选择输入，不是盲看画面的真人。

HTTP末局生命86，舍利云/影/生；file末局生命70，舍利云/影/返。两次真实时间输入存在采样差异，不把终局数值差当作构筑因果；因果比较见固定步长实验。

## 同条件行为证据与反例

- 原型与当前近身首刀场景：种子 LOTUS-1025 / 0318 / 0916，位置x380或390，初始生命12/50/100、定力65，保留原敌人属性，仅隔离其他敌人。100ms采样、使用上一采样判断；完整动作与事件见encounter-before/after.json。逐帧回放由replay.json确认。
- 当前持续轻棍在这些近身条件均受12伤；跳避策略0伤，耗时约1.408秒；照影以50定力压到约0.933–0.958秒。移除分身输入后回到约1.408秒。删除只在实验控制器中，未混入发行规则。
- 实际首盾场景，初始正面间距56、生命100、定力65：LOTUS-1025持续攻击4.392秒、受16伤；跳绕1.858秒、0伤；照影诱敌1.575秒、0伤、消耗50定力。LOTUS-0318/0916中同一跳绕控制器仍受16伤；照影仍0伤。这是需要保留的负结果，不能宣布跳绕在所有布置都更优。完整输入与事件、精确回放结果见shield.json。
- 相比全身免伤，无天现在正面普通14伤棍结算6、背后或收招结算14；移形先预警0.55秒后连续移动，没有瞬移伤害。普通盾兵收招可正面攻击，平时身体贴近仅挤开，不用未预警接触伤害惩罚。

这些结果支持“观察、站位和资源交换存在有效解”。它们不证明初次玩家能自行发现，也不证明重开意愿。没有为了提高数字而改敌人血量、增加技能检查或强制免疫。六枚舍利/三境的数量未增加；流程与布置复用之前未完成的试作。

## 反馈与性能

环境：Windows11专业版 10.0.26200，Intel i5-14600K，Node22.12.0，Edge156.0.4314.42，Playwright headless，1440×1000桌面视口；未扩展到其他系统/浏览器。

|测量|HTTP|断网file|
|---|---:|---:|
|rAF帧间隔p95|16.9ms|16.9ms|
|输入事件至模拟后渲染提交p95|30.6ms|30.3ms|
|该采样最大值|63.8ms|64.4ms|

另用真实J/空格/K/L各5次，在输入事件后监测动作状态及角色区域Canvas像素第一次同时改变：p95 16.2ms，最大18.1ms，见feedback.json。读取的是Canvas提交缓冲区，包含读回开销，排除外设、显示扫描和人的反应时间。rAF帧间隔不是纯模拟CPU耗时；不将平均FPS当作流畅证据。

## 主观判断与未验证

画面检查判断：金色落脚边、紫莲阵眼、暖灯和青色分身的用途区分比此前共用莲灯使图更清楚。这是开发侧审看，不是外部评价。

未取得真人首次游玩、访谈、自愿重开和真人试听。按PLAYTEST.md可直接组织3–5人观察。跑动对应左右步轮廓仍接近；敌人主要关键姿势切换，背景为整景复合图；尚有程序粒子/拾取物。没有新增核实的原剧集数/时间码，不宣称影视动作复刻或所有美术已逐帧精修。

## 复现

`npm run build`；`npm run verify`。浏览器验证工具需要可用的Playwright与Edge，本机使用Codex捆绑运行库NODE_PATH。当前命令：

```powershell
node tools/experiments/development-encounter.cjs c797b3d
node tools/experiments/development-encounter.cjs working
node tools/development-replay.cjs
node tools/experiments/shield-development.cjs
node tools/ui-v2.cjs
node tools/visual-development.cjs
node tools/feedback-development.cjs
node tools/serve.cjs # 另开进程
node tools/playthrough-v2.cjs http
# 停止该预览进程后：
$env:REQUIRE_SERVER_OFF='1'
node tools/playthrough-v2.cjs file
```

种子、动作、伤害来源、源码哈希与包哈希在JSON内。完整未剪辑WebM与Playwright trace保留在本机evidence/complete-v2，文件路径见对应JSON；大体积视频/trace不提交Git，克隆者可用脚本复现。最终发行ZIP在artifacts/kong-rpg-offline-v2.0.0.zip。
