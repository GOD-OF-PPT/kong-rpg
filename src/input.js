(function(K){
  'use strict';
  K.Input=class{
    constructor(canvas,onControl,onInput){this.keys=new Set();this.pressed=new Set();this.mouse=false;this.aimFace=0;this.aimPoint=null;this.active=false;this.onControl=onControl;this.combatButtons=new Set();this.suppressClick=false;
      window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(e.code==='Escape'){e.preventDefault();if(!e.repeat)onControl('pause');return;}if(this.active&&e.code==='KeyB'){e.preventDefault();if(!e.repeat)onControl('build');return;}if(!this.active)return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','KeyJ','KeyK','KeyL','KeyF','KeyR','KeyQ','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();if(!this.keys.has(e.code)){this.pressed.add(e.code);onInput(e.timeStamp,e.code);}this.keys.add(e.code);}});
      window.addEventListener('keyup',e=>this.keys.delete(e.code));
      // Enter DOM navigation through pause, never leave combat running behind focus.
      window.addEventListener('keydown',e=>{if(this.active&&e.code==='Tab'){e.preventDefault();this.clear();onControl('pause');}});
      // A release from combat must not become a click on a newly opened dialog.
      window.addEventListener('pointerdown',()=>{this.suppressClick=false;},true);
      canvas.addEventListener('pointerdown',e=>{if(!this.active)return;e.preventDefault();this.combatButtons.add(e.button);canvas.focus({preventScroll:true});this.aimFace=K.pointerFace?K.pointerFace(e.clientX):0;this.aimPoint=K.pointerPoint?K.pointerPoint(e.clientX,e.clientY):null;if(e.button===0){this.mouse=true;this.pressed.add('MouseLeft');onInput(e.timeStamp,'MouseLeft');}if(e.button===2){this.pressed.add('KeyL');onInput(e.timeStamp,'MouseRight');}});
      window.addEventListener('pointerup',e=>{if(this.combatButtons.delete(e.button)&&!this.active)this.suppressClick=true;this.mouse=false;},true);
      window.addEventListener('pointercancel',()=>{this.combatButtons.clear();this.mouse=false;},true);
      window.addEventListener('click',e=>{if(this.suppressClick&&e.detail>0){this.suppressClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
      window.addEventListener('contextmenu',e=>{if(this.suppressClick){this.suppressClick=false;e.preventDefault();}},true);canvas.addEventListener('contextmenu',e=>e.preventDefault());
      canvas.addEventListener('pointermove',e=>{if(this.active&&this.mouse){this.aimFace=K.pointerFace?K.pointerFace(e.clientX):0;this.aimPoint=K.pointerPoint?K.pointerPoint(e.clientX,e.clientY):null;}});
      window.addEventListener('blur',()=>{this.combatButtons.clear();this.suppressClick=false;this.clear();onControl('blur');});document.addEventListener('visibilitychange',()=>{if(document.hidden){this.combatButtons.clear();this.suppressClick=false;this.clear();onControl('blur');}});
    }
    clear(){this.keys.clear();this.pressed.clear();this.mouse=false;this.aimFace=0;this.aimPoint=null;}
    setActive(v){if(v!==this.active)this.clear();this.active=v;}
    read(){const k=(...ks)=>ks.some(q=>this.keys.has(q)),p=(...ks)=>ks.some(q=>this.pressed.has(q));const a={left:k('KeyA','ArrowLeft'),right:k('KeyD','ArrowRight'),down:k('KeyS','ArrowDown'),jump:k('Space','KeyW','ArrowUp'),jumpPressed:p('Space','KeyW','ArrowUp'),attack:k('KeyJ')||p('KeyJ','MouseLeft')||this.mouse,attackPressed:p('KeyJ','MouseLeft'),dashPressed:p('KeyK','ShiftLeft','ShiftRight'),clonePressed:p('KeyL'),interactPressed:p('KeyF'),ultimatePressed:p('KeyR'),talismanPressed:p('KeyQ'),aimPoint:this.mouse||p('MouseLeft')?this.aimPoint:null,aimFace:this.mouse||p('MouseLeft')?this.aimFace:0};this.pressed.clear();return a;}
  };
})(globalThis.Kong ||= {});
