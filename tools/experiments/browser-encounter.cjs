const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process'),crypto=require('crypto'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'evidence/v2');
function fixture(ref,relic){const ctx=vm.createContext({console});for(const name of['content','simulation','storage'])vm.runInContext(ref==='before'?cp.execFileSync('git',['show','e5dc0b5:src/'+name+'.js'],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,'src',name+'.js'),'utf8'),ctx);const s=ctx.Kong.newRun('LOTUS-1025',relic);s.player.x=380;s.player.y=396;s.player.invuln=0;s.player.hp=100;s.player.grounded=true;s.runId='encounter';return ctx.Kong.pack(s,{runs:1});}
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true}),report=[];try{
for(const ref of['before','after'])for(const [policy,relic]of[['hold','cloud'],['read','cloud'],['read','echo']]){
 const name=[ref,policy,relic].join('-'),ctx=await b.newContext({viewport:{width:1280,height:900},recordVideo:{dir:path.join(out,'video'),size:{width:960,height:680}}});await ctx.setOffline(true);const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const entry=ref==='before'?path.join(out,'baseline.html'):path.join(root,'release/index.html');await p.goto('file:///'+entry.replace(/\\/g,'/'));await p.evaluate(()=>{window.__audioEvidence=[];const original=Kong.Audio.prototype.event;Kong.Audio.prototype.event=function(e){window.__audioEvidence.push({type:e.type,at:performance.now(),sim:e.t,wall:e.wall});return original.call(this,e);};});await p.locator('#import-file').setInputFiles({name:'fixed-encounter.json',mimeType:'application/json',buffer:Buffer.from(fixture(ref,relic))});await p.waitForTimeout(80);await p.getByRole('button',{name:'继续前行',exact:true}).click();
 const held=new Set(),actions=[],frames=[];let seen=null,jumpUntil=0,dashUntil=0,wall=0;const started=Date.now();const box=await p.locator('#world').boundingBox();
 while(Date.now()-started<6000){const v=await p.evaluate(()=>__KONG__.snapshot()),s=v.state,e=s.room.enemies[0],q=s.player;if(e.hp<=0||s.mode==='dead')break;const want=new Set(['KeyJ']);
 if(policy==='read'&&seen){const dx=e.x-q.x;if(seen.phase==='windup'&&q.grounded&&s.time>jumpUntil){if(relic==='echo'&&q.focus>=50&&!s.clone){want.add('KeyL');want.add('KeyK');dashUntil=s.time+.18;}else{want.add('Space');jumpUntil=s.time+.45;}}
 if(s.time<jumpUntil)want.add('Space');if(s.time<dashUntil||q.y<e.y-30&&dx>10)want.add('KeyD');if(q.grounded&&q.y<e.y-45){want.add('KeyS');want.add('Space');want.delete('KeyJ');}
 if(q.x>e.x+34)want.add('KeyA');else if(dx>65)want.add('KeyD');
 }
 seen={phase:e.phase};await p.mouse.move(box.x+Math.max(10,Math.min(950,e.x+13-v.camera))/960*box.width,box.y+box.height*.65);
 if(policy==='read'){if(want.has('KeyJ')){await p.mouse.down();}else await p.mouse.up();}
 for(const k of [...held])if(!want.has(k)){await p.keyboard.up(k);held.delete(k);}for(const k of want)if(!held.has(k)){await p.keyboard.down(k);held.add(k);}
 actions.push({at:Date.now()-started,keys:[...want]});frames.push({at:Date.now()-started,t:s.time,phase:e.phase,hp:q.hp,enemyHp:e.hp,x:q.x,y:q.y,focus:q.focus});
 if(wall++===2)await p.screenshot({path:path.join(out,name+'-warning.png')});await p.waitForTimeout(100);
 }
 for(const k of held)await p.keyboard.up(k);await p.mouse.up();const final=await p.evaluate(()=>__KONG__.snapshot().state),audio=await p.evaluate(()=>window.__audioEvidence);await p.screenshot({path:path.join(out,name+'-result.png')});const video=path.relative(root,await p.video().path()).replace(/\\/g,'/');await ctx.close();
 report.push({name,entryHash:crypto.createHash('sha256').update(fs.readFileSync(entry)).digest('hex'),fixture:'valid imported encounter, same seed x380 hp100 focus65; full canonical map',final:{won:final.room.enemies[0].hp===0,hp:final.player.hp,damage:final.damageTaken,focus:final.player.focus,time:final.time},actions,frames,events:final.log,audio,errors,video});console.log(name,JSON.stringify(report.at(-1).final));
}
}finally{await b.close();const raw=JSON.stringify(report,null,2);fs.writeFileSync(path.join(out,'encounter-browser-'+Date.now()+'.json'),raw);fs.writeFileSync(path.join(out,'encounter-browser.json'),raw);}})().catch(e=>{console.error(e);process.exitCode=1;});
