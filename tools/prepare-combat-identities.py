"""Normalize ImageGen whole-sheet characters; never stretch a single pose."""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy.ndimage import label, find_objects, binary_dilation
import json, hashlib

root = Path(__file__).resolve().parents[1]
base = root / 'assets/combat-identities'
frames, records = {}, []
specs = {
    'wukong': ([4,4,4], 78/274, (288,176), (96,156)),
    'nezha': ([4,4,4], 78/188, (288,176), (96,156)),
    'erlang': ([4,5,5], 78/217, (288,176), (96,156)),
    'juling': ([3,3,3], 125/234, (352,208), (176,192)),
    'qinguang': ([3,3,3], 125/327, (352,208), (176,192)),
    'ninehead': ([3,3,3], 125/313, (352,208), (176,192)),
    'dragonking': ([3,3,3], 125/247, (352,208), (176,192)),
    'litian': ([3,3,3], 125/243, (352,208), (176,192)),
}
for name, (counts, scale, slot, anchor) in specs.items():
    path = base / (name+'-source.png')
    if not path.exists():
        raise RuntimeError('Missing generated source: '+name)
    rgba = np.array(Image.open(path).convert('RGBA'))
    labs, count = label(rgba[:,:,3]>100)
    sizes, objects = np.bincount(labs.ravel()), find_objects(labs)
    big = [i for i in range(1,count+1) if sizes[i]>2000]
    assert len(big)==sum(counts), (name, len(big), counts)
    centers = {i:np.argwhere(labs==i).mean(axis=0) for i in big}
    ordered = sorted(big, key=lambda i:centers[i][0])
    groups, start = [], 0
    for n in counts:
        groups.append(sorted(ordered[start:start+n],key=lambda i:centers[i][1])); start+=n
    # Erlang returned two extra transition poses. Keep four semantic phases;
    # use one global scale for every retained frame, never fit cells separately.
    if name=='erlang':
        groups[1]=[groups[1][i] for i in [0,1,3,4]]
        groups[2]=[groups[2][i] for i in [0,2,3,4]]
    cols = len(groups[0])
    atlas = Image.new('RGBA',(slot[0]*cols,slot[1]*3))
    for row, ids in enumerate(groups):
        for col, i in enumerate(ids):
            support = labs==i
            ys,xs = np.where(support)
            x0,x1,y0,y1 = xs.min(),xs.max()+1,ys.min(),ys.max()+1
            # Feet from the bottom 20% of an intact silhouette; exclude weapon
            # endpoints and ribbons in other cells by selecting this component.
            yy,xx = np.where(support & (np.indices(labs.shape)[0]>=y1-(y1-y0)*.20))
            ax,ay = float(np.median(xx))-x0,float(y1-y0-1)
            mask = binary_dilation(support,iterations=1)[y0:y1,x0:x1]
            pixels = rgba[y0:y1,x0:x1].copy()
            pixels[:,:,3]=np.where(mask,pixels[:,:,3],0)
            crop = Image.fromarray(pixels)
            size = round(crop.width*scale),round(crop.height*scale)
            px,py = anchor[0]-round(ax*scale),anchor[1]-round(ay*scale)
            assert px>=0 and py>=0 and px+size[0]<slot[0] and py+size[1]<=slot[1], (name,row,col,size,px,py)
            normalized = crop.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA')
            atlas.alpha_composite(normalized,(col*slot[0]+px,row*slot[1]+py))
            ident = f'{name}-{row}-{col}'
            frames[ident]={'image':'identity-'+name,'r':[col*slot[0],row*slot[1],*slot],'anchor':list(anchor)}
            records.append({'id':ident,'sourceBounds':[int(x0),int(y0),int(x1),int(y1)],'sourceComponent':i,'scale':scale,'size':list(size),'foot':[ax,ay]})
    atlas.save(base/(name+'.png'),optimize=True)
(root/'src/combat-identity-data.js').write_text('(function(K){K.IdentityFrames='+json.dumps(frames,separators=(',',':'))+';})(globalThis.Kong ||= {});\n',encoding='utf8')
(base/'normalization.json').write_text(json.dumps({'method':'full-sheet connected silhouette; same scale per actor; shared ground anchor; alpha-preserving premultiplied resampling; Erlang extra transitions omitted','sourceHashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in base.glob('*-source.png')},'frames':records},indent=2)+'\n',encoding='utf8')
print('Normalized',len(frames),'combat identity frames')
