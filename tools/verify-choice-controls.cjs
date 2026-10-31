const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),offline=process.argv.includes('--offline'),baseline=process.argv.includes('--baseline'),out=path.join(root,'evidence/choice-controls');
const report={kind:offline?'file':'http',checks:[],errors:[]},check=(name,pass)=>{report.checks.push({name,pass:!!pass});assert.ok(pass,name);};
(async()=>{
  let browser,server;
  try{
    fs.mkdirSync(out,{recursive:true});if(!offline)server=await(await import('vite')).preview({preview:{host:'127.0.0.1',port:0,strictPort:true}});
    browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}});
    if(offline){await context.setOffline(true);await context.route(/^https?:/,r=>r.abort());}
    const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
    await page.goto(offline?pathToFileURL(path.join(root,'dist-offline/index.html')).href:'http://127.0.0.1:'+server.httpServer.address().port+'/');
    await page.evaluate(()=>Promise.all([Kong.ImageArt.bootReady,Kong.Brand.ready]));
    const screen=name=>page.waitForFunction(value=>__KONG__.snapshot().screen===value,name);
    let serial=0;
    const loadReward=async replace=>{
      const raw=await page.evaluate(({replace,serial})=>{
        const s=Kong.newRun('CHOICE-CONTROLS','cloud');Kong.enterRoom(s,1,true);s.campaign.completed=[0,1];Kong.guardian(s).hp=0;s.mode='reward';s.rewardKind='exit';s.reward=['staff','orbit-staff','rest'];s.runId='CHOICES-'+serial;
        if(replace){s.relics=['cloud','echo','mirror'];s.pendingRelic='staff';}
        const raw=Kong.pack(s,{});Kong.validSave(JSON.parse(raw));return raw;
      },{replace,serial:++serial});
      await page.locator('#import-file').setInputFiles({name:'reward.json',mimeType:'application/json',buffer:Buffer.from(raw)});await page.waitForFunction(id=>__KONG__.snapshot().state?.runId===id,JSON.parse(raw).state.runId);await screen(replace?'replace':'reward');
      await page.waitForFunction(()=>document.activeElement?.matches('.relic-card'));
      await page.locator('.game-dialog').evaluate(n=>Promise.all(n.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
    };
    await loadReward(false);
    const selected=()=>page.locator('.relic-card:focus');
    check('reward initially selects exactly one card',await selected().count()===1);
    await page.screenshot({path:path.join(out,baseline?'before.png':'reward-selected.png')});
    const visual=await selected().evaluate(n=>({outline:parseFloat(getComputedStyle(n).outlineWidth),label:getComputedStyle(n,'::after').content}));
    check('selected card has a prominent outline and explicit label',visual.outline>=3&&visual.label.includes('当前选择'));
    for(const viewport of [{width:1074,height:885},{width:1024,height:768}]){
      await page.setViewportSize(viewport);
      const fit=await selected().evaluate(n=>{const r=n.getBoundingClientRect(),label=getComputedStyle(n,'::after'),icon=n.querySelector('.relic-art').getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&parseFloat(label.top)+parseFloat(label.height)<=icon.y-r.y+2;});
      check(viewport.width+': selection outline and label fit without covering the icon',fit);
    }
    await page.screenshot({path:path.join(out,'compact-selected.png')});await page.setViewportSize({width:1440,height:1000});
    check('dialog explains J confirmation',(await page.locator('.dialog-footer').textContent()).includes('J'));
    await page.keyboard.press('ArrowRight');check('arrow key moves selection to the second card',await selected().getAttribute('data-relic')==='orbit-staff');
    await page.keyboard.press('KeyJ');await screen('playing');
    check('J confirms exactly the highlighted reward',await page.evaluate(()=>__KONG__.snapshot().state.celestial.equipped==='orbit-staff'&&__KONG__.snapshot().state.stage===2));
    check('confirmation J does not leak into a combat attack',await page.evaluate(()=>__KONG__.snapshot().state.stats.swings===0));
    await page.keyboard.press('KeyJ');await page.waitForFunction(()=>__KONG__.snapshot().state.stats.swings>0);
    check('a fresh J still attacks in gameplay',true);
    await loadReward(false);await page.locator('[data-relic="rest"]').hover();
    check('mouse and keyboard share the same selected card',await selected().getAttribute('data-relic')==='rest');
    await page.screenshot({path:path.join(out,'mouse-selected.png')});await page.keyboard.press('KeyJ');await screen('playing');
    check('J confirms the mouse-highlighted choice',await page.evaluate(()=>__KONG__.snapshot().state.stats.rests===1));
    await loadReward(true);await page.keyboard.press('KeyD');check('replacement selection supports D',await selected().getAttribute('data-relic')==='echo');
    await page.keyboard.press('KeyJ');await screen('playing');
    check('J replaces only the selected relic',await page.evaluate(()=>{const s=__KONG__.snapshot().state;return s.relics.includes('cloud')&&s.relics.includes('staff')&&!s.relics.includes('echo');}));
    // Hold J across a public save import: the same input fence is used when
    // combat naturally opens rewards. Auto-repeat must never choose a card.
    await page.keyboard.down('KeyJ');await loadReward(false);await page.keyboard.down('KeyJ');
    check('a held combat J cannot accept a reward',await page.evaluate(()=>__KONG__.snapshot().screen==='reward'));
    await page.keyboard.up('KeyJ');await page.keyboard.press('KeyJ');await screen('playing');
    check('release and press J accepts the reward normally',true);
    await page.keyboard.press('Escape');await screen('paused');await page.locator('#main-menu').click();await screen('menu');
    await page.locator('#seed').fill('');await page.locator('#seed').press('j');
    check('typing j in the seed field does not confirm a menu',await page.locator('#seed').inputValue()==='j'&&await page.evaluate(()=>__KONG__.snapshot().screen==='menu'));
    await page.locator('#begin').focus();await page.keyboard.down('KeyJ');await page.waitForFunction(()=>['prologue','heroes'].includes(__KONG__.snapshot().screen));
    await page.keyboard.down('KeyJ');check('holding J cannot skip another selection screen',await page.evaluate(()=>['prologue','heroes'].includes(__KONG__.snapshot().screen)));await page.keyboard.up('KeyJ');
    if(await page.locator('#begin-relic').count())await page.keyboard.press('KeyJ');await screen('heroes');await page.waitForFunction(()=>document.activeElement?.matches('.hero-choice'));
    await page.keyboard.press('KeyD');await page.keyboard.press('KeyJ');await screen('start');
    check('J confirms the highlighted hero',await page.evaluate(()=>Kong.pendingHero==='nezha'));await page.waitForFunction(()=>document.activeElement?.matches('.relic-card'));
    await page.keyboard.press('KeyD');await page.keyboard.press('KeyJ');await screen('playing');
    check('J confirms the highlighted starting relic',await page.evaluate(()=>{const s=__KONG__.snapshot().state;return s.hero==='nezha'&&s.relics.includes('echo');}));
    await loadReward(false);await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await screen('playing');
    check('Enter still confirms choices',true);
    const art=await page.evaluate(()=>{const s=Kong.newRun('CHOICE-ART','cloud');s.mode='art-choice';s.celestial.pending=Kong.artManuals(s)[0].id;return Kong.pack(s,{});});
    await page.locator('#import-file').setInputFiles({name:'art.json',mimeType:'application/json',buffer:Buffer.from(art)});await screen('art-choice');
    await page.waitForFunction(()=>document.activeElement?.id==='learn-art');await page.keyboard.press('KeyJ');await screen('playing');
    check('J also confirms learning the focused skill',await page.evaluate(()=>__KONG__.snapshot().state.celestial.owned.includes('sky-staff')));
    check('no browser or game-loop errors',!report.errors.length&&await page.evaluate(()=>!__KONG__.metrics().errors.length));report.pass=true;await context.close();
  }catch(e){report.failure=e.stack;process.exitCode=1;}
  finally{await browser?.close();await server?.close();fs.writeFileSync(path.join(out,baseline?'baseline.json':offline?'offline.json':'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
})();
