(function(K){
  'use strict';
  const Base=K.Renderer,rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const COMBO=K.ArtCatalog.combo;
  K.Renderer=class extends Base{
    comboFrame(index,ghost=false){
      const key='combo:'+index+':'+ghost;if(this.frameCache.has(key))return this.frameCache.get(key);const image=this.image('combo');if(!image)return null;
      const out=document.createElement('canvas');out.width=192;out.height=144;const c=out.getContext('2d');c.imageSmoothingEnabled=false;const f=COMBO[index],[x,y,w,h]=f.r,scale=.2;
      c.drawImage(image,x,y,w,h,Math.round(96+(x-f.a[0])*scale),Math.round(123+(y-f.a[1])*scale),Math.round(w*scale),Math.round(h*scale));
      if(ghost){c.globalCompositeOperation='source-atop';c.fillStyle='#63ded4';c.globalAlpha=.7;c.fillRect(0,0,192,144);}this.frameCache.set(key,out);return out;
    }
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){
      const s=this.scene,p=s?.player;
      if(kind==='monkey'&&p&&this.ui!=='menu'&&p.hp>0&&p.hurt<=0&&p.dash<=0&&Math.abs(x-p.x)<.2&&Math.abs(y-p.y)<.2&&(p.attack>0||p.slam)){
        const t=K.attackTiming(p),elapsed=p.attackDuration-p.attack,col=p.slam?1:elapsed<t.start?0:elapsed<t.end?1:2,row=p.slam?2:Math.max(0,p.comboIndex-1),sprite=this.comboFrame(row*3+col);
        if(sprite){const c=this.c;c.save();c.globalAlpha=alpha;c.translate(Math.round(x+12),Math.round(y+44));c.scale(face,1);c.drawImage(sprite,-96,-123);c.restore();return;}
      }
      const enemy=kind!=='monkey'&&s?.room.enemies.find(e=>e.kind===kind&&Math.abs(e.x-x)<.2);
      if(enemy?.recoil>0){const c=this.c;c.save();c.translate(Math.round(enemy.recoilFace*Math.sin(enemy.recoil/.12*Math.PI)*3),0);super.person(kind,x,y,face,frame,alpha,flash,scale);c.restore();}
      else super.person(kind,x,y,face,frame,alpha,flash,scale);
    }
    drawStaffArc(s){
      const p=s.player,t=K.attackTiming(p),elapsed=p.attackDuration-p.attack;if(elapsed<t.start||elapsed>=t.end)return;
      const c=this.c,b=K.attackBox(s),u=(elapsed-t.start)/(t.end-t.start),heavy=p.comboIndex===3,range=b.w;
      for(let i=0;i<24;i++){const q=i/23,x=p.x+12+p.face*(4+q*(range-5));let y=p.y+21;
        if(p.comboIndex===2)y=p.y+36-31*q*q;else if(heavy)y=p.y+4+32*q;
        const fade=q>.5?1:.6;c.globalAlpha=fade*(1-u*.35);rect(c,x,y,heavy?5:3,heavy?5:3,heavy?'#d8953e':'#e9bd64');rect(c,x,y+1,heavy?3:2,1,'#fff2c4');
      }c.globalAlpha=1;
    }
    impactFrame(row,col){
      const key='impact:'+row+':'+col;if(this.frameCache.has(key))return this.frameCache.get(key);const image=this.image('impacts');if(!image)return null;
      const out=document.createElement('canvas');out.width=128;out.height=128;const c=out.getContext('2d');c.imageSmoothingEnabled=false;const r=K.ArtCatalog.impacts[row*4+col].r;c.drawImage(image,...r,0,0,128,128);this.frameCache.set(key,out);return out;
    }
    fx(f,t){
      const age=(f.duration||.42)-f.life,progress=K.clamp(age/(f.duration||.42),0,.999),c=this.c;
      if(['hit','heavy-hit','block','reflect','ring','kill'].includes(f.kind)){
        const row=f.kind==='block'||f.kind==='reflect'?2:f.kind==='ring'?3:f.kind==='heavy-hit'||f.kind==='kill'?1:0,sprite=this.impactFrame(row,Math.min(3,Math.floor(progress*4)));
        if(sprite){const width=f.kind==='ring'?(f.fire?190:115):f.kind==='heavy-hit'?74:f.kind==='kill'?58:f.kind==='reflect'?62:46,height=f.kind==='ring'?65:width;
          c.save();c.globalAlpha=Math.min(1,1.45-progress);c.translate(Math.round(f.x),Math.round(f.y));c.scale(f.face||1,1);c.drawImage(sprite,-width/2,f.kind==='ring'?-height*.88:-height/2,width,height);c.restore();return;}
      }
      if(f.kind==='rubble'||f.kind==='world-rise'){
        const spread=f.kind==='rubble'?f.w||90:100;for(let i=0;i<10;i++){const x=f.x+(i/9-.5)*spread*(.3+progress),y=f.y-(f.kind==='world-rise'?progress*70:Math.sin(progress*Math.PI)*25)+i%3*3;rect(c,x,y,3,3,f.kind==='world-rise'?'#d8d5a0':'#9b8e6b');}return;
      }
      if(f.kind==='clone-swing'){for(let i=0;i<16;i++)rect(c,f.x-24+i*3,f.y+Math.round(Math.sin(i/15*Math.PI)*8),3,2,i%2?'#79c9c6':'#d4fff0');return;}
      super.fx(f,t);
    }
    platform(p){
      if(!K.platformEnabled(p)){
        if(!this.decorDrawn){this.decorDrawn=true;this.combatCues();}
        if(p.fragile&&p.cooldown<.5)for(let x=p.x;x<p.x+p.w;x+=14)rect(this.c,x,p.y,6,1,'#8a8066');return;
      }
      super.platform(p);const c=this.c;
      if(p.fragile){for(let x=p.x+10;x<p.x+p.w;x+=29){rect(c,x,p.y+4,8,2,'#2b2522');rect(c,x+4,p.y+5,2,9,'#2b2522');}if(p.crack>0)rect(c,p.x,p.y,p.w*(1-p.crack/.65),2,'#e6a37b');}
      if(p.raft){rect(c,p.x+4,p.y+15,p.w-8,4,'#765f40');for(let x=p.x+8;x<p.x+p.w;x+=19)rect(c,x,p.y+15,2,6,'#c1a170');}
      if(p.bridge)rect(c,p.x,p.y,p.w,2,'#a6e6d1');
    }
    mark(box,active=false){
      const c=this.c,color=active?'#f3b5d6':'#d596be';rect(c,box.x,box.y+box.h-3,box.w,2,color);
      if(active){for(let i=0;i<7;i++){const x=box.x+i*box.w/7;rect(c,x+3,box.y+6+(i%2)*5,5,box.h-6-(i%2)*5,'#bb64a2');rect(c,x+5,box.y+3+(i%3)*3,2,box.h-3-(i%3)*3,'#f2c9e0');}}
      else{rect(c,box.x,box.y,2,box.h,'#a66e9b');rect(c,box.x+box.w-2,box.y,2,box.h,'#a66e9b');for(let x=box.x+6;x<box.x+box.w;x+=15)rect(c,x,box.y+box.h-7,6,1,color);}
    }
    combatCues(){
      super.combatCues();const s=this.scene;if(!s)return;const c=this.c,n=s.room.node;
      if(n&&Math.abs(n.x-this.camera)<1100&&this.image('nodes')){
        const index=['rescue','bridge','bell'].indexOf(n.id),image=this.image(n.state==='done'?'nodesDone':'nodes')||this.image('nodes'),src=K.ArtCatalog.nodes[index].r,w=index===2?145:115,h=index===2?139:120;
        c.drawImage(image,...src,Math.round(n.x-w/2),440-h,w,h);rect(c,n.x-24,442,48,2,n.state==='done'?'#c7dca7':n.state==='active'?'#d993bf':'#d6b46f');
        if(n.state==='active')for(let i=0;i<n.guards.length;i++)rect(c,n.x-12+i*10,440-h-10,6,3,s.room.enemies.find(e=>e.id===n.guards[i])?.hp>0?'#dea1c8':'#565968');
      }
      for(const e of s.room.enemies)if(e.hp>0){
        if(['rush-windup','lunge-windup'].includes(e.phase))this.mark(K.rushBox(s,e));
        if(['rush','lunge'].includes(e.phase))this.mark(K.enemyAttackBox(e),true);
        if(e.phase==='sigil-windup')this.mark(K.sigilBox(e));
        if(e.phase==='rain-windup')for(const box of e.marks||[])this.mark(box);
      }
      for(const d of s.dangers)this.mark(d,true);
    }
  };
})(globalThis.Kong ||= {});
