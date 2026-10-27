(function(K){
  'use strict';
  // Atlas extraction only: keep original generated PNGs and their transparency.
  K.DialogArtReady=K.ImageArt.ready.then(()=>{
    const root=document.documentElement;
    function crop(image,box,w,h,exclude){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(image,...box,0,0,w,h);if(exclude)x.clearRect(...exclude);return 'url("'+c.toDataURL()+'")';}
    const scroll=K.ImageArt.images.uiScroll,icons=K.ImageArt.images.uiIcons;
    if(scroll)root.style.setProperty('--scroll-art',crop(scroll,[172,110,680,1390],340,695));
    if(icons)['cloud','echo','staff','mirror','flame','mercy','rest','crest'].forEach((id,i)=>root.style.setProperty('--icon-'+id,crop(icons,[i%4*384,Math.floor(i/4)*512,384,512],144,192)));
    const folio=K.ImageArt.images.uiFolio;if(folio)root.style.setProperty('--folio-art',crop(folio,[0,0,folio.width,folio.height],930,423));
    K.DialogPortraits={};
    const hero=K.ImageArt.images.wukong;if(hero){K.DialogPortraits.wukong=crop(hero,[85,40,280,405],224,324);root.style.setProperty('--portrait-art',K.DialogPortraits.wukong);}
    // The neighboring run pose has a disconnected ribbon fragment in this
    // gutter; exclude that fragment, outside the idle figure's silhouette.
    const nezha=K.ImageArt.images.nezhaPortrait;if(nezha)K.DialogPortraits.nezha=crop(nezha,[15,193,325,433],260,346,[246,135,14,42]);
    const props=K.ImageArt.images.props;if(props)root.style.setProperty('--lamp-art',crop(props,[850,210,410,473],164,190));
  });
})(globalThis.Kong ||= {});
