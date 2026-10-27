"""RGBA atlas normalization with measured crop gutters and explicit foot anchors."""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage
import json,hashlib
root=Path(__file__).resolve().parents[1];base=root/'assets/campaign-v10';frames={};report={}
def pack(name,key,items,heights,limits,slot=(224,192),anchor=(112,176)):
 p=base/(name+'-source.png');im=Image.open(p).convert('RGBA');cuts=[]
 for ident,rect in items:
  c=im.crop(rect)
  # A generated cape can enter a neighbour's nominal slot. Select the actual
  # connected actor silhouette; do not retain foreign isolated fragments.
  labels,count=ndimage.label(np.array(c.getchannel('A'))>80)
  if count:
   sizes=np.bincount(labels.ravel());sizes[0]=0;selected=int(sizes.argmax())
   keep=labels==selected
   # Retain small detached details close to the chosen silhouette only.
   distance=ndimage.distance_transform_edt(~keep)
   for label in range(1,count+1):
    piece=labels==label
    if label!=selected and sizes[label]>5 and distance[piece].min()<9:keep|=piece
   rgba=np.array(c);rgba[:,:,3]=np.where(keep,rgba[:,:,3],0);c=Image.fromarray(rgba)
  b=c.getchannel('A').point(lambda a:255 if a>80 else 0).getbbox()
  if not b:raise ValueError(ident)
  cuts.append((ident,rect,b,c.crop(b)))
 scales={g:min(min(limits[i]/c.width,heights[i]/c.height) for i,(_,_,_,c) in enumerate(cuts) if (0 if name in ['juling','qinguang','ninehead','dragonking','litian'] else i)==g) for g in ({0} if not name.startswith('army-') else range(len(cuts)))}
 out=Image.new('RGBA',(slot[0]*len(items),slot[1]));records=[]
 for i,(ident,rect,b,c) in enumerate(cuts):
  scale=scales[i if name.startswith('army-') else 0];size=(round(c.width*scale),round(c.height*scale));x=anchor[0]-size[0]//2;y=anchor[1]-size[1]
  assert x>=3 and y>=3 and x+size[0]<=slot[0]-3
  out.alpha_composite(c.resize(size,Image.Resampling.NEAREST),(i*slot[0]+x,y));frames[ident]={'image':key,'r':[i*slot[0],0,*slot],'anchor':anchor};records.append({'id':ident,'crop':rect,'bounds':b,'scale':scale,'outputSize':size})
 out.save(base/(name+'.png'),optimize=True);report[name]={'sourceSize':im.size,'sourceSHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'frames':records,'alphaZero':out.getchannel('A').histogram()[0]}
for name in ['juling','qinguang','ninehead','dragonking','litian']:
 im=Image.open(base/(name+'-source.png'));w,h=im.size
 rects=[(0,0,w//2,h//2),(w//2,0,w,h//2),(0,h//2,w//2,h),(w//2,h//2,w,h)]
 # A clipped raised axe is excluded entirely, rather than shipping a broken head.
 if name=='juling':rects[1]=rects[0]
 if name=='litian':rects[2]=(0,h//2,690,h)
 pack(name,'campaign-'+name,[(name+'-'+str(i),r) for i,r in enumerate(rects)],[125]*4,[196]*4)
for name in ['cloud','underworld','water','dragon','heaven']:
 im=Image.open(base/('army-'+name+'-source.png'));w,h=im.size
 rects=[(i%3*w//3,i//3*h//2,(i%3+1)*w//3,(i//3+1)*h//2) for i in range(6)]
 if name=='cloud':rects[3]=(0,485,605,h);rects[4]=(560,485,1080,h)
 if name=='dragon':rects[3]=(0,500,615,h);rects[4]=(560,480,1125,h);rects[5]=(1125,500,w,h)
 if name=='heaven':rects[3]=(0,480,525,h);rects[4]=(470,480,1060,h)
 if name=='water':rects[3]=(0,475,550,h);rects[4]=(500,460,1110,h)
 pack('army-'+name,'campaignArmy-'+name,[(name+'-'+('role'+str(i) if i<3 else 'mini'+str(i-3) if i<5 else 'device'),r) for i,r in enumerate(rects)],[62]*3+[90,90,46],[100]*3+[135,135,54],slot=(160,128),anchor=(80,112))
(base/'normalization.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
(root/'src/campaign-art-data.js').write_text('(function(K){K.CampaignFrames='+json.dumps(frames,separators=(',',':'))+';})(globalThis.Kong ||= {});\n',encoding='utf8')
print('Campaign atlas:',len(frames),'frames')
