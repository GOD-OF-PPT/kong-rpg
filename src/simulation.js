(function (K) {
  'use strict';
  K.newRun = function (seed, first) {
    const s = { version:2, rules:2, seed:String(seed || 'BLACK-LOTUS'), stage:0, mode:'playing',time:0,elapsed:0,roomTime:0,relics:first?[first]:[],room:null,player:null,clone:null,projectiles:[],effects:[],events:[],log:[],reward:[],rewardKind:'exit',pendingRelic:null,kills:0,broken:0,damageTaken:0,lastDamage:'',hitstop:0,shake:0,checkpoint:90,combo:0,comboTime:0,serial:0,hints:[],stats:{swings:0,hits:0,blocks:0,jumps:0,dashes:0,clones:0,focusSpent:0,rests:0} };
    K.enterRoom(s, 0, true); return s;
  };
  K.enterRoom = function (s, stage, initial) {
    const old = s.player;
    s.stage = stage; s.room = K.makeRoom(s.seed, stage); s.roomTime = 0; s.checkpoint = 90;
    s.player = { x:90,y:380,w:24,h:44,vx:0,vy:0,face:1,hp:initial?100:Math.min(100,old.hp+18),focus:initial?65:Math.min(100,old.focus+20),grounded:false,coyote:0,buffer:0,airJumps:0,invuln:.8,dash:0,dashCD:0,attack:0,attackId:0,attackTargets:[],comboIndex:0,slam:false,landing:0,drop:0,hurt:0,attackBuffer:0 };
    s.clone=null;s.projectiles=[];s.effects=[];s.hitstop=0;s.mode='playing';s.pendingRelic=null;s.reward=[];
    K.event(s, 'room', { stage });
  };
  K.event = function(s,type,data={}){const e={type,t:+s.time.toFixed(3),wall:+(s.elapsed||0).toFixed(3),...data};s.events.push(e);s.log.push(e);if(s.log.length>400)s.log.shift();const stat={swing:'swings',hit:'hits',blocked:'blocks',jump:'jumps',dash:'dashes',clone:'clones'}[type];if(stat&&s.stats)s.stats[stat]++;};
  K.effect = (s, kind, x, y, extra = {}) => s.effects.push({ kind, x, y, life: kind === 'ring' ? .5 : .42, ...extra });
  K.damage = function (s, n, source, knock = 0) {
    const p = s.player; if (s.mode !== 'playing' || p.invuln > 0) return false;
    p.hp=Math.max(0,p.hp-n);p.invuln=1;p.hurt=.24;p.vx=knock*200;p.vy=-200;p.attack=0;p.attackBuffer=0;
    s.damageTaken += n; s.lastDamage = source; s.shake = .18;
    K.effect(s, 'hurt', p.x, p.y, { text: '-' + n }); K.event(s, 'hurt', { source, amount: n });
    if (p.hp <= 0) { s.mode = 'dead'; K.event(s, 'death', { source }); }
    return true;
  };
  K.hitEnemy = function (s, e, amount, origin, pierce = false, impact='light') {
    if (e.hp <= 0) return false;
    const front = (origin - (e.x + e.w / 2)) * e.face > 0;
    if(e.kind==='boss'&&e.phase!=='recover'&&front){amount=Math.ceil(amount*.4);K.effect(s,'block',e.x+24,e.y+20);K.event(s,'boss-guard',{chip:amount});}
    if (e.kind === 'shield' && front && !pierce && e.stun <= 0 && e.phase !== 'recover') { K.effect(s, 'block', e.x, e.y + 12); K.event(s, 'blocked', { target: e.id }); s.player.focus = Math.min(100, s.player.focus + 3); return false; }
    e.hp=Math.max(0,e.hp-amount);e.flash=.13;e.stun=e.kind==='boss'?0:.065;
    if(e.kind!=='boss'&&impact==='heavy'&&e.phase==='windup'&&(e.interruptLock||0)<=0){e.phase='recover';e.timer=.7;e.interruptLock=1;K.event(s,'interrupt',{target:e.id});K.effect(s,'block',e.x+12,e.y+4);}
    if(e.kind!=='boss'){const bounds=K.patrolBounds(s,e);e.x=K.clamp(e.x+Math.sign(e.x-origin)*12,bounds.min,bounds.max);}
    K.effect(s, 'hit', e.x + e.w / 2, e.y + 15, { text: String(amount), color: '#f2d28f' });
    s.hitstop = .035; s.shake = .07; K.event(s, 'hit', { target: e.id, kind: e.kind, amount });
    if (e.hp === 0) { s.kills++; s.player.focus = Math.min(100, s.player.focus + 10); K.event(s, 'kill', { kind: e.kind });
      if (e.kind === 'boss') { s.mode = 'won'; K.event(s, 'victory'); }
    }
    return true;
  };
  K.strike = function (s, box, amount, origin, pierce, targets, impact='light') {
    for (const e of s.room.enemies) if (e.hp > 0 && K.overlap(box, e) && !targets.includes('e' + e.id)) {
      targets.push('e'+e.id);if(K.hitEnemy(s,e,amount,origin,pierce,impact))s.player.focus=Math.min(100,s.player.focus+12);
    }
    for (const seal of s.room.seals) if (seal.hp > 0 && K.overlap(box, seal) && !targets.includes('s' + seal.id)) {
      targets.push('s' + seal.id); seal.hp = Math.max(0, seal.hp - amount); s.player.focus = Math.min(100, s.player.focus + 9);
      K.effect(s, 'hit', seal.x + 14, seal.y + 10, { text: String(amount), color: '#e3b3ed' }); K.event(s, 'seal-hit', { id: seal.id });
      if (seal.hp === 0) { s.broken++; K.effect(s, 'ring', seal.x + 14, seal.y + 20); K.event(s, 'seal', { id: seal.id }); if (K.has(s, 'mercy')) s.player.hp = Math.min(100, s.player.hp + 12); }
    }
  };
  K.attackBox = function (s) {
    const p = s.player; const range = p.comboIndex === 3 ? (K.has(s, 'staff') ? 112 : 79) : !p.grounded && K.has(s, 'cloud') ? 86 : 65;
    return { x: p.face > 0 ? p.x + 10 : p.x + 14 - range, y: p.y + 2, w: range, h: 42 };
  };
  K.step = function (s, a = {}, dt = K.DT) {
    s.events = []; if (s.mode !== 'playing') return;
    s.elapsed=(s.elapsed||0)+dt;
    if (s.hitstop > 0) { s.hitstop = Math.max(0, s.hitstop - dt); return; }
    s.time += dt; s.roomTime += dt; s.shake = Math.max(0, s.shake - dt);
    for (const fx of s.effects) fx.life -= dt; s.effects = s.effects.filter(fx => fx.life > 0);
    const p = s.player; const oldY = p.y;
    for(const key of ['invuln','dashCD','landing','buffer','coyote','drop','hurt','attackBuffer'])p[key]=Math.max(0,(p[key]||0)-dt);
    if(a.attackPressed)p.attackBuffer=.12;
    s.comboTime = Math.max(0, s.comboTime - dt); if (s.comboTime === 0) s.combo = 0;
    if (a.jumpPressed) p.buffer = .12;
    if (p.grounded) { p.coyote = .10; p.airJumps = 0; const safeGround=s.room.platforms.some(q=>q.solid&&Math.abs(p.y+p.h-q.y)<3&&p.x>q.x+60&&p.x<q.x+q.w-130);if(safeGround&&!s.room.hazards.some(h => Math.abs(h.x - p.x) < 120)) s.checkpoint = p.x; }
    if(a.down&&a.jumpPressed&&p.grounded&&s.room.platforms.some(q=>!q.solid&&Math.abs(p.y+p.h-q.y)<3&&p.x+p.w>q.x&&p.x<q.x+q.w)){p.drop=.28;p.y+=4;p.vy=90;p.buffer=0;p.coyote=0;p.grounded=false;K.event(s,'drop');}
    if (a.dashPressed && p.dashCD === 0 && !p.slam) { p.dash = .18; p.dashCD = .85; p.invuln = Math.max(p.invuln, .21); p.attack = 0; p.vy = 0; K.event(s, 'dash'); }
    if (a.clonePressed && !s.clone) {
      const cost = K.has(s, 'echo') ? 50 : 40;
      if(p.focus>=cost){p.focus-=cost;s.stats.focusSpent+=cost;s.clone={x:p.x,y:p.y,w:24,h:44,face:p.face,life:K.has(s,'echo')?3:1.8,timer:.12};K.event(s,'clone',{cost});}
      else { K.event(s, 'empty-focus'); K.effect(s, 'notice', p.x, p.y - 14, { text: '定力不足' }); }
    }
    const moving = (a.right ? 1 : 0) - (a.left ? 1 : 0);
    if (moving && !p.dash && !p.slam) p.face = moving;
    if (a.aimFace && a.attack && p.attack <= 0) p.face = a.aimFace;
    if (p.buffer > 0 && !p.slam && !p.dash && (p.coyote > 0 || (K.has(s, 'cloud') && p.airJumps < 1))) {
      const air = p.coyote === 0; p.vy = air ? -490 : -590; if (air) p.airJumps++; p.buffer = 0; p.coyote = 0; p.grounded = false; K.event(s, 'jump', { air }); K.effect(s, 'dust', p.x + 12, p.y + 44);
    }
    if (!a.jump && p.vy < -210) p.vy += 1800 * dt;
    if((a.attack||p.attackBuffer>0)&&p.attack<=0&&p.landing===0&&p.dash<=0){
      p.attackBuffer=0;
      if (a.down && !p.grounded) { p.slam = true; p.vy = 650; p.vx = 0; K.event(s, 'slam'); }
      else { s.combo = s.combo % 3 + 1; s.comboTime = .8; p.comboIndex = s.combo; p.attack = p.comboIndex === 3 ? (K.has(s, 'staff') ? .48 : .38) : .29; p.attackDuration = p.attack; p.attackTargets = []; p.attackId++; K.event(s, 'swing', { combo: p.comboIndex }); }
    }
    if (p.attack > 0) {
      const elapsed = p.attackDuration - p.attack;
      if(elapsed>=.055&&elapsed<.18)K.strike(s,K.attackBox(s),p.comboIndex===3?27:14,p.x+12,p.comboIndex===3&&K.has(s,'staff'),p.attackTargets,p.comboIndex===3?'heavy':'light');
      p.attack = Math.max(0, p.attack - dt);
    }
    if (p.dash > 0) { p.dash = Math.max(0, p.dash - dt); p.vx = p.face * 650; p.vy = 0; if (Math.floor(s.time * 45) % 2 === 0) K.effect(s, 'trail', p.x, p.y, { face: p.face }); }
    else if (!p.slam) { const target = moving * (p.attack > .08 && p.grounded ? 125 : 245); p.vx += (target - p.vx) * Math.min(1, dt * (p.grounded ? 18 : 10)); p.vy = Math.min(p.vy + 1570 * dt, 800); }
    p.x = K.clamp(p.x + p.vx * dt, 8, s.room.width - p.w - 8); p.y += p.vy * dt; p.grounded = false;
    for (const platform of s.room.platforms) if ((platform.solid||p.drop===0) && p.vy >= 0 && oldY + p.h <= platform.y + 5 && p.y + p.h >= platform.y && p.x + p.w > platform.x + 2 && p.x < platform.x + platform.w - 2) {
      p.y = platform.y - p.h; p.vy = 0; p.grounded = true;
      if(p.slam){p.slam=false;p.landing=.15;const fire=K.has(s,'flame');K.strike(s,{x:p.x-(fire?115:50),y:p.y-8,w:fire?260:124,h:80},fire?36:22,p.x+12,true,[],'heavy');K.effect(s,'ring',p.x+12,p.y+p.h,{fire});K.event(s,'slam-land',{fire});}
    }
    if (p.y > 590) { p.invuln = 0; K.damage(s, 18, '坠入云渊'); p.x = K.clamp(s.checkpoint - 35, 30, s.room.width - 100); p.y = 396; p.vy = 0; p.vx = 0; p.slam = false; }
    for (const h of s.room.hazards) if (K.overlap(p, h)) K.damage(s, 14, '黑莲地刺', -p.face);
    for (const item of s.room.pickups) if (!item.used && K.overlap(p, item)) { item.used = true; if (item.kind === 'heal') p.hp = Math.min(100, p.hp + 22); else p.focus = Math.min(100, p.focus + 30); K.event(s, 'pickup', { kind: item.kind }); K.effect(s, 'notice', p.x, p.y - 5, { text: item.kind === 'heal' ? '生命 +22' : '定力 +30' }); }
    if (s.clone) {
      const c = s.clone; c.life -= dt; c.timer -= dt;
      if (c.timer <= 0) { c.timer = .52; const candidates = s.room.enemies.filter(e => e.hp > 0); const target = candidates.sort((a, b) => Math.abs(a.x - c.x) - Math.abs(b.x - c.x))[0]; c.face = target ? Math.sign(target.x - c.x) || 1 : c.face;
        if (K.has(s, 'echo')) s.projectiles.push({ x: c.x + 12, y: c.y + 20, vx: c.face * 440, vy: 0, w: 22, h: 14, life: 1.7, friendly: true, damage: 18 });
        else K.strike(s, { x: c.face > 0 ? c.x : c.x - 65, y: c.y, w: 90, h: 48 }, 12, c.x, false, []);
        K.effect(s, 'clone-swing', c.x + 12 + c.face * 30, c.y + 18); K.event(s, 'clone-strike');
      }
      if (c.life <= 0) { if (K.has(s, 'mercy')) p.focus = Math.min(100, p.focus + 15); s.clone = null; }
    }
    for (const e of s.room.enemies) K.stepEnemy(s, e, dt, oldY);
    for (const b of s.projectiles) {
      b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.friendly) { for (const e of s.room.enemies) if (e.hp > 0 && K.overlap(b, e) && !(b.hit || []).includes(e.id)) { (b.hit ||= []).push(e.id); K.hitEnemy(s, e, b.damage || 18, b.x - b.vx, true); } }
      else if (K.overlap(b, p)) {
        if (p.dash > 0 && K.has(s, 'mirror')) { b.friendly = true; b.vx *= -1.25; b.vy *= -1; b.damage = 24; b.life = 2; K.event(s, 'reflect'); }
        else if (p.invuln <= 0) { K.damage(s, 12, '莲焰飞弹', Math.sign(b.vx)); b.life = 0; }
      }
    }
    s.projectiles = s.projectiles.filter(b => b.life > 0 && b.x > -100 && b.x < s.room.width + 100);
    for(const q of s.room.seals)if(q.hp>0&&Math.abs(q.x-p.x)<420){q.pulse=(q.pulse??2.2)-dt;q.warning=q.pulse<.65;if(q.pulse<=0){q.pulse=3.4;q.warning=false;for(const face of[-1,1])s.projectiles.push({x:q.x+14,y:q.y+25,vx:face*175,vy:0,w:12,h:12,life:2.5,friendly:false});K.event(s,'seal-burst',{id:q.id});}}
    for(let i=0;i<s.room.signs.length;i++)if(Math.abs(s.room.signs[i].x-p.x)<65&&!s.hints.includes(s.stage+':'+i)){s.hints.push(s.stage+':'+i);K.event(s,'hint',{text:s.room.signs[i].text});}
    if(a.interactPressed&&s.mode==='playing'&&s.stage<3&&s.room.seals[0].hp===0&&!s.room.midClaimed&&Math.abs(p.x-s.room.seals[0].x)<85){s.rewardKind='mid';s.reward=K.options(s);s.mode='reward';K.event(s,'reward',{kind:'mid'});}
    else if (a.interactPressed && s.mode === 'playing' && s.stage < 3 && Math.abs(p.x - s.room.exit) < 85) {
      if (s.room.seals.some(q => q.hp > 0)) K.event(s, 'gate-locked');
      else{s.mode='reward';s.rewardKind='exit';s.reward=K.options(s);K.event(s,'reward',{kind:'exit'});}
    }
  };
  K.stepEnemy = function (s, e, dt, oldY) {
    if (e.hp <= 0 || s.mode !== 'playing') return;
    const p=s.player;e.flash=Math.max(0,e.flash-dt);e.stun=Math.max(0,e.stun-dt);e.interruptLock=Math.max(0,(e.interruptLock||0)-dt);
    if(e.kind==='caster')e.y=e.baseY+Math.sin(s.time*2+e.id)*4;
    const target = s.clone && Math.abs(s.clone.x - e.x) < 380 ? s.clone : p;
    const dx = target.x - e.x; const near = Math.abs(dx);
    // Distant idle enemies may wait for minutes. Keep their timer saveable.
    e.timer = Math.max(-1, e.timer - dt);
    if(e.stun>0&&e.phase==='idle')return;
    if (e.kind === 'boss') {
      if(e.phase==='idle'&&e.timer<=0){e.attacks++;e.phase=e.attacks%2?'sweep-windup':'orb-windup';e.timer=e.hp<135?.65:.9;e.face=Math.sign(target.x-e.x)||-1;K.event(s,'boss-warning',{attack:e.phase,x:e.x,y:e.y,face:e.face});}
      else if (['sweep-windup','orb-windup'].includes(e.phase) && e.timer <= 0) {
        if(e.phase==='sweep-windup'){e.phase='sweep';e.timer=.34;e.struck=false;K.event(s,'enemy-attack',{id:e.id,kind:e.kind,box:K.enemyAttackBox(e)});}
        else { for (let i = 0; i < (e.hp < 135 ? 5 : 3); i++) { const n = e.hp < 135 ? 5 : 3; const vy = (i - (n - 1) / 2) * 72; s.projectiles.push({ x: e.x + 12, y: e.y + 22, vx: e.face * 240, vy, w: 15, h: 15, life: 4, friendly: false }); } e.phase = 'recover'; e.timer = 1.3; }
      } else if (e.phase === 'sweep') {
        const hit=K.enemyAttackBox(e);
        if (K.overlap(p, hit)) K.damage(s, 18, '无天·黑莲横扫', e.face);
        if (e.timer <= 0) { e.phase = 'recover'; e.timer = 1.2; }
      }else if(e.phase==='recover'&&e.timer<=0){e.shiftTo=e.x>500?260:710;e.phase='shift-windup';e.timer=.55;K.event(s,'boss-shift-warning',{from:e.x,to:e.shiftTo});}
      else if(e.phase==='shift-windup'&&e.timer<=0){e.phase='shift';e.timer=.8;e.face=Math.sign(e.shiftTo-e.x);K.event(s,'boss-shift',{from:e.x,to:e.shiftTo});}
      else if(e.phase==='shift'){e.x+=Math.sign(e.shiftTo-e.x)*650*dt;if(Math.abs(e.x-e.shiftTo)<8||e.timer<=0){e.x=e.shiftTo;e.phase='idle';e.timer=.4;}}
    } else if (e.kind === 'caster') {
      if(e.phase==='idle'&&near<600&&e.timer<=0){e.phase='windup';e.timer=.75;e.face=Math.sign(dx)||1;e.aimX=target.x+12;e.aimY=target.y+18;K.event(s,'warning',{kind:e.kind,id:e.id,aimX:e.aimX,aimY:e.aimY});}
      else if (e.phase === 'windup' && e.timer <= 0) {
        const tx=(e.aimX??target.x+12)-e.x,ty=(e.aimY??target.y+18)-(e.y+16),len=Math.hypot(tx,ty)||1;
        s.projectiles.push({ x: e.x, y: e.y + 16, vx: tx / len * 220, vy: ty / len * 220, w: 12, h: 12, life: 3, friendly: false }); e.phase = 'idle'; e.timer = 1.8;
      }
    } else {
      if (e.phase === 'idle') {
        // Shields turn only at the start of an attack: jumping behind has a real window.
        if(near<84&&Math.abs(target.y-e.y)<65&&e.timer<=0){e.face=Math.sign(dx)||e.face;e.phase='windup';e.timer=e.kind==='shield'?.7:.52;K.event(s,'warning',{kind:e.kind,id:e.id,x:e.x,y:e.y,face:e.face});}
        else if(near>50&&near<330){if(e.kind!=='shield'||e.timer<=0){e.face=Math.sign(dx);if(e.kind==='shield')e.timer=.6;}const bounds=K.patrolBounds(s,e);e.x=K.clamp(e.x+e.face*(e.kind==='shield'?28:53)*dt,bounds.min,bounds.max);}
      }else if(e.phase==='windup'&&e.timer<=0){e.phase='attack';e.timer=.18;K.event(s,'enemy-attack',{kind:e.kind,id:e.id,box:K.enemyAttackBox(e)});}
      else if (e.phase === 'attack') {
        const box=K.enemyAttackBox(e);
        if (K.overlap(box, p)) K.damage(s, e.kind === 'shield' ? 16 : 12, e.kind === 'shield' ? '重盾兵·盾撞' : '执刃魔兵·斩击', e.face);
        if (e.timer <= 0) { e.phase = 'recover'; e.timer = .9; }
      } else if (e.phase === 'recover' && e.timer <= 0) { e.phase = 'idle'; e.timer = .2; }
    }
    // Stomps use the actual previous bottom edge, not a vague overlap.
    if(p.vy>70&&oldY+p.h<=e.y+12&&K.overlap(p,e)){K.hitEnemy(s,e,p.slam?30:19,p.x,true,'heavy');p.vy=-380;p.y=e.y-p.h;p.airJumps=0;p.slam=false;K.event(s,'stomp',{kind:e.kind});}
    else if(e.kind!=='caster'&&p.dash<=0&&K.overlap(p,e)){if(e.kind==='boss'&&e.phase==='shift')K.damage(s,15,'无天·移形冲击',e.face);else{p.x=p.x+12<e.x+e.w/2?e.x-p.w-1:e.x+e.w+1;p.vx=0;}}
  };
  K.enemyAttackBox=function(e){return e.kind==='boss'?{x:e.face>0?e.x+12:e.x-200,y:410,w:240,h:30}:{x:e.face>0?e.x+14:e.x-46,y:e.y+6,w:60,h:32};};
  K.patrolBounds=function(s,e){const p=s.room.platforms.find(p=>Math.abs(p.y-e.baseY-e.h)<3&&e.origin>=p.x&&e.origin<p.x+p.w);return p?{min:Math.max(e.origin-100,p.x),max:Math.min(e.origin+100,p.x+p.w-e.w)}:{min:e.origin-100,max:e.origin+100};};
  K.choose=function(s,id,replace){if(s.mode!=='reward'||!s.reward.includes(id))return false;
    if(id==='rest'){s.player.hp=Math.min(100,s.player.hp+30);s.player.focus=Math.min(100,s.player.focus+35);s.stats.rests++;}
    else if(s.relics.length>=3){if(!s.relics.includes(replace)){s.pendingRelic=id;return 'replace';}s.relics[s.relics.indexOf(replace)]=id;K.event(s,'relic',{id,replace});}
    else{s.relics.push(id);K.event(s,'relic',{id});}
    if(s.rewardKind==='mid'){s.room.midClaimed=true;s.mode='playing';s.reward=[];s.pendingRelic=null;s.player.invuln=Math.max(s.player.invuln,.5);}
    else K.enterRoom(s,s.stage+1,false);
    return true;
  };
})(globalThis.Kong ||= {});
