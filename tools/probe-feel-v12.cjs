const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),c=vm.createContext({console});
for(const n of ['content','world','progression','journey','heroes','signature','simulation','challenge','realms','warriors','celestial','campaign-data','route-layouts','campaign-world','campaign-combat','campaign-state','storage'])vm.runInContext(fs.readFileSync(path.join(root,'src',n+'.js'),'utf8'),c);
const K=c.Kong,checks=[];
function scene(){const s=K.newRun('FEEL-V12','staff','wukong');s.room.enemies.forEach(e=>e.hp=0);Object.assign(s.player,{x:100,y:396,grounded:true,invuln:0});return s;}
function tick(s,n,a={}){for(let i=0;i<n;i++)K.step(s,i?{}:a);}
let s=scene();K.step(s,{attack:true,attackPressed:true});tick(s,12);K.step(s,{attack:true,attackPressed:true});tick(s,60);checks.push({name:'two intentional taps 108ms apart produce two swings',pass:s.stats.swings===2,actual:s.stats.swings});
s=scene();K.step(s,{attack:true,attackPressed:true});tick(s,7);const before=K.attackBox(s);K.step(s,{left:true});const after=K.attackBox(s);checks.push({name:'movement does not reverse an already active strike',pass:after.x>s.player.x,data:{before,after,face:s.player.face}});
s=scene();K.damage(s,12,'probe');K.step(s,{attack:true,attackPressed:true});checks.push({name:'hurt reaction cannot hide a newly damaging main attack',pass:s.player.attack===0,data:{hurt:s.player.hurt,attack:s.player.attack}});
const profiles=[0,3,6,9,12].map(stage=>{const r=K.makeRoom('FEEL-V12',stage);return{stage,profile:{floors:r.platforms.filter(p=>p.solid).length,shelves:r.platforms.filter(p=>!p.solid).length,rows:[...new Set(r.platforms.filter(p=>!p.solid).map(p=>Math.round(p.y/80)))].sort()}};});
checks.push({name:'five first-region routes have at least four structural profiles',pass:new Set(profiles.map(p=>JSON.stringify(p.profile))).size>=4,data:profiles});
const out=path.resolve(process.env.FEEL_EVIDENCE_DIR||'evidence/feel-v12/before');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify({version:K.VERSION,checks},null,2));console.log(JSON.stringify(checks,null,2));if(checks.some(x=>!x.pass))process.exitCode=1;
