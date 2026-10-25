(function(K){
  'use strict';
  const Base=K.Renderer;
  const HERO={
    idle:{r:[85,40,280,405],a:[218,427]},
    run:{r:[430,90,400,355],a:[664,426]},
    jump:{r:[905,60,400,360],a:[1108,384]},
    fall:{r:[1365,90,390,360],a:[1564,443]},
    windup:{r:[30,465,395,370],a:[248,815]},
    attack:{r:[430,490,550,345],a:[651,816]},
    heavy:{r:[430,490,550,345],a:[651,816]},
    recover:{r:[980,495,393,340],a:[1118,816]},
    hurt:{r:[1380,510,370,325],a:[1554,816]},
    death:{r:[1380,510,370,325],a:[1554,816]},
    dash:{r:[430,90,400,355],a:[664,426]}
  };
  const ENEMIES={
    blade:[{r:[0,60,420,395],a:[238,447]},{r:[25,460,395,405],a:[245,852]}],
    shield:[{r:[460,25,442,430],a:[688,447]},{r:[465,457,437,408],a:[688,852]}],
    caster:[{r:[925,15,400,433],a:[1115,435]},{r:[920,450,405,405],a:[1115,840]}],
    boss:[{r:[1350,0,410,453],a:[1558,447]},{r:[1335,447,439,420],a:[1560,852]}]
  };
  const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  K.Renderer=class extends Base{
    constructor(canvas){super(canvas);this.scene=null;this.ui='menu';this.imageBackgrounds={};this.frameCache=new Map();}
    draw(state,ui,dt){this.scene=state;this.ui=ui;super.draw(state,ui,dt);}
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
      const image=this.image(kind==='monkey'?'wukong':'enemies');if(!image)return null;
      const info=kind==='monkey'?HERO[pose]||HERO.idle:ENEMIES[kind][variant];
      const [sx,sy,sw,sh]=info.r,scale=kind==='boss'?.19:kind==='caster'?.125:kind==='monkey'?.17:.153;
      const out=document.createElement('canvas');out.width=192;out.height=144;const c=out.getContext('2d');c.imageSmoothingEnabled=false;
      const x=96+(sx-info.a[0])*scale,y=123+(sy-info.a[1])*scale;
      c.drawImage(image,sx,sy,sw,sh,Math.round(x),Math.round(y),Math.round(sw*scale),Math.round(sh*scale));
      if(flash||ghost){c.globalCompositeOperation='source-atop';c.fillStyle=flash?'#f5e0ad':'#66d5cc';c.globalAlpha=flash?.68:.62;c.fillRect(0,0,out.width,out.height);}
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
      const sprite=this.frame(kind,pose,variant,flash,ghost);if(!sprite){super.person(kind,x,y,face,frame,alpha,flash,scale);return;}
      const c=this.c,h=kind==='boss'?72:kind==='monkey'?44:40;
      const breathing=pose==='idle'&&this.ui==='playing'?Math.round(Math.sin(this.clock*2)*.5):0;
      c.save();c.globalAlpha=alpha;c.translate(Math.round(x+12),Math.round(y+h+breathing));c.scale(face*(kind==='boss'?1:scale),kind==='boss'?1:scale);if(pose==='death')c.rotate(-.55);c.drawImage(sprite,-96,-123);c.restore();
    }
    platform(p){
      const image=this.image('stone');if(!image){super.platform(p);return;}
      if(p.x+p.w<this.camera-30||p.x>this.camera+990)return;
      const c=this.c;
      if(p.solid){rect(c,p.x,p.y+24,p.w,p.h-24,'#14232c');rect(c,p.x,p.y+36,p.w,3,'#30404a');for(let x=p.x;x<p.x+p.w;x+=62){rect(c,x+31,p.y+45,2,28,'#23343e');rect(c,x+3,p.y+77,58,2,'#25343c');}}
      const tileW=200,src={x:90,y:250,w:1990,h:260};
      for(let x=p.x;x<p.x+p.w;x+=tileW){const w=Math.min(tileW,p.x+p.w-x);c.drawImage(image,src.x,src.y,src.w*w/tileW,src.h,Math.round(x),Math.round(p.y),Math.round(w),p.solid?30:25);}
      rect(c,p.x,p.y,p.w,1,'#d9c394');
    }
    drawSeal(q){
      const c=this.c;
      if(q.hp<=0){rect(c,q.x-4,q.y+43,36,5,'#64716d');rect(c,q.x+5,q.y+36,17,8,'#485860');return;}
      const key='seal-sprite';if(!this.frameCache.has(key)){const original=this.frame('caster','idle',0,false,false),image=document.createElement('canvas');image.width=192;image.height=144;const ctx=image.getContext('2d');ctx.drawImage(original,0,0);ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.58;ctx.fillStyle='#bd72b4';ctx.fillRect(0,0,192,144);this.frameCache.set(key,image);}
      c.save();c.translate(q.x+14,q.y+48);c.scale(.8,.8);c.drawImage(this.frameCache.get(key),-96,-123);c.restore();
      rect(c,q.x-5,q.y+43,38,5,'#a79477');rect(c,q.x-2,q.y+48,32,3,'#3b4550');
      for(let i=0;i<3;i++)rect(c,q.x+5+i*7,q.y-11,4,3,q.hp>i*14?'#e8b7de':'#594960');
    }
    titleScene(t){
      const c=this.c;const g=c.createLinearGradient(0,0,730,0);g.addColorStop(0,'#0c1524e8');g.addColorStop(.6,'#142033a3');g.addColorStop(1,'#14203300');c.fillStyle=g;c.fillRect(0,0,960,540);
      if(this.image('stone'))c.drawImage(this.image('stone'),90,250,1990,260,585,479,295,38);
      if(this.image('wukong')){const info=HERO.idle,[sx,sy,sw,sh]=info.r;c.save();c.translate(738,479);c.scale(-.64,.64);c.drawImage(this.image('wukong'),sx,sy,sw,sh,sx-info.a[0],sy-info.a[1],sw,sh);c.restore();}
      else this.person('monkey',714,435,-1,0,1,false,2.8);
      for(let i=0;i<14;i++){const x=620+(i*47)%280+Math.sin(t*.7+i)*5,y=220+(i*59+t*10)%260;rect(c,x,y,1,2,'#dab66d');}
    }
  };
})(globalThis.Kong ||= {});
