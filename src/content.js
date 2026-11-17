(function (K) {
  'use strict';
  K.VERSION = '4.0.0';
  K.W = 960; K.H = 540; K.DT = 1 / 120;
  K.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  K.overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  K.rng = function (seed) {
    let a = seed >>> 0;
    return () => {
      a += 0x6D2B79F5;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  K.seedNumber = function (s) {
    let n = 2166136261;
    for (const c of String(s)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
    return n >>> 0;
  };

  K.STANCES = [
    {
      id: 'smash', glyph: '劈', name: '劈棍势', sub: '断岳劈山', color: '#f5b864', glow: '#e85d4a',
      desc: '大开大合赤金刀弧；耗势绝技「断岳劈山」跃空重劈并留下灼烧裂地金焰。'
    },
    {
      id: 'pillar', glyph: '立', name: '立棍势', sub: '登云镇海', color: '#7ee6d4', glow: '#4ab8b0',
      desc: '横扫八方兼顾高空；耗势绝技「镇海雷罡」撑棍腾空避开地面杀招，再轰落双侧雷震。'
    },
    {
      id: 'thrust', glyph: '戳', name: '戳棍势', sub: '流星贯日', color: '#99c9ff', glow: '#5e88e8',
      desc: '攻距暴涨38%且后拉可退寸进尺；耗势绝技「贯日长虹」金箍伸长260像素贯穿全线。'
    }
  ];
  K.stanceInfo = id => K.STANCES.find(x => x.id === id) || K.STANCES[0];

  K.SPELLS = [
    { id: 'immobilize', key: 'F', glyph: '定', name: '定身法', cost: 25, cd: 5.5, desc: '凝金光「定」字锁住前方群敌2.6秒（首领1.15秒），连击叠满崩裂重创。' },
    { id: 'rocksolid', key: 'C', glyph: '铜', name: '铜头铁臂', cost: 0, cd: 4.0, desc: '化金刚不坏身0.38秒；受击瞬间震退强敌破招，直得2段棍势与22定力！' },
    { id: 'clones', key: 'L', glyph: '毛', name: '身外身法', cost: 40, cd: 0, desc: '拔毫毛唤出双猴分身自主追猎围攻，吸引敌军火力助本体从容绕背。' }
  ];

  K.FORGE_UPGRADES = [
    { id: 'temper', glyph: '锋', name: '玄铁重淬', cost: 40, desc: '金箍棒锋芒重铸：所有棍法、神通与绝技基础伤害永久提升 +22%。' },
    { id: 'mind', glyph: '神', name: '灵台澄明', cost: 40, desc: '定身法与铜头铁臂冷却缩减 28%，每秒自然凝练 +1.8 定力。' },
    { id: 'vital', glyph: '躯', name: '金刚不坏躯', cost: 45, desc: '生命上限提升 +25，立即恢复 35 点生命并凝结 20 点金身护盾。' },
    { id: 'awaken', glyph: '真', name: '舍利点化', cost: 50, desc: '引炉中三昧真火，将一枚尚未觉醒的随身舍利直接升阶为「真·舍利」！' }
  ];

  K.RELICS = [
    {
      id: 'cloud', icon: 0, glyph: '云', name: '腾云骨', tag: '空中取势',
      text: '多一次空中腾云跳；空中棍击伸得更远，踩敌后重置腾云。',
      awake: '真·腾云骨：踩敌反弹激起云罡雷环，对周围敌影额外造成16破甲伤。',
      cost: '用高度避开地面斩击；高空仍需留意莲焰轨迹。', color: '#82d9d2'
    },
    {
      id: 'echo', icon: 1, glyph: '影', name: '照影珠', tag: '群猿剑风',
      text: '身外身法额外多唤出1尊毫毛分身（共3尊），且分身挥出远程穿透棍风。',
      awake: '真·照影珠：三尊分身棍风伤害升至24，且能直接贯穿黑莲阵眼。',
      cost: '每次消耗50定力；群猿齐出可瞬间压制全场。', color: '#bd9cdb'
    },
    {
      id: 'staff', icon: 2, glyph: '棍', name: '定海心', tag: '重棍破势',
      text: '第三棍距离大增并击穿正面重盾；重棍命中可强行打断敌军蓄力。',
      awake: '真·定海心：第三棍伤害升至36，每次命中积攒棍势速度提升50%。',
      cost: '第三棍收招沉猛，宜看准敌招破绽一击定音。', color: '#efc47a'
    },
    {
      id: 'mirror', icon: 3, glyph: '返', name: '回锋印', tag: '迎焰而返',
      text: '闪避或铜头铁臂期间接住敌方飞弹，逆转返向施法者造成24穿透伤。',
      awake: '真·回锋印：返弹伤害升至34，并额外激起护体剑风震退近敌。',
      cost: '看准弹道迎锋而上，化敌暗箭为己飞剑。', color: '#8ec4ee'
    },
    {
      id: 'flame', icon: 4, glyph: '焰', name: '业火莲', tag: '下劈控场',
      text: '空中下＋攻击落地迸发宽幅火环，大范围破盾并打断周围敌招蓄力。',
      awake: '真·业火莲：火环伤害升至44，并在落点残留2.2秒灼世莲焰持续炙烤。',
      cost: '下劈途中不可改向；起手前须审视落脚方位。', color: '#f28b65'
    },
    {
      id: 'mercy', icon: 5, glyph: '生', name: '护生灯', tag: '破阵续航',
      text: '破除黑莲阵眼恢复12生命；毫毛分身消散时返还15定力。',
      awake: '真·护生灯：破阵额外凝结14点金身护盾，分身消散返还22定力。',
      cost: '须主动破阵进取，以战养战生生不息。', color: '#a4cf91'
    },
    {
      id: 'chakram', icon: 6, glyph: '刚', name: '金刚琢', tag: '雷音震煞',
      text: '毫巅识破、铜头铁臂或闪避掠敌时迸发雷音金环，造成22破甲伤并麻痹。',
      awake: '真·金刚琢：雷音金环伤害升至32，触发识破立即缩减一半闪避冷却。',
      cost: '贴近刀锋迎险博弈，越是险境雷音越盛。', color: '#f4d36b'
    },
    {
      id: 'band', icon: 7, glyph: '狂', name: '紧箍残片', tag: '齐天战意',
      text: '连击达5次或生命低于55%催发战意：暴击与棍伤提升28%，退敌回4生命。',
      awake: '真·紧箍残片：常驻15%增伤；连击达5次暴涨至38%并额外回8定力。',
      cost: '受击断连会暂敛锋芒；越战越勇方显齐天本色。', color: '#e87568'
    },
    {
      id: 'vase', icon: 8, glyph: '净', name: '琉璃净瓶', tag: '甘露金身',
      text: '过境、调息或拾取莲华时凝结16点金身护盾；踏中地刺可化险回气。',
      awake: '真·琉璃净瓶：金身凝结量提升至26点，护盾存续期间身法移速提升12%。',
      cost: '金身护盾优先承伤，破盾后可借甘露重凝。', color: '#8ee0c6'
    }
  ];

  K.SYNERGIES = [
    { id: 'cloud_echo', req: ['cloud', 'echo'], name: '云影同归', desc: '分身在场时施展下劈或立棍镇海，所有分身同步震落幻影冲击波（22破盾伤）' },
    { id: 'staff_flame', req: ['staff', 'flame'], name: '定海业火', desc: '第三重棍与三势耗势绝技向前席卷贯通业火烈波（18远程穿透伤）' },
    { id: 'mirror_mercy', req: ['mirror', 'mercy'], name: '回锋护生', desc: '触发毫巅识破、铜头震岳或返弹飞弹时，恢复6生命与12定力' },
    { id: 'chakram_staff', req: ['chakram', 'staff'], name: '金刚伏魔', desc: '施展耗势绝技或易势闪击时引爆雷音震煞，对阵眼与首领伤害提升35%' },
    { id: 'band_vase', req: ['band', 'vase'], name: '狂圣净心', desc: '身披金身护盾期间常驻激活「齐天战意」高额增伤与退敌嗜血' },
    { id: 'trinity', reqCount: 3, name: '三花聚顶', desc: '携满三枚以上舍利：每秒凝神恢复2.4定力，耗势绝技大幅穿透无天黑莲护体' }
  ];

  K.SEALS_CODEX = [
    { id: 'first_blood', name: '初试锋芒', desc: '在劫途中首次击退黑莲魔众' },
    { id: 'insight_master', name: '毫巅识破', desc: '单次旅程完成 3 次毫巅识破或铜头震岳' },
    { id: 'pillar_breaker', name: '一棍千钧', desc: '倾注三段满棍势施展劈/立/戳任一门耗势绝技' },
    { id: 'stance_dancer', name: '三势如意', desc: '在战斗中通过 Q 键完成 3 次「易势闪击」流派连携' },
    { id: 'immobilize_sage', name: '一字定身', desc: '施展定身法锁住强敌并引爆金印崩裂' },
    { id: 'macaque_slayer', name: '斩却心魔', desc: '在照妖心魔古镜中击败宿敌「六耳猕猴」，证得第四舍利槽' },
    { id: 'bell_ringer', name: '暮鼓晨钟', desc: '敲响古寺残钟并荡平应声而来的试炼魔影' },
    { id: 'stele_sage', name: '残碑悟道', desc: '参悟石猴残碑或神龛真火，唤醒一枚「真·舍利」' },
    { id: 'synergy_weaver', name: '万法归宗', desc: '同一局内同时激活至少 2 项双舍利法相共鸣' },
    { id: 'warden_slayer', name: '斩将夺旗', desc: '正面击溃镇守黑莲阵眼的守阵魔将' },
    { id: 'combo_king', name: '齐天战狂', desc: '单轮交锋连击数突破 15 连击' },
    { id: 'lotus_conqueror', name: '万佛重光', desc: '击败无天灭世元神法相，重燃三界灯火' },
    { id: 'flawless_sage', name: '斗战胜佛', desc: '单局总承伤不超过 45 点破除无天大劫' }
  ];

  K.REST = {
    id: 'rest', icon: -1, glyph: '息', name: '借灯调息', tag: '本次补给',
    text: '恢复30生命与35定力，凝练1段棍势并获赠18灵蕴。保留当前舍利。',
    cost: '放弃本次更换舍利的机缘。', color: '#c4d5aa'
  };

  K.STAGES = [
    { name: '雾隐山道', subtitle: '三势初开，雷火破阵', sky: '#141e2c', mist: '#49616a', accent: '#c4d7b3', lore: '灵山的钟已三日未响。按 Q 切换劈/立/戳三棍势，按 F 定身破局！' },
    { name: '悬灯古渡', subtitle: '古镜照魔，借影渡劫', sky: '#21182d', mist: '#6b4c69', accent: '#e5ae74', lore: '暗河孤灯映出心魔。若遇照妖古镜，敢与六耳猕猴一决真假？' },
    { name: '灵山残庭', subtitle: '金炉淬棒，此心不退', sky: '#251c2d', mist: '#655a62', accent: '#ddbf7b', lore: '阶前香灰未冷。将一路所聚灵蕴投入神龛淬棒，叩开最后山门。' },
    { name: '黑莲法界', subtitle: '灭世法相，一棒澄明', sky: '#191326', mist: '#5c3b65', accent: '#d493c5', lore: '无天六臂黑莲法相已临九天。倾尽三势神通，破此万劫！' }
  ];

  K.WARDEN_NAMES = ['雾山统领 · 断岳', '古渡冥将 · 寒灯', '残庭护法 · 毗卢'];

  K.relic = id => id === 'rest' ? K.REST : K.RELICS.find(r => r.id === id);
  K.has = (s, id) => s.relics.includes(id);
  K.isAwakened = (s, id) => Array.isArray(s.upgradedRelics) && s.upgradedRelics.includes(id);
  K.activeSynergies = function (relics) {
    if (!Array.isArray(relics)) return [];
    return K.SYNERGIES.filter(syn => syn.reqCount ? relics.length >= syn.reqCount : syn.req.every(id => relics.includes(id)));
  };
  K.hasSynergy = (s, synId) => K.activeSynergies(s.relics).some(x => x.id === synId);
  K.previewSynergies = function (currentRelics, candidateId) {
    if (!candidateId || candidateId === 'rest' || currentRelics.includes(candidateId)) return [];
    return K.SYNERGIES.filter(syn => syn.req && syn.req.includes(candidateId) && syn.req.every(id => id === candidateId || currentRelics.includes(id)));
  };

  K.enemy = function (kind, x, y, id, stage = 0) {
    const boss = kind === 'boss', warden = kind === 'warden', macaque = kind === 'macaque', spear = kind === 'spear';
    const w = boss ? 48 : warden ? 34 : macaque ? 28 : 26;
    const h = boss ? 72 : warden ? 52 : macaque ? 46 : spear ? 42 : 40;
    const defaultY = boss ? 368 : warden ? 388 : macaque ? 394 : spear ? 398 : kind === 'caster' ? 327 : 400;
    const hp = boss ? 270 : macaque ? 132 : warden ? (104 + stage * 14) : kind === 'shield' ? 60 : spear ? 46 : 38;
    return {
      id, kind, x, y: y === undefined ? defaultY : y, w, h,
      hp, maxHp: hp, face: -1, phase: 'idle',
      timer: kind === 'caster' ? .45 + id * .07 : boss ? .8 : 0,
      stun: 0, frozen: 0, freezeHits: 0, flash: 0, hitTilt: 0, attacks: 0, struck: false,
      origin: x, baseY: y === undefined ? defaultY : y, interruptLock: 0,
      title: macaque ? '心魔 · 六耳猕猴' : warden ? K.WARDEN_NAMES[stage % 3] : boss ? '无天' : ''
    };
  };

  const BLUEPRINTS = [
    {
      ground: [[0, 820], [920, 870], [1900, 850], [2860, 810], [3780, 1380]],
      ledges: [[270, 350, 150], [480, 280, 140], [690, 350, 180], [1090, 350, 170], [1330, 280, 150], [1640, 350, 160], [2040, 350, 160], [2270, 275, 180], [2530, 350, 230], [3000, 350, 160], [3220, 280, 150], [3480, 350, 200], [3940, 350, 160], [4180, 280, 180], [4460, 350, 180]],
      seals: [[1480, 392], [4330, 392]],
      hazards: [[1210, 54], [2410, 62], [4010, 54]],
      pads: [[445, 424], [2225, 424], [4130, 424]],
      shrines: [[1980, 440, 'stele'], [2640, 350, 'forge'], [3390, 440, 'bell']],
      breakables: [[995, 440, 'firejar'], [1380, 280, 'chest'], [2115, 440, 'firejar'], [2590, 440, 'firejar'], [3265, 280, 'chest'], [4220, 440, 'firejar'], [4245, 280, 'chest']],
      encounters: [[422, 'blade', 400], [1020, 'shield', 400], [1560, 'caster', 327], [2140, 'spear', 398], [2550, 'shield', 400], [3110, 'caster', 327], [3500, 'spear', 398], [4250, 'warden', 388], [4580, 'caster', 327]],
      supplies: [[545, 244, 'heal'], [2330, 239, 'focus'], [3280, 244, 'heal']],
      landmarks: [700, 1770, 2740, 3680]
    },
    {
      ground: [[0, 760], [880, 760], [1760, 780], [2660, 780], [3560, 760], [4440, 720]],
      ledges: [[290, 350, 140], [520, 280, 160], [710, 350, 210], [1030, 350, 140], [1240, 280, 160], [1510, 350, 270], [1880, 360, 150], [2060, 340, 200], [2310, 270, 170], [2480, 350, 190], [2790, 350, 150], [3010, 275, 160], [3270, 350, 310], [3720, 350, 160], [3950, 280, 160], [4210, 350, 250], [4650, 350, 180]],
      seals: [[2140, 292], [4100, 392]],
      hazards: [[1160, 56], [2890, 64], [3830, 60]],
      pads: [[1825, 424], [2970, 424], [3910, 424]],
      shrines: [[1380, 440, 'bell'], [2730, 440, 'mirror'], [3360, 350, 'forge']],
      breakables: [[760, 350, 'chest'], [1430, 440, 'firejar'], [1930, 440, 'firejar'], [2365, 270, 'chest'], [2835, 440, 'firejar'], [3995, 280, 'chest'], [4015, 440, 'firejar']],
      encounters: [[422, 'blade', 400], [1050, 'caster', 327], [1450, 'shield', 400], [1950, 'spear', 398], [2160, 'shield', 300], [2390, 'caster', 210], [2860, 'spear', 398], [3220, 'caster', 327], [3710, 'blade', 400], [4040, 'warden', 388], [4680, 'shield', 400]],
      supplies: [[575, 244, 'focus'], [3040, 239, 'heal'], [4700, 314, 'focus']],
      landmarks: [750, 1630, 2520, 3430, 4320]
    },
    {
      ground: [[0, 860], [980, 750], [1850, 790], [2760, 710], [3590, 1570]],
      ledges: [[300, 350, 160], [530, 280, 150], [760, 350, 230], [1120, 350, 140], [1330, 280, 150], [1550, 340, 190], [1740, 350, 130], [1990, 350, 150], [2230, 270, 190], [2510, 350, 260], [2910, 350, 150], [3140, 280, 170], [3370, 350, 240], [3740, 350, 160], [3970, 280, 170], [4250, 350, 170], [4560, 300, 190]],
      seals: [[1620, 292], [4260, 392]],
      hazards: [[1190, 62], [2130, 64], [3020, 56], [3980, 60]],
      pads: [[1495, 424], [2195, 424], [4515, 424]],
      shrines: [[2020, 440, 'mirror'], [2310, 270, 'stele'], [3690, 440, 'forge']],
      breakables: [[580, 280, 'chest'], [1040, 440, 'firejar'], [1600, 340, 'firejar'], [2580, 350, 'chest'], [2905, 440, 'firejar'], [4020, 280, 'chest'], [4165, 440, 'firejar']],
      encounters: [[422, 'blade', 400], [1060, 'shield', 400], [1490, 'caster', 237], [1650, 'shield', 300], [2060, 'spear', 398], [2420, 'blade', 400], [2930, 'spear', 398], [3250, 'caster', 237], [3750, 'blade', 400], [4190, 'warden', 388], [4510, 'caster', 327], [4810, 'spear', 398]],
      supplies: [[580, 244, 'heal'], [2280, 234, 'focus'], [4610, 264, 'heal']],
      landmarks: [850, 1720, 2630, 3460]
    }
  ];

  K.makeRoom = function (seed, stage) {
    const random = K.rng(K.seedNumber(seed) + stage * 9719), boss = stage === 3;
    const room = {
      width: boss ? 960 : 5160, platforms: [], hazards: [], enemies: [], seals: [],
      pickups: [], pads: [], shrines: [], breakables: [], pillars: [], motes: [], corpses: [],
      exit: boss ? 900 : 5060, variant: Math.floor(random() * 1000),
      midClaimed: false, landmarks: [], signs: []
    };
    if (boss) {
      room.platforms.push({ x: 0, y: 440, w: 960, h: 110, solid: true }, { x: 120, y: 345, w: 150, h: 16 }, { x: 680, y: 345, w: 150, h: 16 });
      room.pads.push({ x: 46, y: 424, w: 36, h: 16, cool: 0 }, { x: 878, y: 424, w: 36, h: 16, cool: 0 });
      room.breakables.push({ id: 0, x: 175, y: 313, bottom: 345, w: 32, h: 32, kind: 'chest', hp: 1, broken: false }, { id: 1, x: 735, y: 313, bottom: 345, w: 32, h: 32, kind: 'firejar', hp: 1, broken: false });
      room.enemies.push(K.enemy('boss', 710, 368, 0, stage));
      return room;
    }
    const b = BLUEPRINTS[stage];
    b.ground.forEach(([x, w]) => room.platforms.push({ x, y: 440, w, h: 110, solid: true }));
    b.ledges.forEach(([x, y, w], i) => room.platforms.push({ x: x + (i % 3 === 1 ? (Math.floor(random() * 3) - 1) * 12 : 0), y, w, h: 16 }));
    b.hazards.forEach(([x, w]) => room.hazards.push({ x, y: 427, w, h: 13 }));
    b.seals.forEach(([x, y], id) => room.seals.push({ id, x, y, w: 28, h: 48, hp: 56, pulse: 2.2, warning: false }));
    b.pads.forEach(([x, y]) => room.pads.push({ x, y, w: 36, h: 16, cool: 0 }));
    b.shrines.forEach(([x, bottomY, kind], id) => room.shrines.push({ id, x, y: bottomY - 68, bottom: bottomY, w: 52, h: 68, kind, used: false, trial: 0 }));
    b.breakables.forEach(([x, bottomY, kind], id) => room.breakables.push({ id, x, y: bottomY - 36, bottom: bottomY, w: 34, h: 36, kind, hp: 1, broken: false }));
    b.encounters.forEach(([x, kind, y], id) => {
      if (id > 4 && kind === 'blade' && random() > .55) kind = 'shield';
      room.enemies.push(K.enemy(kind, x + (id === 0 || kind === 'warden' ? 0 : Math.floor(random() * 21) - 10), y, id, stage));
    });
    b.supplies.forEach(([x, y, kind]) => room.pickups.push({ x, y, w: 16, h: 20, kind, used: false }));
    room.landmarks = b.landmarks;
    room.signs = [
      { x: 150, text: '按 Q 即时切换「劈 / 立 / 戳」三棍势；连招中切势可发「易势闪击」！' },
      { x: 390, text: '按 F「定身法」锁敌崩裂，按 C「铜头铁臂」弹反震岳；击碎雷火瓮可炸毁敌群！' },
      { x: room.seals[0].x - 100, text: '收集灵蕴可在「淬棒神龛」重铸金箍棒；偶遇照妖古镜可战六耳猕猴赢第四舍利槽！' }
    ];
    return room;
  };

  K.options = function (s) {
    const random = K.rng(K.seedNumber(s.seed) + s.stage * 771 + (s.rewardKind === 'mid' ? 29 : 91));
    return K.RELICS.filter(r => !K.has(s, r.id)).map(r => ({ id: r.id, n: random() })).sort((a, b) => a.n - b.n).slice(0, 2).map(r => r.id).concat('rest');
  };

  K.rankRun = function (s) {
    const won = s.mode === 'won';
    const score = (won ? 520 : s.stage * 95) + (s.broken || 0) * 45 + (s.kills || 0) * 14 + (s.insights || 0) * 35 + (s.maxCombo || 0) * 12 + (s.macaqueSlain ? 120 : 0) - (s.damageTaken || 0) * 2.4;
    if (won && s.damageTaken <= 45 && score >= 860) return { grade: 'S+', title: '齐天大圣', poem: '金睛照破千重妄，一棒澄明万里天。' };
    if (won && score >= 700) return { grade: 'S', title: '斗战胜佛', poem: '黑莲散尽灵山晓，犹携微火返人间。' };
    if (won || score >= 420) return { grade: 'A', title: '破劫行者', poem: '披霜踏雾行未止，棍底风雷自有声。' };
    return { grade: 'B', title: '归山行脚', poem: '胜败寻常山中事，重整金冠再叩关。' };
  };
})(globalThis.Kong ||= {});
