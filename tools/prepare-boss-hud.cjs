const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp'),writeGenerated=require('./write-generated.cjs');
const root=path.resolve(__dirname,'..'),base=path.join(root,'assets/boss-hud-v13'),hash=data=>crypto.createHash('sha256').update(data).digest('hex');
(async()=>{
  const source=fs.readFileSync(path.join(base,'frame-source.png'));
  // Remove only alpha-zero canvas padding; the inner aperture stays clear.
  const {data:raw,info:original}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});let top=original.height,bottom=0;
  for(let y=0;y<original.height;y++)for(let x=0;x<original.width;x++)if(raw[(y*original.width+x)*4+3]>1){top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const trimmed=await sharp(source).extract({left:0,top,width:original.width,height:bottom-top+1}).png().toBuffer(),image=await sharp(trimmed).resize({width:1600,withoutEnlargement:true,kernel:'lanczos3'}).png().toBuffer();
  const m=await sharp(image).metadata(),{data,info}=await sharp(image).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let clear=0;for(let y=Math.round(info.height*.39);y<info.height*.63;y++)for(let x=Math.round(info.width*.25);x<info.width*.75;x++)if(data[(y*info.width+x)*4+3]===0)clear++;
  if(clear<info.width*info.height*.09)throw Error('Boss HUD aperture is not transparent');
  writeGenerated(path.join(base,'frame.png'),image);writeGenerated(path.join(base,'manifest.json'),JSON.stringify({tool:'built-in image_gen',source:{file:'assets/boss-hud-v13/frame-source.png',sha256:hash(source)},image:{file:'assets/boss-hud-v13/frame.png',sha256:hash(image),width:m.width,height:m.height},aperture:{leftPercent:14,rightPercent:14,topPercent:35.7,heightPercent:33.4}},null,2)+'\n');
  console.log(JSON.stringify({width:m.width,height:m.height,bytes:image.length,transparentAperture:true}));
})().catch(error=>{console.error(error);process.exitCode=1;});
