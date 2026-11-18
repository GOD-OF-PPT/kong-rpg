const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const offline=process.argv.includes('--offline'),baseline=process.argv.includes('--baseline'),out=path.resolve('evidence/boss-contact');fs.mkdirSync(out,{recursive:true});
const report={kind:offline?'file':'http',checks:[],errors:[],scenes:[]},check=(name,pass)=>{report.checks.push({name,pass:!!pass});assert.ok(pass,name);};
(async()=>{
  let browser,server;
  try{
    if(!offline)server=await(await import('vite')).preview({preview:{host:'127.0.0.1',port:0,strictPort:true}});browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1366,height:850}});page.on('pageerror',e=>report.errors.push(e.message));
    if(offline){await page.context().setOffline(true);await page.context().route(/^https?:/,r=>r.abort());}
    await page.goto(offline?pathToFileURL(path.resolve('dist-offline/index.html')).href:'http://127.0.0.1:'+server.httpServer.address().port+'/');await page.evaluate(()=>Kong.ImageArt.loadAll());
    let serial=0;
    for(const hero of ['wukong','nezha','erlang'])for(const stage of [2,5,8,11,14]){
      const id='HEAD-JUMP-'+(++serial),raw=await page.evaluate(({hero,stage,id})=>{
        const s=Kong.newRun('REAL-HEAD-JUMP','cloud',hero);Kong.enterRoom(s,stage,true);s.campaign.completed=Array.from({length:stage},(_,i)=>i);const boss=Kong.guardian(s);
        for(const e of s.room.enemies)if(e!==boss)e.hp=0;Object.assign(boss,{dormant:false,phase:'recover',timer:9});Object.assign(s.player,{x:boss.x-70,y:396,grounded:true,invuln:0});s.mode='paused';s.runId=id;
        const raw=Kong.pack(s,{});Kong.validSave(JSON.parse(raw));return raw;
      },{hero,stage,id});
      await page.locator('#import-file').setInputFiles({name:'head-jump.json',mimeType:'application/json',buffer:Buffer.from(raw)});await page.waitForFunction(id=>__KONG__.snapshot().state?.runId===id,id);await page.waitForFunction(()=>__KONG__.snapshot().screen==='paused');await page.locator('#continue').click();await page.waitForFunction(()=>__KONG__.snapshot().screen==='playing');
      await page.keyboard.down('Space');await page.keyboard.down('KeyD');
      await page.waitForFunction(()=>{const s=__KONG__.snapshot().state,b=Kong.guardian(s);return s.player.x>=b.x-30&&s.player.y+44<b.y-4;});
      check(hero+' '+stage+': real jump reaches the boss head height',true);await page.keyboard.up('KeyD');await page.keyboard.up('Space');await page.keyboard.down('KeyJ');
      await page.waitForFunction(()=>__KONG__.snapshot().state.player.grounded,null,{timeout:2500});await page.keyboard.up('KeyJ');
      const snapshot=await page.evaluate(()=>__KONG__.snapshot());check(hero+' '+stage+': holding attack returns to the floor without repeated stomps',snapshot.state.player.grounded&&!snapshot.state.log.some(event=>event.type==='stomp'));
      report.scenes.push({hero,stage,player:snapshot.state.player,boss:KongBoss(snapshot.state),stomps:snapshot.state.log.filter(event=>event.type==='stomp').length});
      if(stage===2&&hero==='wukong')await page.screenshot({path:path.join(out,offline?'offline-landed.png':'landed.png')});
    }
    check('no browser or game-loop exceptions',!report.errors.length&&await page.evaluate(()=>!__KONG__.metrics().errors.length));report.pass=true;
  }catch(error){report.failure=error.stack;process.exitCode=1;}
  finally{await browser?.close();await server?.close();fs.writeFileSync(path.join(out,baseline?'browser-before.json':offline?'offline.json':'browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,errors:report.errors,failure:report.failure}));}
})();
function KongBoss(s){const b=s.room.enemies.find(e=>e.chiefId);return{id:b.chiefId,hp:b.hp,maxHp:b.maxHp};}
