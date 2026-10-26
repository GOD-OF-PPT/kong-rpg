# v6.1.0 音频验收边界

基线：分支`codex/ranged-hero-v6`，起始HEAD `57e06166ecadeda2edf2001a82d315176b5abe75`，工作树干净。保留v6.0.2的拾取修正、HUD及v1–v5发行入口。本轮只更改声音播放和素材打包。

## 方法与预先标准

1. 实际键盘输入经过正式输入、模拟和事件路由：轻棍、第三棍、盾挡、下劈、R大招、哪吒飞环各发对应采样。挥空不得发接触声；同一次范围攻击命中阵眼与敌人仅发一次主体声。
2. 用版本化种子`AUDIO-1026`与可导入的合法schema6场景存档定位遭遇，不改正式规则。浏览器通过真实UI导入、继续，再按键；这是定向功能检查，不是未辅助的整局通关或真人试玩。
3. 新建AudioContext在用户点击后全部解码；正常路径解码错误与合成回退均为0。暂停阻断战斗输入并释放采样，音量0实际渲染为数字静音，重载设置与导入/导出均可恢复。
4. OfflineAudioContext以48kHz同时渲染六类声音、预警及20次重复轻击。峰值须小于0.99、输出非零，同类重复须合并，活动采样不超过6；第833 ms之后不得残留采样尾音。此方法验证数字信号，不证明扬声器、耳机上的听感。
5. 本地HTTP正式入口与关闭服务器后的全新断网`file://`会话执行同一流程；file入口HTTP请求数须为0。不使用缓存、浏览器安全参数或远程资源。

执行：设置`NODE_PATH`至可用Playwright依赖后，`node tools/verify-audio.cjs http`；关闭5188预览服务，再执行`node tools/verify-audio.cjs file`。`npm run verify`继续检查既有玩法与存档约束。压缩包由`python tools/package-release.py`制作，`EVIDENCE_DIR=evidence/audio-v6 node tools/verify-package.cjs`核对CRC与入口哈希。

## 结果及复核位置

2026-10-26，Windows PC、Edge 156.0.4314.42、1440×1000、真实时间requestAnimationFrame自动键鼠操作。环境细节、当前正式入口SHA256、每个按键场景与音频调度记录见`evidence/audio-v6/http-verification.json`及`file-verification.json`；合法场景存档同目录`*-fixture.json`，操作录像在本地`video/`。未剪辑录像不含系统回录音轨，不冒称音频听感证据。

HTTP和断网file路径均通过上述动作、声音路由、暂停、设置、存档与解码检查；没有页面运行异常。六声叠加压力样本峰值约0.799，静音输出0，采样尾声在下一秒前结束。`AudioContext`报告baseLatency约10 ms、outputLatency约40 ms，属于浏览器估计；没有麦克风回环测量，不是实际键入到耳机出声的总延迟。

`evidence/audio-v6/rules.json`为本次既有规则验证副本；旧版验收记录保留。`package.json`记录发行包CRC、文件列表和入口哈希；`release/manifest.json`必须与音频验收记录的入口哈希一致。

已确认：离线内嵌、音频解码与调度、动作对应、去重、幅度边界、音量和存档。尚未确认：真人主观试听、打击感偏好、不同扬声器/耳机及其他浏览器。试听页和连续音效片段已提供，用于后续听感调整；不能用自动化通过替代这些结论。
