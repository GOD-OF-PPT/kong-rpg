// Targeted art acceptance. Controlled imports reproduce prop states; inputs
// perform the actual attack / reward / pickup transitions. Not a full run.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const recordPage=require('./record-page.cjs');
const root=path.resolve(__dirname,'..'),kind=process.argv[2]||'http',entry=path.resolve(process.env.GAME_ENTRY||'release/index.html'),out=path.resolve(process.env.SCENE_EVIDENCE_DIR||path.join(root,'evidence/scene-v7',kind)),base='e6bc8515fc89ba266e7aeec40102aaea44cec613';
fs.mkdirSync(out,{recursive:true});
const sandbox=vm.createContext({console});for(const n of ['content','world','progression','journey','heroes','signature','simulation','challenge','storage'])vm.runInContext(fs.readFileSync(path.join(root,'src',n+'.js'),'utf8'),sandbox);const K=sandbox.Kong;
const report={version:K.VERSION,base,kind,entry,sha256:crypto.createHash('sha256').update(fs.readFileSync(entry)).digest('hex'),method:'controlled save imports, real DOM/keyboard/mouse actions, render-only state catalogue, matched before/after captures',environment:{os:os.release(),node:process.version},checks:[],errors:[],requests:[],captures:[],inputs:[]};
function check(name,pass,data={}){report.checks.push({name,pass:!!pass,...data});assert.ok(pass,name);}
function scene(stage=0,hero='wukong',difficulty='normal'){
  const s=K.newRun('SCENE-ART-1027','staff',hero,difficulty);K.enterRoom(s,stage,true);
  s.room.enemies.forEach(e=>e.hp=0);Object.assign(s.player,{x:s.room.seals[0].x-48,y:396,grounded:true,face:1,invuln:0,hp:70,focus:60});
  s.runId='SCENE-'+stage+'-'+hero+'-'+difficulty;return s;
}
(async()=>{
  if(kind==='file')await new Promise((resolve,reject)=>{const s=require('node:net').createConnection({host:'127.0.0.1',port:5188});s.once('connect',()=>{s.destroy();reject(Error('Stop LAN preview before offline acceptance'));});s.once('error',resolve);});
  const browser=await chromium.launch({channel:'msedge',headless:true});report.environment.browser=browser.version();
  const context=await browser.newContext({viewport:{width:1366,height:768}});if(kind==='file'){await context.setOffline(true);await context.route(/^https?:/,r=>r.abort());}
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))report.requests.push(r.url());});
  const snap=()=>p.evaluate(()=>__KONG__.snapshot()),wait=ms=>p.waitForTimeout(ms);
  let serial=0,recording=null;
  async function capture(name,canvas=false){const file=name+'.png';await(canvas?p.locator('#world'):p).screenshot({path:path.join(out,file)});report.captures.push(file);}
  async function press(key){report.inputs.push({key,at:Date.now(),screen:(await snap()).screen});await p.keyboard.press(key);}
  async function load(s){if((await snap()).screen==='playing')await press('Escape');s.runId='SCENE-IMPORT-'+(++serial);const raw=K.pack(s,{});K.validSave(JSON.parse(raw));fs.writeFileSync(path.join(out,'fixture-'+serial+'.json'),raw);await p.locator('#import-file').setInputFiles({name:'scene.json',mimeType:'application/json',buffer:Buffer.from(raw)});await p.waitForFunction(id=>__KONG__.snapshot().screen==='paused'&&__KONG__.snapshot().state.runId===id,s.runId);await p.getByRole('button',{name:'继续前行',exact:true}).click();await wait(80);}
  try{
    await p.goto(kind==='file'?'file:///'+entry.replace(/\\/g,'/'):'http://127.0.0.1:5188/release/index.html?art=7.1.1');await p.evaluate(()=>Kong.ImageArt.ready);
    const assets=await p.evaluate(()=>{
      const images=Kong.ImageArt.images,frames=[];
      for(const group of ['MapFrames','SignatureFrames','SceneFrames'])for(const [id,f]of Object.entries(Kong[group])){
        const im=images[f.image],[x,y,w,h]=f.r,c=document.createElement('canvas');c.width=w;c.height=h;const cx=c.getContext('2d');cx.drawImage(im,x,y,w,h,0,0,w,h);const data=cx.getImageData(0,0,w,h).data;let visible=0,minY=h,maxY=-1,colors=new Set();
        for(let i=3;i<data.length;i+=4)if(data[i]>32){visible++;const at=(i-3)/4;minY=Math.min(minY,Math.floor(at/w));maxY=Math.max(maxY,Math.floor(at/w));colors.add(data[i-3]+','+data[i-2]+','+data[i-1]);}
        frames.push({group,id,visible,minY,maxY,colors:colors.size});
      }return{images:Object.keys(images),errors:Kong.ImageArt.errors,frames};
    });fs.writeFileSync(path.join(out,'asset-inventory.json'),JSON.stringify(assets,null,2));
    const expectedImages=Object.keys(JSON.parse(fs.readFileSync(path.join(root,'assets/signature-v7/pack-manifest.json'),'utf8')).assets).length;
    check('all '+expectedImages+' embedded PNGs decode',assets.images.length===expectedImages&&!assets.errors.length,assets);
    check('all 50 scene / map / signature frames contain visible pixels',assets.frames.length===50&&assets.frames.every(f=>f.visible>10));
    const seals=assets.frames.filter(f=>f.group==='SceneFrames');check('four seal states have detail and one shared ground anchor',seals.length===4&&seals.every(f=>f.colors>30&&f.maxY===61),{seals});
    // First-use menus and pointer input stay on the normal public controls.
    await p.getByRole('button',{name:'踏上劫途'}).click();await p.getByRole('button',{name:'选择应劫者',exact:true}).click();await press('Digit1');await press('Digit1');await p.waitForFunction(()=>__KONG__.snapshot().screen==='playing');await press('Escape');
    let s=scene();s.room.seals[0].hp=1;await load(s);if(process.env.RECORD_ART==='1')recording=recordPage(p,path.join(out,'seal-transition.mp4'));await capture('intact-in-game');
    const attacks=(await snap()).state.player.attackId;await p.locator('#world').click({position:{x:500,y:300}});report.inputs.push({mouse:'left',purpose:'strike the seal'});await p.waitForFunction(()=>__KONG__.snapshot().state.room.seals[0].hp===0);
    check('actual mouse attack destroys the seal',(await snap()).state.player.attackId>attacks);await wait(320);await capture('lamp-ready-in-game');
    check('destroyed first travelling seal shows an available lamp',await p.evaluate(()=>Kong.sealVisualState(__KONG__.snapshot().state,__KONG__.snapshot().state.room.seals[0]))==='seal-lamp-ready');
    await press('KeyF');await p.waitForFunction(()=>__KONG__.snapshot().screen==='reward');const frozen=(await snap()).state.elapsed,attackId=(await snap()).state.player.attackId;await press('KeyJ');await wait(100);check('reward DOM gates combat inputs',(await snap()).state.elapsed===frozen&&(await snap()).state.player.attackId===attackId);
    await p.locator('[data-relic="rest"]').click();await p.waitForFunction(()=>__KONG__.snapshot().screen==='playing'&&__KONG__.snapshot().state.room.midClaimed);await wait(150);await capture('lamp-spent-in-game');
    check('claiming the reward extinguishes rather than removes the bowl',await p.evaluate(()=>Kong.sealVisualState(__KONG__.snapshot().state,__KONG__.snapshot().state.room.seals[0]))==='seal-lamp-spent');
    if(recording){await wait(450);report.recording=await recording.stop();recording=null;}
    await press('KeyF');await wait(80);check('spent lamp does not give a second reward',(await snap()).screen==='playing');
    await press('Escape');const downloadPromise=p.waitForEvent('download');await p.getByRole('button',{name:'导出存档',exact:true}).click();const dl=await downloadPromise;await dl.saveAs(path.join(out,'spent-save.json'));await p.reload();await p.evaluate(()=>Kong.ImageArt.ready);check('auto-save restores the spent state',(await snap()).state.room.midClaimed);
    await p.locator('#import-file').setInputFiles(path.join(out,'spent-save.json'));await p.waitForFunction(()=>__KONG__.snapshot().screen==='paused');check('export/import preserves schema 7 and spent appearance',await p.evaluate(()=>{const s=__KONG__.snapshot().state;return s.version===7&&Kong.sealVisualState(s,s.room.seals[0])==='seal-lamp-spent';}));
    for(const stage of [1,2]){s=scene(stage,'nezha','challenge');s.room.seals[0].hp=0;s.broken=1;await load(s);await press('KeyF');await p.waitForFunction(()=>__KONG__.snapshot().screen==='reward');await p.locator('[data-relic="rest"]').click();check('elevated stage '+stage+' reward still works for Nezha challenge',(await snap()).state.room.midClaimed);}
    s=scene(3,'nezha','challenge');s.room.seals[0].hp=1;await load(s);await press('KeyJ');await p.waitForFunction(()=>__KONG__.snapshot().state.room.seals[0].hp===0);await wait(300);await capture('final-seal-ruined');await press('KeyF');await wait(80);
    check('final first seal is rubble and never offers midpoint reward',await p.evaluate(()=>{const {state:s,screen}=__KONG__.snapshot();return screen==='playing'&&Kong.sealVisualState(s,s.room.seals[0])==='seal-ruined';}));
    s=scene();s.room.seals[1].hp=0;s.broken=1;s.player.x=s.room.seals[1].x-48;await load(s);await capture('second-seal-ruined');check('ordinary second seal uses a textured ruined state',await p.evaluate(()=>{const s=__KONG__.snapshot().state;return Kong.sealVisualState(s,s.room.seals[1])==='seal-ruined';}));
    s=scene();s.player.x=s.room.camp.x-25;await load(s);await capture('camp-lit');await press('KeyF');await wait(120);check('existing camp texture follows its one-use interaction',(await snap()).state.room.camp.used);await capture('camp-spent');
    s=scene();s.player.x=s.room.trial.x-20;s.player.y=s.room.trial.y;s.player.grounded=true;await load(s);await press('KeyF');await p.waitForFunction(()=>__KONG__.snapshot().state.room.trial.state==='active');check('existing trial active artwork is reachable by F',(await snap()).state.room.trial.state==='active');await capture('trial-active');
    for(const drop of ['heal','focus','rage']){
      s=scene();const item=s.room.pickups.find(i=>i.kind===drop&&i.sourceId!==undefined&&!s.room.trial.guards.includes(i.sourceId)),enemy=s.room.enemies.find(e=>e.id===item.sourceId);K.dropEnemy(s,enemy);const resource={heal:'hp',focus:'focus',rage:'rage'}[drop];s.player[resource]=70;s.player.x=item.x-44;s.player.y=item.y+item.h-44;await load(s);await p.keyboard.down('KeyD');await wait(250);await p.keyboard.up('KeyD');check('existing '+drop+' artwork remains collectible',(await snap()).state.player[resource]>70);
    }
    await press('Escape');const elapsed=(await snap()).state.elapsed;await press('KeyJ');await wait(80);check('pause still gates combat',(await snap()).state.elapsed===elapsed);
    // Catalogue is deliberately render-only; state transitions above use public imports/input.
    const catalogue=[['mountain',0],['ferry',1],['temple',2],['final',3]];
    for(const [name,stage]of catalogue){await p.evaluate(({stage})=>{const r=new Kong.Renderer(document.getElementById('world')),s=Kong.newRun('SCENE-ART-1027','staff','wukong','challenge');Kong.enterRoom(s,stage,true);s.player.x=s.room.seals[1].x-70;s.player.y=396;s.room.seals[1].hp=0;r.camera=Kong.clamp(s.player.x-300,0,s.room.width-960);r.clock=1.2;cancelAnimationFrame(window.__artRAF);const draw=()=>{r.draw(s,'playing',0);window.__artRAF=requestAnimationFrame(draw);};draw();document.getElementById('overlay').hidden=true;document.getElementById('hud').hidden=true;},{stage});await wait(80);await capture('catalogue-'+name,true);}
    if(kind==='http'){
      const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kong-art-before-')),file=path.join(temp,'index.html');fs.writeFileSync(file,execFileSync('git',['show',base+':release/index.html'],{cwd:root,maxBuffer:80*1024*1024}));
      for(const [label,target]of [['before',file],['after',entry]]){
        const tab=await context.newPage();await tab.goto('file:///'+target.replace(/\\/g,'/'));await tab.evaluate(()=>Kong.ImageArt.ready);
        for(const state of ['ruined','ready','spent']){await tab.evaluate(({state})=>{const r=new Kong.Renderer(document.getElementById('world')),s=Kong.newRun('SCENE-ART-1027','staff');s.room.enemies.forEach(e=>e.hp=0);const q=s.room.seals[state==='ruined'?1:0];q.hp=0;s.room.midClaimed=state==='spent';s.player.x=q.x-80;s.player.y=q.y+q.h-44;r.camera=Kong.clamp(q.x-450,0,s.room.width-960);r.clock=1.2;document.getElementById('overlay').hidden=true;document.getElementById('hud').hidden=true;const draw=()=>{r.draw(s,'playing',0);window.__compareRAF=requestAnimationFrame(draw);};draw();},{state});await tab.waitForTimeout(80);const name=label+'-'+state+'.png';await tab.locator('#world').screenshot({path:path.join(out,name)});report.captures.push(name);await tab.evaluate(()=>cancelAnimationFrame(window.__compareRAF));}await tab.close();
      }fs.unlinkSync(file);fs.rmdirSync(temp);
    }
    check('no JavaScript or embedded image errors',!report.errors.length);if(kind==='file')check('fresh offline file session makes zero HTTP requests',!report.requests.length);
  }catch(e){report.failure=e.stack;await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}
  finally{if(recording)await recording.stop().catch(()=>{});await context.close();await browser.close();fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({kind,checks:report.checks.length,failure:report.failure,errors:report.errors},null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
