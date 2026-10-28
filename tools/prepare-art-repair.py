"""Normalize the ImageGen repair atlas; preserve original RGBA and common scale."""
from pathlib import Path
from PIL import Image
import hashlib
import json

root = Path(__file__).resolve().parents[1]
base = root / 'assets/art-completeness-v10'
source = base / 'actor-repair-source.png'
image = Image.open(source).convert('RGBA')
width, height = image.size
scale = .18
atlas = Image.new('RGBA', (640, 128))
frames = {}
report = {'sourceSize': image.size, 'sourceSHA256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'tool': 'built-in image_gen', 'method': 'explicit 2x2 crops, common 0.18 scale, nearest-neighbour, bottom foot anchor', 'frames': {}}
names = ['erlang-heavy-windup', 'erlang-heavy-strike', 'erlang-hurt', 'nezha-hurt']
for index, name in enumerate(names):
    box = (index % 2 * width // 2, index // 2 * height // 2,
           (index % 2 + 1) * width // 2, (index // 2 + 1) * height // 2)
    cell = image.crop(box)
    mask = cell.getchannel('A').point(lambda a: 255 if a > 80 else 0)
    bounds = mask.getbbox()
    assert bounds
    crop = cell.crop(bounds)
    foot = mask.crop((0, bounds[3] - 8, cell.width, bounds[3])).getbbox()
    assert foot
    foot_x = (foot[0] + foot[2]) / 2
    size = (round(crop.width * scale), round(crop.height * scale))
    x = 80 - round((foot_x - bounds[0]) * scale)
    y = 112 - size[1]
    assert x > 2 and x + size[0] < 158 and y > 2, (name, x, y, size)
    atlas.alpha_composite(crop.resize(size, Image.Resampling.NEAREST), (index * 160 + x, y))
    frames[name] = {'image': 'actorRepair', 'r': [index * 160, 0, 160, 128], 'anchor': [80, 112]}
    report['frames'][name] = {'sourceBox': box, 'alphaBounds': bounds, 'footX': foot_x,
                             'scale': scale, 'size': size, 'placement': [x, y]}
output = base / 'actor-repair.png'
atlas.save(output, optimize=True)
report['outputSHA256'] = hashlib.sha256(output.read_bytes()).hexdigest()
(base / 'normalization.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
(root / 'src/actor-repair-data.js').write_text('(function(K){Object.assign(K.ActorStateFrames,' + json.dumps(frames, separators=(',', ':')) + ');})(globalThis.Kong ||= {});\n', encoding='utf8')
print(json.dumps(report))
