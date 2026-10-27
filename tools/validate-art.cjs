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
for(const file of ['art-catalog','map-data','signature-data','scene-data','actor-states-data','v8-art-data','enemy-marker-data','celestial-art-data','campaign-art-data','audit-art-data'])vm.runInContext(fs.readFileSync(path.join(root,'src',file+'.js'),'utf8'),context);
let count=0;const coverage={};
for(const group of ['ArtFrames','MapFrames','SignatureFrames','SceneFrames','ActorStateFrames','V8Frames','EnemyMarkerFrames','CelestialFrames','CampaignFrames']){
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
fs.writeFileSync(path.join(root,'assets/v8/coverage.json'),JSON.stringify({images:dimensions,frames:coverage,total:count},null,2)+'\n');
console.log('Art integrity:',Object.keys(dimensions).length,'PNG assets;',count,'bounded frames');
