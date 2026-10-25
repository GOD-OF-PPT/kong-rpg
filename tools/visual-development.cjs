const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'evidence/complete-v2'),sandbox=vm.createContext({console});
for(const file of ['content','simulation','storage'])vm.runInContext(fs.readFileSync(path.join(root,'src',file+'.js'),'utf8'),sandbox);
const K=sandbox.Kong,report={sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'release/index.html'))).digest('hex'),checks:[],errors:[],network:[]};
function check(name,pass,data={}){report.checks.push({name,pass,...data});assert.ok(pass,name);}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:path.join(out,'video'),size:{width:960,height:680}}});await context.setOffline(true);const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))report.network.push(r.url());});await p.goto('file:///'+path.join(root,'release/index.html').replace(/\\/g,'/'));await p.evaluate(()=>Kong.ImageArt.ready);
  const assets=await p.evaluate(()=>({loaded:Object.keys(Kong.ImageArt.images),errors:Kong.ImageArt.errors}));check('eight embedded image assets decode',assets.loaded.length===8&&!assets.errors.length,assets);
  // Exact game-sized animation cells; these are rendered by the real sprite cache.
  const sheet=await p.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=720;canvas.height=110;const c=canvas.getContext('2d');c.fillStyle='#132630';c.fillRect(0,0,720,110);const r=new Kong.Renderer(document.createElement('canvas'));for(let i=0;i<6;i++){c.drawImage(r.frame('monkey','run',i,false,false),i*120-36,-35);c.fillStyle='#bda678';c.fillRect(i*120,89,120,1);}return canvas.toDataURL().split(',')[1];});fs.writeFileSync(path.join(out,'run-actual-scale.png'),Buffer.from(sheet,'base64'));
  async function scenario(name,stage,adjust){const s=K.newRun('LOTUS-1025','cloud');K.enterRoom(s,stage,true);adjust(s);await p.locator('#import-file').setInputFiles({name:name+'.json',mimeType:'application/json',buffer:Buffer.from(K.pack(s,{}))});await p.getByRole('button',{name:'继续前行',exact:true}).click();await p.waitForTimeout(90);await p.screenshot({path:path.join(out,name+'.png')});await p.keyboard.press('Escape');}
  await scenario('warning-blade',0,s=>{s.player.x=380;s.player.y=396;s.room.enemies[0].phase='windup';s.room.enemies[0].timer=.42;});
  await scenario('warning-seal',0,s=>{s.player.x=1380;s.player.y=396;s.room.seals[0].pulse=.45;s.room.seals[0].warning=true;});
  await scenario('lamp',1,s=>{s.player.x=s.room.seals[0].x-40;s.player.y=296;s.room.seals[0].hp=0;});
  await scenario('gate',2,s=>{s.player.x=4940;s.player.y=396;s.room.seals.forEach(q=>q.hp=0);});
  await scenario('warning-boss',3,s=>{s.player.x=560;s.player.y=396;const e=s.room.enemies[0];e.phase='sweep-windup';e.timer=.45;});
  await scenario('warning-shift',3,s=>{s.player.x=430;s.player.y=396;const e=s.room.enemies[0];e.phase='shift-windup';e.timer=.45;e.shiftTo=260;});
  await p.getByRole('button',{name:'继续前行',exact:true}).click();await p.keyboard.press('Tab');check('Tab enters paused DOM focus before navigation',(await p.evaluate(()=>__KONG__.snapshot().screen))==='paused');
  const frozen=await p.evaluate(()=>__KONG__.snapshot().state.time);await p.keyboard.press('KeyJ');await p.keyboard.press('KeyL');await p.waitForTimeout(100);check('focused DOM never receives combat actions',(await p.evaluate(()=>__KONG__.snapshot().state.time))===frozen);
  await p.getByRole('button',{name:'继续前行',exact:true}).click();await p.evaluate(()=>window.dispatchEvent(new Event('blur')));check('window focus loss pauses the world',(await p.evaluate(()=>__KONG__.snapshot().screen))==='paused');
  check('offline visual scenes have zero remote requests',!report.network.length);check('no visual exceptions',!report.errors.length);report.video=path.relative(root,await p.video().path()).replace(/\\/g,'/');await context.close();
}finally{await browser.close();fs.writeFileSync(path.join(out,'visual.json'),JSON.stringify(report,null,2));}console.log(JSON.stringify(report,null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
