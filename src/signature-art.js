(function(K){
  'use strict';const Base=K.Renderer;
  K.Renderer=class extends Base{
    signatureFrame(id){
      const key='sig:'+id;if(this.frameCache.has(key))return this.frameCache.get(key);const data=K.SignatureFrames[id],im=data&&this.image(data.image);if(!im)return null;
      const c=document.createElement('canvas');c.width=data.r[2];c.height=data.r[3];c.getContext('2d').drawImage(im,...data.r,0,0,c.width,c.height);this.frameCache.set(key,c);return c;
    }
    sigFx(id,x,y,w,h,alpha=1){const im=this.signatureFrame(id);if(!im)return;this.c.save();this.c.globalAlpha*=alpha;this.c.drawImage(im,Math.round(x),Math.round(y),w||im.width,h||im.height);this.c.restore();}
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){
      const s=this.scene,p=s?.player,isPlayer=kind==='monkey'&&p&&Math.abs(x-p.x)<.2&&Math.abs(y-p.y)<.2&&this.ui!=='menu';
      if(isPlayer&&(s.arm||s.flight||p.vaultTime>0)){
        const index=s.flight?(s.flight.age<.16?0:Math.abs(p.vx)>65?2:p.vy>50?3:1):s.arm?.phase==='charge'?0:s.arm?.phase==='thrust'?1:s.arm?.phase==='recover'?2:3,im=this.signatureFrame((K.isRanged(s)?'nezha':'wukong')+index);
        if(im){const c=this.c;c.save();c.globalAlpha=alpha;c.translate(Math.round(x+12),Math.round(y+44));c.scale(face,1);c.drawImage(im,-64,-112);c.restore();
          if(s.arm)this.drawRuyi();if(s.flight)this.sigFx('wind',x-24*face-15,y+35,40,14,.6);return;}
      }
      super.person(kind,x,y,face,frame,alpha,flash,scale);
    }
    drawRuyi(){
      const s=this.scene,a=s.arm,l=K.staffLine(s),c=this.c,dx=l.bx-l.ax,dy=l.by-l.ay,len=Math.hypot(dx,dy),shaft=this.signatureFrame('shaft'),cap=this.signatureFrame('cap');if(!shaft||!cap)return;
      c.save();c.translate(Math.round(l.ax),Math.round(l.ay));c.rotate(Math.atan2(dy,dx));
      for(let x=0;x<Math.max(0,len-19);x+=shaft.width){const w=Math.min(shaft.width,len-19-x);c.drawImage(shaft,0,0,w,shaft.height,Math.round(x),-3,w,7);}
      c.drawImage(cap,Math.round(Math.max(0,len-22)),-4,22,8);c.restore();
      if(a.phase==='charge')this.sigFx('charge',s.player.x-12,s.player.y+4,42,25,.25+a.charge/.6*.45);
      if(a.phase==='thrust'&&a.charge>=.3){const sw=K.has(s,'staff')?70:42;c.save();c.strokeStyle='#f1ce84';c.globalAlpha=.65;c.setLineDash([3,4]);c.strokeRect(Math.min(l.bx,l.bx-a.face*sw),l.by-6,sw,12);c.restore();}
    }
    combatCues(){
      super.combatCues();const s=this.scene;if(!s)return;
      for(const e of s.room.enemies)if(e.hp>0&&!e.dormant){
        if(e.phase==='break-windup')this.mark(K.breakDistanceBox(e));
        if(e.phase==='break-rush')this.mark(K.enemyAttackBox(e),true);
        if(e.phase==='air-windup')for(const b of e.marks){this.mark(b);this.sigFx('air-warning',b.x,b.y,b.w,b.h,.7);}
      }
      for(const b of s.dangers)if(b.source==='莲灯使·锁空莲印')this.sigFx('air-active',b.x,b.y,b.w,b.h,.65);
    }
    fx(f,t){if(f.kind==='staff-tip'){this.sigFx('tip',f.x-19,f.y-19,38,38,Math.min(1,f.life*8));return;}super.fx(f,t);}
  };
})(globalThis.Kong ||= {});
