(function(K){
  'use strict';
  const KEY='kong.black-lotus.v9',EIGHTH='kong.black-lotus.v8',SEVENTH='kong.black-lotus.v7',LEGACY='kong.black-lotus.v1',PREVIOUS='kong.black-lotus.v2',THIRD='kong.black-lotus.v3',FOURTH='kong.black-lotus.v4',FIFTH='kong.black-lotus.v5',SIXTH='kong.black-lotus.v6',SETTINGS='kong.black-lotus.settings.v2';
  const number=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
  const fail=()=>{throw new Error('存档数据不完整或已损坏，请保留原文件。');};
  const count=v=>Number.isFinite(Number(v))?Math.max(0,Math.min(1e7,Math.floor(Number(v)))):0;
  K.cleanMeta=function(m){
    return {runs:count(m?.runs),wins:count(m?.wins),best:Math.min(4,count(m?.best)),history:Array.isArray(m?.history)?m.history.filter(x=>x&&typeof x.id==='string'&&typeof x.seed==='string').slice(-8).map(x=>({id:x.id.slice(0,100),seed:x.seed.slice(0,32),won:!!x.won,stage:Math.min(3,count(x.stage)),hero:K.HEROES.some(h=>h.id===x.hero)?x.hero:'wukong',difficulty:x.difficulty==='challenge'?'challenge':'normal',seconds:count(x.seconds),damage:count(x.damage),relics:Array.isArray(x.relics)?x.relics.filter(id=>K.RELICS.some(r=>r.id===id)).slice(0,3):[]})):[]};
  };
  K.validSave=function(data){
    if(data?.game==='black-lotus'&&[1,2,3,4,5,6,7,8].includes(data.schema)&&data.schema===data.state?.version){const error=new Error('这是旧版旅程，请在保留的原版中继续。');error.legacy=true;throw error;}
    if(!data||data.schema!==9||data.game!=='black-lotus'||!data.state)throw new Error('这不是劫后行v9存档。');
    const s=data.state;if(!K.HEROES.some(h=>h.id===s.hero))fail();
    const difficulty=s.difficulty??'normal',challenging=difficulty==='challenge';
    if(!['normal','challenge'].includes(difficulty)||(challenging?s.challengeRules!==1:s.challengeRules!==undefined&&s.challengeRules!==0))fail();
    if(s.version!==9||s.rules!==9||!Number.isInteger(s.stage)||s.stage<0||s.stage>3||typeof s.seed!=='string'||s.seed.length>32||!['playing','paused','reward','dead','won','art-choice'].includes(s.mode))fail();
    if(!s.growth||typeof s.growth!=='object'||Array.isArray(s.growth)||Object.entries(s.growth).some(([id,n])=>{const r=K.GROWTH.find(r=>r.id===id&&!r.temporary);return !r||!Number.isInteger(n)||n<1||n>r.max;}))fail();
    if(s.talisman!==null&&(!s.talisman||!['thunder','ward'].includes(s.talisman.id)||!Number.isInteger(s.talisman.charges)||s.talisman.charges<1||s.talisman.charges>(s.talisman.id==='thunder'?3:2)))fail();
    if(!s.world||['rescue','bridge','bell'].some(key=>typeof s.world[key]!=='boolean')||!Array.isArray(s.journal)||s.journal.length>6||new Set(s.journal).size!==s.journal.length||s.journal.some(key=>!['rescue:start','rescue:done','bridge:done','bell:start','bell:done'].includes(key)))fail();
    if(!Array.isArray(s.relics)||s.relics.length>3||new Set(s.relics).size!==s.relics.length||s.relics.some(id=>!K.RELICS.some(r=>r.id===id)))fail();
    const canonical=K.makeRoom(s.seed,s.stage,difficulty),p=s.player;
    if(!p||!number(p.hp,0,K.maxHP(s))||!number(p.focus,0,100)||!number(p.rage,0,100)||!number(p.ultimate,0,.86)||!Number.isInteger(p.ultimateStage)||p.ultimateStage<0||p.ultimateStage>2||!number(p.x,0,canonical.width)||!number(p.y,-1000,1000)||!number(p.vx,-2000,2000)||!number(p.vy,-2000,2000)||![-1,1].includes(p.face))fail();
    for(const key of ['coyote','buffer','invuln','dash','dashCD','attack','landing','drop','hurt','attackBuffer','talismanCD','ward','ringCD'])if(!number(p[key],0,5))fail();
    if(!Array.isArray(p.dashTargets)||p.dashTargets.length>40||p.dashTargets.some(x=>typeof x!=='string'))fail();
    if(typeof p.grounded!=='boolean'||typeof p.slam!=='boolean'||!Number.isInteger(p.airJumps)||p.airJumps<0||p.airJumps>1||!Number.isInteger(p.comboIndex)||p.comboIndex<0||p.comboIndex>3||!number(p.attackId,0,1e7)||!Array.isArray(p.attackTargets)||p.attackTargets.length>40||p.attackTargets.some(x=>typeof x!=='string')||(p.attack>0&&!number(p.attackDuration,.1,1)))fail();
    if(p.slam&&p.vy<=0)fail();if(p.ringAim!==null&&(!p.ringAim||!number(p.ringAim.x,-100,canonical.width+100)||!number(p.ringAim.y,0,540)))fail();
    for(const key of ['time','elapsed','roomTime','kills','broken','damageTaken','hitstop','shake','checkpoint','combo','comboTime','serial'])if(!number(s[key],0,1e8))fail();
    if(s.broken>8||s.checkpoint>canonical.width||s.combo>3||typeof s.lastDamage!=='string'||s.lastDamage.length>100||!Array.isArray(s.hints)||s.hints.length>40||s.hints.some(x=>typeof x!=='string'||x.length>50))fail();
    if(!s.room||!Array.isArray(s.room.enemies)||s.room.enemies.length!==canonical.enemies.length||!Array.isArray(s.room.seals)||s.room.seals.length!==canonical.seals.length||!Array.isArray(s.room.pickups)||s.room.pickups.length!==canonical.pickups.length||typeof s.room.midClaimed!=='boolean')fail();
    const phases=['idle','windup','attack','recover','sweep-windup','orb-windup','sweep','shift-windup','shift','lunge-windup','lunge','rush-windup','rush','sigil-windup','rain-windup','warden-windup','warden-rush','chain-windup','pursuit-windup','pursuit','advance','cross-windup','break-windup','break-rush','air-windup'];
    if(challenging)phases.push(...K.CHALLENGE_PHASES);phases.push(...K.REALM_PHASES);
    function validBox(b){return b&&number(b.x,-200,canonical.width+200)&&number(b.y,-1000,1000)&&number(b.w,1,620)&&number(b.h,1,200);}
    canonical.enemies.forEach((e,i)=>{
      const x=s.room.enemies[i];if(!x||x.id!==e.id||x.kind!==e.kind||!number(x.hp,0,e.maxHp)||!number(x.x,0,canonical.width)||!number(x.y,-200,540)||!number(x.timer,-2,10)||!number(x.stun,0,2)||!number(x.flash,0,2)||!number(x.interruptLock,0,2)||!number(x.attacks,0,1e7)||![-1,1].includes(x.face)||!phases.includes(x.phase))fail();
      if(challenging){if(!number(x.challengeCD,0,7))fail();e.challengeCD=x.challengeCD;if(x.phase==='challenge-bolt-windup'&&(e.kind!=='blade'||x.aimX===undefined))fail();if(['challenge-mark-windup','challenge-echo-windup'].includes(x.phase)&&(e.kind!=='caster'||x.marks?.length!==1))fail();if(['challenge-quake-windup','challenge-bell-windup'].includes(x.phase)&&x.marks?.length!==1)fail();if(x.phase==='challenge-fan-windup'&&(e.kind!=='warden'||e.guardian!=='ferry'||x.marks?.length!==2))fail();if(x.phase==='challenge-rain-windup'&&(e.kind!=='boss'||![1,2].includes(x.marks?.length)))fail();}
      if(e.realm){if(x.realm!==e.realm||!number(x.realmCD,0,4.5))fail();e.realmCD=x.realmCD;if(K.REALM_PHASES.includes(x.phase)&&(!Array.isArray(x.marks)||x.marks.length<1||x.marks.length>2))fail();}
      if(![100,420].includes(x.roamRange))fail();e.roamRange=x.roamRange;
      if(x.counterTo!==undefined){if(!number(x.counterTo,0,canonical.width))fail();e.counterTo=x.counterTo;}if(['pursuit','pursuit-windup'].includes(x.phase)&&!Number.isFinite(x.counterTo))fail();if(x.phase==='cross-windup'&&(!Array.isArray(x.marks)||x.marks.length!==2))fail();
      if(!number(x.signatureCD,0,4))fail();e.signatureCD=x.signatureCD;if(x.rushTo!==undefined){if(!number(x.rushTo,0,canonical.width))fail();e.rushTo=x.rushTo;}if(['break-windup','break-rush'].includes(x.phase)&&!Number.isFinite(x.rushTo))fail();if(x.phase==='air-windup'&&(!Array.isArray(x.marks)||x.marks.length!==1))fail();
      if(typeof x.followup!=='boolean')fail();e.followup=x.followup;
      if(e.kind==='boss'){if(typeof x.dormant!=='boolean')fail();e.dormant=x.dormant;}
      for(const key of ['hp','x','y','timer','stun','flash','interruptLock','attacks','face','phase','struck'])e[key]=x[key];
      if(e.kind==='warden'){if(x.guardian!==e.guardian||typeof x.dormant!=='boolean'||!['','charge','quake','fan','lantern','columns','bell'].includes(x.move))fail();e.dormant=x.dormant;e.move=x.move;if(x.chargeTo!==undefined){if(!number(x.chargeTo,4430+canonical.arena.offset,5140+canonical.arena.offset))fail();e.chargeTo=x.chargeTo;}if(e.phase==='warden-rush'&&(e.move!=='charge'||!Number.isFinite(e.chargeTo)))fail();}
      if(x.shiftTo!==undefined){if(!number(x.shiftTo,canonical.arena.offset,canonical.width))fail();e.shiftTo=x.shiftTo;}
      if(x.aimX!==undefined){if(!number(x.aimX,-200,canonical.width+200)||!number(x.aimY,-1000,1000))fail();e.aimX=x.aimX;e.aimY=x.aimY;}
      if(!number(x.recoil,0,1)||![-1,1].includes(x.recoilFace))fail();e.recoil=x.recoil;e.recoilFace=x.recoilFace;
      if(x.marks!==undefined){if(!Array.isArray(x.marks)||x.marks.length>3||x.marks.some(b=>!validBox(b)))fail();e.marks=x.marks.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h}));}
      if(e.phase==='rain-windup'&&(!e.marks||e.marks.length<2))fail();
      if(e.phase==='sigil-windup'&&x.aimX===undefined)fail();
    });
    canonical.seals.forEach((q,i)=>{const x=s.room.seals[i];if(!x||!number(x.hp,0,56)||!number(x.pulse,0,4)||typeof x.warning!=='boolean')fail();q.hp=x.hp;q.pulse=x.pulse;q.warning=x.warning;});
    canonical.pickups.forEach((q,i)=>{
      const x=s.room.pickups[i];if(!x||typeof x.used!=='boolean'||x.kind!==q.kind||x.sourceId!==q.sourceId)fail();q.used=x.used;
      if(q.sourceId!==undefined){const e=canonical.enemies.find(e=>e.id===q.sourceId);if(typeof x.enabled!=='boolean'||(x.enabled&&e.hp>0)||(x.used&&!x.enabled)||!number(x.x,e.origin-(e.roamRange||100)-80,e.origin+(e.roamRange||100)+100)||!number(x.y,0,440))fail();q.enabled=x.enabled;q.x=x.x;q.y=x.y;}
    });canonical.midClaimed=s.room.midClaimed;
    if(canonical.camp){if(typeof s.room.camp?.used!=='boolean')fail();canonical.camp.used=s.room.camp.used;}
    if(canonical.trial){const t=s.room.trial;if(!t||!['ready','active','cleared','claimed'].includes(t.state))fail();canonical.trial.state=t.state;const guards=canonical.enemies.filter(e=>canonical.trial.guards.includes(e.id));if(['ready','cleared','claimed'].includes(t.state)&&guards.some(e=>e.hp>0))fail();if(t.state==='ready'&&canonical.pickups.some(q=>canonical.trial.guards.includes(q.sourceId)&&q.enabled))fail();}

    if(!Array.isArray(s.room.platforms)||s.room.platforms.length!==canonical.platforms.length)fail();
    canonical.platforms.forEach((q,i)=>{if(q.fragile){const x=s.room.platforms[i];if(!x||!number(x.crack,0,.65)||!number(x.cooldown,0,2.8))fail();q.crack=x.crack;q.cooldown=x.cooldown;}if(q.raft)q.x=q.originX+Math.sin(s.roomTime*.85)*65;});
    if(canonical.node){const n=s.room.node;if(!n||n.id!==canonical.node.id||!['ready','active','done'].includes(n.state)||(n.state==='done')!==s.world[n.id])fail();canonical.node.state=n.state;if(n.state==='ready'&&canonical.enemies.some(e=>canonical.node.guards.includes(e.id)&&e.hp>0))fail();}
    const dangerSources=[...K.REALM_SOURCES,'莲灯使·锁空莲印','莲灯使·锁地咒','莲灯使·交叉封位','无天·黑莲落火','镇山魈王·震地','渡厄灯魁·索灯','缄愿法使·封愿','缄愿法使·钟浪'];
    if(challenging)dangerSources.push(...K.CHALLENGE_DANGERS);
    if(!Array.isArray(s.dangers)||s.dangers.length>20||s.dangers.some(d=>!validBox(d)||!number(d.life,0,1)||![12,16].includes(d.damage)||!dangerSources.includes(d.source)))fail();
    if(!Array.isArray(s.casts)||s.casts.length>3||s.casts.some(c=>!validBox(c)||!number(c.timer,0,.24)))fail();
    if(!Array.isArray(s.projectiles)||s.projectiles.length>100)fail();
    const projectiles=s.projectiles.map(b=>{
      for(const [key,min,max]of[['x',-200,canonical.width+200],['y',-2000,2000],['vx',-2000,2000],['vy',-2000,2000],['life',0,10],['w',1,100],['h',1,100]])if(!number(b[key],min,max))fail();
      if(typeof b.friendly!=='boolean'||(b.damage!==undefined&&!number(b.damage,1,100))||(b.hit!==undefined&&(!Array.isArray(b.hit)||b.hit.length>100||b.hit.some(x=>!Number.isInteger(x)))))fail();
      if(b.source!==undefined&&![...K.REALM_SOURCES,'渡厄灯魁·散焰','震盾兵·地波',...(challenging?K.CHALLENGE_PROJECTILES:[])].includes(b.source))fail();
      // Optional for existing schema6 saves; separate IDs avoid enemy 0 / seal 0 collisions.
      if(b.sealHits!==undefined&&(!Array.isArray(b.sealHits)||b.sealHits.length>canonical.seals.length||new Set(b.sealHits).size!==b.sealHits.length||b.sealHits.some(id=>!canonical.seals.some(q=>q.id===id))||(!b.friendly&&b.sealHits.length)))fail();
      return {x:b.x,y:b.y,vx:b.vx,vy:b.vy,life:b.life,w:b.w,h:b.h,friendly:b.friendly,damage:b.damage,hit:b.hit,sealHits:b.sealHits?.slice(),source:b.source};
    });
    let clone=null;if(s.clone){const c=s.clone;if(!number(c.x,0,canonical.width)||!number(c.y,-1000,1000)||!number(c.life,0,4)||!number(c.timer,-1,1)||![-1,1].includes(c.face))fail();clone={x:c.x,y:c.y,w:24,h:44,life:c.life,timer:c.timer,face:c.face};}
    if(!['mid','exit','trial'].includes(s.rewardKind)||!Array.isArray(s.reward)||s.reward.length>3||new Set(s.reward).size!==s.reward.length||s.reward.some(id=>!K.rewardEligible(s,id))||(s.mode==='reward'&&s.reward.length!==3)||(s.pendingRelic!==null&&(!s.reward.includes(s.pendingRelic)||!K.RELICS.some(r=>r.id===s.pendingRelic)||s.relics.length!==3)))fail();
    if(s.mode==='reward'&&s.rewardKind==='trial'&&canonical.trial?.state!=='cleared')fail();
    if((s.mode==='dead'&&p.hp!==0)||(p.hp===0&&s.mode!=='dead')||(s.mode==='won'&&(s.stage!==3||canonical.enemies[0].hp!==0)))fail();
    let ring=null,silk=null;
    if(s.ring!==null){const r=s.ring;if(!r||!K.isRanged(s)||!number(r.x,-100,canonical.width+100)||!number(r.y,-200,650)||!number(r.vx,-900,900)||!number(r.vy,-900,900)||!number(r.life,0,4)||!number(r.distance,0,5000)||!['out','back'].includes(r.phase)||![360,430].includes(r.range)||typeof r.flared!=='boolean')fail();for(const key of ['hitOut','hitBack'])if(!Array.isArray(r[key])||r[key].length>50||new Set(r[key]).size!==r[key].length||r[key].some(x=>typeof x!=='string'||!/^([es][0-9]+)$/.test(x)))fail();ring={x:r.x,y:r.y,w:22,h:22,vx:r.vx,vy:r.vy,life:r.life,distance:r.distance,phase:r.phase,range:r.range,flared:r.flared,hitOut:r.hitOut.slice(),hitBack:r.hitBack.slice()};}
    if(s.silk!==null){const c=s.silk;if(!c||!K.isRanged(s)||!number(c.x,0,canonical.width)||!number(c.y,-1000,1000)||![180,240].includes(c.w)||!number(c.life,0,3)||![-1,1].includes(c.face))fail();silk={x:c.x,y:c.y,w:c.w,h:72,life:c.life,face:c.face};}
    const signature=K.readSignature(s,p,canonical,number,fail);
    const warrior=K.readWarrior(s,canonical,number,fail);
    const celestial=K.readCelestial(s,canonical,number,fail);
    const restored=K.newRun(s.seed,null,s.hero,difficulty);K.enterRoom(restored,s.stage,true);
    for(const key of ['time','elapsed','roomTime','kills','broken','damageTaken','lastDamage','hitstop','shake','checkpoint','combo','comboTime','serial','rewardKind','pendingRelic'])restored[key]=s[key];
    Object.assign(restored,warrior);restored.celestial=celestial;restored.arm=signature.arm;restored.flight=signature.flight;restored.ring=ring;restored.silk=silk;restored.player={...p,w:24,h:44};restored.growth={...s.growth};restored.talisman=s.talisman?{id:s.talisman.id,charges:s.talisman.charges}:null;restored.casts=s.casts.map(c=>({x:c.x,y:c.y,w:c.w,h:c.h,timer:c.timer}));restored.room=canonical;restored.world={rescue:s.world.rescue,bridge:s.world.bridge,bell:s.world.bell};restored.journal=s.journal.slice();restored.dangers=s.dangers.map(d=>({x:d.x,y:d.y,w:d.w,h:d.h,life:d.life,damage:d.damage,source:d.source}));K.applyWorld(restored);restored.relics=s.relics.slice();restored.reward=s.reward.slice();restored.clone=clone;restored.projectiles=projectiles;restored.hints=s.hints.slice();restored.mode=s.mode==='playing'?'paused':s.mode;
    restored.runId=typeof s.runId==='string'?s.runId.slice(0,100):s.seed+':imported';
    for(const key of Object.keys(restored.stats)){if(!number(s.stats?.[key],0,1e7))fail();restored.stats[key]=s.stats[key];}
    return {state:restored,meta:K.cleanMeta(data.meta)};
  };
  K.pack=(state,meta)=>JSON.stringify({game:'black-lotus',schema:9,build:K.VERSION,state,meta:K.cleanMeta(meta)});
  K.download=function(raw,name){const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  K.Storage=class{
    constructor(){this.available=true;this.error='';this.legacy=null;try{for(const key of[LEGACY,PREVIOUS,THIRD,FOURTH,FIFTH,SIXTH,SEVENTH,EIGHTH]){const raw=localStorage.getItem(key);if(raw&&raw.length<1000000){const x=JSON.parse(raw);if(x.game==='black-lotus'&&[1,2,3,4,5,6,7,8].includes(x.state?.version)&&x.schema===x.state.version)this.legacy=x;}}}catch{this.available=false;}}
    read(){try{const raw=localStorage.getItem(KEY);if(!raw)return null;if(raw.length>1000000)fail();return K.validSave(JSON.parse(raw));}catch(e){this.error=e.message;return null;}}
    write(state,meta){try{localStorage.setItem(KEY,K.pack(state,meta));this.available=true;return true;}catch{this.available=false;return false;}}
    export(state,meta){K.download(K.pack(state,meta),'劫后行-v9-'+(state.difficulty==='challenge'?'重劫-':'')+state.seed+'.json');}
    import(raw){if(raw.length>1000000)throw new Error('存档文件过大。');return K.validSave(JSON.parse(raw));}
    readSettings(){try{const x=JSON.parse(localStorage.getItem(SETTINGS)||'{}');return {volume:number(x.volume,0,1)?x.volume:.25,shake:typeof x.shake==='boolean'?x.shake:!matchMedia('(prefers-reduced-motion: reduce)').matches};}catch{return{volume:.25,shake:false};}}
    settings(value){try{localStorage.setItem(SETTINGS,JSON.stringify(value));}catch{}}
  };
})(globalThis.Kong ||= {});
