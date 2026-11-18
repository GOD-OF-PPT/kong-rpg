# v12.1.1 美术资源复查

基线：6c7183d91e2d66518848934c57b84f6423774ef7，v12.1.0，起步工作区干净。分支：codex/v12-art-completeness-check。

## 发现与修复

上一轮“已登记帧非空、图片存在”的检查没有覆盖未登记却被动态请求的名称。地图装饰沿用四关时代的mapTheme索引；第5–15关会请求dressing-undefined-a并静默漏画，第4关仍借用旧寺庙装饰。新补充的实时选帧追踪在固定场景中复现110次失效请求，证据为evidence/art-recheck-v12/before/references.json。

本次将非云上装饰改为按战役区域选择；云上继续使用原有风幡。用内置ImageGen制作一张八件环境装饰源图，归一成512×256透明图集：地府石牒/残栏，水下珊瑚/海蚀石拱，龙宫龙饰/贝纹残构，天宫云栏/残檐。成对统一缩放、底部热点[64,112]，同一图片内保留透明边缘；没有发光球、拾取描边或交互提示。它们是非碰撞环境层，不改关卡结构、敌人、技能规则和存档。

源图、归一图和SHA记录：assets/art-recheck-v12/；完整提示词：PROMPTS.md。运行包只内嵌归一图，未引用生成目录。

## 验收方法

Windows / Edge Chromium；Canvas960×540，浏览器1366×900。分开检查：

- 素材层：所有内嵌PNG解码、每一登记切片非空/未越界、DOM卷轴/图标/三角色头像加载。
- 覆盖层：五区十五关、普通/挑战、角色动作、五大首领与十小首领、机关完整/破碎、四项秘技。构造渲染场景只证明选帧与绘制，不充当自然通关。
- 实际引用层：新工具audit-art-paths.cjs在起点、环境地标、休息灯、竞技场、终点及三种物资状态追踪所有帧解析器的空返回；另检验三角色双朝向的副武器、神通、大招、护体与死亡。不是只拦截image()。场景按各关实际地面高度放置角色和物品。
- 打包层：对真实ZIP解压入口进行断网file://复查，记录页面异常与HTTP(S)请求。证据文件记录入口SHA。

构建门禁同时核对战役五区的必要角色/首领/动作状态、机关两态、掉落物、危险三态和新增区域装饰，防止“删了登记项反而通过检查”。

## 当前证据

HTTP的after-http/review.json：70张PNG、546个切片、352个控制渲染场景，无缺图、空帧、越界或页面异常。after-http/references.json：270个场景，失效帧请求由110次降为零。死亡实际选帧为wukong-dead、nezha-7、erlang-7，没有使用原始图册中复用的旧死亡占位姿势。

人工分批查看了新增图集以及地府、水下、龙宫、天宫的运行尺寸画面，并检查物资、机关及代表性技能画面。没有逐张人工审看全部546个源切片，也没有重新自然通关十五关或取得外部真人评价。图像数量和自动检查通过只证明覆盖/运行情况，不证明全部动作已达到理想美术质量。

完整结果与包哈希见evidence/art-recheck-v12/FINAL.json；file检查和实际键鼠技能/存档复查分别在after-file与actions-file。预览地址记录在preview.json。原始失败结果保留；before中的固定地面高度只用于复现失效名字，后续工具改为匹配关卡实际地面，没有修改正式游戏移动或碰撞规则。

复现：node tools/build.cjs；设置ART_AUDIT_DIR后运行node tools/audit-enemy-vfx-art.cjs http或file；设置ART_PATH_DIR后运行node tools/audit-art-paths.cjs http或file。file使用GAME_ENTRY指向实际解压入口。现有动作验收使用AUDIT_EVIDENCE_DIR和tools/browser-feel-v12.cjs。所有工具需要本机Playwright，发行游戏无需此依赖。
