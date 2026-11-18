from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[1];base=root/'assets/combat-v11';source=base/'contacts-source.png';image=Image.open(source).convert('RGBA');w,h=image.size
names=['staff-light','staff-heavy','spear','blade','guard','injury','lotus','eye'];hotspots=[(.39,.52),(.48,.66),(.53,.52),(.54,.53),(.68,.45),(.55,.48),(.48,.53),(.53,.54)]
atlas=Image.new('RGBA',(512,64));frames={};records=[]
for i,name in enumerate(names):
 box=(i%4*w//4,i//4*h//2,(i%4+1)*w//4,(i//4+1)*h//2);cell=image.crop(box);bounds=cell.getchannel('A').point(lambda a:255 if a>80 else 0).getbbox();assert bounds
 crop=cell.crop(bounds);scale=min(48/crop.width,48/crop.height);size=round(crop.width*scale),round(crop.height*scale);x,y=(64-size[0])//2,(64-size[1])//2
 atlas.alpha_composite(crop.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA'),(i*64+x,y));hx,hy=hotspots[i];anchor=[round(x+(hx*cell.width-bounds[0])*scale),round(y+(hy*cell.height-bounds[1])*scale)];assert all(0<=q<=64 for q in anchor)
 frames[name]={'image':'combatContacts','r':[i*64,0,64,64],'anchor':anchor};records.append({'name':name,'sourceBox':box,'bounds':bounds,'size':size,'scale':scale,'anchor':anchor})
atlas.save(base/'contacts.png',optimize=True);(base/'normalization.json').write_text(json.dumps({'tool':'built-in image_gen','sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'method':'explicit crop, premultiplied-alpha Lanczos, per-contact hotspot','frames':records},indent=2)+'\n',encoding='utf8')
(root/'src/combat-feedback-data.js').write_text('(function(K){K.CombatFrames='+json.dumps(frames,separators=(',',':'))+';})(globalThis.Kong ||= {});\n',encoding='utf8');print('Packed 8 contact effects')
