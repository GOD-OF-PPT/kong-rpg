(function(K){
  'use strict';const Base=K.Renderer;
  K.Renderer=class extends Base{
    enemyMarkerFrame(id,size,powered=false){
      const key='battle-seal:'+id+':'+size+':'+powered;if(this.frameCache.has(key))return this.frameCache.get(key);
      const f=K.EnemyMarkerFrames[id],image=f&&this.image(f.image);if(!image)return null;
      const glyph=document.createElement('canvas');glyph.width=glyph.height=size;const g=glyph.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(image,...f.r,0,0,size,size);
      if(powered){
        // A fitted cinnabar rim replaces the former separate challenge crown.
        const mask=document.createElement('canvas');mask.width=mask.height=size;const m=mask.getContext('2d');m.drawImage(glyph,0,0);m.globalCompositeOperation='source-in';m.fillStyle='#c6694e';m.fillRect(0,0,size,size);
        g.save();g.globalCompositeOperation='destination-over';for(const [x,y]of [[-1,0],[1,0],[0,-1],[0,1]])g.drawImage(mask,x,y);g.restore();
      }
      this.frameCache.set(key,glyph);return glyph;
    }
    enemyMarkerLayout(s){
      if(!K.showEnemyGuides(s))return [];
      const items=[],camera=Math.round(this.camera);
      for(const e of s.room.enemies){
        if(e.hp<=0||e.dormant||e.x+e.w<camera||e.x>camera+960)continue;
        // realm-echo is a second real windup whose name lacks the suffix.
        // Stun cancels actionable intent until the simulation can resume it.
        const warning=(e.phase.includes('windup')||e.phase==='realm-echo')&&e.stun<=0;
        const powered=K.isChallenge(s)&&!K.isMajor(e),id=K.EnemyMarkerFrames[e.trait]?e.trait:powered?'empowered':warning?'intent':null;
        if(!id)continue;
        const size=warning?34:24,half=size/2;
        items.push({enemy:e,id,warning,powered,size,x:Math.round(K.clamp(e.x+e.w/2-camera,half+3,957-half)),y:Math.round(K.clamp(K.enemyMarkerY?K.enemyMarkerY(e):e.y-43,half+3,537-half))});
      }
      // Prioritise a real attack over a persistent trait. Resolve nearby seals
      // within a short tether, keeping stable positions as the camera moves.
      items.sort((a,b)=>Number(b.warning)-Number(a.warning)||a.enemy.id-b.enemy.id);
      const placed=[];
      for(const q of items){
        const x=q.x,y=q.y,half=q.size/2,clear=(xx,yy)=>xx-half>=3&&xx+half<=957&&yy-half>=3&&yy+half<=537&&!placed.some(p=>Math.abs(p.x-xx)<(p.size+q.size)/2+3&&Math.abs(p.y-yy)<(p.size+q.size)/2+3);
        let done=false;
        for(const [dx,dy]of [[0,0],[0,-38],[-38,0],[38,0],[0,-76],[-38,-38],[38,-38]])if(clear(x+dx,y+dy)){q.x=x+dx;q.y=y+dy;done=true;break;}
        // Search bounded rows for dense crowds; never paint outside the canvas.
        if(!done)for(let yy=half+3;yy<=537-half;yy+=38)if(clear(x,yy)){q.y=yy;done=true;break;}
        if(done)placed.push(q);
      }
      return placed;
    }
    draw(s,ui,dt){
      super.draw(s,ui,dt);if(!s||ui==='menu')return;const c=this.c;
      const shake=ui==='playing'&&s.shake>0&&this.shake!==false?Math.round(Math.sin(this.clock*140)*s.shake*13):0;
      c.save();c.translate(shake,0);c.imageSmoothingEnabled=false;
      for(const q of this.enemyMarkerLayout(s)){
        const x=Math.round(q.x),y=Math.round(q.y),glyph=this.enemyMarkerFrame(q.id,24,q.powered);
        // A single composited seal: persistent identity inside, attack intent
        // outside. No cooldown clock or prediction of a hit is invented here.
        if(q.warning){const rim=this.enemyMarkerFrame('warning',34);if(rim)c.drawImage(rim,x-17,y-17);}
        c.globalAlpha=q.warning?1:.88;if(glyph)c.drawImage(glyph,x-12,y-12);c.globalAlpha=1;
      }
      c.restore();
    }
  };
})(globalThis.Kong ||= {});
