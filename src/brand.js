(function(K){
  'use strict';
  K.Brand={name:'劫火重燃',english:'REKINDLED EMBERS',slogan:'踏破五界，此战再起。'};
  // Both the source preview and standalone package use the same embedded art.
  // Accessible title text is present before image decode and remains on failure.
  const apply=()=>{
    const im=K.ImageArt.images.brandWordmark;if(!im)return;
    document.documentElement.style.setProperty('--brand-wordmark','url("'+im.src+'")');
    document.documentElement.classList.add('brand-art-ready');
  };
  const unsubscribe=K.ImageArt.subscribe(()=>{if(K.ImageArt.images.brandWordmark){apply();unsubscribe();}});
  K.Brand.ready=K.ImageArt.load(['brandWordmark']).then(apply);
  K.Brand.ready.catch(()=>{});
})(globalThis.Kong ||= {});
