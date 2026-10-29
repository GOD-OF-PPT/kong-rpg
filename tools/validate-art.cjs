// Build-time atlas integrity gate: missing assets or out-of-bounds frames must
// fail packaging, rather than silently ship a geometric fallback.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/v8/pack-manifest.json'),'utf8'));
const dimensions={};
for(const [id,asset]of Object.entries(manifest.assets)){
  const data=fs.readFileSync(path.join(root,asset.file));
  if(data.length<33||data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||data.toString('ascii',12,16)!=='IHDR')throw Error('Invalid PNG: '+id);
  dimensions[id]={width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
}
const context=vm.createContext({});
for(const file of ['art-catalog','map-data','realm-dressing-data','signature-data','scene-data','actor-states-data','actor-repair-data','v8-art-data','enemy-marker-data','celestial-art-data','campaign-art-data','audit-art-data','cloud-visual-data','combat-feedback-data','motion-data','enemy-effects-data','combat-identity-data'])vm.runInContext(fs.readFileSync(path.join(root,'src',file+'.js'),'utf8'),context);
let count=0;const coverage={};
for(const group of ['ArtFrames','MapFrames','SignatureFrames','SceneFrames','ActorStateFrames','V8Frames','EnemyMarkerFrames','CelestialFrames','CampaignFrames','CloudFrames','CombatFrames','MotionFrames','EnemyEffectFrames','IdentityFrames']){
  coverage[group]=[];
  for(const [id,frame]of Object.entries(context.Kong[group])){
    const image=dimensions[frame.image],[x,y,w,h]=frame.r;
    if(!image||![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>image.width||y+h>image.height)throw Error('Invalid atlas frame '+group+':'+id);
    if(frame.anchor){const [ax,ay]=frame.anchor;if(![ax,ay].every(Number.isFinite)||ax<0||ay<0||ax>w||ay>h)throw Error('Invalid local anchor: '+id);}
    if(frame.a){const [ax,ay]=frame.a;if(![ax,ay].every(Number.isFinite)||ax<x||ay<y||ax>x+w||ay>y+h)throw Error('Invalid source anchor: '+id);}
    coverage[group].push({id,...frame});
    count++;
  }
}
for(const id of ['seal-intact','seal-ruined','seal-lamp-ready','seal-lamp-spent'])if(!context.Kong.SceneFrames[id])throw Error('Missing seal state: '+id);
for(const id of ['wukong-dead','nezha-dead','nezha-ultimate-start','nezha-ultimate-release'])if(!context.Kong.ActorStateFrames[id])throw Error('Missing actor state: '+id);
for(const id of ['erlang-heavy-windup','erlang-heavy-strike','erlang-hurt','nezha-hurt'])if(!context.Kong.ActorStateFrames[id])throw Error('Missing repair pose: '+id);
// A valid atlas may still omit a live state. Check the campaign's required
// actor families, not just whatever happened to be registered in the atlas.
vm.runInContext(fs.readFileSync(path.join(root,'src/campaign-data.js'),'utf8'),context);
const required=(group,id)=>{if(!context.Kong[group][id])throw Error('Missing live art state '+group+':'+id);};
for(const chapter of context.Kong.CAMPAIGN){
  for(let pose=0;pose<4;pose++)required('CampaignFrames',chapter.boss+'-'+pose);
  for(let role=0;role<3;role++)required('CampaignFrames',chapter.id+'-role'+role);
  for(let mini=0;mini<2;mini++)required('CampaignFrames',chapter.id+'-mini'+mini);
  for(let row=0;row<5;row++)for(let pose=0;pose<6;pose++)required('MotionFrames',chapter.id+'-'+row+'-'+pose);
}
for(const hero of ['nezha','erlang']){
  for(let row=0;row<5;row++)for(let pose=0;pose<4;pose++)required('MotionFrames',hero+'-'+row+'-'+pose);
  required('V8Frames',hero+'-7');
}
for(const realm of ['underworld','dragon','heaven'])for(const suffix of ['device','device-broken'])required('CampaignFrames',realm+'-'+suffix);
for(const kind of ['heal','focus','rage'])required('MapFrames','pickup-'+kind);
for(const kind of ['quiet','warning','active'])required('MapFrames','hazard-'+kind);
for(const realm of ['underworld','water','dragon','heaven'])for(const variant of ['a','b'])if(!context.Kong.MapFrames['dressing-'+realm+'-'+variant])throw Error('Missing realm dressing: '+realm+'-'+variant);
fs.writeFileSync(path.join(root,'assets/v8/coverage.json'),JSON.stringify({images:dimensions,frames:coverage,total:count},null,2)+'\n');
console.log('Art integrity:',Object.keys(dimensions).length,'PNG assets;',count,'bounded frames');

for(const name of ['wukong','nezha','erlang'])for(let row=0;row<3;row++)for(let col=0;col<4;col++)required('IdentityFrames',name+'-'+row+'-'+col);
for(const name of ['juling','qinguang','ninehead','dragonking','litian'])for(let row=0;row<3;row++)for(let col=0;col<3;col++)required('IdentityFrames',name+'-'+row+'-'+col);
