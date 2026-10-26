const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio-v6/manifest.json'),'utf8')),samples={};
for(const [id,asset] of Object.entries(manifest.assets)){
  const bytes=fs.readFileSync(path.join(root,asset.file));
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw new Error('Audio source hash changed: '+id);
  samples[id]=bytes.toString('base64');
}
fs.writeFileSync(path.join(root,'src/generated-audio.js'),'/* ElevenLabs sources and edit recipes: assets/audio-v6/ */\n(function(K){K.ImpactSamples='+JSON.stringify(samples)+';})(globalThis.Kong ||= {});\n');
// A standalone listening sheet also works under file://, without the game or server.
const labels={'staff-light-a':'轻棍 · 一式','staff-light-b':'轻棍 · 二式变奏','staff-heavy':'重棍 · 三连收势','shield-block':'铜盾 · 格挡','ring-hit-a':'乾坤圈 · 命中','ring-hit-b':'乾坤圈 · 回环变奏','ground-slam':'下劈 · 重棍低频变奏','ultimate-hit':'大神通 · 震击'};
const html='<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>劫后行 · 打击音效试听</title><style>body{background:#101920;color:#ead9b1;font:18px system-ui;max-width:760px;margin:48px auto;padding:0 24px}h1{color:#efba59}article{border-top:1px solid #5f5140;padding:18px 0;display:flex;align-items:center;justify-content:space-between;gap:16px}audio{max-width:58%}p{line-height:1.7;color:#bbc4be}</style><h1>棍影与回环 · 打击音效</h1><p>轻棍、重棍、格挡、飞环、下劈、大神通。下劈与两条变奏由已有素材剪辑；下列为处理后的原声，游戏内另有音量和叠音控制。先降低耳机音量。</p>'+Object.entries(samples).map(([id,b64])=>'<article><label>'+labels[id]+'</label><audio controls preload="none" src="data:audio/wav;base64,'+b64+'"></audio></article>').join('')+'<p>来源：ElevenLabs eleven_text_to_sound_v2 · 五条生成原素材 / 八条发行采样。波形与运行验证不代替主观试听。</p></html>';
fs.mkdirSync(path.join(root,'release'),{recursive:true});fs.writeFileSync(path.join(root,'release/sound-check.html'),html);
console.log('Embedded',Object.keys(samples).length,'impact samples');
