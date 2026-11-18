const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const out=path.resolve('evidence/boss-hud'),offline=process.argv.includes('--offline'),baseline=process.argv.includes('--baseline');fs.mkdirSync(out,{recursive:true});
const report={kind:offline?'file':'http',checks:[],layouts:[],errors:[]},check=(name,pass)=>{report.checks.push({name,pass:!!pass});assert.ok(pass,name);};
(async()=>{
  let server,browser;
  try{
    if(!offline)server=await(await import('vite')).preview({preview:{host:'127.0.0.1',port:0,strictPort:true}});browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:1000}});if(offline){await page.context().setOffline(true);await page.context().route(/^https?:/,r=>r.abort());}page.on('pageerror',error=>report.errors.push(error.message));
    await page.goto(offline?pathToFileURL(path.resolve('dist-offline/index.html')).href:'http://127.0.0.1:'+server.httpServer.address().port+'/');await page.evaluate(()=>Promise.all([Kong.ImageArt.bootReady,Kong.Brand.ready]));
    check('boss HUD art does not join the four homepage images',await page.evaluate(()=>Object.keys(Kong.ImageArt.images).length===4&&!Kong.ImageArt.images.bossHud));
    let serial=0;
    async function load(stage,ratio=1){
      const id='BOSS-HUD-'+(++serial),raw=await page.evaluate(({stage,ratio,id})=>{
        const s=Kong.newRun('BOSS-HUD-DESIGN','cloud');Kong.enterRoom(s,stage,true);s.campaign.completed=Array.from({length:stage},(_,i)=>i);
        const boss=Kong.guardian(s);for(const e of s.room.enemies)if(e!==boss)e.hp=0;Object.assign(boss,{dormant:false,phase:'recover',timer:1,hp:Math.ceil(boss.maxHp*ratio)});Object.assign(s.player,{x:boss.x-180,y:396,grounded:true,invuln:0});s.mode='paused';s.runId=id;return Kong.pack(s,{});
      },{stage,ratio,id});
      await page.locator('#import-file').setInputFiles({name:'boss-hud.json',mimeType:'application/json',buffer:Buffer.from(raw)});await page.waitForFunction(id=>__KONG__.snapshot().state?.runId===id,id);await page.waitForFunction(()=>__KONG__.snapshot().screen==='paused');await page.locator('#continue').click();await page.waitForFunction(()=>__KONG__.snapshot().screen==='playing');await page.locator('#boss-hud').waitFor({state:'visible'});
      await page.waitForFunction(()=>{const s=__KONG__.snapshot().state,b=Kong.guardian(s);return Number(document.getElementById('boss-meter').getAttribute('aria-valuenow'))===Math.ceil(b.hp)&&document.getElementById('boss-name').textContent===Kong.GUARDIANS[s.stage].name;});
    }
    const layout=()=>page.evaluate(()=>{
      const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};};
      const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
      const bar=box('#boss-hud'),left=box('.hud-left'),actions=box('.hud-actions'),full=box('#fullscreen'),stage=box('#stage');
      return{bar,stage,meter:box('#boss-hud .meter'),overlapsLeft:overlap(bar,left),overlapsActions:overlap(bar,actions),overlapsFullscreen:overlap(bar,full),background:document.querySelector('.boss-bar')?getComputedStyle(document.querySelector('.boss-bar')).backgroundImage:'none'};
    });
    await load(2);await page.screenshot({path:path.join(out,baseline?'before.png':'boss-full.png')});if(!baseline)await page.locator('#boss-hud').screenshot({path:path.join(out,'boss-bar.png')});
    const first=await layout();report.layouts.push(first);check('visible boss health slot is at least 18px thick',first.meter.h>=18);
    check('imagegen frame is actually applied',first.background.includes('url('));
    const meter=page.locator('#boss-meter');check('health meter exposes actual maximum HP',Number(await meter.getAttribute('aria-valuemax'))===await page.evaluate(()=>Kong.guardian(__KONG__.snapshot().state).maxHp));
    await load(11,.5);await page.screenshot({path:path.join(out,'dragon-half.png')});
    check('half health updates width and numeric display',await page.locator('#boss-fill').evaluate(n=>Math.abs(parseFloat(n.style.width)-50)<.5)&&await page.locator('#boss-health').textContent()===await page.evaluate(()=>{const b=Kong.guardian(__KONG__.snapshot().state);return Math.ceil(b.hp)+' / '+b.maxHp;}));
    await page.keyboard.press('KeyJ');await page.waitForFunction(()=>__KONG__.snapshot().state.stats.swings>0);check('combat input still works with the new HUD',true);
    for(const viewport of [{width:1024,height:768},{width:1366,height:850},{width:1920,height:1080},{width:2560,height:1439}]){
      await page.setViewportSize(viewport);const q=await layout();report.layouts.push({viewport,...q});
      check(viewport.width+': HUD fits inside the game view',q.bar.x>=q.stage.x&&q.bar.x+q.bar.w<=q.stage.x+q.stage.w+1&&q.bar.y>=q.stage.y&&q.bar.y+q.bar.h<=q.stage.y+q.stage.h);
      check(viewport.width+': thicker bar does not overlap vital stats or controls',!q.overlapsLeft&&!q.overlapsActions&&!q.overlapsFullscreen&&q.meter.h>=18);
      check(viewport.width+': health fill stays at least as wide as the previous half-screen bar',q.meter.w>=q.stage.w*.5);
      if(viewport.width===1024)await page.screenshot({path:path.join(out,'compact.png')});
    }
    await page.locator('#fullscreen').click();await page.waitForFunction(()=>document.fullscreenElement?.id==='app');await page.screenshot({path:path.join(out,'fullscreen.png')});const full=await layout();check('native fullscreen keeps HUD clear of controls',!full.overlapsLeft&&!full.overlapsActions&&!full.overlapsFullscreen);await page.keyboard.press('Escape');
    await load(2,.03);check('low health remains legible',await page.locator('#boss-hud').evaluate(n=>n.dataset.health==='critical'));await page.screenshot({path:path.join(out,'critical.png')});
    for(const stage of [5,8,14]){await load(stage,.75);check('stage '+stage+' shows the correct guardian name',await page.locator('#boss-name').textContent()===await page.evaluate(()=>Kong.GUARDIANS[__KONG__.snapshot().state.stage].name));}
    await page.keyboard.press('Escape');check('pause hides the combat health HUD',await page.locator('#hud').isHidden());check('no browser or game-loop errors',!report.errors.length&&await page.evaluate(()=>!__KONG__.metrics().errors.length));report.pass=true;
  }catch(error){report.failure=error.stack;process.exitCode=1;}
  finally{await browser?.close();await server?.close();fs.writeFileSync(path.join(out,baseline?'baseline.json':offline?'offline.json':'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
})();
