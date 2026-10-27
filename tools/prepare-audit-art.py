"""Pack generated art; fixed anchors and shared scale preserve visual state size."""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[1];base=root/'assets/audit-v10';report={};frames={}
def selected(name,boxes):
 p=base/(name+'-source.png');im=Image.open(p).convert('RGBA');cuts=[]
 for box in boxes:
  c=im.crop(box);b=c.getchannel('A').point(lambda a:255 if a>80 else 0).getbbox()
  if not b:raise ValueError(name)
  cuts.append((c.crop(b),b))
 report[name]={'sourceSize':im.size,'sourceSHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'boxes':boxes,'bounds':[b for _,b in cuts]};return cuts
boxes=[(0,0,512,610),(512,0,1024,610),(1024,0,1536,610),(0,640,512,1024),(512,640,1024,1024),(1024,640,1536,1024)]
cuts=selected('devices',boxes);out=Image.new('RGBA',(576,96));scales=[]
for i,(c,b) in enumerate(cuts):
 col=i%3
 scale=min(54/cuts[col][0].width,46/cuts[col][0].height,88/cuts[col+3][0].width)
 size=(round(c.width*scale),round(c.height*scale));assert size[0]<=90 and size[1]<=76
 out.alpha_composite(c.resize(size,Image.Resampling.NEAREST),(i*96+48-size[0]//2,80-size[1]));key=['underworld','dragon','heaven'][col]+'-device'+('-broken' if i>=3 else '');frames[key]={'image':'auditDevices','r':[i*96,0,96,96],'anchor':[48,80]};scales.append({'id':key,'scale':scale,'size':size})
out.save(base/'devices.png',optimize=True);report['devices']['output']=scales
cuts=selected('juling',[(0,0,640,650),(640,0,1280,650),(0,650,670,1280),(660,650,1280,1280)]);scale=min(min(196/c.width,125/c.height) for c,_ in cuts);out=Image.new('RGBA',(896,192))
for i,(c,b) in enumerate(cuts):
 size=(round(c.width*scale),round(c.height*scale));out.alpha_composite(c.resize(size,Image.Resampling.NEAREST),(i*224+112-size[0]//2,176-size[1]))
out.save(base/'juling.png',optimize=True);report['juling']['scale']=scale
(base/'normalization.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
(root/'src/audit-art-data.js').write_text('(function(K){Object.assign(K.CampaignFrames,'+json.dumps(frames,separators=(',',':'))+');})(globalThis.Kong ||= {});\n',encoding='utf8')
print('Packed 6 device states and four complete giant poses')
