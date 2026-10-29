(function(K){
  'use strict';
  // One source of truth for the weapon's commitment, contact and drawn trail.
  const weapons={
    wukong:[{duration:.24,start:.042,end:.12,damage:14,range:70,y:-14,h:48,origin:2,shape:'sweep'}, {duration:.29,start:.075,end:.18,damage:15,range:85,y:-30,h:65,origin:2,shape:'lift'}, {duration:.43,start:.14,end:.25,damage:30,range:96,y:-28,h:72,origin:8,shape:'smash'}],
    nezha:[{duration:.21,start:.025,end:.085,damage:12,range:112,y:-12,h:30,origin:1,shape:'thrust'}, {duration:.27,start:.067,end:.16,damage:13,range:74,y:-70,h:104,origin:-23,shape:'rise'}, {duration:.42,start:.125,end:.22,damage:29,range:132,y:-8,h:28,origin:2,shape:'lunge'}],
    erlang:[{duration:.28,start:.067,end:.16,damage:16,range:98,y:-26,h:65,origin:3,shape:'cut'}, {duration:.30,start:.083,end:.19,damage:15,range:72,y:-70,h:104,origin:-23,shape:'hook'}, {duration:.46,start:.15,end:.27,damage:33,range:94,y:-35,h:79,origin:7,shape:'cleave'}]
  };
  K.WEAPON_STYLES=weapons;
  K.weaponSpec=(hero,combo=1)=>weapons[hero||'wukong'][K.clamp((combo||1)-1,0,2)];
  K.attackTiming=p=>K.weaponSpec(p.hero,p.comboIndex);
  K.attackDuration=s=>K.weaponSpec(s.hero,s.player.comboIndex).duration+(s.player.comboIndex===3&&K.has(s,'staff')?.04:0);
  K.attackDamage=s=>K.weaponSpec(s.hero,s.player.comboIndex).damage;
  K.attackBox=s=>{const p=s.player,t=K.weaponSpec(s.hero,p.comboIndex),extra=(!p.grounded&&K.has(s,'cloud')?16:0)+(s.hero==='wukong'&&p.comboIndex===3&&K.has(s,'staff')?16:0),w=t.range+extra;return{x:p.face>0?p.x+10:p.x+14-w,y:p.y+t.y,w,h:t.h};};

  const major=e=>!!e.chiefId&&e.stage%3===2;
  // Use only observable distance/elevation, previous move and health. Nothing
  // reads the player's next input or changes a locked windup/active hit box.
  K.chooseCampaignMove=function(s,e,target){
    const seq=K.campaignMoveSet(e);if(!major(e))return seq[e.attacks%seq.length];
    const distance=Math.abs(target.x+12-e.x-e.w/2),air=target.y+44<e.y+e.h-45,last=e.move;
    let id;
    if(e.chiefId==='juling')id=distance>245?'axe-rush':last==='axe-cleave'?'axe-quake':'axe-cleave';
    else if(e.chiefId==='qinguang')id=distance<200&&last!=='judge-chain'?'judge-chain':last==='judge-mark'?'judge-echo':'judge-mark';
    else if(e.chiefId==='ninehead')id=distance>255&&last!=='head-dive'?'head-dive':air?'venom-fan':distance<170?(last==='venom-tide'?'head-dive':'venom-tide'):last==='venom-fan'?'venom-tide':'venom-fan';
    else if(e.chiefId==='dragonking')id=(air||distance<205)&&last!=='dragon-thunder'?'dragon-thunder':last==='dragon-thunder'?'dragon-surge':last==='dragon-surge'?'dragon-column':'dragon-surge';
    else if(e.chiefId==='litian')id=distance<205&&last!=='king-sword'?'king-sword':last==='tower-prison'?'king-fire':'tower-prison';
    // Never loop a far-distance rush or targeted spell indefinitely.
    if(id===last)id=seq[(seq.indexOf(last)+1)%seq.length];
    return id||seq[0];
  };
  K.campaignWindup=function(s,e,move,echo=false){
    const base={'axe-cleave':.72,'axe-quake':.84,'axe-rush':.78,'judge-mark':.76,'judge-chain':.90,'judge-echo':.78,'venom-fan':.72,'venom-tide':.80,'head-dive':.86,'dragon-column':.88,'dragon-surge':.86,'dragon-thunder':.95,'tower-prison':.94,'king-sword':.68,'king-fire':.82,'soldier-slash':.60,'soldier-bolt':.82,'soldier-rush':.76,'shield-wave':.72}[move]||.85;
    return base*(major(e)?1:K.isMajor(e)?1.08:1)*(echo?.9:1)*(K.isChallenge(s)?.92:1);
  };
  K.campaignRecovery=e=>major(e)?.62*({'axe-cleave':.90,'axe-quake':1.02,'axe-rush':1.12,'judge-mark':.74,'judge-chain':.88,'judge-echo':1.02,'venom-fan':.78,'venom-tide':.82,'head-dive':1.10,'dragon-column':.82,'dragon-surge':.92,'dragon-thunder':.96,'tower-prison':.98,'king-sword':.86,'king-fire':.88}[e.move]||.90):K.isMajor(e)?1.25:1.05;
  K.campaignFollowup=function(s,e,target){
    if(e.repeat!==0)return null;
    if(!major(e))return e.trait==='pulse'&&e.move==='soldier-rush'?'shield-wave':e.trait==='twin'&&e.move==='soldier-slash'||e.move==='judge-echo'?e.move:null;
    if(e.chiefId==='qinguang'&&e.move==='judge-echo')return 'judge-echo';
    const distance=Math.abs(target.x+12-e.x-e.w/2),press=K.isChallenge(s)||e.hp<=e.maxHp*.5||e.attacks%2===1;
    if(!press)return null;
    if(e.chiefId==='juling')return e.move==='axe-rush'?'axe-cleave':e.move==='axe-cleave'?'axe-quake':null;
    if(e.chiefId==='qinguang')return e.move==='judge-chain'?'judge-mark':e.move==='judge-echo'?'judge-echo':null;
    if(e.chiefId==='ninehead')return e.move==='venom-fan'?'venom-tide':e.move==='head-dive'?'venom-fan':null;
    if(e.chiefId==='dragonking')return e.move==='dragon-surge'?'dragon-column':e.move==='dragon-column'&&target.y<350?'dragon-thunder':null;
    if(e.chiefId==='litian')return e.move==='tower-prison'?'king-fire':e.move==='king-sword'&&distance<240?'king-fire':null;
    return null;
  };
  const begin=K.beginCampaignMove;K.beginCampaignMove=function(s,e,move,target=s.player,echo=false){
    begin(s,e,move,target,echo);e.timer=K.campaignWindup(s,e,move,echo);
    // Keep the originally announced area fixed all the way to release.
    K.event(s,'enemy-commit',{id:e.id,move,echo,windup:e.timer,marks:e.marks.map(b=>({...b})),face:e.face});
  };
  const phaseText=K.challengePhaseText;K.challengePhaseText=e=>e.phase==='recover'?'破绽 · 停势可追击':phaseText(e)+(major(e)&&e.hp<=e.maxHp*.5?' · 二式':e.repeat?' · 连式':'');
})(globalThis.Kong ||= {});
