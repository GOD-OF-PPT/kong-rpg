# ImageGen 提示词与素材（内置工具模式）

全部使用内置 image_gen，transparent_background=true；无CLI、API密钥、远程字体或运行时生成。三张原始PNG保存在 assets/ui-v3，未覆盖原有游戏美术。运行时只做图集裁切与像素尺度归一化，保持alpha。素材hash见同目录manifest.json。

## pilgrim-scroll.png

原输出 exec-d7301537-cb05-4a7e-a0c0-76ba25db4c56.png，1024×1536。

Use case: stylized-concept
Asset type: production blank vertical scroll background for a Chinese dark Buddhist pixel-art game UI, isolated prop on genuine transparent alpha. One object only, front-on orthographic view. No text, no characters, no symbols that look like writing.
A long hanging pilgrimage prayer scroll: warm aged ivory-brown mulberry paper, restrained weathering and tiny frayed pixel edges, thin dark ink border, tarnished bronze/old dark wood roller at top and bottom, small vermilion fabric tie at very top, one subtle small blank red stamp near lower corner. Shape is a straight readable upright rectangle with slightly irregular torn sides, width roughly one-half its height. Entire object and ties inside image with 10% transparent margin. Rollers discreet, no gigantic fantasy spikes. Center 72% of paper remains smooth and QUIET, evenly warm light tan for dark ink text, no busy drawing. Empty upper portion reserved for an icon later. Distinct pixel-art clusters and hard clean stepped edges, moderately low detail at actual UI scale of 200x320 pixels, no high-frequency grit, no gradients or blur, no screen mockup, no scenery, no extra props. Color family warm umber outline, parchment #c9ad75, highlights #e0c791, dark brown/bronze rollers, desaturated cinnabar ribbon. Aspect 2:3 portrait.

## relic-icons.png

原输出 exec-d2ce939a-9ed7-4458-bfd3-9c66410f32c3.png，1536×1024。

Use case: stylized-concept
Asset type: game item icon ATLAS, exactly eight isolated pixel-art relic emblems, 4 columns by 2 rows on genuinely TRANSPARENT background. No scenery, no cards, no frames, no text or letters. Each object centered in its own equal square cell with wide clear gutters, all fully inside cells. 1536x1024 landscape composition.
For a dark Buddhist Chinese Sun Wukong game, polished crisp chunky PIXEL ART, deliberately readable as 60-80 px icons, hard pixel clusters, strong silhouettes, weathered bronze and ivory highlights, no photoreal, no gradients/blur, no giant magic circles. All same three-quarter view and same visual size. Saturated accents modest.
Top row left-to-right: (1) turquoise carved CLOUD-shaped BONE talisman with a small gold loop, unmistakable curled cloud; (2) purple polished pearl in an aged bronze crescent setting with a smaller reflected ghost pearl, the mirror-shadow relic; (3) compact black iron STAFF SEGMENT with ornate GOLD CAPS tilted diagonally, a vermilion ribbon tied around its middle, Sun Wukong's staff relic; (4) pale blue polished round bronze MIRROR with one simple returning-arrow-like curved light slash, mirror relic.
Bottom row left-to-right: (5) orange-red lotus ember with six angular petals surrounding a small bright flame, clear fire lotus shape; (6) small jade BRONZE OIL LAMP with ivory flame and leaf-like cradle, compassionate healing relic; (7) warm pale-gold offering INCENSE BOWL containing three red burning incense sticks, smoke curls subtle, resting/breathing choice; (8) large round weathered GOLD LOTUS CREST with vermilion cloth tails below it, temple ornament used as menu heading crest, blank center without writing.
The first seven images are tangible artifacts, NOT Chinese characters. Shadow only under/within each object, real alpha in background and gutters. No labels, no writing, no user interface mockup.

## field-folio.png

原输出 exec-15343804-6cc8-4aa9-9937-38fd7e6bc634.png，1860×846。

Use case: stylized-concept
Asset type: blank game UI background, ONE open Chinese pilgrimage field manual, front-on flat orthographic view. Genuine transparent alpha around the object. No words, no lettering, no symbols resembling writing, no icons, no hands, no environment.
An old Buddhist traveler's thread-bound BOOK opened flat to a wide two-page spread, roughly 2.2 times wider than tall. Softly worn warm tan mulberry paper, rough stepped pixel edges, subtle central stitched crease, a dark olive-brown cloth cover visible by a narrow rim, two tiny cinnabar ribbon bookmarks only at outside corners. Very restrained bronze corner clasps. All edges and bookmarks fully within the image with 7% transparent gutter. No thick rolled scroll bars: this is an OPEN FIELD JOURNAL.
Production pixel art matching a Chinese Sun Wukong dark-fantasy side-scrolling game, crisp visible pixel clusters and hard edges, limited weathered earth palette. Pages must be large, flat, calm and nearly uniform warm parchment #d3ba85 so dark text will be readable. Central crease narrow and subtle, no big shadow. Upper 20% of both pages and all central 75% of each page left completely BLANK, NO sketches, decorations, stains or busy texture in those reading zones. Weathering confined to outer margins. High quality tangible game prop, not modern app panel, not UI mockup, not photograph, no lighting gradients or glossy surfaces. Landscape composition.

## 验证与归一化

透明像素：经卷795383/1572864；图标868053/1572864。原图中显示的暗色不是实心背景。经卷裁切范围、图标格子和930×423的书页纹理见 src/dialog-art.js；文本仍由DOM排版。既检查Image解码，也检查CSS变量实际生效及游戏截图，防止只加载了素材却未出现在界面。
