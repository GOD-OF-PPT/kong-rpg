// Capture current Vite output. Controlled review fixtures are not a playthrough.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,process.env.ART_AUDIT_DIR||'evidence/art-audit-20261030');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
async function run(script,env={}){await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(root,'tools',script)],{cwd:root,env:{...process.env,...env},stdio:'inherit',windowsHide:true});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(script+' exited '+code)));});}
(async()=>{
 fs.mkdirSync(out,{recursive:true});let server;
 try{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'dist/manifest.json'),'utf8'));
  const files=['index.html','manifest.json',...Object.keys(manifest.files).filter(f=>/\.(js|css)$/.test(f))];
  const identity={at:new Date().toISOString(),entry:'dist/index.html',version:manifest.version,files:files.map(file=>({file,sha256:hash(path.join(root,'dist',file))})),method:'Fresh Vite production preview; real skill inputs plus explicitly controlled map scenes. No asset or game code substitution.'};
  fs.writeFileSync(path.join(out,'identity.json'),JSON.stringify(identity,null,2)+'\n');
  server=await(await import('vite')).preview({preview:{host:'127.0.0.1',port:0,strictPort:true}});
  const url='http://127.0.0.1:'+server.httpServer.address().port+'/';
  await run('capture-skill-review.cjs',{GAME_ENTRY:'dist/index.html',SKILL_REVIEW_URL:url,SKILL_REVIEW_DIR:path.join(out,'skills')});
  await run('capture-map-review.cjs',{GAME_ENTRY:'dist/index.html',MAP_REVIEW_URL:url,MAP_REVIEW_DIR:path.join(out,'maps')});
 }finally{await server?.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
