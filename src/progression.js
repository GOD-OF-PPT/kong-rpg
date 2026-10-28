(function(K){
  'use strict';
  // Run growth, consumable arts and stage guardians share the saved simulation state.
  K.GROWTH=[
    {id:'vitality',name:'金刚筋',tag:'根骨 · 两重',text:'生命上限增加20，立即恢复20生命。',cost:'本局保留，最多两重；占用本次奖励。',color:'#ddbd79',icon:'mercy',max:2},
    {id:'staff-wave',name:'破阵棍风',tag:'棍法 · 一重',text:'第三棍发出穿透棍风，可越过敌人破阵。',cost:'棍风12伤害；仍须打完三连。',color:'#efd199',icon:'staff',max:1},
    {id:'dash-strike',name:'回身诀',tag:'步法 · 一重',text:'闪避穿身时回击18伤害，并挣得战意。',cost:'须贴身穿过敌人；不缩短闪避冷却。',color:'#8ed5d1',icon:'mirror',max:1},
    {id:'clone-burst',name:'散影诀',tag:'神通 · 一重',text:'分身结束时爆开，伤害并打断附近敌人。',cost:'24伤害；须让敌人留在分身附近。',color:'#bda8e0',icon:'echo',max:1},
    {id:'ultimate-echo',name:'如意余威',tag:'大招 · 一重',text:'法天象地追加第二记棍浪，造成32伤害。',cost:'须留在原地完成收招；受伤会中断。',color:'#f2d492',icon:'staff',max:1},
    {id:'thunder',name:'三霄雷符',tag:'限次神通 · Q',text:'获得3次雷击。按Q锁定前方敌人落雷。',cost:'每次36伤害；用尽消失，取新符会替换。',color:'#90dbe3',icon:'flame',temporary:true},
    {id:'ward',name:'金刚护符',tag:'限次神通 · Q',text:'获得2次护体。按Q抵挡伤害1.6秒。',cost:'用尽消失；取新符会替换剩余符。',color:'#b9dab2',icon:'mercy',temporary:true}
  ];
  K.rank=(s,id)=>s.growth?.[id]||0;
  K.maxHP=s=>100+20*K.rank(s,'vitality');
  K.reward=id=>K.relic(id)||K.GROWTH.find(r=>r.id===id);
  K.rewardEligible=(s,id)=>{const r=K.reward(id);return !!r&&(K.relic(id)?id==='rest'||!K.has(s,id):r.temporary||K.rank(s,id)<r.max);};
  K.options=function(s){
    const random=K.rng(K.seedNumber(s.seed)+s.stage*771+(s.rewardKind==='mid'?29:s.rewardKind==='trial'?57:91));
    const shuffled=xs=>xs.map(r=>({r,n:random()})).sort((a,b)=>a.n-b.n).map(x=>x.r);
    const roots=shuffled([...K.RELICS,...K.GROWTH.filter(r=>r.id==='vitality'||r.id==='staff-wave')].filter(r=>K.rewardEligible(s,r.id)));
    const arts=shuffled(K.GROWTH.filter(r=>r.id!=='vitality'&&K.rewardEligible(s,r.id)));
    const first=roots[0]?.id||arts[0]?.id||'thunder';
    const second=arts.find(r=>r.id!==first)?.id||'ward';
    return [first,second,'rest'];
  };
  K.gainRage=(s,n)=>{const p=s.player,old=p.rage;p.rage=Math.min(100,p.rage+n);if(old<100&&p.rage===100)K.event(s,'ultimate-ready');};
  K.ultimateBox=s=>{const p=s.player;return{x:p.face>0?p.x-45:p.x-285,y:p.y-65,w:355,h:130};};
  K.startUltimate=function(s){
    const p=s.player;if(p.ultimate>0||p.hurt>0)return;
    if(p.rage<100){K.event(s,'ability-note',{text:'战意未满：棍击命中、破阵与反击可积攒。'});return;}
    p.rage=0;p.ultimate=.86;p.ultimateStage=0;p.attack=0;p.attackBuffer=0;p.buffer=0;p.dash=0;p.slam=false;p.vx=0;p.vy=0;p.invuln=Math.max(p.invuln,.32);
    s.stats.ultimates++;K.event(s,'ultimate');K.effect(s,'ultimate-aura',p.x+12,p.y+44,{face:p.face});
  };
  K.stepUltimate=function(s,dt){
    const p=s.player;if(p.ultimate<=0)return;
    p.ultimate=Math.max(0,p.ultimate-dt);const elapsed=.86-p.ultimate;
    const strike=(amount,pulse)=>{const box=K.ultimateBox(s),hits=s.stats.hits;K.strike(s,box,amount,p.x+12,true,[],'ultimate');for(const b of s.projectiles)if(!b.friendly&&K.overlap(box,b))b.life=0;K.effect(s,'ultimate-wave',p.x+12,p.y+15,{face:p.face,pulse,box:{...box}});K.event(s,s.stats.hits>hits?'ultimate-hit':'ultimate-swing',{pulse,box});};
    if(elapsed>=.2&&p.ultimateStage===0){p.ultimateStage=1;strike(64,1);}
    if(elapsed>=.5&&p.ultimateStage===1&&K.rank(s,'ultimate-echo')){p.ultimateStage=2;strike(32,2);}
  };
  K.useTalisman=function(s){
    const p=s.player,t=s.talisman;if(!t||t.charges<=0){K.event(s,'ability-note',{text:'尚未携带符术；在借灯奖励中取得。'});return;}
    if(p.talismanCD>0||p.ultimate>0||p.hurt>0)return;
    t.charges--;p.talismanCD=.65;s.stats.talismans++;K.event(s,'talisman',{id:t.id});
    if(t.id==='ward'){p.ward=1.6;p.invuln=Math.max(p.invuln,1.6);K.effect(s,'ward',p.x+12,p.y+22);}
    else{const enemy=s.room.enemies.filter(e=>e.hp>0&&!e.dormant&&(e.x+e.w/2-p.x)*p.face>=-20&&Math.abs(e.x-p.x)<430).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];const x=enemy?enemy.x+enemy.w/2:K.clamp(p.x+12+p.face*150,30,s.room.width-30),y=enemy?enemy.y+enemy.h:K.surfaceAt(s,x,p.y);s.casts.push({x:x-46,y:y-150,w:92,h:150,timer:.24});K.effect(s,'thunder-mark',x,y,{w:92});}
    if(t.charges===0)s.talisman=null;
  };
  K.stepCasts=function(s,dt){for(const c of s.casts){c.timer-=dt;if(c.timer<=0){K.strike(s,c,36,c.x+46,true,[],'thunder');K.effect(s,'thunder',c.x+46,c.y+150);K.event(s,'thunder-hit',{x:c.x});}}s.casts=s.casts.filter(c=>c.timer>0);};
  K.GUARDIANS=[
    {id:'mountain',name:'镇山魈王',title:'雾隐山道 · 扼路石魈',hp:180,color:'#c89b63',lesson:'冲撞看路径跃过；震地看地线起跳。'},
    {id:'ferry',name:'渡厄灯魁',title:'悬灯古渡 · 索灯守渡',hp:168,color:'#79c9c3',lesson:'散焰可借回锋返还；索灯落印后移出。'},
    {id:'sanctuary',name:'缄愿法使',title:'灵山残庭 · 封愿执钟',hp:192,color:'#c9b4d8',lesson:'封愿光柱须横移；低处钟浪可跃过。'}
  ];
  K.isMajor=e=>e.kind==='boss'||e.kind==='warden';
  K.guardian=s=>s.room.enemies.find(e=>e.kind==='warden');
  K.attachGuardian=function(room,stage){if(stage===3)return;room.enemies=room.enemies.filter(e=>e.origin<4470);const def=K.GUARDIANS[stage],e=K.enemy('warden',4860,352,900);Object.assign(e,{guardian:def.id,w:58,h:88,hp:def.hp,maxHp:def.hp,baseY:352,dormant:true,move:'',marks:[],timer:.8});room.enemies.push(e);room.signs.push({x:4380,text:def.name+'镇守山门：'+def.lesson});};
  K.updateArena=function(s){
    const e=K.guardian(s)||s.room.enemies.find(e=>e.kind==='boss');if(!e||e.hp<=0)return;
    const p=s.player,a=s.room.arena;if(e.dormant&&p.x>=a.enter){
      if(s.stage===3&&s.room.seals.some(q=>q.hp>0)){p.x=a.enter-25;return;}
      e.dormant=false;e.timer=1.2;s.checkpoint=a.checkpoint;K.event(s,e.kind==='boss'?'boss-enter':'guardian-enter',{name:e.kind==='boss'?'无天':K.GUARDIANS[s.stage].name});
    }
    if(!e.dormant){p.x=K.clamp(p.x,a.min,a.max);s.checkpoint=a.checkpoint;}
  };
  K.wardenAttackBox=e=>({x:e.x-5,y:e.y+5,w:e.w+10,h:e.h-5});
  K.stepWarden=function(s,e,dt,target){
    if(e.dormant)return;
    const p=s.player,o=s.room.arena.offset,face=Math.sign(target.x-e.x)||e.face;
    if(e.phase==='idle'&&e.timer<=0){
      e.face=face;e.attacks++;e.phase='warden-windup';e.timer=e.guardian==='mountain'?.9:1.05;
      if(e.guardian==='mountain'){
        e.move=e.attacks%2?'charge':'quake';
        if(e.move==='charge'){e.chargeTo=K.clamp(e.x+face*290,4460+o,5060+o);const box=K.wardenAttackBox(e);e.marks=[{x:Math.min(box.x,e.chargeTo-5),y:box.y,w:Math.abs(e.chargeTo-e.x)+box.w,h:box.h}];}
        else e.marks=[{x:Math.max(4430+o,e.x-150),y:414,w:Math.min(300,5140+o-Math.max(4430+o,e.x-150)),h:26}];
      }else if(e.guardian==='ferry'){
        e.move=e.attacks%2?'fan':'lantern';const center=K.clamp(target.x+12,4535+o,5045+o);e.marks=e.move==='lantern'?[-85,85].map(delta=>({x:K.clamp(center+delta-38,4435+o,5050+o),y:404,w:76,h:36})):[];
      }else{
        e.move=e.attacks%2?'columns':'bell';const center=K.clamp(target.x+12,4560+o,5030+o);e.marks=e.move==='columns'?[-140,0,140].map(delta=>({x:K.clamp(center+delta-25,4435+o,5080+o),y:280,w:50,h:160})):[{x:Math.max(4430+o,e.x-205),y:416,w:Math.min(410,5140+o-Math.max(4430+o,e.x-205)),h:24}];
      }
      K.event(s,'boss-warning',{attack:e.move,name:K.GUARDIANS[s.stage].name});
    }else if(e.phase==='warden-windup'&&e.timer<=0){
      K.event(s,'enemy-attack',{kind:'warden',move:e.move});
      if(e.move==='charge'){e.phase='warden-rush';e.timer=.52;}
      else{
        if(e.move==='fan')for(const v of[-95,0,95])s.projectiles.push({x:e.x+24,y:e.y+25,vx:e.face*225,vy:v,w:14,h:14,life:3,friendly:false,source:'渡厄灯魁·散焰'});
        else for(const box of e.marks)s.dangers.push({...box,life:e.move==='columns'?.42:.32,damage:16,source:K.GUARDIANS[s.stage].name+'·'+({quake:'震地',lantern:'索灯',columns:'封愿',bell:'钟浪'}[e.move])});
        e.marks=[];e.phase='recover';e.timer=e.move==='columns'?1.5:1.35;
      }
    }else if(e.phase==='warden-rush'){
      const diff=e.chargeTo-e.x;e.x+=Math.sign(diff)*Math.min(Math.abs(diff),560*dt);
      if(K.overlap(p,K.wardenAttackBox(e)))K.damage(s,18,'镇山魈王·冲撞',e.face);
      if(e.timer<=0||Math.abs(e.x-e.chargeTo)<2){e.marks=[];e.phase='recover';e.timer=1.5;}
    }else if(e.phase==='recover'&&e.timer<=0){e.phase='idle';e.timer=.55;}
  };
})(globalThis.Kong ||= {});
