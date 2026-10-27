# ImageGen prompts · v10 audit

Mode: built-in image_gen. Selected RGBA sources and normalized images are in `assets/audit-v10/`. Crops, shared scales and source SHA256 are in `normalization.json`.

## Devices

Source: `exec-8f497ff7-f3ee-42b9-9156-689abe7c7a20.png` → `devices-source.png`.

```text
Use case: stylized-concept.
Asset type: transparent production pixel-art game sprite atlas for three destructible Chinese mythological devices, showing intact and broken states. Reference images: supplied three army strips, ONLY their far-right little device is the style/object reference; do NOT depict any soldiers.
Exactly THREE columns and TWO rows, six isolated equal square cells, read row major. Large transparent gutters, no item touches any cell boundary. Crisp hard-edged retro pixel clusters, bronze/ivory/cyan/gold limited palette, clearly readable at 40-50 screen pixels. No mist, glow haze, smooth shadow, labels, UI boxes, text or backgrounds. Real RGBA transparency including holes.
TOP ROW, same approximate physical height:
Cell 1: upright ivory judgment WRIT on red-bronze demon-faced stand with two short tassels; bold black abstract rune shapes, no actual text.
Cell 2: luminous but crisply outlined CYAN TIDE PEARL held by a low bronze wave stand; no large soft glow.
Cell 3: miniature GOLD SEVEN-STOREY PAGODA on a broad dark bronze base, clear stacked roof silhouette.
BOTTOM ROW: the corresponding device AFTER destruction, same base width and same lower foot baseline, MUCH LOWER broken profile (at most one third the intact height):
Cell 4: judgment writ TORN IN HALF, only jagged bronze foot and a short ripped paper stub standing; 2-3 ivory paper strips scattered to sides.
Cell 5: pearl SHATTERED into cyan angular glass-like shards around collapsed bronze wave stand; NO whole sphere or glowing orb remains.
Cell 6: pagoda COLLAPSED, only cracked base and one broken lowest roof remain, several disconnected gold roof fragments beside it; NO complete upper tower remains.
Each broken sprite should be distinct from an intact translucent object, and distinct from a collectible. Muted broken colors but fully opaque crisp outlines; keep pieces within each slot. No green plus sign, no pickup aura. Six complete production assets, no concept diagram.
```

## Complete giant anticipation

Source: `exec-1051d236-50d4-4b05-a1f6-c37108f4366e.png` → `juling-source.png`.

```text
Use case: precise-object-edit.
Edit this exact production 2x2 giant-general sprite sheet. Preserve the character identity, face, red beard, gold-steel armour, blue sash and pixel style. Fix the TOP RIGHT pose: the raised axe is clipped by the top canvas edge. Redraw that one pose with the axe lifted DIAGONALLY above the shoulder on a SHORT shaft, and the entire axe blade, helmet, hands, feet and cloth fully inside the top-right cell, leaving a generous transparent margin. Do NOT extend the axe beyond any border.
Also reduce all four sprites slightly inside their own cells so each has at least 8 percent transparent gutter on every side. Keep exact 2-column 2-row layout and facing LEFT. Four poses: ready stance, clear raised-axe anticipation, ground smash, shoulder charge. Do not duplicate the ready stance in the anticipation cell. Shared body scale and foot baseline within cells. No extra objects, text, labels, backdrop, glow haze or UI. Transparent RGBA, crisp hard pixel clusters. Only production sprites, no poster.
```
