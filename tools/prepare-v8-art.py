"""Production atlas normalization: preserve RGBA, measured gutters, shared scale."""
from pathlib import Path
import hashlib,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'assets/v8'
frames={};report={'tool':'built-in image_gen','method':'explicit crop, shared scale, nearest-neighbour; original RGBA retained','frames':{},'sources':{}}
def source(name):
 p=BASE/(name+'-source.png');im=Image.open(p).convert('RGBA');report['sources'][name]={'size':im.size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'transparent':im.getchannel('A').histogram()[0]};return im
def pack(name,imagekey,items,scale=None,fit=(80,80),slot=(160,128),anchor=(80,112),input_name=None):
 im=source(input_name or name);crops=[]
 for key,rect in items:
  c=im.crop(rect);b=c.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox()
  if not b:raise ValueError(key)
  crops.append((key,rect,b,c.crop(b)))
 if scale is None:scale=min(min(fit[0]/c.width,fit[1]/c.height) for _,_,_,c in crops)
 out=Image.new('RGBA',(slot[0]*len(items),slot[1]))
 for i,(key,rect,b,c) in enumerate(crops):
  size=(round(c.width*scale),round(c.height*scale));x=anchor[0]-size[0]//2;y=anchor[1]-size[1]
  if x<0 or y<0 or x+size[0]>slot[0]:raise ValueError('Clip '+key)
  out.alpha_composite(c.resize(size,Image.Resampling.NEAREST),(i*slot[0]+x,y));frames[key]={'image':imagekey,'r':[i*slot[0],0,*slot],'anchor':anchor};report['frames'][key]={'source':rect,'bounds':b,'scale':scale,'size':size}
 out.save(BASE/(name+'.png'),optimize=True)
pack('erlang','v8Erlang',[(f'erlang-{i}',r) for i,r in enumerate([(0,0,450,430),(450,0,1024,430),(0,430,500,815),(500,430,1024,815),(0,815,512,1190),(512,815,1024,1190),(0,1190,500,1536),(500,1190,1024,1536)])],scale=.205,input_name='erlang-v2')
pack('nezha','v8Nezha',[(f'nezha-{i}',rect) for i,rect in enumerate([(0,0,320,510),(320,0,760,510),(760,0,1100,470),(1110,0,1536,510),(0,510,330,1024),(330,510,770,1024),(770,510,1160,1024),(1160,750,1536,1024)])],scale=.21)
im=source('companion');w,h=im.size
# The generated hound row occupies 0..560; effect row starts at560.
items=[('hound-'+str(i),(i*w//4,0,(i+1)*w//4,560)) for i in range(4)]
pack('companion','v8Companion',items,fit=(60,38),slot=(80,64),anchor=(40,56))
fx=Image.new('RGBA',(256,64))
for i,key in enumerate(['arrow','eye','ring','ally']):
 r=(i*w//4,560,(i+1)*w//4,h);c=im.crop(r);b=c.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox();c=c.crop(b);fit=[(32,10),(42,32),(32,20),(14,14)][i];s=min(fit[0]/c.width,fit[1]/c.height);size=(round(c.width*s),round(c.height*s));fx.alpha_composite(c.resize(size,Image.Resampling.NEAREST),(i*64,0));frames[key]={'image':'v8Fx','r':[i*64,0,*size],'anchor':[0,0]}
fx.save(BASE/'fx.png',optimize=True)
im=source('enemies');w,h=im.size;keys=['cloud','heaven','water','dragon','underworld'];items=[]
for row,key in enumerate(keys):
 for col in range(2):items.append((key+'-'+str(col),(col*w//2,row*h//5,(col+1)*w//2,(row+1)*h//5)))
pack('enemies','v8Enemies',items,fit=(78,66),slot=(112,96),anchor=(56,88))
im=source('terrain');rows=[round(v*im.height/1133) for v in [0,245,475,700,914,1133]];out=Image.new('RGBA',(640,64))
for i,key in enumerate(keys):
 for col,typ in enumerate(['ledge','wall']):
  r=(round((70 if col==0 else 1010)*im.width/1280),rows[i],round((1005 if col==0 else 1270)*im.width/1280),rows[i+1]);c=im.crop(r);b=c.getchannel('A').point(lambda a:255 if a>60 else 0).getbbox();c=c.crop(b)
  if col==0:
   scale=30/c.height;c=c.resize((round(c.width*scale),30),Image.Resampling.NEAREST);x=max(0,(c.width-64)//2);c=c.crop((x,0,x+64,30))
  else:c=c.resize((64,64),Image.Resampling.NEAREST)
  out.alpha_composite(c,(i*128+col*64,0));frames[typ+'-'+key]={'image':'v8Terrain','r':[i*128+col*64,0,c.width,c.height],'anchor':[0,0]}
out.save(BASE/'terrain.png',optimize=True)
for name,raw,rect in [('erlang','erlang-v2',(0,0,450,430)),('nezha','nezha',(0,0,310,480))]:
 im=source(raw).crop(rect);b=im.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox();im.crop(b).save(BASE/(name+'-portrait.png'),optimize=True)
for key in keys:
 im=source(key);im.resize((960,540),Image.Resampling.NEAREST).convert('RGB').save(BASE/(key+'.png'),optimize=True)
report['outputs']={p.name:{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in BASE.glob('*.png') if 'source' not in p.name}
(BASE/'normalization.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
(ROOT/'src/v8-art-data.js').write_text('(function(K){K.V8Frames='+json.dumps(frames,separators=(',',':'))+';})(globalThis.Kong ||= {});\n',encoding='utf8')
print(json.dumps(report['outputs'],indent=2))
