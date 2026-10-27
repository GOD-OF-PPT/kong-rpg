// Reachable-state save audit; fixed seeds and production simulation, no rule mocks.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.resolve(process.env.EVIDENCE_DIR||path.join(root,'evidence/signature-v7')),ctx=vm.createContext({console});fs.mkdirSync(dir,{recursive:true});
for(const name of ['content','world','progression','journey','heroes','signature','simulation','storage'])vm.runInContext(fs.readFileSync(path.join(root,'src',name+'.js'),'utf8'),ctx);
const K=ctx.Kong,report={version:K.VERSION,method:'fixed-seed inputs into production K.step; check every sampled reachable save through production pack/validSave',steps:0,saves:0,cases:[],failures:[]};
function saveCheck(s,where){report.saves++;try{const r=K.validSave(JSON.parse(K.pack(s,{}))).state;assert.equal(r.hero,s.hero);assert.equal(r.player.hp,s.player.hp);assert.equal(r.stage,s.stage);assert.equal(r.world.rescue,s.world.rescue);assert.equal(r.stats.drops,s.stats.drops);}catch(e){if(report.failures.length<16){report.failures.push({where,seed:s.seed,hero:s.hero,stage:s.stage,error:e.message,player:s.player,log:s.log.slice(-8)});fs.writeFileSync(path.join(dir,'invalid-state-'+report.failures.length+'.json'),K.pack(s,{}));}}}
for(const hero of ['wukong','nezha'])for(let stage=0;stage<4;stage++)for(let index=0;index<6;index++){
  const s=K.newRun('FLOW-STATE-'+index,['cloud','staff','echo'][index%3],hero);K.enterRoom(s,stage,true);const rng=K.rng(731+index+stage*977);let actions={};
  // Three legitimate starts: spawn, canonical first seal, or canonical arena.
  if(index>=2&&index<4){const q=s.room.seals[0];Object.assign(s.player,{x:q.x-90,y:q.y-24,grounded:false});}
  if(index>=4){const a=s.room.arena;Object.assign(s.player,{x:a.enter+24,y:396});if(stage===3)s.room.seals.forEach(q=>q.hp=0);}
  if(index%2){s.growth={'staff-wave':1,'dash-strike':1,'clone-burst':1,'ultimate-echo':1};s.talisman={id:'thunder',charges:3};}
  saveCheck(s,'start');
  for(let i=0;i<3600&&s.mode==='playing';i++){
    if(i%36===0){const move=rng();actions={right:move>.16,left:move<.09,attack:rng()>.15,jump:rng()>.38,down:rng()<.1};}
    K.step(s,{...actions,signature:i%190<75,signaturePressed:i%190===0,jumpPressed:i%75===0,dashPressed:i%160===0,clonePressed:i%290===0,ultimatePressed:i%200===0,talismanPressed:i%310===0,interactPressed:i%127===0});report.steps++;
    if(i%30===0||s.mode!=='playing'||s.events.some(e=>['reward','drop','platform-break','guardian-enter','ultimate'].includes(e.type)))saveCheck(s,'step '+i);
    if(s.mode==='reward'){const id=s.reward.find(q=>q!=='rest')||'rest';K.choose(s,id,s.relics[0]);saveCheck(s,'after reward '+id);}
  }
  report.cases.push({hero,stage,index,mode:s.mode,time:s.time,hp:s.player.hp});
}
fs.writeFileSync(path.join(dir,'state-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({steps:report.steps,saves:report.saves,cases:report.cases.length,failures:report.failures},null,2));if(report.failures.length)process.exitCode=1;
