(function(K){
  'use strict';
  // Workspace-owned ImageGen RGBA atlas. Keep source alpha and sample once at
  // the actual display size; do not smooth or create an independent cue layer.
  K.EnemyMarkerFrames=Object.fromEntries(['twin','pulse','volley','empowered','intent','warning'].map((id,i)=>[id,{image:'enemyBattleSeals',r:[i%3*512,Math.floor(i/3)*512,512,512]}]));
})(globalThis.Kong ||= {});
