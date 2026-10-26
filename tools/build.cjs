const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('./pack-art.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'release');fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<head>','<head><meta name="kong-package" content="standalone">');
html=html.replace(/<link rel="stylesheet" href="(src\/[^"]+)">/g,(_,file)=>'<style>'+fs.readFileSync(path.join(root,file),'utf8')+'</style>');
html=html.replace(/<script src="(src\/[^" ]+)"><\/script>/g,(_,file)=>'<script>\n'+fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
if(/(?:src|href)="(?:https?:|src\/)/.test(html))throw new Error('Release still has an external dependency');
const temp=path.join(out,'.index-build-'+process.pid+'.html');fs.writeFileSync(temp,html);
// Windows readers/AV can briefly hold a file handle during the atomic replace.
for(let attempt=0;;attempt++){try{fs.renameSync(temp,path.join(out,'index.html'));break;}catch(error){if(attempt>=20||!['EPERM','EACCES','EBUSY'].includes(error.code))throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}}
fs.copyFileSync(path.join(root,'README.md'),path.join(out,'README.md'));
for(const folder of ['art-v1','readability','complete-v2','dialog-ui']){fs.mkdirSync(path.join(out,'docs',folder),{recursive:true});for(const file of fs.readdirSync(path.join(root,'docs',folder)).filter(x=>x.endsWith('.md')))fs.copyFileSync(path.join(root,'docs',folder,file),path.join(out,'docs',folder,file));}
if(!fs.existsSync(path.join(out,'legacy-v1.html')))throw new Error('Preserved v1.2 entry is missing');
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,entry:'index.html',sha256:crypto.createHash('sha256').update(html).digest('hex'),bytes:Buffer.byteLength(html),runtimeDependencies:[],legacyEntry:'legacy-v1.html'},null,2));
console.log('Standalone release:',Buffer.byteLength(html),'bytes');
