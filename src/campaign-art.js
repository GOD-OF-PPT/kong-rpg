(function(K){
  'use strict';const Base=K.Renderer;
  K.enemyMarkerY=e=>e.chiefId?e.y+e.h-(e.stage%3===2?148:112):e.y-43;
  K.Renderer=class extends Base{
    campaignFrame(id,flash=false){const key='campaign:'+id+':'+flash;if(this.frameCache.has(key))return this.frameCache.get(key);const f=K.CampaignFrames[id],im=f&&this.image(f.image);if(!im)return null;const c=document.createElement('canvas');c.width=f.r[2];c.height=f.r[3];const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,...f.r,0,0,c.width,c.height);if(flash){g.globalCompositeOperation='source-atop';g.fillStyle='#fff0cd';g.globalAlpha=.5;g.fillRect(0,0,c.width,c.height);}this.frameCache.set(key,c);return c;}
    campaignSprite(id,x,y,face=1,alpha=1,flash=false){const im=this.campaignFrame(id,flash),f=K.CampaignFrames[id];if(!im)return false;const c=this.c;c.save();c.globalAlpha*=alpha;c.translate(Math.round(x),Math.round(y));c.scale(face,1);c.drawImage(im,-f.anchor[0],-f.anchor[1]);c.restore();return true;}
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){
      const s=this.scene,e=kind!=='monkey'&&s?.room.enemies.find(e=>e.kind===kind&&Math.abs(e.x-x)<.2);if(!e)return super.person(kind,x,y,face,frame,alpha,flash,scale);
      let id;if(e.chiefId){if(e.stage%3===2){const pose=e.phase==='campaign-windup'?1:e.phase==='campaign-charge'?3:e.phase==='campaign-active'?2:0;id=e.chiefId+'-'+pose;}else id=K.chapter(e.stage).id+'-mini'+e.stage%3;}else id=e.realm+'-role'+e.role;
      const c=this.c;c.save();if(e.phase==='campaign-windup')c.translate(-e.face*2,-1);else if(e.phase==='campaign-charge')c.translate(0,Math.round(Math.sin(this.clock*27)));if(e.phase==='recover')c.translate(0,1);
      if(!this.campaignSprite(id,x+e.w/2,y+e.h,-face,alpha,e.flash>0))throw Error('Missing campaign sprite '+id);c.restore();
    }
    combatCues(){super.combatCues();const s=this.scene;if(!s)return;for(const e of s.room.enemies)if(e.hp>0&&!e.dormant&&e.phase==='campaign-windup')for(const b of e.marks)this.mark(b);}
    drawProjectile(b){const move=K.CAMPAIGN_MOVES[b.spell]||Object.values(K.CAMPAIGN_MOVES).find(m=>b.source?.endsWith('·'+m.name));if(!move)return super.drawProjectile(b);const c=this.c;c.save();c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();this.celestialStamp(move.fx,b.x+b.w/2,b.y+b.h/2,b.w,b.h,1);c.restore();}
    draw(s,ui,dt){super.draw(s,ui,dt);if(!s||ui==='menu')return;const c=this.c;c.save();c.translate(-Math.round(this.camera),0);
      for(const q of s.room.anchors){if(!q.active&&q.hp>0)continue;const realm=q.kind==='writ'?'underworld':q.kind==='pearl'?'dragon':'heaven';if(q.hp>0){this.campaignSprite(realm+'-device',q.x+q.w/2,q.y+q.h,1);c.fillStyle='#261b2f';c.fillRect(q.x-3,q.y-17,34,3);c.fillStyle='#e9bf85';c.fillRect(q.x-3,q.y-17,34*q.hp/q.maxHp,3);}else{c.save();c.globalAlpha=.4;this.campaignSprite(realm+'-device',q.x+q.w/2,q.y+q.h+9,1,.45);c.restore();}}
      for(const e of s.room.enemies)if(e.hp>0&&!e.dormant&&Math.abs(e.x-this.camera)<1200){
        if(e.phase==='campaign-windup'){const m=K.CAMPAIGN_MOVES[e.move];this.celestialStamp(m.fx,e.x+e.w/2+e.face*18,e.y+e.h*.35,28,28,.32);}
        if(e.phase==='campaign-charge'){const b=K.enemyAttackBox(e);c.save();c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();this.celestialStamp(K.CAMPAIGN_MOVES[e.move].fx,b.x+b.w/2,b.y+b.h/2,b.w,b.h,.7);c.restore();}
      }
      for(const d of s.dangers){const move=K.CAMPAIGN_MOVES[d.spell]||Object.values(K.CAMPAIGN_MOVES).find(m=>d.source.endsWith('·'+m.name));if(!move)continue;c.save();c.beginPath();c.rect(d.x,d.y,d.w,d.h);c.clip();this.celestialStamp(move.fx,d.x+d.w/2,d.y+d.h/2,d.w,d.h,.8);c.restore();}
      c.restore();
    }
  };
})(globalThis.Kong ||= {});
