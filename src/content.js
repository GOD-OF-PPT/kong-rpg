(function (K) {
  'use strict';
  K.VERSION = '1.1.0';
  K.W = 960; K.H = 540; K.DT = 1 / 120;
  K.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  K.overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  K.rng = function (seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  K.seedNumber = function (s) { let n = 2166136261; for (const c of String(s)) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; };
  K.RELICS = [
    { id: 'cloud', glyph: '云', name: '腾云骨', tag: '空中路线', text: '多一次空中跳。踩敌后恢复空中跳；空中棍击更远。', cost: '跳得更高，也会进入莲灯使的弹道。', color: '#82d9d2' },
    { id: 'echo', glyph: '影', name: '照影珠', tag: '驻留诱敌', text: '分身驻留 3 秒，向目标发出穿透棍风。', cost: '分身消耗由 40 增为 50 定力。', color: '#bd9cdb' },
    { id: 'staff', glyph: '棍', name: '定海心', tag: '三连蓄势', text: '第三棍范围更远、可破正面重盾，命中回定力。', cost: '第三棍后摇延长；贪招时要用闪避脱身。', color: '#efc47a' },
    { id: 'mirror', glyph: '返', name: '回锋印', tag: '借力反击', text: '闪避触碰的飞弹会返向施法者，造成 24 伤害。', cost: '只有闪避的短暂无敌阶段能够反弹。', color: '#8ec4ee' },
    { id: 'flame', glyph: '焰', name: '业火莲', tag: '下劈破阵', text: '空中按下＋攻击落地迸出火环，打断附近敌人。', cost: '下劈不能中途转向；落地有短暂恢复。', color: '#f28b65' },
    { id: 'mercy', glyph: '生', name: '护生灯', tag: '稳健续航', text: '破除阵眼恢复 12 生命；分身结束返还 15 定力。', cost: '需要主动破阵或等待分身结束，不能原地回血。', color: '#a4cf91' }
  ];
  K.STAGES = [
    { name: '雾隐山道', subtitle: '石阶尽处，黑莲初现', sky: '#17192c', mist: '#49616a', accent: '#c4d7b3' },
    { name: '悬灯古渡', subtitle: '灯火引路，也照见来敌', sky: '#201830', mist: '#6b4c69', accent: '#e5ae74' },
    { name: '灵山残庭', subtitle: '佛光已黯，棍心未改', sky: '#201b2f', mist: '#655a62', accent: '#ddbf7b' },
    { name: '黑莲法界', subtitle: '此劫，当由我破', sky: '#191326', mist: '#5c3b65', accent: '#d493c5' }
  ];
  K.relic = id => K.RELICS.find(r => r.id === id);
  K.has = (s, id) => s.relics.includes(id);
  K.makeRoom = function (seed, stage) {
    const random = K.rng(K.seedNumber(seed) + stage * 9719);
    const boss = stage === 3;
    const room = { width: boss ? 960 : 2140, platforms: [], hazards: [], enemies: [], seals: [], pickups: [], exit: boss ? 900 : 2054, variant: Math.floor(random() * 1000) };
    const ground = (x, w) => room.platforms.push({ x, y: 440, w, h: 110, solid: true });
    if (boss) {
      ground(0, 960);
      room.platforms.push({ x: 150, y: 335, w: 130, h: 14 }, { x: 680, y: 335, w: 130, h: 14 });
      room.enemies.push(K.enemy('boss', 730, 368, 0));
    } else {
      if(stage===2){ground(0,640);ground(740,660);ground(1500,640);}
      else {ground(0, 820); ground(920, 600); ground(1610, 530);}
      const offset = [-16,0,16][Math.floor(random()*3)];
      room.platforms.push({ x: 280+offset, y: 345, w: 145, h: 16 }, { x: 485+offset, y: 285, w: 125, h: 16 }, { x: 675, y: 355, w: 160, h: 16 }, { x: 1010, y: 335, w: 140, h: 16 }, { x: 1230-offset, y: 270, w: 130, h: 16 }, { x: 1450, y: 345, w: 175, h: 16 }, { x: 1760+offset, y: 340, w: 130, h: 16 });
      room.hazards.push({ x: 1030 + Math.floor(random() * 70), y: 427, w: 66, h: 13 });
      room.seals = [{ id: 0, x: 605, y: 392, w: 28, h: 48, hp: 42 }, { id: 1, x: 1675, y: 392, w: 28, h: 48, hp: 42 }];
      if(stage===1){room.seals[0].x=1058;room.seals[0].y=287;}
      const types = stage === 0 ? ['blade', 'shield', 'caster', 'blade', 'shield'] : ['shield', 'caster', 'blade', 'caster', 'shield'];
      const spots = [420, 660, 1130, 1385, 1750];
      spots.forEach((x, i) => room.enemies.push(K.enemy(types[(i + Math.floor(random() * 2)) % types.length], x + Math.floor(random() * 30), 400, i)));
      // First encounter is always readable; an upper route offers a heal, not a mandatory key.
      room.enemies[0] = K.enemy('blade', 422, 400, 0);
      room.pickups.push({ x: 537, y: 248, w: 16, h: 20, kind: 'heal', used: false }, { x: 1270, y: 234, w: 16, h: 20, kind: 'focus', used: false });
    }
    return room;
  };
  K.enemy = function (kind, x, y, id) {
    const boss = kind === 'boss';
    return { id, kind, x, y: boss ? 368 : kind === 'caster' ? 327 : 400, w: boss ? 48 : 26, h: boss ? 72 : 40, hp: boss ? 270 : kind === 'shield' ? 60 : 38, maxHp: boss ? 270 : kind === 'shield' ? 60 : 38, face: -1, phase: 'idle', timer: .6 + id * .13, stun: 0, flash: 0, attacks: 0, struck: false, origin: x };
  };
})(globalThis.Kong ||= {});
