const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'evidence/fullscreen');fs.mkdirSync(out,{recursive:true});
const baseline=process.argv.includes('--baseline'),offline=process.argv.includes('--offline');
const report={kind:offline?'file':'http',checks:[],layouts:[],errors:[]};
const check=(name,pass)=>{report.checks.push({name,pass:!!pass});assert.ok(pass,name);};
(async()=>{
  let server,browser;
  try{
    if(!offline)server=await(await import('vite')).preview({preview:{host:'127.0.0.1',port:0,strictPort:true}});
    const url=offline?pathToFileURL(path.join(root,'dist-offline/index.html')).href:'http://127.0.0.1:'+server.httpServer.address().port+'/';
    browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();
    const context=await browser.newContext({viewport:{width:2560,height:1439}});
    if(offline){await context.setOffline(true);await context.route(/^https?:/,route=>route.abort());}
    const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
    await page.goto(url);await page.evaluate(()=>Promise.all([Kong.ImageArt.bootReady,Kong.Brand.ready]));
    const layout=()=>page.evaluate(()=>{
      const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};};
      return{viewport:{w:innerWidth,h:innerHeight},app:rect('app'),stage:rect('stage'),world:rect('world'),fullscreen:document.fullscreenElement?.id||null,scroll:{w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight}};
    });
    const before=await layout();report.layouts.push({name:'large-window',...before});
    await page.screenshot({path:path.join(out,baseline?'before.png':'large-window.png')});
    check('large window uses its available width',before.app.w>=before.viewport.w-2);
    check('game offers a fullscreen control',await page.locator('#fullscreen').count()===1);
    await page.locator('#begin').click();await page.locator('#begin-relic').click();await page.locator('#choose-wukong').click();await page.keyboard.press('Digit1');
    await page.waitForFunction(()=>__KONG__.snapshot().screen==='playing');
    const saved=await page.evaluate(()=>__KONG__.snapshot().state.runId);
    await page.locator('#fullscreen').click();await page.waitForFunction(()=>document.fullscreenElement?.id==='app');
    check('button enters native browser fullscreen',true);
    const full=await layout();report.layouts.push({name:'native-fullscreen',...full});
    check('fullscreen removes the header and footer',await page.locator('.masthead').isHidden()&&await page.locator('.footline').isHidden());
    check('fullscreen game keeps the 16:9 aspect ratio',Math.abs(full.stage.w/full.stage.h-16/9)<.01);
    check('fullscreen game fills at least one screen dimension',Math.abs(full.stage.w-full.viewport.w)<3||Math.abs(full.stage.h-full.viewport.h)<3);
    await page.keyboard.press('KeyJ');await page.waitForFunction(()=>__KONG__.snapshot().state.stats.swings>0);
    check('fullscreen input keeps the same run',await page.evaluate(id=>__KONG__.snapshot().state.runId===id,saved));
    const mapped=await page.evaluate(()=>{const r=document.getElementById('world').getBoundingClientRect(),s=__KONG__.snapshot();return{p:Kong.pointerPoint(r.left+r.width*.5,r.top+r.height*.5),camera:s.camera};});
    check('pointer coordinates follow the resized game view',Math.abs(mapped.p.x-mapped.camera-480)<1&&Math.abs(mapped.p.y-270)<1);
    await page.screenshot({path:path.join(out,offline?'offline-fullscreen.png':'native-fullscreen.png')});
    await page.locator('#fullscreen').click();await page.waitForFunction(()=>!document.fullscreenElement);
    check('the same button exits fullscreen',await page.locator('#fullscreen').getAttribute('aria-pressed')==='false');
    await page.keyboard.press('F10');await page.waitForFunction(()=>document.fullscreenElement?.id==='app');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.fullscreenElement);
    check('Escape exits native fullscreen',await page.evaluate(()=>__KONG__.snapshot().screen==='playing'));
    await page.keyboard.press('F10');await page.waitForFunction(()=>document.fullscreenElement?.id==='app');
    await page.evaluate(()=>document.exitFullscreen());await page.waitForFunction(()=>!document.getElementById('app').classList.contains('game-fullscreen'));
    check('F10 enters fullscreen and browser exit restores layout',await page.locator('.masthead').isVisible());
    await page.keyboard.press('Escape');await page.waitForFunction(()=>__KONG__.snapshot().screen==='paused');
    await page.locator('#fullscreen').click();await page.waitForFunction(()=>document.fullscreenElement?.id==='app');
    check('pause dialog stays usable in fullscreen',await page.locator('#continue').isVisible());
    await page.locator('#fullscreen').click();await page.waitForFunction(()=>!document.fullscreenElement);
    await page.evaluate(()=>{document.getElementById('app').requestFullscreen=()=>Promise.reject(new DOMException('Blocked by embedding page','NotAllowedError'));});
    await page.locator('#fullscreen').click();await page.waitForFunction(()=>document.getElementById('app').classList.contains('game-fullscreen'));
    check('blocked browser fullscreen falls back to filling the window',!await page.evaluate(()=>!!document.fullscreenElement));
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.getElementById('app').classList.contains('game-fullscreen'));
    check('Escape exits the window fallback while keeping pause',await page.evaluate(()=>__KONG__.snapshot().screen==='paused'));
    await page.locator('#continue').click();await page.keyboard.press('F10');
    await page.waitForFunction(()=>document.getElementById('app').classList.contains('game-fullscreen'));
    for(const viewport of [{width:2560,height:1080},{width:1920,height:1080},{width:1024,height:768}]){
      await page.setViewportSize(viewport);const q=await layout();report.layouts.push({name:'resized-window-fullscreen',...q});
      check(viewport.width+' fullscreen preserves aspect and stays inside view',Math.abs(q.stage.w/q.stage.h-16/9)<.01&&q.stage.x>=-1&&q.stage.y>=-1&&q.stage.x+q.stage.w<=q.viewport.w+1&&q.stage.y+q.stage.h<=q.viewport.h+1);
      const overlap=await page.evaluate(()=>{const a=document.getElementById('fullscreen').getBoundingClientRect(),b=document.querySelector('.hud-actions').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});
      check(viewport.width+' fullscreen control does not cover combat controls',!overlap);
    }
    await page.keyboard.press('F10');await page.waitForFunction(()=>!document.getElementById('app').classList.contains('game-fullscreen'));
    check('no browser or game-loop errors',report.errors.length===0&&await page.evaluate(()=>!__KONG__.metrics().errors.length));
    report.pass=true;await context.close();
  }catch(e){report.failure=e.stack;process.exitCode=1;}
  finally{await browser?.close();await server?.close();fs.writeFileSync(path.join(out,(baseline?'baseline':offline?'offline':'verification')+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:report.checks,layouts:report.layouts,errors:report.errors,failure:report.failure}));}
})();
