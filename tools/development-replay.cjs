const fs=require('fs'),path=require('path'),cp=require('child_process'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'evidence/complete-v2'),summary=[];
for(const side of ['before','after']){
  const saved=JSON.parse(fs.readFileSync(path.join(out,'encounter-'+side+'.json'),'utf8')),ctx=vm.createContext({console});let source='';
  for(const file of ['content','simulation']){const text=side==='before'?cp.execFileSync('git',['show','c797b3d:src/'+file+'.js'],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,'src',file+'.js'),'utf8');source+=text;vm.runInContext(text,ctx);}
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'),saved.sourceHash);const K=ctx.Kong;
  for(const trial of saved.trials){
    const s=K.newRun(trial.seed,trial.relic);Object.assign(s.player,{x:trial.spacing,y:396,hp:trial.health,invuln:0,grounded:true});s.room.enemies[0].timer=0;s.room.enemies=s.room.enemies.filter(e=>e.id===0);s.room.seals=[];
    let index=0,a={},ticks=0;const e=s.room.enemies[0];
    for(;ticks<2400&&s.mode==='playing'&&e.hp>0;ticks++){if(trial.inputs[index]?.tick===ticks){const {tick,...next}=trial.inputs[index++];a=next;}else a={...a,jumpPressed:false,dashPressed:false,clonePressed:false};K.step(s,trial.policy==='read-no-clone'?{...a,clonePressed:false}:a);}
    assert.equal(e.hp<=0,trial.won);assert.equal(s.damageTaken,trial.damage);assert.equal(s.player.hp,trial.hp);assert.equal(+(ticks*K.DT).toFixed(3),trial.seconds);
  }
  summary.push({side,sourceHash:saved.sourceHash,result:'recorded input reproduces outcome, health, damage and duration'});
}
fs.writeFileSync(path.join(out,'replay.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
