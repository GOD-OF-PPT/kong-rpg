const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const K=require('./combat-identity-runtime.cjs')(),out=path.resolve(process.env.ORIGIN_OUT||'evidence/skill-origins'),checks=[];
fs.mkdirSync(out,{recursive:true});
const check=(name,fn)=>{try{fn();checks.push({name,pass:true});}catch(error){checks.push({name,pass:false,error:error.stack});}};
function fixture(stage,role){const s=K.newRun('SKILL-ORIGINS','cloud');K.enterRoom(s,stage,true);s.campaign.completed=Array.from({length:stage},(_,i)=>i);const e=role==null?K.guardian(s):s.room.enemies.find(e=>e.role===role&&!e.chiefId);e.dormant=false;Object.assign(s.player,{x:e.x-180,y:396,grounded:true,invuln:0});return{s,e};}
check('boss lightning covers the arena from the sky with exactly one escape lane',()=>{const{s,e}=fixture(11);s.player.y=180;s.player.grounded=false;K.beginCampaignMove(s,e,'dragon-thunder');assert.equal(e.marks.length,2);assert.ok(e.marks.every(b=>b.y===0&&b.y+b.h===440));const lane=K.bossSafeLane(s,e);assert.ok(lane&&lane.w===128);assert.equal(e.marks.reduce((n,b)=>n+b.w,0)+lane.w,s.room.arena.max-s.room.arena.min);});
check('ordinary thunder casters also strike from above',()=>{const{s,e}=fixture(12,1);K.beginCampaignMove(s,e,'dragon-thunder');assert.equal(e.marks[0].y,0);});
check('lightning can hit an airborne actor inside its strike area',()=>{const{s,e}=fixture(11);s.player.y=180;s.player.grounded=false;K.beginCampaignMove(s,e,'dragon-thunder');s.player.x=e.marks[0].x+4;K.releaseCampaignMove(s,e);const hp=s.player.hp;K.step(s);assert.ok(s.player.hp<hp);});
check('moving out of the locked lightning columns avoids damage',()=>{const{s,e}=fixture(11);K.beginCampaignMove(s,e,'dragon-thunder');s.player.x=e.marks[0].x+e.marks[0].w+20;s.player.y=180;s.player.grounded=false;const marks=JSON.stringify(e.marks);K.releaseCampaignMove(s,e);const hp=s.player.hp;K.step(s);assert.equal(s.player.hp,hp);assert.equal(JSON.stringify(e.marks),marks);});
check('crossbow bolts launch at the caster weapon instead of the target feet',()=>{const{s,e}=fixture(0,1);K.beginCampaignMove(s,e,'soldier-bolt');K.releaseCampaignMove(s,e);assert.ok(s.projectiles[0].y>=e.y&&s.projectiles[0].y<e.y+e.h*.65);});
check('boss poison fans share a mouth source and diverge into five actual trajectories',()=>{const{s,e}=fixture(8);K.beginCampaignMove(s,e,'venom-fan');K.releaseCampaignMove(s,e);assert.equal(s.projectiles.length,5);assert.equal(new Set(s.projectiles.map(b=>b.x)).size,1);assert.equal(new Set(s.projectiles.map(b=>b.y)).size,1);assert.equal(new Set(s.projectiles.map(b=>b.vy)).size,5);assert.ok(s.projectiles[0].y<e.y);});
check('water columns rise from the targeted platform, not the fixed bottom floor',()=>{const{s,e}=fixture(9,1),platform=s.room.platforms.find(p=>!p.solid&&p.w>=200);s.player.x=platform.x+platform.w/2-12;s.player.y=platform.y-44;K.beginCampaignMove(s,e,'dragon-column');assert.ok(e.marks.every(b=>b.y+b.h===K.surfaceAt(s,b.x+b.w/2,s.player.y+42)));});
check('earth and tide signatures retain a ground source',()=>{for(const[stage,spell]of [[2,'axe-quake'],[8,'venom-tide'],[11,'dragon-surge']]){const{s,e}=fixture(stage);K.beginCampaignMove(s,e,spell);assert.ok(e.marks.every(b=>b.y>0&&b.y+b.h===440));}});
check('all five bosses have a reachable locked escape lane for their signature',()=>{for(const[stage,spell]of [[2,'axe-quake'],[5,'judge-chain'],[8,'venom-tide'],[11,'dragon-thunder'],[14,'tower-prison']]){const{s,e}=fixture(stage);K.beginCampaignMove(s,e,spell);const lane=K.bossSafeLane(s,e);assert.ok(lane);const travel=Math.abs(lane.x+lane.w/2-(s.player.x+12));assert.ok(travel/245+.25<K.campaignWindup(s,e,spell));const marks=JSON.stringify(e.marks);s.player.x=lane.x+lane.w/2-12;K.stepWarden(s,e,K.DT,s.player);assert.equal(JSON.stringify(e.marks),marks);K.releaseCampaignMove(s,e);const hp=s.player.hp;K.step(s);assert.equal(s.player.hp,hp,spell+' safe lane must actually be safe');}});
check('large blades, geysers and fire wheels match enlarged damage geometry',()=>{for(const[stage,spell]of [[2,'axe-cleave'],[14,'king-sword']]){const{s,e}=fixture(stage);K.beginCampaignMove(s,e,spell);assert.ok(e.marks[0].w>=300&&e.marks[0].h>=120);}const{s,e}=fixture(11);K.beginCampaignMove(s,e,'dragon-column');assert.equal(e.marks.length,3);assert.ok(e.marks.every(b=>b.h===240));const fire=fixture(14);K.beginCampaignMove(fire.s,fire.e,'king-fire');K.releaseCampaignMove(fire.s,fire.e);assert.equal(fire.s.projectiles.length,3);assert.ok(fire.s.projectiles.every(b=>b.w===56&&b.h===56));});
check('all live boss skills retain valid save/import geometry and projectile velocities',()=>{for(const stage of [2,5,8,11,14]){const{s,e}=fixture(stage);for(const spell of K.campaignMoveSet(e)){s.dangers=[];s.projectiles=[];K.beginCampaignMove(s,e,spell);const before=JSON.stringify(e.marks);const warning=K.validSave(JSON.parse(K.pack(s,{}))).state;assert.equal(JSON.stringify(warning.room.enemies.find(x=>x.id===e.id).marks),before);K.releaseCampaignMove(s,e);const restored=K.validSave(JSON.parse(K.pack(s,{}))).state;assert.equal(restored.dangers.length,s.dangers.length);assert.deepEqual(JSON.parse(JSON.stringify(restored.projectiles.map(b=>[b.x,b.y,b.vx,b.vy,b.life]))),JSON.parse(JSON.stringify(s.projectiles.map(b=>[b.x,b.y,b.vx,b.vy,b.life]))));}}});
check('sky-height allowance cannot be forged onto a melee hit',()=>{const{s,e}=fixture(2);K.beginCampaignMove(s,e,'axe-cleave');K.releaseCampaignMove(s,e);s.dangers[0].h=400;s.dangers[0].spell='dragon-thunder';assert.throws(()=>K.validSave(JSON.parse(K.pack(s,{}))));});
async function browserChecks(){
  const {chromium}=require('playwright'),offline=process.argv.includes('--offline');let browser,server;
  const errors=[],captures=[];
  try{
    if(!offline)server=await(await import('vite')).preview({preview:{host:'127.0.0.1',port:0,strictPort:true}});
    browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1366,height:850}});page.on('pageerror',e=>errors.push(e.message));
    if(offline){await page.context().setOffline(true);await page.context().route(/^https?:/,r=>r.abort());}
    await page.goto(offline?require('node:url').pathToFileURL(path.resolve('dist-offline/index.html')).href:'http://127.0.0.1:'+server.httpServer.address().port+'/');await page.evaluate(()=>Kong.ImageArt.loadAll());
    const scenes=await page.evaluate(()=>{
      const result=[];
      for(const[stage,spell,role]of [[11,'dragon-thunder'],[12,'dragon-thunder',1],[5,'judge-mark'],[5,'judge-chain'],[11,'dragon-column'],[14,'tower-prison'],[14,'king-fire'],[0,'soldier-bolt',1],[8,'venom-fan'],[8,'venom-tide'],[2,'axe-quake'],[2,'axe-cleave']]){
        const s=Kong.newRun('ORIGIN-VISUAL','cloud');Kong.enterRoom(s,stage,true);const e=role==null?Kong.guardian(s):s.room.enemies.find(e=>e.role===role&&!e.chiefId);
        for(const other of s.room.enemies)if(other!==e)other.hp=0;e.dormant=false;s.player.x=e.x-220;s.player.y=396;s.player.grounded=true;s.player.invuln=0;Kong.beginCampaignMove(s,e,spell);
        const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const renderer=new Kong.Renderer(canvas);renderer.shake=false;renderer.camera=Kong.clamp(s.player.x-340,0,s.room.width-960);
        e.timer=Kong.campaignWindup(s,e,spell)*.45;renderer.draw(s,'playing',Kong.DT);result.push({name:stage+'-'+spell+'-warning',png:canvas.toDataURL()});
        Kong.releaseCampaignMove(s,e);s.time+=.07;for(const d of s.dangers)d.life-=.07;for(const b of s.projectiles){b.x+=b.vx*.18;b.y+=b.vy*.18;}
        const order=[],person=renderer.person.bind(renderer),danger=renderer.enemyDanger.bind(renderer),platform=renderer.platform.bind(renderer);
        renderer.person=(...args)=>{order.push('actor');return person(...args);};renderer.enemyDanger=(...args)=>{order.push('effect');return danger(...args);};renderer.platform=(...args)=>{order.push('terrain');return platform(...args);};
        renderer.draw(s,'playing',Kong.DT);result.push({name:stage+'-'+spell+'-release',png:canvas.toDataURL()});
        if(s.dangers.length)result.push({name:spell+'-actor-order',validOrder:order.lastIndexOf('effect')<order.indexOf('actor')});
        if(spell==='axe-quake')result.push({name:'ground-spikes-buried-under-terrain',validOrder:order.lastIndexOf('effect')<order.indexOf('terrain')});
        if(spell==='dragon-thunder'){
          const isolated=document.createElement('canvas');isolated.width=960;isolated.height=540;const fx=new Kong.Renderer(isolated);fx.scene=s;fx.ui='playing';fx.clock=0;const d={...s.dangers[0],x:300};fx.enemyDanger(d);
          const pixels=fx.c.getImageData(300,0,Math.min(d.w,660),80).data;let count=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]+pixels[i+1]+pixels[i+2]>90)count++;
          result.push({name:'sky-visible-'+stage,skyPixels:count});
          const all=fx.c.getImageData(300,0,Math.min(d.w,660),440).data;let core=0;for(let i=0;i<all.length;i+=4)if(all[i]+all[i+1]+all[i+2]>570)core++;
          result.push({name:'sharp-bright-lightning-core-'+stage,corePixels:core});
        }
      }
      const clear=document.createElement('canvas');clear.width=960;clear.height=540;const r=new Kong.Renderer(clear);r.scene=Kong.newRun('NO-BOUNDARIES','cloud');r.ui='playing';
      let artificial=0;for(const name of ['strokeRect','fillRect','stroke']){const original=r.c[name].bind(r.c);r.c[name]=(...args)=>{artificial++;return original(...args);};}
      r.mark({x:20,y:20,w:200,h:100});r.enemyBoundary({x:20,y:20,w:200,h:100},Kong.enemyEffectProfile('dragon-thunder'),true);
      result.push({name:'no-artificial-skill-boundaries',artificial});
      artificial=0;
      for(const spell of Object.keys(Kong.CAMPAIGN_MOVES)){
        const s=Kong.newRun('NO-PANELS','cloud');Kong.enterRoom(s,11,true);const e=Kong.guardian(s);e.dormant=false;s.player.x=e.x-180;r.scene=s;
        Kong.beginCampaignMove(s,e,spell);for(const b of e.marks)r.enemyTelegraph(e,b);Kong.releaseCampaignMove(s,e);
        for(const d of s.dangers)r.enemyDanger(d);for(const b of s.projectiles)r.drawProjectile(b);if(e.phase==='campaign-charge')r.enemyCharge(e);
      }
      result.push({name:'all-skills-use-transparent-art-without-panels-or-lines',artificial});
      return result;
    });
    for(const scene of scenes){if(scene.png){const file=path.join(out,scene.name+(offline?'-offline':'')+'.png');fs.writeFileSync(file,Buffer.from(scene.png.split(',')[1],'base64'));captures.push(file);}else if(scene.validOrder!=null)check(scene.name,()=>assert.ok(scene.validOrder));else if(scene.artificial!=null)check(scene.name,()=>assert.equal(scene.artificial,0));else if(scene.corePixels!=null)check(scene.name,()=>assert.ok(scene.corePixels>20));else check(scene.name+' draws lightning at the sky source',()=>assert.ok(scene.skyPixels>40));}
    for(const[stage,spell]of [[2,'axe-quake'],[5,'judge-chain'],[8,'venom-tide'],[11,'dragon-thunder'],[14,'tower-prison']]){
      const{s,e}=fixture(stage);for(const other of s.room.enemies)if(other!==e)other.hp=0;e.timer=1;e.attacks=0;K.beginCampaignMove(s,e,spell);const lane=K.bossSafeLane(s,e),center=Math.min(lane.x+lane.w/2,e.x-24);s.mode='paused';s.runId='LIVE-'+spell;
      const raw=K.pack(s,{});K.validSave(JSON.parse(raw));await page.locator('#import-file').setInputFiles({name:'boss-skill.json',mimeType:'application/json',buffer:Buffer.from(raw)});await page.waitForFunction(id=>__KONG__.snapshot().state?.runId===id,s.runId);await page.waitForFunction(()=>__KONG__.snapshot().screen==='paused');
      await page.locator('#continue').click();await page.waitForFunction(()=>__KONG__.snapshot().screen==='playing');
      const start=await page.evaluate(()=>__KONG__.snapshot().state.player.x+12),key=center>start?'KeyD':'KeyA';await page.keyboard.down(key);
      await page.waitForFunction(({center,right})=>{const x=__KONG__.snapshot().state.player.x+12;return right?x>=center-6:x<=center+6;},{center,right:center>start});await page.keyboard.up(key);
      await page.waitForFunction(spell=>__KONG__.snapshot().state.log.some(event=>event.type==='enemy-attack'&&event.move===spell),spell);
      const snapshot=await page.evaluate(()=>__KONG__.snapshot());check(spell+' real keyboard movement reaches the sole safe lane',()=>assert.ok(snapshot.state.player.x>=lane.x&&snapshot.state.player.x+24<=lane.x+lane.w));
      check(spell+' safe lane avoids the real damage event',()=>assert.equal(snapshot.state.player.hp,100));
      const file=path.join(out,'live-'+spell+(offline?'-offline':'')+'.png');await page.screenshot({path:file});captures.push(file);
      await page.waitForFunction(spell=>!__KONG__.snapshot().state.dangers.some(d=>Kong.enemySpell(d)===spell),spell);
      const hp=await page.evaluate(()=>__KONG__.snapshot().state.player.hp);check(spell+' remains safe through the whole active window',()=>assert.equal(hp,100));
    }
    check('rendered skill scenes have no browser exceptions',()=>assert.equal(errors.length,0));
    fs.writeFileSync(path.join(out,offline?'offline-browser.json':'browser.json'),JSON.stringify({errors,captures,checks},null,2)+'\n');
  }finally{await browser?.close();await server?.close();}
}
(async()=>{try{if(process.argv.includes('--browser'))await browserChecks();}catch(error){checks.push({name:'browser',pass:false,error:error.stack});}finally{const pass=checks.every(c=>c.pass);fs.writeFileSync(path.join(out,'rules.json'),JSON.stringify({pass,checks},null,2)+'\n');console.log(JSON.stringify({pass,checks:checks.length,failures:checks.filter(c=>!c.pass)}));if(!pass)process.exitCode=1;}})();
