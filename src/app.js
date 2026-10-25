(function(K){
  'use strict';
  const $=id=>document.getElementById(id),world=$('world');
  const renderer=new K.Renderer(world),audio=new K.Audio(),storage=new K.Storage();
  const loaded=storage.read();let state=loaded?.state||null,meta=loaded?.meta||K.cleanMeta();
  let screen='menu',backScreen='menu',toastUntil=0,lastSave=0,pendingInputs=[];
  const settings=storage.readSettings();renderer.shake=settings.shake;audio.setVolume(settings.volume);
  const metrics={frames:[],inputs:[],errors:[],started:performance.now()};
  const input=new K.Input(world,control,(t,code)=>pendingInputs.push({t:performance.now(),eventTime:t,code}));
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const btn=(id,text,primary=false)=>`<button id="${id}" class="button ${primary?'primary':''}">${text}</button>`;
  const on=(id,fn)=>$(id)?.addEventListener('click',fn);
  const panel=(label,eyebrow,title,body)=>`<section class="panel" aria-label="${label}"><div class="eyebrow">${eyebrow}</div><h2>${title}</h2>${body}</section>`;
  function toast(text,seconds=2.8){$('toast').textContent=text;$('toast').hidden=false;toastUntil=performance.now()+seconds*1000;}
  function save(){if(!state)return;storage.write(state,meta);$('storage-status').textContent=storage.available?'独立离线版 · 旅程已保存':'自动存储不可用 · 请导出存档';lastSave=performance.now();}
  function show(next){
    screen=next;input.setActive(next==='playing');$('stage').dataset.mode=next;
    if(next!=='playing'){pendingInputs=[];$('toast').hidden=true;toastUntil=0;}
    $('hud').hidden=!state||['menu','prologue','start','legacy'].includes(next);$('overlay').innerHTML='';
    $('pause').disabled=!['playing','paused'].includes(next);$('combat-labels').hidden=next!=='playing';
    if(next==='playing'){world.focus({preventScroll:true});return;}
    const render={menu,prologue, start:starter,paused:pauseMenu,help,reward,replace:replaceRelic,dead:ending,won:ending,epilogue,legacy:legacyMenu,history};render[next]?.();
    requestAnimationFrame(()=>$('overlay').querySelector('button:not(:disabled),input')?.focus({preventScroll:true}));
  }
  function menu(){
    const resumable=state&&['paused','playing','reward'].includes(state.mode);
    $('overlay').innerHTML=`<div class="hero"><div class="eyebrow">西游记后传 · 像素横版肉鸽</div><h1><small>大 圣</small>劫后行</h1><div class="english-title">AFTER THE BLACK LOTUS</div><p>走过山道，渡过暗河，叩开灵山。<br>这一回，带着你的解法破局。</p><div class="actions">${btn('begin','踏上劫途 <small>→</small>',true)}${resumable?btn('resume','继续旅程'):btn('how','初行指南')}</div><div class="seed-edit"><label for="seed">本局因缘</label><input id="seed" aria-label="随机种子" maxlength="32" value="${esc(state?.seed||'LOTUS-1025')}"><button id="random-seed" class="text-button" aria-label="生成新种子">换一签 ↻</button></div><div class="hero-meta"><span><b>${meta.runs}</b> 次入劫</span><span><b>${meta.wins}</b> 次破局</span><button id="past" class="text-button">往昔旅程 ↗</button>${storage.legacy?'<button id="old" class="text-button">旧版旅程 ↗</button>':''}</div></div><div class="scene-label">三境六阵 · 舍利成法<span>棍可破莲 · 心不可折</span></div>`;
    on('begin',()=>{K.pendingSeed=$('seed').value.trim()||'LOTUS-1025';audio.unlock();show(meta.runs===0?'prologue':'start');});
    on('resume',resume);on('how',()=>openHelp('menu'));on('past',()=>show('history'));on('old',()=>show('legacy'));
    on('random-seed',()=>$('seed').value='LOTUS-'+crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0,6).toUpperCase());
  }
  function prologue(){
    $('overlay').innerHTML=panel('开篇','序 · 黑莲之劫','三界的灯，还没有熄',`<p class="story-copy">无天的黑莲遮住灵山。散落三境的舍利，仍映着众生的微光。<br><br>你是孙悟空。走过雾隐山道、悬灯古渡与灵山残庭，破除六处阵眼。<br>棍法挣来定力，神通打开空当；带哪三枚舍利，由你决定。</p><div class="journey-map"><span>壹<br><b>雾隐山道</b></span><i>―</i><span>贰<br><b>悬灯古渡</b></span><i>―</i><span>叁<br><b>灵山残庭</b></span><i>―</i><span>终<br><b>黑莲法界</b></span></div><div class="actions">${btn('begin-relic','握紧金箍棒',true)}${btn('back','返回')}</div>`);
    on('begin-relic',()=>show('start'));on('back',()=>show('menu'));
  }
  function cards(ids){return `<div class="cards">${ids.map((id,i)=>{const r=K.relic(id);return `<button class="relic-card" data-relic="${id}" aria-label="选择${r.name}"><span class="num">0${i+1}</span><span class="relic-glyph" style="color:${r.color}">${r.glyph}</span><h3>${r.name}</h3><span class="tag">${r.tag}</span><p>${r.text}</p><span class="cost">${r.cost}</span></button>`;}).join('')}</div>`;}
  function bindCards(fn){for(const b of $('overlay').querySelectorAll('[data-relic]'))b.onclick=()=>fn(b.dataset.relic);}
  function starter(){
    $('overlay').innerHTML=panel('选择初始舍利','启程 · 一念成法','带哪一念入劫？',`<p class="subtitle">最多携带三枚舍利。破阵后与过境时可借灯调整。<br>棍法积攒定力，分身消耗定力；每种解法都要选对时机。</p>${cards(['cloud','echo','staff'])}<p class="starter-note">1 / 2 / 3 选择 · A D 行走 · 空格跳 · J 棍 · K 闪 · L 分身</p><div class="actions">${btn('back','返回')}</div>`);
    bindCards(startRun);on('back',()=>show('menu'));
  }
  function startRun(id){
    state=K.newRun(K.pendingSeed||state?.seed||'LOTUS-1025',id);meta.runs++;state.runId=state.seed+':'+meta.runs+':'+Date.now();renderer.camera=0;audio.unlock();show('playing');toast(K.STAGES[0].lore,4);save();
  }
  function resume(){if(!state)return;audio.unlock();if(state.mode==='paused')state.mode='playing';show(state.mode==='reward'&&state.pendingRelic?'replace':state.mode);}
  function pauseMenu(){
    $('overlay').innerHTML=panel('暂停菜单','暂歇 · 风停此刻','此行尚未结束',`<p class="subtitle">${K.STAGES[state.stage].name} · 因缘 ${esc(state.seed)}<br>当前舍利：${state.relics.map(id=>K.relic(id).name).join(' / ')}</p><div class="actions">${btn('continue','继续前行',true)}${btn('help','行者手记')}</div><div class="setting-row"><label for="volume">声音</label><input id="volume" aria-label="音量" type="range" min="0" max="100" value="${settings.volume*100}"><label><input id="shake" type="checkbox" ${settings.shake?'checked':''}> 屏幕震动</label></div><div class="actions">${btn('export','导出存档')}${btn('import','导入存档')}${btn('main-menu','回到主菜单')}</div><p class="notice">设置会保留。HTTP与双击入口各自保存进度；导出JSON可带走整段旅程。失去焦点时自动暂停。</p>`);
    on('continue',resume);on('help',()=>openHelp('paused'));on('export',exportSave);on('import',()=>$('import-file').click());on('main-menu',()=>{save();show('menu');});
    $('volume').oninput=e=>{settings.volume=Number(e.target.value)/100;audio.setVolume(settings.volume);storage.settings(settings);};
    $('shake').onchange=e=>{settings.shake=e.target.checked;renderer.shake=settings.shake;storage.settings(settings);};
  }
  function openHelp(back){backScreen=back;show('help');}
  function help(){
    $('overlay').innerHTML=panel('行者手记','手记 · 看清再出手','棍有尽处，变化无穷',`<div class="help-grid"><div><h3>步法与落点</h3><p>A / D或方向键移动。空格 / W跳跃，长按高跳、松开短跳。S＋空格下穿悬台。踩敌反弹；腾云骨多一次空中跳。浅色亮边是能站立的平台。</p></div><div><h3>棍法与下劈</h3><p>J / 左键三连。第三棍更重、收招更慢；重击可打断普通敌人蓄力。空中S＋J下劈。盾正面挡轻棍，可绕背、踩踏或借定海心第三棍破盾。</p></div><div><h3>闪避与分身</h3><p>K / Shift短暂闪避，0.85秒冷却。L / 右键分身消耗40定力；照影珠消耗50。分身诱敌时本体可绕背；棍击命中恢复定力。</p></div><div><h3>危险如何表达</h3><p>金色举刀是蓄力，红色刀光才是有效攻击。连续轻棍不会冻结敌招。莲灯使瞄准发弹，阵眼亮起后向两侧释放莲焰。跳过地刺或走上层路线。</p></div><div><h3>舍利与借灯</h3><p>每境两处阵眼。破首座后靠近按E可借灯更换舍利或补给；可继续探索。右端山门按E过境。最多三枚，满位时需选择替换。过境另恢复18生命、20定力。</p></div><div><h3>无天与重来</h3><p>无天正面黑莲减伤，绕背与收招时完整受伤；定时跃过横扫，避开散射与移形冲击。死亡清空局内成长，保留旅程记录。相同因缘可复现布局与选择。</p></div></div><div class="actions">${btn('close-help','记下了',true)}${btn('import','导入存档')}${btn('old','原版旅程')}</div><p class="notice">新版不会改写旧版存档；v1进行中旅程请在保留的原版中继续。</p>`);
    on('close-help',()=>show(backScreen));on('import',()=>$('import-file').click());on('old',()=>show('legacy'));
  }
  function reward(){
    save();const mid=state.rewardKind==='mid';
    $('overlay').innerHTML=panel('舍利与补给',mid?'阵眼已破 · 余灯尚温':'此境已破 · 山门将启',mid?'借这盏灯，调整解法':'下一程，带哪一种解法？',`<p class="subtitle">${mid?'选择之后回到原地，仍可探索本境。':'将前往'+K.STAGES[state.stage+1].name+'，过境恢复18生命与20定力。'}<br>当前生命 ${Math.ceil(state.player.hp)} / 100 · 定力 ${Math.floor(state.player.focus)} / 100 · 舍利 ${state.relics.length} / 3</p>${cards(state.reward)}<p class="starter-note">1 / 2 / 3 选择 · 已携带：${state.relics.map(id=>K.relic(id).name).join(' / ')}</p>`);bindCards(choose);
  }
  function choose(id,replace){const kind=state.rewardKind,result=K.choose(state,id,replace);if(result==='replace'){show('replace');save();return;}if(result){audio.event({type:'relic'});if(kind==='exit')renderer.camera=0;show('playing');toast(kind==='exit'?K.STAGES[state.stage].lore:'灯火尚在，继续前行。',3.5);save();}}
  function replaceRelic(){
    const next=K.relic(state.pendingRelic);$('overlay').innerHTML=panel('替换舍利','舍利已满 · 有舍有得','以何换取'+next.name+'？',`<p class="subtitle">将取得：${next.text}<br>选择一枚放下，其他舍利与生命不变。也可以返回重新选择补给。</p>${cards(state.relics)}<div class="actions">${btn('cancel-replace','返回选择')}</div>`);bindCards(id=>choose(state.pendingRelic,id));on('cancel-replace',()=>{state.pendingRelic=null;show('reward');save();});
  }
  function settle(){
    if(meta.history.some(x=>x.id===state.runId))return;
    const won=state.mode==='won';if(won)meta.wins++;meta.best=Math.max(meta.best,won?4:state.stage);
    meta.history.push({id:state.runId,seed:state.seed,won,stage:state.stage,seconds:Math.floor(state.elapsed),damage:state.damageTaken,relics:state.relics.slice()});meta.history=meta.history.slice(-8);save();
  }
  function ending(){
    settle();const won=state.mode==='won',seconds=Math.floor(state.elapsed),time=Math.floor(seconds/60)+'分'+seconds%60+'秒';
    $('overlay').innerHTML=panel(won?'胜利结算':'失败结算',won?'黑莲已散 · 此心长明':'劫途未尽 · 再起一念',won?'三界重见微光':'此身暂歇，棍心未折',`<p class="subtitle">${won?'无天的莲影终于落地。三境的灯火，正一盏一盏重新亮起。':'最后受伤：'+esc(state.lastDamage)+'。<br>记住刀光和落点，再次入劫时可以换一枚舍利。'}</p><div class="results"><div><small>此行</small><b>${time}</b></div><div><small>破阵</small><b>${state.broken} / 6</b></div><div><small>退敌</small><b>${state.kills}</b></div><div><small>承伤</small><b>${state.damageTaken}</b></div></div><p class="subtitle">因缘 ${esc(state.seed)}<br>此行舍利：${state.relics.map(id=>K.relic(id).name).join(' / ')}<br>跃起 ${state.stats.jumps} 次 · 分身 ${state.stats.clones} 次 · 消耗定力 ${state.stats.focusSpent}</p><div class="actions">${won?btn('epilogue','走出黑莲',true):btn('retry','同缘再行',true)}${won?btn('retry','同缘再行'):btn('new-path','另启因缘')}${btn('export','导出此行')}</div>`);
    on('retry',()=>{K.pendingSeed=state.seed;show('start');});on('new-path',()=>show('menu'));on('export',exportSave);on('epilogue',()=>show('epilogue'));
  }
  function epilogue(){
    $('overlay').innerHTML=panel('尾声','尾声 · 灯火人间','前路，还有众生',`<p class="story-copy">山道上的雾散了。渡口的灯，终于照见对岸的人。<br><br>你没有把胜利留在莲台之上。你收起金箍棒，走回那些还需要你的地方。<br>这一次的解法来自云、影与棍。下一次，也许不同。</p><p class="notice">此段为游戏原创收束，不冒充原剧台词或结局复刻。</p><div class="actions">${btn('again','再入因缘',true)}${btn('back-result','查看此行')}${btn('main-menu','回到主菜单')}</div>`);
    on('again',()=>{K.pendingSeed='LOTUS-'+crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0,6);show('start');});on('back-result',()=>show('won'));on('main-menu',()=>show('menu'));
  }
  function history(){
    $('overlay').innerHTML=panel('往昔旅程','因缘簿 · 不加永久战力','你走过的路',`<div class="history-list">${meta.history.length?meta.history.slice().reverse().map(r=>`<div><b>${r.won?'破劫':'止步'+K.STAGES[r.stage].name}</b><span>${esc(r.seed)}</span><span>${Math.floor(r.seconds/60)}分${r.seconds%60}秒</span><small>${r.relics.map(id=>K.relic(id).name).join(' · ')}</small></div>`).join(''):'<p class="subtitle">尚无完整旅程。先握紧金箍棒，走进山道。</p>'}</div><div class="actions">${btn('back','返回',true)}</div>`);on('back',()=>show('menu'));
  }
  function legacyMenu(){
    $('overlay').innerHTML=panel('原版旅程','存档保护 · 旧路仍在','在原来的规则中继续',`<p class="story-copy">v1的地图与规则和新版不同。你的旧旅程不会被覆盖，也不会被悄悄搬到另一张地图。<br><br>${storage.legacy?'可先下载旧档，再在打开的原版里通过「初行指南 → 导入存档」继续。':'保留的原版可直接打开；如果你有旧JSON文件，请在原版的指南中导入。'}</p><div class="actions">${btn('open-legacy',storage.legacy?'备份旧档并打开原版':'打开原版',true)}${btn('back','返回新版')}</div>`);
    on('open-legacy',()=>{if(storage.legacy)K.download(JSON.stringify(storage.legacy),'劫后行-v1-旧旅程.json');const legacy=location.pathname.includes('/release/')?'legacy-v1.html':'release/legacy-v1.html';window.open(new URL(legacy,location.href).href,'_blank','noopener');toast('旧旅程备份已下载；请在原版中导入。',4);});on('back',()=>show('menu'));
  }
  function exportSave(){save();storage.export(state,meta);toast('已导出整段旅程，含动态敌招与舍利选择。');}
  function control(action){
    if(action==='pause'){if(screen==='playing'){state.mode='paused';save();show('paused');}else if(screen==='paused')resume();else if(screen==='help')show(backScreen);else if(screen==='replace'){state.pendingRelic=null;show('reward');}else if(['start','prologue','legacy','history'].includes(screen))show('menu');}
    if(action==='blur'&&screen==='playing'){state.mode='paused';save();show('paused');}
  }
  on('pause',()=>control('pause'));on('guide-top',()=>{if(screen==='playing'){state.mode='paused';save();}openHelp(state&&['playing','paused'].includes(screen)?'paused':'menu');});
  on('brand',e=>{e.preventDefault();if(screen==='playing'){state.mode='paused';save();}show('menu');});
  $('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;let raw='';try{raw=await file.text();const data=storage.import(raw);state=data.state;meta=data.meta;renderer.camera=K.clamp(state.player.x-300,0,state.room.width-960);save();show(state.mode==='reward'&&state.pendingRelic?'replace':state.mode);toast('旅程已恢复。',2);}catch(err){if(err.legacy){try{storage.legacy=JSON.parse(raw);show('legacy');}catch{toast('旧存档无法读取。');}}else toast('导入失败：'+err.message);}e.target.value='';};
  window.addEventListener('keydown',e=>{
    if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
    if(['start','reward','replace'].includes(screen)&&/^Digit[123]$/.test(e.code)){e.preventDefault();const i=Number(e.code.slice(-1))-1;audio.unlock();if(screen==='start')startRun(['cloud','echo','staff'][i]);else if(screen==='replace')choose(state.pendingRelic,state.relics[i]);else choose(state.reward[i]);}
    if(e.code==='Tab'&&screen!=='playing'){const nodes=[...$('overlay').querySelectorAll('button:not(:disabled),input:not([hidden])')];if(nodes.length){const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
  });
  window.addEventListener('beforeunload',save);
  K.pointerFace=x=>{if(!state)return 0;const r=world.getBoundingClientRect();return Math.sign((x-r.left)/r.width*960+renderer.camera-state.player.x-12);};
  function hud(){
    if(!state)return;const p=state.player;
    $('hp-number').textContent=Math.ceil(p.hp)+' / 100';$('hp-fill').style.width=p.hp+'%';$('focus-number').textContent=Math.floor(p.focus);$('focus-fill').style.width=p.focus+'%';$('chapter').textContent=state.stage<3?'第'+['一','二','三'][state.stage]+'境':'终局';$('stage-name').textContent=K.STAGES[state.stage].name;
    const left=state.room.seals.find(q=>q.hp>0);$('objective').textContent=state.stage<3?(left?'阵眼 '+(state.room.seals.filter(q=>q.hp===0).length+1)+' / 2 · 前方 '+Math.max(0,Math.ceil((left.x-p.x)/10))+'丈':'双阵已破 · 前往右侧山门'):'绕背破莲 · 金色收招全额受伤';
    $('run-seed').textContent=state.seed;$('relic-list').textContent=state.relics.map(id=>K.relic(id).name).join(' · ')+'  ['+state.relics.length+'/3]';$('dash-state').textContent=p.dashCD>0?'闪避恢复 '+p.dashCD.toFixed(1)+'s':'闪避就绪';$('boss-hud').hidden=state.stage!==3;
    const boss=state.room.enemies.find(e=>e.kind==='boss');if(boss){$('boss-fill').style.width=boss.hp/boss.maxHp*100+'%';$('boss-phase').textContent=boss.phase==='recover'?'破绽已现':boss.phase==='sweep-windup'?'横扫将至 · 跳':boss.phase==='orb-windup'?'莲焰将至 · 闪':boss.phase==='shift-windup'?'移形将至 · 让路':'黑莲护在正面';}
    const gate=state.stage<3&&Math.abs(p.x-state.room.exit)<85;const lamp=state.stage<3&&state.room.seals[0].hp===0&&!state.room.midClaimed&&Math.abs(p.x-state.room.seals[0].x)<85;
    $('context-hint').hidden=screen!=='playing'||(!gate&&!lamp&&state.roomTime>9);
    $('context-hint').textContent=lamp?'E 借灯整顿 · 可更换舍利或补给':gate?(left?'阵眼尚存，回身破阵':'E 穿过山门'):'A D 行走 · 空格跳 · J 棍击 · K 闪避 · L 分身';
    const progress=$('journey-fill');if(progress)progress.style.width=Math.min(100,p.x/state.room.exit*100)+'%';
    const labels=$('combat-labels');if(labels)labels.innerHTML=state.effects.filter(f=>f.text&&f.life>0).slice(-12).map(f=>`<span class="${f.kind==='hurt'?'hurt':''}" style="left:${(f.x-renderer.camera)/960*100}%;top:${(f.y-(.45-f.life)*45)/540*100}%">${esc(f.text)}</span>`).join('');
  }
  let previous=performance.now(),accumulator=0,lastHud=0;
  function frame(now){
    try{
      const elapsed=Math.min((now-previous)/1000,.1);if(screen==='playing'){metrics.frames.push(now-previous);if(metrics.frames.length>10000)metrics.frames.shift();}previous=now;accumulator+=elapsed;
      const willStep=screen==='playing'&&accumulator>=K.DT&&state.hitstop<=0;let actions=willStep?input.read():{},guard=0;
      if(screen==='playing')while(accumulator>=K.DT&&guard++<13){
        K.step(state,actions);actions={...actions,jumpPressed:false,attackPressed:false,dashPressed:false,clonePressed:false,interactPressed:false};
        for(const event of state.events){audio.event(event);if(event.type==='hurt')toast(event.source+' · -'+event.amount+'生命');if(event.type==='seal')toast('阵眼已破 · '+state.room.seals.filter(q=>q.hp===0).length+' / 2');if(event.type==='empty-focus')toast('定力不足；棍击命中可积攒。');if(event.type==='gate-locked')toast('本境还有黑莲阵眼。');if(event.type==='hint')toast(event.text,3.5);}
        accumulator-=K.DT;if(state.mode!=='playing'){show(state.mode);break;}
      }else accumulator=0;
      renderer.draw(state,screen,elapsed);const submitted=performance.now();if(willStep){for(const q of pendingInputs)metrics.inputs.push({code:q.code,ms:+(submitted-q.t).toFixed(3),eventMs:+(submitted-q.eventTime).toFixed(3)});pendingInputs=[];}if(metrics.inputs.length>1000)metrics.inputs.splice(0,metrics.inputs.length-1000);
      audio.tick(screen==='playing',state?.stage||0);if(now-lastHud>80){hud();lastHud=now;}if(now>toastUntil)$('toast').hidden=true;if(state&&screen==='playing'&&now-lastSave>3000)save();
    }catch(e){metrics.errors.push(String(e.stack||e));console.error(e);if(state){state.mode='paused';show('paused');}toast('运行异常，先导出旅程后重新打开。',5);}
    requestAnimationFrame(frame);
  }
  Object.defineProperty(window,'__KONG__',{value:Object.freeze({snapshot:()=>state?JSON.parse(JSON.stringify({screen,state,meta,camera:renderer.camera})):({screen,state:null,meta}),metrics:()=>JSON.parse(JSON.stringify(metrics)),version:K.VERSION})});
  if(storage.error)toast('自动存档读取失败；可通过手记导入备份。',4);show('menu');requestAnimationFrame(frame);
})(globalThis.Kong ||= {});
