(function(K){
  'use strict';
  const Base=K.Renderer;
  const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const poly=(c,points,col)=>{c.fillStyle=col;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  K.Renderer=class extends Base{
    constructor(canvas){super(canvas);this.scene=null;this.ui='menu';this.decorDrawn=false;}
    draw(state,ui,dt){this.scene=state;this.ui=ui;this.decorDrawn=false;super.draw(state,ui,dt);}
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){
      let pose='idle';const s=this.scene,p=s?.player;
      if(kind==='monkey'&&p&&this.ui!=='menu'){
        if(Math.abs(x-p.x)<.2&&Math.abs(y-p.y)<.2)pose=p.hp<=0?'death':p.hurt>0?'hurt':p.dash>0?'dash':p.slam?'heavy':p.attack>0?(p.attackDuration-p.attack<.055?'windup':p.attackDuration-p.attack>=.18?'recover':p.comboIndex===3?'heavy':'attack'):!p.grounded?(p.vy<0?'jump':'fall'):Math.abs(p.vx)>30?'run':'idle';
        else pose=s.clone&&Math.abs(x-s.clone.x)<.2?(s.clone.timer>.36?'attack':'idle'):'dash';
      }else if(kind!=='monkey'&&s){const e=s.room.enemies.find(e=>e.kind===kind&&Math.abs(e.x-x)<.2);if(e)pose=e.phase.includes('windup')?'windup':['attack','sweep','shift'].includes(e.phase)?'attack':e.phase==='recover'?'recover':e.flash>0?'hurt':'idle';}
      if(pose==='idle')frame=Math.floor(this.clock*2)%4;
      const c=this.c;c.save();c.globalAlpha=alpha;const height=kind==='boss'?72:kind==='monkey'?44:40;c.translate(Math.round(x+12),Math.round(y+height));c.scale(face*(kind==='boss'?1:scale),kind==='boss'?1:scale);if(kind==='boss')c.drawImage(K.Art.get(kind,pose,frame,flash),-48,-88,96,96);else c.drawImage(K.Art.get(kind,pose,frame,flash),-30,-55,60,60);c.restore();
    }
    platform(p){
      if(!this.decorDrawn){this.decorDrawn=true;this.landmarks();}
      if(p.x+p.w<this.camera-30||p.x>this.camera+990)return;
      super.platform(p);
      if(this.scene?.stage===1&&p.solid){const c=this.c;for(let x=p.x+30;x<p.x+p.w;x+=100){rect(c,x,448,8,70,'#51484d');rect(c,x+2,450,2,60,'#887064');rect(c,x-20,473,50,4,'#675454');}}
      if(this.scene?.stage===2&&p.solid){const c=this.c;for(let x=p.x+8;x<p.x+p.w;x+=128){rect(c,x,455,80,2,'#606064');rect(c,x+18,459,2,22,'#3e424d');rect(c,x+45,490,50,3,'#4c4a55');}}
    }
    landmarks(){
      const s=this.scene;if(!s)return;const c=this.c,stage=s.stage,t=this.clock;
      if(stage===3){const e=s.room.enemies[0];if(e?.phase==='shift-windup'){const a=Math.min(e.x,e.shiftTo),b=Math.max(e.x,e.shiftTo)+e.w;for(let x=a;x<b;x+=18)rect(c,x,432,10,3,'#c89cab');}}
      for(const e of s.room.enemies)if(e.hp>0&&e.kind==='caster'&&e.phase==='windup'&&Number.isFinite(e.aimX)){const dx=e.aimX-e.x,dy=e.aimY-e.y-16;for(let i=1;i<=9;i++)rect(c,e.x+dx*i/10,e.y+16+dy*i/10,2,2,'#a8759e');rect(c,e.aimX-5,e.aimY,10,2,'#b085aa');}
      if(stage===1){for(let i=0;i<12;i++){const y=463+i*7;const x=this.camera+(Math.sin(i*4+t*.6)*30);rect(c,x,y,960,2,i%2?'#384755':'#445563');}for(let x=0;x<s.room.width;x+=160){rect(c,x+Math.sin(t+x)*5,491,62,2,'#77706c');}}
      for(const x of s.room.landmarks){if(x<this.camera-180||x>this.camera+1120)continue;
        if(stage===0){for(let i=0;i<3;i++){const xx=x+i*45;rect(c,xx,267+i*9,9,173,'#384546');for(let j=0;j<5;j++)poly(c,[[xx-45+j*4,335-j*24],[xx+4,243-j*7],[xx+54-j*4,335-j*24]],j%2?'#344c4c':'#3f5856');}rect(c,x-35,426,110,14,'#4c5958');}
        if(stage===1){rect(c,x-12,246,12,194,'#514952');rect(c,x+110,246,12,194,'#514952');rect(c,x-26,240,164,8,'#867369');poly(c,[[x-36,238],[x-20,232],[x+50,222],[x+136,232],[x+149,238]],'#5b515b');for(let i=0;i<8;i++){rect(c,x+i*16,256,2,75+i%3*7,'#625461');}rect(c,x+45,268,15,32,'#a17b64');rect(c,x+47,270,11,26,'#c3946d');}
        if(stage===2){rect(c,x-20,274,18,166,'#4a4c57');rect(c,x+150,274,18,166,'#4a4c57');rect(c,x-32,261,210,14,'#6c6466');poly(c,[[x-45,258],[x-20,248],[x+70,231],[x+170,248],[x+190,258]],'#514856');rect(c,x+15,293,112,135,'#363647');rect(c,x+60,301,24,32,'#7d7076');rect(c,x+47,333,50,67,'#514653');rect(c,x+30,399,84,15,'#60545d');for(let i=0;i<5;i++)rect(c,x+5+i*27,425,18,15,'#5f5b62');}
      }
      for(const q of s.room.seals){if(q.hp>0&&q.warning){const radius=20+Math.sin(t*23)*4;rect(c,q.x-radius+14,q.y+18,radius*2,2,'#d397bf');}if(q.id===0&&q.hp===0&&!s.room.midClaimed){rect(c,q.x+4,q.y+10,20,26,'#b5ba8e');rect(c,q.x+8,q.y+14,12,17,'#e5dfaa');rect(c,q.x+12,q.y-10,3,12,'#d4d3a0');}}
    }
    background(stage){const out=super.background(stage);if(out.dataset.enriched)return out;out.dataset.enriched='1';const c=out.getContext('2d');
      if(stage===0){for(let x=0;x<960;x+=97){rect(c,x+22,310,5,100,'#2e4147');for(let j=0;j<3;j++)poly(c,[[x-10,337-j*26],[x+25,264-j*11],[x+62,337-j*26]],'#30434a');}}
      if(stage===1){for(let i=0;i<8;i++){rect(c,0,380+i*20,960,12,i%2?'#394355':'#3f4658');for(let x=i*29;x<960;x+=130)rect(c,x,386+i*20,70,2,'#62596a');}}
      if(stage===2){for(let x=0;x<960;x+=180){rect(c,x,330,25,115,'#41404e');rect(c,x-8,321,40,10,'#5c515b');rect(c,x+60,355,44,90,'#3b3547');rect(c,x+69,339,26,24,'#4b414e');}}
      return out;
    }
  };
})(globalThis.Kong ||= {});
