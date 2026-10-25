const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');const out=path.join(root,'release');fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<link rel="stylesheet" href="(src\/[^" ]+)">/g,(_,file)=>'<style>'+fs.readFileSync(path.join(root,file),'utf8')+'</style>');
html=html.replace(/<script src="(src\/[^" ]+)"><\/script>/g,(_,file)=>'<script>\n'+fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
if(/(?:src|href)="(?:https?:|src\/)/.test(html))throw new Error('Release still has an external dependency');
fs.writeFileSync(path.join(out,'index.html'),html);
fs.copyFileSync(path.join(root,'docs/v2/PLAYER.md'),path.join(out,'README.md'));
fs.mkdirSync(path.join(out,'docs/v1'),{recursive:true});for(const name of ['DESIGN.md','RESEARCH.md','VERIFICATION.md']){if(fs.existsSync(path.join(root,'docs',name)))fs.copyFileSync(path.join(root,'docs',name),path.join(out,'docs/v1',name));const stale=path.join(out,'docs',name);if(fs.existsSync(stale))fs.unlinkSync(stale);}
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version,entry:'index.html',sha256:crypto.createHash('sha256').update(html).digest('hex'),bytes:Buffer.byteLength(html),runtimeDependencies:[]},null,2));
const legacyPath=path.join(out,'legacy-v1.html');const legacy=fs.existsSync(legacyPath)?fs.readFileSync(legacyPath):require('node:child_process').execFileSync('git',['show','e5dc0b5:release/index.html'],{cwd:root});if(crypto.createHash('sha256').update(legacy).digest('hex')!=='cfde27c846bd1856e2ad1273d2c910000ddb0ec24ccf7c46dc2393fa854cbd65')throw new Error('Legacy v1 source changed');fs.writeFileSync(legacyPath,legacy);
fs.mkdirSync(path.join(out,'docs/v2'),{recursive:true});for(const name of fs.readdirSync(path.join(root,'docs/v2')).filter(x=>x.endsWith('.md')))fs.copyFileSync(path.join(root,'docs/v2',name),path.join(out,'docs/v2',name));
console.log('Standalone release:',Buffer.byteLength(html),'bytes');
