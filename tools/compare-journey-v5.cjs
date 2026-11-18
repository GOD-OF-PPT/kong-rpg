const vm=require('vm'),fs=require('fs'),path=require('path'),crypto=require('crypto');const c=vm.createContext({console});for(const f of ['content','world','progression','journey','simulation','storage'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',f+'.js'),'utf8'),c);const K=c.Kong,rows=[];
for(const relic of ['staff','echo'])for(const distance of [50,65,80])for(const policy of ['hold-attack','observe-warning']){
 const s=K.newRun('V5-COMBAT-COMPARE',relic),e=s.room.enemies.find(e=>e.id===400);s.room.enemies=[e];s.room.seals=[];s.room.hazards=[];s.room.signs=[];s.room.node=null;s.room.trial=null;s.room.camp=null;
 Object.assign(s.player,{x:e.x-distance,y:396,face:1,grounded:true,invuln:0});
 for(let i=0;i<960&&e.hp>0;i++){
  let a={attack:true};if(policy==='observe-warning'){
   const near=Math.abs(e.x-s.player.x),warn=e.phase.endsWith('windup')&&e.timer<.23;
   a={attack:true,left:s.player.x>e.x+32,right:s.player.x<e.x-40,dashPressed:warn&&near<110&&s.player.dashCD===0,clonePressed:relic==='echo'&&!s.clone&&s.player.focus>=50};
  }
  K.step(s,a);
 }
 rows.push({relic,distance,policy,damage:s.damageTaken,killed:e.hp===0,seconds:+s.elapsed.toFixed(3),focusSpent:s.stats.focusSpent,dashes:s.stats.dashes,events:s.log.filter(x=>['hurt','warning','interrupt','kill','stomp'].includes(x.type))});
}
const report={version:K.VERSION,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..','release/index.html'))).digest('hex'),seed:'V5-COMBAT-COMPARE',method:'Isolated VM encounter with shipped twin-blade rules. Other enemies, hazards and world nodes removed. Observation policy follows enemy position, dashes on late warning; echo additionally uses its clone. Automated policies, not human evidence.',rows};fs.writeFileSync(path.join(__dirname,'..','evidence/journey-v5/combat-comparison-after.json'),JSON.stringify(report,null,2));console.log(rows.map(({events,...x})=>x));
