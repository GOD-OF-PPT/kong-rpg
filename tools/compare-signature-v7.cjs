// Fixed-content simulation experiment. Deliberately outside shipping rules.
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.resolve(__dirname,'..'),ctx=vm.createContext({console});for(const n of ['content','world','progression','journey','heroes','signature','simulation','challenge','storage'])vm.runInContext(fs.readFileSync(path.join(root,'src',n+'.js'),'utf8'),ctx);const K=ctx.Kong;
function setup(hero,relic){const s=K.newRun('RUYI-COMPARE',relic,hero);s.room.platforms=[{x:0,y:440,w:1800,h:110,solid:true}];s.room.hazards=[];s.room.seals=[];s.room.pickups=[];s.room.node=null;s.room.camp=null;s.room.trial=null;s.room.width=1800;s.room.arena={min:0,max:1770,enter:1770,checkpoint:30,offset:0};s.room.enemies=s.room.enemies.filter(e=>e.kind==='shield'||e.kind==='caster').slice(0,2);s.room.enemies.forEach((e,i)=>Object.assign(e,{x:hero==='wukong'?700+i*145:550+i*120,origin:hero==='wukong'?700+i*145:550+i*120,y:e.kind==='caster'?327:400,baseY:e.kind==='caster'?327:400,phase:'idle',timer:.7}));Object.assign(s.player,{x:hero==='wukong'?400:350,y:396,grounded:true,focus:100,invuln:0});return s;}
const results=[];
for(const hero of ['wukong','nezha'])for(const relic of hero==='wukong'?['staff','cloud']:['staff','cloud'])for(const policy of ['basic','hold','observe']){
  const s=setup(hero,relic);let waiting=0,switches=0,last='',resourceAtEnd;
  for(let i=0;i<2160&&s.mode==='playing'&&s.room.enemies.some(e=>e.hp>0);i++){
    const p=s.player,foes=s.room.enemies.filter(e=>e.hp>0),e=foes.sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0],dx=e.x-p.x,a={attack:true,aimPoint:{x:e.x+e.w/2,y:e.y+e.h/2}};
    if(hero==='wukong'){
      if(policy==='basic'){a.right=dx>48;a.left=dx<-48;}
      else if(policy==='hold'){a.signature=true;}
      else{
        const dist=Math.abs(dx);a.right=dx>300;a.left=dx<-300;p.face=Math.sign(dx)||p.face;
        if(e.phase==='break-windup'&&e.timer<.4){a.jumpPressed=p.grounded;a.jump=true;}
        if(e.phase==='break-rush'){a.jump=true;a.attack=true;}
        else if(dist>175&&p.focus>25&&!p.dash&&!p.hurt){a.attack=false;a.signature=!s.arm||s.arm.phase==='charge'&&s.arm.charge<.5;}
        else{a.right=dx>48;a.left=dx<-48;if(i%180===0&&p.focus>=40)a.clonePressed=true;}if(e.kind==='caster'&&Math.abs(dx)<310&&p.grounded&&i%85<5){a.signature=false;a.jumpPressed=true;a.jump=true;}if(!p.grounded){a.attack=true;a.signature=false;a.jump=true;}
      }
    }else if(policy==='hold'){a.signature=true;a.jump=true;}
    else if(policy==='observe'){
      const mark=s.room.enemies.find(e=>e.phase==='air-windup')?.marks?.[0];
      if(mark&&K.overlap(p,mark)){a.signature=false;a.right=true;}
      else if(p.wheelFuel>.15&&p.focus>10&&(i%300<140||e.kind==='shield'&&p.x<e.x+65)){a.signature=true;a.jump=p.y>270;const goal=e.kind==='shield'?e.x+75:e.x-200;a.left=p.x>goal+10;a.right=p.x<goal-10;}
      else{a.left=dx<170;a.right=dx>320;if(e.phase==='windup'&&e.timer<.25)a.jumpPressed=p.grounded;a.jump=!!a.jumpPressed;}
      if(i%240===0&&p.focus>=40)a.clonePressed=true;
    }
    const label=s.flight?'flight':(s.arm?.phase||(a.attack?'basic':'move'));if(label!==last){switches++;last=label;}if(!a.attack&&!a.signature&&!a.left&&!a.right)waiting+=K.DT;K.step(s,a);
  }
  results.push({hero,relic,policy,seconds:+s.elapsed.toFixed(2),hp:s.player.hp,damage:s.damageTaken,enemyHP:s.room.enemies.map(e=>({kind:e.kind,hp:e.hp})),clear:s.room.enemies.every(e=>e.hp===0),focusSpent:+s.stats.focusSpent.toFixed(1),focusLeft:+s.player.focus.toFixed(1),tipHits:s.stats.tipHits,flights:s.stats.flights,waiting:+waiting.toFixed(2),modeSwitches:switches,hitSources:s.log.filter(e=>e.type==='hurt').map(e=>e.source)});
}
const report={seed:'RUYI-COMPARE',durationLimit:18,method:'isolated flat scene with same shield/caster and resources per hero; production simulation, three scripted policies; no claims about human play',results};fs.writeFileSync(path.join(root,'evidence/signature-v7/comparison.json'),JSON.stringify(report,null,2));console.table(results.map(({hero,relic,policy,damage,clear,focusSpent,tipHits,flights})=>({hero,relic,policy,damage,clear,focusSpent,tipHits,flights})));
