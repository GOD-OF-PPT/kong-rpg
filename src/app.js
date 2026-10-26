(function(K){
  'use strict';
  const $=id=>document.getElementById(id),world=$('world');
  const renderer=new K.Renderer(world),audio=new K.Audio(),storage=new K.Storage();
  const loaded=storage.read();let state=loaded?.state||null,meta=loaded?.meta||K.cleanMeta();
  let screen='menu',backScreen='menu',buildBack='playing',toastUntil=0,lastSave=0,pendingInputs=[];
  const rememberedFocus=new Map();let focusRevision=0;
  const settings=storage.readSettings();renderer.shake=settings.shake;audio.setVolume(settings.volume);
  const metrics={frames:[],inputs:[],errors:[],started:performance.now()};
  const input=new K.Input(world,control,(t,code)=>pendingInputs.push({t:performance.now(),eventTime:t,code}));
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const btn=(id,text,primary=false)=>`<button id="${id}" class="button ${primary?'primary':''}" aria-label="${esc(text.replace(/<span\b[^>]*>[\s\S]*?<\/span>/g,'').replace(/<[^>]*>/g,'').trim())}">${text}</button>`;
  const on=(id,fn)=>$(id)?.addEventListener('click',fn);
  const relicArt=id=>`<span class="relic-art" style="--item-art:var(--icon-${K.reward(id)?.icon||id})" aria-hidden="true"></span>`;
  const rewardInfo=id=>K.reward(id,screen==='start'?{hero:K.pendingHero||'wukong'}:state);
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
    const choice=['heroes','start','reward','replace'].includes(screen),hint=choice?'<span><kbd>A</kbd><kbd>D</kbd> / <kbd>←</kbd><kbd>→</kbd> 选卷</span><span><kbd>Enter</kbd> 确认</span><span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> 速选</span>':['history','build'].includes(screen)?'<span><kbd>↑</kbd><kbd>↓</kbd> 翻阅</span><span><kbd>Tab</kbd> 移步</span><span><kbd>Enter</kbd> 确认</span>':'<span><kbd>↑</kbd><kbd>↓</kbd> 移步</span><span><kbd>Enter</kbd> 确认</span>';
    const back=['paused','build','help','legacy','history','prologue','epilogue','heroes','start','replace','won','dead'].includes(screen)?`<span><kbd>Esc</kbd> ${screen==='paused'?'继续':screen==='replace'?'返回选择':'返回'}</span>`:'';
    return `<section class="panel game-dialog dialog-${screen}" role="dialog" aria-modal="true" aria-label="${label}" aria-labelledby="dialog-title"><header class="dialog-heading"><span class="dialog-sigil" aria-hidden="true"></span><div class="eyebrow">${eyebrow}</div><h2 id="dialog-title">${title}</h2></header><div class="dialog-content">${body}</div><footer class="dialog-footer"><span class="footer-mark" aria-hidden="true">◇</span>${screen==='heroes'?hint.replace('选卷','选人').replace('<kbd>3</kbd>',''):hint}${back}</footer></section>`;
  };
  function toast(text,seconds=2.8){$('toast').textContent=text;$('toast').hidden=false;toastUntil=performance.now()+seconds*1000;}
  function save(){if(!state)return;storage.write(state,meta);$('storage-status').textContent=storage.available?'独立离线版 · 旅程已保存':'自动存储不可用 · 请导出存档';lastSave=performance.now();}
  function show(next){
    const focused=document.activeElement;if($('overlay').contains(focused))rememberedFocus.set(screen,focused.id?{id:focused.id}:focused.dataset.relic?{relic:focused.dataset.relic}:null);
    if(state&&next!=='playing'&&state.arm?.phase==='charge')K.cancelSignature(state,true);screen=next;input.setActive(next==='playing');if(next!=='playing')audio.stopImpacts();$('stage').dataset.mode=next;
    const modal=!['menu','playing'].includes(next);document.querySelector('.masthead').inert=modal;document.querySelector('.footline').inert=modal;world.inert=modal;$('hud').inert=modal;
    if(next!=='playing'){pendingInputs=[];$('toast').hidden=true;toastUntil=0;}
    $('hud').hidden=!state||next!=='playing';$('overlay').innerHTML='';
    $('pause').disabled=!['playing','paused'].includes(next);$('combat-labels').hidden=next!=='playing';
    if(next==='playing'){world.focus({preventScroll:true});return;}
    const render={menu,prologue,heroes, start:starter,paused:pauseMenu,build:buildMenu,help,reward,replace:replaceRelic,dead:ending,won:ending,epilogue,legacy:legacyMenu,history};render[next]?.();
    const revision=++focusRevision;
    requestAnimationFrame(()=>{if(revision!==focusRevision||screen!==next)return;const memory=rememberedFocus.get(next),node=memory?.id?$(memory.id):memory?.relic?$('overlay').querySelector('[data-relic="'+memory.relic+'"]'):null;(node||(['history','build'].includes(next)?$('overlay').querySelector('.history-list,.build-scroll'):$('overlay').querySelector('button:not(:disabled),input')))?.focus({preventScroll:true});});
  }
  function menu(){
    const resumable=state&&['paused','playing','reward'].includes(state.mode);
    $('overlay').innerHTML=`<div class="hero"><div class="eyebrow">西游记后传 · 像素横版肉鸽</div><h1><small>大 圣</small>劫后行</h1><div class="english-title">AFTER THE BLACK LOTUS</div><p>走过山道，渡过暗河，叩开灵山。<br>这一回，带着你的解法破局。</p><div class="actions">${btn('begin','踏上劫途 <small>→</small>',true)}${resumable?btn('resume','继续旅程'):btn('how','初行指南')}</div><div class="seed-edit"><label for="seed">本局因缘</label><input id="seed" aria-label="随机种子" maxlength="32" value="${esc(state?.seed||'LOTUS-1025')}"><button id="random-seed" class="text-button" aria-label="生成新种子">换一签 ↻</button></div><div class="hero-meta"><span><b>${meta.runs}</b> 次入劫</span><span><b>${meta.wins}</b> 次破局</span><button id="past" class="text-button">往昔旅程 ↗</button>${storage.legacy?'<button id="old" class="text-button">旧版旅程 ↗</button>':''}</div></div><div class="scene-label">三境六阵 · 舍利成法<span>棍可破莲 · 心不可折</span></div>`;
    on('begin',()=>{K.pendingSeed=$('seed').value.trim()||'LOTUS-1025';audio.unlock();show(meta.runs===0?'prologue':'heroes');});
    on('resume',resume);on('how',()=>openHelp('menu'));on('past',()=>show('history'));on('old',()=>show('legacy'));
    on('random-seed',()=>$('seed').value='LOTUS-'+crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0,6).toUpperCase());
  }
  function prologue(){
    $('overlay').innerHTML=panel('开篇','序 · 黑莲之劫','三界的灯，还没有熄',`<p class="story-copy">无天的黑莲遮住灵山。三位守阵者扼住了众生的归路。<br><br>孙悟空踏上劫途，哪吒亦来应援。择一位应劫者，走过三境、破除沿途阵眼，再叩无天。<br>攻击积攒战意，满时按 R 施展各自的大神通。<br>沿途择舍利、悟法门、借符术。你的解法，决定此行。</p><div class="journey-map"><span>壹<br><b>雾隐山道</b></span><i>―</i><span>贰<br><b>悬灯古渡</b></span><i>―</i><span>叁<br><b>灵山残庭</b></span><i>―</i><span>终<br><b>黑莲法界</b></span></div><div class="actions">${btn('begin-relic','选择应劫者',true)}${btn('back','返回')}</div>`);
    on('begin-relic',()=>show('heroes'));on('back',()=>show('menu'));
  }
  function cards(ids){return `<div class="cards">${ids.map((id,i)=>{const r=rewardInfo(id),copy=K.isRanged(screen==='start'?{hero:K.pendingHero}:state||{})?[r.text,r.cost]:cardCopy[id]||[r.text,r.cost],verb=screen==='replace'?'放下此物':id==='rest'?'借灯调息':r.temporary?'携此符术':r.max?'悟此法门':'取此舍利',tag=r.max?r.tag+' · '+(K.rank(state,id)+1)+'/'+r.max:r.tag;return `<button class="relic-card" data-relic="${id}" aria-label="${screen==='replace'?'放下':'选择'}${r.name}" aria-describedby="relic-detail-${id} relic-cost-${id}" style="--relic-tone:${r.color}"><span class="num" aria-hidden="true">${['壹','贰','叁'][i]}</span>${relicArt(id)}<h3>${r.name}</h3><span class="tag">${tag}</span><p id="relic-detail-${id}">${copy[0]}</p><span class="cost" id="relic-cost-${id}">${copy[1]}</span><span class="choice-verb" aria-hidden="true">${verb}</span></button>`;}).join('')}</div>`;}
  function bindCards(fn){for(const b of $('overlay').querySelectorAll('[data-relic]'))b.onclick=()=>fn(b.dataset.relic);}
  function heroes(){
    $('overlay').innerHTML=panel('选择应劫者','棍影与回环 · 同赴黑莲','此行，谁来应劫？',`<div class="hero-choices">${K.HEROES.map(h=>`<button id="choose-${h.id}" data-hero="${h.id}" class="hero-choice" aria-label="选择${h.name}"><span class="hero-portrait hero-${h.id}" aria-hidden="true"></span><h3>${h.name}</h3><b>${h.title}</b><p>${h.text}</p><small>${h.id==='nezha'?'J掷环 / 左键瞄准 · U风火轮 · L混天绫 · R莲火轮阵':'J三连棍 · U伸棍/撑跃 · L分身 · R法天象地'}</small></button>`).join('')}</div><div class="actions">${btn('back','返回')}</div>`);
    const paint=()=>{for(const h of K.HEROES){const im=K.ImageArt.images[h.id==='wukong'?'wukong':'nezha'];const n=$('overlay').querySelector('.hero-'+h.id);if(n&&im)n.style.backgroundImage='url("'+im.src+'")';}};paint();K.ImageArt.ready.then(()=>{if(screen==='heroes')paint();});
    for(const b of $('overlay').querySelectorAll('[data-hero]'))b.onclick=()=>{K.pendingHero=b.dataset.hero;show('start');};on('back',()=>show('menu'));
  }
  function starter(){
    $('overlay').innerHTML=panel('选择初始舍利','启程 · 一念成法',K.heroDef({hero:K.pendingHero}).name+' · 带哪一念入劫？',`<p class="subtitle">择一舍利启程，途中可换法。最多携带三枚。</p>${cards(['cloud','echo','staff'])}<div class="actions">${btn('back','返回')}</div>`);
    bindCards(startRun);on('back',()=>show('heroes'));
  }
  function startRun(id){
    state=K.newRun(K.pendingSeed||state?.seed||'LOTUS-1025',id,K.pendingHero||'wukong');meta.runs++;state.runId=state.seed+':'+meta.runs+':'+Date.now();renderer.camera=0;audio.unlock();show('playing');toast(K.STAGES[0].lore,4);save();
  }
  function resume(){if(!state)return;audio.unlock();if(state.mode==='paused')state.mode='playing';show(state.mode==='reward'&&state.pendingRelic?'replace':state.mode);}
  function pauseMenu(){
    $('overlay').innerHTML=panel('暂停菜单','暂歇 · 风停此刻','此心未歇',`<p class="pause-place">${K.heroDef(state).name} · ${K.STAGES[state.stage].name} · 因缘 ${esc(state.seed)}</p>${growthLine()}<nav class="pause-nav" aria-label="暂歇选择">${btn('continue','继续前行 <span aria-hidden="true">ESC</span>',true)}${btn('build-details','本局法门 <span aria-hidden="true">已选加成 · B</span>')}${btn('help','行者手记 <span aria-hidden="true">招式与破局</span>')}${btn('main-menu','回到主菜单')}</nav><div class="setting-row"><label for="volume">声音</label><input id="volume" aria-label="音量" type="range" min="0" max="100" value="${settings.volume*100}"><label><input id="shake" type="checkbox" ${settings.shake?'checked':''}> 屏震</label></div><div class="pause-tools">${btn('export','导出存档')}${btn('import','导入存档')}</div><p class="notice">旅程已停。导出存档可将此行带往另一入口。</p>${journal()}`);
    on('build-details',()=>openBuild('paused'));on('continue',resume);on('help',()=>openHelp('paused'));on('export',exportSave);on('import',()=>$('import-file').click());on('main-menu',()=>{save();show('menu');});
    $('volume').oninput=e=>{settings.volume=Number(e.target.value)/100;audio.setVolume(settings.volume);storage.settings(settings);};
    $('shake').onchange=e=>{settings.shake=e.target.checked;renderer.shake=settings.shake;storage.settings(settings);};
  }
  function openBuild(back){if(!state)return;buildBack=back;if(back==='playing'){K.cancelSignature(state,true);state.mode='paused';save();}show('build');}
  function closeBuild(){if(buildBack==='playing'){state.mode='playing';show('playing');}else show(buildBack);}
  function buildMenu(){
    const section=(title,entries)=>'<h3>'+title+'</h3>'+ (entries.length?entries.map(([id,level])=>{const r=rewardInfo(id);return `<article class="build-entry" role="listitem">${relicArt(id)}<div><h4>${r.name}<small>${level}</small></h4><p>${r.text}</p><p class="build-cost">${r.cost}</p></div></article>`;}).join(''):'<p class="build-empty">此行尚未取得。可在借灯或试炼奖励中选择。</p>');
    const body=section('舍利 · '+state.relics.length+' / 3',state.relics.map(id=>[id,'已携带']))+section('法门 · 本局保留',Object.entries(state.growth).map(([id,n])=>[id,n+'/'+rewardInfo(id).max+'重'+(id==='vitality'?' · 上限 +'+20*n:'')]))+section('符术 · Q 限次',state.talisman?[[state.talisman.id,'剩余 '+state.talisman.charges+' 次']]:[]);
    $('overlay').innerHTML=panel('本局法门与已选加成','此行所悟 · 看清再变化','本局法门',`<div class="build-vitals"><span>生命 <b>${Math.ceil(state.player.hp)} / ${K.maxHP(state)}</b></span><span>定力 <b>${Math.floor(state.player.focus)} / 100</b></span><span>战意 <b>${Math.floor(state.player.rage)} / 100</b></span></div><p class="build-scroll-hint">滚轮 / ↑ ↓ 翻阅全部加成 · Tab 移步 · B 或 Esc 返回</p><div class="build-scroll" role="list" tabindex="0" aria-label="已选加成效果，可滚动">${body}<h3>${K.heroDef(state).name} · 常备神通</h3><p class="build-empty">${K.isRanged(state)?'U 按住驭轮：8定力启动＋20/秒；W/空格升、S降，可空中掷环。轮火'+K.wheelMax(state)+'秒，落地松开回充；受伤、K或R收轮，无无敌。':'U 按住蓄棍、松开伸刺：10定力＋24/秒蓄长，棍身16伤、金尖34伤。金尖破盾；定海心将金尖区从42加宽至70。S松U改撑跃，必须触及实地。K取消，不返定力。'}</p><p class="build-empty">${K.isRanged(state)?'乾坤圈：去程18、回程22，一环在外不可再掷。左键自由瞄准，J水平掷环；前盾可挡，换位借回程打背。<br>':''}R ${K.heroDef(state).skill}：100战意，64伤害；${rewardInfo('ultimate-echo').name}追加32。<br>L ${K.isRanged(state)?'混天绫':'分身'}：${K.isRanged(state)?(K.has(state,'echo')?'50定力 / 3秒 / 240范围':'40定力 / 1.8秒 / 180范围'):(K.has(state,'echo')?'50定力 / 3秒 / 穿透棍风':'40定力 / 1.8秒 / 近身棍击')}。K 闪避：0.85秒冷却，起势短暂无敌。<br>掉落已拾 ${state.stats.drops} · 试炼已破 ${state.stats.trials} · 归灯已借 ${state.stats.camps}</p></div><div class="actions">${btn('close-build',buildBack==='reward'?'返回奖励选择':buildBack==='paused'?'返回暂歇':'继续前行',true)}</div>`);
    on('close-build',closeBuild);
  }
  function openHelp(back){backScreen=back;show('help');}
  function help(){
    const lessons=[
      ['步法与落点','A D移动，空格/W跳。长按高跳、松开短跳；S＋空格下穿。踩敌反弹，腾云骨多一跳。'],
      ['棍法与掷环','悟空J/左键三连，第三棍可打断；空中S＋J下劈。哪吒J水平掷环、左键瞄准，去程18/回程22；一环在外不能再掷。盾兵可绕背、踩踏或借破盾加成。'],
      ['闪避与神通','K/Shift闪避，0.85秒冷却。L/右键：悟空分身、哪吒混天绫，耗40定力；照影珠或缚莲绫耗50。普攻命中回定力。'],
      ['法天象地与符术','命中积攒战意，满100按R释放大招：破盾、清近处敌弹。起势护体，收招仍有风险。Q使用限次符术，余量见左上。U：悟空按住蓄棍、松开伸刺；S松开撑地跃。哪吒按住驭轮，W升S降，松开落下。'],
      ['长路与成法','F借灯、触发见闻或过门。上路试炼可跳过，清场后回去领奖；归灯只用一次。补给满值留地。每次奖励择一：舍利最多三枚，法门本局保留，新符替换旧符；B查详情。'],
      ['敌招与重来','突刺/盾冲按路径跳避；交叉印与锁空印锁定后移开，飞行时可收轮下降。三守关考跳跃和横移；三境均需破双阵、退守关者。无天绕背或趁收招。失败清空本局成长。']
    ];
    $('overlay').innerHTML=panel('行者手记','手记 · 看清再出手','棍有尽处，变化无穷',`<div class="help-grid">${lessons.map(([title,text])=>`<div><h3>${title}</h3><p>${text}</p></div>`).join('')}</div><div class="actions">${btn('close-help','记下了',true)}${btn('import','导入存档')}${btn('old','原版旅程')}</div>`);
    on('close-help',()=>show(backScreen));on('import',()=>$('import-file').click());on('old',()=>show('legacy'));
  }
  function reward(){
    save();const mid=state.rewardKind==='mid',trial=state.rewardKind==='trial';
    $('overlay').innerHTML=panel('舍利、法门与补给',trial?'试炼已破 · 以战悟法':mid?'阵眼已破 · 余灯尚温':'守关者已退 · 山门将启',trial?state.room.trial.name+' · 择一法':mid?'借灯，重整一念':'山门将启，再择一法',`<p class="subtitle">${mid||trial?'舍利、法门或符术择一，亦可借灯调息。':'前往'+K.STAGES[state.stage+1].name+' · 过境另恢复18生命、20定力。'}</p><div class="offering-status"><span>生命 <b>${Math.ceil(state.player.hp)} / ${K.maxHP(state)}</b></span><span>定力 <b>${Math.floor(state.player.focus)}</b></span><span>舍利 <b>${state.relics.length} / 3</b></span></div>${cards(state.reward)}${equipped(state.relics)}<div class="build-summary">${growthLine()}${btn('build-details','查看已选加成 · B')}</div>`);bindCards(choose);on('build-details',()=>openBuild('reward'));
  }
  function choose(id,replace){const kind=state.rewardKind,result=K.choose(state,id,replace);if(result==='replace'){show('replace');save();return;}if(result){audio.event({type:'relic'});if(kind==='exit')renderer.camera=0;show('playing');toast(kind==='exit'?K.STAGES[state.stage].lore:'灯火尚在，继续前行。',3.5);save();}}
  function replaceRelic(){
    const next=rewardInfo(state.pendingRelic);$('overlay').innerHTML=panel('替换舍利','舍利已满 · 有舍有得','放下一念，换取'+next.name,`<div class="incoming-relic">${relicArt(next.id)}<p><strong>即将取得 · ${next.name}</strong>${next.text}</p></div><p class="starter-note">下方三枚为已携带舍利。择一放下，或返回重新选择。</p>${cards(state.relics)}<div class="actions">${btn('cancel-replace','返回选择')}</div>`);bindCards(id=>choose(state.pendingRelic,id));on('cancel-replace',()=>{state.pendingRelic=null;show('reward');save();});
  }
  function settle(){
    if(meta.history.some(x=>x.id===state.runId))return;
    const won=state.mode==='won';if(won)meta.wins++;meta.best=Math.max(meta.best,won?4:state.stage);
    meta.history.push({id:state.runId,seed:state.seed,won,stage:state.stage,hero:state.hero,seconds:Math.floor(state.elapsed),damage:state.damageTaken,relics:state.relics.slice()});meta.history=meta.history.slice(-8);save();
  }
  function ending(){
    settle();const won=state.mode==='won',seconds=Math.floor(state.elapsed),time=Math.floor(seconds/60)+'分'+seconds%60+'秒';
    $('overlay').innerHTML=panel(won?'胜利结算':'失败结算',won?'黑莲已散 · 此心长明':'劫途未尽 · 再起一念',won?'三界重见微光':'此身暂歇，此心未折',`<p class="subtitle">${won?'无天的莲影终于落地。三境的灯火，正一盏一盏重新亮起。':'最后受伤：'+esc(state.lastDamage)+'。<br>记住刀光和落点，再次入劫时可以换一枚舍利。'}</p><div class="results"><div><small>此行</small><b>${time}</b></div><div><small>破阵</small><b>${state.broken} / 8</b></div><div><small>退敌</small><b>${state.kills}</b></div><div><small>承伤</small><b>${state.damageTaken}</b></div></div><div class="result-build">${K.heroDef(state).name} · 因缘 ${esc(state.seed)}${equipped(state.relics)}${growthLine()}${K.heroDef(state).skill} ${state.stats.ultimates} 次 · 符术 ${state.stats.talismans} 次 · 守关 ${state.stats.guardians}/3<br>跃起 ${state.stats.jumps} 次 · ${K.isRanged(state)?'绫缚':'分身'} ${state.stats.clones} 次 · 消耗定力 ${Math.round(state.stats.focusSpent)}<br>此行所护：${worldSummary()||'一路直抵黑莲，尚有未尽的归路'}</div><div class="actions">${won?btn('epilogue','走出黑莲',true):btn('retry','同缘再行',true)}${won?btn('retry','同缘再行'):btn('new-path','另启因缘')}${btn('export','导出此行')}</div>`);
    on('retry',()=>{K.pendingSeed=state.seed;K.pendingHero=state.hero;show('heroes');});on('new-path',()=>show('menu'));on('export',exportSave);on('epilogue',()=>show('epilogue'));
  }
  function epilogue(){
    $('overlay').innerHTML=panel('尾声','尾声 · 灯火人间','前路，还有众生',`<p class="story-copy">${state.world.rescue?'山道上的行者走出了牢笼，沿着归路点起灯火。':'山道雾散，旧寨仍有未解的牢笼。你记下了回去的路。'}<br>${state.world.bridge?'渡口的桥接回两岸，灯终于照见对岸的人。':'渡口的灯还在等人。灵山之外，也有你未走完的路。'}<br>${state.world.bell?'镇莲钟的余音里，众生的愿力托住了最后一棍。':'灵山残钟仍沉默。此劫已破，众生仍有未竟的愿。'}<br><br>你收起兵器，走回那些还需要你的地方。</p><div class="actions">${btn('again','再入因缘',true)}${btn('back-result','查看此行')}${btn('main-menu','回到主菜单')}</div>`);
    on('again',()=>{K.pendingSeed='LOTUS-'+crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0,6);show('heroes');});on('back-result',()=>show('won'));on('main-menu',()=>show('menu'));
  }
  function history(){
    $('overlay').innerHTML=panel('往昔旅程','因缘簿 · 留迹不留战力','你走过的路',`<div class="history-folio"><div class="history-list" tabindex="0" aria-label="旅程记录，可滚动">${meta.history.length?meta.history.slice().reverse().map(r=>`<div><b>${r.won?'破劫':'止步'+K.STAGES[r.stage].name}</b><span>${esc(r.seed)}</span><span>${Math.floor(r.seconds/60)}分${r.seconds%60}秒</span><small>${K.heroDef(r).name} · ${r.relics.map(id=>K.reward(id,r).name).join(' · ')}</small></div>`).join(''):`<div class="empty-history">${relicArt('rest')}<p>因缘簿尚未落墨。<br>选择应劫者，先走一程。</p></div>`}</div></div><p class="history-hint">${meta.history.length?'共 '+meta.history.length+' 行旅记 · 滚轮或 ↑ ↓ 翻阅':'行过之处，终会留下痕迹'}</p><div class="actions">${btn('back','返回',true)}</div>`);on('back',()=>show('menu'));
  }
  function legacyMenu(){
    $('overlay').innerHTML=panel('原版旅程','存档保护 · 旧路仍在','在原来的规则中继续',`<p class="story-copy">旧版的地图与规则和新版不同。你的旧旅程不会被覆盖，也不会被悄悄搬到另一张地图。<br><br>${storage.legacy?'可先下载旧档，再在打开的原版里通过「初行指南 → 导入存档」继续。':'保留的原版可直接打开；如果你有旧JSON文件，请在原版的指南中导入。'}</p><div class="actions">${btn('open-legacy',storage.legacy?'备份旧档并打开原版':'打开原版',true)}${btn('back','返回新版')}</div>`);
    on('open-legacy',()=>{if(storage.legacy)K.download(JSON.stringify(storage.legacy),'劫后行-v'+storage.legacy.state.version+'-旧旅程.json');const version=storage.legacy?.state?.version||6,legacyName='legacy-v'+version+'.html';const legacy=document.querySelector('meta[name="kong-package"]')?legacyName:'release/'+legacyName;window.open(new URL(legacy,location.href).href,'_blank','noopener');toast('已打开保留的原版；可通过手记导入旧旅程。',4);});on('back',()=>show('menu'));
  }
  function exportSave(){save();storage.export(state,meta);toast('已导出整段旅程，含动态敌招与舍利选择。');}
  function control(action){
    if(action==='build'&&screen==='playing')openBuild('playing');
    if(action==='pause'){if(screen==='playing'){K.cancelSignature(state,true);state.mode='paused';save();show('paused');}else if(screen==='paused')resume();else if(screen==='build')closeBuild();else if(screen==='help')show(backScreen);else if(screen==='replace'){state.pendingRelic=null;show('reward');save();}else if(screen==='epilogue')show('won');else if(screen==='start')show('heroes');else if(['heroes','prologue','legacy','history','won','dead'].includes(screen))show('menu');}
    if(action==='blur'&&screen==='playing'){K.cancelSignature(state,true);state.mode='paused';save();show('paused');}
  }
  on('build-open',()=>openBuild('playing'));on('pause',()=>control('pause'));on('guide-top',()=>{const back=screen==='playing'?'paused':screen;if(screen==='playing'){K.cancelSignature(state,true);state.mode='paused';save();}openHelp(back==='help'?backScreen:back);});
  on('brand',e=>{e.preventDefault();if(screen==='playing'){K.cancelSignature(state,true);state.mode='paused';save();}show('menu');});
  $('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;let raw='';try{raw=await file.text();const data=storage.import(raw);state=data.state;meta=data.meta;renderer.camera=K.clamp(state.player.x-300,0,state.room.width-960);save();show(state.mode==='reward'&&state.pendingRelic?'replace':state.mode);toast('旅程已恢复。',2);}catch(err){if(err.legacy){try{storage.legacy=JSON.parse(raw);show('legacy');}catch{toast('旧存档无法读取。');}}else toast('导入失败：'+err.message);}e.target.value='';};
  window.addEventListener('keydown',e=>{
    if(e.defaultPrevented)return;
    if(e.target.classList.contains('build-scroll')&&['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.code)){e.preventDefault();const n=e.target;if(e.code==='Home')n.scrollTop=0;else if(e.code==='End')n.scrollTop=n.scrollHeight;else n.scrollTop+=(['ArrowUp','PageUp'].includes(e.code)?-1:1)*(e.code.startsWith('Page')?n.clientHeight*.8:45);return;}
    if(e.code==='KeyB'&&!e.repeat&&['paused','reward','build'].includes(screen)){e.preventDefault();if(screen==='build')closeBuild();else openBuild(screen);return;}
    if(e.code==='Escape'&&screen!=='playing'){e.preventDefault();if(!e.repeat)control('pause');return;}
    const field=['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName);
    if(!field&&['heroes','start','reward','replace'].includes(screen)&&/^Digit[123]$/.test(e.code)){e.preventDefault();if(e.repeat)return;const i=Number(e.code.slice(-1))-1;audio.unlock();audio.menu('confirm');if(screen==='heroes'){if(i<2){K.pendingHero=K.HEROES[i].id;show('start');}}else if(screen==='start')startRun(['cloud','echo','staff'][i]);else if(screen==='replace')choose(state.pendingRelic,state.relics[i]);else choose(state.reward[i]);return;}
    if(screen!=='playing'){
      const nodes=[...$('overlay').querySelectorAll('button:not(:disabled),input:not([hidden]),summary,[tabindex="0"]')].filter(n=>n.getClientRects().length);
      if(e.code==='Tab'&&nodes.length){const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
      const cardKey=['heroes','start','reward','replace'].includes(screen)&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&['KeyA','KeyD'].includes(e.code);
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
    if(!state)return;const p=state.player;$('player-name').textContent=K.heroDef(state).name;$('ultimate-name').textContent='R '+K.heroDef(state).skill;$('range-state').textContent=K.isRanged(state)?(state.ring?(state.ring.phase==='out'?'乾坤圈 · 去程':'乾坤圈 · 回收'):'乾坤圈 · 就绪'):'';
    const sig=K.isRanged(state);$('signature-name').textContent=sig?'U 风火轮':'U 如意伸缩';$('signature-fill').style.width=(sig?Math.min(100,p.wheelFuel/K.wheelMax(state)*100):state.arm?.phase==='charge'?state.arm.charge/.6*100:p.armCD>0?0:100)+'%';$('signature-state').textContent=sig?(state.flight?'驭轮':p.wheelFuel<.08?'落地回充':p.wheelFuel.toFixed(1)+'s'):state.arm?({charge:'蓄棍',thrust:'伸',recover:'收',vault:'撑'})[state.arm.phase]:p.armCD>0?'回气':'就绪';
    $('hp-number').textContent=Math.ceil(p.hp)+' / '+K.maxHP(state);$('hp-fill').style.width=(p.hp/K.maxHP(state)*100)+'%';$('focus-number').textContent=Math.floor(p.focus);$('focus-fill').style.width=p.focus+'%';$('rage-number').textContent=Math.floor(p.rage);$('rage-fill').style.width=p.rage+'%';$('rage-line').classList.toggle('ready',p.rage>=100);$('rage-line').title=p.rage>=100?'按 R 释放'+K.heroDef(state).skill:'命中积攒战意';$('talisman-state').textContent=state.talisman?'Q '+rewardInfo(state.talisman.id).name+' ×'+state.talisman.charges:'Q 未携符术';$('growth-state').textContent=Object.entries(state.growth).map(([id,n])=>rewardInfo(id).name+(n>1?'·'+n+'重':'')).join(' · ')||'暂无';$('chapter').textContent=state.stage<3?'第'+['一','二','三'][state.stage]+'境':'终局';$('stage-name').textContent=K.STAGES[state.stage].name;$('chapter').textContent+=' · '+K.region(state.stage,p.x);
    const left=state.room.seals.find(q=>q.hp>0),guardian=K.guardian(state);$('objective').textContent=state.stage<3?(left?'阵眼 '+(state.room.seals.filter(q=>q.hp===0).length+1)+' / 2 · 前方 '+Math.max(0,Math.ceil((left.x-p.x)/10))+'丈':guardian?.hp>0?'击退山门守关者 · '+K.GUARDIANS[state.stage].name:'双阵与守关已破 · F过门'):left?'破除法界双阵 · 前方 '+Math.max(0,Math.ceil((left.x-p.x)/10))+'丈':state.room.enemies[0].dormant?'前往莲座 · 归灯可调息一次':'绕背破莲 · 金色收招全额受伤';
    $('run-seed').textContent=state.seed;$('relic-list').textContent=state.relics.map(id=>rewardInfo(id).name).join(' · ')+'  ['+state.relics.length+'/3]';$('dash-state').textContent=p.dashCD>0?'闪避恢复 '+p.dashCD.toFixed(1)+'s':'闪避就绪';
    const boss=state.room.enemies.find(e=>(e.kind==='boss'||e.kind==='warden')&&!e.dormant&&e.hp>0);$('boss-hud').hidden=!boss;
    if(boss){$('boss-name').textContent=boss.kind==='warden'?K.GUARDIANS[state.stage].name:'无天';$('boss-fill').style.width=boss.hp/boss.maxHp*100+'%';$('boss-hud').style.setProperty('--boss-color',boss.kind==='warden'?K.GUARDIANS[state.stage].color:'#ba77a3');$('boss-phase').textContent=boss.kind==='warden'?(boss.phase==='recover'?'收招破绽 · 出棍':boss.phase==='warden-windup'?({charge:'冲撞将至 · 跃过路径',quake:'震地将至 · 跳',fan:'散焰将至 · 跳或返弹',lantern:'索灯将至 · 离开莲印',columns:'封愿将至 · 横移',bell:'钟浪将至 · 跳'}[boss.move]):'看清下一招'):boss.phase==='recover'?'破绽已现':boss.phase==='sweep-windup'?'横扫将至 · 跳':boss.phase==='orb-windup'?'莲焰将至 · 闪':boss.phase==='rain-windup'?'落火将至 · 离开莲印':boss.phase==='shift-windup'?'移形将至 · 让路':'黑莲护在正面';}
    const trial=state.room.trial,camp=state.room.camp,nearTrial=trial&&Math.abs(p.x-trial.x)<95&&Math.abs(p.y-trial.y)<75,nearCamp=camp&&Math.abs(p.x-camp.x)<75&&Math.abs(p.y-camp.y)<65;
    const node=state.room.node,nearNode=node&&Math.abs(p.x-node.x)<90&&Math.abs(p.y-396)<95;const gate=state.stage<3&&Math.abs(p.x-state.room.exit)<85;const lamp=state.stage<3&&state.room.seals[0].hp===0&&!state.room.midClaimed&&Math.abs(p.x-state.room.seals[0].x)<85;
    const pickup=state.room.pickups.filter(q=>!q.used&&q.enabled!==false&&Math.abs(p.x+p.w/2-q.x-q.w/2)<72&&Math.abs(p.y+p.h-q.y-q.h)<54).sort((a,b)=>Math.abs(p.x-a.x)-Math.abs(p.x-b.x))[0];
    $('context-hint').hidden=screen!=='playing'||(!gate&&!lamp&&!nearNode&&!nearTrial&&!nearCamp&&!pickup&&state.roomTime>9);
    $('context-hint').textContent=nearTrial?(trial.state==='ready'?'F 开启'+trial.name+' · 可跳过，胜后多选一项加成':trial.state==='cleared'?'F 领取试炼奖励':trial.state==='claimed'?'试炼奖励已取':'试炼进行中 · 可退回下路'):nearCamp?(camp.used?'归灯余温已尽':'F 归灯调息 · 生命+24 定力+20 · 仅一次'):nearNode?(node.state==='done'?'F 回看此地见闻':node.state==='active'?'守阵者尚在 · 可离开后返回':node.id==='bridge'?'F 燃灯接桥 · 消耗20定力':node.id==='rescue'?'F 破笼救困 · 会惊动守卒':'F 叩钟破妄 · 会惊动守钟众'):lamp?'F 借灯整顿 · 舍利、法门与符术':gate?(left?'阵眼尚存，回身破阵':guardian?.hp>0?'守关者尚在，击退后过门':'F 穿过山门'):(K.isRanged(state)?'左键瞄准掷环 · U驭轮 W升S降 · 松开落地回充':'J棍击 · U蓄放伸棍 / S松U撑跃 · L分身');
    if(pickup){const text=K.pickupHint(state,pickup);$('context-hint').textContent=nearTrial||nearCamp||nearNode||lamp||gate?$('context-hint').textContent+' · '+text:text;}
    const progress=$('journey-fill');if(progress)progress.style.width=Math.min(100,p.x/state.room.exit*100)+'%';
    const labels=$('combat-labels');if(labels)labels.innerHTML=state.effects.filter(f=>f.text&&f.life>0).slice(-12).map(f=>`<span class="impact-number ${f.kind==='hurt'?'hurt':f.kind==='heavy-hit'?'heavy':f.kind==='block'?'block':''}" style="left:${(f.x-renderer.camera)/960*100}%;top:${(f.y-((f.duration||.42)-f.life)*65)/540*100}%">${esc(f.text)}</span>`).join('');
  }
  let previous=performance.now(),accumulator=0,lastHud=0;
  function frame(now){
    try{
      const elapsed=Math.min((now-previous)/1000,.1);if(screen==='playing'){metrics.frames.push(now-previous);if(metrics.frames.length>10000)metrics.frames.shift();}previous=now;accumulator+=elapsed;
      const willStep=screen==='playing'&&accumulator>=K.DT&&state.hitstop<=0;let actions=willStep?input.read():{},guard=0;
      if(screen==='playing')while(accumulator>=K.DT&&guard++<13){
        K.step(state,actions);actions={...actions,jumpPressed:false,attackPressed:false,dashPressed:false,clonePressed:false,interactPressed:false,ultimatePressed:false,talismanPressed:false,signaturePressed:false};
        audio.events(state.events);
        for(const event of state.events){if(event.type==='boss-warning'||event.type==='guardian-enter')lastHud=0;if(event.type==='hurt')toast(event.source+' · -'+event.amount+'生命');if(event.type==='seal')toast('阵眼已破 · '+state.room.seals.filter(q=>q.hp===0).length+' / 2');if(event.type==='empty-focus')toast('定力不足；'+(K.isRanged(state)?'飞环':'棍击')+'命中可积攒。');if(event.type==='gate-locked')toast(state.room.seals.some(q=>q.hp>0)?'本境还有黑莲阵眼。':'山门守关者尚在，先击退再过门。');if(event.type==='ability-note')toast(event.text,1.6);if(event.type==='ultimate-ready')toast('战意已满 · R '+K.heroDef(state).skill,1.8);if(event.type==='ultimate')toast(K.heroDef(state).skill+' · 镇劫',.9);if(event.type==='guardian-enter')toast(event.name+' · '+K.GUARDIANS[state.stage].lesson,3.5);if(event.type==='guardian-defeat')toast(event.name+'已退 · 生命+12 · 破双阵后F过门',3);if(event.type==='hint')toast(K.isRanged(state)&&event.text.includes('连续轻棍')?'一环在外不可再掷；看突刺预警横移或跃过路径。':event.text,3.5);if(event.type==='story')toast(event.title+' · '+(K.isRanged(state)?event.text.replace('大圣','三太子'):event.text),5);if(event.type==='world-note')toast(event.text,3.5);}
        accumulator-=K.DT;if(state.mode!=='playing'){show(state.mode);break;}
      }else accumulator=0;
      renderer.draw(state,screen,elapsed);const submitted=performance.now();if(willStep){for(const q of pendingInputs)metrics.inputs.push({code:q.code,ms:+(submitted-q.t).toFixed(3),eventMs:+(submitted-q.eventTime).toFixed(3)});pendingInputs=[];}if(metrics.inputs.length>1000)metrics.inputs.splice(0,metrics.inputs.length-1000);
      audio.tick(screen==='playing',state?.stage||0);if(now-lastHud>80){hud();lastHud=now;}if(now>toastUntil)$('toast').hidden=true;if(state&&screen==='playing'&&now-lastSave>3000)save();
    }catch(e){metrics.errors.push(String(e.stack||e));console.error(e);if(state){state.mode='paused';show('paused');}toast('运行异常，先导出旅程后重新打开。',5);}
    requestAnimationFrame(frame);
  }
  Object.defineProperty(window,'__KONG__',{value:Object.freeze({snapshot:()=>state?JSON.parse(JSON.stringify({screen,state,meta,camera:renderer.camera})):({screen,state:null,meta}),metrics:()=>JSON.parse(JSON.stringify(metrics)),audio:()=>audio.diagnostics(),version:K.VERSION})});
  if(storage.error)toast('自动存档读取失败；可通过手记导入备份。',4);show('menu');requestAnimationFrame(frame);
})(globalThis.Kong ||= {});
