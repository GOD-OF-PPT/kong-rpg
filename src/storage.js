(function (K) {
  'use strict';
  const KEY = 'kong.black-lotus.v2', LEGACY = 'kong.black-lotus.v1', SETTINGS = 'kong.black-lotus.settings.v2';
  const number = (v, a, b) => typeof v === 'number' && Number.isFinite(v) && v >= a && v <= b;
  const fail = () => { throw new Error('存档数据不完整或已损坏，请保留原文件。'); };
  const count = v => Number.isFinite(Number(v)) ? Math.max(0, Math.min(1e7, Math.floor(Number(v)))) : 0;

  K.cleanMeta = function (m) {
    const validSeals = Array.isArray(m?.seals) ? m.seals.filter(id => K.SEALS_CODEX?.some(x => x.id === id)) : [];
    const seenRelics = Array.isArray(m?.seenRelics) ? m.seenRelics.filter(id => K.RELICS.some(r => r.id === id)) : [];
    return {
      runs: count(m?.runs),
      wins: count(m?.wins),
      best: Math.min(4, count(m?.best)),
      seals: [...new Set(validSeals)],
      seenRelics: [...new Set(seenRelics)],
      history: Array.isArray(m?.history) ? m.history.filter(x => x && typeof x.id === 'string' && typeof x.seed === 'string').slice(-8).map(x => ({
        id: x.id.slice(0, 100),
        seed: x.seed.slice(0, 32),
        won: !!x.won,
        stage: Math.min(3, count(x.stage)),
        seconds: count(x.seconds),
        damage: count(x.damage),
        grade: typeof x.grade === 'string' ? x.grade.slice(0, 4) : '',
        relics: Array.isArray(x.relics) ? x.relics.filter(id => K.RELICS.some(r => r.id === id)).slice(0, 4) : []
      })) : []
    };
  };

  K.evaluateSeals = function (s, meta) {
    if (!s || !meta) return [];
    meta.seals ||= [];
    meta.seenRelics ||= [];
    for (const id of (s.relics || [])) if (!meta.seenRelics.includes(id)) meta.seenRelics.push(id);
    const newly = [];
    const unlock = id => { if (!meta.seals.includes(id)) { meta.seals.push(id); newly.push(id); } };
    if (s.kills >= 1) unlock('first_blood');
    if ((s.insights || 0) >= 3) unlock('insight_master');
    if (s.log?.some(e => e.type === 'pillar-cast' && e.power >= 3)) unlock('pillar_breaker');
    if ((s.flowStrikes || 0) >= 3) unlock('stance_dancer');
    if ((s.shatterCount || 0) >= 1) unlock('immobilize_sage');
    if (s.macaqueSlain) unlock('macaque_slayer');
    if ((s.bellsCleared || 0) >= 1) unlock('bell_ringer');
    if ((s.upgradedRelics || []).length >= 1) unlock('stele_sage');
    if (K.activeSynergies(s.relics).filter(x => !x.reqCount).length >= 2) unlock('synergy_weaver');
    if ((s.wardensSlain || 0) >= 1) unlock('warden_slayer');
    if ((s.maxCombo || 0) >= 15) unlock('combo_king');
    if (s.mode === 'won') {
      unlock('lotus_conqueror');
      if (s.damageTaken <= 45) unlock('flawless_sage');
    }
    return newly;
  };

  K.validSave = function (data) {
    if (data?.game === 'black-lotus' && [1, 2].includes(data.schema) && data.state?.version === 1) {
      const error = new Error('这是v1旅程，请在保留的原版中继续。');
      error.legacy = true;
      throw error;
    }
    if (!data || data.schema !== 2 || data.game !== 'black-lotus' || !data.state) throw new Error('这不是劫后行v2存档。');
    const s = data.state;
    const maxSlots = s.maxRelics === 4 ? 4 : 3;
    if (s.version !== 2 || s.rules !== 2 || !Number.isInteger(s.stage) || s.stage < 0 || s.stage > 3 || typeof s.seed !== 'string' || s.seed.length > 32 || !['playing', 'paused', 'reward', 'forge', 'dead', 'won'].includes(s.mode)) fail();
    if (!Array.isArray(s.relics) || s.relics.length > maxSlots || new Set(s.relics).size !== s.relics.length || s.relics.some(id => !K.RELICS.some(r => r.id === id))) fail();
    const canonical = K.makeRoom(s.seed, s.stage), p = s.player;
    const maxHpCap = number(p?.maxHp, 100, 200) ? p.maxHp : 100;
    if (!p || !number(p.hp, 0, maxHpCap) || !number(p.focus, 0, 100) || !number(p.x, 0, canonical.width) || !number(p.y, -1000, 1000) || !number(p.vx, -2000, 2000) || !number(p.vy, -2000, 2000) || ![-1, 1].includes(p.face)) fail();
    for (const key of ['coyote', 'buffer', 'invuln', 'dash', 'dashCD', 'attack', 'landing', 'drop', 'hurt', 'attackBuffer']) if (!number(p[key], 0, 5)) fail();
    if (typeof p.grounded !== 'boolean' || typeof p.slam !== 'boolean' || !Number.isInteger(p.airJumps) || p.airJumps < 0 || p.airJumps > 1 || !Number.isInteger(p.comboIndex) || p.comboIndex < 0 || p.comboIndex > 3 || !number(p.attackId, 0, 1e7) || !Array.isArray(p.attackTargets) || p.attackTargets.length > 40 || p.attackTargets.some(x => typeof x !== 'string') || (p.attack > 0 && !number(p.attackDuration, .1, 1))) fail();
    for (const key of ['time', 'elapsed', 'roomTime', 'kills', 'broken', 'damageTaken', 'hitstop', 'shake', 'checkpoint', 'combo', 'comboTime', 'serial']) if (!number(s[key], 0, 1e8)) fail();
    if (s.broken > 6 || s.checkpoint > canonical.width || s.combo > 3 || typeof s.lastDamage !== 'string' || s.lastDamage.length > 100 || !Array.isArray(s.hints) || s.hints.length > 30 || s.hints.some(x => typeof x !== 'string' || x.length > 50)) fail();
    if (!s.room || !Array.isArray(s.room.enemies) || s.room.enemies.length < canonical.enemies.length || s.room.enemies.length > canonical.enemies.length + 8 || !Array.isArray(s.room.seals) || s.room.seals.length !== canonical.seals.length || !Array.isArray(s.room.pickups) || s.room.pickups.length !== canonical.pickups.length || typeof s.room.midClaimed !== 'boolean') fail();

    const phases = ['idle', 'windup', 'attack', 'recover', 'sweep-windup', 'orb-windup', 'pillar-windup', 'beam-windup', 'beam', 'sweep', 'shift-windup', 'shift'];
    canonical.enemies.forEach((e, i) => {
      const x = s.room.enemies[i];
      if (!x || x.id !== e.id || x.kind !== e.kind || !number(x.hp, 0, e.maxHp) || !number(x.x, 0, canonical.width) || !number(x.y, -200, 540) || !number(x.timer, -2, 10) || !number(x.stun, 0, 3) || !number(x.flash, 0, 2) || !number(x.interruptLock, 0, 2) || !number(x.attacks, 0, 1e7) || ![-1, 1].includes(x.face) || !phases.includes(x.phase)) fail();
      for (const key of ['hp', 'x', 'y', 'timer', 'stun', 'frozen', 'freezeHits', 'flash', 'interruptLock', 'attacks', 'face', 'phase', 'struck', 'phase2', 'phase3', 'archForm']) if (x[key] !== undefined) e[key] = x[key];
      if (x.shiftTo !== undefined) { if (!number(x.shiftTo, 0, 960)) fail(); e.shiftTo = x.shiftTo; }
      if (x.aimX !== undefined) { if (!number(x.aimX, -200, canonical.width + 200) || !number(x.aimY, -1000, 1000)) fail(); e.aimX = x.aimX; e.aimY = x.aimY; }
    });
    for (let i = canonical.enemies.length; i < s.room.enemies.length; i++) {
      const x = s.room.enemies[i];
      if (!x || !['blade', 'spear', 'macaque'].includes(x.kind) || !number(x.hp, 0, 160) || !number(x.x, 0, canonical.width) || !phases.includes(x.phase)) fail();
      const extra = K.enemy(x.kind, x.x, x.y, x.id, s.stage);
      for (const key of ['hp', 'x', 'y', 'timer', 'stun', 'frozen', 'freezeHits', 'flash', 'interruptLock', 'attacks', 'face', 'phase']) if (x[key] !== undefined) extra[key] = x[key];
      extra.summonedBy = x.summonedBy;
      canonical.enemies.push(extra);
    }

    canonical.seals.forEach((q, i) => {
      const x = s.room.seals[i];
      if (!x || !number(x.hp, 0, 56) || !number(x.pulse, 0, 4) || typeof x.warning !== 'boolean') fail();
      q.hp = x.hp; q.pulse = x.pulse; q.warning = x.warning;
    });
    canonical.pickups.forEach((q, i) => q.used = !!s.room.pickups[i].used);
    if (Array.isArray(s.room.shrines)) {
      canonical.shrines.forEach((sh, i) => {
        if (s.room.shrines[i]) { sh.used = !!s.room.shrines[i].used; sh.trial = number(s.room.shrines[i].trial, 0, 10) ? s.room.shrines[i].trial : 0; }
      });
    }
    if (Array.isArray(s.room.breakables)) {
      canonical.breakables.forEach((br, i) => {
        if (s.room.breakables[i]) { br.broken = !!s.room.breakables[i].broken; br.hp = br.broken ? 0 : 1; }
      });
    }
    canonical.midClaimed = s.room.midClaimed;

    if (!Array.isArray(s.projectiles) || s.projectiles.length > 100) fail();
    const projectiles = s.projectiles.map(b => {
      for (const [key, min, max] of [['x', -200, canonical.width + 200], ['y', -2000, 2000], ['vx', -2000, 2000], ['vy', -2000, 2000], ['life', 0, 10], ['w', 1, 100], ['h', 1, 100]]) if (!number(b[key], min, max)) fail();
      if (typeof b.friendly !== 'boolean' || (b.damage !== undefined && !number(b.damage, 1, 100)) || (b.hit !== undefined && (!Array.isArray(b.hit) || b.hit.length > 100 || b.hit.some(x => !Number.isInteger(x))))) fail();
      return { x: b.x, y: b.y, vx: b.vx, vy: b.vy, life: b.life, w: b.w, h: b.h, friendly: b.friendly, damage: b.damage, hit: b.hit, hitSeals: !!b.hitSeals, flameWave: !!b.flameWave };
    });

    let clone = null;
    if (s.clone) {
      const c = s.clone;
      if (!number(c.x, 0, canonical.width) || !number(c.y, -1000, 1000) || !number(c.life, 0, 4) || !number(c.timer, -1, 1) || ![-1, 1].includes(c.face)) fail();
      clone = { x: c.x, y: c.y, w: 24, h: 44, life: c.life, timer: c.timer, face: c.face };
    }
    const clones = Array.isArray(s.clones) ? s.clones.slice(0, 4).filter(c => c && number(c.x, 0, canonical.width) && number(c.life, 0, 5)).map(c => ({ x: c.x, y: c.y || 396, vx: c.vx || 0, vy: c.vy || 0, w: 24, h: 44, life: c.life, timer: c.timer || .2, face: c.face === -1 ? -1 : 1 })) : (clone ? [clone] : []);

    if (!['mid', 'exit'].includes(s.rewardKind) || !Array.isArray(s.reward) || s.reward.length > 3 || s.reward.some(id => !K.relic(id) || (id !== 'rest' && s.relics.includes(id))) || (s.mode === 'reward' && s.reward.length !== 3) || (s.pendingRelic !== null && !s.reward.includes(s.pendingRelic))) fail();
    if ((s.mode === 'dead' && p.hp !== 0) || (p.hp === 0 && s.mode !== 'dead') || (s.mode === 'won' && (s.stage !== 3 || canonical.enemies[0].hp !== 0))) fail();

    const restored = K.newRun(s.seed, null);
    K.enterRoom(restored, s.stage, true);
    for (const key of ['time', 'elapsed', 'roomTime', 'kills', 'broken', 'damageTaken', 'lastDamage', 'hitstop', 'shake', 'checkpoint', 'combo', 'comboTime', 'serial', 'rewardKind', 'pendingRelic']) restored[key] = s[key];
    for (const optKey of ['hitCombo', 'hitComboTime', 'maxCombo', 'insights', 'bellsCleared', 'wardensSlain', 'essence', 'flowStrikes', 'shatterCount']) if (number(s[optKey], 0, 1e7)) restored[optKey] = s[optKey];
    restored.macaqueSlain = !!s.macaqueSlain;
    restored.maxRelics = maxSlots;
    restored.stanceStyle = ['smash', 'pillar', 'thrust'].includes(s.stanceStyle) ? s.stanceStyle : 'smash';
    restored.forgeBuys = Array.isArray(s.forgeBuys) ? s.forgeBuys.filter(x => typeof x === 'string').slice(0, 12) : [];
    restored.upgradedRelics = Array.isArray(s.upgradedRelics) ? s.upgradedRelics.filter(id => s.relics.includes(id)) : [];
    restored.player = {
      ...restored.player,
      ...p,
      w: 24, h: 44,
      maxHp: maxHpCap,
      ward: number(p.ward, 0, 80) ? p.ward : 0,
      maxWard: number(p.maxWard, 10, 80) ? p.maxWard : 26,
      stance: Number.isInteger(p.stance) && p.stance >= 0 && p.stance <= 4 ? p.stance : 0,
      maxStance: 3,
      stanceMeter: number(p.stanceMeter, 0, 100) ? p.stanceMeter : 0,
      perfectWindow: number(p.perfectWindow, 0, 1) ? p.perfectWindow : 0,
      perfectTriggered: !!p.perfectTriggered,
      riposte: number(p.riposte, 0, 5) ? p.riposte : 0,
      pillar: number(p.pillar, 0, 1.5) ? p.pillar : 0,
      pillarPower: Number.isInteger(p.pillarPower) ? p.pillarPower : 0,
      pillarStruck: !!p.pillarStruck,
      rockSolid: number(p.rockSolid, 0, 1) ? p.rockSolid : 0,
      rockCD: number(p.rockCD, 0, 10) ? p.rockCD : 0,
      immobCD: number(p.immobCD, 0, 10) ? p.immobCD : 0,
      switchCD: number(p.switchCD, 0, 3) ? p.switchCD : 0,
      vaseCD: number(p.vaseCD, 0, 10) ? p.vaseCD : 0
    };
    restored.room = canonical;
    restored.relics = s.relics.slice();
    restored.reward = s.reward.slice();
    restored.clones = clones;
    restored.clone = clone || clones[0] || null;
    restored.projectiles = projectiles;
    restored.hints = s.hints.slice();
    restored.mode = (s.mode === 'playing' || s.mode === 'forge') ? 'paused' : s.mode;
    restored.runId = typeof s.runId === 'string' ? s.runId.slice(0, 100) : s.seed + ':imported';
    if (!s.stats || typeof s.stats !== 'object') fail();
    for (const key of ['swings', 'hits', 'blocks', 'jumps', 'dashes', 'clones', 'focusSpent', 'rests']) {
      if (!number(s.stats[key], 0, 1e7)) fail();
      restored.stats[key] = s.stats[key];
    }
    for (const optStat of ['pillars', 'insights']) restored.stats[optStat] = number(s.stats[optStat], 0, 1e7) ? s.stats[optStat] : 0;
    return { state: restored, meta: K.cleanMeta(data.meta) };
  };

  K.pack = (state, meta) => JSON.stringify({ game: 'black-lotus', schema: 2, build: K.VERSION, state, meta: K.cleanMeta(meta) });
  K.download = function (raw, name) {
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  K.Storage = class {
    constructor() {
      this.available = true; this.error = ''; this.legacy = null;
      try {
        const raw = localStorage.getItem(LEGACY);
        if (raw && raw.length < 1000000) {
          const x = JSON.parse(raw);
          if (x.game === 'black-lotus' && x.state?.version === 1 && [1, 2].includes(x.schema)) this.legacy = x;
        }
      } catch { this.available = false; }
    }
    read() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        if (raw.length > 1000000) fail();
        return K.validSave(JSON.parse(raw));
      } catch (e) { this.error = e.message; return null; }
    }
    write(state, meta) {
      try { localStorage.setItem(KEY, K.pack(state, meta)); this.available = true; return true; }
      catch { this.available = false; return false; }
    }
    export(state, meta) { K.download(K.pack(state, meta), '劫后行-v4-' + state.seed + '.json'); }
    import(raw) {
      if (raw.length > 1000000) throw new Error('存档文件过大。');
      return K.validSave(JSON.parse(raw));
    }
    readSettings() {
      try {
        const x = JSON.parse(localStorage.getItem(SETTINGS) || '{}');
        return {
          volume: number(x.volume, 0, 1) ? x.volume : .38,
          muted: !!x.muted,
          touch: typeof x.touch === 'boolean' ? x.touch : ('ontouchstart' in window && innerWidth < 1024),
          shake: typeof x.shake === 'boolean' ? x.shake : !matchMedia('(prefers-reduced-motion: reduce)').matches
        };
      } catch {
        return { volume: .38, muted: false, touch: false, shake: false };
      }
    }
    settings(value) { try { localStorage.setItem(SETTINGS, JSON.stringify(value)); } catch {} }
  };
})(globalThis.Kong ||= {});
