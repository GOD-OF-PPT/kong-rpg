"""Normalize generated cloud/staff assets, with premultiplied-alpha resampling."""
from pathlib import Path
from PIL import Image
import hashlib
import json

root = Path(__file__).resolve().parents[1]
base = root / 'assets/cloud-visual-v10'
frames, report = {}, {'method': 'explicit source crops; shared actor scale; premultiplied-alpha Lanczos reduction; no pixel recolouring', 'sources': {}, 'frames': {}}

def source(name):
    path = base / (name + '-source.png')
    image = Image.open(path).convert('RGBA')
    report['sources'][name] = {'size': image.size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    return image

def resize(image, size):
    return image.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA')

background = source('background')
resize(background, (960, 540)).convert('RGB').save(base / 'background.png', optimize=True)

environment = source('environment')
environment_atlas = Image.new('RGBA', (1024, 288))
items = [
    ('cloud-ledge', (0, 225, 464, 400), (128, 30), True),
    ('cloud-foundation', (464, 220, 943, 496), (128, 76), False),
    ('cloud-fragile', (946, 238, 1399, 389), (128, 30), True),
    ('cloud-beacon', (1392, 36, 1670, 495), (48, 84), False),
    ('cloud-gate', (15, 490, 493, 937), (146, 132), False),
    ('cloud-camp-lit', (504, 550, 827, 925), (52, 60), False),
    ('cloud-camp-spent', (888, 550, 1220, 925), (52, 60), False),
    ('manual-plinth', (1260, 741, 1670, 918), (32, 13), False)
]
for index, (name, box, target, tile) in enumerate(items):
    crop = environment.crop(box)
    bounds = crop.getchannel('A').point(lambda a: 255 if a > 80 else 0).getbbox()
    assert bounds, name
    crop = crop.crop(bounds)
    if tile:
        # The central side-on section repeats; ornamental end caps stay outside.
        left, right = round(crop.width * .18), round(crop.width * .82)
        crop = crop.crop((left, 0, right, crop.height))
    output = resize(crop, target)
    x, y = (index % 4) * 256, (index // 4) * 128
    environment_atlas.alpha_composite(output, (x, y))
    frames[name] = {'image': 'cloudEnvironment', 'r': [x, y, *target], 'anchor': [target[0] // 2, target[1]]}
    report['frames'][name] = {'sourceBox': box, 'alphaBounds': bounds, 'size': target, 'tileCentre': tile}
environment_atlas.save(base / 'environment.png', optimize=True)

# Use one long varied foundation rather than a repeated pendant every 128px.
foundation = source('foundation')
mask = foundation.getchannel('A').point(lambda a: 255 if a > 80 else 0)
bounds = mask.getbbox()
assert bounds
crop = foundation.crop(bounds)
mask_crop = mask.crop(bounds)
rows = [sum(mask_crop.crop((0, y, mask_crop.width, y + 1)).histogram()[81:]) for y in range(mask_crop.height)]
top = next(y for y, count in enumerate(rows) if count > mask_crop.width * .7)
crop = crop.crop((0, top, crop.width, crop.height))
resize(crop, (768, 88)).save(base / 'foundation.png', optimize=True)
frames['cloud-foundation'] = {'image': 'cloudFoundation', 'r': [0, 0, 768, 88], 'anchor': [384, 88]}
report['frames']['cloud-foundation'] = {'source': 'foundation', 'alphaBounds': bounds, 'topCorrection': top, 'size': [768, 88]}

actors = source('staff-actors')
actor_atlas = Image.new('RGBA', (1280, 128))
actor_names = ['sky-plant', 'sky-rise', 'sky-fall', 'sky-land', 'orbit-ready', 'orbit-forward', 'orbit-back', 'orbit-finish']
grips = [(235, 405), (285, 238), (245, 170), (284, 493), (230, 215), (185, 226), (240, 220), (230, 225)]
scale = .23
for index, name in enumerate(actor_names):
    col = index % 4
    top, bottom = (0, 560) if index < 4 else (600, 1024)
    box = (col * 384, top, (col + 1) * 384, bottom)
    cell = actors.crop(box)
    mask = cell.getchannel('A').point(lambda a: 255 if a > 80 else 0)
    bounds = mask.getbbox()
    assert bounds, name
    crop = cell.crop(bounds)
    foot = mask.crop((0, bounds[3] - 8, cell.width, bounds[3])).getbbox()
    foot_x = (foot[0] + foot[2]) / 2
    size = round(crop.width * scale), round(crop.height * scale)
    placement = 80 - round((foot_x - bounds[0]) * scale), 112 - size[1]
    assert placement[0] > 1 and placement[1] > 1 and placement[0] + size[0] < 159, (name, placement, size)
    actor_atlas.alpha_composite(resize(crop, size), (index * 160 + placement[0], placement[1]))
    gx, gy = grips[index]
    grip = [round(placement[0] + (gx - bounds[0]) * scale), round(placement[1] + (gy - bounds[1]) * scale)]
    frames[name] = {'image': 'staffActors', 'r': [index * 160, 0, 160, 128], 'anchor': [80, 112], 'grip': grip}
    report['frames'][name] = {'sourceBox': box, 'alphaBounds': bounds, 'scale': scale, 'size': size, 'placement': placement, 'grip': grip}
actor_atlas.save(base / 'staff-actors.png', optimize=True)

effects = source('staff-fx')
fx_atlas = Image.new('RGBA', (1920, 112))
for index, name in enumerate(['slam-contact', 'slam-pressure', 'slam-dust', 'orbit-trail0', 'orbit-trail1', 'orbit-trail2']):
    col = index % 3
    box = (col * 724, 0 if index < 3 else 390, (col + 1) * 724, 362 if index < 3 else 724)
    cell = effects.crop(box)
    bounds = cell.getchannel('A').point(lambda a: 255 if a > 80 else 0).getbbox()
    assert bounds, name
    crop = cell.crop(bounds)
    fit = (184, 74) if index < 3 else (320, 76)
    ratio = min(fit[0] / crop.width, fit[1] / crop.height)
    size = round(crop.width * ratio), round(crop.height * ratio)
    fx_atlas.alpha_composite(resize(crop, size), (index * 320, 0))
    frames[name] = {'image': 'staffFx', 'r': [index * 320, 0, *size], 'anchor': [size[0] // 2, size[1]]}
    report['frames'][name] = {'sourceBox': box, 'alphaBounds': bounds, 'size': size}
fx_atlas.save(base / 'staff-fx.png', optimize=True)
report['outputs'] = {p.name: {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in base.glob('*.png') if '-source' not in p.name}
(base / 'normalization.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
(root / 'src/cloud-visual-data.js').write_text('(function(K){K.CloudFrames=' + json.dumps(frames, separators=(',', ':')) + ';})(globalThis.Kong ||= {});\n', encoding='utf8')
print(json.dumps({'frames': len(frames), 'outputs': report['outputs']}))
