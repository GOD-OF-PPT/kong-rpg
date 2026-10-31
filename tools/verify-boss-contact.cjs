const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),K=require('./combat-identity-runtime.cjs')();
const out=path.resolve(process.env.CONTACT_OUT||'evidence/boss-contact'),checks=[],samples=[];
const license={normalClear:{difficulty:'normal',complete:true,levels:15,seconds:1000,hits:0,killed:110,total:110}};
const check=(name,fn)=>{try{fn();checks.push({name,pass:true});}catch(error){checks.push({name,pass:false,error:error.stack});}};
function scene(stage=2,hero='wukong',difficulty='normal'){
  const s=K.newRun('BOSS-HEAD-CONTACT','cloud',hero,difficulty,license);K.enterRoom(s,stage,true);s.campaign.completed=Array.from({length:stage},(_,i)=>i);const boss=K.guardian(s);
  for(const e of s.room.enemies)if(e!==boss)e.hp=0;Object.assign(boss,{dormant:false,phase:'recover',timer:9});
  Object.assign(s.player,{x:boss.x+boss.w/2-12,y:boss.y-44-2,vx:0,vy:300,grounded:false,airJumps:1,invuln:0});return{s,boss};
}
for(const hero of ['wukong','nezha','erlang'])for(const difficulty of ['normal','challenge'])for(const stage of [2,5,8,11,14]){
  check(hero+' '+difficulty+' '+stage+': boss contact cannot bounce or grant a free hit',()=>{
    const{s,boss}=scene(stage,hero,difficulty),hp=boss.hp;K.step(s);
    assert.ok(s.player.vy>0,'contact must not reverse falling velocity');assert.equal(boss.hp,hp,'standing on the boss does not deal passive stomp damage');assert.equal(s.player.airJumps,1,'a boss must not refill the cloud air jump');assert.ok(!K.overlap(s.player,boss),'body contact moves the actor clear');
    let landed=false;for(let i=0;i<240;i++){K.step(s,{attack:true});if(s.player.grounded){landed=true;break;}}assert.ok(landed,'the actor must return to the floor without steering');assert.equal(s.log.filter(event=>event.type==='stomp').length,0);
  });
}
for(const boundary of ['left','right'])check('boss pinned to '+boundary+' arena wall still leaves an escape side',()=>{
  const{s,boss}=scene();boss.x=boundary==='left'?s.room.arena.min:s.room.arena.max-boss.w;
  s.player.x=boundary==='left'?boss.x:boss.x+boss.w-24;K.step(s);
  assert.ok(s.player.x>=s.room.arena.min&&s.player.x+24<=s.room.arena.max);assert.ok(!K.overlap(s.player,boss));assert.ok(s.player.vy>0);
});
for(const stage of [0,1,3,4,6,7,9,10,12,13])check('mini-boss stage '+stage+' is not a jump platform',()=>{
  const{s,boss}=scene(stage),hp=boss.hp;K.step(s);assert.ok(s.player.vy>0);assert.equal(boss.hp,hp);assert.equal(s.player.airJumps,1);assert.ok(!K.overlap(s.player,boss));
});
check('an intentional downward slam still hits a boss once without rebounding',()=>{
  const{s,boss}=scene(),hp=boss.hp;K.step(s,{attackPressed:true,down:true});assert.equal(hp-boss.hp,30);assert.ok(s.player.vy>0);assert.equal(s.player.airJumps,1);assert.equal(s.player.slam,false);
});
check('ordinary enemies retain stomp damage, rebound and air-jump refresh',()=>{
  const s=K.newRun('NORMAL-STOMP','cloud'),enemy=s.room.enemies.find(e=>e.role===0);for(const e of s.room.enemies)if(e!==enemy)e.hp=0;Object.assign(enemy,{phase:'recover',timer:9});Object.assign(s.player,{x:enemy.x+enemy.w/2-12,y:enemy.y-44-2,vy:300,grounded:false,airJumps:1});const hp=enemy.hp;K.step(s);
  assert.ok(enemy.hp<hp);assert.equal(s.player.vy,-380);assert.equal(s.player.airJumps,0);assert.ok(s.log.some(event=>event.type==='stomp'));
});
check('legitimate aerial weapon attacks can still hit a boss from the side',()=>{
  const{s,boss}=scene(),hp=boss.hp;Object.assign(s.player,{x:boss.x-50,y:boss.y+8,vy:-60,face:1});
  for(let i=0;i<24;i++)K.step(s,{attack:i===0,attackPressed:i===0});assert.ok(boss.hp<hp);assert.ok(s.log.some(event=>event.type==='hit'&&event.target===boss.id));
});
check('midair save/import cannot restore the old head-bounce loop',()=>{
  const{s}=scene(),raw=K.pack(s,{}),restored=K.validSave(JSON.parse(raw)).state;restored.mode='playing';let landed=false;for(let i=0;i<240;i++){K.step(restored,{attack:true});if(restored.player.grounded){landed=true;break;}}assert.ok(landed);assert.ok(!restored.log.some(event=>event.type==='stomp'));
});
for(const stage of [2,5,8,11,14]){
  const{s,boss}=scene(stage);boss.phase='idle';boss.timer=.8;let grounded=0,stomps=0;
  for(let i=0;i<1200&&s.mode==='playing'&&boss.hp>0;i++){K.step(s,{attack:true});if(s.player.grounded)grounded++;stomps+=s.events.filter(event=>event.type==='stomp').length;}
  samples.push({boss:boss.chiefId,seconds:s.time,playerHP:s.player.hp,bossHP:boss.hp,groundedFrames:grounded,stomps});
}
fs.mkdirSync(out,{recursive:true});const pass=checks.every(c=>c.pass);fs.writeFileSync(path.join(out,'rules.json'),JSON.stringify({pass,checks,samples},null,2)+'\n');console.log(JSON.stringify({pass,checks:checks.length,failures:checks.filter(c=>!c.pass).slice(0,4),samples}));if(!pass)process.exitCode=1;
