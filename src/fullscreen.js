(function(K){
  'use strict';
  K.setupFullscreen=function(notice){
    const app=document.getElementById('app'),button=document.getElementById('fullscreen'),label=document.getElementById('fullscreen-label');
    let fallback=false,busy=false;
    const native=()=>document.fullscreenElement===app;
    function update(){
      const active=native()||fallback;app.classList.toggle('game-fullscreen',active);
      label.textContent=active?'退出全屏':'全屏';
      button.setAttribute('aria-label',active?'退出全屏':'全屏游戏');button.setAttribute('aria-pressed',String(active));
      button.title=active?'退出全屏（F10 / Esc）':'全屏游戏（F10）';button.disabled=busy;
    }
    function restoreFocus(){
      if(document.getElementById('stage').dataset.mode==='playing')document.getElementById('world').focus({preventScroll:true});
    }
    async function toggle(){
      if(busy)return;busy=true;update();
      try{
        if(native())await document.exitFullscreen();
        else if(fallback)fallback=false;
        else{
          try{
            if(!document.fullscreenEnabled||!app.requestFullscreen)throw Error('Fullscreen unavailable');
            await app.requestFullscreen();
          }catch{
            fallback=true;notice('当前环境不允许浏览器全屏，已铺满窗口。按 F10 或 Esc 返回。',4);
          }
        }
      }catch{notice('全屏切换未完成，请再试一次。',3);}
      finally{busy=false;update();restoreFocus();}
    }
    button.addEventListener('click',toggle);
    document.addEventListener('fullscreenchange',()=>{if(native())fallback=false;update();restoreFocus();});
    window.addEventListener('keydown',event=>{
      if(event.ctrlKey||event.metaKey||event.altKey)return;
      if(event.code==='F10'){
        event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)toggle();
      }else if(event.code==='Escape'&&fallback){
        event.preventDefault();event.stopImmediatePropagation();fallback=false;update();restoreFocus();
      }else if(event.code==='Escape'&&native()){
        event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)toggle();
      }
    },true);
    update();
  };
})(globalThis.Kong ||= {});
