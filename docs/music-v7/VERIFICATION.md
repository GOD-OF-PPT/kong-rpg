# 背景音乐接入 · v7.1.3

基线`48df77fdd94f2959266056d8d54282731cfa0328`；分支`codex/background-music-v7-1-3`。接入用户放在`assets/music/`的三首MP3，保持原字节与内嵌元数据，不重新生成或转码。

|文件|时长|源平均电平 / 峰值|播放增益|
|---|---|---|---|
|menu-01.mp3|97.91秒|-21.7 / -1.1 dB|0.75|
|menu-02.mp3|126.35秒|-16.7 / -0.1 dB|0.42|
|gameplay.mp3|147.07秒|-13.8 / 0.0 dB|0.30|

电平为ffmpeg volumedetect的全曲RMS/采样峰值，非LUFS或真人响度评价。播放增益使全曲RMS接近同一水平，再经游戏既有总音量与限幅链路；音乐和打击音效共用总音量。文件SHA、字节数、声道和采样率在`assets/music/manifest.json`。

## 播放规则

- 首页：遵循浏览器策略，第一次实际点击/按键后开始。洗牌选择两首中的第一首，播完轮换，避免连续重复；选人/开篇延续首页曲，不逐页重启。
- 战斗：所有关卡使用gameplay原曲单曲循环，移除原合成背景旋律；挥空、命中、预警和界面音效保留。
- 场景切换：约0.65秒线性淡入淡出；快速来回也从当前增益继续，不留下旧定时器切断新曲。
- 暂停/法门/战斗手记：当前战斗音乐降至28%且继续走时；奖励/替换降至48%；继续战斗恢复音量，音乐不从头开始。
- 死亡/胜利/尾声/旧版入口：音乐淡出；回首页恢复随机轮换。隐藏页面立即暂停，重新可见恢复。总音量0静音，并沿用既有设置持久化。

## 离线接线

`pack-music.cjs`核对三首MP3的SHA，然后生成忽略跟踪的`generated-music.js`。正式HTML将编码后的音乐和播放脚本全部内联。使用HTMLAudioElement按需解码长曲，经MediaElementAudioSource接入WebAudio，避免一次性展开三首长曲的PCM缓冲；没有fetch、CDN或远程资源依赖。

运行时不要求安装ffmpeg。ffprobe/ffmpeg只用于本轮检查源格式和电平。源码、MP3、清单及发行HTML均保存在仓库；全量ZIP大于100MiB，作为本地发行物保留。

## 实际验收与边界

`tools/verify-music.cjs`通过真实浏览器点击、键盘、音量滑条、奖励和存档入口验证。另以输出节点上的分析器确认实际输出有非零音频，音量0时数字静音；不是只检查媒体标签或播放计时。

- HTTP：`evidence/music-v7/http/verification.json`，20项检查通过，无页面/音乐解码错误。首页两曲均实际播放；进入游戏淡变后只剩战斗曲；暂停/奖励降低增益、读档和回首页正常，真实棍击仍触发已有采样。
- 停止5188服务后，全新Edge会话断网、阻断所有HTTP，直接打开`artifacts/portable-music-v7/index.html`：`file/verification.json`，21项检查通过、HTTP请求0、无音乐播放错误。
- 为避免等待整首播放结束，明确对实际音乐元素跳到结束前250毫秒，再让真实ended/loop处理执行。记录在`mediaSeeks`；未伪造ended事件。首页换曲与战斗循环后媒体继续前进。
- 两种洗牌首曲分支用受控随机数做选择层检查，单独标记，不把概率抽样当作保证。快速切换菜单/继续三次后，只有预期曲仍在播放。
- 隐藏页：无头宿主另开标签未产生真实visibilitychange，因此生产监听器另用显式隐藏/恢复信号验证；没有冒充操作系统前后台切换验收。
- `npm run verify`通过，现有动作、普通/挑战规则和schema7存档回归证据保存在`evidence/music-v7/rules/`。本轮不修改模拟或关卡。

环境：Windows 10.0.26200、Node.js v22.12.0、Edge 156.0.4314.42、1366×768；精确版本见JSON。源格式/输出波形/播放/混音路径已验证；没有真人耳机试听，不声称循环接点在音乐上无缝或完成主观混音验收。

发行HTML SHA256：`d0a6477a048b9dbf1dc35c9f46c7cdd06bfe497e1ce90e8aa1322003936d8924`。最终ZIP与正式入口的一致性、CRC及SHA见`evidence/music-v7/package.json`。

## 复现

```powershell
npm run build
# QA需本机Playwright；游戏与离线包不需要它。
node tools/verify-music.cjs http
# 停止5188服务后：
$env:GAME_ENTRY = 'artifacts/portable-music-v7/index.html'
node tools/verify-music.cjs file
```
