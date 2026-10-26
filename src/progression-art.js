(function(K){
  'use strict';
  const Base=K.Renderer,rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  // Shared scale and measured foot anchors. The overlapping third row is excluded.
  const GUARDIAN_FRAMES=[
    [{r:[33,85,399,297],a:[270,378]},{r:[94,430,356,375],a:[274,800]}],
    [{r:[485,90,385,292],a:[675,378]},{r:[500,452,384,354],a:[690,800]}],
    [{r:[885,82,325,300],a:[1076,378]},{r:[940,486,290,320],a:[1090,800]}]
  ];
  K.Renderer=class extends Base{
    guardianFrame(e){
      const image=this.image('guardians');if(!image)return null;
      const col=K.GUARDIANS.findIndex(d=>d.id===e.guardian),row=e.phase==='warden-windup'?1:0,key='guardian:'+col+':'+row+':'+(e.flash>0);
      if(this.frameCache.has(key))return this.frameCache.get(key);
      const out=document.createElement('canvas');out.width=192;out.height=168;const c=out.getContext('2d');c.imageSmoothingEnabled=false;const info=GUARDIAN_FRAMES[col][row],[x,y,w,h]=info.r,scale=.34;
      c.drawImage(image,x,y,w,h,Math.round(96+(x-info.a[0])*scale),Math.round(145+(y-info.a[1])*scale),Math.round(w*scale),Math.round(h*scale));
      if(e.flash>0){c.globalCompositeOperation='source-atop';c.fillStyle='#fff0c4';c.globalAlpha=.5;c.fillRect(0,0,192,168);}this.frameCache.set(key,out);return out;
    }
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){
      const s=this.scene,p=s?.player,c=this.c;
      if(kind==='warden'){
        const e=s.room.enemies.find(e=>e.kind==='warden'),sprite=this.guardianFrame(e);if(!sprite)return;
        c.save();c.translate(Math.round(x+e.w/2),Math.round(y+e.h));c.scale(-face,1);if(e.phase==='warden-rush')c.rotate(-.10);c.drawImage(sprite,-96,-145);c.restore();return;
      }
      if(kind==='monkey'&&p?.ultimate>0&&Math.abs(x-p.x)<.2&&Math.abs(y-p.y)<.2){
        const elapsed=.86-p.ultimate,col=elapsed<.2?0:elapsed<.5?1:2,index=6+col,key='avatar:'+index;let giant=this.frameCache.get(key);
        if(!giant){const original=this.comboFrame(index);if(original){giant=document.createElement('canvas');giant.width=192;giant.height=144;const g=giant.getContext('2d');g.drawImage(original,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#f1cc76';g.fillRect(0,0,192,144);this.frameCache.set(key,giant);}}
        if(giant){c.save();c.translate(Math.round(x+12),Math.round(y+44));c.scale(face*2.25,2.25);c.globalAlpha=.26;c.drawImage(giant,-96,-123);c.restore();}
      }
      super.person(kind,x,y,face,frame,alpha,flash,scale);
      if(kind==='monkey'&&p?.ward>0&&Math.abs(x-p.x)<.2&&Math.abs(y-p.y)<.2){for(let i=0;i<12;i++){const a=i*Math.PI/6+this.clock*1.3;rect(c,x+12+Math.cos(a)*26,y+23+Math.sin(a)*32,3,3,'#bce5c7');}}
    }
    drawGate(x,open){super.drawGate(x,open&&!(K.guardian(this.scene)?.hp>0));}
    combatCues(){
      super.combatCues();const s=this.scene;if(!s)return;const c=this.c,e=K.guardian(s);
      if(e?.hp>0&&!e.dormant){
        for(let y=345;y<440;y+=14)rect(c,s.room.arena.min-10,y,3,7,'#bea074');
        if(e.phase==='warden-windup'){
          for(const box of e.marks)this.mark(box);
          if(e.move==='fan')for(const v of[-95,0,95])for(let i=1;i<11;i++)rect(c,e.x+24+e.face*i*22,e.y+25+v/225*i*22,2,2,'#c594be');
        }
        if(e.phase==='warden-rush')this.mark(K.wardenAttackBox(e),true);
      }
      for(const spell of s.casts){rect(c,spell.x,spell.y+spell.h-3,spell.w,2,'#9be1e3');for(let y=spell.y;y<spell.y+spell.h;y+=14){rect(c,spell.x,y,1,5,'#75bac3');rect(c,spell.x+spell.w-1,y,1,5,'#75bac3');}}
    }
    fx(f,t){
      const c=this.c,u=K.clamp(1-f.life/f.duration,0,1);
      if(f.kind==='ultimate-aura'){for(let i=0;i<14;i++){const a=i*Math.PI/7+u*.7,r=35+u*65;rect(c,f.x+Math.cos(a)*r,f.y-20+Math.sin(a)*r*.7,3,7,'#d8b867');}return;}
      if(f.kind==='ultimate-wave'){
        c.save();c.globalAlpha=1-u;for(let i=0;i<28;i++){const q=i/27,x=f.x+(f.face||1)*(5+q*300),y=f.y-45+q*86;rect(c,x,y,8,4,'#d69e40');rect(c,x,y+1,6,2,'#fff2ba');if(i%3===0)rect(c,x,y-15-u*30,2,7,'#edcc7e');}c.restore();return;
      }
      if(f.kind==='thunder'){for(let i=0;i<11;i++){const x=f.x+(i%2?-8:8)*(1-u),y=f.y-150+i*14;rect(c,x,y,4,17,'#9adce7');rect(c,x+1,y,2,15,'#edffff');}for(let i=0;i<8;i++)rect(c,f.x+(i-4)*11,f.y-5-(i%2)*6,5,2,'#a1e9df');return;}
      if(f.kind==='thunder-mark'||f.kind==='ward')return;
      super.fx(f,t);
    }
  };
})(globalThis.Kong ||= {});
