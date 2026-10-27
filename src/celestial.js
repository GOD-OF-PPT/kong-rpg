(function(K){
  'use strict';
  K.ARTS=[
    {id:'sky-staff',hero:'wukong',name:'撑天坠击',tag:'拾取秘技 · C',text:'立棍撑天，升空后坠击当前画面内所有敌人，造成72伤害并破盾。',cost:'45定力 · 18秒冷却 · 须落地起势；升空和收招可受伤中断。',focus:45,cooldown:18,duration:1.3,color:'#f3cc78',icon:'staff'},
    {id:'orbit-staff',hero:'wukong',name:'回身棍阵',tag:'拾取秘技 · C',text:'金箍棒横向伸长，绕身旋舞，周围多段攻击并扫落范围内飞弹。',cost:'32定力 · 11秒冷却 · 每段12伤害，正面重盾仍能挡；步速减半，K可取消。',focus:32,cooldown:11,duration:1.65,color:'#e8b867',icon:'mirror'},
    {id:'six-arms',hero:'nezha',name:'三头六臂',tag:'拾取秘技 · C',text:'显化三头六臂5秒。枪法每次有效命中追加8伤害；仍可投环、驭轮和施展大招。',cost:'40定力 · 20秒冷却 · 化身不提供无敌，枪法和副环仍有原本代价。',focus:40,cooldown:20,duration:5,color:'#ef9363',icon:'flame'},
    {id:'eye-beam',hero:'erlang',name:'三目神光',tag:'拾取秘技 · C',text:'三目聚光，向前方目标射出620像素贯穿神光；四段各16伤害，穿透重盾。',cost:'38定力 · 14秒冷却 · 须落地蓄光0.32秒后锁定方向；引导中不能移动，受伤中断。',focus:38,cooldown:14,duration:1.22,color:'#98e4ee',icon:'echo'}
  ];
  K.artDef=id=>K.ARTS.find(r=>r.id===id);
  K.initCelestial=s=>{s.celestial||={owned:[],equipped:null,cooldown:0,cast:null,claimed:[],pending:null};};
  const run=K.newRun,enter=K.enterRoom;
  K.newRun=function(...args){const s=run(...args);K.initCelestial(s);return s;};
  K.enterRoom=function(s,...args){enter(s,...args);K.initCelestial(s);s.celestial.cast=null;s.celestial.pending=null;};
  K.artManuals=s=>K.ARTS.filter(a=>a.hero===s.hero).map((a,i)=>({id:s.stage+':'+i,art:a.id,x:230+i*145,y:418,w:26,h:26,used:s.celestial.claimed.includes(s.stage+':'+i)}));
  K.nearArtManual=s=>K.artManuals(s).filter(q=>!q.used&&Math.abs(s.player.x+12-q.x)<58&&Math.abs(s.player.y+44-q.y)<65).sort((a,b)=>Math.abs(a.x-s.player.x)-Math.abs(b.x-s.player.x))[0];
  K.equipArt=function(s,id){const a=K.artDef(id);if(!a||a.hero!==s.hero||!s.celestial.owned.includes(id)||s.celestial.cast)return false;s.celestial.equipped=id;return true;};
  K.learnArt=function(s,id){const a=K.artDef(id);if(!a||a.hero!==s.hero)return false;if(!s.celestial.owned.includes(id))s.celestial.owned.push(id);s.celestial.equipped=id;K.event(s,'art-learn',{id});return true;};
  K.chooseManual=function(s,learn){const q=K.artManuals(s).find(q=>q.id===s.celestial.pending&&!q.used);if(!q)return false;if(learn){K.learnArt(s,q.art);s.celestial.claimed.push(q.id);}s.celestial.pending=null;s.mode='playing';s.player.invuln=Math.max(s.player.invuln,.35);return true;};
  const journey=K.journeyInteract;K.journeyInteract=function(s){const q=K.nearArtManual(s);if(q&&!s.celestial.cast){K.cancelSignature(s);s.celestial.pending=q.id;s.mode='art-choice';K.event(s,'art-found',{id:q.art});return true;}return journey(s);};
  const reward=K.reward,eligible=K.rewardEligible,options=K.options,choose=K.choose;
  K.reward=(id,s)=>K.artDef(id)||reward(id,s);
  K.rewardEligible=(s,id)=>K.artDef(id)?K.artDef(id).hero===s.hero&&!s.celestial?.owned.includes(id):eligible(s,id);
  K.options=function(s){const ids=options(s),arts=K.ARTS.filter(a=>K.rewardEligible(s,a.id));if(arts.length)ids[1]=arts[(K.seedNumber(s.seed)+s.stage+(s.rewardKind==='mid'?1:0))%arts.length].id;return ids;};
  K.choose=function(s,id,...args){if(!K.artDef(id))return choose(s,id,...args);if(s.mode!=='reward'||!s.reward.includes(id)||!K.rewardEligible(s,id))return false;K.learnArt(s,id);if(['mid','trial'].includes(s.rewardKind)){if(s.rewardKind==='mid')s.room.midClaimed=true;else s.room.trial.state='claimed';s.reward=[];s.pendingRelic=null;s.mode='playing';s.player.invuln=Math.max(s.player.invuln,.5);}else K.enterRoom(s,s.stage+1,false);return true;};
  K.artBeamLine=function(s,c=s.celestial.cast){const ax=c.x+12,ay=c.y-16;return{ax,ay,bx:ax+c.face*Math.cos(c.angle)*620,by:ay+Math.sin(c.angle)*620};};
  K.artOrbitBox=s=>({x:s.player.x-148,y:s.player.y+3,w:320,h:43});
  K.startArt=function(s,viewX){const p=s.player,v=s.celestial,a=K.artDef(v.equipped);if(!a){K.event(s,'ability-note',{text:'先走近秘技卷按F拾取，再按C施展。'});return;}if(v.cast||v.cooldown>0||p.hurt>0||p.ultimate>0||p.dash>0)return;
    if(['sky-staff','eye-beam'].includes(a.id)&&!p.grounded){K.event(s,'ability-note',{text:'这式须借实地，落稳后再按C。'});return;}if(p.focus<a.focus){K.event(s,'empty-focus');return;}
    K.cancelSignature(s);p.focus-=a.focus;s.stats.focusSpent+=a.focus;p.attack=0;p.attackBuffer=0;p.slam=false;v.cooldown=a.cooldown;
    const target=s.room.enemies.filter(e=>e.hp>0&&!e.dormant&&(e.x+e.w/2-p.x)*p.face>20&&Math.abs(e.x-p.x)<620).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
    const angle=target?K.clamp(Math.atan2(target.y+8-(p.y-16),Math.abs(target.x+target.w/2-p.x-12)),-.38,.38):0;
    v.cast={id:a.id,age:0,x:p.x,y:p.y,face:p.face,viewX:K.clamp(Number.isFinite(viewX)?viewX:p.x-300,0,s.room.width-960),pulse:0,angle,echo:0};K.event(s,'art-start',{id:a.id});
  };
  // Main-weapon contact is an explicit strike context. Other abilities also
  // use "heavy", so the impact label alone must not grant six-arm followups.
  const mainStrikes=new WeakSet(),strike=K.strike;
  K.strike=function(s,b,n,origin,pierce,targets,impact){const main=targets===s.player.attackTargets&&s.player.attack>0,already=mainStrikes.has(s);if(main)mainStrikes.add(s);try{return strike(s,b,n,origin,pierce,targets,impact);}finally{if(!already)mainStrikes.delete(s);}};
  const hit=K.hitEnemy;K.hitEnemy=function(s,e,n,origin,pierce,impact){const landed=hit(s,e,n,origin,pierce,impact),c=s.celestial?.cast;if(landed&&c?.id==='six-arms'&&c.age>=.24&&mainStrikes.has(s)&&['light','heavy'].includes(impact)&&e.hp>0){K.hitEnemy(s,e,8,origin,false,'six-arms');c.echo=.15;K.effect(s,'six-strike',e.x+e.w/2,e.y+18,{duration:.2,face:s.player.face});}return landed;};
  const damage=K.damage;K.damage=function(s,...args){const yes=damage(s,...args);if(yes&&s.celestial&&(s.player.hp<=0||s.celestial.cast?.id!=='six-arms'))s.celestial.cast=null;return yes;};
  const signature=K.stepSignature;K.stepSignature=function(s,a,dt){if(s.celestial?.cast&&s.celestial.cast.id!=='six-arms'){K.cancelSignature(s);return;}return signature(s,a,dt);};
  const step=K.step;
  K.step=function(s,a={},dt=K.DT){
    if(s.mode!=='playing')return step(s,a,dt);const ticking=s.hitstop<=0;const previous=s.celestial.cast,action={...a};
    if(previous&&previous.id!=='six-arms'){
      if(a.dashPressed&&previous.id==='orbit-staff')s.celestial.cast=null;
      else{for(const k of ['attack','attackPressed','secondaryPressed','clonePressed','ultimatePressed','signature','signaturePressed','jump','jumpPressed','down'])action[k]=false;s.player.attackBuffer=0;s.player.buffer=0;if(previous.id!=='orbit-staff'){action.left=action.right=false;s.player.vx=0;}}
    }
    step(s,action,dt);if(s.mode!=='playing'||!ticking)return;const v=s.celestial,p=s.player;v.cooldown=Math.max(0,v.cooldown-dt);if(a.artPressed)K.startArt(s,a.viewX);
    const c=v.cast;if(!c)return;c.age+=dt;c.echo=Math.max(0,c.echo-dt);const def=K.artDef(c.id);
    if(c.id==='sky-staff'){
      const u=K.clamp((c.age-.18)/.42,0,1),fall=K.clamp((c.age-.78)/.24,0,1);p.x=c.x;p.y=c.y-230*(1-(1-u)**3)*(1-fall*fall);p.vx=p.vy=0;p.grounded=c.age<.18||c.age>=1.02;
      if(c.age>=1.02&&c.pulse===0){c.pulse=1;K.strike(s,{x:c.viewX,y:-200,w:960,h:1000},72,p.x+12,true,[],'ultimate');p.y=c.y;s.hitstop=Math.max(s.hitstop,.065);s.shake=.22;K.effect(s,'celestial-slam',c.viewX+480,p.y+44,{duration:.48,w:960});K.event(s,'art-impact',{id:c.id});}
    }else if(c.id==='orbit-staff'){
      if(c.age>=.22+c.pulse*.24&&c.pulse<5){c.pulse++;const b=K.artOrbitBox(s);K.strike(s,b,12,p.x+12,false,[],'art-spin');for(const bolt of s.projectiles)if(!bolt.friendly&&K.overlap(b,bolt))bolt.life=0;K.event(s,'art-pulse',{id:c.id});}
    }else if(c.id==='eye-beam'){
      c.x=p.x;c.y=p.y;p.face=c.face;if(c.age>=.32+c.pulse*.16&&c.pulse<4){c.pulse++;const line=K.artBeamLine(s);for(const e of s.room.enemies)if(e.hp>0&&!e.dormant&&K.lineHits(line,e,12))K.hitEnemy(s,e,16,line.ax,true,'beam');for(const q of s.room.seals)if(q.hp>0&&K.lineHits(line,q,12))K.hitSeal(s,q,16,line.ax,'beam');K.event(s,'art-pulse',{id:c.id});}
    }
    if(c.age>=def.duration)v.cast=null;
  };
  K.readCelestial=function(s,room,number,fail){const v=s.celestial;if(!v||!Array.isArray(v.owned)||v.owned.length>2||new Set(v.owned).size!==v.owned.length||v.owned.some(id=>K.artDef(id)?.hero!==s.hero)||(v.equipped!==null&&!v.owned.includes(v.equipped))||!number(v.cooldown,0,20)||!Array.isArray(v.claimed)||v.claimed.length>30||new Set(v.claimed).size!==v.claimed.length||v.claimed.some(x=>typeof x!=='string'||!/^(?:[0-9]|1[0-4]):([01])$/.test(x)||(s.hero!=='wukong'&&x.endsWith(':1'))))fail();
    if(v.pending!==null&&(!K.artManuals(s).some(q=>q.id===v.pending&&!q.used)||s.mode!=='art-choice'))fail();if(s.mode==='art-choice'&&v.pending===null)fail();
    if(v.cast!==null){const c=v.cast,def=K.artDef(c?.id);if(!def||def.hero!==s.hero||!v.owned.includes(c.id)||!number(c.age,0,def.duration)||!number(c.x,0,room.width)||!number(c.y,-1000,1000)||!number(c.viewX,0,room.width-960)||![-1,1].includes(c.face)||!number(c.angle,-.38,.38)||!Number.isInteger(c.pulse)||c.pulse<0||c.pulse>(c.id==='orbit-staff'?5:c.id==='eye-beam'?4:1)||!number(c.echo,0,.15)||(s.player.hp===0))fail();}
    return JSON.parse(JSON.stringify(v));
  };
})(globalThis.Kong ||= {});
