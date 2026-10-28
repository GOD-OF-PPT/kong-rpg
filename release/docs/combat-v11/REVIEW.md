# v11 战斗修订

基线201b65ec8b520325290d5906f6d9603c75357441 / v10.0.3，开发分支codex/v11-combat-feedback。本轮修复技能重叠、哪吒大招、首领压制循环和接触反馈，不增加关卡。

## 问题与最终规则

|实际问题|修正|预期选择|
|---|---|---|
|悟空H/L都生成分身|H改破空棍劲：22定力、0.8秒冷却、28基础伤害，首次碰撞消散；L保留分身|定向点打与驻影诱敌分开|
|杨戬H确为射雕弓，L确为天眼，但姿势混淆|L清除当时的攻击缓存，抬手/额目亮起；H保留引弦射箭|区分点射和锁区识破|
|哪吒R原有64伤害，却无持续强化|两段36+28，附枪4秒，主武器有效接触追加6基础伤害，受护体削减；HUD倒计时|大招后抢枪法窗口，不强化混天绫/其他重击|
|首领易被R无限打断，站桩4.7–8.8秒清五Boss|取消R必打断、降低首领回怒；架势正面非穿透35%、穿透60%，背后/收招全伤，大招绕过架势|读招、绕背、破机关和择机追击|
|大片特效、爆点在头部或随角色漂移|按实际碰撞交集定位；保存释放盒；小接触材质和透明轮阵中心；去掉犬咬重复爆点|命中/格挡/受伤可区分，空挥无假命中音效|

首领生命保持300起、每章+18。章末收招0.55秒并撤步：秦广王170、九头虫230、其他200世界像素/秒；持续攻击时跑速125，松开攻击245，不能一直按攻击贴着撤步首领取全伤。章末重招36、飞弹28、冲撞30；小首领保留原伤害。首段起手0.84秒、追击0.68秒，各自独立锁定预警；普通奇数次接追击，挑战偶数次也接。破潮珠/塔基仍可主动中断，秦广王判牒仍有原护体。

## 被推翻的初版

初版撤步较慢、收招1.05秒、重招18伤，虽然站桩0/10胜，但加入只追着打、技能到冷却就放的控制器后，模拟30/30胜；因此不能宣称挑战性成立。对应旧发行SHA为2cdb5fb6a07cf2761d4278b141cbf270240ef23279e338fe2f78349923331602，实际HTML仍在artifacts/portable-combat-v11，旧录像和输入均保留。

之后才收紧撤步、收招和重招代价。此过程及修订目标写入ACCEPTANCE.md；不是把站桩失败当作所有连按策略失败。最终规则的同条件90场模拟为站桩0/30胜、盲追8/30胜、读招29/30胜；平均受伤分别3.50、3.07、1.37次。允许部分局面付出生命代价强攻。控制器读完整状态，这不是玩家胜率统计。

## 运行与原始证据

最终入口SHA256：c3cfe9930cebfb0d7c0946e14b9820a284cc79b03ab5b167b4f6147c64d7d916。版本11.0.0 / schema11。

- 修前探针：evidence/combat-v11/before/probe.json。悟空H/L共用、杨戬分立、哪吒64伤害及五Boss站桩时长均有原始状态。
- 最终模拟：pursuit-comparison.json，三英雄×五Boss×两难度×三策略，种子BOSS-V11-PAIR，等量初始100生命/定力/战意及第一枚破军舍利。另有pursuit-experiment.json与simple-strategy.json保留实验/反例。
- 规则：regressions.json的11项覆盖技能、附枪边界/到期、存档、架势、追击、接触/空挥、投射碰撞、36伤危险中途恢复、旧版保护。既有campaign/audit在final-rules重新运行。
- 动作：final-actions-http-fixed/verification.json，72项、57画面。三英雄两难度、实际键鼠H/L/U/R/C、受伤、附枪主攻接触、暂停与导出恢复。动作靶场人为将目标保持在8秒active计时，不能用来评价Boss AI。
- 首领实战：final-boss-http/boss-input.json，哪吒普通/挑战各五Boss×追打/读招。首轮追打6/10胜、读招7/10胜；控制器会主动走回危险区且固定100像素避让在墙边失效。改为保持安全侧和按危险边缘选落点后，秦广王两难度在final-boss-edge-http通关，龙王挑战在final-boss-read-http通关。不同轮次不拼成同一统计样本。每场保留fixture、输入、伤害、状态采样、截图和连续Canvas录像。
- 初版美术：art-http/review.json，60张PNG、308登记帧、352渲染场景；最终平衡修订未改素材和Renderer。最终动作另做实机捕获。新8类材质的ImageGen原图、图集、热点与归一SHA在assets/combat-v11；提示词见PROMPTS.md。

环境：i5-14600K，Windows10.0.26200，Edge156.0.4314.50，Canvas960×540，DOM文字独立；首领viewport1366×850，整局1440×1000。Playwright使用真实keydown/up和鼠标，运行时只读snapshot，战斗中不改模拟状态。首领场景从公开导入准备，整局从菜单新开。

软件延迟记录在各报告metrics中：事件至下一次模拟/Canvas提交的代理指标，不等同物理键至屏幕发光。早期boss-http最后10000活动帧间隔p50=5.6ms、p95=5.7ms、最大22.4ms；297输入提交间隔p50=4.3ms、p95=10.6ms、最大60.7ms。该轮同时录制且有另一浏览器，数值不能外推其他PC。录像请求30Hz，未独立检查编码帧率，未完整人工观看全部录像；旧工具中“ffprobe已检查”的固定措辞不成立，已修正。

动作验收中保留了三类脚本失败：固定230ms早于大招首次实际伤害；先给了S资格再要求A导入后锁挑战；收招靶场目标现在会撤步导致固定位置六臂空挥。分别改为等实际释放、隔离资格context和静态动作靶；不为这些断言修改正式战斗规则。

## 最终整局与发行验收

相同入口SHA下，哪吒HTTP普通从菜单自然完成15关/110计分敌人/15首领，339.99活动秒、16次受伤，S/92分，见final-normal-http-retry/playthrough.json。失败的前一次控制器尝试保留在final-normal-http，不计为通过。

用该真实S导出存档，在全新离线file会话中解锁挑战，再从第一关自然完成15关/155计分敌人/15首领，367.57活动秒、23次受伤，A/88.5分，见final-challenge-file/playthrough.json。两条都完成奖励、六臂、R、风火轮、中途暂停导出恢复、结算/尾声、自然失败及同种子重开。服务器关闭、HTTP请求为零。没有为整局注入资源、击杀或跳关；资格导入是已完成普通S。

最终file动作73项/57画面、352渲染场景均通过且零运行错误；记录分别为final-actions-file/verification.json与final-art-file/review.json。live-contacts-file保留真实R之后的附枪主攻命中左右方向关键帧和当时effects；使用存活命中事件采样，避免固定延时错过短特效。

源码及JSON记录随仓库保留；截图、连续录像与完整离线ZIP保留在本地工作目录，未把大体积录像加入Git。自动操作有选择与时序差异，普通和挑战两局不是同输入的平衡对照。

## 存档与离线

新规则key为kong.black-lotus.v11。原样保留release/legacy-v10.html，SHA256为249bfb53be5263c95ce973f578569724d72be6d23c1cf1527274ec1e540fa7b3。旧旅程导入后回原版继续；同源本地v10普通S资格可保留，已有S资格不因导入A而丢失。附枪、天眼姿态和棍劲投射物可导出恢复。

发行HTML内嵌脚本、图片、音乐及音效，无CDN、模块fetch或远程字体。离线验收使用最终ZIP解压后的artifacts/portable-combat-v11-final/index.html，关闭5188服务，新建context，setOffline(true)且拒绝所有HTTP(S)请求。发行包/CRC/入口SHA记录在package-final.json；服务关闭证据另存。

## 复现

需要Node、Playwright以及Windows Edge；发行游戏本身不需要Node或安装依赖。

```powershell
$env:NODE_PATH='C:\Users\KSG\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node tools/verify-combat-v11.cjs
node tools/compare-pursuit-v11.cjs
$env:AUDIT_EVIDENCE_DIR='evidence/combat-v11/recheck-actions'
node tools/browser-combat-v11.cjs http
$env:BOSS_STRATEGIES='chase,observe'
$env:BOSS_EVIDENCE_DIR='evidence/combat-v11/recheck-boss'
node tools/browser-boss-v11.cjs http
$env:HERO='nezha'; $env:DIFFICULTY='normal'
$env:EVIDENCE_DIR='evidence/combat-v11/recheck-flow'
node tools/playthrough-combat-v11.cjs http
```

file检查先关闭服务器，设置GAME_ENTRY为最终解压index.html，命令末尾改file；使用不同证据目录保留失败。自然旅程控制器及输入副本随各playthrough.json保留。输入采样为浏览器事件/观察频率，未宣称逐模拟帧无损重放。

## 主观边界

没有外部真人试玩、访谈或音响听审，不宣称玩家已认可难度、打击感或重开意愿。最终90场模拟有1场读招控制器失败（杨戬挑战托塔天王），不能声称所有读招策略必胜；三英雄完整十五关均重新自然通关也尚未成立。旧v10及初版v11整局记录不能算最终版本通关。
