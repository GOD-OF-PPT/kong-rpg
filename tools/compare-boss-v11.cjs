const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const root=path.resolve(__dirname,'..'),c=vm.createContext({console});for(const n of ['content','world','progression','journey','heroes','signature','simulation','challenge','realms','warriors','celestial','campaign-data','route-layouts','campaign-world','campaign-combat','campaign-state','storage'])vm.runInContext(fs.readFileSync(path.join(root,'src',n+'.js'),'utf8'),c);const K=c.Kong,rows=[],license={normalClear:{difficulty:'normal',complete:true,levels:15,seconds:1000,hits:0,killed:110,total:110}};
for(const diff of ['normal','challenge'])for(const hero of ['wukong','nezha','erlang'])for(const stage of [2,5,8,11,14])for(const strategy of ['mash','observe']){
 const s=K.newRun('BOSS-V11-PAIR','staff',hero,diff,license);K.enterRoom(s,stage,true);s.campaign.completed=Array.from({length:stage},(_,i)=>i);s.room.enemies.forEach(e=>{if(!e.chiefId)e.hp=0;});const e=K.guardian(s);Object.assign(e,{dormant:false,phase:'idle',timer:0});Object.assign(s.player,{x:e.x-65,y:396,face:1,focus:100,rage:100,grounded:true,invuln:0});let jumpUntil=0,lastJump=-2,lastDash=-2,lastL=-3,lastH=-2,lastR=-2,waits=0;const inputs=[];
 for(let i=0;i<60/K.DT&&s.player.hp>0&&e.hp>0;i++){
  const p=s.player,t=s.time,a={attack:true};if(strategy==='mash'){a.ultimatePressed=p.rage>=100;}else{
   const min=s.room.arena.min,max=s.room.arena.max-24,dir=e.x+e.w/2>p.x+12?1:-1;let target=e.face<0?e.x+e.w+22:e.x-45;const anchor=e.hp>70&&s.room.anchors.find(q=>q.active&&q.hp>0);if(anchor)target=anchor.x-40;target=K.clamp(target,min,max);
   const threats=[...(e.phase==='campaign-windup'&&e.timer<.48?e.marks:[]),...s.dangers],over=b=>p.x+p.w>b.x-6&&p.x<b.x+b.w+6&&p.y+p.h>b.y&&p.y<b.y+b.h;
   const tall=threats.filter(b=>b.h>60&&b.w<200),low=threats.filter(b=>b.h<=60||b.w>200);let evade=false;
   if(tall.some(over)){const points=[p.x-100,p.x+100,p.x-200,p.x+200].filter(x=>x>=min&&x<=max&&tall.every(b=>x+24<b.x-8||x>b.x+b.w+8));if(points.length){target=points[0];a.attack=false;evade=true;waits++;}}
   const incoming=s.projectiles.some(b=>!b.friendly&&Math.abs(b.x-p.x)<130&&b.y+b.h>p.y&&b.y<p.y+p.h);
   if(p.grounded&&t-lastJump>.5&&(low.some(over)||incoming)){jumpUntil=t+.5;lastJump=t;}
   a.jump=t<jumpUntil;a.jumpPressed=a.jump&&t===lastJump;
   if(p.x<target-8)a.right=true;else if(p.x>target+8)a.left=true;else if(p.face!==dir)a[dir>0?'right':'left']=true;
   if(e.phase==='campaign-windup'&&Math.abs(e.x-p.x)<100&&p.dashCD<=0&&t-lastDash>1){a.dashPressed=true;lastDash=t;}
   if(p.rage>=100&&t-lastR>1&&Math.abs(e.x-p.x)<220&&e.phase==='recover'&&!evade){a.ultimatePressed=true;lastR=t;}
   if(p.focus>45&&t-lastL>4&&!evade){a.clonePressed=true;lastL=t;}
   if(p.focus>35&&p.secondaryCD<=0&&t-lastH>1&&!evade&&(hero!=='wukong'||Math.abs(e.x-p.x)>110)){a.secondaryPressed=true;a.secondaryAim={x:e.x+e.w/2,y:e.y+e.h*.5};lastH=t;}
  }
  K.step(s,a);if(i%60===0)inputs.push({t:s.time,x:p.x,hp:p.hp,boss:e.hp,phase:e.phase,move:e.move,keys:Object.keys(a).filter(k=>a[k]===true)});
 }
 rows.push({hero,difficulty:diff,boss:e.chiefId,strategy,won:e.hp===0,hp:s.player.hp,bossHP:e.hp,seconds:s.time,hits:s.campaign.hits,attacks:e.attacks,resources:s.stats.focusSpent,waits,inputs});
}
const summary=rows.map(({inputs,...r})=>r),pairs=summary.filter(r=>r.strategy==='observe').map(a=>{const b=summary.find(b=>b.hero===a.hero&&b.difficulty===a.difficulty&&b.boss===a.boss&&b.strategy==='mash');return{hero:a.hero,difficulty:a.difficulty,boss:a.boss,mash:b.won?'win':'fail',observe:a.won?'win':'fail',mashHits:b.hits,observeHits:a.hits,seconds:a.seconds};});const out=path.join(root,'evidence/combat-v11');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'boss-comparison.json'),JSON.stringify({version:K.VERSION,method:'Deterministic simulation controllers with identical canonical starting conditions. Observes full state, not human/perception evidence.',rows},null,2));console.log(JSON.stringify(pairs,null,2));
