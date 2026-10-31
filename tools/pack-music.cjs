const writeGenerated=require('./write-generated.cjs');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/music/manifest.json'),'utf8')),tracks={};
const external={};
for(const id of ['menu-01','menu-02','gameplay']){
  const track=manifest.tracks[id];if(!track)throw Error('Missing music track: '+id);
  const bytes=fs.readFileSync(path.join(root,track.file));
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==track.sha256)throw Error('Music source hash changed: '+id);
  tracks[id]={src:'data:audio/mpeg;base64,'+bytes.toString('base64'),gain:track.gain};
  external[id]={src:'../'+track.file+'?v='+track.sha256.slice(0,16),gain:track.gain};
}
writeGenerated(path.join(root,'src/generated-music-inline.js'),'/* Standalone music catalogue. */\n(function(K){K.MusicTracks='+JSON.stringify(tracks)+';})(globalThis.Kong ||= {});\n');
writeGenerated(path.join(root,'src/generated-music.js'),'/* Lazy network music URLs. */\n(function(K){const base=document.currentScript.src;K.MusicTracks=Object.fromEntries(Object.entries('+JSON.stringify(external)+').map(([id,t])=>[id,{...t,src:new URL(t.src,base).href}]));})(globalThis.Kong ||= {});\n');
console.log('Embedded',Object.keys(tracks).length,'local music tracks');
