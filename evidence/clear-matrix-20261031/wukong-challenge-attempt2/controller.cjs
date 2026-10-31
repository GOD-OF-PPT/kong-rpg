// QA input policy only. Reads a snapshot; never changes the game state.
module.exports=function(K){
 delete require.cache[require.resolve('./platform-controller-v12.cjs')];const routeTo=require('./platform-controller-v12.cjs');
 let jumpUntil=-1,lastJump=-9,lastDrop=-9,lastH=-9,lastL=-9,lastC=-9,lastR=-9,lastK=-9,lastF=-9,lastU=-9,lastQ=-9,safeTarget=null,priorKeys=new Set();
 return {
 reward(s){const p=s.player,max=K.maxHP(s);if(s.reward.includes('vitality')&&p.hp>max*.45)return 'vitality';if(p.hp<max*.72)return 'rest';return ['staff','dash-strike','ultimate-echo','staff-wave','mirror','mercy','clone-burst','ward','thunder','echo','flame'].find(id=>s.reward.includes(id))||'rest';},
 next(s){
  const p=s.player,t=s.time,hero=s.hero,chief=s.room.enemies.find(e=>e.chiefId),foes=s.room.enemies.filter(e=>e.hp>0&&!e.dormant&&!e.chiefId).sort((a,b)=>a.origin-b.origin),primary=foes[0]||(chief?.hp>0&&!chief.dormant?chief:null);
  const device=primary?.chiefId&&s.room.anchors.find(a=>a.active&&a.hp>0),foe=device?{...device,id:'anchor-'+device.id,kind:'device',face:0,phase:'recover'}:primary;
  const keys=new Set(),dist=foe?Math.abs(foe.x+foe.w/2-p.x-12):Infinity;
  const art=hero==='wukong'?'sky-staff':hero==='nezha'?'six-arms':'eye-beam',manual=!s.celestial.owned.includes(art)&&p.x<420;
  let target=manual?198:foe?(p.x<foe.x?foe.x-55:foe.x+foe.w+26):chief?.hp>0?s.room.arena.enter+35:s.room.exit-28;
  if(manual&&Math.abs(p.x-target)<35&&t-lastF>.3){keys.add('KeyF');lastF=t;}
  const camp=s.room.camp;if(camp&&!camp.used&&p.hp<K.maxHP(s)-18&&Math.abs(p.x-camp.x)<70&&Math.abs(p.y-camp.y)<60&&t-lastF>.5){keys.add('KeyF');lastF=t;}
  if(chief?.hp<=0&&Math.abs(p.x-s.room.exit)<65&&t-lastF>.3){keys.add('KeyF');lastF=t;}
  const ground=s.room.platforms.filter(q=>q.solid),route=routeTo(s,foe,target);if(route.node!==undefined)target=route.target;
  const touch=(b,x=p.x,y=p.y)=>x+p.w>b.x-4&&x<b.x+b.w+4&&y+p.h>b.y&&y<b.y+b.h;
  const nearby=s.room.enemies.filter(e=>e.hp>0&&!e.dormant&&e.phase==='campaign-windup');
  const laneOwner=nearby.find(e=>K.bossSafeLane(s,e))||(chief?.phase==='campaign-active'&&K.bossSafeLane(s,chief)?chief:null);
  const lane=laneOwner&&K.bossSafeLane(s,laneOwner);
  const hazards=[...nearby.filter(e=>e.timer<(K.enemyEffectProfile(e.move)?.shape==='wave'?.30:1.2)&&!K.bossSafeLane(s,e)&&!['shot','rush'].includes(K.enemyEffectProfile(e.move)?.shape)).flatMap(e=>e.marks||[]),...s.dangers];
  const vertical=hazards.filter(b=>b.h>60&&b.w<220),low=hazards.filter(b=>b.h<=60||b.w>=220);
  let evading=false;
  if(lane){target=lane.x+lane.w/2-12;evading=true;}
  else if(vertical.length&&(safeTarget!==null||vertical.some(b=>p.x+p.w>b.x-7&&p.x<b.x+b.w+7||target+p.w>b.x&&target<b.x+b.w))){
   const min=chief&&!chief.dormant&&chief.hp>0?s.room.arena.min:8,max=chief&&!chief.dormant&&chief.hp>0?s.room.arena.max-p.w:s.room.width-p.w-8;
   const candidates=[...(safeTarget===null?[]:[safeTarget]),p.x,...vertical.flatMap(b=>[b.x-p.w-15,b.x+b.w+15])].filter(x=>x>=min&&x<=max&&vertical.every(b=>x+p.w<b.x-5||x>b.x+b.w+5)).sort((a,b)=>Math.abs(a-p.x)-Math.abs(b-p.x));
   if(candidates.length){target=safeTarget=candidates[0];evading=true;}
  }
  if(!vertical.length)safeTarget=null;
  const slash=foe?.chiefId&&foe.phase==='campaign-windup'&&['axe-cleave','king-sword'].includes(foe.move)&&foe.marks.some(b=>touch(b));
  if(slash){target=foe.face<0?foe.x+foe.w+25:foe.x-p.w-25;evading=true;}
  const chiefDistance=chief?Math.abs(chief.x+chief.w/2-p.x-12):Infinity;
  const crossesChief=chief?.hp>0&&!chief.dormant&&((p.x+p.w<=chief.x+5&&target>chief.x+chief.w)||(p.x>=chief.x+chief.w-5&&target+p.w<chief.x));
  const incoming=s.projectiles.some(b=>!b.friendly&&Math.abs(b.x-p.x)<95&&b.y+b.h>p.y-5&&b.y<p.y+p.h+5);
  const groundHazard=s.room.hazards.some(h=>Math.abs(h.x+h.w/2-p.x-12)<90&&p.y+p.h>h.y-20);
  const direction=target>=p.x?1:-1,gap=ground.some(g=>direction>0?g.x+g.w<s.room.width-1&&g.x+g.w-p.x>0&&g.x+g.w-p.x<65:p.x-g.x>0&&p.x-g.x<65&&g.x>0);
  const high=foe&&foe.y+foe.h<p.y+p.h-25&&dist<180;
  const lowRisk=!lane&&!slash&&low.some(b=>touch(b));
  const charge=foe&&foe.phase==='campaign-windup'&&['axe-rush','head-dive','soldier-rush'].includes(foe.move)&&foe.timer<.4&&dist<350;
  if(p.grounded&&t-lastJump>.5&&t>jumpUntil+.075&&(route.jump||gap||groundHazard||lowRisk||charge||high||crossesChief&&(p.dashCD>0||chiefDistance>170))){
   jumpUntil=t+.34;lastJump=t;
  }
  // A second deliberate press keeps an airborne escape above long ground waves.
  const overGap=!ground.some(g=>p.x+p.w>g.x&&p.x<g.x+g.w);
  const lowWillLand=!lane&&!slash&&low.some(b=>p.x+p.w>b.x&&p.x<b.x+b.w);
  if(!p.grounded&&p.vy>20&&p.airJumps<1&&K.has(s,'cloud')&&t-lastJump>.32&&(gap||overGap||lowWillLand||charge||crossesChief)&&t>jumpUntil+.075){jumpUntil=t+.34;lastJump=t;}
  if(t<jumpUntil)keys.add('Space');
  if((route.drop||p.grounded&&p.y<340&&(!foe||foe.y>p.y+60))&&t-lastDrop>.7){keys.add('KeyS');keys.add('Space');lastDrop=t;}
  if(p.x<target-8)keys.add('KeyD');else if(p.x>target+8)keys.add('KeyA');
  const reachable=foe&&Math.abs(p.y-foe.y)<95&&dist<(hero==='nezha'?125:110),approaching=Math.abs(target-p.x)>85&&p.grounded;
  if(reachable&&!manual&&!approaching&&route.node===undefined&&(!evading||Math.abs(target-p.x)<18))keys.add('KeyJ');
  const look=foe?Math.sign(foe.x+foe.w/2-p.x-12)||1:p.face;
  if(keys.has('KeyJ')&&!keys.has('KeyA')&&!keys.has('KeyD')&&p.face!==look)keys.add(look>0?'KeyD':'KeyA');
  if(foe&&!manual){
   const facing=p.face===look,open=!foe.chiefId||foe.phase==='recover';
   if(dist<500&&p.secondaryCD<=0&&p.focus>=30&&!s.ring&&!s.bow&&t-lastH>1.1&&(!evading||Math.abs(target-p.x)<18)){keys.add('KeyH');lastH=t;}
   if(dist<170&&p.focus>=55&&!s.clone&&!s.silk&&!s.eye&&t-lastL>3.1&&(!evading||Math.abs(target-p.x)<20)){keys.add('KeyL');lastL=t;}
   const longOpening=!foe.chiefId||foe.phase==='recover'&&foe.timer>.46;
   const artSafe=hero==='erlang'?longOpening&&p.grounded:hero==='wukong'?p.grounded&&!evading&&longOpening:!evading;
   if(artSafe&&facing&&s.celestial.equipped&&!s.celestial.cast&&s.celestial.cooldown<=0&&p.focus>=K.artDef(s.celestial.equipped).focus&&dist<(hero==='wukong'?480:hero==='erlang'?450:160)&&t-lastC>1){keys.add('KeyC');lastC=t;}
   if(open&&facing&&p.rage>=100&&Math.abs(p.y-foe.y)<110&&dist<200&&t-lastR>1&&!evading){keys.add('KeyR');lastR=t;}
   const dangerousClose=foe.phase==='campaign-windup'&&foe.timer<.28&&dist<130&&!lane||foe.phase==='campaign-charge'&&dist<110;
   if(p.dashCD<=0&&t-lastK>.9&&!keys.has('Space')&&(incoming||dangerousClose||crossesChief&&chiefDistance<170||foe.kind==='shield'&&reachable&&!open)){
    keys.add('KeyK');lastK=t;
    if(!lane){keys.delete('KeyA');keys.delete('KeyD');keys.add(look>0?'KeyD':'KeyA');}
   }
   if(s.talisman&&t-lastQ>1&&(s.talisman.id==='thunder'&&facing&&dist<350||s.talisman.id==='ward'&&(incoming||dangerousClose||lowRisk))){keys.add('KeyQ');lastQ=t;}
   if(hero==='nezha'&&(gap||groundHazard||lowRisk)&&p.focus>50&&p.wheelFuel>.35&&t-lastU>3&&!s.celestial.cast){keys.add('KeyU');keys.add('Space');lastU=t;}
   if(hero==='erlang'&&incoming&&p.armCD<=0&&p.focus>30&&t-lastU>2&&!keys.has('Space')&&!evading){keys.add('KeyU');lastU=t;}
  }
  let chosen=[...keys];
  // Look ahead on independent JSON copies to choose a real dodge input. The
  // browser's live state and production rules are never written or replaced.
  if(chief?.chiefId==='litian'&&chief.hp>0&&!chief.dormant&&!lane&&(['king-sword','king-fire'].includes(chief.move)&&['campaign-windup','campaign-active'].includes(chief.phase)||incoming)&&p.ultimate<=0){
   const raw=JSON.stringify(s),plans=[chosen,[],['KeyJ'],['KeyA'],['KeyD'],['KeyA','KeyJ'],['KeyD','KeyJ'],['KeyA','Space'],['KeyD','Space'],['KeyA','KeyK'],['KeyD','KeyK']];
   if(p.rage>=100)plans.push(['KeyR']);
   const hold={KeyA:'left',KeyD:'right',KeyJ:'attack',Space:'jump'},press={Space:'jumpPressed',KeyJ:'attackPressed',KeyK:'dashPressed',KeyR:'ultimatePressed'};
   const horizon=chief.phase==='campaign-windup'?Math.min(1.6,chief.timer+(chief.move==='king-fire'?.6:.4)):.65;let best=-Infinity;
   for(const plan of plans){const z=JSON.parse(raw),a={},pulses={};for(const k of plan){if(hold[k])a[hold[k]]=true;if(press[k]&&!priorKeys.has(k))pulses[press[k]]=true;}for(let i=0;i<Math.ceil(horizon/K.DT)&&z.mode==='playing';i++){const ready=z.hitstop<=0;K.step(z,{...a,...pulses});if(ready)for(const k in pulses)delete pulses[k];}
    const after=z.room.enemies.find(e=>e.chiefId),loss=p.hp-z.player.hp,damage=chief.hp-after.hp;
    const score=-loss*200+damage*.7-Math.abs(z.player.x-target)*.025-(z.player.y>450?1000:0)-(z.mode==='dead'?100000:0)-(plan.includes('KeyK')?.4:0);
    if(score>best){best=score;chosen=plan;}
   }
  }
  priorKeys=new Set(chosen);
  return {keys:chosen,aim:foe?{x:foe.x+foe.w/2,y:foe.y+foe.h*.5}:null,target,foe:foe?.id,reason:manual?'manual':lane?'safe-lane':evading?'evade':route.node!==undefined?'route':foe?'fight':'exit'};
 }
 };
};
