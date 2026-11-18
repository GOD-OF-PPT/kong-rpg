(function(K){
  'use strict';
  K.REALMS={
    cloud:{name:'云上断阶',image:'realmCloud',enemy:['踏云戟卫','巡风羽使'],move:'巡风横切',hint:'风线锁定后离开高度；云阶仍可落脚。'},
    heaven:{name:'天宫封廊',image:'realmHeaven',enemy:['镇门天将','雷诏司'],move:'天诏雷印',hint:'雷印锁定后横移，重击可断起手。'},
    water:{name:'沉渊水道',image:'realmWater',enemy:['钳潮虾卫','吐珠蚌妖'],move:'潮珠对流',hint:'双向潮珠留有高度间隙，可跃起或返弹。'},
    dragon:{name:'龙宫珊庭',image:'realmDragon',enemy:['玄甲蟹将','唤潮龙侍'],move:'龙宫涌柱',hint:'水柱先锁两个落点，离开印区再出手。'},
    underworld:{name:'地府忘川',image:'realmUnderworld',enemy:['锁魂鬼卒','引灯判使'],move:'追魂灯印',hint:'魂印先后锁定，第二次须重新判断落点。'}
  };
  K.realmAt=(stage,x)=>stage===0?(x>=4920?'heaven':x>=2760?'cloud':null):stage===1?(x>=4920?'dragon':x>=1760?'water':null):stage===2&&x>=2760?'underworld':null;
  const region=K.region;K.region=(stage,x)=>K.REALMS[K.realmAt(stage,x)]?.name||region(stage,x);
  const makeRoom=K.makeRoom;
  K.makeRoom=function(seed,stage,difficulty){
    const room=makeRoom(seed,stage,difficulty);
    for(const e of room.enemies){const realm=K.realmAt(stage,e.origin);if(realm&&!K.isMajor(e)){e.realm=realm;e.realmCD=1.2+(e.id%3)*.4;}}
    for(const key of Object.keys(K.REALMS)){
      const at=stage===0?(key==='cloud'?2780:key==='heaven'?4940:null):stage===1?(key==='water'?1780:key==='dragon'?4940:null):stage===2&&key==='underworld'?2780:null;
      if(at!==null)room.signs.push({x:at,text:K.REALMS[key].name+' · '+K.REALMS[key].hint});
    }
    return room;
  };
  K.REALM_PHASES=['realm-windup','realm-echo'];
  K.REALM_SOURCES=Object.values(K.REALMS).map(r=>r.move);
  const counter=K.stepCounter;
  function mark(s,p,w=84,h=90){return{x:K.clamp(p.x+12-w/2,8,s.room.width-w-8),y:440-h,w,h};}
  K.stepCounter=function(s,e,dt,target){
    if(!e.realm)return counter(s,e,dt,target);
    e.realmCD=Math.max(0,e.realmCD-dt);
    if(K.REALM_PHASES.includes(e.phase)){
      if(e.timer>0)return true;
      const realm=e.realm,source=K.REALMS[realm].move;
      if(realm==='cloud'||realm==='water'){
        for(const [i,b]of e.marks.entries())s.projectiles.push({x:(realm==='water'?i===0:e.face>0)?b.x:b.x+b.w-18,y:b.y,w:18,h:12,vx:realm==='water'?(i? -200:200):e.face*270,vy:0,life:realm==='water'?1.6:1.48,friendly:false,source});
      }else for(const b of e.marks)s.dangers.push({...b,life:.32,damage:12,source});
      if(realm==='underworld'&&e.phase==='realm-windup'){e.phase='realm-echo';e.timer=.8;e.marks=[mark(s,target)];K.event(s,'warning',{kind:e.kind,move:source});}
      else{e.phase='recover';e.timer=1.35;e.marks=[];}return true;
    }
    if((e.kind==='caster'||K.isChallenge(s))&&e.phase==='idle'&&e.timer<=0&&e.realmCD===0&&Math.abs(target.x-e.x)<510&&Math.abs(target.x-e.x)>55&&s.room.enemies.filter(q=>q.hp>0&&K.REALM_PHASES.includes(q.phase)).length<2){
      e.face=Math.sign(target.x-e.x)||e.face;e.phase='realm-windup';e.timer=1;e.realmCD=4.5;
      if(e.realm==='cloud')e.marks=[{x:e.face>0?e.x+e.w:e.x-420,y:K.clamp(target.y+18,240,418),w:420,h:12}];
      else if(e.realm==='water')e.marks=[{x:target.x-170,y:416,w:340,h:12},{x:target.x-170,y:370,w:340,h:12}].map(b=>({...b,x:K.clamp(b.x,8,s.room.width-348)}));
      else if(e.realm==='dragon')e.marks=[mark(s,target,64,136),{...mark(s,target,64,136),x:K.clamp(target.x+130,8,s.room.width-70)}];
      else e.marks=[mark(s,target,e.realm==='heaven'?76:84)];
      K.event(s,'warning',{kind:e.kind,move:K.REALMS[e.realm].move});return true;
    }
    return counter(s,e,dt,target);
  };
})(globalThis.Kong ||= {});
