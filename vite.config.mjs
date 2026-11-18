import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {defineConfig,version as viteVersion} from 'vite';


const root=fileURLToPath(new URL('./',import.meta.url));
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
const readJSON=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const bootImages=['brandWordmark','mountain','wukong','stone'];
const virtualId='virtual:kong-media',resolvedId='\0'+virtualId;

// Only the small URL catalogue is imported by the game. Image and music bytes
// are emitted as separate assets and remain behind the production staged loader.
async function mediaAssets(offline,dev){
  const art=readJSON('assets/v8/pack-manifest.json').assets;
  const audio=readJSON('assets/audio-v6/manifest.json').assets;
  const tracks=readJSON('assets/music/manifest.json').tracks;
  for(const asset of Object.values(art)){const bytes=fs.readFileSync(path.join(root,asset.file));asset.bytes=bytes.length;asset.sha256=digest(bytes);}
  const output=path.join(root,offline?'dist-offline':'dist');
  const assets=new Map(),images={},imageURLs={},samples={},music={},files={};
  const emit=(file,data)=>{assets.set(file,Buffer.isBuffer(data)?data:Buffer.from(data));return file;};
  let previous={},webCache={};
  try{previous=JSON.parse(fs.readFileSync(path.join(output,'manifest.json'),'utf8')).images||{};}catch{}
  const previousRoot=output;
  const webRoot=path.join(root,'dist');
  if(offline)try{webCache=JSON.parse(fs.readFileSync(path.join(webRoot,'manifest.json'),'utf8')).images||{};}catch{}
  for(const [id,a]of Object.entries(art)){
    if(dev){imageURLs[id]='/'+a.file+'?v='+a.sha256.slice(0,16);continue;}
    const original=fs.readFileSync(path.join(root,a.file));
    if(digest(original)!==a.sha256)throw Error('Image source changed; prepare the asset catalogue: '+id);
    const valid=(record,base)=>record?.sourceSHA256===a.sha256&&record.encoder===sharp.versions.sharp&&fs.existsSync(path.join(base,record.file))&&digest(fs.readFileSync(path.join(base,record.file)))===record.sha256;
    const cached=previous[id];
    if(offline&&cached?.transport==='classic-data-script'&&valid(cached,previousRoot)){
      emit(cached.file,fs.readFileSync(path.join(previousRoot,cached.file)));images[id]=cached;imageURLs[id]={script:cached.file};continue;
    }
    let encoded,details;
    if(cached?.file.endsWith('.webp')&&valid(cached,previousRoot)){
      encoded=fs.readFileSync(path.join(previousRoot,cached.file));details=cached;
    }else if(offline&&valid(webCache[id],webRoot)){
      encoded=fs.readFileSync(path.join(webRoot,webCache[id].file));details=webCache[id];
    }else{
      encoded=await sharp(original).webp({lossless:true,effort:5}).toBuffer();
      const left=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      const right=await sharp(encoded).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      if(left.info.width!==right.info.width||left.info.height!==right.info.height)throw Error('Image dimensions changed: '+id);
      for(let i=0;i<left.data.length;i+=4){const alpha=left.data[i+3];if(alpha!==right.data[i+3]||alpha>0&&(left.data[i]!==right.data[i]||left.data[i+1]!==right.data[i+1]||left.data[i+2]!==right.data[i+2]))throw Error('Lossless pixel mismatch: '+id+' at '+i/4);}
      details={width:left.info.width,height:left.info.height,decodedPixelsEqual:true};
    }
    const data=offline?'(function(K){(K.LocalArt ||= {})['+JSON.stringify(id)+']='+JSON.stringify('data:image/webp;base64,'+encoded.toString('base64'))+';})(globalThis.Kong ||= {});':encoded;
    const sha256=digest(data),file='assets/images/'+id+'.'+sha256.slice(0,16)+(offline?'.js':'.webp');emit(file,data);
    images[id]={file,bytes:Buffer.byteLength(data),sha256,sourceSHA256:a.sha256,width:details.width,height:details.height,encoder:sharp.versions.sharp,decodedPixelsEqual:true,...(offline?{transport:'classic-data-script'}:{})};
    imageURLs[id]=offline?{script:file}:file;
  }
  for(const [id,a]of Object.entries(audio)){
    if(dev){samples[id]={src:'/'+a.file+'?v='+a.sha256.slice(0,16)};continue;}
    const data=fs.readFileSync(path.join(root,a.file));if(digest(data)!==a.sha256)throw Error('Audio source changed: '+id);
    if(offline)samples[id]=data.toString('base64');
    else{const file=emit('assets/audio/'+id+'.'+a.sha256.slice(0,16)+'.wav',data);samples[id]={src:file};files[file]={bytes:data.length,sha256:a.sha256};}
  }
  for(const [id,a]of Object.entries(tracks)){
    if(dev){music[id]={src:'/'+a.file+'?v='+a.sha256.slice(0,16),gain:a.gain};continue;}
    const bytes=fs.readFileSync(path.join(root,a.file));if(digest(bytes)!==a.sha256)throw Error('Music source changed: '+id);
    const data=offline?'(function(K){(K.LocalMusic ||= {})['+JSON.stringify(id)+']='+JSON.stringify('data:audio/mpeg;base64,'+bytes.toString('base64'))+';})(globalThis.Kong ||= {});':bytes;
    const sha256=digest(data),file=emit('assets/music/'+id+'.'+sha256.slice(0,16)+(offline?'.js':'.mp3'),data);
    music[id]={...(offline?{script:file}:{src:file}),gain:a.gain};files[file]={bytes:Buffer.byteLength(data),sha256};
  }
  // document.baseURI works for Vite modules, classic offline scripts and a
  // deployment below a URL subdirectory; document.currentScript does not.
  const urls=(property,map)=>`K.${property}=Object.fromEntries(Object.entries(${JSON.stringify(map)}).map(([id,value])=>[id,typeof value==='string'?new URL(value,base).href:{...value,...(value.script?{script:new URL(value.script,base).href}:{src:new URL(value.src,base).href})}]));`;
  const code=`const K=(globalThis.Kong ||= {}),base=document.baseURI;K.LegacyEntries=[];K.ArtDelivery=${JSON.stringify(offline?'offline':'network')};`+urls('ArtSources',imageURLs)+(offline?'K.ImpactSamples='+JSON.stringify(samples)+';':urls('ImpactSamples',samples))+urls('MusicTracks',music);
  return {assets,images,imageURLs,files,code};
}

function gameDistribution(offline){
  let media,dev=false,generated,outputRoot;
  return {
    name:'kong-game-distribution',enforce:'post',
    configResolved(config){dev=config.command==='serve';outputRoot=path.resolve(config.root,config.build.outDir);},
    async buildStart(){
      validateGameAssets();
      media=await mediaAssets(offline,dev);
      if(!dev)for(const [fileName,source]of media.assets)this.emitFile({type:'asset',fileName,source});
    },
    resolveId(id){if(id===virtualId)return resolvedId;},
    load(id){if(id===resolvedId)return media.code;},
    transformIndexHtml:{order:'post',handler(html){
      if(dev)return html;
      html=html.replace('<head>','<head><meta name="kong-package" content="'+(offline?'offline-folder':'web')+'">');
      if(offline)return html.replace(/\s+type="module"/g,' defer').replace(/\s+crossorigin(?:="[^"]*")?/g,'');
      return {html,tags:bootImages.map(id=>({tag:'link',attrs:{rel:'preload',as:'image',href:'./'+media.imageURLs[id],fetchpriority:'high'},injectTo:'head'}))};
    }},
    generateBundle(options,bundle){
      if(dev)return;
      // Rolldown's bundle view does not immediately include assets emitted
      // from this same hook. Capture them explicitly for atomic writing and
      // cleanup so the manifest and compressed files cannot be pruned away.
      const emitted=[];
      const emit=(fileName,source)=>{this.emitFile({type:'asset',fileName,source});emitted.push({type:'asset',fileName,source});};
      const entry=Object.values(bundle).find(file=>file.type==='chunk'&&file.isEntry);
      const style=Object.values(bundle).find(file=>file.fileName.endsWith('.css'));
      const html=bundle['index.html'];
      if(!entry||!style||!html)throw Error('Vite did not emit the game entry, stylesheet and HTML');
      const jsLimit=(offline?640:512)*1024;
      if(Buffer.byteLength(entry.code)>jsLimit)throw Error('Initial game JavaScript exceeds its startup budget: '+jsLimit);
      if(Buffer.byteLength(html.source)>32*1024||Buffer.byteLength(style.source)>96*1024)throw Error('Initial HTML or CSS exceeds its startup budget');
      const initialBytes=Buffer.byteLength(html.source)+Buffer.byteLength(style.source)+Buffer.byteLength(entry.code)+bootImages.reduce((sum,id)=>sum+media.images[id].bytes,0);
      if(!offline&&initialBytes>5000000)throw Error('Uncompressed homepage exceeds the 5 MB startup budget: '+initialBytes);
      const files={...media.files};
      for(const file of Object.values(bundle)){
        if(file.type==='chunk'||file.fileName.endsWith('.css')){
          const data=file.type==='chunk'?file.code:file.source;
          files[file.fileName]={bytes:Buffer.byteLength(data),sha256:digest(data)};
          if(!offline){
            emit(file.fileName+'.br',zlib.brotliCompressSync(Buffer.from(data),{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:6}}));
            emit(file.fileName+'.gz',zlib.gzipSync(data));
          }
        }
      }
      const manifest={version:readJSON('package.json').version,buildTool:{name:'vite',version:viteVersion},entry:'index.html',sha256:digest(html.source),bytes:Buffer.byteLength(html.source),delivery:offline?'offline folder; file:// classic scripts and local images; keep the complete directory':'HTTP staged image loading',script:entry.fileName,style:style.fileName,bootImages,images:media.images,files,runtimeDependencies:[]};
      emit('manifest.json',JSON.stringify(manifest,null,2)+'\n');
      this.info('First screen: '+bootImages.length+' images; game JS '+files[entry.fileName].bytes+' bytes; '+(offline?'classic file:// entry':'module HTTP entry'));
      generated=new Map([...Object.values(bundle),...emitted].map(file=>[file.fileName,file]));
    },
    closeBundle(){
      if(!generated)return;
      if(!['dist','dist-offline'].some(name=>outputRoot===path.join(root,name)))throw Error('Refusing to write a non-build directory: '+outputRoot);
      if(fs.existsSync(outputRoot)&&fs.lstatSync(outputRoot).isSymbolicLink())throw Error('Refusing to write through a linked build directory');
      // Chrome and Windows AV can map an open release file. Vite's default
      // truncate-in-place writer then fails with OS error 1224. Commit Vite's
      // complete output using same-directory atomic replacements; skip exact
      // matches, retain history, and publish the dependency manifest last.
      const files=[...generated.values()].sort((a,b)=>(a.fileName==='manifest.json')-(b.fileName==='manifest.json'));
      for(const file of files){
        const data=Buffer.from(file.type==='chunk'?file.code:file.source),target=path.join(outputRoot,file.fileName);
        if(!target.startsWith(outputRoot+path.sep))throw Error('Invalid Vite output path: '+file.fileName);
        if(fs.existsSync(target)&&digest(fs.readFileSync(target))===digest(data))continue;
        fs.mkdirSync(path.dirname(target),{recursive:true});const temporary=target+'.tmp-'+process.pid;fs.writeFileSync(temporary,data);
        for(let attempt=0;;attempt++){
          try{fs.renameSync(temporary,target);break;}
          catch(error){if(attempt>=50||!['EPERM','EACCES','EBUSY','UNKNOWN'].includes(error.code))throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}
        }
      }
      // A completed build owns these generated folders. Never traverse a
      // junction or clean the repository's archived release/ directory.
      const keep=new Set(files.map(file=>path.join(outputRoot,file.fileName)));
      const prune=directory=>{
        for(const item of fs.readdirSync(directory,{withFileTypes:true})){
          const target=path.join(directory,item.name);
          if(item.isSymbolicLink())throw Error('Unexpected link in build output: '+target);
          if(item.isDirectory()){prune(target);if(!fs.readdirSync(target).length)fs.rmdirSync(target);}
          else if(!keep.has(target))fs.unlinkSync(target);
        }
      };
      prune(outputRoot);
    },
    configurePreviewServer(server){
      server.middlewares.use(createGameHandler({root:path.join(root,'dist'),project:root,web:true,base:server.config.base.startsWith('/')?server.config.base:'/'}));
    }
  };
}

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav'};
function createGameHandler({root,project,web=true,base='/'}){
 const compressed=new Map();
 return async(req,res)=>{
 try{
  let url;try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{res.writeHead(400).end();return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  if(web&&pathname.startsWith('/release/'))pathname=pathname.slice(8);
  if(base!=='/'&&pathname.startsWith(base))pathname='/'+pathname.slice(base.length);
  let file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const stat=await fs.promises.stat(file).catch(()=>null);if(!stat?.isFile()){res.writeHead(404).end('Not found');return;}
  const type=types[path.extname(file)]||'application/octet-stream',text=/^(text\/|application\/json)/.test(type),encoding=text&&stat.size<2000000&&/\bbr\b/.test(req.headers['accept-encoding']||'')?'br':text&&stat.size<2000000&&/\bgzip\b/.test(req.headers['accept-encoding']||'')?'gzip':null;
  const etag='"'+stat.size.toString(16)+'-'+Math.trunc(stat.mtimeMs).toString(16)+(encoding?'-'+encoding:'')+'"',immutable=/\.[a-f0-9]{16}\.(webp|mp3|wav|js|css)$/.test(file)||/^[a-f0-9]{16}$/.test(url.searchParams.get('v')||'');
  const headers={'Content-Type':type,'Cache-Control':immutable?'public, max-age=31536000, immutable':'no-cache',ETag:etag,'X-Content-Type-Options':'nosniff'};if(text)headers.Vary='Accept-Encoding';
  if(req.headers['if-none-match']===etag){res.writeHead(304,headers).end();return;}
  if(encoding){
   const key=file+':'+stat.mtimeMs+':'+encoding;let bytes=compressed.get(key);
   if(!bytes){const sidecar=file+(encoding==='br'?'.br':'.gz');bytes=await fs.promises.readFile(sidecar).catch(async()=>{const data=await fs.promises.readFile(file);return encoding==='br'?zlib.brotliCompressSync(data,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:5}}):zlib.gzipSync(data);});if(compressed.size>100)compressed.clear();compressed.set(key,bytes);}
   res.writeHead(200,{...headers,'Content-Encoding':encoding,'Content-Length':bytes.length});res.end(req.method==='HEAD'?undefined:bytes);return;
  }
  let start=0,end=stat.size-1,status=200;headers['Accept-Ranges']='bytes';
  if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match||!match[1]&&!match[2]){res.writeHead(416,{'Content-Range':'bytes */'+stat.size}).end();return;}if(match[1]){start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}else start=Math.max(0,stat.size-Number(match[2]));if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':'bytes */'+stat.size}).end();return;}status=206;headers['Content-Range']='bytes '+start+'-'+end+'/'+stat.size;}
  headers['Content-Length']=end-start+1;res.writeHead(status,headers);if(req.method==='HEAD'){res.end();return;}const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch(error){if(!res.headersSent)res.writeHead(500).end('Preview unavailable');else res.destroy();console.error(error.message);}
 };
};

function validateGameAssets(){
// Build-time atlas integrity gate: missing assets or out-of-bounds frames must
// fail packaging, rather than silently ship a geometric fallback.
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/v8/pack-manifest.json'),'utf8'));
const dimensions={};
for(const [id,asset]of Object.entries(manifest.assets)){
  const data=fs.readFileSync(path.join(root,asset.file));
  if(data.length<33||data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||data.toString('ascii',12,16)!=='IHDR')throw Error('Invalid PNG: '+id);
  dimensions[id]={width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
}
const context=vm.createContext({});
for(const file of ['art-catalog','map-data','realm-dressing-data','signature-data','scene-data','actor-states-data','actor-repair-data','v8-art-data','enemy-marker-data','celestial-art-data','campaign-art-data','audit-art-data','cloud-visual-data','combat-feedback-data','motion-data','enemy-effects-data','combat-identity-data','boss-fx-data'])vm.runInContext(fs.readFileSync(path.join(root,'src',file+'.js'),'utf8'),context);
let count=0;const coverage={};
for(const group of ['ArtFrames','MapFrames','SignatureFrames','SceneFrames','ActorStateFrames','V8Frames','EnemyMarkerFrames','CelestialFrames','CampaignFrames','CloudFrames','CombatFrames','MotionFrames','EnemyEffectFrames','IdentityFrames','BossEffectFrames']){
  coverage[group]=[];
  for(const [id,frame]of Object.entries(context.Kong[group])){
    const image=dimensions[frame.image],[x,y,w,h]=frame.r;
    if(!image||![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>image.width||y+h>image.height)throw Error('Invalid atlas frame '+group+':'+id);
    if(frame.anchor){const [ax,ay]=frame.anchor;if(![ax,ay].every(Number.isFinite)||ax<0||ay<0||ax>w||ay>h)throw Error('Invalid local anchor: '+id);}
    if(frame.a){const [ax,ay]=frame.a;if(![ax,ay].every(Number.isFinite)||ax<x||ay<y||ax>x+w||ay>y+h)throw Error('Invalid source anchor: '+id);}
    coverage[group].push({id,...frame});
    count++;
  }
}
for(const id of ['seal-intact','seal-ruined','seal-lamp-ready','seal-lamp-spent'])if(!context.Kong.SceneFrames[id])throw Error('Missing seal state: '+id);
for(const id of ['wukong-dead','nezha-dead','nezha-ultimate-start','nezha-ultimate-release'])if(!context.Kong.ActorStateFrames[id])throw Error('Missing actor state: '+id);
for(const id of ['erlang-heavy-windup','erlang-heavy-strike','erlang-hurt','nezha-hurt'])if(!context.Kong.ActorStateFrames[id])throw Error('Missing repair pose: '+id);
// A valid atlas may still omit a live state. Check the campaign's required
// actor families, not just whatever happened to be registered in the atlas.
vm.runInContext(fs.readFileSync(path.join(root,'src/campaign-data.js'),'utf8'),context);
const required=(group,id)=>{if(!context.Kong[group][id])throw Error('Missing live art state '+group+':'+id);};
for(const chapter of context.Kong.CAMPAIGN){
  for(let pose=0;pose<4;pose++)required('CampaignFrames',chapter.boss+'-'+pose);
  for(let role=0;role<3;role++)required('CampaignFrames',chapter.id+'-role'+role);
  for(let mini=0;mini<2;mini++)required('CampaignFrames',chapter.id+'-mini'+mini);
  for(let row=0;row<5;row++)for(let pose=0;pose<6;pose++)required('MotionFrames',chapter.id+'-'+row+'-'+pose);
}
for(const hero of ['nezha','erlang']){
  for(let row=0;row<5;row++)for(let pose=0;pose<4;pose++)required('MotionFrames',hero+'-'+row+'-'+pose);
  required('V8Frames',hero+'-7');
}
for(const realm of ['underworld','dragon','heaven'])for(const suffix of ['device','device-broken'])required('CampaignFrames',realm+'-'+suffix);
for(const kind of ['heal','focus','rage'])required('MapFrames','pickup-'+kind);
for(const kind of ['quiet','warning','active'])required('MapFrames','hazard-'+kind);
for(const realm of ['underworld','water','dragon','heaven'])for(const variant of ['a','b'])if(!context.Kong.MapFrames['dressing-'+realm+'-'+variant])throw Error('Missing realm dressing: '+realm+'-'+variant);
console.log('Art integrity:',Object.keys(dimensions).length,'PNG assets;',count,'bounded frames');

for(const name of ['wukong','nezha','erlang'])for(let row=0;row<3;row++)for(let col=0;col<4;col++)required('IdentityFrames',name+'-'+row+'-'+col);
for(const name of ['juling','qinguang','ninehead','dragonking','litian'])for(let row=0;row<3;row++)for(let col=0;col<3;col++)required('IdentityFrames',name+'-'+row+'-'+col);
for(const [file,key] of [['assets/audio-v6/manifest.json','assets'],['assets/music/manifest.json','tracks']]){for(const asset of Object.values(readJSON(file)[key])){if(digest(fs.readFileSync(path.join(root,asset.file)))!==asset.sha256)throw Error('Audio source hash changed: '+asset.file);}}
}


export default defineConfig(({mode})=>{
  const offline=mode==='offline';
  return {
    base:'./',publicDir:false,
    plugins:[gameDistribution(offline)],
    // The browser code has no npm imports. Never crawl retained giant HTML
    // releases or generated base64 catalogues during dependency discovery.
    optimizeDeps:{entries:['index.html'],noDiscovery:true},
    server:{host:'127.0.0.1',port:5173,strictPort:true},
    preview:{host:'127.0.0.1',port:4173,strictPort:true},
    build:{
      outDir:offline?'dist-offline':'dist',
      // The plugin atomically writes current assets, then removes stale files
      // only inside these two dedicated output directories.
      emptyOutDir:false,write:false,assetsInlineLimit:0,modulePreload:false,cssCodeSplit:false,
      target:'es2022',minify:true,sourcemap:false,manifest:false,reportCompressedSize:false,
      chunkSizeWarningLimit:offline?640:512,
      rolldownOptions:{output:{
        format:offline?'iife':'es',
        ...(offline?{codeSplitting:false}:{}),
        hashCharacters:'hex',entryFileNames:'game.[hash:16].js',assetFileNames:'assets/[name].[hash:16][extname]'
      }}
    }
  };
});
