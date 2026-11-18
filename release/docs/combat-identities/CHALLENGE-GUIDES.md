# v12.2.1 挑战模式隐藏敌招指示

基线2fac4c0，沿用codex/v13-combat-identities分支。挑战模式关闭敌人的预测范围/路径/射线、头顶标记、技能判定辅助边界及Boss当前招式与应对文字；普通模式保留。怪物准备动作、手部蓄力、实际技能效果、音效、血条、场景机关提示及主角技能提示继续显示。

使用同一showEnemyGuides状态判断Canvas与DOM，切回普通模式时恢复文字可见性。没有改动敌人的招式、时序、伤害、碰撞、连招或存档规则。更新挑战模式入口说明。

验收：tools/verify-challenge-guides.cjs分别使用HTTP和全新断网file上下文；19招各自测量辅助层像素，挑战为零、普通非零，两模式起手与释放效果均非空。通过公开存档导入后，真实点击恢复/暂停，分别截图斧斩、水柱与普通远射；Boss文字在挑战隐藏清空，挑战切回普通后实际DOM恢复可见，进行中存档仍可恢复。记录位于evidence/challenge-guides/{http,file}/verification.json，含对应发行SHA；file零HTTP请求、两入口零异常。截图只用于功能/视觉对照，不作为真人难度评价。

首轮像素探针把alpha=false画布的黑底当作已绘制像素，已修正为检查颜色；初始失败记录保留在http/initial-pixel-probe.json，没有为测试修改正式效果。
