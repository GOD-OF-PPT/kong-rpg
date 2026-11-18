(function (K) {
  'use strict';
  const $ = id => document.getElementById(id), world = $('world');
  const renderer = new K.Renderer(world), audio = new K.Audio(), storage = new K.Storage();
  const loaded = storage.read();
  let state = loaded?.state || null, meta = loaded?.meta || K.cleanMeta();
  let screen = 'menu', backScreen = 'menu', codexTab = 'relics', starterPage = 0;
  let toastUntil = 0, cutinUntil = 0, lastSave = 0, pendingInputs = [];

  const settings = storage.readSettings();
  renderer.shake = settings.shake;
  audio.setVolume(settings.volume);
  audio.setMuted(settings.muted);

  const metrics = { frames: [], inputs: [], errors: [], started: performance.now() };
  const input = new K.Input(world, control, (t, code) => pendingInputs.push({ t: performance.now(), eventTime: t, code }));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const btn = (id, text, primary = false) => `<button type="button" id="${id}" class="button ${primary ? 'primary' : ''}">${text}</button>`;
  const on = (id, fn) => $(id)?.addEventListener('click', fn);
  const panel = (label, eyebrow, title, body) => `<section class="panel" aria-label="${label}"><div class="eyebrow">${eyebrow}</div><h2>${title}</h2>${body}</section>`;

  function syncTopControls() {
    const m = $('mute-top');
    if (m) m.textContent = settings.muted || settings.volume <= 0.001 ? '音律 · 寂' : '音律 · 启';
    const tb = $('touch-btn');
    if (tb) tb.classList.toggle('active', !!settings.touch);
    const tp = $('touch-controls');
    if (tp) tp.hidden = !(screen === 'playing' && settings.touch);
  }

  function toast(text, seconds = 2.8) {
    $('toast').textContent = text;
    $('toast').hidden = false;
    toastUntil = performance.now() + seconds * 1000;
  }

  function showCutin(text) {
    if (!text) return;
    const el = $('cutin-banner');
    $('cutin-text').textContent = text;
    el.hidden = false;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    cutinUntil = performance.now() + 740;
  }

  function save() {
    if (!state) return;
    K.evaluateSeals(state, meta);
    storage.write(state, meta);
    $('storage-status').textContent = storage.available ? '独立离线版 · 旅程已保存' : '自动存储不可用 · 请导出存档';
    lastSave = performance.now();
  }

  function relicBadgeIcon(r) {
    const url = r.icon >= 0 && K.relicIconURL ? K.relicIconURL(r.icon) : '';
    if (url) return `<div class="relic-icon-wrap"><img src="${url}" alt="${esc(r.name)}"></div>`;
    return `<span class="relic-glyph" style="color:${r.color}">${r.glyph}</span>`;
  }

  function show(next) {
    screen = next;
    input.setActive(next === 'playing');
    $('stage').dataset.mode = next;
    if (next !== 'playing') { pendingInputs = []; $('toast').hidden = true; toastUntil = 0; $('cutin-banner').hidden = true; }
    $('hud').hidden = !state || ['menu', 'prologue', 'start', 'legacy', 'codex'].includes(next);
    KongSafeDOM.render($('overlay'), '');
    $('pause').disabled = !['playing', 'paused'].includes(next);
    $('combat-labels').hidden = next !== 'playing';
    syncTopControls();
    if (next === 'playing') { world.focus({ preventScroll: true }); hud(); return; }
    const render = { menu, prologue, start: starter, paused: pauseMenu, help, codex, forge: forgeMenu, reward, replace: replaceRelic, dead: ending, won: ending, epilogue, legacy: legacyMenu, history };
    render[next]?.();
    requestAnimationFrame(() => $('overlay').querySelector('button:not(:disabled),input')?.focus({ preventScroll: true }));
  }

  function menu() {
    const resumable = state && ['paused', 'playing', 'reward', 'forge'].includes(state.mode);
    const sealCount = (meta.seals || []).length;
    KongSafeDOM.render($('overlay'), `<div class="hero">
      <div class="eyebrow">西游记后传 · 像素横版动作肉鸽</div>
      <h1><small>大 圣</small>劫后行</h1>
      <div class="english-title">AFTER THE BLACK LOTUS · 法天象地</div>
      <p>劈、立、戳三势随心易换；定身、铜头、群猿神通破局。<br>碎雷火、淬金箍、斩心魔六耳，直面无天六臂灭世法相。</p>
      <div class="actions">
        ${btn('begin', '踏上劫途 <small>→</small>', true)}
        ${resumable ? btn('resume', '继续旅程') : btn('how', '初行指南')}
        ${btn('open-codex', `法相录 (${sealCount}/${K.SEALS_CODEX.length})`)}
      </div>
      <div class="seed-edit">
        <label for="seed">本局因缘</label>
        <input id="seed" aria-label="随机种子" maxlength="32" value="${esc(state?.seed || 'LOTUS-1025')}">
        <button type="button" id="random-seed" class="text-button" aria-label="生成新种子">换一签 ↻</button>
      </div>
      <div class="hero-meta">
        <span><b>${meta.runs}</b> 次入劫</span>
        <span><b>${meta.wins}</b> 次破局</span>
        <span><b>${sealCount}</b> 枚破劫印</span>
        <button type="button" id="past" class="text-button">往昔旅程 ↗</button>
        ${storage.legacy ? '<button type="button" id="old" class="text-button">旧版旅程 ↗</button>' : ''}
      </div>
    </div>
    <div class="scene-label">三势如意 · 七十二变<span>佛魔一念 · 一棒澄明</span></div>`);
    on('begin', () => { K.pendingSeed = $('seed').value.trim() || 'LOTUS-1025'; starterPage = 0; audio.unlock(); show(meta.runs === 0 ? 'prologue' : 'start'); });
    on('resume', resume);
    on('how', () => openHelp('menu'));
    on('open-codex', () => openCodex('menu'));
    on('past', () => show('history'));
    on('old', () => show('legacy'));
    on('random-seed', () => { audio.unlock(); $('seed').value = 'LOTUS-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 6).toUpperCase(); });
  }

  function prologue() {
    KongSafeDOM.render($('overlay'), panel('开篇', '序 · 法天象地', '三界的灯，还没有熄',
      `<p class="story-copy">无天的黑莲遮住灵山，暗河古镜里更映出心魔六耳猕猴的凶芒。<br><br>你是孙悟空。按 <b>Q</b> 在「劈棍、立棍、戳棍」三势间行云流水，按 <b>F</b> 一字定身、按 <b>C</b> 铜头震岳、按 <b>L</b> 拔毛唤群猿；<br>收集灵蕴于神龛重铸金箍棒，叩开黑莲法界，轰碎无天六臂灭世元神！</p>
      <div class="journey-map"><span>壹<br><b>雾隐山道</b></span><i>―</i><span>贰<br><b>悬灯古渡</b></span><i>―</i><span>叁<br><b>灵山残庭</b></span><i>―</i><span>终<br><b>黑莲法界</b></span></div>
      <div class="actions">${btn('begin-relic', '握紧金箍棒', true)}${btn('back', '返回')}</div>`));
    on('begin-relic', () => { audio.unlock(); show('start'); });
    on('back', () => show('menu'));
  }

  function cards(ids, owned = []) {
    return `<div class="cards">${ids.map((id, i) => {
      const r = K.relic(id);
      const syns = K.previewSynergies(owned, id);
      const synBadge = syns.length ? `<span class="synergy-hint">✦ 可结共鸣：${esc(syns.map(s => s.name).join(' · '))}</span>` : '';
      const awakeTag = state && K.isAwakened(state, id) ? ' · 真' : '';
      return `<button type="button" class="relic-card" data-relic="${id}" aria-label="选择${r.name}">
        <span class="num">0${i + 1}</span>
        ${relicBadgeIcon(r)}
        <h3>${r.name}${awakeTag}</h3>
        <span class="tag">${r.tag}</span>
        ${synBadge}
        <p>${state && K.isAwakened(state, id) && r.awake ? r.awake : r.text}</p>
        <span class="cost">${r.cost}</span>
      </button>`;
    }).join('')}</div>`;
  }

  function bindCards(fn) {
    for (const b of $('overlay').querySelectorAll('[data-relic]')) b.addEventListener('click', () => fn(b.dataset.relic));
  }

  function currentStarterSet() {
    const sets = [['cloud', 'echo', 'staff'], ['chakram', 'band', 'vase'], ['mirror', 'flame', 'mercy']];
    return sets[starterPage % sets.length];
  }

  function starter() {
    const picks = currentStarterSet();
    KongSafeDOM.render($('overlay'), panel('选择初始舍利', '启程 · 一念成法', '带哪一念入劫？',
      `<p class="subtitle">开局自带「劈/立/戳」三棍势 (Q) 与「定身 (F) · 铜头 (C) · 群猿 (L)」三大神通。<br>舍利可结成法相共鸣，击败古镜心魔更可开启第四枚本命舍利槽！</p>
      ${cards(picks, [])}
      <p class="starter-note">1 / 2 / 3 选择 · Q 切三势 · J 棍击 · U 耗势绝技 · F 定身 · C 铜头 · K 识破 · L 群猿</p>
      <div class="actions">${btn('cycle-starters', '轮换初始法门 ↻')}${btn('back', '返回')}</div>`));
    bindCards(startRun);
    on('cycle-starters', () => { starterPage = (starterPage + 1) % 3; starter(); });
    on('back', () => show('menu'));
  }

  function startRun(id) {
    state = K.newRun(K.pendingSeed || state?.seed || 'LOTUS-1025', id);
    meta.runs++;
    meta.seenRelics ||= [];
    if (!meta.seenRelics.includes(id)) meta.seenRelics.push(id);
    state.runId = state.seed + ':' + meta.runs + ':' + Date.now();
    renderer.camera = 0;
    audio.unlock();
    show('playing');
    toast(K.STAGES[0].lore, 4.2);
    save();
  }

  function resume() {
    if (!state) return;
    audio.unlock();
    if (state.mode === 'paused' || state.mode === 'forge') state.mode = 'playing';
    show(state.mode === 'reward' && state.pendingRelic ? 'replace' : state.mode);
  }

  function forgeMenu() {
    const ess = state.essence || 0;
    const unawake = state.relics.find(r => !K.isAwakened(state, r));
    const grid = `<div class="cards four-grid">${K.FORGE_UPGRADES.map((u, i) => {
      const boughtMind = u.id === 'mind' && (state.forgeBuys || []).includes('mind');
      const noAwake = u.id === 'awaken' && !unawake;
      const disabled = ess < u.cost || boughtMind || noAwake;
      const status = boughtMind ? '已修成' : noAwake ? '无可点化舍利' : `消耗 ${u.cost} 灵蕴`;
      return `<button type="button" class="relic-card forge-card" data-forge="${u.id}" ${disabled ? 'disabled' : ''}>
        <span class="num">0${i + 1}</span>
        <h3><span style="color:#ffd878;margin-right:6px">【${u.glyph}】</span>${u.name}</h3>
        <p>${u.desc}</p>
        <span class="cost" style="color:${disabled ? '#8c8480' : '#ffe294'}">${status}</span>
      </button>`;
    }).join('')}</div>`;

    KongSafeDOM.render($('overlay'), panel('淬棒神龛', '神龛 · 三昧真火重铸', '金箍淬炼炉',
      `<p class="subtitle">当前持有灵蕴：<b style="color:#ffe388;font-size:15px">${ess}</b> · 当前棍法伤害倍率：<b>${Math.round(K.forgeMult(state) * 100)}%</b> · 生命上限：<b>${state.player.maxHp || 100}</b></p>
      ${grid}
      <div class="actions">${btn('leave-forge', '收棒出炉 (Esc)', true)}</div>`));
    for (const b of $('overlay').querySelectorAll('[data-forge]')) {
      b.addEventListener('click', () => {
        if (K.forgeBuy(state, b.dataset.forge)) {
          audio.event({ type: 'forge-buy' });
          save();
          forgeMenu();
        }
      });
    }
    on('leave-forge', () => { state.mode = 'playing'; show('playing'); toast('真火入棍，锋芒更盛！', 2.4); save(); });
  }

  function pauseMenu() {
    const syns = K.activeSynergies(state.relics);
    const st = K.stanceInfo(state.stanceStyle);
    KongSafeDOM.render($('overlay'), panel('暂停菜单', '暂歇 · 风停此刻', '此行尚未结束',
      `<p class="subtitle">${K.STAGES[state.stage].name} · 当前棍势：${st.name} · 灵蕴 ${state.essence || 0}<br>随身舍利 (${state.relics.length}/${state.maxRelics || 3})：${state.relics.map(id => K.relic(id).name + (K.isAwakened(state, id) ? '「真」' : '')).join(' / ') || '无'}${syns.length ? '<br>已结共鸣：' + syns.map(s => s.name).join(' · ') : ''}</p>
      <div class="actions">${btn('continue', '继续前行', true)}${btn('help', '行者手记')}${btn('pause-codex', '法相录')}</div>
      <div class="setting-row">
        <label for="volume">声音</label>
        <input id="volume" aria-label="音量" type="range" min="0" max="100" value="${Math.round(settings.volume * 100)}">
        <label><input id="shake" type="checkbox" ${settings.shake ? 'checked' : ''}> 屏幕震动</label>
        <label><input id="touch-opt" type="checkbox" ${settings.touch ? 'checked' : ''}> 触控按键</label>
      </div>
      <div class="actions">${btn('export', '导出存档')}${btn('import', '导入存档')}${btn('main-menu', '回到主菜单')}</div>
      <p class="notice">设置自动保留。导出 JSON 可完整备份当前三棍势、灵蕴锻造与舍利进度。</p>`));
    on('continue', resume);
    on('help', () => openHelp('paused'));
    on('pause-codex', () => openCodex('paused'));
    on('export', exportSave);
    on('import', () => $('import-file').click());
    on('main-menu', () => { save(); show('menu'); });
    $('volume').oninput = e => {
      settings.volume = Number(e.target.value) / 100;
      if (settings.volume > 0) settings.muted = false;
      audio.setMuted(settings.muted);
      audio.setVolume(settings.volume);
      storage.settings(settings);
      syncTopControls();
    };
    $('shake').onchange = e => { settings.shake = e.target.checked; renderer.shake = settings.shake; storage.settings(settings); };
    $('touch-opt').onchange = e => { settings.touch = e.target.checked; storage.settings(settings); syncTopControls(); };
  }

  function openHelp(back) { backScreen = back; show('help'); }
  function openCodex(back) { backScreen = back; show('codex'); }

  function help() {
    KongSafeDOM.render($('overlay'), panel('行者手记', '手记 · 三势神通破万劫', '棍有尽处，变化无穷',
      `<div class="help-grid">
        <div><h3>心猿三棍势与易势连携</h3><p>按 Q 随时切换「劈棍势（赤金裂地）」「立棍势（撑棍腾空避地面杀招）」「戳棍势（超远距离退寸进尺）」。出棍后紧接 Q 可触发 360°「易势闪击」；满棍势按 U 释放当前流派绝技！</p></div>
        <div><h3>三大本命神通</h3><p>F「定身法」锁住群敌与首领，连击叠满3次引爆金印崩裂；C「铜头铁臂」化金刚身弹反敌招，直得2段棍势与22定力；L「身外身法」拔毛唤出多尊猴影自主围猎。</p></div>
        <div><h3>毫巅识破与场景破坏</h3><p>迎着敌招按 K 闪身触发「毫巅识破」，令下一记 J 化为突进破甲的「破妄追击」。击碎途中「雷火丹瓮」可引发连环轰爆重创周围敌群，开启「灵蕴金匮」获海量灵蕴。</p></div>
        <div><h3>淬棒神龛与照妖古镜</h3><p>收集的灵蕴可在「淬棒神龛」按 E 重铸金箍棒伤、缩减神通冷却或点化真·舍利。在「照妖心魔镜」迎战宿敌六耳猕猴并取胜，可永久解锁第四枚舍利槽与火眼暴击！</p></div>
        <div><h3>九品舍利与法相共鸣</h3><p>特定双舍利结成「云影同归」「定海业火」等共鸣；破首座阵眼后按 E 借灯，右端山门过境恢复18生命与20定力。</p></div>
        <div><h3>无天正面减伤与六臂法相</h3><p>无天正面黑莲减伤，绕背、定身、金色收招或满势绝技可重创；半血以下无天将觉醒「六臂灭世元神法相」轰出紫电洪流，跃上高台、立棍腾空或铜头弹反皆可破局！</p></div>
      </div>
      <div class="actions">${btn('close-help', '记下了', true)}${btn('import', '导入存档')}${btn('old', '原版旅程')}</div>
      <p class="notice">新版不会覆盖旧版存档；v1 旅程可在保留的原版入口继续。</p>`));
    on('close-help', () => show(backScreen));
    on('import', () => $('import-file').click());
    on('old', () => show('legacy'));
  }

  function codex() {
    const seen = meta.seenRelics || [];
    const unlocked = meta.seals || [];
    let bodyHtml = '';
    if (codexTab === 'stances') {
      bodyHtml = `<div class="codex-grid">${K.STANCES.map(st => `<div class="codex-item">
        <span class="relic-glyph" style="color:${st.color};width:36px;height:36px;font-size:18px;flex-shrink:0">${st.glyph}</span>
        <div><h4>${st.name} · ${st.sub}</h4><p>${st.desc}</p><small>快捷键：按 Q 随时切换（连招中切势触发易势闪击）</small></div>
      </div>`).concat(K.SPELLS.map(sp => `<div class="codex-item">
        <span class="relic-glyph" style="color:#ffd878;width:36px;height:36px;font-size:18px;flex-shrink:0">${sp.glyph}</span>
        <div><h4>${sp.name} [${sp.key}]</h4><p>${sp.desc}</p><small>消耗：${sp.cost} 定力${sp.cd ? ' · 冷却 ' + sp.cd + 's' : ''}</small></div>
      </div>`)).join('')}</div>`;
    } else if (codexTab === 'relics') {
      bodyHtml = `<div class="codex-grid">${K.RELICS.map(r => {
        const isSeen = seen.includes(r.id) || (state?.relics || []).includes(r.id);
        return `<div class="codex-item">
          ${relicBadgeIcon(r)}
          <div>
            <h4>${r.name} <small style="display:inline;color:#9ab0a8">· ${r.tag}${isSeen ? ' (已结缘)' : ''}</small></h4>
            <p>${r.text}</p>
            <small>${r.awake}</small>
          </div>
        </div>`;
      }).join('')}</div>`;
    } else if (codexTab === 'synergies') {
      bodyHtml = `<div class="codex-grid">${K.SYNERGIES.map(syn => {
        const reqNames = syn.reqCount ? '携满三枚以上舍利' : syn.req.map(id => K.relic(id).name).join(' ＋ ');
        return `<div class="codex-item">
          <span class="relic-glyph" style="color:#ebd094;width:36px;height:36px;font-size:18px;flex-shrink:0">共</span>
          <div><h4>${syn.name}</h4><p>${syn.desc}</p><small>条件：${reqNames}</small></div>
        </div>`;
      }).join('')}</div>`;
    } else {
      bodyHtml = `<div class="codex-grid">${K.SEALS_CODEX.map(sl => {
        const done = unlocked.includes(sl.id);
        return `<div class="codex-item ${done ? '' : 'locked'}">
          <span class="relic-glyph" style="color:${done ? '#ffe094' : '#7b7882'};width:36px;height:36px;font-size:18px;flex-shrink:0">${done ? '印' : '封'}</span>
          <div><h4>${sl.name}</h4><p>${sl.desc}</p><small>${done ? '✦ 已证得此印' : '尚未达成'}</small></div>
        </div>`;
      }).join('')}</div>`;
    }

    KongSafeDOM.render($('overlay'), panel('大圣法相录', '图鉴 · 三势神通与九品圣物', '大圣法相录',
      `<div class="codex-tabs">
        <button type="button" class="tab-btn ${codexTab === 'stances' ? 'active' : ''}" data-tab="stances">三势与神通 (6)</button>
        <button type="button" class="tab-btn ${codexTab === 'relics' ? 'active' : ''}" data-tab="relics">九品舍利 (${K.RELICS.length})</button>
        <button type="button" class="tab-btn ${codexTab === 'synergies' ? 'active' : ''}" data-tab="synergies">法相共鸣 (${K.SYNERGIES.length})</button>
        <button type="button" class="tab-btn ${codexTab === 'seals' ? 'active' : ''}" data-tab="seals">十方破劫印 (${unlocked.length}/${K.SEALS_CODEX.length})</button>
      </div>
      ${bodyHtml}
      <div class="actions">${btn('close-codex', '合上法相录', true)}</div>`));
    for (const tb of $('overlay').querySelectorAll('[data-tab]')) {
      tb.addEventListener('click', () => { codexTab = tb.dataset.tab; codex(); });
    }
    on('close-codex', () => show(backScreen));
  }

  function reward() {
    save();
    const mid = state.rewardKind === 'mid';
    const syns = K.activeSynergies(state.relics);
    const cap = state.maxRelics || 3;
    KongSafeDOM.render($('overlay'), panel('舍利与补给', mid ? '阵眼已破 · 余灯尚温' : '此境已破 · 山门将启', mid ? '借这盏灯，调整解法' : '下一程，带哪一种解法？',
      `<p class="subtitle">${mid ? '选择后回到原地，仍可继续探索神龛、古钟与照妖古镜。' : '将前往「' + K.STAGES[state.stage + 1].name + '」，过境恢复18生命与20定力。'}<br>生命 ${Math.ceil(state.player.hp)} / ${state.player.maxHp || 100} · 定力 ${Math.floor(state.player.focus)} / 100 · 灵蕴 ${state.essence || 0} · 舍利 ${state.relics.length} / ${cap}${syns.length ? ' · 共鸣：' + syns.map(s => s.name).join('、') : ''}</p>
      ${cards(state.reward, state.relics)}
      <p class="starter-note">1 / 2 / 3 选择 · 已携带：${state.relics.map(id => K.relic(id).name + (K.isAwakened(state, id) ? '「真」' : '')).join(' / ')}</p>`));
    bindCards(choose);
  }

  function choose(id, replace) {
    const kind = state.rewardKind, result = K.choose(state, id, replace);
    if (result === 'replace') { show('replace'); save(); return; }
    if (result) {
      if (id !== 'rest') {
        meta.seenRelics ||= [];
        if (!meta.seenRelics.includes(id)) meta.seenRelics.push(id);
      }
      audio.event({ type: 'relic' });
      if (kind === 'exit') renderer.camera = 0;
      show('playing');
      const syns = K.activeSynergies(state.relics);
      toast(kind === 'exit' ? K.STAGES[state.stage].lore : (syns.length ? '法相共鸣：' + syns.map(x => x.name).join(' · ') : '灯火尚在，继续前行。'), 3.5);
      save();
    }
  }

  function replaceRelic() {
    const next = K.relic(state.pendingRelic);
    KongSafeDOM.render($('overlay'), panel('替换舍利', '舍利已满 · 有舍有得', '以何换取' + next.name + '？',
      `<p class="subtitle">将取得：${next.text}<br>选择一枚随身舍利放下，其余法相与生命不变；亦可返回改选借灯调息。</p>
      ${cards(state.relics, [])}
      <div class="actions">${btn('cancel-replace', '返回选择')}</div>`));
    bindCards(id => choose(state.pendingRelic, id));
    on('cancel-replace', () => { state.pendingRelic = null; show('reward'); save(); });
  }

  function settle() {
    const newly = K.evaluateSeals(state, meta);
    if (meta.history.some(x => x.id === state.runId)) return newly;
    const won = state.mode === 'won';
    if (won) meta.wins++;
    meta.best = Math.max(meta.best, won ? 4 : state.stage);
    const rk = K.rankRun(state);
    meta.history.push({
      id: state.runId, seed: state.seed, won, stage: state.stage,
      seconds: Math.floor(state.elapsed), damage: state.damageTaken,
      grade: rk.grade, relics: state.relics.slice()
    });
    meta.history = meta.history.slice(-8);
    save();
    return newly;
  }

  function ending() {
    const newly = settle();
    const won = state.mode === 'won', seconds = Math.floor(state.elapsed), time = Math.floor(seconds / 60) + '分' + seconds % 60 + '秒';
    const rk = K.rankRun(state);
    const syns = K.activeSynergies(state.relics);
    const sealLine = newly && newly.length ? `<br>新证破劫印：${newly.map(id => K.SEALS_CODEX.find(x => x.id === id)?.name).filter(Boolean).join(' · ')}` : '';
    KongSafeDOM.render($('overlay'), panel(won ? '胜利结算' : '失败结算', won ? '黑莲已散 · 万佛重光' : '劫途未尽 · 再起一念', won ? '三界重见微光' : '此身暂歇，棍心未折',
      `<div class="rank-banner">
        <div class="rank-info">
          <b>斗战评定 · ${rk.title}</b>
          <span>${rk.poem}</span>
        </div>
        <div class="rank-grade">${rk.grade}</div>
      </div>
      <p class="subtitle">${won ? '无天六臂黑莲法相终化飞灰，三境古灯一盏接一盏重明。' : '最后受创：' + esc(state.lastDamage) + '。善用 F 定身锁敌、C 铜头弹反与 Q 三势切换可轻松破局！'}</p>
      <div class="results">
        <div><small>此行</small><b>${time}</b></div>
        <div><small>破阵</small><b>${state.broken} / 6</b></div>
        <div><small>退敌</small><b>${state.kills}</b></div>
        <div><small>识破/震岳</small><b>${state.insights || 0}</b></div>
        <div><small>最高连击</small><b>${state.maxCombo || 0}</b></div>
        <div><small>承伤</small><b>${state.damageTaken}</b></div>
      </div>
      <p class="subtitle">因缘 ${esc(state.seed)} · 舍利：${state.relics.map(id => K.relic(id).name + (K.isAwakened(state, id) ? '「真」' : '')).join(' / ')}${syns.length ? ' · 共鸣：' + syns.map(s => s.name).join('、') : ''}${sealLine}</p>
      <div class="actions">${won ? btn('epilogue', '走出黑莲', true) : btn('retry', '同缘再行', true)}${won ? btn('retry', '同缘再行') : btn('new-path', '另启因缘')}${btn('export', '导出此行')}</div>`));
    on('retry', () => { K.pendingSeed = state.seed; show('start'); });
    on('new-path', () => show('menu'));
    on('export', exportSave);
    on('epilogue', () => show('epilogue'));
  }

  function epilogue() {
    KongSafeDOM.render($('overlay'), panel('尾声', '尾声 · 灯火人间', '前路，还有众生',
      `<p class="story-copy">山道上的寒雾散了。古渡口的金灯，终于照见对岸归家的人。<br><br>你没有把胜利留在莲台之上。你收起金箍棒，走回那些还需要微光的地方。<br>三势神通已入本心；下一程山色，仍在等你执棍相逢。</p>
      <div class="actions">${btn('again', '再入因缘', true)}${btn('back-result', '查看此行')}${btn('main-menu', '回到主菜单')}</div>`));
    on('again', () => { K.pendingSeed = 'LOTUS-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 6).toUpperCase(); show('start'); });
    on('back-result', () => show('won'));
    on('main-menu', () => show('menu'));
  }

  function history() {
    KongSafeDOM.render($('overlay'), panel('往昔旅程', '因缘簿 · 唯凭本心破局', '你走过的路',
      `<div class="history-list">${meta.history.length ? meta.history.slice().reverse().map(r => `<div><b>${r.won ? '破劫' : '止步' + K.STAGES[r.stage].name}${r.grade ? ' · [' + esc(r.grade) + ']' : ''}</b><span>${esc(r.seed)}</span><span>${Math.floor(r.seconds / 60)}分${r.seconds % 60}秒 · 伤${r.damage}</span><small>${r.relics.map(id => K.relic(id)?.name || id).join(' · ')}</small></div>`).join('') : '<p class="subtitle">尚无完整旅程记录。先握紧金箍棒，踏入雾隐山道。</p>'}</div>
      <div class="actions">${btn('back', '返回', true)}</div>`));
    on('back', () => show('menu'));
  }

  function legacyMenu() {
    KongSafeDOM.render($('overlay'), panel('原版旅程', '存档保护 · 旧路仍在', '在原来的规则中继续',
      `<p class="story-copy">v1 的地图与规则和新版不同。你的旧旅程不会被覆盖，也不会被悄悄搬到另一张地图。<br><br>${storage.legacy ? '可先下载旧档，再在打开的原版里通过「初行指南 → 导入存档」继续。' : '保留的原版可直接打开；如果你有旧 JSON 文件，请在原版的指南中导入。'}</p>
      <div class="actions">${btn('open-legacy', storage.legacy ? '备份旧档并打开原版' : '打开原版', true)}${btn('back', '返回新版')}</div>`));
    on('open-legacy', () => {
      if (storage.legacy) K.download(JSON.stringify(storage.legacy), '劫后行-v1-旧旅程.json');
      const legacy = document.querySelector('meta[name="kong-package"]') ? 'legacy-v1.html' : 'release/legacy-v1.html';
      window.open(new URL(legacy, location.href).href, '_blank', 'noopener');
      toast('已打开保留的原版；可通过手记导入旧旅程。', 4);
    });
    on('back', () => show('menu'));
  }

  function exportSave() {
    save();
    storage.export(state, meta);
    toast('已导出整段旅程，含三棍势、灵蕴淬炼与舍利法相。');
  }

  function toggleMute() {
    audio.unlock();
    settings.muted = !settings.muted;
    if (!settings.muted && settings.volume <= 0.02) settings.volume = .38;
    audio.setMuted(settings.muted);
    audio.setVolume(settings.volume);
    storage.settings(settings);
    syncTopControls();
  }

  function tapVirtual(code) {
    if (screen !== 'playing') return;
    audio.unlock();
    input.pressVirtual(code, true);
    setTimeout(() => input.pressVirtual(code, false), 45);
    world.focus({ preventScroll: true });
  }

  function control(action) {
    if (action === 'mute') { toggleMute(); return; }
    if (action === 'pause') {
      if (screen === 'playing') { state.mode = 'paused'; save(); show('paused'); }
      else if (screen === 'forge') { state.mode = 'playing'; show('playing'); }
      else if (screen === 'paused') resume();
      else if (screen === 'help' || screen === 'codex') show(backScreen);
      else if (screen === 'replace') { state.pendingRelic = null; show('reward'); }
      else if (['start', 'prologue', 'legacy', 'history'].includes(screen)) show('menu');
    }
    if (action === 'blur' && screen === 'playing') { state.mode = 'paused'; save(); show('paused'); }
  }

  on('pause', () => control('pause'));
  on('mute-top', toggleMute);
  on('touch-btn', () => { settings.touch = !settings.touch; storage.settings(settings); syncTopControls(); if (screen === 'playing') world.focus({ preventScroll: true }); });
  on('stance-btn', () => tapVirtual('KeyQ'));
  on('pillar-btn', () => tapVirtual('KeyU'));
  on('spell-immob', () => tapVirtual('KeyF'));
  on('spell-rock', () => tapVirtual('KeyC'));
  on('spell-clone', () => tapVirtual('KeyL'));

  on('codex-top', () => {
    const back = screen === 'playing' ? 'paused' : screen;
    if (screen === 'playing') { state.mode = 'paused'; save(); }
    openCodex(back === 'codex' || back === 'help' ? backScreen : back);
  });
  on('guide-top', () => {
    const back = screen === 'playing' ? 'paused' : screen;
    if (screen === 'playing') { state.mode = 'paused'; save(); }
    openHelp(back === 'help' || back === 'codex' ? backScreen : back);
  });
  on('brand', e => {
    e.preventDefault();
    if (screen === 'playing') { state.mode = 'paused'; save(); }
    show('menu');
  });

  for (const b of document.querySelectorAll('#touch-controls [data-key]')) {
    const code = b.dataset.key;
    b.addEventListener('pointerdown', e => { e.preventDefault(); audio.unlock(); input.pressVirtual(code, true); });
    b.addEventListener('pointerup', e => { e.preventDefault(); input.pressVirtual(code, false); });
    b.addEventListener('pointercancel', () => input.pressVirtual(code, false));
    b.addEventListener('pointerleave', () => input.pressVirtual(code, false));
  }

  $('import-file').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    let raw = '';
    try {
      raw = await file.text();
      const data = storage.import(raw);
      state = data.state; meta = data.meta;
      renderer.camera = K.clamp(state.player.x - 300, 0, state.room.width - 960);
      save();
      show(state.mode === 'reward' && state.pendingRelic ? 'replace' : state.mode);
      toast('旅程已恢复。', 2);
    } catch (err) {
      if (err.legacy) {
        try { storage.legacy = JSON.parse(raw); show('legacy'); }
        catch { toast('旧存档无法读取。'); }
      } else toast('导入失败：' + err.message);
    }
    e.target.value = '';
  };

  window.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (screen === 'forge' && /^Digit[1234]$/.test(e.code)) {
      e.preventDefault();
      const idx = Number(e.code.slice(-1)) - 1;
      const u = K.FORGE_UPGRADES[idx];
      if (u && K.forgeBuy(state, u.id)) { audio.event({ type: 'forge-buy' }); save(); forgeMenu(); }
      return;
    }
    if (['start', 'reward', 'replace'].includes(screen) && /^Digit[1234]$/.test(e.code)) {
      const i = Number(e.code.slice(-1)) - 1;
      if (screen === 'replace' && state.relics[i]) { e.preventDefault(); audio.unlock(); choose(state.pendingRelic, state.relics[i]); }
      else if (i < 3) {
        e.preventDefault(); audio.unlock();
        if (screen === 'start') startRun(currentStarterSet()[i]);
        else if (state.reward[i]) choose(state.reward[i]);
      }
    }
    if (e.code === 'Tab' && screen !== 'playing') {
      const nodes = [...$('overlay').querySelectorAll('button:not(:disabled),input:not([hidden])')];
      if (nodes.length) {
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  });
  window.addEventListener('beforeunload', save);

  K.pointerFace = x => {
    if (!state) return 0;
    const r = world.getBoundingClientRect();
    return Math.sign((x - r.left) / r.width * 960 + renderer.camera - state.player.x - 12);
  };

  let lastRelicSig = '';
  function hud() {
    if (!state) return;
    const p = state.player;
    const maxHp = p.maxHp || 100;
    const hpPct = K.clamp(p.hp / maxHp * 100, 0, 100);
    const wardTxt = (p.ward || 0) > 0 ? ` (+${Math.ceil(p.ward)})` : '';
    $('hp-number').textContent = `${Math.ceil(p.hp)} / ${maxHp}${wardTxt}`;
    $('hp-fill').style.width = hpPct + '%';
    $('hp-trail').style.width = hpPct + '%';
    $('ward-fill').style.width = Math.min(100, (p.ward || 0) / (p.maxWard || 26) * 55) + '%';
    $('focus-number').textContent = Math.floor(p.focus);
    $('focus-fill').style.width = p.focus + '%';

    const st = K.stanceInfo(state.stanceStyle);
    const sb = $('stance-btn');
    sb.className = 'stance-pill ' + st.id;
    sb.textContent = `Q ${st.name}`;

    const pips = $('stance-pips').children;
    for (let i = 0; i < 3; i++) pips[i].className = 'pip' + ((p.stance || 0) > i ? ' full' : '');
    const pb = $('pillar-btn');
    pb.disabled = (p.stance || 0) < 1;
    const heavyShort = { smash: '断岳', pillar: '镇海', thrust: '贯日' }[st.id] || '绝技';
    pb.textContent = (p.stance || 0) >= 1 ? `U ${heavyShort}×${p.stance}` : `U ${heavyShort}`;

    KongSafeDOM.render($('essence-pill'), `灵蕴 <b>${state.essence || 0}</b>`);
    $('chapter').textContent = state.stage < 3 ? '第' + ['一', '二', '三'][state.stage] + '境' : '终局法界';
    $('stage-name').textContent = K.STAGES[state.stage].name;
    const left = state.room.seals.find(q => q.hp > 0);
    $('objective').textContent = state.stage < 3
      ? (left ? '阵眼 ' + (state.room.seals.filter(q => q.hp === 0).length + 1) + ' / 2 · 前方 ' + Math.max(0, Math.ceil((left.x - p.x) / 10)) + '丈' : '双阵已破 · 前往右侧山门')
      : 'F定身锁敌 · C铜头弹反 · Q切三势破莲';
    $('run-seed').textContent = state.seed;

    const sig = state.relics.join(',') + '|' + (state.upgradedRelics || []).join(',') + '|' + (state.maxRelics || 3) + '|' + (K.ImageArt?.images.relicIcons ? '1' : '0');
    if (sig !== lastRelicSig) {
      lastRelicSig = sig;
      KongSafeDOM.render($('relic-list'), state.relics.map(id => {
        const r = K.relic(id), awake = K.isAwakened(state, id);
        const iconUrl = r.icon >= 0 && K.relicIconURL ? K.relicIconURL(r.icon) : '';
        return `<span class="relic-chip ${awake ? 'awake' : ''}" title="${esc(awake ? r.awake : r.text)}">${iconUrl ? `<img src="${iconUrl}" alt="">` : r.glyph}${esc(r.name)}${awake ? '<em>真</em>' : ''}</span>`;
      }).join(''));
      const syns = K.activeSynergies(state.relics);
      KongSafeDOM.render($('synergy-list'), syns.map(s => `<span class="syn-pill" title="${esc(s.desc)}">✦ ${esc(s.name)}</span>`).join(''));
    }

    // Active Spell Bar States
    const imCD = p.immobCD || 0, rkCD = p.rockCD || 0;
    const clActive = (state.clones?.length || (state.clone ? 1 : 0));
    $('spell-immob').classList.toggle('cooling', imCD > 0 || p.focus < 25);
    $('cd-immob').textContent = imCD > 0 ? imCD.toFixed(1) : 'F';
    $('spell-rock').classList.toggle('cooling', rkCD > 0);
    $('cd-rock').textContent = rkCD > 0 ? rkCD.toFixed(1) : 'C';
    $('spell-clone').classList.toggle('cooling', clActive > 0 || p.focus < (K.has(state, 'echo') ? 50 : 40));
    $('cd-clone').textContent = clActive > 0 ? `×${clActive}` : 'L';

    $('riposte-state').hidden = (p.riposte || 0) <= 0;
    $('dash-state').textContent = p.dashCD > 0 ? '闪 ' + p.dashCD.toFixed(1) + 's' : '识破 [K]';

    const comboEl = $('combo-stamp');
    if ((state.hitCombo || 0) >= 2) {
      comboEl.hidden = false;
      $('combo-count').textContent = '×' + state.hitCombo;
      const berserk = K.berserkMult(state) > 1.25;
      $('combo-title').textContent = berserk ? '齐天战意' : state.hitCombo >= 12 ? '法天象地' : state.hitCombo >= 6 ? '破军连环' : '棍风初起';
    } else {
      comboEl.hidden = true;
    }

    const subBoss = state.stage < 3 ? state.room.enemies.find(e => (e.kind === 'macaque' || e.kind === 'warden') && e.hp > 0 && Math.abs(e.x - p.x) < 520) : null;
    $('warden-hud').hidden = !subBoss;
    if (subBoss) {
      $('warden-name').textContent = subBoss.title || '守阵魔将';
      const wPct = subBoss.hp / subBoss.maxHp * 100;
      $('warden-fill').style.width = wPct + '%';
      $('warden-trail').style.width = wPct + '%';
    }

    $('boss-hud').hidden = state.stage !== 3;
    const boss = state.room.enemies.find(e => e.kind === 'boss');
    if (boss) {
      const bPct = boss.hp / boss.maxHp * 100;
      $('boss-fill').style.width = bPct + '%';
      $('boss-trail').style.width = bPct + '%';
      $('boss-phase').textContent = boss.frozen > 0 ? '定身金印锁缚中！'
        : boss.phase === 'recover' ? '金光破绽 · 全额重创'
        : boss.phase === 'beam-windup' || boss.phase === 'beam' ? '灭世紫电洪流 · 跃高台或立棍/铜头！'
        : boss.phase === 'sweep-windup' ? '横扫将至 · 立棍腾空或识破'
        : boss.phase === 'pillar-windup' ? '黑莲降柱 · 看清地面紫印'
        : boss.phase === 'orb-windup' ? '散射莲焰 · 闪身或铜头返弹'
        : boss.phase === 'shift-windup' ? '移形冲击 · 避让路径'
        : boss.archForm ? '六臂灭世元神法相' : boss.hp <= 180 ? '魔罗降临' : '黑莲护在正面';
    }

    const gate = state.stage < 3 && Math.abs(p.x - state.room.exit) < 85;
    const lamp = state.stage < 3 && state.room.seals[0].hp === 0 && !state.room.midClaimed && Math.abs(p.x - state.room.seals[0].x) < 85;
    const nearShrine = state.stage < 3 ? (state.room.shrines || []).find(sh => (!sh.used || sh.kind === 'forge') && Math.abs((sh.x + 26) - (p.x + 12)) < 78 && Math.abs(sh.bottom - (p.y + p.h)) < 48) : null;
    $('context-hint').hidden = screen !== 'playing' || (!gate && !lamp && !nearShrine && state.roomTime > 9);
    $('context-hint').textContent = nearShrine
      ? (nearShrine.kind === 'forge' ? `E 开启淬棒神龛 · 消耗灵蕴 (${state.essence || 0}) 重铸金箍棒`
        : nearShrine.kind === 'mirror' ? 'E 击碎照妖心魔镜 · 迎战「六耳猕猴」赢第四舍利槽！'
        : nearShrine.kind === 'bell' ? 'E 敲响古寺残钟 · 开启试炼赢取金身与灵蕴'
        : 'E 参悟悟道残碑 · 唤醒「真·舍利」并注满棍势')
      : lamp ? 'E 借灯整顿 · 可更换舍利或调息补给'
      : gate ? (left ? '尚有黑莲阵眼未破，回身破阵' : 'E 叩开山门前往下一境')
      : 'Q 切三棍势 · F 定身 · C 铜头弹反 · J 棍击 · U 绝技 · K 识破 · L 群猿';

    const progress = $('journey-fill');
    if (progress) progress.style.width = Math.min(100, p.x / state.room.exit * 100) + '%';
    const labels = $('combat-labels');
    if (labels) {
      KongSafeDOM.render(labels, state.effects.filter(f => f.text && f.life > 0).slice(-16).map(f =>
        `<span class="${f.kind === 'hurt' ? 'hurt' : ''} ${f.big ? 'big' : ''}" style="left:${(f.x - renderer.camera) / 960 * 100}%;top:${(f.y - (.45 - f.life) * 48) / 540 * 100}%;${f.color ? 'color:' + f.color : ''}">${esc(f.text)}</span>`
      ).join(''));
    }
  }

  let previous = performance.now(), accumulator = 0, lastHud = 0;
  function frame(now) {
    try {
      const elapsed = Math.min((now - previous) / 1000, .1);
      if (screen === 'playing') { metrics.frames.push(now-previous); if (metrics.frames.length > 10000) metrics.frames.shift(); }
      previous = now; accumulator += elapsed;
      const willStep = screen === 'playing' && accumulator >= K.DT && state.hitstop <= 0;
      let actions = willStep ? input.read() : {}, guard = 0;
      if (screen === 'playing') {
        while (accumulator >= K.DT && guard++ < 13) {
          K.step(state, actions);
          actions = {
            ...actions,
            jumpPressed: false, attackPressed: false, dashPressed: false, clonePressed: false,
            heavyPressed: false, stancePressed: false, immobPressed: false, parryPressed: false, interactPressed: false
          };
          for (const event of state.events) {
            audio.event(event);
            if (event.cutin) showCutin(event.cutin);
            if (event.type === 'hurt') toast(event.source + ' · -' + event.amount + '生命');
            if (event.type === 'seal') toast('阵眼已破 · ' + state.room.seals.filter(q => q.hp === 0).length + ' / 2');
            if (event.type === 'bell-ring') toast('古钟嗡鸣 · 荡平双魔影即赐金身与灵蕴！', 3.2);
            if (event.type === 'mirror-break') toast('古镜崩裂 · 宿敌「心魔·六耳猕猴」现身！击败可开第四舍利槽！', 3.8);
            if (event.type === 'stele-awake') toast(event.relic ? `残碑悟道 · 「${K.relic(event.relic).name}」已升阶为真·舍利！` : '残碑悟道 · 三段棍势已盈满！', 3.5);
            if (event.type === 'boss-phase') toast(event.phase === 2 ? '无天催动魔罗黑莲 · 当心地面紫印降柱！' : '无天显化「六臂灭世元神」 · 当心双掌紫电洪流！', 3.8);
            if (event.type === 'empty-focus') toast('定力不足；棍击命中、识破或铜头弹反可快速积攒。');
            if (event.type === 'gate-locked') toast('本境尚有黑莲阵眼未破。');
            if (event.type === 'hint') toast(event.text, 3.6);
          }
          accumulator -= K.DT;
          if (state.mode !== 'playing') { show(state.mode); break; }
        }
      } else accumulator = 0;

      renderer.draw(state, screen, elapsed);
      const submitted = performance.now();
      if (willStep) {
        for (const q of pendingInputs) metrics.inputs.push({ code: q.code, ms: +(submitted - q.t).toFixed(3), eventMs: +(submitted - q.eventTime).toFixed(3) });
        pendingInputs = [];
      }
      if (metrics.inputs.length > 1000) metrics.inputs.splice(0, metrics.inputs.length - 1000);
      const bossHp = state?.stage === 3 ? (state.room.enemies[0]?.hp ?? 270) : 270;
      audio.tick(screen === 'playing', state?.stage || 0, bossHp, screen === 'menu');
      if (now - lastHud > 70) { hud(); lastHud = now; }
      if (now > toastUntil) $('toast').hidden = true;
      if (now > cutinUntil) $('cutin-banner').hidden = true;
      if (state && screen === 'playing' && now - lastSave > 3000) save();
    } catch (e) {
      metrics.errors.push(String(e.stack || e));
      console.error(e);
      if (state) { state.mode = 'paused'; show('paused'); }
      toast('运行异常，先导出旅程后重新打开。', 5);
    }
    requestAnimationFrame(frame);
  }

  Object.defineProperty(window, '__KONG__', {
    value: Object.freeze({
      snapshot: () => state ? JSON.parse(JSON.stringify({ screen, state, meta, camera: renderer.camera })) : ({ screen, state: null, meta }),
      metrics: () => JSON.parse(JSON.stringify(metrics)),
      version: K.VERSION
    })
  });

  if (K.ImageArt?.ready) K.ImageArt.ready.then(() => { lastRelicSig = ''; if (screen !== 'playing') show(screen); });
  if (storage.error) toast('自动存档读取失败；可通过手记导入备份。', 4);
  show('menu');
  requestAnimationFrame(frame);
})(globalThis.Kong ||= {});
