"""Reviewed nonuniform gutters; one shared pixel scale and foot baseline for all poses."""
from pathlib import Path
from PIL import Image
import json
root = Path(__file__).resolve().parents[1]
folder = root / 'assets/ranged-v6'
source = Image.open(folder / 'nezha-empty-hands.png').convert('RGBA')
cuts = [0, 340, 710, 1055, 1448, 1870, 2172]
scale, size = .17, 128
atlas = Image.new('RGBA', (size * 6, size))
frames = []
for i in range(6):
    slot = source.crop((cuts[i], 0, cuts[i + 1], source.height))
    box = slot.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    sprite = slot.crop(box)
    sprite = sprite.resize((round(sprite.width * scale), round(sprite.height * scale)), Image.Resampling.NEAREST)
    x, y = i * size + (size - sprite.width) // 2, size - sprite.height
    atlas.alpha_composite(sprite, (x, y))
    frames.append({'slot': i, 'sourceBox': [cuts[i] + box[0], box[1], cuts[i] + box[2], box[3]], 'foot': [i*size+64, 128]})
atlas.save(folder / 'nezha-atlas.png')
(folder / 'normalization.json').write_text(json.dumps({'sharedScale': scale, 'frameSize': size, 'frames': frames}, indent=2), encoding='utf8', newline='\n')
