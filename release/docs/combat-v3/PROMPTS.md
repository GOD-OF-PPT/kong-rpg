# ImageGen 素材与提示词（v3，内置工具）

使用内置image_gen，全部transparent_background=true，没有CLI/API备用路径。原输出复制到assets/combat-v3，原图与透明alpha保留；运行时只有离线图集裁切、缩放与有限色彩反馈。hash在manifest.json。未复制影视或竞品美术。

## wukong-combo.png

原输出exec-b6918b57-b5f7-4588-9c1a-6a11312c691f.png。参考assets/art-v1/wukong-atlas.png只用于角色服饰、比例与配色。完整提示词：

Use case: stylized-concept
Asset type: production animation sprite atlas, new attack poses for the SAME pixel-art Sun Wukong in the reference. Reference is identity/costume/palette only. EXACTLY NINE isolated full-body sprites, a clean 3 columns by 3 rows equally sized square-cell grid. Genuine transparent background, no text or scenery.
All sprites face RIGHT, same monkey face, gold circlet, brown fur, dark teal clothing, weathered gold armor, red scarf and long red head ribbons, black staff with ornate gold tips. Same side-view camera, same body height and same foot baseline per row. Entire staff and ribbons fit INSIDE each cell with at least 6% margin; do not overlap neighboring cells. Readable at 65px body height. Hard crisp pixel clusters, no painted blur, no motion streak, no fake background, no magic effects. Poses distinct with clear weight transfer.
ROW ONE: fast horizontal staff THRUST, 3 consecutive keyframes: left windup with staff pulled back at waist; middle contact fully extended horizontally RIGHT at chest height, strong forward stance; right recovery with staff returning and weight over feet.
ROW TWO: rising diagonal staff SWEEP, 3 keyframes: left low crouched windup holding staff near rear left hip; middle sweeping staff diagonally upward to RIGHT, arms extended, legs grounded; right high follow-through staff tip upward right.
ROW THREE: HEAVY overhead staff SMASH, 3 keyframes: left staff clearly raised OVER HEAD in two hands; middle powerful forward downward strike staff ending diagonally to lower RIGHT, deep grounded lunge; right low recovery with staff near ground on right. Keep torso/feet same overall size as other rows, heavy changes gesture not character scale.
This is a usable game atlas, not a poster. Preserve reference outfit and pixel finish. No extra people, no extra weapons, no horizontal mirror variants, no cropped staff tips, no words, no labels. Square canvas.

实际图格未严格等分；代码使用9个明确矩形和脚锚，未按格粗切。检查了游戏比例联系表与实战录像。这是三阶段关键姿势动画，不宣称每个动作已做连续逐帧精修。

## impact-atlas.png

原输出exec-989a4bad-3da0-4da6-b798-71950ae7e657.png，4×4，轻击/重击/盾挡/下劈四行。完整提示词：

Use case: stylized-concept
Asset type: production 2D PIXEL ART impact animation atlas on genuinely TRANSPARENT alpha, EXACTLY 4 columns by 4 rows, sixteen square equal cells, empty gutters. No character, weapon, scenery, text or label. Each row is four successive frames of ONE effect, left to right: compact first contact, sharp expansion, fragments separating, sparse dissipating fragments. Keep every pixel inside its cell with at least 10% clear border.
For a Sun Wukong side-view melee game at 960x540, these are crisp small sprites to display at 35-85 px, NOT painted special effects. Use flat solid pixel clusters, small bright ivory contact core, amber-gold body, bronze fragment accents. NO bloom, fog, Gaussian glow, translucent smudges, lens flare, long tails or huge opaque blobs. The danger behind the effect must stay readable. Alpha background must be completely empty around distinct particles.
ROW 1: LIGHT STAFF HIT, small directional ivory-gold four-point contact spark plus 3 short diagonal gold chips aimed to the right; narrow and quick.
ROW 2: HEAVY STAFF HIT, stronger asymmetric ivory eight-point impact star with short thick amber shards, more width than row1, no round explosion cloud; clear powerful first frame then separated chunks.
ROW 3: METAL SHIELD BLOCK, cool pale CYAN and ivory angular contact sparks with a thin broken polygonal ring, no fire, visibly distinct from damage hits. Last frame tiny cyan chips only.
ROW 4: GROUND SLAM, horizontal flattened golden impact crown on an imaginary ground line, small stone chips and two outward low shock arcs, no ground/background drawn; each frame retains same bottom alignment.
All cells use consistent pixel scale and center anchoring within a row, row4 anchored at bottom-center. Square atlas. Production game sprites, not a sheet photographed on paper.

## world-nodes.png

原输出exec-6606c03c-d8c4-44fa-b26f-9e2a9b886d2a.png。完整提示词：

Use case: stylized-concept
Asset type: three production side-view environment sprites for a Chinese dark Buddhist pixel-art platform game, isolated on genuinely TRANSPARENT alpha. Three objects in one horizontal row with wide clear gutters, no text or scenery, all feet on same baseline. Crisp pixel clusters, weathered deep teal stone, tarnished bronze, small vermilion accents, matching an abandoned Buddhist mountain kingdom. These props will appear at 80-130 pixels high; prioritize clean silhouettes and tangible materials, not tiny noise.
LEFT third: a small ancient iron-bar PRISON CAGE on a low broken stone base, with ONE clearly visible kneeling Chinese traveler inside, simple pale robe and small human silhouette. Cage complete with an ornate black-lotus padlock at front. This is a rescuable captive, not gore. Dark bronze bars spaced so captive is visible, a small vermilion knot at top.
CENTER third: a low BRONZE FERRY LANTERN MECHANISM, stone pedestal bearing a large turning wheel with three broad spokes, a small ivory oil flame cupped above it, curved bronze conduits along its base, turquoise inset gems; looks like an operable bridge mechanism, no screen or writing.
RIGHT third: a substantial weathered TEMPLE BELL suspended between two dark wooden pillars and a small carved lintel roof. Bell bronze with simple lotus relief, a red rope pulled to one side, a few cracks with muted purple inside, heavy base. Clear complete silhouette, no huge light glow or fog.
Front/side orthographic 2D view, same pixel density and physical scale family; no isometric angle. Keep complete props and all ribbons/roof corners inside each third with 8% transparent margins, no overlap across gutters. No UI labels, no letters, no poster, no extra objects. Wide 3:1 atlas.

## world-nodes-done.png

原输出exec-c29b5470-9fc0-4042-8445-6fc2a166d496.png，以world-nodes.png为编辑目标，已先检查原图。完整提示词：

Edit target: the attached three-object pixel-art atlas. Create a matching AFTER-COMPLETION version of these same three props. Keep identical horizontal order, overall sizes, side-view camera, positions, baseline, pixel scale, weathered teal/bronze/red palette and genuine transparent background. Preserve complete object outlines and gutters. No text, no scenery, no interface.
Change LEFT cage: iron cage door is swung clearly OPEN out to the left, black-lotus padlock broken on the base, captive has been freed and is now standing just outside to the right of the cage, same simple pale robe, tiny readable grateful traveler silhouette. Empty cage interior visible through bars; no other people.
Change CENTER mechanism: same wheel and pedestal but gems and connecting channels now softly bright turquoise, ivory flame steady and a little taller; no giant glow.
Change RIGHT bell: same hanging bell and pillars, but purple corruption cracks now dark and dormant, small ivory/gold spark at the clapper, rope rests loose. No new objects. This is a game asset state change, not a poster. Match original exact atlas geometry so code can swap sprites without changing collision or placement.

## 接入检查

src/combat-art.js定义攻击姿势、特效图格、事件物件源矩形。连击联系表、特效联系表、救困前后、敌招预警和落火空当截图保留在evidence/combat-v3。图片按小批查看，生成完成不等于美术验收。
