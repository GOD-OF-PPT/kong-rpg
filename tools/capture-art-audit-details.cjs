const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const out=path.resolve(process.env.ART_AUDIT_DIR||'evidence/art-audit-20261030'),ui=path.join(out,'ui'),detail=path.join(out,'details');
for(const p of [ui,detail])fs.mkdirSync(p,{recursive:true});
(async()=>{let server,browser;const report={method:'Fresh production preview. UI: real menu/keyboard or public save import. Details: controlled production renderer scenes and isolated actor silhouettes, without graphics replacements.',frames:[],details:[],errors:[]};
 try{
  server=await(await import('vite')).preview({preview:{host:'127.0.0.1',port:0,strictPort:true}});browser=await chromium.launch({channel:'msedge',headless:true});
  const p=await browser.newPage({viewport:{width:1440,height:1000}});report.browser=browser.version();p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.httpServer.address().port+'/');await p.evaluate(()=>Promise.all([Kong.ImageArt.ready,Kong.DialogArtReady,Kong.Brand.ready]));
  async function shot(file,label){await p.screenshot({path:path.join(ui,file)});report.frames.push({file,label,viewport:p.viewportSize()});}
  await shot('home.png','首页 · 1440×1000');await p.locator('#begin').click();await p.locator('#begin-relic').click();await p.locator('#choose-wukong').waitFor();await p.waitForTimeout(150);await shot('heroes.png','应劫者选择');
  await p.locator('#choose-wukong').click();await p.waitForFunction(()=>document.activeElement?.matches('.relic-card'));await p.keyboard.press('KeyJ');await p.waitForFunction(()=>__KONG__.snapshot().screen==='playing');
  await p.keyboard.down('KeyD');await p.waitForTimeout(550);await p.keyboard.press('Space');await p.keyboard.press('KeyJ');await p.keyboard.up('KeyD');await shot('first-play.png','新旅程 · 真实移动、跳跃与攻击');await p.keyboard.press('Escape');
  let serial=0;async function load(stage,spell){const id='ART-AUDIT-UI-'+(++serial);const raw=await p.evaluate(({stage,spell,id})=>{
    const K=Kong,s=K.newRun('ART-AUDIT-1030','cloud');K.enterRoom(s,stage,true);s.campaign.completed=Array.from({length:stage},(_,i)=>i);const e=K.guardian(s);for(const a of s.room.enemies)if(a!==e)a.hp=0;
    Object.assign(e,{dormant:false,phase:'idle',timer:10});Object.assign(s.player,{x:e.x-220,y:396,grounded:true,invuln:0});if(spell){K.beginCampaignMove(s,e,spell);e.timer=1.3;const lane=K.bossSafeLane(s,e);s.player.x=lane.x+lane.w/2-12;}
    s.runId=id;s.mode='paused';return K.pack(s,{});
   },{stage,spell,id});await p.locator('#import-file').setInputFiles({name:'audit-ui.json',mimeType:'application/json',buffer:Buffer.from(raw)});await p.waitForFunction(id=>__KONG__.snapshot().state?.runId===id,id);await p.locator('#continue').click();await p.waitForFunction(()=>__KONG__.snapshot().screen==='playing');await p.locator('#boss-hud').waitFor({state:'visible'});await p.waitForFunction(()=>{const s=__KONG__.snapshot().state,e=Kong.guardian(s);return document.getElementById('boss-name').textContent===Kong.GUARDIANS[s.stage].name&&Number(document.getElementById('boss-meter').getAttribute('aria-valuemax'))===e.maxHp;});
  }
  for(const stage of [2,5,8,11,14]){await load(stage);await shot('boss-'+stage+'.png','第 '+(stage+1)+' 关 · Boss 与完整 HUD');await p.keyboard.press('Escape');}
  await load(11,'dragon-thunder');await p.waitForTimeout(600);await shot('thunder-warning.png','龙角雷诏 · 自然前摇与 HUD');await p.waitForFunction(()=>__KONG__.snapshot().state.dangers.some(d=>Kong.enemySpell(d)==='dragon-thunder'),null,{polling:'raf'});await shot('thunder-active.png','龙角雷诏 · 唯一安全缺口内的完整界面');await p.keyboard.press('Escape');
  await p.setViewportSize({width:1024,height:768});await load(14);await shot('compact.png','紧凑桌面 · 1024×768');await p.keyboard.press('Escape');await p.setViewportSize({width:1440,height:1000});await load(2);await p.locator('#fullscreen').click();await p.waitForFunction(()=>document.fullscreenElement);await shot('fullscreen.png','原生全屏 · 1440×1000');await p.keyboard.press('Escape');
  const rows=await p.evaluate(()=>{
   const K=Kong,rows=[];const canvas=()=>{const c=document.createElement('canvas');c.width=960;c.height=540;return c;};
   function draw(s,name,label){const c=canvas(),r=new K.Renderer(c);r.camera=K.clamp(s.player.x-300,0,s.room.width-960);r.shake=false;r.clock=1.2;r.draw(s,'playing',0);rows.push({file:name+'.png',label,stage:s.stage,png:c.toDataURL(),player:{x:s.player.x,y:s.player.y},camera:r.camera,projectiles:s.projectiles.map(b=>({...b}))});}
   for(const stage of [0,3,6,9,12])for(const role of [0,1,2]){
    const s=K.newRun('ART-ARMY-1030','cloud');K.enterRoom(s,stage,true);const e=s.room.enemies.find(e=>!e.chiefId&&e.role===role);for(const a of s.room.enemies)if(a!==e)a.hp=0;
    Object.assign(e,{dormant:false,face:-1});Object.assign(s.player,{x:e.x-170,y:396,grounded:true,invuln:0});const spell=K.campaignMoveSet(e)[0];K.beginCampaignMove(s,e,spell);K.releaseCampaignMove(s,e);for(let i=0;i<15;i++)K.step(s);draw(s,'army-'+stage+'-'+role,K.chapter(stage).name+' · '+K.campaignName(e)+' · '+spell+' · 释放后 125ms');
   }
   for(const[stage,spell]of [[8,'venom-fan'],[14,'king-fire'],[8,'venom-tide']]){
    const s=K.newRun('ART-PROJECTILE-1030','cloud');K.enterRoom(s,stage,true);const e=K.guardian(s);for(const a of s.room.enemies)if(a!==e)a.hp=0;Object.assign(e,{dormant:false,face:-1});Object.assign(s.player,{x:e.x-330,y:396,grounded:true,invuln:0});K.beginCampaignMove(s,e,spell);K.releaseCampaignMove(s,e);for(let i=0;i<18;i++)K.step(s);draw(s,'mid-'+spell,K.CAMPAIGN_MOVES[spell].name+' · 释放后 150ms');
   }
   // The same foot anchor is held fixed; record alpha bounds to isolate scale.
   for(const[stage,spell]of [[2,'axe-cleave'],[5,'judge-mark'],[8,'venom-fan'],[11,'dragon-column'],[14,'king-sword']]){
    const s=K.newRun('ART-POSE-SCALE','cloud');K.enterRoom(s,stage,true);const e=K.guardian(s);e.x=452;e.y=350;e.face=-1;e.dormant=false;
    for(const phase of ['idle','campaign-windup']){const c=canvas();c.getContext('2d',{alpha:true});const r=new K.Renderer(c);r.scene=s;r.ui='playing';e.phase=phase;e.move=phase==='idle'?'':spell;e.timer=.3;r.person(e.kind,e.x,e.y,e.face,0);const d=r.c.getImageData(0,0,960,540).data;let x0=960,y0=540,x1=-1,y1=-1;for(let y=0;y<540;y++)for(let x=0;x<960;x++)if(d[(y*960+x)*4+3]>=96){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
     rows.push({file:'pose-'+stage+'-'+phase+'.png',label:K.GUARDIANS[stage].name+' · '+phase,png:c.toDataURL(),stage,phase,alphaBounds:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1},method:'Isolated production person() on transparent Canvas, same foot anchor, alpha >= 96. Bounds include weapons and clothing.'});
    }
   }
   return rows;
  });
  for(const r of rows){fs.writeFileSync(path.join(detail,r.file),Buffer.from(r.png.split(',')[1],'base64'));delete r.png;report.details.push(r);}report.metrics=await p.evaluate(()=>__KONG__.metrics());
 }catch(e){report.failure=e.stack;process.exitCode=1;}finally{await browser?.close();await server?.close();fs.writeFileSync(path.join(ui,'capture.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ui:report.frames.length,details:report.details.length,errors:report.errors,failure:report.failure}));}
})();
