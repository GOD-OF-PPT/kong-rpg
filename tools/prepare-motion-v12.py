from pathlib import Path
from PIL import Image
import numpy as np
from scipy.ndimage import label, binary_dilation, find_objects
import json, hashlib

root=Path(__file__).resolve().parents[1]; base=root/'assets/motion-v12';frames={};records=[]
for name in ['nezha','erlang','cloud','underworld','water','dragon','heaven']:
    source=base/(name+'-source.png')
    if not source.exists(): continue
    im=Image.open(source).convert('RGBA');rgba=np.array(im);alpha=rgba[:,:,3];labs,count=label(alpha>90);sizes=np.bincount(labs.ravel());objects=find_objects(labs)
    big=[i for i in range(1,count+1) if sizes[i]>1000]
    cols=4 if name in ['nezha','erlang'] else 6;rows=5
    assert len(big)==cols*rows,(name,len(big))
    # Identify disconnected full sprites by row, then horizontal position. A
    # spear may cross a nominal cell boundary, so never crop to a guessed grid.
    centres={i:(np.where(labs==i)[1].mean(),np.where(labs==i)[0].mean()) for i in big}
    ordered=sorted(big,key=lambda i:centres[i][1]);groups=[sorted(ordered[r*cols:(r+1)*cols],key=lambda i:centres[i][0]) for r in range(rows)]
    atlas=Image.new('RGBA',(192*cols,128*rows)); neutral=objects[groups[4][3]-1] if cols==4 else None
    heroScale=80/(neutral[0].stop-neutral[0].start) if neutral else None
    for row,ids in enumerate(groups):
        heights=[objects[i-1][0].stop-objects[i-1][0].start for i in ids]
        scale=heroScale or (76 if row>=3 else 58)/float(np.median(heights))
        for col,i in enumerate(ids):
            mask=binary_dilation(labs==i,iterations=2);ys,xs=np.where(mask);x0,x1=xs.min(),xs.max()+1;y0,y1=ys.min(),ys.max()+1
            pixels=rgba[y0:y1,x0:x1].copy();pixels[:,:,3]=np.where(mask[y0:y1,x0:x1],pixels[:,:,3],0);crop=Image.fromarray(pixels)
            # Foot/hip anchor excludes the extended weapon and trailing ribbon.
            yy,xx=np.where((labs==i)&(np.indices(labs.shape)[0]>y0+(y1-y0)*.68))
            ax=float(np.median(xx))-x0;ay=float(np.quantile(yy,.995))-y0
            size=(round(crop.width*scale),round(crop.height*scale));px=72-round(ax*scale);py=112-round(ay*scale)
            assert px>=0 and px+size[0]<=192 and py>=0 and py+size[1]<=128,(name,row,col,size,px,py)
            atlas.alpha_composite(crop.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA'),(col*192+px,row*128+py))
            key=f'{name}-{row}-{col}';frames[key]={'image':'motion-'+name,'r':[col*192,row*128,192,128],'anchor':[72,112]};records.append({'id':key,'component':i,'sourceBounds':[int(x0),int(y0),int(x1),int(y1)],'scale':scale,'root':[ax,ay]})
    atlas.save(base/(name+'.png'),optimize=True)
(base/'normalization.json').write_text(json.dumps({'method':'whole-strip connected components; one scale per hero / enemy row; measured foot anchors; premultiplied alpha Lanczos','sources':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in base.glob('*-source.png')},'frames':records},indent=2),encoding='utf8')
(root/'src/motion-data.js').write_text('(function(K){K.MotionFrames='+json.dumps(frames,separators=(',',':'))+';})(globalThis.Kong ||= {});\n',encoding='utf8')
print('Normalized',len(frames),'motion frames')
