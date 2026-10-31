const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const out=path.resolve(process.env.ART_AUDIT_DIR||'evidence/art-audit-20261030');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const read=f=>fs.existsSync(path.join(out,f))?JSON.parse(fs.readFileSync(path.join(out,f),'utf8')):null;
async function sheet(title,frames,prefix,file){
 const cells=[];for(let i=0;i<frames.length;i++){
  const f=frames[i],x=i%2*480,y=Math.floor(i/2)*298;
  cells.push({input:await sharp(path.join(out,prefix,f.file)).resize(480,270).png().toBuffer(),left:x,top:y+28});
  cells.push({input:Buffer.from('<svg width="480" height="28"><rect width="480" height="28" fill="#171d2b"/><text x="10" y="19" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#eee">'+esc(title+' · '+(f.label||f.id))+'</text></svg>'),left:x,top:y});
 }
 await sharp({create:{width:960,height:Math.ceil(frames.length/2)*298,channels:4,background:'#10131c'}}).composite(cells).png().toFile(path.join(out,'sheets',file));
}
(async()=>{
 fs.mkdirSync(path.join(out,'sheets'),{recursive:true});const skills=read('skills/capture.json'),maps=read('maps/capture.json'),sections=[];
 if(skills)for(const c of skills.cases){const file=c.id+'.png';await sheet(c.title,c.frames,'skills',file);sections.push({group:c.kind==='enemy'?'怪物 / Boss 技能':c.hero,title:c.title,id:c.id,sheet:'sheets/'+file,missing:c.missing,frames:c.frames.map(f=>({label:f.label,file:'skills/'+f.file}))});}
 if(maps)for(const m of maps.maps){const selected=m.frames.filter(f=>['route-0','route-1','route-2','boss'].includes(f.id)),file='map-'+m.stage+'.png';await sheet((m.stage+1)+' · '+m.title,selected,'maps',file);sections.push({group:'五章地图',title:(m.stage+1)+' · '+m.title,id:'map-'+m.stage,sheet:'sheets/'+file,frames:m.frames.map(f=>({label:f.label||f.id,file:'maps/'+f.file}))});if(m.frames.some(f=>f.id.startsWith('hazard-'))){const f2='map-'+m.stage+'-hazards.png';await sheet(m.title,m.frames.filter(f=>f.id.startsWith('hazard-')),'maps',f2);}}
 const ui=read('ui/capture.json');
 if(ui){
  for(const stage of [0,3,6,9,12]){const frames=ui.details.filter(f=>f.file.startsWith('army-'+stage+'-')),file='army-'+stage+'.png';await sheet('普通怪 · 第 '+(stage+1)+' 关',frames,'details',file);sections.push({group:'各章普通怪补充',title:'普通怪 · 第 '+(stage+1)+' 关',id:'army-'+stage,sheet:'sheets/'+file,frames:frames.map(f=>({...f,file:'details/'+f.file}))});}
  for(const stage of [2,5,8,11,14]){const frames=ui.details.filter(f=>f.file.startsWith('pose-'+stage+'-')),file='pose-'+stage+'.png';await sheet('同脚底位置 · 左待机 / 右前摇',frames,'details',file);sections.push({group:'Boss 贴图切换对照',title:frames[0].label.replace(' · idle',''),id:'pose-'+stage,sheet:'sheets/'+file,frames:frames.map(f=>({...f,file:'details/'+f.file}))});}
  const frames=ui.details.filter(f=>f.file.startsWith('mid-')),file='projectiles.png';await sheet('释放后 150ms',frames,'details',file);sections.push({group:'飞行物补充',title:'毒扇 / 火轮 / 毒潮',id:'projectiles',sheet:'sheets/'+file,frames:frames.map(f=>({...f,file:'details/'+f.file}))});
 }
 const intro='<h1>劫火重燃 · 美术截图审查</h1><p>2026-10-30 · Vite 当前生产构建 · 12.4.1。技能为导入受控场景后真实按键与正常模拟截帧；地图为生产渲染器固定场景。并非十五关自然通关。点击原图查看 960×540 未加工截图；汇总图仅缩放和加标题。透明底的贴图对照仅用于检验脚底与体型，不代表游戏背景。</p><p><a href="report.md">查看审查结论</a> · <a href="identity.json">构建身份</a> · <a href="skills/capture.json">技能阶段与缺帧记录</a> · <a href="maps/capture.json">地图采集记录</a> · <a href="skills/skills.webm">技能连续录像</a></p>';
 let last='',body='';for(const s of sections){if(s.group!==last){body+='<h2>'+esc(s.group)+'</h2>';last=s.group;}body+='<article id="'+esc(s.id)+'"><h3>'+esc(s.title)+'</h3><img loading="lazy" src="'+s.sheet+'" alt="'+esc(s.title)+'"/><p>'+s.frames.map(f=>'<a href="'+f.file+'">'+esc(f.label)+'</a>').join(' · ')+'</p>'+(s.missing?.length?'<p class="missing">缺少阶段：'+s.missing.map(esc).join('、')+'</p>':'')+'</article>';}
 if(ui){body+='<h2>完整游戏界面</h2>';for(const f of ui.frames)body+='<article><h3>'+esc(f.label)+'</h3><a href="ui/'+f.file+'"><img loading="lazy" src="ui/'+f.file+'"/></a></article>';}
 fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>美术截图审查</title><style>body{max-width:1050px;margin:32px auto;padding:0 20px;background:#10131c;color:#e2e6ed;font:16px/1.7 system-ui}a{color:#f6ca83}h2{margin-top:56px;border-top:1px solid #3d4151;padding-top:24px}article{margin:28px 0 42px}img{max-width:100%;height:auto}p{color:#bec6d5}.missing{color:#ffb59e}</style>'+intro+body+'</html>');
 console.log(JSON.stringify({sections:sections.length,skillCases:skills?.cases.length,maps:maps?.maps.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
