(function(K){
  'use strict';const Base=K.Renderer;
  K.Renderer=class extends Base{
    combatCues(){
      super.combatCues();const s=this.scene;if(!s||!K.isChallenge(s))return;const c=this.c;
      for(const e of s.room.enemies)if(e.hp>0&&!e.dormant){
        // Challenge power is integrated into the shared battle seal.
        for(const b of K.challengeWarningBoxes(e)){
          this.mark(b);if(b.h>40)this.sigFx('air-warning',b.x,b.y,b.w,b.h,.5);
          // The second lock has two tabs; it is a new warning, never a mark
          // that follows the player after its geometry was committed.
          c.fillStyle='#f1c48d';const tabs=e.phase==='challenge-echo-windup'?2:1;for(let i=0;i<tabs;i++)c.fillRect(b.x+b.w/2-3+i*7,b.y-7,4,4);
        }
        if(e.phase==='challenge-bolt-windup'){
          const r=K.challengeBladeRay(e);c.save();c.strokeStyle='#e9b18e';c.lineWidth=2;c.setLineDash([6,6]);c.beginPath();c.moveTo(Math.round(r.ax),Math.round(r.ay));c.lineTo(Math.round(r.bx),Math.round(r.by));c.stroke();c.restore();
        }
      }
      for(const d of s.dangers)if(d.source==='莲灯使·追迹莲印'||d.source==='无天·追落莲印')this.sigFx('air-active',d.x,d.y,d.w,d.h,.55);
    }
  };
})(globalThis.Kong ||= {});
