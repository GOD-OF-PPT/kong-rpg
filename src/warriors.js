(function(K){
  'use strict';
  K.HEROES[1]={id:'nezha',name:'哪吒',title:'火尖枪主攻 · 乾坤圈辅攻',text:'近身枪法压阵，飞环去回控位，风火轮换高度。',skill:'莲火轮阵'};
  K.HEROES.push({id:'erlang',name:'杨戬',title:'三尖刀破势 · 射雕弓点杀',text:'主副兵器安排距离，天眼识破，唤哮天犬协战。',skill:'哮天逐邪'});
  K.warriorGuide=function(s){
    if(s.hero==='erlang')return 'J/左键三尖刀三连；H/右键射雕弓，18定力，0.22秒引弦，0.8秒冷却。右键朝光标，H水平射击。<br>L天眼：30定力，锁定区域3秒（照妖眼5秒），区内可破盾。U神行步：12定力，1秒冷却。<br>R哮天逐邪：100战意，哮天犬协战8秒（灵犬追猎10秒），每次扑咬18伤害，0.85秒间隔。';
    if(s.hero==='nezha')return 'J/左键火尖枪三连，第三枪重击；H/右键乾坤圈，12定力，一环在外不可再掷，但可以继续枪法。右键朝光标，H水平投掷。<br>L混天绫：40定力，缚莲绫为50；减缓普通敌人的游走和冲刺，首领不受减速；U按住驭风火轮，W/空格升、S降，落地松开回充。<br>R莲火轮阵：100战意，起势护体，后段仍可受伤。';
    return 'J/左键棍法三连；L或H/右键分身。U按住蓄棍、松开伸刺，S松U改撑地跃；K取消。<br>R法天象地：100战意，重击清近处飞弹。';
  };
  const newRun=K.newRun,enter=K.enterRoom;
  K.initWarrior=s=>{s.bow=null;s.arrows=[];s.hound=null;s.eye=null;s.player.secondaryCD=0;s.player.secondaryPose=0;};
  K.newRun=function(...args){const s=newRun(...args);K.initWarrior(s);return s;};
  K.enterRoom=function(...args){enter(...args);K.initWarrior(args[0]);};
  const reward=K.reward;
  K.reward=function(id,s){
    const r=reward(id,s);if(!r)return r;
    if(s?.hero==='nezha'){
      const c={staff:['烈枪心','第三枪与乾坤圈回程破盾；枪法收招更长。'],cloud:['凌云踵','空中再跳一次，空中枪法更远；轮火增至1.5秒，飞环射程增加70。'],'staff-wave':['烈枪余焰','第三枪发出12伤害焰浪；飞环折返点也迸出莲焰。']};
      if(c[id])return{...r,name:c[id][0],text:c[id][1],tag:id==='staff'?'枪环破盾':id==='cloud'?'空中取势':'三枪余焰',cost:id==='staff'?'第三枪收招较长；去程飞环仍可被正面盾挡。':id==='cloud'?'空中仍有莲印危险，轮火落地回充。':'须完成第三枪，飞环仍遵循去回路线。'};
    }
    if(s?.hero==='erlang'){
      const c={staff:['破军锋','第三刀破盾；射雕箭提升至42伤害并破盾。'],echo:['照妖眼','天眼识破持续5秒、范围360；仍需30定力。'],cloud:['踏云履','空中再跳一次，空中刀法更远。'],mercy:['护生灯','破阵回12生命；天眼结束返还15定力。'],'clone-burst':['破妄诀','天眼结束时在锁定位置爆发24伤害，打断普通蓄力。'],'ultimate-echo':['灵犬追猎','哮天犬持续延长至10秒。'],'staff-wave':['破军刀芒','第三刀发出12伤害的穿透刀芒。']};
      if(c[id])return{...r,name:c[id][0],text:c[id][1],tag:id==='staff'?'刀箭破盾':id==='echo'?'天眼破妄':id==='cloud'?'空中取势':id==='staff-wave'?'三刀远袭':r.tag,cost:id==='staff'?'弓箭仍需18定力；第三刀收招较长。':id==='cloud'?'跳跃不能穿过飞弹或莲印。':id==='staff-wave'?'须完成第三刀，不改变射箭冷却。':['echo','mercy','clone-burst'].includes(id)?'须安排天眼的锁定位置；识破不会冻结敌人。':id==='ultimate-echo'?'哮天犬持续输出，需要你牵制目标。':r.cost};
    }return r;
  };
  const box=K.attackBox;K.attackBox=function(s){if(s.hero==='wukong')return box(s);const p=s.player,range=p.comboIndex===3?118:!p.grounded&&K.has(s,'cloud')?110:92;return{x:p.face>0?p.x+10:p.x+14-range,y:p.y+2,w:range,h:42};};
  const hit=K.hitEnemy;K.hitEnemy=function(s,e,n,origin,pierce,impact){const seen=s.eye&&K.overlap(s.eye,e);return hit(s,e,n,origin,pierce||!!seen,impact);};
  const signature=K.stepSignature;K.stepSignature=function(s,a,dt){
    if(s.hero!=='erlang')return signature(s,a,dt);
    const p=s.player;p.armCD=Math.max(0,p.armCD-dt);p.vaultTime=0;
    if(a.signaturePressed&&p.armCD===0&&p.hurt<=0&&p.ultimate===0&&p.focus>=12){p.focus-=12;s.stats.focusSpent+=12;p.armCD=1;p.dash=.14;p.invuln=Math.max(p.invuln,.14);K.event(s,'dash');}
  };
  const startUlt=K.startUltimate,stepUlt=K.stepUltimate;
  K.startUltimate=function(s){if(s.hero!=='erlang')return startUlt(s);const p=s.player;if(p.hurt>0||p.ultimate>0)return;if(p.rage<100){K.event(s,'ability-note',{text:'战意未满，命中与破阵可积攒。'});return;}
    p.rage=0;p.ultimate=.86;p.attack=0;p.invuln=Math.max(p.invuln,.32);s.hound={x:K.clamp(p.x-35,0,s.room.width-36),y:p.y+18,w:36,h:26,vx:0,vy:0,life:K.rank(s,'ultimate-echo')?10:8,cooldown:.15,pose:'run',face:p.face,target:null};s.stats.ultimates++;K.event(s,'ultimate');K.effect(s,'world-rise',p.x,p.y+44);
  };
  K.stepUltimate=function(s,dt){if(s.hero!=='erlang')return stepUlt(s,dt);s.player.ultimate=Math.max(0,s.player.ultimate-dt);};
  function secondary(s,a){
    const p=s.player;if(s.hero==='wukong')return;if(p.secondaryCD>0||p.hurt>0||p.ultimate>0||p.slam||p.dash>0||s.bow)return;
    const cost=s.hero==='nezha'?12:18;if(p.focus<cost){K.event(s,'empty-focus');return;}
    if(s.hero==='nezha'&&s.ring)return;
    p.focus-=cost;s.stats.focusSpent+=cost;p.secondaryPose=.35;p.secondaryCD=s.hero==='nezha'?.6:.8;
    if(s.hero==='nezha')K.newRing(s,{aimPoint:a.secondaryAim});
    else{let dx=p.face,dy=0;if(a.secondaryAim){dx=a.secondaryAim.x-p.x-12;dy=a.secondaryAim.y-p.y-16;const n=Math.hypot(dx,dy)||1;dx/=n;dy/=n;p.face=dx<0?-1:1;}s.bow={timer:.22,dx,dy};K.event(s,'bow-draw');}
  }
  function eye(s){const p=s.player;if(s.eye||p.focus<30){if(p.focus<30)K.event(s,'empty-focus');return;}p.focus-=30;s.stats.focusSpent+=30;s.stats.clones++;s.eye={x:K.clamp(p.x+(p.face>0?0:-230),0,s.room.width-360),y:p.y-35,w:K.has(s,'echo')?360:280,h:105,life:K.has(s,'echo')?5:3};K.event(s,'eye');}
  function stepHound(s,dt){const h=s.hound;if(!h)return;h.life-=dt;h.cooldown=Math.max(0,h.cooldown-dt);if(h.life<=0||s.player.hp<=0){s.hound=null;return;}
    const target=s.room.enemies.filter(e=>e.hp>0&&!e.dormant&&Math.abs(e.x-s.player.x)<560).sort((a,b)=>Math.abs(a.x-h.x)-Math.abs(b.x-h.x))[0];h.target=target?.id??null;
    const tx=target?target.x+target.w/2:s.player.x-35,dx=tx-h.x;h.face=Math.sign(dx)||h.face;h.vx=Math.sign(dx)*Math.min(300,Math.abs(dx)*8);h.x=K.clamp(h.x+h.vx*dt,0,s.room.width-36);
    if(target&&h.cooldown===0&&Math.abs(dx)<130){h.vy=target.y<h.y-30?-420:-230;h.cooldown=.85;h.pose='bite';}
    h.vy=Math.min(480,h.vy+1200*dt);h.y+=h.vy*dt;const ground=K.surfaceAt(s,h.x+18,h.y+20);if(h.y+26>=ground&&h.vy>=0){h.y=ground-26;h.vy=0;}
    if(h.y>520||Math.abs(h.x-s.player.x)>650){h.x=s.player.x-30;h.y=s.player.y+18;h.vy=0;}
    if(target&&h.pose==='bite'&&h.cooldown>.45&&K.overlap({x:h.x-9,y:h.y-10,w:65,h:55},target)){K.hitEnemy(s,target,18,h.x,false,'hound');h.pose='run';K.effect(s,'hit',target.x,target.y+15,{color:'#a8e6d7'});}
  }
  const step=K.step;K.step=function(s,a={},dt=K.DT){
    if(s.mode!=='playing')return step(s,a,dt);const ticking=s.hitstop<=0,action={...a};if(s.hero==='erlang'&&a.clonePressed)action.clonePressed=false;if(s.hero==='wukong'&&a.secondaryPressed)action.clonePressed=true;
    step(s,action,dt);if(s.mode!=='playing'){if(s.player.hp<=0)s.hound=null;return;}if(!ticking)return;
    const p=s.player;p.secondaryCD=Math.max(0,p.secondaryCD-dt);p.secondaryPose=Math.max(0,p.secondaryPose-dt);
    if(a.secondaryPressed)secondary(s,a);if(s.hero==='erlang'&&a.clonePressed&&p.hurt<=0&&p.ultimate===0)eye(s);
    if(s.bow){if(p.hurt>0)s.bow=null;else{s.bow.timer-=dt;if(s.bow.timer<=0){s.arrows.push({x:p.x+12,y:p.y+16,w:24,h:6,vx:s.bow.dx*720,vy:s.bow.dy*720,life:1.1});s.bow=null;K.event(s,'bow-fire');}}}
    for(const arrow of s.arrows){arrow.life-=dt;const old={ax:arrow.x,ay:arrow.y,bx:arrow.x+arrow.vx*dt,by:arrow.y+arrow.vy*dt};arrow.x=old.bx;arrow.y=old.by;
      if(K.resolveArrowContact){if(K.resolveArrowContact(s,old))arrow.life=0;}
      else for(const e of s.room.enemies)if(e.hp>0&&!e.dormant&&K.lineHits(old,e,3)){K.hitEnemy(s,e,K.has(s,'staff')?42:32,old.ax,K.has(s,'staff'),'arrow');arrow.life=0;break;}
      if(arrow.life>0)for(const q of s.room.seals)if(q.hp>0&&K.lineHits(old,q,3)){K.hitSeal(s,q,32,old.ax);arrow.life=0;break;}
    }s.arrows=s.arrows.filter(b=>b.life>0&&b.x>0&&b.x<s.room.width);
    if(s.eye){s.eye.life-=dt;if(s.eye.life<=0){if(K.has(s,'mercy'))p.focus=Math.min(100,p.focus+15);if(K.rank(s,'clone-burst'))K.strike(s,s.eye,24,p.x,true,[],'heavy');s.eye=null;}}
    stepHound(s,dt);
  };
  K.readWarrior=function(s,room,number,fail){
    const p=s.player;if(!number(p.secondaryCD,0,1)||!number(p.secondaryPose,0,.4))fail();
    if(s.hero!=='wukong'&&s.arm!==null)fail();
    if(s.bow!==null&&(s.hero!=='erlang'||!s.bow||!number(s.bow.timer,0,.22)||!number(s.bow.dx,-1,1)||!number(s.bow.dy,-1,1)||Math.abs(Math.hypot(s.bow.dx,s.bow.dy)-1)>.001))fail();
    if(!Array.isArray(s.arrows)||s.arrows.length>3||s.arrows.some(b=>s.hero!=='erlang'||!number(b.x,-100,room.width+100)||!number(b.y,-1000,1000)||!number(b.vx,-720,720)||!number(b.vy,-720,720)||!number(b.life,0,1.1)||b.w!==24||b.h!==6))fail();
    if(s.eye!==null&&(s.hero!=='erlang'||!s.eye||!number(s.eye.x,0,room.width)||!number(s.eye.y,-1000,1000)||![280,360].includes(s.eye.w)||s.eye.h!==105||!number(s.eye.life,0,5)))fail();
    if(s.hound!==null){const h=s.hound;if(s.hero!=='erlang'||!h||!number(h.x,0,room.width)||!number(h.y,-1000,1000)||!number(h.vx,-300,300)||!number(h.vy,-450,500)||!number(h.life,0,10)||!number(h.cooldown,0,.85)||!['run','bite'].includes(h.pose)||![-1,1].includes(h.face)||(h.target!==null&&!room.enemies.some(e=>e.id===h.target)))fail();}
    const copy=x=>x===null?null:JSON.parse(JSON.stringify(x));return{bow:copy(s.bow),arrows:copy(s.arrows),eye:copy(s.eye),hound:copy(s.hound)};
  };
})(globalThis.Kong ||= {});
