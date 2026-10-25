const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),ctx=vm.createContext({console});let source='';
for(const name of ['content','simulation']){const text=fs.readFileSync(path.join(root,'src',name+'.js'),'utf8');source+=text;vm.runInContext(text,ctx);}
const K=ctx.Kong,report={sourceHash:crypto.createHash('sha256').update(source).digest('hex'),scenario:'actual stage0 first shield; isolated from other enemies; player front spacing56, HP100 focus65; three fixed seeds; no content/stat changes',method:'100ms decisions using prior 100ms sample; recorded at 120Hz; policies are designed controllers, not human results',trials:[]};
function setup(seed,relic){const s=K.newRun(seed,relic),e=s.room.enemies.find(e=>e.kind==='shield');s.room.enemies=[e];s.room.seals=[];Object.assign(s.player,{x:e.x-56,y:396,grounded:true,invuln:0});e.timer=0;return s;}
for(const seed of ['LOTUS-1025','LOTUS-0318','LOTUS-0916'])for(const relic of ['cloud','echo'])for(const policy of ['hold','read','read-no-clone']){
  const s=setup(seed,relic),e=s.room.enemies[0],inputs=[],events=[];let prior=null,a={},jumpUntil=0,waiting=0,ticks=0;
  for(;ticks<2400&&s.mode==='playing'&&e.hp>0;ticks++){
    const t=ticks*K.DT;
    if(ticks%12===0){const obs=prior;prior={phase:e.phase,timer:e.timer,x:e.x};a={attack:true,aimFace:Math.sign(e.x+13-s.player.x-12)||1};
      if(policy!=='hold'&&obs){const p=s.player,target=e.x+e.w+28,behind=p.x>e.x+e.w;
        if(relic==='echo'&&policy!=='read-no-clone'&&obs.phase==='windup'&&!s.clone&&p.focus>=50){a.clonePressed=true;a.dashPressed=true;a.right=true;}
        else if(!behind&&p.grounded&&obs.phase==='windup'&&t>jumpUntil){a.jumpPressed=true;jumpUntil=t+.55;a.right=true;}
        if(!behind&&(!p.grounded||p.dash>0))a.right=true;
        if(behind){if(p.x<target-8)a.right=true;else if(p.x>target+8)a.left=true;}
        if(relic==='cloud'&&!p.grounded&&p.vy>120&&p.airJumps===0&&!behind){a.jumpPressed=true;jumpUntil=t+.25;}
        a.jump=t<jumpUntil;
        if(p.grounded&&p.y<350){a.down=true;a.jumpPressed=true;a.jump=true;a.attack=false;}
        if(!behind&&obs.phase==='windup')a.attack=false;
      }
      inputs.push({tick:ticks,...a});
    }else a={...a,jumpPressed:false,dashPressed:false,clonePressed:false};
    const actual=policy==='read-no-clone'?{...a,clonePressed:false}:a;K.step(s,actual);events.push(...s.events.map(e=>({tick:ticks,...e})));if(!actual.attack&&!actual.left&&!actual.right)waiting+=K.DT;
  }
  const trial={seed,relic,policy,won:e.hp===0,seconds:+(ticks*K.DT).toFixed(3),damage:s.damageTaken,enemyHP:e.hp,focusSpent:s.stats.focusSpent,jumps:s.stats.jumps,dashes:s.stats.dashes,waiting:+waiting.toFixed(3),inputs,events};
  const replay=setup(seed,relic);let index=0,r={};for(let i=0;i<ticks;i++){if(inputs[index]?.tick===i){const {tick,...next}=inputs[index++];r=next;}else r={...r,jumpPressed:false,dashPressed:false,clonePressed:false};K.step(replay,policy==='read-no-clone'?{...r,clonePressed:false}:r);}
  assert.equal(replay.damageTaken,s.damageTaken);assert.equal(replay.room.enemies[0].hp,e.hp);trial.replay='exact recorded inputs reproduce damage and enemy health';report.trials.push(trial);
}
fs.writeFileSync(path.join(root,'evidence/complete-v2/shield.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.trials.map(({inputs,events,...t})=>t),null,2));
