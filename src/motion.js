(function(K){
  'use strict';
  K.attackPhase=p=>{if(p.attack<=0)return'idle';const t=K.attackTiming(p),age=p.attackDuration-p.attack;return age<t.start?'windup':age<t.start+(t.end-t.start)*.55?'strike':age<t.end?'follow':'recover';};
  K.heroMotion=(s,distance=s.player.x)=>{const p=s.player;if(p.hp<=0)return null;if(p.hurt>0)return[4,2];if(p.ultimate>0||p.secondaryPose>0||p.eyePose>0||s.arm||s.flight||s.celestial.cast||p.slam)return null;if(p.attack>0&&K.attackPhase(p)==='recover'&&p.grounded&&Math.abs(p.vx)>20)return[0,Math.floor(Math.abs(distance)/12)%4];if(p.attack>0)return[p.comboIndex,{windup:0,strike:1,follow:2,recover:3}[K.attackPhase(p)]];if(!p.grounded)return[4,p.vy<0?0:1];if(Math.abs(p.vx)>20)return[0,Math.floor(Math.abs(distance)/12)%4];return[4,3];};
  K.enemyMotion=e=>e.phase==='campaign-charge'||e.phase==='campaign-active'?3:e.recoil>0&&!e.chiefId?5:e.phase==='campaign-windup'?2:e.phase==='recover'?4:Math.abs(e.x-(e.lastX??e.x))>.01?Math.floor(Math.abs(e.x-e.origin)/10)%2:0;
})(globalThis.Kong ||= {});
