(function(K){
  'use strict';
  const el=(...a)=>K.UI.el(...a),div=(className,...children)=>el('div',{class:className},children);
  const button=(id,label,primary=false)=>el('button',{id,class:'settlement-button'+(primary?' primary':''),'aria-label':label},label,primary?el('span',{'aria-hidden':'true'},'→'):null);
  const number=(value,max)=>Math.max(0,Math.min(max,value));
  K.Settlement={view(s,meta){
    const won=s.mode==='won',rating=K.rating(s),hero=K.heroDef(s),seconds=Math.floor(s.elapsed),time=Math.floor(seconds/60)+'分'+String(seconds%60).padStart(2,'0')+'秒';
    const portrait=K.DialogPortraits?.[s.hero],background=K.ImageArt.images.settlementBackdrop;
    const unlock=K.canChallenge(meta)?'挑战已开启 · 再赴五界重劫':won?'此行已入因缘簿 · 普通 S 评可开启挑战':'收好这一程，下一战再起。';
    const stat=(label,value,points,max)=>div('settlement-stat',el('dt',{},label),el('dd',{},value),div('settlement-stat-foot',el('span',{},'得分 '+points+' / '+max),el('i',{'aria-hidden':'true',style:{'--score-fill':number(points,max)/max*100+'%'}})));
    const relics=s.relics.map(id=>{const r=K.reward(id,s);return el('span',{class:'settlement-relic'},el('i',{'aria-hidden':'true',style:{'background-image':'var(--icon-'+(r.icon||id)+')'}}),r.name);});
    const detail=el('details',{class:'settlement-details'},el('summary',{},'此行详情',el('span',{'aria-hidden':'true'},'＋')),div('settlement-detail-body',el('h3',{},'此行，留一笔'),
      el('p',{class:'settlement-seed'},hero.name+' · '+K.difficultyName(s)+' · 因缘 '+s.seed),
      el('dl',{class:'settlement-detail-stats'},[['已通关',s.campaign.completed.length+' / 15'],['守关者',s.stats.guardians+' / 15'],['全部退敌',s.kills],['累计承伤',s.damageTaken],['跃起',s.stats.jumps+' 次'],['闪避',s.stats.dashes+' 次'],[hero.skill,s.stats.ultimates+' 次'],['符术',s.stats.talismans+' 次']].map(([label,value])=>div('',el('dt',{},label),el('dd',{},String(value))))),
      el('h4',{},'此行法门'),el('p',{},Object.entries(s.growth).map(([id,n])=>K.reward(id,s).name+(n>1?' · '+n+'重':'')).join(' / ')||'尚未参悟法门'),
      el('h4',{},'秘技'),el('p',{},s.celestial.owned.map(id=>K.artDef(id).name).join(' / ')||'尚未参悟秘技'),
      el('p',{class:'settlement-rules'},'S ≥ 90 · A ≥ 75 · B ≥ 55 · 其余 C。评级由用时、受伤次数与计分击杀组成。未通关时仅显示当前估分。')));
    return el('section',{class:'settlement-screen '+(won?'is-victory':'is-defeat'),role:'dialog','aria-modal':'true','aria-label':won?'胜利结算':'失败结算','aria-labelledby':'dialog-title',style:{...(background?{'--settlement-bg':'url("'+background.src+'")'}:{}),...(portrait?{'--settlement-portrait':portrait}:{})}},
      div('settlement-art',el('div',{class:'settlement-figure','aria-hidden':'true'}),div('settlement-hero-name',el('span',{},won?'应劫者 · 功成':'应劫者 · 再起'),el('strong',{},hero.name))),
      el('main',{class:'settlement-main'},
        div('settlement-kicker',el('span',{class:'settlement-seal','aria-hidden':'true'},won?'破劫':'再起'),el('span',{},won?'终章 · 五界归途':'行旅 · 余火未熄'),el('b',{class:'settlement-mode'},K.difficultyName(s))),
        el('h2',{id:'dialog-title'},won?'五界已通':'此心，未折'),
        el('p',{class:'settlement-copy'},won?'天王收塔，归路重开。此行，功成。':'止步'+K.levelInfo(s.stage).name+'，重整一念，再踏劫途。'),
        el('ol',{class:'settlement-realms','aria-label':'五界进度'},K.CAMPAIGN.map((chapter,i)=>{const count=s.campaign.completed.filter(stage=>Math.floor(stage/3)===i).length;return el('li',{class:count===3?'complete':i===Math.floor(s.stage/3)?'current':''},el('i',{'aria-hidden':'true'},count===3?'✓':String(i+1).padStart(2,'0')),el('span',{},chapter.name),el('small',{},count+' / 3'));})),
        div('settlement-rating',div('settlement-grade',el('span',{class:'rating-grade'},rating.grade),el('small',{},won?'通关评级':'当前估分')),div('settlement-score',el('span',{},won?'此行战绩':'劫途未尽'),el('strong',{},String(rating.score),el('small',{},' / 100')),el('p',{},won?unlock:'最后受伤 · '+s.lastDamage))),
        el('dl',{class:'settlement-stats'},stat('行旅用时',time,rating.time,35),stat('受伤次数',rating.hits+' 次',rating.care,40),stat('计分击杀',rating.killed+' / '+rating.total,rating.kills,25)),
        div('settlement-loadout',el('span',{class:'settlement-loadout-label'},'此行携带'),relics)),
      el('footer',{class:'settlement-footer'},div('settlement-actions',won?button('epilogue','走出黑莲',true):button('retry','同缘再行',true),won?button('retry','同缘再行'):button('new-path','另启因缘'),detail,button('export','导出此行')),
        div('settlement-controls',el('span',{},el('kbd',{},'←'),el('kbd',{},'→'),' 移步'),el('span',{},el('kbd',{},'J'),' / ',el('kbd',{},'Enter'),' 确认'),el('span',{},el('kbd',{},'Esc'),' 返回'))));
  }};
})(globalThis.Kong ||= {});
