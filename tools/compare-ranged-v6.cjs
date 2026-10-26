const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');const root=path.resolve(__dirname,'..'),rows=[];
for(const counters of [false,true])for(const relic of ['cloud','staff'])for(const policy of ['stand-and-throw','observe-and-reposition']){
 const ctx=vm.createContext({console});for(const f of ['content','world','progression','journey','heroes','simulation','storage'])vm.runInContext(fs.readFileSync(path.join(root,'src',f+'.js'),'utf8'),ctx);const K=ctx.Kong;if(!counters)K.stepCounter=()=>false;
 const s=K.newRun('V6-RANGE-COMPARE',relic,'nezha');s.room.enemies.forEach(e=>e.hp=0);const shield=s.room.enemies.find(e=>e.kind==='shield'),caster=s.room.enemies.find(e=>e.kind==='caster');
 Object.assign(shield,{x:1270,origin:1270,y:400,baseY:400,hp:60,phase:'idle',timer:0});Object.assign(caster,{x:1560,origin:1560,y:327,baseY:327,hp:38,phase:'idle',timer:0,attacks:1});Object.assign(s.player,{x:1030,y:396,grounded:true,face:1,focus:80,invuln:0});s.room.seals.forEach(q=>q.hp=0);s.room.hazards=[];s.room.node=null;s.room.trial=null;s.room.camp=null;s.room.signs=[];let jumpUntil=0,lastJump=-1,lastSkill=-10;
 for(let i=0;i<120*12&&s.mode==='playing'&&(shield.hp>0||caster.hp>0);i++){
  const p=s.player,e=shield.hp>0?shield:caster,a={attack:true,aimPoint:{x:e.x+e.w/2,y:e.y+e.h/2}};
  if(policy==='observe-and-reposition'){
   let target=e.x-75;const marks=s.room.enemies.filter(e=>e.phase==='cross-windup').flatMap(e=>e.marks||[]).concat(s.dangers);
   if(marks.some(b=>K.overlap(p,b)))target=p.x+110;
   a.left=p.x>target+8;a.right=p.x<target-8;
   if(p.grounded&&s.time-lastJump>.8&&Math.abs(e.x-p.x)<120){a.jumpPressed=true;jumpUntil=s.time+.58;lastJump=s.time;}
   a.jump=s.time<jumpUntil;
   if(Math.abs(e.x-p.x)<175&&p.focus>=40&&!s.silk&&s.time-lastSkill>2){a.clonePressed=true;lastSkill=s.time;}
  }
  K.step(s,a);
 }
 rows.push({counters,relic,policy,damage:s.damageTaken,remainingHp:s.player.hp,enemyHp:[shield.hp,caster.hp],focusSpent:s.stats.focusSpent,farHits:s.stats.farHits,seconds:+s.elapsed.toFixed(3),events:s.log.filter(e=>['hurt','warning','ring-throw','ring-turn','kill','silk'].includes(e.type))});
}
const report={version:'6.0.0',sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'release/index.html'))).digest('hex'),seed:'V6-RANGE-COMPARE',method:'12-second VM shield+caster encounter on one existing ground span. Only two enemies enabled, fixed positions and resources. Counter ablation overrides stepCounter in an isolated VM, never in the shipped rules. Automated policies, not human evidence.',rows};fs.writeFileSync(path.join(root,'evidence/ranged-v6/comparison.json'),JSON.stringify(report,null,2));console.log(rows.map(({events,...x})=>x));
