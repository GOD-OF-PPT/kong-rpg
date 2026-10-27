"""Crop ImageGen states without painting/colour-keying; preserve one body scale."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets/art-audit-v7'
source = BASE / 'actor-states-source.png'
im = Image.open(source).convert('RGBA')
# The staff crosses the nominal half-width gutter: keep its complete silhouette.
specs = [
    ('wukong-dead', (0, 0, 740, 650), (385, 610)),
    ('nezha-dead', (740, 0, 1254, 650), (950, 610)),
    ('nezha-ultimate-start', (0, 650, 627, 1254), (345, 1188)),
    ('nezha-ultimate-release', (627, 650, 1254, 1254), (932, 1188)),
]
cells = []
for name, rect, anchor in specs:
    cell = im.crop(rect)
    bounds = cell.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
    if not bounds:
        raise ValueError('Empty state: ' + name)
    cells.append((name, rect, anchor, bounds, cell.crop(bounds)))
# Standing Nezha remains the same height as the shipped 74px idle figure.
scale = 74 / max(cell.height for _, _, _, _, cell in cells[2:])
atlas = Image.new('RGBA', (512, 128))
frames, provenance = {}, {}
for i, (name, rect, anchor, bounds, cell) in enumerate(cells):
    size = (round(cell.width * scale), round(cell.height * scale))
    x = round(64 + (rect[0] + bounds[0] - anchor[0]) * scale)
    y = 112 - size[1]
    if x < 0 or x + size[0] > 128 or y < 0:
        raise ValueError('State clips normalized cell: ' + name)
    atlas.alpha_composite(cell.resize(size, Image.Resampling.NEAREST), (i * 128 + x, y))
    frames[name] = {'image': 'actorStates', 'r': [i * 128, 0, 128, 128], 'anchor': [64, 112]}
    provenance[name] = {'source': rect, 'bounds': bounds, 'sourceAnchor': anchor,
                        'scale': scale, 'size': size, 'offset': [x, y]}
target = BASE / 'actor-states.png'
atlas.save(target, optimize=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
(BASE / 'normalization.json').write_text(json.dumps({
    'method': 'RGBA retained, explicit nonuniform gutters, shared body scale, nearest-neighbour',
    'source': {'path': str(source.relative_to(ROOT)), 'sha256': sha(source)},
    'output': {'path': str(target.relative_to(ROOT)), 'sha256': sha(target)},
    'frames': provenance
}, indent=2) + '\n', encoding='utf8')
(ROOT / 'src/actor-states-data.js').write_text(
    '(function(K){K.ActorStateFrames=' + json.dumps(frames, separators=(',', ':')) +
    ';})(globalThis.Kong ||= {});\n', encoding='utf8')
print(json.dumps(provenance, indent=2))
