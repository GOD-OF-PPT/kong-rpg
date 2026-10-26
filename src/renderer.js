(function (K) {
  'use strict';
  const C = { ink:'#171426', gold:'#e7ba70', light:'#fae8b8', red:'#cd5651', hair:'#d39b58', blue:'#3c536d', dark:'#25243c', jade:'#80cfc5' };
  function poly(c, pts, color) { c.fillStyle=color;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill(); }
  function pixel(c,x,y,w,h,col) { c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h); }
  function sprite(kind,frame=0) {
    const out=document.createElement('canvas');out.width=64;out.height=80;const c=out.getContext('2d');c.scale(2,2);
    const r=(x,y,w,h,col)=>pixel(c,x,y,w,h,col); const walk=Math.sin(frame*Math.PI/2)*2;
    if(kind==='monkey') {
      // Tail, scarf, armour, face, crown: 2px hand-authored pixel clusters.
      r(3,25,8,2,C.hair);r(2,21,2,5,C.hair);r(3,20,4,2,C.hair);
      r(10,24,6,7,C.dark);r(17,24,6,7,C.dark);r(10-walk,30,5,5,C.blue);r(18+walk,30,4,5,C.blue);
      r(8-walk,34,8,3,'#9e6b45');r(18+walk,34,7,3,'#9e6b45');r(8-walk,36,8,2,C.gold);r(18+walk,36,7,2,C.gold);
      r(9,17,15,11,C.blue);r(10,18,4,9,'#66839a');r(20,18,4,9,'#202b46');r(9,25,15,3,C.gold);r(10,27,14,3,'#a94643');r(13,28,4,5,C.red);
      r(6,18,6,8,C.gold);r(7,19,3,6,C.light);r(22,19,5,7,C.hair);r(24,23,5,4,'#eed19d');
      r(11,5,12,13,'#754736');r(9,9,4,6,C.hair);r(12,6,11,10,C.hair);r(15,8,10,8,'#e5b77a');r(12,7,4,4,'#754736');
      r(19,10,5,2,'#342d35');r(20,10,3,1,C.light);r(23,12,3,3,'#e5b77a');r(19,15,5,1,'#754736');
      r(11,5,13,3,C.gold);r(12,4,4,2,C.light);r(18,4,5,2,C.light);r(13,1,2,4,C.red);r(19,0,2,5,C.red);
      r(9,16,15,3,C.red);r(4,17,8,3,C.red);r(1,19,6,3,'#9c4248');r(0,21,3,2,C.red);
      r(27,8,2,29,'#7b4e37');r(27,6,2,6,C.gold);r(27,32,2,7,C.gold);r(27,7,1,4,C.light);r(27,33,1,5,C.light);
    } else if(kind==='boss') {
      r(6,19,20,17,'#261d37');poly(c,[[6,20],[3,38],[28,38],[25,20]],'#332340');
      r(10,19,13,14,'#49334e');r(12,22,2,14,'#936987');r(19,22,2,14,'#936987');r(9,34,15,3,'#1a172b');
      r(10,3,13,19,'#181728');r(12,7,9,10,'#b6b1ad');r(11,4,11,5,'#252032');r(12,5,2,9,'#252032');r(20,5,2,12,'#252032');r(15,12,2,1,'#aa568e');r(19,12,2,1,'#aa568e');r(16,16,5,1,'#716270');
      r(4,21,6,9,'#4e3853');r(24,21,5,9,'#4e3853');r(3,29,6,3,'#ada59c');r(25,29,5,3,'#ada59c');
    } else if(kind==='caster') {
      poly(c,[[15,4],[23,17],[24,28],[15,34],[7,28],[8,17]],'#344d50');r(11,13,10,12,'#547b71');r(13,15,6,9,'#84c9a2');r(15,17,3,5,'#d8e7af');r(9,10,14,3,'#b49460');r(9,25,14,3,'#b49460');r(14,5,4,6,'#9c7761');r(15,0,2,6,'#4c6974');
      r(6,30,3,7,'#4c6974');r(22,29,3,7,'#4c6974');r(13,31,3,7,'#42626a');
    } else {
      r(10,27,5,9,'#2e2c45');r(19,27,5,9,'#2e2c45');r(8-walk,35,8,3,'#7b657d');r(19+walk,35,7,3,'#7b657d');
      r(9,15,16,15,'#59455f');r(11,17,12,9,'#79627f');r(12,20,10,2,'#ad87a6');r(16,17,3,12,'#3d344e');r(8,27,18,3,'#998568');
      r(10,6,14,10,'#373147');r(9,4,16,5,'#6a586c');r(10,3,3,5,'#8d7591');r(21,2,3,6,'#8d7591');r(12,10,10,5,'#222638');r(14,11,3,2,'#e9a3ba');r(20,11,2,2,'#e9a3ba');
      r(6,16,5,11,'#756079');r(24,16,5,11,'#756079');
      if(kind==='shield') { r(20,14,11,21,'#b59b75');r(22,15,8,18,'#4b4059');r(24,17,4,14,'#89717e');r(26,19,2,10,'#ceaf7c');r(23,22,7,3,'#c4a882'); }
      else if(frame===4){r(5,4,2,22,'#d7c5ae');r(4,23,5,2,C.gold);r(5,25,2,7,'#665168');}else if(frame===5){r(24,20,8,2,'#d7c5ae');r(24,18,2,6,C.gold);}else{r(28,10,2,23,'#bfb1a3');r(27,28,4,2,C.gold);r(28,30,2,7,'#665168');}
    }
    return out;
  }
  K.Renderer=class {
    constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.c.imageSmoothingEnabled=false;this.camera=0;this.sprites={};this.flashSprites={};this.backgrounds={};this.clock=0;for(const k of ['monkey','blade','shield','caster','boss'])for(let f=0;f<6;f++){this.sprites[k+f]=sprite(k,f);const flash=document.createElement('canvas');flash.width=64;flash.height=80;const fc=flash.getContext('2d');fc.drawImage(this.sprites[k+f],0,0);fc.globalCompositeOperation='source-atop';fc.globalAlpha=.7;fc.fillStyle='#ffe2b2';fc.fillRect(0,0,64,80);this.flashSprites[k+f]=flash;}}
    background(stage){
      if(this.backgrounds[stage])return this.backgrounds[stage];
      const out=document.createElement('canvas');out.width=960;out.height=540;const c=out.getContext('2d');const theme=K.STAGES[stage];
      for(let i=0;i<18;i++)pixel(c,0,i*30,960,30, i<6?theme.sky:i<11?'#29243a':i<15?'#393147':'#4a3f50');
      const random=K.rng(279+stage*29);
      for(let i=0;i<95;i++){const x=Math.floor(random()*960),y=Math.floor(random()*280);pixel(c,x,y,i%7===0?2:1,i%7===0?2:1,i%4===0?'#b3a58f':'#655e78');}
      // Stepped moon, deliberately crisp instead of blurred gradients.
      for(let y=-62;y<=62;y+=3){const w=Math.floor(Math.sqrt(62*62-y*y)/3)*3;pixel(c,728-w,133+y,w*2,3,stage===3?'#b07e9c':'#b0a59c');}
      for(let i=0;i<12;i++){pixel(c,686+(i*31)%88,90+i*7,15+i%3*8,3,'#989097');}
      poly(c,[[0,325],[0,262],[58,230],[94,255],[163,170],[213,216],[269,192],[343,270],[401,237],[456,273],[537,183],[600,260],[648,215],[732,281],[810,196],[892,247],[960,216],[960,400]],'#302c43');
      poly(c,[[0,380],[0,298],[49,281],[91,316],[162,274],[230,317],[291,253],[342,289],[404,259],[484,336],[550,268],[609,324],[672,284],[751,316],[830,269],[899,310],[960,285],[960,460]],'#3c3c50');
      // Ancient pagoda; ornament is kept low contrast behind the playfield.
      this.pagoda(c,747,301,1.3,'#27283c');this.pagoda(c,100,355,.8,'#303448');
      for(let i=0;i<7;i++){const y=280+i*24;pixel(c,(i*173)%700-100,y,180+i*30,5,'#605165');pixel(c,(i*131+280)%850,y+8,130,2,'#514759');}
      poly(c,[[0,430],[0,370],[80,355],[120,389],[180,376],[240,412],[350,375],[420,413],[540,389],[620,421],[680,377],[770,407],[850,383],[960,398],[960,540]],'#303b47');
      this.backgrounds[stage]=out;return out;
    }
    pagoda(c,x,y,scale,col){c.save();c.translate(x,y);c.scale(scale,scale);for(let i=0;i<4;i++){const w=56-i*8,yy=-i*33;pixel(c,-w/2,yy-22,w,25,col);poly(c,[[-w/2-15,yy-17],[-w/2-4,yy-21],[-w/2+7,yy-30],[0,yy-34],[w/2-7,yy-30],[w/2+4,yy-21],[w/2+15,yy-17],[0,yy-19]],col);pixel(c,-4,yy-17,8,13,'#58515b');}pixel(c,-2,-154,4,26,col);c.restore();}
    person(kind,x,y,face=1,frame=0,alpha=1,flash=false,scale=1){const c=this.c;c.save();c.globalAlpha=alpha;c.translate(Math.round(x+12),Math.round(y+44));c.scale(face*scale,scale);c.drawImage((flash?this.flashSprites:this.sprites)[kind+frame],-32,-74,64,80);c.restore();}
    platform(p){const c=this.c;pixel(c,p.x,p.y,p.w,p.h,'#252b39');pixel(c,p.x,p.y,p.w,3,'#a49a84');pixel(c,p.x,p.y+3,p.w,5,'#63645f');pixel(c,p.x,p.y+8,p.w,4,'#424953');const random=K.rng(p.x+17);for(let x=p.x;x<p.x+p.w;x+=32){pixel(c,x+2,p.y+14,28,2,'#4c535b');pixel(c,x+Math.floor(random()*20),p.y+4,9,3,'#75927e');if(p.solid){pixel(c,x+15,p.y+18,2,22,'#343b47');pixel(c,x,p.y+41,32,2,'#404753');pixel(c,x+Math.floor(random()*20),p.y+65,12,2,'#343e49');}else{const h=5+Math.floor(random()*14);pixel(c,x+5,p.y+p.h,3,h,'#536e62');pixel(c,x+8,p.y+p.h,2,h*.6,'#3c5650');}}
      if(p.solid){for(let x=p.x+13;x<p.x+p.w;x+=57){pixel(c,x,p.y-6,2,7,'#889382');pixel(c,x+3,p.y-4,2,5,'#5c7b69');pixel(c,x-3,p.y-3,2,4,'#5c7b69');}}
    }
    draw(s,ui,dt=.016){this.clock+=dt;const c=this.c;const stage=s?.stage||0;c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;c.drawImage(this.background(stage),0,0);
      const t=this.clock;
      // Near clouds move independently of the camera.
      if(!K.ImageArt?.images.mountain)for(let i=0;i<5;i++){const x=((i*267-t*7)%1200+1200)%1200-160;pixel(c,x,320+i*23,150,3,'#625b69');pixel(c,x+38,316+i*23,84,4,'#625b69');}
      if(!s||ui==='menu'){this.titleScene(t);return;}
      const target=K.clamp(s.player.x-300,0,s.room.width-960);this.camera+= (target-this.camera)*(1-Math.exp(-dt*10));if(Math.abs(this.camera-target)<.5)this.camera=target;
      let shake=ui==='playing'&&s.shake>0&&this.shake!==false?Math.sin(t*140)*s.shake*13:0;
      c.save();c.translate(-Math.round(this.camera)+Math.round(shake),0);
      // Ruined foreground pillars and suspended lamps anchor the scene.
      if(!K.ImageArt?.images.mountain)for(let x=220;x<s.room.width;x+=450){pixel(c,x,177,3,112,'#3a3445');pixel(c,x-8,286,20,3,'#a28a67');pixel(c,x-6,289,16,21,'#aa6962');pixel(c,x-4,292,12,15,'#dea273');pixel(c,x,310,2,12,'#b08061');pixel(c,x-21,176,46,4,'#58505b');}
      if(stage===3&&!K.ImageArt?.images.sanctuary)this.lotus(748,384,110,'#382039',true);
      for(const p of s.room.platforms)this.platform(p);
      for(const h of s.room.hazards){const phase=K.hazardPhase(s,h);if(phase==='quiet'){pixel(c,h.x,h.y+h.h-2,h.w,2,'#725b76');continue;}if(phase==='warning'){pixel(c,h.x,h.y+h.h-2,h.w,2,'#d295b8');for(let j=0;j<h.w;j+=14)pixel(c,h.x+j,h.y+4,5,2,'#a7719a');continue;}for(let x=h.x;x<h.x+h.w;x+=11)poly(c,[[x,h.y+h.h],[x+5,h.y-4],[x+11,h.y+h.h]],'#b5769e');pixel(c,h.x,h.y+h.h-3,h.w,3,'#573c59');}
      for(const q of s.room.seals){if(this.drawSeal&&K.ImageArt?.images.enemies){this.drawSeal(q);continue;}if(q.hp>0){pixel(c,q.x-5,q.y+38,38,10,'#6c6075');pixel(c,q.x+6,q.y+4,16,34,'#393343');pixel(c,q.x+9,q.y+8,10,25,'#c984c2');this.lotus(q.x+14,q.y+7,15,'#bf80b5',false);for(let i=0;i<3;i++)pixel(c,q.x+9+i*5,q.y-13,3,3,q.hp>i*14?'#d8a4cc':'#463c52');}else{pixel(c,q.x-6,q.y+40,39,8,'#5a5e62');pixel(c,q.x+6,q.y+31,14,8,'#807e78');}}
      for(const item of s.room.pickups)if(!item.used&&item.enabled!==false){const y=item.y+Math.round(Math.sin(t*3+item.x)*3);this.lotus(item.x+8,y+8,10,item.kind==='heal'?'#c4dba3':item.kind==='rage'?'#f0c671':'#91d2d4',false);pixel(c,item.x+5,y+20,7,2,'#57636b');}
      if(stage<3&&this.drawGate){this.drawGate(s.room.exit,s.room.seals.every(q=>q.hp===0));}else if(stage<3){const open=s.room.seals.every(q=>q.hp===0);pixel(c,s.room.exit-20,333,52,108,'#3e3544');pixel(c,s.room.exit-12,338,36,102,open?'#586e65':'#302936');pixel(c,s.room.exit-25,330,62,6,'#aa9679');pixel(c,s.room.exit-30,326,72,4,'#625864');for(let i=0;i<4;i++)pixel(c,s.room.exit-8+i*9,342,2,93,open?'#a8caa0':'#5f4567');if(open){for(let i=0;i<7;i++)pixel(c,s.room.exit+Math.sin(t+i)*14,365+(i*11+t*20)%65,2,4,'#d6dba6');}}
      for(const e of s.room.enemies)if(e.hp>0&&!e.dormant){pixel(c,e.x-2,e.y+e.h-1,e.w+4,4,'#19212d');if(e.kind==='boss'){const col=e.phase==='recover'?'#d4b985':'#805575';for(let i=0;i<10;i++){const ang=e.phase==='recover'?i*Math.PI/5:-Math.PI/2+i*Math.PI/9;pixel(c,e.x+24+Math.cos(ang)*39*(e.phase==='recover'?1:e.face),e.y+30+Math.sin(ang)*48,4,4,col);}}const f=e.phase==='attack'?5:e.phase.includes('windup')?4:Math.floor(t*3)%4;const yy=0;this.person(e.kind,e.x,e.y+yy,e.face,f,1,e.flash>0,e.kind==='boss'?1.12:1);
        if(e.kind!=='boss'&&e.hp<e.maxHp){pixel(c,e.x-5,e.y-21,36,3,'#302634');pixel(c,e.x-5,e.y-21,Math.ceil(36*e.hp/e.maxHp),3,'#bd8494');}
        if(e.phase.includes('windup')){pixel(c,e.x+9,e.y-34,5,12,'#f4c589');pixel(c,e.x+9,e.y-19,5,4,'#f4c589');if(e.kind==='boss'&&e.phase==='sweep-windup'){const b=K.enemyAttackBox(e);pixel(c,b.x,b.y+b.h-4,b.w,3,'#bd6c9d');}else if(e.phase==='windup'&&(e.kind==='blade'||e.kind==='shield')){const b=K.enemyAttackBox(e);pixel(c,b.x,b.y+b.h-3,b.w,2,'#a78b61');}}
        if(e.phase==='attack'){const b=K.enemyAttackBox(e);pixel(c,b.x,b.y+10,b.w,3,'#e3a49e');pixel(c,b.x,b.y+b.h-3,b.w,3,'#ba6879');}
        if(e.phase==='sweep'){const b=K.enemyAttackBox(e);pixel(c,b.x,b.y+8,b.w,5,'#b560a4');pixel(c,b.x,b.y+b.h-4,b.w,4,'#d996bf');}
      }
      const p=s.player;const below=s.room.platforms.filter(q=>q.y>=p.y+p.h-3&&p.x+p.w>q.x&&p.x<q.x+q.w).sort((a,b)=>a.y-b.y)[0];if(below){const w=K.clamp(34-(below.y-p.y-p.h)*.1,14,34);pixel(c,p.x+12-w/2,below.y-2,w,3,'#1d2532');}
      for(const fx of s.effects.filter(f=>f.kind==='trail').slice(-3))this.person('monkey',fx.x,fx.y,fx.face,0,.12,false);
      if(s.clone){c.save();c.globalAlpha=.4;pixel(c,s.clone.x-15,s.clone.y+45,60,3,'#79d9d2');c.restore();this.person('monkey',s.clone.x,s.clone.y,s.clone.face,Math.floor(t*8)%4,.52);}
      this.person('monkey',p.x,p.y,p.face,p.grounded?Math.abs(p.vx)>30?Math.floor(t*13)%4:0:2,p.invuln>0&&Math.floor(t*15)%2?.45:1,false);
      if(p.attack>0&&this.drawStaffArc){this.drawStaffArc(s);}else if(p.attack>0){const elapsed=p.attackDuration-p.attack;if(elapsed>=.055&&elapsed<.18){const b=K.attackBox(s);pixel(c,b.x,b.y+17,b.w,3,'#f4d296');pixel(c,p.face>0?b.x+b.w-4:b.x,b.y+7,4,22,'#e0ba77');}}
      if(p.slam){pixel(c,p.x+5,p.y+25,14,35,'#d9a66b');pixel(c,p.x+10,p.y+25,4,38,'#fff0b6');}
      for(const b of s.projectiles){const col=b.friendly?'#95e0d3':'#da8ebc';pixel(c,b.x-3,b.y+3,b.w+6,b.h-6,col);pixel(c,b.x,b.y,b.w,b.h,col);pixel(c,b.x+3,b.y+3,b.w-6,b.h-6,b.friendly?'#e5f8cb':'#f5cae1');pixel(c,b.x-Math.sign(b.vx)*10,b.y+4,8,4,b.friendly?'#3d807e':'#75456e');}
      for(const fx of s.effects)this.fx(fx,t);
      c.restore();
      // A sparse foreground particle layer, never the same colour as warnings.
      for(let i=0;i<14;i++){const x=(i*79+t*(i%2?11:-6)+960)%960,y=180+(i*43+t*8)%350;pixel(c,x,y,2,2,'#a99d80');}
      pixel(c,0,0,960,2,'#887661');pixel(c,0,538,960,2,'#534a50');
    }
    lotus(x,y,r,color,large){const c=this.c;for(let i=0;i<7;i++){const ang=-Math.PI+i*Math.PI/6,px=x+Math.cos(ang)*r*.65,py=y+Math.sin(ang)*r*.55;poly(c,[[x,y],[px-r*.22,py],[px,py-r*.30],[px+r*.22,py]],color);}pixel(c,x-r*.65,y,r*1.3,large?6:3,color);}
    titleScene(t){const c=this.c;for(let i=0;i<6;i++){const x=625+i*35;pixel(c,x,420-i*7,42,130,'#303945');pixel(c,x,420-i*7,42,4,'#8e8c7b');}this.lotus(752,259,105,'#403147',true);this.person('monkey',728,316,1,0,1,false,2.0);for(let i=0;i<18;i++){const x=650+(i*43)%280+Math.sin(t*.7+i)*7,y=190+(i*59+t*10)%250;pixel(c,x,y,2,3,'#b9a582');}pixel(c,0,500,960,40,'#1c2634');for(let x=0;x<960;x+=32){pixel(c,x,501,31,3,'#4c555b');pixel(c,x+14,510,2,24,'#293641');}}
    fx(fx,t){const c=this.c;const a=K.clamp(fx.life/.3,0,1);c.save();c.globalAlpha=a;const col=fx.color||'#efd3a0';if(['hit','hurt','block','dust'].includes(fx.kind)){for(let i=0;i<7;i++){const ang=i*2.4,dist=(.45-fx.life)*80;pixel(c,fx.x+Math.cos(ang)*dist,fx.y+Math.sin(ang)*dist,fx.kind==='dust'?4:3,3,fx.kind==='hurt'?'#e7817d':col);}}
      if(fx.kind==='ring'){const r=(.5-fx.life)*230;for(let i=0;i<20;i++){const ang=i*Math.PI/10;pixel(c,fx.x+Math.cos(ang)*r,fx.y+Math.sin(ang)*r*.25,6,3,fx.fire?'#ed9968':'#c7c4a8');}}
      if(fx.kind==='clone-swing'){pixel(c,fx.x-20,fx.y,50,3,'#9fe3d8');}c.restore();}
  };
})(globalThis.Kong ||= {});
