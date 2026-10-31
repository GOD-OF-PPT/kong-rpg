# 美术截图审查 · 2026-10-30

结论：五章场景与人物有可保留的美术基础，但当前技能表现尚不适合判为整体通过。优先处理毒弹被施法者遮住、Boss 换动作时体型跳变、毒潮悬空；之后统一角色技能的材质和地图危险物的辨识度。本次只做截图审查，未修改游戏美术或战斗规则。

[打开完整截图图库](E:/githome/kong-rpg/evidence/art-audit-20261030/index.html) · [构建身份](E:/githome/kong-rpg/evidence/art-audit-20261030/identity.json) · [技能连续录像](E:/githome/kong-rpg/evidence/art-audit-20261030/skills/skills.webm)

## 需要修改的项目

### A01 · P1 · 九头虫的毒弹起点被自身贴图遮住

- **所见**：九首毒扇已释放，但早期很难看到五枚毒弹；它们仍在巨大颈部和躯干后方。玩家近身时已经掉血，毒弹轮廓仍不清楚。塔火轮潮也有从身体内部出现的情况。
- **复现**：第九关让九头虫向左释放九首毒扇，站在其左侧近身位置；比较释放帧、受击帧，以及释放后 150ms 的补充截图。
- **证据**：[毒扇受击原图](E:/githome/kong-rpg/evidence/art-audit-20261030/skills/frames/enemy-venom-fan-2.png)、[远处观察释放后 150ms](E:/githome/kong-rpg/evidence/art-audit-20261030/details/mid-venom-fan.png)、[火轮早期](E:/githome/kong-rpg/evidence/art-audit-20261030/details/mid-king-fire.png)。技能记录中，九头虫位置为 x=2150，毒弹初始 x≈2133；在 t=0.783 玩家 HP 从 100 变为 72。该帧仍有四枚飞行物在颈部附近。
- **归属**：战斗发射点、动画挂点和渲染层级。[campaign-combat.js](E:/githome/kong-rpg/src/campaign-combat.js) 的 `campaignShotPaths()` 按碰撞体推算起点，未对齐当前巨大出招贴图；[skill-origins-art.js](E:/githome/kong-rpg/src/skill-origins-art.js) 将敌方飞行物放在所有人物后方。
- **建议**：为具体动作提供嘴部/手部挂点，在对应帧发射；飞行物离开施法者后保持可见，同时让受击角色轮廓清楚。无需恢复技能边界指示器。

### A02 · P2 · Boss 待机与出招使用的贴图体量不一致

- **所见**：巨灵神、龙王、托塔天王从待机切到前摇时，轮廓明显突然变大，像换了一个尺寸的角色。不是大招变身。
- **证据**：[巨灵神相同脚底对照](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/pose-2.png)、[龙王对照](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/pose-11.png)、[天王对照](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/pose-14.png)。左为待机，右为前摇，脚底坐标相同。巨灵神可见像素包围高度从 106px 到 185px，龙王 102px 到 176px，天王 105px 到 169px；这些是含武器衣物的轮廓尺寸，不能等同于身体净高度。
- **归属**：动画素材归一化。[campaign-art.js](E:/githome/kong-rpg/src/campaign-art.js) 的待机与 [combat-identity-art.js](E:/githome/kong-rpg/src/combat-identity-art.js) 的招式使用不同图集，并按原尺寸绘制。
- **建议**：统一人物躯干比例、头部大小和脚底基准，再保留挥武器与衣摆引起的自然轮廓变化。三名主角的普通攻击与待机也应一起复核体量，避免只校准 Boss。

### A03 · P2 · 污潮横涌仍有悬空感

- **所见**：绿色毒浪下缘和地砖之间能看到一条背景，浪像横向漂浮的贴纸，没有沿地面推进的重量感。
- **证据**：[毒潮释放原图](E:/githome/kong-rpg/evidence/art-audit-20261030/skills/frames/enemy-venom-tide-1.png)。这与已经埋进地面的岩刺不同。
- **归属**：素材透明留白、落点和合成方式。[skill-origins-art.js](E:/githome/kong-rpg/src/skill-origins-art.js) 的 wave 分支按整张画布底部对齐，未按毒浪实际可见下缘对齐。
- **建议**：按有效像素底线设落点，让浪底略进入地表，加入少量接触飞溅与沿地面流动。避免把整张图继续放大来遮住空隙。

### A04 · P2 · 部分角色大招仍是几何线圈，质感落后于角色

- **所见**：法天象地的冲击主要是一条细椭圆，莲火轮阵是双层椭圆与均匀小点，回身棍阵也有完整细线圈；混天绫则是密集红线叠绕。与细节较丰富的角色、Boss 新特效不协调。
- **证据**：[法天象地](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/wukong-ultimate.png)、[莲火轮阵](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/nezha-ultimate.png)、[回身棍阵](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/orbit-staff.png)、[混天绫](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/nezha-ability.png)。
- **归属**：角色特效美术与程序绘制，主要在 [combat-feedback-art.js](E:/githome/kong-rpg/src/combat-feedback-art.js)、[celestial-art.js](E:/githome/kong-rpg/src/celestial-art.js)。
- **建议**：棍招采用随挥动方向消散的残影与扬尘；莲火采用有聚散的火焰和莲瓣；混天绫表现有厚度、连续运动的绸带。保留角色主体和技能落点，减少完整闭合圆环。

### A05 · P2 · 全屏技能的自然留白与真实安全缺口不够容易区分

- **所见**：雷电、锁链和金色镇阵由相似竖向图案平铺，图案内部、两张图案之间都有留白。地面缺少连续的受影响表现，玩家可能把其中一处留白当作安全位置。前摇的浅色云气也容易融进龙宫背景。
- **证据**：[雷电与完整 HUD](E:/githome/kong-rpg/evidence/art-audit-20261030/ui/thunder-active.png)、[锁链](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/enemy-judge-chain.png)、[镇阵](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/enemy-tower-prison.png)。这是视觉辨识问题；没有据此判定真实安全缺口数量错误。
- **归属**：特效材质与区域填充，[skill-origins-art.js](E:/githome/kong-rpg/src/skill-origins-art.js) 的 `bossEffectField()`。
- **建议**：危险区域用稀疏的接地电弧、落链触地碎屑、金焰衔接；唯一可躲区域保持干净，前摇强化明暗和运动差异。减少完全相同、同时出现的重复纹样。继续遵守取消边界线、范围框和安全区标签的要求。

### A06 · P2 · 地图地刺/地焰过小，三种状态不够醒目

- **所见**：地府、龙宫、天宫中的危险物在完整画面里常像地面上几个粉红点，预警与生效差异弱；统一紫粉色小刺也与部分场景主题不搭。
- **证据**：[地府三态](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/map-3-hazards.png)、[龙宫三态](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/map-10-hazards.png)、[天宫三态](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/map-12-hazards.png)。采集记录确认三张图对应 quiet、warning、active，非相同状态误截图。
- **归属**：地图危险物素材与渲染。[map-art.js](E:/githome/kong-rpg/src/map-art.js) 将图块压在 13px 高的区域内，预警仅 10px。
- **建议**：静默时有可辨认的裂缝/机关，预警有递增光和碎屑，生效有清楚的突出物或火焰；按章节调整材质，并核对可见高度与受伤区域。场景机关可以自然提示危险，无需画技能边框。

### A07 · P3 · 暗色地图的前后层对比不足

- **所见**：地府红褐色敌人与灰黑墙体、部分悬台与背景横桥比较接近；龙宫背景装饰密集，会抢走小型怪物和水系技能的注意力。
- **证据**：[鬼门引路](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/map-3.png)、[毒潮暗礁](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/map-7.png)、[珊庭守廊](E:/githome/kong-rpg/evidence/art-audit-20261030/sheets/map-9.png)。
- **归属**：地图美术与合成层次。
- **建议**：对背景适度降低明度或饱和度，保留平台顶面的连续亮边；敌人使用很轻的环境轮廓光。保留现有背景绘制质量，不需要整套重做。

## 可以保留的部分

- 五章主题有辨识度，云海、地府、沉洲、龙宫、天宫的主色和建筑语言区分明确。
- 云上平台的顶面、断口、脆台裂缝总体可辨；抽查补给、营灯与出口，没有发现新的明显悬空摆放。
- 三名角色普通武器、伸棍、乾坤圈、三目神光、撑天坠击、三头六臂有可识别的出手方向，采样中没有看到背对目标施法的明显回归。
- Boss 岩刺根部已被地面遮住；龙王雷电有清晰亮芯并从上方贯穿到地面，未见旧的背景色块、矩形范围边线。
- Boss 血条在 1440×1000、1024×768、原生全屏下清楚可读，没有盖住人物。主要战斗区处于画面下半部分，当前界面没有形成新的大面积角色遮挡。部分截图中央的“旅程已恢复”是导入存档产生的临时提示，不据此判为常驻遮挡。
- 首页和选角页的整体色彩与游戏协调，选中态清楚；此次从选舍利开始使用 J 成功进入游戏。

## 采集与判读范围

- 当前工作区：`codex/asset-loading-performance`，HEAD `53632803de5359dda5f558c487114231fe12eeff`，包含本聊天已有未提交改动。
- 重新执行 `npm run build`，使用 Vite 生产预览 `dist/`；没有使用旧 `release/`。页面、清单、JS/CSS SHA256 见 `identity.json`。
- 采集：46 项技能，186 张阶段帧；15 关地图，126 张固定视角；12 张完整界面；18 张普通怪/飞行物补充场景；10 张固定脚底的 Boss 单体对照。
- 人工判读：46 项技能的阶段拼图全部查看；15 关均查看起点、两段路线、首领视角，并补看部分清场、补给、脆台和机关状态；五章普通怪补充画面、界面和可疑问题原图另作检查。采集帧数不等于全部原图逐张放大检查的数量。
- 技能由公开存档导入受控场景后，真实键盘输入或正常模拟驱动；地图与补充特写使用当前生产 Renderer。单体对照只切换动画状态并固定脚底，透明底仅为看清轮廓，不代表游戏背景。不是十五关自然通关，也不是性能、命中规则或移动端验收。
- 技能与地图采集没有缺帧、没有贴图查询缺失；界面与补充采集没有浏览器异常。这些记录只说明采集正常，不代表美术审查通过。

建议处理顺序：A01 → A02/A03 → A05/A06 → A04/A07。先保证看得清、落点可信，再做风格精修。
