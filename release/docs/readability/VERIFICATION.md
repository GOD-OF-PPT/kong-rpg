# 玩法与美术修正验收 — v1.1.0

分支codex/readable-combat，基线e5dc0b5。活动目标限定为一个核心体验矛盾，且优先玩法与运行美术；本报告不宣称完整游戏制作已完成。

发行HTML：82517 bytes；SHA-256 4f3f4a0b79b5f364756c3b525633e3cf8038989704b2abf463ad409ce335993b。新版新开局rules=2/schema=2，旧进行中存档恢复rules=1/schema=1，原物理输入重放与原版一致。旧档不悄悄换战斗规则。

## 实际交付

连续轻棍不再暂停普通敌人已发出的预警/攻击计时；重击、下劈与踩踏能短暂打断。可选择以跳避换时间或以分身换资源，保留极限距离连按可无伤的反例。攻击和地图内容数量、敌人血量、原判定盒均保持原版合同。

原创程序像素动作：悟空出棍/收招/跳/落/闪避/受伤/死亡，敌人举刀与挥刀；青色友方分身，限制残影密度，落点影子贴近实际平台。刀光和碰撞共用攻击盒；预警/有效攻击/打断都有各自的本地声效事件。无远程素材或运行依赖。

## 验证分层

|层次|实际证据|限制|
|---|---|---|
|固定遭遇|encounter-before/after.json、replay.json逐动作重放；配对距离/生命/构筑|种子在此遭遇等价，不算独立统计样本；不代表所有敌群|
|实际键鼠对照|encounter-browser.json及时间戳批次含按键、采样阶段、伤害、声音事件、完整录像路径|合法存档建立起点；不是从新档走过全程；脚本非真人|
|完整HTTP|三境、奖励、无天结算、暂停与导出导入都通过，零运行异常|知道地图的控制器，用时不当普通玩家时长|
|关服断网file|先验证5188服务关闭，全新offline上下文完整通关；HTTP(S)请求0|仅桌面Edge环境，不泛化全部平台|
|存档/输入|实际按键、鼠标、菜单门控、损坏导入、自动存储禁用后导出、失败重开|失焦覆盖blur处理路径，未声称跨应用原生操作验收|
|画面|小批查看动作/战斗/奖励截图；visual.json记录横扫绘制与物理盒一致|设计者判断，不是外部美术专家认可|

环境：Windows桌面，Playwright控制Edge 156.0.4314.42，headless；1366×768与1440×1000。正式包通过键鼠完成整局，未直接写入状态来跳关或击杀Boss。定向失败/构筑/遭遇样本与整局证据分开记录。

## 实测

|入口|完整通关模拟时长|剩余生命|帧间隔p95|事件到提交p95|最大事件到提交|
|---|---:|---:|---:|---:|---:|
|HTTP|47.43s|37|16.90ms|15.70ms|63.00ms|
|file|46.22s|49|16.90ms|16.20ms|47.00ms|

事件到提交包含命中停顿，指浏览器事件处理到模拟处理后画布提交，不包含硬件和显示扫描。首次可见反馈额外测8次，要求相应状态变化和玩家区域像素变化同时出现，范围9.20–28.70ms；小样本不能证明全部动作延迟。

完整录像：evidence/readability/video/page@ef10be2e60144ffab75e857bc8ea5862.webm；evidence/readability/video/page@372e89a449dafdc4a480ea1f06614812.webm。trace：evidence/readability/http-trace-1792939767285.zip；evidence/readability/file-trace-1792939513493.zip。录像/trace本机保存，未提交大文件；关键帧与原始JSON随Git提交。

## 边界与后续

真人首次游玩是否能读懂、主动改变打法及自愿重开，均未验证。可执行步骤在PLAYTEST.md。原剧时间码仍未取得，当前动作是原创而非影视动作复刻。音效调用/本地声音生成已验证，未真人试听。

对照结论、反例、撤回原因在DECISION.md。完整开发试作另存在codex/full-game-delivery/968f6b7，未合入本次，不可作为此版验收依据。

复现：npm run build；npm run verify；node tools/verify-readability.cjs；固定遭遇用tools/experiments中的encounter、replay、browser-encounter。浏览器检查用tools/browser-verify.cjs http或file，file之前关服务器并设REQUIRE_SERVER_OFF=1；UI/画面分别tools/ui-verify.cjs、tools/visual-readability.cjs。Playwright仅是工具依赖。
