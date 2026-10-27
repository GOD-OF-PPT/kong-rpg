(function(K){
  'use strict';
  K.CAMPAIGN=[
    {id:'cloud',name:'云上',image:'realmCloud',color:'#b9dae1',boss:'juling',bossName:'巨灵神',levels:['踏云前哨','巡风断桥','斩云天门'],minis:['持戟校尉','巡风统领'],roles:['戟卫','风弩手','突云盾卫'],lesson:'斧势锁定后绕背；低震起跳，冲斧让路。'},
    {id:'underworld',name:'地府',image:'realmUnderworld',color:'#b6a4d8',boss:'qinguang',bossName:'秦广王',levels:['鬼门引路','判牒回廊','一殿问罪'],minis:['锁魂狱卒','判笔司吏'],roles:['锁魂卒','引灯鬼使','拘魂盾吏'],lesson:'判牒护体时可先破牒；魂印锁定后离开，再寻收笔破绽。'},
    {id:'water',name:'水下',image:'realmWater',color:'#8bd0cd',boss:'ninehead',bossName:'九头虫',levels:['沉渊浅滩','毒潮暗礁','九首盘渊'],minis:['钳潮先锋','毒鳍统领'],roles:['钳潮虾兵','吐珠蚌妖','伏流鳍卫'],lesson:'九首扇毒留有空隙；低潮波可跳，俯冲后追击。'},
    {id:'dragon',name:'龙宫',image:'realmDragon',color:'#8ac9e7',boss:'dragonking',bossName:'东海龙王',levels:['珊庭守廊','潮珠外殿','东海龙座'],minis:['玄甲蟹将','巡潮龙侍'],roles:['珊戟卫','雷珠侍','玄甲蟹兵'],lesson:'潮珠蓄力时可击碎打断潮涌；水柱先定落点，离开再攻。'},
    {id:'heaven',name:'天宫',image:'realmHeaven',color:'#edce8a',boss:'litian',bossName:'托塔天王',levels:['雷诏封阶','天王戍廊','七宝镇天'],minis:['雷诏监军','镇殿天将'],roles:['天戟兵','雷诏使','塔盾禁军'],lesson:'击碎塔基撤去镇压柱；看剑势换位，火轮波可跃过。'}
  ];
  K.CAMPAIGN_LEVELS=15;
  K.chapter=stage=>K.CAMPAIGN[Math.floor(stage/3)];
  K.levelInfo=stage=>{const q=K.chapter(stage),part=stage%3;return{...q,part,name:q.name+' · '+q.levels[part],major:part===2,chief:part===2?q.bossName:q.minis[part],chiefId:part===2?q.boss:q.id+'-mini'+part};};
  K.STAGES=Array.from({length:15},(_,i)=>{const q=K.levelInfo(i);return{name:q.name,subtitle:q.major?q.bossName+'镇守本章':q.minis[q.part]+'镇守关门',sky:'#152332',mist:'#4a5e72',accent:q.color,lore:q.name+'：'+q.lesson};});
  K.GUARDIANS=Array.from({length:15},(_,i)=>{const q=K.levelInfo(i);return{id:q.chiefId,name:q.chief,title:q.name,hp:q.major?300+(Math.floor(i/3)*18):108+Math.floor(i/3)*8,color:q.color,lesson:q.lesson};});
  K.CAMPAIGN_MOVES={
    'axe-cleave':{name:'断云重斧',hint:'方向已定 · 跃起或绕背',fx:'gold-slash'},'axe-quake':{name:'踏云震',hint:'低震将至 · 起跳',fx:'quake'},'axe-rush':{name:'横斧冲阵',hint:'让出冲斧路径',fx:'wind'},
    'judge-mark':{name:'朱笔定罪',hint:'魂印锁定 · 移开落点',fx:'pillar'},'judge-chain':{name:'缚魂锁道',hint:'避开锁链立柱',fx:'pillar'},'judge-echo':{name:'追魂复判',hint:'第二判重新锁定 · 再移位',fx:'meteor'},
    'venom-fan':{name:'九首毒扇',hint:'弹间留隙 · 跳避或返弹',fx:'lotus-orb'},'venom-tide':{name:'污潮横涌',hint:'低潮波 · 跳过',fx:'water'},'head-dive':{name:'九首俯冲',hint:'锁定冲线 · 跃过或退让',fx:'void-slash'},
    'dragon-surge':{name:'东海潮涌',hint:'可破潮珠断招 · 或跳过潮线',fx:'water'},'dragon-column':{name:'双龙水柱',hint:'两个落点已定 · 横移',fx:'water'},'dragon-thunder':{name:'龙角雷诏',hint:'雷柱留隙 · 移出印区',fx:'lightning'},
    'tower-prison':{name:'七宝镇阵',hint:'破塔基可撤光柱 · 避开塔线',fx:'pillar'},'king-sword':{name:'天王断邪',hint:'剑锋锁向 · 绕背或跳避',fx:'silver-slash'},'king-fire':{name:'塔火轮潮',hint:'低位火轮 · 跃起或返弹',fx:'spear-flare'},
    'soldier-slash':{name:'近身斩击',hint:'看刀锋 · 换位',fx:'void-slash'},'soldier-bolt':{name:'锁向远射',hint:'射线已定 · 换高度',fx:'wind'},'soldier-rush':{name:'举盾突进',hint:'正面持盾 · 绕背或重击',fx:'quake'}
  };
  K.campaignName=e=>e.chiefId?K.GUARDIANS[e.stage].name:K.chapter(e.stage).roles[e.role];
  K.rating=function(s){const q=s.campaign,seconds=s.elapsed||0,total=K.campaignEnemyTotal(s.seed,s.difficulty),killed=q.killed.length,time=Math.max(0,35-Math.max(0,seconds-1500)/30),care=Math.max(0,40-q.hits*.5),kills=25*Math.min(1,killed/total),score=Math.round((time+care+kills)*10)/10,grade=score>=90?'S':score>=75?'A':score>=55?'B':'C';return{grade,score,time:+time.toFixed(1),care:+care.toFixed(1),kills:+kills.toFixed(1),seconds:Math.floor(seconds),hits:q.hits,killed,total,complete:s.mode==='won'&&q.completed.length===15,difficulty:s.difficulty};};
  K.validClear=r=>!!r&&r.difficulty==='normal'&&r.complete===true&&r.levels===15&&Number.isFinite(r.seconds)&&r.seconds>=0&&Number.isInteger(r.hits)&&r.hits>=0&&Number.isInteger(r.killed)&&Number.isInteger(r.total)&&r.total>0&&r.killed>=0&&r.killed<=r.total&&35-Math.max(0,r.seconds-1500)/30+Math.max(0,40-r.hits*.5)+25*r.killed/r.total>=89.95;
  K.canChallenge=meta=>K.validClear(meta?.normalClear);
  K.recordClear=function(meta,s){const r=K.rating(s);if(r.complete&&s.difficulty==='normal'&&r.grade==='S')meta.normalClear={difficulty:'normal',complete:true,levels:15,seconds:r.seconds,hits:r.hits,killed:r.killed,total:r.total};return r;};
  K.ratingPanel=(s,meta)=>{const r=K.rating(s),minutes=Math.floor(r.seconds/60),seconds=r.seconds%60;return `<section class="campaign-rating" aria-label="${r.complete?'通关评级':'当前表现估分'}"><b class="rating-grade">${r.grade}</b><div class="rating-breakdown"><strong>${r.complete?'通关评级':'未通关 · 当前估分'} ${r.score} / 100</strong><br>用时 ${minutes}分${seconds}秒 · ${r.time}/35　受伤 ${r.hits}次 · ${r.care}/40<br>计分击杀 ${r.killed}/${r.total} · ${r.kills}/25<br><small>S≥90 · A≥75 · B≥55 · 其余C</small></div><p class="rating-unlock">${K.canChallenge(meta)?'挑战模式已解锁 · 普通十五关S评级已达成':r.complete&&r.difficulty==='normal'?'通关已记录 · 取得S（高于A）可解锁挑战':'普通完整通关且取得S（高于A）后解锁挑战'}</p></section>`;};
})(globalThis.Kong ||= {});
