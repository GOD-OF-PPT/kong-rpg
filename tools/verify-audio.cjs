// Real WebAudio decode/render plus keyboard-driven imported encounters.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),os=require('node:os');
const root=path.resolve(__dirname,'..'),kind=process.argv[2]||'http',out=path.join(root,'evidence/audio-v6');
const model=vm.createContext({console});for(const file of ['content','world','progression','journey','heroes','simulation','storage'])vm.runInContext(fs.readFileSync(path.join(root,'src',file+'.js'),'utf8'),model);
const K=model.Kong,report={version:K.VERSION,kind,entrySha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'release/index.html'))).digest('hex'),environment:{os:os.release(),cpu:os.cpus()[0].model,node:process.version,viewport:'1440x1000',audio:'WebAudio decode, scheduled buffers and OfflineAudioContext; no microphone or human listening'},checks:[],scenes:[],errors:[],requests:[]};
function check(name,pass,data={}){report.checks.push({name,pass:!!pass,...data});assert.ok(pass,name);}
function encounter(name){
  const s=K.newRun('AUDIO-1026','cloud',name==='ring'?'nezha':'wukong');
  const e=s.room.enemies.find(e=>e.hp>0&&e.kind===(name==='block'?'shield':'blade')&&!e.dormant);
  assert.ok(e,'canonical encounter');e.timer=8;e.phase=name==='block'?'idle':'recover';e.face=-1;
  Object.assign(s.player,{x:e.x-(name==='ring'?180:46),y:e.y,grounded:true,invuln:1,rage:100});
  if(name==='heavy'){s.combo=2;s.comboTime=1;s.player.comboIndex=2;}
  if(name==='slam'){s.player.y-=110;s.player.grounded=false;}
  const data=K.pack(s,{runs:1});K.validSave(JSON.parse(data));return data;
}
(async()=>{
  fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();
  const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:path.join(out,'video'),size:{width:960,height:680}}});
  if(kind==='file'){await context.setOffline(true);await context.route(/^https?:/,route=>route.abort());}
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))report.requests.push(r.url());});
  try{
    if(kind==='file')await new Promise((resolve,reject)=>{const c=require('node:net').createConnection({host:'127.0.0.1',port:5188});c.once('connect',()=>{c.destroy();reject(new Error('Stop server for offline file check'));});c.once('error',resolve);});
    await page.goto(kind==='file'?'file:///'+path.join(root,'release/index.html').replace(/\\/g,'/'):'http://127.0.0.1:5188/release/index.html?audio=6.1.0');
    await page.evaluate(()=>Kong.ImageArt.ready);await page.getByRole('button',{name:'踏上劫途'}).click();
    if(await page.getByRole('button',{name:'选择应劫者'}).isVisible())await page.getByRole('button',{name:'选择应劫者'}).click();
    await page.keyboard.press('Digit1');await page.waitForTimeout(100);await page.keyboard.press('Digit1');
    await page.waitForFunction(()=>__KONG__.snapshot().screen==='playing'&&__KONG__.audio().decoded.length===8);
    check('eight embedded WAVs decode after real user gesture',true,await page.evaluate(()=>__KONG__.audio()));
    const before=await page.evaluate(()=>__KONG__.snapshot().state.player.x);await page.keyboard.down('KeyD');await page.waitForTimeout(150);await page.keyboard.up('KeyD');
    check('keyboard movement remains active',(await page.evaluate(()=>__KONG__.snapshot().state.player.x))>before);
    // No actual collision: pressing J in open space only plays the synthetic swing.
    await page.keyboard.down('KeyJ');await page.waitForTimeout(200);await page.keyboard.up('KeyJ');
    check('whiff does not produce a contact sample',Object.keys((await page.evaluate(()=>__KONG__.audio())).played).length===0);
    const cases=[['light','staff-light-a',['KeyJ']],['heavy','staff-heavy',['KeyJ']],['block','shield-block',['KeyJ']],['slam','ground-slam',['KeyS','KeyJ']],['ultimate','ultimate-hit',['KeyR']],['ring','ring-hit-a',['KeyJ']]];
    for(const [name,sample,keys] of cases){
      if((await page.evaluate(()=>__KONG__.snapshot().screen))==='playing')await page.keyboard.press('Escape');
      const save=encounter(name);fs.writeFileSync(path.join(out,name+'-fixture.json'),save);
      await page.locator('#import-file').setInputFiles({name:name+'.json',mimeType:'application/json',buffer:Buffer.from(save)});
      await page.waitForFunction(()=>__KONG__.snapshot().screen==='paused');await page.getByRole('button',{name:'继续前行',exact:true}).click();
      const prev=await page.evaluate(()=>__KONG__.audio()),submitted=await page.evaluate(()=>performance.now());
      for(const key of keys)await page.keyboard.down(key);await page.waitForTimeout(name==='slam'?480: name==='ring'?650: name==='ultimate'?650:280);for(const key of keys)await page.keyboard.up(key);
      const after=await page.evaluate(()=>({audio:__KONG__.audio(),snapshot:__KONG__.snapshot()}));
      const added=Object.entries(after.audio.played).filter(([id,n])=>n>(prev.played[id]||0));
      check(name+' resolves a real contact through keyboard and production event routing',added.some(([id])=>id===sample||(name==='light'&&id==='staff-light-b')||(name==='ring'&&id==='ring-hit-b')),{added});
      if(name==='ultimate')check('ultimate area damage has one contact body',added.every(([id])=>id==='ultimate-hit'));
      if(name==='slam')check('slam contact does not double the heavy staff body',added.every(([id])=>id==='ground-slam'));
      report.scenes.push({name,seed:after.snapshot.state.seed,keys,submittedMs:submitted,sounds:after.audio.recent.filter(e=>e.submittedMs>=submitted),events:after.snapshot.state.log.slice(-12)});
      await page.keyboard.press('Escape');check(name+' pause clears sample voices',(await page.evaluate(()=>__KONG__.audio().activeVoices))===0);
    }
    // DOM keys cannot leak into the fight, settings persist, export/import remains schema 6.
    const frozen=await page.evaluate(()=>__KONG__.snapshot().state.elapsed),played=await page.evaluate(()=>JSON.stringify(__KONG__.audio().played));
    await page.keyboard.press('KeyJ');await page.waitForTimeout(100);check('paused DOM input cannot attack',(await page.evaluate(()=>__KONG__.snapshot().state.elapsed))===frozen&&(await page.evaluate(()=>JSON.stringify(__KONG__.audio().played)))===played);
    await page.locator('#volume').fill('0');check('mute setting reaches audio master',(await page.evaluate(()=>__KONG__.audio().volume))===0);
    const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'导出存档',exact:true}).click();const download=await downloadEvent;await download.saveAs(path.join(out,kind+'-export.json'));
    await page.locator('#import-file').setInputFiles(path.join(out,kind+'-export.json'));check('save exports and restores schema 6',(await page.evaluate(()=>__KONG__.snapshot().state.version))===6);
    await page.reload();await page.getByRole('button',{name:'继续旅程'}).click();await page.waitForFunction(()=>__KONG__.audio().decoded.length===8);check('mute survives reload',(await page.evaluate(()=>__KONG__.audio().volume))===0);
    await page.keyboard.press('Escape');await page.locator('#volume').fill('25');await page.screenshot({path:path.join(out,kind+'-audio-settings.png')});
    report.mix=await page.evaluate(async()=>{
      const Native=window.AudioContext,render=async(mute,stop,events)=>{
        const ctx=new OfflineAudioContext(1,48000,48000);window.AudioContext=function(){return ctx;};
        const a=new Kong.Audio();a.setVolume(mute?0:1);a.unlock();await a.ready;
        if(events)a.events(events);else for(const event of [{type:'hit',impact:'light'},{type:'hit',impact:'ring'},{type:'hit',impact:'heavy'},{type:'blocked'},{type:'slam-land'},{type:'ultimate-hit'}])a.event(event);
        if(!events)for(let i=0;i<20;i++)a.event({type:'hit',impact:'light'});
        a.event({type:'boss-warning'});if(stop)a.stopImpacts();const diagnostics=a.diagnostics();const data=(await ctx.startRendering()).getChannelData(0);
        let peak=0,rms=0,tail=0;for(let i=0;i<data.length;i++){peak=Math.max(peak,Math.abs(data[i]));rms+=data[i]*data[i];if(i>40000)tail=Math.max(tail,Math.abs(data[i]));}
        return{peak,rms:Math.sqrt(rms/data.length),tail,diagnostics};
      };
      try{return{burst:await render(false,false),muted:await render(true,false),stopped:await render(false,true),area:await render(false,false,[{type:'hit',impact:'ultimate'},{type:'seal-hit'},{type:'ultimate-hit'}])};}finally{window.AudioContext=Native;}
    });
    check('stress mix renders nonzero audio without clipping',report.mix.burst.peak>.01&&report.mix.burst.peak<.99,{peak:report.mix.burst.peak});
    check('all six simultaneous categories route and repeated targets coalesce',report.mix.burst.diagnostics.maxVoices===6&&Object.keys(report.mix.burst.diagnostics.played).length===6&&report.mix.burst.diagnostics.coalesced>=20);
    check('area pulse hitting seal and enemy still plays once',Object.keys(report.mix.area.diagnostics.played).length===1&&report.mix.area.diagnostics.played['ultimate-hit']===1);
    check('mute produces digital silence',report.mix.muted.peak===0);check('short tails end before next second',report.mix.burst.tail===0);
    check('no decode fallback used',(await page.evaluate(()=>__KONG__.audio().fallbacks))===0);check('no runtime errors',report.errors.length===0);
    if(kind==='file')check('offline file session makes zero HTTP requests',report.requests.length===0);
  }catch(error){report.failure=error.stack;throw error;}
  finally{fs.writeFileSync(path.join(out,kind+'-verification.json'),JSON.stringify(report,null,2));await context.close();await browser.close();console.log(JSON.stringify({kind,checks:report.checks.length,failure:report.failure,errors:report.errors},null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});
