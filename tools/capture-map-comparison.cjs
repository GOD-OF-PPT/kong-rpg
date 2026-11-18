// Matched render-only art comparison: same seed, camera, clock and pose.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'evidence/map-v6'),base='59b91e0b1fa2754067b800dbba83f4111514703b',temp=fs.mkdtempSync(path.join(os.tmpdir(),'kong-map-baseline-'));
const old=execFileSync('git',['show',base+':release/index.html'],{cwd:root,maxBuffer:80*1024*1024});fs.writeFileSync(path.join(temp,'index.html'),old);
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),report={base,seed:'MAP-ART-1026',clock:1.2,viewport:'1440x1000',kind:'render-only matched Canvas screenshots; not a playthrough',beforeSha256:crypto.createHash('sha256').update(old).digest('hex'),afterSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'release/index.html'))).digest('hex'),captures:[]};
  try{for(const [version,entry]of [['before',path.join(temp,'index.html')],['after',path.join(root,'release/index.html')]]){
    const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.setOffline(true);const page=await context.newPage();await page.goto('file:///'+entry.replace(/\\/g,'/'));await page.evaluate(()=>Kong.ImageArt.ready);
    for(const [name,stage,x]of [['trial',0,3780],['camp',1,4420],['fragile',2,3290],['raft',1,2500]]){
      await page.evaluate(({stage,x})=>{const r=new Kong.Renderer(document.getElementById('world')),s=Kong.newRun('MAP-ART-1026','cloud');Kong.enterRoom(s,stage,true);Object.assign(s.player,{x,y:396,grounded:true,invuln:0});r.camera=Kong.clamp(x-300,0,s.room.width-960);r.clock=1.2;cancelAnimationFrame(window.__comparisonRAF);const draw=()=>{r.draw(s,'playing',0);window.__comparisonRAF=requestAnimationFrame(draw);};draw();document.getElementById('overlay').hidden=true;document.getElementById('hud').hidden=true;},{stage,x});await page.waitForTimeout(80);const file=version+'-'+name+'.png';await page.locator('#world').screenshot({path:path.join(out,file)});report.captures.push({version,name,stage,x,file});
    }await context.close();
  }}finally{await browser.close();fs.writeFileSync(path.join(out,'comparison.json'),JSON.stringify(report,null,2));fs.unlinkSync(path.join(temp,'index.html'));fs.rmdirSync(temp);}
  console.log(JSON.stringify({before:report.beforeSha256,after:report.afterSha256,captures:report.captures.length},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
