# v7.1.1 场景物件验收

基线：`e6bc8515fc89ba266e7aeec40102aaea44cec613`。当前分支：`codex/scene-art-completeness-v7-1-1`。发行HTML SHA256：`e732a697e8868eac20847ce508552561a800e1fffaed6c85e1e5c040478c0131`。对应源码、PNG原图、裁切脚本与提示词均随本分支保存。

## 已实现

- 使用内置ImageGen生成四态黑莲阵眼，替换已毁阵眼及已借灯位置的灰色矩形。正常/破碎/待借灯/已借灯共用比例与落地锚点；不改变判定和存档。
- 终局两个阵眼不再出现实际不可使用的借灯造型。
- 借灯后的提示改为“借灯已毕”，试炼奖励提示改为“试炼已竟”，避免与熄灯状态混淆。
- 打包时检查25张PNG及50个地图/变化/阵眼切片的存在、尺寸、边界与锚点。浏览器另逐帧检查非空像素，确认资源实际解码。
- 已有试炼、归灯、掉落、地面、碎台、筏、桥、地刺、三境事件、山门和路边遗物的主体及状态清单见DESIGN.md。精确预警、血条和短粒子保持程序绘制。

## 已实际验证

`tools/verify-scene-art.cjs`使用固定种子`SCENE-ART-1027`；用公开JSON导入复现场景，再通过真实浏览器键鼠事件执行操作。首个阵眼设为1生命以聚焦状态切换；这不是自然整局通关。

- HTTP正式入口：`evidence/scene-v7/http/verification.json`，21项定向检查通过，无JS错误。左键实际破阵→F打开奖励→鼠标选择调息→铜碗熄灯；再次F不重复领奖。暂停与奖励界面内J不触发攻击。
- 停止5188预览后，在全新Edge会话断网打开`artifacts/portable-scene-v7/index.html`：`evidence/scene-v7/file/verification.json`，22项检查通过，HTTP请求为0，无JS错误。该入口与正式发行及最终ZIP入口使用相同SHA。
- 哪吒挑战模式在第二、三境高处阵眼仍能借灯；终局第一阵眼可由J飞环实际摧毁，随后F不进入奖励，显示破碎残座。
- 自动保存、刷新、导出再导入均保留“借灯已取”；schema仍为7。归灯一次性使用、试炼F开启、三种掉落自动拾取维持原规则。
- `npm run verify`通过；规则证据位于`evidence/scene-v7/rules/`，覆盖已有动作、构筑、存档及挑战规则。本轮未修改模拟、敌招或资源规则。
- 构建成功；资源逐项加载、50帧非空像素及颜色/落地信息在两个入口的`asset-inventory.json`。新四帧的底部不漂移，均落在同一帧内第61行。
- 局域网服务已恢复为`0.0.0.0:5188`；`http://10.11.177.26:5188/?v=7.1.1`返回当前发行版。

环境：Windows、Node.js v22.12.0、Edge Chromium、1366×768视口；精确系统与浏览器版本见JSON的environment字段。

## 画面和动态证据

- `http/before-ruined.png` / `http/after-ruined.png`：同种子、同相机、同姿态、同渲染时钟，对照灰色残块与新破碎莲座。
- `http/lamp-ready-in-game.png` / `http/lamp-spent-in-game.png`：实际操作后的火焰/黑灯芯变化；file目录有独立重复证据。
- `http/final-seal-ruined.png`：终局破阵后的残座。
- `catalogue-mountain/ferry/temple/final.png`：四境渲染检查，明确为控制状态样张。
- HTTP与file各有`seal-transition.mp4`：页面截图连续编码，5Hz请求频率、9帧、约1.8秒；真实采集时间见旁边JSON。已解码抽查首尾画面，内容为游戏及状态变化。这是短状态切换记录，不是整局录像或帧性能测量。

## 结论边界与脚本调整

我的实机画面检查认为，新残座已有明确莲瓣、碎石和莲纹，借灯可用/已用状态也能通过火焰与灯芯区分；这属于内部视觉判断。没有外部真人辨识或美术评分，不将资源检查通过等同于审美完成，也不宣称本轮补齐了角色所有逐帧动画。

初轮脚本在试炼按F后立即读取状态，早于模拟步；截图确认试炼实际已启动，后改为等待状态变化。另一轮错误地尝试通过存档移动地图固定补给，存档按原规则恢复固定坐标；改用真实预分配掉落复现拾取。两份失败记录保存在`first-attempt.json`与`second-attempt.json`，均为验收脚本问题，没有为迁就检查修改游戏规则。最终两个入口检查全部通过。

## 复现

```powershell
python tools/prepare-scene-art.py
npm run build
# 需可用的Playwright依赖；本机通过Codex随附NODE_PATH提供。
node tools/verify-scene-art.cjs http
# 停止5188服务后，另开新会话：
$env:GAME_ENTRY = 'artifacts/portable-scene-v7/index.html'
node tools/verify-scene-art.cjs file
```

离线ZIP为`artifacts/kong-rpg-offline-v7.1.1.zip`，最终SHA、入口一致性和ZIP校验见`evidence/scene-v7/package.json`。
