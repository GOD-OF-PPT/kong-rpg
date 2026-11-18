import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {version as viteVersion} from 'vite';
import createGameHandler from './static-game.cjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
const readJSON=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
export const bootImages=['brandWordmark','mountain','wukong','stone'];
const virtualId='virtual:kong-media',resolvedId='\0'+virtualId;

// Only the small URL catalogue is imported by the game. Image and music bytes
// are emitted as separate assets and remain behind the production staged loader.
async function mediaAssets(offline,dev){
  const art=readJSON('assets/v8/pack-manifest.json').assets;
  const audio=readJSON('assets/audio-v6/manifest.json').assets;
  const tracks=readJSON('assets/music/manifest.json').tracks;
  const output=path.join(root,offline?'dist-offline':'dist');
  const assets=new Map(),images={},imageURLs={},samples={},music={},files={};
  const emit=(file,data)=>{assets.set(file,Buffer.isBuffer(data)?data:Buffer.from(data));return file;};
  let previous={},webCache={};
  try{previous=JSON.parse(fs.readFileSync(path.join(output,'manifest.json'),'utf8')).images||{};}catch{}
  // Reuse verified encodes from the preceding distribution during migration.
  if(!Object.keys(previous).length)try{previous=readJSON(offline?'release/manifest.json':'release/web/manifest.json').images||{};}catch{}
  const previousRoot=fs.existsSync(path.join(output,'manifest.json'))?output:path.join(root,offline?'release':'release/web');
  const webRoot=fs.existsSync(path.join(root,'dist/manifest.json'))?path.join(root,'dist'):path.join(root,'release/web');
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
  const code=`const K=(globalThis.Kong ||= {}),base=document.baseURI;K.LegacyEntries=${JSON.stringify(dev?Array.from({length:11},(_,i)=>'legacy-v'+(i+1)+'.html'):[])};K.ArtDelivery=${JSON.stringify(offline?'offline':'network')};`+urls('ArtSources',imageURLs)+(offline?'K.ImpactSamples='+JSON.stringify(samples)+';':urls('ImpactSamples',samples))+urls('MusicTracks',music);
  return {assets,images,imageURLs,files,code};
}

export function gameDistribution(offline){
  let media,dev=false,generated,outputRoot;
  return {
    name:'kong-game-distribution',enforce:'post',
    configResolved(config){dev=config.command==='serve';outputRoot=path.resolve(config.root,config.build.outDir);},
    async buildStart(){
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
