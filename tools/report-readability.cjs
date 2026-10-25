const fs=require('fs'),path=require('path'),assert=require('assert/strict');const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const manifest=read('release/manifest.json'),http=read('evidence/readability/browser-http.json'),file=read('evidence/readability/browser-file.json'),ui=read('evidence/readability/ui-verification.json'),visual=read('evidence/readability/visual.json'),contract=read('evidence/readability/contract.json');
for(const report of[http,file,ui,visual])assert.equal(report.sha256,manifest.sha256,'Evidence must match final release');for(const report of[http,file,ui])assert.ok(report.checks.every(x=>x.pass));assert.ok(contract.results.every(x=>x.pass));assert.ok(visual.sweep.pass);
const h=http.runs[0],f=file.runs[0],samples=ui.visibleFeedback;const min=Math.min(...samples.map(x=>x.ms)),max=Math.max(...samples.map(x=>x.ms));
const text=`# 玩法与美术修正验收 — v${manifest.version}

分支codex/readable-combat，基线e5dc0b5。活动目标限定为一个核心体验矛盾，且优先玩法与运行美术；本报告不宣称完整游戏制作已完成。

发行HTML：${manifest.bytes} bytes；SHA-256 ${manifest.sha256}。新版新开局rules=2/schema=2，旧进行中存档恢复rules=1/schema=1，原物理输入重放与原版一致。旧档不悄悄换战斗规则。

## 实际交付

连续轻棍不再暂停普通敌人已发出的预警/攻击计时；重击、下劈与踩踏能短暂打断。可选择以跳避换时间或以分身换资源，保留极限距离连按可无伤的反例。攻击和地图内容数量、敌人血量、原判定盒均保持原版合同。

原创程序像素动作：悟空出棍/收招/跳/落/闪避/受伤/死亡，敌人举刀与挥刀；青色友方分身，限制残影密度，落点影子贴近实际平台。刀光和碰撞共用攻击盒；预警/有效攻击/打断都有各自的本地声效事件。无远程素材或运行依赖。

## 验证分层

|层次|实际证据|限制|
|---|---|---|
|固定遭遇|encounter-before/after.json、replay.json逐动作重放；配对距离/生命/构筑|种子在此遭遇等价，不算独立统计样本；不代表所有敌群|
|实际键鼠对照|encounter-browser.json及时间戳批次含按键、采样阶段、伤害、声音事件、完整录像路径|合法存档建立起点；不是从新档走过全程；脚本非真人|
|完整HTTP|三境、奖励、无天结算、暂停与导出导入都通过，零运行异常|知道地图的控制器，用时不当普通玩家时长|
|关服断网file|先验证5188服务关闭，全新offline上下文完整通关；HTTP(S)请求${f.networkRequests.length}|仅桌面Edge环境，不泛化全部平台|
|存档/输入|实际按键、鼠标、菜单门控、损坏导入、自动存储禁用后导出、失败重开|失焦覆盖blur处理路径，未声称跨应用原生操作验收|
|画面|小批查看动作/战斗/奖励截图；visual.json记录横扫绘制与物理盒一致|设计者判断，不是外部美术专家认可|

环境：Windows桌面，Playwright控制Edge ${http.browser}，headless；1366×768与1440×1000。正式包通过键鼠完成整局，未直接写入状态来跳关或击杀Boss。定向失败/构筑/遭遇样本与整局证据分开记录。

## 实测

|入口|完整通关模拟时长|剩余生命|帧间隔p95|事件到提交p95|最大事件到提交|
|---|---:|---:|---:|---:|---:|
|HTTP|${h.final.time.toFixed(2)}s|${h.final.hp}|${h.performance.frameP95.toFixed(2)}ms|${h.performance.inputP95.toFixed(2)}ms|${h.performance.inputMax.toFixed(2)}ms|
|file|${f.final.time.toFixed(2)}s|${f.final.hp}|${f.performance.frameP95.toFixed(2)}ms|${f.performance.inputP95.toFixed(2)}ms|${f.performance.inputMax.toFixed(2)}ms|

事件到提交包含命中停顿，指浏览器事件处理到模拟处理后画布提交，不包含硬件和显示扫描。首次可见反馈额外测${samples.length}次，要求相应状态变化和玩家区域像素变化同时出现，范围${min.toFixed(2)}–${max.toFixed(2)}ms；小样本不能证明全部动作延迟。

完整录像：${h.video}；${f.video}。trace：${h.trace||'evidence/readability/http-trace.zip'}；${f.trace||'evidence/readability/file-trace.zip'}。录像/trace本机保存，未提交大文件；关键帧与原始JSON随Git提交。

## 边界与后续

真人首次游玩是否能读懂、主动改变打法及自愿重开，均未验证。可执行步骤在PLAYTEST.md。原剧时间码仍未取得，当前动作是原创而非影视动作复刻。音效调用/本地声音生成已验证，未真人试听。

对照结论、反例、撤回原因在DECISION.md。完整开发试作另存在codex/full-game-delivery/968f6b7，未合入本次，不可作为此版验收依据。

复现：npm run build；npm run verify；node tools/verify-readability.cjs；固定遭遇用tools/experiments中的encounter、replay、browser-encounter。浏览器检查用tools/browser-verify.cjs http或file，file之前关服务器并设REQUIRE_SERVER_OFF=1；UI/画面分别tools/ui-verify.cjs、tools/visual-readability.cjs。Playwright仅是工具依赖。
`;
fs.mkdirSync(path.join(root,'docs/readability'),{recursive:true});fs.writeFileSync(path.join(root,'docs/readability/VERIFICATION.md'),text);console.log('Verified evidence hash',manifest.sha256);
