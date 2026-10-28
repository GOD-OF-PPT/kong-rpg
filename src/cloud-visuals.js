(function(K){
  'use strict';
  const Base=K.Renderer;
  K.staffVisualPhase=cast=>!cast?null:cast.id==='sky-staff'?(cast.age<.18?'sky-plant':cast.age<.78?'sky-rise':cast.age<1.02?'sky-fall':'sky-land'):cast.id==='orbit-staff'?(cast.age<.22?'orbit-ready':cast.age>=1.42?'orbit-finish':Math.floor((cast.age-.22)/.12)%2?'orbit-back':'orbit-forward'):null;
  K.artManualLabels=(s,camera)=>K.artManuals(s).filter(q=>!q.used&&q.x-camera>26&&q.x-camera<934).map(q=>({...q,name:K.artDef(q.art).name,owned:s.celestial.owned.includes(q.art),near:K.nearArtManual(s)?.id===q.id,sx:q.x-camera,sy:385}));
  K.Renderer=class extends Base{
    get handlesStaffArts(){return true;}
    cloudFrame(id){const key='cloud-visual:'+id;if(this.frameCache.has(key))return this.frameCache.get(key);const f=K.CloudFrames[id],image=f&&this.image(f.image);if(!image)return null;const out=document.createElement('canvas');out.width=f.r[2];out.height=f.r[3];out.getContext('2d').drawImage(image,...f.r,0,0,out.width,out.height);this.frameCache.set(key,out);return out;}
    cloudStamp(id,x,feet,alpha=1){const im=this.cloudFrame(id),f=K.CloudFrames[id];if(!im)return;const c=this.c;c.save();c.globalAlpha*=alpha;c.drawImage(im,Math.round(x-f.anchor[0]),Math.round(feet-f.anchor[1]));c.restore();}
    cloudStrip(id,x,y,width){const im=this.cloudFrame(id);if(!im)return;for(let n=0;n<width;n+=im.width){const w=Math.min(im.width,width-n);this.c.drawImage(im,0,0,w,im.height,Math.round(x+n),Math.round(y),w,im.height);}}
    platform(p){
      if(K.realmAt(this.scene.stage,p.x+p.w/2)!=='cloud')return super.platform(p);
      if(!this.decorDrawn){this.decorDrawn=true;this.combatCues();}if(p.x+p.w<this.camera-40||p.x>this.camera+1000)return;
      const c=this.c;if(!K.platformEnabled(p)){if(p.fragile&&p.cooldown<.5){c.fillStyle='#d8e0da';for(let x=p.x+12;x<p.x+p.w;x+=31)c.fillRect(Math.round(x),Math.round(p.y+18+(x%4)),3,2);}return;}
      if(p.solid)this.cloudStrip('cloud-foundation',p.x,p.y,p.w);
      else this.cloudStrip(p.fragile?'cloud-fragile':'cloud-ledge',p.x,p.y,p.w);
      if(p.fragile&&p.crack>.35){c.save();c.fillStyle='#e9d5aa';c.globalAlpha=.75;for(let x=p.x+17;x<p.x+p.w;x+=32)c.fillRect(Math.round(x),Math.round(p.y+22+Math.floor(this.clock*13+x)%7),2,2);c.restore();}
    }
    drawLandmarks(){
      const s=this.scene;if(!s||K.chapter(s.stage).id!=='cloud')return super.drawLandmarks();
      for(const x of s.room.landmarks){if(x<this.camera-80||x>this.camera+1040)continue;const p=s.room.platforms.find(p=>p.solid&&x>p.x+30&&x<p.x+p.w-30);if(!p||s.room.camp&&Math.abs(s.room.camp.x-x)<130)continue;this.cloudStamp('cloud-beacon',x,p.y,.57);}
    }
    drawMapProps(){const s=this.scene;if(!s||K.chapter(s.stage).id!=='cloud')return super.drawMapProps();if(s.room.camp)this.cloudStamp(s.room.camp.used?'cloud-camp-spent':'cloud-camp-lit',s.room.camp.x,440);const chief=K.guardian(s);if(chief?.hp>0&&!chief.dormant)this.cloudStamp('cloud-beacon',s.room.arena.min-12,440,.7);}
    drawGate(x,open){if(K.chapter(this.scene.stage).id!=='cloud')return super.drawGate(x,open);this.cloudStamp('cloud-gate',x+7,440);const c=this.c;c.save();if(!open){c.strokeStyle='#e9d5a2';c.lineWidth=1;c.globalAlpha=.5;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x-30,352+i*25);c.quadraticCurveTo(x+7,335+i*25,x+43,360+i*25);c.stroke();}}else{c.fillStyle='#b9e8dc';for(let i=0;i<5;i++)c.fillRect(Math.round(x+Math.sin(this.clock+i)*23),Math.round(370+(i*13+this.clock*14)%58),1,2);}c.restore();}
    drawArtManual(q){
      const c=this.c,near=K.nearArtManual(this.scene)?.id===q.id;this.cloudStamp('manual-plinth',q.x,440,near?1:.88);c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
      if(q.art==='sky-staff')this.staffRod(q.x,q.y-20,q.x,q.y+9,3);
      else if(q.art==='orbit-staff'){this.staffRod(q.x-13,q.y-2,q.x+13,q.y+2,3);c.strokeStyle='#eacb82';c.lineWidth=1;c.beginPath();c.ellipse(q.x,q.y,15,5,0,0,Math.PI*2);c.stroke();}
      else{const im=this.v8Frame(q.art==='six-arms'?'ring':'eye');if(im)c.drawImage(im,Math.round(q.x-10),Math.round(q.y-14),20,14);}
      if(near){c.fillStyle='#f4d88e';c.fillRect(Math.round(q.x-14),438,28,1);}c.restore();
    }
    staffActor(s,id,alpha){const im=this.cloudFrame(id),f=K.CloudFrames[id],p=s.player,c=this.c;if(!im)return;const face=s.celestial.cast.face;c.save();c.globalAlpha*=alpha;c.translate(Math.round(p.x+12),Math.round(p.y+44));c.scale(face,1);c.drawImage(im,-f.anchor[0],-f.anchor[1]);c.restore();}
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){const s=this.scene,p=s?.player,id=K.staffVisualPhase(s?.celestial?.cast);if(id&&kind==='monkey'&&p.hp>0&&Math.abs(x-p.x)<.2&&Math.abs(y-p.y)<.2){this.staffActor(s,id,alpha);return;}super.person(kind,x,y,face,frame,alpha,flash,scale);}
    staffRod(ax,ay,bx,by,width=6){const c=this.c,dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy);if(length<1)return;c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.translate(ax,ay);c.rotate(Math.atan2(dy,dx));c.lineCap='round';c.strokeStyle='#674127';c.lineWidth=width+2;c.beginPath();c.moveTo(0,0);c.lineTo(length,0);c.stroke();c.strokeStyle='#dba74d';c.lineWidth=width;c.stroke();c.strokeStyle='#f9e4a6';c.lineWidth=Math.max(1,width*.28);c.beginPath();c.moveTo(1,-width*.2);c.lineTo(length-1,-width*.2);c.stroke();for(const x of [0,Math.max(0,length-10)]){c.fillStyle='#e7be64';c.fillRect(x,-width*.65,Math.min(10,length),width*1.3);c.fillStyle='#fff0c3';c.fillRect(x+1,-width*.6,2,width*1.2);}c.restore();}
    staffGrip(s){const id=K.staffVisualPhase(s.celestial.cast),f=K.CloudFrames[id],p=s.player;return{x:p.x+12+(f.grip[0]-80)*s.celestial.cast.face,y:p.y+44+f.grip[1]-112};}
    orbitLayer(s,front){const cast=s.celestial.cast,p=s.player,age=cast.age;if(age<.18||age>=1.5)return;const b=K.artOrbitBox(s),c=this.c,u=age<.22?(age-.18)/.04:age>1.42?1-(age-1.42)/.08:1,w=b.w*K.clamp(u,0,1),im=this.cloudFrame('orbit-trail'+(Math.floor(Math.max(0,age-.22)/.08)%3));if(!im)return;c.save();c.beginPath();c.rect(b.x,front?p.y+24:b.y,b.w,front?b.h-21:21);c.clip();c.globalAlpha*=front?.82:.42;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(im,Math.round(p.x+12-w/2),Math.round(b.y),Math.round(w),b.h);c.restore();}
    drawSlamGround(s,fx){const c=this.c,u=K.clamp(1-fx.life/fx.duration,0,1),origin=fx.originX??s.player.x+12,ground=fx.y,cover=Math.max(origin-(fx.x-480),fx.x+480-origin),im=this.cloudFrame(u<.18?'slam-contact':u<.58?'slam-pressure':'slam-dust');c.save();c.globalAlpha*=Math.max(0,1-u)*.8;c.imageSmoothingEnabled=true;if(im)c.drawImage(im,Math.round(origin-im.width/2),Math.round(ground-im.height*.72),im.width,im.height*.72);for(let i=0;i<2;i++){const r=45+u*cover+i*20;c.beginPath();c.ellipse(origin,ground-2,r,5+u*18,0,0,Math.PI*2);c.strokeStyle=i?'#cda651':'#f6dd9b';c.lineWidth=i?1:2;c.stroke();}c.restore();}
    drawPlayerUnderlay(s){const cast=s.celestial.cast;if(cast?.id==='orbit-staff')this.orbitLayer(s,false);for(const fx of s.effects)if(fx.kind==='celestial-slam')this.drawSlamGround(s,fx);}
    drawPlayerOverlay(s){const cast=s.celestial.cast;if(!cast||!K.staffVisualPhase(cast))return;const c=this.c,p=s.player,grip=this.staffGrip(s);if(cast.id==='sky-staff'){const floor=cast.y+44;if(cast.age<.78)this.staffRod(grip.x,grip.y-12,grip.x,floor,5);else if(cast.age<1.02)this.staffRod(grip.x,grip.y-28,grip.x,Math.min(floor,p.y+63),6);else this.staffRod(grip.x,grip.y-6,grip.x,floor,5);}
      else{this.orbitLayer(s,true);if(cast.age>=.22&&cast.age<1.42){const b=K.artOrbitBox(s),angle=(cast.age-.22)*Math.PI*9,reach=Math.min(grip.x-b.x,b.x+b.w-grip.x)-5,dx=Math.cos(angle)*reach,dy=Math.sin(angle)*13;c.save();c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();this.staffRod(grip.x-dx,grip.y-dy,grip.x+dx,grip.y+dy,5);c.restore();}}
    }
    fx(f,t){if(f.kind==='celestial-slam')return;super.fx(f,t);}
  };
})(globalThis.Kong ||= {});
