const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/music/manifest.json'),'utf8')),tracks={};
for(const id of ['menu-01','menu-02','gameplay']){
  const track=manifest.tracks[id];if(!track)throw Error('Missing music track: '+id);
  const bytes=fs.readFileSync(path.join(root,track.file));
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==track.sha256)throw Error('Music source hash changed: '+id);
  tracks[id]={src:'data:audio/mpeg;base64,'+bytes.toString('base64'),gain:track.gain};
}
fs.writeFileSync(path.join(root,'src/generated-music.js'),'/* User-provided MP3s. Sources and levels: assets/music/manifest.json */\n(function(K){K.MusicTracks='+JSON.stringify(tracks)+';})(globalThis.Kong ||= {});\n');
console.log('Embedded',Object.keys(tracks).length,'local music tracks');
