(function(K){
  'use strict';
  const Base=K.Renderer;
  K.Renderer=class extends Base{
    get layeredEnemyEffects(){return true;}
    drawEnemyTerrainEffectsBehind(s){
      for(const e of s.room.enemies)if(e.hp>0&&!e.dormant&&e.phase==='campaign-windup'&&this.enemyProfile(e.move)?.shape==='ground')for(const b of e.marks)this.enemyTelegraph(e,b);
      for(const d of s.dangers)if(this.enemyProfile(d)?.shape==='ground')this.enemyDanger(d);
    }
    drawEnemyEffectsBehind(s){
      for(const e of s.room.enemies)if(e.hp>0&&!e.dormant){if(e.phase==='campaign-windup'&&this.enemyProfile(e.move)?.shape!=='ground')for(const b of e.marks)this.enemyTelegraph(e,b);if(e.phase==='campaign-charge')this.enemyCharge(e);}
      for(const d of s.dangers)if(this.enemyProfile(d)?.shape!=='ground')this.enemyDanger(d);
      for(const b of s.projectiles)if(!b.friendly)this.drawProjectile(b);
    }
    bossEffectFrame(id){
      const key='boss-effect:'+id;if(this.frameCache.has(key))return this.frameCache.get(key);
      const f=K.BossEffectFrames[id],im=f&&this.image(f.image);if(!im)throw Error('Missing boss effect art: '+id);
      const canvas=document.createElement('canvas');canvas.width=f.r[2];canvas.height=f.r[3];canvas.getContext('2d').drawImage(im,...f.r,0,0,canvas.width,canvas.height);this.frameCache.set(key,canvas);return canvas;
    }
    bossEffect(id,x,feet,w,h,alpha=1,face=1,angle=0,glowing=false){
      const image=this.bossEffectFrame(id),c=this.c;c.save();c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;
      c.translate(Math.round(x),Math.round(feet));c.scale(face,1);if(angle)c.rotate(angle);c.drawImage(image,-w/2,-h,w,h);c.restore();
    }
    bossEffectField(id,box,width,height,alpha=1,glowing=false,feet=box.y+box.h){
      const w=Math.min(width,box.w),count=Math.max(1,Math.ceil((box.w-w)/(w*.68))+1);
      for(let i=0;i<count;i++){const x=box.x+w/2+(count===1?0:(box.w-w)*i/(count-1));this.bossEffect(id,x,feet,w,height,alpha,i%2?-1:1,0,glowing);}
    }
    // No enemy range panels, boundary strokes, arrows or safe-lane labels.
    mark(){}
    enemyBoundary(){}
    enemyTelegraph(e,b){
      const s=this.scene,c=this.c,p=this.enemyProfile(e.move);if(!p)return;
      const u=K.clamp(1-e.timer/K.campaignWindup(s,e,e.move,e.repeat>0),0,1),lane=K.bossSafeLane(s,e),cx=b.x+b.w/2,ground=b.y+b.h;
      c.save();
      if(lane){
        if(e.move==='dragon-thunder'){
          this.bossEffectField('storm-cloud',b,145,66,.25+u*.5,false,62);
          if(u>.72)this.bossEffectField('lightning',b,90,75,(u-.7)*.6,true,94);
        }else if(e.move==='judge-chain'){
          this.bossEffectField('soul-chains',b,110,220,.15+u*.35,false,-24+u*200);
          if(b===e.marks[0])this.bossEffect('verdict-seal',(s.room.arena.min+s.room.arena.max)/2,185,100,145,.25+u*.45,1,0,true);
        }else if(e.move==='tower-prison'){
          if(b===e.marks[0])this.bossEffect('pagoda',e.x+e.w/2,180,125,175,.2+u*.45,1,0,true);
          this.bossEffectField('gold-ribbons',b,120,200,.1+u*.25,true,70+u*150);
        }else if(e.move==='axe-quake'){
          this.bossEffectField('dust-wave',b,160,24+u*24,.15+u*.35,false,ground+5);
          if(u>.84)this.bossEffectField('earth-eruption',b,136,(b.h+24)*(u-.84)/.16,1,false,ground+24);
        }else{
          this.bossEffectField('venom-mist',b,160,25+u*45,.15+u*.3,false,ground+5);
        }
      }else if(p.shape==='thunder')this.bossEffect('storm-cloud',cx,65,b.w+42,62,.25+u*.5);
      else if(p.shape==='stamp')this.bossEffect('verdict-seal',cx,b.y-70+(b.h+70)*u,Math.min(110,b.w*.85),Math.min(145,b.h+35),.2+u*.5,1,0,true);
      else if(p.shape==='chain')this.bossEffect('soul-chains',cx,b.y-45+u*b.h,Math.min(75,b.w+20),b.h,.15+u*.4);
      else if(p.shape==='column'&&p.material==='water')this.bossEffect('water-geyser',cx,ground+7,b.w*.9,18+u*32,.18+u*.3);
      else if(p.shape==='column')this.bossEffect('pagoda',cx,b.y+25,Math.min(100,b.w+10),105,.15+u*.35,1,0,true);
      c.restore();
    }
    enemyChargeGlow(e){
      const p=this.enemyProfile(e.move);if(!p)return;const u=K.clamp(1-e.timer/K.campaignWindup(this.scene,e,e.move,e.repeat>0),0,1),x=e.x+e.w/2+e.face*20,y=e.y+e.h*.4;
      if(p.material==='venom')this.bossEffect('venom-mist',x,y+15,35+u*30,25+u*25,.2+u*.35,e.face);
      else if(p.material==='water')this.bossEffect('water-geyser',x,y+15,32,20+u*25,.2+u*.3,e.face);
      else if(p.material==='fire')this.bossEffect('fire-wheel',x,y+20,25+u*25,25+u*25,.2+u*.4,e.face,0,true);
      else if(p.material==='ink')this.bossEffect('verdict-seal',x,y+20,28,38,.2+u*.4,e.face,0,true);
    }
    enemyCharge(e){
      const p=this.enemyProfile(e.move);if(!p)return;const id=p.material==='venom'?'venom-mist':'dust-wave';
      for(let i=0;i<3;i++)this.bossEffect(id,e.x+e.w/2-e.face*(25+i*40),e.y+e.h+8,110+i*12,45+i*9,.35-i*.09,e.face);
    }
    enemyDanger(d){
      const s=this.scene,c=this.c,p=this.enemyProfile(d);if(!p)return false;
      const spell=K.enemySpell(d),owner=K.enemyEffectOwner(s,d),parts=s.dangers.filter(x=>x.source===d.source),lane=owner&&K.bossSafeLane(s,owner,spell,parts),age=K.clamp(.35-d.life,0,.35),fade=Math.max(.15,1-age/.4),cx=d.x+d.w/2,ground=d.y+d.h;
      c.save();
      // Fit complete, soft-edged sprites inside each live region. Cropping a
      // cloud at an AABB edge would recreate a visible rectangular wall.
      if(p.shape==='thunder'){
        this.bossEffectField('storm-cloud',d,155,75,.65*fade,false,d.y+65);
        this.bossEffectField('lightning',d,lane?180:d.w+10,d.h,Math.max(.82,fade),true,ground);
      }else if(p.shape==='stamp'){
        this.bossEffect('verdict-seal',cx,ground+8,Math.min(170,d.w+45),d.h+30,fade,1,0,true);this.bossEffect('spirit-smoke',cx,ground+15,d.w+65,50+age*150,fade*.48);
      }else if(p.shape==='chain'){
        this.bossEffectField('soul-chains',d,120,d.h,fade*.9,false,ground+3);this.bossEffectField('spirit-smoke',d,160,65,fade*.4,false,ground+10);
      }else if(p.shape==='ground'){
        this.bossEffectField('earth-eruption',d,136,d.h+24,1,false,ground+24);this.bossEffectField('dust-wave',d,165,40,fade*.35,false,ground+12);
      }else if(p.shape==='wave'){
        const water=p.material==='water',id=water?'water-geyser':'venom-wave',step=water?95:125;
        this.bossEffectField(id,d,step+60,Math.max(38,d.h+8),fade*(water?.72:.85),false,ground+5);
      }else if(p.shape==='column'){
        if(p.material==='water')this.bossEffect('water-geyser',cx,ground+10,d.w+35,d.h+20,fade*.95);
        else{this.bossEffectField('gold-ribbons',d,145,d.h+12,fade*.85,true,ground+5);if(!lane||d===parts[0])this.bossEffect('pagoda',owner?owner.x+owner.w/2:cx,145,125,175,fade*.75,1,0,true);}
      }else if(p.shape==='slash'){
        const face=owner?.face||1;this.bossEffect('axe-arc',cx,d.y+d.h+10,d.w+30,d.h+30,fade*.85,face,spell==='king-sword'?-.3:0,true);
      }else{c.restore();return super.enemyDanger(d);}
      c.restore();return true;
    }
    drawProjectile(b){
      const p=this.enemyProfile(b);if(!p)return super.drawProjectile(b);const c=this.c,face=b.vx<0?-1:1;c.save();c.translate(b.x+b.w/2,b.y+b.h/2);c.rotate(Math.atan2(b.vy,Math.abs(b.vx))*face);
      if(p.material==='fire')this.bossEffect('fire-wheel',0,b.h*.68,b.w*1.5,b.h*1.5,1,face,0,true);
      else if(p.material==='venom')this.bossEffect('venom-orb',0,b.h*.65,b.w*1.6,b.h*1.35,1,face);
      else if(p.material==='water')this.bossEffect('water-geyser',0,b.h*.6,b.w*1.5,b.h*1.4,.9,face,Math.PI/2);
      else this.enemyStamp('materials:'+p.texture,0,0,Math.max(b.w,b.h)*1.2,1,face);
      c.restore();
    }
  };
})(globalThis.Kong ||= {});
