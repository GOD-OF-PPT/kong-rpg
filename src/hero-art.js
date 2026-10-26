(function(K){
  'use strict';
  const Base=K.Renderer,rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  K.Renderer=class extends Base{
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){
      const s=this.scene,p=s?.player,im=this.image('nezha');if(kind!=='monkey'||!s||!K.isRanged(s)||this.ui==='menu'||!im)return super.person(kind,x,y,face,frame,alpha,flash,scale);
      const elapsed=p.attackDuration-p.attack,index=p.hurt>0?5:p.attack>0?(elapsed<.14?3:4):!p.grounded?2:Math.abs(p.vx)>30?1:s.ring?4:0,c=this.c;
      c.save();c.translate(Math.round(x+12),Math.round(y+44));c.scale(face*scale,scale);c.globalAlpha=alpha;const bob=index===1?Math.sin(this.runCycle*2)*2:0;c.drawImage(im,index*128,0,128,128,-64,-128+bob,128,128);c.restore();
    }
    drawStaffArc(s){if(!K.isRanged(s))super.drawStaffArc(s);}
    combatCues(){
      super.combatCues();const s=this.scene;if(!s)return;const c=this.c;
      for(const e of s.room.enemies)if(e.hp>0&&!e.dormant){
        if(e.phase==='pursuit-windup')this.mark(K.counterBox(e));
        if(e.phase==='pursuit')this.mark(K.enemyAttackBox(e),true);
        if(e.phase==='cross-windup')for(const b of e.marks)this.mark(b);
        if(e.phase==='advance'){const x=e.face>0?e.x+e.w+6:e.x-8;rect(c,x,e.y+3,3,34,'#e0c186');for(let i=0;i<3;i++)rect(c,x+e.face*(9+i*8),e.y+28-i*3,4,2,'#b9aa87');}
      }
      if(s.silk){const b=s.silk;for(let y=0;y<3;y++)for(let x=0;x<b.w;x+=7)rect(c,b.x+x,b.y+10+y*20+Math.sin(x*.055+this.clock*5+y)*6,8,2,y===1?'#f2a285':'#b85154');rect(c,b.x,b.y+b.h-2,b.w,2,'#e1a18b');}
      if(s.ring){const r=s.ring,x=r.x+11,y=r.y+11,col=r.phase==='back'?'#a3eee4':'#ffe1a0';for(let i=0;i<18;i++){const a=i*Math.PI/9+this.clock*8;rect(c,x+Math.cos(a)*12,y+Math.sin(a)*9,3,3,'#78532e');rect(c,x+Math.cos(a)*10,y+Math.sin(a)*7,3,2,col);}const n=Math.hypot(r.vx,r.vy)||1;for(let i=1;i<=3;i++)rect(c,x-r.vx/n*i*10,y-r.vy/n*i*10,4-i,3,col);}
    }
    fx(f,t){const s=this.scene;if(s&&K.isRanged(s)&&['ultimate-aura','ultimate-wave'].includes(f.kind)){const c=this.c,u=1-f.life/f.duration;for(let j=0;j<3;j++)for(let i=0;i<30;i++){const a=i*Math.PI/15+t*(j%2?2:-2),r=f.kind==='ultimate-wave'?300*u:35+u*65;rect(c,f.x+Math.cos(a)*r,f.y-30+Math.sin(a)*r*.25+j*12,5,3,j===1?'#ffe3a4':'#e98d60');}return;}if(f.kind==='silk-cast'||f.kind==='ring-launch')return;super.fx(f,t);}
  };
})(globalThis.Kong ||= {});
