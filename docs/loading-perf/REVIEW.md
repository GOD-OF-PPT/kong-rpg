# v12.4.0 网络资源分离与分段加载

用户截图generated-art.js为59,854kB、34.52秒。基线e947f438d9eb91dd3d7e3a5880b23e8f98f218b2。上轮只清理素材目录，整包base64加载仍然存在；本轮改正式加载链，不以目录缩小替代网络改善。

## 改动

- 源码预览generated-art.js从59,853,498字节改为5,849字节的相对URL清单；generated-music.js从15,855,390字节改为456字节，MP3由用户操作后按当前曲目加载。WAV也在音频解锁时独立读取。
- 首页只准备字标、山景、悟空及石台四张图；菜单卷轴/选人图按进入相应界面加载，战斗资源按英雄、区域和共同依赖准备。暂停、导入和下一地区共用同一个准备边界。模拟在准备期间停止，显示实际进度，失败可重试，取消不会被过期异步回调带回战斗。
- 日常HTTP/LAN入口使用release/web/index.html。图片输出为独立无损WebP，内容哈希文件名使其可长期缓存；JavaScript约426KB，Brotli传输约116KB。全部79张图逐像素比较非透明像素与alpha，无损等价，不用降画质换速度。
- 服务器提供正确的图片/音频MIME、Brotli/gzip、ETag/304、哈希资源immutable缓存、音频Range及流式读取。旧版HTML仍由原位置提供，不复制全部历史包到网络目录。
- release/index.html仍是完整单文件离线发行版，图片、音效、音乐为data URL；没有模块跨域、CDN或缓存先决条件。它仍约76.4MB，适合本地直接打开，不再作为LAN首屏下载入口。离线ZIP排除网络目录，避免夹带无法独立打开的web入口。

K.ImageArt.load(ids)/has(ids)/forRun(state)是生产资源边界；bootReady只代表首页准备完毕。历史QA主动读取ImageArt.ready时仍会加载全目录，不能用该调试接口测首屏性能。DialogArtReady为按需准备的菜单素材，避免启动时把后续关卡等待带回首页。无损图片只生成在release/web，不向assets重复堆放派生文件。

## 测量与证据

事先门槛在PLAN.md。evidence/loading-perf/before-probe.json两项失败：HTTP实际取回59,853,498字节图片脚本与15,855,390字节音乐脚本；after-source-probe.json同命令两项通过。

before-browser.json使用Edge Chromium、新上下文、禁用缓存、2MiB/s下载、1MiB/s上传、20ms延迟、1366×850视口：基线菜单/背景/字标准备38,636ms，初始资源约76.4MB，图片脚本本次请求约37.2秒。此为本机固定限速复现，不声称测得用户网络的34.52秒。

after-browser.json初轮网络包同条件菜单准备2,294ms、4,304,864字节、仅4张图；从打开页面到实际选人并进入首战13,532ms，后续素材有等待和进度，不把首屏时间冒充首次战斗时间。首屏后才开始下载菜单/战斗图及音乐。源码预览after-source-final.json同条件菜单3,464ms、约5.7MB；源码使用原PNG，网络发行使用等价WebP。最终LAN复测见after-lan-final.json，记录当前版本及HTTP资源。

warm-cache.json独立新上下文正常启用HTTP缓存，两次导航后四张首页图片重复传输0字节；未使用Playwright拦截路由，以免路由关闭浏览器缓存。headers.json验证Brotli响应、图片缓存头/304、MP3的1024字节Range与旧入口200。

staged/verification.json通过强制单张图首次请求失败、延迟新区域、加载期间按J/取消、实际重试，并通过公开导入后真实键鼠进入三英雄×五区域共15种场景；没有运行时缺图或异常，八条网络音效解码、当前曲目播放、导出恢复均通过。首次发现旧渲染器对所有角色都提前读取哪吒图，改为匹配角色后再访问；初始记录保留。源码测量初轮把campaign逻辑脚本误当关卡图片，修工具的资源类型过滤后重跑，没有为此改动游戏规则。

final-offline-actions/verification.json：关闭全部本轮5186/5187/5188预览，新上下文断网并拦截HTTP(S)，直接打开发行index.html；三英雄两模式、技能/受伤/存档共73项、57画面，无异常/无HTTP请求，随后恢复LAN网络发行入口。不是自然十五关重跑或真人体验评价。

## 运行与复现

先npm ci，再npm run build同时生成网络包与单HTML。npm run dev为源码预览（小URL清单、原PNG）；npm run dev:lan构建并提供优化网络包。只制作离线包用npm run build:offline，只重做网络包用npm run build:web。无损WebP构建依赖sharp，锁定在package-lock.json。

node tools/probe-loading.cjs检查源码清单体积，LOADING_URL指定源码预览地址。node tools/measure-loading.cjs测冷加载，LOADING_URL指定网络包或源码URL，LOADING_OUT避免覆盖历史。node tools/verify-staged-assets.cjs验证恢复与切区；tools/browser-feel-v12.cjs file检查离线技能/存档。

持续网速、机器解码速度、同时运行其它程序都会改变耗时；这里是少量同条件对照，不作为用户环境保证。正式资源与离线流程已经实际验证，未用平均FPS代替加载测量。
