const assert=require('node:assert/strict'),K=require('./combat-identity-runtime.cjs')(),checks=[];
for(const stage of [0,3,6,9,12])for(const side of [-1,1]){
  const s=K.newRun('ENEMY-FACING','cloud');K.enterRoom(s,stage,true);
  const e=s.room.enemies.find(enemy=>enemy.role===1&&!enemy.chiefId),target={x:e.x+side*180,y:s.player.y,w:24,h:44};
  e.phase='idle';e.timer=.4;e.face=-side;
  K.stepCounter(s,e,K.DT,target);assert.equal(e.face,side,'idle caster should face its target before beginning a spell');
  K.beginCampaignMove(s,e,K.campaignMoveSet(e)[0],target);const marks=JSON.stringify(e.marks),face=e.face;
  target.x=e.x-side*180;K.stepCounter(s,e,K.DT,target);
  assert.equal(e.face,face,'crossing an announced attack must not retarget it');assert.equal(JSON.stringify(e.marks),marks,'announced danger boxes remain fixed');
  checks.push(stage+': '+side+' idle target and locked attack');
}
console.log(JSON.stringify({pass:true,checks:checks.length}));
