(function(K){
  'use strict';
  const KEY='kong.black-lotus.v2',LEGACY='kong.black-lotus.v1',SETTINGS='kong.black-lotus.settings.v2';
  const number=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
  const fail=()=>{throw new Error('存档数据不完整或已损坏，请保留原文件。');};
  const count=v=>Number.isFinite(Number(v))?Math.max(0,Math.min(1e7,Math.floor(Number(v)))):0;
  K.cleanMeta=function(m){
    return {runs:count(m?.runs),wins:count(m?.wins),best:Math.min(4,count(m?.best)),history:Array.isArray(m?.history)?m.history.filter(x=>x&&typeof x.id==='string'&&typeof x.seed==='string').slice(-8).map(x=>({id:x.id.slice(0,100),seed:x.seed.slice(0,32),won:!!x.won,stage:Math.min(3,count(x.stage)),seconds:count(x.seconds),damage:count(x.damage),relics:Array.isArray(x.relics)?x.relics.filter(id=>K.RELICS.some(r=>r.id===id)).slice(0,3):[]})):[]};
  };
  K.validSave=function(data){
    if(data?.game==='black-lotus'&&data.schema===1){const error=new Error('这是v1旅程，请在保留的原版中继续。');error.legacy=true;throw error;}
    if(!data||data.schema!==2||data.game!=='black-lotus'||!data.state)throw new Error('这不是劫后行v2存档。');
    const s=data.state;
    if(s.version!==2||s.rules!==2||!Number.isInteger(s.stage)||s.stage<0||s.stage>3||typeof s.seed!=='string'||s.seed.length>32||!['playing','paused','reward','dead','won'].includes(s.mode))fail();
    if(!Array.isArray(s.relics)||s.relics.length>3||new Set(s.relics).size!==s.relics.length||s.relics.some(id=>!K.RELICS.some(r=>r.id===id)))fail();
    const canonical=K.makeRoom(s.seed,s.stage),p=s.player;
    if(!p||!number(p.hp,0,100)||!number(p.focus,0,100)||!number(p.x,0,canonical.width)||!number(p.y,-1000,1000)||!number(p.vx,-2000,2000)||!number(p.vy,-2000,2000)||![-1,1].includes(p.face))fail();
    for(const key of ['coyote','buffer','invuln','dash','dashCD','attack','landing','drop','hurt','attackBuffer'])if(!number(p[key],0,5))fail();
    if(typeof p.grounded!=='boolean'||typeof p.slam!=='boolean'||!Number.isInteger(p.airJumps)||p.airJumps<0||p.airJumps>1||!Number.isInteger(p.comboIndex)||p.comboIndex<0||p.comboIndex>3||!number(p.attackId,0,1e7)||!Array.isArray(p.attackTargets)||p.attackTargets.length>40||p.attackTargets.some(x=>typeof x!=='string')||(p.attack>0&&!number(p.attackDuration,.1,1)))fail();
    for(const key of ['time','elapsed','roomTime','kills','broken','damageTaken','hitstop','shake','checkpoint','combo','comboTime','serial'])if(!number(s[key],0,1e8))fail();
    if(s.broken>6||s.checkpoint>canonical.width||s.combo>3||typeof s.lastDamage!=='string'||s.lastDamage.length>100||!Array.isArray(s.hints)||s.hints.length>30||s.hints.some(x=>typeof x!=='string'||x.length>50))fail();
    if(!s.room||!Array.isArray(s.room.enemies)||s.room.enemies.length!==canonical.enemies.length||!Array.isArray(s.room.seals)||s.room.seals.length!==canonical.seals.length||!Array.isArray(s.room.pickups)||s.room.pickups.length!==canonical.pickups.length||typeof s.room.midClaimed!=='boolean')fail();
    const phases=['idle','windup','attack','recover','sweep-windup','orb-windup','sweep','shift-windup','shift'];
    canonical.enemies.forEach((e,i)=>{
      const x=s.room.enemies[i];if(!x||x.id!==e.id||x.kind!==e.kind||!number(x.hp,0,e.maxHp)||!number(x.x,0,canonical.width)||!number(x.y,-200,540)||!number(x.timer,-2,10)||!number(x.stun,0,2)||!number(x.flash,0,2)||!number(x.interruptLock,0,2)||!number(x.attacks,0,1e7)||![-1,1].includes(x.face)||!phases.includes(x.phase))fail();
      for(const key of ['hp','x','y','timer','stun','flash','interruptLock','attacks','face','phase','struck'])e[key]=x[key];
      if(x.shiftTo!==undefined){if(!number(x.shiftTo,0,960))fail();e.shiftTo=x.shiftTo;}
      if(x.aimX!==undefined){if(!number(x.aimX,-200,canonical.width+200)||!number(x.aimY,-1000,1000))fail();e.aimX=x.aimX;e.aimY=x.aimY;}
    });
    canonical.seals.forEach((q,i)=>{const x=s.room.seals[i];if(!x||!number(x.hp,0,56)||!number(x.pulse,0,4)||typeof x.warning!=='boolean')fail();q.hp=x.hp;q.pulse=x.pulse;q.warning=x.warning;});
    canonical.pickups.forEach((q,i)=>q.used=!!s.room.pickups[i].used);canonical.midClaimed=s.room.midClaimed;
    if(!Array.isArray(s.projectiles)||s.projectiles.length>100)fail();
    const projectiles=s.projectiles.map(b=>{
      for(const [key,min,max]of[['x',-200,canonical.width+200],['y',-2000,2000],['vx',-2000,2000],['vy',-2000,2000],['life',0,10],['w',1,100],['h',1,100]])if(!number(b[key],min,max))fail();
      if(typeof b.friendly!=='boolean'||(b.damage!==undefined&&!number(b.damage,1,100))||(b.hit!==undefined&&(!Array.isArray(b.hit)||b.hit.length>100||b.hit.some(x=>!Number.isInteger(x)))))fail();
      return {x:b.x,y:b.y,vx:b.vx,vy:b.vy,life:b.life,w:b.w,h:b.h,friendly:b.friendly,damage:b.damage,hit:b.hit};
    });
    let clone=null;if(s.clone){const c=s.clone;if(!number(c.x,0,canonical.width)||!number(c.y,-1000,1000)||!number(c.life,0,4)||!number(c.timer,-1,1)||![-1,1].includes(c.face))fail();clone={x:c.x,y:c.y,w:24,h:44,life:c.life,timer:c.timer,face:c.face};}
    if(!['mid','exit'].includes(s.rewardKind)||!Array.isArray(s.reward)||s.reward.length>3||s.reward.some(id=>!K.relic(id)||(id!=='rest'&&s.relics.includes(id)))||(s.mode==='reward'&&s.reward.length!==3)||(s.pendingRelic!==null&&!s.reward.includes(s.pendingRelic)))fail();
    if((s.mode==='dead'&&p.hp!==0)||(p.hp===0&&s.mode!=='dead')||(s.mode==='won'&&(s.stage!==3||canonical.enemies[0].hp!==0)))fail();
    const restored=K.newRun(s.seed,null);K.enterRoom(restored,s.stage,true);
    for(const key of ['time','elapsed','roomTime','kills','broken','damageTaken','lastDamage','hitstop','shake','checkpoint','combo','comboTime','serial','rewardKind','pendingRelic'])restored[key]=s[key];
    restored.player={...p,w:24,h:44};restored.room=canonical;restored.relics=s.relics.slice();restored.reward=s.reward.slice();restored.clone=clone;restored.projectiles=projectiles;restored.hints=s.hints.slice();restored.mode=s.mode==='playing'?'paused':s.mode;
    restored.runId=typeof s.runId==='string'?s.runId.slice(0,100):s.seed+':imported';
    for(const key of Object.keys(restored.stats)){if(!number(s.stats?.[key],0,1e7))fail();restored.stats[key]=s.stats[key];}
    return {state:restored,meta:K.cleanMeta(data.meta)};
  };
  K.pack=(state,meta)=>JSON.stringify({game:'black-lotus',schema:2,build:K.VERSION,state,meta:K.cleanMeta(meta)});
  K.download=function(raw,name){const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  K.Storage=class{
    constructor(){this.available=true;this.error='';this.legacy=null;try{const raw=localStorage.getItem(LEGACY);if(raw&&raw.length<1000000){const x=JSON.parse(raw);if(x.game==='black-lotus'&&x.schema===1)this.legacy=x;}}catch{}}
    read(){try{const raw=localStorage.getItem(KEY);if(!raw)return null;if(raw.length>1000000)fail();return K.validSave(JSON.parse(raw));}catch(e){this.error=e.message;return null;}}
    write(state,meta){try{localStorage.setItem(KEY,K.pack(state,meta));this.available=true;return true;}catch{this.available=false;return false;}}
    export(state,meta){K.download(K.pack(state,meta),'劫后行-v2-'+state.seed+'.json');}
    import(raw){if(raw.length>1000000)throw new Error('存档文件过大。');return K.validSave(JSON.parse(raw));}
    readSettings(){try{const x=JSON.parse(localStorage.getItem(SETTINGS)||'{}');return {volume:number(x.volume,0,1)?x.volume:.25,shake:typeof x.shake==='boolean'?x.shake:!matchMedia('(prefers-reduced-motion: reduce)').matches};}catch{return{volume:.25,shake:false};}}
    settings(value){try{localStorage.setItem(SETTINGS,JSON.stringify(value));}catch{}}
  };
})(globalThis.Kong ||= {});
