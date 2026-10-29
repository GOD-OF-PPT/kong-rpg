(function(K){
  'use strict';
  const Base=K.Renderer;
  const bossRows={juling:['axe-cleave','axe-quake','axe-rush'],qinguang:['judge-mark','judge-chain','judge-echo'],ninehead:['venom-fan','venom-tide','head-dive'],dragonking:['dragon-column','dragon-surge','dragon-thunder'],litian:['king-sword','tower-prison','king-fire']};
  const palettes={wukong:['#fff0bc','#dcac53','#95703a'],nezha:['#fff3c9','#ef9448','#bc4934'],erlang:['#f4fffb','#acd9dc','#698f9f']};
  K.Renderer=class extends Base{
    identityFrame(id,flash=false,rim=false){const key='identity:'+id+':'+flash+':'+rim;if(this.frameCache.has(key))return this.frameCache.get(key);const f=K.IdentityFrames[id],im=f&&this.image(f.image);if(!im)return null;const out=document.createElement('canvas');out.width=f.r[2];out.height=f.r[3];const c=out.getContext('2d');c.drawImage(im,...f.r,0,0,out.width,out.height);if(flash){c.globalCompositeOperation='source-atop';c.globalAlpha=.4;c.fillStyle='#fff3cc';c.fillRect(0,0,out.width,out.height);}if(rim)this.enemyRim(out);this.frameCache.set(key,out);return out;}
    identityActor(id,x,feet,face,alpha=1,flash=false,rim=false){const im=this.identityFrame(id,flash,rim),f=K.IdentityFrames[id];if(!im)return false;const c=this.c;c.save();c.globalAlpha*=alpha;c.translate(Math.round(x),Math.round(feet));c.scale(face,1);c.drawImage(im,-f.anchor[0],-f.anchor[1]);c.restore();return true;}
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){const s=this.scene,p=s?.player,isPlayer=kind==='monkey'&&p&&this.ui!=='menu'&&Math.abs(x-p.x)<.2&&Math.abs(y-p.y)<.2;
      if(isPlayer&&p.hp>0&&p.hurt<=0&&p.attack>0&&p.ultimate<=0&&!s.arm&&!s.flight&&!s.celestial.cast&&!p.slam){
        const phase=K.attackPhase(p),col={windup:0,strike:1,follow:2,recover:3}[phase];
        if(!(phase==='recover'&&p.grounded&&Math.abs(p.vx)>20)&&this.identityActor(s.hero+'-'+(p.comboIndex-1)+'-'+col,x+12,y+44,face,alpha))return;
      }
      const e=kind!=='monkey'&&s?.room.enemies.find(e=>e.kind===kind&&Math.abs(e.x-x)<.2);
      if(e?.chiefId&&e.stage%3===2&&bossRows[e.chiefId]?.includes(e.move)&&['campaign-windup','campaign-active','campaign-charge','recover'].includes(e.phase)){
        const row=bossRows[e.chiefId].indexOf(e.move),col=e.phase==='campaign-windup'?0:e.phase==='recover'?2:1,c=this.c;
        c.save();if(e.phase==='campaign-windup'){const u=K.clamp(1-e.timer/K.campaignWindup(s,e,e.move,e.repeat>0),0,1);c.translate(-face*Math.round(u*2),0);}const done=this.identityActor(e.chiefId+'-'+row+'-'+col,x+e.w/2,y+e.h,-face,alpha,flash,true);c.restore();if(done)return;
      }
      super.person(kind,x,y,face,frame,alpha,flash,scale);
    }
    drawStaffArc(s){const p=s.player;if(p.attack<=0||p.hurt>0)return;const t=K.weaponSpec(s.hero,p.comboIndex),age=p.attackDuration-p.attack;if(age<t.start||age>=t.end)return;const u=K.clamp((age-t.start)/(t.end-t.start),0,1),b=K.attackBox(s),c=this.c,col=palettes[s.hero];
      c.save();c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();c.translate(Math.round(p.x+12),Math.round(p.y+t.origin));c.scale(p.face,1);c.lineCap='round';c.lineJoin='round';
      const path=()=>{c.beginPath();if(t.shape==='thrust'||t.shape==='lunge'){const reach=b.w-4;c.moveTo(20,0);c.lineTo(reach,0);c.moveTo(reach-10,-3);c.lineTo(reach,0);c.lineTo(reach-10,3);}
        else if(t.shape==='rise'||t.shape==='hook'||t.shape==='lift'){c.moveTo(22,17);c.quadraticCurveTo(b.w*.8,10,b.w-9,-24);}
        else if(t.shape==='smash'||t.shape==='cleave'){c.moveTo(20,-34);c.quadraticCurveTo(b.w+7,-18,b.w-9,20);}
        else if(t.shape==='cut'){c.moveTo(17,-22);c.quadraticCurveTo(b.w*.65,-6,b.w-7,19);}
        else{c.moveTo(16,14);c.bezierCurveTo(b.w*.55,-18,b.w+8,-17,b.w-5,9);}};
      c.globalAlpha=(1-u*.6)*.38;c.strokeStyle=col[2];c.lineWidth=t.shape==='lunge'?7:p.comboIndex===3?8:5;path();c.stroke();
      c.globalAlpha=1-u*.55;c.strokeStyle=col[1];c.lineWidth=p.comboIndex===3?3:2;path();c.stroke();
      c.globalAlpha=.9-u*.65;c.strokeStyle=col[0];c.lineWidth=1;path();c.stroke();
      if(s.hero==='nezha'){const xx=b.w-8,yy=['rise'].includes(t.shape)?-18:0;c.fillStyle='#fff4c0';c.fillRect(Math.round(xx-3),Math.round(yy-1),7,2);c.fillStyle='#e56d39';c.fillRect(Math.round(xx-9-u*7),Math.round(yy+4),6,1);}
      c.restore();
    }
    fx(f,t){const hero=f.weapon||this.scene?.hero,u=K.clamp(1-f.life/(f.duration||.2),0,1),fade=(1-u),c=this.c,face=f.face||1;
      if(f.kind==='hurt'&&f.enemyMaterial){
        // Impact is tied to a successful damage event, never to a mere overlap
        // during dash invulnerability. Each material has a different silhouette.
        const material=f.enemyMaterial;c.save();c.translate(Math.round(f.x),Math.round(f.y));c.scale(face,1);c.globalAlpha=fade;c.lineWidth=2;
        const colors={steel:'#f4dbc1',stone:'#dac092',ink:'#c7a9d6',venom:'#c9e286',water:'#bceae6',thunder:'#d4f6ff',tower:'#f3d793',fire:'#ffc67d',wind:'#cbe5dc'};
        c.strokeStyle=colors[material]||'#ffdfb9';c.fillStyle=c.strokeStyle;
        if(material==='steel'){for(const d of [-4,1]){c.beginPath();c.moveTo(-9+d,-11);c.lineTo(8+d,10);c.stroke();}}
        else if(material==='stone'||material==='tower'){for(let i=0;i<5;i++){const a=(i-2)*.6,r=5+u*20;c.fillRect(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r-u*9),i%2?2:3,2);}}
        else if(material==='ink'){c.beginPath();c.moveTo(-9,-7);c.lineTo(7,-7);c.lineTo(7,8);c.lineTo(-9,8);c.closePath();c.stroke();c.beginPath();c.moveTo(-3,-4);c.lineTo(-3,5);c.moveTo(-6,1);c.lineTo(3,1);c.stroke();}
        else if(material==='thunder'){c.beginPath();c.moveTo(-5,-13);c.lineTo(3,-2);c.lineTo(-2,1);c.lineTo(6,13);c.stroke();}
        else if(material==='fire'){for(let i=0;i<4;i++){const x=(i-1.5)*5;c.beginPath();c.moveTo(x,4-u*12);c.quadraticCurveTo(x-4,-1-u*9,x+2,-9-u*13);c.stroke();}}
        else{for(let i=0;i<5;i++){const a=(i-2)*.7,r=5+u*15,x=Math.cos(a)*r,y=Math.sin(a)*r;if(material==='water'||material==='venom'){c.beginPath();c.ellipse(x,y,2,3+u,Math.PI/4,0,Math.PI*2);c.fill();}else{c.beginPath();c.moveTo(x-8,y);c.lineTo(x+2,y-3);c.stroke();}}}
        c.restore();return;
      }
      if(['hit','heavy-hit','six-strike'].includes(f.kind)&&!['lotus-burn','ultimate','thunder'].includes(f.impact)){
        const col=palettes[hero]||palettes.wukong,heavy=f.kind==='heavy-hit';c.save();c.translate(Math.round(f.x),Math.round(f.y));c.scale(face,1);c.globalAlpha=fade;c.strokeStyle=col[0];c.lineCap='round';
        const line=(x1,y1,x2,y2,width,color)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();};
        if(f.impact==='arrow'){line(-13,0,9,0,2,col[0]);line(3,-6,-3,6,1,col[1]);}
        else if(f.impact==='beam'){line(0,-11,0,11,2,'#d9ffff');line(-10,0,10,0,2,'#88dce7');}
        else if(f.impact==='hound'){for(let i=0;i<3;i++)line(-8+i*5,-10,-2+i*5,7,1,col[0]);}
        else if(f.impact==='ring'){c.strokeStyle='#f7ce76';c.lineWidth=2;c.beginPath();c.arc(0,0,6+u*8,-1.3,1.3);c.stroke();line(-8,-5,3,0,1,'#ffe9b2');}
        else if(f.impact==='staff-bolt'){line(-14,0,8,0,2,'#f8d899');for(const sign of [-1,1])line(0,0,6,sign*(6+u*4),1,col[1]);}
        else if(hero==='wukong'){const r=(heavy?11:7)+u*9;c.strokeStyle=col[1];c.lineWidth=2;c.beginPath();c.ellipse(0,0,r,Math.max(2,r*.65),0,-1.9,1.8);c.stroke();for(let i=0;i<5;i++){const a=(i-2)*.65;line(Math.cos(a)*3,Math.sin(a)*3,Math.cos(a)*(r+4),Math.sin(a)*(r+4),i===2?2:1,col[i%2]);}}
        else if(hero==='nezha'){const d=heavy?20:13;line(-d*(1-u*.3),0,7,0,heavy?3:2,col[0]);for(const sign of [-1,1])line(-3,0,9+u*7,sign*(5+u*4),1,col[1]);}
        else{const d=heavy?17:11;line(-d,-d,d,d,heavy?3:2,col[0]);line(-d+4,-d-3,d+4,d-3,1,col[1]);if(heavy)line(-8,11,9,-9,1,col[1]);}
        c.restore();return;
      }
      super.fx(f,t);
    }
    enemyTelegraph(e,b){super.enemyTelegraph(e,b);const s=this.scene,profile=this.enemyProfile(e.move);if(!profile)return;const c=this.c,u=K.clamp(1-e.timer/K.campaignWindup(s,e,e.move,e.repeat>0),0,1);
      c.save();c.globalAlpha=.04+u*.045;c.fillStyle='#efb7a4';c.fillRect(b.x,b.y,b.w,b.h);c.globalAlpha=.5+u*.3;c.strokeStyle='#ffe5bc';c.lineWidth=1;
      // A compact closing chevron means release is approaching, never an
      // unrelated icon above an enemy. The exact damage footprint stays shown.
      if(u>.65){const x=e.face>0?b.x+b.w-6:b.x+6,y=b.y+b.h-8;c.beginPath();c.moveTo(x-e.face*4,y-4);c.lineTo(x,y);c.lineTo(x-e.face*4,y+4);c.stroke();}c.restore();
    }
    enemyChargeGlow(e){const p=this.enemyProfile(e.move);if(!p)return;const c=this.c,u=K.clamp(1-e.timer/K.campaignWindup(this.scene,e,e.move,e.repeat>0),0,1),x=e.x+e.w/2+e.face*(e.role===1?12:25),y=e.y+e.h*(e.role===1?.36:.6);c.save();
      if(e.role===0&&!e.chiefId){c.globalAlpha=.5+u*.4;c.strokeStyle=p.colors[2];c.lineWidth=1;c.beginPath();c.moveTo(x,y-9);c.lineTo(x+e.face*8,y-14);c.stroke();}
      else if(e.role===2&&!e.chiefId){c.globalAlpha=.55;c.strokeStyle=p.colors[0];c.lineWidth=2;c.beginPath();c.moveTo(x,y-14);c.lineTo(x+e.face*3,y);c.lineTo(x,y+14);c.stroke();}
      else{const id=p.material==='ink'?'ink-seal':p.material==='tower'?'tower-seal':p.material==='water'?'foam':p.material==='venom'?'venom':p.material==='thunder'?'lightning':p.material==='fire'?'fire-wheel':'wind';this.enemyStamp('materials:'+id,x,y,14+u*8,.45+u*.4,e.face);}c.restore();
    }
    enemyDanger(d){const p=this.enemyProfile(d);if(!p||p.shape!=='slash')return super.enemyDanger(d);const c=this.c,age=K.clamp(.35-d.life,0,.35),u=age/.35,e=K.enemyEffectOwner(this.scene,d),face=e?.face||1;
      c.save();c.beginPath();c.rect(d.x,d.y,d.w,d.h);c.clip();this.enemyBoundary(d,p,true);c.translate(face>0?d.x:d.x+d.w,d.y+d.h/2);c.scale(face,1);
      const axe=d.spell==='axe-cleave',color=axe?'#e3bf7a':d.spell==='king-sword'?'#c9e3ed':p.colors[0];
      c.globalAlpha=(1-u)*.27;c.fillStyle=color;c.beginPath();c.moveTo(5,-d.h*.45);c.quadraticCurveTo(d.w*.86,-d.h*.8,d.w-2,d.h*.3);c.lineTo(d.w-18,d.h*.4);c.quadraticCurveTo(d.w*.65,-d.h*.35,5,-d.h*.1);c.closePath();c.fill();
      c.globalAlpha=(1-u)*.9;c.strokeStyle='#fff0cf';c.lineWidth=age<.1?(axe?4:2):1;c.beginPath();c.moveTo(4,-d.h*.25);c.quadraticCurveTo(d.w*.78,-d.h*.52,d.w-3,d.h*.32);c.stroke();c.restore();return true;
    }
    drawProjectile(b){const p=this.enemyProfile(b);if(!p)return super.drawProjectile(b);const c=this.c,x=Math.round(b.x+b.w/2),y=Math.round(b.y+b.h/2),face=b.vx<0?-1:1;
      c.save();c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();c.translate(x,y);c.scale(face,1);c.strokeStyle=p.colors[0];c.fillStyle=p.colors[1];c.lineWidth=1;
      if(p.material==='wind'){c.beginPath();c.moveTo(-8,0);c.lineTo(7,0);c.moveTo(3,-3);c.lineTo(7,0);c.lineTo(3,3);c.moveTo(-7,-3);c.lineTo(-4,0);c.lineTo(-7,3);c.stroke();}
      else if(p.material==='fire'){c.save();c.rotate(this.scene.time*7);c.strokeStyle='#ffce87';c.lineWidth=2;c.beginPath();c.arc(0,0,5,0,Math.PI*2);c.stroke();for(let i=0;i<3;i++){c.rotate(Math.PI*2/3);c.beginPath();c.moveTo(4,0);c.lineTo(7,2);c.stroke();}c.restore();}
      else if(p.material==='venom'){c.beginPath();c.ellipse(0,0,7,5,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#e4eeaa';c.fillRect(1,-2,3,2);}
      else if(p.material==='stone'){c.beginPath();c.moveTo(-8,5);c.lineTo(-4,-3);c.lineTo(1,1);c.lineTo(5,-5);c.lineTo(8,5);c.closePath();c.fill();c.stroke();}
      else{c.beginPath();c.moveTo(-9,5);c.quadraticCurveTo(-2,-9,5,-4);c.quadraticCurveTo(-1,-1,8,4);c.closePath();c.fill();c.stroke();}
      if(b.friendly){c.strokeStyle='#b6f3d5';c.lineWidth=1;c.strokeRect(-b.w/2+.5,-b.h/2+.5,b.w-1,b.h-1);}c.restore();
    }
  };
})(globalThis.Kong ||= {});
