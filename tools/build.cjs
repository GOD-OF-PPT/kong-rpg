const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
require('./pack-art.cjs');
const root=path.resolve(__dirname,'..');const out=path.join(root,'release');fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="src/style.css">',()=>'<style>'+fs.readFileSync(path.join(root,'src/style.css'),'utf8')+'</style>');
html=html.replace(/<script src="(src\/[^" ]+)"><\/script>/g,(_,file)=>'<script>\n'+fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
if(/(?:src|href)="(?:https?:|src\/)/.test(html))throw new Error('Release still has an external dependency');
const stagedHtml=path.join(out,'.index-build-'+process.pid+'.html');fs.writeFileSync(stagedHtml,html);fs.renameSync(stagedHtml,path.join(out,'index.html'));
fs.writeFileSync(path.join(out,'README.md'),'# 大圣 · 劫后行 v1.2 — ImageGen美术设计版\n\n双击index.html，PC Edge/Chrome，无需安装或网络。\n\nA/D走，空格跳，S+空格下穿，J/左键棍法，空中S+J下劈，K/Shift闪避，L/右键分身，E过门，Esc暂停。\n\n新开局：连续轻棍不会冻结普通敌人的举刀预警，跳避或用第三棍打断。友方分身染青。旧进行中存档保留原战斗规则；新版导出新档为schema2，原版不支持导入新版存档。\n\n暂停菜单可导出/导入JSON。HTTP与双击入口各自自动保存，自动存储被禁用时仍可导出。\n\n本轮ImageGen设计、提示词与验收在docs/art-v1；docs/readability保留上一轮玩法记录，docs/v1为历史材料。真人试玩、原剧逐帧资料与真人试听未取得。不宣称游戏完整开发已完成。\n');
fs.mkdirSync(path.join(out,'docs/v1'),{recursive:true});for(const name of ['DESIGN.md','RESEARCH.md','VERIFICATION.md']){if(fs.existsSync(path.join(root,'docs',name)))fs.copyFileSync(path.join(root,'docs',name),path.join(out,'docs/v1',name));const stale=path.join(out,'docs',name);if(fs.existsSync(stale))fs.unlinkSync(stale);}
fs.mkdirSync(path.join(out,'docs/readability'),{recursive:true});for(const name of fs.readdirSync(path.join(root,'docs/readability')).filter(x=>x.endsWith('.md')))fs.copyFileSync(path.join(root,'docs/readability',name),path.join(out,'docs/readability',name));
fs.mkdirSync(path.join(out,'docs/art-v1'),{recursive:true});for(const name of fs.readdirSync(path.join(root,'docs/art-v1')).filter(x=>x.endsWith('.md')))fs.copyFileSync(path.join(root,'docs/art-v1',name),path.join(out,'docs/art-v1',name));
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,entry:'index.html',sha256:crypto.createHash('sha256').update(html).digest('hex'),bytes:Buffer.byteLength(html),runtimeDependencies:[]},null,2));
console.log('Standalone release:',Buffer.byteLength(html),'bytes');
