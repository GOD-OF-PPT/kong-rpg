(function (K) {
  'use strict';

  function detAngle(s, idx) {
    const h = Math.imul((s.serial = (s.serial + 1) | 0) + idx * 97, 2654435761) >>> 0;
    return (h / 4294967296);
  }

  K.newRun = function (seed, first) {
    const s = {
      version: 2, rules: 2, seed: String(seed || 'BLACK-LOTUS'), stage: 0, mode: 'playing',
      time: 0, elapsed: 0, roomTime: 0, relics: first ? [first] : [], maxRelics: 3, upgradedRelics: [],
      stanceStyle: 'smash', essence: 20, forgeBuys: [], macaqueSlain: false,
      room: null, player: null, clone: null, clones: [], projectiles: [], effects: [], particles: [], events: [], log: [],
      reward: [], rewardKind: 'exit', pendingRelic: null,
      kills: 0, broken: 0, damageTaken: 0, lastDamage: '', hitstop: 0, shake: 0, zoomPunch: 0, flashAlpha: 0, checkpoint: 90,
      combo: 0, comboTime: 0, hitCombo: 0, hitComboTime: 0, maxCombo: 0, insights: 0,
      flowStrikes: 0, shatterCount: 0, bellsCleared: 0, wardensSlain: 0, serial: 0, hints: [],
      stats: { swings: 0, hits: 0, blocks: 0, jumps: 0, dashes: 0, clones: 0, focusSpent: 0, rests: 0, pillars: 0, insights: 0 }
    };
    K.enterRoom(s, 0, true);
    return s;
  };

  K.enterRoom = function (s, stage, initial) {
    const old = s.player;
    s.stage = stage;
    s.room = K.makeRoom(s.seed, stage);
    s.roomTime = 0;
    s.checkpoint = 90;
    const maxHp = old?.maxHp || 100;
    const baseWard = K.has(s, 'vase') ? (K.isAwakened(s, 'vase') ? 26 : 16) : 0;
    s.player = {
      x: 90, y: 380, w: 24, h: 44, vx: 0, vy: 0, face: 1,
      maxHp,
      hp: initial ? 100 : Math.min(maxHp, old.hp + 18),
      focus: initial ? 65 : Math.min(100, old.focus + 20),
      ward: initial ? baseWard : Math.max(old?.ward || 0, baseWard),
      maxWard: K.isAwakened(s, 'vase') ? 32 : 26,
      stance: initial ? 0 : (old?.stance || 0),
      maxStance: 3,
      stanceMeter: initial ? 0 : (old?.stanceMeter || 0),
      grounded: false, coyote: 0, buffer: 0, airJumps: 0, invuln: .8,
      dash: 0, dashCD: 0, perfectWindow: 0, perfectTriggered: false, riposte: 0,
      rockSolid: 0, rockCD: 0, immobCD: 0, switchCD: 0,
      pillar: 0, pillarPerch: 0, pillarStyle: 'smash', pillarPower: 0, pillarStruck: false, vaseCD: 0,
      squashX: 1, squashY: 1,
      attack: 0, attackId: 0, attackTargets: [], comboIndex: 0,
      slam: false, landing: 0, drop: 0, hurt: 0, attackBuffer: 0
    };
    s.clone = null; s.clones = []; s.projectiles = []; s.effects = []; s.particles = [];
    s.hitstop = 0; s.zoomPunch = 0; s.flashAlpha = 0; s.mode = 'playing';
    s.pendingRelic = null; s.reward = [];
    K.event(s, 'room', { stage });
  };

  K.event = function (s, type, data = {}) {
    const e = { type, t: +s.time.toFixed(3), wall: +(s.elapsed || 0).toFixed(3), ...data };
    s.events.push(e); s.log.push(e);
    if (s.log.length > 400) s.log.shift();
    const stat = { swing: 'swings', hit: 'hits', blocked: 'blocks', jump: 'jumps', dash: 'dashes', clone: 'clones', 'pillar-cast': 'pillars', insight: 'insights' }[type];
    if (stat && s.stats) s.stats[stat] = (s.stats[stat] || 0) + 1;
  };

  K.effect = (s, kind, x, y, extra = {}) => s.effects.push({
    kind, x, y,
    maxLife: kind === 'slash-arc' ? .22 : kind === 'thrust-beam' ? .28 : kind === 'ring' || kind === 'insight-ring' || kind === 'bell-wave' ? .52 : kind === 'pillar-smash' ? .48 : kind === 'fire-pool' ? 2.1 : .44,
    life: kind === 'slash-arc' ? .22 : kind === 'thrust-beam' ? .28 : kind === 'ring' || kind === 'insight-ring' || kind === 'bell-wave' ? .52 : kind === 'pillar-smash' ? .48 : kind === 'fire-pool' ? 2.1 : .44,
    ...extra
  });

  K.spawnSparks = function (s, x, y, count, color, dir = 0, speed = 260, grav = 520) {
    s.particles ||= [];
    for (let i = 0; i < count; i++) {
      const r1 = detAngle(s, i), r2 = detAngle(s, i + 17);
      const ang = dir ? (dir > 0 ? -0.9 + r1 * 1.5 : Math.PI - 0.6 + r1 * 1.5) : (r1 * Math.PI * 2);
      const spd = speed * (0.45 + r2 * 0.85);
      s.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - (dir ? 75 : 40),
        life: 0.28 + r2 * 0.28,
        maxLife: 0.56,
        size: i % 3 === 0 ? 4 : 2.5,
        color: i % 4 === 0 ? '#fff6d6' : color,
        grav
      });
    }
    if (s.particles.length > 220) s.particles.splice(0, s.particles.length - 220);
  };

  K.spawnMotes = function (s, x, y, totalEssence) {
    s.room.motes ||= [];
    const orbs = Math.min(7, Math.max(2, Math.round(totalEssence / 4)));
    let left = totalEssence;
    for (let i = 0; i < orbs; i++) {
      const val = i === orbs - 1 ? left : Math.max(1, Math.floor(totalEssence / orbs));
      left -= val;
      const r1 = detAngle(s, i + 3), r2 = detAngle(s, i + 11);
      s.room.motes.push({
        x, y,
        vx: (r1 - 0.5) * 210,
        vy: -120 - r2 * 130,
        val,
        age: 0
      });
    }
  };

  K.forgeMult = function (s) {
    const count = (s.forgeBuys || []).filter(x => x === 'temper').length;
    return 1 + count * 0.22;
  };

  K.cdMult = function (s) {
    return (s.forgeBuys || []).includes('mind') ? 0.72 : 1;
  };

  K.gainStance = function (s, amount) {
    const p = s.player;
    if (!p) return;
    const mult = K.has(s, 'staff') && K.isAwakened(s, 'staff') ? 1.5 : 1;
    p.stanceMeter = (p.stanceMeter || 0) + amount * mult;
    while (p.stanceMeter >= 100 && p.stance < (p.maxStance || 3)) {
      p.stanceMeter -= 100;
      p.stance++;
      K.event(s, 'stance-up', { stance: p.stance });
      K.effect(s, 'notice', p.x, p.y - 16, { text: '棍势 · ' + ['壹', '贰', '叁'][p.stance - 1], color: '#f7d888' });
    }
    if (p.stance >= (p.maxStance || 3)) p.stanceMeter = Math.min(99, p.stanceMeter);
  };

  K.berserkMult = function (s) {
    const p = s.player;
    if (!p) return 1;
    let m = K.forgeMult(s);
    if (K.has(s, 'band')) {
      const active = (s.hitCombo || 0) >= 5 || p.hp <= p.maxHp * 0.55 || (K.hasSynergy(s, 'band_vase') && (p.ward || 0) > 0);
      if (active) m *= (K.isAwakened(s, 'band') ? 1.38 : 1.28);
      else if (K.isAwakened(s, 'band')) m *= 1.15;
    }
    return m;
  };

  K.triggerInsight = function (s, isRockParry = false, attacker = null) {
    const p = s.player;
    if (!p || (!isRockParry && p.perfectTriggered)) return;
    p.perfectTriggered = true;
    p.perfectWindow = 0;
    p.rockSolid = 0;
    p.invuln = Math.max(p.invuln, .48);
    p.focus = Math.min(100, p.focus + (isRockParry ? 22 : 18));
    p.riposte = 2.8;
    const gainPips = isRockParry ? 2 : 1;
    p.stance = Math.min(p.maxStance || 3, (p.stance || 0) + gainPips);
    if (isRockParry) p.rockCD = Math.min(p.rockCD || 0, 1.1);
    s.insights = (s.insights || 0) + 1;
    s.hitstop = isRockParry ? .085 : .065;
    s.shake = isRockParry ? .22 : .15;
    s.zoomPunch = isRockParry ? .11 : .08;
    s.flashAlpha = isRockParry ? .28 : .18;

    if (K.hasSynergy(s, 'mirror_mercy')) {
      p.hp = Math.min(p.maxHp || 100, p.hp + 6);
      p.focus = Math.min(100, p.focus + 12);
    }
    if (attacker && attacker.kind !== 'boss') {
      attacker.phase = 'recover'; attacker.timer = 1.1; attacker.stun = .85; attacker.hitTilt = .35;
    }
    K.effect(s, 'insight-ring', p.x + 12, p.y + 22, { gold: true });
    K.spawnSparks(s, p.x + 12, p.y + 20, 22, isRockParry ? '#ffd466' : '#9cf5e8', 0, 340, 380);
    K.effect(s, 'notice', p.x, p.y - 20, { text: isRockParry ? '铛 · 铜头震岳！' : '毫巅识破！', color: '#ffe699', big: true });
    K.event(s, 'insight', { rock: isRockParry, cutin: isRockParry ? '铜头震岳' : '毫巅识破' });

    const hasChakram = K.has(s, 'chakram');
    const radius = hasChakram || isRockParry ? 155 : 85;
    const dmg = isRockParry ? 24 : hasChakram ? (K.isAwakened(s, 'chakram') ? 32 : 22) : 12;
    if (hasChakram && K.isAwakened(s, 'chakram')) p.dashCD = Math.max(0, p.dashCD * 0.5);
    for (const e of s.room.enemies) {
      if (e.hp > 0 && Math.abs((e.x + e.w / 2) - (p.x + 12)) < radius && Math.abs(e.y - p.y) < 90) {
        K.hitEnemy(s, e, dmg, p.x + 12, true, 'heavy');
        if ((hasChakram || isRockParry) && e.kind !== 'boss') e.stun = Math.max(e.stun, .55);
      }
    }
  };

  K.damage = function (s, n, source, knock = 0, attacker = null) {
    const p = s.player;
    if (s.mode !== 'playing') return false;
    if ((p.rockSolid || 0) > 0) {
      K.triggerInsight(s, true, attacker);
      return false;
    }
    if (p.invuln > 0 || (p.pillarPerch || 0) > 0) return false;
    let remaining = n;
    if ((p.ward || 0) > 0) {
      const absorbed = Math.min(p.ward, remaining);
      p.ward -= absorbed;
      remaining -= absorbed;
      if (remaining <= 0) {
        p.invuln = .65;
        s.shake = .10;
        K.spawnSparks(s, p.x + 12, p.y + 20, 12, '#ffe08c', 0, 220, 420);
        K.effect(s, 'block', p.x + 12, p.y + 18);
        K.effect(s, 'notice', p.x, p.y - 10, { text: '金身抵御 -' + absorbed, color: '#f3d88c' });
        K.event(s, 'ward-block', { source, absorbed });
        return true;
      }
    }
    p.hp = Math.max(0, p.hp - remaining);
    p.invuln = 1; p.hurt = .26; p.vx = knock * 210; p.vy = -210;
    p.attack = 0; p.attackBuffer = 0; p.pillar = 0; p.pillarPerch = 0;
    p.squashX = 1.25; p.squashY = 0.78;
    s.damageTaken += remaining; s.lastDamage = source; s.shake = .20; s.flashAlpha = .16;
    s.hitCombo = 0; s.hitComboTime = 0;
    K.spawnSparks(s, p.x + 12, p.y + 22, 14, '#f26d68', knock, 260, 520);
    K.effect(s, 'hurt', p.x, p.y, { text: '-' + remaining, big: true });
    K.event(s, 'hurt', { source, amount: remaining });
    if (p.hp <= 0) { s.mode = 'dead'; K.event(s, 'death', { source }); }
    return true;
  };

  K.hitEnemy = function (s, e, amount, origin, pierce = false, impact = 'light') {
    if (e.hp <= 0) return false;
    const front = (origin - (e.x + e.w / 2)) * e.face > 0;
    if (e.kind === 'boss' && e.phase !== 'recover' && (e.frozen || 0) <= 0 && front) {
      const ratio = (impact === 'pillar' && (K.hasSynergy(s, 'trinity') || (s.player?.pillarPower || 0) >= 3)) ? .82 : .4;
      amount = Math.ceil(amount * ratio);
      K.effect(s, 'block', e.x + 24, e.y + 20);
      K.spawnSparks(s, e.x + 24, e.y + 26, 7, '#d88ce8', Math.sign(origin - e.x), 180, 400);
      K.event(s, 'boss-guard', { chip: amount });
    }
    if (e.kind === 'shield' && front && !pierce && e.stun <= 0 && (e.frozen || 0) <= 0 && e.phase !== 'recover') {
      K.effect(s, 'block', e.x, e.y + 12);
      K.spawnSparks(s, e.x + 12, e.y + 18, 9, '#f0d599', Math.sign(origin - e.x), 210, 480);
      K.event(s, 'blocked', { target: e.id });
      s.player.focus = Math.min(100, s.player.focus + 3);
      return false;
    }
    if (e.kind === 'warden' && front && !pierce && impact === 'light' && (e.frozen || 0) <= 0 && e.phase !== 'recover') {
      amount = Math.max(1, Math.floor(amount * .75));
    }

    // Crit check if Macaque slain (deterministic from s.serial)
    let isCrit = false;
    if (s.macaqueSlain && impact !== 'shatter' && detAngle(s, e.id + 5) < 0.22) {
      amount = Math.round(amount * 1.45);
      isCrit = true;
    }

    const dir = Math.sign((e.x + e.w / 2) - origin) || 1;
    e.hp = Math.max(0, e.hp - amount);
    e.flash = .15;
    e.hitTilt = dir * (impact === 'pillar' ? .36 : impact === 'heavy' ? .26 : .16);
    e.stun = (e.kind === 'boss' || (e.kind === 'warden' && impact === 'light')) ? 0 : .085;

    if (e.kind !== 'boss' && (impact === 'heavy' || impact === 'pillar') && e.phase === 'windup' && (e.interruptLock || 0) <= 0) {
      e.phase = 'recover'; e.timer = .75; e.interruptLock = 1;
      K.event(s, 'interrupt', { target: e.id });
      K.effect(s, 'block', e.x + 12, e.y + 4);
      K.effect(s, 'notice', e.x + 12, e.y - 10, { text: '破招！', color: '#ffe394' });
    }
    if (e.kind !== 'boss' && (e.kind !== 'warden' || impact !== 'light')) {
      const bounds = K.patrolBounds(s, e);
      const push = impact === 'pillar' ? 28 : impact === 'heavy' ? 18 : 12;
      e.x = K.clamp(e.x + dir * push, bounds.min, bounds.max);
    }

    K.spawnSparks(s, e.x + e.w / 2, e.y + e.h * 0.45, impact === 'pillar' ? 22 : impact === 'heavy' ? 14 : 9,
      impact === 'pillar' ? '#ffe07d' : isCrit ? '#ff8e6e' : '#f5c77e', dir, impact === 'pillar' ? 340 : 250, 520);

    K.effect(s, 'hit', e.x + e.w / 2, e.y + 12, {
      text: (isCrit ? '暴 ' : '') + String(amount),
      color: isCrit ? '#ff9973' : impact === 'pillar' ? '#ffe899' : '#f2d28f',
      big: isCrit || impact === 'pillar' || impact === 'heavy'
    });

    s.hitstop = impact === 'pillar' ? .065 : impact === 'heavy' ? .045 : .032;
    s.shake = impact === 'pillar' ? .18 : impact === 'heavy' ? .11 : .065;
    if (impact === 'pillar') { s.zoomPunch = .09; s.flashAlpha = .15; }
    s.hitCombo = (s.hitCombo || 0) + 1;
    s.hitComboTime = 3.4;
    s.maxCombo = Math.max(s.maxCombo || 0, s.hitCombo);
    if (impact !== 'pillar' && impact !== 'shatter') K.gainStance(s, impact === 'heavy' ? 40 : 26);
    K.event(s, 'hit', { target: e.id, kind: e.kind, amount });

    // Immobilize Shatter Seal check
    if ((e.frozen || 0) > 0 && e.hp > 0 && impact !== 'shatter') {
      e.freezeHits = (e.freezeHits || 0) + 1;
      if (e.freezeHits >= 3) {
        e.frozen = 0; e.freezeHits = 0;
        s.shatterCount = (s.shatterCount || 0) + 1;
        K.effect(s, 'insight-ring', e.x + e.w / 2, e.y + e.h / 2, { gold: true });
        K.effect(s, 'notice', e.x + e.w / 2, e.y - 16, { text: '定印崩裂！', color: '#ffe794', big: true });
        K.event(s, 'shatter');
        K.hitEnemy(s, e, 28, origin, true, 'shatter');
      }
    }

    if (e.hp === 0 && !e.deadHandled) {
      e.deadHandled = true;
      s.kills++;
      s.player.focus = Math.min(100, s.player.focus + 10);
      if (K.has(s, 'band') && K.berserkMult(s) > 1.05) {
        s.player.hp = Math.min(s.player.maxHp || 100, s.player.hp + 4);
        if (K.isAwakened(s, 'band')) s.player.focus = Math.min(100, s.player.focus + 8);
      }

      // Launch tumbling corpse + magnetic Spirit Essence motes!
      s.room.corpses ||= [];
      s.room.corpses.push({
        kind: e.kind, x: e.x, y: e.y, w: e.w, h: e.h, face: e.face,
        vx: dir * (160 + (impact === 'pillar' ? 120 : 40)),
        vy: -240 - (impact === 'pillar' ? 90 : 0),
        rot: 0, vrot: dir * 9.5, life: .68, maxLife: .68
      });
      K.spawnSparks(s, e.x + e.w / 2, e.y + e.h / 2, 18, '#e39cf0', dir, 290, 420);
      const dropEssence = e.kind === 'macaque' ? 60 : e.kind === 'warden' ? 28 : e.kind === 'spear' || e.kind === 'shield' ? 9 : 7;
      if (e.kind !== 'boss') K.spawnMotes(s, e.x + e.w / 2, e.y + 18, dropEssence);

      if (e.kind === 'warden') {
        s.wardensSlain = (s.wardensSlain || 0) + 1;
        s.player.hp = Math.min(s.player.maxHp || 100, s.player.hp + 20);
        s.player.focus = Math.min(100, s.player.focus + 30);
        K.gainStance(s, 100);
        s.zoomPunch = .10;
        K.effect(s, 'ring', e.x + e.w / 2, e.y + e.h, { fire: true });
        K.effect(s, 'notice', e.x, e.y - 16, { text: '魔将授首 · 生命+20', color: '#ffe194', big: true });
        K.event(s, 'warden-kill', { cutin: '魔将授首' });
      } else if (e.kind === 'macaque') {
        s.macaqueSlain = true;
        s.maxRelics = 4;
        s.player.hp = Math.min(s.player.maxHp || 100, s.player.hp + 30);
        s.player.ward = Math.min(s.player.maxWard || 32, (s.player.ward || 0) + 22);
        K.gainStance(s, 100);
        s.zoomPunch = .12; s.flashAlpha = .25;
        K.effect(s, 'insight-ring', e.x + 14, e.y + 24, { gold: true });
        K.effect(s, 'notice', e.x, e.y - 20, { text: '斩却六耳 · 开启第四舍利槽 & 火眼暴击！', color: '#ffe596', big: true });
        K.event(s, 'macaque-kill', { cutin: '心魔俱灭' });
      }
      K.event(s, 'kill', { kind: e.kind });
      if (e.kind === 'boss') {
        s.zoomPunch = .14; s.flashAlpha = .35;
        s.mode = 'won';
        K.event(s, 'victory', { cutin: '万佛重光' });
      }
    }
    return true;
  };

  K.detonateJar = function (s, jar) {
    if (jar.broken) return;
    jar.broken = true; jar.hp = 0;
    const cx = jar.x + 17, cy = jar.bottom - 18;
    s.shake = Math.max(s.shake, .22);
    s.zoomPunch = Math.max(s.zoomPunch || 0, .08);
    s.flashAlpha = Math.max(s.flashAlpha || 0, .18);
    K.effect(s, 'ring', cx, jar.bottom, { fire: true });
    K.effect(s, 'fire-pool', cx, jar.bottom);
    K.spawnSparks(s, cx, cy, 28, '#ff944d', 0, 380, 480);
    K.effect(s, 'notice', cx, cy - 18, { text: '雷火轰爆！', color: '#ffb066', big: true });
    K.event(s, 'jar-boom', { x: cx, y: cy });
    K.strike(s, { x: cx - 95, y: cy - 60, w: 190, h: 95 }, 42, cx, true, ['br' + jar.id], 'pillar');
  };

  K.openChest = function (s, chest) {
    if (chest.broken) return;
    chest.broken = true; chest.hp = 0;
    const p = s.player, cx = chest.x + 17, cy = chest.bottom - 18;
    p.hp = Math.min(p.maxHp || 100, p.hp + 16);
    p.focus = Math.min(100, p.focus + 20);
    K.spawnMotes(s, cx, cy, 32);
    K.spawnSparks(s, cx, cy, 20, '#9bf5c8', 0, 270, 420);
    K.effect(s, 'notice', cx, cy - 16, { text: '金匮开启 · 灵蕴+32', color: '#ffe599', big: true });
    K.event(s, 'chest-open');
  };

  K.strike = function (s, box, amount, origin, pierce, targets, impact = 'light') {
    for (const e of s.room.enemies) if (e.hp > 0 && K.overlap(box, e) && !targets.includes('e' + e.id)) {
      targets.push('e' + e.id);
      if (K.hitEnemy(s, e, amount, origin, pierce, impact)) s.player.focus = Math.min(100, s.player.focus + 12);
    }
    for (const seal of s.room.seals) if (seal.hp > 0 && K.overlap(box, seal) && !targets.includes('s' + seal.id)) {
      targets.push('s' + seal.id);
      const sealDmg = (impact === 'pillar' && K.hasSynergy(s, 'chakram_staff')) ? Math.round(amount * 1.35) : amount;
      seal.hp = Math.max(0, seal.hp - sealDmg);
      s.player.focus = Math.min(100, s.player.focus + 9);
      s.hitCombo = (s.hitCombo || 0) + 1; s.hitComboTime = 3.4; s.maxCombo = Math.max(s.maxCombo || 0, s.hitCombo);
      if (impact !== 'pillar') K.gainStance(s, 24);
      K.spawnSparks(s, seal.x + 14, seal.y + 22, 12, '#e89cf5', Math.sign(seal.x - origin), 250, 460);
      K.effect(s, 'hit', seal.x + 14, seal.y + 10, { text: String(sealDmg), color: '#e3b3ed', big: impact === 'pillar' });
      K.event(s, 'seal-hit', { id: seal.id });
      if (seal.hp === 0) {
        s.broken++;
        s.shake = .18; s.zoomPunch = .09; s.flashAlpha = .20;
        K.spawnSparks(s, seal.x + 14, seal.y + 24, 26, '#f2b8ff', 0, 350, 420);
        K.spawnMotes(s, seal.x + 14, seal.y + 20, 18);
        K.effect(s, 'ring', seal.x + 14, seal.y + 20);
        K.event(s, 'seal', { id: seal.id, cutin: '黑莲阵破' });
        if (K.has(s, 'mercy')) {
          s.player.hp = Math.min(s.player.maxHp || 100, s.player.hp + 12);
          if (K.isAwakened(s, 'mercy')) s.player.ward = Math.min(s.player.maxWard || 26, (s.player.ward || 0) + 14);
        }
      }
    }
    for (const br of (s.room.breakables || [])) if (!br.broken && K.overlap(box, br) && !targets.includes('br' + br.id)) {
      targets.push('br' + br.id);
      if (br.kind === 'firejar') K.detonateJar(s, br);
      else K.openChest(s, br);
    }
  };

  K.attackBox = function (s) {
    const p = s.player;
    const style = s.stanceStyle || 'smash';
    let range = p.riposteActive ? 104 : p.comboIndex === 3 ? (K.has(s, 'staff') ? 112 : 79) : !p.grounded && K.has(s, 'cloud') ? 86 : 65;
    let yOff = 2, h = 42;
    if (!p.riposteActive) {
      if (style === 'thrust') { range = Math.round(range * 1.38); yOff = 6; h = 34; }
      else if (style === 'pillar') { range = Math.round(range * 1.08); yOff = -12; h = 62; }
    }
    return { x: p.face > 0 ? p.x + 10 : p.x + 14 - range, y: p.y + yOff, w: range, h };
  };

  K.forgeBuy = function (s, id) {
    if (s.mode !== 'forge') return false;
    const item = K.FORGE_UPGRADES.find(u => u.id === id);
    if (!item || (s.essence || 0) < item.cost) return false;
    if (id === 'mind' && (s.forgeBuys || []).includes('mind')) return false;
    if (id === 'awaken') {
      const target = s.relics.find(r => !K.isAwakened(s, r));
      if (!target) return false;
      s.upgradedRelics ||= [];
      s.upgradedRelics.push(target);
    } else if (id === 'vital') {
      s.player.maxHp = (s.player.maxHp || 100) + 25;
      s.player.hp = Math.min(s.player.maxHp, s.player.hp + 35);
      s.player.ward = Math.min((s.player.maxWard || 26) + 10, (s.player.ward || 0) + 20);
    }
    s.essence -= item.cost;
    s.forgeBuys ||= [];
    s.forgeBuys.push(id);
    K.event(s, 'forge-buy', { id });
    return true;
  };

  K.step = function (s, a = {}, dt = K.DT) {
    s.events = [];
    if (s.mode !== 'playing') return;
    s.elapsed = (s.elapsed || 0) + dt;
    if (a.stancePressed) {
      const order = ['smash', 'pillar', 'thrust'];
      const nextStyle = order[(order.indexOf(s.stanceStyle || 'smash') + 1) % 3];
      s.stanceStyle = nextStyle;
      const st = K.stanceInfo(nextStyle);
      const p0 = s.player;
      if (s.comboTime > 0.12 && (p0.switchCD || 0) <= 0) {
        p0.switchCD = 1.25;
        s.flowStrikes = (s.flowStrikes || 0) + 1;
        const dmg = Math.round(18 * K.berserkMult(s) * (K.hasSynergy(s, 'chakram_staff') ? 1.35 : 1));
        K.strike(s, { x: p0.x - 58, y: p0.y - 10, w: 140, h: 62 }, dmg, p0.x + 12, true, [], 'heavy');
        K.effect(s, 'slash-arc', p0.x + 12, p0.y + 22, { face: p0.face, style: nextStyle, spin: true, radius: 68 });
        K.gainStance(s, 28);
        K.effect(s, 'notice', p0.x, p0.y - 18, { text: '易势 · ' + st.name, color: st.color, big: true });
        K.event(s, 'stance-switch', { style: nextStyle, flow: true, cutin: '易势·' + st.name });
      } else {
        K.effect(s, 'notice', p0.x, p0.y - 14, { text: st.name, color: st.color });
        K.event(s, 'stance-switch', { style: nextStyle, flow: false });
      }
      a = { ...a, stancePressed: false };
    }
    if (s.hitstop > 0) { s.hitstop = Math.max(0, s.hitstop - dt); return; }
    s.time += dt; s.roomTime += dt;
    s.shake = Math.max(0, s.shake - dt);
    s.zoomPunch = Math.max(0, (s.zoomPunch || 0) - dt * 0.28);
    s.flashAlpha = Math.max(0, (s.flashAlpha || 0) - dt * 1.3);

    if ((s.hitComboTime || 0) > 0) {
      s.hitComboTime = Math.max(0, s.hitComboTime - dt);
      if (s.hitComboTime === 0) s.hitCombo = 0;
    }

    const p = s.player;
    const oldY = p.y;
    const wasGrounded = p.grounded;
    p.squashX = 1 + ((p.squashX || 1) - 1) * Math.exp(-dt * 18);
    p.squashY = 1 + ((p.squashY || 1) - 1) * Math.exp(-dt * 18);

    // Step particles, corpses, and magnetic Spirit Essence motes
    for (const pt of (s.particles || [])) {
      pt.life -= dt;
      pt.vy += (pt.grav || 500) * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.y >= 439 && pt.vy > 0) { pt.y = 439; pt.vy *= -0.42; pt.vx *= 0.72; }
    }
    if (s.particles) s.particles = s.particles.filter(pt => pt.life > 0);

    for (const cp of (s.room.corpses || [])) {
      cp.life -= dt;
      cp.vy += 680 * dt;
      cp.x += cp.vx * dt;
      cp.y += cp.vy * dt;
      cp.rot += cp.vrot * dt;
      if (cp.y + cp.h >= 440 && cp.vy > 0) { cp.y = 440 - cp.h; cp.vy *= -0.35; cp.vx *= 0.6; }
    }
    if (s.room.corpses) s.room.corpses = s.room.corpses.filter(cp => cp.life > 0);

    for (const m of (s.room.motes || [])) {
      m.age += dt;
      if (m.age < 0.28) {
        m.vy += 420 * dt;
        m.x += m.vx * dt;
        m.y = Math.min(434, m.y + m.vy * dt);
      } else {
        const dx = (p.x + 12) - m.x, dy = (p.y + 20) - m.y, dist = Math.hypot(dx, dy) || 1;
        const pull = Math.min(720, 260 + m.age * 460);
        m.x += (dx / dist) * pull * dt;
        m.y += (dy / dist) * pull * dt;
        if (dist < 22) {
          m.collected = true;
          s.essence = (s.essence || 0) + m.val;
          K.event(s, 'mote', { val: m.val });
        }
      }
    }
    if (s.room.motes) s.room.motes = s.room.motes.filter(m => !m.collected && m.age < 9);

    for (const fx of s.effects) {
      fx.life -= dt;
      if (fx.kind === 'fire-pool' && Math.floor((fx.life + dt) * 3) !== Math.floor(fx.life * 3)) {
        K.strike(s, { x: fx.x - 95, y: fx.y - 36, w: 190, h: 42 }, 9, fx.x, true, [], 'light');
      }
    }
    s.effects = s.effects.filter(fx => fx.life > 0);

    for (const key of ['invuln', 'dashCD', 'landing', 'buffer', 'coyote', 'drop', 'hurt', 'attackBuffer', 'perfectWindow', 'riposte', 'rockSolid', 'rockCD', 'immobCD', 'switchCD', 'vaseCD']) {
      p[key] = Math.max(0, (p[key] || 0) - dt);
    }
    if (K.hasSynergy(s, 'trinity')) p.focus = Math.min(100, p.focus + 2.4 * dt);
    if ((s.forgeBuys || []).includes('mind')) p.focus = Math.min(100, p.focus + 1.8 * dt);
    if (s.stage === 3 && s.room.enemies[0]?.hp > 0 && s.room.enemies[0].hp <= 90) p.focus = Math.min(100, p.focus + 3.5 * dt);

    // [Q] Stance Style Switch + Flow-Switch Combo Strike!
    if (a.stancePressed) {
      const order = ['smash', 'pillar', 'thrust'];
      const nextStyle = order[(order.indexOf(s.stanceStyle || 'smash') + 1) % 3];
      s.stanceStyle = nextStyle;
      const st = K.stanceInfo(nextStyle);
      if (s.comboTime > 0.12 && (p.switchCD || 0) <= 0) {
        p.switchCD = 1.25;
        s.flowStrikes = (s.flowStrikes || 0) + 1;
        const dmg = Math.round(18 * K.berserkMult(s) * (K.hasSynergy(s, 'chakram_staff') ? 1.35 : 1));
        K.strike(s, { x: p.x - 58, y: p.y - 10, w: 140, h: 62 }, dmg, p.x + 12, true, [], 'heavy');
        K.effect(s, 'slash-arc', p.x + 12, p.y + 22, { face: p.face, style: nextStyle, spin: true, radius: 68 });
        K.gainStance(s, 28);
        K.effect(s, 'notice', p.x, p.y - 18, { text: '易势 · ' + st.name, color: st.color, big: true });
        K.event(s, 'stance-switch', { style: nextStyle, flow: true, cutin: '易势·' + st.name });
      } else {
        K.effect(s, 'notice', p.x, p.y - 14, { text: st.name, color: st.color });
        K.event(s, 'stance-switch', { style: nextStyle, flow: false });
      }
    }

    // [F] Immobilize Spell (定身法)
    if (a.immobPressed && (p.immobCD || 0) <= 0) {
      if (p.focus >= 25) {
        p.focus -= 25;
        s.stats.focusSpent += 25;
        p.immobCD = 5.5 * K.cdMult(s);
        let locked = 0;
        for (const e of s.room.enemies) {
          if (e.hp > 0 && Math.abs((e.x + e.w / 2) - (p.x + 12)) < 250 && Math.abs(e.y - p.y) < 120) {
            e.frozen = (e.kind === 'boss' || e.kind === 'macaque') ? 1.15 : 2.6;
            e.freezeHits = 0;
            locked++;
            K.spawnSparks(s, e.x + e.w / 2, e.y + e.h / 2, 14, '#ffe588', 0, 210, 260);
          }
        }
        s.zoomPunch = .07;
        K.effect(s, 'insight-ring', p.x + 12 + p.face * 55, p.y + 18, { gold: true });
        K.effect(s, 'notice', p.x + 12, p.y - 18, { text: locked ? '【定！】万邪凝滞' : '【定！】虚空凝印', color: '#ffe588', big: true });
        K.event(s, 'immobilize', { locked, cutin: locked ? '一字定身' : '' });
      } else {
        K.event(s, 'empty-focus');
        K.effect(s, 'notice', p.x, p.y - 14, { text: '定力不足 (需25)' });
      }
    }

    // [C] Rock Solid Deflect (铜头铁臂)
    if (a.parryPressed && (p.rockCD || 0) <= 0 && !p.slam && (p.pillar || 0) <= 0) {
      p.rockSolid = .38;
      p.rockCD = 4.0 * K.cdMult(s);
      p.attack = 0;
      p.vx *= 0.25;
      K.spawnSparks(s, p.x + 12, p.y + 22, 10, '#f5cc73', 0, 160, 300);
      K.effect(s, 'notice', p.x, p.y - 14, { text: '铜头铁臂', color: '#f5d284' });
      K.event(s, 'rock-cast');
    }

    if (a.attackPressed) p.attackBuffer = .12;
    s.comboTime = Math.max(0, s.comboTime - dt);
    if (s.comboTime === 0) s.combo = 0;
    if (a.jumpPressed) p.buffer = .12;
    if (p.grounded) {
      p.coyote = .10; p.airJumps = 0;
      const safeGround = s.room.platforms.some(q => q.solid && Math.abs(p.y + p.h - q.y) < 3 && p.x > q.x + 60 && p.x < q.x + q.w - 130);
      if (safeGround && !s.room.hazards.some(h => Math.abs(h.x - p.x) < 120)) s.checkpoint = p.x;
    }

    if (a.down && a.jumpPressed && p.grounded && s.room.platforms.some(q => !q.solid && Math.abs(p.y + p.h - q.y) < 3 && p.x + p.w > q.x && p.x < q.x + q.w)) {
      p.drop = .28; p.y += 4; p.vy = 90; p.buffer = 0; p.coyote = 0; p.grounded = false;
      K.event(s, 'drop');
    }

    if (a.dashPressed && p.dashCD === 0 && !p.slam && (p.pillar || 0) <= 0 && (p.pillarPerch || 0) <= 0) {
      p.dash = .18; p.dashCD = .85; p.invuln = Math.max(p.invuln, .21);
      p.perfectWindow = .145; p.perfectTriggered = false;
      p.attack = 0; p.vy = 0;
      p.squashX = 1.26; p.squashY = 0.80;
      K.event(s, 'dash');
    }

    // [U] Stance-Specific Heavy Finisher!
    if (a.heavyPressed && (p.stance || 0) >= 1 && p.attack <= 0 && (p.pillar || 0) <= 0 && (p.pillarPerch || 0) <= 0 && !p.slam && p.dash <= 0) {
      p.pillarPower = p.stance;
      p.pillarStyle = s.stanceStyle || 'smash';
      p.stance = 0; p.stanceMeter = 0;
      p.pillarStruck = false;
      if (p.pillarStyle === 'pillar') {
        p.pillarPerch = .34;
        p.pillar = .56;
        p.invuln = Math.max(p.invuln, .52);
        p.vy = -420; p.vx = 0;
      } else if (p.pillarStyle === 'thrust') {
        p.pillar = .30;
        p.invuln = Math.max(p.invuln, .26);
        p.vy = -40; p.vx = p.face * 180;
      } else {
        p.pillar = .34;
        p.invuln = Math.max(p.invuln, .28);
        p.vy = -155; p.vx = p.face * 115;
      }
      const cutNames = { smash: '断岳劈山', pillar: '镇海雷罡', thrust: '贯日长虹' };
      K.event(s, 'pillar-cast', { power: p.pillarPower, style: p.pillarStyle, cutin: p.pillarPower >= 2 ? cutNames[p.pillarStyle] : '' });
    }

    // [L] Pluck of Many (Multi-Monkey Clones!)
    if (a.clonePressed && (!s.clones || s.clones.length === 0) && !s.clone) {
      const cost = K.has(s, 'echo') ? 50 : 40;
      if (p.focus >= cost) {
        p.focus -= cost; s.stats.focusSpent += cost;
        const count = K.has(s, 'echo') ? 3 : 2;
        const life = K.has(s, 'echo') ? 3.2 : 1.9;
        s.clones = [];
        for (let i = 0; i < count; i++) {
          const offset = i === 0 ? 0 : (i === 1 ? -28 * p.face : 28 * p.face);
          s.clones.push({
            x: K.clamp(p.x + offset, 16, s.room.width - 40),
            y: p.y, vx: 0, vy: i === 0 ? 0 : -180,
            w: 24, h: 44, face: p.face, life, timer: .12 + i * .09
          });
        }
        s.clone = s.clones[0];
        K.spawnSparks(s, p.x + 12, p.y + 22, 16, '#8cf5e8', 0, 220, 320);
        K.event(s, 'clone', { cost, count });
      } else {
        K.event(s, 'empty-focus');
        K.effect(s, 'notice', p.x, p.y - 14, { text: '定力不足' });
      }
    }

    const moving = (a.right ? 1 : 0) - (a.left ? 1 : 0);
    if (moving && !p.dash && !p.slam && (p.pillar || 0) <= 0 && (p.pillarPerch || 0) <= 0) p.face = moving;
    if (a.aimFace && a.attack && p.attack <= 0 && (p.pillar || 0) <= 0) p.face = a.aimFace;

    if (p.buffer > 0 && !p.slam && !p.dash && (p.pillar || 0) <= 0 && (p.pillarPerch || 0) <= 0 && (p.coyote > 0 || (K.has(s, 'cloud') && p.airJumps < 1))) {
      const air = p.coyote === 0;
      p.vy = air ? -490 : -590;
      if (air) p.airJumps++;
      p.buffer = 0; p.coyote = 0; p.grounded = false;
      p.squashX = 0.84; p.squashY = 1.18;
      K.event(s, 'jump', { air });
      K.effect(s, 'dust', p.x + 12, p.y + 44);
    }
    if (!a.jump && p.vy < -210 && (p.pillarPerch || 0) <= 0) p.vy += 1800 * dt;

    if ((a.attack || p.attackBuffer > 0) && p.attack <= 0 && p.landing === 0 && p.dash <= 0 && (p.pillar || 0) <= 0 && (p.pillarPerch || 0) <= 0) {
      p.attackBuffer = 0;
      if (a.down && !p.grounded) {
        p.slam = true; p.vy = 660; p.vx = 0;
        K.event(s, 'slam');
      } else if ((p.riposte || 0) > 0) {
        p.riposte = 0;
        p.riposteActive = true;
        p.comboIndex = 3;
        p.attack = .32; p.attackDuration = .32; p.attackTargets = []; p.attackId++;
        p.vx = p.face * 360;
        p.squashX = 1.18; p.squashY = 0.88;
        K.effect(s, 'slash-arc', p.x + 12 + p.face * 38, p.y + 22, { face: p.face, style: 'riposte', combo: 3, radius: 78 });
        K.event(s, 'swing', { combo: 3, riposte: true });
      } else {
        p.riposteActive = false;
        const style = s.stanceStyle || 'smash';
        s.combo = s.combo % 3 + 1; s.comboTime = .82; p.comboIndex = s.combo;
        p.attack = p.comboIndex === 3 ? (K.has(s, 'staff') ? .48 : .38) : (style === 'thrust' ? .26 : .29);
        p.attackDuration = p.attack; p.attackTargets = []; p.attackId++;
        if (style === 'thrust' && p.comboIndex === 1 && moving === -p.face && p.grounded) {
          p.vx = -p.face * 210; // Tactical backstep thrust!
        } else if (style === 'smash' && p.comboIndex === 3 && p.grounded) {
          p.vx = p.face * 150;
        }
        const box = K.attackBox(s);
        K.effect(s, style === 'thrust' ? 'thrust-beam' : 'slash-arc',
          p.x + 12 + p.face * (style === 'thrust' ? 18 : 28), p.y + 22,
          { face: p.face, style, combo: p.comboIndex, radius: box.w * 0.78, w: box.w });
        K.event(s, 'swing', { combo: p.comboIndex, style });
      }
    }

    // Step Stance-Specific Heavy Finishers
    if ((p.pillarPerch || 0) > 0) {
      p.pillarPerch = Math.max(0, p.pillarPerch - dt);
      p.vx = 0;
      p.vy = p.pillarPerch > .12 ? Math.max(-60, p.vy * 0.8) : 640;
    }
    if ((p.pillar || 0) > 0) {
      p.pillar = Math.max(0, p.pillar - dt);
      const triggerAt = p.pillarStyle === 'pillar' ? .20 : .21;
      if (p.pillar <= triggerAt && !p.pillarStruck) {
        p.pillarStruck = true;
        const pwr = p.pillarPower || 1;
        const baseDmg = pwr >= 3 ? 80 : pwr === 2 ? 56 : 38;
        const dmg = Math.round(baseDmg * K.berserkMult(s) * (K.hasSynergy(s, 'chakram_staff') ? 1.35 : 1));

        if (p.pillarStyle === 'pillar') {
          const w = 210 + pwr * 34;
          K.strike(s, { x: p.x + 12 - w / 2, y: p.y - 24, w, h: 82 }, dmg, p.x + 12, true, [], 'pillar');
          for (const e of s.room.enemies) if (e.hp > 0 && Math.abs((e.x + e.w / 2) - (p.x + 12)) < w / 2 && e.kind !== 'boss') e.stun = Math.max(e.stun, .65);
          K.effect(s, 'insight-ring', p.x + 12, p.y + 38, { cyan: true });
          K.effect(s, 'pillar-smash', p.x + 12, p.y + 42, { face: 0, w, power: pwr, style: 'pillar' });
          if (s.clones?.length && K.hasSynergy(s, 'cloud_echo')) {
            for (const c of s.clones) {
              K.strike(s, { x: c.x - 80, y: c.y - 10, w: 184, h: 72 }, 22, c.x + 12, true, [], 'heavy');
              K.effect(s, 'ring', c.x + 12, c.y + c.h, { cyan: true });
            }
          }
        } else if (p.pillarStyle === 'thrust') {
          const w = 175 + pwr * 32;
          const box = { x: p.face > 0 ? p.x + 10 : p.x + 14 - w, y: p.y - 6, w, h: 52 };
          K.strike(s, box, dmg, p.x + 12, true, [], 'pillar');
          K.effect(s, 'thrust-beam', p.x + 12, p.y + 22, { face: p.face, w, heavy: true, power: pwr });
        } else {
          const w = 104 + pwr * 30;
          const box = { x: p.face > 0 ? p.x + 6 : p.x + 18 - w, y: p.y - 28, w, h: 78 };
          K.strike(s, box, dmg, p.x + 12, true, [], 'pillar');
          K.effect(s, 'pillar-smash', p.x + 12 + p.face * (w * .45), p.y + 42, { face: p.face, w, power: pwr, style: 'smash' });
          K.effect(s, 'fire-pool', p.x + 12 + p.face * (w * .5), p.y + p.h);
        }
        if (K.hasSynergy(s, 'staff_flame')) {
          s.projectiles.push({ x: p.x + 12, y: p.y + 24, vx: p.face * 500, vy: 0, w: 28, h: 18, life: 1.4, friendly: true, damage: 18, flameWave: true });
        }
        K.event(s, 'pillar-hit', { power: pwr, style: p.pillarStyle });
      }
    }

    if (p.attack > 0) {
      const elapsed = p.attackDuration - p.attack;
      if (elapsed >= .055 && elapsed < .18) {
        let base = p.riposteActive ? 34 : p.comboIndex === 3 ? (K.has(s, 'staff') && K.isAwakened(s, 'staff') ? 36 : 27) : 14;
        base = Math.round(base * K.berserkMult(s));
        const pierce = p.riposteActive || (p.comboIndex === 3 && K.has(s, 'staff')) || (s.stanceStyle === 'thrust' && p.comboIndex === 3);
        const prevTargets = p.attackTargets.length;
        K.strike(s, K.attackBox(s), base, p.x + 12, pierce, p.attackTargets, p.comboIndex === 3 ? 'heavy' : 'light');
        if (p.comboIndex === 3 && K.hasSynergy(s, 'staff_flame') && !p.flameWaveSent) {
          p.flameWaveSent = true;
          s.projectiles.push({ x: p.x + 12, y: p.y + 24, vx: p.face * 460, vy: 0, w: 24, h: 16, life: 1.1, friendly: true, damage: 18, flameWave: true });
        }
        if (p.riposteActive && p.attackTargets.length > prevTargets) {
          K.effect(s, 'ring', p.x + 12 + p.face * 36, p.y + 24, { fire: true });
        }
      }
      p.attack = Math.max(0, p.attack - dt);
      if (p.attack === 0) { p.riposteActive = false; p.flameWaveSent = false; }
    }

    const speedBonus = (K.has(s, 'vase') && K.isAwakened(s, 'vase') && (p.ward || 0) > 0) ? 1.12 : 1;
    if (p.dash > 0) {
      p.dash = Math.max(0, p.dash - dt);
      p.vx = p.face * 650; p.vy = 0;
      if (Math.floor(s.time * 60) % 2 === 0) K.effect(s, 'trail', p.x, p.y, { face: p.face });
      if (K.has(s, 'chakram')) {
        for (const e of s.room.enemies) {
          if (e.hp > 0 && K.overlap(p, e) && !(p.dashHit || []).includes(e.id)) {
            (p.dashHit ||= []).push(e.id);
            K.hitEnemy(s, e, K.isAwakened(s, 'chakram') ? 28 : 20, p.x + 12, true, 'heavy');
            if (e.kind !== 'boss') e.stun = Math.max(e.stun, .45);
          }
        }
      }
      if (p.dash === 0) p.dashHit = [];
    } else if (!p.slam && (p.pillarPerch || 0) <= 0) {
      const target = moving * (p.attack > .08 && p.grounded ? 125 : 245 * speedBonus);
      p.vx += (target - p.vx) * Math.min(1, dt * (p.grounded ? 18 : 10));
      p.vy = Math.min(p.vy + 1570 * dt, 800);
    }

    p.x = K.clamp(p.x + p.vx * dt, 8, s.room.width - p.w - 8);
    p.y += p.vy * dt;
    p.grounded = false;

    for (const platform of s.room.platforms) {
      if ((platform.solid || p.drop === 0) && p.vy >= 0 && oldY + p.h <= platform.y + 5 && p.y + p.h >= platform.y && p.x + p.w > platform.x + 2 && p.x < platform.x + platform.w - 2) {
        if (!wasGrounded && p.vy > 180) {
          p.squashX = 1.22; p.squashY = 0.80;
          K.effect(s, 'dust', p.x + 12, platform.y);
        }
        p.y = platform.y - p.h; p.vy = 0; p.grounded = true;
        if (p.slam) {
          p.slam = false; p.landing = .15;
          p.squashX = 1.32; p.squashY = 0.72;
          const fire = K.has(s, 'flame');
          const fireDmg = fire ? (K.isAwakened(s, 'flame') ? 44 : 36) : 22;
          K.strike(s, { x: p.x - (fire ? 115 : 50), y: p.y - 8, w: fire ? 260 : 124, h: 80 }, Math.round(fireDmg * K.berserkMult(s)), p.x + 12, true, [], 'heavy');
          K.effect(s, 'ring', p.x + 12, p.y + p.h, { fire });
          K.spawnSparks(s, p.x + 12, p.y + p.h, fire ? 24 : 14, fire ? '#ff884d' : '#f2d599', 0, 320, 480);
          if (fire && K.isAwakened(s, 'flame')) K.effect(s, 'fire-pool', p.x + 12, p.y + p.h);
          if ((s.clones?.length || s.clone) && K.hasSynergy(s, 'cloud_echo')) {
            const list = s.clones?.length ? s.clones : [s.clone];
            for (const c of list) {
              K.strike(s, { x: c.x - 85, y: c.y - 10, w: 194, h: 72 }, 22, c.x + 12, true, [], 'heavy');
              K.effect(s, 'ring', c.x + 12, c.y + c.h, { cyan: true });
            }
          }
          K.event(s, 'slam-land', { fire });
        }
      }
    }

    for (const pad of (s.room.pads || [])) {
      pad.cool = Math.max(0, (pad.cool || 0) - dt);
      if (pad.cool === 0 && p.vy >= -20 && K.overlap(p, pad)) {
        pad.cool = .38;
        p.vy = -715; p.grounded = false; p.airJumps = 0; p.slam = false;
        p.squashX = 0.80; p.squashY = 1.24;
        K.effect(s, 'ring', pad.x + 18, pad.y + 12, { cyan: true });
        K.spawnSparks(s, pad.x + 18, pad.y + 8, 14, '#9bf5d8', 0, 220, 320);
        K.event(s, 'pad-jump');
      }
    }

    if (p.y > 590) {
      p.invuln = 0; p.rockSolid = 0; K.damage(s, 18, '坠入云渊');
      p.x = K.clamp(s.checkpoint - 35, 30, s.room.width - 100); p.y = 396; p.vy = 0; p.vx = 0; p.slam = false;
    }

    for (const h of s.room.hazards) {
      if ((p.pillarPerch || 0) <= 0 && K.overlap(p, h)) {
        if (K.has(s, 'vase') && (p.vaseCD || 0) <= 0) {
          p.vaseCD = 4.0; p.invuln = Math.max(p.invuln, .55); p.vy = -360;
          p.focus = Math.min(100, p.focus + 10);
          K.effect(s, 'notice', p.x, p.y - 12, { text: '净瓶护步 · 定力+10', color: '#95ebd2' });
          K.event(s, 'vase-step');
        } else {
          K.damage(s, 14, '黑莲地刺', -p.face);
        }
      }
    }

    for (const item of s.room.pickups) {
      if (!item.used && K.overlap(p, item)) {
        item.used = true;
        if (item.kind === 'heal') p.hp = Math.min(p.maxHp || 100, p.hp + 22);
        else p.focus = Math.min(100, p.focus + 30);
        if (K.has(s, 'vase')) p.ward = Math.min(p.maxWard || 26, (p.ward || 0) + (K.isAwakened(s, 'vase') ? 16 : 10));
        K.spawnSparks(s, item.x + 8, item.y + 10, 12, item.kind === 'heal' ? '#b8f09c' : '#8ce8eb', 0, 190, 320);
        K.event(s, 'pickup', { kind: item.kind });
        K.effect(s, 'notice', p.x, p.y - 5, { text: item.kind === 'heal' ? '生命 +22' : '定力 +30' });
      }
    }

    // Autonomous Multi-Monkey Squad AI!
    if (s.clone && (!s.clones || s.clones.length === 0)) s.clones = [s.clone];
    if (s.clones && s.clones.length > 0) {
      for (const c of s.clones) {
        c.life -= dt; c.timer -= dt;
        const foes = s.room.enemies.filter(e => e.hp > 0);
        const seals = s.room.seals.filter(q => q.hp > 0);
        const target = foes.sort((a, b) => Math.abs(a.x - c.x) - Math.abs(b.x - c.x))[0] || seals.sort((a, b) => Math.abs(a.x - c.x) - Math.abs(b.x - c.x))[0];
        if (target && Math.abs(target.x - c.x) > 44 && Math.abs(target.x - c.x) < 360) {
          c.face = Math.sign(target.x - c.x) || 1;
          c.x = K.clamp(c.x + c.face * 155 * dt, 16, s.room.width - 40);
        }
        if ((c.vy || 0) !== 0 || c.y < 396) {
          c.vy = Math.min((c.vy || 0) + 1200 * dt, 600);
          c.y += c.vy * dt;
          for (const pl of s.room.platforms) {
            if (c.vy >= 0 && c.y + c.h >= pl.y && c.y + c.h <= pl.y + 18 && c.x + c.w > pl.x && c.x < pl.x + pl.w) {
              c.y = pl.y - c.h; c.vy = 0;
            }
          }
          if (c.y > 396) { c.y = 396; c.vy = 0; }
        }
        if (c.timer <= 0) {
          c.timer = .52;
          if (target) c.face = Math.sign(target.x - c.x) || c.face;
          if (K.has(s, 'echo')) {
            const awake = K.isAwakened(s, 'echo');
            s.projectiles.push({ x: c.x + 12, y: c.y + 20, vx: c.face * 450, vy: 0, w: 22, h: 14, life: 1.7, friendly: true, damage: awake ? 24 : 18, hitSeals: awake });
          } else {
            K.strike(s, { x: c.face > 0 ? c.x : c.x - 65, y: c.y, w: 90, h: 48 }, 12, c.x, false, []);
          }
          K.effect(s, 'slash-arc', c.x + 12 + c.face * 24, c.y + 20, { face: c.face, style: 'pillar', radius: 42 });
          K.event(s, 'clone-strike');
        }
      }
      const hadClones = s.clones.length > 0;
      s.clones = s.clones.filter(c => c.life > 0);
      s.clone = s.clones[0] || null;
      if (hadClones && s.clones.length === 0 && K.has(s, 'mercy')) {
        p.focus = Math.min(100, p.focus + (K.isAwakened(s, 'mercy') ? 22 : 15));
      }
    }

    for (const shrine of (s.room.shrines || [])) {
      if (shrine.trial > 0) {
        shrine.trial = Math.max(0, shrine.trial - dt);
        const aliveSummons = s.room.enemies.some(e => e.summonedBy === shrine.id && e.hp > 0);
        if (!aliveSummons || shrine.trial === 0) {
          shrine.trial = 0;
          s.bellsCleared = (s.bellsCleared || 0) + 1;
          p.hp = Math.min(p.maxHp || 100, p.hp + 18);
          p.ward = Math.min(p.maxWard || 26, (p.ward || 0) + 18);
          K.spawnMotes(s, shrine.x + 24, shrine.y + 24, 24);
          K.effect(s, 'bell-wave', shrine.x + 24, shrine.y + 32);
          K.effect(s, 'notice', p.x, p.y - 16, { text: '钟鸣破妄 · 金身+18', color: '#ffe394', big: true });
          K.event(s, 'bell-clear');
        }
      }
    }

    for (const pillar of (s.room.pillars || [])) {
      pillar.timer -= dt;
      if (pillar.phase === 'warn' && pillar.timer <= 0) {
        pillar.phase = 'erupt'; pillar.timer = .38;
        K.spawnSparks(s, pillar.x, 430, 14, '#df84f5', 0, 260, 420);
        K.event(s, 'pillar-erupt', { x: pillar.x });
      } else if (pillar.phase === 'erupt') {
        const box = { x: pillar.x - 18, y: 120, w: 36, h: 320 };
        if (K.overlap(p, box)) {
          if (p.dash > 0 && p.perfectWindow > 0 && !p.perfectTriggered) K.triggerInsight(s);
          else K.damage(s, 16, '无天·灭世黑莲柱', Math.sign(p.x - pillar.x) || 1);
        }
      }
    }
    if (s.room.pillars) s.room.pillars = s.room.pillars.filter(pl => pl.timer > 0);

    for (const e of s.room.enemies) K.stepEnemy(s, e, dt, oldY);

    for (const b of s.projectiles) {
      b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.friendly) {
        for (const e of s.room.enemies) if (e.hp > 0 && K.overlap(b, e) && !(b.hit || []).includes(e.id)) {
          (b.hit ||= []).push(e.id);
          K.hitEnemy(s, e, b.damage || 18, b.x - b.vx, true, b.flameWave ? 'heavy' : 'light');
        }
        if (b.hitSeals || b.flameWave) {
          for (const seal of s.room.seals) if (seal.hp > 0 && K.overlap(b, seal) && !(b.hitS || []).includes(seal.id)) {
            (b.hitS ||= []).push(seal.id);
            seal.hp = Math.max(0, seal.hp - (b.damage || 16));
            K.effect(s, 'hit', seal.x + 14, seal.y + 10, { text: String(b.damage || 16), color: '#e3b3ed' });
            if (seal.hp === 0) {
              s.broken++; K.effect(s, 'ring', seal.x + 14, seal.y + 20); K.event(s, 'seal', { id: seal.id });
              if (K.has(s, 'mercy')) p.hp = Math.min(p.maxHp || 100, p.hp + 12);
            }
          }
        }
        for (const br of (s.room.breakables || [])) if (!br.broken && K.overlap(b, br)) {
          if (br.kind === 'firejar') K.detonateJar(s, br); else K.openChest(s, br);
        }
      } else if (K.overlap(b, p)) {
        if ((p.rockSolid || 0) > 0) {
          K.triggerInsight(s, true);
          b.friendly = true; b.vx *= -1.35; b.vy *= -1; b.damage = 28; b.life = 2;
        } else {
          if (p.dash > 0 && p.perfectWindow > 0 && !p.perfectTriggered) K.triggerInsight(s);
          if (p.dash > 0 && K.has(s, 'mirror')) {
            const awake = K.isAwakened(s, 'mirror');
            b.friendly = true; b.vx *= -1.25; b.vy *= -1; b.damage = awake ? 34 : 24; b.life = 2;
            if (K.hasSynergy(s, 'mirror_mercy')) { p.hp = Math.min(p.maxHp || 100, p.hp + 6); p.focus = Math.min(100, p.focus + 12); }
            if (awake) K.strike(s, { x: p.x - 55, y: p.y - 6, w: 134, h: 56 }, 16, p.x + 12, true, [], 'heavy');
            K.event(s, 'reflect');
          } else if (p.invuln <= 0 && (p.pillarPerch || 0) <= 0) {
            K.damage(s, 12, '莲焰飞弹', Math.sign(b.vx));
            b.life = 0;
          }
        }
      }
    }
    s.projectiles = s.projectiles.filter(b => b.life > 0 && b.x > -100 && b.x < s.room.width + 100);

    for (const q of s.room.seals) if (q.hp > 0 && Math.abs(q.x - p.x) < 420) {
      q.pulse = (q.pulse ?? 2.2) - dt; q.warning = q.pulse < .65;
      if (q.pulse <= 0) {
        q.pulse = 3.4; q.warning = false;
        for (const face of [-1, 1]) s.projectiles.push({ x: q.x + 14, y: q.y + 25, vx: face * 175, vy: 0, w: 12, h: 12, life: 2.5, friendly: false });
        K.event(s, 'seal-burst', { id: q.id });
      }
    }

    for (let i = 0; i < s.room.signs.length; i++) {
      if (Math.abs(s.room.signs[i].x - p.x) < 65 && !s.hints.includes(s.stage + ':' + i)) {
        s.hints.push(s.stage + ':' + i);
        K.event(s, 'hint', { text: s.room.signs[i].text });
      }
    }

    if (a.interactPressed && s.mode === 'playing' && s.stage < 3) {
      const shrine = (s.room.shrines || []).find(sh => (!sh.used || sh.kind === 'forge') && Math.abs((sh.x + 26) - (p.x + 12)) < 78 && Math.abs(sh.bottom - (p.y + p.h)) < 48);
      if (shrine) {
        if (shrine.kind === 'forge') {
          s.mode = 'forge';
          K.event(s, 'forge-open');
        } else {
          shrine.used = true;
          if (shrine.kind === 'bell') {
            shrine.trial = 6.5;
            p.focus = Math.min(100, p.focus + 25);
            K.gainStance(s, 100);
            K.effect(s, 'bell-wave', shrine.x + 24, shrine.y + 28);
            const nextId = s.room.enemies.length + 10;
            const e1 = K.enemy('spear', K.clamp(shrine.x - 130, 80, s.room.width - 120), shrine.bottom - 42, nextId, s.stage);
            const e2 = K.enemy('blade', K.clamp(shrine.x + 135, 80, s.room.width - 120), shrine.bottom - 40, nextId + 1, s.stage);
            e1.summonedBy = shrine.id; e2.summonedBy = shrine.id;
            s.room.enemies.push(e1, e2);
            K.event(s, 'bell-ring', { id: shrine.id, cutin: '古钟鸣劫' });
          } else if (shrine.kind === 'mirror') {
            const nextId = s.room.enemies.length + 20;
            const mac = K.enemy('macaque', K.clamp(shrine.x + 115, 120, s.room.width - 140), shrine.bottom - 46, nextId, s.stage);
            s.room.enemies.push(mac);
            s.shake = .2; s.zoomPunch = .1;
            K.spawnSparks(s, shrine.x + 26, shrine.bottom - 42, 24, '#d075f5', 0, 320, 400);
            K.effect(s, 'insight-ring', shrine.x + 26, shrine.bottom - 42);
            K.event(s, 'mirror-break', { cutin: '心魔·六耳现世' });
          } else {
            s.upgradedRelics ||= [];
            const targetRelic = s.relics.find(id => !s.upgradedRelics.includes(id));
            if (targetRelic) s.upgradedRelics.push(targetRelic);
            p.stance = p.maxStance || 3; p.stanceMeter = 0;
            p.hp = Math.min(p.maxHp || 100, p.hp + 14);
            K.spawnMotes(s, shrine.x + 24, shrine.bottom - 40, 15);
            K.effect(s, 'insight-ring', shrine.x + 24, shrine.y + 28, { gold: true });
            K.event(s, 'stele-awake', { relic: targetRelic || null, cutin: '残碑悟道' });
          }
        }
      } else if (s.room.seals[0].hp === 0 && !s.room.midClaimed && Math.abs(p.x - s.room.seals[0].x) < 85) {
        s.rewardKind = 'mid'; s.reward = K.options(s); s.mode = 'reward';
        K.event(s, 'reward', { kind: 'mid' });
      } else if (Math.abs(p.x - s.room.exit) < 85) {
        if (s.room.seals.some(q => q.hp > 0)) K.event(s, 'gate-locked');
        else { s.mode = 'reward'; s.rewardKind = 'exit'; s.reward = K.options(s); K.event(s, 'reward', { kind: 'exit' }); }
      }
    }
  };

  K.stepEnemy = function (s, e, dt, oldY) {
    if (e.hp <= 0 || s.mode !== 'playing') return;
    const p = s.player;
    e.flash = Math.max(0, e.flash - dt);
    e.stun = Math.max(0, e.stun - dt);
    e.interruptLock = Math.max(0, (e.interruptLock || 0) - dt);
    e.hitTilt = (e.hitTilt || 0) * Math.exp(-dt * 14);

    if ((e.frozen || 0) > 0) {
      e.frozen = Math.max(0, e.frozen - dt);
      if (e.frozen === 0 && (e.freezeHits || 0) > 0) {
        e.freezeHits = 0;
        s.shatterCount = (s.shatterCount || 0) + 1;
        K.effect(s, 'insight-ring', e.x + e.w / 2, e.y + e.h / 2, { gold: true });
        K.hitEnemy(s, e, 22, p.x + 12, true, 'shatter');
      }
      return;
    }

    if (e.kind === 'caster') e.y = e.baseY + Math.sin(s.time * 2 + e.id) * 4;
    const activeClone = (s.clones && s.clones[0]) || s.clone;
    const target = activeClone && Math.abs(activeClone.x - e.x) < 380 ? activeClone : p;
    const dx = target.x - e.x;
    const near = Math.abs(dx);
    e.timer = Math.max(-1, e.timer - dt);
    if (e.stun > 0 && e.phase === 'idle') return;

    if (e.kind === 'boss') {
      if (e.hp <= 180 && !e.phase2) {
        e.phase2 = true; s.shake = .22; s.zoomPunch = .09;
        K.effect(s, 'ring', e.x + 24, e.y + 36, { fire: true });
        K.event(s, 'boss-phase', { phase: 2, cutin: '魔罗黑莲' });
      }
      if (e.hp <= 130 && !e.archForm) {
        e.archForm = true; e.phase3 = true;
        s.shake = .28; s.zoomPunch = .12; s.flashAlpha = .26;
        K.spawnSparks(s, e.x + 24, e.y + 32, 30, '#e396ff', 0, 380, 340);
        K.effect(s, 'insight-ring', e.x + 24, e.y + 36);
        K.event(s, 'boss-phase', { phase: 3, cutin: '无天·灭世元神法相' });
      }

      if (e.phase === 'idle' && e.timer <= 0) {
        e.attacks++;
        const mod = e.archForm ? e.attacks % 4 : e.hp <= 180 ? e.attacks % 3 : e.attacks % 2;
        e.phase = mod === 1 ? 'sweep-windup' : mod === 2 ? 'pillar-windup' : mod === 3 ? 'beam-windup' : 'orb-windup';
        e.timer = e.archForm ? .62 : e.hp < 180 ? .7 : .9;
        e.face = Math.sign(target.x - e.x) || -1;
        if (e.phase === 'pillar-windup') {
          s.room.pillars ||= [];
          const spots = [K.clamp(target.x + 12, 160, 800), 320, 640];
          for (const px of spots) s.room.pillars.push({ x: px, phase: 'warn', timer: .78 });
        }
        K.event(s, 'boss-warning', { attack: e.phase, x: e.x, y: e.y, face: e.face });
      } else if (['sweep-windup', 'orb-windup', 'pillar-windup', 'beam-windup'].includes(e.phase) && e.timer <= 0) {
        if (e.phase === 'sweep-windup') {
          e.phase = 'sweep'; e.timer = .34; e.struck = false;
          K.effect(s, 'slash-arc', e.x + 24 + e.face * 75, 412, { face: e.face, style: 'boss', radius: 110 });
          K.event(s, 'enemy-attack', { id: e.id, kind: e.kind, box: K.enemyAttackBox(e) });
        } else if (e.phase === 'beam-windup') {
          e.phase = 'beam'; e.timer = .42;
          s.shake = .18;
          K.event(s, 'boss-beam', { face: e.face });
        } else if (e.phase === 'pillar-windup') {
          e.phase = 'recover'; e.timer = 1.25;
        } else {
          const n = e.hp < 135 ? 5 : 3;
          for (let i = 0; i < n; i++) {
            const vy = (i - (n - 1) / 2) * 72;
            s.projectiles.push({ x: e.x + 12, y: e.y + 22, vx: e.face * 240, vy, w: 15, h: 15, life: 4, friendly: false });
          }
          e.phase = 'recover'; e.timer = 1.3;
        }
      } else if (e.phase === 'sweep') {
        const hit = K.enemyAttackBox(e);
        if (K.overlap(p, hit)) {
          if (p.dash > 0 && p.perfectWindow > 0 && !p.perfectTriggered) K.triggerInsight(s);
          else K.damage(s, 18, '无天·黑莲横扫', e.face, e);
        }
        if (e.timer <= 0) { e.phase = 'recover'; e.timer = 1.2; }
      } else if (e.phase === 'beam') {
        const beamBox = { x: e.face > 0 ? e.x + 36 : e.x - 520, y: 382, w: 520, h: 48 };
        if (K.overlap(p, beamBox)) {
          if (p.dash > 0 && p.perfectWindow > 0 && !p.perfectTriggered) K.triggerInsight(s);
          else K.damage(s, 20, '无天·灭世紫电洪流', e.face, e);
        }
        if (e.timer <= 0) { e.phase = 'recover'; e.timer = 1.35; }
      } else if (e.phase === 'recover' && e.timer <= 0) {
        e.shiftTo = e.x > 500 ? 260 : 710; e.phase = 'shift-windup'; e.timer = .55;
        K.event(s, 'boss-shift-warning', { from: e.x, to: e.shiftTo });
      } else if (e.phase === 'shift-windup' && e.timer <= 0) {
        e.phase = 'shift'; e.timer = .8; e.face = Math.sign(e.shiftTo - e.x);
        K.event(s, 'boss-shift', { from: e.x, to: e.shiftTo });
      } else if (e.phase === 'shift') {
        e.x += Math.sign(e.shiftTo - e.x) * 650 * dt;
        if (Math.abs(e.x - e.shiftTo) < 8 || e.timer <= 0) { e.x = e.shiftTo; e.phase = 'idle'; e.timer = .4; }
      }
    } else if (e.kind === 'caster') {
      if (e.phase === 'idle' && near < 600 && e.timer <= 0) {
        e.phase = 'windup'; e.timer = .75; e.face = Math.sign(dx) || 1;
        e.aimX = target.x + 12; e.aimY = target.y + 18;
        K.event(s, 'warning', { kind: e.kind, id: e.id, aimX: e.aimX, aimY: e.aimY });
      } else if (e.phase === 'windup' && e.timer <= 0) {
        const tx = (e.aimX ?? target.x + 12) - e.x, ty = (e.aimY ?? target.y + 18) - (e.y + 16), len = Math.hypot(tx, ty) || 1;
        s.projectiles.push({ x: e.x, y: e.y + 16, vx: tx / len * 220, vy: ty / len * 220, w: 12, h: 12, life: 3, friendly: false });
        e.phase = 'idle'; e.timer = 1.8;
      }
    } else {
      const triggerRange = e.kind === 'macaque' ? 135 : e.kind === 'spear' ? 128 : e.kind === 'warden' ? 105 : 84;
      if (e.phase === 'idle') {
        if (near < triggerRange && Math.abs(target.y - e.y) < 72 && e.timer <= 0) {
          e.face = Math.sign(dx) || e.face;
          e.phase = 'windup';
          e.timer = e.kind === 'warden' ? .76 : e.kind === 'shield' ? .7 : e.kind === 'macaque' ? .46 : e.kind === 'spear' ? .56 : .52;
          K.event(s, 'warning', { kind: e.kind, id: e.id, x: e.x, y: e.y, face: e.face });
        } else if (near > 45 && near < 380) {
          if (e.kind !== 'shield' || e.timer <= 0) { e.face = Math.sign(dx); if (e.kind === 'shield') e.timer = .6; }
          const bounds = K.patrolBounds(s, e);
          const spd = e.kind === 'shield' ? 28 : e.kind === 'warden' ? 38 : e.kind === 'macaque' ? 118 : e.kind === 'spear' ? 66 : 53;
          e.x = K.clamp(e.x + e.face * spd * dt, bounds.min, bounds.max);
        }
      } else if (e.phase === 'windup' && e.timer <= 0) {
        e.phase = 'attack';
        e.timer = e.kind === 'macaque' ? .24 : e.kind === 'spear' ? .22 : e.kind === 'warden' ? .24 : .18;
        if (e.kind === 'macaque' || e.kind === 'warden' || e.kind === 'blade') {
          K.effect(s, 'slash-arc', e.x + e.w / 2 + e.face * 32, e.y + 22, { face: e.face, style: 'boss', radius: e.kind === 'warden' ? 68 : 48 });
        }
        K.event(s, 'enemy-attack', { kind: e.kind, id: e.id, box: K.enemyAttackBox(e) });
      } else if (e.phase === 'attack') {
        if (e.kind === 'spear' || e.kind === 'macaque') {
          const bounds = K.patrolBounds(s, e);
          e.x = K.clamp(e.x + e.face * (e.kind === 'macaque' ? 390 : 340) * dt, bounds.min, bounds.max);
        }
        const box = K.enemyAttackBox(e);
        if (K.overlap(box, p)) {
          if (p.dash > 0 && p.perfectWindow > 0 && !p.perfectTriggered) K.triggerInsight(s);
          else K.damage(s, e.kind === 'warden' ? 20 : e.kind === 'macaque' ? 17 : e.kind === 'shield' ? 16 : e.kind === 'spear' ? 14 : 12,
            e.kind === 'warden' ? '守阵魔将·断岳斩' : e.kind === 'macaque' ? '六耳猕猴·随心乱棒' : e.kind === 'shield' ? '重盾兵·盾撞' : e.kind === 'spear' ? '黑莲夜叉·疾刺' : '执刃魔兵·斩击', e.face, e);
        }
        if (e.timer <= 0) { e.phase = 'recover'; e.timer = e.kind === 'warden' ? 1.05 : e.kind === 'macaque' ? .72 : .9; }
      } else if (e.phase === 'recover' && e.timer <= 0) {
        e.phase = 'idle'; e.timer = .2;
      }
    }

    if (p.vy > 70 && oldY + p.h <= e.y + 12 && K.overlap(p, e)) {
      K.hitEnemy(s, e, p.slam ? 30 : 19, p.x, true, 'heavy');
      if (K.has(s, 'cloud') && K.isAwakened(s, 'cloud')) {
        K.strike(s, { x: p.x - 65, y: p.y, w: 154, h: 64 }, 16, p.x + 12, true, ['e' + e.id], 'light');
        K.effect(s, 'ring', p.x + 12, e.y, { cyan: true });
      }
      p.vy = -390; p.y = e.y - p.h; p.airJumps = 0; p.slam = false;
      p.squashX = 0.86; p.squashY = 1.18;
      K.event(s, 'stomp', { kind: e.kind });
    } else if (e.kind !== 'caster' && p.dash <= 0 && (p.pillarPerch || 0) <= 0 && K.overlap(p, e)) {
      if (e.kind === 'boss' && e.phase === 'shift') K.damage(s, 15, '无天·移形冲击', e.face, e);
      else { p.x = p.x + 12 < e.x + e.w / 2 ? e.x - p.w - 1 : e.x + e.w + 1; p.vx = 0; }
    }
  };

  K.enemyAttackBox = function (e) {
    if (e.kind === 'boss') return { x: e.face > 0 ? e.x + 12 : e.x - 200, y: 410, w: 240, h: 30 };
    if (e.kind === 'warden') return { x: e.face > 0 ? e.x + 12 : e.x - 68, y: e.y + 4, w: 90, h: 46 };
    if (e.kind === 'macaque') return { x: e.face > 0 ? e.x + 10 : e.x - 66, y: e.y + 4, w: 86, h: 38 };
    if (e.kind === 'spear') return { x: e.face > 0 ? e.x + 12 : e.x - 62, y: e.y + 8, w: 78, h: 28 };
    return { x: e.face > 0 ? e.x + 14 : e.x - 46, y: e.y + 6, w: 60, h: 32 };
  };

  K.patrolBounds = function (s, e) {
    const span = e.kind === 'macaque' ? 220 : 110;
    const p = s.room.platforms.find(p => Math.abs(p.y - e.baseY - e.h) < 6 && e.origin >= p.x && e.origin < p.x + p.w);
    return p ? { min: Math.max(e.origin - span, p.x), max: Math.min(e.origin + span, p.x + p.w - e.w) } : { min: e.origin - span, max: e.origin + span };
  };

  K.choose = function (s, id, replace) {
    if (s.mode !== 'reward' || !s.reward.includes(id)) return false;
    const cap = s.maxRelics || 3;
    if (id === 'rest') {
      s.player.hp = Math.min(s.player.maxHp || 100, s.player.hp + 30);
      s.player.focus = Math.min(100, s.player.focus + 35);
      s.essence = (s.essence || 0) + 18;
      if (K.has(s, 'vase')) s.player.ward = Math.min(s.player.maxWard || 26, (s.player.ward || 0) + (K.isAwakened(s, 'vase') ? 26 : 16));
      if ((s.player.stance || 0) < (s.player.maxStance || 3)) s.player.stance = (s.player.stance || 0) + 1;
      s.stats.rests++;
    } else if (s.relics.length >= cap) {
      if (!s.relics.includes(replace)) { s.pendingRelic = id; return 'replace'; }
      s.relics[s.relics.indexOf(replace)] = id;
      if (Array.isArray(s.upgradedRelics)) s.upgradedRelics = s.upgradedRelics.filter(x => x !== replace);
      if (id === 'vase') s.player.ward = Math.min(s.player.maxWard || 26, (s.player.ward || 0) + 16);
      K.event(s, 'relic', { id, replace });
    } else {
      s.relics.push(id);
      if (id === 'vase') s.player.ward = Math.min(s.player.maxWard || 26, (s.player.ward || 0) + 16);
      K.event(s, 'relic', { id });
    }
    if (s.rewardKind === 'mid') {
      s.room.midClaimed = true; s.mode = 'playing'; s.reward = []; s.pendingRelic = null;
      s.player.invuln = Math.max(s.player.invuln, .5);
    } else {
      K.enterRoom(s, s.stage + 1, false);
    }
    return true;
  };
})(globalThis.Kong ||= {});
