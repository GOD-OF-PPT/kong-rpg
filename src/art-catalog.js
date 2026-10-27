(function(K){
  'use strict';
  // The renderer and packaging checks read the same source rectangles. New
  // assets cannot hide behind a second, independently maintained QA manifest.
  const run=[
    {r:[12,220,341,330],a:[257,548]},{r:[370,220,323,330],a:[600,548]},
    {r:[716,220,321,330],a:[944,548]},{r:[1074,220,363,330],a:[1335,548]},
    {r:[1446,220,332,330],a:[1684,548]},{r:[1808,220,310,330],a:[2025,548]}
  ];
  const hero={
    idle:{r:[85,40,280,405],a:[218,427]},run:{r:[430,90,400,355],a:[664,426]},
    jump:{r:[905,60,400,360],a:[1108,384]},fall:{r:[1365,90,390,360],a:[1564,443]},
    windup:{r:[30,465,395,370],a:[248,815]},attack:{r:[430,490,550,345],a:[651,816]},
    heavy:{r:[430,490,550,345],a:[651,816]},recover:{r:[980,495,393,340],a:[1118,816]},
    hurt:{r:[1380,510,370,325],a:[1554,816]},death:{r:[1380,510,370,325],a:[1554,816]},
    dash:{r:[430,90,400,355],a:[664,426]}
  };
  const enemies={
    blade:[{r:[0,60,420,395],a:[238,447]},{r:[25,460,395,405],a:[245,852]}],
    shield:[{r:[460,25,442,430],a:[688,447]},{r:[465,457,437,408],a:[688,852]}],
    caster:[{r:[925,15,400,433],a:[1115,435]},{r:[920,450,405,405],a:[1115,840]}],
    boss:[{r:[1350,0,410,453],a:[1558,447]},{r:[1335,447,439,420],a:[1560,852]}]
  };
  const combo=[
    {r:[0,65,385,350],a:[202,401]},{r:[390,65,537,350],a:[600,401]},{r:[930,65,324,350],a:[1085,401]},
    {r:[0,440,390,390],a:[205,819]},{r:[390,435,500,395],a:[600,819]},{r:[895,430,359,400],a:[1080,819]},
    {r:[0,832,423,365],a:[202,1189]},{r:[425,855,477,342],a:[603,1189]},{r:[902,855,352,342],a:[1082,1189]}
  ];
  const guardians=[
    [{r:[33,85,399,297],a:[270,378]},{r:[94,430,356,375],a:[274,800]}],
    [{r:[485,90,385,292],a:[675,378]},{r:[500,452,384,354],a:[690,800]}],
    [{r:[885,82,325,300],a:[1076,378]},{r:[940,486,290,320],a:[1090,800]}]
  ];
  const props={seal:{r:[75,188,620,495]},lamp:{r:[850,210,410,473]},gate:{r:[1390,25,765,658]}};
  const nodes=[{r:[0,0,690,724]},{r:[700,0,710,724]},{r:[1420,0,752,724]}];
  const dialog={scroll:{image:'uiScroll',r:[172,110,680,1390]},folio:{image:'uiFolio',r:[0,0,1860,846]},
    wukong:{image:'wukong',r:[85,40,280,405]},nezha:{image:'nezhaPortrait',r:[15,193,325,433]},
    lamp:{image:'props',r:[850,210,410,473]}};
  const icons=['cloud','echo','staff','mirror','flame','mercy','rest','crest'].map((id,i)=>({id,r:[i%4*384,Math.floor(i/4)*512,384,512]}));
  const nezha=Array.from({length:6},(_,i)=>({r:[i*128,0,128,128]}));
  const impacts=Array.from({length:16},(_,i)=>({r:[i%4*313.5,Math.floor(i/4)*313.5,313.5,313.5]}));
  const stone={r:[90,250,1990,260]};
  K.ArtCatalog={run,hero,enemies,combo,guardians,props,nodes,dialog,icons,nezha,impacts,stone};
  const frames={};const add=(name,image,f)=>{frames[name]={image,...f};};
  for(const [name,f]of Object.entries(hero))add('wukong-'+name,'wukong',f);
  run.forEach((f,i)=>add('run-'+i,'run',f));
  for(const [kind,list]of Object.entries(enemies))list.forEach((f,i)=>add(kind+'-'+i,'enemies',f));
  combo.forEach((f,i)=>add('combo-'+i,'combo',f));guardians.forEach((row,i)=>row.forEach((f,j)=>add('guardian-'+i+'-'+j,'guardians',f)));
  for(const [name,f]of Object.entries(props))add('prop-'+name,'props',f);
  nodes.forEach((f,i)=>{add('node-'+i,'nodes',f);add('node-done-'+i,'nodesDone',f);});
  for(const [name,f]of Object.entries(dialog))add('dialog-'+name,f.image,f);
  icons.forEach(f=>add('icon-'+f.id,'uiIcons',f));nezha.forEach((f,i)=>add('nezha-'+i,'nezha',f));impacts.forEach((f,i)=>add('impact-'+i,'impacts',f));
  add('stone','stone',stone);K.ArtFrames=frames;
})(globalThis.Kong ||= {});
