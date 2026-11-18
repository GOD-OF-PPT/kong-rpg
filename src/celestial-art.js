(function(K){
  'use strict';const Base=K.Renderer;
  K.enemyMarkerY=e=>K.isMajor(e)?e.y+e.h-144:e.y-43;
  K.Renderer=class extends Base{
    celestialFrame(id,flash=false){
      const key='celestial:'+id+':'+flash;if(this.frameCache.has(key))return this.frameCache.get(key);
      const f=K.CelestialFrames[id],im=f&&this.image(f.image);if(!im)return null;
      const canvas=document.createElement('canvas');canvas.width=f.r[2];canvas.height=f.r[3];const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(im,...f.r,0,0,canvas.width,canvas.height);
      if(flash){c.globalCompositeOperation='source-atop';c.fillStyle='#fff3d0';c.globalAlpha=.5;c.fillRect(0,0,canvas.width,canvas.height);}this.frameCache.set(key,canvas);return canvas;
    }
    celestialStamp(id,x,y,w,h,alpha=1,angle=0){const im=this.celestialFrame(id);if(!im)return;const c=this.c;c.save();c.globalAlpha*=alpha;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.translate(Math.round(x),Math.round(y));if(angle)c.rotate(angle);c.drawImage(im,-Math.round(w/2),-Math.round(h/2),Math.round(w),Math.round(h));c.restore();}
    celestialActor(id,x,feet,face=1,scale=1,alpha=1,flash=false){const im=this.celestialFrame(id,flash),f=K.CelestialFrames[id];if(!im)return false;const c=this.c;c.save();c.globalAlpha*=alpha;c.translate(Math.round(x),Math.round(feet));c.scale(face*scale,scale);c.drawImage(im,-f.anchor[0],-f.anchor[1]);c.restore();return true;}
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){
      const s=this.scene,p=s?.player,c=this.c,isPlayer=kind==='monkey'&&s&&this.ui!=='menu'&&Math.abs(x-p.x)<.2&&Math.abs(y-p.y)<.2;
      if(isPlayer&&p.hp>0){const cast=s.celestial?.cast;
        if(s.hero==='wukong'&&p.ultimate>0){
          const age=.86-p.ultimate;this.celestialStamp('spin-ring',x+12,y+44,220,45,.6);this.celestialActor(age<.2?'avatar-rise':'avatar-slam',x+12,y+44,face,1.45,.76);
          const idle=this.frame('monkey','idle',0,false,false);if(idle){c.save();c.translate(Math.round(x+12),Math.round(y+44));c.scale(face,1);c.drawImage(idle,-96,-123);c.restore();}return;
        }
        if(cast){const id=cast.id==='sky-staff'?'pole':cast.id==='orbit-staff'?'spin':cast.id==='six-arms'?(cast.echo>0||p.attack>0?'six-strike':'six-ready'):cast.id==='eye-beam'?(cast.age<.32?'beam-ready':'beam-release'):null;
          if(id&&this.celestialActor(id,x+12,y+44,face,1,alpha))return;}
      }
      const e=kind!=='monkey'&&s?.room.enemies.find(e=>e.kind===kind&&Math.abs(e.x-x)<.2);
      if(e&&K.isMajor(e)){const key=e.kind==='boss'?'wutian':e.guardian,pose=e.phase.includes('windup')?0:1;if(this.celestialActor(key+'-'+pose,x+e.w/2,y+e.h,-face,1,alpha,e.flash>0))return;}
      if(e){c.save();if(e.phase.includes('windup'))c.translate(-e.face*2,-1);else if(e.phase==='recover')c.translate(0,1);super.person(kind,x,y,face,frame,alpha,flash,scale);c.restore();return;}
      super.person(kind,x,y,face,frame,alpha,flash,scale);
    }
    drawStaffArc(s){
      const p=s.player,t=K.attackTiming(p),elapsed=p.attackDuration-p.attack;if(elapsed<t.start||elapsed>=t.end)return;
      const b=K.attackBox(s),id=s.hero==='nezha'?'spear-flare':s.hero==='erlang'?'silver-slash':'gold-slash',u=(elapsed-t.start)/(t.end-t.start),c=this.c;
      c.save();c.beginPath();c.rect(b.x-2,b.y-3,b.w+4,b.h+6);c.clip();c.translate(Math.round(p.x+12),Math.round(p.y+23));c.scale(p.face,1);
      this.celestialStamp(id,b.w*.46,0,b.w*1.15,b.h*1.7,1-u*.25,p.comboIndex===2?-.24:p.comboIndex===3?.3:0);c.restore();
    }
    drawProjectile(b){
      const s=this.scene,id=b.friendly?(s.hero==='nezha'?'spear-flare':s.hero==='erlang'?'silver-slash':'gold-slash'):/潮|水/.test(b.source||'')?'water':/风/.test(b.source||'')?'wind':/地波|刀气/.test(b.source||'')?'void-slash':'lotus-orb',c=this.c;
      const x=b.x+b.w/2,y=b.y+b.h/2;c.save();c.globalAlpha=.38;c.fillStyle=b.friendly?'#d7e6bd':'#e39acb';c.fillRect(Math.round(x-Math.sign(b.vx)*b.w*1.1),Math.round(y-1),b.w,2);c.restore();
      // The bright projectile body stays inside its real collision rectangle.
      c.save();c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();this.celestialStamp(id,x,y,b.w,b.h,1);c.restore();
    }
    mark(b,active=false){super.mark(b,active);const c=this.c;c.save();c.globalAlpha=active?.9:.7;c.strokeStyle=active?'#fff0dc':'#ef94bb';c.lineWidth=1;
      for(const xx of [b.x,b.x+b.w-7]){c.beginPath();c.moveTo(Math.round(xx),Math.round(b.y+b.h-10));c.lineTo(Math.round(xx+3),Math.round(b.y+b.h-14));c.lineTo(Math.round(xx+6),Math.round(b.y+b.h-10));c.stroke();}c.restore();
    }
    fx(f,t){
      const u=K.clamp(1-f.life/(f.duration||.42),0,1),a=Math.min(1,(1-u)*1.8);
      if(['hit','heavy-hit','hurt','six-strike'].includes(f.kind)){
        const heavy=f.kind==='heavy-hit',id=f.kind==='hurt'?'injury':f.kind==='six-strike'?'spear-flare':'impact',size=heavy?76:f.kind==='hurt'?58:42;
        this.celestialStamp(id,f.x,f.y,size*(.72+u*.4),size*(.72+u*.4),a,(f.face||1)<0?Math.PI:0);return;
      }
      if(f.kind==='ultimate-aura'){this.celestialStamp(this.scene.hero==='nezha'?'spear-flare':'spin-ring',f.x,f.y-35,210,115,.22*a);return;}
      if(f.kind==='ultimate-wave'){
        const b=K.ultimateBox(this.scene),id=this.scene.hero==='nezha'?'spear-flare':'gold-slash';this.celestialStamp(id,b.x+b.w/2,b.y+b.h/2,b.w,130,a,(f.face||1)<0?Math.PI:0);this.celestialStamp('quake',f.x+(f.face||1)*100,f.y+27,220,75,.8*a);return;
      }
      if(f.kind==='celestial-slam'){for(let i=0;i<7;i++)this.celestialStamp('quake',f.x-420+i*140,f.y-8,170+u*55,72,.8*a);this.celestialStamp('impact',this.scene.player.x+12,f.y-15,130,105,a);return;}
      if(f.kind==='thunder'){this.celestialStamp('lightning',f.x,f.y-76,100,160,a);return;}
      if(f.kind==='clone-swing'){this.celestialStamp('silver-slash',f.x+8,f.y,74,35,a);return;}
      if(f.kind==='ring'){this.celestialStamp(f.fire?'spear-flare':'spin-ring',f.x,f.y-6,80+u*(f.fire?180:100),40+u*20,a);return;}
      if(f.kind==='staff-tip'){this.celestialStamp('impact',f.x,f.y,60,60,a);return;}
      if(f.kind==='reflect'){this.celestialStamp('silver-slash',f.x,f.y,55,55,a);return;}
      super.fx(f,t);
    }
    draw(s,ui,dt){
      super.draw(s,ui,dt);if(!s||ui==='menu')return;const c=this.c,p=s.player,cast=s.celestial.cast,t=s.time;
      const shake=ui==='playing'&&s.shake>0&&this.shake!==false?Math.round(Math.sin(this.clock*140)*s.shake*13):0;
      c.save();c.translate(-Math.round(this.camera)+shake,0);c.imageSmoothingEnabled=false;
      // Existing hero abilities now have characteristic materials and cadence.
      if(s.arm){const l=K.staffLine(s);if(s.arm.phase==='charge')this.celestialStamp('spin-ring',l.ax,l.ay,35+Math.min(1,s.arm.charge/.6)*25,24,.65);if(s.arm.phase==='thrust')this.celestialStamp('gold-slash',l.bx,l.by,44,24,.8);}
      if(s.flight){for(const dx of [-8,14])this.celestialStamp('spear-flare',p.x+12+dx,p.y+42,44,18,.7,Math.PI);}
      if(p.dash>0)this.celestialStamp('wind',p.x+12-p.face*22,p.y+24,75,35,.5,p.face<0?Math.PI:0);
      if(p.slam)this.celestialStamp(s.hero==='nezha'?'spear-flare':'gold-slash',p.x+12,p.y+25,36,76,.7,Math.PI/2);
      if(p.ward>0)this.celestialStamp('spin-ring',p.x+12,p.y+22,68,70,.4);
      if(s.ring)this.celestialStamp('spin-ring',s.ring.x+11,s.ring.y+11,30,24,.95,t*7);
      if(s.silk){const b=s.silk;c.save();c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();this.celestialStamp('silk',b.x+b.w/2,b.y+b.h/2,b.w,b.h,.65);c.restore();}
      if(s.eye&&!this.modernCombatFX){const b=s.eye;this.celestialStamp('silver-slash',b.x+b.w/2,b.y+2,55,24,.5);}
      if(!this.modernCombatFX)for(const arrow of s.arrows)this.celestialStamp('silver-slash',arrow.x-Math.sign(arrow.vx)*10,arrow.y,42,12,.65,Math.atan2(arrow.vy,arrow.vx));
      if(s.hound){const h=s.hound;if(h.pose==='bite')this.celestialStamp('silver-slash',h.x+h.face*18,h.y+12,64,37,.7);else if(Math.abs(h.vx)>120)this.celestialStamp('wind',h.x-h.face*12,h.y+24,38,15,.35);}
      if(cast&&!(this.handlesStaffArts&&['sky-staff','orbit-staff'].includes(cast.id))){const age=cast.age;
        if(cast.id==='sky-staff'){
          const top=p.y+25,bottom=cast.y+44,shaft=this.signatureFrame('shaft'),cap=this.signatureFrame('cap');if(shaft&&bottom>top){c.save();c.translate(Math.round(cast.x+10),Math.round(top));c.rotate(Math.PI/2);const len=bottom-top;for(let x=0;x<len;x+=shaft.width)c.drawImage(shaft,0,0,Math.min(shaft.width,len-x),shaft.height,x,-4,Math.min(shaft.width,len-x),8);if(cap)c.drawImage(cap,len-14,-5,18,10);c.restore();}
          if(age<1.02){this.celestialStamp('spin-ring',cast.x+12,cast.y+44,75,22,.7);if(age>.6)this.celestialStamp('gold-slash',p.x+12,p.y+24,90,120,.55,Math.PI/2);}
        }else if(cast.id==='orbit-staff'){
          const active=age>=.22&&age<1.42,b=K.artOrbitBox(s),w=active?b.w:age<.22?80+age/.22*240:320*(1-K.clamp((age-1.42)/.23,0,1));
          this.celestialStamp('spin-ring',p.x+12,p.y+26,w,active?50:26,active?.95:.5,Math.sin(age*23)*.06);
          if(active){const a=age*32,dx=Math.cos(a)*142;const shaft=this.signatureFrame('shaft'),cap=this.signatureFrame('cap');c.save();c.translate(Math.round(p.x+12),Math.round(p.y+26));c.rotate(Math.sin(a)*.09);if(shaft)for(let xx=-Math.abs(dx);xx<Math.abs(dx);xx+=20)c.drawImage(shaft,0,0,shaft.width,shaft.height,Math.round(xx),-3,20,6);if(cap)for(const sign of [-1,1])c.drawImage(cap,Math.round(sign*Math.abs(dx)-9),-4,18,8);c.restore();}
        }else if(cast.id==='six-arms'){
          this.celestialStamp('spin-ring',p.x+12,p.y+44,105,23,.5);if(age<.35)this.celestialStamp('spear-flare',p.x+12,p.y+6,100,95,(.35-age)*1.8,Math.PI/2);
        }else if(cast.id==='eye-beam'){
          const line=K.artBeamLine(s,cast),ang=Math.atan2(line.by-line.ay,line.bx-line.ax),active=age>=.32&&age<.96;
          for(let i=-1;i<=1;i++)this.celestialStamp('impact',line.ax,line.ay+i*4,active?20:10+age*25,active?16:10+age*25,.85);
          if(active){c.save();c.translate(Math.round(line.ax),Math.round(line.ay));c.rotate(ang);this.celestialStamp('laser',310,0,620,30,.98);for(const yy of [-6,0,6]){c.fillStyle=yy===0?'#efffff':'#7ce5ed';c.globalAlpha=yy===0?.8:.6;c.fillRect(0,yy,620,yy===0?3:1);}c.restore();}
        }
      }
      // Enemy skill material never replaces its locked ground/path boundary.
      for(const e of s.room.enemies){if(e.hp<=0||e.dormant||e.x<this.camera-200||e.x>this.camera+1160)continue;if(this.modernEnemyFX&&e.style==='campaign')continue;
        if(e.phase.includes('windup')||e.phase==='realm-echo'){
          const x=e.x+e.w/2+e.face*15,y=e.y+15;
          this.celestialStamp(e.kind==='caster'||e.kind==='boss'?'lotus-orb':e.guardian==='mountain'?'quake':'void-slash',x,y,e.kind==='boss'?42:25,e.kind==='boss'?42:25,.35+Math.sin(t*10)*.08);
        }
        if(['attack','sweep','lunge','rush','pursuit','break-rush','warden-rush','shift'].includes(e.phase)){
          const b=e.phase==='shift'?e:K.enemyAttackBox(e);c.save();c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();this.celestialStamp(e.guardian==='mountain'?'quake':'void-slash',b.x+b.w/2,b.y+b.h/2,b.w,b.h,.8,e.face<0?Math.PI:0);c.restore();
        }
      }
      for(const d of s.dangers){if(this.modernEnemyFX&&K.enemySpell(d))continue;c.save();c.beginPath();c.rect(d.x,d.y,d.w,d.h);c.clip();const id=/潮|水|涌柱/.test(d.source)?'water':d.h>50?/雷/.test(d.source)?'lightning':'pillar':'void-slash';this.celestialStamp(id,d.x+d.w/2,d.y+d.h/2,d.w,d.h,.75);c.restore();}
      for(const q of K.artManuals(s))if(!q.used){if(this.drawArtManual){this.drawArtManual(q);continue;}const im=this.image('uiScroll'),f=K.ArtCatalog.dialog.scroll;if(im)c.drawImage(im,...f.r,Math.round(q.x-14),Math.round(q.y-26),28,34);const icon=q.art==='sky-staff'?'gold-slash':q.art==='orbit-staff'?'spin-ring':q.art==='six-arms'?'spear-flare':'silver-slash';this.celestialStamp(icon,q.x,q.y-10,22,18,.95);c.fillStyle='#f3d486';c.fillRect(Math.round(q.x-11),Math.round(q.y+9),22,1);}
      c.restore();
    }
  };
})(globalThis.Kong ||= {});
