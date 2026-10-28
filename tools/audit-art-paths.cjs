// Supplement the atlas inventory: resolve what the live renderer actually asks
// for, including silent null returns before image() is ever called.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const mode = process.argv[2] || 'http';
const out = path.resolve(root, process.env.ART_PATH_DIR || 'evidence/art-recheck-v12/paths-' + mode);
const entry = path.resolve(root, process.env.GAME_ENTRY || 'release/index.html');
fs.mkdirSync(out, { recursive: true });
const report = { mode, method: 'Controlled render fixtures; trace all frame resolver nulls and requested IDs. Not a human playtest.', sha256: crypto.createHash('sha256').update(fs.readFileSync(entry)).digest('hex'), scenes: [], errors: [], network: [] };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  if (mode === 'file') { await context.setOffline(true); await context.route(/^https?:/, r => r.abort()); }
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('request', r => { if (/^https?:/.test(r.url())) report.network.push(r.url()); });
  report.browser = browser.version();
  try {
    await page.goto(mode === 'file' ? 'file:///' + entry.replace(/\\/g, '/') : 'http://127.0.0.1:5188/?art-paths=1');
    await page.evaluate(() => Promise.all([Kong.ImageArt.ready, Kong.DialogArtReady]));
    report.version = await page.evaluate(() => Kong.VERSION);
    const specs = [];
    for (let stage = 0; stage < 15; stage++) for (const difficulty of ['normal', 'challenge']) {
      for (const place of ['start', 'landmark', 'camp', 'arena', 'gate']) specs.push({ name: `${difficulty}-${stage}-${place}`, stage, difficulty, place });
      for (const state of ['full', 'available', 'claimed']) specs.push({ name: `${difficulty}-${stage}-items-${state}`, stage, difficulty, place: 'items', state });
    }
    for (const hero of ['wukong', 'nezha', 'erlang']) for (const face of [-1, 1]) {
      for (const state of ['ward', 'secondary', 'ability', 'ultimate', 'death']) specs.push({ name: `${hero}-${face}-${state}`, hero, face, state, place: 'hero', stage: 0 });
    }
    for (const spec of specs) {
      const result = await page.evaluate(spec => {
        const K = Kong, license = { normalClear: { difficulty: 'normal', complete: true, levels: 15, seconds: 1000, hits: 0, killed: 110, total: 110 } };
        const s = K.newRun('ART-PATHS-1028', 'staff', spec.hero || 'wukong', spec.difficulty || 'normal', license);
        K.enterRoom(s, spec.stage, true);
        const p = s.player, canvas = document.createElement('canvas');
        canvas.width = 960; canvas.height = 540;
        const r = new K.Renderer(canvas), calls = [], unresolved = [];
        const methods = ['image', 'frame', 'comboFrame', 'mapFrame', 'sceneFrame', 'signatureFrame', 'actorStateFrame', 'v8Frame', 'celestialFrame', 'campaignFrame', 'enemyMarkerFrame', 'cloudFrame', 'combatFrame', 'motionFrame', 'enemyEffectFrame'];
        for (const method of methods) if (r[method]) {
          const fn = r[method];
          r[method] = function (...args) {
            const value = fn.apply(this, args), id = String(args[0]);
            calls.push({ method, id });
            if (!value) unresolved.push({ method, id });
            return value;
          };
        }
        Object.assign(p, { x: 700, y: 396, grounded: true, invuln: 0, face: spec.face || 1 });
        if (spec.place === 'start') p.x = 80;
        if (spec.place === 'camp') p.x = s.room.camp.x;
        if (spec.place === 'arena') p.x = s.room.arena.min + 180;
        if (spec.place === 'gate') { p.x = s.room.exit; s.room.enemies.forEach(e => e.hp = 0); }
        const floorAt = o => {
          const floors = s.room.platforms.filter(q => q.solid);
          const ground = floors.find(q => o.x >= q.x && o.x + o.w <= q.x + q.w) || floors.sort((a, b) => Math.abs(a.x + a.w / 2 - o.x) - Math.abs(b.x + b.w / 2 - o.x))[0];
          o.x = K.clamp(o.x, ground.x + 2, ground.x + ground.w - o.w - 2);
          o.y = ground.y - o.h;
        };
        if (spec.place === 'items') {
          s.room.enemies.forEach(e => e.hp = 0);
          p.x = 1000;
          p.hp = spec.state === 'full' ? K.maxHP(s) : 30;
          p.focus = spec.state === 'full' ? 100 : 15;
          p.rage = spec.state === 'full' ? 100 : 10;
          for (const [i, q] of s.room.pickups.slice(0, 3).entries()) { Object.assign(q, { enabled: true, used: spec.state === 'claimed', x: 1060 + i * 45, y: 420, kind: ['heal', 'focus', 'rage'][i] }); floorAt(q); }
          s.room.camp.used = spec.state === 'claimed';
        }
        if (spec.place === 'hero') {
          s.room.enemies.forEach(e => e.hp = 0);
          if (spec.state === 'ward') p.ward = 1;
          if (spec.state === 'secondary') {
            p.secondaryPose = .2;
            if (s.hero === 'wukong') s.projectiles.push({ x: p.x + 60, y: p.y + 18, w: 26, h: 12, vx: p.face * 520, vy: 0, impact: 'staff-bolt', friendly: true });
            else if (s.hero === 'nezha') K.newRing(s, {});
            else { s.bow = { timer: .1, dx: p.face, dy: 0 }; s.arrows.push({ x: p.x + 60, y: p.y + 16, vx: p.face * 720, vy: 0 }); }
          }
          if (spec.state === 'ability') {
            if (s.hero === 'wukong') s.clone = { x: p.x + 80, y: p.y, w: 24, h: 44, life: 1, timer: .4, face: p.face };
            else if (s.hero === 'nezha') K.castSilk(s);
            else s.eye = { x: p.x - 50, y: p.y - 35, w: 280, h: 105, life: 3 };
          }
          if (spec.state === 'ultimate') { p.rage = 100; K.startUltimate(s); p.ultimate = .4; }
          if (spec.state === 'death') { p.hp = 0; s.mode = 'dead'; }
        }
        floorAt(p);
        r.camera = K.clamp(p.x - 300, 0, s.room.width - 960); r.clock = 1.2;
        r.draw(s, 'playing', 0);
        return { calls, unresolved, png: canvas.toDataURL(), hero: s.hero, stage: s.stage, realm: K.chapter(s.stage).id, camera: r.camera };
      }, spec);
      if (result.unresolved.length || spec.place === 'landmark' || spec.place === 'hero' || spec.place === 'items' && spec.stage % 3 === 0 && spec.difficulty === 'normal') {
        fs.writeFileSync(path.join(out, spec.name + '.png'), Buffer.from(result.png.split(',')[1], 'base64'));
      }
      delete result.png;
      report.scenes.push({ name: spec.name, ...result });
    }
  } catch (e) { report.failure = e.stack; process.exitCode = 1; }
  finally {
    await context.close(); await browser.close();
    report.unresolved = report.scenes.flatMap(s => s.unresolved.map(q => ({ scene: s.name, ...q })));
    report.pass = !report.failure && !report.errors.length && !report.unresolved.length && (mode !== 'file' || !report.network.length);
    fs.writeFileSync(path.join(out, 'references.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ version: report.version, scenes: report.scenes.length, unresolvedCount: report.unresolved.length, unresolvedKinds: [...new Set(report.unresolved.map(q=>q.method+':'+q.id))], errors: report.errors, failure: report.failure, pass: report.pass }));
    if (!report.pass) process.exitCode = 1;
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
