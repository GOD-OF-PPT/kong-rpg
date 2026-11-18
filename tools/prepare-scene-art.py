"""Normalize ImageGen prop states with one scale and a shared bottom anchor.

No paint, colour key or alpha replacement: crop, nearest-neighbour, pack only.
"""
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets/scene-v7'
source_path = BASE / 'seal-states-source.png'
source = Image.open(source_path).convert('RGBA')
names = ['seal-intact', 'seal-ruined', 'seal-lamp-ready', 'seal-lamp-spent']
crops = []
for i, name in enumerate(names):
    x, y = i % 2, i // 2
    cell = (x * source.width // 2, y * source.height // 2,
            (x + 1) * source.width // 2, (y + 1) * source.height // 2)
    image = source.crop(cell)
    bounds = image.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
    if not bounds:
        raise ValueError('Empty prop state: ' + name)
    crops.append((name, cell, bounds, image.crop(bounds)))

scale = min(min(60 / im.width, 60 / im.height) for _, _, _, im in crops)
atlas = Image.new('RGBA', (256, 64))
frames, provenance = {}, {}
for i, (name, cell, bounds, image) in enumerate(crops):
    size = (round(image.width * scale), round(image.height * scale))
    sprite = image.resize(size, Image.Resampling.NEAREST)
    x, y = 32 - size[0] // 2, 62 - size[1]
    atlas.alpha_composite(sprite, (i * 64 + x, y))
    frames[name] = {'image': 'sceneProps', 'r': [i * 64, 0, 64, 64], 'anchor': [32, 62]}
    provenance[name] = {'cell': cell, 'alphaBounds': bounds, 'scale': scale,
                        'size': size, 'offset': [x, y], 'frame': frames[name]}

target = BASE / 'seal-states.png'
atlas.save(target, optimize=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
(BASE / 'normalization.json').write_text(json.dumps({
    'tool': 'built-in image_gen',
    'method': 'RGBA alpha retained; crop, shared scale, nearest-neighbour, bottom-center anchor',
    'source': {'file': source_path.relative_to(ROOT).as_posix(), 'sha256': sha(source_path),
               'size': source.size, 'transparentPixels': source.getchannel('A').histogram()[0]},
    'output': {'file': target.relative_to(ROOT).as_posix(), 'sha256': sha(target)},
    'frames': provenance
}, indent=2) + '\n', encoding='utf8')
(ROOT / 'src/scene-data.js').write_text(
    '(function(K){K.SceneFrames=' + json.dumps(frames, separators=(',', ':')) +
    ';})(globalThis.Kong ||= {});\n', encoding='utf8')
print(json.dumps({'atlas': str(target), 'sha256': sha(target), 'frames': provenance}, indent=2))
