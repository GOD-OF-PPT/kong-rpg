(function(K){
  'use strict';
  const Base=K.Renderer,rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  K.Renderer=class extends Base{
    mapFrame(id){
      const key='map:'+id;if(this.frameCache.has(key))return this.frameCache.get(key);
      const data=K.MapFrames[id],image=data&&this.image(data.image);if(!image)return null;
      const [x,y,w,h]=data.r,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,x,y,w,h,0,0,w,h);this.frameCache.set(key,canvas);return canvas;
    }
    mapSprite(id,x,bottom,alpha=1){
      const frame=this.mapFrame(id);if(!frame)return false;
      const c=this.c,[ax,ay]=K.MapFrames[id].anchor;c.save();c.globalAlpha*=alpha;c.drawImage(frame,Math.round(x-ax),Math.round(bottom-ay));c.restore();return true;
    }
    mapStrip(id,x,y,width,height,alpha=1){
      const frame=this.mapFrame(id);if(!frame)return;const c=this.c;c.save();c.globalAlpha*=alpha;
      for(let q=0;q<width;q+=frame.width){const w=Math.min(frame.width,width-q);c.drawImage(frame,0,0,w,frame.height,Math.round(x+q),Math.round(y),w,height||frame.height);}c.restore();
    }
    mapTheme(){return['mountain','ferry','temple','temple'][this.scene?.stage||0];}
    platform(p){
      if(!this.image('mapTerrain'))return super.platform(p);
      if(!this.decorDrawn){this.decorDrawn=true;this.combatCues();}
      if(p.x+p.w<this.camera-35||p.x>this.camera+995)return;
      const c=this.c;
      if(!K.platformEnabled(p)){
        if(p.bridge){
          const frame=this.mapFrame('bridge-off');c.save();c.globalAlpha=.22;
          // Separated, dim stones have no continuous walkable rim before activation.
          for(let x=4;x<p.w-12;x+=32)c.drawImage(frame,0,0,24,24,Math.round(p.x+x),Math.round(p.y+7),24,20);c.restore();
        }else if(p.fragile&&p.cooldown<.5){for(let x=p.x+8;x<p.x+p.w;x+=24)rect(c,x,p.y+12+(x%3),3,2,'#787568');}
        return;
      }
      const theme=this.mapTheme();
      if(p.solid){
        const wall=this.mapFrame('wall-'+theme);c.save();c.translate(Math.round(p.x),Math.round(p.y+22));c.fillStyle='#172933';c.fillRect(0,0,p.w,p.h-22);
        c.globalAlpha=.67;c.fillStyle=c.createPattern(wall,'repeat');c.fillRect(0,0,p.w,p.h-22);c.globalAlpha=1;c.fillStyle=this.scene.stage===3?'#15132770':'#11263350';c.fillRect(0,0,p.w,p.h-22);c.restore();
      }
      if(p.raft){
        const frame=this.mapFrame('raft'),left=Math.min(16,p.w/2),right=left;
        c.drawImage(frame,0,0,left,30,Math.round(p.x),Math.round(p.y),left,30);
        for(let x=left;x<p.w-right;x+=64){const w=Math.min(64,p.w-right-x);c.drawImage(frame,16,0,w,30,Math.round(p.x+x),Math.round(p.y),w,30);}
        c.drawImage(frame,96-right,0,right,30,Math.round(p.x+p.w-right),Math.round(p.y),right,30);
      }else this.mapStrip(p.bridge?'bridge-on':p.fragile?(p.crack>.14?'fragile-cracking':'fragile-ready'):'ledge-'+theme,p.x,p.y,p.w,p.bridge?24:30);
      // This exact top edge is also the simulation's landing surface.
      rect(c,p.x,p.y,p.w,1,p.bridge?'#b0ddce':p.fragile?'#b5a18c':theme==='ferry'?'#ae9271':'#b6b29b');
      if(p.fragile&&p.crack>.35)for(let x=p.x+17;x<p.x+p.w;x+=32)rect(c,x,p.y+18+Math.floor(this.clock*13+x)%7,2,2,'#c5a27b');
    }
    drawHazard(h,phase){
      if(!this.image('mapProps'))return super.drawHazard(h,phase);
      const frame=this.mapFrame('hazard-'+phase),c=this.c,height=phase==='quiet'?7:phase==='warning'?10:h.h;
      c.save();c.beginPath();c.rect(h.x,h.y,h.w,h.h);c.clip();
      c.globalAlpha=phase==='quiet'?.65:phase==='warning'?.78+Math.sin(this.clock*18)*.15:1;
      for(let x=0;x<h.w;x+=32){const w=Math.min(32,h.w-x);c.drawImage(frame,0,0,w,16,Math.round(h.x+x),Math.round(h.y+h.h-height),w,height);}
      if(phase!=='quiet')rect(c,h.x,h.y+h.h-1,h.w,1,phase==='warning'?'#cd87ad':'#ed9ccb');c.restore();
    }
    drawMapProps(){
      const s=this.scene;if(!s)return;const c=this.c,t=s.room.trial,cm=s.room.camp;
      if(t){this.mapSprite('trial-'+t.state,t.x,280);if(t.state==='cleared')for(let i=0;i<4;i++)rect(c,t.x-18+i*12,190-Math.sin(this.clock*3+i)*3,2,2,'#dce9bb');}
      if(cm){this.mapSprite(cm.used?'camp-spent':'camp-lit',cm.x,440);if(!cm.used&&Math.floor(this.clock*6)%3!==0)rect(c,cm.x,392,1,2,'#ffedb6');}
      if(!K.CAMPAIGN&&s.stage===3){const open=s.room.seals.every(q=>q.hp===0);this.mapSprite('arena-pillar',s.room.arena.enter-17,440,open?.38:.9);}
      const guardian=K.guardian(s);if(guardian?.hp>0&&!guardian.dormant)this.mapSprite('arena-pillar',s.room.arena.min-17,440,.8);
    }
    drawLandmarks(){
      const s=this.scene;if(!s||!this.image('mapDressing'))return;
      for(const [i,x]of s.room.landmarks.entries()){
        if(x<this.camera-130||x>this.camera+1090)continue;
        const ground=s.room.platforms.filter(p=>p.solid&&p.w>120).map(p=>({p,x:K.clamp(x,p.x+60,p.x+p.w-60)})).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0];if(!ground||Math.abs(ground.x-x)>160)continue;
        const at=ground.x;
        if([s.room.camp,s.room.trial,s.room.node,...s.room.seals].some(q=>q&&Math.abs(q.x-at)<135)||s.room.hazards.some(q=>Math.abs(q.x-at)<90))continue;
        const theme=K.CAMPAIGN?K.chapter(s.stage).id:this.mapTheme();
        this.mapSprite('dressing-'+theme+'-'+(i%2?'b':'a'),at,ground.p.y+1,.73);
      }
    }
    combatCues(){this.drawLandmarks();super.combatCues();}
    drawPickup(item){
      if(!this.image('mapProps'))return super.drawPickup(item);
      const full=K.pickupInfo(this.scene,item).full,x=item.x+8,bottom=item.y+item.h+Math.round(Math.sin(this.clock*3+item.x)*2);
      rect(this.c,x-5,item.y+item.h+1,10,1,'#1b2b33');this.mapSprite('pickup-'+item.kind,x,bottom,full?.6:1);
    }
  };
})(globalThis.Kong ||= {});
