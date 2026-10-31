const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),K=require('./combat-identity-runtime.cjs')();
const out=path.resolve('evidence/boss-health'),expected=[600,800,1000,1250,1500],checks=[],results=[];
const check=(name,fn)=>{try{fn();checks.push({name,pass:true});}catch(error){checks.push({name,pass:false,error:error.stack});}};
const license={normalClear:{difficulty:'normal',complete:true,levels:15,seconds:1000,hits:0,killed:110,total:110}};
for(const difficulty of ['normal','challenge'])for(const [chapter,stage]of [2,5,8,11,14].entries()){
  check(difficulty+' chapter '+(chapter+1)+': increased boss health survives save and real damage',()=>{
    const s=K.newRun('BOSS-HP-BALANCE','staff','wukong',difficulty,license);K.enterRoom(s,stage,true);s.campaign.completed=Array.from({length:stage},(_,i)=>i);const boss=K.guardian(s);
    assert.equal(boss.maxHp,expected[chapter]);assert.equal(boss.hp,boss.maxHp);boss.dormant=false;boss.phase='recover';boss.timer=1;
    const hits=Math.ceil(boss.maxHp/30);K.hitEnemy(s,boss,30,boss.x,true,'heavy');assert.equal(boss.hp,boss.maxHp-30,'damage is applied to the increased pool');
    const restored=K.validSave(JSON.parse(K.pack(s,license))).state;assert.equal(K.guardian(restored).hp,boss.hp);assert.equal(K.guardian(restored).maxHp,boss.maxHp);
    K.hitEnemy(s,boss,boss.maxHp+1,boss.x,true,'ultimate');assert.equal(boss.hp,0);const kills=s.kills;K.hitEnemy(s,boss,boss.maxHp+1,boss.x,true,'ultimate');assert.equal(s.kills,kills,'a larger boss still settles once');
    results.push({difficulty,name:K.GUARDIANS[stage].name,hp:expected[chapter],unarmoured30DamageHits:hits});
  });
}
check('old boss saves preserve remaining health proportion and keep dead bosses dead',()=>{
  const cases=JSON.parse(fs.readFileSync(path.join(out,'old-saves.json'),'utf8'));
  for(const {stage,oldMax,oldHP,raw}of cases){const restored=K.validSave(JSON.parse(raw)).state,boss=K.guardian(restored);assert.equal(boss.maxHp,expected[Math.floor(stage/3)]);assert.equal(boss.hp,Math.ceil(oldHP/oldMax*boss.maxHp));const again=K.validSave(JSON.parse(K.pack(restored,{}))).state;assert.equal(K.guardian(again).hp,boss.hp,'migration must not apply twice');}
});
check('old maximum cannot be forged to load excessive remaining health',()=>{
  const old=JSON.parse(JSON.parse(fs.readFileSync(path.join(out,'old-saves.json'),'utf8'))[0].raw);old.state.room.enemies.find(e=>e.chiefId).hp=301;assert.throws(()=>K.validSave(old));
});
async function browserChecks(){
  const {chromium}=require('playwright');let server,browser;
  try{
    server=await(await import('vite')).preview({preview:{host:'127.0.0.1',port:0,strictPort:true}});browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1366,height:850}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/');await page.evaluate(()=>Promise.all([Kong.ImageArt.bootReady,Kong.Brand.ready]));
    const cases=JSON.parse(fs.readFileSync(path.join(out,'old-saves.json'),'utf8')).filter(c=>c.oldHP===c.oldMax/2);
    for(const old of cases){
      const id=JSON.parse(old.raw).state.runId;await page.locator('#import-file').setInputFiles({name:'pre-balance-save.json',mimeType:'application/json',buffer:Buffer.from(old.raw)});await page.waitForFunction(id=>__KONG__.snapshot().state?.runId===id,id);await page.waitForFunction(()=>__KONG__.snapshot().screen==='paused');await page.locator('#continue').click();await page.waitForFunction(()=>__KONG__.snapshot().screen==='playing');
      const max=expected[Math.floor(old.stage/3)];await page.waitForFunction(max=>Number(document.getElementById('boss-meter').getAttribute('aria-valuemax'))===max,max);
      const value=await page.locator('#boss-health').textContent();check('chapter '+(Math.floor(old.stage/3)+1)+': public old-save import shows upgraded half health',()=>assert.equal(value,(max/2)+' / '+max));
    }
    check('old-save imports cause no browser or game-loop exceptions',()=>assert.equal(errors.length,0));
  }finally{await browser?.close();await server?.close();}
}
(async()=>{try{if(process.argv.includes('--browser'))await browserChecks();}catch(error){checks.push({name:'browser migration',pass:false,error:error.stack});}finally{fs.mkdirSync(out,{recursive:true});const pass=checks.every(c=>c.pass);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({pass,checks,results},null,2)+'\n');console.log(JSON.stringify({pass,checks:checks.length,results,failures:checks.filter(c=>!c.pass)}));if(!pass)process.exitCode=1;}})();
