"""Normalize the approved transparent ImageGen sheet; no generated stand-ins."""
from pathlib import Path
from PIL import Image
import hashlib
import json

root = Path(__file__).resolve().parents[1]
folder = root / 'assets/art-recheck-v12'
source = folder / 'realm-dressing-source.png'
image = Image.open(source).convert('RGBA')
atlas = Image.new('RGBA', (512, 256))
names = [f'dressing-{realm}-{variant}' for realm in ['underworld', 'water', 'dragon', 'heaven'] for variant in ['a', 'b']]
cells = []
for index, name in enumerate(names):
    column, row = index % 4, index // 4
    rect = (round(column * image.width / 4), round(row * image.height / 2), round((column + 1) * image.width / 4), round((row + 1) * image.height / 2))
    cell = image.crop(rect)
    bounds = cell.getchannel('A').point(lambda a: 255 if a > 64 else 0).getbbox()
    assert bounds, name
    cells.append((name, rect, bounds, cell.crop(bounds)))
scales = {}
for index, (_, _, _, crop) in enumerate(cells):
    family = index // 2
    scales[family] = min(scales.get(family, 1), 100 / crop.width, 86 / crop.height)
frames, records = {}, []
for index, (name, rect, bounds, crop) in enumerate(cells):
    scale = scales[index // 2]
    size = (round(crop.width * scale), round(crop.height * scale))
    x, y = (128 - size[0]) // 2, 112 - size[1]
    normalized = crop.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA')
    atlas.alpha_composite(normalized, (index % 4 * 128 + x, index // 4 * 128 + y))
    frames[name] = {'image': 'realmDressing', 'r': [index % 4 * 128, index // 4 * 128, 128, 128], 'anchor': [64, 112]}
    records.append({'id': name, 'sourceCell': rect, 'alphaBounds': bounds, 'scale': scale, 'size': size, 'offset': [x, y]})
atlas.save(folder / 'realm-dressing.png', optimize=True)
(root / 'src/realm-dressing-data.js').write_text('(function(K){Object.assign(K.MapFrames,' + json.dumps(frames, separators=(',', ':')) + ');})(globalThis.Kong ||= {});\n', encoding='utf8')
(folder / 'normalization.json').write_text(json.dumps({'tool': 'built-in image_gen', 'sourceSHA256': hashlib.sha256(source.read_bytes()).hexdigest(), 'method': 'alpha crop; shared uniform scale per realm pair; premultiplied-alpha Lanczos; bottom anchor [64,112]', 'frames': records}, indent=2) + '\n', encoding='utf8')
print('Normalized eight realm dressing frames')
