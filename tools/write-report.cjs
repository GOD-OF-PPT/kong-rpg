const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const sim=read('evidence/simulation.json'),ui=read('evidence/ui-verification.json'),http=read('evidence/browser-http.json'),file=read('evidence/browser-file.json'),manifest=read('release/manifest.json');
for(const report of[ui,http,file])assert.equal(report.sha256,manifest.sha256,'Evidence must match the release HTML');
for(const report of[ui,http,file])assert.ok(report.checks.every(c=>c.pass));assert.ok(sim.results.every(c=>c.pass));
const f=file.runs[0],h=http.runs[0];const p95=a=>{const v=a.slice().sort((a,b)=>a-b);return v[Math.floor((v.length-1)*.95)];};
const text=`# 发行验收记录 — v1.0.0

日期：2026-10-25，Asia/Shanghai。分支：codex/black-lotus-pilgrimage。空仓初始化基线：1996b09a9e15774ea23e86f2dffede9fc1529418；之前不存在 HEAD。最终源码提交可用 git log 查看，HTML 以以下哈希绑定证据。

发行入口：release/index.html。${manifest.bytes} bytes。SHA-256：${manifest.sha256}。

## 已实现

原创像素横版平台动作，三境各两处阵眼、三次奖励、无天终局、胜负结算、同缘重开。六枚舍利改变空中跳、分身驻留/棍风、破盾三连、弹丸反射、下劈火环及续航。古渡高台阵眼、残庭断桥和无天护体/收招/换位要求不同的操作。

120Hz 固定步长独立模拟；棍击/踩踏/下劈/短长跳/二段跳/闪避/分身；DOM 菜单、文字、焦点和键鼠动作模式。暂停与失焦停止战斗；音量与屏震可调。版本化 JSON 存档，自动存储失败容错及真实导出导入。程序像素资产与 WebAudio 全部本地生成，不请求远程素材。

## 已实际验证

环境：Windows，Playwright 操作真实 Edge ${http.browser} 的键盘/鼠标 API，headless，正式发行 HTML；1366×768 与1440×1000。不是真人手动试玩，没有写入游戏运行状态来完成整局。只读 snapshot 用于观察与自动操作决策。

|验证层|结果|证据|
|---|---|---|
|模拟、内容、存档、打包|${sim.results.length}/${sim.results.length} 通过；盾正面/背面、固定输入重放、落点、下穿、分身保存、护体窗口均单独核对|evidence/simulation.json|
|DOM 与实际输入|${ui.checks.length}/${ui.checks.length} 通过，包含同种子构筑比较、快速点击、失败重开、存储禁用场景|evidence/ui-verification.json|
|HTTP 正式包完整流程|0→1→2→3→胜利，破阵${h.final.broken}/6，存档导出导入与暂停通过，无运行异常|evidence/browser-http.json|
|断网 file 完整流程|先停止本任务预览进程，检测5188端口不可连接；全新上下文 offline，阻断所有HTTP(S)，0→1→2→3→胜利，破阵${f.final.broken}/6，HTTP(S)请求${f.networkRequests.length}个|evidence/browser-file.json|

HTTP 自动操作局用时 ${h.final.time.toFixed(2)} 秒、剩余生命 ${h.final.hp}；file 自动操作局 ${f.final.time.toFixed(2)} 秒、剩余生命 ${f.final.hp}。这是了解地图且持续输入的自动策略，不能当作普通玩家时长或难度评价。过程允许真实坠落与受伤；没有无敌、加血、跳关或直接杀死Boss。

失败UI另用明确标记的低血量导入样本触发，随后真实输入同缘重开；该定向场景不冒充自然死亡整局。失焦以 blur 事件覆盖处理路径，不声称跨应用原生焦点切换已验收。

## 性能与可见反馈

|入口|帧数|帧间隔p95|事件到提交样本|事件到提交p95|最大值|
|---|---:|---:|---:|---:|---:|
|HTTP|${h.performance.frames}|${h.performance.frameP95.toFixed(2)}ms|${h.performance.inputSamples}|${h.performance.inputP95.toFixed(2)}ms|${h.performance.inputMax.toFixed(2)}ms|
|file|${f.performance.frames}|${f.performance.frameP95.toFixed(2)}ms|${f.performance.inputSamples}|${f.performance.inputP95.toFixed(2)}ms|${f.performance.inputMax.toFixed(2)}ms|

事件到提交：浏览器输入处理器时间戳，到固定步模拟处理后的 Canvas 绘制提交，包含有意的命中停顿延后。通过预先设定的 p95 <50ms 与帧间隔 p95 <25ms 目标；不是设备端到端延迟，峰值不能省略。

另测首次可见反馈 ${ui.visibleFeedback.length} 次：3次跳跃、3次棍击、1次分身、1次闪避。keydown 后同时等待相应模拟状态转移及玩家区域 Canvas 像素变化，才记录反馈。范围 ${Math.min(...ui.visibleFeedback.map(x=>x.ms)).toFixed(2)}–${Math.max(...ui.visibleFeedback.map(x=>x.ms)).toFixed(2)}ms，样本p95 ${p95(ui.visibleFeedback.map(x=>x.ms)).toFixed(2)}ms。该测量比仅等下一帧更具体，仍不包含操作系统设备栈、合成器到显示器扫描与屏幕发光，且8个样本不能代表所有招式/硬件。原始数据见 ui-verification.json 和两份 input-metrics.json。

## 实际美术检查

已逐小批查看标题、首境、奖励、终局、手记与失败画面；检查两种桌面尺寸、角色/盾兵/莲灯使轮廓、落脚面亮边、HUD 与阅读层。发现奖励提示覆盖标题，已在切换模态时清除提示；发现下穿缺失、恢复点靠近坑沿及快速点击丢失，均修改后复核。

最终画面：evidence/final-title-1366.png、final-combat-1366.png、final-guide-1366.png、final-failure.png、file-reward-1.png、file-victory.png。录屏与 trace 保存在本机 evidence/video/、evidence/file-trace.zip、evidence/http-trace.zip（体积较大，未放入Git）；实际录屏相对路径记录在两份 browser JSON。

## 仍有的边界

- 原剧候选播放器元数据已取得，但04:00片段无法播放。未取得可核实原剧集数/时间码，不能称为已完成原剧逐帧研究。竞品已读官方一手说明，未进行原版游戏亲玩或连续片段拆解。详见RESEARCH.md。
- 未取得外部真人试玩；危险是否易懂、死亡解释是否清楚、构筑是否同样有趣、玩家是否自愿重开，均没有真人证据。
- 声音已验证真实触发本地 WebAudio 与音量控制；未完成真人听觉质量评审。截图检查是本次视觉判断，不是独立美术专家验收。
- 已验证桌面 Edge；未宣称广泛移动适配、全部浏览器、所有显示缩放或完整无障碍审计。其余边界不阻止已交付离线PC闭环。

## 复现

无运行依赖，Node18+可运行 npm run build、npm run verify。浏览器脚本需要本地 Playwright 与 Edge：node tools/browser-verify.cjs http；停止 tools/serve.cjs 后，设置 REQUIRE_SERVER_OFF=1，运行 node tools/browser-verify.cjs file；node tools/ui-verify.cjs。本次使用Codex自带Playwright包，通过NODE_PATH定位，没有把这些工具作为游戏运行依赖。

后续只要改了发行HTML，重新执行对应验证并用 node tools/write-report.cjs 确认报告哈希一致。不要把早期或失败样张当作最终验收证据。
`;
fs.writeFileSync(path.join(root,'docs/VERIFICATION.md'),text);console.log('Wrote verification record for',manifest.sha256);
