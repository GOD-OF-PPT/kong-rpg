const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
function load(ref){const ctx=vm.createContext({console});let source='';for(const name of ['content','simulation']){const text=ref==='working'?fs.readFileSync(path.join(root,'src',name+'.js'),'utf8'):cp.execFileSync('git',['show',ref+':src/'+name+'.js'],{cwd:root,encoding:'utf8'});source+=text;vm.runInContext(text,ctx);}return{K:ctx.Kong,hash:crypto.createHash('sha256').update(source).digest('hex')};}
function experiment(ref){const {K,hash}=load(ref),trials=[];
  for(const seed of ['LOTUS-1025','LOTUS-0318','LOTUS-0916'])for(const health of[12,50,100])for(const relic of['cloud','echo'])for(const policy of['hold','read','read-no-clone']){
    const s=K.newRun(seed,relic);s.player.x=380;s.player.y=396;s.player.hp=health;s.player.invuln=0;s.player.grounded=true;
    // An isolated copy of the actual first blade encounter, with unchanged stats/map.
    s.room.enemies=s.room.enemies.filter(e=>e.id===0);s.room.seals=[];const enemy=s.room.enemies[0];
    let ticks=0,actions={},seen=null,jumpUntil=0,dashWait=0,stunFrames=0,waiting=0;const log=[],inputs=[];
    for(;ticks<2400&&s.mode==='playing'&&enemy.hp>0;ticks++){
      const time=ticks*K.DT;
      // One delayed 100ms observation sample, not a claim about human reaction latency.
      if(ticks%12===0){const observed=seen;seen={phase:enemy.phase,timer:enemy.timer,x:enemy.x,hp:enemy.hp};actions={attack:true};
        if(policy!=='hold'&&observed){actions.aimFace=Math.sign(observed.x+13-s.player.x-12)||1;const dx=enemy.x-s.player.x;actions.attack=observed.phase==='recover'||observed.phase==='idle'||!s.player.grounded;
          if(observed.phase==='windup'&&s.player.grounded&&s.player.dash===0){if(relic==='echo'&&policy!=='read-no-clone'&&s.player.focus>=50&&!s.clone){actions.clonePressed=true;actions.dashPressed=true;actions.right=true;dashWait=time+.2;}
          else if(time>jumpUntil){actions.jumpPressed=true;jumpUntil=time+.45;}}
          if(time<dashWait)actions.right=true;
          else if(s.player.x>enemy.x+34){actions.left=true;actions.attack=true;}
          else if(dx>65){actions.right=true;}
          actions.jump=time<jumpUntil;if(s.player.y<enemy.y-30&&dx>10)actions.right=true;if(s.player.grounded&&s.player.y<enemy.y-45){actions.down=true;actions.jumpPressed=true;actions.jump=true;actions.attack=false;}
        }
        inputs.push({tick:ticks,...actions});
      }else actions={...actions,jumpPressed:false,dashPressed:false,clonePressed:false};
      // This removal exists only in the experiment: the clone input cannot reach simulation.
      K.step(s,policy==='read-no-clone'?{...actions,clonePressed:false}:actions);for(const e of s.events)log.push({tick:ticks,...e});if(enemy.stun>0)stunFrames++;if(!actions.attack&&!actions.left&&!actions.right)waiting+=K.DT;
    }
    trials.push({seed,health,relic,policy,endPlayer:{x:s.player.x,y:s.player.y,face:s.player.face},endEnemy:{x:enemy.x,y:enemy.y,hp:enemy.hp,phase:enemy.phase},won:enemy.hp<=0,hp:s.player.hp,damage:s.damageTaken,seconds:+(ticks*K.DT).toFixed(3),focus:s.player.focus,spent:log.filter(e=>e.type==='clone').reduce((n,e)=>n+e.cost,0),stunSeconds:+(stunFrames*K.DT).toFixed(3),waiting:+waiting.toFixed(3),attacks:log.filter(e=>e.type==='swing').length,jumps:log.filter(e=>e.type==='jump').length,interrupts:log.filter(e=>e.type==='interrupt').length,log,inputs});
  }
  return{ref,sourceHash:hash,controllerHash:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scenario:'actual stage 0 first blade at seed coordinates; isolated enemies, player x380, normal stats; health brackets 12/50/100 paired',observation:'previous observation sampled at 100ms command intervals; delay is one sample, not guaranteed human latency',ablation:{policy:'read-no-clone',disabledActions:['clonePressed'],productionPatch:false},trials};
}
const ref=process.argv[2]||'working',result=experiment(ref);fs.mkdirSync(path.join(root,'evidence/v2'),{recursive:true});fs.writeFileSync(path.join(root,'evidence/v2',ref==='working'?'encounter-after.json':'encounter-before.json'),JSON.stringify(result,null,2));
const groups={};for(const t of result.trials){const key=t.relic+'/'+t.policy;const a=groups[key]||=[];a.push(t);}for(const[key,a]of Object.entries(groups))console.log(key,JSON.stringify({wins:a.filter(t=>t.won).length,total:a.length,damage:a.map(t=>t.damage),seconds:a.map(t=>t.seconds),spent:a.map(t=>t.spent)}));
