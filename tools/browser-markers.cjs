// Controlled art acceptance, not a human readability or full-run playtest.
const {chromium}=require('playwright'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),kind=process.argv[2]||'http',baseline=process.argv.includes('--baseline');
const out=path.join(root,'evidence/enemy-markers',baseline?'before':kind),entry=path.resolve(process.env.GAME_ENTRY||'release/index.html');
const c=vm.createContext({console});for(const n of ['content','world','progression','journey','heroes','signature','simulation','challenge','realms','warriors','storage'])vm.runInContext(fs.readFileSync(path.join(root,'src',n+'.js'),'utf8'),c);const K=c.Kong;
fs.mkdirSync(out,{recursive:true});
const report={kind,baseline,version:K.VERSION,sha256:crypto.createHash('sha256').update(fs.readFileSync(entry)).digest('hex'),seed:'MARKERS-1027',method:'canonical schema8 scene imports; real DOM, keyboard and mouse; DOM canvas capture at display scale plus raw native 960x540 export; controlled art states, not natural full playthrough',checks:[],scenes:[],errors:[],network:[]};
const check=(name,pass,data)=>{report.checks.push({name,pass:!!pass,data});assert.ok(pass,name);};
function fixture(type){
  const s=K.newRun(report.seed,'staff','wukong',['challenge','empowered'].includes(type)?'challenge':'normal');K.enterRoom(s,['plain','empowered'].includes(type)?0:['guardian','realm'].includes(type)?2:3,true);s.room.enemies.forEach(e=>e.hp=0);Object.assign(s.player,{x:500,y:396,grounded:true,invuln:3,focus:100,rage:100});
  let es=type==='boss'?[s.room.enemies.find(e=>e.kind==='boss')]:type==='guardian'?[s.room.enemies.find(e=>e.kind==='warden')]:type==='realm'?[]:['plain','empowered'].includes(type)?['blade','shield','caster'].map(kind=>s.room.enemies.find(e=>e.kind===kind&&!e.trait)):[600,601,602].map(id=>s.room.enemies.find(e=>e.id===id));
  for(const [i,e]of es.entries()){
    Object.assign(e,{x:710+i*135,y:400,hp:e.maxHp-(type==='hurt'?6:0),dormant:false,phase:['traits','hurt'].includes(type)?'recover':'windup',timer:6,face:-1,stun:0,flash:0,aimX:500,aimY:416});
    if(type==='chain'&&i===0)e.phase='chain-windup';
    if(type==='guardian'){e.phase='warden-windup';e.move='bell';}
    if(['guardian','boss'].includes(type)){e.x=s.room.arena.min+400;e.y=440-e.h;s.player.x=s.room.arena.min+140;}
    if(type==='boss'){s.room.seals.forEach(q=>q.hp=0);s.broken=8;e.phase='sweep-windup';}
  }
  if(type==='realm'){
    es.forEach(e=>e.hp=0);const e=s.room.enemies.find(e=>e.realm&&e.kind==='caster');Object.assign(e,{x:780,y:327,hp:e.maxHp,phase:'realm-echo',timer:6,marks:[{x:500,y:396,w:96,h:44}]});
  }
  return s;
}
(async()=>{
  if(kind==='file')await new Promise((resolve,reject)=>{const sock=require('node:net').createConnection({host:'127.0.0.1',port:5188});sock.once('connect',()=>{sock.destroy();reject(Error('Preview still running'));});sock.once('error',resolve);});
  const browser=await chromium.launch({channel:'msedge',headless:true}),ctx=await browser.newContext({viewport:{width:1366,height:768}});report.browser=browser.version();if(kind==='file'){await ctx.setOffline(true);await ctx.route(/^https?:/,r=>r.abort());}
  const p=await ctx.newPage(),snap=()=>p.evaluate(()=>__KONG__.snapshot());p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))report.network.push(r.url());});let serial=0,rec;
  async function load(s){if((await snap()).screen==='playing')await p.keyboard.press('Escape');s.runId='MARKERS-'+(++serial);const raw=K.pack(s,{});K.validSave(JSON.parse(raw));fs.writeFileSync(path.join(out,'scene-'+serial+'.json'),raw);await p.locator('#import-file').setInputFiles({name:'scene.json',mimeType:'application/json',buffer:Buffer.from(raw)});await p.waitForFunction(id=>__KONG__.snapshot().state.runId===id,s.runId);await p.getByRole('button',{name:'继续前行',exact:true}).click();await p.waitForTimeout(200);}
  try{
    await p.goto(kind==='file'?'file:///'+entry.replace(/\\/g,'/'):'http://127.0.0.1:5188/release/index.html?markers='+Date.now());await p.evaluate(()=>Promise.all([Kong.ImageArt.ready,Kong.DialogArtReady]));
    check('embedded artwork decodes',await p.evaluate(()=>Kong.ImageArt.errors.length===0));
    if(!baseline){
      const pixels=await p.evaluate(()=>Object.entries(Kong.EnemyMarkerFrames).map(([id,f])=>{const c=document.createElement('canvas');c.width=24;c.height=24;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(Kong.ImageArt.images[f.image],...f.r,0,0,24,24);const a=g.getImageData(0,0,24,24).data;let solid=0;for(let i=3;i<a.length;i+=4)if(a[i]>100)solid++;return{id,solid};}));check('all six ImageGen glyphs survive actual small-size sampling',pixels.length===6&&pixels.every(q=>q.solid>12),pixels);
    }
    if(!baseline)rec=require('./record-page.cjs')(p,path.join(out,'marker-states.mp4'));
    for(const name of ['traits','windup','hurt','chain','challenge','plain','empowered','guardian','boss','realm']){
      await load(fixture(name));const shot=await snap();check(name+' imports and runs',shot.screen==='playing');check(name+' has visible living enemies',shot.state.room.enemies.some(e=>e.hp>0&&!e.dormant&&e.x+e.w>=shot.camera&&e.x<shot.camera+960));
      await p.locator('#world').screenshot({path:path.join(out,name+'.png')});const native=await p.locator('#world').evaluate(c=>c.toDataURL('image/png'));fs.writeFileSync(path.join(out,name+'.native.png'),Buffer.from(native.split(',')[1],'base64'));report.scenes.push({name,state:shot.state.room.enemies.filter(e=>e.hp>0).map(e=>({id:e.id,kind:e.kind,trait:e.trait,phase:e.phase,x:e.x,y:e.y})),elapsed:shot.state.time});
    }
    if(!baseline){
      // Render the actual renderer at controlled edges/crowding, inspect layout against pixels.
      const crowded=await p.evaluate(()=>{
        const s=__KONG__.snapshot().state,canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const r=new Kong.Renderer(canvas);r.camera=0;
        const first=s.room.enemies.find(e=>e.hp>0);const foes=[{...first,id:1,x:290,y:62},{...first,id:2,x:309,y:64},{...first,id:3,x:12,y:400},{...first,id:4,x:937,y:400}];
        s.room.enemies=foes;r.scene=s;r.ui='playing';const items=r.enemyMarkerLayout(s);r.draw(s,'playing',0);return {png:canvas.toDataURL('image/png'),items:items.map(q=>({id:q.enemy.id,x:q.x,y:q.y,size:q.size,warning:q.warning}))};
      });fs.writeFileSync(path.join(out,'crowding.native.png'),Buffer.from(crowded.png.split(',')[1],'base64'));const layout=crowded.items;check('edge and low-ceiling badges remain inside canvas',layout.length===4&&layout.every(q=>q.x-q.size/2>=2&&q.x+q.size/2<=958&&q.y-q.size/2>=2),layout);
      for(let i=0;i<layout.length;i++)for(let j=0;j<i;j++)check('nearby badges do not overpaint each other '+i+':'+j,Math.abs(layout[i].x-layout[j].x)>=(layout[i].size+layout[j].size)/2+2||Math.abs(layout[i].y-layout[j].y)>=(layout[i].size+layout[j].size)/2+2);
      await load(fixture('windup'));await p.keyboard.press('KeyJ');await p.waitForTimeout(80);check('keyboard attack still operates',(await snap()).state.stats.swings>0);await p.keyboard.press('Escape');const before=await snap();await p.keyboard.press('KeyJ');await p.locator('#overlay h2').click();await p.waitForTimeout(100);check('DOM pause blocks combat input',(await snap()).state.stats.swings===before.state.stats.swings&&(await snap()).state.time===before.state.time);
      const downloaded=p.waitForEvent('download');await p.getByRole('button',{name:'导出存档',exact:true}).click();const dl=await downloaded;const save=path.join(out,'export.json');await dl.saveAs(save);await p.locator('#import-file').setInputFiles(save);await p.waitForFunction(()=>__KONG__.snapshot().screen==='paused');check('actual exported warning state restores',(await snap()).state.room.enemies.filter(e=>e.hp>0).every(e=>e.phase==='windup'));await p.getByRole('button',{name:'继续前行',exact:true}).click();
      await p.waitForTimeout(400);await p.locator('#world').click({position:{x:450,y:340},delay:40});await p.waitForTimeout(120);check('mouse attack still operates',(await snap()).state.stats.swings>before.state.stats.swings);
      check('no runtime errors',!report.errors.length&&(await p.evaluate(()=>__KONG__.metrics().errors.length))===0);if(kind==='file')check('new disconnected file session makes zero HTTP requests',report.network.length===0);
    }
  }catch(e){report.failure=e.stack;await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}finally{if(rec)report.recording=await rec.stop();await ctx.close();await browser.close();fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({kind,baseline,checks:report.checks.length,failure:report.failure,errors:report.errors}));}
})().catch(e=>{console.error(e);process.exitCode=1;});
