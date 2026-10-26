(function(K){
  'use strict';
  K.WORLD_STORIES={
    rescue:{title:'归途有人',start:'笼中行者：大圣，莫只顾灵山。山道还有回不了家的人。',done:'牢笼已开，行者带走了地刺的阵符。山道从此有了归路。'},
    bridge:{title:'渡口灯明',start:'渡口残灯尚有余温。借二十定力，或可接回断去的归路。',done:'你将定力注入灯枢，三段残桥重新亮起。对岸传来应答的钟声。'},
    bell:{title:'钟声破妄',start:'残钟里困着众生愿力。敲响它，会惊动守钟的黑莲众。',done:'钟声穿过灵山。无天落火的第三道莲印，已被众生的回声压住。'}
  };
  K.REGIONS=[['山门外','断松崖','归途旧寨','黑莲哨'],['渡口石阶','悬灯断桥','灯枢水道','彼岸遗门'],['香灰长阶','断碑回廊','镇莲钟庭','无天门前'],['黑莲法界']];
  K.region=(stage,x)=>K.REGIONS[stage][Math.min(K.REGIONS[stage].length-1,Math.floor(x/1350))];
  K.enrichRoom=function(room,stage){
    room.node=null;
    if(stage===3)return room;
    for(const e of room.enemies){e.style=e.kind==='blade'&&stage>0?'lunge':e.kind==='shield'&&(stage===2||e.id===4)?'rush':e.kind==='caster'&&stage>0?'sigil':'basic';e.recoil=0;e.recoilFace=1;}
    const id=['rescue','bridge','bell'][stage],x=[2275,2910,3230][stage];
    room.node={id,x,y:396,state:'ready',guards:stage===1?[]:stage===0?[200,201]:[200,201,202]};
    const guards=stage===0?[['blade',x-80,400],['shield',x+100,400]]:stage===2?[['shield',x-85,400],['caster',x+130,327],['blade',x+15,400]]:[];
    guards.forEach(([kind,px,py],i)=>{const e=K.enemy(kind,px,py,200+i);e.hp=0;e.timer=.8;e.style=kind==='shield'?'rush':kind==='caster'?'sigil':'lunge';e.recoil=0;e.recoilFace=1;room.enemies.push(e);});
    for(const p of room.platforms)if(!p.solid&&((stage===0&&p.x>2200&&p.x<2600)||(stage===2&&p.x>3100&&p.x<3400))){p.fragile=true;p.crack=0;p.cooldown=0;}
    if(stage===1){
      room.platforms.push({x:2565,y:375,w:120,h:16,raft:true,originX:2565});
      for(const [px,w]of[[2540,120],[3440,120],[4320,120]])room.platforms.push({x:px,y:418,w,h:16,bridge:true,enabled:false});
    }
    if(stage===2)room.hazards.forEach((h,i)=>{h.period=3.8;h.offset=i*.72;});
    room.signs.push({x:x-180,text:stage===1?'灯枢可用 F 注入20定力，接回断桥。':stage===0?'旧寨还有被困行者。F 破笼会惊动守卒；也可继续赶路。':'F 叩钟可救出愿力，也会惊动守钟众。'});
    if(K.attachGuardian)K.attachGuardian(room,stage);
    return room;
  };
  K.hazardPhase=function(s,h){if(!h.period)return 'active';const t=(s.roomTime+h.offset)%h.period;return t<1.65?'quiet':t<2.35?'warning':'active';};
  K.platformEnabled=p=>!(p.bridge&&!p.enabled)&&!(p.fragile&&p.cooldown>0);
  K.updatePlatforms=function(s,dt){
    const p=s.player;
    for(const q of s.room.platforms){
      if(q.raft){const next=q.originX+Math.sin(s.roomTime*.85)*65;if(p.grounded&&Math.abs(p.y+p.h-q.y)<3&&p.x+p.w>q.x&&p.x<q.x+q.w)p.x+=next-q.x;q.x=next;}
      if(q.fragile){if(q.cooldown>0){q.cooldown=Math.max(0,q.cooldown-dt);continue;}const standing=p.grounded&&Math.abs(p.y+p.h-q.y)<3&&p.x+p.w>q.x&&p.x<q.x+q.w;q.crack=standing?q.crack+dt:Math.max(0,q.crack-dt*2);if(q.crack>=.65){q.cooldown=2.8;q.crack=0;K.effect(s,'rubble',q.x+q.w/2,q.y,{w:q.w});K.event(s,'platform-break',{x:q.x});}}
    }
  };
  K.applyWorld=function(s){
    if(s.stage===0&&s.world.rescue)s.room.hazards=[];
    if(s.stage===1&&s.world.bridge)for(const p of s.room.platforms)if(p.bridge)p.enabled=true;
  };
  K.rememberStory=function(s,id,part){const key=id+':'+part;if(!s.journal.includes(key)){s.journal.push(key);K.event(s,'story',{id,part,title:K.WORLD_STORIES[id].title,text:K.WORLD_STORIES[id][part]});}};
  K.worldInteract=function(s){
    const n=s.room.node,p=s.player;if(!n||Math.abs(p.x-n.x)>90||Math.abs(p.y-396)>95)return false;
    if(n.state==='done'){K.event(s,'world-note',{text:K.WORLD_STORIES[n.id].done});return true;}
    if(n.state==='active'){K.event(s,'world-note',{text:'守阵者尚在，先打散追来的黑莲众。'});return true;}
    if(n.id==='bridge'){
      if(p.focus<20){K.event(s,'world-note',{text:'灯枢还需20定力。棍击命中后再来。'});return true;}
      p.focus-=20;s.stats.focusSpent+=20;n.state='done';s.world.bridge=true;K.applyWorld(s);K.rememberStory(s,n.id,'done');K.effect(s,'world-rise',n.x,410);return true;
    }
    n.state='active';for(const e of s.room.enemies)if(n.guards.includes(e.id)){e.hp=e.maxHp;e.phase='idle';e.timer=.8;}
    K.rememberStory(s,n.id,'start');K.event(s,'world-start',{id:n.id});return true;
  };
  K.updateWorld=function(s){
    const n=s.room.node;if(s.mode!=='playing'||!n||n.state!=='active')return;
    if(n.guards.every(id=>s.room.enemies.find(e=>e.id===id)?.hp===0)){
      n.state='done';s.world[n.id]=true;s.player.hp=Math.min(K.maxHP(s),s.player.hp+18);s.player.focus=Math.min(100,s.player.focus+20);K.applyWorld(s);K.rememberStory(s,n.id,'done');K.effect(s,'world-rise',n.x,410);K.event(s,'world-clear',{id:n.id});
    }
  };
  K.surfaceAt=function(s,x,y){const q=s.room.platforms.filter(p=>K.platformEnabled(p)&&p.x<=x&&p.x+p.w>=x&&p.y>=y).sort((a,b)=>a.y-b.y)[0];return q?.y||440;};
  K.sigilBox=e=>({x:e.aimX-42,y:e.aimY-22,w:84,h:22});
  K.rushBox=function(s,e){const distance=e.phase.startsWith('lunge')?285*.24:360*.36,bounds=K.patrolBounds(s,e),to=K.clamp(e.x+e.face*distance,bounds.min,bounds.max),b=K.enemyAttackBox(e);return{x:Math.min(b.x,b.x+to-e.x),y:b.y,w:b.w+Math.abs(to-e.x),h:b.h};};
})(globalThis.Kong ||= {});
