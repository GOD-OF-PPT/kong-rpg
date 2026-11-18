// Full asset inventory plus state/pose acceptance. Render catalogues are
// controlled fixtures, separately labelled from actual input-driven actions.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),os=require('node:os'),cp=require('node:child_process');
const recordPage=require('./record-page.cjs'),root=path.resolve(__dirname,'..'),kind=process.argv[2]||'http',out=path.join(root,'evidence/art-audit-v7',kind),entry=path.resolve(process.env.GAME_ENTRY||'release/index.html'),base='f041955f42d65aff38e2485c259c744e5c760909';
const c=vm.createContext({console});for(const n of ['content','world','progression','journey','heroes','signature','simulation','challenge','storage'])vm.runInContext(fs.readFileSync(path.join(root,'src',n+'.js'),'utf8'),c);const K=c.Kong;
const report={version:K.VERSION,base,kind,sha256:crypto.createHash('sha256').update(fs.readFileSync(entry)).digest('hex'),environment:{os:os.release(),node:process.version,viewport:'1366x768'},checks:[],errors:[],network:[],inputs:[],captures:[],scenes:[]};fs.mkdirSync(out,{recursive:true});
const check=(name,pass,data={})=>{report.checks.push({name,pass:!!pass,...data});assert.ok(pass,name);};
function fixture(hero){const s=K.newRun('FULL-ART-1027','staff',hero,'challenge');s.room.enemies.forEach(e=>e.hp=0);s.player.x=550;s.player.y=396;s.player.grounded=true;s.player.invuln=0;s.player.focus=100;s.player.rage=100;s.talisman={id:'ward',charges:2};return s;}
async function renderOnly(page,name){
  return page.evaluate(name=>{
    cancelAnimationFrame(window.__fullArtRAF);const s=Kong.newRun('FULL-ART-1027','staff',name.startsWith('wukong')?'wukong':'nezha','challenge');const r=new Kong.Renderer(document.getElementById('world'));s.room.enemies.forEach(e=>e.hp=0);Object.assign(s.player,{x:550,y:396,grounded:true,invuln:0});
    if(name.includes('dead'))s.player.hp=0;
    if(name.includes('ultimate')){s.player.ultimate=name.endsWith('start')?.8:.4;Kong.effect(s,'ultimate-aura',s.player.x+12,s.player.y+44);}
    if(name.includes('ward'))s.player.ward=1;
    if(name.includes('charge'))s.arm={phase:'charge',charge:.4,face:1};
    if(name.includes('flight')){s.flight={age:.3};s.player.grounded=false;s.player.y=300;}
    if(name.includes('slam')){s.player.slam=true;s.player.grounded=false;s.player.y=310;s.player.vy=400;}
    if(name.startsWith('guardian')){Kong.enterRoom(s,Number(name.split('-')[1]),true);s.room.enemies.forEach(e=>e.hp=0);const e=Kong.guardian(s);Object.assign(e,{hp:e.maxHp,dormant:false,phase:'challenge-quake-windup',timer:.5});s.player.x=e.x-140;}
    if(name.startsWith('world')){const [_,stage,state]=name.split('-');Kong.enterRoom(s,Number(stage),true);s.room.enemies.forEach(e=>e.hp=0);s.room.node.state=state;s.player.x=s.room.node.x-80;}
    if(name.startsWith('map')){Kong.enterRoom(s,Number(name.split('-')[1]),true);s.room.enemies.forEach(e=>e.hp=0);s.player.x=s.room.camp.x-100;s.room.seals.forEach(q=>q.hp=0);}
    r.camera=Kong.clamp(s.player.x-300,0,s.room.width-960);r.clock=1.2;document.getElementById('overlay').hidden=true;document.getElementById('hud').hidden=true;document.getElementById('toast').hidden=true;
    const draw=()=>{r.draw(s,'playing',0);window.__fullArtRAF=requestAnimationFrame(draw);};draw();return{method:'render-only fixed state',name,hero:s.hero,stage:s.stage,seed:s.seed,camera:r.camera,clock:r.clock};
  },name);
}
(async()=>{
  if(kind==='file')await new Promise((resolve,reject)=>{const s=require('node:net').createConnection({host:'127.0.0.1',port:5188});s.once('connect',()=>{s.destroy();reject(Error('Preview must be stopped for offline acceptance'));});s.once('error',resolve);});
  const b=await chromium.launch({channel:'msedge',headless:true});report.environment.browser=b.version();const context=await b.newContext({viewport:{width:1366,height:768}});if(kind==='file'){await context.setOffline(true);await context.route(/^https?:/,r=>r.abort());}
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))report.network.push(r.url());});const snap=()=>p.evaluate(()=>__KONG__.snapshot()),wait=ms=>p.waitForTimeout(ms);let serial=0,recording;
  async function capture(name,world=false){await(world?p.locator('#world'):p).screenshot({path:path.join(out,name+'.png')});report.captures.push(name+'.png');}
  async function press(key){report.inputs.push({key,at:Date.now(),screen:(await snap()).screen});await p.keyboard.press(key);}
  async function load(s){if((await snap()).screen==='playing')await press('Escape');s.runId='FULL-ART-'+(++serial);const raw=K.pack(s,{});K.validSave(JSON.parse(raw));fs.writeFileSync(path.join(out,'fixture-'+serial+'.json'),raw);await p.locator('#import-file').setInputFiles({name:'art.json',mimeType:'application/json',buffer:Buffer.from(raw)});await p.waitForFunction(id=>__KONG__.snapshot().screen==='paused'&&__KONG__.snapshot().state.runId===id,s.runId);await p.getByRole('button',{name:'继续前行',exact:true}).click();}
  async function wardPixels(){return p.evaluate(()=>{const s=__KONG__.snapshot().state,c=document.createElement('canvas');c.width=960;c.height=540;const r=new Kong.Renderer(c);r.camera=Kong.clamp(s.player.x-300,0,s.room.width-960);r.clock=1.2;r.draw(s,'playing',0);const a=c.getContext('2d').getImageData(0,0,960,540).data;let count=0;for(let i=0;i<a.length;i+=4)if(a[i]===188&&a[i+1]===229&&a[i+2]===199)count++;return count;});}
  try{
    await p.goto(kind==='file'?'file:///'+entry.replace(/\\/g,'/'):'http://127.0.0.1:5188/release/index.html?full-art=7.1.2');await p.evaluate(()=>Promise.all([Kong.ImageArt.ready,Kong.DialogArtReady]));
    const inventory=await p.evaluate(()=>{
      const images=Kong.ImageArt.images,frames=[];
      for(const group of ['ArtFrames','MapFrames','SignatureFrames','SceneFrames','ActorStateFrames'])for(const [id,f]of Object.entries(Kong[group])){
        const im=images[f.image],[x,y,w,h]=f.r,c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);const cx=c.getContext('2d');cx.drawImage(im,x,y,w,h,0,0,c.width,c.height);const a=cx.getImageData(0,0,c.width,c.height).data;let visible=0;for(let i=3;i<a.length;i+=4)if(a[i]>32)visible++;
        frames.push({group,id,visible,inBounds:x>=0&&y>=0&&x+w<=im.width&&y+h<=im.height});
      }
      const r=new Kong.Renderer(document.createElement('canvas')),cache=[];const inspect=(id,im)=>{const a=im.getContext('2d').getImageData(0,0,im.width,im.height).data;let edge=0,visible=0;for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(a[(y*im.width+x)*4+3]>64){visible++;if(x===0||y===0||x===im.width-1||y===im.height-1)edge++;}cache.push({id,edge,visible});};
      for(const pose of ['idle','run','jump','fall','windup','attack','heavy','recover','hurt','dash'])inspect('wukong-'+pose,r.frame('monkey',pose,0,false,false));for(let i=0;i<9;i++)inspect('combo-'+i,r.comboFrame(i));for(const kind of ['blade','shield','caster','boss'])for(let i=0;i<2;i++)inspect(kind+'-'+i,r.frame(kind,'idle',i,false,false));
      const css=['--scroll-art','--folio-art','--icon-cloud','--icon-echo','--icon-staff','--icon-mirror','--icon-flame','--icon-mercy','--icon-rest','--icon-crest','--portrait-art','--lamp-art'].map(id=>({id,loaded:document.documentElement.style.getPropertyValue(id).includes('data:image/png')}));
      return{images:Object.keys(images),errors:Kong.ImageArt.errors,frames,cache,css};
    });fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify(inventory,null,2));
    check('all 26 local images decode without missing-asset fallback',inventory.images.length===26&&!inventory.errors.length);check('all 139 registered source/state frames are nonempty and in bounds',inventory.frames.length===139&&inventory.frames.every(f=>f.visible>10&&f.inBounds));check('compiled character and combo sprites do not clip their cache edges',inventory.cache.every(f=>f.visible>20&&f.edge===0),{cache:inventory.cache});check('every DOM art variable is backed by embedded pixels',inventory.css.every(f=>f.loaded),{css:inventory.css});
    await capture('title');await p.getByRole('button',{name:'踏上劫途'}).click();await p.getByRole('button',{name:'选择应劫者',exact:true}).click();await capture('heroes');await press('Digit2');await press('Digit1');await p.waitForFunction(()=>__KONG__.snapshot().screen==='playing');await press('Escape');
    recording=recordPage(p,path.join(out,'state-actions.mp4'));
    for(const hero of ['wukong','nezha']){
      await load(fixture(hero));await press('KeyQ');await p.waitForFunction(()=>__KONG__.snapshot().state.player.ward>1);check(hero+' real Q activates a visible protection ring',await wardPixels()>=90);await capture(hero+'-ward-idle');
      await p.keyboard.down('KeyU');await wait(180);check(hero+' protection remains drawn through its signature pose',await wardPixels()>=90);await capture(hero+'-ward-signature');await p.keyboard.up('KeyU');
      const s=fixture(hero),e=s.room.enemies.find(e=>e.kind==='blade');Object.assign(e,{hp:e.maxHp,phase:'attack',timer:.2,face:1,struck:false});s.player.x=e.x+e.w+10;s.player.hp=1;await load(s);await p.waitForFunction(()=>__KONG__.snapshot().screen==='dead');check(hero+' actual lethal attack reaches death state',(await snap()).state.player.hp===0);await capture(hero+'-death-result');
    }
    await load(fixture('nezha'));await press('KeyR');await p.waitForFunction(()=>__KONG__.snapshot().state.player.ultimate>0);const used=(await snap()).state.stats.ultimates;await capture('nezha-ultimate-action');await p.waitForFunction(()=>__KONG__.snapshot().state.player.ultimate===0);check('Nezha real R completes with the existing timing and one resource spend',used===1&&(await snap()).state.player.rage===0);await press('Escape');
    const elapsed=(await snap()).state.elapsed;await press('KeyJ');check('DOM pause keeps battle input fenced',(await snap()).state.elapsed===elapsed);
    const downloadEvent=p.waitForEvent('download');await p.getByRole('button',{name:'导出存档',exact:true}).click();const dl=await downloadEvent;await dl.saveAs(path.join(out,'save.json'));await p.reload();await p.locator('#import-file').setInputFiles(path.join(out,'save.json'));await p.waitForFunction(()=>__KONG__.snapshot().screen==='paused');check('art changes preserve actual export/import',(await snap()).state.hero==='nezha'&&(await snap()).state.version===7);
    report.recording=await recording.stop();recording=null;
    const scenes=['wukong-dead','nezha-dead','nezha-ultimate-start','nezha-ultimate-release','wukong-ward-charge','nezha-ward-flight','nezha-slam','guardian-0','guardian-1','guardian-2','world-0-ready','world-0-done','world-1-ready','world-1-done','world-2-ready','world-2-done','map-0','map-1','map-2','map-3'];
    for(const name of scenes){report.scenes.push(await renderOnly(p,name));await wait(35);await capture('catalogue-'+name,true);}await p.evaluate(()=>cancelAnimationFrame(window.__fullArtRAF));
    if(kind==='http'){
      const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kong-full-art-base-')),file=path.join(temp,'index.html');fs.writeFileSync(file,cp.execFileSync('git',['show',base+':release/index.html'],{cwd:root,maxBuffer:80*1024*1024}));const q=await context.newPage();await q.goto('file:///'+file.replace(/\\/g,'/'));await q.evaluate(()=>Kong.ImageArt.ready);
      for(const name of scenes.slice(0,10)){await renderOnly(q,name);await q.waitForTimeout(35);const n='before-'+name+'.png';await q.locator('#world').screenshot({path:path.join(out,n)});report.captures.push(n);}await q.close();fs.unlinkSync(file);fs.rmdirSync(temp);
    }
    check('no page errors',!report.errors.length);if(kind==='file')check('fresh disconnected file context makes zero HTTP requests',!report.network.length);
  }catch(e){report.failure=e.stack;await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}
  finally{if(recording)await recording.stop().catch(()=>{});await context.close();await b.close();fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({kind,checks:report.checks.length,failure:report.failure,errors:report.errors},null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
