(function (K) {
  'use strict';
  K.VERSION = '6.0.0';
  K.W = 960; K.H = 540; K.DT = 1 / 120;
  K.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  K.overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  K.rng = function (seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  K.seedNumber = function (s) { let n = 2166136261; for (const c of String(s)) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; };
  K.RELICS = [
    { id:'cloud',glyph:'云',name:'腾云骨',tag:'空中取势',text:'一次空中跳。空中棍击伸得更远，踩敌后再次获得腾云。',cost:'用高度避开地面斩击；空中仍会被莲焰命中。',color:'#82d9d2' },
    { id:'echo',glyph:'影',name:'照影珠',tag:'驻影绕背',text:'分身驻留3秒，发出穿透棍风。敌人会朝分身蓄力，本体可绕背。',cost:'每次50定力；放错位置会浪费整次输出窗口。',color:'#bd9cdb' },
    { id:'staff',glyph:'棍',name:'定海心',tag:'重棍破势',text:'第三棍范围更远、破正面重盾；重棍命中能打断普通敌人蓄力。',cost:'第三棍收招更长，须提前判断敌招时机。',color:'#efc47a' },
    { id:'mirror',glyph:'返',name:'回锋印',tag:'迎焰而返',text:'闪避的无敌阶段接住飞弹，将其返向施法者，造成24伤害。',cost:'提前闪避会错过接弹时机，并留下冷却空当。',color:'#8ec4ee' },
    { id:'flame',glyph:'焰',name:'业火莲',tag:'下劈控场',text:'空中下＋攻击落地迸出火环，打断附近敌人蓄力并破盾。',cost:'下劈不能中途转向；要先选好落脚点。',color:'#f28b65' },
    { id:'mercy',glyph:'生',name:'护生灯',tag:'破阵续航',text:'破除阵眼恢复12生命；分身结束返还15定力。',cost:'需要主动破阵，不能原地无限回血。',color:'#a4cf91' }
  ];
  K.REST = { id:'rest',glyph:'息',name:'借灯调息',tag:'本次补给',text:'恢复30生命与35定力。保留当前的三枚舍利。',cost:'放弃本次更换舍利的机会。',color:'#c4d5aa' };
  K.STAGES = [
    {name:'雾隐山道',subtitle:'先看落点，再看刀光',sky:'#141e2c',mist:'#49616a',accent:'#c4d7b3',lore:'灵山的钟已三日未响。先破山道黑莲，给众生留一条归路。'},
    {name:'悬灯古渡',subtitle:'越过断桥，借影渡劫',sky:'#21182d',mist:'#6b4c69',accent:'#e5ae74',lore:'河上灯火没有熄，只是被黑莲困在两岸。高处的阵眼正照着渡口。'},
    {name:'灵山残庭',subtitle:'万佛无言，此心不退',sky:'#251c2d',mist:'#655a62',accent:'#ddbf7b',lore:'阶前尽是旧香灰。带着一路选择的舍利，叩开最后一道山门。'},
    {name:'黑莲法界',subtitle:'棍可破莲，心不可折',sky:'#191326',mist:'#5c3b65',accent:'#d493c5',lore:'无天不在远处。他就在每一次逼你认命的选择里。此劫，当由我破。'}
  ];
  K.relic = id => id === 'rest' ? K.REST : K.RELICS.find(r => r.id === id);
  K.has = (s,id) => s.relics.includes(id);
  K.enemy = function(kind,x,y,id) {
    const boss=kind==='boss'; const h=boss?72:40;
    return {id,kind,x,y:y===undefined?(boss?368:kind==='caster'?327:400):y,w:boss?48:26,h,hp:boss?270:kind==='shield'?60:38,maxHp:boss?270:kind==='shield'?60:38,face:-1,phase:'idle',style:'basic',recoil:0,recoilFace:1,timer:kind==='caster'?.45+(id%10)*.07:boss?.8:0,stun:0,flash:0,attacks:0,struck:false,roamRange:100,followup:false,origin:x,baseY:y===undefined?(kind==='caster'?327:400):y,interruptLock:0};
  };
  const BLUEPRINTS = [
    {ground:[[0,820],[920,870],[1900,850],[2860,810],[3780,1380]],
      ledges:[[270,350,150],[480,280,140],[690,350,180],[1090,350,170],[1330,280,150],[1640,350,160],[2040,350,160],[2270,275,180],[2530,350,230],[3000,350,160],[3220,280,150],[3480,350,200],[3940,350,160],[4180,280,180],[4460,350,180]],
      seals:[[1480,392],[4330,392]],hazards:[[1210,54],[2410,62],[4010,54]],
      encounters:[[422,'blade',400],[1020,'shield',400],[1560,'caster',327],[2140,'blade',400],[2550,'shield',400],[3110,'caster',327],[3500,'blade',400],[4270,'shield',400],[4580,'caster',327]],
      supplies:[[545,244,'heal'],[2330,239,'focus'],[3280,244,'heal']],landmarks:[700,1770,2740,3680]},
    {ground:[[0,760],[880,760],[1760,780],[2660,780],[3560,760],[4440,720]],
      ledges:[[290,350,140],[520,280,160],[710,350,210],[1030,350,140],[1240,280,160],[1510,350,270],[1880,360,150],[2060,340,200],[2310,270,170],[2480,350,190],[2790,350,150],[3010,275,160],[3270,350,310],[3720,350,160],[3950,280,160],[4210,350,250],[4650,350,180]],
      seals:[[2140,292],[4100,392]],hazards:[[1160,56],[2890,64],[3830,60]],
      encounters:[[422,'blade',400],[1050,'caster',327],[1450,'shield',400],[1950,'blade',400],[2160,'shield',300],[2390,'caster',210],[2860,'shield',400],[3220,'caster',327],[3710,'blade',400],[4150,'caster',327],[4680,'shield',400]],
      supplies:[[575,244,'focus'],[3040,239,'heal'],[4700,314,'focus']],landmarks:[750,1630,2520,3430,4320]},
    {ground:[[0,860],[980,750],[1850,790],[2760,710],[3590,1570]],
      ledges:[[300,350,160],[530,280,150],[760,350,230],[1120,350,140],[1330,280,150],[1550,340,190],[1740,350,130],[1990,350,150],[2230,270,190],[2510,350,260],[2910,350,150],[3140,280,170],[3370,350,240],[3740,350,160],[3970,280,170],[4250,350,170],[4560,300,190]],
      seals:[[1620,292],[4260,392]],hazards:[[1190,62],[2130,64],[3020,56],[3980,60]],
      encounters:[[422,'blade',400],[1060,'shield',400],[1490,'caster',237],[1650,'shield',300],[2060,'caster',327],[2420,'blade',400],[2930,'shield',400],[3250,'caster',237],[3750,'blade',400],[4200,'shield',400],[4510,'caster',327],[4810,'blade',400]],
      supplies:[[580,244,'heal'],[2280,234,'focus'],[4610,264,'heal']],landmarks:[850,1720,2630,3460]}
  ];
  K.makeRoom = function(seed,stage) {
    const random=K.rng(K.seedNumber(seed)+stage*9719),boss=stage===3;
    const room={width:boss?960:5160,platforms:[],hazards:[],enemies:[],seals:[],pickups:[],exit:boss?900:5060,variant:Math.floor(random()*1000),midClaimed:false,landmarks:[],signs:[]};
    if(boss){room.platforms.push({x:0,y:440,w:960,h:110,solid:true},{x:120,y:345,w:150,h:16},{x:680,y:345,w:150,h:16});room.enemies.push(K.enemy('boss',710,368,0));return K.enrichRoom(room,stage);}
    const b=BLUEPRINTS[stage];
    b.ground.forEach(([x,w])=>room.platforms.push({x,y:440,w,h:110,solid:true}));
    b.ledges.forEach(([x,y,w],i)=>room.platforms.push({x:x+(i%3===1?(Math.floor(random()*3)-1)*12:0),y,w,h:16}));
    b.hazards.forEach(([x,w])=>room.hazards.push({x,y:427,w,h:13}));
    b.seals.forEach(([x,y],id)=>room.seals.push({id,x,y,w:28,h:48,hp:56,pulse:2.2,warning:false}));
    b.encounters.forEach(([x,kind,y],id)=>{
      if(id>4&&kind==='blade'&&random()>.55)kind='shield';
      room.enemies.push(K.enemy(kind,x+(id===0?0:Math.floor(random()*21)-10),y,id));
    });
    b.supplies.forEach(([x,y,kind])=>room.pickups.push({x,y,w:16,h:20,kind,used:false}));
    room.landmarks=b.landmarks;room.signs=[{x:150,text:'空格长按高跳，松开短跳。'},{x:390,text:'看到举刀再跳；连续轻棍不会冻结敌招。'},{x:room.seals[0].x-100,text:'阵眼破后可按F借灯整顿；山门在右方。'}];
    return K.enrichRoom(room,stage);
  };
  K.options = function(s) {
    const random=K.rng(K.seedNumber(s.seed)+s.stage*771+(s.rewardKind==='mid'?29:91));
    return K.RELICS.filter(r=>!K.has(s,r.id)).map(r=>({id:r.id,n:random()})).sort((a,b)=>a.n-b.n).slice(0,2).map(r=>r.id).concat('rest');
  };
})(globalThis.Kong ||= {});
