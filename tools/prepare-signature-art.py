"""Normalize approved ImageGen source frames; keep RGBA and shared scales."""
from pathlib import Path
import json
import hashlib
from PIL import Image

root=Path(__file__).resolve().parents[1]
base=root/'assets/signature-v7'
frames={}
report={'tool':'built-in image_gen','process':'explicit crops; shared scale; nearest-neighbour; original alpha retained','sources':{},'frames':{}}
for name,fit in [('wukong',84),('nezha',82)]:
    im=Image.open(base/(name+'-source.png')).convert('RGBA')
    w,h=im.size
    cells=[]
    for i in range(4):
        rect=(i%2*w//2,i//2*h//2,(i%2+1)*w//2,(i//2+1)*h//2)
        c=im.crop(rect);b=c.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox();cells.append((rect,b,c.crop(b)))
    scale=min(fit/c.height for _,_,c in cells)
    out=Image.new('RGBA',(512,128))
    for i,(rect,b,c) in enumerate(cells):
        # Base center follows boots/wheels; airborne poses share one body scale.
        mask=c.getchannel('A').crop((0,max(0,c.height-55),c.width,c.height)).point(lambda a:255 if a>100 else 0).getbbox()
        ax=(mask[0]+mask[2])/2 if mask else c.width/2
        size=(round(c.width*scale),round(c.height*scale));r=c.resize(size,Image.Resampling.NEAREST)
        x=round(64-ax*scale);y=112-size[1]
        if x<0 or x+size[0]>128:raise ValueError(name+' sprite clips slot')
        out.alpha_composite(r,(i*128+x,y))
        frames[name+str(i)]={'image':'sig'+name.title(),'r':[i*128,0,128,128],'anchor':[64,112]}
        report['frames'][name+str(i)]={'source':rect,'alphaBounds':b,'scale':scale,'bodyBounds':[x,y,*size]}
    out.save(base/(name+'.png'),optimize=True)
    report['sources'][name]={'size':im.size,'sha256':hashlib.sha256((base/(name+'-source.png')).read_bytes()).hexdigest(),'transparent':im.getchannel('A').histogram()[0]}

im=Image.open(base/'fx-source.png').convert('RGBA');w,h=im.size
out=Image.new('RGBA',(512,256))
sizes=[(32,7),(22,8),(38,38),(38,16),(64,48),(64,48),(22,24),(40,24)]
for i,(name,size) in enumerate(zip(['shaft','cap','tip','wind','air-warning','air-active','brace','charge'],sizes)):
    rect=(i%4*w//4,i//4*h//2,(i%4+1)*w//4,(i//4+1)*h//2)
    c=im.crop(rect);b=c.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox();c=c.crop(b)
    out.alpha_composite(c.resize(size,Image.Resampling.NEAREST),(i%4*128,i//4*128))
    frames[name]={'image':'sigFx','r':[i%4*128,i//4*128,*size],'anchor':[0,0]}
    report['frames'][name]={'source':rect,'alphaBounds':b,'outputSize':size}
out.save(base/'fx.png',optimize=True)
report['sources']['fx']={'size':im.size,'sha256':hashlib.sha256((base/'fx-source.png').read_bytes()).hexdigest(),'transparent':im.getchannel('A').histogram()[0]}
(base/'normalization.json').write_text(json.dumps(report,indent=2),encoding='utf8')
(root/'src/signature-data.js').write_text('(function(K){K.SignatureFrames='+json.dumps(frames,separators=(',',':'))+';})(globalThis.Kong ||= {});\n',encoding='utf8')
print({k:Image.open(base/(k+'.png')).size for k in ['wukong','nezha','fx']})
