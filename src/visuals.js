(function (K) {
  'use strict';
  const Base = K.Renderer;

  const RUN = [
    { r: [12, 220, 341, 330], a: [257, 548] }, { r: [370, 220, 323, 330], a: [600, 548] },
    { r: [716, 220, 321, 330], a: [944, 548] }, { r: [1074, 220, 363, 330], a: [1335, 548] },
    { r: [1446, 220, 332, 330], a: [1684, 548] }, { r: [1808, 220, 310, 330], a: [2025, 548] }
  ];
  const HERO = {
    idle: { r: [85, 40, 280, 405], a: [218, 427] },
    run: { r: [430, 90, 400, 355], a: [664, 426] },
    jump: { r: [905, 60, 400, 360], a: [1108, 384] },
    fall: { r: [1365, 90, 390, 360], a: [1564, 443] },
    windup: { r: [30, 465, 395, 370], a: [248, 815] },
    attack: { r: [430, 490, 550, 345], a: [651, 816] },
    heavy: { r: [430, 490, 550, 345], a: [651, 816] },
    recover: { r: [980, 495, 393, 340], a: [1118, 816] },
    hurt: { r: [1380, 510, 370, 325], a: [1554, 816] },
    death: { r: [1380, 510, 370, 325], a: [1554, 816] },
    dash: { r: [430, 90, 400, 355], a: [664, 426] }
  };
  const ENEMIES = {
    blade: [{ r: [0, 60, 420, 395], a: [238, 447] }, { r: [25, 460, 395, 405], a: [245, 852] }],
    shield: [{ r: [460, 25, 442, 430], a: [688, 447] }, { r: [465, 457, 437, 408], a: [688, 852] }],
    caster: [{ r: [925, 15, 400, 433], a: [1115, 435] }, { r: [920, 450, 405, 405], a: [1115, 840] }],
    boss: [{ r: [1350, 0, 410, 453], a: [1558, 447] }, { r: [1335, 447, 439, 420], a: [1560, 852] }]
  };

  const iconCache = new Map();
  K.relicIconURL = function (idx) {
    if (idx < 0) return '';
    if (iconCache.has(idx)) return iconCache.get(idx);
    const sheet = K.ImageArt?.images.relicIcons;
    if (!sheet) return '';
    const out = document.createElement('canvas'); out.width = 64; out.height = 64;
    const c = out.getContext('2d'); c.imageSmoothingEnabled = false;
    c.drawImage(sheet, idx * 64, 0, 64, 64, 0, 0, 64, 64);
    const url = out.toDataURL();
    iconCache.set(idx, url);
    return url;
  };

  const rect = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

  K.Renderer = class extends Base {
    constructor(canvas) {
      super(canvas);
      this.scene = null;
      this.ui = 'menu';
      this.panoCache = {};
      this.frameCache = new Map();
      this.runCycle = 0;
    }

    draw(state, ui, dt) {
      this.scene = state; this.ui = ui; this.decorDrawn = false;
      if (ui === 'playing' && state?.player.grounded) this.runCycle += Math.abs(state.player.vx) * dt / 18;
      super.draw(state, ui, dt);
    }

    image(key) { return K.ImageArt?.images[key]; }

    // Build a 1920x540 seamless mirrored panorama strip so parallax scrolling never shows a seam!
    panorama(stage) {
      const key = stage === 0 ? 'mountain' : stage === 1 ? 'ferry' : stage === 2 ? 'sanctuary' : (this.image('lotusRealm') ? 'lotusRealm' : 'sanctuary');
      const image = this.image(key);
      if (!image) return null;
      if (!this.panoCache[stage]) {
        const out = document.createElement('canvas'); out.width = 1920; out.height = 540;
        const c = out.getContext('2d'); c.imageSmoothingEnabled = false;
        c.fillStyle = stage === 3 ? '#140d22' : '#1d323b';
        c.fillRect(0, 0, 1920, 540);
        c.globalAlpha = stage === 3 ? .92 : .88;
        c.drawImage(image, 0, 0, 960, 540);
        c.save(); c.translate(1920, 0); c.scale(-1, 1); c.drawImage(image, 0, 0, 960, 540); c.restore();
        c.globalAlpha = 1;
        const g = c.createLinearGradient(0, 220, 0, 540);
        g.addColorStop(0, '#0a182000');
        g.addColorStop(.58, stage === 3 ? '#160d2638' : '#0c1b2838');
        g.addColorStop(1, stage === 3 ? '#190e2bc8' : '#0c1c2bb4');
        c.fillStyle = g;
        c.fillRect(0, 220, 1920, 320);
        this.panoCache[stage] = out;
      }
      return this.panoCache[stage];
    }

    drawParallaxBackdrop(stage, cam, t) {
      const c = this.c;
      const pano = this.panorama(stage);
      if (!pano) { c.drawImage(this.background(stage), 0, 0); return; }

      // Layer 1: Seamless 0.22x Painted Panorama Scroll!
      const scrollFar = Math.round(cam * 0.22) % 1920;
      c.drawImage(pano, -scrollFar, 0);
      if (scrollFar > 960) c.drawImage(pano, 1920 - scrollFar, 0);

      // Layer 1.5: Volumetric Diagonal God-Rays!
      c.save();
      c.globalCompositeOperation = 'lighter';
      const rayCol = stage === 3 ? '#9d4ee0' : stage === 1 ? '#e89d58' : '#d9c48c';
      for (let i = 0; i < 4; i++) {
        const rx = ((i * 290 - cam * 0.08 + Math.sin(t * 0.4 + i) * 28) % 1160 + 1160) % 1160 - 140;
        const rw = 52 + (i % 2) * 34;
        const grad = c.createLinearGradient(rx, 0, rx + 130, 440);
        grad.addColorStop(0, rayCol + '24');
        grad.addColorStop(0.65, rayCol + '0c');
        grad.addColorStop(1, rayCol + '00');
        c.fillStyle = grad;
        c.beginPath();
        c.moveTo(rx, 0); c.lineTo(rx + rw, 0);
        c.lineTo(rx + rw + 165, 460); c.lineTo(rx + 165, 460);
        c.closePath(); c.fill();
      }
      c.restore();

      // Layer 2: Mid-ground 0.52x Ruined Temple Columns, Swaying Silk Ribbons & Warm Lantern Glows!
      if (stage < 3) {
        const midScroll = cam * 0.52;
        const firstIdx = Math.floor((midScroll - 120) / 380);
        const lastIdx = Math.ceil((midScroll + 1080) / 380);
        for (let idx = firstIdx; idx <= lastIdx; idx++) {
          const sx = Math.round(idx * 380 - midScroll + 140);
          const topY = 148 + (Math.abs(idx * 37) % 48);
          // Weathered silhouette column
          rect(c, sx, topY, 12, 310, '#13202acc');
          rect(c, sx - 6, topY - 4, 24, 5, '#2b3d47cc');
          // Swaying vermilion prayer ribbon!
          for (let seg = 0; seg < 7; seg++) {
            const sway = Math.sin(t * 2.6 + idx + seg * 0.55) * (seg * 1.8);
            rect(c, sx + 12 + sway, topY + 14 + seg * 8, 5 - Math.floor(seg / 3), 9, seg % 2 ? '#a83e3b' : '#c95247');
          }
          // Hanging bronze lantern + warm radial halo!
          const lx = sx - 12 + Math.sin(t * 1.8 + idx) * 2.5, ly = topY + 42;
          rect(c, lx, topY + 2, 1, 40, '#4d5259');
          rect(c, lx - 4, ly, 9, 12, '#3d2c28');
          rect(c, lx - 2, ly + 3, 5, 6, '#ffcf75');
          c.save();
          c.globalCompositeOperation = 'lighter';
          const lg = c.createRadialGradient(lx, ly + 6, 2, lx, ly + 6, 46 + Math.sin(t * 4 + idx) * 5);
          lg.addColorStop(0, '#ffb85c48');
          lg.addColorStop(0.5, '#e88a4218');
          lg.addColorStop(1, '#e88a4200');
          c.fillStyle = lg;
          c.fillRect(lx - 52, ly - 46, 104, 104);
          c.restore();
        }
      }

      // Stage 1 Ferry Shimmering Water Reflections along chasm bottom!
      if (stage === 1) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 22; i++) {
          const wx = ((i * 67 - cam * 0.65 + Math.sin(t * 2 + i) * 14) % 1020 + 1020) % 1020 - 30;
          const wy = 486 + (i % 5) * 10;
          c.globalAlpha = 0.16 + Math.sin(t * 3 + i) * 0.06;
          rect(c, wx, wy, 24 + (i % 3) * 12, 2, i % 2 ? '#f0a868' : '#68b8d8');
        }
        c.restore();
      }
    }

    drawForegroundWeather(stage, cam, t) {
      const c = this.c;
      // Fast 1.26x foreground silhouette framing columns + drifting mist wisps
      if (stage < 3) {
        const fgScroll = cam * 1.26;
        const idx = Math.floor((fgScroll + 960) / 1180);
        const fx = Math.round(idx * 1180 - fgScroll);
        if (fx > -80 && fx < 980) {
          c.save(); c.globalAlpha = 0.36;
          rect(c, fx, 0, 26, 540, '#081017');
          rect(c, fx + 26, 0, 4, 540, '#182833');
          c.restore();
        }
      }
      // Drifting foreground mist bands & glowing embers/petals
      c.save();
      for (let i = 0; i < 4; i++) {
        const mx = ((i * 340 - cam * 0.85 - t * (14 + i * 3)) % 1320 + 1320) % 1320 - 260;
        c.globalAlpha = 0.08;
        rect(c, mx, 395 + i * 28, 240, 14, stage === 3 ? '#8c52a8' : '#7ba0a8');
      }
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 20; i++) {
        const x = ((i * 79 - cam * 0.4 + t * (i % 2 ? 18 : -11)) % 980 + 980) % 980 - 10;
        const y = 90 + ((i * 53 + t * (stage === 3 ? -22 : 13)) % 410 + 410) % 410;
        c.globalAlpha = 0.45 + Math.sin(t * 4 + i) * 0.25;
        rect(c, x, y, i % 4 === 0 ? 3 : 2, 2, stage === 3 ? '#df88ff' : stage === 1 ? '#ffbe73' : '#ebd594');
      }
      c.restore();
    }

    frame(kind, pose, variant, flash, ghost, archForm = false) {
      const key = [kind, pose, variant, flash, ghost, archForm].join(':');
      if (this.frameCache.has(key)) return this.frameCache.get(key);

      if ((kind === 'macaque' || (kind === 'boss' && archForm)) && this.image('bossesV4')) {
        const sheet = this.image('bossesV4');
        const cellIdx = kind === 'macaque' ? (variant ? 1 : 0) : (variant ? 3 : 2);
        const out = document.createElement('canvas'); out.width = 192; out.height = 160;
        const c = out.getContext('2d'); c.imageSmoothingEnabled = false;
        c.drawImage(sheet, cellIdx * 192, 0, 192, 160, 0, 0, 192, 160);
        if (flash) {
          c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#fff0bd'; c.globalAlpha = .72;
          c.fillRect(0, 0, 192, 160);
        }
        this.frameCache.set(key, out);
        return out;
      }

      if ((kind === 'spear' || kind === 'warden') && this.image('eliteEnemies')) {
        const sheet = this.image('eliteEnemies');
        const cellIdx = kind === 'spear' ? (variant ? 1 : 0) : (variant ? 3 : 2);
        const out = document.createElement('canvas'); out.width = 192; out.height = 144;
        const c = out.getContext('2d'); c.imageSmoothingEnabled = false;
        c.drawImage(sheet, cellIdx * 192, 0, 192, 144, 0, 0, 192, 144);
        if (flash) {
          c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#fff0bd'; c.globalAlpha = .7;
          c.fillRect(0, 0, 192, 144);
        }
        this.frameCache.set(key, out);
        return out;
      }

      const running = kind === 'monkey' && pose === 'run' && this.image('run');
      const image = running || this.image(kind === 'monkey' ? 'wukong' : 'enemies');
      if (!image || (!ENEMIES[kind] && kind !== 'monkey')) return null;

      const refW = running ? 2172 : 1774;
      const ratio = image.width / refW;
      const info = running ? RUN[variant % 6] : kind === 'monkey' ? HERO[pose] || HERO.idle : ENEMIES[kind][variant];
      const [sx, sy, sw, sh] = info.r;
      const baseScale = running ? .21 : kind === 'boss' ? .19 : kind === 'caster' ? .125 : kind === 'monkey' ? .17 : .153;
      const out = document.createElement('canvas'); out.width = 192; out.height = 144;
      const c = out.getContext('2d'); c.imageSmoothingEnabled = false;
      const x = 96 + (sx - info.a[0]) * baseScale, y = 123 + (sy - info.a[1]) * baseScale;
      c.drawImage(image, sx * ratio, sy * ratio, sw * ratio, sh * ratio, Math.round(x), Math.round(y), Math.round(sw * baseScale), Math.round(sh * baseScale));

      if (flash || ghost) {
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = flash ? '#ffe48f' : '#6cebe0';
        c.globalAlpha = flash ? .72 : .64;
        c.fillRect(0, 0, out.width, out.height);
      }
      const mask = document.createElement('canvas'); mask.width = 192; mask.height = 144;
      const m = mask.getContext('2d'); m.drawImage(out, 0, 0); m.globalCompositeOperation = 'source-in';
      m.fillStyle = kind === 'monkey' ? '#e6c87e' : '#b89ec4'; m.fillRect(0, 0, 192, 144);
      c.globalCompositeOperation = 'destination-over'; c.globalAlpha = .28;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) c.drawImage(mask, dx, dy);
      this.frameCache.set(key, out);
      return out;
    }

    person(kind, x, y, face = 1, frame = 0, alpha = 1, flash = false, scaleX = 1, scaleY = 1, tilt = 0) {
      const s = this.scene, p = s?.player;
      let pose = 'idle', ghost = false, variant = 0, archForm = false;
      if (kind === 'monkey' && p && this.ui !== 'menu') {
        if (Math.abs(x - p.x) < .2 && Math.abs(y - p.y) < .2) {
          const hurt = s.effects.some(f => f.kind === 'hurt' && f.life > .20);
          const elapsed = p.attackDuration - p.attack;
          pose = p.hp === 0 ? 'death' : hurt ? 'hurt' : (p.pillarPerch || 0) > 0 ? 'jump' : (p.pillar || 0) > 0 ? 'heavy' : p.dash > 0 ? 'dash' : p.slam ? 'heavy' : p.attack > 0 ? (elapsed < .055 ? 'windup' : elapsed >= .18 ? 'recover' : p.comboIndex === 3 ? 'heavy' : 'attack') : !p.grounded ? (p.vy < 0 ? 'jump' : 'fall') : Math.abs(p.vx) > 30 ? 'run' : 'idle';
        } else if ((s.clones || []).some(cl => Math.abs(x - cl.x) < .5 && Math.abs(y - cl.y) < .5) || (s.clone && Math.abs(x - s.clone.x) < .5)) {
          pose = frame % 2 ? 'attack' : 'run'; ghost = true;
        } else {
          pose = 'dash'; ghost = true;
        }
      } else if (kind !== 'monkey' && s) {
        const e = s.room.enemies.find(e => e.kind === kind && Math.abs(e.x - x) < 2);
        if (e) {
          archForm = !!e.archForm;
          variant = (e.phase.includes('windup') || e.phase === 'beam' || ((kind === 'spear' || kind === 'macaque') && e.phase === 'attack')) ? 1 : 0;
        }
      }
      if (pose === 'run') variant = Math.floor(this.runCycle) % 6;
      const sprite = this.frame(kind, pose, variant, flash, ghost, archForm);
      if (!sprite) { super.person(kind, x, y, face, frame, alpha, flash, scaleX, scaleY, tilt); return; }
      const c = this.c, h = kind === 'boss' ? 72 : kind === 'warden' ? 52 : kind === 'macaque' ? 46 : kind === 'monkey' ? 44 : kind === 'spear' ? 42 : 40;
      const cx = kind === 'warden' ? x + 17 : kind === 'boss' ? x + 24 : x + 12;
      const breathing = pose === 'idle' && this.ui === 'playing' ? Math.round(Math.sin(this.clock * 2.4) * 1) : 0;
      const anchorY = (kind === 'macaque' || (kind === 'boss' && archForm)) ? 138 : 123;
      c.save();
      c.globalAlpha = alpha;
      c.translate(Math.round(cx), Math.round(y + h + breathing));
      if (tilt) c.rotate(tilt);
      c.scale(face * (kind === 'boss' ? 1 : scaleX), kind === 'boss' ? 1 : scaleY);
      if (pose === 'death') c.rotate(-.55);
      c.drawImage(sprite, -96, -anchorY);
      c.restore();
    }

    platform(p) {
      if (!this.decorDrawn) { this.decorDrawn = true; this.combatCues(); }
      const image = this.image('stone');
      if (!image) { super.platform(p); return; }
      if (p.x + p.w < this.camera - 40 || p.x > this.camera + 1000) return;
      const c = this.c;
      const ratio = image.width / 2172;
      if (p.solid) {
        rect(c, p.x, p.y + 24, p.w, p.h - 24, '#111e27');
        rect(c, p.x, p.y + 36, p.w, 3, '#283842');
        for (let x = p.x; x < p.x + p.w; x += 62) { rect(c, x + 31, p.y + 45, 2, 28, '#1e2f38'); rect(c, x + 3, p.y + 77, 58, 2, '#203038'); }
      }
      const tileW = 200, src = { x: 90 * ratio, y: 250 * ratio, w: 1990 * ratio, h: 260 * ratio };
      for (let x = p.x; x < p.x + p.w; x += tileW) {
        const w = Math.min(tileW, p.x + p.w - x);
        c.drawImage(image, src.x, src.y, src.w * w / tileW, src.h, Math.round(x), Math.round(p.y), Math.round(w), p.solid ? 30 : 25);
      }
      rect(c, p.x, p.y, p.w, 1, '#e6cf9c');
    }

    drawWorldObjects(s, t) {
      const c = this.c;
      const shrineImg = this.image('shrines');
      const propsV4 = this.image('propsV4');

      // Shrines: Bell, Stele, Forge, Mirror Portal!
      for (const sh of (s.room.shrines || [])) {
        if (sh.x + 90 < this.camera || sh.x - 50 > this.camera + 960) continue;
        c.save();
        if (sh.used && sh.kind !== 'forge' && sh.trial <= 0) c.globalAlpha = .52;
        if ((sh.kind === 'forge' || sh.kind === 'mirror') && propsV4) {
          const cell = sh.kind === 'forge' ? 2 : 3;
          c.drawImage(propsV4, cell * 96, 0, 96, 112, Math.round(sh.x - 14), Math.round(sh.bottom - 92), 80, 94);
        } else if (shrineImg) {
          const cell = sh.kind === 'bell' ? 0 : 1;
          c.drawImage(shrineImg, cell * 128, 0, 128, 128, Math.round(sh.x - 18), Math.round(sh.bottom - 88), 88, 90);
        } else {
          rect(c, sh.x + 8, sh.bottom - 56, 32, 56, '#967c52');
        }
        c.restore();

        if (!sh.used || sh.kind === 'forge') {
          c.save(); c.globalCompositeOperation = 'lighter';
          const haloCol = sh.kind === 'mirror' ? '#d468ff' : sh.kind === 'forge' ? '#ffaa4d' : '#ffe28a';
          const g = c.createRadialGradient(sh.x + 26, sh.bottom - 42, 4, sh.x + 26, sh.bottom - 42, 44);
          g.addColorStop(0, haloCol + '40'); g.addColorStop(1, haloCol + '00');
          c.fillStyle = g; c.fillRect(sh.x - 20, sh.bottom - 88, 92, 90);
          const bob = Math.sin(t * 3.5 + sh.x) * 3;
          rect(c, sh.x + 24, sh.bottom - 94 + bob, 4, 4, haloCol);
          c.restore();
        }
      }

      // Destructible Fire Jars & Relic Coffers!
      for (const br of (s.room.breakables || [])) {
        if (br.broken || br.x + 60 < this.camera || br.x - 20 > this.camera + 960) continue;
        if (propsV4) {
          const cell = br.kind === 'firejar' ? 0 : 1;
          c.drawImage(propsV4, cell * 96, 0, 96, 112, Math.round(br.x - 10), Math.round(br.bottom - 58), 54, 60);
        } else {
          rect(c, br.x, br.y, br.w, br.h, br.kind === 'firejar' ? '#d95b43' : '#dfb860');
        }
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35 + Math.sin(t * 6 + br.x) * .15;
        c.fillStyle = br.kind === 'firejar' ? '#ff7838' : '#8ef5b8';
        c.beginPath(); c.arc(br.x + 17, br.bottom - 20, 14, 0, Math.PI * 2); c.fill();
        c.restore();
      }

      // Golden Lotus Bounce Pads
      for (const pad of (s.room.pads || [])) {
        if (pad.x + 60 < this.camera || pad.x - 20 > this.camera + 960) continue;
        if (shrineImg) {
          const bounce = pad.cool > 0 ? -4 : 0;
          c.drawImage(shrineImg, 256, 0, 128, 128, Math.round(pad.x - 9), Math.round(pad.y + pad.h - 46 + bounce), 54, 48);
        }
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .4;
        for (let i = 0; i < 3; i++) {
          const py = pad.y - ((t * 22 + i * 9) % 26);
          rect(c, pad.x + 8 + i * 10, py, 2, 3, '#b8ffdf');
        }
        c.restore();
      }

      // Wutian Sky-Lotus Pillars
      for (const pl of (s.room.pillars || [])) {
        if (pl.phase === 'warn') {
          const blink = Math.floor(t * 20) % 2 ? '#ff9ee8' : '#b258c8';
          c.save(); c.globalCompositeOperation = 'lighter';
          rect(c, pl.x - 22, 434, 44, 5, blink);
          for (let y = 120; y < 434; y += 24) rect(c, pl.x - 1, y, 2, 12, '#bf66d4');
          c.restore();
        } else {
          c.save(); c.globalCompositeOperation = 'lighter';
          c.globalAlpha = K.clamp(pl.timer / .25, .3, .95);
          rect(c, pl.x - 20, 70, 40, 370, '#78289c');
          rect(c, pl.x - 11, 70, 22, 370, '#e078ff');
          rect(c, pl.x - 4, 70, 8, 370, '#ffffff');
          c.restore();
        }
      }
    }

    combatCues() {
      const s = this.scene; if (!s) return; const c = this.c;
      for (const e of s.room.enemies) {
        if (e.hp <= 0) continue;
        if (e.kind === 'caster' && e.phase === 'windup' && Number.isFinite(e.aimX)) {
          const dx = e.aimX - e.x, dy = e.aimY - e.y - 16;
          for (let i = 1; i < 12; i++) rect(c, e.x + dx * i / 12, e.y + 16 + dy * i / 12, 2, 2, '#e39cc8');
          rect(c, e.aimX - 5, e.aimY, 10, 2, '#ffb8d2');
        }
        if (e.kind === 'boss' && e.phase === 'shift-windup') {
          const a = Math.min(e.x, e.shiftTo), b = Math.max(e.x, e.shiftTo) + e.w;
          for (let x = a; x < b; x += 18) rect(c, x, 432, 10, 3, '#f0a4d0');
        }
      }
    }

    drawSeal(q) {
      const c = this.c;
      if (this.image('props')) {
        if (q.hp > 0) {
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .32 + Math.sin(this.clock * 4) * .1;
          const g = c.createRadialGradient(q.x + 14, q.y + 20, 4, q.x + 14, q.y + 20, 42);
          g.addColorStop(0, '#d866ff88'); g.addColorStop(1, '#d866ff00');
          c.fillStyle = g; c.fillRect(q.x - 28, q.y - 22, 84, 84);
          c.restore();
          this.prop('seal', q.x + 14, q.y + 48, 58, 53);
          for (let i = 0; i < 4; i++) rect(c, q.x + 1 + i * 7, q.y - 14, 5, 3, q.hp > i * 14 ? '#f2b8ff' : '#594960');
          if (q.warning) { const radius = 26 + Math.sin(this.clock * 25) * 5; rect(c, q.x + 14 - radius, q.y + 28, radius * 2, 3, '#ffb0e0'); }
        } else if (q.id === 0 && !this.scene.room.midClaimed) {
          c.save(); c.globalCompositeOperation = 'lighter';
          const g = c.createRadialGradient(q.x + 14, q.y + 22, 2, q.x + 14, q.y + 22, 38);
          g.addColorStop(0, '#ffcf7066'); g.addColorStop(1, '#ffcf7000');
          c.fillStyle = g; c.fillRect(q.x - 24, q.y - 16, 76, 76);
          c.restore();
          this.prop('lamp', q.x + 14, q.y + 48, 34, 44);
        } else {
          rect(c, q.x - 4, q.y + 43, 36, 5, '#64716d'); rect(c, q.x + 5, q.y + 36, 17, 8, '#485860');
        }
        return;
      }
      if (q.hp <= 0) { rect(c, q.x - 4, q.y + 43, 36, 5, '#64716d'); return; }
      rect(c, q.x - 5, q.y + 43, 38, 5, '#a79477');
    }

    prop(kind, x, bottom, w, h) {
      const img = this.image('props');
      if (!img) return;
      const ratio = img.width / 2172;
      const src = kind === 'seal' ? [75, 188, 620, 495] : kind === 'lamp' ? [850, 210, 410, 473] : [1390, 25, 765, 658];
      this.c.drawImage(img, src[0] * ratio, src[1] * ratio, src[2] * ratio, src[3] * ratio, Math.round(x - w / 2), Math.round(bottom - h), w, h);
    }

    drawGate(x, open) {
      if (!this.image('props')) return;
      const c = this.c; this.prop('gate', x + 7, 440, 138, 120);
      if (!open) {
        c.save(); c.globalAlpha = .7; rect(c, x - 30, 344, 74, 95, '#30213f'); c.restore();
        for (let i = 0; i < 5; i++) rect(c, x - 25 + i * 15, 350, 2, 85, '#ad6d9d');
      } else {
        c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(x + 7, 392, 6, x + 7, 392, 54);
        g.addColorStop(0, '#8ef5d455'); g.addColorStop(1, '#8ef5d400');
        c.fillStyle = g; c.fillRect(x - 48, 336, 110, 108);
        for (let i = 0; i < 9; i++) rect(c, x + Math.sin(this.clock * 1.5 + i) * 24, 355 + (i * 11 + this.clock * 24) % 75, 2, 4, '#c8ffdf');
        c.restore();
      }
    }

    titleScene(t) {
      const c = this.c;
      if (this.image('titleBg')) c.drawImage(this.image('titleBg'), 0, 0, 960, 540);
      const g = c.createLinearGradient(0, 0, 650, 0);
      g.addColorStop(0, '#08101be8');
      g.addColorStop(.62, '#0e1a2898');
      g.addColorStop(1, '#14203300');
      c.fillStyle = g; c.fillRect(0, 0, 960, 540);

      // Volumetric golden shaft piercing the Black Lotus eclipse on title screen!
      c.save(); c.globalCompositeOperation = 'lighter';
      const beam = c.createLinearGradient(680, 30, 770, 490);
      beam.addColorStop(0, '#ffcf7830'); beam.addColorStop(0.6, '#e89d4f18'); beam.addColorStop(1, '#e89d4f00');
      c.fillStyle = beam;
      c.beginPath(); c.moveTo(665, 0); c.lineTo(735, 0); c.lineTo(835, 500); c.lineTo(685, 500); c.closePath(); c.fill();
      c.restore();

      if (this.image('stone')) {
        const st = this.image('stone'), ratio = st.width / 2172;
        c.drawImage(st, 90 * ratio, 250 * ratio, 1990 * ratio, 260 * ratio, 585, 479, 295, 38);
      }
      if (this.image('wukong')) {
        const wk = this.image('wukong'), ratio = wk.width / 1774;
        const info = HERO.idle, [sx, sy, sw, sh] = info.r;
        const bob = Math.round(Math.sin(t * 2.4) * 2);
        c.save(); c.translate(738, 479 + bob); c.scale(-.64, .64);
        c.drawImage(wk, sx * ratio, sy * ratio, sw * ratio, sh * ratio, sx - info.a[0], sy - info.a[1], sw, sh);
        c.restore();
      } else {
        this.person('monkey', 714, 435, -1, 0, 1, false, 2.8, 2.8);
      }
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 26; i++) {
        const x = 510 + (i * 47) % 420 + Math.sin(t * .9 + i) * 9;
        const y = 130 + ((i * 59 - t * 18) % 370 + 370) % 370;
        c.globalAlpha = 0.5 + Math.sin(t * 3 + i) * 0.3;
        rect(c, x, y, i % 3 === 0 ? 3 : 2, 2, i % 4 === 0 ? '#fff0a8' : '#ffb85c');
      }
      c.restore();
    }
  };
})(globalThis.Kong ||= {});
