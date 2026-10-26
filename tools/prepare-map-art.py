"""Crop and normalize the approved built-in ImageGen atlases; never colour-key alpha.

Nearest-neighbour only. Shared state groups keep one scale and a measured base anchor.
The sources have nonuniform row gutters, so source rectangles are explicit.
"""
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets/map-v6'
SLOT = 128
frames = {}
provenance = {'tool': 'built-in image_gen', 'normalization': 'Pillow crop / nearest-neighbour; original RGBA retained', 'sources': {}, 'frames': {}}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalize(name, entries):
    source = Image.open(BASE / (name + '-source.png')).convert('RGBA')
    provenance['sources'][name] = {'file': 'assets/map-v6/' + name + '-source.png', 'size': list(source.size), 'sha256': sha(BASE / (name + '-source.png')), 'fullyTransparentPixels': source.getchannel('A').histogram()[0]}
    crops = []
    for key, rect, group, fit, mode in entries:
        cell = source.crop(rect)
        # Ignore near-invisible pixels for bounds, but preserve their original alpha inside the crop.
        bounds = cell.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
        if not bounds:
            raise ValueError('Empty asset: ' + key)
        crop = cell.crop(bounds)
        if mode == 'actor':
            lower = crop.getchannel('A').crop((0, max(0, crop.height - 12), crop.width, crop.height)).point(lambda a: 255 if a > 64 else 0).getbbox()
            anchor_x = (lower[0] + lower[2]) / 2 if lower else crop.width / 2
        else:
            anchor_x = crop.width / 2
        crops.append((key, rect, group, fit, mode, bounds, crop, anchor_x))
    scales = {}
    for _, _, group, fit, mode, _, crop, _ in crops:
        scale = min(fit[0] / crop.width, fit[1] / crop.height)
        scales[group] = min(scales.get(group, scale), scale)
    sheet = Image.new('RGBA', (SLOT * 4, SLOT * ((len(entries) + 3) // 4)))
    for i, (key, rect, group, fit, mode, bounds, crop, anchor_x) in enumerate(crops):
        sx, sy = (i % 4) * SLOT, (i // 4) * SLOT
        if mode == 'tile':
            size = fit
            result = crop.resize(size, Image.Resampling.NEAREST)
            x, y, ax, ay = 0, 0, 0, 0
            fw, fh = size
        else:
            scale = scales[group]
            size = (round(crop.width * scale), round(crop.height * scale))
            result = crop.resize(size, Image.Resampling.NEAREST)
            ax, ay = (16, 28) if mode == 'pickup' else (64, 112)
            x, y = round(ax - anchor_x * scale), ay - size[1]
            fw, fh = (32, 32) if mode == 'pickup' else (128, 128)
        if x < 0 or y < 0 or x + size[0] > fw or y + size[1] > fh:
            raise ValueError('Sprite clips its normalized cell: ' + key)
        sheet.alpha_composite(result, (sx + x, sy + y))
        frames[key] = {'image': 'map' + name.title(), 'r': [sx, sy, fw, fh], 'anchor': [ax, ay]}
        provenance['frames'][key] = {'sourceCell': list(rect), 'alphaBounds': list(bounds), 'group': group, 'scale': scales[group] if mode != 'tile' else 'fit ' + str(fit), 'normalized': frames[key]}
    target = BASE / (name + '.png')
    sheet.save(target, optimize=True)
    provenance.setdefault('outputs', {})[name] = {'file': target.relative_to(ROOT).as_posix(), 'sha256': sha(target), 'bytes': target.stat().st_size}


normalize('props', [
    ('trial-ready', (0, 0, 320, 465), 'trial', (80, 82), 'actor'),
    ('trial-active', (320, 0, 646, 465), 'trial', (80, 82), 'actor'),
    ('trial-cleared', (646, 0, 938, 465), 'trial', (80, 82), 'actor'),
    ('trial-claimed', (938, 0, 1254, 465), 'trial', (80, 82), 'actor'),
    ('camp-lit', (0, 465, 314, 925), 'camp', (58, 80), 'actor'),
    ('camp-spent', (314, 465, 628, 925), 'camp', (58, 80), 'actor'),
    ('pickup-heal', (628, 465, 942, 925), 'heal', (20, 24), 'pickup'),
    ('pickup-focus', (942, 465, 1254, 925), 'focus', (20, 22), 'pickup'),
    ('pickup-rage', (0, 925, 280, 1254), 'rage', (18, 24), 'pickup'),
    ('hazard-quiet', (280, 925, 622, 1254), 'hazard', (32, 16), 'tile'),
    ('hazard-warning', (622, 925, 940, 1254), 'hazard', (32, 16), 'tile'),
    ('hazard-active', (940, 925, 1254, 1254), 'hazard', (32, 16), 'tile'),
])
normalize('terrain', [
    ('ledge-mountain', (0, 230, 314, 490), 'ledge', (64, 30), 'tile'),
    ('ledge-ferry', (314, 230, 628, 490), 'ledge', (64, 30), 'tile'),
    ('ledge-temple', (628, 230, 942, 490), 'ledge', (64, 30), 'tile'),
    ('fragile-ready', (942, 230, 1254, 490), 'fragile', (64, 30), 'tile'),
    ('fragile-cracking', (0, 530, 314, 790), 'fragile', (64, 30), 'tile'),
    ('raft', (314, 530, 628, 790), 'raft', (96, 30), 'tile'),
    ('bridge-off', (628, 530, 942, 790), 'bridge', (64, 24), 'tile'),
    ('bridge-on', (942, 530, 1254, 790), 'bridge', (64, 24), 'tile'),
    ('wall-mountain', (0, 790, 314, 1254), 'wall', (64, 64), 'tile'),
    ('wall-ferry', (314, 790, 628, 1254), 'wall', (64, 64), 'tile'),
    ('wall-temple', (628, 790, 942, 1254), 'wall', (64, 64), 'tile'),
    ('arena-pillar', (942, 790, 1254, 1254), 'pillar', (34, 84), 'actor'),
])
normalize('dressing', [
    ('dressing-mountain-a', (0, 0, 512, 555), 'dress', (110, 84), 'actor'),
    ('dressing-ferry-a', (512, 0, 1024, 555), 'dress', (110, 84), 'actor'),
    ('dressing-temple-a', (1024, 0, 1536, 555), 'dress', (110, 84), 'actor'),
    ('dressing-mountain-b', (0, 555, 512, 1024), 'dress', (110, 84), 'actor'),
    ('dressing-ferry-b', (512, 555, 1024, 1024), 'dress', (110, 84), 'actor'),
    ('dressing-temple-b', (1024, 555, 1536, 1024), 'dress', (110, 84), 'actor'),
])
(BASE / 'normalization.json').write_text(json.dumps(provenance, indent=2) + '\n', encoding='utf8')
(ROOT / 'src/map-data.js').write_text('(function(K){K.MapFrames=' + json.dumps(frames, separators=(',', ':')) + ';})(globalThis.Kong ||= {});\n', encoding='utf8')
print(json.dumps(provenance['outputs'], indent=2))
