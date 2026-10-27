(function(K){
  'use strict';
  const Base=K.Renderer;
  // The generated strip has gutters, not an exact grid. Keep the full staff.
  const {run:RUN,hero:HERO,enemies:ENEMIES}=K.ArtCatalog;
  const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  K.Renderer=class extends Base{
    constructor(canvas){super(canvas);this.scene=null;this.ui='menu';this.imageBackgrounds={};this.frameCache=new Map();this.runCycle=0;}
    draw(state,ui,dt){this.scene=state;this.ui=ui;this.decorDrawn=false;if(ui==='playing'&&state?.player.grounded)this.runCycle+=Math.abs(state.player.vx)*dt/18;super.draw(state,ui,dt);}
    image(key){return K.ImageArt?.images[key];}
    background(stage){
      const key=stage===0?'mountain':stage===1?'ferry':'sanctuary',image=this.image(key);
      if(!image)return super.background(stage);
      if(!this.imageBackgrounds[stage]){
        const out=document.createElement('canvas');out.width=960;out.height=540;const c=out.getContext('2d');c.imageSmoothingEnabled=false;
        c.fillStyle='#263e47';c.fillRect(0,0,960,540);c.globalAlpha=.83;c.drawImage(image,0,0,960,540);c.globalAlpha=1;
        c.fillStyle=stage===3?'#15102155':'#0d1d2330';c.fillRect(0,0,960,540);
        const g=c.createLinearGradient(0,220,0,540);g.addColorStop(0,'#0a182000');g.addColorStop(.52,'#0c1b2840');g.addColorStop(1,stage===3?'#1c1029c0':'#0c1c2bad');c.fillStyle=g;c.fillRect(0,220,960,320);
        this.imageBackgrounds[stage]=out;
      }
      return this.imageBackgrounds[stage];
    }
    frame(kind,pose,variant,flash,ghost){
      const key=[kind,pose,variant,flash,ghost].join(':');if(this.frameCache.has(key))return this.frameCache.get(key);
      const running=kind==='monkey'&&pose==='run'&&this.image('run');
      const image=running||this.image(kind==='monkey'?'wukong':'enemies');if(!image)return null;
      const info=running?RUN[variant%6]:kind==='monkey'?HERO[pose]||HERO.idle:ENEMIES[kind][variant];
      const [sx,sy,sw,sh]=info.r,scale=running?.21:kind==='boss'?.19:kind==='caster'?.125:kind==='monkey'?.17:.153;
      const out=document.createElement('canvas');out.width=192;out.height=144;const c=out.getContext('2d');c.imageSmoothingEnabled=false;
      const x=96+(sx-info.a[0])*scale,y=123+(sy-info.a[1])*scale;
      c.drawImage(image,sx,sy,sw,sh,Math.round(x),Math.round(y),Math.round(sw*scale),Math.round(sh*scale));
      if(flash||ghost){c.globalCompositeOperation='source-atop';c.fillStyle=flash?'#f5e0ad':'#66d5cc';c.globalAlpha=flash?.28:.62;c.fillRect(0,0,out.width,out.height);}
      const mask=document.createElement('canvas');mask.width=192;mask.height=144;const m=mask.getContext('2d');m.drawImage(out,0,0);m.globalCompositeOperation='source-in';m.fillStyle=kind==='monkey'?'#d9bd7a':'#b09ab6';m.fillRect(0,0,192,144);
      c.globalCompositeOperation='destination-over';c.globalAlpha=.25;for(const [dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]])c.drawImage(mask,dx,dy);
      this.frameCache.set(key,out);return out;
    }
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){
      const s=this.scene,p=s?.player;let pose='idle',ghost=false,variant=0;
      if(kind==='monkey'&&p&&this.ui!=='menu'){
        if(Math.abs(x-p.x)<.2&&Math.abs(y-p.y)<.2){const hurt=s.effects.some(f=>f.kind==='hurt'&&f.life>.20),elapsed=p.attackDuration-p.attack;pose=p.hp===0?'death':hurt?'hurt':p.dash>0?'dash':p.slam?'heavy':p.attack>0?(elapsed<.055?'windup':elapsed>=.18?'recover':p.comboIndex===3?'heavy':'attack'):!p.grounded?(p.vy<0?'jump':'fall'):Math.abs(p.vx)>30?'run':'idle';}
        else if(s.clone&&Math.abs(x-s.clone.x)<.2){pose=s.clone.timer>.36?'attack':'idle';ghost=true;}else pose='dash';
      }else if(kind!=='monkey'&&s){const e=s.room.enemies.find(e=>e.kind===kind&&Math.abs(e.x-x)<.2);if(e)variant=e.phase.includes('windup')?1:0;}
      if(pose==='run')variant=Math.floor(this.runCycle)%6;
      const sprite=this.frame(kind,pose,variant,flash,ghost);if(!sprite){super.person(kind,x,y,face,frame,alpha,flash,scale);return;}
      const c=this.c,h=kind==='boss'?72:kind==='monkey'?44:40;
      const breathing=pose==='idle'&&this.ui==='playing'?Math.round(Math.sin(this.clock*2)*.5):0;
      c.save();c.globalAlpha=alpha;c.translate(Math.round(x+12),Math.round(y+h+breathing));c.scale(face*(kind==='boss'?1:scale),kind==='boss'?1:scale);if(pose==='death')c.rotate(-.55);c.drawImage(sprite,-96,-123);c.restore();
    }
    platform(p){
      if(!this.decorDrawn){this.decorDrawn=true;this.combatCues();}
      const image=this.image('stone');if(!image){super.platform(p);return;}
      if(p.x+p.w<this.camera-30||p.x>this.camera+990)return;
      const c=this.c;
      if(p.solid){rect(c,p.x,p.y+24,p.w,p.h-24,'#14232c');rect(c,p.x,p.y+36,p.w,3,'#30404a');for(let x=p.x;x<p.x+p.w;x+=62){rect(c,x+31,p.y+45,2,28,'#23343e');rect(c,x+3,p.y+77,58,2,'#25343c');}}
      const tileW=200,[sx,sy,sw,sh]=K.ArtCatalog.stone.r,src={x:sx,y:sy,w:sw,h:sh};
      for(let x=p.x;x<p.x+p.w;x+=tileW){const w=Math.min(tileW,p.x+p.w-x);c.drawImage(image,src.x,src.y,src.w*w/tileW,src.h,Math.round(x),Math.round(p.y),Math.round(w),p.solid?30:25);}
      rect(c,p.x,p.y,p.w,1,'#d9c394');
    }
    combatCues(){
      const s=this.scene;if(!s)return;const c=this.c;
      for(const e of s.room.enemies){
        if(e.hp<=0)continue;
        if(e.kind==='caster'&&e.phase==='windup'&&Number.isFinite(e.aimX)){
          const dx=e.aimX-e.x,dy=e.aimY-e.y-16;
          for(let i=1;i<12;i++)rect(c,e.x+dx*i/12,e.y+16+dy*i/12,2,2,'#d099b4');
          rect(c,e.aimX-5,e.aimY,10,2,'#e1b0bd');
        }
        if(e.kind==='boss'&&e.phase==='shift-windup'){
          const a=Math.min(e.x,e.shiftTo),b=Math.max(e.x,e.shiftTo)+e.w;
          for(let x=a;x<b;x+=18)rect(c,x,432,10,3,'#dda4ba');
        }
      }
    }
    drawSeal(q){
      const c=this.c;
      if(this.image('props')){
        if(q.hp>0){this.prop('seal',q.x+14,q.y+48,58,53);for(let i=0;i<4;i++)rect(c,q.x+1+i*7,q.y-14,4,3,q.hp>i*14?'#e8b7de':'#594960');if(q.warning){const radius=24+Math.sin(this.clock*23)*4;rect(c,q.x+14-radius,q.y+28,radius*2,2,'#f1b0d0');}}
        else if(q.id===0&&!this.scene.room.midClaimed)this.prop('lamp',q.x+14,q.y+48,34,44);
        else{rect(c,q.x-4,q.y+43,36,5,'#64716d');rect(c,q.x+5,q.y+36,17,8,'#485860');}
        return;
      }
      if(q.hp<=0){rect(c,q.x-4,q.y+43,36,5,'#64716d');return;}
      const key='seal-sprite';if(!this.frameCache.has(key)){const original=this.frame('caster','idle',0,false,false),image=document.createElement('canvas');image.width=192;image.height=144;const ctx=image.getContext('2d');ctx.drawImage(original,0,0);ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.58;ctx.fillStyle='#bd72b4';ctx.fillRect(0,0,192,144);this.frameCache.set(key,image);}
      c.save();c.translate(q.x+14,q.y+48);c.scale(.8,.8);c.drawImage(this.frameCache.get(key),-96,-123);c.restore();
      rect(c,q.x-5,q.y+43,38,5,'#a79477');rect(c,q.x-2,q.y+48,32,3,'#3b4550');
      for(let i=0;i<3;i++)rect(c,q.x+5+i*7,q.y-11,4,3,q.hp>i*14?'#e8b7de':'#594960');
      if(q.warning){const radius=24+Math.sin(this.clock*23)*4;rect(c,q.x+14-radius,q.y+28,radius*2,2,'#f1b0d0');}
    }
    prop(kind,x,bottom,w,h){
      const src=K.ArtCatalog.props[kind].r,c=this.c;
      c.drawImage(this.image('props'),...src,Math.round(x-w/2),Math.round(bottom-h),w,h);
    }
    drawGate(x,open){
      if(!this.image('props'))return;
      const c=this.c;this.prop('gate',x+7,440,138,120);
      if(!open){c.save();c.globalAlpha=.7;rect(c,x-30,344,74,95,'#30213f');c.restore();for(let i=0;i<5;i++)rect(c,x-25+i*15,350,2,85,'#ad6d9d');}
      else{for(let i=0;i<7;i++)rect(c,x+Math.sin(this.clock+i)*22,360+(i*11+this.clock*20)%70,2,3,'#b9e1cc');}
    }
    titleScene(t){
      const c=this.c;const g=c.createLinearGradient(0,0,730,0);g.addColorStop(0,'#0c1524e8');g.addColorStop(.6,'#142033a3');g.addColorStop(1,'#14203300');c.fillStyle=g;c.fillRect(0,0,960,540);
      if(this.image('stone'))c.drawImage(this.image('stone'),...K.ArtCatalog.stone.r,585,479,295,38);
      if(this.image('wukong')){const info=HERO.idle,[sx,sy,sw,sh]=info.r;c.save();c.translate(738,479);c.scale(-.64,.64);c.drawImage(this.image('wukong'),sx,sy,sw,sh,sx-info.a[0],sy-info.a[1],sw,sh);c.restore();}
      else this.person('monkey',714,435,-1,0,1,false,2.8);
      for(let i=0;i<14;i++){const x=620+(i*47)%280+Math.sin(t*.7+i)*5,y=220+(i*59+t*10)%260;rect(c,x,y,1,2,'#dab66d');}
    }
  };
})(globalThis.Kong ||= {});
