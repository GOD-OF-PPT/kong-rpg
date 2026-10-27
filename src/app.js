(function(K){
  'use strict';
  const $=id=>document.getElementById(id),world=$('world');
  const renderer=new K.Renderer(world),audio=new K.Audio(),storage=new K.Storage();
  const loaded=storage.read();let state=loaded?.state||null,meta=loaded?.meta||storage.profile();
  let newDifficulty=state?.difficulty||'normal';
  let screen='menu',backScreen='menu',buildBack='playing',toastUntil=0,lastSave=0,pendingInputs=[];
  const rememberedFocus=new Map();let focusRevision=0;
  const settings=storage.readSettings();renderer.shake=settings.shake;audio.setVolume(settings.volume);
  const metrics={frames:[],inputs:[],errors:[],started:performance.now()};
  const input=new K.Input(world,control,(t,code)=>pendingInputs.push({t:performance.now(),eventTime:t,code}));
  // Browsers require a real gesture before sound. Any normal menu click or
  // keyboard action unlocks the chosen homepage track without starting a run.
  window.addEventListener('pointerdown',()=>audio.unlock(),{capture:true});
  window.addEventListener('keydown',e=>{if(!e.ctrlKey&&!e.metaKey&&!e.altKey)audio.unlock();},{capture:true});
  document.addEventListener('visibilitychange',()=>audio.music?.setHidden(document.hidden));
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const btn=(id,text,primary=false)=>`<button id="${id}" class="button ${primary?'primary':''}" aria-label="${esc(text.replace(/<span\b[^>]*>[\s\S]*?<\/span>/g,'').replace(/<[^>]*>/g,'').trim())}">${text}</button>`;
  const on=(id,fn)=>$(id)?.addEventListener('click',fn);
  const relicArt=id=>`<span class="relic-art" style="--item-art:var(--icon-${K.reward(id)?.icon||id})" aria-hidden="true"></span>`;
  const rewardInfo=id=>K.reward(id,screen==='start'?{hero:K.pendingHero||'wukong'}:state);
  const targetCue=(p,q)=>{const dx=q.x-p.x,dy=q.y+q.h-p.y-p.h;return Math.abs(dx)>65?(dx<0?'回身 ':'前方 ')+Math.ceil(Math.abs(dx)/10)+'丈':Math.abs(dy)>72?(dy<0?'上方 ':'下方 ')+Math.ceil(Math.abs(dy)/10)+'丈':'近旁';};
  const cardCopy={
    cloud:['空中可再跳一次，踩敌后重置。空中棍击更远。','空中仍会被莲焰命中。'],
    echo:['分身驻留3秒，发出穿透棍风。留影诱敌，本体绕背。','每次50定力；放错位置会浪费。'],
    staff:['第三棍更远、破正面盾；U伸棍的金色棍尖区更宽。','重棍可断蓄力，但第三棍与伸棍都有收招空当。'],
    mirror:['闪避无敌时接住莲焰，返向施法者，造成24伤害。','闪早会错失接弹，还要等待冷却。'],
    flame:['空中下＋攻击下劈，落地火环破盾并打断附近蓄力。','下劈不能转向，先看落点。'],
    mercy:['破阵回12生命；分身结束返还15定力。','须主动破阵或等分身结束。'],
    rest:['恢复30生命与35定力，保留当前构筑。','放弃本次换舍利的机会。']
  };
  const equipped=ids=>`<div class="equipped-line"><small>此行携带</small>${ids.map(id=>`<span>${relicArt(id)}${rewardInfo(id).name}</span>`).join('')}</div>`;
  const growthLine=()=>state?`<div class="growth-line">${Object.entries(state.growth).map(([id,n])=>rewardInfo(id).name+(n>1?'·'+n+'重':'')).join(' · ')||'法门尚未成形'}${state.talisman?'　Q '+rewardInfo(state.talisman.id).name+' ×'+state.talisman.charges:''}</div>`:'';
  const worldSummary=()=>state?['rescue','bridge','bell'].map(id=>state.world[id]?K.WORLD_STORIES[id].title:null).filter(Boolean).join(' · '):'';
  const journal=()=>state?.journal.length?'<details class="run-journal"><summary>此行见闻 · '+state.journal.length+'</summary>'+state.journal.map(key=>{const[id,part]=key.split(':');return '<p><b>'+K.WORLD_STORIES[id].title+'</b> · '+K.WORLD_STORIES[id][part]+'</p>';}).join('')+'</details>':'';
  const panel=(label,eyebrow,title,body)=>{
    const choice=['heroes','start','reward','replace','art-choice'].includes(screen),hint=choice?'<span><kbd>A</kbd><kbd>D</kbd> / <kbd>←</kbd><kbd>→</kbd> 选卷</span><span><kbd>Enter</kbd> 确认</span><span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> 速选</span>':['history','build'].includes(screen)?'<span><kbd>↑</kbd><kbd>↓</kbd> 翻阅</span><span><kbd>Tab</kbd> 移步</span><span><kbd>Enter</kbd> 确认</span>':'<span><kbd>↑</kbd><kbd>↓</kbd> 移步</span><span><kbd>Enter</kbd> 确认</span>';
    const back=['paused','build','help','legacy','history','prologue','epilogue','heroes','start','replace','won','dead','art-choice'].includes(screen)?`<span><kbd>Esc</kbd> ${screen==='paused'?'继续':screen==='replace'?'返回选择':'返回'}</span>`:'';
    return `<section class="panel game-dialog dialog-${screen}" role="dialog" aria-modal="true" aria-label="${label}" aria-labelledby="dialog-title"><header class="dialog-heading"><span class="dialog-sigil" aria-hidden="true"></span><div class="eyebrow">${eyebrow}</div><h2 id="dialog-title">${title}</h2></header><div class="dialog-content">${body}</div><footer class="dialog-footer"><span class="footer-mark" aria-hidden="true">◇</span>${screen==='heroes'?hint.replace('选卷','选人'):hint}${back}</footer></section>`;
  };
  function toast(text,seconds=2.8){$('toast').textContent=text;$('toast').hidden=false;toastUntil=performance.now()+seconds*1000;}
  function save(){if(!state)return;storage.write(state,meta);$('storage-status').textContent=storage.available?'独立离线版 · 旅程已保存':'自动存储不可用 · 请导出存档';lastSave=performance.now();}
  function show(next){
    const focused=document.activeElement;if($('overlay').contains(focused))rememberedFocus.set(screen,focused.id?{id:focused.id}:focused.dataset.relic?{relic:focused.dataset.relic}:null);
    if(state&&next!=='playing'&&state.arm?.phase==='charge')K.cancelSignature(state,true);screen=next;input.setActive(next==='playing');if(next!=='playing')audio.stopImpacts();audio.setScreen(next);$('stage').dataset.mode=next;
    const modal=!['menu','playing'].includes(next);document.querySelector('.masthead').inert=modal;document.querySelector('.footline').inert=modal;world.inert=modal;$('hud').inert=modal;
    if(next!=='playing'){pendingInputs=[];$('toast').hidden=true;toastUntil=0;}
    $('hud').hidden=!state||next!=='playing';$('overlay').innerHTML='';
    $('pause').disabled=!['playing','paused'].includes(next);$('combat-labels').hidden=next!=='playing';
    if(next==='playing'){world.focus({preventScroll:true});return;}
    const render={menu,prologue,heroes, start:starter,paused:pauseMenu,build:buildMenu,help,'art-choice':artChoice,reward,replace:replaceRelic,dead:ending,won:ending,epilogue,legacy:legacyMenu,history};render[next]?.();
    const revision=++focusRevision;
    requestAnimationFrame(()=>{if(revision!==focusRevision||screen!==next)return;const memory=rememberedFocus.get(next),node=memory?.id?$(memory.id):memory?.relic?$('overlay').querySelector('[data-relic="'+memory.relic+'"]'):null;(node||(next==='menu'?$('begin'):null)||(['history','build'].includes(next)?$('overlay').querySelector('.history-list,.build-scroll'):$('overlay').querySelector('button:not(:disabled),input')))?.focus({preventScroll:true});});
  }
  function menu(){
    if(!K.canChallenge(meta))newDifficulty='normal';const resumable=state&&['paused','playing','reward','art-choice'].includes(state.mode);
    $('overlay').innerHTML=`<div class="hero has-modes"><div class="eyebrow">西游记后传 · 像素横版肉鸽</div><h1><small>大 圣</small>劫后行</h1><div class="english-title">AFTER THE BLACK LOTUS</div><p id="mode-note">${newDifficulty==='challenge'?'五界重劫：援兵结阵，首领追加二段预警。<br>破牒、破珠、破塔，考验换位和出手。':'云上、地府、水下、龙宫、天宫。<br>十五关，每章三战，各有守关者。'}</p><div class="mode-picker" role="group" aria-label="新旅程难度">${['normal','challenge'].map(id=>`<button id="mode-${id}" data-difficulty="${id}" aria-pressed="${newDifficulty===id}" ${id==='challenge'&&!K.canChallenge(meta)?'disabled title="普通十五关S评级后解锁"':''}>${id==='challenge'?'挑战 · 五界重劫':'普通旅程'}</button>`).join('')}</div><p class="unlock-note">${K.canChallenge(meta)?'挑战已解锁 · 普通十五关S评级已达成':'挑战未解锁 · 普通十五关完整通关且评级S（高于A）'}</p><div class="actions">${btn('begin','踏上劫途 <small>→</small>',true)}${resumable?btn('resume','继续旅程 <span aria-hidden="true">'+K.difficultyName(state)+'</span>'):btn('how','初行指南')}</div><div class="seed-edit"><label for="seed">本局因缘</label><input id="seed" aria-label="随机种子" maxlength="32" value="${esc(state?.seed||'LOTUS-1025')}"><button id="random-seed" class="text-button" aria-label="生成新种子">换一签 ↻</button></div><div class="hero-meta"><span><b>${meta.runs}</b> 次入劫</span><span><b>${meta.wins}</b> 次破局</span><button id="past" class="text-button">往昔旅程 ↗</button>${storage.legacy?'<button id="old" class="text-button">旧版旅程 ↗</button>':''}</div></div><div class="scene-label">五章十五关 · 舍利成法<span>兵可破阵 · 心不可折</span></div>`;
    on('begin',()=>{K.pendingSeed=$('seed').value.trim()||'LOTUS-1025';K.pendingDifficulty=newDifficulty;audio.unlock();show(meta.runs===0?'prologue':'heroes');});
    for(const b of $('overlay').querySelectorAll('[data-difficulty]'))b.onclick=()=>{if(b.dataset.difficulty==='challenge'&&!K.canChallenge(meta))return;newDifficulty=b.dataset.difficulty;for(const q of $('overlay').querySelectorAll('[data-difficulty]'))q.setAttribute('aria-pressed',q.dataset.difficulty===newDifficulty);$('mode-note').innerHTML=newDifficulty==='challenge'?'五界重劫：援兵结阵，首领追加二段预警。<br>破牒、破珠、破塔，考验换位和出手。':'云上、地府、水下、龙宫、天宫。<br>十五关，每章三战，各有守关者。';};
    on('resume',resume);on('how',()=>openHelp('menu'));on('past',()=>show('history'));on('old',()=>show('legacy'));
    on('random-seed',()=>$('seed').value='LOTUS-'+crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0,6).toUpperCase());
  }
  function prologue(){
    $('overlay').innerHTML=panel('开篇','序 · 黑莲之劫','三界的灯，还没有熄',`<p class="story-copy">五界的归路被重重关门截断，守关者各持一法。<br><br>孙悟空踏上劫途，哪吒、杨戬亦来应援。择一位应劫者，依次走过云上、地府、水下、龙宫、天宫。每章两名小首领，第三关挑战大首领。<br>攻击积攒战意，满时按 R 施展各自的大神通。<br>沿途择舍利、悟法门、借符术。你的解法，决定此行。</p><div class="journey-map">${K.CAMPAIGN.map(q=>`<span>${q.name}<br><b>三关 · ${q.bossName}</b></span>`).join('<i>―</i>')}</div><div class="actions">${btn('begin-relic','选择应劫者',true)}${btn('back','返回')}</div>`);
    on('begin-relic',()=>show('heroes'));on('back',()=>show('menu'));
  }
  function cards(ids){return `<div class="cards">${ids.map((id,i)=>{const r=rewardInfo(id),copy=(screen==='start'?K.pendingHero:state?.hero)!=='wukong'?[r.text,r.cost]:cardCopy[id]||[r.text,r.cost],verb=screen==='replace'?'放下此物':id==='rest'?'借灯调息':r.hero?'悟此秘技':r.temporary?'携此符术':r.max?'悟此法门':'取此舍利',tag=r.max?r.tag+' · '+(K.rank(state,id)+1)+'/'+r.max:r.tag;return `<button class="relic-card" data-relic="${id}" aria-label="${screen==='replace'?'放下':'选择'}${r.name}" aria-describedby="relic-detail-${id} relic-cost-${id}" style="--relic-tone:${r.color}"><span class="num" aria-hidden="true">${['壹','贰','叁'][i]}</span>${relicArt(id)}<h3>${r.name}</h3><span class="tag">${tag}</span><p id="relic-detail-${id}">${copy[0]}</p><span class="cost" id="relic-cost-${id}">${copy[1]}</span><span class="choice-verb" aria-hidden="true">${verb}</span></button>`;}).join('')}</div>`;}
  function bindCards(fn){for(const b of $('overlay').querySelectorAll('[data-relic]'))b.onclick=()=>fn(b.dataset.relic);}
  function heroes(){
    $('overlay').innerHTML=panel('选择应劫者',K.difficultyName(K.pendingDifficulty)+' · 棍影与回环','此行，谁来应劫？',`<div class="hero-choices">${K.HEROES.map(h=>`<button id="choose-${h.id}" data-hero="${h.id}" class="hero-choice" aria-label="选择${h.name}"><span class="hero-portrait hero-${h.id}" aria-hidden="true"></span><h3>${h.name}</h3><b>${h.title}</b><p>${h.text}</p><small>${h.id==='nezha'?'J火尖枪 · H/右键乾坤圈 · U驭轮 · R莲火轮阵':h.id==='erlang'?'J三尖刀 · H/右键射雕弓 · L天眼 · R哮天犬':'J三连棍 · U伸棍/撑跃 · L分身 · R法天象地'}</small></button>`).join('')}</div><div class="actions">${btn('back','返回')}</div>`);
    const paint=()=>{for(const h of K.HEROES){const im=K.ImageArt.images[h.id==='wukong'?'wukong':h.id==='nezha'?'v8NezhaPortrait':'v8ErlangPortrait'];const n=$('overlay').querySelector('.hero-'+h.id);if(n&&im){n.style.backgroundImage='url("'+im.src+'")';if(h.id!=='wukong'){n.style.backgroundSize='contain';n.style.backgroundPosition='bottom center';}};}};paint();K.ImageArt.ready.then(()=>{if(screen==='heroes')paint();});
    for(const b of $('overlay').querySelectorAll('[data-hero]'))b.onclick=()=>{K.pendingHero=b.dataset.hero;show('start');};on('back',()=>show('menu'));
  }
  function starter(){
    $('overlay').innerHTML=panel('选择初始舍利',K.difficultyName(K.pendingDifficulty)+' · 启程',K.heroDef({hero:K.pendingHero}).name+' · 带哪一念入劫？',`<p class="subtitle">择一舍利启程，途中可换法。最多携带三枚。</p>${cards(['cloud','echo','staff'])}<div class="actions">${btn('back','返回')}</div>`);
    bindCards(startRun);on('back',()=>show('heroes'));
  }
  function startRun(id){
    state=K.newRun(K.pendingSeed||state?.seed||'LOTUS-1025',id,K.pendingHero||'wukong',K.pendingDifficulty||'normal',meta);meta.runs++;state.runId=state.seed+':'+meta.runs+':'+Date.now();renderer.camera=0;audio.unlock();show('playing');toast(K.isChallenge(state)?'挑战·五界重劫 · 敌阵加密，首领二段预警须重新判断。':K.STAGES[0].lore,4);save();
  }
  function resume(){if(!state)return;audio.unlock();if(state.mode==='paused')state.mode='playing';show(state.mode==='reward'&&state.pendingRelic?'replace':state.mode);}
  function pauseMenu(){
    $('overlay').innerHTML=panel('暂停菜单','暂歇 · 风停此刻','此心未歇',`<p class="pause-place">${K.heroDef(state).name} · ${K.difficultyName(state)} · ${K.STAGES[state.stage].name} · 因缘 ${esc(state.seed)}</p>${growthLine()}<nav class="pause-nav" aria-label="暂歇选择">${btn('continue','继续前行 <span aria-hidden="true">ESC</span>',true)}${btn('build-details','本局法门 <span aria-hidden="true">已选加成 · B</span>')}${btn('help','行者手记 <span aria-hidden="true">招式与破局</span>')}${btn('main-menu','回到主菜单')}</nav><div class="setting-row"><label for="volume">声音</label><input id="volume" aria-label="音量" type="range" min="0" max="100" value="${settings.volume*100}"><label><input id="shake" type="checkbox" ${settings.shake?'checked':''}> 屏震</label></div><div class="pause-tools">${btn('export','导出存档')}${btn('import','导入存档')}</div><p class="notice">旅程已停。导出存档可将此行带往另一入口。</p>${journal()}`);
    const portrait=()=>{const panel=$('overlay').querySelector('.dialog-paused');if(panel&&K.DialogPortraits?.[state.hero]){panel.dataset.hero=state.hero;panel.style.setProperty('--portrait-art',K.DialogPortraits[state.hero]);}};portrait();K.DialogArtReady.then(()=>{if(screen==='paused')portrait();});
    on('build-details',()=>openBuild('paused'));on('continue',resume);on('help',()=>openHelp('paused'));on('export',exportSave);on('import',()=>$('import-file').click());on('main-menu',()=>{save();show('menu');});
    $('volume').oninput=e=>{settings.volume=Number(e.target.value)/100;audio.setVolume(settings.volume);storage.settings(settings);};
    $('shake').onchange=e=>{settings.shake=e.target.checked;renderer.shake=settings.shake;storage.settings(settings);};
  }
  function openBuild(back){if(!state)return;buildBack=back;if(back==='playing'){K.cancelSignature(state,true);state.mode='paused';save();}show('build');}
  function closeBuild(){if(buildBack==='playing'){state.mode='playing';show('playing');}else show(buildBack);}
  function artChoice(){const q=K.artManuals(state).find(q=>q.id===state.celestial.pending),r=q&&K.artDef(q.art);if(!r)return;const current=K.artDef(state.celestial.equipped);$('overlay').innerHTML=panel('参悟秘技','路拾秘卷 · 自择一式',r.name,`<div class="art-choice-layout">${relicArt(r.id)}<div><p class="art-description">${r.text}</p><p class="art-cost">${r.cost}</p><p class="notice">${current?'当前：'+current.name+'。学会后可按B换回，冷却共享。':'本局可学多式，每次只装备一式，按C释放。'}</p></div></div><div class="actions">${btn('learn-art','参悟并装备',true)}${btn('leave-art','保留原式')}</div>`);on('learn-art',()=>finishArt(true));on('leave-art',()=>finishArt(false));}
  function finishArt(learn){if(K.chooseManual(state,learn)){save();show('playing');}}
  function buildMenu(){
    const section=(title,entries)=>'<h3>'+title+'</h3>'+ (entries.length?entries.map(([id,level])=>{const r=rewardInfo(id);return `<article class="build-entry" role="listitem">${relicArt(id)}<div><h4>${r.name}<small>${level}</small></h4><p>${r.text}</p><p class="build-cost">${r.cost}</p></div></article>`;}).join(''):'<p class="build-empty">此行尚未取得。可在借灯或试炼奖励中选择。</p>');
    const body=section('舍利 · '+state.relics.length+' / 3',state.relics.map(id=>[id,'已携带']))+section('法门 · 本局保留',Object.entries(state.growth).map(([id,n])=>[id,n+'/'+rewardInfo(id).max+'重'+(id==='vitality'?' · 上限 +'+20*n:'')]))+section('符术 · Q 限次',state.talisman?[[state.talisman.id,'剩余 '+state.talisman.charges+' 次']]:[]);
    $('overlay').innerHTML=panel('本局法门与已选加成','此行所悟 · 看清再变化','本局法门',`<div class="build-vitals"><span>生命 <b>${Math.ceil(state.player.hp)} / ${K.maxHP(state)}</b></span><span>定力 <b>${Math.floor(state.player.focus)} / 100</b></span><span>战意 <b>${Math.floor(state.player.rage)} / 100</b></span></div><p class="build-scroll-hint">滚轮 / ↑ ↓ 翻阅全部加成 · Tab 移步 · B 或 Esc 返回</p><div class="build-scroll" role="list" tabindex="0" aria-label="已选加成效果，可滚动">${body}${section('秘技 · 释放代价',state.celestial.owned.map(id=>[id,state.celestial.equipped===id?'已装备':'已参悟']))}<h3>秘技 · C · 只装备一式</h3><div class="art-loadout">${state.celestial.owned.length?state.celestial.owned.map(id=>`<button class="button" data-art-equip="${id}" ${state.celestial.cast?'disabled':''}>${K.artDef(id).name} · ${state.celestial.equipped===id?'已装备':'换此秘技'}</button>`).join(''):'<p class="build-empty">走近路边秘技卷按F，或在奖励中选择。冷却不会因换技重置。</p>'}</div><h3>${K.heroDef(state).name} · 常备神通</h3><p class="build-empty">${K.warriorGuide(state)}</p></div><div class="actions">${btn('close-build',buildBack==='reward'?'返回奖励选择':buildBack==='paused'?'返回暂歇':'继续前行',true)}</div>`);
    on('close-build',closeBuild);for(const b of $('overlay').querySelectorAll('[data-art-equip]'))b.onclick=()=>{K.equipArt(state,b.dataset.artEquip);save();buildMenu();};
  }
  function openHelp(back){backScreen=back;show('help');}
  function help(){
    const lessons=[
      ['通关评分与挑战','时间35分（25分钟内满）、受伤40分（每次扣0.5）、唯一敌人击杀率25分。S≥90、A≥75、B≥55。普通完整十五关通关S才解锁挑战；暂停和奖励阅读不计时。'],
      ['秘技卷与化身','路边发光秘技卷按F参悟，可选择不学。按C释放，左上角显示技能和冷却；B查看与切换已学秘技，共享冷却不会重置。悟空撑天须落地，杨戬激光引导时不能移动；化身也会受伤。'],
      ['步法与落点','A D移动，空格/W跳。长按高跳、松开短跳；S＋空格下穿。踩敌反弹，腾云骨多一跳。'],
      ['主副武器','J/左键主攻：悟空金箍棒、哪吒火尖枪、杨戬三尖两刃刀。H/右键副攻：哪吒掷环、杨戬射雕弓。右键朝光标，H水平出手；副武器消耗定力。'],
      ['闪避与神通','K/Shift闪避。L：悟空分身、哪吒混天绫、杨戬天眼。普攻命中回定力。杨戬R召哮天犬协战8秒，需要你牵制目标；三角色详情按B。'],
      ['大招、符术与变化','命中积攒战意，满100按R释放大招：破盾、清近处敌弹。起势护体，收招仍有风险。Q使用限次符术，余量见左上。U：悟空按住蓄棍、松开伸刺；S松开撑地跃。哪吒按住驭轮，W升S降，松开落下；杨戬U为神行步。'],
      ['长路与成法','F借灯、触发见闻或过门。上路试炼可跳过，清场后回去领奖；归灯只用一次。补给满值留地。每次奖励择一：舍利最多三枚，法门本局保留，新符替换旧符；B查详情。'],
      ['敌人战纹','头顶双刃为连刃、带翼盾为震盾、三焰为散焰；红色刃芒外圈表示正在起手，连招第二击会再次亮起。挑战强化融入朱红边；无特性强化兵为妖冠。具体避让方向仍看地面与弹道。'],
      ['识别与重来','敌人暗红细边，危险玫红预警；增益青绿底标加形状，满值变暗。领域锁定后移开，地面波跳避。五章十五关依序推进，前两关小首领、第三关大首领。每关击退首领后F过门；失败清空本局成长。']
    ];
    $('overlay').innerHTML=panel('行者手记','手记 · 看清再出手','棍有尽处，变化无穷',`<div class="help-grid">${lessons.map(([title,text])=>`<div><h3>${title}</h3><p>${text}</p></div>`).join('')}</div><div class="actions">${btn('close-help','记下了',true)}${btn('import','导入存档')}${btn('old','原版旅程')}</div>`);
    on('close-help',()=>show(backScreen));on('import',()=>$('import-file').click());on('old',()=>show('legacy'));
  }
  function reward(){
    save();const mid=state.rewardKind==='mid',trial=state.rewardKind==='trial';
    $('overlay').innerHTML=panel('舍利、法门与补给',trial?'试炼已破 · 以战悟法':mid?'阵眼已破 · 余灯尚温':'守关者已退 · 山门将启',trial?state.room.trial.name+' · 择一法':mid?'借灯，重整一念':'山门将启，再择一法',`<p class="subtitle">${mid||trial?'舍利、法门或符术择一，亦可借灯调息。':'前往'+K.STAGES[state.stage+1].name+' · 过境另恢复18生命、20定力。'}</p><div class="offering-status"><span>生命 <b>${Math.ceil(state.player.hp)} / ${K.maxHP(state)}</b></span><span>定力 <b>${Math.floor(state.player.focus)}</b></span><span>舍利 <b>${state.relics.length} / 3</b></span></div>${cards(state.reward)}${equipped(state.relics)}<div class="build-summary">${growthLine()}${btn('build-details','查看已选加成 · B')}</div>`);bindCards(choose);on('build-details',()=>openBuild('reward'));
  }
  function choose(id,replace){const kind=state.rewardKind,result=K.choose(state,id,replace);if(result==='replace'){show('replace');save();return;}if(result){audio.event({type:'relic'});if(kind==='exit')renderer.camera=0;show('playing');toast(kind==='exit'?K.STAGES[state.stage].lore:kind==='mid'?'借灯已毕，继续前行。':'试炼已竟，继续前行。',3.5);save();}}
  function replaceRelic(){
    const next=rewardInfo(state.pendingRelic);$('overlay').innerHTML=panel('替换舍利','舍利已满 · 有舍有得','放下一念，换取'+next.name,`<div class="incoming-relic">${relicArt(next.id)}<p><strong>即将取得 · ${next.name}</strong>${next.text}</p></div><p class="starter-note">下方三枚为已携带舍利。择一放下，或返回重新选择。</p>${cards(state.relics)}<div class="actions">${btn('cancel-replace','返回选择')}</div>`);bindCards(id=>choose(state.pendingRelic,id));on('cancel-replace',()=>{state.pendingRelic=null;show('reward');save();});
  }
  function settle(){
    if(meta.history.some(x=>x.id===state.runId))return;
    const won=state.mode==='won',rating=K.recordClear(meta,state);if(won)meta.wins++;meta.best=Math.max(meta.best,won?15:state.stage);
    meta.history.push({id:state.runId,seed:state.seed,won,grade:rating.grade,score:rating.score,stage:state.stage,hero:state.hero,difficulty:state.difficulty,seconds:Math.floor(state.elapsed),damage:state.damageTaken,relics:state.relics.slice()});meta.history=meta.history.slice(-8);save();
  }
  function ending(){
    settle();const rating=K.rating(state),won=state.mode==='won',seconds=Math.floor(state.elapsed),time=Math.floor(seconds/60)+'分'+seconds%60+'秒';
    $('overlay').innerHTML=panel(won?'胜利结算':'失败结算',won?'五界已通 · 此心长明':'劫途未尽 · 再起一念',won?'五界通关 · '+rating.grade+'评':'此身暂歇，此心未折',`<p class="subtitle">${won?'天王收塔，五界归路重开。你的选择，已走完十五关。':'最后受伤：'+esc(state.lastDamage)+'。<br>记住刀光和落点，再次入劫时可以换一枚舍利。'}</p>${K.ratingPanel(state,meta)}<div class="results"><div><small>此行</small><b>${time}</b></div><div><small>过关</small><b>${state.campaign.completed.length} / 15</b></div><div><small>退敌</small><b>${state.kills}</b></div><div><small>承伤</small><b>${state.damageTaken}</b></div></div><div class="result-build">${K.heroDef(state).name} · ${K.difficultyName(state)} · 因缘 ${esc(state.seed)}${equipped(state.relics)}${growthLine()}${K.heroDef(state).skill} ${state.stats.ultimates} 次 · 符术 ${state.stats.talismans} 次 · 守关 ${state.stats.guardians}/15<br>跃起 ${state.stats.jumps} 次 · ${state.hero==='erlang'?'天眼':K.isRanged(state)?'绫缚':'分身'} ${state.stats.clones} 次 · 消耗定力 ${Math.round(state.stats.focusSpent)}<br>此行所护：${state.campaign.completed.length}关 · 受伤${state.campaign.hits}次</div><div class="actions">${won?btn('epilogue','走出黑莲',true):btn('retry','同缘再行',true)}${won?btn('retry','同缘再行'):btn('new-path','另启因缘')}${btn('export','导出此行')}</div>`);
    on('retry',()=>{K.pendingSeed=state.seed;K.pendingHero=state.hero;K.pendingDifficulty=newDifficulty=state.difficulty;show('heroes');});on('new-path',()=>show('menu'));on('export',exportSave);on('epilogue',()=>show('epilogue'));
  }
  function epilogue(){
    $('overlay').innerHTML=panel('尾声','尾声 · 五界归路','前路，还有众生',`<p class="story-copy">踏过云阶，走出鬼门，越过沉渊与龙宫，最终登上天宫。<br><br>巨灵神收斧，秦广王收笔，九头虫退回深渊，东海龙王平息潮水，托塔天王撤去七宝塔。<br>五界十五关，因你这一行重新连通。<br><br>${K.canChallenge(meta)?'普通S评级已达成，挑战模式现在开放。':'继续研习：普通完整通关S评级后可开启挑战模式。'}</p><div class="actions">${btn('again','再入因缘',true)}${btn('back-result','查看此行')}${btn('main-menu','回到主菜单')}</div>`);
    on('again',()=>{K.pendingSeed='LOTUS-'+crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0,6);K.pendingDifficulty=newDifficulty=state.difficulty;show('heroes');});on('back-result',()=>show('won'));on('main-menu',()=>show('menu'));
  }
  function history(){
    $('overlay').innerHTML=panel('往昔旅程','因缘簿 · 留迹不留战力','你走过的路',`<div class="history-folio"><div class="history-list" tabindex="0" aria-label="旅程记录，可滚动">${meta.history.length?meta.history.slice().reverse().map(r=>`<div><b>${r.won?'破劫':'止步'+K.STAGES[r.stage]?.name||'旧旅程'}</b><span>${esc(r.seed)}</span><span>${Math.floor(r.seconds/60)}分${r.seconds%60}秒</span><small>${K.heroDef(r).name} · ${K.difficultyName(r)} · ${r.relics.map(id=>K.reward(id,r).name).join(' · ')}</small></div>`).join(''):`<div class="empty-history">${relicArt('rest')}<p>因缘簿尚未落墨。<br>选择应劫者，先走一程。</p></div>`}</div></div><p class="history-hint">${meta.history.length?'共 '+meta.history.length+' 行旅记 · 滚轮或 ↑ ↓ 翻阅':'行过之处，终会留下痕迹'}</p><div class="actions">${btn('back','返回',true)}</div>`);on('back',()=>show('menu'));
  }
  function legacyMenu(){
    $('overlay').innerHTML=panel('原版旅程','存档保护 · 旧路仍在','在原来的规则中继续',`<p class="story-copy">旧版的地图与规则和新版不同。你的旧旅程不会被覆盖，也不会被悄悄搬到另一张地图。<br><br>${storage.legacy?'可先下载旧档，再在打开的原版里通过「初行指南 → 导入存档」继续。':'保留的原版可直接打开；如果你有旧JSON文件，请在原版的指南中导入。'}</p><div class="actions">${btn('open-legacy',storage.legacy?'备份旧档并打开原版':'打开原版',true)}${btn('back','返回新版')}</div>`);
    on('open-legacy',()=>{if(storage.legacy)K.download(JSON.stringify(storage.legacy),'劫后行-v'+storage.legacy.state.version+'-旧旅程.json');const version=storage.legacy?.state?.version||9,legacyName='legacy-v'+version+'.html';const legacy=document.querySelector('meta[name="kong-package"]')?legacyName:'release/'+legacyName;window.open(new URL(legacy,location.href).href,'_blank','noopener');toast('已打开保留的原版；可通过手记导入旧旅程。',4);});on('back',()=>show('menu'));
  }
  function exportSave(){save();storage.export(state,meta);toast('已导出整段旅程，含动态敌招与舍利选择。');}
  function control(action){
    if(action==='build'&&screen==='playing')openBuild('playing');
    if(action==='pause'){if(screen==='playing'){K.cancelSignature(state,true);state.mode='paused';save();show('paused');}else if(screen==='paused')resume();else if(screen==='build')closeBuild();else if(screen==='help')show(backScreen);else if(screen==='replace'){state.pendingRelic=null;show('reward');save();}else if(screen==='art-choice'){K.chooseManual(state,false);save();show('playing');}else if(screen==='epilogue')show('won');else if(screen==='start')show('heroes');else if(['heroes','prologue','legacy','history','won','dead','art-choice'].includes(screen))show('menu');}
    if(action==='blur'&&screen==='playing'){K.cancelSignature(state,true);state.mode='paused';save();show('paused');}
  }
  on('build-open',()=>openBuild('playing'));on('pause',()=>control('pause'));on('guide-top',()=>{const back=screen==='playing'?'paused':screen;if(screen==='playing'){K.cancelSignature(state,true);state.mode='paused';save();}openHelp(back==='help'?backScreen:back);});
  on('brand',e=>{e.preventDefault();if(screen==='playing'){K.cancelSignature(state,true);state.mode='paused';save();}show('menu');});
  $('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;let raw='';try{raw=await file.text();const data=storage.import(raw);state=data.state;meta=data.meta;const profile=storage.profile();if(!K.canChallenge(meta)&&K.canChallenge(profile))meta.normalClear=profile.normalClear;if(!K.canChallenge(meta)&&state.campaign.access)meta.normalClear={...state.campaign.access};newDifficulty=state.difficulty;renderer.camera=K.clamp(state.player.x-300,0,state.room.width-960);save();show(state.mode==='reward'&&state.pendingRelic?'replace':state.mode);toast('旅程已恢复。',2);}catch(err){if(err.legacy){try{storage.legacy=JSON.parse(raw);show('legacy');}catch{toast('旧存档无法读取。');}}else toast('导入失败：'+err.message);}e.target.value='';};
  window.addEventListener('keydown',e=>{
    if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.target.classList.contains('build-scroll')&&['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.code)){e.preventDefault();const n=e.target;if(e.code==='Home')n.scrollTop=0;else if(e.code==='End')n.scrollTop=n.scrollHeight;else n.scrollTop+=(['ArrowUp','PageUp'].includes(e.code)?-1:1)*(e.code.startsWith('Page')?n.clientHeight*.8:45);return;}
    if(e.code==='KeyB'&&!e.repeat&&['paused','reward','build'].includes(screen)){e.preventDefault();if(screen==='build')closeBuild();else openBuild(screen);return;}
    if(e.code==='Escape'&&screen!=='playing'){e.preventDefault();if(!e.repeat)control('pause');return;}
    const field=['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName);
    if(!field&&['heroes','start','reward','replace','art-choice'].includes(screen)&&/^Digit[123]$/.test(e.code)){e.preventDefault();if(e.repeat)return;const i=Number(e.code.slice(-1))-1;audio.unlock();audio.menu('confirm');if(screen==='heroes'){if(i<3){K.pendingHero=K.HEROES[i].id;show('start');}}else if(screen==='art-choice'){if(i===0)finishArt(true);else if(i===1)finishArt(false);}else if(screen==='start')startRun(['cloud','echo','staff'][i]);else if(screen==='replace')choose(state.pendingRelic,state.relics[i]);else choose(state.reward[i]);return;}
    if(screen!=='playing'){
      const nodes=[...$('overlay').querySelectorAll('button:not(:disabled),input:not([hidden]),summary,[tabindex="0"]')].filter(n=>n.getClientRects().length);
      if(e.code==='Tab'&&nodes.length){const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
      const cardKey=['heroes','start','reward','replace','art-choice'].includes(screen)&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&['KeyA','KeyD'].includes(e.code);
      const navCode=cardKey?(e.code==='KeyA'?'ArrowLeft':'ArrowRight'):e.code;
      if(!field&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(navCode)&&!e.target.classList.contains('history-list')&&!e.target.classList.contains('build-scroll')&&nodes.length){e.preventDefault();const cards=[...$('overlay').querySelectorAll('.relic-card,.hero-choice')],list=cards.length&&(cardKey||cards.includes(document.activeElement))&&['ArrowLeft','ArrowRight'].includes(navCode)?cards:nodes;const dir=['ArrowUp','ArrowLeft'].includes(navCode)?-1:1,index=list.indexOf(document.activeElement);list[index<0?(dir<0?list.length-1:0):(index+dir+list.length)%list.length].focus();audio.menu('move');}
      if(e.code==='Enter'&&e.repeat)e.preventDefault();
    }
  });
  $('overlay').addEventListener('click',e=>{if(e.target.closest('button'))audio.menu('confirm');},true);
  $('overlay').addEventListener('pointermove',e=>{const card=e.target.closest('.relic-card,.hero-choice');if(card&&document.activeElement!==card){card.focus({preventScroll:true});audio.menu('move');}});
  window.addEventListener('beforeunload',save);
  K.pointerPoint=(x,y)=>{const r=world.getBoundingClientRect();return{x:K.clamp((x-r.left)/r.width*960+renderer.camera,0,state?.room.width||960),y:K.clamp((y-r.top)/r.height*540,0,540)};};
  K.pointerFace=x=>{if(!state)return 0;const r=world.getBoundingClientRect();return Math.sign((x-r.left)/r.width*960+renderer.camera-state.player.x-12);};
  function hud(){
    if(!state)return;const p=state.player;$('player-name').textContent=K.heroDef(state).name;$('ultimate-name').textContent='R '+K.heroDef(state).skill;$('range-state').textContent=state.hero==='erlang'?(state.hound?'哮天犬 '+Math.ceil(state.hound.life)+'秒 · H射雕弓':state.bow?'射雕弓 · 引弦':'J三尖刀 · H射雕弓'):K.isRanged(state)?(state.ring?'乾坤圈 · '+(state.ring.phase==='out'?'去程':'回收'):'J火尖枪 · H乾坤圈'):'';
    const sig=K.isRanged(state),unavailable=p.hurt>0?'受击中':p.ultimate>0?'大招中':p.slam?'下劈中':p.dash>0?'闪避中':'';
    $('signature-name').textContent=state.hero==='erlang'?'U 神行步':sig?'U 风火轮':'U 如意伸缩';$('signature-fill').style.width=(sig?Math.min(100,p.wheelFuel/K.wheelMax(state)*100):state.arm?.phase==='charge'?state.arm.charge/.6*100:p.armCD>0||p.focus<10?0:100)+'%';$('signature-state').textContent=unavailable||(sig?(state.flight?'驭轮':p.focus<8?'定力不足':p.wheelFuel<=K.DT?'落地回充':!p.wheelReady?'松开 U':p.wheelFuel<=.08?'轮火不足':p.wheelFuel.toFixed(1)+'s'):state.arm?({charge:'蓄棍',thrust:'伸',recover:'收',vault:'撑'})[state.arm.phase]:p.armCD>0?'回气':p.focus<10?'定力不足':'就绪');
    $('hp-number').textContent=Math.ceil(p.hp)+' / '+K.maxHP(state);$('hp-fill').style.width=(p.hp/K.maxHP(state)*100)+'%';$('focus-number').textContent=Math.floor(p.focus);$('focus-fill').style.width=p.focus+'%';$('rage-number').textContent=Math.floor(p.rage);$('rage-fill').style.width=p.rage+'%';$('rage-line').classList.toggle('ready',p.rage>=100);$('rage-line').title=p.rage>=100?'按 R 释放'+K.heroDef(state).skill:'命中积攒战意';$('talisman-state').textContent=state.talisman?'Q '+rewardInfo(state.talisman.id).name+' ×'+state.talisman.charges:'Q 未携符术';$('growth-state').textContent=Object.entries(state.growth).map(([id,n])=>rewardInfo(id).name+(n>1?'·'+n+'重':'')).join(' · ')||'暂无';$('chapter').textContent='第'+(Math.floor(state.stage/3)+1)+'章 · 第'+(state.stage%3+1)+'关 / 3'+(K.isChallenge(state)?' · 挑战':'');$('stage-name').textContent=K.STAGES[state.stage].name;
    const left=null,guardian=K.guardian(state);$('objective').textContent=guardian?.hp>0?'击退'+K.GUARDIANS[state.stage].name+' · '+(state.stage%3===2?'章末大首领':'小首领'):'守关者已退 · F过门';
    const art=K.artDef(state.celestial.equipped);$('art-state').textContent=art?'C '+art.name+' · '+(state.celestial.cast?'施展中':state.celestial.cooldown>0?state.celestial.cooldown.toFixed(1)+'s':p.focus<art.focus?'定力不足':'就绪'):'C 未习秘技 · F拾卷';
    const boss=state.room.enemies.find(e=>(e.kind==='boss'||e.kind==='warden')&&!e.dormant&&e.hp>0);$('boss-hud').hidden=!boss;
    if(boss){$('boss-name').textContent=boss.kind==='warden'?K.GUARDIANS[state.stage].name:'无天';$('boss-fill').style.width=boss.hp/boss.maxHp*100+'%';$('boss-hud').style.setProperty('--boss-color',boss.kind==='warden'?K.GUARDIANS[state.stage].color:'#ba77a3');$('boss-phase').textContent=K.challengePhaseText(boss)||(boss.kind==='warden'?(boss.phase==='recover'?'收招破绽 · 出棍':boss.phase==='warden-windup'?({charge:'冲撞将至 · 跃过路径',quake:'震地将至 · 跳',fan:'散焰将至 · 跳或返弹',lantern:'索灯将至 · 离开莲印',columns:'封愿将至 · 横移',bell:'钟浪将至 · 跳'}[boss.move]):'看清下一招'):boss.phase==='recover'?'破绽已现':boss.phase==='sweep-windup'?'横扫将至 · 跳':boss.phase==='orb-windup'?'莲焰将至 · 闪':boss.phase==='rain-windup'?'落火将至 · 离开莲印':boss.phase==='shift-windup'?'移形将至 · 让路':'黑莲护在正面');}
    if(state.hero==='erlang'){$('signature-fill').style.width=p.armCD>0?'0%':'100%';$('signature-state').textContent=unavailable||(p.armCD>0?'回气':p.focus<12?'定力不足':'就绪');}
    const trial=state.room.trial,camp=state.room.camp,nearTrial=trial&&Math.abs(p.x-trial.x)<95&&Math.abs(p.y-trial.y)<75,nearCamp=camp&&Math.abs(p.x-camp.x)<75&&Math.abs(p.y-camp.y)<65;
    $('stage-name').textContent=K.region(state.stage,p.x);
    const node=state.room.node,nearNode=node&&Math.abs(p.x-node.x)<90&&Math.abs(p.y-396)<95;const gate=Math.abs(p.x-state.room.exit)<85;const lamp=false;
    const pickup=state.room.pickups.filter(q=>!q.used&&q.enabled!==false&&Math.abs(p.x+p.w/2-q.x-q.w/2)<72&&Math.abs(p.y+p.h-q.y-q.h)<54).sort((a,b)=>Math.abs(p.x-a.x)-Math.abs(p.x-b.x))[0];
    $('context-hint').hidden=screen!=='playing'||(!gate&&!lamp&&!nearNode&&!nearTrial&&!nearCamp&&!pickup&&state.arm?.phase!=='charge'&&state.roomTime>9);
    $('context-hint').textContent=nearTrial?(trial.state==='ready'?'F 开启'+trial.name+' · 可跳过，胜后多选一项加成':trial.state==='cleared'?'F 领取试炼奖励':trial.state==='claimed'?'试炼奖励已取':'试炼进行中 · 可退回下路'):nearCamp?(camp.used?'归灯余温已尽':'F 归灯调息 · 生命+24 定力+20 · 仅一次'):nearNode?(node.state==='done'?'F 回看此地见闻':node.state==='active'?'守阵者尚在 · 可离开后返回':node.id==='bridge'?'F 燃灯接桥 · 消耗20定力':node.id==='rescue'?'F 破笼救困 · 会惊动守卒':'F 叩钟破妄 · 会惊动守钟众'):lamp?(K.lampInReach(state)?'F 借灯整顿 · 舍利、法门与符术':'靠近借灯落点后 F 整顿 · S＋跳可下穿悬台'):gate?(!K.gateInReach(state)?'靠近山门落点后 F 过门':left?'阵眼尚存，回身破阵':guardian?.hp>0?'守关者尚在，击退后过门':'F 穿过山门'):(state.hero==='erlang'?'J三尖刀 · H/右键射雕弓 · L天眼 · R哮天犬':K.isRanged(state)?'J火尖枪 · H/右键乾坤圈 · U风火轮':state.arm?.phase==='charge'?'蓄棍中不能起跳 · 松 U 出刺 / S松U撑跃 · K取消':'J棍击 · U蓄放伸棍 / S松U撑跃 · L分身');
    const manual=K.nearArtManual(state);if(manual){$('context-hint').hidden=screen!=='playing';$('context-hint').textContent='F 参悟'+K.artDef(manual.art).name+' · 可选取或保留原技能';}
    const anchor=state.room.anchors.find(a=>a.active&&a.hp>0&&Math.abs(p.x-a.x)<95);if(anchor&&!manual){$('context-hint').hidden=screen!=='playing';$('context-hint').textContent=anchor.kind==='writ'?'判牒护体 · J主攻 / H副攻可破牒，撤去秦广王护体':anchor.kind==='pearl'?'潮珠蓄势 · 击碎可打断龙王潮涌':'塔基镇阵 · 击碎可撤去镇压光柱';}
    if(pickup&&!manual&&!anchor){const text=K.pickupHint(state,pickup);$('context-hint').textContent=nearTrial||nearCamp||nearNode||lamp||gate?$('context-hint').textContent+' · '+text:text;}
    const progress=$('journey-fill');if(progress)progress.style.width=Math.min(100,p.x/state.room.exit*100)+'%';
    const labels=$('combat-labels');if(labels)labels.innerHTML=state.effects.filter(f=>f.text&&f.life>0).slice(-12).map(f=>`<span class="impact-number ${f.kind==='hurt'?'hurt':f.kind==='heavy-hit'?'heavy':f.kind==='block'?'block':''}" style="left:${(f.x-renderer.camera)/960*100}%;top:${(f.y-((f.duration||.42)-f.life)*65)/540*100}%">${esc(f.text)}</span>`).join('');
    // At the left edge the camera cannot center the actor. Yield the HUD while
    // a jump/flight silhouette crosses it; preserve layout and chosen bonuses.
    const cluster=document.querySelector('.hud-left'),r=world.getBoundingClientRect(),h=cluster.getBoundingClientRect(),actor={x:r.x+(p.x-renderer.camera-52)/960*r.width,y:r.y+(p.y-84)/540*r.height,w:128/960*r.width,h:128/540*r.height};
    cluster.classList.toggle('obscures-player',screen==='playing'&&actor.x<h.right&&actor.x+actor.w>h.left&&actor.y<h.bottom&&actor.y+actor.h>h.top);
  }
  let previous=performance.now(),accumulator=0,lastHud=0;
  function frame(now){
    try{
      const elapsed=Math.min((now-previous)/1000,.1);if(screen==='playing'){metrics.frames.push(now-previous);if(metrics.frames.length>10000)metrics.frames.shift();}previous=now;accumulator+=elapsed;
      const willStep=screen==='playing'&&accumulator>=K.DT&&state.hitstop<=0;let actions=willStep?{...input.read(),viewX:renderer.camera}:{},guard=0;
      if(screen==='playing')while(accumulator>=K.DT&&guard++<13){
        K.step(state,actions);actions={...actions,jumpPressed:false,attackPressed:false,dashPressed:false,clonePressed:false,secondaryPressed:false,interactPressed:false,ultimatePressed:false,talismanPressed:false,signaturePressed:false,artPressed:false};
        audio.events(state.events);
        for(const event of state.events){if(event.type==='boss-warning'||event.type==='guardian-enter')lastHud=0;if(event.type==='hurt')toast(event.source+' · -'+event.amount+'生命');if(event.type==='seal')toast('阵眼已破 · '+state.room.seals.filter(q=>q.hp===0).length+' / 2');if(event.type==='empty-focus')toast('定力不足；'+(K.isRanged(state)?'飞环':'棍击')+'命中可积攒。');if(event.type==='gate-locked')toast(state.room.seals.some(q=>q.hp>0)?'本关尚有机关。':'本关守关者尚在，先击退再过门。');if(event.type==='ability-note')toast(event.text,1.6);if(event.type==='ultimate-ready')toast('战意已满 · R '+K.heroDef(state).skill,1.8);if(event.type==='ultimate')toast(K.heroDef(state).skill+' · 镇劫',.9);if(event.type==='guardian-enter')toast(event.name+' · '+K.GUARDIANS[state.stage].lesson,3.5);if(event.type==='guardian-defeat')toast(event.name+'已退 · 生命+12 · 前往关门按F继续',3);if(event.type==='hint')toast(K.isRanged(state)&&event.text.includes('连续轻棍')?'J火尖枪近战，H掷环；看突刺预警横移或跃过路径。':event.text,3.5);if(event.type==='story')toast(event.title+' · '+(K.isRanged(state)?event.text.replace('大圣','三太子'):event.text),5);if(event.type==='world-note')toast(event.text,3.5);}
        accumulator-=K.DT;if(state.mode!=='playing'){show(state.mode);break;}
      }else accumulator=0;
      renderer.draw(state,screen,elapsed);const submitted=performance.now();if(willStep){for(const q of pendingInputs)metrics.inputs.push({code:q.code,ms:+(submitted-q.t).toFixed(3),eventMs:+(submitted-q.eventTime).toFixed(3)});pendingInputs=[];}if(metrics.inputs.length>1000)metrics.inputs.splice(0,metrics.inputs.length-1000);
      audio.tick();if(now-lastHud>80){hud();lastHud=now;}if(now>toastUntil)$('toast').hidden=true;if(state&&screen==='playing'&&now-lastSave>3000)save();
    }catch(e){metrics.errors.push(String(e.stack||e));console.error(e);if(state){state.mode='paused';show('paused');}toast('运行异常，先导出旅程后重新打开。',5);}
    requestAnimationFrame(frame);
  }
  Object.defineProperty(window,'__KONG__',{value:Object.freeze({snapshot:()=>state?JSON.parse(JSON.stringify({screen,state,meta,camera:renderer.camera})):({screen,state:null,meta}),metrics:()=>JSON.parse(JSON.stringify(metrics)),audio:()=>audio.diagnostics(),version:K.VERSION})});
  if(storage.error)toast('自动存档读取失败；可通过手记导入备份。',4);show('menu');requestAnimationFrame(frame);
})(globalThis.Kong ||= {});
