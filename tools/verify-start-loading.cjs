const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'evidence/start-loading');fs.mkdirSync(out,{recursive:true});
const offline=process.argv.includes('--offline'),baseline=process.argv.includes('--baseline');
const report={kind:offline?'file':'http',checks:[],flows:[],errors:[]};
const check=(name,pass)=>{report.checks.push({name,pass:!!pass});assert.ok(pass,name);};
(async()=>{
  let server,browser;
  try{
    if(!offline)server=await(await import('vite')).preview({preview:{host:'127.0.0.1',port:0,strictPort:true}});
    const url=offline?pathToFileURL(path.join(root,'dist-offline/index.html')).href:'http://127.0.0.1:'+server.httpServer.address().port+'/';
    browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();
    for(const hero of ['wukong','nezha','erlang']){
      const context=await browser.newContext({viewport:{width:1366,height:850}});
      try{
        if(offline){await context.setOffline(true);await context.route(/^https?:/,route=>route.abort());}
        const page=await context.newPage(),images=[];page.on('pageerror',error=>report.errors.push(error.message));
        page.on('request',r=>{if(r.url().includes('/assets/images/'))images.push(r.url());});
        await page.goto(url);await page.evaluate(()=>Promise.all([Kong.ImageArt.bootReady,Kong.Brand.ready]));
        check(hero+': homepage still prepares only four images',await page.evaluate(()=>Object.keys(Kong.ImageArt.images).length===4));
        await page.evaluate(()=>{
          const stage=document.getElementById('stage');window.__startLoading={screens:[],sessions:[]};
          let lastMode=null,bar=null,session=null;
          const observe=()=>{
            const mode=stage.dataset.mode;if(mode!==lastMode){__startLoading.screens.push(mode);lastMode=mode;}
            const current=stage.querySelector('[role="progressbar"]');
            if(mode==='loading'&&current){
              if(current!==bar){bar=current;session=[];__startLoading.sessions.push(session);}
              const percent=Number(current.getAttribute('aria-valuenow'));if(session.at(-1)!==percent)session.push(percent);
            }
          };
          new MutationObserver(observe).observe(stage,{subtree:true,childList:true,attributes:true,attributeFilter:['data-mode','aria-valuenow']});observe();
        });
        await page.locator('#begin').click();await page.locator('#begin-relic').click();await page.locator('#choose-'+hero).click();await page.keyboard.press('Digit1');
        await page.waitForFunction(()=>__KONG__.snapshot().screen==='playing');
        const flow=await page.evaluate(()=>({...__startLoading,loaded:Object.keys(Kong.ImageArt.images),runAssetsReady:Kong.ImageArt.has(Kong.ImageArt.forRun(__KONG__.snapshot().state))}));
        report.flows.push({hero,...flow,imageRequests:images.length});
        check(hero+': starting a new game displays one loading progress bar',flow.sessions.length===1);
        const percentages=flow.sessions.flat();check(hero+': progress never falls after reaching completion',percentages.every((value,index)=>index===0||value>=percentages[index-1]));
        check(hero+': the progress bar reaches completion',percentages.at(-1)===100);
        check(hero+': every required battle image is ready',flow.runAssetsReady);
        check(hero+': no later chapter backgrounds are loaded',!flow.loaded.some(id=>['realmUnderworld','realmWater','realmDragon','realmHeaven'].includes(id)));
        check(hero+': each image is requested once',new Set(images).size===images.length);
        await page.keyboard.press('KeyJ');await page.waitForFunction(()=>__KONG__.snapshot().state.stats.swings>0);
        check(hero+': real attack input reaches gameplay without errors',await page.evaluate(()=>!__KONG__.metrics().errors.length));
        if(hero==='wukong')await page.screenshot({path:path.join(out,offline?'offline-playing.png':'playing.png')});
        await page.keyboard.press('Escape');await page.locator('#main-menu').click();await page.locator('#begin').click();
        await page.locator('#choose-'+(hero==='wukong'?'nezha':'wukong')).click();await page.keyboard.press('Digit1');
        await page.waitForFunction(()=>__KONG__.snapshot().screen==='playing');
        check(hero+': another hero can start without another loading bar',await page.evaluate(()=>__startLoading.sessions.length===1));
      }finally{await context.close();}
    }
    check('no page errors',report.errors.length===0);report.pass=true;
  }catch(error){report.failure=error.stack;process.exitCode=1;}
  finally{await browser?.close();await server?.close();fs.writeFileSync(path.join(out,baseline?'baseline.json':offline?'offline.json':'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
})();
