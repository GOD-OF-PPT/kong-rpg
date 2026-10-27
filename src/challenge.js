(function(K){
  'use strict';
  K.isChallenge=s=>s?.difficulty==='challenge';
  K.difficultyName=s=>(typeof s==='string'?s:s?.difficulty)==='challenge'?'挑战·黑莲重劫':'普通旅程';
  K.CHALLENGE_PHASES=['challenge-bolt-windup','challenge-quake-windup','challenge-mark-windup','challenge-echo-windup','challenge-fan-windup','challenge-bell-windup','challenge-rain-windup'];
  K.CHALLENGE_DANGERS=['重盾兵·崩盾震','莲灯使·追迹莲印','镇山魈王·回震','缄愿法使·余钟震','无天·追落莲印'];
  K.CHALLENGE_PROJECTILES=['执刃魔兵·封路刀气','渡厄灯魁·对渡焰'];
  const REINFORCEMENTS=[
    [['blade',650],['caster',1320],['shield',2300],['blade',3210],['shield',4320],['caster',5990]],
    [['blade',610],['shield',1330],['caster',2020],['blade',3200],['shield',4310],['caster',5390],['blade',5960]],
    [['blade',680],['shield',1400],['blade',2070],['caster',3180],['blade',4310],['shield',2510],['caster',5990]],
    [['caster',500],['blade',1110],['shield',1930]]
  ];
  const makeRoom=K.makeRoom;
  K.makeRoom=function(seed,stage,difficulty='normal'){
    const room=makeRoom(seed,stage);if(difficulty!=='challenge')return room;
    for(const [i,[kind,desired]]of REINFORCEMENTS[stage].entries()){
      const candidates=[desired];for(let d=24;d<=288;d+=24)candidates.push(desired+d,desired-d);
      const x=candidates.find(x=>room.platforms.some(p=>p.solid&&p.y===440&&x>=p.x+64&&x+26<=p.x+p.w-64)&&room.hazards.every(h=>x+26<h.x-60||x>h.x+h.w+60)&&room.enemies.every(e=>Math.abs(e.x-x)>=74));
      if(x===undefined)throw Error('No safe challenge reinforcement '+stage+':'+i);
      const e=K.enemy(kind,x,400,1000+i);e.style=kind==='blade'?'lunge':kind==='shield'?'rush':'sigil';e.trait=({blade:'twin',shield:'pulse',caster:'volley'})[kind];e.timer=.75;e.challengeReinforcement=true;room.enemies.push(e);
      const roll=K.rng(K.seedNumber(seed)+stage*119+e.id*977)(),type=roll<.29?'heal':roll<.55?'focus':'rage';
      room.pickups.push({x,y:420,w:16,h:20,kind:type,used:false,enabled:false,sourceId:e.id,amount:K.DROPS[type].amount});
    }
    for(const e of room.enemies)e.challengeCD=.4+(e.id%4)*.35;
    room.signs[0].text='黑莲重劫：援兵结阵。刀气可跳避或返弹，盾震可跃过，双印需两次判断。';
    return room;
  };
  const isSpecial=e=>K.CHALLENGE_PHASES.includes(e.phase);
  const targetMark=(s,target,w=80,h=80)=>({x:K.clamp(target.x+12-w/2,8,s.room.width-w-8),y:K.clamp(target.y-10,170,440-h),w,h});
  const groundMark=(s,e,w=220)=>{const x=K.clamp(e.x+e.w/2-w/2,8,s.room.width-w-8);return{x,y:K.surfaceAt(s,e.x+e.w/2,e.y+e.h-4)-26,w,h:26};};
  function begin(s,e,phase,time,marks=[]){e.phase=phase;e.timer=time;e.marks=marks;K.event(s,K.isMajor(e)?'boss-warning':'warning',{id:e.id,kind:e.kind,move:phase});}
  function recover(e,time=1.3){e.phase='recover';e.timer=time;e.marks=[];}
  K.challengeBladeRay=e=>{const ax=e.x+e.w/2,ay=e.y+18,dx=e.aimX-ax,dy=e.aimY-ay,n=Math.hypot(dx,dy)||1;return{ax,ay,bx:ax+dx/n*445.5,by:ay+dy/n*445.5,vx:dx/n*330,vy:dy/n*330};};
  K.challengeWarningBoxes=e=>isSpecial(e)?(e.marks||[]):[];
  K.challengePhaseText=e=>({
    'challenge-bolt-windup':'封路刀气 · 跳避或返弹',
    'challenge-quake-windup':e.kind==='warden'?'冲后回震 · 再看地线':'崩盾震 · 起跳或打断',
    'challenge-mark-windup':'追迹一印 · 移开锁定区',
    'challenge-echo-windup':'追迹二印 · 重新判断落点',
    'challenge-fan-windup':'对渡焰 · 跃起或返弹',
    'challenge-bell-windup':'余钟震 · 离地避浪',
    'challenge-rain-windup':'追落莲印 · 再移出印区'
  })[e.phase]||'';
  const stepCounter=K.stepCounter;
  K.stepCounter=function(s,e,dt,target){
    if(!K.isChallenge(s))return stepCounter(s,e,dt,target);
    e.challengeCD=Math.max(0,e.challengeCD-dt);
    if(isSpecial(e)){
      if(e.timer>0)return true;
      const phase=e.phase,marks=e.marks||[];
      if(phase==='challenge-bolt-windup'){
        const r=K.challengeBladeRay(e);s.projectiles.push({x:r.ax-14,y:r.ay-6,vx:r.vx,vy:r.vy,w:28,h:12,life:1.35,friendly:false,source:'执刃魔兵·封路刀气'});recover(e,1.2);
      }else if(phase==='challenge-fan-windup'){
        for(const [i,b]of marks.entries())s.projectiles.push({x:i===0?b.x:b.x+b.w-18,y:b.y+2,w:18,h:12,vx:i===0?220:-220,vy:0,life:1.55,friendly:false,source:'渡厄灯魁·对渡焰'});recover(e,1.7);
      }else{
        const source=phase==='challenge-quake-windup'?(e.kind==='warden'?'镇山魈王·回震':'重盾兵·崩盾震'):phase==='challenge-bell-windup'?'缄愿法使·余钟震':phase==='challenge-rain-windup'?'无天·追落莲印':'莲灯使·追迹莲印';
        for(const b of marks)s.dangers.push({...b,life:.3,damage:K.isMajor(e)?16:12,source});
        if(phase==='challenge-mark-windup')begin(s,e,'challenge-echo-windup',.75,[targetMark(s,target)]);else recover(e,K.isMajor(e)?1.7:1.4);
      }
      K.event(s,'enemy-attack',{id:e.id,kind:e.kind,move:phase});return true;
    }
    const p=s.player,near=Math.abs(target.x-e.x),inView=e.x>=p.x-260&&e.x<=p.x+520;
    // At most two new specials may wind up together. Ordinary attacks retain
    // their own timings; every special commits its geometry before release.
    if(!K.isMajor(e)&&e.phase==='idle'&&e.timer<=0&&e.challengeCD===0&&inView&&s.room.enemies.filter(q=>q!==e&&q.hp>0&&isSpecial(q)).length<2){
      if(e.kind==='blade'&&near>=135&&near<470){e.aimX=target.x+12;e.aimY=target.y+20;e.face=Math.sign(target.x-e.x)||e.face;e.challengeCD=6;begin(s,e,'challenge-bolt-windup',.85);return true;}
      if(e.kind==='shield'&&near<155&&Math.abs(target.y-e.y)<90){e.challengeCD=6;begin(s,e,'challenge-quake-windup',.95,[groundMark(s,e)]);return true;}
      if(e.kind==='caster'&&near<500){e.challengeCD=7;begin(s,e,'challenge-mark-windup',.95,[targetMark(s,target)]);return true;}
    }
    return stepCounter(s,e,dt,target);
  };
  const stepEnemy=K.stepEnemy;
  K.stepEnemy=function(s,e,dt,oldY){
    const previous=e.phase;stepEnemy(s,e,dt,oldY);
    if(!K.isChallenge(s)||e.hp<=0||e.dormant||s.mode!=='playing'||e.phase!=='recover')return;
    if(e.kind==='warden'){
      if(previous==='warden-rush'&&e.move==='charge')begin(s,e,'challenge-quake-windup',.7,[groundMark(s,e,240)]);
      if(previous==='warden-windup'&&e.move==='fan'){
        const a=s.room.arena;begin(s,e,'challenge-fan-windup',.85,[{x:a.min+8,y:408,w:359,h:16},{x:a.max-26-341,y:408,w:359,h:16}]);
      }
      if(previous==='warden-windup'&&e.move==='columns')begin(s,e,'challenge-bell-windup',.8,[groundMark(s,e,410)]);
    }else if(e.kind==='boss'&&previous==='rain-windup'){
      const target=s.clone&&Math.abs(s.clone.x-e.x)<380?s.clone:s.player,base=targetMark(s,target,80,60),offsets=s.world.bell?[0]:[0,e.face*130];
      begin(s,e,'challenge-rain-windup',.8,offsets.map(dx=>({...base,x:K.clamp(base.x+dx,s.room.arena.min,s.room.arena.max-base.w)})));
    }
  };
})(globalThis.Kong ||= {});
