from pathlib import Path
from PIL import Image
import json, hashlib
root=Path(__file__).resolve().parents[1];base=root/'assets/enemy-vfx-v12';frames={};records=[]
contacts=['steel','stone','ink','venom','water','thunder','fire','wind']
materials=['bolt','chain','venom','fire-wheel','wave','foam','water-crown','water-shaft','ink-seal','tower-seal','stone-crack','dust','lightning','tower-beam','wind','cut']
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
  box=(i%cols*w//cols,i//cols*h//rows,(i%cols+1)*w//cols,(i//cols+1)*h//rows);cell=im.crop(box);bounds=cell.getchannel('A').point(lambda a:255 if a>80 else 0).getbbox();assert bounds
  crop=cell.crop(bounds);scale=shared[(i//6)*2+(i%6)//3] if group=='contacts' else min(52/crop.width,52/crop.height);size=round(crop.width*scale),round(crop.height*scale);x,y=(64-size[0])//2,(64-size[1])//2
  atlas.alpha_composite(crop.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA'),(i%cols*64+x,i//cols*64+y))
  name=(names[(i//6)*2+(i%6)//3]+'-'+str(i%3)) if group=='contacts' else names[i]
  # Contacts use their contact base, not the geometric centre of flying chips.
  anchor=[32,48 if group=='contacts' else 32]
  frames[group+':'+name]={'image':'enemy-'+group,'r':[i%cols*64,i//cols*64,64,64],'anchor':anchor}
  records.append({'id':group+':'+name,'sourceBox':box,'bounds':bounds,'scale':scale,'size':size})
 atlas.save(base/(group+'.png'),optimize=True)
(root/'src/enemy-effects-data.js').write_text('(function(K){K.EnemyEffectFrames='+json.dumps(frames,separators=(',',':'))+';})(globalThis.Kong ||= {});\n',encoding='utf8')
(base/'normalization.json').write_text(json.dumps({'method':'alpha crop, fixed modular cells, premultiplied-alpha Lanczos; no nonuniform runtime stretching','sources':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in base.glob('*-source.png')},'frames':records},indent=2),encoding='utf8')
print('Normalized',len(frames),'enemy effect frames')
