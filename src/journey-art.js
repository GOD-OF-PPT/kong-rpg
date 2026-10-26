(function(K){
  'use strict';
  const Base=K.Renderer,rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  K.Renderer=class extends Base{
    combatCues(){
      super.combatCues();const s=this.scene;if(!s)return;const c=this.c,t=s.room.trial,cm=s.room.camp;
      if(t){
        const done=t.state==='claimed',col=done?'#6b7872':t.state==='active'?'#d895bf':'#e3c47f';
        rect(c,t.x-25,276,50,4,'#796d60');rect(c,t.x-15,248,30,28,'#33343f');rect(c,t.x-11,251,22,22,'#685064');
        for(let i=0;i<3;i++){rect(c,t.x-7+i*6,254,3,13,col);rect(c,t.x-8+i*6,264,5,2,col);}
        if(t.state==='cleared')for(let i=0;i<6;i++)rect(c,t.x-22+i*8,238-Math.sin(this.clock*3+i)*4,2,3,'#ffe5a1');
      }
      if(cm){
        rect(c,cm.x-18,433,36,7,'#706b5e');rect(c,cm.x-3,393,6,40,'#7b6c50');rect(c,cm.x-13,387,26,3,'#cab183');rect(c,cm.x-9,390,18,23,cm.used?'#514b46':'#a27c49');
        rect(c,cm.x-5,394,10,14,cm.used?'#716d5d':'#f0d49c');rect(c,cm.x-16,415,32,2,cm.used?'#655d53':'#baa582');
        if(!cm.used)rect(c,cm.x-1,398+Math.sin(this.clock*3)*2,3,6,'#fff0bb');
      }
      if(s.stage===3){const a=s.room.arena;for(let y=290;y<440;y+=15)rect(c,a.enter-3,y,3,7,s.room.seals.some(q=>q.hp>0)?'#b879b2':'#b7c6a1');}
      for(const e of s.room.enemies)if(e.hp>0&&!e.dormant&&e.trait){
        const col={twin:'#edb58c',pulse:'#e4cb89',volley:'#bcace4'}[e.trait],x=e.x+e.w/2,y=e.y-45;
        // Shape signatures remain distinct even without colour.
        if(e.trait==='twin'){for(const dx of[-5,3]){rect(c,x+dx,y,2,9,col);rect(c,x+dx-2,y+7,6,2,col);}}
        if(e.trait==='pulse'){rect(c,x-7,y,14,2,col);rect(c,x-7,y+2,2,7,col);rect(c,x+5,y+2,2,7,col);rect(c,x-5,y+9,10,2,col);}
        if(e.trait==='volley')for(const dx of[-7,0,7])rect(c,x+dx,y+Math.abs(dx)*.5,3,3,col);
        if(e.phase==='chain-windup'){this.mark(K.enemyAttackBox(e));rect(c,x-5,y-7,3,4,'#ffe3a1');rect(c,x+2,y-7,3,4,'#ffe3a1');}
        if(e.trait==='pulse'&&e.phase==='windup'){rect(c,e.face>0?e.x:e.x-250,435,250,2,'#d9bd80');}
        if(e.trait==='volley'&&e.phase==='windup'&&Number.isFinite(e.aimX)){
          const a=Math.atan2(e.aimY-e.y-16,e.aimX-e.x);for(const d of[-.24,0,.24])for(let i=1;i<9;i++)rect(c,e.x+Math.cos(a+d)*i*24,e.y+16+Math.sin(a+d)*i*24,2,2,col);
        }
      }
      // Healing uses a cross, focus a diamond, rage a three-prong flame.
      for(const item of s.room.pickups)if(!item.used&&item.enabled!==false&&item.sourceId!==undefined){
        const x=item.x+8,y=item.y+6+Math.round(Math.sin(this.clock*3+item.x)*3),col=K.DROPS[item.kind].color;
        rect(c,x-7,y-7,14,14,'#222d35');
        if(item.kind==='heal'){rect(c,x-2,y-5,4,10,col);rect(c,x-5,y-2,10,4,col);}
        else if(item.kind==='focus'){for(let i=-4;i<=4;i++)rect(c,x-Math.abs(4-Math.abs(i)),y+i,2*Math.abs(4-Math.abs(i))+1,1,col);}
        else{rect(c,x-4,y-1,8,6,col);rect(c,x-5,y-4,2,5,col);rect(c,x-1,y-6,2,7,col);rect(c,x+3,y-4,2,5,col);}
      }
    }
    fx(f,t){if(f.kind==='drop-rise'){const u=1-f.life/f.duration;for(let i=0;i<5;i++)rect(this.c,f.x-12+i*6,f.y-u*28-(i%2)*5,2,4,f.color);return;}super.fx(f,t);}
  };
})(globalThis.Kong ||= {});
