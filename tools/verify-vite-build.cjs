const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const report={checks:[],artifacts:[]},out=path.join(root,'evidence/vite/build-verification.json');
function check(name,pass){assert.ok(pass,name);report.checks.push(name);}
for(const dir of ['dist',...(process.argv.includes('--offline')?['dist-offline']:[])]){
  const read=file=>fs.readFileSync(path.join(root,dir,file));
  const manifest=JSON.parse(read('manifest.json')),html=read('index.html').toString();
  check(dir+' is produced by Vite',manifest.buildTool.name==='vite');
  check(dir+' entry matches its digest',hash(Buffer.from(html))===manifest.sha256&&Buffer.byteLength(html)===manifest.bytes);
  for(const [file,record]of [...Object.entries(manifest.files),...Object.values(manifest.images).map(record=>[record.file,record])])check(dir+'/'+file+' matches its digest',hash(read(file))===record.sha256&&read(file).length===record.bytes);
  const walk=base=>fs.readdirSync(path.join(root,dir,base),{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(path.posix.join(base,item.name)):[path.posix.join(base,item.name)]);
  const contents=walk('');
  check(dir+' contains only the game HTML entry',contents.filter(file=>file.endsWith('.html')).join(',')==='index.html');
  check(dir+' excludes documentation and archives',!contents.some(file=>file.startsWith('docs/')||file.endsWith('.md')||file.endsWith('.zip')));
  const expected=new Set(['index.html','manifest.json',...Object.keys(manifest.files),...Object.values(manifest.images).map(image=>image.file)]);
  if(dir==='dist')for(const file of [manifest.script,manifest.style]){expected.add(file+'.br');expected.add(file+'.gz');}
  check(dir+' contains no stale hashes or unrelated files',contents.every(file=>expected.has(file))&&contents.length===expected.size);
  if(dir==='dist-offline'){
    check('offline entry is deferred classic JavaScript',!html.includes('type="module"')&&/<script defer src="\.\//.test(html));
  }else{
    check('all 82 images including boss effects, HUD frame and results background are independent WebP files',Object.values(manifest.images).length===82&&manifest.images.bossFX&&manifest.images.bossHud&&manifest.images.settlementBackdrop&&Object.values(manifest.images).every(image=>image.file.endsWith('.webp')));
    check('all 8 sound effects are independent WAV files',Object.keys(manifest.files).filter(file=>file.endsWith('.wav')).length===8);
    check('all 3 music tracks are independent MP3 files',Object.keys(manifest.files).filter(file=>file.endsWith('.mp3')).length===3);
    check('web entry preloads exactly four images',(html.match(/rel="preload" as="image"/g)||[]).length===4);
    for(const file of [manifest.script,manifest.style]){
      check(file+' Brotli content matches original',zlib.brotliDecompressSync(read(file+'.br')).equals(read(file)));
      check(file+' gzip content matches original',zlib.gunzipSync(read(file+'.gz')).equals(read(file)));
    }
  }
  report.artifacts.push({dir,sha256:manifest.sha256,script:manifest.script,scriptBytes:manifest.files[manifest.script].bytes,images:Object.keys(manifest.images).length});
}
const get=(base,file,headers={})=>new Promise((resolve,reject)=>http.get(new URL(file,base),{headers},response=>{
  const parts=[];response.on('data',part=>parts.push(part));response.on('end',()=>resolve({status:response.statusCode,headers:response.headers,body:Buffer.concat(parts)}));response.on('error',reject);
}).on('error',reject));
(async()=>{
  let server;
  try{
    server=await(await import('vite')).preview({base:'/smoke/',preview:{host:'127.0.0.1',port:0,strictPort:true}});
    const base='http://127.0.0.1:'+server.httpServer.address().port+'/smoke/',m=JSON.parse(fs.readFileSync(path.join(root,'dist/manifest.json'),'utf8'));
    const html=await get(base,'');check('preview serves a nested deployment path',html.status===200&&html.body.toString().includes(m.script));
    const js=await get(base,m.script,{'Accept-Encoding':'br,gzip'});
    check('preview serves precompressed Brotli JavaScript',js.status===200&&js.headers['content-encoding']==='br'&&hash(zlib.brotliDecompressSync(js.body))===m.files[m.script].sha256);
    check('hashed JavaScript is immutable',js.headers['cache-control'].includes('immutable'));
    const image=await get(base,m.images.mountain.file);
    check('hashed images are immutable and use an image MIME',image.headers['cache-control'].includes('immutable')&&image.headers['content-type']==='image/webp');
    check('cached image revalidates with 304',(await get(base,m.images.mountain.file,{'If-None-Match':image.headers.etag})).status===304);
    const music=Object.keys(m.files).find(file=>file.endsWith('.mp3')),range=await get(base,music,{Range:'bytes=0-1023'});
    check('music byte ranges still work',range.status===206&&range.body.length===1024);
    check('preview does not silently serve excluded legacy HTML',(await get(base,'legacy-v11.html')).status===404);
    report.pass=true;
  }catch(e){report.failure=e.stack;process.exitCode=1;}
  finally{await server?.close();fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,artifacts:report.artifacts,failure:report.failure}));}
})();
