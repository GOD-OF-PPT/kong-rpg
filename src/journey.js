(function(K){
  'use strict';
  // Coordinates belong to the room. Simulation, cues, saves and controllers share them.
  const baseEnrich=K.enrichRoom,CUT=2760,EXTRA=2160;
  const shiftRoom=(room,cut,by)=>{
    const split=[];
    for(const p of room.platforms){
      if(p.x<cut&&p.x+p.w>cut){split.push({...p,w:cut-p.x},{...p,x:cut+by,w:p.x+p.w-cut});}
      else{if(p.x>=cut){p.x+=by;if(p.originX!==undefined)p.originX+=by;}split.push(p);}
    }
    room.platforms=split;
    for(const key of ['enemies','seals','hazards','pickups','signs'])for(const o of room[key])if(o.x>=cut){o.x+=by;if(o.origin!==undefined)o.origin+=by;}
    room.landmarks=room.landmarks.map(x=>x>=cut?x+by:x);
    if(room.node?.x>=cut)room.node.x+=by;
    room.exit+=by;room.width+=by;
  };
  const addEnemy=(room,kind,x,y,id,trait)=>{const e=K.enemy(kind,x,y,id);e.style=kind==='shield'?'rush':kind==='blade'?'lunge':'sigil';e.trait=trait||'';room.enemies.push(e);return e;};
  K.TRAITS={twin:{name:'连刃',text:'第一斩后有更远的二段斩；轻棍不推退蓄力，重棍可打断。'},pulse:{name:'震盾',text:'盾撞后发出低位盾波；跃过或用回锋返弹。'},volley:{name:'散焰',text:'长蓄力后扇射三焰；近身打断或寻找弹间空隙。'}};
  K.DROPS={heal:{name:'小还丹',amount:12,color:'#bcdb9b'},focus:{name:'定心光',amount:20,color:'#8edcd9'},rage:{name:'战意火',amount:14,color:'#f0c671'}};
  K.enrichRoom=function(room,stage){
    baseEnrich(room,stage);
    room.trial=null;room.camp=null;
    if(stage<3){
      shiftRoom(room,CUT,EXTRA);
      room.arena={offset:EXTRA,min:4430+EXTRA,max:5128+EXTRA,enter:4470+EXTRA,checkpoint:4500+EXTRA};
      for(const [x,w] of [[0,640],[740,680],[1530,630]])room.platforms.push({x:CUT+x,y:440,w,h:110,solid:true});
      for(const [x,y,w] of [[70,350,190],[340,280,180],[580,350,240],[810,350,150],[940,280,410],[1400,350,250],[1700,280,180],[1910,350,230]])room.platforms.push({x:CUT+x,y,w,h:16,...(stage===2&&y===350?{fragile:true,crack:0,cooldown:0}:{})});
      for(const [i,kind,x,y,trait] of [[0,'blade',310,400,'twin'],[1,'shield',855,400,stage===1?'pulse':''],[2,'caster',1660,327,stage===2?'volley':''],[3,'blade',1950,400,stage===0?'':'twin']])addEnemy(room,kind,CUT+x,y,400+i,trait);
      room.hazards.push({x:CUT+1190,y:427,w:60,h:13,...(stage===2?{period:3.8,offset:1.1}:{})});
      const trialNames=['断松试棍','悬灯问影','灰庭破阵'];
      room.trial={x:CUT+1100,y:236,state:'ready',guards:[500,501],name:trialNames[stage]};
      for(const [kind,x,y,id,trait] of [['blade',CUT+1020,240,500,'twin'],['caster',CUT+1250,225,501,'volley']]){const e=addEnemy(room,kind,x,y,id,trait);e.hp=0;}
      room.camp={x:CUT+1810,y:396,used:false};
      room.signs.push({x:CUT+80,text:'前方双路：上层 F 挑战试炼赢取一项法门，也可沿下路赶往山门。'},
        {x:CUT+285,text:'连刃第二斩更远。轻棍不推退蓄力，重棍可打断；先看刀光。'},
        {x:CUT+1650,text:stage===2?'散焰使蓄力更长，一次放出三焰；近身重棍可断招。':'怪物倒下会留下补给；资源满时不会收走，可回头再取。'});
      room.landmarks.push(CUT+600,CUT+1480);
    }else{
      shiftRoom(room,0,2520);
      room.arena={offset:2520,min:2544,max:3448,enter:2560,checkpoint:2600};
      room.enemies[0].dormant=true;
      for(const [x,w] of [[0,700],[820,710],[1650,870]])room.platforms.push({x,y:440,w,h:110,solid:true});
      for(const [x,y,w] of [[250,350,170],[480,280,160],[650,350,210],[980,350,180],[1230,280,170],[1440,350,240],[1800,350,180],[2030,280,180],[2300,350,170]])room.platforms.push({x,y,w,h:16});
      for(const [id,kind,x,y,trait] of [[600,'blade',420,400,'twin'],[601,'shield',950,400,'pulse'],[602,'caster',1410,327,'volley'],[603,'blade',1840,400,'twin'],[604,'shield',2290,400,'pulse']])addEnemy(room,kind,x,y,id,trait);
      for(const [id,x] of [[0,1130],[1,2170]])room.seals.push({id,x,y:392,w:28,h:48,hp:56,pulse:2.2,warning:false});
      room.pickups.push({x:550,y:244,w:16,h:20,kind:'heal',used:false});
      room.hazards.push({x:1770,y:427,w:55,h:13,period:3.8,offset:0});
      room.camp={x:2420,y:396,used:false};room.landmarks=[730,1600,2380];
      room.signs.push({x:150,text:'无天之前尚有双阵。破阵、取补给，再过莲界。'},
        {x:850,text:'震盾兵盾撞后放出低位棍波。起跳避过，回锋印也能返弹。'},
        {x:2340,text:'最后一盏归灯可调息一次。前方破双阵后直面无天。'});
    }
    // Preallocated deterministic drops keep saves bounded and prevent rerolling on reload.
    for(const e of room.enemies){
      if(K.isMajor(e))continue;
      const roll=K.rng(room.variant*977+e.id*101+stage*199)();
      if(e.trait||roll<.62){const kind=roll<.29?'heal':roll<.55?'focus':'rage';room.pickups.push({x:e.x,y:420,w:16,h:20,kind,used:false,enabled:false,sourceId:e.id,amount:K.DROPS[kind].amount});}
    }
    return room;
  };
  K.region=(stage,x)=>stage===3?(x<800?'莲界外道':x<1650?'断愿双阵':x<2520?'归灯残阶':'无天莲座'):
    x<CUT?K.REGIONS[stage][Math.min(1,Math.floor(x/1350))]:x<CUT+EXTRA?(x<CUT+1150?['断松岔路','悬灯上栈','灰庭叠阶'][stage]:['旧寨归灯','水道归灯','残庭归灯'][stage]):K.REGIONS[stage][Math.min(3,Math.floor((x-EXTRA)/1350))];
  K.dropEnemy=function(s,e){
    const item=s.room.pickups.find(p=>p.sourceId===e.id);if(!item||item.enabled)return;
    item.x=K.clamp(e.x+e.w/2-8,8,s.room.width-24);item.y=K.surfaceAt(s,item.x+8,e.y+e.h-4)-20;item.enabled=true;
    K.effect(s,'drop-rise',item.x+8,item.y,{color:K.DROPS[item.kind].color});K.event(s,'drop',{id:e.id,kind:item.kind,x:item.x,y:item.y});
  };
  K.collectPickup=function(s,item){
    if(s.mode!=='playing'||item.used||item.enabled===false)return;const p=s.player,cap=item.kind==='heal'?K.maxHP(s):100,key={heal:'hp',focus:'focus',rage:'rage'}[item.kind];
    if(p[key]>=cap)return;const amount=item.amount||(item.kind==='heal'?22:30);item.used=true;
    if(item.kind==='rage')K.gainRage(s,amount);else p[key]=Math.min(cap,p[key]+amount);
    s.stats.drops+=(item.sourceId!==undefined?1:0);K.event(s,'pickup',{kind:item.kind,amount,sourceId:item.sourceId});K.effect(s,'notice',p.x,p.y-5,{text:({heal:'生命',focus:'定力',rage:'战意'}[item.kind])+' +'+amount});
  };
  K.journeyInteract=function(s){
    const p=s.player,t=s.room.trial,c=s.room.camp;
    if(t&&Math.abs(p.x-t.x)<95&&Math.abs(p.y-t.y)<75){
      if(t.state==='ready'){t.state='active';for(const e of s.room.enemies)if(t.guards.includes(e.id)){e.hp=e.maxHp;e.timer=.9;}K.event(s,'ability-note',{text:'试炼已起：可退回下路，再来击退守卒领取奖励。'});}
      else if(t.state==='cleared'){s.rewardKind='trial';s.reward=K.options(s);s.mode='reward';K.event(s,'reward',{kind:'trial'});}
      else K.event(s,'ability-note',{text:t.state==='active'?'守卒尚在，可离开后返回。':'此处试炼的奖励已取。'});
      return true;
    }
    if(c&&Math.abs(p.x-c.x)<75&&Math.abs(p.y-c.y)<65){
      if(!c.used){c.used=true;p.hp=Math.min(K.maxHP(s),p.hp+24);p.focus=Math.min(100,p.focus+20);s.checkpoint=c.x;s.stats.camps++;K.effect(s,'world-rise',c.x,410);K.event(s,'ability-note',{text:'归灯调息 · 生命+24、定力+20。此灯只可借一次。'});}
      else K.event(s,'ability-note',{text:'归灯余温已尽，继续向前。'});return true;
    }
    return false;
  };
  K.updateJourney=function(s){const t=s.room.trial;if(t?.state==='active'&&t.guards.every(id=>s.room.enemies.find(e=>e.id===id).hp===0)){t.state='cleared';s.stats.trials++;K.event(s,'ability-note',{text:t.name+'已破 · 回到上层按 F 领取一项奖励。'});}};
})(globalThis.Kong ||= {});
