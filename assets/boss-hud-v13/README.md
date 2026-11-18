# Boss 血条外框

使用内置 image_gen 生成，原始提示词保存在 `PROMPT.json`。`frame-source.png` 为原图；`frame.png` 为移除画布留白后的运行素材，内部开槽与外部 alpha 保持透明。`manifest.json` 记录来源、SHA、尺寸及开槽比例。

血条采用青铜云纹端饰，透明开槽中由 DOM 实时绘制生命。外框高度 62–70 CSS px，可见血量槽约 20–23 px，原版仅 5 px。Boss 名称、HP 数字、招式文字均由真实状态写入，没有烘焙进图片。

素材作为 `bossHud` 加入战斗资源，不加入四张首页图片；网络包使用独立无损 WebP，离线包沿用本地数据脚本。首次显示时将已解码素材交给 CSS，后续更新只刷新生命数值和宽度。

`node tools/prepare-boss-hud.cjs` 重新归一素材；`node tools/verify-boss-hud.cjs` 检查五个 Boss、满/半/低生命、生命语义、暂停、全屏，以及 1024/1366/1920/2560 视口的边界和控件避让。加 `--offline` 检查 file 入口。截图与报告在 `evidence/boss-hud/`。
