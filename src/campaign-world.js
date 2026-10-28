(function(K){
  'use strict';
  K.TRAITS.volley={name:'散射',text:'一次起手发出三道弹幕，须辨认弹间空隙。'};
  K.realmAt=stage=>K.chapter(stage)?.id||'cloud';
  K.region=stage=>K.levelInfo(stage).name;
  K.makeRoom=function(seed,stage,difficulty='normal'){
    if(!Number.isInteger(stage)||stage<0||stage>=15)throw Error('关卡索引无效');
    const info=K.levelInfo(stage),part=info.part,random=K.rng(K.seedNumber(seed)+stage*977),hard=difficulty==='challenge',width=part===2?2520:3100;
    const room={width,exit:width-100,enemies:[],seals:[],pickups:[],hazards:[],platforms:[],signs:[],landmarks:[],node:null,trial:null,camp:null,midClaimed:false,variant:Math.floor(random()*997),anchors:[]};
    const layout=K.routeLayout(stage);room.route=layout.name;
    for(const [x,w,y]of layout.floor)room.platforms.push({x,y,w,h:550-y,solid:true});
    for(const [i,[x,y,w]]of layout.shelf.entries())room.platforms.push({x,y,w,h:16,...(info.id==='cloud'&&part===1&&i%2===1?{fragile:true,crack:0,cooldown:0}:{})});
    const arenaMin=part===2?1500:2180,arenaMax=width-130;
    room.arena={min:arenaMin,max:arenaMax,enter:arenaMin+15,checkpoint:arenaMin+55,offset:0};
    const count=part===2?4:part===0?7:8,spacing=part===2?225:220;
    function add(role,x,id,reserve=false){const kind=['blade','caster','shield'][role],e=K.enemy(kind,x,400,id);Object.assign(e,{role,stage,realm:info.id,realmCD:1,challengeCD:1,signatureCD:0,move:'',marks:[],aimX:x-100,aimY:416,recoil:0,recoilFace:1,style:'campaign',trait:role===0&&part===1?'twin':role===2?'pulse':role===1&&(info.id==='water'||info.id==='cloud'&&part===2)?'volley':'',dormant:reserve,hp:reserve?0:e.maxHp,scoreable:!reserve,chiefId:null,campChargeTo:x,repeat:0,anchorKey:null});const ledge=role===1?room.platforms.filter(p=>!p.solid&&p.x<=x&&p.x+p.w>=x+e.w).sort((a,b)=>b.y-a.y)[0]:null;let support=ledge||room.platforms.find(p=>p.solid&&p.x<=x&&p.x+p.w>=x+e.w);if(!support){support=room.platforms.filter(p=>p.solid).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0];e.x=K.clamp(x,support.x+24,support.x+support.w-e.w-24);e.origin=e.x;}e.y=(support?.y||440)-e.h;e.baseY=e.y;e.lastX=e.x;
      room.enemies.push(e);if(!reserve)room.pickups.push({x,y:420,w:16,h:20,kind:id%3===0?'heal':id%3===1?'focus':'rage',amount:id%3===0?12:20,sourceId:id,used:false,enabled:false});return e;}
    for(let i=0;i<count;i++){const role=part===0?[0,0,1,2,0,1,2][i]:part===1?[2,1,0,1,2,0,1,2][i]:[1,2,0,1][i];add(role,layout.foes[i],100+i);}
    if(hard)for(let i=0;i<3;i++)add((i+stage)%3,layout.foes[Math.min(layout.foes.length-1,1+i*2)]+68,300+i);
    const def=K.GUARDIANS[stage],e=K.enemy('warden',arenaMax-240,340,900);Object.assign(e,{stage,chiefId:def.id,guardian:def.id,w:part===2?58:42,h:part===2?90:70,y:part===2?350:370,baseY:part===2?350:370,maxHp:def.hp,hp:def.hp,dormant:true,role:3,realm:info.id,realmCD:0,challengeCD:1,signatureCD:0,move:'',marks:[],recoil:0,recoilFace:1,style:'campaign',scoreable:true,campChargeTo:arenaMax-240,repeat:0,anchorKey:null});room.enemies.push(e);
    if(part===2&&info.id==='heaven')for(let i=0;i<2;i++)add(i===0?0:1,arenaMin+170+i*250,950+i,true);
    if(part===2&&['underworld','dragon','heaven'].includes(info.id)){const kind=info.id==='underworld'?'writ':info.id==='dragon'?'pearl':'tower';for(let i=0;i<(kind==='writ'?2:1);i++)room.anchors.push({id:i,kind,x:arenaMin+160+i*440,y:400,w:28,h:40,hp:kind==='pearl'?28:36,maxHp:kind==='pearl'?28:36,active:false,hits:[]});}
    for(const [x,w]of layout.hazards||[])room.hazards.push({x,y:427,w,h:13,period:info.id==='underworld'?4.2:4.8,offset:stage*.43});
    room.camp={x:arenaMin-95,y:396,used:false};
    room.pickups.push({x:1350,y:420,w:16,h:20,kind:'heal',amount:18,used:false});
    room.signs=[{x:140,text:'第'+(Math.floor(stage/3)+1)+'章 第'+(part+1)+'关 · '+info.name+'。F拾卷，C秘技；击退'+info.chief+'后F过门。'},
      {x:arenaMin-200,text:info.lesson}];room.landmarks=[700,arenaMin];return room;
  };
  const totals=new Map();K.campaignEnemyTotal=(seed,difficulty)=>{const key=seed+':'+difficulty;if(!totals.has(key)){let n=0;for(let i=0;i<15;i++)n+=K.makeRoom(seed,i,difficulty).enemies.filter(e=>e.scoreable).length;totals.set(key,n);}return totals.get(key);};
  K.applyWorld=()=>{};K.updateWorld=()=>{};K.updateJourney=()=>{};K.worldInteract=()=>false;
  K.lampInReach=()=>false;
  K.gateInReach=s=>Math.abs(s.player.x-s.room.exit)<85&&Math.abs(s.player.y+s.player.h-440)<112;
  K.updateArena=function(s){const e=K.guardian(s),a=s.room.arena,p=s.player;if(!e||e.hp<=0)return;if(e.dormant&&p.x>=a.enter){e.dormant=false;e.phase='idle';e.timer=.85;s.checkpoint=a.checkpoint;K.event(s,'guardian-enter',{name:K.campaignName(e)});}if(!e.dormant){p.x=K.clamp(p.x,a.min,a.max);s.checkpoint=a.checkpoint;}};
  const run=K.newRun,enter=K.enterRoom;
  K.newRun=function(seed,first,hero='wukong',difficulty='normal',meta){if(difficulty==='challenge'&&!K.canChallenge(meta))throw Error('挑战模式须普通十五关通关并取得S评级。');const s=run(seed,first,hero,difficulty);s.campaign={completed:[],killed:[],hits:0,anchorHeals:[],access:difficulty==='challenge'?JSON.parse(JSON.stringify(meta.normalClear)):null,started:s.elapsed};return s;};
  K.enterRoom=function(s,stage,initial){enter(s,stage,initial);if(s.campaign)s.campaign.started=s.elapsed;};
  const journey=K.journeyInteract;
  K.journeyInteract=function(s){const manual=K.nearArtManual(s);if(manual)return journey(s)||true;if(K.gateInReach(s)){const g=K.guardian(s);if(g?.hp>0){K.event(s,'gate-locked');return true;}if(!s.campaign.completed.includes(s.stage))s.campaign.completed.push(s.stage);if(s.stage===14){s.mode='won';K.event(s,'victory');return true;}s.rewardKind='exit';s.reward=K.options(s);K.cancelSignature(s);s.mode='reward';K.event(s,'reward',{kind:'exit'});return true;}return journey(s)||true;};
  const damage=K.damage;K.damage=function(s,...args){const result=damage(s,...args);if(result&&s.campaign)s.campaign.hits++;return result;};
  const reward=K.reward;K.reward=function(id,s){const r=reward(id,s);if(id!=='mercy')return r;const end=s?.hero==='erlang'?'天眼':s?.hero==='nezha'?'混天绫':'分身';return{...r,tag:'破械续航',text:'击碎判牒、潮珠或塔基恢复12生命；'+end+'结束返还15定力。',cost:'每关同一机关最多回复一次；神通仍有原本消耗。'};};
  K.bossBraced=e=>!!e.chiefId&&e.hp>0&&!e.dormant&&e.phase!=='recover';
  const hit=K.hitEnemy;K.hitEnemy=function(s,e,n,origin,pierce,impact){const before=e.hp,anchors=s.room.anchors;
    if(K.bossBraced(e)&&(origin-e.x-e.w/2)*e.face>0&&impact!=='ultimate'){const original=n;n=Math.max(1,Math.ceil(n*(pierce?.6:.35)));K.event(s,'boss-brace',{target:e.id,chip:n,absorbed:original-n});K.effect(s,'brace-hit',e.x+(e.face>0?e.w:0),e.y+e.h*.45,{duration:.12,face:e.face});}
    if(e.chiefId&&s.stage%3===2&&K.chapter(s.stage).id==='underworld'&&e.phase!=='recover'&&anchors.some(q=>q.hp>0&&q.active))n=Math.max(1,Math.ceil(n*.55));
    const yes=hit(s,e,n,origin,pierce,impact);if(before>0&&e.hp===0&&e.scoreable&&s.campaign){const key=s.stage+':'+e.id;if(!s.campaign.killed.includes(key))s.campaign.killed.push(key);}return yes;};
})(globalThis.Kong ||= {});
