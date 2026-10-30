// HTTP distribution: small classic scripts + lossless, separately cached assets.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'release/web'),digest=data=>crypto.createHash('sha256').update(data).digest('hex');
const write=(file,data)=>{const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);};
const urls=(property,map)=>`(function(K){const base=document.currentScript.src;K.${property}=Object.fromEntries(Object.entries(${JSON.stringify(map)}).map(([id,value])=>[id,typeof value==='string'?new URL(value,base).href:{...value,src:new URL(value.src,base).href}]));})(globalThis.Kong ||= {});`;
(async()=>{
 const art=JSON.parse(fs.readFileSync(path.join(root,'assets/v8/pack-manifest.json'),'utf8')).assets;
 let previous={};try{previous=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8')).images||{};}catch{}
 const images={},imageURLs={};
 for(const [id,a]of Object.entries(art)){
  const original=fs.readFileSync(path.join(root,a.file));if(digest(original)!==a.sha256)throw Error('Image source changed; run the full build: '+id);
  const cached=previous[id];let record;
  if(cached?.sourceSHA256===a.sha256&&cached.encoder===sharp.versions.sharp&&fs.existsSync(path.join(out,cached.file))&&digest(fs.readFileSync(path.join(out,cached.file)))===cached.sha256)record=cached;
  else{
   const encoded=await sharp(original).webp({lossless:true,effort:5}).toBuffer();
   const left=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true}),right=await sharp(encoded).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   if(left.info.width!==right.info.width||left.info.height!==right.info.height)throw Error('Image dimensions changed: '+id);
   for(let i=0;i<left.data.length;i+=4){const alpha=left.data[i+3];if(alpha!==right.data[i+3]||alpha>0&&(left.data[i]!==right.data[i]||left.data[i+1]!==right.data[i+1]||left.data[i+2]!==right.data[i+2]))throw Error('Lossless pixel mismatch: '+id+' at '+i/4);}
   const sha256=digest(encoded),file='assets/images/'+id+'.'+sha256.slice(0,16)+'.webp';write(file,encoded);record={file,bytes:encoded.length,sha256,sourceSHA256:a.sha256,width:left.info.width,height:left.info.height,encoder:sharp.versions.sharp,decodedPixelsEqual:true};
  }
  images[id]=record;imageURLs[id]=record.file;
 }
 const samples={},music={},files={};
 for(const [id,a]of Object.entries(JSON.parse(fs.readFileSync(path.join(root,'assets/audio-v6/manifest.json'),'utf8')).assets)){const file='assets/audio/'+id+'.'+a.sha256.slice(0,16)+'.wav',bytes=fs.readFileSync(path.join(root,a.file));write(file,bytes);samples[id]={src:file};files[file]={bytes:bytes.length,sha256:digest(bytes)};}
 for(const [id,a]of Object.entries(JSON.parse(fs.readFileSync(path.join(root,'assets/music/manifest.json'),'utf8')).tracks)){const file='assets/music/'+id+'.'+a.sha256.slice(0,16)+'.mp3',bytes=fs.readFileSync(path.join(root,a.file));write(file,bytes);music[id]={src:file,gain:a.gain};files[file]={bytes:bytes.length,sha256:digest(bytes)};}
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8'),styles='';
 html=html.replace(/<link rel="stylesheet" href="(src\/[^"]+)">/g,(_,file)=>{styles+=fs.readFileSync(path.join(root,file),'utf8')+'\n';return '';});
 const scripts=[];html=html.replace(/<script src="(src\/[^" ]+)"><\/script>/g,(_,file)=>{let code;if(file==='src/generated-art.js')code="(globalThis.Kong ||= {}).ArtDelivery='network';\n"+urls('ArtSources',imageURLs);else if(file==='src/generated-audio.js')code=urls('ImpactSamples',samples);else if(file==='src/generated-music.js')code=urls('MusicTracks',music);else code=fs.readFileSync(path.join(root,file),'utf8');scripts.push(code);return '';});
 const js=scripts.join('\n;\n').replace(/\r\n?/g,'\n'),css=styles.replace(/\r\n?/g,'\n'),scriptFile='game.'+digest(js).slice(0,16)+'.js',styleFile='game.'+digest(css).slice(0,16)+'.css';
 for(const[file,data]of [[scriptFile,js],[styleFile,css]]){write(file,data);write(file+'.br',zlib.brotliCompressSync(Buffer.from(data),{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:6}}));write(file+'.gz',zlib.gzipSync(data));files[file]={bytes:Buffer.byteLength(data),sha256:digest(data)};}
 html=html.replace('<head>','<head><meta name="kong-package" content="web"><link rel="stylesheet" href="'+styleFile+'">').replace('</body>','<script src="'+scriptFile+'"></script></body>').replace(/\r\n?/g,'\n');write('index.html',html);
 const manifest={version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,entry:'index.html',sha256:digest(html),bytes:Buffer.byteLength(html),delivery:'HTTP staged image loading; original standalone index remains ../index.html',script:scriptFile,style:styleFile,images,files};write('manifest.json',JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({webEntry:path.join(out,'index.html'),htmlBytes:manifest.bytes,scriptBytes:Buffer.byteLength(js),compressedScriptBytes:fs.statSync(path.join(out,scriptFile+'.br')).size,imageBytes:Object.values(images).reduce((n,x)=>n+x.bytes,0),originalImageBytes:Object.values(art).reduce((n,x)=>n+x.bytes,0),images:Object.keys(images).length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
