(function(K){
  'use strict';
  const specs={
    'axe-cleave':['slash','steel','cut'], 'axe-quake':['ground','stone','stone-crack'], 'axe-rush':['rush','wind','wind'],
    'judge-mark':['stamp','ink','ink-seal'], 'judge-chain':['chain','ink','chain'], 'judge-echo':['stamp','ink','ink-seal'],
    'venom-fan':['shot','venom','venom'], 'venom-tide':['wave','venom','venom-wave'], 'head-dive':['rush','venom','wind'],
    'dragon-surge':['wave','water','wave'], 'dragon-column':['column','water','water-shaft'], 'dragon-thunder':['thunder','thunder','lightning'],
    'tower-prison':['column','tower','tower-beam'], 'king-sword':['slash','steel','cut'], 'king-fire':['shot','fire','fire-wheel'],
    'shield-wave':['wave','stone','stone-crack'], 'soldier-slash':['slash','steel','cut'], 'soldier-bolt':['shot','wind','bolt'], 'soldier-rush':['rush','steel','wind']
  };
  const palettes={steel:['#ead4a4','#947451','#fff3d9'],stone:['#c6a77c','#765f46','#f0d7a7'],ink:['#a58bbd','#574265','#dfd0ea'],venom:['#b7d764','#526f3d','#e0ec99'],water:['#8ddcde','#3d878e','#daf5ed'],thunder:['#a6d9ed','#5e89b9','#f2f8ee'],tower:['#e2c587','#967945','#fff1c8'],fire:['#efac68','#a6583d','#ffe2ac'],wind:['#b7d9ce','#68938c','#e9f4d9']};
  const cache=new Map();
  K.enemySpell=o=>o.spell&&specs[o.spell]?o.spell:Object.keys(specs).find(id=>o.source?.endsWith('·'+K.CAMPAIGN_MOVES[id].name))||null;
  K.enemyEffectProfile=(spell,realm='cloud')=>{if(!specs[spell])return null;const key=spell+':'+realm;if(cache.has(key))return cache.get(key);const [shape,material,texture]=specs[spell],colors=palettes[material];const p=Object.freeze({spell,realm,shape,material,texture,contact:material==='tower'?'stone':material,colors});cache.set(key,p);return p;};
  K.enemyImpactFamily=source=>{const spell=K.enemySpell({source});return spell?K.enemyEffectProfile(spell).contact:null;};
  K.enemyEffectOwner=(s,d)=>{const spell=K.enemySpell(d),name=d.source?.split('·')[0],candidates=s.room.enemies.filter(e=>e.hp>0&&K.campaignName(e)===name);return candidates.find(e=>e.move===spell&&e.marks?.some(b=>b.x===d.x&&b.y===d.y&&b.w===d.w&&b.h===d.h))||candidates.sort((a,b)=>Math.abs(a.x+a.w/2-d.x-d.w/2)-Math.abs(b.x+b.w/2-d.x-d.w/2))[0];};
})(globalThis.Kong ||= {});
