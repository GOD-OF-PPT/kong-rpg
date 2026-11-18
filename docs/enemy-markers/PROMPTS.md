# ImageGen prompts and provenance

Tool: built-in image_gen (not CLI).

Selected output: `assets/enemy-markers/battle-seals.png` (1536 x 1024 RGBA, six 512px cells). Original output: `exec-dc023bbe-bacb-4e79-abff-c5eefe5fd784.png`.

Selected source SHA256: `8cad641a5c1035663e52ef36f6fee04f0ad72ccf946c20759a2e194d298fbcb2`.

First generation (not shipped): `exec-34acddaf-6e8f-4069-a019-195b778572e6.png`.

## Initial generation

```text
Use case: stylized-concept
Asset type: production sprite atlas for enemy overhead combat markers in a Chinese mythology pixel platform action game.
Create one transparent 3-column by 2-row atlas, six equally spaced square cells, read LEFT TO RIGHT then TOP TO BOTTOM. Exactly six isolated assets. No labels, no text, no backdrop, no shadows outside the silhouettes. All centered, same scale with generous transparent gutters.
Visual language: crafted ancient bronze battle seals and dark plum lacquer, warm ivory pictograms, sparse cinnabar red details. Crisp bold pixel clusters like excellent 32x32 retro action-game UI sprites; hard stair-step edges, no antialiasing, no gradients, no bloom. Very simple powerful silhouettes legible when reduced to 22 screen pixels. Restrained ornament, not ornate jewelry.
Cell 1: TWO BLADES emblem. Two ivory curved dao blades crossing over a small dark bronze lozenge plate. Strong two-prong silhouette.
Cell 2: SHOCK SHIELD emblem. Broad antique bronze shield plate with an ivory shield boss and two short outward shock-wave wings; no empty square symbol.
Cell 3: TRIPLE FLAME emblem. Three clearly distinct ivory and muted violet flame tongues fanning above a dark plum base.
Cell 4: EMPOWERED emblem. A low broad bronze demon crown with three points over a small dark lozenge plate, one red central gem. It is an enemy power crest, no plus sign.
Cell 5: ATTACK INTENT emblem. A single ivory downward spear tip / sharp flame over a red-dark lozenge plate; readable danger silhouette, no exclamation mark.
Cell 6: WINDUP BACKPLATE. An EMPTY CENTERED dark-transparent angular cinnabar-red radiating halo, four sharp red blade-shaped corners pointing outward, edged in warm orange. Center must be transparent, leaving room for any of the first five emblems to be layered inside. This backplate must be as wide as the other emblems; it will be drawn slightly larger at runtime.
All first five symbols have near-black ink outlines to read against both bright clouds and dark temples. Give the glyph interiors large flat blocks, NOT thin filigree. Six complete sprites, no extra sample views, no connecting lines or frames around the atlas.
```

## Selected refinement

Reference: the first generated atlas. Transparent background requested in both calls.

```text
Use case: precise-object-edit
Edit this six-cell sprite atlas, preserving the exact 3-column 2-row layout and symbols.
Make it a genuine small-game UI sprite atlas. Remove ALL colored haze, gradient, bloom, cast shadows and semitransparent glow around every sprite. All space outside the hard sprite outlines and the empty center of the bottom-right red halo must be perfectly transparent (alpha zero), not black or checkerboard.
Simplify the bronze filigree drastically. Each cell must look like an actual 28x28 pixel sprite enlarged with nearest-neighbor: much larger square pixel clusters, only 6 flat colors per emblem, bold ivory silhouette inside a dark ink outline. Keep the two swords, winged shield, triple flame, crown, downward spear tip, and hollow red warning halo clearly different. The warning halo must have four crisp red angular corners and transparent empty center; remove all haze. No labels. Preserve six separate cells with gutters. Output RGBA transparent background.
```
