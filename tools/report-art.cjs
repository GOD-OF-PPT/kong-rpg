const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const manifest=read('release/manifest.json'),visual=read('evidence/art-v1/visual-checks.json'),ui=read('evidence/art-v1/ui-verification.json'),http=read('evidence/art-v1/browser-http.json'),file=read('evidence/art-v1/browser-file.json'),assets=read('assets/art-v1/manifest.json');
for(const r of[visual,ui,http,file]){assert.equal(r.sha256,manifest.sha256,'Evidence must match the release HTML');assert.ok(r.checks.every(c=>c.pass),'Checks failed');}
const h=http.runs[0],f=file.runs[0];assert.equal(f.networkRequests.length,0);
const text=`# ImageGen 美术实装验收 — v${manifest.version}

基线074b0f1，分支codex/imagegen-art-direction。使用用户指定的imagegen技能与内置image_gen工具；未调用CLI回退、未要求API密钥。

## 已生成、已保存、已接入

六项选定PNG：三境环境、悟空八姿态图集、敌人双姿态图集、莲纹石台；保存在assets/art-v1，源文件哈希见同目录manifest.json。首稿布局不合格的悟空图集另留为迭代记录，不进入运行素材。

提示词、输入图片角色与生成过程见PROMPTS.md。设计与取舍见DESIGN.md。运行时通过内嵌data URL加载；所有引用素材来自仓库内文件，未依赖Codex生成目录、CDN或在线生成服务。

## 已在运行画面核对

标题、首段、四阶段定向画面、初始舍利选择、指南，以及实际键鼠移动/跳跃/攻击/分身。1366×768和1440×1000下检查。透明图集实测有1,098,373个完全透明像素，图集中服装/武器不以色键抠图。

关键截图：final-title-1440.png、final-title-1366.png、final-mountain.png、final-action.png、final-relic-choice.png、final-guide.png、final-stage-1/2/3.png（均位于evidence/art-v1）。这些是实际运行画面，不是生成的游戏截图概念稿。

检查发现并修正：首稿长棍跨格；旧背景装饰与新场景冲突；标题人物悬空；标题人物先缩小再放大的模糊；背景细节与角色对比冲突。当前采用明确帧矩形/脚底锚点、直接原图标题角色、淡色轮廓与低对比背景。

## 发行与功能回归

Windows桌面Edge ${http.browser}，Playwright真实键鼠API（headless）。HTTP与关服断网file入口均从开始走过三境/奖励/无天结算，存档导出导入和暂停通过，未直接修改运行状态跳关。定向美术截图使用明确的合法导入样本，不能混同为自然整局游玩。

|入口|完整通关|帧间隔p95|输入到画布提交p95|峰值|运行异常|
|---|---|---:|---:|---:|---|
|HTTP|已通过|${h.performance.frameP95.toFixed(2)}ms|${h.performance.inputP95.toFixed(2)}ms|${h.performance.inputMax.toFixed(2)}ms|0|
|关服断网file|已通过|${f.performance.frameP95.toFixed(2)}ms|${f.performance.inputP95.toFixed(2)}ms|${f.performance.inputMax.toFixed(2)}ms|0|

file入口全新上下文offline，HTTP(S)请求0。现有模拟/碰撞/输入/存档源逻辑未改，只有内容版本号变化；本轮着重美术。图像解码计入启动，不将帧间隔视作启动时间；延迟指标不含硬件显示扫描。自动控制器曾停在悬台上方，已修正验收脚本明确下穿，没有因此修改玩法。

发行HTML ${manifest.bytes} bytes（包含全部PNG数据），SHA-256 ${manifest.sha256}。ZIP校验见打包输出。HTTP完整录像：${h.video}；file完整录像：${f.video}。较大的录像/trace仅在本机evidence/art-v1中保留，JSON与关键帧提交Git。

## 尚未验证或尚待细化

- 角色目前采用生成图集的关键姿态切换，奔跑只有一个主要姿态；不宣称完成连续多帧精修动画。
- 三张背景为整幅环境合成，不宣称已分离成多层视差素材。
- 四个敌人的主体造型与预警姿态已换，粒子、部分补给/门体仍沿用代码绘制，不伪称所有视觉元素均为ImageGen素材。
- 无外部真人美术/体验验收；当前是本次运行检查与设计判断。原剧逐帧资料和真人试听仍未取得。本轮不代表完整游戏开发已完成。

## 复现

Node18+：npm run build。会从源PNG自动生成src/generated-art.js，再构建独立release/index.html。生成脚本为可重建文件，未跟踪base64源码。浏览器检查：tools/check-art.cjs；整局tools/browser-verify.cjs http/file，设置EVIDENCE_DIR=evidence/art-v1，file前关闭预览服务器并设REQUIRE_SERVER_OFF=1。工具需本地Playwright与Edge，游戏不需要。
`;
fs.writeFileSync(path.join(root,'docs/art-v1/VERIFICATION.md'),text);console.log('Art release evidence matched',manifest.sha256,'with',Object.keys(assets.assets).length,'workspace assets');
