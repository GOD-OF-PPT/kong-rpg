// Fast policy rehearsal with the same production simulation. Not browser proof.
const fs=require('node:fs'),path=require('node:path'),K=require('./combat-identity-runtime.cjs')();
const out=path.resolve(process.env.MATRIX_PROBE_DIR||'evidence/clear-matrix-20261031/probe');fs.mkdirSync(out,{recursive:true});
const heroes=(process.env.HEROES||'wukong,nezha,erlang').split(','),modes=(process.env.MODES||'normal,challenge').split(','),seed=process.env.SEED||'LOTUS-1025';
let qualification=process.env.QUALIFICATION?JSON.parse(fs.readFileSync(process.env.QUALIFICATION,'utf8')).meta:null;
for(const difficulty of modes)for(const hero of heroes){
 if(difficulty==='challenge'&&!K.canChallenge(qualification)){console.log('No earned S qualification yet; challenge not forged.');continue;}
 const policy=require('./journey-controller-20261031.cjs')(K),s=K.newRun(seed,'cloud',hero,difficulty,qualification),report={hero,difficulty,seed,method:'Simulation rehearsal only; legitimate K.step inputs and reward choices, no combat state edits.',stages:[],rewards:[],samples:[],events:[]};
 let input={},held=new Set(),pressed={},lastStage=-1,lastProgress='',progressAt=0,next=0,decision;
 for(let tick=0;tick<360000;tick++){
  if(s.mode==='won'||s.mode==='dead')break;
  if(s.mode==='art-choice'){K.chooseManual(s,true);held.clear();next=0;}
  if(s.mode==='reward'){const id=policy.reward(s);report.rewards.push({stage:s.stage,kind:s.rewardKind,id});K.choose(s,id);held.clear();next=0;}
  if(s.pendingRelic){K.choose(s,s.pendingRelic,s.relics.find(id=>id!=='cloud')||s.relics[0]);held.clear();next=0;}
  if(s.mode!=='playing')throw Error('Unexpected mode '+s.mode);
  if(s.stage!==lastStage){lastStage=s.stage;report.stages.push({stage:s.stage,hp:s.player.hp,time:s.elapsed});console.log(hero+' '+difficulty+' stage '+s.stage+' hp '+Math.round(s.player.hp));}
  if(tick>=next){decision=policy.next(s);const want=new Set(decision.keys),map={KeyA:'left',KeyD:'right',KeyS:'down',Space:'jump',KeyJ:'attack',KeyU:'signature'},press={Space:'jumpPressed',KeyJ:'attackPressed',KeyK:'dashPressed',KeyL:'clonePressed',KeyH:'secondaryPressed',KeyF:'interactPressed',KeyR:'ultimatePressed',KeyQ:'talismanPressed',KeyC:'artPressed',KeyU:'signaturePressed'};input={viewX:Math.max(0,Math.min(s.room.width-960,s.player.x-300)),secondaryAim:decision.aim};pressed={};for(const k of want){if(map[k])input[map[k]]=true;if(press[k]&&!held.has(k))pressed[press[k]]=true;}held=want;next=tick+6;}
  const consume=s.hitstop<=0;K.step(s,{...input,...pressed});if(consume)pressed={};
  for(const event of s.events)if(['hurt','guardian-enter','guardian-defeat','enemy-commit','victory'].includes(event.type))report.events.push({stage:s.stage,...event});
  if(tick%600===0){const f=s.room.enemies.find(e=>e.id===decision?.foe);report.samples.push({stage:s.stage,time:s.elapsed,hp:s.player.hp,x:s.player.x,y:s.player.y,foe:f?{id:f.id,x:f.x,y:f.y,hp:f.hp,phase:f.phase,move:f.move}:null,decision});}
  const progress=[s.stage,Math.round(s.player.x/10),s.player.hp,s.room.enemies.reduce((n,e)=>n+e.hp,0),s.celestial.owned.length].join(':');if(progress!==lastProgress){lastProgress=progress;progressAt=tick;}if(tick-progressAt>7200){report.stall=decision;break;}
 }
 report.final={mode:s.mode,stage:s.stage,hp:s.player.hp,elapsed:s.elapsed,rating:K.rating(s),stats:s.stats,lastDamage:s.lastDamage,completed:s.campaign.completed};
 const meta={};K.recordClear(meta,s);if(K.canChallenge(meta)){qualification=meta;fs.writeFileSync(path.join(out,'qualification.json'),K.pack(s,meta));}
 fs.writeFileSync(path.join(out,hero+'-'+difficulty+'.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,hero+'-'+difficulty+'-state.json'),K.pack(s,meta));console.log(JSON.stringify({hero,difficulty,...report.final}));
}
