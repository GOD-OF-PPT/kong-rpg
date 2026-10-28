// Fixed-seed combinations across existing heroes, maps and difficulties. These
// are synthetic fights and save validation, not player preference measurements.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),c=vm.createContext({console});
for(const n of ['content','motion','world','progression','journey','heroes','signature','simulation','challenge','realms','warriors','celestial','campaign-data','route-layouts','campaign-world','campaign-combat','campaign-state','storage'])vm.runInContext(fs.readFileSync(path.join(root,'src',n+'.js'),'utf8'),c);
const K=c.Kong,license={normalClear:{difficulty:'normal',complete:true,levels:15,seconds:1000,hits:0,killed:110,total:110}},rows=[];
for(const hero of ['wukong','nezha','erlang'])for(const difficulty of ['normal','challenge'])for(let stage=0;stage<15;stage++){
 const seed='MIX-'+hero+'-'+difficulty+'-'+stage,s=K.newRun(seed,'cloud',hero,difficulty,license);
 K.enterRoom(s,stage,true);s.campaign.completed=Array.from({length:stage},(_,i)=>i);K.learnArt(s,K.ARTS.find(a=>a.hero===hero).id);
 const g=K.guardian(s);Object.assign(g,{dormant:false,phase:'idle',timer:0});Object.assign(s.player,{x:g.x-100,y:396,grounded:true,focus:100,rage:100,invuln:0});
 const random=K.rng(K.seedNumber(seed));let saves=0,failed=null;
 for(let i=0;i<900&&s.mode==='playing';i++){
  const f=()=>random(),a={left:f()<.25,right:f()<.3,down:f()<.1,jump:f()<.32,jumpPressed:f()<.025,attack:f()<.58,attackPressed:f()<.08,secondaryPressed:f()<.035,clonePressed:f()<.025,ultimatePressed:f()<.018,artPressed:f()<.018,signature:f()<.24,signaturePressed:f()<.022,dashPressed:f()<.025,talismanPressed:f()<.01};
  K.step(s,a);
  if(i%30===0){try{K.validSave(JSON.parse(K.pack(s,license)));saves++;}catch(e){failed={step:i,error:e.message,player:s.player,cast:s.celestial.cast,arm:s.arm,bow:s.bow};break;}}
 }
 rows.push({seed,hero,difficulty,stage,saves,mode:s.mode,hp:s.player.hp,failed});
}
const report={version:K.VERSION,method:'Ninety fixed-seed production mixed-action fights; canonical save validation every 30 steps; not a continuity or human playtest',rows};
const out=path.resolve(root,process.env.SKILL_EVIDENCE_DIR||'evidence/mechanics-recheck-v12/after');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'mixed-actions.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({version:K.VERSION,scenes:rows.length,saveValidations:rows.reduce((n,r)=>n+r.saves,0),failed:rows.filter(r=>r.failed)}));if(rows.some(r=>r.failed))process.exitCode=1;
