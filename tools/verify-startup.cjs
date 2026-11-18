const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARTUP_OUT||'evidence/vite/startup.json');
const runs=Number(process.env.STARTUP_RUNS||3),cpuRate=Number(process.env.CPU_RATE||1);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'dist/manifest.json'),'utf8'));
const report={buildTool:manifest.buildTool,entrySHA256:manifest.sha256,script:manifest.script,network:{downloadMiBps:2,uploadMiBps:1,latencyMs:20,cache:'disabled',cpuSlowdown:cpuRate},runs:[],checks:[]};
const check=(name,pass)=>{report.checks.push({name,pass:!!pass});assert.ok(pass,name);};
(async()=>{
  let server,browser;
  fs.mkdirSync(path.dirname(out),{recursive:true});
  try{
    if(!process.env.STARTUP_URL)server=await(await import('vite')).preview({preview:{host:'127.0.0.1',port:0,strictPort:true}});
    const address=server?.httpServer.address();report.url=process.env.STARTUP_URL||'http://127.0.0.1:'+address.port+'/';
    browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();
    for(let index=0;index<runs;index++){
      const ctx=await browser.newContext({viewport:{width:1366,height:850}}),page=await ctx.newPage(),cdp=await ctx.newCDPSession(page),errors=[],requests=[];
      try{
        await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
        await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:20,downloadThroughput:2*1024*1024,uploadThroughput:1024*1024});
        await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
        await ctx.addInitScript(()=>{
          window.__startupProbe={lcp:null};
          new PerformanceObserver(list=>{const e=list.getEntries().at(-1);window.__startupProbe.lcp=e&&{ms:e.startTime,size:e.size,url:e.url||null};}).observe({type:'largest-contentful-paint',buffered:true});
        });
        page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
        await page.goto(report.url);await page.waitForFunction(()=>globalThis.__KONG__&&globalThis.Kong?.ImageArt);
        await page.evaluate(()=>Promise.all([Kong.ImageArt.bootReady,Kong.Brand.ready]));
        const homeReadyMs=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(performance.now())))));
        const data=await page.evaluate(()=>({paint:performance.getEntriesByType('paint').map(e=>({name:e.name,ms:e.startTime})),lcp:__startupProbe.lcp,images:Object.keys(Kong.ImageArt.images),navigationBytes:performance.getEntriesByType('navigation')[0].transferSize,resources:performance.getEntriesByType('resource').map(e=>({name:e.name,encodedBytes:e.encodedBodySize,decodedBytes:e.decodedBodySize,transferBytes:e.transferSize,ms:e.duration})),errors:__KONG__.metrics().errors}));
        const imageRequests=requests.filter(url=>url.includes('/assets/images/'));
        const menuBytes=data.navigationBytes+data.resources.reduce((sum,r)=>sum+r.transferBytes,0);
        const run={homeReadyMs,menuBytes,...data,errors:[...errors,...data.errors]};report.runs.push(run);
        check('run '+index+': homepage fully ready within 6 seconds',homeReadyMs<=6000);
        check('run '+index+': first contentful paint within 1.8 seconds',data.paint.some(e=>e.name==='first-contentful-paint'&&e.ms<=1800));
        check('run '+index+': initial transfer at most 5 MB',menuBytes<=5000000);
        check('run '+index+': only four boot images requested and decoded',imageRequests.length===4&&data.images.length===4&&manifest.bootImages.every(id=>data.images.includes(id)));
        check('run '+index+': music waits for a gesture',!requests.some(url=>url.includes('/assets/music/')));
        check('run '+index+': JavaScript response at most 512 KiB decoded',data.resources.filter(r=>/\.js(?:\?|$)/.test(r.name)).every(r=>r.decodedBytes<=512*1024));
        check('run '+index+': no runtime errors',run.errors.length===0);
        if(index===runs-1){
          await page.screenshot({path:path.join(path.dirname(out),'homepage.png')});
          await page.locator('#begin').click();await page.locator('#begin-relic').click();await page.locator('#choose-wukong').click();await page.keyboard.press('Digit1');
          await page.waitForFunction(()=>__KONG__.snapshot().screen==='playing',null,{timeout:60000});
          report.firstFightReadyMs=await page.evaluate(()=>performance.now());
          await page.keyboard.press('KeyJ');await page.waitForFunction(()=>__KONG__.snapshot().state.stats.swings>0);
          await page.screenshot({path:path.join(path.dirname(out),'playing.png')});
          check('public menu and real keyboard input enter a playable fight',await page.evaluate(()=>!__KONG__.metrics().errors.length)&&!errors.length);
        }
      }finally{await ctx.close();}
    }
    report.pass=true;
  }catch(e){report.failure=e.stack;process.exitCode=1;}
  finally{
    await browser?.close();await server?.close();
    fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({pass:report.pass,runs:report.runs.map(r=>({homeReadyMs:r.homeReadyMs,menuBytes:r.menuBytes,paint:r.paint,lcp:r.lcp})),firstFightReadyMs:report.firstFightReadyMs,checks:report.checks,failure:report.failure}));
  }
})();
