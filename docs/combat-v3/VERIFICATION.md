# v3 验收（2026-10-26）

基线009303f；分支codex/combat-and-world-v3。入口SHA-256：`a284de700292d73c3972018f7318152e8661f2e78fe52077ca6ac2b09d39b5c3`，35,884,674字节。界面、连续流程与反馈验收JSON的入口hash均与此一致；before和定点预览保留其原始版本标记，ZIP记录另有自身hash。源码、包与素材hash另保存在evidence/combat-v3/version.json和素材manifest中。

## 实现

1. 九个ImageGen攻击关键姿势、四类四帧命中图，按第一/第二/第三棍时序切换；轻重不同停顿与声型，格挡、反弹、下劈、击杀有区别。数字为DOM，减弱整人白染。声音本地合成，效果和停顿不会停止接受暂停。
2. 新版借灯、过门与地图事件统一F，E无交互作用；Canvas说明、指南、上下文提示、当前README同步。保留旧入口自己的历史按键。
3. 三境加入可略过的救困、燃灯接桥、镇莲钟；地图实际移除地刺/新增桥面，镇莲钟实际将终战落火从三处改两处。裂台、移动渡船、节奏地焰和三类普通敌人的新招已运行；此行见闻与结算/尾声读取真实状态。

## 运行证据

|检查|原始记录|结果与限制|
|---|---|---|
|正常流程|http-playthrough.json / file-playthrough.json，内含录像与trace路径|正常开篇、选舍利，先导出/导入一次，再通过键鼠连续完成三境、全部事件、六阵、无天、结算与尾声。未传送、注入血量或调用模拟控制|
|真正离线入口|file-playthrough.json|停止本任务5188服务器并确认端口不可连接；新Edge会话断网且拦截HTTP(S)，直接打开release/index.html；零HTTP(S)请求、零运行异常|
|F与旧E|browser-scenes.json|E不触发借灯或三种事件，F能触发；连续流程以F过全部山门|
|新危险与存档|rules.json / browser-scenes.json|盾冲/突进预告与伤害范围；离开锁地咒可避；落火、动态机关、未出场/进行中守卫可保存。新境立即存档也能恢复|
|世界后果|rules.json / 完整流程JSON|救困移除地刺，燃灯支付20定力且三段桥面真实可站，镇莲钟改变落火数量；重复F不重复扣费或领奖|
|旧档保护|browser-scenes.json / ui.json|实际v2存档在字节一致的v2.1旧入口恢复；v1.2旧入口也恢复。新v3不覆盖旧键、不静默迁移地图|
|存储受限|browser-scenes.json / package-entry.json|禁用localStorage仍能导出并实际导入恢复；不是只下载成功|
|模态与PC|file-dialogs.json / ui.json|1366×768、1440×1000，方向键/Tab/Enter、替换、恢复、失败重开、手记、减少动态等通过；菜单不漏战斗输入。新见闻摘要也加入焦点循环|
|美术实装|attack-*、shield-block、slam-impact、enemy-*、node-*、boss-rain-*、实战世界事件截图|以实际游戏尺寸、小批检查；命中星芒、青色盾挡、敌方紫粉预告不共用一团光。营救前后物件确实变化|
|发行ZIP|package.json / package-entry.json|离线ZIP解压到任意目录可启动、F对应世界能力可玩，旧入口相对链接正确；ZIP全部CRC及入口hash匹配|

定点截图使用合法导入场景，并在操作前核对场景确实恢复，不把失败导入留下的旧画面当成新场景。boss-rain前后固定同一人物位置，由正式模拟生成标记，非手绘扩大空当。完整通关读取状态决定按键，是自动化控制器，不能冒充真人观察。

## 动效证据

原型近身持棍录像和截图为before.*（009303f）。正式版轻击停顿18ms、重击58ms；相同14伤目标在两种impact下生命结算一致，但反馈类型/寿命/停顿不同。真实三连不会在每个模拟步重复伤害同一目标。第三棍接触前120ms不结算命中，接触与画面使用同一attackTiming。

实际尺寸联系表combo-scale.png、impact-scale.png保留。impact-demo.gif是定点动作放大预览：原始WebM中通过真实J、跳跃与下劈取得，GIF仅裁切/邻近缩放/降帧与调色，原视频仍在；不是从头通关。该预览早于最终提示条位置修正，动作与特效源相同，原始入口hash写在impact-demo.json，不冒充最终版全流程证据。

## 环境与测量

Windows11、Intel i5-14600K、Edge156.0.4314.42、Node22.12.0、Playwright headless。完整流程1440×1000视口。当前高刷新会话rAF帧间隔p95约5.7ms；HTTP事件至模拟后渲染提交p95为9.8ms，file为10.4ms，最大分别64.5/58.5ms。不是纯CPU帧耗时，也不等价于所有电脑的FPS承诺。

feedback.json用真实J/空格/K/L各5次，检测动作状态与角色区域像素第一次同时改变：p95 13.3ms，最大18.3ms。读的是Canvas提交缓冲区，排除外设与显示扫描，也不测人类反应时间。

## 结论与缺口

功能正确、新招反制、地图后果、离线和存档恢复有运行证据。开发侧审看认为新动效的轻重、方向和材质区别更清楚。真人手感、剧情吸引力、首次危险理解、自愿重开与真人试听没有取得，不作“更好玩”的总体结论。

攻击仍以关键姿势配合特效实现，敌人的身体动画也没有全量连续精修。背景仍是复合整景，新增的是地图机关、事件与敌招，不宣称新增完整生物群落或长篇剧情。原剧逐帧场景研究缺口继续保留；新增台词与事件为游戏原创。

## 复现

构建无npm依赖，直接npm run build / npm run verify。高级浏览器脚本需要Playwright与Edge，本机使用Codex捆绑NODE_PATH。默认日志落在evidence/combat-v3；旧通用UI工具先设置EVIDENCE_DIR。

```powershell
npm run build
npm run verify
node tools/combat-v3-browser.cjs
$env:EVIDENCE_DIR='evidence/combat-v3'
node tools/ui-v2.cjs
node tools/dialog-ui-verify.cjs file
node tools/feedback-development.cjs
node tools/serve.cjs # 单独进程
node tools/playthrough-v3.cjs http
# 停止该预览进程后：
$env:REQUIRE_SERVER_OFF='1'
node tools/playthrough-v3.cjs file
```

未剪辑录像/trace路径在JSON中，大体积数据本机保留、Git忽略；代表性截图、输入记录、GIF与验证脚本提交。旧迭代trace会清理，只保留当前JSON引用的记录。最终离线包artifacts/kong-rpg-offline-v3.0.0.zip。
