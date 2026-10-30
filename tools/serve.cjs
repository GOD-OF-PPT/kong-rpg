const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const project=path.resolve(__dirname,'..'),lan=process.argv.includes('--lan'),web=lan||process.argv.includes('--web');
const root=path.join(project,web?'release/web':''),port=Number(process.env.PORT||5188),host=process.env.HOST||(lan?'0.0.0.0':'127.0.0.1'),compressed=new Map();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav'};
http.createServer(async(req,res)=>{
 try{
  let url;try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{res.writeHead(400).end();return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  if(web&&pathname.startsWith('/release/'))pathname=pathname.slice(8);
  let file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(web&&/^\/legacy-v(?:[1-9]|10|11)\.html$/.test(pathname))file=path.join(project,'release',pathname.slice(1));
  else if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
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
}).listen(port,host,()=>console.log((web?'Web game':'Source preview')+' http://'+host+':'+port+' root='+root));
