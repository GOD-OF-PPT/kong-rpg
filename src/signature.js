(function(K){
  'use strict';
  K.wheelMax=s=>K.has(s,'cloud')?1.5:1.25;
  K.cancelSignature=function(s,chargeOnly=false){
    if(s.arm&&(!chargeOnly||s.arm.phase==='charge')){s.arm=null;s.player.armCD=Math.max(s.player.armCD,.3);}
    if(!chargeOnly&&s.flight){s.flight=null;K.event(s,'wheel-stop');}
  };
  K.signatureRange=s=>100+220*Math.min(1,(s.arm?.charge||0)/.6);
  K.staffLine=function(s){
    const p=s.player,a=s.arm,face=a?.face||p.face,hand=({charge:[10,6],thrust:[57,2],recover:[12,-2],vault:[29,13]})[a?.phase]||[22,14],ax=p.x+12+face*hand[0],ay=p.y+hand[1];
    if(a?.phase==='vault'&&a.contact)return{ax,ay,bx:a.contact.x,by:a.contact.y};
    let length=30;
    if(a?.phase==='charge')length=30+a.charge/.6*22;
    if(a?.phase==='thrust')length=K.signatureRange(s)*Math.min(1,(.18-a.timer)/.065);
    if(a?.phase==='recover')length=30+(K.signatureRange(s)-30)*Math.max(0,a.timer/.24);
    return{ax,ay,bx:ax+face*length,by:ay};
  };
  // Segment vs expanded AABB: the visible rod has the same 8px collision width.
  K.lineHits=function(l,b,pad=4){
    let lo=0,hi=1;const dx=l.bx-l.ax,dy=l.by-l.ay;
    for(const [start,delta,min,max]of [[l.ax,dx,b.x-pad,b.x+b.w+pad],[l.ay,dy,b.y-pad,b.y+b.h+pad]]){
      if(Math.abs(delta)<1e-8){if(start<min||start>max)return false;}
      else{const a=(min-start)/delta,z=(max-start)/delta;lo=Math.max(lo,Math.min(a,z));hi=Math.min(hi,Math.max(a,z));if(lo>hi)return false;}
    }return true;
  };
  K.findPoleGround=function(s){
    const p=s.player,a=s.arm,reach=K.signatureRange(s),ax=p.x+12,ay=p.y+20,dx=a.face*reach*.32,dy=reach*.9;
    return s.room.platforms.filter(q=>K.platformEnabled(q)).map(q=>{const t=(q.y-ay)/dy;return{q,t,x:ax+dx*t,y:q.y};}).filter(v=>v.t>=0&&v.t<=1&&v.x>=v.q.x+3&&v.x<=v.q.x+v.q.w-3).sort((a,b)=>a.t-b.t)[0]||null;
  };
  K.releaseStaff=function(s,down){
    const p=s.player,a=s.arm;a.face=p.face;a.timer=.18;a.phase='thrust';a.requiresHold=false;
    if(down){const contact=!p.vaultUsed&&K.findPoleGround(s);a.phase='vault';a.timer=.22;a.contact=contact?{x:contact.x,y:contact.y}:null;a.launched=false;
      if(!contact)K.event(s,'ability-note',{text:p.vaultUsed?'本次腾空已撑跃，落地后再借力。':'棍端未触及实地，无法撑跃。'});
    }else K.event(s,'staff-extend',{charge:a.charge,range:K.signatureRange(s)});
  };
  K.stepSignature=function(s,a,dt){
    const p=s.player; p.armCD=Math.max(0,p.armCD-dt);p.vaultTime=Math.max(0,p.vaultTime-dt);
    p.wheelFuel=Math.min(K.wheelMax(s),p.wheelFuel);
    if(p.grounded&&!s.arm&&!s.flight){p.groundTime=Math.min(.5,p.groundTime+dt);if(p.groundTime>=.15){p.vaultUsed=false;if(!a.signature)p.wheelFuel=Math.min(K.wheelMax(s),p.wheelFuel+dt*4);}}
    else p.groundTime=0;
    if(p.hurt>0||p.ultimate>0){K.cancelSignature(s);return;}
    if(K.isRanged(s)){
      if(a.signaturePressed&&p.focus<8&&!s.flight)K.event(s,'empty-focus');
      if(!a.signature)p.wheelReady=true;
      if(s.flight&&(!a.signature||a.dashPressed||(a.down&&(a.attack||a.attackPressed))))K.cancelSignature(s);
      if(!s.flight&&a.signature&&p.wheelReady&&p.wheelFuel>.08&&p.focus>=8&&!p.slam&&!p.dash){p.focus-=8;s.stats.focusSpent+=8;p.wheelReady=false;s.flight={age:0};p.attackBuffer=0;if(p.grounded)p.vy=-240;K.event(s,'wheel-start');s.stats.flights++;}
      if(s.flight){
        if(p.wheelFuel<=dt||p.focus<20*dt){K.cancelSignature(s);p.wheelReady=false;K.event(s,'ability-note',{text:p.wheelFuel<=dt?'轮火已尽，松开U落地回充。':'定力不足，收轮。'});}
        else{s.flight.age+=dt;p.wheelFuel=Math.max(0,p.wheelFuel-dt);p.focus-=20*dt;s.stats.focusSpent+=20*dt;a.jumpPressed=false;p.buffer=0;}
      }
      return;
    }
    if(s.arm&&a.dashPressed){K.cancelSignature(s);return;}
    if(!s.arm&&a.signature&&p.armCD===0&&!p.slam&&!p.dash&&p.attack<=0){
      if(p.focus<10){if(a.signaturePressed)K.event(s,'empty-focus');return;}
      p.focus-=10;s.stats.focusSpent+=10;p.attackBuffer=0;s.arm={phase:'charge',charge:0,timer:0,face:p.face,targets:[],contact:null,launched:false,requiresHold:false};s.stats.extends++;
    }
    const arm=s.arm;if(!arm)return;
    if(arm.phase==='charge'){
      if(arm.requiresHold){if(!a.signature){K.cancelSignature(s,true);return;}arm.requiresHold=false;}
      if(!a.signature)K.releaseStaff(s,!!a.down);
      else{arm.face=p.face;const drain=(arm.charge<.6?24:4)*dt;if(p.focus<drain)K.releaseStaff(s,!!a.down);else{p.focus-=drain;s.stats.focusSpent+=drain;arm.charge=Math.min(.6,arm.charge+dt);}}
    }else if(arm.phase==='thrust'){
      arm.timer=Math.max(0,arm.timer-dt);
      if(.18-arm.timer>=.065&&arm.timer>=.025){
        const line=K.staffLine(s),width=K.has(s,'staff')?70:42,tip={...line,ax:line.bx-arm.face*width},charged=arm.charge>=.3;
        for(const e of s.room.enemies)if(e.hp>0&&!e.dormant&&!arm.targets.includes('e'+e.id)&&K.lineHits(line,e)){
          arm.targets.push('e'+e.id);const sweet=charged&&K.lineHits(tip,e);K.hitEnemy(s,e,sweet?34:16,line.ax,sweet,sweet?'heavy':'light');if(sweet){s.stats.tipHits++;K.event(s,'staff-tip',{id:e.id});K.effect(s,'staff-tip',e.x+e.w/2,e.y+18);}
        }
        for(const q of s.room.seals)if(q.hp>0&&!arm.targets.includes('s'+q.id)&&K.lineHits(line,q)){arm.targets.push('s'+q.id);K.hitSeal(s,q,charged&&K.lineHits(tip,q)?34:16,line.ax,'heavy');}
      }
      if(arm.timer===0){arm.phase='recover';arm.timer=.24;}
    }else if(arm.phase==='vault'){
      arm.timer=Math.max(0,arm.timer-dt);
      if(!arm.launched&&arm.timer<=.14){
        arm.launched=true;const q=arm.contact&&s.room.platforms.find(q=>K.platformEnabled(q)&&Math.abs(q.y-arm.contact.y)<1&&arm.contact.x>=q.x&&arm.contact.x<=q.x+q.w);
        if(q){p.vy=-620-140*arm.charge/.6;p.vx=arm.face*(180+100*arm.charge/.6);p.grounded=false;p.coyote=0;p.buffer=0;p.vaultTime=.28;p.vaultUsed=true;s.stats.vaults++;K.event(s,'staff-vault');K.effect(s,'dust',arm.contact.x,arm.contact.y,{color:'#c9ae79'});}
      }
      if(arm.timer===0){s.arm=null;p.armCD=.45;}
    }else{arm.timer=Math.max(0,arm.timer-dt);if(arm.timer===0){s.arm=null;p.armCD=.45;}}
    a.attack=false;a.attackPressed=false;p.attackBuffer=0;
    if(s.arm&&s.arm.phase!=='charge'){a.left=false;a.right=false;p.face=s.arm.face;}
  };
  const oldUltimate=K.startUltimate;
  K.startUltimate=s=>{if(s.player.rage>=100&&s.player.hurt<=0&&s.player.ultimate<=0)K.cancelSignature(s);oldUltimate(s);};
  K.driveFlight=function(s,a,dt){const p=s.player;
    const target=(a.down?165:a.jump?-170:0);p.vy+=(target-p.vy)*Math.min(1,dt*12);p.vx+=(((a.right?1:0)-(a.left?1:0))*220-p.vx)*Math.min(1,dt*9);
    if(p.y<=180&&p.vy<0)p.vy=0;
  };
  K.readSignature=function(s,p,room,number,fail){
    for(const [key,max]of [['armCD',2],['vaultTime',1],['groundTime',.5],['wheelFuel',1.5]])if(!number(p[key],0,max))fail();
    if(typeof p.vaultUsed!=='boolean'||typeof p.wheelReady!=='boolean')fail();
    let arm=null,flight=null;
    if(s.arm!==null){const a=s.arm;if(K.isRanged(s)||!a||!['charge','thrust','recover','vault'].includes(a.phase)||!number(a.charge,0,.6)||!number(a.timer,0,.24)||![-1,1].includes(a.face)||!Array.isArray(a.targets)||a.targets.length>40||new Set(a.targets).size!==a.targets.length||a.targets.some(x=>typeof x!=='string'||!/^([es][0-9]+)$/.test(x))||typeof a.launched!=='boolean'||typeof a.requiresHold!=='boolean')fail();
      if(a.contact!==null&&(!a.contact||!number(a.contact.x,0,room.width)||!number(a.contact.y,0,550)))fail();
      arm={phase:a.phase,charge:a.charge,timer:a.timer,face:a.face,targets:a.targets.slice(),contact:a.contact?{x:a.contact.x,y:a.contact.y}:null,launched:a.launched,requiresHold:a.phase==='charge'||a.requiresHold};
    }
    if(s.flight!==null){if(!K.isRanged(s)||!s.flight||!number(s.flight.age,0,1.5)||p.wheelFuel<=0)fail();flight={age:s.flight.age};}
    return{arm,flight};
  };
  K.breakDistanceBox=e=>{const b=K.enemyAttackBox(e),to=e.rushTo??e.x;return{x:Math.min(b.x,b.x+to-e.x),y:b.y,w:b.w+Math.abs(to-e.x),h:b.h};};
  const previousCounter=K.stepCounter;
  K.stepCounter=function(s,e,dt,target){
    if(K.isMajor(e))return previousCounter(s,e,dt,target);e.signatureCD=Math.max(0,(e.signatureCD||0)-dt);
    const p=s.player,near=Math.abs(p.x-e.x);
    if(e.phase==='idle'&&e.timer<=0&&e.signatureCD===0){
      if(e.kind==='shield'&&s.arm?.phase==='charge'&&near>140&&near<390){
        const bounds=K.counterBounds(s,e);e.roamRange=420;e.face=Math.sign(p.x-e.x)||e.face;e.rushTo=K.clamp(e.x+e.face*Math.min(240,near-28),bounds.min,bounds.max);e.phase='break-windup';e.timer=.8;e.signatureCD=4;K.event(s,'warning',{move:'break-distance',kind:e.kind});return true;
      }
      if(e.kind==='caster'&&!p.grounded&&p.y<330&&near<550){
        e.phase='air-windup';e.timer=.95;e.signatureCD=4;e.marks=[{x:K.clamp(p.x+12-48,8,s.room.width-104),y:K.clamp(p.y-12,170,330),w:96,h:64}];K.event(s,'warning',{move:'air-seal',kind:e.kind});return true;
      }
    }
    if(e.phase==='break-windup'){if(e.timer<=0){e.phase='break-rush';e.timer=.6;K.event(s,'enemy-attack',{move:'break-distance',kind:e.kind});}return true;}
    if(e.phase==='break-rush'){
      const dx=e.rushTo-e.x;e.x+=Math.sign(dx)*Math.min(Math.abs(dx),420*dt*K.enemySpeed(s,e));if(K.overlap(p,K.enemyAttackBox(e)))K.damage(s,14,'重盾兵·破距冲',e.face);
      if(e.timer<=0||Math.abs(dx)<2){e.phase='recover';e.timer=1.3;}return true;
    }
    if(e.phase==='air-windup'){if(e.timer<=0){for(const m of e.marks)s.dangers.push({...m,life:.32,damage:12,source:'莲灯使·锁空莲印'});e.marks=[];e.phase='recover';e.timer=1.3;K.event(s,'enemy-attack',{move:'air-seal',kind:e.kind});}return true;}
    return previousCounter(s,e,dt,target);
  };
})(globalThis.Kong ||= {});
