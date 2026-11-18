from pathlib import Path
from PIL import Image
import json, hashlib
root=Path(__file__).resolve().parents[1];base=root/'assets/enemy-vfx-v12';frames={};records=[]
contacts=['steel','stone','ink','venom','water','thunder','fire','wind']
materials=['bolt','chain','venom','fire-wheel','wave','foam','water-crown','water-shaft','ink-seal','tower-seal','stone-crack','dust','lightning','tower-beam','wind','cut']
# The approved source is an arranged sheet, not four equal-height rows. Water
# overhangs the second row; grid crops contaminated ink/stone with cyan strips.
material_boxes=[(20,105,376,213),(492,5,581,300),(752,88,1030,230),(1108,20,1438,288),
 (8,390,378,593),(381,410,765,638),(765,300,1129,650),(1248,288,1387,629),
 (42,666,350,820),(400,645,709,822),(775,669,1100,809),(1196,672,1394,823),
 (24,829,385,1085),(494,822,625,1085),(701,855,1118,1085),(1187,823,1448,1085)]
for group,names,cols,rows in [('contacts',contacts,6,4),('materials',materials,4,4)]:
 im=Image.open(base/(group+'-source.png')).convert('RGBA');atlas=Image.new('RGBA',(64*cols,64*rows));w,h=im.size
 shared={}
 if group=='contacts':
  for family in range(8):
   sizes=[]
   for phase in range(3):
    i=(family//2)*6+(family%2)*3+phase;box=(i%cols*w//cols,i//cols*h//rows,(i%cols+1)*w//cols,(i//cols+1)*h//rows);b=im.crop(box).getchannel('A').point(lambda a:255 if a>80 else 0).getbbox();sizes.append(max(b[2]-b[0],b[3]-b[1]))
   shared[family]=52/max(sizes)
 for i in range(cols*rows):
  box=material_boxes[i] if group=='materials' else (i%cols*w//cols,i//cols*h//rows,(i%cols+1)*w//cols,(i//cols+1)*h//rows);cell=im.crop(box);bounds=cell.getchannel('A').point(lambda a:255 if a>80 else 0).getbbox();assert bounds
  crop=cell.crop(bounds);scale=shared[(i//6)*2+(i%6)//3] if group=='contacts' else min(52/crop.width,52/crop.height);size=round(crop.width*scale),round(crop.height*scale);x,y=(64-size[0])//2,(64-size[1])//2
  atlas.alpha_composite(crop.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA'),(i%cols*64+x,i//cols*64+y))
  name=(names[(i//6)*2+(i%6)//3]+'-'+str(i%3)) if group=='contacts' else names[i]
  # Contacts use their contact base, not the geometric centre of flying chips.
  anchor=[32,48 if group=='contacts' else 32]
  frames[group+':'+name]={'image':'enemy-'+group,'r':[i%cols*64,i//cols*64,64,64],'anchor':anchor}
  records.append({'id':group+':'+name,'sourceBox':box,'bounds':bounds,'scale':scale,'size':size})
 atlas.save(base/(group+('-v2' if group=='materials' else '')+'.png'),optimize=True)
(root/'src/enemy-effects-data.js').write_text('(function(K){K.EnemyEffectFrames='+json.dumps(frames,separators=(',',':'))+';})(globalThis.Kong ||= {});\n',encoding='utf8')
(base/'normalization-v2.json').write_text(json.dumps({'method':'explicit source rectangles for nonuniform material rows; alpha crop, fixed modular cells, premultiplied-alpha Lanczos; source and first normalization preserved','sources':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in base.glob('*-source.png')},'frames':records},indent=2),encoding='utf8')
print('Normalized',len(frames),'enemy effect frames')
