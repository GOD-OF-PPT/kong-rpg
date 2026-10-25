const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'evidence/readability');const report={version:JSON.parse(fs.readFileSync(path.join(root,'release/manifest.json'),'utf8')).version,sha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'release/index.html'))).digest('hex'),browser:null,checks:[],runs:[]};
function check(name,pass,details){report.checks.push({name,pass,...details});if(!pass)throw new Error(name);}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function runGame(browser,kind){
  const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:path.join(out,'video'),size:{width:960,height:680}}});
  const p=await context.newPage(),errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  if(kind==='file'){await context.setOffline(true);await context.route(/^https?:/,r=>r.abort());}
  await context.tracing.start({screenshots:false,snapshots:false});
  const url=kind==='file'?'file:///'+path.join(root,'release/index.html').replace(/\\/g,'/'):'http://127.0.0.1:5188/release/index.html';await p.goto(url);
  await p.getByRole('button',{name:'踏上劫途'}).click();await p.keyboard.press('Digit3');await p.waitForTimeout(300);
  check(kind+' starts through UI',(await p.evaluate(()=>__KONG__.snapshot().screen))==='playing');
  const snap=()=>p.evaluate(()=>__KONG__.snapshot());
  // Pause + real export/import UI before the uninterrupted traversal.
  await p.keyboard.press('Escape');const frozen=(await snap()).state.time;await p.keyboard.down('KeyD');await p.waitForTimeout(200);await p.keyboard.up('KeyD');check(kind+' pause freezes world',(await snap()).state.time===frozen);
  const downloadPromise=p.waitForEvent('download');await p.getByRole('button',{name:'导出存档',exact:true}).click();const download=await downloadPromise;const savePath=path.join(out,kind+'-portable-save.json');await download.saveAs(savePath);
  await p.locator('#import-file').setInputFiles(savePath);await p.waitForTimeout(200);check(kind+' portable save imports paused',(await snap()).screen==='paused');
  await p.getByRole('button',{name:'继续前行',exact:true}).click();
  const held=new Set();async function keys(want){for(const key of [...held])if(!want.has(key)){await p.keyboard.up(key);held.delete(key);}for(const key of want)if(!held.has(key)){await p.keyboard.down(key);held.add(key);}}
  const record={kind,url,stages:[],rewards:[],samples:[]};let lastStage=-1,lastJump=-10,jumpUntil=0,lastDash=-10,lastClone=-10,start=Date.now();let guard=0;
  while(Date.now()-start<150000){
    const {state:s,screen}=await snap();if(screen==='dead'){record.death={source:s.lastDamage,hp:s.player.hp,x:s.player.x,stage:s.stage};fs.writeFileSync(path.join(out,kind+'-failed-state.json'),JSON.stringify(s,null,2));await p.screenshot({path:path.join(out,kind+'-death.png')});throw new Error(kind+' controller died: '+JSON.stringify(record.death));}
    if(screen==='won'){await keys(new Set());await p.screenshot({path:path.join(out,kind+'-victory.png')});record.final={time:s.time,hp:s.player.hp,kills:s.kills,relics:s.relics,broken:s.broken};break;}
    if(screen==='reward'){await keys(new Set());await p.screenshot({path:path.join(out,kind+'-reward-'+s.stage+'.png')});record.rewards.push([...s.reward]);const pref=['mercy','cloud','flame','mirror','echo'];const id=pref.find(q=>s.reward.includes(q))||s.reward[0];await p.locator('[data-relic="'+id+'"]').click();await delay(150);continue;}
    if(screen!=='playing')throw new Error('Unexpected screen '+screen);
    if(s.stage!==lastStage){lastStage=s.stage;record.stages.push(s.stage);console.log(kind+' reached stage '+s.stage);await p.screenshot({path:path.join(out,kind+'-stage-'+s.stage+'.png')});}
    const q=s.player, want=new Set(['KeyJ']);const now=s.time;let target,pulseJump=false;
    if(s.stage<3){const seal=s.room.seals.find(q=>q.hp>0);target=seal?seal.x-48:s.room.exit;
      if(q.x<target-7)want.add('KeyD');else if(q.x>target+7)want.add('KeyA');
      const gap=s.room.platforms.filter(q=>q.solid).some(g=>q.x>g.x+g.w-52&&q.x<g.x+g.w&&g.x+g.w<s.room.width-20);
      const hazard=s.room.hazards.some(h=>h.x>q.x&&h.x-q.x<110);
      const enemy=s.room.enemies.some(e=>e.hp>0&&e.kind!=='caster'&&Math.abs(e.x-q.x)<85);
      const upperSeal=seal&&seal.y<380&&Math.abs(target-q.x)<65&&q.y+q.h>seal.y+seal.h+5;
      if(q.grounded&&now-lastJump>.38&&(gap||hazard||upperSeal||(enemy&&Math.abs(target-q.x)>120))){jumpUntil=now+.55;lastJump=now;pulseJump=true;}
      if(now<jumpUntil)want.add('Space');
      if(!seal&&Math.abs(q.x-s.room.exit)<65)want.add('KeyE');
      if(enemy&&q.dashCD===0&&now-lastDash>1.2&&!gap&&Math.abs(target-q.x)>150){want.add('KeyK');lastDash=now;}
      if(seal&&Math.abs(q.x-target)<90&&q.focus>=40&&!s.clone&&now-lastClone>3){want.add('KeyL');lastClone=now;}
    }else{
      const boss=s.room.enemies[0];target=boss.x-52;if(q.x<target-6)want.add('KeyD');else if(q.x>target+6)want.add('KeyA');
      if(boss.phase==='sweep-windup'&&boss.timer<.4&&q.grounded&&now-lastJump>.6){jumpUntil=now+.58;lastJump=now;pulseJump=true;}
      if(now<jumpUntil)want.add('Space');if(q.focus>=40&&!s.clone&&now-lastClone>2){want.add('KeyL');lastClone=now;}
      if(q.grounded&&q.y<350){want.add('KeyS');if(now-lastJump>.65){want.add('Space');lastJump=now;pulseJump=true;}}
    }
    // Keyboard melee follows facing. Correct facing after walking left to brake;
    // otherwise a controller can harmlessly swing away from the boss forever.
    if(!want.has('KeyA')&&!want.has('KeyD')&&q.face<0)want.add('KeyD');
    if(pulseJump&&held.has('Space')){await p.keyboard.up('Space');held.delete('Space');}await keys(want);if(guard++%12===0){record.samples.push({t:s.time,stage:s.stage,x:Math.round(q.x),y:Math.round(q.y),grounded:q.grounded,hp:q.hp,focus:Math.floor(q.focus),seals:s.room.seals.map(q=>q.hp),boss:s.stage===3?s.room.enemies[0].hp:null});fs.writeFileSync(path.join(out,kind+'-progress.json'),JSON.stringify(record,null,2));}await delay(65);
  }
  await keys(new Set());if(!record.final){await p.screenshot({path:path.join(out,kind+'-timeout.png')});record.last=await snap();}check(kind+' complete real-input run',!!record.final,{final:record.final});
  const m=await p.evaluate(()=>__KONG__.metrics());const pct=(a,n)=>{const x=[...a].sort((a,b)=>a-b);return x[Math.floor((x.length-1)*n)]||0;};record.performance={frames:m.frames.length,frameP50:pct(m.frames,.5),frameP95:pct(m.frames,.95),inputSamples:m.inputs.length,inputP95:pct(m.inputs.map(x=>x.ms),.95),inputMax:Math.max(0,...m.inputs.map(x=>x.ms)),definition:'browser event handler to render submission after simulation; excludes hardware and screen scanout'};record.errors=errors.concat(m.errors);record.networkRequests=requests;
  check(kind+' no runtime exceptions',record.errors.length===0);if(kind==='file')check('file zero HTTP(S) requests',requests.length===0);check(kind+' p95 frame time under 25ms',record.performance.frameP95<25);check(kind+' p95 event-to-submit under 50ms',record.performance.inputP95<50);
  fs.writeFileSync(path.join(out,kind+'-input-metrics.json'),JSON.stringify(m,null,2));const tracePath=path.join(out,kind+'-trace-'+Date.now()+'.zip');await context.tracing.stop({path:tracePath});record.trace=path.relative(root,tracePath).replace(/\\/g,'/');const video=p.video();await context.close();if(video)record.video=path.relative(root,await video.path()).replace(/\\/g,'/');report.runs.push(record);
}
(async()=>{if(process.env.REQUIRE_SERVER_OFF){await new Promise((resolve,reject)=>{const socket=require('node:net').createConnection({port:5188,host:'127.0.0.1'});socket.once('connect',()=>{socket.destroy();reject(new Error('Preview server is still running'));});socket.once('error',()=>resolve());});check('preview server stopped before file launch',true);}const browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();try{await runGame(browser,process.argv[2]||'file');}finally{await browser.close();fs.writeFileSync(path.join(out,'browser-'+(process.argv[2]||'file')+'.json'),JSON.stringify(report,null,2));}console.log(JSON.stringify({checks:report.checks,runs:report.runs.map(r=>({kind:r.kind,final:r.final,performance:r.performance,errors:r.errors,networkRequests:r.networkRequests}))},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
