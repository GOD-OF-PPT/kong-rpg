// Capture actual rendered frames at observable runtime phases. Public imports
// prepare a training fixture; keyboard input and normal simulation drive it.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,process.env.SKILL_REVIEW_DIR||'evidence/skill-visual-v12/before');fs.mkdirSync(path.join(out,'frames'),{recursive:true});
const c=vm.createContext({console});for(const n of ['content','motion','world','progression','journey','heroes','signature','simulation','challenge','realms','warriors','celestial','campaign-data','enemy-effects','route-layouts','campaign-world','campaign-combat','campaign-state','combat-identity','storage'])vm.runInContext(fs.readFileSync(path.join(root,'src',n+'.js'),'utf8'),c);const K=c.Kong;
const specs=[];
const names={wukong:'孙悟空',nezha:'哪吒',erlang:'杨戬'};
for(const hero of Object.keys(names)){
 for(let combo=1;combo<=3;combo++)specs.push({id:hero+'-main'+combo,hero,kind:'main',combo,title:names[hero]+' · 第'+combo+'击',distance:hero==='wukong'?55:65});
 for(const kind of ['secondary','ability','signature','ultimate'])specs.push({id:hero+'-'+kind,hero,kind,title:names[hero]+' · '+({secondary:{wukong:'破空棍劲',nezha:'乾坤圈',erlang:'射雕弓'},ability:{wukong:'分身',nezha:'混天绫',erlang:'天眼'},signature:{wukong:'如意伸刺',nezha:'风火轮',erlang:'神行步'},ultimate:{wukong:'法天象地',nezha:'莲火轮阵',erlang:'哮天逐邪'}}[kind][hero]),distance:kind==='secondary'?180:kind==='ability'?65:kind==='signature'?(hero==='wukong'?255:55):90});
}
for(const art of K.ARTS)specs.push({id:art.id,hero:art.hero,kind:'art',art:art.id,title:names[art.hero]+' · '+art.name,distance:art.id==='eye-beam'?180:75});
for(const id of ['thunder','ward'])specs.push({id:'talisman-'+id,hero:'wukong',kind:'talisman',talisman:id,title:id==='thunder'?'符术 · 三霄雷符':'符术 · 金刚护符',distance:100});
for(const move of Object.keys(K.CAMPAIGN_MOVES))specs.push({id:'enemy-'+move,move,kind:'enemy',hero:'wukong',title:K.CAMPAIGN_MOVES[move].name});
const selected=process.env.SKILL_REVIEW_IDS?.split(',').filter(Boolean);const cases=selected?.length?specs.filter(s=>selected.includes(s.id)):specs;if(!cases.length)throw Error('No matching skills selected');
const phasesFor=s=>s.kind==='enemy'?['预警','释放','受击接触','收招']:s.kind==='main'?['起手','生效','命中','收回']:s.kind==='art'?s.art==='sky-staff'?['立棍','撑升','下坠','落地']:s.art==='orbit-staff'?['准备','前层挥转','后层挥转','收势']:s.art==='six-arms'?['显化','持势','枪法','命中']:['蓄光','释放','脉冲','收势']:s.kind==='secondary'?['起势','飞行','命中','结束']:s.kind==='ability'?['施放','持续','交互','结束']:s.kind==='signature'?['起势','移动或蓄力','生效','收势']:s.kind==='ultimate'?['起势','释放','打击','收势或持续']:s.talisman==='thunder'?['落点','雷击','命中','消散']:['施符','护体','持续','消退'];
function fixture(spec){
 const stage=spec.kind==='enemy'?(spec.move.startsWith('axe')?2:spec.move.startsWith('judge')?5:['venom-fan','venom-tide','head-dive'].includes(spec.move)?8:spec.move.startsWith('dragon')?11:spec.move.startsWith('king')||spec.move==='tower-prison'?14:0):2;
 const s=K.newRun('VISUAL-SKILLS-1028','staff',spec.hero);K.enterRoom(s,stage,true);s.campaign.completed=Array.from({length:stage},(_,i)=>i);s.room.enemies.forEach(e=>e.hp=0);const e=spec.kind==='enemy'&&stage===0?s.room.enemies.filter(e=>e.role===(spec.move==='shield-wave'||spec.move==='soldier-rush'?2:spec.move==='soldier-bolt'?1:0)).at(-1):K.guardian(s);Object.assign(e,{hp:e.maxHp,dormant:false,phase:'campaign-active',timer:8,face:-1});Object.assign(s.player,{x:e.x-(spec.distance||90),y:396,grounded:true,focus:100,rage:100,invuln:0,face:1});
 if(spec.kind==='main'){s.combo=spec.combo-1;s.comboTime=.85;}
 if(spec.kind==='art')K.learnArt(s,spec.art);
 if(spec.kind==='signature'&&spec.hero==='erlang')s.growth['dash-strike']=1;
 if(spec.kind==='ability'&&spec.hero==='wukong')s.relics=['echo'];
 if(spec.kind==='talisman')s.talisman={id:spec.talisman,charges:spec.talisman==='ward'?2:3};
 if(spec.kind==='enemy'){
  K.beginCampaignMove(s,e,spec.move);e.timer=.5;const profile=K.enemyEffectProfile(spec.move),mark=e.marks[0];
  if(['stamp','column','chain','thunder'].includes(profile.shape))s.player.x=mark.x+mark.w/2-12;
  if(profile.shape==='ground')s.player.x=mark.x+12;
  if(['venom-tide','king-fire','shield-wave'].includes(spec.move))s.player.x=K.clamp(mark.x+mark.w-50,stage===0?8:s.room.arena.min,s.room.width-32);
 }
 return {s,target:e.id};
}
const report={version:K.VERSION,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'release/index.html'))).digest('hex'),method:'Public-import training fixtures; actual input and runtime simulation; frame capture after production renderer. Raw Canvas 960x540, no graphics replacement. Not natural gameplay or human playtest.',cases:[],errors:[]};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),ctx=await browser.newContext({viewport:{width:1440,height:1000}}),p=await ctx.newPage();report.browser=browser.version();p.on('pageerror',e=>report.errors.push(e.message));const snap=()=>p.evaluate(()=>__KONG__.snapshot());let serial=0,recording;
 try{
  await p.goto(process.env.SKILL_REVIEW_URL||'http://127.0.0.1:5188/?skill-visual-review=1');await p.evaluate(()=>Promise.all([Kong.ImageArt.ready,Kong.DialogArtReady]));report.servedVersion=await p.evaluate(()=>Kong.VERSION);
  await p.evaluate(()=>{
   const draw=Kong.Renderer.prototype.draw;
   Kong.Renderer.prototype.draw=function(s,ui,dt){draw.call(this,s,ui,dt);const a=window.__skillReview;if(!a||ui!=='playing'||!s)return;const p=s.player,e=s.room.enemies.find(e=>e.id===a.target),spec=a.spec,cast=s.celestial.cast,phase=Kong.attackPhase(p);
    const active=spec.kind==='enemy'?e.phase==='campaign-windup':spec.kind==='main'?p.attack>0:spec.kind==='secondary'?p.secondaryPose>0||s.bow||s.ring:spec.kind==='ability'?s.clone||s.silk||s.eye:spec.kind==='signature'?s.arm||s.flight||p.dash>0:spec.kind==='ultimate'?p.ultimate>0:spec.kind==='art'?cast?.id===spec.art:spec.talisman==='ward'?p.ward>0:s.casts.length>0;
    if(a.start===null){if(!active)return;a.start=s.time;}
    const age=s.time-a.start,fx=s.effects,hit=fx.some(f=>['hit','heavy-hit'].includes(f.kind)),hurt=fx.some(f=>f.kind==='hurt'&&Kong.enemySpell({source:s.lastDamage})===spec.move);let tests;
    if(spec.kind==='enemy'){tests=[e.phase==='campaign-windup'&&e.timer<.3,['campaign-active','campaign-charge'].includes(e.phase),hurt,e.phase==='recover'];if(spec.move==='judge-echo')tests.push(e.repeat===1&&e.phase==='campaign-windup'&&e.timer<.3,e.repeat===1&&e.phase==='campaign-active');}
    else if(spec.kind==='main')tests=[phase==='windup',phase==='strike'||phase==='follow',hit,phase==='recover'];
    else if(spec.kind==='secondary')tests=[age<.06,spec.hero==='erlang'?s.arrows.length>0:spec.hero==='nezha'?s.ring?.distance>60:s.projectiles.some(b=>b.impact==='staff-bolt'&&Math.abs(b.x-p.x)>50),hit,age>.4&&!s.bow&&!s.ring&&!s.projectiles.some(b=>b.impact==='staff-bolt')];
    else if(spec.kind==='ability')tests=[age<.08,age>.35,hit||age>.65,age>(spec.hero==='wukong'||spec.hero==='erlang'?3.1:1.9)];
    else if(spec.kind==='signature')tests=spec.hero==='wukong'?[s.arm?.phase==='charge',s.arm?.charge>.32,s.arm?.phase==='thrust'&&s.arm.timer<.1,s.arm?.phase==='recover']:spec.hero==='nezha'?[s.flight?.age<.1,s.flight?.age>.25,s.flight?.age>.6,age>1.1&&!s.flight]:[p.dash>.09,p.dash>.04&&p.dash<.08,hit,age>.22&&p.dash===0];
    else if(spec.kind==='ultimate')tests=spec.hero==='erlang'?[p.ultimate>.7,s.hound&&s.hound.x>p.x-10,fx.some(f=>f.impact==='hound'),age>1.5&&s.hound]:spec.hero==='nezha'?[p.ultimate>.7,fx.some(f=>f.kind==='lotus-release'&&f.pulse===1),fx.some(f=>f.kind==='lotus-release'&&f.pulse===2),age>.9]:[p.ultimate>.7,p.ultimate<.65&&p.ultimate>.45,fx.some(f=>f.kind==='ultimate-wave'),age>.9];
    else if(spec.kind==='art'){const t=cast?.age||0;tests=spec.art==='sky-staff'?[t>0&&t<.15,t>.45&&t<.7,t>.84&&t<1.01,fx.some(f=>f.kind==='celestial-slam')]:spec.art==='orbit-staff'?[t>0&&t<.2,t>.3&&t<.4,t>.43&&t<.53,t>1.43]:spec.art==='six-arms'?[t>0&&t<.15,t>.3&&p.attack===0,p.attack>0&&['strike','follow'].includes(phase),fx.some(f=>f.kind==='six-strike')]:[t>0&&t<.25,t>.33&&t<.43,t>.6&&t<.85,t>1.02];}
    else tests=spec.talisman==='ward'?[p.ward>1.5,p.ward<1.2&&p.ward>.9,p.ward<.6&&p.ward>.3,age>1.65]:[s.casts.length>0,fx.some(f=>f.kind==='thunder'),hit,age>.6];
    for(let i=0;i<tests.length;i++)if(!a.frames[i]&&tests[i]){
     const boxes=[];if(p.attack>0&&['strike','follow'].includes(phase))boxes.push({kind:'attack',...Kong.attackBox(s)});for(const d of s.dangers)boxes.push({kind:'danger',x:d.x,y:d.y,w:d.w,h:d.h});for(const d of e.marks||[])boxes.push({kind:e.phase==='campaign-windup'?'warning':'locked',...d});for(const b of s.projectiles)boxes.push({kind:b.friendly?'projectile-friendly':'projectile',x:b.x,y:b.y,w:b.w,h:b.h});if(s.ring)boxes.push({kind:'ring',x:s.ring.x,y:s.ring.y,w:s.ring.w,h:s.ring.h});if(s.silk)boxes.push({kind:'silk',x:s.silk.x,y:s.silk.y,w:s.silk.w,h:s.silk.h});if(s.eye)boxes.push({kind:'eye',...s.eye});if(cast?.id==='orbit-staff')boxes.push({kind:'orbit',...Kong.artOrbitBox(s)});if(cast?.id==='eye-beam')boxes.push({kind:'beam',line:Kong.artBeamLine(s)});
     if(p.ultimate>0)boxes.push({kind:'ultimate',...Kong.ultimateBox(s)});
     a.frames[i]={png:this.canvas.toDataURL(),time:s.time,age,camera:this.camera,player:{x:p.x,y:p.y,w:p.w,h:p.h,face:p.face,hp:p.hp,invuln:p.invuln},enemy:{x:e.x,y:e.y,w:e.w,h:e.h,phase:e.phase,move:e.move,hp:e.hp,face:e.face},boxes,cast:cast?{id:cast.id,age:cast.age,pulse:cast.pulse}:null,effects:fx.map(f=>({kind:f.kind,x:f.x,y:f.y,life:f.life,impact:f.impact,box:f.box})),events:s.log.slice(-5)};
    }
   };
  });
  recording=await require('./record-canvas.cjs')(p,path.join(out,'skills.webm'));
  for(const spec of cases){
   if((await snap()).screen==='playing')await p.keyboard.press('Escape');const {s,target}=fixture(spec);s.runId='VISUAL-'+(++serial);const raw=K.pack(s,{});K.validSave(JSON.parse(raw));fs.writeFileSync(path.join(out,spec.id+'-fixture.json'),raw);await p.locator('#import-file').setInputFiles({name:'visual.json',mimeType:'application/json',buffer:Buffer.from(raw)});await p.waitForFunction(id=>__KONG__.snapshot().state.runId===id,s.runId);await p.waitForTimeout(120);await p.evaluate(({spec,target})=>window.__skillReview={spec,target,start:null,frames:Array(spec.move==='judge-echo'?6:4).fill(null)},{spec,target});await p.getByRole('button',{name:'继续前行',exact:true}).click();
   if(spec.kind==='main')await p.keyboard.press('KeyJ');
   else if(spec.kind==='secondary')await p.keyboard.press('KeyH');
   else if(spec.kind==='ability'){await p.keyboard.press('KeyL');if(spec.hero==='erlang'){await p.waitForTimeout(420);await p.keyboard.press('KeyJ');}else if(spec.hero==='wukong'){await p.waitForTimeout(100);await p.keyboard.down('KeyA');await p.waitForTimeout(360);await p.keyboard.up('KeyA');}}
   else if(spec.kind==='signature'){if(spec.hero==='wukong'){await p.keyboard.down('KeyU');await p.waitForTimeout(460);await p.keyboard.up('KeyU');}else if(spec.hero==='nezha'){await p.keyboard.down('KeyU');await p.keyboard.down('KeyW');await p.waitForTimeout(780);await p.keyboard.up('KeyU');await p.keyboard.up('KeyW');}else await p.keyboard.press('KeyU');}
   else if(spec.kind==='ultimate')await p.keyboard.press('KeyR');
   else if(spec.kind==='art'){await p.keyboard.press('KeyC');if(spec.art==='six-arms'){await p.waitForTimeout(400);await p.keyboard.down('KeyJ');await p.waitForTimeout(500);await p.keyboard.up('KeyJ');}}
   else if(spec.kind==='talisman')await p.keyboard.press('KeyQ');
   if(spec.move==='judge-echo'){await p.waitForTimeout(700);await p.keyboard.down('KeyA');await p.waitForTimeout(360);await p.keyboard.up('KeyA');}
   const began=Date.now();while(Date.now()-began<5200){const done=await p.evaluate(()=>window.__skillReview.frames.every(Boolean));if(done)break;await p.waitForTimeout(80);}
   const frames=await p.evaluate(()=>{const a=window.__skillReview;window.__skillReview=null;return a.frames;});const labels=phasesFor(spec);const row={...spec,seed:s.seed,target,frames:[],missing:[],review:{status:'待审',notes:[]}};
   if(spec.move==='judge-echo')labels.push('二次预警','复判释放');
   for(let i=0;i<frames.length;i++){if(!frames[i]){row.missing.push(labels[i]);continue;}const f=frames[i],file='frames/'+spec.id+'-'+i+'.png';fs.writeFileSync(path.join(out,file),Buffer.from(f.png.split(',')[1],'base64'));delete f.png;row.frames.push({label:labels[i],file,...f});}
   if(spec.id==='nezha-ultimate'){row.frames[1].label='第一轮释放';row.frames[2].label='第二轮释放';row.frames[3].label='附枪持续';}
   row.frames.sort((a,b)=>a.time-b.time);report.cases.push(row);fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify(report,null,2)+'\n');console.log(spec.id+' '+row.frames.length+'/'+labels.length);
  }
 }catch(e){report.failure=e.stack;throw e;}finally{if(recording)report.recording=await recording.stop();await ctx.close();await browser.close();fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cases:report.cases.length,missing:report.cases.filter(c=>c.missing.length).map(c=>({id:c.id,missing:c.missing})),errors:report.errors,failure:report.failure}));}
})().catch(e=>{console.error(e);process.exitCode=1;});
