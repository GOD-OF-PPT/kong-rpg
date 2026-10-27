// Complete journey controller: reads public snapshots, sends real input only.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),kind=process.argv[2]||'http',difficulty=process.env.DIFFICULTY||'normal',entry=path.resolve(process.env.GAME_ENTRY||'release/index.html'),out=path.join(root,'evidence/campaign-v10',process.env.RUN_NAME||difficulty+'-full-'+kind);fs.mkdirSync(out,{recursive:true});
const report={version:'10.0.0',kind,difficulty,sha256:crypto.createHash('sha256').update(fs.readFileSync(entry)).digest('hex'),method:'fresh normal journey; challenge qualification imported from the completed ordinary S journey export, then all 15 stages played from start. No combat-state mutation or jump-ahead fixtures in the journey.',checks:[],stages:[],rewards:[],samples:[],inputs:[],errors:[],network:[]};
const check=(name,yes,data)=>{report.checks.push({name,pass:!!yes,data});assert.ok(yes,name);};
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true}),ctx=await b.newContext({viewport:{width:1440,height:1000}});if(kind==='file'){await ctx.setOffline(true);await ctx.route(/^https?:/,r=>r.abort());}report.environment={browser:b.version(),os:require('os').release(),viewport:'1440x1000'};
 const p=await ctx.newPage(),snap=()=>p.evaluate(()=>__KONG__.snapshot()),wait=ms=>p.waitForTimeout(ms);p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))report.network.push(r.url());});let rec;
 const held=new Set();async function keys(next){for(const k of [...held])if(!next.has(k)){await p.keyboard.up(k);held.delete(k);}for(const k of next)if(!held.has(k)){await p.keyboard.down(k);held.add(k);report.inputs.push({wall:Date.now(),code:k});}}
 try{
  await p.goto(kind==='file'?'file:///'+entry.replace(/\\/g,'/'):'http://127.0.0.1:5188/?v=10.0.0');await p.evaluate(()=>Promise.all([Kong.ImageArt.ready,Kong.DialogArtReady]));
  check('challenge is initially locked',await p.locator('#mode-challenge').isDisabled());
  if(difficulty==='challenge'){
   await p.locator('#import-file').setInputFiles(path.resolve(process.env.NORMAL_QUALIFICATION||path.join(root,'evidence/campaign-v10/normal-full-http/completed-save.json')));await p.waitForFunction(()=>__KONG__.snapshot().screen==='won');await p.getByRole('button',{name:'走出黑莲',exact:true}).click();await p.getByRole('button',{name:'回到主菜单',exact:true}).click();check('qualification passes through real score/import gate',await p.locator('#mode-challenge').isEnabled());await p.locator('#mode-challenge').click();
  }
  await p.locator('#begin').click();if(await p.getByRole('button',{name:'选择应劫者',exact:true}).isVisible())await p.getByRole('button',{name:'选择应劫者',exact:true}).click();await p.getByRole('button',{name:'选择哪吒',exact:true}).click();await p.keyboard.press('Digit1');await p.waitForFunction(()=>__KONG__.snapshot().screen==='playing');check('journey begins at stage zero with selected difficulty',(await snap()).state.stage===0&&(await snap()).state.difficulty===difficulty);
  rec=await require('./record-canvas.cjs')(p,path.join(out,'journey.webm'));const start=Date.now();let lastStage=-1,lastC=-10,lastR=-10,lastL=-10,lastH=-10,lastK=-10,lastW=-10,lastF=-10,lastDrop=-10,jumpUntil=0,iterations=0,progressAt=Date.now(),progressKey='',target;
  while(Date.now()-start<1200000){const {screen,state:s,camera}=await snap();
   if(screen==='dead'){report.failureState=s;await p.screenshot({path:path.join(out,'death.png')});throw Error('Died stage '+s.stage+': '+s.lastDamage);}
   if(screen==='won'){await keys(new Set());report.final={stage:s.stage,completed:s.campaign.completed,grade:await p.locator('.rating-grade').innerText(),meta:(await snap()).meta,hits:s.campaign.hits,seconds:s.elapsed,killed:s.campaign.killed.length,hp:s.player.hp,stats:s.stats};await p.screenshot({path:path.join(out,'victory.png')});const wonDownload=p.waitForEvent('download');await p.getByRole('button',{name:'导出此行',exact:true}).click();await(await wonDownload).saveAs(path.join(out,'completed-save.json'));await p.getByRole('button',{name:'走出黑莲',exact:true}).click();check('ending reached', (await snap()).screen==='epilogue');break;}
   if(screen==='art-choice'){await keys(new Set());await p.getByRole('button',{name:'参悟并装备',exact:true}).click();continue;}
   if(screen==='replace'){await keys(new Set());const old=s.relics.find(id=>id!=='cloud')||s.relics[0];await p.locator('[data-relic="'+old+'"]').click();continue;}
   if(screen==='reward'){await keys(new Set());const priority=['staff','vitality','ultimate-echo','six-arms','staff-wave','dash-strike','mirror','mercy','ward','thunder','echo','flame'];const id=s.player.hp<(100+20*(s.growth.vitality||0))*.8?'rest':priority.find(id=>s.reward.includes(id))||'rest';report.rewards.push({stage:s.stage,options:s.reward,chosen:id});await p.locator('[data-relic="'+id+'"]').click();await wait(80);continue;}
   if(screen==='paused'){await keys(new Set());await p.getByRole('button',{name:'继续前行',exact:true}).click();continue;}if(screen!=='playing')throw Error('Unexpected '+screen);
   if(lastStage!==s.stage){lastStage=s.stage;report.stages.push(lastStage);console.log(difficulty+' '+kind+' entered '+lastStage+' HP '+Math.round(s.player.hp));await p.screenshot({path:path.join(out,'stage-'+lastStage+'.png')});}
   const q=s.player,t=s.time,want=new Set(['KeyJ']),chief=s.room.enemies.find(e=>e.chiefId),foes=s.room.enemies.filter(e=>e.hp>0&&!e.dormant&&!e.chiefId).sort((a,b)=>a.origin-b.origin),foe=foes[0]||(chief.hp>0&&!chief.dormant?chief:null),manual=!s.celestial.equipped&&q.x<380;
   if(manual){target=220;if(Math.abs(q.x-target)<35&&t-lastF>.45){want.add('KeyF');lastF=t;}}
   else if(foe){target=foe.kind==='shield'?(foe.face<0?foe.x+foe.w+35:foe.x-45):q.x<foe.x?foe.x-53:foe.x+foe.w+30;}
   else target=chief.hp>0?s.room.arena.enter+35:s.room.exit-30;
   const camp=s.room.camp;if(camp&&!camp.used&&q.hp<95&&Math.abs(q.x-camp.x)<70&&Math.abs(q.y-camp.y)<60&&t-lastF>.8){want.add('KeyF');lastF=t;}
   if(chief.hp<=0&&Math.abs(q.x-s.room.exit)<65&&t-lastF>.4){want.add('KeyF');lastF=t;}
   const direction=target>=q.x?1:-1,ground=s.room.platforms.filter(p=>p.solid),gap=ground.some(g=>direction>0?g.x+g.w<s.room.width-1&&g.x+g.w-q.x>0&&g.x+g.w-q.x<90:q.x-g.x>0&&q.x-g.x<90&&g.x>0),hazard=s.room.hazards.some(h=>Math.abs(h.x-q.x)<110&&q.y+q.h>410);
   const warnings=s.room.enemies.filter(e=>e.hp>0&&!e.dormant&&e.phase==='campaign-windup'&&e.timer<.4).flatMap(e=>e.marks),active=s.dangers,boxes=[...warnings,...active];
   const vertical=boxes.filter(b=>b.h>55),low=boxes.filter(b=>b.h<=55),touch=b=>q.x+q.w>b.x-5&&q.x<b.x+b.w+5&&q.y+q.h>b.y&&q.y<b.y+b.h;
   if(vertical.some(touch)){
    const min=chief.hp>0&&!chief.dormant?s.room.arena.min:8,max=chief.hp>0&&!chief.dormant?s.room.arena.max:s.room.width-32;
    const safe=[q.x-90,q.x+90,q.x-160,q.x+160,q.x-240,q.x+240].filter(x=>x>=min&&x<=max&&vertical.every(b=>x+q.w<b.x-10||x>b.x+b.w+10)).sort((a,b)=>Math.abs(a-q.x)-Math.abs(b-q.x));if(safe.length)target=safe[0];want.delete('KeyJ');
   }
   if(q.grounded&&t-lastW>.48&&(gap||hazard||low.some(touch))){jumpUntil=t+.52;lastW=t;await p.keyboard.up('KeyW');held.delete('KeyW');}
   if(t<jumpUntil)want.add('KeyW');
   const overGap=!ground.some(g=>q.x+q.w>g.x&&q.x<g.x+g.w);if(overGap&&q.vy>100&&q.y>330&&q.airJumps===0&&t-lastW>.3){await p.keyboard.up('KeyW');held.delete('KeyW');want.add('KeyW');jumpUntil=t+.32;lastW=t;}
   if(q.grounded&&q.y<340&&(!foe||foe.y>q.y+60)&&t-lastDrop>.7){want.add('KeyS');want.add('KeyW');lastDrop=t;}
   if(q.x<target-8)want.add('KeyD');else if(q.x>target+8)want.add('KeyA');
   if(foe&&Math.abs(foe.x-q.x)<550){const r=await p.locator('#world').boundingBox(),ax=foe.x+foe.w/2,ay=foe.y+foe.h*.4;await p.mouse.move(r.x+Math.min(r.width-5,Math.max(5,(ax-camera)/960*r.width)),r.y+ay/540*r.height);
    if(!s.ring&&q.secondaryCD<=0&&q.focus>=12&&t-lastH>.7){await p.mouse.click(r.x+Math.min(r.width-5,Math.max(5,(ax-camera)/960*r.width)),r.y+ay/540*r.height,{button:'right'});lastH=t;}
    if(Math.abs(foe.x-q.x)<160&&q.focus>=40&&t-lastL>3&&!s.silk){want.add('KeyL');lastL=t;}
    if(s.celestial.equipped&&!s.celestial.cast&&s.celestial.cooldown<=0&&q.focus>=40&&Math.abs(foe.x-q.x)<240&&t-lastC>1){want.add('KeyC');lastC=t;}
    if(q.rage>=100&&q.y>340&&Math.abs(foe.x-q.x)<200&&t-lastR>1){want.add('KeyR');lastR=t;}
    if(foe.kind==='shield'&&Math.abs(foe.x-q.x)<100&&q.dashCD<=0&&t-lastK>1&&foe.phase!=='recover'){want.add('KeyK');lastK=t;}
   }
   const incoming=s.projectiles.filter(b=>!b.friendly&&Math.abs(b.x-q.x)<100&&b.y+b.h>q.y&&b.y<q.y+q.h);if(incoming.length&&q.dashCD<=0&&t-lastK>1){want.add('KeyK');lastK=t;}
   if(want.has('KeyF')&&held.has('KeyF')){await p.keyboard.up('KeyF');held.delete('KeyF');}await keys(want);await wait(60);
   const progress=[s.stage,Math.round(q.x/15),q.hp,s.kills].join(':');if(progress!==progressKey){progressKey=progress;progressAt=Date.now();}if(Date.now()-progressAt>18000){report.stalled={s,target,want:[...want]};throw Error('Stalled '+s.stage+' '+Math.round(q.x));}
   if(iterations++%20===0){report.samples.push({stage:s.stage,time:t,x:q.x,y:q.y,hp:q.hp,hits:s.campaign.hits,kills:s.kills,chiefHp:chief.hp});fs.writeFileSync(path.join(out,'progress.json'),JSON.stringify(report));}
  }
  await keys(new Set());check('all fifteen levels completed by input',report.final?.completed.length===15);check('all stages seen',report.stages.join(',')===Array.from({length:15},(_,i)=>i).join(','));check('all fifteen independent chiefs defeated',report.final.stats.guardians===15);check('no runtime exceptions',!report.errors.length);if(kind==='file')check('complete disconnected journey has zero HTTP requests',!report.network.length);report.metrics=await p.evaluate(()=>__KONG__.metrics());
 }catch(e){report.failure=e.stack;await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}finally{if(rec)report.recording=await rec.stop();await ctx.close();await b.close();fs.writeFileSync(path.join(out,'playthrough.json'),JSON.stringify(report));console.log(JSON.stringify({kind,difficulty,stages:report.stages,final:report.final,failure:report.failure}));}
})().catch(e=>{console.error(e);process.exitCode=1;});
