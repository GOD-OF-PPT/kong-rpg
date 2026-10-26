const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,process.env.EVIDENCE_DIR||'evidence/ranged-v6'),kind=process.argv[2]||'file',jumpKey=process.env.JUMP_KEY||'KeyW';
const os=require('os');
const report={environment:{os:os.platform()+' '+os.release(),cpu:os.cpus()[0].model,node:process.version,viewport:'1440x1000',mode:'headless Edge real-time requestAnimationFrame; event-to-render-submission, not display photon latency'},version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'release/index.html'))).digest('hex'),kind,jumpKey,hero:process.env.HERO||'nezha',buildPreference:process.env.BUILD||'martial',checks:[],samples:[],rewards:[],stages:[],worldEvents:[],errors:[],network:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));function check(name,pass,data={}){report.checks.push({name,pass:!!pass,...data});assert.ok(pass,name);}
(async()=>{
  if(process.env.REQUIRE_SERVER_OFF){await new Promise((resolve,reject)=>{const c=require('net').createConnection({host:'127.0.0.1',port:5188});c.once('connect',()=>{c.destroy();reject(new Error('Server is still running'));});c.once('error',resolve);});check('preview server stopped',true);}
  const b=await chromium.launch({channel:'msedge',headless:true});let context,p;
  try{
    report.browser=b.version();context=await b.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:path.join(out,'video'),size:{width:960,height:680}}});
    if(kind==='file'){await context.setOffline(true);await context.route(/^https?:/,r=>r.abort());}
    await context.addInitScript(()=>{window.__controlAudit=[];for(const type of ['keydown','keyup','pointerdown','pointerup','click'])window.addEventListener(type,e=>{window.__controlAudit.push({ms:performance.now(),type,code:e.code,button:e.button,detail:e.detail,mode:document.getElementById('stage')?.dataset.mode,target:e.target.id||e.target.tagName});if(window.__controlAudit.length>4000)window.__controlAudit.shift();},true);});p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))report.network.push(r.url());});await context.tracing.start({screenshots:false,snapshots:false});
    await p.goto(kind==='file'?'file:///'+path.join(root,'release/index.html').replace(/\\/g,'/'):'http://127.0.0.1:5188/release/index.html');
    await p.evaluate(()=>Kong.ImageArt.ready);await p.screenshot({animations:'disabled',path:path.join(out,kind+'-title.png')});await p.getByRole('button',{name:'踏上劫途'}).click();if(await p.getByRole('button',{name:'选择应劫者'}).isVisible())await p.getByRole('button',{name:'选择应劫者'}).click();await p.keyboard.press(process.env.HERO==='wukong'?'Digit1':'Digit2');await sleep(120);await p.keyboard.press('Digit'+({cloud:1,echo:2,staff:3}[process.env.STARTER||'cloud']));await sleep(300);
    const snap=()=>p.evaluate(()=>__KONG__.snapshot());report.seed=(await snap()).state.seed;check('new run starts through prologue and relic choice',(await snap()).screen==='playing');
    await p.keyboard.press('Escape');const frozen=(await snap()).state.elapsed;await p.keyboard.press('KeyJ');await sleep(100);check('pause gates world input',(await snap()).state.elapsed===frozen);
    const dl=p.waitForEvent('download');await p.getByRole('button',{name:'导出存档',exact:true}).click();const download=await dl;const savePath=path.join(out,kind+'-start-save.json');await download.saveAs(savePath);await p.locator('#import-file').setInputFiles(savePath);await sleep(100);check('v6 JSON imports paused',(await snap()).screen==='paused');await p.getByRole('button',{name:'继续前行',exact:true}).click();
    const held=new Set();async function keys(want,pulseSpace=false){if(want.size&&(await snap()).screen!=='playing'){want=new Set();pulseSpace=false;}if(pulseSpace&&held.has(jumpKey)){await p.keyboard.up(jumpKey);held.delete(jumpKey);}for(const k of [...held])if(!want.has(k)){if(k==='MouseLeft')await p.mouse.up();else await p.keyboard.up(k);held.delete(k);}for(const k of [...want].sort((a,b)=>Number(a==='KeyF')-Number(b==='KeyF')))if(!held.has(k)){if((await snap()).screen!=='playing')break;if(k==='MouseLeft')await p.mouse.down();else await p.keyboard.down(k);held.add(k);}}
    const rect=await p.locator('#world').boundingBox();let lastStage=-1,jumpUntil=0,lastJump=-2,lastDrop=-2,lastClone=-5,lastDash=-5,midVisited=new Set(),count=0,evade=false;const visitedNodes=new Set();const started=Date.now();
    while(Date.now()-started<720000){
      const {screen,state:s,camera}=await snap();
      if(screen==='dead'){report.failed={source:s.lastDamage,stage:s.stage,player:s.player,log:s.log};await p.screenshot({animations:'disabled',path:path.join(out,kind+'-failure.png')});throw new Error('Controller died: '+s.lastDamage+' stage '+s.stage);}
      if(screen==='won'){await keys(new Set());report.final={time:s.time,elapsed:s.elapsed,hp:s.player.hp,kills:s.kills,broken:s.broken,relics:s.relics,growth:s.growth,talisman:s.talisman,stats:s.stats,world:s.world,journal:s.journal};await p.screenshot({animations:'disabled',path:path.join(out,kind+'-victory.png')});await p.getByRole('button',{name:'走出黑莲'}).click();check('victory reaches epilogue',(await snap()).screen==='epilogue');await p.getByRole('button',{name:'查看此行'}).click();check('epilogue returns to complete results',(await snap()).screen==='won');break;}
      if(screen==='replace'){await keys(new Set());const old=s.relics.find(id=>id!=='cloud'&&id!=='echo')||s.relics.find(id=>id!=='cloud')||s.relics[0];await p.locator('[data-relic="'+old+'"]').click();continue;}
      if(screen==='reward'){await keys(new Set());if(s.rewardKind==='mid')midVisited.add(s.stage);report.rewards.push({stage:s.stage,kind:s.rewardKind,options:s.reward,hp:s.player.hp});await p.screenshot({animations:'disabled',path:path.join(out,kind+'-reward-'+s.stage+'-'+s.rewardKind+'.png')});const priority=process.env.BUILD==='mystic'?['ultimate-echo','clone-burst','thunder','echo','ward','vitality','mercy','staff-wave','mirror','staff','flame']:['staff-wave','dash-strike','vitality','thunder','ultimate-echo','echo','clone-burst','ward','mercy','staff','mirror','flame'];const id=s.player.hp<80?'rest':priority.find(id=>s.reward.includes(id))||'rest';report.rewards.at(-1).chosen=id;await p.locator('[data-relic="'+id+'"]').click();await sleep(100);continue;}
      if(screen!=='playing')throw new Error('Unexpected screen '+screen);
      if(s.stage!==lastStage){lastStage=s.stage;report.stages.push(s.stage);console.log(kind+' entered '+s.stage);await p.screenshot({animations:'disabled',path:path.join(out,kind+'-stage-'+s.stage+'.png')});}
      const q=s.player,t=s.time,want=new Set(['KeyJ']);let target,aim,aimY=413,pulse=false,navigating=false;evade=false;const guardian=s.room.enemies.find(e=>e.kind==='warden'&&!e.dormant&&e.hp>0);
      const finalBoss=s.room.enemies.find(e=>e.kind==='boss'&&!e.dormant&&e.hp>0);
      if(!guardian&&!finalBoss){
        const first=s.room.seals[0],living=s.room.seals.find(q=>q.hp>0),lamp=s.stage<3&&first.hp===0&&!s.room.midClaimed&&!midVisited.has(s.stage);
        const node=s.room.node,doNode=first.hp===0&&s.room.midClaimed&&node&&node.state!=='done'&&q.x>node.x-360;const guard=doNode&&node.state==='active'?s.room.enemies.find(e=>node.guards.includes(e.id)&&e.hp>0):null;
        target=lamp?first.x:doNode?(guard?guard.x-48:node.x-30):living?living.x-46:s.stage===3?s.room.arena.enter+35:s.room.exit;
        const camp=s.room.camp;if(camp&&!camp.used&&q.x>camp.x-170&&(!living||living.x>camp.x)&&q.hp<95)target=camp.x;
        if(camp&&!camp.used&&Math.abs(q.x-camp.x)<65&&Math.abs(q.y-camp.y)<60)want.add('KeyF');aim=guard?guard.x+13:target+45;aimY=guard?guard.y+20:living?living.y+20:413;
        if(doNode&&node.state==='ready'&&Math.abs(q.x-node.x)<80&&Math.abs(q.y-396)<90)want.add('KeyF');
        const nodeKey=s.stage+':'+(node?.state||'none');if(node&&node.state!=='ready'&&!visitedNodes.has(nodeKey)){visitedNodes.add(nodeKey);report.worldEvents.push({stage:s.stage,id:node.id,state:node.state,time:t,hp:q.hp});await p.screenshot({animations:'disabled',path:path.join(out,kind+'-world-'+s.stage+'-'+node.state+'.png')});}
        if(q.x<target-7)want.add('KeyD');else if(q.x>target+7)want.add('KeyA');
        if(lamp&&Math.abs(q.x-target)<60){want.add('KeyF');}
        if(s.stage<3&&!living&&!lamp&&Math.abs(q.x-s.room.exit)<60)want.add('KeyF');
        const approachingGap=s.room.platforms.some(g=>g.solid&&g.x+g.w<s.room.width-10&&g.x+g.w-q.x<105&&g.x+g.w-q.x>0);
        const gap=s.room.platforms.some(g=>g.solid&&g.x+g.w<s.room.width-10&&q.x>g.x+g.w-49&&q.x<g.x+g.w);
        const hazard=s.room.hazards.some(h=>h.x>q.x&&h.x-q.x<95)&&q.y+q.h>410;
        const foe=s.room.enemies.filter(e=>e.hp>0&&!e.dormant&&Math.abs(e.x-q.x)<480).sort((a,b)=>Math.abs(a.x-q.x)-Math.abs(b.x-q.x))[0];
        const warning=foe&&foe.phase.endsWith('windup')&&foe.timer<.5&&Math.abs(foe.y-q.y)<70;
        const high=living&&Math.abs(target-q.x)<75&&q.y+q.h>living.y+living.h+5;
        if(q.grounded&&t-lastJump>.38&&(gap||hazard||warning||high)){lastJump=t;jumpUntil=t+.58;pulse=true;}
        if(t<jumpUntil)want.add(jumpKey);navigating=approachingGap||t<jumpUntil;if(navigating)want.delete('KeyJ');
        if(living&&Math.abs(q.x-target)<75&&q.grounded&&q.y+q.h<living.y+living.h-12&&t-lastDrop>.65){want.add('KeyS');want.add(jumpKey);lastDrop=t;jumpUntil=0;pulse=true;}
        const overGap=!s.room.platforms.some(g=>g.solid&&q.x+q.w>g.x&&q.x<g.x+g.w);
        if(overGap&&q.vy>110&&q.y+q.h>400&&q.airJumps===0&&s.relics.includes('cloud')&&t-lastJump>.3){want.add(jumpKey);jumpUntil=t+.3;lastJump=t;pulse=true;}
        if(foe&&foe.x+foe.w>q.x-50){aim=foe.x+foe.w/2;aimY=foe.y+foe.h/2;}if(living&&Math.abs(q.x-living.x)<200){aim=living.x+14;aimY=living.y+24;}
        if(foe&&foe.phase.endsWith('windup')&&q.focus>=(s.relics.includes('echo')?50:40)&&!s.clone&&t-lastClone>2){want.add('KeyL');lastClone=t;}
        if(foe&&!navigating&&q.grounded&&q.rage>=100&&q.hp<80&&q.ultimate<=0&&q.hurt<=0)want.add('KeyR');
        if(foe&&s.talisman&&q.talismanCD<=0&&q.hurt<=0&&(s.talisman.id==='thunder'&&foe.kind==='shield'||s.talisman.id==='ward'&&foe.phase.endsWith('windup')&&foe.timer<.3))want.add('KeyQ');
        if(foe&&foe.kind==='shield'&&q.dashCD===0&&t-lastDash>1.2&&Math.abs(target-q.x)>120&&!approachingGap&&!navigating){want.add('KeyK');lastDash=t;}
      }else{
        const e=guardian||finalBoss;target=e.face<0?e.x+e.w+22:e.x-50;aim=e.x+24;aimY=e.y+e.h/2;
        const mustMove=e.phase==='warden-windup'&&['columns','lantern'].includes(e.move);const marks=(e.phase==='rain-windup'||mustMove)?(e.marks||[]):s.dangers.filter(d=>d.h>40);
        if(marks.some(b=>q.x+q.w>b.x-8&&q.x<b.x+b.w+8)){const safe=(guardian?[4450,4520,4590,4660,4730,4800,4870,4940,5010,5080].map(x=>x+s.room.arena.offset):[65,190,325,460,595,780,875].map(x=>x+s.room.arena.offset)).filter(x=>(!guardian||x+q.w<e.x-4||x>e.x+e.w+4)&&marks.every(b=>x+q.w<b.x-10||x>b.x+b.w+10)).sort((a,b)=>Math.abs(a-q.x)-Math.abs(b-q.x));if(safe.length){target=safe[0];evade=true;want.delete('KeyJ');}}
        if(q.x<target-8)want.add('KeyD');else if(q.x>target+8)want.add('KeyA');
        if((e.phase==='sweep-windup'&&e.timer<.4||e.phase==='shift-windup'&&e.timer<.3||e.phase==='warden-windup'&&['charge','quake','bell','fan'].includes(e.move)&&e.timer<.4)&&q.grounded&&t-lastJump>.5){want.add(jumpKey);lastJump=t;jumpUntil=t+.57;pulse=true;}
        if(t<jumpUntil)want.add(jumpKey);
        if(q.grounded&&q.y<350&&t-lastDrop>.65){want.add('KeyS');want.add(jumpKey);lastDrop=t;jumpUntil=0;pulse=true;}
        if(Math.abs(q.x-e.x)<100&&q.dashCD===0&&t-lastDash>1&&e.phase!=='recover'){want.add('KeyK');lastDash=t;}
        if(q.rage>=100&&q.y>340&&Math.abs(q.x-e.x)<260&&q.ultimate<=0)want.add('KeyR');
        if(s.talisman&&Math.abs(q.x-e.x)<390&&q.talismanCD<=0&&(s.talisman.id==='thunder'||e.phase.includes('windup')&&e.timer<.3))want.add('KeyQ');
        if(!evade&&q.focus>=(s.relics.includes('echo')?50:40)&&!s.clone&&t-lastClone>2){want.add('KeyL');lastClone=t;}
      }
      const locked=s.room.enemies.filter(e=>e.phase==='cross-windup').flatMap(e=>e.marks||[]).concat(s.dangers.filter(d=>d.source==='莲灯使·交叉封位'));
      if(locked.some(b=>q.x+q.w>b.x-8&&q.x<b.x+b.w+8&&q.y+q.h>b.y)){
        const choices=[...Array(13)].map((_,i)=>q.x+(i-6)*45).filter(x=>x>8&&x<s.room.width-32&&locked.every(b=>x+q.w<b.x-10||x>b.x+b.w+10)&&s.room.platforms.some(g=>g.x<x+q.w&&g.x+g.w>x&&g.y>=q.y+q.h-5)).sort((a,b)=>Math.abs(a-q.x)-Math.abs(b-q.x));
        if(choices.length){const x=choices[0];want.delete('KeyA');want.delete('KeyD');want.delete('KeyJ');want.delete('KeyF');want.delete('KeyR');want.add(x<q.x?'KeyA':'KeyD');evade=true;}
      }
      if(q.ultimate>0)want.delete('KeyF');if(want.has('KeyF'))want.delete('KeyR');
      if((await snap()).screen!=='playing'){await keys(new Set());continue;}
      // Aim is a real pointer position in the Canvas; no simulation mutators are called.
      await p.mouse.move(rect.x+(Kclamp(aim-camera,10,950)/960)*rect.width,rect.y+(Kclamp(aimY,10,530)/540)*rect.height);if(!evade&&!navigating)want.add('MouseLeft');await keys(want,pulse);
      if(count++%14===0){report.samples.push({time:s.time,wall:s.elapsed,stage:s.stage,x:Math.round(q.x),y:Math.round(q.y),hp:q.hp,focus:Math.floor(q.focus),seals:s.room.seals.map(q=>q.hp),boss:s.stage===3?s.room.enemies[0].hp:guardian?.hp||null,guardian:guardian?.guardian,rage:q.rage,growth:s.growth});fs.writeFileSync(path.join(out,kind+'-progress.json'),JSON.stringify(report,null,2));}
      await sleep(55);
    }
    if(held.has('MouseLeft')){await p.mouse.up();held.delete('MouseLeft');}await keys(new Set());check('complete real-input journey',!!report.final);check('all three midpoint opportunities visited',report.rewards.filter(x=>x.kind==='mid').length===3);check('all stages visited',report.stages.join(',')==='0,1,2,3');check('three independent guardians defeated',report.final.stats.guardians===3);check('ultimate used in real-input journey',report.final.stats.ultimates>0);if((process.env.HERO||'nezha')==='nezha')check('ring has real distant hits in full journey',report.final.stats.farHits>5);check('three optional world consequences completed',Object.values(report.final.world).every(Boolean));
    const metrics=await p.evaluate(()=>__KONG__.metrics());report.errors.push(...metrics.errors);const pct=(a,n)=>{const x=a.slice().sort((a,b)=>a-b);return x[Math.floor((x.length-1)*n)]||0;};report.performance={frames:metrics.frames.length,frameP95:pct(metrics.frames,.95),inputP95:pct(metrics.inputs.map(x=>x.ms),.95),inputMax:Math.max(...metrics.inputs.map(x=>x.ms))};check('no runtime exceptions',report.errors.length===0);check('frame interval p95 under 25ms',report.performance.frameP95<25);check('event to render submission p95 under 50ms',report.performance.inputP95<50);if(kind==='file')check('zero HTTP(S) requests',report.network.length===0);
    fs.writeFileSync(path.join(out,kind+'-input.json'),JSON.stringify(metrics,null,2));const traceFile=path.join(out,kind+'-trace-'+Date.now()+'.zip');await context.tracing.stop({path:traceFile});report.trace=path.relative(root,traceFile).replace(/\\/g,'/');
  }finally{if(p){const boundaryFile=path.join(out,kind+'-input-boundaries.json');fs.writeFileSync(boundaryFile,JSON.stringify(await p.evaluate(()=>window.__controlAudit||[]).catch(()=>[]),null,2));report.inputBoundaries=path.relative(root,boundaryFile).replace(/\\/g,'/');report.video=path.relative(root,await p.video().path()).replace(/\\/g,'/');}await context?.close();await b.close();fs.writeFileSync(path.join(out,kind+'-playthrough.json'),JSON.stringify(report,null,2));}
  console.log(JSON.stringify({kind,checks:report.checks,final:report.final,performance:report.performance},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
function Kclamp(x,a,b){return Math.max(a,Math.min(b,x));}
