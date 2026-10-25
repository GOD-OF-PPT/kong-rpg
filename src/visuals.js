(function(K){
  'use strict';
  const Base=K.Renderer;
  const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const poly=(c,pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  K.Renderer=class extends Base{
    constructor(canvas){super(canvas);this.scene=null;this.ui='menu';this.ghosts=new Map();}
    draw(state,ui,dt){this.scene=state;this.ui=ui;super.draw(state,ui,dt);}
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){
      const s=this.scene,p=s?.player;let pose='idle',ghost=false;
      if(kind==='monkey'&&p&&this.ui!=='menu'){
        if(Math.abs(x-p.x)<.2&&Math.abs(y-p.y)<.2){const hurt=s.effects.some(f=>f.kind==='hurt'&&f.life>.20);const elapsed=p.attackDuration-p.attack;pose=p.hp===0?'death':hurt?'hurt':p.dash>0?'dash':p.slam?'heavy':p.attack>0?(elapsed<.055?'windup':elapsed>=.18?'recover':p.comboIndex===3?'heavy':'attack'):!p.grounded?(p.vy<0?'jump':'fall'):Math.abs(p.vx)>30?'run':'idle';}
        else if(s.clone&&Math.abs(x-s.clone.x)<.2){pose=s.clone.timer>.36?'attack':'idle';ghost=true;}else pose='dash';
      }else if(kind!=='monkey'&&s){const e=s.room.enemies.find(e=>e.kind===kind&&Math.abs(e.x-x)<.2);if(e)pose=e.phase.includes('windup')?'windup':['attack','sweep'].includes(e.phase)?'attack':e.phase==='recover'?'recover':'idle';}
      if(pose==='idle')frame=Math.floor(this.clock*2)%4;
      let sprite=K.Art.get(kind,pose,frame,flash);
      if(ghost){const key=pose+frame;if(!this.ghosts.has(key)){const out=document.createElement('canvas');out.width=96;out.height=96;const c=out.getContext('2d');c.drawImage(sprite,0,0);c.globalCompositeOperation='source-atop';c.globalAlpha=.6;c.fillStyle='#78d5cf';c.fillRect(0,0,96,96);this.ghosts.set(key,out);}sprite=this.ghosts.get(key);}
      const c=this.c,height=kind==='boss'?72:kind==='monkey'?44:40;c.save();c.globalAlpha=alpha;c.translate(Math.round(x+12),Math.round(y+height));c.scale(face*(kind==='boss'?1:scale),kind==='boss'?1:scale);if(kind==='boss')c.drawImage(sprite,-48,-88,96,96);else c.drawImage(sprite,-32,-59,64,64);c.restore();
    }
    background(stage){const out=super.background(stage);if(out.dataset.refined)return out;out.dataset.refined='1';const c=out.getContext('2d');
      if(stage===0){for(let x=20;x<960;x+=137){rect(c,x+24,320,5,100,'#2c3e45');for(let j=0;j<3;j++)poly(c,[[x-10,347-j*23],[x+26,276-j*9],[x+63,347-j*23]],'#2e4247');}}
      if(stage===1){for(let i=0;i<9;i++){rect(c,0,378+i*20,960,9,i%2?'#354252':'#3c4657');for(let x=i*31;x<960;x+=150)rect(c,x,384+i*20,65,2,'#63596b');}}
      if(stage===2){for(let x=40;x<960;x+=195){rect(c,x,331,22,113,'#42414e');rect(c,x-7,322,36,9,'#5e535c');rect(c,x+67,350,40,94,'#3e3548');rect(c,x+73,336,27,24,'#50434e');}}
      return out;
    }
    platform(p){super.platform(p);const c=this.c;if(this.scene?.stage===1&&p.solid){for(let x=p.x+28;x<p.x+p.w;x+=102){rect(c,x,450,7,68,'#52494f');rect(c,x+2,452,2,58,'#887164');rect(c,x-18,475,44,3,'#655452');}}}
  };
})(globalThis.Kong ||= {});
