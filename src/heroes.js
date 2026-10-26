(function(K){
  'use strict';
  K.HEROES=[{id:'wukong',name:'孙悟空',title:'近身破势 · 棍影应劫',text:'U蓄伸金箍棒、棍尖破盾，S松开借地撑跃。',skill:'法天象地'},{id:'nezha',name:'哪吒',title:'远程回环 · 莲火应援',text:'U驭风火轮换高度，掷环去回两击，收轮躲空印。',skill:'莲火轮阵'}];
  K.isRanged=s=>s.hero==='nezha';K.heroDef=s=>K.HEROES.find(h=>h.id===s?.hero)||K.HEROES[0];
  const baseReward=K.reward;
  const copies={
    cloud:['凌云踵','空中可再跳一次；空掷射程增加70，轮火增至1.5秒。踩敌重置腾跃。','空中仍会被莲焰命中，飞环回来前不能再掷。'],
    echo:['缚莲绫','混天绫范围增至240，驻留3秒，结束返还15定力仍需护生灯。','每次50定力；绫只能减缓位移，敌人仍会出招。'],
    staff:['破甲环','回程乾坤圈提升为28伤害、破盾并打断普通蓄力。','去程仍可被盾挡；必须安排回程路线。'],
    'staff-wave':['折返莲焰','乾坤圈折返处迸出12伤害莲焰，可破附近阵眼。','折返点由射程决定；提前碰盾折返也会触发。'],
    'clone-burst':['散绫诀','混天绫结束爆开，造成24伤害并打断附近敌人。','须将敌人留在绫缚区域附近。'],
    'ultimate-echo':['莲轮余烬','莲火轮阵追加32伤害余烬。','须完成收招；受伤会打断后续余烬。'],
    mercy:['护生灯','破阵恢复12生命；混天绫结束返还15定力。','需要主动破阵或完成一次绫缚。']
  };
  K.reward=(id,s)=>{const r=baseReward(id),c=K.isRanged(s||{})&&copies[id];return c?{...r,name:c[0],text:c[1],cost:c[2],tag:({cloud:'腾空掷环',echo:'绫缚控位',staff:'回环破甲','staff-wave':'折返控场','clone-burst':'绫终爆破','ultimate-echo':'大招余烬',mercy:'破阵续航'}[id])}:r;};
  K.newRing=function(s,a){const p=s.player,x=p.x+12,y=p.y+17;let dx=p.face,dy=0;
    if(a.aimPoint){dx=a.aimPoint.x-x;dy=a.aimPoint.y-y;const n=Math.hypot(dx,dy)||1;dx/=n;dy/=n;}
    s.ring={x:x-11,y:y-11,w:22,h:22,vx:dx*720,vy:dy*720,distance:0,phase:'out',life:4,hitOut:[],hitBack:[],range:360+(!p.grounded&&K.has(s,'cloud')?70:0),flared:false};
    K.event(s,'ring-throw');K.effect(s,'ring-launch',x,y,{face:p.face});
  };
  K.startRangedAttack=function(s,a){const p=s.player;if(s.ring||p.ringCD>0)return;p.attack=.38;p.attackDuration=.38;p.attackTargets=[];p.attackId++;p.comboIndex=1;p.ringAim=a.aimPoint?{...a.aimPoint}:null;K.event(s,'swing',{combo:1,hero:'nezha'});};
  K.stepRangedAttack=function(s,dt){const p=s.player;if(p.attack<=0)return;if(p.attackDuration-p.attack>=.14&&!p.attackTargets.includes('ring')){p.attackTargets.push('ring');K.newRing(s,{aimPoint:p.ringAim});}p.attack=Math.max(0,p.attack-dt);};
  K.castSilk=function(s){const p=s.player,cost=K.has(s,'echo')?50:40;if(s.silk||p.focus<cost){if(p.focus<cost)K.event(s,'empty-focus');return;}
    p.focus-=cost;s.stats.focusSpent+=cost;s.stats.clones++;const w=K.has(s,'echo')?240:180;
    s.silk={x:K.clamp(p.face>0?p.x:p.x+24-w,0,s.room.width-w),y:p.y-12,w,h:72,life:K.has(s,'echo')?3:1.8,face:p.face};K.strike(s,s.silk,12,p.x+12,true,[],'heavy');K.effect(s,'silk-cast',p.x+12,p.y+22,{face:p.face});K.event(s,'silk');
  };
  K.enemySpeed=(s,e)=>s.silk&&!K.isMajor(e)&&K.overlap(s.silk,e)?.35:1;
  K.turnRing=function(s){const r=s.ring;if(!r||r.phase==='back')return;r.phase='back';K.event(s,'ring-turn',{x:r.x,y:r.y});
    if(K.rank(s,'staff-wave')&&!r.flared){r.flared=true;K.strike(s,{x:r.x-53,y:r.y-25,w:128,h:74},12,r.x+11,true,[],'ring');K.effect(s,'ring',r.x+11,r.y+11,{fire:true});}
  };
  K.stepRanged=function(s,dt){if(s.mode!=='playing')return;const p=s.player;
    if(s.silk){s.silk.life-=dt;if(s.silk.life<=0){const c=s.silk;if(K.has(s,'mercy'))p.focus=Math.min(100,p.focus+15);if(K.rank(s,'clone-burst')){K.strike(s,c,24,c.x+c.w/2,true,[],'heavy');K.effect(s,'ring',c.x+c.w/2,c.y+c.h,{fire:true});}s.silk=null;}}
    const r=s.ring;if(!r)return;r.life-=dt;const oldX=r.x;
    if(r.phase==='back'){const dx=p.x+12-r.x-11,dy=p.y+18-r.y-11,n=Math.hypot(dx,dy);if(n<23){s.ring=null;p.ringCD=.18;K.event(s,'ring-catch');return;}r.vx=dx/n*850;r.vy=dy/n*850;}
    r.x+=r.vx*dt;r.y+=r.vy*dt;r.distance+=Math.hypot(r.vx,r.vy)*dt;
    const back=r.phase==='back',targets=back?r.hitBack:r.hitOut,damage=back?(K.has(s,'staff')?28:22):18,impact=back&&K.has(s,'staff')?'heavy':'ring';
    for(const e of s.room.enemies)if(e.hp>0&&!e.dormant&&K.overlap(r,e)&&!targets.includes('e'+e.id)){
      targets.push('e'+e.id);const hit=K.hitEnemy(s,e,damage,oldX+11,back&&K.has(s,'staff'),impact);if(hit){p.focus=Math.min(100,p.focus+6);if(Math.abs(e.x-p.x)>=150)s.stats.farHits++;}else if(!back)K.turnRing(s);
    }
    K.strike(s,r,damage,oldX+11,back&&K.has(s,'staff'),targets,impact);
    if(r.phase==='out'&&(r.distance>=r.range||r.x<8||r.x>s.room.width-30||r.y<0||r.y>500))K.turnRing(s);
    if(r.life<=0){s.ring=null;p.ringCD=.18;K.event(s,'ring-catch');}
  };
  const baseUltimateBox=K.ultimateBox;K.ultimateBox=s=>K.isRanged(s)?{x:s.player.x-288,y:s.player.y-78,w:600,h:160}:baseUltimateBox(s);
  // Distant counterplay uses locked geometry and the enemy's current supporting ground.
  K.counterBounds=(s,e)=>{const p=s.room.platforms.find(q=>K.platformEnabled(q)&&q.x<=e.x+e.w/2&&q.x+q.w>=e.x+e.w/2&&Math.abs(q.y-e.baseY-e.h)<8);return p?{min:Math.max(p.x+4,e.origin-420),max:Math.min(p.x+p.w-e.w-4,e.origin+420)}:K.patrolBounds(s,e);};
  K.counterBox=e=>{const b=K.enemyAttackBox(e);return e.phase==='pursuit-windup'?{x:Math.min(b.x,b.x+e.counterTo-e.x),y:b.y,w:Math.abs(e.counterTo-e.x)+b.w,h:b.h}:b;};
  K.stepCounter=function(s,e,dt,target){
    if(K.isMajor(e))return false;const p=s.player,near=Math.abs(target.x-e.x),bounds=K.counterBounds(s,e);
    if(e.phase==='idle'&&e.timer<=0&&near>205&&near<(e.kind==='caster'?570:460)){
      e.face=Math.sign(target.x-e.x)||e.face;e.roamRange=420;
      if(e.kind==='blade'&&e.id%2===0){e.followup=false;e.phase='pursuit-windup';e.timer=.95;e.counterTo=K.clamp(e.x+e.face*Math.min(320,near-24),bounds.min,bounds.max);K.event(s,'warning',{kind:e.kind,id:e.id,move:'pursuit'});return true;}
      if(e.kind==='shield'){e.phase='advance';e.timer=1.05;K.event(s,'warning',{kind:e.kind,id:e.id,move:'advance'});return true;}
      if(e.kind==='caster'&&e.attacks%2===1){const cx=K.clamp(target.x+12,44,s.room.width-44);e.phase='cross-windup';e.timer=1.15;e.marks=[0,e.face*145].map(d=>({x:K.clamp(cx+d-34,8,s.room.width-76),y:300,w:68,h:140}));e.attacks++;K.event(s,'warning',{kind:e.kind,id:e.id,move:'cross'});return true;}
    }
    if(e.phase==='pursuit-windup'){if(e.timer<=0){e.phase='pursuit';e.timer=.55;K.event(s,'enemy-attack',{kind:e.kind,id:e.id,move:'pursuit'});}return true;}
    if(e.phase==='pursuit'){const dx=e.counterTo-e.x;e.x+=Math.sign(dx)*Math.min(Math.abs(dx),640*dt*K.enemySpeed(s,e));if(K.overlap(p,K.enemyAttackBox(e)))K.damage(s,12,'执刃魔兵·逐影突刺',e.face);if(e.timer<=0||Math.abs(dx)<2){e.phase='recover';e.timer=1.25;}return true;}
    if(e.phase==='advance'){e.x=K.clamp(e.x+e.face*110*dt*K.enemySpeed(s,e),bounds.min,bounds.max);if(e.timer<=0||near<95){e.phase='recover';e.timer=.65;}return true;}
    if(e.phase==='cross-windup'){if(e.timer<=0){for(const b of e.marks)s.dangers.push({...b,life:.38,damage:12,source:'莲灯使·交叉封位'});e.marks=[];e.phase='recover';e.timer=1.4;K.event(s,'enemy-attack',{kind:e.kind,id:e.id,move:'cross'});}return true;}
    return false;
  };
})(globalThis.Kong ||= {});
