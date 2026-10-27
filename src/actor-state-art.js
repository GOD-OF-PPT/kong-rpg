(function(K){
  'use strict';const Base=K.Renderer;
  K.Renderer=class extends Base{
    actorStateFrame(id){
      const key='actor-state:'+id;if(this.frameCache.has(key))return this.frameCache.get(key);
      const f=K.ActorStateFrames[id],image=f&&this.image(f.image);if(!image)return null;
      const frame=document.createElement('canvas');frame.width=f.r[2];frame.height=f.r[3];
      const c=frame.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,...f.r,0,0,frame.width,frame.height);this.frameCache.set(key,frame);return frame;
    }
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){
      const s=this.scene,p=s?.player,isPlayer=kind==='monkey'&&p&&Math.abs(x-p.x)<.2&&Math.abs(y-p.y)<.2&&this.ui!=='menu';
      const id=isPlayer&&(p.hp<=0?(K.isRanged(s)?'nezha-dead':'wukong-dead'):K.isRanged(s)&&p.ultimate>0?(p.ultimate>.66?'nezha-ultimate-start':'nezha-ultimate-release'):null);
      if(id){const sprite=this.actorStateFrame(id);if(sprite){const c=this.c,[ax,ay]=K.ActorStateFrames[id].anchor;c.save();c.globalAlpha=alpha;c.translate(Math.round(x+12),Math.round(y+44));c.scale(face*scale,scale);c.drawImage(sprite,-ax,-ay);c.restore();return;}}
      super.person(kind,x,y,face,frame,alpha,flash,scale);
    }
    // Draw once after every player pose. Neither the ranged renderer nor the
    // signature-action early returns may drop this mechanically active status.
    drawPlayerStatus(s){
      const p=s.player;if(p.hp<=0||p.ward<=0)return;const c=this.c;c.save();c.fillStyle='#bce5c7';
      for(let i=0;i<12;i++){const a=i*Math.PI/6+this.clock*1.3;c.fillRect(Math.round(p.x+12+Math.cos(a)*26),Math.round(p.y+23+Math.sin(a)*32),3,3);}c.restore();
    }
    drawSlamTrail(s){
      const p=s.player,c=this.c;c.save();
      if(K.isRanged(s)){
        // Two short wheel-fire trails, not the melee hero's solid staff shaft.
        for(const dx of [-6,10]){c.fillStyle='#e99860';c.fillRect(Math.round(p.x+dx+10),Math.round(p.y+26),3,25);c.fillStyle='#ffe4ab';c.fillRect(Math.round(p.x+dx+11),Math.round(p.y+29),1,17);}
      }else{c.fillStyle='#d9a66b';c.fillRect(Math.round(p.x+5),Math.round(p.y+25),14,35);c.fillStyle='#fff0b6';c.fillRect(Math.round(p.x+10),Math.round(p.y+25),4,38);}
      c.restore();
    }
  };
})(globalThis.Kong ||= {});
