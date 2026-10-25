(function (K) {
  'use strict';
  const KEY = 'kong.black-lotus.v1';
  K.validSave = function (data) {
    if (!data || ![1,2].includes(data.schema) || data.game !== 'black-lotus' || !data.state) throw new Error('这不是本版本的劫后行存档。');
    const s = data.state;
    if(s.rules!==undefined&&![1,2].includes(s.rules))throw new Error('不支持的战斗规则。');
    const finite = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
    if (s.version !== 1 || typeof s.seed !== 'string' || s.seed.length > 64 || !Number.isInteger(s.stage) || s.stage < 0 || s.stage > 3 || !['playing','paused','reward','dead','won'].includes(s.mode)) throw new Error('存档版本或流程状态无效。');
    if (!s.player || !finite(s.player.hp,0,100) || !finite(s.player.focus,0,100) || !finite(s.player.x,-100,2300) || !finite(s.player.y,-1000,1000) || !finite(s.player.vx,-2000,2000) || !finite(s.player.vy,-2000,2000) || !finite(s.time,0,1e8)) throw new Error('存档角色数据损坏。');
    const p=s.player;
    for(const key of ['coyote','buffer','invuln','dash','dashCD','attack','landing'])if(!finite(p[key],0,5))throw new Error('存档动作计时损坏。');
    if(p.drop===undefined)p.drop=0;if(!finite(p.drop,0,1))throw new Error('存档下穿状态损坏。');
    if(![-1,1].includes(p.face)||typeof p.grounded!=='boolean'||typeof p.slam!=='boolean'||!Number.isInteger(p.airJumps)||p.airJumps<0||p.airJumps>1||!Number.isInteger(p.comboIndex)||p.comboIndex<0||p.comboIndex>3||!finite(p.attackId,0,1e8)||!Array.isArray(p.attackTargets)||p.attackTargets.length>20||(p.attack>0&&!finite(p.attackDuration,.1,1)))throw new Error('存档动作状态损坏。');
    for(const key of ['roomTime','kills','broken','damageTaken','hitstop','shake','checkpoint','combo','comboTime','serial'])if(!finite(s[key],0,1e8))throw new Error('存档流程计数损坏。');
    if(typeof s.lastDamage!=='string'||s.lastDamage.length>100||!Number.isInteger(s.combo)||s.combo>3)throw new Error('存档流程数据损坏。');
    if (!Array.isArray(s.relics) || s.relics.length > 6 || new Set(s.relics).size !== s.relics.length || s.relics.some(id => !K.relic(id))) throw new Error('存档舍利数据损坏。');
    const canonical = K.makeRoom(s.seed, s.stage);
    if (!s.room || !Array.isArray(s.room.enemies) || s.room.enemies.length !== canonical.enemies.length || !Array.isArray(s.room.seals) || s.room.seals.length !== canonical.seals.length || !Array.isArray(s.room.pickups) || s.room.pickups.length !== canonical.pickups.length) throw new Error('存档地图数据损坏。');
    for (let i=0;i<canonical.enemies.length;i++) { const e=s.room.enemies[i], c=canonical.enemies[i]; if (!e || e.id!==c.id || e.kind!==c.kind || !finite(e.hp,0,c.maxHp) || !finite(e.x,0,canonical.width) || !finite(e.y,-200,540) || !finite(e.timer,-10,10) || !finite(e.stun,0,2) || !finite(e.flash,0,2) || !finite(e.attacks,0,1e8) || (e.interruptLock!==undefined&&!finite(e.interruptLock,0,2)) || ![-1,1].includes(e.face) || !['idle','windup','attack','recover','sweep-windup','orb-windup','sweep'].includes(e.phase)) throw new Error('存档敌人数据损坏。'); }
    for (let i=0;i<canonical.seals.length;i++) if (!finite(s.room.seals[i].hp,0,42)) throw new Error('存档阵眼数据损坏。');
    if (!Array.isArray(s.projectiles) || s.projectiles.length > 100 || s.projectiles.some(b=>!finite(b.x,-200,2500)||!finite(b.y,-2000,2000)||!finite(b.vx,-2000,2000)||!finite(b.vy,-2000,2000)||!finite(b.life,0,10)||!finite(b.w,1,100)||!finite(b.h,1,100)||typeof b.friendly!=='boolean'||(b.damage!==undefined&&!finite(b.damage,1,100))||(b.hit!==undefined&&(!Array.isArray(b.hit)||b.hit.length>100||b.hit.some(id=>!Number.isInteger(id)))))) throw new Error('存档弹道数据损坏。');
    if(s.clone&&(!finite(s.clone.x,0,2300)||!finite(s.clone.y,-1000,1000)||!finite(s.clone.life,0,4)||!finite(s.clone.timer,-1,1)||![-1,1].includes(s.clone.face)))throw new Error('存档分身数据损坏。');
    if (!Array.isArray(s.reward) || s.reward.length > 3 || s.reward.some(id => !K.relic(id) || s.relics.includes(id)) || (s.mode==='reward' && s.reward.length===0)) throw new Error('存档奖励数据损坏。');
    // Restore static geometry from content. Imported files cannot inject collision or dimensions.
    canonical.enemies = s.room.enemies.map((e,i)=>({...canonical.enemies[i], ...e, w:canonical.enemies[i].w, h:canonical.enemies[i].h, maxHp:canonical.enemies[i].maxHp, origin:canonical.enemies[i].origin}));
    canonical.seals.forEach((q,i)=>q.hp=s.room.seals[i].hp); canonical.pickups.forEach((q,i)=>q.used=!!s.room.pickups[i].used);
    const restored = K.newRun(s.seed, null);
    Object.assign(restored,s,{rules:s.rules===2?2:1,room:canonical,player:{...s.player,w:24,h:44},effects:[],events:[],log:[],clone:s.clone?{x:s.clone.x,y:s.clone.y,w:24,h:44,life:s.clone.life,timer:s.clone.timer,face:s.clone.face}:null});
    if (restored.mode === 'playing') restored.mode='paused';
    return { state:restored, meta:K.cleanMeta(data.meta) };
  };
  K.cleanMeta = m => {const n=v=>Number.isFinite(Number(v))?Math.max(0,Math.min(1e8,Math.floor(Number(v)))):0;return {runs:n(m?.runs),wins:n(m?.wins),best:Math.min(4,n(m?.best))};};
  K.pack = (state, meta) => JSON.stringify({game:'black-lotus',schema:state.rules===2?2:1,build:K.VERSION,state,meta:K.cleanMeta(meta)});
  K.Storage = class {
    constructor() { this.available=true; this.error=''; this.cached=null; }
    read() { try { const raw=localStorage.getItem(KEY); if (!raw) return null; const data=JSON.parse(raw); this.cached=data; return K.validSave(data); } catch(e) { this.error=e.message; return null; } }
    write(state,meta) { const raw=K.pack(state,meta); this.cached=JSON.parse(raw); try {localStorage.setItem(KEY,raw);this.available=true;return true;} catch {this.available=false;this.error='自动存储不可用，请导出存档。';return false;} }
    export(state,meta) { const blob=new Blob([K.pack(state,meta)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download='劫后行-'+state.seed+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
    import(raw) { if(raw.length>1000000)throw new Error('存档文件过大。');return K.validSave(JSON.parse(raw)); }
  };
})(globalThis.Kong ||= {});
