"""Atlas production: explicit gutters, shared scale per actor, foot anchors, RGBA."""
from PIL import Image
from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[1];base=root/'assets/celestial-v9';frames={};report={}
def pack(name,key,items,groups,fit,slot=(192,192),anchor=(96,176)):
 im=Image.open(base/(name+'-source.png')).convert('RGBA');crops=[]
 for ident,rect in items:
  cut=im.crop(rect);bounds=cut.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox()
  if not bounds:raise ValueError(ident)
  crops.append((ident,rect,bounds,cut.crop(bounds)))
 scales={g:min(min(fit[i][0]/c.width,fit[i][1]/c.height) for i,(_,_,_,c) in enumerate(crops) if groups[i]==g) for g in set(groups)}
 out=Image.new('RGBA',(slot[0]*len(items),slot[1]));report[name]={'sourceSize':im.size,'sourceSHA256':hashlib.sha256((base/(name+'-source.png')).read_bytes()).hexdigest(),'frames':[]}
 for i,(ident,rect,bounds,cut) in enumerate(crops):
  scale=scales[groups[i]];size=(round(cut.width*scale),round(cut.height*scale));pos=(anchor[0]-size[0]//2,(slot[1]-size[1])//2 if name=='effects' else anchor[1]-size[1])
  assert min(pos)>=0 and pos[0]+size[0]<=slot[0]
  out.alpha_composite(cut.resize(size,Image.Resampling.NEAREST),(i*slot[0]+pos[0],pos[1]));frames[ident]={'image':key,'r':[i*slot[0],0,*slot],'anchor':anchor}
  report[name]['frames'].append({'id':ident,'crop':rect,'bounds':bounds,'scale':scale,'size':size})
 out.save(base/(name+'.png'),optimize=True)
hero_keys=['pole','spin','avatar-rise','avatar-slam','six-ready','six-strike','beam-ready','beam-release']
hero_rects=[(0,0,415,465),(415,0,899,465),(899,0,1330,465),(1330,0,1774,465),(0,465,426,887),(426,465,934,887),(934,465,1330,887),(1330,465,1774,887)]
pack('heroes','celestialHeroes',list(zip(hero_keys,hero_rects)),[0,0,1,1,2,2,3,3],[(100,80)]*2+[(165,152)]*2+[(125,98)]*2+[(110,80)]*2)
im=Image.open(base/'bosses-source.png');w,h=im.size
items=[(name+'-'+str(row),(col*w//4,row*h//2,(col+1)*w//4,(row+1)*h//2)) for row in range(2) for col,name in enumerate(['mountain','ferry','sanctuary','wutian'])]
items=[(name,((930 if name=='sanctuary-1' else rect[0]),rect[1],rect[2],rect[3])) for name,rect in items]
pack('bosses','celestialBosses',items,[0,1,2,3]*2,[(150,118)]*8)
im=Image.open(base/'effects-source.png');w,h=im.size
keys=['gold-slash','silver-slash','spear-flare','laser','impact','injury','void-slash','water','spin-ring','quake','pillar','lotus-orb','wind','meteor','silk','lightning']
rects=[(i%4*w//4,i//4*h//4,(i%4+1)*w//4,(i//4+1)*h//4) for i in range(16)];rects[8]=(0,h//2,414,3*h//4)
pack('effects','celestialFx',list(zip(keys,rects)),list(range(16)),[(124,124)]*16,slot=(128,128),anchor=(64,126))
(base/'normalization.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
(root/'src/celestial-art-data.js').write_text('(function(K){K.CelestialFrames='+json.dumps(frames,separators=(',',':'))+';})(globalThis.Kong ||= {});\n',encoding='utf8')
print('Normalized',len(frames),'frames; original alpha retained')
