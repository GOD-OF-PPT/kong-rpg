# v12.1.2 机制、资源与角色技能复查

基线5cee1a0b55aebe413fabc1d8592ab838fda72981 / v12.1.1，工作区干净。分支codex/v12-mechanics-skill-audit。本次保留三英雄、十五关、五章首领和四项秘技，没有添加技能或地图。

## 有证据的修复

|原问题|修正|预期行为与对照|
|---|---|---|
|杨戬H引弦后按R召犬或C蓄神光，弓仍在后台计时，隐藏发箭|大招、秘技接管动作时取消未完成的引弦与兵器姿势|换招只执行当前可见动作；旧版实际键鼠重现bow-fire，新版没有|
|杨戬U保留主攻计时与缓冲；R保留之前的冲步速度|神行步取消主攻与缓冲，按输入方向移动；召犬清理冲刺、下劈和速度|不在冲步姿势下暗中挥刀，召犬起势不继续平滑冲刺|
|杨戬U沿用上一次dashTargets，“回身诀”第二次穿过同一敌人不再伤害|每次神行步建立新的命中名单|两次独立穿身分别结算；同一次移动仍不会反复伤害|
|悟空、哪吒受伤反应中按L仍能花定力释放分身/混天绫|受伤阶段不接收L；K仍可主动脱离受伤反应|画面与实际可操作状态一致，未释放时不扣费|
|悟空H能和尚未结束的伸棍重叠|副武器替换当前未完成的伸棍与主攻姿势|不会同一时刻暗中保留两套个人兵器动作|
|杨戬踏云履写明空中刀法更远，判定却没有变化|空中三连各增18世界像素；地面范围不变|距离外目标仅在腾空并持踏云履时可命中；渲染刀轨读取同一attackBox|

取消逻辑只处理角色未完成的兵器动作。已发出的飞弹、乾坤圈、分身、天眼区域、哮天犬保留各自生命周期。三头六臂仍可组合投环、风火轮和大招，没有通过强制轮换技能制造深度。伤害/起手、Boss血量、关卡和挑战S资格没有调整。

## 原始复现与验收

evidence/mechanics-recheck-v12/：before/contracts.json记录8项初始失败；browser-before-timed/contracts.json用真实按键复现7项衔接失败并留连续录像。第一轮browser-before无帧间隔，部分按键落在同一步，不能当作可靠的顺序动作证据，故保留该失败工具记录并补35ms输入间隔。counterstrike-before记录单独新增的回身诀重复命中失败。after/contracts.json为12项约定的新结果。

工具probe-skill-contracts.cjs直接调用生产K.step；browser-skill-contracts.cjs通过公开存档导入准备初始场景，后续使用真实键鼠并只读snapshot。没有在战斗中注入伤害或改判定。固定种子SKILL-CONTRACTS-1028 / SKILL-BROWSER-1028。

战役回归检查覆盖普通/挑战、评分、S解锁、实际机关破坏、召兵不刷分、十五关奖励/结算边界与旧档隔离。check-mixed-actions.cjs对三角色×两模式×十五关使用固定种子组合输入，周期校验公开存档；这种检查只证明合法性，不能冒充完整恢复后持续等价。

相同Boss控制器对照基线与修后：站桩都为0/30胜、平均3.5次受伤；读全状态控制器都为12/30胜，平均受伤从1.83变1.90，两个杨戬场景各多受伤一次。去除后台动作没有提高控制器通关数，也没有据此削弱Boss。该控制器不是人，不能用其12/30宣称玩家的难度适合。

## 美术与运行边界

本次没有新增或替换美术源图。70张内嵌PNG、546切片和必要状态检查继续生效；角色动作、五区敌人/首领、机关两态、四项秘技以及动态帧引用均复查。技能切换截图/录像核对“看见的动作”和系统事件；资源完整不等于每个动作都已达到理想质感。

环境Windows、Edge Chromium，Canvas960×540；技能操作viewport1440×1000。HTTP与断网file://的动作/存档和渲染结果按入口哈希记录。没有取得外部真人试玩或听感意见，整体趣味、危险辨认速度和难度评价继续保留。

自然旅程、最终ZIP、入口哈希与验证目录见同目录FINAL.md及evidence/mechanics-recheck-v12/FINAL.json。悟空旅程结束前后仅有杨戬神行步清空dashTargets这一处变化；旧入口按SHA留在artifacts/mechanics-wukong-run/index.html，范围说明为wukong-scope.json。不把旧入口的旅程冒充最终哈希重新通关。

复现：node tools/probe-skill-contracts.cjs；node tools/check-mixed-actions.cjs；npm run verify；npm run verify:audit。SKILL_EVIDENCE_DIR / RULE_EVIDENCE_DIR指定本轮证据目录。浏览器使用本机Playwright，SKILL_BROWSER_DIR指定输出，GAME_ENTRY指向真实解压包；运行node tools/browser-skill-contracts.cjs http或file。发行游戏无需QA依赖。
