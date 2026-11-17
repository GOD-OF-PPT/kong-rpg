(function (K) {
  'use strict';
  const C = { ink: '#171426', gold: '#e7ba70', light: '#fae8b8', red: '#cd5651', hair: '#d39b58', blue: '#3c536d', dark: '#25243c', jade: '#80cfc5' };
  function poly(c, pts, color) { c.fillStyle = color; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.fill(); }
  function pixel(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }

  function sprite(kind, frame = 0) {
    const out = document.createElement('canvas'); out.width = 64; out.height = 80; const c = out.getContext('2d'); c.scale(2, 2);
    const r = (x, y, w, h, col) => pixel(c, x, y, w, h, col);
    const walk = Math.sin(frame * Math.PI / 2) * 2;
    if (kind === 'monkey') {
      r(3, 25, 8, 2, C.hair); r(2, 21, 2, 5, C.hair); r(3, 20, 4, 2, C.hair);
      r(10, 24, 6, 7, C.dark); r(17, 24, 6, 7, C.dark); r(10 - walk, 30, 5, 5, C.blue); r(18 + walk, 30, 4, 5, C.blue);
      r(8 - walk, 34, 8, 3, '#9e6b45'); r(18 + walk, 34, 7, 3, '#9e6b45'); r(8 - walk, 36, 8, 2, C.gold); r(18 + walk, 36, 7, 2, C.gold);
      r(9, 17, 15, 11, C.blue); r(10, 18, 4, 9, '#66839a'); r(20, 18, 4, 9, '#202b46'); r(9, 25, 15, 3, C.gold); r(10, 27, 14, 3, '#a94643'); r(13, 28, 4, 5, C.red);
      r(6, 18, 6, 8, C.gold); r(7, 19, 3, 6, C.light); r(22, 19, 5, 7, C.hair); r(24, 23, 5, 4, '#eed19d');
      r(11, 5, 12, 13, '#754736'); r(9, 9, 4, 6, C.hair); r(12, 6, 11, 10, C.hair); r(15, 8, 10, 8, '#e5b77a'); r(12, 7, 4, 4, '#754736');
      r(19, 10, 5, 2, '#342d35'); r(20, 10, 3, 1, C.light); r(23, 12, 3, 3, '#e5b77a'); r(19, 15, 5, 1, '#754736');
      r(11, 5, 13, 3, C.gold); r(12, 4, 4, 2, C.light); r(18, 4, 5, 2, C.light); r(13, 1, 2, 4, C.red); r(19, 0, 2, 5, C.red);
      r(9, 16, 15, 3, C.red); r(4, 17, 8, 3, C.red); r(1, 19, 6, 3, '#9c4248'); r(0, 21, 3, 2, C.red);
      r(27, 8, 2, 29, '#7b4e37'); r(27, 6, 2, 6, C.gold); r(27, 32, 2, 7, C.gold); r(27, 7, 1, 4, C.light); r(27, 33, 1, 5, C.light);
    } else if (kind === 'boss') {
      r(6, 19, 20, 17, '#261d37'); poly(c, [[6, 20], [3, 38], [28, 38], [25, 20]], '#332340');
      r(10, 19, 13, 14, '#49334e'); r(12, 22, 2, 14, '#936987'); r(19, 22, 2, 14, '#936987'); r(9, 34, 15, 3, '#1a172b');
      r(10, 3, 13, 19, '#181728'); r(12, 7, 9, 10, '#b6b1ad'); r(11, 4, 11, 5, '#252032'); r(12, 5, 2, 9, '#252032'); r(20, 5, 2, 12, '#252032'); r(15, 12, 2, 1, '#aa568e'); r(19, 12, 2, 1, '#aa568e'); r(16, 16, 5, 1, '#716270');
      r(4, 21, 6, 9, '#4e3853'); r(24, 21, 5, 9, '#4e3853'); r(3, 29, 6, 3, '#ada59c'); r(25, 29, 5, 3, '#ada59c');
    } else if (kind === 'caster') {
      poly(c, [[15, 4], [23, 17], [24, 28], [15, 34], [7, 28], [8, 17]], '#344d50'); r(11, 13, 10, 12, '#547b71'); r(13, 15, 6, 9, '#84c9a2'); r(15, 17, 3, 5, '#d8e7af'); r(9, 10, 14, 3, '#b49460'); r(9, 25, 14, 3, '#b49460'); r(14, 5, 4, 6, '#9c7761'); r(15, 0, 2, 6, '#4c6974');
      r(6, 30, 3, 7, '#4c6974'); r(22, 29, 3, 7, '#4c6974'); r(13, 31, 3, 7, '#42626a');
    } else {
      r(10, 27, 5, 9, '#2e2c45'); r(19, 27, 5, 9, '#2e2c45'); r(8 - walk, 35, 8, 3, '#7b657d'); r(19 + walk, 35, 7, 3, '#7b657d');
      r(9, 15, 16, 15, '#59455f'); r(11, 17, 12, 9, '#79627f'); r(12, 20, 10, 2, '#ad87a6'); r(16, 17, 3, 12, '#3d344e'); r(8, 27, 18, 3, '#998568');
      r(10, 6, 14, 10, '#373147'); r(9, 4, 16, 5, '#6a586c'); r(14, 11, 3, 2, '#e9a3ba'); r(20, 11, 2, 2, '#e9a3ba');
      if (kind === 'shield') { r(20, 14, 11, 21, '#b59b75'); r(22, 15, 8, 18, '#4b4059'); }
      else { r(28, 10, 2, 23, '#bfb1a3'); r(27, 28, 4, 2, C.gold); }
    }
    return out;
  }

  function drawCrescentSlash(c, fx) {
    const p = 1 - K.clamp(fx.life / (fx.maxLife || .22), 0, 1);
    const alpha = K.clamp(1 - p * p, 0, 1);
    const palettes = {
      smash: ['#ff5938', '#ffcb63', '#fffbe0'],
      pillar: ['#3cd9c6', '#a8ffdf', '#f5fffa'],
      thrust: ['#4d88ff', '#a8dcff', '#ffffff'],
      riposte: ['#ff385c', '#ffd269', '#ffffff'],
      boss: ['#9e32d9', '#f08cff', '#ffe8ff']
    };
    const [outerCol, midCol, coreCol] = palettes[fx.style] || palettes.smash;
    const rad = (fx.radius || 58) * (0.86 + p * 0.28);

    c.save();
    c.translate(fx.x, fx.y);
    if (!fx.spin) c.scale(fx.face || 1, fx.combo === 2 ? -1 : 1);
    c.globalCompositeOperation = 'lighter';

    const arcs = fx.spin ? [0, Math.PI] : [0];
    for (const baseRot of arcs) {
      c.save();
      c.rotate(baseRot + (fx.spin ? p * 2.6 : -0.45 + p * 0.85));
      const start = -1.25, end = 1.15, steps = 14;
      const drawBand = (thick, col, aMul, rOff = 0) => {
        c.globalAlpha = alpha * aMul;
        c.fillStyle = col;
        c.beginPath();
        for (let i = 0; i <= steps; i++) {
          const u = i / steps, ang = start + (end - start) * u;
          const taper = Math.sin(u * Math.PI);
          const rr = rad + rOff + taper * thick * 0.55;
          const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr * (fx.spin ? 0.52 : 0.76);
          i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
        for (let i = steps; i >= 0; i--) {
          const u = i / steps, ang = start + (end - start) * u;
          const taper = Math.sin(u * Math.PI);
          const rr = rad + rOff - taper * thick * 0.45;
          const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr * (fx.spin ? 0.52 : 0.76);
          c.lineTo(x, y);
        }
        c.closePath();
        c.fill();
      };
      drawBand(22, outerCol, 0.48, 0);
      drawBand(11, midCol, 0.82, 2);
      drawBand(4, coreCol, 0.95, 4);
      c.restore();
    }
    c.restore();
  }

  function drawThrustBeam(c, fx) {
    const p = 1 - K.clamp(fx.life / (fx.maxLife || .28), 0, 1);
    const alpha = K.clamp(1 - p * p, 0, 1);
    const w = fx.w || 110;
    const h = fx.heavy ? 18 : 9;
    const face = fx.face || 1;
    c.save();
    c.translate(fx.x, fx.y);
    c.scale(face, 1);
    c.globalCompositeOperation = 'lighter';

    // Outer azure-gold spear flare
    c.globalAlpha = alpha * 0.55;
    poly(c, [[0, -h], [w * 0.82, -h * 0.65], [w + 18, 0], [w * 0.82, h * 0.65], [0, h]], fx.heavy ? '#5ca0ff' : '#e89c4a');
    c.globalAlpha = alpha * 0.9;
    poly(c, [[0, -h * 0.45], [w * 0.88, -h * 0.28], [w + 22, 0], [w * 0.88, h * 0.28], [0, h * 0.45]], '#ffe48f');
    c.globalAlpha = alpha;
    poly(c, [[4, -2], [w, -1.5], [w + 24, 0], [w, 1.5], [4, 2]], '#ffffff');

    // Expanding sonic wind rings along the shaft!
    const ringCount = fx.heavy ? 4 : 2;
    c.strokeStyle = fx.heavy ? '#a8e4ff' : '#ffe8a8';
    c.lineWidth = 2;
    for (let i = 0; i < ringCount; i++) {
      const rx = 26 + i * (w * 0.24) + p * 18;
      const ry = (fx.heavy ? 18 : 11) * (1 + p * 0.45) * (1 - i * 0.12);
      c.globalAlpha = alpha * (0.75 - i * 0.14);
      c.beginPath();
      c.ellipse(rx, 0, 5, ry, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  }

  K.Renderer = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.c = canvas.getContext('2d', { alpha: false });
      this.c.imageSmoothingEnabled = false;
      this.camera = 0;
      this.zoom = 1;
      this.sprites = {}; this.flashSprites = {}; this.backgrounds = {}; this.clock = 0;
      for (const k of ['monkey', 'blade', 'shield', 'caster', 'spear', 'warden', 'macaque', 'boss']) {
        for (let f = 0; f < 6; f++) {
          this.sprites[k + f] = sprite(k, f);
          const flash = document.createElement('canvas'); flash.width = 64; flash.height = 80;
          const fc = flash.getContext('2d'); fc.drawImage(this.sprites[k + f], 0, 0);
          fc.globalCompositeOperation = 'source-atop'; fc.globalAlpha = .7; fc.fillStyle = '#ffe2b2'; fc.fillRect(0, 0, 64, 80);
          this.flashSprites[k + f] = flash;
        }
      }
    }

    background(stage) {
      if (this.backgrounds[stage]) return this.backgrounds[stage];
      const out = document.createElement('canvas'); out.width = 960; out.height = 540; const c = out.getContext('2d'); const theme = K.STAGES[stage];
      for (let i = 0; i < 18; i++) pixel(c, 0, i * 30, 960, 30, i < 6 ? theme.sky : i < 11 ? '#29243a' : i < 15 ? '#393147' : '#4a3f50');
      poly(c, [[0, 380], [0, 298], [162, 274], [291, 253], [484, 336], [672, 284], [830, 269], [960, 285], [960, 460]], '#3c3c50');
      this.backgrounds[stage] = out; return out;
    }

    person(kind, x, y, face = 1, frame = 0, alpha = 1, flash = false, scaleX = 1, scaleY = 1, tilt = 0) {
      const c = this.c; c.save(); c.globalAlpha = alpha;
      c.translate(Math.round(x + 12), Math.round(y + 44));
      if (tilt) c.rotate(tilt);
      c.scale(face * scaleX, scaleY);
      c.drawImage((flash ? this.flashSprites : this.sprites)[kind + frame] || this.sprites['blade0'], -32, -74, 64, 80);
      c.restore();
    }

    platform(p) {
      const c = this.c;
      pixel(c, p.x, p.y, p.w, p.h, '#252b39');
      pixel(c, p.x, p.y, p.w, 3, '#d9c394');
    }

    draw(s, ui, dt = .016) {
      this.clock += dt;
      const c = this.c; const stage = s?.stage || 0;
      c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
      if (!s || ui === 'menu') {
        c.drawImage(this.background(0), 0, 0);
        this.titleScene(this.clock);
        return;
      }

      const t = this.clock;
      const target = K.clamp(s.player.x - 300, 0, s.room.width - 960);
      this.camera += (target - this.camera) * (1 - Math.exp(-dt * 11));
      if (Math.abs(this.camera - target) < .5) this.camera = target;

      const targetZoom = 1 + (ui === 'playing' ? (s.zoomPunch || 0) : 0);
      this.zoom += (targetZoom - this.zoom) * (1 - Math.exp(-dt * 16));

      // Draw Multi-Layer Parallax Backdrop & Volumetric Light Rays
      if (this.drawParallaxBackdrop) this.drawParallaxBackdrop(stage, this.camera, t);
      else c.drawImage(this.background(stage), 0, 0);

      const shakeX = ui === 'playing' && s.shake > 0 && this.shake !== false ? Math.sin(t * 155) * s.shake * 16 : 0;
      const shakeY = ui === 'playing' && s.shake > 0 && this.shake !== false ? Math.cos(t * 130) * s.shake * 9 : 0;

      const focusScreenX = K.clamp(s.player.x + 12 - this.camera, 160, 800);
      const focusScreenY = K.clamp(s.player.y + 22, 160, 440);

      c.save();
      if (Math.abs(this.zoom - 1) > 0.002) {
        c.translate(focusScreenX, focusScreenY);
        c.scale(this.zoom, this.zoom);
        c.translate(-focusScreenX, -focusScreenY);
      }
      c.translate(-Math.round(this.camera) + Math.round(shakeX), Math.round(shakeY));

      for (const pl of s.room.platforms) this.platform(pl);
      if (this.drawWorldObjects) this.drawWorldObjects(s, t);

      for (const h of s.room.hazards) {
        for (let x = h.x; x < h.x + h.w; x += 11) {
          poly(c, [[x, h.y + h.h], [x + 5, h.y - 5], [x + 11, h.y + h.h]], '#c772b0');
          poly(c, [[x + 3, h.y + h.h], [x + 5, h.y - 2], [x + 8, h.y + h.h]], '#f5b8e2');
        }
        pixel(c, h.x, h.y + h.h - 3, h.w, 3, '#573c59');
      }

      for (const q of s.room.seals) {
        if (this.drawSeal && K.ImageArt?.images.enemies) { this.drawSeal(q); continue; }
        if (q.hp > 0) pixel(c, q.x + 6, q.y + 4, 16, 34, '#c984c2');
      }

      for (const item of s.room.pickups) if (!item.used) {
        const y = item.y + Math.round(Math.sin(t * 3.5 + item.x) * 4);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35;
        c.fillStyle = item.kind === 'heal' ? '#8ce884' : '#6ce0eb';
        c.beginPath(); c.arc(item.x + 8, y + 9, 14 + Math.sin(t * 5) * 2, 0, Math.PI * 2); c.fill();
        c.restore();
        this.lotus(item.x + 8, y + 8, 11, item.kind === 'heal' ? '#c8eba4' : '#95e5e8', false);
      }

      if (stage < 3 && this.drawGate) this.drawGate(s.room.exit, s.room.seals.every(q => q.hp === 0));

      // Tumbling Ragdoll Corpses!
      for (const cp of (s.room.corpses || [])) {
        const a = K.clamp(cp.life / cp.maxLife, 0, 1);
        this.person(cp.kind, cp.x, cp.y, cp.face, 4, a * 0.85, cp.life > cp.maxLife * 0.65, 1, 1, cp.rot);
      }

      // Enemies + Stasis Glyphs + Awakened Wutian Cosmic Beam!
      for (const e of s.room.enemies) if (e.hp > 0) {
        pixel(c, e.x - 2, e.y + e.h - 1, e.w + 4, 4, '#141b26');
        if (e.kind === 'boss') {
          const col = e.phase === 'recover' ? '#ffe082' : e.archForm ? '#e075ff' : '#9c5cb0';
          const petals = e.archForm ? 14 : 9;
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .68;
          for (let i = 0; i < petals; i++) {
            const ang = t * (e.archForm ? 2.1 : .95) + i * (Math.PI * 2 / petals);
            const rx = e.phase === 'recover' ? 48 : 42;
            pixel(c, e.x + 24 + Math.cos(ang) * rx, e.y + 28 + Math.sin(ang) * 44, 4, 4, col);
          }
          c.restore();

          if (e.phase === 'beam-windup') {
            const bx = e.face > 0 ? e.x + 36 : e.x - 520;
            c.save(); c.globalCompositeOperation = 'lighter';
            c.globalAlpha = .35 + Math.sin(t * 28) * .2;
            pixel(c, bx, 402, 520, 6, '#e882ff');
            pixel(c, bx, 404, 520, 2, '#ffffff');
            c.restore();
          } else if (e.phase === 'beam') {
            const bx = e.face > 0 ? e.x + 32 : e.x - 520;
            c.save(); c.globalCompositeOperation = 'lighter';
            c.globalAlpha = .55; pixel(c, bx, 382, 520, 46, '#9628d4');
            c.globalAlpha = .85; pixel(c, bx, 392, 520, 26, '#e278ff');
            c.globalAlpha = 1.0; pixel(c, bx, 400, 520, 10, '#ffffff');
            c.restore();
          }
        }

        const f = e.phase === 'attack' ? 5 : e.phase.includes('windup') ? 4 : Math.floor(t * 3.5) % 4;
        const hitSquashX = 1 + Math.abs(e.hitTilt || 0) * 0.35;
        const hitSquashY = 1 - Math.abs(e.hitTilt || 0) * 0.22;
        this.person(e.kind, e.x, e.y, e.face, f, 1, e.flash > 0, (e.kind === 'boss' ? 1.12 : 1) * hitSquashX, (e.kind === 'boss' ? 1.12 : 1) * hitSquashY, e.hitTilt || 0);

        // Golden Immobilize Stasis Hex-Seal & 【定】 Glyph!
        if ((e.frozen || 0) > 0) {
          const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
          c.save();
          c.globalCompositeOperation = 'lighter';
          c.strokeStyle = '#ffe27a';
          c.lineWidth = 2;
          c.globalAlpha = .78;
          c.beginPath();
          for (let i = 0; i < 6; i++) {
            const ang = t * 1.6 + i * Math.PI / 3;
            const px = cx + Math.cos(ang) * 24, py = cy + Math.sin(ang) * 28;
            i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
          }
          c.closePath(); c.stroke();
          c.font = 'bold 15px SimSun, serif';
          c.fillStyle = '#fff3b0';
          c.textAlign = 'center';
          c.fillText('定', cx, e.y - 8 + Math.sin(t * 8) * 2);
          c.restore();
        }

        if (e.kind !== 'boss' && (e.hp < e.maxHp || e.kind === 'warden' || e.kind === 'macaque')) {
          const bw = (e.kind === 'warden' || e.kind === 'macaque') ? 54 : 36;
          const bx = e.x + e.w / 2 - bw / 2;
          pixel(c, bx, e.y - 22, bw, 4, '#23192b');
          pixel(c, bx, e.y - 22, Math.ceil(bw * e.hp / e.maxHp), 4, e.kind === 'macaque' ? '#ff78b0' : e.kind === 'warden' ? '#df9ee8' : '#d47b91');
        }
        if (e.phase.includes('windup') && (e.frozen || 0) <= 0) {
          c.save(); c.globalCompositeOperation = 'lighter';
          pixel(c, e.x + e.w / 2 - 2, e.y - 36, 5, 11, '#ffda78');
          pixel(c, e.x + e.w / 2 - 2, e.y - 22, 5, 4, '#ffda78');
          if (e.kind === 'boss' && e.phase === 'sweep-windup') {
            const b = K.enemyAttackBox(e); pixel(c, b.x, b.y + b.h - 4, b.w, 4, '#e678cf');
          } else if (['blade', 'shield', 'spear', 'warden', 'macaque'].includes(e.kind)) {
            const b = K.enemyAttackBox(e); pixel(c, b.x, b.y + b.h - 3, b.w, 3, e.kind === 'macaque' || e.kind === 'spear' ? '#df82ff' : '#f2c26b');
          }
          c.restore();
        }
      }

      const p = s.player;
      const below = s.room.platforms.filter(q => q.y >= p.y + p.h - 3 && p.x + p.w > q.x && p.x < q.x + q.w).sort((a, b) => a.y - b.y)[0];
      if (below) { const w = K.clamp(36 - (below.y - p.y - p.h) * .12, 12, 36); pixel(c, p.x + 12 - w / 2, below.y - 2, w, 3, '#131b26'); }

      // Pillar Stance Golden Ruyi Staff Column when perched!
      if ((p.pillarPerch || 0) > 0 && below) {
        const colH = Math.max(24, below.y - (p.y + p.h - 6));
        c.save();
        pixel(c, p.x + 9, p.y + p.h - 6, 7, colH, '#b85a3a');
        pixel(c, p.x + 9, p.y + p.h - 6, 7, 14, '#ffd875');
        pixel(c, p.x + 9, below.y - 14, 7, 14, '#ffd875');
        pixel(c, p.x + 11, p.y + p.h - 6, 2, colH, '#fff5c2');
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55;
        c.strokeStyle = '#7ef5df'; c.lineWidth = 2;
        c.beginPath(); c.ellipse(p.x + 12, p.y + p.h, 22, 6, 0, 0, Math.PI * 2); c.stroke();
        c.restore();
      }

      // 5-Ghost Gradient Motion Trail!
      const trails = s.effects.filter(f => f.kind === 'trail').slice(-5);
      trails.forEach((fx, idx) => {
        const ratio = (idx + 1) / (trails.length + 1);
        this.person('monkey', fx.x, fx.y, fx.face, 0, ratio * .32, false, 1.12, 0.92, fx.face * 0.08);
      });

      // Multi-Monkey Squad Clones!
      const cloneList = s.clones?.length ? s.clones : (s.clone ? [s.clone] : []);
      for (const cl of cloneList) {
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .42;
        pixel(c, cl.x - 8, cl.y + 43, 40, 3, '#7ef0e3');
        c.restore();
        this.person('monkey', cl.x, cl.y, cl.face, Math.floor(t * 10 + cl.x) % 4, .66, false, 1, 1, cl.face * 0.05);
      }

      // Wukong with Squash-Stretch & Velocity Lean!
      const lean = p.dash > 0 ? p.face * 0.14 : (p.grounded && Math.abs(p.vx) > 40 ? (p.vx / 245) * 0.08 : 0);
      this.person('monkey', p.x, p.y, p.face,
        p.grounded ? Math.abs(p.vx) > 30 ? Math.floor(t * 13) % 4 : 0 : 2,
        p.invuln > 0 && (p.rockSolid || 0) <= 0 && Math.floor(t * 18) % 2 ? .55 : 1,
        (p.rockSolid || 0) > 0,
        p.squashX || 1, p.squashY || 1, lean);

      // Rock Solid Vajra Aura!
      if ((p.rockSolid || 0) > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        c.strokeStyle = '#ffd970'; c.lineWidth = 2.5; c.globalAlpha = .85;
        c.beginPath();
        c.moveTo(p.x + 12, p.y - 10); c.lineTo(p.x + 34, p.y + 22);
        c.lineTo(p.x + 12, p.y + 50); c.lineTo(p.x - 10, p.y + 22);
        c.closePath(); c.stroke();
        c.restore();
      }

      // Golden Ward Shield Shimmer
      if ((p.ward || 0) > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        c.strokeStyle = '#f5d782'; c.globalAlpha = .34 + Math.sin(t * 5) * .1; c.lineWidth = 1.8;
        c.beginPath(); c.ellipse(p.x + 12, p.y + 22, 19, 27, 0, 0, Math.PI * 2); c.stroke();
        c.restore();
      }
      if ((p.riposte || 0) > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        pixel(c, p.x + 7, p.y - 13, 10, 3, '#ffe794');
        pixel(c, p.x + 11, p.y - 17, 2, 11, '#ffffff');
        c.restore();
      }
      if (p.slam) {
        c.save(); c.globalCompositeOperation = 'lighter';
        poly(c, [[p.x + 2, p.y - 12], [p.x + 12, p.y + 56], [p.x + 22, p.y - 12]], '#ff9d52');
        poly(c, [[p.x + 8, p.y - 6], [p.x + 12, p.y + 58], [p.x + 16, p.y - 6]], '#fff6c4');
        c.restore();
      }

      // Magnetic Spirit Essence Motes!
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const m of (s.room.motes || [])) {
        const pulse = 3.5 + Math.sin(t * 14 + m.x) * 1;
        c.globalAlpha = .45; c.fillStyle = '#ffd266';
        c.beginPath(); c.arc(m.x, m.y, pulse * 2.1, 0, Math.PI * 2); c.fill();
        c.globalAlpha = .95; c.fillStyle = '#fff8cf';
        c.beginPath(); c.arc(m.x, m.y, pulse * 0.85, 0, Math.PI * 2); c.fill();
      }
      c.restore();

      // Projectiles with Glowing Trails
      for (const b of s.projectiles) {
        const col = b.flameWave ? '#ff8447' : b.friendly ? '#7ef0df' : '#e07cd0';
        c.save(); c.globalCompositeOperation = 'lighter';
        c.globalAlpha = .42;
        c.fillStyle = col;
        c.beginPath(); c.arc(b.x + b.w / 2, b.y + b.h / 2, b.w * 0.9, 0, Math.PI * 2); c.fill();
        c.globalAlpha = .95;
        pixel(c, b.x - Math.sign(b.vx) * 12, b.y + 3, 12, b.h - 6, col);
        pixel(c, b.x, b.y, b.w, b.h, col);
        pixel(c, b.x + 3, b.y + 3, b.w - 6, b.h - 6, '#ffffff');
        c.restore();
      }

      // Physics Sparks!
      if (s.particles?.length) {
        c.save(); c.globalCompositeOperation = 'lighter';
        for (const pt of s.particles) {
          c.globalAlpha = K.clamp(pt.life / .3, 0, 1);
          c.fillStyle = pt.color;
          c.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
        }
        c.restore();
      }

      for (const fx of s.effects) this.fx(fx, t);
      c.restore();

      // Foreground Parallax Vignette Pillars & Atmospheric Weather
      if (this.drawForegroundWeather) this.drawForegroundWeather(stage, this.camera, t);

      // Impact Screen Flash
      if ((s.flashAlpha || 0) > 0.01 && ui === 'playing') {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = s.flashAlpha;
        c.fillStyle = '#ffe5a8';
        c.fillRect(0, 0, 960, 540);
        c.restore();
      }

      pixel(c, 0, 0, 960, 2, '#887661'); pixel(c, 0, 538, 960, 2, '#534a50');
    }

    lotus(x, y, r, color, large) {
      const c = this.c;
      for (let i = 0; i < 7; i++) {
        const ang = -Math.PI + i * Math.PI / 6, px = x + Math.cos(ang) * r * .65, py = y + Math.sin(ang) * r * .55;
        poly(c, [[x, y], [px - r * .22, py], [px, py - r * .30], [px + r * .22, py]], color);
      }
      pixel(c, x - r * .65, y, r * 1.3, large ? 6 : 3, color);
    }

    titleScene(t) {
      const c = this.c;
      this.person('monkey', 728, 316, 1, 0, 1, false, 2.0, 2.0);
    }

    fx(fx, t) {
      const c = this.c;
      if (fx.kind === 'slash-arc') { drawCrescentSlash(c, fx); return; }
      if (fx.kind === 'thrust-beam') { drawThrustBeam(c, fx); return; }

      const a = K.clamp(fx.life / (fx.kind === 'fire-pool' ? .5 : .32), 0, 1);
      c.save();
      const col = fx.color || '#efd3a0';
      if (['hit', 'hurt', 'block', 'dust'].includes(fx.kind)) {
        c.globalCompositeOperation = fx.kind === 'dust' ? 'source-over' : 'lighter';
        c.globalAlpha = a;
        for (let i = 0; i < 8; i++) {
          const ang = i * 2.1, dist = (.44 - fx.life) * 92;
          pixel(c, fx.x + Math.cos(ang) * dist, fx.y + Math.sin(ang) * dist, fx.kind === 'dust' ? 4 : 3, 3, fx.kind === 'hurt' ? '#ff7870' : col);
        }
      }
      if (fx.kind === 'ring' || fx.kind === 'insight-ring' || fx.kind === 'bell-wave') {
        c.globalCompositeOperation = 'lighter';
        const speed = fx.kind === 'bell-wave' ? 390 : fx.kind === 'insight-ring' ? 320 : 250;
        const r = (.52 - fx.life) * speed;
        const ringCol = fx.gold || fx.kind === 'insight-ring' || fx.kind === 'bell-wave' ? '#ffe07d' : fx.cyan ? '#7ef5e3' : fx.fire ? '#ff8547' : '#e6d8b5';
        const flat = fx.kind === 'insight-ring' || fx.kind === 'bell-wave' ? .78 : .28;
        c.globalAlpha = a * 0.85;
        c.strokeStyle = ringCol;
        c.lineWidth = fx.kind === 'insight-ring' ? 4 : 3;
        c.beginPath();
        c.ellipse(fx.x, fx.y, Math.max(2, r), Math.max(2, r * flat), 0, 0, Math.PI * 2);
        c.stroke();
      }
      if (fx.kind === 'pillar-smash') {
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = a;
        const w = fx.w || 150;
        const x0 = fx.face === 0 ? fx.x - w / 2 : (fx.face > 0 ? fx.x - w * .42 : fx.x - w * .58);
        const beamCol = fx.style === 'pillar' ? '#6cebd9' : '#ffad4d';
        // Towering vertical golden-jade shock pillar + ground fissure!
        if (fx.style === 'smash') {
          c.globalAlpha = a * 0.55;
          pixel(c, fx.x - 18, fx.y - 260, 36, 265, '#ff9d42');
          c.globalAlpha = a * 0.9;
          pixel(c, fx.x - 8, fx.y - 260, 16, 265, '#fff6c4');
        }
        c.globalAlpha = a * 0.85;
        pixel(c, x0, fx.y - 16, w, 14, beamCol);
        pixel(c, x0 + 8, fx.y - 12, w - 16, 6, '#ffffff');
      }
      if (fx.kind === 'fire-pool') {
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = a * 0.85;
        for (let i = -88; i <= 88; i += 11) {
          const fh = 6 + Math.floor(Math.abs(Math.sin(t * 14 + i)) * 12);
          pixel(c, fx.x + i, fx.y - fh, 8, fh, i % 22 === 0 ? '#fff0a6' : '#ff6d3b');
        }
      }
      c.restore();
    }
  };
})(globalThis.Kong ||= {});
