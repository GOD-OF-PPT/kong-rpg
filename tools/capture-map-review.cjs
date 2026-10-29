// Native-size map screenshots from the production renderer. Canonical frozen
// scene fixtures are explicit; no claim of a natural playthrough is made.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,process.env.MAP_REVIEW_DIR||'evidence/map-visual-v12/before');fs.mkdirSync(path.join(out,'frames'),{recursive:true});
const mode=process.argv[2]||'http',entry=path.resolve(root,process.env.GAME_ENTRY||'release/index.html'),report={mode,sha256:crypto.createHash('sha256').update(fs.readFileSync(entry)).digest('hex'),method:'Frozen canonical scenes drawn by production Renderer, native Canvas960x540; controlled art review, not full natural playthrough',maps:[],errors:[],network:[]};
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true}),ctx=await b.newContext({viewport:{width:1440,height:1000}});if(mode==='file'){await ctx.setOffline(true);await ctx.route(/^https?:/,r=>r.abort());}const p=await ctx.newPage();report.browser=b.version();p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))report.network.push(r.url());});
try{await p.goto(mode==='file'?'file:///'+entry.replace(/\\/g,'/'):'http://127.0.0.1:5188/?map-review=1');await p.evaluate(()=>Promise.all([Kong.ImageArt.ready,Kong.DialogArtReady]));report.version=await p.evaluate(()=>Kong.VERSION);
for(const stage of process.env.MAP_REVIEW_STAGES?process.env.MAP_REVIEW_STAGES.split(',').map(Number):Array.from({length:15},(_,i)=>i)){
 const overview=await p.evaluate(stage=>{const K=Kong,s=K.newRun('MAP-RENDER-1029','staff','wukong');K.enterRoom(s,stage,true);return{stage,title:K.levelInfo(stage).name,realm:K.chapter(stage).id,route:s.room.route,width:s.room.width,focusX:[1,13].includes(stage)?2085:1350};},stage);
 const cameras=[0,720,1440,overview.width-960].filter((v,i,a)=>v>=0&&a.indexOf(v)===i).sort((a,b)=>a-b);
 const variants=[...cameras.map((camera,i)=>({camera,id:'route-'+i,label:['起点','路线前段','路线后段','终点'][i]})),{id:'boss',label:'首领场地',camera:overview.width-960},{id:'clear',label:'清场 · 灯灭/关门开放',camera:overview.width-960},{id:'supplies',label:'固定补给',camera:1000}];
 if(stage===1)for(const state of ['cracking','broken'])variants.push({id:'fragile-'+state,label:state==='cracking'?'脆台开裂':'脆台断开',camera:300,state});
 if([1,7,9,13].includes(stage))variants.push({id:'support',label:'落点近看 · 排除敌人遮挡',camera:Math.max(0,Math.min(overview.width-960,overview.focusX-480))});
 if(overview.realm==='underworld'||stage===10||stage===12)for(const phase of ['quiet','warning','active'])variants.push({id:'hazard-'+phase,label:'地刺 · '+phase,camera:stage===12?1350:600,phase});
 const row={...overview,frames:[],review:{status:'待审',notes:[]}};
 for(const spec of variants){const r=await p.evaluate(({stage,spec})=>{
  const K=Kong,s=K.newRun('MAP-RENDER-1029','staff','wukong');K.enterRoom(s,stage,true);const player=s.player,chief=K.guardian(s);Object.assign(player,{x:spec.camera+270,y:396,grounded:true,invuln:0});
  const ground=s.room.platforms.filter(q=>q.solid),support=ground.find(q=>player.x>=q.x&&player.x+player.w<=q.x+q.w)||ground.map(q=>({q,x:K.clamp(player.x,q.x+4,q.x+q.w-player.w-4)})).sort((a,b)=>Math.abs(a.x-player.x)-Math.abs(b.x-player.x))[0]?.q;player.x=K.clamp(player.x,support.x+4,support.x+support.w-player.w-4);player.y=support.y-player.h;
  if(spec.id==='boss'){chief.dormant=false;chief.phase='idle';chief.timer=1;for(const a of s.room.anchors)a.active=true;}
  if(spec.id==='clear'){for(const e of s.room.enemies)e.hp=0;s.room.camp.used=true;for(const a of s.room.anchors){a.active=true;a.hp=0;}}
  if(spec.id==='support')for(const e of s.room.enemies)e.hp=0;
  if(spec.state)for(const q of s.room.platforms)if(q.fragile){q.crack=spec.state==='cracking'?.5:0;q.cooldown=spec.state==='broken'?1:0;}
  if(spec.phase){const h=s.room.hazards[0];if(h)s.roomTime=({quiet:.8,warning:2,active:2.8}[spec.phase]-h.offset+h.period)%h.period;}
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const renderer=new K.Renderer(canvas),missing=[],calls=[];for(const method of ['mapFrame','v8Frame','cloudFrame','campaignFrame']){const fn=renderer[method];renderer[method]=function(id,...args){const value=fn.call(this,id,...args);calls.push({method,id});if(!value)missing.push({method,id});return value;};}renderer.camera=spec.camera;renderer.clock=1.2;renderer.draw(s,'playing',0);
  const supportInfo=o=>{const bottom=o.y+(o.h||44),floors=s.room.platforms.filter(q=>q.solid&&o.x+(o.w||0)>=q.x&&o.x<=q.x+q.w);return{...o,bottom,supports:floors.map(q=>({x:q.x,y:q.y,w:q.w,delta:bottom-q.y}))};};
  return{png:canvas.toDataURL(),camera:renderer.camera,player:{x:player.x,y:player.y,w:player.w,h:player.h},platforms:s.room.platforms.map(q=>({...q,enabled:K.platformEnabled(q)})),camp:supportInfo({...s.room.camp,x:s.room.camp.x-26,w:52,h:44}),pickups:s.room.pickups.filter(q=>q.enabled!==false&&!q.used).map(supportInfo),hazards:s.room.hazards.map(q=>({...q,phase:K.hazardPhase(s,q)})),anchors:s.room.anchors,calls,missing};
 },{stage,spec});const file='frames/map-'+stage+'-'+spec.id+'.png';fs.writeFileSync(path.join(out,file),Buffer.from(r.png.split(',')[1],'base64'));delete r.png;row.frames.push({...spec,file,...r});}
 report.maps.push(row);fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify(report,null,2)+'\n');console.log('map '+stage+' '+row.frames.length+' frames');
}
}catch(e){report.failure=e.stack;throw e;}finally{await ctx.close();await b.close();fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({version:report.version,maps:report.maps.length,frames:report.maps.reduce((n,m)=>n+m.frames.length,0),missing:report.maps.flatMap(m=>m.frames.flatMap(f=>f.missing)),errors:report.errors,failure:report.failure}));}})().catch(e=>{console.error(e);process.exitCode=1;});
