# 大圣 · 劫后行 v2

孙悟空题材的像素横版动作肉鸽。完整小体量旅程：三境六阵、境内借灯、三枚舍利取舍、无天终局、失败重开与原创尾声。保留v1原版与旧存档继续通路。

## 游玩

双击 release/index.html。离线包在 artifacts/kong-rpg-offline-v2.0.0.zip，解压后双击 index.html。无需安装或网络。PC键鼠为主要目标。

A D走，空格跳（长按高跳），S+空格下穿悬台，J/左键棍击，空中S+J下劈，K/Shift闪避，L/右键分身，E借灯或过门，Esc暂停。详细说明见 docs/v2/PLAYER.md。

## 运行与构建

Node18+，无运行依赖，无须npm install。npm run dev 打开 http://127.0.0.1:5188；npm run build 生成内联发行包；npm run verify 验证模拟、存档及发行约束。

浏览器验证需要本地Playwright与Edge：node tools/ui-v2.cjs；node tools/feedback-v2.cjs；node tools/playthrough-v2.cjs http；关掉预览服务器后设置 REQUIRE_SERVER_OFF=1 再运行 node tools/playthrough-v2.cjs file。STARTER=staff 可核对无二段跳起步。工具依赖不进入游戏运行包。

## 完整交付与证据

- docs/v2/DELIVERY-GOAL.md：用户更正后的完整交付标准。
- docs/v2/CONCLUSION.md：修改依据、对照、移除实验及不能下的结论。
- docs/v2/VERIFICATION.md：当前发行哈希对应的实际验证。
- docs/v2/PLAYTEST.md：未执行的外部试玩观察方案。
- evidence/v2/：原始动作/事件、规则验证、浏览器场景、性能与关键帧。录屏与trace保存在同目录的video及zip中，较大文件未提交Git。

固定遭遇对照需完整Git历史：node tools/experiments/encounter.cjs e5dc0b5；node tools/experiments/encounter.cjs working；node tools/experiments/replay.cjs。read-no-clone只在实验中禁用分身输入，不在发行版提供实验开关。

## 架构

src/content.js内容与种子，simulation.js独立固定步长模拟，input.js键鼠动作映射，storage.js版本存档，art.js统一锚点像素动作，renderer.js与visuals.js绘制，audio.js本地合成，app.js负责DOM与状态接线。没有CDN、远程字体、fetch地图或运行时生成接口。

## 边界

原剧可核实的逐帧片段、外部真人重开意愿与真人试听仍未取得。自动化与设计者关键帧检查不能替代这些证据。v1历史策划和报告留在docs根目录与发行包docs/v1，不能当作v2验收。
