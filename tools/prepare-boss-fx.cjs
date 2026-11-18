// Atlas extraction and shared-size normalization only. Preserve generated
// alpha and source pixels; never replace transparency with a keyed backdrop.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const writeGenerated=require('./write-generated.cjs');
const root=path.resolve(__dirname,'..'),base=path.join(root,'assets/boss-fx-v13'),hash=data=>crypto.createHash('sha256').update(data).digest('hex');
(async()=>{
  const sources={},cuts={},frames={},records=[],composites=[],slotW=256,slotH=320;
  const families=[['earth-family',['axe-arc','earth-eruption','dust-wave']],['ink-family',['verdict-seal','soul-chains','spirit-smoke']],['venom-family',['venom-orb','venom-wave','venom-mist']],['dragon-family',['storm-cloud',null,'water-geyser']],['gold-family',['pagoda','gold-ribbons','fire-wheel']]];
  for(let row=0;row<families.length;row++){
    const[file,ids]=families[row],bytes=fs.readFileSync(path.join(base,file+'.png')),{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    sources[file+'.png']=hash(bytes);const sums=Array.from({length:info.width},(_,x)=>{let sum=0;for(let y=0;y<info.height;y++)sum+=data[(y*info.width+x)*4+3];return sum;});
    const split=at=>{const center=info.width*at,lo=Math.floor(center-info.width*.09),hi=Math.ceil(center+info.width*.1);let best=Math.round(center),score=Infinity;for(let x=lo;x<=hi;x++){const next=sums[x]+Math.abs(x-center)*.001;if(next<score){score=next;best=x;}}return best;};
    const boundaries=[0,split(1/3),split(2/3),info.width];cuts[file]=boundaries;
    for(let col=0;col<3;col++){
      const id=ids[col]||'lightning',source=id==='lightning'?'lightning-sharp.png':id==='earth-eruption'?'grounded-spires.png':file+'.png',input=fs.readFileSync(path.join(base,source));sources[source]=hash(input);
      const extract=id==='lightning'||id==='earth-eruption'?sharp(input):sharp(input).extract({left:boundaries[col],top:0,width:boundaries[col+1]-boundaries[col],height:info.height});
      const cropped=await extract.toBuffer(),trimmed=await sharp(cropped).trim({threshold:0}).png().toBuffer();
      const normalized=await sharp(trimmed).resize({width:slotW-32,height:slotH-32,fit:'inside',kernel:'lanczos3'}).png().toBuffer(),m=await sharp(normalized).metadata();
      const x=col*slotW+Math.floor((slotW-m.width)/2),y=row*slotH+Math.floor((slotH-m.height)/2);
      composites.push({input:normalized,left:x,top:y});frames[id]={image:'bossFX',r:[x,y,m.width,m.height],anchor:[m.width/2,m.height]};records.push({id,source,sourceSHA256:sources[source],slot:[col,row],...frames[id]});
    }
  }
  const atlas=await sharp({create:{width:slotW*3,height:slotH*5,channels:4,background:'#00000000'}}).composite(composites).png().toBuffer();writeGenerated(path.join(base,'atlas.png'),atlas);
  writeGenerated(path.join(base,'manifest.json'),JSON.stringify({tool:'built-in image_gen',sources,cuts,atlas:{file:'assets/boss-fx-v13/atlas.png',sha256:hash(atlas),width:slotW*3,height:slotH*5},frames:records},null,2)+'\n');
  writeGenerated(path.join(root,'src/boss-fx-data.js'),'(function(K){K.BossEffectFrames='+JSON.stringify(frames)+';})(globalThis.Kong ||= {});\n');
  console.log(JSON.stringify({frames:records.length,atlasBytes:atlas.length,dimensions:[slotW*3,slotH*5]}));
})().catch(error=>{console.error(error);process.exitCode=1;});
