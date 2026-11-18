# ImageGen provenance · v9

Tool: built-in image_gen, transparent RGBA. Originals copied into assets/celestial-v9; normalization report records source SHA256, measured crops and shared scales.

## Heroes

Source: exec-ac320f76-26ac-4e30-92c3-42c2a2c81dbd.png → assets/celestial-v9/heroes-source.png

```text
Use case: stylized-concept
Production sprite atlas for existing Chinese mythology pixel action platformer. Supporting style references are the supplied existing Wukong and Nezha and Erlang sprite strips. Keep their costumes, identity, warm bronze outlines, teal fabric, red flowing ribbons, pixel scale. Generate ONE complete atlas, exactly 4 columns x 2 rows, equal square slots with wide TRANSPARENT gutters. No scenes, labels or decorative backgrounds. Every subject fully visible, facing RIGHT, feet at the same baseline in each cell. Crisp 16-bit pixel clusters and hard alpha, not smooth painted concept art.
LEFT TO RIGHT, TOP TO BOTTOM:
1 Wukong airborne pole-vault: gold monkey crown, teal trousers, red scarf, knees tucked, two hands gripping a plain dark staff pointed vertically DOWN, determined face. Staff only short segment, extended shaft is assembled by the game.
2 Wukong roundhouse staff spin: low wide martial stance with both hands around a horizontal black-and-gold staff, strong foreshortening, torso twisted right. No huge aura.
3 Wukong Fa Tian Xiang Di avatar: a mighty towering golden-armored MONKEY GOD with recognizable monkey face and two red crown plumes, holding a black staff high poised to slam, full body, larger shoulders, solemn mythic majesty, strong silhouette.
4 Same golden monkey god in grounded staff slam follow-through, SAME scale, foot anchor and proportions as cell3.
5 Nezha THREE HEADS SIX ARMS transformation preparation: same youthful red-ribbon teal-trouser hero, three distinct heads arranged in a shallow fan above shoulders, exactly six arms spread behind body, visible hands holding flame spear, gold ring, red silk, with remaining arms in martial mudras, feet over two small fire wheels.
6 Same THREE HEADS SIX ARMS Nezha thrusting the spear with six arms fanning in a powerful symmetrical battle stance, three heads all clearly recognizable, same scale and baseline as cell5.
7 Erlang laser charge: same young stern Chinese warrior, silver-black-gold armor, long dark hair, blue-gray sash, third eye on FOREHEAD shines cyan, planting his three-pointed blade while leaning slightly forward. Two normal eyes plus clearly separated forehead eye.
8 Same Erlang releasing a concentrated cyan forehead eye ray to the RIGHT, braced stance and lifted left hand, only a short cyan beam stub (long beam assembled by game).
Alpha-zero outside silhouettes, no haze, no bloom, no semitransparent shadow. Preserve RGBA. Each pose must read cleanly at 64-90px height.
```

## Bosses, original generation

Source: exec-6317cd9b-8a1d-4843-825d-0c0b3b2a3240.png (not shipped; crossing weapons).

```text
Use case: stylized-concept
Production full-body boss sprite atlas for Chinese mythology pixel action game. Reference image: existing three stage guardians, preserve those exact identity and costume families.
ONE atlas, EXACTLY FOUR columns by TWO rows, eight equal-sized square cells, generous transparent gutters so no weapon crosses cell boundaries. Every figure faces LEFT, feet on shared baseline, whole weapon and cape visible. Row1 is braced anticipation, Row2 is corresponding RELEASE pose of same boss, same size and identity. Crisp detailed 16-bit pixel clusters, hard transparent alpha, no scenery, text, labels, glow haze or poster layout.
Column1 MOUNTAIN WARDEN: mighty black stone ape in ancient gold armor, ochre ragged cape, massive beast-head gold hammer. Row1 lifting hammer overhead with bent knees; Row2 hammer slammed to the ground, rocky shoulders thrust forward.
Column2 FERRY LANTERN REAPER: haunted turquoise layered robes with empty shadow hood, bronze crescent polearm and hanging cyan lantern, chains. Row1 raising cyan lantern to command fire; Row2 thrusting polearm forward as robe flares, lantern held out.
Column3 SILENT TEMPLE BELL MAGE: elderly white beard, ivory and dark violet flowing robes, huge bronze bell horn and six small floating talisman tablets arranged close to back. Row1 raising bell with both hands; Row2 sounding the bell toward left, leaning into release.
Column4 WUTIAN BLACK LOTUS LORD: Chinese male dark long-haired solemn face, regal layered BLACK and DEEP PURPLE robes with pale purple lotus embroidery, one hand raised in restrained finger mudra, seated or standing over a small jagged black lotus base. Row1 lifts black lotus bud in left hand and prepares purple palm strike; Row2 extends palm forcefully toward LEFT, flowing long black hair and sleeves, open lotus below feet. Menacing spiritual authority, not a western armored demon.
Important: row2 is a new action pose for each matching row1 boss, not different characters. No effects outside the figure except small close talismans. Keep opaque silhouettes, full hands, complete head and foot baselines. These sprites ship at about 100-120px height.
```

## Bosses, selected revision

Source: exec-5223ff42-ae41-4c75-b4c4-289a20a1e00d.png → assets/celestial-v9/bosses-source.png

```text
Edit this exact eight-sprite atlas for production slicing. Keep the same eight identities, costumes and poses and the same 4-column x 2-row layout. Reduce each figure and weapon to 76 percent of its current size WITHIN ITS OWN CELL, leaving wide perfectly transparent gutters on all four sides of every cell. The row2 turquoise reaper's crescent polearm MUST remain inside column2 and must not cross into the ape's column1; shorten the shaft if necessary. The row1 turquoise reaper's weapon must not enter the bell mage's cell either. Every sprite must be isolated, no neighboring fragments in its cell, equal square slots, aligned feet with generous clear space. Transparent RGBA background, no glow, no text, crisp same pixel art. All hands, weapon heads and feet must remain complete.
```

## Effects

Source: exec-50492bad-180c-4f32-8e79-0d79c366b544.png → assets/celestial-v9/effects-source.png

```text
Use case: stylized-concept
Production transparent VFX sprite atlas for a dark Chinese mythology 16-bit pixel action platformer. EXACTLY 4 columns x 4 rows, SIXTEEN equal square cells, isolated complete effects with very wide transparent gutters. NO characters, weapons, scenery, words, labels, panels, checkerboards or black background. Hard clean pixel clusters, limited ivory/gold/cyan/magenta/red palettes, no smooth blur or smoky glow. Each effect designed to read at 40-120 game pixels.
Read left to right top to bottom:
row1: (1) golden curved staff slash crescent; (2) cyan silver blade slash crescent; (3) orange red flame spear thrust streak pointing right; (4) bright cyan horizontal laser core with geometric start flare, transparent outside a NARROW beam.
row2: (5) gold white explosive contact star with 6 sharp shards; (6) red ivory directional injury burst; (7) violet black lotus crescent slash; (8) turquoise water pearl splash with droplets.
row3: (9) GOLD STAFF SPIN horizontal ellipse, hollow transparent center, visible black-and-gold staff-shaped bright segments circling the perimeter; (10) golden ground slam thin shock ring and flying stone shards; (11) purple vertical talisman light pillar, narrow bright center and solid crisp base sigil; (12) violet black lotus orb with lotus petal fins and ivory hot center.
row4: (13) cyan wind scythe horizontal crescent with thin speed ribbons; (14) purple falling lotus meteor head with vertical trailing shards; (15) red silk binding coils and a small red lotus knot; (16) forked cyan white lightning column with little angular sparks.
All alpha-zero outside each effect silhouette; no semitransparent radial fog. Keep the holes in rings fully transparent. No effect is cropped or touches any slot edge. Same art scale as polished retro pixel combat games.
```
