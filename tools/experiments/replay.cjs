const fs=require('fs'),path=require('path'),cp=require('child_process'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const summary=[];
for(const side of['before','after']){
 const saved=JSON.parse(fs.readFileSync(path.join(root,'evidence/v2/encounter-'+side+'.json'),'utf8'));let source='';const ctx=vm.createContext({console});
 for(const name of['content','simulation']){const text=side==='before'?cp.execFileSync('git',['show','e5dc0b5:src/'+name+'.js'],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,'src',name+'.js'),'utf8');source+=text;vm.runInContext(text,ctx);}
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),saved.sourceHash,'Wrong source version for replay');const K=ctx.Kong;
 for(const trial of saved.trials){const s=K.newRun(trial.seed,trial.relic);s.player.x=380;s.player.y=396;s.player.hp=trial.health;s.player.invuln=0;s.player.grounded=true;s.room.enemies=s.room.enemies.filter(e=>e.id===0);s.room.seals=[];const enemy=s.room.enemies[0];let next=0,a={},ticks=0;
 for(;ticks<2400&&s.mode==='playing'&&enemy.hp>0;ticks++){if(trial.inputs[next]?.tick===ticks){const{tick,...value}=trial.inputs[next++];a=value;}else a={...a,jumpPressed:false,dashPressed:false,clonePressed:false};K.step(s,a);}
 assert.equal(enemy.hp<=0,trial.won);assert.equal(s.damageTaken,trial.damage);assert.equal(s.player.hp,trial.hp);assert.equal(+(ticks*K.DT).toFixed(3),trial.seconds);
 }
 summary.push({side,trials:saved.trials.length,replay:'exact input actions reproduced wins, damage, health and duration',sourceHash:saved.sourceHash});
}
fs.writeFileSync(path.join(root,'evidence/v2/replay.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
