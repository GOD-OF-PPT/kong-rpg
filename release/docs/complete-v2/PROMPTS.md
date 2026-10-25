# ImageGen 生成记录

本轮使用内置 image_gen（透明背景），没有使用CLI/API备用路径，也没有运行时生成。两张原始输出均保留并复制到仓库。上一轮角色图集只作服饰/配色/轮廓参考；未使用影视截图或竞品抽取素材。

- assets/art-v2/wukong-run.png：2172×724，六帧横排跑动。原输出 exec-fc100312-7506-4f73-bfa4-a501d66b2bce.png。
- assets/art-v2/journey-props.png：2172×724，阵眼、灯、山门横排。原输出 exec-3734c4cc-e94f-4c08-9cd7-c571739b1238.png。
- 参考：assets/art-v1/wukong-atlas.png。透明alpha保留；源矩形/锚点/缩放见 src/visuals.js。

## 跑动完整提示词

Use case: stylized-concept
Asset type: production side-view game run-cycle sprite strip, not concept art.
Reference image: existing Sun Wukong atlas, identity/costume/palette reference only. Create one NEW horizontal strip containing EXACTLY SIX animation frames of this SAME Sun Wukong RUNNING TO THE RIGHT, arranged left to right in six equally wide slots, one row. Actual transparent alpha background, no ground, no text, no labels.
Preserve the original character: monkey face with golden brow circlet, warm brown fur, teal-blue tunic/trousers, weathered gold shoulder armour and bracers, red scarf and long red head streamers, black-and-gold Ruyi staff. Match its crisp pixel-art cluster rendering, shadowing, proportions and silhouette family. Same side-view camera and same body size in every frame. Torso and head point right; eyes face right in all six frames. Staff carried diagonally behind body with its tip to the left, consistently attached to the hands, never disappearing.
Six consecutive phases of ONE looping grounded RUN: 1 right-foot contact, 2 down/compression, 3 passing with knees under body, 4 left-foot contact, 5 down/compression opposite leg, 6 passing opposite leg. Distinct alternating leg shapes, modest vertical bob; do not repeat the same crouch six times. Cloth follows motion without gigantic billows. All frames have same foot baseline, same center of torso within their slots, same visual height. Keep ENTIRE staff, streamers, feet inside each slot, with at least 8 percent transparent gutter on each side, no overlapping adjacent slots. Six equal square cells across a wide 3:1 transparent canvas (cells may be taller than their occupied character). No motion streaks, no blur, no antialias gradients, no environment, no extra characters or extra poses. Must read at roughly 60 px character height in the game.

结果并未严格服从等距格子，源矩形改为按实际透明间隔标定，不截断金箍棒。左右步对应姿势仍接近，已在设计和验收中保留该限制；不把六个格子的数量当动画精修完成度。

## 道具完整提示词

Use case: stylized-concept
Asset type: transparent production environment prop atlas for a Chinese Buddhist dark-fantasy pixel-art side scrolling game.
Reference image: Sun Wukong costume ONLY as a style/palette reference. Do not draw Wukong or people.
Create exactly THREE separated side-view props in a single horizontal row, with generous transparent gutters, no scene, actual transparent alpha, no text or symbols resembling text. 3:1 wide canvas. Same crisp pixel-art texture as the reference but designed for 50-130 pixel tall game props, clear shape over fine detail.
LEFT, occupying first third: cursed BLACK LOTUS SEAL, an upright dark amethyst crystal bud within six angular black lotus petals, resting on a weathered circular stone altar with a narrow flat footing, violet energy concentrated in bud. Compact vertical silhouette; not a person, not a lamp. Visible dark purple petals and pale pink core, no huge glow, no particle halo.
CENTER, occupying middle third: safe BRONZE OFFERING LAMP, single warm ivory flame in a small round tarnished golden bowl, lotus base and narrow stem on a low stone plinth. Clearly soft golden light and bronze silhouette; small and inviting, not purple.
RIGHT, occupying final third: ancient RUINED STONE GATE, two carved grey-green stone pillars with a layered Chinese Buddhist lintel/roof and open empty transparent center, a pair of small vermilion cloth ribbons at the top, moss at base and sparse tarnished gold trim. A few calm turquoise points on inside edges indicate an open portal. Wide enough for a character to pass between pillars, no solid panel behind the opening, no steps that project above the feet baseline.
All three objects complete, front/side orthographic 2D game view, same ground baseline, not an isometric perspective. Keep 8% margin in each third so objects never overlap. Palette: weathered deep teal stone, desaturated bronze, vermilion, black-purple curse, ivory safe light. Pixelated clean edges, no blurry gradients, no photoreal, no interface frames, no text, no character.
