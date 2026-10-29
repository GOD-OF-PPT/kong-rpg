# 资源保留规则

本目录保留正式构建读取的成品资源，以及最新品牌图标和1920×1080宣传封面。删除了未使用的生成原图、参考拼图、草稿、废弃图集及音效中间文件；没有压缩或修改正在使用的素材。

## 正式构建输入

- 图片：`tools/pack-art.cjs`，打包清单输出至`assets/v8/pack-manifest.json`。
- 打击音效：`assets/audio-v6/manifest.json`中的八条processed WAV。
- 音乐：`assets/music/manifest.json`中的三首MP3。
- 宣传与品牌：`brand-rekindled/emblem.svg`和`marketing/`中的最终PNG、JPG。封面用于宣传，不进入游戏运行包。
- 小体积JSON/Markdown保留来源、裁切、提示词、哈希与音乐配置记录。其中历史source路径代表来源记录，不能据此认定原图仍在工作目录。

`node tools/build.cjs`直接使用保留的成品，不需要生成原图。历史`tools/prepare-*.py`和`normalize-nezha.py`用于重新制作素材，执行前需要从清理前Git版本恢复相应输入；它们不属于日常构建链。删除清单及逐文件SHA见`evidence/assets-cleanup/plan.json`，清理前提交为`37a3bd758fb053e955f6f6b3a1d9e3407e631b51`，可用Git按需找回已跟踪文件。

Vite主要管理开发服务和构建产物，不会自动删除仓库中的原图/草稿。当前统一嵌入管线明确读取的资源也不会因引入Vite自动消失。本次保留现有`file://`离线入口，按真实构建引用清理目录。
