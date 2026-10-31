# Vite 构建与首屏验收

Vite 8.3.5 管理开发服务、JS/CSS 打包、压缩、内容哈希和资源清单。`npm run build` 的唯一输出目录是 `dist/`，其中只包含当前游戏的运行文件。`release/` 保留历史档案，不再作为默认构建目录。

## 命令

| 命令 | 用途 |
| --- | --- |
| `npm ci` | 安装锁定依赖，需要 Node.js 20.19+ 或 22.12+ |
| `npm run dev` | 开发服务，默认 `127.0.0.1:5173` |
| `npm run dev:lan` | 开放开发服务到局域网 |
| `npm run build` / `npm run build:web` | 生成干净的 `dist/` 网络包 |
| `npm run preview` / `npm run preview:lan` | 预览 `dist/`，默认端口 4173 |
| `npm run build:offline` | 单独生成可双击打开的 `dist-offline/` |
| `npm run build:all` | 同时生成网络和离线两个目录 |
| `npm run verify:build` | 检查网络包内容、资源数量和哈希、压缩、缓存、路径及音频 Range |
| `node tools/verify-vite-build.cjs --offline` | 同时检查网络和离线包 |
| `npm run verify:start-loading` | 检查三角色首次开始只有一轮进度，达到 100% 后不会重来 |
| `npm run verify:boss-hud` | 检查加厚血条、实际生命值、五首领及不同视口避让 |
| `npm run verify:fullscreen` | 检查原生全屏、F10/Esc、窗口适配、鼠标坐标和受限环境回退 |
| `npm run verify:startup` | 三次冷缓存首屏检查，结果在 `evidence/vite/startup.json` |
| `npm run verify:ui-security` | 检查源码与正式脚本的动态 HTML 解析接口 |
| `npm run verify:release` | 游戏规则、产物、安全与首屏的组合检查 |
| `npm run package:offline` | 生成只含当前游戏运行文件的离线 ZIP |

```text
dist/
  index.html
  game.<hash>.js                 # 另附 .br / .gz
  manifest.json
  assets/
    style.<hash>.css             # 另附 .br / .gz
    images/*.webp               # 81 张无损图片（含 Boss 特效和血条外框）
    audio/*.wav                 # 8 条音效
    music/*.mp3                 # 3 条音乐
```

`dist/` 不复制 docs、README、历史 HTML、试听页或离线目录，完整部署该目录即可。构建生成完整产物后采用原子替换写出，最后清理本次依赖清单以外的旧文件；清理范围被限制在项目根下的 `dist/` 与 `dist-offline/`，不遍历符号链接，不删除历史 `release/`。

## 图片与音频

`src/main.js` 按原顺序导入游戏扩展。`virtual:kong-media` 提供小 URL 清单，网络包以独立 WebP/WAV/MP3 文件交付，图片和音频没有整体嵌入主脚本。图片重新编码时校验尺寸、非透明像素和 alpha；缓存绑定原图 SHA、编码器版本及输出 SHA。

首页仅预加载字标、山景、悟空和石台四张图片。点击开始新旅程后，将选择界面和三名可选角色的首关素材合并为一轮准备；这轮进度达到 100% 后，选人、选舍利到进入战斗不再出现第二轮进度。续关、导入和后续章节仍通过 `ImageArt.load/forRun` 按需加载，音乐等待真实用户操作。脚本与资源均使用相对路径；preview 提供 Brotli/gzip、哈希文件 immutable 缓存、ETag/304 和音频 Range。其它托管服务应配置相应响应头。

`dist-offline/` 使用带 defer 的经典脚本和按需本地数据脚本，让 Chrome/Edge 在 file 协议下正常裁剪 Canvas 和播放音频，因此离线图片及音乐的部分文件后缀为 JS，音效嵌入主脚本。它是单独选择的兼容产物，不是默认网络包。离线包也不带 docs 或历史 HTML；发现旧存档时可以导出备份并在对应原版中继续。

## 性能门槛

构建拒绝网络主脚本 >512 KiB、离线主脚本 >640 KiB、HTML >32 KiB、CSS >96 KiB、网络首页未压缩依赖总量 >5 MB。

`verify:startup` 默认使用已安装的 Edge Chromium、1366×850、每轮新上下文、禁用缓存、2 MiB/s 下载、1 MiB/s 上传、20 ms 延迟、CPU 1 倍，检查 FCP ≤1.8 秒、首页四张图及字标准备 ≤6 秒、首屏传输 ≤5 MB、操作前不下载音乐、无运行时异常。最后通过公开菜单和真实键盘进入首战，首次战斗加载时间单独记录。

`STARTUP_URL`、`STARTUP_RUNS`、`CPU_RATE`、`STARTUP_OUT` 可指定服务、次数、CPU 降速和结果路径。测量只代表所述本机条件；当前结果与构建 SHA 记录于 `evidence/vite/startup.json`。历史 `docs/loading-perf/REVIEW.md` 的旧输出路径不适用于当前构建。
