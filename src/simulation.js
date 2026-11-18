(function (K) {
  'use strict';
  K.newRun = function (seed, first, hero='wukong',difficulty='normal') {
    const s = { version:12,rules:12,hero,ring:null,silk:null,arm:null,flight:null,growth:{},talisman:null,casts:[],world:{rescue:false,bridge:false,bell:false},journal:[],dangers:[],seed:String(seed || 'BLACK-LOTUS'), stage:0, mode:'playing',time:0,elapsed:0,roomTime:0,relics:first?[first]:[],room:null,player:null,clone:null,projectiles:[],effects:[],events:[],log:[],reward:[],rewardKind:'exit',pendingRelic:null,kills:0,broken:0,damageTaken:0,lastDamage:'',hitstop:0,shake:0,checkpoint:90,combo:0,comboTime:0,serial:0,hints:[],stats:{swings:0,hits:0,blocks:0,jumps:0,dashes:0,clones:0,focusSpent:0,rests:0,ultimates:0,talismans:0,guardians:0,drops:0,camps:0,trials:0,farHits:0,extends:0,tipHits:0,vaults:0,flights:0} };
    s.difficulty=difficulty==='challenge'?'challenge':'normal';s.challengeRules=s.difficulty==='challenge'?1:0;
    K.enterRoom(s, 0, true); return s;
  };
  K.enterRoom = function (s, stage, initial) {
    const old = s.player;
    s.stage = stage; s.room = K.makeRoom(s.seed, stage,s.difficulty); s.roomTime = 0; s.checkpoint = 90;
    s.player = { x:90,y:380,w:24,h:44,vx:0,vy:0,face:1,hp:initial?K.maxHP(s):Math.min(K.maxHP(s),old.hp+18),focus:initial?65:Math.min(100,old.focus+20),rage:initial?25:old.rage,ringCD:0,ringAim:null,ultimate:0,ultimateStage:0,talismanCD:0,ward:0,dashTargets:[],grounded:false,coyote:0,buffer:0,airJumps:0,invuln:.8,dash:0,dashCD:0,attack:0,attackId:0,attackTargets:[],comboIndex:0,slam:false,landing:0,drop:0,hurt:0,attackBuffer:0,armCD:0,vaultTime:0,vaultUsed:false,groundTime:0,wheelFuel:K.has(s,'cloud')?1.5:1.25,wheelReady:true };
    s.player.hero=s.hero;
    s.ring=null;s.silk=null;s.arm=null;s.flight=null;s.clone=null;s.projectiles=[];s.effects=[];s.dangers=[];s.casts=[];s.hitstop=0;s.mode='playing';s.pendingRelic=null;s.reward=[];K.applyWorld(s);
    K.event(s, 'room', { stage });
  };
  K.event = function(s,type,data={}){const e={type,t:+s.time.toFixed(3),wall:+(s.elapsed||0).toFixed(3),...data};s.events.push(e);s.log.push(e);if(s.log.length>400)s.log.shift();const stat={swing:'swings',hit:'hits',blocked:'blocks',jump:'jumps',dash:'dashes',clone:'clones'}[type];if(stat&&s.stats)s.stats[stat]++;};
  const LIFETIMES={'celestial-slam':.48,'six-strike':.2,hit:.16,'heavy-hit':.26,block:.18,kill:.32,hurt:.3,ring:.28,reflect:.25,dust:.2,trail:.13,'clone-swing':.2,rubble:.38,'world-rise':.8,'ultimate-aura':.86,'ultimate-wave':.36,ward:1.6,'thunder-mark':.24,thunder:.3};
  K.effect=function(s,kind,x,y,extra={}){const duration=LIFETIMES[kind]||.42;s.effects.push({kind,x,y,life:duration,duration,...extra});if(s.effects.length>120)s.effects.splice(0,s.effects.length-120);};
  K.attackTiming=p=>p.comboIndex===3?{start:.10,end:.20}:p.comboIndex===2?{start:.055,end:.15}:{start:.033,end:.105};
  // Cancel only the actor's unfinished weapon action. Released projectiles,
  // rings, clones, eyes and allies keep their independent lifetime.
  K.cancelWeaponAction=function(s){const p=s.player;p.attack=0;p.attackBuffer=0;p.secondaryPose=0;p.eyePose=0;if(s.bow)s.bow=null;};
  const hurtBoxes=new WeakMap();K.withHurtBox=function(s,box,fn){const old=hurtBoxes.get(s);hurtBoxes.set(s,box);try{return fn();}finally{if(old)hurtBoxes.set(s,old);else hurtBoxes.delete(s);}};
  K.damage = function (s, n, source, knock = 0) {
    const p = s.player; if (s.mode !== 'playing' || p.invuln > 0) return false;
    p.hp=Math.max(0,p.hp-n);p.invuln=1;p.hurt=.24;p.vx=knock*200;p.vy=-200;K.cancelWeaponAction(s);p.ultimate=0;p.slam=false;
    K.cancelSignature(s);s.damageTaken += n; s.lastDamage = source; s.shake = .18;
    const box=hurtBoxes.get(s),x=box?K.clamp(p.x+p.w/2,Math.max(p.x,box.x),Math.min(p.x+p.w,box.x+box.w)):p.x+p.w/2,y=box?(Math.max(p.y,box.y)+Math.min(p.y+p.h,box.y+box.h))/2:p.y+p.h/2,enemyMaterial=K.enemyImpactFamily?.(source)||null;K.effect(s,'hurt',x,y,{text:'-'+n,enemyMaterial,face:Math.sign(knock)||1});K.event(s,'hurt',{source,amount:n,x,y,enemyMaterial});
    if (p.hp <= 0) { s.mode = 'dead'; K.event(s, 'death', { source }); }
    return true;
  };
  const contactBoxes=new WeakMap();K.withContact=function(s,box,fn){const old=contactBoxes.get(s);contactBoxes.set(s,box);try{return fn();}finally{if(old)contactBoxes.set(s,old);else contactBoxes.delete(s);}};
  K.hitEnemy = function (s, e, amount, origin, pierce = false, impact='light') {
    if (s.mode!=='playing' || e.hp <= 0 || e.dormant) return false;
    const front = (origin - (e.x + e.w / 2)) * e.face > 0,b=contactBoxes.get(s),ix=b?K.clamp(origin,Math.max(e.x,b.x),Math.min(e.x+e.w,b.x+b.w)):K.clamp(origin,e.x,e.x+e.w),iy=b?(Math.max(e.y,b.y)+Math.min(e.y+e.h,b.y+b.h))/2:e.y+e.h*.45;
    if(e.kind==='boss'&&e.phase!=='recover'&&front&&impact!=='ultimate'){amount=Math.ceil(amount*.4);K.effect(s,'block',e.x+24,e.y+20,{face:Math.sign(e.x-origin)||1});K.event(s,'boss-guard',{chip:amount});}
    if (e.kind === 'shield' && front && !pierce && e.stun <= 0 && e.phase !== 'recover') { K.effect(s,'block',e.x+(e.face>0?e.w:0),e.y+16,{text:'格挡',face:Math.sign(e.x-origin)||1});K.event(s,'blocked',{target:e.id});s.player.focus=Math.min(100,s.player.focus+3);return false; }
    e.hp=Math.max(0,e.hp-amount);e.flash=.08;e.stun=K.isMajor(e)?0:.065;e.recoil=.12;e.recoilFace=Math.sign(e.x-origin)||1;
    if(!K.isMajor(e)&&['heavy','thunder','ultimate'].includes(impact)&&e.phase.endsWith('windup')&&(e.interruptLock||0)<=0){e.phase='recover';e.timer=.85;e.marks=[];e.interruptLock=1;K.event(s,'interrupt',{target:e.id});K.effect(s,'block',e.x+12,e.y+4,{text:'破势'});}
    if(!K.isMajor(e)&&!((e.trait||e.phase==='pursuit-windup'||e.phase==='cross-windup')&&e.phase.endsWith('windup')&&['light','ring'].includes(impact))){const bounds=K.patrolBounds(s,e);e.x=K.clamp(e.x+Math.sign(e.x-origin)*12,bounds.min,bounds.max);}
    const heavy=['heavy','ultimate','thunder'].includes(impact);K.effect(s,heavy?'heavy-hit':'hit',ix,iy,{text:String(amount),face:Math.sign(e.x-origin)||1,impact,weapon:s.hero,combo:s.player.comboIndex,color:heavy?'#ffe9a8':'#fff1ce'});
    s.hitstop=Math.max(s.hitstop,heavy?.045:impact==='lotus-burn'?0:.02);s.shake=Math.max(s.shake,heavy?.14:.045);K.event(s,'hit',{target:e.id,kind:e.kind,amount,impact,hero:s.hero,x:ix,y:iy});if(!['ultimate','lotus-burn','six-arms'].includes(impact))K.gainRage(s,(impact==='heavy'?14:8)*(K.isMajor(e)?.5:1));
    if (e.hp === 0) { s.kills++;s.player.focus=Math.min(100,s.player.focus+10);K.effect(s,'kill',e.x+e.w/2,e.y+20,{face:Math.sign(e.x-origin)||1});K.event(s,'kill',{kind:e.kind});
      if(K.dropEnemy)K.dropEnemy(s,e);
      if(e.kind==='warden'){e.marks=[];s.stats.guardians++;K.gainRage(s,18);s.player.hp=Math.min(K.maxHP(s),s.player.hp+12);K.event(s,'guardian-defeat',{name:K.GUARDIANS[s.stage].name});}
      if (e.kind === 'boss') { s.mode = 'won'; K.event(s, 'victory'); }
    }
    return true;
  };
  K.strike = function (s, box, amount, origin, pierce, targets, impact='light') {
    if(s.mode!=='playing')return;
    for (const e of s.room.enemies) if (e.hp > 0 && K.overlap(box, e) && !targets.includes('e' + e.id)) {
      targets.push('e'+e.id);if(K.withContact(s,box,()=>K.hitEnemy(s,e,amount,origin,pierce,impact)))s.player.focus=Math.min(100,s.player.focus+12);
    }
    for (const seal of s.room.seals) if (seal.hp > 0 && K.overlap(box, seal) && !targets.includes('s' + seal.id)) {
      targets.push('s' + seal.id);K.hitSeal(s,seal,amount,origin,impact);
    }
  };
  K.hitSeal=function(s,seal,amount,origin,impact='light'){
    if(s.mode!=='playing'||seal.hp<=0)return false;
    seal.hp=Math.max(0,seal.hp-amount);s.player.focus=Math.min(100,s.player.focus+9);if(impact!=='ultimate')K.gainRage(s,5);
    K.effect(s,impact==='heavy'?'heavy-hit':'hit',seal.x+14,seal.y+18,{text:String(amount),impact,face:Math.sign(seal.x-origin)||1});K.event(s,'seal-hit',{id:seal.id});
    if(seal.hp===0){s.broken++;K.effect(s,'ring',seal.x+14,seal.y+20);K.event(s,'seal',{id:seal.id});if(K.has(s,'mercy'))s.player.hp=Math.min(K.maxHP(s),s.player.hp+12);}
    return true;
  };
  K.attackBox = function (s) {
    const p = s.player; const range = p.comboIndex === 3 ? (K.has(s, 'staff') ? 112 : 79) : !p.grounded && K.has(s, 'cloud') ? 86 : 65;
    return { x: p.face > 0 ? p.x + 10 : p.x + 14 - range, y: p.y + 2, w: range, h: 42 };
  };
  K.step = function (s, a = {}, dt = K.DT) {
    s.events = []; if (s.mode !== 'playing') return;
    s.elapsed=(s.elapsed||0)+dt;
    for(const fx of s.effects)fx.life-=dt;s.effects=s.effects.filter(fx=>fx.life>0);
    if (s.hitstop > 0) { s.hitstop = Math.max(0, s.hitstop - dt); return; }
    s.time += dt; s.roomTime += dt; s.shake = Math.max(0, s.shake - dt);
    const p = s.player; const oldY = p.y,oldX=p.x;
    K.updatePlatforms(s,dt);
    for(const key of ['invuln','dashCD','landing','buffer','coyote','drop','hurt','attackBuffer','talismanCD','ward','ringCD'])p[key]=Math.max(0,(p[key]||0)-dt);
    if(a.ultimatePressed)K.startUltimate(s);if(a.talismanPressed)K.useTalisman(s);
    if(p.ultimate>0){K.stepUltimate(s,dt);a={};}K.stepCasts(s,dt);if(s.mode!=='playing')return;K.stepSignature(s,a,dt);
    if(a.attackPressed)p.attackBuffer=Math.max(p.attackBuffer,.22);
    s.comboTime = Math.max(0, s.comboTime - dt); if (s.comboTime === 0) s.combo = 0;
    if (a.jumpPressed) p.buffer = .12;
    if (p.grounded) { p.coyote = .10; p.airJumps = 0; const safeGround=s.room.platforms.some(q=>q.solid&&Math.abs(p.y+p.h-q.y)<3&&p.x>q.x+60&&p.x<q.x+q.w-130);if(safeGround&&!s.room.hazards.some(h => Math.abs(h.x - p.x) < 120)) s.checkpoint = p.x; }
    if(a.down&&a.jumpPressed&&p.grounded&&s.room.platforms.some(q=>!q.solid&&Math.abs(p.y+p.h-q.y)<3&&p.x+p.w>q.x&&p.x<q.x+q.w)){p.drop=.28;p.y+=4;p.vy=90;p.buffer=0;p.coyote=0;p.grounded=false;K.event(s,'drop');}
    if (a.dashPressed && p.dashCD === 0 && !p.slam) { if(a.left!==a.right)p.face=a.right?1:-1;p.hurt=0;K.cancelWeaponAction(s);p.dash = .18; p.dashCD = .85; p.invuln = Math.max(p.invuln, .21); p.vy = 0;p.dashTargets=[]; K.event(s, 'dash'); }
    if(a.clonePressed&&p.hurt<=0&&K.isRanged(s))K.castSilk(s);
    if (a.clonePressed && p.hurt<=0 && !K.isRanged(s) && !s.clone) {
      const cost = K.has(s, 'echo') ? 50 : 40;
      if(p.focus>=cost){p.focus-=cost;s.stats.focusSpent+=cost;s.clone={x:p.x,y:p.y,w:24,h:44,face:p.face,life:K.has(s,'echo')?3:1.8,timer:.12};K.event(s,'clone',{cost});}
      else { K.event(s, 'empty-focus'); K.effect(s, 'notice', p.x, p.y - 14, { text: '定力不足' }); }
    }
    const moving = (a.right ? 1 : 0) - (a.left ? 1 : 0);
    if (moving && !p.dash && !p.slam&&(p.attack<=0||p.attackDuration-p.attack>=K.attackTiming(p).end)&&p.secondaryPose<=0&&p.eyePose<=0&&(!s.arm||s.arm.phase==='charge')) p.face = moving;
    if (a.aimFace && a.attack && p.attack <= 0 && p.dash<=0&&!s.arm) p.face = a.aimFace;
    if (p.buffer > 0 && !s.flight&&!s.arm&& !p.slam && !p.dash && (p.coyote > 0 || (K.has(s, 'cloud') && p.airJumps < 1))) {
      const air = p.coyote === 0; p.vy = air ? -490 : -590; if (air) p.airJumps++; p.buffer = 0; p.coyote = 0; p.grounded = false; K.event(s, 'jump', { air }); K.effect(s, 'dust', p.x + 12, p.y + 44);
    }
    if (!a.jump && !s.flight&&p.vaultTime<=0&&p.vy < -210) p.vy += 1800 * dt;
    if((a.attack||p.attackBuffer>0)&&p.hurt<=0&&p.eyePose<=0&&p.secondaryPose<=0&&p.attack<=0&&p.landing===0&&p.dash<=0&&!p.slam){
      p.attackBuffer=0;
      if (a.down && !p.grounded) { p.slam = true; p.vy = 650; p.vx = 0; K.event(s, 'slam'); }
      else { s.combo=s.combo%3+1;s.comboTime=.85;p.comboIndex=s.combo;p.attack=K.attackDuration?K.attackDuration(s):p.comboIndex===3?(K.has(s,'staff')?.40:.36):p.comboIndex===2?.25:.23;p.attackDuration=p.attack;if(p.grounded)p.vx=0;p.attackTargets=[];p.attackId++;K.event(s,'swing',{combo:p.comboIndex,hero:s.hero}); }
    }
    if (p.attack > 0) {
      const elapsed = p.attackDuration - p.attack;
      const timing=K.attackTiming(p);if(elapsed>=timing.start&&elapsed<timing.end){if(!p.attackTargets.includes('release')){p.attackTargets.push('release');K.event(s,'strike-release',{combo:p.comboIndex,hero:s.hero});}K.strike(s,K.attackBox(s),K.attackDamage?K.attackDamage(s):p.comboIndex===3?27:14,p.x+12,p.comboIndex===3&&K.has(s,'staff'),p.attackTargets,p.comboIndex===3?'heavy':'light');if(p.comboIndex===3&&K.rank(s,'staff-wave')&&!p.attackTargets.includes('wave')){p.attackTargets.push('wave');s.projectiles.push({x:p.x+12,y:p.y+18,vx:p.face*430,vy:0,w:30,h:17,life:1.05,friendly:true,damage:12});K.event(s,'staff-wave');}}
      p.attack = Math.max(0, p.attack - dt);
    }
    if (p.dash > 0) { p.dash = Math.max(0, p.dash - dt); p.vx = p.face * 650; p.vy = 0; if (Math.floor(s.time * 45) % 2 === 0) K.effect(s, 'trail', p.x, p.y, { face: p.face }); }
    else if(s.flight){K.driveFlight(s,a,dt);}
    else if (!p.slam) { const target = moving * (p.grounded&&(p.secondaryPose>0||p.eyePose>0)?0:1) * (s.celestial?.cast?.id==='orbit-staff'?.5:1) * (s.arm?.phase==='charge'?.45:1) * (p.attack>0&&p.grounded&&p.attackDuration-p.attack<K.attackTiming(p).end?0:245); p.vx += (target - p.vx) * Math.min(1, dt * (p.grounded ? 18 : 10)); p.vy = Math.min(p.vy + 1570 * dt, 800); }
    p.x = K.clamp(p.x + p.vx * dt, 8, s.room.width - p.w - 8);
    for(const q of s.room.platforms)if(q.solid&&K.platformEnabled(q)&&p.y+p.h>q.y+1&&p.y<q.y+q.h-1){if(oldX+p.w<=q.x+.2&&p.x+p.w>q.x){p.x=q.x-p.w;p.vx=0;}else if(oldX>=q.x+q.w-.2&&p.x<q.x+q.w){p.x=q.x+q.w;p.vx=0;}}
    p.y += p.vy * dt;
    for(const q of s.room.platforms)if(q.solid&&p.vy<0&&oldY>=q.y+q.h-.2&&p.y<q.y+q.h&&p.x+p.w>q.x+1&&p.x<q.x+q.w-1){p.y=q.y+q.h;p.vy=0;} p.grounded = false;K.updateArena(s);
    if(p.dash>0&&K.rank(s,'dash-strike'))K.strike(s,{x:p.x-9,y:p.y-2,w:42,h:50},18,p.x+12,true,p.dashTargets,'heavy');
    for (const platform of s.room.platforms) if (K.platformEnabled(platform)&&(platform.solid||p.drop===0) && p.vy >= 0 && oldY + p.h <= platform.y + 5 && p.y + p.h >= platform.y && p.x + p.w > platform.x + 2 && p.x < platform.x + platform.w - 2) {
      p.y = platform.y - p.h; p.vy = 0; p.grounded = true;
      if(p.slam){p.slam=false;p.landing=.15;const fire=K.has(s,'flame');K.strike(s,{x:p.x-(fire?115:50),y:p.y-8,w:fire?260:124,h:80},fire?36:22,p.x+12,true,[],'heavy');K.effect(s,'ring',p.x+12,p.y+p.h,{fire});K.event(s,'slam-land',{fire});}
    }
    if (p.y > 590) { p.invuln = 0; K.damage(s, 18, '坠入云渊'); p.x = K.clamp(s.checkpoint - 35, 30, s.room.width - 100); const safe=s.room.platforms.filter(q=>q.solid&&K.platformEnabled(q)&&p.x+p.w>q.x+2&&p.x<q.x+q.w-2).sort((a,b)=>a.y-b.y)[0];p.y=(safe?.y||440)-p.h;p.vy=0;p.vx=0;p.slam=false; }
    for (const h of s.room.hazards) if(K.hazardPhase(s,h)==='active'&&K.overlap(p,h))K.damage(s,14,h.period?'灵山·地焰':'黑莲地刺',-p.face);
    for(const item of s.room.pickups)if(!item.used&&item.enabled!==false&&K.overlap(p,item))K.collectPickup(s,item);
    K.stepRanged(s,dt);
    if (s.clone) {
      const c = s.clone; c.life -= dt; c.timer -= dt;
      if (c.timer <= 0) { c.timer = .52; const candidates = s.room.enemies.filter(e => e.hp > 0); const target = candidates.sort((a, b) => Math.abs(a.x - c.x) - Math.abs(b.x - c.x))[0]; c.face = target ? Math.sign(target.x - c.x) || 1 : c.face;
        if (K.has(s, 'echo')) s.projectiles.push({ x: c.x + 12, y: c.y + 20, vx: c.face * 440, vy: 0, w: 22, h: 14, life: 1.7, friendly: true, damage: 18 });
        else K.strike(s, { x: c.face > 0 ? c.x : c.x - 65, y: c.y, w: 90, h: 48 }, 12, c.x, false, []);
        K.effect(s, 'clone-swing', c.x + 12 + c.face * 30, c.y + 18); K.event(s, 'clone-strike');
      }
      if (c.life <= 0) { if (K.has(s, 'mercy')) p.focus = Math.min(100, p.focus + 15);if(K.rank(s,'clone-burst')){K.strike(s,{x:c.x-80,y:c.y-20,w:184,h:90},24,c.x+12,true,[],'heavy');K.effect(s,'ring',c.x+12,c.y+42,{fire:false});K.event(s,'clone-burst');}s.clone = null; }
    }
    for (const e of s.room.enemies) K.stepEnemy(s, e, dt, oldY);
    for (const b of s.projectiles) {
      b.life -= dt;if(b.life<=0)continue;b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.friendly) {
        for (const e of s.room.enemies) if (e.hp > 0 && !e.dormant&&K.overlap(b, e) && !(b.hit || []).includes(e.id)) { (b.hit ||= []).push(e.id); K.withContact(s,b,()=>K.hitEnemy(s, e, b.damage || 18, b.x - b.vx, b.pierce!==false,b.impact||'wave'));if(b.pierce===false){b.life=0;break;} }if(b.life<=0)continue;
        for (const seal of s.room.seals) if (seal.hp > 0 && K.overlap(b,seal) && !(b.sealHits || []).includes(seal.id)) {
          if(K.hitSeal(s,seal,b.damage||18,b.x-b.vx))(b.sealHits ||= []).push(seal.id);
        }
        K.friendlyAnchorContacts?.(s,b);
      }
      else if (K.overlap(b, p)) {
        if (p.dash > 0 && K.has(s, 'mirror')) { b.friendly=true;b.vx*=-1.25;b.vy*=-1;b.damage=24;b.life=2;K.effect(s,'reflect',b.x,b.y,{face:p.face});K.event(s,'reflect');K.gainRage(s,10); }
        else if (p.invuln <= 0) { K.withHurtBox(s,b,()=>K.damage(s,b.damage||12,b.source||'莲焰飞弹',Math.sign(b.vx))); b.life = 0; }
      }
    }
    s.projectiles = s.projectiles.filter(b => b.life > 0 && b.x > -100 && b.x < s.room.width + 100);
    for(const d of s.dangers){d.life-=dt;if(d.life>0&&K.overlap(p,d))K.withHurtBox(s,d,()=>K.damage(s,d.damage,d.source,Math.sign(p.x-d.x-d.w/2)));}s.dangers=s.dangers.filter(d=>d.life>0);
    K.updateWorld(s);K.updateJourney(s);
    for(const q of s.room.seals)if(q.hp>0&&Math.abs(q.x-p.x)<420){q.pulse=(q.pulse??2.2)-dt;q.warning=q.pulse<.65;if(q.pulse<=0){q.pulse=3.4;q.warning=false;for(const face of[-1,1])s.projectiles.push({x:q.x+14,y:q.y+25,vx:face*175,vy:0,w:12,h:12,life:2.5,friendly:false});K.event(s,'seal-burst',{id:q.id});}}
    for(let i=0;i<s.room.signs.length;i++)if(Math.abs(s.room.signs[i].x-p.x)<65&&!s.hints.includes(s.stage+':'+i)){s.hints.push(s.stage+':'+i);K.event(s,'hint',{text:s.room.signs[i].text});}
    if(a.interactPressed&&s.mode==='playing'&&K.journeyInteract(s)){}
    else if(a.interactPressed&&s.mode==='playing'&&K.worldInteract(s)){}
    else if(a.interactPressed&&s.mode==='playing'&&s.stage<3&&s.room.seals[0].hp===0&&!s.room.midClaimed&&Math.abs(p.x-s.room.seals[0].x)<85){if(K.lampInReach(s)){K.cancelSignature(s);s.rewardKind='mid';s.reward=K.options(s);s.mode='reward';K.event(s,'reward',{kind:'mid'});}else K.event(s,'ability-note',{text:'靠近借灯的落点，再按 F 整顿。'});}
    else if (a.interactPressed && s.mode === 'playing' && s.stage < 3 && Math.abs(p.x - s.room.exit) < 85) {
      if(!K.gateInReach(s))K.event(s,'ability-note',{text:'靠近山门的落点，再按 F 过门。'});
      else if (s.room.seals.some(q => q.hp > 0)||K.guardian(s)?.hp>0) K.event(s, 'gate-locked');
      else{K.cancelSignature(s);s.mode='reward';s.rewardKind='exit';s.reward=K.options(s);K.event(s,'reward',{kind:'exit'});}
    }
  };
  K.stepEnemy=function(s,e,dt,oldY){
    if(e.hp<=0||e.dormant||s.mode!=='playing')return;
    e.lastX=e.x;const p=s.player,o=s.room.arena.offset;e.flash=Math.max(0,e.flash-dt);e.stun=Math.max(0,e.stun-dt);e.recoil=Math.max(0,(e.recoil||0)-dt);e.interruptLock=Math.max(0,(e.interruptLock||0)-dt);
    if(e.kind==='caster')e.y=e.baseY;
    const target=s.clone&&Math.abs(s.clone.x-e.x)<380?s.clone:p,dx=target.x-e.x,near=Math.abs(dx);
    e.timer=Math.max(-1,e.timer-dt);if(e.stun>0&&e.phase==='idle')return;
    if(K.stepCounter(s,e,dt,target)){}
    else if(e.kind==='warden'){K.stepWarden(s,e,dt,target);}
    else if(e.kind==='boss'){
      if(e.phase==='idle'&&e.timer<=0){
        e.attacks++;e.phase=e.attacks%3===0?'rain-windup':e.attacks%2?'sweep-windup':'orb-windup';e.timer=e.phase==='rain-windup'?1.05:e.hp<135?.65:.9;e.face=Math.sign(target.x-e.x)||-1;
        if(e.phase==='rain-windup'){const center=K.clamp(target.x+12,110+o,850+o),offsets=s.world.bell?[-95,95]:[-150,0,150];e.marks=offsets.map(offset=>({x:K.clamp(center+offset-42,24+o,852+o),y:418,w:84,h:22}));}
        K.event(s,'boss-warning',{attack:e.phase,x:e.x,y:e.y,face:e.face});
      }else if(e.phase==='rain-windup'&&e.timer<=0){for(const box of e.marks||[])s.dangers.push({...box,life:.45,damage:16,source:'无天·黑莲落火'});e.marks=[];e.phase='recover';e.timer=1.5;K.event(s,'enemy-attack',{kind:'boss',move:'rain'});}
      else if(['sweep-windup','orb-windup'].includes(e.phase)&&e.timer<=0){
        if(e.phase==='sweep-windup'){e.phase='sweep';e.timer=.34;K.event(s,'enemy-attack',{id:e.id,kind:e.kind,box:K.enemyAttackBox(e)});}
        else{const n=e.hp<135?5:3;for(let i=0;i<n;i++)s.projectiles.push({x:e.x+12,y:e.y+22,vx:e.face*240,vy:(i-(n-1)/2)*72,w:15,h:15,life:4,friendly:false});e.phase='recover';e.timer=1.3;}
      }else if(e.phase==='sweep'){if(K.overlap(p,K.enemyAttackBox(e)))K.damage(s,18,'无天·黑莲横扫',e.face);if(e.timer<=0){e.phase='recover';e.timer=1.2;}}
      else if(e.phase==='recover'&&e.timer<=0){e.shiftTo=e.x>500+o?260+o:710+o;e.phase='shift-windup';e.timer=.55;K.event(s,'boss-shift-warning',{from:e.x,to:e.shiftTo});}
      else if(e.phase==='shift-windup'&&e.timer<=0){e.phase='shift';e.timer=.8;e.face=Math.sign(e.shiftTo-e.x);K.event(s,'boss-shift',{from:e.x,to:e.shiftTo});}
      else if(e.phase==='shift'){e.x+=Math.sign(e.shiftTo-e.x)*650*dt;if(Math.abs(e.x-e.shiftTo)<8||e.timer<=0){e.x=e.shiftTo;e.phase='idle';e.timer=.4;}}
    }else if(e.kind==='caster'){
      if(e.phase==='idle'&&near<600&&e.timer<=0){
        e.attacks++;const sigil=e.trait!=='volley'&&e.style==='sigil'&&e.attacks%2===0;e.phase=sigil?'sigil-windup':'windup';e.timer=sigil?.95:e.trait==='volley'?1.05:.75;e.face=Math.sign(dx)||1;e.aimX=target.x+12;e.aimY=sigil?K.surfaceAt(s,target.x+12,target.y+35):target.y+18;
        K.event(s,'warning',{kind:e.kind,id:e.id,move:sigil?'sigil':'orb',aimX:e.aimX,aimY:e.aimY});
      }else if(e.phase==='sigil-windup'&&e.timer<=0){s.dangers.push({...K.sigilBox(e),life:.38,damage:12,source:'莲灯使·锁地咒'});e.phase='recover';e.timer=1.25;K.event(s,'enemy-attack',{kind:e.kind,move:'sigil'});}
      else if(e.phase==='windup'&&e.timer<=0){const tx=e.aimX-e.x,ty=e.aimY-e.y-16,len=Math.hypot(tx,ty)||1;for(const angle of(e.trait==='volley'?[-.24,0,.24]:[0])){const vx=tx/len*220,vy=ty/len*220;s.projectiles.push({x:e.x,y:e.y+16,vx:vx*Math.cos(angle)-vy*Math.sin(angle),vy:vx*Math.sin(angle)+vy*Math.cos(angle),w:12,h:12,life:3,friendly:false});}e.phase='recover';e.timer=1.4;}
      else if(e.phase==='recover'&&e.timer<=0){e.phase='idle';e.timer=.3;}
    }else{
      if(e.phase==='idle'){
        const reach=e.style==='rush'?185:e.style==='lunge'?145:84;
        if(near<reach&&Math.abs(target.y-e.y)<65&&e.timer<=0){e.face=Math.sign(dx)||e.face;e.attacks++;e.followup=false;const special=e.trait!=='twin'&&e.attacks%2===1&&e.style!=='basic';e.phase=special?e.style+'-windup':'windup';e.timer=special?(e.style==='rush'?.85:.62):e.kind==='shield'?.7:.52;K.event(s,'warning',{kind:e.kind,id:e.id,move:e.phase,x:e.x,y:e.y,face:e.face});}
        else if(near>50&&near<330){if(e.kind!=='shield'||e.timer<=0){e.face=Math.sign(dx);if(e.kind==='shield')e.timer=.6;}const bounds=K.patrolBounds(s,e);e.x=K.clamp(e.x+e.face*(e.kind==='shield'?28:53)*dt*K.enemySpeed(s,e),bounds.min,bounds.max);}
      }else if(['rush-windup','lunge-windup'].includes(e.phase)&&e.timer<=0){e.phase=e.phase.split('-')[0];e.timer=e.phase==='rush'?.36:.24;K.event(s,'enemy-attack',{kind:e.kind,id:e.id,move:e.phase});}
      else if(['rush','lunge'].includes(e.phase)){
        const bounds=K.patrolBounds(s,e);e.x=K.clamp(e.x+e.face*(e.phase==='rush'?360:285)*Math.min(dt,Math.max(0,e.timer+dt))*K.enemySpeed(s,e),bounds.min,bounds.max);if(K.overlap(p,K.enemyAttackBox(e)))K.damage(s,e.kind==='shield'?16:12,e.kind==='shield'?'重盾兵·蓄势冲撞':'执刃魔兵·突进斩',e.face);
        if(e.timer<=0){e.phase='recover';e.timer=1.15;}
      }else if(['windup','chain-windup'].includes(e.phase)&&e.timer<=0){e.phase='attack';e.timer=.18;K.event(s,'enemy-attack',{kind:e.kind,id:e.id,box:K.enemyAttackBox(e)});}
      else if(e.phase==='attack'){if(K.overlap(K.enemyAttackBox(e),p))K.damage(s,e.kind==='shield'?16:12,e.kind==='shield'?'重盾兵·盾撞':'执刃魔兵·斩击',e.face);if(e.timer<=0){if(e.trait==='twin'&&!e.followup){e.followup=true;e.phase='chain-windup';e.timer=.48;K.event(s,'warning',{kind:e.kind,id:e.id,move:'second-slash'});}else{if(e.trait==='pulse')s.projectiles.push({x:e.x+e.w/2,y:428,vx:e.face*175,vy:0,w:24,h:12,life:2.8,friendly:false,source:'震盾兵·地波'});e.phase='recover';e.timer=e.trait==='twin'?1.25:.9;}}}
      else if(e.phase==='recover'&&e.timer<=0){e.phase='idle';e.timer=.2;}
    }
    const fromAbove=p.vy>70&&oldY+p.h<=e.y+12;
    if(!K.isMajor(e)&&fromAbove&&K.overlap(p,e)){K.hitEnemy(s,e,p.slam?30:19,p.x,true,'heavy');p.vy=-380;p.y=e.y-p.h;p.airJumps=0;p.slam=false;K.event(s,'stomp',{kind:e.kind});}
    else if(e.kind!=='caster'&&p.dash<=0&&K.overlap(p,e)){
      if(K.isMajor(e)){
        if(e.kind==='boss'&&e.phase==='shift')K.damage(s,15,'无天·移形冲击',e.face);
        // A boss is not a jump platform. Intentional slams still connect,
        // but neither normal contact nor a slam creates another free bounce.
        if(fromAbove&&p.slam){K.hitEnemy(s,e,30,p.x,true,'heavy');p.slam=false;}
        if(e.hp<=0)return;
        const arena=s.room.arena||{},min=Number.isFinite(arena.min)?arena.min:8,max=Number.isFinite(arena.max)?arena.max-p.w:s.room.width-p.w-8;
        const left=e.x-p.w-1,right=e.x+e.w+1,preferLeft=p.x+p.w/2<e.x+e.w/2;
        let next=preferLeft?left:right;
        // At an arena wall, send the actor towards the open side instead of
        // repeatedly clamping them back into the boss on the following step.
        if(next<min||next>max)next=preferLeft?right:left;
        p.x=K.clamp(next,min,max);p.vx=0;
      }else{p.x=p.x+12<e.x+e.w/2?e.x-p.w-1:e.x+e.w+1;p.vx=0;}
    }
  };
  K.enemyAttackBox=function(e){if(e.trait==='twin'&&e.followup)return{x:e.face>0?e.x+14:e.x-80,y:e.y+6,w:94,h:32};return e.kind==='warden'?K.wardenAttackBox(e):e.kind==='boss'?{x:e.face>0?e.x+12:e.x-200,y:410,w:240,h:30}:{x:e.face>0?e.x+14:e.x-46,y:e.y+6,w:60,h:32};};
  K.patrolBounds=function(s,e){const p=s.room.platforms.find(p=>Math.abs(p.y-e.baseY-e.h)<3&&e.origin>=p.x&&e.origin<p.x+p.w);return p?{min:Math.max(e.origin-(e.roamRange||100),p.x),max:Math.min(e.origin+(e.roamRange||100),p.x+p.w-e.w)}:{min:e.origin-(e.roamRange||100),max:e.origin+(e.roamRange||100)};};
  K.choose=function(s,id,replace){if(s.mode!=='reward'||!s.reward.includes(id))return false;
    if(id==='rest'){s.player.hp=Math.min(K.maxHP(s),s.player.hp+30);s.player.focus=Math.min(100,s.player.focus+35);s.stats.rests++;}
    else if(K.GROWTH.some(r=>r.id===id)){
      const r=K.reward(id);if(!K.rewardEligible(s,id))return false;
      if(r.temporary)s.talisman={id,charges:id==='thunder'?3:2};else{s.growth[id]=K.rank(s,id)+1;if(id==='vitality')s.player.hp=Math.min(K.maxHP(s),s.player.hp+20);}
      K.event(s,'growth',{id,rank:K.rank(s,id)});
    }
    else if(s.relics.length>=3){if(!s.relics.includes(replace)){s.pendingRelic=id;return 'replace';}s.relics[s.relics.indexOf(replace)]=id;K.event(s,'relic',{id,replace});}
    else{s.relics.push(id);K.event(s,'relic',{id});}
    if(s.rewardKind==='mid'||s.rewardKind==='trial'){if(s.rewardKind==='trial')s.room.trial.state='claimed';else s.room.midClaimed=true;s.mode='playing';s.reward=[];s.pendingRelic=null;s.player.invuln=Math.max(s.player.invuln,.5);}
    else K.enterRoom(s,s.stage+1,false);
    return true;
  };
})(globalThis.Kong ||= {});
