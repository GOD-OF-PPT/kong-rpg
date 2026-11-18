(function(K){
  'use strict';
  const Base=K.Renderer;
  // The reward lamp exists only on the first seal of the three travelling stages.
  // Keep appearance driven by the very same stage/id/claim state as F interaction.
  K.sealVisualState=(s,q)=>q.hp>0?'seal-intact':s.stage<3&&q.id===0?
    (s.room.midClaimed?'seal-lamp-spent':'seal-lamp-ready'):'seal-ruined';
  K.Renderer=class extends Base{
    sceneFrame(id){
      const key='scene:'+id;if(this.frameCache.has(key))return this.frameCache.get(key);
      const data=K.SceneFrames[id],image=data&&this.image(data.image);if(!image)return null;
      const [x,y,w,h]=data.r,frame=document.createElement('canvas');frame.width=w;frame.height=h;
      const c=frame.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,x,y,w,h,0,0,w,h);
      this.frameCache.set(key,frame);return frame;
    }
    drawSeal(q){
      const id=K.sealVisualState(this.scene,q),frame=this.sceneFrame(id);
      if(!frame){super.drawSeal(q);return;}
      const c=this.c,[ax,ay]=K.SceneFrames[id].anchor,x=q.x+q.w/2,bottom=q.y+q.h;
      c.drawImage(frame,Math.round(x-ax),Math.round(bottom-ay));
      if(q.hp<=0)return;
      // Health and warning geometry remain procedural, precise and readable.
      for(let i=0;i<4;i++){c.fillStyle=q.hp>i*14?'#e8b7de':'#594960';c.fillRect(Math.round(q.x+1+i*7),Math.round(q.y-14),4,3);}
      if(q.warning){const radius=24+Math.sin(this.clock*23)*4;c.fillStyle='#f1b0d0';c.fillRect(Math.round(x-radius),Math.round(q.y+28),Math.round(radius*2),2);}
    }
  };
})(globalThis.Kong ||= {});
