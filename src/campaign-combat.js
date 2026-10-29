(function(K){
  'use strict';
  const moves=K.CAMPAIGN_MOVES;
  const clampBox=(s,x,y,w,h)=>({x:K.clamp(Math.round(x),8,s.room.width-w-8),y:Math.round(y),w,h});
  const chiefMoves={juling:['axe-cleave','axe-quake','axe-rush'],qinguang:['judge-mark','judge-chain','judge-echo'],ninehead:['venom-fan','venom-tide','head-dive'],dragonking:['dragon-column','dragon-surge','dragon-thunder'],litian:['king-sword','tower-prison','king-fire']};
  K.campaignMoveSet=e=>e.stage%3===2&&e.chiefId?chiefMoves[e.chiefId]:e.chiefId?[
    ['axe-cleave','axe-quake'],['soldier-bolt','axe-rush'],['judge-mark','judge-chain'],['judge-echo','soldier-bolt'],['soldier-rush','venom-tide'],['venom-fan','head-dive'],['soldier-rush','dragon-column'],['dragon-surge','dragon-thunder'],['soldier-bolt','king-fire'],['king-sword','tower-prison']
  ][Math.floor(e.stage/3)*2+e.stage%3]:e.role===0?[K.chapter(e.stage).id==='underworld'?'judge-chain':'soldier-slash']:e.role===1?[{cloud:'soldier-bolt',underworld:'judge-mark',water:'venom-fan',dragon:'dragon-column',heaven:'dragon-thunder'}[e.realm]]:['soldier-rush'];
  K.beginCampaignMove=function(s,e,move,target=s.player,echo=false){
    const major=K.isMajor(e),a=s.room.arena,px=target.x+12,face=Math.sign(px-e.x-e.w/2)||e.face;
    e.face=face;e.move=move;e.phase='campaign-windup';e.timer=major?(echo?.68:e.stage%3===2?.84:.92):.85;if(!major&&echo)e.timer*=.75;e.aimX=px;e.aimY=target.y+18;e.marks=[];
    const local=(range,h=40,y=e.y+e.h-42)=>clampBox(s,face>0?e.x+e.w-5:e.x-range,y,range,h);
    if(['axe-cleave','king-sword','soldier-slash'].includes(move))e.marks=[local(major?190:e.trait==='twin'&&echo?132:100,major?50:38)];
    else if(['axe-rush','head-dive','soldier-rush'].includes(move)){e.campChargeTo=K.clamp(e.x+face*(major?300:175),major?a.min:K.patrolBounds(s,e).min,major?a.max-e.w:K.patrolBounds(s,e).max);e.marks=[clampBox(s,Math.min(e.x,e.campChargeTo)-4,e.y+8,Math.abs(e.campChargeTo-e.x)+e.w+8,e.h-10)];}
    else if(['axe-quake','venom-tide','king-fire','shield-wave'].includes(move))e.marks=move==='axe-quake'?[clampBox(s,e.x-(major?290:130),418,major?580:260,22)]:[local(Math.max(18,Math.min(major?580:260,face>0?s.room.width-8-(e.x+e.w-5):e.x-8)),22,418)];
    else if(['judge-mark','judge-echo','dragon-column','dragon-thunder','judge-chain','tower-prison'].includes(move)){
      const count=move==='dragon-column'?2:move==='judge-chain'?2:move==='dragon-thunder'&&major?3:1,w=move==='dragon-column'?66:move==='judge-chain'?38:76,h=move==='judge-chain'?190:move==='dragon-column'?160:90;
      for(let i=0;i<count;i++){const off=move==='judge-chain'?(i===0?-115:125):(i-(count-1)/2)*150;e.marks.push(clampBox(s,px-w/2+off,440-h,w,h));}
      if(move==='tower-prison'&&s.room.anchors.length){const q=s.room.anchors[0];q.active=true;q.hp=q.maxHp;q.hits=[];e.marks=[clampBox(s,q.x-30,260,90,180),clampBox(s,q.x+350,260,80,180)];}
    }else if(move==='dragon-surge'){
      e.marks=[clampBox(s,major?a.min:e.x-200,419,major?a.max-a.min:400,21)];const q=s.room.anchors.find(q=>q.kind==='pearl');if(q){q.active=true;q.hp=q.maxHp;q.hits=[];}
    }else if(move==='venom-fan'){
      const width=major?530:390;for(const y of [292,358,424])e.marks.push(clampBox(s,face>0?e.x+e.w:e.x-width,y,width,12));
    }else if(move==='soldier-bolt'){const ys=e.trait==='volley'?[-62,0,62]:[0],center=e.trait==='volley'?K.clamp(target.y+12,312,360):K.clamp(target.y+12,250,423);e.marks=ys.map(dy=>clampBox(s,face>0?e.x+e.w:e.x-450,center+dy,450,14));}
    if(e.chiefId&&e.stage%3===2&&e.realm==='underworld')for(const q of s.room.anchors)if(e.attacks<=1)q.active=true;
    K.event(s,major?'boss-warning':'warning',{id:e.id,move,name:K.campaignName(e),box:e.marks[0]});
  };
  K.campaignHitDamage=(e,type='area')=>e.chiefId&&e.stage%3===2?(type==='charge'?30:type==='projectile'?28:36):K.isMajor(e)?(type==='charge'?16:18):(type==='charge'?11:type==='projectile'?12:10);
  const addDanger=(s,e,b)=>s.dangers.push({...b,life:.35,damage:K.campaignHitDamage(e),source:K.campaignName(e)+'·'+moves[e.move].name,spell:e.move});
  K.releaseCampaignMove=function(s,e){
    K.event(s,'enemy-attack',{id:e.id,kind:e.kind,move:e.move});
    if(['axe-rush','head-dive','soldier-rush'].includes(e.move)){e.phase='campaign-charge';e.timer=.6;return;}
    if(['venom-fan','soldier-bolt','venom-tide','king-fire','shield-wave'].includes(e.move)){
      for(const b of e.marks){const speed=e.move==='soldier-bolt'?290:e.move==='venom-fan'?245:210;const face=e.face,x=face>0?b.x:b.x+b.w-18;s.projectiles.push({x,y:b.y,w:18,h:Math.min(14,b.h),vx:face*speed,vy:0,life:Math.max(.4,(b.w-18)/speed),damage:K.campaignHitDamage(e,'projectile'),friendly:false,source:K.campaignName(e)+'·'+moves[e.move].name,spell:e.move});}
    }else for(const b of e.marks)addDanger(s,e,b);
    e.phase='campaign-active';e.timer=.35;
  };
  function tick(s,e,dt,target){
    if(e.phase==='campaign-windup'){if(e.timer<=0)K.releaseCampaignMove(s,e);return true;}
    if(e.phase==='campaign-charge'){
      const dx=e.campChargeTo-e.x;e.x+=Math.sign(dx)*Math.min(Math.abs(dx),490*K.enemySpeed(s,e)*dt);if(K.overlap(s.player,{x:e.x,y:e.y+8,w:e.w,h:e.h-10}))K.withHurtBox(s,{x:e.x,y:e.y+8,w:e.w,h:e.h-10},()=>K.damage(s,K.campaignHitDamage(e,'charge'),K.campaignName(e)+'·'+moves[e.move].name,e.face));
      if(e.timer<=0||Math.abs(e.campChargeTo-e.x)<1){e.phase='campaign-active';e.timer=.12;}return true;
    }
    if(e.phase==='campaign-active'){
      if(e.timer<=0){if(K.campaignFollowup){const follow=K.campaignFollowup(s,e,target);if(follow){e.repeat=1;K.beginCampaignMove(s,e,follow,target,true);}else{e.phase='recover';e.timer=K.campaignRecovery(e);e.marks=[];K.event(s,'enemy-opening',{id:e.id,move:e.move,seconds:e.timer});}return true;}if(e.trait==='pulse'&&e.move==='soldier-rush'&&e.repeat===0){e.repeat=1;K.beginCampaignMove(s,e,'shield-wave',target,true);return true;}const major=K.isMajor(e),needsEcho=e.trait==='twin'&&e.move==='soldier-slash'||e.move==='judge-echo'||major&&(K.isChallenge(s)&&e.attacks%2===0||e.stage%3===2&&e.attacks%2===1);
        if(needsEcho&&e.repeat===0){const next=major?({'axe-cleave':'axe-quake','axe-quake':'axe-rush','axe-rush':'axe-cleave','venom-fan':'venom-tide','venom-tide':'head-dive','head-dive':'venom-fan','dragon-column':'dragon-surge','dragon-surge':'dragon-thunder','dragon-thunder':'dragon-column','king-sword':'king-fire','king-fire':'tower-prison','tower-prison':'king-sword'}[e.move]||e.move):e.move;e.repeat=1;K.beginCampaignMove(s,e,next,target,true);}
        else{e.phase='recover';e.timer=major?(e.stage%3===2?.55:1.25):1.05;e.marks=[];}}
      return true;
    }
    if(e.phase==='recover'){if(!K.campaignRecovery&&e.chiefId&&e.stage%3===2){const speed=e.timer>.40?(e.chiefId==='ninehead'?440:e.chiefId==='qinguang'?340:400):0;e.x=K.clamp(e.x-e.face*speed*dt,s.room.arena.min,s.room.arena.max-e.w);}if(e.timer<=0){e.phase='idle';e.timer=K.isMajor(e)?.18:.5;}return true;}
    if(e.phase==='idle'){
      const dx=target.x-e.x,near=Math.abs(dx),max=K.isMajor(e)?1050:550;
      if(near>max)return true;
      if(!K.isMajor(e)&&e.role!==1&&near>110){const bounds=K.patrolBounds(s,e);e.face=Math.sign(dx)||e.face;e.x=K.clamp(e.x+e.face*(e.role===2?47:75)*K.enemySpeed(s,e)*dt,bounds.min,bounds.max);}
      if(e.timer<=0&&(K.isMajor(e)||near<(e.role===1?550:e.role===2?330:150))){
        if(!K.isMajor(e)&&s.room.enemies.filter(q=>q.hp>0&&!K.isMajor(q)&&q.phase==='campaign-windup'&&Math.abs(q.x-s.player.x)<600).length>=(K.isChallenge(s)?3:2))return true;
        const seq=K.campaignMoveSet(e);let move=K.chooseCampaignMove?K.chooseCampaignMove(s,e,target):seq[e.attacks%seq.length];if(!K.chooseCampaignMove&&e.stage%3===2&&near>320)move=({juling:'axe-rush',qinguang:'judge-echo',ninehead:'head-dive',dragonking:'dragon-column',litian:'tower-prison'}[e.chiefId])||move;e.attacks++;e.repeat=0;K.beginCampaignMove(s,e,move,target);
        if(e.chiefId==='litian'&&e.attacks===2)for(const q of s.room.enemies)if(q.id>=950&&q.id<960){q.hp=q.maxHp;q.dormant=false;q.phase='idle';q.timer=.9;K.event(s,'world-note',{text:'塔兵应召，先辨近刀与远射；召兵不计歼敌分。'});}
      }return true;
    }
    return true;
  }
  K.stepWarden=(s,e,dt,target)=>tick(s,e,dt,target);
  K.stepCounter=function(s,e,dt,target){if(K.isMajor(e))return false;return tick(s,e,dt,target);};
  const box=K.enemyAttackBox;K.enemyAttackBox=function(e){if(e.chiefId||e.style==='campaign'){if(e.phase==='campaign-charge')return{x:e.x,y:e.y+8,w:e.w,h:e.h-10};if(e.marks?.length)return e.marks[0];return{x:e.x,y:e.y+e.h-30,w:e.w,h:30};}return box(e);};
  K.hitAnchor=function(s,q,n,key){if(!q.active||q.hp<=0||q.hits.includes(key))return;q.hits.push(key);if(q.hits.length>30)q.hits.shift();q.hp=Math.max(0,q.hp-n);K.effect(s,'hit',q.x+q.w/2,q.y+10,{text:String(n)});K.event(s,'anchor-hit',{id:q.id,kind:q.kind});
    if(q.hp===0){const key=s.stage+':'+q.id;s.campaign.anchorHeals||=[];if(K.has(s,'mercy')&&!s.campaign.anchorHeals.includes(key)){s.campaign.anchorHeals.push(key);s.player.hp=Math.min(K.maxHP(s),s.player.hp+12);K.event(s,'ability-note',{text:'护生灯 · 破械回复12生命'});}K.effect(s,'rubble',q.x+14,q.y+30);K.event(s,'anchor-break',{kind:q.kind});const e=K.guardian(s);if(e?.hp>0&&q.kind!=='writ'){e.phase='recover';e.timer=2;e.marks=[];s.dangers=s.dangers.filter(d=>!d.source.startsWith(K.campaignName(e)));}}
  };
  const strike=K.strike;K.strike=function(s,b,n,origin,pierce,targets,impact){strike(s,b,n,origin,pierce,targets,impact);if(s.mode!=='playing')return;for(const q of s.room.anchors)if(q.active&&q.hp>0&&K.overlap(b,q)&&!targets.includes('a'+q.id)){targets.push('a'+q.id);K.hitAnchor(s,q,n,'strike:'+s.time+':'+targets.join(','));}};
  K.resolveArrowContact=function(s,line){
    function entry(b){let lo=0,hi=1;for(const [start,delta,min,max]of [[line.ax,line.bx-line.ax,b.x-3,b.x+b.w+3],[line.ay,line.by-line.ay,b.y-3,b.y+b.h+3]]){if(Math.abs(delta)<1e-8){if(start<min||start>max)return null;}else{const a=(min-start)/delta,z=(max-start)/delta;lo=Math.max(lo,Math.min(a,z));hi=Math.min(hi,Math.max(a,z));if(lo>hi)return null;}}return lo;}
    const candidates=[];
    for(const e of s.room.enemies)if(e.hp>0&&!e.dormant){const t=entry(e);if(t!==null)candidates.push({t,type:'enemy',q:e});}
    for(const q of s.room.anchors)if(q.hp>0&&q.active){const t=entry(q);if(t!==null)candidates.push({t,type:'anchor',q});}
    for(const q of s.room.seals)if(q.hp>0){const t=entry(q);if(t!==null)candidates.push({t,type:'seal',q});}
    candidates.sort((a,b)=>a.t-b.t);const first=candidates[0];if(!first)return false;
    const damage=K.has(s,'staff')?42:32;
    if(first.type==='enemy')K.withContact(s,{x:Math.min(line.ax,line.bx)-3,y:Math.min(line.ay,line.by)-3,w:Math.abs(line.bx-line.ax)+6,h:Math.abs(line.by-line.ay)+6},()=>K.hitEnemy(s,first.q,damage,line.ax,K.has(s,'staff'),'arrow'));
    else if(first.type==='anchor')K.hitAnchor(s,first.q,damage,'arrow:'+s.time);
    else K.hitSeal(s,first.q,damage,line.ax,'arrow');
    return true;
  };
  const step=K.step;K.step=function(s,a={},dt=K.DT){const running=s.mode==='playing'&&s.hitstop<=0;step(s,a,dt);if(!running||s.mode!=='playing')return;
    for(const q of s.room.anchors){if(!q.active||q.hp<=0)continue;
      if(s.arm?.phase==='thrust'&&.18-s.arm.timer>=.065&&s.arm.timer>=.025){const line=K.staffLine(s),tip={...line,ax:line.bx-s.arm.face*(K.has(s,'staff')?70:42)};if(K.lineHits(line,q))K.hitAnchor(s,q,s.arm.charge>=.3&&K.lineHits(tip,q)?34:16,'staff:'+(s.time-(.18-s.arm.timer)).toFixed(3));}
      if(s.celestial.cast?.id==='eye-beam'&&s.celestial.cast.age>=.32&&s.celestial.cast.age<.96&&K.lineHits(K.artBeamLine(s),q,12))K.hitAnchor(s,q,16,'beam:'+(s.time-s.celestial.cast.age).toFixed(3)+':'+s.celestial.cast.pulse);
    }
    const e=K.guardian(s);if(e&&e.hp<=0)for(const q of s.room.anchors)q.active=false;
  };
  K.challengePhaseText=e=>{if(e.phase==='recover')return '收招撤步 · 跟进全伤';if(!e.move||!moves[e.move])return '';const hint=e.stage%3!==2&&e.move==='dragon-surge'?'低潮将至 · 起跳避浪':e.stage%3!==2&&e.move==='tower-prison'?'镇压落点已定 · 横移':moves[e.move].hint;return moves[e.move].name+' · '+hint+(e.repeat?' · 追击':' · 正面架势');};
  K.friendlyAnchorContacts=function(s,b){for(const q of s.room.anchors)if(q.active&&q.hp>0&&K.overlap(b,q)&&!(b.anchorHits||[]).includes(q.id)){(b.anchorHits||=[]).push(q.id);K.hitAnchor(s,q,b.damage||18,'projectile:'+s.time+':'+b.x);}};
})(globalThis.Kong ||= {});
