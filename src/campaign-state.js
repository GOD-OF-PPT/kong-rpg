(function(K){
  'use strict';
  K.CAMPAIGN_SOURCES=K.STAGES.flatMap((q,stage)=>[...K.chapter(stage).roles,K.GUARDIANS[stage].name].flatMap(name=>Object.values(K.CAMPAIGN_MOVES).map(m=>name+'·'+m.name)));
  K.readCampaign=function(s,canonical,number,fail){
    const q=s.campaign;if(!q||!Array.isArray(q.completed)||q.completed.length>15||q.completed.some((v,i)=>v!==i)||q.completed.length!==s.stage+(s.mode==='won'||s.mode==='reward'&&s.rewardKind==='exit'?1:0)||!Array.isArray(q.killed)||new Set(q.killed).size!==q.killed.length||!Number.isInteger(q.hits)||q.hits<0||q.hits>100000||!number(q.started,0,s.elapsed))fail();
    const rooms=new Map(),enemyFor=key=>{if(typeof key!=='string'||! /^(?:[0-9]|1[0-4]):[0-9]{1,4}$/.test(key))return null;const[stage,id]=key.split(':').map(Number);if(stage>s.stage)return null;if(!rooms.has(stage))rooms.set(stage,stage===s.stage?canonical:K.makeRoom(s.seed,stage,s.difficulty));return rooms.get(stage).enemies.find(e=>e.id===id&&e.scoreable);};
    if(q.killed.length>K.campaignEnemyTotal(s.seed,s.difficulty)||q.killed.some(key=>!enemyFor(key)||key.startsWith(s.stage+':')&&enemyFor(key).hp!==0))fail();
    if(s.mode==='won'&&(s.stage!==14||q.completed.length!==15))fail();
    if(!Array.isArray(s.room.anchors)||s.room.anchors.length!==canonical.anchors.length)fail();
    for(const [i,a]of canonical.anchors.entries()){const x=s.room.anchors[i];if(!x||x.id!==a.id||x.kind!==a.kind||x.x!==a.x||x.y!==a.y||!number(x.hp,0,a.maxHp)||typeof x.active!=='boolean'||!Array.isArray(x.hits)||x.hits.length>30||x.hits.some(v=>typeof v!=='string'||v.length>200))fail();a.hp=x.hp;a.active=x.active;a.hits=x.hits.slice();}
    return {completed:q.completed.slice(),killed:q.killed.slice(),hits:q.hits,started:q.started,access:s.difficulty==='challenge'?{...q.access}:null};
  };
})(globalThis.Kong ||= {});
