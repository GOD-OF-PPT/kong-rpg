(function(K){
  'use strict';
  const cache=new Map();
  function shape(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  function make(kind,pose,frame){
    const out=document.createElement('canvas');out.width=96;out.height=96;const c=out.getContext('2d');c.scale(2,2);
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);};
    const run=pose==='run',jump=pose==='jump'||pose==='fall',attack=pose==='attack'||pose==='heavy',wind=pose==='windup',hurt=pose==='hurt',dead=pose==='death',dash=pose==='dash';
    const step=run?[0,2,0,-2][frame%4]:0;
    // Feet stay on one shared anchor in every frame, including crouch/death.
    c.translate(hurt?-2:0,0);
    const ink='#1a1c2c',gold='#e7bc73',shine='#fae6ac',red='#b9494a',fur='#c88d51',skin='#e7ba7b',blue='#425f78';
    if(kind==='monkey'){
      // Shared bottom-centre anchor; separate silhouettes communicate each verb.
      r(9,31,12,2,'#8c5b39');r(7,27,3,6,fur);r(9,25,5,2,fur);r(13,24,2,3,fur);
      if(pose==='fall'){r(21,34,6,9,ink);r(30,34,5,8,blue);r(19,42,9,2,gold);r(30,41,8,3,'#97664a');}
      else if(jump){r(21,33,7,6,ink);r(27,35,8,4,blue);r(30,37,7,3,gold);r(17,35,5,6,blue);r(14,39,8,3,'#97664a');}
      else if(dash||dead){r(17,35,10,6,blue);r(28,34,6,8,ink);r(15,40,11,3,'#9d704d');r(28,41,10,3,gold);}
      else{r(20-step,33,6,9,ink);r(29+step,33,6,9,ink);r(20-step,34,3,7,blue);r(29+step,34,3,7,blue);r(17-step,41,10,3,'#9e704b');r(28+step,41,10,3,'#9e704b');r(17-step,43,10,1,gold);r(28+step,43,10,1,gold);}
      r(18,23,18,12,ink);r(20,24,14,9,blue);r(21,25,3,7,'#7894a0');r(30,24,4,9,'#2c425e');r(19,33,17,3,gold);r(20,36,16,2,red);r(23,36,4,6,red);r(25,38,2,4,'#d56b58');
      r(19,11,16,13,ink);r(17,15,4,7,fur);r(20,10,13,13,fur);r(23,12,12,10,skin);r(20,12,4,5,'#78503d');r(23,19,12,4,'#c99358');r(28,16,7,2,ink);r(29,16,4,1,shine);r(31,18,6,3,skin);r(29,22,6,1,'#79503c');r(19,11,16,3,gold);r(21,10,4,3,shine);r(29,10,4,3,shine);r(22,6,2,5,red);r(30,5,2,6,red);r(21,5,2,2,'#d6725d');r(29,4,2,2,'#d6725d');
      r(18,23,17,3,red);r(12,24,9,3,'#cf5d51');r(dash?2:8,27,dash?14:8,3,red);r(dash?0:5,30,dash?8:5,2,'#823a46');
      if(wind){r(15,23,7,6,gold);r(13,20,5,6,skin);r(11,15,3,18,'#895437');r(11,13,3,6,gold);r(11,29,3,6,gold);r(32,24,7,5,skin);}
      else if(pose==='heavy'){r(15,23,7,7,gold);r(31,22,9,5,skin);r(37,21,4,7,gold);r(33,24,14,3,'#8d5839');r(43,23,4,5,gold);}
      else if(attack){r(15,25,7,7,gold);r(31,25,9,4,skin);r(37,24,4,6,gold);r(35,27,12,2,'#8d5839');r(43,26,4,4,gold);}
      else{r(16,25,6,8,gold);r(17,27,3,5,shine);r(33,25,6,8,fur);r(35,31,6,4,skin);if(dash){shape(c,[[37,15],[39,16],[32,43],[30,42]],'#9f7145');r(36,13,3,7,gold);r(29,39,3,6,gold);}else{r(38,14,3,30,'#875539');r(38,12,3,7,gold);r(38,38,3,7,gold);r(38,13,1,5,shine);}}
      if(hurt){r(20,20,4,2,'#f2d8a2');r(31,18,4,2,red);}if(dead){r(26,16,7,1,ink);r(27,20,5,1,ink);}
    }else if(kind==='caster'){
      shape(c,[[24,9],[33,22],[33,34],[24,40],[15,34],[15,22]],ink);shape(c,[[24,12],[30,22],[30,33],[24,37],[18,33],[18,22]],'#46756c');r(20,22,8,10,wind?'#d9e6ae':'#85c9ac');r(23,20,3,13,'#d9e6ae');r(15,19,18,3,'#b89a63');r(15,33,18,3,'#b89a63');r(22,11,4,8,'#ad8860');r(23,5,2,7,'#5c7e80');r(15,37,3,6,'#456572');r(30,37,3,6,'#456572');if(wind){r(19,14,10,2,'#e7c684');r(17,24,2,7,'#d4e6ba');}
    }else if(kind==='boss'){
      shape(c,[[17,22],[13,43],[37,43],[34,22]],ink);shape(c,[[19,23],[16,41],[34,41],[32,23]],'#3c2949');r(21,25,3,15,'#8c6680');r(29,25,2,15,'#8c6680');r(21,6,12,19,ink);r(23,11,8,10,'#bcb2b0');r(22,7,12,6,'#252032');r(22,9,2,13,'#252032');r(31,9,2,14,'#252032');r(25,16,2,1,'#a6558a');r(29,16,2,1,'#a6558a');r(26,20,5,1,'#776777');r(16,25,5,10,'#4f3755');r(33,wind?20:25,5,wind?13:10,'#4f3755');r(15,34,6,3,'#b0a498');r(34,wind?18:34,5,3,'#b0a498');
    }else{
      const shield=kind==='shield';r(20-step,33,6,10,ink);r(29+step,33,6,10,ink);r(18-step,42,10,2,'#92818b');r(29+step,42,9,2,'#92818b');r(18,22,18,14,ink);r(20,23,14,11,'#614f69');r(22,24,3,8,'#8d7291');r(29,24,3,8,'#453a53');r(18,34,18,3,'#aa926e');r(20,11,15,13,ink);r(20,10,15,6,'#74607c');r(19,9,4,5,'#a78aa5');r(32,8,4,6,'#a78aa5');r(23,17,11,5,'#25263a');r(25,18,3,2,'#ebb3be');r(31,18,2,2,'#ebb3be');
      r(15,24,6,10,'#8c718e');r(33,23,6,10,'#8c718e');
      if(shield){const x=pose==='recover'?31:34,y=wind?19:24;r(x,y,11,20,'#b5a080');r(x+2,y+2,8,16,'#54475f');r(x+4,y+3,3,14,'#967988');r(x+3,y+8,7,3,'#d0b584');}
      else if(wind){r(14,17,4,9,'#8c718e');r(13,6,2,19,'#cabcb2');r(12,22,5,2,gold);r(13,24,2,7,'#7b5860');}
      else if(attack){r(32,25,11,4,'#ac879b');r(36,26,11,2,'#e9c7bb');r(35,24,2,6,gold);}
      else{r(38,16,2,22,'#b8aba8');r(37,34,5,2,gold);r(38,36,2,7,'#6f4e61');}
    }
    return out;
  }
  K.Art={get(kind,pose='idle',frame=0,flash=false){const key=[kind,pose,frame%4,flash].join(':');if(!cache.has(key)){const image=make(kind,pose,frame);if(flash){const c=image.getContext('2d');c.globalCompositeOperation='source-atop';c.fillStyle='#f8dfb1';c.globalAlpha=.7;c.fillRect(0,0,96,96);}cache.set(key,image);}return cache.get(key);},poses:['idle','run','jump','fall','windup','attack','heavy','dash','hurt','death']};
})(globalThis.Kong ||= {});
