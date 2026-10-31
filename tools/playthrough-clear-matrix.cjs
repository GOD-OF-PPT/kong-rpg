// Continuous browser journey: only real menus, keyboard/mouse, read-only snapshots.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{chromium}=require('playwright');
const K=require('./combat-identity-runtime.cjs')(),hero=process.env.HERO||'nezha',difficulty=process.env.DIFFICULTY||'normal',seed=process.env.SEED||'LOTUS-1025',attempt=process.env.ATTEMPT||'1';
const base=path.resolve('evidence/clear-matrix-20261031'),out=path.resolve(process.env.MATRIX_OUT||path.join(base,hero+'-'+difficulty+'-attempt'+attempt));fs.mkdirSync(out,{recursive:true});
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),policy=require('./journey-controller-20261031.cjs')(K),heroName={wukong:'孙悟空',nezha:'哪吒',erlang:'杨戬'}[hero];
const report={hero,difficulty,seed,attempt,version:K.VERSION,method:'Fresh browser context; new run from stage zero through real menus. Keyboard/mouse only. Playwright clock.runFor fires all RAF and timers, preserving production fixed simulation steps; no HP/damage/position/level writes, no jump-ahead imports. Read-only snapshot-assisted QA input policy, not a human difficulty assessment.',entry:{file:'dist/index.html',sha256:sha('dist/index.html')},manifestSHA256:sha('dist/manifest.json'),controllerSHA256:sha('tools/journey-controller-20261031.cjs'),stages:[],frames:[],events:[],rewards:[],inputs:[],errors:[],checks:[]};
fs.copyFileSync('tools/journey-controller-20261031.cjs',path.join(out,'controller.cjs'));
(async()=>{let server,browser,p;const held=new Set(),seen=new Set(),bossPhotos=new Set();
 try{
  server=await(await import('vite')).preview({preview:{host:'127.0.0.1',port:0,strictPort:true}});browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();p=await browser.newPage({viewport:{width:1366,height:850}});p.setDefaultTimeout(15000);p.on('pageerror',e=>report.errors.push(e.message));
  await p.clock.install();const url='http://127.0.0.1:'+server.httpServer.address().port+'/';await p.goto(url);await p.evaluate(()=>Promise.all([Kong.ImageArt.ready,Kong.DialogArtReady,Kong.Brand.ready]));
  const response=await p.request.get(url);if(crypto.createHash('sha256').update(await response.body()).digest('hex')!==report.entry.sha256)throw Error('Preview identity mismatch');
  const snap=()=>p.evaluate(()=>__KONG__.snapshot()),wait=ms=>p.clock.runFor(ms);
  async function capture(id,label){const file=id+'.png';await p.screenshot({path:path.join(out,file),animations:'disabled'});const q=await snap(),s=q.state;report.frames.push({file,label,screen:q.screen,hero:s?.hero,difficulty:s?.difficulty,stage:s?.stage,hp:s?.player.hp,time:s?.elapsed,boss:s?.room.enemies.filter(e=>e.chiefId).map(e=>({id:e.chiefId,hp:e.hp,maxHp:e.maxHp,phase:e.phase}))});}
  async function release(){for(const key of held)await p.keyboard.up(key);held.clear();}
  report.initialChallengeLocked=await p.locator('#mode-challenge').isDisabled();
  if(difficulty==='challenge'){
   const qualification=path.resolve(process.env.NORMAL_QUALIFICATION||'evidence/mechanics-recheck-v12/nezha-http/completed-save.json');report.qualification={file:qualification,sha256:sha(qualification),scope:'Existing earned normal S receipt unlocks menu only; this challenge starts a new stage-zero journey.'};
   await p.locator('#import-file').setInputFiles(qualification);await p.waitForFunction(()=>__KONG__.snapshot().screen==='won');await p.locator('#to-epilogue').count().then(async n=>{if(n)await p.locator('#to-epilogue').click();else await p.getByRole('button',{name:'走出黑莲',exact:true}).click();});await p.getByRole('button',{name:'回到主菜单',exact:true}).click();
   if(await p.locator('#mode-challenge').isDisabled())throw Error('S qualification did not unlock challenge');await p.locator('#mode-challenge').click();
  }
  await p.locator('#seed').fill(seed);await p.locator('#begin').click();if(await p.locator('#begin-relic').isVisible())await p.locator('#begin-relic').click();await capture('hero-choice','选择'+heroName+' · '+K.difficultyName(difficulty));await p.locator('#choose-'+hero).click();await p.locator('[data-relic="cloud"]').click();await p.waitForFunction(()=>__KONG__.snapshot().screen==='playing');await p.clock.pauseAt(await p.evaluate(()=>Date.now()+100));await wait(100);
  const initial=await snap();if(initial.state.stage!==0||initial.state.hero!==hero||initial.state.difficulty!==difficulty)throw Error('Wrong initial journey');report.initial={hero:initial.state.hero,difficulty:initial.state.difficulty,stage:0,runId:initial.state.runId};
  let lastStage=-1,iterations=0,lastProgress='',progressAt=0;const started=Date.now();
  while(Date.now()-started<2400000){
   const q=await snap(),s=q.state;if(!s)throw Error('Missing state');
   for(const e of s.log){const key=JSON.stringify(e);if(!seen.has(key)){seen.add(key);if(['room','hurt','guardian-enter','guardian-defeat','enemy-commit','victory','art-learn','art-start','jump','dash','anchor-break'].includes(e.type))report.events.push({stage:s.stage,...e});}}
   if(q.screen==='won'||q.screen==='dead'){
    await release();await wait(160);report.final=await snap();report.rating=await p.locator('.rating-grade').innerText();await capture(q.screen==='won'?'victory':'death',q.screen==='won'?'十五关胜利结算':'失败结算');
    const download=p.waitForEvent('download');await p.getByRole('button',{name:'导出此行',exact:true}).click({force:true});await(await download).saveAs(path.join(out,'final-save.json'));
    report.pass=q.screen==='won'&&s.stage===14&&s.campaign.completed.join(',')===Array.from({length:15},(_,i)=>i).join(',')&&s.stats.guardians===15&&report.stages.length===15;
    report.checks.push({name:'15 levels and all 15 guardians completed through continuous browser inputs',pass:report.pass});break;
   }
   if(q.screen==='art-choice'){await release();await p.getByRole('button',{name:'参悟并装备',exact:true}).click({force:true});await wait(100);continue;}
   if(q.screen==='replace'){await release();const old=s.relics.find(id=>id!=='cloud')||s.relics[0];await p.locator('[data-relic="'+old+'"]').click({force:true});await wait(100);continue;}
   if(q.screen==='reward'){await release();const id=policy.reward(s);report.rewards.push({stage:s.stage,kind:s.rewardKind,options:s.reward,id});await p.locator('[data-relic="'+id+'"]').click({force:true});await wait(100);continue;}
   if(q.screen==='paused'){await release();await p.locator('#continue').click({force:true});await wait(100);continue;}
   if(q.screen!=='playing')throw Error('Unexpected screen '+q.screen);
   if(s.stage!==lastStage){lastStage=s.stage;report.stages.push({stage:s.stage,time:s.elapsed,hp:s.player.hp});await capture('stage-'+String(s.stage+1).padStart(2,'0'),K.levelInfo(s.stage).name);console.log(hero+' '+difficulty+' stage '+(s.stage+1)+' HP '+Math.round(s.player.hp));}
   const boss=s.room.enemies.find(e=>e.chiefId);if(s.stage%3===2&&boss.hp>0&&!boss.dormant&&!bossPhotos.has(s.stage)){bossPhotos.add(s.stage);await capture('boss-'+(s.stage+1),K.GUARDIANS[s.stage].name+' · 战斗');}
   const d=policy.next(s),want=new Set(d.keys);for(const key of [...held])if(!want.has(key)){await p.keyboard.up(key);held.delete(key);}
   for(const key of want)if(!held.has(key)){
    if(key==='KeyH'&&d.aim){const r=await p.locator('#world').boundingBox();await p.mouse.click(r.x+Math.max(2,Math.min(958,d.aim.x-q.camera))/960*r.width,r.y+Math.max(2,Math.min(538,d.aim.y))/540*r.height,{button:'right'});}
    else{await p.keyboard.down(key);held.add(key);}report.inputs.push({time:s.elapsed,key,target:d.target,reason:d.reason});
   }
   await wait(50);iterations++;
   const progress=[s.stage,Math.round(s.player.x/10),s.player.hp,s.room.enemies.reduce((n,e)=>n+e.hp,0)].join(':');if(progress!==lastProgress){lastProgress=progress;progressAt=s.elapsed;}if(s.elapsed-progressAt>120)throw Error('Controller stalled at '+s.stage+' '+s.player.x);if(s.elapsed>1800)throw Error('Thirty-minute game-time limit');
   if(iterations%100===0){fs.writeFileSync(path.join(out,'progress.json'),JSON.stringify({hero,difficulty,stages:report.stages,at:{stage:s.stage,time:s.elapsed,hp:s.player.hp,decision:d,bossHp:boss.hp},errors:report.errors}));}
  }
  report.metrics=await p.evaluate(()=>__KONG__.metrics());if(report.errors.length||report.metrics.errors.length)report.pass=false;
 }catch(e){report.failure=e.stack;if(p){report.final=await p.evaluate(()=>__KONG__.snapshot()).catch(()=>null);await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}report.pass=false;}
 finally{for(const key of held)await p?.keyboard.up(key).catch(()=>{});await browser?.close();await server?.close();fs.writeFileSync(path.join(out,'playthrough.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({hero,difficulty,pass:report.pass,stages:report.stages.length,rating:report.rating,final:report.final?.screen,stage:report.final?.state?.stage,hp:report.final?.state?.player.hp,failure:report.failure}));}
})();
