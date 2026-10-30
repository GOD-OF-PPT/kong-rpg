(function(K){
  'use strict';
  const sources=K.ArtSources,images={},jobs=new Map(),listeners=new Set(),errors=[],queue=[];
  let active=0;
  const boot=['brandWordmark','mountain','wukong','stone'];
  const ui=['uiScroll','uiIcons','uiFolio','props','wukong','nezhaPortrait','v8ErlangPortrait','v8NezhaPortrait'];
  const realms={
    cloud:['realmCloud','campaign-juling','campaignArmy-cloud','motion-cloud','cloudEnvironment','cloudFoundation'],
    underworld:['realmUnderworld','campaign-qinguang','campaignArmy-underworld','motion-underworld'],
    water:['realmWater','campaign-ninehead','campaignArmy-water','motion-water'],
    dragon:['realmDragon','campaign-dragonking','campaignArmy-dragon','motion-dragon'],
    heaven:['realmHeaven','campaign-litian','campaignArmy-heaven','motion-heaven']
  };
  const heroes={
    wukong:['run','combo','sigWukong','identity-wukong','staffActors','staffFx'],
    nezha:['nezha','sigNezha','v8Nezha','motion-nezha','identity-nezha'],
    erlang:['v8Erlang','motion-erlang','identity-erlang','v8Companion']
  };
  const specialized=new Set([...boot,...ui,...Object.values(realms).flat(),...Object.values(heroes).flat(),'ferry','sanctuary']);
  const common=Object.keys(sources).filter(id=>!specialized.has(id));
  const unique=ids=>[...new Set(ids)];
  const notify=()=>{for(const fn of listeners)fn();};
  function pump(){while(active<4&&queue.length){const task=queue.shift(),id=task.id;active++;const im=new Image();im.onload=()=>{images[id]=im;const old=errors.indexOf(id);if(old>=0)errors.splice(old,1);active--;task.resolve(im);notify();pump();};im.onerror=()=>{active--;jobs.delete(id);if(!errors.includes(id))errors.push(id);task.reject(Error('Image unavailable: '+id));notify();pump();};im.src=sources[id];}}
  function loadOne(id){
    if(!Object.hasOwn(sources,id))return Promise.reject(Error('Unknown image: '+id));
    if(images[id])return Promise.resolve(images[id]);if(jobs.has(id))return jobs.get(id);
    const promise=new Promise((resolve,reject)=>queue.push({id,resolve,reject}));jobs.set(id,promise);pump();return promise;
  }
  const api=K.ImageArt={images,errors,uiIds:ui,bootIds:boot,
    load:ids=>Promise.all(unique(ids).map(loadOne)),
    has:ids=>ids.every(id=>!!images[id]),
    progress:ids=>({loaded:unique(ids).filter(id=>!!images[id]).length,total:unique(ids).length}),
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    forRun(s){const realm=['cloud','underworld','water','dragon','heaven'][Math.floor(s.stage/3)];return unique([...boot,...ui,...common,...heroes[s.hero],...realms[realm]]);},
    loadAll:()=>api.load(Object.keys(sources))
  };
  // Historical QA consumers explicitly awaiting .ready still ask for the whole
  // catalogue. Production screens use load(ids); merely booting stays staged.
  Object.defineProperty(api,'ready',{get:()=>api.loadAll()});
  api.bootReady=api.load(K.ArtDelivery==='inline'?Object.keys(sources):boot);
  api.bootReady.catch(()=>{}); // The menu/transition UI owns recovery, not console.
})(globalThis.Kong ||= {});
