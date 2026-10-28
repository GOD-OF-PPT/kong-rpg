(function(K){
  'use strict';const Base=K.Renderer;
  K.Renderer=class extends Base{
    v8Frame(id,rim=false){
      const key='v8:'+id+':'+rim;if(this.frameCache.has(key))return this.frameCache.get(key);
      const f=K.V8Frames[id],im=f&&this.image(f.image);if(!im)return null;
      const c=document.createElement('canvas');c.width=f.r[2];c.height=f.r[3];const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,...f.r,0,0,c.width,c.height);
      if(rim)this.enemyRim(c);this.frameCache.set(key,c);return c;
    }
    enemyRim(canvas){
      const c=canvas.getContext('2d'),mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;const m=mask.getContext('2d');m.drawImage(canvas,0,0);m.globalCompositeOperation='source-in';m.fillStyle='#b34f61';m.fillRect(0,0,mask.width,mask.height);c.save();c.globalCompositeOperation='destination-over';c.globalAlpha=.78;for(const [x,y]of [[-1,0],[1,0],[0,-1],[0,1]])c.drawImage(mask,x,y);c.restore();
    }
    frame(kind,...args){const sprite=super.frame(kind,...args);if(sprite&&kind!=='monkey'){const key='rim:'+kind+':'+args.join(':');if(!this.frameCache.has(key)){const c=document.createElement('canvas');c.width=sprite.width;c.height=sprite.height;c.getContext('2d').drawImage(sprite,0,0);this.enemyRim(c);this.frameCache.set(key,c);}return this.frameCache.get(key);}return sprite;}
    guardianFrame(e){const sprite=super.guardianFrame(e),key='rim-guardian:'+e.guardian+':'+e.phase+':'+(e.flash>0);if(!sprite)return sprite;if(!this.frameCache.has(key)){const c=document.createElement('canvas');c.width=sprite.width;c.height=sprite.height;c.getContext('2d').drawImage(sprite,0,0);this.enemyRim(c);this.frameCache.set(key,c);}return this.frameCache.get(key);}
    background(stage){
      const realm=this.scene&&this.ui!=='menu'&&K.realmAt(stage,this.scene.player.x),def=K.REALMS[realm];if(!def)return super.background(stage);
      const key='realm-bg:'+realm;if(this.frameCache.has(key))return this.frameCache.get(key);const im=this.image(def.image);if(!im)return super.background(stage);
      const c=document.createElement('canvas');c.width=960;c.height=540;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,0,0,960,540);g.fillStyle='#0a14293d';g.fillRect(0,0,960,540);const shade=g.createLinearGradient(0,260,0,540);shade.addColorStop(0,'#09152400');shade.addColorStop(1,'#091524ba');g.fillStyle=shade;g.fillRect(0,0,960,540);this.frameCache.set(key,c);return c;
    }
    platform(p){
      const realm=K.realmAt(this.scene.stage,p.x+p.w/2);if(!realm||p.fragile||p.raft||p.bridge)return super.platform(p);
      if(!this.decorDrawn){this.decorDrawn=true;this.combatCues();}if(p.x+p.w<this.camera-40||p.x>this.camera+1000)return;
      const c=this.c,top=this.v8Frame('ledge-'+realm),wall=this.v8Frame('wall-'+realm);if(!top||!wall)return super.platform(p);
      if(p.solid){c.save();c.translate(Math.round(p.x),Math.round(p.y+22));c.fillStyle=c.createPattern(wall,'repeat');c.fillRect(0,0,p.w,p.h-22);c.fillStyle='#0b1a276b';c.fillRect(0,0,p.w,p.h-22);c.restore();}
      for(let x=0;x<p.w;x+=64){const w=Math.min(64,p.w-x);c.drawImage(top,0,0,w,30,Math.round(p.x+x),Math.round(p.y),w,30);}c.fillStyle='#c2c3b0';c.fillRect(Math.round(p.x),Math.round(p.y),p.w,1);
    }
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){
      const s=this.scene,p=s?.player,c=this.c;
      if(kind==='monkey'&&s&&s.hero!=='wukong'&&this.ui!=='menu'){
        const elapsed=p.attackDuration-p.attack,repair=p.hp<=0?null:p.hurt>0?s.hero+'-hurt':s.hero==='nezha'&&p.ultimate>0?(p.ultimate>.66?'nezha-ultimate-start':'nezha-ultimate-release'):s.hero==='erlang'&&p.secondaryPose<=0&&p.attack>0&&p.comboIndex===3?(elapsed<K.attackTiming(p).start?'erlang-heavy-windup':'erlang-heavy-strike'):null;
        if(repair){const im=this.actorStateFrame(repair),f=K.ActorStateFrames[repair];if(im){c.save();c.globalAlpha=alpha;c.translate(Math.round(x+12),Math.round(y+44));c.scale(face*scale,scale);c.drawImage(im,-f.anchor[0],-f.anchor[1]);c.restore();return;}}
        let i=p.hp<=0?7:p.ultimate>0?(s.hero==='erlang'?6:4):p.secondaryPose>0?6:p.attack>0?(p.comboIndex===3?5:p.comboIndex===2?4:3):p.slam?5:!p.grounded?2:Math.abs(p.vx)>35?1:0;
        if(s.hero==='erlang'&&p.secondaryPose>0)i=5;
        const id=(s.hero==='erlang'?'erlang-':'nezha-')+i,im=this.v8Frame(id),f=K.V8Frames[id];
        if(im){c.save();c.globalAlpha=alpha;c.translate(Math.round(x+12),Math.round(y+44));c.scale(face*scale,scale);if(p.hurt>0)c.rotate(-.10);c.drawImage(im,-f.anchor[0],-f.anchor[1]);c.restore();
          if(s.hero==='nezha'&&s.flight){const wheel=this.v8Frame('ring');if(wheel)for(const dx of[-10,15]){c.save();c.translate(Math.round(x+12+dx),Math.round(y+44));c.scale(face,1);c.drawImage(wheel,-22,-7,30,18);c.restore();}this.sigFx('wind',x-30*face,y+42,40,14,.65);}return;}
      }
      const e=s?.room.enemies.find(e=>e.kind===kind&&Math.abs(e.x-x)<.2);
      if(e?.realm){const id=e.realm+'-'+(e.kind==='caster'?1:0),im=this.v8Frame(id,true),f=K.V8Frames[id];if(im){c.save();c.translate(Math.round(x+e.w/2),Math.round(y+e.h));c.scale(-face,1);if(e.phase.includes('windup'))c.rotate(.08);if(e.flash>0)c.globalAlpha=.6;c.drawImage(im,-f.anchor[0],-f.anchor[1]);c.restore();if(e.kind==='shield'&&e.phase!=='recover')this.sigFx('brace',e.face>0?x+e.w-4:x-18,y+8,22,24,.85);return;}}
      super.person(kind,x,y,face,frame,alpha,flash,scale);
    }
    drawStaffArc(s){if(s.hero==='wukong')return super.drawStaffArc(s);const p=s.player,t=K.attackTiming(p),u=p.attackDuration-p.attack;if(u<t.start||u>=t.end)return;const b=K.attackBox(s),c=this.c;c.save();c.globalAlpha=.7;c.fillStyle=s.hero==='nezha'?'#ffd189':'#c9e4eb';for(let i=0;i<18;i++){const x=p.x+12+p.face*(i*b.w/18),y=p.y+18+(p.comboIndex===2?-i/2:p.comboIndex===3?i/3:0);c.fillRect(Math.round(x),Math.round(y),3,2);}c.restore();}
    drawPickup(item){super.drawPickup(item);const q=K.pickupInfo(this.scene,item),c=this.c,x=Math.round(item.x+8),y=Math.round(item.y+item.h+5);c.fillStyle=q.full?'#7d9387':'#83d8a8';c.fillRect(x-8,y,16,1);c.fillRect(x-8,y-3,1,4);c.fillRect(x+7,y-3,1,4);if(!q.full){c.fillRect(x-1,y+2,2,5);c.fillRect(x-3,y+3,6,2);}}
    combatCues(){
      super.combatCues();const s=this.scene;if(!s)return;const c=this.c;
      for(const e of s.room.enemies)if(e.hp>0&&!e.dormant&&K.REALM_PHASES.includes(e.phase))for(const b of e.marks||[])this.mark(b);
      if(s.eye){const b=s.eye;c.save();c.strokeStyle='#90dfe4';c.lineWidth=1;c.setLineDash([5,5]);c.strokeRect(Math.round(b.x),Math.round(b.y),b.w,b.h);c.restore();const im=this.v8Frame('eye');if(im)c.drawImage(im,Math.round(b.x+b.w/2-14),Math.round(b.y-18),28,22);}
    }
    draw(s,ui,dt){super.draw(s,ui,dt);if(!s||ui==='menu')return;const c=this.c;c.save();c.translate(-Math.round(this.camera),0);
      for(const b of s.arrows){const im=this.v8Frame('arrow');if(im){c.save();c.translate(Math.round(b.x),Math.round(b.y));c.rotate(Math.atan2(b.vy,b.vx));c.drawImage(im,-16,-5,32,10);c.restore();}}
      if(s.hound){const h=s.hound,im=this.v8Frame('hound-'+(h.pose==='bite'?3:h.vy<0?2:Math.abs(h.vx)>20?1:0));if(im){c.save();c.translate(Math.round(h.x+18),Math.round(h.y+26));c.scale(h.face,1);c.drawImage(im,-40,-56);c.restore();const badge=this.v8Frame('ally');if(badge)c.drawImage(badge,Math.round(h.x+11),Math.round(h.y-17),14,14);}}
      c.restore();
    }
  };
  K.DialogArtReady=K.DialogArtReady.then(()=>{
    for(const [hero,key]of [['erlang','v8ErlangPortrait'],['nezha','v8NezhaPortrait']]){const im=K.ImageArt.images[key];if(!im)continue;K.DialogPortraits[hero]='url("'+im.src+'")';}
  });
})(globalThis.Kong ||= {});
