const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('./pack-art.cjs');
require('./validate-art.cjs');
require('./pack-audio.cjs');
require('./pack-music.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'release');fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<head>','<head><meta name="kong-package" content="standalone">');
html=html.replace(/<link rel="stylesheet" href="(src\/[^"]+)">/g,(_,file)=>'<style>'+fs.readFileSync(path.join(root,file),'utf8')+'</style>');
html=html.replace(/<script src="(src\/[^" ]+)"><\/script>/g,(_,file)=>'<script>\n'+fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
if(/(?:src|href)="(?:https?:|src\/)/.test(html))throw new Error('Release still has an external dependency');
// Match the repository's LF policy so Git checkout preserves the manifest hash.
html=html.replace(/\r\n?/g,'\n');
const temp=path.join(out,'.index-build-'+process.pid+'.html');fs.writeFileSync(temp,html);
// Windows readers/AV can briefly hold a file handle during the atomic replace.
for(let attempt=0;;attempt++){try{fs.renameSync(temp,path.join(out,'index.html'));break;}catch(error){if(attempt>=20||!['EPERM','EACCES','EBUSY'].includes(error.code))throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}}
fs.copyFileSync(path.join(root,'README.md'),path.join(out,'README.md'));
for(const folder of ['art-v1','readability','complete-v2','dialog-ui','combat-v3','progression-v4','journey-v5','ranged-v6','audio-v6','map-v6','flow-v6','signature-v7','ux-v7','challenge-v7','scene-v7','art-audit-v7','music-v7','v8','enemy-markers','celestial-v9','campaign-v10','audit-v10','heroes-v10','art-completeness-v10','cloud-visual-v10','combat-v11','feel-v12','enemy-vfx-v12','art-recheck-v12','mechanics-recheck-v12','skill-visual-v12','map-visual-v12','combat-identities','brand-rekindled']){fs.mkdirSync(path.join(out,'docs',folder),{recursive:true});for(const file of fs.readdirSync(path.join(root,'docs',folder)).filter(x=>x.endsWith('.md')||['feel-v12','enemy-vfx-v12','combat-identities','brand-rekindled'].includes(folder)&&x.endsWith('.json')))fs.copyFileSync(path.join(root,'docs',folder,file),path.join(out,'docs',folder,file));}
if(!fs.existsSync(path.join(out,'legacy-v9.html')))throw new Error('Preserved v9 entry missing');
if(!fs.existsSync(path.join(out,'legacy-v10.html')))throw new Error('Preserved v10 entry missing');
if(!fs.existsSync(path.join(out,'legacy-v8.html')))throw new Error('Preserved v8 entry missing');
if(!fs.existsSync(path.join(out,'legacy-v6.html')))throw new Error('Preserved v6 entry missing');
if(!fs.existsSync(path.join(out,'legacy-v2.html')))throw new Error('Preserved v2.1 entry is missing');
if(!fs.existsSync(path.join(out,'legacy-v5.html')))throw new Error('Preserved v5 entry is missing');
if(!fs.existsSync(path.join(out,'legacy-v4.html')))throw new Error('Preserved v4 entry is missing');
if(!fs.existsSync(path.join(out,'legacy-v3.html')))throw new Error('Preserved v3.0.2 entry is missing');
if(!fs.existsSync(path.join(out,'legacy-v1.html')))throw new Error('Preserved v1.2 entry is missing');
const manifest=JSON.stringify({version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,entry:'index.html',sha256:crypto.createHash('sha256').update(html).digest('hex'),bytes:Buffer.byteLength(html),runtimeDependencies:[],legacyEntry:'legacy-v11.html',legacyEntries:['legacy-v1.html','legacy-v2.html','legacy-v3.html','legacy-v4.html','legacy-v5.html','legacy-v6.html','legacy-v7.html','legacy-v8.html','legacy-v9.html','legacy-v10.html','legacy-v11.html']},null,2);
const manifestTemp=path.join(out,'.manifest-build-'+process.pid+'.json');fs.writeFileSync(manifestTemp,manifest);
for(let attempt=0;;attempt++){try{fs.renameSync(manifestTemp,path.join(out,'manifest.json'));break;}catch(error){if(attempt>=20||!['EPERM','EACCES','EBUSY','UNKNOWN'].includes(error.code))throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}}
console.log('Standalone release:',Buffer.byteLength(html),'bytes');
